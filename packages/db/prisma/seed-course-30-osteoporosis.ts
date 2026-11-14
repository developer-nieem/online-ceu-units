/**
 * Seed Course 30 — Caring for a Resident with Osteoporosis (DRAFT).
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-30-osteoporosis
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
const COURSE_SLUG = 'osteoporosis';
const COURSE_TITLE = 'Bone Fragility and Osteoporosis Safety Care';
const COURSE_SUMMARY =
  'Learn to support a resident with osteoporosis — protecting fragile bones through fall prevention and safe gentle handling, recognizing a possible fracture, and supporting bone-healthy care. CNAs do not diagnose, give or adjust medications, or interpret bone scans.';

const ASSET_BASE = `/assets/courses/osteoporosis`;

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
    'Explain what osteoporosis is, in plain language',
    'Prevent fractures through safe handling and fall prevention',
    'Recognize the signs of a possible fracture',
    'Support bone health',
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
  heroImage: '/assets/courses/osteoporosis/hero-banner.png',
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
    title: 'Understanding Osteoporosis',
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: 'Introduction',
        sortOrder: 0,
        buildContent: () =>
          doc('Welcome', [
            { id: 'op-s01-heading', type: 'heading', level: 1, text: 'Welcome' },
            {
              id: 'op-s01-video',
              type: 'video',
              title: 'Introduction',
              videoUrl: `${ASSET_BASE}/s01-intro.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s01-intro.mp4`,
            },
            {
              id: 'op-s01-image',
              type: 'image',
              src: `${ASSET_BASE}/s01-hero.jpg`,
              caption:
                'Osteoporosis — the silent thinning of bone that turns a small fall into a fracture.',
            },
            {
              id: 'op-s01-narration',
              type: 'text',
              body: [
                'Welcome to CAL ACE Nursing Academy.',
                'This course is about osteoporosis — a condition that quietly weakens bones, and one where the CNA\'s careful hands prevent broken bones every single day.',
                'Osteoporosis means "porous bone." Healthy bone is dense and strong, but in osteoporosis, bone slowly loses its density and becomes thin, brittle, and fragile — like the difference between a solid brick and a honeycomb. The bones look the same from the outside, but inside they\'ve become weak enough to break far too easily.',
                'Here is what makes osteoporosis so important, and so dangerous. It\'s silent. A resident can\'t feel their bones weakening. There\'s no pain, no warning — until a bone breaks. And in severe osteoporosis, bones can break with shockingly little force: a minor fall, a hard bump, a twist during a transfer — even, in extreme cases, a strong cough or simply turning over in bed. The bone was already fragile; it just needed a small trigger.',
                'That single fact reshapes how a CNA gives care. Every transfer, every repositioning, every walk, every bit of handling is an opportunity either to protect a fragile bone or to break one. Gentle technique and fall prevention aren\'t just good practice with these residents — they\'re fracture prevention. The way you move a resident with osteoporosis can be the difference between a safe day and a broken hip.',
                'And broken bones in older adults are serious. A hip fracture in particular can be life-changing or even life-ending — it often leads to surgery, loss of independence, and dangerous complications. Preventing that fracture, through your daily care, is some of the most protective work a CNA does.',
                'Your scope is clear. A CNA prevents fractures through fall prevention and safe gentle handling, recognizes a possible fracture, and supports bone-healthy care. A CNA does not diagnose osteoporosis, does not give or adjust medications, and does not interpret bone scans.',
                'By the end of this course, you will be able to: explain what osteoporosis is, in plain language. Prevent fractures through safe handling and fall prevention. Recognize the signs of a possible fracture. Support bone health. And know your scope.',
                'There is a ten-question knowledge check at the end. Everything on it is covered here. Let\'s begin.',
              ].join('\n\n'),
            },
            {
              id: 'op-s01-ci-text',
              type: 'text',
              body: [
                'This course teaches the CNA\'s role in protecting a resident with osteoporosis from fractures — through fall prevention, safe gentle handling and transfers, recognizing a possible fracture, and supporting bone-healthy care.',
                'Let\'s be clear about your role. A CNA prevents fractures through fall prevention and safe gentle handling, recognizes a possible fracture, and supports bone-healthy care. A CNA does not diagnose osteoporosis, does not give or adjust medications, and does not interpret bone scans. Those are nursing and physician tasks. But none of them can happen without your careful observation and faithful reporting first.',
              ].join('\n\n'),
            },
            {
              id: 'op-s01-ci-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of this course',
              body: 'CNAs PREVENT, PROTECT, RESPOND, and REPORT. CNAs do not diagnose osteoporosis, give or adjust medications, or interpret bone scans.',
            },
            {
              id: 'op-s01-lo-text',
              type: 'text',
              body: 'By the end of this course, you will be able to:',
            },
            {
              id: 'op-s01-lo-summary',
              type: 'summary',
              title: 'Learning objectives',
              items: [
                'Explain what osteoporosis is, in plain language.',
                'Prevent fractures through safe handling and fall prevention.',
                'Recognize the signs of a possible fracture.',
                'Support bone health.',
                'Know your scope — what a CNA does, and what a CNA must never do.',
              ],
            },
            {
              id: 'op-s01-ii-text',
              type: 'text',
              body: 'This osteoporosis course is presented by CAL ACE Nursing Academy — an approved CDPH continuing education provider, NAC number 7384.',
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
            { id: 'op-s02-heading', type: 'heading', level: 1, text: 'Key terms' },
            {
              id: 'op-s02-image',
              type: 'image',
              src: `${ASSET_BASE}/s02-hero.jpg`,
              caption:
                'Key terms — osteoporosis, fragility fracture, vertebral compression, bone density.',
            },
            {
              id: 'op-s02-reveal-osteoporosis',
              type: 'reveal_card',
              frontTitle: 'Osteoporosis',
              frontBody: 'Os-tee-oh-por-OH-sis',
              backTitle: 'Osteoporosis',
              backBody:
                'A condition where bones lose density and become thin, brittle, and fragile, breaking far more easily than healthy bone. The name means "porous bone." It\'s silent — there are no symptoms until a bone breaks.',
            },
            {
              id: 'op-s02-reveal-bone-density',
              type: 'reveal_card',
              frontTitle: 'Bone Density',
              frontBody: 'Bone density',
              backTitle: 'Bone Density',
              backBody:
                'How thick and strong a bone is on the inside. Healthy bone is dense and strong. In osteoporosis, bone density drops, leaving the bone weak — like a honeycomb instead of a solid brick. Bone density is measured by a special scan.',
            },
            {
              id: 'op-s02-reveal-fracture',
              type: 'reveal_card',
              frontTitle: 'Fracture',
              frontBody: 'FRAK-chur',
              backTitle: 'Fracture',
              backBody:
                'A broken bone — a crack or break. In osteoporosis, fractures happen far too easily, sometimes from minor force. The most serious common ones are hip fractures, spine fractures, and wrist fractures.',
            },
            {
              id: 'op-s02-reveal-fragility-fracture',
              type: 'reveal_card',
              frontTitle: 'Fragility Fracture',
              frontBody: 'Fragility fracture',
              backTitle: 'Fragility Fracture',
              backBody:
                'A bone that breaks from a minor force that wouldn\'t break a healthy bone — a small fall, a bump, a twist, even, rarely, a cough or turning in bed. Fragility fractures are the signature danger of osteoporosis, and preventing them is the goal of care.',
            },
            {
              id: 'op-s02-reveal-hip-fracture',
              type: 'reveal_card',
              frontTitle: 'Hip Fracture',
              frontBody: 'Hip fracture',
              backTitle: 'Hip Fracture',
              backBody:
                'A break in the upper thigh bone near the hip — one of the most serious injuries in older adults. It usually needs surgery, often causes loss of independence, and carries a high risk of dangerous complications. Preventing hip fractures is a top priority.',
            },
            {
              id: 'op-s02-reveal-compression-fracture',
              type: 'reveal_card',
              frontTitle: 'Compression Fracture',
              frontBody: 'Compression fracture',
              backTitle: 'Compression Fracture',
              backBody:
                'A collapse of a bone in the spine, weakened by osteoporosis. It can cause sudden back pain, gradual loss of height, and a stooped, rounded upper back over time. Some happen with little or no obvious injury.',
            },
            {
              id: 'op-s02-reveal-kyphosis',
              type: 'reveal_card',
              frontTitle: 'Kyphosis',
              frontBody: 'Ky-FOH-sis',
              backTitle: 'Kyphosis',
              backBody:
                'An exaggerated forward curve of the upper back — a stooped or hunched posture — that can result from spinal compression fractures in osteoporosis. It can affect balance, breathing, and comfort, and signals fragile spine bones.',
            },
            {
              id: 'op-s02-reveal-body-mechanics',
              type: 'reveal_card',
              frontTitle: 'Body Mechanics',
              frontBody: 'Body mechanics',
              backTitle: 'Body Mechanics',
              backBody:
                'Using safe, proper technique and equipment to move and transfer residents — protecting the resident\'s fragile bones and the CNA\'s own back. With osteoporosis, good body mechanics and gentle handling are direct fracture prevention.',
            },
            {
              id: 'op-s02-kc1-check-osteoporosis',
              type: 'knowledge_check',
              question: 'Match the term: bones become thin, brittle, and break easily',
              options: [
                { id: 'osteoporosis', label: 'Osteoporosis' },
                { id: 'fragility-fracture', label: 'Fragility fracture' },
                { id: 'hip-fracture', label: 'Hip fracture' },
              ],
              correctOptionId: 'osteoporosis',
              explanation:
                'Osteoporosis. A condition where bones lose density and become thin, brittle, and fragile, breaking far more easily than healthy bone. The name means "porous bone." It\'s silent — there are no symptoms until a bone breaks.',
              requiredForCompletion: true,
            },
            {
              id: 'op-s02-kc1-check-fragility-fracture',
              type: 'knowledge_check',
              question:
                'Match the term: a break from minor force that wouldn\'t break healthy bone',
              options: [
                { id: 'osteoporosis', label: 'Osteoporosis' },
                { id: 'fragility-fracture', label: 'Fragility fracture' },
                { id: 'hip-fracture', label: 'Hip fracture' },
              ],
              correctOptionId: 'fragility-fracture',
              explanation:
                'Fragility fracture. A bone that breaks from a minor force that wouldn\'t break a healthy bone — a small fall, a bump, a twist, even, rarely, a cough or turning in bed. Fragility fractures are the signature danger of osteoporosis, and preventing them is the goal of care.',
              requiredForCompletion: true,
            },
            {
              id: 'op-s02-kc1-check-hip-fracture',
              type: 'knowledge_check',
              question:
                'Match the term: a serious break needing surgery, common in older adults',
              options: [
                { id: 'osteoporosis', label: 'Osteoporosis' },
                { id: 'fragility-fracture', label: 'Fragility fracture' },
                { id: 'hip-fracture', label: 'Hip fracture' },
              ],
              correctOptionId: 'hip-fracture',
              explanation:
                'Hip fracture. A break in the upper thigh bone near the hip — one of the most serious injuries in older adults. It usually needs surgery, often causes loss of independence, and carries a high risk of dangerous complications. Preventing hip fractures is a top priority.',
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
            { id: 'op-s03-heading', type: 'heading', level: 1, text: 'Statistics' },
            pendingAudio(
              'op-s03-audio',
              'Osteoporosis: The Silent Disease That Breaks Bones',
              `${ASSET_BASE}/s03-stats-podcast.mp3`,
              [
                'Osteoporosis: The Silent Disease That Breaks Bones',
                '',
                'Osteoporosis is extremely common, especially in older adults. Tens of millions of Americans have osteoporosis or low bone mass, and the risk rises sharply with age. It\'s most common in older women — after menopause, women lose bone density faster — but older men get it too. In a long-term care population, a large share of residents have weakened bones, whether formally diagnosed or not.',
                '',
                'The defining feature of osteoporosis is that it\'s silent. Bone loss causes no pain and no symptoms. A resident can have severely weakened bones and feel completely normal — until a bone breaks. This is why every older resident should be treated as if their bones may be fragile, because many are, and you can\'t tell by looking.',
                '',
                'The danger is fractures, and they can happen with frighteningly little force. In healthy bone, it takes significant trauma to cause a break. In osteoporotic bone, a minor fall from standing height, a hard bump, an awkward twist during a transfer — and in severe cases even a vigorous cough or turning in bed — can cause a fracture. The bone was already fragile; only a small trigger was needed.',
                '',
                'The most feared fracture is the hip fracture, and the statistics are sobering. Hip fractures in older adults very often lead to surgery, a major loss of independence, and a high rate of serious complications — and a significant percentage of older adults who suffer a hip fracture die within a year, often from complications of immobility like pneumonia and blood clots. Spine compression fractures are also common, causing pain, height loss, and a stooped posture. Wrist fractures from catching a fall are frequent too.',
                '',
                'Here is the empowering part for the CNA. The overwhelming majority of these devastating fractures are triggered by falls and by handling — exactly the things a CNA influences. Faithful fall prevention and gentle, technically-correct handling during transfers and care prevent the fall and the force that breaks the fragile bone. Research is clear that fall-prevention programs meaningfully reduce fractures. The CNA, more than anyone, is positioned to prevent the broken bone before it happens.',
                '',
                'The bottom line: osteoporosis is common and silent, bones can break with little force, hip fractures are devastating — and the CNA\'s fall prevention and gentle handling are the front line of fracture prevention.',
              ].join('\n'),
              `${ASSET_BASE}/s03-stats-podcast.mp3`,
            ),
            {
              id: 'op-s03-image',
              type: 'image',
              src: `${ASSET_BASE}/s03-hero.jpg`,
              caption:
                'Osteoporosis is common and often silent — the first sign is too often a broken bone.',
            },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: 'Fundamentals',
        sortOrder: 3,
        buildContent: () =>
          doc('Fundamentals', [
            { id: 'op-s04-heading', type: 'heading', level: 1, text: 'Fundamentals' },
            {
              id: 'op-s04-narration',
              type: 'text',
              body: [
                '**Bone is living tissue**',
                'Bone may seem like a solid, lifeless structure, but it\'s living tissue that constantly renews itself — old bone is broken down and new bone is built, all through life. When this renewal stays balanced, bones stay strong.',
                '**What goes wrong in osteoporosis**',
                'In osteoporosis, the balance tips: bone is broken down faster than it\'s rebuilt, so bone density slowly drops. The inside of the bone, once dense, becomes porous and thin — full of holes, like a honeycomb. The bone looks the same outside but is far weaker inside, and breaks far more easily.',
                '**Why it\'s silent**',
                'Here\'s the crucial thing: losing bone density causes no pain and no symptoms. There are no nerves announcing "your bones are weakening." A resident feels completely normal while their bones become dangerously fragile. The first sign of osteoporosis is very often the fracture itself. This silence is why we assume fragility and protect proactively.',
                '**Why bones break so easily**',
                'In a healthy person, it takes real force to break a bone. In osteoporosis, the safety margin is gone. A minor fall, a firm bump, an awkward pull or twist during a transfer can be enough. In severe cases, even everyday forces — a hard cough, turning in bed, lifting something — can cause a fracture. Understanding this changes how carefully you handle every movement.',
                '**The fractures that matter most**',
                'Three fractures dominate osteoporosis. The hip fracture — the most serious, usually needing surgery and often stealing independence. The spine compression fracture — collapsing spine bones causing back pain, height loss, and a stooped posture. And the wrist fracture — often from reaching out to catch a fall. Knowing these helps you recognize when one may have happened.',
                '**Why hip fractures are so dangerous**',
                'A hip fracture isn\'t just a broken bone — it\'s a cascade. It usually means surgery and a long, hard recovery. It often causes permanent loss of independence. And the immobility it brings invites dangerous complications: pneumonia, blood clots, pressure injuries. This is why preventing the hip fracture in the first place matters so enormously — and why your fall prevention is lifesaving, not just helpful.',
                '**Managed, and above all prevented**',
                'Osteoporosis can be slowed with medications, good nutrition, and activity, and existing fractures are treated. But the heart of osteoporosis care is prevention — preventing the fall and the force that breaks the fragile bone. That prevention is delivered every shift, in every transfer and every safeguarded step, by CNAs. You are the front line.',
              ].join('\n\n'),
            },
            {
              id: 'op-s04-silence-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Silent: no symptoms until a bone breaks',
              body: 'Assume fragility in older residents and protect their bones proactively. The first sign of osteoporosis is very often the fracture itself.',
            },
            {
              id: 'op-s04-video',
              type: 'video',
              title: 'Fundamentals',
              videoUrl: `${ASSET_BASE}/s04-fundamentals.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s04-fundamentals.mp4`,
            },
            {
              id: 'op-s04-image',
              type: 'image',
              src: `${ASSET_BASE}/s04-hero.jpg`,
              caption:
                'How bone weakens with age, and why a minor bump can break a fragile hip or spine.',
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
            { id: 'op-s05-heading', type: 'heading', level: 1, text: 'Signs & Symptoms' },
            {
              id: 'op-s05-image',
              type: 'image',
              src: `${ASSET_BASE}/s05-hero.jpg`,
              caption:
                'Recognizing the signs — height loss, stooped posture, sudden back pain.',
            },
            {
              id: 'op-s05-narration',
              type: 'text',
              body: [
                'With osteoporosis, you watch for two things: the quiet signs of the disease itself, and the signs that a fracture may have just happened. Let\'s learn both.',
                '**The quiet signs of osteoporosis**',
                'Osteoporosis is silent, but over time it leaves clues. A gradual loss of height — a resident getting shorter over the years. A stooped, rounded upper back — kyphosis — from collapsing spine bones. Ongoing or new back pain, which can come from spine compression fractures. And of course, a history of breaking bones easily. These signs tell you a resident\'s bones are fragile and need extra protection — even though the disease itself caused no pain as it developed.',
                '**Recognizing a possible fracture after a fall or bump**',
                'After any fall, bump, or even an awkward movement, watch for signs a bone may have broken. Pain — often sudden and at one spot, worse with movement or pressure. Swelling or bruising. Inability or unwillingness to move or bear weight on a limb. An arm or leg that looks wrong — bent, twisted, or out of shape. The resident guarding or protecting a body part. Any of these after a fall means a possible fracture — stop, don\'t move them unnecessarily, and get help.',
                '**The classic hip fracture signs**',
                'Hip fractures have a recognizable picture worth knowing. After a fall, the resident often can\'t stand or bear weight, and has pain in the hip, groin, or thigh. Classically, the leg on the injured side may look shorter and turned outward, with the foot rotated out. The resident may be lying where they fell, unable to get up. These signs strongly suggest a hip fracture — keep them still and get emergency help.',
                '**The fracture you didn\'t see happen**',
                'Here\'s a subtle but important point. In severe osteoporosis, a fracture can happen with so little force that no one witnessed an injury — a spine fracture from a cough or a turn, a fracture during routine care. So also watch for new, unexplained pain, new reluctance to move a limb or to be moved, new guarding, or new distress during handling — even when there was no obvious fall. New unexplained pain in a resident with fragile bones is treated as a possible fracture and reported.',
                '**Summary**',
                'Two pictures. Signs of osteoporosis itself: height loss, stooped posture, back pain, easy fractures — these mean fragile bones, protect them. Signs of a possible fracture: sudden localized pain, swelling, can\'t bear weight, a limb that looks wrong, a shortened outward-turned leg, or new unexplained pain — stop, don\'t move unnecessarily, get help.',
                'The rule underneath it all: assume fragility in older residents, and after any fall — or any new unexplained pain — treat a possible fracture seriously.',
              ].join('\n\n'),
            },
            {
              id: 'op-s05-fracture-callout',
              type: 'callout',
              variant: 'warning',
              title: 'Suspect a fracture?',
              body: 'After any fall or new unexplained pain, stop and don\'t move the resident unnecessarily. Keep them still, support the area gently, and get help immediately.',
            },
          ]),
      },
      {
        slug: 's06-causes',
        title: 'Causes',
        sortOrder: 1,
        buildContent: () =>
          doc('Causes', [
            { id: 'op-s06-heading', type: 'heading', level: 1, text: 'Causes' },
            pendingAudio(
              'op-s06-audio',
              'What Causes Osteoporosis — and What Raises Fracture Risk?',
              `${ASSET_BASE}/s06-causes-podcast.mp3`,
              [
                'What Causes Osteoporosis — and What Raises Fracture Risk?',
                '',
                'Osteoporosis develops when the body loses bone faster than it builds it. Several factors drive this, and most are not anyone\'s fault.',
                '',
                'Age is the biggest factor — bone density naturally declines as we get older, which is why osteoporosis is so common in the elderly. Being female and postmenopausal is a major factor: after menopause, the drop in estrogen speeds bone loss, so older women are at especially high risk. Family history plays a role. So do a thin or small body frame, long-term low calcium and vitamin D, low physical activity, smoking, heavy alcohol use, and certain medical conditions and medications — long-term steroid use is a notable one. Some residents you care for will have several of these factors at once.',
                '',
                'But for the CNA, the more practical question is what raises the risk of the fracture — because the fracture is what we prevent, and its triggers are things a CNA directly influences.',
                '',
                'The biggest fracture trigger is falling. In a resident with fragile bones, a fall is often all it takes. So everything that raises fall risk raises fracture risk: weakness, poor balance, unsteady walking, dizziness, vision problems, medications that cause drowsiness or low blood pressure, clutter and hazards, poor lighting, unsafe footwear, and rushing. The second trigger is handling — rough, forceful, or improper movement during transfers and care can fracture a fragile bone directly. And in severe osteoporosis, even minor everyday forces can do it.',
                '',
                'Here\'s what this means for the CNA. You can\'t change a resident\'s age or bone density, but you have enormous influence over whether the fracture happens. Faithful fall prevention removes the most common trigger. Gentle, technically-correct handling removes the second. Supporting bone-healthy nutrition, activity as the plan allows, and the medication routine supports the bones themselves over time. In short: the same daily work that prevents falls and protects fragile bodies is, for a resident with osteoporosis, direct fracture prevention — some of the most protective care you can give.',
              ].join('\n'),
              `${ASSET_BASE}/s06-causes-podcast.mp3`,
            ),
            {
              id: 'op-s06-image',
              type: 'image',
              src: `${ASSET_BASE}/s06-hero.jpg`,
              caption:
                'What drives bone loss — age, hormones, inactivity, low calcium and vitamin D.',
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
              id: 'op-s07-heading',
              type: 'heading',
              level: 1,
              text: 'CNA Role & Best Practices',
            },
            {
              id: 'op-s07-image',
              type: 'image',
              src: `${ASSET_BASE}/s07-hero.jpg`,
              caption:
                'CNA scope — gentle handling, fall prevention, reporting; never give or adjust medications.',
            },
            {
              id: 'op-s07-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of practice',
              body: 'CNAs PREVENT, PROTECT, RESPOND, and REPORT. CNAs never give or adjust osteoporosis medications or interpret bone scans.',
            },
            {
              id: 'op-s07-narration',
              type: 'text',
              body: [
                'Osteoporosis care is overwhelmingly about prevention, with medications and nutrition supporting the bones and treatment for fractures when they occur. The CNA supports all of it without ever touching a dose. Let\'s walk through it, starting as always with the rule that never bends. A CNA does not give or adjust osteoporosis medications, and does not interpret bone scans.',
                '**Bone medications — and one timing note.** Residents may take medications that slow bone loss or help build bone, along with calcium and vitamin D supplements. One common type of bone medication has specific instructions — taken with a full glass of water, on an empty stomach, and the resident must stay sitting up or standing for a period afterward and not lie down, to protect the esophagus. You don\'t give the medication, but you support that routine where it applies — helping the resident stay upright afterward as the nurse directs — and report any swallowing trouble or heartburn. Report missed supplements too, since bone health depends on consistency.',
                '**Safe handling and fall prevention — the real treatment.** Here is the heart of it: for osteoporosis, gentle handling and fall prevention ARE the treatment that prevents the catastrophic fracture. Every safe transfer, every cleared pathway, every steadying hand is fracture prevention in action. This is squarely in CNA scope and is the most important thing you do for these residents.',
                '**The fracture response — know it.** If you suspect a fracture — after a fall, or from new unexplained pain — your response is critical: do NOT move the resident unnecessarily or try to reposition the injured part. Keep them still and as comfortable as possible, support the area without forcing it, call the nurse and get help immediately, and stay with them. Moving a fractured bone can cause more damage. Keep them warm and calm while help comes.',
                '**Treatment after a fracture.** A confirmed fracture is treated by the medical team — often surgery for a hip, bracing or rest for others. Afterward, your role is gentle care, careful repositioning to prevent complications of immobility like pressure injuries and pneumonia, supporting the rehabilitation the therapists direct, and pain-aware handling.',
                '**Nutrition and activity as bone support.** Bone-healthy nutrition — adequate calcium, vitamin D, and protein — and safe weight-bearing activity as the plan allows help maintain bone. You support meals, supplements, and the planned activity, and report poor intake.',
                'The scope point for this section: you never give or adjust medication or read scans — but you deliver the safe handling and fall prevention that ARE the front-line treatment, you know the fracture response, and you support bone-healthy nutrition and activity.',
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
            { id: 'op-s08-heading', type: 'heading', level: 1, text: 'Prevention & Risk Reduction' },
            {
              id: 'op-s08-image',
              type: 'image',
              src: `${ASSET_BASE}/s08-hero.jpg`,
              caption:
                'Prevention — safe transfers, clutter-free floors, weight-bearing activity, good nutrition.',
            },
            {
              id: 'op-s08-narration',
              type: 'text',
              body: [
                'For osteoporosis, prevention is everything — and it\'s squarely your work. Here are seven ways CNAs prevent fractures.',
                '**One. Prevent falls relentlessly.** The fall is the number one cause of fractures. Keep pathways clear and well-lit, remove clutter and hazards, ensure proper non-slip footwear, set wheelchair and bed brakes, answer call lights fast, and provide the prescribed mobility aids. Stay close during walking and transfers. Every fall you prevent is a fracture you prevent.',
                '**Two. Handle with gentle, correct technique.** Rough or forceful handling can break a fragile bone directly. Use proper body mechanics and equipment, move slowly and smoothly, support limbs and joints fully, never pull or yank an arm or leg, and get help for transfers that need it. Gentle, correct handling protects fragile bones — and your own back.',
                '**Three. Transfer and reposition with extra care.** Transfers and turns are high-risk moments. Use the right equipment — gait belts, lifts, slide sheets — as trained. Never grab or lift by a fragile limb. Move the whole body in a supported, controlled way. Plan the move, get help if needed, and never rush. A careful transfer is fracture prevention.',
                '**Four. Reduce the environmental hazards.** Wet floors, loose rugs, poor lighting, obstacles, and unsafe chairs all invite falls. Keep the resident\'s environment safe and predictable, report hazards, and ensure call lights and needed items are within easy reach so residents don\'t reach or stretch dangerously.',
                '**Five. Support bone-healthy nutrition and activity.** Encourage meals with adequate calcium, vitamin D, and protein, support supplements as the plan directs, and support the safe weight-bearing activity the care plan and therapists include — gentle activity helps maintain bone and strength. Report poor eating.',
                '**Six. Watch for and respond to dizziness and weakness.** Medications, low blood pressure, illness, and weakness can cause the dizziness or unsteadiness that leads to a fall. Report these promptly, help residents rise slowly, and stay close when a resident seems weak or lightheaded. Catching the wobble prevents the fall.',
                '**Seven. Know each resident\'s fracture risk and history.** Some residents have severe osteoporosis or prior fragility fractures and need the highest level of caution. Know who they are, handle them with the greatest gentleness, and treat any new unexplained pain in them as a possible fracture. Tailored caution prevents the next break.',
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
              id: 'op-s09-heading',
              type: 'heading',
              level: 1,
              text: 'Scenario & Reporting',
            },
            pendingAudio(
              'op-s09-intro-audio',
              'Emergency response scenarios intro',
              `${ASSET_BASE}/s09-emergency-intro.mp3`,
              'With osteoporosis, the judgments that matter most are responding correctly when a fracture may have happened, and taking new unexplained pain seriously even without an obvious injury. You\'re about to work through two situations. Read each carefully, choose your action, and you\'ll get feedback right away. Keep the core rule in mind: if you suspect a fracture, don\'t move the resident unnecessarily — keep them still and get help.',
              `${ASSET_BASE}/s09-emergency-intro.mp3`,
            ),
            {
              id: 'op-s09-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-hero.jpg`,
              caption:
                'Two osteoporosis judgments — a possible fracture, and a transfer that must not be forced.',
            },
            {
              id: 'op-s09-scenario-kowalski-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-scenario-kowalski.jpg`,
              caption:
                'Sudden severe back pain after a small movement: suspect a fracture — report, don\'t move her.',
            },
            {
              id: 'op-s09-scenario-kowalski',
              type: 'scenario_question',
              prompt:
                'You find Mrs. Kowalski on the floor next to her bed after an apparent fall. She\'s in severe pain at her hip, can\'t get up or bear weight, and you notice her left leg looks shorter than the right and her foot is turned outward. A coworker says, "Let\'s lift her back into bed so she\'s comfortable." What is the BEST action?',
              options: [
                {
                  id: 'lift-into-bed',
                  label: 'Lift her back into bed as the coworker suggests',
                  feedback:
                    'These are classic hip fracture signs — severe pain, can\'t bear weight, leg shortened and turned outward. Lifting, standing, or rolling her could cause serious additional damage to the fractured bone. The right action: keep her still, do not move her, get emergency help immediately, and stay with her, warm and calm.',
                },
                {
                  id: 'keep-still-get-help',
                  label:
                    'Keep her still, do not move her, get emergency help immediately, and stay with her',
                  feedback:
                    'Exactly right. Severe hip pain, inability to bear weight, and a leg that looks shorter and turned outward after a fall are classic signs of a hip fracture. The most important thing is what you do NOT do: do not move her or lift her, because moving a fractured hip can cause serious additional damage, bleeding, and pain. Keep her still and as comfortable as possible where she is, get emergency help immediately, keep her warm and calm, and stay with her. Follow your facility\'s fall and injury procedure. Comfort comes from not making the injury worse — not from moving her.',
                  isRecommended: true,
                },
                {
                  id: 'help-stand',
                  label: 'Help her stand and walk to a chair',
                  feedback:
                    'These are classic hip fracture signs — severe pain, can\'t bear weight, leg shortened and turned outward. Lifting, standing, or rolling her could cause serious additional damage to the fractured bone. The right action: keep her still, do not move her, get emergency help immediately, and stay with her, warm and calm.',
                },
                {
                  id: 'roll-over',
                  label: 'Roll her over to check her back first',
                  feedback:
                    'These are classic hip fracture signs — severe pain, can\'t bear weight, leg shortened and turned outward. Lifting, standing, or rolling her could cause serious additional damage to the fractured bone. The right action: keep her still, do not move her, get emergency help immediately, and stay with her, warm and calm.',
                },
              ],
              requiredForCompletion: true,
            },
            {
              id: 'op-s09-scenario-halverson-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-scenario-halverson.jpg`,
              caption:
                'Resistance and pain on transfer: stop — never force a fragile body; get the nurse.',
            },
            {
              id: 'op-s09-scenario-halverson',
              type: 'scenario_question',
              prompt:
                'Mr. Halverson has severe osteoporosis. There\'s been no fall that anyone saw. But this morning he\'s suddenly guarding his arm, winces sharply and resists when you try to move it during dressing, says it hurts badly, and there\'s some swelling. He keeps the arm held protectively against his body. What SHOULD the CNA do?',
              options: [
                {
                  id: 'assume-stiffness',
                  label: 'Assume it\'s just stiffness and continue dressing him normally',
                  feedback:
                    'In severe osteoporosis, fractures can happen with little or no obvious injury. New sudden pain, guarding, and swelling — with sharp resistance to movement — point to a possible fracture, not mere stiffness. Forcing the arm could worsen a real break. The right action: stop, don\'t force the arm, support it gently, and report a possible fracture promptly.',
                },
                {
                  id: 'stop-support-report',
                  label:
                    'Stop, avoid forcing the arm, support it gently, and report a possible fracture to the nurse promptly',
                  feedback:
                    'Right. In severe osteoporosis, a bone can fracture with very little force — sometimes with no obvious fall at all. New sudden pain, guarding, swelling, and sharp resistance to movement in a fragile-boned resident must be treated as a possible fracture, even with no witnessed injury. Stop the dressing, do not force the arm, support it gently in a comfortable position, and report a possible fracture to the nurse promptly. Forcing movement through the pain could worsen a real fracture. New unexplained pain in fragile bones is a possible break until proven otherwise.',
                  isRecommended: true,
                },
                {
                  id: 'force-arm',
                  label: 'Move the arm firmly to work through the stiffness',
                  feedback:
                    'In severe osteoporosis, fractures can happen with little or no obvious injury. New sudden pain, guarding, and swelling — with sharp resistance to movement — point to a possible fracture, not mere stiffness. Forcing the arm could worsen a real break. The right action: stop, don\'t force the arm, support it gently, and report a possible fracture promptly.',
                },
                {
                  id: 'next-shift',
                  label: 'Wait until the next shift to mention it',
                  feedback:
                    'In severe osteoporosis, fractures can happen with little or no obvious injury. New sudden pain, guarding, and swelling — with sharp resistance to movement — point to a possible fracture, not mere stiffness. Forcing the arm could worsen a real break. The right action: stop, don\'t force the arm, support it gently, and report a possible fracture promptly.',
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
            { id: 'op-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
              id: 'op-s10-narration',
              type: 'text',
              body: [
                'Your role in osteoporosis care is fracture prevention, gentle handling, and correct response — every shift, every movement. Let\'s walk through it.',
                '**Handle every movement gently** Treat every transfer, turn, and bit of handling as fracture prevention. Move slowly and smoothly. Support limbs and the whole body fully. Use proper technique and the right equipment, and never pull, yank, or grab a fragile limb. Get help for any transfer that needs it. With fragile bones, the gentleness and correctness of your handling directly determines whether a bone stays whole.',
                '**Prevent the fall** Be relentless about falls, because the fall is the most common fracture trigger. Clear and light pathways, remove hazards, ensure safe footwear and working brakes, provide mobility aids, answer call lights fast, and stay close during walking and transfers. Watch for the dizziness and weakness that lead to falls and report them. Every fall prevented is, for these residents, a fracture prevented.',
                '**Respond correctly to a possible fracture** If a fracture may have happened — after a fall, or from new unexplained pain — your response protects the resident: do not move them unnecessarily, keep them still, support the injured area gently without forcing it, get help immediately, and stay with them, warm and calm. And take new unexplained pain in a fragile-boned resident seriously, even without a witnessed fall — stop, support, and report.',
                '**Support bones and recovery** Support the bones and any recovery. Encourage bone-healthy meals and supplements, support the safe activity the plan includes, and help the resident stay upright after certain bone medications where that\'s directed. After a fracture, give gentle, pain-aware care, reposition carefully to prevent the complications of immobility, and support rehabilitation. Report poor intake, pain, and any concerns.',
                'Now the boundary. You do not diagnose osteoporosis. You do not give or adjust medications or interpret bone scans. You never move a resident you suspect has a fracture unless they\'re in immediate danger. And you never force movement through new unexplained pain in a fragile-boned resident.',
                'Inside your role — gentle handling, relentless fall prevention, correct fracture response, and bone-healthy support — you prevent the broken bones that devastate older lives. With osteoporosis, the CNA isn\'t just helping; the CNA is the front line of fracture prevention.',
              ].join('\n\n'),
            },
            {
              id: 'op-s10-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Stay within scope',
              body: 'You do not diagnose osteoporosis. You do not give or adjust medications or interpret bone scans. You never move a resident you suspect has a fracture unless they\'re in immediate danger. And you never force movement through new unexplained pain in a fragile-boned resident.',
            },
            {
              id: 'op-s10-video',
              type: 'video',
              title: "CNA's Role in Care",
              videoUrl: `${ASSET_BASE}/s10-cna-role.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s10-cna-role.mp4`,
            },
            {
              id: 'op-s10-image',
              type: 'image',
              src: `${ASSET_BASE}/s10-hero.jpg`,
              caption:
                'The CNA as the daily guard — every safe transfer prevents the fracture that changes a life.',
            },
          ]),
      },
      {
        slug: 's11-case-study',
        title: 'Case Study',
        sortOrder: 2,
        buildContent: () => {
          const caseNarrative = [
            'Mrs. Kowalski, 84, had severe osteoporosis and a prior wrist fracture from a minor fall two years earlier. Her CNA, Mateo, knew her bones were fragile and treated every bit of her care with extra caution.',
            '',
            '**The busy moment:** One hectic afternoon, Mrs. Kowalski needed to transfer from her wheelchair to her bed. A newer aide, rushing and short on time, said, "I\'ve got her — just grab under her arms and we\'ll swing her over quick." Mateo stopped him. "Not with her. She\'s got severe osteoporosis and she\'s broken a bone from almost nothing before. We do this slow, with the gait belt, and we don\'t pull on her arms. Let me get the right setup." The newer aide was impatient, but Mateo didn\'t budge.',
            '',
            '**The careful transfer:** Mateo set the wheelchair brakes, positioned everything, used the gait belt properly, supported her fully, and moved her slowly and smoothly into bed — no pulling on fragile limbs, no rushing, no shortcuts. It took an extra two minutes. Mrs. Kowalski settled comfortably, unhurt.',
            '',
            '**The contrast that proved the point:** Later, Mateo gently explained to the newer aide why it mattered. "Grabbing her under the arms and swinging her over — with her bones, that\'s exactly how you snap a fragile bone or dislocate a shoulder. Two minutes of doing it right is nothing compared to a broken bone and surgery." The aide, who\'d thought Mateo was just being slow, understood.',
            '',
            '**The fall that tested it all:** A week later, Mrs. Kowalski had a different scare — she slipped while reaching for something near her bed and ended up on the floor. Mateo heard the call and came fast. She had severe hip pain, couldn\'t get up or bear weight, and her left leg looked shorter and turned outward. This time the danger was real. The same newer aide, now better trained, started to help lift her up — and Mateo stopped him again, but for the opposite reason: "No — don\'t move her. With that leg, this looks like a hip fracture. We keep her still and get help now." He kept her still and calm, supported her, and got emergency help immediately.',
            '',
            '**The outcome:** Mrs. Kowalski did have a hip fracture from the fall — but because Mateo didn\'t let anyone move her, no additional damage was done before she reached the hospital, and her surgery and recovery went as well as they could. And the careful transfers Mateo insisted on, week after week, had prevented countless other chances for a break.',
            '',
            '**Discussion:** Mateo embodied both halves of osteoporosis care. In daily handling, he refused the rushed, rough transfer that could fracture a fragile bone — gentle, correct technique as fracture prevention. And when a fracture did happen from a fall, he did exactly the right thing: kept her still, didn\'t move her, got help. He never diagnosed, never touched a medication. He prevented the fractures he could, and protected her from further harm when one occurred. With osteoporosis, that is the whole job — and it saves bones, independence, and lives.',
          ].join('\n');

          return doc('Brief Case Study', [
            { id: 'op-s11-heading', type: 'heading', level: 1, text: 'Brief Case Study' },
            pendingAudio(
              'op-s11-audio',
              'The Transfer That Didn\'t Happen',
              `${ASSET_BASE}/s11-case-podcast.mp3`,
              caseNarrative,
              `${ASSET_BASE}/s11-case-podcast.mp3`,
            ),
            {
              id: 'op-s11-image',
              type: 'image',
              src: `${ASSET_BASE}/s11-hero.jpg`,
              caption:
                'Recognizing the pattern — how a missed transfer led to a preventable fracture.',
            },
            {
              id: 'op-s11-case-study',
              type: 'case_study',
              title: 'The Transfer That Didn\'t Happen',
              residentProfile:
                'Mrs. Kowalski, 84, had severe osteoporosis and a prior wrist fracture from a minor fall two years earlier. Her CNA, Mateo, knew her bones were fragile and treated every bit of her care with extra caution.',
              scenario: [
                '**The busy moment:** One hectic afternoon, Mrs. Kowalski needed to transfer from her wheelchair to her bed. A newer aide, rushing and short on time, said, "I\'ve got her — just grab under her arms and we\'ll swing her over quick." Mateo stopped him. "Not with her. She\'s got severe osteoporosis and she\'s broken a bone from almost nothing before. We do this slow, with the gait belt, and we don\'t pull on her arms. Let me get the right setup." The newer aide was impatient, but Mateo didn\'t budge.',
                '**The careful transfer:** Mateo set the wheelchair brakes, positioned everything, used the gait belt properly, supported her fully, and moved her slowly and smoothly into bed — no pulling on fragile limbs, no rushing, no shortcuts. It took an extra two minutes. Mrs. Kowalski settled comfortably, unhurt.',
                '**The contrast that proved the point:** Later, Mateo gently explained to the newer aide why it mattered. "Grabbing her under the arms and swinging her over — with her bones, that\'s exactly how you snap a fragile bone or dislocate a shoulder. Two minutes of doing it right is nothing compared to a broken bone and surgery." The aide, who\'d thought Mateo was just being slow, understood.',
                '**The fall that tested it all:** A week later, Mrs. Kowalski had a different scare — she slipped while reaching for something near her bed and ended up on the floor. Mateo heard the call and came fast. She had severe hip pain, couldn\'t get up or bear weight, and her left leg looked shorter and turned outward. This time the danger was real. The same newer aide, now better trained, started to help lift her up — and Mateo stopped him again, but for the opposite reason: "No — don\'t move her. With that leg, this looks like a hip fracture. We keep her still and get help now." He kept her still and calm, supported her, and got emergency help immediately.',
                '**The outcome:** Mrs. Kowalski did have a hip fracture from the fall — but because Mateo didn\'t let anyone move her, no additional damage was done before she reached the hospital, and her surgery and recovery went as well as they could. And the careful transfers Mateo insisted on, week after week, had prevented countless other chances for a break.',
                '**Discussion:** Mateo embodied both halves of osteoporosis care. In daily handling, he refused the rushed, rough transfer that could fracture a fragile bone — gentle, correct technique as fracture prevention. And when a fracture did happen from a fall, he did exactly the right thing: kept her still, didn\'t move her, got help. He never diagnosed, never touched a medication. He prevented the fractures he could, and protected her from further harm when one occurred. With osteoporosis, that is the whole job — and it saves bones, independence, and lives.',
              ].join('\n\n'),
            },
            {
              id: 'op-s11-reflection-1',
              type: 'reflection',
              prompt:
                'Mateo stopped a rushed transfer in one moment, and stopped a well-meaning lift in another — opposite actions for the same goal. How did "protect the fragile bone" guide both decisions?',
              minCharacters: 50,
            },
            {
              id: 'op-s11-reflection-2',
              type: 'reflection',
              prompt:
                'The careful transfer took two extra minutes. Why is that time so worth it for a resident with severe osteoporosis, and how should a CNA handle pressure to rush?',
              minCharacters: 50,
            },
            {
              id: 'op-s11-rp-text',
              type: 'text',
              body: 'Reflect on the case study in the previous lesson. Your written responses help you apply what you learned about gentle correct handling as fracture prevention, recognizing a hip fracture, and never moving a suspected fracture.',
            },
            {
              id: 'op-s11-kc2-check',
              type: 'knowledge_check',
              question:
                'A CNA does not give or adjust osteoporosis medications, and does not interpret bone scans. When a resident with osteoporosis asks for more bone medication, the CNA SHOULD:',
              options: [
                {
                  id: 'give-medication',
                  label: 'Give extra bone medication as the resident requests',
                },
                {
                  id: 'report-nurse',
                  label: 'Report the concern to the nurse and let the nurse decide',
                },
                {
                  id: 'interpret-scan',
                  label: 'Review the resident\'s bone scan results to decide',
                },
                {
                  id: 'adjust-dose',
                  label: 'Adjust the medication dose based on the resident\'s request',
                },
              ],
              correctOptionId: 'report-nurse',
              explanation:
                'You never give or adjust osteoporosis medications and do not interpret bone scans — but your reporting of medication concerns, missed doses, swallowing trouble, and fracture signs supports every treatment the team provides.',
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
            { id: 'op-s12-heading', type: 'heading', level: 1, text: 'Conclusion' },
            {
              id: 'op-s12-video',
              type: 'video',
              title: 'Conclusion',
              videoUrl: `${ASSET_BASE}/s12-conclusion.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s12-conclusion.mp4`,
            },
            {
              id: 'op-s12-image',
              type: 'image',
              src: `${ASSET_BASE}/s12-hero.jpg`,
              caption: 'Five things that matter most in osteoporosis care.',
            },
            {
              id: 'op-s12-narration',
              type: 'text',
              body: [
                'You\'ve reached the end. Let\'s lock in the five things that matter most for osteoporosis care.',
                '**One.** Osteoporosis makes bones thin, brittle, and easy to break — and it\'s silent, causing no symptoms until a bone fractures. So we assume fragility in older residents and protect their bones proactively.',
                '**Two.** Bones can break with little force. A minor fall, a hard bump, a rough transfer — and in severe cases even a cough or turning in bed — can fracture a fragile bone. This is why every movement you make with these residents is a chance to protect a bone or break one.',
                '**Three.** Prevent fractures with fall prevention and gentle handling. Clear pathways, safe footwear, close support, working brakes — and slow, supported, correct transfers with no pulling or yanking of fragile limbs. For osteoporosis, this is the front-line treatment, and it\'s your work.',
                '**Four.** Respond correctly to a possible fracture. After a fall — or with new unexplained pain even without a fall — don\'t move the resident unnecessarily. Keep them still, support the area gently, and get help immediately. Watch for hip fracture signs: severe pain, can\'t bear weight, a leg shorter and turned outward.',
                '**Five.** Honor your scope. You never diagnose, give or adjust bone medication, or read scans. But you deliver the gentle handling and fall prevention that prevent fractures, you respond correctly when one may have happened, and you support bone-healthy care — protecting independence and lives.',
              ].join('\n\n'),
            },
            {
              id: 'op-s12-summary',
              type: 'summary',
              title: 'Five things that matter most',
              items: [
                'Osteoporosis makes bones thin, brittle, and easy to break — and it\'s silent until a bone fractures.',
                'Bones can break with little force — every movement is a chance to protect a bone or break one.',
                'Prevent fractures with fall prevention and gentle handling — the front-line treatment.',
                'Respond correctly to a possible fracture — keep them still and get help immediately.',
                'Honor your scope — gentle handling, fracture response, and faithful reporting.',
              ],
            },
            {
              id: 'op-s12-whn-text',
              type: 'text',
              body: 'Ten questions are waiting. Everything on them was covered here. You\'re ready. Trust what you\'ve learned, and show what you know.',
            },
            {
              id: 'op-s12-completion-text',
              type: 'text',
              body: 'This course provides one hour of continuing education credit through CAL ACE Nursing Academy, an approved CDPH continuing education provider, NAC number 7384. Your certificate is generated automatically when you pass the knowledge check.',
            },
            {
              id: 'op-s12-completion-callout',
              type: 'callout',
              variant: 'info',
              title: 'Scope reminder',
              body: 'CNAs prevent, protect, and respond. CNAs do not diagnose osteoporosis, give or adjust medications, or interpret bone scans.',
            },
            {
              id: 'op-s12-certificate-text',
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

export async function seedCourse30Osteoporosis(
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
  console.log(`Seeding Course 30 (Osteoporosis) as DRAFT — slug "${COURSE_SLUG}"…`);

  try {
    const result = await seedCourse30Osteoporosis(prisma);
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
