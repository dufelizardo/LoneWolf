import { useState } from 'react';
import {
  addExtraDiscipline,
  applyDisciplines,
  carryOverCharacterToBook,
  chooseEquipmentOptions,
  createFreshCharacterForBook,
} from '../engine/character';
import { getBookEquipment } from '../engine/bookEquipment';
import { getKaiRank } from '../engine/kaiRank';
import { ALL_DISCIPLINES, DISCIPLINE_LABELS, type ActionChart, type Discipline } from '../engine/types';
import type { BookMeta } from '../data/books';
import type { CreationMode } from '../App';

interface Props {
  book: BookMeta;
  creationMode: CreationMode;
  previousChart: ActionChart | null;
  onReady: (chart: ActionChart) => void;
}

export function CharacterCreationScreen({ book, creationMode, previousChart, onReady }: Props) {
  const isCarryOver = creationMode === 'carryover' && previousChart !== null;
  const requiredDisciplines = isCarryOver ? 1 : 5;
  const availableDisciplines = isCarryOver
    ? ALL_DISCIPLINES.filter((d) => !previousChart!.disciplines.includes(d))
    : ALL_DISCIPLINES;

  const [baseChart] = useState<ActionChart>(() =>
    isCarryOver ? carryOverCharacterToBook(previousChart!, book.id) : createFreshCharacterForBook(book.id),
  );
  const [selectedDisciplines, setSelectedDisciplines] = useState<Discipline[]>([]);

  const equipmentConfig = getBookEquipment(book.id);
  const needsEquipmentChoice = equipmentConfig.chooseOptions !== undefined;
  const requiredEquipment = equipmentConfig.chooseCount ?? 2;
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);

  const toggleDiscipline = (discipline: Discipline) => {
    setSelectedDisciplines((prev) => {
      if (prev.includes(discipline)) return prev.filter((d) => d !== discipline);
      if (prev.length >= requiredDisciplines) return prev;
      return [...prev, discipline];
    });
  };

  const toggleEquipment = (id: string) => {
    setSelectedEquipment((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= requiredEquipment) return prev;
      return [...prev, id];
    });
  };

  const disciplinesReady = selectedDisciplines.length === requiredDisciplines;
  const equipmentReady = !needsEquipmentChoice || selectedEquipment.length === requiredEquipment;

  const confirm = () => {
    if (!disciplinesReady || !equipmentReady) return;

    let chart = isCarryOver
      ? addExtraDiscipline(baseChart, selectedDisciplines[0])
      : applyDisciplines(baseChart, selectedDisciplines);

    if (needsEquipmentChoice) {
      chart = chooseEquipmentOptions(chart, selectedEquipment);
    }

    onReady(chart);
  };

  return (
    <div className="creation-screen">
      <h1>{book.title}</h1>
      <h2>{isCarryOver ? 'Transferir personagem' : 'Criação do Kai Lord'}</h2>

      <section className="stat-block">
        <p>
          <strong>COMBAT SKILL:</strong> {baseChart.combatSkill}
        </p>
        <p>
          <strong>ENDURANCE:</strong> {baseChart.enduranceCurrent}
        </p>
        <p>
          <strong>Equipamento{isCarryOver ? ' herdado' : ' inicial'}:</strong>{' '}
          {baseChart.weapons.join(', ') || '(nenhuma arma)'}
          {baseChart.meals > 0 ? `, ${baseChart.meals} Refeição(ões)` : ''}
          {baseChart.backpackItems.length > 0 ? `, ${baseChart.backpackItems.join(', ')}` : ''}
          {baseChart.specialItems.length > 0 ? `, ${baseChart.specialItems.map((i) => i.name).join(', ')}` : ''}
          {baseChart.healingPotionDoses > 0
            ? `, ${equipmentConfig.healingPotionLabel}${baseChart.healingPotionDoses > 1 ? ` x${baseChart.healingPotionDoses}` : ''}`
            : ''}
          , {baseChart.goldCrowns} Coroas de Ouro
        </p>
      </section>

      <section>
        <h3>
          Escolha exatamente {requiredDisciplines} Disciplina{requiredDisciplines > 1 ? 's' : ''} Kai nova
          {requiredDisciplines > 1 ? 's' : ''} ({selectedDisciplines.length}/{requiredDisciplines})
        </h3>
        <p className="item-detail">
          Rank resultante: {getKaiRank(baseChart.disciplines.length + selectedDisciplines.length)}
        </p>
        <ul className="discipline-picker">
          {availableDisciplines.map((d) => (
            <li key={d}>
              <label>
                <input
                  type="checkbox"
                  checked={selectedDisciplines.includes(d)}
                  onChange={() => toggleDiscipline(d)}
                  disabled={!selectedDisciplines.includes(d) && selectedDisciplines.length >= requiredDisciplines}
                />
                {DISCIPLINE_LABELS[d]}
              </label>
            </li>
          ))}
        </ul>
      </section>

      {needsEquipmentChoice && (
        <section>
          <h3>
            Escolha exatamente {requiredEquipment} itens de equipamento ({selectedEquipment.length}/{requiredEquipment})
          </h3>
          <ul className="discipline-picker">
            {equipmentConfig.chooseOptions!.map((option) => (
              <li key={option.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedEquipment.includes(option.id)}
                    onChange={() => toggleEquipment(option.id)}
                    disabled={!selectedEquipment.includes(option.id) && selectedEquipment.length >= requiredEquipment}
                  />
                  {option.label}
                </label>
              </li>
            ))}
          </ul>
        </section>
      )}

      <button type="button" className="primary-button" disabled={!disciplinesReady || !equipmentReady} onClick={confirm}>
        Começar Aventura
      </button>
    </div>
  );
}
