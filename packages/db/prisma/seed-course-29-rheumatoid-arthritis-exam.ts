/**
 * Seed the 10-question final exam for Caring for a Resident with Rheumatoid Arthritis.
 * Targets the v1 DRAFT course version created by seed-course-29-rheumatoid-arthritis (tenant cal-ace).
 *
 * Run: pnpm --filter @calace/db db:seed-course-29-rheumatoid-arthritis-exam
 */
import {
  AssessmentKind,
  CourseVersionStatus,
  PrismaClient,
  QuestionType,
} from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';
const COURSE_SLUG = 'rheumatoid-arthritis';

const RHEUMATOID_ARTHRITIS_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — Caring for a Resident with Rheumatoid Arthritis',
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
      prompt: 'Rheumatoid arthritis is best described as:',
      options: [
        { id: 'a', label: 'Ordinary wear-and-tear of the joints' },
        { id: 'b', label: 'An autoimmune disease where the immune system attacks the joints' },
        { id: 'c', label: 'A lung infection' },
        { id: 'd', label: 'A type of diabetes' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Unlike ordinary osteoarthritis, rheumatoid arthritis:',
      options: [
        { id: 'a', label: 'Only affects one joint ever' },
        { id: 'b', label: 'Is a whole-body disease that can cause fatigue and feeling unwell' },
        { id: 'c', label: 'Never causes pain' },
        { id: 'd', label: 'Only affects children' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'When helping a resident with RA move a stiff, painful joint, the CNA SHOULD:',
      options: [
        { id: 'a', label: 'Force it through the full range quickly' },
        { id: 'b', label: 'Move slowly, support the joint, and never force it' },
        { id: 'c', label: 'Pull firmly to loosen it' },
        { id: 'd', label: 'Ignore the resident\'s pain' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt: '"Morning stiffness" in RA means the CNA SHOULD:',
      options: [
        { id: 'a', label: 'Rush morning care to get it over with' },
        { id: 'b', label: 'Allow extra time and patience, as joints loosen later in the morning' },
        { id: 'c', label: 'Refuse to help in the morning' },
        { id: 'd', label: 'Expect the resident to be fastest first thing' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'During an RA flare (hot, swollen, very painful joints), the CNA SHOULD:',
      options: [
        { id: 'a', label: 'Push the resident through their usual full exercise routine' },
        {
          id: 'b',
          label: 'Give extra-gentle care, allow rest, avoid forcing movement, and report it',
        },
        { id: 'c', label: 'Tell them to move more to loosen up' },
        { id: 'd', label: 'Ignore it' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Many RA medications lower the body\'s defenses, which means residents:',
      options: [
        { id: 'a', label: 'Never get infections' },
        { id: 'b', label: 'Catch infections more easily and may show fewer obvious signs' },
        { id: 'c', label: 'Are immune to all illness' },
        { id: 'd', label: 'Always run very high fevers when sick' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A resident on immune-suppressing RA medication seems tired, eats little, feels "off," and has a slight cough and barely-raised temperature. The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Wait for a high fever before acting' },
        { id: 'b', label: 'Report these subtle signs to the nurse promptly' },
        { id: 'c', label: 'Assume it\'s just RA fatigue' },
        { id: 'd', label: 'Wait until the next shift' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Heat or cold treatments for RA joints should be used:',
      options: [
        { id: 'a', label: 'However the CNA prefers' },
        { id: 'b', label: 'Only as the care plan directs, protecting and testing the skin' },
        { id: 'c', label: 'As hot as possible' },
        { id: 'd', label: 'Without checking temperature' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A resident with RA has deep, whole-body fatigue. The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Treat it as laziness' },
        { id: 'b', label: 'Recognize it as a real part of the disease and respect their need for rest' },
        { id: 'c', label: 'Force them to stay active all day' },
        { id: 'd', label: 'Ignore it' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Which task is OUTSIDE the CNA's scope of practice?",
      options: [
        { id: 'a', label: 'Handling joints gently and timing care to stiffness' },
        { id: 'b', label: 'Watching for and reporting signs of infection' },
        { id: 'c', label: 'Giving or adjusting RA medications' },
        { id: 'd', label: 'Supporting independence with adaptive tools' },
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
      slug: RHEUMATOID_ARTHRITIS_FINAL_EXAM.slug,
      deletedAt: null,
    },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: RHEUMATOID_ARTHRITIS_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: RHEUMATOID_ARTHRITIS_FINAL_EXAM.passingScore,
          maxAttempts: RHEUMATOID_ARTHRITIS_FINAL_EXAM.maxAttempts,
          settings: RHEUMATOID_ARTHRITIS_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: RHEUMATOID_ARTHRITIS_FINAL_EXAM.slug,
          title: RHEUMATOID_ARTHRITIS_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: RHEUMATOID_ARTHRITIS_FINAL_EXAM.passingScore,
          maxAttempts: RHEUMATOID_ARTHRITIS_FINAL_EXAM.maxAttempts,
          settings: RHEUMATOID_ARTHRITIS_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of RHEUMATOID_ARTHRITIS_FINAL_EXAM.questions) {
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
