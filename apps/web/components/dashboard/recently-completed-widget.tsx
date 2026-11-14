import { Card, CardContent, CardHeader, CardTitle } from '@calace/ui/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

import type { ProgressSummary } from '@/lib/progress';

export function RecentlyCompletedWidget({ summary }: { summary: ProgressSummary | null }) {
  const items = summary?.recentlyCompleted ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden />
          Recently completed
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Completed courses appear here.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.enrollmentId} className="text-sm">
                <Link
                  href={`/courses/${item.courseSlug}`}
                  className="font-medium text-teal-800 hover:underline"
                >
                  {item.courseTitle}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {item.ceHours} CEU hrs ·{' '}
                  {new Date(item.completedAt).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
