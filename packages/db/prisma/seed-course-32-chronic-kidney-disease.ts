/**
 * Seed Course 32 — Caring for a Resident with Chronic Kidney Disease (DRAFT).
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-32-chronic-kidney-disease
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
const COURSE_SLUG = 'chronic-kidney-disease';
const COURSE_TITLE = 'Kidney Disease Care Support and CNA Monitoring';
const COURSE_SUMMARY =
  'Learn to support a resident with chronic kidney disease — understanding the kidneys as the body\'s filters, honoring fluid and diet restrictions as real treatment, protecting the dialysis access site (never BP or needles on that arm), and recognizing fluid overload and waste buildup. CNAs do not diagnose, give or adjust medications, perform dialysis care, or change restrictions.';

const ASSET_BASE = `/assets/courses/chronic-kidney-disease`;

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
    'Explain what the kidneys do and what CKD is',
    'Honor fluid and diet restrictions with compassion',
    'Protect the dialysis access site',
    'Recognize fluid overload and waste buildup',
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
  heroImage: '/assets/courses/chronic-kidney-disease/hero-banner.png',
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
    title: 'Understanding Chronic Kidney Disease',
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: "Introduction",
        sortOrder: 0,
        buildContent: () =>
          doc("Welcome", [
            { id: 'ckd-s01-heading', type: 'heading', level: 1, text: "Welcome" },
            {
                          id: 'ckd-s01-video',
                          type: 'video',
                          title: 'Introduction',
                          videoUrl: `${ASSET_BASE}/s01-intro.mp4`,
                          placeholderNote: `Pending upload: ${ASSET_BASE}/s01-intro.mp4`,
                        },
            {
                          id: 'ckd-s01-image',
                          type: 'image',
                          src: `${ASSET_BASE}/s01-hero.jpg`,
                          caption:
                            'Chronic kidney disease — supporting a resident whose kidneys can no longer fully clean the blood.',
                        },
            {
                          id: 'ckd-s01-narration',
                          type: 'text',
                          body: [
                            'Welcome to CAL ACE Nursing Academy.',
                            'This course is about chronic kidney disease — and the daily care that keeps a resident with failing kidneys safe and comfortable.',
                            'The kidneys are the body\'s filters. Every day, they clean the entire blood supply — removing waste products, removing extra fluid, and keeping the body\'s chemistry in careful balance. Healthy kidneys do this quietly, around the clock, and we never think about them.',
                            'In chronic kidney disease — C-K-D — the kidneys are slowly, permanently losing that filtering ability. Waste products that should be removed begin to build up in the blood. Extra fluid that should be removed begins to build up in the body. And the careful chemical balance the kidneys maintain starts to slip. Chronic kidney disease usually develops over years, most often from diabetes and high blood pressure, and it cannot be reversed — but it can be managed, and managed well.',
                            'Here\'s what makes this course so practical. Because failing kidneys can\'t remove fluid and waste properly, the treatment leans heavily on things a CNA touches every day: fluid restrictions — limits on how much a resident may drink. Diet restrictions — limits on certain foods like salt, and often potassium and phosphorus. Daily weights that track fluid buildup. And for residents whose kidneys have failed completely, dialysis — a machine that does the kidneys\' filtering job — which comes with one absolute rule you\'ll learn about protecting the dialysis access site.',
                            'These restrictions can feel harsh — telling a thirsty resident they\'ve reached their fluid limit is hard. But here\'s the heart of this course: for a resident with kidney failure, the restrictions ARE the treatment. Fluid their kidneys can\'t remove doesn\'t pass through — it builds up, around their lungs and heart. Honoring the restrictions, with compassion, is genuine protective care.',
                            'Your scope is clear. A CNA honors fluid and diet restrictions, measures intake, output, and daily weights accurately, protects the dialysis access site, watches for fluid overload and waste buildup, and reports faithfully. A CNA does not diagnose kidney disease, does not give or adjust medications, does not perform dialysis care, and never changes a restriction.',
                            'By the end of this course, you will be able to: explain what the kidneys do and what CKD is. Honor fluid and diet restrictions with compassion. Protect the dialysis access site. Recognize fluid overload and waste buildup. And know your scope.',
                            'There is a ten-question knowledge check at the end. Everything on it is covered here. Let\'s begin.',
                          ].join('\n\n'),
                        },
            {
                          id: 'ckd-s01-ci-text',
                          type: 'text',
                          body: [
                            'This course teaches the CNA\'s role in supporting a resident with chronic kidney disease — understanding the kidneys as the body\'s filters, honoring fluid and diet restrictions as real treatment, protecting the dialysis access site (never BP or needles on that arm), and recognizing fluid overload and waste buildup.',
                            'Let\'s be clear about your role. A CNA honors fluid and diet restrictions, measures intake, output, and daily weights accurately, protects the dialysis access site, watches for fluid overload and waste buildup, and reports faithfully. A CNA does not diagnose kidney disease, does not give or adjust medications, does not perform dialysis care, and never changes a restriction. Those are nursing and physician tasks. But none of them can happen without your careful observation and faithful reporting first.',
                          ].join('\n\n'),
                        },
            {
                          id: 'ckd-s01-ci-scope-callout',
                          type: 'callout',
                          variant: 'clinical',
                          title: 'Scope of this course',
                          body: 'CNAs KEEP RESTRICTIONS, TAKE MEASUREMENTS, PROTECT THE ACCESS, and REPORT. CNAs do not diagnose kidney disease, give or adjust medications, perform dialysis care, or change restrictions.',
                        },
            {
                          id: 'ckd-s01-lo-text',
                          type: 'text',
                          body: 'By the end of this course, you will be able to:',
                        },
            {
                          id: 'ckd-s01-lo-summary',
                          type: 'summary',
                          title: 'Learning objectives',
                          items: [
                            'Explain what the kidneys do and what CKD is.',
                            'Honor fluid and diet restrictions with compassion.',
                            'Protect the dialysis access site.',
                            'Recognize fluid overload and waste buildup.',
                            'Know your scope — what a CNA does, and what a CNA must never do.',
                          ],
                        },
            {
                          id: 'ckd-s01-ii-text',
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
            { id: 'ckd-s02-heading', type: 'heading', level: 1, text: "Key terms" },
            {
                          id: 'ckd-s02-image',
                          type: 'image',
                          src: `${ASSET_BASE}/s02-hero.jpg`,
                          caption:
                            'Key terms — CKD, dialysis, fluid restriction, edema, fistula, potassium.',
                        },
            {
                          id: 'ckd-s02-reveal-kidneys',
                          type: 'reveal_card',
                          frontTitle: 'Kidneys',
                          frontBody: 'Kidneys',
                          backTitle: 'Kidneys',
                          backBody:
                            'Two bean-shaped organs in the lower back. They are the body\'s filters — cleaning the blood of waste, removing extra fluid as urine, and keeping the body\'s chemistry in balance. They also help control blood pressure and support healthy blood.',
                        },
            {
                          id: 'ckd-s02-reveal-ckd',
                          type: 'reveal_card',
                          frontTitle: 'Chronic Kidney Disease (CKD)',
                          frontBody: 'C-K-D',
                          backTitle: 'Chronic Kidney Disease (CKD)',
                          backBody:
                            'The slow, permanent loss of kidney function over months to years. The kidneys filter less and less, so waste and fluid build up. "Chronic" means long-lasting — CKD can\'t be reversed, but it can be managed.',
                        },
            {
                          id: 'ckd-s02-reveal-kidney-failure',
                          type: 'reveal_card',
                          frontTitle: 'Kidney Failure (End-Stage Renal Disease)',
                          frontBody: 'End-stage renal disease',
                          backTitle: 'Kidney Failure (End-Stage Renal Disease)',
                          backBody:
                            'When the kidneys have lost so much function they can no longer keep the body safe on their own. At this stage, the person needs dialysis — or a kidney transplant — to live.',
                        },
            {
                          id: 'ckd-s02-reveal-dialysis',
                          type: 'reveal_card',
                          frontTitle: 'Dialysis',
                          frontBody: 'Dy-AL-ih-sis',
                          backTitle: 'Dialysis',
                          backBody:
                            'A treatment that does the kidneys\' filtering job — removing waste and extra fluid from the blood. The most common type runs the blood through a filtering machine several times a week. Dialysis is life-sustaining for a resident in kidney failure.',
                        },
            {
                          id: 'ckd-s02-reveal-dialysis-access',
                          type: 'reveal_card',
                          frontTitle: 'Dialysis Access (Fistula or Graft)',
                          frontBody: 'Fistula or graft',
                          backTitle: 'Dialysis Access (Fistula or Graft)',
                          backBody:
                            'The special site, usually in an arm, created surgically so blood can flow to and from the dialysis machine — often called a fistula or graft. It is the resident\'s lifeline. It must be protected: no blood pressures, no needles, no tight items on that arm — ever.',
                        },
            {
                          id: 'ckd-s02-reveal-fluid-restriction',
                          type: 'reveal_card',
                          frontTitle: 'Fluid Restriction',
                          frontBody: 'Fluid restriction',
                          backTitle: 'Fluid Restriction',
                          backBody:
                            'A daily limit on how much fluid a resident may take in, set by the care team, because failing kidneys can\'t remove extra fluid. It includes everything that\'s liquid — water, juice, coffee, soup, ice cream, gelatin. Honoring it prevents dangerous fluid buildup.',
                        },
            {
                          id: 'ckd-s02-reveal-fluid-overload',
                          type: 'reveal_card',
                          frontTitle: 'Fluid Overload',
                          frontBody: 'Fluid overload',
                          backTitle: 'Fluid Overload',
                          backBody:
                            'When more fluid builds up than the body can handle — causing swelling in the legs and face, sudden weight gain, and, dangerously, fluid around the lungs causing shortness of breath. In kidney failure, fluid overload is the emergency the restrictions prevent.',
                        },
            {
                          id: 'ckd-s02-reveal-io',
                          type: 'reveal_card',
                          frontTitle: 'Intake and Output (I&O)',
                          frontBody: 'I and O',
                          backTitle: 'Intake and Output (I&O)',
                          backBody:
                            'Carefully measuring and recording everything a resident drinks and everything they urinate. For kidney residents, accurate I and O — along with daily weights — is how the team tracks fluid balance and keeps the resident safe.',
                        },
            {
                          id: 'ckd-s02-kc1-check-dialysis',
                          type: 'knowledge_check',
                          question: 'Match the term: treatment that does the kidneys\' filtering job',
                          options: [
                            { id: 'dialysis', label: 'Dialysis' },
                            { id: 'dialysis-access', label: 'Dialysis access' },
                            { id: 'fluid-overload', label: 'Fluid overload' },
                          ],
                          correctOptionId: 'dialysis',
                          explanation:
                            'Dialysis. A treatment that does the kidneys\' filtering job — removing waste and extra fluid from the blood. The most common type runs the blood through a filtering machine several times a week. Dialysis is life-sustaining for a resident in kidney failure.',
                          requiredForCompletion: true,
                        },
            {
                          id: 'ckd-s02-kc1-check-access',
                          type: 'knowledge_check',
                          question:
                            'Match the term: the arm site that must never get BPs, needles, or tight items',
                          options: [
                            { id: 'dialysis', label: 'Dialysis' },
                            { id: 'dialysis-access', label: 'Dialysis access' },
                            { id: 'fluid-overload', label: 'Fluid overload' },
                          ],
                          correctOptionId: 'dialysis-access',
                          explanation:
                            'Dialysis access. The special site, usually in an arm, created surgically so blood can flow to and from the dialysis machine — often called a fistula or graft. It is the resident\'s lifeline. It must be protected: no blood pressures, no needles, no tight items on that arm — ever.',
                          requiredForCompletion: true,
                        },
            {
                          id: 'ckd-s02-kc1-check-overload',
                          type: 'knowledge_check',
                          question:
                            'Match the term: dangerous buildup causing swelling, weight gain, and breathing trouble',
                          options: [
                            { id: 'dialysis', label: 'Dialysis' },
                            { id: 'dialysis-access', label: 'Dialysis access' },
                            { id: 'fluid-overload', label: 'Fluid overload' },
                          ],
                          correctOptionId: 'fluid-overload',
                          explanation:
                            'Fluid overload. When more fluid builds up than the body can handle — causing swelling in the legs and face, sudden weight gain, and, dangerously, fluid around the lungs causing shortness of breath. In kidney failure, fluid overload is the emergency the restrictions prevent.',
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
            { id: 'ckd-s03-heading', type: 'heading', level: 1, text: "Statistics" },
            pendingAudio(
                          'ckd-s03-audio',
                          'Chronic Kidney Disease: Common, Quiet, and Managed Every Day',
                          `${ASSET_BASE}/s03-stats-podcast.mp3`,
                          [
                            'Chronic Kidney Disease: Common, Quiet, and Managed Every Day',
                            '',
                            'Chronic kidney disease is far more common than most people realize. Roughly one in seven American adults — more than 35 million people — has CKD, and the risk climbs steeply with age. In long-term care, kidney disease is everywhere, because its two biggest causes — diabetes and high blood pressure — are themselves the most common chronic conditions of older adults. Diabetes and high blood pressure together account for the large majority of kidney failure.',
                            '',
                            'CKD is also remarkably quiet. The kidneys have enormous spare capacity, so most people with early kidney disease feel nothing and don\'t know they have it — as many as nine in ten people with CKD are unaware. Symptoms often appear only when much of the kidney function is already gone. By the time residents reach long-term care with known CKD, their disease is usually significant, and managing it well is daily work.',
                            '',
                            'When kidneys fail completely, life depends on dialysis. Hundreds of thousands of Americans are on dialysis, typically traveling to treatment several times a week, several hours at a time. Dialysis is life-sustaining but demanding — it\'s tiring, the schedule rules the week, and between sessions, fluid and waste build up in the body, which is exactly why fluid and diet restrictions matter so much on the days between treatments. And every dialysis resident has an access site — usually in an arm — that is literally their lifeline, requiring absolute protection.',
                            '',
                            'Here\'s what the numbers mean for the CNA. The care that keeps a kidney resident safe is overwhelmingly daily and hands-on: honoring fluid restrictions, supporting the kidney diet, measuring intake, output, and daily weights accurately, protecting the access arm, and watching for fluid overload between dialysis sessions. Studies of dialysis patients consistently show that fluid control between treatments is one of the strongest predictors of staying out of the hospital — and that fluid control happens largely through the daily care team.',
                            '',
                            'The bottom line: CKD is common and quiet, dialysis is demanding, and the restrictions, measurements, and protections a CNA delivers every day are central to keeping a kidney resident safe and out of the hospital.',
                          ].join('\n'),
                          '/assets/courses/chronic-kidney-disease/s03-stats-podcast.mp3',
                        ),
            {
                          id: 'ckd-s03-image',
                          type: 'image',
                          src: `${ASSET_BASE}/s03-hero.jpg`,
                          caption:
                            'CKD is common and progressive — daily care slows decline and prevents crises.',
                        },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: "Fundamentals",
        sortOrder: 3,
        buildContent: () =>
          doc("Fundamentals", [
            { id: 'ckd-s04-heading', type: 'heading', level: 1, text: "Fundamentals" },
            {
                          id: 'ckd-s04-narration',
                          type: 'text',
                          body: [
                            '**What healthy kidneys do**',
                            'Think of the kidneys as the body\'s filtration plant. All day, every day, they clean the blood — pulling out waste products from the body\'s work, pulling out extra fluid, and sending both away as urine. They also balance the body\'s minerals, help control blood pressure, and support healthy blood. Quiet, constant, essential.',
                            '**What goes wrong in CKD**',
                            'In chronic kidney disease, the filters are slowly, permanently damaged — most often by years of diabetes or high blood pressure injuring the kidneys\' delicate filtering units. As filters are lost, the kidneys clean less and less blood. The damage usually happens gradually, over years, and once filtering units are gone, they don\'t grow back.',
                            '**What builds up when filters fail**',
                            'When the filters fail, two things build up. Waste products accumulate in the blood — making the resident feel tired, nauseated, itchy, and foggy-headed; severe buildup is poisoning. And fluid accumulates in the body — swelling the legs, hands, and face, raising weight quickly, and, most dangerously, collecting around the lungs and burdening the heart. Everything in kidney care aims at controlling these two buildups.',
                            '**Why the restrictions are the treatment**',
                            'This is the heart of kidney care. A healthy person who drinks extra water simply urinates it out. A resident with kidney failure cannot — fluid in is fluid that stays. So the fluid restriction isn\'t a rule for its own sake: it is the treatment, directly preventing dangerous overload. The same is true for diet: failing kidneys can\'t remove extra salt, and often can\'t handle extra potassium and phosphorus — so the kidney diet protects the resident from buildups their kidneys can\'t fix. Restrictions equal protection.',
                            '**Dialysis: the artificial filter**',
                            'When the kidneys fail completely, dialysis takes over the filtering. In the most common form, the resident\'s blood flows out through their access site, through a machine that removes waste and extra fluid, and back — typically several times a week for several hours. Dialysis is life-sustaining, but it\'s also tiring, and it only filters during the session — between sessions, fluid and waste build up again, which is why the restrictions matter most on the in-between days.',
                            '**The access site: the lifeline**',
                            'A dialysis resident has an access site — usually a fistula or graft in one arm — surgically created so blood can flow to the machine. That access is their lifeline: if it\'s damaged or clots off, dialysis can\'t happen until it\'s fixed or replaced. So it\'s protected absolutely: no blood pressures on that arm, no needles or blood draws, no tight clothing or restraints, nothing pressing on it — and its gentle buzzing feel, called a thrill, is a sign it\'s working.',
                            '**Managed well, life goes on**',
                            'CKD can\'t be cured, but managed well — with restrictions honored, dialysis attended, medications taken, and daily watchfulness — residents live meaningful lives. The difference between a stable kidney resident and one repeatedly hospitalized is very often the quality of daily care: the fluid control, the measurements, the protected access, the early reports. That daily care is yours.',
                          ].join('\n\n'),
                        },
            {
                          id: 'ckd-s04-restrictions-callout',
                          type: 'callout',
                          variant: 'clinical',
                          title: 'Fluid in is fluid that STAYS',
                          body: 'The restrictions ARE the treatment. Honor fluid and diet limits faithfully — they directly prevent dangerous overload.',
                        },
            {
                          id: 'ckd-s04-video',
                          type: 'video',
                          title: 'Fundamentals',
                          videoUrl: `${ASSET_BASE}/s04-fundamentals.mp4`,
                          placeholderNote: `Pending upload: ${ASSET_BASE}/s04-fundamentals.mp4`,
                        },
            {
                          id: 'ckd-s04-image',
                          type: 'image',
                          src: `${ASSET_BASE}/s04-hero.jpg`,
                          caption:
                            'How failing kidneys change the body — fluid, waste, and mineral balance.',
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
            { id: 'ckd-s05-heading', type: 'heading', level: 1, text: "Signs & Symptoms" },
            {
                          id: 'ckd-s05-image',
                          type: 'image',
                          src: `${ASSET_BASE}/s05-hero.jpg`,
                          caption:
                            'Recognizing trouble — swelling, shortness of breath, sudden weight gain, confusion.',
                        },
            {
                          id: 'ckd-s05-narration',
                          type: 'text',
                          body: [
                            'With kidney disease, you watch three things: fluid overload, waste buildup, and the dialysis access. Let\'s learn the signs of each.',
                            '**Fluid overload: the swelling and the scale**',
                            'Fluid overload is the most urgent daily watch. Its signs: swelling — in the ankles, legs, feet, hands, and around the eyes and face, often worse as the day goes on. Sudden weight gain — and this is why daily weights matter so much: fluid is heavy, and a fast jump on the scale means fluid is building. Tight rings or shoes. For a dialysis resident, weight climbing between sessions is the fluid accumulating — expected in small amounts, dangerous in large ones. Report new or worsening swelling and any rapid weight gain.',
                            '**Fluid overload reaching the lungs: urgent**',
                            'The dangerous far end of fluid overload is fluid collecting around the lungs. Watch for: shortness of breath — especially with activity, or when lying flat, so the resident wants to sleep propped up. A wet-sounding cough. Breathing that\'s faster or labored. A resident who suddenly can\'t catch their breath, or can\'t lie down to sleep, may have fluid pressing on their lungs — this is urgent, report it immediately. Severe breathing distress is an emergency.',
                            '**Waste buildup: the slow poisoning signs**',
                            'When waste builds up in the blood, the resident feels it body-wide: deepening fatigue and weakness. Nausea and loss of appetite — food, especially meat, may taste off or metallic. Persistent itching. Trouble concentrating, fogginess, or confusion. Restless legs and poor sleep. In severe buildup: worsening confusion, twitching, or extreme drowsiness — which is serious and reported urgently. A kidney resident growing foggier, sicker to their stomach, and itchier may have rising waste levels — report the pattern.',
                            '**The access site: protect and check**',
                            'For a dialysis resident, the access is the lifeline, and you watch it. Healthy signs: the site looks like its normal self, and it has its gentle buzz — the thrill — which the nurse may have you feel for. Report immediately: bleeding from the site. Redness, warmth, swelling, or drainage — possible infection. Pain at the site. And the most urgent quiet sign: the buzz weakening or disappearing, which can mean the access is clotting off — report that right away, because a clotted access can sometimes be saved if caught fast. And the standing rule, always: no blood pressures, no needles, nothing tight on that arm.',
                            '**Summary**',
                            'Three pictures. Fluid overload: swelling, fast weight gain, and — urgently — shortness of breath or can\'t lie flat. Waste buildup: fatigue, nausea, poor appetite, itching, fogginess — worsening confusion is urgent. Access trouble: bleeding, infection signs, pain, or a weakening buzz — report immediately, and never BP or needles on that arm.',
                            'The rule underneath it all: in a kidney resident, the scale, the breathing, and the access arm are checked with religious consistency — and changes are reported early.',
                          ].join('\n\n'),
                        },
            {
                          id: 'ckd-s05-overload-callout',
                          type: 'callout',
                          variant: 'warning',
                          title: 'Watch for fluid overload',
                          body: 'Big weight jumps, worsening swelling, and breathing trouble — especially can\'t lie flat — mean fluid may be reaching the lungs. Report immediately.',
                        }
          ]),
      },
      {
        slug: 's06-causes',
        title: "Causes",
        sortOrder: 5,
        buildContent: () =>
          doc("Causes", [
            { id: 'ckd-s06-heading', type: 'heading', level: 1, text: "Causes" },
            pendingAudio(
                          'ckd-s06-audio',
                          'What Causes Kidney Disease — and What Destabilizes a Kidney Resident?',
                          `${ASSET_BASE}/s06-causes-podcast.mp3`,
                          [
                            'What Causes Kidney Disease — and What Destabilizes a Kidney Resident?',
                            '',
                            'Chronic kidney disease is usually the result of years of damage to the kidneys\' delicate filtering units, and two conditions cause most of it.',
                            '',
                            'The first is diabetes — the leading cause of kidney failure. Years of high blood sugar damage the tiny blood vessels of the kidney filters, scarring them until they fail. The second is high blood pressure — the second leading cause. Years of high pressure pound and damage those same delicate vessels. Together, diabetes and high blood pressure account for the large majority of kidney failure — which is why so many kidney residents also have one or both, and why controlling them protects the kidneys that remain. Other causes include inherited kidney conditions, immune diseases that attack the kidneys, repeated kidney infections, and long-term blockages. And some common pain medications, used heavily over long periods, can harm kidneys — one reason all medications for kidney residents go through the nurse.',
                            '',
                            'For the CNA, the more practical question is what destabilizes a kidney resident day to day — because those destabilizers are where daily care matters.',
                            '',
                            'The biggest is fluid beyond the restriction. Every cup beyond the limit is fluid the kidneys can\'t remove, building toward overload — and it adds up quietly: the extra juice from a kind visitor, the soup that wasn\'t counted, the ice cream that\'s actually liquid. Honest, accurate intake tracking is protection. The second is diet slips — extra salt drives thirst and fluid retention; for many kidney residents, high-potassium foods like bananas, oranges, potatoes, and tomatoes are restricted because failing kidneys can\'t remove potassium, and high potassium can dangerously affect the heart. The third is missed dialysis — skipping a session lets fluid and waste build to dangerous levels; a resident refusing dialysis is reported promptly. Illness, vomiting, and diarrhea also destabilize the balance, and infections — especially of the access site — are serious.',
                            '',
                            'Here\'s what this means for the CNA. You can\'t restore the kidneys, but you stand guard over the destabilizers: honoring the fluid limit with compassion and counting honestly, supporting the kidney diet, encouraging dialysis attendance, protecting the access, and reporting illness early. Daily faithfulness on these is what keeps a kidney resident stable.',
                          ].join('\n'),
                          '/assets/courses/chronic-kidney-disease/s06-causes-podcast.mp3',
                        ),
            {
                          id: 'ckd-s06-image',
                          type: 'image',
                          src: `${ASSET_BASE}/s06-hero.jpg`,
                          caption:
                            'What drives CKD — diabetes, high blood pressure, and the strain on the kidneys.',
                        },
          ]),
      },
      {
        slug: 's07-role',
        title: "CNA Role & Best Practices",
        sortOrder: 6,
        buildContent: () =>
          doc("CNA Role & Best Practices", [
            { id: 'ckd-s07-heading', type: 'heading', level: 1, text: "CNA Role & Best Practices" },
            {
                          id: 'ckd-s07-image',
                          type: 'image',
                          src: `${ASSET_BASE}/s07-hero.jpg`,
                          caption:
                            'CNA scope — protect the access arm, track I&O and weights, report; never give meds.',
                        },
            {
                          id: 'ckd-s07-scope-callout',
                          type: 'callout',
                          variant: 'clinical',
                          title: 'Scope of practice',
                          body: 'CNAs KEEP RESTRICTIONS, TAKE MEASUREMENTS, PROTECT THE ACCESS, and REPORT. CNAs never give or adjust medications, perform dialysis care, or change restrictions.',
                        },
            {
                          id: 'ckd-s07-narration',
                          type: 'text',
                          body: [
                            'Kidney treatment is a system — dialysis, medications, restrictions, and measurements — and the CNA carries the daily half of it without ever touching a dose or a setting. Let\'s walk through it, starting as always with the rule that never bends. A CNA does not give or adjust medications, does not perform dialysis care, and never changes a fluid or diet restriction.',
                            '**Dialysis — and the days between.** For residents in kidney failure, dialysis sessions do the filtering, typically several times a week. Your role surrounds the sessions: support the resident getting to dialysis on schedule, expect and support the deep tiredness many feel afterward — extra rest after dialysis is normal — and report a resident refusing or missing dialysis promptly, because missed sessions let fluid and waste climb dangerously. On the days between sessions, the restrictions and your measurements carry the load.',
                            '**The access site — the absolute rule.** The dialysis access arm carries one of the firmest rules in all of caregiving: no blood pressures on that arm, no needles or blood draws, no tight clothing, bands, or restraints, and nothing pressing on it. Know which arm it is for every dialysis resident. Check the site during care, report bleeding, infection signs, pain, or a weakened buzz immediately. The access is the resident\'s lifeline — treat it that way.',
                            '**Fluid restriction — honored with compassion.** The fluid limit is treatment, and you\'re its daily keeper. Count everything liquid — including soup, ice cream, gelatin, and the water with pills — measure and record intake and output accurately, and never quietly exceed the limit out of kindness, because that kindness becomes fluid on the lungs. Ease thirst within the rules: ice chips if the plan allows them — counted as fluid — sips spaced through the day, mouth swabs, lip balm, and sugar-free hard candy where permitted. Compassion plus honesty.',
                            '**The kidney diet.** Support the prescribed diet — typically low salt, and often limited potassium and phosphorus. Serve the right tray, watch for swaps and gifts of restricted foods, and give the nurse a heads-up about food gifts from visitors. Report poor appetite, since kidney residents often struggle to eat and need their nutrition.',
                            '**Medications and the daily weight.** The nurse manages medications — often including blood pressure medicines, and binders taken with meals that block phosphorus. Your part: report missed doses and side effects, and deliver the cornerstone measurement — the daily weight, same time, same scale, same clothing — because the scale is how the team sees fluid moving. Report rapid gains promptly.',
                            'The scope point for this section: you never give medications, run dialysis, or alter restrictions — but you keep the restrictions faithfully, protect the access absolutely, measure honestly, and report early. That is the treatment, delivered daily.',
                          ].join('\n\n'),
                        },
          ]),
      },
      {
        slug: 's08-prevention',
        title: "Prevention & Risk Reduction",
        sortOrder: 7,
        buildContent: () =>
          doc("Prevention & Risk Reduction", [
            { id: 'ckd-s08-heading', type: 'heading', level: 1, text: "Prevention & Risk Reduction" },
            {
                          id: 'ckd-s08-image',
                          type: 'image',
                          src: `${ASSET_BASE}/s08-hero.jpg`,
                          caption:
                            'Prevention — honoring fluid and diet limits, protecting the fistula, catching overload early.',
                        },
            {
                          id: 'ckd-s08-narration',
                          type: 'text',
                          body: [
                            'With kidney disease, CNAs prevent the buildups and protect the lifeline. Here are seven ways.',
                            '**One. Keep the fluid restriction faithfully — and kindly.** Know each resident\'s daily limit, count everything liquid, space the allowance through the day so they\'re never left with nothing, and never quietly exceed it. Ease thirst within the rules — ice chips where allowed and counted, mouth care, lip balm, swabs. Faithful plus kind is the standard.',
                            '**Two. Weigh daily, the same way every time.** Same time of day, same scale, same amount of clothing. The daily weight is the team\'s window into fluid balance — a fast gain is fluid building. Record it accurately and report rapid changes promptly. Never skip it or estimate it.',
                            '**Three. Measure intake and output honestly.** Record everything in and everything out, accurately — including the easy-to-miss liquids. Honest numbers let the team act before overload; fudged or forgotten numbers blind them. Your clipboard genuinely protects the resident.',
                            '**Four. Protect the access arm absolutely.** Know which arm holds the access for every dialysis resident. No blood pressures, no needles, nothing tight on it — and position the resident so they don\'t lie on it. Check the site during care and report bleeding, redness, pain, or a weakening buzz immediately. Guard the lifeline.',
                            '**Five. Support the kidney diet and the appetite.** Serve the correct low-salt, kidney-friendly tray, watch for restricted-food gifts and swaps, and flag visitor treats to the nurse. At the same time, encourage eating — kidney residents often have poor appetites and need their nutrition. Report meals barely touched.',
                            '**Six. Support dialysis days.** Help the resident be ready and on time for dialysis, support the post-dialysis tiredness with rest, and watch them a little closer on dialysis days — some feel weak, dizzy, or washed out afterward. Report refusals or missed sessions promptly, and any unusual symptoms after treatment.',
                            '**Seven. Watch closely during illness.** Vomiting, diarrhea, fever, and infections can throw the fluid and chemical balance dangerously off, and infection can threaten the access. Report illness in a kidney resident promptly — sick days are never routine here — and be extra watchful for overload and buildup signs while they\'re unwell.',
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
        title: "Scenario & Reporting",
        sortOrder: 8,
        buildContent: () =>
          doc("Scenario & Reporting", [
            { id: 'ckd-s09-heading', type: 'heading', level: 1, text: "Scenario & Reporting" },
            pendingAudio(
                          'ckd-s09-intro-audio',
                          'Emergency response scenarios intro',
                          `${ASSET_BASE}/s09-emergency-intro.mp3`,
                          'With kidney disease, the judgments that matter most are recognizing fluid overload before it reaches the lungs, and protecting the dialysis access without exception. You\'re about to work through two situations. Read each carefully, choose your action, and you\'ll get feedback right away. Keep the core ideas in mind: the scale and the breathing tell the fluid story — and the access arm never gets a blood pressure, a needle, or anything tight.',
                          '/assets/courses/chronic-kidney-disease/s09-emergency-intro.mp3',
                        ),
            {
                          id: 'ckd-s09-image',
                          type: 'image',
                          src: `${ASSET_BASE}/s09-hero.jpg`,
                          caption:
                            'Two CKD judgments — a protected dialysis arm, and the signs of dangerous fluid overload.',
                        },
            {
                          id: 'ckd-s09-scenario-okafor-image',
                          type: 'image',
                          src: `${ASSET_BASE}/s09-scenario-okafor.jpg`,
                          caption:
                            'Sudden weight gain, swelling, breathlessness: report fluid overload promptly.',
                        },
            {
                          id: 'ckd-s09-scenario-okafor',
                          type: 'scenario_question',
                          prompt:
                            'Mrs. Okafor is on dialysis, with her next session scheduled for tomorrow. This morning her daily weight is up four pounds since yesterday — a big jump. Her ankles are more swollen than usual, and this afternoon she tells you she can\'t catch her breath when she walks to the bathroom, and last night she had to sleep sitting up in her recliner because she "couldn\'t breathe lying down." What SHOULD the CNA do?',
                          options: [
                            {
                              id: 'wait-dialysis',
                              label: 'Note it in the chart and wait for tomorrow\'s dialysis to fix it',
                              feedback:
                                'A big overnight weight jump plus worsening swelling plus breathing trouble — especially being unable to lie flat — means fluid overload is reaching her lungs. Waiting for tomorrow\'s dialysis, adding fluid, or lying her flat could turn dangerous fast. The right action: report it to the nurse immediately, keep her upright and calm, and watch her closely.',
                            },
                            {
                              id: 'report-promptly',
                              label:
                                'Report the weight jump, swelling, and breathing trouble to the nurse immediately',
                              feedback:
                                'Exactly right. A four-pound overnight weight gain, worsening swelling, shortness of breath with activity, and needing to sleep sitting up are the picture of fluid overload — and the breathing signs mean fluid is pressing on her lungs. This cannot wait for tomorrow\'s dialysis: the team needs to know now, because she may need urgent treatment, and severe breathing distress is an emergency. Never encourage extra fluid — her kidneys can\'t remove it; more fluid makes it worse. And lying flat makes lung fluid harder to breathe against, which is exactly why she slept sitting up. Report immediately, keep her upright and calm, and stay watchful.',
                              isRecommended: true,
                            },
                            {
                              id: 'encourage-fluid',
                              label: 'Encourage her to drink more water to flush the kidneys',
                              feedback:
                                'A big overnight weight jump plus worsening swelling plus breathing trouble — especially being unable to lie flat — means fluid overload is reaching her lungs. Waiting for tomorrow\'s dialysis, adding fluid, or lying her flat could turn dangerous fast. The right action: report it to the nurse immediately, keep her upright and calm, and watch her closely.',
                            },
                            {
                              id: 'lie-flat',
                              label: 'Have her lie flat and rest until she feels better',
                              feedback:
                                'A big overnight weight jump plus worsening swelling plus breathing trouble — especially being unable to lie flat — means fluid overload is reaching her lungs. Waiting for tomorrow\'s dialysis, adding fluid, or lying her flat could turn dangerous fast. The right action: report it to the nurse immediately, keep her upright and calm, and watch her closely.',
                            },
                          ],
                          requiredForCompletion: true,
                        },
            {
                          id: 'ckd-s09-scenario-diallo-image',
                          type: 'image',
                          src: `${ASSET_BASE}/s09-scenario-diallo.jpg`,
                          caption:
                            'Never take BP or draw blood from the access arm — protect the fistula; use the other arm.',
                        },
            {
                          id: 'ckd-s09-scenario-diallo',
                          type: 'scenario_question',
                          prompt:
                            'You\'re assisting with routine vital signs. Mr. Diallo is a dialysis resident with a fistula in his left forearm. A newer aide, not knowing his history, wraps the blood pressure cuff around his left arm and is about to inflate it. Mr. Diallo is chatting and hasn\'t noticed. What SHOULD the CNA do?',
                          options: [
                            {
                              id: 'let-it-go',
                              label: 'Let it go this once — one blood pressure won\'t matter',
                              feedback:
                                'A blood pressure cuff on the access arm — even once, even at the wrist — can damage or clot the fistula, cutting off the resident\'s lifeline to dialysis. There is no "just this once" with an access arm. The right action: stop the aide immediately, move the cuff to the other arm, and make sure the access arm is clearly known and the rule understood.',
                            },
                            {
                              id: 'stop-aide',
                              label:
                                'Stop the aide immediately, move the cuff to the other arm, and make sure the access arm is clearly known',
                              feedback:
                                'Right. The dialysis access arm never gets a blood pressure — not once, not quickly, not at the wrist. Inflating a cuff on that arm squeezes the fistula and can damage it or cause it to clot off — and a clotted access means the resident can\'t get dialysis until it\'s surgically fixed or replaced. It is their lifeline. Stop the aide immediately and kindly, move the cuff to the other arm, and then close the loop: make sure the access arm is clearly flagged — per your facility\'s system — and that the newer aide understands the rule: no blood pressures, no needles, nothing tight on that arm, ever. Protecting the access is protecting the resident\'s life-sustaining treatment.',
                              isRecommended: true,
                            },
                            {
                              id: 'inflate-quickly',
                              label: 'Inflate it quickly to get it over with',
                              feedback:
                                'A blood pressure cuff on the access arm — even once, even at the wrist — can damage or clot the fistula, cutting off the resident\'s lifeline to dialysis. There is no "just this once" with an access arm. The right action: stop the aide immediately, move the cuff to the other arm, and make sure the access arm is clearly known and the rule understood.',
                            },
                            {
                              id: 'wrist-pressure',
                              label: 'Take the blood pressure on the left wrist instead',
                              feedback:
                                'A blood pressure cuff on the access arm — even once, even at the wrist — can damage or clot the fistula, cutting off the resident\'s lifeline to dialysis. There is no "just this once" with an access arm. The right action: stop the aide immediately, move the cuff to the other arm, and make sure the access arm is clearly known and the rule understood.',
                            },
                          ],
                          requiredForCompletion: true,
                        },
          ]),
      },
      {
        slug: 's10-cna-role',
        title: "CNA's Role in Care",
        sortOrder: 9,
        buildContent: () =>
          doc("CNA's Role in Care", [
            { id: 'ckd-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
                          id: 'ckd-s10-narration',
                          type: 'text',
                          body: [
                            'Your role in kidney care is keeping the restrictions, taking the measurements, protecting the access, and reporting early. Let\'s walk through it.',
                            '**Keep the restrictions, with compassion** You are the daily keeper of the restrictions that protect the resident. Honor the fluid limit — count everything liquid, space it through the day, and ease thirst within the rules with mouth care, allowed ice chips, and kindness. Serve and protect the kidney diet. And hold the line gently when it\'s hard — because the extra cup a thirsty resident begs for becomes, in kidney failure, fluid their body cannot remove. Faithful and kind, together.',
                            '**Take the measurements that steer the care** Your measurements steer the team. The daily weight — same time, same scale, same clothing — is the window into fluid balance. Intake and output, recorded honestly and completely. These numbers are how the nurse and doctor see fluid moving before it becomes overload. Take them religiously, record them accurately, and report rapid weight gains promptly.',
                            '**Protect the access and watch the resident** Guard the lifeline: know which arm, allow no blood pressures, no needles, nothing tight, and check the site — reporting bleeding, infection signs, pain, or a weakening buzz immediately. And watch the whole resident: swelling, breathing changes, can\'t-lie-flat nights, deepening fatigue, nausea, itching, fogginess. Support dialysis days and the tiredness that follows.',
                            '**Report early, report honestly** Report the things that keep a kidney resident out of the hospital: rapid weight gain, new or worsening swelling, any breathing trouble, worsening confusion, access concerns, missed or refused dialysis, barely-touched meals, restricted-food gifts, and illness of any kind. Early, honest reports let the team act while problems are still small.',
                            'Now the boundary. You do not diagnose kidney disease. You never give or adjust medications, never perform dialysis or touch its settings, and never change a fluid or diet restriction — and you never take a blood pressure or allow a needle on the access arm.',
                            'Inside your role — restrictions kept, measurements taken, access protected, reports made early — you deliver the daily half of kidney treatment. The machine filters the blood a few times a week; you protect the resident every day in between.',
                          ].join('\n\n'),
                        },
            {
                          id: 'ckd-s10-scope-callout',
                          type: 'callout',
                          variant: 'clinical',
                          title: 'Stay within scope',
                          body: 'You do not diagnose kidney disease. You never give or adjust medications, never perform dialysis or touch its settings, and never change a fluid or diet restriction — and you never take a blood pressure or allow a needle on the access arm.',
                        },
            {
                          id: 'ckd-s10-video',
                          type: 'video',
                          title: "CNA's Role in Care",
                          videoUrl: `${ASSET_BASE}/s10-cna-role.mp4`,
                          placeholderNote: `Pending upload: ${ASSET_BASE}/s10-cna-role.mp4`,
                        },
            {
                          id: 'ckd-s10-image',
                          type: 'image',
                          src: `${ASSET_BASE}/s10-hero.jpg`,
                          caption:
                            "The CNA as the daily monitor — every weight and intake number guides the resident's care.",
                        },
          ]),
      },
      {
        slug: 's11-case-study',
        title: "Case Study",
        sortOrder: 10,
        buildContent: () => {
          const caseNarrative = [
            'Mrs. Okafor, 79, had kidney failure from years of diabetes and attended dialysis three times a week. Her CNA, Amara, had cared for her for months and ran her kidney care like clockwork: fluid limit counted honestly, kidney tray protected, access arm guarded, and the daily weight — same time, same scale, same robe — every single morning.',
            '',
            '**The routine that built the baseline:** Amara\'s consistency had a quiet purpose: it made the numbers trustworthy. Because Mrs. Okafor was weighed the same way every day, a change on the scale meant something real. Amara also knew her patterns — she typically gained a pound or two between dialysis sessions, which the treatments removed.',
            '',
            '**The morning the scale spoke:** One morning — the day before her next dialysis — the scale read four pounds up from yesterday. Far beyond her usual drift. Amara double-checked: same scale, same robe, no mistake. Looking closer, she saw Mrs. Okafor\'s ankles were puffier than usual, and her rings were tight. Mrs. Okafor waved it off: "I\'m fine, just slow today." But when Amara asked about her night, she admitted she\'d slept in her recliner because lying flat made her feel like she "couldn\'t get air."',
            '',
            '**What Amara did:** Amara connected the picture immediately — a big fluid gain, worsening swelling, and breathing trouble lying flat meant fluid was building toward her lungs, and tomorrow\'s dialysis was too far away to wait. She kept Mrs. Okafor comfortable and upright, and reported to the nurse at once, with the numbers: "Mrs. Okafor is up four pounds since yesterday morning, same scale and clothing. Ankles more swollen, rings tight, and she slept sitting up because she couldn\'t breathe lying down. I think fluid\'s getting ahead of her."',
            '',
            '**The response:** The nurse assessed her immediately and contacted the doctor and the dialysis center. Mrs. Okafor was gotten into dialysis urgently that day rather than waiting for tomorrow\'s scheduled session, and the extra fluid was removed before it could press harder on her lungs. The team also reviewed her fluid intake and found a contributor: well-meaning family visits had included daily large milkshakes nobody had counted. The intake plan and family education were corrected.',
            '',
            '**The outcome:** Mrs. Okafor avoided what could have become a fluid-overload emergency and a hospital admission. The nurse credited two things: the report and the routine behind it. "Your numbers were trustworthy because you weigh her the same way every day. When your scale says four pounds, we move. And you didn\'t just report a number — you reported the swelling and the recliner sleeping with it. That\'s the whole picture."',
            '',
            '**Discussion:** Amara\'s save began long before the emergency — in the boring, faithful consistency of the daily weight, the honest counting, the baseline-building routine that made a four-pound jump unmistakable. Then she did what kidney care demands: she connected the scale, the swelling, and the breathing into one picture, refused to wait for the scheduled session, and reported immediately with specifics. She never adjusted anything herself, never exceeded her role — she measured, recognized, and reported. The dialysis machine removed the fluid; Amara\'s clockwork care is what got it there in time.',
          ].join('\n');

          return doc('Case Study', [
            { id: 'ckd-s11-heading', type: 'heading', level: 1, text: "Case Study" },
            pendingAudio(
                          'ckd-s11-audio',
                          'The Four Pounds That Spoke',
                          `${ASSET_BASE}/s11-case-podcast.mp3`,
                          caseNarrative,
                          '/assets/courses/chronic-kidney-disease/s11-case-podcast.mp3',
                        ),
            {
                          id: 'ckd-s11-image',
                          type: 'image',
                          src: `${ASSET_BASE}/s11-hero.jpg`,
                          caption:
                            'Recognizing the pattern — how careful monitoring caught fluid overload in time.',
                        },
            {
                          id: 'ckd-s11-case-study',
                          type: 'case_study',
                          title: 'The Four Pounds That Spoke',
                          residentProfile:
                            'Mrs. Okafor, 79, had kidney failure from years of diabetes and attended dialysis three times a week. Her CNA, Amara, had cared for her for months and ran her kidney care like clockwork: fluid limit counted honestly, kidney tray protected, access arm guarded, and the daily weight — same time, same scale, same robe — every single morning.',
                          scenario: [
                            '**The routine that built the baseline:** Amara\'s consistency had a quiet purpose: it made the numbers trustworthy. Because Mrs. Okafor was weighed the same way every day, a change on the scale meant something real. Amara also knew her patterns — she typically gained a pound or two between dialysis sessions, which the treatments removed.',
                            '**The morning the scale spoke:** One morning — the day before her next dialysis — the scale read four pounds up from yesterday. Far beyond her usual drift. Amara double-checked: same scale, same robe, no mistake. Looking closer, she saw Mrs. Okafor\'s ankles were puffier than usual, and her rings were tight. Mrs. Okafor waved it off: "I\'m fine, just slow today." But when Amara asked about her night, she admitted she\'d slept in her recliner because lying flat made her feel like she "couldn\'t get air."',
                            '**What Amara did:** Amara connected the picture immediately — a big fluid gain, worsening swelling, and breathing trouble lying flat meant fluid was building toward her lungs, and tomorrow\'s dialysis was too far away to wait. She kept Mrs. Okafor comfortable and upright, and reported to the nurse at once, with the numbers: "Mrs. Okafor is up four pounds since yesterday morning, same scale and clothing. Ankles more swollen, rings tight, and she slept sitting up because she couldn\'t breathe lying down. I think fluid\'s getting ahead of her."',
                            '**The response:** The nurse assessed her immediately and contacted the doctor and the dialysis center. Mrs. Okafor was gotten into dialysis urgently that day rather than waiting for tomorrow\'s scheduled session, and the extra fluid was removed before it could press harder on her lungs. The team also reviewed her fluid intake and found a contributor: well-meaning family visits had included daily large milkshakes nobody had counted. The intake plan and family education were corrected.',
                            '**The outcome:** Mrs. Okafor avoided what could have become a fluid-overload emergency and a hospital admission. The nurse credited two things: the report and the routine behind it. "Your numbers were trustworthy because you weigh her the same way every day. When your scale says four pounds, we move. And you didn\'t just report a number — you reported the swelling and the recliner sleeping with it. That\'s the whole picture."',
                            '**Discussion:** Amara\'s save began long before the emergency — in the boring, faithful consistency of the daily weight, the honest counting, the baseline-building routine that made a four-pound jump unmistakable. Then she did what kidney care demands: she connected the scale, the swelling, and the breathing into one picture, refused to wait for the scheduled session, and reported immediately with specifics. She never adjusted anything herself, never exceeded her role — she measured, recognized, and reported. The dialysis machine removed the fluid; Amara\'s clockwork care is what got it there in time.',
                          ].join('\n\n'),
                        },
            {
                          id: 'ckd-s11-reflection-1',
                          type: 'reflection',
                          prompt:
                            'Amara weighed Mrs. Okafor the same time, same scale, same clothing every day. How did that boring consistency make the four-pound jump meaningful — and the report powerful?',
                          minCharacters: 50,
                        },
            {
                          id: 'ckd-s11-reflection-2',
                          type: 'reflection',
                          prompt:
                            'Mrs. Okafor said she was "fine," and dialysis was already scheduled for the next day. Why was waiting not acceptable, and what three findings together told Amara fluid was reaching her lungs?',
                          minCharacters: 50,
                        },
            {
                          id: 'ckd-s11-rp-text',
                          type: 'text',
                          body: 'Reflect on the case study in the previous lesson. Your written responses help you apply what you learned about consistent daily weights, recognizing fluid overload, and honoring restrictions with compassion.',
                        },
            {
                          id: 'ckd-s11-kc2-check',
                          type: 'knowledge_check',
                          question:
                            'A CNA does not give or adjust medications, does not perform dialysis care, and never changes a fluid or diet restriction. When a resident with kidney failure asks for extra water beyond their fluid limit, the CNA SHOULD:',
                          options: [
                            {
                              id: 'give-extra-water',
                              label: 'Give extra water as the resident requests',
                            },
                            {
                              id: 'report-nurse',
                              label: 'Report the concern to the nurse and let the nurse decide',
                            },
                            {
                              id: 'perform-dialysis',
                              label: 'Perform dialysis care on your own to remove the extra fluid',
                            },
                            {
                              id: 'change-restriction',
                              label: 'Change the fluid restriction based on the resident\'s thirst',
                            },
                          ],
                          correctOptionId: 'report-nurse',
                          explanation:
                            'You never give or adjust medications, perform dialysis care, or change a fluid or diet restriction — but your reporting of thirst, fluid concerns, missed doses, and overload signs supports every treatment the team provides.',
                          requiredForCompletion: true,
                          meta: { flaggedFiller: true },
                        },
          ]);
        },
      },
      {
        slug: 's12-conclusion',
        title: "Conclusion",
        sortOrder: 11,
        buildContent: () =>
          doc("Conclusion", [
            { id: 'ckd-s12-heading', type: 'heading', level: 1, text: "Conclusion" },
            {
                          id: 'ckd-s12-video',
                          type: 'video',
                          title: 'Conclusion',
                          videoUrl: `${ASSET_BASE}/s12-conclusion.mp4`,
                          placeholderNote: `Pending upload: ${ASSET_BASE}/s12-conclusion.mp4`,
                        },
            {
                          id: 'ckd-s12-image',
                          type: 'image',
                          src: `${ASSET_BASE}/s12-hero.jpg`,
                          caption: 'Five things that matter most in chronic kidney disease care.',
                        },
            {
                          id: 'ckd-s12-narration',
                          type: 'text',
                          body: [
                            'You\'ve reached the end. Let\'s lock in the five things that matter most for kidney care.',
                            '**One.** The kidneys are the body\'s filters — and in chronic kidney disease, the filters are permanently failing, so waste and fluid build up. Most kidney failure comes from diabetes and high blood pressure, and once function is lost, it doesn\'t return. Managed well, though, residents live meaningful lives.',
                            '**Two.** The restrictions ARE the treatment. Fluid a failing kidney can\'t remove stays and builds — toward the lungs. So honor the fluid limit faithfully and kindly, count everything liquid, support the kidney diet, and never quietly bend the rules out of sympathy. Ease thirst within the rules instead.',
                            '**Three.** Measure like it matters — because it does. The daily weight, same time, same scale, same clothing, is the team\'s window into fluid balance. Intake and output, honest and complete. A rapid weight gain is fluid speaking — report it promptly.',
                            '**Four.** Protect the access arm absolutely, and know the urgent signs. No blood pressures, no needles, nothing tight on the access arm — ever. Report bleeding, infection signs, or a weakening buzz immediately. And report fluid overload early: big weight jumps, worsening swelling, and especially breathing trouble or can\'t-lie-flat nights — that\'s fluid reaching the lungs.',
                            '**Five.** Honor your scope. You never diagnose, give medications, run dialysis, or change restrictions. But you keep the restrictions, take the measurements, guard the access, support dialysis days, and report early — delivering the daily half of kidney treatment, every day between the machines.',
                          ].join('\n\n'),
                        },
            {
                          id: 'ckd-s12-summary',
                          type: 'summary',
                          title: 'Five things that matter most',
                          items: [
                            'The kidneys are the body\'s filters — in CKD, waste and fluid build up permanently.',
                            'The restrictions ARE the treatment — honor fluid and diet limits faithfully and kindly.',
                            'Measure like it matters — daily weight and honest I&O show fluid building early.',
                            'Protect the access arm absolutely — no BPs, no needles, nothing tight, ever.',
                            'Honor your scope — keep restrictions, take measurements, guard the access, report early.',
                          ],
                        },
            {
                          id: 'ckd-s12-whn-text',
                          type: 'text',
                          body: 'Ten questions are waiting. Everything on them was covered here. You\'re ready. Trust what you\'ve learned, and show what you know.',
                        },
            {
                          id: 'ckd-s12-cr-text',
                          type: 'text',
                          body: 'This course provides one hour of continuing education credit through CAL ACE Nursing Academy, an approved CDPH continuing education provider, NAC number 7384. Your certificate is generated automatically when you pass the knowledge check.',
                        },
            {
                          id: 'ckd-s12-cr-callout',
                          type: 'callout',
                          variant: 'info',
                          title: 'Scope reminder',
                          body: 'CNAs keep restrictions, take measurements, and protect the access. CNAs do not diagnose kidney disease, give or adjust medications, perform dialysis care, or change restrictions.',
                        },
            {
                          id: 'ckd-s12-ca-text',
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

export async function seedCourse32ChronicKidneyDisease(
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
  console.log(`Seeding Course 32 (Chronic Kidney Disease) as DRAFT — slug "${COURSE_SLUG}"…`);

  try {
    const result = await seedCourse32ChronicKidneyDisease(prisma);
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
