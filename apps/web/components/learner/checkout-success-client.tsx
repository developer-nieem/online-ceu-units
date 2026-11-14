'use client';

import Link from 'next/link';

import { buildCheckoutPath } from '@/lib/checkout-path';

/**
 * Legacy success panel for order-based hosted checkout.
 * Native Elements checkout redirects to course learn or /purchase/success instead.
 */
export function CheckoutSuccessClient({
  courseSlug,
  demoMode,
}: {
  courseSlug: string;
  /** @deprecated Order ID from legacy hosted checkout — no longer used. */
  orderId?: string;
  /** @deprecated Stripe session ID from legacy hosted checkout — no longer used. */
  stripeSessionId?: string;
  demoMode: boolean;
}) {
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6">
      <p className="text-lg font-semibold text-emerald-900">Enrollment confirmed</p>
      <p className="mt-2 text-sm text-emerald-800">
        {demoMode
          ? 'Demo purchase complete. You now have access to this course.'
          : 'Payment received. You now have access to this course.'}
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          className="inline-flex h-10 items-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
          href={`/courses/${courseSlug}/learn`}
        >
          Start learning
        </Link>
        <Link
          className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 hover:bg-slate-50"
          href="/dashboard"
        >
          Go to dashboard
        </Link>
        <Link
          className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 hover:bg-slate-50"
          href={buildCheckoutPath('single', courseSlug)}
        >
          Return to checkout
        </Link>
      </div>
    </div>
  );
}
