import { describe, expect, it } from 'vitest';
import {
  applyHealingRegen,
  applyMissedMealPenalty,
  eatMeal,
  useCombatPotion,
  useHealingPotion,
} from '../../src/engine/disciplines';
import { createFreshCharacterForBook } from '../../src/engine/character';
import type { ActionChart } from '../../src/engine/types';

function fixedRng(...values: number[]): () => number {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
}

function chartFor(bookId: string, overrides: Partial<ActionChart> = {}): ActionChart {
  return { ...createFreshCharacterForBook(bookId, fixedRng(0, 0, 0, 0)), ...overrides };
}

describe('applyMissedMealPenalty', () => {
  it('exempts a Hunting character from the penalty in books without huntingDisabled', () => {
    const chart = chartFor('ft', { disciplines: ['Hunting'], enduranceCurrent: 20 });
    expect(applyMissedMealPenalty(chart).enduranceCurrent).toBe(20);
  });

  it('applies the -3 Endurance penalty to a character without Hunting', () => {
    const chart = chartFor('ft', { disciplines: [], enduranceCurrent: 20 });
    expect(applyMissedMealPenalty(chart).enduranceCurrent).toBe(17);
  });

  it('does NOT exempt Hunting in book "tck" (Kalte is an icy desert, per equipmnt.htm)', () => {
    const chart = chartFor('tck', { disciplines: ['Hunting'], enduranceCurrent: 20 });
    expect(applyMissedMealPenalty(chart).enduranceCurrent).toBe(17);
  });

  it('never drops Endurance below zero', () => {
    const chart = chartFor('ft', { disciplines: [], enduranceCurrent: 1 });
    expect(applyMissedMealPenalty(chart).enduranceCurrent).toBe(0);
  });

  it('exempts a Huntmastery character from the penalty (Magnakai successor to Hunting)', () => {
    const chart = chartFor('tkt', { magnakaiDisciplines: ['Huntmastery'], enduranceCurrent: 20 });
    expect(applyMissedMealPenalty(chart).enduranceCurrent).toBe(20);
  });
});

describe('eatMeal', () => {
  it('consumes one Meal', () => {
    const chart = chartFor('ft', { meals: 2 });
    expect(eatMeal(chart).meals).toBe(1);
  });

  it('is a no-op with zero Meals', () => {
    const chart = chartFor('ft', { meals: 0 });
    expect(eatMeal(chart).meals).toBe(0);
  });
});

describe('applyHealingRegen', () => {
  it('regenerates 1 Endurance per section for a Healing character outside combat', () => {
    const chart = chartFor('ft', { disciplines: ['Healing'], enduranceCurrent: 10, enduranceMax: 20 });
    expect(applyHealingRegen(chart, false).enduranceCurrent).toBe(11);
  });

  it('does not regenerate after a combat section', () => {
    const chart = chartFor('ft', { disciplines: ['Healing'], enduranceCurrent: 10, enduranceMax: 20 });
    expect(applyHealingRegen(chart, true).enduranceCurrent).toBe(10);
  });

  it('does not exceed enduranceMax', () => {
    const chart = chartFor('ft', { disciplines: ['Healing'], enduranceCurrent: 20, enduranceMax: 20 });
    expect(applyHealingRegen(chart, false).enduranceCurrent).toBe(20);
  });

  it('regenerates for a Curing character too (Magnakai successor to Healing)', () => {
    const chart = chartFor('tkt', { magnakaiDisciplines: ['Curing'], enduranceCurrent: 10, enduranceMax: 20 });
    expect(applyHealingRegen(chart, false).enduranceCurrent).toBe(11);
  });
});

describe('useHealingPotion', () => {
  it('restores 4 Endurance and consumes one dose', () => {
    const chart = chartFor('tck', { healingPotionDoses: 1, enduranceCurrent: 10, enduranceMax: 20 });
    const after = useHealingPotion(chart);
    expect(after.enduranceCurrent).toBe(14);
    expect(after.healingPotionDoses).toBe(0);
  });

  it('is a no-op once out of doses', () => {
    const chart = chartFor('tck', { healingPotionDoses: 0, enduranceCurrent: 10 });
    expect(useHealingPotion(chart).enduranceCurrent).toBe(10);
  });

  it('supports multiple doses (e.g. Book 4\'s "2 Potions of Laumspur")', () => {
    const chart = chartFor('tcd', { healingPotionDoses: 2, enduranceCurrent: 10, enduranceMax: 20 });
    const afterFirst = useHealingPotion(chart);
    expect(afterFirst.healingPotionDoses).toBe(1);
    expect(afterFirst.enduranceCurrent).toBe(14);
    const afterSecond = useHealingPotion(afterFirst);
    expect(afterSecond.healingPotionDoses).toBe(0);
    expect(afterSecond.enduranceCurrent).toBe(18);
    const afterThird = useHealingPotion(afterSecond);
    expect(afterThird.enduranceCurrent).toBe(18);
  });
});

describe('useCombatPotion', () => {
  it('consumes exactly one dose and leaves Combat Skill/Endurance untouched (the +2 CS effect is applied in combat.ts, not here)', () => {
    const chart = chartFor('tdt', { combatPotionDoses: 1, combatSkill: 20, enduranceCurrent: 20 });
    const after = useCombatPotion(chart);
    expect(after.combatPotionDoses).toBe(0);
    expect(after.combatSkill).toBe(20);
    expect(after.enduranceCurrent).toBe(20);
  });

  it('is a no-op once out of doses', () => {
    const chart = chartFor('tdt', { combatPotionDoses: 0 });
    expect(useCombatPotion(chart).combatPotionDoses).toBe(0);
  });

  it('supports multiple doses', () => {
    const chart = chartFor('tdt', { combatPotionDoses: 2 });
    const afterFirst = useCombatPotion(chart);
    expect(afterFirst.combatPotionDoses).toBe(1);
    const afterSecond = useCombatPotion(afterFirst);
    expect(afterSecond.combatPotionDoses).toBe(0);
    const afterThird = useCombatPotion(afterSecond);
    expect(afterThird.combatPotionDoses).toBe(0);
  });
});
