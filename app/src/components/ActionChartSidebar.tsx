import { useState } from 'react';
import {
  adjustCombatSkill,
  adjustEndurance,
  adjustGold,
  addBackpackItem,
  removeBackpackItem,
} from '../engine/inventory';
import { eatMeal, useHealingPotion } from '../engine/disciplines';
import { DISCIPLINE_LABELS, type ActionChart } from '../engine/types';

interface Props {
  chart: ActionChart;
  onChange: (chart: ActionChart) => void;
}

export function ActionChartSidebar({ chart, onChange }: Props) {
  const [newItem, setNewItem] = useState('');

  const enduracePct = Math.max(0, Math.min(100, (chart.enduranceCurrent / chart.enduranceMax) * 100));

  return (
    <aside className="action-chart">
      <h2>Ficha de Aventura</h2>

      <section className="stat-block">
        <div className="stat-row">
          <span>ENDURANCE</span>
          <span>
            {chart.enduranceCurrent} / {chart.enduranceMax}
          </span>
        </div>
        <div className="endurance-bar">
          <div className="endurance-bar-fill" style={{ width: `${enduracePct}%` }} />
        </div>
        <div className="button-row">
          <button type="button" onClick={() => onChange(adjustEndurance(chart, -1))}>
            -1
          </button>
          <button type="button" onClick={() => onChange(adjustEndurance(chart, 1))}>
            +1
          </button>
        </div>

        <div className="stat-row">
          <span>COMBAT SKILL</span>
          <span>{chart.combatSkill}</span>
        </div>
        <div className="button-row">
          <button type="button" onClick={() => onChange(adjustCombatSkill(chart, -1))}>
            -1
          </button>
          <button type="button" onClick={() => onChange(adjustCombatSkill(chart, 1))}>
            +1
          </button>
        </div>
      </section>

      <section>
        <h3>Disciplinas Kai</h3>
        <ul className="plain-list">
          {chart.disciplines.map((d) => (
            <li key={d}>
              {DISCIPLINE_LABELS[d]}
              {d === 'Weaponskill' && chart.weaponskillWeapon ? ` (${chart.weaponskillWeapon})` : ''}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3>Armas ({chart.weapons.length}/2)</h3>
        <ul className="plain-list">
          {chart.weapons.map((w) => (
            <li key={w}>
              {w}
              {chart.equippedWeapon === w ? ' (equipada)' : ''}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3>Mochila ({chart.backpackItems.length}/8)</h3>
        <ul className="plain-list">
          {chart.backpackItems.map((item, i) => (
            <li key={`${item}-${i}`}>
              {item}{' '}
              <button type="button" className="link-button" onClick={() => onChange(removeBackpackItem(chart, item))}>
                remover
              </button>
            </li>
          ))}
        </ul>
        <div className="button-row">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Novo item"
          />
          <button
            type="button"
            onClick={() => {
              if (!newItem.trim()) return;
              onChange(addBackpackItem(chart, newItem.trim()));
              setNewItem('');
            }}
          >
            Adicionar
          </button>
        </div>
        <button type="button" onClick={() => onChange(eatMeal(chart))} disabled={!chart.backpackItems.includes('Meal')}>
          Comer Refeição
        </button>
        {chart.hasHealingPotion && (
          <button type="button" onClick={() => onChange(useHealingPotion(chart))} disabled={chart.hasHealingPotionUsed}>
            Usar Poção de Cura
          </button>
        )}
      </section>

      <section>
        <h3>Itens Especiais</h3>
        <ul className="plain-list">
          {chart.specialItems.map((item, i) => (
            <li key={`${item}-${i}`}>{item}</li>
          ))}
          {chart.hasHealingPotion && (
            <li>Healing Potion{chart.hasHealingPotionUsed ? ' (usada)' : ''}</li>
          )}
        </ul>
      </section>

      <section className="stat-block">
        <div className="stat-row">
          <span>Coroas de Ouro</span>
          <span>{chart.goldCrowns} / 50</span>
        </div>
        <div className="button-row">
          <button type="button" onClick={() => onChange(adjustGold(chart, -1))}>
            -1
          </button>
          <button type="button" onClick={() => onChange(adjustGold(chart, 1))}>
            +1
          </button>
        </div>
      </section>
    </aside>
  );
}
