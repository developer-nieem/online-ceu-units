export const NOTIFICATION_PREFERENCES_METADATA_KEY = 'notificationPreferences';

export const SUPPORT_EMAIL_PLACEHOLDER = 'support@onlineceunits.com';

export type NotificationPreferencesV1 = {
  inAppEnabled: boolean;
  emailEnabled: boolean;
  courseRemindersEnabled: boolean;
  certificateNotificationsEnabled: boolean;
  marketingEmailsEnabled: boolean;
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferencesV1 = {
  inAppEnabled: true,
  emailEnabled: true,
  courseRemindersEnabled: true,
  certificateNotificationsEnabled: true,
  // Promotional/referral email is ON by default with a working unsubscribe
  // (CAN-SPAM opt-out model). Approved by Dr. Cliff 2026-10-09: accounts
  // receive marketing email on creation and can unsubscribe at any time. The
  // unsubscribe link flips this flag to false.
  marketingEmailsEnabled: true,
};

export function parseNotificationPreferences(metadata: unknown): NotificationPreferencesV1 {
  const root = (metadata ?? {}) as Record<string, unknown>;
  const raw = root[NOTIFICATION_PREFERENCES_METADATA_KEY] as Partial<NotificationPreferencesV1> | undefined;
  return {
    inAppEnabled: raw?.inAppEnabled ?? DEFAULT_NOTIFICATION_PREFERENCES.inAppEnabled,
    emailEnabled: raw?.emailEnabled ?? DEFAULT_NOTIFICATION_PREFERENCES.emailEnabled,
    courseRemindersEnabled:
      raw?.courseRemindersEnabled ?? DEFAULT_NOTIFICATION_PREFERENCES.courseRemindersEnabled,
    certificateNotificationsEnabled:
      raw?.certificateNotificationsEnabled ??
      DEFAULT_NOTIFICATION_PREFERENCES.certificateNotificationsEnabled,
    marketingEmailsEnabled:
      raw?.marketingEmailsEnabled ?? DEFAULT_NOTIFICATION_PREFERENCES.marketingEmailsEnabled,
  };
}

export function mergeNotificationPreferences(
  current: NotificationPreferencesV1,
  patch: Partial<NotificationPreferencesV1>,
): NotificationPreferencesV1 {
  return {
    inAppEnabled: patch.inAppEnabled ?? current.inAppEnabled,
    emailEnabled: patch.emailEnabled ?? current.emailEnabled,
    courseRemindersEnabled: patch.courseRemindersEnabled ?? current.courseRemindersEnabled,
    certificateNotificationsEnabled:
      patch.certificateNotificationsEnabled ?? current.certificateNotificationsEnabled,
    marketingEmailsEnabled: patch.marketingEmailsEnabled ?? current.marketingEmailsEnabled,
  };
}
