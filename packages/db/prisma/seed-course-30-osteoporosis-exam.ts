/**
 * Seed the 10-question final exam for Caring for a Resident with Osteoporosis.
 * Targets the v1 DRAFT course version created by seed-course-30-osteoporosis (tenant cal-ace).
 *
 * Run: pnpm --filter @calace/db db:seed-course-30-osteoporosis-exam
 */
import {
  AssessmentKind,
  CourseVersionStatus,
  PrismaClient,
  QuestionType,
} from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';
const COURSE_SLUG = 'osteoporosis';

const OSTEOPOROSIS_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — Caring for a Resident with Osteoporosis',
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
      prompt: 'Osteoporosis is best described as:',
      options: [
        { id: 'a', label: 'A condition where bones become thin, brittle, and break easily' },
        { id: 'b', label: 'A type of joint inflammation' },
        { id: 'c', label: 'A lung disease' },
        { id: 'd', label: 'A skin condition' },
      ],
      correctAnswer: 'a',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Osteoporosis is often called "silent" because:',
      options: [
        { id: 'a', label: 'It is very loud' },
        { id: 'b', label: 'It causes no symptoms until a bone breaks' },
        { id: 'c', label: 'It only affects hearing' },
        { id: 'd', label: 'It is easy to feel coming' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'In a resident with osteoporosis, a bone can break from:',
      options: [
        { id: 'a', label: 'Only a major car accident' },
        { id: 'b', label: 'A minor fall, a hard bump, or rough handling' },
        { id: 'c', label: 'Nothing can break their bones' },
        { id: 'd', label: 'Only intentional force' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'When transferring a resident with osteoporosis, the CNA SHOULD:',
      options: [
        { id: 'a', label: 'Grab and pull by the arms to move quickly' },
        {
          id: 'b',
          label: 'Move slowly with proper technique, supporting the body and never yanking limbs',
        },
        { id: 'c', label: 'Rush to save time' },
        { id: 'd', label: 'Lift by one fragile limb' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A resident is found on the floor with severe hip pain, can\'t bear weight, and one leg looks shorter and turned outward. The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Lift them back into bed' },
        { id: 'b', label: 'Keep them still, not move them, and get emergency help immediately' },
        { id: 'c', label: 'Help them stand and walk' },
        { id: 'd', label: 'Roll them over to check' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Why must a CNA NOT move a resident with a suspected fracture?',
      options: [
        { id: 'a', label: 'It saves time not to' },
        { id: 'b', label: 'Moving a fractured bone can cause serious additional damage' },
        { id: 'c', label: 'It doesn\'t matter' },
        { id: 'd', label: 'The resident prefers it' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A resident with severe osteoporosis has new sudden arm pain, guarding, and swelling with no witnessed fall. The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Force the arm to move through it' },
        { id: 'b', label: 'Stop, support the arm gently, and report a possible fracture promptly' },
        { id: 'c', label: 'Assume it\'s just stiffness' },
        { id: 'd', label: 'Wait until the next shift' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'The most important way a CNA prevents fractures in osteoporosis is:',
      options: [
        { id: 'a', label: 'Giving bone medication' },
        { id: 'b', label: 'Preventing falls and handling residents gently' },
        { id: 'c', label: 'Interpreting bone scans' },
        { id: 'd', label: 'Ignoring hazards' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Which supports bone health for a resident with osteoporosis?',
      options: [
        { id: 'a', label: 'Skipping meals and supplements' },
        {
          id: 'b',
          label: 'Bone-healthy nutrition, supplements, and safe activity as the plan directs',
        },
        { id: 'c', label: 'Total bed rest forever' },
        { id: 'd', label: 'Removing all calcium' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Which task is OUTSIDE the CNA's scope of practice?",
      options: [
        { id: 'a', label: 'Preventing falls and handling gently' },
        { id: 'b', label: 'Keeping a suspected fracture still and getting help' },
        { id: 'c', label: 'Diagnosing osteoporosis or adjusting bone medication' },
        { id: 'd', label: 'Supporting bone-healthy meals' },
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
      slug: OSTEOPOROSIS_FINAL_EXAM.slug,
      deletedAt: null,
    },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: OSTEOPOROSIS_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: OSTEOPOROSIS_FINAL_EXAM.passingScore,
          maxAttempts: OSTEOPOROSIS_FINAL_EXAM.maxAttempts,
          settings: OSTEOPOROSIS_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: OSTEOPOROSIS_FINAL_EXAM.slug,
          title: OSTEOPOROSIS_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: OSTEOPOROSIS_FINAL_EXAM.passingScore,
          maxAttempts: OSTEOPOROSIS_FINAL_EXAM.maxAttempts,
          settings: OSTEOPOROSIS_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of OSTEOPOROSIS_FINAL_EXAM.questions) {
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
