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

const MAGNAKAI_RANK = 'Kai Grand Master (Magnakai)';

/** Purely derived from the number of Kai Disciplines held — not persisted on the ActionChart. */
export function getKaiRank(disciplineCount: number): string {
  if (disciplineCount <= 0) return KAI_RANKS[0];
  if (disciplineCount > KAI_RANKS.length) return MAGNAKAI_RANK;
  return KAI_RANKS[disciplineCount - 1];
}
