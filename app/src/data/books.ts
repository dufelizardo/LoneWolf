export type EquipmentMode = 'random-one' | 'choose-two' | 'choose-six' | 'choose-four' | 'choose-five';

/** Which top-level content directory this book's raw XHTML lives under (a filesystem concern). */
export type ContentRoot = 'kai' | 'magnakai' | 'grand_master' | 'new_order';

/** Which set of game rules (Disciplines, ranks) this book uses (a rules concern, kept separate from ContentRoot even though the two always move together today). */
export type Phase = 'kai' | 'magnakai' | 'grand_master' | 'new_order';

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
  /** How many Grand Master Disciplines a fresh character picks when entering this phase for the first time (applyGrandMasterDisciplines). Only set on the first book of a phase that uses this discipline pool - Book 13 (Grand Master) defaults to 4 when unset, Book 21 (New Order) sets 5. */
  initialDisciplineCount?: number;
  /** Whether a character can be carried over FROM the immediately preceding book (by order) INTO this one. Defaults to true - every phase transition so far (Book 6 into Magnakai, Book 13 into Grand Master) has explicit carry-over rules in its own gamerulz.htm (keep CS/EP, apply a Special Item whitelist, etc.), so carryOverCharacterToBook handles them. Book 21 (New Order) is the first book whose own rules give NO carry-over path at all - CS/EP/Disciplines/equipment are all rolled fresh, with zero reference to a Book 20 Action Chart - so it sets this to false, hiding the "Transferir personagem" option instead of silently offering a transfer the source material never describes. */
  allowsCarryOver?: boolean;
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
  { id: 'tdi', code: '17tdoi', title: 'The Deathlord of Ixia', order: 17, equipmentMode: 'choose-four', contentRoot: 'grand_master', phase: 'grand_master', sectionCount: 350, finalSection: 350 },
  { id: 'dd', code: '18dotd', title: 'Dawn of the Dragons', order: 18, equipmentMode: 'choose-four', contentRoot: 'grand_master', phase: 'grand_master', sectionCount: 350, finalSection: 350 },
  { id: 'wb', code: '19wb', title: "Wolf's Bane", order: 19, equipmentMode: 'choose-four', contentRoot: 'grand_master', phase: 'grand_master', sectionCount: 350, finalSection: 350 },
  { id: 'tcn', code: '20tcon', title: 'The Curse of Naar', order: 20, equipmentMode: 'choose-four', contentRoot: 'grand_master', phase: 'grand_master', sectionCount: 350, finalSection: 350 },
  { id: 'vm', code: '21votm', title: 'Voyage of the Moonstone', order: 21, equipmentMode: 'choose-five', contentRoot: 'new_order', phase: 'new_order', sectionCount: 350, finalSection: 350, initialDisciplineCount: 5, allowsCarryOver: false },
  { id: 'tbs', code: '22tbos', title: 'The Buccaneers of Shadaki', order: 22, equipmentMode: 'choose-five', contentRoot: 'new_order', phase: 'new_order', sectionCount: 350, finalSection: 350, initialDisciplineCount: 5 },
  { id: 'mh', code: '23mh', title: "Mydnight's Hero", order: 23, equipmentMode: 'choose-five', contentRoot: 'new_order', phase: 'new_order', sectionCount: 350, finalSection: 350, initialDisciplineCount: 5 },
  { id: 'rw', code: '24rw', title: 'Rune War', order: 24, equipmentMode: 'choose-five', contentRoot: 'new_order', phase: 'new_order', sectionCount: 350, finalSection: 350, initialDisciplineCount: 5 },
  { id: 'tw', code: '25totw', title: 'Trail of the Wolf', order: 25, equipmentMode: 'choose-five', contentRoot: 'new_order', phase: 'new_order', sectionCount: 350, finalSection: 350, initialDisciplineCount: 5 },
  { id: 'tfbm', code: '26tfobm', title: 'The Fall of Blood Mountain', order: 26, equipmentMode: 'choose-five', contentRoot: 'new_order', phase: 'new_order', sectionCount: 350, finalSection: 350, initialDisciplineCount: 5 },
  { id: 'v', code: '27v', title: 'Vampirium', order: 27, equipmentMode: 'choose-five', contentRoot: 'new_order', phase: 'new_order', sectionCount: 350, finalSection: 350, initialDisciplineCount: 5 },
  // First New Order book with a section count other than 350 - confirmed via direct file count.
  { id: 'ths', code: '28thos', title: 'The Hunger of Sejanoz', order: 28, equipmentMode: 'choose-five', contentRoot: 'new_order', phase: 'new_order', sectionCount: 300, finalSection: 300, initialDisciplineCount: 5 },
  // Real production is a much later (2016) release with a 17-year in-story time skip, but
  // gamerulz.htm/discplnz.htm confirm the rules are mechanically identical - normal carry-over
  // applies. Book 30 ("Dead in the Deep") is confirmed permanently unavailable (Project Aon has no
  // license to publish it), so this is likely the last implementable book in the New Order phase.
  { id: 'tsc', code: '29tsoc', title: 'The Storms of Chai', order: 29, equipmentMode: 'choose-five', contentRoot: 'new_order', phase: 'new_order', sectionCount: 350, finalSection: 350, initialDisciplineCount: 5 },
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

/** Display-only grouping for the book selection screen. `phase: null` marks a future phase with no books yet (rendered as a "coming soon" heading, no list). */
export interface PhaseSection {
  phase: Phase | null;
  label: string;
}

export const PHASE_SECTIONS: PhaseSection[] = [
  { phase: 'kai', label: 'Kai' },
  { phase: 'magnakai', label: 'Magnakai' },
  { phase: 'grand_master', label: 'Grand Master' },
  { phase: 'new_order', label: 'New Order' },
  { phase: null, label: 'World of Lone Wolf (ainda não implementado)' },
];
