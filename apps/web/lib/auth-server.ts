import { cookies } from 'next/headers';

import type { SessionResponse } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function getServerSession(): Promise<{
  data?: SessionResponse;
  error?: string;
  status: number;
}> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ');

  if (!cookieHeader) {
    return { status: 401, error: 'Not authenticated' };
  }

  try {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    });

    if (!response.ok) {
      return { status: response.status, error: 'Not authenticated' };
    }

    const data = (await response.json()) as SessionResponse;
    return { status: response.status, data };
  } catch {
    return { status: 503, error: 'API unavailable' };
  }
}
