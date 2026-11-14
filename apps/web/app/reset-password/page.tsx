'use client';

import { Button } from '@calace/ui/components/ui/button';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import { AuthShell } from '@/components/auth/auth-shell';
import { resetPassword } from '@/lib/auth';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!token) {
      setError('Reset token is missing');
      return;
    }

    setLoading(true);
    setError(null);
    const result = await resetPassword({ token, password });
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setMessage(result.data?.message ?? 'Password reset. You can sign in now.');
  }

  return (
    <AuthShell title="Reset password">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-1 text-sm">
          <span>New password</span>
          <input
            className="w-full rounded-md border px-3 py-2"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-green-700">{message}</p> : null}
        <Button type="submit" className="w-full" disabled={loading || !token}>
          {loading ? 'Saving…' : 'Reset password'}
        </Button>
      </form>
      <p className="text-sm">
        <Link href="/login" className="underline">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p className="p-6">Loading…</p>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
