/** CourseVersion.contentMeta — CMS + compliance placeholders */
export type CmsComplianceMeta = {
  providerName?: string;
  approvalNote?: string;
  licenseInfo?: string;
  cdphApprovalStatus?: 'pending' | 'approved' | 'placeholder' | 'expired';
  nacProviderReference?: string;
  targetAudience?: string;
  requiredSeatTimeMinutes?: number;
  onlineDeliveryDesignation?: 'online' | 'hybrid' | 'in_person';
  regulatoryNotes?: string;
};

export type CmsVersioningMeta = {
  revisionNotes?: string;
  /** When true, completions lock this version from in-place edits (audit trail). */
  immutableAfterPublish?: boolean;
  publishedByUserId?: string;
  submittedForReviewAt?: string;
};

export type CmsCourseBlueprintMeta = {
  blueprintId: string;
  blueprintVersion: string;
  appliedAt?: string;
  targetActiveParticipationMinutes?: number;
  pacing?: {
    estimatedActiveMinutes?: number;
    weightedParticipationMinutes?: number;
    valid?: boolean;
    warnings?: string[];
  };
};

export type CmsLearningExperienceMeta = {
  milestones?: { id: string; label: string; lessonSlug?: string; progressPct: number; encouragement: string }[];
  tone?: 'professional_healthcare';
};

export type CmsQualityFrameworkMeta = {
  cnaScopeAlignment?: { status: string; note: string };
  californiaSpecificNotes?: { status: string; note: string };
  healthcareVisuals?: { status: string; note: string };
  infographics?: { status: string; note: string };
  downloadableResources?: { status: string; note: string };
  accessibilityCaptions?: { status: string; wcagTarget: string; note: string };
  multilingual?: { status: string; locales: string[]; note: string };
  referencesBibliography?: { status: string; note: string };
  instructorAuthorMetadata?: { status: string; note: string };
  cnaScenarios?: { status: string; note: string };
};

export type CmsQualityChecklistItem = {
  id: string;
  label: string;
  status: string;
  note: string;
};

/** Placeholder integration keys — wire providers later without schema migrations. */
export type CmsEcosystemHooksMeta = {
  badges?: { enabled: boolean; integrationId: string | null };
  loyaltyStars?: { enabled: boolean; integrationId: string | null };
  referralRewards?: { enabled: boolean; integrationId: string | null };
  cnaNetworkCommunity?: { enabled: boolean; url: string | null; integrationId: string | null };
  forumDiscussionPrompt?: { enabled: boolean; integrationId: string | null };
  emailReminders?: { enabled: boolean; integrationId: string | null };
  subscriptionBundleEligible?: { enabled: boolean; integrationId: string | null };
};

export type CmsExamBlueprintMeta = {
  examBlueprintId?: string;
  targetBankSize?: number;
  maxAttempts?: number;
  passingScore?: number;
  messaging?: Record<string, string>;
};

export type CmsCompletionRoadmapStep = {
  id: string;
  order: number;
  label: string;
  description: string;
  routePattern?: string;
};

export type CmsAiGenerationMeta = {
  source: 'mock' | 'openai' | 'anthropic';
  promptVersion: string;
  model: string | null;
  generatedAt: string;
  generatedByUserId?: string;
  approvalStatus: 'pending_review' | 'instructor_approved' | 'rejected';
  complianceReviewStatus?: 'pending' | 'in_review' | 'approved' | 'rejected';
  reviewedAt?: string;
  reviewedByUserId?: string;
  reviewerDisplayName?: string;
  reviewNotes?: string;
  input: Record<string, unknown>;
  sourceReferences?: { id: string; label: string; status: string; note: string }[];
  integrationHooks?: Record<string, unknown>;
};

export type CmsAiSafetyReviewItem = {
  id: string;
  label: string;
  status: 'pending' | 'reviewed' | 'not_applicable';
  note: string;
};

export type CmsMediaPromptsMeta = {
  courseThumbnail?: { prompt: string; aspectRatio: string; pipelineHint: string };
  infographicIdeas?: string[];
  imagePrompts?: { blockHint: string; prompt: string }[];
  miniVideoScripts?: { title: string; durationLabel: string; script: string }[];
  downloadableHandouts?: { title: string; description: string }[];
  narrationScripts?: { blockHint: string; script: string }[];
  accessibilityCaptionNotes?: string[];
  forumDiscussionPrompts?: string[];
};

export type CmsAiVideoPipelineMeta = {
  lastRunAt?: string;
  provider?: 'placeholder' | 'synthesia' | 'heygen';
  assetCount?: number;
  assets?: { blockId: string; lessonSlug: string; videoUrl: string }[];
};

export type CmsCourseContentMeta = {
  overview?: string;
  learningObjectives?: string[];
  faq?: { question: string; answer: string }[];
  compliance?: CmsComplianceMeta;
  imageAccent?: string;
  versioning?: CmsVersioningMeta;
  blueprint?: CmsCourseBlueprintMeta;
  aiGeneration?: CmsAiGenerationMeta;
  aiSafetyReview?: CmsAiSafetyReviewItem[];
  mediaPrompts?: CmsMediaPromptsMeta;
  aiVideoPipeline?: CmsAiVideoPipelineMeta;
  learningExperience?: CmsLearningExperienceMeta & {
    completionRoadmap?: CmsCompletionRoadmapStep[];
  };
  qualityFramework?: CmsQualityFrameworkMeta;
  qualityChecklist?: CmsQualityChecklistItem[];
  ecosystemHooks?: CmsEcosystemHooksMeta;
  examBlueprint?: CmsExamBlueprintMeta;
};

export type CmsCatalogData = {
  price?: number;
  durationMinutes?: number;
  displayDuration?: string;
  difficulty?: string;
  instructor?: string;
  featured?: boolean;
  hasFreePreview?: boolean;
  subscriptionEligible?: boolean;
  courseCode?: string;
  /** Pending AI image pipeline output — set thumbnailUrl after asset generation */
  thumbnailGenerationPrompt?: string;
};

export type CmsLessonRequirements = {
  requiredForCompletion?: boolean;
  minimumViewMinutes?: number;
};
