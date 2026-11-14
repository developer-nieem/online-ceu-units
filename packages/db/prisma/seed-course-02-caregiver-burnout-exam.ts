/**
 * Seed the 10-question final exam for Caregiver Burnout & Compassion Fatigue.
 * Targets the DRAFT course version created by seed-course-02-caregiver-burnout
 * (tenant cal-ace).
 *
 * Run: pnpm --filter @calace/db db:seed-course-02-caregiver-burnout-exam
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * MUST MATCH seed-course-02-caregiver-burnout.ts (confirmed against live DB):
 *   COURSE_SLUG    = 'stress-management'  (FROZEN — course already live)
 *   VERSION_NUMBER = 2                    (MAX existing version is v1 PUBLISHED)
 * Run order: the main seed FIRST (creates the v2 version), then this exam.
 * Both are DRAFT-only.
 *
 * Questions approved by Dr. Cliff (package: course-02-caregiver-burnout, "FINAL
 * QUIZ — 10 QUESTIONS"). NATCEP-style: single choice, 4 options, 80% to pass,
 * 3 attempts, randomized. Self-care, recognition & help-seeking focus.
 *
 * SENSITIVE CONTENT: Q8 addresses suicidal thoughts. It is framed as "reach out
 * now / 988", with NO method content. Preserve this framing exactly.
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
const COURSE_SLUG = 'stress-management';

// CONFIRMED against live DB — must equal VERSION_NUMBER in the main seed.
const VERSION_NUMBER = 2;

const BURNOUT_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — Caregiver Burnout & Compassion Fatigue',
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
      prompt: 'Burnout is:',
      options: [
        { id: 'a', label: 'A sign you are weak or bad at your job' },
        { id: 'b', label: 'Deep exhaustion from long-term work stress — a normal response, not weakness' },
        { id: 'c', label: 'Something only lazy people get' },
        { id: 'd', label: 'Always your own fault' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Compassion fatigue comes from:',
      options: [
        { id: 'a', label: 'Not caring about your job' },
        { id: 'b', label: 'The cost of caring — absorbing others\' suffering day after day' },
        { id: 'c', label: 'Taking too many breaks' },
        { id: 'd', label: 'Being new to the job' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt: '"You can\'t pour from an empty cup" means:',
      options: [
        { id: 'a', label: 'CNAs should not drink water' },
        { id: 'b', label: 'You must care for yourself to be able to care for others' },
        { id: 'c', label: 'You should work more shifts' },
        { id: 'd', label: 'Self-care is selfish' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Which is a HEALTHY way to cope with stress?',
      options: [
        { id: 'a', label: 'Drinking too much every night' },
        { id: 'b', label: 'Bottling everything up' },
        { id: 'c', label: 'Resting, talking to someone you trust, and taking breaks' },
        { id: 'd', label: 'Isolating from everyone' },
      ],
      correctAnswer: 'c',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Asking for help when you are struggling is:',
      options: [
        { id: 'a', label: 'A sign of weakness' },
        { id: 'b', label: 'A strength — and sometimes lifesaving' },
        { id: 'c', label: 'Something to be ashamed of' },
        { id: 'd', label: 'Only for serious failures' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Which is an early sign of burnout in yourself?',
      options: [
        { id: 'a', label: 'Feeling well-rested and happy' },
        { id: 'b', label: 'Feeling exhausted, numb, and dreading work' },
        { id: 'c', label: 'Enjoying your shifts more' },
        { id: 'd', label: 'Having more energy' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'You notice a coworker is exhausted, withdrawn, and snapping at people, and they say they "can\'t keep doing this." You should:',
      options: [
        { id: 'a', label: 'Tell them to toughen up' },
        { id: 'b', label: 'Check in kindly, listen without judgment, and encourage them to get support' },
        { id: 'c', label: 'Mind your own business' },
        { id: 'd', label: 'Report them for being weak' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'You have felt hopeless for weeks and have had thoughts that others would be better off without you. You should:',
      options: [
        { id: 'a', label: 'Push through alone and tell no one' },
        { id: 'b', label: 'Reach out for help now — talk to someone you trust or call or text 988' },
        { id: 'c', label: 'Just wait for it to pass' },
        { id: 'd', label: 'Have a few drinks to cope' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Burnout and compassion fatigue often affect:',
      options: [
        { id: 'a', label: 'Only weak caregivers' },
        { id: 'b', label: 'The most caring and dedicated caregivers, because they give so much' },
        { id: 'c', label: 'No one who really tries' },
        { id: 'd', label: 'Only new caregivers' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Taking care of your own wellbeing as a caregiver is:',
      options: [
        { id: 'a', label: 'Selfish and unprofessional' },
        { id: 'b', label: 'Part of being able to care for others' },
        { id: 'c', label: 'A waste of time' },
        { id: 'd', label: 'Only okay when you are off work' },
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
    console.error(
      `DRAFT course version v${VERSION_NUMBER} not found for: ${COURSE_SLUG}. ` +
        `Run seed-course-02-caregiver-burnout.ts first, and confirm VERSION_NUMBER matches.`,
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
    where: { courseVersionId: version.id, slug: BURNOUT_FINAL_EXAM.slug, deletedAt: null },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: BURNOUT_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: BURNOUT_FINAL_EXAM.passingScore,
          maxAttempts: BURNOUT_FINAL_EXAM.maxAttempts,
          settings: BURNOUT_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: BURNOUT_FINAL_EXAM.slug,
          title: BURNOUT_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: BURNOUT_FINAL_EXAM.passingScore,
          maxAttempts: BURNOUT_FINAL_EXAM.maxAttempts,
          settings: BURNOUT_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of BURNOUT_FINAL_EXAM.questions) {
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
