import Link from 'next/link';

import { PortalPage, PortalPanel } from '@/components/learner/portal-page';

export const metadata = {
  title: 'Online CE — Coming Soon | CAL ACE Nursing Academy',
};

export default function OnlineCeuPage() {
  return (
    <PortalPage
      backHref="/ceu"
      backLabel="Back to continuing education"
      description="Pending CDPH approval."
      title="Online Continuing Education — Coming Soon"
    >
      <PortalPanel>
        <p className="text-sm leading-relaxed text-slate-600">
          Our online continuing education program is currently in development and pending CDPH
          approval. It is not yet available for enrollment. Online certificates will be valid for CNA
          license renewal only after CDPH approval is granted.
        </p>
      </PortalPanel>
      <p className="text-sm text-slate-600">
        <Link className="font-medium text-slate-900 underline-offset-4 hover:underline" href="/ceu">
          ← Back to continuing education
        </Link>
        {' · '}
        <Link
          className="font-medium text-slate-900 underline-offset-4 hover:underline"
          href="/ceu/in-person"
        >
          View in-person CE
        </Link>
      </p>
    </PortalPage>
  );
}
