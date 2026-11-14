import Link from 'next/link';

import { AuthShell } from '@/components/auth/auth-shell';

export default function VerifyEmailSuccessPage() {
  return (
    <AuthShell title="Email verified" hideBackLink>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Your email address has been verified. You can now receive certificates and important
          course notifications securely.
        </p>
        <p className="text-sm text-green-800">
          Thank you for confirming your account with CAL ACE Nursing Academy.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex rounded-md bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-900"
        >
          Go to dashboard
        </Link>
      </div>
    </AuthShell>
  );
}
