'use client';

import * as React from 'react';

import { cn } from '../../lib/utils';

import { CertificateBorder } from './certificate-border';
import { CertificateLogo } from './certificate-logo';
import { CertificateSignature } from './certificate-signature';
import {
  DEFAULT_CERTIFICATE_NAC_NUMBER,
  DEFAULT_CERTIFICATE_PROVIDER,
  DEFAULT_CERTIFICATE_STATEMENT,
  DEFAULT_COMPLIANCE_FOOTER,
  DEFAULT_PROGRAM_NAME,
  DEFAULT_RETENTION_STATEMENT,
} from './constants';
import { CertificateProvider } from './certificate-provider';
import { resolveCertificateAssets, CERTIFICATE_ASSET_LAST_RESORT } from './resolve-assets';
import { CALACE_DISPLAY_TIMEZONE } from './display-timezone';
import { formatCeHours } from './format-ce-hours';
import type { CertificateProps } from './types';

function formatCertificateDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: CALACE_DISPLAY_TIMEZONE,
  }).format(date);
}

export function Certificate({
  institutionName,
  recipientName,
  courseTitle,
  ceHours,
  certificateNo,
  issuedAt,
  completedAt,
  certificateTitle = 'Certificate of Completion',
  programName,
  programAddress,
  programPhone,
  cnaLicenseNumber,
  assets,
  signature,
  compliance,
  border,
  background,
  layout,
  className,
}: CertificateProps) {
  const borderOptions = border ?? background;
  const orientation = layout?.orientation ?? 'landscape';
  const completionDate = completedAt ?? issuedAt;
  const resolvedAssets = resolveCertificateAssets(assets);

  const certificateStatement =
    compliance?.certificateStatement ?? DEFAULT_CERTIFICATE_STATEMENT;
  const complianceFooter = compliance?.complianceFooter ?? DEFAULT_COMPLIANCE_FOOTER;
  const retentionStatement = compliance?.retentionStatement ?? DEFAULT_RETENTION_STATEMENT;
  const provider = compliance?.provider ?? DEFAULT_CERTIFICATE_PROVIDER;
  const resolvedProgramName =
    programName?.trim() || institutionName?.trim() || DEFAULT_PROGRAM_NAME;
  const resolvedAddress = programAddress?.trim() || '';
  const resolvedPhone = programPhone?.trim() || '';
  const resolvedCnaLicense = cnaLicenseNumber?.trim() || '';

  return (
    <article
      className={cn(
        'certificate',
        orientation === 'landscape' && 'certificate--landscape',
        className,
      )}
      data-certificate-orientation={orientation}
      data-certificate-printable="true"
    >
      <div aria-hidden="true" className="certificate__frame" />

      <CertificateBorder
        options={borderOptions}
        src={resolvedAssets.border}
        fallbackSrc={[resolvedAssets.borderFallback, CERTIFICATE_ASSET_LAST_RESORT.border]}
      />

      <div className="certificate__content">
        <header className="certificate__header">
          <CertificateLogo
            src={resolvedAssets.logo}
            fallbackSrc={[resolvedAssets.logoFallback, CERTIFICATE_ASSET_LAST_RESORT.logo]}
            alt={`${institutionName} logo`}
          />
          {provider.institutionLine ? (
            <p className="certificate__institution">{provider.institutionLine}</p>
          ) : null}
          <h1 className="certificate__title">{certificateTitle}</h1>
        </header>

        <div className="certificate__body">
          <p className="certificate__lead">This certifies that</p>
          <p className="certificate__recipient">{recipientName}</p>
          {resolvedCnaLicense ? (
            <p className="certificate__detail">CNA Certification Number: {resolvedCnaLicense}</p>
          ) : null}
          <p className="certificate__lead">has successfully completed</p>
          <p className="certificate__course">{courseTitle}</p>
          <p className="certificate__hours">{formatCeHours(ceHours)}</p>
          <p className="certificate__detail">
            <span className="certificate__detail-label">Date of completion:</span>{' '}
            <span className="certificate__detail-value">{formatCertificateDate(completionDate)}</span>
          </p>
          {/* NOTE: LLC legal name is a deliberate CAL ACE provider literal — make dynamic per-tenant when a legal-entity field exists. */}
          <p className="certificate__detail">
            This continuing education activity is provided by {resolvedProgramName},
            California Academy of Leadership and Continuing Education, LLC (NAC#{' '}
            {DEFAULT_CERTIFICATE_NAC_NUMBER})
            {resolvedAddress ? <>, located in {resolvedAddress}</> : null}.
            {/* NOTE: support email + phone are deliberate CAL ACE platform contacts —
                make per-tenant dynamic when contact fields exist. resolvedPhone no longer drives display. */}
            {resolvedPhone ? (
              <> For program inquiries, please email support@onlineceunits.com or contact (408) 256-0763.</>
            ) : null}
          </p>
          <p className="certificate__statement">{certificateStatement}</p>
        </div>

        <footer className="certificate__footer">
          <div className="certificate__authority-row">
            <CertificateSignature
              imageSrc={resolvedAssets.signature}
              fallbackSrc={[
                resolvedAssets.signatureFallback,
                CERTIFICATE_ASSET_LAST_RESORT.signature,
              ]}
              name={signature.name}
              title={signature.title}
              additionalLines={signature.additionalLines}
            />

            <div className="certificate__meta">
              <p>
                <span className="certificate__meta-label">CE Certificate No.</span>
                <span className="certificate__meta-value">{certificateNo}</span>
              </p>
              <p>
                <span className="certificate__meta-label">Date issued</span>
                <span className="certificate__meta-value">{formatCertificateDate(issuedAt)}</span>
              </p>
            </div>
          </div>

          <CertificateProvider
            provider={provider}
            providerInfo={compliance?.providerInfo}
            hideInstitution
          />

          <p className="certificate__compliance">{complianceFooter}</p>
          <p className="certificate__retention">{retentionStatement}</p>
        </footer>
      </div>
    </article>
  );
}
