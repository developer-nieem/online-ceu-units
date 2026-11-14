/**
 * Seed the 10-question final exam for Pneumonia: Recognition and Care Support for CNAs.
 * Targets the v1 DRAFT course version created by seed-course-19-pneumonia (tenant cal-ace).
 *
 * Run: pnpm --filter @calace/db db:seed-course-19-pneumonia-exam
 */
import {
  AssessmentKind,
  CourseVersionStatus,
  PrismaClient,
  QuestionType,
} from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';
const COURSE_SLUG = 'pneumonia';

const PNEUMONIA_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — Pneumonia: Recognition and Care Support for CNAs',
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
      prompt: 'Pneumonia is best described as:',
      options: [
        { id: 'a', label: 'A blocked blood vessel in the lungs' },
        { id: 'b', label: "An infection that fills the lung's air sacs with fluid" },
        { id: 'c', label: 'A type of irregular heartbeat' },
        { id: 'd', label: 'A chronic narrowing of the airways' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'In an older adult, the FIRST sign of pneumonia is often:',
      options: [
        { id: 'a', label: 'Always a high fever and loud cough' },
        { id: 'b', label: 'New confusion, weakness, or loss of appetite' },
        { id: 'c', label: 'Improved energy and appetite' },
        { id: 'd', label: 'No change at all' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Aspiration pneumonia is caused by:',
      options: [
        { id: 'a', label: 'Breathing cold air' },
        { id: 'b', label: 'Food, liquid, or saliva going into the lungs' },
        { id: 'c', label: 'Too much exercise' },
        { id: 'd', label: 'Drinking enough water' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'To help prevent aspiration pneumonia during meals, the CNA SHOULD:',
      options: [
        { id: 'a', label: 'Feed the resident quickly while they lie back' },
        { id: 'b', label: 'Have the resident sit fully upright, take small bites, and eat slowly' },
        { id: 'c', label: 'Give large bites to finish faster' },
        { id: 'd', label: 'Lay the resident flat right after eating' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Why is daily mouth care important for preventing pneumonia?',
      options: [
        { id: 'a', label: 'It has no effect on pneumonia' },
        { id: 'b', label: 'A clean mouth has fewer germs that could be aspirated into the lungs' },
        { id: 'c', label: 'It replaces the need for antibiotics' },
        { id: 'd', label: 'It only matters for appearance' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A resident with pneumonia suddenly has blue lips, labored breathing, and worsening confusion. The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Give an extra antibiotic dose' },
        { id: 'b', label: 'Stay with them, keep them upright, and activate emergency help immediately' },
        { id: 'c', label: 'Lay them flat and wait' },
        { id: 'd', label: 'Wait for the next scheduled check' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A normally alert resident is suddenly confused, very tired, and refusing food, with no cough. The CNA SHOULD:',
      options: [
        { id: 'a', label: "Assume it's just an off day" },
        { id: 'b', label: 'Report the sudden change to the nurse promptly' },
        { id: 'c', label: 'Force the resident to finish the meal' },
        { id: 'd', label: 'Wait until tomorrow' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'After a meal, a resident at risk for aspiration should be:',
      options: [
        { id: 'a', label: 'Laid flat immediately' },
        { id: 'b', label: 'Kept sitting upright for at least 30 minutes' },
        { id: 'c', label: 'Encouraged to lie on their stomach' },
        { id: 'd', label: 'Given a large drink quickly' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Which helps prevent pneumonia in a bedbound resident?',
      options: [
        { id: 'a', label: 'Keeping them flat and still all day' },
        { id: 'b', label: 'Repositioning regularly and keeping the head of the bed raised' },
        { id: 'c', label: 'Skipping mouth care' },
        { id: 'd', label: 'Avoiding all movement' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Which task is OUTSIDE the CNA's scope of practice?",
      options: [
        { id: 'a', label: 'Feeding a resident safely to prevent aspiration' },
        { id: 'b', label: 'Reporting a sudden change in a resident to the nurse' },
        { id: 'c', label: "Giving or adjusting the resident's antibiotics" },
        { id: 'd', label: 'Providing daily mouth care' },
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
    where: { courseVersionId: version.id, slug: PNEUMONIA_FINAL_EXAM.slug, deletedAt: null },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: PNEUMONIA_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: PNEUMONIA_FINAL_EXAM.passingScore,
          maxAttempts: PNEUMONIA_FINAL_EXAM.maxAttempts,
          settings: PNEUMONIA_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: PNEUMONIA_FINAL_EXAM.slug,
          title: PNEUMONIA_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: PNEUMONIA_FINAL_EXAM.passingScore,
          maxAttempts: PNEUMONIA_FINAL_EXAM.maxAttempts,
          settings: PNEUMONIA_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of PNEUMONIA_FINAL_EXAM.questions) {
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
