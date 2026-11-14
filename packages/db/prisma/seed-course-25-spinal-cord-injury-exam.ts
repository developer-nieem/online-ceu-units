/**
 * Seed the 10-question final exam for Caring for a Resident with a Spinal Cord Injury.
 * Targets the v1 DRAFT course version created by seed-course-25-spinal-cord-injury (tenant cal-ace).
 *
 * Run: pnpm --filter @calace/db db:seed-course-25-spinal-cord-injury-exam
 */
import {
  AssessmentKind,
  CourseVersionStatus,
  PrismaClient,
  QuestionType,
} from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';
const COURSE_SLUG = 'spinal-cord-injury';

const SPINAL_CORD_INJURY_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — Caring for a Resident with a Spinal Cord Injury',
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
      prompt: 'A spinal cord injury affects the body by:',
      options: [
        { id: 'a', label: 'Only affecting a person\'s memory' },
        { id: 'b', label: 'Cutting off movement and feeling below the level of injury' },
        { id: 'c', label: 'Causing a lung infection' },
        { id: 'd', label: 'Affecting only the arms' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Why are skin checks and repositioning so critical for a resident with SCI?',
      options: [
        { id: 'a', label: 'The resident enjoys being moved' },
        {
          id: 'b',
          label: 'The resident cannot feel pressure damage starting, so skin can break down silently',
        },
        { id: 'c', label: 'It is only for comfort' },
        { id: 'd', label: 'It is not actually important' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Because a resident with SCI cannot feel below the injury, the CNA SHOULD:',
      options: [
        { id: 'a', label: 'Use hot water so the resident can feel it' },
        { id: 'b', label: 'Always test water temperature and keep heat sources off numb skin' },
        { id: 'c', label: 'Skip checking the skin' },
        { id: 'd', label: 'Place heating pads directly on the skin' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Autonomic dysreflexia is:',
      options: [
        { id: 'a', label: 'A mild headache that needs no action' },
        { id: 'b', label: 'A sudden, dangerous spike in blood pressure — a medical emergency' },
        { id: 'c', label: 'A normal part of SCI' },
        { id: 'd', label: 'A type of skin rash' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A resident with a high SCI suddenly has a pounding headache, sweating, and flushing above the injury. The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Lay the resident flat to rest' },
        {
          id: 'b',
          label: 'Sit the resident upright, loosen tight clothing, check the catheter, and get help immediately',
        },
        { id: 'c', label: 'Give a headache medication and wait' },
        { id: 'd', label: 'Ignore it' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A common trigger of autonomic dysreflexia is:',
      options: [
        { id: 'a', label: 'A full bladder or kinked, blocked catheter' },
        { id: 'b', label: 'Drinking water' },
        { id: 'c', label: 'Sitting upright' },
        { id: 'd', label: 'A calm environment' },
      ],
      correctAnswer: 'a',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'During repositioning, the CNA finds redness over the tailbone that doesn\'t fade. The resident feels nothing. The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Skip it since the resident feels fine' },
        { id: 'b', label: 'Reposition off the area and report it to the nurse promptly' },
        { id: 'c', label: 'Rub the area firmly' },
        { id: 'd', label: 'Wait until the next shift' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Faithful catheter and bowel routines help prevent:',
      options: [
        { id: 'a', label: 'Nothing important' },
        { id: 'b', label: 'Infections AND triggers of autonomic dysreflexia' },
        { id: 'c', label: 'Only boredom' },
        { id: 'd', label: 'The resident\'s appetite' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'When caring for a young adult with SCI whose mind is fully intact, the CNA SHOULD:',
      options: [
        { id: 'a', label: 'Make decisions for them without asking' },
        {
          id: 'b',
          label: 'Respect them as the capable expert on their own body and support independence',
        },
        { id: 'c', label: 'Speak to them like a child' },
        { id: 'd', label: 'Ignore their input' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Which task is OUTSIDE the CNA's scope of practice?",
      options: [
        { id: 'a', label: 'Repositioning and checking skin' },
        { id: 'b', label: 'Sitting a resident up during autonomic dysreflexia' },
        { id: 'c', label: 'Diagnosing the injury or adjusting medications' },
        { id: 'd', label: 'Following the bladder and bowel program' },
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
      slug: SPINAL_CORD_INJURY_FINAL_EXAM.slug,
      deletedAt: null,
    },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: SPINAL_CORD_INJURY_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: SPINAL_CORD_INJURY_FINAL_EXAM.passingScore,
          maxAttempts: SPINAL_CORD_INJURY_FINAL_EXAM.maxAttempts,
          settings: SPINAL_CORD_INJURY_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: SPINAL_CORD_INJURY_FINAL_EXAM.slug,
          title: SPINAL_CORD_INJURY_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: SPINAL_CORD_INJURY_FINAL_EXAM.passingScore,
          maxAttempts: SPINAL_CORD_INJURY_FINAL_EXAM.maxAttempts,
          settings: SPINAL_CORD_INJURY_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of SPINAL_CORD_INJURY_FINAL_EXAM.questions) {
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
