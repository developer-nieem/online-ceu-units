/**
 * Seed Course 39 — Wound Observation & Basic Skin Care (DRAFT).
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-39-wound-observation
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
const COURSE_SLUG = 'wound-observation';
const COURSE_TITLE = 'Skin Integrity, Wound Changes, and Basic Care Support';
const COURSE_SUMMARY =
  'Learn the CNA\'s role in wound observation and basic skin care — recognizing common wound types in elders (skin tears, pressure injuries, diabetic and circulation wounds, surgical wounds), describing what you see accurately, protecting fragile aging skin, supporting healing conditions, and recognizing wound infection and bleeding emergencies. CNAs do not diagnose wounds, perform wound treatment, select or change dressings, or assess wounds clinically.';

const ASSET_BASE = `/assets/courses/wound-observation`;


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
    'Recognize the common wound types.',
    'Describe a wound accurately.',
    'Protect fragile aging skin.',
    'Recognize infection and bleeding emergencies.',
    'Know your scope — what a CNA does, and what a CNA must never do.',
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
  heroImage: '/assets/courses/wound-observation/hero-banner.png',
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
    title: 'Understanding Wound Observation & Skin Care',
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: 'Introduction',
        sortOrder: 0,
        buildContent: () =>
          doc('Welcome', [
            { id: 'wo-s01-heading', type: 'heading', level: 1, text: 'Welcome' },
            {
              id: 'wo-s01-video',
              type: 'video',
              title: 'Introduction',
              videoUrl: '/assets/courses/wound-observation/s01-intro.mp4',
              placeholderNote:
                'Pending upload: /assets/courses/wound-observation/s01-intro.mp4',
            },
            {
              id: 'wo-s01-image',
              type: 'image',
              src: `${ASSET_BASE}/s01-hero.jpg`,
              caption:
                'Wound observation — your sharp eyes and clear reports help wounds heal and catch trouble early.',
            },
            {
              id: 'wo-s01-narration',
              type: 'text',
              body: [
                'Welcome to CAL ACE Nursing Academy.',
                'This course is about wound observation and basic skin care — and it builds on what you learned about pressure injuries to cover the whole picture of skin and wounds in older adults.',
                'Skin is the body\'s largest organ and its first line of defense — a barrier that keeps germs out and moisture in. In older adults, that barrier becomes fragile: aging skin is thinner, drier, less elastic, slower to heal, and more easily torn, bruised, and broken down. So the residents you care for have skin that needs gentle protection, and wounds that, once they happen, heal slowly and are quick to become infected. Good skin care and sharp wound observation are everyday, essential parts of caregiving.',
                'You\'ll meet the common wounds of elder care. Skin tears — when fragile skin pulls or peels away, often from a small bump or even routine handling. Pressure injuries — which you\'ve studied. Diabetic and circulation-related wounds — especially on the legs and feet, which heal poorly and are dangerous. Surgical wounds — healing incisions that need watching. Bruises and minor injuries. Each tells its own story, and your eyes are often the first to see it.',
                'Here\'s the heart of your role, and the line that runs through this entire course: you observe, describe, protect, and report — you do not diagnose, treat, or dress wounds. That\'s not a limitation; it\'s a precise and vital job. The nurse and wound team assess and treat. But they rely completely on what you see and report — because you\'re the one with eyes on that skin every day. A wound described accurately and reported promptly gets treated early; a wound missed or vaguely reported gets worse. Your careful observation is the foundation the whole wound team builds on.',
                'This course also teaches the skin care that prevents wounds in the first place — gentle handling, moisturizing, keeping skin clean and dry, protecting fragile areas — and the two things you must always recognize: a wound that\'s becoming infected, and the bleeding that becomes an emergency.',
                'Your scope is clear. A CNA observes and accurately describes wounds, protects fragile skin, supports healing conditions, recognizes infection and bleeding emergencies, and reports faithfully. A CNA does not diagnose wounds, does not perform wound treatment, does not select or change dressings, and does not clinically assess or stage wounds.',
                'By the end of this course, you will be able to: recognize the common wound types. Describe a wound accurately. Protect fragile aging skin. Recognize infection and bleeding emergencies. And know your scope.',
                'There is a ten-question knowledge check at the end. Everything on it is covered here. Let\'s begin.',
              ].join('\n\n'),
            },
            {
              id: 'wo-s01-ci-text',
              type: 'text',
              body: [
                'This course teaches the CNA\'s role in wound observation and basic skin care — recognizing common wound types in elders, describing what you see accurately, protecting fragile aging skin, supporting healing conditions, and recognizing wound infection and bleeding emergencies.',
                'Let\'s be clear about your role. A CNA observes and accurately describes wounds, protects fragile skin, supports healing conditions, recognizes infection and bleeding emergencies, and reports faithfully. A CNA does not diagnose wounds, does not perform wound treatment, does not select or change dressings, and does not clinically assess or stage wounds. Those are nursing and wound-team tasks. But none of them can happen without your careful observation and faithful reporting first.',
              ].join('\n\n'),
            },
            {
              id: 'wo-s01-ci-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of this course',
              body: 'CNAs OBSERVE, DESCRIBE, PROTECT, and REPORT. CNAs do not diagnose wounds, treat wounds, select or change dressings, or clinically assess or stage wounds.',
            },
            {
              id: 'wo-s01-lo-text',
              type: 'text',
              body: 'By the end of this course, you will be able to:',
            },
            {
              id: 'wo-s01-lo-summary',
              type: 'summary',
              title: 'Learning objectives',
              items: [
                'Recognize the common wound types.',
                'Describe a wound accurately.',
                'Protect fragile aging skin.',
                'Recognize infection and bleeding emergencies.',
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
            { id: 'wo-s02-heading', type: 'heading', level: 1, text: 'Key terms' },
            {
              id: 'wo-s02-image',
              type: 'image',
              src: `${ASSET_BASE}/s02-hero.jpg`,
              caption:
                'Key terms — skin tear, pressure injury, surgical wound, drainage, infection signs.',
            },
            {
              id: 'wo-s02-reveal-wound',
              type: 'reveal_card',
              frontTitle: 'Wound',
              frontBody: 'Wound',
              backTitle: 'Wound',
              backBody:
                'Any break or damage in the skin — a cut, tear, scrape, sore, surgical incision, or deeper injury. In older adults, wounds heal slowly and infect easily, so every wound deserves attention, gentle care, and accurate reporting.',
            },
            {
              id: 'wo-s02-reveal-skin-tear',
              type: 'reveal_card',
              frontTitle: 'Skin Tear',
              frontBody: 'Skin tear',
              backTitle: 'Skin Tear',
              backBody:
                'A wound where fragile skin is pulled, sheared, or peeled away — often from a bump, a grab, tape removal, or even routine handling. Skin tears are extremely common in elders because aging skin is thin and loosely attached. Gentle handling prevents most of them.',
            },
            {
              id: 'wo-s02-reveal-fragile-skin',
              type: 'reveal_card',
              frontTitle: 'Fragile (Aging) Skin',
              frontBody: 'Fragile aging skin',
              backTitle: 'Fragile (Aging) Skin',
              backBody:
                'Skin that, with age, has become thinner, drier, less elastic, and more loosely attached — so it tears, bruises, and breaks down far more easily, and heals more slowly. Understanding fragile skin shapes how gently you must handle every resident.',
            },
            {
              id: 'wo-s02-reveal-surgical-wound',
              type: 'reveal_card',
              frontTitle: 'Surgical Wound / Incision',
              frontBody: 'Surgical wound',
              backTitle: 'Surgical Wound / Incision',
              backBody:
                'A wound made during surgery, healing closed — often with stitches, staples, or surgical glue, and sometimes a dressing. It\'s watched for healing versus infection, and protected. CNAs observe and report; the nurse manages the incision care.',
            },
            {
              id: 'wo-s02-reveal-vascular-diabetic',
              type: 'reveal_card',
              frontTitle: 'Vascular & Diabetic Wounds',
              frontBody: 'Vascular and diabetic wounds',
              backTitle: 'Vascular & Diabetic Wounds',
              backBody:
                'Wounds, usually on the legs and feet, caused by poor circulation or by diabetes damaging vessels and nerves. They heal slowly, can be serious, and a small foot sore in a diabetic resident can become limb-threatening — so they\'re reported promptly and never dismissed.',
            },
            {
              id: 'wo-s02-reveal-drainage',
              type: 'reveal_card',
              frontTitle: 'Drainage (Exudate)',
              frontBody: 'EX-yoo-date',
              backTitle: 'Drainage (Exudate)',
              backBody:
                'Fluid coming from a wound. A small amount of clear or pale fluid can be normal in healing. But thick, cloudy, yellow, green, or foul-smelling drainage suggests infection. Describing the drainage accurately is key wound observation.',
            },
            {
              id: 'wo-s02-reveal-infection',
              type: 'reveal_card',
              frontTitle: 'Wound Infection',
              frontBody: 'Wound infection',
              backTitle: 'Wound Infection',
              backBody:
                'When germs invade a wound — shown by increasing redness around it, warmth, swelling, increasing pain, pus or foul drainage, and the wound worsening instead of healing. Body-wide signs like fever or new confusion mean it may be spreading. Infection is reported promptly.',
            },
            {
              id: 'wo-s02-reveal-observe-describe',
              type: 'reveal_card',
              frontTitle: 'Observe & Describe (Not Diagnose)',
              frontBody: 'Observe and describe',
              backTitle: 'Observe & Describe (Not Diagnose)',
              backBody:
                'The CNA\'s core wound skill: reporting exactly what you see — the location, the size, the color, whether it\'s open, and the drainage — without naming, diagnosing, staging, or treating it. Accurate description is what the nurse needs; diagnosis is the nurse\'s job.',
            },
            {
              id: 'wo-s02-kc1-check-skin-tear',
              type: 'knowledge_check',
              question: 'Match the term: fragile skin pulled or peeled away, very common in elders',
              options: [
                { id: 'skin-tear', label: 'Skin tear' },
                { id: 'drainage-exudate', label: 'Drainage (exudate)' },
                { id: 'observe-describe', label: 'Observe & describe' },
              ],
              correctOptionId: 'skin-tear',
              explanation:
                'Skin tear. A wound where fragile skin is pulled, sheared, or peeled away — often from a bump, a grab, tape removal, or even routine handling. Skin tears are extremely common in elders because aging skin is thin and loosely attached.',
              requiredForCompletion: true,
            },
            {
              id: 'wo-s02-kc1-check-drainage',
              type: 'knowledge_check',
              question:
                'Match the term: fluid from a wound; thick/foul kind suggests infection',
              options: [
                { id: 'skin-tear', label: 'Skin tear' },
                { id: 'drainage-exudate', label: 'Drainage (exudate)' },
                { id: 'observe-describe', label: 'Observe & describe' },
              ],
              correctOptionId: 'drainage-exudate',
              explanation:
                'Drainage (exudate). Fluid coming from a wound. A small amount of clear or pale fluid can be normal in healing. But thick, cloudy, yellow, green, or foul-smelling drainage suggests infection.',
              requiredForCompletion: true,
            },
            {
              id: 'wo-s02-kc1-check-observe-describe',
              type: 'knowledge_check',
              question:
                'Match the term: report exactly what you see, without diagnosing or staging',
              options: [
                { id: 'skin-tear', label: 'Skin tear' },
                { id: 'drainage-exudate', label: 'Drainage (exudate)' },
                { id: 'observe-describe', label: 'Observe & describe' },
              ],
              correctOptionId: 'observe-describe',
              explanation:
                'Observe & describe. The CNA\'s core wound skill: reporting exactly what you see — the location, the size, the color, whether it\'s open, and the drainage — without naming, diagnosing, staging, or treating it.',
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
            { id: 'wo-s03-heading', type: 'heading', level: 1, text: 'Statistics' },
            pendingAudio(
              'wo-s03-audio',
              'Wounds and Fragile Skin: An Everyday Reality of Elder Care',
              `${ASSET_BASE}/s03-stats-podcast.mp3`,
              [
                'Wounds and Fragile Skin: An Everyday Reality of Elder Care',
                '',
                'Skin problems and wounds are among the most common issues in long-term care, for a simple reason: aging skin is fragile. With age, skin thins, loses fat and elasticity, dries out, and attaches less firmly to the layers beneath — so it tears, bruises, and breaks down from forces that wouldn\'t mark younger skin, and it repairs itself far more slowly. The residents you care for live in skin that is, in a real sense, easily injured and slow to heal.',
                '',
                'Skin tears alone are remarkably common. Studies in elder-care settings find skin tears occurring at rates comparable to or even exceeding pressure injuries — hundreds of thousands of them a year across care settings — and most happen during ordinary daily activities and routine care: a bump against furniture, a grip on a fragile arm during a transfer, the removal of adhesive tape. The striking implication is that gentle technique by caregivers prevents a large share of them.',
                '',
                'Chronic wounds are also widespread and serious. Pressure injuries you\'ve studied. Beyond them, diabetic foot ulcers and poor-circulation leg wounds affect many older residents and are genuinely dangerous — diabetic foot wounds are a leading path to lower-limb amputation, and they often begin as a small sore that healed poorly and went unnoticed. Surgical wounds need watching as more residents return from procedures. And all of these share two features that make the CNA\'s role critical: in older adults, wounds heal slowly — over weeks to months — and they become infected easily, with infections that can spread to bone or bloodstream and become life-threatening.',
                '',
                'Here is where the numbers point straight at the CNA. Because you have eyes and hands on residents\' skin every single day, you are the early-warning system for the entire wound team. You\'re the one who notices the new skin tear, the foot sore that wasn\'t there yesterday, the surgical incision starting to redden, the drainage changing color. Research on wound outcomes consistently shows that early detection and prompt reporting dramatically improve healing and reduce complications — and that prevention through gentle handling and good skin care reduces wounds in the first place. The nurse treats; the CNA sees first.',
                '',
                'The bottom line: fragile skin and slow-healing, easily-infected wounds are an everyday reality of elder care — and the CNA\'s gentle handling, daily observation, and prompt, accurate reporting are what protect residents from the worst of it.',
              ].join('\n'),
              '/assets/courses/wound-observation/s03-stats-podcast.mp3',
            ),
            {
              id: 'wo-s03-image',
              type: 'image',
              src: `${ASSET_BASE}/s03-hero.jpg`,
              caption:
                'Wounds are common in care — careful observation and accurate reporting make the difference.',
            },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: 'Fundamentals',
        sortOrder: 3,
        buildContent: () =>
          doc('Fundamentals', [
            { id: 'wo-s04-heading', type: 'heading', level: 1, text: 'Fundamentals' },
            {
              id: 'wo-s04-video',
              type: 'video',
              title: 'Fundamentals',
              videoUrl: '/assets/courses/wound-observation/s04-fundamentals.mp4',
              placeholderNote:
                'Pending upload: /assets/courses/wound-observation/s04-fundamentals.mp4',
            },
            {
              id: 'wo-s04-image',
              type: 'image',
              src: `${ASSET_BASE}/s04-hero.jpg`,
              caption:
                'How skin and wounds change with age, and why fragile skin tears so easily.',
            },
            {
              id: 'wo-s04-narration',
              type: 'text',
              body: [
                '**Skin: the body\'s barrier**',
                'Skin is the body\'s largest organ and its first defense — a barrier that keeps germs and water out, holds moisture in, senses the world, and helps control temperature. As long as skin is intact, it protects everything beneath it. Every wound is a break in that defense, an open door — which is why protecting skin and caring for wounds matters so much.',
                '**Why aging skin is fragile**',
                'With age, skin changes in ways that make it vulnerable. It thins. It loses the fatty cushion beneath it. It dries out and loses elasticity. It attaches less firmly to the layers below. Blood flow to it decreases. The result: skin that tears from a small bump, bruises from a light knock, breaks down under modest pressure or moisture, and heals slowly when injured. Knowing this changes how gently you handle every resident.',
                '**The common wounds, briefly**',
                'A few wound types make up most of what you\'ll see. Skin tears — fragile skin pulled or peeled away, the most common, often from handling. Pressure injuries — from sustained pressure, which you\'ve studied. Diabetic and circulation wounds — usually on legs and feet, slow-healing and dangerous. Surgical wounds — healing incisions. And bruises and minor injuries. Recognizing each helps you describe it accurately.',
                '**Why elder wounds are dangerous**',
                'Two features make wounds in older adults serious. First, they heal slowly — reduced blood flow, thinner skin, and other conditions mean weeks to months, sometimes never fully. Second, they infect easily — fragile, slow-healing skin and weaker defenses let germs take hold, and an infection can spread to deeper tissue, to bone, or to the bloodstream, becoming life-threatening. A small wound is never automatically a minor wound in an elder.',
                '**The CNA\'s core skill: observe and describe**',
                'Here\'s the precise, vital role this course centers on. You are the daily eyes on the skin — so you observe wounds carefully and describe them accurately: where it is, how big, what color, whether the skin is open, and what any drainage looks like. You report that description promptly. What you do NOT do is name the wound, diagnose it, stage it, or treat it — that\'s the nurse\'s job. Think of yourself as the reporter, not the doctor: an accurate report is exactly what the team needs from you.',
                '**Why your observation is the foundation**',
                'The wound team can only treat what they know about, and in between their assessments, you\'re the one watching. You catch the new wound the day it appears, the change in an existing one, the first signs of infection. A wound seen early and described well gets treated early and heals better; a wound missed or vaguely reported gets worse. Your daily observation is the foundation the entire treatment plan stands on — which is why accuracy and promptness matter so much.',
                '**Prevention and protection: still the best medicine**',
                'As with pressure injuries, the best wound is the one that never happens. Gentle handling that doesn\'t tear fragile skin, moisturizing dry skin, keeping skin clean and dry, protecting bony and fragile areas, supporting nutrition and hydration — these prevent wounds. And once a wound exists, protecting it and supporting the body\'s healing conditions help it close. Prevention and protection are squarely, daily, in your hands.',
              ].join('\n\n'),
            },
            {
              id: 'wo-s04-elder-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'In an elder, a small wound is never automatically minor',
              body: 'Elder wounds heal slowly and infect easily. Observe carefully, describe accurately, and report promptly — you do not diagnose, stage, or treat.',
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
            { id: 'wo-s05-heading', type: 'heading', level: 1, text: 'Signs & Symptoms' },
            {
              id: 'wo-s05-image',
              type: 'image',
              src: `${ASSET_BASE}/s05-hero.jpg`,
              caption:
                'Recognizing trouble — spreading redness, warmth, foul drainage, and fever signal infection.',
            },
            {
              id: 'wo-s05-narration',
              type: 'text',
              body: [
                'Your job is to see wounds clearly and describe them well. Let\'s learn how to observe — and the signs that matter most.',
                '**How to describe a wound**',
                'When you find or check a wound, observe it like a reporter gathering facts. Where is it — the exact body location? How big — roughly, in everyday terms? What color is the wound and the skin around it — red, pink, pale, dark, purple? Is the skin intact, or open? Is there drainage — and if so, how much, what color, and does it smell? Is there swelling, warmth, or odor? Is it painful? You don\'t have to name or judge it — you describe these facts accurately and report them. A clear description like "a half-inch open skin tear on the left forearm with a small amount of clear drainage, skin flap still attached" tells the nurse exactly what they need.',
                '**Healing versus not healing**',
                'Know roughly what good looks like so you can spot bad. A healing wound generally trends better over time — getting smaller, with the surrounding redness settling, drainage decreasing, and pain easing. A wound in trouble does the opposite: getting larger or deeper, more red, more painful, more drainage, or simply not improving over time. Surgical incisions should gradually close and calm down. So the key question for any known wound is: is it trending better or worse? Report wounds that aren\'t improving, or are worsening.',
                '**The signs of wound infection**',
                'This is the watch that protects residents most. Signs a wound is infected: increasing redness spreading around and beyond the wound edges. Warmth around it. Swelling. Increasing pain. Pus, or thick, cloudy, yellow, green, or foul-smelling drainage. The wound looking worse rather than better. And body-wide signs that infection is spreading: fever or chills, and in frail elders, new confusion or feeling unwell, which can mean the infection has reached the blood. Wound infection signs are reported promptly — and the spreading, body-wide signs, urgently.',
                '**The diabetic and circulation foot watch**',
                'Give special vigilance to the feet and legs of diabetic and poor-circulation residents. A small sore, blister, callus, crack, or red spot on a diabetic foot — which the resident may not feel — can become serious and even limb-threatening if it goes unnoticed and untreated. So inspect those feet carefully and daily, and report any new sore, color change, coolness, or wound immediately, no matter how small. On these residents, "small" is never the same as "minor." Your eyes on their feet genuinely prevent amputations.',
                '**Summary**',
                'Four pictures. Describing: location, size, color, open or intact, drainage, smell, pain — facts, not diagnoses. Healing vs not: trending smaller and calmer is good; larger, redder, more drainage, or not improving is reported. Infection: spreading redness, warmth, pus, foul drainage, fever, new confusion — report promptly, escalate the body-wide signs. Diabetic feet: any sore, however small, reported immediately.',
                'The rule underneath it all: observe every wound like a careful reporter, describe it accurately without diagnosing, know that worsening and infection signs get reported promptly, and treat any diabetic foot wound as urgent.',
              ].join('\n\n'),
            },
            {
              id: 'wo-s05-infection-callout',
              type: 'callout',
              variant: 'warning',
              title: 'Wound infection and diabetic feet',
              body: 'Spreading redness, foul drainage, fever, and new confusion need urgent reporting. On diabetic feet, any sore — however small — is reported immediately.',
            }
          ]),
      },
      {
        slug: 's06-causes',
        title: 'Causes',
        sortOrder: 5,
        buildContent: () =>
          doc('Causes', [
            { id: 'wo-s06-heading', type: 'heading', level: 1, text: 'Causes' },
            pendingAudio(
              'wo-s06-audio',
              'What Causes Wounds in Elders — and What Slows Healing?',
              `${ASSET_BASE}/s06-causes-podcast.mp3`,
              [
                'What Causes Wounds in Elders — and What Slows Healing?',
                '',
                'In older adults, most wounds trace back to the same root: fragile skin meeting everyday forces. Because aging skin is thin, dry, loosely attached, and poorly cushioned, it gives way to forces that healthy skin would shrug off — and many of those forces happen during ordinary care.',
                '',
                'Skin tears, the most common wound, are a clear example. They happen from bumps against furniture, bed rails, and wheelchairs; from grabbing or gripping a fragile arm during a transfer instead of supporting it; from friction and dragging across sheets; and from removing adhesive tape or dressings too quickly, which peels the fragile skin away with them. The striking truth is that a large share of skin tears are caused during handling — which means a large share are preventable through gentle technique, careful transfers, padding hazards, and protecting fragile limbs.',
                '',
                'Pressure injuries you know — sustained pressure cutting off blood flow. Diabetic and circulation wounds come from the inside: diabetes damages the nerves and vessels of the feet, so a resident doesn\'t feel an injury and it doesn\'t get blood to heal; poor circulation in the legs starves the skin and causes slow-healing wounds. These often start tiny and unnoticed, which is why daily foot inspection matters so much. Bruises come from fragile vessels under thin skin, marking from light knocks. And moisture from incontinence or sweat macerates and weakens skin until it breaks.',
                '',
                'Then there\'s the other half of the story: what slows healing once a wound exists. Poor blood flow — the wound can\'t get the oxygen and nutrients to repair. Poor nutrition and dehydration — the body lacks the building blocks; low protein especially stalls healing. Diabetes and high blood sugar — slow healing and feed infection. Continued pressure or friction on the wound. Moisture and contamination. Infection itself. And simply the slower repair of aging tissue. Many of these — nutrition, hydration, keeping pressure and moisture off, keeping the area clean — are things daily care influences.',
                '',
                'Here\'s the CNA takeaway. Most elder wounds come from fragile skin plus everyday force, and much of that force occurs during handling — so gentle technique prevents wounds. And healing depends heavily on conditions the CNA supports: nutrition, hydration, cleanliness, and keeping pressure and moisture off the wound. You can\'t change a resident\'s age or diabetes, but you powerfully affect whether wounds happen and whether they heal.',
              ].join('\n'),
              '/assets/courses/wound-observation/s06-causes-podcast.mp3',
            ),
            {
              id: 'wo-s06-image',
              type: 'image',
              src: `${ASSET_BASE}/s06-hero.jpg`,
              caption:
                'What to observe and describe — location, size, drainage color and amount, and odor.',
            },
          ]),
      },
      {
        slug: 's07-role',
        title: 'CNA Role & Best Practices',
        sortOrder: 6,
        buildContent: () =>
          doc('CNA Role & Best Practices', [
            { id: 'wo-s07-heading', type: 'heading', level: 1, text: 'CNA Role & Best Practices' },
            {
              id: 'wo-s07-image',
              type: 'image',
              src: `${ASSET_BASE}/s07-hero.jpg`,
              caption:
                'CNA scope — observe, protect, and report accurately; never assess, stage, or treat the wound.',
            },
            {
              id: 'wo-s07-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of practice',
              body: 'CNAs OBSERVE, DESCRIBE, PROTECT, and REPORT. CNAs never diagnose wounds, treat wounds, clean or pack wounds beyond policy, or select or change dressings unless specifically trained and permitted.',
            },
            {
              id: 'wo-s07-narration',
              type: 'text',
              body: [
                'Wound treatment belongs to the nurse and the wound team — and the CNA\'s role around it is observation, protection, and support, delivered every day. Let\'s walk through it, starting with the rule that never bends, stated firmly because it matters most here. A CNA does not diagnose wounds, does not perform wound treatment, does not clean, pack, or treat wounds beyond facility policy, and does not select, apply, change, or remove wound dressings unless specifically trained and permitted by facility policy. Treatment is the nurse\'s. Your role is observe, describe, protect, support, and report.',
                '**Observe and describe — your central contribution.** Watch the skin and wounds every day, and describe accurately what you see — location, size, color, open or intact, drainage, odor, swelling, pain — without naming, diagnosing, or staging. Report new wounds promptly and changes in existing ones. This accurate observation is the single most valuable thing you give the wound team.',
                '**Protect the wound and the dressing.** Keep dressings clean, dry, and intact, and report a dressing that\'s loose, soaked, soiled, or fallen off — rather than re-taping or replacing it yourself unless that\'s within your trained role. Keep pressure and friction off wounds, position to offload them, and protect the area during care, transfers, and dressing. Don\'t let a wound get wet against the plan, and never pick at, scrub, or disturb a wound or its dressing.',
                '**Support the conditions for healing.** Much of what helps a wound heal is daily CNA work: support good nutrition and hydration and report poor intake, because the body needs building blocks to repair; keep skin clean and dry and manage moisture; relieve pressure; keep blood-sugar-related and foot-care routines for diabetic residents; and follow the care plan around the wound. You don\'t treat the wound — but you create the conditions it needs to close.',
                '**Protect fragile skin to prevent wounds.** Prevention is treatment too. Handle gently and support fragile limbs rather than gripping them; transfer carefully without dragging; pad and protect bony and vulnerable areas and hazards like bed rails; remove tape and adhesives slowly and gently, or use the gentler products provided; moisturize dry skin as directed; and keep nails and environment safe. Gentle technique prevents the skin tears and injuries that would otherwise need treating.',
                '**Medications.** The nurse manages all wound-related medications — topical treatments, antibiotics for infection, pain medication. Your part: report pain and whether it\'s controlled, report infection signs so antibiotics can be started, and never apply medications or treatments to a wound on your own.',
                'The scope point for this section: you never treat, dress, or diagnose the wound — but you observe and describe it expertly, protect it and the dressing, support the body\'s healing, prevent new wounds through gentle care, and report everything. The team treats the wound; you watch over it and the resident every day.',
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
            { id: 'wo-s08-heading', type: 'heading', level: 1, text: 'Prevention & Risk Reduction' },
            {
              id: 'wo-s08-image',
              type: 'image',
              src: `${ASSET_BASE}/s08-hero.jpg`,
              caption:
                'Protecting fragile skin — gentle handling, moisture control, and preventing new tears.',
            },
            {
              id: 'wo-s08-narration',
              type: 'text',
              body: [
                'Most wounds in elders are preventable, and protecting fragile skin is daily CNA work. Here are seven ways.',
                '**One. Handle fragile skin gently — always.** Support limbs fully rather than gripping or grabbing them, move slowly, and never pull, drag, or yank. So many skin tears happen during routine handling that gentle technique alone prevents a great many wounds. Treat every resident\'s skin as the fragile barrier it is.',
                '**Two. Transfer and move without dragging.** Use proper technique and lift sheets to move residents, never sliding or dragging them across sheets, which shears and tears skin. Careful, supported transfers protect both the skin and the deeper tissue. Friction is a wound waiting to happen — eliminate it.',
                '**Three. Pad and protect the hazards and fragile areas.** Pad bed rails, wheelchair edges, and sharp corners; protect thin-skinned forearms and shins, which tear easily; and keep the environment clear so residents don\'t bump or scrape. Long sleeves or protective sleeves can guard fragile arms where the plan allows. Remove the things skin tears against.',
                '**Four. Remove tape and adhesives gently.** Adhesive removal is a leading cause of skin tears. Remove tape, dressings, and adhesives slowly, supporting the skin, peeling low and back rather than yanking up, and using the gentle removers or silicone products provided. A careful thirty seconds prevents a painful tear.',
                '**Five. Moisturize and manage moisture.** Keep dry skin moisturized as directed — well-moisturized skin is more supple and tears less. And at the same time, keep skin clean and dry where moisture pools, changing promptly after incontinence and managing sweat, because wet skin breaks down. Balanced skin — moisturized but not macerated — is resilient skin.',
                '**Six. Inspect daily — especially diabetic feet.** Make skin inspection part of every task, and give special, daily attention to the feet of diabetic and poor-circulation residents, who may not feel a developing sore. Catching a new skin tear, bruise, or foot sore early — and reporting it — is half of prevention. Eyes on the skin, every day.',
                '**Seven. Support nutrition and hydration.** Well-nourished, well-hydrated skin resists injury and heals faster; poorly nourished skin is fragile and slow to repair. Encourage meals and fluids within each plan, help residents eat, and report poor intake and weight loss. Good nutrition is invisible wound prevention working from the inside.',
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
            { id: 'wo-s09-heading', type: 'heading', level: 1, text: 'Scenario & Reporting' },
            pendingAudio(
              'wo-s09-intro-audio',
              'Emergency response scenarios intro',
              `${ASSET_BASE}/s09-emergency-intro.mp3`,
              'With wounds, the judgments that matter most are recognizing a wound infection that\'s turning serious, and responding correctly to dangerous bleeding. You\'re about to work through two situations. Read each carefully, choose your action, and you\'ll get feedback right away. Keep the core ideas in mind: spreading redness with fever and new confusion is urgent — and bleeding that won\'t stop is an emergency where you apply pressure and get help.',
              '/assets/courses/wound-observation/s09-emergency-intro.mp3',
            ),
            {
              id: 'wo-s09-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-hero.jpg`,
              caption:
                'Two wound judgments — a bleeding skin tear to control now, and a wound turning infected.',
            },
            {
              id: 'wo-s09-scenario-nakamura-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-scenario-nakamura.jpg`,
              caption:
                'On blood thinners with a bleeding skin tear: apply firm direct pressure, elevate, call for help, and stay.',
            },
            {
              id: 'wo-s09-scenario-nakamura',
              type: 'scenario_question',
              prompt:
                'While helping Mr. Nakamura, who takes a blood thinner, you accidentally bump his fragile forearm and a skin tear opens — and it\'s bleeding more than you\'d expect, steadily soaking through the gauze you first placed. He\'s a bit anxious. A coworker says, "Let\'s go find the nurse and bring her back to look at it." What is the BEST first action?',
              options: [
                {
                  id: 'leave-find-nurse',
                  label: 'Leave the resident to go find the nurse',
                  feedback:
                    'Active bleeding, especially on a blood thinner, needs immediate control — firm direct pressure, elevation, and calling for help while staying with him. Leaving to find the nurse, wiping repeatedly, or waiting lets him keep bleeding and disrupts clotting. The right first action: apply firm direct pressure right away, elevate, call for help, and stay with him.',
                },
                {
                  id: 'pressure-elevate-help',
                  label:
                    'Apply firm, direct pressure to the bleeding site right away, keep it elevated, call for help, and stay with him',
                  feedback:
                    'Right. With active bleeding — especially in a resident on a blood thinner, who bleeds more and longer — the first action is to control the bleeding: apply firm, direct pressure to the site immediately, with gauze or a clean cloth, and keep the area raised if you can. Call out for help rather than leaving him alone and bleeding to go find someone. Maintain steady pressure — don\'t keep lifting it to peek, which disrupts clotting — and stay with him, keeping him calm. A skin tear on a blood thinner can bleed significantly, so this is treated seriously and fast. Control the bleeding first with pressure, get help to you, then the nurse manages the wound.',
                  isRecommended: true,
                },
                {
                  id: 'wipe-repeatedly',
                  label: 'Wipe the blood away repeatedly to see the wound better',
                  feedback:
                    'Active bleeding, especially on a blood thinner, needs immediate control — firm direct pressure, elevation, and calling for help while staying with him. Leaving to find the nurse, wiping repeatedly, or waiting lets him keep bleeding and disrupts clotting. The right first action: apply firm direct pressure right away, elevate, call for help, and stay with him.',
                },
                {
                  id: 'loose-dressing-wait',
                  label: 'Apply a loose dressing and wait to see if it stops on its own',
                  feedback:
                    'Active bleeding, especially on a blood thinner, needs immediate control — firm direct pressure, elevation, and calling for help while staying with him. Leaving to find the nurse, wiping repeatedly, or waiting lets him keep bleeding and disrupts clotting. The right first action: apply firm direct pressure right away, elevate, call for help, and stay with him.',
                },
              ],
              requiredForCompletion: true,
            },
            {
              id: 'wo-s09-scenario-adebayo-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-scenario-adebayo.jpg`,
              caption:
                'Spreading redness, foul drainage, fever, and new confusion: serious infection — report urgently.',
            },
            {
              id: 'wo-s09-scenario-adebayo',
              type: 'scenario_question',
              prompt:
                'Mrs. Adebayo has a slow-healing wound on her lower leg. Over the past two days it\'s clearly gotten worse: the redness has spread up her leg well beyond the wound, the area is warm and swollen, there\'s now thick yellow-green foul-smelling drainage, and today she has a fever and seems newly confused and unwell. What SHOULD the CNA do?',
              options: [
                {
                  id: 'routine-care-next-change',
                  label: 'Continue routine care and mention it at the next dressing change',
                  feedback:
                    'Spreading redness up the leg, foul drainage, fever, and new confusion point to a serious, possibly spreading wound infection — a sepsis risk, not a routine matter. Waiting, or treating it yourself (outside your scope), delays urgent care. The right action: report it to the nurse urgently with the full picture.',
                },
                {
                  id: 'report-urgently',
                  label:
                    'Report it to the nurse urgently — spreading redness with foul drainage, fever, and new confusion suggests a serious, possibly spreading infection',
                  feedback:
                    'Right. Spreading redness traveling up the leg, warmth, swelling, thick foul yellow-green drainage, fever, and new confusion together signal a wound infection that may be spreading into the body — which can become life-threatening sepsis, and in a leg wound raises concern for serious deep infection. This is urgent, not a next-dressing-change matter. Report it to the nurse urgently with the full picture. Do not clean or re-dress it yourself — wound treatment is outside your scope — and the fever and new confusion especially mean this needs prompt medical attention. Recognizing that a rapidly worsening, foul, spreading wound with fever and confusion is urgent is exactly the catch that gets her treated in time.',
                  isRecommended: true,
                },
                {
                  id: 'clean-redress-self',
                  label: 'Clean and re-dress the wound herself to help it',
                  feedback:
                    'Spreading redness up the leg, foul drainage, fever, and new confusion point to a serious, possibly spreading wound infection — a sepsis risk, not a routine matter. Waiting, or treating it yourself (outside your scope), delays urgent care. The right action: report it to the nurse urgently with the full picture.',
                },
                {
                  id: 'fluids-recheck',
                  label: 'Encourage fluids and recheck in a couple of days',
                  feedback:
                    'Spreading redness up the leg, foul drainage, fever, and new confusion point to a serious, possibly spreading wound infection — a sepsis risk, not a routine matter. Waiting, or treating it yourself (outside your scope), delays urgent care. The right action: report it to the nurse urgently with the full picture.',
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
            { id: 'wo-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
              id: 'wo-s10-video',
              type: 'video',
              title: "The CNA's Role",
              videoUrl: '/assets/courses/wound-observation/s10-cna-role.mp4',
              placeholderNote:
                'Pending upload: /assets/courses/wound-observation/s10-cna-role.mp4',
            },
            {
              id: 'wo-s10-image',
              type: 'image',
              src: `${ASSET_BASE}/s10-hero.jpg`,
              caption:
                'The CNA as the daily observer — every accurate wound report guides the nurse\'s care.',
            },
            {
              id: 'wo-s10-narration',
              type: 'text',
              body: [
                'Your role in wound and skin care is observe, protect, support, and report — a precise, vital job that the whole wound team depends on. Let\'s walk through it.',
                '**Observe and describe expertly** Be the daily eyes on the skin. Inspect at every opportunity, find wounds early, and describe them accurately — location, size, color, open or intact, drainage, odor, swelling, pain — reporting new wounds and changes promptly. Describe like a careful reporter: the facts, not a diagnosis or a stage. This accurate observation is your single most valuable contribution, because the team can only treat what they know about, and you\'re the one who sees first.',
                '**Protect skin and prevent wounds** Prevent the wounds you can. Handle fragile skin gently, support limbs rather than grip them, transfer without dragging, pad hazards, remove adhesives slowly, moisturize dry skin and manage moisture. So many wounds — especially skin tears — happen during handling that your gentle technique is direct, daily wound prevention. The skin you protect never becomes a wound to treat.',
                '**Protect existing wounds and support healing** Around an existing wound, do your part: keep dressings clean, dry, and intact and report problems rather than improvising; keep pressure, friction, and unwanted moisture off; and support the conditions for healing — nutrition, hydration, cleanliness, blood-sugar and foot routines for diabetic residents. You don\'t treat the wound, but you guard it and feed the body that has to heal it.',
                '**Recognize the urgencies and report** Know the two things you must catch. Infection — spreading redness, warmth, swelling, pus or foul drainage, a worsening wound, and the body-wide fever and new confusion that mean it\'s spreading — reported promptly, the body-wide signs urgently. And bleeding — control active bleeding with firm direct pressure and elevation, call for help, and stay with the resident, especially on a blood thinner. Report clearly and specifically throughout.',
                'Now the boundary, stated plainly because it defines this role. You do not diagnose wounds. You do not treat, clean, pack, or medicate wounds. You do not select, apply, change, or remove dressings unless specifically trained and permitted. And you describe what you see — you never assign it a name or a stage.',
                'Inside your role — observe and describe, protect and prevent, support healing, recognize and report the urgencies — you are the wound team\'s eyes and the resident\'s daily protection. The nurse treats the wound; you see it first, guard it, and care for the person around it every day.',
              ].join('\n\n'),
            },
            {
              id: 'wo-s10-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Stay within scope',
              body: 'You do not diagnose wounds, treat or medicate wounds, or select or change dressings unless specifically trained and permitted. Describe what you see accurately — never name, stage, or treat the wound.',
            }
          ]),
      },
      {
        slug: 's11-case-study',
        title: 'Case Study',
        sortOrder: 10,
        buildContent: () => {
          const caseNarrative = [
            'Mr. Halloran, 79, had diabetes with reduced feeling in his feet — a combination that, as his CNA Diego knew well, made a tiny foot wound a potentially limb-threatening event. Because Mr. Halloran couldn\'t reliably feel his feet, he wouldn\'t notice a sore himself. Diego had made daily foot inspection a fixed part of his care.',
            '',
            '**The find:** One morning, checking the soles of Mr. Halloran\'s feet as always, Diego noticed something new on the ball of the left foot: a small open sore, maybe a quarter-inch across, with a little drainage, that hadn\'t been there the day before. Mr. Halloran felt nothing and was surprised it was there. It would have been the easiest thing in the world to think "it\'s tiny, it\'s nothing." But Diego knew the rule from his training: on a diabetic foot, "small" is never the same as "minor."',
            '',
            '**Observing, not diagnosing:** Diego didn\'t try to figure out what kind of wound it was, didn\'t apply anything to it, didn\'t decide it was harmless. He observed it carefully and gathered the facts: a small open sore, about a quarter-inch, on the ball of the left foot, with a small amount of cloudy drainage, the surrounding skin slightly red, and Mr. Halloran unable to feel it. That was his job — describe what he saw, accurately.',
            '',
            '**What Diego did:** He reported it to the nurse promptly and precisely, exactly as observed: "New open sore on the ball of Mr. Halloran\'s left foot, about a quarter-inch, small amount of cloudy drainage, a little redness around it, and he can\'t feel it at all — it wasn\'t there yesterday." He didn\'t call it an "ulcer" or stage it or treat it; he described it and flagged it as a diabetic foot wound needing attention. He also kept pressure off the area and protected the foot while he waited.',
            '',
            '**The response:** Because Diego reported it the day it appeared, the nurse assessed it immediately and the wound team was engaged right away. A diabetic foot wound caught at a quarter-inch, on its first day, with prompt treatment and offloading, has a vastly better outcome than one found weeks later as a deep, infected ulcer. Mr. Halloran\'s wound was treated early, monitored closely, and healed — with his foot intact.',
            '',
            '**The contrast that makes the point:** The nurse made the stakes explicit to Diego afterward: "On a diabetic foot that can\'t feel, that quarter-inch sore is how amputations start. Found today, it\'s a small wound we treat and close. Found in three weeks, it\'s an infected ulcer down to the bone, and we\'re talking about losing the foot. The whole difference was you checking his feet every day and reporting it the morning it showed up." Diego\'s daily inspection and same-day report had, very literally, helped save a foot.',
            '',
            '**The outcome:** Mr. Halloran kept his foot and his mobility. And it happened because of the least dramatic care imaginable: a CNA who inspected diabetic feet every single day, recognized that no diabetic foot wound is ever "too small to matter," observed it accurately without overstepping into diagnosis or treatment, and reported it the moment he found it.',
            '',
            '**Discussion:** Diego\'s case distills the whole course. He knew his highest-risk resident and inspected accordingly — daily feet on a diabetic who couldn\'t feel them. He refused the "it\'s tiny, it\'s nothing" trap, knowing small diabetic foot wounds are limb-threatening. He observed and described accurately — size, drainage, redness, location, no sensation — without diagnosing, staging, or treating, which is precisely the CNA\'s role. He reported promptly and protected the foot while waiting. Every piece was squarely within scope, and together they turned a quarter-inch sore into a foot saved. Seeing first, describing well, and reporting fast — that\'s the power of wound observation.',
          ].join('\n');

          return doc('Case Study', [
            { id: 'wo-s11-heading', type: 'heading', level: 1, text: 'Case Study' },
            pendingAudio(
              'wo-s11-audio',
              'The Quarter-Inch That Mattered',
              `${ASSET_BASE}/s11-case-podcast.mp3`,
              caseNarrative,
              '/assets/courses/wound-observation/s11-case-podcast.mp3',
            ),
            {
              id: 'wo-s11-image',
              type: 'image',
              src: `${ASSET_BASE}/s11-hero.png`,
              caption:
                'Recognizing the pattern — how careful observation and clear reporting protected a resident.',
            },
            {
              id: 'wo-s11-case-study',
              type: 'case_study',
              title: 'The Quarter-Inch That Mattered',
              residentProfile:
                'Mr. Halloran, 79, had diabetes with reduced feeling in his feet — a combination that, as his CNA Diego knew well, made a tiny foot wound a potentially limb-threatening event. Because Mr. Halloran couldn\'t reliably feel his feet, he wouldn\'t notice a sore himself. Diego had made daily foot inspection a fixed part of his care.',
              scenario: [
                '**The find:** One morning, checking the soles of Mr. Halloran\'s feet as always, Diego noticed something new on the ball of the left foot: a small open sore, maybe a quarter-inch across, with a little drainage, that hadn\'t been there the day before. Mr. Halloran felt nothing and was surprised it was there. It would have been the easiest thing in the world to think "it\'s tiny, it\'s nothing." But Diego knew the rule from his training: on a diabetic foot, "small" is never the same as "minor."',
                '**Observing, not diagnosing:** Diego didn\'t try to figure out what kind of wound it was, didn\'t apply anything to it, didn\'t decide it was harmless. He observed it carefully and gathered the facts: a small open sore, about a quarter-inch, on the ball of the left foot, with a small amount of cloudy drainage, the surrounding skin slightly red, and Mr. Halloran unable to feel it. That was his job — describe what he saw, accurately.',
                '**What Diego did:** He reported it to the nurse promptly and precisely, exactly as observed: "New open sore on the ball of Mr. Halloran\'s left foot, about a quarter-inch, small amount of cloudy drainage, a little redness around it, and he can\'t feel it at all — it wasn\'t there yesterday." He didn\'t call it an "ulcer" or stage it or treat it; he described it and flagged it as a diabetic foot wound needing attention. He also kept pressure off the area and protected the foot while he waited.',
                '**The response:** Because Diego reported it the day it appeared, the nurse assessed it immediately and the wound team was engaged right away. A diabetic foot wound caught at a quarter-inch, on its first day, with prompt treatment and offloading, has a vastly better outcome than one found weeks later as a deep, infected ulcer. Mr. Halloran\'s wound was treated early, monitored closely, and healed — with his foot intact.',
                '**The contrast that makes the point:** The nurse made the stakes explicit to Diego afterward: "On a diabetic foot that can\'t feel, that quarter-inch sore is how amputations start. Found today, it\'s a small wound we treat and close. Found in three weeks, it\'s an infected ulcer down to the bone, and we\'re talking about losing the foot. The whole difference was you checking his feet every day and reporting it the morning it showed up." Diego\'s daily inspection and same-day report had, very literally, helped save a foot.',
                '**The outcome:** Mr. Halloran kept his foot and his mobility. And it happened because of the least dramatic care imaginable: a CNA who inspected diabetic feet every single day, recognized that no diabetic foot wound is ever "too small to matter," observed it accurately without overstepping into diagnosis or treatment, and reported it the moment he found it.',
                '**Discussion:** Diego\'s case distills the whole course. He knew his highest-risk resident and inspected accordingly — daily feet on a diabetic who couldn\'t feel them. He refused the "it\'s tiny, it\'s nothing" trap, knowing small diabetic foot wounds are limb-threatening. He observed and described accurately — size, drainage, redness, location, no sensation — without diagnosing, staging, or treating, which is precisely the CNA\'s role. He reported promptly and protected the foot while waiting. Every piece was squarely within scope, and together they turned a quarter-inch sore into a foot saved. Seeing first, describing well, and reporting fast — that\'s the power of wound observation.',
              ].join('\n\n'),
            },
            {
              id: 'wo-s11-reflection-1',
              type: 'reflection',
              prompt:
                'The sore was only a quarter-inch and Mr. Halloran couldn\'t feel it. Why did Diego treat it as urgent rather than minor, and why is daily foot inspection so vital for a diabetic resident who can\'t feel their feet?',
              minCharacters: 50,
            },
            {
              id: 'wo-s11-reflection-2',
              type: 'reflection',
              prompt:
                'Diego described exactly what he saw but didn\'t name, stage, or treat the wound. Why is "observe and describe, don\'t diagnose or treat" the correct and powerful role for a CNA here?',
              minCharacters: 50,
            },
            {
              id: 'wo-s11-rp-text',
              type: 'text',
              body: 'Reflect on the case study in the previous lesson. Your written responses help you apply what you learned about daily diabetic foot inspection, observing without diagnosing, and faithful reporting.',
            },
            {
              id: 'wo-s11-kc2-check',
              type: 'knowledge_check',
              question:
                'A CNA does not diagnose wounds, does not perform wound treatment, does not clean, pack, or treat wounds beyond facility policy, and does not select, apply, change, or remove wound dressings unless specifically trained and permitted by facility policy. Mrs. Adebayo has a slow-healing wound on her lower leg. Over the past two days it\'s clearly gotten worse: the redness has spread up her leg well beyond the wound, the area is warm and swollen, there\'s now thick yellow-green foul-smelling drainage, and today she has a fever and seems newly confused and unwell. What SHOULD the CNA do?',
              options: [
                {
                  id: 'routine-care-next-change',
                  label: 'Continue routine care and mention it at the next dressing change',
                },
                {
                  id: 'report-urgently',
                  label:
                    'Report it to the nurse urgently — spreading redness with foul drainage, fever, and new confusion suggests a serious, possibly spreading infection',
                },
                {
                  id: 'clean-redress-self',
                  label: 'Clean and re-dress the wound herself to help it',
                },
                {
                  id: 'fluids-recheck',
                  label: 'Encourage fluids and recheck in a couple of days',
                },
              ],
              correctOptionId: 'report-urgently',
              explanation:
                'You never diagnose, treat, or dress wounds beyond your trained role — but your urgent reporting of spreading redness, foul drainage, fever, and new confusion supports the treatment the wound team provides.',
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
            { id: 'wo-s12-heading', type: 'heading', level: 1, text: 'Conclusion' },
            {
              id: 'wo-s12-video',
              type: 'video',
              title: 'Conclusion',
              videoUrl: '/assets/courses/wound-observation/s12-conclusion.mp4',
              placeholderNote:
                'Pending upload: /assets/courses/wound-observation/s12-conclusion.mp4',
            },
            {
              id: 'wo-s12-image',
              type: 'image',
              src: `${ASSET_BASE}/s12-hero.jpg`,
              caption: 'Five things that matter most in wound observation and skin care.',
            },
            {
              id: 'wo-s12-narration',
              type: 'text',
              body: [
                'You\'ve reached the end — and you\'ve completed the skin and wound series. Let\'s lock in the five things that matter most for wound observation and skin care.',
                '**One.** Aging skin is fragile — thinner, drier, easily torn and bruised, and slow to heal. So elder wounds heal slowly and infect easily, and a small wound is never automatically minor. Know the common types: skin tears, pressure injuries, diabetic and circulation wounds, and surgical wounds.',
                '**Two.** Your core skill is observe and describe. Watch the skin daily, find wounds early, and describe them accurately — location, size, color, open or intact, drainage, odor, pain — reporting new wounds and changes promptly. Describe like a reporter; never diagnose, name, stage, or treat the wound. That\'s the nurse\'s job, and your accurate description is what they need.',
                '**Three.** Prevent wounds through gentle care. Handle fragile skin gently, support limbs instead of gripping, transfer without dragging, pad hazards, remove adhesives slowly, moisturize, and manage moisture. So many wounds happen during handling that your gentle technique is direct prevention.',
                '**Four.** Know the two urgencies. Infection — spreading redness, warmth, pus or foul drainage, a worsening wound, and especially fever or new confusion — report promptly, the body-wide signs urgently. Bleeding — control it with firm direct pressure and elevation, call for help, stay with the resident, and take it seriously on blood thinners. And treat any diabetic foot wound, however small, as urgent.',
                '**Five.** Honor your scope. You never diagnose, treat, or dress wounds, and never improvise on a dressing. But you observe and describe expertly, protect fragile skin and existing wounds, support the body\'s healing, and report — serving as the wound team\'s eyes and the resident\'s daily protection.',
              ].join('\n\n'),
            },
            {
              id: 'wo-s12-summary',
              type: 'summary',
              title: 'Five things that matter most',
              items: [
                'Aging skin is fragile — elder wounds heal slowly and infect easily; know the common types.',
                'Observe and describe — location, size, color, drainage; never diagnose, name, stage, or treat.',
                'Prevent wounds through gentle handling, careful transfers, and daily skin inspection.',
                'Know the two urgencies — infection with fever/confusion and bleeding on blood thinners.',
                'Honor your scope — observe, describe, protect, support, and report faithfully.',
              ],
            },
            {
              id: 'wo-s12-whn-text',
              type: 'text',
              body: 'Ten questions are waiting. Everything on them was covered here. You\'re ready. Trust what you\'ve learned, and show what you know.',
            },
            {
              id: 'wo-s12-cr-text',
              type: 'text',
              body: 'This course provides one hour of continuing education credit through CAL ACE Nursing Academy, an approved CDPH continuing education provider, NAC number 7384. Your certificate is generated automatically when you pass the knowledge check.',
            },
            {
              id: 'wo-s12-cr-callout',
              type: 'callout',
              variant: 'info',
              title: 'Scope reminder',
              body: 'CNAs observe, describe, protect, and report. CNAs do not diagnose wounds, treat wounds, or select or change dressings unless specifically trained and permitted.',
            },
            {
              id: 'wo-s12-ca-text',
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

export async function seedCourse39WoundObservation(
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
  console.log(`Seeding Course 39 (Wound Observation & Basic Skin Care) as DRAFT — slug "${COURSE_SLUG}"…`);

  try {
    const result = await seedCourse39WoundObservation(prisma);
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
