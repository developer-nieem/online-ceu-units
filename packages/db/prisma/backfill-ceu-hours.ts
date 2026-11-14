/**
 * Development backfill: align completion, certificate, and transcript CE hours with course_version.ce_hours.
 * Run via seed or: pnpm --filter @calace/db exec tsx prisma/backfill-ceu-hours.ts
 */
import { CertificateStatus, PrismaClient, TranscriptEntryType } from '@prisma/client';

const prisma = new PrismaClient();

function formatOnlineCeuHours(ceHours: number): string {
  const n = Number(ceHours);
  const unit = n === 1 ? 'hour' : 'hours';
  const value = Number.isInteger(n) ? String(n) : n.toFixed(1);
  return `${value} Online CE ${unit}`;
}

export async function backfillCeuHoursFromCourseVersions(): Promise<{
  completionsUpdated: number;
  certificatesUpdated: number;
  transcriptsUpdated: number;
}> {
  let completionsUpdated = 0;
  let certificatesUpdated = 0;
  let transcriptsUpdated = 0;

  const completions = await prisma.completion.findMany({
    include: {
      courseVersion: { include: { course: true } },
      certificate: true,
      transcriptEntries: {
        where: { entryType: TranscriptEntryType.COMPLETION },
      },
    },
  });

  for (const completion of completions) {
    const authoritative = Number(completion.courseVersion.ceHours);
    if (!Number.isFinite(authoritative) || authoritative <= 0) continue;

    const now = new Date().toISOString();

    if (Number(completion.ceHoursEarned) !== authoritative) {
      await prisma.completion.update({
        where: { id: completion.id },
        data: {
          ceHoursEarned: authoritative,
          metadata: {
            ...(completion.metadata as object),
            ceuHoursCorrectedAt: now,
            ceuHoursSource: 'backfill_course_version',
          },
        },
      });
      completionsUpdated += 1;
    }

    const cert = completion.certificate;
    if (cert?.status === CertificateStatus.ISSUED) {
      const payload = (cert.payload ?? {}) as Record<string, unknown>;
      const stored = Number(payload.ceuHours ?? payload.onlineCeuHours ?? 0);
      if (stored !== authoritative) {
        const nextPayload = {
          ...payload,
          ceuHours: authoritative,
          onlineCeuHours: authoritative,
          onlineCeuHoursLabel: formatOnlineCeuHours(authoritative),
          ceuCorrection: {
            correctedAt: now,
            previousCeuHours: stored,
            reason: 'backfill_dementia_care_1ceu',
          },
        };
        await prisma.certificate.update({
          where: { id: cert.id },
          data: { payload: nextPayload },
        });
        certificatesUpdated += 1;
        if (completion.courseVersion.course.slug === 'dementia-care') {
          console.log(
            `  Backfilled dementia-care certificate ${cert.certificateNo}: ${stored} → ${authoritative} Online CE hour(s)`,
          );
        }
      }
    }

    for (const entry of completion.transcriptEntries) {
      if (Number(entry.ceHours) === authoritative) continue;
      await prisma.transcriptEntry.update({
        where: { id: entry.id },
        data: {
          ceHours: authoritative,
          metadata: {
            ...(entry.metadata as object),
            ceuHoursCorrectedAt: now,
            previousCeHours: Number(entry.ceHours),
          },
        },
      });
      transcriptsUpdated += 1;
    }
  }

  return { completionsUpdated, certificatesUpdated, transcriptsUpdated };
}

async function main() {
  console.log('Backfilling CE hours from course_version.ce_hours…');
  const result = await backfillCeuHoursFromCourseVersions();
  console.log('Backfill complete:', result);
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
