'use client';

import { Button } from '@calace/ui/components/ui/button';
import { Sparkles, Star, Trophy, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import type { EarnedMilestoneBadgePayload } from '@/lib/celebration';

import styles from './floating-badge-celebration.module.css';

const CONFETTI_COLORS = [
  '#0d9488',
  '#f59e0b',
  '#ec4899',
  '#8b5cf6',
  '#06b6d4',
  '#f97316',
];

function ConfettiBurst() {
  const pieces = Array.from({ length: 48 }, (_, i) => ({
    id: i,
    left: `${(i * 17) % 100}%`,
    delay: `${(i % 12) * 0.08}s`,
    duration: `${1.8 + (i % 5) * 0.25}s`,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 6 + (i % 4) * 2,
    rotation: (i * 37) % 360,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className={`${styles.confettiPiece} absolute top-0 block rounded-sm`}
          style={{
            left: piece.left,
            width: piece.size,
            height: piece.size * 1.4,
            backgroundColor: piece.color,
            animationDelay: piece.delay,
            animationDuration: piece.duration,
            transform: `rotate(${piece.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}

function BadgeIcon({ isUltimate }: { isUltimate: boolean }) {
  if (isUltimate) {
    return <Trophy className="h-10 w-10 text-amber-500" strokeWidth={1.5} />;
  }
  return <Star className="h-10 w-10 text-teal-600" strokeWidth={1.5} fill="currentColor" />;
}

export function FloatingBadgeCelebration({
  badge,
  onDismiss,
}: {
  badge: EarnedMilestoneBadgePayload;
  onDismiss: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  function handleDismiss() {
    setVisible(false);
    window.setTimeout(onDismiss, 320);
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="milestone-badge-title"
      aria-describedby="milestone-badge-message"
    >
      <button
        type="button"
        className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        aria-label="Dismiss celebration"
        onClick={handleDismiss}
      />

      <div
        className={`${styles.panel} relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-teal-200/80 bg-gradient-to-b from-white via-teal-50/90 to-amber-50/80 p-6 shadow-2xl shadow-teal-900/20 transition-all duration-500 ${
          visible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-8 scale-90 opacity-0'
        } ${badge.isUltimate ? 'border-amber-300/90 from-amber-50 via-white to-teal-50' : ''}`}
      >
        <ConfettiBurst />

        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative flex flex-col items-center text-center">
          <div
            className={`${styles.pulseRing} mb-4 flex h-28 w-28 items-center justify-center rounded-full border-4 bg-white shadow-lg ${
              badge.isUltimate
                ? 'border-amber-300 shadow-amber-200/60'
                : 'border-teal-300 shadow-teal-200/60'
            }`}
          >
            {/* Replace badge.imageSrc with AI-generated badge artwork in /public/badges/ */}
            {!imageFailed ? (
              <img
                src={badge.imageSrc}
                alt=""
                className="h-20 w-20 object-contain"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <BadgeIcon isUltimate={badge.isUltimate} />
            )}
          </div>

          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-teal-700">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            <span>Milestone unlocked</span>
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
          </div>

          <h2
            id="milestone-badge-title"
            className={`text-2xl font-bold tracking-tight ${
              badge.isUltimate ? 'text-amber-700' : 'text-teal-900'
            }`}
          >
            {badge.title}
          </h2>

          <p className="mt-1 text-sm font-medium text-teal-700/80">
            {badge.coursesCompleted} courses completed
          </p>

          <p id="milestone-badge-message" className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {badge.message}
          </p>

          <Button
            type="button"
            className="mt-6 min-w-[10rem]"
            onClick={handleDismiss}
          >
            {badge.isUltimate ? 'Amazing!' : 'Keep going!'}
          </Button>
        </div>
      </div>
    </div>
  );
}
