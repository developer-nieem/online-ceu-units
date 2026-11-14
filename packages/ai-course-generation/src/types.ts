import type {
  BlueprintPacingReport,
  BlueprintSectionKind,
  LessonContentDocument,
} from '@calace/content-blocks';

export type ComplianceReviewStatus = 'pending' | 'in_review' | 'approved' | 'rejected';

/** Instructor input for AI-assisted course generation. */
export type GenerateCourseInput = {
  title: string;
  courseCode?: string;
  slug?: string;
  targetAudience?: string;
  ceHours?: number;
  categorySlug?: string;
  categoryLabel?: string;
  /** e.g. California, CA */
  stateJurisdiction?: string;
  /** e.g. CNA */
  profession?: string;
  shortDescription?: string;
  /** California / CNA regulatory focus notes for the generator */
  californiaRelevance?: string;
  toneFocus?: string;
};

export type SourceReferencePlaceholder = {
  id: string;
  label: string;
  status: 'placeholder';
  note: string;
};

export type AiProviderId = 'mock' | 'openai' | 'anthropic';

export type AiApprovalStatus = 'pending_review' | 'instructor_approved' | 'rejected';

export type AiGenerationRecord = {
  source: AiProviderId;
  promptVersion: string;
  model: string | null;
  generatedAt: string;
  generatedByUserId?: string;
  approvalStatus: AiApprovalStatus;
  complianceReviewStatus: ComplianceReviewStatus;
  reviewedAt?: string;
  reviewedByUserId?: string;
  reviewerDisplayName?: string;
  reviewNotes?: string;
  input: GenerateCourseInput;
  sourceReferences?: SourceReferencePlaceholder[];
  /** Future: OpenAI / Anthropic / image / video / RAG adapter ids */
  integrationHooks?: {
    openai?: { enabled: false; model: null };
    anthropic?: { enabled: false; model: null };
    imageGeneration?: { enabled: false; provider: null };
    videoGeneration?: { enabled: false; provider: null };
    citationRag?: { enabled: false; libraryId: null };
    multiStateRules?: { enabled: false; adapterId: null };
  };
};

export type AiSafetyReviewItem = {
  id: string;
  label: string;
  status: 'pending' | 'reviewed' | 'not_applicable';
  note: string;
};

export type MediaGenerationPrompts = {
  /** Catalog / LMS tile — feed to imageGeneration integration hook */
  courseThumbnail: {
    prompt: string;
    aspectRatio: '16:9';
    pipelineHint: 'catalog-thumbnail';
  };
  infographicIdeas: string[];
  imagePrompts: { blockHint: string; prompt: string }[];
  miniVideoScripts: { title: string; durationLabel: string; script: string }[];
  downloadableHandouts: { title: string; description: string }[];
  narrationScripts: { blockHint: string; script: string }[];
  accessibilityCaptionNotes: string[];
  forumDiscussionPrompts: string[];
};

export type GeneratedExamQuestionDraft = {
  sortOrder: number;
  type: 'SINGLE_CHOICE' | 'TRUE_FALSE' | 'MULTIPLE_CHOICE';
  prompt: string;
  options: { id: string; label: string }[];
  correctAnswer: string | string[];
  explanation: string;
  metadata?: {
    remediation?: string;
    scenarioContext?: string;
    aiGenerated?: boolean;
  };
};

export type GeneratedLessonDraft = {
  moduleSlug: string;
  moduleTitle: string;
  slug: string;
  title: string;
  sectionKind: BlueprintSectionKind;
  estimatedActiveMinutes: number;
  interactionWeight: number;
  document: LessonContentDocument;
};

/** Structured plan — maps 1:1 to CMS entities (no freeform dump). */
export type CourseGenerationPlan = {
  blueprintId: string;
  blueprintVersion: string;
  summary: string;
  overview: string;
  learningObjectives: string[];
  keyTerms: string[];
  lessons: GeneratedLessonDraft[];
  exam: {
    slug: string;
    title: string;
    passingScore: number;
    maxAttempts: number;
    targetBankSize: number;
    settings: {
      questionCount: number;
      randomizeQuestions: boolean;
      randomizeOptions: boolean;
      requireAllLessons: boolean;
      activeParticipationRequired: boolean;
      /** Bank architecture — author to targetBankSize in CMS */
      questionPoolNote?: string;
    };
    messaging: Record<string, string>;
    questions: GeneratedExamQuestionDraft[];
  };
  pacing: BlueprintPacingReport;
  mediaPrompts: MediaGenerationPrompts;
  safetyReview: AiSafetyReviewItem[];
  generation: AiGenerationRecord;
};

export type CourseGenerationResult = {
  plan: CourseGenerationPlan;
  providerId: AiProviderId;
  durationMs: number;
};
