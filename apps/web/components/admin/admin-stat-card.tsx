import Link from 'next/link';
import type { ReactNode } from 'react';

type Props = {
  label: string;
  value: ReactNode;
  hint?: string;
  href?: string;
};

export function AdminStatCard({ label, value, hint, href }: Props) {
  const inner = (
    <>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </>
  );

  const className =
    'rounded-xl border bg-white p-4 shadow-sm transition-shadow sm:p-5' +
    (href ? ' hover:shadow-md' : '');

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }

  return <div className={className}>{inner}</div>;
}
