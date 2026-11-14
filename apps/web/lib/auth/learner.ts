export const LEARNER_ROLE = 'learner';

export const LOGIN_PATH = '/login';
export const SIGNUP_PATH = '/signup';

/** Public certificate verification — never serves full learner credentials. */
export const PUBLIC_VERIFY_PREFIXES = ['/verify', '/verify-certificate', '/certificates/verify'] as const;

/** Routes requiring an authenticated learner (or admin support) session. */
export const LEARNER_PROTECTED_PREFIXES = [
  '/certificates',
  '/transcript',
  '/dashboard',
  '/account',
  '/player',
] as const;

const COURSE_LEARN_PATH = /^\/courses\/[^/]+\/(learn(\/[^/]+(\/quiz\/[^/]+)?)?|exam)\/?$/;

export function isCourseLearnPath(pathname: string): boolean {
  return COURSE_LEARN_PATH.test(pathname);
}

const COURSE_CHECKOUT_PATH = /^\/courses\/[^/]+\/checkout(\/success)?\/?$/;

export function isCourseCheckoutPath(pathname: string): boolean {
  return COURSE_CHECKOUT_PATH.test(pathname);
}

export function isLearnerProtectedPath(pathname: string): boolean {
  if (isPublicVerifyRoute(pathname)) {
    return false;
  }

  if (isCourseLearnPath(pathname) || isCourseCheckoutPath(pathname)) {
    return true;
  }

  return LEARNER_PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isPublicVerifyRoute(pathname: string): boolean {
  return PUBLIC_VERIFY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isPublicAuthPath(pathname: string): boolean {
  return pathname === LOGIN_PATH || pathname === SIGNUP_PATH;
}

/**
 * Same-origin absolute path only. Rejects protocol-relative and backslash
 * open-redirect tricks (e.g. //host, /\host). Does not rewrite hostile input.
 */
function isSafeSameOriginPath(value: string | null | undefined): value is string {
  if (!value) return false;
  // Whitespace / ASCII controls (charCode avoids no-control-regex on \u0000-\u001f)
  if (/\s/.test(value)) return false;
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f) return false;
  }
  // Scheme before any slash (https:, javascript:, etc.)
  const firstSlash = value.indexOf('/');
  const firstColon = value.indexOf(':');
  if (firstColon !== -1 && (firstSlash === -1 || firstColon < firstSlash)) {
    return false;
  }
  if (!value.startsWith('/')) return false;
  // Bare "/" is allowed; otherwise block // and /\ (and /\/ …)
  if (value.length > 1) {
    const second = value[1];
    if (second === '/' || second === '\\') return false;
  }
  return true;
}

export function sanitizeNextPath(next: string | null | undefined): string {
  if (!isSafeSameOriginPath(next)) {
    return '/dashboard';
  }

  let decoded: string;
  try {
    decoded = decodeURIComponent(next);
  } catch {
    return '/dashboard';
  }

  // Validate decoded form too (e.g. /%2F%2Fexample.com → //example.com) but never
  // return the decoded rewrite of a hostile value — reject → fallback.
  if (!isSafeSameOriginPath(decoded)) {
    return '/dashboard';
  }

  if (isPublicAuthPath(decoded) || isPublicVerifyRoute(decoded)) {
    return '/dashboard';
  }

  return next;
}
