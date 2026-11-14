import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import '@calace/ui/globals.css';

import { JsonLd } from '@/components/seo/json-ld';
import {
  SITE_DESCRIPTION,
  SITE_LEGAL_NAME,
  SITE_NAME,
  SITE_TITLE,
  absoluteUrl,
  getSiteUrl,
} from '@/lib/seo';

import { AppProviders } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const SITE_URL = getSiteUrl();

export const viewport: Viewport = {
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'California CNA renewal',
    'CNA continuing education',
    'CDPH compliant CEU',
    'CNA license renewal online',
    'CAL ACE Nursing Academy',
    'CNA CEU courses',
    'birthday math renewal',
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_LEGAL_NAME,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: '/og-cover.jpg',
        width: 1200,
        height: 630,
        alt: 'Online CEU Courses for your CNA Renewal — CAL ACE',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/og-cover.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/',
  },
  applicationName: SITE_NAME,
};

function siteStructuredData() {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE_NAME,
      legalName: SITE_LEGAL_NAME,
      url: absoluteUrl('/'),
      logo: absoluteUrl('/og-cover.jpg'),
      description: SITE_DESCRIPTION,
      areaServed: {
        '@type': 'AdministrativeArea',
        name: 'California',
      },
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'support@cna.school',
        availableLanguage: 'English',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: absoluteUrl('/'),
      description: SITE_DESCRIPTION,
      publisher: {
        '@type': 'Organization',
        name: SITE_NAME,
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${absoluteUrl('/courses')}?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ];
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} min-h-screen font-sans antialiased`}>
        <JsonLd data={siteStructuredData()} />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
