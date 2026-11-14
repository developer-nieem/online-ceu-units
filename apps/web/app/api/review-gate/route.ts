import { timingSafeEqual } from 'node:crypto';

import { NextResponse } from 'next/server';

import {
  COOKIE_MAX_AGE_SECONDS,
  COOKIE_NAME,
  getReviewGatePassword,
  getReviewGateSecret,
  isReviewGateEnabled,
  sanitizeRedirectPath,
  signReviewAuthCookie,
  withNoIndexHeader,
} from '@/lib/review-gate';

function safePasswordMatch(submitted: string, expected: string): boolean {
  const submittedBuffer = Buffer.from(submitted, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');

  if (submittedBuffer.length !== expectedBuffer.length) {
    if (submittedBuffer.length > 0) {
      timingSafeEqual(submittedBuffer, submittedBuffer);
    }
    return false;
  }

  return timingSafeEqual(submittedBuffer, expectedBuffer);
}

function buildErrorRedirect(request: Request, redirectPath: string): NextResponse {
  const url = new URL('/review-login', request.url);
  url.searchParams.set('redirect', redirectPath);
  url.searchParams.set('error', '1');
  return withNoIndexHeader(NextResponse.redirect(url));
}

export async function POST(request: Request) {
  if (!isReviewGateEnabled()) {
    return withNoIndexHeader(NextResponse.redirect(new URL('/', request.url)));
  }

  const expectedPassword = getReviewGatePassword();
  const secret = getReviewGateSecret();
  if (!expectedPassword || !secret) {
    return withNoIndexHeader(
      NextResponse.json({ error: 'Review gate is misconfigured.' }, { status: 503 }),
    );
  }

  const formData = await request.formData();
  const submittedPassword = String(formData.get('password') ?? '');
  const redirectPath = sanitizeRedirectPath(String(formData.get('redirect') ?? '/'));

  if (!safePasswordMatch(submittedPassword, expectedPassword)) {
    return buildErrorRedirect(request, redirectPath);
  }

  const cookieValue = await signReviewAuthCookie(secret);
  const response = withNoIndexHeader(NextResponse.redirect(new URL(redirectPath, request.url)));
  response.cookies.set({
    name: COOKIE_NAME,
    value: cookieValue,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE_SECONDS,
    path: '/',
  });

  return response;
}
