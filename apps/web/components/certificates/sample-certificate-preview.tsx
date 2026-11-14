'use client';

import '@calace/ui/certificate.css';

import { Certificate } from '@calace/ui/components/certificate';
import {
  DEFAULT_INSTITUTION_LEGAL_NAME,
  DEFAULT_PROGRAM_ADDRESS,
  DEFAULT_PROGRAM_NAME,
  DEFAULT_PROGRAM_PHONE,
} from '@calace/ui/components/certificate';
import { Button } from '@calace/ui/components/ui/button';
import Link from 'next/link';

function SampleCertificateDocument({ className }: { className?: string }) {
  const sampleDate = new Date();

  return (
    <Certificate
      institutionName={DEFAULT_PROGRAM_NAME}
      recipientName="Jane Doe"
      courseTitle="Sample CE Course"
      ceHours={1}
      certificateNo="SAMPLE-0000"
      issuedAt={sampleDate}
      completedAt={sampleDate}
      programName={DEFAULT_PROGRAM_NAME}
      programAddress={DEFAULT_PROGRAM_ADDRESS}
      programPhone={DEFAULT_PROGRAM_PHONE}
      cnaLicenseNumber="00000000"
      assets={{ signature: '/certificates/signature.png' }}
      signature={{
        name: 'Dr. Cliff Roperez, DBA, LVN',
        title: 'School Administrator',
        additionalLines: ['CAL ACE Nursing Academy', '(Site: OnlineCEunits.com)'],
      }}
      compliance={{
        provider: {
          institutionLine: DEFAULT_INSTITUTION_LEGAL_NAME,
          accreditationLine: 'CDPH-Approved Online CE Provider — NAC# 7384',
        },
      }}
      border={{ enabled: true, opacity: 0.08 }}
      layout={{ orientation: 'landscape' }}
      className={className}
    />
  );
}

export function SampleCertificatePreview({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <section className="space-y-4 border-t border-slate-200 pt-6 print:hidden">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Sample certificate</h2>
            <p className="mt-1 text-sm text-slate-600">
              For reference — this is the format every CAL ACE certificate follows.
            </p>
          </div>
          <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
            Sample Preview
          </span>
        </div>

        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 p-4">
          <div className="relative mx-auto max-w-2xl overflow-x-auto overflow-y-hidden rounded-lg border border-slate-100 bg-white">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
            >
              <span className="rotate-[-18deg] select-none text-3xl font-black uppercase tracking-widest text-slate-900/10 sm:text-4xl">
                Sample
              </span>
            </div>
            <div className="origin-top scale-[0.85] opacity-90 sm:scale-90">
              <SampleCertificateDocument className="mx-auto max-w-2xl" />
            </div>
          </div>
        </div>

        <div>
          <Button asChild variant="outline">
            <Link href="/courses">Return to My Courses</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-900">Preview: your certificate</p>
            <p className="text-sm text-slate-600">
              This is a sample of the certificate you&apos;ll receive after completing a course.
            </p>
          </div>
          <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
            Sample — preview only
          </span>
        </div>

        <div className="relative overflow-hidden rounded-lg border border-slate-100">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
          >
            <span className="rotate-[-18deg] select-none text-4xl font-black uppercase tracking-widest text-slate-900/10 sm:text-6xl">
              Sample
            </span>
          </div>
          <div className="opacity-90">
            <SampleCertificateDocument className="mx-auto max-w-4xl" />
          </div>
        </div>
      </div>

      <div>
        <Button asChild>
          <Link href="/courses">Return to My Courses</Link>
        </Button>
      </div>
    </div>
  );
}
