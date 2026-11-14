/**
 * Seed the 10-question final exam for Agitation, Aggression & De-escalation.
 * Targets the DRAFT course version created by seed-course-08-deescalation
 * (tenant cal-ace).
 *
 * Run: pnpm --filter @calace/db db:seed-course-08-deescalation-exam
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * MUST MATCH seed-course-08-deescalation.ts (confirmed against live DB):
 *   COURSE_SLUG    = 'workplace-violence-prevention'  (FROZEN — course already live)
 *   VERSION_NUMBER = 2                (MAX existing version is v1 PUBLISHED)
 * Run order: the main seed FIRST (creates the v2 version), then this exam.
 * Both are DRAFT-only.
 *
 * Questions approved by Dr. Cliff (package: course-08-deescalation, "FINAL QUIZ —
 * 10 QUESTIONS"). NATCEP-style: single choice, 4 options, 80% to pass, 3 attempts,
 * randomized. Behavior-is-communication, de-escalation toolkit, safety-first, scope focus.
 *
 * ⚠️ NON-STANDARD ANSWER KEY (NOT all "b"): b,b,a,b,c,b,b,b,b,c
 *    Q1=b Q2=b Q3=a Q4=b Q5=c Q6=b Q7=b Q8=b Q9=b Q10=c
 *    (Q3 correct = option a "at the early signs"; Q5 correct = option c "speaking softly…")
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
const COURSE_SLUG = 'workplace-violence-prevention';

// CONFIRMED against live DB — must equal VERSION_NUMBER in the main seed.
const VERSION_NUMBER = 2;

const DEESCALATION_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — Agitation, Aggression & De-escalation',
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
      prompt: 'When a resident becomes agitated or aggressive, it usually means:',
      options: [
        { id: 'a', label: 'They are bad or mean' },
        { id: 'b', label: 'Their behavior is communicating an unmet need, fear, or pain' },
        { id: 'c', label: 'They should be punished' },
        { id: 'd', label: 'Nothing important' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'The goal of de-escalation is:',
      options: [
        { id: 'a', label: 'To win the argument' },
        { id: 'b', label: 'To bring calm and keep everyone safe' },
        { id: 'c', label: 'To control the resident' },
        { id: 'd', label: 'To finish the task fast' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'The easiest time to de-escalate a resident is:',
      options: [
        { id: 'a', label: 'At the early signs of agitation' },
        { id: 'b', label: 'After they become aggressive' },
        { id: 'c', label: 'During a physical crisis' },
        { id: 'd', label: 'It doesn\'t matter when' },
      ],
      correctAnswer: 'a',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Before you can calm an upset resident, you should first:',
      options: [
        { id: 'a', label: 'Raise your voice to match theirs' },
        { id: 'b', label: 'Stay calm yourself — breathe, lower your voice, slow down' },
        { id: 'c', label: 'Rush to finish quickly' },
        { id: 'd', label: 'Tell them to calm down' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Which is GOOD verbal de-escalation?',
      options: [
        { id: 'a', label: 'Telling the resident to "calm down"' },
        { id: 'b', label: 'Arguing with them' },
        { id: 'c', label: 'Speaking softly, using their name, and acknowledging their feelings' },
        { id: 'd', label: 'Commanding and threatening' },
      ],
      correctAnswer: 'c',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Good non-verbal de-escalation includes:',
      options: [
        { id: 'a', label: 'Crossing your arms and pointing' },
        { id: 'b', label: 'An open, calm posture, giving space, and approaching from the front' },
        { id: 'c', label: 'Cornering the resident' },
        { id: 'd', label: 'Looming over them' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A resident is agitated and frightened during care. The CNA should:',
      options: [
        { id: 'a', label: 'Hold them still and force the care done' },
        { id: 'b', label: 'Stop, give space, stay calm, find what\'s upsetting them, and meet that need' },
        { id: 'c', label: 'Tell them firmly to stop fighting' },
        { id: 'd', label: 'Ignore their distress and keep going' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A resident becomes physically aggressive and you are getting cornered. You should:',
      options: [
        { id: 'a', label: 'Wrestle them down by yourself' },
        { id: 'b', label: 'Prioritize safety — give space, keep an exit, and get help immediately' },
        { id: 'c', label: 'Stay cornered and keep talking' },
        { id: 'd', label: 'Argue back so they don\'t "win"' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Getting yourself to safety and getting help during a dangerous situation is:',
      options: [
        { id: 'a', label: 'A sign of failure' },
        { id: 'b', label: 'The right judgment — your safety matters too' },
        { id: 'c', label: 'Never allowed' },
        { id: 'd', label: 'Giving up' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Which is NOT the CNA\'s role with agitation and aggression?',
      options: [
        { id: 'a', label: 'Recognizing escalation and de-escalating with calm' },
        { id: 'b', label: 'Meeting the need behind the behavior' },
        { id: 'c', label: 'Diagnosing, giving medications, or applying restraints outside proper orders' },
        { id: 'd', label: 'Keeping everyone safe and reporting' },
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
        `Run seed-course-08-deescalation.ts first, and confirm VERSION_NUMBER matches.`,
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
    where: { courseVersionId: version.id, slug: DEESCALATION_FINAL_EXAM.slug, deletedAt: null },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: DEESCALATION_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: DEESCALATION_FINAL_EXAM.passingScore,
          maxAttempts: DEESCALATION_FINAL_EXAM.maxAttempts,
          settings: DEESCALATION_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: DEESCALATION_FINAL_EXAM.slug,
          title: DEESCALATION_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: DEESCALATION_FINAL_EXAM.passingScore,
          maxAttempts: DEESCALATION_FINAL_EXAM.maxAttempts,
          settings: DEESCALATION_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of DEESCALATION_FINAL_EXAM.questions) {
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
