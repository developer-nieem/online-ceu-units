'use client';

import { Button } from '@calace/ui/components/ui/button';
import { useState } from 'react';

import { getAdminCertificateDetail } from '@/lib/admin';

export function AdminCertificateDetailButton({ certificateId }: { certificateId: string }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleInspect() {
    if (open) {
      setOpen(false);
      return;
    }
    setLoading(true);
    const res = await getAdminCertificateDetail(certificateId);
    setLoading(false);
    if (res.data) {
      setDetail(JSON.stringify(res.data.payload, null, 2));
      setOpen(true);
      return;
    }
    setDetail(res.error ?? 'Failed to load metadata');
    setOpen(true);
  }

  return (
    <div className="space-y-1">
      <Button type="button" variant="ghost" size="sm" onClick={handleInspect} disabled={loading}>
        {loading ? 'Loading…' : open ? 'Hide metadata' : 'Inspect metadata'}
      </Button>
      {open && detail ? (
        <pre className="max-h-40 overflow-auto rounded border bg-slate-50 p-2 text-[10px] leading-snug">
          {detail}
        </pre>
      ) : null}
    </div>
  );
}
