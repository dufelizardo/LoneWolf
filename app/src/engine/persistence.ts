import { SAVE_VERSION, type ActionChart, type SaveGame } from './types';

const STORAGE_KEY = 'lonewolf-save';

export function saveGame(chart: ActionChart): void {
  const save: SaveGame = { saveVersion: SAVE_VERSION, chart };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
}

export function loadGame(): ActionChart | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const save = JSON.parse(raw) as SaveGame;
    if (save.saveVersion !== SAVE_VERSION) return null;
    return save.chart;
  } catch {
    return null;
  }
}

export function clearSave(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function hasSave(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}
