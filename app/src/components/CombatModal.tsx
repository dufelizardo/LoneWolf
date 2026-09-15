import { useState } from 'react';
import { canUseKaiBlast, canUseKaiRay, psiSurgeMinEndurance, resolveCombatRound, resolvePsiSurgeTier } from '../engine/combat';
import {
  canUseArchmasterCuring,
  canUseDeliverance,
  useArchmasterCuring,
  useCombatPotion,
  useDeliverance,
} from '../engine/disciplines';
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
  const [useKaiBlast, setUseKaiBlast] = useState(false);
  const [useKaiRay, setUseKaiRay] = useState(false);
  const [kaiRayUsedThisFight, setKaiRayUsedThisFight] = useState(false);
  const [wantsCombatPotion, setWantsCombatPotion] = useState(false);
  const [potionActiveThisFight, setPotionActiveThisFight] = useState(false);

  const psiSurgeTier = resolvePsiSurgeTier(chart);
  const psiSurgeAvailable = chart.enduranceCurrent > psiSurgeMinEndurance(chart);
  const kaiBlastAvailable = canUseKaiBlast(chart);
  const kaiRayAvailable = !kaiRayUsedThisFight && canUseKaiRay(chart);
  const combatPotionLabel = getBookEquipment(chart.bookId).combatPotionLabel ?? 'Potion of Alether';
  // Deliverance (Grand Master) supersedes Archmaster Curing (Magnakai) rather than stacking with it
  // - only ever offer one combat-heal button, preferring the better/newer one when both apply.
  const useDeliveranceInstead = canUseDeliverance(chart);
  const showArchmasterCuring = !useDeliveranceInstead && canUseArchmasterCuring(chart);

  const fightRound = () => {
    // The potion is bought once, before the first round, then stays active (unlike Psi-surge's
    // per-round re-chosen toggle) for the rest of this whole fight.
    const activatingPotionNow = log.length === 0 && wantsCombatPotion && chart.combatPotionDoses > 0;
    const chartForRound = activatingPotionNow ? useCombatPotion(chart) : chart;
    const potionActiveNow = potionActiveThisFight || activatingPotionNow;

    const result = resolveCombatRound(chartForRound, enemy, Math.random, {
      usePsiSurge,
      useCombatPotion: potionActiveNow,
      useKaiBlast,
      useKaiRay,
    });
    setUsePsiSurge(false); // must be actively re-chosen every round, never "sticky"
    setUseKaiBlast(false);
    if (useKaiRay && result.kaiRayCost > 0) setKaiRayUsedThisFight(true); // one charge per whole fight, unlike Kai-blast
    setUseKaiRay(false);
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

      {psiSurgeTier && (
        <label className="psi-surge-toggle">
          <input
            type="checkbox"
            checked={usePsiSurge}
            disabled={!psiSurgeAvailable || useKaiBlast || useKaiRay}
            onChange={(e) => setUsePsiSurge(e.target.checked)}
          />
          Usar {psiSurgeTier.name} nesta rodada (+{psiSurgeTier.bonus} Combat Skill, -{psiSurgeTier.cost} Endurance
          {!psiSurgeAvailable ? ` — indisponível com Endurance ≤ ${psiSurgeMinEndurance(chart)}` : ''})
        </label>
      )}

      {kaiBlastAvailable && (
        <label className="kai-blast-toggle">
          <input
            type="checkbox"
            checked={useKaiBlast}
            disabled={useKaiRay}
            onChange={(e) => {
              setUseKaiBlast(e.target.checked);
              if (e.target.checked) {
                setUsePsiSurge(false);
                setUseKaiRay(false);
              }
            }}
          />
          Usar Kai-blast nesta rodada (2-18 de dano direto, -4 Endurance, substitui o ataque desta rodada — não pode ser combinado com {psiSurgeTier?.name ?? 'Psi-surge'})
        </label>
      )}

      {kaiRayAvailable && (
        <label className="kai-ray-toggle">
          <input
            type="checkbox"
            checked={useKaiRay}
            disabled={useKaiBlast}
            onChange={(e) => {
              setUseKaiRay(e.target.checked);
              if (e.target.checked) {
                setUsePsiSurge(false);
                setUseKaiBlast(false);
              }
            }}
          />
          Usar Kai-ray nesta rodada (15 de dano direto, -4 Endurance, só uma vez por este combate, substitui o ataque desta rodada — não pode ser combinado com {psiSurgeTier?.name ?? 'Psi-surge'})
        </label>
      )}

      {useDeliveranceInstead && (
        <button type="button" onClick={() => onChartChange(useDeliverance(chart))}>
          Usar Deliverance: restaurar 20 Endurance (auto-adjudicar o limite de uma vez a cada 20 dias)
        </button>
      )}

      {showArchmasterCuring && (
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
