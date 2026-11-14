import { CALACE_DISPLAY_TIMEZONE } from '@calace/ui/components/certificate';
import type { Metadata } from 'next';
import { ScrollText } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { TranscriptPrintButton } from '@/components/credentials/transcript-print-button';
import { TranscriptPrintStyles } from '@/components/credentials/transcript-print-styles';
import { PageHeader } from '@/components/learner/page-header';
import { PlaceholderPanel } from '@/components/learner/placeholder-panel';
import {
  getAcademicTranscriptEnrollments,
  sumTranscriptCeuHours,
} from '@/lib/academic-transcript-server';
import { getServerSession } from '@/lib/auth-server';
import { formatOnlineCeuHours } from '@/lib/ceu-display';
import { learnerCertificateHref } from '@/lib/learner-certificate-navigation';

export const metadata: Metadata = {
  title: 'Academic Transcript',
  description: 'Official record of completed continuing education courses and CEU hours earned.',
};

function formatCompletionDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: CALACE_DISPLAY_TIMEZONE,
  });
}

function formatCeuHours(ceHours: number): string {
  return Number.isInteger(ceHours) ? String(ceHours) : ceHours.toFixed(1);
}

export default async function AcademicTranscriptPage() {
  const session = await getServerSession();
  if (session.error || !session.data) {
    redirect('/login?next=/transcript');
  }

  const result = await getAcademicTranscriptEnrollments();
  const learnerName =
    [session.data.user.firstName, session.data.user.lastName].filter(Boolean).join(' ').trim() ||
    session.data.user.email;

  if (!result.ok) {
    return (
      <div className="mx-auto min-h-screen max-w-4xl px-4 py-8 sm:px-6">
        <div className="transcript-print-root space-y-6">
          <PageHeader
            title="Academic Transcript"
            description="Record of completed continuing education courses and CEU hours earned through CAL ACE."
            action={<TranscriptPrintButton />}
          />
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-6 text-sm text-amber-950">
            <p className="font-medium">We couldn&apos;t load your transcript right now</p>
            <p className="mt-1">Please try again in a moment.</p>
          </div>
        </div>
        <TranscriptPrintStyles />
      </div>
    );
  }

  const entries = [...result.entries].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
  );
  const totalCeuHours = sumTranscriptCeuHours(entries);

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-8 sm:px-6">
      <div className="transcript-print-root space-y-6">
        <PageHeader
          title="Academic Transcript"
          description="Record of completed continuing education courses and CEU hours earned through CAL ACE."
          action={<TranscriptPrintButton />}
        />

        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Learner</p>
          <p className="font-medium text-slate-900">{learnerName}</p>
          <p className="text-sm text-muted-foreground">{session.data.user.email}</p>
        </div>

        {entries.length === 0 ? (
          <PlaceholderPanel
            title="No completed courses yet"
            description="Complete courses to build your academic transcript of earned CEU hours."
            icon={ScrollText}
          />
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <th scope="col" className="px-4 py-3">
                      Course Title
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Completion Date
                    </th>
                    <th scope="col" className="px-4 py-3 text-right">
                      CEU Hours
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <span>{entry.courseTitle}</span>
                        {entry.certificateId ? (
                          <Link
                            href={learnerCertificateHref(entry.certificateId)}
                            className="print:hidden ml-2 inline-flex text-xs font-normal text-teal-800 underline underline-offset-2 hover:text-teal-950"
                          >
                            View certificate
                          </Link>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatCompletionDate(new Date(entry.completedAt))}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCeuHours(entry.ceHours)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <section className="rounded-lg border bg-teal-50/60 p-4">
              <p className="text-sm font-medium text-teal-950">Total CEU Hours Earned</p>
              <p className="mt-1 text-2xl font-semibold text-teal-900">
                {formatCeuHours(totalCeuHours)}
              </p>
              <p className="mt-1 text-sm text-teal-800">{formatOnlineCeuHours(totalCeuHours)}</p>
            </section>
          </>
        )}
      </div>

      <TranscriptPrintStyles />
    </div>
  );
}
