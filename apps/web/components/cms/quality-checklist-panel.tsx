'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@calace/ui/components/ui/card';

import type { CmsQualityChecklistItem } from '@/lib/cms';

export function QualityChecklistPanel({ items }: { items: CmsQualityChecklistItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Production quality checklist</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3 text-sm">
          {items.map((item) => (
            <li key={item.id} className="flex gap-2 border-b border-slate-100 pb-3 last:border-0">
              <span
                className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${
                  item.status === 'complete'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                {item.status === 'complete' ? 'Done' : 'Pending'}
              </span>
              <div>
                <p className="font-medium text-slate-900">{item.label}</p>
                <p className="text-muted-foreground">{item.note}</p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
