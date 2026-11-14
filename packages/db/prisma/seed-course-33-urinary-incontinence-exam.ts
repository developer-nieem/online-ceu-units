/**
 * Seed the 10-question final exam for Caring for a Resident with Urinary Incontinence.
 * Targets the v1 DRAFT course version created by seed-course-33-urinary-incontinence (tenant cal-ace).
 *
 * Run: pnpm --filter @calace/db db:seed-course-33-urinary-incontinence-exam
 */
import {
  AssessmentKind,
  CourseVersionStatus,
  PrismaClient,
  QuestionType,
} from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';
const COURSE_SLUG = 'urinary-incontinence';

const URINARY_INCONTINENCE_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — Caring for a Resident with Urinary Incontinence',
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
      prompt: 'Urinary incontinence is best understood as:',
      options: [
        { id: 'a', label: 'A normal, untreatable part of getting old' },
        { id: 'b', label: 'A common medical condition that is often treatable' },
        { id: 'c', label: 'A sign of laziness' },
        { id: 'd', label: 'Something to be ashamed of' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Leaking urine when coughing, sneezing, or lifting is called:',
      options: [
        { id: 'a', label: 'Urge incontinence' },
        { id: 'b', label: 'Stress incontinence' },
        { id: 'c', label: 'Overflow incontinence' },
        { id: 'd', label: 'Functional incontinence' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        "A resident whose bladder works fine but who can't reach the toilet in time due to mobility or confusion has:",
      options: [
        { id: 'a', label: 'Stress incontinence' },
        { id: 'b', label: 'Functional incontinence' },
        { id: 'c', label: 'Overflow incontinence' },
        { id: 'd', label: 'No incontinence' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'The MOST important thing a CNA protects during incontinence care is the resident\'s:',
      options: [
        { id: 'a', label: 'Schedule' },
        { id: 'b', label: 'Dignity' },
        { id: 'c', label: 'Television time' },
        { id: 'd', label: 'Roommate' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A resident who was continent suddenly has accidents and is newly confused. The CNA SHOULD:',
      options: [
        { id: 'a', label: "Assume it's just aging and use briefs" },
        { id: 'b', label: 'Report the sudden change to the nurse promptly — it may be a treatable UTI' },
        { id: 'c', label: 'Restrict their fluids' },
        { id: 'd', label: 'Wait several weeks' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Why must a CNA never leave a resident sitting in wet?',
      options: [
        { id: 'a', label: 'It only matters for comfort' },
        { id: 'b', label: 'Urine on the skin causes painful breakdown and serious wounds' },
        { id: 'c', label: "It doesn't matter" },
        { id: 'd', label: 'To save laundry' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'To reduce accidents for a resident with functional incontinence, the CNA SHOULD:',
      options: [
        { id: 'a', label: 'Ignore call lights' },
        {
          id: 'b',
          label: 'Answer call lights fast, keep paths clear, and provide easy-to-remove clothing',
        },
        { id: 'c', label: 'Restrict all fluids' },
        { id: 'd', label: 'Tell them to hold it longer' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A proud resident is mortified after an accident. The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Tell them to try harder' },
        { id: 'b', label: 'Respond with calm, warm, judgment-free reassurance and dignified care' },
        { id: 'c', label: 'Sigh and clean up quickly without a word' },
        { id: 'd', label: 'Leave them embarrassed' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Restricting a resident's fluids to reduce accidents:",
      options: [
        { id: 'a', label: 'Is the best approach' },
        {
          id: 'b',
          label: 'Backfires — it concentrates urine, irritates the bladder, and can worsen things',
        },
        { id: 'c', label: 'Has no effect' },
        { id: 'd', label: 'Should always be done' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Which task is OUTSIDE the CNA's scope of practice?",
      options: [
        { id: 'a', label: 'Following the toileting program and protecting skin' },
        { id: 'b', label: 'Reporting a sudden change in continence' },
        { id: 'c', label: 'Diagnosing the cause or adjusting incontinence medications' },
        { id: 'd', label: "Protecting the resident's dignity" },
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
      slug: URINARY_INCONTINENCE_FINAL_EXAM.slug,
      deletedAt: null,
    },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: URINARY_INCONTINENCE_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: URINARY_INCONTINENCE_FINAL_EXAM.passingScore,
          maxAttempts: URINARY_INCONTINENCE_FINAL_EXAM.maxAttempts,
          settings: URINARY_INCONTINENCE_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: URINARY_INCONTINENCE_FINAL_EXAM.slug,
          title: URINARY_INCONTINENCE_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: URINARY_INCONTINENCE_FINAL_EXAM.passingScore,
          maxAttempts: URINARY_INCONTINENCE_FINAL_EXAM.maxAttempts,
          settings: URINARY_INCONTINENCE_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of URINARY_INCONTINENCE_FINAL_EXAM.questions) {
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
