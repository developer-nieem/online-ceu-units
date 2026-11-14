/**
 * Seed the 10-question final exam for Alcohol Use Disorder in Older Adults.
 * Targets the v1 DRAFT course version created by seed-course-46-alcohol-use-disorder (tenant cal-ace).
 *
 * Run: pnpm --filter @calace/db db:seed-course-46-alcohol-use-disorder-exam
 */
import {
  AssessmentKind,
  CourseVersionStatus,
  PrismaClient,
  QuestionType,
} from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';
const COURSE_SLUG = 'alcohol-use-disorder';

const ALCOHOL_USE_DISORDER_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — Alcohol Use Disorder in Older Adults',
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
      prompt: 'Alcohol use disorder is best understood as:',
      options: [
        { id: 'a', label: 'A moral failing and weakness' },
        { id: 'b', label: 'A treatable medical illness' },
        { id: 'c', label: 'A normal part of aging' },
        { id: 'd', label: 'Simply bad behavior' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Why are alcohol problems often missed in older adults?',
      options: [
        { id: 'a', label: 'They never happen in elders' },
        {
          id: 'b',
          label: 'Drinking is often done alone, and effects look like aging, falls, or dementia',
        },
        { id: 'c', label: 'Elders always talk about it openly' },
        { id: 'd', label: 'They cause obvious public problems' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Why does the same amount of alcohol affect an older adult more?',
      options: [
        { id: 'a', label: "It doesn't" },
        {
          id: 'b',
          label: 'Aging bodies process alcohol less efficiently and are more sensitive to it',
        },
        { id: 'c', label: 'Older adults drink faster' },
        { id: 'd', label: 'Alcohol is stronger for them by choice' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Alcohol is especially dangerous in elders partly because it:',
      options: [
        { id: 'a', label: 'Has no effect on medications' },
        { id: 'b', label: 'Interacts dangerously with many medications they take' },
        { id: 'c', label: 'Improves their balance' },
        { id: 'd', label: 'Prevents falls' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Alcohol withdrawal can begin:',
      options: [
        { id: 'a', label: 'Only after many weeks' },
        {
          id: 'b',
          label: 'Within a day or two of suddenly stopping — such as on admission to a facility',
        },
        { id: 'c', label: 'Never' },
        { id: 'd', label: 'Only in young people' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A resident admitted two days ago has tremors, sweating, agitation, a racing heart, confusion, and hallucinations, and his family says he drank at home. The CNA SHOULD:',
      options: [
        { id: 'a', label: "Assume it's just adjustment to a new place and wait" },
        {
          id: 'b',
          label:
            'Report it to the nurse immediately as possible alcohol withdrawal — a medical emergency',
        },
        { id: 'c', label: 'Try to find him a drink to calm him' },
        { id: 'd', label: 'Leave him alone to settle' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'Severe alcohol withdrawal with confusion, hallucinations, fever, and seizures (delirium tremens) is:',
      options: [
        { id: 'a', label: 'Harmless and self-limiting' },
        { id: 'b', label: 'A life-threatening emergency requiring urgent help' },
        { id: 'c', label: 'Something the CNA should manage alone' },
        { id: 'd', label: 'Normal and expected' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "What is the CNA's role regarding alcohol withdrawal?",
      options: [
        { id: 'a', label: 'Manage and treat it themselves' },
        { id: 'b', label: 'Recognize it and report it immediately — never manage it' },
        { id: 'c', label: 'Find the resident alcohol' },
        { id: 'd', label: 'Ignore it' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A resident recovering from an alcohol problem says she\'s a "weak, terrible person." The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Agree she should have known better' },
        {
          id: 'b',
          label:
            "Respond with warmth and no judgment — it's an illness, not weakness, and recovery is possible",
        },
        { id: 'c', label: 'Lecture her about drinking' },
        { id: 'd', label: 'Avoid her and act uncomfortable' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Which is OUTSIDE the CNA's scope of practice?",
      options: [
        { id: 'a', label: 'Recognizing and reporting withdrawal and interaction signs' },
        { id: 'b', label: 'Supporting the resident without judgment' },
        {
          id: 'c',
          label: 'Diagnosing, counseling, managing withdrawal, or policing the resident\'s drinking',
        },
        { id: 'd', label: 'Watching for falls and excessive sedation' },
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
      slug: ALCOHOL_USE_DISORDER_FINAL_EXAM.slug,
      deletedAt: null,
    },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: ALCOHOL_USE_DISORDER_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: ALCOHOL_USE_DISORDER_FINAL_EXAM.passingScore,
          maxAttempts: ALCOHOL_USE_DISORDER_FINAL_EXAM.maxAttempts,
          settings: ALCOHOL_USE_DISORDER_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: ALCOHOL_USE_DISORDER_FINAL_EXAM.slug,
          title: ALCOHOL_USE_DISORDER_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: ALCOHOL_USE_DISORDER_FINAL_EXAM.passingScore,
          maxAttempts: ALCOHOL_USE_DISORDER_FINAL_EXAM.maxAttempts,
          settings: ALCOHOL_USE_DISORDER_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of ALCOHOL_USE_DISORDER_FINAL_EXAM.questions) {
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
