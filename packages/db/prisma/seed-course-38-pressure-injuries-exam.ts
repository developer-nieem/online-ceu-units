/**
 * Seed the 10-question final exam for Preventing & Recognizing Pressure Injuries.
 * Targets the v1 DRAFT course version created by seed-course-38-pressure-injuries (tenant cal-ace).
 *
 * Run: pnpm --filter @calace/db db:seed-course-38-pressure-injuries-exam
 */
import {
  AssessmentKind,
  CourseVersionStatus,
  PrismaClient,
  QuestionType,
} from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';
const COURSE_SLUG = 'pressure-injuries';

const PRESSURE_INJURIES_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — Preventing & Recognizing Pressure Injuries',
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
      prompt: 'A pressure injury forms because:',
      options: [
        { id: 'a', label: 'The resident eats too much' },
        { id: 'b', label: 'Sustained pressure cuts off blood flow to the skin and tissue' },
        { id: 'c', label: 'The skin is washed too often' },
        { id: 'd', label: 'The room is too cold' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Pressure injuries most often form over:',
      options: [
        { id: 'a', label: 'The soft belly' },
        { id: 'b', label: 'Bony points like the tailbone, hips, and heels' },
        { id: 'c', label: 'The palms of the hands' },
        { id: 'd', label: 'The hair' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Repositioning a bedbound resident should generally be done:',
      options: [
        { id: 'a', label: 'Once a day' },
        { id: 'b', label: 'At least every two hours' },
        { id: 'c', label: 'Once a week' },
        { id: 'd', label: 'Only when they ask' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'You press a reddened area over a bony point and it does NOT turn white. This means:',
      options: [
        { id: 'a', label: 'The skin is perfectly healthy' },
        { id: 'b', label: 'The tissue is already damaged — a stage 1 pressure injury' },
        { id: 'c', label: 'The resident needs more blankets' },
        { id: 'd', label: 'Nothing important' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'When you find non-blanching redness over the tailbone, the CNA SHOULD:',
      options: [
        { id: 'a', label: 'Watch it until the next shift' },
        { id: 'b', label: 'Relieve all pressure from the area now and report it promptly' },
        { id: 'c', label: 'Massage the area firmly' },
        { id: 'd', label: "Ignore it since the skin isn't open" },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Assigning the stage number to a pressure injury is:',
      options: [
        { id: 'a', label: "The CNA's job" },
        {
          id: 'b',
          label: "The nurse's job — the CNA describes and reports what they see",
        },
        { id: 'c', label: "The resident's job" },
        { id: 'd', label: 'Not necessary' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Which helps prevent pressure injuries?',
      options: [
        { id: 'a', label: 'Leaving a resident in one position all day' },
        {
          id: 'b',
          label: 'Keeping skin clean and dry, floating the heels, and lifting instead of dragging',
        },
        { id: 'c', label: 'Dragging residents across the sheets' },
        { id: 'd', label: 'Skipping meals' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Why is moisture (from sweat, urine, or stool) dangerous for the skin?',
      options: [
        { id: 'a', label: 'It has no effect' },
        { id: 'b', label: 'Wet skin breaks down under far less pressure' },
        { id: 'c', label: 'It makes skin stronger' },
        { id: 'd', label: 'It only matters for hair' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A known pressure injury now has spreading redness, foul drainage, fever, and the resident is newly confused. The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Wait for the next scheduled wound check' },
        {
          id: 'b',
          label: 'Report it to the nurse urgently — the infection may be spreading',
        },
        { id: 'c', label: 'Clean and re-dress it themselves' },
        { id: 'd', label: 'Encourage rest and recheck tomorrow' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Which task is OUTSIDE the CNA's scope of practice?",
      options: [
        { id: 'a', label: 'Repositioning and offloading bony points' },
        { id: 'b', label: 'Inspecting skin and reporting non-blanching redness' },
        { id: 'c', label: 'Staging the injury and selecting the wound dressing' },
        { id: 'd', label: 'Keeping skin clean, dry, and nourished' },
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
      slug: PRESSURE_INJURIES_FINAL_EXAM.slug,
      deletedAt: null,
    },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: PRESSURE_INJURIES_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: PRESSURE_INJURIES_FINAL_EXAM.passingScore,
          maxAttempts: PRESSURE_INJURIES_FINAL_EXAM.maxAttempts,
          settings: PRESSURE_INJURIES_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: PRESSURE_INJURIES_FINAL_EXAM.slug,
          title: PRESSURE_INJURIES_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: PRESSURE_INJURIES_FINAL_EXAM.passingScore,
          maxAttempts: PRESSURE_INJURIES_FINAL_EXAM.maxAttempts,
          settings: PRESSURE_INJURIES_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of PRESSURE_INJURIES_FINAL_EXAM.questions) {
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
