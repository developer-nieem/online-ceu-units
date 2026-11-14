import type { ContentBlock, ContentBlockType } from './types';
import { LESSON_CONTENT_SCHEMA_VERSION } from './types';

function blockId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}`;
}

/** Default block payload for CMS "add block" actions. */
export function createDefaultContentBlock(type: ContentBlockType): ContentBlock {
  const id = blockId(type);
  switch (type) {
    case 'heading':
      return { id, type, level: 2, text: 'Section heading' };
    case 'text':
      return { id, type, body: 'Enter lesson content here.' };
    case 'image':
      return { id, type, caption: 'Image caption', src: null };
    case 'infographic':
      return { id, type, title: 'Infographic', description: 'Describe the visual.', caption: 'Placeholder asset' };
    case 'video':
      return { id, type, title: 'Video', placeholderNote: 'Media upload coming soon — use placeholder path /media/pending.mp4' };
    case 'audio':
      return { id, type, title: 'Audio narration', placeholderNote: 'Media upload coming soon — use placeholder path /media/pending.mp3' };
    case 'callout':
      return { id, type, variant: 'info', title: 'Clinical note', body: 'Key point for CNAs.' };
    case 'case_study':
      return {
        id,
        type,
        title: 'Case study',
        residentProfile: 'Resident profile placeholder',
        scenario: 'Describe the care scenario.',
        discussionPrompt: 'What would you do first?',
      };
    case 'scenario_question':
      return {
        id,
        type,
        prompt: 'What is the best response?',
        options: [
          { id: 'a', label: 'Option A', feedback: 'Feedback for A.' },
          { id: 'b', label: 'Option B (recommended)', feedback: 'Correct approach.', isRecommended: true },
        ],
        requiredForCompletion: true,
      };
    case 'knowledge_check':
      return {
        id,
        type,
        question: 'Knowledge check question',
        options: [
          { id: 'a', label: 'Answer A' },
          { id: 'b', label: 'Answer B' },
        ],
        correctOptionId: 'b',
        explanation: 'Rationale for the correct answer.',
        requiredForCompletion: true,
      };
    case 'reflection':
      return { id, type, prompt: 'Reflect on how you apply this in your facility.', minCharacters: 20 };
    case 'summary':
      return { id, type, title: 'Key takeaways', items: ['Takeaway 1', 'Takeaway 2'] };
    case 'matching':
      return { id, type, instructions: 'Match items (placeholder).', placeholderNote: 'Interactive matching — coming soon.' };
    case 'reveal_card':
      return {
        id,
        type,
        frontTitle: 'Term',
        frontBody: 'Definition hidden',
        backTitle: 'Definition',
        backBody: 'Full explanation.',
      };
    case 'arrange':
      return {
        id,
        type,
        question: 'Arrange the steps in the correct order.',
        items: [
          { id: 'step-1', text: 'First step' },
          { id: 'step-2', text: 'Second step' },
          { id: 'step-3', text: 'Third step' },
        ],
        correctOrder: ['step-1', 'step-2', 'step-3'],
        explanation: 'Rationale shown after the learner orders the steps correctly.',
      };
    case 'hotspot_image':
      return { id, type, instructions: 'Tap hotspots on the image.', placeholderNote: 'Hotspot image — coming soon.' };
    case 'true_false_challenge':
      return {
        id,
        type,
        prompt: 'True or false challenge statement',
        correctAnswer: 'true',
        explanation: 'Rationale shown after the learner answers.',
        placeholderNote: 'True/False Challenge — gamified component coming soon.',
      };
    case 'trivia_card':
      return {
        id,
        type,
        title: 'Did you know?',
        body: 'Share a surprising, relevant fact for CNAs.',
        placeholderNote: 'Trivia card — gamified reveal component coming soon.',
      };
    default:
      return { id, type: 'text', body: '' } as ContentBlock;
  }
}

export function createEmptyLessonDocument(title?: string) {
  return {
    schemaVersion: LESSON_CONTENT_SCHEMA_VERSION,
    title: title ?? 'New lesson',
    blocks: [createDefaultContentBlock('heading'), createDefaultContentBlock('text')],
    generation: { source: 'human' as const },
  };
}
