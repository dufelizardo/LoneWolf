export interface Choice {
  text: string;
  targetSection: number;
}

export interface CombatEncounter {
  enemyName: string;
  combatSkill: number;
  endurance: number;
}

export interface RandomRange {
  min: number;
  max: number;
  targetSection: number;
}

export interface Section {
  number: number;
  bodyHtml: string;
  illustrations: string[];
  combats: CombatEncounter[];
  choices: Choice[];
  isDeadEnd: boolean;
  isEnding: boolean;
  randomNumberBranch: boolean;
  ranges: RandomRange[] | null;
  parserWarning: string | null;
}

export type SectionMap = Record<number, Section>;
