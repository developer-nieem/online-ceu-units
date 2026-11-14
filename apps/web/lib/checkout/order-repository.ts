import { OrderStatus, prisma } from '@calace/db';
import type { Prisma } from '@calace/db';

import { DEFAULT_TENANT_SLUG } from '@/lib/cms/db/mappers';
import { formatLearnerName } from '@/lib/enrollment/mappers';

import type {
  AdminOrderRecord,
  CheckoutOrderRecord,
  OrderLineItem,
  OrderPaymentMeta,
} from './types';

async function getTenantId(): Promise<string> {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: DEFAULT_TENANT_SLUG },
    select: { id: true },
  });

  if (!tenant) {
    throw new Error('Default tenant not found. Run `pnpm --filter @calace/db db:seed`.');
  }

  return tenant.id;
}

function parseLineItems(raw: Prisma.JsonValue): OrderLineItem[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw as unknown as OrderLineItem[];
}

function parsePaymentMeta(raw: Prisma.JsonValue): OrderPaymentMeta {
  const data = raw as unknown as OrderPaymentMeta;
  return {
    provider: data?.provider ?? 'demo',
    mode: data?.mode ?? 'demo',
    stripeSessionId: data?.stripeSessionId,
    stripePaymentIntentId: data?.stripePaymentIntentId,
    enrollmentId: data?.enrollmentId,
    completedAt: data?.completedAt,
  };
}

function decimalToNumber(value: Prisma.Decimal | number): number {
  return typeof value === 'number' ? value : Number(value);
}

function mapOrder(row: {
  id: string;
  userId: string;
  orderNumber: string;
  status: OrderStatus;
  currency: string;
  subtotal: Prisma.Decimal;
  tax: Prisma.Decimal;
  total: Prisma.Decimal;
  lineItems: Prisma.JsonValue;
  paymentMeta: Prisma.JsonValue;
  placedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): CheckoutOrderRecord {
  return {
    id: row.id,
    userId: row.userId,
    orderNumber: row.orderNumber,
    status: row.status,
    currency: row.currency,
    subtotal: decimalToNumber(row.subtotal),
    tax: decimalToNumber(row.tax),
    total: decimalToNumber(row.total),
    lineItems: parseLineItems(row.lineItems),
    paymentMeta: parsePaymentMeta(row.paymentMeta),
    placedAt: row.placedAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function generateOrderNumber(): string {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `CAL-${Date.now().toString(36).toUpperCase()}-${suffix}`;
}

export async function createPendingOrder(input: {
  userId: string;
  lineItems: OrderLineItem[];
  paymentMeta: OrderPaymentMeta;
  amountCents: number;
}): Promise<CheckoutOrderRecord> {
  const tenantId = await getTenantId();
  const total = input.amountCents / 100;

  const row = await prisma.order.create({
    data: {
      tenantId,
      userId: input.userId,
      orderNumber: generateOrderNumber(),
      status: OrderStatus.PENDING,
      currency: 'USD',
      subtotal: total,
      tax: 0,
      total,
      lineItems: input.lineItems as unknown as Prisma.InputJsonValue,
      paymentMeta: input.paymentMeta as unknown as Prisma.InputJsonValue,
    },
  });

  return mapOrder(row);
}

export async function getOrderById(orderId: string): Promise<CheckoutOrderRecord | undefined> {
  const row = await prisma.order.findUnique({ where: { id: orderId } });
  return row ? mapOrder(row) : undefined;
}

export async function getOrderForUser(
  orderId: string,
  userId: string,
): Promise<CheckoutOrderRecord | undefined> {
  const row = await prisma.order.findFirst({
    where: { id: orderId, userId },
  });

  return row ? mapOrder(row) : undefined;
}

export async function markOrderPaid(input: {
  orderId: string;
  paymentMeta: Partial<OrderPaymentMeta>;
}): Promise<CheckoutOrderRecord> {
  const existing = await prisma.order.findUnique({ where: { id: input.orderId } });
  if (!existing) {
    throw new Error('Order not found.');
  }

  const currentMeta = parsePaymentMeta(existing.paymentMeta);
  const mergedMeta: OrderPaymentMeta = {
    ...currentMeta,
    ...input.paymentMeta,
    completedAt: input.paymentMeta.completedAt ?? new Date().toISOString(),
  };

  const row = await prisma.order.update({
    where: { id: input.orderId },
    data: {
      status: OrderStatus.PAID,
      placedAt: existing.placedAt ?? new Date(),
      paymentMeta: mergedMeta as unknown as Prisma.InputJsonValue,
    },
  });

  return mapOrder(row);
}

export async function updateOrderPaymentMeta(
  orderId: string,
  patch: Partial<OrderPaymentMeta>,
): Promise<CheckoutOrderRecord> {
  const existing = await prisma.order.findUnique({ where: { id: orderId } });
  if (!existing) {
    throw new Error('Order not found.');
  }

  const mergedMeta: OrderPaymentMeta = {
    ...parsePaymentMeta(existing.paymentMeta),
    ...patch,
  };

  const row = await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentMeta: mergedMeta as unknown as Prisma.InputJsonValue,
    },
  });

  return mapOrder(row);
}

export async function listOrdersByCourseId(courseId: string): Promise<AdminOrderRecord[]> {
  const tenantId = await getTenantId();

  const rows = await prisma.order.findMany({
    where: { tenantId },
    include: {
      user: {
        select: { email: true, firstName: true, lastName: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return rows
    .filter((row) => parseLineItems(row.lineItems).some((item) => item.courseId === courseId))
    .map((row) => ({
      ...mapOrder(row),
      learnerEmail: row.user.email,
      learnerName: formatLearnerName(row.user.firstName, row.user.lastName, row.user.email),
    }));
}

export async function findPaidOrderForUserCourse(
  userId: string,
  courseId: string,
): Promise<CheckoutOrderRecord | undefined> {
  const rows = await prisma.order.findMany({
    where: {
      userId,
      status: OrderStatus.PAID,
    },
    orderBy: { createdAt: 'desc' },
  });

  const match = rows.find((row) =>
    parseLineItems(row.lineItems).some((item) => item.courseId === courseId),
  );

  return match ? mapOrder(match) : undefined;
}
