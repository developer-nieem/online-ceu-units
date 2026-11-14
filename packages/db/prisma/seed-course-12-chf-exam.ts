/**
 * Seed the 10-question final exam for Caring for a Resident with Congestive Heart Failure.
 * Targets the v3 DRAFT course version created by seed-course-12-chf (tenant cal-ace).
 *
 * Run: pnpm --filter @calace/db db:seed-course-12-chf-exam
 */
import {
  AssessmentKind,
  CourseVersionStatus,
  PrismaClient,
  QuestionType,
} from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';
const COURSE_SLUG = 'chf-care';

// Must match VERSION_NUMBER in seed-course-12-chf.ts (v3 DRAFT). v2 is PUBLISHED
// (holds an issued cert — CALACE-2026-ZU7BQ — DO NOT TOUCH).
const VERSION_NUMBER = 3;

const CHF_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — Caring for a Resident with Congestive Heart Failure',
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
      prompt: 'When SHOULD the CNA weigh a resident with CHF?',
      options: [
        { id: 'a', label: 'After breakfast each day' },
        { id: 'b', label: 'Same time each morning, after urinating, before breakfast' },
        { id: 'c', label: 'Whenever the resident agrees' },
        { id: 'd', label: 'Once a week at bath time' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A resident with CHF gained 3 pounds since yesterday. The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Report it to the nurse now' },
        { id: 'b', label: 'Note it for the next shift' },
        { id: 'c', label: 'Encourage more walking' },
        { id: 'd', label: 'Remove fluids from the meal tray' },
      ],
      correctAnswer: 'a',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Which is a SIGN of CHF the CNA can observe?',
      options: [
        { id: 'a', label: 'The resident feels sad' },
        { id: 'b', label: 'Swelling in the ankles and feet' },
        { id: 'c', label: 'The resident says she slept well' },
        { id: 'd', label: 'A headache the resident reports' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A resident with CHF asks to sleep with three pillows because breathing "feels heavy" lying flat. This is called:',
      options: [
        { id: 'a', label: 'Edema' },
        { id: 'b', label: 'Cyanosis' },
        { id: 'c', label: 'Orthopnea' },
        { id: 'd', label: 'Hypertension' },
      ],
      correctAnswer: 'c',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A resident on a fluid restriction begs for extra water. The BEST action is:',
      options: [
        { id: 'a', label: "Give a small extra cup — it's only water" },
        { id: 'b', label: 'Tell the resident no and walk away' },
        { id: 'c', label: 'Tell the nurse about the request' },
        { id: 'd', label: 'Give ice chips without checking the care plan' },
      ],
      correctAnswer: 'c',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'At night, a resident with CHF is gasping, coughing pink frothy sputum, and his lips look blue. The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Stay with him and activate emergency help now' },
        { id: 'b', label: 'Lay him flat and recheck in 15 minutes' },
        { id: 'c', label: 'Give his water pill early' },
        { id: 'd', label: 'Offer a glass of water' },
      ],
      correctAnswer: 'a',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A resident takes a diuretic ("water pill") each morning. The CNA SHOULD expect:',
      options: [
        { id: 'a', label: 'The resident will sleep more' },
        { id: 'b', label: 'More frequent urination after the dose' },
        { id: 'c', label: 'Less appetite at breakfast' },
        { id: 'd', label: 'Swelling to get worse' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Which task is OUTSIDE the CNA's scope of practice?",
      options: [
        { id: 'a', label: 'Recording daily weight' },
        { id: 'b', label: 'Measuring urine output' },
        { id: 'c', label: 'Adjusting the oxygen flow rate' },
        { id: 'd', label: 'Reporting new swelling' },
      ],
      correctAnswer: 'c',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A family brings salty snacks for a resident with CHF. The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Throw the snacks away' },
        { id: 'b', label: 'Let the resident enjoy them — family knows best' },
        { id: 'c', label: 'Inform the nurse about the snacks' },
        { id: 'd', label: 'Hide the snacks in the closet' },
      ],
      correctAnswer: 'c',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "The skin over a resident's swollen legs should be:",
      options: [
        { id: 'a', label: 'Rubbed briskly to improve circulation' },
        { id: 'b', label: 'Patted dry gently and checked for redness' },
        { id: 'c', label: 'Covered with tight elastic socks from the store' },
        { id: 'd', label: 'Left wet to keep it cool' },
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
      versionNumber: VERSION_NUMBER,
      status: CourseVersionStatus.DRAFT,
      deletedAt: null,
    },
    select: { id: true, status: true, versionNumber: true },
  });

  if (!version) {
    console.error(`DRAFT course version v${VERSION_NUMBER} not found for: ${COURSE_SLUG}`);
    process.exit(1);
  }

  console.log(
    `Course version ID: ${version.id} (v${version.versionNumber}, status: ${version.status})`,
  );
  console.log(`Course status: ${course.status} (unchanged — exam not learner-visible until publish)`);

  const existing = await prisma.assessment.findFirst({
    where: { courseVersionId: version.id, slug: CHF_FINAL_EXAM.slug, deletedAt: null },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: CHF_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: CHF_FINAL_EXAM.passingScore,
          maxAttempts: CHF_FINAL_EXAM.maxAttempts,
          settings: CHF_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: CHF_FINAL_EXAM.slug,
          title: CHF_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: CHF_FINAL_EXAM.passingScore,
          maxAttempts: CHF_FINAL_EXAM.maxAttempts,
          settings: CHF_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of CHF_FINAL_EXAM.questions) {
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
