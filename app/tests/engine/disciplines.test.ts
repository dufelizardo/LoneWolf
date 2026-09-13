import { describe, expect, it } from 'vitest';
import {
  applyHealingRegen,
  applyMissedMealPenalty,
  eatMeal,
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
});

describe('useHealingPotion', () => {
  it('restores 4 Endurance and marks the potion used', () => {
    const chart = chartFor('tck', {
      hasHealingPotion: true,
      hasHealingPotionUsed: false,
      enduranceCurrent: 10,
      enduranceMax: 20,
    });
    const after = useHealingPotion(chart);
    expect(after.enduranceCurrent).toBe(14);
    expect(after.hasHealingPotionUsed).toBe(true);
  });

  it('is a no-op once already used', () => {
    const chart = chartFor('tck', { hasHealingPotion: true, hasHealingPotionUsed: true, enduranceCurrent: 10 });
    expect(useHealingPotion(chart).enduranceCurrent).toBe(10);
  });
});
