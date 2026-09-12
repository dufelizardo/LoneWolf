import { MAX_BACKPACK_ITEMS, MAX_GOLD_CROWNS, MAX_WEAPONS, type ActionChart, type WeaponType } from './types';

export function adjustEndurance(chart: ActionChart, delta: number): ActionChart {
  const enduranceCurrent = Math.max(0, Math.min(chart.enduranceMax, chart.enduranceCurrent + delta));
  return { ...chart, enduranceCurrent, isAlive: enduranceCurrent > 0 };
}

/** For temporary story-driven modifiers ("Deduct 1 point from your Combat Skill and fight the X"). */
export function adjustCombatSkill(chart: ActionChart, delta: number): ActionChart {
  return { ...chart, combatSkill: Math.max(0, chart.combatSkill + delta) };
}

export function adjustGold(chart: ActionChart, delta: number): ActionChart {
  const goldCrowns = Math.max(0, Math.min(MAX_GOLD_CROWNS, chart.goldCrowns + delta));
  return { ...chart, goldCrowns };
}

export function addBackpackItem(chart: ActionChart, item: string): ActionChart {
  if (chart.backpackItems.length >= MAX_BACKPACK_ITEMS) return chart;
  return { ...chart, backpackItems: [...chart.backpackItems, item] };
}

export function removeBackpackItem(chart: ActionChart, item: string): ActionChart {
  const index = chart.backpackItems.indexOf(item);
  if (index === -1) return chart;
  const backpackItems = [...chart.backpackItems];
  backpackItems.splice(index, 1);
  return { ...chart, backpackItems };
}

export function addSpecialItem(chart: ActionChart, item: string): ActionChart {
  return { ...chart, specialItems: [...chart.specialItems, item] };
}

export function removeSpecialItem(chart: ActionChart, item: string): ActionChart {
  const index = chart.specialItems.indexOf(item);
  if (index === -1) return chart;
  const specialItems = [...chart.specialItems];
  specialItems.splice(index, 1);
  return { ...chart, specialItems };
}

export function addWeapon(chart: ActionChart, weapon: WeaponType): ActionChart {
  if (chart.weapons.length >= MAX_WEAPONS) return chart;
  const weapons = [...chart.weapons, weapon];
  const equippedWeapon = chart.equippedWeapon ?? weapon;
  return { ...chart, weapons, equippedWeapon };
}

export function removeWeapon(chart: ActionChart, weapon: WeaponType): ActionChart {
  const index = chart.weapons.indexOf(weapon);
  if (index === -1) return chart;
  const weapons = [...chart.weapons];
  weapons.splice(index, 1);
  const equippedWeapon = chart.equippedWeapon === weapon ? (weapons[0] ?? null) : chart.equippedWeapon;
  return { ...chart, weapons, equippedWeapon };
}

export function equipWeapon(chart: ActionChart, weapon: WeaponType): ActionChart {
  if (!chart.weapons.includes(weapon)) return chart;
  return { ...chart, equippedWeapon: weapon };
}
