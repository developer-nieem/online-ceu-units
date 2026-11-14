/**
 * Seed Course 10 FINAL EXAM — Legal & Ethical Issues in Nursing Practice.
 *
 * Run AFTER the main course seed (seed-course-10-legal-ethical.ts), which creates the
 * course + v2 DRAFT version this exam attaches to.
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-10-legal-ethical-exam
 *
 * Idempotent: find-then-create/update for the assessment and each question (matches the
 * proven seed-course-12-chf-exam.ts pattern — the Assessment and Question models have NO
 * compound unique keys, so we look up by fields and write by id). Safe to re-run.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * COUPLING — MUST MATCH THE MAIN SEED:
 *   COURSE_SLUG    = 'legal-ethical-nursing-practice'   (FROZEN — confirmed live)
 *   VERSION_NUMBER = 2                                  (the DRAFT v2 the main seed builds)
 *
 * APPROVED ANSWER KEY (Dr. Cliff): b, b, b, b, b, b, b, b, b, c
 *   Q10 is a "which is NOT the CNA's role" stem — correct answer is C
 *   (making medical or legal decisions / deciding a resident's code status).
 * ─────────────────────────────────────────────────────────────────────────────
 */
import {
  AssessmentKind,
  CourseVersionStatus,
  PrismaClient,
  QuestionType,
} from '@prisma/client';

const TENANT_SLUG = 'cal-ace';
const COURSE_SLUG = 'legal-ethical-nursing-practice';
const VERSION_NUMBER = 2;

const LEGAL_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — Legal & Ethical Issues in Nursing Practice',
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
      prompt: '"Scope of practice" means:',
      options: [
        { id: 'a', label: 'Anything a CNA is willing to try' },
        { id: 'b', label: 'The tasks a CNA is trained, certified, and allowed to do — and the line not to cross' },
        { id: 'c', label: 'Whatever the team needs that day' },
        { id: 'd', label: 'Only what the resident asks for' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A coworker asks you to give a resident their medications because the unit is short-staffed. You should:',
      options: [
        { id: 'a', label: 'Give them since it helps the team' },
        { id: 'b', label: "Respectfully decline — it's outside your scope — and tell the nurse they're due" },
        { id: 'c', label: 'Give them secretly' },
        { id: 'd', label: 'Give them and chart that the nurse did it' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Protecting a resident's private health information is:",
      options: [
        { id: 'a', label: 'Optional' },
        { id: 'b', label: 'Both a legal duty and a matter of trust' },
        { id: 'c', label: "Only the nurse's job" },
        { id: 'd', label: 'Fine to share on social media' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Which is a confidentiality breach?',
      options: [
        { id: 'a', label: 'Sharing information only with those who need it for care' },
        { id: 'b', label: 'Posting about a resident on social media' },
        { id: 'c', label: 'Keeping records private' },
        { id: 'd', label: 'Lowering your voice about residents' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A competent resident refuses care. The CNA should:',
      options: [
        { id: 'a', label: 'Force the care anyway' },
        { id: 'b', label: 'Explain gently, respect the refusal, and report it' },
        { id: 'c', label: 'Ignore the refusal' },
        { id: 'd', label: 'Tell them they have no choice' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "A resident's DNR or advance directive is decided by:",
      options: [
        { id: 'a', label: 'The CNA' },
        { id: 'b', label: 'The resident and their doctor — the CNA follows the care plan' },
        { id: 'c', label: 'Whoever is on shift' },
        { id: 'd', label: 'The family alone, on the spot' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt: '"If it wasn\'t documented, it wasn\'t done" means:',
      options: [
        { id: 'a', label: "Documentation doesn't matter" },
        { id: 'b', label: 'You should record the care you give, accurately and honestly' },
        { id: 'c', label: 'You can chart whatever is easiest' },
        { id: 'd', label: 'Only nurses document' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'You forgot a required task on a busy shift. You should:',
      options: [
        { id: 'a', label: 'Chart that you did it on time anyway' },
        { id: 'b', label: 'Document honestly what happened and report the missed care to the nurse' },
        { id: 'c', label: 'Chart nothing and hope no one notices' },
        { id: 'd', label: 'Change an earlier record to cover it' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Falsifying a record — charting care you didn't give — is:",
      options: [
        { id: 'a', label: 'Fine if you were busy' },
        { id: 'b', label: 'A serious legal and ethical violation that can harm residents' },
        { id: 'c', label: 'Expected when short-staffed' },
        { id: 'd', label: 'Better than admitting a mistake' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Which is NOT the CNA's role?",
      options: [
        { id: 'a', label: 'Staying in scope and protecting confidentiality' },
        { id: 'b', label: 'Documenting honestly and acting with integrity' },
        { id: 'c', label: "Making medical or legal decisions or deciding a resident's code status" },
        { id: 'd', label: 'Reporting concerns through proper channels' },
      ],
      correctAnswer: 'c',
    },
  ],
};

const prisma = new PrismaClient();

async function main() {
  console.log(
    `Seeding Course 10 FINAL EXAM — slug "${COURSE_SLUG}", version ${VERSION_NUMBER}…`,
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
    where: { courseVersionId: version.id, slug: LEGAL_FINAL_EXAM.slug, deletedAt: null },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: LEGAL_FINAL_EXAM.title,
          kind: LEGAL_FINAL_EXAM.kind,
          passingScore: LEGAL_FINAL_EXAM.passingScore,
          maxAttempts: LEGAL_FINAL_EXAM.maxAttempts,
          settings: LEGAL_FINAL_EXAM.settings,
          deletedAt: null,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: LEGAL_FINAL_EXAM.slug,
          title: LEGAL_FINAL_EXAM.title,
          kind: LEGAL_FINAL_EXAM.kind,
          passingScore: LEGAL_FINAL_EXAM.passingScore,
          maxAttempts: LEGAL_FINAL_EXAM.maxAttempts,
          settings: LEGAL_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;
  for (const q of LEGAL_FINAL_EXAM.questions) {
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
