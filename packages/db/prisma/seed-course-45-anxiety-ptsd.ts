/**
 * Seed Course 45 — Anxiety & PTSD in Older Adults (DRAFT).
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-45-anxiety-ptsd
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
const COURSE_SLUG = 'anxiety-ptsd';
const COURSE_TITLE = 'Anxiety and Trauma Responses in Older Residents';
const COURSE_SUMMARY =
  'Learn the CNA\'s role with anxiety and PTSD in older adults — understanding anxiety disorders and PTSD as real, treatable conditions, recognizing their signs (including panic attacks and trauma triggers), responding calmly to an anxious or triggered resident, delivering trauma-informed care (predictability, choice, consent, explaining before touching), understanding how dementia can resurface old trauma, and reporting faithfully. CNAs do NOT diagnose, provide therapy, give or adjust medications, or process trauma with residents.';

const ASSET_BASE = `/assets/courses/anxiety-ptsd`;

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
    'Recognize anxiety, panic attacks, and PTSD responses.',
    'Respond calmly and correctly.',
    'Deliver trauma-informed care.',
    'Understand how dementia resurfaces trauma.',
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
  heroImage: '/assets/courses/anxiety-ptsd/hero-banner.png',
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
    title: "Understanding Anxiety and PTSD",
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: "Introduction",
        sortOrder: 0,
        buildContent: () =>
          doc("Welcome", [
            { id: 'apt-s01-heading', type: 'heading', level: 1, text: "Welcome" },
            {
              id: 'apt-s01-video',
              type: 'video',
              title: 'Introduction',
              videoUrl: '/assets/courses/anxiety-ptsd/s01-intro.mp4',
              placeholderNote: 'Pending upload: /assets/courses/anxiety-ptsd/s01-intro.mp4',
            },
            {
              id: 'apt-s01-image',
              type: 'image',
              src: `${ASSET_BASE}/s01-hero.png`,
              caption:
                'Anxiety and PTSD in older adults — recognizing distress and responding with calm, trauma-informed care.',
            },
            { id: 'apt-s01-narration', type: 'text', body: "Welcome to CAL ACE Nursing Academy.\n\nThis course is about anxiety and PTSD in older adults — two conditions that cause real suffering in the residents you care for, are often invisible or mistaken for something else, and respond powerfully to the way care is delivered. In this course, how you give care becomes part of the treatment itself.\n\nLet's define them. Anxiety is more than ordinary worry. An anxiety disorder is persistent, excessive fear or worry that doesn't fade, that's out of proportion to the situation, and that interferes with daily life — sometimes erupting into panic attacks: sudden waves of intense fear with a pounding heart, breathlessness, and a feeling of doom. PTSD — post-traumatic stress disorder — develops after a person experiences or witnesses something terrifying: combat, assault, abuse, disaster, terrible loss. The trauma doesn't stay in the past; it intrudes into the present through nightmares, flashbacks, being constantly on guard, and intense reactions to reminders called triggers.\n\nHere's why this matters so much with elders. Many of the residents you care for have lived through wars, violence, abuse, displacement, and profound losses — some carrying trauma silently for fifty or sixty years. And long-term care itself is full of potential triggers: loss of control, being undressed and touched by strangers, confinement, loud noises, even certain smells and sounds. A resident who \"fights\" during bathing, panics at night, or becomes terrified during care may not be \"difficult\" — they may be a trauma survivor whose past is being touched. There's one more crucial piece: dementia can resurface old trauma. As recent memory fades, decades-old traumatic memories can become vivid and present again — a veteran back in the war, an abuse survivor back in danger.\n\nThis course teaches trauma-informed care — a way of giving care that assumes any resident may carry trauma, and that protects them through predictability, choice, consent, and explaining before touching. It costs nothing, it helps every resident, and for a trauma survivor it can be the difference between care and terror.\n\nYour scope is clear. A CNA recognizes anxiety, panic, and trauma responses, responds with calm and patience, delivers trauma-informed care, watches for triggers, and reports faithfully. A CNA does not diagnose, does not provide therapy, does not give or adjust medications, and does not ask residents to recount or process their trauma.\n\nBy the end of this course, you will be able to: recognize anxiety, panic attacks, and PTSD responses. Respond calmly and correctly. Deliver trauma-informed care. Understand how dementia resurfaces trauma. And know your scope.\n\nThere is a ten-question knowledge check at the end. Everything on it is covered here. Let's begin." },
            { id: 'apt-s01-ci-text', type: 'text', body: "This course teaches the CNA's role with anxiety and PTSD in older adults — understanding anxiety disorders and PTSD as real, treatable conditions, recognizing their signs (including panic attacks and trauma triggers), responding calmly to an anxious or triggered resident, delivering trauma-informed care (predictability, choice, consent, explaining before touching), understanding how dementia can resurface old trauma, and reporting faithfully.\n\nLet's be clear about your role. A CNA recognizes anxiety, panic, and trauma responses, responds with calm and patience, delivers trauma-informed care, watches for triggers, and reports faithfully. A CNA does not diagnose, does not provide therapy, does not give or adjust medications, and does not ask residents to recount or process their trauma. Those are nursing and mental-health-team tasks. But none of them can happen without your careful observation and faithful reporting first." },
            { id: 'apt-s01-ci-scope-callout', type: 'callout', variant: "clinical", title: "Scope of this course", body: "CNAs RECOGNIZE, RESPOND CALMLY, DELIVER TRAUMA-INFORMED CARE, and REPORT. CNAs do not diagnose, provide therapy, give or adjust medications, or ask residents to recount or process their trauma." },
            { id: 'apt-s01-lo-text', type: 'text', body: "By the end of this course, you will be able to:" },
            { id: 'apt-s01-lo-summary', type: 'summary', title: "Learning objectives", items: ["Recognize anxiety, panic attacks, and PTSD responses.","Respond calmly and correctly.","Deliver trauma-informed care.","Understand how dementia resurfaces trauma.","Know your scope — what a CNA does, and what a CNA must never do."] },
          ]),
      },
      {
        slug: 's02-terms',
        title: "Terms & Definitions",
        sortOrder: 1,
        buildContent: () =>
          doc("Key terms", [
            { id: 'apt-s02-heading', type: 'heading', level: 1, text: "Key terms" },
            {
              id: 'apt-s02-image',
              type: 'image',
              src: `${ASSET_BASE}/s02-hero.png`,
              caption:
                'Key terms — anxiety, PTSD, trigger, flashback, panic attack, trauma-informed care.',
            },
            { id: 'apt-s02-reveal-anxiety-disorder', type: 'reveal_card', frontTitle: "Anxiety Disorder", frontBody: "Anxiety disorder", backTitle: "Anxiety Disorder", backBody: "Persistent, excessive fear or worry that doesn't fade, is out of proportion to the situation, and interferes with daily life. More than ordinary worry, it's a real, treatable medical condition — common in older adults and often overlooked or mistaken for physical illness." },
            { id: 'apt-s02-reveal-panic-attack', type: 'reveal_card', frontTitle: "Panic Attack", frontBody: "Panic attack", backTitle: "Panic Attack", backBody: "A sudden wave of intense fear that peaks within minutes — with a pounding heart, chest tightness, breathlessness, trembling, sweating, dizziness, and a feeling of doom or losing control. It can look like a heart attack, which is why new or severe symptoms are always reported. Panic attacks are terrifying but not dangerous in themselves." },
            { id: 'apt-s02-reveal-ptsd', type: 'reveal_card', frontTitle: "PTSD", frontBody: "PTSD", backTitle: "PTSD", backBody: "Post-traumatic stress disorder. A condition that can develop after experiencing or witnessing something terrifying — combat, assault, abuse, disaster. The trauma intrudes into the present through nightmares, flashbacks, constant alertness, and intense reactions to reminders. It can persist for decades, and it's treatable." },
            { id: 'apt-s02-reveal-trigger', type: 'reveal_card', frontTitle: "Trigger", frontBody: "Trigger", backTitle: "Trigger", backBody: "Anything that reminds a trauma survivor of their trauma and sets off intense fear or a trauma response — a sound, smell, touch, situation, or feeling of being trapped or powerless. Triggers in care settings include being undressed, confined, touched without warning, or loud sudden noises. Knowing a resident's triggers helps you avoid them." },
            { id: 'apt-s02-reveal-flashback', type: 'reveal_card', frontTitle: "Flashback", frontBody: "Flashback", backTitle: "Flashback", backBody: "When a trauma survivor doesn't just remember the trauma — they re-experience it, feeling as if it's happening right now. During a flashback, a resident may not know where they are, may see you as a threat, and may act to protect themselves. Responding calmly, without grabbing or arguing, is essential." },
            { id: 'apt-s02-reveal-hypervigilance', type: 'reveal_card', frontTitle: "Hypervigilance", frontBody: "HY-per-VIJ-ih-lance", backTitle: "Hypervigilance", backBody: "Being constantly on guard — scanning for danger, startling easily, unable to relax, sleeping poorly. A common PTSD sign. A hypervigilant resident may sit facing the door, react strongly to sudden approaches, and need extra predictability and warning before care." },
            { id: 'apt-s02-reveal-trauma-informed-care', type: 'reveal_card', frontTitle: "Trauma-Informed Care", frontBody: "Trauma-informed care", backTitle: "Trauma-Informed Care", backBody: "Care given on the assumption that any resident may carry trauma — protecting them through predictability, offering choices and control, asking consent, explaining before touching, and avoiding known triggers. It costs nothing, helps everyone, and prevents care itself from becoming frightening." },
            { id: 'apt-s02-reveal-grounding', type: 'reveal_card', frontTitle: "Grounding", frontBody: "Grounding", backTitle: "Grounding", backBody: "Gentle techniques that help an anxious or triggered person return to the present — a calm voice, saying their name, reminding them where they are and that they're safe, focusing on the here and now. CNAs use simple grounding by staying calm, present, and reassuring — never by arguing or restraining." },
            { id: 'apt-s02-kc1-check-trigger', type: 'knowledge_check', question: "Match the term: a reminder that sets off intense fear in a trauma survivor", options: [
                {
                  "id": "trigger",
                  "label": "Trigger"
                },
                {
                  "id": "flashback",
                  "label": "Flashback"
                },
                {
                  "id": "trauma-informed-care",
                  "label": "Trauma-informed care"
                }
              ], correctOptionId: "trigger", explanation: "Trigger. Anything that reminds a trauma survivor of their trauma and sets off intense fear or a trauma response — a sound, smell, touch, situation, or feeling of being trapped or powerless. Triggers in care settings include being undressed, confined, touched without warning, or loud sudden noises.", requiredForCompletion: true },
            { id: 'apt-s02-kc1-check-flashback', type: 'knowledge_check', question: "Match the term: re-experiencing trauma as if it's happening right now", options: [
                {
                  "id": "trigger",
                  "label": "Trigger"
                },
                {
                  "id": "flashback",
                  "label": "Flashback"
                },
                {
                  "id": "trauma-informed-care",
                  "label": "Trauma-informed care"
                }
              ], correctOptionId: "flashback", explanation: "Flashback. When a trauma survivor doesn't just remember the trauma — they re-experience it, feeling as if it's happening right now. During a flashback, a resident may not know where they are, may see you as a threat, and may act to protect themselves.", requiredForCompletion: true },
            { id: 'apt-s02-kc1-check-trauma-informed-care', type: 'knowledge_check', question: "Match the term: predictability, choice, consent, and explaining before touching — for every resident", options: [
                {
                  "id": "trigger",
                  "label": "Trigger"
                },
                {
                  "id": "flashback",
                  "label": "Flashback"
                },
                {
                  "id": "trauma-informed-care",
                  "label": "Trauma-informed care"
                }
              ], correctOptionId: "trauma-informed-care", explanation: "Trauma-informed care. Care given on the assumption that any resident may carry trauma — protecting them through predictability, offering choices and control, asking consent, explaining before touching, and avoiding known triggers.", requiredForCompletion: true },
          ]),
      },
      {
        slug: 's03-statistics',
        title: "Statistics",
        sortOrder: 2,
        buildContent: () =>
          doc("Statistics", [
            { id: 'apt-s03-heading', type: 'heading', level: 1, text: "Statistics" },
            pendingAudio(
              'apt-s03-audio',
              "Anxiety and Old Trauma: The Invisible Weight Many Residents Carry",
              `${ASSET_BASE}/s03-stats-podcast.mp3`,
              "Anxiety and Old Trauma: The Invisible Weight Many Residents Carry\n\nAnxiety is among the most common mental health conditions in older adults — by many estimates affecting a meaningful share of elders, and more in long-term care — yet it's frequently overlooked, partly because anxious elders often describe physical symptoms rather than worry, and partly because, like depression, it gets dismissed as just part of aging or illness. Untreated anxiety in elders is linked to worse physical health, more disability, poorer sleep, more falls, and lower quality of life. It is real, burdensome, and treatable.\n\nPTSD deserves special attention in this population, for a reason that becomes obvious once stated: today's older adults have lived through an enormous amount. Among them are combat veterans of past wars; survivors of childhood and domestic abuse; refugees and immigrants who fled violence and upheaval; survivors of assaults, accidents, disasters, and devastating losses. Studies of older adults, and especially of veterans and long-term care populations, find that significant numbers carry trauma histories — many having never spoken of them, having coped silently for fifty or sixty years. Trauma this old does not necessarily fade; it can persist, resurface under stress, or emerge for the first time in late life.\n\nLong-term care itself, unintentionally, can press on these old wounds. Consider what care involves from a trauma survivor's perspective: losing control over one's body, schedule, and space; being undressed and bathed by strangers; being touched without warning; confinement; loud and sudden noises; institutional settings that may echo past institutions. For an abuse survivor, intimate care by a stranger can feel like the past returning. For a combat veteran, a sudden noise or being startled awake can land like incoming fire. Research on trauma in care settings shows these everyday features of care can trigger fear, panic, and \"behaviors\" — resistance, aggression, crying out — that are often misread as a resident being difficult, when they are in fact a frightened person protecting themselves.\n\nDementia adds a profound twist: as recent memory fails, old memories — including traumatic ones — can become vivid and present. A veteran with dementia may genuinely be back in the war; an abuse survivor may genuinely believe the danger is now. This resurfacing of trauma in dementia is well documented and explains some of the fear and agitation seen in memory care.\n\nThe hopeful core is this: trauma-informed care — predictability, explaining before touching, offering choice and consent, avoiding known triggers, calm and respectful approach — measurably reduces fear, distress, and difficult moments in care, and it requires no equipment and no extra cost, only knowledge and habit. CNAs deliver most hands-on care, so CNAs deliver most trauma-informed care. The bottom line: many residents carry invisible anxiety and old trauma; ordinary care can unknowingly trigger it; and the CNA's trauma-informed approach can turn care from frightening into safe.",
              '/assets/courses/anxiety-ptsd/s03-stats-podcast.mp3',
            ),
            {
              id: 'apt-s03-image',
              type: 'image',
              src: `${ASSET_BASE}/s03-hero.png`,
              caption:
                'Anxiety and trauma are common in long-term care — and often go unrecognized.',
            },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: "Fundamentals",
        sortOrder: 3,
        buildContent: () =>
          doc("Fundamentals", [
            { id: 'apt-s04-heading', type: 'heading', level: 1, text: "Fundamentals" },
            {
              id: 'apt-s04-video',
              type: 'video',
              title: 'Fundamentals',
              videoUrl: '/assets/courses/anxiety-ptsd/s04-fundamentals.mp4',
              placeholderNote: 'Pending upload: /assets/courses/anxiety-ptsd/s04-fundamentals.mp4',
            },
            {
              id: 'apt-s04-image',
              type: 'image',
              src: `${ASSET_BASE}/s04-hero.png`,
              caption:
                'Understanding anxiety and PTSD — how fear and past trauma affect residents today.',
            },
            { id: 'apt-s04-narration', type: 'text', body: "**Anxiety: when worry becomes illness**\n\nEveryone worries. Anxiety becomes a disorder when the fear and worry are persistent, excessive, out of proportion, and interfering with life — when a person can't turn it off. In the body, anxiety runs the alarm system too hot: racing heart, tense muscles, churning stomach, poor sleep, restlessness. In older adults it often shows up as physical complaints, health worries, fear of falling, or clinging to routines — more than as stated \"worry.\" It is a real condition, and it's treatable.\n\n**The panic attack**\n\nA panic attack is the alarm system firing at full blast for no immediate reason: sudden, intense fear that peaks in minutes, with a pounding heart, chest tightness, trouble breathing, trembling, sweating, dizziness, and a terrifying sense of doom or losing control. Two things to hold together: a panic attack is not in itself dangerous — it passes — but its symptoms overlap with heart attacks and other emergencies, so new or severe symptoms are always reported. Never assume; let the nurse sort out which it is.\n\n**PTSD: when trauma won't stay in the past**\n\nPTSD develops after terror — combat, assault, abuse, disaster. The mind, overwhelmed, fails to file the trauma away as \"past,\" so it keeps intruding into the present: nightmares; flashbacks where the person re-experiences the event as if now; constant alertness, called hypervigilance; avoiding reminders; being easily startled; and intense distress at triggers. PTSD can begin soon after trauma or surface decades later, and many elders have carried it silently their whole adult lives. It is not weakness — it is an injury, and it's treatable.\n\n**Triggers: how the past gets touched**\n\nA trigger is anything that reminds the survivor's nervous system of the trauma — and the reminder doesn't need to be logical or obvious. Sounds, smells, touches, positions, confinement, darkness, being startled, feeling powerless. And here's the hard truth about care settings: daily care is full of potential triggers — being undressed, bathed, touched without warning, having someone stand over you, loud machinery, locked doors. When a resident panics, resists, or \"fights\" during care, the question to carry is: what just got touched? Often it's not the task — it's the trauma underneath it.\n\n**The flashback, from the inside**\n\nUnderstand what a flashback is like from inside: the person is not remembering the trauma — they are IN it. A veteran may be back in combat; an abuse survivor may be back in danger. In that state, they may not recognize where they are, and they may see you — reaching toward them, standing over them — as the threat. Their resistance isn't aggression at you; it's self-protection inside a reality you can't see. This understanding changes everything about how you respond: calmly, without grabbing, without arguing about what's real.\n\n**Dementia and resurfacing trauma**\n\nDementia adds a profound layer. As dementia erodes recent memory, older memories grow relatively stronger — and that includes traumatic ones. A resident who coped for sixty years may, with dementia, find the war or the abuse vividly present again, without the defenses they once had. Night fears, terror during bathing, calling out to people from the past, \"agitation\" with no visible cause — in a resident with dementia, these may be old trauma resurfacing. Knowing a resident's history, where it's shared with the team, helps everyone understand and protect them.\n\n**Trauma-informed care: the answer you deliver**\n\nHere's the practice that answers all of it: trauma-informed care. Its premise is humble — you can't know who carries trauma, so you care for everyone as if they might. Its habits are simple: be predictable — same routines, no surprises. Explain before you do — every step, before every touch. Ask consent — \"Is it okay if I...?\" Offer choices and control wherever possible. Approach from the front, calmly, at eye level. Avoid known triggers. These habits cost nothing, comfort every resident — and for a trauma survivor, they're the difference between care and terror." },
            { id: 'apt-s04-flashback-callout', type: 'callout', variant: "clinical", title: "In a flashback, they're not remembering — they're THERE.", body: "Your reach may look like a threat. Respond calmly, without grabbing or arguing. New or severe panic symptoms overlap with heart attack — always report." },
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
            { id: 'apt-s05-heading', type: 'heading', level: 1, text: "Signs & Symptoms" },
            {
              id: 'apt-s05-image',
              type: 'image',
              src: `${ASSET_BASE}/s05-hero.png`,
              caption:
                'Recognizing the signs — restlessness, worry, avoidance, and physical symptoms.',
            },
            { id: 'apt-s05-narration', type: 'text', body: "Anxiety and trauma show themselves in the body, in behavior, and in moments of care. Let's learn to recognize them — and what to report.\n\n**The signs of anxiety in elders**\n\nAnxiety in older adults often hides behind the physical. Watch for: persistent worry, or repeated fearful questions and reassurance-seeking. Restlessness, tension, trembling, or being unable to settle. Physical complaints — racing heart, stomach trouble, dizziness, aches — without clear cause. Poor sleep. Avoiding activities, or fear of falling that goes beyond caution. Clinging to routines and distress when they change. Irritability. A resident who seems \"wound tight,\" checks and rechecks, or can't be reassured may be living with real anxiety — and it's reportable, because it's treatable.\n\n**Recognizing a panic attack**\n\nA panic attack is sudden and intense: overwhelming fear peaking within minutes, a pounding or racing heart, chest tightness or pain, shortness of breath, trembling, sweating, dizziness, numbness or tingling, and a feeling of doom, dying, or losing control. The resident may genuinely believe they're dying. Two responses at once: stay calm and present — your steady calm is the treatment you deliver — and report it, because these symptoms overlap with heart attack and other emergencies, and the nurse must sort out which this is. New chest pain or breathing trouble is never written off as \"just panic.\"\n\n**PTSD signs and trigger responses**\n\nPTSD shows itself in patterns and in moments. The patterns: hypervigilance — always on guard, startling easily, sitting facing the door, sleeping poorly. Nightmares and disturbed nights. Avoiding certain situations, places, or kinds of care. Emotional numbness or detachment. And the moments — trigger responses during care: sudden fear, panic, or \"fighting\" during bathing, dressing, or personal care. Terror at being approached from behind, startled, or confined. A resident suddenly somewhere else — eyes far away, speaking to people who aren't there, reliving something. These aren't \"behaviors\" to manage; they're fear to understand. Note what happened just before — the trigger — because that pattern protects them next time.\n\n**What to report**\n\nReport it all, specifically. Report persistent anxiety, panic attacks, and any new or severe physical symptoms urgently. Report trigger responses with the gold detail: what was happening just before — the time of day, the task, the approach, the sound — because identifying triggers lets the whole team adjust care. Report nightmares, night terrors, and fears the resident expresses. And remember from your depression training: anxiety and trauma travel with depression, so watch for hopelessness and any talk of not wanting to live — and respond exactly as you learned: take it seriously, stay, report immediately, never promise secrecy.\n\n**Summary**\n\nFour pictures. Anxiety: persistent worry, restlessness, physical complaints, poor sleep, reassurance-seeking. Panic attack: sudden intense fear, pounding heart, breathlessness, doom — stay calm AND report; never assume it's \"just panic.\" PTSD: hypervigilance, nightmares, avoidance — and trigger responses during care, where resistance is often fear. Report: the signs, the symptoms, and especially what happened just before a trigger response.\n\nThe rule underneath it all: recognize anxiety behind the physical complaints, treat panic symptoms as reportable, read \"difficult behavior\" during care as possible fear — and always note what came just before." },
            { id: 'apt-s05-panic-callout', type: 'callout', variant: "warning", title: "Panic symptoms overlap with cardiac emergencies", body: "Stay calm and present — and report new or severe chest pain and breathlessness every time. Never assume \"just panic.\"" },
          ]),
      },
      {
        slug: 's06-causes',
        title: "Causes",
        sortOrder: 1,
        buildContent: () =>
          doc("Causes", [
            { id: 'apt-s06-heading', type: 'heading', level: 1, text: "Causes" },
            pendingAudio(
              'apt-s06-audio',
              "Where Anxiety and Old Trauma Come From — and What Care Can Touch",
              `${ASSET_BASE}/s06-causes-podcast.mp3`,
              "Where Anxiety and Old Trauma Come From — and What Care Can Touch\n\nAnxiety and PTSD in older adults have understandable causes, and seeing them clearly does two things: it replaces judgment with compassion, and it shows exactly where a caregiver's choices matter.\n\nAnxiety in elders typically comes from several sources stacking. There's biology — anxiety runs in families and involves the brain's alarm system. There are medical contributors: thyroid problems, heart and lung conditions, pain, and certain medications can all produce or worsen anxiety, which is one reason new anxiety deserves medical attention rather than dismissal. And there are the realities of late life: health fears, fear of falling, loss of independence and control, grief, financial worry, and the uncertainty that comes with declining abilities. A care facility can ease some of these — and can worsen others, particularly the loss of control over one's own day, body, and space. Anxiety also frequently travels with depression, each feeding the other.\n\nPTSD's cause is, by definition, trauma — and the generation now in long-term care has lived through much: combat in past wars; childhood and domestic abuse in eras when no one spoke of it; sexual assault; displacement, persecution, and flight; catastrophic accidents and losses. Many survivors coped by silence and work and routine for decades. What brings old trauma forward in late life? Several things: the losses and stresses of aging strain the defenses that held it down; retirement and quiet leave more room for memories; declining health creates helplessness that echoes the original trauma; and dementia, as it erodes recent memory, can make decades-old traumatic memories vivid and present again. So trauma that \"was handled\" for fifty years can resurface exactly when a person enters care.\n\nThen there's the part a CNA most directly touches: what makes care settings triggering. The common threads of trauma are powerlessness, violation, confinement, and threat — and ordinary care can unintentionally echo all of them. Being undressed and bathed by a stranger. Being touched without warning or consent. Someone standing over you, approaching from behind, grabbing your arm to help. Locked units, alarms, shouting, sudden noises, being startled awake. Loss of choice over when and how things happen. None of this is anyone's fault — but each is a cause of fear that caregiving habits can remove.\n\nAnd that's the empowering takeaway. You can't change a resident's biology, history, or losses. But the triggers built into how care is delivered — surprise, powerlessness, unexplained touch, lost choice — are precisely what trauma-informed care eliminates: predictability, explaining first, asking consent, offering control, calm frontal approach, knowing and avoiding individual triggers. The CNA can't heal the trauma — that's for professionals — but the CNA controls whether daily care presses on the wound or protects it.",
              '/assets/courses/anxiety-ptsd/s06-causes-podcast.mp3',
            ),
            {
              id: 'apt-s06-image',
              type: 'image',
              src: `${ASSET_BASE}/s06-hero.png`,
              caption:
                'What triggers anxiety and trauma responses — noise, routine changes, and reminders of the past.',
            },
          ]),
      },
      {
        slug: 's07-role',
        title: "CNA Role & Best Practices",
        sortOrder: 2,
        buildContent: () =>
          doc("CNA Role & Best Practices", [
            { id: 'apt-s07-heading', type: 'heading', level: 1, text: "CNA Role & Best Practices" },
            {
              id: 'apt-s07-image',
              type: 'image',
              src: `${ASSET_BASE}/s07-hero.png`,
              caption:
                'Your scope — provide calm support and report; CNAs don\'t diagnose or treat.',
            },
            { id: 'apt-s07-scope-callout', type: 'callout', variant: "clinical", title: "Scope of practice", body: "CNAs DELIVER TRAUMA-INFORMED CARE, RESPOND CALMLY, and REPORT. CNAs never diagnose anxiety or PTSD, provide therapy or counseling, give or adjust medications, or ask residents to recount or process their trauma." },
            { id: 'apt-s07-narration', type: 'text', body: "Anxiety and PTSD are treated by professionals — therapy and sometimes medication — but how daily care is delivered is itself part of the treatment, and that's the CNA's. Let's walk through it, starting with the rule that never bends, stated firmly because it matters most here. A CNA does not diagnose anxiety or PTSD, does not provide therapy or counseling, does not give or adjust medications, and does not ask a resident to recount or process their trauma — opening trauma is a professional's work; your work is making the present safe.\n\n**Trauma-informed care — your daily treatment.** These habits, with every resident, every time. Be predictable: consistent routines, consistent caregivers where possible, no surprises. Explain before you do: every step, in simple words, before every touch — \"I'm going to help you with your sleeve now, alright?\" Ask consent and wait for it. Offer choices and control wherever possible — when, how, what order, who. Approach from the front, calmly, at eye level, never startling or grabbing. Knock, announce yourself, keep the resident covered and dignified during personal care. And learn each resident's known triggers from the care plan and avoid them. These habits protect every resident, and for trauma survivors they make care safe instead of terrifying.\n\n**Responding to a panic attack — calm is the treatment.** When a resident panics: stay with them and stay visibly calm — your steadiness is what their alarm system borrows. Speak slowly, simply, and reassuringly: \"I'm here with you. You're safe. This will pass.\" Don't dismiss the fear or tell them to \"calm down.\" Encourage slow breathing by doing it with them. Reduce stimulation — quiet, space, fewer people. And report it — always — because panic symptoms overlap with cardiac and other emergencies, and the nurse decides which this is.\n\n**Responding to a flashback or trigger response — safety without force.** When a resident is triggered or in a flashback: stay calm and give space — do not grab, restrain, corner, or argue about what's real. Speak gently and identify yourself and the present: their name, your name, where they are, that they're safe — simple grounding. Remove or stop the trigger if you can: pause the task, lower the noise, step back. Approach from the front, hands visible, no sudden moves. Let it pass without forcing the task — care can wait; safety and trust can't be un-broken. Then report what happened and what came just before, so the team can adjust.\n\n**Supporting professional treatment.** Support therapy participation and the care plan. Support medications as the nurse administers them, report side effects and refusals — and note that some anxiety medications can cause drowsiness, unsteadiness, and fall risk in elders, so watch and report those. Report patterns: what triggers, what calms, what's working.\n\n**Comfort, routine, and connection.** Deliver the daily stabilizers: consistent routines, calm environment, adequate sleep support, gentle activity, and warm connection — the same connection you learned in depression care, because these conditions travel together.\n\nThe scope point for this section: you never diagnose, counsel, medicate, or open trauma — but you deliver trauma-informed care that prevents triggering, respond to panic and flashbacks with calm and grounding, support treatment, and report patterns. The way you give care is the treatment you own." },
          ]),
      },
      {
        slug: 's08-prevention',
        title: "Prevention & Risk Reduction",
        sortOrder: 3,
        buildContent: () =>
          doc("Prevention & Risk Reduction", [
            { id: 'apt-s08-heading', type: 'heading', level: 1, text: "Prevention" },
            {
              id: 'apt-s08-image',
              type: 'image',
              src: `${ASSET_BASE}/s08-hero.png`,
              caption:
                'Supporting anxious residents — a calm presence, a steady voice, and patience.',
            },
            { id: 'apt-s08-narration', type: 'text', body: "With anxiety and trauma, prevention means delivering care that never becomes frightening. Here are seven ways.\n\n**One. Make care predictable.** Keep routines consistent — same order, same times, same approach, and consistent caregivers where possible. Tell residents what's coming next, today and tomorrow. Predictability is safety to an anxious mind and a trauma survivor: when nothing is a surprise, nothing is an ambush.\n\n**Two. Explain before every touch.** Narrate care in simple, calm words before you do each step — \"I'm going to lift your arm now.\" Never touch without warning, never start a task unannounced, never approach from behind or startle. Unexplained touch is one of care's most common triggers, and you remove it with a sentence.\n\n**Three. Ask consent and offer choices.** Ask permission — \"Is it okay if we do your bath now?\" — and wait for the answer. Offer real choices: when, in what order, shower or bed bath, which clothes. Trauma is powerlessness; choice and consent return power. Every choice you offer is prevention.\n\n**Four. Protect dignity and privacy fiercely.** Knock and announce yourself. Keep residents covered during personal care, exposing only what's needed. Be matter-of-fact and respectful with intimate care. For abuse survivors especially, dignified, consented, unhurried personal care is the difference between care and re-living harm.\n\n**Five. Keep the environment calm.** Reduce sudden loud noises, alarms, shouting, and chaos where you can. Approach calmly, move unhurriedly, keep your voice low and warm. Don't startle residents awake — wake them gently. A calm environment keeps every alarm system, including a hypervigilant one, at rest.\n\n**Six. Learn and avoid each resident's triggers.** Read the care plan for known triggers and honor them — the veteran who can't be approached from behind, the resident who panics with the door closed, the survivor who needs a same-gender caregiver for bathing where possible. And when you discover a new trigger, report it so the whole team can avoid it. Known triggers, avoided, are crises prevented.\n\n**Seven. Build trust through reliability and warmth.** Be the caregiver who always explains, always asks, never surprises, never forces — and who offers steady, genuine warmth. Trust built over weeks is what lets an anxious or traumatized resident relax into care. Your reliability is, quietly, the strongest prevention there is." },
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
            { id: 'apt-s09-heading', type: 'heading', level: 1, text: "Scenario & Reporting" },
            pendingAudio(
              'apt-s09-intro-audio',
              "Emergency response scenarios intro",
              `${ASSET_BASE}/s09-emergency-intro.mp3`,
              "With anxiety and trauma, the judgments that matter most are responding correctly to a resident in a flashback, and never assuming dangerous symptoms are \"just anxiety.\" You're about to work through two situations. Read each carefully, choose your action, and you'll get feedback right away. Keep the core ideas in mind: in a flashback, you give space, ground gently, and never grab or argue — and chest pain with breathlessness is reported, every time, no matter the resident's anxiety history.",
              '/assets/courses/anxiety-ptsd/s09-emergency-intro.mp3',
            ),
            {
              id: 'apt-s09-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-hero.png`,
              caption:
                'Responding to acute distress — staying calm, keeping everyone safe, and getting help.',
            },
            {
              id: 'apt-s09-scenario-kowalczyk-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-scenario-kowalczyk.png`,
              caption:
                'During a flashback, give space and stay calm — never grab or argue; speak gently, keep everyone safe, and get help.',
            },
            { id: 'apt-s09-scenario-kowalczyk', type: 'scenario_question', prompt: "Mr. Kowalczyk, a combat veteran with dementia, suddenly becomes terrified during his morning care when a food cart crashes loudly in the hallway. His eyes go distant, he shouts words you don't understand, takes a defensive crouch in the corner, and when you step toward him he raises his fists — he doesn't seem to recognize you or know where he is. A coworker says, \"Grab his arms before he hurts himself — and tell him there's no war, he's being ridiculous.\" What SHOULD the CNA do?", options: [
                {
                  "id": "grab-restrain",
                  "label": "Grab his arms to restrain him and tell him firmly there's no war",
                  "feedback": "Mr. Kowalczyk is in a flashback — possibly genuinely back in combat in his mind — and sees threat, not help. Grabbing, restraining, rushing the task, or arguing about what's real deepens the terror and invites injury. The right response: step back, give space, stay calm with hands visible, ground him gently (his name, your name, \"you're safe, you're here\"), pause the task, and report the trigger."
                },
                {
                  "id": "space-ground-report",
                  "label": "Step back and give space, stay calm with hands visible, gently ground him — his name, your name, \"you're safe, you're at [facility]\" — pause the task, and report it",
                  "feedback": "Exactly right. The crash triggered a flashback — and with dementia eroding recent memory, Mr. Kowalczyk may genuinely be back in combat, seeing you as a threat. Grabbing him would confirm the threat and could injure you both; arguing about what's real or calling him ridiculous fights his reality and deepens the terror. Instead: step back and give him space — don't corner him. Stay visibly calm, hands open and visible, no sudden moves, approaching only from the front. Ground him gently and simply: say his name, identify yourself, tell him where he is and that he's safe — calm, repeated, unhurried. Reduce the trigger: quiet the environment. Pause the task — care can wait. When it passes, reassure and comfort him. Then report the whole event and the trigger — the loud crash — so the team can protect him from it next time. Space, calm, grounding, no force: that's exactly how a flashback is met.",
                  "isRecommended": true
                },
                {
                  "id": "rush-care",
                  "label": "Keep doing his care quickly to get it over with",
                  "feedback": "Mr. Kowalczyk is in a flashback — possibly genuinely back in combat in his mind — and sees threat, not help. Grabbing, restraining, rushing the task, or arguing about what's real deepens the terror and invites injury. The right response: step back, give space, stay calm with hands visible, ground him gently (his name, your name, \"you're safe, you're here\"), pause the task, and report the trigger."
                },
                {
                  "id": "argue-reality",
                  "label": "Argue with him until he admits where he is",
                  "feedback": "Mr. Kowalczyk is in a flashback — possibly genuinely back in combat in his mind — and sees threat, not help. Grabbing, restraining, rushing the task, or arguing about what's real deepens the terror and invites injury. The right response: step back, give space, stay calm with hands visible, ground him gently (his name, your name, \"you're safe, you're here\"), pause the task, and report the trigger."
                }
              ], requiredForCompletion: true },
            {
              id: 'apt-s09-scenario-abellard-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-scenario-abellard.png`,
              caption:
                'Don\'t assume it\'s \'just\' anxiety when something looks different — stay with the resident and report to the nurse; it could be more.',
            },
            { id: 'apt-s09-scenario-abellard', type: 'scenario_question', prompt: "Mrs. Abellard has a known anxiety disorder and has had panic attacks before. This afternoon she's suddenly frightened, with chest tightness, a racing heart, and shortness of breath. A coworker waves it off: \"She does this — it's just one of her panic attacks. Sit with her and don't bother the nurse.\" Something feels different to you — she looks grayer than usual and the symptoms aren't easing. What SHOULD the CNA do?", options: [
                {
                  "id": "assume-panic",
                  "label": "Assume it's just a panic attack like always and don't tell the nurse",
                  "feedback": "Chest tightness, racing heart, and breathlessness overlap with cardiac emergencies — and an anxiety history doesn't protect her from a heart attack. \"It's just her panic attacks\" is how cardiac events get missed in anxious residents. The right action: stay with her and keep her calm, AND report the symptoms promptly so the nurse can assess — never assume, and never leave her alone."
                },
                {
                  "id": "stay-calm-report",
                  "label": "Stay with her, keep her calm — AND report the chest tightness, racing heart, and breathlessness to the nurse promptly, because these symptoms overlap with cardiac emergencies",
                  "feedback": "Right. This is one of the most important judgments in anxiety care: panic attack symptoms — chest tightness, racing heart, breathlessness, sense of doom — overlap heavily with heart attack and other emergencies, and a resident with an anxiety history can still have a cardiac event. \"She does this\" is exactly the assumption that gets a heart attack missed in an anxious resident. So you do both things at once: stay with her and provide the calm, steady presence that helps either way — and report the symptoms to the nurse promptly so they can assess which this is; that's the nurse's call, never yours or a coworker's. Your instinct that something looks different — the gray color, symptoms not easing — is exactly the kind of observation to include. Never leave her alone with these symptoms, and never write off chest symptoms as \"just anxiety.\" Calm support plus prompt reporting covers her either way.",
                  "isRecommended": true
                },
                {
                  "id": "calm-down-leave",
                  "label": "Tell her to calm down and breathe, and leave her to ride it out alone",
                  "feedback": "Chest tightness, racing heart, and breathlessness overlap with cardiac emergencies — and an anxiety history doesn't protect her from a heart attack. \"It's just her panic attacks\" is how cardiac events get missed in anxious residents. The right action: stay with her and keep her calm, AND report the symptoms promptly so the nurse can assess — never assume, and never leave her alone."
                },
                {
                  "id": "walk-it-off",
                  "label": "Have her walk it off",
                  "feedback": "Chest tightness, racing heart, and breathlessness overlap with cardiac emergencies — and an anxiety history doesn't protect her from a heart attack. \"It's just her panic attacks\" is how cardiac events get missed in anxious residents. The right action: stay with her and keep her calm, AND report the symptoms promptly so the nurse can assess — never assume, and never leave her alone."
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
            { id: 'apt-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
              id: 'apt-s10-video',
              type: 'video',
              title: 'The CNA\'s Role',
              videoUrl: '/assets/courses/anxiety-ptsd/s10-cna-role.mp4',
              placeholderNote: 'Pending upload: /assets/courses/anxiety-ptsd/s10-cna-role.mp4',
            },
            {
              id: 'apt-s10-image',
              type: 'image',
              src: `${ASSET_BASE}/s10-hero.png`,
              caption:
                'Your role — noticing distress, offering calm reassurance, and reporting concerns.',
            },
            { id: 'apt-s10-narration', type: 'text', body: "Your role with anxiety and PTSD is trauma-informed care, calm response, pattern-spotting, and trust-building — and it determines whether care feels safe or frightening. Let's walk through it.\n\n**Deliver trauma-informed care to everyone** Make the habits universal: predictability, explaining before every touch, asking consent, offering choices, calm frontal approach, fierce dignity in personal care, and honoring known triggers from the care plan. You can't know who carries trauma, so you protect everyone — and for the survivors in your care, these habits are the difference between care and terror. This is the treatment you deliver every shift.\n\n**Respond to panic and flashbacks correctly** When fear erupts, be the calm. For panic: stay, steady voice, breathe with them, never dismiss — and report, because panic symptoms overlap with emergencies and the nurse decides. For flashbacks and trigger responses: space, no grabbing, no arguing with their reality, gentle grounding — their name, your name, where they are, that they're safe — pause the task, and let it pass. Your composure is what their alarm system borrows.\n\n**Spot the patterns and report them** Be the pattern-spotter. When a resident has a fear response, note what came just before — the task, the sound, the approach, the time — and report it, because identified triggers let the whole team adjust care and prevent the next crisis. Report anxiety signs hiding behind physical complaints, report panic attacks, report nightmares and night fears — and remember these conditions travel with depression, so watch for hopelessness and respond exactly as you learned: take it seriously, stay, report immediately, never promise secrecy.\n\n**Build the trust that heals** Play the long game: be the caregiver who never surprises, never forces, always explains, always asks — shift after shift. That reliability builds the trust that lets an anxious or traumatized resident gradually relax into care, sleep better, resist less, and live easier. Add genuine warmth and connection, and you're delivering the steady safety that old wounds need.\n\nNow the boundary. You do not diagnose anxiety or PTSD. You do not provide therapy, and you never ask a resident to recount or process their trauma — making the present safe is yours; opening the past is the professional's. You do not give or adjust medications. And you never grab, restrain, corner, or argue with a resident in a flashback, never dismiss panic symptoms as \"just anxiety,\" and never deliver care by surprise or force.\n\nInside your role — trauma-informed habits, calm response, pattern-spotting, and trust — you prevent the fear that ordinary care can cause, you protect residents in their most frightened moments, and you give trauma survivors what they've needed all along: care that is safe. That is profound work, and it's yours." },
            { id: 'apt-s10-scope-callout', type: 'callout', variant: "clinical", title: "Stay within scope", body: "You do not diagnose anxiety or PTSD, provide therapy, give or adjust medications, or ask residents to recount their trauma. Never grab or argue in a flashback, and never dismiss panic symptoms as \"just anxiety.\"" },
          ]),
      },
      {
        slug: 's11-case-study',
        title: "Case Study",
        sortOrder: 2,
        buildContent: () =>
          doc("Brief Case Study", [
            { id: 'apt-s11-heading', type: 'heading', level: 1, text: "Brief Case Study" },
            pendingAudio(
              'apt-s11-audio',
              "The Bath That Stopped Being a Battle",
              `${ASSET_BASE}/s11-case-podcast.mp3`,
              "Mrs. Abellard, 81, had a reputation on the unit before her CNA, Tomas, ever met her: \"difficult with care.\" Bath times were battles — she would tense, cry, beg staff to stop, sometimes strike out. Some staff dreaded being assigned to her; care notes described \"resistance to bathing\" and \"combative behavior.\" She was also anxious in general: wound tight, startling easily, sleeping poorly, asking the same worried questions again and again.\n\n**What Tomas wondered:** Tomas had just completed training on trauma and care, and one idea had lodged in him: when a resident \"fights\" care, ask what's being touched underneath the task. Mrs. Abellard's pattern — terror specifically around being undressed and bathed, hypervigilance, the startling, the poor sleep — fit what he'd learned about trauma survivors, for whom intimate care by strangers can feel like harm returning. He didn't need to know her history, and he never asked her to share it — that wasn't his place. He just changed how he gave care, on the assumption that it might be true.\n\n**What Tomas changed:** He rebuilt her bath around trauma-informed habits. He kept it utterly predictable — same time, same routine, told her the day before and the morning of. He asked consent at the start — \"Would it be alright if we do your bath now? We'll go at your pace\" — and waited for her yes. He explained every single step before doing it — \"I'm going to help with your sleeve now, okay?\" — and never touched without warning. He gave her every possible choice: the order of things, the water temperature, holding the washcloth to do what she could herself. He kept her covered except the part being washed, draping her with towels, guarding her dignity fiercely. He never rushed, never stood over her, approached from the front, and stopped the moment she seemed distressed — \"We can pause. You're in charge here.\"\n\n**The turn:** It didn't change in a day. But over weeks, the battles faded. Given warning, consent, choices, and cover, Mrs. Abellard's terror had less and less to grip. She began doing parts of her own washing, holding the cloth like something reclaimed. Her tension eased beyond bath time too — she startled less around Tomas, slept better, asked fewer frantic questions. One morning she told him quietly, \"You're the first one who ever asked.\" He reported what worked — the warnings, the choices, the draping, the pacing — and the team adopted her routine, writing it into her care plan so every caregiver protected her the same way.\n\n**The other catch:** Tomas's calm also proved itself in a different moment. One afternoon Mrs. Abellard had sudden chest tightness, a racing heart, and breathlessness — and a coworker shrugged, \"That's her anxiety, she does this.\" Tomas stayed with her, kept her calm — and reported it promptly anyway, because he'd learned panic symptoms overlap with cardiac emergencies and that call belongs to the nurse. The nurse assessed her; that day it was panic, and she was treated and supported. \"But you did exactly right,\" the nurse told him. \"The day it isn't panic, that report is what saves her.\"\n\n**The outcome:** Bath time stopped being a battle because it stopped feeling like an attack. Mrs. Abellard's \"combative behavior\" had never been combativeness — it had been fear, and when the fear was answered with predictability, consent, choice, and dignity, it subsided. The nurse summed it up: \"We spent a year managing her 'behavior.' Tomas spent three weeks removing the reasons for it. Nothing about her changed — everything about how we approached her did.\"\n\n**Discussion:** Tomas's case is trauma-informed care proven in practice. He read \"difficult behavior\" as possible fear and asked what care was touching underneath. He never probed her history or asked her to explain — he simply made care safe: predictable, explained, consented, choiceful, dignified, unhurried. He reported the pattern of what worked so the whole team could protect her. And he refused the \"it's just her anxiety\" trap, reporting cardiac-overlapping symptoms for the nurse to judge. He never diagnosed or counseled; he changed the delivery of care — the part that was always his — and a battle became a bath.",
              '/assets/courses/anxiety-ptsd/s11-case-podcast.mp3',
            ),
            {
              id: 'apt-s11-image',
              type: 'image',
              src: `${ASSET_BASE}/s11-hero.png`,
              caption:
                'Putting it together — calm, trauma-informed support for anxious residents.',
            },
            { id: 'apt-s11-case-study', type: 'case_study', title: "The Bath That Stopped Being a Battle", residentProfile: "Mrs. Abellard, 81, had a reputation on the unit before her CNA, Tomas, ever met her: \"difficult with care.\" Bath times were battles — she would tense, cry, beg staff to stop, sometimes strike out. Some staff dreaded being assigned to her; care notes described \"resistance to bathing\" and \"combative behavior.\" She was also anxious in general: wound tight, startling easily, sleeping poorly, asking the same worried questions again and again.", scenario: "**What Tomas wondered:** Tomas had just completed training on trauma and care, and one idea had lodged in him: when a resident \"fights\" care, ask what's being touched underneath the task. Mrs. Abellard's pattern — terror specifically around being undressed and bathed, hypervigilance, the startling, the poor sleep — fit what he'd learned about trauma survivors, for whom intimate care by strangers can feel like harm returning. He didn't need to know her history, and he never asked her to share it — that wasn't his place. He just changed how he gave care, on the assumption that it might be true.\n\n**What Tomas changed:** He rebuilt her bath around trauma-informed habits. He kept it utterly predictable — same time, same routine, told her the day before and the morning of. He asked consent at the start — \"Would it be alright if we do your bath now? We'll go at your pace\" — and waited for her yes. He explained every single step before doing it — \"I'm going to help with your sleeve now, okay?\" — and never touched without warning. He gave her every possible choice: the order of things, the water temperature, holding the washcloth to do what she could herself. He kept her covered except the part being washed, draping her with towels, guarding her dignity fiercely. He never rushed, never stood over her, approached from the front, and stopped the moment she seemed distressed — \"We can pause. You're in charge here.\"\n\n**The turn:** It didn't change in a day. But over weeks, the battles faded. Given warning, consent, choices, and cover, Mrs. Abellard's terror had less and less to grip. She began doing parts of her own washing, holding the cloth like something reclaimed. Her tension eased beyond bath time too — she startled less around Tomas, slept better, asked fewer frantic questions. One morning she told him quietly, \"You're the first one who ever asked.\" He reported what worked — the warnings, the choices, the draping, the pacing — and the team adopted her routine, writing it into her care plan so every caregiver protected her the same way.\n\n**The other catch:** Tomas's calm also proved itself in a different moment. One afternoon Mrs. Abellard had sudden chest tightness, a racing heart, and breathlessness — and a coworker shrugged, \"That's her anxiety, she does this.\" Tomas stayed with her, kept her calm — and reported it promptly anyway, because he'd learned panic symptoms overlap with cardiac emergencies and that call belongs to the nurse. The nurse assessed her; that day it was panic, and she was treated and supported. \"But you did exactly right,\" the nurse told him. \"The day it isn't panic, that report is what saves her.\"\n\n**The outcome:** Bath time stopped being a battle because it stopped feeling like an attack. Mrs. Abellard's \"combative behavior\" had never been combativeness — it had been fear, and when the fear was answered with predictability, consent, choice, and dignity, it subsided. The nurse summed it up: \"We spent a year managing her 'behavior.' Tomas spent three weeks removing the reasons for it. Nothing about her changed — everything about how we approached her did.\"\n\n**Discussion:** Tomas's case is trauma-informed care proven in practice. He read \"difficult behavior\" as possible fear and asked what care was touching underneath. He never probed her history or asked her to explain — he simply made care safe: predictable, explained, consented, choiceful, dignified, unhurried. He reported the pattern of what worked so the whole team could protect her. And he refused the \"it's just her anxiety\" trap, reporting cardiac-overlapping symptoms for the nurse to judge. He never diagnosed or counseled; he changed the delivery of care — the part that was always his — and a battle became a bath." },
            { id: 'apt-s11-reflection-1', type: 'reflection', prompt: "Mrs. Abellard was labeled \"combative with care.\" What did Tomas understand her resistance to really be, and which trauma-informed habits dissolved it?", minCharacters: 50 },
            { id: 'apt-s11-reflection-2', type: 'reflection', prompt: "When she had chest tightness and breathlessness, a coworker said \"that's just her anxiety.\" Why did Tomas report it anyway, and why is that judgment so important?", minCharacters: 50 },
            { id: 'apt-s11-rp-text', type: 'text', body: "Reflect on the case study in the previous lesson. Your written responses help you apply what you learned about trauma-informed care, reading \"difficult behavior\" as possible fear, and never dismissing cardiac-overlapping symptoms as \"just anxiety.\"" },
            { id: 'apt-s11-kc2-check', type: 'knowledge_check', question: "A CNA does not diagnose anxiety or PTSD, does not provide therapy or counseling, does not give or adjust medications, and does not ask a resident to recount or process their trauma — opening trauma is a professional's work; your work is making the present safe. Mr. Kowalczyk, a combat veteran with dementia, suddenly becomes terrified during his morning care when a food cart crashes loudly in the hallway. His eyes go distant, he shouts words you don't understand, takes a defensive crouch in the corner, and when you step toward him he raises his fists — he doesn't seem to recognize you or know where he is. A coworker says, \"Grab his arms before he hurts himself — and tell him there's no war, he's being ridiculous.\" What SHOULD the CNA do?", options: [
                {
                  "id": "grab-restrain",
                  "label": "Grab his arms to restrain him and tell him firmly there's no war"
                },
                {
                  "id": "space-ground-report",
                  "label": "Step back and give space, stay calm with hands visible, gently ground him — his name, your name, \"you're safe, you're at [facility]\" — pause the task, and report it"
                },
                {
                  "id": "rush-care",
                  "label": "Keep doing his care quickly to get it over with"
                },
                {
                  "id": "argue-reality",
                  "label": "Argue with him until he admits where he is"
                }
              ], correctOptionId: "space-ground-report", explanation: "You never diagnose, counsel, medicate, or open trauma — but your calm response to a flashback — space, grounding, no force, and reporting the trigger — is exactly what protects the resident and the team.", requiredForCompletion: true, meta: { flaggedFiller: true } },
          ]),
      },
      {
        slug: 's12-conclusion',
        title: "Conclusion",
        sortOrder: 3,
        buildContent: () =>
          doc("Conclusion", [
            { id: 'apt-s12-heading', type: 'heading', level: 1, text: "Conclusion" },
            {
              id: 'apt-s12-video',
              type: 'video',
              title: 'Conclusion',
              videoUrl: '/assets/courses/anxiety-ptsd/s12-conclusion.mp4',
              placeholderNote: 'Pending upload: /assets/courses/anxiety-ptsd/s12-conclusion.mp4',
            },
            {
              id: 'apt-s12-image',
              type: 'image',
              src: `${ASSET_BASE}/s12-hero.png`,
              caption:
                'Caring with calm and compassion — helping residents feel safe and supported.',
            },
            { id: 'apt-s12-narration', type: 'text', body: "You've reached the end. Let's lock in the five things that matter most for anxiety and PTSD care.\n\n**One.** Anxiety and PTSD are real, treatable conditions — not weakness, not \"just nerves.\" Anxiety in elders often hides behind physical complaints; PTSD can persist silently for decades; and many residents carry old trauma from war, abuse, and loss. Dementia can resurface that trauma, making the past vividly present again.\n\n**Two.** Deliver trauma-informed care to everyone. Predictability. Explain before every touch. Ask consent. Offer choices and control. Approach calmly from the front. Guard dignity fiercely in personal care. Avoid known triggers. These habits cost nothing, comfort every resident — and for trauma survivors, they're the difference between care and terror.\n\n**Three.** Respond to fear correctly. For panic: stay, steady calm voice, breathe with them — and report, because panic symptoms overlap with cardiac emergencies; never assume \"just anxiety.\" For flashbacks: space, no grabbing, no arguing with their reality — gentle grounding, pause the task, let it pass, then report the trigger.\n\n**Four.** Read \"behavior\" as possible fear, and spot the patterns. A resident who fights care may be a survivor whose trauma is being touched. Note what happens just before distress — the task, sound, approach — and report it, so the whole team can remove the triggers. Identified triggers are crises prevented.\n\n**Five.** Honor your scope, and build trust. You never diagnose, counsel, medicate, or ask a resident to recount their trauma — making the present safe is your work; the past belongs to professionals. Through reliability, warmth, and care that never surprises or forces, you build the trust that lets anxious and traumatized residents finally rest. That is profound care, and it's yours." },
            { id: 'apt-s12-summary', type: 'summary', title: "Five things that matter most", items: ["Anxiety and PTSD are real, treatable conditions — not weakness or \"just nerves.\"","Deliver trauma-informed care to everyone — predictability, consent, explanation, choice, dignity.","Respond to fear correctly — calm for panic (and report); space and grounding for flashbacks.","Read \"behavior\" as possible fear — note what happened just before and report triggers.","Honor your scope — make the present safe; build trust through reliability and warmth."] },
            { id: 'apt-s12-whn-text', type: 'text', body: "Ten questions are waiting. Everything on them was covered here. You're ready. Trust what you've learned, and show what you know." },
            { id: 'apt-s12-cr-text', type: 'text', body: "This course provides one hour of continuing education credit through CAL ACE Nursing Academy, an approved CDPH continuing education provider, NAC number 7384. Your certificate is generated automatically when you pass the knowledge check." },
            { id: 'apt-s12-cr-callout', type: 'callout', variant: "info", title: "Scope reminder", body: "CNAs recognize, respond calmly, deliver trauma-informed care, and report. CNAs do not diagnose, provide therapy, give or adjust medications, or ask residents to recount or process their trauma." },
            { id: 'apt-s12-ca-text', type: 'text', body: "Your certificate is generated automatically when you pass the knowledge check. CDPH-Approved CE Provider — NAC #7384." },
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

export async function seedCourse45AnxietyPtsd(
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
    `Seeding Course 45 (Anxiety & PTSD in Older Adults) as DRAFT — slug "${COURSE_SLUG}"…`,
  );

  try {
    const result = await seedCourse45AnxietyPtsd(prisma);
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
