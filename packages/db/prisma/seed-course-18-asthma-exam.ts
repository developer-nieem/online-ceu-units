/**
 * Seed the 10-question final exam for Asthma and Breathing Emergencies: The CNA's Role.
 * Targets the v1 DRAFT course version created by seed-course-18-asthma (tenant cal-ace).
 *
 * Run: pnpm --filter @calace/db db:seed-course-18-asthma-exam
 */
import {
  AssessmentKind,
  CourseVersionStatus,
  PrismaClient,
  QuestionType,
} from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';
const COURSE_SLUG = 'asthma';

const ASTHMA_FINAL_EXAM = {
  slug: 'final-exam',
  title: "Final Exam — Asthma and Breathing Emergencies: The CNA's Role",
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
      prompt: 'During an asthma attack, the airways:',
      options: [
        { id: 'a', label: 'Widen and relax' },
        { id: 'b', label: 'Tighten, swell, and fill with mucus' },
        { id: 'c', label: 'Are completely unaffected' },
        { id: 'd', label: 'Become stronger' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'When a resident is having an asthma attack, the CNA SHOULD:',
      options: [
        { id: 'a', label: "Give the resident's rescue inhaler" },
        { id: 'b', label: 'Help them sit upright, stay calm, and call the nurse immediately' },
        { id: 'c', label: 'Have them lie flat' },
        { id: 'd', label: 'Wait to see if it passes' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        "A resident's wheezing fades while they are still clearly struggling to breathe. This means:",
      options: [
        { id: 'a', label: 'The attack is getting better' },
        { id: 'b', label: 'The attack may be severe — a danger sign' },
        { id: 'c', label: 'The resident no longer needs help' },
        { id: 'd', label: 'The CNA can leave the room' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'May a CNA decide to give a resident their rescue inhaler during an attack?',
      options: [
        { id: 'a', label: 'Yes, if the resident asks' },
        { id: 'b', label: "Yes, if it's in the resident's drawer" },
        { id: 'c', label: 'No — the CNA calls the nurse, who manages the medication' },
        { id: 'd', label: 'Yes, if the resident has used it before' },
      ],
      correctAnswer: 'c',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Which is a common asthma trigger a CNA can help reduce?',
      options: [
        { id: 'a', label: 'Strong perfumes and scented products' },
        { id: 'b', label: 'Sitting upright' },
        { id: 'c', label: 'Drinking water' },
        { id: 'd', label: 'Resting quietly' },
      ],
      correctAnswer: 'a',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'The best position for a resident having an asthma attack is:',
      options: [
        { id: 'a', label: 'Lying flat on their back' },
        { id: 'b', label: 'Sitting upright' },
        { id: 'c', label: 'Lying on their stomach' },
        { id: 'd', label: 'With the head lowered' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Why is the CNA's calm presence important during an asthma attack?",
      options: [
        { id: 'a', label: 'It has no effect' },
        { id: 'b', label: 'Panic tightens the chest and makes the attack worse' },
        { id: 'c', label: 'It replaces the medication' },
        { id: 'd', label: "It speeds up the resident's breathing" },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A controller inhaler is different from a rescue inhaler because it:',
      options: [
        { id: 'a', label: 'Is taken every day to prevent attacks' },
        { id: 'b', label: 'Is used only during an attack' },
        { id: 'c', label: 'Works instantly during an emergency' },
        { id: 'd', label: 'Is never prescribed for asthma' },
      ],
      correctAnswer: 'a',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        "A resident with asthma shows a severe attack with blue lips and can't speak. The CNA SHOULD:",
      options: [
        { id: 'a', label: 'Activate emergency help immediately and stay with them' },
        { id: 'b', label: 'Wait an hour and recheck' },
        { id: 'c', label: 'Lay them flat to rest' },
        { id: 'd', label: 'Leave to find supplies' },
      ],
      correctAnswer: 'a',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Which task is OUTSIDE the CNA's scope of practice?",
      options: [
        { id: 'a', label: "Reducing triggers in the resident's environment" },
        { id: 'b', label: 'Helping a resident sit upright during an attack' },
        { id: 'c', label: "Deciding when to give the resident's rescue inhaler" },
        { id: 'd', label: 'Calling the nurse when an attack begins' },
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
    where: { courseVersionId: version.id, slug: ASTHMA_FINAL_EXAM.slug, deletedAt: null },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: ASTHMA_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: ASTHMA_FINAL_EXAM.passingScore,
          maxAttempts: ASTHMA_FINAL_EXAM.maxAttempts,
          settings: ASTHMA_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: ASTHMA_FINAL_EXAM.slug,
          title: ASTHMA_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: ASTHMA_FINAL_EXAM.passingScore,
          maxAttempts: ASTHMA_FINAL_EXAM.maxAttempts,
          settings: ASTHMA_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of ASTHMA_FINAL_EXAM.questions) {
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
