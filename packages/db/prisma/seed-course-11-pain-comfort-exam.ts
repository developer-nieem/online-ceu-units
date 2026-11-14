/**
 * Seed Course 11 FINAL EXAM — Pain Recognition & Comfort Care.
 *
 * Run AFTER the main course seed (seed-course-11-pain-comfort.ts), which creates the
 * NEW course + v1 DRAFT version this exam attaches to.
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-11-pain-comfort-exam
 *
 * Idempotent: find-then-create/update for the assessment and each question (matches the
 * proven seed-course-12-chf-exam.ts pattern — the Assessment and Question models have NO
 * compound unique keys, so we look up by fields and write by id). Safe to re-run.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * COUPLING — MUST MATCH THE MAIN SEED:
 *   COURSE_SLUG    = 'pain-comfort'   (NEW slug — confirmed)
 *   VERSION_NUMBER = 1                (the DRAFT v1 the main seed builds — new course)
 *
 * APPROVED ANSWER KEY (Dr. Cliff): b, b, b, b, b, b, b, b, b, c
 *   Q10 is a "which is NOT the CNA's role" stem — correct answer is C
 *   (diagnosing, clinically rating, or giving pain medications).
 * ─────────────────────────────────────────────────────────────────────────────
 */
import {
  AssessmentKind,
  CourseVersionStatus,
  PrismaClient,
  QuestionType,
} from '@prisma/client';

const TENANT_SLUG = 'cal-ace';
const COURSE_SLUG = 'pain-comfort';
const VERSION_NUMBER = 1;

const PAIN_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — Pain Recognition & Comfort Care',
  kind: AssessmentKind.FINAL_EXAM,
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
      prompt: 'The golden rule of pain care is:',
      options: [
        { id: 'a', label: 'Pain is only real if you can see an injury' },
        { id: 'b', label: 'Pain is whatever the person says it is' },
        { id: 'c', label: 'Elders should expect to hurt' },
        { id: 'd', label: 'Only the nurse can tell if someone is in pain' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A resident who has dementia and cannot speak may show pain through:',
      options: [
        { id: 'a', label: "Nothing — if they can't say it, they aren't in pain" },
        { id: 'b', label: 'Grimacing, guarding a body part, moaning, and new agitation' },
        { id: 'c', label: 'Only a fever' },
        { id: 'd', label: 'Asking for medication clearly' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A resident with dementia is suddenly agitated, grimacing and pulling his arm away when moved, and not eating. The CNA should:',
      options: [
        { id: 'a', label: "Assume it's just the dementia and do nothing" },
        { id: 'b', label: 'Recognize it may be pain and report it to the nurse' },
        { id: 'c', label: 'Force the care through quickly' },
        { id: 'd', label: 'Wait several days' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "A resident says her knee hurts but doesn't look very distressed. The CNA should:",
      options: [
        { id: 'a', label: "Decide she's exaggerating and ignore it" },
        { id: 'b', label: 'Believe her, comfort her, and report her pain to the nurse' },
        { id: 'c', label: "Tell her she's fine" },
        { id: 'd', label: 'Ignore her because she "always says that"' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt: '"Guarding" a body part means the resident is:',
      options: [
        { id: 'a', label: 'Feeling great' },
        { id: 'b', label: 'Protecting, holding, or pulling away from an area that hurts' },
        { id: 'c', label: 'Exercising' },
        { id: 'd', label: 'Asking for food' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Which is a comfort measure a CNA CAN provide?',
      options: [
        { id: 'a', label: 'Giving pain medication' },
        { id: 'b', label: 'Repositioning gently, offering warmth, and a calm presence' },
        { id: 'c', label: 'Diagnosing the pain' },
        { id: 'd', label: 'Prescribing treatment' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Because CNAs do not give pain medication, the CNA's accurate report of pain is:",
      options: [
        { id: 'a', label: 'Not important' },
        { id: 'b', label: "The bridge that gets the resident's pain treated" },
        { id: 'c', label: 'Only needed once a week' },
        { id: 'd', label: "The nurse's job to notice alone" },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "New agitation, refusing care, or not eating in a resident who can't speak is often:",
      options: [
        { id: 'a', label: 'Just bad behavior' },
        { id: 'b', label: 'A possible sign of pain' },
        { id: 'c', label: 'Nothing to consider' },
        { id: 'd', label: 'Always due to hunger only' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Handling residents gently during transfers and care is important because:',
      options: [
        { id: 'a', label: 'It looks nice' },
        { id: 'b', label: 'Much pain happens during care, so gentle handling prevents and eases it' },
        { id: 'c', label: 'It saves time' },
        { id: 'd', label: "It doesn't matter" },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Which is NOT the CNA's role with pain?",
      options: [
        { id: 'a', label: 'Recognizing and believing pain' },
        { id: 'b', label: 'Reporting pain accurately and comforting' },
        { id: 'c', label: 'Diagnosing, clinically rating, or giving pain medications' },
        { id: 'd', label: 'Handling residents gently' },
      ],
      correctAnswer: 'c',
    },
  ],
};

const prisma = new PrismaClient();

async function main() {
  console.log(
    `Seeding Course 11 FINAL EXAM — slug "${COURSE_SLUG}", version ${VERSION_NUMBER}…`,
  );

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
    console.error(`DRAFT course version v${VERSION_NUMBER} not found for: ${COURSE_SLUG}`);
    process.exit(1);
  }

  console.log(
    `Course version ID: ${version.id} (v${version.versionNumber}, status: ${version.status})`,
  );
  console.log(
    `Course status: ${course.status} (unchanged — exam not learner-visible until publish)`,
  );

  const existing = await prisma.assessment.findFirst({
    where: { courseVersionId: version.id, slug: PAIN_FINAL_EXAM.slug, deletedAt: null },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: PAIN_FINAL_EXAM.title,
          kind: PAIN_FINAL_EXAM.kind,
          passingScore: PAIN_FINAL_EXAM.passingScore,
          maxAttempts: PAIN_FINAL_EXAM.maxAttempts,
          settings: PAIN_FINAL_EXAM.settings,
          deletedAt: null,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: PAIN_FINAL_EXAM.slug,
          title: PAIN_FINAL_EXAM.title,
          kind: PAIN_FINAL_EXAM.kind,
          passingScore: PAIN_FINAL_EXAM.passingScore,
          maxAttempts: PAIN_FINAL_EXAM.maxAttempts,
          settings: PAIN_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;
  for (const q of PAIN_FINAL_EXAM.questions) {
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
        },
      });
    }
    questionsUpserted += 1;
  }

  console.log(`Success: seeded final exam for "${course.title}" (${COURSE_SLUG}).`);
  console.log(
    `  Assessment: ${assessment.id} (${assessment.slug}, ${assessment.passingScore}% passing, ${questionsUpserted} questions)`,
  );
  console.log('  Answer key: b,b,b,b,b,b,b,b,b,c');
}

main()
  .catch((error) => {
    console.error('Exam seed failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
