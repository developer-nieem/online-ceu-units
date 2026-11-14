import { Injectable, Logger, OnModuleInit } from '@nestjs/common';



import {

  getStripeBillingMode,

  getStripePriceId,

  getStripeSecretKey,

  getStripeWebhookSecret,

} from './stripe.config';



export type StripePaymentIntent = {

  id: string;

  amount: number;

  currency: string;

  customer: string | null;

  status: string;

  metadata: Record<string, string>;

};



export type StripeInvoice = {

  id: string;

  subscription: string | { id: string } | null;

  customer: string | null;

  amount_paid: number;

  billing_reason: string | null;

  payment_intent: string | { id: string; client_secret?: string } | null;

};



export type StripeSubscription = {

  id: string;

  customer: string | null;

  metadata: Record<string, string>;

};



export type StripeWebhookEvent = {

  type: string;

  data: { object: StripePaymentIntent | StripeInvoice | StripeSubscription };

};



type StripeClient = {

  customers: {

    create: (params: {

      email: string;

      name?: string;

      metadata: Record<string, string>;

    }) => Promise<{ id: string }>;

  };

  paymentIntents: {

    create: (params: {

      amount: number;

      currency: string;

      customer: string;

      metadata: Record<string, string>;

      automatic_payment_methods: { enabled: boolean };

    }) => Promise<{ id: string; client_secret: string | null }>;

    retrieve: (id: string) => Promise<StripePaymentIntent>;

  };

  subscriptions: {

    create: (params: {

      customer: string;

      items: { price: string }[];

      payment_behavior: 'default_incomplete';

      payment_settings: { save_default_payment_method: 'on_subscription' };

      expand: string[];

      metadata: Record<string, string>;

    }) => Promise<{

      id: string;

      latest_invoice:

        | string

        | {

            payment_intent: string | { id: string; client_secret: string | null } | null;

          }

        | null;

    }>;

    retrieve: (id: string) => Promise<StripeSubscription>;

  };

  webhooks: {

    constructEvent: (

      payload: Buffer,

      signature: string,

      secret: string,

    ) => StripeWebhookEvent;

  };

};



@Injectable()

export class StripeService implements OnModuleInit {

  private readonly logger = new Logger(StripeService.name);

  private client: StripeClient | null = null;



  onModuleInit(): void {

    const mode = getStripeBillingMode();

    if (mode === 'live') {

      this.logger.log('Stripe billing: LIVE mode — using STRIPE_PRICE_*_LIVE price IDs');

    } else if (mode === 'test') {

      this.logger.log('Stripe billing: TEST mode — using STRIPE_PRICE_* price IDs');

    } else {

      this.logger.warn(

        'Stripe billing: unconfigured — checkout falls back to mock until keys and price IDs are set',

      );

    }

  }



  isConfigured(): boolean {

    return Boolean(getStripeSecretKey());

  }



  getClient(): StripeClient | null {

    if (!this.isConfigured()) return null;

    if (!this.client) {

      // eslint-disable-next-line @typescript-eslint/no-require-imports

      const Stripe = require('stripe') as new (key: string) => StripeClient;

      this.client = new Stripe(getStripeSecretKey()!);

    }

    return this.client;

  }



  async ensureCustomer(params: {

    email: string;

    name?: string;

    metadata: Record<string, string>;

  }): Promise<string | null> {

    const stripe = this.getClient();

    if (!stripe) return null;



    const customer = await stripe.customers.create({

      email: params.email,

      name: params.name,

      metadata: params.metadata,

    });



    return customer.id;

  }



  async createPaymentIntent(params: {

    customerId: string;

    amountCents: number;

    metadata: Record<string, string>;

  }): Promise<{ paymentIntentId: string; clientSecret: string } | null> {

    const stripe = this.getClient();

    if (!stripe) return null;



    const intent = await stripe.paymentIntents.create({

      amount: params.amountCents,

      currency: 'usd',

      customer: params.customerId,

      metadata: params.metadata,

      automatic_payment_methods: { enabled: true },

    });



    if (!intent.client_secret) return null;

    return { paymentIntentId: intent.id, clientSecret: intent.client_secret };

  }



  async createSubscriptionPayment(params: {

    customerId: string;

    priceId: string;

    metadata: Record<string, string>;

  }): Promise<{ subscriptionId: string; clientSecret: string } | null> {

    const stripe = this.getClient();

    if (!stripe) return null;



    const subscription = await stripe.subscriptions.create({

      customer: params.customerId,

      items: [{ price: params.priceId }],

      payment_behavior: 'default_incomplete',

      payment_settings: { save_default_payment_method: 'on_subscription' },

      expand: ['latest_invoice.payment_intent'],

      metadata: params.metadata,

    });



    const latestInvoice = subscription.latest_invoice;

    if (!latestInvoice || typeof latestInvoice === 'string') return null;



    const paymentIntent = latestInvoice.payment_intent;

    if (!paymentIntent || typeof paymentIntent === 'string') return null;



    const clientSecret = paymentIntent.client_secret;

    if (!clientSecret) return null;



    return { subscriptionId: subscription.id, clientSecret };

  }



  async retrieveSubscription(subscriptionId: string): Promise<StripeSubscription | null> {

    const stripe = this.getClient();

    if (!stripe) return null;



    return stripe.subscriptions.retrieve(subscriptionId);

  }



  resolvePriceId(plan: string): string | null {

    return getStripePriceId(plan) ?? null;

  }



  constructWebhookEvent(payload: Buffer, signature: string): StripeWebhookEvent | null {

    const stripe = this.getClient();

    const secret = getStripeWebhookSecret();

    if (!stripe || !secret) return null;



    try {

      return stripe.webhooks.constructEvent(payload, signature, secret);

    } catch (err) {

      this.logger.warn(`Webhook signature verification failed: ${err}`);

      return null;

    }

  }

}


