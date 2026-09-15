import { useState } from 'react';
import './App.css';
import { BookSelectionScreen } from './screens/BookSelectionScreen';
import { BookIntroScreen } from './screens/BookIntroScreen';
import { CharacterCreationScreen } from './screens/CharacterCreationScreen';
import { GameScreen } from './screens/GameScreen';
import { GameOverScreen } from './screens/GameOverScreen';
import { SaveLoadControls } from './components/SaveLoadControls';
import { hasSave, loadGame, newCampaign, saveGame } from './engine/persistence';
import type { ActionChart, CampaignProgress, SaveGame } from './engine/types';
import { getBook } from './data/books';

type Mode = 'bookSelect' | 'bookIntro' | 'create' | 'playing' | 'gameover';
export type CreationMode = 'fresh' | 'carryover';

function App() {
  const [campaign, setCampaign] = useState<CampaignProgress>(() => loadGame()?.campaign ?? newCampaign());
  const [chart, setChart] = useState<ActionChart | null>(null);
  const [mode, setMode] = useState<Mode>('bookSelect');
  const [activeBookId, setActiveBookId] = useState<string | null>(null);
  const [creationMode, setCreationMode] = useState<CreationMode>('fresh');
  const [gameOverReason, setGameOverReason] = useState<'died' | 'deadend' | 'ending'>('died');

  const goToBookSelection = () => {
    setChart(null);
    setActiveBookId(null);
    setMode('bookSelect');
  };

  const handleGameOver = (reason: 'died' | 'deadend' | 'ending') => {
    if (reason === 'ending' && chart) {
      const nextCampaign: CampaignProgress = {
        completedBooks: { ...campaign.completedBooks, [chart.bookId]: chart },
      };
      setCampaign(nextCampaign);
      saveGame(nextCampaign, chart);
    }
    setGameOverReason(reason);
    setMode('gameover');
  };

  const applyLoadedSave = (save: SaveGame) => {
    setCampaign(save.campaign);
    if (save.chart) {
      setChart(save.chart);
      setActiveBookId(save.chart.bookId);
      setMode('playing');
    } else {
      setChart(null);
      setActiveBookId(null);
      setMode('bookSelect');
    }
  };

  const handleLoad = () => {
    const save = loadGame();
    if (save) applyLoadedSave(save);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>
          Lone Wolf <span className="app-version">v{__APP_VERSION__}</span>
        </h1>
        <SaveLoadControls
          campaign={campaign}
          chart={chart}
          canSave={mode === 'playing' && chart !== null}
          canLoad={hasSave()}
          onNewGame={goToBookSelection}
          onSave={() => saveGame(campaign, chart)}
          onLoad={handleLoad}
          onCloudLoad={applyLoadedSave}
        />
      </header>

      {mode === 'bookSelect' && (
        <BookSelectionScreen
          campaign={campaign}
          onSelectBook={(bookId) => {
            setActiveBookId(bookId);
            setMode('bookIntro');
          }}
        />
      )}

      {mode === 'bookIntro' && activeBookId && (
        <BookIntroScreen
          book={getBook(activeBookId)}
          previousChart={(() => {
            const book = getBook(activeBookId);
            if (book.allowsCarryOver === false) return null;
            const previousEntry = Object.values(campaign.completedBooks).find((c) => {
              // previous book = the one whose order is exactly one less than this book's
              return getBook(c.bookId).order === book.order - 1;
            });
            return previousEntry ?? null;
          })()}
          onContinue={(mode) => {
            setCreationMode(mode);
            setMode('create');
          }}
        />
      )}

      {mode === 'create' && activeBookId && (
        <CharacterCreationScreen
          book={getBook(activeBookId)}
          creationMode={creationMode}
          previousChart={
            creationMode === 'carryover' && getBook(activeBookId).allowsCarryOver !== false
              ? Object.values(campaign.completedBooks).find(
                  (c) => getBook(c.bookId).order === getBook(activeBookId).order - 1,
                ) ?? null
              : null
          }
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
        <GameOverScreen
          reason={gameOverReason}
          visitedCount={chart.visitedSections.length}
          onRestart={goToBookSelection}
        />
      )}
    </div>
  );
}

export default App;
