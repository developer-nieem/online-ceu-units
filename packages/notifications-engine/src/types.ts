/** Learner-facing notification taxonomy (mirrors Prisma LearnerNotificationType). */
export const LEARNER_NOTIFICATION_TYPES = [
  'ENROLLMENT_CONFIRMATION',
  'COURSE_REMINDER',
  'INACTIVITY_REMINDER',
  'PARTICIPATION_WARNING',
  'EXAM_UNLOCK',
  'EXAM_RESULT',
  'CERTIFICATE_ISSUED',
  'TRANSCRIPT_UPDATE',
  'ADMIN_ANNOUNCEMENT',
  'CMS_PUBLISH',
  'COMMUNITY_PLACEHOLDER',
  'LEARNER_NOTICE',
  'COURSE_UPDATE',
  'REFERRAL_USED',
  'REFERRAL_CONVERTED',
  'COHORT_MESSAGING_PLACEHOLDER',
] as const;

export type LearnerNotificationType = (typeof LEARNER_NOTIFICATION_TYPES)[number];

export const NOTIFICATION_CATEGORIES = [
  'COURSE_PROGRESS',
  'COMPLIANCE',
  'ACHIEVEMENT',
  'ANNOUNCEMENT',
  'SYSTEM',
  'RETENTION_PLACEHOLDER',
  'COMMUNITY_PLACEHOLDER',
] as const;

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export const DELIVERY_CHANNELS = ['IN_APP', 'EMAIL', 'SMS', 'PUSH'] as const;
export type DeliveryChannel = (typeof DELIVERY_CHANNELS)[number];

export const REMINDER_TYPES = [
  'UNFINISHED_COURSE',
  'INACTIVITY',
  'INCOMPLETE_ATTESTATION',
  'PARTICIPATION_WARNING',
  'CERTIFICATE_READY',
  'EXPIRATION_PLACEHOLDER',
  'SUBSCRIPTION_RENEWAL_PLACEHOLDER',
] as const;

export type ReminderType = (typeof REMINDER_TYPES)[number];

export type NotificationPreferencePlaceholder = {
  inAppEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  categories: Partial<Record<NotificationCategory, boolean>>;
  quietHoursPlaceholder?: { enabled: boolean; note: string };
  marketingAutomationPlaceholder?: { enabled: boolean; note: string };
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferencePlaceholder = {
  inAppEnabled: true,
  emailEnabled: true,
  smsEnabled: false,
  pushEnabled: false,
  categories: {
    COURSE_PROGRESS: true,
    COMPLIANCE: true,
    ACHIEVEMENT: true,
    ANNOUNCEMENT: true,
    SYSTEM: true,
    RETENTION_PLACEHOLDER: false,
    COMMUNITY_PLACEHOLDER: false,
  },
  quietHoursPlaceholder: {
    enabled: false,
    note: 'Quiet hours scheduling reserved for a future release.',
  },
  marketingAutomationPlaceholder: {
    enabled: false,
    note: 'Marketing automation and loyalty triggers are not enabled.',
  },
};

export type DeliveryRecord = {
  channel: DeliveryChannel;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'SKIPPED';
  at: string;
  placeholder?: boolean;
};

export type NotificationAnalyticsPlaceholder = {
  deliveredAt?: string;
  readAt?: string;
  openedAt?: string | null;
  reminderEffectivenessPlaceholder?: string;
  learnerEngagementScorePlaceholder?: number | null;
};

export type AutomationHooksPlaceholder = {
  aiGeneratedCopy?: boolean;
  adaptiveReminder?: boolean;
  engagementScoring?: boolean;
  marketingAutomation?: boolean;
  loyaltyReferralTriggers?: boolean;
};

export type NotificationPayloadV1 = {
  version: 1;
  courseSlug?: string;
  courseTitle?: string;
  enrollmentId?: string;
  certificateNo?: string;
  announcementId?: string;
  deliveries: DeliveryRecord[];
  analytics: NotificationAnalyticsPlaceholder;
  automationHooks: AutomationHooksPlaceholder;
};

export function buildNotificationPayload(
  partial: Omit<NotificationPayloadV1, 'version' | 'deliveries' | 'analytics' | 'automationHooks'> & {
    deliveries?: DeliveryRecord[];
    analytics?: Partial<NotificationAnalyticsPlaceholder>;
    automationHooks?: Partial<AutomationHooksPlaceholder>;
  },
): NotificationPayloadV1 {
  return {
    version: 1,
    ...partial,
    deliveries: partial.deliveries ?? [],
    analytics: {
      learnerEngagementScorePlaceholder: null,
      reminderEffectivenessPlaceholder: 'Tracking reserved for operational analytics phase.',
      ...partial.analytics,
    },
    automationHooks: {
      aiGeneratedCopy: false,
      adaptiveReminder: false,
      engagementScoring: false,
      marketingAutomation: false,
      loyaltyReferralTriggers: false,
      ...partial.automationHooks,
    },
  };
}

export const TYPE_TO_CATEGORY: Record<LearnerNotificationType, NotificationCategory> = {
  ENROLLMENT_CONFIRMATION: 'COURSE_PROGRESS',
  COURSE_REMINDER: 'COURSE_PROGRESS',
  INACTIVITY_REMINDER: 'RETENTION_PLACEHOLDER',
  PARTICIPATION_WARNING: 'COMPLIANCE',
  EXAM_UNLOCK: 'COURSE_PROGRESS',
  EXAM_RESULT: 'COURSE_PROGRESS',
  CERTIFICATE_ISSUED: 'ACHIEVEMENT',
  TRANSCRIPT_UPDATE: 'ACHIEVEMENT',
  ADMIN_ANNOUNCEMENT: 'ANNOUNCEMENT',
  CMS_PUBLISH: 'SYSTEM',
  COMMUNITY_PLACEHOLDER: 'COMMUNITY_PLACEHOLDER',
  LEARNER_NOTICE: 'ANNOUNCEMENT',
  COURSE_UPDATE: 'COURSE_PROGRESS',
  REFERRAL_USED: 'ACHIEVEMENT',
  REFERRAL_CONVERTED: 'ACHIEVEMENT',
  COHORT_MESSAGING_PLACEHOLDER: 'RETENTION_PLACEHOLDER',
};
