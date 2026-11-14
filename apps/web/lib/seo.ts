export const SITE_NAME = 'CAL ACE Nursing Academy';
export const SITE_LEGAL_NAME =
  'California Academy of Leadership and Continuing Education (CAL ACE), LLC';
export const SITE_DESCRIPTION =
  'CDPH-compliant 50-minute CNA continuing education courses, automated birthday math, and unlimited renewal plans starting at $19.50. Start free with 3 courses.';
export const SITE_TITLE = 'California CNA License Renewal | CAL ACE Nursing Academy';

export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? 'https://onlineceunits.com').replace(/\/$/, '');
}

export function absoluteUrl(path = '/'): string {
  const base = getSiteUrl();
  if (!path || path === '/') return `${base}/`;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Public marketing / indexable routes (no auth walls). */
export const PUBLIC_SITEMAP_PATHS = [
  '/',
  '/free',
  '/pricing',
  '/individual-courses',
  '/faq',
  '/blog',
  '/renewal-guidance',
  '/ceu',
  '/ceu/online',
  '/ceu/in-person',
  '/ceu-calculator',
  '/verify-certificate',
  '/verify',
  '/register',
  '/login',
  '/signup',
  '/terms',
  '/privacy',
  '/courses',
] as const;
