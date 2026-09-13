import { BOOKS } from '../data/books';
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
      <ul className="book-list">
        {sorted.map((book, index) => {
          const previous = sorted[index - 1];
          const unlocked = index === 0 || (previous && Boolean(campaign.completedBooks[previous.id]));
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
    </div>
  );
}
