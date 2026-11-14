'use client';

import { Button } from '@calace/ui/components/ui/button';
import { useState } from 'react';

import { sendVerificationEmail } from '@/lib/auth';

type Props = {
  email: string;
};

export function EmailVerificationBanner({ email }: Props) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleResend() {
    setStatus('sending');
    setError(null);
    const result = await sendVerificationEmail();
    if (result.status === 401 || result.status === 403) {
      setStatus('error');
      setError('Please sign in to resend your verification email.');
      return;
    }
    if (result.error) {
      setStatus('error');
      setError(result.error);
      return;
    }
    setStatus('sent');
  }

  return (
    <div
      className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-amber-950"
      role="status"
    >
      <p className="font-medium">Verify your email address</p>
      <p className="mt-1 text-sm text-amber-900/90">
        Please verify your email address to secure your account and receive certificates and
        important course notifications. We sent a link to{' '}
        <span className="font-medium">{email}</span>.
      </p>
      <div className="mt-3">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-amber-300 bg-white hover:bg-amber-100"
          disabled={status === 'sending'}
          onClick={() => void handleResend()}
        >
          {status === 'sending' ? 'Sending…' : 'Resend verification email'}
        </Button>
      </div>
      {status === 'sent' ? (
        <p className="mt-2 text-sm text-teal-800">
          Verification email sent. Check your inbox and spam folder for the link.
        </p>
      ) : null}
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
