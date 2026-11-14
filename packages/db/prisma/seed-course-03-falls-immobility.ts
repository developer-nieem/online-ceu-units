/**
 * Seed Course 3 — Falls, Immobility & Deconditioning (DRAFT).
 *
 * V3 rebuild of the former "Mobility & Transfer Safety", reframed to the clinical
 * conditions the skills serve (falls, immobility complications, deconditioning).
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-03-falls-immobility
 *
 * Idempotent upserts by slug. Self-cleans stray modules on the target DRAFT version.
 * Does not seed the final quiz (pending owner approval; see the -exam.ts file).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CONFIRMED against the live DB (read-only inspection):
 *   COURSE_SLUG    = 'mobility-safety'  (FROZEN — course already live)
 *   VERSION_NUMBER = 5                  (Targets v5 DRAFT — editable.
 *                                        v4 is LIVE PUBLISHED (cert XSRFRQ);
 *                                        v2 RETIRED holds 3 certs — NEVER target v2.)
 * Only the DISPLAY TITLE changes (to the falls/immobility framing) — NOT the slug.
 * DRAFT-only. Run order: this main seed first, then the -exam seed.
 *
 * SAFETY-CRITICAL CONTENT: the "never move a fallen resident before the nurse
 * assesses" rule is taught throughout. This iron rule must be preserved exactly.
 * ─────────────────────────────────────────────────────────────────────────────
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

// CONFIRMED against live DB — FROZEN slug (course already live).
const COURSE_SLUG = 'mobility-safety';

// Display title changes to the falls/immobility framing; slug stays frozen above.
const COURSE_TITLE = 'Mobility Decline, Bedrest Risks, and Fall Prevention';
const COURSE_SUMMARY =
  'Break the fall-fear-weakness spiral: understand why elders fall and why immobility is dangerous, prevent falls, assist transfers and mobility safely with gait belts and good body mechanics, respond correctly when a resident falls (never move them before assessment), and keep residents moving against deconditioning.';

// CONFIRMED against live DB — target v5 DRAFT (editable). NEVER target v2 (RETIRED, 3 certs).
const VERSION_NUMBER = 5;

const DEFAULT_CATALOG = {
  price: 3.75,
  durationMinutes: 70,
  difficulty: 'intermediate',
  instructor: 'CAL ACE Faculty',
  featured: false,
  hasFreePreview: false,
  subscriptionEligible: true,
};

const DEFAULT_CONTENT_META = {
  overview: COURSE_SUMMARY,
  learningObjectives: [
    'Understand why elders fall and why immobility and deconditioning are dangerous',
    'Prevent falls through environment, footwear, call-light response, and staged rising',
    'Assist transfers and movement safely using gait belts and good body mechanics',
    'Respond correctly when a resident falls — never moving them before the nurse assesses',
    'Keep residents moving to prevent deconditioning, and report falls and changes',
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
  heroImage: '/assets/courses/falls/hero-banner.jpg',
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
    title: 'Mobility Decline, Bedrest Risks, and Fall Prevention',
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: 'Introduction',
        sortOrder: 0,
        buildContent: () =>
          doc('Introduction', [
            { id: 'fall-s01-heading', type: 'heading', level: 1, text: 'Introduction' },
            {
              id: 'fall-s01-video',
              type: 'video',
              title: 'Introduction',
              videoUrl: '/assets/courses/falls/s01-intro.mp4',
              placeholderNote: 'Pending upload: /assets/courses/falls/s01-intro.mp4',
            },
            {
              id: 'fall-s01-image',
              type: 'image',
              src: '/assets/courses/falls/s01-hero.jpg',
              caption: 'A CAL ACE CNA supporting safe mobility for an elderly resident.',
            },
            {
              id: 'fall-s01-narration',
              type: 'text',
              body: [
                'Welcome to CAL ACE Nursing Academy.',
                'This course is about falls, immobility, and deconditioning — three dangers so connected they form a single story, and a story you stand at the center of. Falls are one of the gravest threats to older adults. Immobility — not moving — quietly damages nearly every system in the body. And deconditioning — the weakness that comes from not moving — sets up the next fall. Your daily work breaks this cycle.',
                'Let\'s look at each. A fall, for an older adult, is never a small thing. Falls are a leading cause of injury in elders — broken hips, head injuries, hospitalization — and even a fall without injury can change everything, because the fear of falling again makes a person move less. Many residents in your care have already fallen, and most are at risk.',
                'Now immobility. It seems harmless — a resident resting in bed or sitting all day. But the body is built to move, and when it doesn\'t, damage begins remarkably fast. Muscles weaken and shrink. Joints stiffen into contractures. Skin breaks down into pressure injuries, as you may know from other training. Lungs collect fluid, inviting pneumonia. Blood pools and clots can form. Bones thin. Bowels slow. Mood sinks. Immobility is not rest — over time, it is harm.',
                'And deconditioning ties the story together. Deconditioning is the loss of strength, balance, and fitness that comes from inactivity — and in an older adult, it happens shockingly fast. Days in bed can cost strength that takes weeks to rebuild. Here\'s the vicious cycle to understand: a fall leads to fear and less movement, less movement leads to weakness, and weakness leads to the next fall. Left alone, this cycle spirals a resident downward. Your job is to break it.',
                'This course teaches the skills that break the cycle: how to prevent falls — the environment, the footwear, the call light, the answer to "why do they fall." How to assist movement safely — transfers, gait belts, body mechanics that protect the resident and your own back. What to do when a resident falls or is found on the floor — and the iron rule there: do not move them until the nurse assesses, because moving a person with an unseen fracture or injury can make it far worse. And how to keep residents moving — because every walk, every transfer, every bit of activity you support is medicine against deconditioning.',
                'The guiding spirit of this course: movement is medicine, and every fall prevented is a life protected. Keeping residents safely moving is some of the most valuable work a CNA does.',
                'Your scope is clear. A CNA prevents falls, assists transfers and mobility safely, uses gait belts and good body mechanics, keeps residents active per the care plan, repositions immobile residents, responds correctly to falls — never moving a fallen resident before assessment — and reports. A CNA does not diagnose injuries, does not move a fallen resident before the nurse assesses them, and does not decide or change a resident\'s activity orders.',
                'By the end of this course, you will be able to: understand why elders fall and why immobility is dangerous. Prevent falls. Assist transfers and movement safely. Respond correctly when a resident falls. And keep residents moving against deconditioning. Let\'s begin.',
              ].join('\n\n'),
            },
            {
              id: 'fall-s01-callout',
              type: 'callout',
              variant: 'warning',
              title: 'The iron rule',
              body: 'When a resident falls or is found on the floor, do NOT move them until the nurse assesses. Moving a person with an unseen fracture or injury can make it far worse. Stay, call, observe, reassure.',
            },
          ]),
      },
      {
        slug: 's02-terms',
        title: 'Terms & Definitions',
        sortOrder: 1,
        buildContent: () =>
          doc('Terms & Definitions', [
            { id: 'fall-s02-heading', type: 'heading', level: 1, text: 'Terms & Definitions' },
            {
              id: 'fall-s02-image',
              type: 'image',
              src: '/assets/courses/falls/s02-hero.jpg',
              caption: 'Proper gait belt use before a transfer.',
            },
            {
              id: 'fall-s02-reveal-fall',
              type: 'reveal_card',
              frontTitle: 'Fall',
              frontBody: 'Fall',
              backTitle: 'Fall',
              backBody:
                'Any event where a resident unintentionally comes to rest on the floor or a lower level — whether or not they\'re injured. Every fall counts and every fall is reported, even "small" ones with no visible harm, because injuries can hide and every fall is a warning sign of the next. For an older adult, a fall is never a minor event.',
            },
            {
              id: 'fall-s02-reveal-risk-factors',
              type: 'reveal_card',
              frontTitle: 'Fall Risk Factors',
              frontBody: 'Fall risk factors',
              backTitle: 'Fall Risk Factors',
              backBody:
                'The things that make a resident more likely to fall — weakness, poor balance, vision problems, medications that cause dizziness, confusion, rushing to the bathroom, unsafe footwear, clutter, and a history of falling. Knowing each resident\'s risk factors tells you what to watch and what to fix. The biggest single predictor of a fall is a previous fall.',
            },
            {
              id: 'fall-s02-reveal-immobility',
              type: 'reveal_card',
              frontTitle: 'Immobility',
              frontBody: 'Immobility',
              backTitle: 'Immobility',
              backBody:
                'Not moving — being confined to bed or chair, or moving very little. The body is built for movement, and immobility damages nearly every system: muscles, joints, skin, lungs, circulation, bones, bowels, and mood. Immobility is not harmless rest; over time it causes real, serious complications.',
            },
            {
              id: 'fall-s02-reveal-deconditioning',
              type: 'reveal_card',
              frontTitle: 'Deconditioning',
              frontBody: 'Deconditioning',
              backTitle: 'Deconditioning',
              backBody:
                'The loss of strength, balance, and fitness that comes from inactivity — and it happens fast in older adults. Even a few days in bed can cost real strength that takes weeks to rebuild. Deconditioning is what links a hospital stay or an illness to the falls and decline that follow. Activity is how it\'s prevented and reversed.',
            },
            {
              id: 'fall-s02-reveal-contracture',
              type: 'reveal_card',
              frontTitle: 'Contracture',
              frontBody: 'Contracture',
              backTitle: 'Contracture',
              backBody:
                'A joint that has stiffened and tightened into a bent position because it wasn\'t moved — the muscles and tissues shorten until the joint can hardly straighten. Contractures are painful, disabling, and largely preventable through movement, repositioning, and range-of-motion exercises as directed. Once formed, they\'re very hard to undo.',
            },
            {
              id: 'fall-s02-reveal-gait-belt',
              type: 'reveal_card',
              frontTitle: 'Gait Belt',
              frontBody: 'Gait belt',
              backTitle: 'Gait Belt',
              backBody:
                'A sturdy belt placed around a resident\'s waist that gives you a secure grip when helping them stand, transfer, or walk. Used correctly — snug, over clothing, gripped with an underhand hold — it protects both the resident and your back. Never lift or pull a resident by their arms or clothing; use the belt and your legs.',
            },
            {
              id: 'fall-s02-reveal-body-mechanics',
              type: 'reveal_card',
              frontTitle: 'Body Mechanics',
              frontBody: 'Body mechanics',
              backTitle: 'Body Mechanics',
              backBody:
                'Using your body safely when assisting and lifting — feet apart for a wide base, bend your knees not your back, keep the load close, lift with your legs, don\'t twist, and get help or equipment for heavy tasks. Good body mechanics protect your back for a whole career; one careless lift can injure it for life.',
            },
            {
              id: 'fall-s02-reveal-orthostatic',
              type: 'reveal_card',
              frontTitle: 'Orthostatic Hypotension',
              frontBody: 'OR-tho-STAT-ik',
              backTitle: 'Orthostatic Hypotension',
              backBody:
                'A drop in blood pressure when a person stands up, causing dizziness or even fainting — common in elders and a major cause of falls. The protection is simple: have residents rise slowly, in stages — sit up first, sit at the edge of the bed, then stand — and steady them before walking.',
            },
            {
              id: 'fall-s02-knowledge-check',
              type: 'knowledge_check',
              question: 'Which term means the fast loss of strength from inactivity — days in bed, weeks to rebuild?',
              options: [
                { id: 'deconditioning', label: 'Deconditioning' },
                { id: 'contracture', label: 'Contracture' },
                { id: 'orthostatic', label: 'Orthostatic hypotension' },
              ],
              correctOptionId: 'deconditioning',
              explanation:
                'Deconditioning — the loss of strength, balance, and fitness from inactivity, which happens fast in older adults: even a few days in bed can cost strength that takes weeks to rebuild. Activity is how it\'s prevented and reversed.',
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
            { id: 'fall-s03-heading', type: 'heading', level: 1, text: 'Statistics' },
            {
              id: 'fall-s03-image',
              type: 'image',
              src: '/assets/courses/falls/s03-hero.jpg',
              caption: 'Fall-risk awareness is part of everyday care.',
            },
            pendingAudio(
              'fall-s03-audio',
              'Falls and Immobility: The Spiral That Daily Care Can Stop',
              '/assets/courses/falls/s03-stats-podcast.mp3',
              [
                'Falls and Immobility: The Spiral That Daily Care Can Stop',
                '',
                'Falls are among the most serious threats facing older adults. They are a leading cause of injury, injury-related hospitalization, and injury-related death in elders. Each year, a large share of older adults fall, and in long-term care settings falls are dramatically more common still — residents there are older, frailer, and carry more risk factors, and many fall repeatedly. The injuries are grave: hip fractures, which often mark a permanent turning point in an elder\'s independence and survival; head injuries, made more dangerous by the blood thinners many elders take; and fractures and wounds of every kind. And beyond the visible injuries lies a quieter casualty: confidence. Even an uninjured fall commonly leaves fear — fear that makes a person move less, which is exactly the wrong direction.',
                '',
                'That\'s because of the spiral at the heart of this topic. A fall leads to fear and restricted movement. Less movement leads to deconditioning — and deconditioning in older adults is astonishingly fast: significant strength can be lost in just days of bed rest, and what\'s lost in days takes weeks or months to rebuild, if it\'s rebuilt at all. Weakness and worse balance then make the next fall more likely, and the spiral tightens — fall, fear, immobility, weakness, fall — carrying a resident from independence toward decline. Understanding this spiral is the key insight of the whole topic, because every part of it can be interrupted by daily care: falls can be prevented, fear can be met with safe supported movement, and deconditioning can be fought with activity.',
                '',
                'Immobility itself deserves its own respect, because its harm goes far beyond weakness. The body is built for movement, and when movement stops, nearly every system suffers — a pattern well documented as the hazards of bed rest. Muscles waste and joints stiffen toward contractures. Skin under unrelieved pressure breaks down into pressure injuries, which is why repositioning exists. Lungs ventilate poorly and secretions pool, inviting pneumonia. Circulation slows and clots can form in the legs, which can travel to the lungs with deadly effect. Bones lose density. Digestion slows into constipation. Bladder problems and infections increase. And mood and thinking dim — immobility feeds depression and confusion. The phrase to remember: immobility is not rest; sustained, it is harm to nearly everything.',
                '',
                'Here\'s the empowering core: the defenses against this entire spiral are overwhelmingly delivered by CNAs. Fall prevention is mostly environmental and behavioral — clear pathways, good lighting, proper footwear, call lights within reach and answered promptly, toileting help before the desperate rush, slow staged rising against dizziness — all daily CNA work. Safe transfer and walking assistance, with gait belts and sound body mechanics, prevents both resident falls and caregiver injuries. The response to a fall — not moving the resident until assessment — prevents a bad injury from becoming a catastrophic one. And the counterattack on deconditioning is simply movement: every supported walk, every transfer done with the resident\'s own effort, every encouragement to do what they can, is strength preserved. Research consistently shows that mobility programs and fall-prevention measures in care settings reduce falls and preserve function. The bottom line: falls and immobility form a deadly spiral, deconditioning is fast and recovery slow — and the CNA\'s prevention, safe assistance, correct fall response, and daily commitment to movement are what stop the spiral.',
              ].join('\n'),
              '/assets/courses/falls/s03-stats-podcast.mp3',
            ),
            {
              id: 'fall-s03-source-note',
              type: 'callout',
              variant: 'clinical',
              title: 'About these figures',
              body: 'This section describes falls and immobility qualitatively (e.g., "a leading cause of injury," "a large share of older adults fall") rather than citing specific numbers. Any precise statistic added later must come from a named, verifiable source (e.g., CDC falls data, hazards-of-bed-rest research) — not from estimation.',
            },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: 'Fundamentals',
        sortOrder: 3,
        buildContent: () =>
          doc('Fundamentals', [
            { id: 'fall-s04-heading', type: 'heading', level: 1, text: 'Fundamentals' },
            {
              id: 'fall-s04-video',
              type: 'video',
              title: 'Fundamentals',
              videoUrl: '/assets/courses/falls/s04-fundamentals.mp4',
              placeholderNote: 'Pending upload: /assets/courses/falls/s04-fundamentals.mp4',
            },
            {
              id: 'fall-s04-image',
              type: 'image',
              src: '/assets/courses/falls/s04-hero.jpg',
              caption: 'Safe transfers use proper body mechanics.',
            },
            {
              id: 'fall-s04-narration',
              type: 'text',
              body: [
                '**Why elders fall**',
                'Falls almost always have reasons, and they stack. Inside the body: weakness, poor balance, stiff joints, vision loss, dizziness — especially on standing — confusion, and medications that sedate or drop blood pressure. In the environment: clutter, cords, spills, poor lighting, bad footwear, beds too high, and things out of reach. In the moment: rushing — most often rushing to the bathroom. A resident with several factors is a fall waiting for a trigger. Your power lies in fixing the factors you can: the environment, the footwear, the rushing, the rising.',
                '**The spiral: fall, fear, weakness, fall**',
                'Hold this picture, because it organizes everything. A fall — even without injury — plants fear. Fear makes the resident move less. Less movement causes deconditioning: weaker muscles, worse balance. And weakness invites the next fall, which deepens the fear. Around and around, spiraling a person from independence toward a bed or chair. Breaking this spiral is the mission of this course — by preventing the fall, by meeting the fear with safe, supported movement, and by fighting the weakness with daily activity.',
                '**What immobility does to the body**',
                'Immobility damages nearly every system, and faster than people think. Muscles shrink and weaken. Joints stiffen toward contractures — bent, frozen positions that are painful and hard to undo. Skin breaks down under pressure into pressure injuries. Lungs work poorly and invite pneumonia. Blood pools in the legs, where dangerous clots can form. Bones thin. Bowels slow into constipation. And mood and mind dim — immobility feeds depression and confusion. Remember the phrase: immobility is not rest. A resident left unmoving is a resident being harmed.',
                '**Deconditioning: fast to lose, slow to rebuild**',
                'Deconditioning is the cruel math of inactivity in elders: strength is lost fast and rebuilt slowly. A few days in bed during an illness can cost a meaningful share of muscle strength — and what vanished in days takes weeks or months of work to regain, if it returns at all. This is why "just resting" through and after an illness is so dangerous for an older adult, and why every bit of activity matters: every supported walk, every transfer the resident powers themselves, every task they do with their own hands is strength banked against decline. Movement is medicine — dose it daily.',
                '**Safe transfers: the gait belt and the setup**',
                'Transfers — bed to chair, chair to toilet, sit to stand — are where falls and injuries happen most, so do them right every time. Prepare first: explain to the resident, lock the wheelchair and bed wheels, clear the path, proper footwear on, bed at the right height. Use the gait belt — snug around the waist over clothing, gripped underhand — never lift or pull by the arms, which can injure shoulders and gives no control. Let the resident do what they can — their effort is exercise. Move on a signal, together. A prepared, belted, unhurried transfer protects everyone.',
                '**Body mechanics: protect your back for a career**',
                'Your back has to last a career, and one careless lift can end that. The rules: stand with feet apart for a wide, stable base. Bend your knees, never your waist — lift with your legs. Keep the resident or load close to your body. Never twist while lifting — turn your feet instead. Push rather than pull when you can. And know your limits: get a second person or mechanical lift for heavy or dependent residents, per the care plan — being "strong enough" is how backs get destroyed. Protecting your body is part of the job, not an extra.',
                '**Rising slowly: beating the dizziness that drops residents**',
                'One hidden fall cause deserves its own focus: orthostatic hypotension — the blood-pressure drop on standing that makes elders dizzy or faint, especially with certain medications or dehydration. The defense is simple and powerful: rise in stages. Sit up in bed first, and pause. Sit at the edge with feet on the floor, and pause — let the dizziness pass. Then stand, steady, and pause again before walking. Never haul a resident straight up from lying to standing. Those small pauses prevent the head-rush that ends in a fall.',
              ].join('\n\n'),
            },
            {
              id: 'fall-s04-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Movement is medicine',
              body: 'Immobility is not rest — sustained, it harms nearly every body system. Every supported walk, every transfer the resident powers themselves, every self-done task is strength banked against the fall-and-weakness spiral. Never do for a resident what they can safely do themselves.',
            },
          ]),
      },
    ],
  },
  {
    slug: 'module-2',
    title: 'Recognizing, Preventing, and Assisting Safely',
    sortOrder: 1,
    lessons: [
      {
        slug: 's05-signs',
        title: 'Signs & Symptoms',
        sortOrder: 0,
        buildContent: () =>
          doc('Signs & Symptoms', [
            { id: 'fall-s05-heading', type: 'heading', level: 1, text: 'Signs & Symptoms' },
            {
              id: 'fall-s05-image',
              type: 'image',
              src: '/assets/courses/falls/s05-hero.jpg',
              caption: 'Watch for unsteady gait and fall-risk signs.',
            },
            {
              id: 'fall-s05-narration',
              type: 'text',
              body: [
                'You are the eyes that catch rising fall risk, creeping weakness, and hidden injury after a fall. Let\'s learn what to watch for.',
                '**The signs of rising fall risk**',
                'Watch for the warning signs that a resident\'s fall risk is climbing. New or worsening unsteadiness — swaying, shuffling, grabbing furniture and walls. Near-falls and stumbles — every near-miss predicts a real one. New dizziness, especially when standing up. New confusion, which multiplies risk. Weakness — more trouble standing from a chair, needing more help than before. Changes after a medication change, which can bring sedation or dizziness. Unsafe footwear, slippery socks, or an environment growing cluttered. And above all, a recent fall — the strongest predictor of the next fall is the last one. Report rising risk so the team can act before the fall, not after.',
                '**The signs of deconditioning and immobility harm**',
                'Watch the slow slide of deconditioning and immobility. A resident doing less week by week — walking shorter distances, needing more help to stand, transferring with more difficulty. Spending more and more time in bed or the chair. Stiffening joints, or limbs starting to hold a bent position — early contracture. Skin redness over pressure points — the pressure-injury warning you know. Swelling, warmth, or pain in a calf — possible blood clot, report promptly. New constipation. Low mood and withdrawal. These quiet signs mean the spiral is turning — report them, because early action rebuilds what late action can\'t.',
                '**After a fall: the injury signs, and the iron rule**',
                'When a resident falls or is found on the floor, the iron rule comes first: do not move them. Stay with them, call for the nurse, keep them calm and still. Then observe for injury signs while you wait: pain — especially hip, leg, or back pain. A leg that looks shortened or turned outward — a classic hip-fracture sign. Inability to move a limb, or pain when trying. Any head strike, bleeding, or bump — head injuries matter enormously, especially on blood thinners. Confusion, drowsiness, or vomiting after a fall. Cuts, swelling, bruising. Report everything you observe — and remember that some injuries hide, which is why even the "fine" resident is assessed and watched.',
                '**What to report, always**',
                'Report it all, and report it honestly. Every fall — witnessed or found down — every time, even with no visible injury; unreported falls hide injuries and erase the warning the team needs. Every near-fall and stumble. Rising risk: new unsteadiness, dizziness, confusion, weakness. The deconditioning slide: doing less, more time in bed, stiffening, skin redness, calf swelling. And after any fall: the injury signs, and any later changes — new confusion, drowsiness, or pain appearing hours after, which can signal a hidden injury, especially of the head. Your honest, complete reporting is what turns a fall into prevention of the next one.',
              ].join('\n\n'),
            },
            {
              id: 'fall-s05-callout',
              type: 'callout',
              variant: 'warning',
              title: 'After a fall — never move, always report',
              body: 'Found a resident down? Do not move them — stay, call the nurse, keep them still, observe for hip pain, a shortened or outward-turned leg, head strike, or confusion. Report every fall, every time, even with no visible injury — and watch for changes in the hours after.',
            },
          ]),
      },
      {
        slug: 's06-causes',
        title: 'Causes',
        sortOrder: 1,
        buildContent: () =>
          doc('Causes', [
            { id: 'fall-s06-heading', type: 'heading', level: 1, text: 'Causes' },
            {
              id: 'fall-s06-image',
              type: 'image',
              src: '/assets/courses/falls/s06-hero.jpg',
              caption: 'Removing environmental hazards prevents falls.',
            },
            pendingAudio(
              'fall-s06-audio',
              'Why Elders Fall and Weaken — and Which Causes the CNA Removes',
              '/assets/courses/falls/s06-causes-podcast.mp3',
              [
                'Why Elders Fall and Weaken — and Which Causes the CNA Removes',
                '',
                'Falls and deconditioning almost never have a single cause — they come from factors stacking until a trigger tips them over. The encouraging truth: many of the heaviest factors are ones a CNA directly controls.',
                '',
                'Start inside the aging body. Muscles naturally lose mass and strength with age, and balance systems — vision, inner ear, the position sense in joints — all dull. Vision loss hides hazards and edges. Many elders have conditions that impair movement or sensation: arthritis, Parkinson\'s, stroke effects, neuropathy from diabetes that numbs the feet, and heart and lung disease that limit stamina. Cognitive impairment adds risk: a confused resident may forget their limits, forget the call light, or try to walk alone. None of these can a CNA cure — but knowing them tells you who needs the closest watching.',
                '',
                'Medications are a major, often underappreciated cause. Sedatives and sleep aids, many psychiatric medications, opioid pain medicines, and blood-pressure drugs can cause drowsiness, slowed reactions, and dizziness — particularly the blood-pressure drop on standing called orthostatic hypotension. The more medications, the higher the risk. The CNA\'s part: notice and report new unsteadiness or dizziness after medication changes, and protect against the standing drop by having residents rise slowly, in stages.',
                '',
                'Then come the causes the CNA most directly owns — the environment and the moments of care. Clutter, cords, and spills in pathways. Poor lighting, especially on the night route to the bathroom. Slippery socks, loose slippers, bare feet. Beds left high, wheelchairs unlocked during transfers, call lights out of reach. And the single most dangerous moment in many facilities: the rush to the bathroom — a resident with an urgent bladder who can\'t wait for help, or whose call light goes unanswered, gets up alone and falls. Proactive toileting, prompt call-light response, clear lit paths, proper footwear, locked wheels, and staged rising remove these causes outright — they are fall prevention in its purest form.',
                '',
                'Deconditioning\'s causes are simpler and sadder: inactivity, from illness, hospitalization, fear after a fall, pain, depression, or — honestly — care routines that find it faster to do things for residents than to support them doing things themselves. Every transfer done entirely by staff that the resident could have helped power, every day without a walk that was possible, is a small deposit into weakness. The reversal is just as concrete: activity as ordered, residents doing what they can, walks taken, movement encouraged — strength is preserved by using it.',
                '',
                'The takeaway: falls come from body, medication, and environment factors stacking — and the CNA removes the environmental and situational causes, protects against the medication effects, reports the body\'s changes, and fights deconditioning with daily movement. You can\'t change aging; you can absolutely change the floor, the footwear, the lighting, the rising, the rushing, and the activity — and those change everything.',
              ].join('\n'),
              '/assets/courses/falls/s06-causes-podcast.mp3',
            ),
          ]),
      },
      {
        slug: 's07-medications',
        title: 'Prevention, Safe Assistance & Fall Response',
        sortOrder: 2,
        buildContent: () =>
          doc('Prevention, Safe Assistance & Fall Response', [
            { id: 'fall-s07-heading', type: 'heading', level: 1, text: 'Prevention, Safe Assistance & Fall Response' },
            {
              id: 'fall-s07-image',
              type: 'image',
              src: '/assets/courses/falls/s07-hero.jpg',
              caption: 'Supported, confident walking with a gait belt.',
            },
            {
              id: 'fall-s07-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of practice',
              body: 'A CNA does not diagnose injuries, never moves a fallen resident before the nurse assesses them, and does not decide or change a resident\'s activity level or transfer status — the care plan does. Your role is daily prevention, safe assistance, correct fall response, and movement support.',
            },
            {
              id: 'fall-s07-narration',
              type: 'text',
              body: [
                'Falls and deconditioning are managed by the whole team — nurses, therapists, physicians — but nearly all the daily prevention and the safe assistance happen at the bedside, in the hallway, and on the bathroom route, and that work is the CNA\'s. Let\'s walk through it, starting with the rules that never bend. A CNA does not diagnose injuries, never moves a fallen resident before the nurse assesses them, and does not decide or change a resident\'s activity level or transfer status — the care plan does.',
                '**The fall-prevention bundle — your daily shield.** Run it constantly. Keep pathways clear, dry, and well-lit — especially the night route to the bathroom. Proper footwear, never slippery socks or bare feet. Call light always within reach — and answered promptly, because unanswered calls become solo bathroom trips. Toilet proactively, before urgency forces a rush. Keep beds low and wheels locked. Keep needed items within reach. Know each resident\'s risk level and watch the high-risk closest. This unglamorous bundle prevents more falls than anything else in the building.',
                '**Safe transfers and walking — technique every time.** Prepare: explain, lock all wheels, clear the path, footwear on, bed height right. Gait belt on — snug, over clothing, underhand grip — and never lift or pull by the arms or clothing. Use your body mechanics: wide base, bend the knees, load close, no twisting, lift with the legs. Let the resident power what they can — that\'s their exercise. Move together on a signal, at their pace. And get help or mechanical lifts for dependent residents per the care plan — heroics injure backs and drop residents.',
                '**Protect against the standing drop.** Have residents rise in stages, every time: sit up, pause; edge of bed, feet down, pause until any dizziness passes; stand, steady, pause; then walk. Report new dizziness on standing, especially after medication changes — it\'s a fixable fall cause hiding in plain sight.',
                '**When a resident falls — the response that protects.** Do not move them. Stay with them, call for the nurse immediately, keep them calm and still, and keep them warm and reassured. Observe while you wait: pain, the shortened outward-turned leg of a hip fracture, head strike, bleeding, confusion. Let the nurse assess before any movement — moving an unassessed fracture or spine injury can turn bad into catastrophic. Afterward, report everything, including changes that appear hours later. And every fall gets reported — every single one, injury or not.',
                '**Movement as medicine — fight deconditioning daily.** Support the activity the care plan orders: walks, transfers with the resident\'s own effort, range-of-motion as directed, time out of bed. Reposition immobile residents on schedule, as you learned in pressure-injury care. Encourage residents to do what they can — dressing, grooming, feeding — because every self-done task is strength preserved. Never default to doing it all for them because it\'s faster; speed today buys weakness tomorrow.',
                'The scope point for this section: you never diagnose, never move a fallen resident before assessment, and never change activity orders — but you run the prevention bundle, transfer safely, protect the rising, respond to falls correctly, and dose movement daily. That is the care that stops the spiral.',
              ].join('\n\n'),
            },
            {
              id: 'fall-s07-never-callout',
              type: 'callout',
              variant: 'warning',
              title: 'Never move a fallen resident before assessment',
              body: 'When a resident falls, do NOT move them before the nurse assesses — stay, call, observe, reassure. Keep call lights in reach and answered fast. Toilet before the rush. Rise in stages. Gait belt, never the arms. Every fall reported, every time. Movement is medicine — never do for them what they can do.',
            },
          ]),
      },
      {
        slug: 's08-prevention',
        title: 'Prevention',
        sortOrder: 3,
        buildContent: () =>
          doc('Prevention', [
            { id: 'fall-s08-heading', type: 'heading', level: 1, text: 'Prevention' },
            {
              id: 'fall-s08-image',
              type: 'image',
              src: '/assets/courses/falls/s08-hero.jpg',
              caption: 'Everyday fall-prevention habits at the bedside.',
            },
            {
              id: 'fall-s08-narration',
              type: 'text',
              body: [
                'With falls and deconditioning, prevention is daily, concrete, and largely in your hands. Here are seven ways.',
                '**One. Keep the path clear, dry, and lit.** Sweep your eyes over every room and route: clutter moved, cords tucked, spills wiped immediately, lighting working — especially the night path to the bathroom. A clear, lit path is the simplest fall prevention there is, and it\'s yours to maintain every shift.',
                '**Two. Footwear, every time.** Proper, well-fitting, non-slip footwear before any walking or transfer — never slippery socks, loose slippers, or bare feet. It takes thirty seconds and prevents the slips that break hips. Make it automatic: no walking without safe footwear.',
                '**Three. Call light in reach — and answered fast.** Keep the call light within reach every time you leave a room, and answer calls promptly — because an unanswered call becomes a resident getting up alone, usually rushing to the bathroom, which is where so many falls happen. A fast response is fall prevention.',
                '**Four. Toilet proactively — beat the rush.** Offer bathroom help on a regular schedule, before urgency strikes — because the desperate solo rush to the toilet is one of the most dangerous moments in elder care. Knowing your residents\' patterns and getting ahead of them removes that moment entirely.',
                '**Five. Stage every rising.** Sit up, pause. Edge of the bed, feet down, pause until steady. Stand, pause. Then walk. Every time, with every resident — because the dizziness of standing too fast quietly drops elders every day. Those small pauses are free, and they prevent real falls.',
                '**Six. Transfer right, every time.** Prepare, lock the wheels, belt on, underhand grip, your knees bent and the resident close, move on a signal, at their pace — and get help or the lift when the care plan calls for it. No rushed transfers, no pulling by the arms, no heroics. Right technique every time protects the resident and your back.',
                '**Seven. Keep them moving — movement is medicine.** Support every walk, every activity, every transfer the resident powers themselves, and encourage residents to do what they can — dressing, grooming, feeding. Reposition those who can\'t move themselves. Every bit of movement is strength banked against deconditioning, and strength is what prevents the next fall. Don\'t let "it\'s faster to do it for them" steal their strength.',
              ].join('\n\n'),
            },
          ]),
      },
    ],
  },
  {
    slug: 'module-3',
    title: 'Fall Response, Role, and Application',
    sortOrder: 2,
    lessons: [
      {
        slug: 's09-emergency',
        title: 'When to Call Emergency or Doctor',
        sortOrder: 0,
        buildContent: () =>
          doc('When to Call Emergency or Doctor', [
            {
              id: 'fall-s09-heading',
              type: 'heading',
              level: 1,
              text: 'When to Call Emergency or Doctor',
            },
            pendingAudio(
              'fall-s09-intro-audio',
              'Fall response and refusing the shortcuts — intro',
              '/assets/courses/falls/s09-emergency-intro.mp3',
              'With falls, the judgments that matter most are responding correctly the moment you find a resident on the floor, and refusing the shortcuts that cause falls in the first place. You\'re about to work through two situations. Read each carefully, choose your action, and you\'ll get feedback right away. Keep the core ideas in mind: a fallen resident is never moved before the nurse assesses them — stay, call, observe — and every fall is reported, every time, even when the resident seems fine.',
              '/assets/courses/falls/s09-emergency-intro.mp3',
            ),
            {
              id: 'fall-s09-image',
              type: 'image',
              src: '/assets/courses/falls/s09-hero.jpg',
              caption: 'Never move a fallen resident before assessment — stay, reassure, call for help.',
            },
            {
              id: 'fall-s09-scenario-found-image',
              type: 'image',
              src: '/assets/courses/falls/s09-scenario-found.jpg',
              caption: 'Found on the floor: do not lift before nurse assessment.',
            },
            {
              id: 'fall-s09-scenario-found-down',
              type: 'scenario_question',
              prompt:
                'You find Mrs. Kowalski on the floor of her room — she apparently fell trying to walk to the bathroom alone. She\'s awake and talking, says her hip "hurts a little," and her right leg looks slightly shorter than the left and turned outward. A coworker passing by says, "Come on, let\'s get her up into bed quick before anyone sees — she\'s talking fine, she\'s okay." What SHOULD the CNA do?',
              options: [
                {
                  id: 'lift-quick',
                  label: 'Help the coworker lift her quickly into bed since she\'s talking fine',
                  feedback:
                    'Mrs. Kowalski has hip pain and a shortened, outward-turned leg — classic hip-fracture signs — and moving her before the nurse assesses could make a serious injury catastrophic. "She\'s talking fine" doesn\'t rule out a fracture, and "before anyone sees" is the opposite of right: every fall is reported, every time. The right response: do NOT move her — stay with her, call the nurse immediately, keep her calm and still, and observe while you wait.',
                },
                {
                  id: 'do-not-move',
                  label: 'Do NOT move her — stay with her, call for the nurse immediately, keep her calm and still, and observe her while you wait',
                  feedback:
                    'Exactly right — and this judgment protects her from catastrophe. Mrs. Kowalski is showing the classic signs of a hip fracture: hip pain plus a leg that looks shortened and turned outward. Lifting her now — before the nurse assesses her — could turn a fracture into a far worse injury: displacing broken bone, damaging blood vessels and nerves, multiplying her pain and harm. "She\'s talking fine" means nothing about her bones; people with fractures talk fine. And "before anyone sees" is exactly backwards — every fall is reported, every time, because hiding falls hides injuries and erases the warning the team needs. The right response is the iron rule: do not move her. Stay with her so she\'s never alone, call for the nurse immediately, keep her calm, still, and warm, reassure her, and observe while you wait — the pain, the leg position, any head strike, any confusion — so you can report exactly what you see. The nurse assesses; only then is she moved, the safe way.',
                  isRecommended: true,
                },
                {
                  id: 'help-stand',
                  label: 'Help her stand up to see if she can walk',
                  feedback:
                    'Helping her stand is moving her before assessment — exactly what the iron rule forbids. Her hip pain and shortened, outward-turned leg are classic hip-fracture signs, and standing her could turn a fracture catastrophic. The right response: do NOT move her — stay with her, call the nurse immediately, keep her calm and still, and observe while you wait.',
                },
                {
                  id: 'leave',
                  label: 'Leave her on the floor and go find someone',
                  feedback:
                    'Never leave a fallen resident alone — she could move and worsen an injury, and she needs reassurance. Use the call light or call out for the nurse while staying with her. Her hip pain and shortened, outward-turned leg are hip-fracture signs: do NOT move her, stay with her, call for the nurse, keep her calm and still, and observe while you wait.',
                },
              ],
              requiredForCompletion: true,
            },
            {
              id: 'fall-s09-scenario-shortcut-image',
              type: 'image',
              src: '/assets/courses/falls/s09-scenario-shortcut.jpg',
              caption: 'Choose the safe transfer over the dangerous shortcut.',
            },
            {
              id: 'fall-s09-scenario-shortcut',
              type: 'scenario_question',
              prompt:
                'It\'s a busy morning and you need to transfer Mr. Halloran — who is weak and unsteady — from his bed to his wheelchair. The wheelchair is across the room with its wheels unlocked, his gait belt is in the drawer, and he\'s in slippery socks. A coworker says, "We\'re slammed — just grab him under the arms and swing him over quick, he\'ll be fine." What SHOULD the CNA do?',
              options: [
                {
                  id: 'swing-quick',
                  label: 'Grab him under the arms and swing him over quickly to save time',
                  feedback:
                    'The shortcut stacks the exact hazards that cause transfer falls: an unlocked wheelchair that can roll away, slippery socks, no gait belt, and an under-the-arms lift that injures shoulders and gives no control. "He\'ll be fine" is how transfer falls happen. The right answer: take the minute — chair close and locked, footwear on, belt snug with an underhand grip, good body mechanics, and transfer together at his pace.',
                },
                {
                  id: 'do-it-right',
                  label: 'Take the minute to do it right — bring the wheelchair close and lock the wheels, put on proper footwear and the gait belt, and transfer him safely at his pace',
                  feedback:
                    'Right — and that one minute of setup is exactly what prevents falls and injuries. The shortcut version stacks hazards: an unlocked wheelchair that can roll away mid-transfer, slippery socks on the floor, no gait belt — so no secure grip — and lifting under the arms, which can injure his shoulders, gives you no control, and drops residents. "He\'ll be fine" is how transfer falls happen. The right transfer takes barely longer: bring the wheelchair beside the bed and lock its wheels, clear the path, get proper non-slip footwear on him, put the gait belt on snug with an underhand grip, use your body mechanics — knees bent, him close, no twisting — let him do what he can to power the move, and go together on a signal, at his pace. Busy is real, but a fall costs far more time than a belt does. Do it right, every time.',
                  isRecommended: true,
                },
                {
                  id: 'walk-alone',
                  label: 'Have him stand and walk to the wheelchair alone in his socks',
                  feedback:
                    'Walking a weak, unsteady resident alone in slippery socks is a fall waiting to happen. He needs a prepared, belted transfer: chair close and locked, proper non-slip footwear on, gait belt snug with an underhand grip, good body mechanics, moving together at his pace.',
                },
                {
                  id: 'leave-in-bed',
                  label: 'Skip the transfer and leave him in bed all day',
                  feedback:
                    'Leaving him in bed all day isn\'t safe either — that\'s immobility and deconditioning doing their quiet damage. The right answer isn\'t skipping the transfer; it\'s doing it right: chair close and locked, footwear on, gait belt snug with an underhand grip, good body mechanics, and transfer together at his pace.',
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
            { id: 'fall-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
              id: 'fall-s10-video',
              type: 'video',
              title: "CNA's Role in Care",
              videoUrl: '/assets/courses/falls/s10-cna-role.mp4',
              placeholderNote: 'Pending upload: /assets/courses/falls/s10-cna-role.mp4',
            },
            {
              id: 'fall-s10-image',
              type: 'image',
              src: '/assets/courses/falls/s10-hero.jpg',
              caption: 'Daily movement fights deconditioning.',
            },
            {
              id: 'fall-s10-narration',
              type: 'text',
              body: [
                'Your role with falls, immobility, and deconditioning is the front line itself: prevent, assist safely, respond correctly, and keep them moving. Let\'s walk through it.',
                '**Run the prevention, every shift.** Own the fall-prevention bundle. Clear, dry, lit pathways. Proper footwear, always. Call lights in reach and answered fast. Proactive toileting before the dangerous rush. Beds low, wheels locked, items in reach. Staged rising — sit, pause, edge, pause, stand, pause — every time. Know your high-risk residents and watch them closest. This daily, unglamorous vigilance prevents more falls than anything else, and it\'s entirely yours.',
                '**Assist movement safely.** Make every transfer and walk a safe one: prepared, belted, underhand grip, good body mechanics — wide base, bent knees, load close, no twisting — with the resident powering what they can, moving together at their pace, and help or the lift brought in when the care plan calls for it. Never pull by the arms, never rush, never improvise with a dependent resident. Safe technique every time protects them and protects your back for a career.',
                '**Respond right when a fall happens.** When a resident falls or is found down, hold the iron rule: do not move them. Stay with them, call the nurse immediately, keep them calm, still, and warm, and observe — pain, leg position, head strike, confusion — so your report is exact. Let the nurse assess before any movement. Then report the fall — every fall, every time, injury or not — and watch for changes in the hours after, especially confusion or drowsiness after any head involvement.',
                '**Fight deconditioning daily.** Be the steady force that keeps residents moving. Support ordered walks and activity, reposition those who can\'t move themselves, encourage residents to do what they can — transfers, dressing, grooming, feeding — and resist the it\'s-faster-to-do-it-for-them trap that quietly steals their strength. Every supported step and self-done task is medicine against the spiral. You bank their strength every single day.',
                'Now the boundary. You do not diagnose injuries. You never move a fallen resident before the nurse assesses them. You do not decide or change activity levels or transfer status — the care plan does. And you never skip the belt, the locked wheels, the footwear, or the staged rise to save a minute, and never leave a fall unreported.',
                'Inside your role — daily prevention, safe assistance, correct fall response, and movement as medicine — you stand exactly where the fall-and-weakness spiral is stopped. Every fall you prevent is an injury that never happens, and every step you support is independence preserved. Few things a CNA does matter more.',
              ].join('\n\n'),
            },
            {
              id: 'fall-s10-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Stay within scope',
              body: 'You do not diagnose injuries, never move a fallen resident before the nurse assesses, and do not change activity or transfer orders — the care plan does. You run the prevention bundle, transfer safely, protect the staged rise, respond to falls correctly, and dose movement daily.',
            },
          ]),
      },
      {
        slug: 's11-case-study',
        title: 'Brief Case Study',
        sortOrder: 2,
        buildContent: () => {
          const caseNarrative = [
            'Mr. Bianchi, 84, came back from the hospital after a bout of pneumonia a changed man. He\'d gone in walking with a cane; after ten days mostly in a hospital bed, he returned barely able to stand from a chair — the fast, cruel math of deconditioning in an old body. Two weeks later he fell in his room at night, rushing to the bathroom alone in his socks. He wasn\'t seriously injured — but the fall planted fear. He stopped wanting to walk. He asked to stay in bed. Staff, busy and kind, found it faster to do everything for him. The spiral had begun: fall, fear, immobility, weakness — and his new CNA, Imelda, could see exactly where it was heading.',
            '',
            '**What Imelda recognized:** Imelda had just completed training on falls and deconditioning, and she saw the textbook pattern: a hospital stay that drained his strength, a preventable nighttime fall — the solo bathroom rush, the slippery socks — and now fear-driven immobility that was making him weaker by the week, setting up a worse fall. She also saw what wasn\'t being done: his call light was often across the room, no one was toileting him proactively at night, and his every transfer was being done entirely for him, his own muscles idle. The spiral wasn\'t fate; it was running on removable causes.',
            '',
            '**What Imelda did — prevention first:** She rebuilt his fall protection. Call light clipped within reach, every time she left. Proactive toileting — she learned his pattern and offered the bathroom before the urgency, especially at bedtime and during night rounds, removing the dangerous rush entirely. Non-slip footwear before any standing — the slippery socks retired. A clear, lit path to the bathroom at night. Bed low, wheels locked. And staged rising every time — sit, pause, edge of bed, pause, stand, steady — because his blood-pressure medication made him dizzy when he rose fast, which she noticed and reported.',
            '',
            '**What Imelda did — movement as medicine:** Then she went after the weakness and the fear together, within his care plan. Instead of doing his transfers for him, she put the gait belt on and had him power what he could, her grip steady and her praise real. Short supported walks — to the door, then the hallway, then a little farther — at his pace, never rushed, his confidence rebuilding step by step. She encouraged him to do what he could himself — washing, dressing, feeding — resisting every it\'s-faster-if-I-do-it temptation, because she understood each self-done task was strength banked. She reported his progress, and the therapy team built on it.',
            '',
            '**The fall that didn\'t happen — and the one that was handled right:** One evening, weeks in, Imelda found a visitor\'s bag and cords left across Mr. Bianchi\'s bathroom path and cleared them before his night walk — a fall that simply never occurred. And when a different resident on the unit was found on the floor one morning, Imelda held the iron rule she\'d trained on: she did not move her, stayed beside her, called the nurse, kept her still and calm, and reported the hip pain and oddly turned leg she observed — a hip fracture, assessed and handled safely because nobody lifted first.',
            '',
            '**The outcome:** Mr. Bianchi\'s spiral stopped — and reversed. The proactive toileting and clear lit path took away his most dangerous moments; the staged rising tamed the dizziness; and the daily dosed movement rebuilt his strength until he was walking with his cane again, fear fading with every successful step. He had no further falls.',
          ].join('\n');

          return doc('Brief Case Study', [
            { id: 'fall-s11-heading', type: 'heading', level: 1, text: 'Brief Case Study' },
            pendingAudio(
              'fall-s11-audio',
              'The Spiral That Stopped',
              '/assets/courses/falls/s11-case-podcast.mp3',
              caseNarrative,
              '/assets/courses/falls/s11-case-podcast.mp3',
            ),
            {
              id: 'fall-s11-image',
              type: 'image',
              src: '/assets/courses/falls/s11-hero.jpg',
              caption: 'Regained strength and confidence after reversing the spiral.',
            },
            {
              id: 'fall-s11-case-study',
              type: 'case_study',
              title: 'The Spiral That Stopped',
              residentProfile:
                'Mr. Bianchi, 84, returned from a 10-day hospital stay for pneumonia barely able to stand from a chair — the fast math of deconditioning. Two weeks later he fell at night rushing to the bathroom alone in his socks. Uninjured, but the fall planted fear: he stopped wanting to walk, asked to stay in bed, and busy staff found it faster to do everything for him. The spiral — fall, fear, immobility, weakness — had begun.',
              scenario: [
                '**What Imelda recognized:** Imelda saw the textbook pattern: a hospital stay that drained his strength, a preventable nighttime fall (solo bathroom rush, slippery socks), and now fear-driven immobility making him weaker by the week. She also saw the removable causes: his call light often across the room, no proactive night toileting, and every transfer done entirely for him, his own muscles idle. The spiral wasn\'t fate; it ran on removable causes.',
                '**Prevention first:** Call light clipped within reach every time. Proactive toileting on his pattern, especially at bedtime and night rounds — removing the dangerous rush. Non-slip footwear before any standing. A clear, lit path at night. Bed low, wheels locked. Staged rising every time — because his blood-pressure medication made him dizzy when he rose fast, which she noticed and reported.',
                '**Movement as medicine:** Instead of doing his transfers for him, she put the gait belt on and had him power what he could, with steady grip and real praise. Short supported walks that grew — to the door, the hallway, farther — at his pace. She encouraged him to wash, dress, and feed himself, resisting the it\'s-faster-if-I-do-it temptation, because each self-done task was strength banked. She reported his progress and the therapy team built on it.',
                '**The fall response, handled right:** When a different resident was found on the floor one morning, Imelda held the iron rule: she did not move her, stayed beside her, called the nurse, kept her still and calm, and reported the hip pain and oddly turned leg — a hip fracture, assessed and handled safely because nobody lifted first.',
                '**The outcome:** Mr. Bianchi\'s spiral stopped and reversed. The proactive toileting and clear path removed his most dangerous moments; staged rising tamed the dizziness; daily dosed movement rebuilt his strength until he walked with his cane again, fear fading with every successful step. He had no further falls.',
              ].join('\n\n'),
            },
            {
              id: 'fall-s11-reflection-1',
              type: 'reflection',
              prompt:
                'Mr. Bianchi\'s decline followed the classic spiral — fall, fear, immobility, weakness. Which specific causes did Imelda remove, and why did supporting him to power his own transfers and walks matter as much as preventing falls?',
              minCharacters: 50,
            },
            {
              id: 'fall-s11-reflection-2',
              type: 'reflection',
              prompt:
                'When another resident was found on the floor with hip pain and an oddly turned leg, Imelda did not move her. Why is the never-move-before-assessment rule so important, and what should the CNA do while waiting for the nurse?',
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
            { id: 'fall-s12-heading', type: 'heading', level: 1, text: 'Conclusion' },
            {
              id: 'fall-s12-video',
              type: 'video',
              title: 'Conclusion',
              videoUrl: '/assets/courses/falls/s12-conclusion.mp4',
              placeholderNote: 'Pending upload: /assets/courses/falls/s12-conclusion.mp4',
            },
            {
              id: 'fall-s12-image',
              type: 'image',
              src: '/assets/courses/falls/s12-hero.jpg',
              caption: 'Steady progress: safe, confident mobility.',
            },
            {
              id: 'fall-s12-narration',
              type: 'text',
              body: [
                'You\'ve reached the end. Let\'s lock in the five things that matter most about falls, immobility, and deconditioning.',
                '**One.** Falls, immobility, and deconditioning form a spiral: a fall plants fear, fear stops movement, stillness drains strength — fast, days to lose what takes weeks to rebuild — and weakness invites the next fall. Immobility itself harms nearly every body system. Immobility is not rest; movement is medicine. Your work breaks the spiral.',
                '**Two.** Prevent the falls daily. Clear, dry, lit pathways. Proper footwear, never slippery socks. Call light in reach and answered fast. Proactive toileting before the dangerous bathroom rush. Beds low, wheels locked. And staged rising every time — sit, pause, edge, pause, stand, pause — to beat the dizziness that drops elders.',
                '**Three.** Assist movement safely, every time. Prepare the transfer, lock the wheels, footwear on, gait belt snug with an underhand grip — never pull by the arms — good body mechanics to protect your back, the resident powering what they can, moving together at their pace, and help or the lift when the care plan calls for it.',
                '**Four.** When a resident falls: do not move them. Stay with them, call the nurse immediately, keep them calm and still, and observe — pain, a shortened turned leg, head strike, confusion. Let the nurse assess before any movement. And report every fall, every time, even without injury — and watch for changes in the hours after.',
                '**Five.** Fight deconditioning every day, and honor your scope. Support walks and activity, reposition the immobile, and encourage residents to do what they can — never trading their strength for speed. You never diagnose, never move a fallen resident before assessment, and never change activity orders — but you prevent, assist safely, respond right, and keep them moving. Every fall prevented is a life protected.',

                'This course provides one hour of continuing education through CAL ACE Nursing Academy (CDPH Provider NAC #7384). Your certificate is generated automatically when you pass the knowledge check.',
                'Ten questions are waiting. Everything on them was covered here. You\'re ready. Trust what you\'ve learned, and show what you know.',
              ].join('\n\n'),
            },
            {
              id: 'fall-s12-summary',
              type: 'summary',
              title: 'Five things that matter most',
              items: [
                'Falls, immobility, and deconditioning form a spiral — a fall plants fear, fear stops movement, stillness drains strength fast, and weakness invites the next fall. Immobility is not rest; movement is medicine.',
                'Prevent falls daily — clear lit paths, proper footwear, call light in reach and answered fast, proactive toileting before the rush, beds low and wheels locked, and staged rising every time.',
                'Assist movement safely — prepare, lock wheels, footwear on, gait belt with an underhand grip (never pull by the arms), good body mechanics, resident powering what they can, help or the lift per the care plan.',
                'When a resident falls: do NOT move them — stay, call the nurse, keep them still, observe (hip pain, shortened turned leg, head strike, confusion). Report every fall, every time, and watch for later changes.',
                'Fight deconditioning daily and honor your scope — support movement, reposition the immobile, never trade strength for speed; never diagnose, move a fallen resident, or change activity orders.',
              ],
            },
          ]),
      },
    ],
  },
];

export async function seedCourse03FallsImmobility(
  prisma: PrismaClient,
  options?: { tenantSlug?: string },
): Promise<{
  courseCreated: boolean;
  modulesUpserted: number;
  lessonsUpserted: number;
  straysDeleted: number;
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
      courseId_versionNumber: { courseId: course.id, versionNumber: VERSION_NUMBER },
    },
    create: {
      courseId: course.id,
      versionNumber: VERSION_NUMBER,
      label: 'V3 rebuild — falls, immobility & deconditioning',
      status: CourseVersionStatus.DRAFT,
      deliveryMode: DeliveryMode.ONLINE,
      ceHours,
      publishedAt: null,
      contentMeta: contentMeta as Prisma.InputJsonValue,
    },
    update: {
      label: 'V3 rebuild — falls, immobility & deconditioning',
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

  // Self-clean stray modules on the target DRAFT version (idempotent; prevents the
  // "leftover cloned-stub module" problem when seeding onto a version that already
  // holds other modules). Scoped strictly to version.id, DRAFT-guarded, soft-delete.
  const ownedSlugs = new Set(MODULES.map((m) => m.slug));
  let straysDeleted = 0;
  let strayLessonsDeleted = 0;

  if (version.status !== CourseVersionStatus.DRAFT) {
    console.warn('Skipping stray-module cleanup: version is not DRAFT');
  } else {
    const strayModules = await prisma.module.findMany({
      where: {
        courseVersionId: version.id,
        deletedAt: null,
        slug: { notIn: [...ownedSlugs] },
      },
      include: {
        lessons: { where: { deletedAt: null } },
      },
    });

    if (strayModules.length === 0) {
      console.log('Stray-module cleanup: none found (already clean).');
    } else {
      const now = new Date();
      const straySlugs = strayModules.map((m) => m.slug);
      straysDeleted = strayModules.length;
      strayLessonsDeleted = strayModules.reduce((sum, m) => sum + m.lessons.length, 0);

      await prisma.$transaction(async (tx) => {
        for (const stray of strayModules) {
          for (const lesson of stray.lessons) {
            await tx.lesson.update({
              where: { id: lesson.id },
              data: { deletedAt: now },
            });
          }
          await tx.module.update({
            where: { id: stray.id },
            data: { deletedAt: now },
          });
        }
      });

      console.log(
        `Stray-module cleanup: soft-deleted ${straysDeleted} modules [${straySlugs.join(', ')}] and ${strayLessonsDeleted} lessons on version v${version.versionNumber}.`,
      );
    }
  }

  return {
    courseCreated: !existing,
    modulesUpserted,
    lessonsUpserted,
    straysDeleted,
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
  console.log(
    `Seeding Course 3 (Falls & Immobility) as DRAFT — slug "${COURSE_SLUG}", version ${VERSION_NUMBER}…`,
  );

  try {
    const result = await seedCourse03FallsImmobility(prisma);
    const blockCounts = blockCountsByLesson();

    console.log('Seed complete.');
    console.log(`  Course:   ${COURSE_TITLE}`);
    console.log(`  Slug:     ${COURSE_SLUG}`);
    console.log(`  Version:  ${VERSION_NUMBER}`);
    console.log(`  Created:  ${result.courseCreated ? 'yes (new)' : 'no (updated existing)'}`);
    console.log(`  Modules:  ${result.modulesUpserted}`);
    console.log(`  Lessons:  ${result.lessonsUpserted}`);
    console.log(`  Strays cleaned: ${result.straysDeleted} modules, ${result.strayLessonsDeleted} lessons`);
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
