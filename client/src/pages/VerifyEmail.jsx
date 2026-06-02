import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import AuthShell from '../components/layout/AuthShell';
import Button from '../components/ui/Button';
import { authApi } from '../api/authApi';
import { getErrorMessage } from '../api/axios';

export default function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    authApi
      .verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error');
        setMessage(getErrorMessage(err));
      });
  }, [token]);

  return (
    <AuthShell>
      <div className="text-center">
        {status === 'loading' && (
          <>
            <Loader2 size={36} className="mx-auto animate-spin text-accent" />
            <p className="mt-4 text-textSecondary">Verifying your email…</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
              <CheckCircle2 size={32} />
            </div>
            <h1 className="mt-5 font-serif text-2xl text-textPrimary">Email verified</h1>
            <p className="mt-3 text-sm text-textSecondary">
              Your account is now active. You can start shopping.
            </p>
            <Link to="/" className="mt-6 inline-block">
              <Button>Continue to LUXE</Button>
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-error/10 text-error">
              <XCircle size={32} />
            </div>
            <h1 className="mt-5 font-serif text-2xl text-textPrimary">Verification failed</h1>
            <p className="mt-3 text-sm text-textSecondary">{message || 'The link is invalid or expired.'}</p>
            <Link to="/login" className="mt-6 inline-block text-sm text-accent hover:underline">
              Back to login
            </Link>
          </>
        )}
      </div>
    </AuthShell>
  );
}
