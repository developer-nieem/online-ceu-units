import { Card, CardContent } from '@calace/ui/components/ui/card';

export function RenewalComplianceDisclaimer() {
  return (
    <Card className="border-amber-200 bg-amber-50/60">
      <CardContent className="space-y-3 p-5 text-sm leading-relaxed text-slate-800">
        <p className="font-semibold text-slate-900">Important compliance notice</p>
        <p>
          CAL ACE Nursing Academy provides renewal progress summaries and CE tracking tools as an
          educational convenience only.
        </p>
        <p>
          Final renewal eligibility, certification periods, online hour acceptance, delinquency
          determinations, employment requirements, and renewal approvals are determined solely by
          the California Department of Public Health (CDPH).
        </p>
        <p>
          CAL ACE does not guarantee renewal approval or accuracy of renewal calculations. Learners
          are responsible for independently reviewing current CDPH policies and submitting required
          forms directly to CDPH.
        </p>
      </CardContent>
    </Card>
  );
}
