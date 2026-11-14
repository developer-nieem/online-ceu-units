/**
 * Seed Course 50 — Malnutrition & Dehydration in the Elderly (DRAFT).
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-50-malnutrition-elderly
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
const COURSE_SLUG = 'malnutrition-elderly';
const COURSE_TITLE = 'Nutrition and Hydration Risks in Older Adults';
const COURSE_SUMMARY =
  'Learn the CNA\'s role with malnutrition and dehydration in older adults — understanding why they\'re common, hidden, and serious; recognizing the signs; the CNA\'s central role at mealtimes (assistance, encouragement, dignity); honest, accurate intake and output documentation; weight monitoring and reporting; dehydration prevention and recognition; and reporting faithfully. CNAs do NOT diagnose, prescribe diets or supplements, change diet orders, or place/manage feeding tubes.';

const ASSET_BASE = `/assets/courses/malnutrition-elderly`;

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
    'Understand why malnutrition and dehydration are common and serious in elders.',
    'Recognize their signs.',
    'Assist at meals skillfully and with dignity.',
    'Document intake honestly and accurately.',
    'Prevent and report dehydration.',
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
  heroImage: '/assets/courses/malnutrition-elderly/hero-banner.png',
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
    title: 'Understanding Malnutrition & Dehydration in the Elderly',
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: 'Introduction',
        sortOrder: 0,
        buildContent: () =>
          doc('Welcome', [
            { id: 'mal-s01-heading', type: 'heading', level: 1, text: 'Welcome' },
            {
              id: 'mal-s01-video',
              type: 'video',
              title: 'Introduction',
              videoUrl: '/assets/courses/malnutrition-elderly/s01-intro.mp4',
              placeholderNote: 'Pending upload: /assets/courses/malnutrition-elderly/s01-intro.mp4',
            },
            {
              id: 'mal-s01-image',
              type: 'image',
              src: `${ASSET_BASE}/s01-hero.png`,
              caption:
                'Nutrition and hydration in older adults — recognizing risks and protecting resident health.',
            },
            {
              id: 'mal-s01-narration',
              type: 'text',
              body: [
                'Welcome to CAL ACE Nursing Academy.',
                'This course is about malnutrition and dehydration in the elderly — two of the most common, most hidden, and most serious threats to the residents you care for. And no member of the care team is closer to this problem than the CNA — because you are there at the meals, you see what\'s eaten and what isn\'t, and your honest eyes and faithful documentation are often the only early warning the team gets.',
                'Let\'s define the problem. Malnutrition means the body isn\'t getting the nutrition it needs — not enough calories, protein, vitamins, or minerals to maintain health. Dehydration means the body doesn\'t have enough fluid. Both are remarkably common in older adults, especially in care settings — and both do quiet, serious damage: weakness and falls, wounds that won\'t heal, pressure injuries, infections, confusion, hospitalizations, and decline. A poorly nourished, poorly hydrated body cannot heal, cannot fight infection, and cannot stay strong.',
                'Here\'s why they hide. Malnutrition in elders rarely announces itself. Weight comes off gradually under loose clothing. Meals get picked at, trays go back half-full, and nobody adds it up. Appetite fades for a dozen quiet reasons — illness, medications, depression, dental problems, swallowing trouble, or simply needing help that doesn\'t come. And dehydration hides even better, because aging blunts the sense of thirst — an elderly person can be significantly dehydrated and never feel thirsty. So both conditions creep, unnoticed, until they cause a crisis: a fall, an infection, a hospital stay, delirium.',
                'And here\'s why this course belongs to you. The CNA is the team\'s eyes at every meal and the hands that make eating possible. You see whether a resident actually ate or just rearranged the food. You provide the assistance, the encouragement, the time, and the dignity that determine whether a meal succeeds. You record the intake — and the honesty of that record is everything, because the nurse and dietitian act on what you document. You take the weights that reveal slow loss. And you offer the fluids, sip by sip, that prevent dehydration in residents who never feel thirst. In nutrition, more than almost anywhere else, the CNA is the front line.',
                'The guiding spirit of this course: honest eyes, faithful records, dignified meals. What you truly observe, you truly record — never guessing, never inflating — and every meal is delivered with patience and respect, because mealtime is not a task to rush; it\'s care, connection, and dignity.',
                'Your scope is clear. A CNA assists with meals and feeding, encourages intake, documents intake and output honestly and accurately, takes and reports weights, offers fluids, follows diet orders exactly, and reports concerns. A CNA does not diagnose malnutrition, does not prescribe or change diets or supplements, and does not place or manage feeding tubes.',
                'By the end of this course, you will be able to: understand why malnutrition and dehydration are common and serious in elders. Recognize their signs. Assist at meals skillfully and with dignity. Document intake honestly and accurately. And prevent and report dehydration.',
                'There is a ten-question knowledge check at the end. Everything on it is covered here. Let\'s begin.',
              ].join('\n\n'),
            },
            {
              id: 'mal-s01-ci-text',
              type: 'text',
              body: [
                'This course teaches the CNA\'s role with malnutrition and dehydration in older adults — understanding why they\'re common, hidden, and serious; recognizing the signs; the CNA\'s central role at mealtimes (assistance, encouragement, dignity); honest, accurate intake and output documentation; weight monitoring and reporting; dehydration prevention and recognition; and reporting faithfully.',
                'Let\'s be clear about your role. A CNA assists with meals and feeding, encourages intake, documents intake and output honestly and accurately, takes and reports weights, offers fluids, follows diet orders exactly, and reports concerns. A CNA does not diagnose malnutrition, does not prescribe or change diets or supplements, and does not place or manage feeding tubes. Those are nursing, dietitian, and physician tasks. But none of them can happen without your careful observation and faithful reporting first.',
              ].join('\n\n'),
            },
            {
              id: 'mal-s01-ci-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of this course',
              body: 'CNAs ASSIST, ENCOURAGE, DOCUMENT, WEIGH, HYDRATE, and REPORT. CNAs do not diagnose malnutrition, prescribe or change diets or supplements, change diet orders, or place or manage feeding tubes.',
            },
            {
              id: 'mal-s01-lo-text',
              type: 'text',
              body: 'By the end of this course, you will be able to:',
            },
            {
              id: 'mal-s01-lo-summary',
              type: 'summary',
              title: 'Learning objectives',
              items: [
                'Understand why malnutrition and dehydration are common and serious in elders.',
                'Recognize their signs.',
                'Assist at meals skillfully and with dignity.',
                'Document intake honestly and accurately.',
                'Prevent and report dehydration.',
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
            { id: 'mal-s02-heading', type: 'heading', level: 1, text: 'Key terms' },
            {
              id: 'mal-s02-image',
              type: 'image',
              src: `${ASSET_BASE}/s02-hero.png`,
              caption:
                'Key terms — malnutrition, dehydration, unintended weight loss, intake, appetite.',
            },
            {
              id: 'mal-s02-reveal-malnutrition',
              type: 'reveal_card',
              frontTitle: 'Malnutrition',
              frontBody: 'Malnutrition',
              backTitle: 'Malnutrition',
              backBody:
                'A condition in which the body doesn\'t get the nutrition it needs — not enough calories, protein, vitamins, or minerals to stay healthy. In elders it usually means undernutrition: eating too little, or too little of what the body needs. It causes weakness, poor healing, infections, and decline — and it\'s common, hidden, and serious.',
            },
            {
              id: 'mal-s02-reveal-dehydration',
              type: 'reveal_card',
              frontTitle: 'Dehydration',
              frontBody: 'Dehydration',
              backTitle: 'Dehydration',
              backBody:
                'Not enough fluid in the body. Especially dangerous in elders because aging blunts the sense of thirst — an older person can be significantly dehydrated without ever feeling thirsty. Dehydration causes weakness, dizziness, falls, confusion, urinary infections, and hospitalizations, and it can develop quickly.',
            },
            {
              id: 'mal-s02-reveal-io',
              type: 'reveal_card',
              frontTitle: 'Intake and Output (I&O)',
              frontBody: 'Intake and output (I&O)',
              backTitle: 'Intake and Output (I&O)',
              backBody:
                'The careful recording of what goes into the body — food and fluids — and what comes out, such as urine. Accurate I&O records are how the team detects poor eating and dehydration early. Honest, accurate recording — never guessed, never inflated — is one of the CNA\'s most important duties.',
            },
            {
              id: 'mal-s02-reveal-weight-loss',
              type: 'reveal_card',
              frontTitle: 'Unintended Weight Loss',
              frontBody: 'Unintended weight loss',
              backTitle: 'Unintended Weight Loss',
              backBody:
                'Losing weight without trying — one of the most important warning signs of malnutrition in elders. Even gradual loss matters: significant loss over weeks or months signals trouble. This is why weights are taken carefully and consistently, and why any notable loss is reported. The scale catches what the eye misses.',
            },
            {
              id: 'mal-s02-reveal-appetite-loss',
              type: 'reveal_card',
              frontTitle: 'Appetite Loss (Anorexia of Aging)',
              frontBody: 'Appetite loss',
              backTitle: 'Appetite Loss (Anorexia of Aging)',
              backBody:
                'The fading of appetite common in older adults — from illness, medications, depression, dental and swallowing problems, less taste and smell, and other causes. A resident who "just isn\'t hungry" meal after meal is not a small matter; persistent poor appetite is reported, because it leads to malnutrition.',
            },
            {
              id: 'mal-s02-reveal-therapeutic-diet',
              type: 'reveal_card',
              frontTitle: 'Therapeutic / Texture-Modified Diet',
              frontBody: 'Therapeutic diet',
              backTitle: 'Therapeutic / Texture-Modified Diet',
              backBody:
                'Diets ordered for medical reasons — like low-salt, diabetic, pureed, or thickened-liquid diets. Diet orders are followed exactly — the right tray to the right resident — because, as you learned with dysphagia, the wrong texture or food can cause serious harm. The CNA serves the ordered diet, never changes it.',
            },
            {
              id: 'mal-s02-reveal-supplement',
              type: 'reveal_card',
              frontTitle: 'Nutritional Supplement',
              frontBody: 'Nutritional supplement',
              backTitle: 'Nutritional Supplement',
              backBody:
                'Ordered nutrition drinks or additions — like protein shakes — used to boost intake in residents who can\'t eat enough. The CNA serves and encourages ordered supplements, records whether they\'re actually consumed, and reports refusals. A supplement poured out or left full helps no one — what\'s recorded must be what was truly taken.',
            },
            {
              id: 'mal-s02-reveal-aspiration',
              type: 'reveal_card',
              frontTitle: 'Aspiration Risk (Review)',
              frontBody: 'Aspiration risk',
              backTitle: 'Aspiration Risk (Review)',
              backBody:
                'Food or liquid entering the airway instead of the stomach, a danger for residents with swallowing problems. At every meal, the basics stand: upright positioning, the ordered textures and thickened liquids, unhurried pace, and watching for coughing or wet voice. Nutrition care and swallowing safety always travel together.',
            },
            {
              id: 'mal-s02-kc1-check-dehydration',
              type: 'knowledge_check',
              question:
                'Match the term: too little fluid — elders may never feel thirsty',
              options: [
                { id: 'dehydration', label: 'Dehydration' },
                { id: 'intake-output', label: 'Intake & output (I&O)' },
                { id: 'unintended-weight-loss', label: 'Unintended weight loss' },
              ],
              correctOptionId: 'dehydration',
              explanation:
                'Dehydration. Not enough fluid in the body. Especially dangerous in elders because aging blunts the sense of thirst — an older person can be significantly dehydrated without ever feeling thirsty.',
              requiredForCompletion: true,
            },
            {
              id: 'mal-s02-kc1-check-io',
              type: 'knowledge_check',
              question:
                'Match the term: honest recording of food, fluids, and urine — never guessed or inflated',
              options: [
                { id: 'dehydration', label: 'Dehydration' },
                { id: 'intake-output', label: 'Intake & output (I&O)' },
                { id: 'unintended-weight-loss', label: 'Unintended weight loss' },
              ],
              correctOptionId: 'intake-output',
              explanation:
                'Intake and output (I&O). The careful recording of what goes into the body — food and fluids — and what comes out, such as urine. Honest, accurate recording — never guessed, never inflated — is one of the CNA\'s most important duties.',
              requiredForCompletion: true,
            },
            {
              id: 'mal-s02-kc1-check-weight-loss',
              type: 'knowledge_check',
              question:
                'Match the term: a key malnutrition warning sign — report it',
              options: [
                { id: 'dehydration', label: 'Dehydration' },
                { id: 'intake-output', label: 'Intake & output (I&O)' },
                { id: 'unintended-weight-loss', label: 'Unintended weight loss' },
              ],
              correctOptionId: 'unintended-weight-loss',
              explanation:
                'Unintended weight loss. Losing weight without trying — one of the most important warning signs of malnutrition in elders. Even gradual loss matters: significant loss over weeks or months signals trouble.',
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
            { id: 'mal-s03-heading', type: 'heading', level: 1, text: 'Statistics' },
            pendingAudio(
              'mal-s03-audio',
              'Malnutrition and Dehydration: The Quiet Threats the CNA Sees First',
              `${ASSET_BASE}/s03-stats-podcast.mp3`,
              [
                'Malnutrition and Dehydration: The Quiet Threats the CNA Sees First',
                '',
                'Malnutrition is one of the most widespread and underestimated problems in elder care. A substantial share of older adults are malnourished or at risk of it — and in hospitals and long-term care, where residents are older, sicker, and more dependent, studies consistently find the problem affects a striking proportion of residents. Dehydration is similarly common in care settings. Yet both routinely go unrecognized until they cause a crisis, because both are quiet by nature: weight slips away gradually, meals are picked at without anyone tallying the pattern, and fluid intake dwindles in residents who never feel thirsty.',
                '',
                'The consequences are anything but quiet. Malnutrition weakens muscles, driving falls — and you know from earlier courses what falls cost elders. It impairs the immune system, inviting infections. It slows and prevents wound healing, and it is a major driver of pressure injuries — an underfed body cannot maintain or repair its skin, which is why nutrition appeared in your pressure-injury training. It saps energy, mood, and function, accelerating frailty and decline, and it raises hospitalization and death rates substantially. Dehydration brings its own dangers: weakness, dizziness, and falls; confusion and delirium that can look like sudden dementia; urinary tract infections; kidney problems; and rapid deterioration that lands residents in the hospital. A sudden change in mental status in an elder, you may recall from earlier courses, should always raise the question of dehydration or infection.',
                '',
                'Why are elders so vulnerable? Appetite naturally declines with age, and on top of that pile the causes you\'ve met throughout this series: illness and chronic disease, medications that suppress appetite or alter taste, depression — a major and underappreciated appetite killer — dental problems and ill-fitting dentures, swallowing difficulties, diminished taste and smell that make food joyless, and the simple but critical factor of dependence: a resident who needs help eating, and doesn\'t get enough of it, doesn\'t eat. Thirst tells the same story more sharply: the aging body\'s thirst signal weakens substantially, so elders genuinely don\'t feel the need to drink even when their bodies need fluid — meaning hydration in elder care cannot rely on thirst; it must be offered, encouraged, and tracked.',
                '',
                'Here is why the CNA stands at the center of this. Nutrition problems are detected through exactly three channels, and CNAs run all three. First, mealtime observation — only the person at the bedside knows whether the resident ate or rearranged the food, and provides the assistance and patience that determine whether eating happens at all. Second, intake documentation — the dietitian and nurse act on the percentages recorded, so an honest "ate 25%" triggers help, while a guessed or inflated "ate 75%" hides the problem and lets a resident quietly starve on paper that says they\'re fine. Third, weights — consistent, careful weighing reveals the gradual loss no one sees under clothing. The research is consistent: early identification and simple interventions — feeding assistance, encouragement, supplements, fluid rounds — substantially improve outcomes. The bottom line: malnutrition and dehydration are common, hidden, and deadly serious; they are caught early through honest eyes at meals, faithful records, and consistent weights — and all three belong to the CNA.',
              ].join('\n'),
              '/assets/courses/malnutrition-elderly/s03-stats-podcast.mp3',
            ),
            {
              id: 'mal-s03-image',
              type: 'image',
              src: `${ASSET_BASE}/s03-hero.png`,
              caption:
                'Malnutrition and dehydration in long-term care — common, serious, and often missed.',
            },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: 'Fundamentals',
        sortOrder: 3,
        buildContent: () =>
          doc('Fundamentals', [
            { id: 'mal-s04-heading', type: 'heading', level: 1, text: 'Fundamentals' },
            {
              id: 'mal-s04-video',
              type: 'video',
              title: 'Fundamentals',
              videoUrl: '/assets/courses/malnutrition-elderly/s04-fundamentals.mp4',
              placeholderNote: 'Pending upload: /assets/courses/malnutrition-elderly/s04-fundamentals.mp4',
            },
            {
              id: 'mal-s04-image',
              type: 'image',
              src: `${ASSET_BASE}/s04-hero.png`,
              caption:
                'Understanding the risks — why older adults are vulnerable to poor nutrition and hydration.',
            },
            {
              id: 'mal-s04-narration',
              type: 'text',
              body: [
                '**What malnutrition does to an aging body**',
                'Understand what\'s at stake. A malnourished body loses muscle, so the resident weakens and falls. It can\'t fight infection, so pneumonia and urinary infections take hold. It can\'t heal, so wounds linger and pressure injuries form — remember from pressure-injury care that nutrition is the skin\'s repair supply line. Energy, mood, and thinking all sag. Malnutrition isn\'t just "eating poorly" — it\'s the quiet undoing of everything the body needs to stay strong, heal, and survive.',
                '**Why elders stop eating: the many quiet causes**',
                'Appetite loss in elders almost always has reasons — and finding them is how the team helps. The common ones: illness and chronic disease. Medications that kill appetite or make food taste wrong. Depression — one of the biggest and most missed appetite killers, as you learned. Dental pain, missing teeth, ill-fitting dentures. Swallowing problems. Fading taste and smell that make food joyless. Confusion or dementia interfering with eating. And dependence — needing help that doesn\'t come, or comes rushed. When a resident isn\'t eating, there\'s nearly always a why — and your observations help find it.',
                '**Why dehydration stalks the elderly**',
                'Dehydration deserves special respect in elder care, for one core reason: the thirst signal weakens with age. An elderly resident can be significantly dehydrated and feel no thirst at all — so waiting for residents to ask for drinks guarantees dehydration. Add to that: some residents limit drinking on purpose, fearing incontinence or bathroom trips. Some can\'t reach or hold the cup. Some forget. Illness, hot weather, vomiting, and diarrhea drain fluids faster. The conclusion is simple and absolute: in elder care, fluids must be offered, encouraged, and tracked — never left to thirst.',
                '**The mealtime: where nutrition is won or lost**',
                'The meal is the battleground, and how it\'s conducted decides the outcome. A resident set up properly — positioned upright, tray within reach, packages opened, glasses on, dentures in, hearing aids working — can eat. A resident rushed, left struggling with packaging, or fed carelessly cannot. Assistance matters: some residents need encouragement, some need cueing, some need full feeding — patient, unhurried, at their pace, never forced or rushed. And the dignity matters: mealtime is one of life\'s pleasures and a deeply human moment. Treat it as care, not a chore to speed through.',
                '**Honest intake documentation: the record the team acts on**',
                'Here is one of the most important professional duties you own. The percentages you record — "ate 75%," "ate 25%," "refused" — are what the nurse and dietitian act on. Record honestly and accurately what was actually consumed: look at the tray, estimate truly, count the supplement only if it was actually drunk. Never guess without looking, never inflate to look good or avoid questions, never record a meal you didn\'t observe. An inflated record hides a starving resident behind paperwork that says they\'re fine — it\'s not just sloppy, it\'s dangerous, and it\'s dishonest. Your honest record is the early-warning system. Guard its truth.',
                '**Weights: the scale catches what the eye misses**',
                'Gradual weight loss hides under loose clothes and slow change — the eye misses it, but the scale doesn\'t. That\'s why weights are taken consistently and carefully: same scale where possible, similar clothing, proper technique, recorded accurately. And why changes are reported — unintended weight loss is one of the clearest warning signs of malnutrition, and catching it early is catching the problem early. Take weights seriously; they\'re not a chore, they\'re surveillance that protects residents.',
                '**Diet orders and swallowing safety: the standing rules**',
                'Two rule sets stand under everything. First, diet orders are followed exactly — the right tray, the right texture, the right thickened liquids to the right resident, because as you learned in dysphagia care, the wrong texture can kill. Check the tray against the order; never give food a resident\'s order forbids, and never "upgrade" a texture out of sympathy. Second, swallowing safety at every meal: upright positioning, unhurried pace, watching for coughing, choking, or a wet gurgly voice — and reporting them. Nutrition and safety travel together, every tray, every time.',
              ].join('\n\n'),
            },
            {
              id: 'mal-s04-honest-records-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Honest intake records',
              body: 'What you record is what the team acts on. Never guess. Never inflate. The scale catches gradual loss the eye misses.',
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
            { id: 'mal-s05-heading', type: 'heading', level: 1, text: 'Signs & Symptoms' },
            {
              id: 'mal-s05-image',
              type: 'image',
              src: `${ASSET_BASE}/s05-hero.png`,
              caption:
                'Recognizing the signs — weight loss, poor intake, and dehydration.',
            },
            {
              id: 'mal-s05-narration',
              type: 'text',
              body: [
                'Malnutrition and dehydration announce themselves quietly — in bodies, trays, and small changes. Let\'s learn to read them, ending with the urgent picture.',
                '**The signs of malnutrition**',
                'Watch the resident\'s body and function. Weight loss — clothes, rings, or dentures becoming loose are everyday clues; the scale confirms. Visible thinning — wasted muscles, prominent bones, sunken temples and cheeks. Weakness and fatigue — declining strength, new difficulty walking or standing, more help needed. Wounds healing poorly, skin breaking down, new pressure areas. More frequent infections. Swelling in some cases, brittle hair and nails, pale or dry skin. And the functional slide — a resident gradually doing less, declining without clear cause. These signs say the body isn\'t getting what it needs — report them.',
                '**The poor-intake patterns**',
                'Watch the trays and the patterns — this is where you catch it earliest. Meals consistently barely touched, or food rearranged to look eaten. A pattern of eating only a few bites, or only certain items. Supplements left full or poured out. Refusing meals repeatedly. Eating well with help but left struggling alone — a dependence problem, not an appetite problem. Difficulty chewing, pain with eating, dentures out or hurting. Coughing or trouble swallowing at meals — the dysphagia signs you know. And appetite that\'s faded meal after meal. One poor meal is nothing; a pattern of poor meals is a warning — observe it honestly, record it honestly, and report it.',
                '**The signs of dehydration**',
                'Know dehydration\'s signature, because the resident won\'t feel thirsty to warn you. Dry mouth, dry cracked lips, a dry or coated tongue. Dark, strong-smelling, scanty urine — and fewer wet briefs or bathroom trips. Sunken eyes. Skin that\'s dry or less elastic. Weakness, dizziness — especially on standing, raising fall risk. Headache, listlessness, sleepiness. Constipation. And critically: new or worsening confusion — in an elder, sudden confusion is dehydration until proven otherwise, alongside the infection causes you\'ve learned. Low fluid intake plus any of these signs is reported promptly.',
                '**The urgent picture**',
                'Some pictures need urgent reporting. A resident who\'s stopped eating and drinking altogether. Significant or rapid weight loss. Signs of serious dehydration — very little urine, marked weakness, dizziness with near-falls, rapid pulse, sunken eyes, or new confusion and delirium. Vomiting or diarrhea that\'s draining fluids fast, especially in a frail resident — dehydration can develop in hours, not days, when fluids are pouring out. And any sudden change in alertness or mental status. Report these urgently — dehydration and its confusion are treatable, and fast reporting prevents the fall, the kidney injury, or the hospitalization that untreated dehydration causes.',
                '**Summary**',
                'Four pictures. Malnutrition: weight loss, loose clothes, thinning, weakness, poor healing, infections, decline. Poor intake: trays barely touched, patterns of refusal, supplements untaken, struggling without help — observe and record honestly. Dehydration: dry mouth and lips, dark scanty urine, dizziness, weakness, sunken eyes — and new confusion. Urgent: stopped eating and drinking, rapid loss, severe dehydration signs, vomiting or diarrhea draining fluids, sudden confusion — report now.',
                'The rule underneath it all: read the body, the trays, and the urine; record what\'s true; treat new confusion as possible dehydration; and report patterns early — before the quiet problem becomes a crisis.',
              ].join('\n\n'),
            },
            {
              id: 'mal-s05-confusion-callout',
              type: 'callout',
              variant: 'warning',
              title: 'New confusion in an elder',
              body: 'Sudden confusion means think dehydration — alongside infection — and report promptly. Low fluid intake plus any dehydration signs is reported without delay.',
            },
          ]),
      },
      {
        slug: 's06-causes',
        title: 'Causes',
        sortOrder: 1,
        buildContent: () =>
          doc('Causes', [
            { id: 'mal-s06-heading', type: 'heading', level: 1, text: 'Causes' },
            pendingAudio(
              'mal-s06-audio',
              'Why Elders Become Malnourished and Dehydrated — and Which Causes the CNA Touches',
              `${ASSET_BASE}/s06-causes-podcast.mp3`,
              [
                'Why Elders Become Malnourished and Dehydrated — and Which Causes the CNA Touches',
                '',
                'Malnutrition and dehydration in elders almost never come from a single cause; they come from quiet causes stacking — and a striking number of those causes are ones a CNA directly influences.',
                '',
                'Start with the body\'s own aging. Appetite naturally declines with age — the "anorexia of aging" — driven by changes in hormones, digestion, and activity. Taste and smell fade, draining food of its pleasure. The thirst signal weakens substantially, so the body stops announcing its need for fluid. Muscle is lost more easily and rebuilt more slowly, raising protein needs exactly when intake falls. None of this is anyone\'s fault — but it means elders start at a disadvantage and can\'t be expected to self-correct by appetite and thirst alone.',
                '',
                'Then come the medical causes. Chronic illnesses — heart failure, COPD, kidney disease, cancer, and others from across this course series — suppress appetite and raise the body\'s demands at once. Medications, of which elders take many, suppress appetite, alter taste, cause nausea or dry mouth. Dental problems — pain, missing teeth, ill-fitting dentures — make chewing miserable. Swallowing disorders make eating slow, frightening, or dangerous, as you learned in dysphagia care. Depression is a major, underrecognized appetite killer — a resident who\'s stopped eating may be a resident who\'s stopped hoping, which is why nutrition and mood are watched together. Dementia interferes with recognizing food, staying focused on meals, and remembering to eat and drink. And acute illness — infections, vomiting, diarrhea — can collapse intake and drain fluids within hours.',
                '',
                'Now the causes closest to the CNA — the care-delivery causes. Dependence is the great one: a resident who needs help eating and doesn\'t get enough of it, or gets it rushed, simply doesn\'t eat — studies of care settings repeatedly find that inadequate mealtime assistance is a major driver of poor intake. Trays placed out of reach, packages unopened, glasses and dentures and hearing aids missing at mealtime — small failures that cost whole meals. Rushed, impersonal feeding that turns eating into an ordeal. Unappetizing presentation and cold food. Fluids not offered between meals to residents who\'ll never ask. Fear of incontinence making residents self-restrict fluids, quietly, unless someone notices and reassures them. Each of these is a cause of malnutrition and dehydration that lives entirely inside how care is delivered — which means each is one the CNA can remove.',
                '',
                'That\'s the empowering takeaway. You can\'t change aging biology or cure the diseases — the team manages those, and your reports help them find the fixable causes like dental pain, medication effects, and depression. But the care-delivery causes — missing assistance, rushed meals, unreachable trays, unoffered fluids — are yours to eliminate, meal by meal, round by round. The takeaway: malnutrition and dehydration come from aging, illness, and care-delivery gaps stacked together; the CNA reports the first two and personally closes the third.',
              ].join('\n'),
              '/assets/courses/malnutrition-elderly/s06-causes-podcast.mp3',
            ),
            {
              id: 'mal-s06-image',
              type: 'image',
              src: `${ASSET_BASE}/s06-hero.png`,
              caption:
                'What puts residents at risk — appetite changes, swallowing trouble, and illness.',
            },
          ]),
      },
      {
        slug: 's07-role',
        title: 'CNA Role & Best Practices',
        sortOrder: 2,
        buildContent: () =>
          doc('CNA Role & Best Practices', [
            { id: 'mal-s07-heading', type: 'heading', level: 1, text: 'CNA Role & Best Practices' },
            {
              id: 'mal-s07-image',
              type: 'image',
              src: `${ASSET_BASE}/s07-hero.png`,
              caption:
                'Your scope — monitor, assist, document accurately, and report.',
            },
            {
              id: 'mal-s07-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of practice',
              body: 'CNAs ASSIST, DOCUMENT, WEIGH, HYDRATE, and REPORT. CNAs never diagnose malnutrition or dehydration, prescribe or change diets or supplements, change diet orders, or place or manage feeding tubes.',
            },
            {
              id: 'mal-s07-narration',
              type: 'text',
              body: [
                'Malnutrition and dehydration are managed by the team — nurse, dietitian, physician — but nearly all the daily work that prevents and reverses them happens at the bedside and the tray table, and that work is the CNA\'s. Let\'s walk through it, starting with the rule that never bends, stated firmly because it matters most here. A CNA does not diagnose malnutrition or dehydration, does not prescribe or change diets or supplements, does not change diet orders, and does not place or manage feeding tubes.',
                '**Skilled, dignified mealtime assistance — where nutrition is won.** Set every resident up to succeed: positioned upright, tray within reach, packages opened, food cut as needed, glasses on, dentures in, hearing aids working. Provide the level of help each resident needs — encouragement, cueing, or full feeding — patiently, at their pace, never rushed or forced. Make meals pleasant and social where possible, and protect the resident\'s dignity throughout: a clothing protector offered respectfully, assistance given warmly, never feeding someone like a task to finish. A well-run meal is the single best nutrition intervention there is — and it\'s entirely yours.',
                '**Honest intake and output documentation — the team\'s eyes.** Record what was actually consumed, accurately and honestly: look at the tray, estimate truly, record supplements only if actually drunk, and document refusals as refusals. Never guess without looking, never inflate, never chart a meal you didn\'t see. Record output as directed — urine, and changes like dark scanty urine. The dietitian and nurse act on your numbers: honest low numbers summon help; inflated numbers hide a starving, drying resident behind clean paperwork. Your honest record is the early-warning system — guard it.',
                '**Weights — taken right, reported faithfully.** Take weights as scheduled with consistent technique — same scale where possible, similar clothing — and record them accurately. Report unintended weight loss and notable changes. The scale catches the gradual loss the eye misses, but only if the weights are taken carefully and the changes are flagged.',
                '**Hydration — offer, encourage, track.** Because elders don\'t feel thirst, hydration is active work: offer fluids at every meal, between meals, and at every encounter; keep fresh water within reach and refilled; honor preferences — the juice or tea a resident actually likes beats the water they won\'t touch; encourage sips during care and activities; and support residents who self-restrict from incontinence fear, reassuring and reporting so the team can help. Track intake honestly, and follow any ordered fluid plans — including thickened liquids exactly as ordered, never thinned.',
                '**Supporting the plan — supplements, diets, and reports.** Serve ordered supplements and encourage them, recording true consumption and reporting refusals. Match every tray to the diet order — right diet, right texture, right liquids — and never give forbidden items, however kindly meant. Support swallowing safety at every meal as you learned. And report the findable causes: dental pain, dentures that hurt, nausea, food dislikes, depression signs, swallowing trouble — your observations help the team fix what\'s fixable.',
                'The scope point for this section: you never diagnose, prescribe, change diets, or manage feeding tubes — but you deliver the skilled, dignified mealtime care, the honest records, the careful weights, and the active hydration that prevent and reverse malnutrition and dehydration. The front line of nutrition is the care you deliver.',
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
            { id: 'mal-s08-heading', type: 'heading', level: 1, text: 'Prevention & Risk Reduction' },
            {
              id: 'mal-s08-image',
              type: 'image',
              src: `${ASSET_BASE}/s08-hero.png`,
              caption:
                'Supporting residents at mealtimes — patience, assistance, and encouragement.',
            },
            {
              id: 'mal-s08-narration',
              type: 'text',
              body: [
                'With malnutrition and dehydration, prevention is daily, practical, and largely in the CNA\'s hands. Here are seven ways.',
                '**One. Set up every meal for success.** Upright positioning, tray in reach, packages opened, food cut, glasses on, dentures in, hearing aids working. So many meals are lost to small setup failures — a carton a resident can\'t open, a tray just out of reach. The two minutes of setup are where eating begins.',
                '**Two. Give the help each resident actually needs.** Some need encouragement, some need cueing bite by bite, some need full feeding — patient, unhurried, at their pace. A dependent resident left to struggle doesn\'t eat. Matching your assistance to their need, every meal, is the most direct malnutrition prevention there is.',
                '**Three. Make mealtime pleasant and dignified.** Unrushed, warm, social where possible — a meal treated as a human moment, not a task. Appetite follows pleasantness: residents eat more when meals are enjoyable and dignified, and less when they\'re rushed and clinical. Protecting mealtime dignity is protecting intake.',
                '**Four. Offer fluids constantly — never wait for thirst.** Because aging silences thirst, offer drinks at every meal, between meals, and at every encounter; keep fresh water in reach and refilled; offer what they actually like; encourage sips during care. And reassure residents who limit drinking out of incontinence fear, reporting it so the team can help. Hydration in elders is offered, never awaited.',
                '**Five. Record intake and weights honestly and carefully.** Record what was truly eaten and drunk — never guessed, never inflated — and take weights consistently and accurately. Honest records and careful weights are the surveillance that catches trouble early, while it\'s still easy to fix. The truth on the chart is prevention.',
                '**Six. Watch the patterns and report early.** One poor meal is nothing; a pattern is a warning. Report repeated poor intake, refusals, untaken supplements, chewing or swallowing trouble, dental pain, fading appetite, loosening clothes, and low fluid intake — early, while the causes can be found and fixed. Early reporting prevents the crisis.',
                '**Seven. Follow diet orders and swallowing safety exactly.** Right tray, right texture, right thickened liquids, every time — and the swallowing-safety basics at every meal: upright, unhurried, watchful. Safe nutrition and adequate nutrition travel together; following the orders exactly prevents the harm that undoes everything else.',
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
            { id: 'mal-s09-heading', type: 'heading', level: 1, text: 'Scenario & Reporting' },
            pendingAudio(
              'mal-s09-intro-audio',
              'Emergency response scenarios intro',
              `${ASSET_BASE}/s09-emergency-intro.mp3`,
              'With malnutrition and dehydration, the judgments that matter most are recording intake honestly even when the truth is inconvenient, and recognizing dehydration behind sudden confusion. You\'re about to work through two situations. Read each carefully, choose your action, and you\'ll get feedback right away. Keep the core ideas in mind: the chart must say what truly happened — the team acts on your numbers — and new confusion in an elder means think dehydration, and report.',
              '/assets/courses/malnutrition-elderly/s09-emergency-intro.mp3',
            ),
            {
              id: 'mal-s09-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-hero.png`,
              caption:
                'Recognizing serious changes — accurate charting and prompt reporting protect residents.',
            },
            {
              id: 'mal-s09-scenario-lindqvist-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-scenario-lindqvist.png`,
              caption:
                'Always chart intake honestly — accurate records protect the resident; never guess or inflate the numbers.',
            },
            {
              id: 'mal-s09-scenario-lindqvist',
              type: 'scenario_question',
              prompt:
                'Mrs. Lindqvist has eaten poorly for a week. Today she took three bites of lunch — roughly 10% — and left her supplement untouched. You\'re behind on charting, and a coworker says, "Just put her down as 75% like usual — if you chart 10% the nurse will ask questions and there\'ll be paperwork. She probably ate more than it looks anyway." What SHOULD the CNA do?',
              options: [
                {
                  id: 'chart-75',
                  label: 'Chart 75% to avoid questions and paperwork',
                  feedback:
                    'The team acts on the intake numbers you chart. Recording 75% — or a "compromise" 50%, or nothing — when she ate 10% hides a starving resident behind false paperwork, delays the help honest numbers would trigger, and is false documentation that can harm her and end your certification. The right action: chart what she actually ate — about 10%, supplement refused — and report the week-long pattern to the nurse.',
                },
                {
                  id: 'chart-truth-report',
                  label:
                    'Chart what she actually ate — about 10%, supplement refused — and report the week-long pattern of poor intake to the nurse',
                  feedback:
                    'Exactly right — and this is one of the most important professional moments in all of CNA work. The intake record is the team\'s early-warning system: the nurse and dietitian act on your numbers. Charting the truth — about 10%, supplement refused — is precisely what triggers the help Mrs. Lindqvist needs: a nutrition assessment, a search for the cause, a changed plan. Charting 75% doesn\'t avoid a problem; it hides one — it makes a starving resident look fine on paper, delays help while she weakens, and it\'s false documentation, a serious violation that can harm her and end your certification. "She probably ate more than it looks" is a guess, and you never chart guesses — you chart what you observed. And the questions the nurse will ask? Those questions are the system working. So chart the truth, and go further: report the pattern — a week of poor meals is a warning, not a coincidence. The inconvenient truth on the chart is what protects her. Honest eyes, faithful records — always.',
                  isRecommended: true,
                },
                {
                  id: 'chart-50',
                  label: 'Chart 50% as a compromise',
                  feedback:
                    'The team acts on the intake numbers you chart. Recording 75% — or a "compromise" 50%, or nothing — when she ate 10% hides a starving resident behind false paperwork, delays the help honest numbers would trigger, and is false documentation that can harm her and end your certification. The right action: chart what she actually ate — about 10%, supplement refused — and report the week-long pattern to the nurse.',
                },
                {
                  id: 'skip-charting',
                  label: 'Skip charting her intake today',
                  feedback:
                    'The team acts on the intake numbers you chart. Recording 75% — or a "compromise" 50%, or nothing — when she ate 10% hides a starving resident behind false paperwork, delays the help honest numbers would trigger, and is false documentation that can harm her and end your certification. The right action: chart what she actually ate — about 10%, supplement refused — and report the week-long pattern to the nurse.',
                },
              ],
              requiredForCompletion: true,
            },
            {
              id: 'mal-s09-scenario-okafor-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-scenario-okafor.png`,
              caption:
                'New confusion with dry lips and little fluid can signal dehydration — report it right away, don\'t assume aging.',
            },
            {
              id: 'mal-s09-scenario-okafor',
              type: 'scenario_question',
              prompt:
                'Mr. Okafor, normally clear-minded, has seemed "off" since yesterday and today is noticeably confused — not knowing the time of day, asking strange questions. You also notice his lips are dry and cracked, he\'s been drinking very little for days, his urine has been dark and scanty, and he\'s weak and dizzy when he stands. A coworker shrugs: "He\'s old — confusion happens. Maybe it\'s dementia starting. Just keep an eye on him." What SHOULD the CNA do?',
              options: [
                {
                  id: 'assume-aging',
                  label: 'Assume it\'s just aging or new dementia and keep an eye on him',
                  feedback:
                    'Dementia doesn\'t start overnight — but dehydration confusion does. New confusion plus dry cracked lips, days of poor intake, dark scanty urine, weakness, and dizziness is dehydration until proven otherwise — serious, treatable, and urgent. Watching and waiting, or quietly pushing fluids without telling anyone, risks a fall, kidney injury, or hospitalization. The right action: report the full picture to the nurse promptly.',
                },
                {
                  id: 'report-dehydration',
                  label:
                    'Report it to the nurse promptly — new confusion with dry lips, poor intake, dark scanty urine, weakness, and dizziness points to dehydration, which is serious and treatable',
                  feedback:
                    'Right. Dementia doesn\'t appear overnight — but dehydration-driven confusion does, and Mr. Okafor is showing dehydration\'s full signature alongside the sudden confusion: dry cracked lips, days of poor fluid intake, dark scanty urine, weakness, and dizziness on standing. In an elder, new or sudden confusion should always raise the question of dehydration — alongside infection, as you\'ve learned — because both are common, serious, and treatable, and "he\'s old, confusion happens" is exactly the dismissal that lets a treatable delirium become a fall, a kidney injury, or a hospitalization. Report it to the nurse promptly with the whole picture: the new confusion since yesterday, the dry lips, the low intake for days, the dark scanty urine, the dizziness on standing. The nurse assesses and the team treats — that\'s their call, not yours, so don\'t simply push large amounts of fluid on your own and tell no one; he needs assessment, and dizziness plus confusion also makes him a fall risk to protect right now. Offer fluids as appropriate, keep him safe, and report now — sudden confusion is a message, and you read it correctly.',
                  isRecommended: true,
                },
                {
                  id: 'push-water-alone',
                  label: 'Give him a large amount of water quickly and tell no one',
                  feedback:
                    'Dementia doesn\'t start overnight — but dehydration confusion does. New confusion plus dry cracked lips, days of poor intake, dark scanty urine, weakness, and dizziness is dehydration until proven otherwise — serious, treatable, and urgent. Watching and waiting, or quietly pushing fluids without telling anyone, risks a fall, kidney injury, or hospitalization. The right action: report the full picture to the nurse promptly.',
                },
                {
                  id: 'wait-days',
                  label: 'Wait a few days to see if the confusion clears',
                  feedback:
                    'Dementia doesn\'t start overnight — but dehydration confusion does. New confusion plus dry cracked lips, days of poor intake, dark scanty urine, weakness, and dizziness is dehydration until proven otherwise — serious, treatable, and urgent. Watching and waiting, or quietly pushing fluids without telling anyone, risks a fall, kidney injury, or hospitalization. The right action: report the full picture to the nurse promptly.',
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
            { id: 'mal-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
              id: 'mal-s10-video',
              type: 'video',
              title: 'The CNA\'s Role',
              videoUrl: '/assets/courses/malnutrition-elderly/s10-cna-role.mp4',
              placeholderNote: 'Pending upload: /assets/courses/malnutrition-elderly/s10-cna-role.mp4',
            },
            {
              id: 'mal-s10-image',
              type: 'image',
              src: `${ASSET_BASE}/s10-hero.png`,
              caption:
                'Your role — watching intake, encouraging fluids, and reporting changes.',
            },
            {
              id: 'mal-s10-narration',
              type: 'text',
              body: [
                'Your role with malnutrition and dehydration is the front line itself: the meals, the records, the weights, the fluids, and the reports. Let\'s walk through it.',
                '**Run the meals that nourish** Own the mealtime. Set every resident up to succeed — upright, tray in reach, packages opened, glasses, dentures, hearing aids in place — and give each the assistance they actually need, from encouragement to full feeding, patiently and at their pace. Keep meals pleasant, social, and dignified, follow diet orders exactly — right tray, right texture, right liquids — and keep swallowing safety in every meal. The well-run, dignified meal is the best nutrition intervention there is, and it\'s yours.',
                '**Keep the records honest** Be the truth on the chart. Record intake as it actually was — looking at the tray, estimating honestly, counting supplements only if drunk, documenting refusals as refusals — and record output as directed. Never guess, never inflate, never chart what you didn\'t see. The team acts on your numbers: honest numbers summon help early; false numbers hide a resident\'s quiet decline. Your integrity here directly protects lives.',
                '**Take the weights that warn** Take weights consistently and carefully — proper technique, accurate recording — and report unintended loss and notable changes. The scale catches the gradual loss that hides under loose clothes, but only if the weights are faithful and the changes are flagged. Treat the weights as the surveillance they are.',
                '**Hydrate actively, watch, and report** Carry the hydration: offer fluids at every encounter, keep fresh water in reach, honor preferences, encourage sips through the day, and support residents who self-restrict from incontinence fear. Watch for the signs — poor-intake patterns, loosening clothes, dry lips, dark scanty urine, weakness, and above all new confusion, which in an elder means think dehydration. And report it all early — patterns, signs, causes like dental pain and low mood — so the team can fix what\'s fixable before it becomes a crisis.',
                'Now the boundary. You do not diagnose malnutrition or dehydration. You do not prescribe or change diets or supplements, and you never change or "upgrade" a diet order. You do not place or manage feeding tubes. And you never inflate or guess an intake record, never rush or force feeding, and never withhold the report that a pattern deserves.',
                'Inside your role — dignified meals, honest records, faithful weights, active hydration, and early reporting — you stand exactly where malnutrition and dehydration are caught and beaten: at the tray table, the scale, and the chart. No one on the team is closer to this fight than you, and residents stay strong because you fight it well.',
              ].join('\n\n'),
            },
            {
              id: 'mal-s10-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Stay within scope',
              body: 'You do not diagnose malnutrition or dehydration, prescribe or change diets or supplements, change diet orders, or place or manage feeding tubes. Never inflate or guess intake records, and never withhold the report a pattern deserves.',
            },
          ]),
      },
      {
        slug: 's11-case-study',
        title: 'Case Study',
        sortOrder: 2,
        buildContent: () => {
          const caseNarrative = [
            'Mrs. Adeyemi, 86, was a quiet, uncomplaining resident who "did fine" — or so the chart said. Her intake records showed respectable numbers, meal after meal. But her CNA, Rosa, newly assigned to her hall, started noticing things the chart didn\'t show: Mrs. Adeyemi\'s cardigan hung looser than her photos from months ago. Her rings spun on her fingers. Her trays came back looking eaten at a glance — but looking closely, the food was pushed and rearranged more than consumed, and her supplement cartons went back full. She tired quickly, walked more unsteadily than her record suggested, and a small sore on her heel was healing slowly.',
            '',
            '**What Rosa suspected — and how she checked:** Rosa\'s training told her what this picture could mean: gradual, hidden malnutrition — the kind that slips past when intake is charted generously and nobody adds up the pattern. She started doing the simple things right. She watched Mrs. Adeyemi\'s meals attentively and charted what was actually eaten — honestly: 25%, 30%, supplement refused — even though it meant her numbers suddenly disagreed with weeks of "75%" entries before her. She made sure the weights were taken properly and on schedule, and the scale confirmed her eyes: Mrs. Adeyemi had been losing weight steadily for months — a loss the loose clothes had hidden and the generous charting had explained away.',
            '',
            '**The deeper look:** Rosa also watched for the why, the way she\'d been taught. She noticed Mrs. Adeyemi chewing carefully, favoring soft items, and once wincing — and asked gently about her mouth. Her lower denture had been hurting for months; chewing was painful, so she\'d quietly stopped eating anything that required it, too uncomplaining to mention it. She also drank very little — her water pitcher sat full across the room, out of easy reach, and she admitted she "didn\'t like to bother anyone" and worried about bathroom trips at night. Dry lips and dark urine completed that picture.',
            '',
            '**What Rosa did:** She reported the whole truth to the nurse, specifically: the honest intake numbers and how they differed from prior charting, the steady weight loss the scale confirmed, the full supplements coming back, the painful denture, the barely-touched fluids and the reasons, the dark urine and dry lips, the slow-healing heel. The nurse and dietitian moved on it: a nutrition assessment, a dental referral that refit the denture, a texture-appropriate appetizing diet while her mouth healed, supplements she\'d actually drink in flavors she liked, and a hydration plan. Rosa carried out her end — patient mealtime support, the pitcher moved within reach and refilled, fluids offered every visit with the juice she preferred, reassurance about nighttime bathroom help, honest charting throughout.',
            '',
            '**The outcome:** With the denture fixed, food no longer hurt. With fluids in reach and offered, she drank. With honest numbers, the team could see what was real and adjust. Over the following weeks, Mrs. Adeyemi\'s weight stabilized and began to recover, her energy and steadiness improved, the heel sore — finally supplied with the nutrition skin needs — closed, and the quiet decline reversed. The nurse put it plainly: "The old chart said she was fine, and she was starving behind it. Rosa charted the truth, weighed the truth, and found the denture and the water pitcher. The truth is what saved her."',
            '',
            '**Discussion:** Rosa\'s case is the whole course in one resident. She read the quiet signs — loose clothes, spinning rings, rearranged trays, full supplements, slow healing — instead of trusting comfortable numbers. She restored the early-warning system by charting honestly even when it contradicted prior records, and let the scale tell its story. She looked for the why and found two utterly fixable causes — a painful denture and unreachable, unoffered fluids — that had quietly starved and dried a resident for months. She reported specifically, supported the plan with dignified mealtime care and active hydration, and stayed in scope throughout: she never diagnosed or changed the diet — she observed, recorded truly, reported, and assisted. Honest eyes, faithful records, dignified meals — and a decline that reversed because of them.',
          ].join('\n');

          return doc('Brief Case Study', [
            { id: 'mal-s11-heading', type: 'heading', level: 1, text: 'Brief Case Study' },
            pendingAudio(
              'mal-s11-audio',
              'The Numbers That Told the Truth',
              `${ASSET_BASE}/s11-case-podcast.mp3`,
              caseNarrative,
              '/assets/courses/malnutrition-elderly/s11-case-podcast.mp3',
            ),
            {
              id: 'mal-s11-image',
              type: 'image',
              src: `${ASSET_BASE}/s11-hero.png`,
              caption:
                'Putting it together — attentive, accurate, resident-centered nutrition support.',
            },
            {
              id: 'mal-s11-case-study',
              type: 'case_study',
              title: 'The Numbers That Told the Truth',
              residentProfile:
                'Mrs. Adeyemi, 86, was a quiet, uncomplaining resident who "did fine" — or so the chart said. Her intake records showed respectable numbers, meal after meal. But her CNA, Rosa, newly assigned to her hall, started noticing things the chart didn\'t show: Mrs. Adeyemi\'s cardigan hung looser than her photos from months ago. Her rings spun on her fingers. Her trays came back looking eaten at a glance — but looking closely, the food was pushed and rearranged more than consumed, and her supplement cartons went back full. She tired quickly, walked more unsteadily than her record suggested, and a small sore on her heel was healing slowly.',
              scenario: [
                '**What Rosa suspected — and how she checked:** Rosa\'s training told her what this picture could mean: gradual, hidden malnutrition — the kind that slips past when intake is charted generously and nobody adds up the pattern. She started doing the simple things right. She watched Mrs. Adeyemi\'s meals attentively and charted what was actually eaten — honestly: 25%, 30%, supplement refused — even though it meant her numbers suddenly disagreed with weeks of "75%" entries before her. She made sure the weights were taken properly and on schedule, and the scale confirmed her eyes: Mrs. Adeyemi had been losing weight steadily for months — a loss the loose clothes had hidden and the generous charting had explained away.',
                '**The deeper look:** Rosa also watched for the why, the way she\'d been taught. She noticed Mrs. Adeyemi chewing carefully, favoring soft items, and once wincing — and asked gently about her mouth. Her lower denture had been hurting for months; chewing was painful, so she\'d quietly stopped eating anything that required it, too uncomplaining to mention it. She also drank very little — her water pitcher sat full across the room, out of easy reach, and she admitted she "didn\'t like to bother anyone" and worried about bathroom trips at night. Dry lips and dark urine completed that picture.',
                '**What Rosa did:** She reported the whole truth to the nurse, specifically: the honest intake numbers and how they differed from prior charting, the steady weight loss the scale confirmed, the full supplements coming back, the painful denture, the barely-touched fluids and the reasons, the dark urine and dry lips, the slow-healing heel. The nurse and dietitian moved on it: a nutrition assessment, a dental referral that refit the denture, a texture-appropriate appetizing diet while her mouth healed, supplements she\'d actually drink in flavors she liked, and a hydration plan. Rosa carried out her end — patient mealtime support, the pitcher moved within reach and refilled, fluids offered every visit with the juice she preferred, reassurance about nighttime bathroom help, honest charting throughout.',
                '**The outcome:** With the denture fixed, food no longer hurt. With fluids in reach and offered, she drank. With honest numbers, the team could see what was real and adjust. Over the following weeks, Mrs. Adeyemi\'s weight stabilized and began to recover, her energy and steadiness improved, the heel sore — finally supplied with the nutrition skin needs — closed, and the quiet decline reversed. The nurse put it plainly: "The old chart said she was fine, and she was starving behind it. Rosa charted the truth, weighed the truth, and found the denture and the water pitcher. The truth is what saved her."',
                '**Discussion:** Rosa\'s case is the whole course in one resident. She read the quiet signs — loose clothes, spinning rings, rearranged trays, full supplements, slow healing — instead of trusting comfortable numbers. She restored the early-warning system by charting honestly even when it contradicted prior records, and let the scale tell its story. She looked for the why and found two utterly fixable causes — a painful denture and unreachable, unoffered fluids — that had quietly starved and dried a resident for months. She reported specifically, supported the plan with dignified mealtime care and active hydration, and stayed in scope throughout: she never diagnosed or changed the diet — she observed, recorded truly, reported, and assisted. Honest eyes, faithful records, dignified meals — and a decline that reversed because of them.',
              ].join('\n\n'),
            },
            {
              id: 'mal-s11-reflection-1',
              type: 'reflection',
              prompt:
                'Mrs. Adeyemi\'s chart said she was "doing fine" while she was actually malnourished. How did inflated intake records hide the problem, and why was Rosa\'s honest charting — even when it contradicted prior entries — so important?',
              minCharacters: 50,
            },
            {
              id: 'mal-s11-reflection-2',
              type: 'reflection',
              prompt:
                'Two simple, fixable causes — a painful denture and out-of-reach, unoffered fluids — drove months of decline. What does this case teach about looking for the "why" behind poor eating and drinking, and about the CNA\'s role in finding it?',
              minCharacters: 50,
            },
            {
              id: 'mal-s11-rp-text',
              type: 'text',
              body: 'Reflect on the case study in the previous lesson. Your written responses help you apply what you learned about honest intake documentation, weight monitoring, active hydration, and finding fixable causes behind poor eating.',
            },
            {
              id: 'mal-s11-kc2-check',
              type: 'knowledge_check',
              question:
                'A CNA does not diagnose malnutrition or dehydration, does not prescribe or change diets or supplements, does not change diet orders, and does not place or manage feeding tubes. Mrs. Lindqvist has eaten poorly for a week. Today she took three bites of lunch — roughly 10% — and left her supplement untouched. You\'re behind on charting, and a coworker says, "Just put her down as 75% like usual — if you chart 10% the nurse will ask questions and there\'ll be paperwork. She probably ate more than it looks anyway." What SHOULD the CNA do?',
              options: [
                {
                  id: 'chart-75',
                  label: 'Chart 75% to avoid questions and paperwork',
                },
                {
                  id: 'chart-truth-report',
                  label:
                    'Chart what she actually ate — about 10%, supplement refused — and report the week-long pattern of poor intake to the nurse',
                },
                {
                  id: 'chart-50',
                  label: 'Chart 50% as a compromise',
                },
                {
                  id: 'skip-charting',
                  label: 'Skip charting her intake today',
                },
              ],
              correctOptionId: 'chart-truth-report',
              explanation:
                'You never diagnose, prescribe, change diets, or manage feeding tubes — but your honest intake documentation is exactly what triggers the help a starving resident needs. Chart the truth and report the pattern.',
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
            { id: 'mal-s12-heading', type: 'heading', level: 1, text: 'Conclusion' },
            {
              id: 'mal-s12-video',
              type: 'video',
              title: 'Conclusion',
              videoUrl: '/assets/courses/malnutrition-elderly/s12-conclusion.mp4',
              placeholderNote: 'Pending upload: /assets/courses/malnutrition-elderly/s12-conclusion.mp4',
            },
            {
              id: 'mal-s12-image',
              type: 'image',
              src: `${ASSET_BASE}/s12-hero.png`,
              caption:
                'Caring with attention — protecting every resident\'s nutrition and hydration.',
            },
            {
              id: 'mal-s12-narration',
              type: 'text',
              body: [
                'You\'ve reached the end. Let\'s lock in the five things that matter most for malnutrition and dehydration care.',
                '**One.** Malnutrition and dehydration are common, hidden, and serious. They weaken muscles and cause falls, prevent healing and feed pressure injuries, invite infections, cloud the mind, and drive decline and hospitalization. They creep quietly — under loose clothes, behind picked-at trays — which is why watchful daily care catches them and inattention misses them.',
                '**Two.** The mealtime is yours, and it\'s where nutrition is won. Set every resident up to succeed, give the assistance each one actually needs — patient, unhurried, never forced — keep meals pleasant and dignified, and follow diet orders and swallowing safety exactly. The well-run, dignified meal is the best nutrition intervention there is.',
                '**Three.** Keep the records honest and the weights faithful. Chart what was truly eaten and drunk — never guessed, never inflated — because the team acts on your numbers, and false numbers hide a starving resident behind clean paperwork. Take weights carefully and report unintended loss. The truth on the chart is the early-warning system.',
                '**Four.** Hydrate actively — never wait for thirst. Aging silences the thirst signal, so offer fluids at every encounter, keep water in reach, honor preferences, and support residents who self-restrict out of fear. And know dehydration\'s signs — dry lips, dark scanty urine, weakness, dizziness — and its loudest one: new confusion in an elder means think dehydration, and report promptly.',
                '**Five.** Honor your scope, and report early. You never diagnose, prescribe, change diet orders, or manage feeding tubes — but you run the meals, keep the honest records, take the weights, carry the hydration, and report the patterns and the fixable causes. No one on the team is closer to this fight than you. Honest eyes, faithful records, dignified meals — that is the care.',
              ].join('\n\n'),
            },
            {
              id: 'mal-s12-summary',
              type: 'summary',
              title: 'Five things that matter most',
              items: [
                'Malnutrition and dehydration are common, hidden, and serious — watchful daily care catches them.',
                'The mealtime is yours — set up, assist patiently, keep meals dignified, follow diet orders exactly.',
                'Keep records honest and weights faithful — the truth on the chart is the early-warning system.',
                'Hydrate actively — never wait for thirst; new confusion in an elder means think dehydration.',
                'Honor your scope — run the meals, records, weights, hydration, and report early.',
              ],
            },
            {
              id: 'mal-s12-whn-text',
              type: 'text',
              body: 'Ten questions are waiting. Everything on them was covered here. You\'re ready. Trust what you\'ve learned, and show what you know.',
            },
            {
              id: 'mal-s12-cr-text',
              type: 'text',
              body: 'This course provides one hour of continuing education credit through CAL ACE Nursing Academy, an approved CDPH continuing education provider, NAC number 7384. Your certificate is generated automatically when you pass the knowledge check.',
            },
            {
              id: 'mal-s12-cr-callout',
              type: 'callout',
              variant: 'info',
              title: 'Scope reminder',
              body: 'CNAs assist, encourage, document, weigh, hydrate, and report. CNAs do not diagnose malnutrition, prescribe or change diets or supplements, change diet orders, or place or manage feeding tubes.',
            },
            {
              id: 'mal-s12-ca-text',
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

export async function seedCourse50MalnutritionElderly(
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
    `Seeding Course 50 (Malnutrition & Dehydration in the Elderly) as DRAFT — slug "${COURSE_SLUG}"…`,
  );

  try {
    const result = await seedCourse50MalnutritionElderly(prisma);
    const blockCounts = blockCountsByLesson();
    const totalBlocks = Object.values(blockCounts).reduce((sum, count) => sum + count, 0);

    console.log('Seed complete.');
    console.log(`  Course:   ${COURSE_TITLE}`);
    console.log(`  Slug:     ${COURSE_SLUG}`);
    console.log(`  Created:  ${result.courseCreated ? 'yes (new)' : 'no (updated existing)'}`);
    console.log(`  Modules:  ${result.modulesUpserted}`);
    console.log(`  Lessons:  ${result.lessonsUpserted}`);
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
