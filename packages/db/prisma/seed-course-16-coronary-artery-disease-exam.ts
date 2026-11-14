/**
 * Seed the 10-question final exam for Caring for a Resident with Coronary Artery Disease.
 * Targets the v1 DRAFT course version created by seed-course-16-coronary-artery-disease (tenant cal-ace).
 *
 * Run: pnpm --filter @calace/db db:seed-course-16-coronary-artery-disease-exam
 */
import {
  AssessmentKind,
  CourseVersionStatus,
  PrismaClient,
  QuestionType,
} from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';
const COURSE_SLUG = 'coronary-artery-disease';

const CAD_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — Caring for a Resident with Coronary Artery Disease',
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
      prompt: 'Coronary artery disease is best described as:',
      options: [
        { id: 'a', label: 'A sudden stopping of the heart' },
        { id: 'b', label: "Narrowing of the heart's own arteries by plaque buildup" },
        { id: 'c', label: 'An infection of the heart muscle' },
        { id: 'd', label: 'A type of irregular heartbeat' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'What is the key difference between angina and a heart attack?',
      options: [
        { id: 'a', label: 'Angina only happens at night' },
        { id: 'b', label: 'Angina usually eases with rest; a heart attack does not' },
        { id: 'c', label: 'A heart attack is always painless' },
        { id: 'd', label: 'There is no difference' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A resident with CAD has crushing chest pain at rest, sweating, and nausea that does NOT ease. The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Give the resident their nitroglycerin' },
        { id: 'b', label: 'Activate emergency response immediately and stay with them' },
        { id: 'c', label: 'Help them walk it off' },
        { id: 'd', label: 'Wait fifteen minutes to see if it eases' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A resident asks the CNA to give them their nitroglycerin tablet for chest discomfort. The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Give one tablet since the resident asked' },
        { id: 'b', label: 'Give it only if the resident has taken it before' },
        { id: 'c', label: 'Call the nurse — a CNA never gives nitroglycerin' },
        { id: 'd', label: "Place it under the resident's tongue themselves" },
      ],
      correctAnswer: 'c',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Classic angina is usually brought on by:',
      options: [
        { id: 'a', label: 'Sleeping' },
        { id: 'b', label: 'Exertion or strong emotion' },
        { id: 'c', label: 'Eating a small snack' },
        { id: 'd', label: 'Watching television quietly' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        "A resident's chest tightness comes while walking and eases after three minutes of rest. The CNA SHOULD:",
      options: [
        { id: 'a', label: 'Ignore it since it went away' },
        { id: 'b', label: 'Help them rest, stay with them, and report the episode to the nurse' },
        { id: 'c', label: 'Give them nitroglycerin to be safe' },
        { id: 'd', label: 'Have them keep walking' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Which is a heart-healthy way the CNA supports a resident with CAD?',
      options: [
        { id: 'a', label: 'Serving extra salty, fried foods they enjoy' },
        { id: 'b', label: 'Rushing them through activities' },
        { id: 'c', label: 'Pacing activities with rest and supporting the low-fat, low-salt diet' },
        { id: 'd', label: 'Keeping them in bed all day' },
      ],
      correctAnswer: 'c',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'Heart attack signs can be subtle, especially in women, older adults, and people with diabetes. These may include:',
      options: [
        { id: 'a', label: 'Only severe crushing chest pain' },
        { id: 'b', label: 'Unusual fatigue, shortness of breath, nausea, or jaw and arm discomfort' },
        { id: 'c', label: 'No symptoms that ever need reporting' },
        { id: 'd', label: 'Improved energy and appetite' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'When a resident has chest discomfort, the CNA SHOULD:',
      options: [
        { id: 'a', label: 'Leave to find help and come back later' },
        { id: 'b', label: 'Help the resident rest, stay with them, and call the nurse' },
        { id: 'c', label: "Tell them it's probably nothing" },
        { id: 'd', label: 'Give them food and water' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Which task is OUTSIDE the CNA's scope of practice?",
      options: [
        { id: 'a', label: "Pacing a resident's activities to protect the heart" },
        { id: 'b', label: 'Reporting an angina episode to the nurse' },
        { id: 'c', label: "Giving or adjusting the resident's heart medication" },
        { id: 'd', label: 'Staying with a resident during chest pain' },
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
      versionNumber: 1,
      status: CourseVersionStatus.DRAFT,
      deletedAt: null,
    },
    select: { id: true, status: true, versionNumber: true },
  });

  if (!version) {
    console.error(`DRAFT course version v1 not found for: ${COURSE_SLUG}`);
    process.exit(1);
  }

  console.log(
    `Course version ID: ${version.id} (v${version.versionNumber}, status: ${version.status})`,
  );
  console.log(`Course status: ${course.status} (unchanged — exam not learner-visible until publish)`);

  const existing = await prisma.assessment.findFirst({
    where: { courseVersionId: version.id, slug: CAD_FINAL_EXAM.slug, deletedAt: null },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: CAD_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: CAD_FINAL_EXAM.passingScore,
          maxAttempts: CAD_FINAL_EXAM.maxAttempts,
          settings: CAD_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: CAD_FINAL_EXAM.slug,
          title: CAD_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: CAD_FINAL_EXAM.passingScore,
          maxAttempts: CAD_FINAL_EXAM.maxAttempts,
          settings: CAD_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of CAD_FINAL_EXAM.questions) {
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
