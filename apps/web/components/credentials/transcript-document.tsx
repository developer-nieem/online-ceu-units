'use client';

import '@calace/ui/transcript.css';

import { Transcript } from '@calace/ui/components/transcript';
import type { TranscriptEntryRecord } from '@/lib/credentials-types';
import { buildVerificationPageUrl } from '@/lib/certificate-verification';

export function TranscriptDocument({
  learnerName,
  learnerEmail,
  entries,
  totalCeHours,
  documentId,
}: {
  learnerName: string;
  learnerEmail: string;
  entries: TranscriptEntryRecord[];
  totalCeHours: number;
  documentId: string;
}) {
  return (
    <div id={documentId} className="transcript-print-root rounded-lg border bg-white p-4">
      <Transcript
        learner={{ name: learnerName, email: learnerEmail }}
        generatedAt={new Date()}
        courses={entries.map((entry) => ({
          courseTitle: entry.title,
          completedOn: entry.completedOn,
          ceHours: entry.ceHours,
          deliveryMode: 'online',
          certificateNo: entry.certificateNo,
          certificateHref: entry.verificationUrl ?? (entry.certificateNo ? buildVerificationPageUrl(entry.certificateNo) : undefined),
        }))}
        totals={{ totalOnlineCeUnits: totalCeHours }}
      />
    </div>
  );
}
