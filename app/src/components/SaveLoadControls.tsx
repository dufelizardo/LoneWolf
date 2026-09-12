interface Props {
  canSave: boolean;
  canLoad: boolean;
  onNewGame: () => void;
  onSave: () => void;
  onLoad: () => void;
}

export function SaveLoadControls({ canSave, canLoad, onNewGame, onSave, onLoad }: Props) {
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
    </div>
  );
}
