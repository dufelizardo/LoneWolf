import { useState } from 'react';
import './App.css';
import { CharacterCreationScreen } from './screens/CharacterCreationScreen';
import { GameScreen } from './screens/GameScreen';
import { GameOverScreen } from './screens/GameOverScreen';
import { SaveLoadControls } from './components/SaveLoadControls';
import { hasSave, loadGame, saveGame } from './engine/persistence';
import type { ActionChart } from './engine/types';

type Mode = 'create' | 'playing' | 'gameover';

function App() {
  const [chart, setChart] = useState<ActionChart | null>(null);
  const [mode, setMode] = useState<Mode>('create');
  const [gameOverReason, setGameOverReason] = useState<'died' | 'deadend' | 'ending'>('died');

  const startNewGame = () => {
    setChart(null);
    setMode('create');
  };

  const handleGameOver = (reason: 'died' | 'deadend' | 'ending') => {
    setGameOverReason(reason);
    setMode('gameover');
  };

  const handleLoad = () => {
    const loaded = loadGame();
    if (loaded) {
      setChart(loaded);
      setMode('playing');
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Lone Wolf: Flight from the Dark</h1>
        <SaveLoadControls
          chart={chart}
          canSave={mode === 'playing' && chart !== null}
          canLoad={hasSave()}
          onNewGame={startNewGame}
          onSave={() => chart && saveGame(chart)}
          onLoad={handleLoad}
          onCloudLoad={(loaded) => {
            setChart(loaded);
            setMode('playing');
          }}
        />
      </header>

      {mode === 'create' && (
        <CharacterCreationScreen
          onReady={(newChart) => {
            setChart(newChart);
            setMode('playing');
          }}
        />
      )}

      {mode === 'playing' && chart && (
        <GameScreen key={chart.currentSection} chart={chart} onChartChange={setChart} onGameOver={handleGameOver} />
      )}

      {mode === 'gameover' && chart && (
        <GameOverScreen reason={gameOverReason} visitedCount={chart.visitedSections.length} onRestart={startNewGame} />
      )}
    </div>
  );
}

export default App;
