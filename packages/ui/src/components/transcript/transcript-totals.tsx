import * as React from 'react';

import { cn } from '../../lib/utils';

import { DEFAULT_TRANSCRIPT_SCOPE_NOTE } from './constants';
import type { TranscriptTotalsData } from './types';

export interface TranscriptTotalsProps extends TranscriptTotalsData {
  courseCount: number;
  scopeNote?: string;
  className?: string;
}

export function TranscriptTotals({
  totalOnlineCeUnits,
  courseCount,
  scopeNote = DEFAULT_TRANSCRIPT_SCOPE_NOTE,
  className,
}: TranscriptTotalsProps) {
  const resolvedTotalOnlineCeUnits = totalOnlineCeUnits ?? courseCount;

  return (
    <section className={cn('transcript__totals', className)}>
      <h2 className="transcript__section-title">Summary</h2>

      <div className="transcript__totals-grid">
        <div className="transcript__total-card">
          <p className="transcript__total-label">Total Online CE Units completed</p>
          <p className="transcript__total-value">{resolvedTotalOnlineCeUnits}</p>
        </div>
      </div>

      <p className="transcript__scope-note">{scopeNote}</p>
    </section>
  );
}
