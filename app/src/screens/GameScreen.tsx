import { useEffect, useState } from 'react';
import sectionsFt from '../data/sections.ft.json';
import sectionsFa from '../data/sections.fa.json';
import sectionsTck from '../data/sections.tck.json';
import sectionsTcd from '../data/sections.tcd.json';
import sectionsSs from '../data/sections.ss.json';
import sectionsTkt from '../data/sections.tkt.json';
import sectionsCd from '../data/sections.cd.json';
import sectionsTjh from '../data/sections.tjh.json';
import sectionsTcf from '../data/sections.tcf.json';
import sectionsTdt from '../data/sections.tdt.json';
import sectionsTpt from '../data/sections.tpt.json';
import sectionsTmd from '../data/sections.tmd.json';
import sectionsTplr from '../data/sections.tplr.json';
import sectionsTcok from '../data/sections.tcok.json';
import sectionsTdc from '../data/sections.tdc.json';
import sectionsTlv from '../data/sections.tlv.json';
import sectionsTdi from '../data/sections.tdi.json';
import sectionsDd from '../data/sections.dd.json';
import type { SectionMap } from '../data/section-types';
import { getFootnote } from '../data/footnotes';
import { applyHealingRegen } from '../engine/disciplines';
import { ActionChartSidebar } from '../components/ActionChartSidebar';
import { ChoiceList } from '../components/ChoiceList';
import { RandomNumberBranch } from '../components/RandomNumberBranch';
import { ManualSectionJump } from '../components/ManualSectionJump';
import { CombatModal } from '../components/CombatModal';
import { getBook } from '../data/books';
import type { ActionChart } from '../engine/types';

const SECTIONS_BY_BOOK: Record<string, SectionMap> = {
  ft: sectionsFt as unknown as SectionMap,
  fa: sectionsFa as unknown as SectionMap,
  tck: sectionsTck as unknown as SectionMap,
  tcd: sectionsTcd as unknown as SectionMap,
  ss: sectionsSs as unknown as SectionMap,
  tkt: sectionsTkt as unknown as SectionMap,
  cd: sectionsCd as unknown as SectionMap,
  tjh: sectionsTjh as unknown as SectionMap,
  tcf: sectionsTcf as unknown as SectionMap,
  tdt: sectionsTdt as unknown as SectionMap,
  tpt: sectionsTpt as unknown as SectionMap,
  tmd: sectionsTmd as unknown as SectionMap,
  tplr: sectionsTplr as unknown as SectionMap,
  tcok: sectionsTcok as unknown as SectionMap,
  tdc: sectionsTdc as unknown as SectionMap,
  tlv: sectionsTlv as unknown as SectionMap,
  tdi: sectionsTdi as unknown as SectionMap,
  dd: sectionsDd as unknown as SectionMap,
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
    // A book can have a non-canonical ending (e.g. tck sect61: "you survive but fail your
    // mission and may not continue on to future adventures") — only the book's own final
    // section counts as the canonical, campaign-progressing ending.
    else if (section.isEnding) onGameOver(section.number === getBook(chart.bookId).finalSection ? 'ending' : 'deadend');
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
              <>
                {section.choices.length > 0 && <ChoiceList choices={section.choices} onChoose={goTo} />}
                {/* sect58-style sections mix a puzzle option with regular choices (wrong combo / give up),
                    so this must not be exclusive with ChoiceList above. */}
                {section.hasPuzzle && (
                  <ManualSectionJump maxSection={getBook(chart.bookId).sectionCount} onGo={goTo} />
                )}
              </>
            )}
          </>
        )}
      </main>

      <ActionChartSidebar chart={chart} onChange={onChartChange} />
    </div>
  );
}
