/**
 * Seed the 10-question final exam for Hearing Impairment & Deaf Residents.
 * Targets the v1 DRAFT course version created by seed-course-49-hearing-impairment (tenant cal-ace).
 *
 * Run: pnpm --filter @calace/db db:seed-course-49-hearing-impairment-exam
 */
import {
  AssessmentKind,
  CourseVersionStatus,
  PrismaClient,
  QuestionType,
} from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';
const COURSE_SLUG = 'hearing-impairment';

const HEARING_IMPAIRMENT_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — Hearing Impairment & Deaf Residents',
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
      prompt: 'Presbycusis is:',
      options: [
        { id: 'a', label: 'A type of hearing aid' },
        { id: 'b', label: 'Age-related hearing loss — speech often sounds present but unclear' },
        { id: 'c', label: 'An ear infection' },
        { id: 'd', label: 'Total deafness from birth' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Why doesn't shouting help much with age-related hearing loss?",
      options: [
        { id: 'a', label: 'It always helps' },
        {
          id: 'b',
          label: 'The problem is often clarity, not just volume — clearer, slightly slower speech helps more',
        },
        { id: 'c', label: 'Shouting cures hearing loss' },
        { id: 'd', label: 'Residents enjoy being shouted at' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Hearing loss is frequently mistaken for:',
      options: [
        { id: 'a', label: 'Good hearing' },
        { id: 'b', label: 'Confusion, dementia, "non-compliance," or withdrawal' },
        { id: 'c', label: 'Excellent memory' },
        { id: 'd', label: 'Nothing at all' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'When communicating with a hearing-impaired resident, the CNA should:',
      options: [
        { id: 'a', label: 'Speak from another room, loudly' },
        {
          id: 'b',
          label: 'Get their attention first, face them in good light, and speak clearly at a natural pace',
        },
        { id: 'c', label: 'Cover their mouth while speaking' },
        { id: 'd', label: 'Speak as fast as possible' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A resident\'s hearing aid suddenly "isn\'t working." The CNA should FIRST:',
      options: [
        { id: 'a', label: 'Throw it away' },
        {
          id: 'b',
          label: 'Check the simple things — battery, power, volume, wax, and correct insertion',
        },
        { id: 'c', label: 'Try to repair the inside of it' },
        { id: 'd', label: 'Assume the resident is now fully deaf' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A resident watches your face closely, answers fine up close, but doesn\'t respond from across the room and keeps the TV very loud. This most likely indicates:',
      options: [
        { id: 'a', label: 'Dementia' },
        { id: 'b', label: 'Hearing loss — not confusion' },
        { id: 'c', label: 'Stubbornness' },
        { id: 'd', label: 'Nothing important' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Regarding earwax in a resident's ear, the CNA should:",
      options: [
        { id: 'a', label: 'Remove it themselves' },
        { id: 'b', label: 'Never remove it — report it; wax removal is not a CNA task' },
        { id: 'c', label: 'Dig it out with a cotton swab' },
        { id: 'd', label: 'Ignore all ear concerns' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A resident suddenly loses most hearing in one ear over a few hours, with fullness and dizziness. The CNA SHOULD:',
      options: [
        { id: 'a', label: "Assume it's just aging and speak on the other side" },
        {
          id: 'b',
          label:
            'Report it to the nurse promptly — sudden hearing loss can have treatable causes if caught quickly',
        },
        { id: 'c', label: 'Try to clean out the ear' },
        { id: 'd', label: 'Wait a week' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A Deaf resident who uses sign language should be:',
      options: [
        { id: 'a', label: 'Treated as less capable' },
        {
          id: 'b',
          label:
            'Respected for their language and culture, with interpreters arranged for important communication',
        },
        { id: 'c', label: 'Forced to speak aloud' },
        { id: 'd', label: 'Ignored' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Which is OUTSIDE the CNA's scope of practice?",
      options: [
        { id: 'a', label: 'Communicating clearly and caring for hearing aids' },
        { id: 'b', label: 'Recognizing hearing loss behind mislabels and reporting it' },
        { id: 'c', label: 'Diagnosing hearing loss, removing earwax, or treating the ears' },
        { id: 'd', label: 'Supporting safety, connection, and reporting ear problems' },
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
      slug: HEARING_IMPAIRMENT_FINAL_EXAM.slug,
      deletedAt: null,
    },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: HEARING_IMPAIRMENT_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: HEARING_IMPAIRMENT_FINAL_EXAM.passingScore,
          maxAttempts: HEARING_IMPAIRMENT_FINAL_EXAM.maxAttempts,
          settings: HEARING_IMPAIRMENT_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: HEARING_IMPAIRMENT_FINAL_EXAM.slug,
          title: HEARING_IMPAIRMENT_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: HEARING_IMPAIRMENT_FINAL_EXAM.passingScore,
          maxAttempts: HEARING_IMPAIRMENT_FINAL_EXAM.maxAttempts,
          settings: HEARING_IMPAIRMENT_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of HEARING_IMPAIRMENT_FINAL_EXAM.questions) {
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
