/**
 * Seed Course 15 — Caring for a Resident After a Stroke (DRAFT).
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-15-stroke
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
const COURSE_SLUG = 'stroke';
const COURSE_TITLE = 'Post-Stroke Care Support and Safety Monitoring';
const COURSE_SUMMARY =
  'Learn to recognize stroke warning signs using F-A-S-T, respond to a suspected acute stroke, and provide daily supportive care to stroke survivors — within CNA scope. CNAs do not diagnose stroke, give medications, or perform therapy treatments.';

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
    'Recognize the warning signs of a stroke using the F-A-S-T method',
    'Respond correctly to a suspected stroke',
    'Provide safe, dignified daily care to a resident recovering from stroke',
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
  heroImage: '/assets/courses/stroke/hero-banner.jpg',
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
    title: 'Understanding Stroke',
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: 'Introduction',
        sortOrder: 0,
        buildContent: () =>
          doc('Introduction', [
            { id: 'str-s01-heading', type: 'heading', level: 1, text: 'Welcome' },
            {
                          id: 'str-s01-video',
                          type: 'video',
                          title: 'Introduction',
                          videoUrl: `${ASSET_BASE}/s01-intro.mp4`,
                          placeholderNote: `Pending upload: ${ASSET_BASE}/s01-intro.mp4`,
                        },
            {
                          id: 'str-s01-image',
                          type: 'image',
                          src: '/assets/courses/stroke/s01-hero.jpg',
                          caption: 'A CAL ACE CNA recognizing the signs of stroke and acting fast.',
                        },
            {
                          id: 'str-s01-narration',
                          type: 'text',
                          body: [
                            'Welcome to CAL ACE Nursing Academy.',
                            'This course is about stroke — both recognizing one as it happens, and caring for a resident in the months and years after.',
                            'A stroke is a brain attack. Blood flow to part of the brain is suddenly cut off, and brain cells begin to die within minutes. There is a saying in stroke care that you will never forget after today: time is brain. The faster a stroke is recognized and help is called, the more brain — and more of the person — can be saved.',
                            'This course has two parts, because your role with stroke has two parts.',
                            'The first is recognition. A stroke can happen to any resident, at any time. You may be the first and only person to see it. Knowing the warning signs — and acting on them in seconds — can mean the difference between a full recovery and lifelong disability, between life and death.',
                            'The second is recovery care. Many of your residents are living with the effects of a stroke that happened weeks, months, or years ago. They may have weakness on one side, trouble speaking, difficulty swallowing, or changes in thinking and emotion. Caring for them well, every day, is some of the most meaningful work a CNA does.',
                            'There is a ten-question knowledge check at the end. Everything on it is covered here. Let\'s begin.',
                          ].join('\n\n'),
                        },
            {
                          id: 'str-s01-course-information-text',
                          type: 'text',
                          body: [
                            'This course teaches the CNA\'s role in recognizing stroke warning signs (FAST), responding to a suspected acute stroke, and providing daily supportive care to a resident recovering after a stroke.',
                            'Let\'s be clear about your scope. A CNA recognizes the signs of stroke and activates help immediately. A CNA provides skilled daily care to stroke survivors. A CNA does not diagnose stroke, does not give any medications, and does not perform the therapies that physical, occupational, and speech therapists provide. Your role is recognition, daily care, and faithful support of the recovery plan.',
                          ].join('\n\n'),
                        },
            {
                          id: 'str-s01-course-information-scope-callout',
                          type: 'callout',
                          variant: 'clinical',
                          title: 'Scope of this course',
                          body: 'CNAs RECOGNIZE stroke signs and ACTIVATE help. CNAs provide daily recovery care. CNAs do not diagnose stroke, give any medications, or perform therapist-led therapies.',
                        },
            {
                          id: 'str-s01-learning-objectives-text',
                          type: 'text',
                          body: 'By the end of this course, you will be able to:',
                        },
            {
                          id: 'str-s01-learning-objectives-summary',
                          type: 'summary',
                          title: 'Learning objectives',
                          items: [
                            'Recognize the warning signs of a stroke using the F-A-S-T method.',
                            'Respond correctly to a suspected stroke.',
                            'Provide safe, dignified daily care to a resident recovering from stroke.',
                            'Know your scope — what a CNA does, and what a CNA must never do.',
                          ],
                        },
            {
                          id: 'str-s01-instructor-intro-text',
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
            { id: 'str-s02-heading', type: 'heading', level: 1, text: 'Key terms' },
            {
                          id: 'str-s02-image',
                          type: 'image',
                          src: '/assets/courses/stroke/s02-hero.jpg',
                          caption: 'Knowing the language of stroke — FAST, TIA, ischemic, hemorrhagic.',
                        },
            {
                          id: 'str-s02-reveal-stroke',
                          type: 'reveal_card',
                          frontTitle: 'Stroke',
                          frontBody: 'Stroke',
                          backTitle: 'Stroke',
                          backBody:
                            'A sudden loss of blood flow to part of the brain, causing brain cells to die. It is sometimes called a brain attack, because like a heart attack, it is a sudden emergency where every minute counts.',
                        },
            {
                          id: 'str-s02-reveal-ischemic',
                          type: 'reveal_card',
                          frontTitle: 'Ischemic Stroke',
                          frontBody: 'Iss-KEE-mik',
                          backTitle: 'Ischemic Stroke',
                          backBody:
                            'The most common type. A blood clot blocks a vessel in the brain, cutting off blood flow — like a clog in a pipe. About eight out of ten strokes are this type.',
                        },
            {
                          id: 'str-s02-reveal-hemorrhagic',
                          type: 'reveal_card',
                          frontTitle: 'Hemorrhagic Stroke',
                          frontBody: 'Hem-or-AJ-ik',
                          backTitle: 'Hemorrhagic Stroke',
                          backBody:
                            'A blood vessel in the brain bursts and bleeds. Less common, but often more severe. Think of it as a pipe that breaks open instead of one that clogs.',
                        },
            {
                          id: 'str-s02-reveal-tia',
                          type: 'reveal_card',
                          frontTitle: 'TIA (Mini-Stroke)',
                          frontBody: 'T-I-A',
                          backTitle: 'TIA (Mini-Stroke)',
                          backBody:
                            'Transient ischemic attack, often called a mini-stroke. Stroke-like symptoms that appear and then go away within minutes or hours. A TIA is a serious warning sign that a major stroke may be coming — it is never ignored, always reported.',
                        },
            {
                          id: 'str-s02-reveal-fast',
                          type: 'reveal_card',
                          frontTitle: 'FAST',
                          frontBody: 'F-A-S-T',
                          backTitle: 'FAST',
                          backBody:
                            'The four-letter method for recognizing a stroke. F is Face drooping. A is Arm weakness. S is Speech difficulty. T is Time to call for help. You will master this in the signs section — it may be the most important thing you learn all year.',
                        },
            {
                          id: 'str-s02-reveal-hemiplegia',
                          type: 'reveal_card',
                          frontTitle: 'Hemiplegia and Hemiparesis',
                          frontBody: 'Hem-ee-PLEE-jee-ah / Hem-ee-pa-REE-sis',
                          backTitle: 'Hemiplegia and Hemiparesis',
                          backBody:
                            'Hemiplegia — paralysis on one side of the body. And hemiparesis — weakness on one side. After a stroke, one side of the body is often affected. The CNA learns to support the weaker side in all care.',
                        },
            {
                          id: 'str-s02-reveal-aphasia',
                          type: 'reveal_card',
                          frontTitle: 'Aphasia',
                          frontBody: 'Uh-FAY-zhah',
                          backTitle: 'Aphasia',
                          backBody:
                            'Difficulty with language after a stroke. A resident may struggle to find words, speak in a jumble, or have trouble understanding what\'s said. Their intelligence is intact — the words are just hard to reach. Patience is everything.',
                        },
            {
                          id: 'str-s02-reveal-dysphagia',
                          type: 'reveal_card',
                          frontTitle: 'Dysphagia',
                          frontBody: 'Diss-FAY-jah',
                          backTitle: 'Dysphagia',
                          backBody:
                            'Difficulty swallowing, common after a stroke. It raises the risk of food or liquid going into the lungs — called aspiration — which can cause serious pneumonia. Safe feeding practices, which you\'ll learn, protect against this.',
                        },
            {
                          id: 'str-s02-kc1-check-ischemic',
                          type: 'knowledge_check',
                          question: 'Match the term: Clot blocks a brain vessel (most common)',
                          options: [
                            { id: 'ischemic-stroke', label: 'Ischemic stroke' },
                            { id: 'aphasia', label: 'Aphasia' },
                            { id: 'dysphagia', label: 'Dysphagia' },
                          ],
                          correctOptionId: 'ischemic-stroke',
                          explanation:
                            'Ischemic stroke. The most common type. A blood clot blocks a vessel in the brain, cutting off blood flow — like a clog in a pipe. About eight out of ten strokes are this type.',
                          requiredForCompletion: true,
                        },
            {
                          id: 'str-s02-kc1-check-aphasia',
                          type: 'knowledge_check',
                          question: 'Match the term: Difficulty with language after stroke',
                          options: [
                            { id: 'ischemic-stroke', label: 'Ischemic stroke' },
                            { id: 'aphasia', label: 'Aphasia' },
                            { id: 'dysphagia', label: 'Dysphagia' },
                          ],
                          correctOptionId: 'aphasia',
                          explanation:
                            'Aphasia. Difficulty with language after a stroke. A resident may struggle to find words, speak in a jumble, or have trouble understanding what\'s said. Their intelligence is intact — the words are just hard to reach.',
                          requiredForCompletion: true,
                        },
            {
                          id: 'str-s02-kc1-check-dysphagia',
                          type: 'knowledge_check',
                          question: 'Match the term: Difficulty swallowing, risk of aspiration',
                          options: [
                            { id: 'ischemic-stroke', label: 'Ischemic stroke' },
                            { id: 'aphasia', label: 'Aphasia' },
                            { id: 'dysphagia', label: 'Dysphagia' },
                          ],
                          correctOptionId: 'dysphagia',
                          explanation:
                            'Dysphagia. Difficulty swallowing, common after a stroke. It raises the risk of food or liquid going into the lungs — called aspiration — which can cause serious pneumonia.',
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
            { id: 'str-s03-heading', type: 'heading', level: 1, text: 'Statistics' },
            pendingAudio(
              'str-s03-audio',
                          'Stroke: Why Every Minute Matters',
                          `${ASSET_BASE}/s03-stats-podcast.mp3`,
                          [
                            'Stroke: Why Every Minute Matters',
                            '',
                            'Stroke is one of the leading causes of death and the leading cause of long-term disability in the United States. About 800,000 people have a stroke each year — that\'s roughly one stroke every 40 seconds. The risk rises sharply with age, which is why stroke is so common among long-term care residents.',
                            '',
                            'Here is the statistic that drives everything a CNA does during an acute stroke: when a stroke happens, the brain loses about 1.9 million nerve cells every minute that blood flow is blocked. Doctors put it simply — time is brain. There are treatments that can dramatically reduce the damage of the most common type of stroke, but they only work if given within a few hours of the first symptom. The clock starts the moment symptoms begin, which means the moment someone recognizes them.',
                            '',
                            'That someone is very often a CNA. Because CNAs spend the most time with residents, they are frequently the first to notice a face drooping, an arm going weak, or speech becoming slurred. A CNA who recognizes these signs and calls for help immediately can be the reason a resident gets life-saving, disability-reducing treatment in time.',
                            '',
                            'The second part of the story is recovery. Most people survive their stroke — there are more than 7 million stroke survivors living in the United States. Many of them need help with daily activities because of weakness, speech difficulties, swallowing problems, or changes in thinking. A large share of long-term care residents are stroke survivors, and the daily care a CNA provides — safe transfers, careful feeding, patient communication, skin protection, and emotional support — is central to their quality of life.',
                            '',
                            'The bottom line: in the acute moment, fast recognition by a CNA saves brain. In the months and years after, skilled daily care by a CNA restores dignity and quality of life. Both halves of stroke care depend heavily on the CNA.',
                          ].join('\n'),
                          `${ASSET_BASE}/s03-stats-podcast.mp3`,
                        ),
            {
                          id: 'str-s03-image',
                          type: 'image',
                          src: '/assets/courses/stroke/s03-hero.jpg',
                          caption: 'Stroke is a time emergency — every minute counts.',
                        },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: 'Fundamentals',
        sortOrder: 3,
        buildContent: () =>
          doc('Fundamentals', [
            { id: 'str-s04-heading', type: 'heading', level: 1, text: 'Fundamentals' },
            {
                          id: 'str-s04-video',
                          type: 'video',
                          title: 'Fundamentals',
                          videoUrl: `${ASSET_BASE}/s04-fundamentals.mp4`,
                          placeholderNote: `Pending upload: ${ASSET_BASE}/s04-fundamentals.mp4`,
                        },
            {
                          id: 'str-s04-image',
                          type: 'image',
                          src: '/assets/courses/stroke/s04-hero.jpg',
                          caption: 'Understanding what happens in the brain during a stroke.',
                        },
            {
                          id: 'str-s04-narration',
                          type: 'text',
                          body: [
                            '**The brain needs constant blood flow**',
                            'The brain is the body\'s control center, and it is hungry. It needs a constant supply of oxygen-rich blood to work. When blood flow to a part of the brain stops, that part begins to fail within minutes — and the abilities it controlled begin to fail too.',
                            '**Two kinds of stroke**',
                            'There are two main types. In an ischemic stroke, a clot blocks a vessel — like a clogged pipe. This is the most common type. In a hemorrhagic stroke, a vessel bursts and bleeds into the brain. Both cut off normal blood flow, and both are emergencies.',
                            '**Why one side of the body is affected**',
                            'The brain is wired in a crossed pattern. The right side of the brain controls the left side of the body, and the left side of the brain controls the right side of the body. So a stroke on one side of the brain usually affects the opposite side of the body. This is why stroke survivors often have weakness on just one side.',
                            '**Different brain areas, different effects**',
                            'The effects of a stroke depend on which part of the brain was injured. One area controls movement, another controls speech, another controls swallowing, another controls emotion and judgment. This is why no two stroke survivors are exactly alike — and why each resident\'s care plan is unique.',
                            '**Why speech and swallowing are often affected**',
                            'The areas that control speaking, understanding language, and swallowing sit close together in the brain. This is why aphasia — trouble with language — and dysphagia — trouble swallowing — so often appear together after a stroke. Both shape how you communicate with and feed the resident safely.',
                            '**Recovery is real, and slow**',
                            'The brain has a remarkable ability to heal and re-route — this is called plasticity. With therapy and time, many stroke survivors regain abilities they lost. Recovery is often slow and uneven, with good days and hard days. Your steady patience and encouragement are part of that healing.',
                            '**The CNA\'s two jobs**',
                            'So your role has two faces. In the sudden moment of a stroke, you recognize and call for help — fast. In the long recovery, you provide daily care that protects the resident, supports their independence, and honors their dignity. The rest of this course prepares you for both.',
                          ].join('\n\n'),
                        },
            {
                          id: 'str-s04-plasticity-callout',
                          type: 'callout',
                          variant: 'clinical',
                          title: 'Time is brain',
                          body: 'When blood flow stops, the brain begins to fail within minutes. In the sudden moment, recognize and call for help fast. In recovery, steady daily care supports healing.',
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
            { id: 'str-s05-heading', type: 'heading', level: 1, text: 'Signs & Symptoms' },
            {
                          id: 'str-s05-image',
                          type: 'image',
                          src: '/assets/courses/stroke/s05-hero.jpg',
                          caption: 'FAST: Face, Arms, Speech, Time — the signs to act on.',
                        },
            {
                          id: 'str-s05-narration',
                          type: 'text',
                          body: [
                            'This is the most important section of the course. There is a simple, four-letter method that lets anyone recognize a stroke in seconds. It is called FAST. F-A-S-T. Learn it cold.',
                            '**F is for Face**',
                            'Ask the resident to smile. Look closely. Does one side of the face droop? Is the smile uneven? Sometimes one eyelid sags, or one cheek goes slack. A new, sudden droop on one side of the face is a stroke sign.',
                            '**A is for Arms**',
                            'Ask the resident to raise both arms and hold them up. Watch. Does one arm drift downward? Is one arm weak, or can they not lift it at all? Sudden weakness on one side — an arm, or a leg — is a stroke sign.',
                            '**S is for Speech**',
                            'Ask the resident to say a simple sentence — "The sky is blue today." Is their speech slurred? Are the words jumbled or wrong? Do they struggle to find words, or seem unable to understand you? Sudden trouble with speech is a stroke sign.',
                            '**T is for Time**',
                            'If you see any one of these signs — face, arm, or speech — it is Time to call for help immediately. Note the time you first saw the symptom, because that clock decides what treatment is possible. Do not wait. Do not "watch it for a while." Do not assume it will pass. One FAST sign means activate help now.',
                            '**Summary**',
                            'Remember FAST. Face drooping. Arm weakness. Speech difficulty. Time to call. Any one of these, appearing suddenly, means a possible stroke — and a possible stroke is an emergency, every time.',
                            'A few more signs can also mean stroke: sudden confusion, sudden trouble seeing, sudden severe headache with no known cause, sudden dizziness or loss of balance, sudden numbness on one side. The word that ties them all together is sudden. A sudden new change is your signal.',
                            'And the rule that covers it all: when you see a FAST sign, you do not diagnose, you do not wait, and you do not give anything. You activate help and note the time. The next section shows you exactly how.',
                          ].join('\n\n'),
                        },
            {
                          id: 'str-s05-fast-callout',
                          type: 'callout',
                          variant: 'warning',
                          title: 'FAST — learn it cold',
                          body: 'Face drooping. Arm weakness. Speech difficulty. Time to call. Any one FAST sign appearing suddenly means activate help now — do not wait, do not give anything.',
                        },
          ]),
      },
      {
        slug: 's06-causes',
        title: 'Causes',
        sortOrder: 1,
        buildContent: () =>
          doc('Causes', [
            { id: 'str-s06-heading', type: 'heading', level: 1, text: 'Causes' },
            pendingAudio(
              'str-s06-audio',
                          'What Causes a Stroke?',
                          `${ASSET_BASE}/s06-causes-podcast.mp3`,
                          [
                            'What Causes a Stroke?',
                            '',
                            'A stroke happens when blood flow to the brain is interrupted, but several different conditions can lead to that moment.',
                            '',
                            'The biggest risk factor by far is high blood pressure. Years of high pressure damage and weaken blood vessels throughout the body, including in the brain, making both clots and ruptures more likely. Controlling blood pressure is the single most powerful way to prevent stroke — which is one reason accurate blood pressure care matters so much.',
                            '',
                            'Another major cause is atrial fibrillation, an irregular heart rhythm. When the heart beats irregularly, blood can pool and form clots. One of those clots can travel to the brain and block a vessel. Many residents with atrial fibrillation take blood thinners specifically to prevent this kind of stroke.',
                            '',
                            'Other important risk factors include diabetes, which damages blood vessels; high cholesterol, which narrows them; smoking; obesity; and a history of a previous stroke or a TIA, the mini-stroke that serves as a warning. Age itself is a strong factor — stroke risk roughly doubles each decade after age 55, which is why it is so common in long-term care.',
                            '',
                            'Hemorrhagic strokes — the bleeding kind — are often linked to very high blood pressure and to weak spots in blood vessels. Certain blood-thinning medications, while they prevent clot-type strokes, can slightly raise the risk of bleeding — which is one reason these residents are watched carefully.',
                            '',
                            'For the CNA, the practical message is this. Many of your residents carry several stroke risk factors at once — high blood pressure, atrial fibrillation, diabetes, a prior stroke. You are not expected to predict who will have a stroke. You are expected to support the care that lowers their risk — accurate blood pressure measurement, the prescribed diet, medication schedules the nurse manages — and to recognize a stroke instantly if one happens, in any resident, at any time.',
                          ].join('\n'),
                          `${ASSET_BASE}/s06-causes-podcast.mp3`,
                        ),
            {
                          id: 'str-s06-image',
                          type: 'image',
                          src: '/assets/courses/stroke/s06-hero.jpg',
                          caption: 'Understanding what raises stroke risk.',
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
                          id: 'str-s07-heading',
                          type: 'heading',
                          level: 1,
                          text: 'CNA Role & Best Practices',
                        },
            {
                          id: 'str-s07-scope-callout',
                          type: 'callout',
                          variant: 'clinical',
                          title: 'Scope of practice',
                          body: 'CNAs RECOGNIZE, SUPPORT, and OBSERVE. CNAs never give stroke medications or perform therapy.',
                        },
            {
                          id: 'str-s07-image',
                          type: 'image',
                          src: '/assets/courses/stroke/s07-hero.jpg',
                          caption: 'The CNA recognizes, notes the time, and calls for help — within scope.',
                        },
            {
                          id: 'str-s07-narration',
                          type: 'text',
                          body: [
                            'Stroke treatment is some of the most time-sensitive and specialized medicine there is — and all of it belongs to doctors, nurses, and therapists. Your role is recognition, support, and observation. Let\'s walk through what you\'ll encounter, and where your line is.',
                            '**Emergency clot-buster treatment.** For the most common type of stroke, hospitals can give a powerful clot-dissolving medication — but only within a few hours of the first symptom, and only after a brain scan. This is exactly why your fast recognition matters: the treatment that can reverse a stroke has a closing window, and your speed helps the resident reach it in time. You will never give this medication — but you may be the reason a resident gets it.',
                            '**Blood thinners.** Many stroke survivors, and residents with atrial fibrillation, take blood-thinning medications to prevent clots — names like warfarin, apixaban, or clopidogrel. Your scope: you do not give or adjust them. What you observe and report in red is important: unusual bruising, bleeding gums, blood in the urine or stool, a nosebleed that won\'t stop, or any fall or bump to the head. Residents on blood thinners bleed more easily, including inside the brain — so any head injury is reported right away.',
                            '**Blood pressure medications.** Controlling blood pressure prevents stroke and protects recovery. You support this through accurate measurement and faithful care of the plan — never by giving or holding the medication.',
                            '**Therapy.** After a stroke, physical therapists, occupational therapists, and speech therapists do the specialized retraining. Here is your role with therapy: you reinforce it. The therapist might ask you to encourage the resident to use their weaker hand at meals, or to practice certain safe movements during daily care. You follow that guidance — but you do not invent or perform therapy exercises on your own.',
                            'The scope point for this whole course: you don\'t treat a stroke. You recognize it fast, you support the recovery plan faithfully, and you watch for the bleeding signs in residents on blood thinners. That is powerful, essential work.',
                          ].join('\n\n'),
                        },
            {
                          id: 'str-s07-head-injury-callout',
                          type: 'callout',
                          variant: 'warning',
                          title: 'Blood thinners and head injury',
                          body: 'Resident on blood thinners + any fall or head bump = report immediately.',
                        },
          ]),
      },
      {
        slug: 's08-prevention',
        title: 'Prevention & Risk Reduction',
        sortOrder: 3,
        buildContent: () =>
          doc('Prevention & Risk Reduction', [
            { id: 'str-s08-heading', type: 'heading', level: 1, text: 'Prevention & Risk Reduction' },
            {
                          id: 'str-s08-image',
                          type: 'image',
                          src: '/assets/courses/stroke/s08-hero.jpg',
                          caption: 'Calm, fast recognition is the CNA standard.',
                        },
            {
                          id: 'str-s08-narration',
                          type: 'text',
                          body: [
                            'Stroke prevention and safe recovery happen in the daily work of a CNA. Here are seven ways you make a difference.',
                            '**One. Support blood pressure control.** High blood pressure is the number one cause of stroke. Accurate measurement, the low-salt diet, and faithful support of the care plan are stroke prevention in action.',
                            '**Two. Know your high-risk residents.** A resident with high blood pressure, atrial fibrillation, diabetes, or a prior stroke or TIA carries higher risk. Knowing who they are means you\'ll recognize trouble faster if it comes.',
                            '**Three. Report TIA signs immediately.** A mini-stroke — stroke symptoms that come and go — is a serious warning that a big stroke may follow. Never dismiss it as "it passed." Report every TIA sign right away.',
                            '**Four. Protect residents on blood thinners.** These medications prevent clot-strokes but raise bleeding risk. Prevent falls, pad sharp corners where needed, and report any bruising, bleeding, or head bump immediately.',
                            '**Five. Prevent the complications of recovery.** After a stroke, the dangers shift to immobility. Reposition to prevent pressure injuries. Feed safely to prevent aspiration. Encourage movement to prevent clots and stiffness. Each is preventing a new harm.',
                            '**Six. Feed safely to prevent aspiration pneumonia.** For residents with swallowing trouble, follow the care plan exactly — the right food texture, the right thickened liquids, upright positioning, slow pace, small bites. This prevents one of the most dangerous complications after a stroke.',
                            '**Seven. Report any new sudden change.** Recovery is not a straight line, but a sudden new weakness, new speech trouble, or new facial droop in a stroke survivor could mean a second stroke. Sudden change always gets reported and checked.',
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
                          id: 'str-s09-heading',
                          type: 'heading',
                          level: 1,
                          text: 'Scenario & Reporting',
                        },
            pendingAudio(
              'str-s09-intro-audio',
                          'Emergency response scenarios intro',
                          `${ASSET_BASE}/s09-emergency-intro.mp3`,
                          'In stroke, time is brain. The faster you recognize the signs and call for help, the more of the resident can be saved. You\'re about to work through two situations. Read each carefully, choose your action, and you\'ll get feedback right away. Keep FAST in your mind: Face, Arm, Speech, Time.',
                          `${ASSET_BASE}/s09-emergency-intro.mp3`,
                        ),
            {
                          id: 'str-s09-image',
                          type: 'image',
                          src: '/assets/courses/stroke/s09-hero.jpg',
                          caption: 'Reading the situation: act fast, and never dismiss a warning.',
                        },
            {
                          id: 'str-s09-scenario-acute-image',
                          type: 'image',
                          src: '/assets/courses/stroke/s09-scenario-acute.jpg',
                          caption:
                            'Sudden facial droop and slurred speech: note the time, activate emergency help, stay with her.',
                        },
            {
                          id: 'str-s09-scenario-acute',
                          type: 'scenario_question',
                          prompt:
                            'You bring Mrs. Calderon her morning coffee. When she looks up, you notice the right side of her mouth is drooping and her smile is uneven. When you ask if she\'s okay, her words come out slurred and jumbled. This wasn\'t happening twenty minutes ago when you saw her. What is the BEST action?',
                          options: [
                            {
                              id: 'give-water-watch',
                              label: 'Give her some water and watch her for an hour',
                              feedback:
                                'This is a possible stroke — sudden facial drooping and slurred speech are two FAST signs. Waiting, watching, or giving her water all cost the brain tissue that fast treatment could save, and giving fluids is dangerous if swallowing is affected. The right action: note the time, activate emergency help immediately, and stay with her.',
                            },
                            {
                              id: 'lie-down-rest',
                              label: 'Help her lie down to rest and check again later',
                              feedback:
                                'This is a possible stroke — sudden facial drooping and slurred speech are two FAST signs. Waiting, watching, or giving her water all cost the brain tissue that fast treatment could save, and giving fluids is dangerous if swallowing is affected. The right action: note the time, activate emergency help immediately, and stay with her.',
                            },
                            {
                              id: 'activate-now',
                              label: 'Note the time, activate emergency help immediately, and stay with her',
                              feedback:
                                'Exactly right. Face drooping plus slurred speech — that\'s two FAST signs, appearing suddenly. This is a possible stroke, which is an emergency every time. Note the time you first saw the symptoms — that clock determines what treatment is possible — then activate emergency help immediately and stay with her. Do not give her anything to eat or drink, since swallowing may be affected. Time is brain.',
                              isRecommended: true,
                            },
                            {
                              id: 'wait-doctor',
                              label: 'Wait until the doctor\'s scheduled visit this afternoon',
                              feedback:
                                'This is a possible stroke — sudden facial drooping and slurred speech are two FAST signs. Waiting, watching, or giving her water all cost the brain tissue that fast treatment could save, and giving fluids is dangerous if swallowing is affected. The right action: note the time, activate emergency help immediately, and stay with her.',
                            },
                          ],
                          requiredForCompletion: true,
                        },
            {
                          id: 'str-s09-scenario-tia-image',
                          type: 'image',
                          src: '/assets/courses/stroke/s09-scenario-tia.jpg',
                          caption:
                            'Symptoms that passed are still a warning: report a TIA to the nurse immediately.',
                        },
            {
                          id: 'str-s09-scenario-tia',
                          type: 'scenario_question',
                          prompt:
                            'Mr. Nguyen tells you that a few minutes ago, his left hand "went numb and weak" and his vision got blurry, but "it\'s fine now, it already passed." He seems back to normal and doesn\'t want to "make a fuss." What SHOULD the CNA do?',
                          options: [
                            {
                              id: 'say-nothing',
                              label: 'Agree it\'s fine since the symptoms passed and say nothing',
                              feedback:
                                'Symptoms that came and went — numbness, weakness, blurred vision — are signs of a TIA, a mini-stroke and a major warning that a full stroke may follow soon. It is never ignored because it "passed," and it can\'t wait for the next shift. The right action: report it to the nurse immediately.',
                            },
                            {
                              id: 'report-nurse',
                              label: 'Report it to the nurse immediately — even though it passed',
                              feedback:
                                'Right. Symptoms that appeared and then passed — numbness, weakness, vision changes — are classic signs of a TIA, a mini-stroke. A TIA is a serious warning that a major stroke may be coming soon, sometimes within hours or days. It is never "fine" just because it passed, and it can\'t wait for the next shift. Report it to the nurse immediately so the resident can be evaluated. Reassure Mr. Nguyen kindly — this is exactly the kind of thing he should tell you.',
                              isRecommended: true,
                            },
                            {
                              id: 'wait-again',
                              label: 'Tell him to let you know only if it happens again',
                              feedback:
                                'Symptoms that came and went — numbness, weakness, blurred vision — are signs of a TIA, a mini-stroke and a major warning that a full stroke may follow soon. It is never ignored because it "passed," and it can\'t wait for the next shift. The right action: report it to the nurse immediately.',
                            },
                            {
                              id: 'next-shift',
                              label: 'Write it in the notes for the next shift to review',
                              feedback:
                                'Symptoms that came and went — numbness, weakness, blurred vision — are signs of a TIA, a mini-stroke and a major warning that a full stroke may follow soon. It is never ignored because it "passed," and it can\'t wait for the next shift. The right action: report it to the nurse immediately.',
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
            { id: 'str-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
                          id: 'str-s10-video',
                          type: 'video',
                          title: "CNA's Role in Care",
                          videoUrl: `${ASSET_BASE}/s10-cna-role.mp4`,
                          placeholderNote: `Pending upload: ${ASSET_BASE}/s10-cna-role.mp4`,
                        },
            {
                          id: 'str-s10-image',
                          type: 'image',
                          src: '/assets/courses/stroke/s10-hero.jpg',
                          caption: 'Supporting recovery and reporting changes after a stroke.',
                        },
            {
                          id: 'str-s10-narration',
                          type: 'text',
                          body: [
                            'Caring for a stroke survivor day to day is skilled, meaningful work. Let\'s walk through your role.',
                            '**Support the weaker side.** In all movement and transfers, support the weaker side. There\'s a simple rule that helps: when dressing, dress the weak arm first; when undressing, remove the strong arm first. When walking or transferring, stand on the weaker side to support and protect it. Follow the care plan and the therapist\'s guidance for each resident — they\'re all a little different.',
                            '**Communicate with patience.** With a resident who has aphasia, remember: their mind is sharp; the words are just hard to reach. Speak slowly and simply. Give them time — don\'t rush or finish their sentences unless they ask. Use yes-or-no questions, gestures, pictures, or a communication board if one is in the plan. Never talk about them as if they aren\'t there. Their dignity depends on your patience.',
                            '**Feed safely.** For residents with dysphagia, safe feeding prevents a deadly complication: aspiration pneumonia. Follow the plan exactly — the prescribed food texture and thickened liquids, the resident sitting fully upright, small bites, a slow pace, and checking that each bite is swallowed before the next. Keep them upright for a while after eating. If they cough, choke, or sound wet or gurgly when they speak, stop and report it.',
                            '**Protect the body.** Immobility after a stroke creates new dangers. Reposition regularly to prevent pressure injuries, especially on the weaker side where the resident may not feel discomfort. Protect that weaker arm or leg from injury, since sensation may be reduced. Keep skin clean and dry. Encourage the safe movement the therapists have approved.',
                            'Now the boundary. You do not diagnose stroke, you do not give medications, and you do not perform therapy exercises on your own — you reinforce what the therapists assign. You do not change a resident\'s diet texture or thickened-liquid level — that\'s set by the speech therapist and the care plan. And you watch closely for any sudden new change, because a stroke survivor can have another stroke.',
                            'Inside your role — safe transfers, patient communication, safe feeding, skin and body protection, and faithful support of the recovery plan — you are the daily heart of this resident\'s recovery. Few jobs matter more.',
                          ].join('\n\n'),
                        },
            {
                          id: 'str-s10-scope-callout',
                          type: 'callout',
                          variant: 'clinical',
                          title: 'Stay within scope',
                          body: 'You do not diagnose stroke, give medications, or perform therapy exercises on your own. You do not change diet texture or thickened-liquid level — that is set by the speech therapist and the care plan.',
                        },
          ]),
      },
      {
        slug: 's11-case-study',
        title: 'Case Study',
        sortOrder: 2,
        buildContent: () => {
          const caseNarrative = [
            'CNA Aimee was doing her morning rounds, bringing coffee to residents who were allowed it. Mrs. Okonkwo was usually bright and chatty in the mornings.',
            '',
            '**The moment (the recognition):** When Aimee set the coffee down, Mrs. Okonkwo reached for it — but her right hand fumbled and couldn\'t grip the cup. Aimee looked up at her face. The right corner of her mouth was drooping. "Good morning, Mrs. Okonkwo," Aimee said. Mrs. Okonkwo tried to answer, but the words came out slurred and tangled. Twenty minutes earlier, during the weigh, she had been completely normal.',
            '',
            '**What Aimee did NOT do:** Aimee did not pour the coffee or help her drink it — she knew swallowing might be affected. She did not wait to "see if it passes." She did not go searching down the hall for the nurse, leaving Mrs. Okonkwo alone.',
            '',
            '**What Aimee DID:** Aimee ran FAST in her head in seconds — Face drooping, Arm weak, Speech slurred — three signs. She glanced at the clock: 7:52 a.m. She pressed the emergency call button on the wall and called out clearly: "I need the nurse in room 12 now — possible stroke." She stayed with Mrs. Okonkwo, kept her calm, and kept nothing in her mouth. When the nurse arrived, Aimee reported exactly: "Sudden facial droop, right-arm weakness, slurred speech — all started within the last twenty minutes. Last known normal was 7:30 at the weigh. I first saw it at 7:52."',
            '',
            '**The outcome:** Because Aimee recognized the stroke immediately and pinned down the timing, Mrs. Okonkwo reached the hospital well within the treatment window. She received clot-dissolving treatment and recovered much of her function over the following weeks. The nurse later told Aimee that her note about "last known normal at 7:30" was the detail the hospital needed most.',
            '',
            '**Discussion:** Aimee\'s whole response took less than a minute, but every piece mattered. She recognized FAST signs instantly. She protected Mrs. Okonkwo by giving her nothing to eat or drink. She summoned help instead of leaving. And she captured the timing — the single most important fact for stroke treatment. None of it required a diagnosis or a medication. It required a trained CNA who knew FAST and acted.',
          ];

          return doc('Case Study', [
            { id: 'str-s11-heading', type: 'heading', level: 1, text: 'Brief Case Study' },
            pendingAudio(
              'str-s11-audio',
                          'The Coffee Aimee Almost Poured',
                          `${ASSET_BASE}/s11-case-podcast.mp3`,
                          caseNarrative,
                          `${ASSET_BASE}/s11-case-podcast.mp3`,
                        ),
            {
                          id: 'str-s11-image',
                          type: 'image',
                          src: '/assets/courses/stroke/s11-hero.jpg',
                          caption: 'A stroke recognized in time — fast action, right call.',
                        },
            {
                          id: 'str-s11-case-study',
                          type: 'case_study',
                          title: 'The Coffee Aimee Almost Poured',
                          residentProfile:
                            'CNA Aimee was doing her morning rounds, bringing coffee to residents who were allowed it. Mrs. Okonkwo was usually bright and chatty in the mornings.',
                          scenario: [
                            '**The moment (the recognition):** When Aimee set the coffee down, Mrs. Okonkwo reached for it — but her right hand fumbled and couldn\'t grip the cup. Aimee looked up at her face. The right corner of her mouth was drooping. "Good morning, Mrs. Okonkwo," Aimee said. Mrs. Okonkwo tried to answer, but the words came out slurred and tangled. Twenty minutes earlier, during the weigh, she had been completely normal.',
                            '**What Aimee did NOT do:** Aimee did not pour the coffee or help her drink it — she knew swallowing might be affected. She did not wait to "see if it passes." She did not go searching down the hall for the nurse, leaving Mrs. Okonkwo alone.',
                            '**What Aimee DID:** Aimee ran FAST in her head in seconds — Face drooping, Arm weak, Speech slurred — three signs. She glanced at the clock: 7:52 a.m. She pressed the emergency call button on the wall and called out clearly: "I need the nurse in room 12 now — possible stroke." She stayed with Mrs. Okonkwo, kept her calm, and kept nothing in her mouth. When the nurse arrived, Aimee reported exactly: "Sudden facial droop, right-arm weakness, slurred speech — all started within the last twenty minutes. Last known normal was 7:30 at the weigh. I first saw it at 7:52."',
                            '**The outcome:** Because Aimee recognized the stroke immediately and pinned down the timing, Mrs. Okonkwo reached the hospital well within the treatment window. She received clot-dissolving treatment and recovered much of her function over the following weeks. The nurse later told Aimee that her note about "last known normal at 7:30" was the detail the hospital needed most.',
                            '**Discussion:** Aimee\'s whole response took less than a minute, but every piece mattered. She recognized FAST signs instantly. She protected Mrs. Okonkwo by giving her nothing to eat or drink. She summoned help instead of leaving. And she captured the timing — the single most important fact for stroke treatment. None of it required a diagnosis or a medication. It required a trained CNA who knew FAST and acted.',
                          ].join('\n\n'),
                        },
            {
                          id: 'str-s11-reflection-1',
                          type: 'reflection',
                          prompt:
                            'Aimee noted both when she first saw the symptoms (7:52) and when Mrs. Okonkwo was "last known normal" (7:30). Why is this timing information so critical in stroke care?',
                          minCharacters: 50,
                        },
            {
                          id: 'str-s11-reflection-2',
                          type: 'reflection',
                          prompt:
                            'Aimee chose not to help Mrs. Okonkwo drink her coffee. Why was withholding food and drink the safe and correct choice during a suspected stroke?',
                          minCharacters: 50,
                        },
            {
                          id: 'str-s11-reflection-intro-text',
                          type: 'text',
                          body: 'Reflect on the case study in the previous lesson. Your written responses help you apply what you learned about FAST recognition, timing, and withholding food and drink during a suspected stroke.',
                        },
            {
                          id: 'str-s11-kc2-check',
                          type: 'knowledge_check',
                          question:
                            'CNAs RECOGNIZE, SUPPORT, and OBSERVE. CNAs never give stroke medications or perform therapy. Which action is WITHIN the CNA\'s scope?',
                          options: [
                            {
                              id: 'give-clot-buster',
                              label: 'Give clot-dissolving medication within the treatment window',
                            },
                            {
                              id: 'recognize-support',
                              label: 'Recognize FAST signs, support the recovery plan, and report bleeding signs',
                            },
                            {
                              id: 'perform-therapy',
                              label: 'Perform speech therapy exercises on their own',
                            },
                            {
                              id: 'adjust-blood-thinners',
                              label: 'Adjust or skip blood-thinning medication doses',
                            },
                          ],
                          correctOptionId: 'recognize-support',
                          explanation:
                            'CNAs RECOGNIZE, SUPPORT, and OBSERVE. CNAs never give stroke medications or perform therapy. You recognize it fast, you support the recovery plan faithfully, and you watch for the bleeding signs in residents on blood thinners.',
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
            { id: 'str-s12-heading', type: 'heading', level: 1, text: 'Conclusion' },
            {
                          id: 'str-s12-video',
                          type: 'video',
                          title: 'Conclusion',
                          videoUrl: `${ASSET_BASE}/s12-conclusion.mp4`,
                          placeholderNote: `Pending upload: ${ASSET_BASE}/s12-conclusion.mp4`,
                        },
            {
                          id: 'str-s12-image',
                          type: 'image',
                          src: '/assets/courses/stroke/s12-hero.jpg',
                          caption:
                            'Recognize FAST, note the time, call immediately — the CNA\'s role.',
                        },
            {
                          id: 'str-s12-narration',
                          type: 'text',
                          body: [
                            'You\'ve reached the end of a course that could genuinely save a life. Let\'s lock in the five things that matter most.',
                            '**One.** Stroke is a brain attack, and time is brain. Every minute a stroke goes unrecognized, the brain loses nearly two million cells. Fast recognition and a fast call for help save brain tissue — and save the person.',
                            '**Two.** Know FAST cold. Face drooping. Arm weakness. Speech difficulty. Time to call. Any one of these, appearing suddenly, means a possible stroke — an emergency, every time. Note when the symptoms started, and activate help immediately.',
                            '**Three.** Never dismiss a TIA. Stroke symptoms that come and go — a mini-stroke — are a serious warning that a major stroke may follow. Report them immediately, even when they\'ve passed.',
                            '**Four.** Recovery care is daily, skilled, and dignified. Support the weaker side, dress the weak arm first. Communicate with patience for aphasia — the mind is sharp, the words are hard. Feed safely to prevent aspiration. Protect the skin and body from the dangers of immobility.',
                            '**Five.** Honor your scope. You recognize and you support. You do not diagnose, you do not give any medications, and you do not perform therapy on your own. And for residents on blood thinners — any fall or head bump gets reported immediately.',
                          ].join('\n\n'),
                        },
            {
                          id: 'str-s12-summary',
                          type: 'summary',
                          title: 'Five things that matter most',
                          items: [
                            'Stroke is a brain attack — time is brain; fast recognition saves brain tissue.',
                            'Know FAST cold — Face, Arm, Speech, Time; any sudden sign means activate help now.',
                            'Never dismiss a TIA — report stroke symptoms that come and go immediately.',
                            'Recovery care is daily and dignified — support the weaker side, communicate with patience, feed safely.',
                            'Honor your scope — recognize and support; never diagnose, medicate, or perform therapy on your own.',
                          ],
                        },
            {
                          id: 'str-s12-what-happens-next-text',
                          type: 'text',
                          body: 'Ten questions are waiting. Everything on them was covered here. You\'re ready. Trust what you\'ve learned, and show what you know.',
                        },
            {
                          id: 'str-s12-completion-requirements-text',
                          type: 'text',
                          body: 'This course provides one hour of continuing education credit through CAL ACE Nursing Academy, an approved CDPH continuing education provider, NAC number 7384. Your certificate is generated automatically when you pass the knowledge check.',
                        },
            {
                          id: 'str-s12-completion-requirements-callout',
                          type: 'callout',
                          variant: 'info',
                          title: 'Scope reminder',
                          body: 'CNAs recognize stroke signs and activate help. CNAs provide daily recovery care. CNAs do not diagnose stroke, give medications, or perform therapy on their own.',
                        },
            {
                          id: 'str-s12-certificate-access-text',
                          type: 'text',
                          body: 'Your certificate is generated automatically when you pass the knowledge check. CDPH-Approved CE Provider — NAC #7384.',
                        },
          ]),
      },
    ],
  },
];

export async function seedCourse15Stroke(
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
  console.log(`Seeding Course 15 (Stroke) as DRAFT — slug "${COURSE_SLUG}"…`);

  try {
    const result = await seedCourse15Stroke(prisma);
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
