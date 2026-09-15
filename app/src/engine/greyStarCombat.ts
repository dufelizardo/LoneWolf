import { getCombatResult } from '../data/crt';
import { rollRandomNumber, type Rng } from './rng';
import { WIZARDS_STAFF, type GreyStarActionChart } from './greyStarTypes';
import type { Enemy } from './types';

/**
 * Grey Star's combat is structurally the same three-step lookup as every Lone Wolf book (Combat Ratio
 * -> Random Number Table roll -> Combat Results Table), and confirmed (by reading crtneg.png/crtpos.png
 * directly) to share the exact same Combat Ratio=0 anchor values already hardcoded in `../data/crt.ts`
 * - so getCombatResult is reused unchanged for the base (ratio, roll) lookup. What's genuinely new:
 *
 * - No Discipline-derived Combat Skill bonuses at all - only a flat penalty based on which weapon (if
 *   any) is equipped: 0 with the Wizard's Staff (and WILLPOWER > 0, i.e. its magic still works), -6
 *   without the Staff (a different weapon, or the Staff itself once WILLPOWER has fallen to 0 or below
 *   - "you can still use your Wizard's Staff in combat as a normal weapon, but you must deduct 6
 *   points", gamerulz.htm footnote 2), -8 unarmed (cmbtrulz.htm/powers.htm).
 * - The enemy's CRT-table loss is multiplied by however many WILLPOWER points the player chooses to
 *   spend that round (minimum 1, capped by however many they actually have) - only possible while
 *   actively using the Staff's magic (equipped + WILLPOWER > 0). cmbtrulz.htm's worked example: Combat
 *   Ratio -5, WILLPOWER spend 2, roll 6 -> Grey Star loses 4, enemy loses 5*2=10.
 */

export function canUseStaffMagic(chart: GreyStarActionChart): boolean {
  return chart.equippedWeapon === WIZARDS_STAFF && chart.willpowerCurrent > 0;
}

export function getEffectiveCombatSkill(chart: GreyStarActionChart): number {
  if (!chart.equippedWeapon) return chart.combatSkill - 8;
  if (chart.equippedWeapon === WIZARDS_STAFF && chart.willpowerCurrent > 0) return chart.combatSkill;
  return chart.combatSkill - 6;
}

export interface GreyStarCombatRoundResult {
  chart: GreyStarActionChart;
  enemy: Enemy;
  roll: number;
  ratio: number;
  enemyLoss: number;
  playerLoss: number;
  /** WILLPOWER actually spent this round - 0 whenever Staff magic isn't in play (no Staff equipped, or WILLPOWER already <= 0). */
  willpowerSpent: number;
  playerKilled: boolean;
  enemyKilled: boolean;
  log: string;
}

/**
 * Resolves one round of combat. `willpowerSpend` is the player's chosen spend for this round (only
 * relevant while canUseStaffMagic(chart) is true) - clamped to [1, chart.willpowerCurrent] since the
 * rules forbid choosing to spend more than you have ("you may never choose to use... your Wizard's
 * Staff if you do not have sufficient WILLPOWER points", gamerulz.htm footnote 1) and require at least
 * 1 whenever the Staff's magic is used at all (cmbtrulz.htm stage 3).
 */
export function resolveGreyStarCombatRound(
  chart: GreyStarActionChart,
  enemy: Enemy,
  rng: Rng = Math.random,
  willpowerSpend = 1,
): GreyStarCombatRoundResult {
  const usingStaffMagic = canUseStaffMagic(chart);
  const spend = usingStaffMagic ? Math.max(1, Math.min(willpowerSpend, chart.willpowerCurrent)) : 0;

  const effectiveSkill = getEffectiveCombatSkill(chart);
  const ratio = effectiveSkill - enemy.combatSkill;
  const roll = rollRandomNumber(rng);
  const result = getCombatResult(ratio, roll);

  const playerLoss = result.playerLoss === 'K' ? chart.enduranceCurrent : result.playerLoss;
  const baseEnemyLoss = result.enemyLoss === 'K' ? enemy.endurance : result.enemyLoss;
  const multiplier = usingStaffMagic ? spend : 1;
  const enemyLoss = Math.min(enemy.endurance, baseEnemyLoss * multiplier);

  const nextEnemy: Enemy = { ...enemy, endurance: Math.max(0, enemy.endurance - enemyLoss) };
  const enduranceCurrent = Math.max(0, chart.enduranceCurrent - playerLoss);
  const nextChart: GreyStarActionChart = {
    ...chart,
    enduranceCurrent,
    willpowerCurrent: chart.willpowerCurrent - spend,
    isAlive: enduranceCurrent > 0,
  };

  const enemyKilled = nextEnemy.endurance <= 0;
  const playerKilled = nextChart.enduranceCurrent <= 0;

  const log = usingStaffMagic
    ? `Ratio ${ratio}, roll ${roll}: Grey Star perde ${playerLoss} Endurance; ${enemy.name} perde ${baseEnemyLoss} x ${spend} Willpower = ${enemyLoss} Endurance.`
    : `Ratio ${ratio}, roll ${roll}: Grey Star perde ${playerLoss} Endurance; ${enemy.name} perde ${enemyLoss} Endurance.`;

  return { chart: nextChart, enemy: nextEnemy, roll, ratio, enemyLoss, playerLoss, willpowerSpent: spend, playerKilled, enemyKilled, log };
}
