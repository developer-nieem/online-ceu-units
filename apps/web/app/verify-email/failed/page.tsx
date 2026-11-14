'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { AuthShell } from '@/components/auth/auth-shell';
import { EmailVerificationResend } from '@/components/auth/email-verification-resend';
import { VerifyEmailHelp } from '@/components/auth/verify-email-help';

function FailedContent() {
  const searchParams = useSearchParams();
  const reason =
    searchParams.get('reason') ??
    'This verification link is invalid or has expired. Sign in and request a new verification email.';

  return (
    <AuthShell title="Verification link expired" hideBackLink>
      <div className="space-y-4">
        <p className="text-sm text-red-700">{reason}</p>
        <p className="text-sm text-muted-foreground">
          For your security, verification links expire after 24 hours and can only be used once.
        </p>
        <EmailVerificationResend showDashboard />
        <VerifyEmailHelp />
      </div>
    </AuthShell>
  );
}

export default function VerifyEmailFailedPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm">Loading…</p>}>
      <FailedContent />
    </Suspense>
  );
}
