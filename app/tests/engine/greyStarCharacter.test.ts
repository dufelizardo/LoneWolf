import { describe, expect, it } from 'vitest';
import {
  addExtraMagicalPower,
  carryOverGreyStarCharacterToBook,
  chooseMagicalPowers,
  chooseStartingGift,
  createFreshGreyStarCharacter,
} from '../../src/engine/greyStarCharacter';
import { addBackpackItem, addWeapon } from '../../src/engine/greyStarInventory';
import { WIZARDS_STAFF, type GreyStarActionChart, type MagicalPower } from '../../src/engine/greyStarTypes';
import { MAX_BACKPACK_ITEMS, MAX_WEAPONS } from '../../src/engine/types';

function fixedRng(...values: number[]): () => number {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
}

const FIVE_POWERS_NO_ALCHEMY: MagicalPower[] = ['Sorcery', 'Enchantment', 'Elementalism', 'Prophecy', 'Psychomancy'];

describe('createFreshGreyStarCharacter', () => {
  it('rolls COMBAT SKILL (10+d10), WILLPOWER (20+d10) and ENDURANCE (20+d10, current = max)', () => {
    const chart = createFreshGreyStarCharacter('gsw', fixedRng(0.9, 0.5, 0.2));
    expect(chart.combatSkill).toBe(19);
    expect(chart.willpowerCurrent).toBe(25);
    expect(chart.enduranceMax).toBe(22);
    expect(chart.enduranceCurrent).toBe(22);
  });

  it('grants the fixed starting kit: Wizard\'s Staff (equipped), 4 Meals, Map of the Shadakine Empire, 0 Nobles', () => {
    const chart = createFreshGreyStarCharacter('gsw', fixedRng(0, 0, 0));
    expect(chart.weapons).toEqual([WIZARDS_STAFF]);
    expect(chart.equippedWeapon).toBe(WIZARDS_STAFF);
    expect(chart.meals).toBe(4);
    expect(chart.specialItems).toEqual([{ name: 'Map of the Shadakine Empire' }]);
    expect(chart.nobles).toBe(0);
    expect(chart.magicalPowers).toEqual([]);
    expect(chart.herbPouchItems).toEqual([]);
    expect(chart.isAlive).toBe(true);
  });
});

describe('chooseMagicalPowers', () => {
  const baseChart = createFreshGreyStarCharacter('gsw', fixedRng(0, 0, 0));

  it('requires exactly 5 powers', () => {
    expect(() => chooseMagicalPowers(baseChart, FIVE_POWERS_NO_ALCHEMY.slice(0, 4))).toThrow();
    expect(() => chooseMagicalPowers(baseChart, [...FIVE_POWERS_NO_ALCHEMY, 'Alchemy'])).toThrow();
  });

  it('requires 5 distinct powers', () => {
    expect(() =>
      chooseMagicalPowers(baseChart, ['Sorcery', 'Sorcery', 'Enchantment', 'Elementalism', 'Prophecy']),
    ).toThrow();
  });

  it('accepts exactly 5 distinct valid powers and stores them', () => {
    const chart = chooseMagicalPowers(baseChart, FIVE_POWERS_NO_ALCHEMY);
    expect(chart.magicalPowers).toEqual(FIVE_POWERS_NO_ALCHEMY);
  });

  it('does not grant a Herb Pouch without Alchemy', () => {
    const chart = chooseMagicalPowers(baseChart, FIVE_POWERS_NO_ALCHEMY);
    expect(chart.herbPouchItems).toEqual([]);
  });

  it('grants the fixed Herb Pouch starting contents when Alchemy is chosen', () => {
    const chart = chooseMagicalPowers(baseChart, ['Alchemy', 'Sorcery', 'Enchantment', 'Elementalism', 'Prophecy']);
    expect(chart.herbPouchItems).toEqual(['Empty Vial', 'Empty Vial', 'Vial of Saltpetre', 'Vial of Sulphur']);
  });
});

describe('chooseStartingGift', () => {
  const baseChart = createFreshGreyStarCharacter('gsw', fixedRng(0, 0, 0));

  it('Jewelled Dagger: adds it as a weapon and a Special Item with its combat bonus noted', () => {
    const chart = chooseStartingGift(baseChart, 'JewelledDagger');
    expect(chart.weapons).toContain('Jewelled Dagger');
    expect(chart.specialItems.some((i) => i.name === 'Jewelled Dagger')).toBe(true);
  });

  it('Magic Talisman: adds +2 WILLPOWER immediately, on top of whatever the roll produced', () => {
    const chart = chooseStartingGift(baseChart, 'MagicTalisman');
    expect(chart.willpowerCurrent).toBe(baseChart.willpowerCurrent + 2);
    expect(chart.specialItems.some((i) => i.name === 'Magic Talisman')).toBe(true);
  });

  it('Vial of Laumspur: added to the Backpack, not as a Special Item', () => {
    const chart = chooseStartingGift(baseChart, 'VialOfLaumspur');
    expect(chart.backpackItems).toContain('Vial of Laumspur');
  });
});

describe('addExtraMagicalPower (Book 2+ carry-over: choose a 6th power)', () => {
  const fivePowerChart = chooseMagicalPowers(
    createFreshGreyStarCharacter('tfc', fixedRng(0, 0, 0)),
    FIVE_POWERS_NO_ALCHEMY,
  );

  it('requires a character with exactly 5 Magical Powers already', () => {
    const fourPowers: GreyStarActionChart = { ...fivePowerChart, magicalPowers: FIVE_POWERS_NO_ALCHEMY.slice(0, 4) };
    expect(() => addExtraMagicalPower(fourPowers, 'Alchemy')).toThrow();
  });

  it('rejects a power the character already has', () => {
    expect(() => addExtraMagicalPower(fivePowerChart, 'Sorcery')).toThrow();
  });

  it('rejects an unknown power', () => {
    expect(() => addExtraMagicalPower(fivePowerChart, 'NotAPower' as MagicalPower)).toThrow();
  });

  it('accepts one of the 2 remaining powers, growing the list to 6', () => {
    const chart = addExtraMagicalPower(fivePowerChart, 'Evocation');
    expect(chart.magicalPowers).toEqual([...FIVE_POWERS_NO_ALCHEMY, 'Evocation']);
  });

  it('grants the Herb Pouch only when the newly-added power is Alchemy', () => {
    const withAlchemy = addExtraMagicalPower(fivePowerChart, 'Alchemy');
    expect(withAlchemy.herbPouchItems).toEqual(['Empty Vial', 'Empty Vial', 'Vial of Saltpetre', 'Vial of Sulphur']);

    const withoutAlchemy = addExtraMagicalPower(fivePowerChart, 'Evocation');
    expect(withoutAlchemy.herbPouchItems).toEqual([]);
  });
});

describe('carryOverGreyStarCharacterToBook (Book 2+)', () => {
  function endOfBookOneChart(): GreyStarActionChart {
    let chart = createFreshGreyStarCharacter('gsw', fixedRng(0.5, 0.9, 0.9)); // CS 15, WP 29 (starting), EP 22
    chart = chooseMagicalPowers(chart, FIVE_POWERS_NO_ALCHEMY);
    // Simulate WILLPOWER having been spent down over the course of the book.
    chart = { ...chart, willpowerCurrent: 2 };
    return chart;
  }

  it('"keepCurrent": new WILLPOWER = previous current + 10', () => {
    const chart = carryOverGreyStarCharacterToBook(endOfBookOneChart(), 'tfc', 'keepCurrent');
    expect(chart.willpowerCurrent).toBe(12);
    expect(chart.willpowerStarting).toBe(12);
  });

  it('"useStarting": new WILLPOWER = previous willpowerStarting + 10, ignoring the current (spent-down) value', () => {
    const chart = carryOverGreyStarCharacterToBook(endOfBookOneChart(), 'tfc', 'useStarting');
    expect(chart.willpowerCurrent).toBe(39); // 29 (starting) + 10
    expect(chart.willpowerStarting).toBe(39);
  });

  it('"reroll": new WILLPOWER = a fresh 20+d10 roll + 10', () => {
    const chart = carryOverGreyStarCharacterToBook(endOfBookOneChart(), 'tfc', 'reroll', fixedRng(0.3));
    expect(chart.willpowerCurrent).toBe(33); // 20 + 3 + 10
    expect(chart.willpowerStarting).toBe(33);
  });

  it('carries everything else over unchanged: bookId, CS, ENDURANCE, powers, weapons, items, Nobles', () => {
    const previous = endOfBookOneChart();
    const chart = carryOverGreyStarCharacterToBook(previous, 'tfc', 'keepCurrent');
    expect(chart.bookId).toBe('tfc');
    expect(chart.combatSkill).toBe(previous.combatSkill);
    expect(chart.enduranceCurrent).toBe(previous.enduranceCurrent);
    expect(chart.enduranceMax).toBe(previous.enduranceMax);
    expect(chart.magicalPowers).toEqual(previous.magicalPowers);
    expect(chart.weapons).toEqual(previous.weapons);
    expect(chart.equippedWeapon).toBe(previous.equippedWeapon);
    expect(chart.backpackItems).toEqual(previous.backpackItems);
    expect(chart.specialItems).toEqual(previous.specialItems);
    expect(chart.nobles).toBe(previous.nobles);
  });

  it('resets currentSection to 1, clears visitedSections, and marks the character alive', () => {
    const previous = { ...endOfBookOneChart(), currentSection: 217, visitedSections: [1, 2, 3], isAlive: false };
    const chart = carryOverGreyStarCharacterToBook(previous, 'tfc', 'keepCurrent');
    expect(chart.currentSection).toBe(1);
    expect(chart.visitedSections).toEqual([]);
    expect(chart.isAlive).toBe(true);
  });
});

describe('Grey Star inventory limits', () => {
  it('never exceeds MAX_WEAPONS (2, Wizard\'s Staff counts as one)', () => {
    const base = createFreshGreyStarCharacter('gsw', fixedRng(0, 0, 0));
    const withOneMore = addWeapon(base, 'Jewelled Dagger');
    expect(withOneMore.weapons).toHaveLength(2);
    const withThird = addWeapon(withOneMore, 'Sword');
    expect(withThird.weapons).toHaveLength(MAX_WEAPONS);
    expect(withThird.weapons).not.toContain('Sword');
  });

  it('never exceeds MAX_BACKPACK_ITEMS across items + meals', () => {
    let chart = createFreshGreyStarCharacter('gsw', fixedRng(0, 0, 0)); // starts with 4 Meals
    for (let i = 0; i < 10; i++) chart = addBackpackItem(chart, `Item ${i}`);
    expect(chart.backpackItems.length + chart.meals).toBe(MAX_BACKPACK_ITEMS);
  });
});
