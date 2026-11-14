/**
 * Seed the 10-question final exam for Aphasia & Communication Disorders.
 * Targets the DRAFT course version created by seed-course-01-aphasia (tenant cal-ace).
 *
 * Run: pnpm --filter @calace/db db:seed-course-01-aphasia-exam
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ MUST MATCH seed-course-01-aphasia.ts BEFORE RUNNING:
 *
 *   1. COURSE_SLUG — must be IDENTICAL to the COURSE_SLUG in seed-course-01-aphasia.ts.
 *      The course is already live; the slug is FROZEN. Confirm the real live slug
 *      from the repo. (Likely 'communication-skills' — the former "Communication
 *      Skills in Long-Term Care".)
 *
 *   2. VERSION_NUMBER — must be IDENTICAL to the VERSION_NUMBER in seed-course-01-aphasia.ts.
 *      The main seed publishes as a NEW version (default 2). This exam attaches to
 *      THAT version. If the numbers don't match, this script will fail with
 *      "DRAFT course version not found". Confirm and keep both files in lockstep.
 *
 *   Run order: seed-course-01-aphasia.ts FIRST (creates the version), then this exam.
 *   Both are DRAFT-only and gated on the Neon migration-drift heal. DO NOT RUN until
 *   the slug + version are confirmed and the drift is resolved.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Questions approved by Dr. Cliff (package: course-01-aphasia, "FINAL QUIZ — 10
 * QUESTIONS (NATCEP STYLE)"). NATCEP-style: single choice, 4 options, 80% to pass,
 * 3 attempts, randomized. Entry-level CNA, short stems, ESL-friendly, judgment &
 * scope focus.
 */
import {
  AssessmentKind,
  CourseVersionStatus,
  PrismaClient,
  QuestionType,
} from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';

// ⚠️ CONFIRM — must equal COURSE_SLUG in seed-course-01-aphasia.ts. FROZEN slug.
const COURSE_SLUG = 'communication-skills';

// ⚠️ CONFIRMED against live DB — must match seed-course-01-aphasia.ts (slug confirmed; version 4).
const VERSION_NUMBER = 4;

const APHASIA_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — Aphasia & Communication Disorders',
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
      prompt: 'Aphasia means a person has lost their:',
      options: [
        { id: 'a', label: 'Intelligence' },
        { id: 'b', label: 'Ability to use language — but the mind is usually still okay' },
        { id: 'c', label: 'Hearing' },
        { id: 'd', label: 'Memory of family' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A resident with aphasia is usually:',
      options: [
        { id: 'a', label: 'Not aware of anything' },
        { id: 'b', label: 'Still intelligent and aware — they just can\'t get the words out' },
        { id: 'c', label: 'Choosing not to talk' },
        { id: 'd', label: 'Hard of hearing' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'When a resident with aphasia is trying to find a word, the CNA should:',
      options: [
        { id: 'a', label: 'Finish the word for them quickly' },
        { id: 'b', label: 'Give them time and not rush them' },
        { id: 'c', label: 'Tell them to hurry' },
        { id: 'd', label: 'Walk away' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'The best way to talk to a resident with aphasia is:',
      options: [
        { id: 'a', label: 'Use baby talk' },
        { id: 'b', label: 'Shout so they understand' },
        { id: 'c', label: 'Face them and speak slowly and simply in a normal adult voice' },
        { id: 'd', label: 'Talk to their family instead' },
      ],
      correctAnswer: 'c',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'If a resident has trouble saying words, the CNA can help by:',
      options: [
        { id: 'a', label: 'Asking yes-or-no questions and using pictures or gestures' },
        { id: 'b', label: 'Only using long sentences' },
        { id: 'c', label: 'Refusing to communicate' },
        { id: 'd', label: 'Talking faster' },
      ],
      correctAnswer: 'a',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Dysarthria means a resident\'s speech is slurred or weak because of:',
      options: [
        { id: 'a', label: 'Low intelligence' },
        { id: 'b', label: 'Weak speech muscles — their thinking is fine' },
        { id: 'c', label: 'Not trying hard enough' },
        { id: 'd', label: 'Being deaf' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A resident suddenly has slurred speech, can\'t find words, and one side of the face is droopy. The CNA should:',
      options: [
        { id: 'a', label: 'Let them rest and check later' },
        { id: 'b', label: 'Get emergency help right away — these are stroke signs' },
        { id: 'c', label: 'Wait until the next meal' },
        { id: 'd', label: 'Tell them to speak clearly' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A resident with aphasia cannot talk but is grimacing and holding their belly. The CNA should:',
      options: [
        { id: 'a', label: 'Think it is just their normal behavior' },
        { id: 'b', label: 'Report it — this may be pain they cannot put into words' },
        { id: 'c', label: 'Wait a few days' },
        { id: 'd', label: 'Make them say what hurts first' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Talking about a resident with aphasia as if they are "not there" is:',
      options: [
        { id: 'a', label: 'Fine, since they can\'t talk back' },
        { id: 'b', label: 'A harmful mistake — they usually understand and feel it' },
        { id: 'c', label: 'The safest thing to do' },
        { id: 'd', label: 'Required' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Which task is NOT the CNA\'s job?',
      options: [
        { id: 'a', label: 'Using picture boards and being patient' },
        { id: 'b', label: 'Watching for and reporting unspoken pain' },
        { id: 'c', label: 'Diagnosing the disorder or doing speech therapy' },
        { id: 'd', label: 'Reporting a sudden speech change' },
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
        `Run seed-course-01-aphasia.ts first, and confirm VERSION_NUMBER matches.`,
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
    where: { courseVersionId: version.id, slug: APHASIA_FINAL_EXAM.slug, deletedAt: null },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: APHASIA_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: APHASIA_FINAL_EXAM.passingScore,
          maxAttempts: APHASIA_FINAL_EXAM.maxAttempts,
          settings: APHASIA_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: APHASIA_FINAL_EXAM.slug,
          title: APHASIA_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: APHASIA_FINAL_EXAM.passingScore,
          maxAttempts: APHASIA_FINAL_EXAM.maxAttempts,
          settings: APHASIA_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of APHASIA_FINAL_EXAM.questions) {
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
