import { useState } from 'react';
import { rollRandomNumber } from '../engine/rng';
import type { RandomRange } from '../data/section-types';

interface Props {
  ranges: RandomRange[];
  onResolved: (targetSection: number) => void;
}

export function RandomNumberBranch({ ranges, onResolved }: Props) {
  const [rolled, setRolled] = useState<number | null>(null);

  const match = rolled === null ? null : ranges.find((r) => rolled >= r.min && rolled <= r.max) ?? null;

  return (
    <div className="random-branch">
      {rolled === null ? (
        <button type="button" className="primary-button" onClick={() => setRolled(rollRandomNumber())}>
          Sortear número (Random Number Table)
        </button>
      ) : (
        <>
          <p className="random-roll-result">
            Você sorteou <strong>{rolled}</strong>.
          </p>
          <button
            type="button"
            className="primary-button"
            onClick={() => match && onResolved(match.targetSection)}
            disabled={!match}
          >
            Continuar
          </button>
        </>
      )}
    </div>
  );
}
