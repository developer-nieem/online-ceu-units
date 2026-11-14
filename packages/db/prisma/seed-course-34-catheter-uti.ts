/**
 * Seed Course 34 — Catheter Care & Preventing Urinary Tract Infections (DRAFT).
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-34-catheter-uti
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
const COURSE_SLUG = 'catheter-care-uti';
const COURSE_TITLE = 'Catheter Safety and UTI Prevention in Daily Care';
const COURSE_SUMMARY =
  'Learn the CNA\'s role in caring for a resident with a urinary catheter and in preventing urinary tract infections — keeping the closed drainage system sacred, meticulous catheter and perineal care, recognizing UTIs in older adults (including the atypical confusion picture), and hydration as prevention. CNAs do not insert, remove, or irrigate catheters, do not diagnose, and do not give medications.';

const ASSET_BASE = `/assets/courses/catheter-care-uti`;


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
    'Explain why catheters raise infection risk',
    'Provide correct catheter care and positioning',
    'Prevent urinary tract infections',
    'Recognize UTIs in older adults',
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
  heroImage: '/assets/courses/catheter-care-uti/hero-banner.png',
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
    title: 'Understanding Catheter Care & UTIs',
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: 'Introduction',
        sortOrder: 0,
        buildContent: () =>
          doc('Welcome', [
            { id: 'cu-s01-heading', type: 'heading', level: 1, text: 'Welcome' },
            {
              id: 'cu-s01-video',
              type: 'video',
              title: 'Introduction',
              videoUrl: '/assets/courses/catheter-care-uti/s01-intro.mp4',
              placeholderNote: 'Pending upload: /assets/courses/catheter-care-uti/s01-intro.mp4',
            },
            {
              id: 'cu-s01-image',
              type: 'image',
              src: `${ASSET_BASE}/s01-hero.jpg`,
              caption:
                'Catheter care and UTIs — protecting a resident from the infection risk a catheter carries.',
            },
            {
              id: 'cu-s01-narration',
              type: 'text',
              body: [
                'Welcome to CAL ACE Nursing Academy.',
                'This course is about urinary catheters and urinary tract infections — two subjects that belong together, because the catheter is the single biggest risk factor for the infections, and the CNA\'s daily care is the single biggest protection.',
                'A urinary catheter is a thin, flexible tube placed into the bladder to drain urine into a collection bag. Some residents need one for medical reasons — after surgery, for certain bladder problems, or to protect healing skin. The catheter does an important job. But it comes with a serious built-in danger.',
                'Here\'s the danger, plainly. The urinary system is normally a closed, protected system — germs have a hard time getting in. A catheter changes that. It\'s an open door: a tube running from the outside world directly into the bladder, a highway that germs can travel. That\'s why catheter-associated urinary tract infections are among the most common healthcare infections there are — and why they\'re taken so seriously. These infections cause real suffering, hospitalizations, and in frail elderly residents, they can turn deadly when they spread to the blood.',
                'The good news — and the reason this course exists — is that most of these infections are preventable, and the prevention is daily CNA work. Keeping the drainage system closed and clean. Keeping the bag below the bladder, always, and never on the floor. Keeping the tubing free of kinks and loops. Meticulous daily catheter and perineal care. Good hand hygiene. And good hydration, which flushes the system. Every one of those is in your hands.',
                'This course also teaches you to recognize a urinary tract infection when one happens — including the way UTIs show up in older adults, which often isn\'t the burning and urgency younger people feel. In the elderly, a UTI frequently announces itself as sudden confusion, new weakness, or a resident who\'s just "off." Recognizing that picture gets infections treated early, before they become dangerous.',
                'Your scope is clear. A CNA provides daily catheter and perineal care, keeps the drainage system positioned and protected, watches the urine and the resident, supports hydration, and reports faithfully. A CNA does not insert, remove, or irrigate catheters, does not diagnose infections, and does not give medications.',
                'By the end of this course, you will be able to: explain why catheters raise infection risk. Provide correct catheter care and positioning. Prevent urinary tract infections. Recognize UTIs in older adults. And know your scope.',
                'There is a ten-question knowledge check at the end. Everything on it is covered here. Let\'s begin.',
              ].join('\n\n'),
            },
            {
              id: 'cu-s01-ci-text',
              type: 'text',
              body: [
                'This course teaches the CNA\'s role in caring for a resident with a urinary catheter and in preventing urinary tract infections — keeping the closed drainage system sacred, meticulous catheter and perineal care, recognizing UTIs in older adults (including the atypical confusion picture), and hydration as prevention.',
                'Let\'s be clear about your role. A CNA provides daily catheter and perineal care, keeps the drainage system positioned and protected, watches the urine and the resident, supports hydration, and reports faithfully. A CNA does not insert, remove, or irrigate catheters, does not diagnose infections, and does not give medications. Those are nursing and physician tasks. But none of them can happen without your careful observation and faithful reporting first.',
              ].join('\n\n'),
            },
            {
              id: 'cu-s01-ci-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of this course',
              body: 'CNAs HOLD THE STANDARDS, GIVE DAILY CARE, WATCH, and REPORT. CNAs do not insert, remove, or irrigate catheters, diagnose infections, or give medications.',
            },
            {
              id: 'cu-s01-lo-text',
              type: 'text',
              body: 'By the end of this course, you will be able to:',
            },
            {
              id: 'cu-s01-lo-summary',
              type: 'summary',
              title: 'Learning objectives',
              items: [
                'Explain why catheters raise infection risk.',
                'Provide correct catheter care and positioning.',
                'Prevent urinary tract infections.',
                'Recognize UTIs in older adults.',
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
            { id: 'cu-s02-heading', type: 'heading', level: 1, text: 'Key terms' },
            {
              id: 'cu-s02-image',
              type: 'image',
              src: `${ASSET_BASE}/s02-hero.jpg`,
              caption:
                'Key terms — indwelling catheter, closed system, CAUTI, urosepsis, drainage bag.',
            },
            {
              id: 'cu-s02-reveal-catheter',
              type: 'reveal_card',
              frontTitle: 'Urinary Catheter',
              frontBody: 'KATH-eh-ter',
              backTitle: 'Urinary Catheter',
              backBody:
                'A thin, flexible tube placed into the bladder to drain urine into a collection bag. An indwelling catheter — often called a Foley — stays in place, held by a small balloon inside the bladder. It\'s placed and removed only by the nurse.',
            },
            {
              id: 'cu-s02-reveal-uti',
              type: 'reveal_card',
              frontTitle: 'Urinary Tract Infection (UTI)',
              frontBody: 'U-T-I',
              backTitle: 'Urinary Tract Infection (UTI)',
              backBody:
                'An infection anywhere in the urinary system — most often the bladder. Caused by germs getting in and multiplying. UTIs are very common in older adults, and the most common infection associated with catheters.',
            },
            {
              id: 'cu-s02-reveal-cauti',
              type: 'reveal_card',
              frontTitle: 'CAUTI',
              frontBody: 'KAW-tee',
              backTitle: 'CAUTI',
              backBody:
                'Catheter-associated urinary tract infection — a UTI caused by the catheter giving germs a pathway into the bladder. CAUTIs are among the most common healthcare infections, and most are preventable with good daily catheter care.',
            },
            {
              id: 'cu-s02-reveal-closed-drainage',
              type: 'reveal_card',
              frontTitle: 'Closed Drainage System',
              frontBody: 'Closed drainage system',
              backTitle: 'Closed Drainage System',
              backBody:
                'The sealed pathway from catheter to tubing to collection bag. Keeping it closed — never disconnecting it, keeping connections clean — keeps germs out. Breaking the closed system opens the door to infection.',
            },
            {
              id: 'cu-s02-reveal-drainage-bag',
              type: 'reveal_card',
              frontTitle: 'Drainage Bag',
              frontBody: 'Drainage bag',
              backTitle: 'Drainage Bag',
              backBody:
                'The bag that collects urine from the catheter. The cardinal rules: keep it below the level of the bladder at all times so urine flows down and never back up — and never let it touch or rest on the floor, where germs live. Empty it as directed, without the spout touching anything.',
            },
            {
              id: 'cu-s02-reveal-perineal-care',
              type: 'reveal_card',
              frontTitle: 'Perineal Care',
              frontBody: 'Pair-ih-NEE-al',
              backTitle: 'Perineal Care',
              backBody:
                'Gentle, thorough cleaning of the genital area — and for a catheter resident, careful cleaning around where the catheter enters the body, always wiping away from that point. Daily perineal and catheter care removes the germs that would otherwise climb the tube.',
            },
            {
              id: 'cu-s02-reveal-urosepsis',
              type: 'reveal_card',
              frontTitle: 'Urosepsis',
              frontBody: 'Yoor-oh-SEP-sis',
              backTitle: 'Urosepsis',
              backBody:
                'A life-threatening emergency where a urinary infection spreads into the bloodstream, causing the body-wide crisis called sepsis. Fever or abnormally low temperature, confusion, rapid breathing and heartbeat, and looking very ill — urosepsis needs emergency care. Preventing and catching UTIs early prevents it.',
            },
            {
              id: 'cu-s02-reveal-hydration',
              type: 'reveal_card',
              frontTitle: 'Hydration',
              frontBody: 'Hydration',
              backTitle: 'Hydration',
              backBody:
                'Keeping the body supplied with enough fluid. For the urinary system, good hydration is protective: plenty of fluid means plenty of urine flow, which continuously flushes germs out of the bladder and tubing. Encouraging fluids — as each resident\'s care plan allows — is real UTI prevention.',
            },
            {
              id: 'cu-s02-kc1-check-cauti',
              type: 'knowledge_check',
              question: 'Match the term: a urinary infection caused by the catheter\'s germ pathway',
              options: [
                { id: 'cauti', label: 'CAUTI' },
                { id: 'closed-drainage-system', label: 'Closed drainage system' },
                { id: 'urosepsis', label: 'Urosepsis' },
              ],
              correctOptionId: 'cauti',
              explanation:
                'CAUTI. Catheter-associated urinary tract infection — a UTI caused by the catheter giving germs a pathway into the bladder. CAUTIs are among the most common healthcare infections, and most are preventable with good daily catheter care.',
              requiredForCompletion: true,
            },
            {
              id: 'cu-s02-kc1-check-closed-drainage',
              type: 'knowledge_check',
              question:
                'Match the term: the sealed catheter-to-bag pathway that keeps germs out',
              options: [
                { id: 'cauti', label: 'CAUTI' },
                { id: 'closed-drainage-system', label: 'Closed drainage system' },
                { id: 'urosepsis', label: 'Urosepsis' },
              ],
              correctOptionId: 'closed-drainage-system',
              explanation:
                'Closed drainage system. The sealed pathway from catheter to tubing to collection bag. Keeping it closed — never disconnecting it, keeping connections clean — keeps germs out. Breaking the closed system opens the door to infection.',
              requiredForCompletion: true,
            },
            {
              id: 'cu-s02-kc1-check-urosepsis',
              type: 'knowledge_check',
              question:
                'Match the term: a urinary infection spreading to the blood — an emergency',
              options: [
                { id: 'cauti', label: 'CAUTI' },
                { id: 'closed-drainage-system', label: 'Closed drainage system' },
                { id: 'urosepsis', label: 'Urosepsis' },
              ],
              correctOptionId: 'urosepsis',
              explanation:
                'Urosepsis. A life-threatening emergency where a urinary infection spreads into the bloodstream, causing the body-wide crisis called sepsis. Preventing and catching UTIs early prevents it.',
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
            { id: 'cu-s03-heading', type: 'heading', level: 1, text: 'Statistics' },
            pendingAudio(
              'cu-s03-audio',
              'Catheters and UTIs: The Most Common Infection — and the Most Preventable',
              `${ASSET_BASE}/s03-stats-podcast.mp3`,
              [
                'Catheters and UTIs: The Most Common Infection — and the Most Preventable',
                '',
                'Urinary tract infections are among the most common infections in long-term care — by many counts the single most common bacterial infection in nursing home residents. Older adults are especially prone to them, and older women most of all. And when a resident has a urinary catheter, the risk multiplies dramatically.',
                '',
                'Here\'s why the catheter matters so much. The urinary system is normally closed and well-defended. A catheter creates a permanent opening — a tube from the outside world into the bladder that germs can climb, both inside the tube and along its outside surface. The risk is so direct that it accumulates daily: with each day a catheter remains in place, the chance of bacteria reaching the bladder grows. Catheter-associated urinary tract infections — CAUTIs — are among the most common healthcare-associated infections in the country, and they\'re a major focus of infection-control programs everywhere, because they cause real harm: discomfort, antibiotics, hospitalizations.',
                '',
                'And sometimes worse. In a frail older resident, a urinary infection can spread to the bloodstream — urosepsis — a life-threatening emergency. Urinary sources are one of the leading causes of sepsis in the elderly. A UTI caught early is treated with antibiotics; a UTI missed can become a fight for life. This is why early recognition matters so much — and why it matters that in older adults, UTIs often don\'t look like UTIs: instead of burning and urgency, the first signs are frequently sudden confusion, new weakness, falls, or a resident who\'s simply "not themselves."',
                '',
                'Now the empowering fact: the majority of catheter-associated infections are considered preventable — and the prevention is overwhelmingly daily, hands-on care. Keeping the drainage system closed. Keeping the bag below the bladder and off the floor. Keeping tubing kink-free so urine flows. Daily catheter and perineal care. Rigorous hand hygiene before and after. Good hydration to keep urine flushing through. Every item on that list is CNA work. Infection-control studies consistently show that when this basic care is done faithfully, CAUTI rates fall sharply.',
                '',
                'The bottom line: UTIs are the most common infection in long-term care, catheters multiply the risk daily, urosepsis can kill — and the faithful daily care of CNAs is the main thing standing between residents and these preventable infections.',
              ].join('\n'),
              '/assets/courses/catheter-care-uti/s03-stats-podcast.mp3',
            ),
            {
              id: 'cu-s03-image',
              type: 'image',
              src: `${ASSET_BASE}/s03-hero.jpg`,
              caption:
                'Catheters are common — and a leading source of preventable infection in care.',
            },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: 'Fundamentals',
        sortOrder: 3,
        buildContent: () =>
          doc('Fundamentals', [
            { id: 'cu-s04-heading', type: 'heading', level: 1, text: 'Fundamentals' },
            {
              id: 'cu-s04-video',
              type: 'video',
              title: 'Fundamentals',
              videoUrl: '/assets/courses/catheter-care-uti/s04-fundamentals.mp4',
              placeholderNote: 'Pending upload: /assets/courses/catheter-care-uti/s04-fundamentals.mp4',
            },
            {
              id: 'cu-s04-image',
              type: 'image',
              src: `${ASSET_BASE}/s04-hero.jpg`,
              caption:
                'How a urinary catheter works, and why the closed drainage system must stay intact.',
            },
            {
              id: 'cu-s04-narration',
              type: 'text',
              body: [
                '**The urinary system\'s natural defenses**',
                'The urinary system normally defends itself well. Urine flows one direction — down and out — physically flushing germs away. The system is closed to the outside except briefly during urination. These defenses are why healthy bladders usually stay infection-free.',
                '**What a catheter changes**',
                'A catheter bypasses those defenses. It holds the system open to the outside world around the clock, and gives germs two routes to the bladder: climbing up the inside of the tube, and creeping along its outside surface. The natural flushing is altered too. None of this means catheters are bad — they\'re sometimes necessary — but it means a catheter resident\'s protection now depends on care, not nature.',
                '**Why gravity is your ally**',
                'Urine must always flow downhill — from bladder, through tubing, into the bag. That\'s why the bag stays below the level of the bladder at all times: standing, sitting, lying, and during transfers. If the bag rises above the bladder, or tubing loops and kinks trap urine, urine can pool or even flow backward toward the bladder — carrying germs with it. Gravity working for you is infection prevention; gravity working against you is an open invitation.',
                '**Why the floor is forbidden**',
                'The drainage bag must never touch or rest on the floor. Floors are among the germiest surfaces in any facility, and a bag resting on the floor lets germs contaminate the system at the drainage spout and bag surface. Keep the bag on its proper hanger — below the bladder, off the floor — every time, including during transfers and walks.',
                '**Why the system stays closed**',
                'The catheter, tubing, and bag form a closed system — sealed against germs. Every disconnection breaks that seal and lets germs in. So the system is never disconnected for convenience — not to dress, not to transfer, not to reposition. Work around the intact system. If a connection comes apart or leaks, that\'s reported to the nurse — never just reconnected and forgotten.',
                '**Why daily cleaning matters**',
                'Germs gather where the catheter enters the body, and from there they can creep along the tube. Daily catheter and perineal care — gentle, thorough cleaning around the entry point, always wiping away from it, with clean hands and gloves — removes those germs before they travel. It\'s quiet, routine work that directly prevents infection.',
                '**Why hydration flushes the system**',
                'Good fluid intake keeps urine flowing steadily through the bladder and tubing — and flowing urine flushes germs out before they can settle and multiply. That\'s why encouraging fluids, within each resident\'s care plan, is genuine UTI prevention — for catheter residents and non-catheter residents alike. A well-hydrated urinary system defends itself better.',
              ].join('\n\n'),
            },
            {
              id: 'cu-s04-bag-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'The bag NEVER touches the floor',
              body: 'Keep the bag below the level of the bladder at all times — in bed, in the chair, during transfers and walks. Never disconnect the closed system for convenience.',
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
            { id: 'cu-s05-heading', type: 'heading', level: 1, text: 'Signs & Symptoms' },
            {
              id: 'cu-s05-image',
              type: 'image',
              src: `${ASSET_BASE}/s05-hero.jpg`,
              caption:
                'Recognizing trouble — the signs of a UTI, and why they look different in older adults.',
            },
            {
              id: 'cu-s05-narration',
              type: 'text',
              body: [
                'In this care, your eyes are on two things: the urine itself, and the resident. Let\'s learn what each can tell you — including the way UTIs hide in older adults.',
                '**Reading the urine**',
                'For a catheter resident, the bag gives you a constant window — learn to read it. Healthy urine is clear and pale to medium yellow, flowing steadily. Report: urine that turns cloudy or develops sediment. A strong, foul smell. Blood — pink, red, or dark urine. Urine becoming dark and concentrated, which suggests dehydration. And critically: little or no urine flowing into the bag — first check for kinks, loops, or the resident lying on the tubing, and if flow doesn\'t resume, report it promptly, because a blocked catheter backs urine up painfully and dangerously.',
                '**The classic UTI picture**',
                'The classic signs of a urinary tract infection, which residents without catheters may describe: burning or pain with urination. Needing to go suddenly, urgently, and often, while passing only small amounts. Lower belly discomfort or pressure. Cloudy, smelly, or bloody urine. Sometimes low back or side pain, which can mean the infection is reaching the kidneys. Any of these — report promptly.',
                '**The elderly picture: the UTI that looks like confusion**',
                'Now the picture you must never miss. In older adults, a UTI often skips the classic signs entirely. Instead, it shows up as: sudden confusion or worsened confusion. New agitation or unusual behavior. New weakness, unsteadiness, or falls. Loss of appetite. New or worsened incontinence. A resident who is simply, suddenly "not themselves." Fever may be present — but often it isn\'t. In an older resident, a sudden change in mind or function is a possible UTI until proven otherwise — report it promptly so it can be checked. This is one of the most valuable recognitions in elder care.',
                '**Urosepsis: the infection reaching the blood**',
                'And the emergency: urosepsis, when a urinary infection spreads to the bloodstream. The signs: fever and shaking chills — or, in some elders, an abnormally LOW temperature. Rapid breathing and rapid heartbeat. Worsening confusion sliding toward unresponsiveness. Skin that\'s flushed and hot, or pale, cold, and clammy. Very low energy, looking gravely ill. This is life-threatening — activate emergency help immediately. Every UTI caught early is a urosepsis prevented.',
                '**Summary**',
                'Four pictures. The urine: cloudy, foul, bloody, dark, or not flowing — check the tubing, report. Classic UTI: burning, urgency, frequency, lower belly discomfort — report. The elderly picture: sudden confusion, weakness, falls, or "not themselves" — a possible UTI, report promptly. Urosepsis: fever or low temperature, rapid breathing and pulse, worsening confusion, gravely ill — emergency help now.',
                'The rule underneath it all: watch the urine and watch the resident — and in an elder, a sudden change in mind or function means think UTI and report.',
              ].join('\n\n'),
            },
            {
              id: 'cu-s05-elderly-callout',
              type: 'callout',
              variant: 'warning',
              title: 'The elderly UTI picture',
              body: 'In older adults, a UTI often appears as sudden confusion, new weakness, falls, or a resident who\'s "not themselves" — report it promptly.',
            }
          ]),
      },
      {
        slug: 's06-causes',
        title: 'Causes',
        sortOrder: 5,
        buildContent: () =>
          doc('Causes', [
            { id: 'cu-s06-heading', type: 'heading', level: 1, text: 'Causes' },
            pendingAudio(
              'cu-s06-audio',
              'How UTIs Happen — and the Everyday Lapses That Invite Them',
              `${ASSET_BASE}/s06-causes-podcast.mp3`,
              [
                'How UTIs Happen — and the Everyday Lapses That Invite Them',
                '',
                'Urinary tract infections happen when germs — most often bacteria that normally live in the bowel — get into the urinary system and multiply. Understanding how they get in shows exactly how to keep them out.',
                '',
                'In residents without catheters, germs typically enter at the urinary opening and climb upward. Several things make this easier in older adults: incomplete bladder emptying that leaves urine sitting still, where germs multiply; weakened defenses with age; for women, anatomy that gives germs a shorter climb, and changes after menopause; for men, prostate enlargement that blocks complete emptying; constipation pressing on the bladder; and poor hygiene — particularly wiping back-to-front, which carries bowel germs toward the urinary opening. Dehydration concentrates urine and weakens the natural flushing. Each of these maps to care: front-to-back cleaning, good perineal hygiene, hydration, bowel regularity, and complete toileting.',
                '',
                'With a catheter, everything accelerates, because the tube gives germs a permanent highway. And here is what matters most for daily care: most catheter infections trace back to everyday lapses. A drainage bag raised above the bladder during a transfer, letting urine flow backward. A bag resting on the floor, picking up germs at the spout. Tubing kinked or looped so urine pools and stagnates. The closed system disconnected for convenience while dressing or moving a resident. Hands not washed, or gloves not changed, between residents and tasks. Catheter and perineal care skipped or done carelessly. The drainage spout touching the container, the floor, or anything at all while emptying. None of these lapses looks dramatic in the moment — and each one is an invitation germs accept.',
                '',
                'There\'s also the matter of time: every additional day a catheter stays in adds risk, which is why care teams regularly ask whether a catheter is still needed, and why catheters are never kept for convenience.',
                '',
                'Here\'s what this means for the CNA. Almost every cause on this list is answered by a CNA habit: bag below the bladder always, never on the floor, tubing free and flowing, system never disconnected, hands washed and gloves changed, daily catheter and perineal care done thoroughly, front-to-back cleaning, hydration encouraged, bowels supported, and prompt reporting. UTI prevention isn\'t a program on a poster — it\'s the sum of small, faithful habits, done every time.',
              ].join('\n'),
              '/assets/courses/catheter-care-uti/s06-causes-podcast.mp3',
            ),
            {
              id: 'cu-s06-image',
              type: 'image',
              src: `${ASSET_BASE}/s06-hero.jpg`,
              caption:
                'What raises infection risk — breaks in the system, poor hygiene, and blocked flow.',
            },
          ]),
      },
      {
        slug: 's07-role',
        title: 'CNA Role & Best Practices',
        sortOrder: 6,
        buildContent: () =>
          doc('CNA Role & Best Practices', [
            { id: 'cu-s07-heading', type: 'heading', level: 1, text: 'CNA Role & Best Practices' },
            {
              id: 'cu-s07-image',
              type: 'image',
              src: `${ASSET_BASE}/s07-hero.jpg`,
              caption:
                'CNA scope — hygiene, positioning, and reporting; never insert, irrigate, or adjust a catheter.',
            },
            {
              id: 'cu-s07-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of practice',
              body: 'CNAs HOLD THE STANDARDS, GIVE DAILY CARE, WATCH, and REPORT. CNAs never insert, remove, irrigate, diagnose, or give medications.',
            },
            {
              id: 'cu-s07-narration',
              type: 'text',
              body: [
                'This section is the working core of the course: the catheter care standards, plus how UTIs are treated and what surrounds that treatment. As always, the rule that never bends comes first. A CNA does not insert, remove, or irrigate a catheter, does not diagnose infections, and does not give medications — including antibiotics.',
                '**The catheter care standards — your daily rules.** Learn these as law. Hand hygiene and gloves before and after any contact with the catheter or system. The bag below the level of the bladder at all times — in bed, in the chair, and during every transfer and walk — and never, ever on the floor. Tubing free of kinks and loops, not trapped under the resident, urine flowing freely. The closed system never disconnected for convenience; a leaking or separated connection is reported, not improvised. Daily catheter and perineal care: gentle, thorough cleaning around the entry point, wiping away from it, per your facility\'s procedure. The catheter secured as directed so it doesn\'t pull or tug — pulling injures the urethra and invites germs. Emptying the bag per schedule with the spout touching nothing, measuring accurately. Every standard, every shift.',
                '**When a UTI is treated.** UTIs are diagnosed by the team — often with a urine sample, which you may be asked to help collect exactly as instructed, since a contaminated sample misleads everyone. Treatment is antibiotics, managed by the nurse. Your part: support the full course by reporting refusals or missed doses, encourage fluids as allowed, watch whether the resident is improving — clearing confusion, returning appetite — or worsening, and report either way. Worsening on antibiotics, or signs of urosepsis, is urgent.',
                '**Catheter necessity.** Because risk grows daily, the team regularly reviews whether each catheter is still needed. You support this by reporting what you see — a resident doing better, or problems with the catheter — and never treating a catheter as a convenience item.',
                '**Comfort and dignity.** Catheter care is intimate care. Privacy, gentleness, and matter-of-fact warmth apply here exactly as in all personal care — and report any pain, pressure, or discomfort the resident has from the catheter itself.',
                'The scope point for this section: you never insert, remove, irrigate, diagnose, or medicate — but you hold the care standards every shift, help collect clean samples, support treatment, and report progress or worsening. The standards are the prevention.',
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
            { id: 'cu-s08-heading', type: 'heading', level: 1, text: 'Prevention & Risk Reduction' },
            {
              id: 'cu-s08-image',
              type: 'image',
              src: `${ASSET_BASE}/s08-hero.jpg`,
              caption:
                'Prevention — bag below the bladder, secure kink-free tubing, and careful peri-care.',
            },
            {
              id: 'cu-s08-narration',
              type: 'text',
              body: [
                'UTI prevention is the sum of small, faithful habits. Here are seven that protect every resident — with a catheter or without.',
                '**One. Wash your hands — every time, both times.** Hand hygiene before and after any contact with a catheter, drainage system, or perineal care, with gloves used and changed properly. Germs travel on hands; clean hands stop the most common delivery route there is.',
                '**Two. Keep the bag below the bladder — always — and off the floor.** In bed, in the chair, during transfers, during walks. Check it every time you move a resident, because transfers are when bags get raised and forgotten. And never let the bag rest on the floor. Gravity and cleanliness, every time.',
                '**Three. Keep the urine flowing.** Check tubing for kinks, loops, and trapping under the resident at every contact. Flowing urine flushes germs; pooled, stagnant urine breeds them. If urine stops flowing and freeing the tubing doesn\'t fix it, report promptly.',
                '**Four. Give meticulous daily catheter and perineal care.** Clean gently and thoroughly around the catheter entry point, wiping away from it, and provide good perineal hygiene for every resident — always front to back. This daily routine removes germs before they climb. Done well, it\'s powerful prevention; skipped, it\'s an open invitation.',
                '**Five. Encourage fluids — within each plan.** Steady hydration keeps urine flowing and flushing. Offer fluids through the day as each resident\'s care plan allows — remembering some residents, like kidney and heart residents, have limits. Hydration within the plan is real prevention.',
                '**Six. Support complete toileting and bowel regularity.** Help residents empty their bladders fully and regularly — unhurried toileting matters. And support bowel regularity with fluids, fiber, and movement as the plan allows, since constipation presses on the bladder and promotes UTIs. Report constipation.',
                '**Seven. Keep the system closed and treat it with respect.** Never disconnect the drainage system for convenience, never let the emptying spout touch anything, secure the catheter so it never pulls, and report any leak, separation, or damage rather than improvising. A closed, respected system keeps germs where they belong — outside.',
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
            { id: 'cu-s09-heading', type: 'heading', level: 1, text: 'Scenario & Reporting' },
            pendingAudio(
              'cu-s09-intro-audio',
              'Emergency response scenarios intro',
              `${ASSET_BASE}/s09-emergency-intro.mp3`,
              'With catheters and UTIs, the judgments that matter most are catching the blocked or mishandled system before it harms, and recognizing when an infection has turned into an emergency. You\'re about to work through two situations. Read each carefully, choose your action, and you\'ll get feedback right away. Keep the core ideas in mind: urine must flow downhill and freely — and a urinary infection that reaches the blood is a life-threatening emergency.',
              '/assets/courses/catheter-care-uti/s09-emergency-intro.mp3',
            ),
            {
              id: 'cu-s09-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-hero.jpg`,
              caption:
                'Two catheter judgments — drainage that has stopped, and a UTI turning dangerous.',
            },
            {
              id: 'cu-s09-scenario-tanaka-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-scenario-tanaka.jpg`,
              caption:
                'Flow stops again with lower-belly pressure: the catheter may be blocked — report promptly.',
            },
            {
              id: 'cu-s09-scenario-tanaka',
              type: 'scenario_question',
              prompt:
                'During afternoon rounds you notice Mr. Tanaka\'s drainage bag has collected almost no urine since morning, though he\'s been drinking normally. He says he feels uncomfortable pressure in his lower belly. You check and find the tubing looped up over the bed rail and kinked beneath his leg. You free and straighten the tubing — a moderate amount of urine flows, but the flow then slows to nearly nothing again, and he still feels pressure. What SHOULD the CNA do?',
              options: [
                {
                  id: 'wait-tomorrow',
                  label: 'Assume it\'s fixed since some urine came out, and check again tomorrow',
                  feedback:
                    'Freeing the tubing was right, but flow that doesn\'t properly resume plus lower-belly pressure means the catheter may be blocked, with urine backing up dangerously. Flushing or disconnecting it yourself breaks the closed system and is outside your scope, and restricting fluids only hides the problem. The right action: report it to the nurse promptly.',
                },
                {
                  id: 'report-promptly',
                  label:
                    'Report it to the nurse promptly — the catheter may be blocked and his bladder filling',
                  feedback:
                    'Right. Checking and freeing the tubing was the correct first move — kinks and loops are the most common cause of stopped flow. But when flow doesn\'t properly resume and the resident feels lower-belly pressure, the catheter itself may be blocked — and a blocked catheter means urine is backing up in the bladder, which is painful and can quickly become dangerous, even backing toward the kidneys. This is reported to the nurse promptly. You never disconnect or flush a catheter — irrigation is the nurse\'s procedure, and breaking the closed system invites infection. And restricting fluids hides the problem instead of fixing it. Free the tubing, and if flow doesn\'t resume — report, promptly.',
                  isRecommended: true,
                },
                {
                  id: 'flush-yourself',
                  label: 'Disconnect the tubing and flush it with water yourself',
                  feedback:
                    'Freeing the tubing was right, but flow that doesn\'t properly resume plus lower-belly pressure means the catheter may be blocked, with urine backing up dangerously. Flushing or disconnecting it yourself breaks the closed system and is outside your scope, and restricting fluids only hides the problem. The right action: report it to the nurse promptly.',
                },
                {
                  id: 'less-fluids',
                  label: 'Give him less to drink so less urine builds up',
                  feedback:
                    'Freeing the tubing was right, but flow that doesn\'t properly resume plus lower-belly pressure means the catheter may be blocked, with urine backing up dangerously. Flushing or disconnecting it yourself breaks the closed system and is outside your scope, and restricting fluids only hides the problem. The right action: report it to the nurse promptly.',
                },
              ],
              requiredForCompletion: true,
            },
            {
              id: 'cu-s09-scenario-beaumont-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-scenario-beaumont.jpg`,
              caption:
                'On antibiotics but now chills, fever, fast breathing, worsening confusion: urosepsis — get help now.',
            },
            {
              id: 'cu-s09-scenario-beaumont',
              type: 'scenario_question',
              prompt:
                'Mrs. Beaumont was started on antibiotics two days ago for a UTI. This evening she is much worse, not better: she\'s shaking with chills and feels very hot, she\'s breathing fast, her heart is racing, she\'s far more confused than this morning and barely responds to you, and she looks gravely ill. What is the BEST action?',
              options: [
                {
                  id: 'wait-antibiotics',
                  label: 'Note it and let the antibiotics keep working overnight',
                  feedback:
                    'Worsening this dramatically on antibiotics — chills, fever, rapid breathing and heartbeat, sharply worsening confusion, looking gravely ill — points to urosepsis, the infection reaching the blood. Waiting overnight, extra fluids, or sleep could be fatal; sepsis is measured in hours. The right action: activate emergency help immediately and stay with her.',
                },
                {
                  id: 'emergency-help',
                  label: 'Recognize possible urosepsis and activate emergency help immediately',
                  feedback:
                    'Exactly right. Shaking chills and fever, rapid breathing, racing heart, sharply worsening confusion sliding toward unresponsiveness, and looking gravely ill — in a resident with a known urinary infection — is the picture of urosepsis: the infection spreading into the bloodstream. Sepsis is a life-threatening emergency where every hour matters, and "the antibiotics are already on board" is not a reason to wait — worsening on antibiotics is itself an urgent warning. Activate emergency help immediately, stay with her, keep her safe, and report her UTI and antibiotic treatment to responders. Fast recognition of sepsis saves lives.',
                  isRecommended: true,
                },
                {
                  id: 'extra-fluids',
                  label: 'Give her extra fluids and recheck in a few hours',
                  feedback:
                    'Worsening this dramatically on antibiotics — chills, fever, rapid breathing and heartbeat, sharply worsening confusion, looking gravely ill — points to urosepsis, the infection reaching the blood. Waiting overnight, extra fluids, or sleep could be fatal; sepsis is measured in hours. The right action: activate emergency help immediately and stay with her.',
                },
                {
                  id: 'sleep-it-off',
                  label: 'Help her to bed to sleep it off',
                  feedback:
                    'Worsening this dramatically on antibiotics — chills, fever, rapid breathing and heartbeat, sharply worsening confusion, looking gravely ill — points to urosepsis, the infection reaching the blood. Waiting overnight, extra fluids, or sleep could be fatal; sepsis is measured in hours. The right action: activate emergency help immediately and stay with her.',
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
            { id: 'cu-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
              id: 'cu-s10-video',
              type: 'video',
              title: "The CNA's Role",
              videoUrl: '/assets/courses/catheter-care-uti/s10-cna-role.mp4',
              placeholderNote: 'Pending upload: /assets/courses/catheter-care-uti/s10-cna-role.mp4',
            },
            {
              id: 'cu-s10-image',
              type: 'image',
              src: `${ASSET_BASE}/s10-hero.jpg`,
              caption:
                'The CNA as the daily guard — every hygiene step and observation helps prevent CAUTI.',
            },
            {
              id: 'cu-s10-narration',
              type: 'text',
              body: [
                'Your role in this care is holding the standards, watching the urine and the resident, and reporting with speed and specifics. Let\'s walk through it.',
                '**Hold the standards every shift** Be unshakeable on the standards. Hands clean, gloves on, before and after. Bag below the bladder always — checked at every transfer, because transfers are where it goes wrong — and never on the floor. Tubing free, urine flowing, system closed, catheter secured, spout touching nothing. These habits feel small and repetitive — that\'s exactly what makes them work. Infection prevention is faithfulness, not heroics.',
                '**Give the daily care that removes the germs** Deliver meticulous daily catheter and perineal care: gentle, thorough cleaning around the entry point, wiping away from it; front-to-back perineal hygiene for every resident; privacy and matter-of-fact warmth throughout, because this is intimate care. And support the body\'s own defenses — fluids as each plan allows, complete unhurried toileting, bowel regularity.',
                '**Watch the urine and the resident** Read the bag at every contact: color, clarity, smell, blood, and flow — checking tubing first when flow stops, reporting when freeing it doesn\'t fix it. And watch the resident, remembering the elderly picture: sudden confusion, new weakness, falls, lost appetite, or "not themselves" may be a UTI announcing itself without a single classic symptom. In an elder, a sudden change in mind or function means think UTI — and report promptly.',
                '**Report with speed and specifics** Report like it matters, because it does. Cloudy or bloody urine, stopped flow, a leaking or separated system, catheter discomfort, sudden confusion or functional change, fever or chills — promptly and specifically. And know the emergency: fever or low temperature with rapid breathing, racing heart, and worsening confusion is possible urosepsis — emergency help immediately. Early reports turn UTIs into a course of antibiotics instead of a hospitalization.',
                'Now the boundary. You never insert, remove, or irrigate a catheter, never disconnect the closed system, never diagnose, and never give medications. When the system has a problem, you free tubing and check positioning — beyond that, you report; you don\'t improvise.',
                'Inside your role — standards held, daily care given, urine and resident watched, reports made fast — you are the main thing standing between residents and the most common infection in long-term care. Most CAUTIs are preventable. The prevention is you.',
              ].join('\n\n'),
            },
            {
              id: 'cu-s10-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Stay within scope',
              body: 'You never insert, remove, or irrigate a catheter, never disconnect the closed system, never diagnose, and never give medications. When the system has a problem, you free tubing and check positioning — beyond that, you report; you don\'t improvise.',
            }
          ]),
      },
      {
        slug: 's11-case-study',
        title: 'Case Study',
        sortOrder: 10,
        buildContent: () => {
          const caseNarrative = [
            'Mr. Tanaka, 81, had an indwelling catheter following a urinary blockage. His CNA, Rosa, had been trained well on catheter care and ran the standards like clockwork: hands and gloves, bag below the bladder, tubing free, system closed, daily care done gently and thoroughly.',
            '',
            '**The habit that caught it:** Rosa had one habit she credited to her training: she checked the whole drainage system at every single contact — not just during care, but every time she entered the room. Bag position. Tubing path. Urine color and flow. It took her ten seconds. One afternoon, those ten seconds mattered. Returning Mr. Tanaka from a physical therapy session, another staff member had hung his drainage bag high on the bed rail — well above the level of his bladder — to keep it "out of the way," with the tubing looped up and over.',
            '',
            '**What Rosa knew:** Rosa spotted it the moment she walked in. A bag above the bladder meant gravity was now working against Mr. Tanaka — urine could pool in the tubing or flow backward toward his bladder, carrying germs with it. It wasn\'t dramatic; nothing looked wrong to a casual eye. But she knew this was exactly the kind of quiet lapse that catheter infections are made of.',
            '',
            '**What Rosa did:** She fixed it immediately — rehung the bag properly below bladder level, straightened the tubing so urine flowed freely downhill, and checked the flow and the urine\'s appearance. Then she did the part that protected every future afternoon: she spoke, kindly, with the staff member who\'d hung the bag high, explaining the rule and the reason — "below the bladder, always, or urine can run backward and carry germs up" — and she mentioned the incident to the nurse so the team could reinforce the standard after therapy transports.',
            '',
            '**The watchfulness that followed:** Rosa also watched Mr. Tanaka a little more closely over the following days — urine clarity, his alertness, his appetite — knowing a lapse had occurred. His urine stayed clear, his flow steady, and he remained his quiet, cheerful self. No infection followed.',
            '',
            '**The outcome:** Nothing happened — and that was the victory. No cloudy urine, no fever, no sudden confusion, no antibiotics, no hospital. The nurse put it well at the next huddle: "Catheter infections don\'t usually come from one big mistake. They come from a bag hung high here, a kinked line there, a skipped cleaning somewhere else. Rosa caught one of those moments and closed it — and taught someone at the same time. That\'s what prevention actually looks like."',
            '',
            '**Discussion:** Rosa\'s case has no dramatic save, and that\'s the point. CAUTI prevention is the accumulation of unglamorous, faithful habits — and the willingness to fix and speak up about the small lapses that invite infection. Rosa\'s ten-second system check caught a quiet error; her correction restored gravity\'s protection; her kind teaching and her report turned one catch into a stronger team standard; and her follow-up watchfulness honored the fact that a lapse had occurred. She never exceeded her scope — she positioned, observed, corrected what was hers to correct, taught, and reported. The infection that never happened is the truest measure of catheter care done right.',
          ].join('\n');

          return doc('Case Study', [
            { id: 'cu-s11-heading', type: 'heading', level: 1, text: 'Case Study' },
            pendingAudio(
              'cu-s11-audio',
              'The Bag on the Bed Rail',
              `${ASSET_BASE}/s11-case-podcast.mp3`,
              caseNarrative,
              '/assets/courses/catheter-care-uti/s11-case-podcast.mp3',
            ),
            {
              id: 'cu-s11-image',
              type: 'image',
              src: `${ASSET_BASE}/s11-hero.jpg`,
              caption:
                'Recognizing the pattern — how careful catheter care and quick reporting protected a resident.',
            },
            {
              id: 'cu-s11-case-study',
              type: 'case_study',
              title: 'The Bag on the Bed Rail',
              residentProfile:
                'Mr. Tanaka, 81, had an indwelling catheter following a urinary blockage. His CNA, Rosa, had been trained well on catheter care and ran the standards like clockwork: hands and gloves, bag below the bladder, tubing free, system closed, daily care done gently and thoroughly.',
              scenario: [
                '**The habit that caught it:** Rosa had one habit she credited to her training: she checked the whole drainage system at every single contact — not just during care, but every time she entered the room. Bag position. Tubing path. Urine color and flow. It took her ten seconds. One afternoon, those ten seconds mattered. Returning Mr. Tanaka from a physical therapy session, another staff member had hung his drainage bag high on the bed rail — well above the level of his bladder — to keep it "out of the way," with the tubing looped up and over.',
                '**What Rosa knew:** Rosa spotted it the moment she walked in. A bag above the bladder meant gravity was now working against Mr. Tanaka — urine could pool in the tubing or flow backward toward his bladder, carrying germs with it. It wasn\'t dramatic; nothing looked wrong to a casual eye. But she knew this was exactly the kind of quiet lapse that catheter infections are made of.',
                '**What Rosa did:** She fixed it immediately — rehung the bag properly below bladder level, straightened the tubing so urine flowed freely downhill, and checked the flow and the urine\'s appearance. Then she did the part that protected every future afternoon: she spoke, kindly, with the staff member who\'d hung the bag high, explaining the rule and the reason — "below the bladder, always, or urine can run backward and carry germs up" — and she mentioned the incident to the nurse so the team could reinforce the standard after therapy transports.',
                '**The watchfulness that followed:** Rosa also watched Mr. Tanaka a little more closely over the following days — urine clarity, his alertness, his appetite — knowing a lapse had occurred. His urine stayed clear, his flow steady, and he remained his quiet, cheerful self. No infection followed.',
                '**The outcome:** Nothing happened — and that was the victory. No cloudy urine, no fever, no sudden confusion, no antibiotics, no hospital. The nurse put it well at the next huddle: "Catheter infections don\'t usually come from one big mistake. They come from a bag hung high here, a kinked line there, a skipped cleaning somewhere else. Rosa caught one of those moments and closed it — and taught someone at the same time. That\'s what prevention actually looks like."',
                '**Discussion:** Rosa\'s case has no dramatic save, and that\'s the point. CAUTI prevention is the accumulation of unglamorous, faithful habits — and the willingness to fix and speak up about the small lapses that invite infection. Rosa\'s ten-second system check caught a quiet error; her correction restored gravity\'s protection; her kind teaching and her report turned one catch into a stronger team standard; and her follow-up watchfulness honored the fact that a lapse had occurred. She never exceeded her scope — she positioned, observed, corrected what was hers to correct, taught, and reported. The infection that never happened is the truest measure of catheter care done right.',
              ].join('\n\n'),
            },
            {
              id: 'cu-s11-reflection-1',
              type: 'reflection',
              prompt:
                'Nothing bad happened to Mr. Tanaka — so what exactly did Rosa\'s ten-second habit and quick correction prevent, and why is "nothing happened" the goal of catheter care?',
              minCharacters: 50,
            },
            {
              id: 'cu-s11-reflection-2',
              type: 'reflection',
              prompt:
                'Rosa corrected the bag, taught the staff member kindly, and told the nurse. Why do all three steps matter, rather than just quietly fixing it?',
              minCharacters: 50,
            },
            {
              id: 'cu-s11-rp-text',
              type: 'text',
              body: 'Reflect on the case study in the previous lesson. Your written responses help you apply what you learned about quiet lapse prevention, the bag-below-the-bladder rule, and faithful reporting.',
            },
            {
              id: 'cu-s11-kc2-check',
              type: 'knowledge_check',
              question:
                'A CNA does not insert, remove, or irrigate catheters, does not diagnose infections, and does not give medications — including antibiotics. When a resident with a catheter says the tubing feels blocked and asks you to flush it with water, the CNA SHOULD:',
              options: [
                {
                  id: 'flush-catheter',
                  label: 'Flush the catheter with water as the resident requests',
                },
                {
                  id: 'report-nurse',
                  label: 'Report the concern to the nurse and let the nurse decide',
                },
                {
                  id: 'disconnect-tubing',
                  label: 'Disconnect the tubing to check for blockage yourself',
                },
                {
                  id: 'give-antibiotics',
                  label: 'Give antibiotic medication from the bedside as requested',
                },
              ],
              correctOptionId: 'report-nurse',
              explanation:
                'You never insert, remove, or irrigate a catheter, do not diagnose infections, and do not give medications — but your reporting of blocked flow, system problems, infection signs, and resident concerns supports every treatment the team provides.',
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
            { id: 'cu-s12-heading', type: 'heading', level: 1, text: 'Conclusion' },
            {
              id: 'cu-s12-video',
              type: 'video',
              title: 'Conclusion',
              videoUrl: '/assets/courses/catheter-care-uti/s12-conclusion.mp4',
              placeholderNote: 'Pending upload: /assets/courses/catheter-care-uti/s12-conclusion.mp4',
            },
            {
              id: 'cu-s12-image',
              type: 'image',
              src: `${ASSET_BASE}/s12-hero.jpg`,
              caption: 'Five things that matter most in catheter care and UTI prevention.',
            },
            {
              id: 'cu-s12-narration',
              type: 'text',
              body: [
                'You\'ve reached the end — and you\'ve completed the renal series. Let\'s lock in the five things that matter most for catheter care and UTI prevention.',
                '**One.** A catheter is an open door for germs — a tube from the outside world into the bladder — which is why catheter-associated infections are so common, and why risk grows with every day a catheter stays in. Most of these infections are preventable, and the prevention is your daily care.',
                '**Two.** Hold the standards like law. Hands clean and gloves on, before and after. The bag below the bladder at all times — checked at every transfer — and never on the floor. Tubing free and urine flowing. The system closed — never disconnected for convenience. Daily catheter and perineal care, wiping away from the entry point, front to back.',
                '**Three.** Watch the urine and keep it flowing. Report cloudy, foul, bloody, or dark urine. When flow stops, check for kinks and loops first — and if freeing the tubing doesn\'t fix it, report promptly, because a blocked catheter backs urine up dangerously. Hydration within each plan keeps the system flushing.',
                '**Four.** Know the elderly UTI picture, and the emergency. In older adults, a UTI often appears as sudden confusion, new weakness, falls, or a resident who\'s "not themselves" — report it promptly. And fever or chills with rapid breathing, racing heart, and worsening confusion is possible urosepsis — a life-threatening emergency needing help immediately.',
                '**Five.** Honor your scope. You never insert, remove, irrigate, or disconnect a catheter, never diagnose, never give medications. But you hold the standards every shift, give the daily care, watch the urine and the resident, and report fast — and that faithful, unglamorous work prevents the most common infection in long-term care.',
              ].join('\n\n'),
            },
            {
              id: 'cu-s12-summary',
              type: 'summary',
              title: 'Five things that matter most',
              items: [
                'A catheter is an open door for germs — most CAUTIs are preventable with daily care.',
                'Hold the standards like law — bag below the bladder, never on the floor, tubing free, system closed.',
                'Watch the urine and keep it flowing — report cloudy, bloody, or stopped flow promptly.',
                'Know the elderly UTI picture and urosepsis emergency — sudden confusion or gravely ill needs action.',
                'Honor your scope — hold standards, give daily care, watch, and report fast.',
              ],
            },
            {
              id: 'cu-s12-whn-text',
              type: 'text',
              body: 'Ten questions are waiting. Everything on them was covered here. You\'re ready. Trust what you\'ve learned, and show what you know.',
            },
            {
              id: 'cu-s12-cr-text',
              type: 'text',
              body: 'This course provides one hour of continuing education credit through CAL ACE Nursing Academy, an approved CDPH continuing education provider, NAC number 7384. Your certificate is generated automatically when you pass the knowledge check.',
            },
            {
              id: 'cu-s12-cr-callout',
              type: 'callout',
              variant: 'info',
              title: 'Scope reminder',
              body: 'CNAs hold the standards, give daily care, and watch. CNAs do not insert, remove, or irrigate catheters, diagnose infections, or give medications.',
            },
            {
              id: 'cu-s12-ca-text',
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

export async function seedCourse34CatheterUti(
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
  console.log(`Seeding Course 34 (Catheter Care & UTI) as DRAFT — slug "${COURSE_SLUG}"…`);

  try {
    const result = await seedCourse34CatheterUti(prisma);
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
