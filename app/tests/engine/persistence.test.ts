import { describe, expect, it } from 'vitest';
import { parseSaveFile, serializeSave } from '../../src/engine/persistence';
import { createEmptyCampaign, SAVE_VERSION } from '../../src/engine/types';

describe('serializeSave / parseSaveFile', () => {
  it('round-trips a campaign with no active chart', () => {
    const campaign = createEmptyCampaign();
    const json = serializeSave(campaign, null);
    const save = parseSaveFile(json);
    expect(save.saveVersion).toBe(SAVE_VERSION);
    expect(save.campaign).toEqual(campaign);
    expect(save.chart).toBeNull();
  });

  it('rejects text that is not valid JSON', () => {
    expect(() => parseSaveFile('not json at all')).toThrow('não é um JSON válido');
  });

  it('rejects valid JSON that is not a save file', () => {
    expect(() => parseSaveFile(JSON.stringify({ hello: 'world' }))).toThrow('não parece ser um backup');
  });

  it('rejects a save from an incompatible version', () => {
    const stale = JSON.stringify({ saveVersion: SAVE_VERSION - 1, campaign: createEmptyCampaign(), chart: null });
    expect(() => parseSaveFile(stale)).toThrow(`v${SAVE_VERSION - 1}`);
  });
});
