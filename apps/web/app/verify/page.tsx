import { Shield } from 'lucide-react';

import { EmployerCertificateVerificationPanel } from '@/components/credentials/employer-certificate-verification-panel';

export const metadata = {
  title: 'Employer certificate verification | CAL ACE',
  description:
    'Verify CAL ACE Nursing Academy continuing education certificates using serial number and student last name.',
};

export default function EmployerVerifyPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Shield className="mt-0.5 h-8 w-8 text-teal-700" aria-hidden />
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Employer certificate verification</h1>
          <p className="mt-1 text-sm text-slate-600">
            Human resources teams, staffing agencies, and compliance officers can confirm that a CAL
            ACE certificate was issued for an online continuing education course. Enter the serial
            number and the student&apos;s last name from the printed credential.
          </p>
        </div>
      </div>

      <EmployerCertificateVerificationPanel />
    </div>
  );
}
