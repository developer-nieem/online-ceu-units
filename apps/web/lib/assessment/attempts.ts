import { AssessmentAttemptStatus, prisma } from '@calace/db';

import { getLessonById } from '@/lib/cms/db/lessons-repository';
import { markLessonCompleteForced } from '@/lib/lessons/progress-repository';

import { attemptPassed } from './mappers';
import { getAssessmentById, hasPassedAssessment } from './repository';
import { scoreResponses } from './scoring';
import type { SubmitAttemptInput, SubmitAttemptResult } from './types';

export async function submitAssessmentAttempt(
  input: SubmitAttemptInput,
): Promise<SubmitAttemptResult> {
  const assessment = await getAssessmentById(input.assessmentId, input.courseId);
  if (!assessment || assessment.status !== 'published') {
    throw new Error('Assessment is not available.');
  }

  const lastAttempt = await prisma.assessmentAttempt.findFirst({
    where: { enrollmentId: input.enrollmentId, assessmentId: input.assessmentId },
    orderBy: { attemptNum: 'desc' },
  });

  const attemptNum = (lastAttempt?.attemptNum ?? 0) + 1;

  if (assessment.maxAttempts && attemptNum > assessment.maxAttempts) {
    throw new Error('Maximum attempts reached for this assessment.');
  }

  const { score } = scoreResponses(assessment.questions, input.responses);
  const passed = score >= assessment.passingScorePercent;
  const now = new Date();

  const attempt = await prisma.assessmentAttempt.create({
    data: {
      enrollmentId: input.enrollmentId,
      assessmentId: input.assessmentId,
      userId: input.userId,
      attemptNum,
      status: passed ? AssessmentAttemptStatus.PASSED : AssessmentAttemptStatus.FAILED,
      score,
      responses: input.responses,
      submittedAt: now,
      gradedAt: now,
    },
  });

  let lessonCompleted = false;
  let progressPercent: number | undefined;

  if (passed && assessment.lessonId) {
    const lesson = await getLessonById(assessment.lessonId);
    if (lesson && lesson.completionRule === 'pass_quiz') {
      const lessonAssessments = await prisma.assessment.findMany({
        where: { lessonId: assessment.lessonId, deletedAt: null },
      });

      let allPassed = true;
      for (const row of lessonAssessments) {
        const settings = row.settings as { status?: string };
        if (settings?.status !== 'published') continue;
        const ok = await hasPassedAssessment(input.enrollmentId, row.id);
        if (!ok) {
          allPassed = false;
          break;
        }
      }

      if (allPassed) {
        const result = await markLessonCompleteForced({
          enrollmentId: input.enrollmentId,
          userId: input.userId,
          courseId: input.courseId,
          lesson,
        });
        lessonCompleted = true;
        progressPercent = result.progressPercent;
      }
    }
  }

  return {
    attemptId: attempt.id,
    score,
    passed,
    passingScorePercent: assessment.passingScorePercent,
    lessonCompleted,
    progressPercent,
  };
}

export async function getAttemptSummariesForEnrollment(
  enrollmentId: string,
  assessmentId: string,
) {
  const assessment = await getAssessmentById(assessmentId);
  if (!assessment) return [];

  const rows = await prisma.assessmentAttempt.findMany({
    where: { enrollmentId, assessmentId },
    orderBy: { attemptNum: 'asc' },
  });

  return rows.map((row) => ({
    id: row.id,
    attemptNum: row.attemptNum,
    score: row.score ? Number(row.score) : undefined,
    passed: attemptPassed(row.status, row.score ? Number(row.score) : null, assessment.passingScorePercent),
    submittedAt: row.submittedAt?.toISOString(),
  }));
}
