import { useState } from 'react';
import { chooseMagicalPowers, chooseStartingGift, createFreshGreyStarCharacter } from '../engine/greyStarCharacter';
import {
  ALL_MAGICAL_POWERS,
  MAGICAL_POWER_LABELS,
  STARTING_GIFT_LABELS,
  type GreyStarActionChart,
  type MagicalPower,
  type StartingGift,
} from '../engine/greyStarTypes';
import type { BookMeta } from '../data/books';

interface Props {
  book: BookMeta;
  onReady: (chart: GreyStarActionChart) => void;
}

const REQUIRED_POWERS = 5;
const STARTING_GIFTS: StartingGift[] = ['JewelledDagger', 'MagicTalisman', 'VialOfLaumspur'];

export function GreyStarCharacterCreationScreen({ book, onReady }: Props) {
  const [baseChart] = useState<GreyStarActionChart>(() => createFreshGreyStarCharacter(book.id));
  const [selectedPowers, setSelectedPowers] = useState<MagicalPower[]>([]);
  const [selectedGift, setSelectedGift] = useState<StartingGift | null>(null);

  const togglePower = (power: MagicalPower) => {
    setSelectedPowers((prev) => {
      if (prev.includes(power)) return prev.filter((p) => p !== power);
      if (prev.length >= REQUIRED_POWERS) return prev;
      return [...prev, power];
    });
  };

  const powersReady = selectedPowers.length === REQUIRED_POWERS;
  const giftReady = selectedGift !== null;

  const confirm = () => {
    if (!powersReady || !giftReady) return;
    let chart = chooseMagicalPowers(baseChart, selectedPowers);
    chart = chooseStartingGift(chart, selectedGift!);
    onReady(chart);
  };

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

      <button type="button" className="primary-button" disabled={!powersReady || !giftReady} onClick={confirm}>
        Começar Aventura
      </button>
    </div>
  );
}
