/**
 * Re-exports lesson content schema for web components and future CMS tooling.
 * @see packages/content-blocks
 */
export {
  CONTENT_BLOCK_TYPES,
  LESSON_CONTENT_SCHEMA_VERSION,
  createDefaultContentBlock,
  createEmptyLessonDocument,
  isBlockDocument,
  allRequiredBlocksComplete,
  computeLessonProgressPct,
  validateCmsLessonVideoInteractionPair,
  validateStandardLessonFlow,
  type ContentBlock,
  type ContentBlockType,
  type LessonContentDocument,
  type LessonBlockProgress,
  type BlockProgressEvent,
} from '@calace/content-blocks';
