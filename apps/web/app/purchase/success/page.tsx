import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, GraduationCap, Sparkles } from 'lucide-react';

import { MilpitasCampusDiscountCard } from '@/components/billing/milpitas-campus-discount-card';
import { PRICING_PLANS } from '@/lib/pricing';
import { TWO_YEAR_PLAN_ID } from '@/lib/marketing-copy';

export const metadata: Metadata = {
  title: 'Purchase complete | CAL ACE Nursing Academy',
  description: 'Your unlimited plan purchase was successful. Start your California CNA renewal courses.',
};

type PurchaseSuccessPageProps = {
  searchParams: Promise<{
    plan?: string;
    session_id?: string;
    payment_intent?: string;
    mock?: string;
  }>;
};

export default async function PurchaseSuccessPage({ searchParams }: PurchaseSuccessPageProps) {
  const { plan, session_id: sessionId, payment_intent: paymentIntentId, mock } =
    await searchParams;
  const paymentReference = paymentIntentId ?? sessionId;
  const isMockCheckout = mock === '1';
  const planDetails = PRICING_PLANS.find((entry) => entry.id === plan);
  const planLabel = planDetails?.name ?? 'Unlimited plan';
  const isTwoYearPlan = plan === TWO_YEAR_PLAN_ID;

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-slate-50 px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-lg">
        <div className="overflow-hidden rounded-2xl border border-emerald-200/80 bg-white shadow-xl shadow-emerald-900/5">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-8 text-center text-white">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-white/15 backdrop-blur">
              <CheckCircle2 aria-hidden className="size-8" strokeWidth={2} />
            </div>
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-100">
              Payment received
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Welcome to {planLabel}
            </h1>
          </div>

          <div className="space-y-6 px-6 py-8">
            <p className="text-center text-sm leading-relaxed text-slate-600">
              Your purchase is confirmed. Unlimited access to CDPH-compliant online CEUs is being
              activated on your account — you can start enrolling in courses right away.
            </p>

            {isMockCheckout && process.env.NODE_ENV === 'development' ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center text-xs text-amber-900">
                Development mode: no real charge was processed.
              </p>
            ) : null}

            {planDetails ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">{planDetails.name}</p>
                <p className="mt-1 text-slate-600">{planDetails.description}</p>
              </div>
            ) : null}

            {isTwoYearPlan ? <MilpitasCampusDiscountCard variant="success" /> : null}

            {paymentReference ? (
              <p className="text-center text-xs text-slate-400">
                Reference: <span className="font-mono">{paymentReference}</span>
              </p>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-500"
                href="/courses"
              >
                <GraduationCap aria-hidden className="size-4" />
                Browse courses
              </Link>
              <Link
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                href="/dashboard"
              >
                <Sparkles aria-hidden className="size-4" />
                Go to dashboard
              </Link>
            </div>

            <p className="text-center text-xs text-slate-500">
              Receipt and billing details are available on your{' '}
              <Link className="font-medium text-emerald-700 hover:underline" href="/billing">
                billing page
              </Link>
              .
            </p>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          <Link className="font-medium text-slate-700 hover:underline" href="/">
            ← Return to homepage
          </Link>
        </p>
      </div>
    </main>
  );
}
