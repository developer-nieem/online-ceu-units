import { cookies } from 'next/headers';

import type { AccountProfileResponse } from './account';
import { apiUrl } from './api-config';

export async function getAccountProfileServer(): Promise<AccountProfileResponse | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  if (!cookieHeader) return null;

  try {
    const response = await fetch(apiUrl('/account/profile'), {
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!response.ok) return null;
    return (await response.json()) as AccountProfileResponse;
  } catch {
    return null;
  }
}
