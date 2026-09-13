import bookIntros from '../data/book-intros.json';
import type { BookMeta } from '../data/books';
import type { ActionChart } from '../engine/types';
import type { CreationMode } from '../App';

const INTROS = bookIntros as unknown as Record<string, { html: string }>;

interface Props {
  book: BookMeta;
  previousChart: ActionChart | null;
  onContinue: (mode: CreationMode) => void;
}

export function BookIntroScreen({ book, previousChart, onContinue }: Props) {
  const intro = INTROS[book.id];

  return (
    <div className="book-intro-screen">
      <h1>{book.title}</h1>
      <h2>The Story So Far…</h2>
      {intro && <div className="section-body" dangerouslySetInnerHTML={{ __html: intro.html }} />}

      <div className="button-row">
        {previousChart ? (
          <>
            <button type="button" className="primary-button" onClick={() => onContinue('carryover')}>
              Transferir personagem do livro anterior
            </button>
            <button type="button" onClick={() => onContinue('fresh')}>
              Começar do zero
            </button>
          </>
        ) : (
          <button type="button" className="primary-button" onClick={() => onContinue('fresh')}>
            Continuar
          </button>
        )}
      </div>
    </div>
  );
}
