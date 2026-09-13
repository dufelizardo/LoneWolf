export type EquipmentMode = 'random-one' | 'choose-two' | 'choose-six' | 'choose-four' | 'choose-five';

/** Which top-level content directory this book's raw XHTML lives under (a filesystem concern). */
export type ContentRoot = 'kai' | 'magnakai';

/** Which set of game rules (Disciplines, ranks) this book uses (a rules concern, kept separate from ContentRoot even though the two always move together today). */
export type Phase = 'kai' | 'magnakai';

export interface BookMeta {
  id: string;
  code: string;
  title: string;
  order: number;
  equipmentMode: EquipmentMode;
  contentRoot: ContentRoot;
  phase: Phase;
  /** Total numbered sections in this book. Every book so far is 350 except Shadow on the Sand (400). */
  sectionCount: number;
  /** The section number of this book's one canonical (mission-success) ending. */
  finalSection: number;
}

export const BOOKS: BookMeta[] = [
  { id: 'ft', code: '01fftd', title: 'Flight from the Dark', order: 1, equipmentMode: 'random-one', contentRoot: 'kai', phase: 'kai', sectionCount: 350, finalSection: 350 },
  { id: 'fa', code: '02fotw', title: 'Fire on the Water', order: 2, equipmentMode: 'choose-two', contentRoot: 'kai', phase: 'kai', sectionCount: 350, finalSection: 350 },
  { id: 'tck', code: '03tcok', title: 'The Caverns of Kalte', order: 3, equipmentMode: 'choose-two', contentRoot: 'kai', phase: 'kai', sectionCount: 350, finalSection: 350 },
  { id: 'tcd', code: '04tcod', title: 'The Chasm of Doom', order: 4, equipmentMode: 'choose-six', contentRoot: 'kai', phase: 'kai', sectionCount: 350, finalSection: 350 },
  { id: 'ss', code: '05sots', title: 'Shadow on the Sand', order: 5, equipmentMode: 'choose-four', contentRoot: 'kai', phase: 'kai', sectionCount: 400, finalSection: 400 },
  { id: 'tkt', code: '06tkot', title: 'The Kingdoms of Terror', order: 6, equipmentMode: 'choose-five', contentRoot: 'magnakai', phase: 'magnakai', sectionCount: 350, finalSection: 350 },
  { id: 'cd', code: '07cd', title: 'Castle Death', order: 7, equipmentMode: 'choose-five', contentRoot: 'magnakai', phase: 'magnakai', sectionCount: 350, finalSection: 350 },
  { id: 'tjh', code: '08tjoh', title: 'The Jungle of Horrors', order: 8, equipmentMode: 'choose-five', contentRoot: 'magnakai', phase: 'magnakai', sectionCount: 350, finalSection: 350 },
  { id: 'tcf', code: '09tcof', title: 'The Cauldron of Fear', order: 9, equipmentMode: 'choose-five', contentRoot: 'magnakai', phase: 'magnakai', sectionCount: 350, finalSection: 350 },
  { id: 'tdt', code: '10tdot', title: 'The Dungeons of Torgar', order: 10, equipmentMode: 'choose-five', contentRoot: 'magnakai', phase: 'magnakai', sectionCount: 350, finalSection: 350 },
  { id: 'tpt', code: '11tpot', title: 'The Prisoners of Time', order: 11, equipmentMode: 'choose-six', contentRoot: 'magnakai', phase: 'magnakai', sectionCount: 350, finalSection: 350 },
  { id: 'tmd', code: '12tmod', title: 'The Masters of Darkness', order: 12, equipmentMode: 'choose-six', contentRoot: 'magnakai', phase: 'magnakai', sectionCount: 350, finalSection: 350 },
];

export function getBook(id: string): BookMeta {
  const book = BOOKS.find((b) => b.id === id);
  if (!book) throw new Error(`Unknown book id: ${id}`);
  return book;
}

export function getNextBook(currentId: string): BookMeta | null {
  const current = getBook(currentId);
  return BOOKS.find((b) => b.order === current.order + 1) ?? null;
}
