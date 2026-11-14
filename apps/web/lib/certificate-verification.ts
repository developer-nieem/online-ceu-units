import { apiUrl } from './api-config';

export type PublicCertificateVerificationStatus = 'Valid' | 'Revoked' | 'Archived';

export type PublicCertificateVerificationRecord = {
  certificateNumber: string;
  learnerName: string;
  courseTitle: string;
  completionDate: string;
  issueDate: string;
  ceUnitsEarned: number;
  ceUnitsLabel: string;
  deliveryMethod: 'Online';
  status: PublicCertificateVerificationStatus;
};

export type PublicCertificateVerificationResponse = {
  found: boolean;
  message?: string;
  record?: PublicCertificateVerificationRecord;
};

export function buildVerificationPageUrl(certificateNo: string): string {
  const base =
    (typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL) ?? 'http://localhost:3000';
  return `${base.replace(/\/$/, '')}/verify-certificate/${encodeURIComponent(certificateNo)}`;
}

export function buildVerificationTokenPageUrl(token: string): string {
  const base =
    (typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL) ?? 'http://localhost:3000';
  return `${base.replace(/\/$/, '')}/verify-certificate/token/${encodeURIComponent(token)}`;
}

export async function verifyCertificateBySerialAndLastName(
  serialNumber: string,
  lastName: string,
): Promise<PublicCertificateVerificationResponse> {
  const params = new URLSearchParams({
    serialNumber: serialNumber.trim(),
    lastName: lastName.trim(),
  });
  const res = await fetch(apiUrl(`/certificates/verify?${params.toString()}`), {
    cache: 'no-store',
  });
  if (!res.ok) {
    return {
      found: false,
      message: 'Unable to verify this certificate right now. Please try again later.',
    };
  }
  return (await res.json()) as PublicCertificateVerificationResponse;
}

export async function verifyCertificateByNumber(
  certificateNo: string,
): Promise<PublicCertificateVerificationResponse> {
  const encoded = encodeURIComponent(certificateNo.trim());
  const res = await fetch(apiUrl(`/certificates/verify/certificate/${encoded}`), {
    cache: 'no-store',
  });
  if (!res.ok) {
    return {
      found: false,
      message: 'Unable to verify this certificate right now. Please try again later.',
    };
  }
  return (await res.json()) as PublicCertificateVerificationResponse;
}

export async function verifyCertificateByToken(
  token: string,
): Promise<PublicCertificateVerificationResponse> {
  const encoded = encodeURIComponent(token.trim());
  const res = await fetch(apiUrl(`/certificates/verify/${encoded}`), {
    cache: 'no-store',
  });
  if (!res.ok) {
    return {
      found: false,
      message: 'Unable to verify this certificate right now. Please try again later.',
    };
  }
  return (await res.json()) as PublicCertificateVerificationResponse;
}
