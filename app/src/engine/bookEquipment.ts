import type { ActionChart, SpecialItem, WeaponType } from './types';
import { ALL_WEAPONS, MAX_BACKPACK_ITEMS, MAX_WEAPONS } from './types';

export interface EquipmentOption {
  id: string;
  label: string;
  apply: (chart: ActionChart) => void;
}

export interface BookEquipmentConfig {
  /** Added on top of the random(0-9) gold roll every book grants at its equipment stage. */
  goldRollBonus: number;
  /** Weapon pool this book's Weaponskill discipline may randomly assign. */
  weaponPool: WeaponType[];
  /** Display name for this book's post-combat healing item (mechanically always +4 Endurance, one dose). */
  healingPotionLabel: string;
  /** Some books (e.g. Kalte's icy wastes) explicitly disable Hunting's no-Meal-needed exemption. */
  huntingDisabled?: boolean;
  /** Items every character gets regardless of how equipment is chosen (fixed narrative grants). */
  applyBaseEquipment: (chart: ActionChart) => void;
  /** For books with equipmentMode 'random-one': roll 0-9, apply exactly one matching option. */
  randomTable?: Record<number, EquipmentOption>;
  /** For books with equipmentMode 'choose-two': the player picks exactly two of these. */
  chooseOptions?: EquipmentOption[];
}

function addWeaponIfRoom(chart: ActionChart, weapon: WeaponType) {
  if (chart.weapons.length >= MAX_WEAPONS) return;
  chart.weapons.push(weapon);
  if (!chart.equippedWeapon) chart.equippedWeapon = weapon;
}

/** Backpack Items and Meals share the same 8-slot cap. */
function hasBackpackRoom(chart: ActionChart): boolean {
  return chart.backpackItems.length + chart.meals < MAX_BACKPACK_ITEMS;
}

function addMealIfRoom(chart: ActionChart) {
  if (!hasBackpackRoom(chart)) return;
  chart.meals += 1;
}

function addSpecialItem(chart: ActionChart, item: SpecialItem) {
  chart.specialItems.push(item);
}

/** A freshly acquired healing potion is always usable, even if a previous one was already drunk. */
function grantHealingPotion(chart: ActionChart) {
  chart.hasHealingPotion = true;
  chart.hasHealingPotionUsed = false;
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
      6: { id: 'healing-potion', label: 'Healing Potion', apply: grantHealingPotion },
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
      { id: 'healing-potion', label: 'Healing Potion', apply: grantHealingPotion },
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
    // a Meal" (equipmnt.htm) - the usual no-Meal-needed exemption doesn't apply in this book.
    huntingDisabled: true,
    applyBaseEquipment: (c) => {
      addSpecialItem(c, { name: 'Map of Kalte' });
    },
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
      { id: 'potion-of-laumspur', label: 'Potion of Laumspur', apply: grantHealingPotion },
      { id: 'quarterstaff', label: 'Quarterstaff', apply: (c) => addWeaponIfRoom(c, 'Quarterstaff') },
      { id: 'special-rations', label: 'Special Rations', apply: (c) => addMealIfRoom(c) },
      { id: 'broadsword', label: 'Broadsword', apply: (c) => addWeaponIfRoom(c, 'Broadsword') },
    ],
  },
};

export function getBookEquipment(bookId: string): BookEquipmentConfig {
  const config = BOOK_EQUIPMENT[bookId];
  if (!config) throw new Error(`No equipment config for book: ${bookId}`);
  return config;
}
