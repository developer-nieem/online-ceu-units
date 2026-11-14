import type { CourseMilestoneBadge } from '@calace/db';

export const COURSE_MILESTONE_THRESHOLDS = [3, 6, 9, 12] as const;

export type CourseMilestoneThreshold = (typeof COURSE_MILESTONE_THRESHOLDS)[number];

export const MILESTONE_BADGE_META: Record<
  CourseMilestoneBadge,
  {
    coursesRequired: CourseMilestoneThreshold;
    title: string;
    message: string;
    imagePlaceholder: string;
  }
> = {
  COURSES_3: {
    coursesRequired: 3,
    title: 'Rising Star',
    message: 'You completed your 3rd CEU course — keep the momentum going!',
    imagePlaceholder: '/badges/milestone-3.png',
  },
  COURSES_6: {
    coursesRequired: 6,
    title: 'Dedicated Learner',
    message: 'Six courses down! Your commitment to patient care shines through.',
    imagePlaceholder: '/badges/milestone-6.png',
  },
  COURSES_9: {
    coursesRequired: 9,
    title: 'CEU Champion',
    message: 'Nine courses complete — you are a true continuing education champion!',
    imagePlaceholder: '/badges/milestone-9.png',
  },
  COURSES_12: {
    coursesRequired: 12,
    title: 'Ultimate Achiever',
    message: 'All twelve courses complete — the ultimate CEU milestone is yours!',
    imagePlaceholder: '/badges/milestone-12-ultimate.png',
  },
};

export type EarnedMilestoneBadgePayload = {
  milestone: CourseMilestoneBadge;
  coursesCompleted: number;
  title: string;
  message: string;
  imageSrc: string;
  isUltimate: boolean;
};
