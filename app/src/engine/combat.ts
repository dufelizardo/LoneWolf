import { getCombatResult } from '../data/crt';
import { rollRandomNumber, type Rng } from './rng';
import type { ActionChart, Enemy } from './types';

const NO_WEAPON_PENALTY = -4;
// "Tutelaries are able to use defensive combat skills to great effect when fighting unarmed. When
// entering combat without a weapon, you will lose only 2 points from your COMBAT SKILL, instead of
// the usual 4 points." (imprvdsc.htm, Book 8) - only once Weaponmastery is held at Tutelary rank
// (5 Magnakai Disciplines), first reachable in Book 8.
const NO_WEAPON_PENALTY_TUTELARY = -2;
const TUTELARY_DISCIPLINE_COUNT = 5;
// "When entering combat with a weapon they have mastered, Scion-kai may add 4 points (instead of
// the usual 3 points) to their COMBAT SKILL. Also, when in combat without a weapon they lose only 1
// point from their COMBAT SKILL." (imprvdsc.htm, Book 11) - a further override of both the base
// Weaponmastery bonus and the Tutelary unarmed penalty, once Weaponmastery is held at Scion-kai rank
// (8 Magnakai Disciplines), first reachable in Book 11.
const NO_WEAPON_PENALTY_SCION_KAI = -1;
const WEAPONMASTERY_BONUS_SCION_KAI = 4;
const SCION_KAI_DISCIPLINE_COUNT = 8;
const WEAPONSKILL_BONUS = 2;
const MINDBLAST_BONUS = 2;
const WEAPONMASTERY_BONUS = 3;
const PSI_SURGE_BONUS = 4;
const PSI_SURGE_FREE_BONUS = 2; // the free "Mindblast" sub-mode of Psi-surge
const PSI_SURGE_COST = 2; // Endurance, only when the costed mode actually activates
const PSI_SURGE_MIN_ENDURANCE = 6; // "Psi-surge cannot be used if your ENDURANCE falls to 6 points or below"
// "This potion of strength will increase your COMBAT SKILL by +2 points when swallowed immediately
// prior to a combat. It lasts for the duration of one combat only." (equipmnt.htm, Book 10). The
// dose itself is spent via useCombatPotion (disciplines.ts) before the fight starts; this flag is
// just "is it currently active", decided and held by the caller (CombatModal) for the whole fight -
// unlike Psi-surge's per-round cost, this isn't re-paid or re-validated here.
const COMBAT_POTION_BONUS = 2;

/** Special Items that grant a flat Combat Skill bonus whenever held (e.g. the Book 2 Shield). */
const SPECIAL_ITEM_COMBAT_BONUS: Record<string, number> = {
  Shield: 2,
};

export interface CombatRoundOptions {
  /** Player's choice to activate the costed +4 CS mode this round, instead of the free +2 CS Mindblast sub-mode. Only relevant with the Psi-surge discipline; ignored otherwise. */
  usePsiSurge?: boolean;
  /** Whether a Potion of Alether is currently active for this fight (dose already spent by the caller via useCombatPotion). Applies flatly every round for the rest of the fight, not just once. */
  useCombatPotion?: boolean;
}

function psiSurgeCanActivate(chart: ActionChart, options: CombatRoundOptions): boolean {
  return !!options.usePsiSurge && chart.enduranceCurrent > PSI_SURGE_MIN_ENDURANCE;
}

/** Lone Wolf's Combat Skill for this fight, including discipline bonuses and the no-weapon penalty. */
export function getEffectiveCombatSkill(chart: ActionChart, enemy: Enemy, options: CombatRoundOptions = {}): number {
  let skill = chart.combatSkill;

  const hasWeaponmastery = chart.magnakaiDisciplines.includes('Weaponmastery');
  const magnakaiDisciplineCount = chart.magnakaiDisciplines.length;

  if (!chart.equippedWeapon) {
    if (hasWeaponmastery && magnakaiDisciplineCount >= SCION_KAI_DISCIPLINE_COUNT) {
      skill += NO_WEAPON_PENALTY_SCION_KAI;
    } else if (hasWeaponmastery && magnakaiDisciplineCount >= TUTELARY_DISCIPLINE_COUNT) {
      skill += NO_WEAPON_PENALTY_TUTELARY;
    } else {
      skill += NO_WEAPON_PENALTY;
    }
  } else if (chart.disciplines.includes('Weaponskill') && chart.weaponskillWeapon === chart.equippedWeapon) {
    skill += WEAPONSKILL_BONUS;
  } else if (chart.masteredWeapons.includes(chart.equippedWeapon)) {
    skill += magnakaiDisciplineCount >= SCION_KAI_DISCIPLINE_COUNT ? WEAPONMASTERY_BONUS_SCION_KAI : WEAPONMASTERY_BONUS;
  }

  if (chart.disciplines.includes('Mindblast') && !enemy.mindblastImmune) {
    skill += MINDBLAST_BONUS;
  }

  if (chart.magnakaiDisciplines.includes('PsiSurge') && !enemy.mindblastImmune) {
    skill += psiSurgeCanActivate(chart, options) ? PSI_SURGE_BONUS : PSI_SURGE_FREE_BONUS;
  }

  if (options.useCombatPotion) {
    skill += COMBAT_POTION_BONUS;
  }

  for (const item of chart.specialItems) {
    skill += SPECIAL_ITEM_COMBAT_BONUS[item.name] ?? 0;
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
  /** Extra Endurance spent this round for the costed Psi-surge mode, already reflected in playerLoss/chart. */
  psiSurgeCost: number;
  playerKilled: boolean;
  enemyKilled: boolean;
  log: string;
}

/** Resolves a single round of combat between the player and one enemy. */
export function resolveCombatRound(
  chart: ActionChart,
  enemy: Enemy,
  rng: Rng = Math.random,
  options: CombatRoundOptions = {},
): CombatRoundResult {
  const effectiveSkill = getEffectiveCombatSkill(chart, enemy, options);
  const ratio = effectiveSkill - enemy.combatSkill;
  const roll = rollRandomNumber(rng);
  const result = getCombatResult(ratio, roll);

  const enemyLoss = result.enemyLoss === 'K' ? enemy.endurance : result.enemyLoss;
  let playerLoss = result.playerLoss === 'K' ? chart.enduranceCurrent : result.playerLoss;

  if (chart.disciplines.includes('Mindshield') && enemy.attacksWithMindblast) {
    playerLoss = 0;
  }
  if (chart.magnakaiDisciplines.includes('PsiScreen') && enemy.attacksWithMindblast) {
    playerLoss = 0;
  }

  const psiSurgeActive =
    chart.magnakaiDisciplines.includes('PsiSurge') && !enemy.mindblastImmune && psiSurgeCanActivate(chart, options);
  const psiSurgeCost = psiSurgeActive ? PSI_SURGE_COST : 0;
  // Self-inflicted, not enemy damage — applies even when Mindshield/Psi-screen zeroed the combat loss above.
  const totalPlayerLoss = playerLoss + psiSurgeCost;

  const nextEnemy: Enemy = { ...enemy, endurance: Math.max(0, enemy.endurance - enemyLoss) };
  const nextChart: ActionChart = {
    ...chart,
    enduranceCurrent: Math.max(0, chart.enduranceCurrent - totalPlayerLoss),
  };
  nextChart.isAlive = nextChart.enduranceCurrent > 0;

  const enemyKilled = nextEnemy.endurance <= 0;
  const playerKilled = nextChart.enduranceCurrent <= 0;

  const psiSurgeNote = psiSurgeCost > 0 ? ` (plus ${psiSurgeCost} for using Psi-surge)` : '';
  const log = `Combat Ratio ${ratio >= 0 ? '+' : ''}${ratio}, rolled ${roll}: ${enemy.name} loses ${enemyLoss} Endurance, Lone Wolf loses ${playerLoss} Endurance${psiSurgeNote}.`;

  return {
    chart: nextChart,
    enemy: nextEnemy,
    roll,
    ratio,
    enemyLoss,
    playerLoss,
    psiSurgeCost,
    playerKilled,
    enemyKilled,
    log,
  };
}
