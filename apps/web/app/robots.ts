import type { MetadataRoute } from 'next';

import { absoluteUrl } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/cms',
          '/cms/',
          '/api/',
          '/dashboard',
          '/dashboard/',
          '/account',
          '/account/',
          '/billing',
          '/billing/',
          '/notifications',
          '/notifications/',
          '/transcript',
          '/certificates',
          '/compliance',
          '/support',
          '/community',
          '/player',
          '/player/',
          '/checkout',
          '/purchase/',
          '/review-login',
          '/verify-email',
          '/reset-password',
          '/forgot-password',
          '/unsubscribe',
        ],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/').replace(/\/$/, ''),
  };
}
