import {
  CERTIFICATE_BORDER_PLACEHOLDER_SRC,
  CERTIFICATE_LOGO_PLACEHOLDER_SRC,
  CERTIFICATE_SIGNATURE_PLACEHOLDER_SRC,
  DEFAULT_CERTIFICATE_BORDER_SRC,
  DEFAULT_CERTIFICATE_LOGO_SRC,
  DEFAULT_CERTIFICATE_SIGNATURE_SRC,
  LOCAL_CERTIFICATE_LOGO_SRC,
  LOCAL_CERTIFICATE_SIGNATURE_SRC,
} from './constants';
import type { CertificateAssetPaths } from './types';

export interface ResolvedCertificateAssets {
  logo: string;
  logoFallback: string;
  border: string;
  borderFallback: string;
  signature: string;
  signatureFallback: string;
}

/** Resolves primary and fallback asset paths for certificate rendering. */
export function resolveCertificateAssets(
  assets?: CertificateAssetPaths,
): ResolvedCertificateAssets {
  return {
    logo: assets?.logo ?? DEFAULT_CERTIFICATE_LOGO_SRC,
    logoFallback: assets?.logoFallback ?? LOCAL_CERTIFICATE_LOGO_SRC,
    border: assets?.border ?? DEFAULT_CERTIFICATE_BORDER_SRC,
    borderFallback: assets?.borderFallback ?? CERTIFICATE_BORDER_PLACEHOLDER_SRC,
    signature: assets?.signature ?? DEFAULT_CERTIFICATE_SIGNATURE_SRC,
    signatureFallback: assets?.signatureFallback ?? LOCAL_CERTIFICATE_SIGNATURE_SRC,
  };
}

/** Last-resort SVG placeholders when remote and local assets both fail. */
export const CERTIFICATE_ASSET_LAST_RESORT = {
  logo: CERTIFICATE_LOGO_PLACEHOLDER_SRC,
  border: CERTIFICATE_BORDER_PLACEHOLDER_SRC,
  signature: CERTIFICATE_SIGNATURE_PLACEHOLDER_SRC,
} as const;
