'use client';

import { useEffect, useState } from 'react';

import {
  MILESTONE_BADGE_CELEBRATION_EVENT,
  type EarnedMilestoneBadgePayload,
} from '@/lib/celebration';

import { FloatingBadgeCelebration } from './floating-badge-celebration';

export function CelebrationProvider({ children }: { children: React.ReactNode }) {
  const [activeBadge, setActiveBadge] = useState<EarnedMilestoneBadgePayload | null>(null);

  useEffect(() => {
    function handleBadgeEarned(event: Event) {
      const custom = event as CustomEvent<EarnedMilestoneBadgePayload>;
      if (custom.detail) {
        setActiveBadge(custom.detail);
      }
    }

    window.addEventListener(MILESTONE_BADGE_CELEBRATION_EVENT, handleBadgeEarned);
    return () => {
      window.removeEventListener(MILESTONE_BADGE_CELEBRATION_EVENT, handleBadgeEarned);
    };
  }, []);

  return (
    <>
      {children}
      {activeBadge ? (
        <FloatingBadgeCelebration
          badge={activeBadge}
          onDismiss={() => setActiveBadge(null)}
        />
      ) : null}
    </>
  );
}
