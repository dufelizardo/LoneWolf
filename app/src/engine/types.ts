export type Discipline =
  | 'Camouflage'
  | 'Hunting'
  | 'SixthSense'
  | 'Tracking'
  | 'Healing'
  | 'Weaponskill'
  | 'Mindshield'
  | 'Mindblast'
  | 'AnimalKinship'
  | 'MindOverMatter';

export const ALL_DISCIPLINES: Discipline[] = [
  'Camouflage',
  'Hunting',
  'SixthSense',
  'Tracking',
  'Healing',
  'Weaponskill',
  'Mindshield',
  'Mindblast',
  'AnimalKinship',
  'MindOverMatter',
];

export const DISCIPLINE_LABELS: Record<Discipline, string> = {
  Camouflage: 'Camouflage',
  Hunting: 'Hunting',
  SixthSense: 'Sixth Sense',
  Tracking: 'Tracking',
  Healing: 'Healing',
  Weaponskill: 'Weaponskill',
  Mindshield: 'Mindshield',
  Mindblast: 'Mindblast',
  AnimalKinship: 'Animal Kinship',
  MindOverMatter: 'Mind Over Matter',
};

export type WeaponType =
  | 'Axe'
  | 'Sword'
  | 'ShortSword'
  | 'Mace'
  | 'Quarterstaff'
  | 'Spear'
  | 'Broadsword'
  | 'Warhammer'
  | 'Dagger';

export const ALL_WEAPONS: WeaponType[] = [
  'Axe',
  'Sword',
  'ShortSword',
  'Mace',
  'Quarterstaff',
  'Spear',
  'Broadsword',
  'Warhammer',
  'Dagger',
];

export const MAX_WEAPONS = 2;
export const MAX_BACKPACK_ITEMS = 8;
export const MAX_GOLD_CROWNS = 50;

export interface SpecialItem {
  name: string;
  description?: string;
  knownEffects?: string;
}

export interface ActionChart {
  bookId: string;
  combatSkill: number;
  enduranceMax: number;
  enduranceCurrent: number;
  disciplines: Discipline[];
  weaponskillWeapon: WeaponType | null;
  weapons: WeaponType[];
  equippedWeapon: WeaponType | null;
  backpackItems: string[];
  /** Meals count toward the shared 8-item Backpack limit but are tracked separately (see MAX_BACKPACK_ITEMS). */
  meals: number;
  specialItems: SpecialItem[];
  goldCrowns: number;
  /** Number of unused healing-potion doses currently carried (0 = none). Each dose restores a fixed amount once used. */
  healingPotionDoses: number;
  currentSection: number;
  visitedSections: number[];
  isAlive: boolean;
}

export interface Enemy {
  name: string;
  combatSkill: number;
  endurance: number;
  /** This enemy attacks the player's mind — Mindshield blocks the Endurance loss it deals. */
  attacksWithMindblast?: boolean;
  /** This enemy is immune to the player's own Mindblast discipline bonus. */
  mindblastImmune?: boolean;
}

export const SAVE_VERSION = 4;

/** The ActionChart snapshot as it stood the moment a book's canonical ending was reached. */
export interface CampaignProgress {
  completedBooks: Record<string, ActionChart>;
}

export function createEmptyCampaign(): CampaignProgress {
  return { completedBooks: {} };
}

export interface SaveGame {
  saveVersion: number;
  campaign: CampaignProgress;
  chart: ActionChart | null;
}
