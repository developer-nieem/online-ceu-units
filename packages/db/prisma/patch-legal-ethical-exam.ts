/**
 * Seed the 10-question final exam for Legal & Ethical Issues in Nursing Practice.
 * Run: pnpm --filter @calace/db db:patch-legal-ethical-exam
 */
import { AssessmentKind, PrismaClient, QuestionType } from '@prisma/client';

const prisma = new PrismaClient();

const COURSE_SLUG = 'legal-ethical-nursing-practice';

const LEGAL_ETHICAL_FINAL_EXAM = {
  slug: 'final-exam',
  title: 'Final Exam — Legal & Ethical Issues in Nursing Practice',
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
      prompt:
        'Which statement best describes the CNA role in legal and ethical nursing practice?',
      options: [
        { id: 'a', label: 'Perform any task assigned, even if it requires nursing judgment' },
        { id: 'b', label: 'Provide hands-on care within certified scope and escalate concerns to the nurse' },
        { id: 'c', label: 'Make independent clinical decisions to save time on the unit' },
        { id: 'd', label: 'Share resident information freely with visitors to build trust' },
      ],
      correctAnswer: 'b',
      explanation:
        'CNAs deliver care within scope, protect resident rights, and escalate beyond scope to licensed staff.',
      metadata: { module: 'intro-overview', remediation: 'Review Module 1: Introduction & Overview.' },
    },
    {
      sortOrder: 2,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A new CNA asks why ethical practice matters for renewal compliance. What is the best answer?',
      options: [
        { id: 'a', label: 'Ethics only applies to nurses, not CNAs' },
        { id: 'b', label: 'Ethical practice protects residents, staff, and regulatory compliance' },
        { id: 'c', label: 'Ethics can be ignored when the unit is short-staffed' },
        { id: 'd', label: 'Ethics is optional if the resident cannot speak up' },
      ],
      correctAnswer: 'b',
      explanation:
        'Legal and ethical duties are core CNA responsibilities in California long-term care settings.',
      metadata: { module: 'intro-overview', remediation: 'Review Module 1: Introduction & Overview.' },
    },
    {
      sortOrder: 3,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'What does "scope of practice" mean for a certified nursing assistant?',
      options: [
        { id: 'a', label: 'Any task the charge nurse assigns during a busy shift' },
        { id: 'b', label: 'Tasks you are trained, certified, and authorized to perform under supervision' },
        { id: 'c', label: 'All medical procedures if the resident consents' },
        { id: 'd', label: 'Only documentation, never hands-on care' },
      ],
      correctAnswer: 'b',
      explanation:
        'Scope of practice is defined by training, certification, and facility policy — not convenience.',
      metadata: { module: 'terms-definitions', remediation: 'Review Module 2: Terms and Definitions Used.' },
    },
    {
      sortOrder: 4,
      type: QuestionType.SINGLE_CHOICE,
      prompt: 'A coworker says mandatory reporting is required only when abuse is proven. What is correct?',
      options: [
        { id: 'a', label: 'True — proof is required before any report' },
        { id: 'b', label: 'False — report reasonable suspicion through proper channels promptly' },
        { id: 'c', label: 'True — CNAs should investigate first' },
        { id: 'd', label: 'False — only physicians may report suspected abuse' },
      ],
      correctAnswer: 'b',
      explanation:
        'CNAs are mandatory reporters and must report suspected abuse or neglect without delay.',
      metadata: { module: 'terms-definitions', remediation: 'Review Module 2: Terms and Definitions Used.' },
    },
    {
      sortOrder: 5,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A resident with mild confusion wants to refuse a scheduled bath. What is the most ethical CNA response?',
      options: [
        { id: 'a', label: 'Proceed anyway because hygiene is required' },
        { id: 'b', label: 'Respect the refusal, ensure safety, and notify the nurse per protocol' },
        { id: 'c', label: 'Ignore the refusal and complete other tasks first' },
        { id: 'd', label: 'Tell the resident they have no choice' },
      ],
      correctAnswer: 'b',
      explanation:
        'Residents have the right to refuse care. CNAs support autonomy, maintain dignity, and escalate concerns.',
      metadata: { module: 'patient-rights-consent', remediation: 'Review Module 3: Patient Rights and Consent.' },
    },
    {
      sortOrder: 6,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A resident asks you to help them sign a consent form but seems unsure what they are agreeing to. What should you do?',
      options: [
        { id: 'a', label: 'Sign the form for them since they asked for help' },
        { id: 'b', label: 'Pause and notify the nurse — informed consent is outside CNA scope' },
        { id: 'c', label: 'Explain the treatment details yourself so they feel comfortable signing' },
        { id: 'd', label: 'Ask a family member in the hallway to explain and sign' },
      ],
      correctAnswer: 'b',
      explanation:
        'Obtaining informed consent requires licensed nursing or provider scope. CNAs recognize confusion and escalate.',
      metadata: { module: 'patient-rights-consent', remediation: 'Review Module 3: Patient Rights and Consent.' },
    },
    {
      sortOrder: 7,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'Under HIPAA, a CNA may share a resident\'s protected health information with which of the following?',
      options: [
        { id: 'a', label: 'The resident\'s family member in the hallway without verifying authorization' },
        { id: 'b', label: 'Members of the care team involved in the resident\'s treatment' },
        { id: 'c', label: 'A visitor who says they are a close friend' },
        { id: 'd', label: 'Social media contacts when the story could help others' },
      ],
      correctAnswer: 'b',
      explanation:
        'PHI may be shared with authorized care team members for treatment. Verify identity and authorization before other disclosures.',
      metadata: { module: 'hipaa-confidentiality', remediation: 'Review Module 4: HIPAA and Patient Confidentiality.' },
    },
    {
      sortOrder: 8,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'Scenario: A visitor in the elevator asks whether a named resident is "doing better." What is the best response?',
      options: [
        { id: 'a', label: 'Give a brief update without using the resident\'s full name' },
        { id: 'b', label: 'Decline to share PHI and direct the visitor to the nurse or front desk' },
        { id: 'c', label: 'Confirm the resident\'s condition to be helpful' },
        { id: 'd', label: 'Ask the visitor to wait while you check the chart in the hallway' },
      ],
      correctAnswer: 'b',
      explanation:
        'Never discuss resident conditions in public areas. Refer unauthorized requests to staff who can verify authorization.',
      metadata: {
        module: 'hipaa-confidentiality',
        scenarioContext: 'Public elevator — visitor is not verified as authorized to receive PHI.',
        remediation: 'Review Module 4: HIPAA and Patient Confidentiality.',
      },
    },
    {
      sortOrder: 9,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'You observe unexplained bruising on a resident who becomes fearful when a specific staff member enters the room. What is your mandatory CNA action?',
      options: [
        { id: 'a', label: 'Wait until you have proof before saying anything' },
        { id: 'b', label: 'Confront the staff member directly' },
        { id: 'c', label: 'Report your observations promptly to the nurse or supervisor per facility policy' },
        { id: 'd', label: 'Document the bruises only in your personal notes' },
      ],
      correctAnswer: 'c',
      explanation:
        'CNAs are mandatory reporters in California. Report suspected abuse or neglect immediately — proof is not required first.',
      metadata: { module: 'reporting-abuse', remediation: 'Review Module 5: Recognizing and Reporting Abuse.' },
    },
    {
      sortOrder: 10,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'A resident\'s family offers you a large cash gift for "taking such good care." What is the most appropriate response?',
      options: [
        { id: 'a', label: 'Accept the gift quietly to avoid offending the family' },
        { id: 'b', label: 'Politely decline and report the offer per facility policy on professional boundaries' },
        { id: 'c', label: 'Accept small gifts only, but large gifts are fine' },
        { id: 'd', label: 'Share your personal payment app so they can send it digitally' },
      ],
      correctAnswer: 'b',
      explanation:
        'Professional boundaries prohibit gifts that could influence care. Report significant gifts per facility policy.',
      metadata: { module: 'professional-boundaries', remediation: 'Review Module 6: Professional Boundaries & Care Delivery.' },
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

  const version = await prisma.courseVersion.findFirst({
    where: { courseId: course.id, versionNumber: 1, deletedAt: null },
    select: { id: true },
  });

  if (!version) {
    console.error(`Published course version not found for: ${COURSE_SLUG}`);
    process.exit(1);
  }

  const existing = await prisma.assessment.findFirst({
    where: { courseVersionId: version.id, slug: LEGAL_ETHICAL_FINAL_EXAM.slug, deletedAt: null },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: LEGAL_ETHICAL_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: LEGAL_ETHICAL_FINAL_EXAM.passingScore,
          maxAttempts: LEGAL_ETHICAL_FINAL_EXAM.maxAttempts,
          settings: LEGAL_ETHICAL_FINAL_EXAM.settings,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: LEGAL_ETHICAL_FINAL_EXAM.slug,
          title: LEGAL_ETHICAL_FINAL_EXAM.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: LEGAL_ETHICAL_FINAL_EXAM.passingScore,
          maxAttempts: LEGAL_ETHICAL_FINAL_EXAM.maxAttempts,
          settings: LEGAL_ETHICAL_FINAL_EXAM.settings,
        },
      });

  let questionsUpserted = 0;

  for (const q of LEGAL_ETHICAL_FINAL_EXAM.questions) {
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

    questionsUpserted += 1;
  }

  // Retire legacy questions beyond the 10-question bank (e.g. prior 5-question seed).
  const retired = await prisma.question.updateMany({
    where: {
      assessmentId: assessment.id,
      sortOrder: { gt: LEGAL_ETHICAL_FINAL_EXAM.questions.length },
      deletedAt: null,
    },
    data: { deletedAt: new Date() },
  });

  console.log(`Success: seeded final exam for "${course.title}" (${COURSE_SLUG}).`);
  console.log(
    `  Assessment: ${assessment.id} (${assessment.slug}, ${assessment.passingScore}% passing, ${questionsUpserted} questions)`,
  );
  if (retired.count > 0) {
    console.log(`  Retired legacy questions: ${retired.count}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
