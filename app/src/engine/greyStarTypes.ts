/** Same shape as types.ts's SpecialItem, redefined locally rather than imported to avoid a circular import (types.ts's SaveGame/CampaignProgress need to reference GreyStarActionChart too - see persistence.ts). */
export interface GreyStarSpecialItem {
  name: string;
  description?: string;
  knownEffects?: string;
}

/**
 * "Grey Star the Wizard" (world_of_lone_wolf phase) has a wholly different protagonist and rules than
 * every Lone Wolf-series book - three attributes instead of two (WILLPOWER is new), a fixed 5-of-7
 * "Magical Powers" choice with no growth path, a third inventory container (Herb Pouch, only if
 * Alchemy is chosen), and combat where the player spends WILLPOWER points per round to multiply the
 * enemy's damage (see greyStarCombat.ts). Deliberately kept as its own type rather than folded into
 * ActionChart - see ADR-0008 for why an isolated parallel system was chosen over extending the shared
 * type every other phase already uses.
 */

/** The seven "Lesser Magicks" - a fresh character masters exactly five, chosen freely, with no way to gain the other two during this book (confirmed: no section grants an additional Magical Power). */
export type MagicalPower = 'Sorcery' | 'Enchantment' | 'Elementalism' | 'Alchemy' | 'Prophecy' | 'Psychomancy' | 'Evocation';

export const ALL_MAGICAL_POWERS: MagicalPower[] = ['Sorcery', 'Enchantment', 'Elementalism', 'Alchemy', 'Prophecy', 'Psychomancy', 'Evocation'];

export const MAGICAL_POWER_LABELS: Record<MagicalPower, string> = {
  Sorcery: 'Sorcery',
  Enchantment: 'Enchantment',
  Elementalism: 'Elementalism',
  Alchemy: 'Alchemy',
  Prophecy: 'Prophecy',
  Psychomancy: 'Psychomancy',
  Evocation: 'Evocation',
};

/** The one-time gift chosen at character creation (equipmnt.htm: "you may choose one of them"). */
export type StartingGift = 'JewelledDagger' | 'MagicTalisman' | 'VialOfLaumspur';

export interface GreyStarActionChart {
  bookId: string;
  combatSkill: number;
  /**
   * Unlike ENDURANCE, WILLPOWER has no ceiling - gamerulz.htm: "it is possible for your WILLPOWER
   * points to rise above the total with which you start your adventure." It can also go negative
   * (e.g. a forced/mandated spell cost with insufficient points, or a mental attack) - no clamping
   * either direction, only ENDURANCE <= 0 ends the adventure.
   */
  willpowerCurrent: number;
  /** The WILLPOWER rolled at character creation (before any spend or one-time gift bonus), kept
   * immutable for the rest of the adventure. Only needed for Book 2+'s carry-over: gamerulz.htm offers
   * a method that recalculates WILLPOWER from "your original score from the beginning of" the previous
   * book, not its current (likely near-zero) value. */
  willpowerStarting: number;
  enduranceCurrent: number;
  enduranceMax: number;
  /** Exactly five of the seven ALL_MAGICAL_POWERS, chosen once at creation. */
  magicalPowers: MagicalPower[];
  /**
   * Plain strings, not the shared Lone Wolf WeaponType enum - Grey Star's rules never reference that
   * 10-item weapon list (it's a wholly different book), and reusing it here would leak an irrelevant
   * "Wizard's Staff" option into the unrelated Lone Wolf weapon-picker dropdown (ActionChartSidebar).
   * The Staff itself is the constant WIZARDS_STAFF below - combat penalties key off possessing/
   * equipping *that specific* weapon, not "any weapon".
   */
  weapons: string[];
  equippedWeapon: string | null;
  backpackItems: string[];
  meals: number;
  specialItems: GreyStarSpecialItem[];
  /** Only used if Alchemy was chosen as one of the five Magical Powers (equipmnt.htm) - a third inventory container, separate from backpackItems/specialItems, capped at 8 items. Empty array (not populated) for a character without Alchemy. */
  herbPouchItems: string[];
  /** The Shadakine Empire's currency. Starts at 0 (gamerulz.htm/equipmnt.htm: no starting gold roll, "the system of money is alien to the Shianti") - only gained by looting slain enemies. */
  nobles: number;
  currentSection: number;
  visitedSections: number[];
  isAlive: boolean;
}

/** "It looks and feels like an ordinary quarterstaff, yet it is stronger than any known metal" (powers.htm) - every fresh character starts with exactly one of these, equipped. Combat penalties (see greyStarCombat.ts) key off equipping this specific weapon, not "any weapon". */
export const WIZARDS_STAFF = "Wizard's Staff";

export const STARTING_GIFT_LABELS: Record<StartingGift, string> = {
  JewelledDagger: 'Jewelled Dagger (+1 Combat Skill em combate)',
  MagicTalisman: 'Magic Talisman (+2 Willpower, uma única vez)',
  VialOfLaumspur: 'Vial of Laumspur (+4 Endurance após um combate, 1 dose)',
};
