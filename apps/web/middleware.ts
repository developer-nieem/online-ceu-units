import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import {
  COOKIE_NAME,
  getReviewGateSecret,
  isReviewGateBypassPath,
  isReviewGateEnabled,
  verifyReviewAuthCookie,
  withNoIndexHeader,
} from '@/lib/review-gate';

export async function middleware(request: NextRequest) {
  if (!isReviewGateEnabled()) {
    return NextResponse.next();
  }

  const secret = getReviewGateSecret();
  const { pathname } = request.nextUrl;

  if (isReviewGateBypassPath(pathname)) {
    return withNoIndexHeader(NextResponse.next());
  }

  const cookieValue = request.cookies.get(COOKIE_NAME)?.value;
  if (secret && cookieValue && (await verifyReviewAuthCookie(cookieValue, secret))) {
    return withNoIndexHeader(NextResponse.next());
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/review-login';
  loginUrl.search = '';
  const redirectTarget = `${pathname}${request.nextUrl.search}`;
  loginUrl.searchParams.set('redirect', redirectTarget);

  return withNoIndexHeader(NextResponse.redirect(loginUrl));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets/).*)'],
};
