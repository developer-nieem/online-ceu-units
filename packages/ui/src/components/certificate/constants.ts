import type { CertificateBorderOptions, CertificateProviderInfo } from './types';

/** Official hosted CAL ACE / CNA School logo. */
export const OFFICIAL_CERTIFICATE_LOGO_URL =
  'https://cna.school/wp-content/uploads/2021/02/cropped-cna-school-near-me-logo.webp';

/** Official hosted authorized signature image. */
export const OFFICIAL_CERTIFICATE_SIGNATURE_URL =
  'https://cna.school/wp-content/uploads/2026/05/Fake-Signature.png';

/** Local override when self-hosting the logo — see `assets/certificates/README.md`. */
export const LOCAL_CERTIFICATE_LOGO_SRC = '/certificates/logo.png';

/** Local override when self-hosting the signature. */
export const LOCAL_CERTIFICATE_SIGNATURE_SRC = '/certificates/signature.png';

/** Default logo source — self-hosted asset under apps/web/public. */
export const DEFAULT_CERTIFICATE_LOGO_SRC = LOCAL_CERTIFICATE_LOGO_SRC;

/** Default signature source — official hosted asset. */
export const DEFAULT_CERTIFICATE_SIGNATURE_SRC = OFFICIAL_CERTIFICATE_SIGNATURE_URL;

/** Production border path — drop final artwork into `apps/web/public/certificates/`. */
export const DEFAULT_CERTIFICATE_BORDER_SRC = '/certificates/border.png';

/** Checked-in SVG placeholders used when remote or local assets fail to load. */
export const CERTIFICATE_LOGO_PLACEHOLDER_SRC = '/certificates/logo-placeholder.svg';
export const CERTIFICATE_BORDER_PLACEHOLDER_SRC = '/certificates/border-placeholder.svg';
export const CERTIFICATE_SIGNATURE_PLACEHOLDER_SRC = '/certificates/signature-placeholder.svg';

/** @deprecated Use `DEFAULT_CERTIFICATE_BORDER_SRC` */
export const DEFAULT_CERTIFICATE_BACKGROUND_SRC = DEFAULT_CERTIFICATE_BORDER_SRC;

/** @deprecated Use `CERTIFICATE_BORDER_PLACEHOLDER_SRC` */
export const CERTIFICATE_BACKGROUND_PLACEHOLDER_SRC = CERTIFICATE_BORDER_PLACEHOLDER_SRC;

export const DEFAULT_CERTIFICATE_BORDER_OPACITY = 0.07;

/** @deprecated Use `DEFAULT_CERTIFICATE_BORDER_OPACITY` */
export const DEFAULT_CERTIFICATE_BACKGROUND_OPACITY = DEFAULT_CERTIFICATE_BORDER_OPACITY;

export const DEFAULT_CERTIFICATE_BORDER: Required<
  Pick<CertificateBorderOptions, 'enabled' | 'src' | 'opacity'>
> = {
  enabled: false,
  src: CERTIFICATE_BORDER_PLACEHOLDER_SRC,
  opacity: DEFAULT_CERTIFICATE_BORDER_OPACITY,
};

/** @deprecated Use `DEFAULT_CERTIFICATE_BORDER` */
export const DEFAULT_CERTIFICATE_BACKGROUND = DEFAULT_CERTIFICATE_BORDER;

/** URLs safe to preload on certificate routes. */
export const CERTIFICATE_PRELOAD_URLS = [
  OFFICIAL_CERTIFICATE_LOGO_URL,
  OFFICIAL_CERTIFICATE_SIGNATURE_URL,
] as const;

export const DEFAULT_INSTITUTION_LEGAL_NAME =
  'California Academy of Leadership and Continuing Education, LLC (CAL ACE)';

export const DEFAULT_PROGRAM_NAME = 'CAL ACE Nursing Academy';

/** Online CE certificate NAC display — CDPH provider number 7384. */
export const DEFAULT_CERTIFICATE_NAC_NUMBER = '7384';

export const DEFAULT_PROGRAM_ADDRESS =
  '1535 Landess Ave., Suite 103, Milpitas, CA 95035';

export const DEFAULT_PROGRAM_PHONE = '(408) 256-0763';

export const DEFAULT_CERTIFICATE_PROVIDER: CertificateProviderInfo = {
  institutionLine: DEFAULT_INSTITUTION_LEGAL_NAME,
  accreditationLine:
    'California Department of Public Health (CDPH) — NAC/Provider Number 7384',
};

export const DEFAULT_CERTIFICATE_STATEMENT =
  'This certificate verifies successful completion of the continuing education activity listed above.';

export const DEFAULT_RETENTION_STATEMENT =
  'This record/certificate must be retained by the certified Nurse Assistant for a period of (4) years starting from the date of completion.';

export const DEFAULT_COMPLIANCE_FOOTER =
  'For verification inquiries, contact the issuing institution using the certificate number above.';
