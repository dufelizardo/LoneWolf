import { useState } from 'react';
import {
  addExtraMagicalPower,
  carryOverGreyStarCharacterToBook,
  chooseMagicalPowers,
  chooseStartingGift,
  createFreshGreyStarCharacter,
  type GreyStarWillpowerCarryOverMethod,
} from '../engine/greyStarCharacter';
import { getGreyStarBookEquipment } from '../data/greyStarBookEquipment';
import {
  ALL_MAGICAL_POWERS,
  MAGICAL_POWER_LABELS,
  STARTING_GIFT_LABELS,
  type GreyStarActionChart,
  type MagicalPower,
  type StartingGift,
} from '../engine/greyStarTypes';
import type { BookMeta } from '../data/books';
import type { CreationMode } from '../App';

interface Props {
  book: BookMeta;
  creationMode: CreationMode;
  previousChart: GreyStarActionChart | null;
  onReady: (chart: GreyStarActionChart) => void;
}

const REQUIRED_POWERS = 5;
const STARTING_GIFTS: StartingGift[] = ['JewelledDagger', 'MagicTalisman', 'VialOfLaumspur'];

const WILLPOWER_METHOD_LABELS: Record<GreyStarWillpowerCarryOverMethod, string> = {
  keepCurrent: 'Manter o WILLPOWER atual (fim do livro anterior) + 10',
  reroll: 'Rolar um WILLPOWER novo (20 + d10) + 10',
  useStarting: 'Usar o WILLPOWER inicial do livro anterior + 10',
};

export function GreyStarCharacterCreationScreen({ book, creationMode, previousChart, onReady }: Props) {
  const isCarryOver = creationMode === 'carryover' && previousChart !== null;
  const equipmentConfig = getGreyStarBookEquipment(book.id);

  const [baseChart] = useState<GreyStarActionChart>(() =>
    isCarryOver ? previousChart! : createFreshGreyStarCharacter(book.id),
  );

  // Fresh-start state
  const [selectedPowers, setSelectedPowers] = useState<MagicalPower[]>([]);
  const needsGift = !isCarryOver && equipmentConfig.grantsStartingGift;
  const [selectedGift, setSelectedGift] = useState<StartingGift | null>(null);

  // Carry-over state
  const [willpowerMethod, setWillpowerMethod] = useState<GreyStarWillpowerCarryOverMethod | null>(null);
  const availableExtraPowers = isCarryOver
    ? ALL_MAGICAL_POWERS.filter((p) => !previousChart!.magicalPowers.includes(p))
    : [];
  const [selectedExtraPower, setSelectedExtraPower] = useState<MagicalPower | null>(null);

  const togglePower = (power: MagicalPower) => {
    setSelectedPowers((prev) => {
      if (prev.includes(power)) return prev.filter((p) => p !== power);
      if (prev.length >= REQUIRED_POWERS) return prev;
      return [...prev, power];
    });
  };

  const powersReady = selectedPowers.length === REQUIRED_POWERS;
  const giftReady = !needsGift || selectedGift !== null;
  const willpowerMethodReady = !isCarryOver || willpowerMethod !== null;
  const extraPowerReady = !isCarryOver || selectedExtraPower !== null;

  const confirm = () => {
    if (isCarryOver) {
      if (!willpowerMethodReady || !extraPowerReady) return;
      let chart = carryOverGreyStarCharacterToBook(previousChart!, book.id, willpowerMethod!);
      chart = addExtraMagicalPower(chart, selectedExtraPower!);
      onReady(chart);
      return;
    }

    if (!powersReady || !giftReady) return;
    let chart = chooseMagicalPowers(baseChart, selectedPowers);
    if (needsGift) chart = chooseStartingGift(chart, selectedGift!);
    onReady(chart);
  };

  if (isCarryOver) {
    return (
      <div className="creation-screen">
        <h1>{book.title}</h1>
        <h2>Transferir Mago Shianti</h2>

        <section className="stat-block">
          <p>
            <strong>COMBAT SKILL:</strong> {baseChart.combatSkill}
          </p>
          <p>
            <strong>ENDURANCE:</strong> {baseChart.enduranceCurrent} / {baseChart.enduranceMax}
          </p>
          <p>
            <strong>WILLPOWER atual (herdado):</strong> {baseChart.willpowerCurrent}
          </p>
          <p>
            <strong>Equipamento herdado:</strong> {baseChart.weapons.join(', ') || '(nenhuma arma)'}
            {baseChart.backpackItems.length > 0 ? `, ${baseChart.backpackItems.join(', ')}` : ''}
            {baseChart.specialItems.length > 0 ? `, ${baseChart.specialItems.map((i) => i.name).join(', ')}` : ''}
            , {baseChart.nobles} Nobles
          </p>
        </section>

        <section>
          <h3>Como recalcular seu WILLPOWER?</h3>
          <p className="item-detail">
            Seus poderes de feitiçaria cresceram - de qualquer forma, você soma 10 pontos. O livro
            reconhece que manter o WILLPOWER atual "não parece justo" (costuma estar baixo ao fim de uma
            aventura), então você pode escolher entre 3 métodos.
          </p>
          <ul className="discipline-picker">
            {(Object.keys(WILLPOWER_METHOD_LABELS) as GreyStarWillpowerCarryOverMethod[]).map((method) => (
              <li key={method}>
                <label>
                  <input
                    type="radio"
                    name="willpower-method"
                    checked={willpowerMethod === method}
                    onChange={() => setWillpowerMethod(method)}
                  />
                  {WILLPOWER_METHOD_LABELS[method]}
                </label>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3>Escolha mais 1 Magical Power ({availableExtraPowers.length} disponíveis)</h3>
          <p className="item-detail">
            Se escolher Alchemy e ainda não tiver, você ganha o Herb Pouch agora.
          </p>
          <ul className="discipline-picker">
            {availableExtraPowers.map((power) => (
              <li key={power}>
                <label>
                  <input
                    type="radio"
                    name="extra-power"
                    checked={selectedExtraPower === power}
                    onChange={() => setSelectedExtraPower(power)}
                  />
                  {MAGICAL_POWER_LABELS[power]}
                </label>
              </li>
            ))}
          </ul>
        </section>

        <button
          type="button"
          className="primary-button"
          disabled={!willpowerMethodReady || !extraPowerReady}
          onClick={confirm}
        >
          Começar Aventura
        </button>
      </div>
    );
  }

  return (
    <div className="creation-screen">
      <h1>{book.title}</h1>
      <h2>Criação do Mago Shianti</h2>

      <section className="stat-block">
        <p>
          <strong>COMBAT SKILL:</strong> {baseChart.combatSkill}
        </p>
        <p>
          <strong>WILLPOWER:</strong> {baseChart.willpowerCurrent}
        </p>
        <p>
          <strong>ENDURANCE:</strong> {baseChart.enduranceCurrent}
        </p>
        <p>
          <strong>Equipamento inicial:</strong> {baseChart.weapons.join(', ')}, {baseChart.meals} Refeição(ões),{' '}
          {baseChart.specialItems.map((i) => i.name).join(', ')}, {baseChart.nobles} Nobles
        </p>
      </section>

      <section>
        <h3>
          Escolha exatamente {REQUIRED_POWERS} Magical Powers ({selectedPowers.length}/{REQUIRED_POWERS})
        </h3>
        <p className="item-detail">
          Escolher Alchemy concede um Herb Pouch (3º container de inventário) com 2 Empty Vials, 1 Vial of
          Saltpetre e 1 Vial of Sulphur.
        </p>
        <ul className="discipline-picker">
          {ALL_MAGICAL_POWERS.map((power) => (
            <li key={power}>
              <label>
                <input
                  type="checkbox"
                  checked={selectedPowers.includes(power)}
                  onChange={() => togglePower(power)}
                  disabled={!selectedPowers.includes(power) && selectedPowers.length >= REQUIRED_POWERS}
                />
                {MAGICAL_POWER_LABELS[power]}
              </label>
            </li>
          ))}
        </ul>
      </section>

      {needsGift && (
        <section>
          <h3>Escolha o presente de despedida dos Mestres Shianti</h3>
          <ul className="discipline-picker">
            {STARTING_GIFTS.map((gift) => (
              <li key={gift}>
                <label>
                  <input
                    type="radio"
                    name="starting-gift"
                    checked={selectedGift === gift}
                    onChange={() => setSelectedGift(gift)}
                  />
                  {STARTING_GIFT_LABELS[gift]}
                </label>
              </li>
            ))}
          </ul>
        </section>
      )}

      <button type="button" className="primary-button" disabled={!powersReady || !giftReady} onClick={confirm}>
        Começar Aventura
      </button>
    </div>
  );
}
