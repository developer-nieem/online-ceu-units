/**
 * Seed Course 28 — Caring for a Resident with a Thyroid Disorder (DRAFT).
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-28-thyroid-disorders
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
const COURSE_SLUG = 'thyroid-disorders';
const COURSE_TITLE = 'Thyroid Conditions: CNA Observations and Daily Support';
const COURSE_SUMMARY =
  'Learn to support residents with thyroid disorders — recognizing the opposite signs of underactive and overactive thyroid, supporting medication timing and comfort, and recognizing rare thyroid emergencies. CNAs do not diagnose thyroid disorders, give or adjust thyroid medication, or interpret lab results.';

const ASSET_BASE = '/assets/courses/thyroid-disorders';

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
    'Explain what the thyroid does, in plain language',
    'Recognize the opposite signs of an underactive and overactive thyroid',
    'Support medication timing and comfort',
    'Recognize thyroid emergencies',
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
  heroImage: '/assets/courses/thyroid-disorders/hero-banner.png',
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
    title: 'Understanding Thyroid Disorders',
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: 'Introduction',
        sortOrder: 0,
        buildContent: () =>
          doc('Welcome', [
            { id: 'thy-s01-heading', type: 'heading', level: 1, text: 'Welcome' },
            {
              id: 'thy-s01-video',
              type: 'video',
              title: 'Introduction',
              videoUrl: '/assets/courses/thyroid-disorders/s01-intro.mp4',
              placeholderNote: 'Pending upload: /assets/courses/thyroid-disorders/s01-intro.mp4',
            },
            {
              id: 'thy-s01-image',
              type: 'image',
              src: `${ASSET_BASE}/s01-hero.jpg`,
              caption:
                "Thyroid disorders — when the body's thermostat runs too slow, or too fast.",
            },
            {
              id: 'thy-s01-narration',
              type: 'text',
              body: [
                'Welcome to CAL ACE Nursing Academy.',
                'This course is about thyroid disorders — and how a CNA\'s everyday observations help keep a resident\'s thyroid in balance.',
                'The thyroid is a small, butterfly-shaped gland in the front of the neck. For something so small, it has an enormous job: it sets the speed of the body. The thyroid makes hormones that control your metabolism — how fast your body burns energy, how warm you feel, how fast your heart beats, how your mind and body run. Think of it as the body\'s thermostat and accelerator combined.',
                'Thyroid disorders come in two opposite forms, and that\'s the key to this whole course. An underactive thyroid — hypothyroidism — is like the body\'s engine running too slow. Everything slows down: the resident feels tired, cold, sluggish, gains weight, becomes constipated, and may seem mentally foggy or low. An overactive thyroid — hyperthyroidism — is the opposite: the engine races. The resident feels hot, anxious, shaky, their heart races, they lose weight, and they can\'t settle.',
                'Here\'s why this matters so much for the CNA. Thyroid problems are very common in older adults — and their signs are quietly easy to miss or misread. A slow thyroid can look like depression, dementia, or "just getting old." A fast thyroid can look like an anxiety problem or a heart condition. Because you see residents every day, you\'re often the one who notices the pattern — the resident who\'s become unusually cold, slow, and foggy, or unusually hot, restless, and losing weight. Your observations help the thyroid get recognized and balanced.',
                'This course also covers a piece of care that\'s small but mighty: thyroid medication timing. The most common thyroid medication works best taken at a specific time, often on an empty stomach — and getting that timing right keeps the resident in balance.',
                'Your scope is clear. A CNA observes and reports the signs of an unbalanced thyroid, supports medication timing and comfort, and recognizes the rare thyroid emergencies. A CNA does not diagnose thyroid disorders, does not give or adjust thyroid medication, and does not interpret lab results.',
                'By the end of this course, you will be able to: explain what the thyroid does, in plain language. Recognize the opposite signs of an underactive and overactive thyroid. Support medication timing and comfort. Recognize thyroid emergencies. And know your scope.',
                'There is a ten-question knowledge check at the end. Everything on it is covered here. Let\'s begin.',
              ].join('\n\n'),
            },
            {
              id: 'thy-s01-ci-text',
              type: 'text',
              body: [
                'This course teaches the CNA\'s role in supporting a resident with a thyroid disorder — understanding underactive and overactive thyroid, recognizing their very different daily signs, supporting medication timing and comfort, and recognizing the rare thyroid emergencies.',
                'Let\'s be clear about your role. A CNA observes and reports the signs of an unbalanced thyroid, supports medication timing and comfort, and recognizes the rare thyroid emergencies. A CNA does not diagnose thyroid disorders, does not give or adjust thyroid medication, and does not interpret lab results. Those are nursing and physician tasks. But none of them can happen without your careful observation and faithful reporting first.',
              ].join('\n\n'),
            },
            {
              id: 'thy-s01-ci-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of this course',
              body: 'CNAs OBSERVE, SUPPORT TIMING, MATCH COMFORT, and REPORT CHANGES. CNAs do not diagnose thyroid disorders, give or adjust thyroid medication, or interpret lab results.',
            },
            {
              id: 'thy-s01-lo-text',
              type: 'text',
              body: 'By the end of this course, you will be able to:',
            },
            {
              id: 'thy-s01-lo-summary',
              type: 'summary',
              title: 'Learning objectives',
              items: [
                'Explain what the thyroid does, in plain language.',
                'Recognize the opposite signs of an underactive and overactive thyroid.',
                'Support medication timing and comfort.',
                'Recognize thyroid emergencies.',
                'Know your scope — what a CNA does, and what a CNA must never do.',
              ],
            },
            {
              id: 'thy-s01-ii-text',
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
          doc('Key terms', [
            { id: 'thy-s02-heading', type: 'heading', level: 1, text: 'Key terms' },
            {
              id: 'thy-s02-image',
              type: 'image',
              src: `${ASSET_BASE}/s02-hero.jpg`,
              caption:
                'Key terms — hypothyroidism, hyperthyroidism, myxedema coma, thyroid storm.',
            },
            {
              id: 'thy-s02-reveal-thyroid-gland',
              type: 'reveal_card',
              frontTitle: 'Thyroid Gland',
              frontBody: 'THY-royd',
              backTitle: 'Thyroid Gland',
              backBody:
                'A small, butterfly-shaped gland in the front of the neck. It makes hormones that control metabolism — the speed at which the body uses energy. It influences nearly every organ, setting how fast or slow the body runs.',
            },
            {
              id: 'thy-s02-reveal-thyroid-hormones',
              type: 'reveal_card',
              frontTitle: 'Thyroid Hormones',
              frontBody: 'Thyroid hormones',
              backTitle: 'Thyroid Hormones',
              backBody:
                'The chemical messengers the thyroid makes that control metabolism — body temperature, heart rate, energy, weight, digestion, and even mood and thinking. Too little slows the body down; too much speeds it up.',
            },
            {
              id: 'thy-s02-reveal-hypothyroidism',
              type: 'reveal_card',
              frontTitle: 'Hypothyroidism (Underactive)',
              frontBody: 'Hy-po-THY-royd-ism',
              backTitle: 'Hypothyroidism (Underactive)',
              backBody:
                'An underactive thyroid — too little thyroid hormone. The body slows down. Signs include fatigue, feeling cold, weight gain, constipation, dry skin, slowed thinking, and low mood. "Hypo" means low. It\'s the most common thyroid problem in older adults.',
            },
            {
              id: 'thy-s02-reveal-hyperthyroidism',
              type: 'reveal_card',
              frontTitle: 'Hyperthyroidism (Overactive)',
              frontBody: 'Hy-per-THY-royd-ism',
              backTitle: 'Hyperthyroidism (Overactive)',
              backBody:
                'An overactive thyroid — too much thyroid hormone. The body speeds up. Signs include feeling hot, weight loss, a racing or irregular heartbeat, anxiety, tremor, and trouble sleeping. "Hyper" means high.',
            },
            {
              id: 'thy-s02-reveal-levothyroxine',
              type: 'reveal_card',
              frontTitle: 'Levothyroxine',
              frontBody: 'Lee-vo-thy-ROX-een',
              backTitle: 'Levothyroxine',
              backBody:
                'The most common medication for an underactive thyroid — a daily hormone replacement that does the job the thyroid can\'t. It works best taken at a consistent time, often in the morning on an empty stomach. Timing matters, and a CNA supports it.',
            },
            {
              id: 'thy-s02-reveal-goiter',
              type: 'reveal_card',
              frontTitle: 'Goiter',
              frontBody: 'GOY-ter',
              backTitle: 'Goiter',
              backBody:
                'An enlarged thyroid gland, which can cause a visible swelling in the front of the neck. A goiter can occur with either an underactive or overactive thyroid. A new or growing neck swelling is reported.',
            },
            {
              id: 'thy-s02-reveal-myxedema-coma',
              type: 'reveal_card',
              frontTitle: 'Myxedema Coma',
              frontBody: 'Mix-eh-DEE-mah',
              backTitle: 'Myxedema Coma',
              backBody:
                'A rare but life-threatening crisis of severe untreated underactive thyroid — the body slows dangerously: very low temperature, extreme drowsiness or unconsciousness, slow breathing. It\'s a medical emergency, often triggered by cold, illness, or missed medication.',
            },
            {
              id: 'thy-s02-reveal-thyroid-storm',
              type: 'reveal_card',
              frontTitle: 'Thyroid Storm',
              frontBody: 'Thyroid storm',
              backTitle: 'Thyroid Storm',
              backBody:
                'A rare but life-threatening crisis of severe overactive thyroid — the body races dangerously: high fever, a very fast or irregular heartbeat, agitation or confusion. It\'s a medical emergency, often triggered by illness, infection, or stress.',
            },
            {
              id: 'thy-s02-kc1-check-hypothyroidism',
              type: 'knowledge_check',
              question: 'Match the term: underactive thyroid — body slows down (tired, cold)',
              options: [
                { id: 'hypothyroidism', label: 'Hypothyroidism' },
                { id: 'hyperthyroidism', label: 'Hyperthyroidism' },
                { id: 'levothyroxine', label: 'Levothyroxine' },
              ],
              correctOptionId: 'hypothyroidism',
              explanation:
                'Hypothyroidism. An underactive thyroid — too little thyroid hormone. The body slows down. Signs include fatigue, feeling cold, weight gain, constipation, dry skin, slowed thinking, and low mood.',
              requiredForCompletion: true,
            },
            {
              id: 'thy-s02-kc1-check-hyperthyroidism',
              type: 'knowledge_check',
              question: 'Match the term: overactive thyroid — body speeds up (hot, racing heart)',
              options: [
                { id: 'hypothyroidism', label: 'Hypothyroidism' },
                { id: 'hyperthyroidism', label: 'Hyperthyroidism' },
                { id: 'levothyroxine', label: 'Levothyroxine' },
              ],
              correctOptionId: 'hyperthyroidism',
              explanation:
                'Hyperthyroidism. An overactive thyroid — too much thyroid hormone. The body speeds up. Signs include feeling hot, weight loss, a racing or irregular heartbeat, anxiety, tremor, and trouble sleeping.',
              requiredForCompletion: true,
            },
            {
              id: 'thy-s02-kc1-check-levothyroxine',
              type: 'knowledge_check',
              question: 'Match the term: daily thyroid hormone replacement, timing matters',
              options: [
                { id: 'hypothyroidism', label: 'Hypothyroidism' },
                { id: 'hyperthyroidism', label: 'Hyperthyroidism' },
                { id: 'levothyroxine', label: 'Levothyroxine' },
              ],
              correctOptionId: 'levothyroxine',
              explanation:
                'Levothyroxine. The most common medication for an underactive thyroid — a daily hormone replacement that does the job the thyroid can\'t. It works best taken at a consistent time, often in the morning on an empty stomach.',
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
            { id: 'thy-s03-heading', type: 'heading', level: 1, text: 'Statistics' },
            pendingAudio(
              'thy-s03-audio',
              'Thyroid Disorders: Common and Often Mistaken for Something Else',
              `${ASSET_BASE}/s03-stats-podcast.mp3`,
              [
                'Thyroid Disorders: Common and Often Mistaken for Something Else',
                '',
                'Thyroid disorders are among the most common hormone conditions, and they become more common with age. Tens of millions of Americans have a thyroid condition, many of them undiagnosed. The risk rises with age and is much higher in women — older women are especially likely to have an underactive thyroid. In a long-term care population, thyroid problems are very common, and underactive thyroid — hypothyroidism — is the most frequent.',
                '',
                'Here is what makes thyroid disorders so important for the CNA, and it\'s a recurring theme in elderly care: the signs are easily mistaken for other things. An underactive thyroid slows the body and mind — fatigue, weight gain, feeling cold, constipation, slowed thinking, and low mood. In an older adult, every one of those can be written off as depression, as early dementia, or simply as "getting old." An overactive thyroid speeds everything up — racing heart, anxiety, weight loss, restlessness — which can be mistaken for an anxiety disorder or a primary heart problem. In older adults especially, thyroid disorders can be subtle or show only a few signs, making them even easier to miss.',
                '',
                'The consequences of a missed or unbalanced thyroid are real. Untreated underactive thyroid worsens heart health, raises cholesterol, deepens depression and confusion, and in severe cases can lead to a life-threatening slowdown. Untreated overactive thyroid strains the heart, causes dangerous heart rhythms, weakens bones, and can lead to a life-threatening crisis. Even residents already on treatment can drift out of balance — too much or too little medication — and show these signs again.',
                '',
                'This is where the CNA matters enormously. Because you see residents every single day, you\'re positioned to notice the pattern that a once-a-month visit might miss: the resident who has become steadily more tired, cold, and foggy, or steadily more restless, hot, and thinner. Your observations, reported over time, are often what prompt the thyroid to be checked and rebalanced. And supporting consistent, correctly-timed medication keeps a treated resident steady.',
                '',
                'The bottom line: thyroid disorders are common, easily disguised as other conditions, and serious when unbalanced — and the CNA\'s daily observation and medication support are central to keeping residents in balance.',
              ].join('\n'),
              '/assets/courses/thyroid-disorders/s03-stats-podcast.mp3',
            ),
            {
              id: 'thy-s03-image',
              type: 'image',
              src: `${ASSET_BASE}/s03-hero.jpg`,
              caption:
                'Thyroid disorders are common in older adults — and easily mistaken for aging.',
            },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: 'Fundamentals',
        sortOrder: 3,
        buildContent: () =>
          doc('Fundamentals', [
            { id: 'thy-s04-heading', type: 'heading', level: 1, text: 'Fundamentals' },
            {
              id: 'thy-s04-video',
              type: 'video',
              title: 'Fundamentals',
              videoUrl: '/assets/courses/thyroid-disorders/s04-fundamentals.mp4',
              placeholderNote: 'Pending upload: /assets/courses/thyroid-disorders/s04-fundamentals.mp4',
            },
            {
              id: 'thy-s04-image',
              type: 'image',
              src: `${ASSET_BASE}/s04-hero.png`,
              caption:
                'Underactive and overactive are mirror opposites — everything slows down, or speeds up.',
            },
            {
              id: 'thy-s04-narration',
              type: 'text',
              body: [
                '**The body\'s speed control**',
                'The thyroid is a small gland in the neck with a big job: it controls metabolism, the speed at which the body uses energy. Through the hormones it makes, the thyroid influences body temperature, heart rate, weight, digestion, energy, and even mood and thinking. It\'s the body\'s speed control.',
                '**Too little: the body slows down**',
                'When the thyroid is underactive and makes too little hormone — hypothyroidism — the whole body slows. Like an engine idling too low. Metabolism drops, so the resident feels cold, tired, and sluggish, gains weight, and becomes constipated. Skin gets dry, the heart slows, and the mind can feel foggy and low. Everything runs in slow motion.',
                '**Too much: the body races**',
                'When the thyroid is overactive and makes too much hormone — hyperthyroidism — the body races. Like an engine revving too high. Metabolism surges, so the resident feels hot, loses weight despite eating, and feels restless and anxious. The heart races or beats irregularly, the hands may tremble, and sleep is hard. Everything runs too fast.',
                '**Opposite problems, opposite signs**',
                'Here\'s the key to recognizing thyroid problems: the two disorders are mirror opposites. Underactive is cold, slow, tired, gaining weight, constipated. Overactive is hot, fast, restless, losing weight, racing heart. Learning these as two opposite pictures makes them far easier to spot and tell apart.',
                '**Why they hide as other conditions**',
                'Thyroid signs overlap with other common conditions, which is why they hide. A slow thyroid\'s fatigue, weight gain, low mood, and slow thinking look like depression or dementia. A fast thyroid\'s racing heart, anxiety, and weight loss look like an anxiety disorder or a heart problem. In older adults, the signs can be subtle or few. This is why a CNA noticing the pattern over days is so valuable.',
                '**Treatment restores the balance**',
                'The good news: thyroid disorders are very treatable. An underactive thyroid is treated by replacing the missing hormone with a daily medication. An overactive thyroid is treated with medications that slow hormone production, or other therapies. With the right treatment, the body returns to a normal speed — and most residents feel dramatically better. Getting the dose right takes monitoring over time.',
                '**Balance can drift**',
                'Even a treated resident can drift out of balance — if the dose needs adjusting, if medication is missed, or as the body changes. So thyroid signs can reappear in someone already on treatment. The CNA\'s ongoing observation matters not just for finding new thyroid problems, but for catching when a treated resident has drifted too slow or too fast again.',
              ].join('\n\n'),
            },
            {
              id: 'thy-s04-opposites-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Mirror opposites',
              body: 'Underactive thyroid: cold, slow, tired, weight gain, constipation. Overactive thyroid: hot, fast, restless, weight loss, racing heart. Learn them as two opposite pictures.',
            },
          ]),
      },
    ],
  },
  {
    slug: 'module-2',
    title: 'Recognition, Prevention, and CNA Role',
    sortOrder: 1,
    lessons: [
      {
        slug: 's05-signs',
        title: 'Signs & Symptoms',
        sortOrder: 0,
        buildContent: () =>
          doc('Signs & Symptoms', [
            { id: 'thy-s05-heading', type: 'heading', level: 1, text: 'Signs & Symptoms' },
            {
              id: 'thy-s05-image',
              type: 'image',
              src: `${ASSET_BASE}/s05-hero.jpg`,
              caption:
                "Recognizing the drift — the slow decline that gets written off as 'just getting old.'",
            },
            {
              id: 'thy-s05-narration',
              type: 'text',
              body: [
                'The secret to recognizing thyroid problems is to learn them as two opposite pictures, plus the rare emergencies. Let\'s drill all three.',
                '**The underactive picture: cold and slow**',
                'Picture the underactive thyroid as the body in slow motion. The resident is unusually tired and sluggish, sleeping more. They feel cold when others are comfortable, often bundling up. They may gain weight without eating more. Constipation. Dry skin and thinning hair. A slow heartbeat. And the easily-missed signs: slowed thinking, poor memory, low mood, even a flat, depressed affect. A resident becoming steadily colder, slower, and foggier may have an underactive thyroid — report the pattern.',
                '**The overactive picture: hot and fast**',
                'Now the opposite — the body racing. The resident feels hot and sweaty when others are fine. They lose weight despite a good or increased appetite. Their heart races or feels irregular, sometimes pounding. They\'re restless, anxious, jittery, and irritable. Their hands may tremble. They have trouble sleeping. Their eyes may look more prominent. A resident becoming steadily hotter, more restless, and thinner, with a racing heart, may have an overactive thyroid — report the pattern.',
                '**The neck, and the slow drift**',
                'A couple of extra clues. Watch the neck — a new or growing swelling in the front of the neck, a goiter, can occur with either disorder and is reported. And watch for the slow drift in residents already on treatment: a treated resident who starts sliding back toward cold-and-slow, or toward hot-and-fast, may have drifted out of balance — their dose may need attention. Because these changes come gradually, your day-by-day familiarity is what catches them.',
                '**The rare emergencies**',
                'Rarely, an unbalanced thyroid becomes a crisis. On the underactive side, myxedema coma: a severe slowdown with a very low body temperature, extreme drowsiness sliding toward unconsciousness, and slow breathing — often triggered by cold, illness, or missed medication. On the overactive side, thyroid storm: a severe speed-up with high fever, a very fast or wildly irregular heartbeat, agitation, and confusion — often triggered by illness or stress. Both are life-threatening emergencies needing immediate help.',
                '**Summary**',
                'Three pictures. UNDERACTIVE: cold, tired, slow, weight gain, constipation, foggy, low mood. OVERACTIVE: hot, restless, weight loss, racing heart, tremor, anxious, sleepless. EMERGENCIES: very cold and unrousable (myxedema) or fever with racing heart and agitation (thyroid storm) — both need help now.',
                'The rule underneath it all: thyroid problems are mirror opposites and easy to disguise — so when a resident drifts steadily toward cold-and-slow or hot-and-fast, report the pattern.',
              ].join('\n\n'),
            },
            {
              id: 'thy-s05-drift-callout',
              type: 'callout',
              variant: 'warning',
              title: 'Report the pattern',
              body: 'When a resident drifts steadily toward cold-and-slow or hot-and-fast — even on treatment — report the pattern. Thyroid signs hide as depression, dementia, anxiety, or aging.',
            },
          ]),
      },
      {
        slug: 's06-causes',
        title: 'Causes',
        sortOrder: 1,
        buildContent: () =>
          doc('Causes', [
            { id: 'thy-s06-heading', type: 'heading', level: 1, text: 'Causes' },
            pendingAudio(
              'thy-s06-audio',
              'What Causes Thyroid Disorders — and What Throws Them Off Balance?',
              `${ASSET_BASE}/s06-causes-podcast.mp3`,
              [
                'What Causes Thyroid Disorders — and What Throws Them Off Balance?',
                '',
                'Thyroid disorders have several causes, and while a CNA doesn\'t need to diagnose them, a little understanding helps the care make sense.',
                '',
                'The most common cause of an underactive thyroid is an autoimmune condition, where the body\'s immune system gradually damages the thyroid so it makes less and less hormone. It can also result from thyroid surgery, certain treatments, some medications, or simply the changes of aging. An overactive thyroid is often caused by a different autoimmune condition that overstimulates the gland, or by nodules in the thyroid that make excess hormone. Importantly, these causes are generally not anyone\'s fault — they\'re conditions that happen, deserving care without blame.',
                '',
                'For the CNA, the more useful question is what can throw a resident\'s thyroid balance off — because those are the things to watch for and report.',
                '',
                'The biggest one is medication: thyroid balance depends on the right dose taken consistently. A missed dose, a dose taken inconsistently, or a dose that\'s become wrong for the resident\'s body can tip them out of balance. The most common thyroid medication is also sensitive to timing and to being taken with certain foods, supplements like calcium or iron, or other medications too close together — which can reduce how well it\'s absorbed. This is why timing and consistency matter, and why the CNA\'s support of the routine is genuinely important.',
                '',
                'Illness is another destabilizer, just as it is with blood sugar. When a resident with a thyroid disorder becomes ill — especially with an infection — it can push them toward a crisis, particularly the rare emergencies. Cold exposure can be dangerous for a resident with severe underactive thyroid. And stress can aggravate an overactive thyroid.',
                '',
                'Here\'s what this means for the CNA. You can\'t change the underlying cause, but you have real influence over balance: supporting consistent, correctly-timed medication, reporting missed doses, watching closely during illness, keeping residents with underactive thyroid warm enough, and noticing and reporting the gradual signs of drifting out of balance. Your daily attention is what helps keep a treated resident steady — and what catches a new or worsening problem early.',
              ].join('\n'),
              '/assets/courses/thyroid-disorders/s06-causes-podcast.mp3',
            ),
            {
              id: 'thy-s06-image',
              type: 'image',
              src: `${ASSET_BASE}/s06-hero.jpg`,
              caption:
                'What causes thyroid disease — and what makes it suddenly dangerous.',
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
              id: 'thy-s07-heading',
              type: 'heading',
              level: 1,
              text: 'CNA Role & Best Practices',
            },
            {
              id: 'thy-s07-image',
              type: 'image',
              src: `${ASSET_BASE}/s07-hero.jpg`,
              caption:
                'CNA scope — support medication timing, watch, report; never adjust thyroid medication.',
            },
            {
              id: 'thy-s07-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of practice',
              body: 'CNAs SUPPORT TIMING, MATCH COMFORT, and REPORT. CNAs never give or adjust thyroid medication or interpret lab results.',
            },
            {
              id: 'thy-s07-narration',
              type: 'text',
              body: [
                'Thyroid treatment is about restoring balance, and the CNA supports it through medication timing, comfort, and observation — never by touching a dose. Let\'s walk through it, starting as always with the rule that never bends. A CNA does not give or adjust thyroid medication, and does not interpret lab results.',
                '**Treating an underactive thyroid — and the timing that matters.** An underactive thyroid is treated by replacing the missing hormone, most commonly with levothyroxine, taken once daily. Here\'s the practical part the CNA supports: this medication works best when taken consistently, usually in the morning, often on an empty stomach about thirty to sixty minutes before breakfast — and away from certain other things like calcium or iron supplements and some other medications, which can block its absorption. You don\'t give the medication, but you support the routine the nurse sets: helping the resident be ready at the right time, supporting the empty-stomach timing where that\'s the plan, and reporting if doses are missed or if meals and the medication are colliding. Consistent timing keeps the resident in balance.',
                '**Treating an overactive thyroid.** An overactive thyroid is treated with medications that reduce hormone production, and sometimes with other therapies managed by the doctor. As always, you support the routine and report — never give or adjust. Watch and report whether the racing, restless signs are improving or worsening.',
                '**Monitoring over time.** Getting the thyroid dose right takes blood tests over time, ordered and interpreted by the medical team. You don\'t interpret labs — but your observations between tests are valuable. Reporting that a resident seems to be drifting back toward cold-and-slow or hot-and-fast helps the team know when the dose may need rechecking.',
                '**Comfort care for the opposite problems.** Comfort care differs for the two. For an underactive, cold-and-slow resident: keep them warm with layers and blankets, support gentle activity, and help with constipation through fluids, fiber, and movement as the plan allows. For an overactive, hot-and-fast resident: keep them cool and comfortable, provide a calm low-stress environment, support rest, and ensure adequate nutrition since they burn energy fast. Matching comfort to the problem genuinely helps.',
                'The scope point for this section: you never give or adjust thyroid medication or read labs — but you support the all-important timing, provide comfort matched to the problem, and report the signs of drifting balance.',
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
            { id: 'thy-s08-heading', type: 'heading', level: 1, text: 'Prevention & Risk Reduction' },
            {
              id: 'thy-s08-image',
              type: 'image',
              src: `${ASSET_BASE}/s08-hero.jpg`,
              caption:
                'Prevention — consistent medication timing, comfort measures, and watching for change.',
            },
            {
              id: 'thy-s08-narration',
              type: 'text',
              body: [
                'With thyroid disorders, the CNA\'s prevention work is keeping a treated resident in balance and catching problems early. Here are seven ways.',
                '**One. Support consistent medication timing.** Thyroid balance depends on the right dose taken the same way every day. Support the timing the nurse sets — including the empty-stomach timing for levothyroxine where that\'s the plan — help the resident be ready, and report missed doses or timing problems immediately. Consistency is the heart of staying balanced.',
                '**Two. Watch for medication-meal collisions.** Because the common thyroid medication can be blocked by food, calcium, iron, and certain other medications taken too close together, notice and report when these collide — for instance, if breakfast or a supplement is landing right on top of the thyroid pill. Flagging this helps the team protect the medication\'s effect.',
                '**Three. Notice the slow drift, and report the pattern.** Thyroid changes come gradually. Stay alert to a resident sliding steadily toward cold-and-slow, or toward hot-and-fast, even one already on treatment. Report the pattern over days — your day-by-day familiarity is what catches a drift a brief visit would miss.',
                '**Four. Keep underactive residents warm and moving.** A cold-and-slow resident genuinely suffers from the cold and from constipation. Provide warmth with layers and blankets, support gentle activity, and support bowel regularity with fluids, fiber, and movement as the plan allows. Comfort matched to the slow thyroid.',
                '**Five. Keep overactive residents cool, calm, and nourished.** A hot-and-fast resident needs the opposite: cool comfort, a calm low-stress environment, support for rest and sleep, and good nutrition because their racing metabolism burns through energy. Reducing stress genuinely helps an overactive thyroid.',
                '**Six. Treat illness as a watch point.** As with blood sugar, illness can tip a thyroid resident toward crisis. Report illness, fever, or infection promptly, and watch more closely during sick days — especially for the rare emergencies. Don\'t treat illness in a thyroid resident as routine.',
                '**Seven. Protect against the emergency triggers.** For severe underactive thyroid, protect against dangerous cold and report any missed medication, since both can trigger a crisis. For overactive thyroid, reduce stress and watch during illness. Knowing each resident\'s thyroid status helps you protect against their particular risk.',
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
              id: 'thy-s09-heading',
              type: 'heading',
              level: 1,
              text: 'Scenario & Reporting',
            },
            pendingAudio(
              'thy-s09-intro-audio',
              'Emergency response scenarios intro',
              `${ASSET_BASE}/s09-emergency-intro.mp3`,
              'With thyroid disorders, the two judgments that matter most are recognizing the gradual drift out of balance and reporting the pattern, and recognizing the rare but deadly thyroid emergencies. You\'re about to work through two situations. Read each carefully, choose your action, and you\'ll get feedback right away. Keep the core idea in mind: thyroid problems are mirror opposites, and a steady drift toward cold-and-slow or hot-and-fast is worth reporting.',
              '/assets/courses/thyroid-disorders/s09-emergency-intro.mp3',
            ),
            {
              id: 'thy-s09-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-hero.jpg`,
              caption:
                'Two thyroid judgments — a gradual drift, and a storm that cannot wait.',
            },
            {
              id: 'thy-s09-scenario-calloway-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-scenario-calloway.jpg`,
              caption:
                "Slowing down, colder, more confused over weeks: report the drift — it's not just aging.",
            },
            {
              id: 'thy-s09-scenario-calloway',
              type: 'scenario_question',
              prompt:
                'Mrs. Calloway takes thyroid medication for an underactive thyroid and has been stable for a long time. Over the past few weeks, you\'ve noticed she\'s become steadily more tired and sleeps more, complains of feeling cold when the room is warm, seems slower in her thinking, and has been constipated. She\'s not in distress, but this is a clear change from her usual self. What SHOULD the CNA do?',
              options: [
                {
                  id: 'assume-aging',
                  label: 'Assume she\'s just getting older and say nothing',
                  feedback:
                    'This gradual slide toward more tired, cold, slow, and constipated is a classic sign of an underactive thyroid drifting out of balance — not just aging. Dismissing it, pushing exercise, or waiting months lets her stay unbalanced and unwell. The right action: report the pattern to the nurse so her thyroid can be rechecked.',
                },
                {
                  id: 'report-pattern',
                  label:
                    'Report the pattern — increasing tiredness, cold, slow thinking, constipation — to the nurse',
                  feedback:
                    'Right. Steadily increasing tiredness, feeling cold, slowed thinking, and constipation in a resident with an underactive thyroid is a classic pattern of drifting out of balance — her medication dose may no longer be right, or doses may be getting missed or blocked. It\'s easy to dismiss as "just aging," but that\'s exactly the trap. Report the pattern to the nurse, who can have her thyroid rechecked. Your day-by-day familiarity is what makes this gradual drift visible — a quick visit might miss it entirely.',
                  isRecommended: true,
                },
                {
                  id: 'exercise-more',
                  label: 'Tell her to exercise more to wake herself up',
                  feedback:
                    'This gradual slide toward more tired, cold, slow, and constipated is a classic sign of an underactive thyroid drifting out of balance — not just aging. Dismissing it, pushing exercise, or waiting months lets her stay unbalanced and unwell. The right action: report the pattern to the nurse so her thyroid can be rechecked.',
                },
                {
                  id: 'wait-months',
                  label: 'Wait several more months to see if it continues',
                  feedback:
                    'This gradual slide toward more tired, cold, slow, and constipated is a classic sign of an underactive thyroid drifting out of balance — not just aging. Dismissing it, pushing exercise, or waiting months lets her stay unbalanced and unwell. The right action: report the pattern to the nurse so her thyroid can be rechecked.',
                },
              ],
              requiredForCompletion: true,
            },
            {
              id: 'thy-s09-scenario-bianchi-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-scenario-bianchi.jpg`,
              caption:
                'Racing heart, fever, agitation: thyroid storm is an emergency — get help now.',
            },
            {
              id: 'thy-s09-scenario-bianchi',
              type: 'scenario_question',
              prompt:
                'Mr. Bianchi has an overactive thyroid and has had a fever and infection for two days. This afternoon he suddenly becomes much worse: his temperature is very high, his heart is racing and feels irregular, he\'s agitated and confused, and he seems very unwell. What is the BEST action?',
              options: [
                {
                  id: 'assume-infection',
                  label: 'Assume it\'s just his infection and wait',
                  feedback:
                    'A very high fever, racing irregular heart, agitation, and confusion in an overactive-thyroid resident with an infection can be thyroid storm — a life-threatening emergency. Waiting, medicating, or just resting him could be fatal. The right action: recognize the possible thyroid emergency and activate emergency help immediately, reporting his thyroid condition and recent infection.',
                },
                {
                  id: 'emergency-now',
                  label:
                    'Recognize this as a possible thyroid emergency and activate emergency help immediately',
                  feedback:
                    'Exactly right. A very high fever, a racing and irregular heartbeat, agitation, and confusion in a resident with an overactive thyroid — especially triggered by an infection — can be thyroid storm, a rare but life-threatening crisis where the body races dangerously out of control. This is an emergency: activate emergency help immediately, stay with him, keep him safe, and report his overactive thyroid and his recent infection. Never give thyroid medication on your own. Fast recognition and escalation are what save a resident in thyroid storm.',
                  isRecommended: true,
                },
                {
                  id: 'give-medication',
                  label: 'Give him his thyroid medication',
                  feedback:
                    'A very high fever, racing irregular heart, agitation, and confusion in an overactive-thyroid resident with an infection can be thyroid storm — a life-threatening emergency. Waiting, medicating, or just resting him could be fatal. The right action: recognize the possible thyroid emergency and activate emergency help immediately, reporting his thyroid condition and recent infection.',
                },
                {
                  id: 'rest-recheck',
                  label: 'Encourage him to rest and recheck in a few hours',
                  feedback:
                    'A very high fever, racing irregular heart, agitation, and confusion in an overactive-thyroid resident with an infection can be thyroid storm — a life-threatening emergency. Waiting, medicating, or just resting him could be fatal. The right action: recognize the possible thyroid emergency and activate emergency help immediately, reporting his thyroid condition and recent infection.',
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
            { id: 'thy-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
              id: 'thy-s10-video',
              type: 'video',
              title: "The CNA's Role",
              videoUrl: '/assets/courses/thyroid-disorders/s10-cna-role.mp4',
              placeholderNote: 'Pending upload: /assets/courses/thyroid-disorders/s10-cna-role.mp4',
            },
            {
              id: 'thy-s10-image',
              type: 'image',
              src: `${ASSET_BASE}/s10-hero.png`,
              caption:
                'The CNA as the daily watch — catching what a lab result alone would miss.',
            },
            {
              id: 'thy-s10-narration',
              type: 'text',
              body: [
                'Your role in thyroid care is observation, medication timing support, matched comfort, and emergency recognition. Let\'s walk through it.',
                '**Support the all-important timing** Medication timing is where you most directly affect a thyroid resident\'s balance. Support the routine the nurse sets — especially the empty-stomach, consistent-time approach for levothyroxine where that\'s the plan. Help the resident be ready at the right moment, support the timing away from breakfast and from calcium or iron, and report missed doses or meal-medication collisions immediately. Small as it seems, this timing keeps a resident in balance.',
                '**Be the pattern-watcher** Your daily presence makes you the pattern-watcher. Learn each resident\'s normal, and watch for the slow drift — toward cold, tired, slow, and constipated, or toward hot, restless, racing, and thinner. Because thyroid changes come gradually, you\'re positioned to notice what a monthly visit can\'t. Report the pattern over days, and remember: don\'t dismiss these changes as depression, dementia, or aging without them being checked.',
                '**Match comfort to the problem** Provide comfort matched to the opposite problems. For the cold-and-slow resident: warmth, layers, blankets, gentle activity, and constipation support. For the hot-and-fast resident: cool comfort, a calm low-stress environment, rest, and good nutrition for their racing metabolism. Matching your care to whether the thyroid is slow or fast genuinely improves how the resident feels.',
                '**Recognize the emergencies and report** Know the rare emergencies. A severely underactive resident who becomes very cold, extremely drowsy, and hard to rouse — possible myxedema coma. A severely overactive resident with high fever, racing irregular heart, and agitation — possible thyroid storm. Both are emergencies: activate help immediately. And report faithfully — gradual changes, missed doses, illness, and the key facts that help the team.',
                'Now the boundary. You do not diagnose thyroid disorders. You never give or adjust thyroid medication, and never interpret lab results. And you never dismiss a steady drift toward slow-and-cold or hot-and-fast as just aging without it being checked.',
                'Inside your role — support the timing, watch the patterns, match the comfort, recognize the emergencies, and report faithfully — you keep residents with thyroid disorders in balance and catch trouble early. For a condition that hides in plain sight, an observant CNA is invaluable.',
              ].join('\n\n'),
            },
            {
              id: 'thy-s10-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Stay within scope',
              body: 'You do not diagnose thyroid disorders. You never give or adjust thyroid medication, and never interpret lab results. And you never dismiss a steady drift toward slow-and-cold or hot-and-fast as just aging without it being checked.',
            },
          ]),
      },
      {
        slug: 's11-case-study',
        title: 'Case Study',
        sortOrder: 2,
        buildContent: () => {
          const caseNarrative = [
            'Mrs. Calloway, 81, had taken thyroid medication for an underactive thyroid for years and had always been bright, chatty, and quick with a card-game strategy. Her CNA, Priya, had cared for her for two years and knew her sharp, warm personality well.',
            '',
            '**The gradual change:** Over several weeks, Priya noticed Mrs. Calloway slipping. She was more tired, dozing in her chair through the afternoon card games she used to lead. She kept asking for an extra blanket even when the room was warm, complaining of being cold. Her thinking seemed slower — she lost track of conversations she\'d once steered, and seemed flatter, lower in mood. And she\'d become constipated, which was new for her. Each change was small. The staff who saw her occasionally said she was "just getting older," and even Mrs. Calloway\'s family wondered if she was "slowing down" or "getting a bit of dementia."',
            '',
            '**What Priya noticed:** But Priya, who saw her every day, saw it differently. She wasn\'t watching a single bad day — she was watching a steady slide, and the pieces formed a picture she recognized from her thyroid training: more tired, cold all the time, slowed thinking, low mood, constipation. That was the underactive-thyroid pattern, drifting out of balance. And Mrs. Calloway was on thyroid medication — so maybe her dose had drifted wrong, or something was interfering with it.',
            '',
            '**What Priya did:** Priya reported the pattern to the nurse, specifically and over time: "Over the last few weeks Mrs. Calloway has gotten steadily more tired, she\'s cold all the time even in a warm room, her thinking is slower, her mood is flatter, and she\'s newly constipated. This looks like her thyroid might be drifting underactive. Could it be checked?" She didn\'t diagnose — she reported the pattern and her observation.',
            '',
            '**The discovery:** The nurse agreed it was worth checking and informed the doctor. Blood tests confirmed Priya\'s read: Mrs. Calloway\'s thyroid had indeed drifted underactive — her dose needed adjusting. As it happened, she\'d also recently started a calcium supplement that was being taken too close to her thyroid pill, blunting its absorption. Both were corrected.',
            '',
            '**The outcome:** Within a few weeks of the adjustments, Mrs. Calloway came back to herself — warmer, more energetic, sharp at the card table again, her mood lifted, the constipation resolved. What had looked to others like "getting old" or "early dementia" was a treatable, drifting thyroid all along. The nurse told Priya: "Everyone else saw an old lady slowing down. You saw a pattern and a thyroid. You gave her back her card games."',
            '',
            '**Discussion:** Priya\'s gift was exactly what this course teaches: daily familiarity plus pattern recognition. She didn\'t see one symptom on one day — she saw a steady drift toward cold, slow, tired, foggy, and constipated, recognized the underactive-thyroid picture, connected it to a resident already on thyroid medication, and even helped surface the supplement timing problem by reporting carefully. She never diagnosed, never touched the dose, never read a lab. She watched, recognized, and reported a pattern — and rescued a sharp woman from being written off as "just old."',
          ].join('\n');

          return doc('Brief Case Study', [
            { id: 'thy-s11-heading', type: 'heading', level: 1, text: 'Brief Case Study' },
            pendingAudio(
              'thy-s11-audio',
              'Not Just Getting Old',
              `${ASSET_BASE}/s11-case-podcast.mp3`,
              caseNarrative,
              '/assets/courses/thyroid-disorders/s11-case-podcast.mp3',
            ),
            {
              id: 'thy-s11-image',
              type: 'image',
              src: `${ASSET_BASE}/s11-hero.jpg`,
              caption:
                'Recognizing the pattern — how a thyroid problem was caught in time.',
            },
            {
              id: 'thy-s11-case-study',
              type: 'case_study',
              title: 'Not Just Getting Old',
              residentProfile:
                'Mrs. Calloway, 81, had taken thyroid medication for an underactive thyroid for years and had always been bright, chatty, and quick with a card-game strategy. Her CNA, Priya, had cared for her for two years and knew her sharp, warm personality well.',
              scenario: [
                '**The gradual change:** Over several weeks, Priya noticed Mrs. Calloway slipping. She was more tired, dozing in her chair through the afternoon card games she used to lead. She kept asking for an extra blanket even when the room was warm, complaining of being cold. Her thinking seemed slower — she lost track of conversations she\'d once steered, and seemed flatter, lower in mood. And she\'d become constipated, which was new for her. Each change was small. The staff who saw her occasionally said she was "just getting older," and even Mrs. Calloway\'s family wondered if she was "slowing down" or "getting a bit of dementia."',
                '**What Priya noticed:** But Priya, who saw her every day, saw it differently. She wasn\'t watching a single bad day — she was watching a steady slide, and the pieces formed a picture she recognized from her thyroid training: more tired, cold all the time, slowed thinking, low mood, constipation. That was the underactive-thyroid pattern, drifting out of balance. And Mrs. Calloway was on thyroid medication — so maybe her dose had drifted wrong, or something was interfering with it.',
                '**What Priya did:** Priya reported the pattern to the nurse, specifically and over time: "Over the last few weeks Mrs. Calloway has gotten steadily more tired, she\'s cold all the time even in a warm room, her thinking is slower, her mood is flatter, and she\'s newly constipated. This looks like her thyroid might be drifting underactive. Could it be checked?" She didn\'t diagnose — she reported the pattern and her observation.',
                '**The discovery:** The nurse agreed it was worth checking and informed the doctor. Blood tests confirmed Priya\'s read: Mrs. Calloway\'s thyroid had indeed drifted underactive — her dose needed adjusting. As it happened, she\'d also recently started a calcium supplement that was being taken too close to her thyroid pill, blunting its absorption. Both were corrected.',
                '**The outcome:** Within a few weeks of the adjustments, Mrs. Calloway came back to herself — warmer, more energetic, sharp at the card table again, her mood lifted, the constipation resolved. What had looked to others like "getting old" or "early dementia" was a treatable, drifting thyroid all along. The nurse told Priya: "Everyone else saw an old lady slowing down. You saw a pattern and a thyroid. You gave her back her card games."',
                '**Discussion:** Priya\'s gift was exactly what this course teaches: daily familiarity plus pattern recognition. She didn\'t see one symptom on one day — she saw a steady drift toward cold, slow, tired, foggy, and constipated, recognized the underactive-thyroid picture, connected it to a resident already on thyroid medication, and even helped surface the supplement timing problem by reporting carefully. She never diagnosed, never touched the dose, never read a lab. She watched, recognized, and reported a pattern — and rescued a sharp woman from being written off as "just old."',
              ].join('\n\n'),
            },
            {
              id: 'thy-s11-reflection-1',
              type: 'reflection',
              prompt:
                'Several people, including family, thought Mrs. Calloway was "just getting old" or developing dementia. What let Priya see an underactive-thyroid pattern instead, and why is a CNA\'s daily familiarity so powerful for catching it?',
              minCharacters: 50,
            },
            {
              id: 'thy-s11-reflection-2',
              type: 'reflection',
              prompt:
                'Part of the problem was a calcium supplement taken too close to the thyroid medication. Why does medication timing matter so much for thyroid balance, and how does a CNA support it?',
              minCharacters: 50,
            },
            {
              id: 'thy-s11-rp-text',
              type: 'text',
              body: 'Reflect on the case study in the previous lesson. Your written responses help you apply what you learned about recognizing the underactive-thyroid pattern, supporting medication timing, and reporting gradual drift instead of dismissing it as aging.',
            },
            {
              id: 'thy-s11-kc2-check',
              type: 'knowledge_check',
              question:
                'A CNA does not give or adjust thyroid medication, and does not interpret lab results. When a resident on thyroid medication gradually becomes more tired, cold, slow-thinking, and constipated, the CNA SHOULD:',
              options: [
                {
                  id: 'assume-aging',
                  label: 'Assume it is just aging and say nothing',
                },
                {
                  id: 'report-pattern',
                  label: 'Report the pattern to the nurse',
                },
                {
                  id: 'exercise-more',
                  label: 'Tell them to exercise more to wake themselves up',
                },
                {
                  id: 'wait-months',
                  label: 'Wait several months to see if it continues',
                },
              ],
              correctOptionId: 'report-pattern',
              explanation:
                'Report the pattern to the nurse. Steadily increasing tiredness, feeling cold, slowed thinking, and constipation in a resident with an underactive thyroid is a classic pattern of drifting out of balance. You never give or adjust thyroid medication or interpret lab results.',
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
            { id: 'thy-s12-heading', type: 'heading', level: 1, text: 'Conclusion' },
            {
              id: 'thy-s12-video',
              type: 'video',
              title: 'Conclusion',
              videoUrl: '/assets/courses/thyroid-disorders/s12-conclusion.mp4',
              placeholderNote: 'Pending upload: /assets/courses/thyroid-disorders/s12-conclusion.mp4',
            },
            {
              id: 'thy-s12-image',
              type: 'image',
              src: `${ASSET_BASE}/s12-hero.jpg`,
              caption: 'Five things that matter most in thyroid care.',
            },
            {
              id: 'thy-s12-narration',
              type: 'text',
              body: [
                'You\'ve reached the end — and you\'ve completed the endocrine series. Let\'s lock in the five things that matter most for thyroid care.',
                '**One.** The thyroid sets the body\'s speed. An underactive thyroid slows everything down — cold, tired, weight gain, constipation, slow thinking, low mood. An overactive thyroid speeds everything up — hot, restless, weight loss, racing heart, tremor, sleepless. They\'re mirror opposites.',
                '**Two.** Thyroid problems hide as other conditions. A slow thyroid looks like depression, dementia, or aging; a fast thyroid looks like anxiety or a heart problem. Because you see residents daily, you\'re positioned to notice the real pattern — so don\'t dismiss a steady drift toward cold-and-slow or hot-and-fast as "just getting old."',
                '**Three.** Support the medication timing. Thyroid balance depends on consistent, correctly-timed medication — and levothyroxine often works best on an empty stomach, away from breakfast, calcium, iron, and other medications. Support the timing the nurse sets, and report missed doses and meal-medication collisions.',
                '**Four.** Match comfort to the problem, and know the emergencies. Keep the cold-and-slow resident warm and moving; keep the hot-and-fast resident cool, calm, and nourished. And recognize the rare crises — very cold and unrousable (myxedema coma) or fever with racing heart and agitation (thyroid storm) — as emergencies needing help now.',
                '**Five.** Honor your scope. You never diagnose, give or adjust thyroid medication, or interpret labs. But you support timing, provide matched comfort, watch the patterns, recognize the emergencies, and report faithfully — and that observant daily care keeps residents in balance.',
              ].join('\n\n'),
            },
            {
              id: 'thy-s12-summary',
              type: 'summary',
              title: 'Five things that matter most',
              items: [
                'The thyroid sets the body\'s speed — underactive slows, overactive races; they are mirror opposites.',
                'Thyroid problems hide as depression, dementia, anxiety, or aging — report a steady drift toward cold-and-slow or hot-and-fast.',
                'Support consistent medication timing — levothyroxine often works best on an empty stomach, away from calcium, iron, and other meds.',
                'Match comfort to the problem and know the emergencies — myxedema coma and thyroid storm need help now.',
                'Honor your scope — observe, support timing, match comfort, and report; never diagnose, medicate, or read labs.',
              ],
            },
            {
              id: 'thy-s12-whn-text',
              type: 'text',
              body: 'Ten questions are waiting. Everything on them was covered here. You\'re ready. Trust what you\'ve learned, and show what you know.',
            },
            {
              id: 'thy-s12-completion-text',
              type: 'text',
              body: 'This course provides one hour of continuing education credit through CAL ACE Nursing Academy, an approved CDPH continuing education provider, NAC number 7384. Your certificate is generated automatically when you pass the knowledge check.',
            },
            {
              id: 'thy-s12-completion-callout',
              type: 'callout',
              variant: 'info',
              title: 'Scope reminder',
              body: 'CNAs observe, support timing, match comfort, and report. CNAs do not diagnose thyroid disorders, give or adjust thyroid medication, or interpret lab results.',
            },
            {
              id: 'thy-s12-certificate-text',
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

export async function seedCourse28ThyroidDisorders(
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
  console.log(`Seeding Course 28 (Thyroid Disorders) as DRAFT — slug "${COURSE_SLUG}"…`);

  try {
    const result = await seedCourse28ThyroidDisorders(prisma);
    const blockCounts = blockCountsByLesson();
    const totalBlocks = Object.values(blockCounts).reduce((sum, count) => sum + count, 0);

    console.log('Seed complete.');
    console.log(`  Course:   ${COURSE_TITLE}`);
    console.log(`  Slug:     ${COURSE_SLUG}`);
    console.log(`  Created:  ${result.courseCreated ? 'yes (new)' : 'no (updated existing)'}`);
    console.log(`  Modules:  ${result.modulesUpserted}`);
    console.log(`  Lessons:  ${result.lessonsUpserted}`);
    console.log(`  Strays cleaned: ${result.strayLessonsDeleted} lessons`);
    console.log(`  Blocks:   ${totalBlocks} total`);
    console.log(`  Sections: ${PACKAGE_SECTION_LESSON_SLUGS.length} package sections mapped`);
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
