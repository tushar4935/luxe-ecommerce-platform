import { Star } from 'lucide-react';

/**
 * Read-only or interactive star rating.
 * @param value     current rating (0–5, fractional supported in read-only)
 * @param onChange  when provided, renders interactive stars
 */
export default function StarRating({ value = 0, onChange, size = 16, count, className = '' }) {
  const interactive = typeof onChange === 'function';
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <div className="inline-flex">
        {stars.map((s) => {
          const filled = value >= s;
          const half = !filled && value >= s - 0.5;
          const Icon = (
            <Star
              size={size}
              className={
                filled || half ? 'fill-accent text-accent' : 'fill-transparent text-border'
              }
            />
          );
          return interactive ? (
            <button
              key={s}
              type="button"
              onClick={() => onChange(s)}
              aria-label={`Rate ${s} star${s > 1 ? 's' : ''}`}
              className="transition-transform duration-200 hover:scale-110 focus:outline-none"
            >
              {Icon}
            </button>
          ) : (
            <span key={s}>{Icon}</span>
          );
        })}
      </div>
      {count !== undefined && (
        <span className="text-xs text-textSecondary">({count})</span>
      )}
    </div>
  );
}
