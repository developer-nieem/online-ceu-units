import { AssessmentKind, QuestionType } from '@prisma/client';

/** Dementia Care for CNAs — final exam question bank. */
export const DEMENTIA_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — Dementia Care for CNAs',
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
      prompt: 'A resident with dementia repeatedly asks to go home. What is the best CNA response?',
      options: [
        { id: 'a', label: 'Tell them they already live here and must accept it' },
        { id: 'b', label: 'Validate feelings and redirect with a calming activity' },
        { id: 'c', label: 'Ignore the request to avoid reinforcing confusion' },
      ],
      correctAnswer: 'b',
      explanation: 'Validation and redirection support person-centered care and reduce distress.',
      metadata: { remediation: 'Review person-centered communication in Module 1.' },
    },
    {
      sortOrder: 2,
      type: QuestionType.TRUE_FALSE,
      prompt: 'Objective, dated documentation should be shared with the nurse when cognition changes.',
      options: [
        { id: 'true', label: 'True' },
        { id: 'false', label: 'False' },
      ],
      correctAnswer: 'true',
      explanation: 'Timely reporting supports care plan updates and regulatory compliance.',
    },
    {
      sortOrder: 3,
      type: QuestionType.MULTIPLE_CHOICE,
      prompt: 'Select all that apply: early signs of cognitive decline may include:',
      options: [
        { id: 'a', label: 'Repeating questions' },
        { id: 'b', label: 'Improved long-term memory only' },
        { id: 'c', label: 'Misplacing items' },
        { id: 'd', label: 'Withdrawal from activities' },
      ],
      correctAnswer: ['a', 'c', 'd'],
      explanation: 'Early signs often include memory changes, disorientation, and behavior shifts.',
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Scenario: A resident refuses evening hygiene and becomes tearful. First action?',
      options: [
        { id: 'a', label: 'Proceed quickly to finish tasks on time' },
        { id: 'b', label: 'Pause, offer choices, notify nurse per protocol' },
        { id: 'c', label: 'Document refusal only at end of shift' },
      ],
      correctAnswer: 'b',
      explanation: 'Safety, dignity, and nurse communication are priorities.',
      metadata: {
        scenarioContext: 'Maria, 82, has increased evening agitation during bathing this week.',
        remediation: 'See case study: Recognizing Early Signs.',
      },
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Which meal approach best supports a resident with dementia?',
      options: [
        { id: 'a', label: 'Large cafeteria-style trays to save time' },
        { id: 'b', label: 'Quiet setting, familiar foods, cueing and patience' },
        { id: 'c', label: 'Restrict fluids to prevent incontinence' },
      ],
      correctAnswer: 'b',
      explanation: 'Environment and cueing improve intake and dignity.',
    },
    {
      sortOrder: 6,
      type: QuestionType.TRUE_FALSE,
      prompt: 'Arguing about reality with a confused resident usually reduces agitation.',
      options: [
        { id: 'true', label: 'True' },
        { id: 'false', label: 'False' },
      ],
      correctAnswer: 'false',
      explanation: 'Reality orientation can increase distress; validation is preferred.',
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Wandering may indicate:',
      options: [
        { id: 'a', label: 'Unmet need such as pain, boredom, or toileting' },
        { id: 'b', label: 'Manipulative behavior only' },
        { id: 'c', label: 'No need for supervision' },
      ],
      correctAnswer: 'a',
      explanation: 'Assess triggers and maintain safe supervision.',
    },
    {
      sortOrder: 8,
      type: QuestionType.MULTIPLE_CHOICE,
      prompt: 'Select all that apply: infection prevention for CNAs includes:',
      options: [
        { id: 'a', label: 'Hand hygiene before and after resident contact' },
        { id: 'b', label: 'Reusing gloves between residents if they look clean' },
        { id: 'c', label: 'Following facility isolation precautions' },
        { id: 'd', label: 'Reporting fever or new cough to the nurse' },
      ],
      correctAnswer: ['a', 'c', 'd'],
      explanation: 'Standard precautions protect residents and staff.',
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Scenario: You notice a pattern of increased confusion over two weeks. You should:',
      options: [
        { id: 'a', label: 'Wait until injury occurs before reporting' },
        { id: 'b', label: 'Document objective observations and notify the nurse' },
        { id: 'c', label: 'Share opinions only with coworkers' },
      ],
      correctAnswer: 'b',
      metadata: {
        scenarioContext: 'Pattern changes require interdisciplinary follow-up.',
      },
      explanation: 'Objective reporting supports timely assessment.',
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'Preserving dignity during dementia care includes:',
      options: [
        { id: 'a', label: 'Using preferred name and protecting privacy' },
        { id: 'b', label: 'Discussing deficits in front of visitors' },
        { id: 'c', label: 'Rushing care to improve efficiency only' },
      ],
      correctAnswer: 'a',
      explanation: 'Dignity is a core CNA responsibility in California long-term care.',
    },
  ],
} as const;

export async function seedFinalExamForCourse(
  prisma: import('@prisma/client').PrismaClient,
  courseVersionId: string,
  courseSlug: string,
) {
  if (courseSlug !== 'dementia-care') return;

  const existing = await prisma.assessment.findFirst({
    where: { courseVersionId, slug: DEMENTIA_FINAL_EXAM.slug, deletedAt: null },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: DEMENTIA_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: DEMENTIA_FINAL_EXAM.passingScore,
          maxAttempts: DEMENTIA_FINAL_EXAM.maxAttempts,
          settings: DEMENTIA_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId,
          slug: DEMENTIA_FINAL_EXAM.slug,
          title: DEMENTIA_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: DEMENTIA_FINAL_EXAM.passingScore,
          maxAttempts: DEMENTIA_FINAL_EXAM.maxAttempts,
          settings: DEMENTIA_FINAL_EXAM.settings,
        },
      });

  for (const q of DEMENTIA_FINAL_EXAM.questions) {
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
          metadata: q.metadata ?? {},
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
          metadata: q.metadata ?? {},
        },
      });
    }
  }
}
export async function seedCourseAssessments(
  prisma: import('@prisma/client').PrismaClient,
  courseId: string,
  courseSlug: string,
): Promise<number> {
  const version = await prisma.courseVersion.findFirst({
    where: { courseId, versionNumber: 1, deletedAt: null },
    select: { id: true },
  });

  if (!version) return 0;

  await seedFinalExamForCourse(prisma, version.id, courseSlug);

  return courseSlug === 'dementia-care' ? 1 : 0;
}