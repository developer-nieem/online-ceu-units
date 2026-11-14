/**
 * Seed Course 37 — Caring for a Resident with an Ostomy (DRAFT).
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-37-ostomy-care
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
const COURSE_SLUG = 'ostomy-care';
const COURSE_TITLE = 'Ostomy Support: Skin Care, Privacy, and Reporting';
const COURSE_SUMMARY =
  'Learn the CNA\'s role in supporting a resident with an ostomy — understanding what a stoma is, assisting with pouch emptying and peristomal skin care within facility policy and training, reading the healthy versus troubled stoma, protecting dignity and supporting emotional adjustment, and reporting complications. CNAs do not create or change the ostomy plan, do not irrigate ostomies, do not perform procedures beyond training and policy, and do not diagnose stoma problems.';

const ASSET_BASE = `/assets/courses/ostomy-care`;


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
    'Explain what an ostomy and stoma are',
    'Assist with pouch and skin care within your role',
    'Recognize a healthy versus troubled stoma',
    'Support dignity and emotional adjustment',
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
  heroImage: '/assets/courses/ostomy-care/hero-banner.png',
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
    title: 'Understanding Ostomy Care',
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: 'Introduction',
        sortOrder: 0,
        buildContent: () =>
          doc('Welcome', [
            { id: 'oc-s01-heading', type: 'heading', level: 1, text: 'Welcome' },
            {
              id: 'oc-s01-video',
              type: 'video',
              title: 'Introduction',
              videoUrl: `${ASSET_BASE}/s01-intro.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s01-intro.mp4`,
            },
            {
              id: 'oc-s01-image',
              type: 'image',
              src: `${ASSET_BASE}/s01-hero.jpg`,
              caption:
                'Ostomy care — supporting a resident living with a stoma, and protecting the skin around it.',
            },
            {
              id: 'oc-s01-narration',
              type: 'text',
              body: [
                'Welcome to CAL ACE Nursing Academy.',
                'This course is about caring for a resident with an ostomy — a surgically created opening that changes how the body eliminates waste, and a form of care where skill and sensitivity matter in equal measure.',
                'An ostomy is created when disease or injury — often cancer, severe bowel disease, or trauma — makes the normal path for waste unusable. Surgeons bring a piece of the intestine, or the urinary system, through the wall of the abdomen, creating a small opening called a stoma. Waste then leaves the body through the stoma and collects in a pouch worn over it. The most common types: a colostomy, from the large intestine. An ileostomy, from the small intestine. And a urostomy, for urine.',
                'Here\'s the first thing to understand: an ostomy is life-saving surgery, and people live full, active, long lives with one. The stoma itself is healthy tissue — moist and red or pink, like the inside of the cheek — and it has no nerve endings, so it doesn\'t hurt. But the ostomy changes something deeply personal: how a person\'s body handles its most private function. Many residents carry grief, embarrassment, or shame about their ostomy. Some can\'t bear to look at it. The CNA\'s matter-of-fact warmth, total absence of disgust, and steady respect are as important as any technical skill in this course.',
                'The practical care centers on three things. The pouch — emptying it as your training and facility policy direct, before it gets too full, and assisting with appliance care within your role. The skin — because the skin around the stoma, called peristomal skin, is constantly threatened by leaking waste, and protecting the seal and that skin is a daily priority. And the watch — reading the stoma and its output, because changes in color, output, or the skin tell the team when something\'s wrong, including the rare emergencies.',
                'One scope note up front, because facilities differ: exactly which ostomy tasks a CNA performs — emptying versus changing appliances — depends on your facility\'s policy and your training. This course teaches the principles; your facility\'s policy and the nurse\'s direction define your tasks. When in doubt, ask before acting.',
                'Your scope is clear. A CNA assists with ostomy care within training and facility policy, protects the peristomal skin, observes the stoma and output, supports dignity and adjustment, and reports faithfully. A CNA does not create or change the care plan, does not irrigate an ostomy, does not perform procedures beyond training and policy, and does not diagnose stoma problems.',
                'By the end of this course, you will be able to: explain what an ostomy and stoma are. Assist with pouch and skin care within your role. Recognize a healthy versus troubled stoma. Support dignity and emotional adjustment. And know your scope.',
                'There is a ten-question knowledge check at the end. Everything on it is covered here. Let\'s begin.',
              ].join('\n\n'),
            },
            {
              id: 'oc-s01-ci-text',
              type: 'text',
              body: [
                'This course teaches the CNA\'s role in supporting a resident with an ostomy — understanding what a stoma is, assisting with pouch emptying and peristomal skin care within facility policy and training, reading the healthy versus troubled stoma, protecting dignity and supporting emotional adjustment, and reporting complications.',
                'Let\'s be clear about your role. A CNA assists with ostomy care within training and facility policy, protects the peristomal skin, observes the stoma and output, supports dignity and adjustment, and reports faithfully. A CNA does not create or change the care plan, does not irrigate an ostomy, does not perform procedures beyond training and policy, and does not diagnose stoma problems. Those are nursing and physician tasks. But none of them can happen without your careful observation and faithful reporting first.',
              ].join('\n\n'),
            },
            {
              id: 'oc-s01-ci-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of this course',
              body: 'CNAs ASSIST WITHIN POLICY, PROTECT SKIN, WATCH, and REPORT. CNAs do not create or change the ostomy plan, irrigate ostomies, exceed training and policy, or diagnose stoma problems.',
            },
            {
              id: 'oc-s01-lo-text',
              type: 'text',
              body: 'By the end of this course, you will be able to:',
            },
            {
              id: 'oc-s01-lo-summary',
              type: 'summary',
              title: 'Learning objectives',
              items: [
                'Explain what an ostomy and stoma are.',
                'Assist with pouch and skin care within your role.',
                'Recognize a healthy versus troubled stoma.',
                'Support dignity and emotional adjustment.',
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
            { id: 'oc-s02-heading', type: 'heading', level: 1, text: 'Key terms' },
            {
              id: 'oc-s02-image',
              type: 'image',
              src: `${ASSET_BASE}/s02-hero.jpg`,
              caption:
                'Key terms — stoma, colostomy, ileostomy, pouch/appliance, peristomal skin.',
            },
            {
              id: 'oc-s02-reveal-ostomy',
              type: 'reveal_card',
              frontTitle: 'Ostomy',
              frontBody: 'OSS-toh-mee',
              backTitle: 'Ostomy',
              backBody:
                'A surgically created opening that lets body waste leave through the wall of the abdomen instead of the normal route — created when disease or injury makes the normal path unusable. People live full, active lives with ostomies.',
            },
            {
              id: 'oc-s02-reveal-stoma',
              type: 'reveal_card',
              frontTitle: 'Stoma',
              frontBody: 'STOH-mah',
              backTitle: 'Stoma',
              backBody:
                'The actual opening on the abdomen — the end of the intestine or urinary passage brought through the skin. A healthy stoma is moist, and red or pink like the inside of the cheek. It has no nerve endings, so it doesn\'t feel pain — but it can bleed slightly if rubbed, which is normal.',
            },
            {
              id: 'oc-s02-reveal-colostomy',
              type: 'reveal_card',
              frontTitle: 'Colostomy',
              frontBody: 'Koh-LOSS-toh-mee',
              backTitle: 'Colostomy',
              backBody:
                'An ostomy made from the large intestine, the colon. Output is stool — and depending on where in the colon it\'s placed, the stool may be quite formed or softer. The most common type of ostomy you\'ll see.',
            },
            {
              id: 'oc-s02-reveal-ileostomy',
              type: 'reveal_card',
              frontTitle: 'Ileostomy',
              frontBody: 'Il-ee-OSS-toh-mee',
              backTitle: 'Ileostomy',
              backBody:
                'An ostomy made from the small intestine. Output is liquid to pasty, flows more continuously, and is rich in digestive juices that are harsh on skin — so skin protection matters even more. Ileostomy residents also lose more fluid, so dehydration is a special watch.',
            },
            {
              id: 'oc-s02-reveal-urostomy',
              type: 'reveal_card',
              frontTitle: 'Urostomy',
              frontBody: 'Yoor-OSS-toh-mee',
              backTitle: 'Urostomy',
              backBody:
                'An ostomy that diverts urine through the abdominal wall, used when the bladder is removed or can\'t be used. The pouch collects urine continuously and has a spout for draining — and like all urine systems, infection signs are the watch.',
            },
            {
              id: 'oc-s02-reveal-pouch',
              type: 'reveal_card',
              frontTitle: 'Pouch (Appliance)',
              frontBody: 'Pouch / appliance',
              backTitle: 'Pouch (Appliance)',
              backBody:
                'The bag system worn over the stoma to collect waste. It includes a skin barrier — the adhesive base that seals to the skin around the stoma — and the pouch itself. A good seal protects the skin; a leaking seal damages it.',
            },
            {
              id: 'oc-s02-reveal-peristomal',
              type: 'reveal_card',
              frontTitle: 'Peristomal Skin',
              frontBody: 'Pair-ih-STOH-mal',
              backTitle: 'Peristomal Skin',
              backBody:
                'The skin immediately around the stoma, under and beyond the skin barrier. Healthy peristomal skin looks like the skin elsewhere on the belly. Leaking output burns and breaks it down — protecting this skin is a daily priority of ostomy care.',
            },
            {
              id: 'oc-s02-reveal-emergencies',
              type: 'reveal_card',
              frontTitle: 'Stoma Emergencies (Color Change & Blockage)',
              frontBody: 'Stoma emergencies',
              backTitle: 'Stoma Emergencies (Color Change & Blockage)',
              backBody:
                'Two to know. A stoma turning dark — purple, gray, or black — can mean its blood supply is failing: urgent. And for bowel ostomies, output stopping with cramping pain, bloating, and nausea can mean a blockage: urgent. Both are reported immediately.',
            },
            {
              id: 'oc-s02-kc1-check-stoma',
              type: 'knowledge_check',
              question:
                'Match the term: the opening — healthy when moist and red/pink, feels no pain',
              options: [
                { id: 'stoma', label: 'Stoma' },
                { id: 'peristomal-skin', label: 'Peristomal skin' },
                { id: 'ileostomy', label: 'Ileostomy' },
              ],
              correctOptionId: 'stoma',
              explanation:
                'Stoma. The actual opening on the abdomen — moist and red or pink like the inside of the cheek. It has no nerve endings, so it doesn\'t feel pain.',
              requiredForCompletion: true,
            },
            {
              id: 'oc-s02-kc1-check-peristomal',
              type: 'knowledge_check',
              question:
                'Match the term: the skin around the stoma that leaking output damages',
              options: [
                { id: 'stoma', label: 'Stoma' },
                { id: 'peristomal-skin', label: 'Peristomal skin' },
                { id: 'ileostomy', label: 'Ileostomy' },
              ],
              correctOptionId: 'peristomal-skin',
              explanation:
                'Peristomal skin. The skin immediately around the stoma, under and beyond the skin barrier. Leaking output burns and breaks it down — protecting this skin is a daily priority.',
              requiredForCompletion: true,
            },
            {
              id: 'oc-s02-kc1-check-ileostomy',
              type: 'knowledge_check',
              question:
                'Match the term: small-intestine ostomy with liquid, skin-harsh output and dehydration risk',
              options: [
                { id: 'stoma', label: 'Stoma' },
                { id: 'peristomal-skin', label: 'Peristomal skin' },
                { id: 'ileostomy', label: 'Ileostomy' },
              ],
              correctOptionId: 'ileostomy',
              explanation:
                'Ileostomy. An ostomy made from the small intestine. Output is liquid to pasty, flows more continuously, and is rich in digestive juices that are harsh on skin. Ileostomy residents also lose more fluid, so dehydration is a special watch.',
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
            { id: 'oc-s03-heading', type: 'heading', level: 1, text: 'Statistics' },
            pendingAudio(
              'oc-s03-audio',
              'Ostomies: Life-Saving Surgery, Daily Care, and the Dignity That Goes With It',
              `${ASSET_BASE}/s03-stats-podcast.mp3`,
              [
                'Ostomies: Life-Saving Surgery, Daily Care, and the Dignity That Goes With It',
                '',
                'Somewhere between three-quarters of a million and a million people in the United States live with an ostomy, and roughly a hundred thousand new ostomy surgeries are performed each year — most commonly for colorectal cancer, bladder cancer, severe inflammatory bowel disease like Crohn\'s disease and ulcerative colitis, diverticular disease, and trauma. Many ostomy patients are older adults, so residents with colostomies, ileostomies, and urostomies are a regular part of long-term care.',
                '',
                'The first message of the numbers is positive: an ostomy is life-saving surgery, and people live full, long, active lives with one — working, traveling, swimming, exercising. The stoma itself is healthy tissue doing its job. An ostomy is something a person lives well with, not something they suffer from — provided the care around it is good.',
                '',
                'That\'s where the challenges come in, and they\'re two-fold. The first is skin. Studies consistently find that peristomal skin complications — irritation, breakdown, and damage to the skin around the stoma — affect a large share of ostomy patients, with many studies citing well over a third, and some much higher. The overwhelming cause is leakage: output seeping under the skin barrier and sitting against the skin. Ileostomy output is especially harsh, rich in digestive enzymes that can burn skin within hours. Skin complications are painful, they undermine the next pouch\'s seal — creating a vicious cycle of more leaks and more damage — and they\'re largely preventable with a well-fitted appliance, prompt emptying, and early attention to leaks.',
                '',
                'The second challenge is emotional. Research on ostomy patients documents high rates of body-image distress, embarrassment, anxiety about leaks and odor, and social withdrawal — especially early after surgery, and especially in older adults. How caregivers behave during pouch care — matter-of-fact and warm, or visibly uncomfortable — measurably affects adjustment. A caregiver who flinches teaches shame; a caregiver who treats ostomy care as completely routine teaches normalcy.',
                '',
                'The bottom line for the CNA: ostomy residents are common, their stomas are healthy life-savers, their biggest physical risk is preventable skin damage from leaks, and their biggest emotional risk is shame — and the CNA\'s skilled, prompt, utterly respectful daily care is the main protection against both.',
              ].join('\n'),
              '/assets/courses/ostomy-care/s03-stats-podcast.mp3',
            ),
            {
              id: 'oc-s03-image',
              type: 'image',
              src: `${ASSET_BASE}/s03-hero.jpg`,
              caption:
                'Ostomies are more common than people think — good daily care keeps residents healthy and confident.',
            },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: 'Fundamentals',
        sortOrder: 3,
        buildContent: () =>
          doc('Fundamentals', [
            { id: 'oc-s04-heading', type: 'heading', level: 1, text: 'Fundamentals' },
            {
              id: 'oc-s04-narration',
              type: 'text',
              body: [
                '**Why ostomies exist**',
                'Normally, waste travels the full length of the digestive or urinary tract and exits the body the usual way. But when disease — cancer, severe bowel inflammation — or injury makes part of that path unusable, surgeons create a detour: they bring the healthy part of the tract through the abdominal wall, and waste exits there instead. The ostomy is the detour; it\'s what makes life possible when the normal road is closed.',
                '**Meeting the stoma**',
                'The stoma is the end of that detour — the small, round opening on the abdomen. Here\'s what to know when you first see one: a healthy stoma is moist and red or pink, like the inside of your cheek, because it\'s the same kind of tissue. It has no nerve endings, so touching it doesn\'t hurt the resident. It may bleed a tiny bit if rubbed during cleaning — that small surface bleeding is normal. And it can\'t control when waste comes out — there\'s no muscle to squeeze — which is why the pouch is always worn.',
                '**The three types and their outputs**',
                'The type tells you what to expect in the pouch. A colostomy, from the large intestine, puts out stool — often fairly formed, sometimes softer, often with somewhat predictable timing. An ileostomy, from the small intestine, puts out liquid to pasty output more continuously — and that output is loaded with digestive enzymes that burn skin. A urostomy puts out urine continuously into a pouch with a drain spout. Knowing the type tells you what\'s normal for that resident.',
                '**The appliance: seal is everything**',
                'The pouch system has two jobs: collect the output, and protect the skin. The skin barrier — the adhesive base — seals around the stoma so output goes into the pouch and never touches skin. When the seal is good, the skin stays healthy. When the seal leaks, harsh output sits on the skin and burns it — and damaged skin can\'t hold the next seal well, so leaks beget damage and damage begets leaks. Protecting the seal is protecting the skin.',
                '**Why emptying on time matters**',
                'A pouch is emptied when it\'s about one-third full — not left until bulging. Here\'s why: a heavy, overfull pouch drags on the skin barrier and peels the seal away from the skin, causing exactly the leaks we just described. It\'s also more likely to leak odor, more uncomfortable, and more embarrassing for the resident. Emptying on time, every time, is one of the simplest and most protective habits in ostomy care.',
                '**The watch: stoma, output, skin**',
                'Daily ostomy care includes a quiet three-part check. The stoma: still its healthy red-pink, moist self? The output: normal amount and character for this resident\'s type — or has it changed, slowed, or stopped? The skin: intact and calm under and around the barrier — or red, weepy, or broken? Changes in any of the three are the early signals that something needs the nurse.',
                '**The person around the stoma**',
                'Finally, remember the person. An ostomy changes how someone\'s body handles its most private function, and many residents carry grief, embarrassment, or fear of leaks and odor. Adjustment takes time. Care that is prompt, skilled, and absolutely matter-of-fact — no flinching, no faces, no rushing — teaches the resident their body is acceptable and their care is routine. Your composure is itself a form of treatment.',
              ].join('\n\n'),
            },
            {
              id: 'oc-s04-seal-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Empty at about ONE-THIRD full',
              body: 'A heavy pouch peels the seal. Empty on time, every time — seal protection, skin protection, odor control, and dignity in one habit.',
            },
            {
              id: 'oc-s04-video',
              type: 'video',
              title: 'Fundamentals',
              videoUrl: `${ASSET_BASE}/s04-fundamentals.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s04-fundamentals.mp4`,
            },
            {
              id: 'oc-s04-image',
              type: 'image',
              src: `${ASSET_BASE}/s04-hero.jpg`,
              caption: 'How a stoma and pouching system work, and why a good seal matters.',
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
        sortOrder: 4,
        buildContent: () =>
          doc('Signs & Symptoms', [
            { id: 'oc-s05-heading', type: 'heading', level: 1, text: 'Signs & Symptoms' },
            {
              id: 'oc-s05-image',
              type: 'image',
              src: `${ASSET_BASE}/s05-hero.jpg`,
              caption:
                'Recognizing trouble — a healthy stoma is red-pink; dusky or dark color is an emergency.',
            },
            {
              id: 'oc-s05-narration',
              type: 'text',
              body: [
                'In ostomy care, you read four things: the stoma, the skin, the output, and the resident. Let\'s learn the healthy baseline and the warning signs.',
                '**The healthy baseline**',
                'First, know healthy, so you can spot trouble. A healthy stoma: moist, red or pink, like the inside of a cheek — it may be slightly swollen early after surgery and settle over time, and a tiny bit of surface bleeding with cleaning is normal. Healthy peristomal skin: looks like the rest of the belly\'s skin — intact, calm, not red or broken. Normal output: matches the resident\'s type — formed-to-soft stool for a colostomy, liquid-to-pasty and frequent for an ileostomy, steady urine for a urostomy. Learn each resident\'s normal; everything else is measured against it.',
                '**The skin warning signs**',
                'The most common trouble is the skin. Watch for: redness, irritation, or a burning rash where the barrier sits or where output has leaked. Skin that\'s weepy, raw, or broken. Itching or burning the resident reports. And the cause behind most of it — leaks: output seeping under the barrier, a seal lifting at the edges, a pouch that needed emptying and didn\'t get it. Report skin redness or breakdown early, and report repeated leaks — a barrier that keeps failing may need refitting by the nurse or ostomy specialist. Early skin trouble is fixable; neglected skin trouble spirals.',
                '**The output warning signs**',
                'Output changes carry messages. For bowel ostomies: output that stops — especially with cramping, bloating, nausea, or a swollen belly — can mean a blockage, and that\'s urgent. Sudden very watery, high-volume output — especially from an ileostomy — drains fluid fast and risks dehydration: watch for thirst, dizziness, weakness, and report it. Blood in the pouch beyond trace surface spotting is reported. For urostomies: cloudy, foul, bloody urine, fever, or back pain suggest infection — reported promptly. And no urine flowing from a urostomy is urgent.',
                '**The stoma emergencies**',
                'And the signs that can\'t wait. A stoma changing color — turning dusky, purple, gray, or black — can mean its blood supply is failing, and that is urgent: report immediately. A stoma that protrudes much more than usual — telescoping outward — or one sinking below the skin, is reported promptly. Significant active bleeding from the stoma, not just surface spotting, is urgent. And the blockage picture from before — no output, cramping pain, bloating, vomiting — is treated as an emergency for a bowel ostomy. When the stoma itself looks wrong, the nurse needs to know now.',
                '**Summary**',
                'Four pictures. Healthy: red-pink moist stoma, calm intact skin, the resident\'s normal output. Skin trouble: redness, rawness, leaks under the barrier — report early and report repeat leaks. Output trouble: stopped output with cramping (urgent), sudden watery flooding (dehydration risk), blood, or urostomy infection signs. Stoma emergencies: dark color change, major protrusion or sinking, active bleeding — report immediately.',
                'The rule underneath it all: know each resident\'s healthy baseline — and when the stoma, the skin, or the output departs from it, report early; when the stoma turns dark or output stops with pain, report now.',
              ].join('\n\n'),
            },
            {
              id: 'oc-s05-dark-stoma-callout',
              type: 'callout',
              variant: 'warning',
              title: 'The dark stoma emergency',
              body: 'A stoma turning dusky, purple, gray, or black can mean failing blood supply — report immediately. The stoma has no nerve endings, so the resident may feel fine even when it\'s in serious trouble.',
            }
          ]),
      },
      {
        slug: 's06-causes',
        title: 'Causes',
        sortOrder: 5,
        buildContent: () =>
          doc('Causes', [
            { id: 'oc-s06-heading', type: 'heading', level: 1, text: 'Causes' },
            pendingAudio(
              'oc-s06-audio',
              'Why Ostomies Happen — and What Causes Their Everyday Problems',
              `${ASSET_BASE}/s06-causes-podcast.mp3`,
              [
                'Why Ostomies Happen — and What Causes Their Everyday Problems',
                '',
                'People receive ostomies because disease or injury made the normal waste route unusable — and knowing the common reasons builds respect for what residents have survived. Colorectal cancer is a leading cause of colostomies; bladder cancer is the main reason for urostomies; severe inflammatory bowel disease — Crohn\'s disease and ulcerative colitis — drives many ileostomies, sometimes in younger people; diverticular disease, bowel perforations, blockages, and trauma account for more. Some ostomies are temporary, protecting the bowel while it heals; many are permanent. Every one of them was created to save or protect a life.',
                '',
                'For daily care, though, the more useful question is what causes the everyday problems — because most trace to preventable, practical things.',
                '',
                'Leaks and skin damage — the number one problem — usually come from a chain of practical causes: a pouch left too full, so its weight peels the barrier loose; a barrier opening cut or sized poorly so output touches skin at the edges; skin that wasn\'t clean and fully dry when the barrier went on, so it never sealed well; creases, folds, or scars in the skin that channel output under the seal; changes in the resident\'s weight or belly shape that outdate the fit; and barriers worn too long past their change schedule. Ileostomy output makes everything more urgent, because its digestive enzymes can injure skin within hours. And remember the vicious cycle: leaked output damages skin, and damaged, weepy skin can\'t hold the next seal — so small leak problems are reported early, before the cycle starts.',
                '',
                'Blockages in bowel ostomies are often food-related — typically high-fiber, hard-to-digest foods eaten in quantity or poorly chewed: things like nuts, corn, popcorn, raw vegetables, dried fruit, and tough skins. Residents have individual dietary guidance from their team; supporting it and encouraging thorough chewing and good fluids helps prevent blockages.',
                '',
                'Dehydration threatens ileostomy residents in particular, because the small intestine\'s liquid output carries away significant fluid and salts — and vomiting or diarrhea illness makes it worse fast. Encouraging fluids as the plan directs and reporting sudden high watery output protects them.',
                '',
                'And infection — mainly the urinary kind for urostomy residents — follows the same logic you know from urinary care: hygiene, hydration, and prompt reporting of cloudy, foul, or bloody urine and fever.',
                '',
                'The pattern is clear: most ostomy problems are everyday and preventable — and the prevention is timely emptying, good skin and seal habits, supported diet and fluids, and early reporting. That\'s CNA territory.',
              ].join('\n'),
              '/assets/courses/ostomy-care/s06-causes-podcast.mp3',
            ),
            {
              id: 'oc-s06-image',
              type: 'image',
              src: `${ASSET_BASE}/s06-hero.jpg`,
              caption:
                'What affects ostomy health — skin condition, seal fit, diet, and output changes.',
            },
          ]),
      },
      {
        slug: 's07-role',
        title: 'CNA Role & Best Practices',
        sortOrder: 6,
        buildContent: () =>
          doc('CNA Role & Best Practices', [
            { id: 'oc-s07-heading', type: 'heading', level: 1, text: 'CNA Role & Best Practices' },
            {
              id: 'oc-s07-image',
              type: 'image',
              src: `${ASSET_BASE}/s07-hero.jpg`,
              caption:
                'CNA scope — pouch care, skin protection, and reporting; never assess or change the ostomy plan.',
            },
            {
              id: 'oc-s07-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of practice',
              body: 'CNAs ASSIST WITHIN POLICY, PROTECT THE SEAL, WATCH, and REPORT. CNAs never create or change the ostomy plan, irrigate, exceed training and policy, or diagnose stoma problems.',
            },
            {
              id: 'oc-s07-narration',
              type: 'text',
              body: [
                'Ostomy care is managed by the nurse and, often, a specialized ostomy nurse — and the CNA delivers daily support within training and facility policy. Let\'s walk through it, starting with the frame that governs everything. Which ostomy tasks you perform — emptying the pouch, versus changing the full appliance — depends on your facility\'s policy and your documented training. The principles here are universal; your task list comes from your facility and the nurse. When in doubt, ask before acting. And the rules that never bend: a CNA does not create or change the ostomy care plan, does not irrigate an ostomy, does not perform procedures beyond training and policy, and does not diagnose stoma problems.',
                '**Emptying the pouch — the core routine.** Where emptying is within your role: empty when the pouch is about one-third full — never letting it bulge and drag on the seal. Gloves on, privacy ensured, work unhurried and matter-of-fact. Empty per your training, clean the pouch opening, and reseal it properly. Note the output — amount and character — because you\'re the one who sees it. Wash hands, and document as your facility directs. Emptying on time is seal protection, skin protection, odor control, and dignity, all in one habit.',
                '**Appliance changes and skin care.** Appliance changes — removing the barrier, cleaning and drying the skin, and applying a new one — are done by the nurse or by trained staff per facility policy. Where you assist or perform within your role: the skin is cleaned gently with water or as directed, dried completely — a barrier will not seal to damp skin — and the new barrier sized and applied per the plan. Never tear a barrier off fast; remove gently, supporting the skin. Report any redness or breakdown you see at changes — that\'s the early-warning moment.',
                '**Protecting the seal between changes.** Check that the barrier edges are lying flat during daily care, keep the pouch supported rather than dangling heavy, take care during dressing, transfers, and bathing not to snag or peel it — most appliances tolerate bathing, per the plan — and report lifting edges or leaks promptly rather than patching with tape and hoping.',
                '**Diet, fluids, and medications.** Support the resident\'s dietary guidance — particularly the chew-well, careful-with-hard-to-digest-foods guidance for bowel ostomies — and encourage fluids as the plan directs, especially for ileostomy residents. The nurse manages all medications; note that some medications pass differently with an ileostomy, which is the team\'s concern — your part is reporting undissolved pills you may see in output.',
                '**Odor and confidence.** Use the pouch\'s features and facility-approved deodorizing measures per the plan, empty promptly, and ensure good pouch closure — odor control is dignity control. A resident confident their pouch won\'t leak or smell is a resident who\'ll rejoin the dining room.',
                'The scope point for this section: your exact task list is set by facility policy and training — but wherever your role lands, the standards are the same: empty on time, protect the seal, keep skin clean and dry, support diet and fluids, observe everything, and report early.',
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
            { id: 'oc-s08-heading', type: 'heading', level: 1, text: 'Prevention & Risk Reduction' },
            {
              id: 'oc-s08-image',
              type: 'image',
              src: `${ASSET_BASE}/s08-hero.jpg`,
              caption:
                'Prevention — protecting peristomal skin, ensuring a good seal, and watching output.',
            },
            {
              id: 'oc-s08-narration',
              type: 'text',
              body: [
                'In ostomy care, prevention protects the skin, the seal, and the spirit. Here are seven ways.',
                '**One. Empty at one-third — on time, every time.** A pouch emptied at about one-third full never gets heavy enough to peel the seal, never bulges visibly under clothing, and never builds the odor and anxiety of an overfull bag. This single habit prevents the leak that starts the skin-damage cycle. Make it automatic.',
                '**Two. Treat the seal as precious.** Check that barrier edges lie flat during daily care. Be gentle around the appliance during dressing, bathing, and transfers — no snagging, no pulling. Support a heavy pouch rather than letting it drag. And when a seal is lifting or leaking, report it for a proper change — never tape it down and hope.',
                '**Three. Keep the peristomal skin clean and completely dry.** At changes, clean gently and pat fully dry — a barrier cannot seal to damp skin, and a failed seal burns the skin it exposed. Remove barriers slowly and gently, supporting the skin. Report any redness, rawness, or weeping early, because early skin trouble is fixable and late skin trouble spirals.',
                '**Four. Support the diet that prevents blockages.** For bowel ostomies, support each resident\'s dietary guidance, encourage thorough chewing, and be thoughtful with hard-to-digest foods like nuts, corn, popcorn, raw vegetables, and dried fruit per their plan. Good chewing and good fluids keep output moving.',
                '**Five. Guard hydration — especially with an ileostomy.** Liquid ileostomy output carries fluid and salts away constantly. Encourage fluids as the plan directs, watch for thirst, dizziness, weakness, and dark urine, and report sudden high watery output fast — dehydration builds quickly in these residents, and faster still when they\'re ill.',
                '**Six. Watch the stoma daily.** During routine care, glance at the three-part check: stoma still red-pink and moist, skin calm, output normal for this resident. Thirty seconds of attention catches color changes, lifting seals, and skin trouble while they\'re still small. Report departures from the baseline early — and a dark stoma immediately.',
                '**Seven. Prevent shame with your composure.** Treat every pouch emptying and every appliance task as completely routine — no faces, no flinching, no rushing, full privacy, warm matter-of-fact conversation. Handle odor moments gracefully. Your steady composure teaches the resident their body is acceptable and their care is normal — and that prevention of shame is as real as any other prevention in this course.',
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
            { id: 'oc-s09-heading', type: 'heading', level: 1, text: 'Scenario & Reporting' },
            pendingAudio(
              'oc-s09-intro-audio',
              'Emergency response scenarios intro',
              `${ASSET_BASE}/s09-emergency-intro.mp3`,
              'With ostomy care, the judgments that matter most are recognizing the stoma whose blood supply is failing, and recognizing the blocked bowel ostomy. You\'re about to work through two situations. Read each carefully, choose your action, and you\'ll get feedback right away. Keep the core ideas in mind: a healthy stoma is red or pink — a dark stoma is urgent. And output that stops, with cramping and bloating, is urgent too.',
              '/assets/courses/ostomy-care/s09-emergency-intro.mp3',
            ),
            {
              id: 'oc-s09-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-hero.jpg`,
              caption:
                'Two ostomy judgments — a stoma losing its blood supply, and a possible blockage.',
            },
            {
              id: 'oc-s09-scenario-castellano-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-scenario-castellano.jpg`,
              caption:
                'Stoma turned dusky purplish-gray: the blood supply may be failing — report immediately.',
            },
            {
              id: 'oc-s09-scenario-castellano',
              type: 'scenario_question',
              prompt:
                'During morning care, you notice Mr. Castellano\'s colostomy stoma looks very different from its usual healthy red-pink: today it appears dusky and purplish-gray, darker than you\'ve ever seen it. He says he feels alright and isn\'t in pain — and a coworker suggests, "It\'s probably just the lighting in here. Check it again this evening." What SHOULD the CNA do?',
              options: [
                {
                  id: 'wait-evening',
                  label: 'Wait and recheck this evening as the coworker suggests',
                  feedback:
                    'A stoma turning dusky, purple, or gray can mean its blood supply is failing — and because the stoma has no nerve endings, the resident will feel fine even while tissue is in danger. Waiting, rubbing, or covering it could cost living tissue. The right action: report the color change to the nurse immediately.',
                },
                {
                  id: 'report-immediately',
                  label:
                    'Report the color change to the nurse immediately — a darkening stoma can mean its blood supply is failing',
                  feedback:
                    'Exactly right. A healthy stoma is red or pink because it has good blood supply. A stoma turning dusky, purple, gray, or black can mean that blood supply is failing — and stoma tissue with failing circulation can die. This is urgent regardless of how the resident feels: remember, the stoma has no nerve endings, so it cannot hurt even when it\'s in serious trouble — "he feels fine" is no reassurance at all here. Waiting until evening could mean waiting while tissue dies. Report the color change to the nurse immediately and let them assess it now. Never rub a stoma to "restore color." Recognizing the dark stoma and refusing to wait is exactly the right call.',
                  isRecommended: true,
                },
                {
                  id: 'rub-stoma',
                  label: 'Rub the stoma to restore its color',
                  feedback:
                    'A stoma turning dusky, purple, or gray can mean its blood supply is failing — and because the stoma has no nerve endings, the resident will feel fine even while tissue is in danger. Waiting, rubbing, or covering it could cost living tissue. The right action: report the color change to the nurse immediately.',
                },
                {
                  id: 'cover-pouch',
                  label: 'Cover it with the pouch and not worry since he feels fine',
                  feedback:
                    'A stoma turning dusky, purple, or gray can mean its blood supply is failing — and because the stoma has no nerve endings, the resident will feel fine even while tissue is in danger. Waiting, rubbing, or covering it could cost living tissue. The right action: report the color change to the nurse immediately.',
                },
              ],
              requiredForCompletion: true,
            },
            {
              id: 'oc-s09-scenario-faraday-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-scenario-faraday.jpg`,
              caption:
                'Ileostomy output stopped with cramping and nausea after popcorn: possible blockage — report promptly.',
            },
            {
              id: 'oc-s09-scenario-faraday',
              type: 'scenario_question',
              prompt:
                'Mrs. Faraday has an ileostomy that normally produces frequent liquid output throughout the day. You notice her pouch has stayed empty since last evening — highly unusual for her. She\'s developing cramping abdominal pain that\'s getting worse, her belly looks bloated, and she\'s starting to feel nauseated. Yesterday she ate a large bowl of nuts and popcorn at a family visit. What SHOULD the CNA do?',
              options: [
                {
                  id: 'wait-tomorrow',
                  label: 'Assume her bowel is just having a slow day and wait until tomorrow',
                  feedback:
                    'For an ileostomy that normally flows constantly, a pouch empty since last evening plus worsening cramping, bloating, and nausea points to a blockage — urgent, and possibly food-related given the nuts and popcorn. Waiting, feeding, or forceful massage could make it dangerous. The right action: report the full picture to the nurse promptly.',
                },
                {
                  id: 'report-promptly',
                  label:
                    'Report it to the nurse promptly — no output with worsening cramping, bloating, and nausea suggests a blockage',
                  feedback:
                    'Right. An ileostomy normally flows frequently — so a pouch empty since last evening is a loud alarm for this resident, and paired with worsening cramping, bloating, and nausea, it points to a blockage, quite possibly from the nuts and popcorn, classic hard-to-digest culprits. A blocked ostomy is urgent: it can progress to vomiting and a dangerous obstruction. Report it to the nurse promptly with the full picture — no output since evening, the worsening pain and bloating, the nausea, and the food history, which is exactly the kind of detail that helps. Do not push food into a possibly blocked bowel, and never massage forcefully. The baseline knowledge — "her pouch is never empty this long" — is what made this catch possible.',
                  isRecommended: true,
                },
                {
                  id: 'big-meal',
                  label: 'Give her a big meal to push things through',
                  feedback:
                    'For an ileostomy that normally flows constantly, a pouch empty since last evening plus worsening cramping, bloating, and nausea points to a blockage — urgent, and possibly food-related given the nuts and popcorn. Waiting, feeding, or forceful massage could make it dangerous. The right action: report the full picture to the nurse promptly.',
                },
                {
                  id: 'massage-abdomen',
                  label: 'Massage her abdomen firmly to break up the blockage',
                  feedback:
                    'For an ileostomy that normally flows constantly, a pouch empty since last evening plus worsening cramping, bloating, and nausea points to a blockage — urgent, and possibly food-related given the nuts and popcorn. Waiting, feeding, or forceful massage could make it dangerous. The right action: report the full picture to the nurse promptly.',
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
            { id: 'oc-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
              id: 'oc-s10-narration',
              type: 'text',
              body: [
                'Your role in ostomy care is faithful routine, daily watching, steady dignity, and early reporting — all within your training and facility policy. Let\'s walk through it.',
                '**Deliver the routine within your role** Carry the routine that protects everything else. Empty at about one-third full, on time, every time — with gloves, privacy, and unhurried calm. Protect the seal through dressing, bathing, and transfers. Assist with appliance and skin care exactly as your training and facility policy define — skin cleaned gently and dried completely, barriers removed slowly — and when a task is beyond your role or you\'re unsure, ask the nurse before acting. The routine, done faithfully, prevents most ostomy problems before they start.',
                '**Watch the stoma, skin, and output daily** Be the daily eyes. Know each resident\'s healthy baseline — their stoma\'s normal red-pink, their skin\'s normal calm, their output\'s normal pattern — and run the quiet three-part check during routine care. Report early: skin redness, lifting seals, repeated leaks, output changes. Report urgently: a darkening stoma, stopped output with cramping and bloating, active bleeding, sudden flooding watery output, or urostomy infection signs. Your thirty seconds of daily attention is the early-warning system.',
                '**Protect dignity and rebuild confidence** Tend the person as much as the pouch. Total privacy, matter-of-fact warmth, zero flinching, graceful handling of odor moments. Support the resident\'s own involvement in their care where they\'re able — many ostomy residents managed their own appliances for years and deserve that respect. Encourage their confidence back into meals, activities, and company, because a well-managed ostomy should never sentence anyone to isolation. Your composure is part of their recovery.',
                '**Support diet, fluids, and the team** Support the rest of the plan. Encourage the dietary guidance and thorough chewing that prevent blockages, and the fluids that protect ileostomy residents from dehydration. Report poor intake, the food details that matter after problems, and undissolved pills in output. And report specifically — "her pouch has been empty since last evening and she has worsening cramps" tells the nurse exactly what they need.',
                'Now the boundary. You do not create or change the ostomy plan. You never irrigate an ostomy, never perform appliance procedures beyond your training and facility policy, never tape over failing seals, never rub a stoma — and never diagnose. When in doubt about whether a task is yours: ask first.',
                'Inside your role — the routine delivered, the daily watch kept, dignity guarded, reports made early and specifically — you protect the skin, the seal, the safety, and the self-respect of residents living with ostomies. That\'s the whole of this care, and it\'s largely yours.',
              ].join('\n\n'),
            },
            {
              id: 'oc-s10-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Stay within scope',
              body: 'You do not create or change the ostomy plan. You never irrigate an ostomy, never exceed your training and facility policy, never tape over failing seals, never rub a stoma — and never diagnose. When in doubt: ask first.',
            },
            {
              id: 'oc-s10-video',
              type: 'video',
              title: "CNA's Role in Care",
              videoUrl: `${ASSET_BASE}/s10-cna-role.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s10-cna-role.mp4`,
            },
            {
              id: 'oc-s10-image',
              type: 'image',
              src: `${ASSET_BASE}/s10-hero.jpg`,
              caption:
                'The CNA as the daily eyes — checking stoma color and output helps catch problems early.',
            },
          ]),
      },
      {
        slug: 's11-case-study',
        title: 'Case Study',
        sortOrder: 10,
        buildContent: () => {
          const caseNarrative = [
            'Mr. Castellano, 74, had received a colostomy after colorectal cancer surgery — surgery that saved his life. He was three months out, physically healing well. But his CNA, Priya, noticed the man himself was disappearing: a once-sociable retired carpenter who now took every meal alone in his room, declined activities, and barely spoke during care. When Priya assisted with his ostomy care, he turned his face to the wall and once muttered, "Just get it over with. It\'s disgusting. I\'m disgusting."',
            '',
            '**What Priya understood:** Priya recognized what she was seeing from her training: not a skin problem or a seal problem, but the other great complication of ostomy life — shame. Mr. Castellano\'s surgery had saved him, but he hadn\'t accepted his stoma; he feared leaks and odor in front of others, and he\'d quietly sentenced himself to isolation. And Priya knew her own behavior during care was either feeding that shame or healing it.',
            '',
            '**What Priya did, day by day:** She made his ostomy care the most matter-of-fact, unhurried, respectful part of her day. No faces, no rushing, full privacy, and easy warm conversation about carpentry and his grandkids while she worked — treating the pouch like the routine it was. She emptied on time, every time, at one-third full, so he never once experienced a bulging bag or an odor incident with her. When he said "it\'s disgusting," she answered evenly and warmly: "It\'s not disgusting to me — it\'s just part of your care, and honestly, it\'s the part that means you\'re still here. The cancer\'s gone and you\'re not." She reported his withdrawal and his comments to the nurse, who engaged the team about his adjustment.',
            '',
            '**The practical save inside the emotional one:** One morning during care, Priya\'s daily three-part check caught something: the skin at the lower edge of his barrier was newly red, and the seal edge was starting to lift — an early leak in the making. She reported it that morning. The nurse refitted the appliance — his weight had changed since surgery, outdating the fit — before any real skin damage or public leak ever happened. Priya knew what a leak in the dining room would have done to a man already ashamed: it would have confirmed every fear and locked the door of his room for good.',
            '',
            '**The turn:** Weeks of steady, composed, on-time care — and no leaks, no odors, no incidents — slowly did their work. Mr. Castellano began watching Priya\'s calm and borrowing it. He asked her a question about the appliance one day, then another; soon he was participating in his own care, the way he\'d once handled every tool in his shop. Then one evening, Priya found him dressed and waiting: "Thought I might eat in the dining room tonight. You\'ll keep an eye on me?" She did. Nothing happened — which was everything.',
            '',
            '**The outcome:** Mr. Castellano returned, gradually, to meals, to the woodworking activity table, to himself. The nurse summed it up: "His stoma healed in two weeks. The man took three months — and what healed him was care that never once made him feel disgusting, and a CNA who caught the leak before it could humiliate him. Both of those were Priya."',
            '',
            '**Discussion:** Priya\'s case shows ostomy care\'s two halves working together. The technical half: on-time emptying, the daily three-part check, the early catch of a lifting seal and reddening skin, the specific report that got the appliance refitted before harm. The human half: unwavering matter-of-fact composure, warmth that answered shame directly, support for his returning independence, and reporting the emotional withdrawal as the real care concern it was. She never exceeded her role — the refit was the nurse\'s, the adjustment support was the team\'s — but her daily faithfulness was the ground both stood on. A pouch was managed; a person came back.',
          ].join('\n');

          return doc('Case Study', [
            { id: 'oc-s11-heading', type: 'heading', level: 1, text: 'Case Study' },
            pendingAudio(
              'oc-s11-audio',
              'The Man Who Wouldn\'t Come to Dinner',
              `${ASSET_BASE}/s11-case-podcast.mp3`,
              caseNarrative,
              '/assets/courses/ostomy-care/s11-case-podcast.mp3',
            ),
            {
              id: 'oc-s11-image',
              type: 'image',
              src: `${ASSET_BASE}/s11-hero.png`,
              caption:
                'Recognizing the pattern — how careful observation and skin care supported a resident with an ostomy.',
            },
            {
              id: 'oc-s11-case-study',
              type: 'case_study',
              title: 'The Man Who Wouldn\'t Come to Dinner',
              residentProfile:
                'Mr. Castellano, 74, had received a colostomy after colorectal cancer surgery — surgery that saved his life. He was three months out, physically healing well. But his CNA, Priya, noticed the man himself was disappearing: a once-sociable retired carpenter who now took every meal alone in his room, declined activities, and barely spoke during care.',
              scenario: [
                '**What Priya understood:** Priya recognized what she was seeing from her training: not a skin problem or a seal problem, but the other great complication of ostomy life — shame. Mr. Castellano\'s surgery had saved him, but he hadn\'t accepted his stoma; he feared leaks and odor in front of others, and he\'d quietly sentenced himself to isolation. And Priya knew her own behavior during care was either feeding that shame or healing it.',
                '**What Priya did, day by day:** She made his ostomy care the most matter-of-fact, unhurried, respectful part of her day. No faces, no rushing, full privacy, and easy warm conversation about carpentry and his grandkids while she worked — treating the pouch like the routine it was. She emptied on time, every time, at one-third full, so he never once experienced a bulging bag or an odor incident with her. When he said "it\'s disgusting," she answered evenly and warmly: "It\'s not disgusting to me — it\'s just part of your care, and honestly, it\'s the part that means you\'re still here. The cancer\'s gone and you\'re not." She reported his withdrawal and his comments to the nurse, who engaged the team about his adjustment.',
                '**The practical save inside the emotional one:** One morning during care, Priya\'s daily three-part check caught something: the skin at the lower edge of his barrier was newly red, and the seal edge was starting to lift — an early leak in the making. She reported it that morning. The nurse refitted the appliance — his weight had changed since surgery, outdating the fit — before any real skin damage or public leak ever happened. Priya knew what a leak in the dining room would have done to a man already ashamed: it would have confirmed every fear and locked the door of his room for good.',
                '**The turn:** Weeks of steady, composed, on-time care — and no leaks, no odors, no incidents — slowly did their work. Mr. Castellano began watching Priya\'s calm and borrowing it. He asked her a question about the appliance one day, then another; soon he was participating in his own care, the way he\'d once handled every tool in his shop. Then one evening, Priya found him dressed and waiting: "Thought I might eat in the dining room tonight. You\'ll keep an eye on me?" She did. Nothing happened — which was everything.',
                '**The outcome:** Mr. Castellano returned, gradually, to meals, to the woodworking activity table, to himself. The nurse summed it up: "His stoma healed in two weeks. The man took three months — and what healed him was care that never once made him feel disgusting, and a CNA who caught the leak before it could humiliate him. Both of those were Priya."',
                '**Discussion:** Priya\'s case shows ostomy care\'s two halves working together. The technical half: on-time emptying, the daily three-part check, the early catch of a lifting seal and reddening skin, the specific report that got the appliance refitted before harm. The human half: unwavering matter-of-fact composure, warmth that answered shame directly, support for his returning independence, and reporting the emotional withdrawal as the real care concern it was. She never exceeded her role — the refit was the nurse\'s, the adjustment support was the team\'s — but her daily faithfulness was the ground both stood on. A pouch was managed; a person came back.',
              ].join('\n\n'),
            },
            {
              id: 'oc-s11-reflection-1',
              type: 'reflection',
              prompt:
                'Mr. Castellano called himself "disgusting." How did Priya\'s composure, on-time emptying, and matter-of-fact warmth answer that shame — and why is the CNA\'s behavior during ostomy care itself a form of treatment?',
              minCharacters: 50,
            },
            {
              id: 'oc-s11-reflection-2',
              type: 'reflection',
              prompt:
                'Priya\'s daily check caught a lifting seal and early skin redness before any leak occurred. What would a public leak likely have cost this particular resident, and what does that say about why the small daily habits matter?',
              minCharacters: 50,
            },
            {
              id: 'oc-s11-rp-text',
              type: 'text',
              body: 'Reflect on the case study in the previous lesson. Your written responses help you apply what you learned about shame and dignity in ostomy care, on-time emptying, the daily three-part check, and faithful reporting.',
            },
            {
              id: 'oc-s11-kc2-check',
              type: 'knowledge_check',
              question:
                'A CNA does not create or change the ostomy care plan, does not irrigate an ostomy, does not perform procedures beyond training and policy, and does not diagnose stoma problems. During morning care, you notice Mr. Castellano\'s colostomy stoma looks dusky and purplish-gray — darker than its usual healthy red-pink. He says he feels alright, and a coworker suggests checking it again this evening. The CNA SHOULD:',
              options: [
                {
                  id: 'wait-evening',
                  label: 'Wait and recheck this evening as the coworker suggests',
                },
                {
                  id: 'report-nurse',
                  label:
                    'Report the color change to the nurse immediately — a darkening stoma can mean its blood supply is failing',
                },
                {
                  id: 'rub-stoma',
                  label: 'Rub the stoma to restore its color',
                },
                {
                  id: 'cover-pouch',
                  label: 'Cover it with the pouch and not worry since he feels fine',
                },
              ],
              correctOptionId: 'report-nurse',
              explanation:
                'You never create or change the ostomy plan, irrigate, exceed your training and policy, or diagnose stoma problems — but your immediate reporting of a darkening stoma lets the nurse assess failing blood supply before tissue is lost. The stoma has no nerve endings, so "he feels fine" is no reassurance.',
              requiredForCompletion: true,
              meta: { flaggedFiller: true },
            }
          ]);
        },
      },
      {
        slug: 's12-conclusion',
        title: 'Conclusion',
        sortOrder: 11,
        buildContent: () =>
          doc('Conclusion', [
            { id: 'oc-s12-heading', type: 'heading', level: 1, text: 'Conclusion' },
            {
              id: 'oc-s12-video',
              type: 'video',
              title: 'Conclusion',
              videoUrl: `${ASSET_BASE}/s12-conclusion.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s12-conclusion.mp4`,
            },
            {
              id: 'oc-s12-image',
              type: 'image',
              src: `${ASSET_BASE}/s12-hero.jpg`,
              caption: 'Five things that matter most in ostomy care.',
            },
            {
              id: 'oc-s12-narration',
              type: 'text',
              body: [
                'You\'ve reached the end — and you\'ve completed the digestive health series. Let\'s lock in the five things that matter most for ostomy care.',
                '**One.** An ostomy is life-saving surgery, and people live full lives with one. The stoma is healthy tissue — moist, red or pink like the inside of a cheek, with no nerve endings, so it feels no pain. Know the three types — colostomy, ileostomy, urostomy — and each resident\'s normal output.',
                '**Two.** Protect the seal and the skin. Empty at about one-third full, on time, every time, so the pouch never peels the seal. Keep skin clean and completely dry at changes, remove barriers gently, and report redness, lifting edges, and repeat leaks early — because leaked output burns skin, and damaged skin can\'t hold the next seal.',
                '**Three.** Run the daily three-part check. The stoma: still red-pink and moist? The skin: calm and intact? The output: normal for this resident? Thirty seconds of daily attention is the early-warning system that catches trouble small.',
                '**Four.** Know the urgent signs. A stoma turning dusky, purple, gray, or black can mean failing blood supply — report immediately, and remember the stoma can\'t hurt, so "they feel fine" is no reassurance. No output with cramping, bloating, and nausea suggests a blockage — urgent. And guard ileostomy residents against dehydration.',
                '**Five.** Honor your scope, and the person. Your task list comes from facility policy and your training — when in doubt, ask before acting. You never irrigate, never exceed your role, never diagnose. But you deliver the routine, keep the watch, support diet and fluids, and give care so composed and respectful that shame finds nothing to feed on. Both halves are the care.',
              ].join('\n\n'),
            },
            {
              id: 'oc-s12-summary',
              type: 'summary',
              title: 'Five things that matter most',
              items: [
                'An ostomy is life-saving surgery — know the three types and each resident\'s normal output.',
                'Protect the seal and the skin — empty at one-third full, keep skin clean and dry, report leaks early.',
                'Run the daily three-part check — stoma, skin, output in thirty seconds.',
                'Know the urgent signs — dark stoma or stopped output with cramping needs action now.',
                'Honor your scope and the person — routine care, early reports, and composure that prevents shame.',
              ],
            },
            {
              id: 'oc-s12-whn-text',
              type: 'text',
              body: 'Ten questions are waiting. Everything on them was covered here. You\'re ready. Trust what you\'ve learned, and show what you know.',
            },
            {
              id: 'oc-s12-cr-text',
              type: 'text',
              body: 'This course provides one hour of continuing education credit through CAL ACE Nursing Academy, an approved CDPH continuing education provider, NAC number 7384. Your certificate is generated automatically when you pass the knowledge check.',
            },
            {
              id: 'oc-s12-cr-callout',
              type: 'callout',
              variant: 'info',
              title: 'Scope reminder',
              body: 'CNAs assist within policy, protect skin, and watch. CNAs do not create or change the ostomy plan, irrigate ostomies, exceed training and policy, or diagnose stoma problems.',
            },
            {
              id: 'oc-s12-ca-text',
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

export async function seedCourse37OstomyCare(
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
  console.log(`Seeding Course 37 (Ostomy Care) as DRAFT — slug "${COURSE_SLUG}"…`);

  try {
    const result = await seedCourse37OstomyCare(prisma);
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
