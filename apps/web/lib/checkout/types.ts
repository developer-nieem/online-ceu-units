import type { OrderStatus } from '@calace/db';

export type PaymentProvider = 'demo' | 'stripe';

export interface OrderLineItem {
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  quantity: number;
  unitPriceCents: number;
  salePriceCents?: number | null;
}

export interface OrderPaymentMeta {
  provider: PaymentProvider;
  mode: 'demo' | 'live';
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  enrollmentId?: string;
  completedAt?: string;
}

export interface CheckoutOrderRecord {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  currency: string;
  subtotal: number;
  tax: number;
  total: number;
  lineItems: OrderLineItem[];
  paymentMeta: OrderPaymentMeta;
  placedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrderRecord extends CheckoutOrderRecord {
  learnerEmail: string;
  learnerName: string;
}

export interface InitiateCheckoutResult {
  /** Native CAL ACE checkout route (Stripe Elements). */
  checkoutPath: string;
  amountCents: number;
  currency: string;
}
