import { BLUEPRINT_IDS, type CourseBlueprintDef, type LearningMilestoneDef } from './course-blueprint.types';

/**
 * Production 1-hour CNA CEU blueprint v1.1 — full CDPH-aware learner flow.
 * 50 minutes active participation; exam, attestation, certificate, transcript are system steps.
 */
export const ONE_HOUR_CNA_CEU_BLUEPRINT: CourseBlueprintDef = {
  id: BLUEPRINT_IDS.ONE_HOUR_CNA_CEU_V1,
  version: '1.1.0',
  label: '1-Hour CNA Online CEU (Standard)',
  description:
    'Complete orientation, instruction, knowledge checks, recap, final exam, attestation, certificate, and transcript entry — aligned to 1 Online CE hour and 50 active minutes.',
  targetCeHours: 1,
  targetCatalogMinutes: 60,
  targetActiveParticipationMinutes: 50,
  completionFlow: {
    finalExamSlug: 'final-exam',
    attestationRoute: '/courses/:slug/attestation',
    certificateUnlockRoute: '/courses/:slug/certificate',
    transcriptRoute: '/transcripts',
  },
  modules: [
    {
      slug: 'orientation',
      title: 'Orientation',
      description: 'Welcome, course information, objectives, instructor, and key terms.',
      lessons: [
        { slug: 'welcome', title: 'Welcome', sectionKind: 'welcome', estimatedActiveMinutes: 3, interactionWeight: 0.9, blockTypes: ['heading', 'text', 'callout'] },
        { slug: 'course-information', title: 'Course information', sectionKind: 'course_information', estimatedActiveMinutes: 3, interactionWeight: 0.85, blockTypes: ['heading', 'text', 'callout'] },
        { slug: 'learning-objectives', title: 'Learning objectives', sectionKind: 'learning_objectives', estimatedActiveMinutes: 2, interactionWeight: 0.9, blockTypes: ['heading', 'text', 'summary'] },
        { slug: 'instructor-intro', title: 'Instructor introduction', sectionKind: 'instructor_intro', estimatedActiveMinutes: 2, interactionWeight: 0.8, blockTypes: ['heading', 'text', 'image', 'video'] },
        { slug: 'key-terms', title: 'Key terms', sectionKind: 'key_terms', estimatedActiveMinutes: 1, interactionWeight: 0.85, blockTypes: ['heading', 'text', 'reveal_card'] },
      ],
    },
    {
      slug: 'core-instruction',
      title: 'Core instruction',
      description: 'Teaching content, CNA scope, scenarios, checks, and reflection.',
      lessons: [
        { slug: 'mini-video', title: 'Clinical overview video', sectionKind: 'mini_video', estimatedActiveMinutes: 4, interactionWeight: 1, blockTypes: ['video', 'text'] },
        { slug: 'core-teaching-content', title: 'Core teaching content', sectionKind: 'core_teaching_content', estimatedActiveMinutes: 6, interactionWeight: 1, blockTypes: ['heading', 'text', 'infographic', 'callout'] },
        { slug: 'cna-role-guidance', title: 'CNA role: do and do not', sectionKind: 'cna_role_guidance', estimatedActiveMinutes: 4, interactionWeight: 1.05, blockTypes: ['heading', 'text', 'callout', 'summary'] },
        { slug: 'case-study', title: 'Case study', sectionKind: 'case_study', estimatedActiveMinutes: 4, interactionWeight: 1.25, blockTypes: ['case_study', 'callout'] },
        { slug: 'scenario-interaction', title: 'Scenario interaction', sectionKind: 'scenario_interaction', estimatedActiveMinutes: 4, interactionWeight: 1.35, blockTypes: ['scenario_question'] },
        { slug: 'knowledge-check-1', title: 'Knowledge check 1', sectionKind: 'knowledge_check', estimatedActiveMinutes: 2, interactionWeight: 1.15, blockTypes: ['knowledge_check'] },
        { slug: 'knowledge-check-2', title: 'Knowledge check 2', sectionKind: 'knowledge_check', estimatedActiveMinutes: 2, interactionWeight: 1.15, blockTypes: ['knowledge_check'] },
        { slug: 'reflection-prompt', title: 'Reflection', sectionKind: 'reflection', estimatedActiveMinutes: 3, interactionWeight: 1.2, blockTypes: ['reflection'] },
        { slug: 'cna-best-practices', title: 'CNA best practices', sectionKind: 'cna_best_practices', estimatedActiveMinutes: 2, interactionWeight: 1, blockTypes: ['heading', 'text', 'callout', 'summary'] },
      ],
    },
    {
      slug: 'completion-pathway',
      title: 'Completion pathway',
      description: 'Recap, next steps, attestation, and certificate access.',
      lessons: [
        { slug: 'summary-recap', title: 'Summary and recap', sectionKind: 'summary_recap', estimatedActiveMinutes: 3, interactionWeight: 0.95, blockTypes: ['summary', 'text'] },
        { slug: 'what-happens-next', title: 'What happens next', sectionKind: 'what_happens_next', estimatedActiveMinutes: 2, interactionWeight: 0.85, blockTypes: ['heading', 'text', 'summary'] },
        { slug: 'completion-requirements', title: 'Attestation and compliance', sectionKind: 'attestation_guide', estimatedActiveMinutes: 2, interactionWeight: 0.85, blockTypes: ['heading', 'text', 'callout'] },
        { slug: 'certificate-access', title: 'Certificate and transcript access', sectionKind: 'certificate_access', estimatedActiveMinutes: 1, interactionWeight: 0.8, blockTypes: ['heading', 'text', 'callout'] },
      ],
    },
  ],
};

export const STANDARD_LEARNING_MILESTONES: LearningMilestoneDef[] = [
  { id: 'started', label: 'Course started', progressPct: 0, encouragement: 'Work through each section in order at a focused, professional pace.' },
  { id: 'orientation-complete', label: 'Orientation complete', lessonSlug: 'key-terms', progressPct: 20, encouragement: 'Core instruction builds on the objectives and terms you reviewed.' },
  { id: 'instruction-midpoint', label: 'Instruction midpoint', lessonSlug: 'scenario-interaction', progressPct: 48, encouragement: 'Continue applying concepts to resident-centered scenarios and knowledge checks.' },
  { id: 'instruction-complete', label: 'Instruction complete', lessonSlug: 'cna-best-practices', progressPct: 70, encouragement: 'Complete the recap and meet active participation time before the final exam.' },
  { id: 'lessons-complete', label: 'All lessons complete', lessonSlug: 'certificate-access', progressPct: 90, encouragement: 'When seat-time and exam requirements are met, complete attestation to unlock your certificate.' },
  { id: 'course-complete', label: 'Course complete', progressPct: 100, encouragement: 'Your certificate and transcript reflect this completed Online CE hour.' },
];

export const DEFAULT_QUALITY_FRAMEWORK = {
  cnaScopeAlignment: {
    status: 'placeholder' as const,
    note: 'Verify all tasks, scenarios, and exam items are within CNA scope; licensed nurse actions are referred appropriately.',
  },
  californiaSpecificNotes: {
    status: 'placeholder' as const,
    note: 'Cite California Title 22, CDPH reporting, and skilled nursing context where applicable.',
  },
  healthcareVisuals: {
    status: 'placeholder' as const,
    note: 'Use dignity-respecting, facility-appropriate clinical photography or illustrations.',
  },
  infographics: {
    status: 'placeholder' as const,
    note: 'Author CDPH-aligned infographic for the primary protocol or workflow.',
  },
  downloadableResources: {
    status: 'placeholder' as const,
    note: 'Optional PDF job aid, checklist, or policy crosswalk.',
  },
  accessibilityCaptions: {
    status: 'placeholder' as const,
    wcagTarget: 'WCAG 2.1 AA',
    note: 'Alt text on images; captions and transcripts on all video/audio blocks.',
  },
  multilingual: {
    status: 'placeholder' as const,
    locales: ['en', 'es'],
    note: 'Spanish translations attach to block copy when available; English is authoritative.',
  },
  referencesBibliography: {
    status: 'placeholder' as const,
    note: 'List evidence sources, CDPH/NAC references, and clinical guidelines cited in the course.',
  },
  instructorAuthorMetadata: {
    status: 'placeholder' as const,
    note: 'Approved faculty name, credentials, bio, and conflict-of-interest disclosure.',
  },
  cnaScenarios: {
    status: 'placeholder' as const,
    note: 'California SNF/RCFE scenarios with realistic resident profiles and scope-safe responses.',
  },
};

export const DEFAULT_ECOSYSTEM_HOOKS = {
  badges: { enabled: false as const, integrationId: null },
  loyaltyStars: { enabled: false as const, integrationId: null },
  referralRewards: { enabled: false as const, integrationId: null },
  cnaNetworkCommunity: {
    enabled: false as const,
    url: 'https://www.cna.network/renewal',
    integrationId: null,
  },
  forumDiscussionPrompt: { enabled: false as const, integrationId: null },
  emailReminders: { enabled: false as const, integrationId: null },
  subscriptionBundleEligible: { enabled: false as const, integrationId: null },
};
