import type { NextResponse } from 'next/server';

const COOKIE_NAME = 'calace_review_auth';
const COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export { COOKIE_NAME, COOKIE_MAX_AGE_SECONDS };

export function isReviewGateEnabled(): boolean {
  return Boolean(process.env.REVIEW_GATE_PASSWORD?.trim());
}

export function getReviewGatePassword(): string | undefined {
  const value = process.env.REVIEW_GATE_PASSWORD?.trim();
  return value || undefined;
}

export function getReviewGateSecret(): string | undefined {
  const value = process.env.REVIEW_GATE_SECRET?.trim();
  return value || undefined;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (padded.length % 4)) % 4;
  const base64 = padded + '='.repeat(padLength);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function signReviewAuthCookie(secret: string): Promise<string> {
  const expiresAt = Date.now() + COOKIE_MAX_AGE_SECONDS * 1000;
  const payload = String(expiresAt);
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return `${payload}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

export async function verifyReviewAuthCookie(
  cookieValue: string | undefined,
  secret: string,
): Promise<boolean> {
  if (!cookieValue) return false;

  const dotIndex = cookieValue.lastIndexOf('.');
  if (dotIndex <= 0) return false;

  const payload = cookieValue.slice(0, dotIndex);
  const signature = cookieValue.slice(dotIndex + 1);
  const expiresAt = Number.parseInt(payload, 10);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return false;

  try {
    const key = await importHmacKey(secret);
    const signatureBytes = base64UrlToBytes(signature);
    return crypto.subtle.verify(
      'HMAC',
      key,
      new Uint8Array(signatureBytes),
      new TextEncoder().encode(payload),
    );
  } catch {
    return false;
  }
}

export function isReviewGateBypassPath(pathname: string): boolean {
  return (
    pathname === '/review-login' ||
    pathname.startsWith('/api/review-gate') ||
    // Email unsubscribe must work even when the review gate is enabled on a
    // staging/preview deployment — recipients clicking a link are not logged
    // in and cannot pass the gate. The unsubscribe API is HMAC-token-authed on
    // the backend, so bypassing the gate here is safe.
    pathname === '/unsubscribe' ||
    pathname.startsWith('/api/notifications/unsubscribe')
  );
}

export function sanitizeRedirectPath(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/';
  }
  return value;
}

export function withNoIndexHeader<T extends NextResponse>(response: T): T {
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}
