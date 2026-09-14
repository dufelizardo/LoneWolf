import { rollRandomNumber, type Rng } from './rng';
import { getBookEquipment, type EquipmentOption } from './bookEquipment';
import { getBook } from '../data/books';
import {
  MAX_GOLD_CROWNS,
  type ActionChart,
  type Discipline,
  type GrandMasterDiscipline,
  type MagnakaiDiscipline,
  type WeaponType,
} from './types';

/**
 * Only these named Special Items survive the jump into the Grand Master phase (Book 13+) — a
 * tighter rule than every earlier transition, which carried everything over unconditionally
 * (gamerulz.htm, Book 13: "only the following Special Items may be carried over to the Lone Wolf
 * Grand Master series").
 */
const GRAND_MASTER_CARRYOVER_SPECIAL_ITEMS = new Set([
  'Crystal Star Pendant',
  'Sommerswerd',
  'Silver Helm',
  'Dagger of Vashna',
  'Silver Bracers',
  'Jewelled Mace',
  'Silver Bow of Duadon',
  'Helshezag',
  'Kagonite Chainmail',
  'Korlinium Scabbard',
]);

/** Creates a fresh character with rolled stats, before Kai Discipline selection. */
export function createFreshCharacterForBook(bookId: string, rng: Rng = Math.random): ActionChart {
  const config = getBookEquipment(bookId);
  const combatSkill = rollRandomNumber(rng) + 10;
  const enduranceRoll = rollRandomNumber(rng) + 20;

  const chart: ActionChart = {
    bookId,
    combatSkill,
    enduranceMax: enduranceRoll,
    enduranceCurrent: enduranceRoll,
    disciplines: [],
    weaponskillWeapon: null,
    magnakaiDisciplines: [],
    grandMasterDisciplines: [],
    masteredWeapons: [],
    grandMasteredWeapons: [],
    weapons: [],
    equippedWeapon: null,
    backpackItems: [],
    meals: 0,
    specialItems: [],
    goldCrowns: rollRandomNumber(rng) + config.goldRollBonus,
    healingPotionDoses: 0,
    combatPotionDoses: 0,
    arrows: 0,
    currentSection: 1,
    visitedSections: [],
    isAlive: true,
  };

  config.applyBaseEquipment(chart);

  if (config.randomTable) {
    const roll = rollRandomNumber(rng);
    config.randomTable[roll].apply(chart);
  }

  return chart;
}

/**
 * Carries a completed character forward into the next book: keeps Combat Skill, Endurance,
 * Disciplines, Weapons and Special Items, adds this book's gold roll on top of what they had, and
 * grants this book's fixed narrative items. Equipment choice and the one extra Discipline are
 * separate steps applied afterwards (chooseEquipmentOptions / addExtraDiscipline).
 *
 * Crossing from the Kai phase into the Magnakai phase (Book 6+) clears `disciplines`/
 * `weaponskillWeapon` — the two Discipline systems are unrelated (no conversion table exists in the
 * source material) and are never meant to coexist, so old Kai bonuses must not keep silently firing
 * in combat.ts/disciplines.ts forever. `magnakaiDisciplines`/`masteredWeapons`/`arrows` pass through
 * `...previous` untouched like every other field, naturally starting at `[]`/`[]`/`0` the first time.
 *
 * Crossing from Magnakai into the Grand Master phase (Book 13+) is different: `magnakaiDisciplines`
 * is NOT cleared (see the GrandMasterDiscipline doc comment in types.ts) — its bonuses keep applying
 * in combat.ts/disciplines.ts wherever the character didn't pick the corresponding Grand Master
 * upgrade. What IS restricted at this boundary is Special Items: only a fixed, named whitelist
 * survives (gamerulz.htm, Book 13), unlike every earlier transition's "carry everything over".
 */
export function carryOverCharacterToBook(previous: ActionChart, bookId: string, rng: Rng = Math.random): ActionChart {
  const config = getBookEquipment(bookId);
  const goldRoll = rollRandomNumber(rng) + config.goldRollBonus;
  const crossingIntoMagnakai = getBook(bookId).phase === 'magnakai' && getBook(previous.bookId).phase !== 'magnakai';
  const crossingIntoGrandMaster =
    getBook(bookId).phase === 'grand_master' && getBook(previous.bookId).phase !== 'grand_master';

  const carriedSpecialItems = crossingIntoGrandMaster
    ? previous.specialItems.filter((item) => GRAND_MASTER_CARRYOVER_SPECIAL_ITEMS.has(item.name))
    : [...previous.specialItems];

  const chart: ActionChart = {
    ...previous,
    bookId,
    disciplines: crossingIntoMagnakai ? [] : [...previous.disciplines],
    weaponskillWeapon: crossingIntoMagnakai ? null : previous.weaponskillWeapon,
    magnakaiDisciplines: [...previous.magnakaiDisciplines],
    grandMasterDisciplines: [...previous.grandMasterDisciplines],
    masteredWeapons: [...previous.masteredWeapons],
    grandMasteredWeapons: [...previous.grandMasteredWeapons],
    weapons: [...previous.weapons],
    backpackItems: [...previous.backpackItems],
    specialItems: carriedSpecialItems,
    goldCrowns: Math.min(MAX_GOLD_CROWNS, previous.goldCrowns + goldRoll),
    currentSection: 1,
    visitedSections: [],
    isAlive: true,
  };

  config.applyBaseEquipment(chart);
  return chart;
}

/** Applies the player's chosen Kai Disciplines for a fresh character (exactly 5). */
export function applyDisciplines(chart: ActionChart, disciplines: Discipline[], rng: Rng = Math.random): ActionChart {
  if (disciplines.length !== 5) {
    throw new Error(`Expected exactly 5 disciplines, got ${disciplines.length}`);
  }
  return assignDisciplines(chart, disciplines, rng);
}

/** Adds exactly one new Kai Discipline to a carried-over character (5 -> 6). */
export function addExtraDiscipline(chart: ActionChart, discipline: Discipline, rng: Rng = Math.random): ActionChart {
  if (chart.disciplines.includes(discipline)) {
    throw new Error(`Character already has the ${discipline} discipline`);
  }
  return assignDisciplines(chart, [...chart.disciplines, discipline], rng);
}

function assignDisciplines(chart: ActionChart, disciplines: Discipline[], rng: Rng): ActionChart {
  const next: ActionChart = { ...chart, disciplines: [...disciplines] };
  if (disciplines.includes('Weaponskill') && !next.weaponskillWeapon) {
    const pool = getBookEquipment(chart.bookId).weaponPool;
    const index = rollRandomNumber(rng) % pool.length;
    next.weaponskillWeapon = pool[index] as WeaponType;
  }
  return next;
}

/** Applies the player's chosen Magnakai Disciplines for a character entering the phase for the first time (exactly 3). */
export function applyMagnakaiDisciplines(chart: ActionChart, disciplines: MagnakaiDiscipline[]): ActionChart {
  if (disciplines.length !== 3) {
    throw new Error(`Expected exactly 3 Magnakai Disciplines, got ${disciplines.length}`);
  }
  return { ...chart, magnakaiDisciplines: [...disciplines] };
}

/** Adds exactly one new Magnakai Discipline to a carried-over character (3 -> 4, etc). */
export function addExtraMagnakaiDiscipline(chart: ActionChart, discipline: MagnakaiDiscipline): ActionChart {
  if (chart.magnakaiDisciplines.includes(discipline)) {
    throw new Error(`Character already has the ${discipline} discipline`);
  }
  return { ...chart, magnakaiDisciplines: [...chart.magnakaiDisciplines, discipline] };
}

/**
 * Sets the Weaponmastery discipline's chosen weapons (exactly 3). Separate from `weapons` — the
 * source text is explicit that being skilled with a weapon doesn't mean starting the adventure
 * carrying it.
 */
export function chooseMasteredWeapons(chart: ActionChart, weapons: WeaponType[]): ActionChart {
  if (weapons.length !== 3) {
    throw new Error(`Expected exactly 3 mastered weapons, got ${weapons.length}`);
  }
  return { ...chart, masteredWeapons: [...weapons] };
}

/** Adds exactly one new weapon to an existing Weaponmastery Checklist — the "+1 weapon per completed Magnakai book" growth, only meaningful once Weaponmastery is already held. */
export function addExtraMasteredWeapon(chart: ActionChart, weapon: WeaponType): ActionChart {
  if (chart.masteredWeapons.includes(weapon)) {
    throw new Error(`Weapon ${weapon} is already mastered`);
  }
  return { ...chart, masteredWeapons: [...chart.masteredWeapons, weapon] };
}

/** Applies the player's chosen Grand Master Disciplines for a character entering the phase for the first time (exactly 4, no stat bonus — the +1 CS/+2 EP bonus only applies to Disciplines gained "in excess of the original four", see addExtraGrandMasterDiscipline). */
export function applyGrandMasterDisciplines(chart: ActionChart, disciplines: GrandMasterDiscipline[]): ActionChart {
  if (disciplines.length !== 4) {
    throw new Error(`Expected exactly 4 Grand Master Disciplines, got ${disciplines.length}`);
  }
  return { ...chart, grandMasterDisciplines: [...disciplines] };
}

/**
 * Adds exactly one new Grand Master Discipline to a carried-over character (4 -> 5, etc). Unlike
 * every earlier "+1 discipline" growth, this one carries a permanent stat bonus: "For every Grand
 * Master Discipline you possess, in excess of the original four disciplines you begin with, you may
 * add 1 point to your basic COMBAT SKILL score and 2 points to your basic ENDURANCE points score"
 * (discplnz.htm, Book 13) — applied once, permanently, same pattern as a fixed-bonus Special Item
 * (e.g. Book 1's Chainmail Waistcoat) rather than a combat-time conditional like every Magnakai bonus.
 */
export function addExtraGrandMasterDiscipline(chart: ActionChart, discipline: GrandMasterDiscipline): ActionChart {
  if (chart.grandMasterDisciplines.includes(discipline)) {
    throw new Error(`Character already has the ${discipline} discipline`);
  }
  return {
    ...chart,
    grandMasterDisciplines: [...chart.grandMasterDisciplines, discipline],
    combatSkill: chart.combatSkill + 1,
    enduranceMax: chart.enduranceMax + 2,
    enduranceCurrent: chart.enduranceCurrent + 2,
  };
}

/**
 * Sets the Grand Weaponmastery discipline's chosen weapons (exactly 2). Kept separate from
 * `masteredWeapons` (the Magnakai-era Weaponmastery list) — see the `grandMasteredWeapons` doc
 * comment in types.ts for why they aren't merged.
 */
export function chooseGrandMasteredWeapons(chart: ActionChart, weapons: WeaponType[]): ActionChart {
  if (weapons.length !== 2) {
    throw new Error(`Expected exactly 2 Grand Master weapons, got ${weapons.length}`);
  }
  return { ...chart, grandMasteredWeapons: [...weapons] };
}

/** Adds exactly one new weapon to an existing Grand Weaponmastery Checklist — the "+1 weapon per completed Grand Master book" growth, only meaningful once Grand Weaponmastery is already held. */
export function addExtraGrandMasteredWeapon(chart: ActionChart, weapon: WeaponType): ActionChart {
  if (chart.grandMasteredWeapons.includes(weapon)) {
    throw new Error(`Weapon ${weapon} is already Grand-mastered`);
  }
  return { ...chart, grandMasteredWeapons: [...chart.grandMasteredWeapons, weapon] };
}

/** Applies the player's chosen equipment options for a choose-based book (count set by chooseCount). */
export function chooseEquipmentOptions(chart: ActionChart, optionIds: string[]): ActionChart {
  const config = getBookEquipment(chart.bookId);
  const options = config.chooseOptions;
  if (!options) throw new Error(`Book ${chart.bookId} does not use choose-based equipment`);
  const required = config.chooseCount ?? 2;
  if (optionIds.length !== required) {
    throw new Error(`Expected exactly ${required} equipment choices, got ${optionIds.length}`);
  }

  const next: ActionChart = {
    ...chart,
    weapons: [...chart.weapons],
    backpackItems: [...chart.backpackItems],
    specialItems: [...chart.specialItems],
  };

  for (const id of optionIds) {
    const option = options.find((o: EquipmentOption) => o.id === id);
    if (!option) throw new Error(`Unknown equipment option: ${id}`);
    option.apply(next);
  }

  return next;
}
