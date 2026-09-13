import type { ActionChart, WeaponType } from './types';
import { MAX_BACKPACK_ITEMS, MAX_WEAPONS } from './types';

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

function addBackpackItemIfRoom(chart: ActionChart, item: string) {
  if (chart.backpackItems.length >= MAX_BACKPACK_ITEMS) return;
  chart.backpackItems.push(item);
}

export const BOOK_EQUIPMENT: Record<string, BookEquipmentConfig> = {
  ft: {
    goldRollBonus: 0,
    weaponPool: ['Axe', 'Sword', 'Mace', 'Quarterstaff', 'Spear', 'Broadsword'],
    applyBaseEquipment: (c) => {
      addWeaponIfRoom(c, 'Axe');
      addBackpackItemIfRoom(c, 'Meal');
      c.specialItems.push('Map of Sommerlund');
    },
    randomTable: {
      1: { id: 'sword', label: 'Sword', apply: (c) => addWeaponIfRoom(c, 'Sword') },
      2: {
        id: 'helmet',
        label: 'Helmet (+2 Endurance)',
        apply: (c) => {
          c.specialItems.push('Helmet');
          c.enduranceMax += 2;
          c.enduranceCurrent += 2;
        },
      },
      3: { id: 'two-meals', label: 'Two Meals', apply: (c) => { addBackpackItemIfRoom(c, 'Meal'); addBackpackItemIfRoom(c, 'Meal'); } },
      4: {
        id: 'chainmail',
        label: 'Chainmail Waistcoat (+4 Endurance)',
        apply: (c) => {
          c.specialItems.push('Chainmail Waistcoat');
          c.enduranceMax += 4;
          c.enduranceCurrent += 4;
        },
      },
      5: { id: 'mace', label: 'Mace', apply: (c) => addWeaponIfRoom(c, 'Mace') },
      6: { id: 'healing-potion', label: 'Healing Potion', apply: (c) => { c.hasHealingPotion = true; } },
      7: { id: 'quarterstaff', label: 'Quarterstaff', apply: (c) => addWeaponIfRoom(c, 'Quarterstaff') },
      8: { id: 'spear', label: 'Spear', apply: (c) => addWeaponIfRoom(c, 'Spear') },
      9: { id: 'gold-12', label: '12 Gold Crowns', apply: (c) => { c.goldCrowns += 12; } },
      0: { id: 'broadsword', label: 'Broadsword', apply: (c) => addWeaponIfRoom(c, 'Broadsword') },
    },
  },
  fa: {
    goldRollBonus: 10,
    weaponPool: ['Sword', 'ShortSword', 'Mace', 'Quarterstaff', 'Spear', 'Broadsword'],
    applyBaseEquipment: (c) => {
      c.specialItems.push('Map', 'Seal of Hammerdal');
    },
    chooseOptions: [
      { id: 'sword', label: 'Sword', apply: (c) => addWeaponIfRoom(c, 'Sword') },
      { id: 'short-sword', label: 'Short Sword', apply: (c) => addWeaponIfRoom(c, 'ShortSword') },
      { id: 'two-meals', label: 'Two Meals', apply: (c) => { addBackpackItemIfRoom(c, 'Meal'); addBackpackItemIfRoom(c, 'Meal'); } },
      {
        id: 'chainmail',
        label: 'Chainmail Waistcoat (+4 Endurance)',
        apply: (c) => {
          c.specialItems.push('Chainmail Waistcoat');
          c.enduranceMax += 4;
          c.enduranceCurrent += 4;
        },
      },
      { id: 'mace', label: 'Mace', apply: (c) => addWeaponIfRoom(c, 'Mace') },
      { id: 'healing-potion', label: 'Healing Potion', apply: (c) => { c.hasHealingPotion = true; } },
      { id: 'quarterstaff', label: 'Quarterstaff', apply: (c) => addWeaponIfRoom(c, 'Quarterstaff') },
      { id: 'spear', label: 'Spear', apply: (c) => addWeaponIfRoom(c, 'Spear') },
      {
        id: 'shield',
        label: 'Shield (+2 Combat Skill in combat)',
        apply: (c) => {
          c.specialItems.push('Shield');
        },
      },
      { id: 'broadsword', label: 'Broadsword', apply: (c) => addWeaponIfRoom(c, 'Broadsword') },
    ],
  },
};

export function getBookEquipment(bookId: string): BookEquipmentConfig {
  const config = BOOK_EQUIPMENT[bookId];
  if (!config) throw new Error(`No equipment config for book: ${bookId}`);
  return config;
}
