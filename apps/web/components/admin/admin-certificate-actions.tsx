'use client';

import { Button } from '@calace/ui/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  archiveAdminCertificate,
  restoreAdminCertificate,
  revokeAdminCertificate,
} from '@/lib/admin';

export function AdminCertificateActions({
  certificateId,
  publicVerificationStatus,
}: {
  certificateId: string;
  publicVerificationStatus: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function run(action: 'revoke' | 'restore' | 'archive') {
    setPending(action);
    setMessage(null);
    const fn =
      action === 'revoke'
        ? revokeAdminCertificate
        : action === 'restore'
          ? restoreAdminCertificate
          : archiveAdminCertificate;
    const res = await fn(certificateId);
    setPending(null);
    if (res.error) {
      setMessage(res.error);
      return;
    }
    setMessage(`Certificate ${action}d.`);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-1">
        {publicVerificationStatus !== 'Revoked' ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={Boolean(pending)}
            onClick={() => run('revoke')}
          >
            Revoke
          </Button>
        ) : null}
        {publicVerificationStatus === 'Revoked' || publicVerificationStatus === 'Archived' ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={Boolean(pending)}
            onClick={() => run('restore')}
          >
            Restore
          </Button>
        ) : null}
        {publicVerificationStatus !== 'Archived' ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={Boolean(pending)}
            onClick={() => run('archive')}
          >
            Archive
          </Button>
        ) : null}
      </div>
      {message ? <span className="text-xs text-slate-600">{message}</span> : null}
    </div>
  );
}
