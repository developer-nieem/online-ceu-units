'use client';

import { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@calace/ui/components/ui/card';

import { fetchCmsPacingReport, type CmsPacingReport } from '@/lib/cms';

export function BlueprintPacingPanel({ courseId }: { courseId: string }) {
  const [report, setReport] = useState<CmsPacingReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchCmsPacingReport(courseId).then((res) => {
      if (res.error) setError(res.error);
      else if (res.data) setReport(res.data);
    });
  }, [courseId]);

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!report) {
    return <p className="text-sm text-muted-foreground">Loading pacing report…</p>;
  }

  const allWarnings = [
    ...report.blueprintPacing.warnings,
    ...report.durationCheck.warnings,
  ];
  const valid = report.blueprintPacing.valid && report.durationCheck.valid;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Blueprint pacing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p>
          <span className="font-medium">{report.blueprintLabel}</span>
          {report.blueprintVersion ? ` v${report.blueprintVersion}` : ''} · target{' '}
          {report.targetActiveMinutes} active min (CDPH minimum)
        </p>
        <dl className="grid grid-cols-2 gap-2 text-muted-foreground sm:grid-cols-3">
          <div>
            <dt>Lesson total (CMS)</dt>
            <dd className="font-medium text-slate-900">
              {report.estimatedActiveMinutes} min
            </dd>
          </div>
          <div>
            <dt>Catalog display</dt>
            <dd className="font-medium text-slate-900">
              {report.catalogDurationMinutes} min
            </dd>
          </div>
          <div>
            <dt>Weighted participation</dt>
            <dd className="font-medium text-slate-900">
              {report.blueprintPacing.weightedParticipationMinutes} min
            </dd>
          </div>
        </dl>
        <p
          className={
            valid && report.durationCheck.meetsMinimum
              ? 'rounded-md bg-emerald-50 px-3 py-2 text-emerald-900'
              : 'rounded-md bg-amber-50 px-3 py-2 text-amber-900'
          }
        >
          {report.durationCheck.meetsMinimum
            ? `Meets ${report.minimumActiveMinutes}-minute active participation minimum.`
            : `Below ${report.minimumActiveMinutes}-minute minimum — add lesson time or interactions.`}
          {!valid ? ' Review warnings before publishing.' : ''}
        </p>
        {allWarnings.length > 0 ? (
          <ul className="list-inside list-disc text-amber-900">
            {allWarnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        ) : null}
        {report.qualityChecklist?.length ? (
          <p className="text-xs text-muted-foreground">
            {report.qualityChecklist.filter((i) => i.status !== 'complete').length} quality
            checklist items still pending — see Quality tab.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
