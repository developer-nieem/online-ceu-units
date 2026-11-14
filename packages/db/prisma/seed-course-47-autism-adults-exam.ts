/**
 * Seed the 10-question final exam for Supporting Autistic Adults & Older Adults.
 * Targets the v1 DRAFT course version created by seed-course-47-autism-adults (tenant cal-ace).
 *
 * Run: pnpm --filter @calace/db db:seed-course-47-autism-adults-exam
 */
import {
  AssessmentKind,
  CourseVersionStatus,
  PrismaClient,
  QuestionType,
} from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';
const COURSE_SLUG = 'autism-in-adults';

const AUTISM_IN_ADULTS_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — Supporting Autistic Adults & Older Adults',
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
      prompt: 'Autism is best understood as:',
      options: [
        { id: 'a', label: 'A mental illness that comes and goes' },
        {
          id: 'b',
          label: 'A lifelong neurodevelopmental difference — not an illness to cure',
        },
        { id: 'c', label: 'A disease caused by bad parenting' },
        { id: 'd', label: 'A temporary condition' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Why are many autistic older adults undiagnosed?',
      options: [
        { id: 'a', label: "They aren't really autistic" },
        {
          id: 'b',
          label: 'Autism was poorly understood when they grew up, so they were missed and mislabeled',
        },
        { id: 'c', label: 'They hid it on purpose to deceive people' },
        { id: 'd', label: 'Diagnosis is impossible in adults' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Sensory sensitivities in autistic people mean:',
      options: [
        { id: 'a', label: 'They feel nothing' },
        {
          id: 'b',
          label: 'Lights, noises, textures, smells, or touch can be overwhelming or even painful',
        },
        { id: 'c', label: 'They enjoy all loud environments' },
        { id: 'd', label: 'They have no preferences' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Stimming (such as rocking or hand-flapping) is:',
      options: [
        { id: 'a', label: 'Always harmful and must be stopped' },
        {
          id: 'b',
          label: 'Self-soothing behavior that helps regulation — and should be allowed',
        },
        { id: 'c', label: 'A sign of an emergency' },
        { id: 'd', label: 'Misbehavior' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A meltdown or shutdown is:',
      options: [
        { id: 'a', label: 'A tantrum for attention' },
        { id: 'b', label: 'A response to being overwhelmed — not misbehavior or defiance' },
        { id: 'c', label: 'Deliberate manipulation' },
        { id: 'd', label: 'A sign the person is dangerous' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A resident is overwhelmed and melting down in a loud, bright dining room. The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Be firm and make them finish their meal' },
        {
          id: 'b',
          label:
            'Calmly reduce the overwhelm — quieter, dimmer space, fewer demands, space — and allow stimming',
        },
        { id: 'c', label: 'Restrain them' },
        { id: 'd', label: 'Leave them alone in the loud room' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Regarding eye contact with an autistic resident, the CNA should:',
      options: [
        { id: 'a', label: 'Force them to make eye contact' },
        { id: 'b', label: 'Never force it — many find eye contact uncomfortable or painful' },
        { id: 'c', label: 'Refuse to speak unless they look at you' },
        { id: 'd', label: 'Consider lack of eye contact rude' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A resident who speaks little shows a clear change from baseline — more agitation, guarding her abdomen, not eating, pulling away from touch. The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Assume it\'s "just being autistic" and ignore it' },
        {
          id: 'b',
          label: 'Report the changes promptly — they may be how she communicates pain or illness',
        },
        { id: 'c', label: 'Demand she explain in words first' },
        { id: 'd', label: 'Wait several days' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'The guiding principle for caring for an autistic resident is:',
      options: [
        { id: 'a', label: 'Force them to act "normal"' },
        { id: 'b', label: 'Meet the person where they are — adjust the care to fit them' },
        { id: 'c', label: 'Treat everyone exactly the same way' },
        { id: 'd', label: 'Try to cure their autism' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Which is OUTSIDE the CNA's role with an autistic resident?",
      options: [
        { id: 'a', label: 'Accommodating sensory and routine needs' },
        { id: 'b', label: 'Communicating respectfully and responding calmly to distress' },
        {
          id: 'c',
          label: 'Trying to "cure" or change the resident\'s autism, or forcing neurotypical behavior',
        },
        { id: 'd', label: 'Allowing stimming and accepting the person' },
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
      slug: AUTISM_IN_ADULTS_FINAL_EXAM.slug,
      deletedAt: null,
    },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: AUTISM_IN_ADULTS_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: AUTISM_IN_ADULTS_FINAL_EXAM.passingScore,
          maxAttempts: AUTISM_IN_ADULTS_FINAL_EXAM.maxAttempts,
          settings: AUTISM_IN_ADULTS_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: AUTISM_IN_ADULTS_FINAL_EXAM.slug,
          title: AUTISM_IN_ADULTS_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: AUTISM_IN_ADULTS_FINAL_EXAM.passingScore,
          maxAttempts: AUTISM_IN_ADULTS_FINAL_EXAM.maxAttempts,
          settings: AUTISM_IN_ADULTS_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of AUTISM_IN_ADULTS_FINAL_EXAM.questions) {
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
