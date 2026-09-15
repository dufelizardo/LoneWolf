import { describe, expect, it } from 'vitest';
import {
  addExtraDiscipline,
  addExtraGrandMasterDiscipline,
  addExtraGrandMasteredWeapon,
  addExtraMagnakaiDiscipline,
  addExtraMasteredWeapon,
  applyDisciplines,
  applyGrandMasterDisciplines,
  applyMagnakaiDisciplines,
  carryOverCharacterToBook,
  chooseEquipmentOptions,
  chooseGrandMasteredWeapons,
  chooseKaiWeapon,
  chooseMasteredWeapons,
  createFreshCharacterForBook,
  rollKaiWeapon,
  rollKaiName,
  setKaiName,
} from '../../src/engine/character';
import { ALL_DISCIPLINES, ALL_MAGNAKAI_DISCIPLINES, MAX_BACKPACK_ITEMS, MAX_WEAPONS, type GrandMasterDiscipline } from '../../src/engine/types';

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

describe('chooseEquipmentOptions re-picking an already-carried weapon (regression)', () => {
  it('does not duplicate a weapon the carried-over character already owns', () => {
    const book1Chart = createFreshCharacterForBook('ft', fixedRng(0.3, 0.3, 0.3, 0.3));
    const withSword = { ...book1Chart, weapons: ['Sword'] as const, equippedWeapon: 'Sword' as const };
    const carried = carryOverCharacterToBook(withSword, 'fa', fixedRng(0));
    const equipped = chooseEquipmentOptions(carried, ['sword', 'mace']);
    expect(equipped.weapons.filter((w) => w === 'Sword')).toHaveLength(1);
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

describe('chooseEquipmentOptions (book "tpt", choose-six)', () => {
  const sixOptions = ['sword', 'bow', 'quiver', 'rope', 'potion-of-laumspur', 'meals'];

  it('grants Sword and Bow weapons', () => {
    const chart = createFreshCharacterForBook('tpt', () => 0);
    const equipped = chooseEquipmentOptions(chart, sixOptions);
    expect(equipped.weapons).toContain('Sword');
    expect(equipped.weapons).toContain('Bow');
  });

  it('grants 6 Arrows from the Quiver option', () => {
    const chart = createFreshCharacterForBook('tpt', () => 0);
    const equipped = chooseEquipmentOptions(chart, sixOptions);
    expect(equipped.arrows).toBe(6);
  });

  it('grants 3 Meals on top of the 2 base Meals (5 total)', () => {
    const chart = createFreshCharacterForBook('tpt', () => 0);
    expect(chart.meals).toBe(2);
    const equipped = chooseEquipmentOptions(chart, sixOptions);
    expect(equipped.meals).toBe(5);
  });

  it('grants a Potion of Laumspur dose', () => {
    const chart = createFreshCharacterForBook('tpt', () => 0);
    const equipped = chooseEquipmentOptions(chart, sixOptions);
    expect(equipped.healingPotionDoses).toBe(1);
  });

  it('never grants a starting map (unlike every other Magnakai book)', () => {
    const chart = createFreshCharacterForBook('tpt', () => 0);
    expect(chart.specialItems.some((i) => i.name.startsWith('Map'))).toBe(false);
  });

  it('rejects a selection that is not exactly six options', () => {
    const chart = createFreshCharacterForBook('tpt', () => 0);
    expect(() => chooseEquipmentOptions(chart, sixOptions.slice(0, 5))).toThrow();
    expect(() => chooseEquipmentOptions(chart, [...sixOptions, 'dagger'])).toThrow();
  });
});

describe('chooseEquipmentOptions (book "tmd", choose-six)', () => {
  const sixOptions = ['sword', 'bow', 'quiver', 'rope', 'meals', 'quarterstaff'];

  it('grants Sword and Bow weapons (Quarterstaff picked too, but MAX_WEAPONS caps carried weapons at 2)', () => {
    const chart = createFreshCharacterForBook('tmd', () => 0);
    const equipped = chooseEquipmentOptions(chart, sixOptions);
    expect(equipped.weapons).toContain('Sword');
    expect(equipped.weapons).toContain('Bow');
    expect(equipped.weapons).not.toContain('Quarterstaff');
  });

  it('grants the Quarterstaff option when there is room for it', () => {
    const chart = createFreshCharacterForBook('tmd', () => 0);
    const equipped = chooseEquipmentOptions(chart, ['sword', 'quarterstaff', 'quiver', 'rope', 'meals', 'dagger']);
    expect(equipped.weapons).toContain('Quarterstaff');
  });

  it('grants 6 Arrows from the Quiver option', () => {
    const chart = createFreshCharacterForBook('tmd', () => 0);
    const equipped = chooseEquipmentOptions(chart, sixOptions);
    expect(equipped.arrows).toBe(6);
  });

  it('grants 4 Meals from the Meals option (not the usual 3)', () => {
    const chart = createFreshCharacterForBook('tmd', () => 0);
    const equipped = chooseEquipmentOptions(chart, sixOptions);
    expect(equipped.meals).toBe(4);
  });

  it('grants an Axe weapon via the axe option', () => {
    const chart = createFreshCharacterForBook('tmd', () => 0);
    const equipped = chooseEquipmentOptions(chart, ['axe', 'quiver', 'rope', 'potion-of-laumspur', 'meals', 'lantern']);
    expect(equipped.weapons).toContain('Axe');
  });

  it('always starts with the Map of the Darklands', () => {
    const chart = createFreshCharacterForBook('tmd', () => 0);
    expect(chart.specialItems.map((i) => i.name)).toContain('Map of the Darklands');
  });

  it('rejects a selection that is not exactly six options', () => {
    const chart = createFreshCharacterForBook('tmd', () => 0);
    expect(() => chooseEquipmentOptions(chart, sixOptions.slice(0, 5))).toThrow();
    expect(() => chooseEquipmentOptions(chart, [...sixOptions, 'dagger'])).toThrow();
  });
});

describe('chooseEquipmentOptions (book "tplr", choose-five)', () => {
  const fiveOptions = ['bow', 'quiver', 'meals', 'rope', 'potion-of-laumspur'];

  it('grants the new Bow weapon', () => {
    const chart = createFreshCharacterForBook('tplr', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.weapons).toContain('Bow');
  });

  it('grants 6 Arrows from the Quiver option', () => {
    const chart = createFreshCharacterForBook('tplr', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.arrows).toBe(6);
  });

  it('grants 4 Meals from the Meals option', () => {
    const chart = createFreshCharacterForBook('tplr', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.meals).toBe(4);
  });

  it('grants a Potion of Laumspur dose', () => {
    const chart = createFreshCharacterForBook('tplr', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.healingPotionDoses).toBe(1);
  });

  it('always starts with the Map of Ruel', () => {
    const chart = createFreshCharacterForBook('tplr', () => 0);
    expect(chart.specialItems.map((i) => i.name)).toContain('Map of Ruel');
  });

  it('rolls gold with a +20 bonus, higher than every prior book\'s +10', () => {
    const chart = createFreshCharacterForBook('tplr', () => 0);
    expect(chart.goldCrowns).toBe(20);
  });

  it('allows carrying up to 10 Backpack Items instead of the usual 8', () => {
    const chart = createFreshCharacterForBook('tplr', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    // 4 Meals + Rope = 5 backpack slots used, well within the raised 10-slot cap.
    expect(equipped.meals + equipped.backpackItems.length).toBeLessThanOrEqual(10);
    expect(equipped.backpackItems).toContain('Rope');
  });

  it('rejects a selection that is not exactly five options', () => {
    const chart = createFreshCharacterForBook('tplr', () => 0);
    expect(() => chooseEquipmentOptions(chart, fiveOptions.slice(0, 4))).toThrow();
    expect(() => chooseEquipmentOptions(chart, [...fiveOptions, 'sword'])).toThrow();
  });
});

describe('chooseEquipmentOptions (book "tcok", choose-five)', () => {
  const fiveOptions = ['bow', 'quiver', 'meals', 'rope', 'potion-of-laumspur'];

  it('grants the new Bow weapon', () => {
    const chart = createFreshCharacterForBook('tcok', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.weapons).toContain('Bow');
  });

  it('grants 6 Arrows from the Quiver option', () => {
    const chart = createFreshCharacterForBook('tcok', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.arrows).toBe(6);
  });

  it('grants 4 Meals from the Meals option', () => {
    const chart = createFreshCharacterForBook('tcok', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.meals).toBe(4);
  });

  it('grants a Potion of Laumspur dose', () => {
    const chart = createFreshCharacterForBook('tcok', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.healingPotionDoses).toBe(1);
  });

  it('always starts with the Map of the Darklands', () => {
    const chart = createFreshCharacterForBook('tcok', () => 0);
    expect(chart.specialItems.map((i) => i.name)).toContain('Map of the Darklands');
  });

  it('rolls gold with a +20 bonus, same as tplr', () => {
    const chart = createFreshCharacterForBook('tcok', () => 0);
    expect(chart.goldCrowns).toBe(20);
  });

  it('allows carrying up to 10 Backpack Items instead of the usual 8', () => {
    const chart = createFreshCharacterForBook('tcok', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.meals + equipped.backpackItems.length).toBeLessThanOrEqual(10);
    expect(equipped.backpackItems).toContain('Rope');
  });

  it('rejects a selection that is not exactly five options', () => {
    const chart = createFreshCharacterForBook('tcok', () => 0);
    expect(() => chooseEquipmentOptions(chart, fiveOptions.slice(0, 4))).toThrow();
    expect(() => chooseEquipmentOptions(chart, [...fiveOptions, 'sword'])).toThrow();
  });
});

describe('chooseEquipmentOptions (book "tdc", choose-five)', () => {
  const fiveOptions = ['bow', 'quiver', 'meals', 'rope', 'potion-of-laumspur'];

  it('grants the new Bow weapon', () => {
    const chart = createFreshCharacterForBook('tdc', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.weapons).toContain('Bow');
  });

  it('grants 6 Arrows from the Quiver option', () => {
    const chart = createFreshCharacterForBook('tdc', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.arrows).toBe(6);
  });

  it('grants 4 Meals from the Meals option', () => {
    const chart = createFreshCharacterForBook('tdc', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.meals).toBe(4);
  });

  it('grants a Potion of Laumspur dose', () => {
    const chart = createFreshCharacterForBook('tdc', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.healingPotionDoses).toBe(1);
  });

  it('always starts with the Map of the Western Tentarias', () => {
    const chart = createFreshCharacterForBook('tdc', () => 0);
    expect(chart.specialItems.map((i) => i.name)).toContain('Map of the Western Tentarias');
  });

  it('rolls gold with a +20 bonus, same as tplr/tcok', () => {
    const chart = createFreshCharacterForBook('tdc', () => 0);
    expect(chart.goldCrowns).toBe(20);
  });

  it('allows carrying up to 10 Backpack Items instead of the usual 8', () => {
    const chart = createFreshCharacterForBook('tdc', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.meals + equipped.backpackItems.length).toBeLessThanOrEqual(10);
    expect(equipped.backpackItems).toContain('Rope');
  });

  it('rejects a selection that is not exactly five options', () => {
    const chart = createFreshCharacterForBook('tdc', () => 0);
    expect(() => chooseEquipmentOptions(chart, fiveOptions.slice(0, 4))).toThrow();
    expect(() => chooseEquipmentOptions(chart, [...fiveOptions, 'sword'])).toThrow();
  });
});

describe('chooseEquipmentOptions (book "tlv", choose-four)', () => {
  const fourOptions = ['bow', 'quiver', 'meals', 'potion-of-laumspur'];

  it('grants the new Bow weapon', () => {
    const chart = createFreshCharacterForBook('tlv', () => 0);
    const equipped = chooseEquipmentOptions(chart, fourOptions);
    expect(equipped.weapons).toContain('Bow');
  });

  it('grants 6 Arrows from the Quiver option', () => {
    const chart = createFreshCharacterForBook('tlv', () => 0);
    const equipped = chooseEquipmentOptions(chart, fourOptions);
    expect(equipped.arrows).toBe(6);
  });

  it('grants 2 Meals from the Meals option (not 4, unlike tplr/tcok/tdc)', () => {
    const chart = createFreshCharacterForBook('tlv', () => 0);
    const equipped = chooseEquipmentOptions(chart, fourOptions);
    expect(equipped.meals).toBe(2);
  });

  it('grants a Potion of Laumspur dose', () => {
    const chart = createFreshCharacterForBook('tlv', () => 0);
    const equipped = chooseEquipmentOptions(chart, fourOptions);
    expect(equipped.healingPotionDoses).toBe(1);
  });

  it('offers Quarterstaff instead of Spear', () => {
    const chart = createFreshCharacterForBook('tlv', () => 0);
    const equipped = chooseEquipmentOptions(chart, ['quarterstaff', 'quiver', 'meals', 'potion-of-laumspur']);
    expect(equipped.weapons).toContain('Quarterstaff');
  });

  it('always starts with the Map of the Maakengorge', () => {
    const chart = createFreshCharacterForBook('tlv', () => 0);
    expect(chart.specialItems.map((i) => i.name)).toContain('Map of the Maakengorge');
  });

  it('rolls gold with a +20 bonus, same as tplr/tcok/tdc', () => {
    const chart = createFreshCharacterForBook('tlv', () => 0);
    expect(chart.goldCrowns).toBe(20);
  });

  it('allows carrying up to 10 Backpack Items instead of the usual 8', () => {
    const chart = createFreshCharacterForBook('tlv', () => 0);
    const equipped = chooseEquipmentOptions(chart, [...fourOptions.slice(0, 3), 'rope']);
    expect(equipped.backpackItems).toContain('Rope');
  });

  it('rejects a selection that is not exactly four options', () => {
    const chart = createFreshCharacterForBook('tlv', () => 0);
    expect(() => chooseEquipmentOptions(chart, fourOptions.slice(0, 3))).toThrow();
    expect(() => chooseEquipmentOptions(chart, [...fourOptions, 'sword'])).toThrow();
  });
});

describe('chooseEquipmentOptions (book "tdi", choose-four)', () => {
  const fourOptions = ['bow', 'quiver', 'meals', 'potion-of-laumspur'];

  it('grants the new Bow weapon', () => {
    const chart = createFreshCharacterForBook('tdi', () => 0);
    const equipped = chooseEquipmentOptions(chart, fourOptions);
    expect(equipped.weapons).toContain('Bow');
  });

  it('grants 6 Arrows from the Quiver option', () => {
    const chart = createFreshCharacterForBook('tdi', () => 0);
    const equipped = chooseEquipmentOptions(chart, fourOptions);
    expect(equipped.arrows).toBe(6);
  });

  it('grants 2 Meals from the Meals option', () => {
    const chart = createFreshCharacterForBook('tdi', () => 0);
    const equipped = chooseEquipmentOptions(chart, fourOptions);
    expect(equipped.meals).toBe(2);
  });

  it('grants a Potion of Laumspur dose', () => {
    const chart = createFreshCharacterForBook('tdi', () => 0);
    const equipped = chooseEquipmentOptions(chart, fourOptions);
    expect(equipped.healingPotionDoses).toBe(1);
  });

  it('offers Broadsword instead of Quarterstaff/Spear (never offered as a starting weapon before)', () => {
    const chart = createFreshCharacterForBook('tdi', () => 0);
    const equipped = chooseEquipmentOptions(chart, ['broadsword', 'quiver', 'meals', 'potion-of-laumspur']);
    expect(equipped.weapons).toContain('Broadsword');
  });

  it('always starts with the Map of Ixia and the Hardlands', () => {
    const chart = createFreshCharacterForBook('tdi', () => 0);
    expect(chart.specialItems.map((i) => i.name)).toContain('Map of Ixia and the Hardlands');
  });

  it('rolls gold with a +20 bonus, same as tplr/tcok/tdc/tlv', () => {
    const chart = createFreshCharacterForBook('tdi', () => 0);
    expect(chart.goldCrowns).toBe(20);
  });

  it('allows carrying up to 10 Backpack Items instead of the usual 8', () => {
    const chart = createFreshCharacterForBook('tdi', () => 0);
    const equipped = chooseEquipmentOptions(chart, [...fourOptions.slice(0, 3), 'rope']);
    expect(equipped.backpackItems).toContain('Rope');
  });

  it('rejects a selection that is not exactly four options', () => {
    const chart = createFreshCharacterForBook('tdi', () => 0);
    expect(() => chooseEquipmentOptions(chart, fourOptions.slice(0, 3))).toThrow();
    expect(() => chooseEquipmentOptions(chart, [...fourOptions, 'sword'])).toThrow();
  });
});

describe('chooseEquipmentOptions (book "dd", choose-four)', () => {
  const fourOptions = ['bow', 'quiver', 'meals', 'potion-of-laumspur'];

  it('grants the new Bow weapon', () => {
    const chart = createFreshCharacterForBook('dd', () => 0);
    const equipped = chooseEquipmentOptions(chart, fourOptions);
    expect(equipped.weapons).toContain('Bow');
  });

  it('grants 6 Arrows from the Quiver option', () => {
    const chart = createFreshCharacterForBook('dd', () => 0);
    const equipped = chooseEquipmentOptions(chart, fourOptions);
    expect(equipped.arrows).toBe(6);
  });

  it('grants 2 Meals from the Meals option', () => {
    const chart = createFreshCharacterForBook('dd', () => 0);
    const equipped = chooseEquipmentOptions(chart, fourOptions);
    expect(equipped.meals).toBe(2);
  });

  it('grants a Potion of Laumspur dose', () => {
    const chart = createFreshCharacterForBook('dd', () => 0);
    const equipped = chooseEquipmentOptions(chart, fourOptions);
    expect(equipped.healingPotionDoses).toBe(1);
  });

  it('offers Quarterstaff again, in place of tdi\'s Broadsword (a one-book swap, not a permanent replacement)', () => {
    const chart = createFreshCharacterForBook('dd', () => 0);
    const equipped = chooseEquipmentOptions(chart, ['quarterstaff', 'quiver', 'meals', 'potion-of-laumspur']);
    expect(equipped.weapons).toContain('Quarterstaff');
  });

  it('always starts with the Map of Northern Magnamund', () => {
    const chart = createFreshCharacterForBook('dd', () => 0);
    expect(chart.specialItems.map((i) => i.name)).toContain('Map of Northern Magnamund');
  });

  it('rolls gold with a +20 bonus, same as tplr/tcok/tdc/tlv/tdi', () => {
    const chart = createFreshCharacterForBook('dd', () => 0);
    expect(chart.goldCrowns).toBe(20);
  });

  it('allows carrying up to 10 Backpack Items instead of the usual 8', () => {
    const chart = createFreshCharacterForBook('dd', () => 0);
    const equipped = chooseEquipmentOptions(chart, [...fourOptions.slice(0, 3), 'rope']);
    expect(equipped.backpackItems).toContain('Rope');
  });

  it('rejects a selection that is not exactly four options', () => {
    const chart = createFreshCharacterForBook('dd', () => 0);
    expect(() => chooseEquipmentOptions(chart, fourOptions.slice(0, 3))).toThrow();
    expect(() => chooseEquipmentOptions(chart, [...fourOptions, 'sword'])).toThrow();
  });
});

describe('chooseEquipmentOptions (book "wb", choose-four)', () => {
  const fourOptions = ['bow', 'quiver', 'meals', 'potion-of-laumspur'];

  it('grants the new Bow weapon', () => {
    const chart = createFreshCharacterForBook('wb', () => 0);
    const equipped = chooseEquipmentOptions(chart, fourOptions);
    expect(equipped.weapons).toContain('Bow');
  });

  it('grants 6 Arrows from the Quiver option', () => {
    const chart = createFreshCharacterForBook('wb', () => 0);
    const equipped = chooseEquipmentOptions(chart, fourOptions);
    expect(equipped.arrows).toBe(6);
  });

  it('grants 2 Meals from the Meals option', () => {
    const chart = createFreshCharacterForBook('wb', () => 0);
    const equipped = chooseEquipmentOptions(chart, fourOptions);
    expect(equipped.meals).toBe(2);
  });

  it('grants a Potion of Laumspur dose', () => {
    const chart = createFreshCharacterForBook('wb', () => 0);
    const equipped = chooseEquipmentOptions(chart, fourOptions);
    expect(equipped.healingPotionDoses).toBe(1);
  });

  it('offers Broadsword again, in place of dd\'s Quarterstaff (the same alternation as Book 17/18)', () => {
    const chart = createFreshCharacterForBook('wb', () => 0);
    const equipped = chooseEquipmentOptions(chart, ['broadsword', 'quiver', 'meals', 'potion-of-laumspur']);
    expect(equipped.weapons).toContain('Broadsword');
  });

  it('always starts with the Map of Sommerlund and the Wildlands', () => {
    const chart = createFreshCharacterForBook('wb', () => 0);
    expect(chart.specialItems.map((i) => i.name)).toContain('Map of Sommerlund and the Wildlands');
  });

  it('rolls gold with a +20 bonus, same as tplr/tcok/tdc/tlv/tdi/dd', () => {
    const chart = createFreshCharacterForBook('wb', () => 0);
    expect(chart.goldCrowns).toBe(20);
  });

  it('allows carrying up to 10 Backpack Items instead of the usual 8', () => {
    const chart = createFreshCharacterForBook('wb', () => 0);
    const equipped = chooseEquipmentOptions(chart, [...fourOptions.slice(0, 3), 'rope']);
    expect(equipped.backpackItems).toContain('Rope');
  });

  it('rejects a selection that is not exactly four options', () => {
    const chart = createFreshCharacterForBook('wb', () => 0);
    expect(() => chooseEquipmentOptions(chart, fourOptions.slice(0, 3))).toThrow();
    expect(() => chooseEquipmentOptions(chart, [...fourOptions, 'sword'])).toThrow();
  });
});

describe('chooseEquipmentOptions (book "tcn", choose-four)', () => {
  const fourOptions = ['bow', 'quiver', 'meals', 'potion-of-laumspur'];

  it('grants the new Bow weapon', () => {
    const chart = createFreshCharacterForBook('tcn', () => 0);
    const equipped = chooseEquipmentOptions(chart, fourOptions);
    expect(equipped.weapons).toContain('Bow');
  });

  it('grants 6 Arrows from the Quiver option', () => {
    const chart = createFreshCharacterForBook('tcn', () => 0);
    const equipped = chooseEquipmentOptions(chart, fourOptions);
    expect(equipped.arrows).toBe(6);
  });

  it('grants 2 Meals from the Meals option', () => {
    const chart = createFreshCharacterForBook('tcn', () => 0);
    const equipped = chooseEquipmentOptions(chart, fourOptions);
    expect(equipped.meals).toBe(2);
  });

  it('grants a Potion of Laumspur dose', () => {
    const chart = createFreshCharacterForBook('tcn', () => 0);
    const equipped = chooseEquipmentOptions(chart, fourOptions);
    expect(equipped.healingPotionDoses).toBe(1);
  });

  it('offers Quarterstaff and Broadsword together for the first time (Books 17-19 only ever alternated between them)', () => {
    const chart = createFreshCharacterForBook('tcn', () => 0);
    const equipped = chooseEquipmentOptions(chart, ['quarterstaff', 'broadsword', 'quiver', 'meals']);
    expect(equipped.weapons).toContain('Quarterstaff');
    expect(equipped.weapons).toContain('Broadsword');
  });

  it('always starts with the Map of the Planes of Existence', () => {
    const chart = createFreshCharacterForBook('tcn', () => 0);
    expect(chart.specialItems.map((i) => i.name)).toContain('Map of the Planes of Existence');
  });

  it('rolls gold with a +20 bonus, same as tplr/tcok/tdc/tlv/tdi/dd/wb', () => {
    const chart = createFreshCharacterForBook('tcn', () => 0);
    expect(chart.goldCrowns).toBe(20);
  });

  it('allows carrying up to 10 Backpack Items instead of the usual 8', () => {
    const chart = createFreshCharacterForBook('tcn', () => 0);
    const equipped = chooseEquipmentOptions(chart, [...fourOptions.slice(0, 3), 'rope']);
    expect(equipped.backpackItems).toContain('Rope');
  });

  it('rejects a selection that is not exactly four options', () => {
    const chart = createFreshCharacterForBook('tcn', () => 0);
    expect(() => chooseEquipmentOptions(chart, fourOptions.slice(0, 3))).toThrow();
    expect(() => chooseEquipmentOptions(chart, [...fourOptions, 'sword'])).toThrow();
  });
});

describe('chooseEquipmentOptions (book "vm", choose-five) - first book of the New Order phase', () => {
  const fiveOptions = ['bow', 'quiver', 'flute', 'meals', 'potion-of-laumspur'];

  it('grants the new Bow weapon', () => {
    const chart = createFreshCharacterForBook('vm', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.weapons).toContain('Bow');
  });

  it('grants 6 Arrows from the Quiver option', () => {
    const chart = createFreshCharacterForBook('vm', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.arrows).toBe(6);
  });

  it('grants the new Flute backpack item (never offered before)', () => {
    const chart = createFreshCharacterForBook('vm', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.backpackItems).toContain('Flute');
  });

  it('grants 2 Meals from the Meals option', () => {
    const chart = createFreshCharacterForBook('vm', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.meals).toBe(2);
  });

  it('grants a Potion of Laumspur dose', () => {
    const chart = createFreshCharacterForBook('vm', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.healingPotionDoses).toBe(1);
  });

  it('offers Quarterstaff and Broadsword together, same as tcn', () => {
    const chart = createFreshCharacterForBook('vm', () => 0);
    const equipped = chooseEquipmentOptions(chart, ['quarterstaff', 'quiver', 'flute', 'meals', 'potion-of-laumspur']);
    expect(equipped.weapons).toContain('Quarterstaff');
  });

  it('always starts with the Map of the Coastal Route', () => {
    const chart = createFreshCharacterForBook('vm', () => 0);
    expect(chart.specialItems.map((i) => i.name)).toContain('Map of the Coastal Route');
  });

  it('rolls gold with a +20 bonus, same as every Grand Master-era book', () => {
    const chart = createFreshCharacterForBook('vm', () => 0);
    expect(chart.goldCrowns).toBe(20);
  });

  it('rejects a selection that is not exactly five options', () => {
    const chart = createFreshCharacterForBook('vm', () => 0);
    expect(() => chooseEquipmentOptions(chart, fiveOptions.slice(0, 4))).toThrow();
    expect(() => chooseEquipmentOptions(chart, [...fiveOptions, 'sword'])).toThrow();
  });
});

describe('chooseEquipmentOptions (book "tbs", choose-five) - second book of the New Order phase', () => {
  const fiveOptions = ['bow', 'quiver', 'flute', 'meals', 'potion-of-laumspur'];

  it('grants the new Bow weapon', () => {
    const chart = createFreshCharacterForBook('tbs', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.weapons).toContain('Bow');
  });

  it('grants 6 Arrows from the Quiver option', () => {
    const chart = createFreshCharacterForBook('tbs', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.arrows).toBe(6);
  });

  it('always starts with the Map of Southeastern Magnamund', () => {
    const chart = createFreshCharacterForBook('tbs', () => 0);
    expect(chart.specialItems.map((i) => i.name)).toContain('Map of Southeastern Magnamund');
  });

  it('rolls gold with a +20 bonus, same as vm', () => {
    const chart = createFreshCharacterForBook('tbs', () => 0);
    expect(chart.goldCrowns).toBe(20);
  });

  it('rejects a selection that is not exactly five options', () => {
    const chart = createFreshCharacterForBook('tbs', () => 0);
    expect(() => chooseEquipmentOptions(chart, fiveOptions.slice(0, 4))).toThrow();
    expect(() => chooseEquipmentOptions(chart, [...fiveOptions, 'sword'])).toThrow();
  });
});

describe('carryOverCharacterToBook within the New Order phase, book "vm" -> "tbs" (regression)', () => {
  it('preserves kaiName and kaiWeaponType without resetting them - the character-creation screen must not re-prompt for either (see needsKaiWeapon/needsKaiName)', () => {
    const chart: ActionChart = {
      ...createFreshCharacterForBook('vm', fixedRng(0, 0, 0, 0)),
      kaiName: 'SwiftBlade',
      kaiWeaponType: 'Broadsword',
      specialItems: [{ name: 'Illuminatus' }],
      grandMasterDisciplines: ['GrandWeaponmastery', 'Deliverance', 'GrandHuntmastery', 'Telegnosis', 'Astrology'],
    };
    const carried = carryOverCharacterToBook(chart, 'tbs', fixedRng(0));
    expect(carried.kaiName).toBe('SwiftBlade');
    expect(carried.kaiWeaponType).toBe('Broadsword');
    expect(carried.specialItems.map((i) => i.name)).toContain('Illuminatus');
    expect(carried.grandMasterDisciplines).toEqual(chart.grandMasterDisciplines);
  });
});

describe('chooseEquipmentOptions (book "mh", choose-five) - third book of the New Order phase', () => {
  const fiveOptions = ['bow', 'quiver', 'flute', 'meals', 'potion-of-laumspur'];

  it('grants the new Bow weapon', () => {
    const chart = createFreshCharacterForBook('mh', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.weapons).toContain('Bow');
  });

  it('grants 6 Arrows from the Quiver option', () => {
    const chart = createFreshCharacterForBook('mh', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.arrows).toBe(6);
  });

  it('always starts with the Map of Central Southern Magnamund', () => {
    const chart = createFreshCharacterForBook('mh', () => 0);
    expect(chart.specialItems.map((i) => i.name)).toContain('Map of Central Southern Magnamund');
  });

  it('rolls gold with a +20 bonus, same as vm/tbs', () => {
    const chart = createFreshCharacterForBook('mh', () => 0);
    expect(chart.goldCrowns).toBe(20);
  });

  it('rejects a selection that is not exactly five options', () => {
    const chart = createFreshCharacterForBook('mh', () => 0);
    expect(() => chooseEquipmentOptions(chart, fiveOptions.slice(0, 4))).toThrow();
    expect(() => chooseEquipmentOptions(chart, [...fiveOptions, 'sword'])).toThrow();
  });
});

describe('carryOverCharacterToBook within the New Order phase, book "tbs" -> "mh" (regression)', () => {
  it('preserves kaiName and kaiWeaponType without resetting them - the character-creation screen must not re-prompt for either (see needsKaiWeapon/needsKaiName)', () => {
    const chart: ActionChart = {
      ...createFreshCharacterForBook('tbs', fixedRng(0, 0, 0, 0)),
      kaiName: 'SwiftBlade',
      kaiWeaponType: 'Broadsword',
      specialItems: [{ name: 'Illuminatus' }],
      grandMasterDisciplines: ['GrandWeaponmastery', 'Deliverance', 'GrandHuntmastery', 'Telegnosis', 'Astrology', 'Herbmastery'],
    };
    const carried = carryOverCharacterToBook(chart, 'mh', fixedRng(0));
    expect(carried.kaiName).toBe('SwiftBlade');
    expect(carried.kaiWeaponType).toBe('Broadsword');
    expect(carried.specialItems.map((i) => i.name)).toContain('Illuminatus');
    expect(carried.grandMasterDisciplines).toEqual(chart.grandMasterDisciplines);
  });
});

describe('chooseEquipmentOptions (book "rw", choose-five) - fourth book of the New Order phase', () => {
  // First genuine equipment-list change since vm (Book 21): Quarterstaff -> Broadsword, Flute -> Lute.
  const fiveOptions = ['bow', 'quiver', 'lute', 'meals', 'potion-of-laumspur'];

  it('grants the new Bow weapon', () => {
    const chart = createFreshCharacterForBook('rw', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.weapons).toContain('Bow');
  });

  it('grants 6 Arrows from the Quiver option', () => {
    const chart = createFreshCharacterForBook('rw', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.arrows).toBe(6);
  });

  it('grants the Lute as a Backpack Item (replaces the Flute option from earlier New Order books)', () => {
    const chart = createFreshCharacterForBook('rw', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.backpackItems).toContain('Lute');
  });

  it('offers Broadsword instead of Quarterstaff', () => {
    const chart = createFreshCharacterForBook('rw', () => 0);
    const equipped = chooseEquipmentOptions(chart, ['broadsword', 'quiver', 'lute', 'meals', 'potion-of-laumspur']);
    expect(equipped.weapons).toContain('Broadsword');
    expect(() => chooseEquipmentOptions(chart, ['quarterstaff', 'quiver', 'lute', 'meals', 'potion-of-laumspur'])).toThrow();
  });

  it('always starts with the Map of the Stornlands', () => {
    const chart = createFreshCharacterForBook('rw', () => 0);
    expect(chart.specialItems.map((i) => i.name)).toContain('Map of the Stornlands');
  });

  it('rolls gold with a +20 bonus, same as vm/tbs/mh', () => {
    const chart = createFreshCharacterForBook('rw', () => 0);
    expect(chart.goldCrowns).toBe(20);
  });

  it('rejects a selection that is not exactly five options', () => {
    const chart = createFreshCharacterForBook('rw', () => 0);
    expect(() => chooseEquipmentOptions(chart, fiveOptions.slice(0, 4))).toThrow();
    expect(() => chooseEquipmentOptions(chart, [...fiveOptions, 'sword'])).toThrow();
  });
});

describe('carryOverCharacterToBook within the New Order phase, book "mh" -> "rw" (regression)', () => {
  it('preserves kaiName and kaiWeaponType without resetting them - the character-creation screen must not re-prompt for either (see needsKaiWeapon/needsKaiName)', () => {
    const chart: ActionChart = {
      ...createFreshCharacterForBook('mh', fixedRng(0, 0, 0, 0)),
      kaiName: 'SwiftBlade',
      kaiWeaponType: 'Broadsword',
      specialItems: [{ name: 'Illuminatus' }],
      grandMasterDisciplines: ['GrandWeaponmastery', 'Deliverance', 'GrandHuntmastery', 'Telegnosis', 'Astrology', 'Herbmastery', 'Elementalism'],
    };
    const carried = carryOverCharacterToBook(chart, 'rw', fixedRng(0));
    expect(carried.kaiName).toBe('SwiftBlade');
    expect(carried.kaiWeaponType).toBe('Broadsword');
    expect(carried.specialItems.map((i) => i.name)).toContain('Illuminatus');
    expect(carried.grandMasterDisciplines).toEqual(chart.grandMasterDisciplines);
  });
});

describe('chooseEquipmentOptions (book "tw", choose-five) - fifth book of the New Order phase', () => {
  // Flute reverts back from Lute (rw, Book 24); Broadsword stays, Quarterstaff does not come back.
  const fiveOptions = ['bow', 'quiver', 'flute', 'meals', 'potion-of-laumspur'];

  it('grants the new Bow weapon', () => {
    const chart = createFreshCharacterForBook('tw', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.weapons).toContain('Bow');
  });

  it('grants 6 Arrows from the Quiver option', () => {
    const chart = createFreshCharacterForBook('tw', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.arrows).toBe(6);
  });

  it('grants the Flute as a Backpack Item again (Lute was only used in rw, Book 24)', () => {
    const chart = createFreshCharacterForBook('tw', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.backpackItems).toContain('Flute');
  });

  it('still offers Broadsword (kept from rw), not Quarterstaff', () => {
    const chart = createFreshCharacterForBook('tw', () => 0);
    const equipped = chooseEquipmentOptions(chart, ['broadsword', 'quiver', 'flute', 'meals', 'potion-of-laumspur']);
    expect(equipped.weapons).toContain('Broadsword');
    expect(() => chooseEquipmentOptions(chart, ['quarterstaff', 'quiver', 'flute', 'meals', 'potion-of-laumspur'])).toThrow();
  });

  it('always starts with the Map of Gazad Helkona & Surrounding Territories', () => {
    const chart = createFreshCharacterForBook('tw', () => 0);
    expect(chart.specialItems.map((i) => i.name)).toContain('Map of Gazad Helkona & Surrounding Territories');
  });

  it('rolls gold with a +20 bonus, same as vm/tbs/mh/rw', () => {
    const chart = createFreshCharacterForBook('tw', () => 0);
    expect(chart.goldCrowns).toBe(20);
  });

  it('rejects a selection that is not exactly five options', () => {
    const chart = createFreshCharacterForBook('tw', () => 0);
    expect(() => chooseEquipmentOptions(chart, fiveOptions.slice(0, 4))).toThrow();
    expect(() => chooseEquipmentOptions(chart, [...fiveOptions, 'sword'])).toThrow();
  });
});

describe('carryOverCharacterToBook within the New Order phase, book "rw" -> "tw" (regression)', () => {
  it('preserves kaiName and kaiWeaponType without resetting them - the character-creation screen must not re-prompt for either (see needsKaiWeapon/needsKaiName)', () => {
    const chart: ActionChart = {
      ...createFreshCharacterForBook('rw', fixedRng(0, 0, 0, 0)),
      kaiName: 'SwiftBlade',
      kaiWeaponType: 'Broadsword',
      specialItems: [{ name: 'Illuminatus' }],
      grandMasterDisciplines: ['GrandWeaponmastery', 'Deliverance', 'GrandHuntmastery', 'Telegnosis', 'Astrology', 'Herbmastery', 'Elementalism', 'Bardsmanship'],
    };
    const carried = carryOverCharacterToBook(chart, 'tw', fixedRng(0));
    expect(carried.kaiName).toBe('SwiftBlade');
    expect(carried.kaiWeaponType).toBe('Broadsword');
    expect(carried.specialItems.map((i) => i.name)).toContain('Illuminatus');
    expect(carried.grandMasterDisciplines).toEqual(chart.grandMasterDisciplines);
  });
});

describe('chooseEquipmentOptions (book "tfbm", choose-five) - sixth book of the New Order phase', () => {
  // Same 10 items as tw (Book 25), just reordered on the page - no item swap this time.
  const fiveOptions = ['bow', 'quiver', 'flute', 'meals', 'potion-of-laumspur'];

  it('grants the new Bow weapon', () => {
    const chart = createFreshCharacterForBook('tfbm', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.weapons).toContain('Bow');
  });

  it('grants 6 Arrows from the Quiver option', () => {
    const chart = createFreshCharacterForBook('tfbm', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.arrows).toBe(6);
  });

  it('still offers Broadsword and Flute, same categories as tw', () => {
    const chart = createFreshCharacterForBook('tfbm', () => 0);
    const equipped = chooseEquipmentOptions(chart, ['broadsword', 'quiver', 'flute', 'meals', 'potion-of-laumspur']);
    expect(equipped.weapons).toContain('Broadsword');
    expect(equipped.backpackItems).toContain('Flute');
  });

  it('always starts with the Map of Bor and its Surrounding Territories', () => {
    const chart = createFreshCharacterForBook('tfbm', () => 0);
    expect(chart.specialItems.map((i) => i.name)).toContain('Map of Bor and its Surrounding Territories');
  });

  it('rolls gold with a +20 bonus, same as vm/tbs/mh/rw/tw', () => {
    const chart = createFreshCharacterForBook('tfbm', () => 0);
    expect(chart.goldCrowns).toBe(20);
  });

  it('rejects a selection that is not exactly five options', () => {
    const chart = createFreshCharacterForBook('tfbm', () => 0);
    expect(() => chooseEquipmentOptions(chart, fiveOptions.slice(0, 4))).toThrow();
    expect(() => chooseEquipmentOptions(chart, [...fiveOptions, 'sword'])).toThrow();
  });
});

describe('carryOverCharacterToBook within the New Order phase, book "tw" -> "tfbm" (regression)', () => {
  it('preserves kaiName and kaiWeaponType without resetting them - the character-creation screen must not re-prompt for either (see needsKaiWeapon/needsKaiName)', () => {
    const chart: ActionChart = {
      ...createFreshCharacterForBook('tw', fixedRng(0, 0, 0, 0)),
      kaiName: 'SwiftBlade',
      kaiWeaponType: 'Broadsword',
      specialItems: [{ name: 'Illuminatus' }],
      grandMasterDisciplines: ['GrandWeaponmastery', 'Deliverance', 'GrandHuntmastery', 'Telegnosis', 'Astrology', 'Herbmastery', 'Elementalism', 'Bardsmanship', 'KaiSurge'],
    };
    const carried = carryOverCharacterToBook(chart, 'tfbm', fixedRng(0));
    expect(carried.kaiName).toBe('SwiftBlade');
    expect(carried.kaiWeaponType).toBe('Broadsword');
    expect(carried.specialItems.map((i) => i.name)).toContain('Illuminatus');
    expect(carried.grandMasterDisciplines).toEqual(chart.grandMasterDisciplines);
  });
});

describe('chooseEquipmentOptions (book "v", choose-five) - seventh book of the New Order phase', () => {
  // Same 10 items as tfbm (Book 26), same order this time too - no reshuffle, no swap.
  const fiveOptions = ['bow', 'quiver', 'flute', 'meals', 'potion-of-laumspur'];

  it('grants the new Bow weapon', () => {
    const chart = createFreshCharacterForBook('v', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.weapons).toContain('Bow');
  });

  it('grants 6 Arrows from the Quiver option', () => {
    const chart = createFreshCharacterForBook('v', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.arrows).toBe(6);
  });

  it('still offers Broadsword and Flute, same categories as tfbm', () => {
    const chart = createFreshCharacterForBook('v', () => 0);
    const equipped = chooseEquipmentOptions(chart, ['broadsword', 'quiver', 'flute', 'meals', 'potion-of-laumspur']);
    expect(equipped.weapons).toContain('Broadsword');
    expect(equipped.backpackItems).toContain('Flute');
  });

  it('always starts with the Map of Bhanar and the Chai Borderlands', () => {
    const chart = createFreshCharacterForBook('v', () => 0);
    expect(chart.specialItems.map((i) => i.name)).toContain('Map of Bhanar and the Chai Borderlands');
  });

  it('rolls gold with a +20 bonus, same as vm/tbs/mh/rw/tw/tfbm', () => {
    const chart = createFreshCharacterForBook('v', () => 0);
    expect(chart.goldCrowns).toBe(20);
  });

  it('rejects a selection that is not exactly five options', () => {
    const chart = createFreshCharacterForBook('v', () => 0);
    expect(() => chooseEquipmentOptions(chart, fiveOptions.slice(0, 4))).toThrow();
    expect(() => chooseEquipmentOptions(chart, [...fiveOptions, 'sword'])).toThrow();
  });
});

describe('carryOverCharacterToBook within the New Order phase, book "tfbm" -> "v" (regression)', () => {
  it('preserves kaiName and kaiWeaponType without resetting them - the character-creation screen must not re-prompt for either (see needsKaiWeapon/needsKaiName)', () => {
    const chart: ActionChart = {
      ...createFreshCharacterForBook('tfbm', fixedRng(0, 0, 0, 0)),
      kaiName: 'SwiftBlade',
      kaiWeaponType: 'Broadsword',
      specialItems: [{ name: 'Illuminatus' }],
      grandMasterDisciplines: ['GrandWeaponmastery', 'Deliverance', 'GrandHuntmastery', 'Telegnosis', 'Astrology', 'Herbmastery', 'Elementalism', 'Bardsmanship', 'KaiSurge', 'KaiAlchemy'],
    };
    const carried = carryOverCharacterToBook(chart, 'v', fixedRng(0));
    expect(carried.kaiName).toBe('SwiftBlade');
    expect(carried.kaiWeaponType).toBe('Broadsword');
    expect(carried.specialItems.map((i) => i.name)).toContain('Illuminatus');
    expect(carried.grandMasterDisciplines).toEqual(chart.grandMasterDisciplines);
  });
});

describe('chooseEquipmentOptions (book "ths", choose-five) - eighth book of the New Order phase', () => {
  // Same 10 items as v (Book 27), same order - no reshuffle, no swap.
  const fiveOptions = ['bow', 'quiver', 'flute', 'meals', 'potion-of-laumspur'];

  it('grants the new Bow weapon', () => {
    const chart = createFreshCharacterForBook('ths', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.weapons).toContain('Bow');
  });

  it('grants 6 Arrows from the Quiver option', () => {
    const chart = createFreshCharacterForBook('ths', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.arrows).toBe(6);
  });

  it('still offers Broadsword and Flute, same categories as v', () => {
    const chart = createFreshCharacterForBook('ths', () => 0);
    const equipped = chooseEquipmentOptions(chart, ['broadsword', 'quiver', 'flute', 'meals', 'potion-of-laumspur']);
    expect(equipped.weapons).toContain('Broadsword');
    expect(equipped.backpackItems).toContain('Flute');
  });

  it('always starts with the Map of Chai & The Great Lissan Plain', () => {
    const chart = createFreshCharacterForBook('ths', () => 0);
    expect(chart.specialItems.map((i) => i.name)).toContain('Map of Chai & The Great Lissan Plain');
  });

  it('rolls gold with a +20 bonus, same as vm/tbs/mh/rw/tw/tfbm/v', () => {
    const chart = createFreshCharacterForBook('ths', () => 0);
    expect(chart.goldCrowns).toBe(20);
  });

  it('rejects a selection that is not exactly five options', () => {
    const chart = createFreshCharacterForBook('ths', () => 0);
    expect(() => chooseEquipmentOptions(chart, fiveOptions.slice(0, 4))).toThrow();
    expect(() => chooseEquipmentOptions(chart, [...fiveOptions, 'sword'])).toThrow();
  });
});

describe('carryOverCharacterToBook within the New Order phase, book "v" -> "ths" (regression)', () => {
  it('preserves kaiName and kaiWeaponType without resetting them - the character-creation screen must not re-prompt for either (see needsKaiWeapon/needsKaiName)', () => {
    const chart: ActionChart = {
      ...createFreshCharacterForBook('v', fixedRng(0, 0, 0, 0)),
      kaiName: 'SwiftBlade',
      kaiWeaponType: 'Broadsword',
      specialItems: [{ name: 'Illuminatus' }],
      grandMasterDisciplines: ['GrandWeaponmastery', 'Deliverance', 'GrandHuntmastery', 'Telegnosis', 'Astrology', 'Herbmastery', 'Elementalism', 'Bardsmanship', 'KaiSurge', 'KaiAlchemy', 'AnimalMastery'],
    };
    const carried = carryOverCharacterToBook(chart, 'ths', fixedRng(0));
    expect(carried.kaiName).toBe('SwiftBlade');
    expect(carried.kaiWeaponType).toBe('Broadsword');
    expect(carried.specialItems.map((i) => i.name)).toContain('Illuminatus');
    expect(carried.grandMasterDisciplines).toEqual(chart.grandMasterDisciplines);
  });
});

describe('chooseEquipmentOptions (book "tsc", choose-five) - ninth book of the New Order phase', () => {
  // Same 10 items as ths (Book 28), same order - despite this book's much later (2016) real-world
  // production, confirmed byte-identical in equipmnt.htm.
  const fiveOptions = ['bow', 'quiver', 'flute', 'meals', 'potion-of-laumspur'];

  it('grants the new Bow weapon', () => {
    const chart = createFreshCharacterForBook('tsc', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.weapons).toContain('Bow');
  });

  it('grants 6 Arrows from the Quiver option', () => {
    const chart = createFreshCharacterForBook('tsc', () => 0);
    const equipped = chooseEquipmentOptions(chart, fiveOptions);
    expect(equipped.arrows).toBe(6);
  });

  it('still offers Broadsword and Flute, same categories as ths', () => {
    const chart = createFreshCharacterForBook('tsc', () => 0);
    const equipped = chooseEquipmentOptions(chart, ['broadsword', 'quiver', 'flute', 'meals', 'potion-of-laumspur']);
    expect(equipped.weapons).toContain('Broadsword');
    expect(equipped.backpackItems).toContain('Flute');
  });

  it('always starts with the Map of the Khea-Khanate of Chai', () => {
    const chart = createFreshCharacterForBook('tsc', () => 0);
    expect(chart.specialItems.map((i) => i.name)).toContain('Map of the Khea-Khanate of Chai');
  });

  it('rolls gold with a +20 bonus, same as vm/tbs/mh/rw/tw/tfbm/v/ths', () => {
    const chart = createFreshCharacterForBook('tsc', () => 0);
    expect(chart.goldCrowns).toBe(20);
  });

  it('rejects a selection that is not exactly five options', () => {
    const chart = createFreshCharacterForBook('tsc', () => 0);
    expect(() => chooseEquipmentOptions(chart, fiveOptions.slice(0, 4))).toThrow();
    expect(() => chooseEquipmentOptions(chart, [...fiveOptions, 'sword'])).toThrow();
  });
});

describe('carryOverCharacterToBook within the New Order phase, book "ths" -> "tsc" (regression)', () => {
  it('preserves kaiName and kaiWeaponType without resetting them - the character-creation screen must not re-prompt for either (see needsKaiWeapon/needsKaiName)', () => {
    const chart: ActionChart = {
      ...createFreshCharacterForBook('ths', fixedRng(0, 0, 0, 0)),
      kaiName: 'SwiftBlade',
      kaiWeaponType: 'Broadsword',
      specialItems: [{ name: 'Illuminatus' }],
      grandMasterDisciplines: ['GrandWeaponmastery', 'Deliverance', 'GrandHuntmastery', 'Telegnosis', 'Astrology', 'Herbmastery', 'Elementalism', 'Bardsmanship', 'KaiSurge', 'KaiAlchemy', 'AnimalMastery', 'Assimilance'],
    };
    const carried = carryOverCharacterToBook(chart, 'tsc', fixedRng(0));
    expect(carried.kaiName).toBe('SwiftBlade');
    expect(carried.kaiWeaponType).toBe('Broadsword');
    expect(carried.specialItems.map((i) => i.name)).toContain('Illuminatus');
    expect(carried.grandMasterDisciplines).toEqual(chart.grandMasterDisciplines);
  });
});

describe('chooseKaiWeapon / rollKaiWeapon (Book 21+)', () => {
  it('sets kaiWeaponType and adds the named weapon to specialItems', () => {
    const chart = createFreshCharacterForBook('vm', () => 0);
    const equipped = chooseKaiWeapon(chart, 'Illuminatus');
    expect(equipped.kaiWeaponType).toBe('Broadsword');
    expect(equipped.specialItems.map((i) => i.name)).toContain('Illuminatus');
  });

  it('throws for an unknown weapon name', () => {
    const chart = createFreshCharacterForBook('vm', () => 0);
    expect(() => chooseKaiWeapon(chart, 'Excalibur')).toThrow();
  });

  it('rolls a deterministic entry from the table given a fixed rng', () => {
    const chart = createFreshCharacterForBook('vm', () => 0);
    const equipped = rollKaiWeapon(chart, () => 0);
    expect(equipped.kaiWeaponType).toBe('Axe');
    expect(equipped.specialItems.map((i) => i.name)).toContain('Spawnsmite');
  });

  it('throws for a book with no Kai Weapon Table', () => {
    const chart = createFreshCharacterForBook('tcn', () => 0);
    expect(() => chooseKaiWeapon(chart, 'Illuminatus')).toThrow();
  });
});

describe('setKaiName / rollKaiName (Book 21+)', () => {
  it('sets a trimmed, non-empty name', () => {
    const chart = createFreshCharacterForBook('vm', () => 0);
    const named = setKaiName(chart, '  Swiftblade  ');
    expect(named.kaiName).toBe('Swiftblade');
  });

  it('rejects an empty or whitespace-only name', () => {
    const chart = createFreshCharacterForBook('vm', () => 0);
    expect(() => setKaiName(chart, '')).toThrow();
    expect(() => setKaiName(chart, '   ')).toThrow();
  });

  it('rolls a deterministic prefix+suffix from the two tables given a fixed rng', () => {
    const chart = createFreshCharacterForBook('vm', () => 0);
    const named = rollKaiName(chart, () => 0);
    expect(named.kaiName).toBe('SwiftBlade');
  });
});

describe('carryOverCharacterToBook within the Grand Master phase, book "tplr" -> "tcok" (regression)', () => {
  it('does NOT re-apply the Special Item carry-over whitelist (it only gates the Magnakai->Grand Master boundary)', () => {
    const chart = {
      ...createFreshCharacterForBook('tplr', fixedRng(0, 0, 0, 0)),
      specialItems: [{ name: 'Some Ordinary Grand Master Find' }, { name: 'Sommerswerd' }],
    };
    const carried = carryOverCharacterToBook(chart, 'tcok', fixedRng(0));
    const names = carried.specialItems.map((i) => i.name);
    expect(names).toContain('Some Ordinary Grand Master Find');
    expect(names).toContain('Sommerswerd');
  });

  it('keeps grandMasterDisciplines and grandMasteredWeapons across the transfer', () => {
    const chart = {
      ...createFreshCharacterForBook('tplr', fixedRng(0, 0, 0, 0)),
      grandMasterDisciplines: ['GrandWeaponmastery', 'Deliverance', 'GrandHuntmastery', 'Telegnosis'] as const,
      grandMasteredWeapons: ['Sword', 'Bow'] as const,
    };
    const carried = carryOverCharacterToBook(chart, 'tcok', fixedRng(0));
    expect(carried.grandMasterDisciplines).toEqual(chart.grandMasterDisciplines);
    expect(carried.grandMasteredWeapons).toEqual(chart.grandMasteredWeapons);
  });
});

describe('applyGrandMasterDisciplines', () => {
  it('rejects anything other than exactly 4 disciplines', () => {
    const chart = createFreshCharacterForBook('tplr', fixedRng(0, 0, 0, 0));
    expect(() => applyGrandMasterDisciplines(chart, ['GrandWeaponmastery', 'Deliverance'])).toThrow();
    expect(() =>
      applyGrandMasterDisciplines(chart, ['GrandWeaponmastery', 'Deliverance', 'GrandHuntmastery', 'Telegnosis', 'GrandNexus']),
    ).toThrow();
  });

  it('sets exactly the 4 chosen disciplines with no stat bonus', () => {
    const chart = createFreshCharacterForBook('tplr', fixedRng(0, 0, 0, 0));
    const equipped = applyGrandMasterDisciplines(chart, ['GrandWeaponmastery', 'Deliverance', 'GrandHuntmastery', 'Telegnosis']);
    expect(equipped.grandMasterDisciplines).toEqual(['GrandWeaponmastery', 'Deliverance', 'GrandHuntmastery', 'Telegnosis']);
    expect(equipped.combatSkill).toBe(chart.combatSkill);
    expect(equipped.enduranceMax).toBe(chart.enduranceMax);
  });

  it('accepts a configurable expected count (5, for the New Order phase, Book 21)', () => {
    const chart = createFreshCharacterForBook('vm', fixedRng(0, 0, 0, 0));
    const five: GrandMasterDiscipline[] = ['GrandWeaponmastery', 'Deliverance', 'GrandHuntmastery', 'Telegnosis', 'Astrology'];
    expect(() => applyGrandMasterDisciplines(chart, five.slice(0, 4), 5)).toThrow();
    const equipped = applyGrandMasterDisciplines(chart, five, 5);
    expect(equipped.grandMasterDisciplines).toEqual(five);
  });
});

describe('addExtraGrandMasterDiscipline', () => {
  it('adds exactly one new discipline and grants +1 Combat Skill / +2 Endurance (max and current)', () => {
    const base = applyGrandMasterDisciplines(createFreshCharacterForBook('tplr', fixedRng(0, 0, 0, 0)), [
      'GrandWeaponmastery',
      'Deliverance',
      'GrandHuntmastery',
      'Telegnosis',
    ]);
    const withExtra = addExtraGrandMasterDiscipline(base, 'GrandNexus');
    expect(withExtra.grandMasterDisciplines).toHaveLength(5);
    expect(withExtra.grandMasterDisciplines).toContain('GrandNexus');
    expect(withExtra.combatSkill).toBe(base.combatSkill + 1);
    expect(withExtra.enduranceMax).toBe(base.enduranceMax + 2);
    expect(withExtra.enduranceCurrent).toBe(base.enduranceCurrent + 2);
  });

  it('rejects a discipline the character already has', () => {
    const base = applyGrandMasterDisciplines(createFreshCharacterForBook('tplr', fixedRng(0, 0, 0, 0)), [
      'GrandWeaponmastery',
      'Deliverance',
      'GrandHuntmastery',
      'Telegnosis',
    ]);
    expect(() => addExtraGrandMasterDiscipline(base, 'Deliverance')).toThrow();
  });
});

describe('chooseGrandMasteredWeapons / addExtraGrandMasteredWeapon', () => {
  it('rejects anything other than exactly 2 weapons', () => {
    const chart = createFreshCharacterForBook('tplr', () => 0);
    expect(() => chooseGrandMasteredWeapons(chart, ['Sword'])).toThrow();
    expect(() => chooseGrandMasteredWeapons(chart, ['Sword', 'Bow', 'Axe'])).toThrow();
  });

  it('sets grandMasteredWeapons independently of masteredWeapons and carried weapons', () => {
    const chart = { ...createFreshCharacterForBook('tplr', () => 0), masteredWeapons: ['Dagger'] as const };
    const equipped = chooseGrandMasteredWeapons(chart, ['Sword', 'Bow']);
    expect(equipped.grandMasteredWeapons).toEqual(['Sword', 'Bow']);
    expect(equipped.masteredWeapons).toEqual(['Dagger']);
    expect(equipped.weapons).toEqual(chart.weapons);
  });

  it('adds exactly one new weapon via addExtraGrandMasteredWeapon', () => {
    const chart = chooseGrandMasteredWeapons(createFreshCharacterForBook('tplr', () => 0), ['Sword', 'Bow']);
    const grown = addExtraGrandMasteredWeapon(chart, 'Axe');
    expect(grown.grandMasteredWeapons).toEqual(['Sword', 'Bow', 'Axe']);
  });

  it('rejects a weapon that is already Grand-mastered', () => {
    const chart = chooseGrandMasteredWeapons(createFreshCharacterForBook('tplr', () => 0), ['Sword', 'Bow']);
    expect(() => addExtraGrandMasteredWeapon(chart, 'Sword')).toThrow();
  });
});

describe('carryOverCharacterToBook crossing into the Grand Master phase (regression)', () => {
  it('does NOT clear magnakaiDisciplines or masteredWeapons (unlike the Kai->Magnakai boundary)', () => {
    const magnakaiChart = chooseMasteredWeapons(
      applyMagnakaiDisciplines(createFreshCharacterForBook('tkt', fixedRng(0, 0, 0, 0)), [
        'Weaponmastery',
        'Curing',
        'Huntmastery',
      ]),
      ['Sword', 'Bow', 'Axe'],
    );

    const carried = carryOverCharacterToBook(magnakaiChart, 'tplr', fixedRng(0));
    expect(carried.magnakaiDisciplines).toEqual(magnakaiChart.magnakaiDisciplines);
    expect(carried.masteredWeapons).toEqual(magnakaiChart.masteredWeapons);
    expect(carried.grandMasterDisciplines).toEqual([]);
    expect(carried.grandMasteredWeapons).toEqual([]);
  });

  it('filters Special Items down to the fixed Grand Master carry-over whitelist', () => {
    const chart = {
      ...createFreshCharacterForBook('tmd', fixedRng(0, 0, 0, 0)),
      specialItems: [
        { name: 'Sommerswerd' },
        { name: 'Map of the Darklands' },
        { name: 'Fireseed' },
        { name: 'Silver Bracers' },
      ],
    };
    const carried = carryOverCharacterToBook(chart, 'tplr', fixedRng(0));
    const names = carried.specialItems.map((i) => i.name);
    expect(names).toContain('Sommerswerd');
    expect(names).toContain('Silver Bracers');
    expect(names).not.toContain('Map of the Darklands');
    expect(names).not.toContain('Fireseed');
  });

  it('does not filter Special Items when staying within the Grand Master phase', () => {
    const chart = {
      ...createFreshCharacterForBook('tplr', fixedRng(0, 0, 0, 0)),
      specialItems: [{ name: 'Some Ordinary Find' }],
    };
    const carried = carryOverCharacterToBook(chart, 'tplr', fixedRng(0));
    expect(carried.specialItems.map((i) => i.name)).toContain('Some Ordinary Find');
  });
});
