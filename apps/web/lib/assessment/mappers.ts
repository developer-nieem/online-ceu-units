import {
  AssessmentAttemptStatus,
  AssessmentKind,
  QuestionType,
  type Assessment,
  type Question,
} from '@calace/db';

import type {
  AssessmentAttemptSummary,
  CmsAssessment,
  CmsAssessmentKind,
  CmsAssessmentQuestion,
  CmsAssessmentStatus,
  CmsQuestionOption,
  CmsQuestionType,
  LearnerAssessmentView,
} from './types';

export interface AssessmentSettings {
  instructions?: string;
  status?: CmsAssessmentStatus;
}

export function toAssessmentKind(kind: CmsAssessmentKind): AssessmentKind {
  return kind === 'final_exam' ? AssessmentKind.FINAL_EXAM : AssessmentKind.QUIZ;
}

export function fromAssessmentKind(kind: AssessmentKind): CmsAssessmentKind {
  return kind === AssessmentKind.FINAL_EXAM ? 'final_exam' : 'quiz';
}

export function toQuestionType(type: CmsQuestionType): QuestionType {
  return type === 'true_false' ? QuestionType.TRUE_FALSE : QuestionType.SINGLE_CHOICE;
}

export function fromQuestionType(type: QuestionType): CmsQuestionType {
  return type === QuestionType.TRUE_FALSE ? 'true_false' : 'single_choice';
}

export function parseAssessmentSettings(raw: unknown): AssessmentSettings {
  const data = raw as AssessmentSettings;
  return {
    instructions: data?.instructions ?? '',
    status: data?.status ?? 'draft',
  };
}

export function buildAssessmentSettings(input: {
  instructions?: string;
  status: CmsAssessmentStatus;
}): AssessmentSettings {
  return {
    instructions: input.instructions ?? '',
    status: input.status,
  };
}

export function parseQuestionOptions(raw: unknown): CmsQuestionOption[] {
  return Array.isArray(raw) ? (raw as CmsQuestionOption[]) : [];
}

export function parseCorrectAnswer(raw: unknown): CmsAssessmentQuestion['correctAnswer'] {
  if (!raw || typeof raw !== 'object') return undefined;
  return raw as CmsAssessmentQuestion['correctAnswer'];
}

export function mapDbQuestion(row: Question): CmsAssessmentQuestion {
  return {
    id: row.id,
    sortOrder: row.sortOrder,
    type: fromQuestionType(row.type),
    prompt: row.prompt,
    options: parseQuestionOptions(row.options),
    correctAnswer: parseCorrectAnswer(row.correctAnswer),
    explanation: row.explanation ?? undefined,
  };
}

type DbAssessment = Assessment & {
  questions?: Question[];
  lesson?: { slug: string } | null;
};

export function mapDbAssessment(
  row: DbAssessment,
  courseId: string,
): CmsAssessment {
  const settings = parseAssessmentSettings(row.settings);

  return {
    id: row.id,
    courseId,
    courseVersionId: row.courseVersionId ?? undefined,
    lessonId: row.lessonId ?? undefined,
    lessonSlug: row.lesson?.slug,
    slug: row.slug,
    title: row.title,
    kind: fromAssessmentKind(row.kind),
    instructions: settings.instructions,
    passingScorePercent: row.passingScore ? Number(row.passingScore) : 80,
    maxAttempts: row.maxAttempts,
    status: settings.status ?? 'draft',
    questions: (row.questions ?? [])
      .filter((q) => !q.deletedAt)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(mapDbQuestion),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toLearnerAssessmentView(assessment: CmsAssessment): LearnerAssessmentView {
  return {
    id: assessment.id,
    title: assessment.title,
    kind: assessment.kind,
    instructions: assessment.instructions,
    passingScorePercent: assessment.passingScorePercent,
    questions: assessment.questions.map((question) => ({
      id: question.id,
      sortOrder: question.sortOrder,
      type: question.type,
      prompt: question.prompt,
      options: question.options,
    })),
  };
}

export function slugifyAssessment(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function defaultTrueFalseOptions(): CmsQuestionOption[] {
  return [
    { id: 'true', label: 'True' },
    { id: 'false', label: 'False' },
  ];
}

export function fromAttemptStatus(
  status: AssessmentAttemptStatus,
  score: number | null | undefined,
  passingScore: number,
): AssessmentAttemptSummary['status'] {
  if (status === AssessmentAttemptStatus.PASSED) return 'passed';
  if (status === AssessmentAttemptStatus.FAILED) return 'failed';
  if (status === AssessmentAttemptStatus.SUBMITTED || status === AssessmentAttemptStatus.GRADED) {
    return score !== null && score !== undefined && score >= passingScore ? 'passed' : 'failed';
  }
  return 'in_progress';
}

export function attemptPassed(
  status: AssessmentAttemptStatus,
  score: number | null | undefined,
  passingScore: number,
): boolean {
  if (status === AssessmentAttemptStatus.PASSED) return true;
  if (status === AssessmentAttemptStatus.FAILED) return false;
  return score !== null && score !== undefined && score >= passingScore;
}
