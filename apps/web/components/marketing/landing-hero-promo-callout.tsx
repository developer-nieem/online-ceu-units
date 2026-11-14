import { Gift, MapPin } from 'lucide-react';
import Link from 'next/link';

import { TWO_YEAR_MILPITAS_PROMO } from '@/lib/marketing-copy';

export function LandingHeroPromoCallout() {
  return (
    <div className="relative mt-6 max-w-xl overflow-hidden rounded-2xl border border-[#F5A623]/40 bg-[#FEF6E7] p-5 shadow-xl shadow-amber-900/10">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-6 size-28 rounded-full bg-[#F5A623]/15 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-8 -left-8 size-32 rounded-full bg-[#F5A623]/10 blur-2xl"
      />

      <div className="relative space-y-3">
        <p className="inline-flex items-center gap-2 rounded-full bg-[#F5A623] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
          <span aria-hidden className="animate-pulse">
            🔥
          </span>
          {TWO_YEAR_MILPITAS_PROMO.headline}
        </p>

        <p className="text-base font-semibold leading-snug text-[#1A2B2A] sm:text-lg">
          Lock in the{' '}
          <span className="font-semibold text-[#B8730A]">2-Year Unlimited Plan</span> and instantly unlock a{' '}
          <span className="font-semibold text-[#B8730A]">{TWO_YEAR_MILPITAS_PROMO.discountAmount} VIP discount</span>{' '}
          for any in-person CEU class at our flagship{' '}
          <span className="inline-flex items-center gap-1 font-semibold text-[#B8730A]">
            <MapPin aria-hidden className="size-4 shrink-0" />
            {TWO_YEAR_MILPITAS_PROMO.campusName}
          </span>
          !
        </p>

        <p className="text-sm leading-relaxed text-[#1A2B2A]/70">
          Get the best of online convenience plus in-person classes at our Milpitas campus — your
          hybrid upgrade starts the moment you subscribe.
        </p>

        <p className="flex items-start gap-2 text-xs leading-relaxed text-[#1A2B2A]/70">
          <Gift aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          {TWO_YEAR_MILPITAS_PROMO.conditions}
        </p>

        <Link
          href="#plan-unlimited-2y"
          className="inline-flex items-center gap-2 rounded-lg bg-[#F5A623] px-4 py-2 text-sm font-bold text-[#1A2B2A] shadow-lg shadow-amber-900/20 transition hover:bg-[#E09510]"
        >
          See the 2-Year deal
          <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}
