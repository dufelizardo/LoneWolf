import { useState } from 'react';
import {
  addExtraMagicalPower,
  carryOverGreyStarCharacterToBook,
  chooseHigherMagicalPowers,
  chooseMagicalPowers,
  chooseStartingGift,
  computeMoonstoneCarryOver,
  computeThreeMethodWillpowerCarryOver,
  createFreshGreyStarCharacter,
  grantMoonstone,
  rollWillpowerForLaterBookCarryOver,
  type GreyStarCarryOverPatch,
  type GreyStarWillpowerCarryOverMethod,
} from '../engine/greyStarCharacter';
import { getGreyStarBookEquipment } from '../data/greyStarBookEquipment';
import {
  ALL_HIGHER_MAGICAL_POWERS,
  ALL_MAGICAL_POWERS,
  HIGHER_MAGICAL_POWER_LABELS,
  MAGICAL_POWER_LABELS,
  STARTING_GIFT_LABELS,
  type GreyStarActionChart,
  type HigherMagicalPower,
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
  const usesThreeMethods = equipmentConfig.willpowerCarryOverMode === 'threeMethods';
  const usesMoonstoneBonus = equipmentConfig.willpowerCarryOverMode === 'moonstoneBonus';

  const [baseChart] = useState<GreyStarActionChart>(() =>
    isCarryOver ? previousChart! : createFreshGreyStarCharacter(book.id),
  );

  // Fresh-start state
  const [selectedPowers, setSelectedPowers] = useState<MagicalPower[]>([]);
  const needsGift = !isCarryOver && equipmentConfig.grantsStartingGift;
  const [selectedGift, setSelectedGift] = useState<StartingGift | null>(null);
  const requiredHigherPowersFresh = !isCarryOver ? equipmentConfig.higherMagicalPowerCount?.fresh : undefined;
  const [selectedHigherPowersFresh, setSelectedHigherPowersFresh] = useState<HigherMagicalPower[]>([]);

  // Carry-over state - WILLPOWER (and, for 'moonstoneBonus', ENDURANCE) recalculation
  const [willpowerMethod, setWillpowerMethod] = useState<GreyStarWillpowerCarryOverMethod | null>(null);
  // 'autoReroll'/'moonstoneBonus' books have no player choice - compute once, up front, same pattern as
  // the fresh-start attribute rolls in createFreshGreyStarCharacter.
  const [autoRolledWillpower] = useState<number>(() =>
    isCarryOver && equipmentConfig.willpowerCarryOverMode === 'autoReroll'
      ? rollWillpowerForLaterBookCarryOver(previousChart!)
      : 0,
  );
  const [moonstoneCarryOver] = useState<{ willpowerCurrent: number; enduranceCurrent: number; enduranceMax: number } | null>(
    () => (isCarryOver && usesMoonstoneBonus ? computeMoonstoneCarryOver(previousChart!) : null),
  );

  // Carry-over state - the one-time "6th Lesser Magick" step, which only ever applies the first time a
  // character is carried over (a character already at 6 powers has already been through this once).
  const needsExtraPower = isCarryOver && previousChart!.magicalPowers.length === 5;
  const availableExtraPowers = needsExtraPower
    ? ALL_MAGICAL_POWERS.filter((p) => !previousChart!.magicalPowers.includes(p))
    : [];
  const [selectedExtraPower, setSelectedExtraPower] = useState<MagicalPower | null>(null);

  // Carry-over state - Higher Magicks (Book 4+), the first time a character is ever exposed to them.
  const needsHigherPowersCarryOver =
    isCarryOver && equipmentConfig.higherMagicalPowerCount !== undefined && previousChart!.higherMagicalPowers.length === 0;
  const requiredHigherPowersCarryOver = needsHigherPowersCarryOver
    ? equipmentConfig.higherMagicalPowerCount!.carryOver
    : undefined;
  const [selectedHigherPowersCarryOver, setSelectedHigherPowersCarryOver] = useState<HigherMagicalPower[]>([]);

  const togglePower = (power: MagicalPower) => {
    setSelectedPowers((prev) => {
      if (prev.includes(power)) return prev.filter((p) => p !== power);
      if (prev.length >= REQUIRED_POWERS) return prev;
      return [...prev, power];
    });
  };

  const toggleHigherPower = (
    power: HigherMagicalPower,
    setSelected: (fn: (prev: HigherMagicalPower[]) => HigherMagicalPower[]) => void,
    required: number,
  ) => {
    setSelected((prev) => {
      if (prev.includes(power)) return prev.filter((p) => p !== power);
      if (prev.length >= required) return prev;
      return [...prev, power];
    });
  };

  const powersReady = selectedPowers.length === REQUIRED_POWERS;
  const giftReady = !needsGift || selectedGift !== null;
  const higherPowersFreshReady =
    requiredHigherPowersFresh === undefined || selectedHigherPowersFresh.length === requiredHigherPowersFresh;
  const willpowerMethodReady = !isCarryOver || !usesThreeMethods || willpowerMethod !== null;
  const extraPowerReady = !needsExtraPower || selectedExtraPower !== null;
  const higherPowersCarryOverReady =
    !needsHigherPowersCarryOver || selectedHigherPowersCarryOver.length === requiredHigherPowersCarryOver;

  const confirm = () => {
    if (isCarryOver) {
      if (!willpowerMethodReady || !extraPowerReady || !higherPowersCarryOverReady) return;
      const patch: GreyStarCarryOverPatch = usesMoonstoneBonus
        ? moonstoneCarryOver!
        : {
            willpowerCurrent: usesThreeMethods
              ? computeThreeMethodWillpowerCarryOver(previousChart!, willpowerMethod!)
              : autoRolledWillpower,
          };
      let chart = carryOverGreyStarCharacterToBook(previousChart!, book.id, patch);
      if (needsExtraPower) chart = addExtraMagicalPower(chart, selectedExtraPower!);
      if (needsHigherPowersCarryOver) {
        chart = chooseHigherMagicalPowers(chart, selectedHigherPowersCarryOver, requiredHigherPowersCarryOver!);
      }
      if (equipmentConfig.grantsMoonstone) chart = grantMoonstone(chart);
      onReady(chart);
      return;
    }

    if (!powersReady || !giftReady || !higherPowersFreshReady) return;
    let chart = chooseMagicalPowers(baseChart, selectedPowers);
    if (needsGift) chart = chooseStartingGift(chart, selectedGift!);
    if (requiredHigherPowersFresh !== undefined) {
      chart = chooseHigherMagicalPowers(chart, selectedHigherPowersFresh, requiredHigherPowersFresh);
    }
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

        {usesThreeMethods && (
          <section>
            <h3>Como recalcular seu WILLPOWER?</h3>
            <p className="item-detail">
              Seus poderes de feitiçaria cresceram - de qualquer forma, você soma 10 pontos. O livro
              reconhece que manter o WILLPOWER atual "não parece justo" (costuma estar baixo ao fim de
              uma aventura), então você pode escolher entre 3 métodos.
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
        )}

        {equipmentConfig.willpowerCarryOverMode === 'autoReroll' && (
          <section>
            <h3>Novo WILLPOWER: {autoRolledWillpower}</h3>
            <p className="item-detail">
              O livro reconhece que pedir pra rolar os 3 atributos do zero "não tem precedente" e é
              provavelmente um erro - por isso seu COMBAT SKILL e ENDURANCE continuam os mesmos, só o
              WILLPOWER é re-rolado (com um bônus que cresce conforme o progresso na série).
            </p>
          </section>
        )}

        {usesMoonstoneBonus && moonstoneCarryOver && (
          <section>
            <h3>
              Novo WILLPOWER: {moonstoneCarryOver.willpowerCurrent} · Novo ENDURANCE:{' '}
              {moonstoneCarryOver.enduranceCurrent}/{moonstoneCarryOver.enduranceMax}
            </h3>
            <p className="item-detail">
              O primeiro toque na Moonstone regenera seus poderes: +50 WILLPOWER e +30 ENDURANCE somados
              aos seus valores finais do livro anterior (sem rolagem, sem escolha) - inclusive elevando
              seu teto de ENDURANCE, algo que nenhum outro livro da série faz. Seu COMBAT SKILL continua
              o mesmo.
            </p>
          </section>
        )}

        {needsExtraPower && (
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
        )}

        {needsHigherPowersCarryOver && (
          <section>
            <h3>
              Escolha exatamente {requiredHigherPowersCarryOver} Higher Magicks (
              {selectedHigherPowersCarryOver.length}/{requiredHigherPowersCarryOver})
            </h3>
            <p className="item-detail">
              A posse da Moonstone revela um segundo nível de poderes. Escolher Theurgy sem já ter
              Alchemy também concede o Herb Pouch.
            </p>
            <ul className="discipline-picker">
              {ALL_HIGHER_MAGICAL_POWERS.map((power) => (
                <li key={power}>
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedHigherPowersCarryOver.includes(power)}
                      onChange={() =>
                        toggleHigherPower(power, setSelectedHigherPowersCarryOver, requiredHigherPowersCarryOver!)
                      }
                      disabled={
                        !selectedHigherPowersCarryOver.includes(power) &&
                        selectedHigherPowersCarryOver.length >= requiredHigherPowersCarryOver!
                      }
                    />
                    {HIGHER_MAGICAL_POWER_LABELS[power]}
                  </label>
                </li>
              ))}
            </ul>
          </section>
        )}

        <button
          type="button"
          className="primary-button"
          disabled={!willpowerMethodReady || !extraPowerReady || !higherPowersCarryOverReady}
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

      {requiredHigherPowersFresh !== undefined && (
        <section>
          <h3>
            Escolha exatamente {requiredHigherPowersFresh} Higher Magicks ({selectedHigherPowersFresh.length}/
            {requiredHigherPowersFresh})
          </h3>
          <p className="item-detail">
            A posse da Moonstone revela um segundo nível de poderes. Escolher Theurgy sem escolher
            Alchemy também concede o Herb Pouch.
          </p>
          <ul className="discipline-picker">
            {ALL_HIGHER_MAGICAL_POWERS.map((power) => (
              <li key={power}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedHigherPowersFresh.includes(power)}
                    onChange={() =>
                      toggleHigherPower(power, setSelectedHigherPowersFresh, requiredHigherPowersFresh)
                    }
                    disabled={
                      !selectedHigherPowersFresh.includes(power) &&
                      selectedHigherPowersFresh.length >= requiredHigherPowersFresh
                    }
                  />
                  {HIGHER_MAGICAL_POWER_LABELS[power]}
                </label>
              </li>
            ))}
          </ul>
        </section>
      )}

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

      <button
        type="button"
        className="primary-button"
        disabled={!powersReady || !giftReady || !higherPowersFreshReady}
        onClick={confirm}
      >
        Começar Aventura
      </button>
    </div>
  );
}
