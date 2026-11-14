/**
 * Seed Course 33 — Caring for a Resident with Urinary Incontinence (DRAFT).
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-33-urinary-incontinence
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
const COURSE_SLUG = 'urinary-incontinence';
const COURSE_TITLE = 'Incontinence Care, Dignity, and Skin Protection';
const COURSE_SUMMARY =
  'Learn to support a resident with urinary incontinence — understanding the types, protecting dignity above all, supporting toileting programs, providing meticulous skin care to prevent breakdown, and recognizing when incontinence signals a treatable problem. CNAs do not diagnose, give or adjust medications, or decide that incontinence is "just aging."';

const ASSET_BASE = `/assets/courses/urinary-incontinence`;

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
    'Explain what incontinence is and its common types',
    'Provide care that protects dignity and skin',
    'Support toileting programs',
    'Recognize when to report changes',
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
  heroImage: '/assets/courses/urinary-incontinence/hero-banner.png',
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
    title: 'Understanding Urinary Incontinence',
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: "Introduction",
        sortOrder: 0,
        buildContent: () =>
          doc("Welcome", [
            { id: 'ui-s01-heading', type: 'heading', level: 1, text: "Welcome" },
            {
                          id: 'ui-s01-video',
                          type: 'video',
                          title: 'Introduction',
                          videoUrl: `${ASSET_BASE}/s01-intro.mp4`,
                          placeholderNote: `Pending upload: ${ASSET_BASE}/s01-intro.mp4`,
                        },
            {
                          id: 'ui-s01-image',
                          type: 'image',
                          src: `${ASSET_BASE}/s01-hero.jpg`,
                          caption:
                            'Urinary incontinence — protecting dignity and skin while supporting bladder care.',
                        },
            {
                          id: 'ui-s01-narration',
                          type: 'text',
                          body: [
                            'Welcome to CAL ACE Nursing Academy.',
                            'This course is about urinary incontinence — the loss of bladder control — and how a CNA provides care that protects a resident\'s skin, their health, and above all, their dignity.',
                            'Urinary incontinence means a person can\'t fully control when they urinate, so urine leaks or escapes before they reach a toilet. It\'s extremely common in older adults and in long-term care — but here is the first and most important thing to understand: incontinence is never something to be ashamed of, and it is never just a normal, untreatable part of aging to be dismissed. It\'s a medical condition, often with a treatable cause, and it deserves real care and real respect.',
                            'That word — dignity — runs through this entire course. For most adults, losing control of the bladder strikes at the very core of their dignity. A resident may feel embarrassed, humiliated, ashamed, or childlike. They may apologize, or hide it, or withdraw. How you respond in those moments — with matter-of-fact kindness, complete respect, and never a trace of disgust or impatience — shapes not just their care, but their sense of themselves. There is no caregiving skill more important than protecting a person\'s dignity while caring for their most private needs.',
                            'This course also teaches the practical care that keeps incontinent residents healthy. Meticulous skin care — because urine on the skin, left too long, causes painful breakdown and serious wounds. Toileting programs — scheduled, supportive routines that help many residents stay dry and independent. And recognizing when incontinence is new or suddenly worse, which can signal a treatable problem like an infection that needs reporting.',
                            'And there\'s a key idea you\'ll carry throughout: incontinence is often improvable. With the right toileting program, treatment of underlying causes, and good care, many residents become drier, more comfortable, and more independent. We don\'t just manage incontinence — we work to improve it.',
                            'Your scope is clear. A CNA provides dignified, skilled incontinence care, supports toileting programs, protects the skin, and reports changes. A CNA does not diagnose the cause, does not give or adjust medications, and never dismisses incontinence as just aging.',
                            'By the end of this course, you will be able to: explain what incontinence is and its common types. Provide care that protects dignity and skin. Support toileting programs. Recognize when to report changes. And know your scope.',
                            'There is a ten-question knowledge check at the end. Everything on it is covered here. Let\'s begin.',
                          ].join('\n\n'),
                        },
            {
                          id: 'ui-s01-ci-text',
                          type: 'text',
                          body: [
                            'This course teaches the CNA\'s role in caring for a resident with urinary incontinence — understanding the types, protecting dignity above all, supporting toileting programs, providing meticulous skin care to prevent breakdown, and recognizing when incontinence signals a treatable problem.',
                            'Let\'s be clear about your role. A CNA provides dignified, skilled incontinence care, supports toileting programs, protects the skin, and reports changes. A CNA does not diagnose the cause, does not give or adjust medications, and never dismisses incontinence as just aging. Those are nursing and physician tasks. But none of them can happen without your careful observation and faithful reporting first.',
                          ].join('\n\n'),
                        },
            {
                          id: 'ui-s01-ci-scope-callout',
                          type: 'callout',
                          variant: 'clinical',
                          title: 'Scope of this course',
                          body: 'CNAs SUPPORT, PROTECT, WATCH, and REPORT. CNAs do not diagnose the cause of incontinence, give or adjust medications, or dismiss incontinence as "just aging."',
                        },
            {
                          id: 'ui-s01-lo-text',
                          type: 'text',
                          body: 'By the end of this course, you will be able to:',
                        },
            {
                          id: 'ui-s01-lo-summary',
                          type: 'summary',
                          title: 'Learning objectives',
                          items: [
                            'Explain what incontinence is and its common types.',
                            'Provide care that protects dignity and skin.',
                            'Support toileting programs.',
                            'Recognize when to report changes.',
                            'Know your scope — what a CNA does, and what a CNA must never do.',
                          ],
                        },
            {
                          id: 'ui-s01-ii-text',
                          type: 'text',
                          body: 'This course is presented by CAL ACE Nursing Academy — an approved CDPH continuing education provider, NAC number 7384.',
                          meta: { flaggedFiller: true },
                        }
          ]),
      },
      {
        slug: 's02-terms',
        title: "Terms & Definitions",
        sortOrder: 1,
        buildContent: () =>
          doc("Key terms", [
            { id: 'ui-s02-heading', type: 'heading', level: 1, text: "Key terms" },
            {
                          id: 'ui-s02-image',
                          type: 'image',
                          src: `${ASSET_BASE}/s02-hero.jpg`,
                          caption:
                            'Key terms — stress, urge, overflow, and functional incontinence; prompted voiding.',
                        },
            {
                          id: 'ui-s02-reveal-incontinence',
                          type: 'reveal_card',
                          frontTitle: 'Urinary Incontinence',
                          frontBody: 'In-KON-tih-nens',
                          backTitle: 'Urinary Incontinence',
                          backBody:
                            'The loss of bladder control, so urine leaks or escapes before a person reaches the toilet. It ranges from small leaks to full loss of control. It is a common medical condition — not a character flaw, and not simply normal aging.',
                        },
            {
                          id: 'ui-s02-reveal-stress',
                          type: 'reveal_card',
                          frontTitle: 'Stress Incontinence',
                          frontBody: 'Stress incontinence',
                          backTitle: 'Stress Incontinence',
                          backBody:
                            'Leaking urine when pressure is put on the bladder — during coughing, sneezing, laughing, or lifting. The "stress" means physical pressure, not emotional stress. It\'s caused by weakened pelvic muscles, common after childbirth and with age.',
                        },
            {
                          id: 'ui-s02-reveal-urge',
                          type: 'reveal_card',
                          frontTitle: 'Urge Incontinence',
                          frontBody: 'Urge incontinence',
                          backTitle: 'Urge Incontinence',
                          backBody:
                            'A sudden, strong need to urinate that\'s hard to control, with leaking before reaching the toilet. The bladder contracts when it shouldn\'t. Residents describe "having to go and not making it in time." Quick, dignified help getting to the toilet matters here.',
                        },
            {
                          id: 'ui-s02-reveal-overflow',
                          type: 'reveal_card',
                          frontTitle: 'Overflow Incontinence',
                          frontBody: 'Overflow incontinence',
                          backTitle: 'Overflow Incontinence',
                          backBody:
                            'When the bladder doesn\'t empty properly and becomes overfull, so it constantly dribbles small amounts. The resident may feel they never fully empty. It can relate to a blockage or a weak bladder, and it\'s important to report.',
                        },
            {
                          id: 'ui-s02-reveal-functional',
                          type: 'reveal_card',
                          frontTitle: 'Functional Incontinence',
                          frontBody: 'Functional incontinence',
                          backTitle: 'Functional Incontinence',
                          backBody:
                            'When the bladder works, but the resident can\'t reach the toilet in time because of another problem — trouble walking, confusion, poor eyesight, or clothing that\'s hard to manage. This type is very responsive to CNA help: faster assistance and easy clothing can keep them dry.',
                        },
            {
                          id: 'ui-s02-reveal-toileting-program',
                          type: 'reveal_card',
                          frontTitle: 'Toileting Program',
                          frontBody: 'Toileting program',
                          backTitle: 'Toileting Program',
                          backBody:
                            'A planned, scheduled routine for helping a resident use the toilet — such as scheduled toileting at set times, or prompted toileting where the resident is regularly reminded and offered help. A good program helps many residents stay dry and independent.',
                        },
            {
                          id: 'ui-s02-reveal-dermatitis',
                          type: 'reveal_card',
                          frontTitle: 'Incontinence-Associated Dermatitis',
                          frontBody: 'Der-mah-TY-tis',
                          backTitle: 'Incontinence-Associated Dermatitis',
                          backBody:
                            'Skin damage — redness, irritation, and breakdown — caused by skin staying wet with urine. It\'s painful, can lead to serious wounds and infection, and is prevented by prompt, gentle cleaning, drying, and barrier protection.',
                        },
            {
                          id: 'ui-s02-reveal-dignity',
                          type: 'reveal_card',
                          frontTitle: 'Dignity',
                          frontBody: 'Dignity',
                          backTitle: 'Dignity',
                          backBody:
                            'The respect and sense of worth every person deserves. In incontinence care, dignity means privacy, gentleness, matter-of-fact kindness, never shaming or rushing, and protecting the resident\'s pride while caring for their most private needs. Dignity is the heart of this care.',
                        },
            {
                          id: 'ui-s02-kc1-check-stress',
                          type: 'knowledge_check',
                          question: 'Match the term: leaking with coughing, sneezing, or lifting',
                          options: [
                            { id: 'stress-incontinence', label: 'Stress incontinence' },
                            { id: 'urge-incontinence', label: 'Urge incontinence' },
                            { id: 'functional-incontinence', label: 'Functional incontinence' },
                          ],
                          correctOptionId: 'stress-incontinence',
                          explanation:
                            'Stress incontinence. Leaking urine when pressure is put on the bladder — during coughing, sneezing, laughing, or lifting. The "stress" means physical pressure, not emotional stress. It\'s caused by weakened pelvic muscles, common after childbirth and with age.',
                          requiredForCompletion: true,
                        },
            {
                          id: 'ui-s02-kc1-check-urge',
                          type: 'knowledge_check',
                          question: 'Match the term: sudden strong need, leaking before reaching the toilet',
                          options: [
                            { id: 'stress-incontinence', label: 'Stress incontinence' },
                            { id: 'urge-incontinence', label: 'Urge incontinence' },
                            { id: 'functional-incontinence', label: 'Functional incontinence' },
                          ],
                          correctOptionId: 'urge-incontinence',
                          explanation:
                            'Urge incontinence. A sudden, strong need to urinate that\'s hard to control, with leaking before reaching the toilet. The bladder contracts when it shouldn\'t. Residents describe "having to go and not making it in time." Quick, dignified help getting to the toilet matters here.',
                          requiredForCompletion: true,
                        },
            {
                          id: 'ui-s02-kc1-check-functional',
                          type: 'knowledge_check',
                          question: 'Match the term: bladder works, but can\'t reach the toilet in time',
                          options: [
                            { id: 'stress-incontinence', label: 'Stress incontinence' },
                            { id: 'urge-incontinence', label: 'Urge incontinence' },
                            { id: 'functional-incontinence', label: 'Functional incontinence' },
                          ],
                          correctOptionId: 'functional-incontinence',
                          explanation:
                            'Functional incontinence. When the bladder works, but the resident can\'t reach the toilet in time because of another problem — trouble walking, confusion, poor eyesight, or clothing that\'s hard to manage. This type is very responsive to CNA help: faster assistance and easy clothing can keep them dry.',
                          requiredForCompletion: true,
                        }
          ]),
      },
      {
        slug: 's03-statistics',
        title: "Statistics",
        sortOrder: 2,
        buildContent: () =>
          doc("Statistics", [
            { id: 'ui-s03-heading', type: 'heading', level: 1, text: "Statistics" },
            pendingAudio(
                          'ui-s03-audio',
                          'Urinary Incontinence: Common, Treatable, and Deeply Tied to Dignity',
                          `${ASSET_BASE}/s03-stats-podcast.mp3`,
                          [
                            'Urinary Incontinence: Common, Treatable, and Deeply Tied to Dignity',
                            '',
                            'Urinary incontinence is one of the most common conditions in long-term care. A large share of nursing home residents — by many estimates more than half — experience some degree of urinary incontinence. It becomes more common with age and affects women especially, though many older men have it too. So this is care a CNA gives constantly.',
                            '',
                            'Here is the single most important myth to dismantle: incontinence is NOT simply a normal, inevitable part of aging that nothing can be done about. While changes with age can contribute, incontinence is a medical condition, very often with a specific and treatable cause — a urinary tract infection, certain medications, constipation, weak pelvic muscles, limited mobility, or other issues. Treating the cause, or using a good toileting program, can reduce or even resolve incontinence for many residents. When staff write off incontinence as "just old age," residents are left wet, undignified, and untreated for problems that could be fixed. Good care assumes incontinence can be improved.',
                            '',
                            'The toll of incontinence goes far beyond the laundry. It strikes at dignity: for an adult, losing bladder control is profoundly embarrassing, and it commonly leads to shame, withdrawal, depression, and social isolation. Many residents hide it or apologize endlessly. How caregivers respond — with respect or with impatience — directly affects a resident\'s emotional wellbeing.',
                            '',
                            'There are real physical dangers too. Skin that stays wet with urine breaks down, causing painful incontinence-associated dermatitis and contributing to pressure injuries and serious wounds. And incontinence drives falls — residents rushing to the toilet, or hurrying in the night, fall and fracture. So good incontinence care also prevents wounds and fractures.',
                            '',
                            'Here\'s the empowering part for the CNA. Nearly every protective and improving factor is daily CNA work: dignified, prompt toileting help; faithful toileting programs; meticulous skin care; and recognizing and reporting new or worsening incontinence that may signal a treatable cause. Research shows structured toileting programs and good skin care meaningfully improve dryness, comfort, and skin health.',
                            '',
                            'The bottom line: incontinence is common, treatable, and tied to dignity, skin health, and fall safety — and the CNA\'s respectful, skilled daily care improves all of them.',
                          ].join('\n'),
                          '/assets/courses/urinary-incontinence/s03-stats-podcast.mp3',
                        ),
            {
                          id: 'ui-s03-image',
                          type: 'image',
                          src: `${ASSET_BASE}/s03-hero.jpg`,
                          caption:
                            'Incontinence is common in care — never "just aging," and often improvable.',
                        },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: "Fundamentals",
        sortOrder: 3,
        buildContent: () =>
          doc("Fundamentals", [
            { id: 'ui-s04-heading', type: 'heading', level: 1, text: "Fundamentals" },
            {
                          id: 'ui-s04-narration',
                          type: 'text',
                          body: [
                            '**How the bladder normally works**',
                            'The bladder is a muscular pouch that stores urine made by the kidneys. As it fills, it signals the brain that it\'s time to go. When a person reaches a toilet, the brain tells the bladder muscle to squeeze and the outlet to relax, and the bladder empties. Normal control depends on the bladder, the muscles, the nerves, and the ability to get to a toilet in time — all working together.',
                            '**What incontinence is**',
                            'Incontinence happens when something in that system doesn\'t work — the bladder squeezes when it shouldn\'t, the muscles are too weak to hold, the bladder doesn\'t empty fully, or the resident simply can\'t reach a toilet in time. The result is the same: urine leaks or escapes before they mean it to. Understanding which part is failing points to the type and the care.',
                            '**Why it\'s not "just aging"**',
                            'Aging brings some bladder changes — a smaller capacity, more frequent urges. But incontinence itself is a medical condition, not an inevitable result of getting old. Most incontinence has a contributing cause that can be addressed: an infection, a medication, constipation, weak muscles, mobility problems. Treating incontinence as fixable — not as "just old age" — is the mindset that gets residents the care they deserve.',
                            '**The main types, simply**',
                            'There are a few main types worth knowing. Stress: leaking with pressure — coughing, sneezing, lifting. Urge: a sudden, hard-to-control need, leaking before reaching the toilet. Overflow: a bladder that never fully empties, constantly dribbling. Functional: the bladder works, but the resident can\'t get to the toilet in time. Many residents have a mix. Knowing the type helps the team plan the right care.',
                            '**Functional incontinence and the CNA\'s power**',
                            'Functional incontinence deserves special attention, because it\'s where a CNA\'s help makes the biggest difference. Here the bladder works fine — the problem is reaching the toilet: difficulty walking, confusion, poor vision, or fiddly clothing. Faster help answering the call light, clear paths to the bathroom, easy-to-remove clothing, and a reliable toileting routine can keep these residents dry. Your responsiveness is the treatment.',
                            '**Why skin care is urgent**',
                            'Urine is harsh on skin. Skin that stays wet with urine becomes irritated, red, and breaks down — a painful condition that can progress to open wounds and serious pressure injuries, especially in residents who also can\'t move well. So prompt cleaning, thorough gentle drying, and barrier protection aren\'t optional comforts — they prevent painful, dangerous wounds. Skin care is core incontinence care.',
                            '**Improvement is the goal**',
                            'The goal of incontinence care isn\'t just to keep a resident clean and dry after the fact — it\'s to improve their continence wherever possible. With toileting programs, treatment of causes, pelvic exercises where appropriate, and good daily care, many residents become drier, more comfortable, and more independent. We manage incontinence, yes — but we always work to improve it.',
                          ].join('\n\n'),
                        },
            {
                          id: 'ui-s04-aging-callout',
                          type: 'callout',
                          variant: 'clinical',
                          title: 'Incontinence is NOT just aging',
                          body: 'Incontinence is a medical condition, often treatable — not an inevitable result of getting old. Treating it as fixable gets residents the care they deserve.',
                        },
            {
                          id: 'ui-s04-video',
                          type: 'video',
                          title: 'Fundamentals',
                          videoUrl: `${ASSET_BASE}/s04-fundamentals.mp4`,
                          placeholderNote: `Pending upload: ${ASSET_BASE}/s04-fundamentals.mp4`,
                        },
            {
                          id: 'ui-s04-image',
                          type: 'image',
                          src: `${ASSET_BASE}/s04-hero.jpg`,
                          caption:
                            'Why bladder control changes with age, illness, and mobility.',
                        },
          ]),
      }
    ],
  },
  {
    slug: 'module-2',
    title: 'Recognition, Prevention, and CNA Role',
    sortOrder: 1,
    lessons: [
      {
        slug: 's05-signs',
        title: "Signs & Symptoms",
        sortOrder: 4,
        buildContent: () =>
          doc("Signs & Symptoms", [
            { id: 'ui-s05-heading', type: 'heading', level: 1, text: "Signs & Symptoms" },
            {
                          id: 'ui-s05-image',
                          type: 'image',
                          src: `${ASSET_BASE}/s05-hero.jpg`,
                          caption:
                            'Recognizing change — a sudden new pattern can signal a UTI or other problem.',
                        },
            {
                          id: 'ui-s05-narration',
                          type: 'text',
                          body: [
                            'In incontinence care, you observe three things: the resident\'s individual pattern, the red-flag changes that signal a treatable problem, and the skin. Let\'s learn each.',
                            '**Knowing the resident\'s pattern**',
                            'Good incontinence care starts with knowing each resident\'s pattern — and observing it respectfully, never intrusively. When do they typically need to go? How often? Do they leak with coughing or movement, or get sudden urges, or have trouble reaching the toilet in time? Are there times of day, or triggers, that matter? Knowing the pattern lets you anticipate needs, time toileting well, and notice when something changes. You\'re not just reacting to wetness — you\'re learning the person.',
                            '**The emotional signs, and how you respond**',
                            'Watch for the emotional side, because it\'s often hidden. A resident who apologizes repeatedly, who seems embarrassed or ashamed, who tries to hide an accident, who withdraws from activities to avoid being far from a bathroom, or who becomes quiet and low. These are signs incontinence is wounding their dignity and spirit. Your response is the care: warm, matter-of-fact, never shaming, never sighing or showing disgust — communicating clearly that this is normal, manageable, and no cause for shame. How you respond can lift or crush their dignity.',
                            '**The skin signs — catch them early**',
                            'Watch the skin in the areas exposed to urine — the perineal area, buttocks, groin, and inner thighs. Early signs of skin damage: redness, irritation, a rash, or the skin looking shiny, raw, or tender. The resident may complain of burning or stinging. Caught early, these reverse with prompt cleaning, drying, and barrier protection. Left unaddressed, they progress to painful open skin and serious wounds. Check the skin at every care, and report worsening areas promptly.',
                            '**The red flag: a sudden change**',
                            'This is the most important medical sign. A sudden new onset of incontinence, or a sudden worsening in a resident whose pattern was stable, is a red flag — it often signals a treatable problem. The classic one is a urinary tract infection, which in older adults frequently shows up as new incontinence plus new confusion, and sometimes fever or discomfort. Other causes include new medications and constipation. So new or worsened incontinence — especially with new confusion — is never shrugged off as "getting worse with age"; it\'s reported promptly so the cause can be found and treated.',
                            '**Summary**',
                            'Three pictures. The resident\'s pattern: their normal timing, type, and triggers — know it to anticipate and to notice change. The emotional signs: apology, shame, hiding, withdrawal — answered with warmth and dignity. The medical and skin red flags: new or suddenly worse incontinence, especially with new confusion, reported promptly; and any reddened, irritated, or broken skin, addressed and reported early.',
                            'The rule underneath it all: protect dignity in every interaction, protect skin at every care, and treat a sudden change in continence as a reportable medical sign — never as "just aging."',
                          ].join('\n\n'),
                        },
            {
                          id: 'ui-s05-sudden-change-callout',
                          type: 'callout',
                          variant: 'warning',
                          title: 'Sudden change is a red flag',
                          body: 'New or suddenly worse incontinence — especially with new confusion — often signals a treatable cause like a UTI. Report promptly; never dismiss as "just aging."',
                        }
          ]),
      },
      {
        slug: 's06-causes',
        title: "Causes",
        sortOrder: 5,
        buildContent: () =>
          doc("Causes", [
            { id: 'ui-s06-heading', type: 'heading', level: 1, text: "Causes" },
            pendingAudio(
                          'ui-s06-audio',
                          'What Causes Incontinence — and What Can Suddenly Make It Worse?',
                          `${ASSET_BASE}/s06-causes-podcast.mp3`,
                          [
                            'What Causes Incontinence — and What Can Suddenly Make It Worse?',
                            '',
                            'Incontinence has many causes, and the encouraging news is that a great many are treatable or reversible — which is exactly why writing it off as "old age" does residents such a disservice.',
                            '',
                            'Some causes are about the bladder and muscles themselves: weakened pelvic floor muscles, common with age and after childbirth, leading to stress leaks; an overactive bladder that contracts on its own, causing urgency; an enlarged prostate in men, which can block flow and cause overflow dribbling; and nerve damage from conditions like stroke, diabetes, or Parkinson\'s that disrupts bladder signals. These are chronic, but most can still be managed and improved.',
                            '',
                            'But here\'s what matters most for the CNA: the reversible causes — the things that can suddenly cause or worsen incontinence and can be fixed. The big ones to know. A urinary tract infection — in older adults, a UTI very commonly causes sudden new incontinence and sudden confusion, and it\'s treatable. Constipation — a full bowel presses on the bladder and is a frequent, fixable cause of worsening incontinence. Certain medications — including water pills and others — can increase or trigger incontinence. Too much caffeine or, in some, fluid timing. And limited mobility or confusion that keeps a resident from reaching the toilet in time — functional incontinence, which better help directly fixes.',
                            '',
                            'This is why a sudden change is such an important signal. When a resident who was stable suddenly becomes incontinent or much worse — especially with new confusion — it very often means something treatable is happening, most classically a UTI. Catching and reporting that change gets the resident treated and often restores their previous continence.',
                            '',
                            'Here\'s what it means for the CNA. You can\'t diagnose the cause, but you\'re positioned to catch the reversible ones: report sudden changes promptly so infections and other causes get found, watch for and report constipation, support good toileting access and easy clothing for functional incontinence, and never assume worsening is just inevitable decline. By treating every change as potentially fixable, you help residents get the treatment that keeps them drier and more dignified.',
                          ].join('\n'),
                          '/assets/courses/urinary-incontinence/s06-causes-podcast.mp3',
                        ),
            {
                          id: 'ui-s06-image',
                          type: 'image',
                          src: `${ASSET_BASE}/s06-hero.jpg`,
                          caption:
                            'What contributes to incontinence — infection, medications, mobility, and more.',
                        },
          ]),
      },
      {
        slug: 's07-role',
        title: "CNA Role & Best Practices",
        sortOrder: 6,
        buildContent: () =>
          doc("CNA Role & Best Practices", [
            { id: 'ui-s07-heading', type: 'heading', level: 1, text: "CNA Role & Best Practices" },
            {
                          id: 'ui-s07-image',
                          type: 'image',
                          src: `${ASSET_BASE}/s07-hero.jpg`,
                          caption:
                            'CNA scope — dignified toileting, skin protection, reporting; never give meds or insert a catheter.',
                        },
            {
                          id: 'ui-s07-scope-callout',
                          type: 'callout',
                          variant: 'clinical',
                          title: 'Scope of practice',
                          body: 'CNAs SUPPORT, PROTECT, WATCH, and REPORT. CNAs never diagnose the cause of incontinence, give or adjust medications, or dismiss incontinence as "just aging."',
                        },
            {
                          id: 'ui-s07-narration',
                          type: 'text',
                          body: [
                            'Incontinence treatment combines finding and fixing causes, toileting programs, sometimes medications or therapy, and excellent daily care — and the CNA delivers the daily, dignified heart of it. Let\'s walk through it, starting as always with the rule that never bends. A CNA does not diagnose the cause of incontinence, does not give or adjust medications, and never decides incontinence is "just aging."',
                            '**Treating the cause first.** The best treatment often starts with finding a reversible cause — a UTI, constipation, a medication — and fixing it. Your role is to make that possible: report sudden changes promptly, report and help prevent constipation, and observe patterns the team can act on. Many residents improve dramatically once a cause is treated.',
                            '**Toileting programs — your daily treatment.** For many residents, a structured toileting program is the core treatment, and it\'s CNA work. Scheduled toileting: helping the resident to the toilet at set times before accidents happen. Prompted toileting: regularly reminding and offering, especially for residents with some confusion. Habit training built around their natural pattern. Following the program faithfully — on time, every time — is what keeps many residents dry, independent, and dignified. Inconsistency undoes it.',
                            '**Pelvic exercises and bladder training.** Some residents benefit from pelvic floor exercises or bladder-training schedules guided by the nurse or therapist. You encourage and support these as assigned — you don\'t design them, but your consistent support helps them work.',
                            '**Medications and devices.** Some residents take medications for an overactive bladder, or men may have treatment for prostate issues. The nurse manages these. Your part: report side effects, report whether things are improving, and report new constipation, since some bladder medications can cause it.',
                            '**Skin protection — non-negotiable.** This is daily, essential treatment. Check skin at every care. Clean promptly and gently after every incontinence episode — never leave a resident wet. Use mild cleansing, pat dry thoroughly, and apply barrier creams as the plan directs. Use the right absorbent products, changed promptly. Reposition to relieve pressure. Report any redness or breakdown early. Protected skin is healthy skin.',
                            '**Dignity in everything.** Treatment that ignores dignity isn\'t good care. Provide privacy, work matter-of-factly and warmly, never rush or shame, respond promptly to needs and call lights, and protect the resident\'s pride at every step. Dignity isn\'t separate from the treatment — it\'s part of it.',
                            'The scope point for this section: you don\'t diagnose or medicate — but you make cause-finding possible, deliver the toileting program faithfully, protect the skin meticulously, and guard dignity in every interaction.',
                          ].join('\n\n'),
                        }
          ]),
      },
      {
        slug: 's08-prevention',
        title: "Prevention & Risk Reduction",
        sortOrder: 7,
        buildContent: () =>
          doc("Prevention & Risk Reduction", [
            { id: 'ui-s08-heading', type: 'heading', level: 1, text: "Prevention & Risk Reduction" },
            {
                          id: 'ui-s08-image',
                          type: 'image',
                          src: `${ASSET_BASE}/s08-hero.jpg`,
                          caption:
                            'Prevention — scheduled toileting, easy access, and protecting fragile skin.',
                        },
            {
                          id: 'ui-s08-narration',
                          type: 'text',
                          body: [
                            'With incontinence, CNAs prevent accidents, skin damage, and lost dignity — and help residents stay drier and more independent. Here are seven ways.',
                            '**One. Follow the toileting program faithfully.** Take residents to the toilet on their scheduled times, before accidents happen, and remind and offer for those who need prompting. Consistency is everything — a program followed reliably keeps many residents dry; a program followed sloppily fails. On time, every time.',
                            '**Two. Answer call lights fast — it prevents accidents and falls.** For a resident who can feel the urge but can\'t move quickly, a slow response means an accident, or a dangerous rushed attempt to get to the bathroom alone. Prompt help keeps them dry and prevents the falls that injure. Speed is dignity and safety together.',
                            '**Three. Make the path to the toilet easy.** Clear, well-lit routes to the bathroom; a call light and needed items within reach; easy-to-remove clothing; a bedside commode or urinal where appropriate. Remove the obstacles between the resident and the toilet. For functional incontinence especially, easy access is prevention.',
                            '**Four. Protect the skin relentlessly.** Never leave a resident sitting or lying in wet. Check and clean promptly after every episode, dry gently and thoroughly, apply barrier protection as directed, and change absorbent products on time. Reposition to relieve pressure. Catching and treating early redness prevents painful wounds.',
                            '**Five. Support healthy bladder habits.** Encourage adequate fluids during the day as the plan allows — restricting fluids to reduce accidents actually backfires, concentrating urine and irritating the bladder. Support reasonable fluid timing, and watch caffeine where it\'s a trigger. Healthy hydration supports a healthier bladder.',
                            '**Six. Prevent and report constipation.** A full bowel presses on the bladder and worsens incontinence. Support bowel regularity with fluids, fiber, and movement as the plan allows, and report constipation — relieving it often improves continence. The bowel and bladder are connected.',
                            '**Seven. Guard dignity as prevention — of shame and withdrawal.** Provide privacy, respond with warmth and zero judgment, never sigh, rush, or show disgust, and speak of incontinence care matter-of-factly. Protecting dignity prevents the shame, withdrawal, and depression that incontinence can cause. Respect is preventive care for the spirit.',
                          ].join('\n\n'),
                        }
          ]),
      }
    ],
  },
  {
    slug: 'module-3',
    title: 'Action, Judgment, and Application',
    sortOrder: 2,
    lessons: [
      {
        slug: 's09-scenario',
        title: "Scenario & Reporting",
        sortOrder: 8,
        buildContent: () =>
          doc("Scenario & Reporting", [
            { id: 'ui-s09-heading', type: 'heading', level: 1, text: "Scenario & Reporting" },
            pendingAudio(
                          'ui-s09-intro-audio',
                          'Emergency response scenarios intro',
                          `${ASSET_BASE}/s09-emergency-intro.mp3`,
                          'With incontinence, the judgments that matter most are recognizing a sudden change as a treatable medical sign rather than "just aging," and protecting dignity even in a hard moment. You\'re about to work through two situations. Read each carefully, choose your action, and you\'ll get feedback right away. Keep the core idea in mind: a sudden change in continence — especially with new confusion — is reported promptly, because the cause is often fixable.',
                          '/assets/courses/urinary-incontinence/s09-emergency-intro.mp3',
                        ),
            {
                          id: 'ui-s09-image',
                          type: 'image',
                          src: `${ASSET_BASE}/s09-hero.jpg`,
                          caption:
                            'Two incontinence judgments — a possible UTI to report, and toileting done with dignity.',
                        },
            {
                          id: 'ui-s09-scenario-lindqvist-image',
                          type: 'image',
                          src: `${ASSET_BASE}/s09-scenario-lindqvist.jpg`,
                          caption:
                            'Sudden new incontinence with confusion: suspect a UTI — report it promptly.',
                        },
            {
                          id: 'ui-s09-scenario-lindqvist',
                          type: 'scenario_question',
                          prompt:
                            'Mrs. Lindqvist has been continent and sharp for the whole time you\'ve cared for her. Over the last day, she\'s suddenly started having accidents she never had before, and she also seems newly confused — muddled about where she is and more agitated than usual. A coworker says, "She\'s getting older, this happens, just put her in briefs." What SHOULD the CNA do?',
                          options: [
                            {
                              id: 'just-aging',
                              label: 'Agree it\'s just aging and put her in briefs',
                              feedback:
                                'A sudden change like this — new incontinence plus new confusion — is a red flag for a treatable cause, most classically a UTI, not normal aging. Dismissing it, or restricting fluids, leaves a fixable problem untreated and can make it worse. The right action: report the sudden incontinence and confusion to the nurse promptly.',
                            },
                            {
                              id: 'report-promptly',
                              label:
                                'Report the sudden incontinence and new confusion to the nurse promptly — it may be a treatable problem like a UTI',
                              feedback:
                                'Exactly right. Sudden new incontinence together with sudden new confusion in an older adult is a classic warning sign of a urinary tract infection — which is common, treatable, and frequently shows up exactly this way in elderly residents. It is NOT "just aging," and treating it as such would leave a treatable, potentially worsening infection unaddressed. Report the sudden changes to the nurse promptly so the cause can be found and treated. Don\'t restrict her fluids — that can worsen a UTI and the incontinence. Catching this change is exactly how a CNA helps a resident get better.',
                              isRecommended: true,
                            },
                            {
                              id: 'restrict-fluids',
                              label: 'Restrict her fluids to reduce the accidents',
                              feedback:
                                'A sudden change like this — new incontinence plus new confusion — is a red flag for a treatable cause, most classically a UTI, not normal aging. Dismissing it, or restricting fluids, leaves a fixable problem untreated and can make it worse. The right action: report the sudden incontinence and confusion to the nurse promptly.',
                            },
                            {
                              id: 'wait-weeks',
                              label: 'Wait a few weeks to see if it settles',
                              feedback:
                                'A sudden change like this — new incontinence plus new confusion — is a red flag for a treatable cause, most classically a UTI, not normal aging. Dismissing it, or restricting fluids, leaves a fixable problem untreated and can make it worse. The right action: report the sudden incontinence and confusion to the nurse promptly.',
                            },
                          ],
                          requiredForCompletion: true,
                        },
            {
                          id: 'ui-s09-scenario-okafor-image',
                          type: 'image',
                          src: `${ASSET_BASE}/s09-scenario-okafor.jpg`,
                          caption:
                            'Dignity first — respond calmly and privately; never shame or scold an accident.',
                        },
            {
                          id: 'ui-s09-scenario-okafor',
                          type: 'scenario_question',
                          prompt:
                            'Mr. Okafor, a proud, formerly independent man, has had a bowel and bladder accident in his bed. He\'s mortified — apologizing over and over, near tears, saying he\'s "disgusting" and "such a burden." A busy coworker mutters loudly, "Ugh, again? This is the third time today," within his hearing. What SHOULD the CNA do?',
                          options: [
                            {
                              id: 'agree-coworker',
                              label: 'Agree with the coworker and clean him up quickly without a word',
                              feedback:
                                'Shaming Mr. Okafor, agreeing with the hurtful comment, or telling him to "try harder" attacks the dignity that incontinence already wounds — and he can\'t simply control this. The right action: respond with warm, matter-of-fact reassurance that it\'s okay and not his fault, and provide gentle, private, dignified care.',
                            },
                            {
                              id: 'dignified-care',
                              label:
                                'Respond with calm warmth and zero judgment, reassure him it\'s okay and not his fault, and provide care that protects his dignity',
                              feedback:
                                'Right. This moment will shape how Mr. Okafor feels about himself, and the care he receives now matters as much as the cleanup. Respond with calm, matter-of-fact warmth and absolutely no judgment: reassure him this is okay, it happens, it\'s a medical issue and not his fault, and he is not a burden. Provide prompt, gentle, private care that protects his dignity and his skin. The coworker\'s comment was harmful, and the kind thing is to counter its effect with your own respect — and, appropriately, to address such comments so they don\'t continue. Shaming a resident, or telling him to "try harder," deepens the wound of incontinence; dignity heals it.',
                              isRecommended: true,
                            },
                            {
                              id: 'try-harder',
                              label: 'Tell him he needs to try harder to control it',
                              feedback:
                                'Shaming Mr. Okafor, agreeing with the hurtful comment, or telling him to "try harder" attacks the dignity that incontinence already wounds — and he can\'t simply control this. The right action: respond with warm, matter-of-fact reassurance that it\'s okay and not his fault, and provide gentle, private, dignified care.',
                            },
                            {
                              id: 'leave-until-available',
                              label: 'Leave him until someone else is available',
                              feedback:
                                'Shaming Mr. Okafor, agreeing with the hurtful comment, or telling him to "try harder" attacks the dignity that incontinence already wounds — and he can\'t simply control this. The right action: respond with warm, matter-of-fact reassurance that it\'s okay and not his fault, and provide gentle, private, dignified care.',
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
            { id: 'ui-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
                          id: 'ui-s10-narration',
                          type: 'text',
                          body: [
                            'Your role in incontinence care is dignity, faithful toileting support, meticulous skin protection, and alert reporting. Let\'s walk through it.',
                            '**Protect dignity, always and first** Above everything, protect dignity. Provide privacy. Work with calm, matter-of-fact warmth — never rushing, sighing, or showing the slightest disgust. Reassure residents that incontinence is a medical condition, common and no cause for shame. Respond promptly so they\'re not left waiting or wet. The way you handle these most private moments tells a resident whether they\'re still respected — make sure the answer is always yes.',
                            '**Deliver the toileting program faithfully** Be the engine of the toileting program. Take residents to the toilet on schedule, before accidents; remind and offer for those who need prompting; build on each resident\'s natural pattern. Do it on time, every time, because consistency is what makes a program work and keeps residents dry and independent. Your faithfulness here directly improves their continence.',
                            '**Protect the skin meticulously** Guard the skin. Never leave a resident wet — clean promptly and gently after every episode, dry thoroughly, apply barrier protection as directed, change products on time, and reposition. Check the skin at every care and report early redness before it becomes a wound. With incontinence, skin care is some of the most important physical care you give.',
                            '**Observe and report the changes that get residents better** Be the alert observer. Know each resident\'s pattern, and report sudden new or worsening incontinence promptly — especially with new confusion — because it often signals a treatable cause like a UTI. Report constipation, skin changes, signs of emotional distress, and how toileting programs are working. Your reports turn incontinence from something endured into something treated.',
                            'Now the boundary. You do not diagnose the cause of incontinence. You do not give or adjust medications. And you never dismiss incontinence as "just aging," never shame or rush a resident, and never leave a resident sitting in wet.',
                            'Inside your role — dignity first, toileting delivered faithfully, skin protected meticulously, changes reported alertly — you keep residents drier, healthier, and most importantly, respected. In caring for a person\'s most private needs, your kindness is as essential as your skill.',
                          ].join('\n\n'),
                        },
            {
                          id: 'ui-s10-scope-callout',
                          type: 'callout',
                          variant: 'clinical',
                          title: 'Stay within scope',
                          body: 'You do not diagnose the cause of incontinence. You do not give or adjust medications. You never dismiss incontinence as "just aging," never shame or rush a resident, and never leave a resident sitting in wet.',
                        },
            {
                          id: 'ui-s10-video',
                          type: 'video',
                          title: "CNA's Role in Care",
                          videoUrl: `${ASSET_BASE}/s10-cna-role.mp4`,
                          placeholderNote: `Pending upload: ${ASSET_BASE}/s10-cna-role.mp4`,
                        },
            {
                          id: 'ui-s10-image',
                          type: 'image',
                          src: `${ASSET_BASE}/s10-hero.jpg`,
                          caption:
                            'The CNA as the daily support — every dignified response protects skin and self-worth.',
                        },
          ]),
      },
      {
        slug: 's11-case-study',
        title: "Case Study",
        sortOrder: 10,
        buildContent: () => {
          const caseNarrative = [
            'Mrs. Lindqvist, 83, was a sharp, dignified former schoolteacher who had been fully continent the entire time her CNA, Grace, had cared for her. Grace knew her well — her wit, her pride, her daily routines.',
            '',
            '**The sudden change:** One day, things shifted fast. Mrs. Lindqvist, who never had accidents, suddenly had two in a single morning. She seemed embarrassed and confused by it. And the confusion was the other thing Grace noticed — Mrs. Lindqvist, normally crisp and clear, was muddled, asking the same question twice, unsure what time it was, a little agitated. It had all come on within about a day.',
            '',
            '**The easy wrong answer:** A coworker offered the easy explanation: "She\'s in her eighties, Grace. This is what happens. Just get her in briefs and move on — they all get like this eventually." It was the path of least resistance: write it off as aging, manage the wetness, done.',
            '',
            '**What Grace knew:** But Grace knew better, and she knew Mrs. Lindqvist. This wasn\'t a gradual decline — it was a sudden change in a stable, sharp woman: new incontinence and new confusion, together, within a day. That specific combination, Grace had learned, is a classic sign of a urinary tract infection in an older adult — common, and very treatable. Writing it off as "just aging" would leave a treatable infection to worsen, and would strip a dignified woman of both her continence and the chance to get better.',
            '',
            '**What Grace did:** Grace reported it promptly and specifically: "Mrs. Lindqvist has been fully continent and very sharp the whole time I\'ve known her. In the last day she\'s suddenly had two accidents and become newly confused and a bit agitated. This came on fast — I\'m concerned it could be a UTI." She also made sure not to restrict the fluids Mrs. Lindqvist needed, and cared for her with warm reassurance, never letting her feel ashamed of the accidents.',
            '',
            '**The discovery:** The nurse took Grace\'s report seriously, and testing confirmed it: Mrs. Lindqvist had a urinary tract infection. It was treated promptly. Within days of starting treatment, her confusion cleared and her continence returned — she was back to her sharp, dignified self, mortified only that "I wasn\'t quite myself there for a bit."',
            '',
            '**The outcome:** Because Grace recognized a sudden change rather than accepting "just aging," a treatable infection was caught and Mrs. Lindqvist\'s continence and clarity were restored — instead of her being quietly put in briefs and left with an untreated, worsening infection. The nurse told Grace: "Half the world would\'ve called that \'old age\' and reached for the briefs. You knew her, you saw a sudden change, and you named the likely cause. You gave her back to herself."',
            '',
            '**Discussion:** Grace\'s save rested on the central mindset of this course: incontinence is not just aging, and a sudden change is a treatable medical sign. She knew her resident\'s baseline, recognized that new incontinence plus new confusion coming on fast pointed to a likely UTI, and reported it specifically instead of accepting the easy dismissal. She protected dignity throughout and never restricted needed fluids. She didn\'t diagnose or treat — she observed, recognized, and reported. And in doing so, she restored a proud woman\'s continence, clarity, and dignity all at once.',
          ].join('\n');

          return doc("Case Study", [
            { id: 'ui-s11-heading', type: 'heading', level: 1, text: "Case Study" },
            pendingAudio(
                          'ui-s11-audio',
                          'More Than Just Aging',
                          `${ASSET_BASE}/s11-case-podcast.mp3`,
                          caseNarrative,
                          '/assets/courses/urinary-incontinence/s11-case-podcast.mp3',
                        ),
            {
                          id: 'ui-s11-image',
                          type: 'image',
                          src: `${ASSET_BASE}/s11-hero.jpg`,
                          caption:
                            'Recognizing the pattern — how a toileting program restored comfort and dignity.',
                        },
            {
                          id: 'ui-s11-case-study',
                          type: 'case_study',
                          title: 'More Than Just Aging',
                          residentProfile:
                            'Mrs. Lindqvist, 83, was a sharp, dignified former schoolteacher who had been fully continent the entire time her CNA, Grace, had cared for her. Grace knew her well — her wit, her pride, her daily routines.',
                          scenario: [
                            '**The sudden change:** One day, things shifted fast. Mrs. Lindqvist, who never had accidents, suddenly had two in a single morning. She seemed embarrassed and confused by it. And the confusion was the other thing Grace noticed — Mrs. Lindqvist, normally crisp and clear, was muddled, asking the same question twice, unsure what time it was, a little agitated. It had all come on within about a day.',
                            '**The easy wrong answer:** A coworker offered the easy explanation: "She\'s in her eighties, Grace. This is what happens. Just get her in briefs and move on — they all get like this eventually." It was the path of least resistance: write it off as aging, manage the wetness, done.',
                            '**What Grace knew:** But Grace knew better, and she knew Mrs. Lindqvist. This wasn\'t a gradual decline — it was a sudden change in a stable, sharp woman: new incontinence and new confusion, together, within a day. That specific combination, Grace had learned, is a classic sign of a urinary tract infection in an older adult — common, and very treatable. Writing it off as "just aging" would leave a treatable infection to worsen, and would strip a dignified woman of both her continence and the chance to get better.',
                            '**What Grace did:** Grace reported it promptly and specifically: "Mrs. Lindqvist has been fully continent and very sharp the whole time I\'ve known her. In the last day she\'s suddenly had two accidents and become newly confused and a bit agitated. This came on fast — I\'m concerned it could be a UTI." She also made sure not to restrict the fluids Mrs. Lindqvist needed, and cared for her with warm reassurance, never letting her feel ashamed of the accidents.',
                            '**The discovery:** The nurse took Grace\'s report seriously, and testing confirmed it: Mrs. Lindqvist had a urinary tract infection. It was treated promptly. Within days of starting treatment, her confusion cleared and her continence returned — she was back to her sharp, dignified self, mortified only that "I wasn\'t quite myself there for a bit."',
                            '**The outcome:** Because Grace recognized a sudden change rather than accepting "just aging," a treatable infection was caught and Mrs. Lindqvist\'s continence and clarity were restored — instead of her being quietly put in briefs and left with an untreated, worsening infection. The nurse told Grace: "Half the world would\'ve called that \'old age\' and reached for the briefs. You knew her, you saw a sudden change, and you named the likely cause. You gave her back to herself."',
                            '**Discussion:** Grace\'s save rested on the central mindset of this course: incontinence is not just aging, and a sudden change is a treatable medical sign. She knew her resident\'s baseline, recognized that new incontinence plus new confusion coming on fast pointed to a likely UTI, and reported it specifically instead of accepting the easy dismissal. She protected dignity throughout and never restricted needed fluids. She didn\'t diagnose or treat — she observed, recognized, and reported. And in doing so, she restored a proud woman\'s continence, clarity, and dignity all at once.',
                          ].join('\n\n'),
                        },
            {
                          id: 'ui-s11-reflection-1',
                          type: 'reflection',
                          prompt:
                            'A coworker said it was "just aging." What specific pattern made Grace recognize a likely treatable cause instead, and why is the combination of sudden incontinence plus new confusion so important to report?',
                          minCharacters: 50,
                        },
            {
                          id: 'ui-s11-reflection-2',
                          type: 'reflection',
                          prompt:
                            'Throughout, Grace protected Mrs. Lindqvist\'s dignity and didn\'t restrict her fluids. Why do both of those matter, even before the cause was known?',
                          minCharacters: 50,
                        },
            {
                          id: 'ui-s11-rp-text',
                          type: 'text',
                          body: 'Reflect on the case study in the previous lesson. Your written responses help you apply what you learned about sudden change as a treatable medical sign, protecting dignity, and never dismissing incontinence as "just aging."',
                        },
            {
                          id: 'ui-s11-kc2-check',
                          type: 'knowledge_check',
                          question:
                            'A CNA does not diagnose the cause of incontinence, does not give or adjust medications, and never decides incontinence is "just aging." When a resident who was previously continent suddenly starts having accidents and seems confused, the CNA SHOULD:',
                          options: [
                            {
                              id: 'just-aging-briefs',
                              label: 'Assume it\'s normal aging and put them in briefs',
                            },
                            {
                              id: 'report-nurse',
                              label: 'Report the sudden change to the nurse and let the nurse decide',
                            },
                            {
                              id: 'give-medication',
                              label: 'Give bladder medication as the resident requests',
                            },
                            {
                              id: 'diagnose-uti',
                              label: 'Diagnose a UTI and adjust their care plan',
                            },
                          ],
                          correctOptionId: 'report-nurse',
                          explanation:
                            'You never diagnose the cause, give or adjust medications, or dismiss incontinence as "just aging" — but your prompt reporting of sudden changes, especially with new confusion, lets the team find and treat reversible causes like a UTI.',
                          requiredForCompletion: true,
                          meta: { flaggedFiller: true },
                        }
          ]);
        },
      },
      {
        slug: 's12-conclusion',
        title: "Conclusion",
        sortOrder: 11,
        buildContent: () =>
          doc("Conclusion", [
            { id: 'ui-s12-heading', type: 'heading', level: 1, text: "Conclusion" },
            {
                          id: 'ui-s12-video',
                          type: 'video',
                          title: 'Conclusion',
                          videoUrl: `${ASSET_BASE}/s12-conclusion.mp4`,
                          placeholderNote: `Pending upload: ${ASSET_BASE}/s12-conclusion.mp4`,
                        },
            {
                          id: 'ui-s12-image',
                          type: 'image',
                          src: `${ASSET_BASE}/s12-hero.jpg`,
                          caption: 'Five things that matter most in incontinence care.',
                        },
            {
                          id: 'ui-s12-narration',
                          type: 'text',
                          body: [
                            'You\'ve reached the end. Let\'s lock in the five things that matter most for incontinence care.',
                            '**One.** Incontinence is a common medical condition — not shameful, and not simply normal aging. It comes in types: stress, urge, overflow, and functional. And it\'s often improvable, so we don\'t just manage it — we work to make it better.',
                            '**Two.** Dignity comes first, always. For an adult, losing bladder control wounds the spirit. Respond with privacy, calm warmth, and zero judgment — never rushing, sighing, or shaming. How you handle these private moments tells a resident whether they\'re still respected.',
                            '**Three.** Deliver the toileting program faithfully, and respond fast. On-time scheduled or prompted toileting keeps many residents dry and independent, and prompt call-light response prevents both accidents and the falls of rushing. Consistency and speed are the treatment.',
                            '**Four.** Protect the skin meticulously. Never leave a resident wet — clean promptly and gently, dry thoroughly, barrier-protect, change products on time, and report early redness before it becomes a painful wound.',
                            '**Five.** Treat a sudden change as a medical sign, not as aging. New or suddenly worse incontinence — especially with new confusion — is often a treatable cause like a UTI, and is reported promptly. Honor your scope: you don\'t diagnose or medicate, but you give dignified care, faithful toileting, meticulous skin protection, and alert reports that get residents better.',
                          ].join('\n\n'),
                        },
            {
                          id: 'ui-s12-summary',
                          type: 'summary',
                          title: 'Five things that matter most',
                          items: [
                            'Incontinence is a common medical condition — not shameful, and not simply normal aging.',
                            'Dignity comes first, always — privacy, calm warmth, and zero judgment.',
                            'Deliver the toileting program faithfully, and respond fast to call lights.',
                            'Protect the skin meticulously — never leave a resident wet.',
                            'Treat a sudden change as a medical sign, not as aging — report promptly.',
                          ],
                        },
            {
                          id: 'ui-s12-whn-text',
                          type: 'text',
                          body: 'Ten questions are waiting. Everything on them was covered here. You\'re ready. Trust what you\'ve learned, and show what you know.',
                        },
            {
                          id: 'ui-s12-cr-text',
                          type: 'text',
                          body: 'This course provides one hour of continuing education credit through CAL ACE Nursing Academy, an approved CDPH continuing education provider, NAC number 7384. Your certificate is generated automatically when you pass the knowledge check.',
                        },
            {
                          id: 'ui-s12-cr-callout',
                          type: 'callout',
                          variant: 'info',
                          title: 'Scope reminder',
                          body: 'CNAs support, protect, and watch. CNAs do not diagnose the cause of incontinence, give or adjust medications, or dismiss incontinence as "just aging."',
                        },
            {
                          id: 'ui-s12-ca-text',
                          type: 'text',
                          body: 'Your certificate is generated automatically when you pass the knowledge check. CDPH-Approved CE Provider — NAC #7384.',
                        }
          ]),
      }
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

export async function seedCourse33UrinaryIncontinence(
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
  console.log(`Seeding Course 33 (Urinary Incontinence) as DRAFT — slug "${COURSE_SLUG}"…`);

  try {
    const result = await seedCourse33UrinaryIncontinence(prisma);
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
