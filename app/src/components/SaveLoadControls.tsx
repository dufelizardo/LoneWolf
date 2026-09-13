import { useState } from 'react';
import { getLastCloudCode, loadGameFromCloud, saveGameToCloud } from '../engine/persistence';
import type { ActionChart, CampaignProgress, SaveGame } from '../engine/types';

interface Props {
  campaign: CampaignProgress;
  chart: ActionChart | null;
  canSave: boolean;
  canLoad: boolean;
  onNewGame: () => void;
  onSave: () => void;
  onLoad: () => void;
  onCloudLoad: (save: SaveGame) => void;
}

export function SaveLoadControls({ campaign, chart, canSave, canLoad, onNewGame, onSave, onLoad, onCloudLoad }: Props) {
  const [cloudCode, setCloudCode] = useState(() => getLastCloudCode() ?? '');
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleCloudSave = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const code = await saveGameToCloud(campaign, chart, cloudCode || null);
      setCloudCode(code);
      setStatus(`Salvo na nuvem. Código: ${code}`);
    } catch {
      setStatus('Falha ao salvar na nuvem.');
    } finally {
      setBusy(false);
    }
  };

  const handleCloudLoad = async () => {
    if (!cloudCode) return;
    setBusy(true);
    setStatus(null);
    try {
      const loaded = await loadGameFromCloud(cloudCode);
      if (loaded) {
        onCloudLoad(loaded);
        setStatus('Jogo carregado da nuvem.');
      } else {
        setStatus('Código não encontrado.');
      }
    } catch {
      setStatus('Falha ao carregar da nuvem.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="save-load-controls">
      <button type="button" onClick={onNewGame}>
        Novo Jogo
      </button>
      <button type="button" onClick={onSave} disabled={!canSave}>
        Salvar
      </button>
      <button type="button" onClick={onLoad} disabled={!canLoad}>
        Carregar
      </button>

      <input
        type="text"
        value={cloudCode}
        onChange={(e) => setCloudCode(e.target.value.trim().toUpperCase())}
        placeholder="Código de save"
        className="cloud-code-input"
      />
      <button type="button" onClick={handleCloudSave} disabled={busy}>
        Salvar na Nuvem
      </button>
      <button type="button" onClick={handleCloudLoad} disabled={!cloudCode || busy}>
        Carregar da Nuvem
      </button>
      {status && <span className="cloud-status">{status}</span>}
    </div>
  );
}
