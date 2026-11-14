/**
 * Seed the 10-question final exam for Blood Sugar Emergencies: Hypoglycemia & Hyperglycemia.
 * Targets the v1 DRAFT course version created by seed-course-27-hypoglycemia-hyperglycemia (tenant cal-ace).
 *
 * Run: pnpm --filter @calace/db db:seed-course-27-hypoglycemia-hyperglycemia-exam
 */
import {
  AssessmentKind,
  CourseVersionStatus,
  PrismaClient,
  QuestionType,
} from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';
const COURSE_SLUG = 'hypoglycemia-hyperglycemia';

const HYPOGLYCEMIA_HYPERGLYCEMIA_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — Blood Sugar Emergencies: Hypoglycemia & Hyperglycemia',
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
      prompt: 'Compared to high blood sugar, low blood sugar:',
      options: [
        { id: 'a', label: 'Builds up slowly over days' },
        { id: 'b', label: 'Comes on fast and must be treated quickly' },
        { id: 'c', label: 'Is never an emergency' },
        { id: 'd', label: 'Has no symptoms' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'In an older adult with diabetes, low blood sugar can be mistaken for:',
      options: [
        { id: 'a', label: 'Only a headache' },
        { id: 'b', label: 'A stroke, intoxication, or dementia' },
        { id: 'c', label: 'Good health' },
        { id: 'd', label: 'Nothing at all' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'After giving juice to a conscious resident for a low, the resident says they "feel a bit better." The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Move on to other residents' },
        {
          id: 'b',
          label: 'Stay, wait the recheck time, recheck, and re-treat per policy if still low',
        },
        { id: 'c', label: 'Give insulin now' },
        { id: 'd', label: 'Give a chocolate bar' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Why is the recheck after treating a low so important?',
      options: [
        { id: 'a', label: 'It isn\'t important' },
        { id: 'b', label: 'Blood sugar can drop low again (rebound) as insulin keeps working' },
        { id: 'c', label: 'It wastes time' },
        { id: 'd', label: 'The resident is always fine after juice' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Which is a correct fast-acting sugar for a low?',
      options: [
        { id: 'a', label: 'A chocolate bar full of fat' },
        { id: 'b', label: 'About four ounces of juice or glucose tablets' },
        { id: 'c', label: 'A slice of cheese' },
        { id: 'd', label: 'A diet soda' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A diabetic resident is unconscious and cannot swallow. The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Pour juice into their mouth' },
        { id: 'b', label: 'Give nothing by mouth and activate emergency help immediately' },
        { id: 'c', label: 'Give insulin' },
        { id: 'd', label: 'Wait and watch' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Which signs suggest a SEVERE high-blood-sugar crisis (like DKA)?',
      options: [
        { id: 'a', label: 'Shaky, sweaty, cold and clammy' },
        { id: 'b', label: 'Deep rapid breathing, fruity breath, vomiting, deep drowsiness' },
        { id: 'c', label: 'Feeling completely normal' },
        { id: 'd', label: 'Mild hunger only' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A resident with diabetes suddenly looks like they\'re having a stroke. They have diabetes and barely ate after insulin. The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Wait quietly and assume it\'s a stroke' },
        {
          id: 'b',
          label: 'Get the nurse immediately and say they\'re diabetic, on insulin, and barely ate',
        },
        { id: 'c', label: 'Give insulin in case it\'s high' },
        { id: 'd', label: 'Ignore it' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Why do blood sugar emergencies become more likely when a diabetic resident is sick?',
      options: [
        { id: 'a', label: 'Illness never affects blood sugar' },
        { id: 'b', label: 'Illness can swing blood sugar, often pushing it high' },
        { id: 'c', label: 'Sick residents always have normal sugar' },
        { id: 'd', label: 'It only matters for non-diabetics' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Which task is OUTSIDE the CNA's scope of practice?",
      options: [
        { id: 'a', label: 'Giving fast sugar to a conscious resident per facility policy' },
        { id: 'b', label: 'Rechecking after treating a low' },
        { id: 'c', label: 'Giving insulin or deciding a diabetes medication dose' },
        { id: 'd', label: 'Reporting a blood sugar emergency to the nurse' },
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
      slug: HYPOGLYCEMIA_HYPERGLYCEMIA_FINAL_EXAM.slug,
      deletedAt: null,
    },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: HYPOGLYCEMIA_HYPERGLYCEMIA_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: HYPOGLYCEMIA_HYPERGLYCEMIA_FINAL_EXAM.passingScore,
          maxAttempts: HYPOGLYCEMIA_HYPERGLYCEMIA_FINAL_EXAM.maxAttempts,
          settings: HYPOGLYCEMIA_HYPERGLYCEMIA_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: HYPOGLYCEMIA_HYPERGLYCEMIA_FINAL_EXAM.slug,
          title: HYPOGLYCEMIA_HYPERGLYCEMIA_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: HYPOGLYCEMIA_HYPERGLYCEMIA_FINAL_EXAM.passingScore,
          maxAttempts: HYPOGLYCEMIA_HYPERGLYCEMIA_FINAL_EXAM.maxAttempts,
          settings: HYPOGLYCEMIA_HYPERGLYCEMIA_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of HYPOGLYCEMIA_HYPERGLYCEMIA_FINAL_EXAM.questions) {
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
