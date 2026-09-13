import { SAVE_VERSION, type ActionChart, type SaveGame } from './types';

const STORAGE_KEY = 'lonewolf-save';
const CLOUD_CODE_KEY = 'lonewolf-cloud-code';

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

export function getLastCloudCode(): string | null {
  return localStorage.getItem(CLOUD_CODE_KEY);
}

/** Saves to the server. Creates a new save code the first time, or updates the existing one. */
export async function saveGameToCloud(chart: ActionChart, code?: string | null): Promise<string> {
  const response = code
    ? await fetch(`/api/saves/${code}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chart),
      })
    : await fetch('/api/saves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chart),
      });

  if (!response.ok) {
    throw new Error(`Cloud save failed (${response.status})`);
  }

  const resultCode = code ?? ((await response.json()) as { code: string }).code;
  localStorage.setItem(CLOUD_CODE_KEY, resultCode);
  return resultCode;
}

export async function loadGameFromCloud(code: string): Promise<ActionChart | null> {
  const response = await fetch(`/api/saves/${code}`);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Cloud load failed (${response.status})`);
  }
  const { chart } = (await response.json()) as { chart: ActionChart };
  localStorage.setItem(CLOUD_CODE_KEY, code);
  return chart;
}
