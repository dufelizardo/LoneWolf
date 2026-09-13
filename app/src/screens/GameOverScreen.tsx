interface Props {
  reason: 'died' | 'deadend' | 'ending';
  visitedCount: number;
  onRestart: () => void;
}

const TITLES: Record<Props['reason'], string> = {
  died: 'Você morreu',
  deadend: 'Sua missão termina aqui',
  ending: 'Fim da Aventura',
};

const BUTTON_LABELS: Record<Props['reason'], string> = {
  died: 'Tentar Novamente',
  deadend: 'Tentar Novamente',
  ending: 'Escolher Próximo Livro',
};

export function GameOverScreen({ reason, visitedCount, onRestart }: Props) {
  return (
    <div className="game-over-screen">
      <h1>{TITLES[reason]}</h1>
      <p>Você visitou {visitedCount} seções nesta jornada.</p>
      <button type="button" className="primary-button" onClick={onRestart}>
        {BUTTON_LABELS[reason]}
      </button>
    </div>
  );
}
