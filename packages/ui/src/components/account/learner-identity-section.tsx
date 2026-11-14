import * as React from 'react';

import { cn } from '../../lib/utils';

import { IDENTITY_SECTION_DESCRIPTION, IDENTITY_SUPPORT_EMAIL } from './constants';
import { IdentityLockNotice } from './identity-lock-notice';
import { LockedIdentityField } from './locked-identity-field';
import type { LearnerIdentitySectionProps } from './types';

export function LearnerIdentitySection({
  fullLegalName,
  primaryEmail,
  className,
  supportEmail = IDENTITY_SUPPORT_EMAIL,
}: LearnerIdentitySectionProps) {
  return (
    <section
      aria-labelledby="learner-identity-heading"
      className={cn('space-y-5 rounded-lg border border-border bg-card p-6 shadow-sm', className)}
    >
      <header className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight text-foreground" id="learner-identity-heading">
          Identity Information
        </h2>
        <p className="text-sm text-muted-foreground">{IDENTITY_SECTION_DESCRIPTION}</p>
      </header>

      <div className="grid gap-5 sm:grid-cols-1">
        <LockedIdentityField
          id="learner-full-legal-name"
          label="Full Legal Name"
          value={fullLegalName}
        />
        <LockedIdentityField
          id="learner-primary-email"
          label="Primary Email"
          value={primaryEmail}
        />
      </div>

      <IdentityLockNotice supportEmail={supportEmail} />
    </section>
  );
}
