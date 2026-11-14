import { Badge } from '@calace/ui/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@calace/ui/components/ui/card';
import { Progress } from '@calace/ui/components/ui/progress';
import { AlertTriangle, CheckCircle2, Shield } from 'lucide-react';
import Link from 'next/link';

import { normalizeComplianceProvider, isRenewalPeriodExpired } from '@/lib/compliance-normalize';
import type { ComplianceSummary } from '@/lib/credentials-types';
import { CALIFORNIA_REACTIVATION_NOTE } from '@calace/ui/components/account';

import { ExpiredCertDisclaimerBanner } from './expired-cert-disclaimer-banner';

/**
 * Workbook reqs beyond CE hours. CNA: supervised paid work day + criminal clearance.
 * HHA: criminal clearance only (no supervised-work requirement in the workbook).
 */
function CdphBeyondCeHoursNotice({ professionCode }: { professionCode: string }) {
  const isHha = professionCode === 'HHA';
  return (
    <p
      className="rounded-md border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm leading-relaxed text-amber-950"
      role="note"
    >
      CE hours are one of several CDPH renewal requirements.
      {isHha
        ? ' You must also have maintained criminal clearance.'
        : ' You must also have worked at least one day for pay under the supervision of a licensed healthcare professional, and maintained criminal clearance.'}{' '}
      CAL ACE tracks your CE hours only — CDPH makes the final eligibility determination.
    </p>
  );
}

function statusVariant(status: string): 'default' | 'secondary' | 'warning' | 'outline' {
  if (status === 'COMPLIANT') return 'default';
  if (status === 'AT_RISK') return 'warning';
  if (status === 'NON_COMPLIANT') return 'warning';
  return 'outline';
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'COMPLIANT') {
    return <CheckCircle2 className="h-5 w-5 text-teal-700" aria-hidden />;
  }
  if (status === 'AT_RISK' || status === 'NON_COMPLIANT') {
    return <AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden />;
  }
  return <Shield className="h-5 w-5 text-muted-foreground" aria-hidden />;
}

type YearPeriod = NonNullable<ComplianceSummary['yearSplit']>['year1'];

function YearSplitRow({ label, period }: { label: string; period: YearPeriod }) {
  const pct = period.requiredHours > 0
    ? Math.min(100, Math.round((period.earnedHours / period.requiredHours) * 100))
    : 0;

  return (
    <div className="space-y-1 rounded border px-2 py-1.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">
            {period.periodStart} → {period.periodEnd}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="text-xs font-medium">
            {period.earnedHours} / {period.requiredHours} hrs
          </span>
          {period.met ? (
            <CheckCircle2 className="h-4 w-4 text-teal-700" aria-label="CE hours requirement met" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-amber-600" aria-label="CE hours requirement not met" />
          )}
        </div>
      </div>
      <Progress value={pct} aria-label={`${label} CEU progress`} className="h-1.5" />
    </div>
  );
}

export function ComplianceStatusPanel({ summary }: { summary: ComplianceSummary }) {
  const period = summary.renewalPeriod ?? {
    label: 'California CNA renewal',
    periodStart: '',
    periodEnd: '',
    earnedHours: 0,
    requiredHours: 48,
    remainingHours: 48,
    pctComplete: 0,
    daysUntilExpiration: 0,
  };
  const provider = normalizeComplianceProvider(summary.provider);
  const hasExpirationDate = Boolean(summary.licenseExpiresOn);
  const isExpired = hasExpirationDate && isRenewalPeriodExpired(period.periodEnd);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <StatusIcon status={summary.status} />
            <div>
              <CardTitle className="text-base">Compliance status</CardTitle>
              <CardDescription>
                {summary.jurisdiction.name} · {summary.profession.name}
              </CardDescription>
            </div>
          </div>
          <Badge variant={statusVariant(summary.status)}>{summary.statusLabel}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* TODO: move to jurisdiction settings (NEVER BREAK #3) before multi-state */}
        <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-muted-foreground">
          This renewal summary is provided for guidance only. It may contain errors or be
          superseded by more recent CDPH requirements. CDPH is the sole authority on renewal
          eligibility — always verify current requirements directly with CDPH (website or phone)
          before relying on this calculation. It is the learner&apos;s responsibility to confirm.
        </p>

        {isExpired ? (
          <ExpiredCertDisclaimerBanner expirationDate={period.periodEnd} />
        ) : null}

        {!hasExpirationDate ? (
          <p className="text-sm text-muted-foreground">
            Add your certification expiration date in your{' '}
            <Link href="/account/profile" className="font-medium text-teal-800 underline">
              profile
            </Link>{' '}
            to see your renewal progress. Without it, we can&apos;t calculate your renewal period.
          </p>
        ) : (
          <>
            <div>
              <p className="text-sm font-medium">{period.label}</p>
              <p className="text-xs text-muted-foreground">
                {period.periodStart} — {period.periodEnd}
                {` · License expires ${summary.licenseExpiresOn}`}
              </p>
            </div>

            <p className="text-xs text-muted-foreground">
              Calculated from the expiration date in your profile. If you&apos;ve renewed since it was
              entered, update it in your{' '}
              <Link href="/account/profile" className="font-medium text-teal-800 underline">
                profile
              </Link>{' '}
              or this may be inaccurate — always verify with CDPH.
            </p>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>
                  <span className="font-semibold text-teal-800">{period.earnedHours}</span>
                  <span className="text-muted-foreground"> / {period.requiredHours} CEU hrs</span>
                </span>
                <span className="text-muted-foreground">{period.pctComplete}%</span>
              </div>
              <Progress value={period.pctComplete} aria-label="CEU progress toward renewal" />
              <p className="text-xs text-muted-foreground">
                {period.remainingHours > 0
                  ? `${period.remainingHours} hours remaining · ${period.daysUntilExpiration} days until period end`
                  : `CE hours requirement met for this period · ${period.daysUntilExpiration} days until period end`}
              </p>
            </div>

            {/* Reactivation note presupposes expired + unmet hours; do not use AT_RISK (too broad). */}
            {isExpired && period.remainingHours > 0 ? (
              <p
                className="rounded-md border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm leading-relaxed text-amber-950"
                role="note"
              >
                {CALIFORNIA_REACTIVATION_NOTE}
              </p>
            ) : null}

            <CdphBeyondCeHoursNotice professionCode={summary.profession.code} />

            {summary.yearSplit ? (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Renewal year breakdown
                </p>
                <div className="space-y-1.5">
                  <YearSplitRow label="Year 1" period={summary.yearSplit.year1} />
                  <YearSplitRow label="Year 2" period={summary.yearSplit.year2} />
                </div>
              </div>
            ) : null}
          </>
        )}

        {summary.onlineCap ? (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Online CE limit
            </p>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>
                  {summary.onlineCap.onlineHours} of {summary.onlineCap.maxOnlineHours} online hours
                  used
                </span>
              </div>
              <Progress
                value={
                  summary.onlineCap.maxOnlineHours > 0
                    ? Math.min(
                        100,
                        Math.round(
                          (summary.onlineCap.onlineHours / summary.onlineCap.maxOnlineHours) * 100,
                        ),
                      )
                    : 0
                }
                aria-label="Online CE hours used toward limit"
              />
            </div>
            {summary.onlineCap.capExceeded ? (
              <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-950">
                {summary.onlineCap.honestyNote}
              </p>
            ) : summary.onlineCap.onlineHours >= summary.onlineCap.maxOnlineHours ? (
              <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                Online limit reached. Remaining hours must be in-person.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">{summary.onlineCap.honestyNote}</p>
            )}
          </div>
        ) : null}

        {summary.topicWarnings.length > 0 ? (
          <ul className="space-y-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-950">
            {summary.topicWarnings.map((w) => (
              <li key={w.topic}>{w.message}</li>
            ))}
          </ul>
        ) : null}

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            In-service categories
          </p>
          <ul className="grid gap-1 text-sm sm:grid-cols-2">
            {summary.inServiceCategories.map((cat) => {
              const hours =
                summary.categoryBreakdown.find((b) => b.slug === cat.slug)?.hours ?? 0;
              return (
                <li
                  key={cat.slug}
                  className="flex justify-between rounded border px-2 py-1"
                >
                  <span>
                    {cat.label}
                    {cat.required ? (
                      <span className="ml-1 text-xs text-amber-700">(required)</span>
                    ) : null}
                  </span>
                  <span className="font-medium">{hours} hrs</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="space-y-1 text-xs text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Provider:</span> {provider.name}
          </p>
          {provider.contactSummary ? <p>{provider.contactSummary}</p> : null}
          {provider.approvalStatusLabel ? (
            <p className="text-teal-800">{provider.approvalStatusLabel}</p>
          ) : null}
        </div>
        <div className="mt-3">
          <a
            href="https://cvl.cdph.ca.gov/SearchPage.aspx"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
          >
            Is Your CNA Certification Still Active?
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
