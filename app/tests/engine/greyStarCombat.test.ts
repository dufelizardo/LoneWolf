import { describe, expect, it } from 'vitest';
import { getCombatResult } from '../../src/data/crt';
import { canUseStaffMagic, getEffectiveCombatSkill, resolveGreyStarCombatRound } from '../../src/engine/greyStarCombat';
import { createFreshGreyStarCharacter } from '../../src/engine/greyStarCharacter';
import { adjustWillpower } from '../../src/engine/greyStarInventory';
import { WIZARDS_STAFF, type GreyStarActionChart } from '../../src/engine/greyStarTypes';
import type { Enemy } from '../../src/engine/types';

function fixedRng(...values: number[]): () => number {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
}

function baseChart(overrides: Partial<GreyStarActionChart> = {}): GreyStarActionChart {
  return {
    ...createFreshGreyStarCharacter('gsw', fixedRng(0.5, 0.9, 0.9)), // CS 15, WP 29, EP 29
    ...overrides,
  };
}

describe('getEffectiveCombatSkill / canUseStaffMagic (weapon-penalty tiers)', () => {
  it('no penalty while the Wizard\'s Staff is equipped and WILLPOWER > 0', () => {
    const chart = baseChart({ equippedWeapon: WIZARDS_STAFF, willpowerCurrent: 5 });
    expect(canUseStaffMagic(chart)).toBe(true);
    expect(getEffectiveCombatSkill(chart)).toBe(chart.combatSkill);
  });

  it('-6 with the Staff equipped but WILLPOWER <= 0 ("use it as a normal weapon")', () => {
    const chart = baseChart({ equippedWeapon: WIZARDS_STAFF, willpowerCurrent: 0 });
    expect(canUseStaffMagic(chart)).toBe(false);
    expect(getEffectiveCombatSkill(chart)).toBe(chart.combatSkill - 6);
  });

  it('-6 with any other weapon equipped, regardless of WILLPOWER', () => {
    const chart = baseChart({ equippedWeapon: 'Jewelled Dagger', willpowerCurrent: 10 });
    expect(canUseStaffMagic(chart)).toBe(false);
    expect(getEffectiveCombatSkill(chart)).toBe(chart.combatSkill - 6);
  });

  it('-8 unarmed', () => {
    const chart = baseChart({ equippedWeapon: null, willpowerCurrent: 10 });
    expect(canUseStaffMagic(chart)).toBe(false);
    expect(getEffectiveCombatSkill(chart)).toBe(chart.combatSkill - 8);
  });
});

describe('resolveGreyStarCombatRound', () => {
  it('multiplies the enemy\'s CRT-table loss by the WILLPOWER spent, while the player\'s own loss is unaffected', () => {
    // Combat Ratio -5, roll 6 (cmbtrulz.htm's worked example) - reuses getCombatResult from crt.ts
    // unchanged (see greyStarCombat.ts's doc comment), so the base cell is whatever this app's own
    // CRT reconstruction returns for that ratio/roll, not necessarily the printed book's exact digit
    // (crt.ts's own doc comment: interior cells "may differ by a point or two from the printed book").
    const base = getCombatResult(-5, 6);
    expect(base.playerLoss).not.toBe('K');
    expect(base.enemyLoss).not.toBe('K');

    const chart = baseChart({ combatSkill: 15, equippedWeapon: WIZARDS_STAFF, willpowerCurrent: 10 });
    const enemy: Enemy = { name: 'Test Enemy', combatSkill: 20, endurance: 20 }; // ratio = 15 - 20 = -5
    const result = resolveGreyStarCombatRound(chart, enemy, fixedRng(0.65), 2); // roll = floor(0.65*10) = 6

    expect(result.ratio).toBe(-5);
    expect(result.roll).toBe(6);
    expect(result.willpowerSpent).toBe(2);
    expect(result.playerLoss).toBe(base.playerLoss);
    expect(result.enemyLoss).toBe((base.enemyLoss as number) * 2);
    expect(result.chart.willpowerCurrent).toBe(8);
  });

  it('clamps the chosen spend to at least 1 and at most the current WILLPOWER', () => {
    const chart = baseChart({ equippedWeapon: WIZARDS_STAFF, willpowerCurrent: 3 });
    const enemy: Enemy = { name: 'Test Enemy', combatSkill: chart.combatSkill, endurance: 20 };

    const overspend = resolveGreyStarCombatRound(chart, enemy, fixedRng(0.5), 10);
    expect(overspend.willpowerSpent).toBe(3);

    const underspend = resolveGreyStarCombatRound(chart, enemy, fixedRng(0.5), 0);
    expect(underspend.willpowerSpent).toBe(1);
  });

  it('spends no WILLPOWER at all, and applies no multiplier, once Staff magic is locked out (WILLPOWER <= 0)', () => {
    const chart = baseChart({ equippedWeapon: WIZARDS_STAFF, willpowerCurrent: 0 });
    const enemy: Enemy = { name: 'Test Enemy', combatSkill: chart.combatSkill - 6, endurance: 20 };
    const result = resolveGreyStarCombatRound(chart, enemy, fixedRng(0.5), 5);

    const base = getCombatResult(0, 5);
    expect(result.willpowerSpent).toBe(0);
    expect(result.enemyLoss).toBe(base.enemyLoss);
    expect(result.chart.willpowerCurrent).toBe(0);
  });
});

describe('WILLPOWER can go negative (no floor, unlike ENDURANCE)', () => {
  it('adjustWillpower applies deltas with no clamping in either direction', () => {
    const chart = baseChart({ willpowerCurrent: 2 });
    const dropped = adjustWillpower(chart, -5);
    expect(dropped.willpowerCurrent).toBe(-3);

    const risenAboveStart = adjustWillpower(baseChart({ willpowerCurrent: 29 }), 10);
    expect(risenAboveStart.willpowerCurrent).toBe(39);
  });

  it('Staff magic is locked out once WILLPOWER is negative, same as exactly 0', () => {
    const chart = baseChart({ equippedWeapon: WIZARDS_STAFF, willpowerCurrent: -2 });
    expect(canUseStaffMagic(chart)).toBe(false);
    expect(getEffectiveCombatSkill(chart)).toBe(chart.combatSkill - 6);
  });
});
