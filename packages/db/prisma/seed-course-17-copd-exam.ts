/**
 * Seed the 10-question final exam for Caring for a Resident with COPD.
 * Targets the v1 DRAFT course version created by seed-course-17-copd (tenant cal-ace).
 *
 * Run: pnpm --filter @calace/db db:seed-course-17-copd-exam
 */
import {
  AssessmentKind,
  CourseVersionStatus,
  PrismaClient,
  QuestionType,
} from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';
const COURSE_SLUG = 'copd';

const COPD_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — Caring for a Resident with COPD',
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
      prompt: 'COPD is best described as:',
      options: [
        { id: 'a', label: 'A sudden infection of the lungs' },
        { id: 'b', label: 'A long-term lung disease that makes breathing difficult' },
        { id: 'c', label: 'A type of heart disease' },
        { id: 'd', label: 'A temporary cough that goes away' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A resident with COPD breathes easier when positioned:',
      options: [
        { id: 'a', label: 'Lying flat on their back' },
        { id: 'b', label: 'Sitting upright or leaning slightly forward' },
        { id: 'c', label: 'Lying on their stomach' },
        { id: 'd', label: 'With the head of the bed lowered' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A resident with COPD is short of breath. The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Turn up the oxygen flow rate to help' },
        { id: 'b', label: 'Report to the nurse and never change the oxygen flow rate' },
        { id: 'c', label: 'Lay the resident flat' },
        { id: 'd', label: 'Turn the oxygen off to reset it' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Why must a CNA never increase a COPD resident's oxygen flow rate?",
      options: [
        { id: 'a', label: 'It wastes oxygen' },
        { id: 'b', label: "Too much oxygen can dangerously slow some residents' breathing" },
        { id: 'c', label: 'The resident might get cold' },
        { id: 'd', label: 'It is too difficult to adjust' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Which is an early sign of a COPD flare-up that should be reported?',
      options: [
        { id: 'a', label: 'The resident sleeping well' },
        { id: 'b', label: 'Mucus changing from clear to yellow or green' },
        { id: 'c', label: 'A normal appetite' },
        { id: 'd', label: 'Calm, easy breathing' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Pursed-lip breathing helps a resident by:',
      options: [
        { id: 'a', label: 'Making them cough harder' },
        { id: 'b', label: 'Helping push trapped air out and easing breathlessness' },
        { id: 'c', label: 'Replacing their oxygen' },
        { id: 'd', label: 'Stopping all coughing' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        "A resident with COPD is gasping, can't speak in full sentences, and has bluish lips. The CNA SHOULD:",
      options: [
        { id: 'a', label: 'Lay them flat and wait' },
        { id: 'b', label: 'Stay with them, keep them upright, and activate emergency help immediately' },
        { id: 'c', label: 'Turn up the oxygen to 5 liters' },
        { id: 'd', label: 'Leave to find help and return' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Because respiratory infections trigger COPD flare-ups, the CNA SHOULD:',
      options: [
        { id: 'a', label: 'Skip hand washing to save time' },
        { id: 'b', label: 'Practice good hand hygiene and keep sick visitors away' },
        { id: 'c', label: 'Encourage visits from people with colds' },
        { id: 'd', label: 'Avoid the resident entirely' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Around a resident using oxygen, the CNA SHOULD:',
      options: [
        { id: 'a', label: 'Allow smoking nearby' },
        { id: 'b', label: 'Keep oxygen away from flames and heat, and respect fire safety' },
        { id: 'c', label: 'Place oxygen next to a heater' },
        { id: 'd', label: 'Ignore "oxygen in use" signs' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Which task is OUTSIDE the CNA's scope of practice?",
      options: [
        { id: 'a', label: 'Positioning a resident upright to breathe easier' },
        { id: 'b', label: 'Reporting a change in breathing to the nurse' },
        { id: 'c', label: "Giving or adjusting the resident's inhaler medication" },
        { id: 'd', label: 'Coaching pursed-lip breathing' },
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
    where: { courseVersionId: version.id, slug: COPD_FINAL_EXAM.slug, deletedAt: null },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: COPD_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: COPD_FINAL_EXAM.passingScore,
          maxAttempts: COPD_FINAL_EXAM.maxAttempts,
          settings: COPD_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: COPD_FINAL_EXAM.slug,
          title: COPD_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: COPD_FINAL_EXAM.passingScore,
          maxAttempts: COPD_FINAL_EXAM.maxAttempts,
          settings: COPD_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of COPD_FINAL_EXAM.questions) {
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
