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

describe('book 17 (The Deathlord of Ixia) puzzle sections', () => {
  const sections = loadSections('tdi');

  it('flags sect69, sect213 and sect322 as puzzles, each with a real fallback choice', () => {
    for (const num of [69, 213, 322]) {
      expect(sections[num].hasPuzzle, `sect${num}`).toBe(true);
      expect(sections[num].isEnding, `sect${num}`).toBe(false);
      expect(sections[num].choices.length).toBeGreaterThan(0);
    }
  });

  it('has exactly one real ending, at the canonical final section (350), forward-linking to Book 18', () => {
    const endings = Object.values(sections).filter((s) => s.isEnding).map((s) => s.number);
    expect(endings).toEqual([350]);
  });

  it('has exactly the 16 known dead-end sections', () => {
    const deadEnds = Object.values(sections).filter((s) => s.isDeadEnd).map((s) => s.number).sort((a, b) => a - b);
    expect(deadEnds).toEqual([5, 55, 65, 72, 99, 134, 173, 178, 212, 215, 238, 257, 269, 316, 319, 328]);
  });
});

describe('book 18 (Dawn of the Dragons) sections', () => {
  const sections = loadSections('dd');

  it('has zero puzzle sections - the first Grand Master book without any', () => {
    const puzzles = Object.values(sections).filter((s) => s.hasPuzzle);
    expect(puzzles).toHaveLength(0);
  });

  it('has exactly one real ending, at the canonical final section (350), forward-linking to Book 19', () => {
    const endings = Object.values(sections).filter((s) => s.isEnding).map((s) => s.number);
    expect(endings).toEqual([350]);
  });

  it('has exactly the 9 known dead-end sections', () => {
    const deadEnds = Object.values(sections).filter((s) => s.isDeadEnd).map((s) => s.number).sort((a, b) => a - b);
    expect(deadEnds).toEqual([21, 53, 117, 218, 223, 224, 251, 258, 332]);
  });
});

describe('book 19 (Wolf\'s Bane) puzzle sections', () => {
  const sections = loadSections('wb');

  it('flags sect18, sect177, sect210, sect251, sect252 and sect320 as puzzles, each with a real fallback choice', () => {
    for (const num of [18, 177, 210, 251, 252, 320]) {
      expect(sections[num].hasPuzzle, `sect${num}`).toBe(true);
      expect(sections[num].isEnding, `sect${num}`).toBe(false);
      expect(sections[num].choices.length).toBeGreaterThan(0);
    }
  });

  it('has exactly one real ending, at the canonical final section (350), forward-linking to Book 20', () => {
    const endings = Object.values(sections).filter((s) => s.isEnding).map((s) => s.number);
    expect(endings).toEqual([350]);
  });

  it('has exactly the 9 known dead-end sections', () => {
    const deadEnds = Object.values(sections).filter((s) => s.isDeadEnd).map((s) => s.number).sort((a, b) => a - b);
    expect(deadEnds).toEqual([89, 93, 158, 221, 222, 242, 269, 301, 303]);
  });
});

describe('book 20 (The Curse of Naar) sections - final book of the Grand Master phase', () => {
  const sections = loadSections('tcn');

  it('flags sect239 as a puzzle with a real fallback choice', () => {
    expect(sections[239].hasPuzzle).toBe(true);
    expect(sections[239].isDeadEnd).toBe(false);
    expect(sections[239].choices.length).toBeGreaterThan(0);
  });

  it('flags sect297 and sect338 as puzzles that are ALSO dead ends with no fallback choice (new pattern: wrong/missing Special Items narrate a failure inline instead of linking to a separate dead-end section)', () => {
    for (const num of [297, 338]) {
      expect(sections[num].hasPuzzle, `sect${num}`).toBe(true);
      expect(sections[num].isDeadEnd, `sect${num}`).toBe(true);
      expect(sections[num].choices.length, `sect${num}`).toBe(0);
    }
  });

  it('has exactly one real ending, at the canonical final section (350) - the Grand Master series concludes here, forward-linking to Book 21 (a new phase, "New Order")', () => {
    const endings = Object.values(sections).filter((s) => s.isEnding).map((s) => s.number);
    expect(endings).toEqual([350]);
  });

  it('has exactly the 20 known dead-end sections', () => {
    const deadEnds = Object.values(sections).filter((s) => s.isDeadEnd).map((s) => s.number).sort((a, b) => a - b);
    expect(deadEnds).toEqual([13, 25, 55, 56, 96, 126, 128, 136, 171, 172, 189, 209, 231, 241, 262, 289, 297, 325, 338, 346]);
  });
});

describe('book 21 (Voyage of the Moonstone) sections - first book of the New Order phase', () => {
  const sections = loadSections('vm');

  it('flags sect40 and sect174 as puzzles, each with a real fallback choice', () => {
    for (const num of [40, 174]) {
      expect(sections[num].hasPuzzle, `sect${num}`).toBe(true);
      expect(sections[num].isDeadEnd, `sect${num}`).toBe(false);
      expect(sections[num].choices.length, `sect${num}`).toBeGreaterThan(0);
    }
  });

  it('has exactly one real ending, at the canonical final section (350), forward-linking to Book 22', () => {
    const endings = Object.values(sections).filter((s) => s.isEnding).map((s) => s.number);
    expect(endings).toEqual([350]);
  });

  it('has exactly the 4 known dead-end sections', () => {
    const deadEnds = Object.values(sections).filter((s) => s.isDeadEnd).map((s) => s.number).sort((a, b) => a - b);
    expect(deadEnds).toEqual([16, 18, 304, 320]);
  });
});

describe('book 22 (The Buccaneers of Shadaki) sections - second book of the New Order phase', () => {
  const sections = loadSections('tbs');

  it('flags sect2 and sect107 as puzzles, each with a real fallback choice', () => {
    for (const num of [2, 107]) {
      expect(sections[num].hasPuzzle, `sect${num}`).toBe(true);
      expect(sections[num].isDeadEnd, `sect${num}`).toBe(false);
      expect(sections[num].choices.length, `sect${num}`).toBeGreaterThan(0);
    }
  });

  it('has exactly one real ending, at the canonical final section (350), forward-linking to Book 23', () => {
    const endings = Object.values(sections).filter((s) => s.isEnding).map((s) => s.number);
    expect(endings).toEqual([350]);
  });

  it('has exactly the 9 known dead-end sections', () => {
    const deadEnds = Object.values(sections).filter((s) => s.isDeadEnd).map((s) => s.number).sort((a, b) => a - b);
    expect(deadEnds).toEqual([9, 27, 44, 158, 162, 236, 303, 316, 321]);
  });
});

describe('book 23 (Mydnight\'s Hero) sections - third book of the New Order phase', () => {
  const sections = loadSections('mh');

  it('flags sect113, sect178 and sect306 as puzzles, each with a real fallback choice', () => {
    for (const num of [113, 178, 306]) {
      expect(sections[num].hasPuzzle, `sect${num}`).toBe(true);
      expect(sections[num].isDeadEnd, `sect${num}`).toBe(false);
      expect(sections[num].choices.length, `sect${num}`).toBeGreaterThan(0);
    }
  });

  it('has exactly one real ending, at the canonical final section (350), forward-linking to Book 24', () => {
    const endings = Object.values(sections).filter((s) => s.isEnding).map((s) => s.number);
    expect(endings).toEqual([350]);
  });

  it('has exactly the 7 known dead-end sections', () => {
    const deadEnds = Object.values(sections).filter((s) => s.isDeadEnd).map((s) => s.number).sort((a, b) => a - b);
    expect(deadEnds).toEqual([36, 147, 162, 225, 319, 339, 343]);
  });
});

describe('book 24 (Rune War) sections - fourth book of the New Order phase', () => {
  const sections = loadSections('rw');

  it('flags sect148, sect158 and sect297 as puzzles, each with a real fallback choice', () => {
    for (const num of [148, 158, 297]) {
      expect(sections[num].hasPuzzle, `sect${num}`).toBe(true);
      expect(sections[num].isDeadEnd, `sect${num}`).toBe(false);
      expect(sections[num].choices.length, `sect${num}`).toBeGreaterThan(0);
    }
  });

  it('has exactly the 2 known dead-end sections (marked class="deadend" in the source)', () => {
    const deadEnds = Object.values(sections).filter((s) => s.isDeadEnd).map((s) => s.number).sort((a, b) => a - b);
    expect(deadEnds).toEqual([134, 229]);
  });

  it('has the canonical ending at the final section (350), plus 4 non-canonical "pyrrhic victory" sections (42, 111, 267, 300) where Lone Wolf dies after completing the mission - a source-content quirk (these lack the class="deadend" marker every other death section uses) already handled by GameScreen.tsx\'s existing "non-final ending -> treated as a death" fallback, same as tck sect61', () => {
    const endings = Object.values(sections).filter((s) => s.isEnding).map((s) => s.number).sort((a, b) => a - b);
    expect(endings).toEqual([42, 111, 267, 300, 350]);
  });
});

describe('book 25 (Trail of the Wolf) sections - fifth book of the New Order phase', () => {
  const sections = loadSections('tw');

  it('flags the 7 known puzzle sections, each with a real fallback choice', () => {
    for (const num of [11, 39, 219, 256, 293, 300, 348]) {
      expect(sections[num].hasPuzzle, `sect${num}`).toBe(true);
      expect(sections[num].isDeadEnd, `sect${num}`).toBe(false);
      expect(sections[num].choices.length, `sect${num}`).toBeGreaterThan(0);
    }
  });

  it('has exactly one real ending, at the canonical final section (350), forward-linking to Book 26', () => {
    const endings = Object.values(sections).filter((s) => s.isEnding).map((s) => s.number);
    expect(endings).toEqual([350]);
  });

  it('has exactly the 7 known dead-end sections', () => {
    const deadEnds = Object.values(sections).filter((s) => s.isDeadEnd).map((s) => s.number).sort((a, b) => a - b);
    expect(deadEnds).toEqual([61, 227, 249, 269, 297, 323, 336]);
  });
});

describe('book 26 (The Fall of Blood Mountain) sections - sixth book of the New Order phase', () => {
  const sections = loadSections('tfbm');

  it('has no puzzle sections - the first New Order book with none', () => {
    const puzzles = Object.values(sections).filter((s) => s.hasPuzzle);
    expect(puzzles).toHaveLength(0);
  });

  it('has exactly one real ending, at the canonical final section (350), forward-linking to Book 27', () => {
    const endings = Object.values(sections).filter((s) => s.isEnding).map((s) => s.number);
    expect(endings).toEqual([350]);
  });

  it('has exactly the 5 known dead-end sections', () => {
    const deadEnds = Object.values(sections).filter((s) => s.isDeadEnd).map((s) => s.number).sort((a, b) => a - b);
    expect(deadEnds).toEqual([104, 149, 249, 271, 329]);
  });
});

describe('book 27 (Vampirium) sections - seventh book of the New Order phase', () => {
  const sections = loadSections('v');

  it('flags sect137 and sect226 as puzzles, each with a real fallback choice', () => {
    for (const num of [137, 226]) {
      expect(sections[num].hasPuzzle, `sect${num}`).toBe(true);
      expect(sections[num].isDeadEnd, `sect${num}`).toBe(false);
      expect(sections[num].choices.length, `sect${num}`).toBeGreaterThan(0);
    }
  });

  it('has exactly one real ending, at the canonical final section (350), forward-linking to Book 28', () => {
    const endings = Object.values(sections).filter((s) => s.isEnding).map((s) => s.number);
    expect(endings).toEqual([350]);
  });

  it('has exactly the 13 known dead-end sections', () => {
    const deadEnds = Object.values(sections).filter((s) => s.isDeadEnd).map((s) => s.number).sort((a, b) => a - b);
    expect(deadEnds).toEqual([8, 19, 50, 123, 141, 142, 160, 163, 191, 279, 294, 308, 336]);
  });
});
