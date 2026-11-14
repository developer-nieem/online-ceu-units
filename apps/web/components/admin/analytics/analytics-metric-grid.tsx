import { AdminStatCard } from '@/components/admin/admin-stat-card';

export function AnalyticsMetricGrid({
  metrics,
}: {
  metrics: { label: string; value: string | number; hint?: string }[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {metrics.map((m) => (
        <AdminStatCard key={m.label} label={m.label} value={m.value} hint={m.hint} />
      ))}
    </div>
  );
}

function pct(v: number | null) {
  return v === null ? '—' : `${v}%`;
}

export { pct };
