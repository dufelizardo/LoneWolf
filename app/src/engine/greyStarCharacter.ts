import { rollRandomNumber, type Rng } from './rng';
import { addBackpackItem, addHerbPouchItem, addSpecialItem, addWeapon } from './greyStarInventory';
import { getGreyStarBookEquipment } from '../data/greyStarBookEquipment';
import {
  ALL_HIGHER_MAGICAL_POWERS,
  ALL_MAGICAL_POWERS,
  WIZARDS_STAFF,
  type GreyStarActionChart,
  type HigherMagicalPower,
  type MagicalPower,
  type StartingGift,
} from './greyStarTypes';

/** "The Moonstone—carried in hand or in your Backpack" (equipmnt.htm) - granted as a fixed Special Item
 * whenever getGreyStarBookEquipment(bookId).grantsMoonstone is set (only ww so far), on both a fresh
 * start (see createFreshGreyStarCharacter) and a carry-over into it (see the character-creation screen,
 * which calls this after carryOverGreyStarCharacterToBook - that path never touches createFresh...). */
export function grantMoonstone(chart: GreyStarActionChart): GreyStarActionChart {
  return addSpecialItem(chart, {
    name: 'The Moonstone',
    knownEffects: 'Pode teletransportar você até Shasarak uma única vez durante a aventura',
  });
}

/**
 * Creates a fresh Grey Star character with rolled stats and the fixed starting kit, before Magical
 * Power selection and the one-time gift choice. Mirrors character.ts's createFreshCharacterForBook
 * shape, but Grey Star's kit is entirely fixed (gamerulz.htm/equipmnt.htm) - see greyStarBookEquipment.ts
 * for the per-book equipment differences found so far (the Book 1-only starting gift, Book 4's flat
 * WILLPOWER/ENDURANCE and Moonstone).
 */
export function createFreshGreyStarCharacter(bookId: string, rng: Rng = Math.random): GreyStarActionChart {
  const config = getGreyStarBookEquipment(bookId);
  const combatSkill = rollRandomNumber(rng) + 10;
  // Book 4 (ww): "your first touch of the Moonstone... regenerates your Magical Powers immediately" /
  // "fills your body with energy and power" - WILLPOWER/ENDURANCE start at fixed values, not rolled.
  // COMBAT SKILL is always rolled - no book has ever changed that.
  const willpowerCurrent = config.freshWillpowerFlat ?? rollRandomNumber(rng) + 20;
  const enduranceRoll = config.freshEnduranceFlat ?? rollRandomNumber(rng) + 20;

  let chart: GreyStarActionChart = {
    bookId,
    combatSkill,
    willpowerCurrent,
    // The value above, before any later gift bonus or in-game spend - see willpowerStarting's doc
    // comment in greyStarTypes.ts (needed for a Book 2+ carry-over method).
    willpowerStarting: willpowerCurrent,
    enduranceMax: enduranceRoll,
    enduranceCurrent: enduranceRoll,
    magicalPowers: [],
    higherMagicalPowers: [],
    weapons: [],
    equippedWeapon: null,
    backpackItems: [],
    meals: 0,
    specialItems: [],
    herbPouchItems: [],
    nobles: 0,
    currentSection: 1,
    visitedSections: [],
    isAlive: true,
  };

  // "Your only weapon is your Wizard's Staff... You wear a Backpack containing 4 Meals... you have
  // been given a map of the Shadakine Empire" (equipmnt.htm) - always granted, not a choice.
  chart = addWeapon(chart, WIZARDS_STAFF);
  for (let i = 0; i < 4; i++) chart = { ...chart, meals: chart.meals + 1 };
  chart = addSpecialItem(chart, { name: 'Map of the Shadakine Empire' });
  if (config.grantsMoonstone) chart = grantMoonstone(chart);

  return chart;
}

// "If you have chosen Alchemy as one of your Magical Powers, then you will have a leather pouch for
// herbs and potions... 2 empty Vials... 1 Vial containing Saltpetre... 1 Vial containing Sulphur"
// (equipmnt.htm) - shared by chooseMagicalPowers (fresh 5-power choice), addExtraMagicalPower (Book 2+
// carry-over, gaining Alchemy as the 6th power), and chooseHigherMagicalPowers (Book 4+, gaining Theurgy
// without already having Alchemy - equipmnt.htm footnote 8/9) since all three can be the moment a
// character first gains access to Alchemy-flavored magic.
function grantHerbPouchStartingContents(chart: GreyStarActionChart): GreyStarActionChart {
  let next = chart;
  next = addHerbPouchItem(next, 'Empty Vial');
  next = addHerbPouchItem(next, 'Empty Vial');
  next = addHerbPouchItem(next, 'Vial of Saltpetre');
  next = addHerbPouchItem(next, 'Vial of Sulphur');
  return next;
}

/** Exactly five of the seven ALL_MAGICAL_POWERS (discplnz.htm-equivalent: powers.htm). Throws on any other count, matching applyGrandMasterDisciplines's validation style. */
export function chooseMagicalPowers(chart: GreyStarActionChart, powers: MagicalPower[]): GreyStarActionChart {
  if (powers.length !== 5) throw new Error(`Expected exactly 5 Magical Powers, got ${powers.length}`);
  const unique = new Set(powers);
  if (unique.size !== 5) throw new Error('Magical Powers must be distinct');
  for (const power of powers) {
    if (!ALL_MAGICAL_POWERS.includes(power)) throw new Error(`Unknown Magical Power: ${power}`);
  }

  let next: GreyStarActionChart = { ...chart, magicalPowers: [...powers] };
  if (powers.includes('Alchemy')) next = grantHerbPouchStartingContents(next);
  return next;
}

/**
 * Book 2+'s gamerulz.htm, for a character carried over from a previous Grey Star book: "your powers
 * of wizardry have grown... choose one more Magical Power" - the 6th, from the 2 not already known.
 * If you choose Alchemy as this new power, you also receive a Herb Pouch now (footnote 2).
 */
export function addExtraMagicalPower(chart: GreyStarActionChart, power: MagicalPower): GreyStarActionChart {
  if (chart.magicalPowers.length !== 5) {
    throw new Error(`Expected a character with exactly 5 Magical Powers, got ${chart.magicalPowers.length}`);
  }
  if (chart.magicalPowers.includes(power)) {
    throw new Error(`Character already has the ${power} Magical Power`);
  }
  if (!ALL_MAGICAL_POWERS.includes(power)) throw new Error(`Unknown Magical Power: ${power}`);

  let next: GreyStarActionChart = { ...chart, magicalPowers: [...chart.magicalPowers, power] };
  if (power === 'Alchemy') next = grantHerbPouchStartingContents(next);
  return next;
}

/**
 * Book 4+'s powers.htm: "There are thirteen Magical Powers, the first seven... Lesser Magicks...
 * Possession of the Moonstone reveals... the Higher Magicks, of which there are six." `expectedCount`
 * is 4 for a fresh first-ever Grey Star adventure or 5 for a character carried over from any earlier
 * one (see greyStarBookEquipment.ts's higherMagicalPowerCount) - the caller (character-creation screen)
 * knows which applies. Grants the Herb Pouch if Theurgy is chosen and the character doesn't already
 * have Alchemy (equipmnt.htm footnote 8/9) - Theurgy is an "advanced form of Alchemy" that unlocks the
 * same container.
 */
export function chooseHigherMagicalPowers(
  chart: GreyStarActionChart,
  powers: HigherMagicalPower[],
  expectedCount: number,
): GreyStarActionChart {
  if (powers.length !== expectedCount) {
    throw new Error(`Expected exactly ${expectedCount} Higher Magicks, got ${powers.length}`);
  }
  const unique = new Set(powers);
  if (unique.size !== expectedCount) throw new Error('Higher Magicks must be distinct');
  for (const power of powers) {
    if (!ALL_HIGHER_MAGICAL_POWERS.includes(power)) throw new Error(`Unknown Higher Magick: ${power}`);
  }

  let next: GreyStarActionChart = { ...chart, higherMagicalPowers: [...powers] };
  if (powers.includes('Theurgy') && !chart.magicalPowers.includes('Alchemy')) {
    next = grantHerbPouchStartingContents(next);
  }
  return next;
}

/** The Shianti Masters' single parting gift - "you may choose one of them" (equipmnt.htm). */
export function chooseStartingGift(chart: GreyStarActionChart, gift: StartingGift): GreyStarActionChart {
  switch (gift) {
    case 'JewelledDagger':
      // "+1 point to your COMBAT SKILL when used in combat" - a per-combat conditional bonus (only
      // while this specific weapon is equipped), same pattern as Lone Wolf's Kai Weapon bonus, so it's
      // modeled as a plain Special Item + weapon entry rather than a flat combatSkill increase here.
      return addWeapon(addSpecialItem(chart, { name: 'Jewelled Dagger', knownEffects: '+1 Combat Skill quando equipado e usado em combate' }), 'Jewelled Dagger');
    case 'MagicTalisman':
      // "adds 2 points to your WILLPOWER total... only once and does not prevent your score from
      // falling to zero or below" - a genuine one-time flat addition, unlike the Dagger's conditional
      // combat bonus, so it's applied directly here rather than left to combat-time lookup.
      return addSpecialItem({ ...chart, willpowerCurrent: chart.willpowerCurrent + 2 }, { name: 'Magic Talisman', knownEffects: '+2 Willpower (já aplicado)' });
    case 'VialOfLaumspur':
      return addBackpackItem(chart, 'Vial of Laumspur');
  }
}

/**
 * Fields recalculated by a carry-over, as computed by the caller for whichever policy applies to the
 * target book (see greyStarBookEquipment.ts's willpowerCarryOverMode). `enduranceCurrent`/`enduranceMax`
 * are optional because only Book 4's 'moonstoneBonus' policy touches ENDURANCE at all - Books 2 and 3
 * leave it entirely alone (undefined here means "keep the inherited value").
 */
export interface GreyStarCarryOverPatch {
  willpowerCurrent: number;
  enduranceCurrent?: number;
  enduranceMax?: number;
}

/**
 * Carries a Grey Star character over into the next book of the mini-series (Book 2+ only - Book 1 is
 * always a fresh start). Takes the already-computed patch rather than calculating it itself, since each
 * target book can have its own recalculation policy (computeThreeMethodWillpowerCarryOver,
 * rollWillpowerForLaterBookCarryOver, computeMoonstoneCarryOver below, for the three policies found so
 * far). Everything else (COMBAT SKILL, weapons, Backpack/Herb Pouch items, Special Items, Nobles, and
 * ENDURANCE whenever the patch doesn't touch it) carries over unchanged via the spread - gamerulz.htm's
 * own carry-over text only ever mentions "weapons and Special Items", but the Book 2 errata (Section 17
 * note, about a Bundle of Azawood Leaves bought in Book 1 and used in Book 2) confirms Backpack/Herb
 * Pouch items survive too in practice.
 */
export function carryOverGreyStarCharacterToBook(
  previous: GreyStarActionChart,
  bookId: string,
  patch: GreyStarCarryOverPatch,
): GreyStarActionChart {
  return {
    ...previous,
    bookId,
    willpowerCurrent: patch.willpowerCurrent,
    willpowerStarting: patch.willpowerCurrent,
    enduranceCurrent: patch.enduranceCurrent ?? previous.enduranceCurrent,
    enduranceMax: patch.enduranceMax ?? previous.enduranceMax,
    currentSection: 1,
    visitedSections: [],
    isAlive: true,
  };
}

export type GreyStarWillpowerCarryOverMethod = 'keepCurrent' | 'reroll' | 'useStarting';

/**
 * Book 2's gamerulz.htm: the main text says "add 10 to your WILLPOWER total", but footnote 1 admits
 * this "doesn't seem fair" (WILLPOWER is typically near zero by the end of a book, having been spent on
 * magic/the Staff) and offers 2 alternatives - rolling a brand new WILLPOWER score, or reusing the
 * previous book's own starting score - leaving the choice to the player.
 */
export function computeThreeMethodWillpowerCarryOver(
  previous: GreyStarActionChart,
  method: GreyStarWillpowerCarryOverMethod,
  rng: Rng = Math.random,
): number {
  const bonus = 10;
  if (method === 'reroll') return rollRandomNumber(rng) + 20 + bonus;
  if (method === 'useStarting') return previous.willpowerStarting + bonus;
  return previous.willpowerCurrent + bonus;
}

/**
 * Book 3's gamerulz.htm literally asks to re-pick all 3 attributes from scratch (with a WILLPOWER bonus
 * that scales by progress: +20 first adventure, +25 completed Book 1, +30 completed Books 1 and 2), but
 * footnote 1 calls this "without precedent in other books" and "appears to be a mistake", recommending
 * instead: keep COMBAT SKILL/ENDURANCE from the carried-over character, and only reroll WILLPOWER (with
 * the matching bonus) - no player choice, unlike Book 2's three methods. The "+20 first adventure" case
 * never reaches this function (createFreshGreyStarCharacter covers it); magicalPowers.length is a
 * reliable proxy for progress here since a character only ever reaches 6 Magical Powers by having gone
 * through the one-time Book 1->2 carry-over bump (addExtraMagicalPower).
 */
export function rollWillpowerForLaterBookCarryOver(previous: GreyStarActionChart, rng: Rng = Math.random): number {
  const bonus = previous.magicalPowers.length >= 6 ? 30 : 25;
  return rollRandomNumber(rng) + bonus;
}

/**
 * Book 4 (ww)'s gamerulz.htm: no dice roll at all, no player choice - COMBAT SKILL stays as-is
 * (footnote 1's fix, same recommendation since Book 2), WILLPOWER gets a flat +50 added to its previous
 * final value (footnote 2: "the original intent... was most likely... add 50 to your final WILLPOWER
 * score"), and ENDURANCE gets a flat +30 added to its previous final value - AND that sum becomes the
 * new ceiling too (footnote 5, explicit: "in the Lone Wolf series it is standard practice to restore
 * one's ENDURANCE... to their original total... but the power of the Moonstone seems to change those
 * rules in this case") - the only carry-over rule in the whole series (Lone Wolf or Grey Star) where the
 * ENDURANCE ceiling itself changes.
 */
export function computeMoonstoneCarryOver(
  previous: GreyStarActionChart,
): { willpowerCurrent: number; enduranceCurrent: number; enduranceMax: number } {
  const newEndurance = previous.enduranceCurrent + 30;
  return {
    willpowerCurrent: previous.willpowerCurrent + 50,
    enduranceCurrent: newEndurance,
    enduranceMax: newEndurance,
  };
}
