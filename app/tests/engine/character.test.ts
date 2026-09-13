import { describe, expect, it } from 'vitest';
import {
  addExtraDiscipline,
  applyDisciplines,
  carryOverCharacterToBook,
  chooseEquipmentOptions,
  createFreshCharacterForBook,
} from '../../src/engine/character';
import { ALL_DISCIPLINES, MAX_BACKPACK_ITEMS, MAX_WEAPONS } from '../../src/engine/types';

function fixedRng(...values: number[]): () => number {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
}

describe('createFreshCharacterForBook("ft")', () => {
  it('rolls Combat Skill in [10, 19] and Endurance in [20, 29] before equipment bonuses', () => {
    for (let digit = 0; digit <= 9; digit++) {
      const chart = createFreshCharacterForBook('ft', fixedRng(digit / 10, digit / 10, digit / 10, digit / 10));
      expect(chart.combatSkill).toBe(10 + digit);
      expect(chart.enduranceCurrent).toBeGreaterThanOrEqual(20 + digit);
    }
  });

  it('always starts with an Axe, a Meal, and the Map of Sommerlund', () => {
    const chart = createFreshCharacterForBook('ft', fixedRng(0.1, 0.1, 0.1, 0.1));
    expect(chart.weapons).toContain('Axe');
    expect(chart.meals).toBeGreaterThanOrEqual(1);
    expect(chart.specialItems.map((i) => i.name)).toContain('Map of Sommerlund');
  });

  it('caps gold crowns rolled at creation to a single digit (0-9)', () => {
    const chart = createFreshCharacterForBook('ft', fixedRng(0, 0.9, 0, 0));
    expect(chart.goldCrowns).toBeGreaterThanOrEqual(0);
    expect(chart.goldCrowns).toBeLessThanOrEqual(9 + 12); // could gain +12 from the bonus table roll
  });

  it('tags the character with the book id', () => {
    const chart = createFreshCharacterForBook('ft', fixedRng(0, 0, 0, 0));
    expect(chart.bookId).toBe('ft');
  });
});

describe('applyDisciplines', () => {
  it('rejects anything other than exactly 5 disciplines', () => {
    const chart = createFreshCharacterForBook('ft', fixedRng(0, 0, 0, 0));
    expect(() => applyDisciplines(chart, ALL_DISCIPLINES.slice(0, 4))).toThrow();
    expect(() => applyDisciplines(chart, ALL_DISCIPLINES)).toThrow();
  });

  it('rolls a Weaponskill weapon only when that discipline is chosen', () => {
    const chart = createFreshCharacterForBook('ft', fixedRng(0, 0, 0, 0));
    const withWeaponskill = applyDisciplines(
      chart,
      ['Weaponskill', 'Healing', 'Hunting', 'Camouflage', 'Tracking'],
      fixedRng(0),
    );
    expect(withWeaponskill.weaponskillWeapon).not.toBeNull();

    const without = applyDisciplines(chart, ['Healing', 'Hunting', 'Camouflage', 'Tracking', 'SixthSense']);
    expect(without.weaponskillWeapon).toBeNull();
  });
});

describe('carryOverCharacterToBook', () => {
  it('keeps Combat Skill, Endurance, disciplines and gear, and adds this book gold on top', () => {
    const book1Chart = applyDisciplines(
      createFreshCharacterForBook('ft', fixedRng(0.3, 0.3, 0.3, 0.3)),
      ['Healing', 'Hunting', 'Camouflage', 'Tracking', 'SixthSense'],
    );
    const carried = carryOverCharacterToBook(book1Chart, 'fa', fixedRng(0.5));

    expect(carried.bookId).toBe('fa');
    expect(carried.combatSkill).toBe(book1Chart.combatSkill);
    expect(carried.enduranceMax).toBe(book1Chart.enduranceMax);
    expect(carried.disciplines).toEqual(book1Chart.disciplines);
    expect(carried.weapons).toEqual(book1Chart.weapons);
    // fa's fixed narrative grants (Map, Seal of Hammerdal) are added on top of whatever was carried.
    const carriedNames = carried.specialItems.map((i) => i.name);
    expect(carriedNames).toEqual([...book1Chart.specialItems.map((i) => i.name), 'Map', 'Seal of Hammerdal']);
    expect(carried.goldCrowns).toBeGreaterThan(book1Chart.goldCrowns);
    expect(carried.currentSection).toBe(1);
    expect(carried.visitedSections).toEqual([]);
  });

  it('respects the weapon and backpack caps when the fixed grants would overflow them', () => {
    const book1Chart = createFreshCharacterForBook('ft', fixedRng(0.3, 0.3, 0.3, 0.3));
    book1Chart.weapons = ['Sword', 'Mace'];
    book1Chart.meals = MAX_BACKPACK_ITEMS;
    const carried = carryOverCharacterToBook(book1Chart, 'fa', fixedRng(0));
    expect(carried.weapons.length).toBeLessThanOrEqual(MAX_WEAPONS);
    expect(carried.backpackItems.length + carried.meals).toBeLessThanOrEqual(MAX_BACKPACK_ITEMS);
  });
});

describe('addExtraDiscipline', () => {
  it('adds exactly one new discipline, going from 5 to 6', () => {
    const chart = applyDisciplines(createFreshCharacterForBook('ft', fixedRng(0, 0, 0, 0)), [
      'Healing',
      'Hunting',
      'Camouflage',
      'Tracking',
      'SixthSense',
    ]);
    const withExtra = addExtraDiscipline(chart, 'Mindblast');
    expect(withExtra.disciplines).toHaveLength(6);
    expect(withExtra.disciplines).toContain('Mindblast');
  });

  it('rejects a discipline the character already has', () => {
    const chart = applyDisciplines(createFreshCharacterForBook('ft', fixedRng(0, 0, 0, 0)), [
      'Healing',
      'Hunting',
      'Camouflage',
      'Tracking',
      'SixthSense',
    ]);
    expect(() => addExtraDiscipline(chart, 'Healing')).toThrow();
  });
});

describe('chooseEquipmentOptions (book "fa", choose-two)', () => {
  it('applies exactly the two chosen options', () => {
    const chart = createFreshCharacterForBook('fa', () => 0);
    const equipped = chooseEquipmentOptions(chart, ['shield', 'mace']);
    expect(equipped.specialItems.map((i) => i.name)).toContain('Shield');
    expect(equipped.weapons).toContain('Mace');
  });

  it('rejects a selection that is not exactly two options', () => {
    const chart = createFreshCharacterForBook('fa', () => 0);
    expect(() => chooseEquipmentOptions(chart, ['shield'])).toThrow();
    expect(() => chooseEquipmentOptions(chart, ['shield', 'mace', 'spear'])).toThrow();
  });
});

describe('chooseEquipmentOptions (book "tck", choose-two)', () => {
  it('supports the new Warhammer and Padded Leather Waistcoat options', () => {
    const chart = createFreshCharacterForBook('tck', () => 0);
    const equipped = chooseEquipmentOptions(chart, ['warhammer', 'padded-leather-waistcoat']);
    expect(equipped.weapons).toContain('Warhammer');
    const waistcoat = equipped.specialItems.find((i) => i.name === 'Padded Leather Waistcoat');
    expect(waistcoat?.knownEffects).toBe('+2 Endurance');
    expect(equipped.enduranceMax).toBe(chart.enduranceMax + 2);
  });

  it('always starts with the Map of Kalte', () => {
    const chart = createFreshCharacterForBook('tck', () => 0);
    expect(chart.specialItems.map((i) => i.name)).toContain('Map of Kalte');
  });

  it('grants a fresh, unused Potion of Laumspur even if the previous potion was already used', () => {
    const chart = createFreshCharacterForBook('tck', () => 0);
    chart.hasHealingPotion = true;
    chart.hasHealingPotionUsed = true;
    const equipped = chooseEquipmentOptions(chart, ['potion-of-laumspur', 'axe']);
    expect(equipped.hasHealingPotion).toBe(true);
    expect(equipped.hasHealingPotionUsed).toBe(false);
  });
});

describe('carryOverCharacterToBook healing potion carry-over (regression)', () => {
  it('preserves "already used" across books instead of silently refilling it for free', () => {
    const book1Chart = createFreshCharacterForBook('ft', fixedRng(0.3, 0.3, 0.3, 0.3));
    book1Chart.hasHealingPotion = true;
    book1Chart.hasHealingPotionUsed = true;
    const carried = carryOverCharacterToBook(book1Chart, 'fa', fixedRng(0));
    expect(carried.hasHealingPotion).toBe(true);
    expect(carried.hasHealingPotionUsed).toBe(true);
  });

  it('preserves "still has an unused potion" across books', () => {
    const book1Chart = createFreshCharacterForBook('ft', fixedRng(0.3, 0.3, 0.3, 0.3));
    book1Chart.hasHealingPotion = true;
    book1Chart.hasHealingPotionUsed = false;
    const carried = carryOverCharacterToBook(book1Chart, 'fa', fixedRng(0));
    expect(carried.hasHealingPotion).toBe(true);
    expect(carried.hasHealingPotionUsed).toBe(false);
  });
});
