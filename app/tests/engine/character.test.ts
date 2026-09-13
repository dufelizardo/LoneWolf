import { describe, expect, it } from 'vitest';
import {
  addExtraDiscipline,
  addExtraMagnakaiDiscipline,
  addExtraMasteredWeapon,
  applyDisciplines,
  applyMagnakaiDisciplines,
  carryOverCharacterToBook,
  chooseEquipmentOptions,
  chooseMasteredWeapons,
  createFreshCharacterForBook,
} from '../../src/engine/character';
import { ALL_DISCIPLINES, ALL_MAGNAKAI_DISCIPLINES, MAX_BACKPACK_ITEMS, MAX_WEAPONS } from '../../src/engine/types';

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

  it('adds a fresh potion dose on top of any already carried', () => {
    const chart = createFreshCharacterForBook('tck', () => 0);
    chart.healingPotionDoses = 1;
    const equipped = chooseEquipmentOptions(chart, ['potion-of-laumspur', 'axe']);
    expect(equipped.healingPotionDoses).toBe(2);
  });
});

describe('carryOverCharacterToBook healing potion carry-over (regression)', () => {
  it('preserves the exact dose count across books instead of resetting it', () => {
    const book1Chart = createFreshCharacterForBook('ft', fixedRng(0.3, 0.3, 0.3, 0.3));
    book1Chart.healingPotionDoses = 0;
    const carried = carryOverCharacterToBook(book1Chart, 'fa', fixedRng(0));
    expect(carried.healingPotionDoses).toBe(0);
  });

  it('preserves an unused dose across books', () => {
    const book1Chart = createFreshCharacterForBook('ft', fixedRng(0.3, 0.3, 0.3, 0.3));
    book1Chart.healingPotionDoses = 1;
    const carried = carryOverCharacterToBook(book1Chart, 'fa', fixedRng(0));
    expect(carried.healingPotionDoses).toBe(1);
  });
});

describe('chooseEquipmentOptions (book "tcd", choose-six)', () => {
  const sixOptions = [
    'dagger',
    'potions-of-laumspur',
    'special-rations',
    'shield',
    'chainmail',
    'mace',
  ];

  it('grants the new Dagger weapon', () => {
    const chart = createFreshCharacterForBook('tcd', () => 0);
    const equipped = chooseEquipmentOptions(chart, sixOptions);
    expect(equipped.weapons).toContain('Dagger');
  });

  it('grants 2 doses of Potion of Laumspur from a single option', () => {
    const chart = createFreshCharacterForBook('tcd', () => 0);
    const equipped = chooseEquipmentOptions(chart, sixOptions);
    expect(equipped.healingPotionDoses).toBe(2);
  });

  it('grants 5 Meals from the Special Rations option', () => {
    const chart = createFreshCharacterForBook('tcd', () => 0);
    const equipped = chooseEquipmentOptions(chart, sixOptions);
    expect(equipped.meals).toBe(5);
  });

  it('always starts with the Map of the Southlands and Badge of Rank', () => {
    const chart = createFreshCharacterForBook('tcd', () => 0);
    const names = chart.specialItems.map((i) => i.name);
    expect(names).toContain('Map of the Southlands');
    expect(names).toContain('Badge of Rank');
  });

  it('rejects a selection that is not exactly six options', () => {
    const chart = createFreshCharacterForBook('tcd', () => 0);
    expect(() => chooseEquipmentOptions(chart, sixOptions.slice(0, 5))).toThrow();
    expect(() => chooseEquipmentOptions(chart, [...sixOptions, 'sword'])).toThrow();
  });
});

describe('chooseEquipmentOptions (book "ss", choose-four)', () => {
  const fourOptions = ['dagger', 'potion-of-laumspur', 'special-rations', 'shield'];

  it('grants the Dagger weapon', () => {
    const chart = createFreshCharacterForBook('ss', () => 0);
    const equipped = chooseEquipmentOptions(chart, fourOptions);
    expect(equipped.weapons).toContain('Dagger');
  });

  it('grants a single dose of Potion of Laumspur (unlike Book 4\'s two)', () => {
    const chart = createFreshCharacterForBook('ss', () => 0);
    const equipped = chooseEquipmentOptions(chart, fourOptions);
    expect(equipped.healingPotionDoses).toBe(1);
  });

  it('grants 2 Meals from the Special Rations option', () => {
    const chart = createFreshCharacterForBook('ss', () => 0);
    const equipped = chooseEquipmentOptions(chart, fourOptions);
    expect(equipped.meals).toBe(2);
  });

  it('always starts with the Map of the Desert Empire', () => {
    const chart = createFreshCharacterForBook('ss', () => 0);
    expect(chart.specialItems.map((i) => i.name)).toContain('Map of the Desert Empire');
  });

  it('rejects a selection that is not exactly four options', () => {
    const chart = createFreshCharacterForBook('ss', () => 0);
    expect(() => chooseEquipmentOptions(chart, fourOptions.slice(0, 3))).toThrow();
    expect(() => chooseEquipmentOptions(chart, [...fourOptions, 'sword'])).toThrow();
  });
});

describe('applyMagnakaiDisciplines', () => {
  it('rejects anything other than exactly 3 disciplines', () => {
    const chart = createFreshCharacterForBook('tkt', fixedRng(0, 0, 0, 0));
    expect(() => applyMagnakaiDisciplines(chart, ALL_MAGNAKAI_DISCIPLINES.slice(0, 2))).toThrow();
    expect(() => applyMagnakaiDisciplines(chart, ALL_MAGNAKAI_DISCIPLINES.slice(0, 4))).toThrow();
  });

  it('sets exactly the 3 chosen disciplines', () => {
    const chart = createFreshCharacterForBook('tkt', fixedRng(0, 0, 0, 0));
    const equipped = applyMagnakaiDisciplines(chart, ['Curing', 'Huntmastery', 'Divination']);
    expect(equipped.magnakaiDisciplines).toEqual(['Curing', 'Huntmastery', 'Divination']);
  });
});

describe('addExtraMagnakaiDiscipline', () => {
  it('adds exactly one new discipline, going from 3 to 4', () => {
    const chart = applyMagnakaiDisciplines(createFreshCharacterForBook('tkt', fixedRng(0, 0, 0, 0)), [
      'Curing',
      'Huntmastery',
      'Divination',
    ]);
    const withExtra = addExtraMagnakaiDiscipline(chart, 'PsiSurge');
    expect(withExtra.magnakaiDisciplines).toHaveLength(4);
    expect(withExtra.magnakaiDisciplines).toContain('PsiSurge');
  });

  it('rejects a discipline the character already has', () => {
    const chart = applyMagnakaiDisciplines(createFreshCharacterForBook('tkt', fixedRng(0, 0, 0, 0)), [
      'Curing',
      'Huntmastery',
      'Divination',
    ]);
    expect(() => addExtraMagnakaiDiscipline(chart, 'Curing')).toThrow();
  });
});

describe('chooseMasteredWeapons', () => {
  it('rejects anything other than exactly 3 weapons', () => {
    const chart = createFreshCharacterForBook('tkt', () => 0);
    expect(() => chooseMasteredWeapons(chart, ['Sword', 'Bow'])).toThrow();
    expect(() => chooseMasteredWeapons(chart, ['Sword', 'Bow', 'Axe', 'Dagger'])).toThrow();
  });

  it('sets masteredWeapons independently of carried weapons', () => {
    const chart = createFreshCharacterForBook('tkt', () => 0);
    const equipped = chooseMasteredWeapons(chart, ['Sword', 'Bow', 'Axe']);
    expect(equipped.masteredWeapons).toEqual(['Sword', 'Bow', 'Axe']);
    // "does not mean you begin the adventure carrying any of them" (equipmnt.htm)
    expect(equipped.weapons).toEqual(chart.weapons);
  });
});

describe('carryOverCharacterToBook crossing into the Magnakai phase (regression)', () => {
  it('clears Kai disciplines and weaponskillWeapon when entering a Magnakai-phase book', () => {
    const kaiChart = applyDisciplines(createFreshCharacterForBook('ft', fixedRng(0, 0, 0, 0)), [
      'Weaponskill',
      'Healing',
      'Hunting',
      'Mindshield',
      'Mindblast',
    ], fixedRng(0));
    expect(kaiChart.disciplines).toHaveLength(5);
    expect(kaiChart.weaponskillWeapon).not.toBeNull();

    const carried = carryOverCharacterToBook(kaiChart, 'tkt', fixedRng(0));
    expect(carried.disciplines).toEqual([]);
    expect(carried.weaponskillWeapon).toBeNull();
    expect(carried.magnakaiDisciplines).toEqual([]);
  });

  it('keeps Combat Skill, Endurance, Weapons and Special Items across the phase boundary', () => {
    const kaiChart = createFreshCharacterForBook('ft', fixedRng(0.3, 0.3, 0.3, 0.3));
    const carried = carryOverCharacterToBook(kaiChart, 'tkt', fixedRng(0));
    expect(carried.combatSkill).toBe(kaiChart.combatSkill);
    expect(carried.enduranceMax).toBe(kaiChart.enduranceMax);
    expect(carried.weapons).toEqual(kaiChart.weapons);
    expect(carried.specialItems.map((i) => i.name)).toEqual(
      expect.arrayContaining(kaiChart.specialItems.map((i) => i.name)),
    );
  });

  it('does not clear disciplines when carrying over within the same phase', () => {
    const chart1 = applyDisciplines(createFreshCharacterForBook('ft', fixedRng(0, 0, 0, 0)), [
      'Healing',
      'Hunting',
      'Camouflage',
      'Tracking',
      'SixthSense',
    ]);
    const carried = carryOverCharacterToBook(chart1, 'fa', fixedRng(0));
    expect(carried.disciplines).toEqual(chart1.disciplines);
  });
});

describe('chooseEquipmentOptions (book "tkt", choose-five)', () => {
  const fiveOptions = ['bow', 'quiver', 'special-rations', 'rope', 'tinderbox'];

  it('grants the new Bow weapon', () => {
    const chart = createFreshCharacterForBook('tkt', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.weapons).toContain('Bow');
  });

  it('grants 6 Arrows from the Quiver option', () => {
    const chart = createFreshCharacterForBook('tkt', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.arrows).toBe(6);
  });

  it('grants 4 Meals from the Special Rations option', () => {
    const chart = createFreshCharacterForBook('tkt', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.meals).toBe(4);
  });

  it('grants Rope and Tinderbox as plain backpack items', () => {
    const chart = createFreshCharacterForBook('tkt', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.backpackItems).toContain('Rope');
    expect(equipped.backpackItems).toContain('Tinderbox');
  });

  it('always starts with the Map of the Stornlands', () => {
    const chart = createFreshCharacterForBook('tkt', () => 0);
    expect(chart.specialItems.map((i) => i.name)).toContain('Map of the Stornlands');
  });

  it('rejects a selection that is not exactly five options', () => {
    const chart = createFreshCharacterForBook('tkt', () => 0);
    expect(() => chooseEquipmentOptions(chart, fiveOptions.slice(0, 4))).toThrow();
    expect(() => chooseEquipmentOptions(chart, [...fiveOptions, 'sword'])).toThrow();
  });
});

describe('addExtraMasteredWeapon', () => {
  it('adds exactly one new weapon on top of an existing Weaponmastery Checklist', () => {
    const chart = chooseMasteredWeapons(createFreshCharacterForBook('tkt', () => 0), ['Sword', 'Bow', 'Axe']);
    const grown = addExtraMasteredWeapon(chart, 'Dagger');
    expect(grown.masteredWeapons).toEqual(['Sword', 'Bow', 'Axe', 'Dagger']);
  });

  it('rejects a weapon that is already mastered', () => {
    const chart = chooseMasteredWeapons(createFreshCharacterForBook('tkt', () => 0), ['Sword', 'Bow', 'Axe']);
    expect(() => addExtraMasteredWeapon(chart, 'Sword')).toThrow();
  });
});

describe('chooseEquipmentOptions (book "cd", choose-five)', () => {
  const fiveOptions = ['bow', 'quiver', 'meals', 'rope', 'fireseeds'];

  it('grants the new Bow weapon', () => {
    const chart = createFreshCharacterForBook('cd', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.weapons).toContain('Bow');
  });

  it('grants 6 Arrows from the Quiver option', () => {
    const chart = createFreshCharacterForBook('cd', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.arrows).toBe(6);
  });

  it('grants 3 Meals from the Meals option', () => {
    const chart = createFreshCharacterForBook('cd', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.meals).toBe(3);
  });

  it('grants Rope as a plain backpack item', () => {
    const chart = createFreshCharacterForBook('cd', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.backpackItems).toContain('Rope');
  });

  it('grants 3 Fireseeds as separate Special Item entries', () => {
    const chart = createFreshCharacterForBook('cd', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.specialItems.filter((i) => i.name === 'Fireseed')).toHaveLength(3);
  });

  it('always starts with the Map of Herdos', () => {
    const chart = createFreshCharacterForBook('cd', () => 0);
    expect(chart.specialItems.map((i) => i.name)).toContain('Map of Herdos');
  });

  it('rejects a selection that is not exactly five options', () => {
    const chart = createFreshCharacterForBook('cd', () => 0);
    expect(() => chooseEquipmentOptions(chart, fiveOptions.slice(0, 4))).toThrow();
    expect(() => chooseEquipmentOptions(chart, [...fiveOptions, 'sword'])).toThrow();
  });
});

describe('carryOverCharacterToBook within Magnakai phase, book "tkt" -> "cd" (regression)', () => {
  it('keeps existing Magnakai Disciplines and mastered weapons, and allows growth by 1 of each', () => {
    const tktChart = chooseMasteredWeapons(
      applyMagnakaiDisciplines(createFreshCharacterForBook('tkt', fixedRng(0, 0, 0, 0)), [
        'Weaponmastery',
        'Curing',
        'Huntmastery',
      ]),
      ['Sword', 'Bow', 'Axe'],
    );

    const cdChart = carryOverCharacterToBook(tktChart, 'cd', fixedRng(0));
    expect(cdChart.magnakaiDisciplines).toEqual(tktChart.magnakaiDisciplines);
    expect(cdChart.masteredWeapons).toEqual(tktChart.masteredWeapons);

    const withNewDiscipline = addExtraMagnakaiDiscipline(cdChart, 'PsiSurge');
    expect(withNewDiscipline.magnakaiDisciplines).toHaveLength(4);

    const withNewWeapon = addExtraMasteredWeapon(withNewDiscipline, 'Dagger');
    expect(withNewWeapon.masteredWeapons).toEqual(['Sword', 'Bow', 'Axe', 'Dagger']);
  });
});

describe('chooseEquipmentOptions (book "tjh", choose-five)', () => {
  const fiveOptions = ['bow', 'quiver', 'meals', 'rope', 'fireseeds'];

  it('grants the new Bow weapon', () => {
    const chart = createFreshCharacterForBook('tjh', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.weapons).toContain('Bow');
  });

  it('grants 6 Arrows from the Quiver option', () => {
    const chart = createFreshCharacterForBook('tjh', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.arrows).toBe(6);
  });

  it('grants 3 Meals from the Meals option', () => {
    const chart = createFreshCharacterForBook('tjh', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.meals).toBe(3);
  });

  it('grants Rope as a plain backpack item', () => {
    const chart = createFreshCharacterForBook('tjh', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.backpackItems).toContain('Rope');
  });

  it('grants 3 Fireseeds as separate Special Item entries', () => {
    const chart = createFreshCharacterForBook('tjh', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.specialItems.filter((i) => i.name === 'Fireseed')).toHaveLength(3);
  });

  it('always starts with the Map of the Danarg Swamp', () => {
    const chart = createFreshCharacterForBook('tjh', () => 0);
    expect(chart.specialItems.map((i) => i.name)).toContain('Map of the Danarg Swamp');
  });

  it('rejects a selection that is not exactly five options', () => {
    const chart = createFreshCharacterForBook('tjh', () => 0);
    expect(() => chooseEquipmentOptions(chart, fiveOptions.slice(0, 4))).toThrow();
    expect(() => chooseEquipmentOptions(chart, [...fiveOptions, 'sword'])).toThrow();
  });
});

describe('chooseEquipmentOptions (book "tcf", choose-five)', () => {
  const fiveOptions = ['bow', 'quiver', 'meals', 'rope', 'fireseeds'];

  it('grants the new Bow weapon', () => {
    const chart = createFreshCharacterForBook('tcf', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.weapons).toContain('Bow');
  });

  it('grants 6 Arrows from the Quiver option', () => {
    const chart = createFreshCharacterForBook('tcf', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.arrows).toBe(6);
  });

  it('grants 3 Meals from the Meals option', () => {
    const chart = createFreshCharacterForBook('tcf', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.meals).toBe(3);
  });

  it('grants Rope as a plain backpack item', () => {
    const chart = createFreshCharacterForBook('tcf', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.backpackItems).toContain('Rope');
  });

  it('grants 3 Fireseeds as separate Special Item entries', () => {
    const chart = createFreshCharacterForBook('tcf', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.specialItems.filter((i) => i.name === 'Fireseed')).toHaveLength(3);
  });

  it('always starts with the Map of the Republic of Anari', () => {
    const chart = createFreshCharacterForBook('tcf', () => 0);
    expect(chart.specialItems.map((i) => i.name)).toContain('Map of the Republic of Anari');
  });

  it('rejects a selection that is not exactly five options', () => {
    const chart = createFreshCharacterForBook('tcf', () => 0);
    expect(() => chooseEquipmentOptions(chart, fiveOptions.slice(0, 4))).toThrow();
    expect(() => chooseEquipmentOptions(chart, [...fiveOptions, 'sword'])).toThrow();
  });
});

describe('chooseEquipmentOptions (book "tdt", choose-five)', () => {
  const fiveOptions = ['bow', 'quiver', 'meals', 'rope', 'potion-of-alether'];

  it('grants the new Bow weapon', () => {
    const chart = createFreshCharacterForBook('tdt', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.weapons).toContain('Bow');
  });

  it('grants 6 Arrows from the Quiver option', () => {
    const chart = createFreshCharacterForBook('tdt', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.arrows).toBe(6);
  });

  it('grants 3 Meals from the Meals option', () => {
    const chart = createFreshCharacterForBook('tdt', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.meals).toBe(3);
  });

  it('grants Rope as a plain backpack item', () => {
    const chart = createFreshCharacterForBook('tdt', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.backpackItems).toContain('Rope');
  });

  it('grants exactly 1 dose of Potion of Alether', () => {
    const chart = createFreshCharacterForBook('tdt', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.combatPotionDoses).toBe(1);
  });

  it('always starts with the Map of Ghatan', () => {
    const chart = createFreshCharacterForBook('tdt', () => 0);
    expect(chart.specialItems.map((i) => i.name)).toContain('Map of Ghatan');
  });

  it('rejects a selection that is not exactly five options', () => {
    const chart = createFreshCharacterForBook('tdt', () => 0);
    expect(() => chooseEquipmentOptions(chart, fiveOptions.slice(0, 4))).toThrow();
    expect(() => chooseEquipmentOptions(chart, [...fiveOptions, 'sword'])).toThrow();
  });
});
