/**
 * Standard final exam blueprint — 20-question bank architecture, 10 presented per attempt (configurable).
 * Backend scoring, rationales, remediation, and 3-attempt limit are unchanged.
 */

export const STANDARD_FINAL_EXAM_BLUEPRINT = {
  id: 'calace-final-exam-standard-v1',
  version: '1.1.0',
  slug: 'final-exam',
  titleTemplate: 'Final Exam — {courseTitle}',
  passingScore: 80,
  maxAttempts: 3,
  /** Production target: author 20+ questions; learner sees subset per attempt */
  targetBankSize: 20,
  settings: {
    questionCount: 10,
    randomizeQuestions: true,
    randomizeOptions: true,
    requireAllLessons: true,
    activeParticipationRequired: true,
  },
  messaging: {
    pass: 'You met the passing score. Complete your learner attestation to unlock your certificate and transcript entry.',
    fail: 'Review the rationales below and remediation notes before your next attempt (up to 3 attempts total).',
    remediationIntro:
      'Each item includes a rationale. Use remediation links to revisit lessons — update question metadata.remediation with lesson slugs.',
    rationaleLabel: 'Rationale',
    attemptRemainingTemplate: '{remaining} attempt(s) remaining.',
    bankNote:
      'Author 20 questions in CMS for production; the system randomizes a subset per attempt while preserving backend scoring.',
  },
  placeholderQuestions: [
    {
      sortOrder: 1,
      type: 'SINGLE_CHOICE' as const,
      prompt:
        '[Placeholder 1/20] A resident becomes agitated during care. What is the best first response for a CNA?',
      options: [
        { id: 'a', label: 'Proceed quickly to stay on schedule' },
        { id: 'b', label: 'Pause, ensure safety, offer choices, notify nurse per protocol' },
        { id: 'c', label: 'Document only at end of shift' },
      ],
      correctAnswer: 'b',
      explanation:
        'Person-centered care prioritizes safety, dignity, and timely nurse communication.',
      metadata: {
        remediation: 'Review scenario-interaction and cna-role-guidance lessons.',
        scenarioContext: 'Placeholder — replace with course-specific resident scenario.',
      },
    },
    {
      sortOrder: 2,
      type: 'TRUE_FALSE' as const,
      prompt:
        '[Placeholder 2/20] Objective, dated documentation should be shared with the nurse when a resident condition changes.',
      options: [
        { id: 'true', label: 'True' },
        { id: 'false', label: 'False' },
      ],
      correctAnswer: 'true',
      explanation: 'Timely reporting supports care plan updates and regulatory compliance.',
      metadata: { remediation: 'Review core-teaching-content and case-study lessons.' },
    },
    {
      sortOrder: 3,
      type: 'SINGLE_CHOICE' as const,
      prompt:
        '[Placeholder 3/20] Which action best reflects California CNA scope and professional practice?',
      options: [
        { id: 'a', label: 'Change a physician order independently' },
        { id: 'b', label: 'Perform only delegated tasks within scope and report concerns' },
        { id: 'c', label: 'Withhold information from the nurse to avoid conflict' },
      ],
      correctAnswer: 'b',
      explanation: 'CNAs work within scope and collaborate with licensed nurses.',
      metadata: { remediation: 'Review cna-role-guidance and cna-best-practices lessons.' },
    },
  ],
};

export type StandardFinalExamBlueprint = typeof STANDARD_FINAL_EXAM_BLUEPRINT;
