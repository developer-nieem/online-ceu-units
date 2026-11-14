/**
 * Seed Course 26 — Caring for a Resident with Diabetes (Type 1 & Type 2) (DRAFT).
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-26-diabetes
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
const COURSE_SLUG = 'diabetes';
const COURSE_TITLE = 'Diabetes Care Basics for Type 1 and Type 2 Residents';
const COURSE_SUMMARY =
  'Learn to support a resident with diabetes — understanding the disease, supporting meals and activity, meticulous foot and skin care, and recognizing and responding to low and high blood sugar. CNAs do not diagnose diabetes, give or adjust insulin or diabetes medications, or decide on insulin doses.';

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
    'Explain what diabetes is, in plain language',
    'Recognize and respond to low and high blood sugar',
    'Provide protective foot and skin care',
    'Support the diabetic care plan',
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
  heroImage: '/assets/courses/diabetes/hero-banner.png',
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
    title: 'Understanding Diabetes',
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: 'Introduction',
        sortOrder: 0,
        buildContent: () =>
          doc('Introduction', [
            { id: 'dm-s01-heading', type: 'heading', level: 1, text: 'Welcome' },
            {
              id: 'dm-s01-video',
              type: 'video',
              title: 'Introduction',
              videoUrl: '/assets/courses/diabetes/s01-intro.mp4',
              placeholderNote: 'Pending upload: /assets/courses/diabetes/s01-intro.mp4',
            },
            {
              id: 'dm-s01-image',
              type: 'image',
              src: '/assets/courses/diabetes/s01-hero.jpg',
              caption: 'Diabetes care — protecting a resident whose body cannot manage blood sugar on its own.',
            },
            {
              id: 'dm-s01-narration',
              type: 'text',
              body: [
                'Welcome to CAL ACE Nursing Academy.',
                'This course is about diabetes — one of the most common conditions you will ever care for, and one where the CNA\'s daily attention makes an enormous difference.',
                'Diabetes is a condition where the body can\'t properly manage sugar — glucose — in the blood. Glucose is the body\'s fuel, and a hormone called insulin is the key that lets glucose move out of the blood and into the cells to be used for energy. In diabetes, either the body doesn\'t make enough insulin, or it can\'t use insulin properly. Either way, glucose builds up in the blood instead of feeding the cells.',
                'You\'ll hear about two main types. Type 1, where the body makes little or no insulin and the person depends on insulin injections to live. And type 2, far more common, where the body still makes insulin but can\'t use it well — managed with diet, activity, pills, and sometimes insulin. Many of your residents will have type 2; some will have type 1. Your daily care matters for both.',
                'Here is the heart of this course, the part that can save a life: blood sugar that goes too low, or too high, is dangerous. Low blood sugar — hypoglycemia — can come on fast and become an emergency within minutes. High blood sugar builds more slowly but can become a serious crisis too. The CNA is very often the first person to notice the signs — a resident suddenly shaky and confused, or unusually drowsy and thirsty. Recognizing those signs and acting correctly is one of the most important things you\'ll learn.',
                'This course also teaches a piece of care that prevents amputations: diabetic foot care. People with diabetes can lose feeling in their feet and heal poorly, so a small unnoticed sore can become a catastrophe. Your careful eyes on a resident\'s feet are real, limb-saving care.',
                'Your scope is clear. A CNA supports meals and activity, provides meticulous foot and skin care, recognizes and responds to low and high blood sugar, and reports faithfully. A CNA does not diagnose diabetes, does not give or adjust insulin or any diabetes medication, and does not decide on doses.',
                'By the end of this course, you will be able to: explain what diabetes is, in plain language. Recognize and respond to low and high blood sugar. Provide protective foot and skin care. Support the diabetic care plan. And know your scope.',
                'There is a ten-question knowledge check at the end. Everything on it is covered here. Let\'s begin.',
              ].join('\n\n'),
            },
            {
              id: 'dm-s01-ci-text',
              type: 'text',
              body: [
                'This course teaches the CNA\'s role in supporting a resident with diabetes — understanding the disease, supporting meals and activity, meticulous foot and skin care, and above all recognizing and responding to low and high blood sugar.',
                'Let\'s be clear about your role. A CNA supports meals and activity, provides meticulous foot and skin care, recognizes and responds to low and high blood sugar, and reports faithfully. A CNA does not diagnose diabetes, does not give or adjust insulin or any diabetes medication, and does not decide on doses. Those are nursing and physician tasks. But none of them can happen without your careful observation and faithful reporting first.',
              ].join('\n\n'),
            },
            {
              id: 'dm-s01-ci-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of this course',
              body: 'CNAs SUPPORT MEALS, PROTECT FEET, RECOGNIZE & RESPOND, and REPORT. CNAs do not diagnose diabetes, give or adjust insulin or diabetes medications, or decide on doses.',
            },
            {
              id: 'dm-s01-lo-text',
              type: 'text',
              body: 'By the end of this course, you will be able to:',
            },
            {
              id: 'dm-s01-lo-summary',
              type: 'summary',
              title: 'Learning objectives',
              items: [
                'Explain what diabetes is, in plain language.',
                'Recognize and respond to low and high blood sugar.',
                'Provide protective foot and skin care.',
                'Support the diabetic care plan.',
                'Know your scope — what a CNA does, and what a CNA must never do.',
              ],
            },
            {
              id: 'dm-s01-ii-text',
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
            { id: 'dm-s02-heading', type: 'heading', level: 1, text: 'Key terms' },
            {
              id: 'dm-s02-image',
              type: 'image',
              src: '/assets/courses/diabetes/s02-hero.jpg',
              caption: 'Key diabetes terms — hypoglycemia, hyperglycemia, insulin, and the signs that matter.',
            },
            {
              id: 'dm-s02-reveal-diabetes',
              type: 'reveal_card',
              frontTitle: 'Diabetes',
              frontBody: 'Dy-ah-BEE-teez',
              backTitle: 'Diabetes',
              backBody:
                'A condition where the body can\'t properly control the amount of sugar, called glucose, in the blood. Glucose builds up in the blood instead of feeding the body\'s cells. Over time, high blood sugar damages many parts of the body.',
            },
            {
              id: 'dm-s02-reveal-glucose',
              type: 'reveal_card',
              frontTitle: 'Glucose',
              frontBody: 'GLOO-kose',
              backTitle: 'Glucose',
              backBody:
                'The sugar in the blood that the body uses for energy — its main fuel. It comes from the food we eat, especially carbohydrates. The body needs glucose, but it must stay in a healthy range: not too high, not too low.',
            },
            {
              id: 'dm-s02-reveal-insulin',
              type: 'reveal_card',
              frontTitle: 'Insulin',
              frontBody: 'IN-suh-lin',
              backTitle: 'Insulin',
              backBody:
                'A hormone made by the pancreas. It\'s the key that unlocks the body\'s cells so glucose can move out of the blood and into the cells for energy. Without enough insulin, or without the body using it well, glucose stays stuck in the blood.',
            },
            {
              id: 'dm-s02-reveal-type1',
              type: 'reveal_card',
              frontTitle: 'Type 1 Diabetes',
              frontBody: 'Type 1',
              backTitle: 'Type 1 Diabetes',
              backBody:
                'The body makes little or no insulin, because the immune system has damaged the cells that make it. People with type 1 must take insulin every day to live. It often begins in childhood or young adulthood, but residents of any age can have it.',
            },
            {
              id: 'dm-s02-reveal-type2',
              type: 'reveal_card',
              frontTitle: 'Type 2 Diabetes',
              frontBody: 'Type 2',
              backTitle: 'Type 2 Diabetes',
              backBody:
                'The most common type. The body still makes insulin, but can\'t use it well — called insulin resistance — and over time may make less. It\'s managed with healthy eating, activity, pills, and sometimes insulin. It\'s strongly linked to age, weight, and family history.',
            },
            {
              id: 'dm-s02-reveal-hypoglycemia',
              type: 'reveal_card',
              frontTitle: 'Hypoglycemia (Low Blood Sugar)',
              frontBody: 'Hy-po-gly-SEE-mee-ah',
              backTitle: 'Hypoglycemia (Low Blood Sugar)',
              backBody:
                'Low blood sugar. It can come on quickly and become an emergency. Signs include shakiness, sweating, confusion, irritability, hunger, and weakness. Remember the word "low" — and that low can drop fast. This is the emergency to act on quickest.',
            },
            {
              id: 'dm-s02-reveal-hyperglycemia',
              type: 'reveal_card',
              frontTitle: 'Hyperglycemia (High Blood Sugar)',
              frontBody: 'Hy-per-gly-SEE-mee-ah',
              backTitle: 'Hyperglycemia (High Blood Sugar)',
              backBody:
                'High blood sugar. It builds more slowly. Signs include extreme thirst, frequent urination, fatigue, blurred vision, and a flushed, dry appearance. Very high blood sugar over time can become a dangerous crisis.',
            },
            {
              id: 'dm-s02-reveal-monitoring',
              type: 'reveal_card',
              frontTitle: 'Blood Glucose Monitoring',
              frontBody: 'Blood glucose monitoring',
              backTitle: 'Blood Glucose Monitoring',
              backBody:
                'Checking the level of sugar in the blood, often with a small fingerstick and meter, or a continuous sensor. It guides care decisions. Depending on your facility and training, CNAs may assist with monitoring — and always report the readings to the nurse.',
            },
            {
              id: 'dm-s02-kc1-check-insulin',
              type: 'knowledge_check',
              question: 'Match the term: the key that lets glucose enter the body\'s cells',
              options: [
                { id: 'insulin', label: 'Insulin' },
                { id: 'hypoglycemia', label: 'Hypoglycemia' },
                { id: 'hyperglycemia', label: 'Hyperglycemia' },
              ],
              correctOptionId: 'insulin',
              explanation:
                'Insulin. A hormone made by the pancreas — the key that unlocks the body\'s cells so glucose can move out of the blood and into the cells for energy.',
              requiredForCompletion: true,
            },
            {
              id: 'dm-s02-kc1-check-hypoglycemia',
              type: 'knowledge_check',
              question: 'Match the term: low blood sugar — can become an emergency fast',
              options: [
                { id: 'insulin', label: 'Insulin' },
                { id: 'hypoglycemia', label: 'Hypoglycemia' },
                { id: 'hyperglycemia', label: 'Hyperglycemia' },
              ],
              correctOptionId: 'hypoglycemia',
              explanation:
                'Hypoglycemia. Low blood sugar — it can come on quickly and become an emergency. Signs include shakiness, sweating, confusion, irritability, hunger, and weakness.',
              requiredForCompletion: true,
            },
            {
              id: 'dm-s02-kc1-check-hyperglycemia',
              type: 'knowledge_check',
              question: 'Match the term: high blood sugar — builds more slowly',
              options: [
                { id: 'insulin', label: 'Insulin' },
                { id: 'hypoglycemia', label: 'Hypoglycemia' },
                { id: 'hyperglycemia', label: 'Hyperglycemia' },
              ],
              correctOptionId: 'hyperglycemia',
              explanation:
                'Hyperglycemia. High blood sugar — it builds more slowly. Signs include extreme thirst, frequent urination, fatigue, blurred vision, and a flushed, dry appearance.',
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
            { id: 'dm-s03-heading', type: 'heading', level: 1, text: 'Statistics' },
            pendingAudio(
              'dm-s03-audio',
              'Diabetes: One of the Most Common Conditions in Long-Term Care',
              `${ASSET_BASE}/s03-stats-podcast.mp3`,
              [
                'Diabetes: One of the Most Common Conditions in Long-Term Care',
                '',
                'Diabetes is extraordinarily common. More than 38 million Americans have diabetes, and the rate climbs steeply with age — roughly one in four adults over 65 has it. That makes diabetes one of the most common conditions in any long-term care facility. The great majority — over ninety percent — have type 2 diabetes; a smaller number have type 1 and depend on insulin to live.',
                '',
                'Diabetes matters so much in daily care because of what high blood sugar does to the body over time, and because of the immediate dangers of blood sugar swinging too low or too high.',
                '',
                'The long-term complications are serious. Diabetes damages blood vessels and nerves throughout the body. It\'s a leading cause of kidney failure, blindness, heart disease, and stroke. And it\'s the leading cause of lower-limb amputations — because diabetes damages the nerves and blood flow in the feet. A person with diabetes may lose feeling in their feet and heal poorly, so a small cut, blister, or pressure sore can quietly become infected and, if missed, lead to amputation. This is exactly why diabetic foot care, done by CNAs, is so important — careful daily attention to the feet prevents catastrophes.',
                '',
                'The immediate dangers are blood sugar emergencies. Low blood sugar — hypoglycemia — can develop within minutes, especially in residents on insulin or certain pills, and can quickly cause confusion, loss of consciousness, and seizures if not treated fast. High blood sugar builds more slowly but can become a life-threatening crisis. Because CNAs are with residents constantly, they are very often the first to spot the early signs of both — and fast recognition saves lives.',
                '',
                'Here\'s the empowering part for CNAs. So much of good diabetes care is daily, hands-on, and squarely in the CNA role: supporting balanced meals and consistent eating, encouraging activity, providing meticulous foot and skin care, recognizing and responding to blood sugar emergencies, and reporting changes. Studies show that this kind of attentive daily care meaningfully reduces complications and hospitalizations.',
                '',
                'The bottom line: diabetes is common and carries both slow and sudden dangers — and the CNA\'s daily meals support, foot care, and blood-sugar vigilance are central to keeping residents safe.',
              ].join('\n'),
              '/assets/courses/diabetes/s03-stats-podcast.mp3',
            ),
            {
              id: 'dm-s03-image',
              type: 'image',
              src: '/assets/courses/diabetes/s03-hero.jpg',
              caption: 'Diabetes is common in long-term care — daily vigilance prevents emergencies.',
            },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: 'Fundamentals',
        sortOrder: 3,
        buildContent: () =>
          doc('Fundamentals', [
            { id: 'dm-s04-heading', type: 'heading', level: 1, text: 'Fundamentals' },
            {
              id: 'dm-s04-video',
              type: 'video',
              title: 'Fundamentals',
              videoUrl: '/assets/courses/diabetes/s04-fundamentals.mp4',
              placeholderNote: 'Pending upload: /assets/courses/diabetes/s04-fundamentals.mp4',
            },
            {
              id: 'dm-s04-image',
              type: 'image',
              src: '/assets/courses/diabetes/s04-hero.jpg',
              caption: 'How blood sugar works, and what goes wrong when it runs too low or too high.',
            },
            {
              id: 'dm-s04-narration',
              type: 'text',
              body: [
                '**Glucose: the body\'s fuel**',
                'Every cell in the body needs fuel to work, and that fuel is glucose — sugar that comes mostly from the food we eat. After a meal, glucose enters the blood, ready to be delivered to the cells.',
                '**Insulin: the key to the cells**',
                'But glucose can\'t get into the cells on its own. It needs a key — the hormone insulin, made by the pancreas. Insulin unlocks the cells so glucose can move out of the blood and inside, where it\'s used for energy. When insulin works, blood sugar stays in a healthy range.',
                '**What goes wrong in diabetes**',
                'In diabetes, this system breaks down. In type 1, the body makes little or no insulin — there\'s no key. In type 2, the body makes insulin, but the cells resist it — the key no longer fits the lock well. Either way, glucose can\'t get into the cells, so it piles up in the blood. The cells go hungry while the blood grows sweet.',
                '**Why high blood sugar harms the body**',
                'Over time, all that extra glucose in the blood acts like a slow poison to blood vessels and nerves. It damages the tiny vessels in the eyes, the kidneys, and the nerves — especially in the feet. It speeds up heart disease and stroke. This is why keeping blood sugar in a good range, every day, protects a resident\'s whole body and future.',
                '**Why low blood sugar is an immediate emergency**',
                'Now the flip side. The brain runs almost entirely on glucose. When blood sugar drops too low — from too much insulin, a skipped meal, or extra activity — the brain is starved of fuel fast. Within minutes, the resident can become shaky, confused, and combative, then lose consciousness or seize. This is why low blood sugar is the emergency you act on fastest.',
                '**The balancing act**',
                'Managing diabetes is a daily balancing act between three things: food, which raises blood sugar; activity, which lowers it; and medication or insulin, which lowers it. When these are balanced, blood sugar stays in range. When they\'re off — a missed meal, an extra-active day, a medication change — blood sugar can swing too low or too high. The CNA helps keep that balance steady and notices when it tips.',
                '**Managed well, life is full**',
                'Diabetes can\'t be cured, but it can be managed very well. With balanced meals, activity, the right medications, good foot care, and attentive daily support, residents with diabetes live full, healthy lives and avoid most complications. Your daily care is a central part of that good management.',
              ].join('\n\n'),
            },
            {
              id: 'dm-s04-low-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Low blood sugar = fast brain emergency',
              body: 'When blood sugar drops too low, the brain is starved of fuel fast. Low blood sugar is the emergency you act on fastest — within minutes.',
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
            { id: 'dm-s05-heading', type: 'heading', level: 1, text: 'Signs & Symptoms' },
            {
              id: 'dm-s05-image',
              type: 'image',
              src: '/assets/courses/diabetes/s05-hero.jpg',
              caption: 'Recognizing low blood sugar fast — cold, clammy, shaky, confused.',
            },
            {
              id: 'dm-s05-narration',
              type: 'text',
              body: [
                'This is the most important section in the course. You must be able to recognize low and high blood sugar — and tell them apart — because the response is urgent and different for each. Let\'s learn both.',
                '**Low blood sugar: fast and shaky**',
                'Low blood sugar — hypoglycemia — comes on FAST, often within minutes. Burn these signs in: shakiness or trembling. Sweating, often cold and clammy. Sudden confusion or trouble concentrating. Irritability, anxiety, or unusual behavior — a normally calm resident becoming combative. Hunger. Dizziness, weakness, a pounding heart, pale skin. As it worsens: slurred speech, loss of coordination, and finally loss of consciousness or seizures. A handy memory aid: low blood sugar makes a resident look "cold and clammy."',
                '**Low blood sugar: act immediately**',
                'Low blood sugar is the emergency you act on fastest, because the brain is being starved right now. If a conscious resident shows these signs and can safely swallow, the standard response — following your facility\'s policy and care plan — is to give a fast-acting sugar immediately: about four ounces of juice or regular soda, glucose tablets, or similar. Then alert the nurse right away. If the resident can\'t swallow safely, is unconscious, or is seizing — never put anything in their mouth; activate emergency help immediately. When in doubt about low versus high, facilities generally treat for low first, because low is the faster killer.',
                '**High blood sugar: slow and dry**',
                'High blood sugar — hyperglycemia — builds more slowly, over hours to days. The signs: extreme thirst. Frequent urination. Fatigue and drowsiness. Blurred vision. A flushed, warm, dry appearance — the memory aid here is "hot and dry, sugar high." As it becomes severe, watch for deep rapid breathing, breath that smells fruity, nausea and vomiting, and increasing drowsiness toward unconsciousness — signs of a dangerous crisis that needs emergency help.',
                '**The danger of the "off" resident**',
                'Here\'s a vital point: both low and high blood sugar can make a resident confused, drowsy, or "not themselves." In an older adult, that change may be the only obvious sign. So when a resident with diabetes is suddenly confused, behaving oddly, unusually drowsy, or just "off," think blood sugar — and report it immediately so it can be checked. Don\'t dismiss it as a mood or a bad day.',
                '**Summary**',
                'Two pictures. LOW blood sugar: fast onset, shaky, sweaty, cold and clammy, confused, irritable — act immediately with fast sugar if they can swallow, and alert the nurse. HIGH blood sugar: slow onset, thirsty, frequent urination, hot and dry, fatigued, fruity breath if severe — report promptly and get help if severe.',
                'The rule underneath it all: cold and clammy, need candy; hot and dry, sugar high. And when in doubt with a conscious resident who can swallow, treat for low first — and always get the nurse.',
              ].join('\n\n'),
            },
            {
              id: 'dm-s05-low-high-callout',
              type: 'callout',
              variant: 'warning',
              title: 'Cold and clammy vs hot and dry',
              body: 'Low blood sugar: cold and clammy, need candy — act immediately. High blood sugar: hot and dry, sugar high — report promptly. When in doubt, treat for low first.',
            },
          ]),
      },
      {
        slug: 's06-causes',
        title: 'Causes',
        sortOrder: 1,
        buildContent: () =>
          doc('Causes', [
            { id: 'dm-s06-heading', type: 'heading', level: 1, text: 'Causes' },
            pendingAudio(
              'dm-s06-audio',
              'What Causes Diabetes — and What Makes Blood Sugar Swing?',
              `${ASSET_BASE}/s06-causes-podcast.mp3`,
              [
                'What Causes Diabetes — and What Makes Blood Sugar Swing?',
                '',
                'The two main types of diabetes have different causes. Type 1 diabetes is an autoimmune condition: the body\'s immune system mistakenly destroys the insulin-making cells in the pancreas, so the body can no longer make insulin. It\'s not caused by lifestyle or diet, and the person needs insulin for life. Type 2 diabetes develops when the body becomes resistant to insulin and gradually can\'t keep up. Its risk factors include age, family history, excess weight, and inactivity — though it\'s important to approach residents without blame, because many factors are outside a person\'s control.',
                '',
                'But for the CNA, the more useful day-to-day question isn\'t what caused the diabetes — it\'s what makes a resident\'s blood sugar swing too low or too high, because recognizing and preventing those swings is daily, hands-on work.',
                '',
                'Blood sugar goes too LOW — hypoglycemia — usually from a mismatch between medication and food or activity. The big causes: a resident received their insulin or diabetes pill but then ate too little, skipped a meal, or ate late. Or they were more physically active than usual, which burns glucose. Or there was a medication issue. This is why, for residents on insulin or certain pills, making sure they actually eat their meals — and reporting when they don\'t — is so important. A resident who gets insulin and then refuses lunch is heading toward a low.',
                '',
                'Blood sugar goes too HIGH — hyperglycemia — usually from the opposite: too much food, especially sweets and carbohydrates; not enough medication or a missed dose; illness or infection, which raises blood sugar; or less activity than usual. Stress can raise it too. Illness is a big one — when a resident with diabetes gets sick, their blood sugar often climbs, which is one reason any illness in a diabetic resident is watched closely.',
                '',
                'Here\'s what this means for the CNA. You have real influence over the swings. Making sure residents eat appropriately and consistently, reporting missed meals especially after insulin, encouraging the planned activity, watching for illness, and noticing early signs of a swing — all of this keeps blood sugar steadier and prevents emergencies. You can\'t change why a resident has diabetes, but you powerfully affect how stable their blood sugar stays each day.',
              ].join('\n'),
              '/assets/courses/diabetes/s06-causes-podcast.mp3',
            ),
            {
              id: 'dm-s06-image',
              type: 'image',
              src: '/assets/courses/diabetes/s06-hero.jpg',
              caption: 'Causes and triggers — missed meals, medication timing, illness, and activity.',
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
              id: 'dm-s07-heading',
              type: 'heading',
              level: 1,
              text: 'CNA Role & Best Practices',
            },
            {
              id: 'dm-s07-image',
              type: 'image',
              src: '/assets/courses/diabetes/s07-hero.jpg',
              caption: 'CNA scope in diabetes care — observe, report, support; never give or adjust insulin.',
            },
            {
              id: 'dm-s07-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of practice',
              body: 'CNAs SUPPORT, WATCH, and RESPOND. CNAs never give or adjust insulin or diabetes medication, or decide a dose.',
            },
            {
              id: 'dm-s07-narration',
              type: 'text',
              body: [
                'Diabetes treatment balances food, activity, and medication — and the CNA supports all three without ever giving or adjusting a dose. Let\'s walk through it, starting as always with the rule that never bends. A CNA does not give or adjust insulin or any diabetes medication, and never decides on a dose.',
                '**Insulin.** People with type 1, and some with type 2, take insulin — by injection or pump — to do the job their body can\'t. Insulin is powerful and precise: too much can cause dangerous low blood sugar; too little lets blood sugar climb. The dose depends on blood sugar readings, food, and activity, and is decided by the nurse or doctor and given under the nurse\'s responsibility. Your scope is firm: you never give or adjust insulin. What you do is critical support — making sure the resident eats after insulin is given, reporting if they don\'t eat, and watching for the signs of low blood sugar that too much insulin can cause.',
                '**Oral diabetes medications.** Many residents with type 2 take pills that help lower blood sugar. Some of these can also cause low blood sugar, especially if a meal is missed. You don\'t give them — but you support the routine and report missed meals and missed doses, and you watch for lows.',
                '**The low blood sugar response — know it cold.** This is the treatment knowledge that saves lives. For a conscious resident with signs of low blood sugar who can safely swallow, your facility\'s policy and the care plan typically direct giving a fast-acting sugar right away — juice, regular soda, glucose tablets — and alerting the nurse immediately. For a resident who can\'t swallow safely, is unconscious, or seizing — nothing by mouth; activate emergency help now. Know your facility\'s exact policy before you ever need it.',
                '**Meals and activity as treatment.** Consistent, balanced meals and regular activity are genuine diabetes treatment. You support them directly: serving the planned diet, encouraging residents to eat consistently, supporting activity, and reporting changes in appetite or intake — all of which keep blood sugar steady.',
                '**Foot and skin care as treatment.** As you\'ll see, foot care prevents the complications that lead to amputation. It\'s preventive treatment squarely in CNA hands.',
                'The scope point for this section: you never give or adjust insulin or any diabetes medication — but you support meals, activity, and foot care, you watch for blood sugar emergencies, and you know the low-blood-sugar response cold.',
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
            { id: 'dm-s08-heading', type: 'heading', level: 1, text: 'Prevention & Risk Reduction' },
            {
              id: 'dm-s08-image',
              type: 'image',
              src: '/assets/courses/diabetes/s08-hero.png',
              caption: 'Prevention — regular meals, foot checks, skin protection, and prompt reporting.',
            },
            {
              id: 'dm-s08-narration',
              type: 'text',
              body: [
                'With diabetes, CNAs prevent two things: dangerous blood sugar swings, and the slow complications like foot wounds. Here are seven ways.',
                '**One. Make sure residents eat — especially after insulin.** A resident who gets insulin and then doesn\'t eat is headed for a dangerous low. Serve meals on time, encourage residents to eat, and report immediately if a resident on insulin or diabetes pills refuses or doesn\'t finish a meal. This single habit prevents many low-blood-sugar emergencies.',
                '**Two. Support consistent, balanced meals.** Serve the planned diabetic diet, watch portions of sweets and carbohydrates, and keep eating consistent. Give the nurse a heads-up when family brings in sweets or extra food. Steady eating means steady blood sugar.',
                '**Three. Provide meticulous foot care — this prevents amputations.** Inspect the feet daily for cuts, blisters, redness, sores, swelling, or color changes — the resident may not feel them. Keep feet clean and dry, especially between the toes. Ensure proper, well-fitting footwear, and never let a diabetic resident walk barefoot. Report any foot finding immediately. Your eyes on their feet save limbs.',
                '**Four. Protect the skin everywhere.** Diabetes slows healing and raises infection risk, so protect skin from injury, keep it clean and moisturized as the plan directs, reposition to prevent pressure injuries, and report any wound or skin change promptly. A small problem caught early stays small.',
                '**Five. Encourage activity as planned.** Regular movement helps lower and steady blood sugar. Support the activity the care plan includes — but know that extra activity can also cause a low, so make sure residents eat appropriately around it and watch for low signs after unusual exertion.',
                '**Six. Watch closely during illness.** When a resident with diabetes gets sick, blood sugar often climbs and swings become more likely. Report illness, fever, vomiting, or poor eating promptly — sick days need extra blood-sugar attention from the team.',
                '**Seven. Know each resident\'s blood sugar pattern and signs.** Learn how each resident\'s lows and highs look — some get quiet and confused, others irritable or sweaty. Knowing their personal pattern means you\'ll catch a swing faster. Report readings, and report any "off" or "not themselves" change immediately.',
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
              id: 'dm-s09-heading',
              type: 'heading',
              level: 1,
              text: 'Scenario & Reporting',
            },
            pendingAudio(
              'dm-s09-intro-audio',
              'Emergency response scenarios intro',
              `${ASSET_BASE}/s09-emergency-intro.mp3`,
              'With diabetes, the judgment that saves lives is recognizing a low blood sugar and acting fast, and knowing the difference between a resident who can safely swallow and one who can\'t. You\'re about to work through two situations. Read each carefully, choose your action, and you\'ll get feedback right away. Keep the memory aid in mind: cold and clammy, need candy; hot and dry, sugar high — and when in doubt with a conscious resident, treat for low first.',
              '/assets/courses/diabetes/s09-emergency-intro.mp3',
            ),
            {
              id: 'dm-s09-image',
              type: 'image',
              src: '/assets/courses/diabetes/s09-hero.png',
              caption: 'Two diabetes judgments — a fast hypoglycemia emergency, and knowing when nothing goes by mouth.',
            },
            {
              id: 'dm-s09-scenario-lindgren-image',
              type: 'image',
              src: '/assets/courses/diabetes/s09-scenario-lindgren.png',
              caption: 'Cold, clammy, shaky and confused: treat low blood sugar fast and get the nurse.',
            },
            {
              id: 'dm-s09-scenario-lindgren',
              type: 'scenario_question',
              prompt:
                'About an hour after Mrs. Lindgren received her insulin, you notice she\'s suddenly shaky, sweating, cold and clammy, and confused — she\'s normally sharp but now can\'t follow your simple question. You recall she only ate a few bites of lunch. She is awake and able to swallow. What is the BEST action?',
              options: [
                {
                  id: 'wait-see',
                  label: 'Wait and see if she improves on her own',
                  feedback:
                    'This is low blood sugar — cold, clammy, shaky, and confused after insulin with little food. Waiting wastes precious minutes while her brain is starved, and giving insulin would be catastrophic. Since she\'s awake and can swallow, the right action is to give a fast-acting sugar per facility policy and alert the nurse immediately.',
                },
                {
                  id: 'fast-sugar',
                  label: 'Give a fast-acting sugar like juice per facility policy and alert the nurse immediately',
                  feedback:
                    'Exactly right. Shaky, sweating, cold and clammy, and newly confused — about an hour after insulin, with a barely-eaten lunch — is classic low blood sugar, and it can worsen fast. Since she\'s awake and can swallow safely, follow your facility\'s policy and the care plan: give a fast-acting sugar right away, such as about four ounces of juice or regular soda or glucose tablets, and alert the nurse immediately. Never give insulin — that would drop her sugar further and could be fatal. And never just "wait and see" with a low; the brain is being starved right now.',
                  isRecommended: true,
                },
                {
                  id: 'give-insulin',
                  label: 'Give her insulin to help',
                  feedback:
                    'This is low blood sugar — cold, clammy, shaky, and confused after insulin with little food. Waiting wastes precious minutes while her brain is starved, and giving insulin would be catastrophic. Since she\'s awake and can swallow, the right action is to give a fast-acting sugar per facility policy and alert the nurse immediately.',
                },
                {
                  id: 'lie-down',
                  label: 'Encourage her to lie down and nap',
                  feedback:
                    'This is low blood sugar — cold, clammy, shaky, and confused after insulin with little food. Waiting wastes precious minutes while her brain is starved, and giving insulin would be catastrophic. Since she\'s awake and can swallow, the right action is to give a fast-acting sugar per facility policy and alert the nurse immediately.',
                },
              ],
              requiredForCompletion: true,
            },
            {
              id: 'dm-s09-scenario-osei-image',
              type: 'image',
              src: '/assets/courses/diabetes/s09-scenario-osei.png',
              caption: 'Drowsy and unable to swallow safely: nothing by mouth — call for help immediately.',
            },
            {
              id: 'dm-s09-scenario-osei',
              type: 'scenario_question',
              prompt:
                'You find Mr. Osei, who has diabetes and takes insulin, very difficult to wake. He\'s barely responsive, his speech is slurred and he can\'t follow directions, and he doesn\'t seem able to swallow safely. A coworker says, "Let\'s pour some juice in his mouth to bring his sugar up." What SHOULD the CNA do?',
              options: [
                {
                  id: 'pour-juice',
                  label: 'Pour juice into his mouth as the coworker suggests',
                  feedback:
                    'This resident can\'t swallow safely, so putting juice in his mouth risks choking and aspiration — never do it. Giving insulin or letting him sleep could be fatal. The right action: give nothing by mouth, activate emergency help immediately, stay with him, and report that he has diabetes and takes insulin.',
                },
                {
                  id: 'nothing-by-mouth',
                  label: 'Give nothing by mouth and activate emergency help immediately',
                  feedback:
                    'Right. A resident who is barely responsive and can\'t swallow safely must never be given anything by mouth — juice could go into his lungs and cause choking or aspiration. This is a medical emergency, whatever the cause: activate emergency help immediately, stay with him, keep him safe, and report that he has diabetes and takes insulin. Trained responders and the nurse can raise his blood sugar safely by other means. And you never give insulin to an unresponsive resident. The rule: conscious and able to swallow gets fast sugar; not able to swallow gets nothing by mouth and emergency help now.',
                  isRecommended: true,
                },
                {
                  id: 'give-insulin-osei',
                  label: 'Give him his insulin to be safe',
                  feedback:
                    'This resident can\'t swallow safely, so putting juice in his mouth risks choking and aspiration — never do it. Giving insulin or letting him sleep could be fatal. The right action: give nothing by mouth, activate emergency help immediately, stay with him, and report that he has diabetes and takes insulin.',
                },
                {
                  id: 'sleep-check',
                  label: 'Let him sleep and check back later',
                  feedback:
                    'This resident can\'t swallow safely, so putting juice in his mouth risks choking and aspiration — never do it. Giving insulin or letting him sleep could be fatal. The right action: give nothing by mouth, activate emergency help immediately, stay with him, and report that he has diabetes and takes insulin.',
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
            { id: 'dm-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
              id: 'dm-s10-video',
              type: 'video',
              title: "The CNA's Role",
              videoUrl: '/assets/courses/diabetes/s10-cna-role.mp4',
              placeholderNote: 'Pending upload: /assets/courses/diabetes/s10-cna-role.mp4',
            },
            {
              id: 'dm-s10-image',
              type: 'image',
              src: '/assets/courses/diabetes/s10-hero.png',
              caption: 'The CNA as the daily watch — meals, feet, skin, and the signs no one else sees.',
            },
            {
              id: 'dm-s10-narration',
              type: 'text',
              body: [
                'Your role in diabetes care is daily, practical, and at times lifesaving. Let\'s walk through it.',
                '**Support meals and the food-medication match** Food is at the center of diabetes, and you support it directly. Serve the planned diet, encourage consistent eating, and watch the critical match: when a resident receives insulin or a diabetes pill, make sure they actually eat — and report immediately if they don\'t. A resident who gets insulin and skips the meal is heading for a dangerous low. This one piece of attention prevents real emergencies.',
                '**Protect the feet and skin** Be the guardian of the feet. Inspect them daily — the resident may not feel a wound forming. Look for cuts, blisters, redness, sores, swelling, and color changes; keep feet clean and dry, especially between the toes; ensure proper footwear; never let them go barefoot; and report any finding immediately. Protect the skin everywhere, because diabetes heals slowly and infects easily. Your eyes on their feet genuinely prevent amputations.',
                '**Recognize and respond to blood sugar emergencies** Be ready for the emergencies. Know each resident\'s signs of low and high blood sugar. For a conscious resident with low blood sugar who can swallow — fast sugar per policy, and alert the nurse immediately. For a resident who can\'t swallow safely, is unconscious, or seizing — nothing by mouth, emergency help now. And when any diabetic resident is suddenly confused, drowsy, or "off," think blood sugar and report it for a check. Speed matters most with lows.',
                '**Observe and report** Be the team\'s eyes. Report blood sugar readings if you assist with monitoring. Report missed meals and missed doses, refusal to eat after insulin, foot and skin findings, signs of low or high blood sugar, illness, and any "not themselves" change. Your observations drive the nurse\'s and doctor\'s decisions.',
                'Now the boundary. You do not diagnose diabetes. You never give or adjust insulin or any diabetes medication, and never decide a dose. You do not perform treatments outside your training. And you never give anything by mouth to a resident who can\'t swallow safely, and never ignore a resident who suddenly seems "off."',
                'Inside your role — support meals and the food-insulin match, protect the feet and skin, recognize and respond to blood sugar emergencies, and report faithfully — you keep residents with diabetes safe day to day and step in to save them when blood sugar turns dangerous. Few CNA roles are more vital.',
              ].join('\n\n'),
            },
            {
              id: 'dm-s10-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Stay within scope',
              body: 'You do not diagnose diabetes. You never give or adjust insulin or any diabetes medication, and never decide a dose. You never give anything by mouth to a resident who can\'t swallow safely.',
            },
          ]),
      },
      {
        slug: 's11-case-study',
        title: 'Case Study',
        sortOrder: 2,
        buildContent: () => {
          const caseNarrative = [
            'Mrs. Lindgren, 78, had type 2 diabetes managed with insulin. Her CNA, Tobias, knew her as a sharp, talkative woman who always had an opinion about the weather and the lunch menu.',
            '',
            '**The setup:** One morning, Mrs. Lindgren wasn\'t hungry. The nurse had given her insulin before lunch as scheduled, but when lunch arrived, Mrs. Lindgren picked at it — a few bites of bread, no more — and pushed the tray away, saying her stomach felt "off." Tobias noticed she\'d barely eaten. He knew the danger: insulin given, but almost no food to balance it. He reported it to the nurse right away: "Mrs. Lindgren got her insulin but only ate a few bites of lunch — I\'ll keep a close eye on her." The nurse thanked him and asked him to watch closely.',
            '',
            '**The early signs:** About forty-five minutes later, Tobias passed her room and something was wrong. Mrs. Lindgren, normally chatty, was quiet and looked pale. Her forehead was damp with sweat, her hands were trembling, and when he asked how she felt, she gave a confused, slow answer that didn\'t quite make sense — not like her at all. Cold and clammy, shaky, confused. Tobias recognized it instantly: low blood sugar.',
            '',
            '**What Tobias did:** He stayed calm and moved fast. She was awake and able to swallow, so following the facility\'s hypoglycemia policy and her care plan, he gave her four ounces of juice right away and pressed the call button: "Mrs. Lindgren\'s showing low blood sugar signs — gave her juice per protocol, need the nurse now." He stayed with her, kept her calm, and kept talking to her gently while the sugar took effect.',
            '',
            '**The resolution:** The nurse arrived quickly, checked her blood sugar — confirmed low — and managed her care from there. Within about fifteen minutes of the juice, Mrs. Lindgren\'s color returned, her trembling settled, and her sharp, opinionated self came back. "Well," she said, "that was unpleasant." The nurse adjusted the plan in light of her poor appetite.',
            '',
            '**The outcome:** A potentially dangerous low was caught and treated early, before it could progress to unconsciousness or a seizure. The nurse told Tobias: "You set this up to go right. You flagged the missed lunch after insulin, so we were both watching — and then you knew the signs and acted in seconds. That\'s exactly how a low should be caught."',
            '',
            '**Discussion:** Tobias did two things, and both mattered. First, prevention and vigilance: he knew that insulin plus a skipped meal means danger, so he reported the missed lunch and stayed alert. Second, recognition and response: he knew the signs of a low cold — cold, clammy, shaky, confused — confirmed she could swallow, gave fast sugar per policy, and got the nurse immediately. He never gave insulin, never gave anything to a resident who couldn\'t swallow, never overstepped his scope. He supported, he watched, he recognized, and he responded — and a sharp, funny woman finished her day safe.',
          ].join('\n');

          return doc('Brief Case Study', [
            { id: 'dm-s11-heading', type: 'heading', level: 1, text: 'Brief Case Study' },
            pendingAudio(
              'dm-s11-audio',
              "The Lunch She Didn't Eat",
              `${ASSET_BASE}/s11-case-podcast.mp3`,
              caseNarrative,
              '/assets/courses/diabetes/s11-case-podcast.mp3',
            ),
            {
              id: 'dm-s11-image',
              type: 'image',
              src: '/assets/courses/diabetes/s11-hero.png',
              caption: "Recognizing the pattern — how a resident's low blood sugar was caught and treated.",
            },
            {
              id: 'dm-s11-case-study',
              type: 'case_study',
              title: "The Lunch She Didn't Eat",
              residentProfile:
                'Mrs. Lindgren, 78, had type 2 diabetes managed with insulin. Her CNA, Tobias, knew her as a sharp, talkative woman who always had an opinion about the weather and the lunch menu.',
              scenario: [
                '**The setup:** One morning, Mrs. Lindgren wasn\'t hungry. The nurse had given her insulin before lunch as scheduled, but when lunch arrived, Mrs. Lindgren picked at it — a few bites of bread, no more — and pushed the tray away, saying her stomach felt "off." Tobias noticed she\'d barely eaten. He knew the danger: insulin given, but almost no food to balance it. He reported it to the nurse right away: "Mrs. Lindgren got her insulin but only ate a few bites of lunch — I\'ll keep a close eye on her." The nurse thanked him and asked him to watch closely.',
                '**The early signs:** About forty-five minutes later, Tobias passed her room and something was wrong. Mrs. Lindgren, normally chatty, was quiet and looked pale. Her forehead was damp with sweat, her hands were trembling, and when he asked how she felt, she gave a confused, slow answer that didn\'t quite make sense — not like her at all. Cold and clammy, shaky, confused. Tobias recognized it instantly: low blood sugar.',
                '**What Tobias did:** He stayed calm and moved fast. She was awake and able to swallow, so following the facility\'s hypoglycemia policy and her care plan, he gave her four ounces of juice right away and pressed the call button: "Mrs. Lindgren\'s showing low blood sugar signs — gave her juice per protocol, need the nurse now." He stayed with her, kept her calm, and kept talking to her gently while the sugar took effect.',
                '**The resolution:** The nurse arrived quickly, checked her blood sugar — confirmed low — and managed her care from there. Within about fifteen minutes of the juice, Mrs. Lindgren\'s color returned, her trembling settled, and her sharp, opinionated self came back. "Well," she said, "that was unpleasant." The nurse adjusted the plan in light of her poor appetite.',
                '**The outcome:** A potentially dangerous low was caught and treated early, before it could progress to unconsciousness or a seizure. The nurse told Tobias: "You set this up to go right. You flagged the missed lunch after insulin, so we were both watching — and then you knew the signs and acted in seconds. That\'s exactly how a low should be caught."',
                '**Discussion:** Tobias did two things, and both mattered. First, prevention and vigilance: he knew that insulin plus a skipped meal means danger, so he reported the missed lunch and stayed alert. Second, recognition and response: he knew the signs of a low cold — cold, clammy, shaky, confused — confirmed she could swallow, gave fast sugar per policy, and got the nurse immediately. He never gave insulin, never gave anything to a resident who couldn\'t swallow, never overstepped his scope. He supported, he watched, he recognized, and he responded — and a sharp, funny woman finished her day safe.',
              ].join('\n\n'),
            },
            {
              id: 'dm-s11-reflection-1',
              type: 'reflection',
              prompt:
                'Tobias reported the barely-eaten lunch right after insulin, before any symptoms appeared. Why is the match between food and insulin so important, and why did reporting it early matter?',
              minCharacters: 50,
            },
            {
              id: 'dm-s11-reflection-2',
              type: 'reflection',
              prompt:
                'Tobias checked that Mrs. Lindgren could swallow before giving juice. Why is that check essential — and what would the correct action have been if she couldn\'t swallow safely?',
              minCharacters: 50,
            },
            {
              id: 'dm-s11-rp-text',
              type: 'text',
              body: 'Reflect on the case study in the previous lesson. Your written responses help you apply what you learned about the food-insulin match, recognizing low blood sugar, and checking swallow safety before giving fast sugar.',
            },
            {
              id: 'dm-s11-kc2-check',
              type: 'knowledge_check',
              question:
                'A CNA does not give or adjust insulin or any diabetes medication, and never decides on a dose. When a conscious resident with diabetes shows signs of low blood sugar and can safely swallow, the CNA SHOULD:',
              options: [
                {
                  id: 'give-insulin',
                  label: 'Give insulin to balance blood sugar',
                },
                {
                  id: 'fast-sugar',
                  label: 'Give a fast-acting sugar per facility policy and alert the nurse immediately',
                },
                {
                  id: 'wait-see',
                  label: 'Wait and see if it improves on its own',
                },
                {
                  id: 'adjust-dose',
                  label: 'Adjust the diabetes medication dose',
                },
              ],
              correctOptionId: 'fast-sugar',
              explanation:
                'Give a fast-acting sugar per facility policy and alert the nurse immediately. You never give or adjust insulin or any diabetes medication, and never decide on a dose — but you do know the low-blood-sugar response cold.',
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
            { id: 'dm-s12-heading', type: 'heading', level: 1, text: 'Conclusion' },
            {
              id: 'dm-s12-video',
              type: 'video',
              title: 'Conclusion',
              videoUrl: '/assets/courses/diabetes/s12-conclusion.mp4',
              placeholderNote: 'Pending upload: /assets/courses/diabetes/s12-conclusion.mp4',
            },
            {
              id: 'dm-s12-image',
              type: 'image',
              src: '/assets/courses/diabetes/s12-hero.png',
              caption: 'Five things that matter most in diabetes care.',
            },
            {
              id: 'dm-s12-narration',
              type: 'text',
              body: [
                'You\'ve reached the end. Let\'s lock in the five things that matter most for diabetes care.',
                '**One.** Diabetes is a problem of blood sugar control — the body can\'t get glucose into the cells, so it builds up in the blood. Type 1 needs insulin to live; type 2 is more common and managed with diet, activity, pills, and sometimes insulin. Over time, high blood sugar damages the whole body.',
                '**Two.** Know low versus high — this saves lives. Low blood sugar comes on fast: shaky, sweating, cold and clammy, confused — act immediately. High blood sugar builds slowly: thirsty, frequent urination, hot and dry, fatigued. The memory aid: cold and clammy, need candy; hot and dry, sugar high.',
                '**Three.** Respond correctly to a low. A conscious resident who can swallow gets a fast-acting sugar per facility policy, and you alert the nurse immediately. A resident who can\'t swallow safely, is unconscious, or seizing gets nothing by mouth — activate emergency help now. When in doubt with a conscious resident, treat for low first.',
                '**Four.** Make sure they eat, and protect their feet. A resident who gets insulin then skips a meal is heading for a dangerous low — report it. And inspect the feet daily, because diabetes steals foot sensation and slows healing, so your watchful eyes on their feet prevent amputations.',
                '**Five.** Honor your scope. You never diagnose, never give or adjust insulin or any diabetes medication, and never decide a dose. But you support meals and activity, protect feet and skin, recognize and respond to blood sugar emergencies, and report faithfully — and that daily care keeps residents safe and whole.',
              ].join('\n\n'),
            },
            {
              id: 'dm-s12-summary',
              type: 'summary',
              title: 'Five things that matter most',
              items: [
                'Diabetes is a problem of blood sugar control — type 1 needs insulin; type 2 is more common.',
                'Know low versus high — cold and clammy, need candy; hot and dry, sugar high.',
                'Respond correctly to a low — fast sugar if they can swallow; nothing by mouth if they can\'t.',
                'Make sure they eat after insulin, and inspect feet daily — your eyes save limbs.',
                'Honor your scope — never give or adjust insulin or diabetes medication, or decide a dose.',
              ],
            },
            {
              id: 'dm-s12-whn-text',
              type: 'text',
              body: 'Ten questions are waiting. Everything on them was covered here. You\'re ready. Trust what you\'ve learned, and show what you know.',
            },
            {
              id: 'dm-s12-completion-text',
              type: 'text',
              body: 'This course provides one hour of continuing education credit through CAL ACE Nursing Academy, an approved CDPH continuing education provider, NAC number 7384. Your certificate is generated automatically when you pass the knowledge check.',
            },
            {
              id: 'dm-s12-completion-callout',
              type: 'callout',
              variant: 'info',
              title: 'Scope reminder',
              body: 'CNAs support meals, protect feet, recognize and respond to blood sugar emergencies, and report. CNAs do not diagnose diabetes, give or adjust insulin or diabetes medications, or decide on doses.',
            },
            {
              id: 'dm-s12-certificate-text',
              type: 'text',
              body: 'Your certificate is generated automatically when you pass the knowledge check. CDPH-Approved CE Provider — NAC #7384.',
            },
          ]),
      },
    ],
  },
];



export async function seedCourse26Diabetes(
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
  console.log(`Seeding Course 26 (Diabetes) as DRAFT — slug "${COURSE_SLUG}"…`);

  try {
    const result = await seedCourse26Diabetes(prisma);
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
