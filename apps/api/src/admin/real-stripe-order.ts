import { OrderStatus, type Prisma } from '@calace/db';

/**
 * Real Stripe checkout vs mock placeholder checkout.
 * On current orders these match exactly: provider "stripe" is set if and only if
 * paymentMeta.stripePaymentIntentId is a real PaymentIntent id. Mock rows stay
 * in the database; they are omitted from revenue totals.
 */
export function realStripeOrderWhere(tenantId: string): Prisma.OrderWhereInput {
  return {
    tenantId,
    paymentMeta: {
      path: ['provider'],
      equals: 'stripe',
    },
  };
}

export function paidRealStripeOrderWhere(tenantId: string): Prisma.OrderWhereInput {
  return {
    ...realStripeOrderWhere(tenantId),
    status: OrderStatus.PAID,
  };
}
