import { useState } from 'react';
import { ARCHMASTER_DISCIPLINE_COUNT, psiSurgeMinEndurance, resolveCombatRound } from '../engine/combat';
import { canUseArchmasterCuring, useArchmasterCuring, useCombatPotion } from '../engine/disciplines';
import { getBookEquipment } from '../engine/bookEquipment';
import type { ActionChart, Enemy } from '../engine/types';
import type { CombatEncounter, Choice } from '../data/section-types';

interface Props {
  chart: ActionChart;
  encounters: CombatEncounter[];
  evadeChoice?: Choice;
  onChartChange: (chart: ActionChart) => void;
  onFinished: (outcome: { won: boolean; evadedTo?: number }) => void;
}

function toEnemy(encounter: CombatEncounter): Enemy {
  return { name: encounter.enemyName, combatSkill: encounter.combatSkill, endurance: encounter.endurance };
}

export function CombatModal({ chart, encounters, evadeChoice, onChartChange, onFinished }: Props) {
  const [enemyIndex, setEnemyIndex] = useState(0);
  const [enemy, setEnemy] = useState<Enemy>(() => toEnemy(encounters[0]));
  const [log, setLog] = useState<string[]>([]);
  const [usePsiSurge, setUsePsiSurge] = useState(false);
  const [wantsCombatPotion, setWantsCombatPotion] = useState(false);
  const [potionActiveThisFight, setPotionActiveThisFight] = useState(false);

  const hasPsiSurge = chart.magnakaiDisciplines.includes('PsiSurge');
  const isArchmasterPsiSurge = hasPsiSurge && chart.magnakaiDisciplines.length >= ARCHMASTER_DISCIPLINE_COUNT;
  const psiSurgeAvailable = chart.enduranceCurrent > psiSurgeMinEndurance(chart);
  const combatPotionLabel = getBookEquipment(chart.bookId).combatPotionLabel ?? 'Potion of Alether';

  const fightRound = () => {
    // The potion is bought once, before the first round, then stays active (unlike Psi-surge's
    // per-round re-chosen toggle) for the rest of this whole fight.
    const activatingPotionNow = log.length === 0 && wantsCombatPotion && chart.combatPotionDoses > 0;
    const chartForRound = activatingPotionNow ? useCombatPotion(chart) : chart;
    const potionActiveNow = potionActiveThisFight || activatingPotionNow;

    const result = resolveCombatRound(chartForRound, enemy, Math.random, {
      usePsiSurge,
      useCombatPotion: potionActiveNow,
    });
    setUsePsiSurge(false); // must be actively re-chosen every round, never "sticky"
    if (activatingPotionNow) setPotionActiveThisFight(true);
    onChartChange(result.chart);
    setEnemy(result.enemy);
    setLog((prev) => [...prev, result.log]);

    if (result.playerKilled) {
      onFinished({ won: false });
      return;
    }
    if (result.enemyKilled) {
      const nextIndex = enemyIndex + 1;
      if (nextIndex >= encounters.length) {
        onFinished({ won: true });
      } else {
        setTimeout(() => {
          setEnemyIndex(nextIndex);
          setEnemy(toEnemy(encounters[nextIndex]));
        }, 0);
      }
    }
  };

  const evade = () => {
    if (!evadeChoice) return;
    const result = resolveCombatRound(chart, enemy, Math.random);
    const chartAfterHit: ActionChart = { ...chart, enduranceCurrent: result.chart.enduranceCurrent };
    onChartChange(chartAfterHit);
    if (result.playerKilled) {
      onFinished({ won: false });
    } else {
      onFinished({ won: false, evadedTo: evadeChoice.targetSection });
    }
  };

  return (
    <div className="combat-modal">
      <h3>Combate: {enemy.name}</h3>
      <div className="combat-stats">
        <div>
          <strong>{enemy.name}</strong>: COMBAT SKILL {enemy.combatSkill} · ENDURANCE {enemy.endurance}
        </div>
        <div>
          <strong>Lone Wolf</strong>: COMBAT SKILL {chart.combatSkill} · ENDURANCE {chart.enduranceCurrent}
        </div>
      </div>

      {enemyIndex > 0 && <p className="combat-progress">Inimigo {enemyIndex + 1} de {encounters.length}</p>}

      <div className="combat-log">
        {log.map((entry, i) => (
          <p key={i}>{entry}</p>
        ))}
      </div>

      {hasPsiSurge && (
        <label className="psi-surge-toggle">
          <input
            type="checkbox"
            checked={usePsiSurge}
            disabled={!psiSurgeAvailable}
            onChange={(e) => setUsePsiSurge(e.target.checked)}
          />
          {isArchmasterPsiSurge
            ? `Usar Psi-surge nesta rodada (+6 Combat Skill, -1 Endurance${!psiSurgeAvailable ? ' — indisponível com Endurance ≤ 4' : ''})`
            : `Usar Psi-surge nesta rodada (+4 Combat Skill, -2 Endurance${!psiSurgeAvailable ? ' — indisponível com Endurance ≤ 6' : ''})`}
        </label>
      )}

      {canUseArchmasterCuring(chart) && (
        <button type="button" onClick={() => onChartChange(useArchmasterCuring(chart))}>
          Usar Cura (Archmaster): restaurar 20 Endurance (auto-adjudicar o limite de uma vez a cada 100 dias)
        </button>
      )}

      {log.length === 0 && chart.combatPotionDoses > 0 && !potionActiveThisFight && (
        <label className="combat-potion-toggle">
          <input
            type="checkbox"
            checked={wantsCombatPotion}
            onChange={(e) => setWantsCombatPotion(e.target.checked)}
          />
          Beber {combatPotionLabel} antes desta luta (+2 Combat Skill nesta luta, consome 1 dose)
        </label>
      )}

      <div className="button-row">
        <button type="button" className="primary-button" onClick={fightRound}>
          Lutar (próxima rodada)
        </button>
        {evadeChoice && (
          <button type="button" onClick={evade}>
            Evadir
          </button>
        )}
      </div>
    </div>
  );
}
