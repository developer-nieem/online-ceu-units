import type { LearnerNotificationType, ReminderType } from './types';

/** Future: plug AI copy generation for reminders. */
export interface ReminderCopyProvider {
  generateReminderCopy(params: {
    reminderType: ReminderType;
    courseTitle?: string;
    learnerFirstName?: string;
    daysRemaining?: number;
  }): Promise<{ title: string; body: string }>;
}

export class StaticReminderCopyProvider implements ReminderCopyProvider {
  async generateReminderCopy(params: {
    reminderType: ReminderType;
    courseTitle?: string;
    daysRemaining?: number;
  }): Promise<{ title: string; body: string }> {
    const course = params.courseTitle ?? 'your course';
    switch (params.reminderType) {
      case 'UNFINISHED_COURSE':
        return {
          title: 'Finish your CEU course',
          body: `You have incomplete work in ${course}. Resume your lessons to earn credit.`,
        };
      case 'INACTIVITY':
        return {
          title: 'Return to your learning plan',
          body: `We noticed a pause in ${course}. Your enrollment is still active.`,
        };
      case 'INCOMPLETE_ATTESTATION':
        return {
          title: 'Attestation needed for certificate',
          body: `Complete the learner attestation for ${course} to release your certificate.`,
        };
      case 'CERTIFICATE_READY':
        return {
          title: 'Certificate ready to claim',
          body: `Your requirements for ${course} are complete. Finalize attestation if needed.`,
        };
      case 'EXPIRATION_PLACEHOLDER': {
        const days = params.daysRemaining ?? 30;
        if (days === 90) {
          return {
            title: 'CNA certification expires in 90 days',
            body: 'Your CNA certification expires in 90 days — start your renewal CEUs now',
          };
        }
        if (days === 60) {
          return {
            title: 'CNA certification expires in 60 days',
            body: '60 days until your CNA certification expires — complete your renewal CEUs',
          };
        }
        return {
          title: 'CNA certification expires in 30 days',
          body: '30 days left — your CNA certification expires soon',
        };
      }
      case 'SUBSCRIPTION_RENEWAL_PLACEHOLDER':
        return {
          title: 'Subscription renewal (placeholder)',
          body: 'Subscription renewal reminders are not yet automated.',
        };
      default:
        return { title: 'Reminder', body: 'You have a pending action in your CEU portal.' };
    }
  }
}

/** Future: adaptive scheduling based on engagement score. */
export interface EngagementScoringPlaceholder {
  score(userId: string): Promise<number | null>;
}

export const NOTIFICATION_COOLDOWN_HOURS: Partial<Record<LearnerNotificationType, number>> = {
  COURSE_REMINDER: 48,
  INACTIVITY_REMINDER: 168,
  PARTICIPATION_WARNING: 24,
};
