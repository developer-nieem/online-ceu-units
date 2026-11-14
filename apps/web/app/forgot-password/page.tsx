'use client';

import { Button } from '@calace/ui/components/ui/button';
import Link from 'next/link';
import { useRef, useState } from 'react';

import { AuthShell } from '@/components/auth/auth-shell';
import { CaptchaField, type CaptchaFieldHandle } from '@/components/auth/captcha-field';
import { forgotPassword } from '@/lib/auth';

export default function ForgotPasswordPage() {
  const captchaRef = useRef<CaptchaFieldHandle>(null);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setResetUrl(null);

    try {
      const captchaToken = await captchaRef.current?.getToken();
      const result = await forgotPassword({ email, captchaToken });

      if (result.error) {
        setError(result.error);
        return;
      }

      setMessage(
        result.data?.message ??
          'Check your inbox for a reset link. If you don\'t see it, look in spam — the link expires in 1 hour.',
      );
      if (result.data?.resetUrl) {
        setResetUrl(result.data.resetUrl);
      }
    } catch {
      setError('Unable to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Forgot password" subtitle="Enter your email and we'll send a reset link if an account exists.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-1 text-sm">
          <span>Email</span>
          <input
            className="w-full rounded-md border px-3 py-2"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <CaptchaField ref={captchaRef} action="forgot_password" />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-green-700">{message}</p> : null}
        {resetUrl ? (
          <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
            <p className="font-medium">Email delivery is not configured (local/dev).</p>
            <p>Use this one-time link to finish resetting your password:</p>
            <Link href={resetUrl} className="break-all font-medium text-teal-800 underline">
              {resetUrl}
            </Link>
          </div>
        ) : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>
    </AuthShell>
  );
}
