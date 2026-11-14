/**
 * Seed Course 12 — Caring for a Resident with Congestive Heart Failure (DRAFT).
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-12-chf
 *
 * Idempotent upserts by slug. Does not seed the final quiz (pending owner approval).
 */
import {
  LESSON_CONTENT_SCHEMA_VERSION,
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
const COURSE_SLUG = 'chf-care';
const COURSE_TITLE = 'Heart Failure Care Support and CNA Observations';
const COURSE_SUMMARY =
  'Learn to recognize CHF warning signs, support daily care within CNA scope, and know when to report changes or activate emergency response.';

// CONFIRMED against live DB: v2 is PUBLISHED (holds an issued cert —
// CALACE-2026-ZU7BQ — DO NOT TOUCH). v3 is the editable DRAFT that CMS reads
// via ensureEditableVersion. Seed must target v3 so content reaches CMS.
const VERSION_NUMBER = 3;

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
    'Define congestive heart failure in plain language',
    'Recognize CHF signs and symptoms a CNA can observe',
    'Describe daily CNA care role including weights, positioning, and skin care',
    'Know when to report to the nurse versus activate emergency response',
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
  heroImage: '/assets/courses/chf/hero-banner.png',
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
    title: 'Understanding CHF',
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: 'Introduction',
        sortOrder: 0,
        buildContent: () =>
          doc('Introduction', [
            { id: 'chf-s01-heading', type: 'heading', level: 1, text: 'Introduction' },
            {
              id: 'chf-s01-video',
              type: 'video',
              title: 'Introduction',
              videoUrl: '/assets/courses/chf/s01-intro.mp4',
              placeholderNote: 'Pending upload: /assets/courses/chf/s01-intro.mp4',
            },
            {
              id: 'chf-s01-image',
              type: 'image',
              src: '/assets/courses/chf/s01-hero.jpg',
              caption: 'Attentive everyday care for a resident living with heart failure.',
            },
            {
              id: 'chf-s01-narration',
              type: 'text',
              body: [
                'Welcome to CAL ACE Nursing Academy.',
                'This course is about congestive heart failure. You will hear it called C-H-F.',
                'CHF is one of the most common conditions you will see in long-term care. It is the number one reason adults over sixty-five are admitted to the hospital. Many of those hospital stays could be prevented — and the person most likely to prevent them is you.',
                'Here is why. Doctors see the resident for minutes. Nurses see them for parts of a shift. But you, the CNA, see the resident every day. You help them dress. You see their ankles. You help them at meals. You notice when they are more tired than yesterday, or more short of breath walking to the bathroom.',
                'With CHF, the early warning signs are small. A little more swelling. A little more weight. A cough that wasn\'t there last week. These small changes come days before a crisis. The CNA who notices them — and reports them — keeps the resident out of the emergency room.',
                'In the next hour, you will learn what CHF is, in plain language. You will learn the signs you can see with your own eyes, and the symptoms a resident may tell you about. You will learn what the medications do, what you must report, and exactly when to call the nurse — and when to call 911.',
                'You will not be asked to diagnose anything. You will not be asked to give medications. Those are nursing tasks. Your job is different, and just as important: observe, report, and care.',
                'By the end of this course, you will be able to: define congestive heart failure in simple terms. Recognize the signs and symptoms a CNA can observe. Describe your daily care role — including weights, positioning, and skin care. And know exactly when a change means call the nurse now.',
                'There is a ten-question knowledge check at the end. Everything on it is covered in this course. Let\'s begin.',
              ].join('\n\n'),
            },
            {
              id: 'chf-s01-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'CNA scope',
              body: 'You will not be asked to give medications. Those are nursing tasks. Your job is to observe, report, and care.',
            },
          ]),
      },
      {
        slug: 's02-terms',
        title: 'Terms & Definitions',
        sortOrder: 1,
        buildContent: () =>
          doc('Terms & Definitions', [
            { id: 'chf-s02-heading', type: 'heading', level: 1, text: 'Terms & Definitions' },
            {
              id: 'chf-s02-image',
              type: 'image',
              src: '/assets/courses/chf/s02-hero.jpg',
              caption: 'Sitting upright eases breathing — positioning is care.',
            },
            {
              id: 'chf-s02-reveal-chf',
              type: 'reveal_card',
              frontTitle: 'Congestive Heart Failure (CHF)',
              frontBody: 'Con-JES-tiv',
              backTitle: 'Congestive Heart Failure (CHF)',
              backBody:
                'This means the heart has become too weak to pump blood the way it should. Blood and fluid back up — like traffic on a freeway. The heart has not stopped. It is failing to keep up.',
            },
            {
              id: 'chf-s02-reveal-edema',
              type: 'reveal_card',
              frontTitle: 'Edema',
              frontBody: 'Eh-DEE-mah',
              backTitle: 'Edema',
              backBody:
                'Swelling caused by extra fluid trapped in the body\'s tissues. In CHF, you will usually see it in the ankles, feet, and lower legs. In residents who stay in bed, look at the lower back.',
            },
            {
              id: 'chf-s02-reveal-dyspnea',
              type: 'reveal_card',
              frontTitle: 'Dyspnea',
              frontBody: 'DISP-nee-ah',
              backTitle: 'Dyspnea',
              backBody:
                'Difficulty breathing, or shortness of breath. A resident with dyspnea may say "I can\'t catch my breath," or you may see them breathing fast and working hard to breathe.',
            },
            {
              id: 'chf-s02-reveal-orthopnea',
              type: 'reveal_card',
              frontTitle: 'Orthopnea',
              frontBody: 'Or-THOP-nee-ah',
              backTitle: 'Orthopnea',
              backBody:
                'Trouble breathing while lying flat. A resident with orthopnea may ask for extra pillows, or sleep sitting up in a chair. This is an important sign in CHF — always report it.',
            },
            {
              id: 'chf-s02-reveal-diuretic',
              type: 'reveal_card',
              frontTitle: 'Diuretic',
              frontBody: 'Die-yoo-RET-ik',
              backTitle: 'Diuretic',
              backBody:
                'A medication that helps the body remove extra fluid through urine. Residents call them "water pills." A resident on a diuretic will urinate more often — plan for extra bathroom trips.',
            },
            {
              id: 'chf-s02-reveal-fluid-restriction',
              type: 'reveal_card',
              frontTitle: 'Fluid Restriction',
              frontBody: 'Fluid restriction',
              backTitle: 'Fluid Restriction',
              backBody:
                'A doctor\'s order that limits how much a resident may drink each day. It is written in the care plan. Extra fluid makes CHF worse — never give extra drinks without checking with the nurse.',
            },
            {
              id: 'chf-s02-reveal-io',
              type: 'reveal_card',
              frontTitle: 'Intake and Output (I&O)',
              frontBody: 'Intake and output',
              backTitle: 'Intake and Output (I&O)',
              backBody:
                'Often written I and O. Measuring everything the resident drinks, and everything that comes out as urine. Accurate I&O helps the nurse and doctor see whether fluid is building up.',
            },
            {
              id: 'chf-s02-reveal-cyanosis',
              type: 'reveal_card',
              frontTitle: 'Cyanosis',
              frontBody: 'Sigh-ah-NO-sis',
              backTitle: 'Cyanosis',
              backBody:
                'A blue or gray color of the lips, fingertips, or skin. It means the body is not getting enough oxygen. Cyanosis is an emergency sign. You will learn exactly what to do later in this course.',
            },
            {
              id: 'chf-s02-knowledge-check',
              type: 'knowledge_check',
              question: 'Which term means swelling from extra fluid?',
              options: [
                { id: 'edema', label: 'Edema' },
                { id: 'orthopnea', label: 'Orthopnea' },
                { id: 'diuretic', label: 'Diuretic' },
              ],
              correctOptionId: 'edema',
              explanation:
                'Edema. Eh-DEE-mah. Swelling caused by extra fluid trapped in the body\'s tissues. In CHF, you will usually see it in the ankles, feet, and lower legs.',
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
            { id: 'chf-s03-heading', type: 'heading', level: 1, text: 'Statistics' },
            {
              id: 'chf-s03-image',
              type: 'image',
              src: '/assets/courses/chf/s03-hero.jpg',
              caption: 'Heart failure is common among the residents a CNA serves.',
            },
            pendingAudio(
              'chf-s03-audio',
              'Congestive Heart Failure: Why the Numbers Matter to CNAs',
              '/assets/courses/chf/s03-stats-podcast.mp3',
              [
                'Congestive Heart Failure: Why the Numbers Matter to CNAs',
                '',
                'About 6.7 million adults in the United States are living with heart failure, and that number is growing as the population ages. Heart failure is the leading cause of hospitalization among adults aged 65 and older. Roughly 1 in 4 people will develop heart failure during their lifetime.',
                '',
                'In long-term care facilities, heart failure is one of the most common chronic conditions. Many residents live with CHF alongside other conditions like diabetes, kidney disease, and high blood pressure, which makes their care more complex.',
                '',
                'Here is the part that matters most for CNAs: a large share of heart failure hospitalizations are considered preventable. The crisis usually does not come out of nowhere. In the days before a hospitalization, residents typically gain weight from fluid buildup, their ankles swell more than usual, and they become more short of breath during ordinary activities like dressing or walking to the dining room.',
                '',
                'These early changes are exactly what a CNA sees during daily care — at the morning weight, while putting on socks and shoes, while walking a resident to breakfast. A CNA who measures daily weight correctly, looks at the ankles every day, and reports a two-pound overnight gain gives the nurse and doctor time to adjust treatment before the resident ends up in the emergency room.',
                '',
                'California\'s long-term care population is one of the largest and most diverse in the nation. Residents come from many cultures and may describe their symptoms differently — some may not complain at all. This makes the CNA\'s trained eyes even more important than the resident\'s words.',
              ].join('\n'),
              '/assets/courses/chf/s03-stats-podcast.mp3',
            ),
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: 'Fundamentals',
        sortOrder: 3,
        buildContent: () =>
          doc('Fundamentals', [
            { id: 'chf-s04-heading', type: 'heading', level: 1, text: 'Fundamentals' },
            {
              id: 'chf-s04-video',
              type: 'video',
              title: 'Fundamentals',
              videoUrl: '/assets/courses/chf/s04-fundamentals.mp4',
              placeholderNote: 'Pending upload: /assets/courses/chf/s04-fundamentals.mp4',
            },
            {
              id: 'chf-s04-image',
              type: 'image',
              src: '/assets/courses/chf/s04-hero.jpg',
              caption: 'The fundamentals of gentle, supportive CHF care.',
            },
            {
              id: 'chf-s04-narration',
              type: 'text',
              body: [
                '**The healthy heart**',
                'Think of the heart as a pump with two jobs. The right side receives used blood from the body and sends it to the lungs to pick up oxygen. The left side receives that fresh blood from the lungs and pumps it out to the whole body. A healthy heart does this about one hundred thousand times a day without you ever noticing.',
                '**What "failure" really means**',
                'In heart failure, the heart muscle has become weak or stiff. It has not stopped — it is struggling. Imagine squeezing a water bottle with a tired hand. Some water comes out, but not enough, and not with enough force. That is the failing heart.',
                '**Where the fluid goes**',
                'When the pump falls behind, blood waits in line. Pressure builds in the blood vessels, and fluid leaks out into the body\'s tissues. This is the "congestion" in congestive heart failure.',
                '**Left side problems show in the lungs**',
                'When the left side of the heart falls behind, fluid backs up into the lungs. This is why residents with CHF get short of breath, cough, and struggle to breathe when lying flat. The lungs are trying to work while partly filled with fluid.',
                '**Right side problems show in the body**',
                'When the right side falls behind, fluid backs up into the body. This is why ankles, feet, and legs swell. In residents who spend the day in bed, the fluid settles in the lower back instead. Gravity decides where the swelling shows.',
                '**Why weight is the secret signal**',
                'Fluid is heavy. One liter of retained fluid weighs about two pounds. A resident cannot gain two pounds of body fat overnight — but they can gain two pounds of fluid overnight. This is why the daily weight is the single most important measurement in CHF care, and why it must be done the same way every day.',
                '**CHF is managed, not cured**',
                'There is no cure for CHF, but it can be managed well for years — with the right medications, the right diet, fluid limits, and careful daily observation. That daily observation is your job. The rest of this course shows you exactly how to do it.',
              ].join('\n\n'),
            },
            {
              id: 'chf-s04-weight-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Daily weight rule',
              body: 'One liter of retained fluid weighs about two pounds. A resident cannot gain two pounds of body fat overnight — but they can gain two pounds of fluid overnight. Report a two-pound overnight gain to the nurse the same shift.',
            },
          ]),
      },
    ],
  },
  {
    slug: 'module-2',
    title: 'What the CNA Sees and Does',
    sortOrder: 1,
    lessons: [
      {
        slug: 's05-signs',
        title: 'Signs & Symptoms',
        sortOrder: 0,
        buildContent: () =>
          doc('Signs & Symptoms', [
            { id: 'chf-s05-heading', type: 'heading', level: 1, text: 'Signs & Symptoms' },
            {
              id: 'chf-s05-image',
              type: 'image',
              src: '/assets/courses/chf/s05-hero.jpg',
              caption: 'Swelling and new breathlessness — the early warning signs.',
            },
            {
              id: 'chf-s05-narration',
              type: 'text',
              body: [
                '**Ankles**',
                'Start at the ankles. Press gently with one finger for five seconds. If a dent stays after you let go, that is pitting edema. Compare today to yesterday: is the swelling higher up the leg? Do the shoes or socks leave deeper marks? These are signs — things you can see and describe.',
                '**Breathing after dressing**',
                'Watch the breathing during ordinary activity. Getting dressed should not leave a resident winded. If buttoning a shirt or walking to the bathroom now causes hard breathing — and it didn\'t last week — that change is what you report. Not just "short of breath," but "short of breath after dressing, which is new."',
                '**The daily weight**',
                'The daily weight is your most powerful tool. Same time every morning. After the resident urinates. Before breakfast. Same scale, similar clothing. A gain of two or more pounds since yesterday, or five pounds in a week, is fluid — and the nurse needs to know today, not at the end of the shift.',
                '**Pillows at night**',
                'Notice how the resident sleeps. Needing more pillows than before, or choosing to sleep in the recliner instead of the bed, often means lying flat makes breathing harder. Residents rarely announce this. They just quietly add a pillow. You are the one who notices.',
                '**Signs versus symptoms**',
                'Remember the difference. Signs are what you observe: swelling, weight gain, fast breathing, a wet-sounding cough, blue-tinged lips. Symptoms are what the resident tells you: "I\'m so tired." "I can\'t breathe lying down." "My shoes feel tight."',
                'Not every resident complains. In some cultures, people are taught not to bother caregivers, or to bear discomfort silently. A resident who says "I\'m fine" while breathing twenty-eight times a minute is not fine. Trust what you see over what you hear — and report both.',
              ].join('\n\n'),
            },
            {
              id: 'chf-s05-weight-callout',
              type: 'callout',
              variant: 'warning',
              title: 'Weight gain alert',
              body: 'A gain of two or more pounds since yesterday, or five pounds in a week, is fluid — and the nurse needs to know today, not at the end of the shift.',
            },
          ]),
      },
      {
        slug: 's06-causes',
        title: 'Causes',
        sortOrder: 1,
        buildContent: () =>
          doc('Causes', [
            { id: 'chf-s06-heading', type: 'heading', level: 1, text: 'Causes' },
            {
              id: 'chf-s06-image',
              type: 'image',
              src: '/assets/courses/chf/s06-hero.jpg',
              caption: 'Salt and fluids can make heart failure worse — stay mindful.',
            },
            pendingAudio(
              'chf-s06-audio',
              'What Causes Congestive Heart Failure?',
              '/assets/courses/chf/s06-causes-podcast.mp3',
              [
                'What Causes Congestive Heart Failure?',
                '',
                'Heart failure is usually the end result of other conditions that damage or overwork the heart over many years.',
                '',
                'The two biggest causes are coronary artery disease and high blood pressure. Coronary artery disease means the blood vessels that feed the heart muscle itself have narrowed. The heart muscle is slowly starved of oxygen and weakens. A previous heart attack causes the same problem suddenly — part of the heart muscle dies and the rest must work harder.',
                '',
                'High blood pressure forces the heart to pump against constant resistance, like lifting weights all day, every day, for decades. Eventually the heart muscle becomes thick and stiff, or stretched and weak.',
                '',
                'Other contributors include diabetes, which damages blood vessels throughout the body; heart valve problems, where the doors inside the heart leak or won\'t open fully; abnormal heart rhythms such as atrial fibrillation; long-term kidney disease, which causes the body to hold fluid; obesity; smoking; and heavy alcohol use over many years.',
                '',
                'In long-term care, the highest-risk residents are those with several of these conditions at once — for example, a resident with diabetes, high blood pressure, and kidney disease carries far more risk than a resident with one condition alone. Age matters too: the heart naturally stiffens with age, so the risk rises sharply after sixty-five.',
                '',
                'Some causes were avoidable earlier in life — smoking, diet, untreated blood pressure. Others were not. For the CNA, the cause changes nothing about the care and everything about the watchfulness: a resident whose chart lists heart failure plus diabetes plus kidney disease deserves your closest daily attention to weight, swelling, and breathing.',
              ].join('\n'),
              '/assets/courses/chf/s06-causes-podcast.mp3',
            ),
          ]),
      },
      {
        slug: 's07-medications',
        title: 'Medications & Treatment',
        sortOrder: 2,
        buildContent: () =>
          doc('Medications & Treatment', [
            { id: 'chf-s07-heading', type: 'heading', level: 1, text: 'Medications & Treatment' },
            {
              id: 'chf-s07-image',
              type: 'image',
              src: '/assets/courses/chf/s07-hero.jpg',
              caption: 'A daily weight catches CHF changes early.',
            },
            {
              id: 'chf-s07-meds-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of practice',
              body: 'CNAs do not give medications. CNAs do not adjust medications. CNAs do not decide whether a resident should skip a dose. Ever. That is nursing scope. Your scope is observation — and your observations make these medications safe.',
            },
            {
              id: 'chf-s07-narration',
              type: 'text',
              body: [
                'Let\'s talk about the medications you will see on the chart — and let\'s start with the rule that never bends. CNAs do not give medications. CNAs do not adjust medications. CNAs do not decide whether a resident should skip a dose. Ever. That is nursing scope. Your scope is observation — and your observations make these medications safe.',
                '**Diuretics — the water pills.** Names you\'ll see: furosemide, also called Lasix. These remove extra fluid through urine. What you\'ll observe in green: more bathroom trips, especially in the hours after the morning dose. Plan for it — offer the bathroom before activities, answer call lights fast, because a resident rushing to the toilet is a resident about to fall. What you report in red: dizziness when standing, very little urine despite the pill, signs of dehydration like a dry mouth and confusion.',
                '**Beta-blockers.** Names often end in "-olol," like metoprolol. These slow the heart so it can rest. Green: the resident\'s pulse may run slower than other residents\' — that can be normal for them. Red: dizziness, fainting, or new extreme tiredness.',
                '**ACE inhibitors.** Names often end in "-pril," like lisinopril. These relax blood vessels so the heart pumps against less pressure. Green: nothing you need to do daily. Red: a dry, nagging cough that won\'t quit — it\'s a known side effect the nurse will want to know about — and any swelling of the lips or face, which is urgent.',
                '**Digoxin.** An older medication that helps the heart beat stronger. Red only: nausea, vomiting, loss of appetite, or the resident saying colors look strange or vision seems off. These can mean the level in the blood is too high. Report the same day.',
                'Beyond pills, treatment includes a low-sodium diet — salt makes the body hold fluid, which is why there\'s no salt packet on the tray — fluid restrictions written in the care plan, and daily weights. Some residents also use oxygen. You may see advanced devices like pacemakers in the chart; you don\'t manage them, you simply report anything unusual at the device site.',
                'One sentence to remember from this whole section: you are the eyes that make the medications safe.',
              ].join('\n\n'),
            },
          ]),
      },
      {
        slug: 's08-prevention',
        title: 'Prevention',
        sortOrder: 3,
        buildContent: () =>
          doc('Prevention', [
            { id: 'chf-s08-heading', type: 'heading', level: 1, text: 'Prevention' },
            {
              id: 'chf-s08-image',
              type: 'image',
              src: '/assets/courses/chf/s08-hero.jpg',
              caption: 'Comfort care: upright, supported, breathing easier.',
            },
            {
              id: 'chf-s08-narration',
              type: 'text',
              body: [
                'Preventing a CHF crisis is daily, simple, and mostly in your hands. Eight habits.',
                '**One. Weigh the same way, every day.** Same time, same scale, after the bathroom, before breakfast, similar clothing. A weight done differently is a weight that can\'t be trusted.',
                '**Two. Look at the ankles every morning.** While putting on socks and shoes, you\'re already there. Press, count to five, look for the dent. Thirty seconds.',
                '**Three. Respect the fluid restriction.** Check the care plan before refilling any cup. If a resident begs for extra water, don\'t argue and don\'t sneak it — tell the nurse. There are safe ways to help with thirst, like ice chips or mouth swabs, if the care plan allows them.',
                '**Four. Keep the salt away.** No salt packets, no salty snacks from the vending machine, and a kind heads-up to the nurse when family brings in chips, cured meats, or salty home cooking. Families mean love. Sodium means fluid.',
                '**Five. Position for easy breathing.** Head of bed raised, pillows supporting the back, legs elevated when sitting in the chair — if the care plan calls for it. Never wedge pillows under the knees in bed without checking the plan.',
                '**Six. Pace the activity.** Rest breaks between bathing steps. A chair in the shower. Clothes laid out within reach. Activity is good for the heart — exhaustion is not.',
                '**Seven. Protect the swollen skin.** Edema stretches skin thin. Pat dry, never rub. No tight socks with deep elastic bands unless they are the prescribed compression stockings. Report any redness, weeping, or open areas.',
                '**Eight. Report small changes the same day.** The whole system depends on this one. Two pounds up, a new cough, one more pillow — small today, hospital next week if no one says anything. You say something.',
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
        slug: 's09-emergency',
        title: 'When to Call Emergency or Doctor',
        sortOrder: 0,
        buildContent: () =>
          doc('When to Call Emergency or Doctor', [
            {
              id: 'chf-s09-heading',
              type: 'heading',
              level: 1,
              text: 'When to Call Emergency or Doctor',
            },
            pendingAudio(
              'chf-s09-intro-audio',
              'Emergency versus report-to-nurse intro',
              '/assets/courses/chf/s09-emergency-intro.mp3',
              'This is the most important five minutes of this course. With CHF, knowing the difference between "tell the nurse today" and "emergency right now" can save a life. You\'re about to work through two situations. Read each one carefully. Choose what you would do. You\'ll get feedback right away. Take your time — at the bedside, you\'ll have less of it.',
              '/assets/courses/chf/s09-emergency-intro.mp3',
            ),
            {
              id: 'chf-s09-image',
              type: 'image',
              src: '/assets/courses/chf/s09-hero.jpg',
              caption: 'Know the difference: call the nurse now, or call 911.',
            },
            {
              id: 'chf-s09-scenario-911-image',
              type: 'image',
              src: '/assets/courses/chf/s09-scenario-911.jpg',
              caption: 'Severe breathing distress is a 911 emergency — get help fast, stay with them.',
            },
            {
              id: 'chf-s09-scenario-911',
              type: 'scenario_question',
              prompt:
                'You answer Mr. Romero\'s call light at 2 a.m. He is sitting bolt upright, gasping, and cannot finish a sentence. He is coughing, and the sputum on his tissue is pink and frothy. His lips look gray-blue. What is the BEST action?',
              options: [
                {
                  id: 'raise-bed',
                  label: 'Raise the head of the bed and check on him again in 15 minutes',
                  feedback:
                    'This situation cannot wait and cannot be fixed with positioning alone. Pink frothy sputum plus severe breathing distress plus blue-gray lips is an emergency happening now. Stay with the resident, call for help, activate emergency response, keep him upright. And remember — CNAs never give medications under any circumstances.',
                },
                {
                  id: 'emergency-now',
                  label: 'Stay with him, call for help, and activate emergency response now',
                  feedback:
                    'Right. Pink frothy sputum, gasping, and blue-gray lips mean fluid is filling the lungs — this is acute pulmonary edema, a life-threatening emergency. Stay with him, call for help loudly or use the emergency call system, and follow your facility\'s emergency procedure. Keep him sitting upright while help comes. Never give medications — that includes "his own" water pill.',
                  isRecommended: true,
                },
                {
                  id: 'water-pill',
                  label: 'Give him his morning water pill early',
                  feedback:
                    'This situation cannot wait and cannot be fixed with positioning alone. Pink frothy sputum plus severe breathing distress plus blue-gray lips is an emergency happening now. Stay with the resident, call for help, activate emergency response, keep him upright. And remember — CNAs never give medications under any circumstances.',
                },
                {
                  id: 'lie-flat',
                  label: 'Help him lie flat to rest',
                  feedback:
                    'This situation cannot wait and cannot be fixed with positioning alone. Pink frothy sputum plus severe breathing distress plus blue-gray lips is an emergency happening now. Stay with the resident, call for help, activate emergency response, keep him upright. And remember — CNAs never give medications under any circumstances.',
                },
              ],
              requiredForCompletion: true,
            },
            {
              id: 'chf-s09-scenario-nurse-image',
              type: 'image',
              src: '/assets/courses/chf/s09-scenario-nurse.jpg',
              caption: 'Gradual swelling and breathlessness — report to the nurse now.',
            },
            {
              id: 'chf-s09-scenario-nurse',
              type: 'scenario_question',
              prompt:
                'During morning care, Mrs. Tanaka\'s daily weight is 3 pounds higher than yesterday. Her ankles look puffier, and she asks for a second pillow "because breathing felt heavy last night." She is calm, talking normally, and her lips are a normal color. What SHOULD the CNA do?',
              options: [
                {
                  id: 'report-nurse',
                  label: 'Report the weight gain, swelling, and pillow request to the nurse now',
                  feedback:
                    'Exactly. She is not in immediate danger — she\'s talking normally and her color is good — so this is not a 911 moment. But three pounds overnight, more swelling, and new orthopnea is the classic early-warning pattern of worsening CHF. Reporting it to the nurse this morning gives the medical team time to act before it becomes the 2 a.m. emergency you saw in the last scenario.',
                  isRecommended: true,
                },
                {
                  id: 'next-shift',
                  label: 'Write it in the notes for the next shift to handle',
                  feedback:
                    'Three pounds overnight is fluid, and combined with more swelling and a new pillow request, it\'s the textbook early-warning pattern. It can\'t wait for the next shift, and a CNA never withholds fluids — restrictions are ordered by the doctor and managed by the nurse. The right move: report all three observations to the nurse now.',
                },
                {
                  id: 'skip-fluids',
                  label: 'Skip her morning fluids to balance the weight gain',
                  feedback:
                    'Three pounds overnight is fluid, and combined with more swelling and a new pillow request, it\'s the textbook early-warning pattern. It can\'t wait for the next shift, and a CNA never withholds fluids — restrictions are ordered by the doctor and managed by the nurse. The right move: report all three observations to the nurse now.',
                },
                {
                  id: 'nothing',
                  label: 'Nothing — 3 pounds is a normal daily change',
                  feedback:
                    'Three pounds overnight is fluid, and combined with more swelling and a new pillow request, it\'s the textbook early-warning pattern. It can\'t wait for the next shift, and a CNA never withholds fluids — restrictions are ordered by the doctor and managed by the nurse. The right move: report all three observations to the nurse now.',
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
            { id: 'chf-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
              id: 'chf-s10-video',
              type: 'video',
              title: "CNA's Role in Care",
              videoUrl: '/assets/courses/chf/s10-cna-role.mp4',
              placeholderNote: 'Pending upload: /assets/courses/chf/s10-cna-role.mp4',
            },
            {
              id: 'chf-s10-image',
              type: 'image',
              src: '/assets/courses/chf/s10-hero.jpg',
              caption: 'Careful watching and clear reporting protect the resident.',
            },
            {
              id: 'chf-s10-narration',
              type: 'text',
              body: [
                'Here is your CHF care role, task by task.',
                '**Weights** You own the daily weight. Same conditions every day, recorded immediately — not from memory at the end of the shift. If the resident refuses the weight, that refusal also goes to the nurse. The weight trend is the medical team\'s early-warning radar, and you are the one who keeps the radar on.',
                '**I&O** When intake and output is ordered, measure — don\'t estimate. Every cup of juice, every bowl of soup counts as intake. Urine is measured in the collection device, not eyeballed in the toilet. Sloppy I&O numbers are worse than none, because the doctor makes fluid decisions based on them.',
                '**Skin and stockings** Apply compression stockings in the morning before the legs swell, if they are in the care plan — smooth, no wrinkles, because a wrinkle becomes a pressure line on fragile skin. Inspect the skin underneath every time they come off. Elevate legs as the plan directs. Keep skin folds clean and dry.',
                '**Reporting** And the task that ties it all together: report changes the same shift you see them. Use numbers and facts. Not "she seems puffy" — instead: "Mrs. Tanaka is up three pounds since yesterday, her ankle swelling now reaches mid-calf, and she requested a second pillow for breathing." That sentence is gold to a nurse.',
                'Now the boundary, stated plainly. You do not give or adjust medications. You do not change a fluid restriction or a diet order. You do not adjust oxygen flow rates — even one number — that is the nurse\'s task. You do not interpret what the changes mean to the family; you report to the nurse, and the nurse communicates the medical picture.',
                'Inside your scope, you are not "just" anything. The daily weight, the ankle check, the accurate I&O, the same-day report — in CHF care, that is the early-warning system. That system is you.',
              ].join('\n\n'),
            },
            {
              id: 'chf-s10-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Stay within scope',
              body: 'You do not give or adjust medications. You do not change a fluid restriction or a diet order. You do not adjust oxygen flow rates — even one number — that is the nurse\'s task.',
            },
          ]),
      },
      {
        slug: 's11-case-study',
        title: 'Brief Case Study',
        sortOrder: 2,
        buildContent: () => {
          const caseNarrative = [
            'Mr. Dela Cruz, 78, has lived at the facility for two years. His chart lists CHF, type 2 diabetes, and high blood pressure. He is proud, independent, and never complains.',
            '',
            '**Monday:** CNA Rosa weighs him at 6:45 a.m. — 182 pounds, same as the day before. While helping with his shoes, she notices his sock lines look slightly deeper than usual. He says he is fine. Rosa mentions the sock lines to the nurse in passing; the nurse notes it.',
            '',
            '**Tuesday:** Weight 184.5 pounds. The swelling now reaches above his ankles, and he asks Rosa to leave his slippers on instead of shoes — "shoes feel small today." At lunch he eats half his meal and says he\'s "just tired." Rosa reports the 2.5-pound gain, the higher swelling, the tight shoes, and the poor appetite to the nurse before her break. The nurse assesses him and calls the doctor. The doctor adjusts his diuretic dose that afternoon and orders strict I&O.',
            '',
            '**Wednesday:** Weight 183 pounds and falling. Mr. Dela Cruz urinates frequently through the morning — Rosa anticipates it, offers the bathroom hourly, and he has no falls and no accidents. By Thursday his weight is back to 181.5 and the swelling has eased. He never went to the hospital.',
            '',
            '**Discussion:** A 2.5-pound gain, deeper sock lines, and tight shoes — none of these look dramatic. Mr. Dela Cruz said he was fine every single day. Rosa trusted the measurements and her eyes over his words, reported the same shift, and the system worked exactly as designed: CNA observes → nurse assesses → doctor adjusts → crisis prevented.',
          ].join('\n');

          return doc('Brief Case Study', [
            { id: 'chf-s11-heading', type: 'heading', level: 1, text: 'Brief Case Study' },
            pendingAudio(
              'chf-s11-audio',
              'Three Days with Mr. Dela Cruz',
              '/assets/courses/chf/s11-case-podcast.mp3',
              caseNarrative,
              '/assets/courses/chf/s11-case-podcast.mp3',
            ),
            {
              id: 'chf-s11-image',
              type: 'image',
              src: '/assets/courses/chf/s11-hero.jpg',
              caption: 'Early recognition settles a CHF resident into real comfort.',
            },
            {
              id: 'chf-s11-case-study',
              type: 'case_study',
              title: 'Three Days with Mr. Dela Cruz',
              residentProfile:
                'Mr. Dela Cruz, 78, has lived at the facility for two years. His chart lists CHF, type 2 diabetes, and high blood pressure. He is proud, independent, and never complains.',
              scenario: [
                '**Monday:** CNA Rosa weighs him at 6:45 a.m. — 182 pounds, same as the day before. While helping with his shoes, she notices his sock lines look slightly deeper than usual. He says he is fine. Rosa mentions the sock lines to the nurse in passing; the nurse notes it.',
                '**Tuesday:** Weight 184.5 pounds. The swelling now reaches above his ankles, and he asks Rosa to leave his slippers on instead of shoes — "shoes feel small today." At lunch he eats half his meal and says he\'s "just tired." Rosa reports the 2.5-pound gain, the higher swelling, the tight shoes, and the poor appetite to the nurse before her break. The nurse assesses him and calls the doctor. The doctor adjusts his diuretic dose that afternoon and orders strict I&O.',
                '**Wednesday:** Weight 183 pounds and falling. Mr. Dela Cruz urinates frequently through the morning — Rosa anticipates it, offers the bathroom hourly, and he has no falls and no accidents. By Thursday his weight is back to 181.5 and the swelling has eased. He never went to the hospital.',
                '**Discussion:** A 2.5-pound gain, deeper sock lines, and tight shoes — none of these look dramatic. Mr. Dela Cruz said he was fine every single day. Rosa trusted the measurements and her eyes over his words, reported the same shift, and the system worked exactly as designed: CNA observes → nurse assesses → doctor adjusts → crisis prevented.',
              ].join('\n\n'),
            },
            {
              id: 'chf-s11-reflection-1',
              type: 'reflection',
              prompt:
                'Mr. Dela Cruz repeatedly said he was "fine." What specific observations gave Rosa a more accurate picture than his words — and why might a resident under-report symptoms?',
              minCharacters: 50,
            },
            {
              id: 'chf-s11-reflection-2',
              type: 'reflection',
              prompt:
                'After the diuretic dose was increased on Tuesday, what new safety risk appeared on Wednesday, and what did Rosa do to manage it?',
              minCharacters: 50,
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
            { id: 'chf-s12-heading', type: 'heading', level: 1, text: 'Conclusion' },
            {
              id: 'chf-s12-video',
              type: 'video',
              title: 'Conclusion',
              videoUrl: '/assets/courses/chf/s12-conclusion.mp4',
              placeholderNote: 'Pending upload: /assets/courses/chf/s12-conclusion.mp4',
            },
            {
              id: 'chf-s12-image',
              type: 'image',
              src: '/assets/courses/chf/s12-hero.jpg',
              caption: 'Watch, recognize, escalate to the right help — that is CHF care.',
            },
            {
              id: 'chf-s12-narration',
              type: 'text',
              body: [
                'You made it. Let\'s lock in the five things that matter most.',
                '**One.** Congestive heart failure means the heart is too weak to pump well, so fluid backs up — into the lungs, the ankles, the body. Managed daily, it stays stable. Ignored, it becomes an emergency.',
                '**Two.** The daily weight is your most powerful tool. Same time, same scale, after the bathroom, before breakfast. Two pounds overnight or five in a week — the nurse hears about it the same shift.',
                '**Three.** Know your signs from your symptoms. Signs you see: swelling, weight gain, fast or wet breathing, blue-tinged lips. Symptoms they tell you: tired, breathless, tight shoes, one more pillow. Report both — and trust what you see over "I\'m fine."',
                '**Four.** Know the line. Gradual changes — gain, swelling, new pillow — call the nurse now. Severe breathing distress, pink frothy sputum, blue lips, chest pain, fainting — that is an emergency response, and you stay with the resident while help comes.',
                '**Five.** Honor your scope. You never give or adjust medications, fluids, diets, or oxygen. You observe, you report with numbers and facts, and you care. In CHF, that role is the early-warning system that keeps residents home and out of the hospital.',
                'This course provides one hour of continuing education credit through CAL ACE Nursing Academy, an approved CDPH continuing education provider, NAC number 7384. Your certificate is generated automatically when you pass the knowledge check.',
                'Speaking of which — ten questions are waiting for you. Everything on them was covered in this course. You\'ve already done the hard part. Take a breath, trust what you\'ve learned, and go show what you know.',
              ].join('\n\n'),
            },
            {
              id: 'chf-s12-summary',
              type: 'summary',
              title: 'Five things that matter most',
              items: [
                'Congestive heart failure means the heart is too weak to pump well, so fluid backs up — managed daily it stays stable, ignored it becomes an emergency.',
                'The daily weight is your most powerful tool — two pounds overnight or five in a week gets reported to the nurse the same shift.',
                'Know signs from symptoms, report both, and trust what you see over "I\'m fine."',
                'Gradual changes call the nurse now; severe breathing distress, pink frothy sputum, or blue lips mean emergency response while you stay with the resident.',
                'Honor your scope — observe, report with numbers and facts, and care; in CHF that role is the early-warning system.',
              ],
            },
          ]),
      },
    ],
  },
];

export async function seedCourse12Chf(
  prisma: PrismaClient,
  options?: { tenantSlug?: string },
): Promise<{ courseCreated: boolean; modulesUpserted: number; lessonsUpserted: number }> {
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
      courseId_versionNumber: { courseId: course.id, versionNumber: VERSION_NUMBER },
    },
    create: {
      courseId: course.id,
      versionNumber: VERSION_NUMBER,
      label: 'CHF — congestive heart failure care (image rebuild)',
      status: CourseVersionStatus.DRAFT,
      deliveryMode: DeliveryMode.ONLINE,
      ceHours,
      publishedAt: null,
      contentMeta: contentMeta as Prisma.InputJsonValue,
    },
    update: {
      label: 'CHF — congestive heart failure care (image rebuild)',
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
          durationMinutes: 5,
          content: content as unknown as Prisma.InputJsonValue,
        },
        update: {
          title: lessonSeed.title,
          sortOrder: lessonSeed.sortOrder,
          status: ContentPublishStatus.DRAFT,
          durationMinutes: 5,
          content: content as unknown as Prisma.InputJsonValue,
          deletedAt: null,
        },
      });
      lessonsUpserted += 1;
    }
  }

  return {
    courseCreated: !existing,
    modulesUpserted,
    lessonsUpserted,
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
    `Seeding Course 12 (CHF) as DRAFT — slug "${COURSE_SLUG}", version ${VERSION_NUMBER}…`,
  );

  try {
    const result = await seedCourse12Chf(prisma);
    const blockCounts = blockCountsByLesson();

    console.log('Seed complete.');
    console.log(`  Course:   ${COURSE_TITLE}`);
    console.log(`  Slug:     ${COURSE_SLUG}`);
    console.log(`  Version:  ${VERSION_NUMBER}`);
    console.log(`  Created:  ${result.courseCreated ? 'yes (new)' : 'no (updated existing)'}`);
    console.log(`  Modules:  ${result.modulesUpserted}`);
    console.log(`  Lessons:  ${result.lessonsUpserted}`);
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
