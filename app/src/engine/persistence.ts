import { SAVE_VERSION, createEmptyCampaign, type ActionChart, type CampaignProgress, type SaveGame } from './types';
import type { GreyStarActionChart } from './greyStarTypes';

const STORAGE_KEY = 'lonewolf-save';
const CLOUD_CODE_KEY = 'lonewolf-cloud-code';

type Chart = ActionChart | GreyStarActionChart | null;

export function saveGame(campaign: CampaignProgress, chart: Chart): void {
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
  chart: Chart,
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

/** Serializes the current save state to the same JSON shape used everywhere else (localStorage, cloud). Pure/testable — no DOM or I/O. */
export function serializeSave(campaign: CampaignProgress, chart: Chart): string {
  const save: SaveGame = { saveVersion: SAVE_VERSION, campaign, chart };
  return JSON.stringify(save, null, 2);
}

/**
 * Triggers a browser download of the current save as a `.json` file — a backup independent of both
 * localStorage (tied to one browser/device, cleared by the user or browser maintenance) and the
 * cloud save (tied to the server's Postgres instance, which - unlike the app/api deployments - isn't
 * touched by a normal image-pin redeploy, but could still be lost to node/cluster-level issues in the
 * home-lab k3s setup). The file can be re-imported later via parseSaveFile, including to restore a
 * lost cloud save (see loadSaveFile / SaveLoadControls's "Importar Backup").
 */
export function downloadSaveFile(campaign: CampaignProgress, chart: Chart): void {
  const json = serializeSave(campaign, chart);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const timestamp = new Date().toISOString().slice(0, 10);
  link.download = `lonewolf-save-${timestamp}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parses and validates a backup file's contents (from downloadSaveFile). Unlike loadGame/
 * loadGameFromCloud, which silently return null on a version mismatch (an internal, non-actionable
 * check on app startup), this throws a descriptive error - the user explicitly chose to import this
 * file and deserves to know why it didn't work, not just have it silently ignored.
 */
export function parseSaveFile(jsonText: string): SaveGame {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error('Arquivo inválido: não é um JSON válido.');
  }
  if (!parsed || typeof parsed !== 'object' || !('campaign' in parsed) || !('saveVersion' in parsed)) {
    throw new Error('Arquivo inválido: não parece ser um backup do Lone Wolf.');
  }
  const save = parsed as SaveGame;
  if (save.saveVersion !== SAVE_VERSION) {
    throw new Error(`Backup de uma versão incompatível (v${save.saveVersion}, esperado v${SAVE_VERSION}).`);
  }
  return save;
}

/** Reads a File (from a file input) and parses it as a backup save. Rejects with parseSaveFile's error message on invalid content, or a read error if the file can't be read at all. */
export function loadSaveFile(file: File): Promise<SaveGame> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(parseSaveFile(String(reader.result)));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    reader.readAsText(file);
  });
}
