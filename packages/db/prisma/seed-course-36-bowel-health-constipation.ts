/**
 * Seed Course 36 — Bowel Health & Constipation Care (DRAFT).
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-36-bowel-health-constipation
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
const COURSE_SLUG = 'bowel-health-constipation';
const COURSE_TITLE = 'Constipation Prevention and Bowel Routine Support';
const COURSE_SUMMARY =
  'Learn the CNA\'s role in supporting healthy bowel function and preventing/managing constipation — understanding normal vs. abnormal bowel patterns, supporting fiber/fluid/movement/toileting, accurate bowel tracking, recognizing the dangerous complications (impaction, obstruction), and protecting dignity. CNAs do not diagnose, give or adjust laxatives/medications, or perform digital removal of impaction.';

const ASSET_BASE = `/assets/courses/bowel-health-constipation`;


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
    'Explain normal and abnormal bowel patterns',
    'Support healthy bowel function',
    'Track and report accurately',
    'Recognize impaction and obstruction',
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
  heroImage: '/assets/courses/bowel-health-constipation/hero-banner.png',
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
    title: 'Understanding Bowel Health & Constipation',
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: 'Introduction',
        sortOrder: 0,
        buildContent: () =>
          doc('Welcome', [
            { id: 'bhc-s01-heading', type: 'heading', level: 1, text: 'Welcome' },
            {
              id: 'bhc-s01-video',
              type: 'video',
              title: 'Introduction',
              videoUrl: `${ASSET_BASE}/s01-intro.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s01-intro.mp4`,
            },
            {
              id: 'bhc-s01-image',
              type: 'image',
              src: `${ASSET_BASE}/s01-hero.jpg`,
              caption:
                'Bowel health — supporting regular, comfortable elimination and catching problems early.',
            },
            {
              id: 'bhc-s01-narration',
              type: 'text',
              body: [
                'Welcome to CAL ACE Nursing Academy.',
                'This course is about bowel health and constipation — a topic that\'s easy to treat as minor or even joke about, but that in long-term care is genuinely important, sometimes dangerous, and deeply tied to a resident\'s comfort and dignity.',
                'Let\'s start with why this matters. Constipation — difficulty passing stool, or passing it too infrequently — is one of the most common problems in older adults. It causes real misery: discomfort, bloating, pain, poor appetite, nausea, even confusion and agitation. And left unmanaged, it can lead to serious complications: a hard mass of stool stuck in the bowel, called an impaction, and in severe cases a bowel obstruction — a blockage that can become a life-threatening emergency. What starts as "they haven\'t gone in a few days" can end in the hospital. So bowel care is not a minor task. It\'s real medical care.',
                'Here\'s what makes the CNA so central. The things that keep bowels healthy are almost entirely daily, hands-on care: enough fiber in the diet, enough fluid, regular movement and activity, and a supportive toileting routine with privacy and enough time. And the early warning system for bowel problems is the CNA\'s careful tracking — because you\'re the one who knows when a resident last had a bowel movement, what it looked like, and whether something has changed. That bowel record is one of the most important things you keep.',
                'This course is also about dignity, because bowels are private and embarrassing for most adults. A resident may be reluctant to talk about it, may feel ashamed of needing help, may downplay a problem. Matter-of-fact warmth, privacy, and gentle attention make it possible to give good bowel care without humiliating anyone.',
                'Your scope is clear. A CNA supports healthy bowel habits, tracks bowel movements accurately, recognizes constipation and its complications, provides dignified care, and reports faithfully. A CNA does not diagnose, does not give or adjust laxatives or medications, and does not perform the manual removal of an impaction — that\'s a nurse procedure.',
                'By the end of this course, you will be able to: explain normal and abnormal bowel patterns. Support healthy bowel function. Track and report accurately. Recognize impaction and obstruction. And know your scope.',
                'There is a ten-question knowledge check at the end. Everything on it is covered here. Let\'s begin.',
              ].join('\n\n'),
            },
            {
              id: 'bhc-s01-ci-text',
              type: 'text',
              body: [
                'This course teaches the CNA\'s role in supporting healthy bowel function and preventing/managing constipation — understanding normal vs. abnormal bowel patterns, supporting fiber/fluid/movement/toileting, accurate bowel tracking, recognizing the dangerous complications (impaction, obstruction), and protecting dignity.',
                'Let\'s be clear about your role. A CNA supports healthy bowel habits, tracks bowel movements accurately, recognizes constipation and its complications, provides dignified care, and reports faithfully. A CNA does not diagnose, does not give or adjust laxatives or medications, and does not perform the manual removal of an impaction — that\'s a nurse procedure. But none of the team\'s bowel management can happen without your careful observation and faithful reporting first.',
              ].join('\n\n'),
            },
            {
              id: 'bhc-s01-ci-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of this course',
              body: 'CNAs SUPPORT HEALTHY BOWEL HABITS, TRACK, RECOGNIZE, and REPORT. CNAs do not diagnose, give or adjust laxatives/medications, or perform manual removal of impaction.',
            },
            {
              id: 'bhc-s01-lo-text',
              type: 'text',
              body: 'By the end of this course, you will be able to:',
            },
            {
              id: 'bhc-s01-lo-summary',
              type: 'summary',
              title: 'Learning objectives',
              items: [
                'Explain normal and abnormal bowel patterns.',
                'Support healthy bowel function.',
                'Track and report accurately.',
                'Recognize impaction and obstruction.',
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
            { id: 'bhc-s02-heading', type: 'heading', level: 1, text: 'Key terms' },
            {
              id: 'bhc-s02-image',
              type: 'image',
              src: `${ASSET_BASE}/s02-hero.jpg`,
              caption:
                'Key terms — constipation, impaction, overflow diarrhea, obstruction, bowel routine.',
            },
            {
              id: 'bhc-s02-reveal-bowel-movement',
              type: 'reveal_card',
              frontTitle: 'Bowel Movement',
              frontBody: 'Bowel movement',
              backTitle: 'Bowel Movement',
              backBody:
                'The passing of stool from the body. Healthy bowel movements vary from person to person — anywhere from a few times a day to a few times a week can be normal. What matters most is each resident\'s own pattern, and noticing when it changes.',
            },
            {
              id: 'bhc-s02-reveal-constipation',
              type: 'reveal_card',
              frontTitle: 'Constipation',
              frontBody: 'Constipation',
              backTitle: 'Constipation',
              backBody:
                'Difficulty passing stool, passing it less often than normal for that person, or passing hard, dry, painful stool. It\'s not defined by one rule for everyone — it\'s a change from the resident\'s normal toward harder, less frequent, more difficult movements.',
            },
            {
              id: 'bhc-s02-reveal-fecal-impaction',
              type: 'reveal_card',
              frontTitle: 'Fecal Impaction',
              frontBody: 'FEE-kal',
              backTitle: 'Fecal Impaction',
              backBody:
                'A large, hard mass of stool that becomes stuck in the rectum or lower bowel and cannot be passed normally. It\'s a serious result of unmanaged constipation, causing pain, and it requires the nurse — it\'s never something a CNA removes manually.',
            },
            {
              id: 'bhc-s02-reveal-bowel-obstruction',
              type: 'reveal_card',
              frontTitle: 'Bowel Obstruction',
              frontBody: 'Bowel obstruction',
              backTitle: 'Bowel Obstruction',
              backBody:
                'A blockage of the intestine that stops stool and gas from passing. It causes severe belly pain, swelling, vomiting, and no bowel movements or gas. A bowel obstruction is a medical emergency that can become life-threatening.',
            },
            {
              id: 'bhc-s02-reveal-overflow-diarrhea',
              type: 'reveal_card',
              frontTitle: 'Paradoxical (Overflow) Diarrhea',
              frontBody: 'Overflow diarrhea',
              backTitle: 'Paradoxical (Overflow) Diarrhea',
              backBody:
                'When liquid stool leaks around a hard impaction, looking like diarrhea — but the resident is actually badly constipated, with a blockage above. This trap is why new "diarrhea" in a constipated resident must be reported, not just treated as a loose stool.',
            },
            {
              id: 'bhc-s02-reveal-fiber',
              type: 'reveal_card',
              frontTitle: 'Fiber',
              frontBody: 'Fiber',
              backTitle: 'Fiber',
              backBody:
                'The part of plant foods — whole grains, fruits, vegetables, beans — that the body doesn\'t digest. Fiber adds bulk and softness to stool and helps it move through the bowel. Adequate fiber, with enough fluid, is a foundation of healthy bowels.',
            },
            {
              id: 'bhc-s02-reveal-laxative',
              type: 'reveal_card',
              frontTitle: 'Laxative',
              frontBody: 'LAX-ah-tiv',
              backTitle: 'Laxative',
              backBody:
                'A medication or product that helps produce a bowel movement. There are several kinds, used carefully and chosen by the medical team. CNAs never decide on, give, or adjust laxatives — but they report when bowels aren\'t moving so the team can act.',
            },
            {
              id: 'bhc-s02-reveal-bowel-record',
              type: 'reveal_card',
              frontTitle: 'Bowel Record / Tracking',
              frontBody: 'Bowel record',
              backTitle: 'Bowel Record / Tracking',
              backBody:
                'The careful tracking of each resident\'s bowel movements — when, how much, and what the stool was like. This record is how the team catches constipation before it becomes impaction. Accurate, honest bowel tracking is essential CNA work.',
            },
            {
              id: 'bhc-s02-kc1-check-impaction',
              type: 'knowledge_check',
              question: 'Match the term: a hard stool mass stuck in the bowel, needing the nurse',
              options: [
                { id: 'fecal-impaction', label: 'Fecal impaction' },
                { id: 'overflow-diarrhea', label: 'Overflow diarrhea' },
                { id: 'bowel-record', label: 'Bowel record' },
              ],
              correctOptionId: 'fecal-impaction',
              explanation:
                'Fecal impaction. A large, hard mass of stool that becomes stuck in the rectum or lower bowel and cannot be passed normally. It\'s a serious result of unmanaged constipation, causing pain, and it requires the nurse — it\'s never something a CNA removes manually.',
              requiredForCompletion: true,
            },
            {
              id: 'bhc-s02-kc1-check-overflow',
              type: 'knowledge_check',
              question:
                'Match the term: liquid leaking around an impaction — actually severe constipation',
              options: [
                { id: 'fecal-impaction', label: 'Fecal impaction' },
                { id: 'overflow-diarrhea', label: 'Overflow diarrhea' },
                { id: 'bowel-record', label: 'Bowel record' },
              ],
              correctOptionId: 'overflow-diarrhea',
              explanation:
                'Overflow diarrhea. When liquid stool leaks around a hard impaction, looking like diarrhea — but the resident is actually badly constipated, with a blockage above. This trap is why new "diarrhea" in a constipated resident must be reported, not just treated as a loose stool.',
              requiredForCompletion: true,
            },
            {
              id: 'bhc-s02-kc1-check-bowel-record',
              type: 'knowledge_check',
              question:
                'Match the term: tracking when and what a resident passes, to catch problems early',
              options: [
                { id: 'fecal-impaction', label: 'Fecal impaction' },
                { id: 'overflow-diarrhea', label: 'Overflow diarrhea' },
                { id: 'bowel-record', label: 'Bowel record' },
              ],
              correctOptionId: 'bowel-record',
              explanation:
                'Bowel record. The careful tracking of each resident\'s bowel movements — when, how much, and what the stool was like. This record is how the team catches constipation before it becomes impaction. Accurate, honest bowel tracking is essential CNA work.',
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
            { id: 'bhc-s03-heading', type: 'heading', level: 1, text: 'Statistics' },
            pendingAudio(
              'bhc-s03-audio',
              'Constipation: Common, Sometimes Dangerous, and Highly Preventable',
              `${ASSET_BASE}/s03-stats-podcast.mp3`,
              [
                'Constipation: Common, Sometimes Dangerous, and Highly Preventable',
                '',
                'Constipation is one of the most common conditions in older adults and one of the most common problems in long-term care. By many estimates, a majority of nursing home residents experience constipation or are treated for it, and laxatives are among the most frequently used medications in these settings. Several things make older adults especially prone: slower bowel movement with age, reduced mobility and activity, lower food and fluid intake, many medications that slow the bowel — including some pain medications, certain blood pressure drugs, iron, and others — and conditions like Parkinson\'s, diabetes, and stroke that affect bowel function.',
                '',
                'It\'s tempting to treat constipation as a minor nuisance, but it isn\'t. Unmanaged, it causes genuine suffering — abdominal pain and bloating, nausea, loss of appetite, and in older adults it commonly causes confusion, agitation, and restlessness, sometimes mistaken for other problems. It contributes to urinary problems, because a full bowel presses on the bladder. And it can progress to serious complications.',
                '',
                'The first is fecal impaction — a hard mass of stool stuck in the bowel that can\'t pass on its own. Impaction is painful, common in frail elders, and one of its trickiest features is overflow: liquid stool leaks around the hard mass and looks like diarrhea, fooling caregivers into treating the wrong problem. The second, more dangerous complication is bowel obstruction — a true blockage of the intestine, which causes severe pain, vomiting, and swelling, and is a life-threatening emergency requiring immediate care. What begins as "hasn\'t gone in a few days" can, if ignored, end in surgery or worse.',
                '',
                'Now the empowering part. Constipation is highly preventable, and the prevention is daily CNA work: encouraging adequate fiber and fluids, promoting movement and activity, supporting a regular toileting routine with privacy and time, and — crucially — tracking bowel movements accurately so problems are caught early. Studies of bowel-management programs in long-term care show that consistent attention to fiber, fluids, activity, and toileting routines significantly reduces constipation, laxative dependence, and impactions.',
                '',
                'The bottom line: constipation is common, can turn dangerous, and is largely preventable — and the CNA\'s daily support and faithful tracking are the front line of healthy bowels.',
              ].join('\n'),
              '/assets/courses/bowel-health-constipation/s03-stats-podcast.mp3',
            ),
            {
              id: 'bhc-s03-image',
              type: 'image',
              src: `${ASSET_BASE}/s03-hero.png`,
              caption:
                'Constipation is common and often overlooked — untreated, it leads to serious harm.',
            },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: 'Fundamentals',
        sortOrder: 3,
        buildContent: () =>
          doc('Fundamentals', [
            { id: 'bhc-s04-heading', type: 'heading', level: 1, text: 'Fundamentals' },
            {
              id: 'bhc-s04-narration',
              type: 'text',
              body: [
                '**What the bowel does**',
                'After the body absorbs nutrients from food, the leftover waste passes into the large intestine — the bowel. There, water is absorbed from the waste, forming stool, which is stored until it\'s passed. Muscles in the bowel wall push the stool along in slow, wave-like movements. A healthy bowel moves waste through at a steady, comfortable pace.',
                '**What "normal" really means**',
                'There\'s no single normal for everyone. One resident may have a bowel movement after every meal; another, every two or three days — and both can be perfectly healthy. What matters is each resident\'s own usual pattern, and whether the stool passes comfortably and is soft and formed. This is why knowing each resident\'s baseline is everything: "normal" is defined per person, and problems show up as changes from their normal.',
                '**What happens in constipation**',
                'Constipation develops when stool moves too slowly through the bowel. The longer it sits, the more water is absorbed from it — so it becomes hard, dry, and difficult to pass. Slower movement comes from many sources: too little fiber or fluid, too little activity, medications that slow the bowel, ignoring the urge to go, and certain diseases. The result is harder, less frequent, more painful movements.',
                '**Why it causes more than discomfort**',
                'Constipation reaches beyond the belly. The discomfort and fullness kill appetite and cause nausea. In older adults especially, it commonly causes confusion, agitation, and restlessness — a constipated elder may simply seem "off" or behave differently. A full bowel presses on the bladder, worsening urinary problems. So constipation can masquerade as, or worsen, other problems — which is why it\'s checked when an elder changes.',
                '**The danger: impaction**',
                'When constipation goes unmanaged, stool can build into a hard mass too large and dry to pass — a fecal impaction, stuck in the lower bowel. It\'s painful and distressing. And it has a deceptive trick: liquid stool from higher up leaks around the hard mass and dribbles out, looking exactly like diarrhea. A caregiver who treats that "diarrhea" as a loose-stool problem misses the real one — a blockage. New diarrhea in a constipated resident is a red flag for impaction, not a simple loose stool.',
                '**The emergency: obstruction**',
                'The most serious complication is a bowel obstruction — the intestine truly blocked, so nothing passes, not even gas. It causes severe, worsening abdominal pain, a swollen, distended belly, vomiting, and a complete stop of bowel movements and gas. This is a medical emergency that can become life-threatening, and it needs immediate care. Recognizing its signs and getting help fast is critical.',
                '**Mostly preventable, with daily care**',
                'Here\'s the hopeful truth: most constipation is preventable and manageable with consistent daily care — fiber, fluids, movement, a supportive toileting routine, and careful tracking that catches trouble early. When these are done faithfully, residents stay comfortable, regular, and far less dependent on laxatives, and the dangerous complications rarely develop. That daily care is the CNA\'s.',
              ].join('\n\n'),
            },
            {
              id: 'bhc-s04-normal-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Normal is per person',
              body: 'Watch for changes from each resident\'s baseline. New "diarrhea" in a constipated resident is a red flag for impaction — report it, don\'t treat it as loose stool.',
            },
            {
              id: 'bhc-s04-video',
              type: 'video',
              title: 'Fundamentals',
              videoUrl: `${ASSET_BASE}/s04-fundamentals.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s04-fundamentals.mp4`,
            },
            {
              id: 'bhc-s04-image',
              type: 'image',
              src: `${ASSET_BASE}/s04-hero.jpg`,
              caption:
                'How the bowel works, and what slows it down in older or less mobile residents.',
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
            { id: 'bhc-s05-heading', type: 'heading', level: 1, text: 'Signs & Symptoms' },
            {
              id: 'bhc-s05-image',
              type: 'image',
              src: `${ASSET_BASE}/s05-hero.jpg`,
              caption:
                'Recognizing trouble — no stool for days, hard belly, and the leaks that hide impaction.',
            },
            {
              id: 'bhc-s05-narration',
              type: 'text',
              body: [
                'In bowel care, you watch the resident, the stool, and the record. Let\'s learn the signs — of constipation, of impaction, and of the obstruction emergency.',
                '**The signs of constipation**',
                'The signs of constipation: no bowel movement for longer than the resident\'s normal, or fewer than usual. Hard, dry, lumpy, or pellet-like stool. Straining, or pain, when trying to go. A feeling of fullness or that they haven\'t finished. A bloated, uncomfortable, or firm belly. Reduced appetite, nausea, and discomfort. Passing only small, hard amounts. Track these against each resident\'s baseline — a change toward harder and less frequent is the early signal.',
                '**The hidden signs in older adults**',
                'In older adults, constipation often shows up in ways that don\'t obviously point to the bowel. New or worsened confusion. Agitation, restlessness, or irritability. A general "off" or unwell feeling. Loss of appetite or refusing meals. New or worsened urinary problems, because the full bowel presses on the bladder. So when an elder suddenly changes — more confused, more agitated, off their food — one of the questions is always: when did they last have a bowel movement? Constipation is a common, fixable, easily-overlooked cause.',
                '**The impaction signs, including the overflow trap**',
                'Watch for impaction when constipation has gone on. Signs: ongoing constipation with significant discomfort or pain, a firm or distended belly, and an urge to go with nothing passing. And the crucial trap — overflow diarrhea: frequent small leaks of watery or loose stool in a resident who has actually been constipated. It looks like diarrhea, but it\'s liquid sneaking past a hard blockage. So new "diarrhea" in a constipated resident, especially with belly discomfort, is reported as possible impaction — never just treated as a loose stool. The fix is the nurse\'s, never a CNA\'s manual removal.',
                '**The obstruction emergency**',
                'And the emergency: bowel obstruction. The signs escalate and are unmistakable when you know them: severe, cramping, worsening abdominal pain. A swollen, hard, distended belly. Vomiting — sometimes of foul, stool-like material in severe cases. Complete inability to pass stool OR gas. The resident looking very unwell. This is a life-threatening emergency — get help immediately. The combination of a distended belly, vomiting, severe pain, and nothing passing is the picture to never miss.',
                '**Summary**',
                'Three pictures. Constipation: harder, less frequent, painful stool, bloating, poor appetite — and in elders, new confusion or agitation. Impaction: ongoing constipation with discomfort, and the overflow trap of "diarrhea" leaking around a blockage — report, don\'t treat as loose stool. Obstruction: severe pain, distended belly, vomiting, nothing passing at all — emergency now.',
                'The rule underneath it all: know each resident\'s baseline, track faithfully, treat new "diarrhea" in a constipated resident as a warning, and recognize the obstruction emergency.',
              ].join('\n\n'),
            },
            {
              id: 'bhc-s05-overflow-callout',
              type: 'callout',
              variant: 'warning',
              title: 'The overflow trap',
              body: 'New "diarrhea" in a constipated resident is often overflow leaking around an impaction — report it as possible impaction, never just treat it as loose stool.',
            }
          ]),
      },
      {
        slug: 's06-causes',
        title: 'Causes',
        sortOrder: 5,
        buildContent: () =>
          doc('Causes', [
            { id: 'bhc-s06-heading', type: 'heading', level: 1, text: 'Causes' },
            pendingAudio(
              'bhc-s06-audio',
              'What Causes Constipation — and What Can a CNA Change?',
              `${ASSET_BASE}/s06-causes-podcast.mp3`,
              [
                'What Causes Constipation — and What Can a CNA Change?',
                '',
                'Constipation in older adults usually comes from several causes stacking up at once, and the encouraging news is that many of them are things daily care can influence.',
                '',
                'Start with the everyday ones, which are also the most fixable. Too little fiber — diets low in whole grains, fruits, vegetables, and beans produce stool that\'s hard to move. Too little fluid — without enough water, the bowel pulls more water from the stool, hardening it; dehydration is a major, common cause. Too little movement — activity stimulates the bowel, so reduced mobility, bed rest, and inactivity slow it down. And ignoring or being unable to answer the urge to go — when a resident can\'t get help to the toilet in time, or lacks privacy, or feels rushed, they hold it, and held stool dries and hardens. Every one of these is something a CNA directly affects.',
                '',
                'Then the medical causes, which CNAs don\'t control but should understand. Many medications slow the bowel — notably opioid pain medications, which are a very common cause, along with certain blood pressure drugs, iron supplements, some antidepressants, and others. Conditions like Parkinson\'s, diabetes, stroke, low thyroid, and dementia slow or disrupt bowel function. And the bowel simply slows somewhat with age. These are why some residents need extra support and medical bowel management even with good daily care.',
                '',
                'There\'s also a vicious cycle worth knowing: constipation causes discomfort and poor appetite, so the resident eats and drinks less, which worsens the constipation. And overuse or misuse of laxatives can eventually make the bowel sluggish on its own — which is one reason laxatives are managed carefully by the team, not handed out freely.',
                '',
                'Here\'s what it means for the CNA. You can\'t change a resident\'s medications or diseases, but you powerfully influence the everyday causes: encourage fiber and fluids, promote movement, provide prompt, private, unhurried toileting, and track faithfully so problems are caught early. And you watch closely the residents at highest risk — those on opioids, those with limited mobility, those with the relevant conditions. Daily faithfulness on the fixable causes prevents most constipation before it starts.',
              ].join('\n'),
              '/assets/courses/bowel-health-constipation/s06-causes-podcast.mp3',
            ),
            {
              id: 'bhc-s06-image',
              type: 'image',
              src: `${ASSET_BASE}/s06-hero.jpg`,
              caption:
                'What drives constipation — low fiber and fluids, immobility, and some medications.',
            },
          ]),
      },
      {
        slug: 's07-role',
        title: 'CNA Role & Best Practices',
        sortOrder: 6,
        buildContent: () =>
          doc('CNA Role & Best Practices', [
            { id: 'bhc-s07-heading', type: 'heading', level: 1, text: 'CNA Role & Best Practices' },
            {
              id: 'bhc-s07-image',
              type: 'image',
              src: `${ASSET_BASE}/s07-hero.jpg`,
              caption:
                'CNA scope — hydration, movement, toileting, and reporting; never give laxatives or enemas on your own.',
            },
            {
              id: 'bhc-s07-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of practice',
              body: 'CNAs DELIVER THE DAILY FOUNDATION, TRACK, RECOGNIZE, and REPORT. CNAs never give/adjust laxatives or manually remove an impaction.',
            },
            {
              id: 'bhc-s07-narration',
              type: 'text',
              body: [
                'Bowel treatment is a layered system — daily habits first, medications when needed, and procedures for complications — and the CNA delivers the daily foundation while staying firmly in scope. Let\'s walk through it, starting with the rule that never bends. A CNA does not diagnose, does not decide on, give, or adjust laxatives or other medications, and never performs the manual removal of a fecal impaction — that is a nurse procedure.',
                '**The daily foundation — fiber, fluid, movement, routine.** This is the front-line treatment, and it\'s entirely yours. Fiber: support and encourage the fiber-rich foods the diet includes. Fluid: encourage adequate fluids through the day, within each resident\'s plan — remembering that some, like kidney and heart residents, have limits. Movement: promote activity and mobility, even gentle movement, because it stimulates the bowel. Routine: support a regular toileting time — often after meals, when the bowel is naturally most active — with real privacy, an unhurried pace, good positioning, and prompt help when the urge comes. This foundation prevents and relieves most constipation.',
                '**Tracking — the early-warning system.** The bowel record is treatment, because it catches problems early. Track each resident\'s bowel movements accurately and honestly — when they last went, how much, and what the stool was like. Know the facility\'s threshold for concern — commonly, no bowel movement in about three days triggers a report — and report when a resident reaches it, so the team can act before constipation becomes impaction. Honest tracking is everything; a guessed or skipped record blinds the team.',
                '**Laxatives and medications.** When daily measures aren\'t enough, the team may order stool softeners, fiber supplements, laxatives, or suppositories or enemas, in a careful stepwise way. The nurse manages all of these. Your role: report when bowels aren\'t moving so they can be ordered, support administration as directed within your role and facility policy, and report the results and any cramping or distress. You never decide on or self-direct a laxative.',
                '**Impaction and its removal — strictly the nurse\'s.** A suspected impaction is reported to the nurse. Its treatment — which may include manual removal — is a nurse procedure with specific precautions, never performed by a CNA. Your role is recognizing it, including the overflow-diarrhea trap, reporting it, and providing comfort and dignity.',
                '**The obstruction emergency.** Suspected bowel obstruction — severe pain, distended belly, vomiting, nothing passing — is not a bowel-routine issue; it\'s an emergency. Get help immediately; the medical team manages it.',
                'The scope point for this section: you never medicate, never remove an impaction — but you deliver the fiber-fluid-movement-routine foundation, you track honestly, you recognize the complications, and you report early. The daily foundation is the treatment that prevents most of the trouble.',
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
            { id: 'bhc-s08-heading', type: 'heading', level: 1, text: 'Prevention & Risk Reduction' },
            {
              id: 'bhc-s08-image',
              type: 'image',
              src: `${ASSET_BASE}/s08-hero.jpg`,
              caption:
                'Prevention — fiber, fluids, activity, and a consistent, unhurried toileting routine.',
            },
            {
              id: 'bhc-s08-narration',
              type: 'text',
              body: [
                'Healthy bowels are built by daily habits. Here are seven ways CNAs prevent constipation and its complications.',
                '**One. Encourage fiber at every meal.** Support and encourage the fiber-rich foods on the resident\'s diet — whole grains, fruits, vegetables, beans. Fiber gives stool the bulk and softness to move easily. Encourage eating, and flag poor appetite, because a resident not eating is a resident heading toward constipation.',
                '**Two. Push fluids — within each plan.** Adequate fluid keeps stool soft and moving. Offer drinks throughout the day, make water easy to reach, and encourage sipping — while honoring the limits of residents with fluid restrictions, like kidney and heart residents. Good hydration, within the plan, is one of the simplest, strongest bowel protections.',
                '**Three. Keep them moving.** Activity stimulates the bowel. Support walking, movement, and the activity each resident\'s plan allows — even gentle movement and repositioning for those who can\'t walk. The more a resident moves, the better their bowel moves. Inactivity is a leading, preventable cause.',
                '**Four. Support a regular, private, unhurried toileting routine.** Help residents to the toilet at regular times — often after meals, when the bowel is most active — with real privacy, a relaxed pace, good upright positioning, and prompt help the moment they feel the urge. Never rush a resident on the toilet, and never make them hold it. Routine and dignity together keep bowels regular.',
                '**Five. Track faithfully and honestly.** Keep an accurate bowel record — when, how much, what it looked like. Know your facility\'s threshold for concern and report when a resident reaches it. The record is how constipation is caught before it becomes impaction. Never guess it and never skip it.',
                '**Six. Watch the high-risk residents closely.** Residents on opioid pain medications, those with limited mobility, and those with conditions like Parkinson\'s or diabetes are at high risk and need extra attention — a proactive bowel routine, closer tracking, and early reporting. For an opioid resident especially, constipation is expected and prevented on purpose, not waited for.',
                '**Seven. Treat the early signs — and the elder\'s "off" days — as bowel clues.** Report early constipation before it builds, and when an older resident becomes newly confused, agitated, or off their food, ask when they last had a bowel movement. Catching constipation early, including in its hidden elderly forms, prevents the misery and the dangerous complications downstream.',
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
            { id: 'bhc-s09-heading', type: 'heading', level: 1, text: 'Scenario & Reporting' },
            pendingAudio(
              'bhc-s09-intro-audio',
              'Emergency response scenarios intro',
              `${ASSET_BASE}/s09-emergency-intro.mp3`,
              'With bowel care, the judgments that matter most are seeing through the overflow-diarrhea trap to the impaction beneath it, and recognizing a bowel obstruction emergency. You\'re about to work through two situations. Read each carefully, choose your action, and you\'ll get feedback right away. Keep the core ideas in mind: new "diarrhea" in a constipated resident is a warning, not a simple loose stool — and severe belly pain with a distended belly and vomiting is an emergency.',
              '/assets/courses/bowel-health-constipation/s09-emergency-intro.mp3',
            ),
            {
              id: 'bhc-s09-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-hero.jpg`,
              caption:
                'Two bowel judgments — watery leaks that mask impaction, and the signs of an obstruction.',
            },
            {
              id: 'bhc-s09-scenario-solomon-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-scenario-solomon.jpg`,
              caption:
                "Five days no BM but now watery leaks: overflow around an impaction — report; don't treat as diarrhea.",
            },
            {
              id: 'bhc-s09-scenario-solomon',
              type: 'scenario_question',
              prompt:
                'Your bowel record shows Mr. Solomon hasn\'t had a real bowel movement in five days, and he\'s been complaining of belly discomfort and feeling full. Today he\'s having frequent small leaks of watery, loose stool. A coworker says, "Oh good, he\'s finally going — looks like diarrhea now. Maybe we should ask for something to stop the diarrhea." What SHOULD the CNA do?',
              options: [
                {
                  id: 'agree-antidiarrhea',
                  label: 'Agree it\'s diarrhea and ask for anti-diarrhea medication',
                  feedback:
                    'This "diarrhea" in a resident constipated for five days with belly discomfort is the overflow trap — liquid leaking around an impaction. Anti-diarrhea medication or a self-directed laxative would worsen it, and a CNA never removes an impaction. The right action: report it to the nurse as possible impaction with the full picture.',
                },
                {
                  id: 'report-impaction-overflow',
                  label:
                    'Report it as possible impaction with overflow — five days constipated plus belly discomfort plus new watery leaking',
                  feedback:
                    'Exactly right. This is the classic overflow trap. Five days with no real bowel movement, plus belly discomfort and fullness, plus new frequent watery leaking, points to a fecal impaction — a hard mass stuck in the bowel, with liquid stool sneaking around it and dribbling out. It looks like diarrhea, but the real problem is a blockage. Giving anti-diarrhea medication would be exactly wrong — it would worsen the impaction. So would a laxative on your own initiative. Report it to the nurse as possible impaction, with the full picture: the five-day record, the discomfort, and the watery leaking. The nurse assesses and manages it — manual removal, if needed, is strictly a nurse procedure, never a CNA\'s. Reading through this trap is one of the most valuable things a CNA can do.',
                  isRecommended: true,
                },
                {
                  id: 'stop-tracking',
                  label: 'Assume the constipation resolved itself and stop tracking',
                  feedback:
                    'This "diarrhea" in a resident constipated for five days with belly discomfort is the overflow trap — liquid leaking around an impaction. Anti-diarrhea medication or a self-directed laxative would worsen it, and a CNA never removes an impaction. The right action: report it to the nurse as possible impaction with the full picture.',
                },
                {
                  id: 'give-laxative',
                  label: 'Give him a laxative to help move things along',
                  feedback:
                    'This "diarrhea" in a resident constipated for five days with belly discomfort is the overflow trap — liquid leaking around an impaction. Anti-diarrhea medication or a self-directed laxative would worsen it, and a CNA never removes an impaction. The right action: report it to the nurse as possible impaction with the full picture.',
                },
              ],
              requiredForCompletion: true,
            },
            {
              id: 'bhc-s09-scenario-avila-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-scenario-avila.jpg`,
              caption:
                'Severe pain, hard distended belly, vomiting, no stool or gas: possible obstruction — get help now.',
            },
            {
              id: 'bhc-s09-scenario-avila',
              type: 'scenario_question',
              prompt:
                'Mrs. Avila has been constipated for several days. This afternoon she develops severe, cramping abdominal pain that\'s getting worse, her belly is visibly swollen and hard, she\'s started vomiting, and she tells you she hasn\'t passed any stool OR gas at all. She looks very unwell. What is the BEST action?',
              options: [
                {
                  id: 'give-laxative',
                  label: 'Give her a laxative and wait for it to work',
                  feedback:
                    'Severe worsening pain, a distended hard belly, vomiting, and no stool or gas passing is a bowel obstruction — a life-threatening emergency, not a constipation routine. A laxative, food, or fluids could worsen a blocked bowel. The right action: recognize the emergency and get help immediately, giving nothing by mouth.',
                },
                {
                  id: 'emergency-help',
                  label: 'Recognize a possible bowel obstruction and get emergency help immediately',
                  feedback:
                    'Right. Severe, worsening cramping pain, a swollen hard belly, vomiting, and the complete inability to pass stool OR gas — in a constipated resident — is the picture of a bowel obstruction, a life-threatening emergency. This is not a bowel-routine problem to manage with fiber, fluids, or a laxative — in fact, giving a laxative or pushing food and fluids into a blocked bowel can be dangerous. Get emergency help immediately, keep her as comfortable as possible, give her nothing to eat or drink, and report her constipation history. A bowel obstruction needs urgent medical evaluation, sometimes surgery. Recognizing it fast and escalating is exactly the right call.',
                  isRecommended: true,
                },
                {
                  id: 'walk-fluids',
                  label: 'Encourage her to walk and drink more water',
                  feedback:
                    'Severe worsening pain, a distended hard belly, vomiting, and no stool or gas passing is a bowel obstruction — a life-threatening emergency, not a constipation routine. A laxative, food, or fluids could worsen a blocked bowel. The right action: recognize the emergency and get help immediately, giving nothing by mouth.',
                },
                {
                  id: 'wait-next-shift',
                  label: 'Wait until the next shift to see if she improves',
                  feedback:
                    'Severe worsening pain, a distended hard belly, vomiting, and no stool or gas passing is a bowel obstruction — a life-threatening emergency, not a constipation routine. A laxative, food, or fluids could worsen a blocked bowel. The right action: recognize the emergency and get help immediately, giving nothing by mouth.',
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
            { id: 'bhc-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
              id: 'bhc-s10-narration',
              type: 'text',
              body: [
                'Your role in bowel care is daily support, faithful tracking, alert recognition, and dignity throughout. Let\'s walk through it.',
                '**Deliver the daily foundation** You deliver the foundation that prevents most constipation. Encourage fiber-rich foods and adequate fluids within each plan, promote movement and activity even when gentle, and support a regular toileting routine — ideally after meals, with privacy, time, good positioning, and prompt help when the urge comes. This unglamorous daily work is the single most powerful bowel care there is.',
                '**Protect dignity in private care** Bowels are private and embarrassing for most adults, so dignity is woven through everything. Provide privacy, work with matter-of-fact warmth and zero judgment, never rush a resident on the toilet, never make them feel ashamed of needing help or of an accident, and speak of bowel care plainly and kindly. Good bowel care that humiliates isn\'t good care — the dignity is part of it.',
                '**Track honestly, the early-warning system** Be the keeper of the bowel record, accurately and honestly. Know when each resident last had a real bowel movement, what it was like, and your facility\'s threshold for concern — and report when they reach it, before constipation becomes impaction. Your honest tracking is what lets the team act early; a guessed or skipped record leaves them blind.',
                '**Recognize, escalate, and report** Be the alert recognizer. Catch constipation early, including its hidden elder forms — new confusion, agitation, poor appetite. See through the overflow trap: new "diarrhea" in a constipated resident is reported as possible impaction. And know the obstruction emergency — severe pain, distended belly, vomiting, nothing passing — and get help immediately. Report early and specifically; your reports prevent both misery and danger.',
                'Now the boundary. You do not diagnose. You do not decide on, give, or adjust laxatives or medications. You never perform manual removal of an impaction — that\'s the nurse. And you never treat overflow "diarrhea" as a simple loose stool, or a possible obstruction as a routine.',
                'Inside your role — the daily foundation delivered, dignity protected, the record kept honestly, the complications recognized and escalated — you keep residents comfortable and regular, and you catch the dangerous problems early. In a topic people brush off, your faithful care quietly prevents real suffering.',
              ].join('\n\n'),
            },
            {
              id: 'bhc-s10-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Stay within scope',
              body: 'You do not diagnose, give or adjust laxatives, or manually remove an impaction. Deliver the daily foundation, track honestly, recognize complications, and protect dignity.',
            },
            {
              id: 'bhc-s10-video',
              type: 'video',
              title: "CNA's Role in Care",
              videoUrl: `${ASSET_BASE}/s10-cna-role.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s10-cna-role.mp4`,
            },
            {
              id: 'bhc-s10-image',
              type: 'image',
              src: `${ASSET_BASE}/s10-hero.jpg`,
              caption:
                'The CNA as the daily tracker — every recorded BM helps catch constipation before it turns dangerous.',
            },
          ]),
      },
      {
        slug: 's11-case-study',
        title: 'Case Study',
        sortOrder: 10,
        buildContent: () => {
          const caseNarrative = [
            'Mr. Solomon, 80, took an opioid pain medication for chronic back pain — a medication well known to slow the bowel. His CNA, Naomi, kept his bowel record faithfully, and she knew his opioid put him at high risk for constipation, so she watched it closely.',
            '',
            '**The record that told the story:** Naomi\'s tracking showed a worrying trend: Mr. Solomon hadn\'t had a real, full bowel movement in five days. He\'d been complaining of belly discomfort and feeling full and bloated, and his appetite had dropped. Naomi had already been encouraging fluids, fiber, and movement, and had flagged the lengthening gap to the nurse, who was monitoring.',
            '',
            '**The deceptive turn:** On the fifth day, things seemed to change — Mr. Solomon began having frequent small leaks of watery, loose stool. A coworker was relieved: "Oh good, he finally went — it\'s turned to diarrhea. Let\'s get him something to stop it before he makes a mess." It was the natural read: watery stool looks like diarrhea, and the obvious response is to stop the diarrhea.',
            '',
            '**What Naomi knew:** But Naomi\'s bowel record told a different story, and her training clicked into place. Five days with no real bowel movement. Belly discomfort and fullness. And now watery stool leaking out. That wasn\'t diarrhea — that was overflow: liquid stool sneaking around a hard impaction stuck in his bowel. Treating it as diarrhea, with medication to stop it, would have trapped the blockage in place and made everything worse. The record was the key — without it, the "diarrhea" would have been convincing.',
            '',
            '**What Naomi did:** Naomi reported it correctly and specifically: "Mr. Solomon hasn\'t had a real BM in five days per my record, he\'s had belly discomfort and bloating, and now he\'s leaking small amounts of watery stool. I think this is overflow around an impaction, not diarrhea — please assess him before anything\'s given for diarrhea." She did not give any anti-diarrhea medication, did not give a laxative on her own, and absolutely did not attempt any manual removal — she knew that was the nurse\'s procedure.',
            '',
            '**The resolution:** The nurse assessed Mr. Solomon, confirmed a fecal impaction, and managed it appropriately and safely, with the precautions the procedure requires. Once the impaction was cleared, his discomfort resolved, his appetite returned, and his bowel routine was strengthened — more aggressive prevention given his opioid, with closer tracking — so it wouldn\'t build again.',
            '',
            '**The outcome:** Because Naomi read through the overflow trap, Mr. Solomon was treated for the real problem — a blockage — instead of being given medication that would have worsened it. The nurse told her: "Half of people would\'ve called that diarrhea and reached for the loperamide, which would\'ve made the impaction worse. Your bowel record and your training told you the truth. That\'s exactly why we track."',
            '',
            '**Discussion:** Naomi\'s save rested on two pillars of this course: faithful tracking and understanding the complications. Her honest bowel record made the five-day gap undeniable, so the "diarrhea" couldn\'t fool her. She recognized overflow for what it was, reported it specifically, and stayed firmly in scope — no anti-diarrheal, no self-directed laxative, and never any manual removal. She delivered the daily prevention, kept the record, recognized the trap, and escalated. In a topic easy to dismiss, her diligence prevented real harm — and that\'s bowel care done right.',
          ].join('\n');

          return doc('Case Study', [
            { id: 'bhc-s11-heading', type: 'heading', level: 1, text: 'Case Study' },
            pendingAudio(
              'bhc-s11-audio',
              'The "Diarrhea" That Wasn\'t',
              `${ASSET_BASE}/s11-case-podcast.mp3`,
              caseNarrative,
              '/assets/courses/bowel-health-constipation/s11-case-podcast.mp3',
            ),
            {
              id: 'bhc-s11-image',
              type: 'image',
              src: `${ASSET_BASE}/s11-hero.jpg`,
              caption:
                'Recognizing the pattern — how tracking and reporting caught a bowel problem in time.',
            },
            {
              id: 'bhc-s11-case-study',
              type: 'case_study',
              title: 'The "Diarrhea" That Wasn\'t',
              residentProfile:
                'Mr. Solomon, 80, took an opioid pain medication for chronic back pain — a medication well known to slow the bowel. His CNA, Naomi, kept his bowel record faithfully, and she knew his opioid put him at high risk for constipation, so she watched it closely.',
              scenario: [
                '**The record that told the story:** Naomi\'s tracking showed a worrying trend: Mr. Solomon hadn\'t had a real, full bowel movement in five days. He\'d been complaining of belly discomfort and feeling full and bloated, and his appetite had dropped. Naomi had already been encouraging fluids, fiber, and movement, and had flagged the lengthening gap to the nurse, who was monitoring.',
                '**The deceptive turn:** On the fifth day, things seemed to change — Mr. Solomon began having frequent small leaks of watery, loose stool. A coworker was relieved: "Oh good, he finally went — it\'s turned to diarrhea. Let\'s get him something to stop it before he makes a mess." It was the natural read: watery stool looks like diarrhea, and the obvious response is to stop the diarrhea.',
                '**What Naomi knew:** But Naomi\'s bowel record told a different story, and her training clicked into place. Five days with no real bowel movement. Belly discomfort and fullness. And now watery stool leaking out. That wasn\'t diarrhea — that was overflow: liquid stool sneaking around a hard impaction stuck in his bowel. Treating it as diarrhea, with medication to stop it, would have trapped the blockage in place and made everything worse. The record was the key — without it, the "diarrhea" would have been convincing.',
                '**What Naomi did:** Naomi reported it correctly and specifically: "Mr. Solomon hasn\'t had a real BM in five days per my record, he\'s had belly discomfort and bloating, and now he\'s leaking small amounts of watery stool. I think this is overflow around an impaction, not diarrhea — please assess him before anything\'s given for diarrhea." She did not give any anti-diarrhea medication, did not give a laxative on her own, and absolutely did not attempt any manual removal — she knew that was the nurse\'s procedure.',
                '**The resolution:** The nurse assessed Mr. Solomon, confirmed a fecal impaction, and managed it appropriately and safely, with the precautions the procedure requires. Once the impaction was cleared, his discomfort resolved, his appetite returned, and his bowel routine was strengthened — more aggressive prevention given his opioid, with closer tracking — so it wouldn\'t build again.',
                '**The outcome:** Because Naomi read through the overflow trap, Mr. Solomon was treated for the real problem — a blockage — instead of being given medication that would have worsened it. The nurse told her: "Half of people would\'ve called that diarrhea and reached for the loperamide, which would\'ve made the impaction worse. Your bowel record and your training told you the truth. That\'s exactly why we track."',
                '**Discussion:** Naomi\'s save rested on two pillars of this course: faithful tracking and understanding the complications. Her honest bowel record made the five-day gap undeniable, so the "diarrhea" couldn\'t fool her. She recognized overflow for what it was, reported it specifically, and stayed firmly in scope — no anti-diarrheal, no self-directed laxative, and never any manual removal. She delivered the daily prevention, kept the record, recognized the trap, and escalated. In a topic easy to dismiss, her diligence prevented real harm — and that\'s bowel care done right.',
              ].join('\n\n'),
            },
            {
              id: 'bhc-s11-reflection-1',
              type: 'reflection',
              prompt:
                'The watery stool looked exactly like diarrhea. What did Naomi\'s bowel record and training tell her was really happening, and why would treating it as diarrhea have been dangerous?',
              minCharacters: 50,
            },
            {
              id: 'bhc-s11-reflection-2',
              type: 'reflection',
              prompt:
                'Naomi recognized the impaction but did not attempt to remove it. Why is that boundary so important, and what was her correct role?',
              minCharacters: 50,
            },
            {
              id: 'bhc-s11-rp-text',
              type: 'text',
              body: 'Reflect on the case study in the previous lesson. Your written responses help you apply what you learned about the overflow trap, faithful bowel tracking, and staying within scope.',
            },
            {
              id: 'bhc-s11-kc2-check',
              type: 'knowledge_check',
              question:
                'A CNA does not diagnose, does not decide on, give, or adjust laxatives or other medications, and never performs the manual removal of a fecal impaction — that is a nurse procedure. Your bowel record shows Mr. Solomon hasn\'t had a real bowel movement in five days, and he\'s been complaining of belly discomfort and feeling full. Today he\'s having frequent small leaks of watery, loose stool. A coworker says, "Oh good, he\'s finally going — looks like diarrhea now. Maybe we should ask for something to stop the diarrhea." What SHOULD the CNA do?',
              options: [
                {
                  id: 'agree-antidiarrhea',
                  label: 'Agree it\'s diarrhea and ask for anti-diarrhea medication',
                },
                {
                  id: 'report-impaction-overflow',
                  label:
                    'Report it as possible impaction with overflow — five days constipated plus belly discomfort plus new watery leaking',
                },
                {
                  id: 'stop-tracking',
                  label: 'Assume the constipation resolved itself and stop tracking',
                },
                {
                  id: 'give-laxative',
                  label: 'Give him a laxative to help move things along',
                },
              ],
              correctOptionId: 'report-impaction-overflow',
              explanation:
                'Exactly right. This is the classic overflow trap. Five days with no real bowel movement, plus belly discomfort and fullness, plus new frequent watery leaking, points to a fecal impaction — liquid stool sneaking around a hard mass. Giving anti-diarrhea medication or a self-directed laxative would worsen it. Report it to the nurse as possible impaction with the full picture. Manual removal, if needed, is strictly a nurse procedure, never a CNA\'s.',
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
            { id: 'bhc-s12-heading', type: 'heading', level: 1, text: 'Conclusion' },
            {
              id: 'bhc-s12-video',
              type: 'video',
              title: 'Conclusion',
              videoUrl: `${ASSET_BASE}/s12-conclusion.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s12-conclusion.mp4`,
            },
            {
              id: 'bhc-s12-image',
              type: 'image',
              src: `${ASSET_BASE}/s12-hero.jpg`,
              caption: 'Five things that matter most in bowel health and constipation care.',
            },
            {
              id: 'bhc-s12-narration',
              type: 'text',
              body: [
                'You\'ve reached the end. Let\'s lock in the five things that matter most for bowel health and constipation care.',
                '**One.** Constipation is common and not minor — it causes real misery, and in older adults often shows up as confusion or agitation. Left unmanaged it can progress to impaction and even a life-threatening bowel obstruction. "Normal" is defined per resident, so watch for changes from each person\'s baseline.',
                '**Two.** The daily foundation is the treatment. Fiber, fluids within each plan, movement, and a regular, private, unhurried toileting routine — often after meals — prevent and relieve most constipation. This unglamorous daily care is your most powerful tool.',
                '**Three.** Track honestly — it\'s an early-warning system. Keep an accurate bowel record, know your facility\'s threshold for concern, and report when a resident reaches it, so constipation is caught before it becomes impaction. Never guess it, never skip it.',
                '**Four.** Know the trap and the emergency. New "diarrhea" in a constipated resident is often overflow leaking around an impaction — report it as possible impaction, never just treat it as loose stool. And severe belly pain with a distended belly, vomiting, and nothing passing is a bowel obstruction emergency — get help immediately, nothing by mouth.',
                '**Five.** Honor your scope, with dignity. You never diagnose, never give or adjust laxatives, and never manually remove an impaction — that\'s the nurse. But you deliver the daily foundation, track honestly, recognize the complications, and protect dignity in private care — quietly preventing real suffering.',
              ].join('\n\n'),
            },
            {
              id: 'bhc-s12-summary',
              type: 'summary',
              title: 'Five things that matter most',
              items: [
                'Constipation is common and not minor — watch for changes from each resident\'s baseline.',
                'The daily foundation is the treatment — fiber, fluids, movement, and a regular toileting routine.',
                'Track honestly — the bowel record catches constipation before it becomes impaction.',
                'Know the overflow trap and obstruction emergency — report impaction, escalate obstruction immediately.',
                'Honor your scope with dignity — deliver the foundation, track, recognize, and report.',
              ],
            },
            {
              id: 'bhc-s12-whn-text',
              type: 'text',
              body: 'Ten questions are waiting. Everything on them was covered here. You\'re ready. Trust what you\'ve learned, and show what you know.',
            },
            {
              id: 'bhc-s12-cr-text',
              type: 'text',
              body: 'This course provides one hour of continuing education credit through CAL ACE Nursing Academy, an approved CDPH continuing education provider, NAC number 7384. Your certificate is generated automatically when you pass the knowledge check.',
            },
            {
              id: 'bhc-s12-cr-callout',
              type: 'callout',
              variant: 'info',
              title: 'Scope reminder',
              body: 'CNAs support healthy bowel habits, track, recognize, and report. CNAs do not diagnose, give or adjust laxatives, or manually remove impactions.',
            },
            {
              id: 'bhc-s12-ca-text',
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

export async function seedCourse36BowelHealthConstipation(
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
  console.log(`Seeding Course 36 (Bowel Health & Constipation) as DRAFT — slug "${COURSE_SLUG}"…`);

  try {
    const result = await seedCourse36BowelHealthConstipation(prisma);
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
