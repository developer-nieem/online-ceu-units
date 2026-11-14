import type { LearnerNotificationType } from './types';

export type NotificationCopyInput = {
  courseTitle?: string;
  courseSlug?: string;
  scorePct?: number;
  passed?: boolean;
  certificateNo?: string;
  announcementTitle?: string;
  progressPct?: number;
  daysInactive?: number;
  referralCode?: string;
};

export function notificationCopy(
  type: LearnerNotificationType,
  input: NotificationCopyInput = {},
): { title: string; body: string; actionHref?: string } {
  const course = input.courseTitle ?? 'your course';
  const slug = input.courseSlug;

  switch (type) {
    case 'ENROLLMENT_CONFIRMATION':
      return {
        title: 'Enrollment confirmed',
        body: `You are enrolled in ${course}. Your progress is saved as you complete each lesson.`,
        actionHref: slug ? `/courses/${slug}/learn` : '/courses',
      };
    case 'COURSE_REMINDER':
      return {
        title: 'Continue your CEU course',
        body: `You have unfinished work in ${course}. Pick up where you left off to stay on track for renewal.`,
        actionHref: slug ? `/courses/${slug}/learn` : '/dashboard',
      };
    case 'INACTIVITY_REMINDER':
      return {
        title: 'We saved your place',
        body: input.daysInactive
          ? `It has been ${input.daysInactive} days since your last session in ${course}. Your seat time and lesson progress are preserved.`
          : `Your enrollment in ${course} is still active. A short session today keeps your renewal timeline on track.`,
        actionHref: slug ? `/courses/${slug}/learn` : '/dashboard',
      };
    case 'PARTICIPATION_WARNING':
      return {
        title: 'Active participation required',
        body: `Your ${course} session needs verified active participation time per California CDPH online CE rules. Keep the lesson tab focused while you study.`,
        actionHref: slug ? `/courses/${slug}/learn` : '/compliance',
      };
    case 'EXAM_UNLOCK':
      return {
        title: 'Final exam available',
        body: `You have met the lesson and participation requirements for ${course}. You may now take the final exam when you are ready.`,
        actionHref: slug ? `/courses/${slug}/exam` : '/courses',
      };
    case 'EXAM_RESULT':
      return input.passed
        ? {
            title: 'Final exam passed',
            body: `Congratulations — you passed the final exam for ${course}${input.scorePct != null ? ` (${input.scorePct}%)` : ''}. Complete attestation to release your certificate.`,
            actionHref: slug ? `/courses/${slug}/exam` : '/certificates',
          }
        : {
            title: 'Exam attempt recorded',
            body: `Your recent exam attempt for ${course} did not meet the passing score. Review the rationales and try again when ready.`,
            actionHref: slug ? `/courses/${slug}/exam` : '/courses',
          };
    case 'CERTIFICATE_ISSUED':
      return {
        title: 'Certificate issued',
        body: input.certificateNo
          ? `Your CEU certificate for ${course} is ready (No. ${input.certificateNo}).`
          : `Your CEU certificate for ${course} is ready for download and verification.`,
        actionHref: '/certificates',
      };
    case 'TRANSCRIPT_UPDATE':
      return {
        title: 'Transcript updated',
        body: `Your official transcript reflects completion of ${course}.`,
        actionHref: '/transcript',
      };
    case 'ADMIN_ANNOUNCEMENT':
      return {
        title: input.announcementTitle ?? 'Announcement from CAL ACE',
        body: 'Please review this message from your education provider.',
        actionHref: '/notifications',
      };
    case 'CMS_PUBLISH':
      return {
        title: 'Course content updated',
        body: `${course} has updated published content. Enrolled learners may see revised lessons.`,
        actionHref: slug ? `/courses/${slug}` : '/courses',
      };
    case 'LEARNER_NOTICE':
      return {
        title: 'Message from your provider',
        body: 'You have a new notice regarding your continuing education account.',
        actionHref: '/notifications',
      };
    case 'COURSE_UPDATE':
      return {
        title: 'Course update',
        body: `There is an important update regarding ${course}.`,
        actionHref: slug ? `/courses/${slug}` : '/notifications',
      };
    case 'REFERRAL_USED':
      return {
        title: '🎉 Someone just used your referral code!',
        body: 'Your referral is currently Pending. You\'ll receive your referral reward after your friend completes their first qualifying purchase.',
        actionHref: '/dashboard',
      };
    case 'REFERRAL_CONVERTED':
      return {
        title: '🎉 Your referral completed their first purchase!',
        body: 'Congratulations — your referral has been confirmed and your reward credit has been added to your account.',
        actionHref: '/dashboard',
      };
    case 'COMMUNITY_PLACEHOLDER':
      return {
        title: 'Community (coming soon)',
        body: 'Forum and peer discussion notifications will appear here in a future release.',
        actionHref: '/community',
      };
    case 'COHORT_MESSAGING_PLACEHOLDER':
      return {
        title: 'Cohort messaging (reserved)',
        body: 'Cohort-based messaging is not yet enabled for your account.',
      };
    default:
      return { title: 'Notification', body: 'You have a new update in your learning portal.' };
  }
}

/** Short motivational nudge for dashboard (not a full notification type). */
export function completionNudgeCopy(progressPct: number, courseTitle: string): string {
  if (progressPct >= 90) {
    return `You are almost finished with ${courseTitle}. Complete the final steps to earn your CEU credit.`;
  }
  if (progressPct >= 50) {
    return `Strong progress in ${courseTitle}. Consistent study sessions help you finish before your renewal deadline.`;
  }
  if (progressPct > 0) {
    return `You have started ${courseTitle}. Continue where you left off to build momentum.`;
  }
  return `Begin ${courseTitle} when your schedule allows — your enrollment remains active.`;
}
