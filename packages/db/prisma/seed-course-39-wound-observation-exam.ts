/**
 * Seed the 10-question final exam for Wound Observation & Basic Skin Care.
 * Targets the v1 DRAFT course version created by seed-course-39-wound-observation (tenant cal-ace).
 *
 * Run: pnpm --filter @calace/db db:seed-course-39-wound-observation-exam
 */
import {
  AssessmentKind,
  CourseVersionStatus,
  PrismaClient,
  QuestionType,
} from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';
const COURSE_SLUG = 'wound-observation';

const WOUND_OBSERVATION_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — Wound Observation & Basic Skin Care',
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
      prompt: "Compared to younger skin, older adults' skin is:",
      options: [
        { id: 'a', label: 'Thicker and tougher' },
        { id: 'b', label: 'Thinner, drier, more easily torn, and slower to heal' },
        { id: 'c', label: 'Immune to injury' },
        { id: 'd', label: 'Faster to heal' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A skin tear is:',
      options: [
        { id: 'a', label: 'A deep surgical cut' },
        {
          id: 'b',
          label: 'Fragile skin pulled, sheared, or peeled away, often during handling',
        },
        { id: 'c', label: 'A type of bruise only' },
        { id: 'd', label: 'A burn' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "The CNA's core role with wounds is to:",
      options: [
        { id: 'a', label: 'Diagnose and treat them' },
        {
          id: 'b',
          label: 'Observe and describe them accurately, and report — without diagnosing or treating',
        },
        { id: 'c', label: 'Choose the dressings' },
        { id: 'd', label: 'Stage them' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A good wound description includes:',
      options: [
        { id: 'a', label: 'A medical diagnosis' },
        {
          id: 'b',
          label: "Location, size, color, whether it's open, and any drainage",
        },
        { id: 'c', label: "The CNA's guess at the cause" },
        { id: 'd', label: "Only the resident's name" },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'In a diabetic resident with reduced foot sensation, a small new foot sore should be:',
      options: [
        { id: 'a', label: "Ignored because it's small" },
        {
          id: 'b',
          label: 'Reported immediately — small diabetic foot wounds can become limb-threatening',
        },
        { id: 'c', label: 'Treated by the CNA with cream' },
        { id: 'd', label: 'Watched for a few weeks' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Many skin tears in elders can be prevented by:',
      options: [
        { id: 'a', label: 'Gripping and pulling limbs firmly' },
        {
          id: 'b',
          label: 'Gentle handling, supporting limbs, careful transfers, and slow adhesive removal',
        },
        { id: 'c', label: 'Dragging residents across sheets' },
        { id: 'd', label: 'Removing tape quickly' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A wound has spreading redness, warmth, foul yellow-green drainage, and the resident has a fever and new confusion. The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Wait for the next dressing change' },
        {
          id: 'b',
          label: 'Report it to the nurse urgently — the infection may be spreading',
        },
        { id: 'c', label: 'Clean and re-dress it themselves' },
        { id: 'd', label: 'Recheck in a few days' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A resident on a blood thinner has a skin tear that is bleeding steadily. The CNA\'s BEST first action is to:',
      options: [
        { id: 'a', label: 'Leave to find the nurse' },
        {
          id: 'b',
          label: 'Apply firm direct pressure, elevate, call for help, and stay with them',
        },
        { id: 'c', label: 'Wipe the blood repeatedly' },
        { id: 'd', label: 'Apply a loose dressing and wait' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A dressing has come loose and is soaked and soiled. The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Re-tape or replace it themselves if not trained to' },
        {
          id: 'b',
          label: 'Report it to the nurse rather than improvising (unless trained and permitted)',
        },
        { id: 'c', label: 'Remove it and leave the wound open' },
        { id: 'd', label: 'Ignore it' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Which task is OUTSIDE the CNA's scope of practice?",
      options: [
        { id: 'a', label: 'Observing and describing a wound' },
        { id: 'b', label: 'Protecting fragile skin and supporting nutrition' },
        { id: 'c', label: 'Diagnosing, treating, or selecting dressings for a wound' },
        { id: 'd', label: 'Reporting infection or bleeding' },
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
      slug: WOUND_OBSERVATION_FINAL_EXAM.slug,
      deletedAt: null,
    },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: WOUND_OBSERVATION_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: WOUND_OBSERVATION_FINAL_EXAM.passingScore,
          maxAttempts: WOUND_OBSERVATION_FINAL_EXAM.maxAttempts,
          settings: WOUND_OBSERVATION_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: WOUND_OBSERVATION_FINAL_EXAM.slug,
          title: WOUND_OBSERVATION_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: WOUND_OBSERVATION_FINAL_EXAM.passingScore,
          maxAttempts: WOUND_OBSERVATION_FINAL_EXAM.maxAttempts,
          settings: WOUND_OBSERVATION_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of WOUND_OBSERVATION_FINAL_EXAM.questions) {
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
