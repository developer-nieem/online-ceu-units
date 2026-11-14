import type { QuestionType } from '@calace/db';

export type QuestionOption = { id: string; label: string };

export type AssessmentSettings = {
  questionCount: number;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  /** When true, all lessons except final-exam gate must be complete */
  requireAllLessons: boolean;
  activeParticipationRequired: boolean;
};

export const DEFAULT_FINAL_EXAM_SETTINGS: AssessmentSettings = {
  questionCount: 20,
  randomizeQuestions: true,
  randomizeOptions: true,
  requireAllLessons: true,
  activeParticipationRequired: true,
};

export type IntegritySettings = {
  enabled: boolean;
  mode: 'flag' | 'enforce';
  maxViolations: number;
  debounceMs: number;
};

export const DEFAULT_INTEGRITY_SETTINGS: IntegritySettings = {
  enabled: false,
  mode: 'flag',
  maxViolations: 3,
  debounceMs: 1500,
};

export type PresentedQuestion = {
  id: string;
  type: QuestionType;
  prompt: string;
  options: QuestionOption[];
  points: number;
  scenarioContext?: string;
};

export type AttemptPresentation = {
  presentedQuestionIds: string[];
  optionOrders: Record<string, string[]>;
};

export type LearnerAnswerValue = string | string[];

export type GradedQuestionResult = {
  questionId: string;
  correct: boolean;
  pointsEarned: number;
  pointsPossible: number;
  explanation: string | null;
  remediation: string | null;
  learnerAnswer: LearnerAnswerValue | null;
  /** Shown only after submit */
  correctAnswerSummary: string | null;
};
