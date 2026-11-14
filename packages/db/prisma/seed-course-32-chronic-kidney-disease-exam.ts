/**
 * Seed the 10-question final exam for Caring for a Resident with Chronic Kidney Disease.
 * Targets the v1 DRAFT course version created by seed-course-32-chronic-kidney-disease (tenant cal-ace).
 *
 * Run: pnpm --filter @calace/db db:seed-course-32-chronic-kidney-disease-exam
 */
import {
  AssessmentKind,
  CourseVersionStatus,
  PrismaClient,
  QuestionType,
} from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';
const COURSE_SLUG = 'chronic-kidney-disease';

const CHRONIC_KIDNEY_DISEASE_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — Caring for a Resident with Chronic Kidney Disease',
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
      prompt: "The kidneys' main job is to:",
      options: [
        { id: 'a', label: 'Pump blood through the body' },
        { id: 'b', label: 'Filter waste and extra fluid from the blood' },
        { id: 'c', label: 'Digest food' },
        { id: 'd', label: 'Control body temperature' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'In chronic kidney disease, the kidneys:',
      options: [
        { id: 'a', label: 'Heal completely with rest' },
        { id: 'b', label: 'Slowly and permanently lose their filtering ability' },
        { id: 'c', label: 'Work better than normal' },
        { id: 'd', label: 'Only fail for a few days' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'The two most common causes of kidney failure are:',
      options: [
        { id: 'a', label: 'Broken bones and arthritis' },
        { id: 'b', label: 'Diabetes and high blood pressure' },
        { id: 'c', label: 'Colds and the flu' },
        { id: 'd', label: 'Allergies and asthma' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Why does a resident with kidney failure have a fluid restriction?',
      options: [
        { id: 'a', label: 'To save money on drinks' },
        { id: 'b', label: 'Their kidneys can\'t remove extra fluid, so it builds up dangerously' },
        { id: 'c', label: 'Fluids are bad for everyone' },
        { id: 'd', label: 'It is only a suggestion' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Which counts toward a resident's fluid restriction?",
      options: [
        { id: 'a', label: 'Only plain water' },
        { id: 'b', label: 'Everything liquid — including soup, ice cream, gelatin, and pill water' },
        { id: 'c', label: 'Nothing except juice' },
        { id: 'd', label: 'Only hot drinks' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'What is the rule for a dialysis access arm?',
      options: [
        { id: 'a', label: 'Take all blood pressures on that arm' },
        { id: 'b', label: 'No blood pressures, no needles, and nothing tight on that arm — ever' },
        { id: 'c', label: 'Keep it wrapped tightly at all times' },
        { id: 'd', label: 'It needs no special care' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        "A dialysis resident gains four pounds overnight, has worse ankle swelling, and couldn't breathe lying flat last night. The CNA SHOULD:",
      options: [
        { id: 'a', label: "Wait for tomorrow's scheduled dialysis" },
        { id: 'b', label: 'Report it to the nurse immediately — fluid may be reaching the lungs' },
        { id: 'c', label: 'Encourage more water to flush the kidneys' },
        { id: 'd', label: 'Have them lie flat and rest' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Why are daily weights so important for a kidney resident?',
      options: [
        { id: 'a', label: 'They are not important' },
        { id: 'b', label: 'Done consistently, they show fluid building up before it becomes dangerous' },
        { id: 'c', label: 'They measure muscle growth' },
        { id: 'd', label: 'They replace dialysis' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Which signs suggest waste building up in a kidney resident's blood?",
      options: [
        { id: 'a', label: 'Increased energy and appetite' },
        { id: 'b', label: 'Deepening fatigue, nausea, poor appetite, itching, and fogginess' },
        { id: 'c', label: 'Perfect concentration' },
        { id: 'd', label: 'No signs ever' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Which task is OUTSIDE the CNA's scope of practice?",
      options: [
        { id: 'a', label: 'Measuring and recording intake, output, and daily weights' },
        { id: 'b', label: 'Protecting the dialysis access arm' },
        { id: 'c', label: "Changing a resident's fluid restriction or dialysis settings" },
        { id: 'd', label: 'Reporting swelling and breathing changes' },
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
    where: {
      courseVersionId: version.id,
      slug: CHRONIC_KIDNEY_DISEASE_FINAL_EXAM.slug,
      deletedAt: null,
    },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: CHRONIC_KIDNEY_DISEASE_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: CHRONIC_KIDNEY_DISEASE_FINAL_EXAM.passingScore,
          maxAttempts: CHRONIC_KIDNEY_DISEASE_FINAL_EXAM.maxAttempts,
          settings: CHRONIC_KIDNEY_DISEASE_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: CHRONIC_KIDNEY_DISEASE_FINAL_EXAM.slug,
          title: CHRONIC_KIDNEY_DISEASE_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: CHRONIC_KIDNEY_DISEASE_FINAL_EXAM.passingScore,
          maxAttempts: CHRONIC_KIDNEY_DISEASE_FINAL_EXAM.maxAttempts,
          settings: CHRONIC_KIDNEY_DISEASE_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of CHRONIC_KIDNEY_DISEASE_FINAL_EXAM.questions) {
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
