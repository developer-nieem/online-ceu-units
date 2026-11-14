import Link from 'next/link';
import type { ReactNode } from 'react';

export function AuthShell({
  title,
  subtitle,
  children,
  hideBackLink = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  hideBackLink?: boolean;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 rounded-lg border bg-card p-6 shadow-sm">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            CAL ACE Nursing Academy
          </p>
          <h1 className="text-2xl font-semibold">{title}</h1>
          {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        {children}
        {!hideBackLink ? (
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/" className="underline">
              Back to home
            </Link>
          </p>
        ) : null}
      </div>
    </main>
  );
}
