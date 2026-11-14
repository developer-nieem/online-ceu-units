import * as React from 'react';

import { cn } from '../../lib/utils';
import { CertificateLogo } from '../certificate/certificate-logo';
import {
  CERTIFICATE_LOGO_PLACEHOLDER_SRC,
  DEFAULT_CERTIFICATE_LOGO_SRC,
  DEFAULT_INSTITUTION_LEGAL_NAME,
  LOCAL_CERTIFICATE_LOGO_SRC,
} from '../certificate/constants';

import { DEFAULT_TRANSCRIPT_BRAND_NAME } from './constants';
import { formatTranscriptDate } from './format-transcript-date';
import type { TranscriptLearnerInfo } from './types';

export interface TranscriptHeaderProps {
  institutionLegalName?: string;
  institutionBrandName?: string;
  logoSrc?: string;
  logoFallbackSrc?: string | string[];
  learner: TranscriptLearnerInfo;
  generatedAt: Date | string;
  className?: string;
}

export function TranscriptHeader({
  institutionLegalName = DEFAULT_INSTITUTION_LEGAL_NAME,
  institutionBrandName = DEFAULT_TRANSCRIPT_BRAND_NAME,
  logoSrc = DEFAULT_CERTIFICATE_LOGO_SRC,
  logoFallbackSrc = [LOCAL_CERTIFICATE_LOGO_SRC, CERTIFICATE_LOGO_PLACEHOLDER_SRC],
  learner,
  generatedAt,
  className,
}: TranscriptHeaderProps) {
  return (
    <header className={cn('transcript__header', className)}>
      <CertificateLogo alt={`${institutionBrandName} logo`} fallbackSrc={logoFallbackSrc} src={logoSrc} />

      <p className="transcript__institution-legal">{institutionLegalName}</p>
      <p className="transcript__institution-brand">{institutionBrandName}</p>
      <h1 className="transcript__title">Official Transcript of Continuing Education</h1>

      <div className="transcript__learner-meta">
        <p>
          <span className="transcript__meta-label">Learner</span>
          <span className="transcript__meta-value">{learner.name}</span>
        </p>
        <p>
          <span className="transcript__meta-label">Email</span>
          <span className="transcript__meta-value">{learner.email}</span>
        </p>
        <p>
          <span className="transcript__meta-label">Transcript generated</span>
          <span className="transcript__meta-value">{formatTranscriptDate(generatedAt)}</span>
        </p>
      </div>
    </header>
  );
}
