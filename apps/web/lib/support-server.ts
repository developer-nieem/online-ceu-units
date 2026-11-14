import { cookies } from 'next/headers';

import { apiUrl } from './api-config';
import type { LearnerSupportTicket, LearnerSupportTicketList } from './support';

export async function listMySupportTicketsServer(): Promise<
  { ok: true; tickets: LearnerSupportTicket[] } | { ok: false }
> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ');

  if (!cookieHeader) return { ok: false };

  try {
    const response = await fetch(apiUrl('/support/tickets'), {
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!response.ok) return { ok: false };
    const data = (await response.json()) as LearnerSupportTicketList;
    if (!data || !Array.isArray(data.tickets)) return { ok: false };
    return { ok: true, tickets: data.tickets };
  } catch {
    return { ok: false };
  }
}
