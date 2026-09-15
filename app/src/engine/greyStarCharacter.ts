import { rollRandomNumber, type Rng } from './rng';
import { addBackpackItem, addHerbPouchItem, addSpecialItem, addWeapon } from './greyStarInventory';
import { ALL_MAGICAL_POWERS, WIZARDS_STAFF, type GreyStarActionChart, type MagicalPower, type StartingGift } from './greyStarTypes';

/**
 * Creates a fresh Grey Star character with rolled stats and the fixed starting kit, before Magical
 * Power selection and the one-time gift choice. Mirrors character.ts's createFreshCharacterForBook
 * shape, but Grey Star's kit is entirely fixed (gamerulz.htm/equipmnt.htm) - no bookEquipment.ts-style
 * per-book "choose N of a list" config, since there's currently only one book in this phase and its
 * equipment section describes a flat, non-optional kit (plus the separate one-time gift, see
 * chooseStartingGift).
 */
export function createFreshGreyStarCharacter(bookId: string, rng: Rng = Math.random): GreyStarActionChart {
  const combatSkill = rollRandomNumber(rng) + 10;
  const willpowerCurrent = rollRandomNumber(rng) + 20;
  const enduranceRoll = rollRandomNumber(rng) + 20;

  let chart: GreyStarActionChart = {
    bookId,
    combatSkill,
    willpowerCurrent,
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

/** Exactly five of the seven ALL_MAGICAL_POWERS (discplnz.htm-equivalent: powers.htm). Throws on any other count, matching applyGrandMasterDisciplines's validation style. */
export function chooseMagicalPowers(chart: GreyStarActionChart, powers: MagicalPower[]): GreyStarActionChart {
  if (powers.length !== 5) throw new Error(`Expected exactly 5 Magical Powers, got ${powers.length}`);
  const unique = new Set(powers);
  if (unique.size !== 5) throw new Error('Magical Powers must be distinct');
  for (const power of powers) {
    if (!ALL_MAGICAL_POWERS.includes(power)) throw new Error(`Unknown Magical Power: ${power}`);
  }

  let next: GreyStarActionChart = { ...chart, magicalPowers: [...powers] };

  // "If you have chosen Alchemy as one of your Magical Powers, then you will have a leather pouch for
  // herbs and potions... 2 empty Vials... 1 Vial containing Saltpetre... 1 Vial containing Sulphur"
  // (equipmnt.htm) - the Herb Pouch and its starting contents are conditional on this one choice.
  if (powers.includes('Alchemy')) {
    next = addHerbPouchItem(next, 'Empty Vial');
    next = addHerbPouchItem(next, 'Empty Vial');
    next = addHerbPouchItem(next, 'Vial of Saltpetre');
    next = addHerbPouchItem(next, 'Vial of Sulphur');
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
