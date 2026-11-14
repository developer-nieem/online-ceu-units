import * as React from 'react';

import { cn } from '../../lib/utils';

import type { ProfileSectionProps } from './types';

export function ProfileSection({
  title,
  description,
  children,
  className,
  headingId,
}: ProfileSectionProps) {
  return (
    <section
      aria-labelledby={headingId}
      className={cn('space-y-5 rounded-lg border border-border bg-card p-6 shadow-sm', className)}
    >
      <header className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight text-foreground" id={headingId}>
          {title}
        </h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </header>
      {children}
    </section>
  );
}
