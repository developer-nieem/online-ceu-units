'use client';

import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Button } from '@calace/ui/components/ui/button';
import * as React from 'react';

import { buildCheckoutReturnUrl } from '@/lib/checkout-path';
import type { PurchasePlanId } from '@/lib/pricing';
import { formatPrice } from '@/lib/pricing';

type StripeCheckoutFormProps = {
  plan: PurchasePlanId;
  planLabel: string;
  price: number;
  courseSlug?: string;
  courseTitle?: string;
};

export function StripeCheckoutForm({
  plan,
  planLabel,
  price,
  courseSlug,
  courseTitle,
}: StripeCheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!stripe || !elements) {
      setError('Payment form is still loading. Please wait a moment and try again.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const returnUrl = buildCheckoutReturnUrl(plan, courseSlug);

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    });

    if (confirmError) {
      setError(confirmError.message ?? 'Payment could not be completed. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={(event) => void handleSubmit(event)}>
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
        {courseTitle ? (
          <p className="text-sm font-medium text-slate-900">{courseTitle}</p>
        ) : null}
        <p className="text-sm text-slate-600">{planLabel}</p>
        <p className="mt-1 text-2xl font-bold text-emerald-700">{formatPrice(price)}</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        className="h-11 w-full rounded-lg bg-emerald-600 font-semibold text-white hover:bg-emerald-500"
        disabled={!stripe || !elements || submitting}
        type="submit"
      >
        {submitting ? 'Processing payment…' : `Pay ${formatPrice(price)}`}
      </Button>

      <p className="text-center text-xs text-slate-500">
        Payments are processed securely by Stripe. Your card details never touch CAL ACE servers.
      </p>
    </form>
  );
}
