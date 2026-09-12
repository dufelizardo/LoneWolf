import { useState } from 'react';
import { resolveCombatRound } from '../engine/combat';
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

  const fightRound = () => {
    const result = resolveCombatRound(chart, enemy, Math.random);
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
