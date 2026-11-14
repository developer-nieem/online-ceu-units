'use client';

import { useState } from 'react';

import { Button } from '@calace/ui/components/ui/button';

export function ReferralCopyLinkButton({
  referralLink,
  className,
}: {
  referralLink: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyReferralLink() {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable outside secure contexts
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      onClick={copyReferralLink}
    >
      {copied ? 'Copied!' : 'Copy referral link'}
    </Button>
  );
}
