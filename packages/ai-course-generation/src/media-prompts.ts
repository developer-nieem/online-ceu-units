import { buildCourseThumbnailPrompt } from './course-generation-template';
import type { GenerateCourseInput, MediaGenerationPrompts } from './types';

export function buildMediaGenerationPrompts(input: GenerateCourseInput): MediaGenerationPrompts {
  const topic = input.title;
  const focus = input.toneFocus ?? 'resident-centered CNA practice';
  const state = input.stateJurisdiction ?? 'California';

  return {
    courseThumbnail: {
      prompt: buildCourseThumbnailPrompt(input),
      aspectRatio: '16:9',
      pipelineHint: 'catalog-thumbnail',
    },
    infographicIdeas: [
      `Workflow diagram: ${focus} steps for CNAs during a typical shift`,
      `Decision tree: when to notify the nurse — ${topic}`,
      `${state} regulatory reminder visual (facility policy crosswalk)`,
    ],
    imagePrompts: [
      {
        blockHint: 'instructor-intro',
        prompt: `Professional healthcare instructor headshot, neutral background, dignified — ${topic}`,
      },
      {
        blockHint: 'case-study',
        prompt: `Illustration: CNA supporting resident in skilled nursing setting, ${focus}, no identifiable faces — ${topic}`,
      },
    ],
    miniVideoScripts: [
      {
        title: `Clinical overview — ${topic}`,
        durationLabel: '~5 min',
        script: `[AI draft] Learning goals for ${topic}. Key observations, scope-safe actions, nurse escalation. Focus: ${focus}. Instructor approval required before recording.`,
      },
      {
        title: 'Instructor welcome (optional)',
        durationLabel: '~2 min',
        script: `[AI draft] Faculty intro for ${topic} — ${state} CNAs. Replace with approved recording.`,
      },
    ],
    downloadableHandouts: [
      {
        title: `${topic} — CNA job aid (PDF placeholder)`,
        description: 'Do / do not / report to nurse checklist. Author after clinical review.',
      },
    ],
    narrationScripts: [
      {
        blockHint: 'core-teaching-content',
        script: `[Narration draft] Core teaching for ${topic}; ~6 active minutes.`,
      },
    ],
    accessibilityCaptionNotes: [
      'All video blocks: upload captions (WCAG 2.1 AA target) before publish.',
      'Provide audio descriptions or transcripts for infographic-only sections.',
      'Knowledge checks and scenarios must be keyboard-operable.',
    ],
    forumDiscussionPrompts: [
      `How do you apply ${focus} in your facility without stepping outside CNA scope?`,
      `What ${state}-specific policies affect ${topic} on your unit?`,
    ],
  };
}
