/**
 * Seed the 10-question final exam for Traumatic Brain Injury: What Every CNA Must Know.
 * Targets the v1 DRAFT course version created by seed-course-24-traumatic-brain-injury (tenant cal-ace).
 *
 * Run: pnpm --filter @calace/db db:seed-course-24-traumatic-brain-injury-exam
 */
import {
  AssessmentKind,
  CourseVersionStatus,
  PrismaClient,
  QuestionType,
} from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';
const COURSE_SLUG = 'traumatic-brain-injury';

const TRAUMATIC_BRAIN_INJURY_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — Traumatic Brain Injury: What Every CNA Must Know',
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
      prompt: 'A traumatic brain injury (TBI) is caused by:',
      options: [
        { id: 'a', label: 'A blocked blood vessel inside the brain' },
        { id: 'b', label: 'An outside force, such as a fall or blow to the head' },
        { id: 'c', label: 'A lung infection' },
        { id: 'd', label: 'Low blood sugar' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'The leading cause of TBI in older adults is:',
      options: [
        { id: 'a', label: 'Sports injuries' },
        { id: 'b', label: 'Falls' },
        { id: 'c', label: 'Swimming' },
        { id: 'd', label: 'Reading' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A resident bumps their head but seems completely fine and asks the CNA not to tell anyone. The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Respect their wishes and say nothing' },
        { id: 'b', label: 'Report the head strike to the nurse immediately anyway' },
        { id: 'c', label: 'Keep it secret between them' },
        { id: 'd', label: 'Wait until tomorrow to mention it' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Why can a head injury seem fine at first and turn dangerous hours later?',
      options: [
        { id: 'a', label: 'Head injuries always show symptoms immediately' },
        { id: 'b', label: 'Slow bleeding can build pressure inside the skull over hours' },
        { id: 'c', label: 'The brain heals within minutes' },
        { id: 'd', label: 'Symptoms never change over time' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'Five hours after hitting their head, a resident becomes very drowsy, confused, and vomits. The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Let them sleep it off' },
        {
          id: 'b',
          label: 'Get emergency help immediately — these are delayed signs of a brain bleed',
        },
        { id: 'c', label: 'Give them headache medicine' },
        { id: 'd', label: 'Note it for the next shift' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A resident on blood thinners bumps their head lightly. The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Ignore it since it was light' },
        { id: 'b', label: 'Report it immediately and tell the nurse about the blood thinner' },
        { id: 'c', label: 'Apply ice and say nothing' },
        { id: 'd', label: 'Wait to see if a bruise forms' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A resident with an old brain injury suddenly snaps angrily at the CNA over something small. The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Argue back to set them straight' },
        {
          id: 'b',
          label: 'Stay calm, give them a moment, and gently redirect — the behavior is the injury',
        },
        { id: 'c', label: 'Punish them by withholding care' },
        { id: 'd', label: 'Take it personally and avoid them' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'When giving instructions to a resident with a brain injury, the CNA SHOULD:',
      options: [
        { id: 'a', label: 'Give several instructions quickly' },
        { id: 'b', label: 'Give one simple instruction at a time and allow time to process' },
        { id: 'c', label: 'Speak as fast as possible' },
        { id: 'd', label: 'Use long, complicated sentences' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Which helps a resident living with TBI function at their best?',
      options: [
        { id: 'a', label: 'A loud, unpredictable environment' },
        { id: 'b', label: 'Consistent daily routines, calm surroundings, and rest' },
        { id: 'c', label: 'Skipping rest periods' },
        { id: 'd', label: 'Changing the schedule every day' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Which task is OUTSIDE the CNA's scope of practice?",
      options: [
        { id: 'a', label: 'Reporting every fall and head strike' },
        { id: 'b', label: 'Watching for delayed signs after a head injury' },
        { id: 'c', label: 'Performing the neurological checks after a head injury' },
        { id: 'd', label: 'Keeping routines consistent for a resident with TBI' },
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
      slug: TRAUMATIC_BRAIN_INJURY_FINAL_EXAM.slug,
      deletedAt: null,
    },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: TRAUMATIC_BRAIN_INJURY_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: TRAUMATIC_BRAIN_INJURY_FINAL_EXAM.passingScore,
          maxAttempts: TRAUMATIC_BRAIN_INJURY_FINAL_EXAM.maxAttempts,
          settings: TRAUMATIC_BRAIN_INJURY_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: TRAUMATIC_BRAIN_INJURY_FINAL_EXAM.slug,
          title: TRAUMATIC_BRAIN_INJURY_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: TRAUMATIC_BRAIN_INJURY_FINAL_EXAM.passingScore,
          maxAttempts: TRAUMATIC_BRAIN_INJURY_FINAL_EXAM.maxAttempts,
          settings: TRAUMATIC_BRAIN_INJURY_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of TRAUMATIC_BRAIN_INJURY_FINAL_EXAM.questions) {
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
