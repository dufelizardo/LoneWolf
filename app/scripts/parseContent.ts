import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import type { Section, Choice, CombatEncounter, RandomRange, SectionMap } from '../src/data/section-types.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = process.env.LW_CONTENT_DIR ?? join(__dirname, '../../kai/ft/en/xhtml/lw/01fftd');
const OUT_FILE = join(__dirname, '../src/data/sections.json');
const ILLUSTRATIONS_OUT_DIR = join(__dirname, '../public/illustrations');
const SECTION_COUNT = 350;

const ALLOWED_TAGS = new Set(['p', 'span', 'figure', 'img', 'em', 'strong', 'br', 'a']);

function normalizeText(text: string): string {
  return text.replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
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

function parseSectionFile(num: number): Section {
  const filePath = join(CONTENT_DIR, `sect${num}.htm`);
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

  const illustrations: string[] = [];
  clone.find('figure img').each((_, el) => {
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

  const fullText = container.text();
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
  const isEnding = choices.length === 0 && !isDeadEnd;

  if (choices.length === 0 && !isDeadEnd && !isEnding) {
    parserWarning = (parserWarning ? parserWarning + '; ' : '') + 'no choices found and not marked as deadend/ending';
  }

  return {
    number: num,
    bodyHtml,
    illustrations,
    combats,
    choices,
    isDeadEnd,
    isEnding,
    randomNumberBranch,
    ranges,
    parserWarning,
  };
}

function copyIllustrations(sections: SectionMap) {
  if (!existsSync(ILLUSTRATIONS_OUT_DIR)) mkdirSync(ILLUSTRATIONS_OUT_DIR, { recursive: true });
  const seen = new Set<string>();
  for (const section of Object.values(sections)) {
    for (const filename of section.illustrations) {
      if (seen.has(filename)) continue;
      seen.add(filename);
      const src = join(CONTENT_DIR, filename);
      const dest = join(ILLUSTRATIONS_OUT_DIR, filename);
      if (existsSync(src)) copyFileSync(src, dest);
      else console.warn(`[parseContent] illustration not found: ${filename}`);
    }
  }
}

function main() {
  if (!existsSync(CONTENT_DIR)) {
    console.error(`Content directory not found: ${CONTENT_DIR}`);
    process.exit(1);
  }

  const sections: SectionMap = {};
  const warnings: string[] = [];

  for (let i = 1; i <= SECTION_COUNT; i++) {
    const section = parseSectionFile(i);
    sections[i] = section;
    if (section.parserWarning) warnings.push(`sect${i}: ${section.parserWarning}`);
  }

  copyIllustrations(sections);

  writeFileSync(OUT_FILE, JSON.stringify(sections, null, 2), 'utf-8');

  console.log(`Parsed ${Object.keys(sections).length} sections -> ${OUT_FILE}`);
  console.log(`${warnings.length} parser warning(s):`);
  for (const w of warnings) console.log(`  - ${w}`);
}

main();
