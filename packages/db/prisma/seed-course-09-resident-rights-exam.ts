/**
 * Seed Course 9 FINAL EXAM — Resident Rights & Advocacy.
 *
 * Run AFTER the main course seed (seed-course-09-resident-rights.ts), which creates
 * the course + v2 DRAFT version this exam attaches to.
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-09-resident-rights-exam
 *
 * Idempotent: find-then-create/update for the assessment and each question. Safe to re-run.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * COUPLING — MUST MATCH THE MAIN SEED:
 *   COURSE_SLUG    = 'resident-rights'   (FROZEN — confirmed live)
 *   VERSION_NUMBER = 2                   (the DRAFT v2 the main seed builds)
 *
 * APPROVED ANSWER KEY (Dr. Cliff): b, b, b, b, b, b, b, b, b, c
 *   Q10 is a "which is NOT the CNA's role" stem — correct answer is C
 *   (overriding rights for convenience / restraining without proper orders).
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
const COURSE_SLUG = 'resident-rights';
const VERSION_NUMBER = 2;

const RIGHTS_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — Resident Rights & Advocacy',
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
      sortOrder: 0,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'When a person becomes a resident in a care facility, their rights:',
      options: [
        { id: 'a', label: 'Are given up at the door' },
        { id: 'b', label: 'Stay with them — they keep their rights' },
        { id: 'c', label: 'Belong to the staff now' },
        { id: 'd', label: 'Only apply on weekends' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 1,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "A resident's room should be treated as:",
      options: [
        { id: 'a', label: 'Staff property' },
        { id: 'b', label: 'Their home, where the CNA is a helper and guest' },
        { id: 'c', label: 'A space with no privacy' },
        { id: 'd', label: 'A place to enter anytime' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Before entering a resident's room, the CNA should:",
      options: [
        { id: 'a', label: 'Walk straight in' },
        { id: 'b', label: 'Knock and wait' },
        { id: 'c', label: 'Enter only if the door is open' },
        { id: 'd', label: 'Announce it to the hallway' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'An alert, competent resident refuses his scheduled shower. The CNA should:',
      options: [
        { id: 'a', label: "Force him into the shower since it's scheduled" },
        { id: 'b', label: 'Respect his refusal, explain gently, offer an alternative, and report it' },
        { id: 'c', label: 'Tell him he has no choice' },
        { id: 'd', label: 'Skip his hygiene completely all week' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Honoring a resident's \"autonomy\" means:",
      options: [
        { id: 'a', label: 'Making all their decisions for them' },
        { id: 'b', label: 'Respecting their right to make their own choices' },
        { id: 'c', label: 'Doing everything quickly' },
        { id: 'd', label: 'Ignoring their preferences' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Keeping a resident covered and closing the curtain during care protects their:',
      options: [
        { id: 'a', label: 'Schedule' },
        { id: 'b', label: 'Privacy and dignity' },
        { id: 'c', label: 'Medication' },
        { id: 'd', label: 'Appetite' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Restraints may be used:',
      options: [
        { id: 'a', label: 'Whenever it makes care easier' },
        { id: 'b', label: 'Only in narrow, properly ordered situations — never for convenience or discipline' },
        { id: 'c', label: 'To control a difficult resident' },
        { id: 'd', label: 'Anytime the CNA decides' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "You see a coworker violating residents' privacy and dignity, and the residents stay silent. You should:",
      options: [
        { id: 'a', label: "Leave it alone — it's not your business" },
        { id: 'b', label: 'Advocate — raise the concern through proper channels to the nurse or charge nurse' },
        { id: 'c', label: 'Shame the coworker loudly in front of everyone' },
        { id: 'd', label: 'Start doing the same thing' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt: '"Advocacy" means the CNA should:',
      options: [
        { id: 'a', label: 'Stay quiet to avoid conflict' },
        { id: 'b', label: "Speak up for a resident's rights and wishes, especially when they can't" },
        { id: 'c', label: "Decide what's best and override the resident" },
        { id: 'd', label: 'Only act if the resident insists' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Which is NOT the CNA's role with resident rights?",
      options: [
        { id: 'a', label: 'Honoring dignity, privacy, and choice' },
        { id: 'b', label: 'Advocating and reporting serious violations' },
        { id: 'c', label: 'Overriding rights for convenience or restraining residents without proper orders' },
        { id: 'd', label: "Listening to and supporting residents' complaints" },
      ],
      correctAnswer: 'c',
    },
  ],
};

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
    console.error(`DRAFT course version v${VERSION_NUMBER} not found for: ${COURSE_SLUG}`);
    process.exit(1);
  }

  console.log(
    `Course version ID: ${version.id} (v${version.versionNumber}, status: ${version.status})`,
  );
  console.log(`Course status: ${course.status} (unchanged — exam not learner-visible until publish)`);

  const existing = await prisma.assessment.findFirst({
    where: { courseVersionId: version.id, slug: RIGHTS_FINAL_EXAM.slug, deletedAt: null },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: RIGHTS_FINAL_EXAM.title,
          kind: RIGHTS_FINAL_EXAM.kind,
          passingScore: RIGHTS_FINAL_EXAM.passingScore,
          maxAttempts: RIGHTS_FINAL_EXAM.maxAttempts,
          settings: RIGHTS_FINAL_EXAM.settings,
          deletedAt: null,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: RIGHTS_FINAL_EXAM.slug,
          title: RIGHTS_FINAL_EXAM.title,
          kind: RIGHTS_FINAL_EXAM.kind,
          passingScore: RIGHTS_FINAL_EXAM.passingScore,
          maxAttempts: RIGHTS_FINAL_EXAM.maxAttempts,
          settings: RIGHTS_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of RIGHTS_FINAL_EXAM.questions) {
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
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
