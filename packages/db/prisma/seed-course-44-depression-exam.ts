/**
 * Seed the 10-question final exam for Recognizing & Supporting Depression in Older Adults.
 * Targets the v1 DRAFT course version created by seed-course-44-depression (tenant cal-ace).
 *
 * Run: pnpm --filter @calace/db db:seed-course-44-depression-exam
 */
import {
  AssessmentKind,
  CourseVersionStatus,
  PrismaClient,
  QuestionType,
} from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';
const COURSE_SLUG = 'depression';

const DEPRESSION_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — Recognizing & Supporting Depression in Older Adults',
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
      prompt: 'Depression in older adults is:',
      options: [
        { id: 'a', label: 'A normal, expected part of aging' },
        {
          id: 'b',
          label: 'A common, serious, and treatable medical illness — not normal aging',
        },
        { id: 'c', label: 'A sign of weakness' },
        { id: 'd', label: 'Something to simply "get over"' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Why is the belief that "depression is just part of getting old" so harmful?',
      options: [
        { id: 'a', label: "It isn't harmful" },
        { id: 'b', label: 'It leads to treatable illness being dismissed and left untreated' },
        { id: 'c', label: 'It makes residents happier' },
        { id: 'd', label: 'It speeds up treatment' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'In older adults, depression often hides behind:',
      options: [
        { id: 'a', label: 'Obvious constant crying only' },
        {
          id: 'b',
          label: 'Physical complaints, withdrawal, not eating, irritability, and confusion',
        },
        { id: 'c', label: 'Increased energy and joy' },
        { id: 'd', label: "Nothing — it's always obvious" },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'When depression causes confusion and memory problems that mimic dementia but improve with treatment, this is called:',
      options: [
        { id: 'a', label: 'Normal aging' },
        { id: 'b', label: 'Pseudodementia' },
        { id: 'c', label: 'A stroke' },
        { id: 'd', label: 'Permanent dementia' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A resident says, "Everyone would be better off without me — I don\'t see the point in going on." The CNA SHOULD:',
      options: [
        { id: 'a', label: "Reassure them they're fine and move on" },
        {
          id: 'b',
          label: 'Take it seriously, stay with them, and report it to the nurse immediately',
        },
        { id: 'c', label: 'Tell them not to talk like that and leave' },
        { id: 'd', label: 'Ignore it as "just talk"' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'If a resident shares thoughts of wanting to die and asks you to keep it secret, the CNA SHOULD:',
      options: [
        { id: 'a', label: 'Promise to keep it secret' },
        {
          id: 'b',
          label: 'Not promise secrecy — report it immediately, because safety comes first',
        },
        { id: 'c', label: 'Keep it secret if they seem to mean it' },
        { id: 'd', label: 'Wait a day before deciding' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'When a resident shows a suicide-warning sign, the CNA should NEVER:',
      options: [
        { id: 'a', label: 'Take it seriously' },
        { id: 'b', label: 'Stay with the resident' },
        { id: 'c', label: 'Leave the resident alone' },
        { id: 'd', label: 'Report it immediately' },
      ],
      correctAnswer: 'c',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'What is one of the most powerful things a CNA provides to a depressed resident?',
      options: [
        { id: 'a', label: 'Isolation' },
        { id: 'b', label: 'Genuine human connection and engagement' },
        { id: 'c', label: 'Frustration' },
        { id: 'd', label: 'Being told to "cheer up"' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A normally social resident has withdrawn, stopped eating, complains of vague aches, and seems newly confused. The CNA SHOULD:',
      options: [
        { id: 'a', label: "Assume it's just aging and dementia" },
        {
          id: 'b',
          label: 'Report the cluster of changes to the nurse — it could be treatable depression',
        },
        { id: 'c', label: 'Tell her to cheer up and eat more' },
        { id: 'd', label: 'Wait several months' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Which task is OUTSIDE the CNA's scope of practice?",
      options: [
        { id: 'a', label: 'Recognizing and reporting signs of depression' },
        { id: 'b', label: 'Providing connection and supporting the resident' },
        {
          id: 'c',
          label: 'Diagnosing depression, providing therapy, or adjusting medications',
        },
        {
          id: 'd',
          label: 'Responding to suicide-warning signs by staying and reporting',
        },
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
      slug: DEPRESSION_FINAL_EXAM.slug,
      deletedAt: null,
    },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: DEPRESSION_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: DEPRESSION_FINAL_EXAM.passingScore,
          maxAttempts: DEPRESSION_FINAL_EXAM.maxAttempts,
          settings: DEPRESSION_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: DEPRESSION_FINAL_EXAM.slug,
          title: DEPRESSION_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: DEPRESSION_FINAL_EXAM.passingScore,
          maxAttempts: DEPRESSION_FINAL_EXAM.maxAttempts,
          settings: DEPRESSION_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of DEPRESSION_FINAL_EXAM.questions) {
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
