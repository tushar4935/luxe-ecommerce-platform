import { forwardRef } from 'react';

const Input = forwardRef(function Input(
  { label, error, hint, className = '', containerClassName = '', icon: Icon, ...props },
  ref
) {
  return (
    <div className={containerClassName}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-textSecondary">{label}</label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-textMuted"
          />
        )}
        <input
          ref={ref}
          className={`w-full rounded border bg-card px-4 py-3 text-textPrimary placeholder:text-textMuted transition-colors duration-300 focus:outline-none ${
            Icon ? 'pl-10' : ''
          } ${error ? 'border-error focus:border-error' : 'border-border focus:border-accent'} ${className}`}
          aria-invalid={Boolean(error)}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-textMuted">{hint}</p>}
    </div>
  );
});

export default Input;
