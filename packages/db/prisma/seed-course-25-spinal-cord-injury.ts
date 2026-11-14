/**
 * Seed Course 25 — Caring for a Resident with a Spinal Cord Injury (DRAFT).
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-25-spinal-cord-injury
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
const COURSE_SLUG = 'spinal-cord-injury';
const COURSE_TITLE = 'Spinal Cord Injury Care: Mobility and Skin Safety';
const COURSE_SUMMARY =
  'Learn to support a resident living with a spinal cord injury — protecting skin and the body that cannot feel, supporting mobility and bladder/bowel routines with dignity, and recognizing the two medical emergencies unique to SCI: autonomic dysreflexia and breathing problems. CNAs do not diagnose, give or adjust medications, or perform therapy.';

const ASSET_BASE = `/assets/courses/spinal-cord-injury`;

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
    'Explain what a spinal cord injury is, in plain language',
    'Protect a body that cannot feel or move below the injury',
    'Support mobility, bladder and bowel care, and dignity',
    'Recognize autonomic dysreflexia and breathing emergencies',
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
  heroImage: '/assets/courses/spinal-cord-injury/hero-banner.png',
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
    title: 'Understanding Spinal Cord Injury',
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: 'Introduction',
        sortOrder: 0,
        buildContent: () =>
          doc('Introduction', [
            { id: 'sci-s01-heading', type: 'heading', level: 1, text: 'Welcome' },
            {
              id: 'sci-s01-video',
              type: 'video',
              title: 'Introduction',
              videoUrl: '/assets/courses/spinal-cord-injury/s01-intro.mp4',
              placeholderNote: 'Pending upload: /assets/courses/spinal-cord-injury/s01-intro.mp4',
            },
            {
              id: 'sci-s01-hero-image',
              type: 'image',
              src: `${ASSET_BASE}/s01-hero.jpg`,
              caption:
                'Spinal cord injury — protecting a body that cannot feel or move below the injury.',
            },
            {
              id: 'sci-s01-narration',
              type: 'text',
              body: [
                'Welcome to CAL ACE Nursing Academy.',
                'This course is about spinal cord injury — S-C-I — and how to provide skilled, dignified care to a resident living with one.',
                'The spinal cord is the body\'s main communication cable. It runs from the brain down through the spine, carrying every message between the brain and the body — the commands to move, and the sensations coming back: touch, pain, temperature, the feeling of a full bladder. When the spinal cord is damaged, those messages are cut off below the level of the injury. The body below can no longer move on command, and can no longer feel.',
                'That single fact — the body below the injury cannot feel — sits at the center of this entire course. Think about everything feeling protects you from. You shift in your seat before you even notice you\'re uncomfortable. You pull your hand from water that\'s too hot before it burns. You feel the ache that tells you to move. A resident with a spinal cord injury has lost those automatic protections below their injury. The skin can break down without a single warning. A burn can happen with no pain. This is why the CNA\'s eyes and hands become the resident\'s missing sense of feeling.',
                'Many residents with SCI are young — these injuries often strike in the prime of life, from accidents and falls. So you may be caring for an alert, sharp, capable adult in their twenties, thirties, or forties, whose mind is completely intact and whose body has been profoundly changed. Their dignity, their independence, and their voice in their own care matter enormously.',
                'This course also teaches a true emergency that most people have never heard of — autonomic dysreflexia. It\'s a sudden, dangerous spike in blood pressure unique to spinal cord injuries, and it can become life-threatening within minutes. You\'ll learn to recognize it and respond, because a CNA may be the first and only person there when it strikes.',
                'Your scope is clear. A CNA protects skin and the body that can\'t feel, supports mobility, bladder and bowel routines, and dignity, and recognizes the emergencies unique to SCI. A CNA does not diagnose, does not give or adjust medications, and does not perform therapy.',
                'By the end of this course, you will be able to: explain what a spinal cord injury is, in plain language. Protect a body that cannot feel or move below the injury. Support mobility, bladder and bowel care, and dignity. Recognize autonomic dysreflexia and breathing emergencies. And know your scope.',
                'There is a ten-question knowledge check at the end. Everything on it is covered here. Let\'s begin.',
              ].join('\n\n'),
            },
            {
              id: 'sci-s01-ci-text',
              type: 'text',
              body: [
                'This course teaches the CNA\'s role in supporting a resident living with a spinal cord injury — protecting skin and the body that can\'t feel, supporting mobility and bladder/bowel routines with dignity, and recognizing the two medical emergencies unique to SCI: autonomic dysreflexia and breathing problems.',
                'Let\'s be clear about your role. A CNA protects skin and the body that can\'t feel, supports mobility, bladder and bowel routines, and dignity, and recognizes the emergencies unique to SCI. A CNA does not diagnose, does not give or adjust medications, and does not perform therapy. Those are nursing and physician tasks. But none of them can happen without your careful observation and faithful daily care first.',
              ].join('\n\n'),
            },
            {
              id: 'sci-s01-ci-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of this course',
              body: 'CNAs PROTECT, SUPPORT, WATCH, and REPORT CHANGES. CNAs do not diagnose, give or adjust medications, or perform therapy.',
            },
            {
              id: 'sci-s01-lo-text',
              type: 'text',
              body: 'By the end of this course, you will be able to:',
            },
            {
              id: 'sci-s01-lo-summary',
              type: 'summary',
              title: 'Learning objectives',
              items: [
                'Explain what a spinal cord injury is, in plain language.',
                'Protect a body that cannot feel or move below the injury.',
                'Support mobility, bladder and bowel care, and dignity.',
                'Recognize autonomic dysreflexia and breathing emergencies.',
                'Know your scope — what a CNA does, and what a CNA must never do.',
              ],
            },
            {
              id: 'sci-s01-ii-text',
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
            { id: 'sci-s02-heading', type: 'heading', level: 1, text: 'Key terms' },
            {
              id: 'sci-s02-hero-image',
              type: 'image',
              src: `${ASSET_BASE}/s02-hero.jpg`,
              caption:
                'Key SCI terms — paraplegia, tetraplegia, autonomic dysreflexia, and loss of sensation.',
            },
            {
              id: 'sci-s02-reveal-sci',
              type: 'reveal_card',
              frontTitle: 'Spinal Cord Injury (SCI)',
              frontBody: 'Spinal cord injury',
              backTitle: 'Spinal Cord Injury (SCI)',
              backBody:
                'Damage to the spinal cord — the bundle of nerves running down the spine — that disrupts the messages between the brain and the body. Below the injury, movement and feeling are reduced or lost. The effects depend on where on the cord the injury happened, and how complete it is.',
            },
            {
              id: 'sci-s02-reveal-paraplegia',
              type: 'reveal_card',
              frontTitle: 'Paraplegia',
              frontBody: 'Pair-ah-PLEE-jee-ah',
              backTitle: 'Paraplegia',
              backBody:
                'Loss of movement and feeling in the lower part of the body — typically the legs and lower trunk — from an injury lower on the spinal cord. The arms and hands usually still work. Many residents with paraplegia are highly independent in a wheelchair.',
            },
            {
              id: 'sci-s02-reveal-tetraplegia',
              type: 'reveal_card',
              frontTitle: 'Tetraplegia (Quadriplegia)',
              frontBody: 'Tet-rah-PLEE-jee-ah',
              backTitle: 'Tetraplegia (Quadriplegia)',
              backBody:
                'Loss of movement and feeling in all four limbs and the trunk, from an injury higher on the spinal cord, in the neck region. These residents need more assistance, and the higher the injury, the more functions are affected — including, sometimes, breathing.',
            },
            {
              id: 'sci-s02-reveal-level-of-injury',
              type: 'reveal_card',
              frontTitle: 'Level of Injury',
              frontBody: 'Level of injury',
              backTitle: 'Level of Injury',
              backBody:
                'The point on the spinal cord where the damage occurred. It determines what\'s affected: a higher injury, in the neck, affects more of the body; a lower injury affects less. Knowing a resident\'s level tells you what they can and cannot do — and what dangers to watch for.',
            },
            {
              id: 'sci-s02-reveal-loss-of-sensation',
              type: 'reveal_card',
              frontTitle: 'Loss of Sensation',
              frontBody: 'Loss of sensation',
              backTitle: 'Loss of Sensation',
              backBody:
                'Below the injury, the resident cannot feel touch, pain, pressure, or temperature. This is why they can\'t feel a pressure sore starting, a burn from hot water, or an injury — and why your skin checks and temperature care are so vital.',
            },
            {
              id: 'sci-s02-reveal-autonomic-dysreflexia',
              type: 'reveal_card',
              frontTitle: 'Autonomic Dysreflexia',
              frontBody: 'Aw-toe-NOM-ik dis-ree-FLEK-see-ah',
              backTitle: 'Autonomic Dysreflexia',
              backBody:
                'A medical emergency in residents with higher spinal cord injuries: a sudden, dangerous spike in blood pressure, triggered by something irritating the body below the injury — often a full bladder. It causes a pounding headache, sweating, and flushing above the injury. It can be life-threatening, and it needs immediate action.',
            },
            {
              id: 'sci-s02-reveal-neurogenic-bladder-bowel',
              type: 'reveal_card',
              frontTitle: 'Neurogenic Bladder and Bowel',
              frontBody: 'New-roh-JEN-ik',
              backTitle: 'Neurogenic Bladder and Bowel',
              backBody:
                'When the injury disrupts control of the bladder and bowel. Residents follow scheduled programs — catheter care, timed routines — to manage them. These routines protect health and dignity, and they\'re a core part of SCI care.',
            },
            {
              id: 'sci-s02-reveal-spasticity',
              type: 'reveal_card',
              frontTitle: 'Spasticity',
              frontBody: 'Spas-TIS-ih-tee',
              backTitle: 'Spasticity',
              backBody:
                'Involuntary muscle tightness or spasms below the injury. Even though the resident can\'t move those muscles on command, the muscles may stiffen or jerk on their own. It\'s managed with positioning, the stretches therapists assign, and sometimes medication.',
            },
            {
              id: 'sci-s02-kc1-check-loss-of-sensation',
              type: 'knowledge_check',
              question:
                'Match the term: cannot feel pressure, pain, or temperature below the injury',
              options: [
                { id: 'loss-of-sensation', label: 'Loss of sensation' },
                { id: 'autonomic-dysreflexia', label: 'Autonomic dysreflexia' },
                { id: 'level-of-injury', label: 'Level of injury' },
              ],
              correctOptionId: 'loss-of-sensation',
              explanation:
                'Loss of sensation. Below the injury, the resident cannot feel touch, pain, pressure, or temperature. This is why they can\'t feel a pressure sore starting, a burn from hot water, or an injury — and why your skin checks and temperature care are so vital.',
              requiredForCompletion: true,
            },
            {
              id: 'sci-s02-kc1-check-autonomic-dysreflexia',
              type: 'knowledge_check',
              question:
                'Match the term: sudden dangerous blood-pressure spike — an emergency',
              options: [
                { id: 'loss-of-sensation', label: 'Loss of sensation' },
                { id: 'autonomic-dysreflexia', label: 'Autonomic dysreflexia' },
                { id: 'level-of-injury', label: 'Level of injury' },
              ],
              correctOptionId: 'autonomic-dysreflexia',
              explanation:
                'Autonomic dysreflexia. A medical emergency in residents with higher spinal cord injuries: a sudden, dangerous spike in blood pressure, triggered by something irritating the body below the injury — often a full bladder. It causes a pounding headache, sweating, and flushing above the injury. It can be life-threatening, and it needs immediate action.',
              requiredForCompletion: true,
            },
            {
              id: 'sci-s02-kc1-check-level-of-injury',
              type: 'knowledge_check',
              question:
                'Match the term: where on the cord the damage is; determines what\'s affected',
              options: [
                { id: 'loss-of-sensation', label: 'Loss of sensation' },
                { id: 'autonomic-dysreflexia', label: 'Autonomic dysreflexia' },
                { id: 'level-of-injury', label: 'Level of injury' },
              ],
              correctOptionId: 'level-of-injury',
              explanation:
                'Level of injury. The point on the spinal cord where the damage occurred. It determines what\'s affected: a higher injury, in the neck, affects more of the body; a lower injury affects less. Knowing a resident\'s level tells you what they can and cannot do — and what dangers to watch for.',
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
            { id: 'sci-s03-heading', type: 'heading', level: 1, text: 'Statistics' },
            pendingAudio(
              'sci-s03-audio',
              'Spinal Cord Injury: Often Young, Always Individual',
              `${ASSET_BASE}/s03-stats-podcast.mp3`,
              [
                'Spinal Cord Injury: Often Young, Always Individual',
                '',
                'Around 300,000 people in the United States live with a spinal cord injury, with roughly 18,000 new injuries each year. Here\'s a fact that shapes how we care: spinal cord injuries strike the young especially hard. The average age at injury has historically been in the young-adult range, and a large share of injuries happen to people in their teens, twenties, and thirties. So while long-term care residents are often elderly, a resident with a spinal cord injury may be decades younger than those around them — an alert, capable adult whose body, not whose mind, has been changed.',
                '',
                'The leading causes are vehicle crashes and falls, followed by acts of violence and sports injuries. In older adults, falls are an increasingly common cause. However the injury happened, the result is the same pattern: below the level of injury, the resident loses movement and, critically, sensation.',
                '',
                'That loss of sensation is the source of the most common and dangerous complications — and the ones CNAs most directly prevent. Pressure injuries are at the top of the list. Because a resident can\'t feel the discomfort that would normally make them shift position, skin over bony areas can break down silently and quickly, sometimes in just hours. Pressure injuries are a leading cause of hospitalization and serious illness in SCI, and they are largely preventable through faithful repositioning and skin care.',
                '',
                'Other major complications include urinary tract infections from bladder management, respiratory problems in higher injuries where breathing muscles are affected, blood clots from immobility, and a unique emergency called autonomic dysreflexia — a sudden, dangerous spike in blood pressure that can occur in higher injuries.',
                '',
                'Here\'s the empowering truth for CNAs: nearly every one of these complications is influenced by daily hands-on care. Repositioning and skin checks prevent pressure injuries. Careful bladder and bowel routines prevent infections and trigger fewer emergencies. Recognizing autonomic dysreflexia fast can save a life. And alongside all of it, treating a young, aware adult with full dignity and respect for their independence shapes their entire quality of life.',
                '',
                'The bottom line: SCI residents are often young and always individual, the loss of sensation drives serious but preventable complications, and the CNA\'s daily vigilance and dignity are central to keeping them safe and whole.',
              ].join('\n'),
              '/assets/courses/spinal-cord-injury/s03-stats-podcast.mp3',
            ),
            {
              id: 'sci-s03-hero-image',
              type: 'image',
              src: `${ASSET_BASE}/s03-hero.jpg`,
              caption:
                'SCI affects many young adults — daily vigilance prevents serious complications.',
            },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: 'Fundamentals',
        sortOrder: 3,
        buildContent: () =>
          doc('Fundamentals', [
            { id: 'sci-s04-heading', type: 'heading', level: 1, text: 'Fundamentals' },
            {
              id: 'sci-s04-video',
              type: 'video',
              title: 'Fundamentals',
              videoUrl: '/assets/courses/spinal-cord-injury/s04-fundamentals.mp4',
              placeholderNote:
                'Pending upload: /assets/courses/spinal-cord-injury/s04-fundamentals.mp4',
            },
            {
              id: 'sci-s04-hero-image',
              type: 'image',
              src: `${ASSET_BASE}/s04-hero.jpg`,
              caption:
                'The spinal cord as the body\'s communication cable — injury cuts messages below the level.',
            },
            {
              id: 'sci-s04-narration',
              type: 'text',
              body: [
                '**The communication cable**',
                'The spinal cord is a thick bundle of nerves running from the brain down through the bones of the spine. It\'s the body\'s main communication cable. Every command from the brain to move, and every sensation traveling back — touch, pain, temperature, pressure — passes through it.',
                '**What injury does: the cable is cut**',
                'When the spinal cord is damaged, it\'s like a cable being cut. Messages can\'t cross the damaged point. Below the injury, the brain can no longer send movement commands, and the body can no longer send sensations up to the brain. The parts below the injury go quiet — unable to move on command, unable to feel.',
                '**Why the level of injury matters**',
                'Where the injury sits on the cable decides what\'s affected. Picture the cable running top to bottom. An injury low on the back — paraplegia — affects the legs and lower body, while arms and hands work normally. An injury high in the neck — tetraplegia — affects all four limbs and the trunk. The higher the injury, the more of the body is affected. The very highest injuries can even affect the muscles of breathing.',
                '**The central danger: no feeling means no warning**',
                'Here is the heart of SCI care. Normally, sensation is a constant protection system. Discomfort makes you shift before you get a sore. Pain makes you pull away before you\'re burned. The feeling of a full bladder tells you to act. Below a spinal cord injury, all of that is gone. The resident gets no warning of a pressure sore forming, no pain from a burn, no signal of a problem developing. Damage happens silently. That\'s why your watchfulness replaces their lost sense of feeling.',
                '**Why skin breaks down so fast**',
                'Without sensation, a resident can\'t feel the building pressure that would normally make them shift. So they stay in one position, and the constant pressure over a bony area — the tailbone, hips, heels — cuts off blood flow to the skin. With no warning and no movement, skin can break down in hours. This is why scheduled repositioning and skin checks aren\'t routine chores — they\'re the resident\'s protection.',
                '**Bladder, bowel, and breathing**',
                'The injury affects more than movement and skin. Bladder and bowel control is usually disrupted, managed through scheduled programs and catheter care — vital for health and dignity. In higher injuries, breathing muscles may be weakened, so respiratory care and watching for breathing trouble matter. And blood pressure regulation can be affected — which sets the stage for the emergency you\'ll learn about.',
                '**Intact mind, changed body — and a full life**',
                'Crucially, a spinal cord injury does not affect the mind. The resident thinks, feels, and understands completely. Many lead full, active, meaningful lives — working, connecting, pursuing interests — especially with good care and equipment. Your role isn\'t just to prevent complications; it\'s to support a whole person in living fully. Dignity and independence are as important as skin and safety.',
              ].join('\n\n'),
            },
            {
              id: 'sci-s04-no-feeling-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'No feeling = no warning',
              body: 'Below a spinal cord injury, the resident gets no warning of pressure damage, burns, or developing problems. Your eyes and hands replace their lost sense of feeling.',
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
            { id: 'sci-s05-heading', type: 'heading', level: 1, text: 'Signs & Symptoms' },
            {
              id: 'sci-s05-hero-image',
              type: 'image',
              src: `${ASSET_BASE}/s05-hero.jpg`,
              caption:
                'Watching for skin damage, autonomic dysreflexia, and breathing trouble the resident cannot feel.',
            },
            {
              id: 'sci-s05-narration',
              type: 'text',
              body: [
                'With spinal cord injury, you watch for two very different things: the daily warning signs the resident can\'t feel, and the signs of two true emergencies. Let\'s learn both.',
                '**The skin, every single day**',
                'Because the resident can\'t feel pressure damage, your eyes are their warning system. At every repositioning and during care, check the skin — especially over bony areas: the tailbone, hips, heels, elbows, shoulder blades, the back of the head. Look for redness that doesn\'t fade, color or texture changes, blisters, or any break in the skin. Catch a reddened area early and it heals; miss it and it becomes a deep, dangerous wound. Report any skin change immediately.',
                '**The silent injuries and infections**',
                'Watch for problems the resident can\'t feel announcing themselves. A burn from bathwater or a heating pad that was too hot — which is why you always test water and never use heat sources against numb skin. An injury from a bump or a fall they didn\'t feel. And the signs of a urinary tract infection, common with bladder management: cloudy or foul urine, fever, new confusion, or feeling unwell. Since the resident may not feel the usual urinary discomfort, you watch for the other signs.',
                '**Autonomic dysreflexia: the hidden emergency**',
                'Now the emergency unique to spinal cord injury, in higher injuries. Autonomic dysreflexia is a sudden, dangerous spike in blood pressure, set off by something irritating the body below the injury. The classic triggers: a full bladder or a blocked catheter, a full bowel, or skin irritation. The signs come on fast: a sudden pounding headache, sweating and flushing above the level of injury, a stuffy nose, goosebumps, and sometimes a slow heartbeat. The resident may suddenly feel anxious or "wrong." This is a medical emergency — untreated, that blood pressure can climb high enough to cause a stroke. The next sections cover exactly how to respond.',
                '**Breathing trouble in higher injuries**',
                'For residents with higher injuries, the breathing muscles may be weakened, so respiratory trouble is the other emergency to watch. Signs: increasing shortness of breath, weak cough, rapid or labored breathing, bluish lips, anxiety, or a weak voice. Because they may not clear their lungs well, they\'re also prone to pneumonia. Any sign of breathing difficulty is reported immediately.',
                '**Summary**',
                'Two pictures. Daily monitoring: skin over bony areas, signs of burns or injuries they can\'t feel, and signs of urinary infection. The emergencies: autonomic dysreflexia — sudden pounding headache, sweating and flushing above the injury — and breathing difficulty in higher injuries.',
                'The rule underneath it all: the resident cannot feel the warnings, so you are the warning system — check relentlessly, and treat a sudden pounding headache in an SCI resident as an emergency until proven otherwise.',
              ].join('\n\n'),
            },
            {
              id: 'sci-s05-emergency-callout',
              type: 'callout',
              variant: 'warning',
              title: 'Watch for emergencies',
              body: 'A sudden pounding headache with sweating and flushing above the injury is autonomic dysreflexia — a medical emergency. Increasing shortness of breath in higher injuries is also an emergency.',
            },
          ]),
      },
      {
        slug: 's06-causes',
        title: 'Causes',
        sortOrder: 1,
        buildContent: () =>
          doc('Causes', [
            { id: 'sci-s06-heading', type: 'heading', level: 1, text: 'Causes' },
            pendingAudio(
              'sci-s06-audio',
              'What Causes Spinal Cord Injury — and What Triggers Its Complications?',
              `${ASSET_BASE}/s06-causes-podcast.mp3`,
              [
                'What Causes Spinal Cord Injury — and What Triggers Its Complications?',
                '',
                'Spinal cord injuries happen when the spinal cord is damaged by trauma or, less often, by disease. The leading causes are traumatic: motor vehicle crashes are the single biggest cause, followed by falls, which are an especially common cause in older adults. Acts of violence and sports and recreation injuries account for many of the rest. Less commonly, the spinal cord can be damaged by tumors, infections, or loss of blood supply.',
                '',
                'Because trauma causes most injuries, and trauma often strikes the young and active, many people with spinal cord injuries are injured early in life. This is why a long-term care resident with SCI may be a young adult — someone whose life changed in an instant in a car or a fall, and who now lives with an intact mind in a changed body. Understanding this shapes the respect and dignity these residents deserve.',
                '',
                'Once someone is living with a spinal cord injury, the more practical question for daily care is what triggers the complications — because those are what CNAs prevent and catch.',
                '',
                'Pressure injuries are triggered by unrelieved pressure on skin that can\'t feel it — so staying too long in one position is the trigger, and repositioning is the prevention. Urinary tract infections are triggered by bladder management, so careful, clean catheter and toileting routines and good hydration reduce them. And autonomic dysreflexia — the dangerous blood-pressure emergency — has very specific triggers worth memorizing: the most common is a full bladder or a kinked, blocked catheter; next is a full bowel or constipation; and then skin problems like a pressure sore, a tight garment, or even an ingrown toenail. The body, unable to send a normal pain signal, reacts with a blood-pressure surge instead.',
                '',
                'Here\'s what this means for the CNA: the same faithful daily care prevents multiple problems at once. Keeping the catheter unkinked and draining, following the bladder and bowel schedule, repositioning and checking skin, and keeping clothing and positioning comfortable don\'t just prevent sores and infections — they remove the very triggers that set off autonomic dysreflexia. Your routine care is protection on several fronts at the same time.',
              ].join('\n'),
              '/assets/courses/spinal-cord-injury/s06-causes-podcast.mp3',
            ),
            {
              id: 'sci-s06-hero-image',
              type: 'image',
              src: `${ASSET_BASE}/s06-hero.jpg`,
              caption:
                'Trauma causes most SCI — faithful daily care removes complication triggers.',
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
              id: 'sci-s07-heading',
              type: 'heading',
              level: 1,
              text: 'CNA Role & Best Practices',
            },
            {
              id: 'sci-s07-hero-image',
              type: 'image',
              src: `${ASSET_BASE}/s07-hero.jpg`,
              caption:
                'CNA scope in SCI — observe, support, report, and know the autonomic dysreflexia response.',
            },
            {
              id: 'sci-s07-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of practice',
              body: 'CNAs OBSERVE, SUPPORT, and REPORT. CNAs never give or adjust medications or perform therapy on their own.',
            },
            {
              id: 'sci-s07-narration',
              type: 'text',
              body: [
                'Spinal cord injury care is mostly about daily management and preventing complications, with treatment guided by the medical team and therapists. Let\'s walk through it, starting as always with the rule that never bends. A CNA does not give or adjust any medication, and does not perform therapy on their own.',
                '**Autonomic dysreflexia — the response you must know.** This is the most important treatment knowledge in the course, because you may be the only person there when it starts. If a resident with a higher injury suddenly has a pounding headache, sweating, and flushing above the injury, here is the immediate first response, within CNA scope: sit the resident upright, do not lay them flat — sitting up helps lower the blood pressure. Loosen any tight clothing or anything constricting. Quickly look for the trigger you can address: check the catheter for kinks or blockage and make sure it\'s draining. And call the nurse and emergency help immediately. This is a true emergency. You don\'t give medication and you don\'t fix everything — but sitting them up, loosening clothing, checking the catheter, and getting help fast can be lifesaving while you summon the team.',
                '**Medications.** Residents with SCI may take medications for spasticity, nerve pain, bladder function, blood pressure, blood-clot prevention, and bowel programs. Your role is to observe and report — whether spasticity is better or worse, side effects, drowsiness, and so on — never to give or adjust. For bowel programs, you support the scheduled routine as the plan and nurse direct.',
                '**Skin and pressure injury treatment.** If a pressure injury develops, the nurse and wound team manage treatment. Your role stays preventive and observational: faithful repositioning, meticulous skin checks, keeping skin clean and dry, and reporting any change immediately. Prevention is the treatment you own.',
                '**Therapy and equipment.** Physical and occupational therapists work on strength, transfers, wheelchair skills, and independence. You reinforce what they assign and ensure equipment — wheelchair, cushion, braces — is used correctly and kept in good condition. A specialized pressure-relief cushion or mattress is part of skin protection; make sure it\'s in place and working.',
                '**Bladder and bowel programs.** These scheduled routines are central SCI care. You support them faithfully and with full dignity, and report changes — these routines protect health and prevent the autonomic dysreflexia triggers.',
                'The scope point for this section: you never give or adjust medication or perform therapy — but you own the prevention that protects this resident, and you know the autonomic dysreflexia first response cold.',
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
            { id: 'sci-s08-heading', type: 'heading', level: 1, text: 'Prevention & Risk Reduction' },
            {
              id: 'sci-s08-hero-image',
              type: 'image',
              src: `${ASSET_BASE}/s08-hero.jpg`,
              caption:
                'Repositioning, skin checks, and unblocked catheters — prevention is the whole game.',
            },
            {
              id: 'sci-s08-narration',
              type: 'text',
              body: [
                'With spinal cord injury, prevention is the whole game — because the resident can\'t feel the problems starting. Here are seven ways CNAs protect them.',
                '**One. Reposition faithfully — never skip it.** Repositioning on the schedule is the single most important thing you do. It relieves the pressure that the resident can\'t feel building. Follow the turning schedule exactly, use proper positioning and pillows to protect bony areas, and never let a busy shift push repositioning aside. This one habit prevents the most common serious complication.',
                '**Two. Check skin every time, like a detective.** At every repositioning and during care, inspect the skin over all bony areas — tailbone, hips, heels, elbows, shoulder blades, back of the head. Report any redness that doesn\'t fade, any change, immediately. You are the resident\'s warning system; catching a problem on day one prevents a wound that takes months.',
                '**Three. Protect against burns and injuries they can\'t feel.** Always test water temperature — bath, shower, anything. Never place hot items, heating pads, or hot food containers against skin that can\'t feel. Watch for bumps and injuries during transfers. Numb skin can be seriously harmed with no pain to warn anyone.',
                '**Four. Keep the catheter and bladder routine flawless.** Keep catheters unkinked, draining freely, and positioned correctly, and follow the bladder schedule and clean technique. This prevents urinary infections — and removes the number one trigger of autonomic dysreflexia. A blocked catheter isn\'t a small thing; it can set off an emergency.',
                '**Five. Support the bowel program and prevent constipation.** Follow the scheduled bowel program faithfully and support fluids and fiber as the plan allows. A full bowel and constipation are major triggers of autonomic dysreflexia, so this routine is both dignity care and emergency prevention.',
                '**Six. Protect breathing in higher injuries.** For residents with higher injuries, support good positioning for breathing, encourage the deep-breathing and coughing techniques the team recommends, and practice strong infection control — these residents are vulnerable to pneumonia. Report any breathing change promptly.',
                '**Seven. Prevent the emergency by removing its triggers.** Here\'s the unifying tip: the very routines above — unblocked catheter, regular bowel program, comfortable clothing and positioning, healthy skin — are exactly what prevent autonomic dysreflexia. Faithful daily care isn\'t just comfort; it\'s emergency prevention. And know the response cold, in case it happens anyway.',
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
              id: 'sci-s09-heading',
              type: 'heading',
              level: 1,
              text: 'Scenario & Reporting',
            },
            pendingAudio(
              'sci-s09-intro-audio',
              'Emergency response scenarios intro',
              `${ASSET_BASE}/s09-emergency-intro.mp3`,
              'With spinal cord injury, the emergency that tests you most is autonomic dysreflexia — sudden, dangerous, and unique to SCI. The other key skill is taking a silent warning sign seriously when the resident can\'t feel it. You\'re about to work through two situations. Read each carefully, choose your action, and you\'ll get feedback right away. Keep the response in mind: for autonomic dysreflexia — sit them up, loosen clothing, check the catheter, get help now.',
              '/assets/courses/spinal-cord-injury/s09-emergency-intro.mp3',
            ),
            {
              id: 'sci-s09-hero-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-hero.jpg`,
              caption:
                'Two SCI judgments — autonomic dysreflexia and silent pressure-injury warning signs.',
            },
            {
              id: 'sci-s09-scenario-reyes-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-scenario-reyes.jpg`,
              caption:
                'Sudden pounding headache with a blocked catheter — autonomic dysreflexia; sit up, unkink, get help now.',
            },
            {
              id: 'sci-s09-scenario-reyes',
              type: 'scenario_question',
              prompt:
                'Mr. Reyes, who has a high spinal cord injury, suddenly tells you he has a "terrible pounding headache" that came on fast. His face is flushed and sweating above his chest, and he seems anxious and unwell. You notice his urinary catheter bag hasn\'t drained in a while and the tubing looks kinked under his leg. What is the BEST action?',
              options: [
                {
                  id: 'lay-flat',
                  label: 'Lay him flat and tell him to rest until the headache passes',
                  feedback:
                    'This is autonomic dysreflexia — a sudden pounding headache, sweating and flushing above the injury, with a blocked catheter as the trigger. Laying him flat raises the danger, and medicating or ignoring it could be fatal. The right action: sit him upright, loosen tight clothing, unkink the catheter, and get emergency help immediately.',
                },
                {
                  id: 'sit-up-unkink-help',
                  label:
                    'Sit him upright, loosen tight clothing, unkink the catheter tubing, and get emergency help immediately',
                  feedback:
                    'Exactly right. A sudden pounding headache with sweating and flushing above the injury, plus a blocked catheter, is classic autonomic dysreflexia — a dangerous blood-pressure spike that can cause a stroke if untreated. Your immediate actions are within scope and can be lifesaving: sit him upright — never flat, since sitting up lowers blood pressure — loosen any tight clothing, and address the trigger you can see by unkinking the catheter so it drains. And get emergency help immediately. You don\'t give medication, but sitting him up, relieving the trigger, and summoning help fast is exactly the right response.',
                  isRecommended: true,
                },
                {
                  id: 'headache-medicine',
                  label: 'Give him a headache medication and wait',
                  feedback:
                    'This is autonomic dysreflexia — a sudden pounding headache, sweating and flushing above the injury, with a blocked catheter as the trigger. Laying him flat raises the danger, and medicating or ignoring it could be fatal. The right action: sit him upright, loosen tight clothing, unkink the catheter, and get emergency help immediately.',
                },
                {
                  id: 'ignore-it',
                  label: 'Ignore it since he has headaches sometimes',
                  feedback:
                    'This is autonomic dysreflexia — a sudden pounding headache, sweating and flushing above the injury, with a blocked catheter as the trigger. Laying him flat raises the danger, and medicating or ignoring it could be fatal. The right action: sit him upright, loosen tight clothing, unkink the catheter, and get emergency help immediately.',
                },
              ],
              requiredForCompletion: true,
            },
            {
              id: 'sci-s09-scenario-donovan-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-scenario-donovan.jpg`,
              caption:
                'Non-blanching redness over the tailbone — early pressure injury; reposition off the area and report promptly.',
            },
            {
              id: 'sci-s09-scenario-donovan',
              type: 'scenario_question',
              prompt:
                'While repositioning Ms. Donovan, who has paraplegia and no feeling below her waist, you notice a patch of redness over her tailbone that doesn\'t fade when you gently press it and release. She says she feels completely fine and didn\'t know anything was there. It\'s a busy shift and the area looks "minor." What SHOULD the CNA do?',
              options: [
                {
                  id: 'skip-it',
                  label: 'Skip it since she feels fine and it looks minor',
                  feedback:
                    'Non-blanching redness over the tailbone is an early pressure injury, and her not feeling it is the whole danger of SCI — no pain to warn anyone. Skipping it, rubbing it, or waiting lets it deepen into a serious wound. The right action: reposition her off the area and report the redness to the nurse promptly.',
                },
                {
                  id: 'reposition-report',
                  label:
                    'Reposition her off the area and report the non-blanching redness to the nurse promptly',
                  feedback:
                    'Right. Redness over a bony area that doesn\'t fade when pressed — non-blanching redness — is an early pressure injury, and the fact that she feels nothing is exactly the danger of SCI: there\'s no pain to warn anyone, so your eyes are the only warning system. Reposition her to relieve all pressure on the area, and report it to the nurse promptly so it\'s treated before it deepens. Don\'t rub it — rubbing can worsen the damage. Caught now, it can heal; ignored on a busy shift, it can become a deep wound that takes months. "She feels fine" is not reassurance here; it\'s the reason you have to be vigilant.',
                  isRecommended: true,
                },
                {
                  id: 'rub-area',
                  label: 'Rub the area firmly to improve circulation',
                  feedback:
                    'Non-blanching redness over the tailbone is an early pressure injury, and her not feeling it is the whole danger of SCI — no pain to warn anyone. Skipping it, rubbing it, or waiting lets it deepen into a serious wound. The right action: reposition her off the area and report the redness to the nurse promptly.',
                },
                {
                  id: 'wait-next-shift',
                  label: 'Wait until the next shift to mention it',
                  feedback:
                    'Non-blanching redness over the tailbone is an early pressure injury, and her not feeling it is the whole danger of SCI — no pain to warn anyone. Skipping it, rubbing it, or waiting lets it deepen into a serious wound. The right action: reposition her off the area and report the redness to the nurse promptly.',
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
            { id: 'sci-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
              id: 'sci-s10-video',
              type: 'video',
              title: "The CNA's Role",
              videoUrl: '/assets/courses/spinal-cord-injury/s10-cna-role.mp4',
              placeholderNote:
                'Pending upload: /assets/courses/spinal-cord-injury/s10-cna-role.mp4',
            },
            {
              id: 'sci-s10-hero-image',
              type: 'image',
              src: `${ASSET_BASE}/s10-hero.jpg`,
              caption:
                'The CNA as warning system — prevention, routines, emergencies, and respect for the whole person.',
            },
            {
              id: 'sci-s10-narration',
              type: 'text',
              body: [
                'Your role in spinal cord injury care brings together vigilant prevention, emergency readiness, and deep respect. Let\'s walk through it.',
                '**Be the warning system** Your first role is to be the sense of feeling the resident has lost. Reposition faithfully on schedule — never skipped, never delayed. Inspect the skin over every bony area, every time, and report any change immediately. Test every water temperature; keep heat away from numb skin. Watch for the infections and injuries the resident can\'t feel announcing. Your watchfulness is their protection, hour by hour.',
                '**Support mobility and routines** Support the body\'s daily management. Perform transfers safely with proper technique and equipment, protecting both the resident and yourself — and getting help for transfers that need it. Follow bladder and bowel programs faithfully and with full dignity. Keep catheters draining and unkinked. Maintain pressure-relief cushions and equipment. These routines protect health, dignity, and prevent emergencies all at once.',
                '**Know the emergencies cold** Be ready for the two emergencies. For autonomic dysreflexia — sudden pounding headache, sweating and flushing above the injury — sit the resident up, loosen tight clothing, check and unkink the catheter, and get help immediately. For breathing trouble in higher injuries — increasing shortness of breath, weak cough, color changes — position upright and get help immediately. Knowing these responses before they happen is what lets you act in the moment.',
                '**Honor the whole person** And never lose sight of this: the mind is fully intact. Many SCI residents are young adults whose lives changed in an instant. Treat them as the capable, intelligent equals they are. Support their independence — let them direct their own care, do what they can, make their own choices. Protect their dignity in every personal task. Listen to them; they know their own body and their own warning signs better than anyone. You\'re not just preventing complications — you\'re supporting a whole person living a full life.',
                'Now the boundary. You do not diagnose. You do not give or adjust medications. You do not perform therapy on your own — you reinforce it. And you never skip repositioning or skin checks, and never dismiss a sudden pounding headache or a non-fading redness because the resident "feels fine."',
                'Inside your role — relentless prevention, faithful routines, emergency readiness, and profound respect — you protect this resident\'s body and uplift their life. For someone who has lost so much sensation, a vigilant, respectful CNA is irreplaceable.',
              ].join('\n\n'),
            },
            {
              id: 'sci-s10-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Stay within scope',
              body: 'You do not diagnose. You do not give or adjust medications. You do not perform therapy on your own. And you never skip repositioning or skin checks, or dismiss a sudden pounding headache or non-fading redness because the resident "feels fine."',
            },
          ]),
      },
      {
        slug: 's11-case-study',
        title: 'Case Study',
        sortOrder: 2,
        buildContent: () => {
          const caseNarrative = [
            'Diego Reyes was thirty-one, injured in a motorcycle crash three years earlier, with a high spinal cord injury affecting all four limbs. Sharp, funny, and fiercely independent, he directed his own care down to the details. His CNA, Amara, respected that completely — she\'d learned to listen to him as the expert on his own body.',
            '',
            '**A normal afternoon:** Amara was helping another resident when Diego called out, his voice tight: "Amara — something\'s wrong. My head is pounding, came on out of nowhere. Bad." Amara came immediately. His face was flushed and beaded with sweat across his forehead and above his chest, though below that he looked normal. He seemed anxious. "This isn\'t a regular headache," he said. "I think it\'s my dysreflexia."',
            '',
            '**What Amara knew:** Amara had trained for exactly this. A sudden pounding headache with sweating and flushing above the injury in a resident with a high SCI meant autonomic dysreflexia — a dangerous blood-pressure spike, a true emergency. She also knew Diego knew his own body, and when he named it, she believed him instantly.',
            '',
            '**What Amara did — in order:** First, she sat him fully upright, not flat — she knew lying down would worsen the blood pressure. She loosened the collar of his shirt and a strap across his lap. Then she looked for the trigger: his catheter bag was full and the tubing had kinked under his arm where he\'d shifted, so urine wasn\'t draining — a classic dysreflexia trigger. She straightened the tubing and it began to flow. And she hit the call button hard, calling out: "Autonomic dysreflexia, room 14, I need the nurse now."',
            '',
            '**The resolution:** The nurse arrived within a minute, confirmed Amara\'s read, checked his blood pressure — high, as expected — and took over, with emergency protocols ready. With the catheter draining and Diego upright, the headache and sweating began to ease even before his blood pressure fully normalized. The trigger had been relieved early.',
            '',
            '**The outcome:** Diego was fine. The nurse told Amara afterward: "You did everything right, in the right order — sat him up, loosened him, found the kink, called us. If you\'d laid him down or waited, that blood pressure could\'ve stroked him out. Minutes mattered, and you didn\'t waste any."',
            '',
            '**Discussion:** Amara\'s response was the whole course in two minutes. She recognized autonomic dysreflexia from the signature signs. She trusted Diego\'s own knowledge of his body. She acted in the correct order within her scope — upright, loosen, find and relieve the trigger, summon help — without giving any medication or overstepping. And underneath it all was the respect she\'d built: because she listened to Diego as the expert on himself, she moved instantly when he said something was wrong. Vigilance, knowledge, scope, and respect — together, they may have saved his life.',
          ].join('\n');

          return doc('Brief Case Study', [
            { id: 'sci-s11-heading', type: 'heading', level: 1, text: 'Brief Case Study' },
            pendingAudio(
              'sci-s11-audio',
              "The Headache That Couldn't Wait",
              `${ASSET_BASE}/s11-case-podcast.mp3`,
              caseNarrative,
              '/assets/courses/spinal-cord-injury/s11-case-podcast.mp3',
            ),
            {
              id: 'sci-s11-hero-image',
              type: 'image',
              src: `${ASSET_BASE}/s11-hero.jpg`,
              caption:
                'Recognizing autonomic dysreflexia in real time — correct order, scope, and resident expertise.',
            },
            {
              id: 'sci-s11-case-study',
              type: 'case_study',
              title: "The Headache That Couldn't Wait",
              residentProfile:
                'Diego Reyes was thirty-one, injured in a motorcycle crash three years earlier, with a high spinal cord injury affecting all four limbs. Sharp, funny, and fiercely independent, he directed his own care down to the details. His CNA, Amara, respected that completely — she\'d learned to listen to him as the expert on his own body.',
              scenario: [
                '**A normal afternoon:** Amara was helping another resident when Diego called out, his voice tight: "Amara — something\'s wrong. My head is pounding, came on out of nowhere. Bad." Amara came immediately. His face was flushed and beaded with sweat across his forehead and above his chest, though below that he looked normal. He seemed anxious. "This isn\'t a regular headache," he said. "I think it\'s my dysreflexia."',
                '**What Amara knew:** Amara had trained for exactly this. A sudden pounding headache with sweating and flushing above the injury in a resident with a high SCI meant autonomic dysreflexia — a dangerous blood-pressure spike, a true emergency. She also knew Diego knew his own body, and when he named it, she believed him instantly.',
                '**What Amara did — in order:** First, she sat him fully upright, not flat — she knew lying down would worsen the blood pressure. She loosened the collar of his shirt and a strap across his lap. Then she looked for the trigger: his catheter bag was full and the tubing had kinked under his arm where he\'d shifted, so urine wasn\'t draining — a classic dysreflexia trigger. She straightened the tubing and it began to flow. And she hit the call button hard, calling out: "Autonomic dysreflexia, room 14, I need the nurse now."',
                '**The resolution:** The nurse arrived within a minute, confirmed Amara\'s read, checked his blood pressure — high, as expected — and took over, with emergency protocols ready. With the catheter draining and Diego upright, the headache and sweating began to ease even before his blood pressure fully normalized. The trigger had been relieved early.',
                '**The outcome:** Diego was fine. The nurse told Amara afterward: "You did everything right, in the right order — sat him up, loosened him, found the kink, called us. If you\'d laid him down or waited, that blood pressure could\'ve stroked him out. Minutes mattered, and you didn\'t waste any."',
                '**Discussion:** Amara\'s response was the whole course in two minutes. She recognized autonomic dysreflexia from the signature signs. She trusted Diego\'s own knowledge of his body. She acted in the correct order within her scope — upright, loosen, find and relieve the trigger, summon help — without giving any medication or overstepping. And underneath it all was the respect she\'d built: because she listened to Diego as the expert on himself, she moved instantly when he said something was wrong. Vigilance, knowledge, scope, and respect — together, they may have saved his life.',
              ].join('\n\n'),
            },
            {
              id: 'sci-s11-reflection-1',
              type: 'reflection',
              prompt:
                'Amara sat Diego upright rather than laying him down, and looked for the catheter problem. Why is the specific order of the autonomic dysreflexia response — and never lying the resident flat — so important?',
              minCharacters: 50,
            },
            {
              id: 'sci-s11-reflection-2',
              type: 'reflection',
              prompt:
                'Diego named his own emergency, and Amara believed him at once. Why is respecting a resident as the expert on their own body especially important in spinal cord injury care?',
              minCharacters: 50,
            },
            {
              id: 'sci-s11-rp-text',
              type: 'text',
              body: 'Reflect on the case study in the previous lesson. Your written responses help you apply what you learned about recognizing autonomic dysreflexia, the correct response order, and respecting the resident as the expert on their own body.',
            },
            {
              id: 'sci-s11-kc2-check',
              type: 'knowledge_check',
              question:
                'A CNA does not give or adjust any medication, and does not perform therapy on their own. When a resident with a high spinal cord injury suddenly has a pounding headache with sweating and flushing above the injury, the CNA SHOULD:',
              options: [
                {
                  id: 'lay-flat',
                  label: 'Lay the resident flat and wait for the headache to pass',
                },
                {
                  id: 'sit-up-respond',
                  label:
                    'Sit the resident upright, loosen tight clothing, check the catheter, and get help immediately',
                },
                {
                  id: 'give-medication',
                  label: 'Give a headache medication and recheck in an hour',
                },
                {
                  id: 'perform-therapy',
                  label: 'Perform therapy stretches on their own to relieve muscle tension',
                },
              ],
              correctOptionId: 'sit-up-respond',
              explanation:
                'Sit the resident upright — never flat — loosen tight clothing, check and unkink the catheter, and get help immediately. You never give or adjust medication or perform therapy on your own.',
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
            { id: 'sci-s12-heading', type: 'heading', level: 1, text: 'Conclusion' },
            {
              id: 'sci-s12-video',
              type: 'video',
              title: 'Conclusion',
              videoUrl: '/assets/courses/spinal-cord-injury/s12-conclusion.mp4',
              placeholderNote:
                'Pending upload: /assets/courses/spinal-cord-injury/s12-conclusion.mp4',
            },
            {
              id: 'sci-s12-hero-image',
              type: 'image',
              src: `${ASSET_BASE}/s12-hero.jpg`,
              caption: 'Five things that matter most for spinal cord injury care.',
            },
            {
              id: 'sci-s12-narration',
              type: 'text',
              body: [
                'You\'ve reached the end — and you\'ve completed the entire neurological series. Let\'s lock in the five things that matter most for spinal cord injury.',
                '**One.** A spinal cord injury cuts the communication between brain and body below the injury — so the resident loses movement and, critically, feeling. The mind stays fully intact, and many residents are young adults living full lives. Dignity and independence matter as much as safety.',
                '**Two.** No feeling means no warning — so you are the warning system. Reposition faithfully and never skip it. Check the skin over every bony area, every time, and report any redness that doesn\'t fade. Test every water temperature. Your eyes and hands replace the resident\'s lost sense of feeling.',
                '**Three.** Know autonomic dysreflexia cold. A sudden pounding headache with sweating and flushing above the injury is a dangerous blood-pressure emergency. Sit the resident upright — never flat — loosen tight clothing, check and unkink the catheter, and get help immediately. You may be the only one there when it strikes.',
                '**Four.** Faithful routines prevent emergencies. An unblocked catheter, a regular bowel program, healthy skin, and comfortable positioning don\'t just prevent sores and infections — they remove the very triggers of autonomic dysreflexia. Your daily care protects on several fronts at once.',
                '**Five.** Honor your scope and the whole person. You never diagnose, give medications, or perform therapy. But you own prevention, you know the emergency response, and you treat the resident as the capable, intelligent expert on their own body that they are. Listen to them — and protect them.',
              ].join('\n\n'),
            },
            {
              id: 'sci-s12-summary',
              type: 'summary',
              title: 'Five things that matter most',
              items: [
                'A spinal cord injury cuts communication below the injury — movement and feeling are lost, but the mind stays intact.',
                'No feeling means no warning — reposition faithfully, check skin every time, and test every water temperature.',
                'Know autonomic dysreflexia cold — sit upright, loosen clothing, check the catheter, get help immediately.',
                'Faithful routines prevent emergencies — unblocked catheter, bowel program, healthy skin, comfortable positioning.',
                'Honor your scope and the whole person — you own prevention; never diagnose, medicate, or perform therapy.',
              ],
            },
            {
              id: 'sci-s12-whn-text',
              type: 'text',
              body: 'Ten questions are waiting. Everything on them was covered here. You\'re ready. Trust what you\'ve learned, and show what you know.',
            },
            {
              id: 'sci-s12-completion-text',
              type: 'text',
              body: 'This course provides one hour of continuing education credit through CAL ACE Nursing Academy, an approved CDPH continuing education provider, NAC number 7384. Your certificate is generated automatically when you pass the knowledge check.',
            },
            {
              id: 'sci-s12-completion-callout',
              type: 'callout',
              variant: 'info',
              title: 'Scope reminder',
              body: 'CNAs protect, support, watch, and report. CNAs do not diagnose, give or adjust medications, or perform therapy.',
            },
            {
              id: 'sci-s12-certificate-text',
              type: 'text',
              body: 'Your certificate is generated automatically when you pass the knowledge check. CDPH-Approved CE Provider — NAC #7384.',
            },
          ]),
      },
    ],
  },
];


export async function seedCourse25SpinalCordInjury(
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
  console.log(`Seeding Course 25 (Spinal Cord Injury) as DRAFT — slug "${COURSE_SLUG}"…`);

  try {
    const result = await seedCourse25SpinalCordInjury(prisma);
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
