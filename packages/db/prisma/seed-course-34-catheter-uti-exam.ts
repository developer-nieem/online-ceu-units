/**
 * Seed the 10-question final exam for Catheter Care & Preventing Urinary Tract Infections.
 * Targets the v1 DRAFT course version created by seed-course-34-catheter-uti (tenant cal-ace).
 *
 * Run: pnpm --filter @calace/db db:seed-course-34-catheter-uti-exam
 */
import {
  AssessmentKind,
  CourseVersionStatus,
  PrismaClient,
  QuestionType,
} from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';
const COURSE_SLUG = 'catheter-care-uti';

const CATHETER_UTI_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — Catheter Care & Preventing Urinary Tract Infections',
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
      prompt: 'Why does a urinary catheter raise infection risk?',
      options: [
        { id: 'a', label: 'It makes urine cleaner' },
        { id: 'b', label: 'It gives germs a pathway from outside directly toward the bladder' },
        { id: 'c', label: 'It strengthens the bladder' },
        { id: 'd', label: 'It has no effect on infection risk' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'The drainage bag must ALWAYS be kept:',
      options: [
        { id: 'a', label: 'Above the bladder so it fills faster' },
        { id: 'b', label: 'Below the level of the bladder, and never on the floor' },
        { id: 'c', label: "On the floor where it's out of the way" },
        { id: 'd', label: "On the resident's lap" },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Why must the drainage bag stay below the bladder?',
      options: [
        { id: 'a', label: 'It looks neater' },
        {
          id: 'b',
          label: 'So urine flows downhill and never backs up toward the bladder carrying germs',
        },
        { id: 'c', label: 'To keep it warm' },
        { id: 'd', label: 'It does not matter' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'The closed drainage system should be disconnected:',
      options: [
        { id: 'a', label: 'Whenever it makes dressing easier' },
        { id: 'b', label: 'Only by the nurse for proper procedures — never for convenience' },
        { id: 'c', label: 'Once per shift to air it out' },
        { id: 'd', label: 'During every transfer' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        "A catheter resident's urine has stopped flowing and they feel lower-belly pressure. After freeing kinked tubing, flow still doesn't resume. The CNA SHOULD:",
      options: [
        { id: 'a', label: 'Flush the catheter with water' },
        { id: 'b', label: 'Report it to the nurse promptly — the catheter may be blocked' },
        { id: 'c', label: 'Wait until tomorrow' },
        { id: 'd', label: 'Give the resident less to drink' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'In an older adult, a urinary tract infection often FIRST appears as:',
      options: [
        { id: 'a', label: 'Only burning with urination' },
        { id: 'b', label: 'Sudden confusion, new weakness, or being "not themselves"' },
        { id: 'c', label: 'A skin rash' },
        { id: 'd', label: 'Improved appetite' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'During daily catheter care, cleaning around the entry point should be done:',
      options: [
        { id: 'a', label: 'Wiping toward the entry point' },
        { id: 'b', label: 'Gently, wiping away from the entry point' },
        { id: 'c', label: 'Only once a month' },
        { id: 'd', label: 'With the bag above the bladder' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A resident on antibiotics for a UTI develops shaking chills, rapid breathing, a racing heart, and much worse confusion. The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Let the antibiotics keep working overnight' },
        { id: 'b', label: 'Activate emergency help immediately — possible urosepsis' },
        { id: 'c', label: 'Help them sleep it off' },
        { id: 'd', label: 'Only chart it for the next shift' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Which habit helps PREVENT urinary tract infections?',
      options: [
        { id: 'a', label: 'Wiping back to front' },
        {
          id: 'b',
          label: 'Encouraging fluids as the care plan allows, so urine keeps flushing the system',
        },
        { id: 'c', label: 'Letting the bag rest on the floor' },
        { id: 'd', label: 'Skipping hand hygiene when busy' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Which task is OUTSIDE the CNA's scope of practice?",
      options: [
        { id: 'a', label: 'Keeping the bag below the bladder and tubing kink-free' },
        { id: 'b', label: 'Daily catheter and perineal care' },
        { id: 'c', label: 'Inserting, removing, or irrigating a catheter' },
        { id: 'd', label: 'Reporting cloudy urine or sudden confusion' },
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
      slug: CATHETER_UTI_FINAL_EXAM.slug,
      deletedAt: null,
    },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: CATHETER_UTI_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: CATHETER_UTI_FINAL_EXAM.passingScore,
          maxAttempts: CATHETER_UTI_FINAL_EXAM.maxAttempts,
          settings: CATHETER_UTI_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: CATHETER_UTI_FINAL_EXAM.slug,
          title: CATHETER_UTI_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: CATHETER_UTI_FINAL_EXAM.passingScore,
          maxAttempts: CATHETER_UTI_FINAL_EXAM.maxAttempts,
          settings: CATHETER_UTI_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of CATHETER_UTI_FINAL_EXAM.questions) {
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
