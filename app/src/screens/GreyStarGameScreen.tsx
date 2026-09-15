import { useEffect, useState } from 'react';
import sectionsGsw from '../data/sections.gsw.json';
import sectionsTfc from '../data/sections.tfc.json';
import type { SectionMap } from '../data/section-types';
import { getFootnote } from '../data/footnotes';
import { GreyStarActionChartSidebar } from '../components/GreyStarActionChartSidebar';
import { ChoiceList } from '../components/ChoiceList';
import { RandomNumberBranch } from '../components/RandomNumberBranch';
import { ManualSectionJump } from '../components/ManualSectionJump';
import { GreyStarCombatModal } from '../components/GreyStarCombatModal';
import { getBook } from '../data/books';
import type { GreyStarActionChart } from '../engine/greyStarTypes';

const SECTIONS_BY_BOOK: Record<string, SectionMap> = {
  gsw: sectionsGsw as unknown as SectionMap,
  tfc: sectionsTfc as unknown as SectionMap,
};

const EVADE_KEYWORDS = /\bevad|\bflee|\bescape|\brun away\b/i;

interface Props {
  chart: GreyStarActionChart;
  onChartChange: (chart: GreyStarActionChart) => void;
  onGameOver: (reason: 'died' | 'deadend' | 'ending') => void;
}

export function GreyStarGameScreen({ chart, onChartChange, onGameOver }: Props) {
  const sections = SECTIONS_BY_BOOK[chart.bookId];
  const section = sections[chart.currentSection];
  const [combatStarted, setCombatStarted] = useState(false);
  const [combatResolved, setCombatResolved] = useState(section.combats.length === 0);

  useEffect(() => {
    if (section.isDeadEnd) onGameOver('deadend');
    else if (section.isEnding) onGameOver(section.number === getBook(chart.bookId).finalSection ? 'ending' : 'deadend');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section.number, section.isDeadEnd, section.isEnding]);

  if (!section) return null;

  const goTo = (targetSection: number) => {
    const visitedSections = chart.visitedSections.includes(section.number)
      ? chart.visitedSections
      : [...chart.visitedSections, section.number];
    onChartChange({ ...chart, currentSection: targetSection, visitedSections });
  };

  const footnote = getFootnote(section.number);
  const evadeChoice = section.choices.find((c) => EVADE_KEYWORDS.test(c.text));

  return (
    <div className="game-layout">
      <main className="game-main">
        <h2>Seção {section.number}</h2>

        <div className="section-body" dangerouslySetInnerHTML={{ __html: section.bodyHtml }} />

        {section.illustrations.map((file) => (
          <img key={file} className="section-illustration" src={`/illustrations/${chart.bookId}/${file}`} alt="" />
        ))}

        {footnote && <div className="callout callout-info">📖 {footnote.note}</div>}
        {section.hasPuzzle ? (
          <div className="callout callout-warning">
            🧩 Esta seção é um quebra-cabeça do livro original — descubra o número da seção certa pelas pistas da
            história (pode envolver consultar um mapa ou outra referência do livro) e digite abaixo.
          </div>
        ) : (
          section.parserWarning && (
            <div className="callout callout-warning">
              🎲 Esta seção envolve um sorteio de número aleatório com efeito narrado em texto livre — leia com
              atenção e ajuste sua Ficha de Aventura manualmente se necessário.
            </div>
          )
        )}

        {section.combats.length > 0 && !combatResolved && (
          <div className="combat-preview">
            <h3>Combate</h3>
            <ul className="plain-list">
              {section.combats.map((c, i) => (
                <li key={i}>
                  {c.enemyName}: COMBAT SKILL {c.combatSkill} · ENDURANCE {c.endurance}
                </li>
              ))}
            </ul>
            {!combatStarted && (
              <button type="button" className="primary-button" onClick={() => setCombatStarted(true)}>
                Entrar em Combate
              </button>
            )}
          </div>
        )}

        {combatStarted && !combatResolved && (
          <GreyStarCombatModal
            chart={chart}
            encounters={section.combats}
            evadeChoice={evadeChoice}
            onChartChange={onChartChange}
            onFinished={(outcome) => {
              if (outcome.evadedTo !== undefined) {
                setCombatResolved(true);
                goTo(outcome.evadedTo);
              } else if (outcome.won) {
                setCombatResolved(true);
              } else {
                onGameOver('died');
              }
            }}
          />
        )}

        {combatResolved && !section.isDeadEnd && !section.isEnding && (
          <>
            {section.randomNumberBranch && section.ranges ? (
              <RandomNumberBranch ranges={section.ranges} onResolved={goTo} />
            ) : (
              <>
                {section.choices.length > 0 && <ChoiceList choices={section.choices} onChoose={goTo} />}
                {section.hasPuzzle && (
                  <ManualSectionJump maxSection={getBook(chart.bookId).sectionCount} onGo={goTo} />
                )}
              </>
            )}
          </>
        )}
      </main>

      <GreyStarActionChartSidebar chart={chart} onChange={onChartChange} />
    </div>
  );
}
