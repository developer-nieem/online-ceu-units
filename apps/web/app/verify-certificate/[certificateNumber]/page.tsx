import Link from 'next/link';

import { CertificateVerificationLookupForm } from '@/components/credentials/certificate-verification-lookup-form';
import { CertificateVerificationResult } from '@/components/credentials/certificate-verification-result';
import { verifyCertificateByNumber } from '@/lib/certificate-verification';

type Props = { params: Promise<{ certificateNumber: string }> };

export async function generateMetadata({ params }: Props) {
  const { certificateNumber } = await params;
  return {
    title: `Verify ${decodeURIComponent(certificateNumber)} | CAL ACE`,
  };
}

export default async function VerifyCertificateNumberPage({ params }: Props) {
  const { certificateNumber } = await params;
  const decoded = decodeURIComponent(certificateNumber);
  const result = await verifyCertificateByNumber(decoded);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/verify-certificate"
          className="text-sm text-teal-800 hover:underline"
        >
          ← Look up another certificate
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-slate-900">Verification result</h1>
      </div>

      <CertificateVerificationLookupForm initialValue={decoded} />

      {!result.found || !result.record ? (
        <div
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          role="alert"
        >
          {result.message ?? 'Certificate not found. Check the number and try again.'}
        </div>
      ) : (
        <CertificateVerificationResult record={result.record} />
      )}
    </div>
  );
}
