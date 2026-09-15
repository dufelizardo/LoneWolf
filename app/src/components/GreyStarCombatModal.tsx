import { useState } from 'react';
import { canUseStaffMagic, resolveGreyStarCombatRound } from '../engine/greyStarCombat';
import type { GreyStarActionChart } from '../engine/greyStarTypes';
import type { Enemy } from '../engine/types';
import type { CombatEncounter, Choice } from '../data/section-types';

interface Props {
  chart: GreyStarActionChart;
  encounters: CombatEncounter[];
  evadeChoice?: Choice;
  onChartChange: (chart: GreyStarActionChart) => void;
  onFinished: (outcome: { won: boolean; evadedTo?: number }) => void;
}

function toEnemy(encounter: CombatEncounter): Enemy {
  return { name: encounter.enemyName, combatSkill: encounter.combatSkill, endurance: encounter.endurance };
}

export function GreyStarCombatModal({ chart, encounters, evadeChoice, onChartChange, onFinished }: Props) {
  const [enemyIndex, setEnemyIndex] = useState(0);
  const [enemy, setEnemy] = useState<Enemy>(() => toEnemy(encounters[0]));
  const [log, setLog] = useState<string[]>([]);
  const [willpowerSpend, setWillpowerSpend] = useState(1);

  const staffMagicAvailable = canUseStaffMagic(chart);

  const fightRound = () => {
    const result = resolveGreyStarCombatRound(chart, enemy, Math.random, willpowerSpend);
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
    // Same shape as the Lone Wolf CombatModal's evade: resolve one round, keep only the player's
    // ENDURANCE loss and discard the enemy's - fleeing doesn't harm the enemy.
    const result = resolveGreyStarCombatRound(chart, enemy, Math.random, 0);
    const chartAfterHit: GreyStarActionChart = { ...chart, enduranceCurrent: result.chart.enduranceCurrent };
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
          <strong>Grey Star</strong>: COMBAT SKILL {chart.combatSkill} · ENDURANCE {chart.enduranceCurrent} · WILLPOWER{' '}
          {chart.willpowerCurrent}
        </div>
      </div>

      {enemyIndex > 0 && <p className="combat-progress">Inimigo {enemyIndex + 1} de {encounters.length}</p>}

      <div className="combat-log">
        {log.map((entry, i) => (
          <p key={i}>{entry}</p>
        ))}
      </div>

      {staffMagicAvailable ? (
        <label className="willpower-spend-selector">
          Gastar quantos pontos de WILLPOWER nesta rodada (multiplica o dano ao inimigo):{' '}
          <input
            type="number"
            min={1}
            max={chart.willpowerCurrent}
            value={willpowerSpend}
            onChange={(e) => setWillpowerSpend(Math.max(1, Math.min(chart.willpowerCurrent, Number(e.target.value))))}
          />
        </label>
      ) : (
        <p className="item-detail">
          {chart.equippedWeapon
            ? 'Sem WILLPOWER suficiente para usar a magia do Wizard\'s Staff — lutando com penalidade de arma normal.'
            : 'Desarmado — lutando com penalidade de combate desarmado.'}
        </p>
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
