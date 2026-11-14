import type { Metadata } from 'next';

import { LandingPage } from '@/components/marketing/landing-page';

export const metadata: Metadata = {
  title: 'California CNA License Renewal | CAL ACE Nursing Academy',
  description:
    'CDPH-Approved Online CE Provider — NAC# 7384. CDPH-compliant 50-minute courses, automated birthday math, and unlimited plans starting at $19.50. Start free with 3 courses.',
};

export default function HomePage() {
  return <LandingPage />;
}
