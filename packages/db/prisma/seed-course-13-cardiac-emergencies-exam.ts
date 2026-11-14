/**
 * Seed the 10-question final exam for The CNA's Role During a Cardiac Emergency.
 * Targets the v4 DRAFT course version created by seed-course-13-cardiac-emergencies (tenant cal-ace).
 *
 * Run: pnpm --filter @calace/db db:seed-course-13-cardiac-emergencies-exam
 */
import {
  AssessmentKind,
  CourseVersionStatus,
  PrismaClient,
  QuestionType,
} from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';
const COURSE_SLUG = 'cardiac-emergency';

// Must match VERSION_NUMBER in seed-course-13-cardiac-emergencies.ts (v4 DRAFT).
const VERSION_NUMBER = 4;

const CARDIAC_EMERGENCY_FINAL_EXAM = {
  slug: 'final-exam',
  title: "Final Exam — The CNA's Role During a Cardiac Emergency",
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
      prompt: 'What is the difference between a heart attack and cardiac arrest?',
      options: [
        { id: 'a', label: 'They are two names for the same thing' },
        { id: 'b', label: 'A heart attack is a blocked vessel; cardiac arrest is the heart suddenly stopping' },
        { id: 'c', label: 'A heart attack is more serious than cardiac arrest' },
        { id: 'd', label: 'Cardiac arrest only happens during sleep' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A CNA finds a resident collapsed, unresponsive, and only gasping. The BEST first action is:',
      options: [
        { id: 'a', label: 'Activate the emergency response immediately and stay with the resident' },
        { id: 'b', label: 'Leave to find the nurse in another room' },
        { id: 'c', label: 'Give the resident a sip of water' },
        { id: 'd', label: 'Wait a few minutes to see if they recover' },
      ],
      correctAnswer: 'a',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A resident is awake but has chest pressure, sweating, and shortness of breath. The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Tell the resident to walk it off' },
        { id: 'b', label: 'Give the resident their nitroglycerin tablet' },
        { id: 'c', label: 'Help the resident rest, stay with them, and call the nurse immediately' },
        { id: 'd', label: 'Write it in the chart for the next shift' },
      ],
      correctAnswer: 'c',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Slow, occasional gasping in a collapsed, unresponsive resident means:',
      options: [
        { id: 'a', label: 'The resident is breathing normally and is fine' },
        { id: 'b', label: 'The heart has stopped — this is a cardiac emergency' },
        { id: 'c', label: 'The resident is just sleeping deeply' },
        { id: 'd', label: 'The CNA should wait and watch quietly' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Which action is WITHIN the CNA's scope during a cardiac emergency?",
      options: [
        { id: 'a', label: 'Giving the resident aspirin' },
        { id: 'b', label: 'Adjusting the oxygen flow rate' },
        { id: 'c', label: 'Activating help and bringing the AED to the scene' },
        { id: 'd', label: "Deciding the resident's DNR status" },
      ],
      correctAnswer: 'c',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'May a CNA give a resident their own nitroglycerin tablet during chest pain?',
      options: [
        { id: 'a', label: 'Yes, if the resident asks for it' },
        { id: 'b', label: "Yes, if it is in the resident's drawer" },
        { id: 'c', label: 'No — the CNA calls the nurse, who decides about medication' },
        { id: 'd', label: 'Yes, but only one tablet' },
      ],
      correctAnswer: 'c',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'This online course allows a CNA to:',
      options: [
        { id: 'a', label: 'Become certified to perform CPR' },
        { id: 'b', label: 'Become certified to use an AED' },
        { id: 'c', label: "Recognize a cardiac emergency and understand the CNA's role" },
        { id: 'd', label: 'Replace in-person CPR certification' },
      ],
      correctAnswer: 'c',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'When a cardiac emergency happens, the CNA SHOULD activate help by:',
      options: [
        { id: 'a', label: 'Leaving the resident to search for the nurse' },
        { id: 'b', label: 'Calling out and using the emergency call system where they are' },
        { id: 'c', label: 'Waiting for someone else to notice' },
        { id: 'd', label: "Calling the resident's family first" },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'To check if a collapsed resident is responsive, the CNA SHOULD:',
      options: [
        { id: 'a', label: 'Shake the resident hard and slap their face' },
        { id: 'b', label: 'Tap the shoulder firmly and shout, "Are you okay?"' },
        { id: 'c', label: 'Pour water on the resident' },
        { id: 'd', label: 'Quietly leave and return later' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'After witnessing a cardiac emergency, a CNA who feels shaken SHOULD:',
      options: [
        { id: 'a', label: 'Keep it to themselves and push through' },
        { id: 'b', label: 'Quit working with high-risk residents' },
        { id: 'c', label: 'Seek support from a supervisor or facility resources' },
        { id: 'd', label: 'Avoid talking about it with anyone' },
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
    console.error(`DRAFT course version v${VERSION_NUMBER} not found for: ${COURSE_SLUG}`);
    process.exit(1);
  }

  console.log(
    `Course version ID: ${version.id} (v${version.versionNumber}, status: ${version.status})`,
  );
  console.log(`Course status: ${course.status} (unchanged — exam not learner-visible until publish)`);

  const existing = await prisma.assessment.findFirst({
    where: { courseVersionId: version.id, slug: CARDIAC_EMERGENCY_FINAL_EXAM.slug, deletedAt: null },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: CARDIAC_EMERGENCY_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: CARDIAC_EMERGENCY_FINAL_EXAM.passingScore,
          maxAttempts: CARDIAC_EMERGENCY_FINAL_EXAM.maxAttempts,
          settings: CARDIAC_EMERGENCY_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: CARDIAC_EMERGENCY_FINAL_EXAM.slug,
          title: CARDIAC_EMERGENCY_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: CARDIAC_EMERGENCY_FINAL_EXAM.passingScore,
          maxAttempts: CARDIAC_EMERGENCY_FINAL_EXAM.maxAttempts,
          settings: CARDIAC_EMERGENCY_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of CARDIAC_EMERGENCY_FINAL_EXAM.questions) {
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
