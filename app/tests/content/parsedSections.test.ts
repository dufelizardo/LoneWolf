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

  it('has exactly sectionCount sections, all present', () => {
    expect(Object.keys(sections)).toHaveLength(book.sectionCount);
    for (let i = 1; i <= book.sectionCount; i++) {
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

  it('every section has choices, or is a dead end, or is the ending, or is a reader-solved puzzle', () => {
    for (const section of Object.values(sections)) {
      expect(section.choices.length > 0 || section.isDeadEnd || section.isEnding || section.hasPuzzle).toBe(true);
    }
  });

  it('has at least one dead end, and marks the canonical final section as an ending', () => {
    const deadEndCount = Object.values(sections).filter((s) => s.isDeadEnd).length;
    const endingCount = Object.values(sections).filter((s) => s.isEnding).length;
    expect(deadEndCount).toBeGreaterThanOrEqual(1);
    expect(endingCount).toBeGreaterThanOrEqual(1);
    expect(sections[book.finalSection]?.isEnding).toBe(true);
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

describe('book 5 (Shadow on the Sand) puzzle sections', () => {
  const sections = loadSections('ss');

  it('flags sect58 and sect331 as puzzles instead of misreading them as endings', () => {
    // Both use <p class="puzzle"> linking to part1.htm/part2.htm (the printed book's table of
    // contents) instead of a normal sect*.htm choice, so the parser can't extract a target — without
    // hasPuzzle they'd be misclassified as isEnding (0 choices, not a dead end).
    for (const num of [58, 331]) {
      expect(sections[num].hasPuzzle, `sect${num}`).toBe(true);
      expect(sections[num].isEnding, `sect${num}`).toBe(false);
    }
    // sect331's only path forward is the puzzle (no regular choices at all); sect58 mixes the
    // puzzle option with two regular choices (wrong combination / give up).
    expect(sections[331].choices).toHaveLength(0);
    expect(sections[58].choices.length).toBeGreaterThan(0);
  });

  it('has exactly one real ending, at the canonical final section (400)', () => {
    const endings = Object.values(sections).filter((s) => s.isEnding).map((s) => s.number);
    expect(endings).toEqual([400]);
  });
});

describe('book 7 (Castle Death) puzzle sections', () => {
  const sections = loadSections('cd');

  it('flags sect100 and sect306 as puzzles instead of misreading them as endings', () => {
    // Same <p class="puzzle"> pattern as Book 5 (Shadow on the Sand), linking to a table-of-contents
    // page instead of a normal sect*.htm choice.
    for (const num of [100, 306]) {
      expect(sections[num].hasPuzzle, `sect${num}`).toBe(true);
      expect(sections[num].isEnding, `sect${num}`).toBe(false);
      // Both mix the puzzle option with one regular choice.
      expect(sections[num].choices.length).toBeGreaterThan(0);
    }
  });

  it('has exactly one real ending, at the canonical final section (350)', () => {
    const endings = Object.values(sections).filter((s) => s.isEnding).map((s) => s.number);
    expect(endings).toEqual([350]);
  });
});

describe('book 8 (The Jungle of Horrors) puzzle sections', () => {
  const sections = loadSections('tjh');

  it('flags sect112, sect126, sect141 and sect338 as puzzles, each with a real fallback choice', () => {
    // Unlike Book 5/7's puzzle sections, each of these also has a normal class="choice" fallback
    // link for players who can't/won't solve the riddle, so none of them are ever zero-choice.
    for (const num of [112, 126, 141, 338]) {
      expect(sections[num].hasPuzzle, `sect${num}`).toBe(true);
      expect(sections[num].isEnding, `sect${num}`).toBe(false);
      expect(sections[num].choices.length).toBeGreaterThan(0);
    }
  });

  it('has exactly one real ending, at the canonical final section (350)', () => {
    const endings = Object.values(sections).filter((s) => s.isEnding).map((s) => s.number);
    expect(endings).toEqual([350]);
  });
});

describe('book 9 (The Cauldron of Fear) puzzle sections', () => {
  const sections = loadSections('tcf');

  it('flags sect115, sect204 and sect241 as puzzles, each with a real fallback choice', () => {
    // Same pattern as Book 8: each puzzle also has a normal class="choice" fallback link.
    for (const num of [115, 204, 241]) {
      expect(sections[num].hasPuzzle, `sect${num}`).toBe(true);
      expect(sections[num].isEnding, `sect${num}`).toBe(false);
      expect(sections[num].choices.length).toBeGreaterThan(0);
    }
  });

  it('has exactly one real ending, at the canonical final section (350)', () => {
    const endings = Object.values(sections).filter((s) => s.isEnding).map((s) => s.number);
    expect(endings).toEqual([350]);
  });
});

describe('book 13 (The Plague Lords of Ruel) puzzle sections', () => {
  const sections = loadSections('tplr');

  it('flags sect48, sect158 and sect227 as puzzles, each with a real fallback choice', () => {
    for (const num of [48, 158, 227]) {
      expect(sections[num].hasPuzzle, `sect${num}`).toBe(true);
      expect(sections[num].isEnding, `sect${num}`).toBe(false);
      expect(sections[num].choices.length).toBeGreaterThan(0);
    }
  });

  it('has exactly one real ending, at the canonical final section (350), forward-linking to Book 14', () => {
    const endings = Object.values(sections).filter((s) => s.isEnding).map((s) => s.number);
    expect(endings).toEqual([350]);
  });
});

describe('book 14 (The Captives of Kaag) puzzle sections', () => {
  const sections = loadSections('tcok');

  it('flags sect127, sect181, sect220 and sect319 as puzzles, each with a real fallback choice', () => {
    for (const num of [127, 181, 220, 319]) {
      expect(sections[num].hasPuzzle, `sect${num}`).toBe(true);
      expect(sections[num].isEnding, `sect${num}`).toBe(false);
      expect(sections[num].choices.length).toBeGreaterThan(0);
    }
  });

  it('has exactly one real ending, at the canonical final section (350), forward-linking to Book 15', () => {
    const endings = Object.values(sections).filter((s) => s.isEnding).map((s) => s.number);
    expect(endings).toEqual([350]);
  });
});

describe('book 15 (The Darke Crusade) puzzle sections', () => {
  const sections = loadSections('tdc');

  it('flags sect89 and sect221 as puzzles, each with a real fallback choice', () => {
    for (const num of [89, 221]) {
      expect(sections[num].hasPuzzle, `sect${num}`).toBe(true);
      expect(sections[num].isEnding, `sect${num}`).toBe(false);
      expect(sections[num].choices.length).toBeGreaterThan(0);
    }
  });

  it('has exactly one real ending, at the canonical final section (350), forward-linking to Book 16', () => {
    const endings = Object.values(sections).filter((s) => s.isEnding).map((s) => s.number);
    expect(endings).toEqual([350]);
  });
});

describe('book 16 (The Legacy of Vashna) puzzle sections', () => {
  const sections = loadSections('tlv');

  it('flags sect164, sect189 and sect235 as puzzles, each with a real fallback choice', () => {
    for (const num of [164, 189, 235]) {
      expect(sections[num].hasPuzzle, `sect${num}`).toBe(true);
      expect(sections[num].isEnding, `sect${num}`).toBe(false);
      expect(sections[num].choices.length).toBeGreaterThan(0);
    }
  });

  it('has exactly one real ending, at the canonical final section (350), forward-linking to Book 17', () => {
    const endings = Object.values(sections).filter((s) => s.isEnding).map((s) => s.number);
    expect(endings).toEqual([350]);
  });

  it('has exactly the 7 known dead-end sections', () => {
    const deadEnds = Object.values(sections).filter((s) => s.isDeadEnd).map((s) => s.number).sort((a, b) => a - b);
    expect(deadEnds).toEqual([43, 96, 134, 141, 160, 313, 322]);
  });
});
