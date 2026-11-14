import type { PaymentProvider } from './types';

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function getPaymentProvider(): PaymentProvider {
  return isStripeConfigured() ? 'stripe' : 'demo';
}

export function isDemoCheckoutMode(): boolean {
  return !isStripeConfigured();
}

export function getStripeWebhookSecret(): string | undefined {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() || undefined;
}

export function getAppBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';
}
