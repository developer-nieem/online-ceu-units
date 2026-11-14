import { Badge } from '@calace/ui/components/ui/badge';
import { Button } from '@calace/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@calace/ui/components/ui/card';
import { Award, Download, QrCode } from 'lucide-react';
import Link from 'next/link';

import { CopyVerificationLinkButton } from '@/components/credentials/copy-verification-link-button';
import { formatOnlineCeuHours } from '@/lib/ceu-display';
import { buildVerificationPageUrl } from '@/lib/certificate-verification';
import type { CertificateRecord } from '@/lib/credentials-types';

export function CertificatePreviewCard({ certificate }: { certificate: CertificateRecord }) {
  const verificationUrl =
    certificate.verificationUrl ?? buildVerificationPageUrl(certificate.certificateNo);
  const payload = certificate.payload as {
    provider?: {
      name?: string;
      contactEmail?: string;
      approvalStatusLabel?: string | null;
    };
    instructor?: { name?: string };
    exports?: { pdf?: { note?: string }; qr?: { note?: string } };
  };

  return (
    <Card className="overflow-hidden print:border print:shadow-none">
      <div className="h-1 bg-gradient-to-r from-teal-600 to-teal-400" aria-hidden />
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-teal-700" aria-hidden />
            <div>
              <CardTitle className="text-lg">{certificate.courseTitle}</CardTitle>
              <CardDescription>Certificate of completion</CardDescription>
            </div>
          </div>
          <Badge variant="secondary">
            {certificate.onlineCeuHoursLabel ??
              formatOnlineCeuHours(
                (certificate.payload as { onlineCeuHours?: number })?.onlineCeuHours ??
                  certificate.ceuHours,
              )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <dl className="grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Learner</dt>
            <dd className="font-medium">{certificate.learnerName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Completed</dt>
            <dd className="font-medium">
              {certificate.completedAt
                ? new Date(certificate.completedAt).toLocaleDateString()
                : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Certificate number</dt>
            <dd className="font-mono text-xs">{certificate.certificateNo}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Verification URL</dt>
            <dd className="mt-0.5 break-all font-mono text-xs text-teal-900">{verificationUrl}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Internal verification code</dt>
            <dd className="font-mono text-xs tracking-wide">{certificate.verificationCode}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Provider</dt>
            <dd>
              {payload.provider?.name ?? 'CAL ACE Nursing Academy'}
              {payload.provider?.contactEmail ? (
                <span className="block text-xs text-muted-foreground">
                  {payload.provider.contactEmail}
                </span>
              ) : null}
              {payload.provider?.approvalStatusLabel ? (
                <span className="block text-xs text-teal-800">
                  {payload.provider.approvalStatusLabel}
                </span>
              ) : null}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Instructor</dt>
            <dd>{payload.instructor?.name ?? 'CAL ACE Instructional Team'}</dd>
          </div>
        </dl>

        <div className="rounded-md border border-dashed bg-muted/40 p-3 text-xs text-muted-foreground">
          <p className="flex items-center gap-1 font-medium text-foreground">
            <QrCode className="h-3.5 w-3.5" aria-hidden />
            QR verification
          </p>
          <p className="mt-1">
            {payload.exports?.qr?.note ??
              'Scan the QR on your full certificate to verify.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 print:hidden">
          <CopyVerificationLinkButton url={verificationUrl} />
          <Button variant="outline" size="sm" asChild>
            <Link href={verificationUrl} target="_blank" rel="noopener noreferrer">
              Open verification page
            </Link>
          </Button>
          <Button variant="outline" size="sm" disabled title={certificate.download.note}>
            <Download className="mr-1 h-4 w-4" aria-hidden />
            Download PDF (soon)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
