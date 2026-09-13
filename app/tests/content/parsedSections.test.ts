import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { SectionMap } from '../../src/data/section-types';
import { BOOKS } from '../../src/data/books';

function loadSections(bookId: string): SectionMap {
  return JSON.parse(readFileSync(join(__dirname, `../../src/data/sections.${bookId}.json`), 'utf-8'));
}

describe.each(BOOKS)('parsed sections for book "$id" ($title)', (book) => {
  const sections = loadSections(book.id);

  it('has exactly 350 sections, all present', () => {
    expect(Object.keys(sections)).toHaveLength(350);
    for (let i = 1; i <= 350; i++) {
      expect(sections[i]).toBeDefined();
    }
  });

  it('every choice and range target points at an existing section', () => {
    for (const section of Object.values(sections)) {
      for (const choice of section.choices) {
        expect(sections[choice.targetSection], `sect${section.number} -> ${choice.targetSection}`).toBeDefined();
      }
      for (const range of section.ranges ?? []) {
        expect(sections[range.targetSection], `sect${section.number} range -> ${range.targetSection}`).toBeDefined();
      }
    }
  });

  it('every section has choices, or is a dead end, or is the ending', () => {
    for (const section of Object.values(sections)) {
      expect(section.choices.length > 0 || section.isDeadEnd || section.isEnding).toBe(true);
    }
  });

  it('has at least one dead end and exactly one ending', () => {
    const deadEndCount = Object.values(sections).filter((s) => s.isDeadEnd).length;
    const endingCount = Object.values(sections).filter((s) => s.isEnding).length;
    expect(deadEndCount).toBeGreaterThanOrEqual(1);
    expect(endingCount).toBe(1);
  });
});

describe('book 1 (Flight from the Dark) spot-checks', () => {
  const sections = loadSections('ft');

  it('matches known spot-checks from the implementation plan', () => {
    expect(sections[112].combats).toHaveLength(2);
    expect(sections[253].combats).toHaveLength(4);
    expect(sections[17].ranges).toEqual([
      { min: 0, max: 0, targetSection: 53 },
      { min: 1, max: 2, targetSection: 274 },
      { min: 3, max: 9, targetSection: 316 },
    ]);
    expect(sections[21].parserWarning).not.toBeNull();
    expect(sections[350].isEnding).toBe(true);

    const deadEndCount = Object.values(sections).filter((s) => s.isDeadEnd).length;
    expect(deadEndCount).toBeGreaterThanOrEqual(16);
  });
});
