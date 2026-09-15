import { useRef, useState } from 'react';
import { downloadSaveFile, getLastCloudCode, loadGameFromCloud, loadSaveFile, saveGameToCloud } from '../engine/persistence';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasSomethingToBackUp = chart !== null || Object.keys(campaign.completedBooks).length > 0;

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

  const handleDownloadBackup = () => {
    downloadSaveFile(campaign, chart);
    setStatus('Backup baixado.');
  };

  const handleImportFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    setBusy(true);
    setStatus(null);
    try {
      const save = await loadSaveFile(file);
      onCloudLoad(save); // loads it into the running app the same way a cloud load does
      // The whole point of importing a backup is restoring server data lost to a cloud-side issue
      // (see downloadSaveFile's doc comment) - so push it back to the cloud right away, reusing
      // whatever code is already in the input, or minting a new one if there isn't one.
      const code = await saveGameToCloud(save.campaign, save.chart, cloudCode || null);
      setCloudCode(code);
      setStatus(`Backup importado e salvo na nuvem. Código: ${code}`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Falha ao importar o backup.');
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
      <button type="button" onClick={handleDownloadBackup} disabled={!hasSomethingToBackUp}>
        Baixar Backup
      </button>
      <button type="button" onClick={() => fileInputRef.current?.click()} disabled={busy}>
        Importar Backup
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        onChange={handleImportFileChosen}
        style={{ display: 'none' }}
      />

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
