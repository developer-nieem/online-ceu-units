import { Lock } from 'lucide-react';
import * as React from 'react';

import { cn } from '../../lib/utils';

import type { LockedIdentityFieldProps } from './types';

export function LockedIdentityField({ id, label, value, className }: LockedIdentityFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-medium text-foreground" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <input
          aria-readonly="true"
          className="flex h-10 w-full rounded-md border border-input bg-muted/50 px-3 py-2 pr-10 text-sm text-foreground shadow-sm read-only:cursor-not-allowed read-only:opacity-100"
          id={id}
          readOnly
          tabIndex={-1}
          type="text"
          value={value}
        />
        <Lock
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
      </div>
      <p className="text-xs text-muted-foreground">Locked — contact support to request changes</p>
    </div>
  );
}
