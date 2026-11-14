/**
 * Seed Course 38 — Pressure Injuries (DRAFT).
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-38-pressure-injuries
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
const COURSE_SLUG = 'pressure-injuries';
const COURSE_TITLE = 'Pressure Injury Risk, Skin Checks, and Prevention';
const COURSE_SUMMARY =
  'Learn the CNA\'s role in preventing and recognizing pressure injuries — understanding how they form, the repositioning clock, pressure points, skin inspection, the critical early sign (non-blanching redness), keeping skin clean, dry, and nourished, and reporting early. CNAs do not stage wounds, diagnose, perform wound treatment, or select dressings.';

const ASSET_BASE = `/assets/courses/pressure-injuries`;


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
    'Explain how pressure injuries form',
    'Prevent them through repositioning and skin care',
    'Identify the pressure points',
    'Recognize the earliest warning sign',
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
  heroImage: '/assets/courses/pressure-injuries/hero-banner.png',
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
    title: 'Understanding Pressure Injuries',
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: 'Introduction',
        sortOrder: 0,
        buildContent: () =>
          doc('Welcome', [
            { id: 'pi-s01-heading', type: 'heading', level: 1, text: 'Welcome' },
            {
              id: 'pi-s01-video',
              type: 'video',
              title: 'Introduction',
              videoUrl: `${ASSET_BASE}/s01-intro.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s01-intro.mp4`,
            },
            {
              id: 'pi-s01-image',
              type: 'image',
              src: `${ASSET_BASE}/s01-hero.jpg`,
              caption:
                'Pressure injuries — preventing the skin breakdown that comes from staying in one position too long.',
            },
            {
              id: 'pi-s01-narration',
              type: 'text',
              body: [
                'Welcome to CAL ACE Nursing Academy.',
                'This course is about pressure injuries — also called pressure ulcers or bedsores — and it may be the single most important prevention course a CNA ever takes. Because few problems in long-term care are more painful, more dangerous, more expensive, and more preventable — and few are more directly in the CNA\'s hands.',
                'A pressure injury is damage to the skin and the tissue beneath it, caused by sustained pressure — usually where bone is close to the surface and the body\'s weight presses skin against a bed or chair. When pressure on an area continues too long, it squeezes shut the tiny blood vessels that feed the skin. Starved of blood, the tissue begins to die. What starts as a patch of reddened skin can become an open sore, then a deep crater reaching muscle and bone.',
                'Here\'s the fact that should anchor everything you do: pressure injuries are largely preventable. The damage comes from pressure left in place too long — and relieving that pressure, regularly and faithfully, prevents most of them. That relief is delivered by CNAs, through repositioning, skin care, and watchful eyes. When pressure injuries are prevented, it\'s almost always because CNAs did their job well. When they develop, it\'s very often because pressure sat too long. That\'s how central you are.',
                'This course teaches you the whole prevention system: the repositioning clock — turning and shifting residents on a schedule so no area bears pressure too long. The pressure points — the bony places where these injuries strike. Skin inspection — checking skin at every opportunity. Keeping skin clean, dry, and the resident well-nourished and hydrated, because broken-down, moist, or starved skin gives way fastest. And above all, recognizing the earliest warning sign — a reddened area that does not turn white when you press it — because catching that sign and relieving the pressure can stop an injury before the skin ever breaks.',
                'Your scope is clear. A CNA prevents pressure injuries through repositioning, skin care, and nutrition support, inspects skin, recognizes early signs, and reports immediately. A CNA does not stage or diagnose pressure injuries, does not perform wound treatment, and does not select dressings — those are the nurse\'s and the team\'s.',
                'By the end of this course, you will be able to: explain how pressure injuries form. Prevent them through repositioning and skin care. Identify the pressure points. Recognize the earliest warning sign. And know your scope.',
                'There is a ten-question knowledge check at the end. Everything on it is covered here. Let\'s begin.',
              ].join('\n\n'),
            },
            {
              id: 'pi-s01-ci-text',
              type: 'text',
              body: [
                'This course teaches the CNA\'s role in preventing and recognizing pressure injuries — understanding how they form, the repositioning clock, pressure points, skin inspection, the critical early sign (non-blanching redness), keeping skin clean, dry, and nourished, and reporting early.',
                'Let\'s be clear about your role. A CNA prevents pressure injuries through repositioning, skin care, and nutrition support, inspects skin, recognizes early signs, and reports immediately. A CNA does not stage or diagnose pressure injuries, does not perform wound treatment, and does not select dressings — those are the nurse\'s and the team\'s. But none of them can happen without your careful observation and faithful reporting first.',
              ].join('\n\n'),
            },
            {
              id: 'pi-s01-ci-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of this course',
              body: 'CNAs REPOSITION, INSPECT, PROTECT SKIN, and REPORT. CNAs do not stage or diagnose pressure injuries, perform wound treatment, or select dressings.',
            },
            {
              id: 'pi-s01-lo-text',
              type: 'text',
              body: 'By the end of this course, you will be able to:',
            },
            {
              id: 'pi-s01-lo-summary',
              type: 'summary',
              title: 'Learning objectives',
              items: [
                'Explain how pressure injuries form.',
                'Prevent them through repositioning and skin care.',
                'Identify the pressure points.',
                'Recognize the earliest warning sign.',
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
            { id: 'pi-s02-heading', type: 'heading', level: 1, text: 'Key terms' },
            {
              id: 'pi-s02-image',
              type: 'image',
              src: `${ASSET_BASE}/s02-hero.jpg`,
              caption:
                'Key terms — pressure injury, blanching, bony prominence, repositioning, offloading.',
            },
            {
              id: 'pi-s02-reveal-pressure-injury',
              type: 'reveal_card',
              frontTitle: 'Pressure Injury',
              frontBody: 'Pressure injury',
              backTitle: 'Pressure Injury',
              backBody:
                'Also called a pressure ulcer or bedsore. Damage to the skin and the tissue under it, caused by sustained pressure cutting off blood flow. It ranges from reddened intact skin to a deep open wound reaching muscle and bone. Most are preventable.',
            },
            {
              id: 'pi-s02-reveal-pressure-points',
              type: 'reveal_card',
              frontTitle: 'Pressure Points',
              frontBody: 'Pressure points',
              backTitle: 'Pressure Points',
              backBody:
                'The places where bone lies close to the skin, so body weight presses hardest — the tailbone, hips, heels, ankles, shoulder blades, elbows, the back of the head, and ears. These are exactly where pressure injuries form, and exactly where you look.',
            },
            {
              id: 'pi-s02-reveal-repositioning',
              type: 'reveal_card',
              frontTitle: 'Repositioning',
              frontBody: 'Repositioning',
              backTitle: 'Repositioning',
              backBody:
                'Regularly changing a resident\'s position — turning, shifting weight, adjusting — so no area bears pressure too long. The common guideline is at least every two hours in bed and more often in a chair. Repositioning is the single most powerful prevention there is.',
            },
            {
              id: 'pi-s02-reveal-blanching',
              type: 'reveal_card',
              frontTitle: 'Blanching',
              frontBody: 'BLAN-ching',
              backTitle: 'Blanching',
              backBody:
                'When you gently press a reddened area and it briefly turns white, then pink again — that\'s healthy blood flow returning. Non-blanching means it stays red when pressed — a sign the tissue is already damaged. This blanch test is one of the most important skills in this course.',
            },
            {
              id: 'pi-s02-reveal-stage-1',
              type: 'reveal_card',
              frontTitle: 'Stage 1 Pressure Injury',
              frontBody: 'Stage 1',
              backTitle: 'Stage 1 Pressure Injury',
              backBody:
                'The earliest stage — the skin is still intact but shows a reddened area that does not blanch, and may feel warmer, firmer, or softer, or be painful. It\'s a red alert and an opportunity: relieve the pressure now, and the skin may never break. CNAs recognize and report it; the nurse stages it.',
            },
            {
              id: 'pi-s02-reveal-advanced-stages',
              type: 'reveal_card',
              frontTitle: 'Advanced Stages (2, 3, 4) & Unstageable',
              frontBody: 'Advanced stages',
              backTitle: 'Advanced Stages (2, 3, 4) & Unstageable',
              backBody:
                'As damage deepens: stage 2, a shallow open sore or blister; stage 3, a deeper crater into the fat; stage 4, deepest, reaching muscle, tendon, or bone. Unstageable means the depth is hidden by dead tissue. The nurse assigns all stages — CNAs report what they see.',
            },
            {
              id: 'pi-s02-reveal-shear-friction',
              type: 'reveal_card',
              frontTitle: 'Shear and Friction',
              frontBody: 'Shear and friction',
              backTitle: 'Shear and Friction',
              backBody:
                'Friction is skin rubbing against a surface — like dragging a resident across sheets. Shear is when the skin stays put but the tissue underneath slides — like sliding down in a raised bed. Both damage skin and worsen pressure injuries, and both are prevented by careful, lifting movement.',
            },
            {
              id: 'pi-s02-reveal-moisture',
              type: 'reveal_card',
              frontTitle: 'Moisture-Associated Damage',
              frontBody: 'Moisture-associated skin damage',
              backTitle: 'Moisture-Associated Damage',
              backBody:
                'Skin weakened and broken down by staying wet — from sweat, urine, or stool. Wet skin breaks far more easily under pressure, so keeping skin clean and dry is core pressure-injury prevention. Moisture and pressure together are especially dangerous.',
            },
            {
              id: 'pi-s02-kc1-check-blanching',
              type: 'knowledge_check',
              question: 'Match the term: reddened skin briefly turns white when pressed (healthy)',
              options: [
                { id: 'blanching', label: 'Blanching' },
                { id: 'stage-1', label: 'Stage 1' },
                { id: 'repositioning', label: 'Repositioning' },
              ],
              correctOptionId: 'blanching',
              explanation:
                'Blanching. When you gently press a reddened area and it briefly turns white, then pink again — that\'s healthy blood flow returning. Non-blanching means it stays red when pressed — a sign the tissue is already damaged.',
              requiredForCompletion: true,
            },
            {
              id: 'pi-s02-kc1-check-stage-1',
              type: 'knowledge_check',
              question:
                'Match the term: intact skin with redness that does NOT turn white — the early warning',
              options: [
                { id: 'blanching', label: 'Blanching' },
                { id: 'stage-1', label: 'Stage 1' },
                { id: 'repositioning', label: 'Repositioning' },
              ],
              correctOptionId: 'stage-1',
              explanation:
                'Stage 1. The earliest stage — the skin is still intact but shows a reddened area that does not blanch, and may feel warmer, firmer, or softer, or be painful. It\'s a red alert and an opportunity: relieve the pressure now, and the skin may never break.',
              requiredForCompletion: true,
            },
            {
              id: 'pi-s02-kc1-check-repositioning',
              type: 'knowledge_check',
              question:
                'Match the term: regularly changing position so no area bears pressure too long',
              options: [
                { id: 'blanching', label: 'Blanching' },
                { id: 'stage-1', label: 'Stage 1' },
                { id: 'repositioning', label: 'Repositioning' },
              ],
              correctOptionId: 'repositioning',
              explanation:
                'Repositioning. Regularly changing a resident\'s position — turning, shifting weight, adjusting — so no area bears pressure too long. The common guideline is at least every two hours in bed and more often in a chair.',
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
            { id: 'pi-s03-heading', type: 'heading', level: 1, text: 'Statistics' },
            pendingAudio(
              'pi-s03-audio',
              'Pressure Injuries: Common, Dangerous, and Largely in the CNA\'s Hands',
              `${ASSET_BASE}/s03-stats-podcast.mp3`,
              [
                'Pressure Injuries: Common, Dangerous, and Largely in the CNA\'s Hands',
                '',
                'Pressure injuries are one of the most significant and closely watched problems in long-term care. At any given time, a meaningful share of nursing home residents have a pressure injury, and many more are at risk. They are a major quality measure — facilities are tracked and held accountable for their pressure-injury rates — precisely because they reflect the quality of daily care.',
                '',
                'The harm they cause is serious on every level. They are painful, sometimes severely. They heal slowly, over weeks to months, and the worst may never fully heal. They become infected, and a deep, infected pressure injury can lead to bone infection or to sepsis — a life-threatening, bloodstream infection. Pressure injuries are associated with longer stays, more hospitalizations, and higher death rates in frail residents. And they are enormously expensive to treat. By every measure — human and financial — preventing one is vastly better than treating one.',
                '',
                'Now the most important fact, the one this whole course rests on: the great majority of pressure injuries are preventable. They form for an understandable, interruptible reason — sustained pressure cutting off blood flow to the skin. Relieve the pressure regularly, and the blood keeps flowing, and the tissue stays alive. That relief — repositioning, offloading bony points, keeping skin clean, dry, and intact, supporting nutrition and hydration, and catching the earliest warning signs — is daily, hands-on CNA work. Research is unambiguous: facilities and caregivers who reposition faithfully, inspect skin diligently, and act on early redness have dramatically lower pressure-injury rates.',
                '',
                'There\'s a flip side worth stating plainly, because it shows how much CNAs matter: when a preventable pressure injury develops, it is very often because pressure was allowed to sit too long — a resident not turned on schedule, an early red mark missed or ignored, wet skin left unchanged. The injury is the visible record of care that lapsed. That\'s not said to frighten, but to empower: the same daily faithfulness that prevents falls and infections prevents these wounds, and the CNA is the one who delivers it.',
                '',
                'The bottom line: pressure injuries are common, painful, dangerous, costly — and overwhelmingly preventable through exactly the repositioning, skin care, and watchfulness that define good CNA work.',
              ].join('\n'),
              '/assets/courses/pressure-injuries/s03-stats-podcast.mp3',
            ),
            {
              id: 'pi-s03-image',
              type: 'image',
              src: `${ASSET_BASE}/s03-hero.jpg`,
              caption:
                'Pressure injuries are common and largely preventable — daily care is what stops them.',
            },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: 'Fundamentals',
        sortOrder: 3,
        buildContent: () =>
          doc('Fundamentals', [
            { id: 'pi-s04-heading', type: 'heading', level: 1, text: 'Fundamentals' },
            {
              id: 'pi-s04-narration',
              type: 'text',
              body: [
                '**How skin normally stays healthy**',
                'Skin stays alive because blood constantly flows through tiny vessels, delivering oxygen and nutrients and carrying waste away. As long as that blood keeps flowing, skin and the tissue beneath it stay healthy. Everything about pressure injuries comes down to protecting that blood flow.',
                '**How pressure injuries form**',
                'When a part of the body presses against a surface — a mattress, a chair — the weight squeezes the tiny blood vessels in that area. Brief pressure is fine; blood flows back the moment you shift. But sustained pressure, held too long, keeps those vessels squeezed shut. The skin and tissue, cut off from blood, begin to starve. Within hours, damage begins — and it begins from the inside, often before the surface looks broken.',
                '**Why bony points are the danger zones**',
                'Pressure is worst where bone lies just under the skin, because the bone presses the skin against the surface from the inside while the surface presses from the outside — the tissue is crushed between them. That\'s why pressure injuries strike the pressure points: tailbone, hips, heels, ankles, shoulder blades, elbows, the back of the head, the ears. Knowing these points tells you exactly where to look and what to protect.',
                '**Why time is the enemy**',
                'The key variable is time. The same pressure that\'s harmless for a few minutes becomes dangerous over a couple of hours. This is the entire logic of the repositioning schedule: by changing position regularly, you make sure no area bears pressure long enough to cut off blood flow. Relieve the pressure before the damage starts, and the injury never forms. The clock is your most important tool.',
                '**The crucial early sign: non-blanching redness**',
                'Here\'s the most valuable thing in this course. The first warning sign — before any open wound — is a reddened area over a pressure point. Test it gently: press a fingertip on the redness. If it briefly turns white and then pink, blood flow is returning — that\'s the body coping. But if it stays red and does NOT turn white — non-blanching — the tissue is already damaged. That non-blanching redness is a stage 1 pressure injury, a red alert, and a golden opportunity: relieve all pressure from that spot now, and the skin may never break.',
                '**How it deepens if missed**',
                'If the warning is missed and pressure continues, the injury deepens through stages: from intact red skin, to a shallow open sore or blister, to a deeper crater into the fat, to the deepest wounds reaching muscle, tendon, and bone. The deeper it goes, the more painful, the slower to heal, the more likely to become infected — and the more it could have been prevented by acting at that first red mark.',
                '**The accelerators: moisture, shear, friction, poor nutrition**',
                'Pressure is the cause, but other factors speed it up. Moisture — from sweat, urine, or stool — weakens skin so it breaks faster. Friction and shear — dragging skin across sheets, or sliding down in a raised bed — tear and stress the tissue. And poor nutrition and hydration leave skin fragile and slow to repair. Controlling these accelerators — dry skin, careful lifting, good nutrition — multiplies the protection that repositioning provides.',
              ].join('\n\n'),
            },
            {
              id: 'pi-s04-blanch-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Non-blanching redness = act now',
              body: 'Turns white when pressed = coping. Stays red = damage. Relieve all pressure from that spot immediately and report.',
            },
            {
              id: 'pi-s04-video',
              type: 'video',
              title: 'Fundamentals',
              videoUrl: `${ASSET_BASE}/s04-fundamentals.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s04-fundamentals.mp4`,
            },
            {
              id: 'pi-s04-image',
              type: 'image',
              src: `${ASSET_BASE}/s04-hero.jpg`,
              caption:
                'How pressure damages skin, and why redness that doesn\'t blanch is an early warning.',
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
            { id: 'pi-s05-heading', type: 'heading', level: 1, text: 'Signs & Symptoms' },
            {
              id: 'pi-s05-image',
              type: 'image',
              src: `${ASSET_BASE}/s05-hero.jpg`,
              caption:
                'Recognizing trouble — non-blanching redness over a bony area is the first sign.',
            },
            {
              id: 'pi-s05-narration',
              type: 'text',
              body: [
                'Your eyes and your fingertips are the early-warning system for pressure injuries. Let\'s learn the signs — starting with the one that matters most.',
                '**The early sign: non-blanching redness**',
                'This is the sign that saves skin. Over a pressure point, watch for a reddened area — and test it. Gently press a fingertip on it for a moment, then lift. If the spot briefly whitens and returns to pink, blood is flowing — keep watching it. But if it stays red and does not turn white — non-blanching — the tissue underneath is already damaged. This is a stage 1 pressure injury. The skin is still intact, so there\'s still time: relieve all pressure from that area immediately and report it. On darker skin, where redness is harder to see, look and feel for other clues: an area that\'s darker, purplish, firmer, softer, warmer, cooler, or painful compared to the skin around it. Always check by feel, not just by sight.',
                '**Inspecting the pressure points**',
                'Know where to look, and look every chance you get — during bathing, dressing, repositioning, and care. Inspect the pressure points: the tailbone and lower back, the hips, the heels and ankles, the shoulder blades, the elbows, the back of the head, the ears, and skin folds. For residents in chairs, the tailbone and sitting bones especially. For anyone with a device — oxygen tubing, a catheter, a cast, shoes — check the skin underneath and around it, because devices cause pressure injuries too. Make skin inspection a habit attached to every task.',
                '**The signs it\'s deepening**',
                'If an injury has formed or is worsening, you\'ll see it progress: the intact red area giving way to a blister or a shallow open sore; a deeper open crater; drainage; dead tissue; and increasing size or depth. Any open skin, any blister, any wound over a pressure point is reported promptly. And here\'s a key point on your role: you describe and report exactly what you see — the location, size, color, and whether skin is open — but you do not assign the stage number. The nurse stages it; you report the observation.',
                '**The signs of infection**',
                'A pressure injury that becomes infected is dangerous. Watch for and report promptly: increasing redness spreading around the wound, warmth, swelling, increasing pain. Pus or thick, cloudy, foul-smelling drainage. The wound looking worse rather than better. And body-wide signs that infection is spreading — fever or chills, and in frail elders, new confusion or feeling very unwell, which can signal the wound infection has reached the blood. Infection signs are reported urgently — a deep infected pressure injury can become life-threatening.',
                '**Summary**',
                'Four pictures. The early sign: reddened skin over a bony point that does NOT blanch — relieve pressure now and report. Inspection: check every pressure point, every skin fold, and under every device, by sight and feel, at every opportunity. Deepening: blisters, open sores, craters, drainage — report what you see; the nurse stages it. Infection: spreading redness, warmth, pus, foul odor, fever, new confusion — report urgently.',
                'The rule underneath it all: check the pressure points constantly, treat non-blanching redness as the emergency-prevention moment it is, report what you see without staging it, and treat infection signs as urgent.',
              ].join('\n\n'),
            },
            {
              id: 'pi-s05-early-sign-callout',
              type: 'callout',
              variant: 'warning',
              title: 'The early sign',
              body: 'Non-blanching redness over a bony point means the tissue is already damaged — relieve all pressure immediately and report.',
            }
          ]),
      },
      {
        slug: 's06-causes',
        title: 'Causes',
        sortOrder: 5,
        buildContent: () =>
          doc('Causes', [
            { id: 'pi-s06-heading', type: 'heading', level: 1, text: 'Causes' },
            pendingAudio(
              'pi-s06-audio',
              'What Causes Pressure Injuries — and Who Is Most at Risk?',
              `${ASSET_BASE}/s06-causes-podcast.mp3`,
              [
                'What Causes Pressure Injuries — and Who Is Most at Risk?',
                '',
                'The fundamental cause of a pressure injury is simple: sustained pressure that cuts off blood flow to the skin and the tissue beneath it. Everything else either creates that pressure, prolongs it, or weakens the skin so it gives way faster. Understanding this makes every prevention step make sense.',
                '',
                'The biggest risk factor is immobility — anything that keeps a resident from shifting their own weight. A healthy person shifts constantly, even in sleep, relieving pressure automatically. A resident who is bedbound, chairbound, paralyzed, very weak, sedated, unconscious, or simply too frail or in too much pain to move can\'t do that — so pressure sits and sits. This is why immobile residents are the highest priority for repositioning, and why conditions like stroke, spinal cord injury, advanced dementia, and severe illness raise risk so much.',
                '',
                'Several other factors stack on top. Reduced sensation — from spinal cord injury, diabetes, or stroke — means a resident can\'t feel the discomfort that would normally make them shift, so they don\'t. Moisture — from incontinence, sweat, or wound drainage — weakens and macerates skin, making it break under less pressure. Friction and shear — from being dragged across sheets, or sliding down in a bed raised too high — tear at the tissue. Poor nutrition and dehydration starve the skin of what it needs to stay strong and repair itself; low protein and weight loss are major risk factors. Poor circulation and certain conditions reduce blood flow to begin with. Thin, fragile, aging skin tears and breaks easily. And existing skin damage or a previous pressure injury marks an area as vulnerable.',
                '',
                'Now notice something powerful: nearly every one of those risk factors maps directly to a CNA action. Immobility is met with repositioning. Lost sensation is met with proactive inspection, since the resident won\'t feel it. Moisture is met with prompt cleaning and dry skin. Friction and shear are met with careful lifting, not dragging, and keeping the head of the bed from being too high. Poor nutrition is met with feeding support and reporting poor intake. Fragile skin is met with gentle handling and protection of bony points.',
                '',
                'The pattern is the whole course in one idea: pressure injuries have a clear cause and clear risk factors, and almost every one of them is answered by something a CNA does every shift. Know which of your residents carry the most risk factors, and give them the most vigilant prevention.',
              ].join('\n'),
              '/assets/courses/pressure-injuries/s06-causes-podcast.mp3',
            ),
            {
              id: 'pi-s06-image',
              type: 'image',
              src: `${ASSET_BASE}/s06-hero.jpg`,
              caption:
                'What raises risk — immobility, moisture, poor nutrition, and fragile aging skin.',
            },
          ]),
      },
      {
        slug: 's07-role',
        title: 'CNA Role & Best Practices',
        sortOrder: 6,
        buildContent: () =>
          doc('CNA Role & Best Practices', [
            { id: 'pi-s07-heading', type: 'heading', level: 1, text: 'CNA Role & Best Practices' },
            {
              id: 'pi-s07-image',
              type: 'image',
              src: `${ASSET_BASE}/s07-hero.jpg`,
              caption:
                'CNA scope — reposition, inspect, keep skin dry, and report; never stage or treat the wound.',
            },
            {
              id: 'pi-s07-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of practice',
              body: 'CNAs REPOSITION, OFFLOAD, PROTECT SKIN, and REPORT. CNAs never stage, diagnose, or treat the wound.',
            },
            {
              id: 'pi-s07-narration',
              type: 'text',
              body: [
                'For pressure injuries, prevention IS the treatment that matters most — and it\'s almost entirely CNA work. When an injury does form, the medical team treats it, and the CNA\'s prevention continues around it. Let\'s walk through it, starting with the rule that never bends. A CNA does not stage or diagnose pressure injuries, does not perform wound treatment or apply or select dressings beyond facility policy and training, and does not decide a wound\'s care — those belong to the nurse and the wound team.',
                '**The repositioning clock — the heart of prevention.** This is the most important treatment you deliver. Reposition residents who can\'t shift themselves on a schedule — commonly at least every two hours in bed, and more often when sitting in a chair, often every hour or less. Turn fully and use good positioning: pillows and wedges to offload bony points, the thirty-degree side-lying position rather than directly on the hip, heels lifted off the bed entirely with a pillow under the calves, and never positioning a resident directly on an existing red area or wound. Keep a turning schedule and follow it faithfully — the clock prevents the injury.',
                '**Offloading and pressure-redistribution.** Support the special surfaces the team provides — pressure-redistributing mattresses and cushions — and use them correctly. But never let a special mattress become an excuse to reposition less; the surfaces help, the turning still happens. Keep the head of the bed as low as the plan allows, since a high head-of-bed causes sliding and shear.',
                '**Skin care, moisture, and nutrition.** Keep skin clean and dry — change promptly after incontinence, manage moisture, apply barrier products as directed, and never leave skin wet. Handle gently, lift rather than drag to avoid friction and shear, and protect fragile skin and bony points. Support good nutrition and hydration and report poor intake, because well-nourished skin resists breakdown and heals; this is genuine pressure-injury treatment.',
                '**When an injury exists — your continuing role.** If a pressure injury has formed, the nurse and wound team assess, stage, and treat it, choosing dressings and therapies. Your role continues and intensifies: keep all pressure off it, reposition even more faithfully, keep the area and surrounding skin clean and protected, follow the care plan, watch for worsening and infection, and report. You don\'t treat the wound — but your prevention is what keeps it from deepening and helps it heal.',
                '**Recognize and report — the early-action rule.** The moment you find non-blanching redness or any skin breakdown, relieve the pressure and report it. Early action on a stage 1 can prevent an open wound entirely. Reporting is not optional or "later" — it\'s immediate.',
                'The scope point for this section: you never stage, diagnose, or treat the wound — but you deliver the repositioning, offloading, skin care, and nutrition support that prevent and contain pressure injuries, and you report the first sign immediately. Prevention is the treatment, and prevention is you.',
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
            { id: 'pi-s08-heading', type: 'heading', level: 1, text: 'Prevention & Risk Reduction' },
            {
              id: 'pi-s08-image',
              type: 'image',
              src: `${ASSET_BASE}/s08-hero.jpg`,
              caption:
                'Prevention — a repositioning schedule, offloading pressure, and keeping skin clean and dry.',
            },
            {
              id: 'pi-s08-narration',
              type: 'text',
              body: [
                'Pressure-injury prevention is the heart of this course — and it\'s your daily work. Here are seven ways CNAs prevent them.',
                '**One. Reposition on the clock — faithfully.** Turn and shift residents who can\'t move themselves at least every two hours in bed, and more often in a chair. Keep to the schedule even when you\'re busy — this single habit prevents most pressure injuries. Use a turning record if your facility has one, and never let an immobile resident go too long unmoved.',
                '**Two. Offload the bony points.** When you position, take the weight off the danger zones: pillows and wedges to support and separate, the thirty-degree side-lying angle instead of directly on the hip, and heels floated off the bed with a pillow under the calves. Never lay a resident directly on a reddened area or an existing wound. Good positioning is as important as the timing.',
                '**Three. Inspect skin at every opportunity.** Make skin checks part of every task — bathing, dressing, repositioning, toileting. Look and feel at every pressure point, in every skin fold, and under every device. Catching a problem on day one, while the skin is still intact, is the whole game. Eyes and fingertips on the skin, every chance you get.',
                '**Four. Keep skin clean and dry.** Change promptly after any incontinence, manage sweat and moisture, apply barrier protection as directed, and never leave skin wet. Wet skin breaks under far less pressure, so dryness multiplies the protection of every turn. Moisture plus pressure is the dangerous combination — break it.',
                '**Five. Lift, don\'t drag — prevent friction and shear.** Use proper technique, lift sheets, and help to move residents without dragging them across the bed, which tears skin. Keep the head of the bed as low as allowed so residents don\'t slide down and shear the tissue underneath. Careful movement protects the skin you\'re trying to save.',
                '**Six. Support nutrition and hydration.** Well-nourished, well-hydrated skin resists breakdown and heals; poorly nourished skin gives way fast. Encourage meals and fluids within each plan, help residents eat, and report poor appetite and weight loss — because nutrition is invisible pressure-injury prevention.',
                '**Seven. Act on the first sign — immediately.** The instant you find non-blanching redness or any skin change over a pressure point, relieve all pressure from that spot and report it right away. Don\'t wait, don\'t "watch it till next shift." Early action on a stage 1 can prevent an open wound entirely. Speed at the first sign is everything.',
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
            { id: 'pi-s09-heading', type: 'heading', level: 1, text: 'Scenario & Reporting' },
            pendingAudio(
              'pi-s09-intro-audio',
              'Emergency response scenarios intro',
              `${ASSET_BASE}/s09-emergency-intro.mp3`,
              'With pressure injuries, the judgments that matter most are acting the instant you find the earliest sign, and recognizing when a wound has become a dangerous infection. You\'re about to work through two situations. Read each carefully, choose your action, and you\'ll get feedback right away. Keep the core ideas in mind: non-blanching redness over a bony point is the act-now moment — and a pressure injury with spreading infection signs is urgent.',
              '/assets/courses/pressure-injuries/s09-emergency-intro.mp3',
            ),
            {
              id: 'pi-s09-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-hero.jpg`,
              caption:
                'Two pressure-injury judgments — an early Stage 1 warning, and a wound turning infected.',
            },
            {
              id: 'pi-s09-scenario-underwood-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-scenario-underwood.jpg`,
              caption:
                'Non-blanching redness over the tailbone, skin intact: Stage 1 — relieve pressure now and report.',
            },
            {
              id: 'pi-s09-scenario-underwood',
              type: 'scenario_question',
              prompt:
                'While bathing Mrs. Underwood, who spends most of her day in bed, you notice a reddened area over her tailbone. You gently press it with a fingertip — and it stays red; it does not turn white. The skin is still intact, no open area. She\'s due to be repositioned. A coworker says, "It\'s just a little redness, finish her bath and we\'ll keep an eye on it next shift." What SHOULD the CNA do?',
              options: [
                {
                  id: 'watch-next-shift',
                  label: 'Finish as planned and watch it next shift',
                  feedback:
                    'Non-blanching redness over a bony point is a stage 1 pressure injury — the tissue is already damaged, but the intact skin gives you a window to prevent an open wound. Waiting until next shift wastes that window, and massaging the area worsens injured tissue. The right action: relieve all pressure now, reposition off it, and report it promptly.',
                },
                {
                  id: 'relieve-and-report',
                  label:
                    'Relieve all pressure from the tailbone now, reposition off it, and report it to the nurse promptly as a possible stage 1',
                  feedback:
                    'Exactly right — this is the moment pressure-injury care is built around. Redness over a bony point that does NOT blanch means the tissue is already damaged: this is a stage 1 pressure injury, even though the skin is still intact. And intact skin means there\'s still time to stop it from ever opening. Relieve all pressure from the tailbone immediately — reposition her off it, onto a side using the thirty-degree position, offload the area — and report it to the nurse promptly. "Watch it next shift" wastes the exact window where action works. Never massage a reddened pressure area — that can worsen the damage to already-injured tissue. Catching and offloading non-blanching redness now may keep her skin from ever breaking, which is the whole goal.',
                  isRecommended: true,
                },
                {
                  id: 'massage-area',
                  label: 'Massage the red area firmly to bring back circulation',
                  feedback:
                    'Non-blanching redness over a bony point is a stage 1 pressure injury — the tissue is already damaged, but the intact skin gives you a window to prevent an open wound. Waiting until next shift wastes that window, and massaging the area worsens injured tissue. The right action: relieve all pressure now, reposition off it, and report it promptly.',
                },
                {
                  id: 'apply-lotion',
                  label: 'Apply a thick lotion and continue as normal',
                  feedback:
                    'Non-blanching redness over a bony point is a stage 1 pressure injury — the tissue is already damaged, but the intact skin gives you a window to prevent an open wound. Waiting until next shift wastes that window, and massaging the area worsens injured tissue. The right action: relieve all pressure now, reposition off it, and report it promptly.',
                },
              ],
              requiredForCompletion: true,
            },
            {
              id: 'pi-s09-scenario-oyelaran-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-scenario-oyelaran.jpg`,
              caption:
                'Known injury now spreading with foul drainage, fever, and new confusion: infection — report urgently.',
            },
            {
              id: 'pi-s09-scenario-oyelaran',
              type: 'scenario_question',
              prompt:
                'Mr. Oyelaran has a known pressure injury on his hip that the wound team has been treating. Today it looks and seems worse: the redness has spread well beyond the wound edges onto the surrounding skin, the area is warm and more swollen, there\'s thick, foul-smelling drainage, and Mr. Oyelaran has a fever and seems newly confused and unwell. What is the BEST action?',
              options: [
                {
                  id: 'routine-wound-check',
                  label: 'Continue routine care and mention it at the next scheduled wound check',
                  feedback:
                    'Spreading redness, warmth, foul drainage, fever, and new confusion point to a pressure injury infection that may be spreading dangerously — a possible sepsis risk, not a routine wound-check matter. Waiting, or treating it yourself (outside your scope), delays urgent care. The right action: report it to the nurse urgently with the full picture.',
                },
                {
                  id: 'report-urgently',
                  label:
                    'Report it to the nurse urgently — spreading infection signs with fever and new confusion may mean the infection is becoming serious',
                  feedback:
                    'Right. Spreading redness beyond the wound, warmth, swelling, foul drainage, fever, and new confusion in a frail resident mean this pressure injury is likely infected and the infection may be spreading into the body — which can become life-threatening sepsis, with bone infection also a risk in deep wounds. This is urgent, not a next-scheduled-check matter. Report it to the nurse urgently with the full picture. Do not attempt to clean or treat the wound yourself — wound treatment and dressings are the nurse\'s and wound team\'s, and the new confusion and fever especially signal this needs prompt medical attention. Recognizing that a worsening, foul, spreading wound with fever and confusion is urgent — that\'s the catch that gets him treated in time.',
                  isRecommended: true,
                },
                {
                  id: 'clean-dress-yourself',
                  label: 'Clean it out yourself and apply a fresh dressing',
                  feedback:
                    'Spreading redness, warmth, foul drainage, fever, and new confusion point to a pressure injury infection that may be spreading dangerously — a possible sepsis risk, not a routine wound-check matter. Waiting, or treating it yourself (outside your scope), delays urgent care. The right action: report it to the nurse urgently with the full picture.',
                },
                {
                  id: 'rest-recheck',
                  label: 'Encourage him to rest and recheck tomorrow',
                  feedback:
                    'Spreading redness, warmth, foul drainage, fever, and new confusion point to a pressure injury infection that may be spreading dangerously — a possible sepsis risk, not a routine wound-check matter. Waiting, or treating it yourself (outside your scope), delays urgent care. The right action: report it to the nurse urgently with the full picture.',
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
            { id: 'pi-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
              id: 'pi-s10-narration',
              type: 'text',
              body: [
                'Your role in pressure-injury care is prevention, inspection, early action, and reporting — the most directly preventive work a CNA does. Let\'s walk through it.',
                '**Deliver the repositioning that prevents** You are the repositioning. Turn and shift immobile residents faithfully on schedule — at least every two hours in bed, more in a chair — offload the bony points with good positioning, float the heels, use the thirty-degree side-lying angle, and never lay a resident on a red area. Use the special surfaces correctly without ever letting them replace turning. This faithful clock-work is the single most powerful thing anyone does to prevent these wounds.',
                '**Inspect like the early-warning system you are** Make skin inspection automatic — every bath, every dressing, every turn. Check every pressure point and skin fold, and under every device, by sight and by feel, knowing that on darker skin and in residents who can\'t feel, you must rely on touch and small changes. You are the eyes for skin that may not be able to signal its own distress. Find the problem on day one, while the skin is still whole.',
                '**Protect skin and the whole resident** Protect the skin\'s defenses. Keep it clean and dry, manage moisture promptly, lift rather than drag, keep the head of the bed low, handle fragile skin gently, and support the nutrition and hydration that keep skin strong. Each of these multiplies the protection your repositioning provides — and together they\'re a complete shield.',
                '**Act early, report precisely, never overstep** The moment you find non-blanching redness or any skin change, relieve the pressure and report it immediately — that early action is where injuries are stopped. Report precisely what you see — where, how big, what color, open or intact — without assigning a stage, because staging is the nurse\'s. And escalate infection signs — spreading redness, foul drainage, fever, new confusion — urgently.',
                'Now the boundary. You do not stage or diagnose pressure injuries. You do not perform wound treatment or select dressings. And you never massage a reddened pressure area, never position a resident on a wound, and never wait on a non-blanching red mark.',
                'Inside your role — faithful repositioning, constant inspection, protective skin care, immediate action and reporting — you prevent the wounds, catch them at the only moment they\'re easiest to stop, and protect the residents most at risk. No CNA work more directly prevents suffering than this.',
              ].join('\n\n'),
            },
            {
              id: 'pi-s10-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Stay within scope',
              body: 'You do not stage or diagnose pressure injuries, perform wound treatment, or select dressings. Never massage a reddened pressure area, never position a resident on a wound, and never wait on a non-blanching red mark.',
            },
            {
              id: 'pi-s10-video',
              type: 'video',
              title: "CNA's Role in Care",
              videoUrl: `${ASSET_BASE}/s10-cna-role.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s10-cna-role.mp4`,
            },
            {
              id: 'pi-s10-image',
              type: 'image',
              src: `${ASSET_BASE}/s10-hero.jpg`,
              caption:
                'The CNA as the daily inspector — every repositioning and skin check helps prevent breakdown.',
            },
          ]),
      },
      {
        slug: 's11-case-study',
        title: 'Case Study',
        sortOrder: 10,
        buildContent: () => {
          const caseNarrative = [
            'Mrs. Underwood, 86, had advanced dementia and was largely bedbound after a decline in her mobility. She couldn\'t reposition herself, couldn\'t reliably tell anyone if something hurt, and spent most of her day and night in bed — every risk factor for a pressure injury stacked together. Her CNA, Grace, knew it, and treated her as the high-risk resident she was.',
            '',
            '**The faithful routine:** Grace repositioned Mrs. Underwood at least every two hours, around the clock with her teammates, offloading her bony points with pillows, floating her heels, using the thirty-degree side-lying position rather than letting her rest on her hip. She kept her clean and dry, changing her promptly. And at every single care task, she inspected the skin — tailbone, hips, heels, shoulder blades — by sight and by gentle touch.',
            '',
            '**The catch:** One morning during her bath, Grace found it: a reddened area over Mrs. Underwood\'s tailbone. It would have been easy to dismiss — just a bit of pink on fragile skin. But Grace did the test that defines this work. She pressed a fingertip gently on the redness and lifted it. The spot stayed red. It did not turn white. Non-blanching. The skin was still intact — no open area — but the tissue underneath was already damaged. A stage 1 pressure injury, caught at the only moment it\'s easiest to stop.',
            '',
            '**What Grace did:** She acted immediately, not "next shift." She relieved all pressure from the tailbone right away — repositioning Mrs. Underwood onto her side using the thirty-degree position, offloading the area completely with pillows. A coworker, busy, suggested finishing the bath and watching it later. Grace didn\'t wait: "It\'s not blanching — the damage has already started. If we keep pressure on it, it\'ll open. We offload it now." She reported it to the nurse promptly and precisely: "Non-blanching redness over Mrs. Underwood\'s tailbone, skin still intact, about the size of a quarter — I\'ve offloaded it completely." She did not call it a "stage 1" as a diagnosis or try to treat it — she described what she saw and let the nurse stage it.',
            '',
            '**The response:** The nurse assessed it, confirmed a stage 1 pressure injury, and adjusted the care plan: a pressure-redistributing surface, even more frequent offloading of that exact spot, and close monitoring. Because the skin was still intact and all pressure was kept off the area, the redness gradually resolved over the following days. It never broke open. It never became a wound.',
            '',
            '**The outcome:** Mrs. Underwood never developed an open pressure injury — no painful sore, no slow-healing crater, no infection risk, no suffering. And it was invisible as a victory: nothing bad happened, precisely because Grace\'s faithful repositioning had limited the damage in the first place, her constant inspection found the mark on day one, her blanch test recognized it for what it was, and her immediate offloading and report stopped it cold. The nurse told her: "A non-blanching red mark is the whole ballgame. Miss it, and in a week we\'re dressing an open wound for two months. You caught it and offloaded it the same morning. That\'s a sore that never happened."',
            '',
            '**Discussion:** Grace\'s case is pressure-injury prevention in its purest form. The faithful repositioning that limited the damage. The relentless inspection that found the mark while the skin was still whole. The blanch test — press, lift, watch — that told her this redness was already injury, not just pink skin. The immediate action, refusing "watch it next shift." And the precise report that stayed in scope: she described, she didn\'t stage; she offloaded, she didn\'t treat. Every piece was squarely CNA work, and together they turned a forming pressure injury into a wound that never opened. The sore that never happens is the highest achievement in this kind of care.',
          ].join('\n');

          return doc('Case Study', [
            { id: 'pi-s11-heading', type: 'heading', level: 1, text: 'Case Study' },
            pendingAudio(
              'pi-s11-audio',
              'The Mark That Didn\'t Turn White',
              `${ASSET_BASE}/s11-case-podcast.mp3`,
              caseNarrative,
              '/assets/courses/pressure-injuries/s11-case-podcast.mp3',
            ),
            {
              id: 'pi-s11-image',
              type: 'image',
              src: `${ASSET_BASE}/s11-hero.jpg`,
              caption:
                'Recognizing the pattern — how repositioning and quick reporting prevented a serious injury.',
            },
            {
              id: 'pi-s11-case-study',
              type: 'case_study',
              title: 'The Mark That Didn\'t Turn White',
              residentProfile:
                'Mrs. Underwood, 86, had advanced dementia and was largely bedbound after a decline in her mobility. She couldn\'t reposition herself, couldn\'t reliably tell anyone if something hurt, and spent most of her day and night in bed — every risk factor for a pressure injury stacked together. Her CNA, Grace, knew it, and treated her as the high-risk resident she was.',
              scenario: [
                '**The faithful routine:** Grace repositioned Mrs. Underwood at least every two hours, around the clock with her teammates, offloading her bony points with pillows, floating her heels, using the thirty-degree side-lying position rather than letting her rest on her hip. She kept her clean and dry, changing her promptly. And at every single care task, she inspected the skin — tailbone, hips, heels, shoulder blades — by sight and by gentle touch.',
                '**The catch:** One morning during her bath, Grace found it: a reddened area over Mrs. Underwood\'s tailbone. It would have been easy to dismiss — just a bit of pink on fragile skin. But Grace did the test that defines this work. She pressed a fingertip gently on the redness and lifted it. The spot stayed red. It did not turn white. Non-blanching. The skin was still intact — no open area — but the tissue underneath was already damaged. A stage 1 pressure injury, caught at the only moment it\'s easiest to stop.',
                '**What Grace did:** She acted immediately, not "next shift." She relieved all pressure from the tailbone right away — repositioning Mrs. Underwood onto her side using the thirty-degree position, offloading the area completely with pillows. A coworker, busy, suggested finishing the bath and watching it later. Grace didn\'t wait: "It\'s not blanching — the damage has already started. If we keep pressure on it, it\'ll open. We offload it now." She reported it to the nurse promptly and precisely: "Non-blanching redness over Mrs. Underwood\'s tailbone, skin still intact, about the size of a quarter — I\'ve offloaded it completely." She did not call it a "stage 1" as a diagnosis or try to treat it — she described what she saw and let the nurse stage it.',
                '**The response:** The nurse assessed it, confirmed a stage 1 pressure injury, and adjusted the care plan: a pressure-redistributing surface, even more frequent offloading of that exact spot, and close monitoring. Because the skin was still intact and all pressure was kept off the area, the redness gradually resolved over the following days. It never broke open. It never became a wound.',
                '**The outcome:** Mrs. Underwood never developed an open pressure injury — no painful sore, no slow-healing crater, no infection risk, no suffering. And it was invisible as a victory: nothing bad happened, precisely because Grace\'s faithful repositioning had limited the damage in the first place, her constant inspection found the mark on day one, her blanch test recognized it for what it was, and her immediate offloading and report stopped it cold. The nurse told her: "A non-blanching red mark is the whole ballgame. Miss it, and in a week we\'re dressing an open wound for two months. You caught it and offloaded it the same morning. That\'s a sore that never happened."',
                '**Discussion:** Grace\'s case is pressure-injury prevention in its purest form. The faithful repositioning that limited the damage. The relentless inspection that found the mark while the skin was still whole. The blanch test — press, lift, watch — that told her this redness was already injury, not just pink skin. The immediate action, refusing "watch it next shift." And the precise report that stayed in scope: she described, she didn\'t stage; she offloaded, she didn\'t treat. Every piece was squarely CNA work, and together they turned a forming pressure injury into a wound that never opened. The sore that never happens is the highest achievement in this kind of care.',
              ].join('\n\n'),
            },
            {
              id: 'pi-s11-reflection-1',
              type: 'reflection',
              prompt:
                'Grace pressed the red mark and it didn\'t turn white. Why is that non-blanching result so important, and why was acting immediately — rather than watching it next shift — the whole difference?',
              minCharacters: 50,
            },
            {
              id: 'pi-s11-reflection-2',
              type: 'reflection',
              prompt:
                'Grace reported "non-blanching redness, skin intact, about the size of a quarter" but did not call it a "stage 1" as a diagnosis. Why is describing what you see, rather than staging it, the correct role for a CNA?',
              minCharacters: 50,
            },
            {
              id: 'pi-s11-rp-text',
              type: 'text',
              body: 'Reflect on the case study in the previous lesson. Your written responses help you apply what you learned about the blanch test, non-blanching redness, immediate action, and describing-not-staging.',
            },
            {
              id: 'pi-s11-kc2-check',
              type: 'knowledge_check',
              question:
                'A CNA does not stage or diagnose pressure injuries, does not perform wound treatment or apply or select dressings beyond facility policy and training, and does not decide a wound\'s care — those belong to the nurse and the wound team. While bathing a bedbound resident you find non-blanching redness over the tailbone; a coworker says to finish the bath and watch it next shift. The CNA SHOULD:',
              options: [
                {
                  id: 'watch-next-shift',
                  label: 'Finish the bath and watch it next shift',
                },
                {
                  id: 'relieve-and-report',
                  label:
                    'Relieve all pressure from the tailbone now, reposition off it, and report it to the nurse promptly',
                },
                {
                  id: 'massage-area',
                  label: 'Massage the red area firmly to bring back circulation',
                },
                {
                  id: 'apply-dressing',
                  label: 'Select and apply a wound dressing to the area',
                },
              ],
              correctOptionId: 'relieve-and-report',
              explanation:
                'Non-blanching redness over a bony point is a stage 1 pressure injury — the tissue is already damaged, but the intact skin gives you a window to prevent an open wound. Relieve all pressure immediately, reposition off the area, and report it promptly. You never stage, diagnose, or treat the wound — but early offloading and reporting is squarely CNA work.',
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
            { id: 'pi-s12-heading', type: 'heading', level: 1, text: 'Conclusion' },
            {
              id: 'pi-s12-video',
              type: 'video',
              title: 'Conclusion',
              videoUrl: `${ASSET_BASE}/s12-conclusion.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s12-conclusion.mp4`,
            },
            {
              id: 'pi-s12-image',
              type: 'image',
              src: `${ASSET_BASE}/s12-hero.jpg`,
              caption: 'Five things that matter most in pressure injury prevention.',
            },
            {
              id: 'pi-s12-narration',
              type: 'text',
              body: [
                'You\'ve reached the end. Let\'s lock in the five things that matter most for pressure-injury care.',
                '**One.** Pressure injuries form when sustained pressure cuts off blood flow to the skin over bony points — and they are largely preventable. The damage is about pressure held too long, so relieving that pressure regularly is what prevents them. This is core CNA work, and you are the front line.',
                '**Two.** Reposition on the clock, and offload the bony points. Turn immobile residents at least every two hours in bed and more often in a chair, float the heels, use the thirty-degree side-lying position, and never lay a resident on a reddened area or wound. The repositioning clock is the single most powerful prevention there is.',
                '**Three.** Inspect constantly, and know the early sign. Check every pressure point, skin fold, and under every device, by sight and feel, at every task. And master the blanch test: redness over a bony point that does NOT turn white when pressed is a stage 1 pressure injury — the tissue is already damaged, but the intact skin gives you the window to stop it.',
                '**Four.** Act immediately, and report precisely. The instant you find non-blanching redness or any skin change, relieve all pressure and report it now — never "next shift." Describe exactly what you see — location, size, color, open or intact — without assigning a stage; the nurse stages it. And escalate infection signs — spreading redness, foul drainage, fever, new confusion — urgently.',
                '**Five.** Honor your scope, and protect the defenses. You never stage, diagnose, or treat the wound, and never massage a red area. But you reposition faithfully, inspect relentlessly, keep skin clean, dry, and nourished, act at the first sign, and report — and that daily work turns forming pressure injuries into sores that never happen.',
              ].join('\n\n'),
            },
            {
              id: 'pi-s12-summary',
              type: 'summary',
              title: 'Five things that matter most',
              items: [
                'Pressure injuries form from sustained pressure over bony points — largely preventable through CNA work.',
                'Reposition on the clock and offload bony points — at least every two hours in bed, more in a chair.',
                'Inspect constantly and master the blanch test — non-blanching redness is the early warning.',
                'Act immediately and report precisely — never "next shift"; describe, don\'t stage.',
                'Honor your scope — reposition, inspect, protect skin, act at the first sign, and report.',
              ],
            },
            {
              id: 'pi-s12-whn-text',
              type: 'text',
              body: 'Ten questions are waiting. Everything on them was covered here. You\'re ready. Trust what you\'ve learned, and show what you know.',
            },
            {
              id: 'pi-s12-cr-text',
              type: 'text',
              body: 'This course provides one hour of continuing education credit through CAL ACE Nursing Academy, an approved CDPH continuing education provider, NAC number 7384. Your certificate is generated automatically when you pass the knowledge check.',
            },
            {
              id: 'pi-s12-cr-callout',
              type: 'callout',
              variant: 'info',
              title: 'Scope reminder',
              body: 'CNAs reposition, inspect, and protect skin. CNAs do not stage or diagnose pressure injuries, perform wound treatment, or select dressings.',
            },
            {
              id: 'pi-s12-ca-text',
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

export async function seedCourse38PressureInjuries(
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
  console.log(`Seeding Course 38 (Pressure Injuries) as DRAFT — slug "${COURSE_SLUG}"…`);

  try {
    const result = await seedCourse38PressureInjuries(prisma);
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
