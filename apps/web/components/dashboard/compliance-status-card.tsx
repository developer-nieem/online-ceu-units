import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@calace/ui/components/ui/card';
import { Progress } from '@calace/ui/components/ui/progress';
import { CalendarClock } from 'lucide-react';
import Link from 'next/link';

import type { ComplianceSummary } from '@/lib/credentials-types';

export function ComplianceStatusCard({ summary }: { summary: ComplianceSummary | null }) {
  if (!summary) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="h-5 w-5 text-teal-700" aria-hidden />
            Renewal & compliance
          </CardTitle>
          <CardDescription>Sign in to view your California CNA renewal status</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const period = summary.renewalPeriod ?? {
    earnedHours: 0,
    requiredHours: 48,
    remainingHours: 48,
    pctComplete: 0,
    daysUntilExpiration: 0,
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="h-5 w-5 text-teal-700" aria-hidden />
            Renewal & compliance
          </CardTitle>
          <span
            className={`text-xs font-medium ${
              summary.status === 'COMPLIANT'
                ? 'text-teal-800'
                : summary.status === 'AT_RISK'
                  ? 'text-amber-700'
                  : 'text-red-700'
            }`}
          >
            {summary.statusLabel}
          </span>
        </div>
        <CardDescription>{period.daysUntilExpiration} days until period end</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={period.pctComplete} aria-label="Renewal CEU progress" />
        <p className="text-sm">
          <span className="font-semibold text-teal-800">{period.earnedHours}</span>
          <span className="text-muted-foreground"> / {period.requiredHours} CEU hrs</span>
          <span className="text-muted-foreground"> · {period.remainingHours} remaining</span>
        </p>
        <Link href="/compliance" className="text-sm font-medium text-teal-800 underline">
          View compliance details
        </Link>
      </CardContent>
    </Card>
  );
}
