import { useState } from 'react';
import { applyDisciplines, createCharacter } from '../engine/character';
import { ALL_DISCIPLINES, DISCIPLINE_LABELS, type ActionChart, type Discipline } from '../engine/types';

const REQUIRED_DISCIPLINES = 5;

interface Props {
  onReady: (chart: ActionChart) => void;
}

export function CharacterCreationScreen({ onReady }: Props) {
  const [baseChart] = useState<ActionChart>(() => createCharacter());
  const [selected, setSelected] = useState<Discipline[]>([]);

  const toggle = (discipline: Discipline) => {
    setSelected((prev) => {
      if (prev.includes(discipline)) return prev.filter((d) => d !== discipline);
      if (prev.length >= REQUIRED_DISCIPLINES) return prev;
      return [...prev, discipline];
    });
  };

  const confirm = () => {
    if (selected.length !== REQUIRED_DISCIPLINES) return;
    onReady(applyDisciplines(baseChart, selected));
  };

  return (
    <div className="creation-screen">
      <h1>Flight from the Dark</h1>
      <h2>Criação do Kai Lord</h2>

      <section className="stat-block">
        <p>
          <strong>COMBAT SKILL:</strong> {baseChart.combatSkill}
        </p>
        <p>
          <strong>ENDURANCE:</strong> {baseChart.enduranceCurrent}
        </p>
        <p>
          <strong>Equipamento inicial:</strong> {baseChart.weapons.join(', ')}, {baseChart.backpackItems.join(', ')},{' '}
          {baseChart.specialItems.join(', ')}
          {baseChart.hasHealingPotion ? ', Healing Potion' : ''}, {baseChart.goldCrowns} Coroas de Ouro
        </p>
      </section>

      <section>
        <h3>
          Escolha exatamente {REQUIRED_DISCIPLINES} Disciplinas Kai ({selected.length}/{REQUIRED_DISCIPLINES})
        </h3>
        <ul className="discipline-picker">
          {ALL_DISCIPLINES.map((d) => (
            <li key={d}>
              <label>
                <input
                  type="checkbox"
                  checked={selected.includes(d)}
                  onChange={() => toggle(d)}
                  disabled={!selected.includes(d) && selected.length >= REQUIRED_DISCIPLINES}
                />
                {DISCIPLINE_LABELS[d]}
              </label>
            </li>
          ))}
        </ul>
      </section>

      <button type="button" className="primary-button" disabled={selected.length !== REQUIRED_DISCIPLINES} onClick={confirm}>
        Começar Aventura
      </button>
    </div>
  );
}
