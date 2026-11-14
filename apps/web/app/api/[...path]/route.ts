import { type NextRequest, NextResponse } from 'next/server';

const API_ORIGIN =
  process.env.INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:3001';

function targetUrl(pathSegments: string[], search: string): string {
  const base = API_ORIGIN.replace(/\/$/, '');
  const path = pathSegments.join('/');
  return `${base}/api/${path}${search}`;
}

async function proxy(request: NextRequest, pathSegments: string[]): Promise<NextResponse> {
  const url = targetUrl(pathSegments, request.nextUrl.search);
  const headers = new Headers(request.headers);
  headers.delete('host');
  // Node fetch auto-decompresses; don't ask Railway to gzip in the first place.
  headers.delete('accept-encoding');
  const cookie = request.headers.get('cookie');
  if (cookie) {
    headers.set('cookie', cookie);
  }

  const hasBody = !['GET', 'HEAD'].includes(request.method);
  try {
    const upstream = await fetch(url, {
      method: request.method,
      headers,
      body: hasBody ? request.body : undefined,
      duplex: hasBody ? 'half' : undefined,
    } as RequestInit);

    const responseHeaders = new Headers(upstream.headers);
    responseHeaders.delete('set-cookie');
    for (const cookie of upstream.headers.getSetCookie()) {
      responseHeaders.append('set-cookie', cookie);
    }
    // Node's fetch auto-decompresses the body, so these upstream headers are now wrong:
    responseHeaders.delete('content-encoding');
    responseHeaders.delete('content-length');
    responseHeaders.delete('transfer-encoding');
    return new NextResponse(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json(
      { message: 'API is temporarily unavailable. Please try again shortly.' },
      { status: 503 },
    );
  }
}

type RouteContext = { params: Promise<{ path: string[] }> };

async function handle(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
