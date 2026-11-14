import { cookies } from 'next/headers';

import type { TranscriptResponse } from './credentials-types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function getTranscript(searchParams?: {
  q?: string;
  renewalPeriodId?: string;
}): Promise<TranscriptResponse | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');
  if (!cookieHeader) return null;

  const qs = new URLSearchParams();
  if (searchParams?.q) qs.set('q', searchParams.q);
  if (searchParams?.renewalPeriodId) qs.set('renewalPeriodId', searchParams.renewalPeriodId);
  const query = qs.toString() ? `?${qs.toString()}` : '';

  try {
    const response = await fetch(`${API_URL}/api/transcript${query}`, {
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!response.ok) return null;
    return (await response.json()) as TranscriptResponse;
  } catch {
    return null;
  }
}
