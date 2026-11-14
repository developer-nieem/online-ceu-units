import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@calace/ui/components/ui/card';
import { Progress } from '@calace/ui/components/ui/progress';

import type { ComplianceSummary } from '@/lib/credentials-types';

export function CeuProgressCard({ compliance }: { compliance: ComplianceSummary | null }) {
  const earned = compliance?.renewalPeriod.earnedHours ?? 0;
  const required = compliance?.renewalPeriod.requiredHours ?? 48;
  const remaining = compliance?.renewalPeriod.remainingHours ?? required;
  const pct = compliance?.renewalPeriod.pctComplete ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">CEU progress</CardTitle>
        <CardDescription>
          California CNA renewal period · online CEU progress
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end justify-between text-sm">
          <span>
            <span className="text-2xl font-semibold text-teal-800">{earned}</span>
            <span className="text-muted-foreground"> / {required} hrs earned</span>
          </span>
          <span className="font-medium text-muted-foreground">{pct}%</span>
        </div>
        <Progress value={pct} aria-label={`${pct}% of required CEU hours completed`} />
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{remaining}</span> CEU hours remaining in
          current renewal period. Includes online completions; in-person CEUs via transcript
          adjustments (future).
        </p>
      </CardContent>
    </Card>
  );
}
