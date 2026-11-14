/**
 * Seed Course 29 — Caring for a Resident with Rheumatoid Arthritis (DRAFT).
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-29-rheumatoid-arthritis
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
const COURSE_SLUG = 'rheumatoid-arthritis';
const COURSE_TITLE = 'Rheumatoid Arthritis: Comfort, Mobility, and Joint Protection';
const COURSE_SUMMARY =
  'Learn to support a resident with rheumatoid arthritis — understanding it as a whole-body autoimmune disease, gentle joint protection and pain-aware care, supporting morning stiffness and flares, and watching for medication-related infection risk. CNAs do not diagnose, give or adjust medications, or perform therapy.';

const ASSET_BASE = `/assets/courses/rheumatoid-arthritis`;

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
    'Explain what RA is and how it differs from ordinary arthritis',
    'Provide gentle, joint-protecting care',
    'Support residents through morning stiffness and flares',
    'Watch for infection risk',
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
  heroImage: '/assets/courses/rheumatoid-arthritis/hero-banner.jpg',
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
    title: 'Understanding Rheumatoid Arthritis',
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: 'Introduction',
        sortOrder: 0,
        buildContent: () =>
          doc('Welcome', [
            { id: 'ra-s01-heading', type: 'heading', level: 1, text: 'Welcome' },
            {
              id: 'ra-s01-video',
              type: 'video',
              title: 'Introduction',
              videoUrl: '/assets/courses/rheumatoid-arthritis/s01-intro.mp4',
              placeholderNote: 'Pending upload: /assets/courses/rheumatoid-arthritis/s01-intro.mp4',
            },
            {
              id: 'ra-s01-image',
              type: 'image',
              src: `${ASSET_BASE}/s01-hero.jpg`,
              caption:
                'Rheumatoid arthritis — supporting a resident through an autoimmune disease that inflames the joints.',
            },
            {
              id: 'ra-s01-narration',
              type: 'text',
              body: [
                'Welcome to CAL ACE Nursing Academy.',
                'This course is about rheumatoid arthritis — and caring for a resident with gentle hands and real understanding.',
                'Let\'s clear up the most common misunderstanding right away. Many people think all arthritis is the same — just "achy joints from getting old." It isn\'t. Rheumatoid arthritis is very different from the ordinary wear-and-tear arthritis most people picture. Ordinary osteoarthritis comes from joints wearing down over the years. Rheumatoid arthritis — R-A — is an autoimmune disease: the body\'s own immune system mistakenly attacks the joints, causing inflammation, pain, swelling, and over time, joint damage and deformity.',
                'And here\'s the part that surprises people: rheumatoid arthritis isn\'t just a joint disease. Because it\'s a whole-body immune problem, it can cause fatigue, low-grade fever, and affect other parts of the body too. A resident with RA isn\'t just stiff — they may be genuinely unwell, tired to the bone, and in real, fluctuating pain.',
                'That fluctuation is central to this course. RA comes in flares — times when the disease flares up, joints become hot, swollen, and intensely painful, and even gentle care hurts — and quieter times in between. And it has a signature: morning stiffness, often severe, that can take a long time to ease. The resident who can barely move at seven in the morning may move much better by ten. Understanding this rhythm changes how, and when, you provide care.',
                'Here\'s why your role matters so much. How you move a resident\'s joints, how gently you handle painful hands, how you time care around their stiffness and flares, and how you protect their dignity and independence — all of it directly affects their pain and their quality of life. RA care is gentle-hands care. And there\'s one safety watch: many RA medications quiet the immune system, which means these residents catch infections more easily and show them less obviously — so you watch closely.',
                'Your scope is clear. A CNA provides gentle, joint-protecting, pain-aware care, supports residents through stiffness and flares, watches for infection, and reports faithfully. A CNA does not diagnose RA, does not give or adjust medications, and does not perform therapy.',
                'By the end of this course, you will be able to: explain what RA is and how it differs from ordinary arthritis. Provide gentle, joint-protecting care. Support residents through morning stiffness and flares. Watch for infection risk. And know your scope.',
                'There is a ten-question knowledge check at the end. Everything on it is covered here. Let\'s begin.',
              ].join('\n\n'),
            },
            {
              id: 'ra-s01-ci-text',
              type: 'text',
              body: [
                'This course teaches the CNA\'s role in supporting a resident with rheumatoid arthritis — understanding it as a whole-body autoimmune disease, gentle joint protection and pain-aware care, supporting morning stiffness and flares, and watching for medication-related infection risk.',
                'Let\'s be clear about your role. A CNA provides gentle, joint-protecting, pain-aware care, supports residents through stiffness and flares, watches for infection, and reports faithfully. A CNA does not diagnose RA, does not give or adjust medications, and does not perform therapy. Those are nursing and physician tasks. But none of them can happen without your careful observation and faithful reporting first.',
              ].join('\n\n'),
            },
            {
              id: 'ra-s01-ci-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of this course',
              body: 'CNAs SUPPORT, PROTECT, WATCH, and REPORT. CNAs do not diagnose RA, give or adjust medications, or perform therapy.',
            },
            {
              id: 'ra-s01-lo-text',
              type: 'text',
              body: 'By the end of this course, you will be able to:',
            },
            {
              id: 'ra-s01-lo-summary',
              type: 'summary',
              title: 'Learning objectives',
              items: [
                'Explain what RA is and how it differs from ordinary arthritis.',
                'Provide gentle, joint-protecting care.',
                'Support residents through morning stiffness and flares.',
                'Watch for infection risk.',
                'Know your scope — what a CNA does, and what a CNA must never do.',
              ],
            },
            {
              id: 'ra-s01-ii-text',
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
          doc('Key terms', [
            { id: 'ra-s02-heading', type: 'heading', level: 1, text: 'Key terms' },
            {
              id: 'ra-s02-image',
              type: 'image',
              src: `${ASSET_BASE}/s02-hero.jpg`,
              caption:
                'Key terms — autoimmune, symmetric joints, morning stiffness, flare, immunosuppression.',
            },
            {
              id: 'ra-s02-reveal-ra',
              type: 'reveal_card',
              frontTitle: 'Rheumatoid Arthritis (RA)',
              frontBody: 'ROO-mah-toyd',
              backTitle: 'Rheumatoid Arthritis (RA)',
              backBody:
                'An autoimmune disease where the immune system attacks the joints, causing inflammation, pain, swelling, and stiffness — and over time, joint damage. It\'s a whole-body disease, not just a joint problem, and it\'s different from ordinary wear-and-tear arthritis.',
            },
            {
              id: 'ra-s02-reveal-autoimmune',
              type: 'reveal_card',
              frontTitle: 'Autoimmune Disease',
              frontBody: 'Aw-toe-ih-MYOON',
              backTitle: 'Autoimmune Disease',
              backBody:
                'When the immune system, meant to fight germs, mistakenly attacks the body\'s own tissues. In RA, it attacks the lining of the joints. The resident did nothing to cause this — it\'s the immune system making a mistake.',
            },
            {
              id: 'ra-s02-reveal-osteoarthritis',
              type: 'reveal_card',
              frontTitle: 'Osteoarthritis (for contrast)',
              frontBody: 'Os-tee-oh-arth-RY-tis',
              backTitle: 'Osteoarthritis (for contrast)',
              backBody:
                'The common "wear-and-tear" arthritis, from joints wearing down over years of use — different from RA. Osteoarthritis is mechanical wear; rheumatoid arthritis is the immune system attacking. The care has overlaps, but RA is a whole-body disease.',
            },
            {
              id: 'ra-s02-reveal-inflammation',
              type: 'reveal_card',
              frontTitle: 'Inflammation',
              frontBody: 'Inflammation',
              backTitle: 'Inflammation',
              backBody:
                'The body\'s response to the immune attack in RA — causing the joints to become swollen, warm, red, and painful. Inflammation is what makes RA joints hurt and stiffen, and reducing it is the goal of RA treatment.',
            },
            {
              id: 'ra-s02-reveal-flare',
              type: 'reveal_card',
              frontTitle: 'Flare (Exacerbation)',
              frontBody: 'Flare, also called an exacerbation',
              backTitle: 'Flare (Exacerbation)',
              backBody:
                'A period when RA becomes much more active — joints become more swollen, hot, and painful, fatigue worsens, and the resident feels generally unwell. During a flare, even gentle care can hurt, and extra care and reporting are needed.',
            },
            {
              id: 'ra-s02-reveal-morning-stiffness',
              type: 'reveal_card',
              frontTitle: 'Morning Stiffness',
              frontBody: 'Morning stiffness',
              backTitle: 'Morning Stiffness',
              backBody:
                'A signature feature of RA — significant joint stiffness on waking that can last a long time, often more than an hour, before easing. It\'s why timing care matters: a resident may be much more able later in the morning than first thing.',
            },
            {
              id: 'ra-s02-reveal-joint-deformity',
              type: 'reveal_card',
              frontTitle: 'Joint Deformity',
              frontBody: 'Joint deformity',
              backTitle: 'Joint Deformity',
              backBody:
                'Over time, the inflammation of RA can damage joints and change their shape, especially in the hands and fingers — bending or twisting them. Deformed joints are often painful and fragile, and they need especially gentle, careful handling.',
            },
            {
              id: 'ra-s02-reveal-immunosuppression',
              type: 'reveal_card',
              frontTitle: 'Immunosuppression',
              frontBody: 'Im-yoo-no-sup-PRESH-un',
              backTitle: 'Immunosuppression',
              backBody:
                'Many RA medications work by quieting the overactive immune system — which also lowers the body\'s defenses against infection. So residents on these medications catch infections more easily, and may show fewer obvious signs — a key safety watch for the CNA.',
            },
            {
              id: 'ra-s02-kc1-check-ra',
              type: 'knowledge_check',
              question: 'Match the term: autoimmune disease attacking the joints (whole-body)',
              options: [
                { id: 'rheumatoid-arthritis', label: 'Rheumatoid arthritis' },
                { id: 'flare', label: 'Flare' },
                { id: 'immunosuppression', label: 'Immunosuppression' },
              ],
              correctOptionId: 'rheumatoid-arthritis',
              explanation:
                'Rheumatoid arthritis. An autoimmune disease where the immune system attacks the joints, causing inflammation, pain, swelling, and stiffness — and over time, joint damage. It\'s a whole-body disease, not just a joint problem.',
              requiredForCompletion: true,
            },
            {
              id: 'ra-s02-kc1-check-flare',
              type: 'knowledge_check',
              question: 'Match the term: period when RA becomes much more active and painful',
              options: [
                { id: 'rheumatoid-arthritis', label: 'Rheumatoid arthritis' },
                { id: 'flare', label: 'Flare' },
                { id: 'immunosuppression', label: 'Immunosuppression' },
              ],
              correctOptionId: 'flare',
              explanation:
                'Flare. A period when RA becomes much more active — joints become more swollen, hot, and painful, fatigue worsens, and the resident feels generally unwell. During a flare, even gentle care can hurt, and extra care and reporting are needed.',
              requiredForCompletion: true,
            },
            {
              id: 'ra-s02-kc1-check-immunosuppression',
              type: 'knowledge_check',
              question: 'Match the term: RA medications lower defenses, raising infection risk',
              options: [
                { id: 'rheumatoid-arthritis', label: 'Rheumatoid arthritis' },
                { id: 'flare', label: 'Flare' },
                { id: 'immunosuppression', label: 'Immunosuppression' },
              ],
              correctOptionId: 'immunosuppression',
              explanation:
                'Immunosuppression. Many RA medications work by quieting the overactive immune system — which also lowers the body\'s defenses against infection. So residents on these medications catch infections more easily, and may show fewer obvious signs.',
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
            { id: 'ra-s03-heading', type: 'heading', level: 1, text: 'Statistics' },
            pendingAudio(
              'ra-s03-audio',
              'Rheumatoid Arthritis: A Whole-Body Disease, Not Just Sore Joints',
              `${ASSET_BASE}/s03-stats-podcast.mp3`,
              [
                'Rheumatoid Arthritis: A Whole-Body Disease, Not Just Sore Joints',
                '',
                'Rheumatoid arthritis affects more than a million Americans. It\'s much less common than ordinary osteoarthritis, but it\'s far more serious as a disease — because it\'s not simple wear and tear, it\'s the immune system attacking the body. RA affects women two to three times more often than men, and while it can begin at any age, it\'s very common in older adults, making it a frequent condition in long-term care.',
                '',
                'The most important thing for a CNA to understand is how different RA is from the "arthritis" most people picture. Ordinary osteoarthritis is mechanical — joints wearing out over years. Rheumatoid arthritis is an autoimmune disease — the immune system mistakenly attacking the lining of the joints, causing inflammation throughout the body. That means a resident with RA isn\'t just stiff; they can have whole-body fatigue, low-grade fevers, weight loss, and effects on other organs. RA is genuinely a systemic illness, and these residents can feel truly unwell, not merely achy.',
                '',
                'Two features shape daily care. First, flares: RA waxes and wanes, and during a flare the joints become intensely swollen, hot, and painful, fatigue deepens, and even gentle care can hurt. Second, morning stiffness: a hallmark of RA is severe stiffness on waking that can last well over an hour. A resident who can barely move their hands at seven in the morning may function much better by mid-morning. These two patterns mean that how and when care is given matters enormously.',
                '',
                'There\'s also a critical safety issue. Many RA medications work by suppressing the overactive immune system — which also lowers the body\'s defenses. Residents on these medications catch infections more easily, and crucially, may show fewer obvious signs of infection, because the immune response that produces fever and redness is dampened. A serious infection can hide. This makes the CNA\'s close watch for any sign of illness especially important.',
                '',
                'The bottom line: RA is a serious, whole-body autoimmune disease that flares and stiffens, and whose treatments raise infection risk. Gentle, joint-protecting, well-timed care and vigilant watching for infection — the CNA\'s daily work — directly shape the resident\'s comfort and safety.',
              ].join('\n'),
              '/assets/courses/rheumatoid-arthritis/s03-stats-podcast.mp3',
            ),
            {
              id: 'ra-s03-image',
              type: 'image',
              src: `${ASSET_BASE}/s03-hero.jpg`,
              caption:
                "RA is more than 'arthritis' — it's an immune disease affecting the whole body.",
            },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: 'Fundamentals',
        sortOrder: 3,
        buildContent: () =>
          doc('Fundamentals', [
            { id: 'ra-s04-heading', type: 'heading', level: 1, text: 'Fundamentals' },
            {
              id: 'ra-s04-narration',
              type: 'text',
              body: [
                '**How a healthy joint works**',
                'A joint is where two bones meet, cushioned and lubricated so they glide smoothly. A thin lining called the synovium helps keep the joint healthy and moving freely. In a healthy joint, movement is smooth and painless.',
                '**What RA does: the immune attack**',
                'In rheumatoid arthritis, the immune system mistakenly attacks that joint lining. The lining becomes inflamed — swollen, warm, and painful. Over time, the ongoing inflammation can damage the cartilage and bone, and even change the joint\'s shape. The joint that should glide smoothly becomes swollen, stiff, and painful.',
                '**Why it\'s symmetrical and in the small joints**',
                'RA has a typical pattern. It often affects the same joints on both sides of the body — both hands, both wrists, both knees — that\'s called symmetrical. And it frequently starts in the small joints of the hands and feet. So a resident with RA often has painful, swollen, stiff hands on both sides — which deeply affects their ability to do daily tasks, and means their hands need especially gentle care.',
                '**More than joints: a whole-body disease**',
                'Because RA is a body-wide immune problem, it\'s more than joints. It causes deep fatigue — a tiredness far beyond being sleepy. It can cause low-grade fevers and a general feeling of being unwell. It can affect the eyes, lungs, heart, and blood vessels. Understanding this helps you see the whole resident: their exhaustion and feeling unwell are part of the disease, not laziness or complaint.',
                '**The rhythm: flares and morning stiffness**',
                'RA isn\'t steady — it has a rhythm. Flares are periods when the disease becomes very active: joints hotter, more swollen, more painful, fatigue worse, the resident more unwell. Between flares are calmer periods. And every day has its own rhythm too: morning stiffness, often severe, that eases as the day goes on. Care that honors this rhythm — gentler during flares, patient with morning stiffness — is far better care.',
                '**Why gentleness is everything**',
                'RA joints are inflamed, painful, and sometimes fragile and deformed. Rough or rushed handling causes real pain and can risk injury. Gentle, slow, supportive handling — supporting the joint, never forcing movement, respecting the resident\'s "stop" — is the core skill of RA care. Your hands can be a source of comfort or of pain; gentleness makes the difference.',
                '**Managed, not cured — and the infection watch**',
                'RA can\'t be cured, but modern medications can control it well, reducing flares and slowing joint damage. Many of these medications quiet the immune system — which controls the RA but lowers infection defenses. So two things follow: residents can live much better with good treatment, and they need careful watching for infection. Both shape the CNA\'s daily role.',
              ].join('\n\n'),
            },
            {
              id: 'ra-s04-gentleness-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Gentle, slow, supportive',
              body: 'Move slowly, support every joint, never force movement, and respect the resident\'s "stop." Gentleness is the core skill of RA care.',
            },
            {
              id: 'ra-s04-video',
              type: 'video',
              title: 'Fundamentals',
              videoUrl: `${ASSET_BASE}/s04-fundamentals.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s04-fundamentals.mp4`,
            },
            {
              id: 'ra-s04-image',
              type: 'image',
              src: `${ASSET_BASE}/s04-hero.jpg`,
              caption: 'How RA attacks the joints, and why gentle handling matters so much.',
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
            { id: 'ra-s05-heading', type: 'heading', level: 1, text: 'Signs & Symptoms' },
            {
              id: 'ra-s05-image',
              type: 'image',
              src: `${ASSET_BASE}/s05-hero.jpg`,
              caption:
                'Recognizing trouble — a flare, and the quiet signs of infection on immune-suppressing meds.',
            },
            {
              id: 'ra-s05-narration',
              type: 'text',
              body: [
                'To care well for a resident with RA, you watch three things: the everyday signs, the signs of a flare, and the easily-hidden signs of infection. Let\'s learn all three.',
                '**The everyday joint signs**',
                'The everyday signs of RA center on the joints, often symmetrically — both hands, both wrists. Swollen, puffy joints. Joints that feel warm and look red. Pain and tenderness. Stiffness. Over time, deformity — fingers bending or drifting out of shape. Reduced ability to grip, hold, and do fine tasks like buttons or utensils. Knowing each resident\'s usual joint state is your baseline for noticing change.',
                '**Morning stiffness and fatigue**',
                'Two signature signs shape the day. Morning stiffness: severe stiffness on waking that can last well over an hour before easing — so the resident is often far more capable later in the morning than first thing. And fatigue: a deep, whole-body tiredness that\'s part of the disease, not ordinary sleepiness. A resident who needs to rest, or who can\'t do at four in the afternoon what they did at ten, isn\'t being difficult — that\'s RA fatigue. Respect both.',
                '**The signs of a flare**',
                'A flare is when RA becomes much more active, and it changes everything about the day\'s care. Watch for: joints suddenly more swollen, hotter, redder, and far more painful. Deepening fatigue. A general unwell feeling, sometimes a low fever. Reduced ability to do usual tasks because of the pain. During a flare, even gentle care hurts more, the resident needs more help and more rest, and the flare itself is reported — the team may adjust treatment. Your gentleness matters most exactly when a flare makes everything tender.',
                '**The hidden infection — a critical watch**',
                'This is the safety-critical part. Because RA medications quiet the immune system, these residents catch infections more easily AND show them less obviously. The usual loud signs of infection — high fever, strong redness — may be muted. So watch for subtle signs: a low-grade fever, new tiredness beyond their usual, feeling unwell, a small wound that looks slightly off, new confusion, a cough, or urinary changes. In an immunosuppressed resident, small signs can mean a serious infection. Report anything that suggests illness promptly — don\'t wait for dramatic signs that may never come.',
                '**Summary**',
                'Three pictures. Everyday RA: symmetrical swollen warm joints, morning stiffness, deep fatigue, reduced grip. A flare: hotter, more swollen, more painful joints, worse fatigue, feeling unwell — report it, give extra gentle care and rest. Infection watch: subtle signs — low fever, new tiredness, feeling unwell — reported promptly because RA medications hide infection.',
                'The rule underneath it all: honor the rhythm of stiffness and flares with gentle, well-timed care — and because the immune system is quieted, treat even small signs of infection seriously.',
              ].join('\n\n'),
            },
            {
              id: 'ra-s05-infection-callout',
              type: 'callout',
              variant: 'warning',
              title: 'Watch for hidden infection',
              body: 'RA medications quiet the immune system, so infections come more easily and show fewer signs. Report even subtle clues — low fever, new tiredness, feeling "off" — promptly.',
            },
          ]),
      },
      {
        slug: 's06-causes',
        title: 'Causes',
        sortOrder: 1,
        buildContent: () =>
          doc('Causes', [
            { id: 'ra-s06-heading', type: 'heading', level: 1, text: 'Causes' },
            pendingAudio(
              'ra-s06-audio',
              'What Causes RA — and What Triggers a Flare?',
              `${ASSET_BASE}/s06-causes-podcast.mp3`,
              [
                'What Causes RA — and What Triggers a Flare?',
                '',
                'Rheumatoid arthritis happens when the immune system mistakenly attacks the body\'s own joints. Exactly why the immune system makes this mistake isn\'t fully understood, but it\'s believed to come from a combination of genetics and environment. Having certain genes raises the risk, and triggers in the environment — including smoking, which is a notable risk factor — may set the disease off in someone prone to it. RA is more common in women, suggesting hormones play a role too.',
                '',
                'The most important thing for the CNA to know about the cause is simple and humane: nothing the resident did caused their RA. It\'s not from overuse, not from a weak character, not from anything they chose. It\'s the immune system malfunctioning. These residents deserve care completely free of any hint of blame, and free of the dismissive idea that they\'re just "complaining about aches."',
                '',
                'For daily care, the more useful question is what triggers a flare — because recognizing and reporting flares, and supporting the things that reduce them, is hands-on CNA work. Flares can be triggered by stress, by illness or infection, by overexertion, by missed medication, and sometimes by no clear reason at all. Cold or weather changes bother some people. Importantly, infection can both trigger a flare and be more dangerous because of the medications — so illness in an RA resident is doubly important to catch.',
                '',
                'Then there\'s the medication side. RA is treated with medications that calm the overactive immune system. They control the disease well, but by quieting immunity, they lower the body\'s defenses against infection. This is the single biggest day-to-day safety issue in RA care: these residents catch infections more easily and show them less obviously. A small skin wound, a urinary infection, a chest infection can take hold quietly.',
                '',
                'So here\'s what it means for the CNA. You can\'t change why a resident has RA, but you influence their flares and their safety: support stress reduction and rest, support the medication routine and report missed doses, handle joints gently to avoid aggravating them, and — most critically — watch vigilantly for any sign of infection and report it promptly, because in these residents, infection is both more likely and more hidden.',
              ].join('\n'),
              '/assets/courses/rheumatoid-arthritis/s06-causes-podcast.mp3',
            ),
            {
              id: 'ra-s06-image',
              type: 'image',
              src: `${ASSET_BASE}/s06-hero.jpg`,
              caption: "What drives RA — an immune system attacking the body's own joints.",
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
              id: 'ra-s07-heading',
              type: 'heading',
              level: 1,
              text: 'CNA Role & Best Practices',
            },
            {
              id: 'ra-s07-image',
              type: 'image',
              src: `${ASSET_BASE}/s07-hero.jpg`,
              caption:
                'CNA scope — gentle joint protection, watching and reporting; never give or adjust RA medications.',
            },
            {
              id: 'ra-s07-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of practice',
              body: 'CNAs SUPPORT, PROTECT, WATCH, and REPORT. CNAs never give or adjust RA medications or perform therapy.',
            },
            {
              id: 'ra-s07-narration',
              type: 'text',
              body: [
                'RA treatment aims to calm the immune attack, reduce pain and inflammation, and protect the joints — and the CNA supports it without ever touching a dose. Let\'s walk through it, starting as always with the rule that never bends. A CNA does not give or adjust any RA medication, and does not perform therapy.',
                '**Disease-modifying medications and biologics — and the infection watch.** The core of RA treatment is medications that quiet the overactive immune system to slow the disease and prevent joint damage — including disease-modifying drugs and newer biologics. They\'re powerful and effective, but here is the safety-critical point that runs through this whole course: by suppressing the immune system, they lower the body\'s defenses, so residents on them catch infections more easily and show them less obviously. Your scope: you don\'t give these medications, but you watch like a hawk for any sign of infection — even subtle ones — and report promptly, support the medication routine, and report missed doses, since stopping can trigger a flare.',
                '**Anti-inflammatory and pain medications.** Residents may take anti-inflammatory medications and pain relievers to manage RA pain and inflammation. Red — what you report: stomach upset or signs of stomach bleeding like dark stools, which some anti-inflammatories can cause; and whether pain is controlled or worsening. You observe and report; you never give or adjust.',
                '**Steroids.** Short courses of steroid medication may be used to calm flares. These also lower immune defenses and can have other effects — so the infection watch applies, and you report how the resident is responding. Steroids are never stopped abruptly, which is a medical decision, but it\'s another reason reporting refusals matters.',
                '**Therapy, heat and cold, and joint protection.** Physical and occupational therapists work on keeping joints moving, strength, and adaptive techniques and equipment — built-up utensil handles, jar openers, dressing aids — that protect painful joints. You reinforce what they assign and ensure the equipment is used. Heat and cold may be ordered for comfort — but only as the care plan directs, and always protecting skin and testing temperature, because these residents may have fragile skin and you must never burn or chill them.',
                '**Rest and gentle movement balance.** Treatment balances rest during flares with gentle movement to keep joints from stiffening. You support both as the plan directs — more rest and gentleness in a flare, gentle encouragement of movement in calmer times.',
                'The scope point for this section: you never give or adjust medication or perform therapy — but you support the routine, protect joints gently, use heat and cold only as ordered, and above all watch relentlessly for the infections these medications can hide.',
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
            { id: 'ra-s08-heading', type: 'heading', level: 1, text: 'Prevention & Risk Reduction' },
            {
              id: 'ra-s08-image',
              type: 'image',
              src: `${ASSET_BASE}/s08-hero.jpg`,
              caption:
                'Prevention — protecting joints, easing morning stiffness, catching flares and infection early.',
            },
            {
              id: 'ra-s08-narration',
              type: 'text',
              body: [
                'With RA, the CNA prevents pain, joint injury, and dangerous infections. Here are seven ways.',
                '**One. Handle every joint gently.** Move slowly, support the joint, and never force or rush a stiff or painful joint. Let the resident guide how much movement they can tolerate, and respect their "stop." Gentle handling prevents pain and protects fragile joints. This is the heart of RA care.',
                '**Two. Time care around stiffness and flares.** Honor the rhythm. Allow extra time and patience first thing in the morning when stiffness is worst, and where possible schedule demanding care for later when joints have loosened. During a flare, ease off — more help, more rest, gentler hands. Well-timed care is gentler care.',
                '**Three. Protect the joints in daily tasks.** Use the adaptive equipment the therapists provide — built-up utensil handles, easy-grip aids, dressing tools. Encourage techniques that spare the joints, like using larger joints instead of fragile fingers. Protecting joints during daily activities reduces pain and slows damage.',
                '**Four. Watch relentlessly for infection.** This is the safety-critical prevention. Because RA medications quiet the immune system and hide infection signs, watch closely for any sign of illness — even subtle ones like a low fever, new tiredness, a small off-looking wound, a cough, or urinary changes — and report promptly. Practice good hand hygiene, keep sick visitors away, and support vaccines. Catching infection early in these residents saves lives.',
                '**Five. Support skin and pressure care.** RA and reduced mobility raise pressure-injury risk, and fragile skin and deformed joints need extra care. Reposition as needed, check skin carefully, and pad and protect deformed or bony areas. Report any skin breakdown promptly, especially given the infection risk.',
                '**Six. Balance rest and gentle movement.** Support rest during flares and deep-fatigue days, and gentle movement during calmer times to keep joints from stiffening — as the care plan and therapists direct. Both rest and movement, in the right proportion, protect the resident.',
                '**Seven. Support independence and dignity within comfort.** Encourage residents to do what they comfortably can — it preserves function and dignity — while stepping in for what pain prevents. Never rush them, never dismiss their pain or fatigue, and respect that their abilities change day to day. Emotional support matters in a painful, fluctuating disease.',
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
              id: 'ra-s09-heading',
              type: 'heading',
              level: 1,
              text: 'Scenario & Reporting',
            },
            pendingAudio(
              'ra-s09-intro-audio',
              'Emergency response scenarios intro',
              `${ASSET_BASE}/s09-emergency-intro.mp3`,
              'With RA, the judgments that matter most are recognizing the hidden infection that the medications can mask, and responding correctly to a flare. You\'re about to work through two situations. Read each carefully, choose your action, and you\'ll get feedback right away. Keep the safety-critical idea in mind: RA medications quiet the immune system, so infections come more easily and look milder — take even small signs seriously.',
              '/assets/courses/rheumatoid-arthritis/s09-emergency-intro.mp3',
            ),
            {
              id: 'ra-s09-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-hero.jpg`,
              caption:
                'Two RA judgments — a hidden infection to report, and a flare that calls for extra-gentle care.',
            },
            {
              id: 'ra-s09-scenario-petrov-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-scenario-petrov.jpg`,
              caption:
                'On immune-suppressing meds: subtle signs (fatigue, cough, low fever) can mean hidden infection — report promptly.',
            },
            {
              id: 'ra-s09-scenario-petrov',
              type: 'scenario_question',
              prompt:
                'Mr. Petrov takes immune-suppressing medication for his RA. Over the past day you\'ve noticed he seems more tired than usual, is eating less, says he just feels "off," and has a slight cough. He has only a very mild low-grade temperature — nothing dramatic — and no strong redness or high fever. What SHOULD the CNA do?',
              options: [
                {
                  id: 'wait-fever',
                  label: 'Wait for a high fever or clear signs before doing anything',
                  feedback:
                    'In an immune-suppressed RA resident, infection often shows only subtle signs — the medication hides the dramatic ones. New tiredness, poor appetite, feeling "off," and a slight cough can signal a serious hidden infection. Waiting or dismissing it as RA fatigue is dangerous. The right action: report the subtle signs to the nurse promptly.',
                },
                {
                  id: 'report-promptly',
                  label:
                    'Report these subtle signs to the nurse promptly — infection can hide in immune-suppressed residents',
                  feedback:
                    'Right. In a resident on immune-suppressing RA medication, the usual loud signs of infection — high fever, strong redness — may never appear, because the medication dampens the immune response. So subtle signs — new tiredness, eating less, feeling "off," a slight cough, a mild low fever — can be the only warning of a serious infection taking hold. These get reported promptly, not waited on. Waiting for dramatic signs that may never come is exactly the trap. Your prompt report lets the team catch and treat an infection early, which in these residents can be lifesaving.',
                  isRecommended: true,
                },
                {
                  id: 'assume-fatigue',
                  label: 'Assume it\'s just his RA fatigue and ignore it',
                  feedback:
                    'In an immune-suppressed RA resident, infection often shows only subtle signs — the medication hides the dramatic ones. New tiredness, poor appetite, feeling "off," and a slight cough can signal a serious hidden infection. Waiting or dismissing it as RA fatigue is dangerous. The right action: report the subtle signs to the nurse promptly.',
                },
                {
                  id: 'next-shift',
                  label: 'Wait until the next shift to mention it',
                  feedback:
                    'In an immune-suppressed RA resident, infection often shows only subtle signs — the medication hides the dramatic ones. New tiredness, poor appetite, feeling "off," and a slight cough can signal a serious hidden infection. Waiting or dismissing it as RA fatigue is dangerous. The right action: report the subtle signs to the nurse promptly.',
                },
              ],
              requiredForCompletion: true,
            },
            {
              id: 'ra-s09-scenario-adeyemi-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-scenario-adeyemi.jpg`,
              caption:
                "Joints hot, swollen, and painful: it's a flare — be extra gentle, don't force movement, report it.",
            },
            {
              id: 'ra-s09-scenario-adeyemi',
              type: 'scenario_question',
              prompt:
                'You arrive to help Mrs. Adeyemi with her morning care and find her joints much more swollen, hot, and red than usual, and she\'s wincing in significant pain even before you touch her. She\'s more exhausted than normal and says she feels generally unwell. Her usual routine includes some range-of-motion movement. What SHOULD the CNA do?',
              options: [
                {
                  id: 'push-through',
                  label: 'Push through her usual full routine and range-of-motion exercises anyway',
                  feedback:
                    'These are flare signs — hot, swollen, painful joints, deep fatigue, feeling unwell. Forcing her usual routine or pushing her to "move more" through a flare causes real pain and can worsen inflamed joints. The right action: give extra-gentle care, don\'t force painful movement, allow rest, and report the flare to the nurse.',
                },
                {
                  id: 'gentle-care-report',
                  label:
                    'Provide extra-gentle care, avoid forcing painful movement, allow rest, and report the flare to the nurse',
                  feedback:
                    'Right. Hotter, more swollen, more painful joints, deep fatigue, and feeling unwell are the signs of an RA flare — the disease is very active right now. During a flare, you provide extra-gentle care, you do NOT force the usual movement or exercises through severe pain, you allow more rest and help, and you report the flare to the nurse, because the team may adjust treatment. Forcing her normal routine through a flare causes real pain and could aggravate inflamed joints. Honor the flare with gentleness, rest, and a prompt report.',
                  isRecommended: true,
                },
                {
                  id: 'move-more',
                  label: 'Tell her she needs to move more to loosen up',
                  feedback:
                    'These are flare signs — hot, swollen, painful joints, deep fatigue, feeling unwell. Forcing her usual routine or pushing her to "move more" through a flare causes real pain and can worsen inflamed joints. The right action: give extra-gentle care, don\'t force painful movement, allow rest, and report the flare to the nurse.',
                },
                {
                  id: 'come-back-later',
                  label: 'Skip checking on her and come back much later',
                  feedback:
                    'These are flare signs — hot, swollen, painful joints, deep fatigue, feeling unwell. Forcing her usual routine or pushing her to "move more" through a flare causes real pain and can worsen inflamed joints. The right action: give extra-gentle care, don\'t force painful movement, allow rest, and report the flare to the nurse.',
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
            { id: 'ra-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
              id: 'ra-s10-narration',
              type: 'text',
              body: [
                'Your role in RA care is gentle hands, smart timing, vigilant watching, and real respect. Let\'s walk through it.',
                '**Gentle hands, always** The foundation is gentleness. Move slowly and support every joint. Never force a stiff or painful joint, never rush a movement, and always respect the resident\'s "stop." Their joints are inflamed and sometimes fragile or deformed — your hands can bring comfort or pain, and gentleness is the difference. This single skill defines good RA care.',
                '**Time care to the rhythm** Work with RA\'s rhythm. Give extra time and patience for morning stiffness, and where you can, schedule demanding care for later in the morning when joints have loosened. During a flare, shift gears — more help, more rest, gentler hands, no forcing the usual routine. Care timed to the resident\'s stiffness and flares is far kinder and more effective.',
                '**Watch for the hidden infection** Be the infection sentry. Because RA medications quiet the immune system and mask infection signs, watch closely for even subtle illness — low fever, new tiredness, feeling "off," a small off-looking wound, cough, urinary changes — and report promptly. Practice good hand hygiene and keep sick visitors away. In these residents, catching infection early genuinely saves lives, and you\'re the one most likely to spot it first.',
                '**Protect dignity and independence** Honor the whole person. Encourage residents to do what they comfortably can with their adaptive tools — it preserves function and dignity — while stepping in for what pain prevents. Never dismiss their pain or their deep fatigue as complaining; both are real parts of the disease. Respect that their abilities change day to day. And offer warmth and patience, because living with chronic pain and a fluctuating illness is genuinely hard.',
                'Now the boundary. You do not diagnose RA. You do not give or adjust any medication. You do not perform therapy — you reinforce it. You use heat and cold only as the care plan orders, protecting skin. And you never force a painful joint, and never wait for dramatic infection signs that the medications may hide.',
                'Inside your role — gentle hands, well-timed care, vigilant infection watching, and respectful support — you directly reduce a resident\'s pain and protect their safety every day. In a disease defined by pain and fatigue, a gentle, attentive CNA is a genuine comfort.',
              ].join('\n\n'),
            },
            {
              id: 'ra-s10-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Stay within scope',
              body: 'You do not diagnose RA. You do not give or adjust any medication. You do not perform therapy — you reinforce it. You never force a painful joint, and never wait for dramatic infection signs that the medications may hide.',
            },
            {
              id: 'ra-s10-video',
              type: 'video',
              title: "CNA's Role in Care",
              videoUrl: `${ASSET_BASE}/s10-cna-role.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s10-cna-role.mp4`,
            },
            {
              id: 'ra-s10-image',
              type: 'image',
              src: `${ASSET_BASE}/s10-hero.jpg`,
              caption:
                'The CNA as the daily support — gentle care and sharp observation protect a resident with RA.',
            },
          ]),
      },
      {
        slug: 's11-case-study',
        title: 'Case Study',
        sortOrder: 2,
        buildContent: () => {
          const caseNarrative = [
            'Mrs. Adeyemi, 76, had rheumatoid arthritis managed with an immune-suppressing medication that kept her joints reasonably comfortable. Her CNA, Daniel, had cared for her for a year, knew her gentle routine, and knew her warm, uncomplaining nature.',
            '',
            '**The day-to-day care:** Daniel had learned RA care well. He handled Mrs. Adeyemi\'s swollen hands gently, gave her extra time in the morning when her stiffness was worst, used her built-up utensils to help her stay independent at meals, and never rushed her. He understood her deep fatigue wasn\'t laziness. On her bad days, he eased off and let her rest.',
            '',
            '**The subtle change:** One day, Daniel noticed small things. Mrs. Adeyemi, normally bright, seemed unusually tired and a little withdrawn. She ate only half her lunch — unusual for her. She had a slight, occasional cough and said she felt "a bit off, just run down." Her temperature was only barely elevated — nothing that would alarm most people — and she had no dramatic symptoms at all. A coworker shrugged: "She\'s just having a low RA day, she gets tired."',
            '',
            '**What Daniel knew:** But Daniel remembered the safety-critical lesson of RA care: her medication quieted her immune system, which meant an infection could take hold while showing almost no obvious signs — no high fever, no dramatic redness, just subtle clues. New tiredness, poor appetite, feeling "off," a slight cough. In an immune-suppressed resident, those small signs deserved to be taken seriously, not dismissed as "just a tired RA day."',
            '',
            '**What Daniel did:** Daniel reported it promptly and specifically: "Mrs. Adeyemi seems more tired than usual, only ate half her lunch, has a slight cough, says she feels run down, and has a barely-raised temperature. I know her RA medication suppresses her immune system, so I didn\'t want to wait on these subtle signs." The nurse took it seriously, assessed her, and the doctor was contacted.',
            '',
            '**The discovery:** Mrs. Adeyemi had an early chest infection — a pneumonia just beginning. Because her immune system was suppressed, it hadn\'t produced the usual high fever and obvious illness; it had hidden behind subtle signs. Caught this early, it was treated promptly with the right medication, and she recovered well, without the crisis it could have become.',
            '',
            '**The outcome:** The nurse told Daniel: "In a resident on these medications, that infection could\'ve gotten dangerous before it ever looked dramatic. You didn\'t wait for the big signs — because with her, the big signs might never have come. You caught it on the small ones." A potentially serious infection was caught early because Daniel knew that, in RA, small signs are big signs.',
            '',
            '**Discussion:** Daniel\'s day-to-day care showed the gentleness and timing RA demands. But his real save came from the safety-critical knowledge at the heart of this course: RA medications hide infection, so subtle signs must be taken seriously. He knew her baseline, noticed the small changes, connected them to her immune suppression, and reported promptly instead of accepting "just a tired RA day." He never diagnosed, never touched a medication — he watched, recognized, and reported. And that knowledge of hidden infection may have saved her life.',
          ].join('\n');

          return doc('Brief Case Study', [
            { id: 'ra-s11-heading', type: 'heading', level: 1, text: 'Brief Case Study' },
            pendingAudio(
              'ra-s11-audio',
              'The Cough Nobody Worried About',
              `${ASSET_BASE}/s11-case-podcast.mp3`,
              caseNarrative,
              '/assets/courses/rheumatoid-arthritis/s11-case-podcast.mp3',
            ),
            {
              id: 'ra-s11-image',
              type: 'image',
              src: `${ASSET_BASE}/s11-hero.jpg`,
              caption:
                'Recognizing the pattern — how careful, gentle care supported a resident through a flare.',
            },
            {
              id: 'ra-s11-case-study',
              type: 'case_study',
              title: 'The Cough Nobody Worried About',
              residentProfile:
                'Mrs. Adeyemi, 76, had rheumatoid arthritis managed with an immune-suppressing medication that kept her joints reasonably comfortable. Her CNA, Daniel, had cared for her for a year, knew her gentle routine, and knew her warm, uncomplaining nature.',
              scenario: [
                '**The day-to-day care:** Daniel had learned RA care well. He handled Mrs. Adeyemi\'s swollen hands gently, gave her extra time in the morning when her stiffness was worst, used her built-up utensils to help her stay independent at meals, and never rushed her. He understood her deep fatigue wasn\'t laziness. On her bad days, he eased off and let her rest.',
                '**The subtle change:** One day, Daniel noticed small things. Mrs. Adeyemi, normally bright, seemed unusually tired and a little withdrawn. She ate only half her lunch — unusual for her. She had a slight, occasional cough and said she felt "a bit off, just run down." Her temperature was only barely elevated — nothing that would alarm most people — and she had no dramatic symptoms at all. A coworker shrugged: "She\'s just having a low RA day, she gets tired."',
                '**What Daniel knew:** But Daniel remembered the safety-critical lesson of RA care: her medication quieted her immune system, which meant an infection could take hold while showing almost no obvious signs — no high fever, no dramatic redness, just subtle clues. New tiredness, poor appetite, feeling "off," a slight cough. In an immune-suppressed resident, those small signs deserved to be taken seriously, not dismissed as "just a tired RA day."',
                '**What Daniel did:** Daniel reported it promptly and specifically: "Mrs. Adeyemi seems more tired than usual, only ate half her lunch, has a slight cough, says she feels run down, and has a barely-raised temperature. I know her RA medication suppresses her immune system, so I didn\'t want to wait on these subtle signs." The nurse took it seriously, assessed her, and the doctor was contacted.',
                '**The discovery:** Mrs. Adeyemi had an early chest infection — a pneumonia just beginning. Because her immune system was suppressed, it hadn\'t produced the usual high fever and obvious illness; it had hidden behind subtle signs. Caught this early, it was treated promptly with the right medication, and she recovered well, without the crisis it could have become.',
                '**The outcome:** The nurse told Daniel: "In a resident on these medications, that infection could\'ve gotten dangerous before it ever looked dramatic. You didn\'t wait for the big signs — because with her, the big signs might never have come. You caught it on the small ones." A potentially serious infection was caught early because Daniel knew that, in RA, small signs are big signs.',
                '**Discussion:** Daniel\'s day-to-day care showed the gentleness and timing RA demands. But his real save came from the safety-critical knowledge at the heart of this course: RA medications hide infection, so subtle signs must be taken seriously. He knew her baseline, noticed the small changes, connected them to her immune suppression, and reported promptly instead of accepting "just a tired RA day." He never diagnosed, never touched a medication — he watched, recognized, and reported. And that knowledge of hidden infection may have saved her life.',
              ].join('\n\n'),
            },
            {
              id: 'ra-s11-reflection-1',
              type: 'reflection',
              prompt:
                'Mrs. Adeyemi had only subtle signs and barely any fever. Why can infection be so dangerous and so hidden in a resident on immune-suppressing RA medication, and why did Daniel refuse to wait for dramatic signs?',
              minCharacters: 50,
            },
            {
              id: 'ra-s11-reflection-2',
              type: 'reflection',
              prompt:
                'A coworker dismissed it as "just a low RA day." How did Daniel\'s knowledge of her medication and his familiarity with her baseline let him see it differently?',
              minCharacters: 50,
            },
            {
              id: 'ra-s11-rp-text',
              type: 'text',
              body: 'Reflect on the case study in the previous lesson. Your written responses help you apply what you learned about hidden infection risk, knowing the resident\'s baseline, and gentle joint-protecting care.',
            },
            {
              id: 'ra-s11-kc2-check',
              type: 'knowledge_check',
              question:
                'A CNA does not give or adjust any RA medication, and does not perform therapy. When a resident with RA asks for more pain medication, the CNA SHOULD:',
              options: [
                {
                  id: 'give-medication',
                  label: 'Give extra pain medication as the resident requests',
                },
                {
                  id: 'report-nurse',
                  label: 'Report the concern to the nurse and let the nurse decide',
                },
                {
                  id: 'perform-therapy',
                  label: 'Perform range-of-motion therapy on your own to reduce pain',
                },
                {
                  id: 'adjust-dose',
                  label: 'Adjust the medication dose based on the resident\'s pain level',
                },
              ],
              correctOptionId: 'report-nurse',
              explanation:
                'You never give or adjust any RA medication and do not perform therapy — but your reporting of pain changes, infection signs, missed doses, and flare symptoms supports every treatment the team provides.',
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
            { id: 'ra-s12-heading', type: 'heading', level: 1, text: 'Conclusion' },
            {
              id: 'ra-s12-video',
              type: 'video',
              title: 'Conclusion',
              videoUrl: `${ASSET_BASE}/s12-conclusion.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s12-conclusion.mp4`,
            },
            {
              id: 'ra-s12-image',
              type: 'image',
              src: `${ASSET_BASE}/s12-hero.jpg`,
              caption: 'Five things that matter most in rheumatoid arthritis care.',
            },
            {
              id: 'ra-s12-narration',
              type: 'text',
              body: [
                'You\'ve reached the end. Let\'s lock in the five things that matter most for rheumatoid arthritis care.',
                '**One.** RA is an autoimmune, whole-body disease — the immune system attacking the joints — not ordinary wear-and-tear arthritis. It brings swollen, painful joints, often symmetrically in the hands, plus deep fatigue and feeling unwell. These residents aren\'t just achy; they can be genuinely ill.',
                '**Two.** Gentle hands are everything. Move slowly, support every joint, never force a stiff or painful joint, and respect the resident\'s "stop." Their joints are inflamed and sometimes fragile — your gentleness is the core of their comfort.',
                '**Three.** Honor the rhythm of stiffness and flares. Allow extra time and patience for severe morning stiffness, and during a flare — hotter, more swollen, more painful joints with deep fatigue — give extra-gentle care, more rest, no forced movement, and report the flare.',
                '**Four.** Watch relentlessly for hidden infection. RA medications quiet the immune system, so infections come more easily and show fewer signs. Take even subtle clues seriously — a low fever, new tiredness, feeling "off," a slight cough — and report promptly. With these residents, small signs can be big signs.',
                '**Five.** Honor your scope and the whole person. You never diagnose, give or adjust medication, or perform therapy. But you give gentle, well-timed care, support independence and dignity, watch for infection, and report faithfully — and that daily care directly reduces pain and protects safety in a hard, fluctuating disease.',
              ].join('\n\n'),
            },
            {
              id: 'ra-s12-summary',
              type: 'summary',
              title: 'Five things that matter most',
              items: [
                'RA is an autoimmune, whole-body disease — not ordinary wear-and-tear arthritis.',
                'Gentle hands are everything — move slowly, support joints, never force movement.',
                'Honor the rhythm of stiffness and flares — extra time in the morning, gentleness during flares.',
                'Watch relentlessly for hidden infection — small signs can be big signs.',
                'Honor your scope — gentle care, infection vigilance, and faithful reporting.',
              ],
            },
            {
              id: 'ra-s12-whn-text',
              type: 'text',
              body: 'Ten questions are waiting. Everything on them was covered here. You\'re ready. Trust what you\'ve learned, and show what you know.',
            },
            {
              id: 'ra-s12-completion-text',
              type: 'text',
              body: 'This course provides one hour of continuing education credit through CAL ACE Nursing Academy, an approved CDPH continuing education provider, NAC number 7384. Your certificate is generated automatically when you pass the knowledge check.',
            },
            {
              id: 'ra-s12-completion-callout',
              type: 'callout',
              variant: 'info',
              title: 'Scope reminder',
              body: 'CNAs support, protect, and watch. CNAs do not diagnose RA, give or adjust medications, or perform therapy.',
            },
            {
              id: 'ra-s12-certificate-text',
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

export async function seedCourse29RheumatoidArthritis(
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
  console.log(`Seeding Course 29 (Rheumatoid Arthritis) as DRAFT — slug "${COURSE_SLUG}"…`);

  try {
    const result = await seedCourse29RheumatoidArthritis(prisma);
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
