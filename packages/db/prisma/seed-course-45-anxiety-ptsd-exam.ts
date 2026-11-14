/**
 * Seed the 10-question final exam for Anxiety & PTSD in Older Adults.
 * Targets the v1 DRAFT course version created by seed-course-45-anxiety-ptsd (tenant cal-ace).
 *
 * Run: pnpm --filter @calace/db db:seed-course-45-anxiety-ptsd-exam
 */
import {
  AssessmentKind,
  CourseVersionStatus,
  PrismaClient,
  QuestionType,
} from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';
const COURSE_SLUG = 'anxiety-ptsd';

const ANXIETY_PTSD_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — Anxiety & PTSD in Older Adults',
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
      prompt: 'An anxiety disorder is:',
      options: [
        { id: 'a', label: 'Ordinary, brief worry' },
        {
          id: 'b',
          label:
            'Persistent, excessive fear or worry that interferes with daily life — a real, treatable condition',
        },
        { id: 'c', label: 'A normal part of aging to ignore' },
        { id: 'd', label: 'A sign of weakness' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'PTSD develops after:',
      options: [
        { id: 'a', label: 'Eating poorly' },
        {
          id: 'b',
          label: 'Experiencing or witnessing something terrifying, like combat, assault, or abuse',
        },
        { id: 'c', label: 'Mild everyday stress' },
        { id: 'd', label: 'Too much sleep' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A "trigger" for a trauma survivor is:',
      options: [
        { id: 'a', label: 'A type of medication' },
        {
          id: 'b',
          label: 'Anything that reminds them of the trauma and sets off intense fear',
        },
        { id: 'c', label: 'A scheduled activity' },
        { id: 'd', label: 'A kind of exercise' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Why can dementia bring old trauma back?',
      options: [
        { id: 'a', label: "It can't" },
        {
          id: 'b',
          label:
            'As recent memory fades, decades-old traumatic memories can become vivid and feel present again',
        },
        { id: 'c', label: 'Dementia erases all old memories first' },
        { id: 'd', label: 'Dementia only affects mood' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Trauma-informed care includes:',
      options: [
        { id: 'a', label: 'Surprising residents to keep care quick' },
        {
          id: 'b',
          label: 'Predictability, explaining before touching, asking consent, and offering choices',
        },
        { id: 'c', label: 'Touching without warning' },
        { id: 'd', label: 'Removing all choices' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        "A resident in a flashback raises his fists and doesn't recognize you. The CNA SHOULD:",
      options: [
        { id: 'a', label: 'Grab his arms to restrain him' },
        {
          id: 'b',
          label:
            'Step back, give space, stay calm with hands visible, gently ground him, and pause the task',
        },
        { id: 'c', label: "Argue with him about what's real" },
        { id: 'd', label: 'Rush to finish his care' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        "During a flashback, arguing with the resident about what's real or calling them ridiculous will:",
      options: [
        { id: 'a', label: 'Snap them out of it' },
        {
          id: 'b',
          label: 'Deepen their terror — never argue with their reality; ground gently instead',
        },
        { id: 'c', label: 'Always calm them immediately' },
        { id: 'd', label: 'Have no effect' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A resident with known panic attacks has chest tightness, racing heart, and breathlessness. The CNA SHOULD:',
      options: [
        { id: 'a', label: "Assume it's just anxiety and not report" },
        {
          id: 'b',
          label:
            'Stay with her, keep her calm, AND report the symptoms promptly — they overlap with cardiac emergencies',
        },
        { id: 'c', label: 'Have her walk it off alone' },
        { id: 'd', label: 'Tell her to stop overreacting' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A resident always becomes fearful during bathing. The most helpful thing for the CNA to note and report is:',
      options: [
        { id: 'a', label: "Nothing — it's just behavior" },
        {
          id: 'b',
          label:
            'What happens just before the fear — the task, sound, or approach — so triggers can be identified and avoided',
        },
        { id: 'c', label: 'Only the time of day' },
        { id: 'd', label: 'The weather' },
      ],
      correctAnswer: 'b',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: "Which task is OUTSIDE the CNA's scope of practice?",
      options: [
        { id: 'a', label: 'Delivering predictable, explained, consented care' },
        { id: 'b', label: 'Calmly grounding a resident during a flashback and reporting it' },
        {
          id: 'c',
          label: 'Providing trauma therapy or asking the resident to recount their trauma',
        },
        { id: 'd', label: 'Reporting triggers and patterns to the nurse' },
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
      slug: ANXIETY_PTSD_FINAL_EXAM.slug,
      deletedAt: null,
    },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: ANXIETY_PTSD_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: ANXIETY_PTSD_FINAL_EXAM.passingScore,
          maxAttempts: ANXIETY_PTSD_FINAL_EXAM.maxAttempts,
          settings: ANXIETY_PTSD_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: ANXIETY_PTSD_FINAL_EXAM.slug,
          title: ANXIETY_PTSD_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: ANXIETY_PTSD_FINAL_EXAM.passingScore,
          maxAttempts: ANXIETY_PTSD_FINAL_EXAM.maxAttempts,
          settings: ANXIETY_PTSD_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of ANXIETY_PTSD_FINAL_EXAM.questions) {
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
