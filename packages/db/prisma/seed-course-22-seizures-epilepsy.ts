/**
 * Seed Course 22 — Seizures and Epilepsy: The CNA's Response (DRAFT).
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-22-seizures-epilepsy
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
const COURSE_SLUG = 'seizures-epilepsy';
const COURSE_TITLE = 'Seizure Events: Safe CNA Response and Documentation';
const COURSE_SUMMARY =
  'Learn to recognize seizures, protect a resident during a seizure, provide aftercare, time and document events, and support the care plan. CNAs do not diagnose seizures or epilepsy, give or adjust medications, or restrain a seizing resident or put anything in their mouth.';

const ASSET_BASE = `/assets/courses/seizures-epilepsy`;

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
    'Explain what a seizure is, in plain language',
    'Recognize different types of seizures',
    'Respond correctly during a seizure — and avoid the dangerous myths',
    'Provide proper aftercare',
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
  heroImage: '/assets/courses/seizures-epilepsy/hero-banner.jpg',
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
    title: 'Understanding Seizures and Epilepsy',
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: 'Introduction',
        sortOrder: 0,
        buildContent: () =>
          doc('Introduction', [
            { id: 'seiz-s01-heading', type: 'heading', level: 1, text: 'Welcome' },
            {
              id: 'seiz-s01-video',
              type: 'video',
              title: 'Introduction',
              videoUrl: `${ASSET_BASE}/s01-intro.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s01-intro.mp4`,
            },
            {
              id: 'seiz-s01-image',
              type: 'image',
              src: '/assets/courses/seizures-epilepsy/s01-hero.jpg',
              caption: 'A CAL ACE CNA calmly protecting a resident during and after a seizure.',
            },
            {
              id: 'seiz-s01-narration',
              type: 'text',
              body: [
                'Welcome to CAL ACE Nursing Academy.',
                'This course is about seizures and epilepsy — and exactly what a CNA does when a seizure happens.',
                'A seizure is a sudden burst of abnormal electrical activity in the brain. Think of the brain as running on carefully organized electrical signals — a seizure is like an electrical storm that briefly takes over. Depending on where the storm happens, a seizure can look very different: some cause full-body shaking, others just a blank stare, a strange repeated movement, or a moment of confusion.',
                'Epilepsy is the condition of having repeated seizures. But seizures can also happen to residents who don\'t have epilepsy — triggered by strokes, infections, very low blood sugar, medication problems, and more. In long-term care, where many residents have brain conditions, seizures are something every CNA must be ready for.',
                'Here\'s why this course matters so much. When a seizure happens, the CNA is almost always the person right there. And what you do in those minutes — and just as importantly, what you do NOT do — directly determines whether the resident comes through safely. There are old myths about seizure response that are actually dangerous: holding the person down, putting something in their mouth. This course replaces those myths with the right response: protect, time, observe, and report.',
                'You\'ll also learn one number to burn into memory: five minutes. A seizure lasting five minutes or more, or seizures coming one after another without recovery, is a medical emergency called status epilepticus. Knowing that line — and watching the clock — can save a life.',
                'Your scope is clear. A CNA protects a resident during a seizure, times it, observes it carefully, provides aftercare, and reports everything. A CNA does not diagnose seizures, does not give or adjust medications, never restrains a seizing resident, and never puts anything in their mouth.',
                'By the end of this course, you will be able to: explain what a seizure is, in plain language. Recognize different types of seizures. Respond correctly during a seizure — and avoid the dangerous myths. Provide proper aftercare. And know your scope.',
                'There is a ten-question knowledge check at the end. Everything on it is covered here. Let\'s begin.',
              ].join('\n\n'),
            },
            {
              id: 'seiz-s01-course-information-text',
              type: 'text',
              body: [
                'This course teaches the CNA\'s role in recognizing seizures, protecting a resident during a seizure, providing aftercare, timing and documenting events, and supporting the care plan.',
                'Let\'s be clear about your role. A CNA protects a resident during a seizure, times it, observes it carefully, provides aftercare, and reports everything. A CNA does not diagnose seizures, does not give or adjust medications, never restrains a seizing resident, and never puts anything in their mouth. Those are nursing and physician tasks. But none of them can happen without your careful observation and faithful reporting first.',
              ].join('\n\n'),
            },
            {
              id: 'seiz-s01-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of this course',
              body: 'CNAs PROTECT, TIME, OBSERVE, and REPORT. CNAs do not diagnose seizures, give or adjust medications, restrain a seizing resident, or put anything in their mouth.',
            },
            {
              id: 'seiz-s01-lo-text',
              type: 'text',
              body: 'By the end of this course, you will be able to:',
            },
            {
              id: 'seiz-s01-lo-summary',
              type: 'summary',
              title: 'Learning objectives',
              items: [
                'Explain what a seizure is, in plain language.',
                'Recognize different types of seizures.',
                'Respond correctly during a seizure — and avoid the dangerous myths.',
                'Provide proper aftercare.',
                'Know your scope — what a CNA does, and what a CNA must never do.',
              ],
            },
            {
              id: 'seiz-s01-instructor-intro-text',
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
            { id: 'seiz-s02-heading', type: 'heading', level: 1, text: 'Key terms' },
            {
              id: 'seiz-s02-image',
              type: 'image',
              src: '/assets/courses/seizures-epilepsy/s02-hero.jpg',
              caption: 'The language of seizures — tonic-clonic, absence, focal, aura, postictal, status epilepticus.',
            },
            {
              id: 'seiz-s02-reveal-seizure',
              type: 'reveal_card',
              frontTitle: 'Seizure',
              frontBody: 'SEE-zhur',
              backTitle: 'Seizure',
              backBody:
                'A sudden burst of abnormal electrical activity in the brain. It can cause shaking, stiffening, staring, confusion, or unusual movements — depending on where in the brain it happens. Most seizures last seconds to a couple of minutes and stop on their own.',
            },
            {
              id: 'seiz-s02-reveal-epilepsy',
              type: 'reveal_card',
              frontTitle: 'Epilepsy',
              frontBody: 'EP-ih-lep-see',
              backTitle: 'Epilepsy',
              backBody:
                'A condition where a person has repeated seizures over time. A single seizure does not mean epilepsy. Epilepsy is usually managed with daily medications that prevent seizures — which is why taking them faithfully matters so much.',
            },
            {
              id: 'seiz-s02-reveal-tonic-clonic',
              type: 'reveal_card',
              frontTitle: 'Tonic-Clonic Seizure',
              frontBody: 'TON-ik KLON-ik',
              backTitle: 'Tonic-Clonic Seizure',
              backBody:
                'The type most people picture: the body stiffens — that\'s the tonic phase — then jerks and shakes rhythmically — the clonic phase. The person loses consciousness and may fall. It usually lasts one to three minutes.',
            },
            {
              id: 'seiz-s02-reveal-absence',
              type: 'reveal_card',
              frontTitle: 'Absence Seizure',
              frontBody: 'AB-sahns',
              backTitle: 'Absence Seizure',
              backBody:
                'A brief seizure where the person suddenly stops and stares blankly, as if the world paused for a few seconds, then returns with no memory of it. Easy to miss — it can look like daydreaming. These brief blank spells are worth reporting.',
            },
            {
              id: 'seiz-s02-reveal-focal',
              type: 'reveal_card',
              frontTitle: 'Focal Seizure',
              frontBody: 'FOH-kal',
              backTitle: 'Focal Seizure',
              backBody:
                'A seizure starting in one area of the brain. The person may stay aware or become confused. It can cause twitching in one body part, strange sensations, lip-smacking, fumbling with clothes, or wandering movements. Not all seizures look like shaking.',
            },
            {
              id: 'seiz-s02-reveal-aura',
              type: 'reveal_card',
              frontTitle: 'Aura',
              frontBody: 'OR-ah',
              backTitle: 'Aura',
              backBody:
                'A warning feeling some people get just before a seizure — a strange smell, a rising feeling in the stomach, fear, or déjà vu. A resident who says "I feel one coming" should be helped to a safe position immediately and the nurse called.',
            },
            {
              id: 'seiz-s02-reveal-postictal',
              type: 'reveal_card',
              frontTitle: 'Postictal Period',
              frontBody: 'Post-IK-tal',
              backTitle: 'Postictal Period',
              backBody:
                'The recovery time after a seizure. The person may be confused, very sleepy, embarrassed, sore, or have a headache — sometimes for minutes to hours. Calm reassurance and rest, with safety, are the care this period needs.',
            },
            {
              id: 'seiz-s02-reveal-status-epilepticus',
              type: 'reveal_card',
              frontTitle: 'Status Epilepticus',
              frontBody: 'STAT-us ep-ih-LEP-tik-us',
              backTitle: 'Status Epilepticus',
              backBody:
                'A seizure lasting five minutes or more, or repeated seizures without recovery in between. This is a life-threatening medical emergency requiring immediate emergency response. This is why every seizure is timed.',
            },
            {
              id: 'seiz-s02-kc1-check-tonic-clonic',
              type: 'knowledge_check',
              question: 'Match the term: body stiffens then jerks, loss of consciousness',
              options: [
                { id: 'tonic-clonic', label: 'Tonic-clonic seizure' },
                { id: 'postictal', label: 'Postictal period' },
                { id: 'status-epilepticus', label: 'Status epilepticus' },
              ],
              correctOptionId: 'tonic-clonic',
              explanation:
                'Tonic-clonic seizure. The type most people picture: the body stiffens — that\'s the tonic phase — then jerks and shakes rhythmically — the clonic phase. The person loses consciousness and may fall.',
              requiredForCompletion: true,
            },
            {
              id: 'seiz-s02-kc1-check-postictal',
              type: 'knowledge_check',
              question: 'Match the term: confused, sleepy recovery time after a seizure',
              options: [
                { id: 'tonic-clonic', label: 'Tonic-clonic seizure' },
                { id: 'postictal', label: 'Postictal period' },
                { id: 'status-epilepticus', label: 'Status epilepticus' },
              ],
              correctOptionId: 'postictal',
              explanation:
                'Postictal period. The recovery time after a seizure. The person may be confused, very sleepy, embarrassed, sore, or have a headache — sometimes for minutes to hours.',
              requiredForCompletion: true,
            },
            {
              id: 'seiz-s02-kc1-check-status-epilepticus',
              type: 'knowledge_check',
              question: 'Match the term: seizure lasting 5+ minutes — a medical emergency',
              options: [
                { id: 'tonic-clonic', label: 'Tonic-clonic seizure' },
                { id: 'postictal', label: 'Postictal period' },
                { id: 'status-epilepticus', label: 'Status epilepticus' },
              ],
              correctOptionId: 'status-epilepticus',
              explanation:
                'Status epilepticus. A seizure lasting five minutes or more, or repeated seizures without recovery in between. This is a life-threatening medical emergency requiring immediate emergency response.',
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
            { id: 'seiz-s03-heading', type: 'heading', level: 1, text: 'Statistics' },
            pendingAudio(
              'seiz-s03-audio',
              'Seizures and Epilepsy: More Common in Older Adults Than Most People Think',
              `${ASSET_BASE}/s03-stats-podcast.mp3`,
              [
                'Seizures and Epilepsy: More Common in Older Adults Than Most People Think',
                '',
                'About 3.4 million Americans live with epilepsy, and roughly 1 in 10 people will experience at least one seizure in their lifetime. Here\'s the fact that surprises many: epilepsy is not mainly a childhood condition. New cases of epilepsy are actually most common in two groups — young children and adults over 65. In older adults, the rate of new epilepsy is among the highest of any age group, and it keeps rising with age.',
                '',
                'Why are seizures so relevant in long-term care? Because the leading causes of new seizures in older adults are exactly the conditions long-term care residents live with. Stroke is the most common cause of new epilepsy in the elderly — scarred brain tissue after a stroke can generate seizures. Dementia and Alzheimer\'s disease raise seizure risk significantly. Brain injuries, brain tumors, infections, very low blood sugar, kidney problems, and certain medication issues can all trigger seizures. So in a long-term care facility, seizures are not rare events — they are something every CNA should expect to encounter and be ready for.',
                '',
                'The danger of a seizure in an older adult goes beyond the seizure itself. Falls during a seizure can cause fractures and head injuries — and many residents are on blood thinners, making head injuries especially dangerous. Aspiration during or after a seizure can lead to pneumonia. And a prolonged seizure — five minutes or more — is a life-threatening emergency.',
                '',
                'Here\'s the encouraging part. Most seizures stop on their own within a couple of minutes, and when the person nearby responds correctly — protecting them from injury, timing the seizure, never restraining them or putting anything in their mouth, positioning them safely afterward, and reporting everything — outcomes are far better. Studies of seizure injuries show that many are preventable with correct first response. That correct first responder, in long-term care, is almost always the CNA.',
                '',
                'The bottom line: seizures are common in long-term care, they carry real injury risks in the elderly, and the CNA\'s calm, correct response is the single biggest factor in keeping a seizing resident safe.',
              ].join('\n'),
              `${ASSET_BASE}/s03-stats-podcast.mp3`,
            ),
            {
              id: 'seiz-s03-image',
              type: 'image',
              src: '/assets/courses/seizures-epilepsy/s03-hero.jpg',
              caption: 'Seizures are common and manageable — a calm, prepared response matters.',
            },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: 'Fundamentals',
        sortOrder: 3,
        buildContent: () =>
          doc('Fundamentals', [
            { id: 'seiz-s04-heading', type: 'heading', level: 1, text: 'Fundamentals' },
            {
              id: 'seiz-s04-narration',
              type: 'text',
              body: [
                '**The brain runs on electricity**',
                'The brain works through millions of tiny electrical signals, firing in organized patterns. These signals control everything — movement, speech, awareness, memory. When the patterns are organized, everything works smoothly.',
                '**A seizure is an electrical storm**',
                'A seizure happens when a group of brain cells suddenly fires abnormally, all at once — like an electrical storm that briefly takes over part or all of the brain. While the storm lasts, the brain can\'t do its normal work. When the storm ends, the brain gradually returns to normal.',
                '**Where the storm is decides what you see**',
                'This is the key to understanding why seizures look so different. If the storm covers the whole brain, you may see a tonic-clonic seizure — stiffening, falling, full-body jerking, loss of consciousness. If the storm stays in one area, you may see only what that area controls — twitching in one hand, a strange smell, lip-smacking, fumbling, a blank stare. Not all seizures look like shaking.',
                '**Most seizures end on their own**',
                'Here\'s a calming truth: most seizures stop by themselves within seconds to a couple of minutes. The brain\'s storm burns out. During those minutes, nothing you do can stop the seizure — and that\'s not your job. Your job is to protect the resident from injury while it runs its course, and to time it.',
                '**The five-minute line**',
                'But there is a line. A seizure lasting five minutes or more, or seizures repeating without the person recovering in between, is status epilepticus — a life-threatening emergency where the brain\'s storm won\'t stop on its own. This is why you always note the time a seizure starts. The clock tells you when ordinary becomes emergency.',
                '**The recovery period**',
                'After a seizure comes the postictal period — recovery. The brain is exhausted. The person may be confused, very drowsy, embarrassed, sore, or have a headache, for minutes to hours. They may not remember the seizure at all. This period needs calm, reassurance, rest, and safety — especially positioning on the side to protect breathing.',
                '**Seizures are manageable**',
                'Most epilepsy is well-controlled with daily medications that prevent seizures — when taken faithfully. Missed doses are one of the biggest causes of breakthrough seizures. Your support of the medication routine, your trigger awareness, and your correct response when a seizure happens are what keep residents with seizures safe.',
              ].join('\n\n'),
            },
            {
              id: 'seiz-s04-five-minute-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Five minutes = status epilepticus = emergency',
              body: 'Always note the time a seizure starts. A seizure lasting five minutes or more, or repeating without recovery, is a life-threatening emergency.',
            },
            {
              id: 'seiz-s04-video',
              type: 'video',
              title: 'Fundamentals',
              videoUrl: `${ASSET_BASE}/s04-fundamentals.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s04-fundamentals.mp4`,
            },
            {
              id: 'seiz-s04-image',
              type: 'image',
              src: '/assets/courses/seizures-epilepsy/s04-hero.jpg',
              caption: 'Understanding what happens in the brain during a seizure.',
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
            { id: 'seiz-s05-heading', type: 'heading', level: 1, text: 'Signs & Symptoms' },
            {
              id: 'seiz-s05-narration',
              type: 'text',
              body: [
                '**The seizures that don\'t shake**',
                'Start with the seizures people miss. An absence seizure: the resident suddenly stops mid-sentence or mid-activity and stares blankly for a few seconds, unresponsive, then returns as if nothing happened. A focal seizure: lip-smacking, chewing motions, fumbling with clothes, repeated swallowing, a wandering or dazed state, or twitching in just one part of the body. A resident having "blank spells," "daydreaming episodes," or odd repeated movements may be having seizures — report these patterns.',
                '**The warning and the start**',
                'Some residents sense a seizure coming — an aura: a strange smell, a rising stomach feeling, sudden fear. If a resident says "I feel funny" or "one is coming," help them to a safe position — sitting or lying down away from hazards — and call the nurse immediately. When any seizure starts, your first act is simple: note the time. The clock is part of the treatment.',
                '**The tonic-clonic seizure**',
                'The tonic-clonic seizure is unmistakable. The resident may cry out, lose consciousness, and fall. The body stiffens — then rhythmic jerking begins. Breathing may sound irregular; the lips may briefly look dusky; there may be drooling or loss of bladder control. It looks frightening, but remember: most last one to three minutes and stop on their own. Your role during it is protection, which the next sections cover in detail.',
                '**What to observe and record**',
                'While protecting the resident, observe like a camera, because your details guide diagnosis and treatment. When did it start and end — the duration. How did it begin — staring, stiffening, one side first? What moved — whole body, one arm, the face? Were the eyes open, rolled, turned to one side? Was there incontinence, injury, a cry, color change? And afterward — how confused, how sleepy, how long to return to normal? Report all of it.',
                '**Summary**',
                'Two pictures. What seizures can look like: blank staring spells, lip-smacking and fumbling, one-sided twitching, dazed wandering — or full stiffening and jerking with loss of consciousness. What you observe: the start time, the duration, what moved and how it began, eyes, color, incontinence, injury, and the recovery.',
                'The rule underneath it all: time every seizure from the moment it starts, observe like a camera, and report everything — and remember that not every seizure shakes.',
              ].join('\n\n'),
            },
            {
              id: 'seiz-s05-subtle-callout',
              type: 'callout',
              variant: 'warning',
              title: 'Not every seizure shakes',
              body: 'Blank staring spells, lip-smacking, fumbling, and one-sided twitching may be seizures. Report these patterns — do not dismiss them as daydreaming.',
            },
            {
              id: 'seiz-s05-image',
              type: 'image',
              src: '/assets/courses/seizures-epilepsy/s05-hero.jpg',
              caption: 'Recognizing seizure types — from full convulsions to subtle staring spells.',
            },
          ]),
      },
      {
        slug: 's06-causes',
        title: 'Causes',
        sortOrder: 1,
        buildContent: () =>
          doc('Causes', [
            { id: 'seiz-s06-heading', type: 'heading', level: 1, text: 'Causes' },
            pendingAudio(
              'seiz-s06-audio',
              'What Causes Seizures — and What Triggers Them?',
              `${ASSET_BASE}/s06-causes-podcast.mp3`,
              [
                'What Causes Seizures — and What Triggers Them?',
                '',
                'A seizure is the symptom of an electrical disturbance in the brain — and many different things can cause that disturbance, especially in older adults.',
                '',
                'In long-term care, the most common cause of new seizures is stroke. When a stroke damages brain tissue, the scarred area can later generate abnormal electrical activity. Dementia and Alzheimer\'s disease also raise seizure risk — the brain changes of dementia make seizures significantly more likely. Past head injuries, brain tumors, and brain infections are other structural causes.',
                '',
                'But not all seizures come from brain damage. Some come from problems elsewhere in the body that upset the brain\'s chemistry. Very low blood sugar — especially in residents with diabetes — can trigger a seizure. Severe dehydration or imbalances in body salts like sodium can do it. High fevers and serious infections, kidney or liver problems, and alcohol withdrawal are other causes. Certain medications, medication interactions, or suddenly stopping certain drugs can trigger seizures too.',
                '',
                'For residents who already have epilepsy, the question becomes: what triggers a breakthrough seizure — one that happens despite treatment? The biggest trigger, by far, is missed medication. Skipped or delayed anti-seizure doses are the leading cause of breakthrough seizures. Other common triggers include lack of sleep, illness and fever, stress, dehydration, and in some people flashing lights.',
                '',
                'Here\'s what this means for the CNA. First, in older adults a first-ever seizure is always significant and always reported — it often signals something that needs medical attention, from a stroke to low blood sugar. Second, for residents with known epilepsy, you powerfully prevent seizures by supporting the things that prevent them: faithful medication routines — reporting any refusal or missed dose immediately — good sleep, hydration, nutrition, and a calm environment. You can\'t control the brain\'s wiring, but you can absolutely reduce the triggers.',
              ].join('\n'),
              `${ASSET_BASE}/s06-causes-podcast.mp3`,
            ),
            {
              id: 'seiz-s06-image',
              type: 'image',
              src: '/assets/courses/seizures-epilepsy/s06-hero.jpg',
              caption: 'Understanding what can trigger or cause seizures.',
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
              id: 'seiz-s07-heading',
              type: 'heading',
              level: 1,
              text: 'CNA Role & Best Practices',
            },
            {
              id: 'seiz-s07-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of practice',
              body: 'CNAs SUPPORT, OBSERVE, and REPORT. CNAs never give anti-seizure or rescue medications. During a seizure: nothing in the mouth, no restraint, nothing by mouth, ever.',
            },
            {
              id: 'seiz-s07-image',
              type: 'image',
              src: '/assets/courses/seizures-epilepsy/s07-hero.jpg',
              caption: 'The CNA protects, times the seizure, and stays — never restrains, never puts anything in the mouth, never gives seizure medication.',
            },
            {
              id: 'seiz-s07-narration',
              type: 'text',
              body: [
                'Seizure treatment rests on daily preventive medication — and on a correct response when a seizure happens anyway. Let\'s walk through both, starting as always with the rule that never bends. A CNA does not give or adjust anti-seizure medications. And during a seizure, a CNA never gives anything by mouth — no medication, no water, nothing.',
                '**Anti-seizure medications.** Residents with epilepsy take daily medications — names like levetiracetam, phenytoin, or valproic acid — that calm the brain\'s electrical activity and prevent seizures. Here is the most important fact about them: they only work when taken consistently. A missed or delayed dose is the number one cause of breakthrough seizures. Your role: support the medication routine, and report any refusal, missed dose, or vomiting after a dose immediately — because that resident\'s seizure protection just dropped.',
                '**Side effects to report.** Anti-seizure medications can cause drowsiness, dizziness and unsteadiness — which raises fall risk — confusion, rashes, or changes in mood or behavior. You observe and report; the nurse and doctor adjust. A new rash on these medications is always reported promptly.',
                '**Rescue medications.** Some residents have a prescribed rescue medication for prolonged seizures — often given by the nurse in special forms, since nothing goes by mouth during a seizure. Your scope is absolute here: you never administer rescue medication. Your role is recognizing the prolonged seizure, summoning the nurse and emergency help fast, and protecting the resident.',
                '**What treatment never includes — the myths.** Let\'s kill the dangerous myths directly. You never put anything in a seizing person\'s mouth — not a spoon, not a cloth, not your fingers. A person cannot swallow their tongue; that\'s a myth, and objects in the mouth cause choking, broken teeth, and bitten fingers. You never restrain or hold down a seizing person — restraint causes injuries to them and to you. You never give water or food until they\'re fully awake and alert.',
                'The scope point for this whole section: support faithful daily dosing and report misses immediately — that\'s seizure prevention. And when a seizure happens: nothing in the mouth, no restraint, nothing by mouth, ever.',
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
            { id: 'seiz-s08-heading', type: 'heading', level: 1, text: 'Prevention & Risk Reduction' },
            {
              id: 'seiz-s08-image',
              type: 'image',
              src: '/assets/courses/seizures-epilepsy/s08-hero.jpg',
              caption: 'Preparing a safe environment to reduce seizure injury risk.',
            },
            {
              id: 'seiz-s08-narration',
              type: 'text',
              body: [
                'With seizures, prevention has two sides: helping prevent the seizures themselves, and preventing injury when one happens. Here are seven ways.',
                '**One. Guard the medication routine.** Missed anti-seizure doses are the number one cause of breakthrough seizures. Support the routine, help residents be ready for their medications, and report any refusal, missed dose, or vomiting after a dose immediately. This is the single most powerful seizure prevention there is.',
                '**Two. Support sleep, hydration, and nutrition.** Lack of sleep, dehydration, and skipped meals can all lower the seizure threshold. Support good sleep routines, encourage fluids as the plan allows, and report poor sleep or eating. Healthy basics are seizure protection.',
                '**Three. Reduce stress and illness triggers.** Stress and illness — especially fever — can trigger seizures. Keep care calm and unhurried, report early signs of illness or fever promptly, and support overall wellness.',
                '**Four. Know each resident\'s seizure history and plan.** The care plan tells you who has seizures, what theirs typically look like, their triggers, and any special precautions. Knowing this before a seizure happens means you\'ll respond faster and smarter when one does.',
                '**Five. Keep the environment injury-safe.** For residents with known seizures, follow the care plan\'s safety measures — padding where specified, careful supervision during bathing, and awareness of hard or sharp furniture near where they spend time. The seizure may be brief; the injury from striking a sharp corner can last much longer.',
                '**Six. Take "blank spells" seriously.** Brief staring episodes, repeated odd movements, or moments of unresponsiveness may be unrecognized seizures. Don\'t dismiss them as daydreaming or "senior moments." Report the pattern — recognizing subtle seizures gets residents the treatment that prevents bigger ones.',
                '**Seven. If an aura is reported — act immediately.** When a resident says "I feel one coming," help them to safety right away — seated or lying down, away from hazards — and call the nurse. Those seconds of warning, used well, prevent the fall that causes the worst injuries.',
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
              id: 'seiz-s09-heading',
              type: 'heading',
              level: 1,
              text: 'Scenario & Reporting',
            },
            pendingAudio(
              'seiz-s09-intro-audio',
              'Emergency response scenarios intro',
              `${ASSET_BASE}/s09-emergency-intro.mp3`,
              'When a seizure happens, the minutes belong to you — and what you do, and don\'t do, decides how safely the resident comes through. You\'re about to work through two situations. Read each carefully, choose your action, and you\'ll get feedback right away. Keep the course rules in mind: protect, time, observe, report — nothing in the mouth, no restraint — and five minutes means emergency.',
              `${ASSET_BASE}/s09-emergency-intro.mp3`,
            ),
            {
              id: 'seiz-s09-image',
              type: 'image',
              src: '/assets/courses/seizures-epilepsy/s09-hero.jpg',
              caption: 'Two seizure situations: protecting safely during a convulsion, and knowing when it becomes an emergency.',
            },
            {
              id: 'seiz-s09-scenario-castellanos-image',
              type: 'image',
              src: '/assets/courses/seizures-epilepsy/s09-scenario-castellanos.jpg',
              caption: 'A resident stiffening and jerking on the floor: note the time, clear hard objects, cushion the head — never restrain, never put anything in the mouth.',
            },
            {
              id: 'seiz-s09-scenario-castellanos',
              type: 'scenario_question',
              prompt:
                'Mr. Castellanos suddenly cries out, falls to the floor, stiffens, and begins jerking rhythmically. He is unconscious, drooling, and his lips look briefly dusky. A coworker rushing over says, "Hold his arms down — and put this washcloth in his mouth so he doesn\'t swallow his tongue!" What is the BEST action?',
              options: [
                {
                  id: 'hold-restrain-mouth',
                  label: 'Hold his arms down and place the washcloth in his mouth as suggested',
                  feedback:
                    'The coworker\'s advice is a dangerous myth. Never restrain a seizing person and never put anything in their mouth — no one can swallow their tongue, and objects cause choking and broken teeth. Moving him mid-seizure or giving water are also dangerous. The right response: note the time, clear hazards, cushion his head, send for the nurse, and let the seizure run its course while you protect him.',
                },
                {
                  id: 'protect-time-observe',
                  label: 'Note the time, clear hard objects away, cushion his head, never restrain him or put anything in his mouth, and send for the nurse',
                  feedback:
                    'Exactly right. The correct response: note the time the seizure started, clear furniture and hard objects away, cushion his head with something soft, loosen tight clothing at the neck if you safely can, and send for the nurse while staying with him. And you correctly rejected the dangerous myths — never restrain a seizing person, and never put anything in their mouth. A person cannot swallow their tongue; objects in the mouth cause choking and injuries. Don\'t move him during the seizure unless he\'s in immediate danger, and never give anything by mouth.',
                  isRecommended: true,
                },
                {
                  id: 'move-to-bed',
                  label: 'Pick him up and move him onto the bed while he\'s jerking',
                  feedback:
                    'The coworker\'s advice is a dangerous myth. Never restrain a seizing person and never put anything in their mouth — no one can swallow their tongue, and objects cause choking and broken teeth. Moving him mid-seizure or giving water are also dangerous. The right response: note the time, clear hazards, cushion his head, send for the nurse, and let the seizure run its course while you protect him.',
                },
                {
                  id: 'give-water',
                  label: 'Give him a sip of water to help him',
                  feedback:
                    'The coworker\'s advice is a dangerous myth. Never restrain a seizing person and never put anything in their mouth — no one can swallow their tongue, and objects cause choking and broken teeth. Moving him mid-seizure or giving water are also dangerous. The right response: note the time, clear hazards, cushion his head, send for the nurse, and let the seizure run its course while you protect him.',
                },
              ],
              requiredForCompletion: true,
            },
            {
              id: 'seiz-s09-scenario-adeyemi-image',
              type: 'image',
              src: '/assets/courses/seizures-epilepsy/s09-scenario-adeyemi.jpg',
              caption: 'A seizure that has reached five minutes: recognize status epilepticus, activate emergency response now, and keep protecting her.',
            },
            {
              id: 'seiz-s09-scenario-adeyemi',
              type: 'scenario_question',
              prompt:
                'The seizure you\'ve been protecting Mrs. Adeyemi through is continuing. You noted it started at 2:10, and the clock now reads 2:15 — five full minutes — with no sign of stopping. The nurse has been called but hasn\'t arrived yet. What SHOULD the CNA do?',
              options: [
                {
                  id: 'keep-waiting',
                  label: 'Keep waiting quietly — seizures always stop on their own',
                  feedback:
                    'Five minutes of continuous seizing is status epilepticus — a life-threatening emergency. Waiting longer, restraining her, or giving rescue medication yourself are all wrong and dangerous. The right action: activate emergency response now, keep protecting her, and when the seizure ends, place her on her side and stay with her. This is exactly why every seizure is timed from the start.',
                },
                {
                  id: 'activate-emergency',
                  label: 'Recognize this as status epilepticus and activate emergency response (911) now, while continuing to protect her',
                  feedback:
                    'Right. A seizure lasting five minutes or more is status epilepticus — a life-threatening emergency that will not reliably stop on its own and needs emergency medical treatment now. Activate the emergency response immediately while continuing to protect her — and this is exactly why you noted the start time. When the seizure does end, place her on her side — the recovery position — to keep her airway clear, stay with her through the confused postictal period, and give nothing by mouth until she\'s fully awake and alert. And you never give rescue medication yourself — that is never a CNA\'s role.',
                  isRecommended: true,
                },
                {
                  id: 'hold-down',
                  label: 'Hold her down to make the seizure stop',
                  feedback:
                    'Five minutes of continuous seizing is status epilepticus — a life-threatening emergency. Waiting longer, restraining her, or giving rescue medication yourself are all wrong and dangerous. The right action: activate emergency response now, keep protecting her, and when the seizure ends, place her on her side and stay with her. This is exactly why every seizure is timed from the start.',
                },
                {
                  id: 'give-rescue-med',
                  label: 'Give her rescue medication from her drawer',
                  feedback:
                    'Five minutes of continuous seizing is status epilepticus — a life-threatening emergency. Waiting longer, restraining her, or giving rescue medication yourself are all wrong and dangerous. The right action: activate emergency response now, keep protecting her, and when the seizure ends, place her on her side and stay with her. This is exactly why every seizure is timed from the start.',
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
            { id: 'seiz-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
              id: 'seiz-s10-narration',
              type: 'text',
              body: [
                'When a seizure happens, you have a clear sequence. Let\'s walk through your role — during, after, and beyond.',
                '**The moment it starts: time and call** The instant a seizure begins, two things: note the time, and call for the nurse — shout for help or use the call system without leaving the resident. The start time is critical, because five minutes is the emergency line. Stay with the resident through the whole event. You are their protection now.',
                '**Protect during the seizure** Protect without restraining. If they\'re falling, ease them to the floor if you safely can. Clear away furniture and anything hard or sharp. Cushion the head with something soft — a folded towel, a pillow. Loosen tight clothing at the neck. Then let the seizure run its course. Never hold them down. Never put anything in the mouth. Never give anything by mouth. Observe like a camera — what\'s moving, how it started, the eyes, the color. If it reaches five minutes, or a second seizure starts before recovery, activate emergency response.',
                '**The moment it ends: recovery position** When the jerking stops, gently roll the resident onto their side — the recovery position. This lets saliva drain and keeps the airway clear, protecting against choking and aspiration. Check for injuries from the fall or the seizure. Keep them on their side as they begin to come around.',
                '**The postictal care** Now comes the recovery period. The resident may be confused, frightened, exhausted, or embarrassed — they may not remember what happened. Stay with them. Speak calmly and simply: "You\'re safe. I\'m here with you. You had a seizure and it\'s over." Let them rest. Give nothing to eat or drink until they\'re fully awake and alert. Protect their dignity — if there was incontinence, handle it matter-of-factly and privately. Then report and document everything: start time, duration, what you observed, injuries, and the recovery.',
                'Now the boundary. You do not diagnose seizures. You never give anti-seizure or rescue medications. You never restrain a seizing resident or put anything in their mouth. And you never leave a resident alone during a seizure or the confused recovery after it.',
                'Inside your role — time it, protect, recovery position, calm aftercare, full reporting — you are the difference between a seizure that passes safely and one that ends in injury. Few moments in a CNA\'s work matter more than these minutes.',
              ].join('\n\n'),
            },
            {
              id: 'seiz-s10-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Stay within scope',
              body: 'You do not diagnose seizures. You never give anti-seizure or rescue medications. You never restrain a seizing resident or put anything in their mouth. And you never leave a resident alone during a seizure or the confused recovery after it.',
            },
            {
              id: 'seiz-s10-video',
              type: 'video',
              title: "CNA's Role in Care",
              videoUrl: `${ASSET_BASE}/s10-cna-role.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s10-cna-role.mp4`,
            },
            {
              id: 'seiz-s10-image',
              type: 'image',
              src: '/assets/courses/seizures-epilepsy/s10-hero.jpg',
              caption: 'Documenting and reporting a seizure accurately — what was seen, and how long it lasted.',
            },
          ]),
      },
      {
        slug: 's11-case-study',
        title: 'Case Study',
        sortOrder: 2,
        buildContent: () => {
          const caseNarrative = [
            'Mrs. Fontaine, 79, had epilepsy following a stroke three years earlier, well-controlled on daily medication. Her CNA, Jerome, had read her care plan and knew her history — though she hadn\'t had a seizure in over a year.',
            '',
            '**The warning:** One afternoon, while Jerome helped her sort photographs, Mrs. Fontaine paused and said, "Jerome... I feel strange. Like before my seizures." Jerome didn\'t dismiss it. He immediately helped her from her chair to the bed, moved the photo box and a glass of water off the side table, and pressed the call button for the nurse: "Mrs. Fontaine says she feels a seizure coming, room 22."',
            '',
            '**The seizure:** Moments later, it began — she stiffened, then started jerking. Jerome\'s first act was a glance at the wall clock: 3:24. He cushioned her head with a pillow, made sure nothing hard was near her, and loosened her collar. The jerking looked frightening — her lips briefly dusky, drooling — but Jerome remembered his training: he did not hold her down, and when another aide arrived offering to "put something between her teeth," Jerome said clearly, "No — nothing in her mouth. Watch the door for the nurse."',
            '',
            '**The observation:** While protecting her, Jerome watched like a camera: the jerking involved her whole body, her eyes rolled upward, it started with her right hand twitching before spreading. At 3:26 — two minutes — the jerking slowed and stopped.',
            '',
            '**The aftercare:** Jerome rolled her gently onto her side, checked her for injuries — none — and stayed beside her. She woke slowly, confused and frightened: "What... what happened?" Jerome kept his voice calm: "You had a seizure, Mrs. Fontaine. It\'s over. You\'re safe, and I\'ve been right here." He gave her nothing to eat or drink while she was drowsy. When the nurse arrived, Jerome reported precisely: "Started 3:24, ended 3:26 — two minutes. Began with right-hand twitching, then whole body. Eyes rolled up. Brief dusky lips, drooling, no injury. She had an aura first — said she felt strange. She\'s postictal now, on her side."',
            '',
            '**The follow-up:** The nurse\'s assessment found the cause: Mrs. Fontaine had vomited shortly after her morning medication two days running — something that hadn\'t been connected — so her anti-seizure protection had quietly dropped. The doctor adjusted her plan. Jerome\'s exact timeline and the aura detail helped confirm it was a breakthrough seizure rather than something new.',
            '',
            '**Discussion:** Jerome\'s response was textbook from the first second. He acted on the aura before the seizure struck. He timed it from the start. He protected without restraining and firmly stopped the mouth myth — even correcting a coworker in the moment. He used the recovery position, gave calm reassuring aftercare, and delivered a camera-quality report. He never gave a medication and never diagnosed anything — and his minutes of correct response kept a frightening event from becoming a harmful one.',
          ].join('\n');

          return doc('Brief Case Study', [
            { id: 'seiz-s11-heading', type: 'heading', level: 1, text: 'Brief Case Study' },
            pendingAudio(
              'seiz-s11-audio',
              'The Clock on the Wall',
              `${ASSET_BASE}/s11-case-podcast.mp3`,
              caseNarrative,
              `${ASSET_BASE}/s11-case-podcast.mp3`,
            ),
            {
              id: 'seiz-s11-image',
              type: 'image',
              src: '/assets/courses/seizures-epilepsy/s11-hero.jpg',
              caption: 'A seizure handled correctly — protected, timed, reported.',
            },
            {
              id: 'seiz-s11-case-study',
              type: 'case_study',
              title: 'The Clock on the Wall',
              residentProfile:
                'Mrs. Fontaine, 79, had epilepsy following a stroke three years earlier, well-controlled on daily medication. Her CNA, Jerome, had read her care plan and knew her history — though she hadn\'t had a seizure in over a year.',
              scenario: [
                '**The warning:** One afternoon, while Jerome helped her sort photographs, Mrs. Fontaine paused and said, "Jerome... I feel strange. Like before my seizures." Jerome didn\'t dismiss it. He immediately helped her from her chair to the bed, moved the photo box and a glass of water off the side table, and pressed the call button for the nurse: "Mrs. Fontaine says she feels a seizure coming, room 22."',
                '**The seizure:** Moments later, it began — she stiffened, then started jerking. Jerome\'s first act was a glance at the wall clock: 3:24. He cushioned her head with a pillow, made sure nothing hard was near her, and loosened her collar. The jerking looked frightening — her lips briefly dusky, drooling — but Jerome remembered his training: he did not hold her down, and when another aide arrived offering to "put something between her teeth," Jerome said clearly, "No — nothing in her mouth. Watch the door for the nurse."',
                '**The observation:** While protecting her, Jerome watched like a camera: the jerking involved her whole body, her eyes rolled upward, it started with her right hand twitching before spreading. At 3:26 — two minutes — the jerking slowed and stopped.',
                '**The aftercare:** Jerome rolled her gently onto her side, checked her for injuries — none — and stayed beside her. She woke slowly, confused and frightened: "What... what happened?" Jerome kept his voice calm: "You had a seizure, Mrs. Fontaine. It\'s over. You\'re safe, and I\'ve been right here." He gave her nothing to eat or drink while she was drowsy. When the nurse arrived, Jerome reported precisely: "Started 3:24, ended 3:26 — two minutes. Began with right-hand twitching, then whole body. Eyes rolled up. Brief dusky lips, drooling, no injury. She had an aura first — said she felt strange. She\'s postictal now, on her side."',
                '**The follow-up:** The nurse\'s assessment found the cause: Mrs. Fontaine had vomited shortly after her morning medication two days running — something that hadn\'t been connected — so her anti-seizure protection had quietly dropped. The doctor adjusted her plan. Jerome\'s exact timeline and the aura detail helped confirm it was a breakthrough seizure rather than something new.',
                '**Discussion:** Jerome\'s response was textbook from the first second. He acted on the aura before the seizure struck. He timed it from the start. He protected without restraining and firmly stopped the mouth myth — even correcting a coworker in the moment. He used the recovery position, gave calm reassuring aftercare, and delivered a camera-quality report. He never gave a medication and never diagnosed anything — and his minutes of correct response kept a frightening event from becoming a harmful one.',
              ].join('\n\n'),
            },
            {
              id: 'seiz-s11-reflection-1',
              type: 'reflection',
              prompt:
                'Jerome glanced at the clock the instant the seizure began. Why is the start time one of the most important pieces of information in any seizure?',
              minCharacters: 50,
            },
            {
              id: 'seiz-s11-reflection-2',
              type: 'reflection',
              prompt:
                'A coworker offered to put something between Mrs. Fontaine\'s teeth, and Jerome refused. Why is "nothing in the mouth" an absolute rule — and why does the swallow-the-tongue myth persist?',
              minCharacters: 50,
            },
            {
              id: 'seiz-s11-reflection-intro-text',
              type: 'text',
              body: 'Reflect on the case study in the previous lesson. Your written responses help you apply what you learned about timing seizures, protecting without restraint, and refusing the mouth myth.',
            },
            {
              id: 'seiz-s11-kc2-check',
              type: 'knowledge_check',
              question:
                'A CNA does not give or adjust anti-seizure medications. And during a seizure, a CNA never gives anything by mouth — no medication, no water, nothing. When a resident is having a seizure, the CNA SHOULD:',
              options: [
                {
                  id: 'give-water',
                  label: 'Give the resident a sip of water to prevent dehydration',
                },
                {
                  id: 'protect-observe-report',
                  label: 'Protect the resident, note the time, observe carefully, and report to the nurse',
                },
                {
                  id: 'give-rescue-med',
                  label: 'Give the resident their rescue seizure medication',
                },
                {
                  id: 'restrain-mouth',
                  label: 'Hold the resident down and place a cloth in their mouth',
                },
              ],
              correctOptionId: 'protect-observe-report',
              explanation:
                'Protect, time, observe, and report. Never give anything by mouth during a seizure — no medication, no water, nothing. Never restrain or put anything in the mouth.',
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
            { id: 'seiz-s12-heading', type: 'heading', level: 1, text: 'Conclusion' },
            {
              id: 'seiz-s12-video',
              type: 'video',
              title: 'Conclusion',
              videoUrl: `${ASSET_BASE}/s12-conclusion.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s12-conclusion.mp4`,
            },
            {
              id: 'seiz-s12-image',
              type: 'image',
              src: '/assets/courses/seizures-epilepsy/s12-hero.jpg',
              caption: 'Protect, time it, stay, report — the CNA\'s role in a seizure.',
            },
            {
              id: 'seiz-s12-narration',
              type: 'text',
              body: [
                'You\'ve reached the end. Let\'s lock in the five things that matter most for seizures.',
                '**One.** A seizure is an electrical storm in the brain, and it wears many faces — full-body shaking, but also blank staring spells, lip-smacking, fumbling, or one-sided twitching. Not every seizure shakes, and subtle spells deserve reporting too.',
                '**Two.** During a seizure: protect, never restrain. Note the time it starts. Clear hazards, cushion the head, loosen tight clothing, and let it run its course. Never hold the resident down, never put anything in their mouth, never give anything by mouth. No one can swallow their tongue — that myth causes real injuries.',
                '**Three.** Watch the clock — five minutes is the emergency line. A seizure lasting five minutes or more, or repeating without recovery, is status epilepticus. Activate emergency response immediately. This is exactly why you time every seizure from the start.',
                '**Four.** After the seizure: recovery position and calm care. Roll the resident onto their side to protect the airway, check for injuries, reassure them gently through the confused recovery, give nothing by mouth until fully alert, protect their dignity — and report everything you observed, like a camera.',
                '**Five.** Honor your scope — and prevent the next one. You never give anti-seizure or rescue medications, and you never diagnose. But you prevent seizures powerfully: guard the medication routine and report any missed dose immediately — it\'s the number one cause of breakthrough seizures — and support sleep, hydration, and calm.',
              ].join('\n\n'),
            },
            {
              id: 'seiz-s12-summary',
              type: 'summary',
              title: 'Five things that matter most',
              items: [
                'A seizure is an electrical storm in the brain — not every seizure shakes, and subtle spells deserve reporting.',
                'During a seizure: protect, never restrain — note the time, clear hazards, cushion the head, nothing in the mouth.',
                'Watch the clock — five minutes is status epilepticus; activate emergency response immediately.',
                'After the seizure: recovery position, calm aftercare, give nothing by mouth until fully alert, report everything.',
                'Honor your scope — guard the medication routine and report any missed dose immediately.',
              ],
            },
            {
              id: 'seiz-s12-whn-text',
              type: 'text',
              body: 'Ten questions are waiting. Everything on them was covered here. You\'re ready. Trust what you\'ve learned, and show what you know.',
            },
            {
              id: 'seiz-s12-completion-requirements-text',
              type: 'text',
              body: 'This course provides one hour of continuing education credit through CAL ACE Nursing Academy, an approved CDPH continuing education provider, NAC number 7384. Your certificate is generated automatically when you pass the knowledge check.',
            },
            {
              id: 'seiz-s12-completion-requirements-callout',
              type: 'callout',
              variant: 'info',
              title: 'Scope reminder',
              body: 'CNAs protect, time, observe, and report. CNAs do not diagnose seizures, give or adjust medications, restrain a seizing resident, or put anything in their mouth.',
            },
            {
              id: 'seiz-s12-certificate-access-text',
              type: 'text',
              body: 'Your certificate is generated automatically when you pass the knowledge check. CDPH-Approved CE Provider — NAC #7384.',
            },
          ]),
      },
    ],
  },
];

export async function seedCourse22SeizuresEpilepsy(
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
  console.log(`Seeding Course 22 (Seizures and Epilepsy) as DRAFT — slug "${COURSE_SLUG}"…`);

  try {
    const result = await seedCourse22SeizuresEpilepsy(prisma);
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
