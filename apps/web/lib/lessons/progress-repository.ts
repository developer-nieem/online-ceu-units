import { LessonProgressStatus, prisma } from '@calace/db';

import { hasPassedAssessment, listAssessmentsForLesson } from '@/lib/assessment/repository';
import { listLessonsForCourse } from '@/lib/cms/db/lessons-repository';
import type { CmsLesson } from '@/lib/cms/types';
import { updateEnrollmentProgress } from '@/lib/enrollment/repository';

export interface LessonProgressRecord {
  lessonId: string;
  lessonSlug: string;
  status: 'not_started' | 'in_progress' | 'completed';
  completedAt?: string;
}
export function canMarkLessonCompleteSync(lesson: CmsLesson): boolean {
  if (lesson.requiredForCompletion === false) {
    return false;
  }
  if (lesson.completionRule === 'pass_quiz') {
    return false;
  }
  return true;
}

export async function canMarkLessonComplete(
  lesson: CmsLesson,
  enrollmentId?: string,
): Promise<boolean> {
  if (lesson.requiredForCompletion === false) {
    return false;
  }

  if (lesson.completionRule === 'pass_quiz') {
    if (!enrollmentId) return false;

    const assessments = await listAssessmentsForLesson(lesson.id, lesson.courseId ?? '', {
      publishedOnly: true,
    });

    if (assessments.length > 0) {
      for (const assessment of assessments) {
        if (!(await hasPassedAssessment(enrollmentId, assessment.id))) {
          return false;
        }
      }
      return false;
    }

    if (lesson.quizBlocks.length > 0) return false;
  }

  return true;
}

export async function listLessonProgressForEnrollment(
  enrollmentId: string,
): Promise<LessonProgressRecord[]> {
  const rows = await prisma.lessonProgress.findMany({
    where: { enrollmentId },
    include: {
      lesson: { select: { slug: true } },
    },
  });

  return rows.map((row) => ({
    lessonId: row.lessonId,
    lessonSlug: row.lesson.slug,
    status:
      row.status === LessonProgressStatus.COMPLETED
        ? 'completed'
        : row.status === LessonProgressStatus.IN_PROGRESS
          ? 'in_progress'
          : 'not_started',
    completedAt: row.completedAt?.toISOString(),
  }));
}

export async function getLessonProgressMap(
  enrollmentId: string,
): Promise<Map<string, LessonProgressRecord>> {
  const records = await listLessonProgressForEnrollment(enrollmentId);
  return new Map(records.map((record) => [record.lessonId, record]));
}

async function recalculateEnrollmentProgress(
  enrollmentId: string,
  userId: string,
  courseId: string,
): Promise<number> {
  const lessons = await listLessonsForCourse(courseId, { publishedOnly: true });
  const requiredLessons = lessons.filter((lesson) => lesson.requiredForCompletion !== false);

  if (requiredLessons.length === 0) {
    return 0;
  }

  const completed = await prisma.lessonProgress.count({
    where: {
      enrollmentId,
      userId,
      status: LessonProgressStatus.COMPLETED,
      lessonId: { in: requiredLessons.map((lesson) => lesson.id) },
    },
  });

  return Math.round((completed / requiredLessons.length) * 100);
}

export async function markLessonComplete(input: {
  enrollmentId: string;
  userId: string;
  courseId: string;
  lesson: CmsLesson;
}): Promise<{ progressPercent: number; completed: boolean }> {
  if (!(await canMarkLessonComplete(input.lesson, input.enrollmentId))) {
    throw new Error('This lesson requires a quiz or assessment before it can be marked complete.');
  }

  return markLessonCompleteForced(input);
}

export async function markLessonCompleteForced(input: {
  enrollmentId: string;
  userId: string;
  courseId: string;
  lesson: CmsLesson;
}): Promise<{ progressPercent: number; completed: boolean }> {
  const now = new Date();

  await prisma.lessonProgress.upsert({    where: {
      enrollmentId_lessonId: {
        enrollmentId: input.enrollmentId,
        lessonId: input.lesson.id,
      },
    },
    create: {
      enrollmentId: input.enrollmentId,
      lessonId: input.lesson.id,
      userId: input.userId,
      status: LessonProgressStatus.COMPLETED,
      progressPct: 100,
      startedAt: now,
      completedAt: now,
    },
    update: {
      status: LessonProgressStatus.COMPLETED,
      progressPct: 100,
      completedAt: now,
    },
  });

  const progressPercent = await recalculateEnrollmentProgress(
    input.enrollmentId,
    input.userId,
    input.courseId,
  );

  await updateEnrollmentProgress(input.enrollmentId, progressPercent);

  return { progressPercent, completed: true };
}

export async function markLessonStarted(input: {
  enrollmentId: string;
  userId: string;
  lessonId: string;
}): Promise<void> {
  const now = new Date();

  await prisma.lessonProgress.upsert({
    where: {
      enrollmentId_lessonId: {
        enrollmentId: input.enrollmentId,
        lessonId: input.lessonId,
      },
    },
    create: {
      enrollmentId: input.enrollmentId,
      lessonId: input.lessonId,
      userId: input.userId,
      status: LessonProgressStatus.IN_PROGRESS,
      progressPct: 0,
      startedAt: now,
    },
    update: {
      status: LessonProgressStatus.IN_PROGRESS,
      startedAt: now,
    },
  });
}
