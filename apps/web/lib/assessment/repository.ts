import { prisma } from '@calace/db';
import type { Prisma } from '@calace/db';

import type {
  AdminAttemptRecord,
  CmsAssessment,
  CmsAssessmentInput,
  CmsAssessmentStatus,
  CmsQuestionInput,
} from './types';
import {
  buildAssessmentSettings,
  mapDbAssessment,
  slugifyAssessment,
  toAssessmentKind,
  toQuestionType,
} from './mappers';

const assessmentInclude = {
  questions: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' as const } },
  lesson: { select: { slug: true } },
} satisfies Prisma.AssessmentInclude;

async function getLatestCourseVersionId(courseId: string): Promise<string> {
  const version = await prisma.courseVersion.findFirst({
    where: { courseId, deletedAt: null },
    orderBy: { versionNumber: 'desc' },
    select: { id: true },
  });
  if (!version) throw new Error(`Course version not found for "${courseId}".`);
  return version.id;
}

function formatLearnerName(firstName: string | null, lastName: string | null, email: string) {
  const name = [firstName, lastName].filter(Boolean).join(' ').trim();
  return name || email;
}

export async function listAssessmentsForCourse(
  courseId: string,
  options: { publishedOnly?: boolean; kind?: 'quiz' | 'final_exam' } = {},
): Promise<CmsAssessment[]> {
  const courseVersionId = await getLatestCourseVersionId(courseId);

  const rows = await prisma.assessment.findMany({
    where: {
      deletedAt: null,
      OR: [{ courseVersionId }, { lesson: { module: { courseVersionId } } }],
      ...(options.kind ? { kind: options.kind === 'final_exam' ? 'FINAL_EXAM' : 'QUIZ' } : {}),
    },
    include: assessmentInclude,
    orderBy: { title: 'asc' },
  });

  return rows
    .map((row) => mapDbAssessment(row, courseId))
    .filter((assessment) => !options.publishedOnly || assessment.status === 'published');
}

export async function listAssessmentsForLesson(
  lessonId: string,
  courseId: string,
  options: { publishedOnly?: boolean } = {},
): Promise<CmsAssessment[]> {
  const rows = await prisma.assessment.findMany({
    where: { lessonId, deletedAt: null },
    include: assessmentInclude,
    orderBy: { title: 'asc' },
  });

  return rows
    .map((row) => mapDbAssessment(row, courseId))
    .filter((assessment) => !options.publishedOnly || assessment.status === 'published');
}

export async function getFinalExamForCourse(
  courseId: string,
  options: { publishedOnly?: boolean } = {},
): Promise<CmsAssessment | undefined> {
  const exams = await listAssessmentsForCourse(courseId, {
    ...options,
    kind: 'final_exam',
  });
  return exams[0];
}

export async function getAssessmentById(
  assessmentId: string,
  courseId?: string,
): Promise<CmsAssessment | undefined> {
  const row = await prisma.assessment.findFirst({
    where: { id: assessmentId, deletedAt: null },
    include: {
      ...assessmentInclude,
      courseVersion: { select: { courseId: true } },
      lesson: {
        select: {
          slug: true,
          module: { select: { courseVersion: { select: { courseId: true } } } },
        },
      },
    },
  });

  if (!row) return undefined;

  const resolvedCourseId =
    courseId ?? row.courseVersion?.courseId ?? row.lesson?.module.courseVersion.courseId;

  if (!resolvedCourseId) return undefined;

  return mapDbAssessment(row, resolvedCourseId);
}

export async function createAssessment(
  courseId: string,
  input: CmsAssessmentInput,
): Promise<CmsAssessment> {
  const courseVersionId = await getLatestCourseVersionId(courseId);
  const slug = (input.slug || slugifyAssessment(input.title)).trim();
  if (!slug) throw new Error('Assessment slug is required.');

  const row = await prisma.assessment.create({
    data: {
      courseVersionId: input.kind === 'final_exam' || !input.lessonId ? courseVersionId : undefined,
      lessonId: input.lessonId,
      slug,
      title: input.title,
      kind: toAssessmentKind(input.kind),
      passingScore: input.passingScorePercent,
      maxAttempts: input.maxAttempts ?? null,
      settings: buildAssessmentSettings({
        instructions: input.instructions,
        status: input.status,
      }) as unknown as Prisma.InputJsonValue,
    },
    include: assessmentInclude,
  });

  return mapDbAssessment(row, courseId);
}

export async function updateAssessment(
  assessmentId: string,
  courseId: string,
  patch: Partial<CmsAssessmentInput>,
): Promise<CmsAssessment> {
  const existing = await getAssessmentById(assessmentId, courseId);
  if (!existing) throw new Error(`Assessment "${assessmentId}" not found.`);

  const merged = { ...existing, ...patch };
  const row = await prisma.assessment.update({
    where: { id: assessmentId },
    data: {
      title: merged.title,
      slug: merged.slug || slugifyAssessment(merged.title),
      kind: toAssessmentKind(merged.kind),
      lessonId: merged.lessonId ?? null,
      passingScore: merged.passingScorePercent,
      maxAttempts: merged.maxAttempts ?? null,
      settings: buildAssessmentSettings({
        instructions: merged.instructions,
        status: merged.status,
      }) as unknown as Prisma.InputJsonValue,
    },
    include: assessmentInclude,
  });

  return mapDbAssessment(row, courseId);
}

export async function setAssessmentStatus(
  assessmentId: string,
  courseId: string,
  status: CmsAssessmentStatus,
): Promise<CmsAssessment> {
  return updateAssessment(assessmentId, courseId, { status });
}

export async function deleteAssessment(assessmentId: string): Promise<void> {
  await prisma.assessment.update({
    where: { id: assessmentId },
    data: { deletedAt: new Date() },
  });
}

export async function createQuestion(
  assessmentId: string,
  input: CmsQuestionInput,
): Promise<CmsAssessment> {
  const assessment = await prisma.assessment.findFirst({
    where: { id: assessmentId, deletedAt: null },
    include: {
      courseVersion: { select: { courseId: true } },
      lesson: { select: { module: { select: { courseVersion: { select: { courseId: true } } } } } },
    },
  });

  if (!assessment) throw new Error('Assessment not found.');

  const courseId =
    assessment.courseVersion?.courseId ?? assessment.lesson?.module.courseVersion.courseId;
  if (!courseId) throw new Error('Course not found for assessment.');

  const maxSort = await prisma.question.aggregate({
    where: { assessmentId, deletedAt: null },
    _max: { sortOrder: true },
  });

  await prisma.question.create({
    data: {
      assessmentId,
      sortOrder: input.sortOrder ?? (maxSort._max.sortOrder ?? 0) + 1,
      type: toQuestionType(input.type),
      prompt: input.prompt,
      options: input.options as unknown as Prisma.InputJsonValue,
      correctAnswer: input.correctAnswer as unknown as Prisma.InputJsonValue,
      explanation: input.explanation,
    },
  });

  const refreshed = await getAssessmentById(assessmentId, courseId);
  if (!refreshed) throw new Error('Assessment not found after question create.');
  return refreshed;
}

export async function updateQuestion(questionId: string, patch: Partial<CmsQuestionInput>): Promise<void> {
  const existing = await prisma.question.findFirst({ where: { id: questionId, deletedAt: null } });
  if (!existing) throw new Error('Question not found.');

  await prisma.question.update({
    where: { id: questionId },
    data: {
      sortOrder: patch.sortOrder ?? existing.sortOrder,
      type: patch.type ? toQuestionType(patch.type) : existing.type,
      prompt: patch.prompt ?? existing.prompt,
      options: (patch.options ?? existing.options) as unknown as Prisma.InputJsonValue,
      correctAnswer: (patch.correctAnswer ?? existing.correctAnswer) as unknown as Prisma.InputJsonValue,
      explanation: patch.explanation ?? existing.explanation,
    },
  });
}

export async function deleteQuestion(questionId: string): Promise<void> {
  await prisma.question.update({
    where: { id: questionId },
    data: { deletedAt: new Date() },
  });
}

export async function listAttemptsForCourse(courseId: string): Promise<AdminAttemptRecord[]> {
  const courseVersionId = await getLatestCourseVersionId(courseId);

  const rows = await prisma.assessmentAttempt.findMany({
    where: { enrollment: { courseVersionId } },
    include: {
      assessment: { select: { title: true, passingScore: true } },
      user: { select: { email: true, firstName: true, lastName: true } },
      enrollment: {
        include: { courseVersion: { include: { course: { select: { title: true } } } } },
      },
    },
    orderBy: { submittedAt: 'desc' },
  });

  return rows.map((row) => {
    const passing = row.assessment.passingScore ? Number(row.assessment.passingScore) : 80;
    const score = row.score ? Number(row.score) : undefined;
    const passed = score !== undefined && score >= passing;

    return {
      id: row.id,
      assessmentId: row.assessmentId,
      assessmentTitle: row.assessment.title,
      attemptNum: row.attemptNum,
      status: passed ? 'passed' : score !== undefined ? 'failed' : 'in_progress',
      score,
      submittedAt: row.submittedAt?.toISOString(),
      passed,
      learnerEmail: row.user.email,
      learnerName: formatLearnerName(row.user.firstName, row.user.lastName, row.user.email),
      courseTitle: row.enrollment.courseVersion.course.title,
    };
  });
}

export async function hasPassedAssessment(
  enrollmentId: string,
  assessmentId: string,
): Promise<boolean> {
  const attempts = await prisma.assessmentAttempt.findMany({
    where: { enrollmentId, assessmentId },
    include: { assessment: { select: { passingScore: true } } },
    orderBy: { attemptNum: 'desc' },
  });

  for (const attempt of attempts) {
    const passing = attempt.assessment.passingScore ? Number(attempt.assessment.passingScore) : 80;
    const score = attempt.score ? Number(attempt.score) : 0;
    if (attempt.status === 'PASSED' || score >= passing) return true;
  }

  return false;
}

export async function getBestAttemptForAssessment(enrollmentId: string, assessmentId: string) {
  return prisma.assessmentAttempt.findFirst({
    where: { enrollmentId, assessmentId },
    orderBy: [{ score: 'desc' }, { attemptNum: 'desc' }],
  });
}
