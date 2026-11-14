import { CERTIFICATE_PRELOAD_URLS } from './constants';

export interface CertificateAssetPreloadProps {
  /** Image URLs to preload. Defaults to official certificate logo and signature. */
  urls?: readonly string[];
}

/**
 * Preloads certificate artwork when supported by the browser.
 * Render once near the top of a certificate route (Next.js hoists `<link>` to `<head>`).
 */
export function CertificateAssetPreload({
  urls = CERTIFICATE_PRELOAD_URLS,
}: CertificateAssetPreloadProps) {
  return (
    <>
      {urls.map((url) => (
        <link key={url} as="image" href={url} rel="preload" />
      ))}
    </>
  );
}
