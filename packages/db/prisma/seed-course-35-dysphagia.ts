/**
 * Seed Course 35 — Caring for a Resident with Dysphagia (Swallowing Difficulties) (DRAFT).
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-35-dysphagia
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
const COURSE_SLUG = 'dysphagia';
const COURSE_TITLE = 'Swallowing Safety and Aspiration Prevention Support';
const COURSE_SUMMARY =
  'Learn the CNA\'s role in caring for a resident with dysphagia — recognizing unsafe swallowing, serving the exact prescribed diet texture and liquid thickness, safe mealtime technique, telling choking from silent aspiration, and responding to a choking emergency per training. CNAs do not diagnose swallowing problems, change diet textures, or perform swallow evaluations.';

const ASSET_BASE = `/assets/courses/dysphagia`;


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
    'Explain dysphagia and aspiration.',
    'Recognize the signs of unsafe swallowing — loud and silent.',
    'Serve prescribed textures exactly and feed safely.',
    'Respond to a choking emergency.',
    'Know your scope — what a CNA does, and what a CNA must never do.',
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
  heroImage: '/assets/courses/dysphagia/hero-banner.png',
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
    title: 'Understanding Dysphagia & Aspiration',
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: 'Introduction',
        sortOrder: 0,
        buildContent: () =>
          doc('Welcome', [
            { id: 'dy-s01-heading', type: 'heading', level: 1, text: 'Welcome' },
            {
              id: 'dy-s01-video',
              type: 'video',
              title: 'Introduction',
              videoUrl: '/assets/courses/dysphagia/s01-intro.mp4',
              placeholderNote: 'Pending upload: /assets/courses/dysphagia/s01-intro.mp4',
            },
            {
              id: 'dy-s01-image',
              type: 'image',
              src: `${ASSET_BASE}/s01-hero.jpg`,
              caption:
                'Dysphagia — protecting a resident who can no longer swallow safely from choking and aspiration.',
            },
            {
              id: 'dy-s01-narration',
              type: 'text',
              body: [
                'Welcome to CAL ACE Nursing Academy.',
                'This course is about dysphagia — difficulty swallowing — and the mealtime care that keeps a vulnerable resident safe, nourished, and dignified.',
                'Swallowing seems simple, but it\'s one of the most complicated things the body does — dozens of muscles and nerves working in precise split-second sequence to move food and liquid from the mouth to the stomach, while protecting the airway so nothing goes down the wrong pipe. When that sequence breaks down — from a stroke, Parkinson\'s, dementia, weakness, or other causes — the result is dysphagia. Food and liquid can go down slowly, painfully, incompletely — or dangerously, into the airway and lungs.',
                'Here\'s why this matters so much. When food or liquid enters the airway instead of the stomach, it\'s called aspiration — and aspiration has two faces. The loud face is choking: coughing, gagging, a blocked airway — an emergency everyone notices. The quiet face is silent aspiration: food or liquid slipping into the lungs with no cough, no sputter, no drama at all. The resident looks fine. But that material in the lungs causes aspiration pneumonia — one of the most serious and common dangers for residents with dysphagia. You\'ll learn to spot the subtle signs that swallowing isn\'t safe, even when nothing dramatic happens.',
                'This course is also about precision. For a resident with dysphagia, the speech-language pathologist and the team prescribe an exact diet: specific food textures — like pureed or minced — and specific liquid thickness — like nectar-thick or honey-thick. These aren\'t preferences. They\'re calculated to what that resident\'s swallow can safely handle. Serving the wrong texture, or thinning a thickened liquid out of kindness, can put food or liquid straight into their lungs. The texture order is as serious as a medication order.',
                'And it\'s about technique: upright positioning, small bites, a slow pace, full attention during meals, and staying upright afterward — the habits that make every swallow safer.',
                'Your scope is clear. A CNA serves the exact prescribed textures and thickness, uses safe feeding technique, watches every meal, recognizes unsafe swallowing and aspiration signs, responds to choking per training, and reports faithfully. A CNA does not diagnose swallowing problems, does not change diet textures or liquid thickness, and does not perform swallow evaluations.',
                'By the end of this course, you will be able to: explain dysphagia and aspiration. Recognize the signs of unsafe swallowing — loud and silent. Serve prescribed textures exactly and feed safely. Respond to a choking emergency. And know your scope.',
                'There is a ten-question knowledge check at the end. Everything on it is covered here. Let\'s begin.',
              ].join('\n\n'),
            },
            {
              id: 'dy-s01-ci-text',
              type: 'text',
              body: [
                'This course teaches the CNA\'s role in caring for a resident with dysphagia — recognizing unsafe swallowing, serving the exact prescribed diet texture and liquid thickness, safe mealtime technique, telling choking from silent aspiration, and responding to a choking emergency per training.',
                'Let\'s be clear about your role. A CNA serves the exact prescribed textures and thickness, uses safe feeding technique, watches every meal, recognizes unsafe swallowing and aspiration signs, responds to choking per training, and reports faithfully. A CNA does not diagnose swallowing problems, does not change diet textures or liquid thickness, and does not perform swallow evaluations. Those are speech-language pathologist and team tasks. But none of them can happen without your careful observation and faithful reporting first.',
              ].join('\n\n'),
            },
            {
              id: 'dy-s01-ci-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of this course',
              body: 'CNAs SERVE THE PRESCRIPTION, FEED WITH TECHNIQUE, WATCH, and REPORT. CNAs do not diagnose swallowing problems, change diet textures or liquid thickness, or perform swallow evaluations.',
            },
            {
              id: 'dy-s01-lo-text',
              type: 'text',
              body: 'By the end of this course, you will be able to:',
            },
            {
              id: 'dy-s01-lo-summary',
              type: 'summary',
              title: 'Learning objectives',
              items: [
                'Explain dysphagia and aspiration.',
                'Recognize the signs of unsafe swallowing — loud and silent.',
                'Serve prescribed textures exactly and feed safely.',
                'Respond to a choking emergency.',
                'Know your scope — what a CNA does, and what a CNA must never do.',
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
            { id: 'dy-s02-heading', type: 'heading', level: 1, text: 'Key terms' },
            {
              id: 'dy-s02-image',
              type: 'image',
              src: `${ASSET_BASE}/s02-hero.jpg`,
              caption:
                'Key terms — dysphagia, aspiration, aspiration pneumonia, thickened liquids, diet texture.',
            },
            {
              id: 'dy-s02-reveal-dysphagia',
              type: 'reveal_card',
              frontTitle: 'Dysphagia',
              frontBody: 'Dis-FAY-jah',
              backTitle: 'Dysphagia',
              backBody:
                'Difficulty swallowing. Food or liquid moves from mouth to stomach slowly, incompletely, or unsafely. It\'s common after stroke and in Parkinson\'s, dementia, and general weakness — and it makes every meal a moment that needs care and attention.',
            },
            {
              id: 'dy-s02-reveal-aspiration',
              type: 'reveal_card',
              frontTitle: 'Aspiration',
              frontBody: 'As-pih-RAY-shun',
              backTitle: 'Aspiration',
              backBody:
                'When food, liquid, or saliva goes down the wrong way — into the airway and lungs instead of the stomach. Aspiration can cause immediate choking, or it can quietly plant material in the lungs that leads to pneumonia.',
            },
            {
              id: 'dy-s02-reveal-silent-aspiration',
              type: 'reveal_card',
              frontTitle: 'Silent Aspiration',
              frontBody: 'Silent aspiration',
              backTitle: 'Silent Aspiration',
              backBody:
                'Aspiration with no cough, no choking, no obvious sign — food or liquid slips into the airway and the resident doesn\'t react. It\'s invisible in the moment, which is why subtle signs like a wet voice or mealtime fatigue matter so much.',
            },
            {
              id: 'dy-s02-reveal-aspiration-pneumonia',
              type: 'reveal_card',
              frontTitle: 'Aspiration Pneumonia',
              frontBody: 'New-MOAN-yah',
              backTitle: 'Aspiration Pneumonia',
              backBody:
                'A lung infection caused by food, liquid, or saliva that was aspirated into the lungs. It\'s one of the most serious dangers of dysphagia — and one of the most preventable, through safe swallowing care and good mouth care.',
            },
            {
              id: 'dy-s02-reveal-texture-modified-diet',
              type: 'reveal_card',
              frontTitle: 'Texture-Modified Diet',
              frontBody: 'Texture-modified diet',
              backTitle: 'Texture-Modified Diet',
              backBody:
                'Food prepared at a prescribed texture the resident can swallow safely — such as pureed, smooth like pudding; or minced and moist, finely chopped and soft. The exact level is set by the team. Serving the prescribed texture exactly is a safety order.',
            },
            {
              id: 'dy-s02-reveal-thickened-liquids',
              type: 'reveal_card',
              frontTitle: 'Thickened Liquids',
              frontBody: 'Thickened liquids',
              backTitle: 'Thickened Liquids',
              backBody:
                'Liquids thickened to a prescribed level — commonly nectar-thick, like a fruit nectar; or honey-thick, flowing slowly like honey. Thin liquids move fast and are the easiest thing to aspirate; thickening slows them so a weak swallow can control them. Never thin them down.',
            },
            {
              id: 'dy-s02-reveal-pocketing',
              type: 'reveal_card',
              frontTitle: 'Pocketing',
              frontBody: 'Pocketing',
              backTitle: 'Pocketing',
              backBody:
                'When food collects and stays in the cheek or mouth instead of being swallowed — common with weakness, stroke, or dementia. Pocketed food can be aspirated later, even after the meal ends. Checking the mouth after meals catches it.',
            },
            {
              id: 'dy-s02-reveal-chin-tuck',
              type: 'reveal_card',
              frontTitle: 'Chin-Tuck (and Swallow Strategies)',
              frontBody: 'Chin-tuck',
              backTitle: 'Chin-Tuck (and Swallow Strategies)',
              backBody:
                'A swallowing strategy where the resident tucks their chin down toward the chest while swallowing, which can help protect the airway — used only when the speech therapist prescribes it. Swallow strategies are individual: follow exactly what\'s in each resident\'s plan.',
            },
            {
              id: 'dy-s02-kc1-check-silent-aspiration',
              type: 'knowledge_check',
              question:
                'Match the term: food or liquid enters the airway with no cough or sign',
              options: [
                { id: 'silent-aspiration', label: 'Silent aspiration' },
                { id: 'thickened-liquids', label: 'Thickened liquids' },
                { id: 'pocketing', label: 'Pocketing' },
              ],
              correctOptionId: 'silent-aspiration',
              explanation:
                'Silent aspiration. Aspiration with no cough, no choking, no obvious sign — food or liquid slips into the airway and the resident doesn\'t react. It\'s invisible in the moment, which is why subtle signs like a wet voice or mealtime fatigue matter so much.',
              requiredForCompletion: true,
            },
            {
              id: 'dy-s02-kc1-check-thickened-liquids',
              type: 'knowledge_check',
              question:
                'Match the term: liquids slowed to a prescribed thickness for a weak swallow',
              options: [
                { id: 'silent-aspiration', label: 'Silent aspiration' },
                { id: 'thickened-liquids', label: 'Thickened liquids' },
                { id: 'pocketing', label: 'Pocketing' },
              ],
              correctOptionId: 'thickened-liquids',
              explanation:
                'Thickened liquids. Liquids thickened to a prescribed level — commonly nectar-thick, like a fruit nectar; or honey-thick, flowing slowly like honey. Thin liquids move fast and are the easiest thing to aspirate; thickening slows them so a weak swallow can control them. Never thin them down.',
              requiredForCompletion: true,
            },
            {
              id: 'dy-s02-kc1-check-pocketing',
              type: 'knowledge_check',
              question:
                'Match the term: food collecting in the cheek instead of being swallowed',
              options: [
                { id: 'silent-aspiration', label: 'Silent aspiration' },
                { id: 'thickened-liquids', label: 'Thickened liquids' },
                { id: 'pocketing', label: 'Pocketing' },
              ],
              correctOptionId: 'pocketing',
              explanation:
                'Pocketing. When food collects and stays in the cheek or mouth instead of being swallowed — common with weakness, stroke, or dementia. Pocketed food can be aspirated later, even after the meal ends. Checking the mouth after meals catches it.',
              requiredForCompletion: true,
            }
          ]),
      },
      {
        slug: 's03-statistics',
        title: 'Statistics',
        sortOrder: 2,
        buildContent: () =>
          doc('Statistics', [
            { id: 'dy-s03-heading', type: 'heading', level: 1, text: 'Statistics' },
            pendingAudio(
              'dy-s03-audio',
              'Dysphagia: The Everyday Danger Hiding at Mealtime',
              `${ASSET_BASE}/s03-stats-podcast.mp3`,
              [
                'Dysphagia: The Everyday Danger Hiding at Mealtime',
                '',
                'Swallowing difficulty is one of the most widespread and underestimated problems in long-term care. Estimates vary, but studies consistently find that a large share of nursing home residents — commonly cited at half or more — have some degree of dysphagia. It\'s especially common after stroke, where swallowing problems affect a majority of survivors at least initially, and in Parkinson\'s disease, dementia, and general frailty. In other words: in any dining room in any facility, many of the residents eating in front of you have swallows that can\'t fully protect their airways.',
                '',
                'The headline danger is aspiration pneumonia — lung infection caused by food, liquid, or saliva entering the lungs. Aspiration pneumonia is one of the leading causes of hospitalization and death in nursing home residents, and dysphagia is its main driver. And here is the fact that should change how every CNA watches a meal: much of the aspiration that causes it is silent. Research using swallow imaging shows that a substantial portion of residents who aspirate do so with no cough and no visible distress — the material simply slips into the airway. Nobody chokes; nobody notices; the pneumonia arrives days later. This is why subtle signs — a wet, gurgly voice after sips, a fever days after meals, recurring chest infections — matter so much.',
                '',
                'Dysphagia also starves and dehydrates. Eating becomes slow, tiring, and sometimes frightening, so residents eat and drink less. Malnutrition and dehydration follow, weakening residents further — which worsens the swallow, a vicious cycle. Some residents with dysphagia quietly avoid meals altogether out of fear or embarrassment.',
                '',
                'Now the empowering part. The protections against all of this are overwhelmingly mealtime care — CNA work. Serving the exact prescribed texture and thickness. Upright positioning. Small bites, slow pace, full attention. Checking for pocketing. Staying upright after meals. Good mouth care, which research shows independently reduces aspiration pneumonia by reducing the bacteria that ride aspirated material into the lungs. Studies of structured mealtime programs show real reductions in aspiration events and pneumonia.',
                '',
                'The bottom line: dysphagia is everywhere in long-term care, its deadliest harm often arrives silently, and the CNA at the table — precise, patient, and watchful — is the resident\'s main protection.',
              ].join('\n'),
              '/assets/courses/dysphagia/s03-stats-podcast.mp3',
            ),
            {
              id: 'dy-s03-image',
              type: 'image',
              src: `${ASSET_BASE}/s03-hero.jpg`,
              caption:
                'Swallowing problems are common and dangerous — and often quiet until harm is done.',
            },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: 'Fundamentals',
        sortOrder: 3,
        buildContent: () =>
          doc('Fundamentals', [
            { id: 'dy-s04-heading', type: 'heading', level: 1, text: 'Fundamentals' },
            {
              id: 'dy-s04-video',
              type: 'video',
              title: 'Fundamentals',
              videoUrl: '/assets/courses/dysphagia/s04-fundamentals.mp4',
              placeholderNote: 'Pending upload: /assets/courses/dysphagia/s04-fundamentals.mp4',
            },
            {
              id: 'dy-s04-image',
              type: 'image',
              src: `${ASSET_BASE}/s04-hero.jpg`,
              caption:
                'How swallowing fails, and why the wrong liquid or texture can go into the lungs.',
            },
            {
              id: 'dy-s04-narration',
              type: 'text',
              body: [
                '**The swallow: precision in a split second**',
                'Every swallow is a precision event. Dozens of muscles and nerves move food from the mouth, through the throat, and into the food pipe — while a small flap and other protections close off the airway at exactly the right instant, so nothing enters the lungs. It happens in about a second, hundreds of times a day, and when it works, we never think about it.',
                '**The crossroads in the throat**',
                'Here\'s the anatomy that makes swallowing risky: in the throat, the path for food and the path for air cross. Food and liquid must go down the food pipe to the stomach; air must go down the windpipe to the lungs — and both share the same intersection. A healthy swallow guards that crossroads perfectly. A weakened swallow guards it poorly — and food or liquid can take the wrong turn.',
                '**What dysphagia is**',
                'Dysphagia is that guarding system breaking down. Muscles weakened by stroke or Parkinson\'s, coordination scrambled by dementia, or general frailty — the split-second sequence misfires. Food moves too slowly, gets stuck, or is left behind in the mouth. Liquids — which move fastest — outrun the swallow entirely. And the airway, unguarded at the wrong moment, lets material in. That\'s aspiration.',
                '**Why thin liquids are the hardest**',
                'It surprises people, but thin liquids — water, juice, coffee — are the most dangerous thing for a weak swallow, not steak. Thin liquids move fast and scatter; a slow, weak swallow can\'t gather and control them before they reach the unguarded airway. That\'s the entire logic of thickened liquids: thickening slows the liquid down to a speed the weakened swallow can manage. It\'s also why "just a little water" can be the most dangerous kindness of all.',
                '**The two faces of aspiration**',
                'When material enters the airway, two things can happen. The loud face: the body fights back — coughing, sputtering, choking — distress everyone can see, sometimes a blocked airway needing emergency response. The quiet face: in many residents with dysphagia, the protective reflexes themselves are dulled, so material slips in with no cough at all. Silent aspiration. The danger didn\'t announce itself — it just moved into the lungs.',
                '**From aspiration to pneumonia**',
                'Aspirated material — food, liquid, or saliva — carries mouth bacteria into the lungs, where it causes infection: aspiration pneumonia. This is the gravest routine danger of dysphagia. Two protections work together: safe swallowing care, so less material is aspirated — and meticulous mouth care, so whatever is aspirated carries fewer bacteria. A clean mouth genuinely makes aspiration less deadly.',
                '**Managed well, mealtimes stay safe and human**',
                'Dysphagia is managed, not usually cured: the speech-language pathologist evaluates the swallow and prescribes the exact textures, thickness, and strategies that resident can handle safely. Within that plan, residents can eat safely, stay nourished, and keep the deep human pleasure of meals. Delivering that plan precisely, patiently, and with dignity — that\'s the CNA\'s table.',
              ].join('\n\n'),
            },
            {
              id: 'dy-s04-thin-liquids-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Thin liquids move FAST',
              body: 'A weak swallow can\'t catch them. Never thin a thickened liquid.',
            }
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
        sortOrder: 4,
        buildContent: () =>
          doc('Signs & Symptoms', [
            { id: 'dy-s05-heading', type: 'heading', level: 1, text: 'Signs & Symptoms' },
            {
              id: 'dy-s05-image',
              type: 'image',
              src: `${ASSET_BASE}/s05-hero.jpg`,
              caption:
                'Recognizing trouble — coughing, wet voice, and the silent signs that show no cough at all.',
            },
            {
              id: 'dy-s05-narration',
              type: 'text',
              body: [
                'Your eyes and ears at the table are the resident\'s protection. Let\'s learn the warning signs of unsafe swallowing — the obvious ones, the quiet ones, and the emergency.',
                '**The mealtime warning signs**',
                'Watch for trouble during every meal and every drink. Coughing or throat-clearing during or right after eating or drinking — especially with thin liquids. Choking or gagging on food. A wet, gurgly, or hoarse voice after swallowing — as if they\'re speaking through liquid. Multiple swallows needed for one bite. Food or liquid leaking from the mouth, or coming back up through the nose. A sensation of food sticking in the throat. Watering eyes or a reddening face while eating. Each of these says the swallow is struggling — slow down, follow the plan, and report a pattern.',
                '**The slow-meal and pocketing signs**',
                'Some signs are quieter. Meals taking far longer than they used to. The resident tiring out partway through, with the swallow getting sloppier as fatigue grows — late-meal bites are often the riskiest. Pocketing: food collecting in the cheek or sitting on the tongue, not swallowed — check the mouth during and after meals, because pocketed food can be aspirated long after the tray is gone. Avoiding certain foods, drooling, or seeming afraid of meals. These quieter signs deserve reporting just as much as a coughing fit.',
                '**The clues of silent aspiration**',
                'Now the hardest signs — the clues that aspiration is happening with no cough at all. A wet or gurgly voice quality after sips, even without coughing. Frequent low-grade fevers, or fevers that arrive a day or two after meals. Recurring chest congestion or repeated pneumonias. Unexplained weight loss as eating quietly declines. A resident with known dysphagia who "never coughs" — which may mean their protective reflexes are too dulled to respond. None of these is dramatic; together they sketch a swallow quietly failing. Report the pattern — it\'s exactly what triggers a swallow re-evaluation.',
                '**Choking: the emergency**',
                'And the loud emergency: choking, when food blocks the airway. The universal sign — hands clutching the throat. Unable to speak, cough, or breathe, or only a silent, ineffective cough. A face turning red, then bluish. Panic in the eyes. A resident who CAN cough forcefully or speak still has air moving — encourage coughing and stay right there. A resident who CANNOT speak, cough, or breathe has a blocked airway — this is the emergency: call for help and respond immediately with the choking response you were trained in, per your facility\'s procedure. Seconds matter.',
                '**Summary**',
                'Three pictures. Mealtime warnings: coughing with food or drink, wet voice, multiple swallows, pocketing, slow exhausting meals — follow the plan, report the pattern. Silent aspiration clues: wet voice without cough, fevers after meals, repeat chest infections, weight loss — report; they trigger re-evaluation. Choking: can\'t speak, can\'t cough, can\'t breathe — emergency response now, per your training.',
                'The rule underneath it all: with dysphagia, watch every meal like it matters — because the most dangerous swallow is often the one that makes no sound.',
              ].join('\n\n'),
            },
            {
              id: 'dy-s05-silent-callout',
              type: 'callout',
              variant: 'warning',
              title: 'The silent aspiration picture',
              body: 'A wet, gurgly voice without coughing, fevers after meals, repeat chest infections, and weight loss sketch silent aspiration — report the pattern.',
            }
          ]),
      },
      {
        slug: 's06-causes',
        title: 'Causes',
        sortOrder: 5,
        buildContent: () =>
          doc('Causes', [
            { id: 'dy-s06-heading', type: 'heading', level: 1, text: 'Causes' },
            pendingAudio(
              'dy-s06-audio',
              'What Causes Dysphagia — and What Makes a Meal Risky?',
              `${ASSET_BASE}/s06-causes-podcast.mp3`,
              [
                'What Causes Dysphagia — and What Makes a Meal Risky?',
                '',
                'Dysphagia is usually a symptom of something else — a condition that has damaged the muscles, nerves, or coordination the swallow depends on.',
                '',
                'The biggest cause is stroke: a stroke can weaken or de-coordinate the swallowing muscles on one or both sides, and swallowing problems affect a majority of stroke survivors at least early on. Parkinson\'s disease stiffens and slows the swallowing muscles just as it does the limbs. Dementia disrupts the brain\'s control of the sequence — and in later stages, residents may forget to chew or swallow, hold food, or no longer recognize it. Other causes include multiple sclerosis, ALS, head and neck cancers and their treatments, general frailty and muscle loss with age, and simple deconditioning after illness. Poor or missing teeth and ill-fitting dentures make chewing inadequate, sending poorly prepared food to a swallow that can\'t compensate. Dry mouth — common with many medications — robs the swallow of the saliva that binds and lubricates food. And sedating medications can dull the alertness and reflexes swallowing requires.',
                '',
                'For the CNA, though, the most useful lens is meal-level risk: what makes this meal, today, more dangerous — because those factors are largely in your hands.',
                '',
                'A meal is riskier when the resident is drowsy, sedated, or not fully alert — never feed a resident who isn\'t awake and alert. When they\'re slumped, reclined, or lying down rather than fully upright. When the pace is rushed — bites too large, too fast, or stacked before the last swallow finished. When the wrong texture or thickness is served, or a thickened liquid is thinned "to be kind." When distractions pull attention from eating, or the resident is talking and laughing mid-swallow. When fatigue sets in late in a long meal. When dentures are out or fitting badly. And when the mouth is unclean, loading any aspirated material with bacteria.',
                '',
                'Flip each risk and you have the CNA\'s protections: alert and upright, correct texture and thickness, small bites at a calm pace, attention on the meal, watch the late-meal fatigue, dentures in and fitting, mouth kept clean. The diagnosis explains why the swallow is weak; the CNA controls how safe each meal is anyway.',
              ].join('\n'),
              '/assets/courses/dysphagia/s06-causes-podcast.mp3',
            ),
            {
              id: 'dy-s06-image',
              type: 'image',
              src: `${ASSET_BASE}/s06-hero.jpg`,
              caption:
                "What causes dysphagia — stroke, dementia, Parkinson's, and aging muscles.",
            },
          ]),
      },
      {
        slug: 's07-role',
        title: 'CNA Role & Best Practices',
        sortOrder: 6,
        buildContent: () =>
          doc('CNA Role & Best Practices', [
            { id: 'dy-s07-heading', type: 'heading', level: 1, text: 'CNA Role & Best Practices' },
            {
              id: 'dy-s07-image',
              type: 'image',
              src: `${ASSET_BASE}/s07-hero.jpg`,
              caption:
                'CNA scope — safe feeding, upright positioning, and reporting; never change a diet order or give meds.',
            },
            {
              id: 'dy-s07-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of practice',
              body: 'CNAs SERVE THE PRESCRIPTION, FEED WITH TECHNIQUE, WATCH, and REPORT. CNAs never diagnose, change textures or thickness, or perform swallow evaluations.',
            },
            {
              id: 'dy-s07-narration',
              type: 'text',
              body: [
                'Dysphagia treatment is built by the speech-language pathologist and delivered, meal by meal, largely by the CNA. Let\'s walk through it, starting with the rule that never bends. A CNA does not diagnose swallowing problems, does not change diet textures or liquid thickness, and does not perform swallow evaluations. The prescribed texture and thickness are orders — as serious as medication orders.',
                '**The swallow evaluation and the prescription.** When swallowing is in question, the speech-language pathologist evaluates it and prescribes what\'s safe: the food texture — such as pureed, or minced and moist; the liquid thickness — such as nectar-thick or honey-thick; and any strategies, like a chin-tuck or smaller sips. Your reports of mealtime signs are often what trigger that evaluation — and your precision is what makes the prescription work.',
                '**Serving the prescription exactly.** Check every tray against the resident\'s prescribed texture and thickness before the first bite — kitchens make mistakes, and trays get switched. Prepare thickened liquids exactly as directed where that\'s your role. Never thin a thickened liquid, never give restricted thin liquids — including water, ice chips if restricted, and the water with pills, which the nurse manages — and never give food a texture above the order, no matter who asks. When family brings food, flag it to the nurse before it\'s offered. The wrong texture can put a meal in the lungs.',
                '**Safe feeding technique — the standards.** Fully upright — ninety degrees — for every meal, snack, drink, and pill, and remaining upright afterward as the plan directs. Fully awake and alert — never feed a drowsy resident. Small bites and small sips, one at a time, with the previous swallow confirmed before the next. A calm, unhurried pace with attention on the meal — minimal distractions, no questions timed to mid-swallow. Use the prescribed strategies, and no straws if restricted, since straws shoot liquid fast and deep. Check for pocketing during and after, and leave the mouth empty and the resident upright when you go.',
                '**Mouth care as treatment.** Meticulous mouth care — teeth, gums, tongue, dentures — reduces the bacteria that make aspirated material infectious. For a dysphagia resident, mouth care is genuine pneumonia prevention, every day.',
                '**Medications at mealtime.** The nurse manages medications, including how pills are safely given — some are crushed or changed in form per the pharmacist, never on your own initiative. Report swallowing trouble with pills, and report sedation that\'s making mealtimes unsafe.',
                'The scope point for this section: you never evaluate, never alter textures — but you verify every tray, deliver the technique standards every meal, keep the mouth clean, and report what you see. The plan is theirs; the safety of each swallow is largely yours.',
              ].join('\n\n'),
            }
          ]),
      },
      {
        slug: 's08-prevention',
        title: 'Prevention & Risk Reduction',
        sortOrder: 7,
        buildContent: () =>
          doc('Prevention & Risk Reduction', [
            { id: 'dy-s08-heading', type: 'heading', level: 1, text: 'Prevention & Risk Reduction' },
            {
              id: 'dy-s08-image',
              type: 'image',
              src: `${ASSET_BASE}/s08-hero.jpg`,
              caption:
                'Prevention — honoring prescribed textures, sitting upright, small bites, and never rushing a meal.',
            },
            {
              id: 'dy-s08-narration',
              type: 'text',
              body: [
                'With dysphagia, prevention happens one swallow at a time. Here are seven ways CNAs keep mealtimes safe.',
                '**One. Upright for everything — and afterward.** Position the resident fully upright, at ninety degrees, for every meal, every snack, every drink, and every pill — no slumping, no reclining, properly supported. And keep them upright after eating as the care plan directs, so nothing left in the throat or coming back up can slide into the airway. Upright is the foundation of every safe swallow.',
                '**Two. Verify the tray, every time.** Before the first bite, check the tray against the resident\'s prescribed texture and liquid thickness. Wrong trays happen. Catching a thin juice on a nectar-thick order, before it\'s sipped, is exactly the kind of save this course exists for.',
                '**Three. Feed slow and small — and one at a time.** Small bites, small sips, one at a time, with the previous swallow finished before the next begins. Never rush, never stack bites, never feed to the clock. With a weak swallow, pace is protection.',
                '**Four. Keep attention on the meal.** Mealtime is care time. Minimize distractions, don\'t ask questions timed to mid-swallow, and keep your own attention on the resident — watching each swallow, watching for fatigue as the meal goes on, and pausing or stopping when the swallow gets sloppy. The riskiest bites are often the tired ones at the end.',
                '**Five. Never feed a resident who isn\'t alert.** Drowsy, sedated, or barely awake means the swallow\'s protections are down. Don\'t start the meal — and report it, because a resident repeatedly too drowsy to eat safely needs the team\'s attention. Alertness first, food second.',
                '**Six. Check the mouth, and keep it clean.** Check for pocketing during and after meals, and make sure the mouth is empty before the resident lies down. And give meticulous mouth care every day — a clean mouth makes any aspiration far less likely to become pneumonia. Mouth care is pneumonia prevention.',
                '**Seven. Report the pattern — it triggers the help.** Report coughing with meals, wet voice, pocketing, slower meals, weight loss, fevers, and anything that suggests the swallow is changing. Your reports are what bring the speech therapist back to re-evaluate and adjust the plan — often before the pneumonia, not after.',
              ].join('\n\n'),
            }
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
        sortOrder: 8,
        buildContent: () =>
          doc('Scenario & Reporting', [
            { id: 'dy-s09-heading', type: 'heading', level: 1, text: 'Scenario & Reporting' },
            pendingAudio(
              'dy-s09-intro-audio',
              'Emergency response scenarios intro',
              `${ASSET_BASE}/s09-emergency-intro.mp3`,
              'With dysphagia, the judgments that matter most are refusing the dangerous kindness of the wrong liquid, and recognizing the quiet pattern of silent aspiration. You\'re about to work through two situations. Read each carefully, choose your action, and you\'ll get feedback right away. Keep the core ideas in mind: the texture order is as serious as a medication order — and the most dangerous swallow is often the one that makes no sound.',
              '/assets/courses/dysphagia/s09-emergency-intro.mp3',
            ),
            {
              id: 'dy-s09-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-hero.jpg`,
              caption:
                'Two dysphagia judgments — a dangerous request for thin liquids, and a silent aspiration pattern.',
            },
            {
              id: 'dy-s09-scenario-reyes-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-scenario-reyes.jpg`,
              caption:
                'Never give thin liquids against the order — offer the prescribed thickened fluids and report her distress.',
            },
            {
              id: 'dy-s09-scenario-reyes',
              type: 'scenario_question',
              prompt:
                'Mrs. Reyes is on honey-thick liquids after her stroke. At lunch she pleads with you: "Please, just one glass of real water — this thick stuff is awful. One little glass won\'t hurt." A coworker shrugs: "Poor thing. Just give her regular water this once and don\'t mention it." What SHOULD the CNA do?',
              options: [
                {
                  id: 'give-plain-water',
                  label: 'Give her plain water just this once — kindness matters',
                  feedback:
                    'Giving or sneaking thin water, or thinning her drink, can send liquid straight into her lungs — thin liquids are exactly what her weakened swallow cannot control, and aspiration pneumonia is the result. The kind and correct action: explain warmly why her liquids are thickened, offer her prescribed fluids, and report her distress so the team can look for better options.',
                },
                {
                  id: 'report-nurse',
                  label:
                    'Kindly explain you can\'t, offer her prescribed honey-thick fluids, and tell the nurse about her distress so the team can help',
                  feedback:
                    'Right — and this is one of the hardest moments in dysphagia care. Thin water is the single easiest thing for her weakened swallow to aspirate: it moves too fast for her swallow to control, and "one little glass" can go straight toward her lungs and seed a pneumonia. There is no safe halfway — thinning the prescribed thickness defeats its purpose. The truly kind response is honest and warm: explain simply that her swallow needs slower liquids right now to keep water out of her lungs, offer her prescribed fluids and comfort measures, and report her distress to the nurse — because the team and speech therapist may have options: flavor changes, different thickener, a re-evaluation, or other comfort strategies. Compassion here means protecting her lungs AND taking her misery seriously — not secretly endangering her.',
                  isRecommended: true,
                },
                {
                  id: 'thin-drink',
                  label: 'Thin her thickened drink halfway as a compromise',
                  feedback:
                    'Giving or sneaking thin water, or thinning her drink, can send liquid straight into her lungs — thin liquids are exactly what her weakened swallow cannot control, and aspiration pneumonia is the result. The kind and correct action: explain warmly why her liquids are thickened, offer her prescribed fluids, and report her distress so the team can look for better options.',
                },
                {
                  id: 'sneak-water',
                  label: 'Let her sip water when no one is watching',
                  feedback:
                    'Giving or sneaking thin water, or thinning her drink, can send liquid straight into her lungs — thin liquids are exactly what her weakened swallow cannot control, and aspiration pneumonia is the result. The kind and correct action: explain warmly why her liquids are thickened, offer her prescribed fluids, and report her distress so the team can look for better options.',
                },
              ],
              requiredForCompletion: true,
            },
            {
              id: 'dy-s09-scenario-dubois-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-scenario-dubois.jpg`,
              caption:
                'No cough, but wet voice, fevers, and weight loss: silent aspiration — report for swallow re-evaluation.',
            },
            {
              id: 'dy-s09-scenario-dubois',
              type: 'scenario_question',
              prompt:
                'Mr. Dubois has Parkinson\'s and known mild dysphagia, but he "never coughs at meals," so some staff assume his swallowing is fine. Over two weeks, you\'ve noticed: his voice often sounds wet and gurgly after drinks, though he doesn\'t cough; he\'s had two low-grade fevers that passed; meals take much longer and he\'s lost a little weight; and he\'s now had his second chest congestion this month. What SHOULD the CNA do?',
              options: [
                {
                  id: 'assume-fine',
                  label: 'Assume his swallowing is fine since he never coughs or chokes',
                  feedback:
                    '"Never coughs" can mean silent aspiration — the reflexes too dulled to respond while liquid slips into the lungs. The wet voice, recurring fevers, slowing meals, weight loss, and repeat chest congestion form the classic quiet pattern. Thinning his liquids or speeding him up would add danger. The right action: report the full pattern as possible silent aspiration so the swallow can be re-evaluated.',
                },
                {
                  id: 'report-pattern',
                  label:
                    'Report the pattern — wet voice, fevers, slow meals, weight loss, repeat chest congestion — as possible silent aspiration',
                  feedback:
                    'Exactly right. "He never coughs" is not reassurance in dysphagia — in silent aspiration, food and liquid enter the airway WITHOUT triggering a cough, because the protective reflexes themselves are dulled. The pattern you\'ve gathered is the classic sketch of it: a wet, gurgly voice after drinks, recurring low-grade fevers, lengthening meals with weight loss, and repeated chest congestion. No single item is dramatic; together they say material may be quietly reaching his lungs. Report the whole pattern to the nurse — this is precisely what triggers a swallow re-evaluation by the speech therapist, and catching it now may prevent a serious aspiration pneumonia. Never loosen his textures yourself, and never rush a weak swallow.',
                  isRecommended: true,
                },
                {
                  id: 'switch-thin',
                  label: 'Switch him to thin liquids since thick ones take too long',
                  feedback:
                    '"Never coughs" can mean silent aspiration — the reflexes too dulled to respond while liquid slips into the lungs. The wet voice, recurring fevers, slowing meals, weight loss, and repeat chest congestion form the classic quiet pattern. Thinning his liquids or speeding him up would add danger. The right action: report the full pattern as possible silent aspiration so the swallow can be re-evaluated.',
                },
                {
                  id: 'eat-faster',
                  label: 'Just encourage him to eat faster',
                  feedback:
                    '"Never coughs" can mean silent aspiration — the reflexes too dulled to respond while liquid slips into the lungs. The wet voice, recurring fevers, slowing meals, weight loss, and repeat chest congestion form the classic quiet pattern. Thinning his liquids or speeding him up would add danger. The right action: report the full pattern as possible silent aspiration so the swallow can be re-evaluated.',
                },
              ],
              requiredForCompletion: true,
            }
          ]),
      },
      {
        slug: 's10-cna-role',
        title: "CNA's Role in Care",
        sortOrder: 9,
        buildContent: () =>
          doc("CNA's Role in Care", [
            { id: 'dy-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
              id: 'dy-s10-video',
              type: 'video',
              title: "The CNA's Role",
              videoUrl: '/assets/courses/dysphagia/s10-cna-role.mp4',
              placeholderNote: 'Pending upload: /assets/courses/dysphagia/s10-cna-role.mp4',
            },
            {
              id: 'dy-s10-image',
              type: 'image',
              src: `${ASSET_BASE}/s10-hero.jpg`,
              caption:
                'The CNA as the daily guard — safe positioning and sharp observation prevent aspiration.',
            },
            {
              id: 'dy-s10-narration',
              type: 'text',
              body: [
                'Your role in dysphagia care is precision, patience, watchfulness, and readiness. Let\'s walk through it.',
                '**Deliver the prescription precisely** Be exact. Know each resident\'s prescribed texture, liquid thickness, and strategies, verify every tray before the first bite, prepare thickened liquids exactly as directed, and never give restricted thin liquids or upgraded textures — not for pleading, not for convenience, not "just once." Flag family food to the nurse first. Precision at the tray is where dysphagia safety starts.',
                '**Feed with technique and patience** Make every swallow safer. Fully upright, fully alert, small bites and sips one at a time, swallow confirmed before the next, calm pace, attention on the meal, prescribed strategies used, no straws if restricted, and upright afterward as directed. Watch for late-meal fatigue and slow down or pause when the swallow tires. Mealtime with a dysphagia resident is skilled care, not a task to race through — and done warmly, it keeps meals human and unhurried for a person who may fear them.',
                '**Watch, check, and report** Be the eyes the swallow doesn\'t have. Watch every meal for coughing, wet voice, multiple swallows, and struggle. Check for pocketing during and after, leaving the mouth empty. Give the daily mouth care that makes any aspiration less dangerous. And report patterns — the loud signs and especially the quiet ones: wet voice without cough, fevers, slowing meals, weight loss, repeat chest congestion. Your pattern reports trigger the re-evaluations that prevent pneumonias.',
                '**Be ready for the emergency** And be ready. Know the choking signs — can\'t speak, can\'t cough, can\'t breathe, hands at the throat — and respond immediately per your training and facility procedure, calling for help as you act. Know that a resident coughing forcefully still has air — stay, encourage, watch. Afterward, any choking or suspected aspiration event is reported, even if it seemed to resolve, because what reached the lungs can declare itself days later.',
                'Now the boundary. You do not diagnose swallowing problems, do not change textures or thickness, do not perform evaluations, and do not crush or alter pills on your own. You never feed a resident who isn\'t upright and alert, and never trade safety for speed or sympathy.',
                'Inside your role — the prescription delivered precisely, the technique held every meal, the patterns watched and reported, the emergency response ready — you stand between a vulnerable swallow and the lungs behind it, three times a day, every day. Few forms of care prevent more harm.',
              ].join('\n\n'),
            },
            {
              id: 'dy-s10-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Stay within scope',
              body: 'You do not diagnose swallowing problems, do not change textures or thickness, do not perform evaluations, and do not crush or alter pills on your own. You never feed a resident who isn\'t upright and alert, and never trade safety for speed or sympathy.',
            }
          ]),
      },
      {
        slug: 's11-case-study',
        title: 'Case Study',
        sortOrder: 10,
        buildContent: () => {
          const caseNarrative = [
            'Mr. Dubois, 77, had Parkinson\'s disease and mild dysphagia, managed with minced-moist food and nectar-thick liquids. He was a gentle, uncomplaining man — and among some staff he had a reputation as an "easy" mealtime: "He never coughs, never chokes. His swallowing\'s fine." His CNA, Tomas, wasn\'t so sure.',
            '',
            '**The pattern nobody else assembled:** Tomas had taken the dysphagia training seriously, and one line had lodged in his memory: the most dangerous swallow is often the one that makes no sound. Over two weeks, he noticed small things. Mr. Dubois\'s voice often turned wet and gurgly after his thickened juice — though he never coughed. His meals were stretching longer, and he tired visibly by the end, his last bites slower and sloppier. He\'d had two low-grade fevers that came and went without explanation. His weight was drifting down. And now he was congested in the chest for the second time in a month. Each item, alone, was shrugged off — "he\'s just slowing down," "a little cold." Tomas wrote them down and saw them together.',
            '',
            '**What Tomas knew:** A wet voice after drinks with no cough. Fevers without a source. Slowing, exhausting meals and weight loss. Repeating chest trouble. In a Parkinson\'s resident with known dysphagia, that wasn\'t aging — that was the classic quiet sketch of silent aspiration: liquid slipping into his airway without triggering any cough at all, because the reflexes themselves had dulled. "He never coughs" wasn\'t reassurance. It might be the problem.',
            '',
            '**What Tomas did:** He reported the pattern, specifically and together: "I don\'t think Mr. Dubois\'s swallow is as safe as we think. His voice goes wet after drinks but he never coughs. His meals are much longer and he fades at the end. Two low-grade fevers in two weeks, weight\'s down, and this is his second chest congestion this month. I\'m worried he\'s silently aspirating — could the speech therapist take another look?" In the meantime, he tightened everything in his control: fully upright, smaller sips, slower pace, pausing when fatigue set in, meticulous mouth care, and watching the late-meal bites closely.',
            '',
            '**The re-evaluation:** The nurse escalated, and the speech-language pathologist re-evaluated Mr. Dubois\'s swallow. The study confirmed Tomas\'s suspicion: he was silently aspirating thin and even some nectar-thick liquids, with no cough response at all. His plan was changed — honey-thick liquids, revised strategies, and added precautions — calibrated to what his swallow could actually still protect.',
            '',
            '**The outcome:** On the corrected plan, Mr. Dubois\'s wet voice faded, the mystery fevers stopped, the chest congestion didn\'t return, and his weight stabilized. The pneumonia that was assembling itself in his lungs never arrived. The speech therapist told Tomas: "Silent aspirators don\'t announce themselves — someone has to assemble the clues. Everyone else heard \'he never coughs\' and relaxed. You heard it and worried. That\'s what caught this."',
            '',
            '**Discussion:** Tomas\'s save was made of observation and pattern-thinking — the heart of this course. He refused the false reassurance of "no coughing," gathered the quiet clues — wet voice, fevers, fatigue, weight loss, chest infections — and reported them together, which is what made them legible. He tightened his own technique while waiting, and he never overstepped: he didn\'t diagnose, didn\'t change a texture, didn\'t loosen or guess. He watched, assembled, reported, and delivered the plan precisely. The pneumonia that never happened is the measure of how much a watchful CNA at the table protects.',
          ].join('\n');

          return doc('Case Study', [
            { id: 'dy-s11-heading', type: 'heading', level: 1, text: 'Case Study' },
            pendingAudio(
              'dy-s11-audio',
              'The Man Who Never Coughed',
              `${ASSET_BASE}/s11-case-podcast.mp3`,
              caseNarrative,
              '/assets/courses/dysphagia/s11-case-podcast.mp3',
            ),
            {
              id: 'dy-s11-image',
              type: 'image',
              src: `${ASSET_BASE}/s11-hero.png`,
              caption:
                "Recognizing the pattern — how careful feeding and quick reporting protected a resident's lungs.",
            },
            {
              id: 'dy-s11-case-study',
              type: 'case_study',
              title: 'The Man Who Never Coughed',
              residentProfile:
                'Mr. Dubois, 77, had Parkinson\'s disease and mild dysphagia, managed with minced-moist food and nectar-thick liquids. He was a gentle, uncomplaining man — and among some staff he had a reputation as an "easy" mealtime: "He never coughs, never chokes. His swallowing\'s fine." His CNA, Tomas, wasn\'t so sure.',
              scenario: [
                '**The pattern nobody else assembled:** Tomas had taken the dysphagia training seriously, and one line had lodged in his memory: the most dangerous swallow is often the one that makes no sound. Over two weeks, he noticed small things. Mr. Dubois\'s voice often turned wet and gurgly after his thickened juice — though he never coughed. His meals were stretching longer, and he tired visibly by the end, his last bites slower and sloppier. He\'d had two low-grade fevers that came and went without explanation. His weight was drifting down. And now he was congested in the chest for the second time in a month. Each item, alone, was shrugged off — "he\'s just slowing down," "a little cold." Tomas wrote them down and saw them together.',
                '**What Tomas knew:** A wet voice after drinks with no cough. Fevers without a source. Slowing, exhausting meals and weight loss. Repeating chest trouble. In a Parkinson\'s resident with known dysphagia, that wasn\'t aging — that was the classic quiet sketch of silent aspiration: liquid slipping into his airway without triggering any cough at all, because the reflexes themselves had dulled. "He never coughs" wasn\'t reassurance. It might be the problem.',
                '**What Tomas did:** He reported the pattern, specifically and together: "I don\'t think Mr. Dubois\'s swallow is as safe as we think. His voice goes wet after drinks but he never coughs. His meals are much longer and he fades at the end. Two low-grade fevers in two weeks, weight\'s down, and this is his second chest congestion this month. I\'m worried he\'s silently aspirating — could the speech therapist take another look?" In the meantime, he tightened everything in his control: fully upright, smaller sips, slower pace, pausing when fatigue set in, meticulous mouth care, and watching the late-meal bites closely.',
                '**The re-evaluation:** The nurse escalated, and the speech-language pathologist re-evaluated Mr. Dubois\'s swallow. The study confirmed Tomas\'s suspicion: he was silently aspirating thin and even some nectar-thick liquids, with no cough response at all. His plan was changed — honey-thick liquids, revised strategies, and added precautions — calibrated to what his swallow could actually still protect.',
                '**The outcome:** On the corrected plan, Mr. Dubois\'s wet voice faded, the mystery fevers stopped, the chest congestion didn\'t return, and his weight stabilized. The pneumonia that was assembling itself in his lungs never arrived. The speech therapist told Tomas: "Silent aspirators don\'t announce themselves — someone has to assemble the clues. Everyone else heard \'he never coughs\' and relaxed. You heard it and worried. That\'s what caught this."',
                '**Discussion:** Tomas\'s save was made of observation and pattern-thinking — the heart of this course. He refused the false reassurance of "no coughing," gathered the quiet clues — wet voice, fevers, fatigue, weight loss, chest infections — and reported them together, which is what made them legible. He tightened his own technique while waiting, and he never overstepped: he didn\'t diagnose, didn\'t change a texture, didn\'t loosen or guess. He watched, assembled, reported, and delivered the plan precisely. The pneumonia that never happened is the measure of how much a watchful CNA at the table protects.',
              ].join('\n\n'),
            },
            {
              id: 'dy-s11-reflection-1',
              type: 'reflection',
              prompt:
                'Staff said "he never coughs, his swallowing\'s fine." Why is that false reassurance in dysphagia, and what does silent aspiration mean for how a CNA must watch meals?',
              minCharacters: 50,
            },
            {
              id: 'dy-s11-reflection-2',
              type: 'reflection',
              prompt:
                'No single sign Tomas saw was dramatic. Why did reporting the pattern — all the clues together — succeed where the individual observations had been shrugged off?',
              minCharacters: 50,
            },
            {
              id: 'dy-s11-rp-text',
              type: 'text',
              body: 'Reflect on the case study in the previous lesson. Your written responses help you apply what you learned about silent aspiration, pattern reporting, and faithful mealtime technique.',
            },
            {
              id: 'dy-s11-kc2-check',
              type: 'knowledge_check',
              question:
                'A CNA does not diagnose swallowing problems, does not change diet textures or liquid thickness, and does not perform swallow evaluations. When a resident on honey-thick liquids begs for a glass of plain water, the CNA SHOULD:',
              options: [
                {
                  id: 'give-plain-water',
                  label: 'Give her plain water just this once — kindness matters',
                },
                {
                  id: 'report-nurse',
                  label:
                    'Kindly decline, offer prescribed fluids, and report her distress to the nurse',
                },
                {
                  id: 'thin-drink',
                  label: 'Thin her thickened drink halfway as a compromise',
                },
                {
                  id: 'sneak-water',
                  label: 'Let her sip water when no one is watching',
                },
              ],
              correctOptionId: 'report-nurse',
              explanation:
                'You never diagnose swallowing problems, never change diet textures or liquid thickness, and never perform swallow evaluations — but your reporting of mealtime signs, resident distress, and unsafe requests supports every treatment the team provides.',
              requiredForCompletion: true,
              meta: { flaggedFiller: true },
            },
          ]);
        },
      },
      {
        slug: 's12-conclusion',
        title: 'Conclusion',
        sortOrder: 11,
        buildContent: () =>
          doc('Conclusion', [
            { id: 'dy-s12-heading', type: 'heading', level: 1, text: 'Conclusion' },
            {
              id: 'dy-s12-video',
              type: 'video',
              title: 'Conclusion',
              videoUrl: '/assets/courses/dysphagia/s12-conclusion.mp4',
              placeholderNote: 'Pending upload: /assets/courses/dysphagia/s12-conclusion.mp4',
            },
            {
              id: 'dy-s12-image',
              type: 'image',
              src: `${ASSET_BASE}/s12-hero.jpg`,
              caption: 'Five things that matter most in dysphagia care.',
            },
            {
              id: 'dy-s12-narration',
              type: 'text',
              body: [
                'You\'ve reached the end. Let\'s lock in the five things that matter most for dysphagia care.',
                '**One.** Swallowing is precision work at a dangerous crossroads — and dysphagia means the airway\'s guard is down. Aspiration has two faces: loud choking, and silent slipping into the lungs that becomes aspiration pneumonia — one of the most serious dangers in long-term care.',
                '**Two.** The texture order is law. Serve the exact prescribed texture and liquid thickness, verify every tray, and never thin a thickened liquid or give restricted thin liquids — not for pleading, not for kindness, not once. Thin liquids are the easiest thing for a weak swallow to send into the lungs.',
                '**Three.** Technique makes every swallow safer. Fully upright and fully alert, always. Small bites and sips, one at a time, swallow confirmed. Calm pace, full attention, no straws if restricted, watch the tired late-meal bites, check for pocketing, and upright after meals. And give the daily mouth care that makes any aspiration less deadly.',
                '**Four.** Listen for the quiet pattern. A wet, gurgly voice without coughing, fevers without a source, slowing exhausting meals, weight loss, and repeat chest infections sketch silent aspiration — report the pattern together, because that\'s what brings the speech therapist back before the pneumonia. And know choking cold: can\'t speak, can\'t cough, can\'t breathe — respond per your training, immediately.',
                '**Five.** Honor your scope. You never diagnose, never change textures or thickness, never evaluate swallows. But you verify, you deliver the technique, you watch and assemble the patterns, and you respond when seconds count — standing guard at the crossroads, three meals a day.',
              ].join('\n\n'),
            },
            {
              id: 'dy-s12-summary',
              type: 'summary',
              title: 'Five things that matter most',
              items: [
                'Swallowing is precision work — aspiration has two faces: loud choking and silent slipping into the lungs.',
                'The texture order is law — verify every tray, never thin a thickened liquid or give restricted thin liquids.',
                'Technique makes every swallow safer — upright, alert, small bites, calm pace, pocketing checks, mouth care.',
                'Listen for the quiet pattern — wet voice, fevers, slowing meals, weight loss, repeat chest infections.',
                'Honor your scope — verify, deliver technique, watch and report patterns, respond when seconds count.',
              ],
            },
            {
              id: 'dy-s12-whn-text',
              type: 'text',
              body: 'Ten questions are waiting. Everything on them was covered here. You\'re ready. Trust what you\'ve learned, and show what you know.',
            },
            {
              id: 'dy-s12-cr-text',
              type: 'text',
              body: 'This course provides one hour of continuing education credit through CAL ACE Nursing Academy, an approved CDPH continuing education provider, NAC number 7384. Your certificate is generated automatically when you pass the knowledge check.',
            },
            {
              id: 'dy-s12-cr-callout',
              type: 'callout',
              variant: 'info',
              title: 'Scope reminder',
              body: 'CNAs serve the prescription, feed with technique, and watch. CNAs do not diagnose swallowing problems, change diet textures or liquid thickness, or perform swallow evaluations.',
            },
            {
              id: 'dy-s12-ca-text',
              type: 'text',
              body: 'Your certificate is generated automatically when you pass the knowledge check. CDPH-Approved CE Provider — NAC #7384.',
            }
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

export async function seedCourse35Dysphagia(
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
  console.log(`Seeding Course 35 (Dysphagia) as DRAFT — slug "${COURSE_SLUG}"…`);

  try {
    const result = await seedCourse35Dysphagia(prisma);
    const blockCounts = blockCountsByLesson();
    const totalBlocks = Object.values(blockCounts).reduce((sum, count) => sum + count, 0);

    console.log('Seed complete.');
    console.log(`  Course:   ${COURSE_TITLE}`);
    console.log(`  Slug:     ${COURSE_SLUG}`);
    console.log(`  Created:  ${result.courseCreated ? 'yes (new)' : 'no (updated existing)'}`);
    console.log(`  Modules:  ${result.modulesUpserted}`);
    console.log(`  Lessons:  ${result.lessonsUpserted}`);
    console.log(`  Strays cleaned: ${result.strayLessonsDeleted} lessons`);
    console.log(`  Sections: ${PACKAGE_SECTION_LESSON_SLUGS.length} package sections mapped`);
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
