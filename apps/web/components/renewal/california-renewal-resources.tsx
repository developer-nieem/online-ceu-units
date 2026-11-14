import { ExternalLink } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@calace/ui/components/ui/card';

const CDPH_RESOURCES = [
  {
    href: 'https://www.cdph.ca.gov/cdph%20document%20library/controlledforms/cdph283a.pdf',
    label: 'Download CDPH 283A CEU/In-Service Tracking Form',
  },
  {
    href: 'https://www.cdph.ca.gov/cdph%20document%20library/controlledforms/cdph283c.pdf',
    label: 'Download CDPH 283C Renewal Application',
  },
  {
    href: 'https://www.cdph.ca.gov/Programs/CHCQ/LCP/Pages/Online-Submission-Page.aspx',
    label: 'Submit CNA/HHA Renewal Online through CDPH',
  },
] as const;

export function CaliforniaRenewalResourcesSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">California Renewal Resources</CardTitle>
        <CardDescription>
          Official California Department of Public Health (CDPH) forms and submission tools. These
          are not CAL ACE internal forms.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {CDPH_RESOURCES.map((resource) => (
            <li key={resource.href}>
              <a
                href={resource.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-start gap-2 text-sm font-medium text-teal-800 underline hover:text-teal-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
              >
                <span>{resource.label}</span>
                <ExternalLink className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span className="sr-only">(opens in new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
