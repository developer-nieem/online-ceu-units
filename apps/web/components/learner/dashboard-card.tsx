import Link from 'next/link';

import type { DashboardLink } from '@/lib/learner/dashboard-nav';

export function DashboardCard({ title, description, href, status }: DashboardLink) {
  return (
    <Link
      className="group block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
      href={href}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="font-semibold text-slate-900 group-hover:underline">{title}</span>
        {status === 'placeholder' ? (
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-600">
            Preview
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
    </Link>
  );
}
