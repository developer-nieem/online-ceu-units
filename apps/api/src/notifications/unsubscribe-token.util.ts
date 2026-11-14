import { createHmac, timingSafeEqual } from 'node:crypto';
import type { ConfigService } from '@nestjs/config';

import { resolveJwtAccessSecret } from '../config/jwt.config';

/**
 * Scopes an unsubscribe link can target. Each maps to exactly one preference
 * flag that gets turned off when the link is used. Values are stable strings
 * baked into signed links that may live in a recipient's inbox for a long
 * time — DO NOT rename them, or old links break.
 */
export const UNSUBSCRIBE_SCOPE = {
  /** Course / renewal / behind-pace reminders → courseRemindersEnabled */
  COURSE_REMINDERS: 'course-reminders',
  /** Referral + other promotional mail → marketingEmailsEnabled */
  MARKETING: 'marketing',
  /** Global opt-out of all non-essential email → emailEnabled */
  ALL: 'all',
} as const;

export type UnsubscribeScope =
  (typeof UNSUBSCRIBE_SCOPE)[keyof typeof UNSUBSCRIBE_SCOPE];

const VALID_SCOPES = new Set<string>(Object.values(UNSUBSCRIBE_SCOPE));

export function isUnsubscribeScope(value: string): value is UnsubscribeScope {
  return VALID_SCOPES.has(value);
}

export type UnsubscribePayload = {
  /** Token format version — lets us rotate the scheme later. */
  v: 1;
  /** Tenant id (multi-tenant isolation). */
  t: string;
  /** User id whose preferences this link controls. */
  u: string;
  /** What the link unsubscribes from. */
  s: UnsubscribeScope;
};

/**
 * Secret used to sign unsubscribe tokens. Prefers a dedicated
 * UNSUBSCRIBE_SECRET; otherwise derives a distinct key from the existing
 * JWT access secret so no new env var is REQUIRED for the feature to work.
 * Deriving (rather than reusing the JWT secret directly) keeps unsubscribe
 * signatures in their own keyspace, so a leaked unsubscribe token can never
 * be confused with or used to forge an auth token.
 */
export function resolveUnsubscribeSecret(config: ConfigService): string {
  const dedicated = config.get<string>('UNSUBSCRIBE_SECRET')?.trim();
  if (dedicated && dedicated.length >= 16) {
    return dedicated;
  }
  const base = resolveJwtAccessSecret(config);
  return createHmac('sha256', base).update('calace:unsubscribe:v1').digest('hex');
}

function b64urlEncode(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

function sign(secret: string, body: string): string {
  return createHmac('sha256', secret).update(body).digest('base64url');
}

/**
 * Produce a tamper-proof token: `<base64url(payload)>.<base64url(hmac)>`.
 * The signature covers the payload; no secret material is embedded.
 */
export function signUnsubscribeToken(
  secret: string,
  payload: Omit<UnsubscribePayload, 'v'>,
): string {
  const full: UnsubscribePayload = { v: 1, ...payload };
  const body = b64urlEncode(JSON.stringify(full));
  return `${body}.${sign(secret, body)}`;
}

/**
 * Verify and decode a token. Returns the payload only if the signature is
 * valid and well-formed; otherwise null. Uses a constant-time comparison so
 * signature checking does not leak timing information.
 */
export function verifyUnsubscribeToken(
  secret: string,
  token: string,
): UnsubscribePayload | null {
  if (typeof token !== 'string' || token.length === 0) return null;
  const dot = token.indexOf('.');
  if (dot <= 0 || dot === token.length - 1) return null;

  const body = token.slice(0, dot);
  const providedSig = token.slice(dot + 1);
  const expectedSig = sign(secret, body);

  const a = Buffer.from(providedSig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const decoded = JSON.parse(
      Buffer.from(body, 'base64url').toString('utf8'),
    ) as Partial<UnsubscribePayload>;
    if (
      decoded.v === 1 &&
      typeof decoded.t === 'string' &&
      decoded.t.length > 0 &&
      typeof decoded.u === 'string' &&
      decoded.u.length > 0 &&
      typeof decoded.s === 'string' &&
      isUnsubscribeScope(decoded.s)
    ) {
      return { v: 1, t: decoded.t, u: decoded.u, s: decoded.s };
    }
    return null;
  } catch {
    return null;
  }
}

/** Preference patch that a given scope applies when the link is used. */
export function scopeToPreferencePatch(scope: UnsubscribeScope): {
  inAppEnabled?: boolean;
  emailEnabled?: boolean;
  courseRemindersEnabled?: boolean;
  certificateNotificationsEnabled?: boolean;
  marketingEmailsEnabled?: boolean;
} {
  switch (scope) {
    case UNSUBSCRIBE_SCOPE.COURSE_REMINDERS:
      return { courseRemindersEnabled: false };
    case UNSUBSCRIBE_SCOPE.MARKETING:
      return { marketingEmailsEnabled: false };
    case UNSUBSCRIBE_SCOPE.ALL:
      return { emailEnabled: false };
    default:
      return {};
  }
}

/** Human-readable label for confirmation screens. */
export function scopeLabel(scope: UnsubscribeScope): string {
  switch (scope) {
    case UNSUBSCRIBE_SCOPE.COURSE_REMINDERS:
      return 'course and CEU renewal reminder emails';
    case UNSUBSCRIBE_SCOPE.MARKETING:
      return 'referral and promotional emails';
    case UNSUBSCRIBE_SCOPE.ALL:
      return 'all non-essential emails';
    default:
      return 'these emails';
  }
}

/**
 * Build the recipient-facing unsubscribe URL (the confirmation page on the
 * web app). GET on this page must NOT change state — it only shows a confirm
 * button — so inbox link-scanners cannot unsubscribe a user by prefetching.
 */
export function buildUnsubscribeUrl(webBaseUrl: string, token: string): string {
  const base = webBaseUrl.replace(/\/$/, '');
  return `${base}/unsubscribe?token=${encodeURIComponent(token)}`;
}

/**
 * RFC 8058 one-click endpoint, used only in the List-Unsubscribe-Post header.
 * This is POSTed by the mail provider (Gmail/Apple) on the user's behalf, so
 * it is allowed to change state. Routed through the web app's API proxy so it
 * is reachable at a stable public origin.
 */
export function buildOneClickUnsubscribeUrl(
  webBaseUrl: string,
  token: string,
): string {
  const base = webBaseUrl.replace(/\/$/, '');
  return `${base}/api/notifications/unsubscribe/one-click?token=${encodeURIComponent(token)}`;
}
