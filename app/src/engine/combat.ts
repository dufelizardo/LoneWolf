import { getCombatResult } from '../data/crt';
import { rollRandomNumber, type Rng } from './rng';
import type { ActionChart, Enemy } from './types';

const NO_WEAPON_PENALTY = -4;
const WEAPONSKILL_BONUS = 2;
const MINDBLAST_BONUS = 2;

/** Lone Wolf's Combat Skill for this fight, including discipline bonuses and the no-weapon penalty. */
export function getEffectiveCombatSkill(chart: ActionChart, enemy: Enemy): number {
  let skill = chart.combatSkill;

  if (!chart.equippedWeapon) {
    skill += NO_WEAPON_PENALTY;
  } else if (chart.disciplines.includes('Weaponskill') && chart.weaponskillWeapon === chart.equippedWeapon) {
    skill += WEAPONSKILL_BONUS;
  }

  if (chart.disciplines.includes('Mindblast') && !enemy.mindblastImmune) {
    skill += MINDBLAST_BONUS;
  }

  return skill;
}

export interface CombatRoundResult {
  chart: ActionChart;
  enemy: Enemy;
  roll: number;
  ratio: number;
  enemyLoss: number;
  playerLoss: number;
  playerKilled: boolean;
  enemyKilled: boolean;
  log: string;
}

/** Resolves a single round of combat between the player and one enemy. */
export function resolveCombatRound(chart: ActionChart, enemy: Enemy, rng: Rng = Math.random): CombatRoundResult {
  const effectiveSkill = getEffectiveCombatSkill(chart, enemy);
  const ratio = effectiveSkill - enemy.combatSkill;
  const roll = rollRandomNumber(rng);
  const result = getCombatResult(ratio, roll);

  let enemyLoss = result.enemyLoss === 'K' ? enemy.endurance : result.enemyLoss;
  let playerLoss = result.playerLoss === 'K' ? chart.enduranceCurrent : result.playerLoss;

  if (chart.disciplines.includes('Mindshield') && enemy.attacksWithMindblast) {
    playerLoss = 0;
  }

  const nextEnemy: Enemy = { ...enemy, endurance: Math.max(0, enemy.endurance - enemyLoss) };
  const nextChart: ActionChart = {
    ...chart,
    enduranceCurrent: Math.max(0, chart.enduranceCurrent - playerLoss),
  };
  nextChart.isAlive = nextChart.enduranceCurrent > 0;

  const enemyKilled = nextEnemy.endurance <= 0;
  const playerKilled = nextChart.enduranceCurrent <= 0;

  const log = `Combat Ratio ${ratio >= 0 ? '+' : ''}${ratio}, rolled ${roll}: ${enemy.name} loses ${enemyLoss} Endurance, Lone Wolf loses ${playerLoss} Endurance.`;

  return {
    chart: nextChart,
    enemy: nextEnemy,
    roll,
    ratio,
    enemyLoss,
    playerLoss,
    playerKilled,
    enemyKilled,
    log,
  };
}
