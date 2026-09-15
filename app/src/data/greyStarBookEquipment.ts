/**
 * Per-book Grey Star equipment config - deliberately much smaller than bookEquipment.ts (no
 * chooseOptions/kaiWeaponTable/goldRollBonus) since every Grey Star book's kit is fixed, not a
 * "choose N of a list" screen. Only one real per-book difference has been found so far.
 */
export interface GreyStarBookEquipmentConfig {
  /** Only Book 1 (gsw) has the Isle of Lorn parting-gift table (Jewelled Dagger/Magic Talisman/Vial
   * of Laumspur) - equipmnt.htm of later books has no equivalent. */
  grantsStartingGift: boolean;
}

const CONFIG: Record<string, GreyStarBookEquipmentConfig> = {
  gsw: { grantsStartingGift: true },
  tfc: { grantsStartingGift: false },
};

export function getGreyStarBookEquipment(bookId: string): GreyStarBookEquipmentConfig {
  return CONFIG[bookId] ?? { grantsStartingGift: false };
}
