import type { Choice } from '../data/section-types';

interface Props {
  choices: Choice[];
  onChoose: (targetSection: number) => void;
}

export function ChoiceList({ choices, onChoose }: Props) {
  return (
    <div className="choice-list">
      {choices.map((choice, index) => (
        <button
          key={`${choice.targetSection}-${index}`}
          type="button"
          className="choice-button"
          onClick={() => onChoose(choice.targetSection)}
        >
          {choice.text}
        </button>
      ))}
    </div>
  );
}
