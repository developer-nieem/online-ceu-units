import type { GenerateCourseInput } from './types';

/**
 * Canonical CNA CEU generation template — maps 1:1 to the eight production requirements.
 * Used by MockAiCourseProvider today; future OpenAI/Anthropic providers should call
 * `buildLlmGenerationPrompt()` and parse output into `CourseGenerationPlan`.
 */
export const CNA_CEU_GENERATION_TEMPLATE = {
  version: 'calace-cna-ceu-template-v1',
  requirements: [
    {
      id: 'timeframe_pacing',
      label: 'Timeframe & Pacing',
      spec: '1.0 California CNA Online CE hour · 60 catalog minutes · 50 active participation minutes · 18-lesson blueprint across 3 modules.',
    },
    {
      id: 'behavioral_objectives',
      label: 'Behavioral Objectives',
      spec: 'Measurable, CNA-scoped objectives using action verbs (explain, identify, apply, document, demonstrate).',
    },
    {
      id: 'curriculum_outline',
      label: 'Curriculum Outline & Lessons',
      spec: 'Orientation → Core instruction → Completion pathway; each lesson maps to a BlueprintSectionKind.',
    },
    {
      id: 'rich_lesson_content',
      label: 'Rich Lesson Content',
      spec: 'Comprehensive text with infographic placeholders, image prompts, and California SNF case studies.',
    },
    {
      id: 'media_elements',
      label: 'Media Elements',
      spec: 'Embedded video placeholders wired to the AI video asset pipeline (scripts in contentMeta.mediaPrompts).',
    },
    {
      id: 'inline_quizzes',
      label: 'Short Pop Quizzes',
      spec: 'Knowledge-check blocks placed inline after scenario instruction (2 per course).',
    },
    {
      id: 'final_exam',
      label: 'Final Exam',
      spec: 'Exactly 10 single-choice MCQ items with answer keys, rationales, and remediation lesson slugs.',
    },
    {
      id: 'visual_assets',
      label: 'Visual Assets',
      spec: 'Course thumbnail image-generation prompt stored in mediaPrompts.courseThumbnail for the image pipeline.',
    },
  ],
  pacing: {
    ceHours: 1,
    catalogMinutes: 60,
    activeParticipationMinutes: 50,
    examQuestionCount: 10,
    inlineKnowledgeCheckCount: 2,
  },
  moduleOutline: [
    {
      slug: 'orientation',
      title: 'Orientation',
      lessons: ['welcome', 'course-information', 'learning-objectives', 'instructor-intro', 'key-terms'],
    },
    {
      slug: 'core-instruction',
      title: 'Core instruction',
      lessons: [
        'mini-video',
        'core-teaching-content',
        'cna-role-guidance',
        'case-study',
        'scenario-interaction',
        'knowledge-check-1',
        'knowledge-check-2',
        'reflection-prompt',
        'cna-best-practices',
      ],
    },
    {
      slug: 'completion-pathway',
      title: 'Completion pathway',
      lessons: ['summary-recap', 'what-happens-next', 'completion-requirements', 'certificate-access'],
    },
  ],
} as const;

/** Bloom-aligned, measurable objectives tailored to Nursing Assistants. */
export function buildBehavioralObjectives(input: GenerateCourseInput): string[] {
  const topic = input.title.trim();
  const focus = input.toneFocus ?? 'person-centered, scope-safe CNA care';
  const state = input.stateJurisdiction ?? 'California';
  const profession = input.profession ?? 'CNA';

  return [
    `Explain essential concepts of ${topic} as they apply to daily ${profession} practice in ${state} skilled nursing facilities.`,
    `Identify resident situations related to ${topic} that require timely licensed nurse notification.`,
    `Apply ${focus} when performing delegated tasks within ${profession} scope of practice.`,
    `Document objective observations about ${topic} and communicate changes using professional, dated reporting.`,
    `Demonstrate safe, dignity-preserving responses to ${topic} scenarios during routine resident care.`,
  ];
}

export function buildCourseThumbnailPrompt(input: GenerateCourseInput): string {
  const topic = input.title.trim();
  const focus = input.toneFocus ?? 'person-centered CNA care';
  return [
    `Professional healthcare education course thumbnail for "${topic}".`,
    `California CNA continuing education, ${focus}.`,
    'Clean modern layout, teal and white CAL ACE brand palette, dignified clinical illustration.',
    'No identifiable faces, no PHI, no text overlay required.',
    '16:9 aspect ratio, suitable for catalog card and LMS course tile.',
  ].join(' ');
}

/**
 * System + user prompt skeleton for LLM providers (OpenAI / Anthropic).
 * Provider must return JSON matching `CourseGenerationPlan` block shapes.
 */
export function buildLlmGenerationPrompt(input: GenerateCourseInput): {
  system: string;
  user: string;
} {
  const template = CNA_CEU_GENERATION_TEMPLATE;
  const objectives = buildBehavioralObjectives(input);

  const system = [
    'You are a California CNA continuing education instructional designer for CAL ACE Nursing Academy.',
    'Generate structured course content for instructor review — never auto-publish quality claims.',
    'Use generic SNF scenarios only; never include PHI, resident names, MRNs, or identifiable data.',
    'All CNA tasks must stay within scope; escalate to licensed nurse when appropriate.',
    '',
    'Required deliverables:',
    ...template.requirements.map((r) => `- ${r.label}: ${r.spec}`),
    '',
    'Output must use LessonContentDocument v2 block types:',
    'heading, text, callout, summary, reveal_card, image, video, infographic, case_study,',
    'scenario_question, knowledge_check, reflection.',
    'Mark AI draft sections clearly for faculty review.',
  ].join('\n');

  const user = [
    `Course title: ${input.title}`,
    input.courseCode ? `Course code: ${input.courseCode}` : null,
    input.shortDescription ? `Summary: ${input.shortDescription}` : null,
    `Audience: ${input.targetAudience ?? 'California Certified Nursing Assistants (CNAs)'}`,
    `Profession: ${input.profession ?? 'CNA'}`,
    `Jurisdiction: ${input.stateJurisdiction ?? 'California'}`,
    `Clinical focus: ${input.toneFocus ?? 'person-centered, scope-safe CNA care'}`,
    input.californiaRelevance ? `Regulatory focus: ${input.californiaRelevance}` : null,
    '',
    'Behavioral objectives (use in learning-objectives lesson):',
    ...objectives.map((o, i) => `${i + 1}. ${o}`),
    '',
    `Pacing: ${template.pacing.ceHours} CE hour, ${template.pacing.activeParticipationMinutes} active minutes.`,
    `Final exam: exactly ${template.pacing.examQuestionCount} SINGLE_CHOICE MCQs with rationales.`,
    `Inline knowledge checks: ${template.pacing.inlineKnowledgeCheckCount}.`,
    `Thumbnail prompt: ${buildCourseThumbnailPrompt(input)}`,
  ]
    .filter(Boolean)
    .join('\n');

  return { system, user };
}
