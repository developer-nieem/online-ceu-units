import type { CompletionRoadmapStep, LearningMilestoneDef } from './course-blueprint.types';
import { ONE_HOUR_CNA_CEU_BLUEPRINT, STANDARD_LEARNING_MILESTONES } from './standard-one-hour-blueprint';

export type ResolvedMilestone = LearningMilestoneDef & {
  reached: boolean;
  current: boolean;
};

/** CDPH-aware completion steps shown to learners (exam/attestation gating unchanged). */
export const STANDARD_COMPLETION_ROADMAP: CompletionRoadmapStep[] = [
  {
    id: 'lessons',
    order: 1,
    label: 'Complete all lessons',
    description: 'Finish every section including required interactions and knowledge checks.',
  },
  {
    id: 'participation',
    order: 2,
    label: 'Meet active participation time',
    description: 'Accrue 50 minutes of focused, on-tab participation (CDPH online CE requirement).',
  },
  {
    id: 'final-exam',
    order: 3,
    label: 'Pass the final exam',
    description: '80% passing score · up to 3 attempts · randomized questions from a 10-question bank.',
    routePattern: '/courses/:slug/exam',
  },
  {
    id: 'attestation',
    order: 4,
    label: 'Submit learner attestation',
    description: 'Affirm you personally completed this Online CE hour coursework.',
    routePattern: '/courses/:slug/attestation',
  },
  {
    id: 'certificate',
    order: 5,
    label: 'Access certificate',
    description: 'Download your completion certificate after exam pass and attestation.',
    routePattern: '/courses/:slug/certificate',
  },
  {
    id: 'transcript',
    order: 6,
    label: 'Transcript entry',
    description: 'Your completed hour appears on your CAL ACE transcript for renewal records.',
    routePattern: ONE_HOUR_CNA_CEU_BLUEPRINT.completionFlow.transcriptRoute,
  },
];

export function resolveCompletionRoadmap(
  courseSlug: string,
  steps: CompletionRoadmapStep[] = STANDARD_COMPLETION_ROADMAP,
): (CompletionRoadmapStep & { href?: string })[] {
  return steps.map((step) => ({
    ...step,
    href: step.routePattern?.replace(':slug', courseSlug),
  }));
}

export function resolveLearningMilestones(
  progressPct: number,
  completedLessonSlugs: string[],
  milestones: LearningMilestoneDef[] = STANDARD_LEARNING_MILESTONES,
): ResolvedMilestone[] {
  const completed = new Set(completedLessonSlugs);
  let highestReachedIndex = 0;

  const resolved = milestones.map((m, index) => {
    const lessonDone = m.lessonSlug ? completed.has(m.lessonSlug) : false;
    const progressReached = progressPct >= m.progressPct;
    const reached = lessonDone || progressReached || m.progressPct === 0;
    if (reached) highestReachedIndex = Math.max(highestReachedIndex, index);
    return { ...m, reached, current: false };
  });

  if (resolved[highestReachedIndex]) {
    resolved[highestReachedIndex]!.current = true;
  }

  return resolved;
}

export function encouragementForProgress(progressPct: number): string {
  if (progressPct >= 100) {
    return 'Course requirements complete. Confirm your certificate and transcript in your dashboard.';
  }
  if (progressPct >= 85) {
    return 'You are nearing completion. Finish active participation, then take the final exam and attestation.';
  }
  if (progressPct >= 50) {
    return 'Solid progress. Continue through scenarios and knowledge checks at a steady pace.';
  }
  if (progressPct >= 15) {
    return 'Orientation complete. Focus on core teaching content and CNA scope guidance.';
  }
  return 'Welcome. Complete each section in order and meet interaction requirements before marking lessons complete.';
}

export function moduleCompletionMessage(moduleTitle: string, nextLessonTitle?: string): string {
  if (nextLessonTitle) {
    return `${moduleTitle} section complete. Continue with "${nextLessonTitle}".`;
  }
  return `${moduleTitle} section complete. Review what happens next before the final exam.`;
}
