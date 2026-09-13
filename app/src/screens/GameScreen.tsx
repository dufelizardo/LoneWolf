import { useEffect, useState } from 'react';
import sectionsFt from '../data/sections.ft.json';
import sectionsFa from '../data/sections.fa.json';
import type { SectionMap } from '../data/section-types';
import { getFootnote } from '../data/footnotes';
import { applyHealingRegen } from '../engine/disciplines';
import { ActionChartSidebar } from '../components/ActionChartSidebar';
import { ChoiceList } from '../components/ChoiceList';
import { RandomNumberBranch } from '../components/RandomNumberBranch';
import { CombatModal } from '../components/CombatModal';
import type { ActionChart } from '../engine/types';

const SECTIONS_BY_BOOK: Record<string, SectionMap> = {
  ft: sectionsFt as unknown as SectionMap,
  fa: sectionsFa as unknown as SectionMap,
};

const EVADE_KEYWORDS = /\bevad|\bflee|\bescape|\brun away\b/i;

interface Props {
  chart: ActionChart;
  onChartChange: (chart: ActionChart) => void;
  onGameOver: (reason: 'died' | 'deadend' | 'ending') => void;
}

export function GameScreen({ chart, onChartChange, onGameOver }: Props) {
  const sections = SECTIONS_BY_BOOK[chart.bookId];
  const section = sections[chart.currentSection];
  const [combatStarted, setCombatStarted] = useState(false);
  const [combatResolved, setCombatResolved] = useState(section.combats.length === 0);

  useEffect(() => {
    if (section.isDeadEnd) onGameOver('deadend');
    else if (section.isEnding) onGameOver('ending');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section.number, section.isDeadEnd, section.isEnding]);

  if (!section) return null;

  const goTo = (targetSection: number) => {
    const withRegen = applyHealingRegen(chart, section.combats.length > 0);
    const visitedSections = withRegen.visitedSections.includes(section.number)
      ? withRegen.visitedSections
      : [...withRegen.visitedSections, section.number];
    onChartChange({ ...withRegen, currentSection: targetSection, visitedSections });
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
        {section.parserWarning && (
          <div className="callout callout-warning">
            🎲 Esta seção envolve um sorteio de número aleatório com efeito narrado em texto livre — leia com atenção e
            ajuste sua Ficha de Aventura manualmente se necessário.
          </div>
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
          <CombatModal
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
              <ChoiceList choices={section.choices} onChoose={goTo} />
            )}
          </>
        )}
      </main>

      <ActionChartSidebar chart={chart} onChange={onChartChange} />
    </div>
  );
}
