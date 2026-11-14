/**
 * Seed the 10-question final exam for Caring for a Resident with Parkinson's Disease.
 * Targets the v1 DRAFT course version created by seed-course-21-parkinsons (tenant cal-ace).
 *
 * Run: pnpm --filter @calace/db db:seed-course-21-parkinsons-exam
 */
import {
  AssessmentKind,
  CourseVersionStatus,
  PrismaClient,
  QuestionType,
} from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';
const COURSE_SLUG = 'parkinsons';

const PARKINSONS_FINAL_EXAM = {
  slug: 'final-exam',
  title: "Final Exam — Caring for a Resident with Parkinson's Disease",
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
      prompt: "Parkinson's disease mainly affects a person's:",
      options: [
        { id: 'a', label: 'Hearing' },
        { id: 'b', label: 'Movement and muscle control' },
        { id: 'c', label: 'Vision only' },
        { id: 'd', label: 'Skin' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        "A resident with Parkinson's moves slowly, speaks softly, and has little facial expression. The CNA SHOULD:",
      options: [
        { id: 'a', label: 'Assume their mind is slow and speak for them' },
        { id: 'b', label: 'Treat them as the alert, intelligent adult they are and allow time' },
        { id: 'c', label: 'Rush them to save time' },
        { id: 'd', label: 'Avoid talking to them' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Why is on-time medication so important in Parkinson's?",
      options: [
        { id: 'a', label: "It isn't important" },
        {
          id: 'b',
          label: 'A late dose can leave a resident rigid and unable to move or swallow safely',
        },
        { id: 'c', label: 'The medication can be given anytime' },
        { id: 'd', label: 'Timing only affects sleep' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "A resident's hand tremor and stiffness get worse as their next dose time approaches. The CNA SHOULD:",
      options: [
        { id: 'a', label: 'Give the next dose themselves' },
        { id: 'b', label: 'Report to the nurse promptly so the dose stays on time' },
        { id: 'c', label: 'Tell the resident to wait it out' },
        { id: 'd', label: 'Pull the resident up out of the chair' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'When a resident with Parkinson\'s "freezes" with their feet stuck, the CNA SHOULD:',
      options: [
        { id: 'a', label: 'Pull them forward firmly' },
        { id: 'b', label: 'Use gentle cues like marching in place or stepping over a line' },
        { id: 'c', label: 'Leave them alone until it passes' },
        { id: 'd', label: 'Tell them to hurry up' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Because swallowing problems are common in Parkinson's, at meals the CNA SHOULD:",
      options: [
        { id: 'a', label: 'Feed quickly to finish' },
        { id: 'b', label: 'Keep the resident upright, allow time, and watch for choking' },
        { id: 'c', label: 'Have them lie back while eating' },
        { id: 'd', label: 'Give only large bites' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "A resident with Parkinson's is choking — weak cough, can't speak, color changing. The CNA SHOULD:",
      options: [
        { id: 'a', label: 'Give a large drink of water' },
        {
          id: 'b',
          label: 'Activate emergency help immediately and follow choking response within training',
        },
        { id: 'c', label: 'Tell them to relax and wait' },
        { id: 'd', label: 'Lay them flat' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'The "on" and "off" times in Parkinson\'s refer to:',
      options: [
        { id: 'a', label: 'When the resident is asleep or awake' },
        { id: 'b', label: 'When medication is working well versus wearing off' },
        { id: 'c', label: 'The time of day only' },
        { id: 'd', label: 'Whether the lights are on' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "To prevent falls in a resident with Parkinson's, the CNA SHOULD:",
      options: [
        { id: 'a', label: 'Rush them to move faster' },
        { id: 'b', label: 'Stay close, keep pathways clear, and allow plenty of time' },
        { id: 'c', label: 'Leave them to walk alone' },
        { id: 'd', label: 'Remove their walking aid' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Which task is OUTSIDE the CNA's scope of practice?",
      options: [
        { id: 'a', label: 'Reporting that a resident is going "off"' },
        { id: 'b', label: 'Supporting safe eating' },
        { id: 'c', label: "Giving or adjusting the resident's Parkinson's medication" },
        { id: 'd', label: 'Helping a resident through a freeze with gentle cues' },
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
    where: { courseVersionId: version.id, slug: PARKINSONS_FINAL_EXAM.slug, deletedAt: null },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: PARKINSONS_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: PARKINSONS_FINAL_EXAM.passingScore,
          maxAttempts: PARKINSONS_FINAL_EXAM.maxAttempts,
          settings: PARKINSONS_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: PARKINSONS_FINAL_EXAM.slug,
          title: PARKINSONS_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: PARKINSONS_FINAL_EXAM.passingScore,
          maxAttempts: PARKINSONS_FINAL_EXAM.maxAttempts,
          settings: PARKINSONS_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of PARKINSONS_FINAL_EXAM.questions) {
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
