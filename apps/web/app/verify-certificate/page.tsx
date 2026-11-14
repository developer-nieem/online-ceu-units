import { Shield } from 'lucide-react';

import { CertificateVerificationLookupForm } from '@/components/credentials/certificate-verification-lookup-form';

export const metadata = {
  title: 'Verify certificate | CAL ACE',
  description: 'Public certificate authenticity verification',
};

export default function VerifyCertificatePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Shield className="mt-0.5 h-8 w-8 text-teal-700" aria-hidden />
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Verify a certificate</h1>
          <p className="mt-1 text-sm text-slate-600">
            Employers, regulators, and training coordinators can confirm that a CAL ACE certificate
            was issued for an online continuing education course. Enter the certificate number printed
            on the credential.
          </p>
        </div>
      </div>

      <CertificateVerificationLookupForm />

      <p className="text-xs text-muted-foreground">
        Scan the QR code on a certificate to open its verification page directly.
      </p>
    </div>
  );
}
