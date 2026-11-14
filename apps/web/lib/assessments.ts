import { apiFetch } from './api';
import type { ParticipationComplianceStatus } from './participation';

export type PresentedQuestion = {
  id: string;
  type: string;
  prompt: string;
  options: Array<{ id: string; label: string }>;
  points: number;
  scenarioContext?: string;
};

export type OnlineCeEligibility = {
  deliveryMode: string;
  minutesPerCeuHour: number;
  seatTimeMinutes: number;
  requiredSeatTimeMinutes: number;
  seatTimeMet: boolean;
  interactionCount: number;
  attestationRequired: boolean;
  attestationCompleted: boolean;
  attestationText: string;
};

/** Supports API `onlineCe` and legacy `cdph` field names. */
export function getOnlineCeEligibility(
  eligibility: FinalExamOverview['eligibility'],
): OnlineCeEligibility {
  const e = eligibility as FinalExamOverview['eligibility'] & {
    cdph?: OnlineCeEligibility;
  };
  const src = e.onlineCe ?? e.cdph;
  return {
    deliveryMode: src?.deliveryMode ?? 'online',
    minutesPerCeuHour: src?.minutesPerCeuHour ?? 50,
    seatTimeMinutes: src?.seatTimeMinutes ?? 0,
    requiredSeatTimeMinutes: src?.requiredSeatTimeMinutes ?? 50,
    seatTimeMet: src?.seatTimeMet ?? false,
    interactionCount: src?.interactionCount ?? 0,
    attestationRequired: src?.attestationRequired ?? true,
    attestationCompleted: src?.attestationCompleted ?? false,
    attestationText:
      src?.attestationText ??
      'I attest that I personally completed this online continuing education course.',
  };
}

export type FinalExamOverview = {
  assessment: {
    id: string;
    slug: string;
    title: string;
    kind: string;
    passingScore: number;
    maxAttempts: number;
    questionBankSize: number;
    questionsPerAttempt: number;
  };
  eligibility: {
    eligible: boolean;
    reasons: string[];
    checks: {
      enrolled: boolean;
      lessonsComplete: boolean;
      interactionsComplete: boolean;
      seatTimeMet: boolean;
      activeParticipationAck: boolean;
      finalExamPassed: boolean;
      certificateAttestation: boolean;
    };
    lessonProgress: { completed: number; total: number };
    finalExam: {
      required: boolean;
      passed: boolean;
      attemptsUsed: number;
      maxAttempts: number;
      locked: boolean;
      requiresReset: boolean;
      canRestart: boolean;
      courseRestartPath: string | null;
      /** @deprecated Use requiresReset */
      requiresRepurchase?: boolean;
      /** @deprecated Use courseRestartPath */
      repurchaseCheckoutPath?: string | null;
      bestScore: number | null;
    };
    onlineCe: {
      deliveryMode: string;
      minutesPerCeuHour: number;
      seatTimeMinutes: number;
      requiredSeatTimeMinutes: number;
      seatTimeMet: boolean;
      interactionCount: number;
      attestationRequired: boolean;
      attestationCompleted: boolean;
      attestationText: string;
    };
  };
  attempts: Array<{
    id: string;
    attemptNum: number;
    status: string;
    score: number | null;
    startedAt: string;
    submittedAt: string | null;
    passed: boolean;
  }>;
  canStartAttempt: boolean;
  canResumeAttempt: boolean;
  inProgressAttemptId: string | null;
  participation?: ParticipationComplianceStatus;
};

export type StartAttemptResponse = {
  attemptId: string;
  attemptNum: number;
  passingScore: number;
  questions: PresentedQuestion[];
  questionCount: number;
  savedAnswers?: Record<string, string | string[]>;
};

export type SubmitAttemptResponse = {
  attemptId: string;
  status: string;
  score: number;
  passingScore: number;
  passed: boolean;
  results: Array<{
    questionId: string;
    correct: boolean;
    pointsEarned: number;
    pointsPossible: number;
    explanation: string | null;
    remediation: string | null;
    learnerAnswer: string | string[] | null;
    correctAnswerSummary: string | null;
  }>;
  remediationMessage: string | null;
  requiresCertificateAttestation?: boolean;
  attestationText?: string | null;
  requiresReset?: boolean;
  canRestart?: boolean;
  courseRestartPath?: string;
  /** @deprecated Use requiresReset */
  requiresRepurchase?: boolean;
  /** @deprecated Use courseRestartPath */
  repurchaseCheckoutPath?: string;
  attemptsUsed?: number;
  maxAttempts?: number;
  nextSteps: {
    message: string;
    certificatePlaceholder: string | null;
    href: string;
  } | null;
};

export async function fetchFinalExamOverview(courseSlug: string) {
  return apiFetch<FinalExamOverview>(`/assessments/courses/${courseSlug}/final-exam`);
}

const EXAM_ATTEMPT_TIMEOUT_MS = 20_000;

export async function startFinalExamAttempt(courseSlug: string) {
  return apiFetch<StartAttemptResponse>(
    `/assessments/courses/${courseSlug}/final-exam/attempts`,
    { method: 'POST', body: JSON.stringify({}), timeoutMs: EXAM_ATTEMPT_TIMEOUT_MS },
  );
}

export async function resumeFinalExamAttempt(courseSlug: string) {
  return apiFetch<StartAttemptResponse>(
    `/assessments/courses/${courseSlug}/final-exam/attempts/in-progress`,
    { timeoutMs: EXAM_ATTEMPT_TIMEOUT_MS },
  );
}

export async function submitExamAttempt(
  attemptId: string,
  answers: Record<string, string | string[]>,
) {
  return apiFetch<SubmitAttemptResponse>(`/assessments/attempts/${attemptId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  });
}

export async function saveExamAttemptAnswers(
  attemptId: string,
  answers: Record<string, string | string[]>,
) {
  return apiFetch<{ ok: true }>(`/assessments/attempts/${attemptId}/answers`, {
    method: 'PATCH',
    body: JSON.stringify({ answers }),
  });
}

export async function acknowledgeParticipation(courseSlug: string) {
  return apiFetch<{ success: boolean }>(
    `/assessments/courses/${courseSlug}/acknowledge-participation`,
    { method: 'POST', body: JSON.stringify({}) },
  );
}

export type EarnedMilestoneBadgePayload = {
  milestone: 'COURSES_3' | 'COURSES_6' | 'COURSES_9' | 'COURSES_12';
  coursesCompleted: number;
  title: string;
  message: string;
  imageSrc: string;
  isUltimate: boolean;
};

export async function attestCertificateRelease(courseSlug: string) {
  return apiFetch<{
    success: boolean;
    finalized: boolean;
    newBadgeEarned: EarnedMilestoneBadgePayload | null;
    eligibility: FinalExamOverview['eligibility'];
  }>(`/assessments/courses/${courseSlug}/attest-certificate-release`, {
    method: 'POST',
    body: JSON.stringify({ confirmed: true }),
  });
}
