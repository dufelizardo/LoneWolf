import { SAVE_VERSION, createEmptyCampaign, type ActionChart, type CampaignProgress, type SaveGame } from './types';

const STORAGE_KEY = 'lonewolf-save';
const CLOUD_CODE_KEY = 'lonewolf-cloud-code';

export function saveGame(campaign: CampaignProgress, chart: ActionChart | null): void {
  const save: SaveGame = { saveVersion: SAVE_VERSION, campaign, chart };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
}

export function loadGame(): SaveGame | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const save = JSON.parse(raw) as SaveGame;
    if (save.saveVersion !== SAVE_VERSION) return null;
    return save;
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
export async function saveGameToCloud(
  campaign: CampaignProgress,
  chart: ActionChart | null,
  code?: string | null,
): Promise<string> {
  const save: SaveGame = { saveVersion: SAVE_VERSION, campaign, chart };
  const response = code
    ? await fetch(`/api/saves/${code}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(save),
      })
    : await fetch('/api/saves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(save),
      });

  if (!response.ok) {
    throw new Error(`Cloud save failed (${response.status})`);
  }

  const resultCode = code ?? ((await response.json()) as { code: string }).code;
  localStorage.setItem(CLOUD_CODE_KEY, resultCode);
  return resultCode;
}

export async function loadGameFromCloud(code: string): Promise<SaveGame | null> {
  const response = await fetch(`/api/saves/${code}`);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Cloud load failed (${response.status})`);
  }
  const { chart: stored } = (await response.json()) as { chart: unknown };
  const save = stored as SaveGame;
  if (!save || save.saveVersion !== SAVE_VERSION) return null;
  localStorage.setItem(CLOUD_CODE_KEY, code);
  return save;
}

export function newCampaign(): CampaignProgress {
  return createEmptyCampaign();
}
