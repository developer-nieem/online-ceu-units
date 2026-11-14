import { cookies } from 'next/headers';

import type { ReferralStats } from './referral';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function getReferralStats(): Promise<ReferralStats | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  if (!cookieHeader) return null;

  try {
    const response = await fetch(`${API_URL}/api/referrals/my-stats`, {
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!response.ok) return null;
    return (await response.json()) as ReferralStats;
  } catch {
    return null;
  }
}
