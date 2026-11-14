/**
 * Seed Course 11 — Pain Recognition & Comfort Care (DRAFT).
 *
 * NEW CLINICAL COURSE — fills the slot freed when Course 10 absorbed the former
 * "CNA Renewal Readiness & CDPH Documentation" documentation strand. Standard 12–50
 * scaffold (standard S5–S8 titles: Signs & Symptoms / Causes / Medications & Treatment /
 * Prevention).
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-11-pain-comfort
 *
 * Idempotent upserts by slug. Self-cleans stray modules on the target DRAFT version.
 * Does not seed the final quiz (pending owner approval; see the -exam.ts file).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SLUG DECISION (confirmed with Dr. Cliff via roster inspect inspect-pain-comfort-target.ts):
 *   NEW slug 'pain-comfort', NEW course, VERSION_NUMBER = 1.
 *   No existing pain/comfort course exists — this seeds FRESH (expect "Created: yes (new)").
 *   The old 'cna-renewal-readiness' course is left LIVE and untouched here; retiring it
 *   (course ARCHIVED / version RETIRED, never delete) is a SEPARATE deliberate step.
 * DRAFT-only. Run order: this main seed first, then the -exam seed.
 *
 * SCOPE: CNAs recognize pain (including non-verbal/behavioral signs in those who can't say
 * "I hurt"), report it accurately, and provide non-medication comfort measures within scope
 * (positioning, warmth, presence, gentle handling, calm environment). CNAs do NOT diagnose
 * pain, give it a clinical pain rating/assessment, or give pain medications — they recognize,
 * report, and comfort.
 *
 * SENSITIVE: comfort care touches end-of-life gently and within scope (comfort, dignity,
 * presence) — no clinical or medication detail.
 *
 * ACCURACY: prevalence/under-recognition described qualitatively (no fabricated numbers),
 * with a sourced footer callout pointing to geriatric pain & long-term care research.
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

// NEW slug — confirmed via roster inspect; no existing pain/comfort course.
const COURSE_SLUG = 'pain-comfort';

const COURSE_TITLE = 'Pain Cues, Comfort Measures, and Reporting';
const COURSE_SUMMARY =
  'Pain is whatever the person says it is — and when a resident can\'t say "I hurt," the CNA is the one who must see it. Recognize pain both told and hidden (the non-verbal and behavioral signs in those with dementia, stroke, confusion, or near the end of life), understand that so much "difficult behavior" is unrecognized pain, report it accurately so it gets treated, and provide non-medication comfort measures — positioning, warmth, presence, gentle handling, a calm environment, and dignified comfort care at the end of life. CNAs recognize, report, and comfort; they do not diagnose, clinically rate, or give pain medications.';

// NEW course — first version.
const VERSION_NUMBER = 1;

const ASSET_BASE = '/assets/courses/pain-comfort';

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
    'Understand that pain is whatever the person says it is — never doubt, dismiss, or judge it',
    'Recognize pain residents tell you about and the non-verbal/behavioral pain in those who can\'t speak',
    'Recognize that much "difficult behavior" is unrecognized pain — ask "could this be pain?"',
    'Report pain accurately and promptly so it can be treated',
    'Provide non-medication comfort measures within scope, including gentle, dignified end-of-life comfort care',
  ],
  faq: [] as { question: string; answer: string }[],
  compliance: {
    providerName: 'CAL ACE Nursing Academy',

    cdphApprovalStatus: 'placeholder' as const,
    targetAudience: 'California certified nursing assistants',
    requiredSeatTimeMinutes: 50,
    onlineDeliveryDesignation: 'online' as const,
  },
  imageAccent: 'rose',
  heroImage: '/assets/courses/pain-comfort/hero-banner.png',
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
    title: 'Pain & Comfort — The Foundation',
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: 'Introduction',
        sortOrder: 0,
        buildContent: () =>
          doc('Introduction', [
            { id: 'pain-s01-heading', type: 'heading', level: 1, text: 'Introduction' },
            {
              id: 'pain-s01-video',
              type: 'video',
              title: 'Introduction',
              videoUrl: `${ASSET_BASE}/s01-intro.mp4`,
              placeholderNote: 'Pending upload: /assets/courses/pain-comfort/s01-intro.mp4',
            },
            {
              id: 'pain-s01-image',
              type: 'image',
              src: '/assets/courses/pain-comfort/s01-hero.jpg',
              caption: 'The caregiver whose attentive eyes relieve hidden suffering.',
            },
            {
              id: 'pain-s01-narration',
              type: 'text',
              body: [
                'Welcome to CAL ACE Nursing Academy.',
                'This course is about pain recognition and comfort care — noticing when a resident is hurting, even when they can\'t tell you, and easing their suffering. It\'s some of the most compassionate, human work you\'ll ever do, because relieving pain is one of the deepest ways one person can care for another. And it begins with you, because you are the one who sees the resident most.',
                'Let\'s start with the truth at the center of all pain care: pain is whatever the person says it is, and it exists whenever they say it does. We don\'t argue with a resident\'s pain, decide they\'re exaggerating, or judge that they "shouldn\'t" hurt. If a resident says they\'re in pain, they\'re in pain — period. And here\'s the harder, more important part for a CNA: many of your residents can\'t say "I hurt" at all. People with dementia, people who\'ve had a stroke, people who are confused or near the end of life often cannot tell you in words. For them, pain hides — and someone has to see it. That someone is usually you.',
                'Why does this matter so urgently? Because untreated pain is one of the most common, most missed sources of suffering in elder care. Pain that goes unrecognized doesn\'t just hurt — it causes agitation, sleeplessness, loss of appetite, withdrawal, depression, and decline. So much of what looks like "difficult behavior" or "just getting worse" is actually unrecognized pain crying out the only way it can. When you learn to see pain in someone who can\'t speak it, you don\'t just relieve suffering — you often solve the mystery behind agitation, refusal, and decline.',
                'Here\'s the powerful part of your role. You know your residents\' normal. You see them every day — how they move, how they look, what they\'re like. So you\'re the one most able to notice when something changes: the new grimace during a transfer, the guarding of a limb, the resident who\'s suddenly restless, withdrawn, or not eating. Those changes are often pain speaking. Doctors and nurses rely on what you observe and report, because they aren\'t there for the small moments where pain shows itself. Your eyes are where hidden pain gets found.',
                'This course teaches you to recognize pain — both what residents tell you and the non-verbal, behavioral signs in those who can\'t — to report it accurately so it can be treated, and to provide comfort measures within your scope that ease suffering without medication. A guiding phrase you\'ll hear: when they can\'t say it, you have to see it.',
                'The guiding spirit of this course: pain is whatever the person says it is — and when they can\'t say it, you are the one who sees it and speaks for it.',
                'Your scope is clear. A CNA recognizes pain, including its hidden non-verbal signs, reports it accurately, and provides non-medication comfort measures — positioning, warmth, presence, a calm environment, gentle care. A CNA does not diagnose pain, does not give a clinical pain rating or assessment, and does not give pain medications — but the CNA\'s recognition and report are what get pain treated, and the CNA\'s comfort care eases suffering directly.',
                'By the end of this course, you will be able to: understand that pain is whatever the person says it is. Recognize pain you\'re told about and pain you must see. Report pain accurately. And provide comfort measures within your scope. Let\'s begin.',
              ].join('\n\n'),
            },
            {
              id: 'pain-s01-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'When they can\'t say it, you have to see it',
              body: 'Pain is whatever the person says it is, and exists whenever they say it does — we never doubt or judge it. Many residents (dementia, stroke, confusion, end of life) can\'t say "I hurt," so their pain hides in the face, body, and behavior. You recognize pain (told and hidden), report it accurately, and comfort within scope. You do not diagnose, clinically rate, or give pain medications.',
            },
          ]),
      },
      {
        slug: 's02-terms',
        title: 'Terms & Definitions',
        sortOrder: 1,
        buildContent: () =>
          doc('Terms & Definitions', [
            { id: 'pain-s02-heading', type: 'heading', level: 1, text: 'Terms & Definitions' },
            {
              id: 'pain-s02-image',
              type: 'image',
              src: '/assets/courses/pain-comfort/s02-hero.jpg',
              caption: 'Attentive to what a quiet resident cannot say.',
            },
            {
              id: 'pain-s02-reveal-pain',
              type: 'reveal_card',
              frontTitle: 'Pain',
              frontBody: 'Pain',
              backTitle: 'Pain',
              backBody:
                'An unpleasant feeling of hurting — it can be physical, like aching, burning, or sharp pain, and it deeply affects how a person feels in body and mind. The most important rule about pain: it is whatever the person says it is, and it exists whenever they say it does. We never argue with, doubt, or judge a resident\'s pain. If they say they hurt, they hurt.',
            },
            {
              id: 'pain-s02-reveal-acute-chronic',
              type: 'reveal_card',
              frontTitle: 'Acute vs. Chronic Pain',
              frontBody: 'Acute vs. chronic pain',
              backTitle: 'Acute vs. Chronic Pain',
              backBody:
                'Acute pain comes on suddenly and usually has a clear cause — an injury, a procedure, a new problem — and tends to ease as healing happens. Chronic pain lasts a long time, often months or years, as with arthritis. Both are real and both deserve relief. New or sudden acute pain especially should always be reported, because it can signal a new problem.',
            },
            {
              id: 'pain-s02-reveal-nonverbal',
              type: 'reveal_card',
              frontTitle: 'Non-Verbal Pain',
              frontBody: 'Non-verbal pain',
              backTitle: 'Non-Verbal Pain',
              backBody:
                'Pain in a person who cannot tell you about it in words — because of dementia, a stroke, confusion, or being near the end of life. Their pain is just as real; it simply shows itself through the face, the body, and behavior instead of words. Recognizing non-verbal pain is one of the most important skills a CNA can have, because for these residents, you are their voice.',
            },
            {
              id: 'pain-s02-reveal-guarding',
              type: 'reveal_card',
              frontTitle: 'Guarding',
              frontBody: 'Guarding',
              backTitle: 'Guarding',
              backBody:
                'Protecting a part of the body that hurts — holding, tensing, or shielding it, pulling away when it\'s touched, or resisting movement of that area. Guarding is a key non-verbal sign of pain. A resident who winces and pulls their arm away during care, or holds their belly, or won\'t bear weight on a leg, may be showing you exactly where it hurts.',
            },
            {
              id: 'pain-s02-reveal-grimacing',
              type: 'reveal_card',
              frontTitle: 'Grimacing',
              frontBody: 'Grimacing',
              backTitle: 'Grimacing',
              backBody:
                'A pained facial expression — a tight, frowning, or distressed face, furrowed brow, clenched jaw, or wincing. The face is one of the most honest signs of pain, especially in people who can\'t speak. Watch a resident\'s face during movement, transfers, and care: a grimace that appears with motion is pain telling you something hurts, even if no words are spoken.',
            },
            {
              id: 'pain-s02-reveal-comfort-measures',
              type: 'reveal_card',
              frontTitle: 'Comfort Measures',
              frontBody: 'Comfort measures',
              backTitle: 'Comfort Measures',
              backBody:
                'The non-medication things a CNA can do to ease pain and increase comfort — repositioning, supportive pillows, warmth or a blanket, a calm quiet environment, gentle careful handling, a soothing presence, distraction, and simple kindness. Comfort measures don\'t replace medical pain treatment, but they ease suffering directly and are fully within a CNA\'s scope. Comfort is care.',
            },
            {
              id: 'pain-s02-reveal-reporting',
              type: 'reveal_card',
              frontTitle: 'Reporting Pain',
              frontBody: 'Reporting pain',
              backTitle: 'Reporting Pain',
              backBody:
                'Telling the nurse, accurately and specifically, about the pain you observe or are told about — where it is, what it\'s like, when it happens, how severe it seems, and what the resident said or showed. Because CNAs don\'t treat pain with medication, your report is the bridge to relief: it\'s how the nurse and doctor learn the pain exists and can act on it. Accurate reporting gets pain treated.',
            },
            {
              id: 'pain-s02-reveal-comfort-care',
              type: 'reveal_card',
              frontTitle: 'Comfort Care (End of Life)',
              frontBody: 'Comfort care (end of life)',
              backTitle: 'Comfort Care (End of Life)',
              backBody:
                'Care focused entirely on comfort, dignity, and easing suffering rather than curing — often important near the end of life. For a CNA, comfort care means gentle physical care, relief of pain and discomfort within your role, a calm and dignified environment, and simply being present. It is profoundly meaningful work: helping someone be comfortable, cared for, and not alone.',
            },
            {
              id: 'pain-s02-knowledge-check',
              type: 'knowledge_check',
              question: 'A resident with dementia who cannot speak may show pain through:',
              options: [
                { id: 'signs', label: 'Grimacing, guarding a body part, moaning, and new agitation' },
                { id: 'nothing', label: 'Nothing — if they can\'t say it, they aren\'t in pain' },
                { id: 'fever', label: 'Only a fever' },
              ],
              correctOptionId: 'signs',
              explanation:
                'A resident who can\'t use words still feels pain — it simply shows through the face, body, and behavior instead. Grimacing, guarding a body part, moaning (especially with movement), and new agitation or refusing care are classic non-verbal pain signs. For these residents, you are their voice: when they can\'t say it, you have to see it.',
              requiredForCompletion: true,
            },
          ]),
      },
      {
        slug: 's03-statistics',
        title: 'Why It Matters',
        sortOrder: 2,
        buildContent: () =>
          doc('Why It Matters', [
            { id: 'pain-s03-heading', type: 'heading', level: 1, text: 'Why It Matters' },
            {
              id: 'pain-s03-image',
              type: 'image',
              src: '/assets/courses/pain-comfort/s03-hero.jpg',
              caption: 'Recognizing pain that has no words.',
            },
            pendingAudio(
              'pain-s03-audio',
              'The Pain No One Sees: Why a CNA\'s Eyes Relieve Suffering',
              '/assets/courses/pain-comfort/s03-stats-podcast.mp3',
              [
                'The Pain No One Sees: Why a CNA\'s Eyes Relieve Suffering',
                '',
                'Pain is extraordinarily common among the residents CNAs care for — a large share of older adults in long-term care live with pain, much of it daily and much of it chronic, from arthritis, old injuries, wounds, pressure areas, and many other causes. Yet one of the most troubling and well-documented truths in elder care is how badly that pain is under-recognized and under-treated. Studies consistently find that a great deal of pain in nursing homes goes unnoticed and unrelieved — and the residents most likely to suffer in silence are exactly those who cannot speak for themselves: people with dementia, stroke survivors, the confused, and those near the end of life. Their pain is just as real; it simply has no words.',
                '',
                'Why does pain hide so easily? Because we expect pain to announce itself, and in many residents it can\'t. A person with advanced dementia cannot say "my hip hurts." A stroke survivor may not be able to form the words. A confused resident may not understand or express what they feel. So their pain comes out sideways — as a grimace during a transfer, a hand guarding a sore spot, a sudden restlessness, a refusal of care, a loss of appetite, a withdrawal into silence, or new agitation in the evenings. And here is the tragic, crucial connection: so much of what gets labeled "difficult behavior," "agitation," or "just declining" is actually unrecognized pain. A resident who becomes agitated during care may be in pain. A resident who stops eating may be in pain. A resident who cries out when moved is in pain. When caregivers don\'t know to look for non-verbal pain, they miss it — and the suffering continues, often treated as a behavior problem instead of the pain it really is.',
                '',
                'The cost of missed pain is enormous and goes far beyond the hurt itself. Unrelieved pain causes agitation and aggression, sleeplessness, loss of appetite and weight, withdrawal and depression, reduced movement that accelerates physical decline, and a profound loss of quality of life and dignity. It can make every part of a resident\'s life worse. And it is so often preventable — because the pain is treatable once someone recognizes it. This is the heart of why pain care matters: the suffering is common, hidden, and fixable, and recognition is the key that unlocks relief.',
                '',
                'This places the CNA in a uniquely powerful position. The guiding principle of all pain care is that pain is whatever the person says it is, and exists whenever they say it does — we never doubt or judge it. But for residents who can\'t say it, that principle extends: their pain is whatever their face and body and behavior show it to be, and someone has to be skilled enough to see it. That someone is the CNA, who knows the resident\'s normal, who is there for the daily moments, and who notices the change. Because CNAs don\'t give pain medications, their recognition and accurate reporting are the bridge to relief — it\'s how the nurse and doctor learn the pain is there and can treat it. And the comfort measures a CNA provides directly ease suffering. The bottom line: pain is common, badly under-recognized especially in those who can\'t speak, and a major hidden cause of agitation and decline; it is treatable once seen; and the CNA who recognizes pain, reports it, and comforts is the one who turns silent suffering into relief.',
              ].join('\n'),
              `${ASSET_BASE}/s03-stats-podcast.mp3`,
            ),
            {
              id: 'pain-s03-source-note',
              type: 'callout',
              variant: 'clinical',
              title: 'About these claims',
              body: 'Prevalence and under-recognition of pain are described in general, qualitative terms drawn from geriatric pain and long-term care research — no specific statistics are asserted. Any precise figure added later must be verified against the actual source rather than estimated.',
            },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: 'Fundamentals',
        sortOrder: 3,
        buildContent: () =>
          doc('Fundamentals', [
            { id: 'pain-s04-heading', type: 'heading', level: 1, text: 'Fundamentals' },
            {
              id: 'pain-s04-video',
              type: 'video',
              title: 'Fundamentals',
              videoUrl: `${ASSET_BASE}/s04-fundamentals.mp4`,
              placeholderNote: 'Pending upload: /assets/courses/pain-comfort/s04-fundamentals.mp4',
            },
            {
              id: 'pain-s04-image',
              type: 'image',
              src: '/assets/courses/pain-comfort/s04-hero.jpg',
              caption: 'Pain is whatever the person shows it to be — read face and body.',
            },
            {
              id: 'pain-s04-narration',
              type: 'text',
              body: [
                '**Pain is whatever the person says it is**',
                'Begin with the golden rule of all pain care: pain is whatever the person says it is, and it exists whenever they say it does. This means we believe residents about their pain. We never argue, never decide they\'re exaggerating, never judge that they "shouldn\'t" hurt for their condition, and never withhold concern because the pain isn\'t visible. Pain is personal and real to the one feeling it. Your job is never to doubt a resident\'s pain, but to take it seriously, comfort them, and report it. Believing pain is the first act of relieving it.',
                '**When they can\'t say it, you have to see it**',
                'Here\'s the part that makes a CNA\'s skill so vital: many residents can\'t tell you they\'re in pain. Dementia, stroke, confusion, and the end of life can all take away the words. But taking away the words does not take away the pain — it just hides it. For these residents, pain shows itself through the face, the body, and behavior instead of speech. So you become their voice. You learn to read the signs they can\'t say, and to speak for the pain they can\'t report. When they can\'t say it, you have to see it — and that seeing is one of the most compassionate skills in all of caregiving.',
                '**The faces and body of pain**',
                'Pain shows on the face and in the body, and these are your most reliable non-verbal signs. On the face: grimacing, frowning, a furrowed brow, clenched jaw, wincing, a tight or distressed look — especially during movement. In the body: guarding or protecting a body part, tensing, holding or rubbing an area, pulling away from touch, resisting movement, a rigid posture, or restlessness. Watch your residents\' faces and bodies during transfers, repositioning, and care, because pain often appears exactly when you move them. A grimace or a guard that shows up with motion is pain pointing to where it hurts.',
                '**The behaviors and sounds of pain**',
                'Pain also speaks through behavior and sound, especially in those who can\'t use words. Listen for moaning, groaning, crying out, whimpering, or calling out, particularly during movement. Watch for behavior changes: new agitation or aggression, restlessness, refusing care or certain movements, not eating, trouble sleeping, withdrawal, or simply "not being themselves." Remember the crucial link: in someone who can\'t speak, new agitation, refusal, or decline is often pain. So when a resident\'s behavior changes, one of the first questions to ask is: could they be in pain? Behavior is often pain\'s loudest voice.',
                '**Pain hides behind "difficult behavior"**',
                'This idea could change how you see your residents, so hold it close. So much of what gets labeled "difficult behavior," "agitation," or "just declining" is actually unrecognized pain. The resident who becomes agitated during care may be hurting. The one who refuses to be moved may be guarding pain. The one who stopped eating, or withdrew, or cries out when transferred — pain, pain, pain, speaking the only way it can. When you meet a behavior change, don\'t just manage the behavior — ask whether pain is underneath it. Recognizing the pain behind the behavior often solves the mystery and relieves the suffering at once.',
                '**Your role: recognize, report, comfort**',
                'Your role with pain has three parts, all within your scope. Recognize it — both the pain residents tell you about and the hidden pain you must see in those who can\'t speak. Report it — accurately and specifically to the nurse, because your report is the bridge to medical relief; you don\'t give pain medications, so your reporting is what gets them given. And comfort — provide the non-medication comfort measures within your scope that ease suffering directly. You don\'t diagnose pain or rate it clinically or treat it with drugs, but recognizing, reporting, and comforting is powerful, essential care that relieves real suffering.',
                '**Comfort care: easing suffering, always**',
                'Finally, comfort. Even as you report pain for medical treatment, there\'s much you can do yourself to ease suffering, and it matters enormously. Reposition gently to relieve pressure and find a comfortable position. Use supportive pillows, warmth, a blanket. Handle the resident slowly and carefully, especially a sore area. Create a calm, quiet, soothing environment. Offer your presence, a gentle voice, distraction, kindness. And near the end of life, comfort care becomes the whole goal: easing pain and discomfort, protecting dignity, and simply being present so no one suffers or faces it alone. Comfort is not a small thing — it is one of the most healing gifts you give.',
              ].join('\n\n'),
            },
            {
              id: 'pain-s04-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Recognize → Report → Comfort',
              body: 'Believe pain (it\'s whatever the person says it is). When they can\'t say it, see it — in the face (grimace, wince), the body (guarding, pulling away), and behavior (moaning, new agitation, refusing care, not eating). So much "difficult behavior" is unrecognized pain — ask "could this be pain?" Report accurately, comfort within scope, and handle gently to prevent the pain that care can cause.',
            },
          ]),
      },
    ],
  },
  {
    slug: 'module-2',
    title: 'Recognizing & Easing Pain',
    sortOrder: 1,
    lessons: [
      {
        slug: 's05-signs',
        title: 'Signs & Symptoms',
        sortOrder: 0,
        buildContent: () =>
          doc('Signs & Symptoms', [
            { id: 'pain-s05-heading', type: 'heading', level: 1, text: 'Signs & Symptoms' },
            {
              id: 'pain-s05-image',
              type: 'image',
              src: '/assets/courses/pain-comfort/s05-hero.jpg',
              caption: 'A grimace, a guarded limb — the non-verbal signs of pain.',
            },
            {
              id: 'pain-s05-narration',
              type: 'text',
              body: [
                'Recognizing pain — both the pain residents tell you about and the hidden pain you must see — is the skill that gets suffering relieved. You are often the only one positioned to catch it. Let\'s learn the signs.',
                '**The pain residents tell you about**',
                'Start with the simplest case: when a resident can tell you. Believe them. If a resident says they hurt, says something aches, asks for relief, or tells you a movement is painful — that is pain, and you take it seriously, every time. Listen to where it is, what it feels like, when it happens, and how bad it is. Don\'t doubt them, don\'t decide they\'re exaggerating, don\'t judge that they shouldn\'t hurt. Comfort them, and report what they told you. Pain is whatever the person says it is — so when they say it, your job is to believe, comfort, and report it accurately.',
                '**The facial and body signs**',
                'Now the harder, vital skill: seeing pain in those who can\'t say it. Watch the face — grimacing, frowning, furrowed brow, clenched jaw, wincing, a tight or distressed look, especially during movement. Watch the body — guarding or protecting a body part, tensing, holding or rubbing an area, pulling away from touch, resisting being moved, a stiff or rigid posture, restlessness. These signs show up most during transfers, repositioning, dressing, and care, because that\'s when movement provokes the pain. A grimace or a guarded limb that appears when you move a resident is pain pointing straight to the problem. Watch faces and bodies closely during every care task.',
                '**The behavioral and vocal signs**',
                'Pain in those who can\'t speak also comes out through behavior and sound — and this is where it\'s most often missed. Listen for moaning, groaning, crying out, whimpering, or calling out, especially with movement. Watch for behavior changes: new agitation or aggression, restlessness, refusing care or certain movements, not eating, sleeping poorly, withdrawing, or just not being themselves. Here is the key link to hold onto: in a resident who can\'t report pain, a sudden change like new agitation, refusal, or decline is very often pain. So when behavior changes, ask early: could this be pain? That single question catches enormous amounts of hidden suffering.',
                '**What to report**',
                'Your recognition only helps if you report it, so report pain clearly and specifically. Tell the nurse: where the pain seems to be. What it\'s like, or what the resident said. When it happens — at rest, with movement, at certain times. How severe it seems, from what you see or were told. The signs you observed — the grimace, the guarding, the crying out, the behavior change. And any new or sudden pain especially, because that can signal a new problem. Report factually and completely, because you don\'t give pain medications — your accurate report is exactly what lets the nurse and doctor treat the pain. Your words become the resident\'s relief.',
                'The rule underneath it all: believe the pain you\'re told about, see the pain in those who can\'t say it — especially behind behavior changes — and report it accurately, because your report is what gets pain treated.',
              ].join('\n\n'),
            },
            {
              id: 'pain-s05-callout',
              type: 'callout',
              variant: 'warning',
              title: 'See it, then report it',
              body: 'Told-about pain: believe, listen, comfort, report — never doubt or judge. Face & body: grimacing, wincing, guarding, tensing, pulling away — especially with movement. Behavior & sound: moaning, crying out, new agitation, refusing care, not eating, withdrawal — often pain in those who can\'t speak. Report: where, what, when, how severe, what you saw — and any new or sudden pain.',
            },
          ]),
      },
      {
        slug: 's06-causes',
        title: 'Causes',
        sortOrder: 1,
        buildContent: () =>
          doc('Causes', [
            { id: 'pain-s06-heading', type: 'heading', level: 1, text: 'Causes' },
            {
              id: 'pain-s06-image',
              type: 'image',
              src: '/assets/courses/pain-comfort/s06-hero.jpg',
              caption: 'Anticipating where pain lives — handle sore areas with extra care.',
            },
            pendingAudio(
              'pain-s06-audio',
              'Where Pain Comes From — and Why It\'s So Often Missed',
              '/assets/courses/pain-comfort/s06-causes-podcast.mp3',
              [
                'Where Pain Comes From — and Why It\'s So Often Missed',
                '',
                'Understanding what causes pain in residents helps a CNA do two things: anticipate where pain is likely, and recognize it when it shows. Older adults in care very often have multiple sources of pain at once, which is part of why pain is so common among them.',
                '',
                'The most common causes are chronic conditions of the bones, joints, and muscles. Arthritis is enormous — worn, inflamed joints that ache constantly and hurt more with movement, affecting a huge share of elders. Osteoporosis and old or recent fractures cause deep bone pain. Back problems, old injuries, and the general wear of an aging body all contribute. These chronic pains are always there in the background and flare with movement, transfers, and care — which is exactly why so many residents grimace or guard when you move them. Knowing a resident has arthritis or a bad hip tells you to expect pain with motion and to handle that area gently.',
                '',
                'Then there are causes related to the skin and wounds. Pressure injuries are painful, as are other wounds, skin tears, and infections. A resident with a pressure area or wound may hurt during repositioning, cleaning, and dressing changes. Poor circulation, swelling, and certain skin conditions add more. These pains connect directly to the daily care a CNA gives, which means careful, gentle handling around these areas isn\'t just kind — it prevents and eases real pain.',
                '',
                'Many other causes round out the picture. Recent surgery or procedures bring acute pain. Illnesses and infections cause pain in many forms — a urinary infection, pneumonia, an earache, a toothache or mouth problem, constipation, which is a surprisingly common and overlooked cause of pain and agitation in elders. Headaches, cramps, and the discomfort of being kept in one position too long all hurt. And some pain comes from the nervous system, like the burning pain of neuropathy in diabetes. The point isn\'t to diagnose which cause it is — that\'s not your role — but to understand that there are many sources, so pain is always a real possibility to consider.',
                '',
                'And why is pain so often missed despite being so common? Because the residents most likely to have pain are often the least able to report it. Those with dementia, stroke, or confusion can\'t say "my arthritis is flaring" or "my wound hurts," so their very real pain hides behind behavior. Caregivers may also wrongly assume an elder\'s pain is "just normal aging" to be endured, or mistake pain behaviors for psychiatric or behavior problems. The lesson for a CNA: pain has many common, real causes in your residents, it\'s almost always a possibility worth considering, and in those who can\'t speak it hides behind behavior changes. Knowing the causes helps you anticipate pain, handle painful areas gently, and recognize the hurting behind the behavior. The takeaway: pain in elders comes from arthritis, fractures, wounds and pressure areas, procedures, infections, constipation, and many other sources; it\'s extremely common; and because those who can\'t report it suffer most, the CNA who knows where pain comes from and watches for its signs is the one who finds it.',
              ].join('\n'),
              `${ASSET_BASE}/s06-causes-podcast.mp3`,
            ),
          ]),
      },
      {
        slug: 's07-medications',
        title: 'Medications & Treatment',
        sortOrder: 2,
        buildContent: () =>
          doc('Medications & Treatment', [
            { id: 'pain-s07-heading', type: 'heading', level: 1, text: 'Medications & Treatment' },
            {
              id: 'pain-s07-image',
              type: 'image',
              src: '/assets/courses/pain-comfort/s07-hero.jpg',
              caption: 'Mindful of pressure, stiffness, and the sources of discomfort.',
            },
            {
              id: 'pain-s07-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of practice',
              body: 'Pain is treated medically by nurses and doctors. A CNA does not diagnose pain, does not give a clinical pain rating or assessment, and does not give pain medications. The CNA recognizes pain (told and hidden), reports it accurately, provides non-medication comfort measures, and handles gently to prevent pain.',
            },
            {
              id: 'pain-s07-narration',
              type: 'text',
              body: [
                'Pain is treated medically by nurses and doctors — with medications and other measures that are not the CNA\'s to give or decide. But that medical treatment only happens once someone recognizes the pain and reports it — and that someone is usually you. And alongside the medical treatment, there\'s a great deal of comfort you can provide directly, with your own hands and presence. Let\'s walk through your role. And the scope first: a CNA does not diagnose pain, does not give a clinical pain rating or assessment, and does not give pain medications — the CNA recognizes, reports, and comforts.',
                '**Believe and recognize the pain.** It starts with belief and attention. When a resident tells you they hurt, believe them — pain is whatever the person says it is. And for those who can\'t tell you, watch closely for the hidden signs — the grimace, the guarding, the moan with movement, the behavior change — and treat them as the real pain they are. Never doubt, dismiss, or judge a resident\'s pain, and never assume it\'s "just aging" to be endured. Recognition, with belief, is the first and most essential step toward relief.',
                '**Report it accurately — your report is the relief.** Because you don\'t give pain medications, your accurate report is the bridge to treatment. Tell the nurse clearly and specifically: where the pain is, what it\'s like or what the resident said, when it happens, how severe it seems, the signs you saw, and especially any new or sudden pain. Report behavior changes that might be pain, too. The faster and clearer your report, the faster the resident gets relief. In a real sense, your words become their pain medication, because they\'re what prompt it to be given.',
                '**Provide comfort measures — ease suffering directly.** Alongside reporting, do the comforting things within your scope, because they genuinely ease pain. Reposition gently to relieve pressure and find a comfortable position. Use supportive pillows, a blanket, warmth. Handle the resident slowly and carefully, especially sore areas — your gentle technique prevents and eases pain with every transfer and care task. Create a calm, quiet, soothing environment. Offer presence, a gentle voice, distraction, and kindness, which truly help. These non-drug comfort measures don\'t replace medical treatment, but they relieve real suffering and are fully yours to give.',
                '**Handle gently — prevent the pain you can.** Much of the pain residents feel happens during care, so your technique is pain prevention. Move and transfer residents slowly, smoothly, and with support, especially those with arthritis, wounds, fractures, or known pain. Warn them before you move a sore area, go at their pace, and stop or ease up if you cause pain. Position them comfortably and reposition before discomfort builds. Gentle, careful, unhurried handling prevents an enormous amount of avoidable pain — it\'s one of the kindest, most skilled things you do.',
                '**Comfort care at the end of life.** When a resident is near the end of life, comfort becomes the whole goal, and your role is profoundly meaningful. Ease pain and discomfort within your scope, report pain promptly so it\'s treated, keep them clean, gently positioned, and comfortable, create a calm and dignified environment, and above all be present — so they are cared for, comfortable, and not alone. Report any signs of pain or distress so the team can respond. Helping someone be comfortable and accompanied at the end is some of the most important work a caregiver ever does.',
                'The scope point: you don\'t diagnose, rate, or medicate pain — but you believe and recognize it, report it accurately, provide comfort measures, handle gently to prevent pain, and offer comfort care. That role relieves real suffering, every day.',
              ].join('\n\n'),
            },
            {
              id: 'pain-s07-callout',
              type: 'callout',
              variant: 'warning',
              title: 'Believe it · report it · comfort',
              body: 'Believe the pain. Report it clearly: where, what, when, how bad, what you saw — and any new/sudden pain right away. Handle sore areas gently (your technique is pain prevention). Comfort: reposition, warmth, pillows, calm, presence. Never doubt or judge pain, never assume "just aging," never give pain meds or rate it clinically.',
            },
          ]),
      },
      {
        slug: 's08-prevention',
        title: 'Prevention',
        sortOrder: 3,
        buildContent: () =>
          doc('Prevention', [
            { id: 'pain-s08-heading', type: 'heading', level: 1, text: 'Prevention' },
            {
              id: 'pain-s08-image',
              type: 'image',
              src: '/assets/courses/pain-comfort/s08-hero.jpg',
              caption: 'Comfort care: gentle repositioning and a reassuring presence.',
            },
            {
              id: 'pain-s08-narration',
              type: 'text',
              body: [
                'With pain, prevention has two missions: preventing the avoidable pain you can, and preventing pain from going unrecognized and untreated. Here are seven ways.',
                '**One. Handle gently — every transfer, every time.** So much pain happens during care, so your gentle technique is your strongest pain prevention. Move and transfer residents slowly, smoothly, and with good support; be extra careful with arthritis, wounds, fractures, and any sore area; warn before you move a painful part; and go at their pace. Careful, unhurried handling prevents an enormous amount of avoidable pain. Gentle hands are kind hands.',
                '**Two. Reposition before discomfort builds.** Don\'t wait for pain to set in — reposition residents regularly and comfortably, relieve pressure before it hurts, and help them find positions that ease their bodies. Staying too long in one position causes real pain and stiffness. Proactive, comfortable positioning prevents the discomfort of immobility before it ever becomes pain.',
                '**Three. Know who\'s likely to hurt.** Prevent missed pain by knowing which residents are most likely to be in pain — those with arthritis, wounds, fractures, recent procedures, or known chronic pain — and watching them especially closely, particularly during movement. Knowing where pain is likely sharpens your eyes so you catch it. Anticipation is the start of both prevention and recognition.',
                '**Four. Watch for the hidden signs — always.** Prevent pain from going unrecognized by making non-verbal pain signs part of how you see every resident who can\'t speak for themselves. Watch faces and bodies during care, listen for sounds, and treat behavior changes as possible pain. When watching for hidden pain is simply how you work, far less suffering slips by unnoticed and untreated.',
                '**Five. Ask "could this be pain?" with every behavior change.** Prevent the classic mistake of treating pain as a behavior problem by building one habit: whenever a resident becomes newly agitated, refuses care, stops eating, or declines, ask early — could they be in pain? That single question, asked routinely, catches huge amounts of hidden suffering that would otherwise be missed or mismanaged. Make it your reflex.',
                '**Six. Report promptly — don\'t let pain wait.** Prevent prolonged suffering by reporting pain as soon as you recognize it, clearly and specifically, rather than waiting. The sooner you report, the sooner the resident gets relief. Don\'t assume someone else noticed, and don\'t put it off. Prompt reporting prevents hours or days of unnecessary pain. Your quick report is prevention of suffering.',
                '**Seven. Comfort proactively — and never dismiss pain.** Prevent suffering by offering comfort measures generously — positioning, warmth, calm, presence — and by never, ever dismissing a resident\'s pain as exaggeration or "just aging." A resident whose pain is believed, comforted, and reported suffers far less than one whose pain is doubted or ignored. Believing and comforting, always, prevents both physical suffering and the loneliness of being in pain and not heard.',
              ].join('\n\n'),
            },
          ]),
      },
    ],
  },
  {
    slug: 'module-3',
    title: 'Judgment, Role & Comfort Care',
    sortOrder: 2,
    lessons: [
      {
        slug: 's09-emergency',
        title: 'When to Report & Speak Up',
        sortOrder: 0,
        buildContent: () =>
          doc('When to Report & Speak Up', [
            {
              id: 'pain-s09-heading',
              type: 'heading',
              level: 1,
              text: 'When to Report & Speak Up',
            },
            pendingAudio(
              'pain-s09-intro-audio',
              'Seeing pain behind behavior, and believing pain — intro',
              '/assets/courses/pain-comfort/s09-emergency-intro.mp3',
              'With pain, the judgments that matter most are recognizing pain in a resident who can\'t tell you — instead of mistaking it for a behavior problem — and believing and reporting a resident\'s pain rather than doubting it. You\'re about to work through two situations. Read each carefully, choose your action, and you\'ll get feedback right away. Keep the core ideas in mind: in someone who can\'t speak, a new behavior change is often pain — look for it and report it — and pain is whatever the person says it is, so you believe it, comfort, and report, never judge.',
              `${ASSET_BASE}/s09-emergency-intro.mp3`,
            ),
            {
              id: 'pain-s09-image',
              type: 'image',
              src: '/assets/courses/pain-comfort/s09-hero.jpg',
              caption: 'In someone who cannot speak, look for the pain behind the behavior.',
            },
            {
              id: 'pain-s09-scenario-behavior-image',
              type: 'image',
              src: '/assets/courses/pain-comfort/s09-scenario-behavior.jpg',
              caption: 'New agitation during care can be pain — handle gently, do not force.',
            },
            {
              id: 'pain-s09-scenario-behavior',
              type: 'scenario_question',
              prompt:
                'Mr. Whitaker has advanced dementia and cannot tell you in words how he feels. Today he\'s suddenly different — agitated, resisting care, grimacing and pulling away when you move his right arm, moaning during his transfer, and he didn\'t eat lunch. A coworker says, "He\'s just being combative and difficult today — that\'s the dementia. Don\'t worry about it." What SHOULD the CNA do?',
              options: [
                {
                  id: 'dementia',
                  label: 'Agree it\'s just the dementia making him difficult and do nothing',
                  feedback:
                    'Mr. Whitaker can\'t say he\'s in pain, but he\'s showing it: grimacing and pulling away when you move his right arm, guarding it, moaning with movement, new agitation, and not eating are classic non-verbal pain signs. The biggest mistake in pain care is treating pain as "just difficult behavior" or "just the dementia." Doing nothing leaves him suffering. The right response: recognize this may be pain and report it to the nurse specifically, handle him gently, and offer comfort.',
                },
                {
                  id: 'recognize',
                  label: 'Recognize this may be pain — grimacing, guarding his arm, moaning with movement, and not eating are pain signs — and report it to the nurse',
                  feedback:
                    'Exactly right — and this is the recognition that relieves hidden suffering. Mr. Whitaker can\'t tell you he\'s in pain, but he\'s showing you in every way he can: grimacing and pulling away when you move his right arm, guarding that limb, moaning during the transfer, new agitation and resistance, and not eating. In a resident who can\'t speak, these are classic non-verbal pain signs — and crucially, the very behaviors a coworker is dismissing as "just being difficult" or "just the dementia" are exactly how pain shows itself in someone with dementia. This is the most important lesson in pain care: so much "difficult behavior" is unrecognized pain. Calling it dementia and doing nothing, or forcing the care through, leaves him to suffer and may worsen both his pain and his distress. The right response is to recognize the pain behind the behavior and report it to the nurse — specifically: the grimacing and guarding of the right arm, the moaning with movement, the new agitation, the refusal to eat — so he can be assessed and his pain treated. Meanwhile, handle him gently, especially that arm, and offer comfort. You\'re not diagnosing what\'s wrong with his arm; you\'re recognizing he hurts and getting him help. When they can\'t say it, you have to see it — and you just did.',
                  isRecommended: true,
                },
                {
                  id: 'force',
                  label: 'Force the care through quickly since he\'s just being combative',
                  feedback:
                    'Forcing the care through would hurt him more and deepen his distress — his grimacing, guarding of the right arm, moaning with movement, new agitation, and not eating are classic non-verbal pain signs, not combativeness. The right response: recognize this may be pain and report it to the nurse specifically, handle him gently (especially that arm), and offer comfort while he\'s assessed.',
                },
                {
                  id: 'wait',
                  label: 'Wait several days to see if his behavior improves',
                  feedback:
                    'Waiting days leaves him in pain that long — his grimacing, guarding, moaning with movement, new agitation, and not eating are showing you pain now. The right response: recognize this may be pain and report it to the nurse promptly and specifically, handle him gently, and offer comfort so he can be assessed and treated.',
                },
              ],
              requiredForCompletion: true,
            },
            {
              id: 'pain-s09-scenario-believe-image',
              type: 'image',
              src: '/assets/courses/pain-comfort/s09-scenario-believe.jpg',
              caption: 'Believe reported pain and report it — pain is what the person says it is.',
            },
            {
              id: 'pain-s09-scenario-believe',
              type: 'scenario_question',
              prompt:
                'Mrs. Alvarez tells you her knee is really hurting and asks for something to help. She doesn\'t look obviously distressed, and a coworker says, "Oh, she always says that, she\'s exaggerating — she\'s fine, she just wants attention. Don\'t bother the nurse about it." What SHOULD the CNA do?',
              options: [
                {
                  id: 'exaggerate',
                  label: 'Decide she\'s exaggerating and not report it',
                  feedback:
                    'Pain is whatever the person says it is — Mrs. Alvarez told you her knee hurts, and that\'s pain, whether or not she "looks" distressed or has said it before. People with chronic pain don\'t always look dramatic. "She\'s exaggerating" is exactly the judgment that leaves residents suffering, and it\'s never your role to decide a resident is faking. The right response: believe her, comfort her within your scope, and report her pain to the nurse so she can get relief.',
                },
                {
                  id: 'believe',
                  label: 'Believe her — pain is whatever the person says it is — comfort her, and report her pain to the nurse',
                  feedback:
                    'Right — and this honors the golden rule of all pain care: pain is whatever the person says it is, and it exists whenever they say it does. Mrs. Alvarez has told you her knee hurts and asked for help — and that is pain, full stop, whether or not she "looks" distressed and whether or not she\'s said it before. People in pain don\'t always look the way we expect, especially with chronic pain they live with daily; not looking dramatic doesn\'t mean not hurting. "She\'s exaggerating," "she just wants attention," and "she always says that" are exactly the dismissive judgments that lead to residents suffering in silence — and it is never your role to decide a resident is faking or exaggerating their pain. The right response is to believe her, take her seriously, offer comfort within your scope — help her find a comfortable position, ease pressure on the knee, offer warmth, reassure her — and report her pain to the nurse, since you can\'t give pain medication and your report is how she gets relief. Even if she reports pain often, each report is taken seriously and passed along; frequent pain reports may even mean her pain isn\'t being adequately controlled, which the nurse needs to know. Believe the pain, comfort, and report — never doubt or judge.',
                  isRecommended: true,
                },
                {
                  id: 'fine',
                  label: 'Tell her she\'s fine and shouldn\'t complain',
                  feedback:
                    'Telling her she\'s fine dismisses real pain — she told you her knee hurts, and pain is whatever the person says it is. Not looking dramatic doesn\'t mean not hurting, especially with chronic pain. It\'s never your role to decide a resident is exaggerating. The right response: believe her, comfort her within your scope, and report her pain to the nurse so she can get relief.',
                },
                {
                  id: 'ignore',
                  label: 'Ignore her since she "always says that"',
                  feedback:
                    'Ignoring her because she "always says that" is exactly how residents end up suffering in silence — and frequent pain reports may mean her pain isn\'t being controlled, which the nurse needs to know. Pain is whatever the person says it is. The right response: believe her, comfort her within your scope, and report her pain to the nurse so she can get relief.',
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
            { id: 'pain-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
              id: 'pain-s10-video',
              type: 'video',
              title: "CNA's Role in Care",
              videoUrl: `${ASSET_BASE}/s10-cna-role.mp4`,
              placeholderNote: 'Pending upload: /assets/courses/pain-comfort/s10-cna-role.mp4',
            },
            {
              id: 'pain-s10-image',
              type: 'image',
              src: '/assets/courses/pain-comfort/s10-hero.jpg',
              caption: 'The CNA is the bridge between silent suffering and relief.',
            },
            {
              id: 'pain-s10-narration',
              type: 'text',
              body: [
                'Your role with pain is to be the one who sees suffering — especially the hidden kind — speaks for it, and eases it. Recognize, report, comfort. Let\'s walk through it.',
                '**Recognize, and believe.** Be the one who notices pain. Believe every resident who tells you they hurt — pain is whatever the person says it is — and never doubt or judge it. And for those who can\'t say it, watch closely for the hidden signs: the grimace, the guarding, the moan with movement, the new agitation or refusal or loss of appetite. Treat behavior changes as possible pain. You know your residents\' normal, so you\'re the one who can see when pain is speaking. That recognition, with belief, is where relief begins.',
                '**Report accurately.** Be the voice for the pain. Because you don\'t give pain medications, your accurate report is what gets pain treated. Tell the nurse clearly and specifically — where, what, when, how severe, the signs you saw, and any new or sudden pain — and report behavior changes that might be pain. Report promptly, because the sooner you speak, the sooner the resident gets relief. In a real way, your words become their pain medicine.',
                '**Comfort and handle gently.** Ease suffering directly with your own hands and presence. Reposition gently, use pillows and warmth, create a calm soothing environment, and offer presence, a gentle voice, and kindness. And handle every resident gently — slow, supported, careful, especially around sore areas and known pain — because so much pain happens during care, and your gentle technique prevents and eases it with every task. Comfort care is real care; it relieves real suffering.',
                '**Comfort care at the end of life.** When a resident nears the end of life, be the source of comfort and presence. Ease their pain and discomfort within your scope, report pain promptly, keep them clean, gently positioned, and comfortable, create a calm and dignified space, and be present so they\'re cared for and not alone. Helping someone be comfortable, dignified, and accompanied at the end is among the most meaningful things you\'ll ever do.',
                'Now the boundary. You do not diagnose pain. You do not give it a clinical rating or assessment. You do not give pain medications. Those belong to the nurses and doctors. And you never doubt, dismiss, or judge a resident\'s pain, never assume it\'s "just aging," and never handle a hurting resident roughly.',
                'Inside your role — recognizing pain including its hidden signs, believing it, reporting it accurately, comforting, and handling gently — you turn silent suffering into relief. You are often the only one who can see a voiceless resident\'s pain, and the one whose report gets it treated and whose hands ease it. Few things a CNA does are more compassionate. When they can\'t say it, you see it — and you speak for it.',
              ].join('\n\n'),
            },
            {
              id: 'pain-s10-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Stay within scope',
              body: 'You do not diagnose pain, give it a clinical rating/assessment, or give pain medications — those belong to nurses and doctors. And you never doubt, dismiss, or judge pain, never assume "just aging," and never handle a hurting resident roughly. You recognize pain (told and hidden), believe it, report it accurately, comfort, and handle gently.',
            },
          ]),
      },
      {
        slug: 's11-case-study',
        title: 'Brief Case Study',
        sortOrder: 2,
        buildContent: () => {
          const caseNarrative = [
            'Mr. Whitaker, 83, had advanced Alzheimer\'s disease and could no longer speak in any way that explained how he felt. He\'d been a gentle, easygoing man, and the staff knew his usual self well. So when he changed, his CNA, Grace, noticed — even though no one else seemed to.',
            '',
            '**The change:** Over a couple of days, Mr. Whitaker became different. He grew agitated and resistant during care, when he\'d usually been calm. He grimaced and pulled his right arm away whenever Grace moved it, and he moaned during his transfers. He\'d stopped finishing his meals. He seemed restless and not himself. On the unit, the easy explanation was already circulating: "He\'s just being combative — it\'s the dementia getting worse. Some days are like that." A coworker told Grace not to worry about it and to just get his care done, even if she had to push through his resistance.',
            '',
            '**What Grace recognized:** But Grace had taken the pain-and-comfort training, and she saw it differently. She knew the most important truth in pain care: in a resident who can\'t speak, new agitation, resistance, and decline are very often pain — and that so much "difficult behavior" is actually unrecognized suffering. She looked again at what Mr. Whitaker was showing her: grimacing and guarding his right arm, pulling away and moaning specifically when that arm was moved, new agitation, refusing food. These weren\'t random combativeness — they were a man telling her, in the only language he had left, that something hurt, and pointing right at his arm. He couldn\'t say it, so she had to see it. And she did.',
            '',
            '**What Grace did NOT do:** She didn\'t dismiss it as "just the dementia." She didn\'t force his care through his resistance, which would have hurt him more and deepened his distress. She didn\'t decide it was a behavior problem to be managed. And she didn\'t wait days hoping it would pass.',
            '',
            '**What Grace did:** She recognized the pain and reported it to the nurse, clearly and specifically: Mr. Whitaker was grimacing and guarding his right arm, pulling away and moaning when it was moved, newly agitated and resistant, and not eating — all of it pointing to pain in that arm. While she waited, she handled him with extra gentleness, especially that arm, warned him softly before moving it, supported it carefully, and offered comfort — a calm voice, a comfortable position, reassurance. She treated the man in front of her as someone hurting, not someone misbehaving.',
            '',
            '**The outcome:** Because Grace recognized the pain behind the behavior and reported it, Mr. Whitaker was assessed — and his right arm was found to be the source of real pain that needed treatment. Once his pain was properly addressed by the team, the change was striking: his agitation eased, he stopped resisting care, he settled, and he began eating again. The "combative dementia patient" had simply been a man in pain that no one but Grace had heard. The nurse told her afterward: "Everyone else saw a behavior problem. You saw a man in pain and you spoke up for him. He couldn\'t tell us — you told us. That\'s exactly the difference between a resident who suffers in silence and one who gets relief."',
          ].join('\n');

          return doc('Brief Case Study', [
            { id: 'pain-s11-heading', type: 'heading', level: 1, text: 'Brief Case Study' },
            {
              id: 'pain-s11-image',
              type: 'image',
              src: '/assets/courses/pain-comfort/s11-hero.jpg',
              caption: 'Recognizing hidden pain settles a resident into real comfort.',
            },
            pendingAudio(
              'pain-s11-audio',
              'The Pain No One Heard',
              '/assets/courses/pain-comfort/s11-case-podcast.mp3',
              caseNarrative,
              `${ASSET_BASE}/s11-case-podcast.mp3`,
            ),
            {
              id: 'pain-s11-case-study',
              type: 'case_study',
              title: 'The Pain No One Heard',
              residentProfile:
                'Mr. Whitaker, 83, with advanced Alzheimer\'s disease — he could no longer speak in any way that explained how he felt. A gentle, easygoing man whose usual self the staff knew well. So when he changed, his CNA, Grace, noticed — even though no one else seemed to.',
              scenario: [
                '**The change:** Over a couple of days, Mr. Whitaker became different — agitated and resistant during care when he\'d usually been calm. He grimaced and pulled his right arm away whenever Grace moved it, moaned during transfers, and stopped finishing his meals. The easy explanation circulated: "He\'s just being combative — it\'s the dementia getting worse." A coworker told Grace not to worry and to just push through his resistance.',
                '**What Grace recognized:** Grace saw it differently. She knew that in a resident who can\'t speak, new agitation, resistance, and decline are very often pain — and that so much "difficult behavior" is actually unrecognized suffering. Grimacing and guarding his right arm, pulling away and moaning specifically when that arm was moved, new agitation, refusing food — these weren\'t random combativeness. They were a man telling her, in the only language he had left, that something hurt, and pointing right at his arm. He couldn\'t say it, so she had to see it.',
                '**What Grace did NOT do:** She didn\'t dismiss it as "just the dementia." She didn\'t force his care through his resistance, which would have hurt him more. She didn\'t treat it as a behavior problem. And she didn\'t wait days hoping it would pass.',
                '**What Grace did:** She reported it to the nurse, clearly and specifically: grimacing and guarding the right arm, pulling away and moaning when it was moved, newly agitated and resistant, not eating — all pointing to pain in that arm. While she waited, she handled him with extra gentleness, especially that arm, warned him softly before moving it, and offered comfort — a calm voice, a comfortable position, reassurance.',
                '**The outcome:** Because Grace recognized the pain behind the behavior and reported it, Mr. Whitaker was assessed — and his right arm was found to be the source of real pain needing treatment. Once treated, his agitation eased, he stopped resisting care, he settled, and he began eating again. The "combative dementia patient" had simply been a man in pain no one but Grace had heard. The nurse told her: "Everyone else saw a behavior problem. You saw a man in pain and you spoke up for him. He couldn\'t tell us — you told us. That\'s the difference between a resident who suffers in silence and one who gets relief."',
              ].join('\n\n'),
            },
            {
              id: 'pain-s11-reflection-1',
              type: 'reflection',
              prompt:
                'Mr. Whitaker couldn\'t say he was in pain, and everyone else saw "combative dementia." What specific signs told Grace he was actually in pain, and why is "it\'s just the dementia" such a dangerous assumption?',
              minCharacters: 50,
            },
            {
              id: 'pain-s11-reflection-2',
              type: 'reflection',
              prompt:
                'Grace believed and reported pain in a resident who couldn\'t speak, and stayed within her scope. What is the CNA\'s three-part role with pain, and why is accurate reporting so important when CNAs can\'t give pain medication?',
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
            { id: 'pain-s12-heading', type: 'heading', level: 1, text: 'Conclusion' },
            {
              id: 'pain-s12-video',
              type: 'video',
              title: 'Conclusion',
              videoUrl: `${ASSET_BASE}/s12-conclusion.mp4`,
              placeholderNote: 'Pending upload: /assets/courses/pain-comfort/s12-conclusion.mp4',
            },
            {
              id: 'pain-s12-image',
              type: 'image',
              src: '/assets/courses/pain-comfort/s12-hero.jpg',
              caption: 'See the pain, bring the comfort — that is the heart of the work.',
            },
            {
              id: 'pain-s12-narration',
              type: 'text',
              body: [
                'You\'ve reached the end. Let\'s lock in the five things that matter most about pain recognition and comfort care.',
                '**One.** Pain is whatever the person says it is, and it exists whenever they say it does. We believe residents about their pain — never doubting, dismissing, or judging it, never deciding they\'re exaggerating or that they "shouldn\'t" hurt. Believing pain is the first step to relieving it.',
                '**Two.** When they can\'t say it, you have to see it. Many residents — with dementia, stroke, confusion, or near the end of life — can\'t tell you in words. Their pain is just as real; it shows in the face, the body, and behavior. Watch for grimacing, guarding, tensing, pulling away, moaning, and especially new agitation, refusing care, or not eating. For these residents, you are their voice.',
                '**Three.** So much "difficult behavior" is unrecognized pain. When a resident who can\'t speak becomes newly agitated, resists care, stops eating, or declines, ask early: could this be pain? That single question catches enormous hidden suffering that would otherwise be mistaken for a behavior problem. Look for the pain behind the behavior.',
                '**Four.** Your role is recognize, report, comfort. Recognize pain, told and hidden. Report it accurately and promptly to the nurse — where, what, when, how severe, what you saw — because you don\'t give pain medication, so your report is what gets it treated. And comfort directly: reposition gently, use warmth and pillows, handle sore areas carefully, create calm, and offer your presence.',
                '**Five.** Comfort and gentleness are powerful care — and know your scope. Handle every resident gently to prevent the pain that care can cause, and near the end of life, comfort and presence become the whole goal. You never diagnose, rate, or medicate pain — but you believe it, see it, report it, comfort, and handle gently. When they can\'t say it, you see it and speak for it. That turns silent suffering into relief.',

                'This course provides one hour of continuing education through CAL ACE Nursing Academy (CDPH Provider NAC #7384). Your certificate is generated automatically when you pass the knowledge check.',
                'Ten questions are waiting. Everything on them was covered here. You\'re ready. Trust what you\'ve learned, and show what you know.',
              ].join('\n\n'),
            },
            {
              id: 'pain-s12-summary',
              type: 'summary',
              title: 'Five things that matter most',
              items: [
                'Pain is whatever the person says it is — believe it, never doubt or judge it. Believing pain is the first step to relieving it.',
                'When they can\'t say it, you have to see it. Watch the face (grimace, wince), body (guarding, pulling away, tensing), and behavior (moaning, new agitation, refusing care, not eating). For these residents, you are their voice.',
                'So much "difficult behavior" is unrecognized pain — when a resident who can\'t speak becomes agitated, refuses care, stops eating, or declines, ask "could this be pain?"',
                'Your role is recognize, report, comfort. Report accurately and promptly (where, what, when, how severe, what you saw) — your report is what gets pain treated, since you don\'t give pain medication.',
                'Comfort and gentleness are powerful care — handle gently to prevent care-caused pain, and near the end of life comfort and presence are the whole goal. You never diagnose, rate, or medicate pain.',
              ],
            },
          ]),
      },
    ],
  },
];

export async function seedCourse11PainComfort(
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
      label: 'V1 — pain recognition & comfort care (new clinical course)',
      status: CourseVersionStatus.DRAFT,
      deliveryMode: DeliveryMode.ONLINE,
      ceHours,
      publishedAt: null,
      contentMeta: contentMeta as Prisma.InputJsonValue,
    },
    update: {
      label: 'V1 — pain recognition & comfort care (new clinical course)',
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

  // Self-clean stray modules on the target DRAFT version (idempotent). For a brand-new
  // course this finds nothing, but keeping it makes re-runs safe and consistent with the
  // rest of the catalog. Scoped strictly to version.id, DRAFT-guarded, soft-delete.
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
    `Seeding Course 11 (Pain Recognition & Comfort Care) as DRAFT — slug "${COURSE_SLUG}", version ${VERSION_NUMBER}…`,
  );

  try {
    const result = await seedCourse11PainComfort(prisma);
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
