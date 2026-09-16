import { describe, expect, it } from 'vitest';
import {
  addExtraMagicalPower,
  carryOverGreyStarCharacterToBook,
  chooseHigherMagicalPowers,
  chooseMagicalPowers,
  chooseStartingGift,
  computeMoonstoneCarryOver,
  computeThreeMethodWillpowerCarryOver,
  createFreshGreyStarCharacter,
  rollWillpowerForLaterBookCarryOver,
} from '../../src/engine/greyStarCharacter';
import { addBackpackItem, addWeapon } from '../../src/engine/greyStarInventory';
import {
  WIZARDS_STAFF,
  type GreyStarActionChart,
  type HigherMagicalPower,
  type MagicalPower,
} from '../../src/engine/greyStarTypes';
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

  it('ww (Book 4): WILLPOWER/ENDURANCE are fixed at 50/30, not rolled, and the Moonstone is granted', () => {
    // Only the COMBAT SKILL roll is consumed - fixedRng would throw on an unexpected 2nd/3rd read if
    // willpower/endurance were still being rolled, since only one value is provided.
    const chart = createFreshGreyStarCharacter('ww', fixedRng(0.4));
    expect(chart.combatSkill).toBe(14);
    expect(chart.willpowerCurrent).toBe(50);
    expect(chart.willpowerStarting).toBe(50);
    expect(chart.enduranceCurrent).toBe(30);
    expect(chart.enduranceMax).toBe(30);
    expect(chart.specialItems).toEqual([
      { name: 'Map of the Shadakine Empire' },
      { name: 'The Moonstone', knownEffects: 'Pode teletransportar você até Shasarak uma única vez durante a aventura' },
    ]);
    expect(chart.higherMagicalPowers).toEqual([]);
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

function endOfBookOneChart(): GreyStarActionChart {
  let chart = createFreshGreyStarCharacter('gsw', fixedRng(0.5, 0.9, 0.9)); // CS 15, WP 29 (starting), EP 22
  chart = chooseMagicalPowers(chart, FIVE_POWERS_NO_ALCHEMY);
  // Simulate WILLPOWER having been spent down over the course of the book.
  chart = { ...chart, willpowerCurrent: 2 };
  return chart;
}

describe('computeThreeMethodWillpowerCarryOver (Book 2)', () => {
  it('"keepCurrent": previous current + 10', () => {
    expect(computeThreeMethodWillpowerCarryOver(endOfBookOneChart(), 'keepCurrent')).toBe(12);
  });

  it('"useStarting": previous willpowerStarting + 10, ignoring the current (spent-down) value', () => {
    expect(computeThreeMethodWillpowerCarryOver(endOfBookOneChart(), 'useStarting')).toBe(39); // 29 + 10
  });

  it('"reroll": a fresh 20+d10 roll + 10', () => {
    expect(computeThreeMethodWillpowerCarryOver(endOfBookOneChart(), 'reroll', fixedRng(0.3))).toBe(33); // 20+3+10
  });
});

describe('rollWillpowerForLaterBookCarryOver (Book 3+)', () => {
  it('uses a +25 bonus for a character with 5 Magical Powers (only completed Book 1)', () => {
    const chart = endOfBookOneChart();
    expect(rollWillpowerForLaterBookCarryOver(chart, fixedRng(0.3))).toBe(28); // 25 + 3
  });

  it('uses a +30 bonus for a character with 6 Magical Powers (already carried over once)', () => {
    const chart = addExtraMagicalPower(endOfBookOneChart(), 'Evocation');
    expect(rollWillpowerForLaterBookCarryOver(chart, fixedRng(0.3))).toBe(33); // 30 + 3
  });
});

describe('computeMoonstoneCarryOver (Book 4+)', () => {
  it('adds a flat +50 to WILLPOWER and +30 to ENDURANCE, with no dice roll and no player choice', () => {
    const previous = { ...endOfBookOneChart(), willpowerCurrent: 3, enduranceCurrent: 18, enduranceMax: 22 };
    const result = computeMoonstoneCarryOver(previous);
    expect(result.willpowerCurrent).toBe(53);
    expect(result.enduranceCurrent).toBe(48);
  });

  it('raises the ENDURANCE ceiling too - the only carry-over rule in the series that does this', () => {
    const previous = { ...endOfBookOneChart(), enduranceCurrent: 18, enduranceMax: 22 };
    const result = computeMoonstoneCarryOver(previous);
    expect(result.enduranceMax).toBe(48); // previous CURRENT (18) + 30, not previous max (22) + 30
    expect(result.enduranceMax).toBe(result.enduranceCurrent);
  });
});

describe('chooseHigherMagicalPowers (Book 4+)', () => {
  const baseChart = createFreshGreyStarCharacter('ww', fixedRng(0));
  const FOUR_HIGHER_NO_THEURGY: HigherMagicalPower[] = ['Thaumaturgy', 'Telergy', 'Physiurgy', 'Visionary'];

  it('rejects the wrong count', () => {
    expect(() => chooseHigherMagicalPowers(baseChart, FOUR_HIGHER_NO_THEURGY.slice(0, 3), 4)).toThrow();
    expect(() => chooseHigherMagicalPowers(baseChart, [...FOUR_HIGHER_NO_THEURGY, 'Theurgy'], 4)).toThrow();
  });

  it('rejects duplicates and unknown powers', () => {
    expect(() =>
      chooseHigherMagicalPowers(baseChart, ['Thaumaturgy', 'Thaumaturgy', 'Telergy', 'Physiurgy'], 4),
    ).toThrow();
    expect(() =>
      chooseHigherMagicalPowers(baseChart, ['NotAPower' as HigherMagicalPower, 'Telergy', 'Physiurgy', 'Visionary'], 4),
    ).toThrow();
  });

  it('accepts exactly `expectedCount` distinct valid powers (4 for a fresh start)', () => {
    const chart = chooseHigherMagicalPowers(baseChart, FOUR_HIGHER_NO_THEURGY, 4);
    expect(chart.higherMagicalPowers).toEqual(FOUR_HIGHER_NO_THEURGY);
  });

  it('accepts 5 for a carry-over character', () => {
    const chart = chooseHigherMagicalPowers(baseChart, [...FOUR_HIGHER_NO_THEURGY, 'Theurgy'], 5);
    expect(chart.higherMagicalPowers).toHaveLength(5);
  });

  it('grants the Herb Pouch when Theurgy is chosen and the character does not already have Alchemy', () => {
    const chart = chooseHigherMagicalPowers(baseChart, ['Theurgy', 'Telergy', 'Physiurgy', 'Visionary'], 4);
    expect(chart.herbPouchItems).toEqual(['Empty Vial', 'Empty Vial', 'Vial of Saltpetre', 'Vial of Sulphur']);
  });

  it('does not re-grant the Herb Pouch when Theurgy is chosen but the character already has Alchemy', () => {
    const withAlchemy: GreyStarActionChart = { ...baseChart, magicalPowers: [...FIVE_POWERS_NO_ALCHEMY.slice(0, 4), 'Alchemy'] };
    const chart = chooseHigherMagicalPowers(withAlchemy, ['Theurgy', 'Telergy', 'Physiurgy', 'Visionary'], 4);
    expect(chart.herbPouchItems).toEqual([]);
  });

  it('does not grant the Herb Pouch when Theurgy is not chosen', () => {
    const chart = chooseHigherMagicalPowers(baseChart, FOUR_HIGHER_NO_THEURGY, 4);
    expect(chart.herbPouchItems).toEqual([]);
  });
});

describe('carryOverGreyStarCharacterToBook', () => {
  it('applies the given new WILLPOWER value as both current and starting', () => {
    const chart = carryOverGreyStarCharacterToBook(endOfBookOneChart(), 'tfc', { willpowerCurrent: 12 });
    expect(chart.willpowerCurrent).toBe(12);
    expect(chart.willpowerStarting).toBe(12);
  });

  it('leaves ENDURANCE untouched when the patch omits it (Books 2-3)', () => {
    const previous = endOfBookOneChart();
    const chart = carryOverGreyStarCharacterToBook(previous, 'tfc', { willpowerCurrent: 12 });
    expect(chart.enduranceCurrent).toBe(previous.enduranceCurrent);
    expect(chart.enduranceMax).toBe(previous.enduranceMax);
  });

  it('applies ENDURANCE current/max from the patch when present (Book 4+)', () => {
    const chart = carryOverGreyStarCharacterToBook(endOfBookOneChart(), 'ww', {
      willpowerCurrent: 60,
      enduranceCurrent: 45,
      enduranceMax: 45,
    });
    expect(chart.enduranceCurrent).toBe(45);
    expect(chart.enduranceMax).toBe(45);
  });

  it('carries everything else over unchanged: bookId, CS, powers, weapons, items, Nobles', () => {
    const previous = endOfBookOneChart();
    const chart = carryOverGreyStarCharacterToBook(previous, 'tfc', { willpowerCurrent: 12 });
    expect(chart.bookId).toBe('tfc');
    expect(chart.combatSkill).toBe(previous.combatSkill);
    expect(chart.magicalPowers).toEqual(previous.magicalPowers);
    expect(chart.weapons).toEqual(previous.weapons);
    expect(chart.equippedWeapon).toBe(previous.equippedWeapon);
    expect(chart.backpackItems).toEqual(previous.backpackItems);
    expect(chart.specialItems).toEqual(previous.specialItems);
    expect(chart.nobles).toBe(previous.nobles);
  });

  it('resets currentSection to 1, clears visitedSections, and marks the character alive', () => {
    const previous = { ...endOfBookOneChart(), currentSection: 217, visitedSections: [1, 2, 3], isAlive: false };
    const chart = carryOverGreyStarCharacterToBook(previous, 'tfc', { willpowerCurrent: 12 });
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
