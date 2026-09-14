import { getBook } from '../data/books';
import type { ActionChart } from './types';

// From levels.htm: rank is bestowed in step with the number of Kai Disciplines held.
export const KAI_RANKS = [
  'Novice',
  'Intuite',
  'Doan',
  'Acolyte',
  'Initiate',
  'Aspirant',
  'Guardian',
  'Warmarn or Journeyman',
  'Savant',
  'Master',
];

/** Purely derived from the number of Kai Disciplines held — not persisted on the ActionChart. */
export function getKaiRank(disciplineCount: number): string {
  if (disciplineCount <= 0) return KAI_RANKS[0];
  if (disciplineCount > KAI_RANKS.length) return KAI_RANKS[KAI_RANKS.length - 1];
  return KAI_RANKS[disciplineCount - 1];
}

// From levels.htm (magnakai/tkt): an entirely separate ladder from KAI_RANKS — a Magnakai character
// starts at rank 3 ("Kai Master Superior") with their 3 starting Magnakai Disciplines, not rank 1.
export const MAGNAKAI_RANKS = [
  'Kai Master',
  'Kai Master Senior',
  'Kai Master Superior',
  'Primate',
  'Tutelary',
  'Principalin',
  'Mentora',
  'Scion-kai',
  'Archmaster',
  'Kai Grand Master',
];

/** Purely derived from the number of Magnakai Disciplines held. */
export function getMagnakaiRank(disciplineCount: number): string {
  if (disciplineCount <= 0) return MAGNAKAI_RANKS[0];
  if (disciplineCount > MAGNAKAI_RANKS.length) return MAGNAKAI_RANKS[MAGNAKAI_RANKS.length - 1];
  return MAGNAKAI_RANKS[disciplineCount - 1];
}

// From levels.htm (grand_master/tplr): a third, entirely separate ladder — unrelated to
// MAGNAKAI_RANKS despite both ending in a "Grand Master"-ish name. A Grand Master character starts
// Book 13 at rank 4 ("Kai Grand Defender") with 4 starting Grand Master Disciplines; ranks 1-3 exist
// in the lore (having been "skipped" by a returning Magnakai-completing character) but are never
// actually assigned to a real chart.
export const GRAND_MASTER_RANKS = [
  'Kai Grand Master Senior',
  'Kai Grand Master Superior',
  'Kai Grand Sentinel',
  'Kai Grand Defender',
  'Kai Grand Guardian',
  'Sun Knight',
  'Sun Lord',
  'Sun Thane',
  'Grand Thane',
  'Grand Crown',
  'Sun Prince',
  'Kai Supreme Master',
];

/** Purely derived from the number of Grand Master Disciplines held. */
export function getGrandMasterRank(disciplineCount: number): string {
  if (disciplineCount <= 0) return GRAND_MASTER_RANKS[0];
  if (disciplineCount > GRAND_MASTER_RANKS.length) return GRAND_MASTER_RANKS[GRAND_MASTER_RANKS.length - 1];
  return GRAND_MASTER_RANKS[disciplineCount - 1];
}

/** Picks the right rank ladder for this chart's book phase — the only place that needs to know all three exist. */
export function getRankForChart(chart: ActionChart): string {
  const phase = getBook(chart.bookId).phase;
  if (phase === 'grand_master') return getGrandMasterRank(chart.grandMasterDisciplines.length);
  if (phase === 'magnakai') return getMagnakaiRank(chart.magnakaiDisciplines.length);
  return getKaiRank(chart.disciplines.length);
}
