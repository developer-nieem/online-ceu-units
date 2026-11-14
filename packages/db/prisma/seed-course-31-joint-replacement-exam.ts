/**
 * Seed the 10-question final exam for Caring for a Resident with a Joint Replacement.
 * Targets the v1 DRAFT course version created by seed-course-31-joint-replacement (tenant cal-ace).
 *
 * Run: pnpm --filter @calace/db db:seed-course-31-joint-replacement-exam
 */
import {
  AssessmentKind,
  CourseVersionStatus,
  PrismaClient,
  QuestionType,
} from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';
const COURSE_SLUG = 'joint-replacement';

const JOINT_REPLACEMENT_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — Caring for a Resident with a Joint Replacement',
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
      prompt: 'A joint replacement is:',
      options: [
        { id: 'a', label: 'A cast placed on a broken bone' },
        { id: 'b', label: 'Surgery replacing a damaged joint with an artificial one' },
        { id: 'c', label: 'A type of medication' },
        { id: 'd', label: 'A physical therapy exercise' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Movement precautions after a hip replacement exist to:',
      options: [
        { id: 'a', label: 'Make care take longer' },
        { id: 'b', label: 'Prevent the new hip from dislocating before it heals' },
        { id: 'c', label: 'Build muscle' },
        { id: 'd', label: 'Reduce the wound size' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Who sets a resident's movement precautions and weight-bearing status?",
      options: [
        { id: 'a', label: 'The CNA decides' },
        { id: 'b', label: 'The surgeon and care team — the CNA follows them' },
        { id: 'c', label: 'The resident chooses' },
        { id: 'd', label: 'No one — they are optional' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Common hip precautions usually include NOT:',
      options: [
        { id: 'a', label: 'Lying on your back' },
        { id: 'b', label: 'Bending the hip too far, crossing the legs, or turning the leg inward' },
        { id: 'c', label: 'Eating meals' },
        { id: 'd', label: 'Talking with visitors' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Why is early, safe movement important after joint replacement?',
      options: [
        { id: 'a', label: 'It is not important; staying still is best' },
        { id: 'b', label: 'Immobility causes dangerous blood clots, so safe movement prevents them' },
        { id: 'c', label: 'It makes the wound bigger' },
        { id: 'd', label: 'It causes dislocation' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "A resident's calf is swollen, warm, red, and painful after surgery. This may be:",
      options: [
        { id: 'a', label: 'Completely normal and ignored' },
        { id: 'b', label: 'A blood clot (DVT) — report it promptly' },
        { id: 'c', label: 'A sign of good healing' },
        { id: 'd', label: 'A reason to massage the calf hard' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A resident suddenly has shortness of breath and sharp chest pain days after surgery. The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Have them rest and recheck later' },
        { id: 'b', label: 'Activate emergency help immediately — possible clot in the lungs' },
        { id: 'c', label: 'Have them walk it off' },
        { id: 'd', label: 'Give pain medicine and wait' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A resident has sudden severe hip pain and a leg that looks shorter and turned after a forbidden movement. The CNA SHOULD:',
      options: [
        { id: 'a', label: 'Push the joint back into place' },
        { id: 'b', label: 'Keep them still, not move the leg, and get help immediately' },
        { id: 'c', label: 'Help them stand to walk it off' },
        { id: 'd', label: 'Have them keep moving the leg' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Which suggests a wound infection that should be reported?',
      options: [
        { id: 'a', label: 'Pain that steadily improves each day' },
        { id: 'b', label: 'Increasing redness, warmth, drainage, odor, or fever' },
        { id: 'c', label: 'A clean, dry, healing wound' },
        { id: 'd', label: 'Normal healing' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Which task is OUTSIDE the CNA's scope of practice?",
      options: [
        { id: 'a', label: "Following the resident's movement precautions" },
        { id: 'b', label: 'Supporting safe prescribed exercises' },
        { id: 'c', label: 'Setting or changing the weight-bearing status' },
        { id: 'd', label: 'Reporting signs of a complication' },
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
      slug: JOINT_REPLACEMENT_FINAL_EXAM.slug,
      deletedAt: null,
    },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: JOINT_REPLACEMENT_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: JOINT_REPLACEMENT_FINAL_EXAM.passingScore,
          maxAttempts: JOINT_REPLACEMENT_FINAL_EXAM.maxAttempts,
          settings: JOINT_REPLACEMENT_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: JOINT_REPLACEMENT_FINAL_EXAM.slug,
          title: JOINT_REPLACEMENT_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: JOINT_REPLACEMENT_FINAL_EXAM.passingScore,
          maxAttempts: JOINT_REPLACEMENT_FINAL_EXAM.maxAttempts,
          settings: JOINT_REPLACEMENT_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of JOINT_REPLACEMENT_FINAL_EXAM.questions) {
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
