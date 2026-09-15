import { useState } from 'react';
import {
  addExtraDiscipline,
  addExtraGrandMasterDiscipline,
  addExtraGrandMasteredWeapon,
  addExtraMagnakaiDiscipline,
  addExtraMasteredWeapon,
  applyDisciplines,
  applyGrandMasterDisciplines,
  applyMagnakaiDisciplines,
  carryOverCharacterToBook,
  chooseEquipmentOptions,
  chooseGrandMasteredWeapons,
  chooseKaiWeapon,
  chooseMasteredWeapons,
  createFreshCharacterForBook,
  KAI_NAME_PREFIXES,
  KAI_NAME_SUFFIXES,
  setKaiName,
} from '../engine/character';
import { getBookEquipment } from '../engine/bookEquipment';
import { getRankForChart } from '../engine/kaiRank';
import {
  ALL_DISCIPLINES,
  ALL_GRAND_MASTER_DISCIPLINES,
  ALL_MAGNAKAI_DISCIPLINES,
  ALL_WEAPONS,
  DISCIPLINE_LABELS,
  GRAND_MASTER_DISCIPLINE_LABELS,
  MAGNAKAI_DISCIPLINE_LABELS,
  type ActionChart,
  type Discipline,
  type GrandMasterDiscipline,
  type MagnakaiDiscipline,
  type WeaponType,
} from '../engine/types';
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
  const isMagnakaiPhase = book.phase === 'magnakai';
  // The New Order phase (Book 21+) reuses the exact same Grand Master Discipline pool and Grand
  // Weaponmastery growth mechanics rather than introducing a parallel system - see the
  // GrandMasterDiscipline doc comment in types.ts. It only differs in its starting discipline count
  // (book.initialDisciplineCount) and rank-ladder baseline (see kaiRank.ts).
  const isGrandMasterPhase = book.phase === 'grand_master' || book.phase === 'new_order';

  const [baseChart] = useState<ActionChart>(() =>
    isCarryOver ? carryOverCharacterToBook(previousChart!, book.id) : createFreshCharacterForBook(book.id),
  );

  // Kai-phase discipline selection (Books 1-5) — unchanged from before Magnakai existed.
  const requiredDisciplines = isCarryOver ? 1 : 5;
  const availableDisciplines = isCarryOver
    ? ALL_DISCIPLINES.filter((d) => !previousChart!.disciplines.includes(d))
    : ALL_DISCIPLINES;
  const [selectedDisciplines, setSelectedDisciplines] = useState<Discipline[]>([]);

  // Magnakai-phase discipline selection (Book 6+) — a wholly separate pool, no conversion from Kai.
  // Entering the phase for the first time means choosing 3 fresh; already having some (a future
  // Book 7+ carry-over) means adding 1 more, mirroring the Kai "+1 per book" shape. Only relevant
  // while book.phase is 'magnakai' — a Grand Master book never re-prompts for Magnakai Disciplines,
  // it just carries the existing array forward untouched (see carryOverCharacterToBook).
  const magnakaiFirstEntry = isMagnakaiPhase && baseChart.magnakaiDisciplines.length === 0;
  const requiredMagnakaiDisciplines = magnakaiFirstEntry ? 3 : 1;
  const availableMagnakaiDisciplines = ALL_MAGNAKAI_DISCIPLINES.filter(
    (d) => !baseChart.magnakaiDisciplines.includes(d),
  );
  const [selectedMagnakaiDisciplines, setSelectedMagnakaiDisciplines] = useState<MagnakaiDiscipline[]>([]);

  // Weaponmastery grants 3 mastered weapons on first pick, chosen separately from — and not implying
  // possession of — any carried weapon. A character who already held Weaponmastery from a previous
  // Magnakai book instead grows the checklist by exactly 1 weapon per completed book (Book 7+). Only
  // relevant while book.phase is 'magnakai' — magnakaiDisciplines/masteredWeapons keep existing (and
  // keep granting their combat.ts bonus) once a character moves on to the Grand Master phase, but
  // this screen must not re-prompt for Magnakai weapon growth there; Grand Weaponmastery's own
  // growth is handled separately below.
  const alreadyHasWeaponmastery = isMagnakaiPhase && baseChart.magnakaiDisciplines.includes('Weaponmastery');
  const gainingWeaponmasteryNow = selectedMagnakaiDisciplines.includes('Weaponmastery');
  const needsFreshMasteredWeapons = gainingWeaponmasteryNow;
  const needsWeaponGrowth = alreadyHasWeaponmastery;
  const needsMasteredWeapons = needsFreshMasteredWeapons || needsWeaponGrowth;
  const requiredMasteredWeapons = needsFreshMasteredWeapons ? 3 : 1;
  const availableWeaponsForMastery = ALL_WEAPONS.filter((w) => !baseChart.masteredWeapons.includes(w));
  const [selectedMasteredWeapons, setSelectedMasteredWeapons] = useState<WeaponType[]>([]);

  // Grand Master-phase discipline selection (Book 13+) — 12 Disciplines, 4 chosen fresh to start
  // (no conversion from Magnakai — magnakaiDisciplines simply keeps applying its own bonuses
  // wherever no Grand Master upgrade supersedes them, see types.ts's GrandMasterDiscipline comment).
  const grandMasterFirstEntry = isGrandMasterPhase && baseChart.grandMasterDisciplines.length === 0;
  const initialGrandMasterDisciplineCount = book.initialDisciplineCount ?? 4;
  const requiredGrandMasterDisciplines = grandMasterFirstEntry ? initialGrandMasterDisciplineCount : 1;
  const availableGrandMasterDisciplines = ALL_GRAND_MASTER_DISCIPLINES.filter(
    (d) => !baseChart.grandMasterDisciplines.includes(d),
  );
  const [selectedGrandMasterDisciplines, setSelectedGrandMasterDisciplines] = useState<GrandMasterDiscipline[]>([]);

  // Grand Weaponmastery grants 2 mastered weapons on first pick (tracked separately from the
  // Magnakai-era masteredWeapons list — see grandMasteredWeapons's doc comment in types.ts), then
  // grows by 1 per completed Grand Master book, same shape as Weaponmastery's own growth.
  const alreadyHasGrandWeaponmastery = baseChart.grandMasterDisciplines.includes('GrandWeaponmastery');
  const gainingGrandWeaponmasteryNow = selectedGrandMasterDisciplines.includes('GrandWeaponmastery');
  const needsFreshGrandMasteredWeapons = gainingGrandWeaponmasteryNow;
  const needsGrandWeaponGrowth = alreadyHasGrandWeaponmastery;
  const needsGrandMasteredWeapons = needsFreshGrandMasteredWeapons || needsGrandWeaponGrowth;
  const requiredGrandMasteredWeapons = needsFreshGrandMasteredWeapons ? 2 : 1;
  const availableWeaponsForGrandMastery = ALL_WEAPONS.filter((w) => !baseChart.grandMasteredWeapons.includes(w));
  const [selectedGrandMasteredWeapons, setSelectedGrandMasteredWeapons] = useState<WeaponType[]>([]);

  const equipmentConfig = getBookEquipment(book.id);
  const needsEquipmentChoice = equipmentConfig.chooseOptions !== undefined;
  const requiredEquipment = equipmentConfig.chooseCount ?? 2;
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);

  // Kai Weapon (Book 21+) — a named weapon chosen (or randomly rolled) once, on top of the normal
  // equipment choice above. Grants a flat Combat Skill bonus while equipped (see combat.ts).
  // `!isCarryOver` matters from Book 22 onward: it also defines a kaiWeaponTable to support a fresh
  // start, but a character carried over from a prior New Order book already has one (kaiWeaponType
  // survives the carryOverCharacterToBook spread) and must not be asked to pick a new one - confirmed
  // in Book 22's equipmnt.htm: "If you have completed the previous... adventure, you already possess
  // a Kai Weapon." Same pattern as needsKaiName below.
  const needsKaiWeapon = equipmentConfig.kaiWeaponTable !== undefined && !isCarryOver;
  const [selectedKaiWeapon, setSelectedKaiWeapon] = useState<string | null>(null);
  const rollRandomKaiWeapon = () => {
    const table = equipmentConfig.kaiWeaponTable!;
    setSelectedKaiWeapon(table[Math.floor(Math.random() * table.length)].name);
  };

  // Kai Name (Book 21+, kainame.htm) — freely chosen or rolled from two 10-entry tables. No earlier
  // phase's character creation ever prompts for this.
  const needsKaiName = book.phase === 'new_order' && !isCarryOver;
  const [kaiNameInput, setKaiNameInput] = useState('');
  const rollRandomKaiName = () => {
    const prefix = KAI_NAME_PREFIXES[Math.floor(Math.random() * KAI_NAME_PREFIXES.length)];
    const suffix = KAI_NAME_SUFFIXES[Math.floor(Math.random() * KAI_NAME_SUFFIXES.length)];
    setKaiNameInput(`${prefix}${suffix}`);
  };

  const toggleDiscipline = (discipline: Discipline) => {
    setSelectedDisciplines((prev) => {
      if (prev.includes(discipline)) return prev.filter((d) => d !== discipline);
      if (prev.length >= requiredDisciplines) return prev;
      return [...prev, discipline];
    });
  };

  const toggleMagnakaiDiscipline = (discipline: MagnakaiDiscipline) => {
    setSelectedMagnakaiDisciplines((prev) => {
      if (prev.includes(discipline)) return prev.filter((d) => d !== discipline);
      if (prev.length >= requiredMagnakaiDisciplines) return prev;
      return [...prev, discipline];
    });
  };

  const toggleMasteredWeapon = (weapon: WeaponType) => {
    setSelectedMasteredWeapons((prev) => {
      if (prev.includes(weapon)) return prev.filter((w) => w !== weapon);
      if (prev.length >= requiredMasteredWeapons) return prev;
      return [...prev, weapon];
    });
  };

  const toggleGrandMasterDiscipline = (discipline: GrandMasterDiscipline) => {
    setSelectedGrandMasterDisciplines((prev) => {
      if (prev.includes(discipline)) return prev.filter((d) => d !== discipline);
      if (prev.length >= requiredGrandMasterDisciplines) return prev;
      return [...prev, discipline];
    });
  };

  const toggleGrandMasteredWeapon = (weapon: WeaponType) => {
    setSelectedGrandMasteredWeapons((prev) => {
      if (prev.includes(weapon)) return prev.filter((w) => w !== weapon);
      if (prev.length >= requiredGrandMasteredWeapons) return prev;
      return [...prev, weapon];
    });
  };

  const toggleEquipment = (id: string) => {
    setSelectedEquipment((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= requiredEquipment) return prev;
      return [...prev, id];
    });
  };

  const disciplinesReady = isGrandMasterPhase
    ? selectedGrandMasterDisciplines.length === requiredGrandMasterDisciplines
    : isMagnakaiPhase
      ? selectedMagnakaiDisciplines.length === requiredMagnakaiDisciplines
      : selectedDisciplines.length === requiredDisciplines;
  const masteredWeaponsReady = !needsMasteredWeapons || selectedMasteredWeapons.length === requiredMasteredWeapons;
  const grandMasteredWeaponsReady =
    !needsGrandMasteredWeapons || selectedGrandMasteredWeapons.length === requiredGrandMasteredWeapons;
  const equipmentReady = !needsEquipmentChoice || selectedEquipment.length === requiredEquipment;
  const kaiWeaponReady = !needsKaiWeapon || selectedKaiWeapon !== null;
  const kaiNameReady = !needsKaiName || kaiNameInput.trim().length > 0;

  const previewRank = isGrandMasterPhase
    ? getRankForChart({
        ...baseChart,
        grandMasterDisciplines: [...baseChart.grandMasterDisciplines, ...selectedGrandMasterDisciplines],
      })
    : isMagnakaiPhase
      ? getRankForChart({
          ...baseChart,
          magnakaiDisciplines: [...baseChart.magnakaiDisciplines, ...selectedMagnakaiDisciplines],
        })
      : getRankForChart({ ...baseChart, disciplines: [...baseChart.disciplines, ...selectedDisciplines] });

  const confirm = () => {
    if (
      !disciplinesReady ||
      !masteredWeaponsReady ||
      !grandMasteredWeaponsReady ||
      !equipmentReady ||
      !kaiWeaponReady ||
      !kaiNameReady
    )
      return;

    let chart: ActionChart;
    if (isGrandMasterPhase) {
      chart = grandMasterFirstEntry
        ? applyGrandMasterDisciplines(baseChart, selectedGrandMasterDisciplines, initialGrandMasterDisciplineCount)
        : addExtraGrandMasterDiscipline(baseChart, selectedGrandMasterDisciplines[0]);
      if (needsFreshGrandMasteredWeapons) {
        chart = chooseGrandMasteredWeapons(chart, selectedGrandMasteredWeapons);
      } else if (needsGrandWeaponGrowth) {
        chart = addExtraGrandMasteredWeapon(chart, selectedGrandMasteredWeapons[0]);
      }
    } else if (isMagnakaiPhase) {
      chart = magnakaiFirstEntry
        ? applyMagnakaiDisciplines(baseChart, selectedMagnakaiDisciplines)
        : addExtraMagnakaiDiscipline(baseChart, selectedMagnakaiDisciplines[0]);
      if (needsFreshMasteredWeapons) {
        chart = chooseMasteredWeapons(chart, selectedMasteredWeapons);
      } else if (needsWeaponGrowth) {
        chart = addExtraMasteredWeapon(chart, selectedMasteredWeapons[0]);
      }
    } else {
      chart = isCarryOver
        ? addExtraDiscipline(baseChart, selectedDisciplines[0])
        : applyDisciplines(baseChart, selectedDisciplines);
    }

    if (needsEquipmentChoice) {
      chart = chooseEquipmentOptions(chart, selectedEquipment);
    }

    if (needsKaiWeapon && selectedKaiWeapon) {
      chart = chooseKaiWeapon(chart, selectedKaiWeapon);
    }

    if (needsKaiName) {
      chart = setKaiName(chart, kaiNameInput);
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
          {baseChart.arrows > 0 ? `, ${baseChart.arrows} Flechas` : ''}
          {baseChart.backpackItems.length > 0 ? `, ${baseChart.backpackItems.join(', ')}` : ''}
          {baseChart.specialItems.length > 0 ? `, ${baseChart.specialItems.map((i) => i.name).join(', ')}` : ''}
          {baseChart.healingPotionDoses > 0
            ? `, ${equipmentConfig.healingPotionLabel}${baseChart.healingPotionDoses > 1 ? ` x${baseChart.healingPotionDoses}` : ''}`
            : ''}
          , {baseChart.goldCrowns} Coroas de Ouro
        </p>
      </section>

      {isGrandMasterPhase ? (
        <section>
          <h3>
            Escolha exatamente {requiredGrandMasterDisciplines} Disciplina{requiredGrandMasterDisciplines > 1 ? 's' : ''}{' '}
            Grand Master nova{requiredGrandMasterDisciplines > 1 ? 's' : ''} ({selectedGrandMasterDisciplines.length}/
            {requiredGrandMasterDisciplines})
          </h3>
          <p className="item-detail">Rank resultante: {previewRank}</p>
          <ul className="discipline-picker">
            {availableGrandMasterDisciplines.map((d) => (
              <li key={d}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedGrandMasterDisciplines.includes(d)}
                    onChange={() => toggleGrandMasterDiscipline(d)}
                    disabled={
                      !selectedGrandMasterDisciplines.includes(d) &&
                      selectedGrandMasterDisciplines.length >= requiredGrandMasterDisciplines
                    }
                  />
                  {GRAND_MASTER_DISCIPLINE_LABELS[d]}
                </label>
              </li>
            ))}
          </ul>
        </section>
      ) : isMagnakaiPhase ? (
        <section>
          <h3>
            Escolha exatamente {requiredMagnakaiDisciplines} Disciplina{requiredMagnakaiDisciplines > 1 ? 's' : ''}{' '}
            Magnakai nova{requiredMagnakaiDisciplines > 1 ? 's' : ''} ({selectedMagnakaiDisciplines.length}/
            {requiredMagnakaiDisciplines})
          </h3>
          <p className="item-detail">Rank resultante: {previewRank}</p>
          <ul className="discipline-picker">
            {availableMagnakaiDisciplines.map((d) => (
              <li key={d}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedMagnakaiDisciplines.includes(d)}
                    onChange={() => toggleMagnakaiDiscipline(d)}
                    disabled={
                      !selectedMagnakaiDisciplines.includes(d) &&
                      selectedMagnakaiDisciplines.length >= requiredMagnakaiDisciplines
                    }
                  />
                  {MAGNAKAI_DISCIPLINE_LABELS[d]}
                </label>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section>
          <h3>
            Escolha exatamente {requiredDisciplines} Disciplina{requiredDisciplines > 1 ? 's' : ''} Kai nova
            {requiredDisciplines > 1 ? 's' : ''} ({selectedDisciplines.length}/{requiredDisciplines})
          </h3>
          <p className="item-detail">Rank resultante: {previewRank}</p>
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
      )}

      {needsMasteredWeapons && (
        <section>
          <h3>
            {needsFreshMasteredWeapons
              ? `Escolha exatamente 3 armas para Maestria (Weaponmastery) (${selectedMasteredWeapons.length}/3)`
              : `Escolha 1 arma nova para adicionar à Maestria (Weaponmastery) (${selectedMasteredWeapons.length}/1)`}
          </h3>
          <p className="item-detail">
            Ser hábil com uma arma não significa começar a aventura carregando ela — isso é escolhido
            separadamente no equipamento abaixo.
          </p>
          <ul className="discipline-picker">
            {availableWeaponsForMastery.map((w) => (
              <li key={w}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedMasteredWeapons.includes(w)}
                    onChange={() => toggleMasteredWeapon(w)}
                    disabled={
                      !selectedMasteredWeapons.includes(w) && selectedMasteredWeapons.length >= requiredMasteredWeapons
                    }
                  />
                  {w}
                </label>
              </li>
            ))}
          </ul>
        </section>
      )}

      {needsGrandMasteredWeapons && (
        <section>
          <h3>
            {needsFreshGrandMasteredWeapons
              ? `Escolha exatamente 2 armas para Grand Weaponmastery (${selectedGrandMasteredWeapons.length}/2)`
              : `Escolha 1 arma nova para adicionar ao Grand Weaponmastery (${selectedGrandMasteredWeapons.length}/1)`}
          </h3>
          <p className="item-detail">
            Ser hábil com uma arma não significa começar a aventura carregando ela — isso é escolhido
            separadamente no equipamento abaixo.
          </p>
          <ul className="discipline-picker">
            {availableWeaponsForGrandMastery.map((w) => (
              <li key={w}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedGrandMasteredWeapons.includes(w)}
                    onChange={() => toggleGrandMasteredWeapon(w)}
                    disabled={
                      !selectedGrandMasteredWeapons.includes(w) &&
                      selectedGrandMasteredWeapons.length >= requiredGrandMasteredWeapons
                    }
                  />
                  {w}
                </label>
              </li>
            ))}
          </ul>
        </section>
      )}

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

      {needsKaiName && (
        <section>
          <h3>Seu Nome Kai</h3>
          <p className="item-detail">Crie seu próprio nome Kai ou sorteie um aleatoriamente.</p>
          <input
            type="text"
            value={kaiNameInput}
            onChange={(e) => setKaiNameInput(e.target.value)}
            placeholder="Digite um nome"
          />
          <button type="button" onClick={rollRandomKaiName}>
            Sortear aleatoriamente
          </button>
        </section>
      )}

      {needsKaiWeapon && (
        <section>
          <h3>Escolha sua Arma Kai</h3>
          <p className="item-detail">
            Concede +5 Combat Skill enquanto equipada (soma com o bônus de Grand Weaponmastery, se o
            tipo de arma coincidir).
          </p>
          <ul className="discipline-picker">
            {equipmentConfig.kaiWeaponTable!.map((w) => (
              <li key={w.name}>
                <label>
                  <input
                    type="radio"
                    name="kai-weapon"
                    checked={selectedKaiWeapon === w.name}
                    onChange={() => setSelectedKaiWeapon(w.name)}
                  />
                  {w.name} ({w.weaponType})
                </label>
              </li>
            ))}
          </ul>
          <button type="button" onClick={rollRandomKaiWeapon}>
            Sortear aleatoriamente
          </button>
        </section>
      )}

      <button
        type="button"
        className="primary-button"
        disabled={
          !disciplinesReady ||
          !masteredWeaponsReady ||
          !grandMasteredWeaponsReady ||
          !equipmentReady ||
          !kaiWeaponReady ||
          !kaiNameReady
        }
        onClick={confirm}
      >
        Começar Aventura
      </button>
    </div>
  );
}
