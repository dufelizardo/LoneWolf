import { describe, expect, it } from 'vitest';
import { createFreshCharacterForBook } from '../../src/engine/character';
import { getGrandMasterBaseline, getGrandMasterRank, getKaiRank, getMagnakaiRank, getRankForChart } from '../../src/engine/kaiRank';

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

  it('accepts a configurable baseline (5, for the New Order phase, Book 21+)', () => {
    expect(getGrandMasterRank(5, 5)).toBe('Kai Grand Master Senior');
    expect(getGrandMasterRank(6, 5)).toBe('Kai Grand Master Superior');
    expect(getGrandMasterRank(7, 5)).toBe('Kai Grand Sentinel');
    expect(getGrandMasterRank(4, 5)).toBe('Kai Grand Master Senior'); // below baseline, clamps low
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

  it('uses the baseline-5 Grand Master ladder for a New Order-phase book (Book 21+)', () => {
    const chart = createFreshCharacterForBook('vm', () => 0);
    chart.grandMasterDisciplines = ['GrandWeaponmastery', 'Deliverance', 'GrandHuntmastery', 'Telegnosis', 'Astrology'];
    expect(getRankForChart(chart)).toBe('Kai Grand Master Senior');

    chart.grandMasterDisciplines.push('Herbmastery');
    expect(getRankForChart(chart)).toBe('Kai Grand Master Superior');
  });

  it('a Book 21-completing character (6 Disciplines) carried into Book 22 maps to "Kai Grand Master Superior", matching Book 22 imprvdsc.htm\'s real content tier', () => {
    const chart = createFreshCharacterForBook('tbs', () => 0);
    chart.grandMasterDisciplines = ['GrandWeaponmastery', 'Deliverance', 'GrandHuntmastery', 'Telegnosis', 'Astrology', 'Herbmastery'];
    expect(getRankForChart(chart)).toBe('Kai Grand Master Superior');
  });

  it('a character who completed both Books 21 and 22 (7 Disciplines) carried into Book 23 maps to "Kai Grand Sentinel", matching Book 23 imprvdsc.htm\'s real content tier', () => {
    const chart = createFreshCharacterForBook('mh', () => 0);
    chart.grandMasterDisciplines = ['GrandWeaponmastery', 'Deliverance', 'GrandHuntmastery', 'Telegnosis', 'Astrology', 'Herbmastery', 'Elementalism'];
    expect(getRankForChart(chart)).toBe('Kai Grand Sentinel');
  });

  it('a character who completed Books 21, 22 and 23 (8 Disciplines) carried into Book 24 maps to "Kai Grand Defender", matching Book 24 imprvdsc.htm\'s real content tier', () => {
    const chart = createFreshCharacterForBook('rw', () => 0);
    chart.grandMasterDisciplines = ['GrandWeaponmastery', 'Deliverance', 'GrandHuntmastery', 'Telegnosis', 'Astrology', 'Herbmastery', 'Elementalism', 'Bardsmanship'];
    expect(getRankForChart(chart)).toBe('Kai Grand Defender');
  });

  it('a character who completed Books 21-24 (9 Disciplines) carried into Book 25 maps to "Kai Grand Guardian", matching Book 25 imprvdsc.htm\'s real content tier', () => {
    const chart = createFreshCharacterForBook('tw', () => 0);
    chart.grandMasterDisciplines = ['GrandWeaponmastery', 'Deliverance', 'GrandHuntmastery', 'Telegnosis', 'Astrology', 'Herbmastery', 'Elementalism', 'Bardsmanship', 'KaiSurge'];
    expect(getRankForChart(chart)).toBe('Kai Grand Guardian');
  });

  it('a character who completed Books 21-25 (10 Disciplines) carried into Book 26 maps to "Sun Knight", matching Book 26 imprvdsc.htm\'s real content tier', () => {
    const chart = createFreshCharacterForBook('tfbm', () => 0);
    chart.grandMasterDisciplines = ['GrandWeaponmastery', 'Deliverance', 'GrandHuntmastery', 'Telegnosis', 'Astrology', 'Herbmastery', 'Elementalism', 'Bardsmanship', 'KaiSurge', 'KaiAlchemy'];
    expect(getRankForChart(chart)).toBe('Sun Knight');
  });

  it('a character who completed Books 21-26 (11 Disciplines) carried into Book 27 maps to "Sun Lord", matching Book 27 imprvdsc.htm\'s real content tier - the first New Order book reaching a rank with real numeric combat mechanics (Kai-blast)', () => {
    const chart = createFreshCharacterForBook('v', () => 0);
    chart.grandMasterDisciplines = ['GrandWeaponmastery', 'Deliverance', 'GrandHuntmastery', 'Telegnosis', 'Astrology', 'Herbmastery', 'Elementalism', 'Bardsmanship', 'KaiSurge', 'KaiAlchemy', 'AnimalMastery'];
    expect(getRankForChart(chart)).toBe('Sun Lord');
  });

  it('a character who completed Books 21-27 (12 Disciplines) carried into Book 28 maps to "Sun Thane", matching Book 28 imprvdsc.htm\'s real content tier', () => {
    const chart = createFreshCharacterForBook('ths', () => 0);
    chart.grandMasterDisciplines = ['GrandWeaponmastery', 'Deliverance', 'GrandHuntmastery', 'Telegnosis', 'Astrology', 'Herbmastery', 'Elementalism', 'Bardsmanship', 'KaiSurge', 'KaiAlchemy', 'AnimalMastery', 'Assimilance'];
    expect(getRankForChart(chart)).toBe('Sun Thane');
  });
});

describe('getGrandMasterBaseline', () => {
  it('is 1 for a Grand Master-phase book', () => {
    const chart = createFreshCharacterForBook('tplr', () => 0);
    expect(getGrandMasterBaseline(chart)).toBe(1);
  });

  it('is 5 for a New Order-phase book', () => {
    const chart = createFreshCharacterForBook('mh', () => 0);
    expect(getGrandMasterBaseline(chart)).toBe(5);
  });
});
