/**
 * Seed Course 48 — Vision Impairment & Eye Conditions (DRAFT).
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-48-vision-impairment
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
const COURSE_SLUG = 'vision-impairment';
const COURSE_TITLE = 'Vision Loss, Eye Conditions, and Safe Assistance';
const COURSE_SUMMARY =
  'Learn the CNA\'s role in supporting residents with vision impairment — understanding common age-related eye conditions, communicating with and guiding a low-vision or blind resident safely, supporting independence and dignity, preventing falls, supporting eye health and glasses/aids, and recognizing eye emergencies (sudden vision loss). CNAs do not diagnose eye conditions, treat eyes, give or adjust eye medications beyond facility policy/training, or perform eye procedures.';

const ASSET_BASE = `/assets/courses/vision-impairment`;

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
    'Recognize common eye conditions and vision impairment.',
    'Communicate with and safely guide a low-vision resident.',
    'Arrange a safe environment and prevent falls.',
    'Support independence and dignity.',
    'Recognize eye emergencies.',
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
  heroImage: '/assets/courses/vision-impairment/hero-banner.png',
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
    title: 'Understanding Vision Impairment & Eye Conditions',
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: 'Introduction',
        sortOrder: 0,
        buildContent: () =>
          doc('Welcome', [
            { id: 'vis-s01-heading', type: 'heading', level: 1, text: 'Welcome' },
            {
              id: 'vis-s01-video',
              type: 'video',
              title: 'Introduction',
              videoUrl: '/assets/courses/vision-impairment/s01-intro.mp4',
              placeholderNote: 'Pending upload: /assets/courses/vision-impairment/s01-intro.mp4',
            },
            {
              id: 'vis-s01-image',
              type: 'image',
              src: `${ASSET_BASE}/s01-hero.png`,
              caption:
                'Vision loss and eye conditions — providing safe, respectful assistance that supports independence.',
            },
            {
                          id: 'vis-s01-narration',
                          type: 'text',
                          body: [
                            'Welcome to CAL ACE Nursing Academy.',
                            'This course is about vision impairment and eye conditions — and it opens our series on the senses. Vision loss is one of the most common and life-altering challenges older adults face, and how a CNA supports a resident who can\'t see well shapes their safety, their independence, and their dignity every single day.',
                            'Let\'s begin with how common this is. Vision declines with age, and serious eye conditions become far more frequent in older adults. Many of your residents will have significant vision impairment — some legally blind, some with low vision that glasses can\'t fully correct, some who\'ve lost sight gradually and some suddenly. The leading age-related eye conditions have names you\'ll hear often: cataracts, a clouding of the lens; glaucoma, damage to the eye\'s nerve, often from pressure; macular degeneration, loss of the central vision you read and recognize faces with; and diabetic retinopathy, eye damage from diabetes. Each affects vision differently, and understanding them helps you support each resident.',
                            'Here\'s why vision loss matters so much in daily care. It dramatically raises the risk of falls — one of the gravest dangers to elders — because a resident who can\'t see clearly can\'t see hazards, edges, or changes in the floor. It threatens independence, making once-simple tasks — eating, dressing, finding the bathroom, moving safely — difficult or frightening. It can lead to isolation and depression, as a person loses the ability to read, recognize faces, and engage with the world. And it changes how you must communicate and provide care — because a resident who can\'t see you needs different things from you.',
                            'This course teaches the practical skills that make the difference: how to communicate with a resident who can\'t see you — announcing yourself, explaining before acting. How to guide a low-vision or blind resident safely, using the sighted-guide technique. How to arrange their environment for safety and independence — consistent placement, good lighting, clear pathways. How to prevent the falls that vision loss invites. And how to support their independence and dignity, rather than taking over.',
                            'The guiding spirit of this course is this: support independence, don\'t replace it. A resident with vision loss is not helpless — with the right support and environment, they can do a great deal for themselves. Your job is to make that possible, safely, and to preserve their dignity throughout.',
                            'Your scope is clear. A CNA communicates and guides safely, supports independence and dignity, prevents falls, supports eye health and visual aids, and recognizes and reports eye emergencies. A CNA does not diagnose eye conditions, does not treat eyes or give eye medications beyond facility policy and training, and does not perform eye procedures.',
                            'By the end of this course, you will be able to: recognize common eye conditions and vision impairment. Communicate with and safely guide a low-vision resident. Arrange a safe environment and prevent falls. Support independence and dignity. And recognize eye emergencies. Let\'s begin.',
                          ].join('\n\n'),
                        },
            {
                          id: 'vis-s01-ci-text',
                          type: 'text',
                          body: [
                            'This course teaches the CNA\'s role in supporting residents with vision impairment — understanding common age-related eye conditions, communicating with and guiding a low-vision or blind resident safely, supporting independence and dignity, preventing falls, supporting eye health and glasses/aids, and recognizing eye emergencies (sudden vision loss).',
                            'Let\'s be clear about your role. A CNA communicates and guides safely, supports independence and dignity, prevents falls, supports eye health and visual aids, and recognizes and reports eye emergencies. A CNA does not diagnose eye conditions, does not treat eyes or give eye medications beyond facility policy and training, and does not perform eye procedures. Those are eye professionals\' and nursing tasks. But none of them can happen without your careful observation, daily support, and faithful reporting first.',
                          ].join('\n\n'),
                        },
            {
                          id: 'vis-s01-ci-scope-callout',
                          type: 'callout',
                          variant: 'clinical',
                          title: 'Scope of this course',
                          body: 'CNAs COMMUNICATE, GUIDE, SUPPORT, and REPORT. CNAs do not diagnose eye conditions, treat eyes, give eye medications beyond facility policy/training, or perform eye procedures.',
                        },
            {
                          id: 'vis-s01-lo-text',
                          type: 'text',
                          body: 'By the end of this course, you will be able to:',
                        },
            {
                          id: 'vis-s01-lo-summary',
                          type: 'summary',
                          title: 'Learning objectives',
                          items: [
                            'Recognize common eye conditions and vision impairment.',
                            'Communicate with and safely guide a low-vision resident.',
                            'Arrange a safe environment and prevent falls.',
                            'Support independence and dignity.',
                            'Recognize eye emergencies.',
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
            { id: 'vis-s02-heading', type: 'heading', level: 1, text: 'Key terms' },
            {
              id: 'vis-s02-image',
              type: 'image',
              src: `${ASSET_BASE}/s02-hero.png`,
              caption:
                'Key terms — vision impairment, low vision, sighted guide, orientation, eye conditions.',
            },
            {
                          id: 'vis-s02-reveal-vision-impairment',
                          type: 'reveal_card',
                          frontTitle: 'Vision Impairment / Low Vision',
                          frontBody: 'Vision impairment',
                          backTitle: 'Vision Impairment / Low Vision',
                          backBody:
                            'Significant loss of sight that glasses or contacts can\'t fully correct — ranging from difficulty seeing detail to near-total blindness. A person with low vision usually has some usable sight; a legally blind person has very limited or no functional vision. Most older adults with vision loss are not totally blind.',
                        },
            {
                          id: 'vis-s02-reveal-cataracts',
                          type: 'reveal_card',
                          frontTitle: 'Cataracts',
                          frontBody: 'Cataracts',
                          backTitle: 'Cataracts',
                          backBody:
                            'A clouding of the eye\'s normally clear lens, causing blurry, dim, hazy vision and glare — like looking through a foggy window. Cataracts are very common with age, develop gradually, and are treatable with surgery that often restores vision well. A resident awaiting or recovering from cataract surgery is common.',
                        },
            {
                          id: 'vis-s02-reveal-glaucoma',
                          type: 'reveal_card',
                          frontTitle: 'Glaucoma',
                          frontBody: 'Glaw-KOH-mah',
                          backTitle: 'Glaucoma',
                          backBody:
                            'Damage to the optic nerve — the nerve connecting the eye to the brain — often from increased pressure in the eye. It typically steals peripheral, side vision first, often without early symptoms, and can lead to blindness if untreated. It\'s managed, often with daily eye drops that must be used faithfully.',
                        },
            {
                          id: 'vis-s02-reveal-macular-degeneration',
                          type: 'reveal_card',
                          frontTitle: 'Macular Degeneration',
                          frontBody: 'Macular degeneration',
                          backTitle: 'Macular Degeneration',
                          backBody:
                            'Damage to the macula, the central part of the retina, causing loss of the sharp central vision used to read, recognize faces, and see detail — while side vision often remains. A resident may see you approaching out of the side of their eye but not make out your face. It\'s a leading cause of vision loss in elders.',
                        },
            {
                          id: 'vis-s02-reveal-diabetic-retinopathy',
                          type: 'reveal_card',
                          frontTitle: 'Diabetic Retinopathy',
                          frontBody: 'Ret-in-OP-ah-thee',
                          backTitle: 'Diabetic Retinopathy',
                          backBody:
                            'Damage to the blood vessels of the retina caused by diabetes, which can blur vision, cause floaters and dark spots, and lead to blindness. It\'s a major reason diabetic residents need eye monitoring and good blood sugar control — connecting back to diabetes care.',
                        },
            {
                          id: 'vis-s02-reveal-legally-blind',
                          type: 'reveal_card',
                          frontTitle: 'Legally Blind',
                          frontBody: 'Legally blind',
                          backTitle: 'Legally Blind',
                          backBody:
                            'A specific level of vision loss defined by law — much worse than normal even with best correction. A legally blind person may still have some limited vision — seeing light, shapes, or movement — or none at all. The term describes a level of impairment, not necessarily total darkness.',
                        },
            {
                          id: 'vis-s02-reveal-sighted-guide',
                          type: 'reveal_card',
                          frontTitle: 'Sighted-Guide Technique',
                          frontBody: 'Sighted-guide technique',
                          backTitle: 'Sighted-Guide Technique',
                          backBody:
                            'The safe way to guide a person with vision loss: you offer your arm, they hold just above your elbow, and they walk a half-step behind, following your movements — rather than you grabbing, pushing, or pulling them. It lets them move safely and with control and dignity. A core skill of this course.',
                        },
            {
                          id: 'vis-s02-reveal-orientation',
                          type: 'reveal_card',
                          frontTitle: 'Orientation',
                          frontBody: 'Orientation',
                          backTitle: 'Orientation',
                          backBody:
                            'Helping a person with vision loss know where they are and where things are — describing the layout, the position of objects using clear directions, and keeping things in consistent places. Good orientation, plus consistent placement, lets a low-vision resident move and function far more independently and safely.',
                        },
            {
                          id: 'vis-s02-kc1-check-macular',
                          type: 'knowledge_check',
                          question:
                            'Match the term: loss of central vision (reading, faces); side vision often remains',
                          options: [
                            { id: 'macular-degeneration', label: 'Macular degeneration' },
                            { id: 'glaucoma', label: 'Glaucoma' },
                            { id: 'sighted-guide', label: 'Sighted-guide technique' },
                          ],
                          correctOptionId: 'macular-degeneration',
                          explanation:
                            'Macular degeneration. Damage to the macula, the central part of the retina, causing loss of the sharp central vision used to read, recognize faces, and see detail — while side vision often remains.',
                          requiredForCompletion: true,
                        },
            {
                          id: 'vis-s02-kc1-check-glaucoma',
                          type: 'knowledge_check',
                          question:
                            'Match the term: optic nerve damage, often losing side vision first; managed with drops',
                          options: [
                            { id: 'macular-degeneration', label: 'Macular degeneration' },
                            { id: 'glaucoma', label: 'Glaucoma' },
                            { id: 'sighted-guide', label: 'Sighted-guide technique' },
                          ],
                          correctOptionId: 'glaucoma',
                          explanation:
                            'Glaucoma. Damage to the optic nerve — the nerve connecting the eye to the brain — often from increased pressure in the eye. It typically steals peripheral, side vision first, often without early symptoms, and can lead to blindness if untreated. It\'s managed, often with daily eye drops that must be used faithfully.',
                          requiredForCompletion: true,
                        },
            {
                          id: 'vis-s02-kc1-check-sighted-guide',
                          type: 'knowledge_check',
                          question:
                            'Match the term: resident holds your arm and follows a half-step behind — safe, dignified guiding',
                          options: [
                            { id: 'macular-degeneration', label: 'Macular degeneration' },
                            { id: 'glaucoma', label: 'Glaucoma' },
                            { id: 'sighted-guide', label: 'Sighted-guide technique' },
                          ],
                          correctOptionId: 'sighted-guide',
                          explanation:
                            'Sighted-guide technique. The safe way to guide a person with vision loss: you offer your arm, they hold just above your elbow, and they walk a half-step behind, following your movements — rather than you grabbing, pushing, or pulling them.',
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
            { id: 'vis-s03-heading', type: 'heading', level: 1, text: 'Statistics' },
            pendingAudio(
              'vis-s03-audio',
              'Vision Loss in Elders: Common, Dangerous if Unsupported, and Deeply Manageable',
              `${ASSET_BASE}/s03-stats-podcast.mp3`,
              [
                'Vision Loss in Elders: Common, Dangerous if Unsupported, and Deeply Manageable',
                '',
                'Vision impairment is one of the most common conditions of aging. The leading age-related eye conditions — cataracts, glaucoma, macular degeneration, and diabetic retinopathy — become far more frequent with age, and a large share of older adults live with meaningful vision loss, from difficulty seeing detail to legal blindness. In long-term care, where the population is older and sicker, the proportion is higher still. So supporting residents who can\'t see well isn\'t a niche skill — it\'s everyday care.',
                '',
                'The consequences of vision loss, when unsupported, are serious. The most dangerous is falls. Vision is central to balance and to detecting hazards, edges, steps, spills, and obstacles — so vision-impaired elders fall far more often, and falls are among the leading causes of injury, fracture, hospitalization, and decline in older adults. Much of that risk is preventable with good lighting, clear pathways, consistent placement, and safe guiding. Beyond falls, vision loss threatens independence: tasks that were automatic — eating, dressing, grooming, finding the bathroom, moving around — become difficult, and a resident can lose the ability to do them safely without support. And vision loss takes a heavy emotional toll: losing the ability to read, recognize loved ones\' faces, watch, and engage with the world drives isolation and depression, which you learned travel with so many conditions. A resident going blind isn\'t just losing sight — they may be losing connection.',
                '',
                'Here\'s the hopeful and empowering part. Vision loss is highly manageable with the right support, and most of that support is exactly what a CNA provides. The medical care — treating cataracts with surgery, managing glaucoma with drops, monitoring diabetic eyes — belongs to the eye professionals. But the daily difference between a vision-impaired resident who is endangered, dependent, and isolated, and one who is safe, capable, and connected, is made by hands-on care: communicating so they always know who\'s there and what\'s happening, guiding them safely, arranging a consistent and well-lit environment, preventing falls, supporting their glasses and aids, and supporting their independence and dignity rather than taking over. Research on low-vision care is clear that these environmental and support measures dramatically reduce falls and preserve function and quality of life.',
                '',
                'There\'s one more piece that\'s pure CNA territory: dignity and independence. A vision-impaired resident is not helpless or incompetent — and being treated as if they are, or having everything done for them, is its own harm. Supporting a resident to do what they can, safely, and treating them as the capable adult they are, protects both their function and their sense of self. The bottom line: vision loss is common and, unsupported, dangerous and isolating — but with the communication, guiding, environment, fall-prevention, and dignity-preserving support a CNA provides, a resident with vision loss can be safe, independent, and connected.',
              ].join('\n'),
              '/assets/courses/vision-impairment/s03-stats-podcast.mp3',
            ),
            {
              id: 'vis-s03-image',
              type: 'image',
              src: `${ASSET_BASE}/s03-hero.png`,
              caption:
                'Vision impairment in long-term care — supporting safety and dignity.',
            },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: 'Fundamentals',
        sortOrder: 3,
        buildContent: () =>
          doc('Fundamentals', [
            { id: 'vis-s04-heading', type: 'heading', level: 1, text: 'Fundamentals' },
            {
              id: 'vis-s04-video',
              type: 'video',
              title: 'Fundamentals',
              videoUrl: '/assets/courses/vision-impairment/s04-fundamentals.mp4',
              placeholderNote: 'Pending upload: /assets/courses/vision-impairment/s04-fundamentals.mp4',
            },
            {
              id: 'vis-s04-image',
              type: 'image',
              src: `${ASSET_BASE}/s04-hero.png`,
              caption:
                'Understanding vision loss — how different eye conditions affect daily life.',
            },
            {
                          id: 'vis-s04-narration',
                          type: 'text',
                          body: [
                            '**Vision loss is a spectrum**',
                            'Vision loss isn\'t all-or-nothing. It ranges from mild difficulty seeing detail, to low vision that glasses can\'t fully fix, to legal blindness, to total blindness. Most older adults with vision impairment still have some usable sight — they may see shapes, light, movement, or to the side, even if they can\'t read or see your face. Knowing each resident\'s specific vision — what they can and can\'t see — lets you support them precisely, neither over-helping nor under-helping.',
                            '**The common eye conditions, and how they differ**',
                            'Each condition affects vision differently, which shapes your care. Cataracts cloud everything — blurry, dim, hazy, glare-sensitive vision, like a foggy window; treatable with surgery. Glaucoma steals side vision first, leaving "tunnel vision," often quietly; managed with daily drops. Macular degeneration destroys central vision — the resident can\'t see your face or read, but may see you out of the corner of their eye. Diabetic retinopathy blurs vision and causes spots and floaters. Knowing which a resident has tells you how to position yourself and help them.',
                            '**Why vision loss is so dangerous: falls**',
                            'Vision is essential for safe movement — for seeing edges, steps, obstacles, spills, and changes in the floor, and for balance itself. So a resident who can\'t see well is at high risk of falling, and falls are among the most serious dangers to elders: fractures, hospitalization, loss of independence, even death. This makes fall prevention — lighting, clear paths, consistent placement, safe guiding — central to vision care, not a side note. Protecting a low-vision resident from falls is protecting their life.',
                            '**Communication when a resident can\'t see you**',
                            'A resident who can\'t see you needs you to communicate differently — and getting this right is foundational. Always announce yourself when you enter — say who you are — because appearing silently is startling and disorienting. Speak before you touch. Explain what you\'re doing before and as you do it. Tell them when you\'re leaving, so they\'re not talking to an empty room. Use their name to get their attention. And don\'t rely on gestures, pointing, or "over there" — use clear words and directions. Your voice becomes their main way of knowing what\'s happening.',
                            '**Guiding safely: the sighted-guide technique**',
                            'There\'s a right way to help a vision-impaired resident move, and it matters. Offer your arm and let them take it — holding just above your elbow — and walk a half-step ahead so they follow your movements and feel changes through your arm. Don\'t grab, push, or pull them, which is unsafe and undignified. Describe the path — "we\'re turning left," "there\'s a step down here," "a doorway coming up." Pause at steps and changes. This sighted-guide technique lets the resident move safely, in control, and with dignity, rather than being dragged.',
                            '**Arranging the environment for safety and independence**',
                            'The environment makes or breaks a low-vision resident\'s safety and independence. Keep things in consistent places — their belongings, furniture, call light, water — so they can find them by memory; never rearrange without telling them. Keep pathways clear of clutter, cords, and obstacles. Ensure good, even lighting and reduce glare. Describe meal placement using the clock method — "your potatoes are at six o\'clock." Consistency and order let a resident function independently; a moved chair or a cluttered path can cause a fall.',
                            '**Independence and dignity: the guiding spirit**',
                            'The heart of vision care: support independence, don\'t replace it. A resident with vision loss is a capable adult, not a helpless one — with the right support and environment, they can do much for themselves, and doing so protects their function, confidence, and dignity. So help them do things rather than doing everything for them, offer help without forcing it, never treat them as incompetent or talk over them to others, and respect their autonomy and choices. Preserving independence and dignity is as important as preventing falls.',
                          ].join('\n\n'),
                        },
            {
                          id: 'vis-s04-independence-callout',
                          type: 'callout',
                          variant: 'clinical',
                          title: 'Support independence, don\'t replace it',
                          body: 'A resident with vision loss is a capable adult, not a helpless one. Announce yourself, guide with the sighted-guide technique, and keep the environment consistent and well-lit.',
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
            { id: 'vis-s05-heading', type: 'heading', level: 1, text: 'Signs & Symptoms' },
            {
              id: 'vis-s05-image',
              type: 'image',
              src: `${ASSET_BASE}/s05-hero.png`,
              caption:
                'Recognizing changes in vision — and knowing when to report them.',
            },
            {
                          id: 'vis-s05-narration',
                          type: 'text',
                          body: [
                            'You\'re often the first to notice vision trouble, including in residents who haven\'t said anything. Let\'s learn the signs — and the emergencies.',
                            '**Signs a resident is struggling to see**',
                            'Watch for the signs of vision difficulty: squinting, or holding things very close or far to see them. Trouble reading, or giving it up. Difficulty recognizing people or faces until they\'re close or speak. Bumping into objects, furniture, or door frames. Trouble seeing in dim light, or unusual sensitivity to glare. Feeling for things rather than reaching directly. Difficulty with steps, curbs, and changes in floor surface. Trouble finding food on the plate or items in the room. These signs, especially if new, may mean vision is declining — report them so the resident can be assessed.',
                            '**Behaviors that signal vision loss**',
                            'Sometimes vision loss shows up as behavior that\'s easy to misread. A resident who\'s become withdrawn, who\'s stopped activities they enjoyed like reading or watching television, who seems newly confused or hesitant in moving about, who\'s more anxious or clings to walls and furniture, or who\'s had new falls or near-falls — may be losing their sight. Don\'t assume it\'s "just aging," dementia, or stubbornness; consider vision. New mobility hesitancy, falls, and withdrawal can all be a resident who simply can\'t see well anymore — and that\'s reportable and often helpable.',
                            '**Eye problems to watch and report**',
                            'Watch the eyes themselves and report problems: redness, swelling, or discharge from the eye, which can mean infection. Excessive tearing, or a dry, gritty, painful eye. A resident rubbing or complaining of eye pain, itching, or irritation. Crusting or a stye. Cloudiness you can see in the eye. And for residents on eye drops — for glaucoma or after surgery — watch that they\'re getting them as ordered and report problems. Eye infections and irritations are reported so they can be treated, and never treated by you beyond your training and facility policy.',
                            '**The eye emergencies**',
                            'Some eye changes are emergencies and need immediate reporting, because rapid treatment can save sight. Sudden vision loss, in one or both eyes — any sudden change is urgent. A sudden shower of new floaters or flashing lights, or a "curtain" or shadow coming across the vision — possible signs of a detaching retina. Sudden, severe eye pain, especially with redness, nausea, or seeing halos — a possible acute glaucoma attack. An eye injury. Sudden double vision or vision change with other symptoms like weakness or confusion — which can signal a stroke. Report these immediately — with the eyes, sudden changes are emergencies, and time can mean the difference between saving and losing vision.',
                            '**Summary**',
                            'Four pictures. Vision difficulty: squinting, holding things close, bumping, trouble recognizing faces, feeling for things — report new changes. Behavioral signs: new withdrawal, stopped activities, mobility hesitancy, falls — consider vision, not just aging. Eye problems: redness, discharge, pain, irritation, drops issues — report. Emergencies: sudden vision loss, curtain/shadow, sudden floaters/flashes, severe eye pain with halos, eye injury — report immediately.',
                            'The rule underneath it all: notice and report signs of declining vision, including the behavioral ones; report eye problems; and treat any sudden vision change or severe eye pain as an emergency.',
                          ].join('\n\n'),
                        },
            {
                          id: 'vis-s05-emergency-callout',
                          type: 'callout',
                          variant: 'warning',
                          title: 'Eye emergencies',
                          body: 'Sudden vision loss, a curtain or shadow across the sight, sudden flashes and floaters, or severe eye pain with halos — report immediately. With the eyes, sudden changes are emergencies.',
                        },
          ]),
      },
      {
        slug: 's06-causes',
        title: 'Causes',
        sortOrder: 1,
        buildContent: () =>
          doc('Causes', [
            { id: 'vis-s06-heading', type: 'heading', level: 1, text: 'Causes' },
            pendingAudio(
              'vis-s06-audio',
              'What Causes Age-Related Vision Loss — and What a CNA Supports',
              `${ASSET_BASE}/s06-causes-podcast.mp3`,
              [
                'What Causes Age-Related Vision Loss — and What a CNA Supports',
                '',
                'Most vision loss in older adults comes from a handful of age-related eye conditions, plus the simple changes of an aging eye. Understanding them helps you support residents and know what to watch for.',
                '',
                'The aging eye itself changes: the lens stiffens and yellows, making near focus and color and contrast harder; the pupil reacts more slowly, so adjusting to light changes takes longer and night vision worsens; and more light is needed to see well. These normal changes are why good, even lighting matters so much. On top of these come the major conditions. Cataracts — clouding of the lens — are extremely common with age and develop gradually; their cause is largely aging, with sun exposure, smoking, and diabetes contributing, and they\'re very treatable with surgery. Glaucoma involves damage to the optic nerve, often linked to increased pressure inside the eye; it usually progresses silently, taking side vision first, which is why regular eye exams and faithful use of prescribed drops matter so much — undetected or untreated, it causes irreversible blindness. Macular degeneration damages the central retina, with age the main risk factor along with genetics, smoking, and other factors; it steals central vision while sparing the sides. Diabetic retinopathy comes from diabetes damaging the retina\'s blood vessels — directly tied to blood sugar control over time, connecting straight back to diabetes care.',
                '',
                'Other contributors round out the picture: strokes can damage vision; some medications affect the eyes; eye injuries and infections cause loss; and dry eye and other conditions add discomfort and difficulty. And of course uncorrected refractive error — simply needing the right glasses — causes plenty of avoidable poor vision, which is why making sure residents have and wear their correct, clean glasses is such a simple, high-value thing.',
                '',
                'So what does a CNA influence? You don\'t treat or cure these conditions — but you support much of what protects vision and function. You help ensure residents get to their eye appointments and screenings. You support faithful use of prescribed eye drops, especially glaucoma drops that must be used daily to prevent blindness, reporting when they\'re missed or problematic. You make sure residents have their glasses, that they\'re the right ones, clean, and worn. You support the diabetes care — blood sugar control — that protects diabetic eyes. You provide the lighting and safe environment that the aging eye needs. And you report changes early so treatable problems get caught. Much vision loss is preventable, treatable, or manageable — and the CNA supports the daily pieces that make that happen.',
                '',
                'The takeaway: age-related conditions and the aging eye cause most vision loss; medical professionals treat them; and the CNA supports eye care, drops, glasses, diabetes control, lighting, and early reporting — the daily things that protect a resident\'s remaining sight and function.',
              ].join('\n'),
              '/assets/courses/vision-impairment/s06-causes-podcast.mp3',
            ),
            {
              id: 'vis-s06-image',
              type: 'image',
              src: `${ASSET_BASE}/s06-hero.png`,
              caption:
                'Common eye conditions — cataracts, glaucoma, macular degeneration, and more.',
            },
          ]),
      },
      {
        slug: 's07-role',
        title: 'CNA Role & Best Practices',
        sortOrder: 2,
        buildContent: () =>
          doc('CNA Role & Best Practices', [
            { id: 'vis-s07-heading', type: 'heading', level: 1, text: 'CNA Role & Best Practices' },
            {
              id: 'vis-s07-image',
              type: 'image',
              src: `${ASSET_BASE}/s07-hero.png`,
              caption:
                'Your scope — assist safely, adapt the environment, and report changes.',
            },
            {
                          id: 'vis-s07-scope-callout',
                          type: 'callout',
                          variant: 'clinical',
                          title: 'Scope of practice',
                          body: 'CNAs COMMUNICATE, GUIDE, SUPPORT, and REPORT. CNAs never diagnose eye conditions, treat eyes or perform eye procedures, or give or adjust eye medications beyond facility policy and specific training.',
                        },
            {
                          id: 'vis-s07-narration',
                          type: 'text',
                          body: [
                            'Eye conditions are treated by eye professionals — but the daily support that keeps a vision-impaired resident safe, independent, and connected is the CNA\'s. Let\'s walk through it, starting with the rule that never bends, stated firmly because it matters most here. A CNA does not diagnose eye conditions, does not treat eyes or perform eye procedures, and does not give or adjust eye medications beyond facility policy and specific training.',
                            '**Communication and guiding — your foundational skills.** Communicate so the resident always knows what\'s happening: announce yourself when you enter, speak before touching, explain what you\'re doing, say when you leave, use their name, and use clear words rather than gestures. Guide safely with the sighted-guide technique: offer your arm for them to hold above the elbow, walk a half-step ahead, describe the path and warn of steps and turns, and never grab, push, or pull. These two skills — clear communication and safe guiding — are the heart of hands-on vision care.',
                            '**A safe, consistent environment.** Build the environment that keeps them safe and independent: keep belongings, furniture, and the call light in consistent places and never rearrange without telling them; keep pathways clear of clutter, cords, and hazards; ensure good, even lighting and reduce glare; and describe meal and object placement clearly, using the clock method for the plate. Consistency and order are what let a low-vision resident move and function safely on their own — and prevent the falls that vision loss invites.',
                            '**Supporting eye care, drops, and glasses.** Support the medical care without overstepping. Make sure residents have their glasses — the correct ones, clean, and worn — because uncorrected vision is needless impairment. Support faithful use of prescribed eye drops the nurse administers or that you assist with per training and policy — especially glaucoma drops, which must be used daily to prevent blindness — and report missed or problematic drops. Support attendance at eye appointments and screenings, and support diabetes blood sugar control that protects diabetic eyes. Report eye problems and vision changes.',
                            '**Fall prevention and physical safety.** Because vision loss is a leading fall risk, layer in fall prevention: the clear, well-lit, consistent environment above, plus close support during movement, appropriate footwear, and the facility\'s fall-prevention measures. Protecting a vision-impaired resident from falls is core to this care.',
                            '**Independence, dignity, and connection.** Support the resident to do what they can rather than doing everything for them, offer help without forcing it, never treat them as incompetent or talk about them over their head, and respect their choices. And counter the isolation vision loss brings — describe the world to them, support audio and large-print and accessible activities, and watch for the depression that vision loss can cause, responding as you learned.',
                            'The scope point for this section: you never diagnose, treat eyes, or medicate beyond your training — but you communicate and guide safely, build a safe environment, support drops, glasses, and eye care, prevent falls, and protect independence and dignity. Safe, dignified daily support is the care you deliver.',
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
            { id: 'vis-s08-heading', type: 'heading', level: 1, text: 'Prevention & Risk Reduction' },
            {
              id: 'vis-s08-image',
              type: 'image',
              src: `${ASSET_BASE}/s08-hero.png`,
              caption:
                'Supporting residents with vision loss — clear communication and a consistent environment.',
            },
            {
                          id: 'vis-s08-narration',
                          type: 'text',
                          body: [
                            'With vision impairment, prevention means preventing falls, protecting remaining sight and function, and supporting independence. Here are seven ways.',
                            '**One. Keep the environment consistent and clear.** Keep belongings, furniture, call light, and everything in consistent, known places, and never rearrange without telling the resident. Keep pathways clear of clutter, cords, and obstacles. A consistent, clear environment is the single biggest thing that lets a low-vision resident move safely and prevents the falls vision loss invites.',
                            '**Two. Ensure good lighting and reduce glare.** The aging and impaired eye needs more, even light. Make sure rooms and pathways are well-lit, especially at night and on routes to the bathroom, and reduce glare and harsh contrasts. Good lighting prevents falls and helps residents use the vision they have. Report lighting that\'s poor or burnt out.',
                            '**Three. Communicate and guide safely — every time.** Always announce yourself, explain before touching and acting, and use clear words. Guide with the sighted-guide technique — arm offered, resident holding above the elbow, you a half-step ahead, describing the path and warning of steps. Safe communication and guiding prevent both falls and the fear and disorientation of being startled or dragged.',
                            '**Four. Make sure glasses and aids are used.** Ensure residents have their correct glasses, clean and worn, and that magnifiers, large-print materials, and other aids are available and used. So much "vision loss" is simply missing or dirty glasses. Clean, correct glasses are one of the simplest, highest-value preventions there is.',
                            '**Five. Support eye care and faithful eye drops.** Support residents getting to eye appointments and screenings so treatable problems are caught, and support faithful use of prescribed eye drops — especially glaucoma drops, which prevent blindness only if used daily. Report missed or problematic drops. Supporting ongoing eye care protects remaining sight.',
                            '**Six. Layer in fall prevention.** Because vision loss is a major fall risk, combine the clear, lit, consistent environment with close support during movement, safe footwear, and facility fall-prevention measures. Watch vision-impaired residents especially closely during transfers and walking. Preventing falls is preventing the fractures and decline that threaten elders most.',
                            '**Seven. Support independence and connection.** Help residents do what they can rather than doing it all for them, which keeps their function and confidence strong. And counter isolation — describe the world, support accessible activities and audio, encourage connection, and watch for depression. Supporting independence and connection prevents the decline, helplessness, and isolation that unsupported vision loss can cause.',
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
            { id: 'vis-s09-heading', type: 'heading', level: 1, text: 'Scenario & Reporting' },
            pendingAudio(
              'vis-s09-intro-audio',
              'Emergency response scenarios intro',
              `${ASSET_BASE}/s09-emergency-intro.mp3`,
              'With vision impairment, the judgments that matter most are recognizing a sudden vision change as an emergency, and guiding and supporting a resident safely instead of in ways that endanger or diminish them. You\'re about to work through two situations. Read each carefully, choose your action, and you\'ll get feedback right away. Keep the core ideas in mind: sudden vision loss or a "curtain" across the sight is an emergency to report now — and safe guiding means offering your arm, not grabbing.',
              '/assets/courses/vision-impairment/s09-emergency-intro.mp3',
            ),
            {
              id: 'vis-s09-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-hero.png`,
              caption:
                'Recognizing urgent changes and assisting safely — some vision changes can\'t wait.',
            },
            {
              id: 'vis-s09-scenario-underhill-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-scenario-underhill.png`,
              caption:
                'A sudden \'curtain,\' flashes, or new floaters can signal an eye emergency — report right away, don\'t wait for an appointment.',
            },
            {
                          id: 'vis-s09-scenario-underhill',
                          type: 'scenario_question',
                          prompt:
                            'Mrs. Underhill suddenly tells you that the vision in her right eye has changed — she describes "a dark curtain coming down" over part of her sight, and she\'s now seeing flashes of light and a lot of new floaters, all starting in the last hour. A coworker says, "Her eyes are bad anyway — just have her rest and we\'ll mention it at the next eye appointment." What SHOULD the CNA do?',
                          options: [
                            {
                              id: 'wait-appointment',
                              label: 'Have her rest and wait for the next scheduled eye appointment',
                              feedback:
                                'A sudden "curtain" over the vision with new flashes and floaters can mean a detaching retina — an eye emergency where rapid treatment saves sight. Resting, waiting for the next appointment, or dismissing it as "bad eyes" risks permanent blindness. The right action: report it to the nurse immediately with the specific details, so she can be treated urgently.',
                            },
                            {
                              id: 'report-immediately',
                              label:
                                'Report it to the nurse immediately — sudden vision loss, a "curtain," flashes, and new floaters can signal a detaching retina, an eye emergency where fast treatment can save sight',
                              feedback:
                                'Right. A sudden change in vision — especially a "curtain" or shadow coming down over the sight, along with new flashing lights and a shower of new floaters, starting within an hour — is a classic warning of a retinal detachment, a true eye emergency. Untreated, it can cause permanent blindness in that eye, but with rapid treatment, sight can often be saved — so time genuinely matters. This is never a "wait for the next appointment" situation, and "her eyes are bad anyway" is exactly the dismissal that costs people their vision. Report it to the nurse immediately with the specific details — which eye, the curtain, the flashes and floaters, the sudden onset within the hour — so she can be evaluated and treated urgently. Don\'t put drops in or treat it yourself. With the eyes, sudden changes are emergencies, and your fast reporting can save her sight.',
                              isRecommended: true,
                            },
                            {
                              id: 'dismiss-nothing',
                              label: 'Tell her it\'s probably nothing and her eyes are just bad',
                              feedback:
                                'A sudden "curtain" over the vision with new flashes and floaters can mean a detaching retina — an eye emergency where rapid treatment saves sight. Resting, waiting for the next appointment, or dismissing it as "bad eyes" risks permanent blindness. The right action: report it to the nurse immediately with the specific details, so she can be treated urgently.',
                            },
                            {
                              id: 'put-drops',
                              label: 'Put eye drops in to help',
                              feedback:
                                'A sudden "curtain" over the vision with new flashes and floaters can mean a detaching retina — an eye emergency where rapid treatment saves sight. Resting, waiting for the next appointment, or dismissing it as "bad eyes" risks permanent blindness. The right action: report it to the nurse immediately with the specific details, so she can be treated urgently.',
                            },
                          ],
                          requiredForCompletion: true,
                        },
            {
              id: 'vis-s09-scenario-adeyemi-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-scenario-adeyemi.png`,
              caption:
                'Use the sighted-guide method — let the resident take your arm and walk at their pace; never grab, push, or take over.',
            },
            {
                          id: 'vis-s09-scenario-adeyemi',
                          type: 'scenario_question',
                          prompt:
                            'You need to help Mr. Adeyemi, who has significant vision loss but gets around with support, walk to the dining room. In a hurry, you\'re about to grab his arm and steer him along, and a coworker suggests, "Just take his arm and push him along quick, or push him in a wheelchair — it\'s faster than letting him walk." What is the BEST approach?',
                          options: [
                            {
                              id: 'grab-steer',
                              label: 'Grab his arm and steer/push him quickly to save time',
                              feedback:
                                'Grabbing and steering, or using an unneeded wheelchair "to save time," is unsafe and strips a capable resident of control and dignity — and abandoning him to "find his own way" is unsafe too. The right approach: offer your arm for him to hold above the elbow, walk a half-step ahead describing the path and warning of steps, at his pace — safe, dignified, independence-supporting.',
                            },
                            {
                              id: 'sighted-guide',
                              label:
                                'Offer your arm for him to hold above your elbow, walk a half-step ahead describing the path and warning of steps, at his pace',
                              feedback:
                                'Right. The safe, dignified way to guide a person with vision loss is the sighted-guide technique: offer your arm and let HIM take it, holding just above your elbow, while you walk a half-step ahead so he follows your movements and feels turns and stops through your arm. You describe the path as you go — "we\'re turning left," "small step down here," "doorway ahead" — and move at his pace. Grabbing and steering or pushing him is unsafe — it removes his control and balance and can cause a fall — and it\'s undignified, treating a capable adult like an object. Putting him in a wheelchair he doesn\'t need to "save time" strips away his independence and weakens his mobility. The whole spirit of vision care is support independence, don\'t replace it: let him walk, safely guided, at his pace. That keeps him safe, mobile, and treated with the dignity he deserves.',
                              isRecommended: true,
                            },
                            {
                              id: 'wheelchair-faster',
                              label: 'Push him in a wheelchair he doesn\'t need because it\'s faster',
                              feedback:
                                'Grabbing and steering, or using an unneeded wheelchair "to save time," is unsafe and strips a capable resident of control and dignity — and abandoning him to "find his own way" is unsafe too. The right approach: offer your arm for him to hold above the elbow, walk a half-step ahead describing the path and warning of steps, at his pace — safe, dignified, independence-supporting.',
                            },
                            {
                              id: 'find-own-way',
                              label: 'Tell him to find his own way to be independent',
                              feedback:
                                'Grabbing and steering, or using an unneeded wheelchair "to save time," is unsafe and strips a capable resident of control and dignity — and abandoning him to "find his own way" is unsafe too. The right approach: offer your arm for him to hold above the elbow, walk a half-step ahead describing the path and warning of steps, at his pace — safe, dignified, independence-supporting.',
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
            { id: 'vis-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
              id: 'vis-s10-video',
              type: 'video',
              title: 'The CNA\'s Role',
              videoUrl: '/assets/courses/vision-impairment/s10-cna-role.mp4',
              placeholderNote: 'Pending upload: /assets/courses/vision-impairment/s10-cna-role.mp4',
            },
            {
              id: 'vis-s10-image',
              type: 'image',
              src: `${ASSET_BASE}/s10-hero.png`,
              caption:
                'Your role — announcing yourself, describing surroundings, and keeping the environment consistent.',
            },
            {
                          id: 'vis-s10-narration',
                          type: 'text',
                          body: [
                            'Your role with vision-impaired residents is clear communication, safe guiding, a safe environment, eye-care support, and protecting independence and dignity. Let\'s walk through it.',
                            '**Communicate so they always know what\'s happening** Be the voice that keeps them oriented. Always announce yourself when you enter, speak before you touch, explain what you\'re doing as you do it, tell them when you leave, use their name, and use clear words instead of gestures. For a resident who can\'t see you, your communication is how they know who\'s there, what\'s happening, and that they\'re not alone. Get this right and everything else follows.',
                            '**Guide and move them safely** Guide with the sighted-guide technique — offer your arm, let them hold above your elbow, walk a half-step ahead, describe the path, and warn of steps and turns, never grabbing or pushing. Move at their pace. This keeps them safe from falls and lets them move with control and dignity rather than being steered like an object. Safe guiding is a core, hands-on skill of this care.',
                            '**Build and protect the safe environment** Be the keeper of a safe, consistent space. Keep belongings, furniture, and the call light in consistent places and never rearrange without telling them; keep pathways clear; ensure good lighting and reduce glare; describe meals with the clock method. And support their eye care — clean, correct glasses worn; faithful eye drops, especially glaucoma drops; eye appointments; and report eye problems and vision changes, treating sudden changes as emergencies.',
                            '**Protect independence, dignity, and connection** Hold to the guiding spirit: support independence, don\'t replace it. Help them do what they can rather than doing it all, offer help without forcing it, never treat them as incompetent or talk over them, and respect their choices. Counter isolation by describing the world and supporting accessible activities, and watch for the depression vision loss can bring. You protect not just their safety but their capability and their dignity.',
                            'Now the boundary. You do not diagnose eye conditions. You do not treat eyes or perform eye procedures. You do not give or adjust eye medications beyond your training and facility policy. And you never grab or push a resident instead of guiding safely, never rearrange their space without telling them, never treat a capable resident as helpless, and never dismiss a sudden vision change.',
                            'Inside your role — clear communication, safe guiding, a consistent safe environment, eye-care support, fall prevention, and protected independence and dignity — you keep a vision-impaired resident safe, capable, and connected to the world. That daily support is the whole of this care, and it\'s profoundly yours.',
                          ].join('\n\n'),
                        },
            {
                          id: 'vis-s10-scope-callout',
                          type: 'callout',
                          variant: 'clinical',
                          title: 'Stay within scope',
                          body: 'You do not diagnose eye conditions, treat eyes, or give or adjust eye medications beyond your training and facility policy. Never grab or push instead of guiding safely, never rearrange without telling them, and never dismiss a sudden vision change.',
                        },
          ]),
      },
      {
        slug: 's11-case-study',
        title: 'Case Study',
        sortOrder: 2,
        buildContent: () => {
          const caseNarrative = [
            'Mrs. Okonkwo, 83, had macular degeneration — she\'d lost most of her central vision and could no longer read or make out faces, though she still saw shapes and movement to the sides. She\'d been a fiercely independent woman, a former librarian, and the vision loss had hit her hard: she\'d grown withdrawn, anxious, and increasingly dependent, and she\'d had two near-falls in her first weeks. Some staff had started doing everything for her and moving her by the arm to be quick. Her new CNA, Reyna\'s colleague Daniel, took a different approach.',
            '',
            '**What Daniel understood:** Daniel knew the guiding spirit of vision care: support independence, don\'t replace it — and that Mrs. Okonkwo\'s withdrawal and near-falls weren\'t because she was helpless, but because her environment and the care around her hadn\'t been adapted to her vision. He understood her specific condition too: with macular degeneration, she couldn\'t see his face or read, but she could use her side vision and her other senses well if he supported them. He set out to make her safe and independent again, not to take over.',
            '',
            '**What Daniel did — communication and environment:** He started with communication. He always announced himself when he came in — "Good morning, Mrs. Okonkwo, it\'s Daniel" — so she was never startled by a silent presence or left guessing who was there. He explained everything before he did it, told her when he was leaving, and used clear words instead of pointing. Then he rebuilt her environment for independence: he worked with her to put her belongings in consistent, memorized places and made sure no one rearranged them without telling her, kept her pathways clear, improved the lighting, especially to the bathroom, and described her meals by the clock — "your chicken\'s at six o\'clock, peas at nine." He made sure her glasses and a magnifier for her remaining vision were available and clean.',
            '',
            '**Safe guiding and supported independence:** When she walked, he stopped steering her by the arm. Instead he offered his arm for her to hold, walked a half-step ahead, and described the path — "turning left, small step down here, doorway coming." She moved more safely and, crucially, more confidently, because she was in control. And he consistently let her do what she could: find her own clothes in their known places, feed herself once he\'d described the plate, manage her own washing where she was able — offering help without forcing it, and never doing for her what she could do for herself. He resisted the "it\'s faster if I just do it" shortcut, because he understood that doing it for her would slowly strip away the capability she had left.',
            '',
            '**The near-fall avoided, and the turn:** One day someone had left a cleaning cart in Mrs. Okonkwo\'s usually-clear pathway. Because Daniel had trained himself and reminded the team to keep her paths clear and to tell her of any change, the hazard was caught and moved before she reached it — a fall that simply didn\'t happen. And over the weeks, with a consistent environment, safe guiding, and her independence supported, Mrs. Okonkwo transformed: the anxiety eased, the near-falls stopped, and the former librarian came back to herself — moving confidently through her known space, feeding and dressing herself, even listening to audiobooks Daniel helped set up, reconnecting to the words she\'d loved. She told him, "You\'re the only one who lets me find my own way. Everyone else just grabs me."',
            '',
            '**The outcome:** Mrs. Okonkwo lived safely, independently, and far more happily — not because her vision improved, but because the care and environment around her were adapted to fit it, and her capability and dignity were protected rather than taken over. The nurse summed it up: "Two near-falls and total dependence under the \'just do everything for her\' approach. Safe and independent under yours. You didn\'t fix her eyes — you fixed everything around them, and you let her stay herself."',
            '',
            '**Discussion:** Daniel\'s case is vision care done right. He communicated so Mrs. Okonkwo always knew what was happening, guided her safely with the sighted-guide technique instead of steering her, and built the consistent, clear, well-lit environment that prevents falls and enables independence. Above all, he honored the guiding spirit — support independence, don\'t replace it — letting a capable woman do what she could and protecting her dignity, rather than taking over for speed. He stayed in scope, never diagnosing or treating her eyes, only supporting. And the result was a resident who was safer AND more independent AND happier — because good vision care protects all three at once.',
          ].join('\n');

          return doc('Brief Case Study', [
            { id: 'vis-s11-heading', type: 'heading', level: 1, text: 'Brief Case Study' },
            pendingAudio(
              'vis-s11-audio',
              'Letting Her Find Her Own Way',
              `${ASSET_BASE}/s11-case-podcast.mp3`,
              caseNarrative,
              '/assets/courses/vision-impairment/s11-case-podcast.mp3',
            ),
            {
              id: 'vis-s11-image',
              type: 'image',
              src: `${ASSET_BASE}/s11-hero.png`,
              caption:
                'Putting it together — safe, respectful, independence-focused support.',
            },
            {
                          id: 'vis-s11-case-study',
                          type: 'case_study',
                          title: 'Letting Her Find Her Own Way',
                          residentProfile:
                            'Mrs. Okonkwo, 83, had macular degeneration — she\'d lost most of her central vision and could no longer read or make out faces, though she still saw shapes and movement to the sides. She\'d been a fiercely independent woman, a former librarian, and the vision loss had hit her hard: she\'d grown withdrawn, anxious, and increasingly dependent, and she\'d had two near-falls in her first weeks. Some staff had started doing everything for her and moving her by the arm to be quick. Her new CNA, Reyna\'s colleague Daniel, took a different approach.',
                          scenario: [
                            '**What Daniel understood:** Daniel knew the guiding spirit of vision care: support independence, don\'t replace it — and that Mrs. Okonkwo\'s withdrawal and near-falls weren\'t because she was helpless, but because her environment and the care around her hadn\'t been adapted to her vision. He understood her specific condition too: with macular degeneration, she couldn\'t see his face or read, but she could use her side vision and her other senses well if he supported them. He set out to make her safe and independent again, not to take over.',
                            '**What Daniel did — communication and environment:** He started with communication. He always announced himself when he came in — "Good morning, Mrs. Okonkwo, it\'s Daniel" — so she was never startled by a silent presence or left guessing who was there. He explained everything before he did it, told her when he was leaving, and used clear words instead of pointing. Then he rebuilt her environment for independence: he worked with her to put her belongings in consistent, memorized places and made sure no one rearranged them without telling her, kept her pathways clear, improved the lighting, especially to the bathroom, and described her meals by the clock — "your chicken\'s at six o\'clock, peas at nine." He made sure her glasses and a magnifier for her remaining vision were available and clean.',
                            '**Safe guiding and supported independence:** When she walked, he stopped steering her by the arm. Instead he offered his arm for her to hold, walked a half-step ahead, and described the path — "turning left, small step down here, doorway coming." She moved more safely and, crucially, more confidently, because she was in control. And he consistently let her do what she could: find her own clothes in their known places, feed herself once he\'d described the plate, manage her own washing where she was able — offering help without forcing it, and never doing for her what she could do for herself. He resisted the "it\'s faster if I just do it" shortcut, because he understood that doing it for her would slowly strip away the capability she had left.',
                            '**The near-fall avoided, and the turn:** One day someone had left a cleaning cart in Mrs. Okonkwo\'s usually-clear pathway. Because Daniel had trained himself and reminded the team to keep her paths clear and to tell her of any change, the hazard was caught and moved before she reached it — a fall that simply didn\'t happen. And over the weeks, with a consistent environment, safe guiding, and her independence supported, Mrs. Okonkwo transformed: the anxiety eased, the near-falls stopped, and the former librarian came back to herself — moving confidently through her known space, feeding and dressing herself, even listening to audiobooks Daniel helped set up, reconnecting to the words she\'d loved. She told him, "You\'re the only one who lets me find my own way. Everyone else just grabs me."',
                            '**The outcome:** Mrs. Okonkwo lived safely, independently, and far more happily — not because her vision improved, but because the care and environment around her were adapted to fit it, and her capability and dignity were protected rather than taken over. The nurse summed it up: "Two near-falls and total dependence under the \'just do everything for her\' approach. Safe and independent under yours. You didn\'t fix her eyes — you fixed everything around them, and you let her stay herself."',
                            '**Discussion:** Daniel\'s case is vision care done right. He communicated so Mrs. Okonkwo always knew what was happening, guided her safely with the sighted-guide technique instead of steering her, and built the consistent, clear, well-lit environment that prevents falls and enables independence. Above all, he honored the guiding spirit — support independence, don\'t replace it — letting a capable woman do what she could and protecting her dignity, rather than taking over for speed. He stayed in scope, never diagnosing or treating her eyes, only supporting. And the result was a resident who was safer AND more independent AND happier — because good vision care protects all three at once.',
                          ].join('\n\n'),
                        },
            {
                          id: 'vis-s11-reflection-1',
                          type: 'reflection',
                          prompt:
                            'Under the "just do everything for her" approach, Mrs. Okonkwo had near-falls and became dependent and withdrawn. How did Daniel\'s environment and guiding changes make her both safer AND more independent?',
                          minCharacters: 50,
                        },
            {
                          id: 'vis-s11-reflection-2',
                          type: 'reflection',
                          prompt:
                            'Daniel resisted the "it\'s faster if I just do it for her" shortcut. Why is supporting a vision-impaired resident\'s independence — rather than taking over — so important to their wellbeing and dignity?',
                          minCharacters: 50,
                        },
            {
                          id: 'vis-s11-rp-text',
                          type: 'text',
                          body: 'Reflect on the case study in the previous lesson. Your written responses help you apply what you learned about communication, the sighted-guide technique, a consistent safe environment, and supporting independence rather than taking over.',
                        },
            {
                          id: 'vis-s11-kc2-check',
                          type: 'knowledge_check',
                          question:
                            'A CNA does not diagnose eye conditions, does not treat eyes or perform eye procedures, and does not give or adjust eye medications beyond facility policy and specific training. Mrs. Underhill suddenly tells you that the vision in her right eye has changed — she describes "a dark curtain coming down" over part of her sight, and she\'s now seeing flashes of light and a lot of new floaters, all starting in the last hour. A coworker says, "Her eyes are bad anyway — just have her rest and we\'ll mention it at the next eye appointment." What SHOULD the CNA do?',
                          options: [
                            {
                              id: 'wait-appointment',
                              label: 'Have her rest and wait for the next scheduled eye appointment',
                            },
                            {
                              id: 'report-immediately',
                              label:
                                'Report it to the nurse immediately — sudden vision loss, a "curtain," flashes, and new floaters can signal a detaching retina, an eye emergency where fast treatment can save sight',
                            },
                            {
                              id: 'dismiss-nothing',
                              label: 'Tell her it\'s probably nothing and her eyes are just bad',
                            },
                            {
                              id: 'put-drops',
                              label: 'Put eye drops in to help',
                            },
                          ],
                          correctOptionId: 'report-immediately',
                          explanation:
                            'You never diagnose, treat eyes, or medicate beyond your training — but your urgent recognition and immediate reporting of sudden vision changes are exactly what can save sight.',
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
            { id: 'vis-s12-heading', type: 'heading', level: 1, text: 'Conclusion' },
            {
              id: 'vis-s12-video',
              type: 'video',
              title: 'Conclusion',
              videoUrl: '/assets/courses/vision-impairment/s12-conclusion.mp4',
              placeholderNote: 'Pending upload: /assets/courses/vision-impairment/s12-conclusion.mp4',
            },
            {
              id: 'vis-s12-image',
              type: 'image',
              src: `${ASSET_BASE}/s12-hero.png`,
              caption:
                'Caring with respect — helping residents stay safe, oriented, and independent.',
            },
            {
                          id: 'vis-s12-narration',
                          type: 'text',
                          body: [
                            'You\'ve reached the end. Let\'s lock in the five things that matter most for caring for residents with vision impairment.',
                            '**One.** Vision loss is common in elders and life-altering — raising fall risk dramatically, threatening independence, and causing isolation and depression. The major conditions affect vision differently: cataracts cloud everything, glaucoma takes side vision, macular degeneration takes central vision, and diabetic retinopathy damages the retina. Knowing each resident\'s specific vision guides your support.',
                            '**Two.** Communicate so they always know what\'s happening. Announce yourself when you enter, speak before touching, explain what you\'re doing, say when you leave, use their name, and use clear words instead of gestures. For a resident who can\'t see you, your voice is how they stay oriented and unafraid.',
                            '**Three.** Guide safely and build a safe environment. Use the sighted-guide technique — offer your arm, they hold above the elbow, you a half-step ahead describing the path and warning of steps; never grab or push. Keep belongings and furniture in consistent places, never rearrange without telling them, keep pathways clear, and ensure good lighting. This prevents the falls vision loss invites.',
                            '**Four.** Support eye care, and know the emergencies. Keep glasses clean, correct, and worn; support faithful eye drops, especially glaucoma drops that prevent blindness; support eye appointments. And recognize eye emergencies — sudden vision loss, a curtain or shadow across the sight, sudden flashes and floaters, severe eye pain with halos — and report them immediately, because fast treatment can save sight.',
                            '**Five.** Support independence and dignity, and honor your scope. Support residents to do what they can rather than taking over, offer help without forcing it, never treat a capable adult as helpless, and counter isolation. You never diagnose, treat eyes, or medicate beyond your training — but you communicate, guide, arrange, support, and protect independence. Support independence, don\'t replace it — that\'s the heart of this care.',
                          ].join('\n\n'),
                        },
            {
                          id: 'vis-s12-summary',
                          type: 'summary',
                          title: 'Five things that matter most',
                          items: [
                            'Vision loss is common in elders — know how each condition affects sight differently.',
                            'Communicate so they always know what\'s happening — announce yourself, explain, use clear words.',
                            'Guide safely with the sighted-guide technique and build a consistent, well-lit environment.',
                            'Support eye care and recognize emergencies — sudden vision loss or a curtain across the sight, report immediately.',
                            'Support independence and dignity — honor your scope with compassion and hope.',
                          ],
                        },
            {
                          id: 'vis-s12-whn-text',
                          type: 'text',
                          body: 'Ten questions are waiting. Everything on them was covered here. You\'re ready. Trust what you\'ve learned, and show what you know.',
                        },
            {
                          id: 'vis-s12-cr-text',
                          type: 'text',
                          body: 'This course provides one hour of continuing education credit through CAL ACE Nursing Academy, an approved CDPH continuing education provider, NAC number 7384. Your certificate is generated automatically when you pass the knowledge check.',
                        },
            {
                          id: 'vis-s12-cr-callout',
                          type: 'callout',
                          variant: 'info',
                          title: 'Scope reminder',
                          body: 'CNAs communicate, guide, support, and report. CNAs do not diagnose eye conditions, treat eyes, give eye medications beyond facility policy/training, or perform eye procedures.',
                        },
            {
                          id: 'vis-s12-ca-text',
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

export async function seedCourse48VisionImpairment(
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
  console.log(
    `Seeding Course 48 (Vision Impairment & Eye Conditions) as DRAFT — slug "${COURSE_SLUG}"…`,
  );

  try {
    const result = await seedCourse48VisionImpairment(prisma);
    const blockCounts = blockCountsByLesson();
    const totalBlocks = Object.values(blockCounts).reduce((sum, count) => sum + count, 0);

    console.log('Seed complete.');
    console.log(`  Course:   ${COURSE_TITLE}`);
    console.log(`  Slug:     ${COURSE_SLUG}`);
    console.log(`  Created:  ${result.courseCreated ? 'yes (new)' : 'no (updated existing)'}`);
    console.log(`  Modules:  ${result.modulesUpserted}`);
    console.log(`  Lessons:  ${result.lessonsUpserted}`);
    console.log(`  Sections: ${PACKAGE_SECTION_LESSON_SLUGS.length} package sections mapped`);
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
