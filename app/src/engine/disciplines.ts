import { getBookEquipment } from './bookEquipment';
import type { ActionChart } from './types';

const HEALING_REGEN_PER_SECTION = 1;
const NO_MEAL_PENALTY = 3;

/**
 * Call once per section transition. Applies the passive Endurance regeneration granted by the Kai
 * Healing discipline or its Magnakai successor Curing (identical effect — a chart only ever has one
 * of the two arrays populated, see carryOverCharacterToBook, so this OR needs no phase check).
 */
export function applyHealingRegen(chart: ActionChart, hadCombatThisSection: boolean): ActionChart {
  const canRegen = chart.disciplines.includes('Healing') || chart.magnakaiDisciplines.includes('Curing');
  if (hadCombatThisSection || !canRegen) return chart;
  if (chart.enduranceCurrent >= chart.enduranceMax) return chart;
  return {
    ...chart,
    enduranceCurrent: Math.min(chart.enduranceMax, chart.enduranceCurrent + HEALING_REGEN_PER_SECTION),
  };
}

export function eatMeal(chart: ActionChart): ActionChart {
  if (chart.meals <= 0) return chart;
  return { ...chart, meals: chart.meals - 1 };
}

/** Call when the story requires a Meal and the player has none (and lacks Hunting/Huntmastery). */
export function applyMissedMealPenalty(chart: ActionChart): ActionChart {
  const hasExemptDiscipline = chart.disciplines.includes('Hunting') || chart.magnakaiDisciplines.includes('Huntmastery');
  const huntingExempts = hasExemptDiscipline && !getBookEquipment(chart.bookId).huntingDisabled;
  if (huntingExempts) return chart;
  return { ...chart, enduranceCurrent: Math.max(0, chart.enduranceCurrent - NO_MEAL_PENALTY) };
}

const HEALING_POTION_RESTORE = 4;

export function useHealingPotion(chart: ActionChart): ActionChart {
  if (chart.healingPotionDoses <= 0) return chart;
  return {
    ...chart,
    healingPotionDoses: chart.healingPotionDoses - 1,
    enduranceCurrent: Math.min(chart.enduranceMax, chart.enduranceCurrent + HEALING_POTION_RESTORE),
  };
}

/**
 * Drinks a dose of Potion of Alether (Book 10+): only decrements the dose count. Unlike
 * useHealingPotion, the +2 Combat Skill effect isn't instantaneous — it lasts the whole fight the
 * potion was drunk for, so applying it is CombatModal/combat.ts's job (via CombatRoundOptions),
 * not this function's.
 */
export function useCombatPotion(chart: ActionChart): ActionChart {
  if (chart.combatPotionDoses <= 0) return chart;
  return { ...chart, combatPotionDoses: chart.combatPotionDoses - 1 };
}
