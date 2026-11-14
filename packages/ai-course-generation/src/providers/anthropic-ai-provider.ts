import Anthropic from '@anthropic-ai/sdk';
import {
  BLUEPRINT_IDS,
  computeBlueprintPacing,
  ONE_HOUR_CNA_CEU_BLUEPRINT,
  STANDARD_FINAL_EXAM_BLUEPRINT,
  type ContentBlock,
  type LessonContentDocument,
} from '@calace/content-blocks';

import { buildBehavioralObjectives } from '../course-generation-template';
import { AI_PROMPT_VERSION } from '../constants';
import { assertNoPhiInGenerationInput } from '../governance';
import { buildAiLessonDocument } from '../lesson-content-builder';
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

const DEFAULT_ANTHROPIC_MODEL = 'claude-sonnet-4-20250514';

type ClaudeLessonTextContent = {
  headingText: string;
  bodyText: string;
  calloutBody?: string;
  caseScenario?: string;
  reflectionPrompt?: string;
};

type ClaudeExamQuestion = {
  sortOrder: number;
  type: 'SINGLE_CHOICE';
  prompt: string;
  options: { id: string; label: string }[];
  correctAnswer: string;
  explanation: string;
};

type ClaudeCourseGenerationOutput = {
  summary: string;
  overview: string;
  learningObjectives: string[];
  keyTerms: string[];
  lessonTextContent: Record<string, ClaudeLessonTextContent>;
  examQuestions: ClaudeExamQuestion[];
};

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

function resolveAnthropicModel(): string {
  return process.env.ANTHROPIC_MODEL ?? DEFAULT_ANTHROPIC_MODEL;
}

function buildAnthropicPrompts(input: GenerateCourseInput): { system: string; user: string } {
  const blueprint = ONE_HOUR_CNA_CEU_BLUEPRINT;
  const lessonSlugs = blueprint.modules.flatMap((mod) => mod.lessons.map((lesson) => lesson.slug));
  const topic = input.title.trim();
  const focus = input.toneFocus ?? 'person-centered, scope-safe CNA care';
  const state = input.stateJurisdiction ?? 'California';
  const profession = input.profession ?? 'CNA';

  const jsonSchemaExample = {
    summary: '1-2 sentence course summary',
    overview: 'Markdown paragraph — course overview',
    learningObjectives: ['3-5 measurable behavioral objectives'],
    keyTerms: ['4-6 key terms'],
    lessonTextContent: Object.fromEntries(
      lessonSlugs.map((slug) => [
        slug,
        {
          headingText: 'Lesson heading',
          bodyText: 'Main prose (2-4 paragraphs, markdown ok)',
          calloutBody: 'Optional callout body when lesson has callout blocks',
          caseScenario: 'Optional case_study scenario text',
          reflectionPrompt: 'Optional reflection prompt',
        },
      ]),
    ),
    examQuestions: [
      {
        sortOrder: 1,
        type: 'SINGLE_CHOICE',
        prompt: 'Scenario-based CNA question',
        options: [
          { id: 'a', label: 'Option A' },
          { id: 'b', label: 'Option B' },
          { id: 'c', label: 'Option C' },
        ],
        correctAnswer: 'b',
        explanation: 'Rationale for correct answer',
      },
    ],
  };

  const system = [
    'You are a California CNA continuing education content specialist.',
    'All content must be within CNA scope of practice.',
    'No PHI. No real patient names. Fictional scenarios only.',
    'Content must align with California CDPH Online CE expectations.',
    'Exam questions must be scenario-based, not trivia.',
    'Return ONLY valid JSON matching the schema below. No markdown fences, no preamble, no explanation outside the JSON.',
    '',
    'Required JSON shape:',
    JSON.stringify(jsonSchemaExample, null, 2),
    '',
    `Provide lessonTextContent entries for every lesson slug: ${lessonSlugs.join(', ')}.`,
    'Provide exactly 10 examQuestions with sortOrder 1 through 10.',
  ].join('\n');

  const user = [
    `Course title: ${topic}`,
    input.courseCode ? `Course code: ${input.courseCode}` : null,
    input.shortDescription ? `Short description: ${input.shortDescription}` : null,
    `Audience: ${input.targetAudience ?? `${state} Certified Nursing Assistants (CNAs)`}`,
    `Profession: ${profession}`,
    `Jurisdiction: ${state}`,
    `Clinical focus: ${focus}`,
    input.californiaRelevance ? `California relevance: ${input.californiaRelevance}` : null,
    input.categoryLabel ? `Category: ${input.categoryLabel}` : null,
    input.ceHours ? `CE hours: ${input.ceHours}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return { system, user };
}

function extractResponseText(content: Anthropic.Messages.ContentBlock[]): string {
  return content
    .filter((block): block is Anthropic.Messages.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');
}

function parseClaudeJson(text: string): ClaudeCourseGenerationOutput {
  const trimmed = text.trim();
  const jsonText = trimmed.startsWith('```')
    ? trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    : trimmed;

  try {
    return JSON.parse(jsonText) as ClaudeCourseGenerationOutput;
  } catch {
    throw new Error('AnthropicAiCourseProvider: failed to parse Claude response as JSON');
  }
}

function applyLessonTextContent(
  document: LessonContentDocument,
  content: ClaudeLessonTextContent | undefined,
): LessonContentDocument {
  if (!content) {
    return document;
  }

  const blocks = document.blocks.map((block: ContentBlock) => {
    if (block.type === 'heading' && content.headingText) {
      return { ...block, text: content.headingText };
    }
    if (block.type === 'text' && content.bodyText) {
      return { ...block, body: content.bodyText };
    }
    if (block.type === 'callout' && content.calloutBody) {
      return { ...block, body: content.calloutBody };
    }
    if (block.type === 'case_study' && content.caseScenario) {
      return { ...block, scenario: content.caseScenario };
    }
    if (block.type === 'reflection' && content.reflectionPrompt) {
      return { ...block, prompt: content.reflectionPrompt };
    }
    return block;
  });

  return { ...document, blocks };
}

function mapExamQuestions(questions: ClaudeExamQuestion[], topic: string): GeneratedExamQuestionDraft[] {
  return questions.map((q, index) => ({
    sortOrder: q.sortOrder ?? index + 1,
    type: q.type,
    prompt: q.prompt,
    options: q.options,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    metadata: {
      remediation: 'Review relevant lesson sections before retaking the exam.',
      scenarioContext: `Generic SNF scenario — ${topic}; no PHI.`,
      aiGenerated: true,
    },
  }));
}

export class AnthropicAiCourseProvider implements AiCourseGenerationProvider {
  readonly providerId = 'anthropic' as const;

  async generateCourse(input: GenerateCourseInput): Promise<CourseGenerationResult> {
    assertNoPhiInGenerationInput(input);

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        'AnthropicAiCourseProvider: ANTHROPIC_API_KEY is not set. Configure the API key or use the mock provider.',
      );
    }

    const started = Date.now();
    const model = resolveAnthropicModel();
    const blueprint = ONE_HOUR_CNA_CEU_BLUEPRINT;
    const topic = input.title.trim();
    const focus = input.toneFocus ?? 'person-centered, scope-safe CNA care';
    const state = input.stateJurisdiction ?? 'California';
    const profession = input.profession ?? 'CNA';

    const { system, user } = buildAnthropicPrompts(input);
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model,
      max_tokens: 8000,
      system,
      messages: [{ role: 'user', content: user }],
    });

    const parsed = parseClaudeJson(extractResponseText(message.content));

    const lessons = blueprint.modules.flatMap((mod) =>
      mod.lessons.map((lesson) => {
        const document = buildAiLessonDocument(lesson, mod.title, input);
        const lessonContent = parsed.lessonTextContent?.[lesson.slug];
        return {
          moduleSlug: mod.slug,
          moduleTitle: mod.title,
          slug: lesson.slug,
          title: lesson.title,
          sectionKind: lesson.sectionKind,
          estimatedActiveMinutes: lesson.estimatedActiveMinutes,
          interactionWeight: lesson.interactionWeight,
          document: applyLessonTextContent(document, lessonContent),
        };
      }),
    );

    const learningObjectives =
      parsed.learningObjectives?.length >= 3
        ? parsed.learningObjectives
        : buildBehavioralObjectives(input);

    const keyTerms =
      parsed.keyTerms?.length >= 4
        ? parsed.keyTerms
        : [
            'Scope of practice',
            'Person-centered care',
            'Objective documentation',
            `${topic} (course-specific term — refine in CMS)`,
          ];

    const examQuestions = mapExamQuestions(parsed.examQuestions ?? [], topic);
    const generatedAt = new Date().toISOString();

    const plan: CourseGenerationPlan = {
      blueprintId: BLUEPRINT_IDS.ONE_HOUR_CNA_CEU_V1,
      blueprintVersion: blueprint.version,
      summary:
        parsed.summary?.trim() ||
        input.shortDescription?.trim() ||
        `${state} ${profession} Online CEU on ${topic}. AI-generated draft — instructor review required before publish.`,
      overview:
        parsed.overview?.trim() ||
        `This course addresses **${topic}** (${input.courseCode ?? 'TBD'}) for ${input.targetAudience ?? `${state} CNAs`}. Profession: ${profession}. Focus: ${focus}. ${input.californiaRelevance ?? `Aligned to ${state} skilled nursing practice.`}`,
      learningObjectives,
      keyTerms,
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
        source: 'anthropic',
        promptVersion: AI_PROMPT_VERSION,
        model,
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
