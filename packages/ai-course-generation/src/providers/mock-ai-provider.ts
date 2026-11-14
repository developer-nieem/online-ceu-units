import {
  BLUEPRINT_IDS,
  computeBlueprintPacing,
  ONE_HOUR_CNA_CEU_BLUEPRINT,
  STANDARD_FINAL_EXAM_BLUEPRINT,
} from '@calace/content-blocks';

import { buildBehavioralObjectives } from '../course-generation-template';
import { AI_PROMPT_VERSION, MOCK_AI_MODEL_PLACEHOLDER } from '../constants';
import { buildAiLessonDocument } from '../lesson-content-builder';
import { assertNoPhiInGenerationInput } from '../governance';
import { buildMediaGenerationPrompts } from '../media-prompts';
import { buildAiSafetyReviewChecklist } from '../safety-checklist';
import { buildSourceReferencePlaceholders } from '../source-references';
import type { AiCourseGenerationProvider } from './ai-course-provider.interface';
import type {
  CourseGenerationPlan,
  CourseGenerationResult,
  GenerateCourseInput,
  GeneratedExamQuestionDraft,
} from '../types';

function defaultIntegrationHooks() {
  return {
    openai: { enabled: false as const, model: null },
    anthropic: { enabled: false as const, model: null },
    imageGeneration: { enabled: false as const, provider: null },
    videoGeneration: { enabled: false as const, provider: null },
    citationRag: { enabled: false as const, libraryId: null },
    multiStateRules: { enabled: false as const, adapterId: null },
  };
}

const EXAM_MCQ_COUNT = 10;

function buildExamQuestions(topic: string, focus: string): GeneratedExamQuestionDraft[] {
  const stems: Omit<GeneratedExamQuestionDraft, 'sortOrder'>[] = [
    {
      type: 'SINGLE_CHOICE',
      prompt: `[Scenario 1/10] During evening care related to ${topic}, a resident becomes distressed. Best CNA response?`,
      options: [
        { id: 'a', label: 'Proceed without notifying the nurse' },
        { id: 'b', label: 'Ensure safety, support dignity, notify nurse per protocol' },
        { id: 'c', label: 'Document only at month end' },
      ],
      correctAnswer: 'b',
      explanation: `${focus} requires timely nurse communication and scope-safe actions.`,
      metadata: {
        remediation: 'Review scenario-interaction lesson.',
        scenarioContext: `Generic SNF scenario — ${topic}; no PHI.`,
        aiGenerated: true,
      },
    },
    {
      type: 'SINGLE_CHOICE',
      prompt: `[Scenario 2/10] A routine situation related to ${topic} occurs on the unit. What is the best CNA action?`,
      options: [
        { id: 'a', label: 'Proceed without notifying the nurse' },
        { id: 'b', label: 'Ensure safety, support dignity, notify nurse per protocol' },
        { id: 'c', label: 'Document only at month end' },
      ],
      correctAnswer: 'b',
      explanation: `${focus} requires timely nurse communication and scope-safe actions.`,
      metadata: { remediation: 'Review scenario-interaction lesson.', aiGenerated: true },
    },
    {
      type: 'SINGLE_CHOICE',
      prompt: `[3/10] Objective documentation about ${topic} should be shared with the nurse when a resident condition changes.`,
      options: [
        { id: 'a', label: 'True — timely reporting supports care plans' },
        { id: 'b', label: 'False — documentation can wait until month end' },
        { id: 'c', label: 'False — only the physician needs updates' },
      ],
      correctAnswer: 'a',
      explanation: 'Timely reporting supports care plans and California regulatory expectations.',
      metadata: { remediation: 'Review core-teaching-content.', aiGenerated: true },
    },
    {
      type: 'SINGLE_CHOICE',
      prompt: '[4/10] Which action is outside CNA scope?',
      options: [
        { id: 'a', label: 'Reporting skin changes to the nurse' },
        { id: 'b', label: 'Adjusting a physician order independently' },
        { id: 'c', label: 'Assisting with ADLs per care plan' },
      ],
      correctAnswer: 'b',
      explanation: 'CNAs do not change physician orders.',
      metadata: { remediation: 'Review cna-role-guidance.', aiGenerated: true },
    },
    {
      type: 'SINGLE_CHOICE',
      prompt: `[5/10] Person-centered care for ${topic} includes:`,
      options: [
        { id: 'a', label: 'Ignoring resident preferences to save time' },
        { id: 'b', label: 'Offering choices and preserving dignity' },
        { id: 'c', label: 'Restricting all fluids without nurse order' },
      ],
      correctAnswer: 'b',
      explanation: 'Dignity and choice are core to California CNA practice.',
      metadata: { aiGenerated: true },
    },
    {
      type: 'SINGLE_CHOICE',
      prompt: '[6/10] California Online CE requires active participation time in addition to lesson completion.',
      options: [
        { id: 'a', label: 'True' },
        { id: 'b', label: 'False' },
        { id: 'c', label: 'Only for clinical skills courses' },
      ],
      correctAnswer: 'a',
      explanation: 'Seat-time enforcement is platform-controlled and unchanged.',
      metadata: { aiGenerated: true },
    },
    {
      type: 'SINGLE_CHOICE',
      prompt: `[7/10] When unsure about ${topic}, a CNA should:`,
      options: [
        { id: 'a', label: 'Ask the nurse or supervisor per facility policy' },
        { id: 'b', label: 'Search social media for answers' },
        { id: 'c', label: 'Wait until the next shift' },
      ],
      correctAnswer: 'a',
      explanation: 'Licensed staff and policy guide scope questions.',
      metadata: { aiGenerated: true },
    },
    {
      type: 'SINGLE_CHOICE',
      prompt: '[8/10] Professional CNA documentation should be objective, dated, and shared with the nurse when clinically relevant.',
      options: [
        { id: 'a', label: 'True' },
        { id: 'b', label: 'False — opinions are acceptable as facts' },
        { id: 'c', label: 'False — documentation is optional' },
      ],
      correctAnswer: 'a',
      explanation: 'Documentation supports the care team and regulatory compliance.',
      metadata: { remediation: 'Review cna-best-practices.', aiGenerated: true },
    },
    {
      type: 'SINGLE_CHOICE',
      prompt: `[9/10] A resident shows a new sign related to ${topic}. The CNA should first:`,
      options: [
        { id: 'a', label: 'Observe objectively and report to the licensed nurse' },
        { id: 'b', label: 'Diagnose and begin treatment independently' },
        { id: 'c', label: 'Ignore minor changes to avoid alarming staff' },
      ],
      correctAnswer: 'a',
      explanation: 'Observation and nurse notification are within CNA scope; diagnosis and treatment are not.',
      metadata: { remediation: 'Review case-study lesson.', aiGenerated: true },
    },
    {
      type: 'SINGLE_CHOICE',
      prompt: `[10/10] After completing this hour on ${topic}, the learner must pass the exam and:`,
      options: [
        { id: 'a', label: 'Submit learner attestation' },
        { id: 'b', label: 'Skip attestation if exam score is high' },
        { id: 'c', label: 'Auto-publish certificate without review' },
      ],
      correctAnswer: 'a',
      explanation: 'Attestation and certificate flow are required for completion.',
      metadata: { aiGenerated: true },
    },
  ];

  return stems.slice(0, EXAM_MCQ_COUNT).map((q, i) => ({ ...q, sortOrder: i + 1 }));
}

export class MockAiCourseProvider implements AiCourseGenerationProvider {
  readonly providerId = 'mock' as const;

  async generateCourse(input: GenerateCourseInput): Promise<CourseGenerationResult> {
    assertNoPhiInGenerationInput(input);
    const started = Date.now();
    const blueprint = ONE_HOUR_CNA_CEU_BLUEPRINT;
    const topic = input.title.trim();
    const focus = input.toneFocus ?? 'person-centered, scope-safe CNA care';
    const state = input.stateJurisdiction ?? 'California';
    const profession = input.profession ?? 'CNA';

    const lessons = blueprint.modules.flatMap((mod) =>
      mod.lessons.map((lesson) => ({
        moduleSlug: mod.slug,
        moduleTitle: mod.title,
        slug: lesson.slug,
        title: lesson.title,
        sectionKind: lesson.sectionKind,
        estimatedActiveMinutes: lesson.estimatedActiveMinutes,
        interactionWeight: lesson.interactionWeight,
        document: buildAiLessonDocument(lesson, mod.title, input),
      })),
    );

    const examQuestions = buildExamQuestions(topic, focus);
    const generatedAt = new Date().toISOString();

    const plan: CourseGenerationPlan = {
      blueprintId: BLUEPRINT_IDS.ONE_HOUR_CNA_CEU_V1,
      blueprintVersion: blueprint.version,
      summary:
        input.shortDescription?.trim() ??
        `${state} ${profession} Online CEU on ${topic}. AI-generated draft — instructor review required before publish.`,
      overview: `This course addresses **${topic}** (${input.courseCode ?? 'TBD'}) for ${input.targetAudience ?? `${state} CNAs`}. Profession: ${profession}. Focus: ${focus}. ${input.californiaRelevance ?? `Aligned to ${state} skilled nursing practice.`}`,
      learningObjectives: buildBehavioralObjectives(input),
      keyTerms: [
        'Scope of practice',
        'Person-centered care',
        'Objective documentation',
        `${topic} (course-specific term — refine in CMS)`,
      ],
      lessons,
      exam: {
        slug: STANDARD_FINAL_EXAM_BLUEPRINT.slug,
        title: STANDARD_FINAL_EXAM_BLUEPRINT.titleTemplate.replace('{courseTitle}', topic),
        passingScore: STANDARD_FINAL_EXAM_BLUEPRINT.passingScore,
        maxAttempts: STANDARD_FINAL_EXAM_BLUEPRINT.maxAttempts,
        targetBankSize: STANDARD_FINAL_EXAM_BLUEPRINT.targetBankSize,
        settings: {
          ...STANDARD_FINAL_EXAM_BLUEPRINT.settings,
          questionPoolNote: `AI draft: ${examQuestions.length} SINGLE_CHOICE MCQs generated (presented per attempt: ${STANDARD_FINAL_EXAM_BLUEPRINT.settings.questionCount}). Expand bank to ${STANDARD_FINAL_EXAM_BLUEPRINT.targetBankSize} in CMS for production randomization.`,
        },
        messaging: { ...STANDARD_FINAL_EXAM_BLUEPRINT.messaging },
        questions: examQuestions,
      },
      pacing: computeBlueprintPacing(blueprint),
      mediaPrompts: buildMediaGenerationPrompts(input),
      safetyReview: buildAiSafetyReviewChecklist(topic, input),
      generation: {
        source: 'mock',
        promptVersion: AI_PROMPT_VERSION,
        model: MOCK_AI_MODEL_PLACEHOLDER,
        generatedAt,
        approvalStatus: 'pending_review',
        complianceReviewStatus: 'pending',
        input,
        sourceReferences: buildSourceReferencePlaceholders(input),
        integrationHooks: defaultIntegrationHooks(),
      },
    };

    return {
      plan,
      providerId: this.providerId,
      durationMs: Date.now() - started,
    };
  }
}
