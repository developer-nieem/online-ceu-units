/**
 * Seed the 10-question final exam for Caring for a Resident with HIV / AIDS.
 * Targets the v1 DRAFT course version created by seed-course-41-hiv-aids (tenant cal-ace).
 *
 * Run: pnpm --filter @calace/db db:seed-course-41-hiv-aids-exam
 */
import {
  AssessmentKind,
  CourseVersionStatus,
  PrismaClient,
  QuestionType,
} from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';
const COURSE_SLUG = 'hiv-aids';

const HIV_AIDS_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — Caring for a Resident with HIV / AIDS',
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
      prompt: 'HIV is a virus that attacks the:',
      options: [
        { id: 'a', label: 'Liver' },
        { id: 'b', label: 'Immune system' },
        { id: 'c', label: 'Lungs' },
        { id: 'd', label: 'Bones' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'With modern treatment, HIV today is best described as:',
      options: [
        { id: 'a', label: 'A quickly fatal disease' },
        { id: 'b', label: 'A manageable chronic condition with near-normal life expectancy' },
        { id: 'c', label: 'Untreatable' },
        { id: 'd', label: 'Spread by casual contact' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt: '"Undetectable = Untransmittable" (U=U) means:',
      options: [
        { id: 'a', label: 'The virus is fully cured' },
        {
          id: 'b',
          label: 'A person with an undetectable viral load cannot transmit HIV sexually',
        },
        { id: 'c', label: 'The person no longer needs medication' },
        { id: 'd', label: 'HIV spreads more easily' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'HIV is NOT spread by:',
      options: [
        { id: 'a', label: 'Blood-to-blood contact' },
        {
          id: 'b',
          label: 'Casual contact like hugging, sharing dishes, or caregiving closeness',
        },
        { id: 'c', label: 'Needlesticks' },
        { id: 'd', label: 'Sexual contact' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'What protects a CNA caring for a resident with HIV?',
      options: [
        { id: 'a', label: 'Avoiding the resident' },
        { id: 'b', label: 'The standard precautions used with every resident' },
        { id: 'c', label: 'Wearing extra gloves for everything' },
        { id: 'd', label: 'Refusing care' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Why is daily medication adherence so important in HIV?',
      options: [
        { id: 'a', label: "It isn't important" },
        {
          id: 'b',
          label: 'Consistent ART keeps the virus suppressed and the immune system healthy',
        },
        { id: 'c', label: 'It only matters occasionally' },
        { id: 'd', label: 'Missing doses has no effect' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A resident with poorly controlled HIV develops a persistent cough, fever, night sweats, and mouth patches. The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Wait and see if it clears like a cold' },
        {
          id: 'b',
          label:
            'Report these signs to the nurse promptly — infections turn serious fast with weakened immunity',
        },
        { id: 'c', label: 'Give over-the-counter cold medicine' },
        { id: 'd', label: "Assume it's nothing" },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A visitor asks you to confirm whether a resident has HIV. The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Confirm it so they can stay safe' },
        {
          id: 'b',
          label:
            "Protect confidentiality — don't confirm or discuss it — and note generally that HIV isn't spread casually",
        },
        { id: 'c', label: 'Tell everyone to avoid the resident' },
        { id: 'd', label: 'Discuss it with other residents' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'After a blood exposure (like a needlestick) from any resident, the CNA SHOULD:',
      options: [
        { id: 'a', label: 'Wait and watch' },
        {
          id: 'b',
          label:
            'Wash or flush the area immediately and report it right away — post-exposure treatment is time-sensitive',
        },
        { id: 'c', label: 'Hide it to avoid trouble' },
        { id: 'd', label: 'Finish the shift first' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'The correct way to treat a resident with HIV is:',
      options: [
        { id: 'a', label: 'With distance and extra gloves for all contact' },
        {
          id: 'b',
          label:
            'With completely normal, warm, dignified care, using standard precautions for blood and fluids',
        },
        { id: 'c', label: 'By avoiding touch' },
        { id: 'd', label: 'By sharing their diagnosis to warn others' },
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
      slug: HIV_AIDS_FINAL_EXAM.slug,
      deletedAt: null,
    },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: HIV_AIDS_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: HIV_AIDS_FINAL_EXAM.passingScore,
          maxAttempts: HIV_AIDS_FINAL_EXAM.maxAttempts,
          settings: HIV_AIDS_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: HIV_AIDS_FINAL_EXAM.slug,
          title: HIV_AIDS_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: HIV_AIDS_FINAL_EXAM.passingScore,
          maxAttempts: HIV_AIDS_FINAL_EXAM.maxAttempts,
          settings: HIV_AIDS_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of HIV_AIDS_FINAL_EXAM.questions) {
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
