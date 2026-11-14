import type { TrendPoint } from '@/lib/admin-analytics';

export function AnalyticsBarChart({
  data,
  label,
  colorClass = 'bg-teal-600',
}: {
  data: TrendPoint[];
  label: string;
  colorClass?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="space-y-2" role="img" aria-label={label}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <div className="flex items-end gap-1.5" style={{ minHeight: 120 }}>
        {data.map((point) => {
          const heightPct = Math.round((point.count / max) * 100);
          return (
            <div key={point.week} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <span className="text-[10px] font-medium text-slate-700">{point.count}</span>
              <div
                className="flex w-full items-end justify-center"
                style={{ height: 96 }}
                title={`${point.week}: ${point.count}`}
              >
                <div
                  className={`w-full max-w-[28px] rounded-t ${colorClass}`}
                  style={{ height: `${Math.max(heightPct, 4)}%` }}
                />
              </div>
              <span className="w-full truncate text-center text-[9px] text-slate-500">
                {point.week.slice(5)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
