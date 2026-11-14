import type { CourseGenerationPlan } from './types';

/** Learner/CMS-safe preview — no full block bodies (avoids huge payloads). */
export type CourseGenerationPreview = {
  title: string;
  slug?: string;
  courseCode?: string;
  summary: string;
  overview: string;
  learningObjectives: string[];
  keyTerms: string[];
  lessonOutline: {
    moduleTitle: string;
    moduleSlug: string;
    lessons: { slug: string; title: string; sectionKind: string; estimatedActiveMinutes: number }[];
  }[];
  exam: {
    title: string;
    draftQuestionCount: number;
    targetBankSize: number;
    questionTypes: Record<string, number>;
    samplePrompts: string[];
  };
  pacing: {
    estimatedActiveMinutes: number;
    targetActiveMinutes: number;
    meetsMinimum: boolean;
    warnings: string[];
  };
  safetyReviewCount: number;
  mediaPromptCount: number;
  courseThumbnailPrompt?: string;
  providerId: string;
  promptVersion: string;
  governanceNotice: string;
};

export function buildCourseGenerationPreview(
  plan: CourseGenerationPlan,
  providerId: string,
  governanceNotice: string,
): CourseGenerationPreview {
  const modules = new Map<string, CourseGenerationPreview['lessonOutline'][0]>();
  for (const lesson of plan.lessons) {
    if (!modules.has(lesson.moduleSlug)) {
      modules.set(lesson.moduleSlug, {
        moduleSlug: lesson.moduleSlug,
        moduleTitle: lesson.moduleTitle,
        lessons: [],
      });
    }
    modules.get(lesson.moduleSlug)!.lessons.push({
      slug: lesson.slug,
      title: lesson.title,
      sectionKind: lesson.sectionKind,
      estimatedActiveMinutes: lesson.estimatedActiveMinutes,
    });
  }

  const questionTypes: Record<string, number> = {};
  for (const q of plan.exam.questions) {
    questionTypes[q.type] = (questionTypes[q.type] ?? 0) + 1;
  }

  return {
    title: plan.generation.input.title,
    slug: plan.generation.input.slug,
    courseCode: plan.generation.input.courseCode,
    summary: plan.summary,
    overview: plan.overview,
    learningObjectives: plan.learningObjectives,
    keyTerms: plan.keyTerms,
    lessonOutline: [...modules.values()],
    exam: {
      title: plan.exam.title,
      draftQuestionCount: plan.exam.questions.length,
      targetBankSize: plan.exam.targetBankSize,
      questionTypes,
      samplePrompts: plan.exam.questions.slice(0, 3).map((q) => q.prompt),
    },
    pacing: {
      estimatedActiveMinutes: plan.pacing.estimatedActiveMinutes,
      targetActiveMinutes: plan.pacing.targetActiveMinutes,
      meetsMinimum: plan.pacing.meetsMinimumParticipation,
      warnings: plan.pacing.warnings,
    },
    safetyReviewCount: plan.safetyReview.length,
    mediaPromptCount:
      plan.mediaPrompts.infographicIdeas.length +
      plan.mediaPrompts.miniVideoScripts.length +
      plan.mediaPrompts.imagePrompts.length +
      1,
    courseThumbnailPrompt: plan.mediaPrompts.courseThumbnail.prompt,
    providerId,
    promptVersion: plan.generation.promptVersion,
    governanceNotice,
  };
}
