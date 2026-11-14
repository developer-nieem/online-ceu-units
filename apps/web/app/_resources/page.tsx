import Link from 'next/link';

import { PortalPage, PortalPanel } from '@/components/learner/portal-page';

export const metadata = {
  title: 'Renewal Resources | CAL ACE Nursing Academy',
};

const RESOURCES = [
  {
    title: 'California CNA renewal checklist',
    description: 'Step-by-step overview of CE/In-Service requirements and documentation.',
  },
  {
    title: 'CDPH form preparation guide',
    description: 'How to complete CDPH 283A tracking and 283C renewal application forms.',
  },
  {
    title: 'Online CE Unit planning worksheet',
    description: 'Track Year 1 and Year 2 online CE Units within the 24-unit online limit.',
  },
  {
    title: 'Certificate and transcript retention',
    description: 'Best practices for maintaining completion records for licensure audits.',
  },
] as const;

export default function ResourcesPage() {
  return (
    <PortalPage
      description="Guidance, checklists, and support materials to help you meet CNA renewal and continuing education requirements."
      title="Renewal resources"
    >
      <ul className="space-y-3">
        {RESOURCES.map((resource) => (
          <li key={resource.title}>
            <PortalPanel>
              <p className="font-semibold text-slate-900">{resource.title}</p>
              <p className="mt-1 text-sm text-slate-600">{resource.description}</p>
              <p className="mt-2 text-xs text-slate-500">Downloadable guides coming soon.</p>
            </PortalPanel>
          </li>
        ))}
      </ul>
      <p className="text-sm text-slate-600">
        For live CE courses, visit{' '}
        <Link className="font-medium text-slate-900 underline-offset-4 hover:underline" href="https://cna.school/ceu">
          cna.school/ceu
        </Link>
        .
      </p>
    </PortalPage>
  );
}
