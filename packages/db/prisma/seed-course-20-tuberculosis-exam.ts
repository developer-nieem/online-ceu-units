/**
 * Seed the 10-question final exam for Tuberculosis: Warning Signs and Precautions Every CNA Must Know.
 * Targets the v1 DRAFT course version created by seed-course-20-tuberculosis (tenant cal-ace).
 *
 * Run: pnpm --filter @calace/db db:seed-course-20-tuberculosis-exam
 */
import {
  AssessmentKind,
  CourseVersionStatus,
  PrismaClient,
  QuestionType,
} from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';
const COURSE_SLUG = 'tuberculosis';

const TUBERCULOSIS_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — Tuberculosis: Warning Signs and Precautions Every CNA Must Know',
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
      prompt: 'How does tuberculosis (TB) mainly spread?',
      options: [
        { id: 'a', label: 'By touching surfaces and shaking hands' },
        { id: 'b', label: 'Through the air when an infected person coughs or sneezes' },
        { id: 'c', label: 'By sharing food and dishes' },
        { id: 'd', label: 'Through contaminated water' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Which mask protects a CNA from breathing in TB bacteria?',
      options: [
        { id: 'a', label: 'A regular surgical mask' },
        { id: 'b', label: 'A properly fitted N95 respirator' },
        { id: 'c', label: 'A cloth face covering' },
        { id: 'd', label: 'No mask is needed' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Which is a classic warning sign of TB?',
      options: [
        { id: 'a', label: 'A cough lasting three weeks or more' },
        { id: 'b', label: 'A sudden one-day headache' },
        { id: 'c', label: 'Improved appetite and weight gain' },
        { id: 'd', label: 'A rash on the hands' },
      ],
      correctAnswer: 'a',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'What is the difference between latent and active TB?',
      options: [
        { id: 'a', label: 'There is no difference' },
        {
          id: 'b',
          label:
            'Latent TB is not contagious and the person feels fine; active TB makes the person sick and can spread',
        },
        { id: 'c', label: 'Latent TB is more dangerous than active TB' },
        { id: 'd', label: 'Active TB cannot be treated' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A resident with active TB is on airborne isolation. Before entering, the CNA SHOULD:',
      options: [
        { id: 'a', label: 'Use a surgical mask and prop the door open' },
        { id: 'b', label: 'Put on a fitted N95 respirator and keep the door closed' },
        { id: 'c', label: 'Skip the mask if only staying a minute' },
        { id: 'd', label: 'Hold their breath instead of wearing a mask' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A resident has had a cough for a month, plus night sweats and weight loss, and now blood in the tissue. The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Assume it is a winter cold' },
        { id: 'b', label: 'Report the pattern to the nurse promptly' },
        { id: 'c', label: 'Give the resident cough medicine' },
        { id: 'd', label: 'Wait for it to clear on its own' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Why must TB medications be taken faithfully for the full course?',
      options: [
        { id: 'a', label: 'They only need to be taken for a few days' },
        { id: 'b', label: 'Stopping early can let TB return, sometimes drug-resistant' },
        { id: 'c', label: 'They work instantly' },
        { id: 'd', label: 'Completing them is optional' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Together, night sweats, weeks-long cough, weight loss, and fatigue suggest:',
      options: [
        { id: 'a', label: 'Normal aging only' },
        { id: 'b', label: 'A possible TB pattern to report' },
        { id: 'c', label: 'A good sign of recovery' },
        { id: 'd', label: 'Nothing that needs reporting' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'When caring for a resident isolated with TB, the CNA SHOULD also:',
      options: [
        { id: 'a', label: 'Avoid the resident as much as possible' },
        { id: 'b', label: "Treat them with warmth and dignity so they don't feel shunned" },
        { id: 'c', label: 'Refuse to talk to them' },
        { id: 'd', label: 'Make them feel ashamed of the diagnosis' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Which task is OUTSIDE the CNA's scope of practice?",
      options: [
        { id: 'a', label: 'Wearing an N95 and following airborne precautions' },
        { id: 'b', label: 'Reporting TB warning signs to the nurse' },
        { id: 'c', label: "Interpreting the resident's TB test results" },
        { id: 'd', label: 'Supporting medication adherence' },
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
    where: { courseVersionId: version.id, slug: TUBERCULOSIS_FINAL_EXAM.slug, deletedAt: null },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: TUBERCULOSIS_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: TUBERCULOSIS_FINAL_EXAM.passingScore,
          maxAttempts: TUBERCULOSIS_FINAL_EXAM.maxAttempts,
          settings: TUBERCULOSIS_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: TUBERCULOSIS_FINAL_EXAM.slug,
          title: TUBERCULOSIS_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: TUBERCULOSIS_FINAL_EXAM.passingScore,
          maxAttempts: TUBERCULOSIS_FINAL_EXAM.maxAttempts,
          settings: TUBERCULOSIS_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of TUBERCULOSIS_FINAL_EXAM.questions) {
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
