import { ExternalLink } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@calace/ui/components/ui/card';

const CDPH_CNA_PAGE = 'https://www.cdph.ca.gov/programs/CHCQ/LCP/Pages/CNA.aspx';

/** Approved renewal FAQ copy — must match compliance spec / constants wording exactly. */
const CNA_RENEWAL_FAQ_ITEMS = [
  {
    question: 'How many CE/In-Service hours are required for California CNA renewal?',
    answer: 'California CNA renewal requires 48 total CE/In-Service hours.',
  },
  {
    question: 'How many hours must I complete in each year of my certification period?',
    answer:
      'At least 12 hours must generally be completed during each year of the certification period.',
  },
  {
    question: 'How many online CE Units can I use for California CNA renewal?',
    answer:
      'A maximum of 24 CE Units may generally be completed online during the 2-year certification period. Because online is capped at 24 hours, the remaining hours must come from in-person or other CDPH-approved training.',
  },
  {
    question: 'Can I complete all 48 hours through CAL ACE online courses alone?',
    answer:
      'No. Online hours max out at 24. The other 24 must come from in-person training — usually through your employer or facility. We help you track both halves.',
  },
  {
    question: 'How long is the California CNA certification period?',
    answer: 'California CNA renewal generally follows a 2-year certification cycle.',
  },
  {
    question: 'How is each CAL ACE online course counted toward my renewal progress?',
    answer:
      'Each completed CAL ACE online course is tracked as 1 online CE Unit in your renewal progress summary.',
  },
  {
    question: 'Who determines final renewal eligibility?',
    answer:
      'Final renewal eligibility is determined solely by the California Department of Public Health (CDPH).',
  },
] as const;

export function CnaRenewalFaqSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Knowledge Base — CNA Renewal FAQ</CardTitle>
        <CardDescription>
          Common California CNA continuing education and renewal questions. The California Department
          of Public Health (CDPH) is the final authority on renewal eligibility and requirements.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ul className="space-y-4">
          {CNA_RENEWAL_FAQ_ITEMS.map((item) => (
            <li
              key={item.question}
              className="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3"
            >
              <p className="font-semibold text-slate-900">{item.question}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.answer}</p>
            </li>
          ))}
        </ul>

        <p className="text-sm leading-relaxed text-slate-600">
          For official requirements, forms, and renewal instructions, visit the{' '}
          <a
            className="inline-flex items-center gap-1 font-medium text-teal-800 underline hover:text-teal-900"
            href={CDPH_CNA_PAGE}
            rel="noopener noreferrer"
            target="_blank"
          >
            CDPH Certified Nurse Assistant (CNA) page
            <ExternalLink aria-hidden className="h-3.5 w-3.5 shrink-0" />
            <span className="sr-only">(opens in new tab)</span>
          </a>{' '}
          — the official source for California CNA certification.
        </p>

        <p
          className="rounded-md border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm leading-relaxed text-amber-950"
          role="note"
        >
          CDPH makes final renewal determinations. This FAQ is general guidance, not legal advice.
        </p>
      </CardContent>
    </Card>
  );
}
