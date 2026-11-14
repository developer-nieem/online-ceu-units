/**
 * Seed the 10-question final exam for Sepsis: Recognition & Early Reporting.
 * Targets the DRAFT course version created by seed-course-06-sepsis-recognition
 * (tenant cal-ace).
 *
 * Run: pnpm --filter @calace/db db:seed-course-06-sepsis-recognition-exam
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * MUST MATCH seed-course-06-sepsis-recognition.ts (confirmed against live DB):
 *   COURSE_SLUG    = 'sepsis-recognition'  (NEW course — slug confirmed free)
 *   VERSION_NUMBER = 1                     (brand-new course → first version)
 * Run order: the main seed FIRST (creates the course + v1), then this exam.
 * Both are DRAFT-only.
 *
 * Questions approved by Dr. Cliff (package: course-06-sepsis-recognition, "FINAL
 * QUIZ — 10 QUESTIONS"). NATCEP-style: single choice, 4 options, 80% to pass,
 * 3 attempts, randomized. Sepsis recognition, time-criticality, advocacy, scope focus.
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

// CONFIRMED against live DB — must equal COURSE_SLUG in the main seed. NEW course slug.
const COURSE_SLUG = 'sepsis-recognition';

// CONFIRMED against live DB — must equal VERSION_NUMBER in the main seed.
const VERSION_NUMBER = 1;

const SEPSIS_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — Sepsis: Recognition & Early Reporting',
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
      prompt: 'Sepsis is:',
      options: [
        { id: 'a', label: 'A mild skin rash' },
        { id: 'b', label: 'The body\'s extreme, life-threatening response to an infection' },
        { id: 'c', label: 'A normal part of aging' },
        { id: 'd', label: 'A type of medication' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Sepsis always starts with:',
      options: [
        { id: 'a', label: 'A fall' },
        { id: 'b', label: 'An infection somewhere in the body' },
        { id: 'c', label: 'A change in diet' },
        { id: 'd', label: 'Nothing — it comes from nowhere' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'In older adults, an early sign of sepsis is often:',
      options: [
        { id: 'a', label: 'Feeling more energetic' },
        { id: 'b', label: 'New confusion or "not being themselves"' },
        { id: 'c', label: 'Improved appetite' },
        { id: 'd', label: 'Sleeping normally' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A resident treated for a UTI days ago is now suddenly confused, drowsy, breathing fast, with clammy mottled skin — but no fever. The CNA should:',
      options: [
        { id: 'a', label: 'Let them rest since there\'s no fever' },
        { id: 'b', label: 'Report it to the nurse immediately as possible sepsis' },
        { id: 'c', label: 'Wait until the end of rounds' },
        { id: 'd', label: 'Give food and say nothing' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'True or false: a resident can have serious sepsis even without a high fever.',
      options: [
        { id: 'a', label: 'False — no fever means no sepsis' },
        { id: 'b', label: 'True — elders often have little, no, or even low temperature with sepsis' },
        { id: 'c', label: 'True, but only for young people' },
        { id: 'd', label: 'False — fever is always present' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'With sepsis, why does speed matter so much?',
      options: [
        { id: 'a', label: 'It doesn\'t — it can wait' },
        { id: 'b', label: 'Every hour of delayed treatment raises the risk of death' },
        { id: 'c', label: 'Only the paperwork is urgent' },
        { id: 'd', label: 'It only matters at night' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'When a CNA suspects sepsis, they should report:',
      options: [
        { id: 'a', label: 'At the end of their shift' },
        { id: 'b', label: 'Immediately and urgently — naming the sepsis concern' },
        { id: 'c', label: 'Only if the resident asks' },
        { id: 'd', label: 'After lunch' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'You reported a possible-sepsis resident, but he\'s now visibly worse and the nurse hasn\'t come yet. You should:',
      options: [
        { id: 'a', label: 'Wait quietly since you already reported once' },
        { id: 'b', label: 'Go back immediately, say he\'s worse and you\'re worried about sepsis, and make sure he\'s seen now' },
        { id: 'c', label: 'Decide it\'s not your place to push' },
        { id: 'd', label: 'Leave and check much later' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Which residents are at HIGHEST risk for sepsis?',
      options: [
        { id: 'a', label: 'Young, healthy visitors' },
        { id: 'b', label: 'The very old, chronically ill, and those with infections, wounds, or devices' },
        { id: 'c', label: 'Only residents who are already in the hospital' },
        { id: 'd', label: 'No one in long-term care' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Which is NOT the CNA\'s role with sepsis?',
      options: [
        { id: 'a', label: 'Preventing infections that cause it' },
        { id: 'b', label: 'Recognizing early signs and reporting immediately' },
        { id: 'c', label: 'Diagnosing, scoring, or treating the sepsis' },
        { id: 'd', label: 'Supporting the resident during the response' },
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
        `Run seed-course-06-sepsis-recognition.ts first, and confirm VERSION_NUMBER matches.`,
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
    where: { courseVersionId: version.id, slug: SEPSIS_FINAL_EXAM.slug, deletedAt: null },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: SEPSIS_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: SEPSIS_FINAL_EXAM.passingScore,
          maxAttempts: SEPSIS_FINAL_EXAM.maxAttempts,
          settings: SEPSIS_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: SEPSIS_FINAL_EXAM.slug,
          title: SEPSIS_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: SEPSIS_FINAL_EXAM.passingScore,
          maxAttempts: SEPSIS_FINAL_EXAM.maxAttempts,
          settings: SEPSIS_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of SEPSIS_FINAL_EXAM.questions) {
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
