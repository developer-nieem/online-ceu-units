/**
 * Seed the 10-question final exam for Malnutrition & Dehydration in the Elderly.
 * Targets the v1 DRAFT course version created by seed-course-50-malnutrition-elderly (tenant cal-ace).
 *
 * Run: pnpm --filter @calace/db db:seed-course-50-malnutrition-elderly-exam
 */
import {
  AssessmentKind,
  CourseVersionStatus,
  PrismaClient,
  QuestionType,
} from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';
const COURSE_SLUG = 'malnutrition-elderly';

const MALNUTRITION_ELDERLY_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — Malnutrition & Dehydration in the Elderly',
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
      prompt: 'Malnutrition in elders is serious because it causes:',
      options: [
        { id: 'a', label: 'No real problems' },
        {
          id: 'b',
          label: 'Weakness and falls, poor wound healing, pressure injuries, infections, and decline',
        },
        { id: 'c', label: 'Improved strength' },
        { id: 'd', label: 'Better healing' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Why are older adults especially at risk of dehydration?',
      options: [
        { id: 'a', label: 'They drink too much' },
        {
          id: 'b',
          label: 'The sense of thirst weakens with age — they can be dehydrated without feeling thirsty',
        },
        { id: 'c', label: 'Their bodies need no fluid' },
        { id: 'd', label: 'Thirst gets stronger with age' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Because elders may not feel thirst, the CNA should:',
      options: [
        { id: 'a', label: 'Wait until residents ask for drinks' },
        {
          id: 'b',
          label:
            'Offer fluids regularly — at meals, between meals, and during care — and keep water within reach',
        },
        { id: 'c', label: 'Only give fluids at breakfast' },
        { id: 'd', label: 'Restrict fluids to avoid bathroom trips' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A resident ate about 10% of lunch. The CNA should chart:',
      options: [
        { id: 'a', label: '75% so no one asks questions' },
        { id: 'b', label: 'What was actually eaten — about 10% — and report the poor intake' },
        { id: 'c', label: '50% as a compromise' },
        { id: 'd', label: 'Nothing' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Why is inflating intake records so dangerous?',
      options: [
        { id: 'a', label: "It isn't dangerous" },
        {
          id: 'b',
          label:
            'The team acts on the recorded numbers — false numbers hide a poorly-eating resident and delay help',
        },
        { id: 'c', label: 'It saves the nurse time' },
        { id: 'd', label: 'It helps the resident eat more' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Unintended weight loss in a resident is:',
      options: [
        { id: 'a', label: 'Normal and not worth mentioning' },
        { id: 'b', label: 'A key warning sign of malnutrition — weigh carefully and report it' },
        { id: 'c', label: 'Always a good thing' },
        { id: 'd', label: 'Only important in young people' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Good mealtime assistance includes:',
      options: [
        { id: 'a', label: 'Rushing residents to finish quickly' },
        {
          id: 'b',
          label:
            'Proper setup (upright, tray in reach, packages opened, dentures and glasses in) and patient help at the resident\'s pace',
        },
        { id: 'c', label: 'Leaving dependent residents to manage alone' },
        { id: 'd', label: 'Forcing residents to eat' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A normally clear-minded resident becomes newly confused, with dry cracked lips, days of poor drinking, dark scanty urine, and dizziness. The CNA SHOULD:',
      options: [
        { id: 'a', label: "Assume it's new dementia and just watch" },
        {
          id: 'b',
          label:
            'Report it to the nurse promptly — this picture points to dehydration, which is serious and treatable',
        },
        { id: 'c', label: 'Wait a few days' },
        { id: 'd', label: 'Keep it to themselves' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Regarding diet orders (such as pureed food or thickened liquids), the CNA should:',
      options: [
        { id: 'a', label: 'Change them when the resident complains' },
        {
          id: 'b',
          label: 'Follow them exactly — right tray, right texture, right liquids — and never give forbidden items',
        },
        { id: 'c', label: 'Thin the thickened liquids to taste better' },
        { id: 'd', label: 'Ignore them on weekends' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Which is OUTSIDE the CNA's scope of practice?",
      options: [
        { id: 'a', label: 'Assisting with meals and recording intake honestly' },
        { id: 'b', label: 'Taking weights and offering fluids regularly' },
        {
          id: 'c',
          label: 'Diagnosing malnutrition, prescribing or changing diets, or managing feeding tubes',
        },
        { id: 'd', label: 'Reporting poor intake patterns and dehydration signs' },
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
      slug: MALNUTRITION_ELDERLY_FINAL_EXAM.slug,
      deletedAt: null,
    },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: MALNUTRITION_ELDERLY_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: MALNUTRITION_ELDERLY_FINAL_EXAM.passingScore,
          maxAttempts: MALNUTRITION_ELDERLY_FINAL_EXAM.maxAttempts,
          settings: MALNUTRITION_ELDERLY_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: MALNUTRITION_ELDERLY_FINAL_EXAM.slug,
          title: MALNUTRITION_ELDERLY_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: MALNUTRITION_ELDERLY_FINAL_EXAM.passingScore,
          maxAttempts: MALNUTRITION_ELDERLY_FINAL_EXAM.maxAttempts,
          settings: MALNUTRITION_ELDERLY_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of MALNUTRITION_ELDERLY_FINAL_EXAM.questions) {
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
