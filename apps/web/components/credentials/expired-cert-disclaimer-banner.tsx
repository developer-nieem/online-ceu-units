'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

type ExpiredCertDisclaimerBannerProps = {
  expirationDate: string;
};

export function ExpiredCertDisclaimerBanner({ expirationDate }: ExpiredCertDisclaimerBannerProps) {
  const logged = useRef(false);

  useEffect(() => {
    if (logged.current) return;
    logged.current = true;
    // TODO: write learner action-log entry (learnerId, EXPIRED_CERT_DISCLAIMER_SHOWN, timestamp)
    // when a learner-facing action-log API exists. AuditService is admin-scoped only today.
  }, []);

  return (
    <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-950" role="alert">
      Your certification period shows as expired ({expirationDate}). CDPH ultimately decides
      whether hours completed after an expired period count toward renewal — this course may or may
      not be credited. If your expiration date was entered in error, please{' '}
      <Link href="/account/profile" className="font-medium underline">
        update your profile
      </Link>
      . You may still take courses for skill and knowledge improvement.
    </p>
  );
}
