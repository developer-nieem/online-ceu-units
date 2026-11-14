/**
 * Seed the 10-question final exam for MRSA & Drug-Resistant Infections.
 * Targets the v1 DRAFT course version created by seed-course-42-mrsa-resistant-infections (tenant cal-ace).
 *
 * Run: pnpm --filter @calace/db db:seed-course-42-mrsa-resistant-infections-exam
 */
import {
  AssessmentKind,
  CourseVersionStatus,
  PrismaClient,
  QuestionType,
} from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';
const COURSE_SLUG = 'mrsa-resistant-infections';

const MRSA_RESISTANT_INFECTIONS_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — MRSA & Drug-Resistant Infections',
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
      prompt: 'Antibiotic resistance means:',
      options: [
        { id: 'a', label: 'Antibiotics work better over time' },
        {
          id: 'b',
          label: 'Bacteria have changed so the antibiotics meant to kill them no longer work',
        },
        { id: 'c', label: 'The resident is allergic to antibiotics' },
        { id: 'd', label: 'Antibiotics are too expensive' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'MRSA is:',
      options: [
        { id: 'a', label: 'A type of vitamin' },
        {
          id: 'b',
          label: 'A common bacterium (staph) that has become resistant to many antibiotics',
        },
        { id: 'c', label: 'A heart condition' },
        { id: 'd', label: 'A breathing machine' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A resident who is "colonized" with MRSA is:',
      options: [
        { id: 'a', label: 'Seriously ill and dangerous' },
        {
          id: 'b',
          label: 'Carrying the organism but not sick from it — precautions still apply',
        },
        { id: 'c', label: 'Cured of MRSA' },
        { id: 'd', label: 'Not carrying any organism' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'The single most powerful measure to stop the spread of resistant organisms is:',
      options: [
        { id: 'a', label: 'Thorough hand hygiene' },
        { id: 'b', label: 'Keeping the room dark' },
        { id: 'c', label: 'Avoiding the resident' },
        { id: 'd', label: 'Talking quietly' },
      ],
      correctAnswer: 'a',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Contact precautions for MRSA generally include:',
      options: [
        { id: 'a', label: 'Nothing extra' },
        {
          id: 'b',
          label: 'A gown and gloves for contact, removed carefully before leaving the room',
        },
        { id: 'c', label: 'Only a mask' },
        { id: 'd', label: 'Wearing the same gloves between residents' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'For a resident with C. diff, the CNA should clean their hands by:',
      options: [
        { id: 'a', label: 'Using alcohol sanitizer only' },
        {
          id: 'b',
          label: "Washing with soap and water (sanitizer doesn't kill the spores)",
        },
        { id: 'c', label: 'Not washing at all' },
        { id: 'd', label: 'Using only a dry wipe' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A resident on contact precautions needs quick help and you\'re very busy. The CNA SHOULD:',
      options: [
        { id: 'a', label: "Pop in without gowning since it's only a second" },
        {
          id: 'b',
          label: 'Gown and glove, help fully, then remove PPE properly before leaving',
        },
        { id: 'c', label: "Make the resident wait until you're free" },
        { id: 'd', label: 'Send another resident to help' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A resident develops watery, foul diarrhea days after finishing antibiotics. The CNA SHOULD:',
      options: [
        { id: 'a', label: "Assume it's something he ate" },
        {
          id: 'b',
          label: 'Report it promptly as possible C. diff and use soap-and-water handwashing',
        },
        { id: 'c', label: 'Give anti-diarrhea medicine' },
        { id: 'd', label: 'Use only alcohol sanitizer and move on' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'How can a CNA help support antibiotic stewardship?',
      options: [
        { id: 'a', label: 'Encourage sharing leftover antibiotics' },
        {
          id: 'b',
          label:
            'Support residents finishing their full prescribed course and never sharing or saving antibiotics',
        },
        { id: 'c', label: 'Stop antibiotics early when the resident feels better' },
        { id: 'd', label: 'Ignore missed doses' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Which task is OUTSIDE the CNA's scope of practice?",
      options: [
        { id: 'a', label: 'Following contact precautions and cleaning equipment' },
        { id: 'b', label: 'Watching for and reporting signs of infection' },
        {
          id: 'c',
          label: 'Diagnosing the infection, prescribing antibiotics, or setting isolation status',
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
      slug: MRSA_RESISTANT_INFECTIONS_FINAL_EXAM.slug,
      deletedAt: null,
    },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: MRSA_RESISTANT_INFECTIONS_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: MRSA_RESISTANT_INFECTIONS_FINAL_EXAM.passingScore,
          maxAttempts: MRSA_RESISTANT_INFECTIONS_FINAL_EXAM.maxAttempts,
          settings: MRSA_RESISTANT_INFECTIONS_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: MRSA_RESISTANT_INFECTIONS_FINAL_EXAM.slug,
          title: MRSA_RESISTANT_INFECTIONS_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: MRSA_RESISTANT_INFECTIONS_FINAL_EXAM.passingScore,
          maxAttempts: MRSA_RESISTANT_INFECTIONS_FINAL_EXAM.maxAttempts,
          settings: MRSA_RESISTANT_INFECTIONS_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of MRSA_RESISTANT_INFECTIONS_FINAL_EXAM.questions) {
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
