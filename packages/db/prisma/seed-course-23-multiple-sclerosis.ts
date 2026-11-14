/**
 * Seed Course 23 — Caring for a Resident with Multiple Sclerosis (DRAFT).
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-23-multiple-sclerosis
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
const COURSE_SLUG = 'multiple-sclerosis';
const COURSE_TITLE = 'Multiple Sclerosis: Fatigue, Mobility, and Care Support';
const COURSE_SUMMARY =
  'Learn to support a resident living with multiple sclerosis — understanding its changing symptoms, managing heat sensitivity and fatigue, supporting safe mobility and dignity, and recognizing a possible relapse. CNAs do not diagnose MS, give or adjust medications, or perform therapy.';

const ASSET_BASE = `/assets/courses/multiple-sclerosis`;

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
    'Explain what MS is, in plain language',
    'Recognize its common symptoms and how they change',
    'Manage heat sensitivity and MS fatigue in daily care',
    'Recognize a possible relapse',
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
  heroImage: '/assets/courses/multiple-sclerosis/hero-banner.png',
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
    title: 'Understanding Multiple Sclerosis',
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: 'Introduction',
        sortOrder: 0,
        buildContent: () =>
          doc('Introduction', [
            { id: 'ms-s01-heading', type: 'heading', level: 1, text: 'Welcome' },
            {
              id: 'ms-s01-video',
              type: 'video',
              title: 'Introduction',
              videoUrl: '/assets/courses/multiple-sclerosis/s01-intro.mp4',
              placeholderNote: 'Pending upload: /assets/courses/multiple-sclerosis/s01-intro.mp4',
            },
            {
              id: 'ms-s01-image',
              type: 'image',
              src: '/assets/courses/multiple-sclerosis/s01-hero.jpg',
              caption: 'A CAL ACE CNA supporting a resident living with multiple sclerosis.',
            },
            {
              id: 'ms-s01-narration',
              type: 'text',
              body: [
                'Welcome to CAL ACE Nursing Academy.',
                'This course is about multiple sclerosis — M-S — and how to care well for a resident living with it.',
                'Multiple sclerosis is a disease where the body\'s own immune system attacks the protective coating around the nerves in the brain and spinal cord. Picture the nerves as electrical wires, and that coating as the insulation around them. When the insulation is damaged, the signals traveling through the wires slow down, get scrambled, or stop. Depending on which wires are damaged, almost any function can be affected — movement, vision, feeling, balance, bladder control, thinking, energy.',
                'That\'s why MS is sometimes called the snowflake disease: no two people with MS are alike. One resident may walk with a cane and tire easily. Another may use a wheelchair and have vision problems. The same resident may be capable in the morning and exhausted by afternoon — or fine this week and struggling next week. Caring for MS means caring for a condition that changes, and adjusting with it.',
                'Here\'s something else that makes MS different in long-term care. MS usually begins between the ages of twenty and forty. So a resident with advanced MS may be decades younger than your other residents — a person in their forties or fifties living in long-term care. That reality carries its own emotional weight, and your respect for their adulthood, independence, and dignity matters enormously.',
                'This course teaches one care point you may never have heard of, and it changes daily care completely: heat sensitivity. For most people with MS, heat — a hot bath, a warm room, a summer day — temporarily makes their symptoms worse. Sometimes dramatically. You\'ll learn why, and how something as simple as a lukewarm bath instead of a hot one is real MS care.',
                'Your scope is clear. A CNA supports safe mobility, manages heat and fatigue, protects skin and dignity, recognizes changes that may signal a relapse, and reports faithfully. A CNA does not diagnose MS, does not give or adjust medications, and does not perform therapy.',
                'By the end of this course, you will be able to: explain what MS is, in plain language. Recognize its common symptoms and how they change. Manage heat sensitivity and MS fatigue in daily care. Recognize a possible relapse. And know your scope.',
                'There is a ten-question knowledge check at the end. Everything on it is covered here. Let\'s begin.',
              ].join('\n\n'),
            },
            {
              id: 'ms-s01-course-information-text',
              type: 'text',
              body: [
                'This course teaches the CNA\'s role in supporting a resident living with multiple sclerosis — understanding its changing symptoms, managing heat sensitivity and fatigue, supporting safe mobility and dignity, and recognizing a possible relapse.',
                'Let\'s be clear about your role. A CNA supports safe mobility, manages heat and fatigue, protects skin and dignity, recognizes changes that may signal a relapse, and reports faithfully. A CNA does not diagnose MS, does not give or adjust medications, and does not perform therapy. Those are nursing and physician tasks. But none of them can happen without your careful observation and faithful reporting first.',
              ].join('\n\n'),
            },
            {
              id: 'ms-s01-course-information-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of this course',
              body: 'CNAs SUPPORT, OBSERVE, COOL, and REPORT. CNAs do not diagnose MS, give or adjust medications, or perform therapy.',
            },
            {
              id: 'ms-s01-learning-objectives-text',
              type: 'text',
              body: 'By the end of this course, you will be able to:',
            },
            {
              id: 'ms-s01-learning-objectives-summary',
              type: 'summary',
              title: 'Learning objectives',
              items: [
                'Explain what MS is, in plain language.',
                'Recognize its common symptoms and how they change.',
                'Manage heat sensitivity and MS fatigue in daily care.',
                'Recognize a possible relapse.',
                'Know your scope — what a CNA does, and what a CNA must never do.',
              ],
            },
            {
              id: 'ms-s01-instructor-intro-text',
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
            { id: 'ms-s02-heading', type: 'heading', level: 1, text: 'Key terms' },
            {
              id: 'ms-s02-image',
              type: 'image',
              src: '/assets/courses/multiple-sclerosis/s02-hero.jpg',
              caption:
                'The language of MS — myelin, relapse, remission, spasticity, heat sensitivity, fatigue.',
            },
            {
              id: 'ms-s02-reveal-ms',
              type: 'reveal_card',
              frontTitle: 'Multiple Sclerosis (MS)',
              frontBody: 'Skler-OH-sis',
              backTitle: 'Multiple Sclerosis (MS)',
              backBody:
                'A long-term disease where the immune system attacks the protective coating around nerves in the brain and spinal cord. "Multiple" because it damages many areas; "sclerosis" refers to the scars the damage leaves. Symptoms vary widely from person to person.',
            },
            {
              id: 'ms-s02-reveal-myelin',
              type: 'reveal_card',
              frontTitle: 'Myelin',
              frontBody: 'MY-eh-lin',
              backTitle: 'Myelin',
              backBody:
                'The protective coating that wraps around nerves — like the insulation around an electrical wire. Myelin helps nerve signals travel fast and clean. In MS, the immune system damages the myelin, so signals slow, scramble, or stop.',
            },
            {
              id: 'ms-s02-reveal-autoimmune',
              type: 'reveal_card',
              frontTitle: 'Autoimmune',
              frontBody: 'Aw-toe-ih-MYOON',
              backTitle: 'Autoimmune',
              backBody:
                'When the body\'s immune system — which should fight germs — mistakenly attacks the body\'s own tissues. MS is an autoimmune disease: the immune system attacks the myelin. The resident did nothing to cause this.',
            },
            {
              id: 'ms-s02-reveal-relapse',
              type: 'reveal_card',
              frontTitle: 'Relapse (Exacerbation)',
              frontBody: 'Relapse, also called a flare',
              backTitle: 'Relapse (Exacerbation)',
              backBody:
                'A period when MS symptoms suddenly get worse or new symptoms appear, lasting days to weeks. A relapse means new nerve damage may be happening — which is why new or worsening symptoms are always reported promptly.',
            },
            {
              id: 'ms-s02-reveal-remission',
              type: 'reveal_card',
              frontTitle: 'Remission',
              frontBody: 'Ree-MISH-un',
              backTitle: 'Remission',
              backBody:
                'A period when MS symptoms improve or stay stable. Many people with MS cycle between relapses and remissions for years. During remission a resident may function much better — but the disease is still there, and care continues.',
            },
            {
              id: 'ms-s02-reveal-spasticity',
              type: 'reveal_card',
              frontTitle: 'Spasticity',
              frontBody: 'Spas-TIS-ih-tee',
              backTitle: 'Spasticity',
              backBody:
                'Muscle tightness and stiffness, sometimes with spasms, common in MS. It can make limbs feel stiff and hard to move, affect walking, and become painful. Gentle handling, positioning, and the stretches therapists assign help manage it.',
            },
            {
              id: 'ms-s02-reveal-heat-sensitivity',
              type: 'reveal_card',
              frontTitle: 'Heat Sensitivity',
              frontBody: 'Heat sensitivity',
              backTitle: 'Heat Sensitivity',
              backBody:
                'For most people with MS, getting warm — a hot bath, a warm room, fever, summer heat — temporarily makes symptoms worse: more weakness, more fatigue, blurrier vision. Cooling down reverses it. This is why bath temperature and room temperature are real MS care.',
            },
            {
              id: 'ms-s02-reveal-ms-fatigue',
              type: 'reveal_card',
              frontTitle: 'MS Fatigue',
              frontBody: 'MS fatigue',
              backTitle: 'MS Fatigue',
              backBody:
                'A deep, overwhelming tiredness that is one of the most common and most disabling MS symptoms. It\'s not ordinary sleepiness and not laziness — it\'s a symptom of the disease itself. It often worsens through the day and with heat. Pacing activities around it is essential.',
            },
            {
              id: 'ms-s02-kc1-check-myelin',
              type: 'knowledge_check',
              question: 'Match the term: protective nerve coating damaged in MS',
              options: [
                { id: 'myelin', label: 'Myelin' },
                { id: 'relapse', label: 'Relapse' },
                { id: 'heat-sensitivity', label: 'Heat sensitivity' },
              ],
              correctOptionId: 'myelin',
              explanation:
                'Myelin. The protective coating that wraps around nerves — like the insulation around an electrical wire. In MS, the immune system damages the myelin, so signals slow, scramble, or stop.',
              requiredForCompletion: true,
            },
            {
              id: 'ms-s02-kc1-check-relapse',
              type: 'knowledge_check',
              question: 'Match the term: new or worsening symptoms — report promptly',
              options: [
                { id: 'myelin', label: 'Myelin' },
                { id: 'relapse', label: 'Relapse' },
                { id: 'heat-sensitivity', label: 'Heat sensitivity' },
              ],
              correctOptionId: 'relapse',
              explanation:
                'Relapse. A period when MS symptoms suddenly get worse or new symptoms appear, lasting days to weeks. A relapse means new nerve damage may be happening — which is why new or worsening symptoms are always reported promptly.',
              requiredForCompletion: true,
            },
            {
              id: 'ms-s02-kc1-check-heat-sensitivity',
              type: 'knowledge_check',
              question: 'Match the term: warmth temporarily makes MS symptoms worse',
              options: [
                { id: 'myelin', label: 'Myelin' },
                { id: 'relapse', label: 'Relapse' },
                { id: 'heat-sensitivity', label: 'Heat sensitivity' },
              ],
              correctOptionId: 'heat-sensitivity',
              explanation:
                'Heat sensitivity. For most people with MS, getting warm — a hot bath, a warm room, fever, summer heat — temporarily makes symptoms worse. Cooling down reverses it.',
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
            { id: 'ms-s03-heading', type: 'heading', level: 1, text: 'Statistics' },
            pendingAudio(
              'ms-s03-audio',
              'Multiple Sclerosis: The Snowflake Disease',
              `${ASSET_BASE}/s03-stats-podcast.mp3`,
              [
                'Multiple Sclerosis: The Snowflake Disease',
                '',
                'Nearly one million people in the United States live with multiple sclerosis. It\'s one of the most common neurological diseases of younger adults — most people are diagnosed between the ages of twenty and forty, and it affects women two to three times more often than men.',
                '',
                'That age range matters enormously in long-term care. When MS becomes advanced enough to require facility care, the resident is often far younger than the typical long-term care population — a person in their forties, fifties, or sixties, sometimes living among residents decades older. These residents are adults in the middle of life: many had careers, raise families, and have full mental sharpness even when their bodies are severely limited. Research on younger adults in long-term care consistently highlights how much dignity, autonomy, and age-appropriate engagement matter to their wellbeing — and CNAs deliver most of that daily respect.',
                '',
                'MS is called the snowflake disease because no two cases are alike. Depending on where the nerve damage occurs, symptoms can include weakness, numbness, vision problems, poor balance, spasticity, bladder and bowel problems, pain, thinking changes, and — in up to eighty percent of people with MS — profound fatigue, which many describe as their most disabling symptom. Symptoms also fluctuate: most people with MS experience relapses, when symptoms flare, and remissions, when they settle.',
                '',
                'Two facts shape daily CNA care more than any others. First, heat sensitivity: the majority of people with MS find that heat — hot baths, warm rooms, hot weather, fever — temporarily worsens their symptoms, sometimes dramatically. Simple cooling measures reverse it. Second, fatigue: MS fatigue is real, physical, and worsens through the day, so morning is often a resident\'s best time, and pacing matters.',
                '',
                'The bottom line: MS residents are often younger, always individual, and highly responsive to good daily care. Temperature management, fatigue pacing, fall prevention, skin protection, dignity, and alert reporting of changes — the CNA\'s daily work — directly shape how well a person with MS lives.',
              ].join('\n'),
              '/assets/courses/multiple-sclerosis/s03-stats-podcast.mp3',
            ),
            {
              id: 'ms-s03-image',
              type: 'image',
              src: '/assets/courses/multiple-sclerosis/s03-hero.jpg',
              caption:
                'MS affects people in different ways and on different days — adaptable care matters.',
            },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: 'Fundamentals',
        sortOrder: 3,
        buildContent: () =>
          doc('Fundamentals', [
            { id: 'ms-s04-heading', type: 'heading', level: 1, text: 'Fundamentals' },
            {
              id: 'ms-s04-video',
              type: 'video',
              title: 'Fundamentals',
              videoUrl: '/assets/courses/multiple-sclerosis/s04-fundamentals.mp4',
              placeholderNote:
                'Pending upload: /assets/courses/multiple-sclerosis/s04-fundamentals.mp4',
            },
            {
              id: 'ms-s04-narration',
              type: 'text',
              body: [
                '**Nerves are the body\'s wiring**',
                'The brain and spinal cord send commands through nerves — the body\'s wiring. Each nerve is wrapped in myelin, a protective coating that works like insulation on an electrical wire, keeping signals fast and clear.',
                '**What MS does to the wiring**',
                'In MS, the immune system mistakenly attacks the myelin, leaving damaged, scarred patches on the nerves. Where the insulation is frayed, signals slow down, get scrambled, or fail to arrive. The command "lift your leg" leaves the brain perfectly — but arrives weak, late, or not at all.',
                '**Why symptoms vary so much**',
                'The damage happens in patches, in different places for different people. Damage on vision nerves blurs sight. On movement pathways, it causes weakness or stiffness. On sensation pathways, numbness or tingling. On balance circuits, unsteadiness. This patchwork is why MS is the snowflake disease — and why you learn each resident\'s individual MS, not "MS in general."',
                '**Relapses and remissions**',
                'For many people, MS moves in waves. A relapse: symptoms flare or new ones appear over days, as new damage occurs — then a remission, when things improve or stabilize. Over years, some people shift into a steadier, gradually progressing pattern. The care point: a new or worsening symptom may mean a relapse is happening, and it\'s always reported promptly.',
                '**Why heat makes everything worse**',
                'Here\'s the science behind the lukewarm bath. Damaged nerves conduct signals poorly — and heat makes them conduct even worse. So when a person with MS gets warm, signals that barely got through stop getting through: legs weaken, vision blurs, fatigue crashes in. The good news: it\'s temporary. Cool the person down, and function returns. This is why temperature is genuine medicine in MS care.',
                '**Fatigue: the invisible symptom**',
                'MS fatigue is not ordinary tiredness. It\'s a heavy, body-wide exhaustion caused by the disease itself — nerves working overtime to push signals through damaged wiring. It can hit suddenly, worsens through the day and with heat, and isn\'t fixed by "trying harder." A resident who managed beautifully at nine and can\'t manage at two isn\'t lazy or difficult. That\'s MS.',
                '**Managed, not cured**',
                'There\'s no cure for MS yet, but modern medications can slow it down, and good daily care manages the symptoms. Many people live full lives with MS for decades. Your part — cool environments, paced activities, fall prevention, skin protection, dignity, and sharp-eyed reporting — is a real piece of that management.',
              ].join('\n\n'),
            },
            {
              id: 'ms-s04-heat-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Heat worsens MS — cooling reverses it',
              body: 'When a person with MS gets warm, symptoms worsen temporarily. Cool the person down, and function returns. This is why temperature is genuine medicine in MS care.',
            },
            {
              id: 'ms-s04-image',
              type: 'image',
              src: '/assets/courses/multiple-sclerosis/s04-hero.jpg',
              caption: 'Understanding how MS damages myelin and disrupts nerve signals.',
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
            { id: 'ms-s05-heading', type: 'heading', level: 1, text: 'Signs & Symptoms' },
            {
              id: 'ms-s05-narration',
              type: 'text',
              body: [
                '**The movement symptoms**',
                'Common movement signs include weakness, often in the legs; stiffness and spasticity; poor balance and unsteady walking; tremor; and trouble with coordination. Many residents use a cane, walker, or wheelchair — and their mobility can vary by the day and by the hour. Know what each resident can usually do, because that\'s your baseline.',
                '**The sensory and vision symptoms**',
                'MS often affects what residents feel and see. Numbness and tingling — pins and needles — in the limbs or face. Vision problems: blurred vision, double vision, or pain with eye movement. Dizziness. Some have nerve pain — burning or electric sensations. Numbness carries a hidden danger: a resident who can\'t feel pressure or heat can be injured without knowing it — which is why skin checks and water temperature matter so much.',
                '**Fatigue, heat, and the daily rhythm**',
                'Watch the rhythm of the day. MS fatigue often builds through the day — a resident strong in the morning may be drained by afternoon. And watch heat: after a warm bath, in a hot room, on a summer day, symptoms may suddenly worsen — weaker legs, blurrier vision, heavier fatigue. The pattern matters: worsening with heat that improves with cooling is heat sensitivity, not necessarily a relapse. Either way, what you observe gets reported.',
                '**The changes that may signal a relapse**',
                'Then there are the changes that may mean a relapse — new nerve damage happening. A new symptom the resident hasn\'t had before. A familiar symptom clearly worse than usual and staying worse — lasting more than a day, not explained by heat or tiredness. New vision loss, new weakness, new numbness, new bladder trouble. These are reported promptly, because relapses are treated, and earlier is better.',
                '**Summary**',
                'Two pictures. Each resident\'s usual MS: their typical mobility, vision, sensation, and their daily fatigue rhythm — learn it well. Changes to report: new symptoms, familiar symptoms clearly worse and persisting, sudden worsening after heat — and any fall, any choking, any skin breakdown.',
                'The rule underneath it all: in MS, the baseline is individual and the disease changes — so know each resident\'s normal, watch the heat and the clock, and report what\'s new or worse.',
              ].join('\n\n'),
            },
            {
              id: 'ms-s05-baseline-callout',
              type: 'callout',
              variant: 'warning',
              title: 'Know each resident\'s baseline',
              body: 'In MS, the baseline is individual and the disease changes. Know each resident\'s normal, watch the heat and the clock, and report what\'s new or worse.',
            },
            {
              id: 'ms-s05-image',
              type: 'image',
              src: '/assets/courses/multiple-sclerosis/s05-hero.jpg',
              caption: 'Recognizing MS symptoms — and knowing each resident\'s baseline.',
            },
          ]),
      },
      {
        slug: 's06-causes',
        title: 'Causes',
        sortOrder: 1,
        buildContent: () =>
          doc('Causes', [
            { id: 'ms-s06-heading', type: 'heading', level: 1, text: 'Causes' },
            pendingAudio(
              'ms-s06-audio',
              'What Causes MS — and What Makes It Worse Day to Day?',
              `${ASSET_BASE}/s06-causes-podcast.mp3`,
              [
                'What Causes MS — and What Makes It Worse Day to Day?',
                '',
                'Multiple sclerosis happens when the body\'s immune system — the defense system meant to fight germs — mistakenly attacks the myelin coating around the body\'s own nerves. Why the immune system makes this mistake is not fully understood, but research points to a combination of factors rather than a single cause.',
                '',
                'Genetics play a part: MS is not directly inherited, but having a close family member with MS raises the risk somewhat. Environment matters too: MS is more common in regions farther from the equator, and low vitamin D levels have been linked to higher risk. Certain common viral infections earlier in life — particularly the virus that causes mononucleosis — are strongly associated with later MS. Smoking raises risk and can worsen the disease course. And MS affects women two to three times more often than men, usually beginning between ages twenty and forty.',
                '',
                'Here\'s the message that matters for care: nothing the resident did caused their MS. It isn\'t from lifestyle failure or anything they chose. They were, in a real sense, unlucky — and they deserve care entirely free of blame.',
                '',
                'For the CNA, the more practical question is what makes MS symptoms worse day to day — because those aggravators are where you can help. Heat is the biggest: warm baths, hot rooms, summer weather, and fever all temporarily worsen symptoms. Infections — even a simple bladder infection — can flare MS symptoms or trigger a relapse, which is one reason any sign of infection is reported promptly. Overexertion and fatigue worsen function, so pacing matters. Stress can aggravate symptoms. And missed disease-modifying medications reduce the protection slowing the disease down.',
                '',
                'So the practical picture: you can\'t change why a resident has MS, but you have real influence over the things that make their MS better or worse each day — keeping them cool, pacing their energy, catching infections early, keeping care calm, and supporting their medication routine.',
              ].join('\n'),
              '/assets/courses/multiple-sclerosis/s06-causes-podcast.mp3',
            ),
            {
              id: 'ms-s06-image',
              type: 'image',
              src: '/assets/courses/multiple-sclerosis/s06-hero.jpg',
              caption: 'Understanding what happens in the immune system in MS.',
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
              id: 'ms-s07-heading',
              type: 'heading',
              level: 1,
              text: 'CNA Role & Best Practices',
            },
            {
              id: 'ms-s07-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of practice',
              body: 'CNAs SUPPORT, OBSERVE, COOL, and REPORT. CNAs never give or adjust MS medications.',
            },
            {
              id: 'ms-s07-image',
              type: 'image',
              src: '/assets/courses/multiple-sclerosis/s07-hero.jpg',
              caption:
                'The CNA supports variable abilities, manages heat and fatigue, prevents falls, and reports new or worsening symptoms — never forces an unsafe transfer.',
            },
            {
              id: 'ms-s07-narration',
              type: 'text',
              body: [
                'MS treatment works on two levels — slowing the disease, and easing the symptoms — and the CNA supports both without ever touching a dose. Let\'s walk through it, starting as always with the rule that never bends. A CNA does not give or adjust MS medications of any kind.',
                '**Disease-modifying therapies.** These are the long-term medications that calm the immune system and slow MS down — reducing relapses and new damage. They come as pills, injections, or infusions managed entirely by the nurse and doctor. Your role: support the routine, and report any missed or refused doses — because consistent treatment is what protects the resident\'s future function. Many of these medications also lower the body\'s defenses somewhat, so report early signs of infection promptly — fever, cough, burning urination, unusual tiredness.',
                '**Symptom medications.** Residents may take medications for specific symptoms: muscle relaxants for spasticity, medications for nerve pain, for bladder problems, for fatigue, for depression. Red — what you observe and report: drowsiness, dizziness, or unsteadiness from muscle relaxants and pain medications, which raise fall risk; and whether symptoms seem better or worse, because your observations guide dose decisions you never make yourself.',
                '**Relapse treatment.** When a true relapse occurs, the doctor may order a short course of steroid medication to calm the inflammation. You don\'t give it — but your prompt reporting of new or worsening symptoms is what triggers the assessment that catches the relapse early.',
                '**Therapy and equipment.** Physical and occupational therapists work on strength, stretching for spasticity, energy conservation, and equipment — canes, walkers, wheelchairs, braces. You reinforce what they assign: encourage the prescribed exercises, ensure equipment is used and maintained, and never invent therapy on your own.',
                '**And the non-drug treatment you own: temperature.** Remember that cooling is genuine symptom treatment in MS. Lukewarm baths, a fan, a cool room, cold drinks on hot days — these restore function that heat takes away. It\'s the one "treatment" squarely in CNA hands.',
                'The scope point for this section: you never give or adjust any MS medication — but your reporting of missed doses, infection signs, side effects, and symptom changes, plus your temperature management, supports every treatment the team provides.',
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
            { id: 'ms-s08-heading', type: 'heading', level: 1, text: 'Prevention & Risk Reduction' },
            {
              id: 'ms-s08-image',
              type: 'image',
              src: '/assets/courses/multiple-sclerosis/s08-hero.jpg',
              caption: 'Supporting energy conservation, a cool environment, and safe mobility.',
            },
            {
              id: 'ms-s08-narration',
              type: 'text',
              body: [
                'With MS, prevention means keeping symptoms from worsening and complications from starting. Here are seven ways CNAs do exactly that.',
                '**One. Keep them cool.** This is the big one. Use lukewarm — never hot — bath and shower water. Keep rooms comfortably cool. Offer fans and cool drinks in warm weather. Schedule demanding activities for cooler parts of the day. A cool resident with MS is a stronger, clearer, safer resident.',
                '**Two. Pace around the fatigue.** Plan heavier care — bathing, dressing, activities — for the resident\'s best hours, usually mornings. Break tasks into steps with rest between. Let the resident set the pace, and never label their exhaustion as laziness. Energy in MS is a limited daily budget; help them spend it well.',
                '**Three. Prevent falls.** Weakness, numbness in the feet, poor balance, and equipment all add up to high fall risk. Keep pathways clear and lit, ensure the right mobility aids are in reach and in good repair, stay close during transfers, and allow time. Report any change in walking or balance.',
                '**Four. Protect the skin.** Numbness means a resident may not feel pressure damage starting, and limited mobility adds risk. Reposition on schedule, check skin carefully — especially heels, hips, and the tailbone — keep skin clean and dry, and always test water temperature, because numb skin can be burned without the resident feeling it.',
                '**Five. Catch infections early.** Infections — especially bladder infections, common in MS — can flare symptoms or trigger relapses. Report fever, burning or cloudy urine, new confusion, or feeling unwell promptly. Support fluids as the plan allows, and provide careful catheter and toileting care where it applies.',
                '**Six. Support bladder and bowel routines with dignity.** Bladder and bowel problems are common in MS and deeply personal. Follow the toileting schedule faithfully, answer call lights fast, handle accidents matter-of-factly and privately, and report changes. Dignity protected is wellbeing protected.',
                '**Seven. Support the whole person.** Depression is common in MS, and a younger resident in long-term care carries extra emotional weight. Engage them as the adult they are, support their interests and independence, listen, and report signs of low mood. Emotional care is real MS care.',
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
              id: 'ms-s09-heading',
              type: 'heading',
              level: 1,
              text: 'Scenario & Reporting',
            },
            pendingAudio(
              'ms-s09-intro-audio',
              'Emergency response scenarios intro',
              `${ASSET_BASE}/s09-emergency-intro.mp3`,
              'With MS, your two key judgments are responding safely when heat suddenly steals a resident\'s strength, and recognizing the new or worsening symptoms that may signal a relapse. You\'re about to work through two situations. Read each carefully, choose your action, and you\'ll get feedback right away. Keep the course themes in mind: heat worsens MS and cooling reverses it — and anything new or worse gets reported.',
              '/assets/courses/multiple-sclerosis/s09-emergency-intro.mp3',
            ),
            {
              id: 'ms-s09-image',
              type: 'image',
              src: '/assets/courses/multiple-sclerosis/s09-hero.jpg',
              caption:
                'Two MS situations: a heat-triggered flare during care, and new symptoms that may signal a relapse.',
            },
            {
              id: 'ms-s09-scenario-heat-image',
              type: 'image',
              src: '/assets/courses/multiple-sclerosis/s09-scenario-heat.jpg',
              caption:
                'Sudden leg weakness and blurred vision after a warm shower: keep her safely seated, begin cooling her down, and call the nurse — do not attempt the transfer alone.',
            },
            {
              id: 'ms-s09-scenario-heat',
              type: 'scenario_question',
              prompt:
                'You\'re helping Ms. Delgado, who has MS, finish a shower. The water ran warmer than usual. As she tries to stand, her legs suddenly buckle — far weaker than normal — and she says her vision has gone blurry and she feels "completely drained." She\'s frightened. She\'s safely seated on the shower chair but cannot support herself to transfer. What is the BEST action?',
              options: [
                {
                  id: 'insist-stand',
                  label: 'Insist she try harder to stand and walk it off',
                  feedback:
                    'Her sudden weakness is heat sensitivity — warm water temporarily worsening her MS. Insisting she push through risks a fall; lifting alone risks injuring you both; leaving her alone in a shower room is unsafe. The right action: keep her safely seated, start cooling her, call the nurse from where you are, stay with her, and reassure her that cooling usually restores function.',
                },
                {
                  id: 'cool-and-call',
                  label:
                    'Keep her safely seated, begin cooling her down, and call the nurse now — do not attempt the transfer alone',
                  feedback:
                    'Exactly right. Warm water has triggered her heat sensitivity — temporarily worsening her weakness and vision. Your priorities: safety first — keep her securely seated, never attempt a transfer her body can\'t support or that you can\'t do safely alone. Begin cooling — cooler water briefly, a cool damp towel, a fan, out of the steam. And call the nurse now using the call system, staying with her and reassuring her: heat-related worsening typically improves as she cools. Report the whole event, including the warm water, so bathing plans can be adjusted.',
                  isRecommended: true,
                },
                {
                  id: 'lift-alone',
                  label: 'Attempt to lift her to the wheelchair by yourself right away',
                  feedback:
                    'Her sudden weakness is heat sensitivity — warm water temporarily worsening her MS. Insisting she push through risks a fall; lifting alone risks injuring you both; leaving her alone in a shower room is unsafe. The right action: keep her safely seated, start cooling her, call the nurse from where you are, stay with her, and reassure her that cooling usually restores function.',
                },
                {
                  id: 'leave-alone',
                  label: 'Leave her alone in the shower room to go get help',
                  feedback:
                    'Her sudden weakness is heat sensitivity — warm water temporarily worsening her MS. Insisting she push through risks a fall; lifting alone risks injuring you both; leaving her alone in a shower room is unsafe. The right action: keep her safely seated, start cooling her, call the nurse from where you are, stay with her, and reassure her that cooling usually restores function.',
                },
              ],
              requiredForCompletion: true,
            },
            {
              id: 'ms-s09-scenario-relapse-image',
              type: 'image',
              src: '/assets/courses/multiple-sclerosis/s09-scenario-relapse.jpg',
              caption:
                'New and worsening numbness and double vision over two days, cool and rested: report promptly — this may be a relapse.',
            },
            {
              id: 'ms-s09-scenario-relapse',
              type: 'scenario_question',
              prompt:
                'Mr. Novak\'s MS baseline is steady: he walks short distances with a walker and has mild numbness in his left hand. Over the past two days, you\'ve noticed his left leg dragging more than usual, he\'s mentioned new numbness in his right hand — a hand never affected before — and this morning he says his vision is "doubled" at times. The room is cool and he\'s well-rested. What SHOULD the CNA do?',
              options: [
                {
                  id: 'assume-normal',
                  label: 'Assume it\'s normal MS ups and downs and say nothing',
                  feedback:
                    'New numbness in a never-affected hand, a worsening leg, and new double vision — persisting for days in a cool, rested resident — point to a possible relapse, where new nerve damage may be occurring. Dismissing it, pushing exercise, or waiting a week loses the early-treatment window. The right action: report the new and worsening symptoms to the nurse promptly.',
                },
                {
                  id: 'report-promptly',
                  label:
                    'Report the new and worsening symptoms to the nurse promptly — this may be a relapse',
                  feedback:
                    'Right. A brand-new symptom — numbness in a hand never affected — plus clear worsening of existing symptoms, persisting across days, not explained by heat or fatigue, is the classic picture of a possible MS relapse: new nerve damage may be happening. Relapses are treatable, and earlier treatment is better, so this is reported promptly — never logged away as "MS being MS." Your knowledge of his exact baseline is what made the change visible.',
                  isRecommended: true,
                },
                {
                  id: 'exercise-harder',
                  label: 'Encourage him to exercise harder to rebuild strength',
                  feedback:
                    'New numbness in a never-affected hand, a worsening leg, and new double vision — persisting for days in a cool, rested resident — point to a possible relapse, where new nerve damage may be occurring. Dismissing it, pushing exercise, or waiting a week loses the early-treatment window. The right action: report the new and worsening symptoms to the nurse promptly.',
                },
                {
                  id: 'wait-week',
                  label: 'Wait a week to see if it settles on its own',
                  feedback:
                    'New numbness in a never-affected hand, a worsening leg, and new double vision — persisting for days in a cool, rested resident — point to a possible relapse, where new nerve damage may be occurring. Dismissing it, pushing exercise, or waiting a week loses the early-treatment window. The right action: report the new and worsening symptoms to the nurse promptly.',
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
            { id: 'ms-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
              id: 'ms-s10-video',
              type: 'video',
              title: "The CNA's Role",
              videoUrl: '/assets/courses/multiple-sclerosis/s10-cna-role.mp4',
              placeholderNote:
                'Pending upload: /assets/courses/multiple-sclerosis/s10-cna-role.mp4',
            },
            {
              id: 'ms-s10-narration',
              type: 'text',
              body: [
                'Caring for a resident with MS means adjusting skilled care to a condition that changes. Let\'s walk through your role.',
                '**Own the temperature** You are the keeper of the temperature. Lukewarm baths and showers — always test the water, doubly important because numb skin can\'t warn of burning. Cool, comfortable rooms. Fans and cool drinks in warm weather. Demanding activities in the cooler hours. When heat steals function, cool the resident and watch it return. No other condition gives the CNA such a direct lever on symptoms.',
                '**Pace, and preserve independence** Work with the energy budget. Schedule the heavy care in the resident\'s strong hours, build in rest, and let them set the pace. And preserve independence: encourage them to do what they can, even slowly, with the adaptive equipment the therapists provide. For a younger adult with MS especially, doing things themselves is dignity — take over only what they truly can\'t do, and never more.',
                '**Protect the body** Guard against the complications. Fall prevention every hour — clear paths, right equipment, close support, no rushing, safe transfers you never attempt alone beyond your training. Skin protection — repositioning, careful checks where numbness hides damage, clean and dry skin. Bladder and bowel support with fast call-light answers and full dignity. Infection vigilance — report fevers and urinary symptoms promptly, because infections flare MS.',
                '**Know the baseline, report the change** And be the team\'s eyes. Learn each resident\'s individual MS — their usual mobility, vision, sensation, and daily rhythm. Report new symptoms, worsening that persists, falls, swallowing trouble, skin changes, infection signs, missed medications, and signs of low mood. Your baseline knowledge is what makes a relapse visible early.',
                'Now the boundary. You do not diagnose MS or decide whether a change is a relapse — you report it; the nurse and doctor assess. You do not give or adjust any medication. You do not perform therapy beyond reinforcing what therapists assign. And you never dismiss new or worsening symptoms as "just their MS."',
                'Inside your role — temperature, pacing, independence, protection, dignity, and sharp-eyed reporting — you shape how well this resident lives with MS every single day. For a snowflake disease, there is no substitute for a CNA who truly knows the person.',
              ].join('\n\n'),
            },
            {
              id: 'ms-s10-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Stay within scope',
              body: 'You do not diagnose MS or decide whether a change is a relapse — you report it. You do not give or adjust any medication. You do not perform therapy beyond reinforcing what therapists assign. And you never dismiss new or worsening symptoms as "just their MS."',
            },
            {
              id: 'ms-s10-image',
              type: 'image',
              src: '/assets/courses/multiple-sclerosis/s10-hero.jpg',
              caption: 'Reporting changes against the resident\'s baseline accurately to the nurse.',
            },
          ]),
      },
      {
        slug: 's11-case-study',
        title: 'Case Study',
        sortOrder: 2,
        buildContent: () => {
          const caseNarrative = [
            'Ms. Delgado, 52, had lived with MS for twenty years and in the facility for two. She was sharp, funny, and proud — a former bookkeeper who still managed her own budget from her wheelchair. Her CNA, Binh, enjoyed their morning conversations.',
            '',
            '**The puzzling pattern:** Binh noticed something that troubled him. Most mornings, Ms. Delgado was at her best — transferring with minimal help, feeding herself, reading. But nearly every afternoon, around two o\'clock, she seemed to fall apart: legs too weak for transfers, vision too blurry to read, so drained she could barely talk. A few staff had started saying she was "being difficult in the afternoons" or "didn\'t want to participate." Binh didn\'t believe it. The morning Ms. Delgado and the afternoon Ms. Delgado were the same person — something physical was happening.',
            '',
            '**The detective work:** Binh started paying attention to the details around two o\'clock. Her room faced west — by early afternoon, sun poured in and the room grew noticeably warm. Her bath was scheduled at one — and the aide who usually ran it liked the water comfortably hot. Warm room, hot bath, early afternoon: heat, heat, heat. Binh remembered his MS training — heat sensitivity — and connected the pattern.',
            '',
            '**The report:** Binh brought it to the nurse, with specifics: "Ms. Delgado is strong every morning and crashes every afternoon — right after a hot one o\'clock bath, in a room that gets hot from the western sun. I think this is MS heat sensitivity, not behavior. Could we look at the bath temperature and the room?"',
            '',
            '**The changes:** The nurse agreed and acted. The bath moved to morning and ran lukewarm. A fan and a window shade went into her room, and her care plan noted cool-room measures for afternoons. Binh started offering her a cool drink after lunch.',
            '',
            '**The outcome:** Within days, the two o\'clock crashes nearly vanished. Ms. Delgado kept her afternoons — reading, visiting, managing her budget. She told Binh, "I thought I was just getting worse. Turns out I was just getting cooked." The "difficult in the afternoons" talk stopped, replaced by a care plan that matched her disease.',
            '',
            '**Discussion:** Nothing about Ms. Delgado\'s MS changed — only the temperature around her did. Binh\'s contribution wasn\'t medical: it was knowing her baseline, refusing the "difficult resident" label, noticing the heat pattern, and reporting it with specifics. One observant CNA converted a daily decline into a solvable problem — and gave a sharp, proud woman her afternoons back.',
          ].join('\n');

          return doc('Case Study', [
            { id: 'ms-s11-heading', type: 'heading', level: 1, text: 'Brief Case Study' },
            pendingAudio(
              'ms-s11-audio',
              "The Two O'Clock Mystery",
              `${ASSET_BASE}/s11-case-podcast.mp3`,
              caseNarrative,
              '/assets/courses/multiple-sclerosis/s11-case-podcast.mp3',
            ),
            {
              id: 'ms-s11-image',
              type: 'image',
              src: '/assets/courses/multiple-sclerosis/s11-hero.png',
              caption: 'An MS situation handled well — adapted to the day, safe, dignified.',
            },
            {
              id: 'ms-s11-case-study',
              type: 'case_study',
              title: "The Two O'Clock Mystery",
              residentProfile:
                'Ms. Delgado, 52, had lived with MS for twenty years and in the facility for two. She was sharp, funny, and proud — a former bookkeeper who still managed her own budget from her wheelchair. Her CNA, Binh, enjoyed their morning conversations.',
              scenario: [
                '**The puzzling pattern:** Binh noticed something that troubled him. Most mornings, Ms. Delgado was at her best — transferring with minimal help, feeding herself, reading. But nearly every afternoon, around two o\'clock, she seemed to fall apart: legs too weak for transfers, vision too blurry to read, so drained she could barely talk. A few staff had started saying she was "being difficult in the afternoons" or "didn\'t want to participate." Binh didn\'t believe it. The morning Ms. Delgado and the afternoon Ms. Delgado were the same person — something physical was happening.',
                '**The detective work:** Binh started paying attention to the details around two o\'clock. Her room faced west — by early afternoon, sun poured in and the room grew noticeably warm. Her bath was scheduled at one — and the aide who usually ran it liked the water comfortably hot. Warm room, hot bath, early afternoon: heat, heat, heat. Binh remembered his MS training — heat sensitivity — and connected the pattern.',
                '**The report:** Binh brought it to the nurse, with specifics: "Ms. Delgado is strong every morning and crashes every afternoon — right after a hot one o\'clock bath, in a room that gets hot from the western sun. I think this is MS heat sensitivity, not behavior. Could we look at the bath temperature and the room?"',
                '**The changes:** The nurse agreed and acted. The bath moved to morning and ran lukewarm. A fan and a window shade went into her room, and her care plan noted cool-room measures for afternoons. Binh started offering her a cool drink after lunch.',
                '**The outcome:** Within days, the two o\'clock crashes nearly vanished. Ms. Delgado kept her afternoons — reading, visiting, managing her budget. She told Binh, "I thought I was just getting worse. Turns out I was just getting cooked." The "difficult in the afternoons" talk stopped, replaced by a care plan that matched her disease.',
                '**Discussion:** Nothing about Ms. Delgado\'s MS changed — only the temperature around her did. Binh\'s contribution wasn\'t medical: it was knowing her baseline, refusing the "difficult resident" label, noticing the heat pattern, and reporting it with specifics. One observant CNA converted a daily decline into a solvable problem — and gave a sharp, proud woman her afternoons back.',
              ].join('\n\n'),
            },
            {
              id: 'ms-s11-reflection-1',
              type: 'reflection',
              prompt:
                'Several staff explained Ms. Delgado\'s afternoons as "behavior." What allowed Binh to see a physical pattern instead — and why is knowing a resident\'s baseline so important in MS?',
              minCharacters: 50,
            },
            {
              id: 'ms-s11-reflection-2',
              type: 'reflection',
              prompt:
                'The fix involved no medication at all — just water temperature, a fan, a shade, and scheduling. What does this show about the CNA\'s direct power over MS symptoms?',
              minCharacters: 50,
            },
            {
              id: 'ms-s11-reflection-intro-text',
              type: 'text',
              body: 'Reflect on the case study in the previous lesson. Your written responses help you apply what you learned about heat sensitivity, baseline knowledge, and the CNA\'s direct power over MS symptoms.',
            },
            {
              id: 'ms-s11-kc2-check',
              type: 'knowledge_check',
              question:
                'A CNA does not give or adjust MS medications of any kind. When a resident with MS seems to need a change in their medication, the CNA SHOULD:',
              options: [
                {
                  id: 'adjust-dose',
                  label: 'Adjust the dose to help the resident feel better',
                },
                {
                  id: 'report-nurse',
                  label: 'Report the concern to the nurse and let the nurse decide',
                },
                {
                  id: 'give-medication',
                  label: 'Give the medication as the resident requests',
                },
                {
                  id: 'wait-recheck',
                  label: 'Wait and recheck later without telling anyone',
                },
              ],
              correctOptionId: 'report-nurse',
              explanation:
                'You never give or adjust any MS medication — but your reporting of missed doses, infection signs, side effects, and symptom changes supports every treatment the team provides.',
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
            { id: 'ms-s12-heading', type: 'heading', level: 1, text: 'Conclusion' },
            {
              id: 'ms-s12-video',
              type: 'video',
              title: 'Conclusion',
              videoUrl: '/assets/courses/multiple-sclerosis/s12-conclusion.mp4',
              placeholderNote:
                'Pending upload: /assets/courses/multiple-sclerosis/s12-conclusion.mp4',
            },
            {
              id: 'ms-s12-image',
              type: 'image',
              src: '/assets/courses/multiple-sclerosis/s12-hero.jpg',
              caption:
                'Match the day, manage heat and fatigue, report changes — the CNA\'s role in MS care.',
            },
            {
              id: 'ms-s12-narration',
              type: 'text',
              body: [
                'You\'ve reached the end. Let\'s lock in the five things that matter most for MS care.',
                '**One.** MS is an autoimmune disease that damages the insulation around nerves, scrambling the body\'s signals. It\'s the snowflake disease — every resident\'s MS is individual, it changes over time, and residents are often younger adults whose dignity and independence deserve full respect.',
                '**Two.** Heat is the enemy, and cooling is care you own. Lukewarm baths — always test the water. Cool rooms, fans, cool drinks, demanding tasks in cooler hours. Heat temporarily steals function; cooling gives it back. No other condition hands the CNA such a direct lever.',
                '**Three.** Respect the fatigue and pace the day. MS fatigue is a real, physical symptom — not laziness. Plan heavy care for strong hours, build in rest, let the resident set the pace, and never let anyone label exhaustion as a bad attitude.',
                '**Four.** Know the baseline, report the change. New symptoms, worsening that persists, vision changes, new numbness — these may signal a relapse, and relapses treated early do less harm. Also report falls, skin changes, infection signs, and missed medications. Your baseline knowledge makes the change visible.',
                '**Five.** Honor your scope. You never diagnose, never give or adjust medications, never perform therapy on your own. But your temperature management, pacing, fall and skin protection, dignified bladder and bowel care, and faithful reporting shape this resident\'s life with MS every single day.',
              ].join('\n\n'),
            },
            {
              id: 'ms-s12-summary',
              type: 'summary',
              title: 'Five things that matter most',
              items: [
                'MS is an autoimmune disease — every resident\'s MS is individual, and residents are often younger adults.',
                'Heat is the enemy, and cooling is care you own — lukewarm baths, cool rooms, fans, cool drinks.',
                'Respect the fatigue and pace the day — MS fatigue is real, not laziness.',
                'Know the baseline, report the change — new or worsening symptoms may signal a relapse.',
                'Honor your scope — never diagnose, give or adjust medications, or perform therapy on your own.',
              ],
            },
            {
              id: 'ms-s12-what-happens-next-text',
              type: 'text',
              body: 'Ten questions are waiting. Everything on them was covered here. You\'re ready. Trust what you\'ve learned, and show what you know.',
            },
            {
              id: 'ms-s12-completion-requirements-text',
              type: 'text',
              body: 'This course provides one hour of continuing education credit through CAL ACE Nursing Academy, an approved CDPH continuing education provider, NAC number 7384. Your certificate is generated automatically when you pass the knowledge check.',
            },
            {
              id: 'ms-s12-completion-requirements-callout',
              type: 'callout',
              variant: 'info',
              title: 'Scope reminder',
              body: 'CNAs support, observe, cool, and report. CNAs do not diagnose MS, give or adjust medications, or perform therapy.',
            },
            {
              id: 'ms-s12-certificate-access-text',
              type: 'text',
              body: 'Your certificate is generated automatically when you pass the knowledge check. CDPH-Approved CE Provider — NAC #7384.',
            },
          ]),
      },
    ],
  },
];

export async function seedCourse23MultipleSclerosis(
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
  console.log(`Seeding Course 23 (Multiple Sclerosis) as DRAFT — slug "${COURSE_SLUG}"…`);

  try {
    const result = await seedCourse23MultipleSclerosis(prisma);
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
