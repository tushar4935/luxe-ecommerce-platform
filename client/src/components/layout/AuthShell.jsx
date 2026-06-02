import { Link } from 'react-router-dom';

/**
 * Centered auth card on a dark background with a blurred gold radial glow.
 */
export default function AuthShell({ children, maxWidth = 'max-w-md' }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      {/* Radial glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 rounded-full opacity-30 blur-[120px]"
        style={{ background: 'radial-gradient(circle, #c9a84c 0%, transparent 70%)' }}
      />
      <div className={`relative w-full ${maxWidth}`}>
        <div className="mb-8 text-center">
          <Link to="/" className="font-serif text-3xl font-bold tracking-wider text-accent">
            LUXE
          </Link>
        </div>
        <div className="rounded-card border border-border bg-surface/90 p-8 shadow-modal backdrop-blur">
          {children}
        </div>
        <p className="mt-6 text-center text-xs text-textMuted">
          © {new Date().getFullYear()} LUXE. Crafted for modern living.
        </p>
      </div>
    </div>
  );
}
