/**
 * Seed the 10-question final exam for COVID-19 & Emerging Respiratory Infections.
 * Targets the v1 DRAFT course version created by seed-course-43-covid-respiratory-illness (tenant cal-ace).
 *
 * Run: pnpm --filter @calace/db db:seed-course-43-covid-respiratory-illness-exam
 */
import {
  AssessmentKind,
  CourseVersionStatus,
  PrismaClient,
  QuestionType,
} from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';
const COURSE_SLUG = 'covid-respiratory-illness';

const COVID_RESPIRATORY_ILLNESS_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — COVID-19 & Emerging Respiratory Infections',
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
      prompt: 'Respiratory viruses like COVID, flu, and RSV mainly spread through:',
      options: [
        { id: 'a', label: 'Blood-to-blood contact only' },
        {
          id: 'b',
          label: 'The air and respiratory droplets from breathing, coughing, and sneezing',
        },
        { id: 'c', label: 'Shared food only' },
        { id: 'd', label: 'Insect bites' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Why are older adults especially vulnerable to respiratory infections?',
      options: [
        { id: 'a', label: 'They are never affected' },
        {
          id: 'b',
          label:
            'Weakened immunity, chronic heart/lung conditions, and close living make infections more severe',
        },
        { id: 'c', label: 'They have stronger lungs' },
        { id: 'd', label: 'They cannot catch viruses' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Droplet precautions for the flu generally include:',
      options: [
        { id: 'a', label: 'Nothing at all' },
        { id: 'b', label: 'Wearing a mask near the resident and distancing' },
        { id: 'c', label: 'Only gloves' },
        { id: 'd', label: 'A blood test' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A respirator (like an N95) differs from a regular mask because it:',
      options: [
        { id: 'a', label: 'Is exactly the same' },
        {
          id: 'b',
          label: 'Seals to the face and filters tiny airborne particles, protecting the wearer more',
        },
        { id: 'c', label: 'Offers no protection' },
        { id: 'd', label: 'Is only decorative' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'In older adults, a respiratory infection may first show up as:',
      options: [
        { id: 'a', label: 'Always a high fever and hard cough' },
        {
          id: 'b',
          label:
            'New confusion, weakness, poor appetite, or sudden decline — even without an obvious cough',
        },
        { id: 'c', label: 'Improved energy' },
        { id: 'd', label: 'No change at all' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A normally alert resident is suddenly confused, weak, and not eating during respiratory season, with only a slight cough. The CNA SHOULD:',
      options: [
        { id: 'a', label: "Assume it's just an off day and wait" },
        {
          id: 'b',
          label:
            'Report the sudden change promptly — it could be a respiratory infection presenting atypically',
        },
        { id: 'c', label: 'Wait for an obvious cough and fever first' },
        { id: 'd', label: 'Insist she eat and carry on' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A resident with a respiratory infection is now breathing fast and hard, can\'t speak a full sentence, and has bluish lips. The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Encourage rest and recheck in an hour' },
        {
          id: 'b',
          label: 'Get emergency help immediately — this is a life-threatening respiratory emergency',
        },
        { id: 'c', label: 'Have him lie flat and wait' },
        { id: 'd', label: 'Wait for the next scheduled check' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Which helps prevent the spread of respiratory viruses in a facility?',
      options: [
        { id: 'a', label: 'Coming to work with respiratory symptoms' },
        {
          id: 'b',
          label:
            'Correct masks/respirators, hand hygiene, distancing, ventilation, and vaccination support',
        },
        { id: 'c', label: 'Mixing sick and well residents during an outbreak' },
        { id: 'd', label: 'Skipping precautions when busy' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Why is reporting the very first case of respiratory illness early so important?',
      options: [
        { id: 'a', label: "It isn't important" },
        {
          id: 'b',
          label: 'Early detection lets the facility contain it before it becomes an outbreak',
        },
        { id: 'c', label: 'It only matters after many are sick' },
        { id: 'd', label: 'It helps with billing' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Which task is OUTSIDE the CNA's scope of practice?",
      options: [
        { id: 'a', label: 'Using respiratory PPE and following precautions' },
        { id: 'b', label: 'Recognizing and reporting respiratory symptoms' },
        {
          id: 'c',
          label: 'Diagnosing the infection, prescribing medication, or deciding isolation status',
        },
        { id: 'd', label: "Supporting an isolated resident's dignity" },
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
      slug: COVID_RESPIRATORY_ILLNESS_FINAL_EXAM.slug,
      deletedAt: null,
    },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: COVID_RESPIRATORY_ILLNESS_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: COVID_RESPIRATORY_ILLNESS_FINAL_EXAM.passingScore,
          maxAttempts: COVID_RESPIRATORY_ILLNESS_FINAL_EXAM.maxAttempts,
          settings: COVID_RESPIRATORY_ILLNESS_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: COVID_RESPIRATORY_ILLNESS_FINAL_EXAM.slug,
          title: COVID_RESPIRATORY_ILLNESS_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: COVID_RESPIRATORY_ILLNESS_FINAL_EXAM.passingScore,
          maxAttempts: COVID_RESPIRATORY_ILLNESS_FINAL_EXAM.maxAttempts,
          settings: COVID_RESPIRATORY_ILLNESS_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of COVID_RESPIRATORY_ILLNESS_FINAL_EXAM.questions) {
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
