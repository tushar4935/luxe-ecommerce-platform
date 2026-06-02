import toast from 'react-hot-toast';

/**
 * Social login buttons. UI-only in this demo — clicking shows a toast since
 * no OAuth provider is wired up.
 */
export default function SocialAuth() {
  const notImplemented = (provider) => () =>
    toast(`${provider} sign-in is not configured in this demo`);

  return (
    <div>
      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-wider text-textMuted">or continue with</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={notImplemented('Google')}
          className="flex items-center justify-center gap-2 rounded border border-border py-2.5 text-sm text-textPrimary transition-colors hover:border-accent"
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3-3A10 10 0 0 0 2.6 7l3.5 2.7A6 6 0 0 1 12 5z" />
            <path fill="#4285F4" d="M22 12.2c0-.7-.1-1.4-.2-2H12v4h5.6a4.8 4.8 0 0 1-2 3.1l3.1 2.4A10 10 0 0 0 22 12.2z" />
            <path fill="#FBBC05" d="M6.1 14.3a6 6 0 0 1 0-4.6L2.6 7a10 10 0 0 0 0 10l3.5-2.7z" />
            <path fill="#34A853" d="M12 23a10 10 0 0 0 6.7-2.5l-3.1-2.4a6 6 0 0 1-9.5-3.8L2.6 17A10 10 0 0 0 12 23z" />
          </svg>
          Google
        </button>
        <button
          onClick={notImplemented('Facebook')}
          className="flex items-center justify-center gap-2 rounded border border-border py-2.5 text-sm text-textPrimary transition-colors hover:border-accent"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7v-3.5h3.1V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9v2.2h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z" />
          </svg>
          Facebook
        </button>
      </div>
    </div>
  );
}
