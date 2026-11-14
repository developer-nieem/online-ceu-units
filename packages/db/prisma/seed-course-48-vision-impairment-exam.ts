/**
 * Seed the 10-question final exam for Vision Impairment & Eye Conditions.
 * Targets the v1 DRAFT course version created by seed-course-48-vision-impairment (tenant cal-ace).
 *
 * Run: pnpm --filter @calace/db db:seed-course-48-vision-impairment-exam
 */
import {
  AssessmentKind,
  CourseVersionStatus,
  PrismaClient,
  QuestionType,
} from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';
const COURSE_SLUG = 'vision-impairment';

const VISION_IMPAIRMENT_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — Vision Impairment & Eye Conditions',
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
      prompt: 'Macular degeneration mainly causes loss of:',
      options: [
        { id: 'a', label: 'All vision at once' },
        {
          id: 'b',
          label: 'Central vision — used for reading and recognizing faces — while side vision often remains',
        },
        { id: 'c', label: 'Only color vision' },
        { id: 'd', label: 'Hearing' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Glaucoma is:',
      options: [
        { id: 'a', label: 'A type of glasses' },
        {
          id: 'b',
          label:
            'Optic nerve damage (often from eye pressure) that usually takes side vision first; managed with daily drops',
        },
        { id: 'c', label: 'A temporary infection' },
        { id: 'd', label: 'Always painful and obvious' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "When entering the room of a resident who can't see well, the CNA should FIRST:",
      options: [
        { id: 'a', label: "Touch them to let them know you're there" },
        { id: 'b', label: 'Announce themselves so the resident knows who is present' },
        { id: 'c', label: 'Stay silent to avoid disturbing them' },
        { id: 'd', label: 'Rearrange the room' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Why is vision loss such a major safety concern in elders?',
      options: [
        { id: 'a', label: 'It has no effect on safety' },
        { id: 'b', label: 'It greatly increases the risk of falls' },
        { id: 'c', label: 'It improves balance' },
        { id: 'd', label: 'It only affects reading' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'The sighted-guide technique means:',
      options: [
        { id: 'a', label: 'Grabbing and pushing the resident along' },
        {
          id: 'b',
          label:
            'Offering your arm for them to hold above your elbow while you walk a half-step ahead, describing the path',
        },
        { id: 'c', label: 'Pulling them by the hand' },
        { id: 'd', label: 'Letting them walk into hazards' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'For a resident with low vision, the CNA should arrange the environment by:',
      options: [
        { id: 'a', label: 'Rearranging furniture often to keep it interesting' },
        {
          id: 'b',
          label: 'Keeping belongings and furniture in consistent places and never rearranging without telling them',
        },
        { id: 'c', label: 'Leaving clutter in pathways' },
        { id: 'd', label: 'Keeping lights dim' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A resident on glaucoma eye drops is a concern because:',
      options: [
        { id: 'a', label: 'The drops are optional' },
        {
          id: 'b',
          label:
            'Glaucoma drops must be used faithfully (daily) to prevent blindness — report missed or problematic drops',
        },
        { id: 'c', label: 'Drops cause glaucoma' },
        { id: 'd', label: 'Drops should be stopped when vision feels fine' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A resident suddenly reports a "dark curtain" over part of her vision with new flashes and floaters. The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Have her rest and wait for the next eye appointment' },
        {
          id: 'b',
          label:
            'Report it to the nurse immediately — it can signal a retinal detachment, an eye emergency',
        },
        { id: 'c', label: "Tell her it's nothing" },
        { id: 'd', label: 'Put in eye drops' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'The guiding spirit of caring for a vision-impaired resident is to:',
      options: [
        { id: 'a', label: 'Do everything for them to save time' },
        {
          id: 'b',
          label: 'Support independence, don\'t replace it — help them do what they can',
        },
        { id: 'c', label: 'Treat them as helpless' },
        { id: 'd', label: 'Move them by wheelchair to be faster' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Which is OUTSIDE the CNA's scope of practice?",
      options: [
        { id: 'a', label: 'Communicating clearly and guiding safely' },
        { id: 'b', label: 'Arranging a safe environment and supporting glasses and drops' },
        { id: 'c', label: 'Diagnosing eye conditions or performing eye treatments/procedures' },
        { id: 'd', label: 'Reporting vision changes and eye emergencies' },
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
      slug: VISION_IMPAIRMENT_FINAL_EXAM.slug,
      deletedAt: null,
    },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: VISION_IMPAIRMENT_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: VISION_IMPAIRMENT_FINAL_EXAM.passingScore,
          maxAttempts: VISION_IMPAIRMENT_FINAL_EXAM.maxAttempts,
          settings: VISION_IMPAIRMENT_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: VISION_IMPAIRMENT_FINAL_EXAM.slug,
          title: VISION_IMPAIRMENT_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: VISION_IMPAIRMENT_FINAL_EXAM.passingScore,
          maxAttempts: VISION_IMPAIRMENT_FINAL_EXAM.maxAttempts,
          settings: VISION_IMPAIRMENT_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of VISION_IMPAIRMENT_FINAL_EXAM.questions) {
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
