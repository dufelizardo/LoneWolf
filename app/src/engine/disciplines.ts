import type { ActionChart } from './types';

const HEALING_REGEN_PER_SECTION = 1;
const NO_MEAL_PENALTY = 3;

/** Call once per section transition. Applies the Healing discipline's passive regeneration. */
export function applyHealingRegen(chart: ActionChart, hadCombatThisSection: boolean): ActionChart {
  if (hadCombatThisSection || !chart.disciplines.includes('Healing')) return chart;
  if (chart.enduranceCurrent >= chart.enduranceMax) return chart;
  return {
    ...chart,
    enduranceCurrent: Math.min(chart.enduranceMax, chart.enduranceCurrent + HEALING_REGEN_PER_SECTION),
  };
}

export function eatMeal(chart: ActionChart): ActionChart {
  const mealIndex = chart.backpackItems.indexOf('Meal');
  if (mealIndex === -1) return chart;
  const backpackItems = [...chart.backpackItems];
  backpackItems.splice(mealIndex, 1);
  return { ...chart, backpackItems };
}

/** Call when the story requires a Meal and the player has none (and lacks Hunting). */
export function applyMissedMealPenalty(chart: ActionChart): ActionChart {
  if (chart.disciplines.includes('Hunting')) return chart;
  return { ...chart, enduranceCurrent: Math.max(0, chart.enduranceCurrent - NO_MEAL_PENALTY) };
}

const HEALING_POTION_RESTORE = 4;

export function useHealingPotion(chart: ActionChart): ActionChart {
  if (!chart.hasHealingPotion || chart.hasHealingPotionUsed) return chart;
  return {
    ...chart,
    hasHealingPotionUsed: true,
    enduranceCurrent: Math.min(chart.enduranceMax, chart.enduranceCurrent + HEALING_POTION_RESTORE),
  };
}
