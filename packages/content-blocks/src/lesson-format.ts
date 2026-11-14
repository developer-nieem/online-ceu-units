import type { ContentBlock, ContentBlockType, LessonContentDocument, VideoBlock } from './types';

/** Gamified interactives used in the standard Video → Interactive → Complete flow. */
export const STANDARD_INTERACTIVE_BLOCK_TYPES = [
  'true_false_challenge',
  'arrange',
  'trivia_card',
] as const satisfies readonly ContentBlockType[];

export type StandardInteractiveBlockType = (typeof STANDARD_INTERACTIVE_BLOCK_TYPES)[number];

/** Block types that satisfy the post-video interaction requirement. */
export const POST_VIDEO_INTERACTIVE_BLOCK_TYPES = [
  ...STANDARD_INTERACTIVE_BLOCK_TYPES,
  'matching',
  'scenario_question',
  'knowledge_check',
  'reflection',
  'reveal_card',
  'hotspot_image',
] as const satisfies readonly ContentBlockType[];

export type LessonFormatValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

const INTRO_BLOCK_TYPES: ContentBlockType[] = ['heading', 'text', 'callout'];

const DEPRECATED_EMBED_HOSTS = ['youtube.com', 'youtu.be', 'vimeo.com', 'player.vimeo.com'];

export function isDeprecatedEmbedUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    return DEPRECATED_EMBED_HOSTS.some(
      (host) => hostname === host || hostname.endsWith(`.${host}`),
    );
  } catch {
    return /youtube|youtu\.be|vimeo/i.test(url);
  }
}

export function isNativeVideoUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  if (isDeprecatedEmbedUrl(url)) return false;
  try {
    return /\.mp4$/i.test(new URL(url).pathname);
  } catch {
    return /\.mp4(\?|$)/i.test(url);
  }
}

export function isPostVideoInteractiveBlock(block: ContentBlock): boolean {
  return POST_VIDEO_INTERACTIVE_BLOCK_TYPES.includes(
    block.type as (typeof POST_VIDEO_INTERACTIVE_BLOCK_TYPES)[number],
  );
}

export function validateVideoBlock(block: VideoBlock): LessonFormatValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const legacyEmbedUrl =
    typeof block.meta?.embedUrl === 'string' ? block.meta.embedUrl.trim() : '';

  if (legacyEmbedUrl) {
    warnings.push(
      `Video block "${block.id}": embedUrl in meta is deprecated — use videoUrl with a native MP4 instead.`,
    );
  }

  const url = block.videoUrl?.trim();
  if (!url) {
    errors.push(`Video block "${block.id}" must set videoUrl to a native MP4 URL.`);
    return { valid: false, errors, warnings };
  }

  if (isDeprecatedEmbedUrl(url)) {
    errors.push(
      `Video block "${block.id}": YouTube/Vimeo URLs are no longer supported — use videoUrl with a native .mp4 file.`,
    );
  } else if (!isNativeVideoUrl(url)) {
    warnings.push(
      `Video block "${block.id}": videoUrl should point to a direct .mp4 file for native playback.`,
    );
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Enforces the platform curriculum standard when a video block is present:
 * Intro text/markdown → native MP4 video → interactive block(s).
 *
 * Lessons without a video block save successfully with a migration warning.
 */
export function validateStandardLessonFlow(
  document: LessonContentDocument,
): LessonFormatValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const blocks = document.blocks;

  if (blocks.length === 0) {
    return { valid: false, errors: ['Lesson must contain at least one content block.'], warnings };
  }

  const videoIndex = blocks.findIndex((block) => block.type === 'video');
  if (videoIndex === -1) {
    warnings.push(
      'Standard curriculum flow: Intro text → native MP4 video → interactive block (Video → Interactive → Complete).',
    );
    return { valid: true, errors, warnings };
  }

  const introBlocks = blocks.slice(0, videoIndex);
  const hasIntro = introBlocks.some((block) => INTRO_BLOCK_TYPES.includes(block.type));
  if (!hasIntro) {
    errors.push(
      'Standard flow: add intro text or markdown (heading/text) before the video block.',
    );
  }

  const videoBlock = blocks[videoIndex] as VideoBlock;
  const videoValidation = validateVideoBlock(videoBlock);
  errors.push(...videoValidation.errors);
  warnings.push(...videoValidation.warnings);

  const afterVideo = blocks.slice(videoIndex + 1);
  const interactiveBlocks = afterVideo.filter(isPostVideoInteractiveBlock);
  if (interactiveBlocks.length === 0) {
    errors.push(
      'Standard flow: add at least one interactive block after the video (True/False, Arrange, Trivia, or other interaction).',
    );
  }

  const blocksBeforeInteractive = afterVideo.filter((block) => !isPostVideoInteractiveBlock(block));
  if (blocksBeforeInteractive.length > 0 && interactiveBlocks.length > 0) {
    const firstInteractiveIndex = afterVideo.findIndex(isPostVideoInteractiveBlock);
    const trailingContent = afterVideo.slice(firstInteractiveIndex + 1);
    if (trailingContent.some((block) => !isPostVideoInteractiveBlock(block))) {
      warnings.push(
        'Standard flow recommends placing the interactive block immediately after the video with no extra content in between.',
      );
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/** CMS legacy lesson shape — videoUrl at lesson level plus interactionBlocks array. */
export function validateCmsLessonVideoInteractionPair(input: {
  videoUrl?: string | null;
  interactionBlocks?: unknown[] | null;
}): LessonFormatValidationResult {
  const videoUrl = input.videoUrl?.trim();
  if (!videoUrl) {
    return { valid: true, errors: [], warnings: [] };
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  if (isDeprecatedEmbedUrl(videoUrl)) {
    errors.push('Video URL must be a native MP4 — YouTube and Vimeo embeds are no longer supported.');
  } else if (!isNativeVideoUrl(videoUrl)) {
    warnings.push('Video URL should point to a direct .mp4 file for native playback.');
  }

  const interactionCount = input.interactionBlocks?.length ?? 0;
  if (interactionCount === 0) {
    errors.push(
      'Lessons with a video require at least one interaction block (standard Video → Interactive → Complete flow).',
    );
  }

  return { valid: errors.length === 0, errors, warnings };
}
