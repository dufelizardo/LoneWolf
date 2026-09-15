import type { ActionChart, SpecialItem, WeaponType } from './types';
import { ALL_WEAPONS, MAX_BACKPACK_ITEMS, MAX_WEAPONS } from './types';

export interface EquipmentOption {
  id: string;
  label: string;
  apply: (chart: ActionChart) => void;
}

/** One entry of a book's Kai Weapon Table (Book 21+) - a named weapon with a fixed underlying type, granting a flat Combat Skill bonus while equipped (see ActionChart.kaiWeaponType). */
export interface KaiWeaponOption {
  name: string;
  weaponType: WeaponType;
}

export interface BookEquipmentConfig {
  /** Added on top of the random(0-9) gold roll every book grants at its equipment stage. */
  goldRollBonus: number;
  /** Weapon pool this book's Weaponskill discipline may randomly assign. */
  weaponPool: WeaponType[];
  /** Display name for this book's post-combat healing item (mechanically always +4 Endurance per dose). */
  healingPotionLabel: string;
  /** Display name for this book's pre-combat Combat Skill potion (Book 10+; always +2 CS for one whole fight per dose, via useCombatPotion). Absent in books before it existed. */
  combatPotionLabel?: string;
  /** Some books (e.g. Kalte's icy wastes) explicitly disable Hunting's no-Meal-needed exemption for the whole book. */
  huntingDisabled?: boolean;
  /** Overrides the shared MAX_BACKPACK_ITEMS cap (Grand Master books raise it from 8 to 10 - "you may now carry a maximum of ten Backpack Items", gamerulz.htm Book 13). */
  maxBackpackItems?: number;
  /** Items every character gets regardless of how equipment is chosen (fixed narrative grants). */
  applyBaseEquipment: (chart: ActionChart) => void;
  /** For books with equipmentMode 'random-one': roll 0-9, apply exactly one matching option. */
  randomTable?: Record<number, EquipmentOption>;
  /** For books with equipmentMode 'choose-two'/'choose-six': the player picks exactly this many of these. */
  chooseOptions?: EquipmentOption[];
  /** Exact number of chooseOptions the player must pick. Defaults to 2 for backward compatibility. */
  chooseCount?: number;
  /** Book 21+ (New Order): the 10-entry Kai Weapon Table the player picks from (or rolls on) at character creation, on top of the normal chooseOptions equipment. */
  kaiWeaponTable?: KaiWeaponOption[];
}

function addWeaponIfRoom(chart: ActionChart, weapon: WeaponType) {
  // A carried-over character can be offered a weapon they already own (their "Equipamento herdado"
  // isn't excluded from the choices shown) - without this guard picking it again would push a
  // duplicate entry into chart.weapons, breaking components that key their weapon list by name.
  if (chart.weapons.includes(weapon)) return;
  if (chart.weapons.length >= MAX_WEAPONS) return;
  chart.weapons.push(weapon);
  if (!chart.equippedWeapon) chart.equippedWeapon = weapon;
}

/** Backpack Items and Meals share the same slot cap (8, or 10 from the Grand Master phase onward). */
function hasBackpackRoom(chart: ActionChart): boolean {
  return chart.backpackItems.length + chart.meals < getMaxBackpackItems(chart.bookId);
}

function addMealIfRoom(chart: ActionChart) {
  if (!hasBackpackRoom(chart)) return;
  chart.meals += 1;
}

function addBackpackItemIfRoom(chart: ActionChart, item: string) {
  if (!hasBackpackRoom(chart)) return;
  chart.backpackItems.push(item);
}

function addSpecialItem(chart: ActionChart, item: SpecialItem) {
  chart.specialItems.push(item);
}

/** Grants healing-potion doses on top of whatever the character already carries. */
function grantHealingPotion(chart: ActionChart, doses = 1) {
  chart.healingPotionDoses += doses;
}

/** Grants Potion of Alether doses (+2 Combat Skill for one whole fight when drunk) on top of whatever the character already carries. */
function grantCombatPotion(chart: ActionChart, doses = 1) {
  chart.combatPotionDoses += doses;
}

/** Grants Arrows (for a Bow) on top of whatever the character already carries. */
function addArrows(chart: ActionChart, count: number) {
  chart.arrows += count;
}

export const BOOK_EQUIPMENT: Record<string, BookEquipmentConfig> = {
  ft: {
    goldRollBonus: 0,
    weaponPool: ['Axe', 'Sword', 'Mace', 'Quarterstaff', 'Spear', 'Broadsword'],
    healingPotionLabel: 'Healing Potion',
    applyBaseEquipment: (c) => {
      addWeaponIfRoom(c, 'Axe');
      addMealIfRoom(c);
      addSpecialItem(c, { name: 'Map of Sommerlund' });
    },
    randomTable: {
      1: { id: 'sword', label: 'Sword', apply: (c) => addWeaponIfRoom(c, 'Sword') },
      2: {
        id: 'helmet',
        label: 'Helmet (+2 Endurance)',
        apply: (c) => {
          addSpecialItem(c, { name: 'Helmet', knownEffects: '+2 Endurance' });
          c.enduranceMax += 2;
          c.enduranceCurrent += 2;
        },
      },
      3: { id: 'two-meals', label: 'Two Meals', apply: (c) => { addMealIfRoom(c); addMealIfRoom(c); } },
      4: {
        id: 'chainmail',
        label: 'Chainmail Waistcoat (+4 Endurance)',
        apply: (c) => {
          addSpecialItem(c, { name: 'Chainmail Waistcoat', knownEffects: '+4 Endurance' });
          c.enduranceMax += 4;
          c.enduranceCurrent += 4;
        },
      },
      5: { id: 'mace', label: 'Mace', apply: (c) => addWeaponIfRoom(c, 'Mace') },
      6: { id: 'healing-potion', label: 'Healing Potion', apply: (c) => grantHealingPotion(c) },
      7: { id: 'quarterstaff', label: 'Quarterstaff', apply: (c) => addWeaponIfRoom(c, 'Quarterstaff') },
      8: { id: 'spear', label: 'Spear', apply: (c) => addWeaponIfRoom(c, 'Spear') },
      9: { id: 'gold-12', label: '12 Gold Crowns', apply: (c) => { c.goldCrowns += 12; } },
      0: { id: 'broadsword', label: 'Broadsword', apply: (c) => addWeaponIfRoom(c, 'Broadsword') },
    },
  },
  fa: {
    goldRollBonus: 10,
    weaponPool: ['Sword', 'ShortSword', 'Mace', 'Quarterstaff', 'Spear', 'Broadsword'],
    healingPotionLabel: 'Healing Potion',
    applyBaseEquipment: (c) => {
      addSpecialItem(c, { name: 'Map', description: 'Found in the ashes of the Kai Monastery.' });
      addSpecialItem(c, {
        name: 'Seal of Hammerdal',
        description:
          'A golden ring bearing the royal arms of Durenor, given by King Alin — proof of your right to claim the Sommerswerd.',
      });
    },
    chooseCount: 2,
    chooseOptions: [
      { id: 'sword', label: 'Sword', apply: (c) => addWeaponIfRoom(c, 'Sword') },
      { id: 'short-sword', label: 'Short Sword', apply: (c) => addWeaponIfRoom(c, 'ShortSword') },
      { id: 'two-meals', label: 'Two Meals', apply: (c) => { addMealIfRoom(c); addMealIfRoom(c); } },
      {
        id: 'chainmail',
        label: 'Chainmail Waistcoat (+4 Endurance)',
        apply: (c) => {
          addSpecialItem(c, { name: 'Chainmail Waistcoat', knownEffects: '+4 Endurance' });
          c.enduranceMax += 4;
          c.enduranceCurrent += 4;
        },
      },
      { id: 'mace', label: 'Mace', apply: (c) => addWeaponIfRoom(c, 'Mace') },
      { id: 'healing-potion', label: 'Healing Potion', apply: (c) => grantHealingPotion(c) },
      { id: 'quarterstaff', label: 'Quarterstaff', apply: (c) => addWeaponIfRoom(c, 'Quarterstaff') },
      { id: 'spear', label: 'Spear', apply: (c) => addWeaponIfRoom(c, 'Spear') },
      {
        id: 'shield',
        label: 'Shield (+2 Combat Skill in combat)',
        apply: (c) => {
          addSpecialItem(c, { name: 'Shield', knownEffects: '+2 Combat Skill in combat' });
        },
      },
      { id: 'broadsword', label: 'Broadsword', apply: (c) => addWeaponIfRoom(c, 'Broadsword') },
    ],
  },
  tck: {
    goldRollBonus: 10,
    weaponPool: ALL_WEAPONS,
    healingPotionLabel: 'Potion of Laumspur',
    // "As Kalte is an icy desert you will be unable to use the Kai Discipline of Hunting to obtain
    // a Meal" (equipmnt.htm) - the usual no-Meal-needed exemption doesn't apply anywhere in this book.
    huntingDisabled: true,
    applyBaseEquipment: (c) => {
      addSpecialItem(c, { name: 'Map of Kalte' });
    },
    chooseCount: 2,
    chooseOptions: [
      { id: 'sword', label: 'Sword', apply: (c) => addWeaponIfRoom(c, 'Sword') },
      { id: 'short-sword', label: 'Short Sword', apply: (c) => addWeaponIfRoom(c, 'ShortSword') },
      {
        id: 'padded-leather-waistcoat',
        label: 'Padded Leather Waistcoat (+2 Endurance)',
        apply: (c) => {
          addSpecialItem(c, { name: 'Padded Leather Waistcoat', knownEffects: '+2 Endurance' });
          c.enduranceMax += 2;
          c.enduranceCurrent += 2;
        },
      },
      { id: 'spear', label: 'Spear', apply: (c) => addWeaponIfRoom(c, 'Spear') },
      { id: 'mace', label: 'Mace', apply: (c) => addWeaponIfRoom(c, 'Mace') },
      { id: 'warhammer', label: 'Warhammer', apply: (c) => addWeaponIfRoom(c, 'Warhammer') },
      { id: 'axe', label: 'Axe', apply: (c) => addWeaponIfRoom(c, 'Axe') },
      { id: 'potion-of-laumspur', label: 'Potion of Laumspur', apply: (c) => grantHealingPotion(c) },
      { id: 'quarterstaff', label: 'Quarterstaff', apply: (c) => addWeaponIfRoom(c, 'Quarterstaff') },
      { id: 'special-rations', label: 'Special Rations', apply: (c) => addMealIfRoom(c) },
      { id: 'broadsword', label: 'Broadsword', apply: (c) => addWeaponIfRoom(c, 'Broadsword') },
    ],
  },
  tcd: {
    goldRollBonus: 10,
    weaponPool: ['Warhammer', 'Dagger', 'Sword', 'Spear', 'Mace'],
    healingPotionLabel: 'Potion of Laumspur',
    // Hunting is disabled only in two specific zones (Wildlands south of the Pass of Moytura, and
    // the Maaken Mines), not the whole book — unlike tck's flat huntingDisabled. The story itself
    // reminds the player at every relevant section ("you are unable to use it here to hunt for
    // food"), and applyMissedMealPenalty is never invoked automatically anywhere in this app (Meal
    // penalties have always been applied manually by the player via the Endurance/Meal buttons in
    // the sidebar) — so this zone restriction needs no engine support, same as every other book.
    applyBaseEquipment: (c) => {
      addSpecialItem(c, { name: 'Map of the Southlands' });
      addSpecialItem(c, { name: 'Badge of Rank' });
    },
    chooseCount: 6,
    chooseOptions: [
      { id: 'warhammer', label: 'Warhammer', apply: (c) => addWeaponIfRoom(c, 'Warhammer') },
      { id: 'dagger', label: 'Dagger', apply: (c) => addWeaponIfRoom(c, 'Dagger') },
      {
        id: 'potions-of-laumspur',
        label: '2 Potions of Laumspur',
        apply: (c) => grantHealingPotion(c, 2),
      },
      { id: 'sword', label: 'Sword', apply: (c) => addWeaponIfRoom(c, 'Sword') },
      { id: 'spear', label: 'Spear', apply: (c) => addWeaponIfRoom(c, 'Spear') },
      {
        id: 'special-rations',
        label: '5 Special Rations',
        apply: (c) => { for (let i = 0; i < 5; i++) addMealIfRoom(c); },
      },
      { id: 'mace', label: 'Mace', apply: (c) => addWeaponIfRoom(c, 'Mace') },
      {
        id: 'chainmail',
        label: 'Chainmail Waistcoat (+4 Endurance)',
        apply: (c) => {
          addSpecialItem(c, { name: 'Chainmail Waistcoat', knownEffects: '+4 Endurance' });
          c.enduranceMax += 4;
          c.enduranceCurrent += 4;
        },
      },
      {
        id: 'shield',
        label: 'Shield (+2 Combat Skill in combat)',
        apply: (c) => {
          addSpecialItem(c, { name: 'Shield', knownEffects: '+2 Combat Skill in combat' });
        },
      },
    ],
  },
  ss: {
    goldRollBonus: 10,
    weaponPool: ['Dagger', 'Sword', 'Spear', 'Mace'],
    healingPotionLabel: 'Potion of Laumspur',
    applyBaseEquipment: (c) => {
      addSpecialItem(c, { name: 'Map of the Desert Empire' });
    },
    chooseCount: 4,
    chooseOptions: [
      { id: 'dagger', label: 'Dagger', apply: (c) => addWeaponIfRoom(c, 'Dagger') },
      { id: 'potion-of-laumspur', label: 'Potion of Laumspur', apply: (c) => grantHealingPotion(c) },
      { id: 'sword', label: 'Sword', apply: (c) => addWeaponIfRoom(c, 'Sword') },
      { id: 'spear', label: 'Spear', apply: (c) => addWeaponIfRoom(c, 'Spear') },
      {
        id: 'special-rations',
        label: '2 Special Rations',
        apply: (c) => { for (let i = 0; i < 2; i++) addMealIfRoom(c); },
      },
      { id: 'mace', label: 'Mace', apply: (c) => addWeaponIfRoom(c, 'Mace') },
      {
        id: 'shield',
        label: 'Shield (+2 Combat Skill in combat)',
        apply: (c) => {
          addSpecialItem(c, { name: 'Shield', knownEffects: '+2 Combat Skill in combat' });
        },
      },
    ],
  },
  tkt: {
    goldRollBonus: 10,
    // Never actually read for tkt — Magnakai's Weaponmastery is a free choice of 3 weapons, not a
    // random roll from a book pool like Kai's Weaponskill. Kept only to satisfy the config shape.
    weaponPool: ALL_WEAPONS,
    healingPotionLabel: 'Potion of Laumspur',
    applyBaseEquipment: (c) => {
      addSpecialItem(c, { name: 'Map of the Stornlands' });
    },
    chooseCount: 5,
    chooseOptions: [
      { id: 'sword', label: 'Sword', apply: (c) => addWeaponIfRoom(c, 'Sword') },
      { id: 'potion-of-laumspur', label: 'Potion of Laumspur', apply: (c) => grantHealingPotion(c) },
      { id: 'warhammer', label: 'Warhammer', apply: (c) => addWeaponIfRoom(c, 'Warhammer') },
      { id: 'bow', label: 'Bow', apply: (c) => addWeaponIfRoom(c, 'Bow') },
      {
        id: 'quiver',
        label: 'Quiver (6 Arrows)',
        apply: (c) => {
          addSpecialItem(c, { name: 'Quiver', knownEffects: 'Holds up to 6 Arrows' });
          addArrows(c, 6);
        },
      },
      {
        id: 'special-rations',
        label: '4 Special Rations',
        apply: (c) => { for (let i = 0; i < 4; i++) addMealIfRoom(c); },
      },
      { id: 'quarterstaff', label: 'Quarterstaff', apply: (c) => addWeaponIfRoom(c, 'Quarterstaff') },
      {
        id: 'padded-leather-waistcoat',
        label: 'Padded Leather Waistcoat (+2 Endurance)',
        apply: (c) => {
          addSpecialItem(c, { name: 'Padded Leather Waistcoat', knownEffects: '+2 Endurance' });
          c.enduranceMax += 2;
          c.enduranceCurrent += 2;
        },
      },
      { id: 'rope', label: 'Rope', apply: (c) => addBackpackItemIfRoom(c, 'Rope') },
      { id: 'dagger', label: 'Dagger', apply: (c) => addWeaponIfRoom(c, 'Dagger') },
      { id: 'tinderbox', label: 'Tinderbox', apply: (c) => addBackpackItemIfRoom(c, 'Tinderbox') },
      { id: 'axe', label: 'Axe', apply: (c) => addWeaponIfRoom(c, 'Axe') },
    ],
  },
  cd: {
    goldRollBonus: 10,
    // Never actually read for cd — same reasoning as tkt above.
    weaponPool: ALL_WEAPONS,
    healingPotionLabel: 'Potion of Laumspur',
    applyBaseEquipment: (c) => {
      addSpecialItem(c, { name: 'Map of Herdos' });
    },
    chooseCount: 5,
    chooseOptions: [
      { id: 'sword', label: 'Sword', apply: (c) => addWeaponIfRoom(c, 'Sword') },
      { id: 'bow', label: 'Bow', apply: (c) => addWeaponIfRoom(c, 'Bow') },
      {
        id: 'quiver',
        label: 'Quiver (6 Arrows)',
        apply: (c) => {
          addSpecialItem(c, { name: 'Quiver', knownEffects: 'Holds up to 6 Arrows' });
          addArrows(c, 6);
        },
      },
      { id: 'rope', label: 'Rope', apply: (c) => addBackpackItemIfRoom(c, 'Rope') },
      { id: 'potion-of-laumspur', label: 'Potion of Laumspur', apply: (c) => grantHealingPotion(c) },
      { id: 'lantern', label: 'Lantern', apply: (c) => addBackpackItemIfRoom(c, 'Lantern') },
      { id: 'mace', label: 'Mace', apply: (c) => addWeaponIfRoom(c, 'Mace') },
      {
        id: 'meals',
        label: '3 Meals',
        apply: (c) => { for (let i = 0; i < 3; i++) addMealIfRoom(c); },
      },
      { id: 'dagger', label: 'Dagger', apply: (c) => addWeaponIfRoom(c, 'Dagger') },
      {
        id: 'fireseeds',
        label: '3 Fireseeds',
        apply: (c) => {
          for (let i = 0; i < 3; i++) {
            addSpecialItem(c, { name: 'Fireseed', knownEffects: 'Explodes on impact with a hard surface' });
          }
        },
      },
    ],
  },
  tjh: {
    goldRollBonus: 10,
    // Never actually read for tjh — same reasoning as tkt above.
    weaponPool: ALL_WEAPONS,
    healingPotionLabel: 'Potion of Laumspur',
    applyBaseEquipment: (c) => {
      addSpecialItem(c, { name: 'Map of the Danarg Swamp' });
    },
    chooseCount: 5,
    chooseOptions: [
      { id: 'sword', label: 'Sword', apply: (c) => addWeaponIfRoom(c, 'Sword') },
      { id: 'bow', label: 'Bow', apply: (c) => addWeaponIfRoom(c, 'Bow') },
      {
        id: 'quiver',
        label: 'Quiver (6 Arrows)',
        apply: (c) => {
          addSpecialItem(c, { name: 'Quiver', knownEffects: 'Holds up to 6 Arrows' });
          addArrows(c, 6);
        },
      },
      { id: 'rope', label: 'Rope', apply: (c) => addBackpackItemIfRoom(c, 'Rope') },
      { id: 'potion-of-laumspur', label: 'Potion of Laumspur', apply: (c) => grantHealingPotion(c) },
      { id: 'lantern', label: 'Lantern', apply: (c) => addBackpackItemIfRoom(c, 'Lantern') },
      { id: 'mace', label: 'Mace', apply: (c) => addWeaponIfRoom(c, 'Mace') },
      {
        id: 'meals',
        label: '3 Meals',
        apply: (c) => { for (let i = 0; i < 3; i++) addMealIfRoom(c); },
      },
      { id: 'dagger', label: 'Dagger', apply: (c) => addWeaponIfRoom(c, 'Dagger') },
      {
        id: 'fireseeds',
        label: '3 Fireseeds',
        apply: (c) => {
          for (let i = 0; i < 3; i++) {
            addSpecialItem(c, { name: 'Fireseed', knownEffects: 'Explodes on impact with a hard surface' });
          }
        },
      },
    ],
  },
  tcf: {
    goldRollBonus: 10,
    // Never actually read for tcf — same reasoning as tkt above.
    weaponPool: ALL_WEAPONS,
    healingPotionLabel: 'Potion of Laumspur',
    applyBaseEquipment: (c) => {
      addSpecialItem(c, { name: 'Map of the Republic of Anari' });
    },
    chooseCount: 5,
    chooseOptions: [
      { id: 'sword', label: 'Sword', apply: (c) => addWeaponIfRoom(c, 'Sword') },
      { id: 'bow', label: 'Bow', apply: (c) => addWeaponIfRoom(c, 'Bow') },
      {
        id: 'quiver',
        label: 'Quiver (6 Arrows)',
        apply: (c) => {
          addSpecialItem(c, { name: 'Quiver', knownEffects: 'Holds up to 6 Arrows' });
          addArrows(c, 6);
        },
      },
      { id: 'rope', label: 'Rope', apply: (c) => addBackpackItemIfRoom(c, 'Rope') },
      { id: 'potion-of-laumspur', label: 'Potion of Laumspur', apply: (c) => grantHealingPotion(c) },
      { id: 'lantern', label: 'Lantern', apply: (c) => addBackpackItemIfRoom(c, 'Lantern') },
      { id: 'mace', label: 'Mace', apply: (c) => addWeaponIfRoom(c, 'Mace') },
      {
        id: 'meals',
        label: '3 Meals',
        apply: (c) => { for (let i = 0; i < 3; i++) addMealIfRoom(c); },
      },
      { id: 'dagger', label: 'Dagger', apply: (c) => addWeaponIfRoom(c, 'Dagger') },
      {
        id: 'fireseeds',
        label: '3 Fireseeds',
        apply: (c) => {
          for (let i = 0; i < 3; i++) {
            addSpecialItem(c, { name: 'Fireseed', knownEffects: 'Explodes on impact with a hard surface' });
          }
        },
      },
    ],
  },
  tdt: {
    goldRollBonus: 10,
    // Never actually read for tdt — same reasoning as tkt above.
    weaponPool: ALL_WEAPONS,
    healingPotionLabel: 'Potion of Laumspur',
    combatPotionLabel: 'Potion of Alether',
    applyBaseEquipment: (c) => {
      addSpecialItem(c, { name: 'Map of Ghatan' });
    },
    chooseCount: 5,
    chooseOptions: [
      { id: 'sword', label: 'Sword', apply: (c) => addWeaponIfRoom(c, 'Sword') },
      { id: 'bow', label: 'Bow', apply: (c) => addWeaponIfRoom(c, 'Bow') },
      {
        id: 'quiver',
        label: 'Quiver (6 Arrows)',
        apply: (c) => {
          addSpecialItem(c, { name: 'Quiver', knownEffects: 'Holds up to 6 Arrows' });
          addArrows(c, 6);
        },
      },
      { id: 'rope', label: 'Rope', apply: (c) => addBackpackItemIfRoom(c, 'Rope') },
      { id: 'potion-of-laumspur', label: 'Potion of Laumspur', apply: (c) => grantHealingPotion(c) },
      { id: 'lantern', label: 'Lantern', apply: (c) => addBackpackItemIfRoom(c, 'Lantern') },
      { id: 'mace', label: 'Mace', apply: (c) => addWeaponIfRoom(c, 'Mace') },
      {
        id: 'meals',
        label: '3 Meals',
        apply: (c) => { for (let i = 0; i < 3; i++) addMealIfRoom(c); },
      },
      { id: 'dagger', label: 'Dagger', apply: (c) => addWeaponIfRoom(c, 'Dagger') },
      {
        id: 'potion-of-alether',
        label: 'Potion of Alether',
        apply: (c) => grantCombatPotion(c),
      },
    ],
  },
  tpt: {
    goldRollBonus: 10,
    // Never actually read for tpt — same reasoning as tkt above.
    weaponPool: ALL_WEAPONS,
    healingPotionLabel: 'Potion of Laumspur',
    // No map is granted here (unlike every other Magnakai book) — the story drops Lone Wolf
    // straight into the otherworldly Daziarn plane rather than a normal territory to traverse
    // (equipmnt.htm grants only a Backpack with 2 Meals and Gold Crowns).
    applyBaseEquipment: (c) => {
      addMealIfRoom(c);
      addMealIfRoom(c);
    },
    chooseCount: 6,
    chooseOptions: [
      { id: 'sword', label: 'Sword', apply: (c) => addWeaponIfRoom(c, 'Sword') },
      { id: 'bow', label: 'Bow', apply: (c) => addWeaponIfRoom(c, 'Bow') },
      {
        id: 'quiver',
        label: 'Quiver (6 Arrows)',
        apply: (c) => {
          addSpecialItem(c, { name: 'Quiver', knownEffects: 'Holds up to 6 Arrows' });
          addArrows(c, 6);
        },
      },
      { id: 'rope', label: 'Rope', apply: (c) => addBackpackItemIfRoom(c, 'Rope') },
      { id: 'potion-of-laumspur', label: 'Potion of Laumspur', apply: (c) => grantHealingPotion(c) },
      { id: 'lantern', label: 'Lantern', apply: (c) => addBackpackItemIfRoom(c, 'Lantern') },
      { id: 'mace', label: 'Mace', apply: (c) => addWeaponIfRoom(c, 'Mace') },
      {
        id: 'meals',
        label: '3 Meals',
        apply: (c) => { for (let i = 0; i < 3; i++) addMealIfRoom(c); },
      },
      { id: 'dagger', label: 'Dagger', apply: (c) => addWeaponIfRoom(c, 'Dagger') },
    ],
  },
  tmd: {
    goldRollBonus: 10,
    // Never actually read for tmd — same reasoning as tkt above.
    weaponPool: ALL_WEAPONS,
    healingPotionLabel: 'Potion of Laumspur',
    applyBaseEquipment: (c) => {
      addSpecialItem(c, { name: 'Map of the Darklands' });
    },
    chooseCount: 6,
    chooseOptions: [
      { id: 'sword', label: 'Sword', apply: (c) => addWeaponIfRoom(c, 'Sword') },
      { id: 'bow', label: 'Bow', apply: (c) => addWeaponIfRoom(c, 'Bow') },
      {
        id: 'quiver',
        label: 'Quiver (6 Arrows)',
        apply: (c) => {
          addSpecialItem(c, { name: 'Quiver', knownEffects: 'Holds up to 6 Arrows' });
          addArrows(c, 6);
        },
      },
      { id: 'rope', label: 'Rope', apply: (c) => addBackpackItemIfRoom(c, 'Rope') },
      { id: 'potion-of-laumspur', label: 'Potion of Laumspur', apply: (c) => grantHealingPotion(c) },
      { id: 'lantern', label: 'Lantern', apply: (c) => addBackpackItemIfRoom(c, 'Lantern') },
      { id: 'mace', label: 'Mace', apply: (c) => addWeaponIfRoom(c, 'Mace') },
      {
        id: 'meals',
        label: '4 Meals',
        apply: (c) => { for (let i = 0; i < 4; i++) addMealIfRoom(c); },
      },
      { id: 'dagger', label: 'Dagger', apply: (c) => addWeaponIfRoom(c, 'Dagger') },
      { id: 'quarterstaff', label: 'Quarterstaff', apply: (c) => addWeaponIfRoom(c, 'Quarterstaff') },
      { id: 'axe', label: 'Axe', apply: (c) => addWeaponIfRoom(c, 'Axe') },
    ],
  },
  tplr: {
    // "add 20 to the number you have picked" - higher than every prior book's +10.
    goldRollBonus: 20,
    // Never actually read for tplr — same reasoning as tkt above.
    weaponPool: ALL_WEAPONS,
    healingPotionLabel: 'Potion of Laumspur',
    // "you may now carry a maximum of ten Backpack Items" (gamerulz.htm, Book 13) - up from 8.
    maxBackpackItems: 10,
    applyBaseEquipment: (c) => {
      addSpecialItem(c, { name: 'Map of Ruel' });
    },
    chooseCount: 5,
    chooseOptions: [
      { id: 'sword', label: 'Sword', apply: (c) => addWeaponIfRoom(c, 'Sword') },
      { id: 'bow', label: 'Bow', apply: (c) => addWeaponIfRoom(c, 'Bow') },
      {
        id: 'quiver',
        label: 'Quiver (6 Arrows)',
        apply: (c) => {
          addSpecialItem(c, { name: 'Quiver', knownEffects: 'Holds up to 6 Arrows' });
          addArrows(c, 6);
        },
      },
      { id: 'axe', label: 'Axe', apply: (c) => addWeaponIfRoom(c, 'Axe') },
      {
        id: 'meals',
        label: '4 Meals',
        apply: (c) => { for (let i = 0; i < 4; i++) addMealIfRoom(c); },
      },
      { id: 'rope', label: 'Rope', apply: (c) => addBackpackItemIfRoom(c, 'Rope') },
      { id: 'potion-of-laumspur', label: 'Potion of Laumspur', apply: (c) => grantHealingPotion(c) },
      { id: 'spear', label: 'Spear', apply: (c) => addWeaponIfRoom(c, 'Spear') },
      { id: 'dagger', label: 'Dagger', apply: (c) => addWeaponIfRoom(c, 'Dagger') },
    ],
  },
  tcok: {
    // "add 20 to the number you have picked" - same as tplr.
    goldRollBonus: 20,
    // Never actually read for tcok — same reasoning as tkt above.
    weaponPool: ALL_WEAPONS,
    healingPotionLabel: 'Potion of Laumspur',
    // "you may now carry a maximum of ten Backpack Items" - unchanged from tplr, does not revert to 8.
    maxBackpackItems: 10,
    applyBaseEquipment: (c) => {
      addSpecialItem(c, { name: 'Map of the Darklands' });
    },
    chooseCount: 5,
    chooseOptions: [
      { id: 'sword', label: 'Sword', apply: (c) => addWeaponIfRoom(c, 'Sword') },
      { id: 'bow', label: 'Bow', apply: (c) => addWeaponIfRoom(c, 'Bow') },
      {
        id: 'quiver',
        label: 'Quiver (6 Arrows)',
        apply: (c) => {
          addSpecialItem(c, { name: 'Quiver', knownEffects: 'Holds up to 6 Arrows' });
          addArrows(c, 6);
        },
      },
      { id: 'axe', label: 'Axe', apply: (c) => addWeaponIfRoom(c, 'Axe') },
      {
        id: 'meals',
        label: '4 Meals',
        apply: (c) => { for (let i = 0; i < 4; i++) addMealIfRoom(c); },
      },
      { id: 'rope', label: 'Rope', apply: (c) => addBackpackItemIfRoom(c, 'Rope') },
      { id: 'potion-of-laumspur', label: 'Potion of Laumspur', apply: (c) => grantHealingPotion(c) },
      { id: 'spear', label: 'Spear', apply: (c) => addWeaponIfRoom(c, 'Spear') },
      { id: 'dagger', label: 'Dagger', apply: (c) => addWeaponIfRoom(c, 'Dagger') },
    ],
  },
  tdc: {
    // "add 20 to the number you have picked" - same as tplr/tcok.
    goldRollBonus: 20,
    // Never actually read for tdc — same reasoning as tkt above.
    weaponPool: ALL_WEAPONS,
    healingPotionLabel: 'Potion of Laumspur',
    // "maximum of ten Backpack Items" - unchanged from tplr/tcok.
    maxBackpackItems: 10,
    applyBaseEquipment: (c) => {
      addSpecialItem(c, { name: 'Map of the Western Tentarias' });
    },
    chooseCount: 5,
    chooseOptions: [
      { id: 'sword', label: 'Sword', apply: (c) => addWeaponIfRoom(c, 'Sword') },
      { id: 'bow', label: 'Bow', apply: (c) => addWeaponIfRoom(c, 'Bow') },
      {
        id: 'quiver',
        label: 'Quiver (6 Arrows)',
        apply: (c) => {
          addSpecialItem(c, { name: 'Quiver', knownEffects: 'Holds up to 6 Arrows' });
          addArrows(c, 6);
        },
      },
      { id: 'axe', label: 'Axe', apply: (c) => addWeaponIfRoom(c, 'Axe') },
      {
        id: 'meals',
        label: '4 Meals',
        apply: (c) => { for (let i = 0; i < 4; i++) addMealIfRoom(c); },
      },
      { id: 'rope', label: 'Rope', apply: (c) => addBackpackItemIfRoom(c, 'Rope') },
      { id: 'potion-of-laumspur', label: 'Potion of Laumspur', apply: (c) => grantHealingPotion(c) },
      { id: 'spear', label: 'Spear', apply: (c) => addWeaponIfRoom(c, 'Spear') },
      { id: 'dagger', label: 'Dagger', apply: (c) => addWeaponIfRoom(c, 'Dagger') },
    ],
  },
  tlv: {
    // "add 20 to the number you have picked" - same as tplr/tcok/tdc.
    goldRollBonus: 20,
    // Never actually read for tlv — same reasoning as tkt above.
    weaponPool: ALL_WEAPONS,
    healingPotionLabel: 'Potion of Laumspur',
    // "maximum of ten Backpack Items" - unchanged from tplr/tcok/tdc.
    maxBackpackItems: 10,
    applyBaseEquipment: (c) => {
      addSpecialItem(c, { name: 'Map of the Maakengorge' });
    },
    // "choose four of the following items" - tlv is the first Grand Master book with a
    // choose-four equipment list instead of choose-five (equipmnt.htm, Book 16).
    chooseCount: 4,
    chooseOptions: [
      { id: 'sword', label: 'Sword', apply: (c) => addWeaponIfRoom(c, 'Sword') },
      { id: 'bow', label: 'Bow', apply: (c) => addWeaponIfRoom(c, 'Bow') },
      {
        id: 'quiver',
        label: 'Quiver (6 Arrows)',
        apply: (c) => {
          addSpecialItem(c, { name: 'Quiver', knownEffects: 'Holds up to 6 Arrows' });
          addArrows(c, 6);
        },
      },
      { id: 'axe', label: 'Axe', apply: (c) => addWeaponIfRoom(c, 'Axe') },
      {
        id: 'meals',
        label: '2 Meals',
        apply: (c) => { for (let i = 0; i < 2; i++) addMealIfRoom(c); },
      },
      { id: 'rope', label: 'Rope', apply: (c) => addBackpackItemIfRoom(c, 'Rope') },
      { id: 'potion-of-laumspur', label: 'Potion of Laumspur', apply: (c) => grantHealingPotion(c) },
      { id: 'quarterstaff', label: 'Quarterstaff', apply: (c) => addWeaponIfRoom(c, 'Quarterstaff') },
      { id: 'dagger', label: 'Dagger', apply: (c) => addWeaponIfRoom(c, 'Dagger') },
    ],
  },
  tdi: {
    // "add 20 to the number you have picked" - same as tplr/tcok/tdc/tlv.
    goldRollBonus: 20,
    // Never actually read for tdi — same reasoning as tkt above.
    weaponPool: ALL_WEAPONS,
    healingPotionLabel: 'Potion of Laumspur',
    // "maximum of ten Backpack Items" - unchanged from tplr/tcok/tdc/tlv.
    maxBackpackItems: 10,
    applyBaseEquipment: (c) => {
      addSpecialItem(c, { name: 'Map of Ixia and the Hardlands' });
    },
    chooseCount: 4,
    chooseOptions: [
      // "Broadsword" replaces tlv's Quarterstaff - never offered as a choosable starting weapon
      // before this book (equipmnt.htm, Book 17).
      { id: 'broadsword', label: 'Broadsword', apply: (c) => addWeaponIfRoom(c, 'Broadsword') },
      { id: 'bow', label: 'Bow', apply: (c) => addWeaponIfRoom(c, 'Bow') },
      {
        id: 'quiver',
        label: 'Quiver (6 Arrows)',
        apply: (c) => {
          addSpecialItem(c, { name: 'Quiver', knownEffects: 'Holds up to 6 Arrows' });
          addArrows(c, 6);
        },
      },
      { id: 'dagger', label: 'Dagger', apply: (c) => addWeaponIfRoom(c, 'Dagger') },
      { id: 'sword', label: 'Sword', apply: (c) => addWeaponIfRoom(c, 'Sword') },
      {
        id: 'meals',
        label: '2 Meals',
        apply: (c) => { for (let i = 0; i < 2; i++) addMealIfRoom(c); },
      },
      { id: 'rope', label: 'Rope', apply: (c) => addBackpackItemIfRoom(c, 'Rope') },
      { id: 'potion-of-laumspur', label: 'Potion of Laumspur', apply: (c) => grantHealingPotion(c) },
      { id: 'axe', label: 'Axe', apply: (c) => addWeaponIfRoom(c, 'Axe') },
    ],
  },
  dd: {
    // "add 20 to the number you have picked" - same as tplr/tcok/tdc/tlv/tdi.
    goldRollBonus: 20,
    // Never actually read for dd — same reasoning as tkt above.
    weaponPool: ALL_WEAPONS,
    healingPotionLabel: 'Potion of Laumspur',
    // "maximum of ten Backpack Items" - unchanged from tplr/tcok/tdc/tlv/tdi.
    maxBackpackItems: 10,
    applyBaseEquipment: (c) => {
      addSpecialItem(c, { name: 'Map of Northern Magnamund' });
    },
    chooseCount: 4,
    chooseOptions: [
      // Quarterstaff is back (equipmnt.htm, Book 18) - tdi's Broadsword was a one-book swap, not a
      // permanent replacement.
      { id: 'quarterstaff', label: 'Quarterstaff', apply: (c) => addWeaponIfRoom(c, 'Quarterstaff') },
      { id: 'bow', label: 'Bow', apply: (c) => addWeaponIfRoom(c, 'Bow') },
      {
        id: 'quiver',
        label: 'Quiver (6 Arrows)',
        apply: (c) => {
          addSpecialItem(c, { name: 'Quiver', knownEffects: 'Holds up to 6 Arrows' });
          addArrows(c, 6);
        },
      },
      { id: 'dagger', label: 'Dagger', apply: (c) => addWeaponIfRoom(c, 'Dagger') },
      { id: 'sword', label: 'Sword', apply: (c) => addWeaponIfRoom(c, 'Sword') },
      {
        id: 'meals',
        label: '2 Meals',
        apply: (c) => { for (let i = 0; i < 2; i++) addMealIfRoom(c); },
      },
      { id: 'rope', label: 'Rope', apply: (c) => addBackpackItemIfRoom(c, 'Rope') },
      { id: 'potion-of-laumspur', label: 'Potion of Laumspur', apply: (c) => grantHealingPotion(c) },
      { id: 'axe', label: 'Axe', apply: (c) => addWeaponIfRoom(c, 'Axe') },
    ],
  },
  wb: {
    // "add 20 to the number you have picked" - same as tplr/tcok/tdc/tlv/tdi/dd.
    goldRollBonus: 20,
    // Never actually read for wb — same reasoning as tkt above.
    weaponPool: ALL_WEAPONS,
    healingPotionLabel: 'Potion of Laumspur',
    // "maximum of ten Backpack Items" - unchanged from tplr/tcok/tdc/tlv/tdi/dd.
    maxBackpackItems: 10,
    applyBaseEquipment: (c) => {
      addSpecialItem(c, { name: 'Map of Sommerlund and the Wildlands' });
    },
    chooseCount: 4,
    chooseOptions: [
      // Broadsword is back (equipmnt.htm, Book 19) - dd's Quarterstaff was a one-book swap, same
      // alternation pattern as Book 17/18.
      { id: 'broadsword', label: 'Broadsword', apply: (c) => addWeaponIfRoom(c, 'Broadsword') },
      { id: 'bow', label: 'Bow', apply: (c) => addWeaponIfRoom(c, 'Bow') },
      {
        id: 'quiver',
        label: 'Quiver (6 Arrows)',
        apply: (c) => {
          addSpecialItem(c, { name: 'Quiver', knownEffects: 'Holds up to 6 Arrows' });
          addArrows(c, 6);
        },
      },
      { id: 'dagger', label: 'Dagger', apply: (c) => addWeaponIfRoom(c, 'Dagger') },
      { id: 'sword', label: 'Sword', apply: (c) => addWeaponIfRoom(c, 'Sword') },
      {
        id: 'meals',
        label: '2 Meals',
        apply: (c) => { for (let i = 0; i < 2; i++) addMealIfRoom(c); },
      },
      { id: 'rope', label: 'Rope', apply: (c) => addBackpackItemIfRoom(c, 'Rope') },
      { id: 'potion-of-laumspur', label: 'Potion of Laumspur', apply: (c) => grantHealingPotion(c) },
      { id: 'axe', label: 'Axe', apply: (c) => addWeaponIfRoom(c, 'Axe') },
    ],
  },
  tcn: {
    // "add 20 to the number you have picked" - same as tplr/tcok/tdc/tlv/tdi/dd/wb.
    goldRollBonus: 20,
    // Never actually read for tcn — same reasoning as tkt above.
    weaponPool: ALL_WEAPONS,
    healingPotionLabel: 'Potion of Laumspur',
    // "maximum of ten Backpack Items" - unchanged from tplr/tcok/tdc/tlv/tdi/dd/wb.
    maxBackpackItems: 10,
    applyBaseEquipment: (c) => {
      addSpecialItem(c, { name: 'Map of the Planes of Existence' });
    },
    chooseCount: 4,
    chooseOptions: [
      // First book to offer Quarterstaff and Broadsword together (equipmnt.htm, Book 20) - Books
      // 17-19 alternated between the two, never both at once.
      { id: 'quarterstaff', label: 'Quarterstaff', apply: (c) => addWeaponIfRoom(c, 'Quarterstaff') },
      { id: 'broadsword', label: 'Broadsword', apply: (c) => addWeaponIfRoom(c, 'Broadsword') },
      { id: 'bow', label: 'Bow', apply: (c) => addWeaponIfRoom(c, 'Bow') },
      {
        id: 'quiver',
        label: 'Quiver (6 Arrows)',
        apply: (c) => {
          addSpecialItem(c, { name: 'Quiver', knownEffects: 'Holds up to 6 Arrows' });
          addArrows(c, 6);
        },
      },
      { id: 'dagger', label: 'Dagger', apply: (c) => addWeaponIfRoom(c, 'Dagger') },
      { id: 'sword', label: 'Sword', apply: (c) => addWeaponIfRoom(c, 'Sword') },
      {
        id: 'meals',
        label: '2 Meals',
        apply: (c) => { for (let i = 0; i < 2; i++) addMealIfRoom(c); },
      },
      { id: 'rope', label: 'Rope', apply: (c) => addBackpackItemIfRoom(c, 'Rope') },
      { id: 'potion-of-laumspur', label: 'Potion of Laumspur', apply: (c) => grantHealingPotion(c) },
      { id: 'axe', label: 'Axe', apply: (c) => addWeaponIfRoom(c, 'Axe') },
    ],
  },
  vm: {
    // "add 20 to the number you have picked" - same as every Grand Master-era book.
    goldRollBonus: 20,
    // Never actually read for vm — same reasoning as tkt above.
    weaponPool: ALL_WEAPONS,
    healingPotionLabel: 'Potion of Laumspur',
    // "you may keep a maximum of ten articles, including Meals, in your Backpack" - unchanged.
    maxBackpackItems: 10,
    applyBaseEquipment: (c) => {
      addSpecialItem(c, { name: 'Map of the Coastal Route' });
    },
    // "You may also select five items from the list below, only two of which may be Weapons"
    // (equipmnt.htm, Book 21) - same choose-five shape as Books 13-15, but from a 10-item list
    // (Flute is new; Quarterstaff and Broadsword appear together, same as tcn).
    chooseCount: 5,
    chooseOptions: [
      { id: 'quarterstaff', label: 'Quarterstaff', apply: (c) => addWeaponIfRoom(c, 'Quarterstaff') },
      { id: 'bow', label: 'Bow', apply: (c) => addWeaponIfRoom(c, 'Bow') },
      {
        id: 'quiver',
        label: 'Quiver (6 Arrows)',
        apply: (c) => {
          addSpecialItem(c, { name: 'Quiver', knownEffects: 'Holds up to 6 Arrows' });
          addArrows(c, 6);
        },
      },
      { id: 'flute', label: 'Flute', apply: (c) => addBackpackItemIfRoom(c, 'Flute') },
      { id: 'dagger', label: 'Dagger', apply: (c) => addWeaponIfRoom(c, 'Dagger') },
      { id: 'sword', label: 'Sword', apply: (c) => addWeaponIfRoom(c, 'Sword') },
      {
        id: 'meals',
        label: '2 Meals',
        apply: (c) => { for (let i = 0; i < 2; i++) addMealIfRoom(c); },
      },
      { id: 'rope', label: 'Rope', apply: (c) => addBackpackItemIfRoom(c, 'Rope') },
      { id: 'potion-of-laumspur', label: 'Potion of Laumspur', apply: (c) => grantHealingPotion(c) },
      { id: 'axe', label: 'Axe', apply: (c) => addWeaponIfRoom(c, 'Axe') },
    ],
    // Kai Weapon Table (equipmnt.htm, Book 21) - a base +5 CS while equipped, in addition to the
    // Grand Weaponmastery bonus if the type matches; the situational +6 to +9 CS bonus per weapon
    // (vs. a specific enemy type/condition) is documented but not implemented (no engine hook for
    // enemy-type/condition matching).
    kaiWeaponTable: [
      { name: 'Spawnsmite', weaponType: 'Axe' },
      { name: 'Alema', weaponType: 'Axe' },
      { name: 'Magnara', weaponType: 'Axe' },
      { name: 'Sunstrike', weaponType: 'Sword' },
      { name: 'Kaistar', weaponType: 'Sword' },
      { name: 'Valiance', weaponType: 'Sword' },
      { name: 'Ulnarias', weaponType: 'Sword' },
      { name: 'Raumas', weaponType: 'Broadsword' },
      { name: 'Illuminatus', weaponType: 'Broadsword' },
      { name: 'Firefall', weaponType: 'Broadsword' },
    ],
  },
  tbs: {
    // "add 20 to the number you have picked" - same as every Grand Master-era/New Order book.
    goldRollBonus: 20,
    // Never actually read for tbs — same reasoning as tkt above.
    weaponPool: ALL_WEAPONS,
    healingPotionLabel: 'Potion of Laumspur',
    // "you may keep a maximum of ten articles, including Meals, in your Backpack" - unchanged.
    maxBackpackItems: 10,
    applyBaseEquipment: (c) => {
      addSpecialItem(c, { name: 'Map of Southeastern Magnamund' });
    },
    // Same choose-five, 10-item list as vm (Book 21) - confirmed byte-identical in equipmnt.htm.
    chooseCount: 5,
    chooseOptions: [
      { id: 'quarterstaff', label: 'Quarterstaff', apply: (c) => addWeaponIfRoom(c, 'Quarterstaff') },
      { id: 'bow', label: 'Bow', apply: (c) => addWeaponIfRoom(c, 'Bow') },
      {
        id: 'quiver',
        label: 'Quiver (6 Arrows)',
        apply: (c) => {
          addSpecialItem(c, { name: 'Quiver', knownEffects: 'Holds up to 6 Arrows' });
          addArrows(c, 6);
        },
      },
      { id: 'flute', label: 'Flute', apply: (c) => addBackpackItemIfRoom(c, 'Flute') },
      { id: 'dagger', label: 'Dagger', apply: (c) => addWeaponIfRoom(c, 'Dagger') },
      { id: 'sword', label: 'Sword', apply: (c) => addWeaponIfRoom(c, 'Sword') },
      {
        id: 'meals',
        label: '2 Meals',
        apply: (c) => { for (let i = 0; i < 2; i++) addMealIfRoom(c); },
      },
      { id: 'rope', label: 'Rope', apply: (c) => addBackpackItemIfRoom(c, 'Rope') },
      { id: 'potion-of-laumspur', label: 'Potion of Laumspur', apply: (c) => grantHealingPotion(c) },
      { id: 'axe', label: 'Axe', apply: (c) => addWeaponIfRoom(c, 'Axe') },
    ],
    // Same Kai Weapon Table as vm (Book 21) - confirmed byte-identical (same 10 named weapons, same
    // order) in equipmnt.htm. A carried-over character already has one and skips this step - see the
    // needsKaiWeapon fix in CharacterCreationScreen.tsx.
    kaiWeaponTable: [
      { name: 'Spawnsmite', weaponType: 'Axe' },
      { name: 'Alema', weaponType: 'Axe' },
      { name: 'Magnara', weaponType: 'Axe' },
      { name: 'Sunstrike', weaponType: 'Sword' },
      { name: 'Kaistar', weaponType: 'Sword' },
      { name: 'Valiance', weaponType: 'Sword' },
      { name: 'Ulnarias', weaponType: 'Sword' },
      { name: 'Raumas', weaponType: 'Broadsword' },
      { name: 'Illuminatus', weaponType: 'Broadsword' },
      { name: 'Firefall', weaponType: 'Broadsword' },
    ],
  },
  mh: {
    // "add 20 to the number you have picked" - same as every Grand Master-era/New Order book.
    goldRollBonus: 20,
    // Never actually read for mh — same reasoning as tkt above.
    weaponPool: ALL_WEAPONS,
    healingPotionLabel: 'Potion of Laumspur',
    // "you may keep a maximum of ten articles, including Meals, in your Backpack" - unchanged.
    maxBackpackItems: 10,
    applyBaseEquipment: (c) => {
      addSpecialItem(c, { name: 'Map of Central Southern Magnamund' });
    },
    // Same choose-five, 10-item list as vm/tbs (Books 21-22) - confirmed byte-identical in equipmnt.htm.
    chooseCount: 5,
    chooseOptions: [
      { id: 'quarterstaff', label: 'Quarterstaff', apply: (c) => addWeaponIfRoom(c, 'Quarterstaff') },
      { id: 'bow', label: 'Bow', apply: (c) => addWeaponIfRoom(c, 'Bow') },
      {
        id: 'quiver',
        label: 'Quiver (6 Arrows)',
        apply: (c) => {
          addSpecialItem(c, { name: 'Quiver', knownEffects: 'Holds up to 6 Arrows' });
          addArrows(c, 6);
        },
      },
      { id: 'flute', label: 'Flute', apply: (c) => addBackpackItemIfRoom(c, 'Flute') },
      { id: 'dagger', label: 'Dagger', apply: (c) => addWeaponIfRoom(c, 'Dagger') },
      { id: 'sword', label: 'Sword', apply: (c) => addWeaponIfRoom(c, 'Sword') },
      {
        id: 'meals',
        label: '2 Meals',
        apply: (c) => { for (let i = 0; i < 2; i++) addMealIfRoom(c); },
      },
      { id: 'rope', label: 'Rope', apply: (c) => addBackpackItemIfRoom(c, 'Rope') },
      { id: 'potion-of-laumspur', label: 'Potion of Laumspur', apply: (c) => grantHealingPotion(c) },
      { id: 'axe', label: 'Axe', apply: (c) => addWeaponIfRoom(c, 'Axe') },
    ],
    // Same Kai Weapon Table as vm/tbs (Books 21-22) - confirmed byte-identical (same 10 named
    // weapons, same order) in equipmnt.htm. A carried-over character already has one and skips this
    // step - see the needsKaiWeapon fix in CharacterCreationScreen.tsx.
    kaiWeaponTable: [
      { name: 'Spawnsmite', weaponType: 'Axe' },
      { name: 'Alema', weaponType: 'Axe' },
      { name: 'Magnara', weaponType: 'Axe' },
      { name: 'Sunstrike', weaponType: 'Sword' },
      { name: 'Kaistar', weaponType: 'Sword' },
      { name: 'Valiance', weaponType: 'Sword' },
      { name: 'Ulnarias', weaponType: 'Sword' },
      { name: 'Raumas', weaponType: 'Broadsword' },
      { name: 'Illuminatus', weaponType: 'Broadsword' },
      { name: 'Firefall', weaponType: 'Broadsword' },
    ],
  },
  rw: {
    // "add 20 to the number you have picked" - same as every Grand Master-era/New Order book.
    goldRollBonus: 20,
    // Never actually read for rw — same reasoning as tkt above.
    weaponPool: ALL_WEAPONS,
    healingPotionLabel: 'Potion of Laumspur',
    // "you may keep a maximum of ten articles, including Meals, in your Backpack" - unchanged.
    maxBackpackItems: 10,
    applyBaseEquipment: (c) => {
      addSpecialItem(c, { name: 'Map of the Stornlands' });
    },
    // Choose-five, 10-item list - first genuine change since vm (Book 21): Quarterstaff is swapped
    // for Broadsword and Flute for Lute (same categories, same non-effect - Lute is a plain Backpack
    // Item exactly like every Flute before it). Everything else (count, gold bonus, Kai Weapon table)
    // is unchanged from tbs/mh.
    chooseCount: 5,
    chooseOptions: [
      { id: 'axe', label: 'Axe', apply: (c) => addWeaponIfRoom(c, 'Axe') },
      { id: 'sword', label: 'Sword', apply: (c) => addWeaponIfRoom(c, 'Sword') },
      {
        id: 'quiver',
        label: 'Quiver (6 Arrows)',
        apply: (c) => {
          addSpecialItem(c, { name: 'Quiver', knownEffects: 'Holds up to 6 Arrows' });
          addArrows(c, 6);
        },
      },
      { id: 'lute', label: 'Lute', apply: (c) => addBackpackItemIfRoom(c, 'Lute') },
      { id: 'dagger', label: 'Dagger', apply: (c) => addWeaponIfRoom(c, 'Dagger') },
      { id: 'bow', label: 'Bow', apply: (c) => addWeaponIfRoom(c, 'Bow') },
      {
        id: 'meals',
        label: '2 Meals',
        apply: (c) => { for (let i = 0; i < 2; i++) addMealIfRoom(c); },
      },
      { id: 'rope', label: 'Rope', apply: (c) => addBackpackItemIfRoom(c, 'Rope') },
      { id: 'potion-of-laumspur', label: 'Potion of Laumspur', apply: (c) => grantHealingPotion(c) },
      { id: 'broadsword', label: 'Broadsword', apply: (c) => addWeaponIfRoom(c, 'Broadsword') },
    ],
    // Same Kai Weapon Table as vm/tbs/mh (Books 21-23) - confirmed byte-identical (same 10 named
    // weapons, same order) in equipmnt.htm. A carried-over character already has one and skips this
    // step - see the needsKaiWeapon fix in CharacterCreationScreen.tsx.
    kaiWeaponTable: [
      { name: 'Spawnsmite', weaponType: 'Axe' },
      { name: 'Alema', weaponType: 'Axe' },
      { name: 'Magnara', weaponType: 'Axe' },
      { name: 'Sunstrike', weaponType: 'Sword' },
      { name: 'Kaistar', weaponType: 'Sword' },
      { name: 'Valiance', weaponType: 'Sword' },
      { name: 'Ulnarias', weaponType: 'Sword' },
      { name: 'Raumas', weaponType: 'Broadsword' },
      { name: 'Illuminatus', weaponType: 'Broadsword' },
      { name: 'Firefall', weaponType: 'Broadsword' },
    ],
  },
};

export function getBookEquipment(bookId: string): BookEquipmentConfig {
  const config = BOOK_EQUIPMENT[bookId];
  if (!config) throw new Error(`No equipment config for book: ${bookId}`);
  return config;
}

export function getMaxBackpackItems(bookId: string): number {
  return getBookEquipment(bookId).maxBackpackItems ?? MAX_BACKPACK_ITEMS;
}
