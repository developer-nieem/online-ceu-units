import { cookies } from 'next/headers';

import {
  mapToInboxNotification,
  type InboxNotification,
  type LearnerNotificationDto,
} from './notifications';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function apiGet<T>(path: string): Promise<T | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  if (!cookieHeader) return null;

  try {
    const response = await fetch(`${API_URL}/api${path}`, {
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function getInboxNotifications(): Promise<InboxNotification[]> {
  const rows = await apiGet<LearnerNotificationDto[]>('/notifications');
  if (!rows) return [];
  return rows.map(mapToInboxNotification);
}

export async function getNotificationUnreadCount(): Promise<number> {
  const data = await apiGet<{ count: number }>('/notifications/unread-count');
  return data?.count ?? 0;
}
