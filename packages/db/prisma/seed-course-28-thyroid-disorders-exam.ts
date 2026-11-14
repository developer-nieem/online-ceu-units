/**
 * Seed the 10-question final exam for Caring for a Resident with a Thyroid Disorder.
 * Targets the v1 DRAFT course version created by seed-course-28-thyroid-disorders (tenant cal-ace).
 *
 * Run: pnpm --filter @calace/db db:seed-course-28-thyroid-disorders-exam
 */
import {
  AssessmentKind,
  CourseVersionStatus,
  PrismaClient,
  QuestionType,
} from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';
const COURSE_SLUG = 'thyroid-disorders';

const THYROID_DISORDERS_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — Caring for a Resident with a Thyroid Disorder',
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
      prompt: 'The thyroid gland mainly controls:',
      options: [
        { id: 'a', label: 'Blood clotting' },
        { id: 'b', label: 'The body\'s metabolism — its speed and energy use' },
        { id: 'c', label: 'Vision' },
        { id: 'd', label: 'Bone length' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'An UNDERACTIVE thyroid (hypothyroidism) typically causes:',
      options: [
        { id: 'a', label: 'Feeling hot and losing weight' },
        { id: 'b', label: 'Fatigue, feeling cold, weight gain, and constipation' },
        { id: 'c', label: 'A racing heart and tremor' },
        { id: 'd', label: 'No symptoms ever' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'An OVERACTIVE thyroid (hyperthyroidism) typically causes:',
      options: [
        { id: 'a', label: 'Feeling cold and gaining weight' },
        { id: 'b', label: 'Feeling hot, weight loss, a racing heart, and restlessness' },
        { id: 'c', label: 'Slowed thinking and sleepiness' },
        { id: 'd', label: 'No symptoms ever' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Why are thyroid problems often missed in older adults?',
      options: [
        { id: 'a', label: 'They are extremely rare' },
        { id: 'b', label: 'Their signs look like depression, dementia, anxiety, or aging' },
        { id: 'c', label: 'They have no signs' },
        { id: 'd', label: 'They only occur in children' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'The common thyroid medication levothyroxine often works best when taken:',
      options: [
        { id: 'a', label: 'With a large fatty meal' },
        {
          id: 'b',
          label: 'Consistently, often on an empty stomach away from other meds and supplements',
        },
        { id: 'c', label: 'At a random time each day' },
        { id: 'd', label: 'Right after calcium supplements' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A resident on thyroid medication gradually becomes more tired, cold, slow-thinking, and constipated. The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Assume it\'s just aging and say nothing' },
        { id: 'b', label: 'Report the pattern to the nurse' },
        { id: 'c', label: 'Tell them to exercise more' },
        { id: 'd', label: 'Wait several months' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Comfort care for a resident with an UNDERACTIVE (cold, slow) thyroid includes:',
      options: [
        { id: 'a', label: 'Keeping them cold' },
        {
          id: 'b',
          label: 'Keeping them warm and supporting gentle activity and bowel regularity',
        },
        { id: 'c', label: 'A loud, stimulating environment' },
        { id: 'd', label: 'Withholding fluids' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A resident with an overactive thyroid and an infection suddenly has a high fever, racing irregular heart, and agitation. The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Assume it\'s only the infection and wait' },
        {
          id: 'b',
          label: 'Recognize a possible thyroid emergency and activate emergency help immediately',
        },
        { id: 'c', label: 'Give thyroid medication' },
        { id: 'd', label: 'Let them rest and recheck later' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Why does a CNA\'s daily familiarity matter so much in thyroid care?',
      options: [
        { id: 'a', label: 'It doesn\'t matter' },
        {
          id: 'b',
          label: 'Thyroid changes are gradual, so daily observation catches patterns others miss',
        },
        { id: 'c', label: 'Only lab tests matter' },
        { id: 'd', label: 'CNAs never see residents' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Which task is OUTSIDE the CNA's scope of practice?",
      options: [
        { id: 'a', label: 'Supporting thyroid medication timing' },
        { id: 'b', label: 'Reporting signs of an unbalanced thyroid' },
        { id: 'c', label: 'Adjusting the thyroid medication dose or interpreting labs' },
        { id: 'd', label: 'Providing comfort matched to the resident\'s thyroid problem' },
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
      slug: THYROID_DISORDERS_FINAL_EXAM.slug,
      deletedAt: null,
    },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: THYROID_DISORDERS_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: THYROID_DISORDERS_FINAL_EXAM.passingScore,
          maxAttempts: THYROID_DISORDERS_FINAL_EXAM.maxAttempts,
          settings: THYROID_DISORDERS_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: THYROID_DISORDERS_FINAL_EXAM.slug,
          title: THYROID_DISORDERS_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: THYROID_DISORDERS_FINAL_EXAM.passingScore,
          maxAttempts: THYROID_DISORDERS_FINAL_EXAM.maxAttempts,
          settings: THYROID_DISORDERS_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of THYROID_DISORDERS_FINAL_EXAM.questions) {
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
