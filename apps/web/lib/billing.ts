import { apiFetch } from './api';
import type { PurchasePlanId } from './pricing';

export type BillingAccount = {
  stripeEnabled: boolean;
  customer: { id: string; stripeCustomerId: string | null; email: string | null } | null;
  subscription: {
    planCode: string;
    status: string;
    currentPeriodEnd: string | null;
    billingMeta: unknown;
  } | null;
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    placedAt: string | null;
    lineItems: unknown;
    paymentMeta: unknown;
  }>;
  paymentMethod: { placeholder: boolean; note: string };
};

export type InitializePaymentResult =
  | {
      mode: 'mock';
      message: string;
      price: number;
      plan: string;
      courseSlug: string | null;
    }
  | {
      mode: 'elements';
      clientSecret: string;
      price: number;
      plan: string;
      courseSlug: string | null;
    };

export async function fetchBillingAccount() {
  return apiFetch<BillingAccount>('/billing/account');
}

export async function initializePayment(params: {
  purchasePlan: PurchasePlanId;
  courseSlug?: string;
}) {
  return apiFetch<InitializePaymentResult>('/billing/initialize-payment', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/** @deprecated Use initializePayment */
export async function createCheckoutSession(params: {
  purchasePlan: PurchasePlanId;
  courseSlug?: string;
  successUrl?: string;
  cancelUrl?: string;
}) {
  return initializePayment({
    purchasePlan: params.purchasePlan,
    courseSlug: params.courseSlug,
  });
}

export async function mockCheckout(params: {
  purchasePlan: PurchasePlanId;
  courseSlug?: string;
}) {
  return apiFetch<{
    message: string;
    enrollment?: unknown;
    plan?: string;
    orderId?: string;
    subscriptionActivated?: boolean;
  }>('/billing/mock-checkout', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}
