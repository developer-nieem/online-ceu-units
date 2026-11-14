import { Button } from '@calace/ui/components/ui/button';
import { CalendarClock, ShieldCheck, Sparkles } from 'lucide-react';
import Link from 'next/link';

import { LandingHeroPromoCallout } from './landing-hero-promo-callout';
import { HeroCnaImage } from './hero-cna-image';
import { CDPH_ONLINE_PROVIDER_LINE } from '@/lib/marketing-copy';

const TRUST_POINTS = [
  { icon: ShieldCheck, label: 'Built for CA CNA renewal' },
  { icon: CalendarClock, label: 'CEU Math & credit tracking' },
  { icon: Sparkles, label: 'Unlimited course access' },
] as const;

export function LandingHero() {
  return (
    <section className="relative isolate overflow-hidden bg-[#FAFCFB]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_40%,rgba(13,115,119,0.10),transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_75%,rgba(10,77,80,0.06),transparent_45%)]"
      />

      <div className="relative mx-auto grid max-w-7xl lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:min-h-[calc(100vh-4rem)]">
        <div className="relative z-10 flex flex-col justify-center px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div
            aria-hidden
            className="absolute inset-y-0 left-0 -z-10 w-[120%] bg-gradient-to-r from-[#FAFCFB] via-[#FAFCFB]/95 to-[#FAFCFB]/40 lg:from-[#FAFCFB] lg:via-[#E6F4F1]/92 lg:to-transparent"
          />

          <div className="inline-flex w-fit max-w-full items-center gap-2 rounded-full border border-[#0D7377]/30 bg-[#0D7377]/10 px-3 py-1 text-xs font-semibold tracking-wide text-[#0D7377]">
            <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-[#0D7377]" />
            {CDPH_ONLINE_PROVIDER_LINE}
          </div>

          <h1 className="mt-6 max-w-2xl text-4xl font-bold tracking-tight text-[#0A4D50] sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
            Never Stress Over Your California CNA Certification Renewal Again.
          </h1>

          <h2 className="mt-5 max-w-xl text-lg font-normal leading-relaxed text-[#1A2B2A] sm:text-xl">
            Unlimited course access from $19.50/yr. Start free with 3 courses.
          </h2>

          <LandingHeroPromoCallout />

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              asChild
              className="h-12 rounded-lg bg-emerald-500 px-6 text-base font-semibold text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-400"
              size="lg"
            >
              <Link href="/free">Start Free (3 Courses)</Link>
            </Button>
            <Button
              asChild
              className="h-12 rounded-lg border-[#0D7377]/30 bg-white px-6 text-base font-semibold text-[#0D7377] hover:bg-[#E6F4F1] hover:text-[#0A4D50]"
              size="lg"
              variant="outline"
            >
              <Link href="#pricing">View Unlimited Plans</Link>
            </Button>
          </div>

          <ul className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
            {TRUST_POINTS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-sm text-[#1A2B2A]/70">
                <Icon aria-hidden className="size-4 shrink-0 text-[#0D7377]" strokeWidth={2} />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex min-h-[320px] items-end justify-center overflow-hidden sm:min-h-[420px] lg:min-h-0 lg:justify-end">
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 top-1/4 bg-gradient-to-t from-[#FAFCFB] via-[#FAFCFB]/60 to-transparent lg:hidden"
          />
          <HeroCnaImage />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-1/5 bg-gradient-to-r from-[#FAFCFB] via-[#FAFCFB]/40 to-transparent lg:block"
          />
        </div>
      </div>
    </section>
  );
}
