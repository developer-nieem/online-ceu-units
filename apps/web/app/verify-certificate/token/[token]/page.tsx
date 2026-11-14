import Link from 'next/link';

import { CertificateVerificationResult } from '@/components/credentials/certificate-verification-result';
import { verifyCertificateByToken } from '@/lib/certificate-verification';

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata() {
  return {
    title: `Verify certificate | CAL ACE`,
  };
}

export default async function VerifyCertificateTokenPage({ params }: Props) {
  const { token } = await params;
  const decoded = decodeURIComponent(token);
  const result = await verifyCertificateByToken(decoded);

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
