'use client';

import * as React from 'react';

import { Button } from '../ui/button';

import { calculateCaliforniaRenewalProgress } from './calculate-california-renewal-progress';
import { CaliforniaRenewalProgress } from './california-renewal-progress';
import { CdphResourcesSection } from './cdph-resources-section';
import { ComplianceNotesSection } from './compliance-notes-section';
import {
  BIRTH_DAYS,
  BIRTH_MONTHS,
  IDENTITY_SUPPORT_EMAIL,
  US_STATES,
} from './constants';
import { LearnerIdentitySection } from './learner-identity-section';
import { ProfileField, ProfileSelectField } from './profile-field';
import { ProfileSection } from './profile-section';
import type { LearnerProfileData, LearnerProfileProps } from './types';

export function LearnerProfile({
  profile: initialProfile,
  className,
  supportEmail = IDENTITY_SUPPORT_EMAIL,
  onSave,
}: LearnerProfileProps) {
  const [profile, setProfile] = React.useState(initialProfile);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const renewalProgress = React.useMemo(
    () =>
      calculateCaliforniaRenewalProgress({
        cnaEffectiveDate: profile.cnaLicense.effectiveDate,
        cnaExpirationDate: profile.cnaLicense.expirationDate,
        completedCourses: profile.completedCourses,
      }),
    [
      profile.cnaLicense.effectiveDate,
      profile.cnaLicense.expirationDate,
      profile.completedCourses,
    ],
  );

  const updatePersonal = (field: keyof LearnerProfileData['personal'], value: string) => {
    setProfile((current) => ({
      ...current,
      personal: { ...current.personal, [field]: value },
    }));
    setSaved(false);
  };

  const updateCnaLicense = (field: keyof LearnerProfileData['cnaLicense'], value: string) => {
    setProfile((current) => ({
      ...current,
      cnaLicense: { ...current.cnaLicense, [field]: value },
    }));
    setSaved(false);
  };

  const updateHhaCertificate = (
    field: keyof LearnerProfileData['hhaCertificate'],
    value: string,
  ) => {
    setProfile((current) => ({
      ...current,
      hhaCertificate: { ...current.hhaCertificate, [field]: value },
    }));
    setSaved(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onSave?.(profile);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className={className} onSubmit={handleSubmit}>
      <div className="flex flex-col gap-6">
        <LearnerIdentitySection
          fullLegalName={profile.fullLegalName}
          primaryEmail={profile.primaryEmail}
          supportEmail={supportEmail}
        />

        <ProfileSection
          description="Contact and demographic information used for enrollment and compliance."
          headingId="contact-info-heading"
          title="Contact Information"
        >
          <div className="grid gap-5">
            <ProfileField
              id="phone-number"
              label="Phone Number"
              onChange={(value) => updatePersonal('phoneNumber', value)}
              type="tel"
              value={profile.personal.phoneNumber}
            />
            <div className="grid grid-cols-2 gap-5">
              <ProfileSelectField
                id="birth-month"
                label="Birth Month"
                onChange={(value) => updatePersonal('birthMonth', value)}
                options={BIRTH_MONTHS}
                value={profile.personal.birthMonth}
              />
              <ProfileSelectField
                id="birth-day"
                label="Birth Day"
                onChange={(value) => updatePersonal('birthDay', value)}
                options={BIRTH_DAYS}
                value={profile.personal.birthDay}
              />
            </div>
            <p className="-mt-2 text-xs text-muted-foreground">
              Birth month and day only — year is not collected.
            </p>
            <div className="grid grid-cols-2 gap-5">
              <ProfileField
                id="county"
                label="County"
                onChange={(value) => updatePersonal('county', value)}
                value={profile.personal.county}
              />
              <ProfileSelectField
                id="state"
                label="State"
                onChange={(value) => updatePersonal('state', value)}
                options={US_STATES}
                value={profile.personal.state}
              />
            </div>
          </div>
        </ProfileSection>

        <ProfileSection
          description="California Department of Public Health (CDPH) certified nursing assistant credentials."
          headingId="cna-license-heading"
          title="CNA License Information"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <ProfileField
              id="cna-license-number"
              label="CNA License Number"
              onChange={(value) => updateCnaLicense('licenseNumber', value)}
              value={profile.cnaLicense.licenseNumber}
            />
            <ProfileField
              id="cna-license-effective-date"
              label="CNA License Effective Date"
              onChange={(value) => updateCnaLicense('effectiveDate', value)}
              type="date"
              value={profile.cnaLicense.effectiveDate}
            />
            <ProfileField
              id="cna-license-expiration-date"
              label="CNA License Expiration Date"
              onChange={(value) => updateCnaLicense('expirationDate', value)}
              type="date"
              value={profile.cnaLicense.expirationDate}
            />
          </div>
        </ProfileSection>

        <ProfileSection
          description="Home Health Aide credentials, if applicable to your renewal path."
          headingId="hha-certificate-heading"
          title="HHA Information (if applicable)"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <ProfileField
              id="hha-certificate-number"
              label="HHA Certificate Number"
              onChange={(value) => updateHhaCertificate('certificateNumber', value)}
              placeholder="Leave blank if not applicable"
              value={profile.hhaCertificate.certificateNumber}
            />
            <ProfileField
              id="hha-effective-date"
              label="HHA Effective Date"
              onChange={(value) => updateHhaCertificate('effectiveDate', value)}
              type="date"
              value={profile.hhaCertificate.effectiveDate}
            />
            <ProfileField
              id="hha-expiration-date"
              label="HHA Expiration Date"
              onChange={(value) => updateHhaCertificate('expirationDate', value)}
              type="date"
              value={profile.hhaCertificate.expirationDate}
            />
          </div>
        </ProfileSection>

        <CaliforniaRenewalProgress {...renewalProgress} />

        <CdphResourcesSection />

        <ComplianceNotesSection />

        <div className="flex items-center gap-4">
          <Button disabled={saving} type="submit">
            {saving ? 'Saving…' : 'Save profile'}
          </Button>
          {saved ? (
            <p className="text-sm text-emerald-700" role="status">
              Profile saved.
            </p>
          ) : null}
        </div>
      </div>
    </form>
  );
}
