import { apiFetch } from './api';

/** API response from GET /api/notifications */
export type LearnerNotificationDto = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  readAt: string | null;
  archivedAt?: string | null;
};

export type InboxNotification = {
  id: string;
  title: string;
  body: string;
  category: string | null;
  type: string | null;
  actionHref: string | null;
  read: boolean;
  archived: boolean;
  createdAt: string;
  readAt: string | null;
};

export const UNREAD_COUNT_REFRESH_EVENT = 'calace:unread-count-refresh';

export function notifyUnreadCountRefresh() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(UNREAD_COUNT_REFRESH_EVENT));
  }
}

export function mapToInboxNotification(row: LearnerNotificationDto): InboxNotification {
  return {
    id: row.id,
    title: row.title,
    body: row.message,
    category: null,
    type: null,
    actionHref: null,
    read: Boolean(row.readAt),
    archived: Boolean(row.archivedAt),
    createdAt: row.createdAt,
    readAt: row.readAt,
  };
}

export async function getNotifications() {
  return apiFetch<LearnerNotificationDto[]>('/notifications');
}

export type NotificationPreferences = {
  inAppEnabled: boolean;
  emailEnabled: boolean;
  courseRemindersEnabled: boolean;
  certificateNotificationsEnabled: boolean;
  marketingEmailsEnabled: boolean;
};

export type NotificationPreferencesResponse = {
  preferences: NotificationPreferences;
  defaults: NotificationPreferences;
  supportEmail: string;
  storage: 'user.metadata.notificationPreferences';
  updatedAt: string;
};

export async function getUnreadCount() {
  return apiFetch<{ count: number }>('/notifications/unread-count');
}

export async function getNotificationPreferences() {
  return apiFetch<NotificationPreferencesResponse>('/notifications/preferences');
}

export async function updateNotificationPreferences(preferences: NotificationPreferences) {
  return apiFetch<{
    preferences: NotificationPreferences;
    supportEmail: string;
    updatedAt: string;
  }>('/notifications/preferences', {
    method: 'PATCH',
    body: JSON.stringify(preferences),
  });
}

export async function markNotificationRead(id: string) {
  return apiFetch<LearnerNotificationDto>(`/notifications/${id}/read`, {
    method: 'PATCH',
  });
}

export async function archiveNotification(id: string) {
  return apiFetch<LearnerNotificationDto>(`/notifications/${id}/archive`, {
    method: 'PATCH',
  });
}
