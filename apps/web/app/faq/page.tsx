import Link from 'next/link';

import { PortalPage, PortalPanel } from '@/components/learner/portal-page';
import { SUPPORT_EMAIL } from '@/lib/support';

export const metadata = {
  title: 'FAQ | CAL ACE Nursing Academy',
};

const FAQ_ITEMS = [
  {
    question: 'How many CE Units does each CAL ACE online course award?',
    answer: 'Each completed online course awards 1 CE Unit.',
  },
  {
    question: 'How many online CE Units can I use for California CNA renewal?',
    answer:
      'A maximum of 24 CE Units may generally be completed online during the 2-year certification period. Remaining requirements may need employer or in-person training per CDPH.',
  },
  {
    question: 'Can I change my name or email on my profile?',
    answer:
      `Full Legal Name and Primary Email are locked for certificate and transcript integrity. Contact ${SUPPORT_EMAIL} for identity update requests.`,
  },
  {
    question: 'Where do I find my certificates and transcript?',
    answer: 'Sign in and use My Certificates or My Transcript from your learner dashboard.',
  },
  {
    question: 'Who determines final renewal eligibility?',
    answer:
      'Final renewal eligibility is determined solely by the California Department of Public Health (CDPH).',
  },
] as const;

export default function FaqPage() {
  return (
    <PortalPage
      description="Common questions about enrollment, CE Units, certificates, and California CNA renewal."
      title="Frequently asked questions"
    >
      <ul className="space-y-3">
        {FAQ_ITEMS.map((item) => (
          <li key={item.question}>
            <PortalPanel>
              <p className="font-semibold text-slate-900">{item.question}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.answer}</p>
            </PortalPanel>
          </li>
        ))}
      </ul>
      <p className="text-sm text-slate-600">
        Still need help?{' '}
        <Link className="font-medium text-slate-900 underline-offset-4 hover:underline" href="/support">
          Contact support
        </Link>
        .
      </p>
    </PortalPage>
  );
}
