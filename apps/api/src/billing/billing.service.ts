import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';

import { SubscriptionStatus } from '@calace/db';



import type { AuthUser } from '../auth/types/auth-user.type';

import { isFreeFromCatalogData } from '../catalog/catalog-pricing.util';

import { PrismaService } from '../prisma/prisma.service';

import { EnrollmentService } from '../enrollments/enrollment.service';
import { ProviderComplianceSettingsService } from '../provider-compliance/provider-compliance-settings.service';

import {

  isSubscriptionPlan,

  PLAN_PRICES,

  type PurchasePlan,

} from '../enrollments/pricing.constants';

import { CreateCheckoutDto } from './dto/create-checkout.dto';

import {

  StripeService,

  type StripeInvoice,

  type StripePaymentIntent,

} from './stripe.service';



@Injectable()

export class BillingService {

  private readonly logger = new Logger(BillingService.name);



  constructor(

    private readonly prisma: PrismaService,

    private readonly stripe: StripeService,

    private readonly enrollments: EnrollmentService,

    private readonly providerSettings: ProviderComplianceSettingsService,

  ) {}



  async getAccount(user: AuthUser): Promise<{

    stripeEnabled: boolean;

    customer: {

      id: string;

      stripeCustomerId: string | null;

      email: string | null;

    } | null;

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

  }> {

    const [customer, subscription, orders] = await Promise.all([

      this.prisma.billingCustomer.findUnique({ where: { userId: user.userId } }),

      this.prisma.subscription.findFirst({

        where: {

          userId: user.userId,

          tenantId: user.tenantId,

          status: SubscriptionStatus.ACTIVE,

        },

        orderBy: { currentPeriodEnd: 'desc' },

      }),

      this.prisma.order.findMany({

        where: { userId: user.userId, tenantId: user.tenantId },

        orderBy: { createdAt: 'desc' },

        take: 10,

      }),

    ]);



    return {

      stripeEnabled: this.stripe.isConfigured(),

      customer: customer

        ? {

            id: customer.id,

            stripeCustomerId: customer.stripeCustomerId,

            email: customer.email,

          }

        : null,

      subscription: subscription

        ? {

            planCode: subscription.planCode,

            status: subscription.status,

            currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,

            billingMeta: subscription.billingMeta,

          }

        : null,

      orders: orders.map((o) => ({

        id: o.id,

        orderNumber: o.orderNumber,

        status: o.status,

        total: Number(o.total),

        placedAt: o.placedAt?.toISOString() ?? null,

        lineItems: o.lineItems,

        paymentMeta: o.paymentMeta,

      })),

      paymentMethod: {

        placeholder: true,

        note: 'No credit card information is required.',

      },

    };

  }



  private async ensureBillingCustomer(user: AuthUser) {

    const existing = await this.prisma.billingCustomer.findUnique({

      where: { userId: user.userId },

    });

    if (existing?.stripeCustomerId) return existing;



    const dbUser = await this.prisma.user.findUnique({ where: { id: user.userId } });

    if (!dbUser) throw new BadRequestException('User not found');



    let stripeCustomerId = existing?.stripeCustomerId ?? null;

    if (this.stripe.isConfigured() && !stripeCustomerId) {

      stripeCustomerId = await this.stripe.ensureCustomer({

        email: dbUser.email,

        name: [dbUser.firstName, dbUser.lastName].filter(Boolean).join(' ') || undefined,

        metadata: { tenantId: user.tenantId, userId: user.userId },

      });

    }



    return this.prisma.billingCustomer.upsert({

      where: { userId: user.userId },

      create: {

        tenantId: user.tenantId,

        userId: user.userId,

        email: dbUser.email,

        stripeCustomerId,

        metadata: { source: 'cal-ace-lms' },

      },

      update: {

        email: dbUser.email,

        stripeCustomerId: stripeCustomerId ?? undefined,

      },

    });

  }



  /** @deprecated Use initializePayment — kept as alias for transitional clients. */

  async createCheckoutSession(user: AuthUser, dto: CreateCheckoutDto) {

    return this.initializePayment(user, dto);

  }



  async initializePayment(user: AuthUser, dto: CreateCheckoutDto) {

    const plan = dto.purchasePlan as PurchasePlan;

    const price = PLAN_PRICES[plan];



    if (!isSubscriptionPlan(plan) && !dto.courseSlug) {

      throw new BadRequestException('courseSlug is required for single-course checkout');

    }



    if (!this.stripe.isConfigured()) {

      return {

        mode: 'mock' as const,

        message:

          'Checkout is not configured in development yet (Stripe sandbox disabled). Use mock checkout below — no charge.',

        price,

        plan,

        courseSlug: dto.courseSlug ?? null,

      };

    }



    const tenantSettings = await this.providerSettings.getForTenant(user.tenantId);
    if (!tenantSettings.cdphOnlineApproved) {
      throw new ForbiddenException(
        'Online CE is not yet available. CAL ACE is pending CDPH online program ' +
        'approval. In-person classes are available — contact us at (408) 256-0763.',
      );
    }

    const customer = await this.ensureBillingCustomer(user);

    if (!customer.stripeCustomerId) {

      throw new BadRequestException('Unable to create Stripe customer');

    }



    const priceId = this.stripe.resolvePriceId(plan);

    if (!priceId) {

      return {

        mode: 'mock' as const,

        message:

          'Checkout is not configured in development yet (Stripe price IDs missing). Use mock checkout — no charge.',

        price,

        plan,

        courseSlug: dto.courseSlug ?? null,

      };

    }



    const metadata = {

      userId: String(user.userId),

      tenantId: String(user.tenantId || 'default'),

      plan: String(plan),

      courseSlug: dto.courseSlug ? String(dto.courseSlug) : '',

    };



    // All plans are one-time PaymentIntents. Unlimited 1y/2y grant a fixed
    // access window in fulfillStripePurchase — they are not Stripe subscriptions.
    const amountCents = Math.round(price * 100);

    if (plan === 'single') {
      const activeSubscription = await this.enrollments.getActiveSubscription(
        user.userId,
        user.tenantId,
      );
      if (activeSubscription) {
        throw new ConflictException('Already covered by your Unlimited subscription');
      }
    }

    const paymentIntent = await this.stripe.createPaymentIntent({

      customerId: customer.stripeCustomerId,

      amountCents,

      metadata,

    });



    if (!paymentIntent) {

      throw new BadRequestException('Failed to initialize Stripe payment');

    }



    return {

      mode: 'elements' as const,

      clientSecret: paymentIntent.clientSecret,

      price,

      plan,

      courseSlug: dto.courseSlug ?? null,

    };

  }



  async processMockCheckout(user: AuthUser, dto: CreateCheckoutDto) {
    if (
      process.env.NODE_ENV === 'production' &&
      process.env.REVIEW_MOCK_CHECKOUT !== 'true'
    ) {
      throw new ForbiddenException(
        'Mock checkout is disabled in production. Configure Stripe to accept payments.',
      );
    }

    const plan = dto.purchasePlan as PurchasePlan;



    if (dto.courseSlug) {

      const isFree = await this.isCourseFree(user.tenantId, dto.courseSlug);

      return this.enrollments.enroll(user, {

        courseSlug: dto.courseSlug,

        ...(isFree ? {} : { purchasePlan: plan }),

      });

    }



    if (!isSubscriptionPlan(plan)) {

      throw new BadRequestException(

        'courseSlug is required for single-course mock checkout',

      );

    }



    return this.enrollments.activateSubscriptionPurchase(user, plan);

  }



  private async isCourseFree(tenantId: string, courseSlug: string): Promise<boolean> {

    const course = await this.prisma.course.findFirst({

      where: { tenantId, slug: courseSlug, deletedAt: null },

      select: { catalogData: true },

    });

    return course ? isFreeFromCatalogData(course.catalogData) : false;

  }



  async handleWebhook(payload: Buffer, signature: string | undefined) {

    if (!signature) {

      return { received: false, reason: 'missing_signature' };

    }



    const event = this.stripe.constructWebhookEvent(payload, signature);

    if (!event) {

      return { received: false, reason: 'invalid_signature_or_not_configured' };

    }



    switch (event.type) {

      case 'payment_intent.succeeded': {

        const paymentIntent = event.data.object as StripePaymentIntent;

        return this.handlePaymentIntentSucceeded(paymentIntent);

      }

      case 'invoice.paid':

      case 'invoice.payment_succeeded': {

        const invoice = event.data.object as StripeInvoice;

        return this.handleInvoicePaid(invoice);

      }

      // checkout.session.completed intentionally not handled —
      // app uses Stripe Elements; fulfillment runs via payment_intent.succeeded.
      // If hosted Checkout is ever enabled, add a handler here first.

      default:

        return { received: true, type: event.type, handled: false };

    }

  }



  private async handlePaymentIntentSucceeded(paymentIntent: StripePaymentIntent) {

    const { userId, tenantId, plan, courseSlug } = paymentIntent.metadata ?? {};



    if (!userId || !tenantId || !plan) {

      this.logger.warn(

        `PaymentIntent ${paymentIntent.id} missing required metadata (userId, tenantId, plan)`,

      );

      return {

        received: true,

        type: 'payment_intent.succeeded',

        handled: false,

        reason: 'missing_metadata',

      };

    }



    try {

      const result = await this.enrollments.fulfillStripePurchase({

        userId,

        tenantId,

        plan,

        courseSlug: courseSlug || undefined,

        stripePaymentIntentId: paymentIntent.id,

        stripeCustomerId: paymentIntent.customer ?? undefined,

        amountTotalCents: paymentIntent.amount,

      });



      this.logger.log(

        `Fulfilled PaymentIntent ${paymentIntent.id} for user ${userId} (plan=${plan})`,

      );



      return {

        received: true,

        type: 'payment_intent.succeeded',

        handled: true,

        ...result,

      };

    } catch (err) {

      this.logger.error(`Stripe fulfillment failed for PaymentIntent ${paymentIntent.id}: ${err}`);

      return {

        received: true,

        type: 'payment_intent.succeeded',

        handled: false,

        reason: 'fulfillment_error',

        message: err instanceof Error ? err.message : 'Unknown error',

      };

    }

  }



  private async handleInvoicePaid(invoice: StripeInvoice) {

    const subscriptionRef = invoice.subscription;

    const subscriptionId =

      typeof subscriptionRef === 'string' ? subscriptionRef : subscriptionRef?.id;



    if (!subscriptionId) {

      return {

        received: true,

        type: 'invoice.paid',

        handled: false,

        reason: 'not_a_subscription_invoice',

      };

    }



    if (invoice.billing_reason === 'subscription_cycle') {

      return {

        received: true,

        type: 'invoice.paid',

        handled: false,

        note: 'renewal_deferred',

        billingReason: invoice.billing_reason,

      };

    }



    const subscription = await this.stripe.retrieveSubscription(subscriptionId);

    if (!subscription) {

      return {

        received: true,

        type: 'invoice.paid',

        handled: false,

        reason: 'subscription_not_found',

      };

    }



    const { userId, tenantId, plan, courseSlug } = subscription.metadata ?? {};

    if (!userId || !tenantId || !plan) {

      this.logger.warn(

        `Invoice ${invoice.id} subscription ${subscriptionId} missing required metadata`,

      );

      return {

        received: true,

        type: 'invoice.paid',

        handled: false,

        reason: 'missing_metadata',

      };

    }



    const paymentIntentRef = invoice.payment_intent;

    const paymentIntentId =

      typeof paymentIntentRef === 'string' ? paymentIntentRef : paymentIntentRef?.id;



    try {

      const result = await this.enrollments.fulfillStripePurchase({

        userId,

        tenantId,

        plan,

        courseSlug: courseSlug || undefined,

        stripeInvoiceId: invoice.id,

        stripePaymentIntentId: paymentIntentId,

        stripeCustomerId:

          (typeof invoice.customer === 'string'

            ? invoice.customer

            : invoice.customer) ?? subscription.customer ?? undefined,

        stripeSubscriptionId: subscriptionId,

        amountTotalCents: invoice.amount_paid,

      });



      this.logger.log(

        `Fulfilled invoice ${invoice.id} for user ${userId} (plan=${plan}, subscription=${subscriptionId})`,

      );



      return {

        received: true,

        type: 'invoice.paid',

        handled: true,

        ...result,

      };

    } catch (err) {

      this.logger.error(`Stripe fulfillment failed for invoice ${invoice.id}: ${err}`);

      return {

        received: true,

        type: 'invoice.paid',

        handled: false,

        reason: 'fulfillment_error',

        message: err instanceof Error ? err.message : 'Unknown error',

      };

    }

  }

}


