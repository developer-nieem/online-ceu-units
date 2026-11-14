/** Decorative outer-frame border. Not used for compliance data. */
export interface CertificateBorderOptions {
  /** When true, renders an optional decorative PNG border overlay. CSS frame is always used. */
  enabled?: boolean;
  /** Local path to border artwork (PNG/SVG in the web app public folder). */
  src?: string;
  /**
   * Layer opacity from 0–1. Keep low (≈0.04–0.10) for readability on screen and in print.
   * @default 0.07
   */
  opacity?: number;
}

/** @deprecated Use `CertificateBorderOptions` */
export type CertificateBackgroundOptions = CertificateBorderOptions;

export interface CertificateAssetPaths {
  /** Institution logo — top of certificate. Defaults to official hosted logo. */
  logo?: string;
  /** Decorative outer border frame. */
  border?: string;
  /** Authorized signature image. Defaults to official hosted signature. */
  signature?: string;
  /** Local logo fallback when the primary `logo` URL fails. */
  logoFallback?: string;
  /** Local border fallback when the primary `border` path fails. */
  borderFallback?: string;
  /** Local signature fallback when the primary `signature` URL fails. */
  signatureFallback?: string;
}

export interface CertificateSignatureInfo {
  /** Signatory printed name beneath the signature image. */
  name: string;
  /** Title or role beneath the signatory name. */
  title: string;
  /** Optional extra lines (e.g. institution, site) rendered beneath the title. */
  additionalLines?: string[];
}

export interface CertificateProviderInfo {
  /** Legal institution name — first provider line. */
  institutionLine: string;
  /** CDPH NAC/provider accreditation — second provider line. */
  accreditationLine: string;
}

export interface CertificateComplianceInfo {
  /** Structured CDPH provider footer lines (centered). */
  provider?: CertificateProviderInfo;
  /** @deprecated Use `provider` with `institutionLine` and `accreditationLine`. */
  providerInfo?: string;
  /** Formal completion verification statement. */
  certificateStatement?: string;
  /** Regulatory or board compliance footer. */
  complianceFooter?: string;
  /** Record retention guidance for the learner. */
  retentionStatement?: string;
}

export interface CertificateLayoutOptions {
  /** Page orientation for print layout. @default 'landscape' */
  orientation?: 'portrait' | 'landscape';
}

export interface CertificateDisplayData {
  institutionName: string;
  recipientName: string;
  courseTitle: string;
  ceHours: number | string;
  certificateNo: string;
  issuedAt: Date | string;
  /** Completion date; defaults to `issuedAt` when omitted. */
  completedAt?: Date | string;
  /** Main certificate heading. @default 'Certificate of Completion' */
  certificateTitle?: string;
  /** ELRU program name (e.g. CAL ACE Nursing Academy). */
  programName?: string;
  programAddress?: string;
  programPhone?: string;
  /** Learner CNA license / certificate number. Omit the row when empty. */
  cnaLicenseNumber?: string | null;
}

export interface CertificateProps extends CertificateDisplayData {
  assets?: CertificateAssetPaths;
  signature: CertificateSignatureInfo;
  compliance?: CertificateComplianceInfo;
  border?: CertificateBorderOptions;
  /** @deprecated Use `border` */
  background?: CertificateBorderOptions;
  layout?: CertificateLayoutOptions;
  className?: string;
}
