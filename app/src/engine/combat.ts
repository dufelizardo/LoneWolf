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
// "Archmasters may add 6 points to their COMBAT SKILL instead of the usual 4 points. For every round
// in which Psi-surge is used, Archmasters need only deduct 1 ENDURANCE point. When using the weaker
// psychic attack - Mindblast - they may add 3 points to their COMBAT SKILL without loss of ENDURANCE
// points. Archmasters cannot use Psi-surge if their ENDURANCE score falls to 4 points or below."
// (imprvdsc.htm, Book 12) - a further override of Psi-surge's bonus/cost/floor, once held at
// Archmaster rank (9 Magnakai Disciplines), first reachable in Book 12.
const PSI_SURGE_BONUS_ARCHMASTER = 6;
const PSI_SURGE_FREE_BONUS_ARCHMASTER = 3;
const PSI_SURGE_COST_ARCHMASTER = 1;
const PSI_SURGE_MIN_ENDURANCE_ARCHMASTER = 4;
export const ARCHMASTER_DISCIPLINE_COUNT = 9;
// "When using their psychic ability to attack an enemy, Grand Masters may add 8 points to their
// COMBAT SKILL. For every round in which Kai-surge is used, Grand Masters need only deduct 1
// ENDURANCE point. When using the weaker psychic attack - Mindblast - they may add 4 points without
// loss of ENDURANCE points... Grand Masters cannot use Kai-surge if their ENDURANCE score falls to 6
// points or below." (discplnz.htm, Book 13) - Kai-surge (Grand Master phase) supersedes Psi-surge
// entirely (same "replace, not cumulative" rule as Grand Weaponmastery/Weaponmastery below), rather
// than adding a fourth tier on top of it. Note its Endurance floor (6) is HIGHER than Archmaster
// Psi-surge's (4) - a genuine quirk of the source material, not a bug: Kai-surge's own numbers are
// simply stated fresh, not as a further reduction of the Magnakai floor.
const KAI_SURGE_BONUS = 8;
const KAI_SURGE_FREE_BONUS = 4;
const KAI_SURGE_COST = 1;
const KAI_SURGE_MIN_ENDURANCE = 6;
// "When you enter combat with one of your Grand Weaponmastery weapons, you add 5 points to your
// COMBAT SKILL." (discplnz.htm, Book 13) - like Kai-surge above, this supersedes the Weaponmastery
// bonus (any tier) rather than stacking with it; confirmed via errata: "Weaponmastery bonuses are
// replaced by Grand Weaponmastery bonuses, not added cumulatively." Tracked via a separate
// `grandMasteredWeapons` list rather than merged into `masteredWeapons` (see its doc comment).
const GRAND_WEAPONMASTERY_BONUS = 5;
// "Sun Lords with this Discipline are able to cause the metal edge of any non-magical weapon to
// ignite and burn fiercely. When a weapon thus affected is used in combat, it inflicts an additional
// 1 ENDURANCE point loss upon an enemy in every successful round of combat. This ability cannot be
// used with a wholly wooden weapon such as a quarterstaff." (imprvdsc.htm, Book 16) - the first
// genuinely numeric Improved Discipline bonus since the Grand Master phase began (Books 13-15's
// rank-up content was purely narrative). Applies once Sun Lord rank (7 Grand Master Disciplines) is
// reached, on top of the flat Grand Weaponmastery Combat Skill bonus above.
const GRAND_WEAPONMASTERY_FIRE_BONUS = 1;
const SUN_LORD_DISCIPLINE_COUNT = 7;
// "It can cause an enemy to lose between 2 and 18 ENDURANCE points in one attack. A Kai Sun Lord
// using Kai-blast determines the damage inflicted on an enemy by picking two numbers from the Random
// Number Table. These numbers should be added together (a '0' = 1)... use of a Kai-blast will reduce
// a Sun Lord's ENDURANCE points total by 4. It cannot be used in conjunction with any other form of
// psychic attack." (imprvdsc.htm, Book 16, Kai-surge at Sun Lord rank). The source text doesn't state
// whether the enemy still attacks back the same round; by design decision, Kai-blast replaces the
// round entirely (no Combat Ratio/CRT roll, no return damage) rather than adding to a normal round.
const KAI_BLAST_COST = 4;
// "When fighting bare-handed, i.e. without any weapons, they may add 3 points to their COMBAT
// SKILL." (imprvdsc.htm, Book 19, Grand Weaponmastery at Grand Crown rank) - unlike the Magnakai
// no-weapon tiers above (Tutelary/Scion-kai, which merely reduce the -4 penalty), this is a genuine
// positive bonus that fully replaces the no-weapon penalty rather than shrinking it. Applies once
// Grand Crown rank (10 Grand Master Disciplines) is reached.
const GRAND_WEAPONMASTERY_UNARMED_BONUS = 3;
const GRAND_CROWN_DISCIPLINE_COUNT = 10;
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
  /** Player's choice to use Kai-blast this round instead of a normal round. Only relevant once canUseKaiBlast(chart) is true; ignored otherwise. Mutually exclusive with usePsiSurge - Kai-blast wins if both are set. */
  useKaiBlast?: boolean;
}

/** Whether the character has reached Sun Lord rank (7 Grand Master Disciplines) with Kai-surge, and can therefore use Kai-blast. */
export function canUseKaiBlast(chart: ActionChart): boolean {
  return chart.grandMasterDisciplines.includes('KaiSurge') && chart.grandMasterDisciplines.length >= SUN_LORD_DISCIPLINE_COUNT;
}

function isArchmaster(chart: ActionChart): boolean {
  return chart.magnakaiDisciplines.length >= ARCHMASTER_DISCIPLINE_COUNT;
}

export interface PsiSurgeTier {
  /** Display name for whichever discipline is actually providing this tier - "Psi-surge" or "Kai-surge". */
  name: string;
  bonus: number;
  freeBonus: number;
  cost: number;
  minEndurance: number;
}

const PSI_SURGE_TIER_BASE: PsiSurgeTier = {
  name: 'Psi-surge',
  bonus: PSI_SURGE_BONUS,
  freeBonus: PSI_SURGE_FREE_BONUS,
  cost: PSI_SURGE_COST,
  minEndurance: PSI_SURGE_MIN_ENDURANCE,
};
const PSI_SURGE_TIER_ARCHMASTER: PsiSurgeTier = {
  name: 'Psi-surge',
  bonus: PSI_SURGE_BONUS_ARCHMASTER,
  freeBonus: PSI_SURGE_FREE_BONUS_ARCHMASTER,
  cost: PSI_SURGE_COST_ARCHMASTER,
  minEndurance: PSI_SURGE_MIN_ENDURANCE_ARCHMASTER,
};
const PSI_SURGE_TIER_KAI_SURGE: PsiSurgeTier = {
  name: 'Kai-surge',
  bonus: KAI_SURGE_BONUS,
  freeBonus: KAI_SURGE_FREE_BONUS,
  cost: KAI_SURGE_COST,
  minEndurance: KAI_SURGE_MIN_ENDURANCE,
};

/** Picks the best applicable tier of the Psi-surge/Kai-surge family, or null if the character has neither. Kai-surge (Grand Master) supersedes Psi-surge entirely rather than stacking with it. Exported so the UI can render the right name/numbers instead of hardcoding them. */
export function resolvePsiSurgeTier(chart: ActionChart): PsiSurgeTier | null {
  if (chart.grandMasterDisciplines.includes('KaiSurge')) return PSI_SURGE_TIER_KAI_SURGE;
  if (chart.magnakaiDisciplines.includes('PsiSurge')) return isArchmaster(chart) ? PSI_SURGE_TIER_ARCHMASTER : PSI_SURGE_TIER_BASE;
  return null;
}

/** The Endurance floor below which Psi-surge/Kai-surge can't be activated. Exported so the UI can match combat.ts's actual rule instead of hardcoding a value. */
export function psiSurgeMinEndurance(chart: ActionChart): number {
  return resolvePsiSurgeTier(chart)?.minEndurance ?? PSI_SURGE_MIN_ENDURANCE;
}

function psiSurgeCanActivate(chart: ActionChart, options: CombatRoundOptions): boolean {
  const tier = resolvePsiSurgeTier(chart);
  return !!tier && !!options.usePsiSurge && chart.enduranceCurrent > tier.minEndurance;
}

/** Lone Wolf's Combat Skill for this fight, including discipline bonuses and the no-weapon penalty. */
export function getEffectiveCombatSkill(chart: ActionChart, enemy: Enemy, options: CombatRoundOptions = {}): number {
  let skill = chart.combatSkill;

  const hasWeaponmastery = chart.magnakaiDisciplines.includes('Weaponmastery');
  const magnakaiDisciplineCount = chart.magnakaiDisciplines.length;

  if (!chart.equippedWeapon) {
    if (chart.grandMasterDisciplines.includes('GrandWeaponmastery') && chart.grandMasterDisciplines.length >= GRAND_CROWN_DISCIPLINE_COUNT) {
      skill += GRAND_WEAPONMASTERY_UNARMED_BONUS;
    } else if (hasWeaponmastery && magnakaiDisciplineCount >= SCION_KAI_DISCIPLINE_COUNT) {
      skill += NO_WEAPON_PENALTY_SCION_KAI;
    } else if (hasWeaponmastery && magnakaiDisciplineCount >= TUTELARY_DISCIPLINE_COUNT) {
      skill += NO_WEAPON_PENALTY_TUTELARY;
    } else {
      skill += NO_WEAPON_PENALTY;
    }
  } else if (chart.disciplines.includes('Weaponskill') && chart.weaponskillWeapon === chart.equippedWeapon) {
    skill += WEAPONSKILL_BONUS;
  } else if (chart.grandMasteredWeapons.includes(chart.equippedWeapon)) {
    skill += GRAND_WEAPONMASTERY_BONUS;
  } else if (chart.masteredWeapons.includes(chart.equippedWeapon)) {
    skill += magnakaiDisciplineCount >= SCION_KAI_DISCIPLINE_COUNT ? WEAPONMASTERY_BONUS_SCION_KAI : WEAPONMASTERY_BONUS;
  }

  if (chart.disciplines.includes('Mindblast') && !enemy.mindblastImmune) {
    skill += MINDBLAST_BONUS;
  }

  const psiSurgeTier = resolvePsiSurgeTier(chart);
  if (psiSurgeTier && !enemy.mindblastImmune) {
    skill += psiSurgeCanActivate(chart, options) ? psiSurgeTier.bonus : psiSurgeTier.freeBonus;
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
  /** Extra Endurance spent this round for using Kai-blast, already reflected in playerLoss/chart. */
  kaiBlastCost: number;
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
  const kaiBlastActive = !!options.useKaiBlast && canUseKaiBlast(chart);

  if (kaiBlastActive) {
    // Kai-blast replaces the round entirely: no Combat Ratio/CRT lookup, no return damage from the
    // enemy - a decisive psychic strike rather than a mutual exchange of blows (design decision, see
    // KAI_BLAST_COST comment above for the source ambiguity this resolves).
    const roll1 = rollRandomNumber(rng) || 1;
    const roll2 = rollRandomNumber(rng) || 1;
    const enemyLoss = Math.min(enemy.endurance, roll1 + roll2);
    const kaiBlastCost = KAI_BLAST_COST;

    const nextEnemy: Enemy = { ...enemy, endurance: Math.max(0, enemy.endurance - enemyLoss) };
    const nextChart: ActionChart = {
      ...chart,
      enduranceCurrent: Math.max(0, chart.enduranceCurrent - kaiBlastCost),
    };
    nextChart.isAlive = nextChart.enduranceCurrent > 0;

    const enemyKilled = nextEnemy.endurance <= 0;
    const playerKilled = nextChart.enduranceCurrent <= 0;

    const log = `Kai-blast: ${enemy.name} loses ${enemyLoss} Endurance, Lone Wolf loses ${kaiBlastCost} Endurance.`;

    return {
      chart: nextChart,
      enemy: nextEnemy,
      roll: roll1 + roll2,
      ratio: 0,
      enemyLoss,
      playerLoss: 0,
      psiSurgeCost: 0,
      kaiBlastCost,
      playerKilled,
      enemyKilled,
      log,
    };
  }

  const effectiveSkill = getEffectiveCombatSkill(chart, enemy, options);
  const ratio = effectiveSkill - enemy.combatSkill;
  const roll = rollRandomNumber(rng);
  const result = getCombatResult(ratio, roll);

  let enemyLoss = result.enemyLoss === 'K' ? enemy.endurance : result.enemyLoss;
  let playerLoss = result.playerLoss === 'K' ? chart.enduranceCurrent : result.playerLoss;

  if (
    enemyLoss > 0 &&
    chart.grandMasterDisciplines.includes('GrandWeaponmastery') &&
    chart.grandMasterDisciplines.length >= SUN_LORD_DISCIPLINE_COUNT &&
    chart.equippedWeapon &&
    chart.grandMasteredWeapons.includes(chart.equippedWeapon) &&
    chart.equippedWeapon !== 'Quarterstaff'
  ) {
    enemyLoss = Math.min(enemy.endurance, enemyLoss + GRAND_WEAPONMASTERY_FIRE_BONUS);
  }

  if (chart.disciplines.includes('Mindshield') && enemy.attacksWithMindblast) {
    playerLoss = 0;
  }
  if (
    (chart.magnakaiDisciplines.includes('PsiScreen') || chart.grandMasterDisciplines.includes('KaiScreen')) &&
    enemy.attacksWithMindblast
  ) {
    playerLoss = 0;
  }

  const psiSurgeTier = resolvePsiSurgeTier(chart);
  const psiSurgeActive = !!psiSurgeTier && !enemy.mindblastImmune && psiSurgeCanActivate(chart, options);
  const psiSurgeCost = psiSurgeActive ? psiSurgeTier!.cost : 0;
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

  const psiSurgeNote = psiSurgeCost > 0 ? ` (plus ${psiSurgeCost} for using ${psiSurgeTier!.name})` : '';
  const log = `Combat Ratio ${ratio >= 0 ? '+' : ''}${ratio}, rolled ${roll}: ${enemy.name} loses ${enemyLoss} Endurance, Lone Wolf loses ${playerLoss} Endurance${psiSurgeNote}.`;

  return {
    chart: nextChart,
    enemy: nextEnemy,
    roll,
    ratio,
    enemyLoss,
    playerLoss,
    psiSurgeCost,
    kaiBlastCost: 0,
    playerKilled,
    enemyKilled,
    log,
  };
}
