'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';

import { Button } from '@calace/ui/components/ui/button';
import { PasswordInput } from '@calace/ui/components/ui/password-input';
import {
  DEFAULT_CERTIFICATE_LOGO_SRC,
  DEFAULT_INSTITUTION_LEGAL_NAME,
} from '@calace/ui/components/certificate';
import { login } from '@/lib/auth';
import { CaptchaField, type CaptchaFieldHandle } from '@/components/auth/captcha-field';
import { TENANT_PROVIDER_BRAND_LINE } from '@/lib/brand';
import { sanitizeNextPath } from '@/lib/auth/learner';

function postLoginPath(roles: string[], nextPath: string): string {
  if (roles.includes('admin') || roles.includes('instructor')) {
    return '/admin';
  }
  return nextPath;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = sanitizeNextPath(searchParams.get('next'));
  const captchaRef = React.useRef<CaptchaFieldHandle>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get('email') ?? '').trim();
    const password = String(data.get('password') ?? '');

    if (!email || !password) {
      setError('Please enter your email and password.');
      setLoading(false);
      return;
    }

    try {
      const captchaToken = await captchaRef.current?.getToken();
      const result = await login({ email, password, captchaToken });

      if (result.error || !result.data) {
        setError(result.error ?? 'Invalid email or password.');
        return;
      }

      router.push(postLoginPath(result.data.user.roles, nextPath));
      router.refresh();
    } catch {
      setError('Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-8 text-center">
        <img
          alt="CAL ACE Nursing Academy logo"
          className="mx-auto mb-4 h-12 w-auto object-contain"
          src={DEFAULT_CERTIFICATE_LOGO_SRC}
        />
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
          {DEFAULT_INSTITUTION_LEGAL_NAME}
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">Student login</h1>
        <p className="mt-2 text-sm text-slate-600">
          Sign in to access your courses, certificates, and official transcript.
        </p>
      </div>

      <form
        className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        onSubmit={handleSubmit}
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="email">
            Email address
          </label>
          <input
            autoComplete="email"
            className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
            id="email"
            name="email"
            placeholder="you@example.com"
            required
            type="email"
          />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between gap-3">
            <label className="block text-sm font-medium text-slate-700" htmlFor="password">
              Password
            </label>
            <Link className="text-sm text-slate-600 hover:underline" href="/forgot-password">
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            autoComplete="current-password"
            className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
            id="password"
            name="password"
            required
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <CaptchaField ref={captchaRef} action="login" />

        <Button className="w-full" disabled={loading} type="submit">
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>

        {process.env.NODE_ENV !== 'production' ? (
          <p className="text-xs text-slate-500">
            Development: use seeded accounts (e.g. support@cna.school for admin, jane.doe@example.com
            for learner).
          </p>
        ) : null}
      </form>

      <p className="mt-4 text-center text-sm text-slate-600">
        Need an account?{' '}
        <Link className="font-medium text-slate-900 hover:underline" href="/signup">
          Create account
        </Link>
      </p>
      <p className="mt-3 text-center text-sm text-slate-600">
        <Link className="hover:underline" href="/">
          Return to homepage
        </Link>
        {' · '}
        <Link className="hover:underline" href="/verify-certificate">
          Verify a certificate
        </Link>
      </p>
      <p className="mt-6 text-center text-xs text-slate-500">{TENANT_PROVIDER_BRAND_LINE}</p>
    </div>
  );
}
