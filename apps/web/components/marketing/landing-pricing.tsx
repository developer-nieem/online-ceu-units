import { Badge } from '@calace/ui/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@calace/ui/components/ui/card';
import { Check, Gift } from 'lucide-react';
import Link from 'next/link';

import {
  MARKETING_SELLING_POINTS,
  TWO_YEAR_MILPITAS_PROMO,
  UNLIMITED_PLAN_FEATURES,
} from '@/lib/marketing-copy';
import { SINGLE_COURSE_PRICE, formatPrice, type PurchasePlanId } from '@/lib/pricing';

import { PlanPurchaseButton } from './plan-purchase-button';

type PlanFeature = {
  text: string;
  bonus?: boolean;
};

/** File-local (not UNLIMITED_PLAN_FEATURES) so Instant certificates can stay 1-Year-only. */
const RENEWAL_TRACKING_FEATURE =
  "Renewal deadline tracking — add your birthday and renewal date, and we'll track your deadline and send reminders.";

const UNLIMITED_PLANS: Array<{
  id: PurchasePlanId;
  name: string;
  price: number;
  period: string;
  description: string;
  highlight: boolean;
  badge: string | null;
  badgeVariant: 'emerald' | 'amber';
  features: PlanFeature[];
}> = [
  {
    id: 'unlimited-1y',
    name: '1-Year Unlimited',
    price: 19.5,
    period: 'per year',
    description: 'Every online CEU you need for one renewal cycle — one simple price.',
    highlight: false,
    badge: 'Most popular online',
    badgeVariant: 'emerald',
    features: [
      ...UNLIMITED_PLAN_FEATURES.map((text) => ({ text })),
      { text: RENEWAL_TRACKING_FEATURE },
      { text: 'Instant certificates & transcript records' },
    ],
  },
  {
    id: 'unlimited-2y',
    name: '2-Year Unlimited',
    price: 37.5,
    period: 'every 2 years',
    description:
      'The ultimate no-brainer: two years of unlimited online CEUs plus an exclusive Milpitas campus perk.',
    highlight: true,
    badge: 'No-brainer deal',
    badgeVariant: 'amber',
    features: [
      { text: `🎁 ${TWO_YEAR_MILPITAS_PROMO.pricingBonus}`, bonus: true },
      ...UNLIMITED_PLAN_FEATURES.map((text) => ({ text })),
      { text: RENEWAL_TRACKING_FEATURE },
      { text: 'Lower yearly cost than the 1-year plan.' },
    ],
  },
];

export function LandingPricing() {
  return (
    <section className="bg-slate-50 py-16 sm:py-24" id="pricing">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-amber-700">
            {TWO_YEAR_MILPITAS_PROMO.shortHeadline}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Every course included in your plan.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            {MARKETING_SELLING_POINTS.unlimitedAccess}
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
          {UNLIMITED_PLANS.map((plan) => (
            <Card
              key={plan.id}
              id={plan.id === 'unlimited-2y' ? 'plan-unlimited-2y' : undefined}
              className={
                plan.highlight
                  ? 'relative overflow-hidden border-amber-500/50 bg-white shadow-2xl ring-2 ring-amber-500/30 md:scale-[1.02]'
                  : 'relative overflow-hidden border-slate-200 bg-white shadow-md'
              }
            >
              {plan.highlight ? (
                <>
                  <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500" />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-amber-400/15 blur-2xl"
                  />
                </>
              ) : (
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500" />
              )}

              <CardHeader className="relative pb-4">
                {plan.badge ? (
                  <Badge
                    className={
                      plan.badgeVariant === 'amber'
                        ? 'mb-2 w-fit bg-amber-500 text-amber-950 hover:bg-amber-500'
                        : 'mb-2 w-fit bg-emerald-600 hover:bg-emerald-600'
                    }
                  >
                    {plan.badge}
                  </Badge>
                ) : null}
                <CardTitle className="text-xl text-slate-900">{plan.name}</CardTitle>
                <CardDescription className="text-sm leading-relaxed">{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="relative space-y-6">
                <p>
                  <span className="text-4xl font-bold tracking-tight text-slate-900">
                    {formatPrice(plan.price)}
                  </span>
                  <span className="text-sm font-medium text-slate-500"> / {plan.period}</span>
                </p>

                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature.text}
                      className={`flex items-start gap-2.5 text-sm ${
                        feature.bonus
                          ? 'rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 font-semibold text-amber-950'
                          : 'text-slate-600'
                      }`}
                    >
                      {feature.bonus ? (
                        <Gift
                          aria-hidden
                          className="mt-0.5 size-4 shrink-0 text-amber-600"
                          strokeWidth={2.5}
                        />
                      ) : (
                        <Check
                          aria-hidden
                          className="mt-0.5 size-4 shrink-0 text-emerald-600"
                          strokeWidth={2.5}
                        />
                      )}
                      {feature.text}
                    </li>
                  ))}
                </ul>

                {plan.highlight ? (
                  <p className="text-xs leading-relaxed text-amber-800/80">
                    {TWO_YEAR_MILPITAS_PROMO.conditions}
                  </p>
                ) : null}
              </CardContent>

              <CardFooter className="relative pt-2">
                <PlanPurchaseButton
                  highlighted={plan.highlight}
                  planId={plan.id}
                  planName={plan.name}
                />
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-5 sm:flex-row sm:gap-6">
          <div className="text-center sm:text-left">
            <p className="text-base font-semibold text-slate-900">
              Not ready for an unlimited plan? Buy CE modules individually.
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Pay per course at {formatPrice(SINGLE_COURSE_PRICE)} per CE module — take just what you
              need, no subscription.
            </p>
          </div>
          <Link
            href="/individual-courses"
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg bg-emerald-600 px-6 font-semibold text-white transition-colors hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            Browse individual courses
          </Link>
        </div>

        <p className="mx-auto mt-8 max-w-xl text-center text-sm text-slate-500">
          {MARKETING_SELLING_POINTS.inPerson} Not ready for unlimited? Start with{' '}
          <span className="font-medium text-slate-700">3 free courses</span> — no credit card required.
        </p>
      </div>
    </section>
  );
}
