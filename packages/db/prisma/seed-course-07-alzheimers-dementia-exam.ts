/**
 * Seed the 10-question final exam for Alzheimer's Disease & Dementia.
 * Targets the DRAFT course version created by seed-course-07-alzheimers-dementia
 * (tenant cal-ace).
 *
 * Run: pnpm --filter @calace/db db:seed-course-07-alzheimers-dementia-exam
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * MUST MATCH seed-course-07-alzheimers-dementia.ts (confirmed against live DB):
 *   COURSE_SLUG    = 'dementia-care'  (FROZEN — course already live)
 *   VERSION_NUMBER = 2                (MAX existing version is v1 PUBLISHED)
 * NOTE: a separate course 'dementia-care-essentials' (DRAFT stub) also exists — NOT this target.
 * Run order: the main seed FIRST (creates the v2 version), then this exam.
 * Both are DRAFT-only.
 *
 * Questions approved by Dr. Cliff (package: course-07-alzheimers-dementia, "FINAL
 * QUIZ — 10 QUESTIONS"). NATCEP-style: single choice, 4 options, 80% to pass,
 * 3 attempts, randomized. Person-centered care, connect-don't-correct, need-behind-
 * behavior, sudden-change-is-medical, scope focus.
 * Answer key: b,b,b,b,b,b,b,b,b,c
 * ─────────────────────────────────────────────────────────────────────────────
 */
import {
  AssessmentKind,
  CourseVersionStatus,
  PrismaClient,
  QuestionType,
} from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';

// CONFIRMED against live DB — must equal COURSE_SLUG in the main seed. FROZEN slug.
const COURSE_SLUG = 'dementia-care';

// CONFIRMED against live DB — must equal VERSION_NUMBER in the main seed.
const VERSION_NUMBER = 2;

const DEMENTIA_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — Alzheimer\'s Disease & Dementia',
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
      prompt: 'Dementia is:',
      options: [
        { id: 'a', label: 'A normal part of getting older' },
        { id: 'b', label: 'A brain disease that causes a lasting decline in memory and thinking' },
        { id: 'c', label: 'The person choosing to be difficult' },
        { id: 'd', label: 'Always curable' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'The most common cause of dementia is:',
      options: [
        { id: 'a', label: 'Poor diet' },
        { id: 'b', label: 'Alzheimer\'s disease' },
        { id: 'c', label: 'Not sleeping enough' },
        { id: 'd', label: 'Old age by itself' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'The most important thing to remember about a resident with dementia is:',
      options: [
        { id: 'a', label: 'They are an empty shell' },
        { id: 'b', label: 'The person is still there — with feelings, history, and dignity' },
        { id: 'c', label: 'They can\'t feel anything anymore' },
        { id: 'd', label: 'They are just being difficult' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt: '"Connect, don\'t correct" means the CNA should:',
      options: [
        { id: 'a', label: 'Argue with the resident until they understand the truth' },
        { id: 'b', label: 'Meet the resident\'s reality with warmth and reassurance instead of forcing facts' },
        { id: 'c', label: 'Quiz them on the date and their family' },
        { id: 'd', label: 'Ignore them' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A resident with dementia becomes agitated during care. This behavior is usually:',
      options: [
        { id: 'a', label: 'The person being difficult on purpose' },
        { id: 'b', label: 'Communication of an unmet need or fear — like pain, cold, or feeling rushed' },
        { id: 'c', label: 'A reason to force care quickly' },
        { id: 'd', label: 'Nothing to pay attention to' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A resident resists care and seems frightened. The best response is to:',
      options: [
        { id: 'a', label: 'Hold their arms and force the care fast' },
        { id: 'b', label: 'Stop, stay calm, find the need or fear, reassure them, and try again gently' },
        { id: 'c', label: 'Tell them to stop being difficult' },
        { id: 'd', label: 'Leave them with no care at all' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A dementia resident suddenly becomes much more confused than normal. The CNA should:',
      options: [
        { id: 'a', label: 'Assume it\'s just the dementia getting worse and do nothing' },
        { id: 'b', label: 'Report the sudden change — it\'s often a medical problem like infection' },
        { id: 'c', label: 'Wait a week to see if it passes' },
        { id: 'd', label: 'Argue them back to normal' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt: '"Sundowning" refers to:',
      options: [
        { id: 'a', label: 'A resident sleeping all day' },
        { id: 'b', label: 'Increased confusion or agitation in the late afternoon and evening' },
        { id: 'c', label: 'A type of medication' },
        { id: 'd', label: 'A morning routine' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Protecting a dementia resident\'s dignity means:',
      options: [
        { id: 'a', label: 'Talking down to them like a child' },
        { id: 'b', label: 'Treating them with respect, privacy, and choices as a full adult' },
        { id: 'c', label: 'Doing everything for them quickly' },
        { id: 'd', label: 'Ignoring their preferences' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Which is NOT the CNA\'s role in dementia care?',
      options: [
        { id: 'a', label: 'Person-centered care and connecting' },
        { id: 'b', label: 'Keeping the resident safe and comfortable' },
        { id: 'c', label: 'Diagnosing dementia, staging it, or managing medications' },
        { id: 'd', label: 'Reporting changes to the nurse' },
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
      versionNumber: VERSION_NUMBER,
      status: CourseVersionStatus.DRAFT,
      deletedAt: null,
    },
    select: { id: true, status: true, versionNumber: true },
  });

  if (!version) {
    console.error(
      `DRAFT course version v${VERSION_NUMBER} not found for: ${COURSE_SLUG}. ` +
        `Run seed-course-07-alzheimers-dementia.ts first, and confirm VERSION_NUMBER matches.`,
    );
    process.exit(1);
  }

  console.log(
    `Course version ID: ${version.id} (v${version.versionNumber}, status: ${version.status})`,
  );
  console.log(
    `Course status: ${course.status} (unchanged — exam not learner-visible until publish)`,
  );

  const existing = await prisma.assessment.findFirst({
    where: { courseVersionId: version.id, slug: DEMENTIA_FINAL_EXAM.slug, deletedAt: null },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: DEMENTIA_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: DEMENTIA_FINAL_EXAM.passingScore,
          maxAttempts: DEMENTIA_FINAL_EXAM.maxAttempts,
          settings: DEMENTIA_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: DEMENTIA_FINAL_EXAM.slug,
          title: DEMENTIA_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: DEMENTIA_FINAL_EXAM.passingScore,
          maxAttempts: DEMENTIA_FINAL_EXAM.maxAttempts,
          settings: DEMENTIA_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of DEMENTIA_FINAL_EXAM.questions) {
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
