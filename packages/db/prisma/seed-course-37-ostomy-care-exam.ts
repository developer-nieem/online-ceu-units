/**
 * Seed the 10-question final exam for Caring for a Resident with an Ostomy.
 * Targets the v1 DRAFT course version created by seed-course-37-ostomy-care (tenant cal-ace).
 *
 * Run: pnpm --filter @calace/db db:seed-course-37-ostomy-care-exam
 */
import {
  AssessmentKind,
  CourseVersionStatus,
  PrismaClient,
  QuestionType,
} from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';
const COURSE_SLUG = 'ostomy-care';

const OSTOMY_CARE_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — Caring for a Resident with an Ostomy',
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
      prompt: 'An ostomy is:',
      options: [
        { id: 'a', label: 'A type of medication' },
        {
          id: 'b',
          label: 'A surgically created opening for body waste to leave through the abdomen',
        },
        { id: 'c', label: 'A feeding tube' },
        { id: 'd', label: 'A kind of bandage' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A healthy stoma normally looks:',
      options: [
        { id: 'a', label: 'Dry and pale white' },
        { id: 'b', label: 'Moist and red or pink, like the inside of the cheek' },
        { id: 'c', label: 'Black' },
        { id: 'd', label: 'Covered in thick scabs' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'The stoma has no nerve endings, which means:',
      options: [
        { id: 'a', label: 'It hurts constantly' },
        {
          id: 'b',
          label: 'It feels no pain — so a resident can "feel fine" even when the stoma is in trouble',
        },
        { id: 'c', label: 'It cannot bleed' },
        { id: 'd', label: 'It needs no observation' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A pouch should generally be emptied when it is:',
      options: [
        { id: 'a', label: 'Completely full and bulging' },
        { id: 'b', label: 'About one-third full' },
        { id: 'c', label: 'Totally empty' },
        { id: 'd', label: 'Once a week' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Why does an overfull pouch cause leaks?',
      options: [
        { id: 'a', label: "It doesn't cause leaks" },
        { id: 'b', label: 'Its weight drags on and peels the skin barrier away from the skin' },
        { id: 'c', label: 'It makes the stoma larger' },
        { id: 'd', label: 'It improves the seal' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Output leaking under the barrier is dangerous mainly because:',
      options: [
        { id: 'a', label: 'It changes the pouch color' },
        {
          id: 'b',
          label: "It burns and breaks down the skin, which then can't hold the next seal",
        },
        { id: 'c', label: 'It is always painless and harmless' },
        { id: 'd', label: 'It only matters for urostomies' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        "A resident's stoma has turned dusky purple-gray, but he says he feels fine. The CNA SHOULD:",
      options: [
        { id: 'a', label: 'Wait and recheck this evening' },
        {
          id: 'b',
          label: 'Report it to the nurse immediately — the blood supply may be failing',
        },
        { id: 'c', label: 'Rub the stoma to restore color' },
        { id: 'd', label: 'Cover it and ignore it since he feels fine' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        "An ileostomy resident's normally active pouch has been empty since last evening, and she now has worsening cramping, bloating, and nausea. The CNA SHOULD:",
      options: [
        { id: 'a', label: 'Wait until tomorrow' },
        { id: 'b', label: 'Report a possible blockage to the nurse promptly' },
        { id: 'c', label: 'Serve her a large meal to push it through' },
        { id: 'd', label: 'Massage her abdomen firmly' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Residents with an ileostomy need special attention to:',
      options: [
        { id: 'a', label: 'Avoiding all fluids' },
        { id: 'b', label: 'Hydration — their liquid output drains fluid quickly' },
        { id: 'c', label: 'Eating large amounts of nuts and popcorn' },
        { id: 'd', label: 'Keeping the pouch as full as possible' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Which task is OUTSIDE the CNA's scope of practice?",
      options: [
        { id: 'a', label: 'Emptying a pouch within facility policy and training' },
        { id: 'b', label: 'Observing the stoma, skin, and output and reporting changes' },
        { id: 'c', label: 'Irrigating an ostomy or changing the ostomy care plan' },
        { id: 'd', label: "Protecting the resident's dignity during ostomy care" },
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
      slug: OSTOMY_CARE_FINAL_EXAM.slug,
      deletedAt: null,
    },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: OSTOMY_CARE_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: OSTOMY_CARE_FINAL_EXAM.passingScore,
          maxAttempts: OSTOMY_CARE_FINAL_EXAM.maxAttempts,
          settings: OSTOMY_CARE_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: OSTOMY_CARE_FINAL_EXAM.slug,
          title: OSTOMY_CARE_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: OSTOMY_CARE_FINAL_EXAM.passingScore,
          maxAttempts: OSTOMY_CARE_FINAL_EXAM.maxAttempts,
          settings: OSTOMY_CARE_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of OSTOMY_CARE_FINAL_EXAM.questions) {
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
