/**
 * Seed Course 2 — Caregiver Burnout & Compassion Fatigue (DRAFT).
 *
 * V3 rebuild of the former "Stress Management for Healthcare Workers", reframed to
 * the recognized occupational conditions (burnout, compassion fatigue). The subject
 * of this course is the CNA's OWN wellbeing.
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-02-caregiver-burnout
 *
 * Idempotent upserts by slug. Self-cleans stray modules on the target DRAFT version.
 * Does not seed the final quiz (pending owner approval; see the -exam.ts file).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CONFIRMED against the live DB (read-only inspection):
 *   COURSE_SLUG    = 'stress-management'  (FROZEN — course already live)
 *   VERSION_NUMBER = 2                    (MAX existing version is v1 PUBLISHED;
 *                                          this creates v2 as a new DRAFT revision)
 * Only the DISPLAY TITLE changes (to the burnout framing) — NOT the slug.
 * DRAFT-only. Run order: this main seed first, then the -exam seed.
 *
 * SENSITIVE CONTENT: this course names that healthcare workers face elevated risk
 * for depression and suicidal thoughts. All such content is framed as "this is
 * serious, you are not alone, reach out now" with the 988 Suicide & Crisis Lifeline
 * — NO method content. This framing must be preserved exactly.
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
const COURSE_SLUG = 'stress-management';

// Display title changes to the burnout framing; slug stays frozen above.
const COURSE_TITLE = 'Resilience and Fatigue Awareness for Caregivers';
const COURSE_SUMMARY =
  'Care for yourself as a caregiver: recognize burnout and compassion fatigue in yourself and coworkers, understand their causes, use healthy coping and prevention, support struggling coworkers, and know when and how to reach out for help — including urgent support. Asking for help is a strength, not a weakness.';

// CONFIRMED against live DB — MAX existing version is v1 PUBLISHED; create v2 DRAFT.
const VERSION_NUMBER = 2;

const ASSET_BASE = '/assets/courses/burnout';

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
    'Understand burnout and compassion fatigue as real, normal responses to stress — not weakness',
    'Recognize the signs of burnout and compassion fatigue in yourself and your coworkers',
    'Understand the causes, which are largely about the demands of the job',
    'Use healthy coping and prevention to protect your own wellbeing',
    'Know when and how to reach out for help, including urgent crisis support (988)',
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
  heroImage: '/assets/courses/burnout/hero-banner.jpg',
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
    title: 'Understanding Burnout & Compassion Fatigue',
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: 'Introduction',
        sortOrder: 0,
        buildContent: () =>
          doc('Introduction', [
            { id: 'burn-s01-heading', type: 'heading', level: 1, text: 'Introduction' },
            {
              id: 'burn-s01-video',
              type: 'video',
              title: 'Introduction',
              videoUrl: `${ASSET_BASE}/s01-intro.mp4`,
              placeholderNote: 'Pending upload: /assets/courses/burnout/s01-intro.mp4',
            },
            {
              id: 'burn-s01-image',
              type: 'image',
              src: '/assets/courses/burnout/s01-hero.jpg',
              caption: 'This course is about caring for you — the caregiver who gives so much to others.',
            },
            {
              id: 'burn-s01-narration',
              type: 'text',
              body: [
                'Welcome to CAL ACE Nursing Academy.',
                'This course is different from the others. Every other course is about caring for your residents. This one is about caring for you — because the person doing the caring matters too, and because you cannot pour from an empty cup. This course is about caregiver burnout and compassion fatigue.',
                'Let\'s name what we\'re talking about. Burnout is a state of deep physical, emotional, and mental exhaustion caused by long-term work stress — it\'s so real and so recognized that the World Health Organization classifies it as an occupational phenomenon. It shows up as feeling drained and used up, becoming distant or numb toward the work, and feeling that nothing you do is good enough. Compassion fatigue is closely related but more specific to caregiving: it\'s the cost of caring — the gradual emotional exhaustion and numbing that can come from absorbing other people\'s suffering, day after day. CNAs are especially at risk, because you give physical and emotional care, often short-staffed, often underpaid, and often facing illness, decline, and death.',
                'Here\'s the most important thing to understand, and the message this whole course rests on: burnout and compassion fatigue are not weakness, and they are not a personal failing. They are a normal, expected response to extraordinary, ongoing stress — a sign that you have been caring hard in a tough job, not a sign that something is wrong with you. The strongest, most dedicated caregivers are often the ones who burn out, precisely because they care so much. Feeling this does not mean you\'re bad at your job or weak as a person. It means you\'re human, and you\'ve been carrying a heavy load.',
                'Why does this matter enough for a whole course? Because burnout and compassion fatigue hurt everyone if ignored. They hurt you — your health, your sleep, your relationships, your happiness, and in serious cases your mental health. They hurt your residents — an exhausted, numb caregiver makes more mistakes and gives colder care. And they drive good people out of caregiving entirely. Taking care of yourself isn\'t selfish; it\'s part of being able to take care of others, and it\'s part of staying in this work you\'re meant for.',
                'This course teaches you to recognize burnout and compassion fatigue in yourself and your coworkers, to understand what causes them, to use practical, healthy ways to cope and protect yourself, and to know when stress has become serious enough that you should reach out for real support — including the urgent kind.',
                'The guiding spirit of this course: caring for yourself is part of caring for others — and asking for help is a strength, never a weakness.',
                'So here, "your role" is simple and kind: recognize these signs in yourself and the people you work with, use healthy coping, protect your own wellbeing, support struggling coworkers, and reach out for help when you need it. You are not expected to diagnose yourself, to medicate yourself, or to suffer in silence and push through alone.',
                'By the end of this course, you will be able to: understand burnout and compassion fatigue as real, normal responses to stress. Recognize their signs in yourself and others. Understand their causes. Use healthy coping and prevention. And know when and how to reach out for help. Let\'s begin.',
              ].join('\n\n'),
            },
            {
              id: 'burn-s01-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'The heart of this course',
              body: 'Caring for yourself is part of caring for others — and asking for help is a strength, never a weakness. You are not expected to diagnose yourself, medicate yourself, or suffer in silence and push through alone.',
            },
          ]),
      },
      {
        slug: 's02-terms',
        title: 'Terms & Definitions',
        sortOrder: 1,
        buildContent: () =>
          doc('Terms & Definitions', [
            { id: 'burn-s02-heading', type: 'heading', level: 1, text: 'Terms & Definitions' },
            {
              id: 'burn-s02-image',
              type: 'image',
              src: '/assets/courses/burnout/s02-hero.jpg',
              caption: 'Burnout, compassion fatigue, self-care, resilience — terms every caregiver should know.',
            },
            {
              id: 'burn-s02-reveal-burnout',
              type: 'reveal_card',
              frontTitle: 'Burnout',
              frontBody: 'Burnout',
              backTitle: 'Burnout',
              backBody:
                'A state of deep physical, emotional, and mental exhaustion from long-term work stress — recognized by the World Health Organization as an occupational phenomenon. Three signs mark it: feeling drained and used up, becoming distant or numb toward the work, and feeling that nothing you do is good enough. Burnout is real, common in caregiving, and not a personal weakness.',
            },
            {
              id: 'burn-s02-reveal-compassion-fatigue',
              type: 'reveal_card',
              frontTitle: 'Compassion Fatigue',
              frontBody: 'The cost of caring',
              backTitle: 'Compassion Fatigue',
              backBody:
                'The cost of caring. It\'s the emotional exhaustion and numbing that can build up from absorbing other people\'s pain and suffering, day after day, as caregivers do. Unlike general burnout, it comes specifically from caring deeply for people who are ill, suffering, or dying. It often affects the most caring, dedicated caregivers — because they feel so much.',
            },
            {
              id: 'burn-s02-reveal-chronic-stress',
              type: 'reveal_card',
              frontTitle: 'Chronic Stress',
              frontBody: 'Chronic stress',
              backTitle: 'Chronic Stress',
              backBody:
                'Stress that goes on and on without enough relief — the long-term kind, not a single hard day. The body\'s stress response is meant for short bursts; when it never switches off, it wears down the body and mind, causing exhaustion, health problems, and burnout. Recognizing ongoing stress, and getting relief, protects your health.',
            },
            {
              id: 'burn-s02-reveal-self-care',
              type: 'reveal_card',
              frontTitle: 'Self-Care',
              frontBody: 'Self-care',
              backTitle: 'Self-Care',
              backBody:
                'The healthy things you do to protect and restore your own physical and emotional wellbeing — rest, sleep, food, movement, connection, breaks, and time to recharge. Self-care isn\'t selfish or a luxury; it\'s how a caregiver stays able to care for others. You cannot pour from an empty cup — self-care refills it.',
            },
            {
              id: 'burn-s02-reveal-sts',
              type: 'reveal_card',
              frontTitle: 'Secondary Traumatic Stress',
              frontBody: 'Secondary traumatic stress',
              backTitle: 'Secondary Traumatic Stress',
              backBody:
                'The distress that can come from being repeatedly exposed to others\' trauma and suffering — almost like catching some of the pain you witness. Caregivers who see suffering, decline, and death can carry it home in their own minds. Naming it helps: the heaviness you feel may be a normal response to hard things you\'ve witnessed.',
            },
            {
              id: 'burn-s02-reveal-resilience',
              type: 'reveal_card',
              frontTitle: 'Resilience',
              frontBody: 'Resilience',
              backTitle: 'Resilience',
              backBody:
                'The ability to cope with stress and recover from hard times — and importantly, it\'s not something you either have or don\'t. Resilience can be built and strengthened through support, healthy habits, connection, and self-care. Building resilience doesn\'t mean never struggling; it means having the tools and support to get through and bounce back.',
            },
            {
              id: 'burn-s02-reveal-coping',
              type: 'reveal_card',
              frontTitle: 'Healthy vs. Unhealthy Coping',
              frontBody: 'Healthy vs. unhealthy coping',
              backTitle: 'Healthy vs. Unhealthy Coping',
              backBody:
                'Coping is how we handle stress — and the way we cope matters. Healthy coping restores us: rest, talking to someone, movement, breaks, hobbies, support. Unhealthy coping harms us: drinking too much, isolating, overeating or not eating, bottling everything up. Part of protecting yourself is choosing coping that heals rather than coping that hurts.',
            },
            {
              id: 'burn-s02-reveal-asking-help',
              type: 'reveal_card',
              frontTitle: 'Asking for Help',
              frontBody: 'Asking for help',
              backTitle: 'Asking for Help',
              backBody:
                'Reaching out — to a coworker, supervisor, friend, family, or professional — when stress becomes too much to carry alone. This is the single most important skill in this course, and the hardest for many caregivers. Asking for help is a sign of strength and self-respect, never weakness — and for serious distress, it can be lifesaving.',
            },
            {
              id: 'burn-s02-knowledge-check',
              type: 'knowledge_check',
              question: 'Which term means "the cost of caring" — the numbing that comes from absorbing others\' suffering?',
              options: [
                { id: 'compassion-fatigue', label: 'Compassion fatigue' },
                { id: 'burnout', label: 'Burnout' },
                { id: 'resilience', label: 'Resilience' },
              ],
              correctOptionId: 'compassion-fatigue',
              explanation:
                'Compassion fatigue — the cost of caring. It\'s the emotional exhaustion and numbing that builds up from absorbing others\' suffering day after day, and it often strikes the most dedicated caregivers hardest. Burnout is the broader exhaustion from long-term work stress.',
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
            { id: 'burn-s03-heading', type: 'heading', level: 1, text: 'Statistics' },
            {
              id: 'burn-s03-image',
              type: 'image',
              src: '/assets/courses/burnout/s03-hero.jpg',
              caption: 'Burnout is extraordinarily common in caregiving — and it is not your fault.',
            },
            pendingAudio(
              'burn-s03-audio',
              'The Cost of Caring: Why Burnout Is So Common — and Not Your Fault',
              '/assets/courses/burnout/s03-stats-podcast.mp3',
              [
                'The Cost of Caring: Why Burnout Is So Common — and Not Your Fault',
                '',
                'Burnout among healthcare and direct-care workers is extraordinarily common — by many measures, a large share of nurses, nursing assistants, and other frontline caregivers report significant burnout, and the demands of recent years have pushed those numbers even higher. Among direct-care workers like CNAs specifically, the conditions that drive burnout are intense: physically and emotionally demanding work, frequent short-staffing, modest pay, heavy workloads, and constant exposure to illness, decline, grief, and death. So if you\'ve felt burned out, you are in enormous company — this is one of the defining challenges of the caregiving workforce, not a private failing.',
                '',
                'And that word — failing — is exactly what this course exists to correct. Burnout and compassion fatigue are normal, predictable responses to extraordinary, sustained stress. The science is clear that the human stress system is built for short bursts of demand followed by recovery; when the demand never lets up and recovery never comes, exhaustion and numbing follow as surely as a muscle gives out under a load held too long. This happens to strong, capable, dedicated people — in fact, research on compassion fatigue finds it often strikes the most empathetic and committed caregivers hardest, precisely because they invest so much of themselves. Feeling burned out is evidence that you have been caring deeply in a hard job, not evidence that you are weak or bad at it.',
                '',
                'The toll, if burnout is ignored, is real and worth taking seriously — which is the reason for the honesty in this course. For the caregiver, chronic burnout is linked to exhaustion, sleep problems, headaches and physical illness, anxiety, and a significantly elevated risk of depression. This is important and sobering: healthcare workers, including direct-care staff, experience depression and even suicidal thoughts at concerning rates, which is exactly why this course treats reaching out for help — including urgent help — as essential, not optional. For residents, a burned-out, numb, exhausted caregiver is more likely to make errors and to give care that\'s colder and less attentive, so caregiver wellbeing is genuinely a patient-safety issue. And for the field, burnout drives skilled, caring people out of the profession, worsening the staffing shortages that fuel more burnout.',
                '',
                'But the hopeful core is strong and well supported: burnout and compassion fatigue can be prevented, eased, and recovered from. Self-care that actually restores — sleep, rest, movement, nutrition, breaks, connection — genuinely buffers stress. Social support from coworkers, friends, and family is one of the most protective factors there is. Resilience can be built; it isn\'t fixed. Setting limits, processing hard experiences, and finding meaning in the work all help. And asking for help — from a trusted person, a supervisor, or a mental health professional — works, and for serious distress can be lifesaving. The bottom line: burnout is common, it\'s a normal response to a hard job rather than a weakness, it carries a real toll if ignored, and it responds to self-care, support, and reaching out — which is why caring for yourself is part of caring for others.',
              ].join('\n'),
              '/assets/courses/burnout/s03-stats-podcast.mp3',
            ),
            {
              id: 'burn-s03-source-note',
              type: 'callout',
              variant: 'clinical',
              title: 'About these figures',
              body: 'This section describes burnout qualitatively (e.g., "a large share of caregivers," "concerning rates") rather than citing specific numbers. The World Health Organization recognizes burnout as an occupational phenomenon. Any precise statistic added later must come from a named, verifiable source — not from estimation. Crisis support: 988 Suicide & Crisis Lifeline.',
            },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: 'Fundamentals',
        sortOrder: 3,
        buildContent: () =>
          doc('Fundamentals', [
            { id: 'burn-s04-heading', type: 'heading', level: 1, text: 'Fundamentals' },
            {
              id: 'burn-s04-video',
              type: 'video',
              title: 'Fundamentals',
              videoUrl: `${ASSET_BASE}/s04-fundamentals.mp4`,
              placeholderNote: 'Pending upload: /assets/courses/burnout/s04-fundamentals.mp4',
            },
            {
              id: 'burn-s04-image',
              type: 'image',
              src: '/assets/courses/burnout/s04-hero.jpg',
              caption: 'Burnout and compassion fatigue are normal responses to extraordinary stress — not weakness.',
            },
            {
              id: 'burn-s04-narration',
              type: 'text',
              body: [
                '**What burnout actually is**',
                'Burnout is more than being tired after a hard shift — it\'s deep, lasting exhaustion from stress that goes on and on. It has three classic parts: feeling completely drained and used up, physically and emotionally; becoming distant, cynical, or numb toward the work and even the people in your care; and feeling ineffective — like nothing you do matters or is ever good enough. When these settle in and stay, that\'s burnout. Knowing its shape helps you recognize it in yourself before it deepens.',
                '**What compassion fatigue adds**',
                'Compassion fatigue is burnout\'s close cousin, specific to caring work. It\'s the gradual cost of absorbing other people\'s suffering — the emotional exhaustion and numbing that can come from giving so much of yourself to people who are ill, declining, grieving, or dying. You may notice yourself feeling less able to feel for residents, going numb to protect yourself, or carrying their pain home. The cruel irony: it strikes caring people hardest. Feeling it isn\'t a sign you\'ve stopped caring — it\'s a sign you\'ve cared so much it\'s worn a groove.',
                '**The crucial truth: this is not weakness**',
                'Hold onto this above everything: burnout and compassion fatigue are not weakness, not failure, and not something wrong with you. They are normal, expected human responses to extraordinary, sustained stress — the predictable result of caring hard in a demanding job, often understaffed and under-resourced. The strongest, most devoted caregivers burn out, because they give the most. If you feel this, it doesn\'t mean you\'re failing — it means you\'re human and you\'ve been carrying a heavy load. Letting go of the shame is the first step to healing.',
                '**Why CNAs are especially at risk**',
                'Direct caregivers face a perfect storm. The work is physically hard — lifting, turning, constant motion — and emotionally hard — witnessing pain, decline, and death. It\'s often short-staffed, so the load piles up. It can be underpaid and under-recognized. You form bonds with residents and then lose them. And caregivers are often the type to put everyone else first and themselves last. Understanding why you\'re at risk isn\'t discouraging — it\'s protective, because it tells you this is about the job\'s demands, not about you, and that protecting yourself is reasonable and necessary.',
                '**How it affects you, your care, and your residents**',
                'Burnout doesn\'t stay contained. In you, it brings exhaustion, sleep trouble, headaches and illness, irritability, anxiety, low mood, and in serious cases depression. In your work, it brings more mistakes, less patience, and colder, more rushed care — which means your residents feel it too. And it can push you to leave a job and a calling you\'re meant for. Seeing this full picture makes the point unavoidable: taking care of yourself isn\'t selfish or optional — it\'s essential for your health, your residents\' safety, and your future in this work.',
                '**Healthy coping that actually restores**',
                'Not all coping is equal — some restores you, some quietly harms you. Healthy coping refills the cup: enough sleep, real rest and breaks, nourishing food, movement and fresh air, talking with people you trust, hobbies and time off, processing hard shifts instead of stuffing them down, and small daily moments of calm. Unhealthy coping drains it further: drinking too much, isolating, overeating or skipping meals, bottling everything up, or pushing through with no rest. Part of protecting yourself is honestly choosing the coping that heals over the coping that hurts.',
                '**The guiding truth: self-care and asking for help are strengths**',
                'Everything in this course rests here: caring for yourself is part of caring for others, and asking for help is a strength, never a weakness. You cannot give from an empty cup — refilling yours through self-care, rest, support, and connection is what keeps you able to care well. And when stress grows too heavy to carry alone, reaching out — to a coworker, a supervisor, a loved one, or a professional — is the strong, wise, self-respecting thing to do. For serious distress, it can save your life. Strong caregivers don\'t suffer in silence; they take care of themselves and they reach out.',
              ].join('\n\n'),
            },
            {
              id: 'burn-s04-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'This is not weakness',
              body: 'Burnout and compassion fatigue are normal responses to extraordinary, sustained stress. The most dedicated caregivers burn out, because they give the most. Feeling this means you\'re human and carrying a heavy load — not that you\'re failing.',
            },
          ]),
      },
    ],
  },
  {
    slug: 'module-2',
    title: 'Recognizing, Understanding, and Preventing',
    sortOrder: 1,
    lessons: [
      {
        slug: 's05-signs',
        title: 'Signs & Symptoms',
        sortOrder: 0,
        buildContent: () =>
          doc('Signs & Symptoms', [
            { id: 'burn-s05-heading', type: 'heading', level: 1, text: 'Signs & Symptoms' },
            {
              id: 'burn-s05-image',
              type: 'image',
              src: '/assets/courses/burnout/s05-hero.jpg',
              caption: 'Watch for exhaustion, numbness, and dread — in yourself and your coworkers.',
            },
            {
              id: 'burn-s05-narration',
              type: 'text',
              body: [
                'Recognizing burnout and compassion fatigue early — in yourself and your coworkers — is what lets you act before they deepen. Let\'s learn the signs, ending with the serious ones that mean it\'s time to reach out for real help.',
                '**Signs in your body and mind**',
                'Burnout shows up in the body and mind first. Watch for: feeling exhausted and drained no matter how much you rest. Trouble sleeping, or sleeping but never feeling rested. Frequent headaches, stomach trouble, getting sick more often, aches and tension. Trouble concentrating or remembering. Feeling foggy, slow, or overwhelmed. These physical and mental signs are your body waving a flag — chronic stress wearing you down. They\'re not something to push through indefinitely; they\'re a signal to pay attention and take care of yourself.',
                '**Signs in your feelings about the work**',
                'Burnout and compassion fatigue change how you feel about the work and the people in it. Watch for: dreading going to work, or feeling nothing about it. Becoming irritable, short-tempered, or easily frustrated. Feeling numb, detached, or cynical — going through the motions. Feeling less compassion or patience than you used to, or guilty about that. Feeling like nothing you do is good enough, or that your work doesn\'t matter. Losing the meaning or satisfaction you once found. These emotional signs — especially numbness toward people you used to care about easily — are the heart of compassion fatigue, and they deserve attention, not shame.',
                '**Recognizing it in your coworkers**',
                'You can look out for each other, too. Notice a coworker who seems constantly exhausted, withdrawn, or not themselves. Who\'s become irritable, short, or unusually quiet. Who\'s making more mistakes, calling in more, or talking about leaving. Who seems numb, hopeless, or like they\'re just barely holding on. These can be signs a coworker is struggling with burnout — and a kind word, a check-in, or simply letting them know they\'re not alone can matter enormously. Caregivers who support each other weather this far better than those who suffer alone.',
                '**The serious signs that mean reach out now**',
                'Some signs are serious and mean it\'s time to reach out for real help — and there\'s no shame in any of them. Persistent sadness, hopelessness, or emptiness that won\'t lift. Anxiety or dread you can\'t shake. Turning to alcohol or other substances to cope. Withdrawing from everyone. Feeling you can\'t go on, or that things would be better without you. Any thoughts of harming yourself. Please hear this clearly: if you feel hopeless, or have any thoughts of not wanting to be here or of harming yourself, you are not alone, this can get better, and you deserve support right now — reach out to someone you trust, a professional, or call or text the 988 Suicide and Crisis Lifeline immediately. Reaching out in serious distress isn\'t weakness — it\'s the bravest and most important thing you can do.',
                '**The rule underneath it all**',
                'Notice the signs early in yourself and others, treat them as signals not failures, and the more serious the sign, the more important it is to reach out for help.',
              ].join('\n\n'),
            },
            {
              id: 'burn-s05-callout',
              type: 'callout',
              variant: 'warning',
              title: 'Serious signs — reach out now',
              body: 'Lasting hopelessness, using substances to cope, withdrawing from everyone, or any thoughts of harming yourself mean reach out for help now. You are not alone and it can get better. Call or text the 988 Suicide & Crisis Lifeline.',
            },
          ]),
      },
      {
        slug: 's06-causes',
        title: 'Causes',
        sortOrder: 1,
        buildContent: () =>
          doc('Causes', [
            { id: 'burn-s06-heading', type: 'heading', level: 1, text: 'Causes' },
            {
              id: 'burn-s06-image',
              type: 'image',
              src: '/assets/courses/burnout/s06-hero.jpg',
              caption: 'Burnout comes from the demands of the job — not from who you are.',
            },
            pendingAudio(
              'burn-s06-audio',
              'Where Burnout Comes From — and Why It\'s About the Job, Not You',
              '/assets/courses/burnout/s06-causes-podcast.mp3',
              [
                'Where Burnout Comes From — and Why It\'s About the Job, Not You',
                '',
                'Understanding what causes burnout and compassion fatigue does something important: it lifts the blame off the individual caregiver and puts it where it belongs — on the genuinely hard demands of caring work — while showing what can actually help.',
                '',
                'The biggest causes are about the conditions of the work. Workload and short-staffing top the list: too much to do, too few hands, no time to recover between demands — the body\'s stress response never gets to switch off. The physical toll adds up: lifting, transferring, turning, and constant motion wear the body down. The emotional toll runs deep: caregivers witness pain, fear, confusion, decline, and death, and form real bonds with residents they then lose. There\'s often a lack of control — little say over schedules, assignments, or how things are done — which research shows is a powerful driver of burnout. There can be a lack of recognition or reward — feeling unseen, undervalued, or underpaid for demanding work. And there can be moral distress — wanting to give better care than circumstances allow, and carrying the weight of that gap. None of these are personal flaws; they are features of the job and the system.',
                '',
                'Compassion fatigue and secondary traumatic stress have a more specific source: the repeated, cumulative exposure to other people\'s suffering. Caring deeply means feeling deeply, and absorbing others\' pain day after day — without enough time and support to process it — gradually drains the emotional well. This is why it strikes the most empathetic caregivers; their gift for connection is exactly what leaves them exposed. Again, not a weakness — the cost of a strength.',
                '',
                'There are personal factors that can raise the risk, and naming them helps, not to assign blame but to guide self-care. Putting everyone else\'s needs first and your own last. Difficulty setting limits or saying no. Perfectionism — feeling nothing is ever enough. Carrying stress from home on top of work. Not having enough rest, support, or outlets. These aren\'t faults; they\'re patterns many caring people share, and they\'re patterns that can be gently shifted with awareness and support.',
                '',
                'So what\'s within a caregiver\'s control, and what isn\'t? Honesty matters here: you often can\'t fix the staffing, the pay, or the workload by yourself — those are real, system-level causes, and pretending self-care alone solves them would be unfair to you. But you can influence a great deal that protects you within those conditions: how you care for your own body and mind, the limits you set where you can, the support you build with coworkers and loved ones, the way you process hard experiences, and your willingness to reach out for help. And recognizing the system-level causes is itself freeing — it tells you the exhaustion isn\'t a verdict on your character. The takeaway: burnout comes mostly from the heavy, under-resourced demands of caring work, compassion fatigue from absorbing suffering — not from weakness — and while you can\'t fix every cause alone, self-care, support, limits, and asking for help genuinely protect you.',
              ].join('\n'),
              '/assets/courses/burnout/s06-causes-podcast.mp3',
            ),
          ]),
      },
      {
        slug: 's07-medications',
        title: 'Coping & Self-Protection',
        sortOrder: 2,
        buildContent: () =>
          doc('Coping & Self-Protection', [
            { id: 'burn-s07-heading', type: 'heading', level: 1, text: 'Coping & Self-Protection' },
            {
              id: 'burn-s07-image',
              type: 'image',
              src: '/assets/courses/burnout/s07-hero.jpg',
              caption: 'Healthy coping refills your cup — sleep, breaks, connection, and reaching out.',
            },
            {
              id: 'burn-s07-intro-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'A kind reminder',
              body: 'There\'s no prescription that fixes burnout — but there are real, proven ways to ease it and protect yourself. You are not expected to diagnose yourself, medicate yourself, or push through serious distress alone. Caring for yourself includes knowing when to reach out — and that\'s a strength.',
            },
            {
              id: 'burn-s07-narration',
              type: 'text',
              body: [
                'There\'s no prescription that fixes burnout — but there are real, proven ways to ease it, recover from it, and protect yourself, and most are within your reach. Let\'s walk through them. And first, the kind reminder that frames all of it: you are not expected to diagnose yourself, to medicate yourself, or to push through serious distress alone. Caring for yourself includes knowing when to reach out — and that\'s a strength.',
                '**Daily self-care that refills the cup.** These are the basics, and they genuinely work. Protect your sleep — it\'s the foundation of resilience. Take your breaks, really take them — step away, eat, breathe. Nourish your body with food and water through the shift. Move your body and get fresh air when you can. And build in small daily moments of calm — a few slow breaths, a quiet pause, something that settles you. None of this is selfish or optional; it\'s how you stay able to care. You cannot pour from an empty cup, so refill it, a little, every day.',
                '**Process the hard parts — don\'t stuff them down.** Caring work brings hard moments — suffering, loss, difficult shifts. Don\'t bottle them. Talk them through with a trusted coworker, friend, or family member. Acknowledge grief when a resident you cared for dies. Use any debriefs, support groups, or counseling your workplace offers. Letting hard experiences move through you, instead of sealing them inside, is what prevents them from hardening into compassion fatigue.',
                '**Set limits and find meaning where you can.** Within what you can control, protect yourself: set gentle limits, say no when you\'re able, and don\'t take on everyone\'s everything. And reconnect to why this work matters to you — the moments of real human connection, the difference you make — because meaning is one of the strongest buffers against burnout. You can\'t fix the staffing or the pay alone, and that\'s not your failing; but limits and meaning help you weather them.',
                '**Lean on each other.** Social support is one of the most protective things there is. Lean on coworkers who understand, check in on each other, share the load, and let people in your life support you. Caregivers who support one another get through this far better than those who go it alone. You\'re not meant to carry it solo.',
                '**Know when to get professional help — and reach out.** Self-care helps, but it isn\'t always enough, and that\'s not a failure. If you have lasting sadness or hopelessness, anxiety you can\'t shake, you\'re using substances to cope, you\'re withdrawing from everyone, or your distress is interfering with your life — please reach out for professional help: a doctor, a counselor, an employee assistance program, your supervisor. And the urgent line, said plainly: if you ever feel you can\'t go on, or have any thoughts of harming yourself, you are not alone and help is available right now — reach out to someone immediately or call or text 988, the Suicide and Crisis Lifeline. Getting help in serious distress is the strongest, most important thing you can do.',
                'The spirit of this section: protect yourself daily, process the hard parts, set limits, lean on others — and when it\'s more than self-care can hold, reach out for real help, because asking is strength and, sometimes, lifesaving.',
              ].join('\n\n'),
            },
            {
              id: 'burn-s07-callout',
              type: 'callout',
              variant: 'warning',
              title: 'When self-care isn\'t enough',
              body: 'If distress is serious — lasting hopelessness, substance use, withdrawing, or any thoughts of self-harm — reach out now. You\'re not alone. Call or text 988, the Suicide & Crisis Lifeline. Asking for help is strength, and sometimes lifesaving.',
            },
          ]),
      },
      {
        slug: 's08-prevention',
        title: 'Prevention',
        sortOrder: 3,
        buildContent: () =>
          doc('Prevention', [
            { id: 'burn-s08-heading', type: 'heading', level: 1, text: 'Prevention' },
            {
              id: 'burn-s08-image',
              type: 'image',
              src: '/assets/courses/burnout/s08-hero.jpg',
              caption: 'The best time to deal with burnout is before it takes hold.',
            },
            {
              id: 'burn-s08-narration',
              type: 'text',
              body: [
                'The best time to deal with burnout is before it takes hold. Here are seven ways to protect yourself and prevent it from deepening.',
                '**One. Protect your sleep and rest.** Guard your sleep like the essential medicine it is, and take real rest and real breaks — stepping away, even briefly, instead of running on empty. Rest is the foundation everything else stands on. A rested caregiver has the reserves to handle stress; an exhausted one has none. Protecting your rest is the most basic prevention there is.',
                '**Two. Take your breaks and feed your body.** During shifts, actually take your breaks — sit, breathe, eat, drink water. Don\'t skip meals or push through without pause. Your body is doing hard physical and emotional work; fueling and resting it through the day prevents the slow drain that leads to burnout. You give better care fed and rested than depleted.',
                '**Three. Talk it out — don\'t bottle it up.** Make a habit of processing hard shifts and feelings with people you trust, rather than sealing them inside. Naming the weight of a hard day, or grieving a resident\'s loss, keeps emotions moving instead of hardening into compassion fatigue. Regular honest talking is one of the simplest, strongest preventions.',
                '**Four. Stay connected and supported.** Keep up the relationships that sustain you — coworkers who understand, friends, family. Lean on them, and be there for them. Don\'t let exhaustion pull you into isolation, which makes everything worse. Strong connection is one of the most protective forces against burnout. Stay in community; don\'t go it alone.',
                '**Five. Set limits where you can.** Within what\'s in your control, practice saying no, not taking on everyone\'s everything, and keeping some boundary between work and home. You can\'t control the staffing or the system, but protecting the limits you can set keeps you from being completely consumed. Reasonable limits are self-respect, not selfishness.',
                '**Six. Keep what restores you outside of work.** Protect the things that refill you off the clock — hobbies, movement, nature, faith, fun, time with people you love. A life outside caregiving is what gives you something to draw from. Don\'t let the job swallow everything; the parts of your life that bring you joy are also what protect you in your work.',
                '**Seven. Check in with yourself — and reach out early.** Regularly ask yourself honestly how you\'re really doing, and treat the early signs of burnout as signals to act, not push past. And reach out for support early, before you\'re at the breaking point — to a coworker, loved one, or professional. Catching it early, and asking for help before it\'s a crisis, is the wisest prevention of all. You don\'t have to wait until you\'re drowning to deserve help.',
              ].join('\n\n'),
            },
          ]),
      },
    ],
  },
  {
    slug: 'module-3',
    title: 'Reaching Out, Supporting Others, and Application',
    sortOrder: 2,
    lessons: [
      {
        slug: 's09-emergency',
        title: 'When to Reach Out for Help',
        sortOrder: 0,
        buildContent: () =>
          doc('When to Reach Out for Help', [
            {
              id: 'burn-s09-heading',
              type: 'heading',
              level: 1,
              text: 'When to Reach Out for Help',
            },
            pendingAudio(
              'burn-s09-intro-audio',
              'Recognizing serious distress and supporting a coworker — intro',
              '/assets/courses/burnout/s09-emergency-intro.mp3',
              'In this course, the judgments that matter most are knowing when your own stress — or a coworker\'s — has gone past everyday hard and into the range that needs real support, and responding to a coworker in serious distress. You\'re about to work through two situations. Read each carefully, choose your action, and you\'ll get feedback right away. Keep the core ideas in mind: lasting hopelessness and any thoughts of self-harm mean reach out for help now, and a coworker who\'s barely holding on needs kindness and connection to support, not silence.',
              '/assets/courses/burnout/s09-emergency-intro.mp3',
            ),
            {
              id: 'burn-s09-image',
              type: 'image',
              src: '/assets/courses/burnout/s09-hero.jpg',
              caption: 'Serious distress means reach out now — asking for help is strength.',
            },
            {
              id: 'burn-s09-scenario-image',
              type: 'image',
              src: '/assets/courses/burnout/s09-scenario.jpg',
              caption: 'Hopelessness and withdrawal are signs that need real support, not silence.',
            },
            {
              id: 'burn-s09-scenario-self',
              type: 'scenario_question',
              prompt:
                'For the past several weeks, you\'ve felt exhausted no matter how much you sleep, you dread every shift, you feel numb and hopeless, you\'ve started having a few drinks most nights just to cope, and lately you\'ve had moments of feeling like everyone might be better off without you. You keep telling yourself to just push through and that asking for help would be weak. What SHOULD you do?',
              options: [
                {
                  id: 'push-through',
                  label: 'Keep pushing through alone — asking for help would be weak',
                  feedback:
                    'Please reconsider — this one matters personally. Weeks of exhaustion, dread, numbness, hopelessness, drinking to cope, and especially any thought that people would be better off without you are serious signs that need real support NOW, not pushing through alone. Asking for help is strength, never weakness, and in serious distress it can be lifesaving. Please reach out today — to someone you trust, a professional — and if hopelessness or thoughts of self-harm are present, call or text 988 (Suicide & Crisis Lifeline) right away. You\'re not alone, and it can get better.',
                },
                {
                  id: 'reach-out',
                  label: 'Recognize these as serious signs, and reach out for help now — to someone you trust, a professional, or by calling or texting 988 — because this is serious, you\'re not alone, and it can get better',
                  feedback:
                    'This is exactly right, and please take it to heart for yourself as much as for any test. What you\'re describing — weeks of exhaustion that rest doesn\'t fix, dread, numbness, hopelessness, using alcohol to cope, and especially any thoughts that people would be better off without you — are serious signs that stress has moved beyond everyday burnout into territory that needs real support now. That last one matters most: any thought of not wanting to be here, or that others would be better off without you, is a signal to reach out immediately, not to push past. And here is the truth this whole course is built on — asking for help is not weakness. It is the strongest, bravest, most self-respecting thing a person can do, and in serious distress it can be lifesaving. Please reach out today: to someone you trust, your supervisor, a doctor or counselor, an employee assistance program — and if those feelings of hopelessness or self-harm are present, call or text 988, the Suicide and Crisis Lifeline, right away. You give so much care to others; you deserve that same care. You are not alone, this is not weakness, and it can get better.',
                  isRecommended: true,
                },
                {
                  id: 'drink-more',
                  label: 'Drink a little more to get through it',
                  feedback:
                    'Using alcohol to cope deepens the danger rather than easing it. Weeks of exhaustion, dread, numbness, hopelessness, and especially any thought that people would be better off without you are serious signs that need real support NOW. Asking for help is strength, and in serious distress it can be lifesaving. Please reach out today, and if hopelessness or thoughts of self-harm are present, call or text 988 (Suicide & Crisis Lifeline) right away. You\'re not alone.',
                },
                {
                  id: 'wait',
                  label: 'Just wait and hope it passes on its own',
                  feedback:
                    'These signs — weeks of exhaustion, hopelessness, drinking to cope, and especially any thought that people would be better off without you — are too serious to wait out. They need real support NOW. Asking for help is strength, never weakness, and in serious distress it can be lifesaving. Please reach out today, and if hopelessness or thoughts of self-harm are present, call or text 988 (Suicide & Crisis Lifeline) right away. You\'re not alone, and it can get better.',
                },
              ],
              requiredForCompletion: true,
            },
            {
              id: 'burn-s09-scenario-coworker',
              type: 'scenario_question',
              prompt:
                'Your coworker Marie, normally warm and upbeat, has seemed exhausted, withdrawn, and not herself for weeks. She\'s snapping at people, making uncharacteristic mistakes, and today you overheard her say quietly that she "doesn\'t know how much longer she can keep doing this." Another coworker says, "Mind your own business — she just needs to toughen up." What SHOULD you do?',
              options: [
                {
                  id: 'mind-own',
                  label: 'Mind your own business and assume she needs to "toughen up"',
                  feedback:
                    '"Toughen up" and minding your own business are exactly the wrong response — burnout isn\'t weakness, and shame deepens isolation. Marie\'s exhaustion, withdrawal, mistakes, and especially saying she can\'t keep going are signs she\'s struggling and needs support. The kind, right response: check in privately, let her know you\'ve noticed and care, listen without judgment, and encourage her to get help — and if you\'re worried she might harm herself, take it seriously and help her reach immediate support, including 988.',
                },
                {
                  id: 'reach-out-kindly',
                  label: 'Reach out with kindness — check in privately, let her know you\'ve noticed and care, listen without judgment, and encourage her to get support',
                  feedback:
                    'Right — and this kind of looking-out-for-each-other is one of the most protective things in all of caregiving. Marie is showing classic signs of burnout and possibly compassion fatigue: exhaustion, withdrawal, being short with people, uncharacteristic mistakes, and — the part that needs real attention — saying she doesn\'t know how much longer she can keep going. "Toughen up" is exactly the harmful myth this course exists to dispel; burnout isn\'t weakness, and shaming a struggling caregiver only deepens their isolation. The kind, right response is to reach out: find a private moment, gently let her know you\'ve noticed and you care, listen without judgment, and encourage her to seek support — from a supervisor, an employee assistance program, or a professional. Sometimes simply knowing a coworker sees you and cares is what helps someone hold on and reach for help. And if anything she says makes you worried she might harm herself, take it seriously, stay with her, and help her connect to immediate support, including 988. Caregivers who support each other weather this far better than those who suffer alone — and your kindness to Marie might matter more than you\'ll ever know.',
                  isRecommended: true,
                },
                {
                  id: 'report-mistakes',
                  label: 'Report her to management for making mistakes',
                  feedback:
                    'Reporting her for mistakes treats a struggling, burned-out caregiver as a problem rather than a person who needs support — and misses what she\'s really signaling. Her exhaustion, withdrawal, mistakes, and especially saying she can\'t keep going are signs she needs kindness, not discipline. The kind, right response: check in privately, listen without judgment, and encourage her to get support — and if you\'re worried she might harm herself, help her reach immediate support, including 988.',
                },
                {
                  id: 'avoid',
                  label: 'Avoid her so you don\'t get pulled into her problems',
                  feedback:
                    'Avoiding her deepens the isolation that makes burnout worse. Marie\'s exhaustion, withdrawal, mistakes, and especially saying she can\'t keep going are signs she\'s struggling and needs connection. The kind, right response: check in privately, let her know you\'ve noticed and care, listen without judgment, and encourage her to get support — and if you\'re worried she might harm herself, take it seriously and help her reach immediate support, including 988.',
                },
              ],
              requiredForCompletion: true,
            },
          ]),
      },
      {
        slug: 's10-cna-role',
        title: 'Your Role: Caring for Yourself & Your Coworkers',
        sortOrder: 1,
        buildContent: () =>
          doc('Your Role: Caring for Yourself & Your Coworkers', [
            { id: 'burn-s10-heading', type: 'heading', level: 1, text: 'Your Role: Caring for Yourself & Your Coworkers' },
            {
              id: 'burn-s10-video',
              type: 'video',
              title: 'Your Role: Caring for Yourself & Your Coworkers',
              videoUrl: `${ASSET_BASE}/s10-cna-role.mp4`,
              placeholderNote: 'Pending upload: /assets/courses/burnout/s10-cna-role.mp4',
            },
            {
              id: 'burn-s10-image',
              type: 'image',
              src: '/assets/courses/burnout/s10-hero.jpg',
              caption: 'Care for yourself and your coworkers with the same dedication you give your residents.',
            },
            {
              id: 'burn-s10-narration',
              type: 'text',
              body: [
                'Your role here is to care for yourself and your coworkers with the same dedication you give your residents — recognizing, coping, supporting, and reaching out. Let\'s walk through it.',
                '**Care for yourself daily.** Treat your own wellbeing as part of the job, not an afterthought. Protect your sleep, take real breaks, nourish your body, move, and build in small moments of calm. Notice the early signs of burnout in yourself and treat them as signals to act, not push past. You give so much to others; refilling your own cup through daily self-care is what keeps you able to keep giving — and it\'s not selfish, it\'s essential.',
                '**Process the hard parts.** Don\'t carry it all alone or stuff it down. Talk through hard shifts and feelings with people you trust, grieve the losses, and use the debriefs, support, or counseling available to you. Letting hard experiences move through you instead of hardening inside is how you protect yourself from compassion fatigue. Caring deeply means you\'ll feel deeply — give those feelings somewhere to go.',
                '**Support your coworkers.** Look out for each other. Notice when a coworker seems exhausted, withdrawn, or not themselves, and reach out with kindness — a check-in, a listening ear, letting them know they\'re not alone. Never shame a struggling coworker with "toughen up." And if a coworker shows serious distress or any sign of self-harm, take it seriously and help them reach support. Caregivers who hold each other up get through this together.',
                '**Reach out for help — it\'s strength.** Know your own limits, and when stress grows past what self-care can hold, reach out for real help — a supervisor, a loved one, a professional, an employee assistance program. And in serious distress — lasting hopelessness, or any thought of harming yourself — reach out immediately, including 988, the Suicide and Crisis Lifeline. Asking for help is not weakness; it\'s the strongest, wisest, most self-respecting thing you can do, and sometimes it\'s lifesaving.',
                'Now the gentle boundary. You are not expected to diagnose yourself with a mental illness, to medicate yourself, or to white-knuckle through serious distress alone. You\'re not failing if self-care isn\'t enough — that\'s exactly when professional help is the right next step. And you never have to earn the right to be cared for; you already deserve it.',
                'Inside this role — caring for yourself, processing the hard parts, supporting your coworkers, and reaching out when you need to — you protect your own health and happiness, you give better and safer care, and you stay in this work you\'re meant for. Caring for yourself is part of caring for others. Please don\'t forget to be one of the people you take care of.',
              ].join('\n\n'),
            },
            {
              id: 'burn-s10-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'The gentle boundary',
              body: 'You are not expected to diagnose yourself, medicate yourself, or push through serious distress alone. You\'re not failing if self-care isn\'t enough — that\'s exactly when professional help is the right next step. You already deserve to be cared for.',
            },
          ]),
      },
      {
        slug: 's11-case-study',
        title: 'Brief Case Study',
        sortOrder: 2,
        buildContent: () => {
          const caseNarrative = [
            'Rosa had been a CNA for nine years, and she was the one everyone counted on — first to volunteer, last to leave, the one who stayed late to sit with a dying resident so they wouldn\'t be alone. She loved the work. But the unit had been short-staffed for months, she was picking up extra shifts, and three residents she\'d been close to had died that season. Slowly, without quite noticing, Rosa changed.',
            '',
            '**The slow slide:** She was exhausted in a way sleep didn\'t fix. She started dreading her shifts — she, who\'d always loved them. She felt numb where she used to feel tenderness, going through the motions, and then felt guilty for the numbness. She snapped at coworkers. She stopped seeing friends, stopped her evening walks, and started having a couple of glasses of wine most nights "just to turn my brain off." She told herself she was fine, that good caregivers don\'t complain, and that needing help would mean she was weak. She kept pushing.',
            '',
            '**What her coworker noticed:** Her coworker Daniel had taken the burnout training, and he recognized what he was seeing: not a weak or lazy caregiver, but a deeply dedicated one sliding into burnout and compassion fatigue — the classic picture of exhaustion, numbness, withdrawal, irritability, and unhealthy coping, in exactly the kind of big-hearted person it strikes hardest. He didn\'t say "toughen up." He found a quiet moment, told Rosa gently that he\'d noticed she seemed worn down and that he cared, and listened without judgment.',
            '',
            '**The turning point:** At first Rosa brushed it off — "I\'m fine, just tired." But Daniel\'s kindness cracked something open, and she admitted how empty and hopeless she\'d been feeling, and that lately she\'d even had dark moments where she wondered if everyone would be better off without her. Daniel took that seriously. He told her clearly: this wasn\'t weakness, it was burnout in someone who\'d given everything, it could get better, and she deserved real support. He stayed with her, helped her talk to their supervisor, and encouraged her to reach out to the employee assistance program and her doctor — and made sure she knew that if those dark thoughts ever felt urgent, she could call or text 988 any time.',
            '',
            '**The recovery:** Rosa reached out. She talked to a counselor, who helped her see that her exhaustion and numbness were a normal response to extraordinary stress, not a character flaw. She began rebuilding the basics — protecting her sleep, taking her breaks, walking again, reconnecting with friends, cutting back the wine, and letting herself grieve the residents she\'d lost instead of stuffing it down. She set gentle limits on the extra shifts. Slowly, the tenderness came back — the numbness lifted, and she remembered why she\'d loved this work. She wasn\'t "fixed" overnight, but she was no longer drowning, and no longer alone.',
            '',
            '**The outcome:** Rosa stayed in the work she was meant for — but as someone who now understood that caring for herself was part of caring for others, and that reaching out was strength. The counselor told her something she never forgot: "You spent nine years making sure no one else suffered alone. You\'re allowed to be one of the people who gets taken care of, too." And Daniel\'s quiet check-in — one coworker noticing, caring, and refusing to look away — may well have been what turned it around.',
          ].join('\n');

          return doc('Brief Case Study', [
            { id: 'burn-s11-heading', type: 'heading', level: 1, text: 'Brief Case Study' },
            pendingAudio(
              'burn-s11-audio',
              'The Caregiver Who Forgot to Be Cared For',
              '/assets/courses/burnout/s11-case-podcast.mp3',
              caseNarrative,
              '/assets/courses/burnout/s11-case-podcast.mp3',
            ),
            {
              id: 'burn-s11-image',
              type: 'image',
              src: '/assets/courses/burnout/s11-hero.jpg',
              caption: 'Rosa slid into burnout — until a coworker\'s kindness helped her reach out.',
            },
            {
              id: 'burn-s11-case-study',
              type: 'case_study',
              title: 'The Caregiver Who Forgot to Be Cared For',
              residentProfile:
                'Rosa, a CNA of nine years, was the one everyone counted on — first to volunteer, last to leave. After months of short-staffing, extra shifts, and the deaths of three residents she\'d been close to, she slowly slid into burnout and compassion fatigue: exhaustion sleep didn\'t fix, dread, numbness, irritability, withdrawal, and using wine most nights to cope — while telling herself good caregivers don\'t need help.',
              scenario: [
                '**What her coworker noticed:** Her coworker Daniel had taken the burnout training, and he recognized what he was seeing: not a weak or lazy caregiver, but a deeply dedicated one sliding into burnout and compassion fatigue — exhaustion, numbness, withdrawal, irritability, and unhealthy coping, in exactly the kind of big-hearted person it strikes hardest. He didn\'t say "toughen up." He found a quiet moment, told Rosa gently that he\'d noticed she seemed worn down and that he cared, and listened without judgment.',
                '**The turning point:** At first Rosa brushed it off — "I\'m fine, just tired." But Daniel\'s kindness cracked something open, and she admitted how empty and hopeless she\'d been feeling, and that lately she\'d even had dark moments where she wondered if everyone would be better off without her. Daniel took that seriously. He told her clearly: this wasn\'t weakness, it was burnout in someone who\'d given everything, it could get better, and she deserved real support. He stayed with her, helped her talk to their supervisor, and encouraged her to reach out to the employee assistance program and her doctor — and made sure she knew that if those dark thoughts ever felt urgent, she could call or text 988 any time.',
                '**The recovery:** Rosa reached out. A counselor helped her see that her exhaustion and numbness were a normal response to extraordinary stress, not a character flaw. She rebuilt the basics — sleep, breaks, walking again, reconnecting with friends, cutting back the wine, grieving the residents she\'d lost — and set gentle limits on the extra shifts. The tenderness came back; she remembered why she\'d loved this work. She wasn\'t "fixed" overnight, but she was no longer drowning, and no longer alone.',
                '**The outcome:** Rosa stayed in the work she was meant for — now understanding that caring for herself was part of caring for others, and that reaching out was strength. The counselor told her something she never forgot: "You spent nine years making sure no one else suffered alone. You\'re allowed to be one of the people who gets taken care of, too." Daniel\'s quiet check-in — one coworker noticing, caring, and refusing to look away — may well have been what turned it around.',
              ].join('\n\n'),
            },
            {
              id: 'burn-s11-reflection-1',
              type: 'reflection',
              prompt:
                'Rosa believed that "good caregivers don\'t need help" and that asking for help would mean she was weak. Why is this belief so harmful, and what is the truth this course teaches instead?',
              minCharacters: 50,
            },
            {
              id: 'burn-s11-reflection-2',
              type: 'reflection',
              prompt:
                'Daniel noticed the signs in Rosa and reached out instead of looking away. What signs was he seeing, and why does a coworker\'s kind check-in matter so much for someone sliding into burnout?',
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
            { id: 'burn-s12-heading', type: 'heading', level: 1, text: 'Conclusion' },
            {
              id: 'burn-s12-video',
              type: 'video',
              title: 'Conclusion',
              videoUrl: `${ASSET_BASE}/s12-conclusion.mp4`,
              placeholderNote: 'Pending upload: /assets/courses/burnout/s12-conclusion.mp4',
            },
            {
              id: 'burn-s12-image',
              type: 'image',
              src: '/assets/courses/burnout/s12-hero.jpg',
              caption: 'You give so much to your residents — please be one of the people you take care of.',
            },
            {
              id: 'burn-s12-narration',
              type: 'text',
              body: [
                'You\'ve reached the end. Let\'s lock in the five things that matter most about caregiver burnout and compassion fatigue — and please, take these to heart for yourself.',
                '**One.** Burnout and compassion fatigue are real, and they are not weakness. Burnout is deep exhaustion from long-term work stress; compassion fatigue is the cost of caring — the numbing that comes from absorbing others\' suffering. They are normal responses to extraordinary stress, and they strike the most dedicated caregivers hardest. Feeling them means you\'re human and you\'ve been carrying a heavy load — not that you\'re failing.',
                '**Two.** Know the signs, in yourself and others. In you: exhaustion that rest doesn\'t fix, dread, numbness, irritability, feeling nothing\'s good enough, physical symptoms, lost meaning. In coworkers: exhaustion, withdrawal, more mistakes, talk of leaving. Notice them early, treat them as signals not failures, and look out for each other.',
                '**Three.** Care for yourself daily — you can\'t pour from an empty cup. Protect your sleep, take your breaks, feed your body, move, stay connected, set limits where you can, process the hard parts instead of bottling them, and keep what restores you outside of work. Self-care isn\'t selfish; it\'s how you stay able to care.',
                '**Four.** Asking for help is strength, never weakness. When stress grows past what self-care can hold, reach out — to a coworker, supervisor, loved one, or professional. And the serious signs — lasting hopelessness, substance use, withdrawing, any thoughts of self-harm — mean reach out now. You are not alone, it can get better, and the 988 Suicide and Crisis Lifeline is there any time, by call or text.',
                '**Five.** Caring for yourself is part of caring for others. The person doing the caring matters too. You give so much to your residents — please be one of the people you take care of. Protect your wellbeing, support your coworkers, reach out when you need to, and stay well in this work you\'re meant for.',

                'This course provides one hour of continuing education through CAL ACE Nursing Academy (CDPH Provider NAC #7384). Your certificate is generated automatically when you pass the knowledge check.',
                'Ten questions are waiting. Everything on them was covered here. You\'re ready. Trust what you\'ve learned, and show what you know. And take care of yourself out there.',
              ].join('\n\n'),
            },
            {
              id: 'burn-s12-summary',
              type: 'summary',
              title: 'Five things that matter most',
              items: [
                'Burnout and compassion fatigue are real and not weakness — normal responses to extraordinary stress that strike the most dedicated caregivers hardest.',
                'Know the signs in yourself and others — exhaustion, dread, numbness, irritability, withdrawal — notice them early and look out for each other.',
                'Care for yourself daily — sleep, breaks, food, movement, connection, limits, processing the hard parts. You can\'t pour from an empty cup.',
                'Asking for help is strength, never weakness; serious signs (lasting hopelessness, substance use, withdrawing, any thoughts of self-harm) mean reach out now — 988 Suicide & Crisis Lifeline, call or text, any time.',
                'Caring for yourself is part of caring for others — please be one of the people you take care of.',
              ],
            },
          ]),
      },
    ],
  },
];

export async function seedCourse02CaregiverBurnout(
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
      label: 'V3 rebuild — caregiver burnout & compassion fatigue',
      status: CourseVersionStatus.DRAFT,
      deliveryMode: DeliveryMode.ONLINE,
      ceHours,
      publishedAt: null,
      contentMeta: contentMeta as Prisma.InputJsonValue,
    },
    update: {
      label: 'V3 rebuild — caregiver burnout & compassion fatigue',
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
    `Seeding Course 2 (Caregiver Burnout) as DRAFT — slug "${COURSE_SLUG}", version ${VERSION_NUMBER}…`,
  );

  try {
    const result = await seedCourse02CaregiverBurnout(prisma);
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
