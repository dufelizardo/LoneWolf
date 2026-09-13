import { useState } from 'react';
import {
  adjustCombatSkill,
  adjustEndurance,
  adjustGold,
  addBackpackItem,
  addMeal,
  addSpecialItem,
  addWeapon,
  equipWeapon,
  removeBackpackItem,
  removeMeal,
  removeSpecialItem,
  removeWeapon,
} from '../engine/inventory';
import { eatMeal, useHealingPotion } from '../engine/disciplines';
import { getBookEquipment } from '../engine/bookEquipment';
import { getKaiRank } from '../engine/kaiRank';
import { ALL_WEAPONS, DISCIPLINE_LABELS, MAX_BACKPACK_ITEMS, MAX_WEAPONS, type ActionChart, type WeaponType } from '../engine/types';

interface Props {
  chart: ActionChart;
  onChange: (chart: ActionChart) => void;
}

export function ActionChartSidebar({ chart, onChange }: Props) {
  const [newItem, setNewItem] = useState('');
  const [newWeapon, setNewWeapon] = useState<WeaponType>(ALL_WEAPONS[0]);
  const [newSpecialName, setNewSpecialName] = useState('');
  const [newSpecialEffect, setNewSpecialEffect] = useState('');
  const healingPotionLabel = getBookEquipment(chart.bookId).healingPotionLabel;

  const enduracePct = Math.max(0, Math.min(100, (chart.enduranceCurrent / chart.enduranceMax) * 100));
  const backpackSlotsUsed = chart.backpackItems.length + chart.meals;

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

        <div className="stat-row">
          <span>RANK</span>
          <span>{getKaiRank(chart.disciplines.length)}</span>
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
        <h3>
          Armas ({chart.weapons.length}/{MAX_WEAPONS})
        </h3>
        <ul className="plain-list">
          {chart.weapons.map((w) => (
            <li key={w}>
              {w}
              {chart.equippedWeapon === w ? (
                ' (equipada)'
              ) : (
                <button type="button" className="link-button" onClick={() => onChange(equipWeapon(chart, w))}>
                  equipar
                </button>
              )}{' '}
              <button type="button" className="link-button" onClick={() => onChange(removeWeapon(chart, w))}>
                remover
              </button>
            </li>
          ))}
        </ul>
        <div className="button-row">
          <select value={newWeapon} onChange={(e) => setNewWeapon(e.target.value as WeaponType)}>
            {ALL_WEAPONS.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => onChange(addWeapon(chart, newWeapon))}
            disabled={chart.weapons.length >= MAX_WEAPONS}
          >
            Adicionar
          </button>
        </div>
      </section>

      <section>
        <h3>Refeições ({chart.meals})</h3>
        <div className="button-row">
          <button type="button" onClick={() => onChange(removeMeal(chart))} disabled={chart.meals <= 0}>
            -1
          </button>
          <button type="button" onClick={() => onChange(addMeal(chart))} disabled={backpackSlotsUsed >= MAX_BACKPACK_ITEMS}>
            +1
          </button>
          <button type="button" onClick={() => onChange(eatMeal(chart))} disabled={chart.meals <= 0}>
            Comer Refeição
          </button>
        </div>
      </section>

      <section>
        <h3>
          Mochila ({backpackSlotsUsed}/{MAX_BACKPACK_ITEMS})
        </h3>
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
        {chart.healingPotionDoses > 0 && (
          <button type="button" onClick={() => onChange(useHealingPotion(chart))}>
            Usar {healingPotionLabel}
          </button>
        )}
      </section>

      <section>
        <h3>Itens Especiais</h3>
        <ul className="plain-list special-items-list">
          {chart.specialItems.map((item, i) => (
            <li key={`${item.name}-${i}`}>
              <strong>{item.name}</strong>{' '}
              <button
                type="button"
                className="link-button"
                onClick={() => onChange(removeSpecialItem(chart, item.name))}
              >
                remover
              </button>
              {item.knownEffects && <div className="item-detail">Efeito: {item.knownEffects}</div>}
              {item.description && <div className="item-detail">{item.description}</div>}
            </li>
          ))}
          {chart.healingPotionDoses > 0 && (
            <li>{healingPotionLabel}{chart.healingPotionDoses > 1 ? ` x${chart.healingPotionDoses}` : ''}</li>
          )}
        </ul>
        <div className="button-row">
          <input
            type="text"
            value={newSpecialName}
            onChange={(e) => setNewSpecialName(e.target.value)}
            placeholder="Nome do item"
          />
          <input
            type="text"
            value={newSpecialEffect}
            onChange={(e) => setNewSpecialEffect(e.target.value)}
            placeholder="Efeito conhecido (opcional)"
          />
          <button
            type="button"
            onClick={() => {
              if (!newSpecialName.trim()) return;
              onChange(
                addSpecialItem(chart, {
                  name: newSpecialName.trim(),
                  knownEffects: newSpecialEffect.trim() || undefined,
                }),
              );
              setNewSpecialName('');
              setNewSpecialEffect('');
            }}
          >
            Adicionar
          </button>
        </div>
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
