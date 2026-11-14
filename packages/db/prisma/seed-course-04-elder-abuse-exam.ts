/**
 * Seed the 10-question final exam for Elder Abuse & Neglect: Recognition & Reporting.
 * Targets the DRAFT course version created by seed-course-04-elder-abuse
 * (tenant cal-ace).
 *
 * Run: pnpm --filter @calace/db db:seed-course-04-elder-abuse-exam
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * MUST MATCH seed-course-04-elder-abuse.ts (confirmed against live DB):
 *   COURSE_SLUG    = 'elder-abuse-reporting'  (FROZEN — course already live)
 *   VERSION_NUMBER = 2                         (MAX existing version is v1 PUBLISHED)
 * Run order: the main seed FIRST (creates the v2 version), then this exam.
 * Both are DRAFT-only.
 *
 * Questions approved by Dr. Cliff (package: course-04-elder-abuse-reporting, "FINAL
 * QUIZ — 10 QUESTIONS"). NATCEP-style: single choice, 4 options, 80% to pass,
 * 3 attempts, randomized. Mandated-reporter duty, recognition, scope focus.
 * Answer key: b,b,b,b,b,b,b,c,b,b
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
const COURSE_SLUG = 'elder-abuse-reporting';

// CONFIRMED against live DB — must equal VERSION_NUMBER in the main seed.
const VERSION_NUMBER = 2;

const ABUSE_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — Elder Abuse & Neglect: Recognition & Reporting',
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
      prompt: 'As a CNA, you are a "mandated reporter." This means you:',
      options: [
        { id: 'a', label: 'May report abuse if you feel like it' },
        { id: 'b', label: 'Are required by law to report suspected abuse and neglect' },
        { id: 'c', label: 'Only report if you have proof' },
        { id: 'd', label: 'Should let someone else handle it' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'To report suspected abuse, you need:',
      options: [
        { id: 'a', label: 'Solid proof and certainty' },
        { id: 'b', label: 'Only a reasonable suspicion — you do not need to prove it' },
        { id: 'c', label: 'The abuser\'s permission' },
        { id: 'd', label: 'To investigate it first' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Neglect is:',
      options: [
        { id: 'a', label: 'Not a real form of harm' },
        { id: 'b', label: 'Failing to provide needed care — and it can be as harmful as active abuse' },
        { id: 'c', label: 'Only a problem if the resident complains' },
        { id: 'd', label: 'Never reportable' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'You notice grip-mark bruises on a resident and she seems frightened but says she\'s "just clumsy." You should:',
      options: [
        { id: 'a', label: 'Accept her answer and say nothing' },
        { id: 'b', label: 'Report your concern to the nurse or charge nurse right away' },
        { id: 'c', label: 'Investigate who did it yourself' },
        { id: 'd', label: 'Wait to see if more bruises appear' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'When a resident tells you about abuse, the CNA should:',
      options: [
        { id: 'a', label: 'Doubt them and interrogate them for proof' },
        { id: 'b', label: 'Listen calmly, take them seriously, reassure them, and report' },
        { id: 'c', label: 'Promise to keep it a secret' },
        { id: 'd', label: 'Tell them they must be confused' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'You see a coworker roughly handling a resident. You should:',
      options: [
        { id: 'a', label: 'Keep it between you, like they asked' },
        { id: 'b', label: 'Report what you saw to the nurse or charge nurse immediately' },
        { id: 'c', label: 'Ignore it if the resident wasn\'t badly hurt' },
        { id: 'd', label: 'Confront and accuse the coworker on the spot' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Who should a CNA report suspected abuse to first?',
      options: [
        { id: 'a', label: 'The suspected abuser' },
        { id: 'b', label: 'The nurse or charge nurse' },
        { id: 'c', label: 'No one, unless asked' },
        { id: 'd', label: 'The resident\'s family' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Which is something a CNA should NEVER do with suspected abuse?',
      options: [
        { id: 'a', label: 'Report it to the nurse' },
        { id: 'b', label: 'Protect and support the resident' },
        { id: 'c', label: 'Confront the suspected abuser or stay silent' },
        { id: 'd', label: 'Notice the signs' },
      ],
      correctAnswer: 'c',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Which residents are at HIGHEST risk of abuse and need the closest watching?',
      options: [
        { id: 'a', label: 'Only new residents' },
        { id: 'b', label: 'Those who are confused, can\'t communicate, isolated, or very dependent' },
        { id: 'c', label: 'Residents who have many visitors' },
        { id: 'd', label: 'Only residents who complain a lot' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'The guiding rule when you are unsure whether something is abuse is:',
      options: [
        { id: 'a', label: 'Stay quiet unless you are certain' },
        { id: 'b', label: 'When in doubt, report' },
        { id: 'c', label: 'Only report serious injuries' },
        { id: 'd', label: 'Ask the abuser first' },
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
        `Run seed-course-04-elder-abuse.ts first, and confirm VERSION_NUMBER matches.`,
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
    where: { courseVersionId: version.id, slug: ABUSE_FINAL_EXAM.slug, deletedAt: null },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: ABUSE_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: ABUSE_FINAL_EXAM.passingScore,
          maxAttempts: ABUSE_FINAL_EXAM.maxAttempts,
          settings: ABUSE_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: ABUSE_FINAL_EXAM.slug,
          title: ABUSE_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: ABUSE_FINAL_EXAM.passingScore,
          maxAttempts: ABUSE_FINAL_EXAM.maxAttempts,
          settings: ABUSE_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of ABUSE_FINAL_EXAM.questions) {
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
