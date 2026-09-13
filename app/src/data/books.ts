export type EquipmentMode = 'random-one' | 'choose-two' | 'choose-six' | 'choose-four';

export interface BookMeta {
  id: string;
  code: string;
  title: string;
  order: number;
  equipmentMode: EquipmentMode;
  /** Total numbered sections in this book. Every book so far is 350 except Shadow on the Sand (400). */
  sectionCount: number;
  /** The section number of this book's one canonical (mission-success) ending. */
  finalSection: number;
}

export const BOOKS: BookMeta[] = [
  { id: 'ft', code: '01fftd', title: 'Flight from the Dark', order: 1, equipmentMode: 'random-one', sectionCount: 350, finalSection: 350 },
  { id: 'fa', code: '02fotw', title: 'Fire on the Water', order: 2, equipmentMode: 'choose-two', sectionCount: 350, finalSection: 350 },
  { id: 'tck', code: '03tcok', title: 'The Caverns of Kalte', order: 3, equipmentMode: 'choose-two', sectionCount: 350, finalSection: 350 },
  { id: 'tcd', code: '04tcod', title: 'The Chasm of Doom', order: 4, equipmentMode: 'choose-six', sectionCount: 350, finalSection: 350 },
  { id: 'ss', code: '05sots', title: 'Shadow on the Sand', order: 5, equipmentMode: 'choose-four', sectionCount: 400, finalSection: 400 },
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
