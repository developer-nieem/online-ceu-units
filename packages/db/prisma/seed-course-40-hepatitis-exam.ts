/**
 * Seed the 10-question final exam for Caring for a Resident with Hepatitis (A, B & C).
 * Targets the v1 DRAFT course version created by seed-course-40-hepatitis (tenant cal-ace).
 *
 * Run: pnpm --filter @calace/db db:seed-course-40-hepatitis-exam
 */
import {
  AssessmentKind,
  CourseVersionStatus,
  PrismaClient,
  QuestionType,
} from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';
const COURSE_SLUG = 'hepatitis';

const HEPATITIS_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — Caring for a Resident with Hepatitis (A, B & C)',
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
      prompt: 'Hepatitis is:',
      options: [
        { id: 'a', label: 'A heart condition' },
        { id: 'b', label: 'Inflammation of the liver' },
        { id: 'c', label: 'A lung infection' },
        { id: 'd', label: 'A bone disease' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Hepatitis A mainly spreads through:',
      options: [
        {
          id: 'a',
          label: 'The fecal-oral route — contaminated food, water, or unwashed hands',
        },
        { id: 'b', label: 'Casual hugging' },
        { id: 'c', label: 'Breathing the same air' },
        { id: 'd', label: 'Sharing a television' },
      ],
      correctAnswer: 'a',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Hepatitis B and C are:',
      options: [
        { id: 'a', label: 'Spread by casual contact' },
        { id: 'b', label: 'Bloodborne — spread through blood and certain body fluids' },
        { id: 'c', label: 'Not contagious at all' },
        { id: 'd', label: 'Spread only through food' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt: '"Standard precautions" means:',
      options: [
        { id: 'a', label: 'Only protecting against residents with known infections' },
        {
          id: 'b',
          label: 'Treating all blood and body fluids as potentially infectious, with everyone',
        },
        { id: 'c', label: 'Wearing gloves only sometimes' },
        { id: 'd', label: 'Skipping hand hygiene when busy' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'The single most important infection-prevention measure is:',
      options: [
        { id: 'a', label: 'Thorough hand hygiene' },
        { id: 'b', label: 'Talking quietly' },
        { id: 'c', label: 'Keeping the lights low' },
        { id: 'd', label: 'Avoiding all residents' },
      ],
      correctAnswer: 'a',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'To protect themselves from hepatitis B, healthcare workers should:',
      options: [
        { id: 'a', label: 'Avoid all residents' },
        { id: 'b', label: 'Get the hepatitis B vaccine' },
        { id: 'c', label: 'Never wash their hands' },
        { id: 'd', label: 'Recap all needles' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'After a needlestick from a used needle, the CNA SHOULD:',
      options: [
        { id: 'a', label: 'Say nothing to avoid a fuss' },
        {
          id: 'b',
          label: 'Wash the area immediately and report it to the supervisor right away',
        },
        { id: 'c', label: 'Wait until the end of the shift' },
        { id: 'd', label: 'Just apply a bandage' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Jaundice (yellow skin and eyes), dark urine, and pale stools together suggest:',
      options: [
        { id: 'a', label: 'Healthy liver function' },
        { id: 'b', label: 'Liver trouble that should be reported' },
        { id: 'c', label: 'A minor cold' },
        { id: 'd', label: 'Nothing important' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A resident with liver disease becomes newly confused, with a more swollen belly and black tarry stool. The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Let him sleep it off' },
        {
          id: 'b',
          label: 'Report all of it to the nurse promptly — these are serious signs',
        },
        { id: 'c', label: 'Give him a big meal' },
        { id: 'd', label: 'Wait until tomorrow' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Which is the correct attitude toward a resident with hepatitis?',
      options: [
        { id: 'a', label: "Keep your distance — they're contagious through casual contact" },
        {
          id: 'b',
          label:
            "Provide safe, respectful, non-judgmental care; these viruses don't spread casually",
        },
        { id: 'c', label: 'Refuse to care for them' },
        { id: 'd', label: 'Make them feel responsible for their illness' },
      ],
      correctAnswer: 'b',
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
      slug: HEPATITIS_FINAL_EXAM.slug,
      deletedAt: null,
    },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: HEPATITIS_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: HEPATITIS_FINAL_EXAM.passingScore,
          maxAttempts: HEPATITIS_FINAL_EXAM.maxAttempts,
          settings: HEPATITIS_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: HEPATITIS_FINAL_EXAM.slug,
          title: HEPATITIS_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: HEPATITIS_FINAL_EXAM.passingScore,
          maxAttempts: HEPATITIS_FINAL_EXAM.maxAttempts,
          settings: HEPATITIS_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of HEPATITIS_FINAL_EXAM.questions) {
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
