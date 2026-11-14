/**
 * Seed Course 47 — Supporting Autistic Adults & Older Adults (DRAFT).
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-47-autism-adults
 *
 * Idempotent upserts by slug. Does not seed the final quiz (pending owner approval).
 * Lesson slugs follow the 12-lesson structure (s01-introduction … s12-conclusion).
 */
import {
  LESSON_CONTENT_SCHEMA_VERSION,
  ONE_HOUR_CNA_CEU_BLUEPRINT,
  type ContentBlock,
  type LessonContentDocument,
} from '@calace/content-blocks';
import {
  ContentPublishStatus,
  CourseStatus,
  CourseVersionStatus,
  DeliveryMode,
  Prisma,
  PrismaClient,
} from '@prisma/client';

import { DEFAULT_LAUNCH_CEU_HOURS } from '../src/ceu-defaults';
import { mergeLaunchCatalogData } from '../src/launch-catalog';

const TENANT_SLUG = 'cal-ace';
const CATEGORY_SLUG = 'professional-development';
const PROFESSION_CODE = 'CNA';
const COURSE_SLUG = 'autism-in-adults';
const COURSE_TITLE = 'Autism-Informed Support for Adult and Older Residents';
const COURSE_SUMMARY =
  'Learn the CNA\'s role in supporting autistic adults and older adults — understanding autism as a lifelong neurodevelopmental difference (not an illness to cure), recognizing how it presents in adults (often undiagnosed in older generations), supporting sensory needs, communication differences, routine and predictability, recognizing distress/meltdown/shutdown and responding correctly, and providing respectful, individualized, neurodiversity-affirming care. CNAs do NOT diagnose, "treat" or try to cure autism, give or adjust medications, or force neurotypical behavior.';

const ASSET_BASE = `/assets/courses/autism-in-adults`;

/** Package sections s01–s12 (excluding final quiz). */
const PACKAGE_SECTION_LESSON_SLUGS = [
  's01-introduction',
  's02-terms',
  's03-statistics',
  's04-fundamentals',
  's05-signs',
  's06-causes',
  's07-role',
  's08-prevention',
  's09-scenario',
  's10-cna-role',
  's11-case-study',
  's12-conclusion',
] as const;

const BLUEPRINT_DURATION_BY_SLUG = new Map(
  ONE_HOUR_CNA_CEU_BLUEPRINT.modules.flatMap((module) =>
    module.lessons.map((lesson) => [lesson.slug, lesson.estimatedActiveMinutes]),
  ),
);

/** Package-aligned lessons not in the standard blueprint use package section runtime (5 min). */
const PACKAGE_SECTION_DURATION_MINUTES = 5;

function durationMinutesForLesson(slug: string): number {
  return BLUEPRINT_DURATION_BY_SLUG.get(slug) ?? PACKAGE_SECTION_DURATION_MINUTES;
}

const DEFAULT_CATALOG = {
  price: 3.75,
  durationMinutes: 60,
  difficulty: 'intermediate',
  instructor: 'CAL ACE Faculty',
  featured: false,
  hasFreePreview: false,
  subscriptionEligible: true,
};

const DEFAULT_CONTENT_META = {
  overview: COURSE_SUMMARY,
  learningObjectives: [
    'Understand autism as a lifelong difference, not an illness.',
    'Recognize how it presents in adults.',
    'Support sensory, routine, and communication needs.',
    'Respond to distress correctly.',
    'Provide individualized, respectful care.',
  ],
  faq: [] as { question: string; answer: string }[],
  compliance: {
    providerName: 'CAL ACE Nursing Academy',
    cdphApprovalStatus: 'placeholder' as const,
    targetAudience: 'California certified nursing assistants',
    requiredSeatTimeMinutes: 50,
    onlineDeliveryDesignation: 'online' as const,
  },
  imageAccent: 'teal',
  heroImage: '/assets/courses/autism-in-adults/hero-banner.png',
  versioning: { immutableAfterPublish: true },
};

type LessonSeed = {
  slug: string;
  title: string;
  sortOrder: number;
  buildContent: () => LessonContentDocument;
};

type ModuleSeed = {
  slug: string;
  title: string;
  sortOrder: number;
  lessons: LessonSeed[];
};

function doc(title: string, blocks: ContentBlock[]): LessonContentDocument {
  return {
    schemaVersion: LESSON_CONTENT_SCHEMA_VERSION,
    title,
    generation: { source: 'hybrid' },
    blocks,
  };
}

function pendingAudio(
  id: string,
  title: string,
  assetPath: string,
  narrationScript: string,
  audioUrl?: string,
): ContentBlock {
  return {
    id,
    type: 'audio',
    title,
    narrationScript,
    placeholderNote: `Pending upload: ${assetPath}`,
    ...(audioUrl ? { audioUrl } : {}),
  };
}

const MODULES: ModuleSeed[] = [
  {
    slug: 'module-1',
    title: 'Understanding Autism in Adults & Older Adults',
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: 'Introduction',
        sortOrder: 0,
        buildContent: () =>
          doc('Welcome', [
            { id: 'aut-s01-heading', type: 'heading', level: 1, text: 'Welcome' },
            {
              id: 'aut-s01-video',
              type: 'video',
              title: 'Introduction',
              videoUrl: '/assets/courses/autism-in-adults/s01-intro.mp4',
              placeholderNote: 'Pending upload: /assets/courses/autism-in-adults/s01-intro.mp4',
            },
            {
              id: 'aut-s01-image',
              type: 'image',
              src: `${ASSET_BASE}/s01-hero.png`,
              caption:
                'Autism in adults — providing respectful, individualized care that honors each person\'s needs.',
            },
            {
                          id: 'aut-s01-narration',
                          type: 'text',
                          body: [
                            'Welcome to CAL ACE Nursing Academy.',
                            'This course is about supporting autistic adults and older adults — a topic rarely taught for elder care, but increasingly important, because autistic people are everywhere, of every age, and many of them need care that fits how their minds actually work.',
                            'Let\'s start with what autism is. Autism — autism spectrum disorder — is a lifelong neurodevelopmental difference. That means a person\'s brain is wired differently from birth, affecting how they experience senses, communicate, process information, and relate to the world. It is not an illness, not a disease, and not something to cure or "fix." It\'s a different way of being human — with real challenges in some areas and real strengths in others. The word "spectrum" matters: autistic people vary enormously, from those who need substantial daily support to those who live very independently, and each is an individual, not a stereotype.',
                            'Now, why this matters in elder care, and why it\'s often invisible. Many autistic older adults were never diagnosed — they grew up in decades when autism was barely understood, especially milder presentations, so they went their whole lives undiagnosed, often labeled "odd," "difficult," "a loner," or "eccentric," and many learned to hide their differences just to get by. So among your residents are autistic people who may never have had a name for how they experience the world. Recognizing the patterns — even without a diagnosis — lets you give care that fits them.',
                            'Here\'s the heart of this course. A few things deeply shape an autistic person\'s experience of care. Sensory sensitivities — bright lights, loud noises, certain textures, smells, or unexpected touch can be genuinely overwhelming or even painful. A need for routine and predictability — sudden changes can cause real distress. Communication differences — in how they speak, understand, and express themselves. And, when overwhelmed, distress responses called meltdowns or shutdowns that are not "behavior" or "tantrums," but a nervous system pushed past its limit. Care that accounts for these — and never demands an autistic person act neurotypical — transforms their experience.',
                            'The guiding principle of this whole course is simple and respectful: meet the person where they are. Adjust the care to fit the autistic person, rather than forcing the autistic person to fit the care. Every autistic resident is an individual — learn their specific needs, sensitivities, and communication style, and honor them.',
                            'Your scope is clear. A CNA recognizes autistic traits and needs, supports sensory and routine needs, communicates respectfully and flexibly, responds calmly to distress, and provides individualized, affirming care. A CNA does not diagnose autism, does not try to "treat" or cure it, does not give or adjust medications, and does not force neurotypical behavior.',
                            'By the end of this course, you will be able to: understand autism as a lifelong difference, not an illness. Recognize how it presents in adults. Support sensory, routine, and communication needs. Respond to distress correctly. And provide individualized, respectful care.',
                            'There is a ten-question knowledge check at the end. Everything on it is covered here. Let\'s begin.',
                          ].join('\n\n'),
                        },
            {
                          id: 'aut-s01-ci-text',
                          type: 'text',
                          body: [
                            'This course teaches the CNA\'s role in supporting autistic adults and older adults — understanding autism as a lifelong neurodevelopmental difference (not an illness to cure), recognizing how it presents in adults (often undiagnosed in older generations), supporting sensory needs, communication differences, routine and predictability, recognizing distress/meltdown/shutdown and responding correctly, and providing respectful, individualized, neurodiversity-affirming care.',
                            'Let\'s be clear about your role. A CNA recognizes autistic traits and needs, supports sensory and routine needs, communicates respectfully and flexibly, responds calmly to distress, and provides individualized, affirming care. A CNA does not diagnose autism, does not try to "treat" or cure it, does not give or adjust medications, and does not force neurotypical behavior. Those are nursing and clinical-team tasks. But none of them can happen without your careful observation and faithful reporting first.',
                          ].join('\n\n'),
                        },
            {
                          id: 'aut-s01-ci-scope-callout',
                          type: 'callout',
                          variant: 'clinical',
                          title: 'Scope of this course',
                          body: 'CNAs ACCOMMODATE, COMMUNICATE, SUPPORT, and ACCEPT. CNAs do not diagnose autism, try to "treat" or cure it, give or adjust medications, or force neurotypical behavior.',
                        },
            {
                          id: 'aut-s01-lo-text',
                          type: 'text',
                          body: 'By the end of this course, you will be able to:',
                        },
            {
                          id: 'aut-s01-lo-summary',
                          type: 'summary',
                          title: 'Learning objectives',
                          items: [
                            'Understand autism as a lifelong difference, not an illness.',
                            'Recognize how it presents in adults.',
                            'Support sensory, routine, and communication needs.',
                            'Respond to distress correctly.',
                            'Provide individualized, respectful care.',
                          ],
                        },
          ]),
      },
      {
        slug: 's02-terms',
        title: 'Terms & Definitions',
        sortOrder: 1,
        buildContent: () =>
          doc('Key terms', [
            { id: 'aut-s02-heading', type: 'heading', level: 1, text: 'Key terms' },
            {
              id: 'aut-s02-image',
              type: 'image',
              src: `${ASSET_BASE}/s02-hero.png`,
              caption:
                'Key terms — autism spectrum, sensory sensitivity, stimming, meltdown, communication differences.',
            },
            {
                          id: 'aut-s02-reveal-autism',
                          type: 'reveal_card',
                          frontTitle: 'Autism (Autism Spectrum Disorder)',
                          frontBody: 'Autism',
                          backTitle: 'Autism (Autism Spectrum Disorder)',
                          backBody:
                            'A lifelong neurodevelopmental difference present from birth, affecting how a person experiences senses, communicates, processes information, and relates to others. It is not an illness or disease to cure — it\'s a different way of being. Autistic people have both challenges and strengths, and vary enormously.',
                        },
            {
                          id: 'aut-s02-reveal-neurodiversity',
                          type: 'reveal_card',
                          frontTitle: 'Neurodiversity',
                          frontBody: 'Neurodiversity',
                          backTitle: 'Neurodiversity',
                          backBody:
                            'The idea that brains naturally vary, and that differences like autism are part of normal human variation — not defects to fix. Neurodiversity-affirming care respects an autistic person\'s way of being and adjusts the environment and care to fit them, rather than trying to make them "normal."',
                        },
            {
                          id: 'aut-s02-reveal-spectrum',
                          type: 'reveal_card',
                          frontTitle: 'Spectrum',
                          frontBody: 'Spectrum',
                          backTitle: 'Spectrum',
                          backBody:
                            'Autism varies enormously from person to person — in support needs, communication, sensory sensitivities, and strengths. "If you\'ve met one autistic person, you\'ve met one autistic person." There\'s no single way autism looks, which is why care is always individualized to the specific person, never to a stereotype.',
                        },
            {
                          id: 'aut-s02-reveal-sensory',
                          type: 'reveal_card',
                          frontTitle: 'Sensory Sensitivities',
                          frontBody: 'Sensory sensitivities',
                          backTitle: 'Sensory Sensitivities',
                          backBody:
                            'Autistic people often experience senses more intensely — bright lights, loud or sudden noises, certain textures, smells, tastes, or unexpected touch can be overwhelming or even painful. Some seek certain sensations and avoid others. Understanding a person\'s sensory needs, and reducing overwhelming input, is central to comfortable care.',
                        },
            {
                          id: 'aut-s02-reveal-stimming',
                          type: 'reveal_card',
                          frontTitle: 'Stimming',
                          frontBody: 'Stimming',
                          backTitle: 'Stimming',
                          backBody:
                            'Self-stimulating, repetitive movements or sounds — rocking, hand-flapping, tapping, repeating words — that help an autistic person self-soothe, focus, or manage emotion and sensory input. Stimming is healthy and helpful, not something to stop. Allow it; never try to suppress it unless it\'s truly harmful.',
                        },
            {
                          id: 'aut-s02-reveal-meltdown',
                          type: 'reveal_card',
                          frontTitle: 'Meltdown',
                          frontBody: 'Meltdown',
                          backTitle: 'Meltdown',
                          backBody:
                            'An intense response to being overwhelmed — by sensory overload, change, or stress — that may look like crying, shouting, or distress. It is NOT a tantrum, not manipulation, and not bad behavior; it\'s a nervous system past its limit, and the person isn\'t in full control. The response is calm, space, and reducing overwhelm — never punishment.',
                        },
            {
                          id: 'aut-s02-reveal-shutdown',
                          type: 'reveal_card',
                          frontTitle: 'Shutdown',
                          frontBody: 'Shutdown',
                          backTitle: 'Shutdown',
                          backBody:
                            'Another response to overwhelm — but turned inward: the person becomes quiet, withdrawn, unresponsive, or "frozen," unable to speak or act for a while. Like a meltdown, it\'s not defiance or ignoring you — it\'s overload. The response is the same: calm, space, patience, and reducing demands and stimulation.',
                        },
            {
                          id: 'aut-s02-reveal-masking',
                          type: 'reveal_card',
                          frontTitle: 'Masking',
                          frontBody: 'Masking',
                          backTitle: 'Masking',
                          backBody:
                            'The exhausting effort some autistic people make to hide their autistic traits and appear "normal" — suppressing stimming, forcing eye contact, mimicking social behavior. Many older autistic adults masked their whole lives. Masking is tiring and stressful, and a safe, accepting environment where a person doesn\'t have to mask is a gift.',
                        },
            {
                          id: 'aut-s02-kc1-check-sensory',
                          type: 'knowledge_check',
                          question:
                            'Match the term: experiencing lights, sounds, textures, or touch more intensely',
                          options: [
                            { id: 'sensory-sensitivities', label: 'Sensory sensitivities' },
                            { id: 'meltdown-shutdown', label: 'Meltdown / shutdown' },
                            { id: 'stimming', label: 'Stimming' },
                          ],
                          correctOptionId: 'sensory-sensitivities',
                          explanation:
                            'Sensory sensitivities. Autistic people often experience senses more intensely — bright lights, loud or sudden noises, certain textures, smells, tastes, or unexpected touch can be overwhelming or even painful. Some seek certain sensations and avoid others. Understanding a person\'s sensory needs, and reducing overwhelming input, is central to comfortable care.',
                          requiredForCompletion: true,
                        },
            {
                          id: 'aut-s02-kc1-check-meltdown',
                          type: 'knowledge_check',
                          question:
                            'Match the term: responses to overwhelm — NOT tantrums or defiance',
                          options: [
                            { id: 'sensory-sensitivities', label: 'Sensory sensitivities' },
                            { id: 'meltdown-shutdown', label: 'Meltdown / shutdown' },
                            { id: 'stimming', label: 'Stimming' },
                          ],
                          correctOptionId: 'meltdown-shutdown',
                          explanation:
                            'Meltdown / shutdown. A meltdown is an intense response to being overwhelmed that may look like crying, shouting, or distress. A shutdown is another response to overwhelm turned inward — quiet, withdrawn, unresponsive, or frozen. Both are NOT tantrums, manipulation, or defiance — they are a nervous system past its limit.',
                          requiredForCompletion: true,
                        },
            {
                          id: 'aut-s02-kc1-check-stimming',
                          type: 'knowledge_check',
                          question:
                            'Match the term: self-soothing repetitive movement — healthy, not to be stopped',
                          options: [
                            { id: 'sensory-sensitivities', label: 'Sensory sensitivities' },
                            { id: 'meltdown-shutdown', label: 'Meltdown / shutdown' },
                            { id: 'stimming', label: 'Stimming' },
                          ],
                          correctOptionId: 'stimming',
                          explanation:
                            'Stimming. Self-stimulating, repetitive movements or sounds — rocking, hand-flapping, tapping, repeating words — that help an autistic person self-soothe, focus, or manage emotion and sensory input. Stimming is healthy and helpful, not something to stop. Allow it; never try to suppress it unless it\'s truly harmful.',
                          requiredForCompletion: true,
                        },
          ]),
      },
      {
        slug: 's03-statistics',
        title: 'Statistics',
        sortOrder: 2,
        buildContent: () =>
          doc('Statistics', [
            { id: 'aut-s03-heading', type: 'heading', level: 1, text: 'Statistics' },
            pendingAudio(
              'aut-s03-audio',
              'Autistic Adults Are Everywhere — Including in Elder Care',
              `${ASSET_BASE}/s03-stats-podcast.mp3`,
              [
                'Autistic Adults Are Everywhere — Including in Elder Care',
                '',
                'Autism is far more common than most people realize, and crucially, it does not disappear in adulthood — autistic children become autistic adults and autistic older adults. Current estimates suggest a significant portion of the population is autistic, and while awareness has grown for children, autistic adults remain comparatively invisible in healthcare, and autistic older adults nearly absent from the conversation. Yet they are among the residents you care for.',
                '',
                'The most important fact for elder care is this: most autistic older adults were never diagnosed. Autism was poorly understood for most of the twentieth century, and milder presentations were rarely recognized at all. The people now in their seventies, eighties, and nineties grew up in an era with no framework for who they were. So they went through life undiagnosed — often labeled "odd," "difficult," "rigid," "antisocial," "a loner," or "eccentric." Many faced misunderstanding, social difficulty, and pressure to hide their differences, and many became expert maskers, exhausting themselves to appear normal for decades. This means an autistic resident in your care may have no diagnosis, no language for their own experience, and a lifetime of being misread. Recognizing the patterns — even without a label — lets you finally give them care that fits.',
                '',
                'Autism is a lifelong neurodevelopmental difference, not a mental illness, not a disease, and not something that can or should be cured. It shapes how a person experiences the world from birth: how they process sensory input, communicate, handle change, and relate socially. Several features matter enormously for daily care. Sensory sensitivities are common and can be intense — ordinary lights, noises, textures, smells, and especially unexpected touch can be genuinely overwhelming or painful, which obviously matters in hands-on care. A need for routine and predictability is common, so the changes and unpredictability of a care setting can cause real distress. Communication differences vary widely — some autistic people are highly verbal, some minimally speaking, some communicate in other ways — and misreading these as confusion or rudeness does harm. And overwhelm can produce meltdowns or shutdowns that are frequently misread as "behavior problems," when they are a nervous system past its limit.',
                '',
                'The encouraging core is that supporting autistic people well doesn\'t require curing anything — it requires accommodation and respect, much of it simple: reducing sensory overload, keeping routines predictable, communicating clearly and flexibly, allowing stimming, not forcing eye contact or neurotypical behavior, and responding to distress with calm rather than punishment. Research and autistic self-advocates alike are clear that this kind of affirming, individualized support dramatically improves wellbeing — and that forcing autistic people to suppress who they are causes real harm. Because CNAs deliver the hands-on, sensory, routine-shaping daily care, CNAs are exactly positioned to make an autistic resident\'s life markedly better or worse. The bottom line: autistic older adults exist, are often undiagnosed and long misunderstood, and thrive under care that accommodates their sensory, routine, and communication needs and respects who they are.',
              ].join('\n'),
              '/assets/courses/autism-in-adults/s03-stats-podcast.mp3',
            ),
            {
              id: 'aut-s03-image',
              type: 'image',
              src: `${ASSET_BASE}/s03-hero.png`,
              caption:
                'Autistic adults in long-term care — understanding, not changing, how they experience the world.',
            },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: 'Fundamentals',
        sortOrder: 3,
        buildContent: () =>
          doc('Fundamentals', [
            { id: 'aut-s04-heading', type: 'heading', level: 1, text: 'Fundamentals' },
            {
              id: 'aut-s04-video',
              type: 'video',
              title: 'Fundamentals',
              videoUrl: '/assets/courses/autism-in-adults/s04-fundamentals.mp4',
              placeholderNote: 'Pending upload: /assets/courses/autism-in-adults/s04-fundamentals.mp4',
            },
            {
              id: 'aut-s04-image',
              type: 'image',
              src: `${ASSET_BASE}/s04-hero.png`,
              caption:
                'Understanding autism — differences in communication, sensory processing, and routine.',
            },
            {
                          id: 'aut-s04-narration',
                          type: 'text',
                          body: [
                            '**What autism is**',
                            'Autism is a lifelong neurodevelopmental difference — a brain that\'s wired differently from birth. It shapes how a person experiences their senses, communicates, processes information, handles change, and connects with others. It is not an illness, not caused by anything the person or their parents did, and not something to cure. It comes with real challenges in some areas and often real strengths in others — deep focus, honesty, attention to detail, loyalty, expertise in areas of interest. Understanding it as a difference, not a defect, is where good care begins.',
                            '**The spectrum: every autistic person is an individual**',
                            'Autism is called a spectrum because autistic people vary enormously. Some need substantial daily support; some live highly independently. Some are very talkative; some speak little or not at all. Some have intense sensory sensitivities; others, different ones. There is no single way autism looks, and the stereotypes are often wrong. The practical rule: never assume from the label — learn the specific person. As the saying goes, if you\'ve met one autistic person, you\'ve met one autistic person.',
                            '**Sensory sensitivities: the world turned up too loud**',
                            'For many autistic people, the senses are turned up high. Bright or fluorescent lights, loud or sudden noises, certain textures of clothing or food, strong smells, and especially unexpected touch can be not just annoying but genuinely overwhelming or painful. Imagine ordinary hospital lighting and noise feeling like an assault. This is hugely important in care, where touch, sound, and light are everywhere — and where a small adjustment, like warning before touch or dimming a light, can change everything for the resident.',
                            '**Routine, predictability, and change**',
                            'Many autistic people rely on routine and predictability to feel safe and regulated, and find unexpected change genuinely distressing — not out of stubbornness, but because predictability is how their nervous system stays settled. A care setting, full of new people, new schedules, and constant change, can be deeply unsettling. Keeping routines consistent, preparing the person for changes in advance, and respecting their need for sameness aren\'t indulgences — they\'re real care that prevents real distress.',
                            '**Communication differences**',
                            'Autistic people communicate in varied ways. Some are highly verbal but may take language literally, miss social subtext, or speak bluntly and honestly. Some speak little, or not at all, and communicate through devices, gestures, writing, or behavior. Many find eye contact uncomfortable or even painful — and forcing it is unkind and unhelpful. Misreading these differences as confusion, rudeness, or non-cooperation does harm. Clear, direct, patient communication — and accepting the person\'s own way of communicating — is the goal.',
                            '**Meltdowns and shutdowns: overwhelm, not misbehavior**',
                            'When an autistic person is overwhelmed — by sensory overload, change, stress, or too many demands — the nervous system can hit its limit. This may come out as a meltdown: crying, shouting, visible distress, sometimes movement the person can\'t fully control. Or as a shutdown: going quiet, withdrawn, frozen, unable to speak or respond. Both are NOT tantrums, manipulation, defiance, or "bad behavior" — they are genuine overwhelm, and the person isn\'t fully in control. Understanding this changes everything: the response is calm, space, and reducing overwhelm — never punishment, force, or demands.',
                            '**The guiding principle: meet the person where they are**',
                            'Here\'s the principle that organizes everything: adjust the care to fit the autistic person, rather than forcing the person to fit the care. Reduce sensory overload, keep routines predictable, communicate clearly, allow stimming, don\'t demand eye contact or neurotypical behavior, prepare them for change, and respond to distress with calm. And above all, learn each individual — their specific sensitivities, routines, communication, comforts, and triggers. Meeting the person where they are, instead of demanding they mask and conform, is respectful, effective care.',
                          ].join('\n\n'),
                        },
            {
                          id: 'aut-s04-principle-callout',
                          type: 'callout',
                          variant: 'clinical',
                          title: 'Meet the person where they are',
                          body: 'Meltdown/shutdown = OVERWHELM, not misbehavior. Respond with calm and space, NEVER punishment. Adjust care to fit the person — don\'t force them to fit the care.',
                        },
          ]),
      },
    ],
  },
  {
    slug: 'module-2',
    title: 'Recognition, Accommodation, and CNA Role',
    sortOrder: 1,
    lessons: [
      {
        slug: 's05-signs',
        title: 'Signs & Symptoms',
        sortOrder: 0,
        buildContent: () =>
          doc('Signs & Symptoms', [
            { id: 'aut-s05-heading', type: 'heading', level: 1, text: 'Signs & Symptoms' },
            {
              id: 'aut-s05-image',
              type: 'image',
              src: `${ASSET_BASE}/s05-hero.png`,
              caption:
                'Recognizing individual needs — every autistic person is different.',
            },
            {
                          id: 'aut-s05-narration',
                          type: 'text',
                          body: [
                            'Recognizing autistic traits — even in an undiagnosed resident — lets you give care that fits. Remember, these aren\'t symptoms of illness; they\'re a person\'s way of being, and recognizing them is about support, not diagnosis. Let\'s learn the patterns.',
                            '**Recognizing autistic traits in adults**',
                            'In an adult, especially an undiagnosed older one, autistic traits might include: a strong need for routine, sameness, and order, with distress at change. Intense focus on specific interests, sometimes with deep expertise. Social differences — preferring solitude, finding socializing draining, missing or not using typical social cues, or being very direct and literal. Sensory sensitivities — strong reactions to lights, noise, textures, or touch. Repetitive movements or behaviors that soothe them. And a lifelong history of being seen as "different," "eccentric," or "a loner." You\'re not diagnosing — you\'re recognizing patterns that tell you how to support this person.',
                            '**Recognizing sensory and routine needs**',
                            'Watch for the sensory and routine signals that shape care. Sensory: covering ears at noise, squinting or distress in bright light, refusing certain food textures or clothing, strong reactions to smells, and pulling away or distress at unexpected touch. Routine: distress when schedules change, insistence on things being done a particular way or order, comfort objects and rituals, and upset at new people or environments. These aren\'t fussiness — they\'re real needs. Noticing them lets you reduce the overwhelm and protect the predictability this resident depends on.',
                            '**Recognizing communication differences**',
                            'Notice how the person communicates, and meet them there. Some are very verbal but literal — they may take what you say exactly, miss hints or sarcasm, or answer with blunt honesty. Some speak little or use devices, writing, gestures, or behavior to communicate. Many avoid eye contact, which is fine and should never be forced. Some need extra time to process and respond. Don\'t mistake these for confusion, rudeness, or refusal. Learn each resident\'s communication style, be clear and direct, give them time, and accept their way of communicating as valid.',
                            '**Recognizing distress: meltdown and shutdown**',
                            'Recognize overwhelm before and as it happens. Building signs: rising agitation, increased stimming, covering ears or eyes, pacing, repeating phrases, looking distressed or trapped. A meltdown: crying, shouting, visible loss of control, sometimes movement they can\'t stop. A shutdown: going silent, withdrawn, frozen, unresponsive, unable to speak. Critically, recognize these for what they are — overwhelm, not tantrums or defiance — and recognize the triggers that led there: too much noise, light, touch, change, demand, or stress. Knowing the early signs lets you reduce overwhelm before a full meltdown or shutdown, and knowing the triggers lets you prevent the next one.',
                            '**Summary**',
                            'Four pictures. Traits: routine, intense interests, social and sensory differences, a life of being "different" — recognized for support, not diagnosis. Sensory/routine needs: reactions to light, sound, texture, touch; distress at change — real needs to accommodate. Communication: literal, minimally speaking, or device-using; eye-contact discomfort — met, not misread. Distress: meltdown (outward) and shutdown (inward) are overwhelm, not misbehavior — know the early signs and triggers.',
                            'The rule underneath it all: recognize autistic traits to inform care not to diagnose; treat sensory and routine needs as real; meet each person\'s communication style; and read distress as overwhelm, watching for the triggers.',
                          ].join('\n\n'),
                        },
            {
                          id: 'aut-s05-distress-callout',
                          type: 'callout',
                          variant: 'warning',
                          title: 'Meltdown and shutdown',
                          body: 'Overwhelm, not tantrums or defiance. Stay calm, reduce stimulation, give space, allow stimming, and never crowd, grab, restrain, or punish.',
                        },
          ]),
      },
      {
        slug: 's06-causes',
        title: 'Causes',
        sortOrder: 1,
        buildContent: () =>
          doc('Causes', [
            { id: 'aut-s06-heading', type: 'heading', level: 1, text: 'Causes' },
            pendingAudio(
              'aut-s06-audio',
              'Understanding Autism: What It Is, What It Isn\'t, and Why Elders Were Missed',
              `${ASSET_BASE}/s06-causes-podcast.mp3`,
              [
                'Understanding Autism: What It Is, What It Isn\'t, and Why Elders Were Missed',
                '',
                'To support autistic residents well, it helps to understand what autism actually is — and to clear away the myths that cause harm.',
                '',
                'Autism is a lifelong neurodevelopmental difference. It\'s part of how a person\'s brain developed, present from birth, shaping how they experience and interact with the world throughout their whole life. It is strongly influenced by genetics and natural variation in brain development — it is simply part of the diversity of how human brains are built. Importantly, it is not caused by anything a person or their parents did wrong, not caused by upbringing, and — to name and dismiss a damaging, thoroughly discredited myth — not caused by vaccines. Autism is also not an illness, not a mental health disorder in the sense of something that comes and goes, and not something that can be or should be "cured." An autistic person is autistic for life, and that\'s not a tragedy to fix — it\'s an identity and a way of being to respect and accommodate.',
                '',
                'What autism is, in lived terms, is a different operating system: different sensory processing, different communication, a different relationship to routine and change, different social experience, and often distinctive strengths alongside the challenges. The challenges are real — sensory overload, difficulty with change, communication barriers, social exhaustion — and so are the strengths: deep focus, honesty, reliability, expertise, pattern-thinking, loyalty. Neither the challenges nor the strengths make an autistic person less of a full human being deserving of respectful care.',
                '',
                'Why are so many older autistic adults undiagnosed? Because the understanding simply didn\'t exist when they grew up. For most of the twentieth century, autism was either unrecognized or understood only in its most visible forms; subtler presentations, and autism in people who could mask or speak well, went unnamed. So today\'s autistic elders lived entire lives without a framework for who they were — frequently misunderstood, mislabeled as "odd" or "difficult" or "antisocial," sometimes misdiagnosed with other conditions, and often pressured to hide their differences. Many became lifelong maskers, paying a heavy cost in exhaustion and stress to appear "normal." Some, sadly, also carry trauma from a lifetime of not fitting and being treated as wrong.',
                '',
                'Here\'s what it all means for the CNA. You don\'t need a diagnosis to provide good care — recognizing the patterns and responding to the individual\'s actual needs is what matters. You can\'t and shouldn\'t try to change or cure who a resident is. What you can do is accommodate and respect: reduce sensory overload, protect routine, communicate in ways that work for them, allow stimming, never force masking or neurotypical behavior, and respond to distress with understanding. And you can offer something many autistic elders rarely had — to be accepted exactly as they are. The takeaway: autism is a natural, lifelong difference, not a fault or a sickness; older autistic adults were missed by their era, not by their own failing; and the right care is accommodation, respect, and acceptance.',
              ].join('\n'),
              '/assets/courses/autism-in-adults/s06-causes-podcast.mp3',
            ),
            {
              id: 'aut-s06-image',
              type: 'image',
              src: `${ASSET_BASE}/s06-hero.png`,
              caption:
                'Sensory sensitivities and stimming — self-regulation, not behavior to correct.',
            },
          ]),
      },
      {
        slug: 's07-role',
        title: 'CNA Role & Best Practices',
        sortOrder: 2,
        buildContent: () =>
          doc('CNA Role & Best Practices', [
            { id: 'aut-s07-heading', type: 'heading', level: 1, text: 'CNA Role & Best Practices' },
            {
              id: 'aut-s07-image',
              type: 'image',
              src: `${ASSET_BASE}/s07-hero.png`,
              caption:
                'Your scope — support, adapt, and report; respect the person as they are.',
            },
            {
                          id: 'aut-s07-scope-callout',
                          type: 'callout',
                          variant: 'clinical',
                          title: 'Scope of practice',
                          body: 'CNAs ACCOMMODATE, COMMUNICATE, SUPPORT, and ACCEPT. CNAs never diagnose autism, try to "treat" or cure it, give or adjust medications, or force neurotypical behavior.',
                        },
            {
                          id: 'aut-s07-narration',
                          type: 'text',
                          body: [
                            'There is no "treatment" that cures autism, and none should be sought — autism isn\'t a disease. The real care is accommodation, respect, and support, and that\'s overwhelmingly the CNA\'s daily work. Let\'s walk through it, starting with the rule that never bends, stated firmly because it matters most here. A CNA does not diagnose autism, does not try to "treat," cure, or change a resident\'s autism, does not give or adjust medications, and does not force a resident to make eye contact, stop stimming, or behave "neurotypically."',
                            '**Sensory accommodation — often the biggest difference you make.** Learn and reduce the resident\'s sensory triggers. Lower harsh lighting, reduce noise, give warning before any touch and use gentle, predictable contact, respect texture preferences in clothing and food, and minimize strong smells. Allow them comfort items, quiet spaces, and the things that help them regulate. For a resident overwhelmed by ordinary care-setting input, these adjustments can transform their entire experience — and they cost almost nothing.',
                            '**Routine and predictability — protect them.** Keep routines as consistent as possible — same order, same way, same caregivers where you can. Prepare the resident in advance for any change, in clear simple terms. Respect their rituals and the specific ways they like things done. Don\'t spring surprises. Predictability isn\'t a luxury for an autistic resident; it\'s how their nervous system stays regulated, and protecting it prevents real distress.',
                            '**Communication — meet them where they are.** Learn each resident\'s communication style and adapt to it. Be clear, direct, and literal — avoid sarcasm, vague hints, and figures of speech that may be taken exactly. Give extra time to process and respond. Don\'t force eye contact. Honor alternative communication — devices, writing, gestures, behavior. And never mistake their communication differences for confusion, rudeness, or refusal. Good communication is accommodation, not correction.',
                            '**Responding to meltdown and shutdown — calm, not control.** When a resident is overwhelmed: stay calm and reduce the overwhelm — lower light, noise, and demands, and give space. Don\'t crowd, grab, restrain, punish, or pile on words and demands. Keep them and yourself safe. Allow stimming, which helps them self-regulate. Be patient and quiet, and let it pass — recovery takes time, especially from a shutdown. Afterward, note what triggered it so it can be prevented next time. Calm and space, never force, is the entire response.',
                            '**Allowing stimming and authentic self — and supporting health.** Let the resident stim and be themselves; never suppress harmless self-regulation or demand masking, which is exhausting and harmful. Support any co-occurring conditions — anxiety, depression, or others — as the team directs, and the medications the nurse administers for those, reporting changes. And provide all physical care with the sensory, routine, and communication accommodations above.',
                            'The scope point for this section: you never diagnose, cure, medicate, or force neurotypical behavior — but you accommodate sensory and routine needs, communicate on the resident\'s terms, respond to distress with calm, allow authentic self-regulation, and report. Accommodation and acceptance are the care you deliver.',
                          ].join('\n\n'),
                        },
          ]),
      },
      {
        slug: 's08-prevention',
        title: 'Prevention & Risk Reduction',
        sortOrder: 3,
        buildContent: () =>
          doc('Prevention & Risk Reduction', [
            { id: 'aut-s08-heading', type: 'heading', level: 1, text: 'Prevention & Risk Reduction' },
            {
              id: 'aut-s08-image',
              type: 'image',
              src: `${ASSET_BASE}/s08-hero.png`,
              caption:
                'Supporting autistic residents — predictable routines, clear communication, and patience.',
            },
            {
                          id: 'aut-s08-narration',
                          type: 'text',
                          body: [
                            'With autistic residents, prevention means preventing avoidable distress and supporting wellbeing — by fitting care to the person. Here are seven ways.',
                            '**One. Learn the individual deeply.** The foundation of everything: learn this specific resident\'s sensory triggers, routines, communication style, comforts, interests, and signs of distress. Read the care plan, ask the resident and family, and observe. The better you know the individual, the better you prevent overwhelm and provide care that fits. Never rely on stereotypes — learn the person.',
                            '**Two. Reduce sensory overload before it builds.** Proactively manage the sensory environment: soften harsh lighting, reduce noise, warn before touch, respect texture and smell sensitivities, and provide quiet, low-stimulation spaces and comfort items. Preventing sensory overload prevents much of the distress autistic residents experience in care settings. Small adjustments, big difference.',
                            '**Three. Protect routine and prepare for change.** Keep routines consistent and predictable, and when change is unavoidable, prepare the resident in advance, clearly and calmly. Most distress from change comes from surprise; preparation and consistency prevent it. Guard their routines as the regulation tool they are.',
                            '**Four. Communicate clearly and patiently — every time.** Use clear, direct, literal language, give time to process, never force eye contact, and honor the resident\'s way of communicating. Preventing miscommunication prevents frustration and distress on both sides. Patience and clarity are daily prevention.',
                            '**Five. Watch for early signs of overwhelm — and act.** Learn this resident\'s building signs — increased stimming, covering ears, agitation, pacing, distress — and respond early by reducing the overwhelm before it becomes a meltdown or shutdown. Catching overwhelm as it rises, and easing it, prevents the full distress response. Early action is the kindest prevention.',
                            '**Six. Allow stimming and authentic self.** Let the resident stim, follow their routines and interests, and be themselves, without pressure to mask or appear "normal." Allowing authentic self-regulation prevents the exhaustion and distress that masking causes — and gives many autistic elders something they rarely had: permission to simply be who they are.',
                            '**Seven. Build trust and acceptance.** Be a consistent, accepting, respectful presence who learns and honors the resident\'s needs. Trust and acceptance, built over time, lower a resident\'s baseline stress and make care easier and kinder. For an autistic elder long misunderstood, being genuinely accepted is profound — and it prevents a great deal of distress at the root.',
                          ].join('\n\n'),
                        },
          ]),
      },
    ],
  },
  {
    slug: 'module-3',
    title: 'Action, Judgment, and Application',
    sortOrder: 2,
    lessons: [
      {
        slug: 's09-scenario',
        title: 'Scenario & Reporting',
        sortOrder: 0,
        buildContent: () =>
          doc('Scenario & Reporting', [
            { id: 'aut-s09-heading', type: 'heading', level: 1, text: 'Scenario & Reporting' },
            pendingAudio(
              'aut-s09-intro-audio',
              'Emergency response scenarios intro',
              `${ASSET_BASE}/s09-emergency-intro.mp3`,
              'With autistic residents, the judgments that matter most are responding correctly to a meltdown or shutdown, and recognizing when communication differences may be hiding a real medical problem like pain. You\'re about to work through two situations. Read each carefully, choose your action, and you\'ll get feedback right away. Keep the core ideas in mind: a meltdown is overwhelm to ease with calm and space, never punish — and a resident who communicates differently may show pain or illness in ways you have to watch for.',
              '/assets/courses/autism-in-adults/s09-emergency-intro.mp3',
            ),
            {
              id: 'aut-s09-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-hero.png`,
              caption:
                'Recognizing distress and changes — some behaviors are communication, not defiance.',
            },
            {
              id: 'aut-s09-scenario-eriksson-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-scenario-eriksson.png`,
              caption:
                'Sensory overload is not a tantrum — reduce the overwhelm, allow self-regulation, and stay calm; never force or restrain.',
            },
            {
                          id: 'aut-s09-scenario-eriksson',
                          type: 'scenario_question',
                          prompt:
                            'Mr. Eriksson, an autistic older adult, becomes increasingly overwhelmed in the busy, bright, noisy dining room — he starts rocking, covering his ears, and then crying out and becoming very distressed, unable to follow what you\'re saying. A coworker says, "He\'s having a tantrum for attention — be firm, tell him to stop it, and make him finish his meal." What SHOULD the CNA do?',
                          options: [
                            {
                              id: 'be-firm',
                              label: 'Be firm, tell him to stop, and make him finish his meal',
                              feedback:
                                'Mr. Eriksson is having a meltdown from sensory overload — not a tantrum and not in his control. Being "firm," demanding he finish, restraining him, or abandoning him in the loud room all deepen the overwhelm. The right response: calmly reduce the overwhelm — quieter, dimmer space, fewer demands, space — allow his stimming, and let him recover, then note the trigger.',
                            },
                            {
                              id: 'reduce-overwhelm',
                              label:
                                'Recognize a meltdown from sensory overload — calmly reduce the overwhelm (move him somewhere quieter and dimmer, lower demands, give space), allow his stimming, and let him recover',
                              feedback:
                                'Right. This is a meltdown caused by sensory overload — the bright, loud, busy dining room pushed Mr. Eriksson\'s nervous system past its limit. It is NOT a tantrum, not manipulation, and not for attention, and he isn\'t in full control; treating it as misbehavior to be "firm" with would be both wrong and cruel, and would deepen the overwhelm. The right response is to reduce the overwhelm: calmly help him to a quieter, dimmer space if you can, lower the noise and demands around him, stop pressing him about the meal, and give him room. Allow his rocking and ear-covering — that stimming is helping him cope, not something to stop. Stay calm yourself, don\'t crowd, grab, restrain, or pile on words, and let him recover at his own pace. Afterward, note the trigger — the overwhelming dining room — so it can be prevented next time, perhaps by a calmer eating spot. Calm, space, reduced overwhelm, allowed stimming: that\'s exactly how a meltdown is met.',
                              isRecommended: true,
                            },
                            {
                              id: 'restrain',
                              label: 'Restrain him to keep him calm',
                              feedback:
                                'Mr. Eriksson is having a meltdown from sensory overload — not a tantrum and not in his control. Being "firm," demanding he finish, restraining him, or abandoning him in the loud room all deepen the overwhelm. The right response: calmly reduce the overwhelm — quieter, dimmer space, fewer demands, space — allow his stimming, and let him recover, then note the trigger.',
                            },
                            {
                              id: 'leave-alone',
                              label: 'Leave him alone in the loud dining room to "ride it out"',
                              feedback:
                                'Mr. Eriksson is having a meltdown from sensory overload — not a tantrum and not in his control. Being "firm," demanding he finish, restraining him, or abandoning him in the loud room all deepen the overwhelm. The right response: calmly reduce the overwhelm — quieter, dimmer space, fewer demands, space — allow his stimming, and let him recover, then note the trigger.',
                            },
                          ],
                          requiredForCompletion: true,
                        },
            {
              id: 'aut-s09-scenario-donati-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-scenario-donati.png`,
              caption:
                'A change in behavior can be how a resident communicates pain — take it seriously and report it, never dismiss it.',
            },
            {
                          id: 'aut-s09-scenario-donati',
                          type: 'scenario_question',
                          prompt:
                            'Ms. Donati, an autistic resident who speaks very little, has been different for two days: more agitated than usual, rocking much more, guarding her abdomen, not eating, and pulling away when that area is touched — though she hasn\'t said she\'s in pain. A coworker says, "She\'s just being autistic and difficult — that\'s how she is, don\'t read into it." What SHOULD the CNA do?',
                          options: [
                            {
                              id: 'assume-normal',
                              label: 'Assume it\'s "just how she is" and not report it',
                              feedback:
                                'A change from baseline — more agitation and rocking, guarding the abdomen, not eating, pulling away from touch — in a resident who speaks little may be how she communicates pain or illness. "Just being autistic and difficult" is exactly how real medical problems get missed in people who communicate differently. The right action: report the changes promptly for assessment; her behavior change is the communication.',
                            },
                            {
                              id: 'report-changes',
                              label:
                                'Recognize that these changes from her baseline may signal pain or illness she communicates differently, and report them promptly for assessment',
                              feedback:
                                'Right. This is a crucial point in autism care: a resident who communicates differently — especially one who speaks little — may show pain or illness through changes in behavior rather than words. Ms. Donati\'s clear change from her baseline — much more agitation and rocking, guarding her abdomen, not eating, pulling away from touch there — is very possibly her way of communicating pain or a medical problem. Dismissing it as "just being autistic and difficult" is exactly the dangerous trap that lets real illness go missed in people who communicate differently; her behavior changes ARE the communication. Don\'t demand she explain in words she may not have, and don\'t wait. Report the changes promptly and specifically — the increased agitation and stimming, the abdominal guarding, the not eating, the pulling away from touch — so she can be assessed for a medical cause. Knowing each resident\'s baseline, and treating changes from it as meaningful communication, is how you protect a resident who can\'t simply tell you what\'s wrong.',
                              isRecommended: true,
                            },
                            {
                              id: 'demand-words',
                              label: 'Insist she tell you in words what\'s wrong before doing anything',
                              feedback:
                                'A change from baseline — more agitation and rocking, guarding the abdomen, not eating, pulling away from touch — in a resident who speaks little may be how she communicates pain or illness. "Just being autistic and difficult" is exactly how real medical problems get missed in people who communicate differently. The right action: report the changes promptly for assessment; her behavior change is the communication.',
                            },
                            {
                              id: 'wait-days',
                              label: 'Wait several days to see if it passes',
                              feedback:
                                'A change from baseline — more agitation and rocking, guarding the abdomen, not eating, pulling away from touch — in a resident who speaks little may be how she communicates pain or illness. "Just being autistic and difficult" is exactly how real medical problems get missed in people who communicate differently. The right action: report the changes promptly for assessment; her behavior change is the communication.',
                            },
                          ],
                          requiredForCompletion: true,
                        },
          ]),
      },
      {
        slug: 's10-cna-role',
        title: "CNA's Role in Care",
        sortOrder: 1,
        buildContent: () =>
          doc("CNA's Role in Care", [
            { id: 'aut-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
              id: 'aut-s10-video',
              type: 'video',
              title: 'The CNA\'s Role',
              videoUrl: '/assets/courses/autism-in-adults/s10-cna-role.mp4',
              placeholderNote: 'Pending upload: /assets/courses/autism-in-adults/s10-cna-role.mp4',
            },
            {
              id: 'aut-s10-image',
              type: 'image',
              src: `${ASSET_BASE}/s10-hero.png`,
              caption:
                'Your role — adapting to the individual, communicating clearly, and reporting changes.',
            },
            {
                          id: 'aut-s10-narration',
                          type: 'text',
                          body: [
                            'Your role with autistic residents is accommodation, respectful communication, calm support, and genuine acceptance — meeting each person where they are. Let\'s walk through it.',
                            '**Accommodate sensory and routine needs** Learn each resident\'s specific sensory triggers and routines, and accommodate them: reduce harsh light and noise, warn before touch, respect textures and smells, keep routines consistent, prepare for changes, and honor rituals and comfort items. For an autistic resident, these accommodations aren\'t extras — they\'re the core of care that prevents overwhelm and lets them feel safe. You adjust the care to fit the person.',
                            '**Communicate on their terms** Meet each resident\'s communication style. Be clear, direct, and literal; give time to process; never force eye contact; and honor alternative communication — devices, gestures, writing, behavior. Don\'t misread differences as confusion or rudeness. And know that a resident who communicates differently may show pain or illness through behavior change, so watch their baseline closely and report changes. Communication accommodation is daily, respectful care.',
                            '**Respond to distress with calm** When a resident is overwhelmed, be calm and reduce the overwhelm — lower light, noise, and demands, give space, allow stimming, and never crowd, grab, restrain, or punish. Recognize meltdowns and shutdowns as overwhelm, not misbehavior, let the resident recover at their pace, and note the trigger to prevent the next. Your calm and the space you create are the entire response.',
                            '**Accept the person fully** Offer what many autistic elders rarely received: genuine acceptance. Let them stim and be themselves, never pressuring them to mask or appear "normal." Respect their interests, their way of being, their authentic self. Build trust through consistency and acceptance. For a resident who spent a lifetime being misunderstood and told they were wrong, your simple, steady acceptance is profound care.',
                            'Now the boundary, stated plainly because it defines this role. You do not diagnose autism. You do not try to "treat," cure, or change it. You do not give or adjust medications. And you never force eye contact, never try to stop harmless stimming, never punish a meltdown or shutdown, and never demand a resident mask or behave "neurotypically."',
                            'Inside your role — sensory and routine accommodation, communication on their terms, calm support in distress, and full acceptance — you transform an autistic resident\'s experience of care from overwhelming to safe, and you give them the respect of being met exactly as they are. That is the whole of this care, and it is deeply yours.',
                          ].join('\n\n'),
                        },
            {
                          id: 'aut-s10-scope-callout',
                          type: 'callout',
                          variant: 'clinical',
                          title: 'Stay within scope',
                          body: 'You do not diagnose autism, try to "treat" or cure it, or give or adjust medications. Never force eye contact, never stop harmless stimming, and never punish a meltdown or shutdown.',
                        },
          ]),
      },
      {
        slug: 's11-case-study',
        title: 'Case Study',
        sortOrder: 2,
        buildContent: () => {
          const caseNarrative = [
            'Mr. Eriksson, 79, arrived at the facility with a reputation that preceded him in the handoff notes: "rigid," "antisocial," "difficult," "refuses to participate." He had lived alone his whole life, a retired watchmaker of extraordinary precision, never married, few friends. He hated the busy dining room, insisted his belongings stay in an exact order, wouldn\'t make eye contact, took everything staff said literally, and became deeply distressed when his routine changed. Some staff found him exasperating. His CNA, Reyna, saw something else.',
            '',
            '**What Reyna recognized:** Reyna had just completed training on autism in older adults, and Mr. Eriksson fit what she\'d learned with striking clarity: the lifelong need for routine and order, the intense focused expertise, the social difference and preference for solitude, the literal communication and avoided eye contact, the sensory distress in loud bright spaces, the lifetime of being labeled "odd" and "difficult." He had almost certainly never been diagnosed — he\'d grown up in an era with no understanding of autism — and had spent seventy-nine years being misread. Reyna didn\'t need a formal diagnosis to act. She just needed to recognize the pattern and change how she gave care.',
            '',
            '**What Reyna did differently:** She stopped treating his needs as problems and started treating them as information. She learned his routine and protected it — same order, same way, prepared him clearly in advance for any change. She respected his need for his belongings to stay exactly arranged. She communicated clearly, directly, and literally, dropped the sarcasm and vague hints that confused him, gave him time to respond, and never forced eye contact. And she addressed the sensory overload that had been triggering his worst moments: she arranged for him to eat in a quieter spot away from the chaotic dining room, softened the lighting near him where she could, and always warned him before any touch during care.',
            '',
            '**The dining-room meltdown — handled right:** Early on, before the quieter arrangement, Mr. Eriksson had a meltdown in the loud, bright dining room — rocking, covering his ears, crying out, overwhelmed past his limit. A coworker called it a tantrum and wanted to be "firm." Reyna knew better. She calmly helped him to a quiet space, lowered the demands and noise, gave him room, let him rock to self-soothe without interference, and waited with quiet patience until he recovered. Then she noted the trigger — the dining room — which led to the permanent quieter-eating arrangement that prevented it from happening again. She never punished, never forced, never crowded him.',
            '',
            '**The transformation:** With his sensory needs accommodated, his routine protected, his communication met, and himself simply accepted, Mr. Eriksson changed — or rather, stopped having to fight an environment that overwhelmed him. The "difficult" behavior largely faded, because the things causing it were removed. He grew calmer, more settled, even warmer in his own quiet way. He began showing Reyna the workings of an old watch, lighting up explaining the tiny gears — sharing the expertise of a lifetime with someone who\'d made it safe to be himself. He told her once, in his direct way: "You\'re the first one who didn\'t try to make me be different. You just let me be."',
            '',
            '**The outcome:** Mr. Eriksson lived far more comfortably and was, for perhaps the first time in an institution, understood. And nothing about who he was had been changed or cured — the care around him had simply been adjusted to fit him. The nurse reflected it back to Reyna: "Everyone before you tried to make him fit the routine and called him difficult when he couldn\'t. You fit the care to him, and the \'difficult\' man disappeared — because he was never difficult. He was autistic in a place that hadn\'t understood that. You understood it."',
            '',
            '**Discussion:** Reyna\'s case is the whole course made real. She recognized lifelong autistic traits in an undiagnosed elder and used that recognition to inform care, not to label him. She fit the care to the person — protecting routine, accommodating sensory needs, communicating on his terms, and accepting him as he was — rather than forcing him to fit the care and calling him "difficult" when he couldn\'t. She handled his meltdown as the overwhelm it was, with calm and space, never punishment, and removed the trigger. And she stayed in scope throughout: she didn\'t diagnose, didn\'t try to cure or change him, didn\'t medicate — she accommodated, respected, and accepted. Meet the person where they are: that is how a "difficult" man became simply a man, understood at last.',
          ].join('\n');

          return doc('Brief Case Study', [
            { id: 'aut-s11-heading', type: 'heading', level: 1, text: 'Brief Case Study' },
            pendingAudio(
              'aut-s11-audio',
              'The Man They Called Difficult',
              `${ASSET_BASE}/s11-case-podcast.mp3`,
              caseNarrative,
              '/assets/courses/autism-in-adults/s11-case-podcast.mp3',
            ),
            {
              id: 'aut-s11-image',
              type: 'image',
              src: `${ASSET_BASE}/s11-hero.png`,
              caption:
                'Putting it together — respectful, person-centered support for autistic residents.',
            },
            {
                          id: 'aut-s11-case-study',
                          type: 'case_study',
                          title: 'The Man They Called Difficult',
                          residentProfile:
                            'Mr. Eriksson, 79, arrived at the facility with a reputation that preceded him in the handoff notes: "rigid," "antisocial," "difficult," "refuses to participate." He had lived alone his whole life, a retired watchmaker of extraordinary precision, never married, few friends. He hated the busy dining room, insisted his belongings stay in an exact order, wouldn\'t make eye contact, took everything staff said literally, and became deeply distressed when his routine changed. Some staff found him exasperating. His CNA, Reyna, saw something else.',
                          scenario: [
                            '**What Reyna recognized:** Reyna had just completed training on autism in older adults, and Mr. Eriksson fit what she\'d learned with striking clarity: the lifelong need for routine and order, the intense focused expertise, the social difference and preference for solitude, the literal communication and avoided eye contact, the sensory distress in loud bright spaces, the lifetime of being labeled "odd" and "difficult." He had almost certainly never been diagnosed — he\'d grown up in an era with no understanding of autism — and had spent seventy-nine years being misread. Reyna didn\'t need a formal diagnosis to act. She just needed to recognize the pattern and change how she gave care.',
                            '**What Reyna did differently:** She stopped treating his needs as problems and started treating them as information. She learned his routine and protected it — same order, same way, prepared him clearly in advance for any change. She respected his need for his belongings to stay exactly arranged. She communicated clearly, directly, and literally, dropped the sarcasm and vague hints that confused him, gave him time to respond, and never forced eye contact. And she addressed the sensory overload that had been triggering his worst moments: she arranged for him to eat in a quieter spot away from the chaotic dining room, softened the lighting near him where she could, and always warned him before any touch during care.',
                            '**The dining-room meltdown — handled right:** Early on, before the quieter arrangement, Mr. Eriksson had a meltdown in the loud, bright dining room — rocking, covering his ears, crying out, overwhelmed past his limit. A coworker called it a tantrum and wanted to be "firm." Reyna knew better. She calmly helped him to a quiet space, lowered the demands and noise, gave him room, let him rock to self-soothe without interference, and waited with quiet patience until he recovered. Then she noted the trigger — the dining room — which led to the permanent quieter-eating arrangement that prevented it from happening again. She never punished, never forced, never crowded him.',
                            '**The transformation:** With his sensory needs accommodated, his routine protected, his communication met, and himself simply accepted, Mr. Eriksson changed — or rather, stopped having to fight an environment that overwhelmed him. The "difficult" behavior largely faded, because the things causing it were removed. He grew calmer, more settled, even warmer in his own quiet way. He began showing Reyna the workings of an old watch, lighting up explaining the tiny gears — sharing the expertise of a lifetime with someone who\'d made it safe to be himself. He told her once, in his direct way: "You\'re the first one who didn\'t try to make me be different. You just let me be."',
                            '**The outcome:** Mr. Eriksson lived far more comfortably and was, for perhaps the first time in an institution, understood. And nothing about who he was had been changed or cured — the care around him had simply been adjusted to fit him. The nurse reflected it back to Reyna: "Everyone before you tried to make him fit the routine and called him difficult when he couldn\'t. You fit the care to him, and the \'difficult\' man disappeared — because he was never difficult. He was autistic in a place that hadn\'t understood that. You understood it."',
                            '**Discussion:** Reyna\'s case is the whole course made real. She recognized lifelong autistic traits in an undiagnosed elder and used that recognition to inform care, not to label him. She fit the care to the person — protecting routine, accommodating sensory needs, communicating on his terms, and accepting him as he was — rather than forcing him to fit the care and calling him "difficult" when he couldn\'t. She handled his meltdown as the overwhelm it was, with calm and space, never punishment, and removed the trigger. And she stayed in scope throughout: she didn\'t diagnose, didn\'t try to cure or change him, didn\'t medicate — she accommodated, respected, and accepted. Meet the person where they are: that is how a "difficult" man became simply a man, understood at last.',
                          ].join('\n\n'),
                        },
            {
                          id: 'aut-s11-reflection-1',
                          type: 'reflection',
                          prompt:
                            'Mr. Eriksson was labeled "difficult" and "antisocial." What did Reyna recognize his traits to actually be, and how did fitting the care to him — rather than forcing him to fit the care — change everything?',
                          minCharacters: 50,
                        },
            {
                          id: 'aut-s11-reflection-2',
                          type: 'reflection',
                          prompt:
                            'During his dining-room meltdown, a coworker wanted to be "firm" and treat it as a tantrum. Why was Reyna\'s calm, space-giving response correct, and why is recognizing a meltdown as overwhelm rather than misbehavior so important?',
                          minCharacters: 50,
                        },
            {
                          id: 'aut-s11-rp-text',
                          type: 'text',
                          body: 'Reflect on the case study in the previous lesson. Your written responses help you apply what you learned about recognizing autism in undiagnosed elders, accommodating sensory and routine needs, responding to meltdowns with calm and space, and accepting the person as they are.',
                        },
            {
                          id: 'aut-s11-kc2-check',
                          type: 'knowledge_check',
                          question:
                            'A CNA does not diagnose autism, does not try to "treat," cure, or change a resident\'s autism, does not give or adjust medications, and does not force a resident to make eye contact, stop stimming, or behave "neurotypically." Mr. Eriksson, an autistic older adult, becomes increasingly overwhelmed in the busy, bright, noisy dining room — he starts rocking, covering his ears, and then crying out and becoming very distressed, unable to follow what you\'re saying. A coworker says, "He\'s having a tantrum for attention — be firm, tell him to stop it, and make him finish his meal." What SHOULD the CNA do?',
                          options: [
                            {
                              id: 'be-firm',
                              label: 'Be firm, tell him to stop, and make him finish his meal',
                            },
                            {
                              id: 'reduce-overwhelm',
                              label:
                                'Recognize a meltdown from sensory overload — calmly reduce the overwhelm (move him somewhere quieter and dimmer, lower demands, give space), allow his stimming, and let him recover',
                            },
                            {
                              id: 'restrain',
                              label: 'Restrain him to keep him calm',
                            },
                            {
                              id: 'leave-alone',
                              label: 'Leave him alone in the loud dining room to "ride it out"',
                            },
                          ],
                          correctOptionId: 'reduce-overwhelm',
                          explanation:
                            'You never diagnose, cure, medicate, or force neurotypical behavior — but your calm reduction of overwhelm, space-giving, and allowed stimming during a meltdown are exactly the accommodation that helps an autistic resident recover safely.',
                          requiredForCompletion: true,
                          meta: { flaggedFiller: true },
                        },
          ]);
        },
      },
      {
        slug: 's12-conclusion',
        title: 'Conclusion',
        sortOrder: 3,
        buildContent: () =>
          doc('Conclusion', [
            { id: 'aut-s12-heading', type: 'heading', level: 1, text: 'Conclusion' },
            {
              id: 'aut-s12-video',
              type: 'video',
              title: 'Conclusion',
              videoUrl: '/assets/courses/autism-in-adults/s12-conclusion.mp4',
              placeholderNote: 'Pending upload: /assets/courses/autism-in-adults/s12-conclusion.mp4',
            },
            {
              id: 'aut-s12-image',
              type: 'image',
              src: `${ASSET_BASE}/s12-hero.png`,
              caption:
                'Caring with respect — meeting each resident where they are.',
            },
            {
                          id: 'aut-s12-narration',
                          type: 'text',
                          body: [
                            'You\'ve reached the end — and you\'ve completed the mental health series. Let\'s lock in the five things that matter most for supporting autistic adults and older adults.',
                            '**One.** Autism is a lifelong neurodevelopmental difference — not an illness, not a disease, and not something to cure. It\'s a different way of being human, with real challenges and real strengths. Autistic people vary enormously, so every autistic resident is an individual to learn, never a stereotype. And many autistic older adults were never diagnosed — long misread as "odd" or "difficult."',
                            '**Two.** Sensory and routine needs are real and central. Bright lights, loud noises, certain textures, smells, and unexpected touch can be overwhelming or painful; sudden change can cause genuine distress. Reduce sensory overload, warn before touch, keep routines predictable, and prepare residents for change. These accommodations cost little and transform their experience.',
                            '**Three.** Meet each person\'s communication on their terms. Some are literal and verbal, some speak little or use other means, many find eye contact uncomfortable — never force it. Be clear, direct, and patient, honor their way of communicating, and never misread differences as confusion or rudeness. And remember: a resident who communicates differently may show pain or illness through behavior change — watch their baseline and report changes.',
                            '**Four.** Respond to meltdowns and shutdowns as overwhelm, never misbehavior. They\'re a nervous system past its limit, not tantrums or defiance. Stay calm, reduce the overwhelm — light, noise, demands — give space, allow stimming, and never crowd, grab, restrain, or punish. Let the person recover, and note the trigger to prevent the next.',
                            '**Five.** Honor your scope, and meet the person where they are. You never diagnose, cure, change, or medicate autism, and never force eye contact, stop harmless stimming, or demand a resident mask. But you accommodate, communicate respectfully, respond to distress with calm, and accept the person fully. Adjust the care to fit the person — and give an autistic elder the acceptance they may have waited a lifetime for.',
                          ].join('\n\n'),
                        },
            {
                          id: 'aut-s12-summary',
                          type: 'summary',
                          title: 'Five things that matter most',
                          items: [
                            'Autism is a lifelong difference — not an illness to cure; many older adults were never diagnosed.',
                            'Sensory and routine needs are real — reduce overload, warn before touch, keep routines predictable.',
                            'Meet communication on their terms — clear, direct, patient; never force eye contact.',
                            'Meltdown/shutdown = overwhelm — stay calm, reduce stimulation, give space, allow stimming.',
                            'Honor your scope — accommodate, communicate, respond with calm, and accept the person fully.',
                          ],
                        },
            {
                          id: 'aut-s12-whn-text',
                          type: 'text',
                          body: 'Ten questions are waiting. Everything on them was covered here. You\'re ready. Trust what you\'ve learned, and show what you know.',
                        },
            {
                          id: 'aut-s12-cr-text',
                          type: 'text',
                          body: 'This course provides one hour of continuing education credit through CAL ACE Nursing Academy, an approved CDPH continuing education provider, NAC number 7384. Your certificate is generated automatically when you pass the knowledge check.',
                        },
            {
                          id: 'aut-s12-cr-callout',
                          type: 'callout',
                          variant: 'info',
                          title: 'Scope reminder',
                          body: 'CNAs accommodate, communicate, support, and accept. CNAs do not diagnose autism, try to "treat" or cure it, give or adjust medications, or force neurotypical behavior.',
                        },
            {
                          id: 'aut-s12-ca-text',
                          type: 'text',
                          body: 'Your certificate is generated automatically when you pass the knowledge check. CDPH-Approved CE Provider — NAC #7384.',
                        },
          ]),
      },
    ],
  },
];

function validatePackageSectionMapping(): void {
  const allLessonSlugs = new Set(
    MODULES.flatMap((moduleSeed) => moduleSeed.lessons.map((lesson) => lesson.slug)),
  );
  for (const slug of PACKAGE_SECTION_LESSON_SLUGS) {
    if (!allLessonSlugs.has(slug)) {
      throw new Error(`Package section lesson slug missing: ${slug}`);
    }
  }
  if (PACKAGE_SECTION_LESSON_SLUGS.length !== 12) {
    throw new Error(`Expected 12 package sections, found ${PACKAGE_SECTION_LESSON_SLUGS.length}`);
  }
}

export async function seedCourse47AutismAdults(
  prisma: PrismaClient,
  options?: { tenantSlug?: string },
): Promise<{
  courseCreated: boolean;
  modulesUpserted: number;
  lessonsUpserted: number;
  strayLessonsDeleted: number;
}> {
  validatePackageSectionMapping();

  const tenantSlug = options?.tenantSlug ?? TENANT_SLUG;

  const tenant = await prisma.tenant.findFirst({
    where: { slug: tenantSlug, deletedAt: null },
  });
  if (!tenant) {
    throw new Error(`Tenant "${tenantSlug}" not found. Run db:seed first.`);
  }

  const category = await prisma.courseCategory.findFirst({
    where: { tenantId: tenant.id, slug: CATEGORY_SLUG, deletedAt: null },
  });
  if (!category) {
    throw new Error(
      `Category "${CATEGORY_SLUG}" not found for tenant "${tenantSlug}". Run db:seed first.`,
    );
  }

  const profession = await prisma.profession.findFirst({
    where: { code: PROFESSION_CODE },
  });

  const ceHours = DEFAULT_LAUNCH_CEU_HOURS;
  const catalogData = mergeLaunchCatalogData(DEFAULT_CATALOG, ceHours);
  const contentMeta = DEFAULT_CONTENT_META;

  const existing = await prisma.course.findFirst({
    where: { tenantId: tenant.id, slug: COURSE_SLUG },
  });

  const course = await prisma.course.upsert({
    where: {
      tenantId_slug: { tenantId: tenant.id, slug: COURSE_SLUG },
    },
    create: {
      tenantId: tenant.id,
      categoryId: category.id,
      professionId: profession?.id,
      slug: COURSE_SLUG,
      title: COURSE_TITLE,
      summary: COURSE_SUMMARY,
      status: CourseStatus.DRAFT,
      ceHours,
      catalogData: catalogData as Prisma.InputJsonValue,
    },
    update: {
      categoryId: category.id,
      professionId: profession?.id,
      title: COURSE_TITLE,
      summary: COURSE_SUMMARY,
      status: CourseStatus.DRAFT,
      ceHours,
      catalogData: catalogData as Prisma.InputJsonValue,
      deletedAt: null,
    },
  });

  const version = await prisma.courseVersion.upsert({
    where: {
      courseId_versionNumber: { courseId: course.id, versionNumber: 1 },
    },
    create: {
      courseId: course.id,
      versionNumber: 1,
      label: 'Initial release',
      status: CourseVersionStatus.DRAFT,
      deliveryMode: DeliveryMode.ONLINE,
      ceHours,
      publishedAt: null,
      contentMeta: contentMeta as Prisma.InputJsonValue,
    },
    update: {
      label: 'Initial release',
      status: CourseVersionStatus.DRAFT,
      deliveryMode: DeliveryMode.ONLINE,
      ceHours,
      publishedAt: null,
      contentMeta: contentMeta as Prisma.InputJsonValue,
      deletedAt: null,
    },
  });

  let modulesUpserted = 0;
  let lessonsUpserted = 0;

  for (const moduleSeed of MODULES) {
    const module = await prisma.module.upsert({
      where: {
        courseVersionId_slug: { courseVersionId: version.id, slug: moduleSeed.slug },
      },
      create: {
        courseVersionId: version.id,
        slug: moduleSeed.slug,
        title: moduleSeed.title,
        sortOrder: moduleSeed.sortOrder,
        status: ContentPublishStatus.DRAFT,
      },
      update: {
        title: moduleSeed.title,
        sortOrder: moduleSeed.sortOrder,
        status: ContentPublishStatus.DRAFT,
        deletedAt: null,
      },
    });
    modulesUpserted += 1;

    for (const lessonSeed of moduleSeed.lessons) {
      const content = lessonSeed.buildContent();
      const durationMinutes = durationMinutesForLesson(lessonSeed.slug);

      await prisma.lesson.upsert({
        where: {
          moduleId_slug: { moduleId: module.id, slug: lessonSeed.slug },
        },
        create: {
          moduleId: module.id,
          slug: lessonSeed.slug,
          title: lessonSeed.title,
          sortOrder: lessonSeed.sortOrder,
          status: ContentPublishStatus.DRAFT,
          durationMinutes,
          content: content as unknown as Prisma.InputJsonValue,
        },
        update: {
          title: lessonSeed.title,
          sortOrder: lessonSeed.sortOrder,
          status: ContentPublishStatus.DRAFT,
          durationMinutes,
          content: content as unknown as Prisma.InputJsonValue,
          deletedAt: null,
        },
      });
      lessonsUpserted += 1;
    }
  }

  const ownedLessonKeys = new Set(
    MODULES.flatMap((m) => m.lessons.map((l) => `${m.slug}/${l.slug}`)),
  );
  let strayLessonsDeleted = 0;

  if (version.status !== CourseVersionStatus.DRAFT) {
    console.warn('Skipping stray-lesson cleanup: version is not DRAFT');
  } else {
    const activeLessons = await prisma.lesson.findMany({
      where: {
        deletedAt: null,
        module: { courseVersionId: version.id, deletedAt: null },
      },
      select: { id: true, slug: true, module: { select: { slug: true } } },
    });

    const strayLessons = activeLessons.filter(
      (lesson) => !ownedLessonKeys.has(`${lesson.module.slug}/${lesson.slug}`),
    );

    if (strayLessons.length > 0) {
      const now = new Date();
      await prisma.$transaction(
        strayLessons.map((lesson) =>
          prisma.lesson.update({
            where: { id: lesson.id },
            data: { deletedAt: now },
          }),
        ),
      );
      strayLessonsDeleted = strayLessons.length;
      console.log(
        `Stray-lesson cleanup: soft-deleted ${strayLessonsDeleted} lessons [${strayLessons.map((l) => `${l.module.slug}/${l.slug}`).join(', ')}] on version v${version.versionNumber}.`,
      );
    } else {
      console.log('Stray-lesson cleanup: none found (already clean).');
    }
  }

  return {
    courseCreated: !existing,
    modulesUpserted,
    lessonsUpserted,
    strayLessonsDeleted,
  };
}

function blockCountsByLesson(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const moduleSeed of MODULES) {
    for (const lessonSeed of moduleSeed.lessons) {
      counts[`${moduleSeed.slug}/${lessonSeed.slug}`] = lessonSeed.buildContent().blocks.length;
    }
  }
  return counts;
}

async function main() {
  const prisma = new PrismaClient();
  console.log(
    `Seeding Course 47 (Supporting Autistic Adults & Older Adults) as DRAFT — slug "${COURSE_SLUG}"…`,
  );

  try {
    const result = await seedCourse47AutismAdults(prisma);
    const blockCounts = blockCountsByLesson();
    const totalBlocks = Object.values(blockCounts).reduce((sum, count) => sum + count, 0);

    console.log('Seed complete.');
    console.log(`  Course:   ${COURSE_TITLE}`);
    console.log(`  Slug:     ${COURSE_SLUG}`);
    console.log(`  Created:  ${result.courseCreated ? 'yes (new)' : 'no (updated existing)'}`);
    console.log(`  Modules:  ${result.modulesUpserted}`);
    console.log(`  Lessons:  ${result.lessonsUpserted}`);
    console.log(`  Sections: ${PACKAGE_SECTION_LESSON_SLUGS.length} package sections mapped`);
    console.log(`  Strays cleaned: ${result.strayLessonsDeleted} lessons`);
    console.log(`  Blocks:   ${totalBlocks} total`);
    console.log(`  Status:   DRAFT (course, version, modules, lessons)`);
    console.log('  Block counts per lesson:');
    for (const [key, count] of Object.entries(blockCounts)) {
      console.log(`    ${key}: ${count} blocks`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
}
