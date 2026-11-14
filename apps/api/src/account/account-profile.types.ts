import type { CaliforniaRenewalProgress } from './california-renewal-progress';

export type LearnerProfileDataV1 = {
  preferredDisplayName?: string | null;
  cnaIssuingState?: string | null;
  hhaCertificateNumber?: string | null;
  hhaEffectiveDate?: string | null;
  hhaExpirationDate?: string | null;
};

export type AccountProfileEditable = {
  firstName: string | null;
  lastName: string | null;
  preferredDisplayName: string | null;
  cnaLicenseNumber: string | null;
  cnaIssuingState: string | null;
  cnaRenewalDueDate: string | null;
  cnaEffectiveDate: string | null;
  timezone: string | null;
  hhaCertificateNumber: string | null;
  hhaEffectiveDate: string | null;
  hhaExpirationDate: string | null;
  birthMonth: number | null;
  birthDay: number | null;
  city: string | null;
  cityConsentGiven: boolean | null;
};

export type AccountProfileReadOnly = {
  email: string;
  memberSince: string;
  completedCeHours: number;
  certificatesEarned: number;
};

export type AccountProfileResponse = {
  editable: AccountProfileEditable;
  readOnly: AccountProfileReadOnly;
  renewalProgress: CaliforniaRenewalProgress;
  supportEmail: string;
  updatedAt: string;
};
