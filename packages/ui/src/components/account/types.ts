import type { ReactNode } from 'react';

import type { CompletedCourseRecord } from './calculate-california-renewal-progress';

export interface LearnerIdentityData {
  fullLegalName: string;
  primaryEmail: string;
}

export interface LearnerPersonalInfo {
  phoneNumber: string;
  birthDay: string;
  birthMonth: string;
  county: string;
  state: string;
}

export interface CnaLicenseInfo {
  licenseNumber: string;
  effectiveDate: string;
  expirationDate: string;
}

export interface HhaCertificateInfo {
  certificateNumber: string;
  effectiveDate: string;
  expirationDate: string;
}

export interface LearnerProfileData extends LearnerIdentityData {
  personal: LearnerPersonalInfo;
  cnaLicense: CnaLicenseInfo;
  hhaCertificate: HhaCertificateInfo;
  /** Completed CAL ACE online courses — used for renewal year assignment. */
  completedCourses: ReadonlyArray<CompletedCourseRecord>;
}

export interface LockedIdentityFieldProps {
  id: string;
  label: string;
  value: string;
  className?: string;
}

export interface IdentityLockNoticeProps {
  className?: string;
  supportEmail?: string;
}

export interface LearnerIdentitySectionProps extends LearnerIdentityData {
  className?: string;
  supportEmail?: string;
}

export interface ProfileSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  headingId: string;
}

export interface ProfileFieldProps {
  id: string;
  label: string;
  value: string;
  onChange?: (value: string) => void;
  type?: 'text' | 'email' | 'tel' | 'date';
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
  hint?: string;
}

export interface ProfileSelectFieldProps {
  id: string;
  label: string;
  value: string;
  onChange?: (value: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
  className?: string;
  readOnly?: boolean;
  hint?: string;
}

export interface LearnerProfileProps {
  profile: LearnerProfileData;
  className?: string;
  supportEmail?: string;
  onSave?: (profile: LearnerProfileData) => void | Promise<void>;
}

/** @deprecated Use CaliforniaRenewalProgressResult from calculate-california-renewal-progress. */
export interface RenewalProgressSummaryData {
  year1CeUnits: number;
  year2CeUnits: number;
  remainingCeUnitsNeeded: number;
}

/** @deprecated Use CaliforniaRenewalProgressProps. */
export interface RenewalProgressSummaryProps extends RenewalProgressSummaryData {
  className?: string;
}
