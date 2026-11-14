import {
  BLUEPRINT_IDS,
  LESSON_CONTENT_SCHEMA_VERSION,
  type BlueprintLessonDef,
  type ContentBlock,
  type LessonContentDocument,
} from '@calace/content-blocks';

import { buildBehavioralObjectives } from './course-generation-template';
import { AI_PROMPT_VERSION, MOCK_AI_MODEL_PLACEHOLDER } from './constants';
import type { GenerateCourseInput } from './types';

const AI_META = { aiGenerated: true, requiresInstructorReview: true };

function blockId(slug: string, suffix: string) {
  return `${slug}-${suffix}`;
}

function aiGeneration(): LessonContentDocument['generation'] {
  return {
    source: 'ai',
    model: MOCK_AI_MODEL_PLACEHOLDER,
    promptVersion: AI_PROMPT_VERSION,
  };
}

function wrap(lesson: BlueprintLessonDef, input: GenerateCourseInput, blocks: ContentBlock[]): LessonContentDocument {
  return {
    schemaVersion: LESSON_CONTENT_SCHEMA_VERSION,
    title: lesson.title,
    blocks: blocks.map((b) => ({
      ...b,
      meta: { ...((b.meta as object) ?? {}), ...AI_META },
    })),
    generation: aiGeneration(),
  };
}

export function buildAiLessonDocument(
  lesson: BlueprintLessonDef,
  moduleTitle: string,
  input: GenerateCourseInput,
): LessonContentDocument {
  const topic = input.title;
  const focus = input.toneFocus ?? 'safe, person-centered care';
  const ca = input.californiaRelevance ?? 'California skilled nursing and CDPH Online CE expectations';
  const audience = input.targetAudience ?? 'California Certified Nursing Assistants (CNAs)';
  const s = lesson.slug;
  const kind = lesson.sectionKind;

  const heading = (text: string): ContentBlock => ({
    id: blockId(s, 'heading'),
    type: 'heading',
    level: 2,
    text,
  });
  const text = (body: string): ContentBlock => ({
    id: blockId(s, 'body'),
    type: 'text',
    body,
  });

  switch (kind) {
    case 'welcome':
      return wrap(lesson, input, [
        heading(`Welcome — ${topic}`),
        text(
          `This Online CE hour on **${topic}** is designed for ${audience}. CAL ACE generated this draft for instructor review. Work through each section, complete interactions, meet active participation time, pass the final exam, and submit your attestation.`,
        ),
        {
          id: blockId(s, 'ceu'),
          type: 'callout',
          variant: 'clinical',
          title: '1 Online CE hour',
          body: '1.0 Online CE hour when you complete lessons, 50 minutes active participation, the final exam, and attestation.',
        },
      ]);

    case 'course_information':
      return wrap(lesson, input, [
        heading('Course information'),
        text(
          `**Topic:** ${topic}\n\n**Focus:** ${focus}\n\n**California relevance:** ${ca}\n\nThis hour supports CNA practice in licensed nursing facilities. Content is AI-generated and must be reviewed by CAL ACE faculty before publication.`,
        ),
        {
          id: blockId(s, 'catalog'),
          type: 'callout',
          variant: 'info',
          title: 'Delivery',
          body: 'Online · interaction-rich · CDPH-aware seat-time tracking · certificate and transcript on completion.',
        },
      ]);

    case 'learning_objectives':
      return wrap(lesson, input, [
        heading('Behavioral objectives'),
        text(`After completing **${topic}**, you will be able to:`),
        {
          id: blockId(s, 'objectives'),
          type: 'summary',
          title: 'Measurable objectives (CNA)',
          items: buildBehavioralObjectives(input),
        },
      ]);

    case 'instructor_intro':
      return wrap(lesson, input, [
        heading('Instructor introduction'),
        text(
          `[AI draft — replace before publish] CAL ACE faculty will introduce ${topic}, credentials, and how this hour fits CNA renewal. Upload approved instructor photo and optional welcome video.`,
        ),
        {
          id: blockId(s, 'photo'),
          type: 'image',
          caption: 'Instructor photo placeholder',
          src: null,
          accessibility: { altText: 'Instructor headshot pending' },
        },
      ]);

    case 'key_terms':
      return wrap(lesson, input, [
        heading('Key terms'),
        text(`Essential vocabulary for **${topic}**:`),
        {
          id: blockId(s, 't1'),
          type: 'reveal_card',
          frontTitle: 'Person-centered care',
          frontBody: 'Tap to reveal',
          backTitle: 'Definition',
          backBody: `Care that respects individual preferences and dignity — central to ${topic}.`,
        },
        {
          id: blockId(s, 't2'),
          type: 'reveal_card',
          frontTitle: 'Scope of practice',
          frontBody: 'Tap to reveal',
          backTitle: 'Definition',
          backBody: 'Tasks CNAs may perform when delegated; nursing assessment and orders remain with licensed staff.',
        },
      ]);

    case 'mini_video':
      return wrap(lesson, input, [
        heading('Clinical overview video'),
        {
          id: blockId(s, 'video'),
          type: 'video',
          title: `${topic} — overview`,
          durationLabel: '~5 min',
          placeholderNote:
            '[AI draft — do not upload until script approved] See Media prompts in CMS Quality tab for generated video script.',
        },
        text(`Post-video focus: ${focus}. Note observations you would report to the nurse.`),
      ]);

    case 'core_teaching_content':
    case 'reading_content':
      return wrap(lesson, input, [
        heading('Core teaching content'),
        text(
          `**${topic}** — core concepts for CNAs:\n\n1. Recognize signs and symptoms relevant to this topic during routine care.\n2. Use ${focus} when interacting with residents and families.\n3. Follow facility policy and care plan directions.\n4. Escalate concerns to the licensed nurse using objective, dated communication.\n\n[AI draft — faculty must verify medical accuracy and add citations.]`,
        ),
        {
          id: blockId(s, 'infographic'),
          type: 'infographic',
          title: `${topic} workflow`,
          description: `[AI draft] Visual summary of ${focus} — replace with approved infographic.`,
          caption: 'Infographic placeholder',
        },
        {
          id: blockId(s, 'ca'),
          type: 'callout',
          variant: 'info',
          title: 'California-specific note',
          body: ca,
        },
      ]);

    case 'cna_role_guidance':
      return wrap(lesson, input, [
        heading('CNA role: do and do not'),
        {
          id: blockId(s, 'do'),
          type: 'summary',
          title: 'Do',
          items: [
            `Observe and report changes related to ${topic}`,
            'Follow infection prevention and safety protocols',
            'Support resident dignity and choices when possible',
          ],
        },
        {
          id: blockId(s, 'dont'),
          type: 'callout',
          variant: 'warning',
          title: 'Do not',
          body: 'Do not change orders, diagnose, or withhold nurse communication. Do not rush care in ways that compromise safety.',
        },
      ]);

    case 'case_study':
      return wrap(lesson, input, [
        {
          id: blockId(s, 'case'),
          type: 'case_study',
          title: `Case study — ${topic}`,
          residentProfile:
            '[AI draft] California SNF resident — replace with approved profile (age, cognition, mobility, relevant history).',
          scenario: `[AI draft] During evening care, staff notice changes related to ${topic}. Describe what the CNA observes and documents.`,
          discussionPrompt: 'What is your first action within CNA scope?',
        },
      ]);

    case 'scenario_interaction':
      return wrap(lesson, input, [
        {
          id: blockId(s, 'scenario'),
          type: 'scenario_question',
          prompt: `[AI draft] A resident situation related to ${topic} arises. What is the best CNA response?`,
          context: `Module: ${moduleTitle}. Focus: ${focus}.`,
          options: [
            { id: 'a', label: 'Act outside scope to resolve quickly', feedback: 'Outside CNA scope — risks safety and compliance.' },
            {
              id: 'b',
              label: 'Ensure safety, support dignity, notify nurse per protocol',
              feedback: 'Correct — aligns with California CNA practice expectations.',
              isRecommended: true,
            },
            { id: 'c', label: 'Wait until end of shift to mention it', feedback: 'Delayed reporting can harm residents and violates professional standards.' },
          ],
          requiredForCompletion: true,
        },
      ]);

    case 'knowledge_check':
      return wrap(lesson, input, [
        {
          id: blockId(s, 'kc'),
          type: 'knowledge_check',
          question: `[AI draft] Which statement best reflects safe practice for ${topic}?`,
          options: [
            { id: 'a', label: 'CNAs may change physician orders when convenient' },
            { id: 'b', label: 'CNAs report objective observations to the nurse promptly' },
            { id: 'c', label: 'Documentation can wait until next week' },
          ],
          correctOptionId: 'b',
          explanation: `Timely, objective reporting supports resident safety and ${focus}.`,
          requiredForCompletion: true,
        },
      ]);

    case 'reflection':
      return wrap(lesson, input, [
        heading('Reflection'),
        {
          id: blockId(s, 'reflection'),
          type: 'reflection',
          prompt: `How will you apply lessons from **${topic}** on your next shift? Consider ${focus}.`,
          minCharacters: 40,
          placeholder: 'Professional reflection (not shared with other learners).',
          requiredForCompletion: true,
        },
      ]);

    case 'cna_best_practices':
      return wrap(lesson, input, [
        heading('CNA best practices'),
        text(`Best practices for **${topic}** in California facilities:`),
        {
          id: blockId(s, 'bp'),
          type: 'summary',
          title: 'Reminders',
          items: [
            'Teamwork with licensed nurses and interdisciplinary staff',
            'Consistent hand hygiene and PPE per policy',
            'Resident rights, privacy, and respectful communication',
          ],
        },
      ]);

    case 'summary_recap':
      return wrap(lesson, input, [
        heading('Summary and recap'),
        {
          id: blockId(s, 'recap'),
          type: 'summary',
          title: 'Key takeaways',
          items: [
            `${topic}: core concepts reviewed`,
            `${focus}: apply on every shift`,
            'Complete knowledge checks and meet active participation before the exam',
          ],
        },
      ]);

    case 'what_happens_next':
      return wrap(lesson, input, [
        heading('What happens next'),
        text('To complete this Online CE hour you will:'),
        {
          id: blockId(s, 'steps'),
          type: 'summary',
          title: 'Completion steps',
          items: [
            'Finish all lessons and required interactions',
            'Accrue 50 minutes active participation',
            'Pass the final exam (80%, up to 3 attempts)',
            'Submit learner attestation',
            'Download certificate; transcript updates automatically',
          ],
        },
      ]);

    case 'attestation_guide':
      return wrap(lesson, input, [
        heading('Learner attestation'),
        text(
          'You must personally attest that you completed this coursework. Attestation unlocks after lessons, seat-time, and exam pass — platform enforcement is unchanged.',
        ),
      ]);

    case 'certificate_access':
      return wrap(lesson, input, [
        heading('Certificate and transcript'),
        text(
          'Certificate and transcript entry unlock after attestation. Use your dashboard for renewal documentation.',
        ),
      ]);

    default:
      return wrap(lesson, input, [
        heading(lesson.title),
        text(`[AI draft section ${kind}] Content for ${topic} — instructor review required.`),
      ]);
  }
}
