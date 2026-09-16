/**
 * Per-book Grey Star equipment config - deliberately much smaller than bookEquipment.ts (no
 * chooseOptions/kaiWeaponTable/goldRollBonus) since every Grey Star book's kit is fixed, not a
 * "choose N of a list" screen.
 */

/**
 * How WILLPOWER is recalculated when a character is carried over INTO this book. 'threeMethods'
 * (Book 2): the player picks among 3 methods (see GreyStarWillpowerCarryOverMethod in
 * greyStarCharacter.ts). 'autoReroll' (Book 3+): Book 3's own footnote fix - COMBAT SKILL/ENDURANCE
 * carry over unchanged, but WILLPOWER is simply rerolled with a flat bonus that scales with progress,
 * with no player choice at all (see rollWillpowerForLaterBookCarryOver).
 */
export type GreyStarWillpowerCarryOverMode = 'threeMethods' | 'autoReroll';

export interface GreyStarBookEquipmentConfig {
  /** Only Book 1 (gsw) has the Isle of Lorn parting-gift table (Jewelled Dagger/Magic Talisman/Vial
   * of Laumspur) - equipmnt.htm of later books has no equivalent. */
  grantsStartingGift: boolean;
  willpowerCarryOverMode: GreyStarWillpowerCarryOverMode;
}

const CONFIG: Record<string, GreyStarBookEquipmentConfig> = {
  // gsw is never a carry-over target (it's the mini-series opener, allowsCarryOver: false) - this
  // value is unused, kept only for type completeness.
  gsw: { grantsStartingGift: true, willpowerCarryOverMode: 'threeMethods' },
  tfc: { grantsStartingGift: false, willpowerCarryOverMode: 'threeMethods' },
  bng: { grantsStartingGift: false, willpowerCarryOverMode: 'autoReroll' },
};

export function getGreyStarBookEquipment(bookId: string): GreyStarBookEquipmentConfig {
  return CONFIG[bookId] ?? { grantsStartingGift: false, willpowerCarryOverMode: 'threeMethods' };
}
