import { PortalPage, PortalPanel } from '@/components/learner/portal-page';

export const metadata = {
  title: 'In-Person CE | CAL ACE Nursing Academy',
};

export default function InPersonCeuPage() {
  return (
    <PortalPage
      backHref="/ceu"
      backLabel="Back to continuing education"
      description="CDPH-approved in-person CE for California CNAs · NAC# 7118"
      title="In-Person Continuing Education"
    >
      <PortalPanel>
        <p className="text-sm leading-relaxed text-slate-600">
          In-person continuing education is CDPH-approved under NAC# 7118, delivered at the Milpitas
          academy and on-site at facilities.
        </p>
      </PortalPanel>
      <ul className="space-y-3">
        <li>
          <PortalPanel>
            <p className="font-semibold text-slate-900">Class Schedules</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Coming soon — materials will be posted here.
            </p>
          </PortalPanel>
        </li>
        <li>
          <PortalPanel>
            <p className="font-semibold text-slate-900">Registration Forms (PDF)</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Coming soon — materials will be posted here.
            </p>
          </PortalPanel>
        </li>
        <li>
          <PortalPanel>
            <p className="font-semibold text-slate-900">Syllabi</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Coming soon — materials will be posted here.
            </p>
          </PortalPanel>
        </li>
      </ul>
      <p className="text-sm text-slate-600">Questions? Call 408-256-0763.</p>
    </PortalPage>
  );
}
