/**
 * Seed Course 7 — Alzheimer's Disease & Dementia (DRAFT).
 *
 * V3 rebuild of the former "Dementia Care for Nursing Assistants", reframed to the
 * conditions (Alzheimer's & dementia) the care serves, aligned to the 12–50 scaffold.
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-07-alzheimers-dementia
 *
 * Idempotent upserts by slug. Self-cleans stray modules on the target DRAFT version.
 * Does not seed the final quiz (pending owner approval; see the -exam.ts file).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CONFIRMED against the live DB (read-only inspection inspect-dementia-target.ts):
 *   COURSE_SLUG    = 'dementia-care'  (FROZEN — course already live)
 *   VERSION_NUMBER = 2                (MAX existing version is v1 PUBLISHED with real
 *                                      content; this creates v2 as a new DRAFT revision,
 *                                      leaving v1 intact)
 * NOTE: a SEPARATE course 'dementia-care-essentials' (DRAFT stub) also exists in the DB —
 * it is NOT this course's target and must not be touched.
 * Only the DISPLAY TITLE changes — NOT the slug.
 * DRAFT-only. Run order: this main seed first, then the -exam seed.
 *
 * SCOPE: CNAs provide safe, patient, person-centered daily care, communicate and
 * connect, keep residents safe, respond calmly to confusion, support dignity, and
 * recognize/report changes. CNAs do NOT diagnose dementia, do NOT stage it medically,
 * and do NOT manage or give judgments about medications — those belong to the team.
 * The behavioral de-escalation deep-dive is deferred to Course 8.
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
const COURSE_SLUG = 'dementia-care';

// Display title changes to the condition framing; slug stays frozen above.
const COURSE_TITLE = "Memory Disorders: Alzheimer's and Dementia Care Support";
const COURSE_SUMMARY =
  'Care for residents living with Alzheimer\'s and dementia as whole people, not diagnoses. Understand the disease and its stages, recognize the signs and behaviors, communicate and connect ("connect, don\'t correct"), find the need behind the behavior, provide safe and dignified daily care, and recognize when a sudden change is a medical red flag — not "just the dementia." CNAs provide person-centered care and report changes; they do not diagnose, stage, or manage medications.';

// CONFIRMED against live DB — MAX existing version is v1 PUBLISHED; create v2 DRAFT.
const VERSION_NUMBER = 2;

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
    'Understand Alzheimer\'s and dementia as brain diseases — not normal aging or a choice',
    'Recognize the stages, signs, and behaviors of dementia',
    'Communicate and connect using "connect, don\'t correct" and person-centered care',
    'Find the need behind the behavior and provide calm, safe, dignified daily care',
    'Recognize a sudden change as a possible medical problem and report it — and stay within CNA scope',
  ],
  faq: [] as { question: string; answer: string }[],
  compliance: {
    providerName: 'CAL ACE Nursing Academy',

    cdphApprovalStatus: 'placeholder' as const,
    targetAudience: 'California certified nursing assistants',
    requiredSeatTimeMinutes: 50,
    onlineDeliveryDesignation: 'online' as const,
  },
  imageAccent: 'violet',
  heroImage: '/assets/courses/alzheimers-dementia/hero-banner.jpg',
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
    title: 'Understanding Alzheimer\'s & Dementia',
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: 'Introduction',
        sortOrder: 0,
        buildContent: () =>
          doc('Introduction', [
            { id: 'dem-s01-heading', type: 'heading', level: 1, text: 'Introduction' },
            {
              id: 'dem-s01-video',
              type: 'video',
              title: 'Introduction',
              videoUrl: '/assets/courses/alzheimers-dementia/s01-intro.mp4',
              placeholderNote: 'Pending upload: /assets/courses/alzheimers-dementia/s01-intro.mp4',
            },
            {
              id: 'dem-s01-image',
              type: 'image',
              src: '/assets/courses/alzheimers-dementia/s01-hero.jpg',
              caption: 'A CAL ACE CNA meeting a resident with warmth and patience.',
            },
            {
              id: 'dem-s01-narration',
              type: 'text',
              body: [
                'Welcome to CAL ACE Nursing Academy.',
                'This course is about Alzheimer\'s disease and dementia — and it\'s a course about people, as much as about a condition. As a CNA, you will care for many residents living with dementia, and the quality of their days depends enormously on how you understand them and how you treat them. Done with knowledge and heart, this is some of the most meaningful work in all of caregiving.',
                'Let\'s define the terms. Dementia is not one disease — it\'s a general term for a serious, ongoing decline in memory, thinking, and reasoning, severe enough to interfere with daily life. Alzheimer\'s disease is the most common cause of dementia — a progressive brain disease that slowly destroys memory and thinking. There are other causes too, but they share a thread: the brain is changing, and the person\'s abilities are slowly slipping away, through no fault of their own. Dementia is not a normal part of aging, and it is not the person choosing to be difficult — it\'s a disease of the brain.',
                'Here is the single most important truth in this entire course, the one everything else rests on: the person is still there. Behind the confusion, the repeated questions, the forgotten names, there is a whole human being — with a lifetime of memories, a personality, feelings, dignity, and worth that the disease cannot erase. Your resident with dementia is not an empty shell or a list of problems. They are a person who deserves respect, patience, and connection — and who can still feel love, comfort, fear, and kindness, even when words and memory fail. If you remember nothing else, remember: there is always a person there.',
                'Why does your role matter so much? Because dementia is common and growing — millions live with it, and the numbers rise as the population ages. And because people with dementia are deeply dependent on their caregivers — not just for physical care, but for safety, comfort, communication, and emotional wellbeing. They often can\'t advocate for themselves, can\'t always explain what they need, and can\'t change how they experience the world. So the caregiver becomes their bridge — to safety, to dignity, to moments of joy. You are that bridge.',
                'This course teaches you to understand the disease and its stages, to recognize and respond to the changes and behaviors it brings, to communicate and connect in ways that work, to provide safe and supportive daily care, and to do it all in a way that protects dignity and meets the person where they are. A guiding phrase you\'ll hear: connect, don\'t correct — meet them in their reality rather than forcing them into yours.',
                'The guiding spirit of this course: see the person, not just the disease — and let everything you do protect their dignity.',
                'Your scope is clear. A CNA provides safe, patient, person-centered daily care, communicates and connects skillfully, keeps residents safe, responds calmly to confusion and difficult moments, supports dignity, and recognizes and reports changes. A CNA does not diagnose dementia, does not stage it medically, and does not manage medications — those belong to the team.',
                'By the end of this course, you will be able to: understand Alzheimer\'s and dementia. Recognize the stages and changes. Communicate and connect effectively. Provide safe, dignified daily care. And respond well to the challenges dementia brings. Let\'s begin.',
              ].join('\n\n'),
            },
            {
              id: 'dem-s01-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'See the person, not just the disease',
              body: 'Dementia is a disease of the brain — NOT normal aging, NOT a choice. Alzheimer\'s is its most common cause. The single most important truth: the person is still there, with feelings, history, and dignity the disease can\'t erase. Connect, don\'t correct — meet them in their reality. You provide person-centered care and report changes; you don\'t diagnose, stage, or manage medications.',
            },
          ]),
      },
      {
        slug: 's02-terms',
        title: 'Terms & Definitions',
        sortOrder: 1,
        buildContent: () =>
          doc('Terms & Definitions', [
            { id: 'dem-s02-heading', type: 'heading', level: 1, text: 'Terms & Definitions' },
            {
              id: 'dem-s02-image',
              type: 'image',
              src: '/assets/courses/alzheimers-dementia/s02-hero.jpg',
              caption: 'Dementia is a brain disease — its symptoms are never the person\'s choice.',
            },
            {
              id: 'dem-s02-reveal-dementia',
              type: 'reveal_card',
              frontTitle: 'Dementia',
              frontBody: 'Dementia',
              backTitle: 'Dementia',
              backBody:
                'A general term for a serious, lasting decline in memory, thinking, and reasoning — severe enough to interfere with daily life. It is not one single disease, and it is not a normal part of aging. It is caused by diseases that damage the brain. Dementia gets worse over time, and it affects the whole person — memory, judgment, language, mood, and behavior.',
            },
            {
              id: 'dem-s02-reveal-alzheimers',
              type: 'reveal_card',
              frontTitle: 'Alzheimer\'s Disease',
              frontBody: 'ALZ-high-merz',
              backTitle: 'Alzheimer\'s Disease',
              backBody:
                'The most common cause of dementia — a progressive brain disease that slowly destroys memory, thinking, and eventually the ability to carry out daily tasks. It develops gradually and worsens over years. Most people with dementia have Alzheimer\'s, though other causes exist. The person is not choosing to forget; their brain is being changed by the disease.',
            },
            {
              id: 'dem-s02-reveal-person-centered',
              type: 'reveal_card',
              frontTitle: 'Person-Centered Care',
              frontBody: 'Person-centered care',
              backTitle: 'Person-Centered Care',
              backBody:
                'Care that focuses on the whole person — their history, preferences, personality, and dignity — not just their diagnosis or tasks. It means seeing the human being behind the dementia and tailoring care to who they are. Person-centered care is the heart of good dementia care: meeting each resident as an individual, with respect and warmth.',
            },
            {
              id: 'dem-s02-reveal-cognitive-decline',
              type: 'reveal_card',
              frontTitle: 'Cognitive Decline',
              frontBody: 'Cognitive decline',
              backTitle: 'Cognitive Decline',
              backBody:
                'The gradual loss of thinking abilities — memory, attention, reasoning, language, judgment, and recognizing people or places. In dementia, this decline is ongoing and worsens over time. Understanding that a resident\'s confusion comes from real brain changes — not stubbornness or choice — helps you respond with patience instead of frustration.',
            },
            {
              id: 'dem-s02-reveal-sundowning',
              type: 'reveal_card',
              frontTitle: 'Sundowning',
              frontBody: 'Sundowning',
              backTitle: 'Sundowning',
              backBody:
                'A common pattern in dementia where confusion, agitation, restlessness, or distress increases in the late afternoon and evening — as the sun goes down. The person may become more anxious, wander, or be harder to settle at these times. Knowing about sundowning helps you anticipate it, plan calming routines, and respond with patience when evenings get harder.',
            },
            {
              id: 'dem-s02-reveal-wandering',
              type: 'reveal_card',
              frontTitle: 'Wandering',
              frontBody: 'Wandering',
              backTitle: 'Wandering',
              backBody:
                'When a person with dementia moves about and may leave a safe area, often without a clear purpose or awareness of danger — sometimes searching for something or someone, or trying to "go home." Wandering is a serious safety risk because the person may become lost or harmed. Preventing and safely managing wandering is a key part of keeping residents with dementia safe.',
            },
            {
              id: 'dem-s02-reveal-validation',
              type: 'reveal_card',
              frontTitle: 'Validation (Meeting Their Reality)',
              frontBody: 'Validation — meeting their reality',
              backTitle: 'Validation (Meeting Their Reality)',
              backBody:
                'A way of responding that accepts the person\'s feelings and reality instead of correcting or arguing with them. If a resident believes it\'s 1965 or asks for a long-gone loved one, you don\'t harshly correct them — you respond to the feeling and gently redirect. Validation reduces distress and preserves dignity. The phrase: connect, don\'t correct.',
            },
            {
              id: 'dem-s02-reveal-dignity',
              type: 'reveal_card',
              frontTitle: 'Dignity',
              frontBody: 'Dignity',
              backTitle: 'Dignity',
              backBody:
                'The respect and sense of worth every person deserves, no matter how advanced their dementia. Protecting dignity means treating residents as the adults and individuals they are — never talking down to them, never embarrassing them, always offering choices and privacy where you can. Dignity is something the disease can never take away, and something your care must always protect.',
            },
            {
              id: 'dem-s02-knowledge-check',
              type: 'knowledge_check',
              question: '"Connect, don\'t correct" with a confused resident means:',
              options: [
                { id: 'connect', label: 'Meet their reality with warmth and reassurance instead of arguing or forcing facts' },
                { id: 'quiz', label: 'Quiz them on the date and their family' },
                { id: 'argue', label: 'Argue with them until they understand the truth' },
              ],
              correctOptionId: 'connect',
              explanation:
                '"Connect, don\'t correct" means responding to the feeling beneath a resident\'s confusion — reassuring and gently redirecting — rather than arguing, quizzing, or forcing painful reality on them. Meeting them where they are reduces distress and preserves dignity.',
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
            { id: 'dem-s03-heading', type: 'heading', level: 1, text: 'Statistics' },
            {
              id: 'dem-s03-image',
              type: 'image',
              src: '/assets/courses/alzheimers-dementia/s03-hero.jpg',
              caption: 'The person is still there, behind the disease.',
            },
            pendingAudio(
              'dem-s03-audio',
              'The Person Behind the Disease: Why Dementia Care Defines a CNA\'s Impact',
              '/assets/courses/alzheimers-dementia/s03-stats-podcast.mp3',
              [
                'The Person Behind the Disease: Why Dementia Care Defines a CNA\'s Impact',
                '',
                'Dementia is one of the defining health challenges of an aging world. Millions of people live with it today, and as populations grow older, those numbers are climbing steadily — meaning that for a CNA, caring for residents with dementia isn\'t a niche skill but a central, everyday part of the work. In long-term care especially, a large share of residents have some form of dementia, and many have it in moderate to advanced stages. If you work in elder care, you will care for these residents constantly, and how well you do it will shape countless lives.',
                '',
                'Alzheimer\'s disease is the leading cause, accounting for most dementia, with other causes adding to the total. What unites them is a hard reality: these are progressive brain diseases. They are not normal aging, not laziness, not stubbornness, and not the person choosing to be difficult — they are physical diseases steadily changing the brain, stripping away memory, reasoning, language, and eventually the ability to manage daily life. Understanding this matters enormously for caregiving, because it transforms how you interpret a resident\'s confusion or repeated questions: not as misbehavior to be corrected, but as the visible edge of a disease to be met with patience.',
                '',
                'Here is what makes the CNA\'s role so pivotal: people with dementia are profoundly dependent on their caregivers — and increasingly so as the disease advances. They depend on you not only for physical care, but for safety, for communication when their own words fail, for comfort when they\'re frightened or lost, and for protection of their dignity when they can no longer protect it themselves. They often cannot explain what they need, cannot advocate for themselves, and cannot change how they experience a world that has become confusing and sometimes frightening. The caregiver becomes their bridge to a safe, comfortable, dignified life. Research on dementia care consistently shows that the caregiver\'s approach — patient and person-centered, or rushed and impersonal — dramatically affects residents\' distress, behavior, and quality of life.',
                '',
                'And threaded through all of it is the truth that gives this work its meaning: the person is still there. Beneath the confusion remains a whole human being — a life lived, a personality, feelings that persist even when memory and words don\'t. People with advanced dementia still respond to warmth, to a gentle voice, to music, to kindness, to being treated with respect. The encouraging, even beautiful, finding from good dementia care is that connection remains possible long after conversation becomes hard — and that a skilled, caring CNA can bring real comfort and moments of joy to someone the world has too often written off. The bottom line: dementia is common and growing, Alzheimer\'s leads the causes, these residents depend deeply on their caregivers, the person endures behind the disease, and person-centered, dignified CNA care profoundly shapes how they live.',
              ].join('\n'),
              '/assets/courses/alzheimers-dementia/s03-stats-podcast.mp3',
            ),
            {
              id: 'dem-s03-source-note',
              type: 'callout',
              variant: 'clinical',
              title: 'About these figures',
              body: 'This section describes dementia qualitatively (e.g., "millions of people," "a large share of residents," "Alzheimer\'s is the leading cause") rather than citing specific numbers. Any precise statistic added later must come from a named, verifiable source (e.g., Alzheimer\'s Association / dementia care research) — not from estimation.',
            },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: 'Fundamentals',
        sortOrder: 3,
        buildContent: () =>
          doc('Fundamentals', [
            { id: 'dem-s04-heading', type: 'heading', level: 1, text: 'Fundamentals' },
            {
              id: 'dem-s04-video',
              type: 'video',
              title: 'Fundamentals',
              videoUrl: '/assets/courses/alzheimers-dementia/s04-fundamentals.mp4',
              placeholderNote: 'Pending upload: /assets/courses/alzheimers-dementia/s04-fundamentals.mp4',
            },
            {
              id: 'dem-s04-image',
              type: 'image',
              src: '/assets/courses/alzheimers-dementia/s04-hero.jpg',
              caption: 'Person-centered care shapes how a resident lives every day.',
            },
            {
              id: 'dem-s04-narration',
              type: 'text',
              body: [
                '**What dementia is — and isn\'t**',
                'Let\'s be clear about what dementia is. It\'s a serious, ongoing decline in memory, thinking, and reasoning caused by diseases that damage the brain — severe enough to disrupt daily life. Alzheimer\'s is the most common cause. Now what it is NOT: it is not normal aging — forgetting a name sometimes is normal, but dementia is far more. It is not laziness or stubbornness. It is not the person choosing to be difficult, to repeat questions, or to resist care. It is a physical brain disease. Holding this truth changes everything, because it turns frustration into understanding and lets you respond with patience instead of blame.',
                '**The person is still there**',
                'This is the heart of dementia care, so let it anchor you: behind the disease is a whole person. A lifetime of memories, a personality, preferences, humor, history, and feelings that endure even as memory and words fade. Your resident is not a diagnosis or a set of problems — they are someone\'s mother, father, spouse, friend; someone who worked, loved, and lived a full life. They can still feel respected or humiliated, comforted or frightened, loved or dismissed. Every interaction either honors the person who\'s still there or overlooks them. Choose, always, to see and honor the person.',
                '**How dementia progresses**',
                'Dementia generally worsens over time, often described in early, middle, and late stages — though every person\'s path is unique. Early on: mild memory loss, trouble finding words, some confusion, but much independence remains. In the middle stage: greater memory loss, more confusion, difficulty with daily tasks, possible personality changes, wandering, and behaviors like agitation. In the late stage: profound memory and communication loss, full dependence for care, and physical decline. Knowing the stages helps you understand what a resident can and can\'t do, and adjust your care — but always to the individual in front of you, not a textbook label.',
                '**What\'s lost, and what remains**',
                'Dementia takes some abilities while sparing others, and good care leans on what remains. Often lost: recent memory, the ability to learn new things, reasoning and judgment, sense of time and place, and eventually language and self-care. Often remaining, especially until late: long-term and emotional memory, the response to music, touch, and warmth, the ability to feel emotions, and the capacity to sense how they\'re being treated. So while a resident may not recall your name or the date, they can still feel your kindness or your impatience. Care to what remains: connection, comfort, dignity, and emotion endure when facts don\'t.',
                '**Communication: connect, don\'t correct**',
                'Communicating with someone who has dementia takes a different approach, and it\'s one of your most valuable skills. Approach calmly from the front, make eye contact, use their name, and smile. Speak slowly, simply, one idea at a time, with a warm tone — your tone and body language matter as much as words. Give time to respond. And crucially: don\'t argue with or harshly correct their confusion. If they believe a false thing or ask for someone long gone, respond to the feeling, reassure, and gently redirect rather than forcing painful reality on them. Connect, don\'t correct. Meeting them where they are reduces distress and preserves dignity.',
                '**Daily care: routine, patience, and choice**',
                'Daily care goes better with a few principles. Keep routines consistent — familiar patterns comfort and orient. Be patient and unhurried; rushing creates fear and resistance. Break tasks into simple steps, one at a time, and offer simple choices to preserve control and dignity. Use a calm, reassuring manner, and approach care as something you do with the resident, not to them. Watch for what triggers distress and what soothes. And let them do what they can — preserving ability and dignity. Patient, consistent, choice-offering care turns daily tasks from battles into moments of cooperation and even connection.',
                '**Safety and dignity, always**',
                'Two things must run through everything: safety and dignity. Safety, because dementia removes judgment and awareness of danger — so you prevent wandering into unsafe places, guard against falls, watch for hazards, and supervise closely, all while allowing as much freedom as is safe. Dignity, because no matter how advanced the disease, the person deserves respect — never talked down to, never embarrassed, never treated as less than a full adult. Offer privacy, choices, and gentleness. Protect them from harm and from humiliation alike. Safety keeps them alive; dignity keeps them human. Your care must always hold both.',
              ].join('\n\n'),
            },
            {
              id: 'dem-s04-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'What\'s lost vs. what remains',
              body: 'Often lost: recent memory, learning new things, reasoning, sense of time and place, eventually language. Often remains until late: emotional and long-term memory, response to music, touch, and warmth, the ability to feel emotion, and the capacity to sense how they\'re being treated. A resident may not recall your name but still feels your kindness or impatience. Safety keeps them alive; dignity keeps them human.',
            },
          ]),
      },
    ],
  },
  {
    slug: 'module-2',
    title: 'Recognizing Dementia & Understanding Behavior',
    sortOrder: 1,
    lessons: [
      {
        slug: 's05-signs',
        title: 'Signs & Symptoms',
        sortOrder: 0,
        buildContent: () =>
          doc('Signs & Symptoms', [
            { id: 'dem-s05-heading', type: 'heading', level: 1, text: 'Signs & Symptoms' },
            {
              id: 'dem-s05-image',
              type: 'image',
              src: '/assets/courses/alzheimers-dementia/s05-hero.jpg',
              caption: 'Recognizing the stages and signs of dementia.',
            },
            {
              id: 'dem-s05-narration',
              type: 'text',
              body: [
                'Recognizing the signs of dementia across its stages — and noticing changes — helps you understand your residents and give the right care. You\'re not diagnosing; you\'re understanding and reporting. Let\'s walk through it.',
                '**Early signs**',
                'Early dementia can be subtle. Watch for: memory loss, especially of recent events — repeating questions, forgetting conversations, misplacing things. Trouble finding words or following conversations. Confusion about time or place — getting dates or locations muddled. Difficulty with familiar tasks, planning, or decisions. Misjudging situations. Mood and personality shifts — becoming withdrawn, anxious, irritable, or not themselves. Losing track of belongings or getting lost in familiar places. In the early stage, the person often still functions fairly independently and may be aware something\'s wrong, which can be frightening for them. Meet that with reassurance and patience.',
                '**Middle-stage signs and behaviors**',
                'The middle stage usually brings more pronounced changes and the behaviors that challenge caregivers most. Greater memory loss — not recognizing familiar people, forgetting personal history. More confusion and disorientation. Needing more help with daily tasks — dressing, bathing, toileting. Wandering, and the risk of getting lost. Sundowning — more confusion and agitation in late afternoon and evening. Restlessness, repetitive actions, or pacing. Agitation, anxiety, suspicion, or resistance to care. Sleep changes. These behaviors are not the person being difficult — they\'re the disease, often expressing an unmet need, fear, or discomfort the person can\'t put into words. Your patient, calm response makes all the difference.',
                '**Late-stage signs**',
                'In late-stage dementia, the decline is profound, and care becomes deeply hands-on and tender. Watch for: severe memory loss — often not recognizing loved ones or surroundings. Loss of most or all ability to communicate with words, though feelings and responses to touch and tone remain. Full dependence for all daily care — eating, bathing, toileting, moving. Difficulty swallowing and eating. Loss of mobility, often becoming bedbound. Greater vulnerability to infections and other problems. Here, your gentle, attentive, dignified care — and your watchfulness for discomfort, pain, and medical changes they can\'t report — becomes everything. Connection through touch, voice, and presence still reaches them.',
                '**Changes to notice and report**',
                'Throughout, you are the one who notices change, and reporting it matters. Report: a sudden or rapid change in confusion or alertness — which can signal infection, pain, or another medical problem, not just dementia progressing. New or worsening agitation, distress, or behaviors. Signs of pain or illness they can\'t tell you — since people with dementia often can\'t report symptoms, you watch for them. Changes in eating, drinking, swallowing, sleeping, or mobility. New wandering or safety risks. Anything that seems "off" from their baseline. You don\'t diagnose what it means — you report the change so the team can assess. A sudden change especially is never just "the dementia" until that\'s been checked.',
                'The rule underneath it all: understand the stages, read behaviors as communication of unmet needs, and report changes — especially sudden ones — because a fast change is often a medical problem, not just the dementia.',
              ].join('\n\n'),
            },
            {
              id: 'dem-s05-callout',
              type: 'callout',
              variant: 'warning',
              title: 'A sudden change is NOT "just the dementia"',
              body: 'Dementia worsens slowly, over months and years — it does NOT cause a sudden overnight change. An abrupt increase in confusion, agitation, or drowsiness is a red flag for a medical problem — most often infection (like a UTI), but also pain, dehydration, or a medication issue. Report a sudden change promptly so it can be assessed. Never dismiss it as "just the dementia" until that\'s been checked.',
            },
          ]),
      },
      {
        slug: 's06-causes',
        title: 'Causes',
        sortOrder: 1,
        buildContent: () =>
          doc('Causes', [
            { id: 'dem-s06-heading', type: 'heading', level: 1, text: 'Causes' },
            {
              id: 'dem-s06-image',
              type: 'image',
              src: '/assets/courses/alzheimers-dementia/s06-hero.jpg',
              caption: 'Difficult behavior is communication of an unmet need.',
            },
            pendingAudio(
              'dem-s06-audio',
              'What Causes Dementia — and What Causes the Behaviors',
              '/assets/courses/alzheimers-dementia/s06-causes-podcast.mp3',
              [
                'What Causes Dementia — and What Causes the Behaviors',
                '',
                'There are really two "cause" questions a CNA benefits from understanding: what causes dementia itself, and — even more useful at the bedside — what causes the confusing or difficult behaviors that dementia brings.',
                '',
                'First, the disease. Dementia is caused by physical diseases that damage the brain. Alzheimer\'s disease, the most common cause, involves abnormal changes and damage that gradually destroy brain cells, starting in areas important for memory and spreading over time. Other causes include damage from strokes and reduced blood flow, and several other brain diseases. The key point for caregiving isn\'t the biology — it\'s the conclusion that flows from it: because dementia is a physical brain disease, the person\'s confusion, memory loss, and changed behavior are symptoms of illness, not choices, not stubbornness, and not normal aging. No amount of trying harder would let them remember; the brain itself has changed. This single understanding is the foundation of patient, compassionate care.',
                '',
                'Now the question that helps you most every shift: what causes the difficult behaviors — the agitation, the resistance, the wandering, the distress? The crucial insight from good dementia care is that these behaviors almost always have a cause and a meaning. They are the person\'s way of communicating an unmet need or distress that they can no longer put into words. Common causes include physical discomfort — pain, hunger, thirst, needing the toilet, being too hot or cold, or illness like an infection. Fear and confusion — not understanding what\'s happening, feeling lost, or being startled. Overstimulation — too much noise, activity, or chaos. Or understimulation — boredom and loneliness. Environmental triggers — unfamiliar settings, changes in routine, or rushed, forceful care. And sundowning, where fading light brings more confusion in the evening. When a resident becomes agitated or resistant, the skilled caregiver asks not "why are they misbehaving?" but "what are they trying to tell me? what do they need?"',
                '',
                'This reframing changes care completely. If a resident resists bathing, maybe they\'re cold, frightened, in pain, or feeling rushed and undignified — and slowing down, warming the room, explaining gently, and offering choice may dissolve the resistance. If a resident wanders, maybe they\'re searching, restless, bored, or needing the toilet — and meeting that need calms them. If evenings bring agitation, a calming routine and softer environment can ease it. The behaviors aren\'t random and aren\'t the person being difficult; they\'re signals. The takeaway: dementia is a brain disease, so its symptoms are never the person\'s fault or choice; and the difficult behaviors are communication of unmet needs — so the caregiver who looks for the need behind the behavior, instead of just reacting to it, gives far better care and prevents much distress.',
              ].join('\n'),
              '/assets/courses/alzheimers-dementia/s06-causes-podcast.mp3',
            ),
          ]),
      },
      {
        slug: 's07-medications',
        title: 'Your Care Is the Treatment',
        sortOrder: 2,
        buildContent: () =>
          doc('Your Care Is the Treatment', [
            { id: 'dem-s07-heading', type: 'heading', level: 1, text: 'Your Care Is the Treatment' },
            {
              id: 'dem-s07-image',
              type: 'image',
              src: '/assets/courses/alzheimers-dementia/s07-hero.jpg',
              caption: 'Look for the need behind the behavior, not a problem to manage.',
            },
            {
              id: 'dem-s07-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of practice',
              body: 'There is no cure for dementia; medications and medical management belong to the team. A CNA does not diagnose dementia, does not stage it medically, and does not manage or give judgments about medications. The CNA delivers the person-centered daily care that is, truly, the heart of dementia care — and reports changes.',
            },
            {
              id: 'dem-s07-narration',
              type: 'text',
              body: [
                'There is no cure for dementia, and medications can only do so much — which means the most powerful "treatment" a person with dementia receives is the daily care of the people around them. That care is yours to give, and done well it transforms their days. The scope first: a CNA does not diagnose dementia, does not stage it medically, and does not manage or give judgments about medications — but the CNA delivers the person-centered care that is, truly, the heart of dementia care.',
                '**Person-centered care — see the individual.** Everything starts here. Know your resident as a person — their history, name, preferences, routines, what comforts and what upsets them — and care for that individual, not a diagnosis. Use their preferred name, honor their habits, bring in what they love — familiar music, objects, topics. Person-centered care isn\'t a technique you add on; it\'s the lens for everything, and it\'s what makes a resident feel seen and safe rather than processed.',
                '**Connect, don\'t correct — meet their reality.** When a resident is confused or believes something untrue, don\'t argue, quiz, or force harsh reality on them — it only causes distress and damages trust. Instead, respond to the feeling beneath the words, reassure, and gently redirect. If they\'re looking for a long-gone spouse, you might acknowledge the love and ease them toward something comforting, rather than delivering painful news again and again. Meeting them in their reality, with warmth, calms and connects. Connect, don\'t correct — this single habit prevents enormous suffering.',
                '**Look for the need behind the behavior.** When a resident is agitated, resistant, or distressed, don\'t just react to the behavior — ask what it\'s telling you. Are they in pain, hungry, thirsty, needing the toilet, too hot or cold, frightened, overstimulated, bored, or rushed? Find and meet the need, and the behavior often eases on its own. This is the most practical skill in dementia care: behaviors are communication, and the caregiver who answers the message instead of fighting the behavior gives better care and prevents distress. (The deeper de-escalation method, you\'ll study in its own course.)',
                '**Calm, patient, consistent daily care.** Build your care on calm and routine. Keep familiar patterns. Approach gently, from the front, with a warm voice. Go slowly — never rush, because rushing breeds fear and resistance. Break tasks into one simple step at a time, offer simple choices, and let the resident do what they can. Use a soothing environment, reduce noise and chaos, and anticipate hard times like sundowning with calming routines. Your steady, unhurried calm is contagious — it settles the resident as much as anything you say.',
                '**Safety, dignity, comfort, and reporting.** Keep them safe — prevent wandering into danger, guard against falls and hazards, supervise with as much freedom as is safe. Protect dignity always — privacy, respect, gentleness, never talking down. Tend comfort — watch for pain and illness they can\'t report, and meet physical needs. And report changes, especially sudden ones, since a fast change often signals a treatable medical problem, not just the dementia. You deliver the care; you watch for what the team needs to know.',
                'The scope point: you don\'t diagnose, stage, or manage medications — but you provide person-centered care, connect rather than correct, find the need behind the behavior, give calm and dignified daily care, keep residents safe, and report changes. That care is the truest treatment dementia has.',
              ].join('\n\n'),
            },
            {
              id: 'dem-s07-callout',
              type: 'callout',
              variant: 'warning',
              title: 'Behavior is communication',
              body: 'Ask "what do they need?" not "why are they difficult?" Never argue with their reality — connect, don\'t correct. Never force care roughly or use improper restraint. Never talk down. And never dismiss a sudden change as "just the dementia" — it\'s often a treatable medical problem. Report it.',
            },
          ]),
      },
      {
        slug: 's08-prevention',
        title: 'Prevention',
        sortOrder: 3,
        buildContent: () =>
          doc('Prevention', [
            { id: 'dem-s08-heading', type: 'heading', level: 1, text: 'Prevention' },
            {
              id: 'dem-s08-image',
              type: 'image',
              src: '/assets/courses/alzheimers-dementia/s08-hero.jpg',
              caption: 'A calm voice and gentle approach prevent much distress.',
            },
            {
              id: 'dem-s08-narration',
              type: 'text',
              body: [
                'With dementia, your prevention work is about preventing distress, difficult moments, and harm — and protecting wellbeing and dignity. Here are seven ways.',
                '**One. Know the person — and use it.** The best prevention of distress is knowing your resident: their history, preferences, routines, what calms them and what sets them off. When you know that loud noise frightens them or that a certain song soothes them, you can prevent upset before it starts. Person-centered knowledge is your most powerful preventive tool — it lets you shape care around the individual.',
                '**Two. Keep calm, routine, and consistency.** Familiar routines and a calm, predictable environment prevent confusion and anxiety. Keep daily patterns consistent, reduce sudden changes, and bring a steady, unhurried manner to every interaction. Much agitation grows from chaos, rush, and unpredictability — so calm and routine quietly prevent a great deal of distress before it can build.',
                '**Three. Look for unmet needs early.** Since behaviors come from unmet needs, prevent them by meeting needs proactively — offer the toilet regularly, ensure they\'re fed, hydrated, comfortable, warm enough, and not in pain. Anticipate hunger, thirst, and toileting rather than waiting for distress to signal them. Meeting needs before they become urgent prevents much of the agitation and resistance you\'d otherwise face.',
                '**Four. Communicate to connect, not correct.** Prevent distress through how you speak: calm tone, simple words, eye contact, patience, and meeting their reality instead of arguing with it. Never quiz, rush, or harshly correct. Good communication prevents the fear and frustration that fuel difficult behaviors — and connection itself soothes. Connect, don\'t correct, every interaction.',
                '**Five. Anticipate hard times like sundowning.** Plan ahead for predictable rough patches — especially the late-afternoon and evening agitation of sundowning. Build calming routines into those times, reduce noise and stimulation, ensure comfort, and bring extra patience. Anticipating and softening the hard hours, rather than being caught off guard, prevents much distress for the resident and a much harder time for you.',
                '**Six. Keep the environment safe.** Prevent harm by making the space safe: reduce fall hazards, secure dangerous items and unsafe exits to prevent harmful wandering, ensure good lighting, and supervise appropriately — all while allowing as much safe freedom as possible. Thoughtful safety prevents the falls, wandering, and accidents that dementia\'s loss of judgment makes likely. Safety planning is harm prevention.',
                '**Seven. Protect dignity and report changes.** Prevent humiliation by always protecting dignity — privacy, respect, choices, gentleness. And prevent serious problems by watching for and reporting changes, especially sudden ones, since a fast change often means a treatable medical issue caught early. Guarding dignity prevents suffering of the spirit; reporting changes prevents medical problems from being missed. Both are prevention that matters.',
              ].join('\n\n'),
            },
          ]),
      },
    ],
  },
  {
    slug: 'module-3',
    title: 'Responding, Your Role, and Application',
    sortOrder: 2,
    lessons: [
      {
        slug: 's09-emergency',
        title: 'Sudden Change & Responding to Distress',
        sortOrder: 0,
        buildContent: () =>
          doc('Sudden Change & Responding to Distress', [
            {
              id: 'dem-s09-heading',
              type: 'heading',
              level: 1,
              text: 'Sudden Change & Responding to Distress',
            },
            pendingAudio(
              'dem-s09-intro-audio',
              'Recognizing sudden change and meeting distress with calm — intro',
              '/assets/courses/alzheimers-dementia/s09-emergency-intro.mp3',
              'In dementia care, two judgments matter enormously: recognizing when a sudden change is a medical problem rather than "just the dementia," and responding to a distressed resident by finding the need behind the behavior instead of forcing or fighting. You\'re about to work through two situations. Read each carefully, choose your action, and you\'ll get feedback right away. Keep the core ideas in mind: a sudden change in a dementia resident is reported as possibly medical, and a resident in distress is communicating a need — meet it with calm, not force.',
              '/assets/courses/alzheimers-dementia/s09-emergency-intro.mp3',
            ),
            {
              id: 'dem-s09-image',
              type: 'image',
              src: '/assets/courses/alzheimers-dementia/s09-hero.jpg',
              caption: 'A sudden change in a dementia resident is reported as possibly medical.',
            },
            {
              id: 'dem-s09-scenario-sudden-image',
              type: 'image',
              src: '/assets/courses/alzheimers-dementia/s09-scenario-sudden.jpg',
              caption: 'A fast change is rarely "just the dementia" — report it.',
            },
            {
              id: 'dem-s09-scenario-sudden',
              type: 'scenario_question',
              prompt:
                'Mr. Abernathy has moderate dementia but is usually calm, knows his routine, and recognizes you. Today he\'s suddenly much more confused than normal, agitated, drowsy in between, not making his usual sense, and seems "off." A coworker shrugs and says, "That\'s just his dementia getting worse — it happens. Nothing to do about it." What SHOULD the CNA do?',
              options: [
                {
                  id: 'do-nothing',
                  label: 'Agree it\'s just his dementia worsening and do nothing',
                  feedback:
                    'Dementia worsens slowly over months and years — it does NOT cause a sudden overnight change. An abrupt increase in confusion, agitation, or drowsiness in a dementia resident is a red flag for a medical problem, most often infection (like a UTI), but also pain, dehydration, or medication issues. "Just his dementia" can let a treatable, dangerous problem go missed. The right action: report the sudden change to the nurse promptly so he can be assessed.',
                },
                {
                  id: 'report-change',
                  label: 'Report the sudden change to the nurse — a fast change in a dementia resident is often a medical problem like infection, not just the dementia',
                  feedback:
                    'Exactly right — and this is one of the most important judgments in dementia care. Dementia itself progresses slowly, over months and years — it does not cause a sudden, dramatic change overnight. So when a dementia resident becomes abruptly more confused, agitated, drowsy, or "off" compared to their normal, that sudden change is a red flag for a medical problem, not just the dementia getting worse. The most common cause is infection — a urinary tract infection or other infection can cause exactly this picture in someone with dementia — but it can also be pain, dehydration, a medication issue, or another illness. "That\'s just his dementia" is a dangerous assumption that can let a treatable, even life-threatening problem go unnoticed. The right action is to report the sudden change to the nurse promptly, describing how he differs from his baseline, so he can be assessed. You\'re not diagnosing the cause; you\'re flagging that something changed fast and needs a medical look. Remember the rule: a sudden change in a dementia resident is never "just the dementia" until that\'s been checked.',
                  isRecommended: true,
                },
                {
                  id: 'wait-week',
                  label: 'Wait a week to see if he goes back to normal',
                  feedback:
                    'Waiting a week could let a treatable, even dangerous problem go missed. A sudden change in a dementia resident — abrupt confusion, agitation, drowsiness — is a red flag for a medical problem like infection (often a UTI), not the dementia, which worsens slowly over months and years. The right action: report the sudden change to the nurse promptly so he can be assessed.',
                },
                {
                  id: 'argue',
                  label: 'Try to argue him back into making sense',
                  feedback:
                    'Arguing won\'t help and ignores the real issue: this is a sudden change, which in a dementia resident is a red flag for a medical problem like infection (often a UTI), pain, or dehydration — not just the dementia. The right action: report the sudden change to the nurse promptly so he can be assessed, describing how he differs from his baseline.',
                },
              ],
              requiredForCompletion: true,
            },
            {
              id: 'dem-s09-scenario-need-image',
              type: 'image',
              src: '/assets/courses/alzheimers-dementia/s09-scenario-need.jpg',
              caption: 'A distressed resident is communicating a need — meet it with calm, not force.',
            },
            {
              id: 'dem-s09-scenario-need',
              type: 'scenario_question',
              prompt:
                'Mrs. Castellano has dementia and is becoming agitated and resistant during her afternoon care — pushing your hands away, looking distressed, and saying she "wants to go home." A coworker says, "Just hold her arms and get it done quickly, and tell her she IS home and to stop being difficult." What SHOULD the CNA do?',
              options: [
                {
                  id: 'force',
                  label: 'Hold her arms and force the care quickly to get it over with',
                  feedback:
                    'Forcing care by holding her arms would frighten and possibly hurt her, deepen her distress, break trust, and could be a form of rough or improper restraint — never acceptable. Her resistance is communication, not "being difficult." The right approach: stop, stay calm, find the need or fear behind the behavior, reassure her, meet her reality gently, and try again without force.',
                },
                {
                  id: 'correct',
                  label: 'Tell her firmly she IS home and that she\'s being difficult',
                  feedback:
                    'Bluntly correcting her reality — "you ARE home, stop being difficult" — only argues with her and increases her fear. Remember: connect, don\'t correct. Her "wanting to go home" often expresses a longing for safety, not a literal place. The right approach: stop, stay calm, find the need or fear behind the behavior, reassure her, meet her reality gently, and try again without force.',
                },
                {
                  id: 'connect',
                  label: 'Stop, stay calm, look for what she needs or fears, reassure her, meet her reality gently, and try again without force',
                  feedback:
                    'Right — and this response reflects the deepest skills in dementia care. Mrs. Castellano\'s agitation and resistance are not her "being difficult" — they\'re communication. Something is wrong: she may feel rushed, frightened, in pain, cold, undignified, or overwhelmed, and "wanting to go home" often expresses a longing for safety and comfort rather than a literal place. Forcing care by holding her arms would frighten and possibly hurt her, deepen her distress, break trust, and could even be a form of rough or improper restraint — never acceptable. And bluntly correcting her — "you ARE home, stop being difficult" — only argues with her reality and increases her fear; remember, connect, don\'t correct. The right approach is to stop, stay calm, and look for the need or fear behind the behavior: soften your voice, reassure her, respond to the feeling ("you\'re safe, I\'m here with you"), reduce the rush and noise, offer comfort and simple choices, and try the care again gently, in steps, without force — or come back in a little while if she needs time. Meeting her reality and her need, with calm instead of force, is both kinder and far more effective. (You\'ll learn the full de-escalation approach in its own course.) Note the other trap too: leaving her with no care at all isn\'t the answer either — the goal is to provide the care gently, on her terms.',
                  isRecommended: true,
                },
                {
                  id: 'abandon',
                  label: 'Leave her completely without any care for the day',
                  feedback:
                    'Leaving her with no care at all isn\'t the answer — the goal is to provide the care gently, on her terms. Her resistance is communication (she may feel rushed, frightened, in pain, or overwhelmed), not "being difficult." The right approach: stop, stay calm, find the need or fear behind the behavior, reassure her, meet her reality gently, and try again without force.',
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
            { id: 'dem-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
              id: 'dem-s10-video',
              type: 'video',
              title: "CNA's Role in Care",
              videoUrl: '/assets/courses/alzheimers-dementia/s10-cna-role.mp4',
              placeholderNote: 'Pending upload: /assets/courses/alzheimers-dementia/s10-cna-role.mp4',
            },
            {
              id: 'dem-s10-image',
              type: 'image',
              src: '/assets/courses/alzheimers-dementia/s10-hero.jpg',
              caption: 'The CNA is the bridge to a safe, comfortable, dignified life.',
            },
            {
              id: 'dem-s10-narration',
              type: 'text',
              body: [
                'Your role with residents who have dementia is to be their bridge — to safety, comfort, communication, dignity, and connection. Let\'s walk through it.',
                '**See and know the person.** Above all, see the person, not the disease. Know your residents as individuals — their history, names, preferences, what comforts and what upsets them — and let that knowledge shape every interaction. Use person-centered care as your constant lens, bringing in what they love and honoring who they are. When a resident feels truly seen and known, even through the fog of dementia, they feel safe — and that safety is the foundation of everything else you do.',
                '**Communicate and connect.** Be the one who reaches them. Approach calmly, speak gently and simply, make eye contact, use warmth in your tone and body. Meet their reality rather than correcting it — respond to feelings, reassure, gently redirect. Connect, don\'t correct. And read their behaviors as communication, looking for the need or fear behind agitation or resistance, then meeting it with calm instead of force. Your skilled, patient connection prevents distress and brings comfort words alone can\'t.',
                '**Provide calm, dignified daily care.** Deliver daily care with patience, routine, and respect. Go slowly, never rushing; break tasks into simple steps; offer choices; let them do what they can. Keep familiar routines, anticipate hard times like sundowning, and create calm around care. And protect dignity in everything — privacy, gentleness, never talking down, always treating them as the full adult they are. Care done this way turns daily tasks into moments of cooperation, comfort, and sometimes real connection.',
                '**Keep them safe and report changes.** Be their guardian. Keep them safe from wandering into danger, from falls and hazards — supervising closely while allowing as much safe freedom as possible. Watch for pain, illness, and discomfort they can\'t report, and tend their comfort. And report changes, especially sudden ones, since a fast change often means a treatable medical problem, not just the dementia. You protect their body and flag what the team needs to know.',
                'Now the boundary. You do not diagnose dementia. You do not stage it medically. You do not manage or make judgments about medications. And you never force care roughly, never argue harshly with their reality, never talk down to them, and never dismiss a sudden change as "just the dementia." Those lines protect the resident.',
                'Inside your role — seeing the person, connecting, caring with patience and dignity, keeping them safe, and reporting changes — you become the bridge between a person with dementia and a life that still holds comfort, safety, and moments of joy. Few residents depend on a caregiver as completely, and few caregivers have the chance to mean as much. See the person, protect their dignity — that is the heart of this work.',
              ].join('\n\n'),
            },
            {
              id: 'dem-s10-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Stay within scope',
              body: 'You do not diagnose dementia, do not stage it medically, and do not manage or judge medications — those belong to the team. You never force care roughly, argue harshly with their reality, talk down, or dismiss a sudden change as "just the dementia." You provide person-centered care, connect, meet needs, keep residents safe, protect dignity, and report changes.',
            },
          ]),
      },
      {
        slug: 's11-case-study',
        title: 'Brief Case Study',
        sortOrder: 2,
        buildContent: () => {
          const caseNarrative = [
            'Mrs. Castellano, 81, had moderate Alzheimer\'s disease. She had been, in her earlier life, a schoolteacher and a mother of four — warm, capable, beloved — though the disease had taken much of her recent memory and often left her confused about where and when she was. On the unit she was sometimes calm and sometimes distressed, and her afternoons could be hard. Her CNA, Daniel, had taken the dementia training to heart, and he approached her not as a difficult resident but as the whole person she still was.',
            '',
            '**The hard afternoon:** One afternoon, as Daniel began helping Mrs. Castellano with her care, she grew agitated and resistant — pushing his hands away, her face tight with distress, repeating that she "wanted to go home" and needed to "get the children from school." A coworker passing by offered the old, easy approach: "Just hold her arms and get it done fast, and tell her she lives here now and to stop fighting you." Daniel knew that path would frighten her, possibly hurt her, and break the trust between them — and that arguing with her reality would only deepen her fear.',
            '',
            '**Connect, don\'t correct:** So Daniel stopped. He stepped back, softened his voice, and got down to her eye level with a warm, calm presence. He didn\'t argue that she was home, or tell her the children were grown — that would only have confused and saddened her. Instead, he met her reality and her feeling: "You\'re a wonderful mother, taking care of your children. They\'re safe right now — they\'re being looked after. You can rest a little." He reassured the emotion beneath her words — her love, her sense of duty, her need to feel safe — rather than correcting the facts. Her face began to ease.',
            '',
            '**The need behind the behavior:** Daniel also asked himself what she needed. He noticed she seemed cold and the room was noisy and busy. He warmed her with a blanket she liked, reduced the noise, and slowed everything down. He realized the rushed approach to her care had been part of what frightened her. With her calmer and reassured, he offered simple choices and broke the care into small, gentle steps, telling her warmly what he was doing as he went — and this time, with her fear met and her dignity intact, she allowed her care without a struggle. The agitation had been communication: she\'d been frightened, rushed, and cold, longing for safety. Daniel had answered the message instead of fighting the behavior.',
            '',
            '**The change he caught:** A few days later, Daniel noticed something different — Mrs. Castellano was suddenly far more confused than her normal, drowsy, and not herself, a sharp change from her baseline. He didn\'t shrug it off as "her dementia getting worse." Knowing that dementia worsens slowly and that a sudden change usually means a medical problem, he reported it to the nurse right away. She was found to have a urinary tract infection — caught early because Daniel knew that a fast change is never "just the dementia." Treated, she returned to her usual self.',
            '',
            '**The outcome:** Mrs. Castellano\'s hard afternoons grew fewer, because Daniel and the team learned her triggers and her comforts and shaped her care around the person she was. She was never forced, never talked down to, never treated as a problem to be managed. And when illness struck beneath the dementia, it was caught fast because someone was watching the person closely enough to notice. The charge nurse said it well: "Daniel never sees \'a dementia patient.\' He sees Mrs. Castellano — the teacher, the mother — and he cares for her. That\'s why she\'s calmer, safer, and was caught when she got sick. That\'s the whole job."',
          ].join('\n');

          return doc('Brief Case Study', [
            { id: 'dem-s11-heading', type: 'heading', level: 1, text: 'Brief Case Study' },
            pendingAudio(
              'dem-s11-audio',
              'The Woman Who Wanted to Go Home',
              '/assets/courses/alzheimers-dementia/s11-case-podcast.mp3',
              caseNarrative,
              '/assets/courses/alzheimers-dementia/s11-case-podcast.mp3',
            ),
            {
              id: 'dem-s11-image',
              type: 'image',
              src: '/assets/courses/alzheimers-dementia/s11-hero.jpg',
              caption: 'Connect, don\'t correct — meet the person where they are.',
            },
            {
              id: 'dem-s11-case-study',
              type: 'case_study',
              title: 'The Woman Who Wanted to Go Home',
              residentProfile:
                'Mrs. Castellano, 81, with moderate Alzheimer\'s disease. In her earlier life a schoolteacher and mother of four — warm, capable, beloved — though the disease had taken much of her recent memory and often left her confused about where and when she was. Her afternoons could be hard. Her CNA, Daniel, approached her not as a difficult resident but as the whole person she still was.',
              scenario: [
                '**The hard afternoon:** As Daniel began her care, Mrs. Castellano grew agitated and resistant — pushing his hands away, distressed, repeating that she "wanted to go home" and needed to "get the children from school." A coworker offered the old, easy approach: "Hold her arms, get it done fast, and tell her she lives here now and to stop fighting you." Daniel knew that path would frighten her, possibly hurt her, break trust — and that arguing with her reality would only deepen her fear.',
                '**Connect, don\'t correct:** So Daniel stopped. He softened his voice and got to her eye level, warm and calm. He didn\'t argue that she was home or tell her the children were grown — that would only confuse and sadden her. He met her reality and her feeling: "You\'re a wonderful mother, taking care of your children. They\'re safe right now — they\'re being looked after. You can rest a little." He reassured the emotion beneath her words — her love, her duty, her need to feel safe. Her face began to ease.',
                '**The need behind the behavior:** Daniel asked what she needed. He noticed she seemed cold and the room was noisy and busy. He warmed her with a blanket she liked, reduced the noise, slowed everything down, and realized the rushed approach had frightened her. With her calmer, he offered simple choices and broke the care into small, gentle steps, telling her warmly what he was doing — and this time, fear met and dignity intact, she allowed her care without a struggle. The agitation had been communication: frightened, rushed, cold, longing for safety. Daniel answered the message instead of fighting the behavior.',
                '**The change he caught:** A few days later, Mrs. Castellano was suddenly far more confused than normal, drowsy, not herself — a sharp change from baseline. Daniel didn\'t shrug it off as "her dementia getting worse." Knowing dementia worsens slowly and a sudden change usually means a medical problem, he reported it right away. She had a urinary tract infection — caught early because he knew a fast change is never "just the dementia." Treated, she returned to her usual self.',
                '**The outcome:** Her hard afternoons grew fewer, because Daniel and the team learned her triggers and comforts and shaped her care around the person she was — never forced, never talked down to, never treated as a problem. And when illness struck beneath the dementia, it was caught fast. The charge nurse said it well: "Daniel never sees \'a dementia patient.\' He sees Mrs. Castellano — the teacher, the mother — and he cares for her. That\'s why she\'s calmer, safer, and was caught when she got sick. That\'s the whole job."',
              ].join('\n\n'),
            },
            {
              id: 'dem-s11-reflection-1',
              type: 'reflection',
              prompt:
                'When Mrs. Castellano was distressed and "wanted to go home," Daniel met her reality instead of correcting her, and looked for the need behind her behavior. Why is "connect, don\'t correct" better than forcing care or arguing the facts, and what needs was she actually communicating?',
              minCharacters: 50,
            },
            {
              id: 'dem-s11-reflection-2',
              type: 'reflection',
              prompt:
                'Daniel reported Mrs. Castellano\'s sudden increase in confusion rather than assuming her dementia was simply worsening. Why is a sudden change in a dementia resident treated as a possible medical problem, and what was the actual cause in her case?',
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
            { id: 'dem-s12-heading', type: 'heading', level: 1, text: 'Conclusion' },
            {
              id: 'dem-s12-video',
              type: 'video',
              title: 'Conclusion',
              videoUrl: '/assets/courses/alzheimers-dementia/s12-conclusion.mp4',
              placeholderNote: 'Pending upload: /assets/courses/alzheimers-dementia/s12-conclusion.mp4',
            },
            {
              id: 'dem-s12-image',
              type: 'image',
              src: '/assets/courses/alzheimers-dementia/s12-hero.jpg',
              caption: 'See the person, not the diagnosis — that is the whole job.',
            },
            {
              id: 'dem-s12-narration',
              type: 'text',
              body: [
                'You\'ve reached the end. Let\'s lock in the five things that matter most about Alzheimer\'s and dementia care.',
                '**One.** Dementia is a brain disease, not normal aging and not a choice. Alzheimer\'s is its most common cause — a progressive disease that slowly takes memory and thinking. The confusion, repeated questions, and difficult behaviors are symptoms of illness, never the person being stubborn or difficult. Understanding this turns frustration into patience.',
                '**Two.** The person is still there. Behind the disease is a whole human being — a life, a personality, feelings, and dignity the disease can\'t erase. They can still feel respected or humiliated, comforted or frightened, loved or dismissed. See the person, not just the diagnosis, in everything you do. That is the heart of this work.',
                '**Three.** Connect, don\'t correct — and find the need behind the behavior. Meet residents in their reality with calm and warmth instead of arguing or forcing. And read agitation and resistance as communication of an unmet need — pain, fear, hunger, toileting, cold, overwhelm — then meet that need. Behavior is a message; answer it, don\'t fight it.',
                '**Four.** Care with patience, routine, safety, and dignity. Go slowly, keep familiar routines, offer choices, let residents do what they can, and anticipate hard times like sundowning. Keep them safe from wandering and falls. And protect dignity always — privacy, respect, gentleness, never talking down. Safety keeps them alive; dignity keeps them human.',
                '**Five.** Report changes — and know your scope. A sudden change is often a treatable medical problem like an infection, not just the dementia worsening, so report it promptly. You never diagnose, stage, or manage medications — but you provide person-centered care, connect, meet needs, keep residents safe, protect dignity, and report changes. You are the bridge to a safe, comfortable, dignified life.',

                'This course provides one hour of continuing education through CAL ACE Nursing Academy (CDPH Provider NAC #7384). Your certificate is generated automatically when you pass the knowledge check.',
                'Ten questions are waiting. Everything on them was covered here. You\'re ready. Trust what you\'ve learned, and show what you know.',
              ].join('\n\n'),
            },
            {
              id: 'dem-s12-summary',
              type: 'summary',
              title: 'Five things that matter most',
              items: [
                'Dementia is a brain disease — not normal aging, not a choice. Alzheimer\'s is its most common cause. The confusion and difficult behaviors are symptoms of illness, never the person being stubborn.',
                'The person is still there — a life, a personality, feelings, and dignity the disease can\'t erase. They can still feel respected or humiliated, comforted or frightened. See the person, not just the diagnosis.',
                'Connect, don\'t correct — and find the need behind the behavior. Meet residents in their reality with calm; read agitation as communication of an unmet need (pain, fear, hunger, toileting, cold) and meet it.',
                'Care with patience, routine, safety, and dignity. Go slowly, keep routines, offer choices, anticipate sundowning, prevent wandering and falls, and never talk down. Safety keeps them alive; dignity keeps them human.',
                'Report changes — a sudden change is often a treatable medical problem, not just the dementia. Know your scope: you never diagnose, stage, or manage medications; you provide person-centered care and report.',
              ],
            },
          ]),
      },
    ],
  },
];

export async function seedCourse07AlzheimersDementia(
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
      label: 'V3 rebuild — Alzheimer\'s disease & dementia (person-centered care)',
      status: CourseVersionStatus.DRAFT,
      deliveryMode: DeliveryMode.ONLINE,
      ceHours,
      publishedAt: null,
      contentMeta: contentMeta as Prisma.InputJsonValue,
    },
    update: {
      label: 'V3 rebuild — Alzheimer\'s disease & dementia (person-centered care)',
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
    `Seeding Course 7 (Alzheimer's & Dementia) as DRAFT — slug "${COURSE_SLUG}", version ${VERSION_NUMBER}…`,
  );

  try {
    const result = await seedCourse07AlzheimersDementia(prisma);
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
