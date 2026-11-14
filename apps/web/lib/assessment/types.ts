/** CMS-facing assessment lifecycle stored in Assessment.settings.status. */
export type CmsAssessmentStatus = 'draft' | 'published' | 'archived';

export type CmsAssessmentKind = 'quiz' | 'final_exam';

export type CmsQuestionType = 'single_choice' | 'true_false';

export interface CmsQuestionOption {
  id: string;
  label: string;
}

export interface CmsAssessmentQuestion {
  id: string;
  sortOrder: number;
  type: CmsQuestionType;
  prompt: string;
  options: CmsQuestionOption[];
  /** Admin-only — omitted for learner delivery. */
  correctAnswer?: { optionId?: string; value?: boolean };
  explanation?: string;
}

export interface CmsAssessment {
  id: string;
  courseId: string;
  courseVersionId?: string;
  lessonId?: string;
  lessonSlug?: string;
  slug: string;
  title: string;
  kind: CmsAssessmentKind;
  instructions?: string;
  passingScorePercent: number;
  maxAttempts?: number | null;
  status: CmsAssessmentStatus;
  questions: CmsAssessmentQuestion[];
  createdAt?: string;
  updatedAt?: string;
}

export type CmsAssessmentInput = Omit<CmsAssessment, 'id' | 'questions' | 'createdAt' | 'updatedAt'> & {
  id?: string;
  questions?: CmsAssessmentQuestion[];
};

export type CmsQuestionInput = Omit<CmsAssessmentQuestion, 'id'> & { id?: string };

export interface LearnerAssessmentView {
  id: string;
  title: string;
  kind: CmsAssessmentKind;
  instructions?: string;
  passingScorePercent: number;
  questions: Array<{
    id: string;
    sortOrder: number;
    type: CmsQuestionType;
    prompt: string;
    options: CmsQuestionOption[];
  }>;
}

export interface AssessmentAttemptSummary {
  id: string;
  assessmentId: string;
  assessmentTitle: string;
  attemptNum: number;
  status: 'in_progress' | 'passed' | 'failed' | 'submitted';
  score?: number;
  submittedAt?: string;
  passed: boolean;
}

export interface AdminAttemptRecord extends AssessmentAttemptSummary {
  learnerEmail: string;
  learnerName: string;
  courseTitle: string;
}

export interface SubmitAttemptInput {
  assessmentId: string;
  enrollmentId: string;
  userId: string;
  courseId: string;
  lessonId?: string;
  responses: Record<string, { optionId?: string; value?: boolean }>;
}

export interface SubmitAttemptResult {
  attemptId: string;
  score: number;
  passed: boolean;
  passingScorePercent: number;
  lessonCompleted?: boolean;
  progressPercent?: number;
}
