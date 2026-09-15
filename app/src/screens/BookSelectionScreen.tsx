import { BOOKS, PHASE_SECTIONS } from '../data/books';
import type { CampaignProgress } from '../engine/types';

interface Props {
  campaign: CampaignProgress;
  onSelectBook: (bookId: string) => void;
}

export function BookSelectionScreen({ campaign, onSelectBook }: Props) {
  const sorted = [...BOOKS].sort((a, b) => a.order - b.order);

  return (
    <div className="book-selection-screen">
      <h1>Lone Wolf</h1>
      <h2>Escolha o livro</h2>
      {PHASE_SECTIONS.map((section) => {
        const books = sorted.filter((book) => book.phase === section.phase);
        return (
          <section key={section.label} className="phase-section">
            <h3 className="phase-heading">{section.label}</h3>
            {section.phase === null ? (
              <p className="phase-placeholder">Em breve.</p>
            ) : (
              <ul className="book-list">
                {books.map((book) => {
                  const index = sorted.indexOf(book);
                  const previous = sorted[index - 1];
                  // A book that doesn't support carrying a character over (currently only Book 21,
                  // the fresh-start opener of the New Order phase) is a standalone entry point in its
                  // own right, same as Book 1 - the player can jump straight into it without having
                  // completed anything before it.
                  const unlocked =
                    index === 0 ||
                    book.allowsCarryOver === false ||
                    (previous && Boolean(campaign.completedBooks[previous.id]));
                  const completed = Boolean(campaign.completedBooks[book.id]);
                  return (
                    <li key={book.id} className={`book-list-item ${unlocked ? 'unlocked' : 'locked'}`}>
                      {unlocked ? (
                        <button type="button" onClick={() => onSelectBook(book.id)}>
                          {book.order}. {book.title}
                          {completed ? ' ✓' : ''}
                        </button>
                      ) : (
                        <span>
                          🔒 {book.order}. {book.title}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
