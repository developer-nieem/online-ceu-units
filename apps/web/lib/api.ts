const CSRF_HEADER = 'x-csrf-token';
const CLIENT_HEADER = 'x-calace-client';
const CSRF_COOKIE = 'calace_csrf';

import { apiUrl } from './api-config';

let csrfToken: string | null = null;

let refreshPromise: Promise<boolean> | null = null;

const isDev = process.env.NODE_ENV === 'development';

function debugLog(message: string, detail?: Record<string, unknown>) {
  if (isDev && typeof console !== 'undefined') {
    console.debug(`[calace-api] ${message}`, detail ?? '');
  }
}

async function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(apiUrl('/auth/refresh'), {
          method: 'POST',
          credentials: 'include',
          headers: { [CLIENT_HEADER]: 'web' },
          cache: 'no-store',
        });
        if (!res.ok) {
          return false;
        }
        const body = (await res.json()) as { csrfToken?: string };
        csrfToken = readCsrfCookie() ?? body.csrfToken ?? csrfToken;
        debugLog('CSRF set from refresh', { tokenLength: csrfToken?.length ?? 0 });
        return true;
      } catch {
        return false;
      } finally {
        setTimeout(() => {
          refreshPromise = null;
        }, 0);
      }
    })();
  }
  return refreshPromise;
}

function isAuthRefreshPath(path: string): boolean {
  const [base = path] = path.split('?');
  return base === '/auth/refresh' || base.endsWith('/auth/refresh');
}

function readCsrfCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = `${CSRF_COOKIE}=`;
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }
  return null;
}

/**
 * Fetches CSRF token + matching cookie from GET /api/auth/csrf.
 * Header must match the cookie the browser will send — not a stale in-memory value.
 */
export async function ensureCsrf(): Promise<string> {
  const fromCookie = readCsrfCookie();
  if (fromCookie) {
    csrfToken = fromCookie;
    return fromCookie;
  }

  const url = apiUrl('/auth/csrf');
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to initialize CSRF token');
  }

  const data = (await response.json()) as { csrfToken: string; header?: string };
  if (!data.csrfToken) {
    throw new Error('CSRF response missing csrfToken');
  }
  csrfToken = readCsrfCookie() ?? data.csrfToken;
  debugLog('CSRF initialized', {
    url,
    header: data.header ?? CSRF_HEADER,
    tokenLength: csrfToken.length,
    fromCookie: Boolean(readCsrfCookie()),
  });
  return csrfToken;
}

export function resetCsrf() {
  csrfToken = null;
}

export type ApiFetchOptions = RequestInit & {
  timeoutMs?: number;
};

function isAbortError(err: unknown): boolean {
  return (
    (err instanceof DOMException && err.name === 'AbortError') ||
    (err instanceof Error && err.name === 'AbortError')
  );
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<{ data?: T; error?: string; status: number }> {
  let retried = false;
  const { timeoutMs, signal: parentSignal, ...requestInit } = options;

  async function executeRequest(): Promise<{ data?: T; error?: string; status: number }> {
    const method = (requestInit.method ?? 'GET').toUpperCase();
    const url = apiUrl(path);

    const headers = new Headers(requestInit.headers);
    headers.set('Content-Type', 'application/json');
    headers.set(CLIENT_HEADER, 'web');

    const controller = timeoutMs ? new AbortController() : null;
    const timer =
      controller && timeoutMs
        ? setTimeout(() => controller.abort(), timeoutMs)
        : undefined;
    if (controller && parentSignal) {
      if (parentSignal.aborted) {
        controller.abort();
      } else {
        parentSignal.addEventListener('abort', () => controller.abort(), { once: true });
      }
    }

    try {
      if (method !== 'GET' && method !== 'HEAD') {
        const token = await ensureCsrf();
        headers.set(CSRF_HEADER, token);
      }

      const response = await fetch(url, {
        method,
        body: requestInit.body,
        credentials: 'include',
        headers,
        cache: requestInit.cache,
        signal: controller?.signal ?? parentSignal ?? undefined,
      });

      debugLog(`${method} ${path}`, {
        url,
        status: response.status,
        hasCsrfHeader: headers.has(CSRF_HEADER),
      });

      let body: unknown;
      try {
        body = await response.json();
      } catch {
        body = undefined;
      }

      if (!response.ok) {
        const message =
          typeof body === 'object' && body && 'message' in body
            ? String((body as { message: string | string[] }).message)
            : 'Request failed';
        return {
          status: response.status,
          error: Array.isArray(message) ? message.join(', ') : message,
        };
      }

      return { status: response.status, data: body as T };
    } catch (err) {
      if (isAbortError(err)) {
        return { status: 0, error: 'The request timed out. Please try again.' };
      }
      const message = err instanceof Error && err.message ? err.message : undefined;
      return { status: 0, error: message || 'Network error. Please try again.' };
    } finally {
      if (timer !== undefined) clearTimeout(timer);
    }
  }

  let result = await executeRequest();

  if (
    result.status === 403 &&
    !retried &&
    typeof result.error === 'string' &&
    result.error.toLowerCase().includes('csrf')
  ) {
    resetCsrf();
    retried = true;
    result = await executeRequest();
  }

  if (
    result.status === 401 &&
    !retried &&
    !isAuthRefreshPath(path)
  ) {
    const refreshed = await refreshSession();
    if (refreshed) {
      retried = true;
      result = await executeRequest();
    }
  }

  return result;
}
