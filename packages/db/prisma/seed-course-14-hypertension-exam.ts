/**
 * Seed the 10-question final exam for Hypertension: Observation and Reporting for CNAs.
 * Targets the v1 DRAFT course version created by seed-course-14-hypertension (tenant cal-ace).
 *
 * Run: pnpm --filter @calace/db db:seed-course-14-hypertension-exam
 */
import {
  AssessmentKind,
  CourseVersionStatus,
  PrismaClient,
  QuestionType,
} from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';
const COURSE_SLUG = 'hypertension';

const HYPERTENSION_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — Hypertension: Observation and Reporting for CNAs',
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
      prompt: 'In a blood pressure reading, the top number (systolic) measures:',
      options: [
        { id: 'a', label: 'The pressure when the heart rests between beats' },
        { id: 'b', label: 'The pressure when the heart squeezes and pushes blood out' },
        { id: 'c', label: "The resident's pulse rate" },
        { id: 'd', label: 'The amount of salt in the blood' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "For an accurate blood pressure reading, the resident's arm should be:",
      options: [
        { id: 'a', label: 'Hanging down at their side' },
        { id: 'b', label: 'Raised above their head' },
        { id: 'c', label: 'Supported at heart level' },
        { id: 'd', label: 'Held by the resident in the air' },
      ],
      correctAnswer: 'c',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Why is high blood pressure called the "silent killer"?',
      options: [
        { id: 'a', label: 'It only happens at night' },
        { id: 'b', label: 'It usually has no symptoms until serious damage is done' },
        { id: 'c', label: 'It cannot be measured' },
        { id: 'd', label: 'It only affects people who feel sick' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        "A CNA takes a reading that is much lower than the resident's normal, and the resident is due for blood pressure medication. The CNA SHOULD:",
      options: [
        { id: 'a', label: 'Hold the medication on their own' },
        { id: 'b', label: 'Give the medication as scheduled and say nothing' },
        { id: 'c', label: 'Report the low reading to the nurse and let the nurse decide' },
        { id: 'd', label: 'Wait and recheck later without telling anyone' },
      ],
      correctAnswer: 'c',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        "A resident's reading is 192 over 124, with a severe headache and confusion. The CNA SHOULD:",
      options: [
        { id: 'a', label: 'Record it for the end of the shift' },
        { id: 'b', label: 'Stay with the resident and notify the nurse immediately' },
        { id: 'c', label: 'Give the resident their blood pressure pill early' },
        { id: 'd', label: 'Recheck in one hour' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Which is the CORRECT way to record a blood pressure reading?',
      options: [
        { id: 'a', label: 'Round it to look closer to normal' },
        { id: 'b', label: 'Write the true reading immediately, with the arm and time' },
        { id: 'c', label: 'Write it from memory at the end of the shift' },
        { id: 'd', label: 'Only record it if it seems unusual' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A resident asks the CNA, "Is my blood pressure dangerous?" The BEST response is:',
      options: [
        { id: 'a', label: '"Yes, it\'s very dangerous."' },
        { id: 'b', label: '"No, you\'re perfectly fine."' },
        { id: 'c', label: '"Let me have the nurse go over that with you."' },
        { id: 'd', label: '"I\'m not allowed to talk to you about it."' },
      ],
      correctAnswer: 'c',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'To help prevent falls in a resident on blood pressure medication, the CNA SHOULD:',
      options: [
        { id: 'a', label: 'Have them stand up quickly to get it over with' },
        { id: 'b', label: 'Help them change position slowly — sit, pause, then stand' },
        { id: 'c', label: 'Keep them in bed all day' },
        { id: 'd', label: 'Avoid taking their blood pressure' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Which task is OUTSIDE the CNA's scope of practice?",
      options: [
        { id: 'a', label: 'Measuring blood pressure accurately' },
        { id: 'b', label: 'Reporting a high reading to the nurse' },
        { id: 'c', label: 'Diagnosing the resident with hypertension' },
        { id: 'd', label: 'Recording the reading honestly' },
      ],
      correctAnswer: 'c',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A diet low in salt helps control blood pressure because salt:',
      options: [
        { id: 'a', label: 'Makes the body hold extra fluid, raising pressure' },
        { id: 'b', label: 'Has no effect on blood pressure' },
        { id: 'c', label: 'Lowers the heart rate' },
        { id: 'd', label: 'Thins the blood' },
      ],
      correctAnswer: 'a',
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
    where: { courseVersionId: version.id, slug: HYPERTENSION_FINAL_EXAM.slug, deletedAt: null },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: HYPERTENSION_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: HYPERTENSION_FINAL_EXAM.passingScore,
          maxAttempts: HYPERTENSION_FINAL_EXAM.maxAttempts,
          settings: HYPERTENSION_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: HYPERTENSION_FINAL_EXAM.slug,
          title: HYPERTENSION_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: HYPERTENSION_FINAL_EXAM.passingScore,
          maxAttempts: HYPERTENSION_FINAL_EXAM.maxAttempts,
          settings: HYPERTENSION_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of HYPERTENSION_FINAL_EXAM.questions) {
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
