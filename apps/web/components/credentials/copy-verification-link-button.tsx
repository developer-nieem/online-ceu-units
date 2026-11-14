'use client';

import { Button } from '@calace/ui/components/ui/button';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

export function CopyVerificationLinkButton({
  url,
  label = 'Copy verification link',
}: {
  url: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
      {copied ? (
        <Check className="mr-1 h-4 w-4 text-teal-700" aria-hidden />
      ) : (
        <Copy className="mr-1 h-4 w-4" aria-hidden />
      )}
      {copied ? 'Copied' : label}
    </Button>
  );
}
