import { rollRandomNumber, type Rng } from './rng';
import { getBookEquipment, type EquipmentOption } from './bookEquipment';
import { MAX_GOLD_CROWNS, type ActionChart, type Discipline, type WeaponType } from './types';

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
    weapons: [],
    equippedWeapon: null,
    backpackItems: [],
    specialItems: [],
    goldCrowns: rollRandomNumber(rng) + config.goldRollBonus,
    hasHealingPotion: false,
    hasHealingPotionUsed: false,
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
 * grants this book's fixed narrative items. Equipment choice (for 'choose-two' books) and the one
 * extra Kai Discipline are separate steps applied afterwards (chooseEquipmentOptions / addDiscipline).
 */
export function carryOverCharacterToBook(previous: ActionChart, bookId: string, rng: Rng = Math.random): ActionChart {
  const config = getBookEquipment(bookId);
  const goldRoll = rollRandomNumber(rng) + config.goldRollBonus;

  const chart: ActionChart = {
    ...previous,
    bookId,
    disciplines: [...previous.disciplines],
    weapons: [...previous.weapons],
    backpackItems: [...previous.backpackItems],
    specialItems: [...previous.specialItems],
    goldCrowns: Math.min(MAX_GOLD_CROWNS, previous.goldCrowns + goldRoll),
    hasHealingPotionUsed: false,
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

/** Applies exactly two chosen equipment options for a 'choose-two' book. */
export function chooseEquipmentOptions(chart: ActionChart, optionIds: string[]): ActionChart {
  const config = getBookEquipment(chart.bookId);
  const options = config.chooseOptions;
  if (!options) throw new Error(`Book ${chart.bookId} does not use choose-two equipment`);
  if (optionIds.length !== 2) {
    throw new Error(`Expected exactly 2 equipment choices, got ${optionIds.length}`);
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
