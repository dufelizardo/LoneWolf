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

/**
 * Purely derived from the number of Grand Master Disciplines held. `baseline` is the discipline count
 * that maps to the first rank in the ladder — 1 for the Grand Master phase (Book 13 starts at 4
 * Disciplines, landing on index 3, "Kai Grand Defender"). The New Order phase (Book 21+) reuses this
 * exact same 12-name ladder but starts fresh at 5 Disciplines mapping to index 0, "Kai Grand Master
 * Senior" (confirmed verbatim in Book 21's levels.htm: "You begin the New Order adventures at this
 * level of Kai Grand Mastery") — so New Order passes baseline 5 instead. combat.ts's rank-tier
 * thresholds (Sun Lord, Grand Crown, Sun Prince) use getGrandMasterBaseline below rather than a raw
 * Discipline count, for the same reason — see its SUN_LORD_RANK_INDEX comment.
 */
export function getGrandMasterRank(disciplineCount: number, baseline = 1): string {
  const index = disciplineCount - baseline;
  if (index <= 0) return GRAND_MASTER_RANKS[0];
  if (index >= GRAND_MASTER_RANKS.length) return GRAND_MASTER_RANKS[GRAND_MASTER_RANKS.length - 1];
  return GRAND_MASTER_RANKS[index];
}

/** New Order (Book 21+) discipline count that maps to the first rank ("Kai Grand Master Senior"). */
const NEW_ORDER_RANK_BASELINE = 5;

/**
 * The `baseline` getGrandMasterRank needs for this chart's book — 5 for New Order, 1 for the Grand
 * Master phase. Exported so combat.ts's rank-tier thresholds (Sun Lord, Grand Crown, Sun Prince) can
 * be phase-aware instead of comparing raw Discipline counts, which only happen to line up with the
 * Grand Master phase's baseline of 1 (see combat.ts's SUN_LORD_RANK_INDEX and friends, added in Book
 * 23 once a New Order character could reach 7 raw Disciplines - the same raw number the Grand Master
 * phase uses for Sun Lord - without being anywhere near that rank on the New Order ladder).
 */
export function getGrandMasterBaseline(chart: ActionChart): number {
  return getBook(chart.bookId).phase === 'new_order' ? NEW_ORDER_RANK_BASELINE : 1;
}

/** Picks the right rank ladder for this chart's book phase — the only place that needs to know all four exist. */
export function getRankForChart(chart: ActionChart): string {
  const phase = getBook(chart.bookId).phase;
  if (phase === 'new_order' || phase === 'grand_master') {
    return getGrandMasterRank(chart.grandMasterDisciplines.length, getGrandMasterBaseline(chart));
  }
  if (phase === 'magnakai') return getMagnakaiRank(chart.magnakaiDisciplines.length);
  return getKaiRank(chart.disciplines.length);
}
