/**
 * Seed Course 21 — Caring for a Resident with Parkinson's Disease (DRAFT).
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-21-parkinsons
 *
 * Idempotent upserts by slug. Does not seed the final quiz (pending owner approval).
 * Lesson slugs follow the 12-lesson published structure (s01-introduction … s12-conclusion).
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
const COURSE_SLUG = 'parkinsons';
const COURSE_TITLE = "Parkinson's Care: Mobility, Safety, and Daily Support";
const COURSE_SUMMARY =
  'This course teaches the CNA\'s role in supporting a resident living with Parkinson\'s disease — understanding its symptoms, supporting safe mobility and eating, the critical importance of on-time medication, and recognizing complications. CNAs do not diagnose Parkinson\'s, give or adjust medications, or perform therapy.';

const ASSET_BASE = `/assets/courses/parkinsons`;

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
    'Explain what Parkinson\'s disease is, in plain language',
    'Recognize its main symptoms and complications',
    'Support safe movement, eating, and communication',
    'Understand why medication timing is critical',
    'Know your scope — what a CNA does, and what a CNA must never do',
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
  heroImage: '/assets/courses/parkinsons/hero-banner.jpg',
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
    title: 'Understanding Parkinson\'s Disease',
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: 'Introduction',
        sortOrder: 0,
        buildContent: () =>
          doc('Introduction', [
            { id: 'park-s01-heading', type: 'heading', level: 1, text: 'Welcome' },
            {
              id: 'park-s01-video',
              type: 'video',
              title: 'Introduction',
              videoUrl: `${ASSET_BASE}/s01-intro.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s01-intro.mp4`,
            },
            {
              id: 'park-s01-image',
              type: 'image',
              src: '/assets/courses/parkinsons/s01-hero.jpg',
              caption: 'A CAL ACE CNA patiently supporting a resident living with Parkinson\'s.',
            },
            {
              id: 'park-s01-narration',
              type: 'text',
              body: [
                'Welcome to CAL ACE Nursing Academy.',
                'This course is about Parkinson\'s disease — and how to care, with skill and patience, for a resident who has it.',
                'Parkinson\'s disease is a long-term condition that affects movement. It happens when certain brain cells that help control movement slowly stop working. Over time, this leads to the signs many people recognize: a trembling or shaking, stiff muscles, slow movement, and problems with balance. But Parkinson\'s affects far more than just movement — it can change a person\'s speech, swallowing, mood, sleep, and thinking too.',
                'Here\'s something important to understand from the start. A resident with Parkinson\'s may move slowly, speak softly, show little facial expression, and need a long time to do simple tasks. None of this means their mind is slow. Inside, the person is fully present — often sharp, aware, and sometimes frustrated by a body that won\'t cooperate. Treating them with patience and respect, never rushing or talking down to them, is the foundation of good Parkinson\'s care.',
                'This course has one feature that\'s a true matter of safety: medication timing. Parkinson\'s medications must be given exactly on time — even small delays can leave a resident suddenly unable to move, swallow, or stay safe. You\'ll learn why on-time medication matters so much, and the firm scope boundary: a CNA doesn\'t give the medication, but the CNA\'s reporting and support are critical to keeping it on schedule.',
                'Your scope is clear. A CNA supports safe mobility and eating, recognizes symptoms and complications, supports on-time medication through reporting, and provides patient, dignified daily care. A CNA does not diagnose Parkinson\'s, does not give or adjust medications, and does not perform therapy.',
                'By the end of this course, you will be able to: explain what Parkinson\'s disease is, in plain language. Recognize its main symptoms and complications. Support safe movement, eating, and communication. Understand why medication timing is critical. And know your scope.',
                'There is a ten-question knowledge check at the end. Everything on it is covered here. Let\'s begin.',
              ].join('\n\n'),
            },
            {
              id: 'park-s01-course-information-text',
              type: 'text',
              body: [
                'This course teaches the CNA\'s role in supporting a resident living with Parkinson\'s disease — understanding its symptoms, supporting safe mobility and eating, the critical importance of on-time medication, and recognizing complications.',
                'Let\'s be clear about your role. A CNA supports safe mobility and eating, recognizes symptoms and complications, supports on-time medication through reporting, and provides patient, dignified daily care. A CNA does not diagnose Parkinson\'s, does not give or adjust medications, and does not perform therapy. Those are nursing and physician tasks. But none of them can happen without your careful observation and faithful reporting first.',
              ].join('\n\n'),
            },
            {
              id: 'park-s01-course-information-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of this course',
              body: 'CNAs SUPPORT, OBSERVE, and REPORT. CNAs do not diagnose Parkinson\'s, give or adjust medications, or perform therapy.',
            },
            {
              id: 'park-s01-learning-objectives-text',
              type: 'text',
              body: 'By the end of this course, you will be able to:',
            },
            {
              id: 'park-s01-learning-objectives-summary',
              type: 'summary',
              title: 'Learning objectives',
              items: [
                'Explain what Parkinson\'s disease is, in plain language.',
                'Recognize its main symptoms and complications.',
                'Support safe movement, eating, and communication.',
                'Understand why medication timing is critical.',
                'Know your scope — what a CNA does, and what a CNA must never do.',
              ],
            },
            {
              id: 'park-s01-instructor-intro-text',
              type: 'text',
              body: 'This course is presented by CAL ACE Nursing Academy — an approved CDPH continuing education provider, NAC number 7384.',
              meta: { flaggedFiller: true },
            },
          ]),
      },
      {
        slug: 's02-terms',
        title: 'Terms & Definitions',
        sortOrder: 1,
        buildContent: () =>
          doc('Terms & Definitions', [
            { id: 'park-s02-heading', type: 'heading', level: 1, text: 'Key terms' },
            {
              id: 'park-s02-image',
              type: 'image',
              src: '/assets/courses/parkinsons/s02-hero.jpg',
              caption: 'The language of Parkinson\'s — tremor, rigidity, bradykinesia, freezing, on-off.',
            },
            {
              id: 'park-s02-reveal-parkinsons',
              type: 'reveal_card',
              frontTitle: 'Parkinson\'s Disease',
              frontBody: 'PAR-kin-sunz',
              backTitle: 'Parkinson\'s Disease',
              backBody:
                'A long-term brain condition that slowly affects movement and other functions. It happens when brain cells that make a chemical called dopamine stop working. There\'s no cure yet, but symptoms can be managed, often for many years.',
            },
            {
              id: 'park-s02-reveal-dopamine',
              type: 'reveal_card',
              frontTitle: 'Dopamine',
              frontBody: 'DOPE-uh-meen',
              backTitle: 'Dopamine',
              backBody:
                'A chemical messenger in the brain that helps control smooth, coordinated movement. In Parkinson\'s, the brain makes less and less dopamine. Most Parkinson\'s medications work by replacing or boosting dopamine — which is why timing matters so much.',
            },
            {
              id: 'park-s02-reveal-tremor',
              type: 'reveal_card',
              frontTitle: 'Tremor',
              frontBody: 'TREH-mer',
              backTitle: 'Tremor',
              backBody:
                'A rhythmic shaking, often starting in a hand or fingers. A classic Parkinson\'s tremor happens at rest — when the hand is still — and may look like rolling a pill between the fingers. It often lessens when the person moves or uses the hand.',
            },
            {
              id: 'park-s02-reveal-rigidity',
              type: 'reveal_card',
              frontTitle: 'Rigidity',
              frontBody: 'Rih-JID-ih-tee',
              backTitle: 'Rigidity',
              backBody:
                'Stiffness of the muscles. In Parkinson\'s, muscles become tight and resistant, which can make movement uncomfortable and limit range of motion. It\'s why these residents may move stiffly and need gentle, patient help.',
            },
            {
              id: 'park-s02-reveal-bradykinesia',
              type: 'reveal_card',
              frontTitle: 'Bradykinesia',
              frontBody: 'Brady-kih-NEE-zhah',
              backTitle: 'Bradykinesia',
              backBody:
                'Slowness of movement. This is a core feature of Parkinson\'s — everything takes longer, from standing up to buttoning a shirt to walking. Patience with this slowness is essential. The resident is not being difficult; their body simply moves slowly.',
            },
            {
              id: 'park-s02-reveal-postural-instability',
              type: 'reveal_card',
              frontTitle: 'Postural Instability',
              frontBody: 'Postural instability',
              backTitle: 'Postural Instability',
              backBody:
                'Poor balance and a tendency to fall. People with Parkinson\'s may have trouble staying steady, especially when turning or starting to walk. This makes fall prevention one of the most important parts of their care.',
            },
            {
              id: 'park-s02-reveal-freezing',
              type: 'reveal_card',
              frontTitle: 'Freezing',
              frontBody: 'Freezing',
              backTitle: 'Freezing',
              backBody:
                'A sudden, temporary inability to move — the feet feel "stuck to the floor," often when starting to walk, turning, or passing through a doorway. It\'s frightening and a major fall risk. You\'ll learn gentle techniques to help a resident through a freeze.',
            },
            {
              id: 'park-s02-reveal-on-off',
              type: 'reveal_card',
              frontTitle: '"On" and "Off" Times',
              frontBody: '"On" and "off" times',
              backTitle: '"On" and "Off" Times',
              backBody:
                'When Parkinson\'s medication is working well, the resident is in an "on" time — moving more easily. When the medication wears off, they enter an "off" time — slower, stiffer, shakier, sometimes barely able to move. This is exactly why on-time medication matters so much.',
            },
            {
              id: 'park-s02-kc1-check-bradykinesia',
              type: 'knowledge_check',
              question: 'Match the term: slowness of movement, a core Parkinson\'s feature',
              options: [
                { id: 'bradykinesia', label: 'Bradykinesia' },
                { id: 'freezing', label: 'Freezing' },
                { id: 'off-time', label: '"Off" time' },
              ],
              correctOptionId: 'bradykinesia',
              explanation:
                'Bradykinesia. Slowness of movement. This is a core feature of Parkinson\'s — everything takes longer, from standing up to buttoning a shirt to walking.',
              requiredForCompletion: true,
            },
            {
              id: 'park-s02-kc1-check-freezing',
              type: 'knowledge_check',
              question: 'Match the term: sudden inability to move, feet feel stuck',
              options: [
                { id: 'bradykinesia', label: 'Bradykinesia' },
                { id: 'freezing', label: 'Freezing' },
                { id: 'off-time', label: '"Off" time' },
              ],
              correctOptionId: 'freezing',
              explanation:
                'Freezing. A sudden, temporary inability to move — the feet feel "stuck to the floor," often when starting to walk, turning, or passing through a doorway.',
              requiredForCompletion: true,
            },
            {
              id: 'park-s02-kc1-check-off-time',
              type: 'knowledge_check',
              question: 'Match the term: when medication wears off and movement becomes harder',
              options: [
                { id: 'bradykinesia', label: 'Bradykinesia' },
                { id: 'freezing', label: 'Freezing' },
                { id: 'off-time', label: '"Off" time' },
              ],
              correctOptionId: 'off-time',
              explanation:
                '"Off" time. When the medication wears off, the resident enters an "off" time — slower, stiffer, shakier, sometimes barely able to move.',
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
            { id: 'park-s03-heading', type: 'heading', level: 1, text: 'Statistics' },
            pendingAudio(
              'park-s03-audio',
              'Parkinson\'s Disease: Common, Progressive, and Manageable',
              `${ASSET_BASE}/s03-stats-podcast.mp3`,
              [
                'Parkinson\'s Disease: Common, Progressive, and Manageable',
                '',
                'Parkinson\'s disease affects nearly one million people in the United States, and that number is rising as the population ages. It\'s the second most common condition of its kind affecting the brain\'s movement system, after no other being more common in older adults of its type. Most people are diagnosed after age 60, which is why it\'s frequently seen in long-term care.',
                '',
                'Parkinson\'s is a progressive disease — it slowly worsens over years. Early on, symptoms may be mild: a slight tremor, a little stiffness. Over time, movement becomes slower and more difficult, balance worsens, and other problems emerge with speech, swallowing, mood, and sometimes thinking. By the time many people with Parkinson\'s are in long-term care, the disease is more advanced and daily care needs are significant.',
                '',
                'Here\'s what matters most for the CNA, and it centers on two big risks. The first is falls. Parkinson\'s causes poor balance, freezing of movement, and a shuffling walk — a combination that makes falls very common and very dangerous in older adults. Careful fall prevention by CNAs directly protects these residents. The second is swallowing problems, which raise the risk of aspiration and pneumonia. Safe eating support is essential.',
                '',
                'There\'s also a crucial medication story. Parkinson\'s symptoms are controlled by medications that must be taken on a strict schedule. When doses are on time, residents move and function far better. When doses are late — even by a little — residents can quickly become rigid, unable to move, and unsafe. Studies show that delayed Parkinson\'s medication in care settings leads to worse symptoms and more complications. CNAs play a key role in keeping medication on schedule by reporting promptly and supporting the routine.',
                '',
                'The encouraging part: with good medication management, fall prevention, safe eating, therapy, and patient daily care, residents with Parkinson\'s can maintain meaningful function and quality of life for years. Much of that care is delivered by CNAs.',
              ].join('\n'),
              `${ASSET_BASE}/s03-stats-podcast.mp3`,
            ),
            {
              id: 'park-s03-image',
              type: 'image',
              src: '/assets/courses/parkinsons/s03-hero.jpg',
              caption: 'Parkinson\'s is common in older adults — patient, attentive care matters.',
            },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: 'Fundamentals',
        sortOrder: 3,
        buildContent: () =>
          doc('Fundamentals', [
            { id: 'park-s04-heading', type: 'heading', level: 1, text: 'Fundamentals' },
            {
              id: 'park-s04-narration',
              type: 'text',
              body: [
                '**A problem of movement control**',
                'Deep in the brain are cells that produce dopamine, a chemical that helps make movement smooth and coordinated. In Parkinson\'s disease, these cells slowly stop working and die. With less dopamine, the brain loses some of its control over movement — and that\'s where the symptoms come from.',
                '**The four main movement signs**',
                'Parkinson\'s has four main movement signs. Tremor — shaking, often in a hand at rest. Rigidity — stiff, tight muscles. Bradykinesia — slowness of movement. And postural instability — poor balance. Not everyone has all four, and they vary from person to person, but these are the core features.',
                '**It\'s more than movement**',
                'Parkinson\'s affects much more than movement. It can cause a soft, hard-to-hear voice. Swallowing difficulties. A "masked face" with little expression — which does not mean the person feels nothing. Constipation. Sleep problems. Depression and anxiety. And in later stages, sometimes changes in thinking and memory. Knowing this helps you understand the whole person.',
                '**Slow body, sharp mind**',
                'Here is something vital to remember. A resident with Parkinson\'s may move slowly, speak softly, and show little facial expression — but their mind is usually clear and sharp. They understand everything. The masked face and slow movements can make them seem unaware or uninterested when they\'re fully present inside. Never talk down to them, never rush them, never speak about them as if they aren\'t there.',
                '**Why timing rules everything: on and off**',
                'Parkinson\'s medication, taken on schedule, keeps the resident in an "on" state — moving more easily, more able, more independent. When a dose is late or wears off, they shift to an "off" state — suddenly stiff, slow, shaky, sometimes unable to move or even swallow safely. This on-off pattern is why on-time medication isn\'t a convenience — it\'s a safety issue.',
                '**Falls and freezing**',
                'Two movement problems make falls a constant danger. The shuffling, unsteady walk and poor balance make residents prone to falling. And freezing — when the feet suddenly feel glued to the floor, often at doorways or when turning — can pitch a resident forward. Fall prevention is one of the most important things you do in Parkinson\'s care.',
                '**Managed, not cured**',
                'There\'s no cure for Parkinson\'s yet, and it slowly progresses. But it can be managed well — with medication on schedule, therapy, fall prevention, safe eating, and patient daily care. Many residents live meaningful, engaged lives with Parkinson\'s for years. Your daily care is central to that quality of life.',
              ].join('\n\n'),
            },
            {
              id: 'park-s04-slow-body-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Slow body does NOT mean slow mind',
              body: 'A resident with Parkinson\'s may move slowly, speak softly, and show little facial expression — but their mind is usually clear and sharp. Never talk down to them, never rush them, never speak about them as if they aren\'t there.',
            },
            {
              id: 'park-s04-video',
              type: 'video',
              title: 'Fundamentals',
              videoUrl: `${ASSET_BASE}/s04-fundamentals.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s04-fundamentals.mp4`,
            },
            {
              id: 'park-s04-image',
              type: 'image',
              src: '/assets/courses/parkinsons/s04-hero.jpg',
              caption: 'Understanding how Parkinson\'s slows and stiffens the body.',
            },
          ]),
      },
    ],
  },
  {
    slug: 'module-2',
    title: 'Recognition, Support, and CNA Role',
    sortOrder: 1,
    lessons: [
      {
        slug: 's05-signs',
        title: 'Signs & Symptoms',
        sortOrder: 0,
        buildContent: () =>
          doc('Signs & Symptoms', [
            { id: 'park-s05-heading', type: 'heading', level: 1, text: 'Signs & Symptoms' },
            {
              id: 'park-s05-narration',
              type: 'text',
              body: [
                '**The everyday movement signs**',
                'You\'ll come to know each resident\'s usual signs. A resting tremor — shaking in a hand or fingers when at rest. Stiff, rigid muscles. Slow movement, where everything takes longer. A stooped posture. A soft, quiet voice. A masked face with little expression. Small handwriting. These are the daily face of Parkinson\'s, and knowing each resident\'s normal helps you notice when something changes.',
                '**The walk and the falls**',
                'Watch the walking closely, because it\'s where danger lives. A Parkinson\'s walk is often a shuffle — small, quick steps, feet barely leaving the floor, arms not swinging. Balance is poor, especially when turning or starting to move. And freezing can strike suddenly. All of this means a high fall risk. Notice when a resident\'s walking or balance seems worse than usual — that\'s worth reporting.',
                '**Eating, swallowing, and the off state**',
                'Pay attention at meals. Swallowing problems are common and dangerous, raising aspiration risk. Watch for coughing, choking, drooling, or food pocketing in the cheeks. And notice the rhythm of the day — a resident who was moving and eating well in the morning but becomes stiff and struggles by late morning may be entering an "off" period as medication wears off. That timing pattern is important information to report.',
                '**Changes and complications to report**',
                'Beyond the everyday signs, watch for changes that need reporting. Suddenly worse rigidity or inability to move — often a medication-timing problem. New or worse confusion or hallucinations — which can come from the disease or the medications. New swallowing trouble or choking. Increased falls. Worsening mood or signs of depression. Significant constipation. Any sudden change from the resident\'s normal gets reported.',
                '**Summary**',
                'Two pictures. Everyday Parkinson\'s signs: resting tremor, stiffness, slow shuffling movement, soft voice, masked face — know each resident\'s normal. Changes to report: sudden inability to move, new confusion or hallucinations, new swallowing trouble, more falls, worsening mood, or symptoms that worsen as a medication time approaches.',
                'The rule underneath it all: you know each resident\'s normal and their daily rhythm, and you report the changes — especially the stiffening that signals medication wearing off.',
              ].join('\n\n'),
            },
            {
              id: 'park-s05-off-state-callout',
              type: 'callout',
              variant: 'warning',
              title: 'Watch for the "off" state',
              body: 'A resident who was moving well but becomes stiff and struggles as a medication time approaches may be entering an "off" period. Report the stiffening promptly — especially as the next dose time approaches.',
            },
            {
              id: 'park-s05-image',
              type: 'image',
              src: '/assets/courses/parkinsons/s05-hero.jpg',
              caption: 'Recognizing tremor, rigidity, slowed movement, and "off" periods.',
            },
          ]),
      },
      {
        slug: 's06-causes',
        title: 'Causes',
        sortOrder: 1,
        buildContent: () =>
          doc('Causes', [
            { id: 'park-s06-heading', type: 'heading', level: 1, text: 'Causes' },
            pendingAudio(
              'park-s06-audio',
              'What Causes Parkinson\'s Disease?',
              `${ASSET_BASE}/s06-causes-podcast.mp3`,
              [
                'What Causes Parkinson\'s Disease?',
                '',
                'Parkinson\'s disease happens when certain cells deep in the brain — the ones that produce dopamine, the chemical that helps control smooth movement — slowly stop working and die. As dopamine drops, the brain loses some control over movement, and the symptoms of Parkinson\'s appear. By the time symptoms show, a significant number of these cells have already been lost.',
                '',
                'But why those cells start dying is something scientists are still working to fully understand. In most people, there is no single clear cause. It\'s believed to come from a combination of factors — a mix of genetics and environment that varies from person to person.',
                '',
                'Age is the biggest known risk factor. Parkinson\'s becomes much more common as people get older, which is why it\'s so often seen in long-term care. A small number of cases run in families and are linked to specific genes, but most people with Parkinson\'s have no family history of it. Some research links long-term exposure to certain pesticides, chemicals, or toxins to a higher risk, and men are somewhat more likely to develop it than women.',
                '',
                'Here\'s the important point for CNAs: in almost all cases, Parkinson\'s is not something the resident caused or could have prevented. It\'s not from a poor lifestyle or a personal failing. This matters because it shapes how we care — with compassion and without any hint of blame.',
                '',
                'And because the cause usually can\'t be undone, the focus of care is on managing symptoms and preventing complications — which is exactly where the CNA\'s daily work shines. You can\'t change why a resident has Parkinson\'s, but you have enormous influence over their safety, comfort, and quality of life. Preventing falls, supporting safe eating, helping keep medication on time, encouraging movement and independence, and providing patient, respectful care — these are the things that make a real difference every single day.',
              ].join('\n'),
              `${ASSET_BASE}/s06-causes-podcast.mp3`,
            ),
            {
              id: 'park-s06-image',
              type: 'image',
              src: '/assets/courses/parkinsons/s06-hero.jpg',
              caption: 'Understanding what happens in the brain in Parkinson\'s.',
            },
          ]),
      },
      {
        slug: 's07-role',
        title: 'CNA Role & Best Practices',
        sortOrder: 2,
        buildContent: () =>
          doc('CNA Role & Best Practices', [
            {
              id: 'park-s07-heading',
              type: 'heading',
              level: 1,
              text: 'CNA Role & Best Practices',
            },
            {
              id: 'park-s07-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of practice',
              body: 'A CNA does not give or adjust Parkinson\'s medications. But keeping medication on time is one of the most important things you\'ll ever do for these residents.',
            },
            {
              id: 'park-s07-image',
              type: 'image',
              src: '/assets/courses/parkinsons/s07-hero.jpg',
              caption: 'The CNA gives extra time, supports safe movement and meals, and reports "off" periods — never rushes, forces movement, or changes medication timing.',
            },
            {
              id: 'park-s07-narration',
              type: 'text',
              body: [
                'Medication is the heart of Parkinson\'s treatment, and this section contains the single most important point in the whole course. Let\'s start, as always, with the rule that never bends. A CNA does not give or adjust Parkinson\'s medications. But — and this is crucial — the CNA\'s role in keeping that medication on time is one of the most important things you\'ll ever do for these residents.',
                '**Why timing is everything.** Parkinson\'s medications, like levodopa, work by boosting dopamine. They wear off after a few hours, so they\'re scheduled at specific times to keep the resident steady. Here\'s the critical part: these schedules are often not the same as the regular medication pass times. A Parkinson\'s resident might need a dose at exactly 8:00, 11:00, 2:00, and 5:00 — and even a thirty-minute delay can send them from moving comfortably into an "off" state where they\'re rigid, frozen, unable to move, sometimes unable to swallow safely. A late dose isn\'t a minor thing. It can make a resident suddenly unsafe.',
                '**Your role in timing.** You don\'t give the medication — but you support on-time dosing powerfully. Know your residents\' "off" patterns. If you notice a resident getting stiff, slow, or struggling as their next dose time approaches, report it to the nurse promptly so the dose isn\'t missed or delayed. If a resident is away at therapy or an activity when a dose is due, make sure the nurse knows. Never let a Parkinson\'s resident\'s medication time slip by unnoticed — your alertness keeps them safe.',
                '**Levodopa and food timing.** Some Parkinson\'s medications work best when taken away from high-protein meals, because protein can interfere with absorption. The care plan will note this. Support whatever timing the plan specifies.',
                '**Side effects to report.** Parkinson\'s medications can cause side effects worth reporting: nausea, dizziness or low blood pressure when standing — a fall risk — confusion, hallucinations, or unusual movements. You observe and report these; the nurse and doctor adjust.',
                '**Never stop suddenly.** Parkinson\'s medication must never be stopped abruptly — it can cause a dangerous reaction. This is a medical decision, never a CNA one, but it\'s why reporting refusals immediately matters so much.',
                'The scope point for this whole course: you don\'t give the medication, but you are the eyes and the alarm that keep it on time. A resident\'s safety can depend on you noticing the "off" state coming and reporting it fast.',
              ].join('\n\n'),
            },
            {
              id: 'park-s07-timing-callout',
              type: 'callout',
              variant: 'warning',
              title: 'On-time is a safety issue',
              body: 'A late Parkinson\'s dose can leave a resident rigid and unable to move. On-time is a SAFETY issue. Report any delay risk immediately.',
            },
          ]),
      },
      {
        slug: 's08-prevention',
        title: 'Prevention & Risk Reduction',
        sortOrder: 3,
        buildContent: () =>
          doc('Prevention & Risk Reduction', [
            { id: 'park-s08-heading', type: 'heading', level: 1, text: 'Prevention & Risk Reduction' },
            {
              id: 'park-s08-image',
              type: 'image',
              src: '/assets/courses/parkinsons/s08-hero.jpg',
              caption: 'Supporting safe mobility and mealtimes; preventing falls and choking.',
            },
            {
              id: 'park-s08-narration',
              type: 'text',
              body: [
                'With Parkinson\'s, prevention means preventing the complications — falls, aspiration, and decline. Here are seven ways CNAs protect these residents.',
                '**One. Prevent falls above all.** Falls are the biggest danger in Parkinson\'s. Keep pathways clear, ensure good lighting, provide the prescribed walking aids, and stay close during transfers and walking. Never rush a Parkinson\'s resident — rushing causes falls. Allow plenty of time for every movement.',
                '**Two. Help through freezing safely.** When a resident freezes, feet stuck to the floor, don\'t pull them — that can cause a fall. Instead, stay calm and use gentle cues: ask them to march in place, step over an imaginary line, or shift their weight side to side. Counting "one, two, one, two" or a gentle rhythm can help the feet start moving again.',
                '**Three. Support safe eating to prevent aspiration.** Follow the care plan for food texture and thickened liquids. Keep the resident fully upright, allow plenty of time, encourage small bites and thorough chewing, and stay alert for coughing or choking. Their slow movement extends to swallowing, so never rush meals.',
                '**Four. Support on-time medication.** Watch for the "off" state approaching and report it so doses stay on schedule. On-time medication keeps residents moving and safe, which prevents falls and other complications. This is prevention in action.',
                '**Five. Encourage movement and independence.** Within safety, encourage residents to do what they can and to stay active as the care plan and therapists direct. Movement helps maintain function. Allow extra time and offer patient encouragement rather than taking over.',
                '**Six. Prevent constipation and support comfort.** Constipation is very common in Parkinson\'s. Support fluids, fiber, and movement as the plan allows, and report problems. Also support good positioning to ease rigidity and prevent pressure injuries from limited movement.',
                '**Seven. Protect emotional wellbeing.** Depression and anxiety are common in Parkinson\'s. A patient, warm, respectful approach matters. Give residents time to speak, listen even when their voice is soft, include them in conversation, and report signs of low mood. Emotional care is real care.',
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
            {
              id: 'park-s09-heading',
              type: 'heading',
              level: 1,
              text: 'Scenario & Reporting',
            },
            pendingAudio(
              'park-s09-intro-audio',
              'Emergency response scenarios intro',
              `${ASSET_BASE}/s09-emergency-intro.mp3`,
              'With Parkinson\'s, two situations test your judgment most: recognizing when a resident is going "off" because medication is due, and recognizing a true emergency like choking or a serious medication reaction. You\'re about to work through two situations. Read each carefully, choose your action, and you\'ll get feedback right away. Keep the course theme in mind: you don\'t give the medication, but you are the alarm that keeps it on time.',
              `${ASSET_BASE}/s09-emergency-intro.mp3`,
            ),
            {
              id: 'park-s09-image',
              type: 'image',
              src: '/assets/courses/parkinsons/s09-hero.jpg',
              caption: 'Reading a Parkinson\'s situation: a wearing-off period, and a true emergency like choking.',
            },
            {
              id: 'park-s09-scenario-off-state-image',
              type: 'image',
              src: '/assets/courses/parkinsons/s09-scenario-off-state.jpg',
              caption: 'Stiff, slowed, tremor worse as the dose wears off near medication time: report to the nurse promptly — do not pull her up or wait it out.',
            },
            {
              id: 'park-s09-scenario-off-state',
              type: 'scenario_question',
              prompt:
                'Mrs. Romano has Parkinson\'s and was moving well this morning. It\'s now late morning, close to her next medication time. You notice she\'s become very stiff, her movements have slowed dramatically, she\'s struggling to get out of her chair, and her hand tremor is much worse than earlier. She\'s mentally clear but frustrated. What SHOULD the CNA do?',
              options: [
                {
                  id: 'wait-it-out',
                  label: 'Tell her to wait — she\'ll feel better eventually',
                  feedback:
                    'This is an "off" state — the medication is wearing off, shown by increasing stiffness and tremor near the next dose time. Telling her to wait, pulling her up, or giving medication yourself are all wrong. The right action: report to the nurse promptly so the dose is given on time, and keep her safe and reassured meanwhile.',
                },
                {
                  id: 'report-nurse',
                  label: 'Report to the nurse promptly that she\'s going "off" and her medication time is approaching',
                  feedback:
                    'Right. Increasing stiffness, slowed movement, and a worse tremor as the next dose approaches are classic signs of an "off" state — the medication is wearing off. The most important thing you can do is report it to the nurse promptly so the dose is given on time and not delayed. Stay with her, keep her safe from falls, and be patient and reassuring. And note what you do NOT do — you never give the medication yourself, and you never try to yank a stiff resident up, which risks a fall. Your alert report is what keeps her safe.',
                  isRecommended: true,
                },
                {
                  id: 'pull-up',
                  label: 'Try to pull her up out of the chair quickly',
                  feedback:
                    'This is an "off" state — the medication is wearing off, shown by increasing stiffness and tremor near the next dose time. Telling her to wait, pulling her up, or giving medication yourself are all wrong. The right action: report to the nurse promptly so the dose is given on time, and keep her safe and reassured meanwhile.',
                },
                {
                  id: 'give-dose',
                  label: 'Give her the next dose yourself to help',
                  feedback:
                    'This is an "off" state — the medication is wearing off, shown by increasing stiffness and tremor near the next dose time. Telling her to wait, pulling her up, or giving medication yourself are all wrong. The right action: report to the nurse promptly so the dose is given on time, and keep her safe and reassured meanwhile.',
                },
              ],
              requiredForCompletion: true,
            },
            {
              id: 'park-s09-scenario-choking-image',
              type: 'image',
              src: '/assets/courses/parkinsons/s09-scenario-choking.jpg',
              caption: 'A weak cough, can\'t speak, clutching the throat, color going dusky at a meal: recognize choking, activate emergency help immediately, and follow choking-response within your training.',
            },
            {
              id: 'park-s09-scenario-choking',
              type: 'scenario_question',
              prompt:
                'You\'re helping Mr. Bauer, who has Parkinson\'s and known swallowing problems, eat lunch. He suddenly starts coughing forcefully, then his coughing becomes weak, he can\'t speak, he\'s clutching his throat, and his face is turning red then dusky. What is the BEST action?',
              options: [
                {
                  id: 'give-water',
                  label: 'Give him a large drink of water to wash it down',
                  feedback:
                    'This is a choking emergency — weak cough, can\'t speak, clutching the throat, color changing. Giving water, waiting, or laying him flat are all dangerous. The right action: recognize the choking, activate emergency help immediately, and follow choking response within your training. Swallowing problems make this a real danger in Parkinson\'s.',
                },
                {
                  id: 'activate-help',
                  label: 'Recognize choking, activate emergency help immediately, and follow choking response within your training',
                  feedback:
                    'Right. Forceful coughing that becomes weak, inability to speak, clutching the throat, and color changing are signs of serious choking — a life-threatening airway emergency, and a real risk in Parkinson\'s because of swallowing problems. Activate emergency help immediately and follow choking-response procedures within your training and certification. Do not give water, which can make airway blockage worse, and do not lay him flat. Fast action saves a choking resident. This is exactly why safe, unhurried eating support matters so much in Parkinson\'s.',
                  isRecommended: true,
                },
                {
                  id: 'wait-pass',
                  label: 'Tell him to relax and wait for it to pass',
                  feedback:
                    'This is a choking emergency — weak cough, can\'t speak, clutching the throat, color changing. Giving water, waiting, or laying him flat are all dangerous. The right action: recognize the choking, activate emergency help immediately, and follow choking response within your training. Swallowing problems make this a real danger in Parkinson\'s.',
                },
                {
                  id: 'lie-flat',
                  label: 'Lay him down flat',
                  feedback:
                    'This is a choking emergency — weak cough, can\'t speak, clutching the throat, color changing. Giving water, waiting, or laying him flat are all dangerous. The right action: recognize the choking, activate emergency help immediately, and follow choking response within your training. Swallowing problems make this a real danger in Parkinson\'s.',
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
            { id: 'park-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
              id: 'park-s10-narration',
              type: 'text',
              body: [
                'Caring for a resident with Parkinson\'s is a blend of patience, safety, and respect. Let\'s walk through your role.',
                '**Patience above all** The foundation of Parkinson\'s care is patience. Everything takes longer — dressing, eating, moving, speaking. Allow generous time and never rush. Encourage residents to do what they can themselves, even slowly, because that preserves independence and dignity. Rushing a Parkinson\'s resident doesn\'t just frustrate them — it causes falls and stress. Your unhurried patience is genuine care.',
                '**Protect against falls** Fall prevention is constant. Stay close during transfers and walking. Keep pathways clear and lit. Provide walking aids. Know how to help through a freeze — gentle cues, never pulling. Allow time for the resident to steady themselves when standing and turning. Falls cause some of the worst outcomes in Parkinson\'s, and your vigilance prevents them.',
                '**Communicate with respect** Remember always: slow body, sharp mind. Speak to the resident as the intelligent adult they are. Give them time to respond — their soft voice and slow speech don\'t mean slow thinking. Lean in and listen patiently. Don\'t finish their sentences or speak about them as if they aren\'t there. The masked face hides real feelings; treat them with full dignity and warmth.',
                '**Support medication timing and report** Be the alarm for medication timing. Know each resident\'s "off" patterns, watch for the stiffening that signals a dose is needed, and report promptly so medication stays on schedule. Support safe eating to prevent aspiration. Report changes — new confusion, hallucinations, worse swallowing, more falls, low mood. Your observations guide the whole team.',
                'Now the boundary. You do not diagnose Parkinson\'s. You do not give or adjust medications. You do not perform therapy — you reinforce what the therapists assign. You never stop or delay reporting a medication concern, because timing is safety. And you never rush a resident, even when you\'re busy.',
                'Inside your role — patience, fall prevention, respectful communication, medication-timing alertness, safe eating, and faithful reporting — you protect a resident\'s safety and dignity every hour. With Parkinson\'s, the quality of daily care a CNA provides shapes the quality of the resident\'s life.',
              ].join('\n\n'),
            },
            {
              id: 'park-s10-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Stay within scope',
              body: 'You do not diagnose Parkinson\'s. You do not give or adjust medications. You do not perform therapy — you reinforce what the therapists assign. You never stop or delay reporting a medication concern, because timing is safety. And you never rush a resident, even when you\'re busy.',
            },
            {
              id: 'park-s10-video',
              type: 'video',
              title: "CNA's Role in Care",
              videoUrl: `${ASSET_BASE}/s10-cna-role.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s10-cna-role.mp4`,
            },
            {
              id: 'park-s10-image',
              type: 'image',
              src: '/assets/courses/parkinsons/s10-hero.jpg',
              caption: 'Reporting changes and "off" periods accurately to the nurse.',
            },
          ]),
      },
      {
        slug: 's11-case-study',
        title: 'Case Study',
        sortOrder: 2,
        buildContent: () => {
          const caseNarrative = [
            'Mr. Okonkwo, 74, had Parkinson\'s disease and had lived at the facility for two years. His CNA, Marisol, had learned his rhythms carefully. With his medication on schedule, he could walk with his walker, feed himself slowly, and loved talking about his years as a schoolteacher — though his voice was soft and his face showed little expression.',
            '',
            '**The pattern Marisol learned:** Marisol noticed that Mr. Okonkwo\'s good mornings depended entirely on timing. His doses were scheduled at 8:00, 11:00, 2:00, and 5:00 — not the same as the regular medication pass. When his 11:00 dose was on time, he stayed steady through lunch. When it ran even twenty or thirty minutes late, she watched him change: by 11:15 he\'d start stiffening, his tremor worsening, until he could barely rise from his chair or safely manage his food.',
            '',
            '**The day it mattered:** One busy morning, Marisol noticed it was 10:50 and Mr. Okonkwo was already beginning to stiffen — his "off" state coming on a little early, and the unit was short-staffed with the nurse tied up. A less experienced aide might have waited, assuming the nurse would get to it. Marisol didn\'t wait. She went to the nurse directly: "Mr. Okonkwo is going off early and his 11:00 dose is critical — he\'s already stiffening and he\'s got lunch coming. Can we keep his dose on time?" The nurse, alerted, prioritized his dose and gave it right at 11:00.',
            '',
            '**What it prevented:** Because the dose stayed on time, Mr. Okonkwo stayed "on" through lunch — able to swallow safely, feed himself, and avoid the rigid, frozen state that would have made eating dangerous and a fall likely. Marisol stayed with him through the meal anyway, unhurried, listening to a story about his old classroom.',
            '',
            '**The contrast:** A week earlier, on a day Marisol was off, his 11:00 dose had been delayed by forty minutes during a busy shift. He\'d gone fully "off," frozen getting up, and had a near-fall, and lunch had to be stopped because he couldn\'t swallow safely. The difference between the two days was nothing more than the timing of one pill.',
            '',
            '**Discussion:** Marisol never gave the medication — that wasn\'t her role. But she knew Mr. Okonkwo\'s "off" pattern, recognized it coming early, and acted as the alarm that kept his dose on time. That single piece of CNA vigilance was the difference between a safe, dignified lunch and a frozen, dangerous one. She also showed the other half of Parkinson\'s care: patience and respect, listening to his stories with his slow, soft voice, treating the sharp mind behind the masked face.',
          ].join('\n');

          return doc('Case Study', [
            { id: 'park-s11-heading', type: 'heading', level: 1, text: 'Brief Case Study' },
            pendingAudio(
              'park-s11-audio',
              'The Eleven O\'Clock Difference',
              `${ASSET_BASE}/s11-case-podcast.mp3`,
              caseNarrative,
              `${ASSET_BASE}/s11-case-podcast.mp3`,
            ),
            {
              id: 'park-s11-image',
              type: 'image',
              src: '/assets/courses/parkinsons/s11-hero.jpg',
              caption: 'A Parkinson\'s situation handled well — patient, safe, dignified.',
            },
            {
              id: 'park-s11-case-study',
              type: 'case_study',
              title: 'The Eleven O\'Clock Difference',
              residentProfile:
                'Mr. Okonkwo, 74, had Parkinson\'s disease and had lived at the facility for two years. His CNA, Marisol, had learned his rhythms carefully. With his medication on schedule, he could walk with his walker, feed himself slowly, and loved talking about his years as a schoolteacher — though his voice was soft and his face showed little expression.',
              scenario: [
                '**The pattern Marisol learned:** Marisol noticed that Mr. Okonkwo\'s good mornings depended entirely on timing. His doses were scheduled at 8:00, 11:00, 2:00, and 5:00 — not the same as the regular medication pass. When his 11:00 dose was on time, he stayed steady through lunch. When it ran even twenty or thirty minutes late, she watched him change: by 11:15 he\'d start stiffening, his tremor worsening, until he could barely rise from his chair or safely manage his food.',
                '**The day it mattered:** One busy morning, Marisol noticed it was 10:50 and Mr. Okonkwo was already beginning to stiffen — his "off" state coming on a little early, and the unit was short-staffed with the nurse tied up. A less experienced aide might have waited, assuming the nurse would get to it. Marisol didn\'t wait. She went to the nurse directly: "Mr. Okonkwo is going off early and his 11:00 dose is critical — he\'s already stiffening and he\'s got lunch coming. Can we keep his dose on time?" The nurse, alerted, prioritized his dose and gave it right at 11:00.',
                '**What it prevented:** Because the dose stayed on time, Mr. Okonkwo stayed "on" through lunch — able to swallow safely, feed himself, and avoid the rigid, frozen state that would have made eating dangerous and a fall likely. Marisol stayed with him through the meal anyway, unhurried, listening to a story about his old classroom.',
                '**The contrast:** A week earlier, on a day Marisol was off, his 11:00 dose had been delayed by forty minutes during a busy shift. He\'d gone fully "off," frozen getting up, and had a near-fall, and lunch had to be stopped because he couldn\'t swallow safely. The difference between the two days was nothing more than the timing of one pill.',
                '**Discussion:** Marisol never gave the medication — that wasn\'t her role. But she knew Mr. Okonkwo\'s "off" pattern, recognized it coming early, and acted as the alarm that kept his dose on time. That single piece of CNA vigilance was the difference between a safe, dignified lunch and a frozen, dangerous one. She also showed the other half of Parkinson\'s care: patience and respect, listening to his stories with his slow, soft voice, treating the sharp mind behind the masked face.',
              ].join('\n\n'),
            },
            {
              id: 'park-s11-reflection-1',
              type: 'reflection',
              prompt:
                'Mr. Okonkwo\'s medication schedule (8, 11, 2, 5) was different from the regular medication pass times. Why is it so important for a CNA to know and protect a Parkinson\'s resident\'s specific dose timing?',
              minCharacters: 50,
            },
            {
              id: 'park-s11-reflection-2',
              type: 'reflection',
              prompt:
                'Marisol never gave the medication, yet she made the difference in keeping it on time. How can a CNA powerfully support medication timing while staying fully within their scope?',
              minCharacters: 50,
            },
            {
              id: 'park-s11-reflection-intro-text',
              type: 'text',
              body: 'Reflect on the case study in the previous lesson. Your written responses help you apply what you learned about medication timing, recognizing "off" states, and supporting residents with Parkinson\'s while staying within your scope.',
            },
            {
              id: 'park-s11-kc2-check',
              type: 'knowledge_check',
              question:
                'A CNA does not give or adjust Parkinson\'s medications. When a resident with Parkinson\'s is going "off" as their next dose time approaches, the CNA SHOULD:',
              options: [
                {
                  id: 'give-dose',
                  label: 'Give the next dose to help them',
                },
                {
                  id: 'report-nurse',
                  label: 'Report to the nurse promptly so the dose stays on time',
                },
                {
                  id: 'wait-it-out',
                  label: 'Tell the resident to wait it out',
                },
                {
                  id: 'pull-up',
                  label: 'Pull the resident up out of the chair quickly',
                },
              ],
              correctOptionId: 'report-nurse',
              explanation:
                'If you notice a resident getting stiff, slow, or struggling as their next dose time approaches, report it to the nurse promptly so the dose isn\'t missed or delayed. You don\'t give the medication — but you are the eyes and the alarm that keep it on time.',
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
            { id: 'park-s12-heading', type: 'heading', level: 1, text: 'Conclusion' },
            {
              id: 'park-s12-video',
              type: 'video',
              title: 'Conclusion',
              videoUrl: `${ASSET_BASE}/s12-conclusion.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s12-conclusion.mp4`,
            },
            {
              id: 'park-s12-image',
              type: 'image',
              src: '/assets/courses/parkinsons/s12-hero.jpg',
              caption: 'Give time, support safety, report changes — the CNA\'s role in Parkinson\'s care.',
            },
            {
              id: 'park-s12-narration',
              type: 'text',
              body: [
                'You\'ve reached the end. Let\'s lock in the five things that matter most for Parkinson\'s care.',
                '**One.** Parkinson\'s is a brain condition that affects movement — causing tremor, stiffness, slowness, and poor balance — and much more, including soft speech, swallowing trouble, and mood changes. It\'s managed, not cured, and good daily care keeps residents functioning and dignified for years.',
                '**Two.** Remember: slow body, sharp mind. A resident who moves slowly, speaks softly, and shows a masked face is fully present and intelligent inside. Never rush them, talk down to them, or speak as if they aren\'t there. Patience and respect are the foundation.',
                '**Three.** Medication timing is a safety issue. Parkinson\'s doses must be on time, often on a schedule different from the regular pass. A late dose can leave a resident rigid, frozen, and unable to move or swallow safely. You don\'t give the medication — but you\'re the alarm: watch for the "off" state coming and report it promptly.',
                '**Four.** Prevent the big complications. Falls — stay close, clear pathways, help through freezing with gentle cues, never pull. Aspiration — support safe, unhurried eating, fully upright, watching for choking. These two risks cause the most harm, and your care prevents them.',
                '**Five.** Honor your scope. You support, observe, and report. You never diagnose, never give or adjust medications, and never perform therapy. But your patient daily care, fall prevention, safe eating support, and medication-timing alertness shape this resident\'s safety and quality of life every single day.',
              ].join('\n\n'),
            },
            {
              id: 'park-s12-summary',
              type: 'summary',
              title: 'Five things that matter most',
              items: [
                'Parkinson\'s is a brain condition that affects movement — it\'s managed, not cured, and good daily care keeps residents functioning and dignified.',
                'Slow body, sharp mind — never rush, talk down, or speak as if the resident isn\'t there.',
                'Medication timing is a safety issue — watch for the "off" state and report it promptly.',
                'Prevent the big complications — falls and aspiration through patient, vigilant daily care.',
                'Honor your scope — support, observe, and report; never diagnose, give medications, or perform therapy.',
              ],
            },
            {
              id: 'park-s12-what-happens-next-text',
              type: 'text',
              body: 'Ten questions are waiting. Everything on them was covered here. You\'re ready. Trust what you\'ve learned, and show what you know.',
            },
            {
              id: 'park-s12-completion-requirements-text',
              type: 'text',
              body: 'This course provides one hour of continuing education credit through CAL ACE Nursing Academy, an approved CDPH continuing education provider, NAC number 7384. Your certificate is generated automatically when you pass the knowledge check.',
            },
            {
              id: 'park-s12-completion-requirements-callout',
              type: 'callout',
              variant: 'info',
              title: 'Scope reminder',
              body: 'CNAs support, observe, and report. CNAs do not diagnose Parkinson\'s, give or adjust medications, or perform therapy.',
            },
            {
              id: 'park-s12-certificate-access-text',
              type: 'text',
              body: 'Your certificate is generated automatically when you pass the knowledge check. CDPH-Approved CE Provider — NAC #7384.',
            },
          ]),
      },
    ],
  },
];

export async function seedCourse21Parkinsons(
  prisma: PrismaClient,
  options?: { tenantSlug?: string },
): Promise<{
  courseCreated: boolean;
  modulesUpserted: number;
  lessonsUpserted: number;
  strayLessonsDeleted: number;
}> {
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

  const ownedLessonSlugs = new Set(MODULES.flatMap((m) => m.lessons.map((l) => l.slug)));
  let strayLessonsDeleted = 0;

  if (version.status !== CourseVersionStatus.DRAFT) {
    console.warn('Skipping stray-lesson cleanup: version is not DRAFT');
  } else {
    const strayLessons = await prisma.lesson.findMany({
      where: {
        deletedAt: null,
        slug: { notIn: [...ownedLessonSlugs] },
        module: {
          courseVersionId: version.id,
          deletedAt: null,
        },
      },
      select: { id: true, slug: true },
    });

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
        `Stray-lesson cleanup: soft-deleted ${strayLessonsDeleted} lessons [${strayLessons.map((l) => l.slug).join(', ')}] on version v${version.versionNumber}.`,
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

function totalBlockCount(): number {
  return Object.values(blockCountsByLesson()).reduce((sum, count) => sum + count, 0);
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
  console.log(`Seeding Course 21 (Parkinson\'s) as DRAFT — slug "${COURSE_SLUG}"…`);

  try {
    const result = await seedCourse21Parkinsons(prisma);
    const blockCounts = blockCountsByLesson();

    console.log('Seed complete.');
    console.log(`  Course:   ${COURSE_TITLE}`);
    console.log(`  Slug:     ${COURSE_SLUG}`);
    console.log(`  Created:  ${result.courseCreated ? 'yes (new)' : 'no (updated existing)'}`);
    console.log(`  Modules:  ${result.modulesUpserted}`);
    console.log(`  Lessons:  ${result.lessonsUpserted}`);
    console.log(`  Strays cleaned: ${result.strayLessonsDeleted} lessons`);
    console.log(`  Blocks:   ${totalBlockCount()} total`);
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
