'use client';

import { Elements } from '@stripe/react-stripe-js';
import { Button } from '@calace/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@calace/ui/components/ui/card';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { StripeCheckoutForm } from '@/components/billing/stripe-checkout-form';
import { LOGIN_PATH, SIGNUP_PATH } from '@/lib/auth/learner';
import { initializePayment, mockCheckout } from '@/lib/billing';
import { buildCheckoutPath } from '@/lib/checkout-path';
import { getStripe } from '@/lib/stripe';
import { PRICING_PLANS, type PurchasePlanId } from '@/lib/pricing';

type CheckoutPageClientProps = {
  plan: PurchasePlanId;
  courseSlug?: string;
  courseTitle?: string;
};

function formatCheckoutError(message: string) {
  if (message.toLowerCase().includes('csrf')) {
    return 'Your session could not be verified. Refresh the page and try again.';
  }
  if (message.toLowerCase().includes('unauthorized') || message.includes('401')) {
    return 'Please sign in to continue to checkout.';
  }
  return message;
}

function isLoggedOutCheckoutError(status: number, message: string) {
  return status === 401 || message.toLowerCase().includes('unauthorized') || message.includes('401');
}

function authReturnHref(path: string, checkoutPath: string) {
  return `${path}?next=${encodeURIComponent(checkoutPath)}`;
}

const stripeAppearance = {
  theme: 'stripe' as const,
  variables: {
    colorPrimary: '#059669',
    colorText: '#0f172a',
    colorDanger: '#dc2626',
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    borderRadius: '8px',
  },
};

export function CheckoutPageClient({ plan, courseSlug, courseTitle }: CheckoutPageClientProps) {
  const router = useRouter();
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [price, setPrice] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [signedOut, setSignedOut] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [mockMessage, setMockMessage] = React.useState<string | null>(null);
  const [mockLoading, setMockLoading] = React.useState(false);

  const planDetails = PRICING_PLANS.find((entry) => entry.id === plan);
  const planLabel = planDetails?.name ?? plan;
  const checkoutPath = buildCheckoutPath(plan, courseSlug, courseTitle);
  const cancelHref = courseSlug
    ? `/courses/${encodeURIComponent(courseSlug)}`
    : '/?checkout=cancelled#pricing';

  React.useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      setError(null);
      setSignedOut(false);

      const result = await initializePayment({
        purchasePlan: plan,
        courseSlug,
      });

      if (cancelled) return;

      if (result.error) {
        setLoading(false);
        if (isLoggedOutCheckoutError(result.status, result.error)) {
          setSignedOut(true);
          return;
        }
        setError(formatCheckoutError(result.error));
        return;
      }

      if (result.data?.mode === 'mock') {
        setMockMessage(
          result.data.message ??
            'Stripe is not configured. Complete enrollment with mock checkout (no charge).',
        );
        setPrice(result.data.price);
        setLoading(false);
        return;
      }

      if (result.data?.mode === 'elements' && result.data.clientSecret) {
        setClientSecret(result.data.clientSecret);
        setPrice(result.data.price);
        setLoading(false);
        return;
      }

      setLoading(false);
      setError('Unexpected checkout response. Please try again.');
    }

    void init();

    return () => {
      cancelled = true;
    };
  }, [plan, courseSlug]);

  async function handleMockCheckout() {
    setMockLoading(true);
    setError(null);

    const result = await mockCheckout({ purchasePlan: plan, courseSlug });

    setMockLoading(false);

    if (result.error) {
      setError(formatCheckoutError(result.error));
      return;
    }

    if (courseSlug && plan === 'single') {
      router.push(`/courses/${encodeURIComponent(courseSlug)}/learn?checkout=success&mock=1`);
      router.refresh();
      return;
    }

    router.push(`/purchase/success?plan=${encodeURIComponent(plan)}&mock=1`);
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-slate-50 px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-lg">
        <Card className="overflow-hidden border-emerald-200/80 shadow-xl shadow-emerald-900/5">
          <CardHeader className="border-b border-emerald-100 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-100">
              CAL ACE Nursing Academy
            </p>
            <CardTitle className="text-2xl text-white">Secure checkout</CardTitle>
            <CardDescription className="text-emerald-50">
              Complete your purchase on onlineceunits.com — powered by Stripe Elements.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 p-6">
            {loading ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <div
                  aria-hidden
                  className="size-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent"
                />
                <p className="text-sm text-slate-600">Preparing secure payment form…</p>
              </div>
            ) : null}

            {signedOut ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-700">
                  Please sign up or sign in to continue to checkout.
                </p>
                <Button
                  asChild
                  className="h-11 w-full rounded-lg bg-emerald-600 font-semibold hover:bg-emerald-500"
                >
                  <Link href={authReturnHref(SIGNUP_PATH, checkoutPath)}>Sign Up</Link>
                </Button>
                <Button asChild className="w-full" variant="outline">
                  <Link href={authReturnHref(LOGIN_PATH, checkoutPath)}>Sign In</Link>
                </Button>
              </div>
            ) : null}

            {error ? (
              <div className="space-y-4">
                <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                  {error}
                </p>
                <Button asChild className="w-full" variant="outline">
                  <Link href={cancelHref}>Go back</Link>
                </Button>
              </div>
            ) : null}

            {mockMessage && !clientSecret ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <p className="font-semibold">
                    Review mode — this is a demonstration checkout. No payment is processed and no
                    card is charged.
                  </p>
                  <p className="mt-2">{mockMessage}</p>
                </div>
                <Button
                  className="h-11 w-full rounded-lg bg-emerald-600 font-semibold hover:bg-emerald-500"
                  disabled={mockLoading}
                  onClick={() => void handleMockCheckout()}
                  type="button"
                >
                  {mockLoading ? 'Enrolling…' : 'Complete mock checkout'}
                </Button>
                <Button asChild className="w-full" variant="outline">
                  <Link href={cancelHref}>Cancel</Link>
                </Button>
              </div>
            ) : null}

            {clientSecret && price !== null ? (
              <Elements
                options={{
                  clientSecret,
                  appearance: stripeAppearance,
                }}
                stripe={getStripe()}
              >
                <StripeCheckoutForm
                  courseSlug={courseSlug}
                  courseTitle={courseTitle}
                  plan={plan}
                  planLabel={planLabel}
                  price={price}
                />
              </Elements>
            ) : null}

            {clientSecret ? (
              <Button asChild className="w-full" variant="ghost">
                <Link href={cancelHref}>Cancel and go back</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
