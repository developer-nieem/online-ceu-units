import { apiFetch } from './api';

export type CaliforniaRenewalProgress = {
  year1OnlineCeHours: number;
  year2OnlineCeHours: number;
  totalOnlineCeHours: number;
  remainingOnlineCeHoursAllowed: number;
  periodStart: string;
  periodEnd: string;
  periodLabel: string;
  renewalDueDate: string | null;
  periodEstimated: boolean;
  minimumHoursPerYear: number;
  maximumOnlineHours: number;
  totalRequiredHours: number;
  trackingScope: string;
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

export type AccountProfileResponse = {
  editable: AccountProfileEditable;
  readOnly: {
    email: string;
    memberSince: string;
    completedCeHours: number;
    certificatesEarned: number;
  };
  renewalProgress: CaliforniaRenewalProgress;
  supportEmail: string;
  updatedAt: string;
};

export async function getAccountProfile() {
  return apiFetch<AccountProfileResponse>('/account/profile');
}

export async function updateAccountProfile(
  editable: Partial<AccountProfileEditable>,
) {
  return apiFetch<AccountProfileResponse>('/account/profile', {
    method: 'PATCH',
    body: JSON.stringify(editable),
  });
}
