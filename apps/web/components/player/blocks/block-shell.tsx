'use client';

import { useEffect, useRef } from 'react';

/**
 * Tall-block dwell. A fling brings the bottom edge into view in a few hundred
 * milliseconds. The tallest narration is ~4,600 characters (~920 words). At a
 * careful ~230 words per minute that is about four minutes of reading — that
 * pace is the seat-time timer's job, not this detector. This gate only rejects
 * a single fling: 1 second per viewport of block height, and at least 1.5
 * seconds. That ~4,600-character block is about three viewports tall, so its
 * dwell is about 3 seconds.
 */
const TALL_DWELL_MS_PER_VIEWPORT = 1000;
const TALL_DWELL_MIN_MS = 1500;

function tallDwellMs(blockHeight: number, viewportHeight: number): number {
  if (viewportHeight <= 0) return TALL_DWELL_MIN_MS;
  return Math.max(
    TALL_DWELL_MIN_MS,
    (blockHeight / viewportHeight) * TALL_DWELL_MS_PER_VIEWPORT,
  );
}

/** True when 35% of the block can never be on screen at once. */
function isTallerThanSimultaneousThreshold(blockHeight: number, viewportHeight: number): boolean {
  if (viewportHeight <= 0) return false;
  return blockHeight > viewportHeight / 0.35;
}

export function BlockShell({
  blockId,
  ariaLabel,
  onViewed,
  children,
  className = '',
}: {
  blockId: string;
  ariaLabel?: string;
  onViewed: (blockId: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const reported = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || reported.current) return;

    let mode: 'short' | 'tall' | null = null;
    let observer: IntersectionObserver | null = null;
    let removeScroll: (() => void) | null = null;
    let topSeenAt: number | null = null;
    let bottomInside = false;

    const stopWatching = () => {
      observer?.disconnect();
      observer = null;
      removeScroll?.();
      removeScroll = null;
    };

    const markViewed = () => {
      if (reported.current) return;
      reported.current = true;
      onViewed(blockId);
      stopWatching();
    };

    const checkTall = () => {
      if (reported.current || mode !== 'tall') return;
      const rect = el.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      if (!isTallerThanSimultaneousThreshold(rect.height, viewportHeight)) return;

      const topInView = rect.top >= 0 && rect.top < viewportHeight;
      if (topInView && topSeenAt === null) topSeenAt = performance.now();

      const bottomNow = rect.bottom > 0 && rect.bottom <= viewportHeight;
      const bottomEntered = bottomNow && !bottomInside;
      bottomInside = bottomNow;
      if (!bottomEntered || topSeenAt === null) return;
      if (performance.now() - topSeenAt >= tallDwellMs(rect.height, viewportHeight)) {
        markViewed();
      }
    };

    const startShort = () => {
      stopWatching();
      topSeenAt = null;
      bottomInside = false;
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting) && !reported.current) {
            reported.current = true;
            onViewed(blockId);
            observer?.disconnect();
          }
        },
        { threshold: 0.35 },
      );
      observer.observe(el);
    };

    const startTall = () => {
      stopWatching();
      topSeenAt = null;
      bottomInside = false;
      const onScroll = () => checkTall();
      window.addEventListener('scroll', onScroll, true);
      removeScroll = () => window.removeEventListener('scroll', onScroll, true);
      observer = new IntersectionObserver(() => checkTall(), { threshold: 0 });
      observer.observe(el);
      checkTall();
    };

    const applyMode = () => {
      if (reported.current) return;
      const rect = el.getBoundingClientRect();
      const next = isTallerThanSimultaneousThreshold(rect.height, window.innerHeight)
        ? 'tall'
        : 'short';
      if (next === mode) return;
      mode = next;
      if (next === 'tall') startTall();
      else startShort();
    };

    applyMode();
    const resizeObserver = new ResizeObserver(() => applyMode());
    resizeObserver.observe(el);
    window.addEventListener('resize', applyMode);

    return () => {
      stopWatching();
      resizeObserver.disconnect();
      window.removeEventListener('resize', applyMode);
    };
  }, [blockId, onViewed]);

  return (
    <section
      ref={ref}
      id={`block-${blockId}`}
      className={`scroll-mt-4 ${className}`}
      aria-label={ariaLabel}
    >
      {children}
    </section>
  );
}
