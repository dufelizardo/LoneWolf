import { describe, expect, it } from 'vitest';
import { createFreshCharacterForBook } from '../../src/engine/character';
import { getGrandMasterRank, getKaiRank, getMagnakaiRank, getRankForChart } from '../../src/engine/kaiRank';

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

  it('clamps a count beyond the 10 basic disciplines to the highest rank (cannot happen in practice — ALL_DISCIPLINES only has 10)', () => {
    expect(getKaiRank(11)).toBe('Master');
  });

  it('clamps non-positive counts to the lowest rank', () => {
    expect(getKaiRank(0)).toBe('Novice');
  });
});

describe('getMagnakaiRank', () => {
  it('maps 3 disciplines (the Book 6 starting point) to Kai Master Superior', () => {
    expect(getMagnakaiRank(3)).toBe('Kai Master Superior');
  });

  it('maps the low and high ends of the 10-rank table', () => {
    expect(getMagnakaiRank(1)).toBe('Kai Master');
    expect(getMagnakaiRank(10)).toBe('Kai Grand Master');
  });

  it('clamps non-positive counts to the lowest rank', () => {
    expect(getMagnakaiRank(0)).toBe('Kai Master');
  });
});

describe('getGrandMasterRank', () => {
  it('maps 4 disciplines (the Book 13 starting point) to Kai Grand Defender', () => {
    expect(getGrandMasterRank(4)).toBe('Kai Grand Defender');
  });

  it('maps the low and high ends of the 12-rank table', () => {
    expect(getGrandMasterRank(1)).toBe('Kai Grand Master Senior');
    expect(getGrandMasterRank(12)).toBe('Kai Supreme Master');
  });

  it('clamps non-positive counts to the lowest rank', () => {
    expect(getGrandMasterRank(0)).toBe('Kai Grand Master Senior');
  });
});

describe('getRankForChart', () => {
  it('uses the Kai ladder for a Kai-phase book', () => {
    const chart = createFreshCharacterForBook('ft', () => 0);
    chart.disciplines = ['Healing', 'Hunting', 'Camouflage', 'Tracking', 'SixthSense'];
    expect(getRankForChart(chart)).toBe('Initiate');
  });

  it('uses the Magnakai ladder for a Magnakai-phase book', () => {
    const chart = createFreshCharacterForBook('tkt', () => 0);
    chart.magnakaiDisciplines = ['Curing', 'Huntmastery', 'Divination'];
    expect(getRankForChart(chart)).toBe('Kai Master Superior');
  });

  it('uses the Grand Master ladder for a Grand Master-phase book, ignoring leftover Magnakai Disciplines', () => {
    const chart = createFreshCharacterForBook('tplr', () => 0);
    chart.magnakaiDisciplines = ['Curing', 'Huntmastery', 'Divination', 'Weaponmastery', 'Nexus'];
    chart.grandMasterDisciplines = ['GrandWeaponmastery', 'Deliverance', 'GrandHuntmastery', 'Telegnosis'];
    expect(getRankForChart(chart)).toBe('Kai Grand Defender');
  });
});
