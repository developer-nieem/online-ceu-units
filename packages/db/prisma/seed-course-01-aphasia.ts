/**
 * Seed Course 1 — Aphasia & Communication Disorders (DRAFT).
 *
 * V3 rebuild of the former "Communication Skills in Long-Term Care", reframed to
 * the clinical conditions (aphasia, dysarthria, communication loss) the skills serve.
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-01-aphasia
 *
 * Idempotent upserts by slug. Does not seed the final quiz (pending owner approval;
 * see seed-course-01-aphasia-exam.ts).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ TWO VALUES MUST BE CONFIRMED AGAINST THE REPO BEFORE THIS IS RUN:
 *
 *   1. COURSE_SLUG — this course is ALREADY SEEDED AND LIVE under its original
 *      slug. The slug is FROZEN. Changing it would orphan existing enrollments /
 *      certificates. The package header says the former title was "Communication
 *      Skills in Long-Term Care"; the likely existing slug is 'communication-skills'.
 *      CONFIRM the actual live slug from the DB/repo before running. Only the
 *      DISPLAY TITLE changes (to the aphasia framing) — NOT the slug.
 *
 *   2. VERSION_NUMBER — the package says publish as a NEW VERSION; do NOT overwrite
 *      content that any certificate/enrollment points to. If the live course is
 *      currently version 1, this seed should create version 2 (set below). CONFIRM
 *      the current max versionNumber for this course before running, and set this
 *      to (max + 1).
 *
 * Until both are confirmed, DO NOT RUN. (Also gated on Neon migration-drift heal.)
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

// ⚠️ CONFIRM AGAINST REPO BEFORE RUNNING — see header note #1. FROZEN slug.
const COURSE_SLUG = 'communication-skills';

// Display title changes to the aphasia framing; slug stays frozen above.
const COURSE_TITLE = 'Supporting Residents with Speech and Language Changes';
const COURSE_SUMMARY =
  'Care for residents with aphasia and dysarthria: understand aphasia as a loss of language (not intelligence), communicate patiently with simple language and tools, read and report unspoken needs, recognize a sudden speech change as a possible stroke, and protect dignity and connection.';

// ⚠️ CONFIRMED against live DB — slug confirmed; version 4 supersedes the v4 DRAFT stub.
const VERSION_NUMBER = 4;

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
    'Understand aphasia and dysarthria, and that they do not mean lost intelligence',
    'Communicate effectively with residents who have aphasia or dysarthria',
    'Tell aphasia and dysarthria apart from hearing loss and confusion',
    'Respond calmly to communication frustration, and read and report unspoken needs',
    'Recognize a sudden new speech change as a possible stroke and report it immediately',
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
  heroImage: '/assets/courses/aphasia/hero-banner.jpg',
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
    title: 'Understanding Aphasia & Communication Disorders',
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: 'Introduction',
        sortOrder: 0,
        buildContent: () =>
          doc('Introduction', [
            { id: 'aph-s01-heading', type: 'heading', level: 1, text: 'Introduction' },
            {
              id: 'aph-s01-video',
              type: 'video',
              title: 'Introduction',
              videoUrl: '/assets/courses/aphasia/s01-intro.mp4',
              placeholderNote: 'Pending upload: /assets/courses/aphasia/s01-intro.mp4',
            },
            {
              id: 'aph-s01-image',
              type: 'image',
              src: '/assets/courses/aphasia/s01-hero.jpg',
              caption: 'A CAL ACE CNA connecting with a resident through patient communication.',
            },
            {
              id: 'aph-s01-narration',
              type: 'text',
              body: [
                'Welcome to CAL ACE Nursing Academy.',
                'This course is about aphasia and communication disorders — and at its heart is one of the most important truths in all of caregiving: when a resident cannot speak or understand the way they used to, their mind is very often still whole. The person is still in there. How you communicate decides whether they stay connected to the world, or get locked out of it.',
                'Let\'s define what we\'re dealing with. Aphasia — uh-FAY-zhuh — is the loss of the ability to use language, usually caused by damage to the brain\'s language areas, most often from a stroke, but also from brain injury, tumors, or some dementias. It can affect speaking, understanding, reading, and writing — in any combination. And here is the single most important fact about it: aphasia is a loss of language, not a loss of intelligence. A person with aphasia is usually just as smart, aware, and feeling as they always were — they simply can\'t get the words out, or can\'t make sense of yours. Imagine knowing exactly what you want to say and being unable to find the word. That is aphasia, and it is profoundly frustrating.',
                'We\'ll also cover a related but different problem: dysarthria — dis-AR-three-uh — where the muscles for speech are weak or poorly controlled, so speech is slurred, slow, or hard to understand, even though the person\'s language and thinking are completely intact. Aphasia is a language problem; dysarthria is a muscle problem. Both leave a fully present person struggling to be understood.',
                'Here\'s why this matters so deeply in your care. Communication is how a person asks for help, expresses pain, makes choices, connects with others, and keeps their dignity. When it breaks, everything is at risk: a resident in pain who can\'t tell you, a resident treated as confused or childish when they\'re neither, a resident who withdraws into terrible isolation and depression because connecting has become so hard. And the gravest, most common mistake — treating a person with aphasia as if they were unintelligent, deaf, or not there — wounds them again and again. They understand far more than they can show.',
                'This course teaches the practical skills that change everything: how to communicate with a person who has aphasia or dysarthria — patience, simple language, giving time, using yes-or-no questions, gestures, writing, and pictures. How to tell aphasia apart from hearing loss and confusion, so you don\'t misjudge. How to respond when frustration boils over. And how to protect the dignity and connection that communication loss threatens.',
                'The guiding spirit of this course: presume competence. Assume the person understands, has thoughts and feelings, and deserves to be spoken to as the intelligent adult they are — and then patiently find the path to reach them.',
                'Your scope is clear. A CNA communicates patiently and skillfully, uses communication tools, supports dignity and connection, watches for pain and needs the resident can\'t easily express, and reports changes. A CNA does not diagnose, does not provide speech therapy, and does not formally test a resident\'s language or thinking.',
                'By the end of this course, you will be able to: understand aphasia and dysarthria, and that they don\'t mean lost intelligence. Communicate effectively with residents who have them. Tell them apart from hearing loss and confusion. Respond to frustration. And protect dignity and connection. Let\'s begin.',
              ].join('\n\n'),
            },
            {
              id: 'aph-s01-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'CNA scope',
              body: 'A CNA does not diagnose, does not provide speech therapy, and does not formally test a resident\'s language or thinking. Your job is to communicate patiently, use the tools, read and report unspoken needs, and protect dignity and connection.',
            },
          ]),
      },
      {
        slug: 's02-terms',
        title: 'Terms & Definitions',
        sortOrder: 1,
        buildContent: () =>
          doc('Terms & Definitions', [
            { id: 'aph-s02-heading', type: 'heading', level: 1, text: 'Terms & Definitions' },
            {
              id: 'aph-s02-image',
              type: 'image',
              src: '/assets/courses/aphasia/s02-hero.jpg',
              caption: 'Understanding aphasia and dysarthria starts with the right terms.',
            },
            {
              id: 'aph-s02-reveal-aphasia',
              type: 'reveal_card',
              frontTitle: 'Aphasia',
              frontBody: 'Uh-FAY-zhuh',
              backTitle: 'Aphasia',
              backBody:
                'The loss of the ability to use language — speaking, understanding, reading, or writing — caused by damage to the brain\'s language areas, most often from a stroke. The crucial point: aphasia is a loss of language, not a loss of intelligence. The person is usually just as aware and capable in their mind as before; they simply can\'t access the words.',
            },
            {
              id: 'aph-s02-reveal-expressive',
              type: 'reveal_card',
              frontTitle: 'Expressive Aphasia',
              frontBody: 'Expressive aphasia',
              backTitle: 'Expressive Aphasia',
              backBody:
                'Trouble getting language out. The person knows exactly what they want to say but can\'t find or form the words — speech may be slow, effortful, or limited to a few words. Understanding is often much better than speaking. Picture someone with the word on the tip of their tongue, every single time. Patience and time are everything.',
            },
            {
              id: 'aph-s02-reveal-receptive',
              type: 'reveal_card',
              frontTitle: 'Receptive Aphasia',
              frontBody: 'Receptive aphasia',
              backTitle: 'Receptive Aphasia',
              backBody:
                'Trouble taking language in. The person has difficulty understanding what\'s said, and their own speech may flow easily but not make sense — wrong or made-up words strung together. They may not realize their words are jumbled. Here you rely heavily on gestures, demonstration, and simple visuals, not just words.',
            },
            {
              id: 'aph-s02-reveal-global',
              type: 'reveal_card',
              frontTitle: 'Global Aphasia',
              frontBody: 'Global aphasia',
              backTitle: 'Global Aphasia',
              backBody:
                'Severe aphasia affecting both expressing and understanding language — the person struggles to speak and to comprehend. Communication leans on the simplest tools: gestures, facial expressions, tone, pointing, and reading the person\'s body language. Even here, connection and dignity are possible, and the person still feels and perceives.',
            },
            {
              id: 'aph-s02-reveal-dysarthria',
              type: 'reveal_card',
              frontTitle: 'Dysarthria',
              frontBody: 'Dis-AR-three-uh',
              backTitle: 'Dysarthria',
              backBody:
                'Slurred, slow, weak, or hard-to-understand speech caused by weakness or poor control of the speech muscles — not a language problem. The person\'s thinking and language are intact; the muscles just won\'t cooperate, often after stroke or with conditions like Parkinson\'s. Give them time, listen closely, and don\'t assume the slurring means confusion or intoxication.',
            },
            {
              id: 'aph-s02-reveal-aac',
              type: 'reveal_card',
              frontTitle: 'Augmentative & Alternative Communication (AAC)',
              frontBody: 'AAC',
              backTitle: 'Augmentative & Alternative Communication (AAC)',
              backBody:
                'Any method beyond speech that helps a person communicate — picture boards, letter boards, writing, gestures, communication devices, or apps. For a resident who can\'t rely on speech, AAC tools are a lifeline to expressing needs and staying connected. Knowing and using a resident\'s tools is part of good care.',
            },
            {
              id: 'aph-s02-reveal-presume',
              type: 'reveal_card',
              frontTitle: 'Presume Competence',
              frontBody: 'Presume competence',
              backTitle: 'Presume Competence',
              backBody:
                'The core mindset of this course: assume the person understands, has thoughts and feelings, and is an intelligent adult — even when they can\'t show it well. Speak to them normally and respectfully, never as if they were a child, deaf, or absent. Presuming competence protects dignity and is usually simply accurate — they understand more than they can express.',
            },
            {
              id: 'aph-s02-reveal-catastrophic',
              type: 'reveal_card',
              frontTitle: 'Catastrophic Reaction / Frustration',
              frontBody: 'Catastrophic reaction',
              backTitle: 'Catastrophic Reaction / Frustration',
              backBody:
                'The overwhelming distress, anger, or tears that can erupt when a resident can\'t communicate or understand — a natural response to being trapped behind broken language. It\'s not bad behavior; it\'s the pain of not being understood. The response is calm, patience, reducing pressure, and trying a different way — never irritation or rushing.',
            },
            {
              id: 'aph-s02-knowledge-check',
              type: 'knowledge_check',
              question: 'Which term means slurred or weak speech from a muscle problem, with language and thinking intact?',
              options: [
                { id: 'dysarthria', label: 'Dysarthria' },
                { id: 'expressive', label: 'Expressive aphasia' },
                { id: 'receptive', label: 'Receptive aphasia' },
              ],
              correctOptionId: 'dysarthria',
              explanation:
                'Dysarthria. Dis-AR-three-uh. Slurred, slow, or weak speech caused by weak or poorly controlled speech muscles — the language and the mind are intact. Expressive and receptive aphasia are language problems, not muscle problems.',
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
            { id: 'aph-s03-heading', type: 'heading', level: 1, text: 'Statistics' },
            {
              id: 'aph-s03-image',
              type: 'image',
              src: '/assets/courses/aphasia/s03-hero.jpg',
              caption: 'Aphasia is common — the mind stays whole when words are lost.',
            },
            pendingAudio(
              'aph-s03-audio',
              'Aphasia: When the Mind Is Whole but the Words Are Locked Away',
              '/assets/courses/aphasia/s03-stats-podcast.mp3',
              [
                'Aphasia: When the Mind Is Whole but the Words Are Locked Away',
                '',
                'Aphasia is far more common than most people realize. It affects a large number of people, and the leading cause is stroke — a significant share of stroke survivors live with some degree of aphasia, which makes it a frequent companion of the elderly residents in long-term care, where stroke survivors are common. Aphasia also arises from traumatic brain injury, brain tumors, and certain dementias. So across a care facility, many residents have some difficulty with language — and how they\'re treated depends enormously on whether caregivers understand what aphasia really is.',
                '',
                'And here is the fact that everything turns on: aphasia is a disorder of language, not of intelligence. The damage is to the brain\'s language machinery — the systems that turn thoughts into words and words into meaning — not to the person\'s intellect, awareness, memory of who they are, or feelings. A person with aphasia typically knows what they want to say, recognizes their loved ones, understands their situation, and feels the full range of human emotion. They are, in the ways that matter most, entirely themselves. What\'s broken is the bridge between the intact mind and the outside world.',
                '',
                'This is why the most common and damaging mistake is so harmful: treating people with aphasia as if they were unintelligent, confused, deaf, childish, or simply "not there." It happens constantly and often unconsciously — speaking about them as if they\'re absent, using baby talk, shouting as though they can\'t hear, making decisions for them without asking, or simply giving up on communicating at all. Each of these wounds a fully aware person who understands what\'s happening but can\'t easily protest. Research and the testimony of aphasia survivors are united on this: being treated as stupid is one of the deepest injuries of aphasia, and being treated as competent is one of the greatest gifts.',
                '',
                'The consequences of unsupported communication loss are serious. Practically, residents who can\'t communicate well can\'t reliably report pain, hunger, discomfort, or needs — so problems get missed. Emotionally, the toll is heavy: aphasia is strongly linked to isolation, loneliness, and depression, because connection itself — conversation, jokes, shared stories, simply being understood — becomes exhausting and often fails. A person can be surrounded by people and yet profoundly alone behind a wall of broken language. And that isolation can look like withdrawal or decline, feeding the false impression that the person is "gone," when they are in fact trapped and reachable.',
                '',
                'The hopeful truth, and the reason this course exists, is that skilled, patient communication changes everything — and it\'s overwhelmingly the work of the people who spend the most time with residents, the CNAs. Giving time, simplifying language, using yes-or-no questions, gestures, writing, drawing, and pictures, presuming competence, and never rushing or talking down — these turn a locked-out resident into a connected one who can express needs, make choices, and stay part of the world. The bottom line: aphasia is common, it locks an intact mind away from language, it\'s constantly mistaken for lost intelligence, and the CNA\'s patient communication is the key that unlocks the person inside.',
              ].join('\n'),
              '/assets/courses/aphasia/s03-stats-podcast.mp3',
            ),
            {
              id: 'aph-s03-source-note',
              type: 'callout',
              variant: 'clinical',
              title: 'About these figures',
              body: 'This section describes aphasia qualitatively (e.g., "common," "a significant share of stroke survivors") rather than citing specific numbers. Any precise statistic added later must come from a named, verifiable source (e.g., stroke and aphasia research organizations) — not from estimation.',
            },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: 'Fundamentals',
        sortOrder: 3,
        buildContent: () =>
          doc('Fundamentals', [
            { id: 'aph-s04-heading', type: 'heading', level: 1, text: 'Fundamentals' },
            {
              id: 'aph-s04-video',
              type: 'video',
              title: 'Fundamentals',
              videoUrl: '/assets/courses/aphasia/s04-fundamentals.mp4',
              placeholderNote: 'Pending upload: /assets/courses/aphasia/s04-fundamentals.mp4',
            },
            {
              id: 'aph-s04-image',
              type: 'image',
              src: '/assets/courses/aphasia/s04-hero.jpg',
              caption: 'Presume competence: the person is still in there.',
            },
            {
              id: 'aph-s04-narration',
              type: 'text',
              body: [
                '**Aphasia: language broken, mind intact**',
                'The foundation of everything: aphasia damages the brain\'s language system, not the person\'s intelligence. They usually still think clearly, know who they and their loved ones are, understand their situation, and feel everything they always did. What\'s lost is access to language — turning thoughts into words, or words into meaning. So a person with aphasia is a whole, aware adult behind a broken bridge to communication. Hold that picture, because it shapes every interaction: you\'re reaching a competent person, not a diminished one.',
                '**Expressing versus understanding**',
                'Aphasia comes in patterns worth knowing simply. Some residents mainly struggle to express — they understand you well but can\'t find or form the words to answer; speaking is slow and effortful. Others mainly struggle to understand — words come out fluently but jumbled, and they have trouble grasping what\'s said. Many have a mix. Why it matters: if a resident understands but can\'t speak, give them time and yes-or-no options; if they struggle to understand, lean on gestures, demonstration, and pictures. Knowing each resident\'s pattern tells you how to reach them.',
                '**Dysarthria: the muscles, not the language**',
                'Dysarthria is different and important to recognize. Here, language and thinking are completely intact — the problem is that the muscles for speech are weak or poorly controlled, so speech sounds slurred, slow, quiet, or thick. It\'s common after stroke and in conditions like Parkinson\'s. The danger is misjudgment: slurred speech can be mistaken for drunkenness, confusion, or low intelligence, when the person is sharp and simply can\'t articulate clearly. Give them time, listen carefully, ask them to repeat or use other means — and never assume the slur means anything about their mind.',
                '**The great mistake: treating them as less**',
                'This is the error to never make. Because communication is broken, people unconsciously treat those with aphasia or dysarthria as unintelligent, deaf, childish, or absent — talking about them in front of them, using baby talk, shouting, deciding for them, or not bothering to communicate. Every one of these wounds a fully aware person who understands and feels the disrespect but can\'t easily fight back. Picture being completely sharp inside while everyone treats you as if you\'re not there. That\'s the daily injury — and you prevent it simply by presuming competence and treating them as the adult they are.',
                '**How communication loss endangers and isolates**',
                'Two big harms follow broken communication. Safety: a resident who can\'t tell you they\'re in pain, nauseated, frightened, or in need may suffer silently while the problem goes unseen — so you must watch their face, body, and behavior for what words can\'t carry. Isolation: when connecting becomes exhausting and often fails, residents withdraw, and loneliness and depression set in — a person can be surrounded by others yet utterly alone behind the language wall. Understanding both harms tells you your job: be the watchful eyes for unspoken needs, and the patient bridge back to connection.',
                '**The core communication toolkit**',
                'Here are the skills that work, and they\'re learnable. Get the person\'s attention and face them at eye level. Speak slowly and clearly in short, simple sentences — one idea at a time — but in a normal, adult, respectful voice, never baby talk. Give them time — long, patient pauses — and don\'t finish their sentences or rush them. Ask yes-or-no questions when expressing is hard. Use gestures, pointing, demonstration, facial expression, writing, drawing, and pictures freely. Reduce noise and distraction. Confirm you understood — "Did you mean...?" And watch their face and body for meaning. Patience is the master skill.',
                '**Presume competence: the guiding mindset**',
                'Everything rests on one mindset: presume competence. Assume the resident understands, has a full inner life, and is an intelligent adult who deserves respect — and then patiently find the way to reach them. Speak to them, not about them. Include them in their own care and choices. Celebrate what they can do, never highlight what they can\'t. Offer dignity in every exchange. Presuming competence is almost always accurate — they understand far more than they can show — and even when communication is severely limited, treating the person as fully present and worthy is the truest care you can give.',
              ].join('\n\n'),
            },
            {
              id: 'aph-s04-presume-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Presume competence',
              body: 'Speak TO them, not ABOUT them. Never baby-talk, shout, decide for them, or give up. They understand far more than they can show — they\'re still in there.',
            },
          ]),
      },
    ],
  },
  {
    slug: 'module-2',
    title: 'What the CNA Sees and Does',
    sortOrder: 1,
    lessons: [
      {
        slug: 's05-signs',
        title: 'Signs & Symptoms',
        sortOrder: 0,
        buildContent: () =>
          doc('Signs & Symptoms', [
            { id: 'aph-s05-heading', type: 'heading', level: 1, text: 'Signs & Symptoms' },
            {
              id: 'aph-s05-image',
              type: 'image',
              src: '/assets/courses/aphasia/s05-hero.jpg',
              caption: 'Watch for the mismatch — an intact mind behind broken words.',
            },
            {
              id: 'aph-s05-narration',
              type: 'text',
              body: [
                'You\'ll often be the one who recognizes a communication disorder, reads the needs a resident can\'t say, and notices changes. Let\'s learn the signs.',
                '**Recognizing aphasia**',
                'Watch for the signs of aphasia. Difficulty finding words, long pauses, or getting stuck mid-sentence. Speaking in very few words, or with great effort. Or the opposite — fluent speech that doesn\'t make sense, with wrong or invented words. Trouble understanding instructions or questions. Difficulty reading or writing. Saying yes when they mean no, or the reverse. Frustration when trying to communicate. Crucially, watch for the mismatch that reveals an intact mind: a person who clearly understands a situation, follows along with their eyes and expressions, and reacts appropriately — but can\'t get the words out. That mismatch is the signature of aphasia, and it tells you the person is in there.',
                '**Dysarthria, and telling it apart**',
                'Recognize dysarthria: slurred, slow, quiet, thick, or effortful speech — but with language and understanding intact. The resident finds the right words and understands you perfectly; the words just come out poorly formed because the muscles are weak. Tell it apart from aphasia: aphasia is about finding and understanding words; dysarthria is about physically producing them. And tell both apart from hearing loss — which you learned about separately. A simple check: does the resident understand you better when you face them and speak clearly, suggesting hearing? Do they understand but can\'t speak, suggesting expressive aphasia or dysarthria? Do they struggle to understand, suggesting receptive aphasia? You don\'t diagnose — but noticing the pattern guides how you communicate and what you report.',
                '**Reading the unspoken needs**',
                'This is vital: a resident who can\'t communicate well may be unable to tell you about pain, illness, or distress — so you become their voice by watching closely. Watch the face — grimacing, frowning, tension, tears. Watch the body — guarding a body part, restlessness, pulling away, rigidity. Watch behavior — new agitation, withdrawal, refusing food, not sleeping, crying out. Any of these may be how a resident with aphasia signals pain, illness, hunger, needing the bathroom, or fear when words fail them. Don\'t dismiss a non-communicative resident\'s distress as "just behavior" — treat it as a message you must decode and report.',
                '**Changes to report**',
                'Report communication changes, because they can signal serious things. A sudden new difficulty speaking or understanding — new slurring, word-finding trouble, or confusion in speech — is a red flag for stroke and must be reported immediately, as you learned in stroke care: that\'s a FAST sign. Report any new or worsening communication trouble. Report signs of pain or illness you\'ve read from a resident who can\'t tell you directly. Report frustration, withdrawal, or depression in a resident struggling to communicate. And report what works — the tools and approaches that reach a particular resident — so the whole team can connect with them. Your observations protect both their health and their connection.',
                '**The summary picture**',
                'Four pictures. Aphasia: word-finding trouble, effortful or jumbled speech, understanding problems — with the telltale mismatch of an intact mind behind broken words. Dysarthria: slurred, weak speech, language and mind intact — don\'t mistake it for confusion or drunkenness. Unspoken needs: read the face, body, and behavior for pain and distress words can\'t carry. Report: sudden speech change urgently (a stroke sign), worsening communication, read pain, withdrawal — and what works. The rule underneath it all: recognize the disorder, see the intact person behind it, read the needs they can\'t speak, and report changes — especially sudden ones — and what reaches them.',
              ].join('\n\n'),
            },
            {
              id: 'aph-s05-stroke-callout',
              type: 'callout',
              variant: 'warning',
              title: 'Sudden speech change = possible stroke',
              body: 'A sudden, new difficulty speaking or understanding — new slurring, word-finding trouble, or confused speech — is a FAST stroke sign. Report it immediately; do not wait and see.',
            },
          ]),
      },
      {
        slug: 's06-causes',
        title: 'Causes',
        sortOrder: 1,
        buildContent: () =>
          doc('Causes', [
            { id: 'aph-s06-heading', type: 'heading', level: 1, text: 'Causes' },
            {
              id: 'aph-s06-image',
              type: 'image',
              src: '/assets/courses/aphasia/s06-hero.jpg',
              caption: 'Stroke is the leading cause of aphasia in long-term care.',
            },
            pendingAudio(
              'aph-s06-audio',
              'What Causes Aphasia and Dysarthria — and Where the CNA Comes In',
              '/assets/courses/aphasia/s06-causes-podcast.mp3',
              [
                'What Causes Aphasia and Dysarthria — and Where the CNA Comes In',
                '',
                'Understanding what causes communication disorders does two things: it makes crystal clear that these are physical conditions, not a sign of low intelligence, and it shows where a caregiver\'s attention matters.',
                '',
                'The leading cause of aphasia is stroke. When a stroke interrupts blood flow to the parts of the brain that handle language — most often on the left side — those language areas are damaged, producing aphasia. Depending on exactly which area and how much is affected, the result may be mainly trouble expressing, mainly trouble understanding, or both. Because stroke is common in older adults, stroke-related aphasia is common in elder care. Other causes of aphasia include traumatic brain injury, brain tumors, brain infections, and certain dementias, where progressive damage gradually erodes language. In every case, the cause is damage to the brain\'s language system — the intellect and the person remain, even as the language pathway is harmed.',
                '',
                'Dysarthria comes from a different kind of damage: to the nerves and muscles that produce speech, or to the brain areas controlling them. Stroke can cause dysarthria too, by weakening the face, tongue, or throat muscles. So can Parkinson\'s disease, multiple sclerosis, ALS, and other neurological conditions, as well as muscle weakness and certain brain injuries. The key point repeats: in dysarthria, the language and the mind are intact — only the physical production of speech is impaired. The person knows exactly what they want to say and says it correctly in their head; the muscles simply can\'t shape it clearly.',
                '',
                'It\'s worth distinguishing these clearly from two other things they get confused with. Hearing loss, which you studied separately, is a problem getting sound in, not a language or speech problem — and the supports are different. And confusion or dementia involves the thinking itself, not just language — though dementia can affect communication too, and the two can coexist. The reason these distinctions matter for a CNA isn\'t diagnosis — that\'s for professionals — it\'s that recognizing the likely nature of a resident\'s difficulty guides how you communicate and what you report, and protects the resident from being misjudged.',
                '',
                'So where does the CNA come in? You don\'t treat the stroke or the nerve damage or restore the language — speech-language therapists work on rehabilitation, and the medical team manages the underlying cause. But you provide the daily communication support that determines whether a person with aphasia or dysarthria is reached or abandoned: the patience, the tools, the presumption of competence, the watchful reading of unspoken needs. You support and reinforce the communication strategies the speech therapist recommends. And you observe and report — especially the sudden new communication changes that can mean a fresh stroke, a medical emergency you learned to treat as FAST. The takeaway: aphasia comes from brain damage to language areas, dysarthria from damage to speech muscles or their control, both most often from stroke — none of it from low intelligence — and the CNA supports communication, reinforces therapy, and reports changes.',
              ].join('\n'),
              '/assets/courses/aphasia/s06-causes-podcast.mp3',
            ),
          ]),
      },
      {
        slug: 's07-medications',
        title: 'Medications & Treatment',
        sortOrder: 2,
        buildContent: () =>
          doc('Medications & Treatment', [
            { id: 'aph-s07-heading', type: 'heading', level: 1, text: 'Medications & Treatment' },
            {
              id: 'aph-s07-image',
              type: 'image',
              src: '/assets/courses/aphasia/s07-hero.jpg',
              caption: 'Patient, multi-tool communication is the care you deliver.',
            },
            {
              id: 'aph-s07-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of practice',
              body: 'A CNA does not diagnose communication disorders, does not provide speech therapy or formal language exercises beyond what the therapist directs, and does not test a resident\'s language or cognition. "Treatment" here means the daily communication support and reinforcement of speech therapy — that is the care you deliver.',
            },
            {
              id: 'aph-s07-narration',
              type: 'text',
              body: [
                'Aphasia and dysarthria are worked on by speech-language therapists and the medical team — but the daily communication that keeps a resident connected, understood, and safe is the CNA\'s, and it\'s a genuine skill. Let\'s walk through it, starting with the rule that never bends. A CNA does not diagnose communication disorders, does not provide speech therapy or formal language exercises beyond what the therapist directs, and does not test a resident\'s language or cognition.',
                '**The communication techniques — your core care.** Use these every time. Get attention and face the resident at eye level, in good light, minimizing noise and distraction. Speak slowly and clearly, short simple sentences, one idea at a time — in a normal, respectful, adult voice, never baby talk or shouting. Give generous time, with patient pauses; never finish their words or rush them. Use yes-or-no questions when expressing is hard, and offer choices they can point to. Use gestures, demonstration, facial expression, writing, drawing, and pictures freely. Confirm understanding — "Did you mean...?" — and watch their face and body for meaning. This patient, multi-tool communication is the heart of the care.',
                '**Presume competence — the mindset under every technique.** Carry it into every exchange: speak to the resident as the intelligent adult they are, include them in their care and choices, and never talk about them in front of them as if absent. Presuming competence isn\'t just kindness — it\'s usually accurate, and it\'s the dignity that communication loss most threatens.',
                '**Read and report unspoken needs.** Be the voice for what they can\'t say: watch the face, body, and behavior for pain, illness, hunger, toileting needs, or distress, and act on and report what you read. A non-communicative resident\'s grimace, guarding, or new agitation is a message — decode it and report it, never dismiss it.',
                '**Use and protect communication tools.** Learn each resident\'s AAC tools — picture boards, letter boards, writing aids, devices — and keep them within reach, charged, and used. Reinforce the specific strategies the speech therapist sets for that resident, and support their participation in therapy. A communication tool left in a drawer helps no one; in the resident\'s hands it restores their voice.',
                '**Support connection and watch mood.** Counter the isolation communication loss brings: take the time to converse, include the resident socially, and never let "it\'s hard to talk with them" become a reason to stop trying. Watch for the frustration, withdrawal, and depression that communication loss causes — responding to frustration with calm and patience, and reporting signs of depression as you learned. And report sudden new communication changes urgently, as a possible stroke.',
                'The scope point for this section: you never diagnose, deliver therapy, or test language — but you communicate skillfully, presume competence, read and report unspoken needs, use the tools, reinforce therapy, and protect connection. Patient communication is the care you deliver.',
              ].join('\n\n'),
            },
            {
              id: 'aph-s07-never-callout',
              type: 'callout',
              variant: 'warning',
              title: 'Never — and always report',
              body: 'Never baby-talk, shout, finish their words, talk about them as if absent, or give up. Read the face and body for unspoken pain. A sudden new speech change is a possible stroke — report it now (FAST).',
            },
          ]),
      },
      {
        slug: 's08-prevention',
        title: 'Prevention',
        sortOrder: 3,
        buildContent: () =>
          doc('Prevention', [
            { id: 'aph-s08-heading', type: 'heading', level: 1, text: 'Prevention' },
            {
              id: 'aph-s08-image',
              type: 'image',
              src: '/assets/courses/aphasia/s08-hero.jpg',
              caption: 'Skilled communication prevents isolation and missed needs.',
            },
            {
              id: 'aph-s08-narration',
              type: 'text',
              body: [
                'With communication disorders, prevention means preventing isolation, frustration, misjudgment, and missed needs — through skilled, patient communication. Here are seven ways.',
                '**One. Always presume competence.** Speak to every resident as an intelligent, feeling adult, even when they can\'t show it — never baby talk, never shouting, never talking about them as if they aren\'t there. This single habit prevents the deepest wound of communication loss: being treated as less than the whole person they still are. Presuming competence is prevention of indignity.',
                '**Two. Give time — never rush.** Slow down, pause patiently, and let residents find their words or work out your meaning without being hurried or interrupted. So much frustration and shutdown comes from being rushed. The gift of unhurried time prevents the distress and the giving-up that pressure causes — and is often all a resident needs to succeed.',
                '**Three. Simplify and use every tool.** Speak in short, clear, simple sentences, one idea at a time, and freely use gestures, pictures, writing, demonstration, and the resident\'s AAC tools. Matching your communication to what reaches each resident prevents the misunderstandings and failures that pure speech causes. The right tool turns a frustrating exchange into a successful one.',
                '**Four. Read the unspoken — prevent missed needs.** Watch every resident\'s face, body, and behavior for pain, illness, and needs they can\'t put into words, and act on what you see. This vigilance prevents the suffering that happens when a non-communicative resident\'s distress goes unnoticed. You are their early-warning system; your attention prevents missed problems.',
                '**Five. Tell the disorders apart — prevent misjudgment.** Keep in mind whether a resident struggles to express, to understand, to articulate (dysarthria), or to hear — because each needs a different approach, and confusing them leads to misjudgment. Recognizing that slurred speech or word-finding trouble doesn\'t mean low intelligence or confusion prevents the resident from being wrongly labeled and mistreated.',
                '**Six. Respond to frustration with calm.** When a resident boils over with the frustration of not being understood, stay calm and patient, reduce the pressure, reassure them, and try a different approach — never show irritation or rush them. Meeting frustration with steadiness prevents it from escalating and preserves the trust that keeps the resident willing to keep communicating.',
                '**Seven. Keep connecting — prevent isolation.** Make the ongoing effort to converse, include, and connect with communication-impaired residents, never letting difficulty become a reason to stop trying. Consistent connection prevents the isolation, loneliness, and depression that communication loss otherwise breeds. Your willingness to keep reaching them is what keeps them part of the world.',
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
        slug: 's09-emergency',
        title: 'When to Call Emergency or Doctor',
        sortOrder: 0,
        buildContent: () =>
          doc('When to Call Emergency or Doctor', [
            {
              id: 'aph-s09-heading',
              type: 'heading',
              level: 1,
              text: 'When to Call Emergency or Doctor',
            },
            pendingAudio(
              'aph-s09-intro-audio',
              'Sudden speech change versus reading unspoken distress — intro',
              '/assets/courses/aphasia/s09-emergency-intro.mp3',
              'With communication disorders, the judgments that matter most are recognizing a sudden new speech change as a possible stroke, and reading a non-communicative resident\'s distress as a real message rather than dismissing it. You\'re about to work through two situations. Read each carefully, choose your action, and you\'ll get feedback right away. Keep the core ideas in mind: sudden new trouble speaking or understanding is a FAST stroke sign to report immediately — and a resident who can\'t talk still tells you when something is wrong, through face, body, and behavior.',
              '/assets/courses/aphasia/s09-emergency-intro.mp3',
            ),
            {
              id: 'aph-s09-image',
              type: 'image',
              src: '/assets/courses/aphasia/s09-hero.jpg',
              caption: 'Sudden speech change is a FAST sign — act immediately.',
            },
            {
              id: 'aph-s09-scenario-image',
              type: 'image',
              src: '/assets/courses/aphasia/s09-scenario.jpg',
              caption: 'New slurred speech and facial droop may signal a stroke.',
            },
            {
              id: 'aph-s09-scenario-stroke',
              type: 'scenario_question',
              prompt:
                'Mr. Delacroix normally speaks clearly and chats with you each morning. Today, suddenly, his speech is slurred and he\'s struggling to find words — he seems to know what he wants to say but can\'t get it out, and one side of his face looks slightly droopy. A coworker says, "He\'s probably just tired or his dentures are loose — let him rest and see if it clears up." What SHOULD the CNA do?',
              options: [
                {
                  id: 'rest',
                  label: 'Assume he\'s tired or it\'s his dentures and let him rest',
                  feedback:
                    'Sudden new slurred speech and word-finding trouble, with one-sided facial droop, are classic stroke signs — the Face and Speech of FAST. New aphasia or dysarthria that appears suddenly is a stroke until proven otherwise, and stroke is a time-critical emergency. "Tired or dentures" wastes the treatment window. The right action: get emergency help immediately, note the last time he was normal, and don\'t give food or drink.',
                },
                {
                  id: 'emergency-now',
                  label: 'Recognize this as a possible stroke (sudden speech trouble plus facial droop are FAST signs) and get emergency help immediately',
                  feedback:
                    'Exactly right — and this recognition saves lives and brains. A sudden, new change in speech — slurring and word-finding trouble appearing today in someone who spoke clearly yesterday — combined with facial droop on one side is a classic stroke presentation: the F and S of FAST, face and speech. New aphasia or dysarthria that comes on suddenly is a stroke until proven otherwise, and stroke is a time-critical emergency where every minute of delay costs brain tissue. "Just tired or dentures" is exactly the dismissal that wastes the precious treatment window. Get emergency help immediately per your facility\'s protocol, note the time you last saw him normal — this morning\'s normal chat is his last-known-well time, which the medical team needs — stay with him, keep him safe and calm, and don\'t give him anything to eat or drink. This is not a "wait and see" situation.',
                  isRecommended: true,
                },
                {
                  id: 'next-meal',
                  label: 'Wait until the next meal to see if his speech improves',
                  feedback:
                    'Sudden new slurred speech and word-finding trouble, with one-sided facial droop, are classic stroke signs — the Face and Speech of FAST. New aphasia or dysarthria that appears suddenly is a stroke until proven otherwise, and stroke is a time-critical emergency. Waiting wastes the treatment window. The right action: get emergency help immediately, note the last time he was normal, and don\'t give food or drink.',
                },
                {
                  id: 'speak-clearly',
                  label: 'Tell him to speak more clearly and slowly',
                  feedback:
                    'Sudden new slurred speech and word-finding trouble, with one-sided facial droop, are classic stroke signs — the Face and Speech of FAST. This isn\'t something he can fix by trying harder; it\'s a time-critical emergency. The right action: get emergency help immediately, note the last time he was normal, and don\'t give food or drink.',
                },
              ],
              requiredForCompletion: true,
            },
            {
              id: 'aph-s09-scenario-unspoken',
              type: 'scenario_question',
              prompt:
                'Mrs. Abara has severe aphasia after a stroke and can\'t speak or reliably answer questions. Today she\'s different: grimacing, restless, guarding her lower belly with her hand, refusing to eat, and moaning at times — though she can\'t tell you what\'s wrong. A coworker says, "She can\'t tell us anything and she\'s always a bit agitated — it\'s probably just her usual behavior, don\'t worry about it." What SHOULD the CNA do?',
              options: [
                {
                  id: 'usual',
                  label: 'Assume it\'s just her usual behavior and not worry about it',
                  feedback:
                    'A resident with severe aphasia can\'t tell you in words — so grimacing, restlessness, guarding her belly, refusing food, and moaning ARE her communication, signaling likely pain or illness, especially as a change from her usual state. "Just her usual behavior" lets treatable problems go missed in people who can\'t speak. The right action: report these signs promptly and specifically so she can be assessed — don\'t wait, and don\'t demand words she doesn\'t have.',
                },
                {
                  id: 'report-now',
                  label: 'Recognize these as signs that something is wrong — likely pain or illness she can\'t express — and report them promptly to the nurse',
                  feedback:
                    'Right. Mrs. Abara can\'t use words — so her face, body, and behavior ARE her words, and right now they\'re saying something is wrong. Grimacing, restlessness, guarding her lower belly, refusing food, and moaning are a clear picture of pain or illness in a resident who can\'t tell you directly, and the change from her usual state is the key signal. Dismissing it as "just her usual behavior" is exactly the dangerous trap that lets real, treatable problems — a urinary infection, constipation, an acute abdomen, an injury — go unrecognized in people who can\'t speak. Her aphasia means she depends entirely on you to read and report what she can\'t say. So don\'t wait, and don\'t demand words she doesn\'t have. Report it promptly and specifically — the grimacing, the belly guarding, the food refusal, the moaning, and that it\'s a change for her — so she can be assessed for a medical cause.',
                  isRecommended: true,
                },
                {
                  id: 'insist-words',
                  label: 'Insist she tell you in words what hurts before doing anything',
                  feedback:
                    'She has severe aphasia — demanding words she doesn\'t have only adds distress and delays help. Her grimacing, belly guarding, food refusal, and moaning ARE her communication, signaling likely pain or illness, especially as a change from her usual state. The right action: report these signs promptly and specifically so she can be assessed.',
                },
                {
                  id: 'wait-days',
                  label: 'Wait several days to see if it passes',
                  feedback:
                    'Waiting risks letting a treatable problem — a urinary infection, constipation, an acute abdomen, an injury — go unrecognized in someone who can\'t speak. Her grimacing, belly guarding, food refusal, and moaning ARE her communication, and the change from her usual state is the key signal. The right action: report these signs promptly and specifically so she can be assessed now.',
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
            { id: 'aph-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
              id: 'aph-s10-video',
              type: 'video',
              title: "CNA's Role in Care",
              videoUrl: '/assets/courses/aphasia/s10-cna-role.mp4',
              placeholderNote: 'Pending upload: /assets/courses/aphasia/s10-cna-role.mp4',
            },
            {
              id: 'aph-s10-image',
              type: 'image',
              src: '/assets/courses/aphasia/s10-hero.jpg',
              caption: 'Your patient communication unlocks the person behind broken language.',
            },
            {
              id: 'aph-s10-narration',
              type: 'text',
              body: [
                'Your role with communication disorders is skilled patient communication, presuming competence, reading unspoken needs, using the tools, and protecting connection. Let\'s walk through it.',
                '**Communicate with skill and patience.** Be the patient bridge. Every interaction: get attention, face them at eye level in good light, speak slowly and simply in a normal adult voice, give generous time without rushing or finishing their words, use yes-or-no questions and choices, and bring in gestures, writing, drawing, and pictures. Confirm you understood. For a resident locked behind broken language, your patient, multi-tool communication is the path back to being understood — and it\'s the heart of this work.',
                '**Presume competence, always.** Carry the mindset into everything: treat the resident as the intelligent, feeling adult they are, speak to them and not about them, include them in their care and choices, and never baby-talk, shout, or talk over their head. Presuming competence is almost always accurate and is the dignity communication loss most threatens. You protect the person, not just manage the impairment.',
                '**Be their voice: read and report.** Become the voice for what they can\'t say. Watch the face, body, and behavior for pain, illness, hunger, toileting needs, and distress, and act on and report what you read — never dismissing a non-communicative resident\'s distress as "just behavior." And report communication changes, especially a sudden new speech change, which can mean a stroke. Your watchful reading catches the needs and emergencies words can\'t carry.',
                '**Use the tools and protect connection.** Keep each resident\'s communication tools within reach and used, reinforce the speech therapist\'s strategies, and support therapy. And hold the line against isolation: keep taking the time to converse, include, and connect, never letting difficulty become a reason to stop trying, and watch for frustration and depression. You keep the resident connected to the world.',
                'Now the boundary. You do not diagnose communication disorders. You do not provide speech therapy or formal language testing. And you never baby-talk or shout at a resident, never talk about them as if absent, never dismiss their unspoken distress, and never give up on reaching them.',
                'Inside your role — skilled patient communication, presumed competence, reading unspoken needs, using the tools, and protecting connection — you unlock the intelligent, feeling person trapped behind broken language, keep them safe by voicing what they can\'t, and keep them connected to the world. That is among the most human work there is, and it\'s profoundly yours.',
              ].join('\n\n'),
            },
            {
              id: 'aph-s10-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Stay within scope',
              body: 'You do not diagnose communication disorders, provide speech therapy, or test language. You communicate skillfully, presume competence, read and report unspoken needs, use the tools, reinforce therapy, and protect connection.',
            },
          ]),
      },
      {
        slug: 's11-case-study',
        title: 'Brief Case Study',
        sortOrder: 2,
        buildContent: () => {
          const caseNarrative = [
            'Mr. Delacroix, 74, had a stroke that left him with severe expressive aphasia. He understood almost everything said to him — he was sharp, aware, and emotionally present — but he could produce only a few halting words, and finding them was a struggle. Over his first weeks on the unit, something quietly sad had happened: because talking with him was slow and hard, staff had gradually stopped really trying. They spoke about him in front of him — "he can\'t really communicate" — used a slightly sing-song, simplified voice, made his choices for him, and kept their visits brief and one-sided. He had grown withdrawn and low. His new CNA, Daniel, saw it differently from day one.',
            '',
            '**What Daniel understood:** Daniel knew the central truth of aphasia: it\'s a loss of language, not intelligence — and the mismatch in Mr. Delacroix made it obvious. The man\'s eyes followed everything, he reacted appropriately to jokes and news, he showed clear preferences and emotions; he plainly understood and felt everything. The problem was only that he couldn\'t get the words out. Daniel realized Mr. Delacroix wasn\'t "gone" or "not there" — he was a fully present, intelligent man, trapped behind a broken bridge to speech, and being treated as less than he was. So Daniel resolved to presume competence and find the path to reach him.',
            '',
            '**What Daniel did:** He changed how he communicated completely. He spoke to Mr. Delacroix directly, as one adult to another, in a normal respectful voice — no baby talk, no talking about him as if he weren\'t there. He slowed down and gave time — long, patient pauses, never finishing the words for him or rushing him, letting him work to produce what he could. He used yes-or-no questions so Mr. Delacroix could answer with a nod or shake, and offered choices he could point to. He brought in a picture board and a notepad, and discovered Mr. Delacroix could sometimes write a key word or point to an image when speech failed. And he included him in everything — his care, his choices, the morning chat — treating him as the competent man he was.',
            '',
            '**The unlocking:** It worked, and it transformed him. Given time, tools, and respect, Mr. Delacroix could communicate far more than anyone had realized — his needs, his preferences, his sense of humor, his feelings. He brightened; the withdrawal lifted. One morning, working hard, he managed to point to a photo of his late wife and produce her name and the word "miss," and Daniel simply sat with him in that moment — a real, human exchange that the "he can\'t communicate" approach had made impossible. Daniel also reinforced the strategies the speech therapist was using, and shared with the whole team what reached Mr. Delacroix — the yes-or-no questions, the picture board, the patience — so others could connect with him too.',
            '',
            '**The safety catch:** Daniel\'s attentiveness paid off another way. One day Mr. Delacroix was grimacing, restless, and guarding his side, unable to explain — and because Daniel read his face and body rather than dismissing it, he caught and reported what turned out to be a treatable infection, early. A man who couldn\'t say "I hurt" was protected because someone was reading him.',
            '',
            '**The outcome:** Mr. Delacroix went from a withdrawn man everyone had stopped talking to, to a connected, expressive person whose intelligence and humanity were finally seen — not because his aphasia improved, but because the people around him changed how they communicated and started presuming the competence that was there all along.',
          ].join('\n');

          return doc('Brief Case Study', [
            { id: 'aph-s11-heading', type: 'heading', level: 1, text: 'Brief Case Study' },
            pendingAudio(
              'aph-s11-audio',
              'The Man Everyone Stopped Talking To',
              '/assets/courses/aphasia/s11-case-podcast.mp3',
              caseNarrative,
              '/assets/courses/aphasia/s11-case-podcast.mp3',
            ),
            {
              id: 'aph-s11-image',
              type: 'image',
              src: '/assets/courses/aphasia/s11-hero.jpg',
              caption: 'Presuming competence changed everything for Mr. Delacroix.',
            },
            {
              id: 'aph-s11-case-study',
              type: 'case_study',
              title: 'The Man Everyone Stopped Talking To',
              residentProfile:
                'Mr. Delacroix, 74, had a stroke that left him with severe expressive aphasia. He understood almost everything said to him — sharp, aware, and emotionally present — but could produce only a few halting words. Because talking with him was slow and hard, staff had gradually stopped really trying, spoke about him in front of him, made his choices for him, and he had grown withdrawn and low.',
              scenario: [
                '**What Daniel understood:** Daniel knew the central truth of aphasia: it\'s a loss of language, not intelligence — and the mismatch in Mr. Delacroix made it obvious. His eyes followed everything, he reacted appropriately to jokes and news, he showed clear preferences and emotions; he plainly understood and felt everything. The problem was only that he couldn\'t get the words out. Daniel realized Mr. Delacroix wasn\'t "gone" — he was a fully present, intelligent man trapped behind a broken bridge to speech. So Daniel resolved to presume competence and find the path to reach him.',
                '**What Daniel did:** He spoke to Mr. Delacroix directly, as one adult to another, in a normal respectful voice — no baby talk, no talking about him as if he weren\'t there. He slowed down and gave time — long, patient pauses, never finishing the words or rushing him. He used yes-or-no questions so Mr. Delacroix could answer with a nod or shake, and offered choices he could point to. He brought in a picture board and a notepad, and discovered Mr. Delacroix could sometimes write a key word or point to an image when speech failed. And he included him in everything — his care, his choices, the morning chat.',
                '**The unlocking:** Given time, tools, and respect, Mr. Delacroix could communicate far more than anyone had realized — his needs, his preferences, his humor, his feelings. He brightened; the withdrawal lifted. One morning, working hard, he managed to point to a photo of his late wife and produce her name and the word "miss," and Daniel simply sat with him in that moment. Daniel also reinforced the speech therapist\'s strategies and shared with the team what reached him — the yes-or-no questions, the picture board, the patience.',
                '**The safety catch:** One day Mr. Delacroix was grimacing, restless, and guarding his side, unable to explain — and because Daniel read his face and body rather than dismissing it, he caught and reported what turned out to be a treatable infection, early. A man who couldn\'t say "I hurt" was protected because someone was reading him.',
                '**The outcome:** Mr. Delacroix went from a withdrawn man everyone had stopped talking to, to a connected, expressive person whose intelligence and humanity were finally seen — not because his aphasia improved, but because the people around him changed how they communicated and started presuming the competence that was there all along.',
              ].join('\n\n'),
            },
            {
              id: 'aph-s11-reflection-1',
              type: 'reflection',
              prompt:
                'Staff had decided Mr. Delacroix "couldn\'t communicate" and largely stopped trying. What did Daniel understand about aphasia that they had missed, and how did presuming competence change everything?',
              minCharacters: 50,
            },
            {
              id: 'aph-s11-reflection-2',
              type: 'reflection',
              prompt:
                'When Mr. Delacroix was grimacing and guarding his side but couldn\'t explain, Daniel reported it and an infection was caught early. Why is reading and reporting unspoken needs so critical for residents with severe communication loss?',
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
            { id: 'aph-s12-heading', type: 'heading', level: 1, text: 'Conclusion' },
            {
              id: 'aph-s12-video',
              type: 'video',
              title: 'Conclusion',
              videoUrl: '/assets/courses/aphasia/s12-conclusion.mp4',
              placeholderNote: 'Pending upload: /assets/courses/aphasia/s12-conclusion.mp4',
            },
            {
              id: 'aph-s12-image',
              type: 'image',
              src: '/assets/courses/aphasia/s12-hero.jpg',
              caption: 'You stand between a resident and the isolation that broken communication brings.',
            },
            {
              id: 'aph-s12-narration',
              type: 'text',
              body: [
                'You\'ve reached the end. Let\'s lock in the five things that matter most for caring for residents with communication disorders.',
                '**One.** Aphasia is a loss of language, not a loss of intelligence — the person is usually still whole, aware, and feeling, just unable to access words. Dysarthria is slurred speech from weak muscles, with language and mind fully intact. In both, an intelligent, feeling adult is trapped behind broken communication. Never mistake the broken words for a broken mind.',
                '**Two.** Presume competence — always. Speak to residents as the intelligent adults they are, include them in their care and choices, and never use baby talk, shout, talk about them as if absent, or give up. Presuming competence is almost always accurate, and it\'s the dignity that communication loss most threatens.',
                '**Three.** Communicate with skill and patience. Face them at eye level, speak slowly and simply in a normal voice, give generous time without rushing or finishing their words, use yes-or-no questions and choices, and bring in gestures, writing, drawing, pictures, and their communication tools. Patient, multi-tool communication is the bridge back to being understood.',
                '**Four.** Be their voice. A resident who can\'t communicate well depends on you to read pain, illness, and needs from their face, body, and behavior — and to report what you see. Never dismiss a non-communicative resident\'s distress as "just behavior"; it\'s a message. And report sudden new speech changes immediately — they can mean a stroke.',
                '**Five.** Protect connection, and honor your scope. Keep reaching, including, and conversing, so communication loss doesn\'t become isolation and depression. You never diagnose, deliver therapy, or test language — but you communicate, presume competence, read and report, use the tools, and reinforce therapy. Unlock the person inside — that is the heart of this care.',

                'This course provides one hour of continuing education through CAL ACE Nursing Academy (CDPH Provider NAC #7384). Your certificate is generated automatically when you pass the knowledge check.',
                'Ten questions are waiting. Everything on them was covered here. You\'re ready. Trust what you\'ve learned, and show what you know.',
              ].join('\n\n'),
            },
            {
              id: 'aph-s12-summary',
              type: 'summary',
              title: 'Five things that matter most',
              items: [
                'Aphasia is a loss of language, not intelligence; dysarthria is slurred speech from weak muscles with the mind intact — never mistake broken words for a broken mind.',
                'Presume competence always — speak to residents as intelligent adults, include them, and never baby-talk, shout, talk about them as if absent, or give up.',
                'Communicate with skill and patience — eye level, simple words, generous time, yes/no questions, gestures, writing, pictures, and their AAC tools.',
                'Be their voice — read pain, illness, and needs from face, body, and behavior and report them; never dismiss distress as "just behavior."',
                'Protect connection and honor your scope — keep reaching to prevent isolation; never diagnose, deliver therapy, or test language; report sudden speech changes as a possible stroke.',
              ],
            },
          ]),
      },
    ],
  },
];

export async function seedCourse01Aphasia(
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
      label: 'V3 rebuild — aphasia & communication disorders',
      status: CourseVersionStatus.DRAFT,
      deliveryMode: DeliveryMode.ONLINE,
      ceHours,
      publishedAt: null,
      contentMeta: contentMeta as Prisma.InputJsonValue,
    },
    update: {
      label: 'V3 rebuild — aphasia & communication disorders',
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
  console.log(`Seeding Course 1 (Aphasia) as DRAFT — slug "${COURSE_SLUG}", version ${VERSION_NUMBER}…`);

  try {
    const result = await seedCourse01Aphasia(prisma);
    const blockCounts = blockCountsByLesson();

    console.log('Seed complete.');
    console.log(`  Course:   ${COURSE_TITLE}`);
    console.log(`  Slug:     ${COURSE_SLUG}`);
    console.log(`  Version:  ${VERSION_NUMBER}`);
    console.log(`  Created:  ${result.courseCreated ? 'yes (new)' : 'no (updated existing)'}`);
    console.log(`  Modules:  ${result.modulesUpserted}`);
    console.log(`  Lessons:  ${result.lessonsUpserted}`);
    console.log(
      `  Strays:   ${result.straysDeleted} modules, ${result.strayLessonsDeleted} lessons soft-deleted`,
    );
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
