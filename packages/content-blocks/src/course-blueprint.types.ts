import type { ContentBlockType } from './types';

/** Canonical blueprint identifiers — versioned for migrations. */
export const BLUEPRINT_IDS = {
  ONE_HOUR_CNA_CEU_V1: 'calace-one-hour-cna-ceu-v1',
} as const;

export type BlueprintId = (typeof BLUEPRINT_IDS)[keyof typeof BLUEPRINT_IDS];

/** CDPH-aware section kinds for CMS, AI, and player roadmap labels. */
export type BlueprintSectionKind =
  | 'welcome'
  | 'course_information'
  | 'learning_objectives'
  | 'instructor_intro'
  | 'key_terms'
  | 'mini_video'
  | 'core_teaching_content'
  | 'reading_content'
  | 'cna_role_guidance'
  | 'case_study'
  | 'scenario_interaction'
  | 'knowledge_check'
  | 'reflection'
  | 'cna_best_practices'
  | 'summary_recap'
  | 'what_happens_next'
  | 'attestation_guide'
  | 'certificate_access'
  | 'final_exam'
  | 'certificate_unlock';

export type BlueprintLessonDef = {
  slug: string;
  title: string;
  sectionKind: BlueprintSectionKind;
  estimatedActiveMinutes: number;
  interactionWeight: number;
  blockTypes: ContentBlockType[];
};

export type BlueprintModuleDef = {
  slug: string;
  title: string;
  description?: string;
  lessons: BlueprintLessonDef[];
};

export type CourseBlueprintDef = {
  id: BlueprintId;
  version: string;
  label: string;
  description: string;
  targetCeHours: number;
  targetCatalogMinutes: number;
  /** CDPH online CE: minimum active participation minutes per 1.0 CEU */
  targetActiveParticipationMinutes: number;
  modules: BlueprintModuleDef[];
  completionFlow: {
    finalExamSlug: string;
    attestationRoute: string;
    certificateUnlockRoute: string;
    transcriptRoute: string;
  };
};

export type QualityChecklistItem = {
  id: string;
  label: string;
  status: 'placeholder' | 'complete' | 'not_applicable';
  note: string;
};

export type QualityFrameworkPlaceholders = {
  cnaScopeAlignment: { status: 'placeholder'; note: string };
  californiaSpecificNotes: { status: 'placeholder'; note: string };
  healthcareVisuals: { status: 'placeholder'; note: string };
  infographics: { status: 'placeholder'; note: string };
  downloadableResources: { status: 'placeholder'; note: string };
  accessibilityCaptions: { status: 'placeholder'; wcagTarget: string; note: string };
  multilingual: { status: 'placeholder'; locales: string[]; note: string };
  referencesBibliography: { status: 'placeholder'; note: string };
  instructorAuthorMetadata: { status: 'placeholder'; note: string };
  cnaScenarios: { status: 'placeholder'; note: string };
};

export type EcosystemHooksPlaceholders = {
  badges: { enabled: false; integrationId: null };
  loyaltyStars: { enabled: false; integrationId: null };
  referralRewards: { enabled: false; integrationId: null };
  cnaNetworkCommunity: { enabled: false; url: string | null; integrationId: null };
  forumDiscussionPrompt: { enabled: false; integrationId: null };
  emailReminders: { enabled: false; integrationId: null };
  subscriptionBundleEligible: { enabled: false; integrationId: null };
  /** @deprecated use loyaltyStars */
  loyalty?: { enabled: false; integrationId: null };
  referrals?: { enabled: false; integrationId: null };
  communityForum?: { enabled: false; integrationId: null };
  notificationsReminders?: { enabled: false; integrationId: null };
  emailAutomations?: { enabled: false; integrationId: null };
  subscriptionsBundles?: { enabled: false; integrationId: null };
};

export type CompletionRoadmapStep = {
  id: string;
  order: number;
  label: string;
  description: string;
  /** Learner route pattern; :slug replaced at runtime */
  routePattern?: string;
};

export type LearningMilestoneDef = {
  id: string;
  label: string;
  lessonSlug?: string;
  progressPct: number;
  encouragement: string;
};

export type BlueprintPacingReport = {
  blueprintId: BlueprintId;
  targetActiveMinutes: number;
  minimumActiveMinutes: number;
  estimatedActiveMinutes: number;
  weightedParticipationMinutes: number;
  lessonCount: number;
  interactionLessonCount: number;
  meetsMinimumParticipation: boolean;
  valid: boolean;
  warnings: string[];
};
