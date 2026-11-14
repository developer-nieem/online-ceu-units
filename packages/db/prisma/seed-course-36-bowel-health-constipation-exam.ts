/**
 * Seed the 10-question final exam for Bowel Health & Constipation Care.
 * Targets the v1 DRAFT course version created by seed-course-36-bowel-health-constipation (tenant cal-ace).
 *
 * Run: pnpm --filter @calace/db db:seed-course-36-bowel-health-constipation-exam
 */
import {
  AssessmentKind,
  CourseVersionStatus,
  PrismaClient,
  QuestionType,
} from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';
const COURSE_SLUG = 'bowel-health-constipation';

const BOWEL_HEALTH_CONSTIPATION_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — Bowel Health & Constipation Care',
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
      prompt: 'A "normal" bowel pattern is best understood as:',
      options: [
        { id: 'a', label: 'Exactly once per day for everyone' },
        {
          id: 'b',
          label: 'Different for each person — what matters is their usual pattern and changes from it',
        },
        { id: 'c', label: 'Three times a day for everyone' },
        { id: 'd', label: 'Once a week for everyone' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Constipation in an older adult can show up as:',
      options: [
        { id: 'a', label: 'Only belly pain' },
        {
          id: 'b',
          label: 'New confusion, agitation, or loss of appetite, as well as belly symptoms',
        },
        { id: 'c', label: 'Improved mood' },
        { id: 'd', label: 'No effect at all' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Which is part of the daily foundation for healthy bowels?',
      options: [
        { id: 'a', label: 'Bed rest and low fluids' },
        {
          id: 'b',
          label: 'Adequate fiber and fluids, movement, and a regular toileting routine',
        },
        { id: 'c', label: 'Skipping meals' },
        { id: 'd', label: 'Ignoring the urge to go' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Why is an accurate bowel record so important?',
      options: [
        { id: 'a', label: "It isn't important" },
        { id: 'b', label: 'It catches constipation early, before it becomes impaction' },
        { id: 'c', label: 'It replaces fluids and fiber' },
        { id: 'd', label: 'It is only for billing' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A resident constipated for 5 days, with belly discomfort, now has frequent small watery stool leaks. This is likely:',
      options: [
        { id: 'a', label: 'Simple diarrhea to be stopped with medication' },
        { id: 'b', label: 'Overflow around a fecal impaction — report it' },
        { id: 'c', label: 'A sign the constipation is cured' },
        { id: 'd', label: 'Nothing to worry about' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Removing a fecal impaction manually is:',
      options: [
        { id: 'a', label: "Part of the CNA's routine duties" },
        { id: 'b', label: 'A nurse procedure — never performed by a CNA' },
        { id: 'c', label: 'Done by the resident' },
        { id: 'd', label: 'Not necessary ever' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A constipated resident has severe worsening belly pain, a swollen hard belly, vomiting, and is passing no stool or gas. The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Give a laxative and wait' },
        {
          id: 'b',
          label: 'Recognize a possible bowel obstruction and get emergency help immediately',
        },
        { id: 'c', label: 'Encourage a big meal' },
        { id: 'd', label: 'Wait until the next shift' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Which residents are at especially high risk for constipation?',
      options: [
        { id: 'a', label: 'Only very young people' },
        {
          id: 'b',
          label: 'Those on opioid pain medications and those with limited mobility',
        },
        { id: 'c', label: 'No one in particular' },
        { id: 'd', label: 'Only residents who exercise' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'When helping a resident with toileting, the CNA SHOULD:',
      options: [
        { id: 'a', label: 'Rush them and skip privacy' },
        {
          id: 'b',
          label: 'Provide privacy, an unhurried pace, and prompt help when they feel the urge',
        },
        { id: 'c', label: 'Make them hold it longer' },
        { id: 'd', label: 'Comment on the results loudly' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Which task is OUTSIDE the CNA's scope of practice?",
      options: [
        { id: 'a', label: 'Encouraging fiber, fluids, and movement' },
        { id: 'b', label: 'Keeping an honest bowel record' },
        { id: 'c', label: 'Deciding on and giving laxatives' },
        { id: 'd', label: 'Reporting a possible impaction or obstruction' },
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
      slug: BOWEL_HEALTH_CONSTIPATION_FINAL_EXAM.slug,
      deletedAt: null,
    },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: BOWEL_HEALTH_CONSTIPATION_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: BOWEL_HEALTH_CONSTIPATION_FINAL_EXAM.passingScore,
          maxAttempts: BOWEL_HEALTH_CONSTIPATION_FINAL_EXAM.maxAttempts,
          settings: BOWEL_HEALTH_CONSTIPATION_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: BOWEL_HEALTH_CONSTIPATION_FINAL_EXAM.slug,
          title: BOWEL_HEALTH_CONSTIPATION_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: BOWEL_HEALTH_CONSTIPATION_FINAL_EXAM.passingScore,
          maxAttempts: BOWEL_HEALTH_CONSTIPATION_FINAL_EXAM.maxAttempts,
          settings: BOWEL_HEALTH_CONSTIPATION_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of BOWEL_HEALTH_CONSTIPATION_FINAL_EXAM.questions) {
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
