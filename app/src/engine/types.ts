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

/** The Magnakai phase (Book 6+) replaces the 10 Kai Disciplines with an unrelated set of 10 — there
 * is no conversion table between them (confirmed in discplnz.htm: a Magnakai character simply
 * chooses 3 of these freely, regardless of which Kai Disciplines they held). */
export type MagnakaiDiscipline =
  | 'Weaponmastery'
  | 'AnimalControl'
  | 'Curing'
  | 'Invisibility'
  | 'Huntmastery'
  | 'Pathsmanship'
  | 'PsiSurge'
  | 'PsiScreen'
  | 'Nexus'
  | 'Divination';

export const ALL_MAGNAKAI_DISCIPLINES: MagnakaiDiscipline[] = [
  'Weaponmastery',
  'AnimalControl',
  'Curing',
  'Invisibility',
  'Huntmastery',
  'Pathsmanship',
  'PsiSurge',
  'PsiScreen',
  'Nexus',
  'Divination',
];

export const MAGNAKAI_DISCIPLINE_LABELS: Record<MagnakaiDiscipline, string> = {
  Weaponmastery: 'Weaponmastery',
  AnimalControl: 'Animal Control',
  Curing: 'Curing',
  Invisibility: 'Invisibility',
  Huntmastery: 'Huntmastery',
  Pathsmanship: 'Pathsmanship',
  PsiSurge: 'Psi-surge',
  PsiScreen: 'Psi-screen',
  Nexus: 'Nexus',
  Divination: 'Divination',
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
  | 'Dagger'
  | 'Bow';

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
  'Bow',
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
  /** Empty for every Kai-phase chart; populated only once a character enters the Magnakai phase (Book 6+), at which point `disciplines`/`weaponskillWeapon` are cleared (see carryOverCharacterToBook). A real chart never has both non-empty. */
  magnakaiDisciplines: MagnakaiDiscipline[];
  /** The Weaponmastery discipline's chosen weapons (up to 3) — separate from `weapons` (what's actually carried); having a weapon mastered doesn't mean carrying it. */
  masteredWeapons: WeaponType[];
  weapons: WeaponType[];
  equippedWeapon: WeaponType | null;
  backpackItems: string[];
  /** Meals count toward the shared 8-item Backpack limit but are tracked separately (see MAX_BACKPACK_ITEMS). */
  meals: number;
  specialItems: SpecialItem[];
  goldCrowns: number;
  /** Number of unused healing-potion doses currently carried (0 = none). Each dose restores a fixed amount once used. */
  healingPotionDoses: number;
  /** Arrows remaining for a Bow (from a Quiver). Never auto-decremented or checked by combat.ts — self-tracked by the player, same manual-adjudication pattern as Meals/huntingDisabled. */
  arrows: number;
  currentSection: number;
  visitedSections: number[];
  isAlive: boolean;
}

export interface Enemy {
  name: string;
  combatSkill: number;
  endurance: number;
  /** This enemy attacks the player's mind — blocked by Mindshield (Kai) or Psi-screen (Magnakai). */
  attacksWithMindblast?: boolean;
  /** This enemy is immune to the player's own Mindblast (Kai) or Psi-surge/Mindblast (Magnakai) bonus. */
  mindblastImmune?: boolean;
}

export const SAVE_VERSION = 5;

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
