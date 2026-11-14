/**
 * Seed Course 44 — Recognizing & Supporting Depression in Older Adults (DRAFT).
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-44-depression
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
const COURSE_SLUG = 'depression';
const COURSE_TITLE = 'Late-Life Depression: Recognition and Supportive Care';
const COURSE_SUMMARY =
  'Learn the CNA\'s role in recognizing and supporting residents with depression — understanding depression as a treatable medical illness (not normal aging), recognizing its signs including masked and atypical presentations in elders, supporting through engagement and connection, recognizing suicide-warning signs and responding correctly (take seriously, stay with the resident, report immediately, never promise secrecy), and reporting faithfully. CNAs do not diagnose depression, provide therapy or clinical counseling, or give or adjust medications.';

const ASSET_BASE = `/assets/courses/depression`;

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
    'Recognize that depression is a treatable illness, not normal aging.',
    'Identify its signs, including the hidden ones.',
    'Support a depressed resident.',
    'Recognize and respond to suicide-warning signs.',
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
  heroImage: '/assets/courses/depression/hero-banner.png',
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
    title: "Understanding Late-Life Depression",
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: "Introduction",
        sortOrder: 0,
        buildContent: () =>
          doc("Welcome", [
            { id: 'dep-s01-heading', type: 'heading', level: 1, text: "Welcome" },
            {
              id: 'dep-s01-video',
              type: 'video',
              title: 'Introduction',
              videoUrl: '/assets/courses/depression/s01-intro.mp4',
              placeholderNote: 'Pending upload: /assets/courses/depression/s01-intro.mp4',
            },
            {
              id: 'dep-s01-image',
              type: 'image',
              src: `${ASSET_BASE}/s01-hero.png`,
              caption:
                'Depression in older adults — recognizing it as a treatable condition, not a normal part of aging.',
            },
            { id: 'dep-s01-narration', type: 'text', body: "Welcome to CAL ACE Nursing Academy.\n\nThis course is about recognizing and supporting depression in older adults — and it opens our series on mental health, an area of care that's often overlooked but profoundly affects how residents live, heal, and even survive.\n\nLet's begin by clearing up the single most harmful myth in this whole topic: depression is NOT a normal part of aging. It is a real, common, and treatable medical illness — not a character weakness, not laziness, and not something an older person should simply \"expect\" or \"get over.\" This myth is dangerous precisely because it leads caregivers, families, and even doctors to overlook depression in elders, dismissing serious illness as \"just getting old\" or \"just being sad.\" When that happens, treatable suffering goes untreated. Believing depression is normal aging is how it gets missed — and you will not make that mistake.\n\nDepression matters enormously in the residents you care for. It causes deep suffering and robs life of joy. It worsens physical health — people with depression heal more slowly, manage their other conditions worse, eat and move less, and decline faster. It can look like dementia, causing confusion and memory problems that lift when the depression is treated. And, most seriously, depression is the leading driver of suicide — and older adults, particularly older men, have some of the highest suicide rates of any group. This is not a soft topic. Recognizing and reporting depression saves lives.\n\nHere is why the CNA is so central. You spend more time with residents than anyone — you see them daily, you know their normal, and you're often the first to notice the quiet changes: the resident who's withdrawn, who's stopped eating, who's lost interest in things they loved, who says they feel hopeless. Depression in elders is often quiet and easy to miss, and your daily presence and watchful eyes are frequently what catches it. You're also a source of the human connection that supports a depressed resident every day.\n\nThis course will teach you something serious and important: how to recognize the warning signs that a resident may be thinking of suicide, and exactly what to do — take it seriously, stay with them, report immediately, and never promise to keep it secret. Knowing this can save a life.\n\nYour scope is clear. A CNA recognizes the signs of depression and suicide risk, supports residents through connection and engagement, reports faithfully and urgently, and provides compassionate care. A CNA does not diagnose depression, does not provide therapy or counseling, and does not give or adjust medications.\n\nBy the end of this course, you will be able to: recognize that depression is a treatable illness, not normal aging. Identify its signs, including the hidden ones. Support a depressed resident. Recognize and respond to suicide-warning signs. And know your scope.\n\nThere is a ten-question knowledge check at the end. Everything on it is covered here. Let's begin." },
            { id: 'dep-s01-ci-text', type: 'text', body: "This course teaches the CNA's role in recognizing and supporting residents with depression — understanding depression as a treatable medical illness (not normal aging), recognizing its signs including masked and atypical presentations in elders, supporting through engagement and connection, recognizing suicide-warning signs and responding correctly, and reporting faithfully.\n\nLet's be clear about your role. A CNA recognizes the signs of depression and suicide risk, supports residents through connection and engagement, reports faithfully and urgently, and provides compassionate care. A CNA does not diagnose depression, does not provide therapy or clinical counseling, and does not give or adjust medications. Those are nursing and mental-health-team tasks. But none of them can happen without your careful observation and faithful reporting first." },
            { id: 'dep-s01-ci-scope-callout', type: 'callout', variant: "clinical", title: "Scope of this course", body: "CNAs RECOGNIZE, CONNECT, SUPPORT, and REPORT. CNAs do not diagnose depression, provide therapy or clinical counseling, or give or adjust medications." },
            { id: 'dep-s01-lo-text', type: 'text', body: "By the end of this course, you will be able to:" },
            { id: 'dep-s01-lo-summary', type: 'summary', title: "Learning objectives", items: ["Recognize that depression is a treatable illness, not normal aging.","Identify its signs, including the hidden ones.","Support a depressed resident.","Recognize and respond to suicide-warning signs.","Know your scope — what a CNA does, and what a CNA must never do."] },
          ]),
      },
      {
        slug: 's02-terms',
        title: "Terms & Definitions",
        sortOrder: 1,
        buildContent: () =>
          doc("Key terms", [
            { id: 'dep-s02-heading', type: 'heading', level: 1, text: "Key terms" },
            {
              id: 'dep-s02-image',
              type: 'image',
              src: `${ASSET_BASE}/s02-hero.png`,
              caption:
                'Key terms — depression, major depressive disorder, mood, withdrawal, risk factors, warning signs.',
            },
            { id: 'dep-s02-reveal-depression', type: 'reveal_card', frontTitle: "Depression", frontBody: "Depression", backTitle: "Depression", backBody: "A common, serious, and treatable medical illness that affects mood, thinking, the body, and behavior — causing persistent sadness, loss of interest, and many physical and emotional symptoms. It is NOT normal aging, NOT weakness, and NOT something to simply \"get over.\" With treatment, most people improve." },
            { id: 'dep-s02-reveal-not-normal-aging', type: 'reveal_card', frontTitle: "Not Normal Aging", frontBody: "Not normal aging", backTitle: "Not Normal Aging", backBody: "A crucial idea: while older adults face real losses, persistent depression is never a normal or expected part of growing old. Treating it as \"just getting old\" causes it to be missed and untreated. Recognizing depression as illness, not aging, is the first step to helping." },
            { id: 'dep-s02-reveal-anhedonia', type: 'reveal_card', frontTitle: "Anhedonia", frontBody: "An-heh-DOH-nee-ah", backTitle: "Anhedonia", backBody: "The loss of interest or pleasure in activities a person used to enjoy. A resident who no longer cares about hobbies, visits, meals, or things that once brought them joy may be showing anhedonia — one of the core signs of depression, alongside persistent low mood." },
            { id: 'dep-s02-reveal-masked-depression', type: 'reveal_card', frontTitle: "Masked / Atypical Depression in Elders", frontBody: "Masked depression", backTitle: "Masked / Atypical Depression in Elders", backBody: "In older adults, depression often hides behind other things — physical complaints, aches and pains, fatigue, sleep and appetite changes, irritability, or memory and confusion problems — rather than obvious sadness. Because it's \"masked,\" it's easily missed. Knowing its hidden faces helps you catch it." },
            { id: 'dep-s02-reveal-pseudodementia', type: 'reveal_card', frontTitle: "Pseudodementia", frontBody: "SOO-doh-dih-MEN-shah", backTitle: "Pseudodementia", backBody: "When depression causes confusion, memory problems, and slowed thinking that look like dementia — but improve when the depression is treated. This is why depression must always be considered in a resident who seems newly confused: it may be treatable depression, not permanent dementia." },
            { id: 'dep-s02-reveal-suicidal-ideation', type: 'reveal_card', frontTitle: "Suicidal Ideation", frontBody: "Suicidal ideation", backTitle: "Suicidal Ideation", backBody: "Thoughts about ending one's own life — ranging from passive (\"I'd be better off gone\") to active. In older adults these thoughts are serious and not rare. Any expression of wanting to die or not wanting to live is taken seriously and reported immediately — never dismissed or kept secret." },
            { id: 'dep-s02-reveal-warning-signs', type: 'reveal_card', frontTitle: "Warning Signs", frontBody: "Warning signs", backTitle: "Warning Signs", backBody: "The signals that a person may be at risk of suicide — including talking about death or being a burden, hopelessness, giving away belongings, withdrawing, or a sudden calm after deep depression. CNAs learn to recognize these and respond by staying with the resident and reporting immediately." },
            { id: 'dep-s02-reveal-engagement', type: 'reveal_card', frontTitle: "Engagement", frontBody: "Engagement", backTitle: "Engagement", backBody: "Meaningful human connection and activity — conversation, companionship, involvement in life and routines. For a depressed resident, genuine engagement and connection are part of care: they counter isolation, provide support, and remind a person they matter. Offering engagement is daily CNA work." },
            { id: 'dep-s02-kc1-check-depression', type: 'knowledge_check', question: "Match the term: a treatable medical illness — NOT a normal part of aging", options: [
                {
                  "id": "depression",
                  "label": "Depression"
                },
                {
                  "id": "pseudodementia",
                  "label": "Pseudodementia"
                },
                {
                  "id": "warning-signs",
                  "label": "Warning signs"
                }
              ], correctOptionId: "depression", explanation: "Depression. A common, serious, and treatable medical illness that affects mood, thinking, the body, and behavior — causing persistent sadness, loss of interest, and many physical and emotional symptoms. It is NOT normal aging, NOT weakness, and NOT something to simply \"get over.\"", requiredForCompletion: true },
            { id: 'dep-s02-kc1-check-pseudodementia', type: 'knowledge_check', question: "Match the term: depression causing dementia-like confusion that improves with treatment", options: [
                {
                  "id": "depression",
                  "label": "Depression"
                },
                {
                  "id": "pseudodementia",
                  "label": "Pseudodementia"
                },
                {
                  "id": "warning-signs",
                  "label": "Warning signs"
                }
              ], correctOptionId: "pseudodementia", explanation: "Pseudodementia. When depression causes confusion, memory problems, and slowed thinking that look like dementia — but improve when the depression is treated. This is why depression must always be considered in a resident who seems newly confused.", requiredForCompletion: true },
            { id: 'dep-s02-kc1-check-warning-signs', type: 'knowledge_check', question: "Match the term: signals of possible suicide risk — take seriously and report immediately", options: [
                {
                  "id": "depression",
                  "label": "Depression"
                },
                {
                  "id": "pseudodementia",
                  "label": "Pseudodementia"
                },
                {
                  "id": "warning-signs",
                  "label": "Warning signs"
                }
              ], correctOptionId: "warning-signs", explanation: "Warning signs. The signals that a person may be at risk of suicide — including talking about death or being a burden, hopelessness, giving away belongings, withdrawing, or a sudden calm after deep depression. CNAs learn to recognize these and respond by staying with the resident and reporting immediately.", requiredForCompletion: true },
          ]),
      },
      {
        slug: 's03-statistics',
        title: "Statistics",
        sortOrder: 2,
        buildContent: () =>
          doc("Statistics", [
            { id: 'dep-s03-heading', type: 'heading', level: 1, text: "Statistics" },
            pendingAudio(
              'dep-s03-audio',
              "Depression in Older Adults: Common, Serious, Treatable — and Too Often Missed",
              `${ASSET_BASE}/s03-stats-podcast.mp3`,
              "Depression in Older Adults: Common, Serious, Treatable — and Too Often Missed\n\nDepression is one of the most common mental health conditions among older adults, and one of the most consequential — yet it remains widely under-recognized and undertreated, especially in this age group. Significant numbers of older adults experience depression, and the rates are even higher among those in long-term care, who face the very things that raise risk: chronic illness, disability, pain, loss of independence, grief, and isolation. Despite how common it is, much of it goes unrecognized.\n\nThe reason it gets missed is worth dwelling on, because it's correctable. The biggest barrier is the myth that depression is just part of getting old — a belief held by families, caregivers, and sometimes clinicians, which leads to serious, treatable illness being shrugged off as normal sadness or \"just aging.\" Compounding this, depression in older adults often doesn't look like classic sadness. It hides behind physical complaints, fatigue, aches, sleep and appetite changes, irritability, or — strikingly — confusion and memory problems that mimic dementia. So it's both dismissed and disguised, a combination that lets it slip past.\n\nAnd the stakes are high. Depression isn't just emotional suffering, though that alone matters. It measurably worsens physical health: depressed elders heal more slowly, manage chronic conditions worse, eat and move less, and decline faster. It can cause or worsen the confusion that looks like dementia — and crucially, that confusion often lifts when the depression is treated, meaning a \"dementia\" diagnosis can sometimes be reversible depression in disguise. Most seriously of all, depression is the leading risk factor for suicide, and older adults — particularly older men — have among the highest suicide rates of any group, often with fewer warning signs and more lethal attempts. This is among the most serious facts in elder care.\n\nThe hopeful counterpart is that depression is highly treatable. With therapy, medication, social connection, and support, most older adults with depression improve significantly — often dramatically. Treatment can restore not just mood but appetite, energy, cognition, and the will to live. The tragedy of missed depression is that it's the missing of something fixable.\n\nThis is where the CNA becomes pivotal. Because CNAs see residents daily and know their baseline, they're often the first and best positioned to notice the changes that signal depression — the withdrawal, the lost interest, the not eating, the expressions of hopelessness — especially when those signs are quiet or masked. And the CNA's reporting of those observations is frequently what gets a resident assessed and treated. Recognizing depression, and recognizing the warning signs of suicide, and reporting them — that is CNA work that genuinely saves lives. The bottom line: depression in elders is common, serious, often missed, and very treatable — and the CNA's watchful recognition and faithful reporting are a frontline defense.",
              '/assets/courses/depression/s03-stats-podcast.mp3',
            ),
            {
              id: 'dep-s03-image',
              type: 'image',
              src: `${ASSET_BASE}/s03-hero.png`,
              caption:
                'Depression is common in long-term care — and often under-recognized.',
            },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: "Fundamentals",
        sortOrder: 3,
        buildContent: () =>
          doc("Fundamentals", [
            { id: 'dep-s04-heading', type: 'heading', level: 1, text: "Fundamentals" },
            {
              id: 'dep-s04-video',
              type: 'video',
              title: 'Fundamentals',
              videoUrl: '/assets/courses/depression/s04-fundamentals.mp4',
              placeholderNote: 'Pending upload: /assets/courses/depression/s04-fundamentals.mp4',
            },
            {
              id: 'dep-s04-image',
              type: 'image',
              src: `${ASSET_BASE}/s04-hero.png`,
              caption:
                'Understanding depression — how it affects mood, body, and daily life.',
            },
            { id: 'dep-s04-narration', type: 'text', body: "**What depression really is**\n\nDepression is a medical illness that affects the whole person — mood, thoughts, body, and behavior. It's not simply feeling sad for a while, and it's not something a person can just \"snap out of.\" It involves real changes in the brain and body, causing persistent low mood, loss of interest, and a range of physical and emotional symptoms that last for weeks or longer. Understanding it as an illness — like diabetes or heart disease — is the foundation for taking it seriously and helping.\n\n**Why \"it's just aging\" is so harmful**\n\nOlder adults do face real hardships — loss of loved ones, declining health, reduced independence — and feeling grief or sadness about these is normal. But persistent depression is different and is never simply a normal part of aging. The harm of believing it is: when caregivers and families assume an elder's depression is \"just getting old,\" they don't seek help, and a treatable illness goes untreated for months or years. Rejecting this myth is the single most important shift this course asks of you.\n\n**How depression often hides in elders**\n\nHere's what makes elder depression tricky: it frequently doesn't look like obvious sadness or crying. Instead it masks itself as physical complaints — vague aches, pains, fatigue, stomach trouble. As sleep and appetite changes. As irritability or agitation rather than tearfulness. And, importantly, as confusion and memory problems that mimic dementia. So a depressed elder may never say \"I'm depressed\" — they may complain of their body, withdraw, or seem confused. Knowing these hidden faces is how you catch what others miss.\n\n**The depression-that-looks-like-dementia**\n\nThis deserves its own focus. Depression can cause real confusion, memory trouble, and slowed thinking in older adults — a picture called pseudodementia that looks like dementia but isn't. The crucial difference: when the depression is treated, this confusion often lifts and the thinking clears. This means a resident who seems to be \"developing dementia\" may actually have treatable depression. That's why depression should always be considered in a newly confused elder — missing it can mean missing a reversible condition.\n\n**How depression harms the whole body**\n\nDepression isn't only emotional. It drags down physical health in concrete ways: depressed residents often eat poorly, losing weight and strength. They move and exercise less, weakening further. They sleep badly. They manage their chronic conditions worse and take medications less reliably. They heal more slowly. So depression and physical decline feed each other in a downward spiral — which is why treating depression often improves a resident's whole health, not just their mood.\n\n**The most serious risk: suicide**\n\nThis is the gravest fact in the course, and it must be faced directly. Depression is the leading risk factor for suicide, and older adults — especially older men — have some of the highest suicide rates of any age group. Older adults may show fewer obvious warning signs and may express their pain quietly — through hopelessness, talk of being a burden, or wishing not to wake up. Because of this, every expression of wanting to die, every sign of hopelessness, is taken seriously. Recognizing and reporting these signs is, very literally, lifesaving CNA work.\n\n**The good news: depression is treatable**\n\nEnd on the truth that makes all of this matter: depression is highly treatable. With professional treatment — therapy, medication, or both — plus social connection, activity, and support, most older adults with depression improve, often a great deal. Treatment can bring back appetite, energy, clear thinking, joy, and the will to live. Your role in recognizing it, reporting it, and supporting the resident through connection is what helps a treatable illness actually get treated. Hope is realistic here." },
            { id: 'dep-s04-elder-callout', type: 'callout', variant: "clinical", title: "Grief about real losses is normal. Persistent depression is illness, not aging.", body: "Depression can mimic dementia through pseudodementia — confusion that often lifts with treatment. Consider depression in every newly confused elder." },
          ]),
      },
    ],
  },
  {
    slug: 'module-2',
    title: "Recognition, Prevention, and CNA Role",
    sortOrder: 1,
    lessons: [
      {
        slug: 's05-signs',
        title: "Signs & Symptoms",
        sortOrder: 0,
        buildContent: () =>
          doc("Signs & Symptoms", [
            { id: 'dep-s05-heading', type: 'heading', level: 1, text: "Signs & Symptoms" },
            {
              id: 'dep-s05-image',
              type: 'image',
              src: `${ASSET_BASE}/s05-hero.png`,
              caption:
                'Recognizing the signs — changes in mood, appetite, sleep, energy, and interest.',
            },
            { id: 'dep-s05-narration', type: 'text', body: "Recognizing depression means knowing both its classic signs and the hidden ways it shows in elders — and knowing the warning signs that must never be missed. Let's learn them.\n\n**The core signs of depression**\n\nThe classic signs: persistent sadness, a low or empty mood most of the day, most days. Loss of interest or pleasure in activities once enjoyed — the resident who's stopped caring about hobbies, visits, or things they loved. Feelings of hopelessness, worthlessness, or excessive guilt. Low energy and fatigue. Trouble concentrating or making decisions. And changes in sleep and appetite. When several of these persist for weeks, especially a low mood plus lost interest, depression is likely — and reportable.\n\n**The masked and elder-specific signs**\n\nNow the hidden faces, because elders often don't show classic sadness. Watch for: increased physical complaints — aches, pains, fatigue, stomach problems — without a clear cause. Withdrawal and isolation, pulling away from people and activities. Not eating, and losing weight. Sleeping too much or too little. Irritability, agitation, or restlessness rather than obvious sadness. Neglecting self-care or appearance. New or worsening confusion and memory problems. And a general decline or \"giving up.\" Any of these, especially as a change from the resident's normal, can signal depression hiding in plain sight.\n\n**The suicide-warning signs**\n\nThese are the most important signs in this course, and they're taken with absolute seriousness. Watch and listen for: any talk of wanting to die, not wanting to live, or being \"better off gone\" — said directly or in passing. Expressions of hopelessness, of having no future, or of being a burden to others. Saying goodbye, giving away cherished belongings, or putting affairs in order. Deep withdrawal. And, importantly, a sudden, unexpected calm or improvement after a period of severe depression, which can mean a person has resolved on a plan. Take every one of these seriously, every time — there is no such thing as someone \"just talking.\" Statements of wanting to die are never dismissed, joked about, or kept secret.\n\n**What to do, and what to report**\n\nSo what do you do? For signs of depression: report your observations to the nurse — the withdrawal, the not eating, the lost interest, the hopelessness — so the resident can be assessed. For any suicide-warning sign, the response is immediate and specific: take it seriously, stay with the resident — do not leave them alone — express care, and report it to the nurse right away. Never promise to keep it secret, even if asked; a resident's safety comes before a promise of secrecy. You don't have to counsel or fix it — you have to recognize it, stay, and get help now. That response saves lives.\n\n**Summary**\n\nFour pictures. Core signs: persistent low mood, lost interest, hopelessness, fatigue, sleep and appetite changes. Masked elder signs: physical complaints, withdrawal, not eating, irritability, new confusion, decline. Suicide-warning signs: any talk of wanting to die, hopelessness, being a burden, giving things away, sudden calm after deep depression. Response: take seriously, stay with them, report immediately, never promise secrecy.\n\nThe rule underneath it all: watch for depression's signs — classic and hidden — and report them; and for any suicide-warning sign, take it seriously, stay with the resident, and report immediately, never keeping it secret." },
            { id: 'dep-s05-suicide-callout', type: 'callout', variant: "warning", title: "Suicide-warning signs", body: "Any talk of wanting to die, hopelessness, or being a burden is taken seriously every time. Stay with the resident, report immediately, and never promise secrecy." },
          ]),
      },
      {
        slug: 's06-causes',
        title: "Causes",
        sortOrder: 1,
        buildContent: () =>
          doc("Causes", [
            { id: 'dep-s06-heading', type: 'heading', level: 1, text: "Causes" },
            pendingAudio(
              'dep-s06-audio',
              "What Contributes to Depression in Older Adults — and What a CNA Can Influence",
              `${ASSET_BASE}/s06-causes-podcast.mp3`,
              "What Contributes to Depression in Older Adults — and What a CNA Can Influence\n\nDepression in older adults usually arises from several causes working together — biological, medical, and social — and understanding them does two things: it dispels the idea that depression is a weakness or a choice, and it reveals where caregivers can genuinely help.\n\nOn the biological side, depression involves real changes in brain chemistry and function. There can be a genetic tendency, and aging itself, along with certain illnesses, can affect the brain systems that regulate mood. This is part of why depression is a medical illness, not a failure of will.\n\nMedical factors loom large in elders. Many chronic illnesses are linked to depression — stroke, Parkinson's disease, heart disease, diabetes, cancer, chronic pain, and thyroid problems among them — both because of their effects on the body and brain and because of the burden of living with them. Many medications can contribute to depression as a side effect. And conditions that cause disability, pain, or loss of function are especially tied to it. So a depressed elder very often has real medical contributors, which is one more reason it deserves medical attention.\n\nBut for the residents you care for, the social and emotional causes are often the most powerful — and the most relevant to your work. Older adults in long-term care frequently face an accumulation of losses: the death of spouses, friends, and peers; loss of their home and independence; loss of health, mobility, and roles that gave life meaning; and separation from family and community. On top of loss comes isolation and loneliness, which are both causes and consequences of depression, and which long-term care can unfortunately deepen. Reduced activity, lack of purpose, and feeling unneeded or forgotten all feed it. These are heavy, real burdens — not imagined or self-indulgent.\n\nHere's why this matters for the CNA: while you can't change a resident's medical history or undo their losses, you have real power over some of the most important contributors — isolation, loneliness, lack of engagement, and the feeling of not mattering. Genuine human connection, conversation, companionship, involvement in activities, being known and valued, having small purposes and pleasures restored — these directly counter some of the strongest drivers of elder depression. Your warmth and attention aren't just kindness; they're working on real causes. And of course, recognizing and reporting depression gets the medical and professional treatment going for the causes you can't touch.\n\nThe takeaway: depression in elders comes from real biological, medical, and social causes — never from weakness — and while professional treatment addresses much of it, the CNA powerfully influences the social and emotional contributors through connection, engagement, and helping a resident feel they still matter.",
              '/assets/courses/depression/s06-causes-podcast.mp3',
            ),
            {
              id: 'dep-s06-image',
              type: 'image',
              src: `${ASSET_BASE}/s06-hero.png`,
              caption:
                'What contributes to depression — loss, isolation, illness, and life changes.',
            },
          ]),
      },
      {
        slug: 's07-role',
        title: "CNA Role & Best Practices",
        sortOrder: 2,
        buildContent: () =>
          doc("CNA Role & Best Practices", [
            { id: 'dep-s07-heading', type: 'heading', level: 1, text: "CNA Role & Best Practices" },
            {
              id: 'dep-s07-image',
              type: 'image',
              src: `${ASSET_BASE}/s07-hero.png`,
              caption:
                'Your scope — observe, support, and report; CNAs don\'t diagnose or treat.',
            },
            { id: 'dep-s07-scope-callout', type: 'callout', variant: "clinical", title: "Scope of practice", body: "CNAs CONNECT, OBSERVE, SUPPORT, and REPORT. CNAs never diagnose depression, provide therapy or clinical counseling, or give or adjust medications." },
            { id: 'dep-s07-narration', type: 'text', body: "Depression is treated by professionals — but the CNA's daily support, observation, and connection are a real and powerful part of a resident's recovery. Let's walk through it, starting with the rule that never bends, stated firmly because it matters most here. A CNA does not diagnose depression, does not provide therapy or clinical counseling, and does not give or adjust medications. Treatment is the nurse's and the mental-health team's. Your role is connect, observe, support, and report.\n\n**Connection and engagement — the support you deliver daily.** This is your most powerful contribution. A depressed resident needs human connection, and you provide it: genuine warmth and conversation, time and presence, companionship, and gentle encouragement to engage in activities, meals, and life. Encourage — never force — participation in things that once brought them joy, support routines that give structure, and help them feel known, valued, and not alone. This daily connection counters the isolation that feeds depression and is part of real treatment, not just kindness.\n\n**Observation and reporting — getting treatment started.** Because you know each resident's baseline, you're often the first to notice depression — and your reporting is what gets it assessed and treated. Report the signs you see: withdrawal, lost interest, not eating, sleep changes, hopelessness, decline, new confusion. Report a resident who isn't improving. Specific, prompt reporting turns a resident's quiet suffering into professional help.\n\n**Supporting professional treatment.** Once a resident is in treatment, support it: support taking medications as the nurse administers them and report side effects, refusal, or missed doses; remember that antidepressant medications often take several weeks to work, so encourage patience and continued support during that time; support attendance and participation in therapy and activities; and watch for and report changes — both improvement and worsening. You reinforce the treatment plan through daily care.\n\n**The suicide-risk response — know it cold.** This is the most critical protocol in the course. If a resident shows any warning sign — talk of wanting to die, hopelessness, being a burden, giving away belongings, a sudden calm after deep depression — you respond immediately: take it seriously, every time, with no exceptions. Stay with the resident — do not leave them alone. Express care and listen without judgment. And report it to the nurse or supervisor right away. Never promise to keep it secret, even if begged — safety comes before secrecy. You are not expected to counsel, assess risk, or fix it; you are expected to recognize, stay, and escalate now. That is what saves a life.\n\n**Supporting physical health and dignity.** Support the physical side that depression drags down — encourage eating and fluids and report poor intake, support activity and sleep, support self-care and hygiene the resident may be neglecting — and treat the resident with dignity and patience throughout, never with frustration at their depression.\n\nThe scope point for this section: you never diagnose, counsel, or medicate — but you provide the connection and engagement that support recovery, observe and report to get treatment started, support the treatment plan, and respond to suicide-warning signs immediately. Connection, recognition, and escalation are the care you deliver." },
          ]),
      },
      {
        slug: 's08-prevention',
        title: "Prevention & Risk Reduction",
        sortOrder: 3,
        buildContent: () =>
          doc("Prevention & Risk Reduction", [
            { id: 'dep-s08-heading', type: 'heading', level: 1, text: "Prevention" },
            {
              id: 'dep-s08-image',
              type: 'image',
              src: `${ASSET_BASE}/s08-hero.png`,
              caption:
                'Supporting residents with depression — presence, patience, and connection.',
            },
            { id: 'dep-s08-narration', type: 'text', body: "While depression has many causes, CNAs can do real things to support residents' emotional wellbeing and catch depression early. Here are seven ways.\n\n**One. Offer genuine connection, every day.** The simplest and strongest thing you give is real human connection — warm conversation, eye contact, listening, presence, treating each resident as a person who matters. Isolation feeds depression, and your daily connection counters it. A few minutes of genuine attention is care that works on a real cause.\n\n**Two. Counter isolation and loneliness.** Help residents stay connected — to other residents, to activities, to family. Encourage participation in social events and group activities, support visits and calls with loved ones, and watch for residents who are slipping into isolation. Loneliness is one of the heaviest drivers of elder depression, and reducing it is real prevention.\n\n**Three. Support purpose, routine, and small pleasures.** Help residents keep the things that give life meaning — favorite activities, hobbies, roles, routines, and small daily pleasures. Encourage involvement in things they enjoy, support meaningful routines, and help restore the sense of having purpose and something to look forward to. Purpose and pleasure protect against depression.\n\n**Four. Support physical wellbeing.** Body and mood are linked. Support good nutrition, hydration, activity and movement, time outdoors and in natural light where possible, and healthy sleep. Help manage pain and physical complaints by reporting them. A resident whose physical needs are supported has stronger defenses against depression.\n\n**Five. Know each resident's baseline — and watch for change.** Because you know each resident's normal, you can catch the changes that signal depression early: new withdrawal, lost interest, not eating, irritability, decline. Watching for departures from baseline, and reporting them, catches depression before it deepens. Early recognition is prevention of suffering.\n\n**Six. Treat every resident with dignity and patience.** How a resident is treated affects their emotional health. Patience, respect, kindness, preserving dignity and choice, and never showing frustration with a depressed or struggling resident all support wellbeing. Feeling respected and valued protects mood; feeling dismissed or burdensome harms it.\n\n**Seven. Take warning signs seriously — always.** The most important prevention of tragedy: never dismiss talk of wanting to die, hopelessness, or being a burden as \"just talk.\" Take every such sign seriously, stay with the resident, and report immediately. Vigilance for these signs, every single time, is how lives are saved. This is prevention at its most vital." },
          ]),
      },
    ],
  },
  {
    slug: 'module-3',
    title: "Action, Judgment, and Application",
    sortOrder: 2,
    lessons: [
      {
        slug: 's09-scenario',
        title: "Scenario & Reporting",
        sortOrder: 0,
        buildContent: () =>
          doc("Scenario & Reporting", [
            { id: 'dep-s09-heading', type: 'heading', level: 1, text: "Scenario & Reporting" },
            pendingAudio(
              'dep-s09-intro-audio',
              "Emergency response scenarios intro",
              `${ASSET_BASE}/s09-emergency-intro.mp3`,
              "In mental health care, the judgments that matter most are recognizing a possible suicide-warning sign and responding correctly, and recognizing depression hiding behind something else. You're about to work through two situations. Read each carefully, choose your action, and you'll get feedback right away. Keep the core ideas in mind: any talk of wanting to die is taken seriously, you stay with the resident and report immediately, and you never promise secrecy — and depression in elders often hides behind physical complaints and confusion.",
              '/assets/courses/depression/s09-emergency-intro.mp3',
            ),
            {
              id: 'dep-s09-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-hero.png`,
              caption:
                'Recognizing warning signs and knowing when to escalate — some changes can\'t wait.',
            },
            {
              id: 'dep-s09-scenario-davies-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-scenario-davies.png`,
              caption:
                'Any talk of not wanting to live is taken seriously — never keep it secret, don\'t leave the resident alone, and tell the nurse right away.',
            },
            { id: 'dep-s09-scenario-davies', type: 'scenario_question', prompt: "While you're helping Mr. Davies, who has seemed deeply down for weeks, he says quietly, \"You know, everyone would be better off without me. I don't see the point in going on. Don't tell anyone I said that — promise me.\" He seems to mean it. What SHOULD the CNA do?", options: [
                {
                  "id": "promise-secrecy",
                  "label": "Promise not to tell anyone, since he asked, and change the subject",
                  "feedback": "Mr. Davies expressed hopelessness, feeling like a burden, and not wanting to go on — serious suicide-warning signs that are always taken seriously. Promising secrecy, reassuring-and-leaving, or dismissing it could be fatal. The right response: take it seriously, stay with him, report to the nurse immediately, and never promise secrecy — safety comes first."
                },
                {
                  "id": "stay-report-no-secrecy",
                  "label": "Take it seriously, stay with him, express care, report it to the nurse immediately, and do NOT promise secrecy",
                  "feedback": "Right — and this is the most important judgment in the course. Mr. Davies has expressed hopelessness, feeling like a burden, and not seeing the point in going on — clear warning signs that he may be at risk of suicide, made more serious by weeks of depression. Every such statement is taken seriously, every time; there is no \"just talk\" here. So you stay with him — you do not leave him alone — you respond with genuine care and listen without judging or arguing, and you report it to the nurse or supervisor immediately so he can get help. Critically, you do NOT promise to keep it secret, even though he asked: his safety comes before any promise of secrecy, and you can tell him gently that you care too much to keep this to yourself and that you're going to make sure he gets support. You don't have to counsel him or fix it — you recognize, stay, and escalate now. That response can save his life.",
                  "isRecommended": true
                },
                {
                  "id": "reassure-move-on",
                  "label": "Reassure him he's fine and move on to the next resident",
                  "feedback": "Mr. Davies expressed hopelessness, feeling like a burden, and not wanting to go on — serious suicide-warning signs that are always taken seriously. Promising secrecy, reassuring-and-leaving, or dismissing it could be fatal. The right response: take it seriously, stay with him, report to the nurse immediately, and never promise secrecy — safety comes first."
                },
                {
                  "id": "dismiss-leave-alone",
                  "label": "Tell him not to talk like that and leave him alone to rest",
                  "feedback": "Mr. Davies expressed hopelessness, feeling like a burden, and not wanting to go on — serious suicide-warning signs that are always taken seriously. Promising secrecy, reassuring-and-leaving, or dismissing it could be fatal. The right response: take it seriously, stay with him, report to the nurse immediately, and never promise secrecy — safety comes first."
                }
              ], requiredForCompletion: true },
            {
              id: 'dep-s09-scenario-russo-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-scenario-russo.png`,
              caption:
                'Depression in older adults is often mistaken for aging or dementia — report the changes rather than dismissing them.',
            },
            { id: 'dep-s09-scenario-russo', type: 'scenario_question', prompt: "Mrs. Russo, usually engaged and social, has changed over several weeks: she's withdrawn from activities, stopped eating much and lost weight, complains often of vague aches and fatigue with no clear medical cause, and seems newly forgetful and confused. A coworker says, \"She's just getting old — the confusion is probably dementia starting, and old people get aches.\" What SHOULD the CNA do?", options: [
                {
                  "id": "agree-aging",
                  "label": "Agree it's just aging and dementia, and not report it",
                  "feedback": "New withdrawal, not eating, vague physical complaints, and new confusion together can be depression masked behind physical symptoms and dementia-like confusion — and that confusion may even be treatable pseudodementia. Dismissing it as \"just aging and dementia,\" saying \"cheer up,\" or waiting could miss a treatable illness. The right action: report the full cluster of changes to the nurse for assessment."
                },
                {
                  "id": "report-cluster",
                  "label": "Report the cluster of changes to the nurse — withdrawal, not eating, physical complaints, and new confusion can be depression, which is treatable",
                  "feedback": "Right. This cluster — new withdrawal, loss of interest, not eating with weight loss, unexplained physical complaints, and new confusion — is a classic picture of depression hiding in an older adult, behind physical symptoms and dementia-like confusion. The \"it's just aging and dementia\" response is exactly the trap this course warns about: it dismisses treatable illness as normal aging. Importantly, that new confusion could be pseudodementia — depression causing dementia-like symptoms that often lift when the depression is treated — so calling it \"dementia starting\" and giving up could miss a reversible condition. Report the full cluster of changes to the nurse so Mrs. Russo can be properly assessed. Don't tell a depressed person to \"cheer up,\" and don't wait months. Recognizing masked depression and reporting it is how a suffering resident gets the treatment that can give her back her appetite, her clarity, and her joy.",
                  "isRecommended": true
                },
                {
                  "id": "cheer-up-eat",
                  "label": "Tell her to cheer up and eat more",
                  "feedback": "New withdrawal, not eating, vague physical complaints, and new confusion together can be depression masked behind physical symptoms and dementia-like confusion — and that confusion may even be treatable pseudodementia. Dismissing it as \"just aging and dementia,\" saying \"cheer up,\" or waiting could miss a treatable illness. The right action: report the full cluster of changes to the nurse for assessment."
                },
                {
                  "id": "wait-months",
                  "label": "Wait several more months to see if it gets worse",
                  "feedback": "New withdrawal, not eating, vague physical complaints, and new confusion together can be depression masked behind physical symptoms and dementia-like confusion — and that confusion may even be treatable pseudodementia. Dismissing it as \"just aging and dementia,\" saying \"cheer up,\" or waiting could miss a treatable illness. The right action: report the full cluster of changes to the nurse for assessment."
                }
              ], requiredForCompletion: true },
          ]),
      },
      {
        slug: 's10-cna-role',
        title: "CNA's Role in Care",
        sortOrder: 1,
        buildContent: () =>
          doc("CNA's Role in Care", [
            { id: 'dep-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
              id: 'dep-s10-video',
              type: 'video',
              title: 'The CNA\'s Role',
              videoUrl: '/assets/courses/depression/s10-cna-role.mp4',
              placeholderNote: 'Pending upload: /assets/courses/depression/s10-cna-role.mp4',
            },
            {
              id: 'dep-s10-image',
              type: 'image',
              src: `${ASSET_BASE}/s10-hero.png`,
              caption:
                'Your role — noticing changes, offering compassion, and reporting concerns.',
            },
            { id: 'dep-s10-narration', type: 'text', body: "Your role in depression care is connection, recognition, escalation, and compassionate support — and it can be lifesaving. Let's walk through it.\n\n**Provide connection and engagement** Your most powerful daily contribution is genuine human connection. Offer warmth, conversation, presence, and time; encourage — never force — engagement in activities, meals, and the things that bring meaning; counter isolation; and help each resident feel known, valued, and not alone. For a depressed resident, this connection isn't just kindness — it works on the loneliness that feeds depression, and it's part of real recovery.\n\n**Recognize what others miss** Be the watchful eyes. Because you know each resident's baseline, you catch depression early — including its hidden faces: physical complaints, withdrawal, not eating, irritability, decline, and the new confusion of pseudodementia. Report what you see, specifically and promptly, so a suffering resident gets assessed and treated. Recognizing depression that's dismissed as \"just aging\" is one of the most valuable things you do.\n\n**Respond to warning signs immediately** Know the lifesaving protocol cold. For any suicide-warning sign — talk of wanting to die, hopelessness, being a burden, giving things away, a sudden calm after deep depression — take it seriously every time, stay with the resident and never leave them alone, respond with care, and report it immediately. Never promise secrecy, even if asked — safety comes first. You don't have to assess risk or counsel; you recognize, stay, and escalate. This response saves lives.\n\n**Support treatment, health, and dignity** Support the whole resident and the treatment plan. Support medications as administered and report side effects or refusal, remembering antidepressants take weeks to work; support therapy and activity participation; encourage eating, sleep, activity, and self-care that depression undermines; and treat the resident with unfailing dignity and patience, never frustration. Report improvement and worsening alike, so care stays on track.\n\nNow the boundary, stated plainly because it defines this role. You do not diagnose depression. You do not provide therapy or clinical counseling. You do not give or adjust medications. And you never dismiss a warning sign, never promise to keep suicidal talk secret, never leave an at-risk resident alone, and never treat a depressed resident with impatience or blame.\n\nInside your role — connection, recognition, immediate escalation, and compassionate support — you help a treatable illness get treated, you counter the isolation that deepens it, and you may, by recognizing and reporting a warning sign, save a resident's life. Few things a CNA does matter more." },
            { id: 'dep-s10-scope-callout', type: 'callout', variant: "clinical", title: "Stay within scope", body: "You do not diagnose depression, provide therapy or clinical counseling, or give or adjust medications. Never dismiss a warning sign, never promise secrecy, and never leave an at-risk resident alone." },
          ]),
      },
      {
        slug: 's11-case-study',
        title: "Case Study",
        sortOrder: 2,
        buildContent: () =>
          doc("Brief Case Study", [
            { id: 'dep-s11-heading', type: 'heading', level: 1, text: "Brief Case Study" },
            pendingAudio(
              'dep-s11-audio',
              "The Quiet One",
              `${ASSET_BASE}/s11-case-podcast.mp3`,
              "Mr. Davies, 78, a retired schoolteacher, had been at the facility for a year. He'd never been loud, but his CNA, Grace, who knew his baseline well, noticed him changing over several weeks. He stopped coming to the activities he'd quietly enjoyed. He let his meals sit, and he'd lost weight. He complained more often of vague aches and tiredness that the nurse could find no clear cause for. He seemed, somehow, to be folding inward — present, but fading.\n\n**What others assumed:** Some staff saw it as nothing remarkable. \"He's just getting old,\" one said. \"Quiet man, slowing down, a few aches — that's eighty for you.\" It was the easy reading, and the wrong one. Grace had learned in her training that this exact picture — withdrawal, loss of interest, not eating, unexplained physical complaints, fading — is often how depression hides in an older adult, behind the body and behind the assumption that decline is just age. She didn't dismiss it.\n\n**The conversation:** One afternoon, helping him with his care, Grace simply sat with him a moment and said gently, \"You haven't seemed yourself lately, Mr. Davies. I've noticed, and I care how you're doing.\" He was quiet for a long moment. Then, softly, he said the thing that changed everything: \"You know, everyone would be better off without me. I don't see the point in going on anymore.\" And then: \"Don't tell anyone I said that. Promise me.\"\n\n**What Grace did — exactly right:** Grace's training took over, and she did the four things that matter. She took it completely seriously — no nervous laugh, no \"oh, don't talk like that,\" no pretending she hadn't heard. She stayed with him — she did not leave him alone, even as her mind raced. She responded with genuine care, sitting with him, letting him know he mattered and that she was glad he'd told her. And she did not promise secrecy — instead she said gently and honestly: \"Mr. Davies, I care about you too much to keep that to myself. I'm not going to leave you alone with this, and I'm going to make sure you get some real support. That's because you matter — not the opposite.\" She stayed with him and got word to the nurse immediately.\n\n**The response:** Because Grace recognized the warning signs and escalated right away — without leaving him and without promising secrecy — Mr. Davies was assessed promptly by the nurse and the team, kept safe, and connected to professional mental health care. He was found to have a serious, treatable depression that had been quietly deepening for months behind his aches and his quietness. With treatment — therapy, medication, and the team's support — and with the daily connection Grace and others gave him, he slowly came back. The aches eased. He ate again. Months later, he was back at the activity table, even teaching a few residents chess.\n\n**The outcome:** Mr. Davies lived, and recovered, and found his way back to a life with meaning in it. And it turned on a CNA who refused to call his fading \"just aging,\" who noticed and cared enough to gently ask, who recognized a life-threatening warning sign for what it was, and who did the four right things: took it seriously, stayed, reported immediately, and didn't promise secrecy. The nurse told Grace afterward: \"The 'he's just getting old' version of this story ends very differently. You saw a person, not an age. You knew what those words meant, and you did exactly the right things in exactly the right order. That's a life still here.\"\n\n**Discussion:** Grace's case holds the whole course. She knew depression hides in elders behind physical complaints and quiet fading, so she didn't accept \"just getting old.\" Her daily connection and genuine care opened the door for him to speak. And when he revealed a suicide-warning sign, she executed the lifesaving protocol precisely: took it seriously, stayed with him, reported immediately, and refused to promise secrecy — choosing his safety over his request. She never diagnosed, counseled, or treated; she recognized, stayed, and escalated, exactly her role. Connection, recognition, and the right response, in order — that is how a CNA can save a life.",
              '/assets/courses/depression/s11-case-podcast.mp3',
            ),
            {
              id: 'dep-s11-image',
              type: 'image',
              src: `${ASSET_BASE}/s11-hero.png`,
              caption:
                'Putting it together — attentive, compassionate support for residents with depression.',
            },
            { id: 'dep-s11-case-study', type: 'case_study', title: "The Quiet One", residentProfile: "Mr. Davies, 78, a retired schoolteacher, had been at the facility for a year. He'd never been loud, but his CNA, Grace, who knew his baseline well, noticed him changing over several weeks. He stopped coming to the activities he'd quietly enjoyed. He let his meals sit, and he'd lost weight. He complained more often of vague aches and tiredness that the nurse could find no clear cause for. He seemed, somehow, to be folding inward — present, but fading.", scenario: "**What others assumed:** Some staff saw it as nothing remarkable. \"He's just getting old,\" one said. \"Quiet man, slowing down, a few aches — that's eighty for you.\" It was the easy reading, and the wrong one. Grace had learned in her training that this exact picture — withdrawal, loss of interest, not eating, unexplained physical complaints, fading — is often how depression hides in an older adult, behind the body and behind the assumption that decline is just age. She didn't dismiss it.\n\n**The conversation:** One afternoon, helping him with his care, Grace simply sat with him a moment and said gently, \"You haven't seemed yourself lately, Mr. Davies. I've noticed, and I care how you're doing.\" He was quiet for a long moment. Then, softly, he said the thing that changed everything: \"You know, everyone would be better off without me. I don't see the point in going on anymore.\" And then: \"Don't tell anyone I said that. Promise me.\"\n\n**What Grace did — exactly right:** Grace's training took over, and she did the four things that matter. She took it completely seriously — no nervous laugh, no \"oh, don't talk like that,\" no pretending she hadn't heard. She stayed with him — she did not leave him alone, even as her mind raced. She responded with genuine care, sitting with him, letting him know he mattered and that she was glad he'd told her. And she did not promise secrecy — instead she said gently and honestly: \"Mr. Davies, I care about you too much to keep that to myself. I'm not going to leave you alone with this, and I'm going to make sure you get some real support. That's because you matter — not the opposite.\" She stayed with him and got word to the nurse immediately.\n\n**The response:** Because Grace recognized the warning signs and escalated right away — without leaving him and without promising secrecy — Mr. Davies was assessed promptly by the nurse and the team, kept safe, and connected to professional mental health care. He was found to have a serious, treatable depression that had been quietly deepening for months behind his aches and his quietness. With treatment — therapy, medication, and the team's support — and with the daily connection Grace and others gave him, he slowly came back. The aches eased. He ate again. Months later, he was back at the activity table, even teaching a few residents chess.\n\n**The outcome:** Mr. Davies lived, and recovered, and found his way back to a life with meaning in it. And it turned on a CNA who refused to call his fading \"just aging,\" who noticed and cared enough to gently ask, who recognized a life-threatening warning sign for what it was, and who did the four right things: took it seriously, stayed, reported immediately, and didn't promise secrecy. The nurse told Grace afterward: \"The 'he's just getting old' version of this story ends very differently. You saw a person, not an age. You knew what those words meant, and you did exactly the right things in exactly the right order. That's a life still here.\"\n\n**Discussion:** Grace's case holds the whole course. She knew depression hides in elders behind physical complaints and quiet fading, so she didn't accept \"just getting old.\" Her daily connection and genuine care opened the door for him to speak. And when he revealed a suicide-warning sign, she executed the lifesaving protocol precisely: took it seriously, stayed with him, reported immediately, and refused to promise secrecy — choosing his safety over his request. She never diagnosed, counseled, or treated; she recognized, stayed, and escalated, exactly her role. Connection, recognition, and the right response, in order — that is how a CNA can save a life." },
            { id: 'dep-s11-reflection-1', type: 'reflection', prompt: "Mr. Davies asked Grace to promise to keep his words secret. Why was it right for her NOT to promise secrecy, and what were the four key things she did in response to his warning signs?", minCharacters: 50 },
            { id: 'dep-s11-reflection-2', type: 'reflection', prompt: "Other staff read Mr. Davies's withdrawal, not eating, and aches as \"just getting old.\" Why is that assumption so dangerous, and how did Grace's understanding of masked depression change the outcome?", minCharacters: 50 },
            { id: 'dep-s11-rp-text', type: 'text', body: "Reflect on the case study in the previous lesson. Your written responses help you apply what you learned about masked depression, the suicide-warning-sign response, and faithful reporting." },
            { id: 'dep-s11-kc2-check', type: 'knowledge_check', question: "A CNA does not diagnose depression, does not provide therapy or clinical counseling, and does not give or adjust medications. While you're helping Mr. Davies, who has seemed deeply down for weeks, he says quietly, \"You know, everyone would be better off without me. I don't see the point in going on. Don't tell anyone I said that — promise me.\" He seems to mean it. What SHOULD the CNA do?", options: [
                {
                  "id": "promise-secrecy",
                  "label": "Promise not to tell anyone, since he asked, and change the subject"
                },
                {
                  "id": "stay-report-no-secrecy",
                  "label": "Take it seriously, stay with him, express care, report it to the nurse immediately, and do NOT promise secrecy"
                },
                {
                  "id": "reassure-move-on",
                  "label": "Reassure him he's fine and move on to the next resident"
                },
                {
                  "id": "dismiss-leave-alone",
                  "label": "Tell him not to talk like that and leave him alone to rest"
                }
              ], correctOptionId: "stay-report-no-secrecy", explanation: "You never diagnose, counsel, or medicate — but your urgent recognition, staying with the resident, and immediate reporting of suicide-warning signs are exactly what saves lives.", requiredForCompletion: true, meta: { flaggedFiller: true } },
          ]),
      },
      {
        slug: 's12-conclusion',
        title: "Conclusion",
        sortOrder: 3,
        buildContent: () =>
          doc("Conclusion", [
            { id: 'dep-s12-heading', type: 'heading', level: 1, text: "Conclusion" },
            {
              id: 'dep-s12-video',
              type: 'video',
              title: 'Conclusion',
              videoUrl: '/assets/courses/depression/s12-conclusion.mp4',
              placeholderNote: 'Pending upload: /assets/courses/depression/s12-conclusion.mp4',
            },
            {
              id: 'dep-s12-image',
              type: 'image',
              src: `${ASSET_BASE}/s12-hero.png`,
              caption:
                'Caring with awareness — recognizing depression and connecting residents to help.',
            },
            { id: 'dep-s12-narration', type: 'text', body: "You've reached the end. Let's lock in the five things that matter most for recognizing and supporting depression in older adults.\n\n**One.** Depression is NOT a normal part of aging — it's a common, serious, and treatable medical illness. Believing it's \"just getting old\" is how it gets missed. It causes real suffering, worsens physical health, can mimic dementia, and is the leading risk factor for suicide. Rejecting the myth is the first step to helping.\n\n**Two.** Know depression's signs — including the hidden ones. The classic signs are persistent low mood, lost interest, hopelessness, fatigue, and sleep and appetite changes. But in elders it often hides as physical complaints, withdrawal, not eating, irritability, decline, and new confusion that can mimic dementia but may lift with treatment. Watch for changes from each resident's baseline, and report them.\n\n**Three.** Connection is part of the care. Your genuine warmth, conversation, presence, and encouragement to engage counter the isolation that feeds depression — real prevention and real support. Report what you see so a suffering resident gets assessed and treated, and support the treatment plan, remembering antidepressants take weeks to work.\n\n**Four.** Know the lifesaving response to suicide-warning signs. For any sign — talk of wanting to die, hopelessness, being a burden, giving things away, a sudden calm after deep depression — take it seriously every time, stay with the resident and never leave them alone, report immediately, and never promise secrecy. You don't have to fix it — you recognize, stay, and escalate. That saves lives.\n\n**Five.** Honor your scope, with compassion and hope. You never diagnose, counsel, or medicate — but you provide connection, recognize what others miss, support treatment, and escalate warning signs. And carry the hope that's real: depression is highly treatable, and most older adults improve with care. Your recognition and reporting help that happen." },
            { id: 'dep-s12-summary', type: 'summary', title: "Five things that matter most", items: ["Depression is NOT normal aging — it's a common, serious, treatable medical illness.","Know the signs — classic and hidden — and report changes from each resident's baseline.","Connection is part of the care — warmth, engagement, and faithful reporting get treatment started.","Suicide-warning signs: take seriously, stay with the resident, report immediately, never promise secrecy.","Honor your scope — connect, recognize, support, and escalate with compassion and hope."] },
            { id: 'dep-s12-whn-text', type: 'text', body: "Ten questions are waiting. Everything on them was covered here. You're ready. Trust what you've learned, and show what you know." },
            { id: 'dep-s12-cr-text', type: 'text', body: "This course provides one hour of continuing education credit through CAL ACE Nursing Academy, an approved CDPH continuing education provider, NAC number 7384. Your certificate is generated automatically when you pass the knowledge check." },
            { id: 'dep-s12-cr-callout', type: 'callout', variant: "info", title: "Scope reminder", body: "CNAs recognize, connect, support, and report. CNAs do not diagnose depression, provide therapy or clinical counseling, or give or adjust medications." },
            { id: 'dep-s12-ca-text', type: 'text', body: "Your certificate is generated automatically when you pass the knowledge check. CDPH-Approved CE Provider — NAC #7384." },
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

export async function seedCourse44Depression(
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
    `Seeding Course 44 (Recognizing & Supporting Depression in Older Adults) as DRAFT — slug "${COURSE_SLUG}"…`,
  );

  try {
    const result = await seedCourse44Depression(prisma);
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
    console.log(`  Sections: ${PACKAGE_SECTION_LESSON_SLUGS.length} package sections mapped`);
    console.log(`  Strays cleaned: ${result.strayLessonsDeleted} lessons`);
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
