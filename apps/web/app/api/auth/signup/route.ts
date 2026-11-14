import { NextResponse } from 'next/server';

import { LEARNER_ROLE } from '@/lib/auth/learner';
import { apiUrl } from '@/lib/api-config';
import { findLearnerUserByEmail } from '@/lib/enrollment/repository';

const AUTH_COOKIE_NAMES = ['calace_access', 'calace_refresh', 'calace_csrf'] as const;

function getSetCookies(headers: Headers): string[] {
  const getSetCookie = (headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;
  if (typeof getSetCookie === 'function') {
    return getSetCookie.call(headers);
  }
  const raw = (headers as Headers & { raw?: () => Record<string, string[]> }).raw?.();
  const fromRaw = raw?.['set-cookie'];
  if (fromRaw?.length) {
    return fromRaw;
  }
  const single = headers.get('set-cookie');
  return single ? [single] : [];
}

function parseCookiePair(setCookie: string): { name: string; value: string } | null {
  const pair = setCookie.split(';')[0]?.trim();
  if (!pair) return null;
  const eq = pair.indexOf('=');
  if (eq < 0) return null;
  return { name: pair.slice(0, eq).trim(), value: pair.slice(eq + 1).trim() };
}

function ingestCookies(jar: Map<string, string>, setCookies: string[]) {
  for (const raw of setCookies) {
    const parsed = parseCookiePair(raw);
    if (parsed) jar.set(parsed.name, parsed.value);
  }
}

function cookieHeader(jar: Map<string, string>): string {
  return [...jar.entries()].map(([name, value]) => `${name}=${value}`).join('; ');
}

function appendAuthCookies(response: NextResponse, setCookies: string[]) {
  for (const raw of setCookies) {
    const parsed = parseCookiePair(raw);
    if (!parsed || !AUTH_COOKIE_NAMES.includes(parsed.name as (typeof AUTH_COOKIE_NAMES)[number])) {
      continue;
    }

    const options: {
      path?: string;
      maxAge?: number;
      httpOnly?: boolean;
      sameSite?: 'lax' | 'strict' | 'none';
      expires?: Date;
    } = {};

    for (const part of raw.split(';').slice(1).map((segment) => segment.trim())) {
      const lower = part.toLowerCase();
      if (lower.startsWith('domain=') || lower === 'secure') {
        continue;
      }
      if (lower === 'httponly') {
        options.httpOnly = true;
        continue;
      }
      const eq = part.indexOf('=');
      if (eq < 0) {
        continue;
      }
      const attrName = part.slice(0, eq).trim().toLowerCase();
      const attrValue = part.slice(eq + 1).trim();
      if (attrName === 'path') {
        options.path = attrValue;
      } else if (attrName === 'max-age') {
        const maxAge = parseInt(attrValue, 10);
        if (!Number.isNaN(maxAge)) {
          options.maxAge = maxAge;
        }
      } else if (attrName === 'samesite') {
        const sameSite = attrValue.toLowerCase();
        options.sameSite = sameSite === 'none' ? 'lax' : (sameSite as 'lax' | 'strict' | 'none');
      } else if (attrName === 'expires') {
        const expires = new Date(attrValue);
        if (!Number.isNaN(expires.getTime())) {
          options.expires = expires;
        }
      }
    }

    response.cookies.set(parsed.name, parsed.value, options);
  }
}

type SignupBody = {
  email?: unknown;
  password?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  cnaLicenseNumber?: unknown;
  termsAccepted?: unknown;
  referredByCode?: unknown;
  city?: unknown;
  cityConsentGiven?: unknown;
  captchaToken?: unknown;
};

export async function POST(request: Request) {
  if (process.env.SIGNUP_ENABLED !== 'true') {
    return NextResponse.json(
      { error: 'Public signup is not currently enabled.' },
      { status: 403 },
    );
  }

  let body: SignupBody;
  try {
    body = (await request.json()) as SignupBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : '';
  const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : '';
  const cnaLicenseNumber =
    typeof body.cnaLicenseNumber === 'string' ? body.cnaLicenseNumber.trim() : '';
  const referredByCode =
    typeof body.referredByCode === 'string' && body.referredByCode.trim().length === 8
      ? body.referredByCode.trim().toUpperCase()
      : undefined;

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }
  if (!firstName || !lastName) {
    return NextResponse.json({ error: 'First and last name are required.' }, { status: 400 });
  }
  if (!cnaLicenseNumber) {
    return NextResponse.json({ error: 'CNA License Number is required.' }, { status: 400 });
  }
  if (cnaLicenseNumber.length > 64) {
    return NextResponse.json(
      { error: 'CNA License Number must be 64 characters or fewer.' },
      { status: 400 },
    );
  }
  if (body.termsAccepted !== true) {
    return NextResponse.json(
      { error: 'You must agree to the terms and privacy notice to continue.' },
      { status: 400 },
    );
  }

  let city: string | null | undefined;
  if (body.city === undefined) {
    city = undefined;
  } else if (body.city === null) {
    city = null;
  } else if (typeof body.city === 'string') {
    const trimmed = body.city.trim();
    if (trimmed.length > 100) {
      return NextResponse.json(
        { error: 'City must be 100 characters or fewer.' },
        { status: 400 },
      );
    }
    city = trimmed.length > 0 ? trimmed : null;
  } else {
    return NextResponse.json({ error: 'City must be text.' }, { status: 400 });
  }

  let cityConsentGiven: boolean | undefined;
  if (body.cityConsentGiven === undefined) {
    cityConsentGiven = undefined;
  } else if (typeof body.cityConsentGiven === 'boolean') {
    cityConsentGiven = body.cityConsentGiven;
  } else {
    return NextResponse.json({ error: 'City consent must be true or false.' }, { status: 400 });
  }

  const captchaToken =
    typeof body.captchaToken === 'string' && body.captchaToken.trim().length > 0
      ? body.captchaToken.trim()
      : undefined;

  const jar = new Map<string, string>();

  const csrfResponse = await fetch(apiUrl('/auth/csrf'), { method: 'GET', cache: 'no-store' });
  const csrfSetCookies = getSetCookies(csrfResponse.headers);
  ingestCookies(jar, csrfSetCookies);

  let csrfBody: unknown;
  try {
    csrfBody = await csrfResponse.json();
  } catch {
    csrfBody = null;
  }

  const csrfToken =
    typeof csrfBody === 'object' && csrfBody && 'csrfToken' in csrfBody &&
    typeof (csrfBody as { csrfToken?: unknown }).csrfToken === 'string'
      ? (csrfBody as { csrfToken: string }).csrfToken
      : '';

  if (!csrfResponse.ok || !csrfToken) {
    return NextResponse.json({ error: 'Could not start signup. Please try again.' }, { status: 500 });
  }

  jar.set('calace_csrf', csrfToken);

  const signupResponse = await fetch(apiUrl('/auth/signup'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-csrf-token': csrfToken,
      'x-calace-client': 'web',
      Cookie: cookieHeader(jar),
    },
    body: JSON.stringify({
      email,
      password,
      firstName,
      lastName,
      cnaLicenseNumber,
      termsAccepted: true,
      ...(city !== undefined ? { city } : {}),
      ...(cityConsentGiven !== undefined ? { cityConsentGiven } : {}),
      ...(referredByCode ? { referredByCode } : {}),
      ...(captchaToken ? { captchaToken } : {}),
    }),
    cache: 'no-store',
  });

  const signupSetCookies = getSetCookies(signupResponse.headers);

  let signupBody: unknown;
  try {
    signupBody = await signupResponse.json();
  } catch {
    signupBody = null;
  }

  if (!signupResponse.ok) {
    const message =
      typeof signupBody === 'object' && signupBody && 'message' in signupBody
        ? String((signupBody as { message: unknown }).message)
        : 'Signup failed. Please try again.';
    console.error('[auth/signup] NestJS signup failed:', signupResponse.status, JSON.stringify(signupBody));
    return NextResponse.json({ error: message }, { status: signupResponse.status });
  }

  // The account and auth cookies are already established by the API above.
  // Treat this convenience lookup as best-effort so a web-side DB hiccup
  // (e.g. Neon unreachable from the web runtime) can't fail a successful signup.
  let learnerId: string | null = null;
  try {
    const learner = await findLearnerUserByEmail(email);
    learnerId = learner?.id ?? null;
  } catch (error) {
    console.error('[auth/signup] learner lookup failed (non-fatal):', error);
  }

  const response = NextResponse.json({
    ok: true,
    role: LEARNER_ROLE,
    userId: learnerId,
    email,
  });

  appendAuthCookies(response, [...csrfSetCookies, ...signupSetCookies]);

  return response;
}