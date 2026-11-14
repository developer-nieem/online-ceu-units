import QRCode from 'qrcode';

import { Badge } from '@calace/ui/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@calace/ui/components/ui/card';
import { ShieldCheck, ShieldOff, ShieldQuestion } from 'lucide-react';

import {
  buildVerificationPageUrl,
  type PublicCertificateVerificationRecord,
} from '@/lib/certificate-verification';

function statusVariant(status: PublicCertificateVerificationRecord['status']) {
  if (status === 'Valid') return 'success' as const;
  if (status === 'Revoked') return 'warning' as const;
  return 'secondary' as const;
}

function StatusIcon({ status }: { status: PublicCertificateVerificationRecord['status'] }) {
  if (status === 'Valid') return <ShieldCheck className="h-5 w-5 text-teal-700" aria-hidden />;
  if (status === 'Revoked') return <ShieldOff className="h-5 w-5 text-amber-700" aria-hidden />;
  return <ShieldQuestion className="h-5 w-5 text-muted-foreground" aria-hidden />;
}

async function generateQrDataUrl(url: string): Promise<string | null> {
  try {
    return await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 160,
    });
  } catch (err) {
    console.error('[QR] toDataURL failed:', err);
    return null;
  }
}

export async function CertificateVerificationResult({
  record,
}: {
  record: PublicCertificateVerificationRecord;
}) {
  const verificationUrl = buildVerificationPageUrl(record.certificateNumber);
  const qrDataUrl =
    record.status === 'Valid' ? await generateQrDataUrl(verificationUrl) : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <StatusIcon status={record.status} />
            <div>
              <CardTitle className="text-lg">Certificate verification</CardTitle>
              <CardDescription>
                Public authenticity record — no account access is provided.
              </CardDescription>
            </div>
          </div>
          <Badge variant={statusVariant(record.status)}>{record.status}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Certificate number</dt>
            <dd className="font-mono text-xs font-medium">{record.certificateNumber}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Certificate status</dt>
            <dd className="font-medium">{record.status}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Learner name</dt>
            <dd className="font-medium">{record.learnerName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Course title</dt>
            <dd className="font-medium">{record.courseTitle}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Issue date</dt>
            <dd className="font-medium">{record.issueDate}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Completion date</dt>
            <dd className="font-medium">{record.completionDate}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">CE units earned</dt>
            <dd className="font-medium">{record.ceUnitsLabel}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Delivery method</dt>
            <dd className="font-medium">{record.deliveryMethod}</dd>
          </div>
        </dl>

        {qrDataUrl ? (
          <div className="mt-6 flex flex-col items-center gap-2 border-t border-slate-200 pt-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt={`QR code linking to the verification page for certificate ${record.certificateNumber}`}
              width={160}
              height={160}
              className="rounded-md border border-slate-200 bg-white p-2"
            />
            <p className="text-center text-xs text-muted-foreground">
              Scan to open this verification page.
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}