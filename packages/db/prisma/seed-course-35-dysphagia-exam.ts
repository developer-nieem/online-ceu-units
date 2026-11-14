/**
 * Seed the 10-question final exam for Caring for a Resident with Dysphagia (Swallowing Difficulties).
 * Targets the v1 DRAFT course version created by seed-course-35-dysphagia (tenant cal-ace).
 *
 * Run: pnpm --filter @calace/db db:seed-course-35-dysphagia-exam
 */
import {
  AssessmentKind,
  CourseVersionStatus,
  PrismaClient,
  QuestionType,
} from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';
const COURSE_SLUG = 'dysphagia';

const DYSPHAGIA_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — Caring for a Resident with Dysphagia (Swallowing Difficulties)',
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
      prompt: 'Dysphagia means:',
      options: [
        { id: 'a', label: 'Difficulty swallowing' },
        { id: 'b', label: 'Difficulty hearing' },
        { id: 'c', label: 'A skin condition' },
        { id: 'd', label: 'High blood sugar' },
      ],
      correctAnswer: 'a',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Aspiration is when food or liquid:',
      options: [
        { id: 'a', label: 'Goes into the stomach normally' },
        { id: 'b', label: 'Enters the airway and lungs instead of the stomach' },
        { id: 'c', label: 'Is too hot' },
        { id: 'd', label: 'Is refused by the resident' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Silent aspiration is dangerous because:',
      options: [
        { id: 'a', label: 'It is very loud' },
        { id: 'b', label: 'Food or liquid enters the lungs with no cough or visible sign' },
        { id: 'c', label: 'It only happens to children' },
        { id: 'd', label: 'It always causes immediate choking' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Which is generally the EASIEST thing for a weakened swallow to aspirate?',
      options: [
        { id: 'a', label: 'Pureed food' },
        { id: 'b', label: 'Thin liquids like water' },
        { id: 'c', label: 'Honey-thick liquids' },
        { id: 'd', label: 'Mashed potatoes' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A resident on honey-thick liquids begs for a glass of plain water. The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Give it just this once' },
        {
          id: 'b',
          label: 'Kindly decline, offer prescribed fluids, and report her distress to the nurse',
        },
        { id: 'c', label: 'Thin her drink halfway' },
        { id: 'd', label: 'Let her sneak it later' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Before feeding a resident with dysphagia, the CNA must make sure the resident is:',
      options: [
        { id: 'a', label: 'Lying comfortably flat' },
        { id: 'b', label: 'Fully upright and fully awake and alert' },
        { id: 'c', label: 'Watching television' },
        { id: 'd', label: 'In a hurry' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt: '"Pocketing" means food:',
      options: [
        { id: 'a', label: 'Was eaten too quickly' },
        { id: 'b', label: 'Collects in the cheek or mouth instead of being swallowed' },
        { id: 'c', label: 'Is stored for later in a bag' },
        { id: 'd', label: 'Is the wrong temperature' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A dysphagia resident never coughs at meals, but has a wet gurgly voice after drinks, recurring low fevers, slowing meals with weight loss, and repeat chest congestion. The CNA SHOULD:',
      options: [
        { id: 'a', label: "Assume the swallow is fine since there's no coughing" },
        { id: 'b', label: 'Report the whole pattern as possible silent aspiration' },
        { id: 'c', label: 'Switch them to thin liquids' },
        { id: 'd', label: 'Encourage faster eating' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A resident suddenly cannot speak, cough, or breathe and clutches their throat. The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Offer a sip of water' },
        {
          id: 'b',
          label: 'Call for help and respond immediately with the trained choking response',
        },
        { id: 'c', label: 'Wait to see if it passes' },
        { id: 'd', label: 'Lay them down flat' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Which task is OUTSIDE the CNA's scope of practice?",
      options: [
        { id: 'a', label: 'Verifying trays against the prescribed texture' },
        { id: 'b', label: 'Feeding with safe technique and checking for pocketing' },
        { id: 'c', label: "Changing a resident's diet texture or liquid thickness" },
        { id: 'd', label: 'Reporting signs of unsafe swallowing' },
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
      slug: DYSPHAGIA_FINAL_EXAM.slug,
      deletedAt: null,
    },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: DYSPHAGIA_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: DYSPHAGIA_FINAL_EXAM.passingScore,
          maxAttempts: DYSPHAGIA_FINAL_EXAM.maxAttempts,
          settings: DYSPHAGIA_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: DYSPHAGIA_FINAL_EXAM.slug,
          title: DYSPHAGIA_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: DYSPHAGIA_FINAL_EXAM.passingScore,
          maxAttempts: DYSPHAGIA_FINAL_EXAM.maxAttempts,
          settings: DYSPHAGIA_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of DYSPHAGIA_FINAL_EXAM.questions) {
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
