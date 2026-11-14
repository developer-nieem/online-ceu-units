'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { AuthShell } from '@/components/auth/auth-shell';
import { EmailVerificationResend } from '@/components/auth/email-verification-resend';
import { VerifyEmailHelp } from '@/components/auth/verify-email-help';
import { verifyEmailByToken } from '@/lib/auth';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [pending, setPending] = useState(Boolean(token));

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    verifyEmailByToken(token).then((result) => {
      if (cancelled) return;
      setPending(false);
      if (result.data?.verified) {
        router.replace('/verify-email/success');
        return;
      }
      const reason = encodeURIComponent(
        result.data?.message ?? result.error ?? 'Verification failed.',
      );
      router.replace(`/verify-email/failed?reason=${reason}`);
    });

    return () => {
      cancelled = true;
    };
  }, [token, router]);

  if (token && pending) {
    return (
      <AuthShell title="Confirming your email" hideBackLink>
        <p className="text-sm text-muted-foreground">Please wait while we verify your link…</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Verify your email" hideBackLink>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Please verify your email address to secure your account and receive certificates and
          important course notifications.
        </p>
        <EmailVerificationResend showDashboard />
        <VerifyEmailHelp />
      </div>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm">Loading…</p>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
