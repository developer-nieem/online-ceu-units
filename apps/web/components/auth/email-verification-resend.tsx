'use client';

import { Button } from '@calace/ui/components/ui/button';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { getSession, sendVerificationEmail } from '@/lib/auth';

const SIGN_IN_MESSAGE = 'Please sign in to resend your verification email.';

type Props = {
  /** When signed in, show a single dashboard link (verify-email page). */
  showDashboard?: boolean;
};

export function EmailVerificationResend({ showDashboard = false }: Props) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSession().then((result) => {
      setSignedIn(Boolean(result.data?.user));
    });
  }, []);

  async function handleResend() {
    setStatus('sending');
    setError(null);

    const session = await getSession();
    if (!session.data?.user) {
      setSignedIn(false);
      setStatus('error');
      setError(SIGN_IN_MESSAGE);
      return;
    }

    const result = await sendVerificationEmail();
    if (result.status === 401 || result.status === 403) {
      setSignedIn(false);
      setStatus('error');
      setError(SIGN_IN_MESSAGE);
      return;
    }
    if (result.error) {
      setStatus('error');
      setError(result.error);
      return;
    }
    setStatus('sent');
  }

  if (signedIn === null) {
    return <p className="text-sm text-muted-foreground">Checking your session…</p>;
  }

  if (!signedIn) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">{SIGN_IN_MESSAGE}</p>
        <Link
          href="/login?next=/verify-email"
          className="inline-flex rounded-md bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-900"
        >
          Sign in
        </Link>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        You are signed in. Click resend to send a fresh verification link.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" size="sm" disabled={status === 'sending'} onClick={() => void handleResend()}>
          {status === 'sending' ? 'Sending…' : 'Resend verification email'}
        </Button>
        {showDashboard ? (
          <Link
            href="/dashboard"
            className="inline-flex rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            Dashboard
          </Link>
        ) : null}
      </div>
      {status === 'sent' ? (
        <p className="text-sm text-teal-800">
          Verification email sent. Check your inbox and spam folder for the link.
        </p>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
