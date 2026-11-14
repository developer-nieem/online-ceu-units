const STRIPE_KEY_PLACEHOLDER_PREFIXES = ['sk_test_replace', 'sk_live_replace'] as const;
const STRIPE_WEBHOOK_PLACEHOLDER_PREFIX = 'whsec_replace';
const STRIPE_PRICE_PLACEHOLDER_PREFIX = 'price_replace';

export type StripeBillingMode = 'live' | 'test' | 'unconfigured';

/** True when STRIPE_SECRET_KEY is a real live key (sk_live_..., not a placeholder). */
export function isStripeLiveMode(): boolean {
  return getStripeBillingMode() === 'live';
}

/** Resolves billing mode from STRIPE_SECRET_KEY prefix and placeholder guards. */
export function getStripeBillingMode(): StripeBillingMode {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key || STRIPE_KEY_PLACEHOLDER_PREFIXES.some((prefix) => key.startsWith(prefix))) {
    return 'unconfigured';
  }
  if (key.startsWith('sk_live_')) return 'live';
  if (key.startsWith('sk_test_')) return 'test';
  return 'unconfigured';
}

export function getStripeSecretKey(): string | undefined {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key || STRIPE_KEY_PLACEHOLDER_PREFIXES.some((prefix) => key.startsWith(prefix))) {
    return undefined;
  }
  return key;
}

export function getStripeWebhookSecret(): string | undefined {
  const key = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!key || key.startsWith(STRIPE_WEBHOOK_PLACEHOLDER_PREFIX)) return undefined;
  return key;
}

function resolveStripePriceEnv(plan: string): string | undefined {
  const mode = getStripeBillingMode();
  const map: Record<string, string | undefined> = mode === 'live'
    ? {
        single: process.env.STRIPE_PRICE_SINGLE_LIVE,
        'unlimited-1y': process.env.STRIPE_PRICE_UNLIMITED_1Y_LIVE,
        'unlimited-2y': process.env.STRIPE_PRICE_UNLIMITED_2Y_LIVE,
      }
    : {
        single: process.env.STRIPE_PRICE_SINGLE,
        'unlimited-1y': process.env.STRIPE_PRICE_UNLIMITED_1Y,
        'unlimited-2y': process.env.STRIPE_PRICE_UNLIMITED_2Y,
      };
  return map[plan];
}

export function getStripePriceId(plan: string): string | undefined {
  const id = resolveStripePriceEnv(plan)?.trim();
  if (!id || id.startsWith(STRIPE_PRICE_PLACEHOLDER_PREFIX)) return undefined;
  return id;
}
