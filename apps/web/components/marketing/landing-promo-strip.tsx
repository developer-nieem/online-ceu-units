import { Sparkles } from 'lucide-react';
import Link from 'next/link';

import { TWO_YEAR_MILPITAS_PROMO } from '@/lib/marketing-copy';

export function LandingPromoStrip() {
  return (
    <div className="relative overflow-hidden border-b border-amber-500/30 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 animate-pulse bg-white/5"
      />
      <div className="relative mx-auto flex max-w-7xl flex-col items-center justify-center gap-2 px-4 py-3 text-center sm:flex-row sm:gap-4 sm:py-2.5 sm:text-left">
        <p className="flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wide text-white sm:justify-start">
          <Sparkles aria-hidden className="size-4 shrink-0 animate-pulse" />
          <span>{TWO_YEAR_MILPITAS_PROMO.headline}</span>
        </p>
        <p className="max-w-3xl text-xs leading-relaxed text-amber-50 sm:text-sm">
          {TWO_YEAR_MILPITAS_PROMO.stripBody}
        </p>
        <Link
          href="#plan-unlimited-2y"
          className="shrink-0 rounded-full bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-amber-700 shadow-md transition hover:bg-amber-50"
        >
          Claim bonus →
        </Link>
      </div>
    </div>
  );
}
