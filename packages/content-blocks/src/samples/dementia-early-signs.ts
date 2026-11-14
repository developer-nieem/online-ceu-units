import {
  LESSON_CONTENT_SCHEMA_VERSION,
  type LessonContentDocument,
} from '../types';

/** Dementia Care for CNAs — Recognizing Early Signs of Cognitive Decline */
export const RECOGNIZING_EARLY_SIGNS_LESSON: LessonContentDocument = {
  schemaVersion: LESSON_CONTENT_SCHEMA_VERSION,
  title: 'Recognizing Early Signs of Cognitive Decline',
  generation: { source: 'human', promptVersion: 'sample-v1' },
  blocks: [
    {
      id: 'intro-heading',
      type: 'heading',
      level: 1,
      text: 'Recognizing Early Signs of Cognitive Decline',
      accessibility: { ariaLabel: 'Lesson title' },
    },
    {
      id: 'intro-text',
      type: 'text',
      body: 'As a CNA, you are often the first care team member to notice subtle changes in a resident’s cognition, mood, or daily function. Early recognition supports timely nursing assessment, care plan updates, and person-centered interventions.',
      accessibility: { ariaLabel: 'Lesson introduction' },
    },
    {
      id: 'objectives-callout',
      type: 'callout',
      variant: 'info',
      title: 'Learning objectives',
      body: 'After this lesson you will be able to:\n- Describe common early signs of cognitive decline in long-term care\n- Apply observation and reporting practices that protect resident dignity\n- Choose supportive responses when a resident shows confusion or memory loss',
      accessibility: { ariaLabel: 'Learning objectives' },
    },
    {
      id: 'case-maria',
      type: 'case_study',
      title: 'Case study: Maria, age 82',
      residentProfile:
        'Maria has lived in the memory care unit for 14 months. She is usually cheerful, enjoys music programs, and dresses herself with cueing.',
      scenario:
        'Over the past two weeks, staff note Maria repeatedly asking when her daughter will visit (already visited yesterday), misplacing her walker, and becoming tearful during evening care. She refused supper twice, saying she already ate—though meal intake records show otherwise.',
      discussionPrompt:
        'What objective observations would you document? Who would you notify, and how would you preserve Maria’s dignity during care?',
      accessibility: {
        ariaLabel: 'Case study about resident Maria',
      },
    },
    {
      id: 'signs-infographic',
      type: 'infographic',
      title: 'Early warning signs to observe',
      description:
        'Memory loss affecting daily life · Confusion with time/place · Difficulty completing familiar tasks · Changes in mood or personality · Withdrawal from activities · Misplacing items and inability to retrace steps',
      caption: 'Reference infographic — production asset pending',
      accessibility: {
        altText:
          'Infographic listing seven early warning signs of cognitive decline relevant to nursing assistants in long-term care',
        transcriptPlaceholder: 'Full text alternative will ship with final SVG asset',
      },
    },
    {
      id: 'comparison-image',
      type: 'image',
      caption: 'Normal age-related changes vs. signs that warrant reporting',
      accessibility: {
        altText:
          'Placeholder comparison chart: occasional forgetfulness versus persistent memory loss, confusion, or safety concerns requiring nurse notification',
      },
    },
    {
      id: 'scenario-evening',
      type: 'scenario_question',
      prompt:
        'Maria becomes agitated during evening hygiene and says she wants to “go home,” grabbing her roommate’s door. What is the best first response?',
      context: 'Select the most person-centered, safety-focused action.',
      requiredForCompletion: true,
      options: [
        {
          id: 'a',
          label: 'Tell her firmly she lives here now and she cannot leave',
          feedback:
            'Arguing about reality often increases distress. Redirect and validate feelings first.',
        },
        {
          id: 'b',
          label: 'Validate her concern, offer a calming activity, and notify the nurse per facility protocol',
          feedback:
            'Correct. Validation plus safety monitoring and nurse communication aligns with person-centered dementia care.',
          isRecommended: true,
        },
        {
          id: 'c',
          label: 'Ignore the behavior so you can finish tasks on time',
          feedback: 'Unmet emotional needs and safety risks may escalate. Engagement and support are essential.',
        },
      ],
      accessibility: { ariaLabel: 'Scenario question about evening agitation' },
    },
    {
      id: 'video-observation',
      type: 'video',
      title: 'Demonstration: Therapeutic communication (placeholder)',
      durationLabel: '4 min',
      placeholderNote: 'Video player will stream HLS from MediaAsset when media pipeline is enabled.',
      accessibility: {
        ariaLabel: 'Video lesson placeholder',
        captionsPlaceholder: 'Closed captions will attach to MediaAsset.captions',
        transcriptPlaceholder: 'Full transcript will display below the player for WCAG compliance',
      },
    },
    {
      id: 'kc-reporting',
      type: 'knowledge_check',
      question:
        'Which documentation is most appropriate when you notice a pattern of cognitive change?',
      options: [
        { id: 'a', label: 'Subjective opinion only: “She seems crazy today”' },
        {
          id: 'b',
          label:
            'Objective, dated observations with examples (behaviors, times, triggers) shared with the nurse',
        },
        { id: 'c', label: 'No documentation unless the resident is injured' },
      ],
      correctOptionId: 'b',
      explanation:
        'Timely, objective observations help the interdisciplinary team adjust care plans and meet regulatory documentation expectations.',
      requiredForCompletion: true,
      accessibility: { ariaLabel: 'Knowledge check on documentation' },
    },
    {
      id: 'audio-narration',
      type: 'audio',
      title: 'Narration: Reporting chains (placeholder)',
      narrationScript:
        'Notify the charge nurse during shift per facility policy. Document in the clinical record the same shift when possible...',
      placeholderNote: 'Audio narration will use MediaAsset with downloadable transcript.',
      accessibility: {
        ariaLabel: 'Audio narration placeholder',
        transcriptPlaceholder: 'Synced transcript will appear when audio is uploaded',
      },
    },
    {
      id: 'matching-placeholder',
      type: 'matching',
      instructions: 'Match each early sign with the appropriate nursing assistant action.',
      placeholderNote: 'Drag-and-drop matching activity — interactive engine coming soon.',
      requiredForCompletion: false,
    },
    {
      id: 'reflection-dignity',
      type: 'reflection',
      prompt:
        'Describe one way you can preserve dignity when a resident repeats questions or forgets recent events.',
      minCharacters: 20,
      placeholder: 'Example: I speak calmly, use preferred name, and avoid correcting in front of others...',
      requiredForCompletion: true,
      accessibility: { ariaLabel: 'Reflection prompt on dignity' },
    },
    {
      id: 'summary-takeaways',
      type: 'summary',
      title: 'Key takeaways',
      items: [
        'Report patterns of cognitive change with objective, dated observations.',
        'Validate feelings and redirect—avoid arguing about reality.',
        'Involve the nurse promptly per facility protocol; update care approaches as directed.',
        'Protect dignity: privacy, preferred names, and calm, unhurried communication.',
      ],
      accessibility: { ariaLabel: 'Lesson summary' },
    },
  ],
};
