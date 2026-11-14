export type CourseMilestoneBadge =
  | 'COURSES_3'
  | 'COURSES_6'
  | 'COURSES_9'
  | 'COURSES_12';

export type EarnedMilestoneBadgePayload = {
  milestone: CourseMilestoneBadge;
  coursesCompleted: number;
  title: string;
  message: string;
  imageSrc: string;
  isUltimate: boolean;
};

export const MILESTONE_BADGE_CELEBRATION_EVENT = 'calace:milestone-badge-earned';

export function showMilestoneBadgeCelebration(badge: EarnedMilestoneBadgePayload) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<EarnedMilestoneBadgePayload>(MILESTONE_BADGE_CELEBRATION_EVENT, {
      detail: badge,
    }),
  );
}
