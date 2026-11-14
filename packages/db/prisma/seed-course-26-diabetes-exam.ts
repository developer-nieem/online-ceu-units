/**
 * Seed the 10-question final exam for Caring for a Resident with Diabetes (Type 1 & Type 2).
 * Targets the v1 DRAFT course version created by seed-course-26-diabetes (tenant cal-ace).
 *
 * Run: pnpm --filter @calace/db db:seed-course-26-diabetes-exam
 */
import {
  AssessmentKind,
  CourseVersionStatus,
  PrismaClient,
  QuestionType,
} from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';
const COURSE_SLUG = 'diabetes';

const DIABETES_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — Caring for a Resident with Diabetes (Type 1 & Type 2)',
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
      prompt: 'Diabetes is best described as:',
      options: [
        { id: 'a', label: 'A problem controlling blood sugar (glucose)' },
        { id: 'b', label: 'A type of lung infection' },
        { id: 'c', label: 'A heart rhythm problem' },
        { id: 'd', label: 'A skin disease' },
      ],
      correctAnswer: 'a',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Which signs suggest LOW blood sugar (hypoglycemia)?',
      options: [
        { id: 'a', label: 'Thirst and frequent urination' },
        { id: 'b', label: 'Shakiness, sweating, cold and clammy skin, and confusion' },
        { id: 'c', label: 'Hot, dry, flushed skin' },
        { id: 'd', label: 'No symptoms at all' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A conscious resident with diabetes who can swallow shows signs of low blood sugar. The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Give insulin' },
        {
          id: 'b',
          label: 'Give a fast-acting sugar per facility policy and alert the nurse immediately',
        },
        { id: 'c', label: 'Wait and see if it passes' },
        { id: 'd', label: 'Have them lie down to nap' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A resident with diabetes is barely responsive and cannot swallow safely. The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Pour juice into their mouth' },
        { id: 'b', label: 'Give nothing by mouth and activate emergency help immediately' },
        { id: 'c', label: 'Give them insulin' },
        { id: 'd', label: 'Let them sleep it off' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Which signs suggest HIGH blood sugar (hyperglycemia)?',
      options: [
        { id: 'a', label: 'Cold, clammy, shaky' },
        { id: 'b', label: 'Extreme thirst, frequent urination, fatigue, hot and dry skin' },
        { id: 'c', label: 'Sudden hunger and sweating' },
        { id: 'd', label: 'No symptoms ever' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A resident received insulin but then refused to eat lunch. The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Ignore it' },
        { id: 'b', label: 'Report it to the nurse immediately and watch for low blood sugar' },
        { id: 'c', label: 'Give the resident more insulin' },
        { id: 'd', label: 'Wait until dinner' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Why is daily foot care so important for residents with diabetes?',
      options: [
        { id: 'a', label: 'It only matters for appearance' },
        {
          id: 'b',
          label: 'Diabetes reduces foot sensation and healing, so small sores can become serious',
        },
        { id: 'c', label: 'It is not actually important' },
        { id: 'd', label: 'Feet are never affected by diabetes' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Which is a correct part of diabetic foot care?',
      options: [
        { id: 'a', label: 'Letting the resident walk barefoot' },
        {
          id: 'b',
          label: 'Inspecting feet daily and keeping them clean and dry, especially between the toes',
        },
        { id: 'c', label: 'Ignoring small blisters' },
        { id: 'd', label: 'Using very hot water on the feet' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A resident with diabetes suddenly becomes confused and "not themselves." The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Assume it\'s just a bad mood' },
        { id: 'b', label: 'Think about blood sugar and report it immediately for a check' },
        { id: 'c', label: 'Wait until the next shift' },
        { id: 'd', label: 'Give them insulin' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Which task is OUTSIDE the CNA's scope of practice?",
      options: [
        { id: 'a', label: 'Making sure a resident eats after insulin' },
        { id: 'b', label: 'Inspecting a resident\'s feet' },
        { id: 'c', label: 'Giving or adjusting insulin or diabetes medication' },
        { id: 'd', label: 'Reporting signs of low or high blood sugar' },
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
    where: {
      courseVersionId: version.id,
      slug: DIABETES_FINAL_EXAM.slug,
      deletedAt: null,
    },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: DIABETES_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: DIABETES_FINAL_EXAM.passingScore,
          maxAttempts: DIABETES_FINAL_EXAM.maxAttempts,
          settings: DIABETES_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: DIABETES_FINAL_EXAM.slug,
          title: DIABETES_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: DIABETES_FINAL_EXAM.passingScore,
          maxAttempts: DIABETES_FINAL_EXAM.maxAttempts,
          settings: DIABETES_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of DIABETES_FINAL_EXAM.questions) {
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
