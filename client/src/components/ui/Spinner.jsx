import { Loader2 } from 'lucide-react';

export default function Spinner({ size = 24, className = '' }) {
  return (
    <span className={`inline-flex items-center justify-center text-accent ${className}`}>
      <Loader2 size={size} className="animate-spin" />
    </span>
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner size={36} />
    </div>
  );
}
