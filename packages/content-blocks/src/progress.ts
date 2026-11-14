import type { ContentBlock, LessonContentDocument } from './types';
import { isBlockDocument } from './types';

export type BlockProgressEntry = {
  viewed?: boolean;
  viewedAt?: string;
  interactionCompleted?: boolean;
  completedAt?: string;
  selectedOptionId?: string;
  correct?: boolean;
  reflectionText?: string;
};

export type LessonBlockProgress = {
  blocks: Record<string, BlockProgressEntry>;
};

export type BlockProgressEvent =
  | { type: 'block_viewed'; blockId: string }
  | {
      type: 'interaction_completed';
      blockId: string;
      selectedOptionId?: string;
      correct?: boolean;
      reflectionText?: string;
    }
  | {
      type: 'knowledge_check_answered';
      blockId: string;
      selectedOptionId: string;
      correct: boolean;
    };

export function emptyBlockProgress(): LessonBlockProgress {
  return { blocks: {} };
}

export function parseBlockProgress(raw: unknown): LessonBlockProgress {
  if (typeof raw !== 'object' || raw === null) return emptyBlockProgress();
  const blocks = (raw as LessonBlockProgress).blocks;
  if (!blocks || typeof blocks !== 'object') return emptyBlockProgress();
  return { blocks: { ...blocks } };
}

export function applyBlockProgressEvent(
  progress: LessonBlockProgress,
  event: BlockProgressEvent,
): LessonBlockProgress {
  const now = new Date().toISOString();
  const next = { ...progress, blocks: { ...progress.blocks } };
  const existing = next.blocks[event.blockId] ?? {};

  switch (event.type) {
    case 'block_viewed':
      next.blocks[event.blockId] = { ...existing, viewed: true, viewedAt: now };
      break;
    case 'interaction_completed':
      next.blocks[event.blockId] = {
        ...existing,
        viewed: true,
        interactionCompleted: true,
        completedAt: now,
        selectedOptionId: event.selectedOptionId,
        correct: event.correct,
        reflectionText: event.reflectionText,
      };
      break;
    case 'knowledge_check_answered':
      next.blocks[event.blockId] = {
        ...existing,
        viewed: true,
        interactionCompleted: true,
        completedAt: now,
        selectedOptionId: event.selectedOptionId,
        correct: event.correct,
      };
      break;
  }

  return next;
}

export function blockRequiresInteraction(block: ContentBlock): boolean {
  if (block.requiredForCompletion) return true;
  return [
    'scenario_question',
    'knowledge_check',
    'reflection',
    'matching',
    'reveal_card',
    'arrange',
    'hotspot_image',
  ].includes(block.type);
}

export function computeLessonProgressPct(
  document: LessonContentDocument,
  progress: LessonBlockProgress,
): number {
  const blocks = document.blocks;
  if (blocks.length === 0) return 0;

  let weighted = 0;
  let total = 0;

  for (const block of blocks) {
    const entry = progress.blocks[block.id];
    const needsInteraction = blockRequiresInteraction(block);

    if (needsInteraction) {
      total += 2;
      if (entry?.viewed) weighted += 1;
      if (entry?.interactionCompleted) weighted += 1;
    } else {
      total += 1;
      if (entry?.viewed) weighted += 1;
    }
  }

  return total > 0 ? Math.round((weighted / total) * 100) : 0;
}

function blockCompletionSatisfied(
  block: ContentBlock,
  entry: BlockProgressEntry | undefined,
): boolean {
  if (block.type === 'video' || block.type === 'audio') {
    return Boolean(entry?.interactionCompleted || entry?.viewed);
  }
  if (blockRequiresInteraction(block)) {
    return Boolean(entry?.interactionCompleted);
  }
  return Boolean(entry?.viewed);
}

export function allRequiredBlocksComplete(
  document: LessonContentDocument,
  progress: LessonBlockProgress,
): boolean {
  const required = document.blocks.filter(
    (b) => b.requiredForCompletion || blockRequiresInteraction(b),
  );
  if (required.length === 0) {
    return document.blocks.every((b) => progress.blocks[b.id]?.viewed);
  }
  return required.every((b) => blockCompletionSatisfied(b, progress.blocks[b.id]));
}

export function getBlocksFromContent(content: unknown): ContentBlock[] | null {
  if (isBlockDocument(content)) return content.blocks;
  return null;
}
