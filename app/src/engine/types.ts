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

/** The Grand Master phase (Book 13+) layers a new set of 12 Disciplines on top of the 10 Magnakai
 * ones instead of replacing them outright: 10 are named upgrades of a Magnakai Discipline (e.g.
 * Weaponmastery -> GrandWeaponmastery), and 2 are wholly new (MagiMagic, KaiAlchemy). Unlike the
 * Kai->Magnakai boundary, `magnakaiDisciplines` is NOT cleared when crossing into this phase — its
 * bonuses keep applying wherever the character did not pick the corresponding Grand Master upgrade
 * (confirmed in discplnz.htm's errata: "Weaponmastery bonuses are replaced by Grand Weaponmastery
 * bonuses, not added cumulatively" - i.e. the new upgrade supersedes the old bonus when both would
 * apply, rather than stacking with it; the old one is a live fallback otherwise). */
export type GrandMasterDiscipline =
  | 'GrandWeaponmastery'
  | 'AnimalMastery'
  | 'Deliverance'
  | 'Assimilance'
  | 'GrandHuntmastery'
  | 'GrandPathsmanship'
  | 'KaiSurge'
  | 'KaiScreen'
  | 'GrandNexus'
  | 'Telegnosis'
  | 'MagiMagic'
  | 'KaiAlchemy';

export const ALL_GRAND_MASTER_DISCIPLINES: GrandMasterDiscipline[] = [
  'GrandWeaponmastery',
  'AnimalMastery',
  'Deliverance',
  'Assimilance',
  'GrandHuntmastery',
  'GrandPathsmanship',
  'KaiSurge',
  'KaiScreen',
  'GrandNexus',
  'Telegnosis',
  'MagiMagic',
  'KaiAlchemy',
];

export const GRAND_MASTER_DISCIPLINE_LABELS: Record<GrandMasterDiscipline, string> = {
  GrandWeaponmastery: 'Grand Weaponmastery',
  AnimalMastery: 'Animal Mastery',
  Deliverance: 'Deliverance',
  Assimilance: 'Assimilance',
  GrandHuntmastery: 'Grand Huntmastery',
  GrandPathsmanship: 'Grand Pathsmanship',
  KaiSurge: 'Kai-surge',
  KaiScreen: 'Kai-screen',
  GrandNexus: 'Grand Nexus',
  Telegnosis: 'Telegnosis',
  MagiMagic: 'Magi-magic',
  KaiAlchemy: 'Kai-alchemy',
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
  /** Empty until a character enters the Grand Master phase (Book 13+). Unlike disciplines/magnakaiDisciplines, `magnakaiDisciplines` is NOT cleared when this is populated — see the GrandMasterDiscipline doc comment for why. */
  grandMasterDisciplines: GrandMasterDiscipline[];
  /** The Weaponmastery discipline's chosen weapons (up to 3) — separate from `weapons` (what's actually carried); having a weapon mastered doesn't mean carrying it. */
  masteredWeapons: WeaponType[];
  /** The Grand Weaponmastery discipline's chosen weapons (starts at 2) — kept separate from `masteredWeapons` (the Magnakai-era list) rather than merged into it, since Grand Weaponmastery's own +5 CS bonus replaces Weaponmastery's rather than stacking with it (see GrandMasterDiscipline doc comment); combat.ts checks this list first and only falls back to `masteredWeapons` for a weapon not in it. */
  grandMasteredWeapons: WeaponType[];
  weapons: WeaponType[];
  equippedWeapon: WeaponType | null;
  backpackItems: string[];
  /** Meals count toward the shared 8-item Backpack limit but are tracked separately (see MAX_BACKPACK_ITEMS). */
  meals: number;
  specialItems: SpecialItem[];
  goldCrowns: number;
  /** Number of unused healing-potion doses currently carried (0 = none). Each dose restores a fixed amount once used. */
  healingPotionDoses: number;
  /** Number of unused Potion of Alether doses (Book 10+): +2 Combat Skill for one whole combat when drunk, consumed via useCombatPotion before the fight rather than instantly like healingPotionDoses. */
  combatPotionDoses: number;
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

export const SAVE_VERSION = 7;

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
