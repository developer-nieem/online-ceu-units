import { cookies } from 'next/headers';

import type { ProgressSummary } from './progress';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function getProgressSummary(): Promise<ProgressSummary | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  if (!cookieHeader) return null;

  try {
    const response = await fetch(`${API_URL}/api/progress/summary`, {
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!response.ok) return null;
    return (await response.json()) as ProgressSummary;
  } catch {
    return null;
  }
}
