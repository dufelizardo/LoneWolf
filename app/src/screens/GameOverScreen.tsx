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

export function GameOverScreen({ reason, visitedCount, onRestart }: Props) {
  return (
    <div className="game-over-screen">
      <h1>{TITLES[reason]}</h1>
      <p>Você visitou {visitedCount} seções nesta jornada.</p>
      <button type="button" className="primary-button" onClick={onRestart}>
        Novo Jogo
      </button>
    </div>
  );
}
