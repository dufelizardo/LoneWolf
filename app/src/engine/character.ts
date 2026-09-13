import { rollRandomNumber, type Rng } from './rng';
import { getBookEquipment, type EquipmentOption } from './bookEquipment';
import { getBook } from '../data/books';
import { MAX_GOLD_CROWNS, type ActionChart, type Discipline, type MagnakaiDiscipline, type WeaponType } from './types';

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
    masteredWeapons: [],
    weapons: [],
    equippedWeapon: null,
    backpackItems: [],
    meals: 0,
    specialItems: [],
    goldCrowns: rollRandomNumber(rng) + config.goldRollBonus,
    healingPotionDoses: 0,
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
 */
export function carryOverCharacterToBook(previous: ActionChart, bookId: string, rng: Rng = Math.random): ActionChart {
  const config = getBookEquipment(bookId);
  const goldRoll = rollRandomNumber(rng) + config.goldRollBonus;
  const crossingIntoMagnakai = getBook(bookId).phase === 'magnakai' && getBook(previous.bookId).phase !== 'magnakai';

  const chart: ActionChart = {
    ...previous,
    bookId,
    disciplines: crossingIntoMagnakai ? [] : [...previous.disciplines],
    weaponskillWeapon: crossingIntoMagnakai ? null : previous.weaponskillWeapon,
    magnakaiDisciplines: [...previous.magnakaiDisciplines],
    masteredWeapons: [...previous.masteredWeapons],
    weapons: [...previous.weapons],
    backpackItems: [...previous.backpackItems],
    specialItems: [...previous.specialItems],
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
