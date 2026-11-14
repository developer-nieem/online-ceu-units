import { cookies } from 'next/headers';

import { normalizeComplianceSummary } from './compliance-normalize';
import type { ComplianceSummary } from './credentials-types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function getComplianceSummary(): Promise<ComplianceSummary | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');
  if (!cookieHeader) return null;

  try {
    const response = await fetch(`${API_URL}/api/compliance/summary`, {
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!response.ok) return null;
    return normalizeComplianceSummary((await response.json()) as ComplianceSummary);
  } catch {
    return null;
  }
}
