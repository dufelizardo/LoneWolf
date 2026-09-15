import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import type { Section, Choice, CombatEncounter, RandomRange, SectionMap } from '../src/data/section-types.ts';
import { BOOKS, type BookMeta, type ContentRoot } from '../src/data/books.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_ROOTS: Record<ContentRoot, string> = {
  kai: process.env.LW_KAI_ROOT ?? join(__dirname, '../../kai'),
  magnakai: process.env.LW_MAGNAKAI_ROOT ?? join(__dirname, '../../magnakai'),
  grand_master: process.env.LW_GRAND_MASTER_ROOT ?? join(__dirname, '../../grand_master'),
  new_order: process.env.LW_NEW_ORDER_ROOT ?? join(__dirname, '../../new_order'),
  world_of_lone_wolf: process.env.LW_WORLD_ROOT ?? join(__dirname, '../../world_of_lone_wolf'),
};
const DATA_DIR = join(__dirname, '../src/data');
const ILLUSTRATIONS_ROOT = join(__dirname, '../public/illustrations');

function contentDirFor(book: BookMeta): string {
  return join(
    CONTENT_ROOTS[book.contentRoot],
    book.contentDirName ?? book.id,
    'en',
    'xhtml',
    book.contentCodeSegment ?? 'lw',
    book.code,
  );
}

// blockquote/ul/li/dl/dt/dd added for Grey Star the Wizard (world_of_lone_wolf), whose sections use
// them for real structure (e.g. a closing riddle, shopping lists) that every Lone Wolf-series book so
// far has gotten away without - a strictly more permissive superset, safe for every existing book.
const ALLOWED_TAGS = new Set(['p', 'span', 'figure', 'img', 'em', 'strong', 'br', 'a', 'blockquote', 'ul', 'li', 'dl', 'dt', 'dd']);

function normalizeText(text: string): string {
  return text.replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeDashes(text: string): string {
  return text.replace(/&ndash;|&mdash;|[‒–—−]/g, '-');
}

function sanitizeBodyHtml($: cheerio.CheerioAPI, container: cheerio.Cheerio<any>): string {
  container.find('*').each((_, el) => {
    const $el = $(el);
    const tag = (el as any).tagName?.toLowerCase();
    if (!tag) return;
    if (!ALLOWED_TAGS.has(tag)) {
      $el.replaceWith($el.html() ?? $el.text());
      return;
    }
    const attribs = { ...(el as any).attribs } as Record<string, string>;
    for (const name of Object.keys(attribs)) {
      const keep =
        (tag === 'img' && (name === 'src' || name === 'alt' || name === 'class')) ||
        (tag === 'a' && name === 'href') ||
        (tag === 'span' && name === 'class') ||
        (tag === 'figure' && name === 'class');
      if (!keep) $el.removeAttr(name);
    }
  });
  return container.html() ?? '';
}

function parseCombatText(raw: string): CombatEncounter | null {
  const text = normalizeText(raw);
  const match = text.match(/^(.*?):\s*COMBAT SKILL\s*(\d+)\s*ENDURANCE\s*(\d+)$/i);
  if (!match) return null;
  return {
    enemyName: match[1].trim(),
    combatSkill: parseInt(match[2], 10),
    endurance: parseInt(match[3], 10),
  };
}

function parseSectionHref(href: string | undefined): number | null {
  if (!href) return null;
  const match = href.match(/sect(\d+)\.htm/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Best-effort extraction of a 0-9 range from a single choice's narrative text.
 * Returns null when the phrasing doesn't match a known pattern (nested/nested-conditional
 * prompts like sect21 fall through here on purpose).
 */
function extractRange(rawText: string): { min: number; max: number } | null {
  const text = normalizeDashes(rawText);

  let m = text.match(/\b(\d)\s*-\s*(\d)\b/);
  if (m) return { min: parseInt(m[1], 10), max: parseInt(m[2], 10) };

  m = text.match(/\b(\d)\s+or\s+(?:lower|below|less)\b/i);
  if (m) return { min: 0, max: parseInt(m[1], 10) };

  m = text.match(/\b(\d)\s+or\s+(?:higher|above|more|greater)\b/i);
  if (m) return { min: parseInt(m[1], 10), max: 9 };

  m = text.match(/\bbelow\s+(\d)\b/i);
  if (m) return { min: 0, max: parseInt(m[1], 10) - 1 };

  m = text.match(/\babove\s+(\d)\b/i);
  if (m) return { min: parseInt(m[1], 10) + 1, max: 9 };

  m = text.match(/\b(?:pick(?:ed)?|chosen|is)\s+(?:a\s+|the\s+number\s+)?(\d)\b(?!\s*-)/i);
  if (m) return { min: parseInt(m[1], 10), max: parseInt(m[1], 10) };

  return null;
}

function tryParseRandomRanges(choices: { text: string; targetSection: number }[]): RandomRange[] | null {
  const ranges: RandomRange[] = [];
  for (const choice of choices) {
    const range = extractRange(choice.text);
    if (!range || range.min > range.max || range.min < 0 || range.max > 9) return null;
    ranges.push({ min: range.min, max: range.max, targetSection: choice.targetSection });
  }
  const covered = new Set<number>();
  for (const r of ranges) {
    for (let i = r.min; i <= r.max; i++) {
      if (covered.has(i)) return null; // overlap
      covered.add(i);
    }
  }
  if (covered.size !== 10) return null; // gap
  return ranges;
}

function parseSectionFile(contentDir: string, num: number): Section {
  const filePath = join(contentDir, `sect${num}.htm`);
  const html = readFileSync(filePath, 'utf-8');
  const $ = cheerio.load(html, { xmlMode: false });

  const container = $('div.maintext').first();
  const clone = container.clone();

  clone.find('h3').remove();
  const combatParagraphs = clone.find('p.combat');
  const combats: CombatEncounter[] = [];
  combatParagraphs.each((_, el) => {
    const parsed = parseCombatText($(el).text());
    if (parsed) combats.push(parsed);
  });
  combatParagraphs.remove();

  const isDeadEnd = clone.find('p.deadend').length > 0;
  // Reader-solved puzzles (e.g. sect58/sect331 in Shadow on the Sand) use <p class="puzzle"> and
  // link to part1.htm/part2.htm (the printed book's table of contents) instead of a sect*.htm
  // target, so no choice gets extracted below — without this flag they'd be misread as endings.
  const hasPuzzle = clone.find('p.puzzle').length > 0;

  const illustrations: string[] = [];
  // Modern Lone Wolf-series books mark real illustrations with <figure><img/></figure>. Grey Star the
  // Wizard (world_of_lone_wolf) instead wraps a bordered <table> in <div class="illustration">, with
  // decorative border-tile <img>s (alt="") alongside the real illustration, which alone carries the
  // literal alt text "[illustration]" (with brackets) - that's what distinguishes it from the tiles.
  clone.find('figure img, div.illustration img[alt="[illustration]"]').each((_, el) => {
    const src = $(el).attr('src');
    if (src) illustrations.push(src);
  });

  const choicesRaw: { text: string; targetSection: number }[] = [];
  clone.find('p.choice').each((_, el) => {
    const $el = $(el);
    const link = $el.find('a[href^="sect"]').first();
    const target = parseSectionHref(link.attr('href'));
    if (target !== null) {
      choicesRaw.push({ text: normalizeText($el.text()), targetSection: target });
    }
  });
  clone.find('p.choice').remove();
  clone.find('p.deadend').remove();

  const bodyHtml = sanitizeBodyHtml($, clone);

  const randomNumberBranch = container.find('a[href="random.htm"]').length > 0;

  let ranges: RandomRange[] | null = null;
  let parserWarning: string | null = null;
  if (randomNumberBranch) {
    ranges = tryParseRandomRanges(choicesRaw);
    if (!ranges) {
      parserWarning = 'irregular random-branch phrasing, manual choice required';
    }
  }

  const choices: Choice[] = choicesRaw.map((c) => ({ text: c.text, targetSection: c.targetSection }));
  const isEnding = choices.length === 0 && !isDeadEnd && !hasPuzzle;

  if (hasPuzzle) {
    parserWarning = (parserWarning ? parserWarning + '; ' : '') + 'puzzle section, manual section entry required';
  }

  return {
    number: num,
    bodyHtml,
    illustrations,
    combats,
    choices,
    isDeadEnd,
    isEnding,
    hasPuzzle,
    randomNumberBranch,
    ranges,
    parserWarning,
  };
}

function parseIntroFile(contentDir: string, filename: string): string {
  const filePath = join(contentDir, filename);
  const html = readFileSync(filePath, 'utf-8');
  const $ = cheerio.load(html, { xmlMode: false });
  const container = $('div.maintext').first();
  const clone = container.clone();
  clone.find('h2, h3').remove();
  return sanitizeBodyHtml($, clone);
}

function parseStorySoFar(contentDir: string, book: BookMeta): string {
  // Grey Star the Wizard (world_of_lone_wolf) has an earlier frontmatter page ("Of the Coming of
  // Grey Star") before tssf.htm - every other book's tssf.htm is the sole intro page.
  const extra = book.extraIntroFile ? parseIntroFile(contentDir, book.extraIntroFile) : '';
  return extra + parseIntroFile(contentDir, 'tssf.htm');
}

function copyIllustrations(contentDir: string, outDir: string, sections: SectionMap) {
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const seen = new Set<string>();
  for (const section of Object.values(sections)) {
    for (const filename of section.illustrations) {
      if (seen.has(filename)) continue;
      seen.add(filename);
      const src = join(contentDir, filename);
      const dest = join(outDir, filename);
      if (existsSync(src)) copyFileSync(src, dest);
      else console.warn(`[parseContent] illustration not found: ${filename}`);
    }
  }
}

function parseBook(book: BookMeta): { warnings: string[] } {
  const contentDir = contentDirFor(book);
  if (!existsSync(contentDir)) {
    console.error(`Content directory not found for book "${book.id}": ${contentDir}`);
    process.exit(1);
  }

  const sections: SectionMap = {};
  const warnings: string[] = [];

  for (let i = 1; i <= book.sectionCount; i++) {
    const section = parseSectionFile(contentDir, i);
    sections[i] = section;
    if (section.parserWarning) warnings.push(`sect${i}: ${section.parserWarning}`);
  }

  copyIllustrations(contentDir, join(ILLUSTRATIONS_ROOT, book.id), sections);

  const outFile = join(DATA_DIR, `sections.${book.id}.json`);
  writeFileSync(outFile, JSON.stringify(sections, null, 2), 'utf-8');
  console.log(`[${book.id}] Parsed ${Object.keys(sections).length} sections -> ${outFile}`);

  return { warnings };
}

function main() {
  const bookIntros: Record<string, { html: string }> = {};
  let totalWarnings = 0;

  for (const book of BOOKS) {
    const { warnings } = parseBook(book);
    bookIntros[book.id] = { html: parseStorySoFar(contentDirFor(book), book) };

    console.log(`[${book.id}] ${warnings.length} parser warning(s):`);
    for (const w of warnings) console.log(`  - ${w}`);
    totalWarnings += warnings.length;
  }

  const introsFile = join(DATA_DIR, 'book-intros.json');
  writeFileSync(introsFile, JSON.stringify(bookIntros, null, 2), 'utf-8');
  console.log(`Wrote book intros -> ${introsFile}`);
  console.log(`Total parser warnings across all books: ${totalWarnings}`);
}

main();
