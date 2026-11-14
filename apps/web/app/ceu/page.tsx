import Link from 'next/link';

import { PortalPage, PortalPanel } from '@/components/learner/portal-page';

export const metadata = {
  title: 'Continuing Education | CAL ACE Nursing Academy',
};

export default function CeuLandingPage() {
  return (
    <PortalPage
      description="Choose in-person or online continuing education."
      title="Continuing Education for California CNAs"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <PortalPanel>
          <p className="text-sm font-medium text-slate-900">CDPH-Approved · NAC# 7118</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Attend instructor-led continuing education at our Milpitas academy or at your facility.
          </p>
          <Link
            className="mt-4 inline-block text-sm font-medium text-slate-900 underline-offset-4 hover:underline"
            href="/ceu/in-person"
          >
            View in-person CE →
          </Link>
        </PortalPanel>
        <PortalPanel>
          <p className="text-sm font-medium text-slate-900">Coming Soon · Pending CDPH Approval</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Our online continuing education program is in development and not yet available for enrollment.
          </p>
          <Link
            className="mt-4 inline-block text-sm font-medium text-slate-900 underline-offset-4 hover:underline"
            href="/ceu/online"
          >
            Learn more →
          </Link>
        </PortalPanel>
      </div>
      <p className="text-sm text-slate-600">Questions? Call 408-256-0763.</p>
    </PortalPage>
  );
}
