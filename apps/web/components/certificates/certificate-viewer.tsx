'use client';

import '@calace/ui/certificate.css';

import { Certificate } from '@calace/ui/components/certificate';
import { DEFAULT_INSTITUTION_LEGAL_NAME } from '@calace/ui/components/certificate';
import { Card, CardContent } from '@calace/ui/components/ui/card';

import Link from 'next/link';
import { ScrollText } from 'lucide-react';

import { Button } from '@calace/ui/components/ui/button';

import { CopyVerificationLinkButton } from '@/components/credentials/copy-verification-link-button';
import { buildVerificationPageUrl } from '@/lib/certificate-verification';
import type { CertificateRecord } from '@/lib/credentials-types';
import { certificateViewerAnchorId } from '@/lib/learner-certificate-navigation';

import { buildVerifyTokenPageUrl } from './build-verify-token-url';
import { CertificateDownloadButton } from './certificate-download-button';
import { CertificateQrCode } from './certificate-qr-code';

type CertificatePayload = {
  cnaCertificateNumber?: string | null;
  provider?: {
    name?: string;
    contactEmail?: string;
    contactPhone?: string | null;
    contactAddress?: string | null;
    providerNumber?: string | null;
    approvalStatusLabel?: string | null;
    onlineCeApproved?: boolean;
  };
  instructor?: { name?: string };
  onlineCeuHours?: number;
};

export function CertificateViewer({ certificate }: { certificate: CertificateRecord }) {
  const payload = certificate.payload as CertificatePayload;
  const verificationPageUrl =
    certificate.verificationUrl ?? buildVerificationPageUrl(certificate.certificateNo);
  const qrVerifyUrl = certificate.verifyToken
    ? buildVerifyTokenPageUrl(certificate.verifyToken)
    : verificationPageUrl;
  const cnaCertNo = payload.cnaCertificateNumber ?? null;
  const onlineCeApproved = payload.provider?.onlineCeApproved === true;
  const deliveryClause = onlineCeApproved
    ? 'delivery via CDPH-approved online continuing education methodology'
    : 'delivery via online continuing education methodology';
  const certificateStatement = `This certificate verifies successful completion of the continuing education activity listed above and ${deliveryClause}.`;
  const viewerId = certificateViewerAnchorId(certificate.id);
  const downloadName = `CALACE-Certificate-${certificate.certificateNo}`;

  return (
    <Card className="overflow-hidden print:border-0 print:shadow-none">
      <div className="h-1 bg-gradient-to-r from-teal-700 to-teal-500 print:hidden" aria-hidden />
      <CardContent className="space-y-4 p-4 pt-5">
        <div
          id={viewerId}
          className="certificate-print-root rounded-lg border bg-[#faf9f6] p-3 shadow-inner print:border-0 print:bg-white print:p-0 print:shadow-none"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <Certificate
                institutionName={payload.provider?.name ?? 'CAL ACE Nursing Academy'}
                recipientName={certificate.learnerName}
                courseTitle={certificate.courseTitle}
                ceHours={certificate.ceuHours}
                certificateNo={certificate.certificateNo}
                issuedAt={certificate.issuedAt ?? certificate.completedAt}
                completedAt={certificate.completedAt}
                programName={payload.provider?.name ?? 'CAL ACE Nursing Academy'}
                programAddress={payload.provider?.contactAddress ?? undefined}
                programPhone={payload.provider?.contactPhone ?? undefined}
                cnaLicenseNumber={cnaCertNo}
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
                  certificateStatement,
                  complianceFooter:
                    'For third-party verification, scan the QR code or visit the public verification page using the certificate number above.',
                }}
                border={{ enabled: true, opacity: 0.08 }}
                layout={{ orientation: 'landscape' }}
                className="mx-auto max-w-4xl"
              />
            </div>

            <aside className="flex shrink-0 flex-col items-center gap-2 rounded-lg border border-dashed bg-white p-3 print:absolute print:right-4 print:top-4">
              <CertificateQrCode
                url={qrVerifyUrl}
                size={112}
                label={`Verification QR for certificate ${certificate.certificateNo}`}
              />
              <p className="max-w-[10rem] text-center font-mono text-[10px] leading-tight text-muted-foreground">
                {certificate.certificateNo}
              </p>
            </aside>
          </div>
        </div>

        <dl className="grid gap-2 text-sm sm:grid-cols-2 print:hidden">
          <div>
            <dt className="text-muted-foreground">CEU hours (Online CE)</dt>
            <dd className="font-medium">{certificate.onlineCeuHoursLabel ?? `${certificate.ceuHours} hr`}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Verification page</dt>
            <dd className="break-all font-mono text-xs text-teal-900">{verificationPageUrl}</dd>
          </div>
          {certificate.verifyToken ? (
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Verification URL (QR)</dt>
              <dd className="break-all font-mono text-xs text-teal-900">{qrVerifyUrl}</dd>
            </div>
          ) : null}
        </dl>

        <div className="flex flex-wrap gap-2 print:hidden">
          <Button variant="outline" size="sm" asChild>
            <Link href="/transcript">
              <ScrollText className="mr-1 h-4 w-4" aria-hidden />
              View transcript
            </Link>
          </Button>
          <CopyVerificationLinkButton url={verificationPageUrl} />
          <CertificateDownloadButton targetId={viewerId} fileName={downloadName} />
        </div>
      </CardContent>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .certificate-print-root.printing-active,
          .certificate-print-root.printing-active * {
            visibility: visible;
          }
          .certificate-print-root.printing-active {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `,
        }}
      />
    </Card>
  );
}
