import { useState } from 'react';
import {
  addBackpackItem,
  addHerbPouchItem,
  addSpecialItem,
  addWeapon,
  adjustCombatSkill,
  adjustEndurance,
  adjustNobles,
  adjustWillpower,
  equipWeapon,
  removeBackpackItem,
  removeHerbPouchItem,
  removeSpecialItem,
  removeWeapon,
} from '../engine/greyStarInventory';
import { HIGHER_MAGICAL_POWER_LABELS, MAGICAL_POWER_LABELS, type GreyStarActionChart } from '../engine/greyStarTypes';
import { MAX_BACKPACK_ITEMS, MAX_WEAPONS } from '../engine/types';

interface Props {
  chart: GreyStarActionChart;
  onChange: (chart: GreyStarActionChart) => void;
}

const MAX_HERB_POUCH_ITEMS = 8;

export function GreyStarActionChartSidebar({ chart, onChange }: Props) {
  const [newItem, setNewItem] = useState('');
  const [newHerbItem, setNewHerbItem] = useState('');
  const [newWeapon, setNewWeapon] = useState('');
  const [newSpecialName, setNewSpecialName] = useState('');
  const [newSpecialEffect, setNewSpecialEffect] = useState('');

  const hasAlchemy = chart.magicalPowers.includes('Alchemy');
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
          <span>WILLPOWER</span>
          <span>{chart.willpowerCurrent}</span>
        </div>
        <div className="button-row">
          <button type="button" onClick={() => onChange(adjustWillpower(chart, -1))}>
            -1
          </button>
          <button type="button" onClick={() => onChange(adjustWillpower(chart, 1))}>
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
        <h3>Magical Powers</h3>
        <ul className="plain-list">
          {chart.magicalPowers.map((p) => (
            <li key={p}>{MAGICAL_POWER_LABELS[p]}</li>
          ))}
        </ul>
      </section>

      {chart.higherMagicalPowers.length > 0 && (
        <section>
          <h3>Higher Magicks</h3>
          <ul className="plain-list">
            {chart.higherMagicalPowers.map((p) => (
              <li key={p}>{HIGHER_MAGICAL_POWER_LABELS[p]}</li>
            ))}
          </ul>
        </section>
      )}

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
          <input
            type="text"
            value={newWeapon}
            onChange={(e) => setNewWeapon(e.target.value)}
            placeholder="Nova arma"
          />
          <button
            type="button"
            onClick={() => {
              if (!newWeapon.trim()) return;
              onChange(addWeapon(chart, newWeapon.trim()));
              setNewWeapon('');
            }}
            disabled={chart.weapons.length >= MAX_WEAPONS}
          >
            Adicionar
          </button>
        </div>
      </section>

      <section>
        <h3>Refeições ({chart.meals})</h3>
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
      </section>

      {hasAlchemy && (
        <section>
          <h3>
            Herb Pouch ({chart.herbPouchItems.length}/{MAX_HERB_POUCH_ITEMS})
          </h3>
          <ul className="plain-list">
            {chart.herbPouchItems.map((item, i) => (
              <li key={`${item}-${i}`}>
                {item}{' '}
                <button
                  type="button"
                  className="link-button"
                  onClick={() => onChange(removeHerbPouchItem(chart, item))}
                >
                  remover
                </button>
              </li>
            ))}
          </ul>
          <div className="button-row">
            <input
              type="text"
              value={newHerbItem}
              onChange={(e) => setNewHerbItem(e.target.value)}
              placeholder="Novo item"
            />
            <button
              type="button"
              onClick={() => {
                if (!newHerbItem.trim()) return;
                onChange(addHerbPouchItem(chart, newHerbItem.trim()));
                setNewHerbItem('');
              }}
            >
              Adicionar
            </button>
          </div>
        </section>
      )}

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
          <span>Nobles</span>
          <span>{chart.nobles}</span>
        </div>
        <div className="button-row">
          <button type="button" onClick={() => onChange(adjustNobles(chart, -1))}>
            -1
          </button>
          <button type="button" onClick={() => onChange(adjustNobles(chart, 1))}>
            +1
          </button>
        </div>
      </section>
    </aside>
  );
}
