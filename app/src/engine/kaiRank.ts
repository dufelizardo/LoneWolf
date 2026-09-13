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

/** Picks the right rank ladder for this chart's book phase — the only place that needs to know both exist. */
export function getRankForChart(chart: ActionChart): string {
  return getBook(chart.bookId).phase === 'magnakai'
    ? getMagnakaiRank(chart.magnakaiDisciplines.length)
    : getKaiRank(chart.disciplines.length);
}
