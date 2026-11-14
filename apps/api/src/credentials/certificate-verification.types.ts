import { CertificateStatus, VerificationTokenStatus } from '@calace/db';

/** Learner- and third-party-facing verification status (not raw DB enum). */
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
  revokeReason?: string | null;
};

export type PublicCertificateVerificationResponse = {
  found: boolean;
  message?: string;
  record?: PublicCertificateVerificationRecord;
};

export function resolvePublicVerificationStatus(
  certificateStatus: CertificateStatus,
  tokenStatus?: VerificationTokenStatus | null,
): PublicCertificateVerificationStatus {
  if (certificateStatus === CertificateStatus.REVOKED) return 'Revoked';
  if (tokenStatus === VerificationTokenStatus.REVOKED) return 'Revoked';
  if (certificateStatus === CertificateStatus.EXPIRED) return 'Archived';
  if (certificateStatus === CertificateStatus.ISSUED) {
    if (tokenStatus === VerificationTokenStatus.ACTIVE) return 'Valid';
    if (tokenStatus === VerificationTokenStatus.EXPIRED) return 'Archived';
    return 'Revoked';
  }
  return 'Archived';
}

export function buildVerificationPagePath(certificateNo: string): string {
  return `/verify-certificate/${encodeURIComponent(certificateNo)}`;
}

export function buildVerificationPageUrl(certificateNo: string, webBaseUrl: string): string {
  const base = webBaseUrl.replace(/\/$/, '');
  return `${base}${buildVerificationPagePath(certificateNo)}`;
}
