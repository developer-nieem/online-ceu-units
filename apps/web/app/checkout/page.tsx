import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { CheckoutPageClient } from '@/components/billing/checkout-page-client';
import { PRICING_PLANS, type PurchasePlanId } from '@/lib/pricing';

export const metadata: Metadata = {
  title: 'Checkout | CAL ACE Nursing Academy',
  description:
    'Complete your CAL ACE course or unlimited plan purchase securely on onlineceunits.com.',
};

type CheckoutPageProps = {
  searchParams: Promise<{
    plan?: string;
    courseSlug?: string;
    courseTitle?: string;
  }>;
};

function isPurchasePlan(value: string | undefined): value is PurchasePlanId {
  return PRICING_PLANS.some((entry) => entry.id === value);
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const { plan, courseSlug, courseTitle } = await searchParams;

  if (!isPurchasePlan(plan)) {
    redirect('/?checkout=invalid#pricing');
  }

  if (plan === 'single' && !courseSlug) {
    redirect('/courses');
  }

  return (
    <CheckoutPageClient
      courseSlug={courseSlug}
      courseTitle={courseTitle}
      plan={plan}
    />
  );
}
