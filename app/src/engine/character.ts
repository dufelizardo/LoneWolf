import { rollRandomNumber, type Rng } from './rng';
import {
  ALL_WEAPONS,
  type ActionChart,
  type Discipline,
  type WeaponType,
} from './types';

export interface EquipmentRoll {
  extraItemRoll: number;
  description: string;
}

const BONUS_EQUIPMENT_TABLE: Record<
  number,
  { apply: (chart: ActionChart) => void; description: string }
> = {
  1: {
    description: 'Sword',
    apply: (c) => {
      c.weapons.push('Sword');
    },
  },
  2: {
    description: 'Helmet (+2 Endurance)',
    apply: (c) => {
      c.specialItems.push('Helmet');
      c.enduranceMax += 2;
      c.enduranceCurrent += 2;
    },
  },
  3: {
    description: 'Two Meals',
    apply: (c) => {
      c.backpackItems.push('Meal', 'Meal');
    },
  },
  4: {
    description: 'Chainmail Waistcoat (+4 Endurance)',
    apply: (c) => {
      c.specialItems.push('Chainmail Waistcoat');
      c.enduranceMax += 4;
      c.enduranceCurrent += 4;
    },
  },
  5: {
    description: 'Mace',
    apply: (c) => {
      c.weapons.push('Mace');
    },
  },
  6: {
    description: 'Healing Potion',
    apply: (c) => {
      c.hasHealingPotion = true;
    },
  },
  7: {
    description: 'Quarterstaff',
    apply: (c) => {
      c.weapons.push('Quarterstaff');
    },
  },
  8: {
    description: 'Spear',
    apply: (c) => {
      c.weapons.push('Spear');
    },
  },
  9: {
    description: '12 Gold Crowns',
    apply: (c) => {
      c.goldCrowns += 12;
    },
  },
  0: {
    description: 'Broadsword',
    apply: (c) => {
      c.weapons.push('Broadsword');
    },
  },
};

/** Creates a fresh character with rolled stats and starting equipment, before Kai Discipline selection. */
export function createCharacter(rng: Rng = Math.random): ActionChart {
  const combatSkill = rollRandomNumber(rng) + 10;
  const enduranceRoll = rollRandomNumber(rng) + 20;

  const chart: ActionChart = {
    combatSkill,
    enduranceMax: enduranceRoll,
    enduranceCurrent: enduranceRoll,
    disciplines: [],
    weaponskillWeapon: null,
    weapons: ['Axe'],
    equippedWeapon: 'Axe',
    backpackItems: ['Meal'],
    specialItems: ['Map of Sommerlund'],
    goldCrowns: rollRandomNumber(rng),
    hasHealingPotion: false,
    hasHealingPotionUsed: false,
    currentSection: 1,
    visitedSections: [],
    isAlive: true,
  };

  const bonusRoll = rollRandomNumber(rng);
  BONUS_EQUIPMENT_TABLE[bonusRoll].apply(chart);

  return chart;
}

/** Applies the player's chosen 5 Kai Disciplines, rolling a random weapon for Weaponskill if picked. */
export function applyDisciplines(chart: ActionChart, disciplines: Discipline[], rng: Rng = Math.random): ActionChart {
  if (disciplines.length !== 5) {
    throw new Error(`Expected exactly 5 disciplines, got ${disciplines.length}`);
  }
  const next: ActionChart = { ...chart, disciplines: [...disciplines] };
  if (disciplines.includes('Weaponskill')) {
    const index = rollRandomNumber(rng) % ALL_WEAPONS.length;
    next.weaponskillWeapon = ALL_WEAPONS[index] as WeaponType;
  }
  return next;
}
