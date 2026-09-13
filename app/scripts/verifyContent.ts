import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SectionMap } from '../src/data/section-types.ts';
import { BOOKS, type BookMeta } from '../src/data/books.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../src/data');

const failures: string[] = [];
const check = (cond: boolean, message: string) => {
  if (!cond) failures.push(message);
};

function verifyBook(book: BookMeta, sections: SectionMap) {
  const bookId = book.id;
  const keys = Object.keys(sections).map(Number);

  check(keys.length === book.sectionCount, `[${bookId}] expected ${book.sectionCount} sections, got ${keys.length}`);
  for (let i = 1; i <= book.sectionCount; i++) {
    check(sections[i] !== undefined, `[${bookId}] missing section ${i}`);
  }

  for (const section of Object.values(sections)) {
    check(
      section.choices.length > 0 || section.isDeadEnd || section.isEnding || section.hasPuzzle,
      `[${bookId}] section ${section.number} has no choices and is not deadend/ending/puzzle`,
    );
    for (const choice of section.choices) {
      check(
        sections[choice.targetSection] !== undefined,
        `[${bookId}] section ${section.number} choice targets missing section ${choice.targetSection}`,
      );
    }
    if (section.ranges) {
      for (const range of section.ranges) {
        check(
          sections[range.targetSection] !== undefined,
          `[${bookId}] section ${section.number} range targets missing section ${range.targetSection}`,
        );
      }
    }
  }

  const deadEndCount = Object.values(sections).filter((s) => s.isDeadEnd).length;
  check(deadEndCount >= 1, `[${bookId}] expected at least 1 dead end, got ${deadEndCount}`);
  const endingCount = Object.values(sections).filter((s) => s.isEnding).length;
  check(endingCount >= 1, `[${bookId}] expected at least 1 ending section, got ${endingCount}`);
}

for (const book of BOOKS) {
  const file = join(DATA_DIR, `sections.${book.id}.json`);
  const sections: SectionMap = JSON.parse(readFileSync(file, 'utf-8'));
  verifyBook(book, sections);

  // Fixed spot checks specific to Book 1 (Flight from the Dark), from the original implementation plan.
  if (book.id === 'ft') {
    check(sections[112].combats.length === 2, 'sect112 should have 2 combats');
    check(sections[253].combats.length === 4, 'sect253 should have 4 combats');
    check(
      JSON.stringify(sections[17].ranges) ===
        JSON.stringify([
          { min: 0, max: 0, targetSection: 53 },
          { min: 1, max: 2, targetSection: 274 },
          { min: 3, max: 9, targetSection: 316 },
        ]),
      'sect17 ranges do not match expected 0/1-2/3-9 -> 53/274/316',
    );
    check(sections[21].parserWarning !== null, 'sect21 should be flagged with a parserWarning');
    const deadEndCount = Object.values(sections).filter((s) => s.isDeadEnd).length;
    check(deadEndCount >= 16, `expected at least 16 dead ends in ft, got ${deadEndCount}`);
    check(sections[350].isEnding === true, 'sect350 should be flagged as the ending');
  }
}

if (failures.length > 0) {
  console.error(`verifyContent: ${failures.length} check(s) failed:`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(`verifyContent: all checks passed for ${BOOKS.length} book(s).`);
