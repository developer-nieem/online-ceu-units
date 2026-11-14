import { TYPE_TO_CATEGORY as PKG_MAP } from '@calace/notifications-engine';
import type { LearnerNotificationType, NotificationCategory } from '@calace/db';

export const TYPE_TO_CATEGORY = PKG_MAP as Record<
  LearnerNotificationType,
  NotificationCategory
>;
