import { Link } from 'react-router-dom';
import Button from './Button';

/**
 * Reusable empty-state block with an illustration-style icon, message and CTA.
 */
export default function EmptyState({ icon: Icon, title, message, ctaLabel, ctaTo, onCta }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
      {Icon && (
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-border bg-card text-textMuted">
          <Icon size={40} strokeWidth={1.25} />
        </div>
      )}
      <h3 className="mb-2 font-serif text-2xl text-textPrimary">{title}</h3>
      {message && <p className="mb-6 max-w-md text-sm text-textSecondary">{message}</p>}
      {ctaLabel &&
        (ctaTo ? (
          <Link to={ctaTo}>
            <Button>{ctaLabel}</Button>
          </Link>
        ) : (
          <Button onClick={onCta}>{ctaLabel}</Button>
        ))}
    </div>
  );
}
