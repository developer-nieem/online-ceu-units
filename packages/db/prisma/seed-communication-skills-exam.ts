/**
 * Seed a minimal 5-question final exam for Communication Skills in Long-Term Care.
 * Targets the current PUBLISHED course version (not a fixed version number).
 * Run: npx ts-node --project packages/db/tsconfig.json packages/db/prisma/seed-communication-skills-exam.ts
 */
import {
  AssessmentKind,
  CourseStatus,
  CourseVersionStatus,
  EnrollmentStatus,
  PrismaClient,
  QuestionType,
} from '@prisma/client';

import { DEMO_LEARNER_EMAIL } from './seed-enrollments';

const prisma = new PrismaClient();

const COURSE_SLUG = 'communication-skills';

const COMMUNICATION_SKILLS_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — Communication Skills in Long-Term Care',
  passingScore: 80,
  maxAttempts: 3,
  settings: {
    questionCount: 5,
    randomizeQuestions: true,
    randomizeOptions: true,
    requireAllLessons: true,
    activeParticipationRequired: true,
  },
  questions: [
    {
      sortOrder: 1,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A resident with dementia repeatedly asks to go home. What is the best CNA communication response?',
      options: [
        { id: 'a', label: 'Tell them they already live here and must accept it' },
        { id: 'b', label: 'Validate feelings and redirect with a calming activity' },
        { id: 'c', label: 'Ignore the request to avoid reinforcing confusion' },
        { id: 'd', label: 'Argue about reality until the resident agrees' },
      ],
      correctAnswer: 'b',
      explanation:
        'Validation and redirection support person-centered communication and reduce distress.',
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'When giving a shift handoff report to the oncoming nurse, a CNA should prioritize:',
      options: [
        { id: 'a', label: 'Personal opinions about family members' },
        { id: 'b', label: 'Objective, timely observations about resident status and changes' },
        { id: 'c', label: 'Gossip about coworkers to build rapport' },
        { id: 'd', label: 'Only tasks completed, without mentioning concerns' },
      ],
      correctAnswer: 'b',
      explanation:
        'Effective handoffs use clear, objective information so the care team can respond safely.',
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A family member is upset and speaking loudly in the hallway about care delays. What is the most professional CNA response?',
      options: [
        { id: 'a', label: 'Respond loudly so others understand your side' },
        { id: 'b', label: 'Listen calmly, acknowledge concerns, and involve the nurse per protocol' },
        { id: 'c', label: 'Walk away without responding' },
        { id: 'd', label: 'Share detailed medical information to prove you are right' },
      ],
      correctAnswer: 'b',
      explanation:
        'Calm, respectful communication and timely escalation protect residents and maintain trust.',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'Which approach best supports therapeutic communication with a resident who is hard of hearing?',
      options: [
        { id: 'a', label: 'Speak from another room to save time' },
        { id: 'b', label: 'Face the resident, speak clearly, and reduce background noise' },
        { id: 'c', label: 'Shout so everyone on the unit can hear' },
        { id: 'd', label: 'Use only written notes without verbal check-ins' },
      ],
      correctAnswer: 'b',
      explanation:
        'Visual cues, clear speech, and a quiet environment improve understanding and dignity.',
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'During team communication, a CNA notices a potential safety concern. The best action is to:',
      options: [
        { id: 'a', label: 'Wait until the end of the shift to mention it casually' },
        { id: 'b', label: 'Document objectively and report promptly to the nurse or supervisor' },
        { id: 'c', label: 'Discuss the concern only with other CNAs in the break room' },
        { id: 'd', label: 'Assume someone else already noticed and say nothing' },
      ],
      correctAnswer: 'b',
      explanation:
        'Timely, objective reporting supports resident safety and effective interdisciplinary care.',
    },
  ],
} as const;

async function main() {
  const course = await prisma.course.findFirst({
    where: { slug: COURSE_SLUG, deletedAt: null },
    select: { id: true, title: true },
  });

  if (!course) {
    console.error(`Course not found: ${COURSE_SLUG}`);
    process.exit(1);
  }

  await prisma.course.update({
    where: { id: course.id },
    data: { status: CourseStatus.PUBLISHED },
  });

  const version = await prisma.courseVersion.findFirst({
    where: {
      courseId: course.id,
      status: CourseVersionStatus.PUBLISHED,
      deletedAt: null,
    },
    orderBy: { versionNumber: 'desc' },
    select: { id: true, status: true, versionNumber: true },
  });

  if (!version) {
    console.error(`Published course version not found for: ${COURSE_SLUG}`);
    process.exit(1);
  }

  console.log(
    `Course version ID: ${version.id} (v${version.versionNumber}, status: ${version.status})`,
  );

  const demoLearner = await prisma.user.findFirst({
    where: { email: DEMO_LEARNER_EMAIL, deletedAt: null },
    select: { id: true, tenantId: true },
  });

  if (demoLearner) {
    await prisma.enrollment.upsert({
      where: {
        userId_courseVersionId: {
          userId: demoLearner.id,
          courseVersionId: version.id,
        },
      },
      create: {
        tenantId: demoLearner.tenantId,
        userId: demoLearner.id,
        courseVersionId: version.id,
        status: EnrollmentStatus.ACTIVE,
        enrolledAt: new Date(),
        startedAt: new Date(),
        metadata: { progressPercent: 0, seededForExam: true },
      },
      update: {
        status: EnrollmentStatus.ACTIVE,
        deletedAt: null,
      },
    });
    console.log(`Ensured demo learner enrollment on published version for ${DEMO_LEARNER_EMAIL}`);
  }

  const existing = await prisma.assessment.findFirst({
    where: { courseVersionId: version.id, slug: COMMUNICATION_SKILLS_FINAL_EXAM.slug, deletedAt: null },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: COMMUNICATION_SKILLS_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: COMMUNICATION_SKILLS_FINAL_EXAM.passingScore,
          maxAttempts: COMMUNICATION_SKILLS_FINAL_EXAM.maxAttempts,
          settings: COMMUNICATION_SKILLS_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: COMMUNICATION_SKILLS_FINAL_EXAM.slug,
          title: COMMUNICATION_SKILLS_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: COMMUNICATION_SKILLS_FINAL_EXAM.passingScore,
          maxAttempts: COMMUNICATION_SKILLS_FINAL_EXAM.maxAttempts,
          settings: COMMUNICATION_SKILLS_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of COMMUNICATION_SKILLS_FINAL_EXAM.questions) {
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
          explanation: q.explanation,
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
          explanation: q.explanation,
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
