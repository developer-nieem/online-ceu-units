/**
 * Seed the 10-question final exam for Caring for a Resident After a Stroke.
 * Targets the v1 DRAFT course version created by seed-course-15-stroke (tenant cal-ace).
 *
 * Run: pnpm --filter @calace/db db:seed-course-15-stroke-exam
 */
import {
  AssessmentKind,
  CourseVersionStatus,
  PrismaClient,
  QuestionType,
} from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';
const COURSE_SLUG = 'stroke';

const STROKE_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — Caring for a Resident After a Stroke',
  passingScore: 80,
  maxAttempts: 3,
  settings: {
    questionCount: 10,
    randomizeQuestions: true,
    randomizeOptions: true,
    requireAllLessons: true,
    activeParticipationRequired: true,
  },
  questions: [
    {
      sortOrder: 1,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'What does the "F" in FAST stand for?',
      options: [
        { id: 'a', label: 'Fever' },
        { id: 'b', label: 'Face drooping' },
        { id: 'c', label: 'Fatigue' },
        { id: 'd', label: 'Falling' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A CNA notices a resident suddenly has a drooping face and slurred speech. The BEST action is:',
      options: [
        { id: 'a', label: 'Note the time, activate emergency help immediately, and stay with them' },
        { id: 'b', label: 'Give the resident water and watch for an hour' },
        { id: 'c', label: 'Help the resident lie down and recheck later' },
        { id: 'd', label: "Wait for the doctor's scheduled visit" },
      ],
      correctAnswer: 'a',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Why is noting the TIME symptoms started so important in a stroke?',
      options: [
        { id: 'a', label: 'It is required for the daily chart only' },
        { id: 'b', label: 'Treatment must be given within a few hours of the first symptom' },
        { id: 'c', label: 'It tells the family when to visit' },
        { id: 'd', label: 'It has no real importance' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        "A resident's stroke symptoms appeared and then went away within a few minutes. The CNA SHOULD:",
      options: [
        { id: 'a', label: 'Ignore it since it passed' },
        { id: 'b', label: 'Report it to the nurse immediately — it may be a TIA warning' },
        { id: 'c', label: 'Wait to see if it happens again' },
        { id: 'd', label: 'Note it for the next shift' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'When dressing a resident with weakness on one side, the CNA SHOULD:',
      options: [
        { id: 'a', label: 'Dress the strong arm first' },
        { id: 'b', label: 'Dress the weak arm first' },
        { id: 'c', label: 'Let the resident do it alone' },
        { id: 'd', label: 'Avoid dressing them at all' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A resident with dysphagia (swallowing difficulty) should be fed:',
      options: [
        { id: 'a', label: 'Lying flat to relax the throat' },
        { id: 'b', label: 'Quickly to finish the meal' },
        { id: 'c', label: 'Sitting fully upright, with small bites and a slow pace' },
        { id: 'd', label: 'Only thin liquids' },
      ],
      correctAnswer: 'c',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'During a suspected stroke, the CNA should give the resident:',
      options: [
        { id: 'a', label: 'A glass of water to help them' },
        { id: 'b', label: 'Their blood pressure medication' },
        { id: 'c', label: 'Nothing to eat or drink' },
        { id: 'd', label: 'A small snack for energy' },
      ],
      correctAnswer: 'c',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A resident on blood thinners falls and bumps their head. The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Report it to the nurse immediately' },
        { id: 'b', label: 'Wait to see if a bruise appears' },
        { id: 'c', label: 'Note it only if the resident complains' },
        { id: 'd', label: 'Apply ice and say nothing' },
      ],
      correctAnswer: 'a',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A resident with aphasia struggles to find words. The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Finish their sentences quickly to save time' },
        { id: 'b', label: "Speak loudly because they can't understand" },
        { id: 'c', label: 'Be patient, give them time, and use simple yes-or-no questions' },
        { id: 'd', label: 'Avoid talking with them' },
      ],
      correctAnswer: 'c',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Which task is OUTSIDE the CNA's scope of practice?",
      options: [
        { id: 'a', label: 'Recognizing FAST signs and calling for help' },
        { id: 'b', label: 'Supporting the weaker side during transfers' },
        { id: 'c', label: 'Performing speech therapy exercises on their own' },
        { id: 'd', label: 'Feeding safely according to the care plan' },
      ],
      correctAnswer: 'c',
    },
  ],
} as const;

async function main() {
  const tenant = await prisma.tenant.findFirst({
    where: { slug: TENANT_SLUG, deletedAt: null },
    select: { id: true },
  });

  if (!tenant) {
    console.error(`Tenant not found: ${TENANT_SLUG}`);
    process.exit(1);
  }

  const course = await prisma.course.findFirst({
    where: { tenantId: tenant.id, slug: COURSE_SLUG, deletedAt: null },
    select: { id: true, title: true, status: true },
  });

  if (!course) {
    console.error(`Course not found: ${COURSE_SLUG} (tenant ${TENANT_SLUG})`);
    process.exit(1);
  }

  const version = await prisma.courseVersion.findFirst({
    where: {
      courseId: course.id,
      versionNumber: 1,
      status: CourseVersionStatus.DRAFT,
      deletedAt: null,
    },
    select: { id: true, status: true, versionNumber: true },
  });

  if (!version) {
    console.error(`DRAFT course version v1 not found for: ${COURSE_SLUG}`);
    process.exit(1);
  }

  console.log(
    `Course version ID: ${version.id} (v${version.versionNumber}, status: ${version.status})`,
  );
  console.log(`Course status: ${course.status} (unchanged — exam not learner-visible until publish)`);

  const existing = await prisma.assessment.findFirst({
    where: { courseVersionId: version.id, slug: STROKE_FINAL_EXAM.slug, deletedAt: null },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: STROKE_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: STROKE_FINAL_EXAM.passingScore,
          maxAttempts: STROKE_FINAL_EXAM.maxAttempts,
          settings: STROKE_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: STROKE_FINAL_EXAM.slug,
          title: STROKE_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: STROKE_FINAL_EXAM.passingScore,
          maxAttempts: STROKE_FINAL_EXAM.maxAttempts,
          settings: STROKE_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of STROKE_FINAL_EXAM.questions) {
    const existingQ = await prisma.question.findFirst({
      where: { assessmentId: assessment.id, sortOrder: q.sortOrder },
    });

    if (existingQ) {
      await prisma.question.update({
        where: { id: existingQ.id },
        data: {
          type: q.type,
          prompt: q.prompt,
          options: q.options,
          correctAnswer: q.correctAnswer,
          metadata: {},
          deletedAt: null,
        },
      });
    } else {
      await prisma.question.create({
        data: {
          assessmentId: assessment.id,
          sortOrder: q.sortOrder,
          type: q.type,
          prompt: q.prompt,
          options: q.options,
          correctAnswer: q.correctAnswer,
          points: 1,
          metadata: {},
        },
      });
    }

    questionsUpserted += 1;
  }

  console.log(`Success: seeded final exam for "${course.title}" (${COURSE_SLUG}).`);
  console.log(
    `  Assessment: ${assessment.id} (${assessment.slug}, ${assessment.passingScore}% passing, ${questionsUpserted} questions)`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
