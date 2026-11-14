import { Card, CardContent, CardDescription, CardTitle } from '@calace/ui/components/ui/card';
import { Shield } from 'lucide-react';
import Link from 'next/link';

import { ComplianceStatusPanel } from '@/components/credentials/compliance-status-panel';
import { PageHeader } from '@/components/learner/page-header';
import { PlaceholderPanel } from '@/components/learner/placeholder-panel';
import { getComplianceSummary } from '@/lib/compliance-server';

export default async function CompliancePage() {
  const summary = await getComplianceSummary();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance & Renewal"
        description="Track your California CNA renewal CEU progress, completed courses, and provider contact information."
      />

      {summary ? (
        <>
          <ComplianceStatusPanel summary={summary} />

          <Card className="border-dashed">
            <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center">
              <div className="flex-1">
                <div className="flex flex-col space-y-1.5 pb-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-teal-700" aria-hidden />
                    <CardTitle className="text-base">California CNA renewal cycle</CardTitle>
                  </div>
                  <CardDescription>
                    24-month renewal window aligned to license expiration when available.
                  </CardDescription>
                </div>
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  <li>48 CEU hours required per renewal period (baseline rule set)</li>
                  <li>Mandatory topics: infection control, elder abuse</li>
                  <li>Online CE hours from completed CAL ACE courses count toward your transcript</li>
                </ul>
                {summary.supportContact ? (
                  <p className="mt-3 text-sm">
                    Questions?{' '}
                    <Link href="/support" className="font-medium text-teal-800 underline">
                      Contact support
                    </Link>
                    {summary.supportContact.includes('@') ? (
                      <span className="text-muted-foreground"> ({summary.supportContact})</span>
                    ) : null}
                  </p>
                ) : null}
              </div>
              <div className="w-full lg:w-2/5">
                {/* TODO: Rules-as-Settings — move explainer video URL to jurisdiction/tenant 
                    config (summary.explainerVideoUrl) before multi-state. Hard-coded CA asset. */}
                <video
                  controls
                  preload="metadata"
                  className="aspect-video w-full rounded-lg border border-slate-200 bg-black"
                  src="/assets/compliance/renewal-explainer.mp4"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <PlaceholderPanel
          title="Compliance data unavailable"
          description="Complete your learner profile and at least one course to generate a compliance snapshot."
          icon={Shield}
        />
      )}
    </div>
  );
}
