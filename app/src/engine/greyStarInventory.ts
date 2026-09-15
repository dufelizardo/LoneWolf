import { MAX_BACKPACK_ITEMS, MAX_WEAPONS } from './types';
import type { GreyStarActionChart, GreyStarSpecialItem } from './greyStarTypes';

/**
 * Mirrors inventory.ts's style but typed for GreyStarActionChart. Grey Star's own limits happen to
 * match the shared MAX_WEAPONS (2, Staff counts as one) and MAX_BACKPACK_ITEMS (8) constants exactly
 * (confirmed in equipmnt.htm) - no per-book override mechanism like bookEquipment.ts's is needed here.
 */

function backpackSlotsUsed(chart: GreyStarActionChart): number {
  return chart.backpackItems.length + chart.meals;
}

export function adjustEndurance(chart: GreyStarActionChart, delta: number): GreyStarActionChart {
  const enduranceCurrent = Math.max(0, Math.min(chart.enduranceMax, chart.enduranceCurrent + delta));
  return { ...chart, enduranceCurrent, isAlive: enduranceCurrent > 0 };
}

/** No ceiling and no floor - see GreyStarActionChart's willpowerCurrent doc comment. */
export function adjustWillpower(chart: GreyStarActionChart, delta: number): GreyStarActionChart {
  return { ...chart, willpowerCurrent: chart.willpowerCurrent + delta };
}

export function adjustCombatSkill(chart: GreyStarActionChart, delta: number): GreyStarActionChart {
  return { ...chart, combatSkill: Math.max(0, chart.combatSkill + delta) };
}

export function adjustNobles(chart: GreyStarActionChart, delta: number): GreyStarActionChart {
  return { ...chart, nobles: Math.max(0, chart.nobles + delta) };
}

export function addBackpackItem(chart: GreyStarActionChart, item: string): GreyStarActionChart {
  if (backpackSlotsUsed(chart) >= MAX_BACKPACK_ITEMS) return chart;
  return { ...chart, backpackItems: [...chart.backpackItems, item] };
}

export function removeBackpackItem(chart: GreyStarActionChart, item: string): GreyStarActionChart {
  const index = chart.backpackItems.indexOf(item);
  if (index === -1) return chart;
  const backpackItems = [...chart.backpackItems];
  backpackItems.splice(index, 1);
  return { ...chart, backpackItems };
}

export function addMeal(chart: GreyStarActionChart): GreyStarActionChart {
  if (backpackSlotsUsed(chart) >= MAX_BACKPACK_ITEMS) return chart;
  return { ...chart, meals: chart.meals + 1 };
}

export function removeMeal(chart: GreyStarActionChart): GreyStarActionChart {
  if (chart.meals <= 0) return chart;
  return { ...chart, meals: chart.meals - 1 };
}

/** Herb Pouch is a fixed capacity of 8 (equipmnt.htm) regardless of book - unlike the Backpack, there's no shared constant for it since only Grey Star has this container. */
const MAX_HERB_POUCH_ITEMS = 8;

export function addHerbPouchItem(chart: GreyStarActionChart, item: string): GreyStarActionChart {
  if (chart.herbPouchItems.length >= MAX_HERB_POUCH_ITEMS) return chart;
  return { ...chart, herbPouchItems: [...chart.herbPouchItems, item] };
}

export function removeHerbPouchItem(chart: GreyStarActionChart, item: string): GreyStarActionChart {
  const index = chart.herbPouchItems.indexOf(item);
  if (index === -1) return chart;
  const herbPouchItems = [...chart.herbPouchItems];
  herbPouchItems.splice(index, 1);
  return { ...chart, herbPouchItems };
}

export function addSpecialItem(chart: GreyStarActionChart, item: GreyStarSpecialItem): GreyStarActionChart {
  return { ...chart, specialItems: [...chart.specialItems, item] };
}

export function removeSpecialItem(chart: GreyStarActionChart, name: string): GreyStarActionChart {
  const index = chart.specialItems.findIndex((item) => item.name === name);
  if (index === -1) return chart;
  const specialItems = [...chart.specialItems];
  specialItems.splice(index, 1);
  return { ...chart, specialItems };
}

export function addWeapon(chart: GreyStarActionChart, weapon: string): GreyStarActionChart {
  if (chart.weapons.length >= MAX_WEAPONS) return chart;
  if (chart.weapons.includes(weapon)) return chart;
  const weapons = [...chart.weapons, weapon];
  const equippedWeapon = chart.equippedWeapon ?? weapon;
  return { ...chart, weapons, equippedWeapon };
}

export function removeWeapon(chart: GreyStarActionChart, weapon: string): GreyStarActionChart {
  const index = chart.weapons.indexOf(weapon);
  if (index === -1) return chart;
  const weapons = [...chart.weapons];
  weapons.splice(index, 1);
  const equippedWeapon = chart.equippedWeapon === weapon ? (weapons[0] ?? null) : chart.equippedWeapon;
  return { ...chart, weapons, equippedWeapon };
}

export function equipWeapon(chart: GreyStarActionChart, weapon: string): GreyStarActionChart {
  if (!chart.weapons.includes(weapon)) return chart;
  return { ...chart, equippedWeapon: weapon };
}
