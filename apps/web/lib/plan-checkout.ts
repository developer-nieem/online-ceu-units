import { initializePayment, mockCheckout } from '@/lib/billing';
import { buildCheckoutPath } from '@/lib/checkout-path';
import type { PurchasePlanId } from '@/lib/pricing';

export type PlanCheckoutResult =
  | { ok: true; mode: 'elements'; checkoutPath: string }
  | { ok: true; mode: 'mock'; message: string }
  | { ok: false; error: string };

export async function initiatePlanCheckout(planId: PurchasePlanId): Promise<PlanCheckoutResult> {
  const checkout = await initializePayment({ purchasePlan: planId });

  if (checkout.error) {
    return { ok: false, error: checkout.error };
  }

  if (checkout.data?.mode === 'elements') {
    return { ok: true, mode: 'elements', checkoutPath: buildCheckoutPath(planId) };
  }

  if (checkout.data?.mode === 'mock') {
    const mock = await mockCheckout({ purchasePlan: planId });

    if (mock.error) {
      return { ok: false, error: mock.error };
    }

    return {
      ok: true,
      mode: 'mock',
      message:
        mock.data?.message ??
        checkout.data?.message ??
        'Subscription activated (mock checkout — no charge)',
    };
  }

  return { ok: false, error: 'Unexpected checkout response' };
}
