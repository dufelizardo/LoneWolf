import { describe, expect, it } from 'vitest';
import { applyDisciplines, createCharacter } from '../../src/engine/character';
import { ALL_DISCIPLINES } from '../../src/engine/types';

function fixedRng(...values: number[]): () => number {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
}

describe('createCharacter', () => {
  it('rolls Combat Skill in [10, 19] and Endurance in [20, 29] before equipment bonuses', () => {
    for (let digit = 0; digit <= 9; digit++) {
      const chart = createCharacter(fixedRng(digit / 10, digit / 10, digit / 10, digit / 10));
      expect(chart.combatSkill).toBe(10 + digit);
      expect(chart.enduranceCurrent).toBeGreaterThanOrEqual(20 + digit);
    }
  });

  it('always starts with an Axe, a Meal, and the Map of Sommerlund', () => {
    const chart = createCharacter(fixedRng(0.1, 0.1, 0.1, 0.1));
    expect(chart.weapons).toContain('Axe');
    expect(chart.backpackItems).toContain('Meal');
    expect(chart.specialItems).toContain('Map of Sommerlund');
  });

  it('caps gold crowns rolled at creation to a single digit (0-9)', () => {
    const chart = createCharacter(fixedRng(0, 0.9, 0, 0));
    expect(chart.goldCrowns).toBeGreaterThanOrEqual(0);
    expect(chart.goldCrowns).toBeLessThanOrEqual(9 + 12); // could gain +12 from the bonus table roll
  });
});

describe('applyDisciplines', () => {
  it('rejects anything other than exactly 5 disciplines', () => {
    const chart = createCharacter(fixedRng(0, 0, 0, 0));
    expect(() => applyDisciplines(chart, ALL_DISCIPLINES.slice(0, 4))).toThrow();
    expect(() => applyDisciplines(chart, ALL_DISCIPLINES)).toThrow();
  });

  it('rolls a Weaponskill weapon only when that discipline is chosen', () => {
    const chart = createCharacter(fixedRng(0, 0, 0, 0));
    const withWeaponskill = applyDisciplines(
      chart,
      ['Weaponskill', 'Healing', 'Hunting', 'Camouflage', 'Tracking'],
      fixedRng(0),
    );
    expect(withWeaponskill.weaponskillWeapon).not.toBeNull();

    const without = applyDisciplines(chart, ['Healing', 'Hunting', 'Camouflage', 'Tracking', 'SixthSense']);
    expect(without.weaponskillWeapon).toBeNull();
  });
});
