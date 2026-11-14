/**
 * Seed Course 14 — Hypertension: Observation and Reporting for CNAs (DRAFT).
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-14-hypertension
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
const COURSE_SLUG = 'hypertension';
const COURSE_TITLE = 'Blood Pressure Changes: Observation and Reporting';
const COURSE_SUMMARY =
  'Learn to measure blood pressure accurately, record and report readings, and recognize hypertensive emergencies — within CNA scope. CNAs do not diagnose hypertension or manage medications.';

const ASSET_BASE = `/assets/courses/${COURSE_SLUG}`;

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
    'Explain what blood pressure is, in plain language',
    'Measure blood pressure accurately and avoid common mistakes',
    'Recognize readings that must be reported and signs of a hypertensive emergency',
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
  heroImage: '/assets/courses/hypertension/hero-banner.jpg',
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
    title: 'Understanding Hypertension',
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: 'Introduction',
        sortOrder: 0,
        buildContent: () =>
          doc('Introduction', [
            { id: 'htn-s01-heading', type: 'heading', level: 1, text: 'Welcome' },
            {
              id: 'htn-s01-video',
              type: 'video',
              title: 'Introduction',
              videoUrl: `${ASSET_BASE}/s01-intro.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s01-intro.mp4`,
            },
            {
              id: 'htn-s01-image',
              type: 'image',
              src: '/assets/courses/hypertension/s01-hero.jpg',
              caption: 'A CAL ACE CNA taking a calm, accurate blood pressure reading.',
            },
            {
              id: 'htn-s01-narration',
              type: 'text',
              body: [
                'Welcome to CAL ACE Nursing Academy.',
                'This course is about high blood pressure — called hypertension.',
                'Hypertension is sometimes called the silent killer. Here is why that name is earned: a resident can have dangerously high blood pressure for years and feel completely normal. No pain. No warning. And then, one day, that quiet pressure causes a stroke, a heart attack, or kidney failure.',
                'Because hypertension is silent, it can only be caught one way — by measuring it. And in long-term care, the person measuring blood pressure most often is you, the CNA. Your blood pressure reading is not just a number you write down. It is a window into a resident\'s hidden health, and sometimes it is the first sign of a serious problem.',
                'A blood pressure taken the wrong way gives a wrong number — and a wrong number can lead to a wrong decision about a resident\'s care. So a large part of this course is about taking the measurement correctly, every single time.',
                'There is a ten-question knowledge check at the end. Everything on it is covered here. Let\'s begin.',
              ].join('\n\n'),
            },
            {
              id: 'htn-s01-course-information-text',
              type: 'text',
              body: [
                'This course teaches the CNA\'s role in measuring, observing, and reporting blood pressure and recognizing hypertensive emergencies.',
                'Let\'s be clear about your role. A CNA measures blood pressure accurately, records it, and reports readings that are too high or too low. A CNA does not diagnose hypertension, does not prescribe or change medications, and does not tell the resident what their numbers mean medically. Those are nursing and physician tasks. But none of them can happen without your accurate measurement first.',
              ].join('\n\n'),
            },
            {
              id: 'htn-s01-course-information-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of this course',
              body: 'CNAs MEASURE, OBSERVE, and REPORT. CNAs do not diagnose hypertension, prescribe or adjust medications, or interpret blood pressure for the resident.',
            },
            {
              id: 'htn-s01-learning-objectives-text',
              type: 'text',
              body: 'By the end of this course, you will be able to:',
            },
            {
              id: 'htn-s01-learning-objectives-summary',
              type: 'summary',
              title: 'Learning objectives',
              items: [
                'Explain what blood pressure is, in plain language.',
                'Measure it accurately and avoid the common mistakes.',
                'Recognize readings that must be reported, and recognize the signs of a hypertensive emergency.',
                'Know your scope — what a CNA does, and what a CNA must never do.',
              ],
            },
            {
              id: 'htn-s01-instructor-intro-text',
              type: 'text',
              body: 'This course is presented by CAL ACE Nursing Academy — an approved CDPH continuing education provider, NAC number 7384.',
            },
          ]),
      },
      {
        slug: 's02-terms',
        title: 'Terms & Definitions',
        sortOrder: 1,
        buildContent: () =>
          doc('Terms & Definitions', [
            { id: 'htn-s02-heading', type: 'heading', level: 1, text: 'Key terms' },
            {
              id: 'htn-s02-image',
              type: 'image',
              src: '/assets/courses/hypertension/s02-hero.jpg',
              caption: 'Knowing the numbers behind blood pressure.',
            },
            {
              id: 'htn-s02-reveal-bp',
              type: 'reveal_card',
              frontTitle: 'Blood Pressure',
              frontBody: 'Blood pressure',
              backTitle: 'Blood Pressure',
              backBody:
                'The force of blood pushing against the walls of the arteries as the heart pumps. It is written as two numbers, one over the other, like a fraction. Both numbers tell a story.',
            },
            {
              id: 'htn-s02-reveal-systolic',
              type: 'reveal_card',
              frontTitle: 'Systolic Pressure',
              frontBody: 'Sis-TOL-ik',
              backTitle: 'Systolic Pressure',
              backBody:
                'The top number. This is the pressure when the heart squeezes and pushes blood out. It is the higher of the two numbers. For many adults, a systolic around 120 is considered normal.',
            },
            {
              id: 'htn-s02-reveal-diastolic',
              type: 'reveal_card',
              frontTitle: 'Diastolic Pressure',
              frontBody: 'Die-uh-STOL-ik',
              backTitle: 'Diastolic Pressure',
              backBody:
                'The bottom number. This is the pressure when the heart rests between beats. It is the lower of the two numbers. For many adults, a diastolic around 80 is considered normal.',
            },
            {
              id: 'htn-s02-reveal-hypertension',
              type: 'reveal_card',
              frontTitle: 'Hypertension',
              frontBody: 'Hi-per-TEN-shun',
              backTitle: 'Hypertension',
              backBody:
                'Blood pressure that stays too high over time. Generally, readings at or above 130 over 80, measured correctly and repeated, may indicate hypertension. Remember — the CNA reports the numbers; the nurse and doctor make the diagnosis.',
            },
            {
              id: 'htn-s02-reveal-hypotension',
              type: 'reveal_card',
              frontTitle: 'Hypotension',
              frontBody: 'Hi-po-TEN-shun',
              backTitle: 'Hypotension',
              backBody:
                'Blood pressure that is too low. A reading that is much lower than the resident\'s normal — for example, below 90 over 60 — can be just as dangerous as high pressure, especially if the resident feels dizzy or faint. Report it.',
            },
            {
              id: 'htn-s02-reveal-orthostatic',
              type: 'reveal_card',
              frontTitle: 'Orthostatic Hypotension',
              frontBody: 'Or-tho-STAT-ik',
              backTitle: 'Orthostatic Hypotension',
              backBody:
                'A sudden drop in blood pressure when a resident stands up from sitting or lying down. It can cause dizziness and falls. This is why you help residents change position slowly and watch them closely when they stand.',
            },
            {
              id: 'htn-s02-reveal-crisis',
              type: 'reveal_card',
              frontTitle: 'Hypertensive Crisis',
              frontBody: 'Hypertensive crisis',
              backTitle: 'Hypertensive Crisis',
              backBody:
                'A dangerous spike in blood pressure — generally a systolic of 180 or higher, or a diastolic of 120 or higher. This is an emergency, especially with symptoms like severe headache, chest pain, or confusion. You will learn exactly what to do later.',
            },
            {
              id: 'htn-s02-reveal-sphygmo',
              type: 'reveal_card',
              frontTitle: 'Sphygmomanometer',
              frontBody: 'Sfig-mo-ma-NOM-eh-ter',
              backTitle: 'Sphygmomanometer',
              backBody:
                'The full name for the blood pressure cuff and gauge. Most facilities now use automatic digital monitors, but the manual cuff with a stethoscope is still used. Whichever you use, correct technique is everything.',
            },
            {
              id: 'htn-s02-kc1-check-systolic',
              type: 'knowledge_check',
              question: 'Match the term: top number, heart squeezing',
              options: [
                { id: 'systolic', label: 'Systolic' },
                { id: 'diastolic', label: 'Diastolic' },
                { id: 'orthostatic', label: 'Orthostatic hypotension' },
              ],
              correctOptionId: 'systolic',
              explanation:
                'Systolic. The top number. This is the pressure when the heart squeezes and pushes blood out.',
              requiredForCompletion: true,
            },
            {
              id: 'htn-s02-kc1-check-diastolic',
              type: 'knowledge_check',
              question: 'Match the term: bottom number, heart resting',
              options: [
                { id: 'systolic', label: 'Systolic' },
                { id: 'diastolic', label: 'Diastolic' },
                { id: 'orthostatic', label: 'Orthostatic hypotension' },
              ],
              correctOptionId: 'diastolic',
              explanation:
                'Diastolic. The bottom number. This is the pressure when the heart rests between beats.',
              requiredForCompletion: true,
            },
            {
              id: 'htn-s02-kc1-check-orthostatic',
              type: 'knowledge_check',
              question: 'Match the term: BP drops when standing up, causes dizziness',
              options: [
                { id: 'systolic', label: 'Systolic' },
                { id: 'diastolic', label: 'Diastolic' },
                { id: 'orthostatic', label: 'Orthostatic hypotension' },
              ],
              correctOptionId: 'orthostatic',
              explanation:
                'Orthostatic hypotension. A sudden drop in blood pressure when a resident stands up from sitting or lying down. It can cause dizziness and falls.',
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
            { id: 'htn-s03-heading', type: 'heading', level: 1, text: 'Statistics' },
            pendingAudio(
              'htn-s03-audio',
              'High Blood Pressure: The Silent Epidemic in Long-Term Care',
              `${ASSET_BASE}/s03-stats-podcast.mp3`,
              [
                'High Blood Pressure: The Silent Epidemic in Long-Term Care',
                '',
                'Nearly half of all adults in the United States have high blood pressure — about 120 million people. Among adults over 65, the number is even higher: the majority of older adults have hypertension, whether they know it or not.',
                '',
                'What makes hypertension so dangerous is that most people feel nothing. There are usually no symptoms until serious damage has already been done. That is why it is called the silent killer. High blood pressure is a leading cause of stroke, heart attack, heart failure, and kidney disease — and it often contributes to all of them quietly, over many years.',
                '',
                'In long-term care facilities, the vast majority of residents have a blood pressure that needs monitoring. Many are on one or more medications to control it. For these residents, the regular blood pressure check is one of the most important measurements taken all day.',
                '',
                'Here is why the CNA matters so much. Because hypertension has no symptoms, the only way to detect it and track it is to measure it — accurately and consistently. A blood pressure taken with the wrong cuff size, with the resident\'s arm dangling, or right after they walked down the hall, can be off by ten, twenty, even thirty points. That wrong number can cause a real problem: a medication might be changed based on a reading that was never accurate.',
                '',
                'Studies consistently show that blood pressure measurement errors are common — and most of them come from small technique mistakes that are completely preventable. The CNA who measures correctly every time, and who reports readings that are too high or too low, gives the medical team accurate information to protect the resident from stroke, heart attack, and falls.',
                '',
                'The bottom line: hypertension is everywhere, it is silent, and the accuracy of the CNA\'s measurement is the foundation of the resident\'s care.',
              ].join('\n'),
              `${ASSET_BASE}/s03-stats-podcast.mp3`,
            ),
            {
              id: 'htn-s03-image',
              type: 'image',
              src: '/assets/courses/hypertension/s03-hero.jpg',
              caption: 'Hypertension is common where CNAs work — careful monitoring matters.',
            },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: 'Fundamentals',
        sortOrder: 3,
        buildContent: () =>
          doc('Fundamentals', [
            { id: 'htn-s04-heading', type: 'heading', level: 1, text: 'Fundamentals' },
            {
              id: 'htn-s04-video',
              type: 'video',
              title: 'Fundamentals',
              videoUrl: `${ASSET_BASE}/s04-fundamentals.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s04-fundamentals.mp4`,
            },
            {
              id: 'htn-s04-image',
              type: 'image',
              src: '/assets/courses/hypertension/s04-hero.jpg',
              caption: 'Correct cuff technique gives a reading the nurse can trust.',
            },
            {
              id: 'htn-s04-narration',
              type: 'text',
              body: [
                '**What the two numbers mean**',
                'Blood pressure is two numbers. The top number, systolic, is the pressure when the heart pushes blood out. The bottom number, diastolic, is the pressure when the heart rests. We say it like "120 over 80." Both numbers matter, and both get reported.',
                '**Why correct technique is everything**',
                'A blood pressure reading is only useful if it\'s accurate. Small mistakes cause big errors. The good news: every common mistake is preventable once you know it.',
                '**Before you measure: prepare the resident**',
                'The resident should be resting quietly for about five minutes first — not right after walking, eating, or using the bathroom. They should be sitting with their back supported, feet flat on the floor, legs uncrossed, and not talking during the reading. Talking alone can raise the number.',
                '**Position the arm correctly**',
                'The arm should be supported at heart level — resting on a table or an armrest, not dangling and not held up in the air. An arm below heart level reads too high. An arm above heart level reads too low. Support it level with the heart.',
                '**Use the right cuff size**',
                'The cuff must fit the arm. A cuff too small reads too high. A cuff too large reads too low. The cuff should be placed on bare skin, not over clothing, about an inch above the bend of the elbow. If a resident\'s sleeve is tight, help them remove the arm from the sleeve rather than rolling it up into a tight band.',
                '**Same conditions, every time**',
                'For tracking to mean anything, measure the same way each time: same arm when possible, same position, same rested state. If a resident has a reason one arm can\'t be used — like a dialysis access or a side affected by stroke — that\'s noted in the care plan. Always check.',
                '**Record immediately and exactly**',
                'Write the reading down right away — both numbers, the arm used, and the time. Never record from memory at the end of your shift. And never round or "fix" a number to look more normal. The medical team needs the true reading, even when — especially when — it\'s unusual.',
              ].join('\n\n'),
            },
            {
              id: 'htn-s04-technique-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Correct technique is everything',
              body: 'A wrong technique gives a wrong number, and a wrong number can lead to a wrong decision. Rested resident, supported arm at heart level, right cuff, no talking — every time.',
            },
          ]),
      },
    ],
  },
  {
    slug: 'module-2',
    title: 'Measurement, Recognition, and CNA Role',
    sortOrder: 1,
    lessons: [
      {
        slug: 's05-signs',
        title: 'Signs & Symptoms',
        sortOrder: 0,
        buildContent: () =>
          doc('Signs & Symptoms', [
            { id: 'htn-s05-heading', type: 'heading', level: 1, text: 'Signs & Symptoms' },
            {
              id: 'htn-s05-image',
              type: 'image',
              src: '/assets/courses/hypertension/s05-hero.jpg',
              caption: 'Hypertension is often silent — watch and report changes.',
            },
            {
              id: 'htn-s05-narration',
              type: 'text',
              body: [
                '**The silent truth**',
                'Here is the hardest thing about high blood pressure: most of the time, there are no signs at all. A resident with a dangerously high reading may look and feel completely fine. This is exactly why the measurement matters so much — the number is often the only clue. Never assume a resident\'s pressure is okay just because they seem okay.',
                '**When symptoms DO appear**',
                'When blood pressure climbs very high, some warning signs may appear. A severe or unusual headache — especially one that comes on suddenly. Blurred or changed vision. These deserve a blood pressure check and a report, even between scheduled readings.',
                '**Signs of pressure that\'s too LOW**',
                'Don\'t forget the other direction. Low blood pressure also has signs: dizziness, lightheadedness, feeling faint — especially when standing up. A pale, sweaty, weak resident who nearly passes off when they stand may have low pressure, and that raises the risk of a serious fall. Check and report.',
                '**The danger signs**',
                'And then there are the danger signs that turn a high number into an emergency: a severe pounding headache, chest pain, shortness of breath, confusion or trouble speaking, weakness or numbness on one side, or a nosebleed that won\'t stop — paired with a very high reading. These are signs the high pressure may be causing damage right now.',
                '**Summary**',
                'Three pictures. Most often: no symptoms at all — the number is your only clue, so measure carefully. Too low: dizzy, faint, pale, weak — fall risk, report it. Dangerously high: severe headache, chest pain, confusion, vision changes, one-sided weakness — this is an emergency.',
                'And the rule underneath it all: you don\'t decide what a reading means medically. You measure accurately, and you report anything high, low, or paired with symptoms. The nurse takes it from there.',
              ].join('\n\n'),
            },
            {
              id: 'htn-s05-silent-callout',
              type: 'callout',
              variant: 'warning',
              title: 'The silent killer',
              body: 'Most of the time, there are no signs at all. The number is often the only clue — never assume a resident\'s pressure is okay just because they seem okay.',
            },
          ]),
      },
      {
        slug: 's06-causes',
        title: 'Causes',
        sortOrder: 1,
        buildContent: () =>
          doc('Causes', [
            { id: 'htn-s06-heading', type: 'heading', level: 1, text: 'Causes' },
            pendingAudio(
              'htn-s06-audio',
              'What Causes High Blood Pressure?',
              `${ASSET_BASE}/s06-causes-podcast.mp3`,
              [
                'What Causes High Blood Pressure?',
                '',
                'For most people, high blood pressure develops slowly over many years, and there is no single cause. This is called primary or essential hypertension, and it\'s by far the most common type. It results from a mix of factors that build up over a lifetime.',
                '',
                'Age is one of the biggest. As people get older, their arteries naturally become stiffer and less flexible, which raises blood pressure. This is why hypertension is so common in long-term care.',
                '',
                'Lifestyle plays a large role. A diet high in salt makes the body hold onto fluid, raising pressure. Being overweight, physical inactivity, heavy alcohol use, and smoking all push blood pressure up over time. Long-term stress can contribute as well.',
                '',
                'Family history matters too — high blood pressure tends to run in families. And certain groups carry higher risk; for example, hypertension is more common and often more severe among African American adults, and tends to develop earlier in life.',
                '',
                'Sometimes high blood pressure is caused by another medical condition — this is called secondary hypertension. Kidney disease, thyroid problems, sleep apnea, and certain medications can all raise blood pressure. When the underlying cause is treated, the pressure often improves.',
                '',
                'For the CNA, here\'s what this means day to day. You are not expected to know why a particular resident has high blood pressure. You are expected to understand that most of your residents will have it, that it\'s controlled with medication and lifestyle measures written in the care plan, and that supporting those measures — the low-salt diet, the activity level, the medication schedule the nurse manages — and measuring accurately, is how you help keep it under control.',
              ].join('\n'),
              `${ASSET_BASE}/s06-causes-podcast.mp3`,
            ),
            {
              id: 'htn-s06-image',
              type: 'image',
              src: '/assets/courses/hypertension/s06-hero.jpg',
              caption: 'Understanding what raises blood pressure.',
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
              id: 'htn-s07-heading',
              type: 'heading',
              level: 1,
              text: 'CNA Role & Best Practices',
            },
            {
              id: 'htn-s07-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of practice',
              body: 'CNAs MEASURE, OBSERVE, and REPORT. CNAs never give, skip, or delay blood pressure medications.',
            },
            {
              id: 'htn-s07-image',
              type: 'image',
              src: '/assets/courses/hypertension/s07-hero.jpg',
              caption: 'The CNA measures and reports — never adjusts medications.',
            },
            {
              id: 'htn-s07-narration',
              type: 'text',
              body: [
                'Most residents with high blood pressure take medication to control it, and many take more than one. Let\'s walk through the common types — and let\'s start, as always, with the rule that never bends. A CNA does not give blood pressure medications, does not skip or delay a dose, and does not decide that a resident should "hold" their pill because a reading looks low. Those decisions belong to the nurse. Your job is to measure, observe, and report.',
                '**Diuretics — water pills.** Names like hydrochlorothiazide, or furosemide. They lower pressure by removing extra fluid and salt through urine. Green, what you observe and support: more frequent urination — plan for bathroom trips and answer call lights fast to prevent falls. Red, what you report: dizziness, weakness, very low readings, or signs of dehydration.',
                '**ACE inhibitors and ARBs.** ACE inhibitor names often end in "-pril," like lisinopril. ARB names often end in "-sartan," like losartan. They relax blood vessels. Red: a persistent dry cough with the "-pril" medications is worth reporting, and any swelling of the lips or face is urgent.',
                '**Beta-blockers.** Names often end in "-olol," like metoprolol or atenolol. They slow the heart and lower pressure. Green: a slower pulse can be normal for these residents. Red: a very slow pulse, dizziness, or fainting.',
                '**Calcium channel blockers.** Names like amlodipine. They relax blood vessels. Red: ankle swelling, dizziness, or very low readings.',
                'Here is the scope point that matters most in this section. You may take a reading that looks low — say, 95 over 55 — and wonder if the resident should still get their blood pressure pill. You do not make that decision, and you do not delay the pill on your own. You report the low reading to the nurse right away, and the nurse decides. The same is true for a high reading. You measure, you report, the nurse decides.',
                'One sentence to carry: your accurate reading is what makes every one of these medications safe.',
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
            { id: 'htn-s08-heading', type: 'heading', level: 1, text: 'Prevention & Risk Reduction' },
            {
              id: 'htn-s08-image',
              type: 'image',
              src: '/assets/courses/hypertension/s08-hero.jpg',
              caption: 'Consistent, careful monitoring is the CNA standard.',
            },
            {
              id: 'htn-s08-narration',
              type: 'text',
              body: [
                'CNAs help control high blood pressure every single day, often without realizing it. Here are seven ways.',
                '**One. Measure accurately, every time.** This is prevention itself. An accurate reading lets the medical team catch a problem early and adjust care before a stroke or heart attack happens. Rested resident, supported arm at heart level, right cuff, no talking. Every time.',
                '**Two. Support the low-salt diet.** Salt raises blood pressure by making the body hold fluid. Serve the meals as planned, skip the salt packet, and give the nurse a kind heads-up when family brings in salty snacks, cured meats, or fast food. Families bring love. The CNA protects the diet.',
                '**Three. Encourage safe activity.** Movement helps lower blood pressure. Support residents in their planned walks and activities, at their own safe pace. Even small, regular movement helps the heart.',
                '**Four. Help manage stress.** Calm matters. A gentle, unhurried approach, a listening ear, and a peaceful environment can genuinely help a resident\'s blood pressure. Rushing and tension can raise it.',
                '**Five. Watch for missed doses and report.** If a resident refuses their medication, or you notice a dose wasn\'t given, tell the nurse. Skipped blood pressure medication is a common, preventable cause of a dangerous spike.',
                '**Six. Prevent falls from low pressure.** Help residents change position slowly — sitting up before standing, standing a moment before walking. This prevents the dizzy drop in pressure that causes falls, especially in residents on blood pressure medication.',
                '**Seven. Report changes faithfully.** A reading that\'s higher or lower than the resident\'s normal, a new headache, new dizziness — report it the same shift. Small reports prevent big emergencies.',
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
              id: 'htn-s09-heading',
              type: 'heading',
              level: 1,
              text: 'Scenario & Reporting',
            },
            pendingAudio(
              'htn-s09-intro-audio',
              'Emergency response scenarios intro',
              `${ASSET_BASE}/s09-emergency-intro.mp3`,
              'A blood pressure reading is more than a number to write down. Sometimes it\'s a signal that something serious is happening right now. In this section, you\'ll work through two situations. Read each carefully, choose your action, and you\'ll get feedback right away. Remember the theme of this whole course: you measure and you report — the nurse decides what it means and what to do.',
              `${ASSET_BASE}/s09-emergency-intro.mp3`,
            ),
            {
              id: 'htn-s09-image',
              type: 'image',
              src: '/assets/courses/hypertension/s09-hero.jpg',
              caption: 'Reading the situation: when to report, when it\'s urgent.',
            },
            {
              id: 'htn-s09-scenario-emergency-image',
              type: 'image',
              src: '/assets/courses/hypertension/s09-scenario-emergency.jpg',
              caption:
                'A hypertensive crisis: very high reading with severe symptoms — notify the nurse immediately.',
            },
            {
              id: 'htn-s09-scenario-emergency',
              type: 'scenario_question',
              prompt:
                'You take Mr. Petrov\'s routine blood pressure and the monitor reads 192 over 124. He is holding his head, telling you he has the "worst headache of his life," his speech sounds slightly slurred, and he seems confused about where he is. What is the BEST action?',
              options: [
                {
                  id: 'end-of-shift',
                  label: 'Write the reading in the chart and tell the nurse at the end of your shift',
                  feedback:
                    'This is a hypertensive emergency. A reading of 192 over 124 combined with the worst headache of his life, slurred speech, and confusion may signal a stroke in progress. It cannot wait for end of shift or an hour, and a CNA never gives medication. The right action: stay with him and notify the nurse immediately.',
                },
                {
                  id: 'recheck-hour',
                  label: 'Recheck in an hour to see if it comes down on its own',
                  feedback:
                    'This is a hypertensive emergency. A reading of 192 over 124 combined with the worst headache of his life, slurred speech, and confusion may signal a stroke in progress. It cannot wait for end of shift or an hour, and a CNA never gives medication. The right action: stay with him and notify the nurse immediately.',
                },
                {
                  id: 'notify-now',
                  label: 'Stay with him and notify the nurse immediately — this is an emergency',
                  feedback:
                    'Right. A reading of 192 over 124 is in the hypertensive crisis range, and the severe headache, slurred speech, and confusion suggest the high pressure may be causing harm right now — possibly a stroke. Stay with him and notify the nurse immediately so licensed staff can respond and arrange emergency care. Never give medication, even his own — that\'s the nurse\'s decision. This cannot wait.',
                  isRecommended: true,
                },
                {
                  id: 'give-pill-early',
                  label: 'Give him his blood pressure pill early to bring it down',
                  feedback:
                    'This is a hypertensive emergency. A reading of 192 over 124 combined with the worst headache of his life, slurred speech, and confusion may signal a stroke in progress. It cannot wait for end of shift or an hour, and a CNA never gives medication. The right action: stay with him and notify the nurse immediately.',
                },
              ],
              requiredForCompletion: true,
            },
            {
              id: 'htn-s09-scenario-low-reading-image',
              type: 'image',
              src: '/assets/courses/hypertension/s09-scenario-low-reading.jpg',
              caption:
                'A low reading with dizziness: report, and never give or hold a medication yourself.',
            },
            {
              id: 'htn-s09-scenario-low-reading',
              type: 'scenario_question',
              prompt:
                'Before lunch, you take Mrs. Adeyemi\'s blood pressure and it reads 92 over 56 — lower than her usual. She says she feels "a little dizzy." Her care plan shows she\'s due for her blood pressure medication after lunch. What SHOULD the CNA do?',
              options: [
                {
                  id: 'hold-medication',
                  label: 'Hold her blood pressure medication yourself since the reading is low',
                  feedback:
                    'A CNA never decides on their own to hold or give blood pressure medication — that\'s the nurse\'s call. But a low reading with dizziness shouldn\'t be ignored or hidden either. The right action: report the low reading and the dizziness to the nurse right away, before the medication is due, so the nurse can decide.',
                },
                {
                  id: 'report-now',
                  label: 'Report the low reading and her dizziness to the nurse right away',
                  feedback:
                    'Exactly. The reading is lower than her normal and she feels dizzy — both need to go to the nurse right away, before her medication is due. But notice what you do NOT do: you don\'t decide on your own to hold the medication, and you don\'t give it either. That decision belongs to the nurse, who now has the information to make it. Your job was to measure accurately and report — and you did.',
                  isRecommended: true,
                },
                {
                  id: 'give-as-scheduled',
                  label: 'Tell her it\'s nothing and give her the medication as scheduled',
                  feedback:
                    'A CNA never decides on their own to hold or give blood pressure medication — that\'s the nurse\'s call. But a low reading with dizziness shouldn\'t be ignored or hidden either. The right action: report the low reading and the dizziness to the nurse right away, before the medication is due, so the nurse can decide.',
                },
                {
                  id: 'wait-recheck',
                  label: 'Wait until after lunch and recheck without telling anyone',
                  feedback:
                    'A CNA never decides on their own to hold or give blood pressure medication — that\'s the nurse\'s call. But a low reading with dizziness shouldn\'t be ignored or hidden either. The right action: report the low reading and the dizziness to the nurse right away, before the medication is due, so the nurse can decide.',
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
            { id: 'htn-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
              id: 'htn-s10-video',
              type: 'video',
              title: "CNA's Role in Care",
              videoUrl: `${ASSET_BASE}/s10-cna-role.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s10-cna-role.mp4`,
            },
            {
              id: 'htn-s10-image',
              type: 'image',
              src: '/assets/courses/hypertension/s10-hero.jpg',
              caption: 'Accurate reporting of readings to the nurse.',
            },
            {
              id: 'htn-s10-narration',
              type: 'text',
              body: [
                'Your role in blood pressure care is clear, and it\'s foundational. Let\'s walk through it.',
                '**Measure accurately** First and most important: measure accurately, every time. Rested resident. Supported arm at heart level. Correct cuff on bare skin. No talking. Same arm, same way. A reading taken carelessly is worse than no reading, because the team will trust a number that isn\'t true. Your careful technique is the whole foundation of this resident\'s blood pressure care.',
                '**Record honestly and immediately** Record the reading right away — both numbers, the arm, the time. From the moment, not from memory. And record the true number, always. If it\'s surprisingly high or low, that\'s exactly when honesty matters most. Never adjust a reading to look more normal. The unusual number might be the one that saves the resident.',
                '**Support safe movement** Help residents change position slowly to prevent the dizzy drop in pressure that causes falls — especially those on blood pressure medication. Sit up, pause, stand, pause, then walk. Stay close while they rise.',
                '**Report and support the plan** Report readings that are high, low, or paired with symptoms — the same shift. Support the care plan: serve the low-salt diet, encourage planned activity, keep the environment calm. And note refusals — if a resident refuses a reading or a medication, the nurse needs to know.',
                'Now the boundary, stated plainly. You do not diagnose hypertension — you report numbers; the doctor diagnoses. You do not give, skip, or delay blood pressure medications — the nurse manages those. You do not decide what a reading means medically, and you do not tell the resident "your pressure is fine" or "your pressure is dangerous" — that interpretation is the nurse\'s role. If a resident asks what their numbers mean, the kind and correct answer is: "Let me have the nurse go over that with you."',
                'Inside your role — accurate measurement, honest recording, safe movement, faithful reporting — you are the foundation everything else stands on. There is nothing small about it.',
              ].join('\n\n'),
            },
            {
              id: 'htn-s10-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Stay within scope',
              body: 'You do not diagnose hypertension. You do not give, skip, or delay blood pressure medications. You do not tell the resident what their numbers mean — that interpretation is the nurse\'s role.',
            },
          ]),
      },
      {
        slug: 's11-case-study',
        title: 'Case Study',
        sortOrder: 2,
        buildContent: () => {
          const caseNarrative = [
            'CNA Carlos was taking routine afternoon blood pressures on his hall. Most residents were in their usual ranges. Then he got to Mrs. Yamamoto.',
            '',
            '**The reading (the moment that mattered):** Carlos took Mrs. Yamamoto\'s pressure exactly the way he was trained — she\'d been resting, her arm was supported on the table at heart level, the right cuff on bare skin, and she wasn\'t talking. The monitor read 186 over 116. That was much higher than her usual reading of around 138 over 84.',
            '',
            '**The temptation:** Carlos paused. Mrs. Yamamoto looked completely fine. She was chatting cheerfully about her grandson\'s visit. For a second, Carlos wondered if the machine was wrong, and thought about just writing down something closer to her normal so he wouldn\'t "worry anyone." He didn\'t. He rechecked it properly instead — still very high.',
            '',
            '**The right move:** Carlos recorded the true reading immediately — 186 over 116, right arm, 2:15 p.m. He asked Mrs. Yamamoto a few gentle questions: any headache? Any blurred vision? She mentioned, almost as an afterthought, that she\'d had "a bit of a headache" since lunch and her vision seemed "a little fuzzy." Carlos reported all of it to the nurse right away — the reading, the headache, the vision.',
            '',
            '**The outcome:** The nurse assessed Mrs. Yamamoto, confirmed the high reading, and reached the doctor. It turned out she had missed her morning blood pressure medication during a busy schedule change. The doctor gave orders, her pressure was brought down safely over the next hours, and a possible stroke was very likely prevented — all because the reading was accurate and honest, and reported fast.',
            '',
            '**Discussion:** Mrs. Yamamoto seemed perfectly fine. That\'s the trap of the silent killer. If Carlos had rounded the number to look normal, or skipped reporting because she "seemed okay," the missed medication and the dangerous pressure would have gone unnoticed. He measured correctly, recorded honestly, asked about symptoms, and reported fast. That\'s the entire CNA role in hypertension, done exactly right.',
          ].join('\n');

          return doc('Case Study', [
            { id: 'htn-s11-heading', type: 'heading', level: 1, text: 'Brief Case Study' },
            pendingAudio(
              'htn-s11-audio',
              'The Number Carlos Didn\'t Round',
              `${ASSET_BASE}/s11-case-podcast.mp3`,
              caseNarrative,
              `${ASSET_BASE}/s11-case-podcast.mp3`,
            ),
            {
              id: 'htn-s11-image',
              type: 'image',
              src: '/assets/courses/hypertension/s11-hero.jpg',
              caption:
                'A blood pressure concern handled correctly — measure, report, follow up.',
            },
            {
              id: 'htn-s11-case-study',
              type: 'case_study',
              title: 'The Number Carlos Didn\'t Round',
              residentProfile:
                'CNA Carlos was taking routine afternoon blood pressures on his hall. Most residents were in their usual ranges. Then he got to Mrs. Yamamoto.',
              scenario: [
                '**The reading (the moment that mattered):** Carlos took Mrs. Yamamoto\'s pressure exactly the way he was trained — she\'d been resting, her arm was supported on the table at heart level, the right cuff on bare skin, and she wasn\'t talking. The monitor read 186 over 116. That was much higher than her usual reading of around 138 over 84.',
                '**The temptation:** Carlos paused. Mrs. Yamamoto looked completely fine. She was chatting cheerfully about her grandson\'s visit. For a second, Carlos wondered if the machine was wrong, and thought about just writing down something closer to her normal so he wouldn\'t "worry anyone." He didn\'t. He rechecked it properly instead — still very high.',
                '**The right move:** Carlos recorded the true reading immediately — 186 over 116, right arm, 2:15 p.m. He asked Mrs. Yamamoto a few gentle questions: any headache? Any blurred vision? She mentioned, almost as an afterthought, that she\'d had "a bit of a headache" since lunch and her vision seemed "a little fuzzy." Carlos reported all of it to the nurse right away — the reading, the headache, the vision.',
                '**The outcome:** The nurse assessed Mrs. Yamamoto, confirmed the high reading, and reached the doctor. It turned out she had missed her morning blood pressure medication during a busy schedule change. The doctor gave orders, her pressure was brought down safely over the next hours, and a possible stroke was very likely prevented — all because the reading was accurate and honest, and reported fast.',
                '**Discussion:** Mrs. Yamamoto seemed perfectly fine. That\'s the trap of the silent killer. If Carlos had rounded the number to look normal, or skipped reporting because she "seemed okay," the missed medication and the dangerous pressure would have gone unnoticed. He measured correctly, recorded honestly, asked about symptoms, and reported fast. That\'s the entire CNA role in hypertension, done exactly right.',
              ].join('\n\n'),
            },
            {
              id: 'htn-s11-reflection-1',
              type: 'reflection',
              prompt:
                'Carlos was tempted to write down a reading closer to Mrs. Yamamoto\'s normal because she "looked fine." Why is recording the true number — even a surprising one — so important in hypertension care?',
              minCharacters: 50,
            },
            {
              id: 'htn-s11-reflection-2',
              type: 'reflection',
              prompt:
                'Mrs. Yamamoto didn\'t mention her headache or vision changes until Carlos gently asked. What does this teach about combining the blood pressure number with what the CNA observes and asks?',
              minCharacters: 50,
            },
            {
              id: 'htn-s11-reflection-intro-text',
              type: 'text',
              body: 'Reflect on the case study in the previous lesson. Your written responses help you apply what you learned about accurate measurement, honest recording, and faithful reporting.',
            },
            {
              id: 'htn-s11-kc2-check',
              type: 'knowledge_check',
              question:
                'A CNA does not give blood pressure medications, does not skip or delay a dose, and does not decide that a resident should "hold" their pill because a reading looks low. When a reading looks low and a pill is due, the CNA SHOULD:',
              options: [
                { id: 'hold-pill', label: 'Hold the medication on their own since the reading is low' },
                {
                  id: 'report-nurse',
                  label: 'Report the low reading to the nurse and let the nurse decide',
                },
                { id: 'give-scheduled', label: 'Give the medication as scheduled and say nothing' },
                { id: 'wait-recheck', label: 'Wait and recheck later without telling anyone' },
              ],
              correctOptionId: 'report-nurse',
              explanation:
                'You do not make that decision, and you do not delay the pill on your own. You report the low reading to the nurse right away, and the nurse decides.',
              requiredForCompletion: true,
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
            { id: 'htn-s12-heading', type: 'heading', level: 1, text: 'Conclusion' },
            {
              id: 'htn-s12-video',
              type: 'video',
              title: 'Conclusion',
              videoUrl: `${ASSET_BASE}/s12-conclusion.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s12-conclusion.mp4`,
            },
            {
              id: 'htn-s12-image',
              type: 'image',
              src: '/assets/courses/hypertension/s12-hero.jpg',
              caption: 'Measure accurately, report promptly, stay within scope.',
            },
            {
              id: 'htn-s12-narration',
              type: 'text',
              body: [
                'You\'ve reached the end. Let\'s lock in the five things that matter most.',
                '**One.** Hypertension is the silent killer. Most residents feel nothing, even when their pressure is dangerously high. The number is often the only clue — which is why your measurement matters so much.',
                '**Two.** Accurate technique is everything. Rested resident, back supported, feet flat, arm supported at heart level, correct cuff on bare skin, no talking, same arm and same way each time. A wrong technique gives a wrong number, and a wrong number can lead to a wrong decision.',
                '**Three.** Record honestly and immediately. Both numbers, the arm, the time — written down right away, never from memory, never rounded to look normal. The surprising reading is often the important one.',
                '**Four.** Know what to report. Readings that are high, low, or paired with symptoms — the same shift. And know the emergency: a very high reading with a severe headache, chest pain, confusion, vision changes, or one-sided weakness. Stay with the resident and notify the nurse immediately.',
                '**Five.** Honor your scope. You measure, observe, and report. You do not diagnose, you do not give or hold blood pressure medication, and you do not tell the resident what their numbers mean — that\'s the nurse\'s role. When a reading looks low and a pill is due, you don\'t decide. You report, and the nurse decides.',
              ].join('\n\n'),
            },
            {
              id: 'htn-s12-summary',
              type: 'summary',
              title: 'Five things that matter most',
              items: [
                'Hypertension is the silent killer — the number is often the only clue.',
                'Accurate technique is everything — rested resident, supported arm at heart level, right cuff, no talking.',
                'Record honestly and immediately — never round or record from memory.',
                'Know what to report — high, low, or paired with symptoms; know the emergency signs.',
                'Honor your scope — measure, observe, and report; the nurse decides on medications and meaning.',
              ],
            },
            {
              id: 'htn-s12-what-happens-next-text',
              type: 'text',
              body: 'Ten questions are waiting. Everything on them was covered here. You\'re ready. Trust what you\'ve learned, and show what you know.',
            },
            {
              id: 'htn-s12-completion-requirements-text',
              type: 'text',
              body: 'This course provides one hour of continuing education credit through CAL ACE Nursing Academy, an approved CDPH continuing education provider, NAC number 7384. Your certificate is generated automatically when you pass the knowledge check.',
            },
            {
              id: 'htn-s12-completion-requirements-callout',
              type: 'callout',
              variant: 'info',
              title: 'Scope reminder',
              body: 'CNAs measure, observe, and report. CNAs do not diagnose hypertension or manage blood pressure medications.',
            },
            {
              id: 'htn-s12-certificate-access-text',
              type: 'text',
              body: 'Your certificate is generated automatically when you pass the knowledge check. CDPH-Approved CE Provider — NAC #7384.',
            },
          ]),
      },
    ],
  },
];

export async function seedCourse14Hypertension(
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
  console.log(`Seeding Course 14 (Hypertension) as DRAFT — slug "${COURSE_SLUG}"…`);

  try {
    const result = await seedCourse14Hypertension(prisma);
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
