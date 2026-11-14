/**
 * Seed the 10-question final exam for Seizures and Epilepsy: The CNA's Response.
 * Targets the v1 DRAFT course version created by seed-course-22-seizures-epilepsy (tenant cal-ace).
 *
 * Run: pnpm --filter @calace/db db:seed-course-22-seizures-epilepsy-exam
 */
import {
  AssessmentKind,
  CourseVersionStatus,
  PrismaClient,
  QuestionType,
} from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';
const COURSE_SLUG = 'seizures-epilepsy';

const SEIZURES_EPILEPSY_FINAL_EXAM = {
  slug: 'final-exam',
  title: "Final Exam — Seizures and Epilepsy: The CNA's Response",
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
      prompt: 'A seizure is best described as:',
      options: [
        { id: 'a', label: 'A heart rhythm problem' },
        { id: 'b', label: 'A sudden burst of abnormal electrical activity in the brain' },
        { id: 'c', label: 'A type of stroke' },
        { id: 'd', label: 'A muscle disease' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'When a resident begins a seizure, the CNA\'s FIRST actions should be to:',
      options: [
        { id: 'a', label: 'Hold the resident still' },
        { id: 'b', label: 'Note the time and call for the nurse while staying with the resident' },
        { id: 'c', label: "Put a cloth in the resident's mouth" },
        { id: 'd', label: 'Give the resident water' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'During a seizure, the CNA should NEVER:',
      options: [
        { id: 'a', label: "Cushion the resident's head" },
        { id: 'b', label: 'Clear hard objects away' },
        { id: 'c', label: "Put anything in the resident's mouth or hold them down" },
        { id: 'd', label: 'Stay with the resident' },
      ],
      correctAnswer: 'c',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A seizure lasting five minutes or more is:',
      options: [
        { id: 'a', label: 'Normal and needs no action' },
        { id: 'b', label: 'Status epilepticus — a medical emergency requiring immediate help' },
        { id: 'c', label: 'Just a long nap' },
        { id: 'd', label: 'A reason to give water' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'When the seizure ends, the CNA SHOULD place the resident:',
      options: [
        { id: 'a', label: 'Flat on their back' },
        { id: 'b', label: 'On their side in the recovery position' },
        { id: 'c', label: 'Sitting up in a chair right away' },
        { id: 'd', label: 'Face down' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'After a seizure, the resident may be confused and drowsy. The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Give them food and drink right away' },
        {
          id: 'b',
          label: 'Stay with them, reassure them calmly, and give nothing by mouth until fully alert',
        },
        { id: 'c', label: 'Leave them alone to rest' },
        { id: 'd', label: 'Quiz them on what happened' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A resident says, "I feel strange — like before my seizures." The CNA SHOULD:',
      options: [
        { id: 'a', label: "Tell them it's probably nothing" },
        { id: 'b', label: 'Help them to a safe position immediately and call the nurse' },
        { id: 'c', label: 'Have them keep walking' },
        { id: 'd', label: 'Wait to see what happens' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'The number one cause of breakthrough seizures in residents with epilepsy is:',
      options: [
        { id: 'a', label: 'Watching television' },
        { id: 'b', label: 'Missed or delayed anti-seizure medication doses' },
        { id: 'c', label: 'Eating breakfast' },
        { id: 'd', label: 'Talking with visitors' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        "A resident has brief spells of blank staring and lip-smacking, then doesn't remember them. The CNA SHOULD:",
      options: [
        { id: 'a', label: 'Dismiss it as daydreaming' },
        { id: 'b', label: 'Report the pattern — these may be seizures' },
        { id: 'c', label: 'Tell the resident to pay attention' },
        { id: 'd', label: 'Ignore it unless they fall' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Which task is OUTSIDE the CNA's scope of practice?",
      options: [
        { id: 'a', label: 'Timing a seizure from the moment it starts' },
        { id: 'b', label: 'Placing a resident in the recovery position after a seizure' },
        { id: 'c', label: "Giving the resident's rescue seizure medication" },
        { id: 'd', label: 'Reporting seizure details to the nurse' },
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
    where: { courseVersionId: version.id, slug: SEIZURES_EPILEPSY_FINAL_EXAM.slug, deletedAt: null },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: SEIZURES_EPILEPSY_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: SEIZURES_EPILEPSY_FINAL_EXAM.passingScore,
          maxAttempts: SEIZURES_EPILEPSY_FINAL_EXAM.maxAttempts,
          settings: SEIZURES_EPILEPSY_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: SEIZURES_EPILEPSY_FINAL_EXAM.slug,
          title: SEIZURES_EPILEPSY_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: SEIZURES_EPILEPSY_FINAL_EXAM.passingScore,
          maxAttempts: SEIZURES_EPILEPSY_FINAL_EXAM.maxAttempts,
          settings: SEIZURES_EPILEPSY_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of SEIZURES_EPILEPSY_FINAL_EXAM.questions) {
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
