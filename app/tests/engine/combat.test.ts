import { describe, expect, it } from 'vitest';
import { getCombatResult } from '../../src/data/crt';
import { getEffectiveCombatSkill, resolveCombatRound } from '../../src/engine/combat';
import { createFreshCharacterForBook } from '../../src/engine/character';
import type { ActionChart, Enemy } from '../../src/engine/types';

function fixedRng(...values: number[]): () => number {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
}

describe('getCombatResult', () => {
  it('kills Lone Wolf automatically at ratio <= -11 and a low roll', () => {
    const result = getCombatResult(-15, 1);
    expect(result.playerLoss).toBe('K');
    expect(result.enemyLoss).toBe(0);
  });

  it('kills the enemy automatically at ratio >= 11 and a high roll', () => {
    const result = getCombatResult(15, 9);
    expect(result.enemyLoss).toBe('K');
    expect(result.playerLoss).toBe(0);
  });

  it('is monotonic: a better ratio never increases the player loss for the same roll', () => {
    for (let roll = 0; roll <= 9; roll++) {
      let previous = getCombatResult(-11, roll);
      for (let ratio = -10; ratio <= 11; ratio++) {
        const current = getCombatResult(ratio, roll);
        const prevLoss = previous.playerLoss === 'K' ? 8 : previous.playerLoss;
        const currLoss = current.playerLoss === 'K' ? 8 : current.playerLoss;
        expect(currLoss).toBeLessThanOrEqual(prevLoss);
        previous = current;
      }
    }
  });

  it('returns numeric losses within sane bounds away from the extremes', () => {
    const result = getCombatResult(0, 5);
    expect(result.enemyLoss).not.toBe('K');
    expect(result.playerLoss).not.toBe('K');
  });
});

describe('getEffectiveCombatSkill', () => {
  const baseChart: ActionChart = {
    ...createFreshCharacterForBook('ft', fixedRng(0, 0, 0)),
    disciplines: [],
    equippedWeapon: 'Axe',
    weapons: ['Axe'],
  };
  const enemy: Enemy = { name: 'Giak', combatSkill: 10, endurance: 10 };

  it('applies a -4 penalty when no weapon is equipped', () => {
    const unarmed: ActionChart = { ...baseChart, equippedWeapon: null };
    expect(getEffectiveCombatSkill(unarmed, enemy)).toBe(baseChart.combatSkill - 4);
  });

  it('applies +2 Weaponskill bonus only when wielding the matching weapon', () => {
    const withDiscipline: ActionChart = {
      ...baseChart,
      disciplines: ['Weaponskill'],
      weaponskillWeapon: 'Axe',
    };
    expect(getEffectiveCombatSkill(withDiscipline, enemy)).toBe(baseChart.combatSkill + 2);

    const wrongWeapon: ActionChart = { ...withDiscipline, weaponskillWeapon: 'Sword' };
    expect(getEffectiveCombatSkill(wrongWeapon, enemy)).toBe(baseChart.combatSkill);
  });

  it('applies +2 Mindblast bonus unless the enemy is immune', () => {
    const withMindblast: ActionChart = { ...baseChart, disciplines: ['Mindblast'] };
    expect(getEffectiveCombatSkill(withMindblast, enemy)).toBe(baseChart.combatSkill + 2);
    expect(getEffectiveCombatSkill(withMindblast, { ...enemy, mindblastImmune: true })).toBe(baseChart.combatSkill);
  });

  it('applies +2 Combat Skill while holding a Shield (Book 2 special item)', () => {
    const withShield: ActionChart = { ...baseChart, specialItems: [...baseChart.specialItems, { name: 'Shield' }] };
    expect(getEffectiveCombatSkill(withShield, enemy)).toBe(baseChart.combatSkill + 2);
  });

  it('applies +3 Weaponmastery bonus only when wielding a mastered weapon', () => {
    const withMastery: ActionChart = { ...baseChart, masteredWeapons: ['Axe', 'Bow', 'Sword'] };
    expect(getEffectiveCombatSkill(withMastery, enemy)).toBe(baseChart.combatSkill + 3);

    const unmasteredWeapon: ActionChart = { ...withMastery, equippedWeapon: 'Mace', weapons: ['Mace'] };
    expect(getEffectiveCombatSkill(unmasteredWeapon, enemy)).toBe(baseChart.combatSkill);
  });

  it('applies the free +2 Psi-surge/Mindblast bonus when usePsiSurge is not requested', () => {
    const withPsiSurge: ActionChart = { ...baseChart, magnakaiDisciplines: ['PsiSurge'] };
    expect(getEffectiveCombatSkill(withPsiSurge, enemy)).toBe(baseChart.combatSkill + 2);
    expect(getEffectiveCombatSkill(withPsiSurge, { ...enemy, mindblastImmune: true })).toBe(baseChart.combatSkill);
  });

  it('applies the costed +4 Psi-surge bonus when usePsiSurge is requested and Endurance allows it', () => {
    const withPsiSurge: ActionChart = { ...baseChart, magnakaiDisciplines: ['PsiSurge'], enduranceCurrent: 10 };
    expect(getEffectiveCombatSkill(withPsiSurge, enemy, { usePsiSurge: true })).toBe(baseChart.combatSkill + 4);
  });

  it('falls back to the free +2 bonus when usePsiSurge is requested but Endurance is too low', () => {
    const lowEndurance: ActionChart = { ...baseChart, magnakaiDisciplines: ['PsiSurge'], enduranceCurrent: 6 };
    expect(getEffectiveCombatSkill(lowEndurance, enemy, { usePsiSurge: true })).toBe(baseChart.combatSkill + 2);
  });

  it('applies the reduced -2 unarmed penalty only for a Weaponmastery holder at Tutelary rank (5+ Magnakai Disciplines)', () => {
    const unarmed: ActionChart = { ...baseChart, equippedWeapon: null };

    // No Magnakai Disciplines at all: usual -4.
    expect(getEffectiveCombatSkill(unarmed, enemy)).toBe(baseChart.combatSkill - 4);

    // Weaponmastery held, but only at Primate rank (4 disciplines): still -4.
    const primateWeaponmaster: ActionChart = {
      ...unarmed,
      magnakaiDisciplines: ['Weaponmastery', 'Curing', 'Huntmastery', 'Divination'],
    };
    expect(getEffectiveCombatSkill(primateWeaponmaster, enemy)).toBe(baseChart.combatSkill - 4);

    // 5 disciplines (Tutelary rank) but without Weaponmastery: still -4.
    const tutelaryWithoutWeaponmastery: ActionChart = {
      ...unarmed,
      magnakaiDisciplines: ['Curing', 'Huntmastery', 'Divination', 'Nexus', 'PsiScreen'],
    };
    expect(getEffectiveCombatSkill(tutelaryWithoutWeaponmastery, enemy)).toBe(baseChart.combatSkill - 4);

    // Weaponmastery held at Tutelary rank (5 disciplines): reduced to -2.
    const tutelaryWeaponmaster: ActionChart = {
      ...unarmed,
      magnakaiDisciplines: ['Weaponmastery', 'Curing', 'Huntmastery', 'Divination', 'Nexus'],
    };
    expect(getEffectiveCombatSkill(tutelaryWeaponmaster, enemy)).toBe(baseChart.combatSkill - 2);
  });
});

describe('resolveCombatRound', () => {
  it('applies Mindshield to fully block Mindblast damage', () => {
    const chart: ActionChart = {
      ...createFreshCharacterForBook('ft', fixedRng(0, 0, 0)),
      disciplines: ['Mindshield'],
      equippedWeapon: 'Axe',
      weapons: ['Axe'],
    };
    const enemy: Enemy = { name: 'Mindblasting Foe', combatSkill: 30, endurance: 10, attacksWithMindblast: true };
    const result = resolveCombatRound(chart, enemy, fixedRng(0.9));
    expect(result.playerLoss).toBe(0);
  });

  it('reduces both endurances and flags kills at zero', () => {
    const chart: ActionChart = {
      ...createFreshCharacterForBook('ft', fixedRng(0, 0, 0)),
      combatSkill: 20,
      enduranceCurrent: 5,
      equippedWeapon: 'Axe',
      weapons: ['Axe'],
    };
    const enemy: Enemy = { name: 'Weakling', combatSkill: 1, endurance: 1 };
    const result = resolveCombatRound(chart, enemy, fixedRng(0.99));
    expect(result.enemy.endurance).toBe(0);
    expect(result.enemyKilled).toBe(true);
  });

  it('applies Psi-screen to fully block Mindforce damage, same as Mindshield', () => {
    const chart: ActionChart = {
      ...createFreshCharacterForBook('tkt', fixedRng(0, 0, 0)),
      magnakaiDisciplines: ['PsiScreen'],
      equippedWeapon: 'Axe',
      weapons: ['Axe'],
    };
    const enemy: Enemy = { name: 'Mindblasting Foe', combatSkill: 30, endurance: 10, attacksWithMindblast: true };
    const result = resolveCombatRound(chart, enemy, fixedRng(0.9));
    expect(result.playerLoss).toBe(0);
  });

  it('deducts an extra 2 Endurance when Psi-surge is actively used this round', () => {
    const chart: ActionChart = {
      ...createFreshCharacterForBook('tkt', fixedRng(0, 0, 0)),
      magnakaiDisciplines: ['PsiSurge'],
      enduranceCurrent: 20,
      equippedWeapon: 'Axe',
      weapons: ['Axe'],
    };
    const enemy: Enemy = { name: 'Giak', combatSkill: 10, endurance: 10 };
    const result = resolveCombatRound(chart, enemy, fixedRng(0.5), { usePsiSurge: true });
    expect(result.psiSurgeCost).toBe(2);
    expect(result.chart.enduranceCurrent).toBe(20 - result.playerLoss - 2);
  });

  it('does not charge the Psi-surge cost when it was not used this round', () => {
    const chart: ActionChart = {
      ...createFreshCharacterForBook('tkt', fixedRng(0, 0, 0)),
      magnakaiDisciplines: ['PsiSurge'],
      enduranceCurrent: 20,
      equippedWeapon: 'Axe',
      weapons: ['Axe'],
    };
    const enemy: Enemy = { name: 'Giak', combatSkill: 10, endurance: 10 };
    const result = resolveCombatRound(chart, enemy, fixedRng(0.5));
    expect(result.psiSurgeCost).toBe(0);
  });

  it('does not charge the Psi-surge cost when Endurance is too low to activate it', () => {
    const chart: ActionChart = {
      ...createFreshCharacterForBook('tkt', fixedRng(0, 0, 0)),
      magnakaiDisciplines: ['PsiSurge'],
      enduranceCurrent: 6,
      equippedWeapon: 'Axe',
      weapons: ['Axe'],
    };
    const enemy: Enemy = { name: 'Giak', combatSkill: 10, endurance: 10 };
    const result = resolveCombatRound(chart, enemy, fixedRng(0.5), { usePsiSurge: true });
    expect(result.psiSurgeCost).toBe(0);
  });
});
