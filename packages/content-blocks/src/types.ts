/**
 * Lesson content schema v2 — AI-generated and CMS-authored lessons use the same shape.
 * @see docs/CONTENT_BLOCKS.md
 */

export const LESSON_CONTENT_SCHEMA_VERSION = 2 as const;

/** All supported block types (renderers + future engines). */
export const CONTENT_BLOCK_TYPES = [
  'heading',
  'text',
  'image',
  'infographic',
  'video',
  'audio',
  'callout',
  'case_study',
  'scenario_question',
  'knowledge_check',
  'matching',
  'reveal_card',
  'arrange',
  'hotspot_image',
  'true_false_challenge',
  'trivia_card',
  'reflection',
  'summary',
] as const;

export type ContentBlockType = (typeof CONTENT_BLOCK_TYPES)[number];

/** Shared accessibility metadata for WCAG-conscious rendering. */
export type BlockAccessibility = {
  altText?: string;
  ariaLabel?: string;
  captionsPlaceholder?: string;
  transcriptPlaceholder?: string;
};

export type ContentBlockBase = {
  /** Stable id for progress tracking and AI patch targets */
  id: string;
  type: ContentBlockType;
  accessibility?: BlockAccessibility;
  /** When true, learner must complete interaction before lesson can reach 100% */
  requiredForCompletion?: boolean;
  /** AI / CMS metadata — not shown to learners */
  meta?: Record<string, unknown>;
};

export type HeadingBlock = ContentBlockBase & {
  type: 'heading';
  level: 1 | 2 | 3;
  text: string;
};

export type TextBlock = ContentBlockBase & {
  type: 'text';
  /** Markdown-lite: paragraphs, ## headings, - lists */
  body: string;
};

export type ImageBlock = ContentBlockBase & {
  type: 'image';
  caption?: string;
  /** Future: MediaAsset URL */
  src?: string | null;
};

export type InfographicBlock = ContentBlockBase & {
  type: 'infographic';
  title?: string;
  description: string;
  caption?: string;
};

export type VideoBlock = ContentBlockBase & {
  type: 'video';
  title?: string;
  durationLabel?: string;
  placeholderNote: string;
  /**
   * Native MP4 (or HLS) playback URL — set by AI video pipeline or CMS upload.
   * YouTube/Vimeo embed URLs are not supported; use direct .mp4 links only.
   */
  videoUrl?: string | null;
  /** Optional poster frame for the native player */
  posterUrl?: string | null;
};

export type AudioBlock = ContentBlockBase & {
  type: 'audio';
  title?: string;
  narrationScript?: string;
  placeholderNote: string;
  /** When present, renderer plays this file */
  audioUrl?: string;
};

export type CalloutBlock = ContentBlockBase & {
  type: 'callout';
  variant: 'info' | 'warning' | 'tip' | 'clinical';
  title?: string;
  body: string;
};

export type CaseStudyBlock = ContentBlockBase & {
  type: 'case_study';
  title: string;
  residentProfile: string;
  scenario: string;
  discussionPrompt?: string;
};

export type ScenarioOption = {
  id: string;
  label: string;
  feedback: string;
  isRecommended?: boolean;
};

export type ScenarioQuestionBlock = ContentBlockBase & {
  type: 'scenario_question';
  prompt: string;
  context?: string;
  options: ScenarioOption[];
  requiredForCompletion: true;
};

export type KnowledgeCheckOption = {
  id: string;
  label: string;
};

export type KnowledgeCheckBlock = ContentBlockBase & {
  type: 'knowledge_check';
  question: string;
  options: KnowledgeCheckOption[];
  correctOptionId: string;
  explanation: string;
  requiredForCompletion: true;
};

export type MatchingBlock = ContentBlockBase & {
  type: 'matching';
  instructions: string;
  placeholderNote: string;
};

export type RevealCardBlock = ContentBlockBase & {
  type: 'reveal_card';
  frontTitle: string;
  frontBody: string;
  backTitle: string;
  backBody: string;
};

export type ArrangeBlockItem = {
  id: string;
  text: string;
};

export type ArrangeBlock = ContentBlockBase & {
  type: 'arrange';
  question: string;
  /** Learner-facing items in randomized starting order */
  items: ArrangeBlockItem[];
  /** Correct sequence as an array of item ids */
  correctOrder: string[];
  explanation: string;
};

export type HotspotImageBlock = ContentBlockBase & {
  type: 'hotspot_image';
  instructions: string;
  placeholderNote: string;
};

/** Gamified true/false streak challenge — distinct from graded knowledge_check. */
export type TrueFalseChallengeBlock = ContentBlockBase & {
  type: 'true_false_challenge';
  prompt: string;
  correctAnswer: 'true' | 'false';
  explanation: string;
  placeholderNote: string;
};

/** Flip-and-acknowledge trivia / did-you-know card for engagement breaks. */
export type TriviaCardBlock = ContentBlockBase & {
  type: 'trivia_card';
  title: string;
  body: string;
  placeholderNote: string;
};

export type ReflectionBlock = ContentBlockBase & {
  type: 'reflection';
  prompt: string;
  minCharacters?: number;
  placeholder?: string;
};

export type SummaryBlock = ContentBlockBase & {
  type: 'summary';
  title?: string;
  items: string[];
};

export type ContentBlock =
  | HeadingBlock
  | TextBlock
  | ImageBlock
  | InfographicBlock
  | VideoBlock
  | AudioBlock
  | CalloutBlock
  | CaseStudyBlock
  | ScenarioQuestionBlock
  | KnowledgeCheckBlock
  | MatchingBlock
  | RevealCardBlock
  | ArrangeBlock
  | HotspotImageBlock
  | TrueFalseChallengeBlock
  | TriviaCardBlock
  | ReflectionBlock
  | SummaryBlock;

/** v2 lesson document stored in Lesson.content JSON */
export type LessonContentDocument = {
  schemaVersion: typeof LESSON_CONTENT_SCHEMA_VERSION;
  title?: string;
  blocks: ContentBlock[];
  /** AI pipeline hints */
  generation?: {
    source?: 'human' | 'ai' | 'hybrid';
    model?: string;
    promptVersion?: string;
  };
};

/** Legacy v1 single-type payload (still supported in player) */
export type LegacyLessonContent = {
  schemaVersion?: 1;
  type: 'text' | 'image' | 'infographic' | 'video' | 'interactive' | 'quiz';
  title?: string;
  body?: string;
  caption?: string;
  placeholderNote?: string;
};

export type LessonContentJson = LessonContentDocument | LegacyLessonContent;

export function isBlockDocument(content: unknown): content is LessonContentDocument {
  return (
    typeof content === 'object' &&
    content !== null &&
    (content as LessonContentDocument).schemaVersion === LESSON_CONTENT_SCHEMA_VERSION &&
    Array.isArray((content as LessonContentDocument).blocks)
  );
}
