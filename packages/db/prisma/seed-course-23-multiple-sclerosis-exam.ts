/**
 * Seed the 10-question final exam for Caring for a Resident with Multiple Sclerosis.
 * Targets the v1 DRAFT course version created by seed-course-23-multiple-sclerosis (tenant cal-ace).
 *
 * Run: pnpm --filter @calace/db db:seed-course-23-multiple-sclerosis-exam
 */
import {
  AssessmentKind,
  CourseVersionStatus,
  PrismaClient,
  QuestionType,
} from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';
const COURSE_SLUG = 'multiple-sclerosis';

const MULTIPLE_SCLEROSIS_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — Caring for a Resident with Multiple Sclerosis',
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
      prompt: 'In multiple sclerosis, the immune system attacks:',
      options: [
        { id: 'a', label: 'The bones and joints' },
        { id: 'b', label: 'The protective coating around nerves in the brain and spinal cord' },
        { id: 'c', label: 'The lungs' },
        { id: 'd', label: 'The skin' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Why is MS called the "snowflake disease"?',
      options: [
        { id: 'a', label: 'It only happens in winter' },
        { id: 'b', label: 'No two people with MS have the same symptoms' },
        { id: 'c', label: 'It is caused by cold weather' },
        { id: 'd', label: 'It always causes the same symptoms' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Bath and shower water for a resident with MS should be:',
      options: [
        { id: 'a', label: 'As hot as possible to relax muscles' },
        { id: 'b', label: 'Lukewarm — heat temporarily worsens MS symptoms' },
        { id: 'c', label: 'Ice cold' },
        { id: 'd', label: 'Whatever temperature is fastest' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'After a warm shower, a resident with MS suddenly has weak legs and blurry vision. The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Insist she stand and walk it off' },
        { id: 'b', label: 'Keep her safely seated, begin cooling her, and call the nurse' },
        { id: 'c', label: 'Lift her alone immediately' },
        { id: 'd', label: 'Leave her alone to recover' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'MS fatigue is best understood as:',
      options: [
        { id: 'a', label: 'Laziness or a bad attitude' },
        {
          id: 'b',
          label: 'A real physical symptom of the disease that worsens with heat and through the day',
        },
        { id: 'c', label: 'Ordinary sleepiness fixed by coffee' },
        { id: 'd', label: 'Something residents imagine' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A resident with MS develops new numbness in a hand never affected before, lasting two days. The CNA SHOULD:',
      options: [
        { id: 'a', label: "Assume it's normal MS ups and downs" },
        { id: 'b', label: 'Report it promptly — it may signal a relapse' },
        { id: 'c', label: 'Wait a week to see if it passes' },
        { id: 'd', label: 'Encourage harder exercise' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Because numbness is common in MS, the CNA SHOULD:',
      options: [
        { id: 'a', label: 'Skip skin checks since residents would feel problems' },
        { id: 'b', label: 'Check skin carefully and always test water temperature' },
        { id: 'c', label: 'Use hotter water so residents can feel it' },
        { id: 'd', label: 'Ignore pressure areas' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'To work with MS fatigue, the CNA SHOULD:',
      options: [
        {
          id: 'a',
          label: "Schedule heavy care during the resident's strongest hours and build in rest",
        },
        { id: 'b', label: 'Push the resident to finish everything quickly' },
        { id: 'c', label: 'Do everything for the resident' },
        { id: 'd', label: 'Schedule all care in the hot afternoon' },
      ],
      correctAnswer: 'a',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Why are infections, like bladder infections, reported promptly in residents with MS?',
      options: [
        { id: 'a', label: 'They never affect MS' },
        { id: 'b', label: 'Infections can flare MS symptoms or trigger a relapse' },
        { id: 'c', label: 'Only the family needs to know' },
        { id: 'd', label: 'They always go away on their own' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Which task is OUTSIDE the CNA's scope of practice?",
      options: [
        { id: 'a', label: 'Keeping a resident with MS cool' },
        { id: 'b', label: 'Reporting new or worsening symptoms' },
        { id: 'c', label: "Adjusting the resident's MS medications" },
        { id: 'd', label: "Supporting the resident's independence" },
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
    where: { courseVersionId: version.id, slug: MULTIPLE_SCLEROSIS_FINAL_EXAM.slug, deletedAt: null },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: MULTIPLE_SCLEROSIS_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: MULTIPLE_SCLEROSIS_FINAL_EXAM.passingScore,
          maxAttempts: MULTIPLE_SCLEROSIS_FINAL_EXAM.maxAttempts,
          settings: MULTIPLE_SCLEROSIS_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: MULTIPLE_SCLEROSIS_FINAL_EXAM.slug,
          title: MULTIPLE_SCLEROSIS_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: MULTIPLE_SCLEROSIS_FINAL_EXAM.passingScore,
          maxAttempts: MULTIPLE_SCLEROSIS_FINAL_EXAM.maxAttempts,
          settings: MULTIPLE_SCLEROSIS_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of MULTIPLE_SCLEROSIS_FINAL_EXAM.questions) {
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
