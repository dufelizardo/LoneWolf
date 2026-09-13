import { describe, expect, it } from 'vitest';
import { addWeapon, equipWeapon, removeWeapon } from '../../src/engine/inventory';
import { createFreshCharacterForBook } from '../../src/engine/character';

function fixedRng(...values: number[]): () => number {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
}

describe('addWeapon', () => {
  it('does not add the same weapon type twice (only one equippedWeapon slot exists to track it)', () => {
    const chart = createFreshCharacterForBook('ft', fixedRng(0.1, 0.1, 0.9, 0.65));
    expect(chart.weapons).toEqual(['Axe']);
    const withDuplicate = addWeapon(chart, 'Axe');
    expect(withDuplicate.weapons).toEqual(['Axe']);
  });

  it('still allows two distinct weapons up to the cap', () => {
    const chart = createFreshCharacterForBook('ft', fixedRng(0.1, 0.1, 0.9, 0.65));
    const withSpear = addWeapon(chart, 'Spear');
    expect(withSpear.weapons).toEqual(['Axe', 'Spear']);
  });
});

describe('equipWeapon / removeWeapon', () => {
  it('re-equips the remaining weapon when the equipped one is removed', () => {
    const chart = addWeapon(createFreshCharacterForBook('ft', fixedRng(0.1, 0.1, 0.9, 0.65)), 'Spear');
    const afterRemove = removeWeapon(chart, 'Axe');
    expect(afterRemove.weapons).toEqual(['Spear']);
    expect(afterRemove.equippedWeapon).toBe('Spear');
  });

  it('switches the equipped weapon without changing the carried list', () => {
    const chart = addWeapon(createFreshCharacterForBook('ft', fixedRng(0.1, 0.1, 0.9, 0.65)), 'Spear');
    const equipped = equipWeapon(chart, 'Spear');
    expect(equipped.equippedWeapon).toBe('Spear');
    expect(equipped.weapons).toEqual(chart.weapons);
  });
});
