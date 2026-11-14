/**
 * Seed Course 16 — Caring for a Resident with Coronary Artery Disease (DRAFT).
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-16-coronary-artery-disease
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
const COURSE_SLUG = 'coronary-artery-disease';
const COURSE_TITLE = 'Coronary Disease: CNA Observation and Daily Care Support';
const COURSE_SUMMARY =
  "Learn to recognize angina vs. a heart attack, support a resident's heart-healthy care plan, and respond correctly to chest pain — within CNA scope. CNAs do not diagnose CAD, give or adjust any medications (including nitroglycerin), or perform procedures.";

const ASSET_BASE = '/assets/courses/cad';

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
    'Explain what coronary artery disease is, in plain language',
    'Tell the difference between angina and a heart attack',
    "Support a resident's heart-healthy care plan day to day",
    'Respond correctly when a resident has chest pain',
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
  heroImage: '/assets/courses/cad/hero-banner.jpg',
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
    title: 'Understanding Coronary Artery Disease',
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: 'Introduction',
        sortOrder: 0,
        buildContent: () =>
          doc('Introduction', [
            { id: 'cad-s01-heading', type: 'heading', level: 1, text: 'Introduction' },
            {
              id: 'cad-s01-video',
              type: 'video',
              title: 'Introduction',
              videoUrl: '/assets/courses/cad/s01-intro.mp4',
              placeholderNote: 'Pending upload: /assets/courses/cad/s01-intro.mp4',
            },
            {
              id: 'cad-s01-image',
              type: 'image',
              src: '/assets/courses/cad/s01-hero.jpg',
              caption: 'A CAL ACE CNA supporting a resident with heart disease.',
            },
            {
              id: 'cad-s01-narration',
              type: 'text',
              body: [
                'Welcome to CAL ACE Nursing Academy.',
                'This course is about coronary artery disease — called C-A-D. It is the most common form of heart disease, and it sits behind many of the cardiac problems you\'ve already learned about.',
                'Here\'s the simple picture. The heart is a muscle, and like any muscle, it needs its own blood supply to work. That blood comes through small vessels called the coronary arteries. In coronary artery disease, these arteries slowly narrow and harden, clogged by fatty deposits over many years. The heart muscle starts to get less oxygen than it needs — especially when it has to work harder.',
                'CAD is the foundation under so much of what you see in long-term care. It\'s the leading cause of heart attacks. It contributes to heart failure. It can trigger dangerous heart rhythms. A resident with CAD is a resident whose heart is working with a limited fuel line — and your daily care helps protect them.',
                'The key skill in this course is learning to tell the difference between two things: angina — chest discomfort that comes when the heart needs more oxygen, and usually eases with rest — and a heart attack, where a vessel is fully blocked and the heart muscle is dying. One you report and monitor. The other is a 911 emergency. Knowing which is which can save a resident\'s life.',
                'Your scope, as always, is clear. A CNA recognizes cardiac symptoms, supports the care plan, and responds correctly to chest pain. A CNA does not diagnose CAD, does not give or adjust any medication — including the resident\'s own nitroglycerin — and does not perform any procedure. Your power is observation, support, and fast, correct response.',
                'There is a ten-question knowledge check at the end. Everything on it is covered here. Let\'s begin.',
              ].join('\n\n'),
            },
            {
              id: 'cad-s01-course-information-text',
              type: 'text',
              body: [
                "This course teaches the CNA's role in supporting a resident living with coronary artery disease (CAD) — recognizing angina vs. a heart attack, supporting the care plan, and responding to cardiac symptoms.",
                "Let's be clear about your role. A CNA recognizes cardiac symptoms, supports the care plan, and responds correctly to chest pain. A CNA does not diagnose CAD, does not give or adjust any medication — including the resident's own nitroglycerin — and does not perform any procedure. Those are nursing and physician tasks. But none of them can happen without your careful observation and fast, correct response first.",
              ].join('\n\n'),
            },
            {
              id: 'cad-s01-course-information-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of this course',
              body: 'CNAs OBSERVE, SUPPORT, and RESPOND. CNAs do not diagnose CAD, give or adjust any cardiac medication (including nitroglycerin), or perform procedures.',
            },
            {
              id: 'cad-s01-learning-objectives-text',
              type: 'text',
              body: 'By the end of this course, you will be able to:',
            },
            {
              id: 'cad-s01-learning-objectives-summary',
              type: 'summary',
              title: 'Learning objectives',
              items: [
                'Explain what coronary artery disease is, in plain language.',
                'Tell the difference between angina and a heart attack.',
                "Support a resident's heart-healthy care plan day to day.",
                'Respond correctly when a resident has chest pain.',
                'Know your scope — what a CNA does, and what a CNA must never do.',
              ],
            },
            {
              id: 'cad-s01-instructor-intro-text',
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
            { id: 'cad-s02-heading', type: 'heading', level: 1, text: 'Terms & Definitions' },
            {
              id: 'cad-s02-image',
              type: 'image',
              src: '/assets/courses/cad/s02-hero.jpg',
              caption: 'The language of heart disease — angina, MI, ischemia, nitro.',
            },
            {
              id: 'cad-s02-reveal-coronary',
              type: 'reveal_card',
              frontTitle: 'Coronary Arteries',
              frontBody: 'CORE-oh-nair-ee',
              backTitle: 'Coronary Arteries',
              backBody:
                "The small blood vessels that wrap around the heart and supply the heart muscle itself with oxygen-rich blood. They are the heart's own fuel line. When they narrow, the heart suffers.",
            },
            {
              id: 'cad-s02-reveal-cad',
              type: 'reveal_card',
              frontTitle: 'Coronary Artery Disease (CAD)',
              frontBody: 'Coronary artery disease',
              backTitle: 'Coronary Artery Disease (CAD)',
              backBody:
                'The narrowing and hardening of the coronary arteries, usually from fatty deposits building up inside them over many years. Less blood reaches the heart muscle. CAD is the most common type of heart disease.',
            },
            {
              id: 'cad-s02-reveal-atherosclerosis',
              type: 'reveal_card',
              frontTitle: 'Atherosclerosis',
              frontBody: 'Ath-er-oh-skler-OH-sis',
              backTitle: 'Atherosclerosis',
              backBody:
                'The buildup of fatty deposits, called plaque, on the inside walls of arteries. Picture grease slowly coating the inside of a pipe until the opening narrows. This is the process behind CAD.',
            },
            {
              id: 'cad-s02-reveal-angina',
              type: 'reveal_card',
              frontTitle: 'Angina',
              frontBody: 'An-JY-nah, or AN-jih-nah',
              backTitle: 'Angina',
              backBody:
                "Chest discomfort, pressure, or pain that happens when the heart muscle isn't getting enough oxygen — often during activity or stress. It usually eases with rest. Angina is a warning, not a heart attack, but it must always be reported.",
            },
            {
              id: 'cad-s02-reveal-mi',
              type: 'reveal_card',
              frontTitle: 'Myocardial Infarction (Heart Attack)',
              frontBody: 'My-oh-CAR-dee-al in-FARK-shun',
              backTitle: 'Myocardial Infarction (Heart Attack)',
              backBody:
                'A heart attack. A coronary artery becomes fully blocked, and the heart muscle beyond the blockage begins to die. Unlike angina, it does not ease with rest. It is a true emergency.',
            },
            {
              id: 'cad-s02-reveal-nitro',
              type: 'reveal_card',
              frontTitle: 'Nitroglycerin',
              frontBody: 'Ny-tro-GLISS-er-in',
              backTitle: 'Nitroglycerin',
              backBody:
                'A medication that quickly widens blood vessels to relieve angina. Some residents carry it as a tablet under the tongue or a spray. Remember — a CNA never gives nitroglycerin. The CNA calls the nurse.',
            },
            {
              id: 'cad-s02-reveal-ischemia',
              type: 'reveal_card',
              frontTitle: 'Ischemia',
              frontBody: 'Iss-KEE-mee-ah',
              backTitle: 'Ischemia',
              backBody:
                "When a part of the body — here, the heart muscle — isn't getting enough blood and oxygen. In CAD, narrowed arteries cause ischemia, especially when the heart works harder. Ischemia is what causes the pain of angina.",
            },
            {
              id: 'cad-s02-reveal-rehab',
              type: 'reveal_card',
              frontTitle: 'Cardiac Rehabilitation',
              frontBody: 'Cardiac rehabilitation',
              backTitle: 'Cardiac Rehabilitation',
              backBody:
                "A supervised program of monitored activity, education, and lifestyle support that helps residents with heart disease grow stronger safely. The CNA supports it by encouraging the planned activity and watching the resident's response.",
            },
            {
              id: 'cad-s02-kc1-check-atherosclerosis',
              type: 'knowledge_check',
              question: 'Match the term: plaque buildup narrowing the arteries',
              options: [
                { id: 'atherosclerosis', label: 'Atherosclerosis' },
                { id: 'angina', label: 'Angina' },
                { id: 'heart-attack', label: 'Heart attack' },
              ],
              correctOptionId: 'atherosclerosis',
              explanation:
                'Atherosclerosis. The buildup of fatty deposits, called plaque, on the inside walls of arteries. Picture grease slowly coating the inside of a pipe until the opening narrows. This is the process behind CAD.',
              requiredForCompletion: true,
            },
            {
              id: 'cad-s02-kc1-check-angina',
              type: 'knowledge_check',
              question: 'Match the term: chest discomfort that usually eases with rest',
              options: [
                { id: 'atherosclerosis', label: 'Atherosclerosis' },
                { id: 'angina', label: 'Angina' },
                { id: 'heart-attack', label: 'Heart attack' },
              ],
              correctOptionId: 'angina',
              explanation:
                "Angina. Chest discomfort, pressure, or pain that happens when the heart muscle isn't getting enough oxygen — often during activity or stress. It usually eases with rest.",
              requiredForCompletion: true,
            },
            {
              id: 'cad-s02-kc1-check-heart-attack',
              type: 'knowledge_check',
              question:
                'Match the term: blocked artery, heart muscle dying, does not ease with rest',
              options: [
                { id: 'atherosclerosis', label: 'Atherosclerosis' },
                { id: 'angina', label: 'Angina' },
                { id: 'heart-attack', label: 'Heart attack' },
              ],
              correctOptionId: 'heart-attack',
              explanation:
                'Heart attack. A coronary artery becomes fully blocked, and the heart muscle beyond the blockage begins to die. Unlike angina, it does not ease with rest. It is a true emergency.',
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
            { id: 'cad-s03-heading', type: 'heading', level: 1, text: 'Statistics' },
            pendingAudio(
              'cad-s03-audio',
              'Coronary Artery Disease: The Most Common Heart Problem',
              `${ASSET_BASE}/s03-stats-podcast.mp3`,
              [
                'Coronary Artery Disease: The Most Common Heart Problem',
                '',
                'Coronary artery disease is the most common type of heart disease and the leading cause of death for adults in the United States. About 20 million American adults have CAD. Because it builds up silently over decades, it is especially common in older adults — which means a large share of long-term care residents are living with it.',
                '',
                'CAD is the engine behind many other cardiac problems. It is the leading cause of heart attacks. It is a major contributor to heart failure, because a heart starved of oxygen over time grows weaker. And it can trigger dangerous abnormal heart rhythms. So when you care for a resident with CAD, you are caring for the root condition behind much of cardiac medicine.',
                '',
                'The disease develops slowly. Fatty plaque builds up inside the coronary arteries over many years, gradually narrowing them. For a long time, a resident may have no symptoms at all. Then, as the narrowing worsens, the heart muscle starts to run short of oxygen when it has to work harder — climbing stairs, walking to meals, even strong emotion. This is angina, the warning sign.',
                '',
                'Here is what matters most for the CNA. Many cardiac events in CAD are linked to exertion and stress — exactly the activities of daily living that CNAs assist with. A CNA who knows a resident has CAD can pace activities, allow rest, recognize angina early, and respond fast to chest pain. And crucially, a CNA who can tell the difference between angina that eases with rest and a heart attack that doesn\'t can make sure a true emergency gets a true emergency response.',
                '',
                'The encouraging part: CAD is highly manageable. With medication, a heart-healthy diet, appropriate activity, and good daily care, residents with CAD can live full, comfortable lives. Much of that good daily care is delivered by CNAs.',
              ].join('\n'),
              `${ASSET_BASE}/s03-stats-podcast.mp3`,
            ),
            {
              id: 'cad-s03-image',
              type: 'image',
              src: '/assets/courses/cad/s03-hero.jpg',
              caption: 'Coronary artery disease is common in long-term care.',
            },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: 'Fundamentals',
        sortOrder: 3,
        buildContent: () =>
          doc('Fundamentals', [
            { id: 'cad-s04-heading', type: 'heading', level: 1, text: 'Fundamentals' },
            {
              id: 'cad-s04-video',
              type: 'video',
              title: 'Fundamentals',
              videoUrl: '/assets/courses/cad/s04-fundamentals.mp4',
              placeholderNote: 'Pending upload: /assets/courses/cad/s04-fundamentals.mp4',
            },
            {
              id: 'cad-s04-image',
              type: 'image',
              src: '/assets/courses/cad/s04-hero.jpg',
              caption: 'Understanding how narrowed arteries affect the heart.',
            },
            {
              id: 'cad-s04-narration',
              type: 'text',
              body: [
                '**The heart feeds itself**',
                'The heart pumps blood to the whole body — but it also has to feed itself. A set of small vessels called the coronary arteries wrap around the heart and deliver oxygen-rich blood to the heart muscle. When those vessels work well, the heart has all the fuel it needs.',
                '**How the arteries narrow**',
                'Over many years, fatty deposits called plaque can build up on the inside walls of these arteries. This is atherosclerosis. Picture grease slowly coating the inside of a pipe. The opening gets narrower, and less blood can flow through to the heart muscle.',
                '**When the heart runs short of fuel**',
                'A narrowed artery may deliver enough blood while the resident is resting. But when the heart has to work harder — during walking, bathing, eating, or strong emotion — it needs more oxygen than the narrowed artery can supply. The heart muscle runs short of fuel. This shortage is called ischemia, and it causes the discomfort of angina.',
                '**Angina: the warning**',
                "Angina is the heart's warning light. It's discomfort, pressure, tightness, or pain — usually in the chest, sometimes spreading to the arm, jaw, or back. Classic angina comes on with exertion or stress, and it eases within a few minutes of rest, or with prescribed nitroglycerin. It signals that the heart needs help — and it always gets reported.",
                '**Heart attack: the emergency**',
                'If a narrowed artery becomes completely blocked — usually by a clot forming on the plaque — blood flow stops entirely, and the heart muscle beyond the blockage begins to die. This is a heart attack. Unlike angina, the pain does not ease with rest. It is a true emergency, and minutes matter.',
                '**The key difference to remember**',
                'Here is the difference that can save a life. Angina usually comes with exertion and eases with rest — report it. A heart attack does not ease with rest, often comes with sweating, nausea, and a feeling of doom, and may strike even at rest — call 911. When chest pain doesn\'t ease with rest, treat it as an emergency.',
                '**CAD is manageable**',
                'Coronary artery disease cannot be cured, but it can be managed very well — with medication, a heart-healthy low-fat, low-salt diet, appropriate activity, and careful daily care. A resident with well-managed CAD can live comfortably for many years. Your daily support is a big part of that.',
              ].join('\n\n'),
            },
            {
              id: 'cad-s04-decision-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'The decision rule',
              body: 'Chest pain that does NOT ease with rest = emergency. Angina usually comes with exertion and eases with rest — report it. A heart attack does not ease with rest — call 911.',
            },
          ]),
      },
    ],
  },
  {
    slug: 'module-2',
    title: 'Recognition, Response, and CNA Role',
    sortOrder: 1,
    lessons: [
      {
        slug: 's05-signs',
        title: 'Signs & Symptoms',
        sortOrder: 0,
        buildContent: () =>
          doc('Signs & Symptoms', [
            { id: 'cad-s05-heading', type: 'heading', level: 1, text: 'Signs & Symptoms' },
            {
              id: 'cad-s05-image',
              type: 'image',
              src: '/assets/courses/cad/s05-hero.jpg',
              caption: 'Recognizing chest pain and the signs that need a fast response.',
            },
            {
              id: 'cad-s05-narration',
              type: 'text',
              body: [
                'The most important skill in this course is telling angina apart from a heart attack. Let\'s learn the signs of each, side by side.',
                '**Angina with exertion**',
                'Angina usually shows up with exertion. A resident walking to meals, bathing, climbing stairs, or feeling strong emotion may stop and describe pressure, squeezing, or tightness in the chest. They might say it feels like "a weight" or "a band." It can spread to the arm, jaw, neck, or back. The key feature: it comes with activity.',
                '**Angina eases with rest**',
                'And here is angina\'s signature: it eases with rest. Within a few minutes of stopping and resting — or after prescribed nitroglycerin given by the nurse — the discomfort fades. Angina is a warning, not yet an emergency. But it always gets reported, because worsening angina can lead to a heart attack.',
                '**Heart attack: it doesn\'t stop**',
                'A heart attack is different, and you must know the difference. The chest pain or pressure does not ease with rest. It may be more severe, or it may even be mild — but it persists. It often comes with cold sweating, nausea, shortness of breath, and a frightening feeling that something is terribly wrong. It can happen during activity or at complete rest, even waking a resident from sleep.',
                '**The quiet heart attack**',
                'And remember — heart attacks don\'t always look dramatic. Especially in women, older adults, and people with diabetes, the signs may be subtle: unusual fatigue, shortness of breath, nausea, or discomfort in the jaw, back, or arm rather than obvious chest pain. When in doubt, treat it as an emergency. No one is ever faulted for calling for help too quickly.',
                '**Summary**',
                'Side by side. Angina: comes with exertion or stress, eases with rest within a few minutes, a warning to report. Heart attack: does not ease with rest, often with sweating, nausea, and dread, can strike at rest, an emergency to call 911.',
                'The single rule that ties it together: chest discomfort that does not ease with rest is treated as a heart attack until proven otherwise. The next section shows you exactly how to respond.',
              ].join('\n\n'),
            },
            {
              id: 'cad-s05-rule-callout',
              type: 'callout',
              variant: 'warning',
              title: 'The golden rule',
              body: 'Chest discomfort that does not ease with rest is treated as a heart attack until proven otherwise. When in doubt, treat it as an emergency.',
            },
          ]),
      },
      {
        slug: 's06-causes',
        title: 'Causes',
        sortOrder: 1,
        buildContent: () =>
          doc('Causes', [
            { id: 'cad-s06-heading', type: 'heading', level: 1, text: 'Causes' },
            pendingAudio(
              'cad-s06-audio',
              'What Causes Coronary Artery Disease?',
              `${ASSET_BASE}/s06-causes-podcast.mp3`,
              [
                'What Causes Coronary Artery Disease?',
                '',
                'Coronary artery disease develops slowly, over decades, as fatty plaque builds up inside the coronary arteries. Several factors speed up that buildup, and many of your residents have more than one.',
                '',
                "High cholesterol is a major driver. When there's too much of the wrong kind of cholesterol in the blood, it deposits in the artery walls and forms plaque. High blood pressure adds to the damage by constantly stressing the artery walls, making them more likely to accumulate plaque and harden. Diabetes is another powerful contributor — high blood sugar damages blood vessels throughout the body, including the coronary arteries, which is why people with diabetes have a much higher risk of heart disease.",
                '',
                'Lifestyle factors built up over a lifetime matter a great deal. Smoking damages artery walls and speeds plaque buildup dramatically. A diet high in unhealthy fats and salt, physical inactivity, and obesity all push the process forward. Long-term stress can contribute too.',
                '',
                "Some factors can't be changed. Age is a strong one — arteries naturally accumulate more plaque over time, which is why CAD is so common in older adults. Family history matters; heart disease runs in families. And men tend to develop CAD earlier in life, though women's risk rises sharply after menopause.",
                '',
                "For the CNA, the practical message is this. The residents who need the closest attention are those whose charts list CAD along with high blood pressure, diabetes, high cholesterol, or a prior heart attack — and especially those who are still smokers. You're not expected to treat any of these. You're expected to support the heart-healthy care plan faithfully — the diet, the activity, the medication schedule the nurse manages — and to recognize and respond to cardiac symptoms quickly.",
              ].join('\n'),
              `${ASSET_BASE}/s06-causes-podcast.mp3`,
            ),
            {
              id: 'cad-s06-image',
              type: 'image',
              src: '/assets/courses/cad/s06-hero.jpg',
              caption: 'Understanding what raises heart-disease risk.',
            },
          ]),
      },
      {
        slug: 's07-role',
        title: 'CNA Role & Best Practices',
        sortOrder: 2,
        buildContent: () =>
          doc('CNA Role & Best Practices', [
            { id: 'cad-s07-heading', type: 'heading', level: 1, text: 'CNA Role & Best Practices' },
            {
              id: 'cad-s07-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of practice',
              body: 'CNAs OBSERVE, SUPPORT, and REPORT. CNAs never give any cardiac medication — including the resident\'s own nitroglycerin. Chest discomfort? Call the nurse.',
            },
            {
              id: 'cad-s07-image',
              type: 'image',
              src: '/assets/courses/cad/s07-hero.jpg',
              caption:
                'The CNA observes and reports — never administers cardiac medications.',
            },
            {
              id: 'cad-s07-narration',
              type: 'text',
              body: [
                'Residents with coronary artery disease often take several medications to protect the heart. Let\'s walk through the common ones — and let\'s begin, as always, with the rule that never bends. A CNA does not give, skip, or adjust any of these medications. Not the daily pills, and not the emergency nitroglycerin. Your job is to observe, support, and report.',
                '**Nitroglycerin — the one to understand most.** Some residents with angina have nitroglycerin prescribed — a tablet under the tongue or a spray — to relieve chest discomfort quickly by widening the blood vessels. Here is your scope, stated as plainly as I can: a CNA never gives nitroglycerin. If a resident has chest discomfort, you call the nurse immediately. Even if the resident asks for it. Even if it\'s right there in the drawer. Even if they\'ve taken it before. You call the nurse, who decides and gives it. This is one of the most important scope boundaries in cardiac care.',
                '**Aspirin and antiplatelet medications.** Names like aspirin or clopidogrel. These make the blood less likely to clot, lowering the risk of a heart attack. Red, what you report: unusual bruising or bleeding, since these residents bleed more easily.',
                '**Cholesterol medications — statins.** Names often end in "-statin," like atorvastatin. They lower cholesterol to slow plaque buildup. Red: new muscle aches or weakness are worth reporting.',
                '**Beta-blockers and other heart medications.** Names often end in "-olol." They ease the heart\'s workload. Green: a slower pulse can be normal. Red: dizziness, fainting, or a very slow pulse.',
                '**Procedures.** Some residents have had procedures to open blocked arteries — a stent placed, or bypass surgery in their history. You don\'t manage these, but you support their recovery and report any new chest symptoms.',
                'The scope point for this whole section, one more time: chest discomfort means call the nurse — never reach for the nitroglycerin yourself. Your fast call is what gets the resident safe, correct treatment.',
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
            { id: 'cad-s08-heading', type: 'heading', level: 1, text: 'Prevention & Risk Reduction' },
            {
              id: 'cad-s08-image',
              type: 'image',
              src: '/assets/courses/cad/s08-hero.jpg',
              caption: 'Supporting heart-healthy daily care.',
            },
            {
              id: 'cad-s08-narration',
              type: 'text',
              body: [
                'CNAs help protect the hearts of residents with coronary artery disease every day. Here are seven ways.',
                '**One. Support the heart-healthy diet.** Low in unhealthy fats, low in salt, rich in vegetables and whole foods. Serve the meals as planned, and give the nurse a kind heads-up when family brings in fried or salty foods. The diet directly slows plaque buildup.',
                '**Two. Pace activities and allow rest.** Cardiac symptoms in CAD often come with exertion. Help residents move at a comfortable pace, with rest breaks during bathing, dressing, and walking. A chair in the shower, clothes within reach, no rushing. You\'re matching the activity to what the heart can handle.',
                '**Three. Watch the resident\'s response to activity.** Notice if a resident becomes short of breath, pale, sweaty, or describes chest discomfort during or after activity. These responses are valuable information for the nurse — report them.',
                '**Four. Support medication routines.** While you never give the medications, you support the routine by helping residents be ready and reporting any refusals or missed doses to the nurse. Consistent heart medication prevents events.',
                '**Five. Help manage stress and strong emotion.** Strong emotion makes the heart work harder. A calm, gentle, unhurried approach genuinely protects a heart with limited blood supply. Your reassuring presence is heart care.',
                '**Six. Encourage smoking cessation support.** If a resident still smokes, you don\'t lecture — but you support whatever cessation help the care plan includes, and you report to the nurse. Quitting smoking is one of the most powerful things possible for a heart with CAD.',
                '**Seven. Recognize and report early.** Worsening angina — discomfort that comes more easily, lasts longer, or doesn\'t ease with rest as it used to — is a warning that a heart attack may be coming. Report any change in a resident\'s chest symptoms the same shift.',
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
            { id: 'cad-s09-heading', type: 'heading', level: 1, text: 'Scenario & Reporting' },
            pendingAudio(
              'cad-s09-audio',
              'Emergency response scenarios intro',
              `${ASSET_BASE}/s09-emergency-intro.mp3`,
              "In coronary artery disease, the most important judgment you'll make is telling angina apart from a heart attack — one you report, one you treat as a 911 emergency. You're about to work through two situations. Read each carefully, choose your action, and you'll get feedback right away. Keep the rule in mind: chest pain that does not ease with rest is treated as an emergency.",
              `${ASSET_BASE}/s09-emergency-intro.mp3`,
            ),
            {
              id: 'cad-s09-image',
              type: 'image',
              src: '/assets/courses/cad/s09-hero.jpg',
              caption: "Reading chest pain: when it's an emergency, when to report.",
            },
            {
              id: 'cad-s09-scenario-heart-attack-image',
              type: 'image',
              src: '/assets/courses/cad/s09-scenario-heart-attack.jpg',
              caption:
                "Crushing chest pressure at rest, spreading and not easing: activate 911, stay, never give nitroglycerin.",
            },
            {
              id: 'cad-s09-scenario-heart-attack',
              type: 'scenario_question',
              prompt:
                'Mr. Petrosyan, who has CAD, is sitting quietly watching television when he suddenly grips his chest. He\'s sweating heavily, looks gray, says the pressure is "crushing" and spreading to his left arm, and feels nauseated. He has been resting for ten minutes and it is not getting better. What is the BEST action?',
              options: [
                {
                  id: 'give-nitro',
                  label: 'Give him his nitroglycerin tablet from his drawer',
                  feedback:
                    'This is a heart attack — crushing pain spreading to the arm, sweating, nausea, and it is not easing with rest. Waiting, walking it off, or giving medication all cost critical minutes, and a CNA never gives nitroglycerin. The right action: activate emergency response immediately and stay with him.',
                },
                {
                  id: 'activate-911',
                  label: 'Stay with him and activate emergency response (911) immediately',
                  feedback:
                    'Exactly right. Crushing chest pressure spreading to the arm, with sweating and nausea, that does NOT ease with rest, is a heart attack — a true emergency. Activate emergency response immediately, stay with him, keep him calm and resting, and follow your facility\'s emergency procedure. And note what you do NOT do — you never give nitroglycerin or any medication, even his own. That is the nurse\'s decision, and this needs 911-level help now.',
                  isRecommended: true,
                },
                {
                  id: 'walk-it-off',
                  label: 'Help him walk it off around the room',
                  feedback:
                    'This is a heart attack — crushing pain spreading to the arm, sweating, nausea, and it is not easing with rest. Waiting, walking it off, or giving medication all cost critical minutes, and a CNA never gives nitroglycerin. The right action: activate emergency response immediately and stay with him.',
                },
                {
                  id: 'wait-fifteen',
                  label: 'Wait another fifteen minutes to see if it eases',
                  feedback:
                    'This is a heart attack — crushing pain spreading to the arm, sweating, nausea, and it is not easing with rest. Waiting, walking it off, or giving medication all cost critical minutes, and a CNA never gives nitroglycerin. The right action: activate emergency response immediately and stay with him.',
                },
              ],
              requiredForCompletion: true,
            },
            {
              id: 'cad-s09-scenario-angina-image',
              type: 'image',
              src: '/assets/courses/cad/s09-scenario-angina.jpg',
              caption:
                'Chest tightness on exertion that eases with rest: have them rest, stay, and report the angina to the nurse.',
            },
            {
              id: 'cad-s09-scenario-angina',
              type: 'scenario_question',
              prompt:
                'While walking Mrs. Bianchi to the dining room, she stops and says her chest feels "tight, like a pressure." She has CAD and has had angina before. You help her sit and rest. Within three minutes, she says the tightness is fading and she feels better. She is not sweating and her color is normal. What SHOULD the CNA do?',
              options: [
                {
                  id: 'say-nothing',
                  label: 'Since it eased, say nothing and continue to lunch',
                  feedback:
                    "This is angina — it came with exertion and eased with rest, so it's not an immediate 911 emergency. But it's never ignored because it passed, and a CNA never gives nitroglycerin. The right action: help her rest, stay with her, and report the episode to the nurse so the team can act to prevent a heart attack.",
                },
                {
                  id: 'give-nitro-safe',
                  label: 'Give her a nitroglycerin tablet to be safe',
                  feedback:
                    "This is angina — it came with exertion and eased with rest, so it's not an immediate 911 emergency. But it's never ignored because it passed, and a CNA never gives nitroglycerin. The right action: help her rest, stay with her, and report the episode to the nurse so the team can act to prevent a heart attack.",
                },
                {
                  id: 'report-nurse',
                  label: 'Help her rest, stay with her, and report the angina episode to the nurse',
                  feedback:
                    'Right. Chest tightness that came with walking and eased with a few minutes of rest is classic angina — a warning, not an immediate emergency. You did the right things: helped her rest and stayed with her. But it is never ignored just because it passed — report the episode to the nurse, including what she was doing when it started and how long it lasted. And you never give nitroglycerin yourself. Reported angina helps the team prevent a future heart attack.',
                  isRecommended: true,
                },
                {
                  id: 'keep-walking',
                  label: 'Encourage her to keep walking now that she feels better',
                  feedback:
                    "This is angina — it came with exertion and eased with rest, so it's not an immediate 911 emergency. But it's never ignored because it passed, and a CNA never gives nitroglycerin. The right action: help her rest, stay with her, and report the episode to the nurse so the team can act to prevent a heart attack.",
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
            { id: 'cad-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
              id: 'cad-s10-video',
              type: 'video',
              title: "The CNA's Role",
              videoUrl: '/assets/courses/cad/s10-cna-role.mp4',
              placeholderNote: 'Pending upload: /assets/courses/cad/s10-cna-role.mp4',
            },
            {
              id: 'cad-s10-image',
              type: 'image',
              src: '/assets/courses/cad/s10-hero.jpg',
              caption: 'Reporting chest-pain changes accurately to the nurse.',
            },
            {
              id: 'cad-s10-narration',
              type: 'text',
              body: [
                'Your daily role with a resident who has coronary artery disease is about protection, observation, and fast correct response. Let\'s walk through it.',
                '**Pace and protect** Protect the heart by matching activity to what it can handle. Pace bathing, dressing, and walking with rest breaks. Reduce the heart\'s workload where you can — a shower chair, clothes laid out close, an unhurried morning. You\'re not limiting the resident\'s life; you\'re protecting their heart so they can keep living it.',
                '**Observe the response** Watch how the resident responds to activity and stress. Shortness of breath, paleness, sweating, fatigue, or chest discomfort during daily care are valuable clues. Notice them, and report them. You see the resident in motion all day — you\'re the one who notices when the heart is struggling.',
                '**Respond fast and correctly** When chest discomfort happens, your response is clear and immediate. Help the resident rest. Stay with them — never leave them alone. Call the nurse. And make the judgment you\'ve learned: if it eases with rest, it\'s reported angina; if it does not ease, or comes with sweating, nausea, and dread, treat it as a heart attack and activate emergency help. You never give nitroglycerin — you call the nurse, every time.',
                '**Report with detail** When you report, give the nurse the picture: what the resident was doing when it started, what the discomfort felt like and where, how long it lasted, whether it eased with rest, and any sweating, nausea, or shortness of breath. That detail helps the nurse and doctor act correctly.',
                'Now the boundary. You do not diagnose CAD or any cardiac condition. You do not give, skip, or adjust any medication — including the resident\'s own nitroglycerin. You do not perform procedures. And you never tell the resident their chest pain "is probably nothing" — you take every chest symptom seriously, support them, and call the nurse.',
                'Inside your role — pace and protect, observe closely, respond fast and correctly, report with detail — you are a genuine guardian of this resident\'s heart. It\'s work that prevents emergencies and saves lives.',
              ].join('\n\n'),
            },
            {
              id: 'cad-s10-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Stay within scope',
              body: 'You do not diagnose CAD. You do not give, skip, or adjust any medication — including nitroglycerin. You never tell the resident their chest pain "is probably nothing" — you take every chest symptom seriously and call the nurse.',
            },
          ]),
      },
      {
        slug: 's11-case-study',
        title: 'Case Study',
        sortOrder: 2,
        buildContent: () => {
          const caseNarrative = [
            'Mr. Halloran, 81, has coronary artery disease and a history of angina. His CNA, Dev, had cared for him for months and knew his patterns well.',
            '',
            '**Episode one — Tuesday morning:** While Dev was helping Mr. Halloran walk to the dining room, Mr. Halloran stopped and said, "Hold on — getting that pressure again." Dev recognized it: chest tightness, brought on by walking, exactly like Mr. Halloran\'s usual angina. Dev helped him sit on a nearby bench and stayed right with him. Within a few minutes, Mr. Halloran said, "Okay, it\'s easing off." He wasn\'t sweating, his color was good. Dev finished walking him slowly to lunch — and then, importantly, reported the episode to the nurse: "Chest tightness while walking, eased with about three minutes of rest, no sweating, color normal." The nurse noted it and kept watch. This was angina, reported correctly.',
            '',
            '**Episode two — Friday evening:** Mr. Halloran was sitting in his recliner, not doing anything strenuous, when he pressed the call light. Dev found him pale and sweating, gripping his chest. "It\'s bad this time," he said. "It\'s in my arm too, and I feel sick to my stomach." Dev helped him stay seated and calm, and noticed this was completely different — at rest, more severe, with sweating and nausea, spreading to the arm. Dev did not wait to see if it would ease. Dev did not reach for the nitroglycerin in the drawer.',
            '',
            '**What Dev did:** Dev pressed the emergency call button and called out clearly: "Chest pain at rest, sweating, room 8 — I need help now." Dev stayed with Mr. Halloran, kept him resting and calm, and gave him nothing. When the nurse arrived, Dev reported precisely: "Chest pain at rest, not eased, spreading to the left arm, sweating, nauseated, started about five minutes ago." Emergency services were activated.',
            '',
            '**The outcome:** Mr. Halloran was having a heart attack. Because Dev recognized that this episode was different from the angina — it didn\'t ease, it came at rest, it had the danger signs — and activated emergency help immediately without giving any medication, Mr. Halloran reached the hospital quickly and survived.',
            '',
            '**Discussion:** Same resident, same chest, two completely different episodes — and two correctly different responses. On Tuesday, exertional discomfort that eased with rest: report it. On Friday, discomfort at rest that didn\'t ease, with sweating and nausea: emergency. Dev never diagnosed anything and never gave a medication. Dev knew the difference, watched the resident closely, and matched the response to the signs.',
          ].join('\n');

          return doc('Case Study', [
            { id: 'cad-s11-heading', type: 'heading', level: 1, text: 'Case Study' },
            pendingAudio(
              'cad-s11-audio',
              'Two Episodes, Two Different Answers',
              `${ASSET_BASE}/s11-case-podcast.mp3`,
              caseNarrative,
              `${ASSET_BASE}/s11-case-podcast.mp3`,
            ),
            {
              id: 'cad-s11-image',
              type: 'image',
              src: '/assets/courses/cad/s11-hero.jpg',
              caption:
                'A cardiac concern handled correctly — observe, report, escalate.',
            },
            {
              id: 'cad-s11-case-study',
              type: 'case_study',
              title: 'Two Episodes, Two Different Answers',
              residentProfile:
                'Mr. Halloran, 81, has coronary artery disease and a history of angina. His CNA, Dev, had cared for him for months and knew his patterns well.',
              scenario: [
                '**Episode one — Tuesday morning:** While Dev was helping Mr. Halloran walk to the dining room, Mr. Halloran stopped and said, "Hold on — getting that pressure again." Dev recognized it: chest tightness, brought on by walking, exactly like Mr. Halloran\'s usual angina. Dev helped him sit on a nearby bench and stayed right with him. Within a few minutes, Mr. Halloran said, "Okay, it\'s easing off." He wasn\'t sweating, his color was good. Dev finished walking him slowly to lunch — and then, importantly, reported the episode to the nurse: "Chest tightness while walking, eased with about three minutes of rest, no sweating, color normal." The nurse noted it and kept watch. This was angina, reported correctly.',
                '**Episode two — Friday evening:** Mr. Halloran was sitting in his recliner, not doing anything strenuous, when he pressed the call light. Dev found him pale and sweating, gripping his chest. "It\'s bad this time," he said. "It\'s in my arm too, and I feel sick to my stomach." Dev helped him stay seated and calm, and noticed this was completely different — at rest, more severe, with sweating and nausea, spreading to the arm. Dev did not wait to see if it would ease. Dev did not reach for the nitroglycerin in the drawer.',
                '**What Dev did:** Dev pressed the emergency call button and called out clearly: "Chest pain at rest, sweating, room 8 — I need help now." Dev stayed with Mr. Halloran, kept him resting and calm, and gave him nothing. When the nurse arrived, Dev reported precisely: "Chest pain at rest, not eased, spreading to the left arm, sweating, nauseated, started about five minutes ago." Emergency services were activated.',
                '**The outcome:** Mr. Halloran was having a heart attack. Because Dev recognized that this episode was different from the angina — it didn\'t ease, it came at rest, it had the danger signs — and activated emergency help immediately without giving any medication, Mr. Halloran reached the hospital quickly and survived.',
                '**Discussion:** Same resident, same chest, two completely different episodes — and two correctly different responses. On Tuesday, exertional discomfort that eased with rest: report it. On Friday, discomfort at rest that didn\'t ease, with sweating and nausea: emergency. Dev never diagnosed anything and never gave a medication. Dev knew the difference, watched the resident closely, and matched the response to the signs.',
              ].join('\n\n'),
            },
            {
              id: 'cad-s11-reflection-intro-text',
              type: 'text',
              body: 'Reflect on the case study in the previous lesson. Your written responses help you apply what you learned about telling angina apart from a heart attack, never giving nitroglycerin, and reporting with detail.',
            },
            {
              id: 'cad-s11-reflection-1',
              type: 'reflection',
              prompt:
                'What specific differences between the Tuesday and Friday episodes told Dev that Friday was an emergency and Tuesday was not?',
              minCharacters: 50,
            },
            {
              id: 'cad-s11-reflection-2',
              type: 'reflection',
              prompt:
                'In both episodes, Dev never gave nitroglycerin, even though it was in the drawer. Why is calling the nurse — rather than giving the medication — always the correct CNA action?',
              minCharacters: 50,
            },
            {
              id: 'cad-s11-kc2-check',
              type: 'knowledge_check',
              question:
                "Here is your scope, stated as plainly as I can: a CNA never gives nitroglycerin. If a resident has chest discomfort, you call the nurse immediately. Even if the resident asks for it. Even if it's right there in the drawer. Even if they've taken it before. When a resident has chest discomfort, the CNA SHOULD:",
              options: [
                {
                  id: 'give-nitro',
                  label: 'Give nitroglycerin since the resident asked or it is in the drawer',
                },
                {
                  id: 'call-nurse',
                  label: 'Call the nurse immediately and let the nurse decide',
                },
                {
                  id: 'give-if-before',
                  label: 'Give it only if they have taken it before',
                },
                {
                  id: 'wait-rest',
                  label: 'Wait to see if it eases with rest before telling anyone',
                },
              ],
              correctOptionId: 'call-nurse',
              explanation:
                'You call the nurse, who decides and gives it. This is one of the most important scope boundaries in cardiac care.',
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
            { id: 'cad-s12-heading', type: 'heading', level: 1, text: 'Conclusion' },
            {
              id: 'cad-s12-video',
              type: 'video',
              title: 'Conclusion',
              videoUrl: '/assets/courses/cad/s12-conclusion.mp4',
              placeholderNote: 'Pending upload: /assets/courses/cad/s12-conclusion.mp4',
            },
            {
              id: 'cad-s12-image',
              type: 'image',
              src: '/assets/courses/cad/s12-hero.jpg',
              caption: "Recognize, report, never give cardiac meds — the CNA's role.",
            },
            {
              id: 'cad-s12-summary-recap-narration',
              type: 'text',
              body: [
                "You've reached the end, and you've also completed our cardiovascular series. Let's lock in the five things that matter most for coronary artery disease.",
                '**One.** CAD is the narrowing of the heart\'s own arteries by plaque, over many years. It starves the heart muscle of oxygen, especially during activity, and it\'s the root cause behind most heart attacks and much of heart failure.',
                '**Two.** Know angina from a heart attack — this is the key skill. Angina comes with exertion and eases with rest; it\'s a warning to report. A heart attack does not ease with rest, often comes with sweating, nausea, and a sense of dread, can strike even at rest, and is a 911 emergency.',
                '**Three.** The golden rule: chest discomfort that does not ease with rest is treated as a heart attack until proven otherwise. When in doubt, activate emergency help. No one is faulted for calling too quickly.',
                '**Four.** Protect the heart daily. Support the heart-healthy diet, pace activities with rest, keep the environment calm, and watch closely how the resident responds to exertion. Report worsening angina the same shift.',
                '**Five.** Honor your scope. You observe, support, and respond. You never diagnose, and you never give any cardiac medication — including the resident\'s own nitroglycerin. Chest discomfort means call the nurse, every single time.',
              ].join('\n\n'),
            },
            {
              id: 'cad-s12-summary-recap-summary',
              type: 'summary',
              title: 'Five things that matter most',
              items: [
                "CAD is plaque narrowing the heart's own arteries — the root cause behind most heart attacks.",
                'Know angina from a heart attack — angina eases with rest; a heart attack does not.',
                'Chest discomfort that does not ease with rest is treated as a heart attack until proven otherwise.',
                'Protect the heart daily — diet, paced activity, calm environment, watch the response to exertion.',
                'Honor your scope — never give any cardiac medication, including nitroglycerin; chest discomfort means call the nurse.',
              ],
            },
            {
              id: 'cad-s12-what-happens-next-text',
              type: 'text',
              body: 'Ten questions are waiting. Everything on them was covered here. You\'re ready. Trust what you\'ve learned, and show what you know.',
            },
            {
              id: 'cad-s12-completion-requirements-text',
              type: 'text',
              body: 'This course provides one hour of continuing education credit through CAL ACE Nursing Academy, an approved CDPH continuing education provider, NAC number 7384. Your certificate is generated automatically when you pass the knowledge check.',
            },
            {
              id: 'cad-s12-completion-requirements-compliance-callout',
              type: 'callout',
              variant: 'info',
              title: 'Scope reminder',
              body: 'CNAs observe, support, and respond. CNAs do not diagnose CAD or give any cardiac medication, including nitroglycerin.',
            },
            {
              id: 'cad-s12-certificate-access-text',
              type: 'text',
              body: 'Your certificate is generated automatically when you pass the knowledge check. CDPH-Approved CE Provider — NAC #7384.',
            },
          ]),
      },
    ],
  },
];


export async function seedCourse16CoronaryArteryDisease(
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

function blockCountsByLesson(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const moduleSeed of MODULES) {
    for (const lessonSeed of moduleSeed.lessons) {
      counts[`${moduleSeed.slug}/${lessonSeed.slug}`] = lessonSeed.buildContent().blocks.length;
    }
  }
  return counts;
}

function totalBlockCount(): number {
  return Object.values(blockCountsByLesson()).reduce((sum, count) => sum + count, 0);
}

async function main() {
  const prisma = new PrismaClient();
  console.log(`Seeding Course 16 (Coronary Artery Disease) as DRAFT — slug "${COURSE_SLUG}"…`);

  try {
    const result = await seedCourse16CoronaryArteryDisease(prisma);
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
