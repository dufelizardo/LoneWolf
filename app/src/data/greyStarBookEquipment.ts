/**
 * Per-book Grey Star equipment config - deliberately much smaller than bookEquipment.ts (no
 * chooseOptions/kaiWeaponTable/goldRollBonus) since every Grey Star book's kit is fixed, not a
 * "choose N of a list" screen.
 */

/**
 * How WILLPOWER (and, for 'moonstoneBonus', ENDURANCE too) is recalculated when a character is carried
 * over INTO this book. 'threeMethods' (Book 2): the player picks among 3 methods (see
 * GreyStarWillpowerCarryOverMethod in greyStarCharacter.ts). 'autoReroll' (Book 3): footnote fix -
 * COMBAT SKILL/ENDURANCE carry over unchanged, WILLPOWER is rerolled with a flat bonus that scales with
 * progress, no player choice (see rollWillpowerForLaterBookCarryOver). 'moonstoneBonus' (Book 4+):
 * footnote fix - COMBAT SKILL still carries over unchanged, but both WILLPOWER and ENDURANCE get a flat
 * deterministic bonus added to their previous final values, no player choice, no dice roll at all (see
 * computeMoonstoneCarryOver) - the only carry-over rule in the whole series that also raises the
 * ENDURANCE ceiling.
 */
export type GreyStarWillpowerCarryOverMode = 'threeMethods' | 'autoReroll' | 'moonstoneBonus';

export interface GreyStarBookEquipmentConfig {
  /** Only Book 1 (gsw) has the Isle of Lorn parting-gift table (Jewelled Dagger/Magic Talisman/Vial
   * of Laumspur) - equipmnt.htm of later books has no equivalent. */
  grantsStartingGift: boolean;
  willpowerCarryOverMode: GreyStarWillpowerCarryOverMode;
  /** Only Book 4 (ww): a fresh character's WILLPOWER/ENDURANCE are fixed values, not rolled -
   * gamerulz.htm: "your first touch of the Moonstone... regenerates your Magical Powers immediately" /
   * "fills your body with energy and power". Absent = the normal rollRandomNumber(rng) + 20 formula.
   * COMBAT SKILL is always rolled 10+d10 regardless - no book has ever changed that. */
  freshWillpowerFlat?: number;
  freshEnduranceFlat?: number;
  /** Only books offering Higher Magicks (only ww so far) - how many of ALL_HIGHER_MAGICAL_POWERS a
   * character picks, depending on whether this is their first-ever Grey Star adventure or a carry-over
   * from any earlier one (powers.htm: "If this is your first Grey Star adventure... four Higher
   * Magicks. If you have successfully completed any of the previous... five Higher Magicks."). */
  higherMagicalPowerCount?: { fresh: number; carryOver: number };
  /** Only ww: grants the Moonstone as a fixed Special Item, both on a fresh start and on carry-over. */
  grantsMoonstone?: boolean;
}

const CONFIG: Record<string, GreyStarBookEquipmentConfig> = {
  // gsw is never a carry-over target (it's the mini-series opener, allowsCarryOver: false) - this
  // value is unused, kept only for type completeness.
  gsw: { grantsStartingGift: true, willpowerCarryOverMode: 'threeMethods' },
  tfc: { grantsStartingGift: false, willpowerCarryOverMode: 'threeMethods' },
  bng: { grantsStartingGift: false, willpowerCarryOverMode: 'autoReroll' },
  ww: {
    grantsStartingGift: false,
    willpowerCarryOverMode: 'moonstoneBonus',
    freshWillpowerFlat: 50,
    freshEnduranceFlat: 30,
    higherMagicalPowerCount: { fresh: 4, carryOver: 5 },
    grantsMoonstone: true,
  },
};

export function getGreyStarBookEquipment(bookId: string): GreyStarBookEquipmentConfig {
  return CONFIG[bookId] ?? { grantsStartingGift: false, willpowerCarryOverMode: 'threeMethods' };
}
