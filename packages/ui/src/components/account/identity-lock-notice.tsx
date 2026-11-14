import { LockKeyhole } from 'lucide-react';
import * as React from 'react';

import { cn } from '../../lib/utils';

import { IDENTITY_LOCK_NOTICE, IDENTITY_SUPPORT_EMAIL } from './constants';
import type { IdentityLockNoticeProps } from './types';

export function IdentityLockNotice({
  className,
  supportEmail = IDENTITY_SUPPORT_EMAIL,
}: IdentityLockNoticeProps) {
  return (
    <div
      className={cn(
        'rounded-md border border-border bg-muted/30 px-4 py-3 text-sm leading-relaxed text-muted-foreground',
        className,
      )}
      role="note"
    >
      <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
        <LockKeyhole aria-hidden="true" className="size-4 text-muted-foreground" />
        <span>Identity verification</span>
      </div>
      <p>{IDENTITY_LOCK_NOTICE}</p>
      <p className="mt-2">
        Support:{' '}
        <a
          className="font-medium text-foreground underline-offset-4 hover:underline"
          href={`mailto:${supportEmail}`}
        >
          {supportEmail}
        </a>
      </p>
    </div>
  );
}
