import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Numbered pagination with prev/next. Collapses long ranges with ellipses.
 */
export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;

  const range = [];
  const add = (n) => range.push(n);
  const window = 1; // neighbors on each side

  for (let i = 1; i <= pages; i += 1) {
    if (i === 1 || i === pages || (i >= page - window && i <= page + window)) {
      add(i);
    } else if (range[range.length - 1] !== '…') {
      add('…');
    }
  }

  const btn =
    'flex h-10 min-w-10 items-center justify-center rounded border px-3 text-sm transition-colors duration-300';

  return (
    <nav className="flex items-center justify-center gap-2" aria-label="Pagination">
      <button
        className={`${btn} border-border text-textSecondary hover:border-accent hover:text-accent disabled:opacity-40 disabled:hover:border-border disabled:hover:text-textSecondary`}
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </button>

      {range.map((n, idx) =>
        n === '…' ? (
          <span key={`e${idx}`} className="px-2 text-textMuted">
            …
          </span>
        ) : (
          <button
            key={n}
            onClick={() => onChange(n)}
            aria-current={n === page ? 'page' : undefined}
            className={`${btn} ${
              n === page
                ? 'border-accent bg-accent text-background'
                : 'border-border text-textSecondary hover:border-accent hover:text-accent'
            }`}
          >
            {n}
          </button>
        )
      )}

      <button
        className={`${btn} border-border text-textSecondary hover:border-accent hover:text-accent disabled:opacity-40 disabled:hover:border-border disabled:hover:text-textSecondary`}
        onClick={() => onChange(page + 1)}
        disabled={page >= pages}
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
