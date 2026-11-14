/**
 * Seed the 10-question final exam for Falls, Immobility & Deconditioning.
 * Targets the DRAFT course version created by seed-course-03-falls-immobility
 * (tenant cal-ace).
 *
 * Run: pnpm --filter @calace/db db:seed-course-03-falls-immobility-exam
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * MUST MATCH seed-course-03-falls-immobility.ts (confirmed against live DB):
 *   COURSE_SLUG    = 'mobility-safety'  (FROZEN — course already live)
 *   VERSION_NUMBER = 5                  (Targets v5 DRAFT — editable.
 *                                        v4 is LIVE PUBLISHED (cert XSRFRQ);
 *                                        v2 RETIRED holds 3 certs — NEVER target v2.)
 * Run order: the main seed FIRST (writes v5 DRAFT), then this exam.
 * Both are DRAFT-only.
 *
 * Questions approved by Dr. Cliff (package: course-03-falls-immobility, "FINAL
 * QUIZ — 10 QUESTIONS"). NATCEP-style: single choice, 4 options, 80% to pass,
 * 3 attempts, randomized. Fall response, safe transfer, scope focus.
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
const COURSE_SLUG = 'mobility-safety';

// CONFIRMED against live DB — must equal VERSION_NUMBER in the main seed (v5 DRAFT).
const VERSION_NUMBER = 5;

const FALLS_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — Falls, Immobility & Deconditioning',
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
      prompt: 'You find a resident on the floor after a fall. The FIRST rule is:',
      options: [
        { id: 'a', label: 'Lift them into bed quickly' },
        { id: 'b', label: 'Do NOT move them — stay, call the nurse, and keep them still' },
        { id: 'c', label: 'Help them stand to test their legs' },
        { id: 'd', label: 'Leave to find help' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'After a fall, a resident\'s leg looks shorter and turned outward, and her hip hurts. This may be:',
      options: [
        { id: 'a', label: 'Nothing important' },
        { id: 'b', label: 'A hip fracture — do not move her, and report it' },
        { id: 'c', label: 'A reason to walk her' },
        { id: 'd', label: 'Normal aging' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A resident falls but says they feel fine, with no injury you can see. The CNA should:',
      options: [
        { id: 'a', label: 'Not report it since they\'re fine' },
        { id: 'b', label: 'Report the fall anyway — every fall is reported, every time' },
        { id: 'c', label: 'Keep it quiet to avoid paperwork' },
        { id: 'd', label: 'Wait until tomorrow' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'To help a weak resident stand or walk, the CNA should use:',
      options: [
        { id: 'a', label: 'A grip under their arms' },
        { id: 'b', label: 'A gait belt, snug around the waist, with an underhand grip' },
        { id: 'c', label: 'Their clothing as a handle' },
        { id: 'd', label: 'One quick pull by the hands' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Before a wheelchair transfer, the CNA should:',
      options: [
        { id: 'a', label: 'Leave the wheels unlocked for easy movement' },
        { id: 'b', label: 'Lock the wheels, bring the chair close, and put proper footwear on the resident' },
        { id: 'c', label: 'Hurry to save time' },
        { id: 'd', label: 'Let the resident jump across' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'To protect against dizziness when a resident gets up, the CNA should have them:',
      options: [
        { id: 'a', label: 'Stand up as fast as possible' },
        { id: 'b', label: 'Rise slowly in stages — sit up, pause, sit at the edge, pause, then stand' },
        { id: 'c', label: 'Skip sitting and go straight to walking' },
        { id: 'd', label: 'Hold their breath' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Good body mechanics means the CNA should:',
      options: [
        { id: 'a', label: 'Bend at the waist and twist while lifting' },
        { id: 'b', label: 'Keep a wide base, bend the knees, keep the resident close, and not twist' },
        { id: 'c', label: 'Lift alone no matter how heavy' },
        { id: 'd', label: 'Keep the load far from the body' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A resident who stays in bed all day, every day, will likely:',
      options: [
        { id: 'a', label: 'Get stronger from the rest' },
        { id: 'b', label: 'Become weaker, stiffer, and at higher risk of falls and skin breakdown' },
        { id: 'c', label: 'Have no changes' },
        { id: 'd', label: 'Need less help over time' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt: '"Movement is medicine" means the CNA should:',
      options: [
        { id: 'a', label: 'Do everything for residents to be faster' },
        { id: 'b', label: 'Encourage residents to do what they can and support walks and activity' },
        { id: 'c', label: 'Keep residents in bed for safety' },
        { id: 'd', label: 'Skip repositioning' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Which is NOT the CNA\'s job?',
      options: [
        { id: 'a', label: 'Keeping paths clear and call lights in reach' },
        { id: 'b', label: 'Using gait belts and safe transfers' },
        { id: 'c', label: 'Diagnosing injuries or moving a fallen resident before the nurse assesses' },
        { id: 'd', label: 'Reporting every fall and near-fall' },
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
        `Run seed-course-03-falls-immobility.ts first, and confirm VERSION_NUMBER matches.`,
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
    where: { courseVersionId: version.id, slug: FALLS_FINAL_EXAM.slug, deletedAt: null },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: FALLS_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: FALLS_FINAL_EXAM.passingScore,
          maxAttempts: FALLS_FINAL_EXAM.maxAttempts,
          settings: FALLS_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: FALLS_FINAL_EXAM.slug,
          title: FALLS_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: FALLS_FINAL_EXAM.passingScore,
          maxAttempts: FALLS_FINAL_EXAM.maxAttempts,
          settings: FALLS_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of FALLS_FINAL_EXAM.questions) {
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
