import type { BlueprintLessonDef, BlueprintSectionKind } from './course-blueprint.types';
import type { ContentBlock, LessonContentDocument } from './types';
import { LESSON_CONTENT_SCHEMA_VERSION } from './types';

function blockId(sectionSlug: string, suffix: string) {
  return `${sectionSlug}-${suffix}`;
}

function caNoteBlock(sectionSlug: string): ContentBlock {
  return {
    id: blockId(sectionSlug, 'ca-note'),
    type: 'callout',
    variant: 'info',
    title: 'California-specific note',
    body: '[Placeholder] Add Title 22 / CDPH context, reporting timelines, and facility policy crosswalk for California CNAs.',
    meta: { qualityPlaceholder: 'californiaSpecificNotes' },
  };
}

function a11yPlaceholder(sectionSlug: string): ContentBlock {
  return {
    id: blockId(sectionSlug, 'a11y'),
    type: 'text',
    body: '[Accessibility placeholder] Provide alt text on images, captions/transcripts for media, and keyboard-accessible interactions (WCAG 2.1 AA target).',
    meta: { qualityPlaceholder: 'accessibilityCaptions' },
    accessibility: {
      altText: 'Placeholder',
      captionsPlaceholder: 'Captions pending',
      transcriptPlaceholder: 'Transcript pending',
    },
  };
}

function i18nPlaceholder(sectionSlug: string): ContentBlock {
  return {
    id: blockId(sectionSlug, 'i18n'),
    type: 'callout',
    variant: 'tip',
    title: 'Multilingual support',
    body: '[Placeholder] English copy is authoritative. Spanish (es) translation attaches to block fields when available.',
    meta: { qualityPlaceholder: 'multilingual', locales: ['en', 'es'] },
  };
}

function buildBlocksForSection(
  lesson: BlueprintLessonDef,
  courseTitle: string,
): ContentBlock[] {
  const s = lesson.slug;
  const kind = lesson.sectionKind;

  const heading = (text: string, level: 1 | 2 | 3 = 2): ContentBlock => ({
    id: blockId(s, 'heading'),
    type: 'heading',
    level,
    text,
  });

  const text = (body: string): ContentBlock => ({
    id: blockId(s, 'body'),
    type: 'text',
    body,
  });

  switch (kind) {
    case 'course_information':
      return [
        heading('Course information'),
        text(
          '[Placeholder] Describe this Online CE hour: topic focus, target audience (California CNAs), and how it supports safe resident care.',
        ),
        {
          id: blockId(s, 'ceu-info'),
          type: 'callout',
          variant: 'info',
          title: 'Credit and time',
          body: '1.0 Online CE hour · ~50 minutes active participation · 60 minutes catalog seat time.',
        },
        {
          id: blockId(s, 'scope'),
          type: 'callout',
          variant: 'clinical',
          title: 'CNA scope alignment',
          body: '[Placeholder] Confirm content stays within CNA scope; defer clinical decisions to licensed nurses.',
          meta: { qualityPlaceholder: 'cnaScopeAlignment' },
        },
        caNoteBlock(s),
      ];

    case 'key_terms':
      return [
        heading('Key terms'),
        text('[Placeholder] Define essential vocabulary CNAs need for this topic.'),
        {
          id: blockId(s, 'term-1'),
          type: 'reveal_card',
          frontTitle: '[Term 1]',
          frontBody: 'Tap to reveal definition',
          backTitle: 'Definition',
          backBody: '[Placeholder] Clinical definition and CNA application.',
        },
        {
          id: blockId(s, 'term-2'),
          type: 'reveal_card',
          frontTitle: '[Term 2]',
          frontBody: 'Tap to reveal definition',
          backTitle: 'Definition',
          backBody: '[Placeholder] Clinical definition and CNA application.',
        },
      ];

    case 'welcome':
      return [
        heading(`Welcome — ${courseTitle}`),
        text(
          'This CAL ACE Online CEU course is designed for California Certified Nursing Assistants. Plan for focused, uninterrupted time. You will read clinical content, respond to scenarios, complete knowledge checks, pass a final exam, and attest to completion.',
        ),
        {
          id: blockId(s, 'ceu'),
          type: 'callout',
          variant: 'clinical',
          title: '1 Online CE hour',
          body: 'This course provides 1.0 Online CE hour when you complete active participation, lessons, the final exam, and learner attestation.',
        },
        i18nPlaceholder(s),
      ];

    case 'learning_objectives':
      return [
        heading('Learning objectives'),
        text('After completing this course, you will be able to:'),
        {
          id: blockId(s, 'objectives'),
          type: 'summary',
          title: 'Objectives',
          items: [
            '[Placeholder] Apply person-centered care principles in daily CNA practice.',
            '[Placeholder] Recognize signs that require timely nurse notification.',
            '[Placeholder] Document objectively and communicate changes professionally.',
            '[Placeholder] Meet California regulatory expectations for CNAs in skilled nursing settings.',
          ],
        },
        a11yPlaceholder(s),
      ];

    case 'instructor_intro':
      return [
        heading('Your instructor'),
        text(
          '[Instructor placeholder] Faculty name, credentials, and brief bio will appear here. Replace with approved CAL ACE instructor profile and photo.',
        ),
        {
          id: blockId(s, 'photo'),
          type: 'image',
          caption: 'Instructor photo — healthcare professional headshot placeholder',
          src: null,
          accessibility: { altText: 'Instructor headshot placeholder' },
          meta: { qualityPlaceholder: 'healthcareVisuals' },
        },
        {
          id: blockId(s, 'author-meta'),
          type: 'callout',
          variant: 'info',
          title: 'Author metadata',
          body: '[Placeholder] Credentials, disclosures, and CAL ACE faculty approval status.',
          meta: { qualityPlaceholder: 'instructorAuthorMetadata' },
        },
        {
          id: blockId(s, 'intro-video'),
          type: 'video',
          title: 'Brief faculty welcome (optional)',
          durationLabel: '~2 min',
          placeholderNote: 'Upload instructor welcome video to /media/courses/{slug}/instructor-intro.mp4',
        },
      ];

    case 'mini_video':
      return [
        heading('Clinical overview'),
        {
          id: blockId(s, 'video'),
          type: 'video',
          title: 'Mini-lesson video',
          durationLabel: '~5 min active viewing',
          placeholderNote:
            'Upload course overview video. Use dignity-respecting, facility-appropriate visuals.',
        },
        text('[Placeholder] Post-video summary: key concepts learners should carry into the reading and case study sections.'),
        a11yPlaceholder(s),
      ];

    case 'core_teaching_content':
    case 'reading_content':
      return [
        heading('Core teaching content'),
        text(
          '[Placeholder] Author evidence-based reading content here. Use short paragraphs, clinical headings, and plain language appropriate for working CNAs.',
        ),
        {
          id: blockId(s, 'infographic'),
          type: 'infographic',
          title: 'Clinical workflow infographic',
          description: '[Placeholder] Visual summary of the primary protocol or decision pathway.',
          caption: 'Healthcare infographic asset pending',
          meta: { qualityPlaceholder: 'infographics' },
        },
        caNoteBlock(s),
        {
          id: blockId(s, 'download'),
          type: 'callout',
          variant: 'tip',
          title: 'Downloadable resource',
          body: '[Placeholder] Link a PDF job aid or checklist when the media library supports downloads.',
          meta: { qualityPlaceholder: 'downloadableResources' },
        },
        {
          id: blockId(s, 'refs'),
          type: 'callout',
          variant: 'info',
          title: 'References',
          body: '[Placeholder] Bibliography — CDPH, clinical guidelines, and evidence sources.',
          meta: { qualityPlaceholder: 'referencesBibliography' },
        },
      ];

    case 'cna_role_guidance':
      return [
        heading('CNA role: do and do not'),
        {
          id: blockId(s, 'do'),
          type: 'summary',
          title: 'Do',
          items: [
            '[Placeholder] Scope-safe action aligned with care plan',
            '[Placeholder] Report changes to the nurse promptly',
            '[Placeholder] Preserve dignity and resident rights',
          ],
        },
        {
          id: blockId(s, 'dont'),
          type: 'callout',
          variant: 'warning',
          title: 'Do not',
          body: '[Placeholder] Actions outside CNA scope, independent clinical decisions, or delaying nurse notification.',
        },
        text('[Placeholder] Tie guidance to California practice expectations and facility policy.'),
        {
          id: blockId(s, 'scope-check'),
          type: 'callout',
          variant: 'clinical',
          title: 'Scope check',
          body: 'CNAs perform delegated nursing tasks — not nursing assessment, diagnosis, or order changes.',
          meta: { qualityPlaceholder: 'cnaScopeAlignment' },
        },
      ];

    case 'case_study':
      return [
        {
          id: blockId(s, 'case'),
          type: 'case_study',
          title: 'Resident case study',
          residentProfile:
            '[Placeholder] California skilled nursing resident profile — age, diagnosis context, cognition, mobility, and relevant history.',
          scenario:
            '[Placeholder] Describe a realistic shift scenario. CNAs should identify observations, scope-appropriate actions, and reporting.',
          discussionPrompt: 'What would you do first, and what would you report to the nurse?',
          meta: { qualityPlaceholder: 'cnaScenarios' },
        },
        caNoteBlock(s),
      ];

    case 'scenario_interaction':
      return [
        {
          id: blockId(s, 'scenario'),
          type: 'scenario_question',
          prompt: '[Placeholder] What is the best CNA response in this situation?',
          context:
            '[Placeholder] Brief scenario stem — replace with course-specific resident context.',
          options: [
            {
              id: 'a',
              label: '[Placeholder] Option A',
              feedback: 'Review person-centered care and safety priorities.',
            },
            {
              id: 'b',
              label: '[Placeholder] Option B (recommended practice)',
              feedback: 'Correct — aligns with scope, dignity, and nurse communication.',
              isRecommended: true,
            },
            {
              id: 'c',
              label: '[Placeholder] Option C',
              feedback: 'This approach may increase risk or delay appropriate reporting.',
            },
          ],
          requiredForCompletion: true,
        },
      ];

    case 'reflection':
      return [
        heading('Reflection'),
        {
          id: blockId(s, 'reflection'),
          type: 'reflection',
          prompt:
            'How will you apply what you learned on your next shift? Consider communication, safety, and documentation.',
          minCharacters: 40,
          placeholder: 'Enter a thoughtful, professional reflection (not shared with other learners).',
          requiredForCompletion: true,
        },
      ];

    case 'knowledge_check':
      return [
        {
          id: blockId(s, 'kc'),
          type: 'knowledge_check',
          question: '[Placeholder] Knowledge check question — replace with course-specific stem.',
          options: [
            { id: 'a', label: '[Placeholder] Answer A' },
            { id: 'b', label: '[Placeholder] Answer B (correct)' },
            { id: 'c', label: '[Placeholder] Answer C' },
          ],
          correctOptionId: 'b',
          explanation:
            '[Rationale placeholder] Explain why the correct answer reflects CNA best practice and California expectations.',
          requiredForCompletion: true,
          meta: { blueprintSection: lesson.slug },
        },
      ];

    case 'cna_best_practices':
      return [
        heading('CNA best practices'),
        text(
          '[Placeholder] Summarize scope-appropriate actions, teamwork with licensed nurses, infection prevention, resident rights, and professional communication.',
        ),
        {
          id: blockId(s, 'practices'),
          type: 'summary',
          title: 'Practice reminders',
          items: [
            'Work within CNA scope — delegate and report per facility policy.',
            'Use person-centered language and preserve dignity.',
            'Document objectively; report changes promptly.',
          ],
        },
        caNoteBlock(s),
      ];

    case 'summary_recap':
      return [
        heading('Summary and recap'),
        {
          id: blockId(s, 'recap'),
          type: 'summary',
          title: 'Key takeaways',
          items: [
            '[Placeholder] Takeaway 1',
            '[Placeholder] Takeaway 2',
            '[Placeholder] Takeaway 3',
          ],
        },
        text('Before the final exam, confirm you completed all required interactions in prior lessons.'),
      ];

    case 'what_happens_next':
      return [
        heading('What happens next'),
        text('After you finish all lessons, follow these steps to complete your Online CE hour:'),
        {
          id: blockId(s, 'roadmap'),
          type: 'summary',
          title: 'Completion steps',
          items: [
            'Meet 50 minutes of active participation (tracked automatically).',
            'Pass the final exam (80%, up to 3 attempts).',
            'Submit your learner attestation.',
            'Download your certificate; your transcript updates automatically.',
          ],
        },
        text('Seat-time, exam, attestation, certificate, and transcript rules are enforced by the platform — they cannot be skipped.'),
      ];

    case 'attestation_guide':
      return [
        heading('Learner attestation'),
        text(
          'California Online CE requires your personal attestation that you completed this coursework. You will affirm your identity and completion before the certificate unlocks.',
        ),
        {
          id: blockId(s, 'exam-prep'),
          type: 'callout',
          variant: 'clinical',
          title: 'Before attestation',
          body: 'Complete all lessons, active participation time, and pass the final exam first. Attestation is available from your course dashboard.',
        },
      ];

    case 'certificate_access':
      return [
        heading('Certificate and transcript'),
        text(
          'After exam pass and attestation, your certificate and transcript entry unlock. Download the certificate for your records; the transcript reflects this 1.0 Online CE hour.',
        ),
        {
          id: blockId(s, 'cert'),
          type: 'callout',
          variant: 'info',
          title: 'Certificate access',
          body: 'Use the Certificate link on your course page. Contact CAL ACE support for name or date corrections.',
        },
        {
          id: blockId(s, 'transcript'),
          type: 'callout',
          variant: 'tip',
          title: 'Transcript',
          body: 'View all completed hours on your Transcripts page for CNA renewal documentation.',
        },
      ];

    default:
      return [
        heading(lesson.title),
        text(`[Blueprint section ${kind}] — author content for ${courseTitle}.`),
      ];
  }
}

/** Build a v2 lesson document for a blueprint section. */
export function buildLessonDocumentForBlueprintLesson(
  lesson: BlueprintLessonDef,
  courseTitle: string,
): LessonContentDocument {
  return {
    schemaVersion: LESSON_CONTENT_SCHEMA_VERSION,
    title: lesson.title,
    blocks: buildBlocksForSection(lesson, courseTitle),
    generation: {
      source: 'hybrid',
      promptVersion: 'course-blueprint-v1.1',
    },
  };
}

export function buildDefaultLearningObjectives(courseTitle: string): string[] {
  return [
    `Apply course-specific clinical knowledge from "${courseTitle}" in daily CNA practice.`,
    'Recognize situations requiring timely licensed nurse notification.',
    'Document and communicate resident changes objectively and professionally.',
    'Meet California CNA regulatory and ethical expectations in skilled nursing care.',
  ];
}
