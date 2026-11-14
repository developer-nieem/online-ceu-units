'use client';

import { Button } from '@calace/ui/components/ui/button';
import { Input } from '@calace/ui/components/ui/input';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function CertificateVerificationLookupForm({
  initialValue = '',
}: {
  initialValue?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    router.push(`/verify-certificate/${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <Input
        type="search"
        name="certificateNumber"
        placeholder="e.g. CALACE-2026-AB12CD34"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label="Certificate number"
        className="font-mono text-sm"
        autoComplete="off"
      />
      <Button type="submit" className="shrink-0">
        Verify certificate
      </Button>
    </form>
  );
}
