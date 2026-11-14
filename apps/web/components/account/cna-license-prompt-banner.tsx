'use client';

import { Button } from '@calace/ui/components/ui/button';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const DISMISS_KEY = 'calace-dismiss-cna-license-prompt';

export function CnaLicensePromptBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === '1') return;
    } catch {
      // sessionStorage may be unavailable; still show the reminder.
    }
    setVisible(true);
  }, []);

  if (!visible) return null;

  function dismiss() {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // Ignore storage failures; hiding for this render is enough.
    }
    setVisible(false);
  }

  return (
    <div
      className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-amber-950"
      role="status"
    >
      <p className="font-medium">Add your CNA License Number</p>
      <p className="mt-1 text-sm text-amber-900/90">
        Add your CNA License Number so it appears on your certificates. You can keep learning
        now — this is a reminder, not a required step to continue.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          asChild
          size="sm"
          variant="outline"
          className="border-amber-300 bg-white hover:bg-amber-100"
        >
          <Link href="/account/profile">Add it on your profile</Link>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="text-amber-900 hover:bg-amber-100"
          onClick={dismiss}
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
}
