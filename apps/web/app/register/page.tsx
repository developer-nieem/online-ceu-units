import type { Metadata } from 'next';
import Link from 'next/link';

import { SignupForm } from '@/components/auth/signup-form';

export const metadata: Metadata = {
  title: 'Create account | CAL ACE Nursing Academy',
  description: 'Start free with 3 CDPH-compliant CNA courses or create your CAL ACE account.',
};

type RegisterPageProps = {
  searchParams: Promise<{ plan?: string; next?: string }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const { plan, next } = await searchParams;
  const isFreePlan = plan === 'free';
  const isUnlimitedPlan = plan === 'unlimited-1y' || plan === 'unlimited-2y';
  const planLabel =
    plan === 'unlimited-1y'
      ? '1-Year Unlimited'
      : plan === 'unlimited-2y'
        ? '2-Year Unlimited'
        : null;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6 sm:py-16">
      {isFreePlan ? (
        <div className="mx-auto mb-8 max-w-md rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-950">
          <p className="font-semibold">Free plan selected</p>
          <p className="mt-1 text-emerald-900/80">
            Create your account to unlock 3 complimentary courses — no credit card required.
          </p>
        </div>
      ) : null}
      {isUnlimitedPlan && planLabel ? (
        <div className="mx-auto mb-8 max-w-md rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-950">
          <p className="font-semibold">{planLabel} selected</p>
          <p className="mt-1 text-emerald-900/80">
            Create your account below — you will be redirected to Stripe Checkout automatically.
          </p>
        </div>
      ) : null}
      <SignupForm
        nextPath={next}
        pendingPlan={
          plan === 'unlimited-1y' || plan === 'unlimited-2y' ? plan : undefined
        }
      />
      <p className="mx-auto mt-6 max-w-md text-center text-sm text-slate-600">
        <Link className="font-medium text-slate-900 hover:underline" href="/">
          ← Back to homepage
        </Link>
      </p>
    </main>
  );
}
