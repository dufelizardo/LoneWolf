import { rollRandomNumber, type Rng } from './rng';
import { addBackpackItem, addHerbPouchItem, addSpecialItem, addWeapon } from './greyStarInventory';
import { ALL_MAGICAL_POWERS, WIZARDS_STAFF, type GreyStarActionChart, type MagicalPower, type StartingGift } from './greyStarTypes';

/**
 * Creates a fresh Grey Star character with rolled stats and the fixed starting kit, before Magical
 * Power selection and the one-time gift choice. Mirrors character.ts's createFreshCharacterForBook
 * shape, but Grey Star's kit is entirely fixed (gamerulz.htm/equipmnt.htm) - see greyStarBookEquipment.ts
 * for the one per-book equipment difference found so far (the Book 1-only starting gift).
 */
export function createFreshGreyStarCharacter(bookId: string, rng: Rng = Math.random): GreyStarActionChart {
  const combatSkill = rollRandomNumber(rng) + 10;
  const willpowerCurrent = rollRandomNumber(rng) + 20;
  const enduranceRoll = rollRandomNumber(rng) + 20;

  let chart: GreyStarActionChart = {
    bookId,
    combatSkill,
    willpowerCurrent,
    // The roll above, before any later gift bonus or in-game spend - see willpowerStarting's doc
    // comment in greyStarTypes.ts (needed for a Book 2+ carry-over method).
    willpowerStarting: willpowerCurrent,
    enduranceMax: enduranceRoll,
    enduranceCurrent: enduranceRoll,
    magicalPowers: [],
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

  return chart;
}

// "If you have chosen Alchemy as one of your Magical Powers, then you will have a leather pouch for
// herbs and potions... 2 empty Vials... 1 Vial containing Saltpetre... 1 Vial containing Sulphur"
// (equipmnt.htm) - shared by chooseMagicalPowers (fresh 5-power choice) and addExtraMagicalPower
// (Book 2+ carry-over, gaining Alchemy as the 6th power) since both can be the moment Alchemy is
// first chosen.
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

export type GreyStarWillpowerCarryOverMethod = 'keepCurrent' | 'reroll' | 'useStarting';

/**
 * Carries a Grey Star character over into the next book of the mini-series (Book 2+ only - Book 1 is
 * always a fresh start). gamerulz.htm's main text says "add 10 to your WILLPOWER total", but footnote 1
 * admits this "doesn't seem fair" (WILLPOWER is typically near zero by the end of a book, having been
 * spent on magic/the Staff) and offers 2 alternatives - rolling a brand new WILLPOWER score, or reusing
 * the previous book's own starting score - leaving the choice to the player. Everything else
 * (COMBAT SKILL, ENDURANCE, weapons, Backpack/Herb Pouch items, Special Items, Nobles) carries over
 * unchanged via the spread - gamerulz.htm's own carry-over text only mentions "weapons and Special
 * Items", but the book's own errata (Section 17 note, about a Bundle of Azawood Leaves bought in Book 1
 * and used in Book 2) confirms Backpack/Herb Pouch items survive too in practice.
 */
export function carryOverGreyStarCharacterToBook(
  previous: GreyStarActionChart,
  bookId: string,
  willpowerMethod: GreyStarWillpowerCarryOverMethod,
  rng: Rng = Math.random,
): GreyStarActionChart {
  const bonus = 10;
  const newWillpower =
    willpowerMethod === 'reroll'
      ? rollRandomNumber(rng) + 20 + bonus
      : willpowerMethod === 'useStarting'
        ? previous.willpowerStarting + bonus
        : previous.willpowerCurrent + bonus;

  return {
    ...previous,
    bookId,
    willpowerCurrent: newWillpower,
    willpowerStarting: newWillpower,
    currentSection: 1,
    visitedSections: [],
    isAlive: true,
  };
}
