import {
  type LessonBlockProgress,
  type LessonContentDocument,
  type LegacyLessonContent,
} from '@calace/content-blocks';

import { apiFetch } from './api';
import type { ParticipationComplianceStatus } from './participation';

export type LessonContentType =
  | 'text'
  | 'image'
  | 'infographic'
  | 'video'
  | 'interactive'
  | 'quiz';

export type PlayerLesson = {
  id: string;
  slug: string;
  title: string;
  durationMinutes: number | null;
  videoUrl?: string | null;
  content: LessonContentDocument | LegacyLessonContent;
  contentFormat: 'blocks' | 'legacy';
  blockProgress: LessonBlockProgress | null;
  status: string;
  progressPct: number;
  completedAt: string | null;
};

export type PlayerModule = {
  id: string;
  slug: string;
  title: string;
  lessons: PlayerLesson[];
};

export type LearningMilestone = {
  id: string;
  label: string;
  lessonSlug?: string;
  progressPct: number;
  encouragement: string;
  reached: boolean;
  current: boolean;
};

export type CompletionRoadmapStep = {
  id: string;
  order: number;
  label: string;
  description: string;
  href?: string;
};

export type PlayerLearningExperience = {
  tone: 'professional_healthcare';
  encouragement: string;
  milestones: LearningMilestone[];
  completionRoadmap: CompletionRoadmapStep[];
  examMessaging: Record<string, string> | null;
};

export type PlayerState = {
  course: { slug: string; title: string; ceHours: number; estimatedActiveMinutes?: number };
  participation?: ParticipationComplianceStatus;
  learningExperience?: PlayerLearningExperience;
  enrollment: {
    id: string;
    progressPct: number;
    totalLessons: number;
    completedLessons: number;
    learnerState: string;
    resumeLessonSlug: string | null;
  };
  modules: PlayerModule[];
  currentLesson: {
    id: string;
    slug: string;
    moduleSlug: string;
    moduleTitle: string;
    title: string;
    durationMinutes: number | null;
    content: PlayerLesson['content'];
    status: string;
  } | null;
};

export type BlockProgressResponse = {
  blockProgress: LessonBlockProgress;
  progressPct: number;
  lessonStatus: string;
  canComplete: boolean;
};

export async function fetchPlayerState(courseSlug: string, lessonSlug?: string) {
  const path = lessonSlug
    ? `/player/courses/${courseSlug}/lessons/${lessonSlug}`
    : `/player/courses/${courseSlug}`;
  return apiFetch<PlayerState>(path);
}

export async function recordBlockProgress(params: {
  courseSlug: string;
  lessonSlug: string;
  enrollmentId: string;
  lessonId: string;
  eventType: 'block_viewed' | 'interaction_completed' | 'knowledge_check_answered';
  blockId: string;
  selectedOptionId?: string;
  correct?: boolean;
  reflectionText?: string;
}) {
  return apiFetch<BlockProgressResponse>(
    `/player/courses/${params.courseSlug}/lessons/${params.lessonSlug}/block-progress`,
    {
      method: 'POST',
      body: JSON.stringify({
        enrollmentId: params.enrollmentId,
        lessonId: params.lessonId,
        eventType: params.eventType,
        blockId: params.blockId,
        selectedOptionId: params.selectedOptionId,
        correct: params.correct,
        reflectionText: params.reflectionText,
      }),
    },
  );
}

export async function completeLesson(
  courseSlug: string,
  lessonSlug: string,
  enrollmentId: string,
  lessonId: string,
) {
  return apiFetch(`/player/courses/${courseSlug}/lessons/${lessonSlug}/complete`, {
    method: 'POST',
    body: JSON.stringify({ enrollmentId, lessonId }),
  });
}
