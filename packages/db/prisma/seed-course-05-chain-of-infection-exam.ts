/**
 * Seed the 10-question final exam for The Chain of Infection & Standard Precautions.
 * Targets the DRAFT course version created by seed-course-05-chain-of-infection
 * (tenant cal-ace).
 *
 * Run: pnpm --filter @calace/db db:seed-course-05-chain-of-infection-exam
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * MUST MATCH seed-course-05-chain-of-infection.ts (confirmed against live DB):
 *   COURSE_SLUG    = 'infection-control'  (FROZEN — course already live)
 *   VERSION_NUMBER = 2                    (MAX existing version is v1 PUBLISHED)
 * NOTE: a separate course 'infection-control-prevention' also exists — NOT this target.
 * Run order: the main seed FIRST (creates the v2 version), then this exam.
 * Both are DRAFT-only.
 *
 * Questions approved by Dr. Cliff (package: course-05-chain-of-infection, "FINAL
 * QUIZ — 10 QUESTIONS"). NATCEP-style: single choice, 4 options, 80% to pass,
 * 3 attempts, randomized. Chain, hand hygiene, standard precautions, scope focus.
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
const COURSE_SLUG = 'infection-control';

// CONFIRMED against live DB — must equal VERSION_NUMBER in the main seed.
const VERSION_NUMBER = 2;

const INFECTION_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — The Chain of Infection & Standard Precautions',
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
      prompt: 'The "chain of infection" describes:',
      options: [
        { id: 'a', label: 'A type of medication' },
        { id: 'b', label: 'The links a germ needs to spread — break one link and it stops' },
        { id: 'c', label: 'A cleaning schedule' },
        { id: 'd', label: 'A kind of PPE' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'The single most important way to prevent the spread of infection is:',
      options: [
        { id: 'a', label: 'Wearing a gown' },
        { id: 'b', label: 'Hand hygiene — clean hands at the right times' },
        { id: 'c', label: 'Opening windows' },
        { id: 'd', label: 'Taking vitamins' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt: '"Standard precautions" means the CNA should:',
      options: [
        { id: 'a', label: 'Use protections only for residents known to be infected' },
        { id: 'b', label: 'Use the basic protections with every resident, every time' },
        { id: 'c', label: 'Skip gloves to save time' },
        { id: 'd', label: 'Wait for the doctor\'s order each time' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'You just gave incontinence care with gloves and need to help the next resident. You should:',
      options: [
        { id: 'a', label: 'Keep the same gloves on to save time' },
        { id: 'b', label: 'Remove the gloves, clean your hands, and put on fresh gloves' },
        { id: 'c', label: 'Wipe the gloves with sanitizer and reuse them' },
        { id: 'd', label: 'Skip gloves for the next resident' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Gloves are:',
      options: [
        { id: 'a', label: 'A replacement for hand hygiene' },
        { id: 'b', label: 'Not a substitute for hand hygiene — clean your hands before and after' },
        { id: 'c', label: 'Only for the nurse' },
        { id: 'd', label: 'Reusable between residents' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'When should the CNA use soap and water instead of hand sanitizer?',
      options: [
        { id: 'a', label: 'Never' },
        { id: 'b', label: 'When hands are visibly dirty or soiled with body fluids' },
        { id: 'c', label: 'Only at the start of the shift' },
        { id: 'd', label: 'Only when wearing gloves' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'When removing PPE such as gloves and a gown, the CNA should:',
      options: [
        { id: 'a', label: 'Touch the dirty outer surfaces freely' },
        { id: 'b', label: 'Remove it carefully without touching the dirty outside, then clean their hands' },
        { id: 'c', label: 'Leave it on for the next resident' },
        { id: 'd', label: 'Shake it out first' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A normally alert elderly resident is suddenly confused, weak, and has cloudy, foul-smelling urine, but no fever. The CNA should:',
      options: [
        { id: 'a', label: 'Assume it\'s nothing since there\'s no fever' },
        { id: 'b', label: 'Report it to the nurse — it may be an infection, even without a fever' },
        { id: 'c', label: 'Wait several days' },
        { id: 'd', label: 'Give fluids and tell no one' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Soiled linens should be:',
      options: [
        { id: 'a', label: 'Shaken out to loosen them' },
        { id: 'b', label: 'Held away from the body, not shaken, and bagged as directed' },
        { id: 'c', label: 'Piled on the floor' },
        { id: 'd', label: 'Carried against your scrubs' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Which is NOT the CNA\'s job in infection control?',
      options: [
        { id: 'a', label: 'Hand hygiene and standard precautions' },
        { id: 'b', label: 'Using PPE and cleaning surfaces' },
        { id: 'c', label: 'Diagnosing infections or deciding isolation orders' },
        { id: 'd', label: 'Reporting signs of infection' },
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
        `Run seed-course-05-chain-of-infection.ts first, and confirm VERSION_NUMBER matches.`,
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
    where: { courseVersionId: version.id, slug: INFECTION_FINAL_EXAM.slug, deletedAt: null },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: INFECTION_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: INFECTION_FINAL_EXAM.passingScore,
          maxAttempts: INFECTION_FINAL_EXAM.maxAttempts,
          settings: INFECTION_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: INFECTION_FINAL_EXAM.slug,
          title: INFECTION_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: INFECTION_FINAL_EXAM.passingScore,
          maxAttempts: INFECTION_FINAL_EXAM.maxAttempts,
          settings: INFECTION_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of INFECTION_FINAL_EXAM.questions) {
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
