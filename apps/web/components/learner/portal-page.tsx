import Link from 'next/link';
import type { ReactNode } from 'react';

export function PortalPage({
  title,
  description,
  children,
  backHref = '/dashboard',
  backLabel = 'Back to dashboard',
  backAriaLabel,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
  backHref?: string;
  backLabel?: string;
  backAriaLabel?: string;
}) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <Link
            aria-label={backAriaLabel ?? undefined}
            className="text-sm font-medium text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
            href={backHref}
          >
            {backAriaLabel ? (
              <>
                <span aria-hidden="true" className="text-2xl leading-none">←</span>
                <span className="sr-only">{backAriaLabel}</span>
              </>
            ) : (
              <>← {backLabel}</>
            )}
          </Link>
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">{title}</h1>
          {description ? <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p> : null}
        </div>
        {children}
      </div>
    </main>
  );
}

export function PortalPanel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}
