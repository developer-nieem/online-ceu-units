import { ExternalLink } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@calace/ui/components/ui/card';

export function InPersonCeuGuidanceSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">In-person CEU guidance</CardTitle>
        <CardDescription>California CNA renewal hour requirements (informational)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm leading-relaxed text-slate-800">
        <p>
          California CNA renewals require 48 total hours during the certification period. California
          limits the number of online CE hours that may count toward renewal eligibility. Additional
          in-person CE training may still be required depending on your renewal situation.
        </p>
        <div className="rounded-lg border border-teal-100 bg-teal-50/50 p-4">
          <p className="font-medium text-slate-900">
            In-person CE classes may be available through CAL ACE Nursing Academy.
          </p>
          <p className="mt-3">
            <a
              href="https://cna.school/ceu"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-medium text-teal-800 underline hover:text-teal-900"
            >
              View in-person CE options at cna.school/ceu
              <ExternalLink className="h-4 w-4" aria-hidden />
              <span className="sr-only">(opens in new tab)</span>
            </a>
          </p>
          <address className="mt-4 not-italic text-slate-700">
            <p className="font-medium text-slate-900">CAL ACE Nursing Academy</p>
            <p>1535 Landess Ave, Unit 103</p>
            <p>Milpitas, CA 95035</p>
            <p className="mt-2">
              <a href="mailto:calace@cna.school" className="text-teal-800 underline">
                calace@cna.school
              </a>
            </p>
          </address>
        </div>
      </CardContent>
    </Card>
  );
}
