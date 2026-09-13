import { useState } from 'react';

interface Props {
  maxSection: number;
  onGo: (targetSection: number) => void;
}

/**
 * Fallback navigation for sections the parser can't resolve automatically — currently reader-solved
 * puzzles (hasPuzzle) whose "turn to that section number" instruction depends on decoding something
 * from the story/an illustration, not a parseable link. The player still has to work out the number
 * themselves; this only lets them act on it instead of getting stuck.
 */
export function ManualSectionJump({ maxSection, onGo }: Props) {
  const [value, setValue] = useState('');

  const parsed = Number(value);
  const isValid = value.trim() !== '' && Number.isInteger(parsed) && parsed >= 1 && parsed <= maxSection;

  return (
    <div className="manual-section-jump">
      <label>
        Ir para a seção nº{' '}
        <input
          type="number"
          min={1}
          max={maxSection}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </label>
      <button type="button" className="primary-button" disabled={!isValid} onClick={() => isValid && onGo(parsed)}>
        Ir
      </button>
    </div>
  );
}
