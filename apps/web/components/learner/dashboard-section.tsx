import type { DashboardGroup } from '@/lib/learner/dashboard-nav';

import { DashboardCard } from './dashboard-card';

export function DashboardSection({ title, description, links }: DashboardGroup) {
  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        {links.map((link) => (
          <DashboardCard key={`${link.href}-${link.title}`} {...link} />
        ))}
      </div>
    </section>
  );
}
