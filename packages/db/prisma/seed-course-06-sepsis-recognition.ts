/**
 * Seed Course 6 — Sepsis: Recognition & Early Reporting (DRAFT).
 *
 * NEW COURSE (create path), not a version-onto-existing rebuild. This fills a real
 * catalog gap. The former near-duplicate course "infection-control-prevention" is
 * left UNTOUCHED (its archive is a separate, deferred decision — it has a live
 * enrollment). This seed creates a fresh, clean course at slug 'sepsis-recognition'.
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-06-sepsis-recognition
 *
 * Idempotent upserts by slug. Because the slug is NEW, the upsert fires its CREATE
 * path on first run (and UPDATE on re-runs). Self-cleans stray modules on the target
 * DRAFT version (will report 0 on a fresh version — correct and harmless).
 * Does not seed the final quiz (see the -exam.ts file).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CONFIRMED against the live DB (read-only inspection inspect-sepsis-prep.ts):
 *   COURSE_SLUG    = 'sepsis-recognition'  (FREE — no collision; new course)
 *   VERSION_NUMBER = 1                     (brand-new course → first version)
 * Template shape replicated from an existing modern cal-ace course so this course
 * sits identically in the catalog: category 'professional-development', profession
 * CNA, ceHours 1, catalogData price 3.75 / intermediate / 60 min.
 * DRAFT-only. Run order: this main seed first, then the -exam seed.
 *
 * LIFE-SAFETY / SCOPE: Sepsis is a time-critical emergency. The CNA's role is to
 * PREVENT the infections that cause it, RECOGNIZE the early warning signs (especially
 * the quiet ones in elders), REPORT immediately and urgently, ADVOCATE if brushed off,
 * and SUPPORT the response. CNAs do NOT diagnose sepsis, do NOT score or stage it, and
 * do NOT treat it — those belong to the nurse and physician. Recognize early, report
 * immediately — minutes matter.
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

// CONFIRMED FREE against live DB — new course, clean slug matching content + asset path.
const COURSE_SLUG = 'sepsis-recognition';

const COURSE_TITLE = 'Suspected Sepsis: Early Signs and Urgent Reporting';
const COURSE_SUMMARY =
  'Sepsis is the body\'s extreme, life-threatening response to an infection — a time-critical emergency where minutes decide survival. Learn what sepsis is and why it always starts with an infection, recognize its early warning signs (especially the quiet ones in elders — new confusion, weakness, "not themselves"), and report suspected sepsis immediately and urgently. CNAs prevent, recognize, report fast, advocate, and support — they do not diagnose, score, or treat. Recognize early, report immediately.';

// CONFIRMED against live DB — brand-new course, so first version is v1.
const VERSION_NUMBER = 1;

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
    'Understand what sepsis is and why minutes matter — a time-critical emergency',
    'Connect sepsis to the infections that cause it (UTI, pneumonia, wounds, skin)',
    'Recognize the early warning signs of sepsis, including the subtle ones in elders',
    'Report suspected sepsis immediately and urgently, naming the concern',
    'Advocate when brushed off, support the response, and stay within CNA scope',
  ],
  faq: [] as { question: string; answer: string }[],
  compliance: {
    providerName: 'CAL ACE Nursing Academy',

    cdphApprovalStatus: 'placeholder' as const,
    targetAudience: 'California certified nursing assistants',
    requiredSeatTimeMinutes: 50,
    onlineDeliveryDesignation: 'online' as const,
  },
  imageAccent: 'amber',
  heroImage: '/assets/courses/sepsis-recognition/hero-banner.jpg',
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
    title: 'What Sepsis Is & Why Minutes Matter',
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: 'Introduction',
        sortOrder: 0,
        buildContent: () =>
          doc('Introduction', [
            { id: 'sep-s01-heading', type: 'heading', level: 1, text: 'Introduction' },
            {
              id: 'sep-s01-video',
              type: 'video',
              title: 'Introduction',
              videoUrl: '/assets/courses/sepsis-recognition/s01-intro.mp4',
              placeholderNote: 'Pending upload: /assets/courses/sepsis-recognition/s01-intro.mp4',
            },
            {
              id: 'sep-s01-image',
              type: 'image',
              src: '/assets/courses/sepsis-recognition/s01-hero.jpg',
              caption: 'A CAL ACE CNA staying alert to the earliest signs of trouble.',
            },
            {
              id: 'sep-s01-narration',
              type: 'text',
              body: [
                'Welcome to CAL ACE Nursing Academy.',
                'This course is about sepsis — and it may be one of the most life-saving topics you\'ll ever learn, because sepsis kills quickly, it kills often, and the single thing that saves lives is catching it early. That early catch is very often made by a CNA. Learning to recognize sepsis and report it immediately is a skill that, used once, can save a resident\'s life.',
                'Let\'s define it clearly. Sepsis is the body\'s extreme, life-threatening response to an infection. Normally, when you get an infection, your body fights it in a controlled way. In sepsis, that response goes haywire and turns against the body itself — causing widespread inflammation, dropping blood pressure, and starting to shut down organs. It can progress to septic shock, where blood pressure collapses and organs fail. Sepsis is a medical emergency, every bit as urgent as a heart attack or stroke — and like them, every minute matters.',
                'Here\'s the chain to understand: sepsis always starts with an infection — any infection. A urinary tract infection, pneumonia, a wound or pressure injury that\'s infected, a skin infection — any of these can tip into sepsis, especially in the residents you care for. That connects this course directly to everything you\'ve learned about infection: the infections you help prevent and catch early are the very ones that cause sepsis when they\'re missed. Stop or catch the infection, and you may stop the sepsis before it starts.',
                'Why does this matter so urgently for your residents? Because the elderly are among the highest-risk people for sepsis, and the most likely to die from it. Their immune systems are weaker, they have more infections and more chronic illness, and — this is critical — sepsis in an older adult often doesn\'t look dramatic at first. Instead of an obvious crisis, it may show as new confusion, weakness, not eating, or just "not being themselves." Those quiet signs are easy to dismiss as "a bad day" or "getting older" — and that dismissal is exactly how sepsis turns deadly.',
                'The most important truth in this entire course: with sepsis, time is everything. The earlier sepsis is recognized and treated, the more likely the resident survives — and every hour of delay raises the risk of death. There is even a saying in healthcare: time is tissue, and time is life. You don\'t need to diagnose sepsis or know its medical details. You need to recognize the warning signs early and report them immediately — because your fast report is what gets treatment started while it can still work.',
                'The guiding spirit of this course: recognize early, report immediately. When you suspect sepsis, minutes matter — speak up fast, every time.',
                'Your scope is clear. A CNA helps prevent and catch the infections that cause sepsis, recognizes the early warning signs of sepsis, and reports them to the nurse immediately and urgently — treating it as the emergency it is. A CNA does not diagnose sepsis, does not score or stage it, and does not treat it — but the CNA\'s fast recognition and report are often what save the life.',
                'By the end of this course, you will be able to: understand what sepsis is and why minutes matter. Recognize its early warning signs, including the subtle ones in elders. Connect sepsis to the infections that cause it. And report suspected sepsis immediately. Let\'s begin.',
              ].join('\n\n'),
            },
            {
              id: 'sep-s01-callout',
              type: 'callout',
              variant: 'warning',
              title: 'Recognize early, report immediately',
              body: 'Sepsis is the body\'s extreme, life-threatening response to an infection — a medical emergency as urgent as a heart attack or stroke. It always starts with an infection. In elders it often looks quiet at first: new confusion, weakness, "not themselves." Every hour of delay raises the risk of death. You don\'t diagnose or treat — you recognize and report fast.',
            },
          ]),
      },
      {
        slug: 's02-terms',
        title: 'Terms & Definitions',
        sortOrder: 1,
        buildContent: () =>
          doc('Terms & Definitions', [
            { id: 'sep-s02-heading', type: 'heading', level: 1, text: 'Terms & Definitions' },
            {
              id: 'sep-s02-image',
              type: 'image',
              src: '/assets/courses/sepsis-recognition/s02-hero.jpg',
              caption: 'Understanding sepsis starts with understanding infection.',
            },
            {
              id: 'sep-s02-reveal-sepsis',
              type: 'reveal_card',
              frontTitle: 'Sepsis',
              frontBody: 'SEP-sis',
              backTitle: 'Sepsis',
              backBody:
                'The body\'s extreme, life-threatening response to an infection, where the body\'s reaction turns against itself — causing widespread inflammation, falling blood pressure, and organ damage. It is a medical emergency. Sepsis always begins with an infection somewhere in the body, and without fast treatment it can become deadly very quickly.',
            },
            {
              id: 'sep-s02-reveal-infection',
              type: 'reveal_card',
              frontTitle: 'Infection (the trigger)',
              frontBody: 'Infection — the trigger',
              backTitle: 'Infection (the trigger)',
              backBody:
                'The starting point of sepsis — bacteria, viruses, or other germs invading the body. Common sources that lead to sepsis in residents include urinary tract infections, pneumonia, infected wounds or pressure injuries, and skin infections. Any infection can trigger sepsis, which is why preventing and catching infections early also helps prevent sepsis.',
            },
            {
              id: 'sep-s02-reveal-septic-shock',
              type: 'reveal_card',
              frontTitle: 'Septic Shock',
              frontBody: 'Septic shock',
              backTitle: 'Septic Shock',
              backBody:
                'The most severe, advanced stage of sepsis, where blood pressure drops dangerously low and organs begin to fail. It carries a very high risk of death. Septic shock is what sepsis becomes when it isn\'t caught and treated in time — which is the entire reason early recognition and immediate reporting matter so much.',
            },
            {
              id: 'sep-s02-reveal-early-recognition',
              type: 'reveal_card',
              frontTitle: 'Early Recognition',
              frontBody: 'Early recognition',
              backTitle: 'Early Recognition',
              backBody:
                'Noticing the warning signs of sepsis as soon as they appear — before it becomes severe. Because sepsis worsens fast and every hour of delay raises the risk of death, recognizing it early is the single most powerful thing that saves lives. In elders, early recognition means catching the subtle signs, not waiting for an obvious crisis.',
            },
            {
              id: 'sep-s02-reveal-ams',
              type: 'reveal_card',
              frontTitle: 'Altered Mental Status',
              frontBody: 'Altered mental status',
              backTitle: 'Altered Mental Status',
              backBody:
                'A change in how alert, aware, or clear-thinking a person is — new confusion, disorientation, unusual sleepiness, or "not being themselves." In older adults, this is one of the most important early signs of sepsis, often appearing before anything else. A sudden mental change in an elder should always make you think: infection, possibly sepsis — report it.',
            },
            {
              id: 'sep-s02-reveal-vitals',
              type: 'reveal_card',
              frontTitle: 'Vital Signs',
              frontBody: 'Vital signs',
              backTitle: 'Vital Signs',
              backBody:
                'The body\'s basic measurements — temperature, heart rate, breathing rate, and blood pressure. In sepsis, these often change: fever or a low temperature, fast heart rate, fast breathing, and falling blood pressure. CNAs who take vitals report abnormal ones promptly; even without taking them, you can notice fast breathing, a racing pulse, or a resident who looks gravely unwell.',
            },
            {
              id: 'sep-s02-reveal-time-critical',
              type: 'reveal_card',
              frontTitle: 'Time-Critical Emergency',
              frontBody: 'Time-critical emergency',
              backTitle: 'Time-Critical Emergency',
              backBody:
                'A condition where the speed of response directly determines survival — like a heart attack or stroke, and very much like sepsis. With sepsis, every hour that treatment is delayed raises the risk of death. "Time-critical" is why a suspected-sepsis report is never "later" — it\'s now, urgently, treated as the emergency it is.',
            },
            {
              id: 'sep-s02-reveal-recognize-report',
              type: 'reveal_card',
              frontTitle: 'Recognize and Report',
              frontBody: 'Recognize and report',
              backTitle: 'Recognize and Report',
              backBody:
                'The CNA\'s role in sepsis, in three words. You don\'t diagnose it, score it, or treat it — you recognize the warning signs early and report them to the nurse immediately and urgently. This simple action, done fast, is what gets life-saving treatment started in time. Recognize early, report immediately — that\'s your job, and it saves lives.',
            },
            {
              id: 'sep-s02-knowledge-check',
              type: 'knowledge_check',
              question: 'In an older adult, one of the most important early signs of sepsis is:',
              options: [
                { id: 'ams', label: 'New confusion or "not being themselves"' },
                { id: 'energy', label: 'Feeling more energetic than usual' },
                { id: 'appetite', label: 'A bigger appetite' },
              ],
              correctOptionId: 'ams',
              explanation:
                'In older adults, a change in mental status — new confusion, disorientation, unusual drowsiness, or "not being themselves" — is one of the most important and earliest signs of sepsis, often appearing before anything else. A sudden mental change in an elder should always make you think infection, possibly sepsis, and report it.',
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
            { id: 'sep-s03-heading', type: 'heading', level: 1, text: 'Statistics' },
            {
              id: 'sep-s03-image',
              type: 'image',
              src: '/assets/courses/sepsis-recognition/s03-hero.jpg',
              caption: 'In elders, sepsis often begins quietly — new confusion, not a dramatic crisis.',
            },
            pendingAudio(
              'sep-s03-audio',
              'Sepsis: Common, Deadly, and Beaten by Early Recognition',
              '/assets/courses/sepsis-recognition/s03-stats-podcast.mp3',
              [
                'Sepsis: Common, Deadly, and Beaten by Early Recognition',
                '',
                'Sepsis is one of the leading causes of death in hospitals and a major killer of older adults, yet many people have never heard the word — which is part of what makes it so dangerous. It affects an enormous number of people each year and claims a staggering number of lives; among medical emergencies, it ranks alongside heart attacks and strokes in both frequency and lethality. And here is the fact that should sit at the center of every caregiver\'s mind: a great many sepsis deaths are preventable, and what prevents them is speed — catching it early and starting treatment fast.',
                '',
                'Sepsis always begins with an infection. It is not a separate disease that strikes from nowhere; it is what happens when an infection — a urinary tract infection, pneumonia, an infected wound or pressure injury, a skin infection — provokes the body into an extreme, self-damaging response. This is the direct link to everything CNAs do around infection: the same infections that caregivers help prevent and catch early are the ones that turn into sepsis when they\'re missed. Among residents, urinary tract infections progressing to "urosepsis," and pneumonia and infected wounds progressing to sepsis, are especially common pathways. Prevent or catch the infection, and you may stop the sepsis before it ever begins.',
                '',
                'Elderly residents sit squarely in the highest-risk group — both most likely to develop sepsis and most likely to die from it. Their immune systems are weaker, they carry more infections and chronic illnesses, and they often have wounds, catheters, and devices that invite infection. But the most important and most dangerous feature of sepsis in elders is how quietly it can begin. Rather than an obvious, dramatic crisis, early sepsis in an older adult frequently shows up as new confusion, unusual sleepiness, weakness, loss of appetite, not making sense, or simply "not being themselves" — exactly the kinds of changes that are easy to wave off as a bad day or normal aging. That dismissal is precisely how sepsis becomes fatal: the early window, when treatment works best, slips by unnoticed.',
                '',
                'This is why the data on timing is so striking and so empowering. Studies consistently show that survival in sepsis drops with every hour that effective treatment is delayed — and conversely, that fast recognition and early treatment dramatically improve survival. The phrase clinicians use is that in sepsis, time is life. And the person most likely to notice the first quiet change in a resident — the new confusion, the sudden weakness, the "something\'s wrong" — is the CNA at the bedside, not the physician down the hall. That places one of medicine\'s most time-critical, life-or-death catches in the hands of frontline caregivers. The bottom line: sepsis is common, deadly, and always starts from an infection; elders are at highest risk and show subtle early signs; every hour of delay costs lives; and the CNA who recognizes the early signs and reports them immediately is very often the reason a resident survives.',
              ].join('\n'),
              '/assets/courses/sepsis-recognition/s03-stats-podcast.mp3',
            ),
            {
              id: 'sep-s03-source-note',
              type: 'callout',
              variant: 'clinical',
              title: 'About these figures',
              body: 'This section describes sepsis qualitatively (e.g., "one of the leading causes of death in hospitals," "a great many deaths are preventable") rather than citing specific numbers. Any precise statistic added later must come from a named, verifiable source (e.g., Sepsis Alliance / CDC sepsis data) — not from estimation.',
            },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: 'Fundamentals',
        sortOrder: 3,
        buildContent: () =>
          doc('Fundamentals', [
            { id: 'sep-s04-heading', type: 'heading', level: 1, text: 'Fundamentals' },
            {
              id: 'sep-s04-video',
              type: 'video',
              title: 'Fundamentals',
              videoUrl: '/assets/courses/sepsis-recognition/s04-fundamentals.mp4',
              placeholderNote: 'Pending upload: /assets/courses/sepsis-recognition/s04-fundamentals.mp4',
            },
            {
              id: 'sep-s04-image',
              type: 'image',
              src: '/assets/courses/sepsis-recognition/s04-hero.jpg',
              caption: 'Knowing the early picture is what saves lives.',
            },
            {
              id: 'sep-s04-narration',
              type: 'text',
              body: [
                '**What sepsis actually is**',
                'Sepsis is the body\'s response to infection gone dangerously wrong. Normally your body fights an infection in a careful, contained way. In sepsis, that defense overreacts and spills out of control across the whole body — causing widespread inflammation, leaky blood vessels, falling blood pressure, and reduced blood flow to organs. The organs start to suffer and can begin to fail. It\'s not the infection alone doing the damage — it\'s the body\'s own runaway response. That\'s why sepsis is a true emergency: the body is, in a sense, harming itself faster than the original infection ever could.',
                '**It always starts with an infection**',
                'Here\'s the key link: sepsis never appears out of nowhere — it always begins with an infection somewhere in the body. The usual sources in residents are urinary tract infections, pneumonia and other lung infections, infected wounds and pressure injuries, and skin infections. This connects sepsis straight to your infection-control work: every infection you help prevent is a possible sepsis prevented, and every infection you catch and report early is a possible sepsis stopped before it starts. Sepsis and infection are two ends of the same thread — and you work the whole thread.',
                '**Why it gets worse so fast, and why minutes matter**',
                'Sepsis is not patient. Once the body\'s response spins out of control, it can worsen over hours — sometimes alarmingly fast — sliding from early sepsis toward septic shock, where blood pressure collapses and organs fail. This is why timing rules everything: the earlier it\'s recognized and treated, the better the survival, and every hour of delay raises the risk of death. There\'s no luxury of "let\'s watch it overnight." A resident who looks "a little off" in the morning can be critically ill by afternoon. That speed is exactly why your early recognition and immediate report are so powerful — they buy the time that saves the life.',
                '**Who is at highest risk**',
                'Some residents are especially vulnerable, and knowing them sharpens your watch. The very old. Those with weakened immune systems. People with chronic illnesses — diabetes, kidney, heart, or lung disease. Anyone with a current infection, wound, pressure injury, or recent illness. Those with catheters, IV lines, or feeding tubes — devices that invite infection. And residents recovering from surgery or hospitalization. In short, many of the people in your care are higher-risk — which means sepsis is never a rare, far-off concern; it\'s a real possibility you stay alert to every shift.',
                '**How sepsis looks in older adults — often quiet**',
                'This is the most important point in the course, so hold it tightly. In older adults, sepsis often does NOT look like an obvious emergency at first. Instead of dramatic signs, the earliest clue is frequently a change in mental status — new confusion, disorientation, unusual drowsiness, agitation, or simply "not being themselves." Add weakness, not eating or drinking, a fall, new incontinence, or just looking unwell. These quiet signs are easy to blame on a bad day or aging — and that\'s the trap. In an elder, a sudden change like new confusion, especially with any sign of infection, should make you think sepsis and report it. Don\'t wait for a crisis to appear.',
                '**The warning signs to know**',
                'Beyond the subtle elder signs, learn the broader warning picture. Slurred speech or new confusion. Extreme shivering, or muscle or body pain, feeling very unwell. Passing little or no urine. Severe breathlessness or fast breathing. A sense of impending doom — a resident who feels like something is terribly wrong, or who looks gravely ill. Skin that\'s mottled, blotchy, pale, or discolored, and clammy or sweaty. Add fever or chills — or, importantly, a lower-than-normal temperature — and a fast heart rate. Any combination of these, especially with a known or possible infection, is a red flag to report immediately.',
                '**Your role: recognize early, report immediately**',
                'Everything narrows to this: your job is not to diagnose sepsis, score it, or treat it — it\'s to recognize the warning signs early and report them immediately, treating it as the emergency it is. You\'re the eyes at the bedside, the one most likely to catch the first quiet change. When you see those signs — especially new confusion or a resident who\'s suddenly and seriously "off," with any infection in the picture — you report to the nurse right away, urgently, and you make sure your concern is heard. That fast report starts the clock toward treatment while it can still save a life. Recognize early, report immediately.',
              ].join('\n\n'),
            },
            {
              id: 'sep-s04-callout',
              type: 'callout',
              variant: 'warning',
              title: 'In elders, sepsis is often quiet first',
              body: 'Instead of a dramatic crisis, early sepsis in an older adult often shows as new confusion, drowsiness, weakness, not eating, or "not themselves" — frequently with little, no, or even a low temperature. Don\'t wait for a classic fever or an obvious emergency. A sudden change like new confusion, with any infection in the picture, means think sepsis and report it.',
            },
          ]),
      },
    ],
  },
  {
    slug: 'module-2',
    title: 'Recognizing Sepsis & Its Causes',
    sortOrder: 1,
    lessons: [
      {
        slug: 's05-signs',
        title: 'Signs & Symptoms',
        sortOrder: 0,
        buildContent: () =>
          doc('Signs & Symptoms', [
            { id: 'sep-s05-heading', type: 'heading', level: 1, text: 'Signs & Symptoms' },
            {
              id: 'sep-s05-image',
              type: 'image',
              src: '/assets/courses/sepsis-recognition/s05-hero.jpg',
              caption: 'Watch for the subtle change: drowsy, confused, not themselves.',
            },
            {
              id: 'sep-s05-narration',
              type: 'text',
              body: [
                'With sepsis, recognizing the signs early — and reporting fast — is the whole game. You are often the first and best chance a resident has. Let\'s learn what to watch for, starting with the signs that hide.',
                '**The subtle early signs, especially in elders**',
                'Begin with the quiet signs, because in older adults these come first and matter most. New confusion or disorientation — a resident who\'s suddenly not making sense or not themselves. Unusual drowsiness, hard to rouse, or new agitation. Sudden weakness, or a fall. Not eating or drinking, or much less than usual. New incontinence. Just looking or seeming unwell, "off," or different from their normal. On their own these seem minor — a bad day, getting older. But in a resident with any infection, or any risk, these quiet changes can be the first sign of sepsis. Treat a sudden mental or behavioral change in an elder as a possible emergency, not a mood.',
                '**The classic warning signs**',
                'Now the broader warning picture. Fever, or chills and shivering — or, importantly, a temperature that\'s lower than normal, which is just as concerning. A fast heart rate — a racing or pounding pulse. Fast breathing or shortness of breath. Clammy, sweaty skin. Skin that looks mottled, blotchy, pale, or discolored. Passing little or no urine. Extreme pain or discomfort, or a resident saying they feel terrible or like something is very wrong. Any of these, especially together or with a known infection, is a serious red flag. You don\'t add them up into a diagnosis — you notice them and report.',
                '**Signs it\'s becoming severe**',
                'Know the signs that sepsis may be advancing toward shock, because these mean act now. Blood pressure dropping — a resident who becomes faint, dizzy, or collapses. Skin that\'s cold, mottled, blue-tinged, or very pale. Breathing that\'s very fast or labored. Becoming very drowsy, unresponsive, or hard to wake. Passing almost no urine. A racing pulse with a resident who looks gravely ill. And that haunting sense some residents voice — that they feel like they might die. These are emergency signs of severe sepsis or septic shock — get the nurse immediately, treat it like the life-threatening crisis it is, and don\'t leave the resident alone.',
                '**What to report, and how fast**',
                'Here\'s the rule that saves lives: when you suspect sepsis, report immediately and urgently — never "later," never "I\'ll mention it at the end of rounds." Report the subtle changes — new confusion, sudden weakness, not themselves — especially with any infection present. Report the classic signs — fever or low temperature, fast heart rate, fast breathing, mottled skin, low urine, feeling terrible. Report the severe signs as the emergency they are. Tell the nurse clearly what you see and that you\'re worried about sepsis, and make sure your concern is heard and acted on. You\'re not diagnosing — you\'re sounding the alarm in time. Speed is the medicine you provide.',
                'The rule underneath it all: catch the quiet signs early — especially new confusion in an elder with infection — know the classic and severe signs, and report any suspected sepsis immediately. Minutes matter.',
              ].join('\n\n'),
            },
            {
              id: 'sep-s05-callout',
              type: 'callout',
              variant: 'warning',
              title: 'Severe signs mean act NOW',
              body: 'Dropping blood pressure (faint, dizzy, collapse); cold, mottled, blue-tinged, or very pale skin; very fast or labored breathing; very drowsy or unresponsive; almost no urine; a racing pulse with a resident who looks gravely ill; a sense of "I feel like I might die." These are emergency signs of severe sepsis or septic shock — get the nurse immediately and don\'t leave the resident alone.',
            },
          ]),
      },
      {
        slug: 's06-causes',
        title: 'Causes',
        sortOrder: 1,
        buildContent: () =>
          doc('Causes', [
            { id: 'sep-s06-heading', type: 'heading', level: 1, text: 'Causes' },
            {
              id: 'sep-s06-image',
              type: 'image',
              src: '/assets/courses/sepsis-recognition/s06-hero.jpg',
              caption: 'Sepsis always starts from an infection the CNA helps prevent and catch.',
            },
            pendingAudio(
              'sep-s06-audio',
              'What Causes Sepsis — and Why It Connects to Everything You Do About Infection',
              '/assets/courses/sepsis-recognition/s06-causes-podcast.mp3',
              [
                'What Causes Sepsis — and Why It Connects to Everything You Do About Infection',
                '',
                'The most important fact about what causes sepsis is also the most empowering: sepsis always starts with an infection. It is never a bolt from the blue. Something — bacteria most commonly, sometimes a virus or other germ — sets up an infection somewhere in the body, and in some people, especially vulnerable ones, the body\'s response to that infection spirals out of control into sepsis. This means sepsis sits at the end of a chain that begins with an ordinary infection, and every link of that chain is something caregivers work on every day.',
                '',
                'In residents, a handful of infection sources cause most sepsis. Urinary tract infections are a leading one — so common in elders, and able to progress to what\'s called urosepsis when missed. Pneumonia and other lung infections are another major source. Infected wounds and pressure injuries are a serious cause, which is one more reason skin and wound care matter so much. Skin and soft-tissue infections, infected IV or catheter sites, and abdominal infections round out the common origins. Notice the pattern: these are precisely the infections that good CNA care helps prevent — through hygiene, repositioning, catheter care, skin care — and helps catch early through watchful observation. Prevent the infection, and there\'s no sepsis to follow. Catch and report the infection early, and it can be treated before it ever spirals.',
                '',
                'Why do some residents tip into sepsis while others fight an infection off cleanly? Risk. The elderly are at the top of the list, because aging weakens the immune system\'s ability to keep its response controlled. Chronic illnesses — diabetes, kidney disease, heart and lung disease, cancer — raise the risk, as do weakened immune systems from illness or certain treatments. Devices that breach the body\'s barriers — urinary catheters, IV lines, feeding tubes — create both a route for infection and a higher sepsis risk. Recent surgery, hospitalization, malnutrition, and existing wounds all add to it. You can\'t erase these risks, but they tell you exactly which residents to watch most vigilantly: the older, sicker, device-bearing, wound-carrying residents are the ones in whom an infection is most likely to become sepsis.',
                '',
                'So the CNA\'s causal role is powerful. First, prevention: faithful infection control — hand hygiene, standard precautions, skin and wound care, catheter care, helping residents stay nourished and hydrated — reduces the infections that cause sepsis in the first place. Second, early interruption: catching and reporting an infection early, before it spreads or spirals, lets it be treated while it\'s still just an infection. And third, when sepsis does begin, recognizing it fast. The takeaway: sepsis is always caused by an infection that the body responds to catastrophically; the common sources are the very infections CNAs help prevent and catch; the highest-risk residents are the old, chronically ill, and device- or wound-bearing; and preventing infection, catching it early, and recognizing sepsis fast are all within the CNA\'s power.',
              ].join('\n'),
              '/assets/courses/sepsis-recognition/s06-causes-podcast.mp3',
            ),
          ]),
      },
      {
        slug: 's07-medications',
        title: 'The CNA\'s Role Around Sepsis Treatment',
        sortOrder: 2,
        buildContent: () =>
          doc('The CNA\'s Role Around Sepsis Treatment', [
            { id: 'sep-s07-heading', type: 'heading', level: 1, text: 'The CNA\'s Role Around Sepsis Treatment' },
            {
              id: 'sep-s07-image',
              type: 'image',
              src: '/assets/courses/sepsis-recognition/s07-hero.jpg',
              caption: 'The oldest, sickest, device- or wound-bearing residents need the closest watch.',
            },
            {
              id: 'sep-s07-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of practice',
              body: 'Sepsis is treated medically and urgently by nurses and physicians — antibiotics, IV fluids, oxygen, hospital or intensive care. None of that is the CNA\'s task. A CNA does not diagnose sepsis, does not score or stage it, and does not treat it. The CNA prevents the infections that cause it, recognizes it fast, reports immediately, advocates, and supports the response.',
            },
            {
              id: 'sep-s07-narration',
              type: 'text',
              body: [
                'Sepsis is treated medically and urgently by nurses and physicians — with antibiotics, IV fluids, oxygen, and often hospital or intensive care. None of that is the CNA\'s task. But here\'s the vital truth: that life-saving treatment can only start once someone recognizes sepsis and raises the alarm — and that someone is very often you. So your role around sepsis treatment is to make sure it starts in time. The scope, stated first: a CNA does not diagnose sepsis, does not score or stage it, and does not treat it — the CNA prevents, recognizes, reports fast, and supports.',
                '**Prevent the infections that cause it.** The earliest sepsis care is preventing the infection that would spark it. Faithful hand hygiene and standard precautions. Good skin and wound care to prevent infected pressure injuries. Careful catheter and device hygiene. Helping residents stay nourished and hydrated to keep their defenses up. Supporting oral care and mobility. Every infection you prevent is a possible sepsis that never happens. This is sepsis prevention at its most upstream — and it\'s daily CNA work.',
                '**Catch infections early — before they spiral.** When an infection does start, catching and reporting it early lets it be treated while it\'s still just an infection, before it can become sepsis. Watch for and report the signs of infection you\'ve learned — the cloudy foul urine, the worsening wound, the new cough, the fever or the subtle elder changes. Early infection caught is sepsis prevented. You break the chain before it reaches the dangerous end.',
                '**Recognize sepsis fast — the core skill.** When an infection may already be spiraling, recognition is everything. Stay alert to the warning signs — especially the quiet early ones in elders: new confusion, sudden weakness, not themselves, with any infection present — plus fever or low temperature, fast heart rate, fast breathing, mottled skin, low urine, feeling terrible. You don\'t diagnose or score it; you notice that something is seriously wrong and that sepsis is possible. Fast, sharp recognition is the skill this whole course is built to give you.',
                '**Report immediately and urgently — never delay.** This is the action that saves lives. The moment you suspect sepsis, report to the nurse immediately and urgently — not at the end of rounds, not "later," now. Say clearly what you see and that you\'re worried about sepsis, and make sure your concern is heard and acted on. If your worry is brushed off but you\'re still concerned, speak up again — respectfully persist, because you may be right and minutes count. Treating a suspected-sepsis report as an emergency, every time, is exactly what gets treatment started in the window where it works.',
                '**Support during the emergency.** Once sepsis is suspected and the team responds, help as directed: stay with the resident, keep them calm and comfortable, help gather vital signs or information if asked, assist with the response, and don\'t leave a severely ill resident alone. Your steady support helps the team move fast. You\'re part of the rapid response that gives the resident their best chance.',
                'The scope point: you never diagnose, score, or treat sepsis — but you prevent the infections that cause it, catch infections early, recognize sepsis fast, report it immediately and urgently, and support the response. Your speed is the life-saving contribution only you, at the bedside, can make.',
              ].join('\n\n'),
            },
            {
              id: 'sep-s07-callout',
              type: 'callout',
              variant: 'warning',
              title: 'Suspect sepsis? Report NOW',
              body: 'Not at the end of rounds, not "later" — now. Name your concern plainly: "I\'m worried about sepsis." If you\'re brushed off and still worried, or the resident worsens, speak up again — respectfully persist. You may be right, and minutes count.',
            },
          ]),
      },
      {
        slug: 's08-prevention',
        title: 'Prevention',
        sortOrder: 3,
        buildContent: () =>
          doc('Prevention', [
            { id: 'sep-s08-heading', type: 'heading', level: 1, text: 'Prevention' },
            {
              id: 'sep-s08-image',
              type: 'image',
              src: '/assets/courses/sepsis-recognition/s08-hero.jpg',
              caption: 'Faithful infection control and early reporting interrupt sepsis.',
            },
            {
              id: 'sep-s08-narration',
              type: 'text',
              body: [
                'Sepsis prevention is really two missions: preventing the infections that cause it, and catching trouble early before it spirals. Here are seven ways.',
                '**One. Prevent infections faithfully.** Since sepsis always starts with an infection, your infection control is sepsis prevention. Clean your hands at every key moment, use standard precautions with everyone, and keep up the practices that stop infections from taking hold. Every infection you prevent is a sepsis that never gets the chance to begin. This is the most upstream protection there is.',
                '**Two. Protect skin, wounds, and device sites.** Infected wounds, pressure injuries, and catheter or IV sites are major sepsis sources. Care well for residents\' skin, reposition to prevent pressure injuries, keep wounds and device sites clean per the care plan, and watch them closely. Guarding these common entry points stops many infections — and the sepsis they could cause — before they start.',
                '**Three. Support hydration and nutrition.** A well-nourished, well-hydrated resident has stronger defenses against infection and sepsis. Encourage and help residents eat and drink as their care plan allows, and report poor intake. Good nutrition and hydration aren\'t just comfort — they help the body resist the infections that lead to sepsis, and help it cope if illness comes.',
                '**Four. Know your high-risk residents.** Keep close watch on the residents most likely to develop sepsis — the very old, the chronically ill, those with infections, wounds, or devices, and those recovering from illness or surgery. Knowing who\'s high-risk sharpens your vigilance, so you\'re watching hardest exactly where sepsis is most likely to strike.',
                '**Five. Catch infections early — report them.** Don\'t let an infection simmer. Watch for and report the signs early — the cloudy foul urine, the worsening wound, the new cough, the fever or subtle change. An infection caught and treated early can\'t spiral into sepsis. Your prompt reporting of "just an infection" may be exactly what prevents a sepsis.',
                '**Six. Watch for the early sepsis signs — especially the quiet ones.** Stay alert for the warning signs in every resident, and treat sudden changes seriously — particularly new confusion, weakness, or "not themselves" in an elder with any infection. Don\'t dismiss quiet changes as a bad day or aging. Catching sepsis in its early, subtle stage is when treatment works best — and that catch is yours to make.',
                '**Seven. Report suspected sepsis immediately — every time.** The final and most important prevention of sepsis death is speed. The moment you suspect sepsis, report it right away, urgently, and make sure it\'s heard. Never wait, never assume someone else noticed, never save it for later. Fast reporting is the single most powerful thing that turns a deadly sepsis into a survived one. When in doubt, report — now.',
              ].join('\n\n'),
            },
          ]),
      },
    ],
  },
  {
    slug: 'module-3',
    title: 'Reporting, Advocacy, and Application',
    sortOrder: 2,
    lessons: [
      {
        slug: 's09-emergency',
        title: 'Recognizing Sepsis & Reporting Immediately',
        sortOrder: 0,
        buildContent: () =>
          doc('Recognizing Sepsis & Reporting Immediately', [
            {
              id: 'sep-s09-heading',
              type: 'heading',
              level: 1,
              text: 'Recognizing Sepsis & Reporting Immediately',
            },
            pendingAudio(
              'sep-s09-intro-audio',
              'Recognizing quiet sepsis and refusing to be brushed off — intro',
              '/assets/courses/sepsis-recognition/s09-emergency-intro.mp3',
              'With sepsis, the judgments that matter most are recognizing the quiet early signs in an elder and reporting immediately, and refusing to let your concern be brushed off when minutes count. You\'re about to work through two situations. Read each carefully, choose your action, and you\'ll get feedback right away. Keep the core ideas in mind: new confusion in an elder with an infection may be sepsis — report it now, urgently — and if you\'re still worried after being brushed off, speak up again, because you may be right and time is life.',
              '/assets/courses/sepsis-recognition/s09-emergency-intro.mp3',
            ),
            {
              id: 'sep-s09-image',
              type: 'image',
              src: '/assets/courses/sepsis-recognition/s09-hero.jpg',
              caption: 'New confusion in an elder with an infection may be sepsis — report it now.',
            },
            {
              id: 'sep-s09-scenario-quiet-image',
              type: 'image',
              src: '/assets/courses/sepsis-recognition/s09-scenario-quiet.jpg',
              caption: 'The quiet signs: drowsy, confused, clammy — easy to miss, critical to catch.',
            },
            {
              id: 'sep-s09-scenario-quiet',
              type: 'scenario_question',
              prompt:
                'Mrs. Okafor was treated for a urinary tract infection a few days ago. This afternoon she\'s suddenly different — confused and not making sense, very drowsy and hard to rouse, hasn\'t eaten, her breathing looks fast, and her skin looks a little mottled and clammy. She has no high fever. A coworker says, "She\'s probably just tired, or it\'s her age — let\'s just let her rest and check on her later." What SHOULD the CNA do?',
              options: [
                {
                  id: 'rest-later',
                  label: 'Let her rest and check back later, since she has no fever and is probably just tired',
                  feedback:
                    'This is a classic early-sepsis picture in an elder — new confusion, drowsiness, fast breathing, mottled clammy skin, days after a UTI (a setup for urosepsis). "No fever, just tired, just her age" is the dangerous dismissal that lets sepsis turn fatal; elders often have little or no fever even when seriously septic. Sepsis can worsen over hours. The right action: report to the nurse immediately and urgently as possible sepsis — minutes matter.',
                },
                {
                  id: 'report-now',
                  label: 'Report it to the nurse immediately and urgently as possible sepsis — new confusion, drowsiness, fast breathing, and mottled clammy skin in a resident with a recent infection are serious red flags',
                  feedback:
                    'Exactly right — and this is the recognition that saves lives. Mrs. Okafor is showing a classic early-sepsis picture in an elder: new confusion and drowsiness, not eating, fast breathing, and mottled, clammy skin — and critically, she had a urinary tract infection just days ago, the perfect setup for urosepsis. The absence of a high fever means nothing; elders with serious sepsis often have little or no fever, or even a low temperature, so "no fever, just tired, just her age" is exactly the dangerous dismissal that lets sepsis become fatal. This is not a rest-and-recheck situation — sepsis can worsen over hours, and waiting until "later" or the end of rounds could cost her life. Quietly giving food and fluids and saying nothing is just as wrong; she needs the nurse, fast. The right action is immediate, urgent reporting: get the nurse now, tell them clearly what you see, and say you\'re worried about sepsis — especially given the recent UTI. You\'re not diagnosing it; you\'re sounding the alarm in the window where treatment still works. In sepsis, time is life, and your fast report is the medicine only you can deliver right now.',
                  isRecommended: true,
                },
                {
                  id: 'end-rounds',
                  label: 'Wait until the end of rounds to mention it',
                  feedback:
                    'Waiting until the end of rounds could cost her life — sepsis can worsen over hours, and this is a classic early-sepsis picture in an elder (new confusion, drowsiness, fast breathing, mottled clammy skin, days after a UTI). The lack of a high fever means nothing in elders. The right action: report to the nurse immediately and urgently as possible sepsis — minutes matter, not "later."',
                },
                {
                  id: 'feed-silent',
                  label: 'Give her food and fluids and say nothing',
                  feedback:
                    'Quietly feeding her and saying nothing leaves a possible sepsis unrecognized and untreated. This is a classic early-sepsis picture in an elder — new confusion, drowsiness, fast breathing, mottled clammy skin, days after a UTI (a urosepsis setup) — and "no fever" doesn\'t rule it out. The right action: report to the nurse immediately and urgently as possible sepsis, naming your concern. Minutes matter.',
                },
              ],
              requiredForCompletion: true,
            },
            {
              id: 'sep-s09-scenario-persist-image',
              type: 'image',
              src: '/assets/courses/sepsis-recognition/s09-scenario-persist.jpg',
              caption: 'If your concern is brushed off and the resident worsens, speak up again.',
            },
            {
              id: 'sep-s09-scenario-persist',
              type: 'scenario_question',
              prompt:
                'You reported to the nurse that Mr. Bauer — who has an infected pressure injury — is suddenly confused, breathing fast, and "just not right." The nurse is very busy and says, "Okay, I\'ll get to him when I can, he\'s probably just having an off day." Twenty minutes later he looks worse — more drowsy, skin more mottled, and barely responding. What SHOULD the CNA do?',
              options: [
                {
                  id: 'wait-quiet',
                  label: 'Wait quietly, since you already told the nurse once',
                  feedback:
                    'Staying quiet because you "already told her once" could let a treatable, time-critical crisis slide toward death. Mr. Bauer is visibly deteriorating — more drowsy, more mottled, barely responding — and he has an infected pressure injury, a known sepsis source. The right action: go back to the nurse immediately, clearly state he\'s worse and you\'re worried about sepsis, and make sure he\'s seen now. Respectful persistence saves lives.',
                },
                {
                  id: 'go-back',
                  label: 'Go back to the nurse immediately, clearly state he\'s worse and you\'re worried about sepsis, and make sure he\'s seen now',
                  feedback:
                    'Right — and this is real courage that saves lives. You did the correct first thing by reporting, but the situation has changed: Mr. Bauer is visibly deteriorating — more drowsy, more mottled, barely responding — and he has an infected pressure injury, a known sepsis source. Severe sepsis and septic shock can advance fast, and a resident who\'s worsening this way is an emergency, not an "off day." Staying quiet because "I already told her once," or deciding it\'s "not my place to push," would let a treatable, time-critical crisis slide toward death while you waited. This is exactly the moment to respectfully persist: go back to the nurse immediately, clearly and specifically state that he\'s gotten worse — more drowsy, skin more mottled, barely responding — and that you\'re genuinely worried about sepsis, and make sure he\'s seen right now. Advocating firmly for your resident when you\'re worried about sepsis isn\'t overstepping — it\'s doing your job at its most important. You may be the only person who catches this in time. If he meets your facility\'s criteria for an emergency response, follow that. When minutes mean life, speaking up again is exactly right.',
                  isRecommended: true,
                },
                {
                  id: 'not-my-place',
                  label: 'Decide it\'s not your place to push and hope he improves',
                  feedback:
                    'Deciding it\'s "not your place to push" could let a treatable crisis turn fatal. Mr. Bauer is visibly deteriorating, and he has an infected pressure injury (a sepsis source); severe sepsis advances fast — this is an emergency, not an "off day." Advocating firmly for a resident you fear is septic isn\'t overstepping; it\'s your job at its most important. The right action: go back immediately, state he\'s worse and you\'re worried about sepsis, and make sure he\'s seen now.',
                },
                {
                  id: 'leave-later',
                  label: 'Leave him alone and check again much later',
                  feedback:
                    'Leaving him to check much later could cost his life — he\'s visibly deteriorating with an infected pressure injury (a sepsis source), and severe sepsis advances fast. This is an emergency, not an "off day." The right action: go back to the nurse immediately, clearly state he\'s worse and you\'re worried about sepsis, make sure he\'s seen now, and don\'t leave a severely ill resident alone.',
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
            { id: 'sep-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
              id: 'sep-s10-video',
              type: 'video',
              title: "CNA's Role in Care",
              videoUrl: '/assets/courses/sepsis-recognition/s10-cna-role.mp4',
              placeholderNote: 'Pending upload: /assets/courses/sepsis-recognition/s10-cna-role.mp4',
            },
            {
              id: 'sep-s10-image',
              type: 'image',
              src: '/assets/courses/sepsis-recognition/s10-hero.jpg',
              caption: 'The CNA at the bedside is often the first to notice — and report.',
            },
            {
              id: 'sep-s10-narration',
              type: 'text',
              body: [
                'Your role in sepsis is to be the fast, watchful first line that prevents the infections behind it, catches it early, and sounds the alarm in time. Let\'s walk through it.',
                '**Prevent the infections that cause sepsis.** Sepsis starts with infection, so your faithful infection control is sepsis prevention. Clean hands and standard precautions, careful skin and wound care to prevent infected pressure injuries, good catheter and device hygiene, and supporting hydration and nutrition to keep residents\' defenses strong. Every infection you prevent is a sepsis that never begins. This upstream, daily work is the quietest and one of the most powerful parts of your role.',
                '**Recognize early, especially the quiet signs.** Be the sharp eyes that catch sepsis early. Stay alert to the warning signs in every resident, and treat sudden changes seriously — above all, new confusion, drowsiness, weakness, or "not themselves" in an elder with any infection, plus fever or low temperature, fast breathing, fast heart rate, mottled skin, and low urine. Don\'t dismiss quiet changes as a bad day or aging. Your early recognition, in that subtle window, is exactly what makes treatment possible while it still works.',
                '**Report immediately and advocate.** When you suspect sepsis, sound the alarm fast. Report to the nurse immediately and urgently — not later, not at end of rounds — say clearly what you see and that you\'re worried about sepsis, and make sure it\'s heard. And if you\'re brushed off but still worried, or the resident worsens, respectfully persist and push to get them seen now. Advocating firmly for a resident you fear is septic isn\'t overstepping — it\'s your most important duty. You may be the one who catches it in time.',
                '**Support the response.** Once sepsis is suspected and the team moves, be the steady help they need: stay with the resident, keep them calm and comfortable, help gather vitals or information if asked, assist as directed, and never leave a severely ill resident alone. Your calm, capable support helps the rapid response run fast and smooth — and fast is what saves the life.',
                'Now the boundary. You do not diagnose sepsis. You do not score or stage it. You do not treat it — no decisions about antibiotics, fluids, or medical care. Those belong to the nurses and physicians. Your role is to prevent, recognize, report fast, advocate, and support.',
                'Inside that role — preventing the infections, catching sepsis early, reporting immediately, and refusing to let a worried concern go unheard — you hold one of the most life-or-death positions a CNA ever occupies. In sepsis, time is life, and you are the one most often standing where time is either lost or saved. Recognize early, report immediately — and a resident lives who might not have.',
              ].join('\n\n'),
            },
            {
              id: 'sep-s10-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Stay within scope',
              body: 'You do not diagnose sepsis, do not score or stage it, and do not treat it — no decisions about antibiotics, fluids, or medical care; those belong to the nurse and physician. You prevent the infections that cause it, recognize it early, report immediately, advocate when brushed off, and support the response.',
            },
          ]),
      },
      {
        slug: 's11-case-study',
        title: 'Brief Case Study',
        sortOrder: 2,
        buildContent: () => {
          const caseNarrative = [
            'Mr. Halvorsen, 79, had been treated for a urinary tract infection earlier in the week and was thought to be on the mend. He had diabetes and a healing pressure injury on his heel — two quiet risk factors stacking in the background. His CNA, Imelda, had cared for him long enough to know his normal: a sharp, talkative man who did the crossword every morning and complained good-naturedly about the food.',
            '',
            '**What changed:** That afternoon, Imelda noticed Mr. Halvorsen wasn\'t himself. The crossword sat untouched. He was confused about where he was and what day it was — unusual for him — and unusually drowsy, drifting off mid-sentence. He\'d barely touched lunch. When she helped him sit up, his breathing looked fast, his skin felt clammy, and there was a faint mottled, blotchy look to his arms and legs. He didn\'t have a high fever — if anything he felt a little cool. To a casual eye, he just looked tired.',
            '',
            '**The dismissal she didn\'t accept:** A coworker glanced in and offered the easy explanation: "He\'s probably just worn out, or it\'s his age catching up — let him rest, check him later." And Imelda felt the pull of that explanation, because it would have been the comfortable thing to believe. But her training pushed back hard. She knew the most dangerous truth about sepsis in elders: it comes quietly, as new confusion, drowsiness, weakness, and "not themselves" — often without a dramatic fever — and that a recent UTI plus diabetes plus a healing wound made Mr. Halvorsen a textbook sepsis risk. The picture in front of her — sudden confusion, drowsiness, fast breathing, mottled clammy skin, days after a UTI — wasn\'t "tired." It was a red flag for sepsis, possibly urosepsis. And she knew that with sepsis, the comfortable wait-and-see is exactly how people die.',
            '',
            '**What she did:** Imelda did not wait, and she did not let it slide to the end of rounds. She went straight to the charge nurse, immediately and urgently, and reported it clearly: Mr. Halvorsen was suddenly confused and drowsy, breathing fast, with clammy mottled skin and no appetite, days after his UTI — and she was worried about sepsis. She didn\'t hedge or downplay it; she named her concern plainly and made sure it landed. The nurse, hearing the specific picture and the word sepsis, assessed him right away.',
            '',
            '**The deterioration — and the advocacy:** The nurse took it seriously, but the unit was busy, and there was a moment where the response could have slowed. When Imelda checked Mr. Halvorsen again a short time later and saw he\'d grown more drowsy and more mottled — clearly worse — she went back at once, told the nurse plainly that he was deteriorating, and pushed to make sure he was seen and escalated now. That persistence mattered: it kept the response fast at the moment speed counted most.',
            '',
            '**The outcome:** Mr. Halvorsen was indeed developing sepsis from his urinary infection — urosepsis — and because it was caught early and escalated fast, he was treated in time: the infection\'s source addressed, the sepsis response started while it could still work. He was acutely ill and needed close care, but he survived and recovered — and the difference between his outcome and a tragic one was measured in the hours Imelda\'s fast recognition and refusal to wait had saved. The nurse told her afterward: "You caught that when it would have been so easy to call it \'just tired.\' No fever, just confused and drowsy — most people would\'ve let him rest. You saw sepsis, you said sepsis, and you didn\'t let it wait. That\'s why he\'s still here."',
          ].join('\n');

          return doc('Brief Case Study', [
            { id: 'sep-s11-heading', type: 'heading', level: 1, text: 'Brief Case Study' },
            pendingAudio(
              'sep-s11-audio',
              'The Afternoon That Couldn\'t Wait',
              '/assets/courses/sepsis-recognition/s11-case-podcast.mp3',
              caseNarrative,
              '/assets/courses/sepsis-recognition/s11-case-podcast.mp3',
            ),
            {
              id: 'sep-s11-image',
              type: 'image',
              src: '/assets/courses/sepsis-recognition/s11-hero.jpg',
              caption: 'Catching the quiet change early is the difference between recovery and tragedy.',
            },
            {
              id: 'sep-s11-case-study',
              type: 'case_study',
              title: 'The Afternoon That Couldn\'t Wait',
              residentProfile:
                'Mr. Halvorsen, 79, treated for a urinary tract infection earlier in the week and thought to be on the mend. He had diabetes and a healing pressure injury on his heel — two quiet risk factors stacking in the background. His CNA, Imelda, knew his normal: a sharp, talkative man who did the crossword every morning and complained good-naturedly about the food.',
              scenario: [
                '**What changed:** That afternoon, Imelda noticed Mr. Halvorsen wasn\'t himself. The crossword sat untouched. He was confused about where he was and what day it was — unusual for him — and unusually drowsy, drifting off mid-sentence. He\'d barely touched lunch. When she helped him sit up, his breathing looked fast, his skin felt clammy, and there was a faint mottled, blotchy look to his arms and legs. He didn\'t have a high fever — if anything he felt a little cool. To a casual eye, he just looked tired.',
                '**The dismissal she didn\'t accept:** A coworker offered the easy explanation: "He\'s probably just worn out, or it\'s his age — let him rest, check him later." Imelda felt the pull of it, but her training pushed back. She knew the most dangerous truth about sepsis in elders: it comes quietly — new confusion, drowsiness, weakness, "not themselves" — often without a dramatic fever, and a recent UTI plus diabetes plus a healing wound made him a textbook sepsis risk. The picture — sudden confusion, drowsiness, fast breathing, mottled clammy skin, days after a UTI — wasn\'t "tired." It was a red flag for sepsis, possibly urosepsis. With sepsis, the comfortable wait-and-see is exactly how people die.',
                '**What she did:** Imelda did not wait or let it slide to the end of rounds. She went straight to the charge nurse, immediately and urgently, and reported clearly: suddenly confused and drowsy, breathing fast, clammy mottled skin, no appetite, days after his UTI — and she was worried about sepsis. She named her concern plainly and made sure it landed. The nurse, hearing the specific picture and the word sepsis, assessed him right away.',
                '**The deterioration — and the advocacy:** The unit was busy, and the response could have slowed. When Imelda checked him again a short time later and saw he\'d grown more drowsy and more mottled — clearly worse — she went back at once, told the nurse plainly he was deteriorating, and pushed to make sure he was seen and escalated now. That persistence kept the response fast at the moment speed counted most.',
                '**The outcome:** Mr. Halvorsen was indeed developing sepsis from his urinary infection — urosepsis — and because it was caught early and escalated fast, he was treated in time and recovered. The nurse told her afterward: "You caught that when it would have been so easy to call it \'just tired.\' No fever, just confused and drowsy — most people would\'ve let him rest. You saw sepsis, you said sepsis, and you didn\'t let it wait. That\'s why he\'s still here."',
              ].join('\n\n'),
            },
            {
              id: 'sep-s11-reflection-1',
              type: 'reflection',
              prompt:
                'Mr. Halvorsen had no high fever, and a coworker assumed he was "just tired" or showing his age. Why was Imelda right not to be reassured by the lack of fever, and what early sepsis signs did she correctly recognize?',
              minCharacters: 50,
            },
            {
              id: 'sep-s11-reflection-2',
              type: 'reflection',
              prompt:
                'When Mr. Halvorsen worsened, Imelda went back to the nurse and pushed to make sure he was seen now. Why is this kind of respectful persistence sometimes necessary with suspected sepsis, and how does it fit within the CNA\'s scope of "recognize and report"?',
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
            { id: 'sep-s12-heading', type: 'heading', level: 1, text: 'Conclusion' },
            {
              id: 'sep-s12-video',
              type: 'video',
              title: 'Conclusion',
              videoUrl: '/assets/courses/sepsis-recognition/s12-conclusion.mp4',
              placeholderNote: 'Pending upload: /assets/courses/sepsis-recognition/s12-conclusion.mp4',
            },
            {
              id: 'sep-s12-image',
              type: 'image',
              src: '/assets/courses/sepsis-recognition/s12-hero.jpg',
              caption: 'In sepsis, time is life — recognize it, report it now.',
            },
            {
              id: 'sep-s12-narration',
              type: 'text',
              body: [
                'You\'ve reached the end. Let\'s lock in the five things that matter most about sepsis.',
                '**One.** Sepsis is the body\'s extreme, life-threatening response to an infection — a medical emergency as urgent as a heart attack or stroke. It always starts with an infection, like a UTI, pneumonia, or an infected wound, and it can progress fast to septic shock and death. The infections you help prevent and catch are the ones that cause it.',
                '**Two.** In elders, sepsis is often quiet at first. Instead of a dramatic crisis, watch for new confusion, drowsiness, weakness, not eating, or "not being themselves" — especially in a resident with any infection. Don\'t be fooled by a lack of fever; many septic elders have little, no, or even low temperature. A sudden change like new confusion is a red flag.',
                '**Three.** Know the warning signs. Fever or low temperature, fast heart rate, fast breathing, clammy or mottled skin, low urine, extreme discomfort, or a resident who looks gravely ill or feels they might die. And the severe signs — dropping blood pressure, cold blue mottled skin, barely responsive — mean act now. Any of these, with a possible infection, is a report-immediately situation.',
                '**Four.** Recognize early, report immediately — minutes matter. The moment you suspect sepsis, report to the nurse right away and urgently, name your concern — "I\'m worried about sepsis" — and make sure it\'s heard. If you\'re brushed off but still worried, or the resident worsens, respectfully persist and push to get them seen now. Your speed is what gets treatment started in time.',
                '**Five.** Know your scope. You never diagnose, score, or treat sepsis — but you prevent the infections that cause it, recognize it early, report it immediately, advocate when needed, and support the response. In sepsis, time is life, and you are most often the one standing where time is lost or saved. Recognize early, report immediately — and a resident lives who might not have.',

                'This course provides one hour of continuing education through CAL ACE Nursing Academy (CDPH Provider NAC #7384). Your certificate is generated automatically when you pass the knowledge check.',
                'Ten questions are waiting. Everything on them was covered here. You\'re ready. Trust what you\'ve learned, and show what you know.',
              ].join('\n\n'),
            },
            {
              id: 'sep-s12-summary',
              type: 'summary',
              title: 'Five things that matter most',
              items: [
                'Sepsis is the body\'s extreme, life-threatening response to an infection — a medical emergency that always starts with an infection (UTI, pneumonia, wound, skin) and can progress fast to septic shock.',
                'In elders, sepsis is often quiet first — new confusion, drowsiness, weakness, not eating, "not themselves." Don\'t be fooled by a lack of fever; many septic elders have little, no, or low temperature.',
                'Know the warning signs — fever or low temperature, fast heart rate, fast breathing, clammy or mottled skin, low urine, feeling gravely ill. Severe signs (dropping BP, cold blue mottled skin, barely responsive) mean act now.',
                'Recognize early, report immediately — minutes matter. Report to the nurse right away and urgently, name your concern ("I\'m worried about sepsis"), and if brushed off or the resident worsens, respectfully persist.',
                'Know your scope — you never diagnose, score, or treat sepsis. You prevent the infections that cause it, recognize it early, report immediately, advocate when needed, and support the response.',
              ],
            },
          ]),
      },
    ],
  },
];

export async function seedCourse06SepsisRecognition(
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
      label: 'V3 rebuild — sepsis: recognition & early reporting (new course)',
      status: CourseVersionStatus.DRAFT,
      deliveryMode: DeliveryMode.ONLINE,
      ceHours,
      publishedAt: null,
      contentMeta: contentMeta as Prisma.InputJsonValue,
    },
    update: {
      label: 'V3 rebuild — sepsis: recognition & early reporting (new course)',
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

  // Self-clean stray modules on the target DRAFT version (idempotent). On a brand-new
  // course this finds nothing (0 strays) — correct and harmless. Scoped strictly to
  // version.id, DRAFT-guarded, soft-delete only.
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
    `Seeding Course 6 (Sepsis: Recognition & Early Reporting) as DRAFT — NEW course, slug "${COURSE_SLUG}", version ${VERSION_NUMBER}…`,
  );

  try {
    const result = await seedCourse06SepsisRecognition(prisma);
    const blockCounts = blockCountsByLesson();

    console.log('Seed complete.');
    console.log(`  Course:   ${COURSE_TITLE}`);
    console.log(`  Slug:     ${COURSE_SLUG}`);
    console.log(`  Version:  ${VERSION_NUMBER}`);
    console.log(`  Created:  ${result.courseCreated ? 'YES (new course)' : 'no (updated existing)'}`);
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
