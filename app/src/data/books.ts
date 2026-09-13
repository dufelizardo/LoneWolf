export type EquipmentMode = 'random-one' | 'choose-two';

export interface BookMeta {
  id: string;
  code: string;
  title: string;
  order: number;
  equipmentMode: EquipmentMode;
}

export const BOOKS: BookMeta[] = [
  { id: 'ft', code: '01fftd', title: 'Flight from the Dark', order: 1, equipmentMode: 'random-one' },
  { id: 'fa', code: '02fotw', title: 'Fire on the Water', order: 2, equipmentMode: 'choose-two' },
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
