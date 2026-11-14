/**
 * Seed Course 49 — Hearing Impairment & Deaf Residents (DRAFT).
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-49-hearing-impairment
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
const COURSE_SLUG = 'hearing-impairment';
const COURSE_TITLE = 'Hearing Loss Support and Communication Access';
const COURSE_SUMMARY =
  'Learn the CNA\'s role in supporting residents with hearing loss and Deaf residents — understanding age-related and other hearing loss, communicating effectively (face the resident, clear not shouted speech), hearing-aid care and basic troubleshooting, recognizing how hearing loss masquerades as confusion/"non-compliance"/withdrawal, Deaf-culture awareness, supporting safety and connection, and recognizing ear problems and sudden hearing loss as concerns. CNAs do NOT diagnose, treat ears, remove earwax, give ear medications beyond facility policy/training, or perform ear procedures.';

const ASSET_BASE = `/assets/courses/hearing-impairment`;

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
    'Understand hearing loss and its effects.',
    'Communicate effectively with hearing-impaired and Deaf residents.',
    'Care for hearing aids.',
    'Recognize hearing loss mistaken for confusion.',
    'Support safety and connection.',
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
  heroImage: '/assets/courses/hearing-impairment/hero-banner.png',
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
    title: 'Understanding Hearing Impairment & Deaf Residents',
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: 'Introduction',
        sortOrder: 0,
        buildContent: () =>
          doc('Welcome', [
            { id: 'hir-s01-heading', type: 'heading', level: 1, text: 'Welcome' },
            {
              id: 'hir-s01-video',
              type: 'video',
              title: 'Introduction',
              videoUrl: '/assets/courses/hearing-impairment/s01-intro.mp4',
              placeholderNote: 'Pending upload: /assets/courses/hearing-impairment/s01-intro.mp4',
            },
            {
              id: 'hir-s01-image',
              type: 'image',
              src: `${ASSET_BASE}/s01-hero.png`,
              caption:
                'Hearing loss support — clear communication that keeps residents connected and understood.',
            },
            {
              id: 'hir-s01-narration',
              type: 'text',
              body: [
                'Welcome to CAL ACE Nursing Academy.',
                'This course is about hearing impairment and Deaf residents — and it completes our series on the senses. Hearing loss is one of the most common conditions of aging, and one of the most misunderstood — because its effects are constantly mistaken for something else, and because how a CNA communicates can either include a resident in the world or quietly shut them out of it.',
                'Let\'s start with how common, and how consequential, this is. Hearing declines with age — the gradual, age-related hearing loss called presbycusis affects a huge share of older adults, and many of your residents will have significant hearing loss, some profound, some Deaf. Hearing loss makes it hard to follow conversation, hear instructions, catch alarms and warnings, and connect with people. And here is the most important thing to understand: untreated hearing loss is strongly linked to isolation, loneliness, depression, and even to being mistaken for cognitive decline. A resident who can\'t hear is at risk of being cut off from the world — and of being misjudged.',
                'That misjudgment is the heart of why this course matters. Hearing loss is constantly mistaken for other things. A resident who doesn\'t respond is called "confused" or "demented" — when they simply didn\'t hear. A resident who doesn\'t follow instructions is called "non-compliant" or "difficult" — when they never heard the instruction. A resident who\'s withdrawn and quiet is thought to be depressed or declining — when they\'ve pulled back because they can\'t follow what\'s being said. These mislabels are common, and they\'re harmful. Recognizing that hearing loss may be the real cause — not confusion, not stubbornness — changes everything about how you treat that resident.',
                'This course teaches the practical skills that make the difference: how to communicate effectively with someone who has hearing loss — facing them, getting their attention, speaking clearly rather than shouting. How to care for hearing aids and troubleshoot the simple problems that leave them useless. How to support Deaf residents, who may use sign language and have their own language and culture. How to keep hearing-impaired residents safe, since they may not hear alarms or warnings. And how to keep them connected, because connection is what hearing loss most threatens.',
                'The guiding spirit, much like vision care: communication is the care. For a resident with hearing loss, your patience and skill in making yourself understood — and in understanding them — is not a nicety. It\'s the core of including them in their own care and their own life.',
                'Your scope is clear. A CNA communicates effectively, cares for hearing aids, recognizes hearing loss behind mislabels, supports safety and connection, respects Deaf residents, and reports ear problems and changes. A CNA does not diagnose, does not treat ears or remove earwax, does not give ear medications beyond facility policy and training, and does not perform ear procedures.',
                'By the end of this course, you will be able to: understand hearing loss and its effects. Communicate effectively with hearing-impaired and Deaf residents. Care for hearing aids. Recognize hearing loss mistaken for confusion. And support safety and connection. Let\'s begin.',
              ].join('\n\n'),
            },
            {
              id: 'hir-s01-ci-text',
              type: 'text',
              body: [
                'This course teaches the CNA\'s role in supporting residents with hearing loss and Deaf residents — understanding age-related and other hearing loss, communicating effectively, hearing-aid care and basic troubleshooting, recognizing how hearing loss masquerades as confusion/"non-compliance"/withdrawal, Deaf-culture awareness, supporting safety and connection, and recognizing ear problems and sudden hearing loss as concerns.',
                'Let\'s be clear about your role. A CNA communicates effectively, cares for hearing aids, recognizes hearing loss behind mislabels, supports safety and connection, respects Deaf residents, and reports ear problems and changes. A CNA does not diagnose, does not treat ears or remove earwax, does not give ear medications beyond facility policy and training, and does not perform ear procedures. Those are nursing and hearing-professional tasks. But none of them can happen without your skilled communication and faithful reporting first.',
              ].join('\n\n'),
            },
            {
              id: 'hir-s01-ci-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of this course',
              body: 'CNAs COMMUNICATE, CARE FOR AIDS, RECOGNIZE MISLABELS, and REPORT. CNAs do not diagnose hearing loss, treat ears, remove earwax, give ear medications beyond facility policy/training, or perform ear procedures.',
            },
            {
              id: 'hir-s01-lo-text',
              type: 'text',
              body: 'By the end of this course, you will be able to:',
            },
            {
              id: 'hir-s01-lo-summary',
              type: 'summary',
              title: 'Learning objectives',
              items: [
                'Understand hearing loss and its effects.',
                'Communicate effectively with hearing-impaired and Deaf residents.',
                'Care for hearing aids.',
                'Recognize hearing loss mistaken for confusion.',
                'Support safety and connection.',
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
            { id: 'hir-s02-heading', type: 'heading', level: 1, text: 'Key terms' },
            {
              id: 'hir-s02-image',
              type: 'image',
              src: `${ASSET_BASE}/s02-hero.png`,
              caption:
                'Key terms — hearing loss, hearing aid, communication access, assistive devices.',
            },
            {
              id: 'hir-s02-reveal-hearing-loss',
              type: 'reveal_card',
              frontTitle: 'Hearing Impairment / Hearing Loss',
              frontBody: 'Hearing impairment',
              backTitle: 'Hearing Impairment / Hearing Loss',
              backBody:
                'Reduced ability to hear — ranging from mild difficulty following conversation, to severe loss, to profound deafness. It can affect one or both ears, and may make speech sound muffled, make high-pitched sounds hard to catch, or make it hard to hear in noisy places. Most older adults with hearing loss have some usable hearing.',
            },
            {
              id: 'hir-s02-reveal-presbycusis',
              type: 'reveal_card',
              frontTitle: 'Presbycusis',
              frontBody: 'Prez-bih-KYOO-sis',
              backTitle: 'Presbycusis',
              backBody:
                'Age-related hearing loss — the gradual loss of hearing that comes with aging, very common in older adults. It often affects high-pitched sounds first, making certain consonants and voices hard to distinguish, so speech sounds present but unclear — "I can hear you, I just can\'t understand you."',
            },
            {
              id: 'hir-s02-reveal-deaf-culture',
              type: 'reveal_card',
              frontTitle: 'Deaf / Deaf Culture',
              frontBody: 'Deaf',
              backTitle: 'Deaf / Deaf Culture',
              backBody:
                'With a capital D, "Deaf" refers to people who are part of a cultural and linguistic community, often using sign language as their primary language, with their own rich culture — not just people who can\'t hear. Many Deaf people don\'t view deafness as a deficit. Respecting Deaf residents means respecting their language and culture.',
            },
            {
              id: 'hir-s02-reveal-hearing-aid',
              type: 'reveal_card',
              frontTitle: 'Hearing Aid',
              frontBody: 'Hearing aid',
              backTitle: 'Hearing Aid',
              backBody:
                'A small electronic device worn in or behind the ear that amplifies sound to help a person hear. Hearing aids help greatly but don\'t restore normal hearing, and they need care — cleaning, batteries, correct insertion, and handling. Many "broken" hearing aids just have a dead battery or are turned off. Basic hearing-aid care is a CNA skill.',
            },
            {
              id: 'hir-s02-reveal-sign-language',
              type: 'reveal_card',
              frontTitle: 'Sign Language (ASL)',
              frontBody: 'Sign language',
              backTitle: 'Sign Language (ASL)',
              backBody:
                'A complete visual language using hand shapes, movements, facial expressions, and body language. American Sign Language, ASL, is a full language with its own grammar — not just "English on the hands." Some Deaf residents communicate primarily through sign, and may need an interpreter for important communication.',
            },
            {
              id: 'hir-s02-reveal-lip-reading',
              type: 'reveal_card',
              frontTitle: 'Lip Reading / Speech Reading',
              frontBody: 'Lip reading',
              backTitle: 'Lip Reading / Speech Reading',
              backBody:
                'Watching a speaker\'s lips, face, and expressions to understand speech. Some hearing-impaired people rely on it partly — which is why facing the resident, good lighting on your face, and not covering your mouth matter so much. Lip reading is hard and imperfect, so it\'s a help, never a complete solution.',
            },
            {
              id: 'hir-s02-reveal-misattribution',
              type: 'reveal_card',
              frontTitle: 'Misattribution (Hearing Loss as "Confusion")',
              frontBody: 'Misattribution',
              backTitle: 'Misattribution (Hearing Loss as "Confusion")',
              backBody:
                'When hearing loss is mistaken for something else — confusion, dementia, "non-compliance," rudeness, or withdrawal. A resident who can\'t hear may not respond, may not follow instructions, or may seem out of it — and get wrongly labeled. Recognizing hearing loss as the real cause prevents serious misjudgment.',
            },
            {
              id: 'hir-s02-reveal-assistive-aids',
              type: 'reveal_card',
              frontTitle: 'Assistive Listening / Communication Aids',
              frontBody: 'Assistive listening aids',
              backTitle: 'Assistive Listening / Communication Aids',
              backBody:
                'Tools beyond hearing aids that help — amplified phones, devices that make sound louder or clearer, captioning, writing things down, picture boards, and visual alerts for alarms. Using whatever helps a resident communicate and stay safe is part of good care.',
            },
            {
              id: 'hir-s02-kc1-check-presbycusis',
              type: 'knowledge_check',
              question:
                'Match the term: age-related hearing loss; speech sounds present but unclear',
              options: [
                { id: 'presbycusis', label: 'Presbycusis' },
                { id: 'misattribution', label: 'Misattribution' },
                { id: 'hearing-aid', label: 'Hearing aid' },
              ],
              correctOptionId: 'presbycusis',
              explanation:
                'Presbycusis. Age-related hearing loss — the gradual loss of hearing that comes with aging, very common in older adults. It often affects high-pitched sounds first, making certain consonants and voices hard to distinguish, so speech sounds present but unclear — "I can hear you, I just can\'t understand you."',
              requiredForCompletion: true,
            },
            {
              id: 'hir-s02-kc1-check-misattribution',
              type: 'knowledge_check',
              question:
                'Match the term: hearing loss mistaken for confusion, "non-compliance," or withdrawal',
              options: [
                { id: 'presbycusis', label: 'Presbycusis' },
                { id: 'misattribution', label: 'Misattribution' },
                { id: 'hearing-aid', label: 'Hearing aid' },
              ],
              correctOptionId: 'misattribution',
              explanation:
                'Misattribution. When hearing loss is mistaken for something else — confusion, dementia, "non-compliance," rudeness, or withdrawal. A resident who can\'t hear may not respond, may not follow instructions, or may seem out of it — and get wrongly labeled. Recognizing hearing loss as the real cause prevents serious misjudgment.',
              requiredForCompletion: true,
            },
            {
              id: 'hir-s02-kc1-check-hearing-aid',
              type: 'knowledge_check',
              question:
                'Match the term: amplifies sound; needs care — many "broken" ones just need a battery',
              options: [
                { id: 'presbycusis', label: 'Presbycusis' },
                { id: 'misattribution', label: 'Misattribution' },
                { id: 'hearing-aid', label: 'Hearing aid' },
              ],
              correctOptionId: 'hearing-aid',
              explanation:
                'Hearing aid. A small electronic device worn in or behind the ear that amplifies sound to help a person hear. Hearing aids help greatly but don\'t restore normal hearing, and they need care — cleaning, batteries, correct insertion, and handling. Many "broken" hearing aids just have a dead battery or are turned off.',
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
            { id: 'hir-s03-heading', type: 'heading', level: 1, text: 'Statistics' },
            pendingAudio(
              'hir-s03-audio',
              'Hearing Loss in Elders: Common, Isolating, and Constantly Mistaken for Something Else',
              `${ASSET_BASE}/s03-stats-podcast.mp3`,
              [
                'Hearing Loss in Elders: Common, Isolating, and Constantly Mistaken for Something Else',
                '',
                'Hearing loss is one of the most common conditions of aging — among the most prevalent chronic conditions in older adults. Age-related hearing loss, presbycusis, affects a very large share of elders, rising steeply with age, so that by the oldest ages the majority have meaningful hearing loss. In long-term care, the proportion is higher still. Yet hearing loss is dramatically undertreated: many people who would benefit from hearing aids don\'t have them or don\'t use them, often due to cost, stigma, or simply not getting help. So a great many of your residents have hearing loss, and many of them aren\'t well supported for it.',
                '',
                'What makes hearing loss so consequential is less obvious than vision loss, because it\'s invisible — and that invisibility is exactly the problem. The biggest harms are about connection and being understood. Hearing loss makes following conversation exhausting or impossible, especially in noisy group settings like dining rooms and activities. So hearing-impaired residents often withdraw — not because they don\'t want company, but because company has become frustrating and isolating. This withdrawal feeds loneliness and depression, both strongly linked to untreated hearing loss. And, increasingly recognized, hearing loss is associated with cognitive decline and is one of the significant modifiable risk factors for dementia — partly because the isolation and reduced stimulation take a toll, and partly because a brain straining constantly to hear has less capacity for everything else.',
                '',
                'Then there\'s the misjudgment, which is uniquely harmful with hearing loss and is the heart of why CNA awareness matters. Because hearing loss is invisible and its effects look like other things, hearing-impaired residents are constantly mislabeled. A resident who doesn\'t answer is called "confused." A resident who doesn\'t follow instructions is called "non-compliant" or "difficult." A resident who\'s quiet and withdrawn is presumed "depressed" or "declining." A resident who answers oddly because they misheard is thought "demented." Research and clinical experience both show that hearing loss is frequently mistaken for cognitive impairment — and the consequences are real: wrong assumptions, wrong labels, unnecessary worry, and care that talks past a person who simply needs to be heard. Recognizing that "confusion" or "non-compliance" might actually be a hearing problem is one of the most valuable insights a caregiver can have.',
                '',
                'The empowering truth is that most of what helps is communication skill and basic device care — squarely CNA territory. Facing the resident, getting their attention first, speaking clearly rather than shouting, reducing background noise, rephrasing rather than repeating, writing things down, and making sure hearing aids are working and worn — these transform a hearing-impaired resident\'s ability to understand, participate, stay safe, and stay connected. And simply recognizing hearing loss behind the mislabels protects residents from profound misjudgment. The bottom line: hearing loss is common, isolating, dangerous to mood and cognition, and constantly mistaken for confusion — and the CNA\'s communication skills, hearing-aid care, and awareness are what keep a hearing-impaired resident understood, included, and safe.',
              ].join('\n'),
              '/assets/courses/hearing-impairment/s03-stats-podcast.mp3',
            ),
            {
              id: 'hir-s03-image',
              type: 'image',
              src: `${ASSET_BASE}/s03-hero.png`,
              caption:
                'Hearing loss in long-term care — often mistaken for confusion or decline.',
            },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: 'Fundamentals',
        sortOrder: 3,
        buildContent: () =>
          doc('Fundamentals', [
            { id: 'hir-s04-heading', type: 'heading', level: 1, text: 'Fundamentals' },
            {
              id: 'hir-s04-video',
              type: 'video',
              title: 'Fundamentals',
              videoUrl: '/assets/courses/hearing-impairment/s04-fundamentals.mp4',
              placeholderNote: 'Pending upload: /assets/courses/hearing-impairment/s04-fundamentals.mp4',
            },
            {
              id: 'hir-s04-image',
              type: 'image',
              src: `${ASSET_BASE}/s04-hero.png`,
              caption:
                'Understanding hearing loss — how it affects communication and connection.',
            },
            {
              id: 'hir-s04-narration',
              type: 'text',
              body: [
                '**Hearing loss is a spectrum**',
                'Like vision loss, hearing loss is a spectrum — from mild difficulty following conversation, to moderate and severe loss, to profound deafness. Most older adults with hearing loss still have usable hearing, often helped by hearing aids. Some residents are Deaf and communicate through sign language. Knowing each resident\'s specific hearing — what they can and can\'t hear, which ear is better, what helps them understand — lets you communicate in the way that actually reaches them.',
                '**Presbycusis: "I can hear you, I just can\'t understand you"**',
                'The most common hearing loss in elders, presbycusis, has a specific character worth understanding. It often affects high-pitched sounds first — and many speech consonants, like S, F, TH, and K, are high-pitched. So a resident may hear that you\'re speaking — they catch the vowels and the rhythm — but can\'t make out the words clearly, especially fast or mumbled speech, or speech in noise. This is why shouting doesn\'t help much: it\'s not about volume alone, it\'s about clarity. Slower, clearer speech helps far more than louder speech.',
                '**The great misjudgment: hearing loss looks like other things**',
                'This is the most important idea in the course. Because hearing loss is invisible, its effects get blamed on other things. A resident who doesn\'t respond gets called confused or demented. A resident who doesn\'t follow instructions gets called non-compliant, difficult, or stubborn. A resident who answers wrongly because they misheard seems out of it. A resident who\'s withdrawn seems depressed or declining. In every case, the real cause might simply be that they couldn\'t hear. Carrying this awareness — "could this be hearing, not confusion?" — protects residents from being profoundly misjudged and mistreated.',
                '**How hearing loss isolates**',
                'Hearing loss attacks connection. Conversation becomes exhausting work; group settings like dining rooms and activities, full of overlapping noise, become impossible to follow. So hearing-impaired residents often withdraw — not because they\'re antisocial, but because engaging has become frustrating and embarrassing. That withdrawal breeds loneliness and depression, and the isolation itself can worsen thinking and wellbeing. Understanding this helps you see a quiet, withdrawn resident not as uninterested, but as someone struggling to stay connected — and someone your communication can bring back in.',
                '**Communicating effectively: the core skills**',
                'Here are the skills that change everything. Get the resident\'s attention first — a gentle touch or a wave — before speaking, so they\'re ready. Face them directly, at eye level, in good light on your face, and don\'t cover your mouth, so they can see your lips and expressions. Speak clearly and at a natural, slightly slower pace — not shouting, which distorts. Use short, simple sentences. If they don\'t understand, rephrase rather than just repeating the same words louder. Reduce background noise — turn off the TV, move somewhere quieter. And confirm they understood, especially anything important. These habits make you understandable.',
                '**Hearing aids: small device, big difference**',
                'Hearing aids transform many residents\' lives — but only when they\'re working and worn. Key facts for care: they need batteries, which die and need changing; they can be turned off or have the volume wrong; they need cleaning, as earwax clogs them; they must be inserted correctly to work and not hurt; and they\'re small, expensive, and easily lost, so they\'re tracked carefully. Crucially, a great many "broken" or "useless" hearing aids simply have a dead battery, are switched off, or are clogged — simple things to check. Making sure a resident\'s hearing aids are in, on, clean, and working is one of the highest-value things you do.',
                '**Deaf residents and communication aids**',
                'Some residents are Deaf, often with sign language as their primary language and a culture of their own — and deafness, to many, is an identity, not just a deficit. Respect that: arrange interpreters for important communication, learn basic signs or gestures, and never treat a Deaf resident as less capable. And for all hearing-impaired residents, use whatever helps: writing things down, picture or communication boards, amplified phones, captioning, and visual alerts for alarms and emergencies. The goal is always the same — find the way this particular resident can understand and be understood.',
              ].join('\n\n'),
            },
            {
              id: 'hir-s04-clarity-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Clarity beats volume',
              body: 'Presbycusis makes speech sound present but unclear — slower, clearer speech helps far more than shouting. Ask: could this be hearing, not confusion?',
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
            { id: 'hir-s05-heading', type: 'heading', level: 1, text: 'Signs & Symptoms' },
            {
              id: 'hir-s05-image',
              type: 'image',
              src: `${ASSET_BASE}/s05-hero.png`,
              caption:
                'Recognizing the signs — and knowing when a change should be reported.',
            },
            {
              id: 'hir-s05-narration',
              type: 'text',
              body: [
                'You\'re often the first to recognize hearing loss — and to see through the mislabels it causes. Let\'s learn the signs.',
                '**The signs of hearing loss**',
                'Watch for the signs that a resident isn\'t hearing well: frequently asking people to repeat themselves, or saying "what?" and "huh?" often. Leaning in, turning one ear toward the speaker, or cupping a hand to the ear. Turning the TV or radio up very loud. Speaking unusually loudly themselves, because they can\'t gauge their own volume. Trouble following conversation, especially in groups or noise. Misunderstanding or answering off-topic — responding to what they think they heard. Not responding when spoken to from behind or across the room. Difficulty on the phone. These signs, especially together, point to hearing loss — report them so the resident can be assessed and helped.',
                '**The mislabels to see through**',
                'This is the crucial recognition. Watch for hearing loss hiding behind the labels others put on residents. The resident called "confused" or "demented" who actually just isn\'t hearing the questions. The one called "non-compliant" or "difficult" who never heard the instructions. The one who answers oddly — labeled "out of it" — because they misheard. The one who\'s withdrawn and quiet — assumed "depressed" — because following conversation has become too hard. Before accepting any of these labels, ask: could this resident simply not be hearing? Check by facing them, getting their attention, and speaking clearly — and see if the "confusion" or "non-compliance" disappears. This single question protects residents from being deeply misjudged.',
                '**Hearing-aid problems**',
                'Recognize when a hearing aid isn\'t doing its job. Signs: the resident suddenly seeming to hear much worse, or not benefiting from an aid they usually do. Whistling or squealing from the aid, often meaning it\'s not seated right or needs attention. The resident leaving it out, complaining it\'s uncomfortable or not helping. And the simple culprits behind most "broken" aids: a dead battery, the aid switched off, the volume turned down, or wax clogging it. When a hearing aid isn\'t working, check these simple things first — battery, on, volume, clean, properly inserted — and report problems you can\'t resolve. A non-working aid silently cuts a resident off.',
                '**Ear problems and sudden hearing loss**',
                'Watch the ears and report problems. Ear pain, drainage, or discharge — possible infection. Itching, or a feeling of fullness or blockage, which can be wax buildup that needs professional removal — never by you. Redness or swelling. Dizziness or balance problems, which connect to the inner ear. Ringing in the ears, called tinnitus, that\'s new or distressing. And importantly, sudden hearing loss — a rapid loss of hearing in one or both ears over hours to days — is a medical concern that should be reported promptly, because some causes are treatable if caught quickly. Report ear problems and sudden changes; never treat ears or remove wax yourself.',
                '**Summary**',
                'Four pictures. Hearing-loss signs: asking for repeats, leaning in, loud TV, loud speech, trouble in groups, off-topic answers. The mislabels: "confused," "non-compliant," "withdrawn" that may really be hearing loss — check before believing the label. Hearing-aid problems: worse hearing, whistling, left out — check battery, on, volume, clean, inserted. Ear problems: pain, drainage, fullness, dizziness, tinnitus, and sudden hearing loss — report, never treat yourself.',
                'The rule underneath it all: recognize the signs of hearing loss, see through the mislabels by checking whether they can hear you, troubleshoot hearing aids simply, and report ear problems and sudden hearing loss.',
              ].join('\n\n'),
            },
            {
              id: 'hir-s05-mislabel-callout',
              type: 'callout',
              variant: 'warning',
              title: 'See through the mislabels',
              body: 'Before accepting "confused," "non-compliant," or "withdrawn," check whether the resident can hear you. Sudden hearing loss is reported promptly — never treat ears or remove wax yourself.',
            },
          ]),
      },
      {
        slug: 's06-causes',
        title: 'Causes',
        sortOrder: 1,
        buildContent: () =>
          doc('Causes', [
            { id: 'hir-s06-heading', type: 'heading', level: 1, text: 'Causes' },
            pendingAudio(
              'hir-s06-audio',
              'What Causes Hearing Loss — and What a CNA Supports',
              `${ASSET_BASE}/s06-causes-podcast.mp3`,
              [
                'What Causes Hearing Loss — and What a CNA Supports',
                '',
                'Hearing loss in older adults comes from several causes, and understanding them helps you support residents and know what\'s reversible versus permanent.',
                '',
                'The most common is age-related hearing loss — presbycusis — caused by the gradual wear and changes of aging on the delicate hair cells of the inner ear that detect sound. These cells don\'t regenerate, so this loss is permanent and tends to progress slowly, typically affecting high-pitched sounds and speech clarity first. A lifetime of noise exposure adds to it: loud workplaces, machinery, music, and gunfire damage those same hair cells over the years, and noise-induced loss stacks onto age-related loss. Together, these account for most permanent hearing loss in elders.',
                '',
                'Other causes matter too, and some are reversible — which is why reporting hearing changes is worthwhile. Earwax buildup is a very common, completely reversible cause: wax blocking the ear canal can significantly reduce hearing, and once a professional removes it, hearing improves — but wax removal is never a CNA task. Ear infections cause temporary, treatable loss. Some medications can damage hearing. Certain medical conditions, including diabetes and cardiovascular disease, are linked to hearing loss. Head injuries and some diseases of the ear contribute. And sudden hearing loss — a rapid loss over hours or days — can have causes that are treatable if caught quickly, making it something to report promptly rather than wait on.',
                '',
                'Deafness has its own range of causes — some people are born Deaf or become Deaf early in life, growing up within Deaf culture and sign language; others lose hearing later. For a Deaf resident, the "cause" is far less relevant than respecting their language, culture, and communication needs.',
                '',
                'So what does a CNA support? You don\'t treat or cure hearing loss, and you never remove earwax or treat ears — but you support a great deal. You make sure hearing aids are working and worn, which addresses the daily impact of permanent loss. You support residents getting to hearing evaluations and ear care, so reversible causes like wax and infection get found and treated, and permanent loss gets aided. You report ear problems and hearing changes — especially sudden loss — so treatable causes are caught. You support the diabetes and overall health care that protects hearing. And, uniquely valuable, you recognize hearing loss behind the mislabels, so a resident isn\'t wrongly treated as confused or non-compliant. Above all, you bridge the loss every day with skilled communication.',
                '',
                'The takeaway: most elder hearing loss is permanent age-and-noise damage, but some causes — wax, infection, sudden loss — are reversible or treatable if caught; the CNA supports hearing aids, ear care, reporting, and health, and bridges it all with communication.',
              ].join('\n'),
              '/assets/courses/hearing-impairment/s06-causes-podcast.mp3',
            ),
            {
              id: 'hir-s06-image',
              type: 'image',
              src: `${ASSET_BASE}/s06-hero.png`,
              caption:
                'Hearing aids and assistive devices — helping residents stay connected.',
            },
          ]),
      },
      {
        slug: 's07-role',
        title: 'CNA Role & Best Practices',
        sortOrder: 2,
        buildContent: () =>
          doc('CNA Role & Best Practices', [
            { id: 'hir-s07-heading', type: 'heading', level: 1, text: 'CNA Role & Best Practices' },
            {
              id: 'hir-s07-image',
              type: 'image',
              src: `${ASSET_BASE}/s07-hero.png`,
              caption:
                'Your scope — communicate clearly, support devices, and report changes.',
            },
            {
              id: 'hir-s07-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of practice',
              body: 'CNAs COMMUNICATE, CARE FOR AIDS, RECOGNIZE MISLABELS, and REPORT. CNAs never diagnose hearing loss, treat ears, remove earwax, or give ear medications beyond facility policy and training.',
            },
            {
              id: 'hir-s07-narration',
              type: 'text',
              body: [
                'Hearing loss is evaluated and treated by hearing professionals — but the daily bridge that keeps a hearing-impaired resident understood, included, and safe is the CNA\'s, built mostly from communication and device care. Let\'s walk through it, starting with the rule that never bends, stated firmly because it matters most here. A CNA does not diagnose hearing loss, does not treat ears or remove earwax, does not give ear medications beyond facility policy and training, and does not perform ear procedures. Treatment is the nurse\'s and the hearing professional\'s. Your role is communicate, care for aids, recognize, include, and report.',
                '**Effective communication — the core of this care.** These habits, every time. Get the resident\'s attention first — a gentle touch or wave — before speaking. Face them directly at eye level, in good light on your face, mouth uncovered. Speak clearly at a natural, slightly slower pace — not shouting, which distorts speech and sound. Use short, simple sentences. If they don\'t understand, rephrase rather than just repeating louder. Reduce background noise — turn off the TV, find a quieter spot. Confirm understanding of anything important. And use writing, gestures, or pictures whenever they help. This skilled communication is the heart of the care — it\'s how you include the resident in their own life.',
                '**Hearing-aid care — small device, huge impact.** Make sure hearing aids are in, on, and working. Help insert them correctly, check the battery and replace as needed, check the volume and that it\'s switched on, keep them clean of wax, and store and track them carefully because they\'re small and costly. When an aid "isn\'t working," check the simple things first — battery, power, volume, wax, fit — since most failures are exactly these. Report aids that are damaged or that you can\'t get working. A working, worn hearing aid can transform a resident\'s day; a dead one silently isolates them.',
                '**Recognize hearing loss behind the mislabels.** Carry the key insight into daily care: before accepting that a resident is "confused," "non-compliant," "difficult," or "withdrawn," ask whether they simply can\'t hear — and check by facing them, getting their attention, and speaking clearly. Reporting "I think Mr. So-and-so isn\'t following instructions because he can\'t hear them, not because he\'s confused" can change a resident\'s whole care and prevent serious misjudgment. This recognition is uniquely valuable, and it\'s yours to provide.',
                '**Safety — hearing the warnings.** A resident who can\'t hear may miss alarms, calls, warnings, and instructions, which is a real safety issue. Make sure they can be alerted — by touch, visually, or with devices — to emergencies and important information, ensure they understand safety instructions, and account for their hearing in fall and emergency planning. Don\'t assume a hearing-impaired resident heard a warning; confirm it.',
                '**Deaf residents and connection.** Respect Deaf residents\' language and culture — arrange interpreters for important communication, learn basic signs, and never treat them as less capable. And for all hearing-impaired residents, counter the isolation hearing loss causes: make the effort to include them, support accessible activities and connection, and watch for the depression that isolation brings, responding as you learned.',
                'The scope point for this section: you never diagnose, treat ears, remove wax, or medicate beyond your training — but you communicate skillfully, care for hearing aids, recognize hearing loss behind mislabels, support safety and connection, and report. Communication is the care you deliver.',
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
            { id: 'hir-s08-heading', type: 'heading', level: 1, text: 'Prevention & Risk Reduction' },
            {
              id: 'hir-s08-image',
              type: 'image',
              src: `${ASSET_BASE}/s08-hero.png`,
              caption:
                'Supporting residents with hearing loss — face them, speak clearly, and be patient.',
            },
            {
              id: 'hir-s08-narration',
              type: 'text',
              body: [
                'With hearing loss, prevention means preventing isolation, misjudgment, and safety gaps — by communicating well and supporting hearing. Here are seven ways.',
                '**One. Communicate skillfully — every interaction.** Get their attention first, face them in good light, speak clearly at a natural slightly slower pace rather than shouting, use short sentences, rephrase when needed, reduce background noise, and confirm understanding. Skilled communication is the single biggest thing that prevents a hearing-impaired resident from being cut off and misunderstood. Make these habits automatic.',
                '**Two. Keep hearing aids working and worn.** Check daily that aids are in, on, charged or batteried, clean, and correctly inserted, and troubleshoot the simple failures — most "broken" aids just need a battery, power, or cleaning. A working hearing aid prevents isolation; a dead one silently causes it. This small daily attention has huge impact.',
                '**Three. See through the mislabels.** Before accepting that a resident is "confused," "non-compliant," or "withdrawn," check whether they simply can\'t hear — face them, get their attention, speak clearly, and see if the problem disappears. Recognizing hearing loss behind a label prevents the serious misjudgment and mistreatment that follows from it. This awareness is prevention of harm.',
                '**Four. Reduce background noise.** Background noise makes hearing far harder for the impaired ear. Turn off TVs and radios when talking, choose quieter spots for important conversations, and be mindful of noisy settings like dining rooms. Reducing competing noise prevents the frustration and exclusion that drive withdrawal.',
                '**Five. Support ear care and report changes.** Support residents getting hearing evaluations and ear care, so reversible causes like wax and infection are caught and treated and permanent loss is aided. Report ear problems and hearing changes — especially sudden hearing loss, promptly — so treatable causes aren\'t missed. Never remove wax or treat ears yourself.',
                '**Six. Ensure safety and alerting.** Because a hearing-impaired resident may miss alarms, calls, and warnings, make sure they can be alerted — by touch, visually, or with devices — and confirm they understand safety information rather than assuming they heard it. Closing this safety gap prevents a hearing-impaired resident from missing something that matters.',
                '**Seven. Include them and counter isolation.** Make the active effort to include hearing-impaired residents in conversation and activities, use whatever communication aids help, respect Deaf residents\' language and culture, and watch for the depression that isolation brings. Including a resident who would otherwise drift into silence is prevention at its most human — it protects their connection, mood, and wellbeing.',
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
            { id: 'hir-s09-heading', type: 'heading', level: 1, text: 'Scenario & Reporting' },
            pendingAudio(
              'hir-s09-intro-audio',
              'Emergency response scenarios intro',
              `${ASSET_BASE}/s09-emergency-intro.mp3`,
              'With hearing impairment, the judgments that matter most are recognizing hearing loss behind a label like "confused" or "non-compliant," and recognizing when a hearing or ear change needs prompt attention. You\'re about to work through two situations. Read each carefully, choose your action, and you\'ll get feedback right away. Keep the core ideas in mind: before believing a resident is confused or non-compliant, check whether they can hear you — and sudden hearing loss is reported promptly.',
              '/assets/courses/hearing-impairment/s09-emergency-intro.mp3',
            ),
            {
              id: 'hir-s09-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-hero.png`,
              caption:
                'Recognizing hearing loss and urgent changes — not everything is confusion or age.',
            },
            {
              id: 'hir-s09-scenario-petrosian-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-scenario-petrosian.png`,
              caption:
                'What looks like confusion may be hearing loss — face the resident, speak clearly, and report it; don\'t assume dementia.',
            },
            {
              id: 'hir-s09-scenario-petrosian',
              type: 'scenario_question',
              prompt:
                'A new resident, Mr. Petrosian, is being described in handoff as "confused and non-compliant — doesn\'t answer questions, doesn\'t follow instructions, seems out of it." When you care for him, you notice he watches your face intently, answers fine when you\'re facing him up close, but doesn\'t respond at all when you speak from the side or across the room, and his TV is turned up very loud. A coworker says, "Yeah, he\'s pretty demented, just do things for him." What SHOULD the CNA do?',
              options: [
                {
                  id: 'accept-dementia',
                  label: 'Accept that he\'s confused and demented, and do everything for him',
                  feedback:
                    'The clues — watching your face, answering fine up close, not responding from a distance, loud TV — point to hearing loss, not dementia. Accepting "confused and demented," speaking from across the room, or giving up all fail him. The right action: communicate facing him clearly, check for hearing aids, and report that his "confusion/non-compliance" may really be hearing loss.',
                },
                {
                  id: 'recognize-hearing-loss',
                  label:
                    'Recognize this looks like hearing loss, not confusion — communicate facing him clearly, check for hearing aids, and report that his "confusion/non-compliance" may actually be a hearing problem',
                  feedback:
                    'Exactly right — and this is the most valuable recognition in the course. The clues all point to hearing loss, not dementia: Mr. Petrosian watches your face intently (reading lips and expression), answers fine when you face him up close, doesn\'t respond when you speak from the side or far away (where he can\'t hear or see your face), and has the TV turned way up. The "confused, non-compliant, out of it" label is almost certainly a hearing problem being misread — exactly the mistake this course warns about, and one with real consequences if it sticks. So you communicate the way that works — face him, get his attention first, speak clearly up close in good light — check whether he has hearing aids that should be in and working, and crucially, report your observation: "I think Mr. Petrosian isn\'t confused or non-compliant — I think he can\'t hear, because he does fine when I face him and speak clearly up close." That single insight can transform his care, get him a hearing evaluation, and stop him from being wrongly treated as demented. Seeing through the mislabel is care at its sharpest.',
                  isRecommended: true,
                },
                {
                  id: 'speak-across-room',
                  label: 'Speak to him only from across the room, louder',
                  feedback:
                    'The clues — watching your face, answering fine up close, not responding from a distance, loud TV — point to hearing loss, not dementia. Accepting "confused and demented," speaking from across the room, or giving up all fail him. The right action: communicate facing him clearly, check for hearing aids, and report that his "confusion/non-compliance" may really be hearing loss.',
                },
                {
                  id: 'stop-communicating',
                  label: 'Stop trying to communicate with him',
                  feedback:
                    'The clues — watching your face, answering fine up close, not responding from a distance, loud TV — point to hearing loss, not dementia. Accepting "confused and demented," speaking from across the room, or giving up all fail him. The right action: communicate facing him clearly, check for hearing aids, and report that his "confusion/non-compliance" may really be hearing loss.',
                },
              ],
              requiredForCompletion: true,
            },
            {
              id: 'hir-s09-scenario-calloway-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-scenario-calloway.png`,
              caption:
                'Sudden hearing loss is not just aging — take it seriously and report it right away.',
            },
            {
              id: 'hir-s09-scenario-calloway',
              type: 'scenario_question',
              prompt:
                'Ms. Calloway, who normally hears reasonably well with her hearing aid, tells you that since this morning she\'s lost most of the hearing in her left ear — it happened quickly and that ear now feels muffled and full, and she\'s a bit dizzy. You\'ve checked and her hearing aid is working fine and it\'s not just a dead battery. A coworker says, "Hearing goes with age — nothing to do, just speak up on her right side." What SHOULD the CNA do?',
              options: [
                {
                  id: 'assume-age',
                  label: 'Assume it\'s just age and only speak on her good side',
                  feedback:
                    'Sudden hearing loss — rapid, one-sided, with fullness and dizziness — is different from gradual age-related loss and can have treatable causes if caught quickly. Dismissing it as "just age," trying to remove wax yourself, or waiting a week could miss a treatable problem. The right action: report it to the nurse promptly with the details so she can be evaluated.',
                },
                {
                  id: 'report-promptly',
                  label:
                    'Report the sudden hearing loss to the nurse promptly — rapid hearing loss can have treatable causes if caught quickly',
                  feedback:
                    'Right. A sudden loss of hearing — developing over hours to a day, here with ear fullness and dizziness — is different from the slow, gradual hearing loss of aging, and it\'s a medical concern that should be reported promptly. Some causes of sudden hearing loss are treatable, and for certain causes, treatment works best when started quickly — so time can matter, and "it\'s just age, nothing to do" is the wrong assumption, because gradual age-related loss doesn\'t happen suddenly in one ear overnight. You\'ve sensibly ruled out the simple hearing-aid causes. Now report it to the nurse promptly with the details — sudden onset this morning, the left ear, the fullness, the dizziness — so she can be evaluated. Don\'t try to clean or remove wax or treat her ear yourself — that\'s never a CNA task and could cause harm. And don\'t wait a week. Recognizing sudden hearing change as something to report promptly, rather than dismissing it as aging, is exactly right.',
                  isRecommended: true,
                },
                {
                  id: 'remove-wax',
                  label: 'Try to clean out her ear or remove wax to fix it',
                  feedback:
                    'Sudden hearing loss — rapid, one-sided, with fullness and dizziness — is different from gradual age-related loss and can have treatable causes if caught quickly. Dismissing it as "just age," trying to remove wax yourself, or waiting a week could miss a treatable problem. The right action: report it to the nurse promptly with the details so she can be evaluated.',
                },
                {
                  id: 'wait-week',
                  label: 'Wait a week to see if it comes back',
                  feedback:
                    'Sudden hearing loss — rapid, one-sided, with fullness and dizziness — is different from gradual age-related loss and can have treatable causes if caught quickly. Dismissing it as "just age," trying to remove wax yourself, or waiting a week could miss a treatable problem. The right action: report it to the nurse promptly with the details so she can be evaluated.',
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
            { id: 'hir-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
              id: 'hir-s10-video',
              type: 'video',
              title: 'The CNA\'s Role',
              videoUrl: '/assets/courses/hearing-impairment/s10-cna-role.mp4',
              placeholderNote: 'Pending upload: /assets/courses/hearing-impairment/s10-cna-role.mp4',
            },
            {
              id: 'hir-s10-image',
              type: 'image',
              src: `${ASSET_BASE}/s10-hero.png`,
              caption:
                'Your role — reducing background noise, facing the resident, and reporting changes.',
            },
            {
              id: 'hir-s10-narration',
              type: 'text',
              body: [
                'Your role with hearing-impaired residents is skilled communication, hearing-aid care, seeing through mislabels, ensuring safety, and protecting connection. Let\'s walk through it.',
                '**Communicate so they understand** Be the bridge. Every interaction: get their attention first, face them at eye level in good light with your mouth uncovered, speak clearly at a natural slightly slower pace rather than shouting, use short sentences, rephrase rather than just repeating, reduce background noise, confirm understanding, and use writing or gestures when they help. For a resident with hearing loss, your skilled communication is how they\'re included in their care and their life — it is the heart of this work.',
                '**Keep hearing aids working** Make sure aids are in, on, and working — inserted correctly, battery good, volume right, clean of wax, tracked carefully. When one "isn\'t working," check the simple things first — most failures are a dead battery, the power off, the volume down, or wax. Report aids you can\'t fix. A working, worn hearing aid can transform a resident\'s connection; making sure of it daily is high-value care.',
                '**See through the mislabels** Carry the key insight: before accepting "confused," "non-compliant," "difficult," or "withdrawn," check whether the resident simply can\'t hear — face them, get their attention, speak clearly — and report when you suspect hearing loss is being mistaken for confusion. This recognition can change a resident\'s entire care and rescue them from profound misjudgment. It\'s one of the most valuable things you bring.',
                '**Protect safety and connection** Close the safety and connection gaps. Make sure hearing-impaired residents can be alerted to alarms and emergencies and understand safety information — don\'t assume they heard. Respect Deaf residents\' language and culture and arrange interpreters for important communication. And actively include hearing-impaired residents in conversation and activity, countering the isolation hearing loss causes and watching for the depression it can bring. You keep them safe and connected.',
                'Now the boundary. You do not diagnose hearing loss. You do not treat ears, remove earwax, or perform ear procedures. You do not give ear medications beyond your training and facility policy. And you never shout instead of communicating clearly, never accept a "confused" label without checking for hearing loss, never remove wax or treat ears, and never let a hearing-impaired resident drift into isolation unaddressed.',
                'Inside your role — skilled communication, hearing-aid care, seeing through mislabels, ensuring safety, and protecting connection — you keep a hearing-impaired resident understood, correctly seen, safe, and connected to the world. Communication is the care, and it is profoundly yours.',
              ].join('\n\n'),
            },
            {
              id: 'hir-s10-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Stay within scope',
              body: 'You do not diagnose hearing loss, treat ears, remove earwax, or give ear medications beyond your training. Never accept a "confused" label without checking for hearing loss, and never let a hearing-impaired resident drift into isolation unaddressed.',
            },
          ]),
      },
      {
        slug: 's11-case-study',
        title: 'Case Study',
        sortOrder: 2,
        buildContent: () => {
          const caseNarrative = [
            'Mr. Petrosian, 81, arrived at the facility with a worrying handoff: "confused, non-compliant, possibly early dementia — doesn\'t answer questions, doesn\'t follow instructions, seems out of it, withdrawn." Staff had begun treating him accordingly — doing things for him, speaking about him rather than to him, and noting his "decline." His CNA, Marisol, was assigned to him and, before accepting the picture she\'d been handed, simply paid attention.',
            '',
            '**What Marisol noticed:** Watching Mr. Petrosian closely, Marisol saw things that didn\'t fit "dementia." When she stood in front of him and spoke, he watched her face with intense focus — her lips, her expression — and answered perfectly well, making good sense. But when she spoke to him from the side, or from across the room, or with her back turned, he didn\'t respond at all. His television was turned up almost painfully loud. And in the noisy dining room, he was lost and withdrawn, while one-on-one in a quiet space he was engaged and clear. A man with dementia wouldn\'t follow her perfectly up-close and then "lose" his mind from across the room. But a man who couldn\'t hear would do exactly that.',
            '',
            '**What Marisol recognized:** Marisol remembered the most important lesson from her training: hearing loss is constantly mistaken for confusion, dementia, and non-compliance. Mr. Petrosian wasn\'t confused — he was reading her lips and face when he could see them, and simply couldn\'t hear when he couldn\'t. He didn\'t "fail to follow instructions" out of defiance or dementia; he never heard the instructions, given to him from across a room or to the back of his head. The "withdrawn, declining" man was a man cut off by deafness in a setting that hadn\'t realized it. He\'d been profoundly misjudged.',
            '',
            '**What Marisol did:** She changed how she communicated immediately — getting his attention first, facing him directly at eye level in good light, speaking clearly at a natural pace, in quiet where she could, confirming he understood. And Mr. Petrosian "came back": engaged, clear, following everything, even warm and funny. She checked and found he had no hearing aids — he\'d never been properly evaluated. Then she reported her observation clearly and specifically to the nurse: "I don\'t think Mr. Petrosian is confused or demented. I think he has significant hearing loss. He follows me perfectly when I face him and speak clearly up close, and doesn\'t respond at all from a distance or when he can\'t see my face — and his TV is at maximum. I think the \'confusion\' is a hearing problem."',
            '',
            '**The response:** Because Marisol saw through the mislabel and reported it, Mr. Petrosian was referred for a hearing evaluation — which confirmed significant hearing loss, not dementia. He was fitted with hearing aids, and staff were taught to communicate with him properly. The transformation was dramatic: the "confused, non-compliant, declining" man was revealed as a sharp, sociable person who had simply been unable to hear. He rejoined conversations and activities, his "non-compliance" vanished because he could now hear instructions, and the dementia worry evaporated.',
            '',
            '**The outcome:** Mr. Petrosian was saved from a profoundly wrong path — being treated as demented, having things done for him, drifting into isolation and decline — all because one CNA questioned the label and recognized hearing loss behind it. The nurse was direct with Marisol: "He came to us labeled as a confused, declining dementia patient. He\'s a man with hearing loss and a working mind. If you hadn\'t questioned that, he might have spent years being treated as something he\'s not — talked over, written off, isolated. You gave him his life back by asking one question: can he actually hear me?"',
            '',
            '**Discussion:** Marisol\'s case is the central lesson of this course made real. She refused to accept "confused and non-compliant" at face value and watched what was actually happening — the lip-reading, the up-close clarity, the distance failures, the blaring TV — recognizing the unmistakable signature of hearing loss, not dementia. She communicated the way that reached him, confirming the recognition. And she reported it specifically, redirecting his entire care. She stayed in scope throughout — she didn\'t diagnose, treat his ears, or remove wax; she recognized, communicated, and reported. The single question "could this be hearing, not confusion?" rescued a man from being misjudged for years. No skill in this course matters more.',
          ].join('\n');

          return doc('Brief Case Study', [
            { id: 'hir-s11-heading', type: 'heading', level: 1, text: 'Brief Case Study' },
            pendingAudio(
              'hir-s11-audio',
              'The "Confused" Man Who Wasn\'t',
              `${ASSET_BASE}/s11-case-podcast.mp3`,
              caseNarrative,
              '/assets/courses/hearing-impairment/s11-case-podcast.mp3',
            ),
            {
              id: 'hir-s11-image',
              type: 'image',
              src: `${ASSET_BASE}/s11-hero.png`,
              caption:
                'Putting it together — respectful, clear, connection-focused communication.',
            },
            {
              id: 'hir-s11-case-study',
              type: 'case_study',
              title: 'The "Confused" Man Who Wasn\'t',
              residentProfile:
                'Mr. Petrosian, 81, arrived at the facility with a worrying handoff: "confused, non-compliant, possibly early dementia — doesn\'t answer questions, doesn\'t follow instructions, seems out of it, withdrawn." Staff had begun treating him accordingly — doing things for him, speaking about him rather than to him, and noting his "decline." His CNA, Marisol, was assigned to him and, before accepting the picture she\'d been handed, simply paid attention.',
              scenario: [
                '**What Marisol noticed:** Watching Mr. Petrosian closely, Marisol saw things that didn\'t fit "dementia." When she stood in front of him and spoke, he watched her face with intense focus — her lips, her expression — and answered perfectly well, making good sense. But when she spoke to him from the side, or from across the room, or with her back turned, he didn\'t respond at all. His television was turned up almost painfully loud. And in the noisy dining room, he was lost and withdrawn, while one-on-one in a quiet space he was engaged and clear. A man with dementia wouldn\'t follow her perfectly up-close and then "lose" his mind from across the room. But a man who couldn\'t hear would do exactly that.',
                '**What Marisol recognized:** Marisol remembered the most important lesson from her training: hearing loss is constantly mistaken for confusion, dementia, and non-compliance. Mr. Petrosian wasn\'t confused — he was reading her lips and face when he could see them, and simply couldn\'t hear when he couldn\'t. He didn\'t "fail to follow instructions" out of defiance or dementia; he never heard the instructions, given to him from across a room or to the back of his head. The "withdrawn, declining" man was a man cut off by deafness in a setting that hadn\'t realized it. He\'d been profoundly misjudged.',
                '**What Marisol did:** She changed how she communicated immediately — getting his attention first, facing him directly at eye level in good light, speaking clearly at a natural pace, in quiet where she could, confirming he understood. And Mr. Petrosian "came back": engaged, clear, following everything, even warm and funny. She checked and found he had no hearing aids — he\'d never been properly evaluated. Then she reported her observation clearly and specifically to the nurse: "I don\'t think Mr. Petrosian is confused or demented. I think he has significant hearing loss. He follows me perfectly when I face him and speak clearly up close, and doesn\'t respond at all from a distance or when he can\'t see my face — and his TV is at maximum. I think the \'confusion\' is a hearing problem."',
                '**The response:** Because Marisol saw through the mislabel and reported it, Mr. Petrosian was referred for a hearing evaluation — which confirmed significant hearing loss, not dementia. He was fitted with hearing aids, and staff were taught to communicate with him properly. The transformation was dramatic: the "confused, non-compliant, declining" man was revealed as a sharp, sociable person who had simply been unable to hear. He rejoined conversations and activities, his "non-compliance" vanished because he could now hear instructions, and the dementia worry evaporated.',
                '**The outcome:** Mr. Petrosian was saved from a profoundly wrong path — being treated as demented, having things done for him, drifting into isolation and decline — all because one CNA questioned the label and recognized hearing loss behind it. The nurse was direct with Marisol: "He came to us labeled as a confused, declining dementia patient. He\'s a man with hearing loss and a working mind. If you hadn\'t questioned that, he might have spent years being treated as something he\'s not — talked over, written off, isolated. You gave him his life back by asking one question: can he actually hear me?"',
                '**Discussion:** Marisol\'s case is the central lesson of this course made real. She refused to accept "confused and non-compliant" at face value and watched what was actually happening — the lip-reading, the up-close clarity, the distance failures, the blaring TV — recognizing the unmistakable signature of hearing loss, not dementia. She communicated the way that reached him, confirming the recognition. And she reported it specifically, redirecting his entire care. She stayed in scope throughout — she didn\'t diagnose, treat his ears, or remove wax; she recognized, communicated, and reported. The single question "could this be hearing, not confusion?" rescued a man from being misjudged for years. No skill in this course matters more.',
              ].join('\n\n'),
            },
            {
              id: 'hir-s11-reflection-1',
              type: 'reflection',
              prompt:
                'Mr. Petrosian was labeled "confused and demented." What clues told Marisol it was actually hearing loss, and why is recognizing hearing loss behind such labels so important?',
              minCharacters: 50,
            },
            {
              id: 'hir-s11-reflection-2',
              type: 'reflection',
              prompt:
                'Marisol reported "I don\'t think he\'s confused — I think he can\'t hear" rather than just adapting quietly on her own. Why was reporting her observation so important to his care?',
              minCharacters: 50,
            },
            {
              id: 'hir-s11-rp-text',
              type: 'text',
              body: 'Reflect on the case study in the previous lesson. Your written responses help you apply what you learned about hearing loss mistaken for confusion, skilled communication, and faithful reporting.',
            },
            {
              id: 'hir-s11-kc2-check',
              type: 'knowledge_check',
              question:
                'A CNA does not diagnose hearing loss, does not treat ears or remove earwax, does not give ear medications beyond facility policy and training, and does not perform ear procedures. A new resident, Mr. Petrosian, is being described in handoff as "confused and non-compliant — doesn\'t answer questions, doesn\'t follow instructions, seems out of it." When you care for him, you notice he watches your face intently, answers fine when you\'re facing him up close, but doesn\'t respond at all when you speak from the side or across the room, and his TV is turned up very loud. A coworker says, "Yeah, he\'s pretty demented, just do things for him." What SHOULD the CNA do?',
              options: [
                {
                  id: 'accept-dementia',
                  label: 'Accept that he\'s confused and demented, and do everything for him',
                },
                {
                  id: 'recognize-hearing-loss',
                  label:
                    'Recognize this looks like hearing loss, not confusion — communicate facing him clearly, check for hearing aids, and report that his "confusion/non-compliance" may actually be a hearing problem',
                },
                {
                  id: 'speak-across-room',
                  label: 'Speak to him only from across the room, louder',
                },
                {
                  id: 'stop-communicating',
                  label: 'Stop trying to communicate with him',
                },
              ],
              correctOptionId: 'recognize-hearing-loss',
              explanation:
                'You never diagnose, treat ears, remove wax, or medicate beyond your training — but recognizing hearing loss behind mislabels, communicating skillfully, and reporting your observations are exactly what keeps a resident understood and correctly cared for.',
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
            { id: 'hir-s12-heading', type: 'heading', level: 1, text: 'Conclusion' },
            {
              id: 'hir-s12-video',
              type: 'video',
              title: 'Conclusion',
              videoUrl: '/assets/courses/hearing-impairment/s12-conclusion.mp4',
              placeholderNote: 'Pending upload: /assets/courses/hearing-impairment/s12-conclusion.mp4',
            },
            {
              id: 'hir-s12-image',
              type: 'image',
              src: `${ASSET_BASE}/s12-hero.png`,
              caption:
                'Caring with respect — helping every resident stay connected and understood.',
            },
            {
              id: 'hir-s12-narration',
              type: 'text',
              body: [
                'You\'ve reached the end — and you\'ve completed the senses series. Let\'s lock in the five things that matter most for caring for residents with hearing loss.',
                '**One.** Hearing loss is common in elders and deeply consequential — driving isolation, loneliness, and depression, and constantly mistaken for confusion, dementia, "non-compliance," or withdrawal. The most common kind, presbycusis, makes speech sound present but unclear, so clarity helps more than loudness. Knowing each resident\'s hearing guides how you reach them.',
                '**Two.** Communication is the care. Get their attention first, face them at eye level in good light with your mouth uncovered, speak clearly at a natural slightly slower pace rather than shouting, use short sentences, rephrase rather than repeat, reduce background noise, and confirm understanding. Skilled communication is how you include a hearing-impaired resident in their care and their life.',
                '**Three.** Keep hearing aids working and worn. Check that they\'re in, on, charged, clean, and correctly inserted, and troubleshoot the simple failures — most "broken" aids just need a battery, power, or cleaning. A working aid transforms a resident\'s connection; a dead one silently isolates them.',
                '**Four.** See through the mislabels — this is the key insight. Before accepting that a resident is "confused," "non-compliant," or "withdrawn," check whether they simply can\'t hear, and report when you suspect hearing loss is being mistaken for confusion. This single recognition can rescue a resident from being profoundly misjudged and wrongly treated.',
                '**Five.** Support safety and connection, and honor your scope. Make sure hearing-impaired residents can be alerted to alarms and understand safety information, respect Deaf residents\' language and culture, and actively include residents to counter isolation. You never diagnose, treat ears, remove wax, or medicate beyond your training — but you communicate skillfully, care for aids, recognize, include, and report. Ask the question that changes everything: can they actually hear me?',
              ].join('\n\n'),
            },
            {
              id: 'hir-s12-summary',
              type: 'summary',
              title: 'Five things that matter most',
              items: [
                'Hearing loss is common and consequential — constantly mistaken for confusion, dementia, or withdrawal.',
                'Communication is the care — face them, speak clearly, rephrase, reduce noise, confirm understanding.',
                'Keep hearing aids working and worn — most "broken" aids just need a battery, power, or cleaning.',
                'See through the mislabels — check whether they can hear before accepting "confused" or "non-compliant."',
                'Support safety and connection, honor your scope — communicate, care for aids, recognize, include, and report.',
              ],
            },
            {
              id: 'hir-s12-whn-text',
              type: 'text',
              body: 'Ten questions are waiting. Everything on them was covered here. You\'re ready. Trust what you\'ve learned, and show what you know.',
            },
            {
              id: 'hir-s12-cr-text',
              type: 'text',
              body: 'This course provides one hour of continuing education credit through CAL ACE Nursing Academy, an approved CDPH continuing education provider, NAC number 7384. Your certificate is generated automatically when you pass the knowledge check.',
            },
            {
              id: 'hir-s12-cr-callout',
              type: 'callout',
              variant: 'info',
              title: 'Scope reminder',
              body: 'CNAs communicate, care for hearing aids, recognize mislabels, and report. CNAs do not diagnose hearing loss, treat ears, remove earwax, or give ear medications beyond facility policy and training.',
            },
            {
              id: 'hir-s12-ca-text',
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

export async function seedCourse49HearingImpairment(
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
    `Seeding Course 49 (Hearing Impairment & Deaf Residents) as DRAFT — slug "${COURSE_SLUG}"…`,
  );

  try {
    const result = await seedCourse49HearingImpairment(prisma);
    const blockCounts = blockCountsByLesson();
    const totalBlocks = Object.values(blockCounts).reduce((sum, count) => sum + count, 0);

    console.log('Seed complete.');
    console.log(`  Course:   ${COURSE_TITLE}`);
    console.log(`  Slug:     ${COURSE_SLUG}`);
    console.log(`  Created:  ${result.courseCreated ? 'yes (new)' : 'no (updated existing)'}`);
    console.log(`  Modules:  ${result.modulesUpserted}`);
    console.log(`  Lessons:  ${result.lessonsUpserted}`);
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
