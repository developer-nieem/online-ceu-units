/**
 * Seed Course 46 — Alcohol Use Disorder in Older Adults (DRAFT).
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-46-alcohol-use-disorder
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
const COURSE_SLUG = 'alcohol-use-disorder';
const COURSE_TITLE = 'Substance Use in Older Adults: Alcohol-Related Care Concerns';
const COURSE_SUMMARY =
  'Learn the CNA\'s role with alcohol use disorder in older adults — understanding it as a treatable medical condition (not a moral failing), recognizing the hidden signs in elders, understanding why aging bodies are more vulnerable to alcohol, the danger of alcohol-medication interactions, recognizing alcohol withdrawal as a potential medical emergency, supporting recovery without judgment, and reporting faithfully. CNAs do not diagnose, counsel, manage withdrawal, give or adjust medications, or police a resident\'s drinking.';

const ASSET_BASE = `/assets/courses/alcohol-use-disorder`;

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
    'Understand alcohol use disorder as a treatable illness, not a moral failing.',
    'Recognize its hidden signs in elders.',
    'Understand alcohol\'s special dangers and interactions.',
    'Recognize alcohol withdrawal as an emergency.',
    'Support recovery without judgment — and know your scope.',
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
  heroImage: '/assets/courses/alcohol-use-disorder/hero-banner.png',
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
    title: "Understanding Alcohol Use Disorder in Older Adults",
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: "Introduction",
        sortOrder: 0,
        buildContent: () =>
          doc("Welcome", [
            { id: 'aud-s01-heading', type: 'heading', level: 1, text: "Welcome" },
            {
              id: 'aud-s01-video',
              type: 'video',
              title: 'Introduction',
              videoUrl: '/assets/courses/alcohol-use-disorder/s01-intro.mp4',
              placeholderNote: 'Pending upload: /assets/courses/alcohol-use-disorder/s01-intro.mp4',
            },
            {
              id: 'aud-s01-image',
              type: 'image',
              src: `${ASSET_BASE}/s01-hero.png`,
              caption:
                'Alcohol use disorder — providing compassionate, non-judgmental care for residents in recovery.',
            },
            { id: 'aud-s01-narration', type: 'text', body: "Welcome to CAL ACE Nursing Academy.\n\nThis course is about alcohol use disorder in older adults — a serious, common, and dangerously overlooked problem in elder care, and one where understanding, vigilance, and zero judgment from a CNA make a real difference.\n\nLet's start with what it is, and what it isn't. Alcohol use disorder is a medical condition in which a person can't control their drinking despite it harming their health, safety, or life. It is not a moral failing, not weakness, and not simply \"bad behavior.\" It's a recognized illness with biological roots — and, importantly, it's treatable, and people recover at every age. Approaching it as an illness rather than a character flaw isn't just kinder; it's accurate, and it's the foundation of helping.\n\nNow, why this matters so much in older adults — and why it hides. Alcohol problems in elders are widely under-recognized, because they don't look the way people expect. An older person's heavy drinking may be invisible — done alone, at home, without the work or social fallout that flags it in younger people. And its effects are easily blamed on aging or other conditions: falls, confusion, memory problems, poor balance, and self-neglect get chalked up to \"just getting old\" or to dementia, when alcohol is the cause. So the problem is both hidden and disguised — which is exactly why a watchful CNA matters.\n\nHere's what makes alcohol especially dangerous for the residents you care for. Aging bodies handle alcohol far worse — the same drink hits an older person harder and lingers longer, so even \"moderate\" drinking can cause real harm. Alcohol multiplies the risk of falls, confusion, and injury. And most dangerously, alcohol interacts badly with the many medications elders take — sedatives, pain medications, blood thinners, diabetes and blood-pressure drugs and more — interactions that can be serious or life-threatening.\n\nThis course also teaches something you must take with absolute seriousness: alcohol withdrawal can be a medical emergency. When someone who drinks heavily suddenly stops — as can happen when a resident is admitted to a facility — they can develop dangerous, even life-threatening withdrawal. Recognizing the early signs and reporting them immediately can save a life. You will not manage withdrawal — you will recognize it and escalate it fast.\n\nYour scope is clear. A CNA recognizes the hidden signs of alcohol problems and the emergency of withdrawal, supports residents without judgment, watches for interactions and injury, and reports faithfully and urgently. A CNA does not diagnose, does not counsel or manage withdrawal, does not give or adjust medications, and does not police, shame, or lecture a resident about drinking.\n\nBy the end of this course, you will be able to: understand alcohol use disorder as a treatable illness. Recognize its hidden signs in elders. Understand alcohol's special dangers and interactions. Recognize alcohol withdrawal as an emergency. And support recovery without judgment.\n\nThere is a ten-question knowledge check at the end. Everything on it is covered here. Let's begin." },
            { id: 'aud-s01-ci-text', type: 'text', body: "This course teaches the CNA's role with alcohol use disorder in older adults — understanding it as a treatable medical condition (not a moral failing), recognizing the hidden signs in elders, understanding why aging bodies are more vulnerable to alcohol, the danger of alcohol-medication interactions, recognizing alcohol withdrawal as a potential medical emergency, supporting recovery without judgment, and reporting faithfully.\n\nLet's be clear about your role. A CNA recognizes the hidden signs of alcohol problems and the emergency of withdrawal, supports residents without judgment, watches for interactions and injury, and reports faithfully and urgently. A CNA does not diagnose, does not counsel or manage withdrawal, does not give or adjust medications, and does not police, shame, or lecture a resident about drinking. Those are nursing and addiction-team tasks. But none of them can happen without your careful observation and faithful reporting first." },
            { id: 'aud-s01-ci-scope-callout', type: 'callout', variant: "clinical", title: "Scope of this course", body: "CNAs RECOGNIZE, WATCH, SUPPORT WITHOUT JUDGMENT, and REPORT. CNAs do not diagnose, counsel, manage withdrawal, give or adjust medications, or police a resident's drinking." },
            { id: 'aud-s01-lo-text', type: 'text', body: "By the end of this course, you will be able to:" },
            { id: 'aud-s01-lo-summary', type: 'summary', title: "Learning objectives", items: ["Understand alcohol use disorder as a treatable illness, not a moral failing.","Recognize its hidden signs in elders.","Understand alcohol's special dangers and interactions.","Recognize alcohol withdrawal as an emergency.","Support recovery without judgment — and know your scope."] },
          ]),
      },
      {
        slug: 's02-terms',
        title: "Terms & Definitions",
        sortOrder: 1,
        buildContent: () =>
          doc("Key terms", [
            { id: 'aud-s02-heading', type: 'heading', level: 1, text: "Key terms" },
            {
              id: 'aud-s02-image',
              type: 'image',
              src: `${ASSET_BASE}/s02-hero.png`,
              caption:
                'Key terms — alcohol use disorder, dependence, withdrawal, tolerance, recovery, non-judgmental care.',
            },
            { id: 'aud-s02-reveal-aud', type: 'reveal_card', frontTitle: "Alcohol Use Disorder (AUD)", frontBody: "Alcohol use disorder", backTitle: "Alcohol Use Disorder (AUD)", backBody: "A medical condition in which a person can't control their drinking despite harm to their health, safety, or life. It ranges from mild to severe. It is a treatable illness with biological roots — not a moral failing or weakness. People recover at every age." },
            { id: 'aud-s02-reveal-not-moral-failing', type: 'reveal_card', frontTitle: "Not a Moral Failing", frontBody: "Not a moral failing", backTitle: "Not a Moral Failing", backBody: "A crucial idea: alcohol use disorder is an illness, not bad character, weakness, or a choice to be a \"bad person.\" Judgment and shame drive the problem into hiding and away from help. Compassion and treating it as the medical condition it is are what open the door to recovery." },
            { id: 'aud-s02-reveal-hidden-drinking', type: 'reveal_card', frontTitle: "Hidden / Late-Onset Drinking", frontBody: "Hidden drinking", backTitle: "Hidden / Late-Onset Drinking", backBody: "In older adults, alcohol problems are often invisible — done alone at home, without obvious work or social fallout. Some elders have drunk heavily for decades; others begin drinking heavily late in life, often after loss, grief, retirement, loneliness, or pain. Both are easily missed." },
            { id: 'aud-s02-reveal-increased-sensitivity', type: 'reveal_card', frontTitle: "Increased Sensitivity with Aging", frontBody: "Increased sensitivity", backTitle: "Increased Sensitivity with Aging", backBody: "As the body ages, it processes alcohol less efficiently and holds more of it — so the same drink affects an older person more strongly and for longer. This means even \"moderate\" drinking can cause real harm in elders, and amounts that were once fine become dangerous." },
            { id: 'aud-s02-reveal-medication-interaction', type: 'reveal_card', frontTitle: "Alcohol-Medication Interaction", frontBody: "Alcohol-medication interaction", backTitle: "Alcohol-Medication Interaction", backBody: "When alcohol combines dangerously with medications — sedatives, pain medicines, blood thinners, diabetes and blood-pressure drugs, and many others. These interactions can cause excess sedation, falls, bleeding, dangerous blood sugar or pressure changes, and worse. With the many medications elders take, this is a major danger." },
            { id: 'aud-s02-reveal-withdrawal', type: 'reveal_card', frontTitle: "Alcohol Withdrawal", frontBody: "Alcohol withdrawal", backTitle: "Alcohol Withdrawal", backBody: "The symptoms that appear when someone who drinks heavily suddenly stops or sharply cuts back — which can happen when a resident enters a facility. It ranges from tremors, sweating, and anxiety to a life-threatening medical emergency. Withdrawal is recognized and reported immediately — never managed by a CNA." },
            { id: 'aud-s02-reveal-dts', type: 'reveal_card', frontTitle: "Delirium Tremens (DTs)", frontBody: "Delirium tremens", backTitle: "Delirium Tremens (DTs)", backBody: "The most severe, life-threatening form of alcohol withdrawal — with severe confusion, agitation, hallucinations, fever, racing heart, and seizures. It can be fatal without urgent medical care. The DTs are a medical emergency; recognizing the warning signs early and escalating fast saves lives." },
            { id: 'aud-s02-reveal-recovery', type: 'reveal_card', frontTitle: "Recovery & Non-Judgment", frontBody: "Recovery & non-judgment", backTitle: "Recovery & Non-Judgment", backBody: "Alcohol use disorder is treatable, and recovery is possible at any age through medical care, counseling, and support. The CNA's part is non-judgmental support — warmth, respect, encouragement, and reporting — never shame, lectures, or policing. Compassion supports recovery; judgment blocks it." },
            { id: 'aud-s02-kc1-check-aud', type: 'knowledge_check', question: "Match the term: a treatable medical illness — not a moral failing", options: [
                {
                  "id": "alcohol-use-disorder",
                  "label": "Alcohol use disorder"
                },
                {
                  "id": "alcohol-withdrawal",
                  "label": "Alcohol withdrawal"
                },
                {
                  "id": "alcohol-medication-interaction",
                  "label": "Alcohol-medication interaction"
                }
              ], correctOptionId: "alcohol-use-disorder", explanation: "Alcohol use disorder. A medical condition in which a person can't control their drinking despite harm to their health, safety, or life. It is a treatable illness with biological roots — not a moral failing or weakness. People recover at every age.", requiredForCompletion: true },
            { id: 'aud-s02-kc1-check-withdrawal', type: 'knowledge_check', question: "Match the term: dangerous symptoms when heavy drinking suddenly stops — a possible emergency", options: [
                {
                  "id": "alcohol-use-disorder",
                  "label": "Alcohol use disorder"
                },
                {
                  "id": "alcohol-withdrawal",
                  "label": "Alcohol withdrawal"
                },
                {
                  "id": "alcohol-medication-interaction",
                  "label": "Alcohol-medication interaction"
                }
              ], correctOptionId: "alcohol-withdrawal", explanation: "Alcohol withdrawal. The symptoms that appear when someone who drinks heavily suddenly stops or sharply cuts back — which can happen when a resident enters a facility. It ranges from tremors, sweating, and anxiety to a life-threatening medical emergency. Withdrawal is recognized and reported immediately — never managed by a CNA.", requiredForCompletion: true },
            { id: 'aud-s02-kc1-check-interaction', type: 'knowledge_check', question: "Match the term: alcohol combining dangerously with an elder's medications", options: [
                {
                  "id": "alcohol-use-disorder",
                  "label": "Alcohol use disorder"
                },
                {
                  "id": "alcohol-withdrawal",
                  "label": "Alcohol withdrawal"
                },
                {
                  "id": "alcohol-medication-interaction",
                  "label": "Alcohol-medication interaction"
                }
              ], correctOptionId: "alcohol-medication-interaction", explanation: "Alcohol-medication interaction. When alcohol combines dangerously with medications — sedatives, pain medicines, blood thinners, diabetes and blood-pressure drugs, and many others. These interactions can cause excess sedation, falls, bleeding, dangerous blood sugar or pressure changes, and worse.", requiredForCompletion: true },
          ]),
      },
      {
        slug: 's03-statistics',
        title: "Statistics",
        sortOrder: 2,
        buildContent: () =>
          doc("Statistics", [
            { id: 'aud-s03-heading', type: 'heading', level: 1, text: "Statistics" },
            pendingAudio(
              'aud-s03-audio',
              "Alcohol and Older Adults: Common, Hidden, and More Dangerous Than People Think",
              `${ASSET_BASE}/s03-stats-podcast.mp3`,
              "Alcohol and Older Adults: Common, Hidden, and More Dangerous Than People Think\n\nAlcohol use disorder in older adults is more common than most people assume, and it's growing. A meaningful share of older adults drink in ways that harm their health, and the numbers have been rising as the population ages. Yet among all age groups, elders are the most likely to have an alcohol problem go unrecognized — for reasons worth understanding, because they point straight at the CNA's value.\n\nThe first reason it hides is that it doesn't look like the stereotype. An older person's drinking often happens alone, at home, without the job loss, arrests, or public disruption that flag it in younger people. The second reason is disguise: alcohol's effects in elders — falls, unsteadiness, confusion, memory problems, poor sleep, self-neglect, worsening health — look exactly like aging, dementia, and other illnesses, so they get attributed to those instead. Screening for alcohol is also done less often in older adults, partly out of an assumption that it isn't an issue at this age. The result is a problem that is both quietly conducted and easily misread.\n\nWhat makes it especially dangerous is biology and pharmacy. As the body ages, it processes alcohol less efficiently, body water decreases, and the brain becomes more sensitive — so the same amount of alcohol produces higher levels and stronger effects in an older person than it once did. Drinking that was \"fine\" for decades can become harmful without any increase in amount. On top of this, older adults take many medications, and alcohol interacts dangerously with a long list of them — sedatives and sleep aids, opioid pain medications, blood thinners, diabetes medications, blood pressure drugs, and others — interactions that can cause oversedation, falls, dangerous bleeding, blood sugar and pressure crises, and life-threatening events. Alcohol also directly multiplies the risk of the falls, fractures, and confusion that already threaten elders.\n\nAnd there's an acute danger specific to care settings: withdrawal. When a person who has been drinking heavily is admitted to a hospital or facility and suddenly has no access to alcohol, they can go into withdrawal — which ranges from uncomfortable to a true medical emergency. Severe withdrawal, including delirium tremens, can be fatal without prompt treatment, and it can begin within a day or two of the last drink. This means a newly admitted resident whose heavy drinking wasn't known can develop a life-threatening emergency on the unit — and early recognition is what saves them.\n\nThe hopeful and humane core: alcohol use disorder is treatable, and older adults can and do recover, often responding very well to treatment and support. What helps recovery is the opposite of judgment — compassion, respect, and treating it as the illness it is. The CNA's role flows from all of this: notice the hidden signs that others attribute to aging, recognize the emergency of withdrawal and escalate fast, watch for interactions and injury, and support residents without a shred of shame or lecturing. The bottom line: alcohol problems in elders are common, hidden, and unusually dangerous — and the CNA's watchful, non-judgmental vigilance protects lives.",
              '/assets/courses/alcohol-use-disorder/s03-stats-podcast.mp3',
            ),
            {
              id: 'aud-s03-image',
              type: 'image',
              src: `${ASSET_BASE}/s03-hero.png`,
              caption:
                'Alcohol use disorder in long-term care — a health condition, not a moral failing.',
            },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: "Fundamentals",
        sortOrder: 3,
        buildContent: () =>
          doc("Fundamentals", [
            { id: 'aud-s04-heading', type: 'heading', level: 1, text: "Fundamentals" },
            {
              id: 'aud-s04-video',
              type: 'video',
              title: 'Fundamentals',
              videoUrl: '/assets/courses/alcohol-use-disorder/s04-fundamentals.mp4',
              placeholderNote: 'Pending upload: /assets/courses/alcohol-use-disorder/s04-fundamentals.mp4',
            },
            {
              id: 'aud-s04-image',
              type: 'image',
              src: `${ASSET_BASE}/s04-hero.png`,
              caption:
                'Understanding alcohol use disorder — how dependence affects the body and mind.',
            },
            { id: 'aud-s04-narration', type: 'text', body: "**What alcohol use disorder is**\n\nAlcohol use disorder is a medical condition in which a person continues drinking despite it harming their health, relationships, safety, or life — and finds it very hard to stop or control. It involves real changes in the brain that drive craving and dependence. It exists on a spectrum from mild to severe. Understanding it as an illness — like diabetes or heart disease — rather than a moral failing is the foundation for recognizing it and helping.\n\n**Why \"moral failing\" thinking is so harmful**\n\nAlcohol problems carry heavy stigma — the idea that the person is weak, bad, or choosing to harm themselves. This thinking is both wrong and damaging. It's wrong because addiction is an illness with biological roots, not a character flaw. And it's damaging because shame and judgment drive the problem into hiding, push people away from help, and make honest conversation impossible. Replacing judgment with compassion isn't softness — it's what actually opens the path to recovery.\n\n**Why it hides in older adults**\n\nAlcohol problems in elders are especially easy to miss. Older people often drink alone and at home, without the public consequences that reveal it in younger people. And alcohol's effects — falls, confusion, memory problems, unsteadiness, poor self-care, declining health — look just like aging, dementia, or other illnesses, so they get blamed on those. The problem is both conducted quietly and disguised by its own symptoms. A watchful caregiver who knows what to look for is often the one who sees through it.\n\n**Why aging makes alcohol more dangerous**\n\nA key fact: the same drink affects an older body more. With age, the body processes alcohol less efficiently and holds higher concentrations, and the aging brain is more sensitive to it. So drinking that was once harmless can become harmful with no increase in amount, and \"moderate\" drinking can cause real damage in an elder. This heightened sensitivity is why alcohol so readily worsens falls, confusion, and overall decline in older adults.\n\n**The medication danger**\n\nOlder adults take many medications, and alcohol interacts dangerously with a long list of them. With sedatives and sleep aids, it deepens sedation dangerously. With opioid pain medications, it can suppress breathing. With blood thinners, it raises bleeding risk. With diabetes medications, it can crash blood sugar. With blood pressure drugs, it can drop pressure dangerously. These interactions can be serious or fatal — which is why alcohol use is never a private side matter in a resident on medications; it's a real safety issue the team needs to know about.\n\n**Alcohol withdrawal: a medical emergency**\n\nThis is the most urgent fact in the course. When a person who drinks heavily suddenly stops — which happens when a resident is admitted and loses access to alcohol — their body, used to alcohol, reacts. Mild withdrawal brings tremors, sweating, anxiety, nausea, and a racing heart. But it can escalate to severe withdrawal and delirium tremens — severe confusion, hallucinations, fever, and seizures — which can be fatal without urgent treatment. Withdrawal can start within a day or two of the last drink. Recognizing it early and reporting immediately is lifesaving. A CNA never manages withdrawal — a CNA recognizes and escalates it.\n\n**Recovery is real, and judgment blocks it**\n\nEnd on the hopeful truth: alcohol use disorder is treatable, and older adults recover — often responding very well to treatment, counseling, and support. What helps is compassion, respect, and treating it as the illness it is; what blocks recovery is shame, lectures, and policing. Your role is to support without judgment, recognize the dangers, and report — never to shame or to act as the alcohol police. Hope here is realistic, and your warmth is part of what makes it possible." },
            { id: 'aud-s04-withdrawal-callout', type: 'callout', variant: "clinical", title: "Alcohol withdrawal can be a medical emergency", body: "Recognize early, report immediately. Never manage withdrawal yourself. Addiction is an illness, not a moral failing — shame drives it into hiding; compassion opens recovery." },
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
            { id: 'aud-s05-heading', type: 'heading', level: 1, text: "Signs & Symptoms" },
            {
              id: 'aud-s05-image',
              type: 'image',
              src: `${ASSET_BASE}/s05-hero.png`,
              caption:
                'Recognizing the signs — changes in behavior, physical health, and withdrawal symptoms.',
            },
            { id: 'aud-s05-narration', type: 'text', body: "With alcohol problems, you watch for the hidden signs, the effects, and — most urgently — the signs of withdrawal. Let's learn them, ending with the emergency.\n\n**The hidden signs of an alcohol problem**\n\nBecause elder drinking hides, watch for the quieter signs and patterns. Smelling alcohol on the breath or in the room, or finding bottles. Unexplained or frequent falls, unsteadiness, and injuries. Confusion, memory problems, or mood changes that come and go. Poor self-care, neglected hygiene, and decline. Poor nutrition and missed meals. Sleep problems. Irritability or mood swings, or secrecy and defensiveness about drinking. Worsening of health conditions despite treatment. Any of these — especially several together — may point to an alcohol problem hiding behind what looks like aging or another illness. You don't diagnose it; you notice the pattern and report it.\n\n**Signs of intoxication and interactions**\n\nWatch for signs a resident is currently affected by alcohol — or by alcohol mixing with medications: slurred speech, unsteadiness, poor coordination, and falls. Confusion or drowsiness beyond their normal. Excessive sedation — especially worrying if they're on sedatives, sleep aids, or pain medications, where the combination can dangerously suppress breathing. Flushing, nausea, or vomiting. And in a resident on medications, any sudden unexplained change — very low blood sugar signs, dizziness, bleeding, severe drowsiness — could be an interaction. Report excessive sedation or these changes promptly; a dangerous interaction can escalate.\n\n**The early signs of withdrawal**\n\nThis is critical, especially for newly admitted residents who've lost access to alcohol. Early withdrawal, often within a day or two of the last drink: tremors — shaky hands. Sweating. Anxiety, agitation, and restlessness. Nausea and vomiting. A racing heart and high blood pressure. Trouble sleeping. Irritability and feeling unwell. In a resident who may have been drinking heavily, these signs are a red flag for withdrawal and are reported promptly — because withdrawal can escalate, and early treatment prevents the dangerous stage. Don't wait to see if it passes; report it.\n\n**The DTs: a life-threatening emergency**\n\nAnd the emergency you must never miss. Severe withdrawal — delirium tremens — is life-threatening, and its signs demand immediate help: severe confusion and disorientation. Agitation and hallucinations — seeing or hearing things that aren't there. High fever. A racing heart. Profuse sweating. And seizures. A resident showing these — especially severe confusion, hallucinations, or a seizure, in someone who may have been drinking heavily — is a medical emergency. Get help immediately, stay with them, keep them safe. The DTs can be fatal without urgent treatment, and fast recognition saves lives.\n\n**Summary**\n\nFour pictures. Hidden signs: falls, unsteadiness, confusion, decline, neglect, secrecy — patterns blamed on aging. Intoxication/interactions: slurred speech, unsteadiness, excessive sedation — especially with sedatives, opioids — report. Early withdrawal: tremors, sweating, anxiety, racing heart, nausea, within a day or two of stopping — report promptly. The DTs emergency: severe confusion, hallucinations, fever, seizures — get help immediately.\n\nThe rule underneath it all: notice the hidden patterns blamed on aging; report excessive sedation and interaction signs; and treat early withdrawal as urgent and the DTs as a life-threatening emergency." },
            { id: 'aud-s05-withdrawal-callout', type: 'callout', variant: "warning", title: "Alcohol withdrawal emergency", body: "Early withdrawal: tremors, sweating, agitation, racing heart — report promptly. The DTs (severe confusion, hallucinations, fever, seizures) demand immediate help. Never manage withdrawal yourself." },
          ]),
      },
      {
        slug: 's06-causes',
        title: "Causes",
        sortOrder: 1,
        buildContent: () =>
          doc("Causes", [
            { id: 'aud-s06-heading', type: 'heading', level: 1, text: "Causes" },
            pendingAudio(
              'aud-s06-audio',
              "Why Alcohol Problems Develop in Older Adults — and Why It's an Illness, Not a Failing",
              `${ASSET_BASE}/s06-causes-podcast.mp3`,
              "Why Alcohol Problems Develop in Older Adults — and Why It's an Illness, Not a Failing\n\nUnderstanding what drives alcohol use disorder does two important things: it replaces judgment with compassion, and it helps caregivers see the whole person. Addiction is never simply a choice to be a bad person — it arises from a mix of biology, life circumstances, and the powerful way alcohol acts on the brain.\n\nOn the biological side, alcohol use disorder involves real changes in brain chemistry. Repeated heavy drinking alters the brain's reward and stress systems, creating craving and dependence that are genuinely hard to overcome by willpower alone — which is part of why it's classified as a medical illness. There's a genetic component too; it can run in families. This is the core reason shame and \"just stop\" thinking fail: the condition isn't located in weak character, it's located in a changed brain and body.\n\nFor older adults specifically, there are two common paths. Some have lived with alcohol use disorder for decades, carrying a long-standing condition into old age. Others develop a drinking problem late in life, sometimes for the first time — and the triggers for late-onset drinking are deeply human and deserve compassion. They include the accumulated losses of aging: the death of a spouse and friends; retirement and the loss of work, routine, and identity; loneliness and isolation; boredom and lack of purpose; chronic pain and illness; depression and anxiety, which often travel with alcohol use, each worsening the other; and the sheer emptiness and grief that late life can bring. Many late-life drinkers are, at bottom, people in pain who turned to alcohol to cope — which is sad, not shameful.\n\nThen there's alcohol's own role. It provides short-term relief from loneliness, grief, pain, anxiety, and sleeplessness — and that very relief drives continued use, even as it worsens the underlying problems and the person's health. The pattern feeds itself: drinking to cope with pain creates more pain to cope with.\n\nHere's what it means for the CNA, and it's both humbling and empowering. You can't treat the addiction — that's for professionals — and you can't undo a resident's losses. But you can address some of what drives it: the loneliness, isolation, and lack of purpose that you learned about in depression and anxiety care are often the same forces feeding late-life drinking. Genuine connection, engagement, purpose, and support work on real contributors. And critically, your non-judgmental stance — seeing the person and their pain rather than a character flaw — is what makes it possible for a resident to be honest, accept help, and recover. Compassion isn't just kindness here; it's a working part of care.\n\nThe takeaway: alcohol use disorder comes from biology, life pain, and alcohol's grip — not from weakness — and while professionals treat the addiction, the CNA supports the human being underneath it with connection, vigilance, and complete absence of judgment.",
              '/assets/courses/alcohol-use-disorder/s06-causes-podcast.mp3',
            ),
            {
              id: 'aud-s06-image',
              type: 'image',
              src: `${ASSET_BASE}/s06-hero.png`,
              caption:
                'Why alcohol use disorder develops — and why recovery takes support, not judgment.',
            },
          ]),
      },
      {
        slug: 's07-role',
        title: "CNA Role & Best Practices",
        sortOrder: 2,
        buildContent: () =>
          doc("CNA Role & Best Practices", [
            { id: 'aud-s07-heading', type: 'heading', level: 1, text: "CNA Role & Best Practices" },
            {
              id: 'aud-s07-image',
              type: 'image',
              src: `${ASSET_BASE}/s07-hero.png`,
              caption:
                'Your scope — observe, support, and report; CNAs don\'t diagnose or treat.',
            },
            { id: 'aud-s07-scope-callout', type: 'callout', variant: "clinical", title: "Scope of practice", body: "CNAs RECOGNIZE, WATCH, SUPPORT WITHOUT JUDGMENT, and REPORT. CNAs never diagnose alcohol problems, counsel or manage withdrawal, give or adjust medications, or police a resident's drinking." },
            { id: 'aud-s07-narration', type: 'text', body: "Alcohol use disorder is treated by medical and addiction professionals — and the CNA's job is recognition, vigilance, non-judgmental support, and reporting, with one piece that's truly lifesaving. Let's walk through it, starting with the rule that never bends, stated firmly because it matters most here. A CNA does not diagnose alcohol problems, does not counsel or provide addiction treatment, does not manage or treat withdrawal, does not give or adjust medications, and does not police, shame, lecture, or supply alcohol to a resident.\n\n**Recognizing and escalating withdrawal — the lifesaving piece.** This is the most critical thing in the course. If a resident — especially a newly admitted one — shows signs of alcohol withdrawal: tremors, sweating, anxiety, agitation, racing heart, nausea, and especially severe confusion, hallucinations, fever, or seizures — you report it immediately. Early withdrawal reported promptly lets the team treat it before it becomes dangerous; the severe stage, the DTs, is a life-threatening emergency needing urgent help. You never try to manage withdrawal, dose anything, or handle it quietly. You recognize and escalate fast. That report can save a life.\n\n**Watching for interactions and injury.** Be the eyes for alcohol's dangers. Watch for and report excessive sedation, especially in residents on sedatives, sleep aids, or pain medications, where the combination can suppress breathing. Watch for falls, unsteadiness, and injuries, and the signs of dangerous interactions — low blood sugar signs, bleeding, dizziness, severe drowsiness. Report a resident who seems intoxicated or unusually sedated promptly, because the danger can escalate. Your vigilance catches interactions before they become emergencies.\n\n**Non-judgmental support — what helps recovery.** Deliver every bit of care without judgment, shame, or lecturing. Treat the resident with the same warmth and respect as anyone, see the person and their pain rather than a moral failing, and never act as the alcohol police, scold, or moralize. This isn't just kindness — non-judgment is what lets a resident be honest and accept help, and it's a working part of recovery. Support participation in treatment and counseling the team arranges, and support the medications the nurse administers, reporting refusals or side effects.\n\n**Connection and the underlying needs.** Address what often drives the drinking, using what you learned before: counter loneliness and isolation, offer genuine connection and engagement, support purpose and meaning, and watch for the depression and anxiety that travel with alcohol use — responding to any hopelessness or talk of not wanting to live exactly as you learned: take it seriously, stay, report immediately, never promise secrecy.\n\n**Safety, nutrition, and the whole person.** Support fall prevention for a resident affected by alcohol, support nutrition and hydration often neglected with heavy drinking, and provide patient, dignified care throughout.\n\nThe scope point for this section: you never diagnose, counsel, manage withdrawal, medicate, or police drinking — but you recognize and urgently escalate withdrawal, watch for interactions and injury, support recovery without judgment, and report. Recognizing the withdrawal emergency and supporting without shame are the care you deliver." },
          ]),
      },
      {
        slug: 's08-prevention',
        title: "Prevention & Risk Reduction",
        sortOrder: 3,
        buildContent: () =>
          doc("Prevention & Risk Reduction", [
            { id: 'aud-s08-heading', type: 'heading', level: 1, text: "Prevention & Risk Reduction" },
            {
              id: 'aud-s08-image',
              type: 'image',
              src: `${ASSET_BASE}/s08-hero.png`,
              caption:
                'Supporting residents in recovery — dignity, patience, and a non-judgmental presence.',
            },
            { id: 'aud-s08-narration', type: 'text', body: "With alcohol problems, prevention means protecting residents from harm and supporting their recovery. Here are seven ways.\n\n**One. Notice the hidden signs — and report them.** Because elder drinking hides and disguises itself as aging, your watchful noticing is the first protection. Report patterns of falls, unsteadiness, confusion, decline, neglect, or the smell of alcohol — without judgment — so the problem can be recognized and addressed. What's seen can be helped; what stays hidden keeps harming.\n\n**Two. Watch for and report withdrawal — fast.** For any resident, especially a newly admitted one, watch for early withdrawal signs — tremors, sweating, anxiety, racing heart — and report them immediately. Catching withdrawal early lets it be treated before it turns dangerous. This is prevention of a medical emergency, and it's one of the most important things you do.\n\n**Three. Guard against dangerous interactions.** Know that alcohol mixes dangerously with elders' medications, and watch for excessive sedation and interaction signs, especially in residents on sedatives, sleep aids, or pain medicines. Report these promptly. Your vigilance prevents an interaction from becoming an emergency.\n\n**Four. Prevent falls and injury.** A resident affected by alcohol is at high risk of falls and injury. Support fall-prevention measures, watch unsteady residents closely, keep their environment safe, and report unsteadiness and falls. Protecting them from injury is concrete, daily prevention.\n\n**Five. Support nutrition, hydration, and health.** Heavy drinking often comes with poor nutrition and neglected health. Encourage meals and fluids, support self-care, and report poor intake and decline. Supporting the body that alcohol depletes helps protect the resident's overall health.\n\n**Six. Offer connection and purpose.** Because loneliness, grief, and lack of purpose often drive late-life drinking, the connection and engagement you provide work on real causes. Offer genuine warmth and companionship, counter isolation, support meaningful activity and purpose — and watch for the depression and anxiety that travel with alcohol use. Connection is prevention that reaches the root.\n\n**Seven. Support recovery with zero judgment.** The strongest thing you bring to recovery is an absence of shame. Treat the resident with warmth and respect, never lecture or police, support their treatment, and let them feel like a worthy person, not a failure. Non-judgment is what lets a resident accept help and keep going — making it, quietly, one of the most powerful preventions of relapse and despair." },
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
            { id: 'aud-s09-heading', type: 'heading', level: 1, text: "Scenario & Reporting" },
            pendingAudio(
              'aud-s09-intro-audio',
              "Emergency response scenarios intro",
              `${ASSET_BASE}/s09-emergency-intro.mp3`,
              "With alcohol problems, the judgments that matter most are recognizing alcohol withdrawal as the emergency it can become, and supporting a resident without judgment so they get help. You're about to work through two situations. Read each carefully, choose your action, and you'll get feedback right away. Keep the core ideas in mind: tremors, sweating, and agitation in a newly admitted resident can be withdrawal — report it immediately; and shame drives people away from the help they need.",
              '/assets/courses/alcohol-use-disorder/s09-emergency-intro.mp3',
            ),
            {
              id: 'aud-s09-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-hero.png`,
              caption:
                'Recognizing withdrawal and responding with compassion — some signs are medical emergencies.',
            },
            {
              id: 'aud-s09-scenario-brennan-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-scenario-brennan.png`,
              caption:
                'Withdrawal signs after admission — tremors, sweating, confusion, and seeing things — are a medical emergency; report right away.',
            },
            { id: 'aud-s09-scenario-brennan', type: 'scenario_question', prompt: "Mr. Brennan was admitted to the facility two days ago. Today he's developed shaky, tremoring hands, he's sweating heavily, he's anxious and agitated, his heart is racing, and he's becoming confused and saying he sees things in the corner that aren't there. His family mentioned he \"liked his drinks at home.\" A coworker says, \"He's probably just anxious about being in a new place — give him time to settle.\" What SHOULD the CNA do?", options: [
                {
                  "id": "wait-adjustment",
                  "label": "Assume it's just adjustment anxiety and wait for him to settle",
                  "feedback": "Tremors, sweating, agitation, racing heart, confusion, and hallucinations two days after admission — in someone who drank at home — are signs of alcohol withdrawal, which can become a life-threatening emergency (delirium tremens). \"Just adjustment anxiety,\" finding him a drink, or leaving him alone are all dangerous. The right action: report it to the nurse immediately as possible withdrawal so he can be treated fast."
                },
                {
                  "id": "report-withdrawal",
                  "label": "Report it to the nurse immediately as possible alcohol withdrawal — tremors, sweating, agitation, racing heart, confusion, and hallucinations two days after admission are a medical emergency",
                  "feedback": "Exactly right — and this recognition can save his life. Mr. Brennan was admitted two days ago, his family notes he drank at home, and he now has the classic picture of alcohol withdrawal: tremors, heavy sweating, anxiety and agitation, a racing heart, confusion, and hallucinations. Stopping heavy drinking suddenly — exactly what happens on admission — triggers withdrawal, which can escalate to delirium tremens, a life-threatening emergency with hallucinations, fever, and seizures. This is not \"adjustment anxiety to wait out\" — the hallucinations and the timing make it urgent. Report it to the nurse immediately with the full picture, including the family's note about his drinking, so he can be assessed and treated fast. Never try to find him alcohol or manage withdrawal yourself — that's dangerous and far outside your role; the team manages withdrawal medically. You recognize and escalate now. Catching withdrawal early is genuinely lifesaving.",
                  "isRecommended": true
                },
                {
                  "id": "find-drink",
                  "label": "Try to find him a drink to calm him down",
                  "feedback": "Tremors, sweating, agitation, racing heart, confusion, and hallucinations two days after admission — in someone who drank at home — are signs of alcohol withdrawal, which can become a life-threatening emergency (delirium tremens). \"Just adjustment anxiety,\" finding him a drink, or leaving him alone are all dangerous. The right action: report it to the nurse immediately as possible withdrawal so he can be treated fast."
                },
                {
                  "id": "leave-alone",
                  "label": "Tell him to relax and leave him alone in his room",
                  "feedback": "Tremors, sweating, agitation, racing heart, confusion, and hallucinations two days after admission — in someone who drank at home — are signs of alcohol withdrawal, which can become a life-threatening emergency (delirium tremens). \"Just adjustment anxiety,\" finding him a drink, or leaving him alone are all dangerous. The right action: report it to the nurse immediately as possible withdrawal so he can be treated fast."
                }
              ], requiredForCompletion: true },
            {
              id: 'aud-s09-scenario-calderon-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-scenario-calderon.png`,
              caption:
                'Addiction is a health condition, not a moral failing — respond with compassion and dignity, never judgment.',
            },
            { id: 'aud-s09-scenario-calderon', type: 'scenario_question', prompt: "Mrs. Calderon, recovering from an alcohol problem, is quietly ashamed and tells you, \"I'm so embarrassed. I'm a weak, terrible person for letting it get this bad.\" A coworker had earlier muttered within her hearing that she \"did this to herself.\" What SHOULD the CNA do?", options: [
                {
                  "id": "agree-motivate",
                  "label": "Agree that she should have known better, to motivate her",
                  "feedback": "Shame and judgment are exactly what block recovery from an alcohol problem. Agreeing she \"should have known better,\" lecturing, or acting uncomfortable all deepen the shame that drives people away from help. The right response: warm, non-judgmental support — addiction is an illness not weakness, she deserves respect, and recovery is possible."
                },
                {
                  "id": "warm-nonjudgment",
                  "label": "Respond with warmth and zero judgment — that addiction is an illness, not weakness or being a bad person, that she deserves care and respect, and that recovery is possible",
                  "feedback": "Right. Mrs. Calderon is carrying shame, made worse by a coworker's judgment — and shame is exactly what blocks recovery, driving people to hide and give up. The most helpful response is warm and completely non-judgmental: gently reframe what she believes about herself — alcohol use disorder is a medical illness, not weakness or a sign of being a \"terrible person\" — affirm that she deserves care and respect like any resident, and offer realistic hope that recovery is possible and she's worth it. You don't lecture, you don't agree she \"did this to herself,\" and you don't act uncomfortable or avoid her. This compassion isn't just kindness — it's a working part of her recovery, because feeling seen as a worthy person rather than a failure is what helps her accept help and keep going. And the coworker's judgmental comment is worth addressing too, because that stigma harms residents. Meet shame with respect; it's how recovery is supported.",
                  "isRecommended": true
                },
                {
                  "id": "lecture-dangers",
                  "label": "Lecture her about the dangers of drinking",
                  "feedback": "Shame and judgment are exactly what block recovery from an alcohol problem. Agreeing she \"should have known better,\" lecturing, or acting uncomfortable all deepen the shame that drives people away from help. The right response: warm, non-judgmental support — addiction is an illness not weakness, she deserves respect, and recovery is possible."
                },
                {
                  "id": "avoid-uncomfortable",
                  "label": "Avoid the topic and act uncomfortable around her",
                  "feedback": "Shame and judgment are exactly what block recovery from an alcohol problem. Agreeing she \"should have known better,\" lecturing, or acting uncomfortable all deepen the shame that drives people away from help. The right response: warm, non-judgmental support — addiction is an illness not weakness, she deserves respect, and recovery is possible."
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
            { id: 'aud-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
              id: 'aud-s10-video',
              type: 'video',
              title: 'The CNA\'s Role',
              videoUrl: '/assets/courses/alcohol-use-disorder/s10-cna-role.mp4',
              placeholderNote: 'Pending upload: /assets/courses/alcohol-use-disorder/s10-cna-role.mp4',
            },
            {
              id: 'aud-s10-image',
              type: 'image',
              src: `${ASSET_BASE}/s10-hero.png`,
              caption:
                'Your role — noticing changes, offering respect, and reporting concerns.',
            },
            { id: 'aud-s10-narration', type: 'text', body: "Your role with alcohol use disorder is recognition, urgent escalation, non-judgmental support, and vigilance — and one part of it is genuinely lifesaving. Let's walk through it.\n\n**Recognize and escalate withdrawal** The lifesaving core: recognize alcohol withdrawal and escalate it fast. For any resident — especially newly admitted — showing tremors, sweating, anxiety, agitation, racing heart, and above all severe confusion, hallucinations, fever, or seizures, report it to the nurse immediately as possible withdrawal. Early reporting lets it be treated before the dangerous stage; the DTs are a life-threatening emergency. You never manage withdrawal — you recognize and escalate. This report saves lives.\n\n**Watch for interactions, sedation, and injury** Be the eyes for alcohol's dangers. Watch for and report excessive sedation — especially with sedatives, sleep aids, or pain medicines, where breathing can be suppressed — and the signs of dangerous interactions and intoxication. Protect against falls and injury in affected residents, support a safe environment, and report unsteadiness and falls. Your vigilance catches danger before it becomes an emergency.\n\n**Support without a shred of judgment** Deliver care with complete absence of shame. Treat the resident with the same warmth and respect as anyone, see the person and their pain rather than a moral failing, never lecture, scold, police, or moralize about drinking, and never supply alcohol. Support their treatment and recovery, and counter the loneliness, isolation, and lack of purpose that often drive the drinking, watching for the depression and anxiety that travel with it. Your non-judgment is a working part of recovery.\n\n**Report, and protect the whole person** Report faithfully — the hidden signs others blame on aging, the sedation and interaction signs, and above all withdrawal, urgently. Support nutrition, hydration, and safety that heavy drinking undermines, and provide patient, dignified care. And if hopelessness or talk of not wanting to live appears, respond as you learned: take it seriously, stay, report immediately, never promise secrecy.\n\nNow the boundary, stated plainly because it defines this role. You do not diagnose alcohol problems. You do not counsel or provide addiction treatment. You do not manage or treat withdrawal, or give or adjust medications. And you never shame, lecture, or police a resident's drinking, never supply alcohol, and never try to handle withdrawal yourself.\n\nInside your role — recognizing and urgently escalating withdrawal, watching for interactions and injury, supporting recovery without judgment, and reporting — you protect residents from alcohol's gravest dangers and offer the compassion that makes recovery possible. Recognizing the withdrawal emergency alone can save a life." },
            { id: 'aud-s10-scope-callout', type: 'callout', variant: "clinical", title: "Stay within scope", body: "You do not diagnose, counsel, manage withdrawal, or give or adjust medications. Never shame, lecture, or police drinking. Never supply alcohol or try to handle withdrawal yourself." },
          ]),
      },
      {
        slug: 's11-case-study',
        title: "Case Study",
        sortOrder: 2,
        buildContent: () =>
          doc("Brief Case Study", [
            { id: 'aud-s11-heading', type: 'heading', level: 1, text: "Brief Case Study" },
            pendingAudio(
              'aud-s11-audio',
              "Two Days After Admission",
              `${ASSET_BASE}/s11-case-podcast.mp3`,
              "Mr. Brennan, 72, had been admitted to the facility two days earlier after a fall at home left him unable to manage alone. He was a quiet, private man; his family, in passing, had mentioned he \"liked his evening drinks.\" No one had thought much of it. His CNA, this shift, was Imelda.\n\n**The change:** On Mr. Brennan's second full day, Imelda noticed him changing through the morning, and it worried her. His hands had developed a visible tremor. He was sweating heavily though the room was cool. He seemed anxious and agitated, unable to settle, his heart visibly racing. And as the hours passed he grew confused — and then said, looking at the corner of the room, that there were people standing there who weren't.\n\n**The easy wrong answer:** A coworker offered the comfortable explanation: \"New place, new bed — he's just anxious and disoriented from the move. Lots of them are the first few days. Give him time to settle in.\" On the surface it was plausible — new admissions are often unsettled. But Imelda's training surfaced a different, more urgent pattern. A resident admitted two days ago, family says he drank regularly at home, now suddenly cut off from alcohol — and showing tremors, sweating, agitation, a racing heart, confusion, and now hallucinations. That wasn't adjustment anxiety. That was the picture of alcohol withdrawal, and the hallucinations told her it was becoming severe.\n\n**What Imelda knew:** She knew the crucial facts: that when a heavy drinker suddenly stops — exactly what happens on admission — withdrawal can set in within a day or two; that it can escalate to delirium tremens, with severe confusion, hallucinations, fever, and seizures; and that the DTs can be fatal without urgent treatment. She also knew precisely what was and wasn't her job. It was not her job to manage it, to find him a drink, or to wait it out. It was her job to recognize it and escalate it immediately.\n\n**What Imelda did:** She reported it to the nurse right away, with the full, specific picture: \"Mr. Brennan was admitted two days ago, his family said he drank regularly at home, and this morning he's developed hand tremors, heavy sweating, agitation, a racing heart, he's getting confused, and now he's seeing things that aren't there. I'm worried this is alcohol withdrawal.\" She didn't diagnose it as a doctor would, didn't try to treat it, didn't go looking for alcohol to calm him, and didn't leave him alone — she stayed with him, kept him safe and calm, while help came.\n\n**The response:** Because Imelda recognized the pattern and escalated immediately with the key detail — the timing and the family's note about his drinking — Mr. Brennan was assessed urgently and started on proper medical treatment for alcohol withdrawal before it progressed to full delirium tremens. He was monitored closely and treated through the withdrawal safely. The nurse was direct with Imelda afterward: \"If that had been written off as 'new-place jitters' for another day, this could have gone to full DTs and a seizure — and people die from that. You caught it because you knew the timing, you knew what those signs meant together, and you told us the drinking history. That's a save.\"\n\n**The other half:** As Mr. Brennan recovered and his situation came into the open, Imelda was struck by something: he was deeply ashamed. He apologized to her, called himself weak, seemed to expect disgust. She gave him none — only the same warmth and respect she gave anyone, treating his condition as the illness it was, never lecturing or judging. That non-judgment, she understood, was its own kind of care: it was part of what would let him accept help going forward instead of hiding in shame.\n\n**The outcome:** Mr. Brennan came safely through a withdrawal that could have killed him, and met, in his shame, a caregiver who treated him as a worthy human being rather than a failure. The save was clinical and human at once. The nurse summed it up: \"You recognized a medical emergency that hides as 'just settling in,' and you treated the man with dignity through the worst of it. Both of those are exactly the job.\"\n\n**Discussion:** Imelda's case captures the two hearts of this course. The lifesaving recognition: she knew that withdrawal sets in a day or two after a heavy drinker stops, that admission is exactly when that happens, and that tremors-sweating-agitation-confusion-hallucinations is withdrawal becoming dangerous — so she escalated immediately with the critical history, rather than accepting the comfortable \"new-place jitters\" explanation. And she stayed firmly in scope: she recognized and reported, she did not manage, treat, or medicate withdrawal, and she never sought alcohol for him. Then the human half: she met his shame with complete non-judgment, supporting the recovery that compassion makes possible. Recognize the emergency, escalate fast, judge no one — that is caring for a resident with an alcohol problem.",
              '/assets/courses/alcohol-use-disorder/s11-case-podcast.mp3',
            ),
            {
              id: 'aud-s11-image',
              type: 'image',
              src: `${ASSET_BASE}/s11-hero.png`,
              caption:
                'Putting it together — compassionate, non-judgmental support for residents in recovery.',
            },
            { id: 'aud-s11-case-study', type: 'case_study', title: "Two Days After Admission", residentProfile: "Mr. Brennan, 72, had been admitted to the facility two days earlier after a fall at home left him unable to manage alone. He was a quiet, private man; his family, in passing, had mentioned he \"liked his evening drinks.\" No one had thought much of it. His CNA, this shift, was Imelda.", scenario: "**The change:** On Mr. Brennan's second full day, Imelda noticed him changing through the morning, and it worried her. His hands had developed a visible tremor. He was sweating heavily though the room was cool. He seemed anxious and agitated, unable to settle, his heart visibly racing. And as the hours passed he grew confused — and then said, looking at the corner of the room, that there were people standing there who weren't.\n\n**The easy wrong answer:** A coworker offered the comfortable explanation: \"New place, new bed — he's just anxious and disoriented from the move. Lots of them are the first few days. Give him time to settle in.\" On the surface it was plausible — new admissions are often unsettled. But Imelda's training surfaced a different, more urgent pattern. A resident admitted two days ago, family says he drank regularly at home, now suddenly cut off from alcohol — and showing tremors, sweating, agitation, a racing heart, confusion, and now hallucinations. That wasn't adjustment anxiety. That was the picture of alcohol withdrawal, and the hallucinations told her it was becoming severe.\n\n**What Imelda knew:** She knew the crucial facts: that when a heavy drinker suddenly stops — exactly what happens on admission — withdrawal can set in within a day or two; that it can escalate to delirium tremens, with severe confusion, hallucinations, fever, and seizures; and that the DTs can be fatal without urgent treatment. She also knew precisely what was and wasn't her job. It was not her job to manage it, to find him a drink, or to wait it out. It was her job to recognize it and escalate it immediately.\n\n**What Imelda did:** She reported it to the nurse right away, with the full, specific picture: \"Mr. Brennan was admitted two days ago, his family said he drank regularly at home, and this morning he's developed hand tremors, heavy sweating, agitation, a racing heart, he's getting confused, and now he's seeing things that aren't there. I'm worried this is alcohol withdrawal.\" She didn't diagnose it as a doctor would, didn't try to treat it, didn't go looking for alcohol to calm him, and didn't leave him alone — she stayed with him, kept him safe and calm, while help came.\n\n**The response:** Because Imelda recognized the pattern and escalated immediately with the key detail — the timing and the family's note about his drinking — Mr. Brennan was assessed urgently and started on proper medical treatment for alcohol withdrawal before it progressed to full delirium tremens. He was monitored closely and treated through the withdrawal safely. The nurse was direct with Imelda afterward: \"If that had been written off as 'new-place jitters' for another day, this could have gone to full DTs and a seizure — and people die from that. You caught it because you knew the timing, you knew what those signs meant together, and you told us the drinking history. That's a save.\"\n\n**The other half:** As Mr. Brennan recovered and his situation came into the open, Imelda was struck by something: he was deeply ashamed. He apologized to her, called himself weak, seemed to expect disgust. She gave him none — only the same warmth and respect she gave anyone, treating his condition as the illness it was, never lecturing or judging. That non-judgment, she understood, was its own kind of care: it was part of what would let him accept help going forward instead of hiding in shame.\n\n**The outcome:** Mr. Brennan came safely through a withdrawal that could have killed him, and met, in his shame, a caregiver who treated him as a worthy human being rather than a failure. The save was clinical and human at once. The nurse summed it up: \"You recognized a medical emergency that hides as 'just settling in,' and you treated the man with dignity through the worst of it. Both of those are exactly the job.\"\n\n**Discussion:** Imelda's case captures the two hearts of this course. The lifesaving recognition: she knew that withdrawal sets in a day or two after a heavy drinker stops, that admission is exactly when that happens, and that tremors-sweating-agitation-confusion-hallucinations is withdrawal becoming dangerous — so she escalated immediately with the critical history, rather than accepting the comfortable \"new-place jitters\" explanation. And she stayed firmly in scope: she recognized and reported, she did not manage, treat, or medicate withdrawal, and she never sought alcohol for him. Then the human half: she met his shame with complete non-judgment, supporting the recovery that compassion makes possible. Recognize the emergency, escalate fast, judge no one — that is caring for a resident with an alcohol problem." },
            { id: 'aud-s11-reflection-1', type: 'reflection', prompt: "A coworker explained Mr. Brennan's tremors, agitation, and confusion as \"new-place jitters.\" Why did Imelda recognize it as alcohol withdrawal instead, and why was the timing and the family's note about his drinking so important to report?", minCharacters: 50 },
            { id: 'aud-s11-reflection-2', type: 'reflection', prompt: "Mr. Brennan was ashamed and called himself weak. Why did Imelda's non-judgmental response matter to his recovery, and why is shame so harmful in alcohol use disorder?", minCharacters: 50 },
            { id: 'aud-s11-rp-text', type: 'text', body: "Reflect on the case study in the previous lesson. Your written responses help you apply what you learned about recognizing alcohol withdrawal, escalating emergencies, and supporting recovery without judgment." },
            { id: 'aud-s11-kc2-check', type: 'knowledge_check', question: "A CNA does not diagnose alcohol problems, does not counsel or provide addiction treatment, does not manage or treat withdrawal, does not give or adjust medications, and does not police, shame, lecture, or supply alcohol to a resident. Mr. Brennan was admitted to the facility two days ago. Today he's developed shaky, tremoring hands, he's sweating heavily, he's anxious and agitated, his heart is racing, and he's becoming confused and saying he sees things in the corner that aren't there. His family mentioned he \"liked his drinks at home.\" A coworker says, \"He's probably just anxious about being in a new place — give him time to settle.\" What SHOULD the CNA do?", options: [
                {
                  "id": "wait-adjustment",
                  "label": "Assume it's just adjustment anxiety and wait for him to settle"
                },
                {
                  "id": "report-withdrawal",
                  "label": "Report it to the nurse immediately as possible alcohol withdrawal — tremors, sweating, agitation, racing heart, confusion, and hallucinations two days after admission are a medical emergency"
                },
                {
                  "id": "find-drink",
                  "label": "Try to find him a drink to calm him down"
                },
                {
                  "id": "leave-alone",
                  "label": "Tell him to relax and leave him alone in his room"
                }
              ], correctOptionId: "report-withdrawal", explanation: "You never diagnose, counsel, manage withdrawal, medicate, or police drinking — but your urgent recognition and immediate reporting of alcohol withdrawal can save a life.", requiredForCompletion: true, meta: { flaggedFiller: true } },
          ]),
      },
      {
        slug: 's12-conclusion',
        title: "Conclusion",
        sortOrder: 3,
        buildContent: () =>
          doc("Conclusion", [
            { id: 'aud-s12-heading', type: 'heading', level: 1, text: "Conclusion" },
            {
              id: 'aud-s12-video',
              type: 'video',
              title: 'Conclusion',
              videoUrl: '/assets/courses/alcohol-use-disorder/s12-conclusion.mp4',
              placeholderNote: 'Pending upload: /assets/courses/alcohol-use-disorder/s12-conclusion.mp4',
            },
            {
              id: 'aud-s12-image',
              type: 'image',
              src: `${ASSET_BASE}/s12-hero.png`,
              caption:
                'Caring with respect — supporting every resident\'s dignity and recovery.',
            },
            { id: 'aud-s12-narration', type: 'text', body: "You've reached the end. Let's lock in the five things that matter most for alcohol use disorder in older adults.\n\n**One.** Alcohol use disorder is a treatable medical illness — not a moral failing or weakness. In older adults it often hides, done alone and disguised as aging, falls, confusion, or dementia. Seeing it as an illness, and seeing through its disguise, is the foundation of helping.\n\n**Two.** Alcohol is more dangerous in elders. Aging bodies are more sensitive, so the same drink does more harm. Alcohol multiplies falls and confusion, and interacts dangerously with the many medications elders take — sedatives, pain medicines, blood thinners, and more — interactions that can be serious or fatal. Watch for and report excessive sedation and these dangers.\n\n**Three.** Alcohol withdrawal can be a medical emergency — recognize it and escalate fast. When a heavy drinker suddenly stops, as on admission, withdrawal can set in within a day or two: tremors, sweating, agitation, racing heart — and can escalate to delirium tremens with severe confusion, hallucinations, fever, and seizures, which can be fatal. Report any of these immediately. You never manage withdrawal — you recognize and escalate.\n\n**Four.** Support recovery with zero judgment. Shame drives the problem into hiding and blocks recovery; compassion opens it. Treat the resident with warmth and respect, never lecture, police, or shame, and counter the loneliness and lack of purpose that often drive the drinking. Your non-judgment is a working part of recovery.\n\n**Five.** Honor your scope, with vigilance and compassion. You never diagnose, counsel, manage withdrawal, medicate, or police drinking — but you recognize and urgently escalate withdrawal, watch for interactions and injury, support recovery without shame, and report. Recognizing the withdrawal emergency alone can save a life, and your compassion makes recovery possible." },
            { id: 'aud-s12-summary', type: 'summary', title: "Five things that matter most", items: ["Alcohol use disorder is a treatable illness — not a moral failing. It often hides behind aging, falls, and confusion.","Alcohol is more dangerous in elders — aging sensitivity and medication interactions are serious risks.","Alcohol withdrawal can be a medical emergency — recognize early, report immediately, never manage it yourself.","Support recovery with zero judgment — shame blocks recovery; compassion opens it.","Honor your scope — recognize, escalate, watch, support without shame, and report."] },
            { id: 'aud-s12-whn-text', type: 'text', body: "Ten questions are waiting. Everything on them was covered here. You're ready. Trust what you've learned, and show what you know." },
            { id: 'aud-s12-cr-text', type: 'text', body: "This course provides one hour of continuing education credit through CAL ACE Nursing Academy, an approved CDPH continuing education provider, NAC number 7384. Your certificate is generated automatically when you pass the knowledge check." },
            { id: 'aud-s12-cr-callout', type: 'callout', variant: "info", title: "Scope reminder", body: "CNAs recognize, watch, support without judgment, and report. CNAs do not diagnose, counsel, manage withdrawal, give or adjust medications, or police a resident's drinking." },
            { id: 'aud-s12-ca-text', type: 'text', body: "Your certificate is generated automatically when you pass the knowledge check. CDPH-Approved CE Provider — NAC #7384." },
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

export async function seedCourse46AlcoholUseDisorder(
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
    `Seeding Course 46 (Alcohol Use Disorder in Older Adults) as DRAFT — slug "${COURSE_SLUG}"…`,
  );

  try {
    const result = await seedCourse46AlcoholUseDisorder(prisma);
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
