import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-accent text-background hover:bg-accent-light',
  secondary: 'border border-accent text-accent hover:bg-accent hover:text-background',
  ghost: 'border border-border text-textPrimary hover:border-accent hover:text-accent',
  danger: 'bg-error text-white hover:bg-red-600',
  subtle: 'bg-card text-textPrimary hover:bg-border',
};

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded font-medium transition-all duration-300 ease-luxe focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 ${
        variants[variant]
      } ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}
