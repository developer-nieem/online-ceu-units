import Link from 'next/link';

import {
  CALIFORNIA_RENEWAL_ADDITIONAL_HOURS_NOTE,
  CALIFORNIA_RENEWAL_GUIDANCE,
  CALIFORNIA_REACTIVATION_NOTE,
  CDPH_RESOURCES,
} from '@calace/ui/components/account';

import { PortalPage, PortalPanel } from '@/components/learner/portal-page';

export const metadata = {
  title: 'Renewal Guidance | CAL ACE Nursing Academy',
};

export default function RenewalGuidancePage() {
  return (
    <PortalPage
      backHref="/"
      backLabel="Back to home page"
      description="California CNA renewal requirements, online CE Unit limits, and official CDPH resources."
      title="Renewal guidance"
    >
      <PortalPanel>
        <h2 className="text-sm font-semibold text-slate-900">California CNA online CE guidance</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-600">
          {CALIFORNIA_RENEWAL_GUIDANCE.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
        <p className="mt-4 rounded-md border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm leading-relaxed text-amber-950">
          {CALIFORNIA_RENEWAL_ADDITIONAL_HOURS_NOTE}
        </p>
        <p
          className="mt-3 rounded-md border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm leading-relaxed text-amber-950"
          role="note"
        >
          {CALIFORNIA_REACTIVATION_NOTE}
        </p>
      </PortalPanel>

      <PortalPanel>
        <h2 className="text-sm font-semibold text-slate-900">CDPH resources</h2>
        <ul className="mt-3 space-y-2">
          {CDPH_RESOURCES.map((resource) => (
            <li key={resource.href}>
              <a
                className="text-sm font-medium text-slate-900 underline-offset-4 hover:underline"
                href={resource.href}
                rel="noopener noreferrer"
                target="_blank"
              >
                {resource.label}
              </a>
            </li>
          ))}
        </ul>
      </PortalPanel>

      <p className="text-sm text-slate-600">
        View your personal renewal progress on{' '}
        <Link className="font-medium text-slate-900 underline-offset-4 hover:underline" href="/account/profile">
          Account Profile
        </Link>
        .
      </p>
    </PortalPage>
  );
}
