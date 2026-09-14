export type EquipmentMode = 'random-one' | 'choose-two' | 'choose-six' | 'choose-four' | 'choose-five';

/** Which top-level content directory this book's raw XHTML lives under (a filesystem concern). */
export type ContentRoot = 'kai' | 'magnakai' | 'grand_master';

/** Which set of game rules (Disciplines, ranks) this book uses (a rules concern, kept separate from ContentRoot even though the two always move together today). */
export type Phase = 'kai' | 'magnakai' | 'grand_master';

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
  /** Overrides `id` as the on-disk folder name under `contentRoot` (parseContent.ts's contentDirFor). Only needed when the source content's own folder name would collide with another book's `id` — e.g. Book 14's folder is coincidentally named "tck", already taken by Book 3, so Book 14 uses id "tcok" with this set to "tck". Every other book's folder already matches its `id`. */
  contentDirName?: string;
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
  { id: 'tplr', code: '13tplor', title: 'The Plague Lords of Ruel', order: 13, equipmentMode: 'choose-five', contentRoot: 'grand_master', phase: 'grand_master', sectionCount: 350, finalSection: 350 },
  // Note: this book's source folder is coincidentally named "tck" (grand_master/tck/), already taken
  // by Book 3's id — hence "tcok" here plus contentDirName to point the parser at the real folder.
  { id: 'tcok', code: '14tcok', title: 'The Captives of Kaag', order: 14, equipmentMode: 'choose-five', contentRoot: 'grand_master', phase: 'grand_master', sectionCount: 350, finalSection: 350, contentDirName: 'tck' },
  { id: 'tdc', code: '15tdc', title: 'The Darke Crusade', order: 15, equipmentMode: 'choose-five', contentRoot: 'grand_master', phase: 'grand_master', sectionCount: 350, finalSection: 350 },
  { id: 'tlv', code: '16tlov', title: 'The Legacy of Vashna', order: 16, equipmentMode: 'choose-four', contentRoot: 'grand_master', phase: 'grand_master', sectionCount: 350, finalSection: 350 },
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
