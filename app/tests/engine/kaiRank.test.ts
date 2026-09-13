import { describe, expect, it } from 'vitest';
import { getKaiRank } from '../../src/engine/kaiRank';

describe('getKaiRank', () => {
  it('maps 5 disciplines (the series starting point) to Initiate', () => {
    expect(getKaiRank(5)).toBe('Initiate');
  });

  it('maps 6 disciplines (Book 2 carry-over) to Aspirant', () => {
    expect(getKaiRank(6)).toBe('Aspirant');
  });

  it('maps the low and high ends of the 10-rank table', () => {
    expect(getKaiRank(1)).toBe('Novice');
    expect(getKaiRank(10)).toBe('Master');
  });

  it('falls back to a Magnakai label beyond the 10 basic ranks', () => {
    expect(getKaiRank(11)).toBe('Kai Grand Master (Magnakai)');
  });

  it('clamps non-positive counts to the lowest rank', () => {
    expect(getKaiRank(0)).toBe('Novice');
  });
});
