import { buildVerificationTokenPageUrl } from '@/lib/certificate-verification';

/** Public web verification page URL encoded in certificate QR codes. */
export function buildVerifyTokenPageUrl(token: string): string {
  return buildVerificationTokenPageUrl(token);
}
