/**
 * API base URL for fetch calls.
 *
 * - Browser: empty string → same-origin `/api/*` (Next.js rewrite to Nest).
 *   Keeps auth + CSRF cookies on the web origin so credentialed POSTs work.
 * - Server (RSC): direct URL to the API process.
 */
export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return (
      process.env.INTERNAL_API_URL ??
      process.env.NEXT_PUBLIC_API_URL ??
      'http://localhost:3001'
    );
  }

  return '';
}

export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (!base) {
    return `/api${normalized}`;
  }
  const baseTrimmed = base.replace(/\/$/, '');
  if (normalized.startsWith('/api')) {
    return `${baseTrimmed}${normalized}`;
  }
  return `${baseTrimmed}/api${normalized}`;
}
