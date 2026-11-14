/**
 * Seed Course 24 — Traumatic Brain Injury: What Every CNA Must Know (DRAFT).
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-24-traumatic-brain-injury
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
const COURSE_SLUG = 'traumatic-brain-injury';
const COURSE_TITLE = 'Head Injury Recovery: CNA Observation and Resident Support';
const COURSE_SUMMARY =
  'Learn to respond to head injuries — including the delayed danger after a fall — monitor and report, and provide daily care to residents living with the lasting effects of traumatic brain injury: memory, behavior, and emotional changes. CNAs do not diagnose brain injuries, perform neurological assessments, give or adjust medications, or decide a head bump is "nothing."';

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
    'Explain what a traumatic brain injury is, in plain language',
    'Respond correctly when a resident hits their head — and watch for the delayed dangers',
    'Care skillfully for residents living with lasting TBI effects',
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
  heroImage: '/assets/courses/traumatic-brain-injury/hero-banner.png',
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
    title: 'Understanding Traumatic Brain Injury',
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: 'Introduction',
        sortOrder: 0,
        buildContent: () =>
          doc('Introduction', [
            { id: 'tbi-s01-heading', type: 'heading', level: 1, text: 'Welcome' },
            {
              id: 'tbi-s01-video',
              type: 'video',
              title: 'Introduction',
              videoUrl: `${ASSET_BASE}/s01-intro.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s01-intro.mp4`,
            },
            {
              id: 'tbi-s01-hero-image',
              type: 'image',
              src: `${ASSET_BASE}/s01-hero.jpg`,
              caption:
                'Traumatic brain injury — responding to head strikes and supporting residents with lasting effects.',
            },
            {
              id: 'tbi-s01-narration',
              type: 'text',
              body: [
                'Welcome to CAL ACE Nursing Academy.',
                'This course is about traumatic brain injury — T-B-I — and it will teach you two very different skills that share one organ.',
                'A traumatic brain injury happens when an outside force injures the brain — a fall, a blow to the head, a car accident. This is different from a stroke, where the problem comes from inside a blood vessel. In TBI, the force comes from outside: the head strikes something, or something strikes the head, and the brain — soft tissue floating inside a hard skull — is shaken, bruised, or torn.',
                'The first skill in this course is about the moment of injury — and the hours after. In long-term care, falls happen, and heads get hit. Here is the fact that makes this course potentially life-saving: a person can hit their head, seem completely fine, and then become critically ill hours later as slow bleeding builds pressure inside the skull. "Fine now" does not mean fine. Older adults — with more fragile blood vessels, and often on blood thinners — are exactly the people this delayed danger hunts. You will learn why every head strike gets reported, and what delayed warning signs to watch for.',
                'The second skill is about the years after. Many residents live with the lasting effects of a brain injury from long ago — and some of them are young, because TBI strikes people of every age. These residents may have memory problems, slowed thinking, and — this is the part that\'s misunderstood most — changes in behavior and emotion. Irritability, outbursts, impulsiveness, sudden tears or laughter. Here is the truth this course will plant deep: the behavior is the injury talking, not the person. Learning to respond with calm instead of taking it personally is one of the most professional skills a CNA can own.',
                'Your scope is clear. A CNA reports every head injury, watches for delayed warning signs, provides structured, calm, patient daily care, and reports changes. A CNA does not diagnose brain injuries, does not perform the neurological checks nurses do, does not give medications, and never decides on their own that a head bump was "nothing."',
                'By the end of this course, you will be able to: explain what a TBI is, in plain language. Respond correctly when a resident hits their head — and watch for the delayed dangers. Care skillfully for residents living with lasting TBI effects. And know your scope.',
                'There is a ten-question knowledge check at the end. Everything on it is covered here. Let\'s begin.',
              ].join('\n\n'),
            },
            {
              id: 'tbi-s01-ci-text',
              type: 'text',
              body: [
                'This course teaches the CNA\'s role in responding to head injuries — including the delayed danger after a fall — monitoring and reporting, and providing daily care to residents living with the lasting effects of traumatic brain injury: memory, behavior, and emotional changes.',
                'Let\'s be clear about your role. A CNA reports every head injury, watches for delayed warning signs, provides structured, calm, patient daily care, and reports changes. A CNA does not diagnose brain injuries, does not perform the neurological checks nurses do, does not give medications, and never decides on their own that a head bump was "nothing." Those are nursing and physician tasks. But none of them can happen without your careful observation and faithful reporting first.',
              ].join('\n\n'),
            },
            {
              id: 'tbi-s01-ci-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of this course',
              body: 'CNAs REPORT, WATCH, SUPPORT, and REPORT CHANGES. CNAs do not diagnose brain injuries, perform neurological assessments, give or adjust medications, or decide a head bump was "nothing."',
            },
            {
              id: 'tbi-s01-lo-text',
              type: 'text',
              body: 'By the end of this course, you will be able to:',
            },
            {
              id: 'tbi-s01-lo-summary',
              type: 'summary',
              title: 'Learning objectives',
              items: [
                'Explain what a traumatic brain injury is, in plain language.',
                'Respond correctly when a resident hits their head — and watch for the delayed dangers.',
                'Care skillfully for residents living with lasting TBI effects.',
                'Know your scope — what a CNA does, and what a CNA must never do.',
              ],
            },
            {
              id: 'tbi-s01-ii-text',
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
            { id: 'tbi-s02-heading', type: 'heading', level: 1, text: 'Key terms' },
            {
              id: 'tbi-s02-hero-image',
              type: 'image',
              src: `${ASSET_BASE}/s02-hero.jpg`,
              caption:
                'The language of TBI — concussion, hematoma, lucid interval, emotional lability, and more.',
            },
            {
              id: 'tbi-s02-reveal-tbi',
              type: 'reveal_card',
              frontTitle: 'Traumatic Brain Injury (TBI)',
              frontBody: 'Traumatic brain injury',
              backTitle: 'Traumatic Brain Injury (TBI)',
              backBody:
                'An injury to the brain caused by an outside force — a fall, a blow, a jolt, or an object striking the head. TBI ranges from mild, like a concussion, to severe injuries with lasting effects. It is different from a stroke, which starts inside a blood vessel.',
            },
            {
              id: 'tbi-s02-reveal-concussion',
              type: 'reveal_card',
              frontTitle: 'Concussion',
              frontBody: 'Kun-KUSH-un',
              backTitle: 'Concussion',
              backBody:
                'A mild traumatic brain injury, usually from a bump or jolt that shakes the brain inside the skull. It can cause headache, dizziness, confusion, and nausea. "Mild" describes the category — every concussion is still a brain injury and is taken seriously.',
            },
            {
              id: 'tbi-s02-reveal-hematoma',
              type: 'reveal_card',
              frontTitle: 'Hematoma',
              frontBody: 'Hee-mah-TOE-mah',
              backTitle: 'Hematoma',
              backBody:
                'A collection of blood — a bleed — that can form inside the skull after a head injury. As blood collects, it presses on the brain. Some hematomas build slowly over hours or days, which is why a person can seem fine at first and worsen later.',
            },
            {
              id: 'tbi-s02-reveal-lucid-interval',
              type: 'reveal_card',
              frontTitle: 'Lucid Interval',
              frontBody: 'LOO-sid',
              backTitle: 'Lucid Interval',
              backBody:
                'The deceptive "fine" period after a head injury — the person is awake, talking, seemingly normal — while bleeding slowly builds pressure inside the skull. This is exactly why "they seem fine" never closes the book on a head strike, and why watching the hours after matters so much.',
            },
            {
              id: 'tbi-s02-reveal-emotional-lability',
              type: 'reveal_card',
              frontTitle: 'Emotional Lability',
              frontBody: 'Lah-BIL-ih-tee',
              backTitle: 'Emotional Lability',
              backBody:
                'Rapid, exaggerated mood swings caused by brain injury — sudden crying, sudden laughter, sudden anger, often out of proportion or out of context. The resident isn\'t being dramatic; the brain\'s emotional controls are damaged.',
            },
            {
              id: 'tbi-s02-reveal-impulsivity',
              type: 'reveal_card',
              frontTitle: 'Impulsivity and Disinhibition',
              frontBody: 'Dis-in-hih-BISH-un',
              backTitle: 'Impulsivity and Disinhibition',
              backBody:
                'Acting or speaking without the brain\'s normal "brakes" — blurting things out, grabbing, unsafe sudden movements, socially inappropriate comments. After TBI, the brain\'s braking system can be damaged. The behavior is the injury, not bad character.',
            },
            {
              id: 'tbi-s02-reveal-cognitive-fatigue',
              type: 'reveal_card',
              frontTitle: 'Cognitive Fatigue',
              frontBody: 'COG-nih-tiv',
              backTitle: 'Cognitive Fatigue',
              backBody:
                'Mental exhaustion after brain injury. Thinking, concentrating, and processing take far more effort for an injured brain, so it tires quickly — and when it tires, memory, mood, and behavior all get worse. Rest and pacing protect against it.',
            },
            {
              id: 'tbi-s02-reveal-neuro-check',
              type: 'reveal_card',
              frontTitle: 'Neuro Check',
              frontBody: 'NUR-oh',
              backTitle: 'Neuro Check',
              backBody:
                'The set of checks a nurse performs after a head injury — alertness, pupils, movement, speech — repeated over time to catch a worsening brain. The nurse performs neuro checks; the CNA supports them by observing between checks and reporting any change immediately.',
            },
            {
              id: 'tbi-s02-kc1-check-lucid-interval',
              type: 'knowledge_check',
              question: 'Match the term: the deceptive "fine" period while a bleed builds',
              options: [
                { id: 'lucid-interval', label: 'Lucid interval' },
                { id: 'emotional-lability', label: 'Emotional lability' },
                { id: 'cognitive-fatigue', label: 'Cognitive fatigue' },
              ],
              correctOptionId: 'lucid-interval',
              explanation:
                'Lucid interval. The deceptive "fine" period after a head injury — the person is awake, talking, seemingly normal — while bleeding slowly builds pressure inside the skull.',
              requiredForCompletion: true,
            },
            {
              id: 'tbi-s02-kc1-check-emotional-lability',
              type: 'knowledge_check',
              question: 'Match the term: rapid mood swings caused by the injury',
              options: [
                { id: 'lucid-interval', label: 'Lucid interval' },
                { id: 'emotional-lability', label: 'Emotional lability' },
                { id: 'cognitive-fatigue', label: 'Cognitive fatigue' },
              ],
              correctOptionId: 'emotional-lability',
              explanation:
                'Emotional lability. Rapid, exaggerated mood swings caused by brain injury — sudden crying, sudden laughter, sudden anger, often out of proportion or out of context.',
              requiredForCompletion: true,
            },
            {
              id: 'tbi-s02-kc1-check-cognitive-fatigue',
              type: 'knowledge_check',
              question: 'Match the term: mental exhaustion that worsens memory and behavior',
              options: [
                { id: 'lucid-interval', label: 'Lucid interval' },
                { id: 'emotional-lability', label: 'Emotional lability' },
                { id: 'cognitive-fatigue', label: 'Cognitive fatigue' },
              ],
              correctOptionId: 'cognitive-fatigue',
              explanation:
                'Cognitive fatigue. Mental exhaustion after brain injury. Thinking, concentrating, and processing take far more effort for an injured brain, so it tires quickly — and when it tires, memory, mood, and behavior all get worse.',
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
            { id: 'tbi-s03-heading', type: 'heading', level: 1, text: 'Statistics' },
            pendingAudio(
              'tbi-s03-audio',
              'Traumatic Brain Injury: The Fall at the Center of It',
              `${ASSET_BASE}/s03-stats-podcast.mp3`,
              [
                'Traumatic Brain Injury: The Fall at the Center of It',
                '',
                'Traumatic brain injury is a major cause of death and disability in the United States. Each year there are millions of TBI-related emergency visits, and hundreds of thousands of hospitalizations. More than five million Americans live with a long-term disability from a TBI — people of every age, injured by falls, vehicle crashes, assaults, and sports.',
                '',
                'For long-term care, two numbers tower over the rest. First: falls are the leading cause of TBI, responsible for roughly half of all TBI hospitalizations. Second: adults over seventy-five have the highest rates of TBI-related hospitalization and death of any age group. Put plainly — the typical TBI victim is not a young athlete; it is an older adult who fell. That is exactly the population CNAs care for every day.',
                '',
                'Why are older adults hit so hard by head injuries? With age, the brain naturally shrinks slightly inside the skull, stretching the small veins that bridge the gap — making them easier to tear in a fall. Healing is slower. And critically, many older adults take blood-thinning medications for their hearts, which means even a minor head bump can lead to serious bleeding inside the skull. A bump that a younger person shrugs off can, in an older adult on blood thinners, become a slow, hidden, life-threatening bleed.',
                '',
                'And that bleed often hides. After a fall, an older adult may seem completely fine — talking, joking, refusing a fuss — while blood slowly collects and presses on the brain over hours or even days. By the time obvious symptoms appear, the situation is critical. This is why every head strike in an older adult is reported and monitored, no matter how fine the person seems, and why the hours after a fall are watched so carefully.',
                '',
                'There is also the long-term story: many residents — including younger ones — live with the lasting effects of an old TBI: memory problems, slowed thinking, and changes in behavior and emotion. Their quality of life depends heavily on structured, calm, patient daily care.',
                '',
                'The bottom line: falls cause most TBIs, elderly residents are the most vulnerable, blood thinners raise the stakes, the danger often hides behind a "fine" face — and the CNA\'s reporting and vigilance in the hours after a fall can be the difference between life and death.',
              ].join('\n'),
              `${ASSET_BASE}/s03-stats-podcast.mp3`,
            ),
            {
              id: 'tbi-s03-hero-image',
              type: 'image',
              src: `${ASSET_BASE}/s03-hero.jpg`,
              caption: 'Falls, blood thinners, and the hidden danger after a head strike.',
            },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: 'Fundamentals',
        sortOrder: 3,
        buildContent: () =>
          doc('Fundamentals', [
            { id: 'tbi-s04-heading', type: 'heading', level: 1, text: 'Fundamentals' },
            {
              id: 'tbi-s04-video',
              type: 'video',
              title: 'Fundamentals',
              videoUrl: `${ASSET_BASE}/s04-fundamentals.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s04-fundamentals.mp4`,
            },
            {
              id: 'tbi-s04-hero-image',
              type: 'image',
              src: `${ASSET_BASE}/s04-hero.jpg`,
              caption:
                'A soft brain in a hard skull — how injury happens and why fine now does not mean fine.',
            },
            {
              id: 'tbi-s04-narration',
              type: 'text',
              body: [
                '**A soft brain in a hard box**',
                'The brain is soft — about the firmness of gelatin — and it floats in fluid inside the hard, rigid skull. The skull protects the brain from the outside world. But in a hard fall or blow, that same hard box becomes part of the problem: the soft brain slams against the inside of the skull.',
                '**How the injury happens**',
                'A TBI can injure the brain several ways. The impact can bruise the brain where it strikes the skull. The shaking can stretch and tear delicate nerve fibers. And blood vessels can tear and bleed. The injury you can see — a cut or bump on the scalp — tells you very little about the injury you can\'t see, inside the skull.',
                '**The hard box has no room to spare**',
                'Here\'s why bleeding inside the skull is so dangerous. The skull is rigid and completely full — brain, blood, and fluid, with no spare room. When a torn vessel bleeds, the collecting blood has nowhere to go, so it presses on the brain itself. As pressure builds, the brain is squeezed — and brain function fails. This pressure, not the bump itself, is what kills.',
                '**The deceptive hours: the lucid interval**',
                'Some bleeds are fast. But many — especially the slow vein bleeds common in older adults — build over hours or even days. During that time, the person can seem completely fine: awake, talking, joking. This deceptive "fine" period is called the lucid interval. Then, as pressure builds, they grow drowsy, confused, sick — and by then, time is short. This is the single most important idea in this course: after a head strike, fine now does not mean fine.',
                '**Why elderly heads are different**',
                'Aging changes the equation. The brain shrinks slightly with age, stretching the small bridging veins so they tear more easily — sometimes from a surprisingly minor bump. Blood thinners, which so many residents take, turn small tears into serious bleeds. And symptoms in the elderly can creep in slowly and be mistaken for "just tiredness" or "just dementia." All of this is why every head strike in an older adult is treated as serious.',
                '**The lasting effects of TBI**',
                'When a TBI heals, it can leave lasting changes — and they depend on what was damaged. Memory problems and slowed thinking. Trouble concentrating. Headaches and dizziness. And changes in emotion and behavior: irritability, impulsiveness, mood swings, a shorter fuse. The person may look completely healthy on the outside while working much harder on the inside.',
                '**The brain that\'s working overtime**',
                'A brain with an old injury works harder to do ordinary things — which means it tires faster, and when it tires, everything gets worse: memory, patience, mood, behavior. This is why structure, routine, calm surroundings, and rest aren\'t luxuries for a TBI resident. They are how an injured brain functions at its best — and you provide them.',
              ].join('\n\n'),
            },
            {
              id: 'tbi-s04-lucid-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Fine now does not mean fine',
              body: 'After a head strike, a person can seem completely fine while a slow bleed builds pressure inside the skull. The lucid interval is the deceptive "fine" period — watch the hours after every head strike.',
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
            { id: 'tbi-s05-heading', type: 'heading', level: 1, text: 'Signs & Symptoms' },
            {
              id: 'tbi-s05-hero-image',
              type: 'image',
              src: `${ASSET_BASE}/s05-hero.jpg`,
              caption:
                'Delayed danger signs after a head strike, and the lasting effects of an old TBI.',
            },
            {
              id: 'tbi-s05-narration',
              type: 'text',
              body: [
                'This course asks you to watch for two different sets of signs — the delayed dangers after a head strike, and the lasting effects of an old injury. Let\'s learn both.',
                '**Right after a head strike**',
                'When a resident hits their head, some signs call for emergency help immediately: loss of consciousness, even brief. Seizure. Repeated vomiting. Confusion or unusual behavior right away. Blood or clear fluid from the nose or ears. Unequal pupils. But hear this clearly — the absence of these signs does not mean the resident is safe. Many serious bleeds start with a resident who looks perfectly fine. Every head strike gets reported, every time, fine-looking or not.',
                '**The delayed danger signs**',
                'Now the heart of this course — the signs that appear hours or even days after a head injury, as a slow bleed builds pressure. Increasing drowsiness, or trouble waking the resident. Growing confusion, or behavior that isn\'t their normal. A headache that worsens instead of fading. Nausea or vomiting that starts later. New trouble speaking, new weakness on one side, new unsteadiness. In an older adult, these can creep in quietly — a resident who "just seems off" or "keeps napping" after yesterday\'s fall. Any of these after a head strike means get help immediately.',
                '**The blood thinner multiplier**',
                'And remember the multiplier: blood thinners. A resident on warfarin, apixaban, or similar medications can bleed seriously inside the skull from a bump that looks trivial. For these residents, a head strike of any size is urgent from the first moment — reported immediately, monitored closely. If you\'ve taken our stroke or heart courses, you\'ve heard this rule before. It\'s repeated because it saves lives.',
                '**The lasting effects of an old TBI**',
                'For residents living with an old brain injury, the signs are different — and they\'re daily, not emergencies. Memory gaps, especially for recent things. Slowed thinking — needing extra time to process what you say. Trouble concentrating. Headaches and dizziness. Irritability and a short fuse, mood swings, impulsive actions, sometimes words or behavior that seem rude or inappropriate. Watch also for the fatigue pattern: as the day wears on and the injured brain tires, all of these get worse.',
                '**Summary**',
                'Two pictures. After any head strike: report it immediately, then watch the hours — increasing drowsiness, growing confusion, worsening headache, vomiting, new weakness — these mean emergency. Living with an old TBI: memory trouble, slow processing, irritability, impulsiveness, mood swings — these mean skilled, patient daily care.',
                'The rule underneath it all: a head injury is never "nothing" until the nurse and time have proven it — and a TBI resident\'s hardest behaviors are symptoms, not character.',
              ].join('\n\n'),
            },
            {
              id: 'tbi-s05-delayed-callout',
              type: 'callout',
              variant: 'warning',
              title: 'Watch for delayed danger',
              body: 'Increasing drowsiness, growing confusion, a worsening headache, or vomiting hours after a head strike mean emergency — not tiredness. Fine now does not mean fine.',
            },
          ]),
      },
      {
        slug: 's06-causes',
        title: 'Causes',
        sortOrder: 1,
        buildContent: () =>
          doc('Causes', [
            { id: 'tbi-s06-heading', type: 'heading', level: 1, text: 'Causes' },
            pendingAudio(
              'tbi-s06-audio',
              'What Causes TBI — and Why Falls Rule Long-Term Care',
              `${ASSET_BASE}/s06-causes-podcast.mp3`,
              [
                'What Causes TBI — and Why Falls Rule Long-Term Care',
                '',
                'Traumatic brain injuries come from outside forces. Across the whole population, the causes include falls, motor vehicle crashes, being struck by objects, assaults, and sports injuries. Many younger TBI survivors — some of whom now live in long-term care — were injured in car or motorcycle crashes, workplace accidents, or assaults years ago.',
                '',
                'But in long-term care, one cause stands above all others: falls. Falls are the leading cause of TBI overall, and among older adults they dominate completely. A fall from standing height — simply tipping over and striking the head on the floor, a counter, or furniture — is enough to cause a serious brain injury in an older adult. Falls in bathrooms, falls getting out of bed, falls during transfers, falls while walking: every one of them carries head-injury potential.',
                '',
                'Why are older adults so vulnerable to brain injury from falls? Several reasons stack together. The aging brain shrinks slightly inside the skull, stretching the small bridging veins that cross the gap — stretched veins tear more easily, even in minor impacts. Blood vessels become more fragile with age. Blood-thinning medications, which many residents take for heart conditions, mean that once bleeding starts, it doesn\'t stop easily — turning minor tears into major bleeds. Balance problems, weakness, vision changes, and medications that cause dizziness make the falls themselves more likely. And slower healing means worse outcomes from the same injury.',
                '',
                'There\'s a vicious cycle worth knowing: a TBI causes dizziness and balance problems, which cause more falls, which cause more head injuries. Residents with a prior brain injury are at higher risk of the next one.',
                '',
                'Here\'s what this means for the CNA, and it\'s empowering: because falls cause most TBIs, fall prevention is brain injury prevention. Every cleared walkway, every answered call light, every supervised transfer, every pair of proper footwear, every brake set on a wheelchair is directly protecting a resident\'s brain. The same daily fall-prevention work you already do is the single most powerful TBI prevention that exists.',
              ].join('\n'),
              `${ASSET_BASE}/s06-causes-podcast.mp3`,
            ),
            {
              id: 'tbi-s06-hero-image',
              type: 'image',
              src: `${ASSET_BASE}/s06-hero.jpg`,
              caption: 'Falls cause most TBIs in long-term care — fall prevention is brain protection.',
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
              id: 'tbi-s07-heading',
              type: 'heading',
              level: 1,
              text: 'CNA Role & Best Practices',
            },
            {
              id: 'tbi-s07-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of practice',
              body: 'CNAs REPORT, WATCH, and SUPPORT. CNAs never assess, medicate, or decide a head bump was "nothing."',
            },
            {
              id: 'tbi-s07-hero-image',
              type: 'image',
              src: `${ASSET_BASE}/s07-hero.jpg`,
              caption: 'Report every head strike, watch the hours, and know your scope.',
            },
            {
              id: 'tbi-s07-narration',
              type: 'text',
              body: [
                'TBI treatment belongs to doctors, nurses, and therapists — but the CNA\'s observation in the hours after an injury, and steady support in the years after, are woven into all of it. Let\'s walk through it, starting as always with the rule that never bends. A CNA does not give or adjust any medication, does not perform neurological assessments, and never decides on their own that a head injury was "nothing."',
                '**The emergency response and the watch.** When a head strike is serious — or becomes serious — emergency treatment happens at the hospital: scans to find bleeding, and sometimes surgery to relieve pressure. Your part comes before that: reporting the injury immediately, and watching. After any head strike, the nurse will assess the resident and typically begin neuro checks — repeated checks of alertness, pupils, movement, and speech over the following hours. Your role between those checks is golden: you\'re with the resident more than anyone, so you watch for the delayed signs — increasing drowsiness, growing confusion, worsening headache, vomiting — and report any change immediately. Never assume the nurse "already knows." Say it every time.',
                '**Blood thinners — the standing red flag.** For any resident on blood-thinning medication, a head strike of any size is urgent. Report it immediately and say the words "they\'re on a blood thinner" in your report — it changes how fast everything moves. You never hold, give, or adjust the blood thinner; you make sure the team knows instantly.',
                '**Medications for lasting TBI effects.** Residents living with an old TBI may take medications for the effects: anti-seizure medications, because TBI raises seizure risk — and a missed dose gets reported immediately, as you learned in our seizure course. Medications for mood, behavior, sleep, or headaches. Your role: observe and report — drowsiness, dizziness, and unsteadiness raise fall risk; mood and behavior changes guide the doctor\'s decisions. You never give or adjust any of it.',
                '**Therapy and structure.** Physical, occupational, and speech therapists work on balance, daily skills, thinking strategies, and communication. You reinforce what they assign — memory aids, routines, techniques — and never invent therapy on your own. And remember that the most powerful daily "treatment" for an injured brain costs nothing: structure, routine, calm, and rest, delivered by you.',
                'The scope point for this section: report every head strike immediately, watch the hours like a hawk, flag blood thinners by name, support the medications and therapy without ever touching a dose — and never let "they seem fine" close the case.',
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
            { id: 'tbi-s08-heading', type: 'heading', level: 1, text: 'Prevention & Risk Reduction' },
            {
              id: 'tbi-s08-hero-image',
              type: 'image',
              src: `${ASSET_BASE}/s08-hero.jpg`,
              caption: 'Seven ways to prevent head injuries and protect brains already injured.',
            },
            {
              id: 'tbi-s08-narration',
              type: 'text',
              body: [
                'With TBI, prevention has two sides: preventing the head injuries themselves, and protecting the brains already injured. Here are seven ways.',
                '**One. Treat fall prevention as brain protection.** Falls cause most brain injuries. Clear and light the pathways, answer call lights fast, set wheelchair brakes, provide proper non-slip footwear, and supervise the transfers and walks the care plan calls for. Every fall you prevent is a brain you protect.',
                '**Two. Know your highest-risk residents.** Residents on blood thinners, residents with previous falls or a previous brain injury, and residents with dizziness or unsteady walking carry the highest stakes. Know who they are, watch them closest, and report new unsteadiness promptly.',
                '**Three. Report every head strike — and the unwitnessed fall.** A resident found on the floor may have hit their head even if no one saw it, and even if they say they didn\'t. Report every fall and every head bump, witnessed or not, "fine" or not. Let the nurse and time decide what it was.',
                '**Four. Watch the hours after.** After any head strike, stay alert through your shift for the delayed signs — increasing drowsiness, growing confusion, worsening headache, vomiting, new weakness — and pass the watch to the next shift in your report, so the vigilance doesn\'t end when your shift does.',
                '**Five. Give the injured brain structure and routine.** For residents with lasting TBI effects, predictability is power. Keep daily routines consistent — same times, same order, same approach. A brain that knows what\'s coming next spends less energy and functions better. Tell the resident what\'s happening before you do it.',
                '**Six. Keep instructions simple and the environment calm.** One instruction at a time, in short sentences, with time to process before the next. Reduce noise and commotion — turn down the TV during care, avoid crowded chaotic moments. An overstimulated injured brain overloads, and overload comes out as confusion or outbursts.',
                '**Seven. Protect rest and pace the day.** Cognitive fatigue makes everything worse — memory, mood, behavior. Schedule demanding tasks for the resident\'s freshest hours, build in quiet rest, and recognize the afternoon fade as the injury, not attitude. A rested brain is a calmer, safer, more capable brain.',
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
              id: 'tbi-s09-heading',
              type: 'heading',
              level: 1,
              text: 'Scenario & Reporting',
            },
            pendingAudio(
              'tbi-s09-intro-audio',
              'Emergency response scenarios intro',
              `${ASSET_BASE}/s09-emergency-intro.mp3`,
              'With head injuries, the two judgments that save lives are refusing to let a "fine-looking" head strike go unreported, and recognizing the delayed signs that mean a hidden bleed. You\'re about to work through two situations. Read each carefully, choose your action, and you\'ll get feedback right away. Keep the course rule front of mind: fine now does not mean fine.',
              `${ASSET_BASE}/s09-emergency-intro.mp3`,
            ),
            {
              id: 'tbi-s09-hero-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-hero.jpg`,
              caption:
                'Two head-injury situations: delayed bleeding and the resident who insists they are fine.',
            },
            {
              id: 'tbi-s09-scenario-whitfield-img',
              type: 'image',
              src: `${ASSET_BASE}/s09-scenario-whitfield.jpg`,
              caption: 'Mr. Whitfield — CNA observes resident after head bump',
            },
            {
              id: 'tbi-s09-scenario-whitfield',
              type: 'scenario_question',
              prompt:
                'Mr. Whitfield, who takes a blood thinner, slipped in his bathroom this morning and bumped his head on the sink. He was checked, seemed fine, and the nurse began periodic checks. It\'s now five hours later. You find him unusually drowsy — he keeps drifting off mid-sentence and is hard to keep awake. He\'s confused about where he is, says his headache is "much worse," and he has just vomited. What is the BEST action?',
              options: [
                {
                  id: 'let-nap',
                  label: 'Let him nap — he\'s had a stressful day',
                  feedback:
                    'These are the delayed signs of a brain bleed — drowsiness, confusion, worsening headache, and vomiting, hours after a head strike, on a blood thinner. Letting him nap, medicating the headache, or leaving it for the next shift could be fatal; the drowsiness is pressure on the brain, not tiredness. The right action: get emergency help immediately, stay with him, and report the full timeline including the blood thinner.',
                },
                {
                  id: 'emergency-now',
                  label: 'Recognize these as delayed signs of bleeding in the skull and get emergency help immediately',
                  feedback:
                    'Exactly right. Increasing drowsiness, growing confusion, a worsening headache, and vomiting — hours after a head strike, in a resident on a blood thinner — are the classic delayed signs of bleeding building pressure inside the skull. This is a life-threatening emergency, and the morning\'s "he seemed fine" was the lucid interval, not safety. Get emergency help immediately, stay with him, and report the timeline: when he fell, when the changes started, and that he\'s on a blood thinner. Never medicate, never wait, never let him "sleep it off" — sleepiness here is the brain failing, not resting.',
                  isRecommended: true,
                },
                {
                  id: 'headache-medicine',
                  label: 'Give him something for the headache and recheck in an hour',
                  feedback:
                    'These are the delayed signs of a brain bleed — drowsiness, confusion, worsening headache, and vomiting, hours after a head strike, on a blood thinner. Letting him nap, medicating the headache, or leaving it for the next shift could be fatal; the drowsiness is pressure on the brain, not tiredness. The right action: get emergency help immediately, stay with him, and report the full timeline including the blood thinner.',
                },
                {
                  id: 'evening-shift',
                  label: 'Note it in the chart for the evening shift',
                  feedback:
                    'These are the delayed signs of a brain bleed — drowsiness, confusion, worsening headache, and vomiting, hours after a head strike, on a blood thinner. Letting him nap, medicating the headache, or leaving it for the next shift could be fatal; the drowsiness is pressure on the brain, not tiredness. The right action: get emergency help immediately, stay with him, and report the full timeline including the blood thinner.',
                },
              ],
              requiredForCompletion: true,
            },
            {
              id: 'tbi-s09-scenario-okafor-img',
              type: 'image',
              src: `${ASSET_BASE}/s09-scenario-okafor.jpg`,
              caption: 'Ms. Okafor — resident appears fine after fall, report anyway',
            },
            {
              id: 'tbi-s09-scenario-okafor',
              type: 'scenario_question',
              prompt:
                'You hear a thud and find Mrs. Okafor sitting on the floor beside her bed. She tells you she "slid down easy" and "maybe tapped" her head on the nightstand, but insists she\'s fine: "Don\'t make a fuss, dear — don\'t bother the nurse over nothing." She looks completely normal, is talking clearly, and wants to get up and carry on. What SHOULD the CNA do?',
              options: [
                {
                  id: 'respect-wishes',
                  label: 'Respect her wishes and not report it since she seems fine',
                  feedback:
                    'Every fall with a possible head strike is reported immediately — even when the resident looks fine and asks you not to. A minor bump in an older adult can hide a slow bleed that turns dangerous hours later, and keeping it quiet removes the safety net of nurse assessment and monitoring. The right action: report it to the nurse immediately, kindly explaining to Mrs. Okafor that her safety requires it.',
                },
                {
                  id: 'report-immediately',
                  label: 'Report the fall and possible head strike to the nurse immediately, even though she seems fine',
                  feedback:
                    'Right. Every fall and every possible head strike is reported immediately — no matter how fine the resident looks, and even when they ask you not to. A "tapped" head can hide a slow bleed that builds over hours, especially in an older adult, and "she seemed fine" is exactly how the lucid interval fools people. Be kind about it — "I hear you, but my job is to keep you safe, so the nurse needs to take a quick look" — follow your facility\'s fall procedure before moving her, and report exactly what you found and what she said. Reporting isn\'t a fuss. It\'s the safety net.',
                  isRecommended: true,
                },
                {
                  id: 'keep-quiet',
                  label: 'Help her up quickly and keep it between the two of you',
                  feedback:
                    'Every fall with a possible head strike is reported immediately — even when the resident looks fine and asks you not to. A minor bump in an older adult can hide a slow bleed that turns dangerous hours later, and keeping it quiet removes the safety net of nurse assessment and monitoring. The right action: report it to the nurse immediately, kindly explaining to Mrs. Okafor that her safety requires it.',
                },
                {
                  id: 'wait-doctor',
                  label: 'Tell her to mention it to the doctor at next month\'s visit',
                  feedback:
                    'Every fall with a possible head strike is reported immediately — even when the resident looks fine and asks you not to. A minor bump in an older adult can hide a slow bleed that turns dangerous hours later, and keeping it quiet removes the safety net of nurse assessment and monitoring. The right action: report it to the nurse immediately, kindly explaining to Mrs. Okafor that her safety requires it.',
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
            { id: 'tbi-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
              id: 'tbi-s10-video',
              type: 'video',
              title: "CNA's Role in Care",
              videoUrl: `${ASSET_BASE}/s10-cna-role.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s10-cna-role.mp4`,
            },
            {
              id: 'tbi-s10-hero-image',
              type: 'image',
              src: `${ASSET_BASE}/s10-hero.jpg`,
              caption:
                'The CNA reports, watches, stays calm, and builds structured days for TBI residents.',
            },
            {
              id: 'tbi-s10-narration',
              type: 'text',
              body: [
                'Your role in TBI care spans the urgent hours after an injury and the patient years of living with one. Let\'s walk through it.',
                '**Report, every time** First, the unbendable habit: report every head strike, every fall, every found-on-the-floor — immediately, no matter how fine the resident seems, no matter how much they wave it off. Include what you saw, what they told you, and whether they\'re on a blood thinner. You are the trigger for the nurse\'s assessment and the neuro checks. Without your report, the safety net never opens.',
                '**Watch the hours** Then, be the watcher. In the hours after a head strike, you see the resident more than anyone. Watch for the delayed signs — drowsiness that deepens, confusion that grows, a headache that worsens, vomiting, new weakness or unsteadiness. Report any change instantly, and hand the watch to the next shift explicitly: "He hit his head at nine this morning — keep watching him." Vigilance that ends at shift change is vigilance with a hole in it.',
                '**Never take the behavior personally** For residents living with an old TBI, master the most professional skill in this course: the behavior is the injury, not the person — and not about you. When a resident snaps, blurts something rude, or erupts over something small, stay calm and steady. Don\'t argue, don\'t scold, don\'t punish, don\'t take the bait. Lower the stimulation, give them space and a moment, then redirect gently. Your calm is the thermostat in the room — an injured brain borrows its regulation from yours.',
                '**Structure, simplicity, and dignity** And build the days that injured brains do best in: consistent routines, the same order, the same approach. One simple instruction at a time, with time to process. A calm, low-noise environment. Rest before the fatigue wall. Memory supports the therapists recommend. And through all of it, full adult dignity — many TBI residents are young, aware, and grieving the person they were. Treat the person, not the injury.',
                'Now the boundary. You do not diagnose head injuries or perform neuro checks — the nurse assesses; you observe and report. You do not give or adjust any medication. You do not perform therapy on your own. And you never — ever — decide a head bump was "nothing."',
                'Inside your role — report every strike, watch the hours, stay calm through the storms, and build structured, dignified days — you protect residents at their most vulnerable moments and lift the lives of those carrying old injuries. Both halves are life-changing work.',
              ].join('\n\n'),
            },
            {
              id: 'tbi-s10-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Stay within scope',
              body: 'You do not diagnose head injuries or perform neuro checks. You do not give or adjust any medication. You do not perform therapy on your own. And you never decide a head bump was "nothing."',
            },
          ]),
      },
      {
        slug: 's11-case-study',
        title: 'Case Study',
        sortOrder: 2,
        buildContent: () => {
          const caseNarrative = [
            'Mr. Whitfield, 82, was a proud, independent man who took apixaban — a blood thinner — for his heart. His CNA, Katya, had cared for him for a year and knew his sharp wit and his habit of refusing "any fuss."',
            '',
            '**The fall:** One morning, Katya heard a bump and found Mr. Whitfield steadying himself against the bathroom doorframe. He admitted he\'d slipped and "grazed" his head on the doorframe — "barely a tap, don\'t you dare bother anyone." He was steady, clear, joking about his own clumsiness. He looked completely fine.',
            '',
            '**What Katya did anyway:** Katya reported it immediately — kindly but without negotiation. "I hear you, Mr. Whitfield, but a head tap plus your blood thinner means the nurse takes a look. That\'s the deal." She told the nurse exactly what happened, what he said, and — in the same breath — that he was on apixaban. The nurse assessed him, found nothing alarming, and started periodic checks, asking staff to keep watching him.',
            '',
            '**The watch:** Katya watched. Through the morning, he was himself — breakfast, crossword, complaints about the coffee. After lunch, around five hours after the fall, something shifted. He skipped his usual hallway walk, saying he was "worn out." By two o\'clock she found him asleep in his recliner — not unusual by itself — but when she woke him to offer water, he was foggy, asked her the same question twice, and drifted back off mid-sentence. His "nap" wasn\'t restful; it was pulling him under.',
            '',
            '**The recognition:** Katya put it together: head strike this morning, blood thinner, and now deepening drowsiness with new confusion. The lucid interval was closing. She didn\'t tell herself he was just tired. She alerted the nurse immediately: "Mr. Whitfield is much drowsier than his normal, confused, hard to keep awake — five hours after this morning\'s head strike, and he\'s on apixaban." The nurse\'s check confirmed deterioration; emergency services were activated.',
            '',
            '**The outcome:** At the hospital, a scan found a subdural hematoma — a slow bleed pressing on his brain. Because it was caught while he was drowsy rather than unresponsive, it was treated in time, and Mr. Whitfield recovered. The nurse later told Katya: "He looked fine at nine. If you\'d let that \'nap\' be a nap, we\'d have found him too late. The morning report started the watch — and the afternoon call saved him."',
            '',
            '**Discussion:** Katya made two decisions, hours apart, and both were the course in action. First, she reported a "barely a tap" head strike from a resident who begged her not to — because every head strike gets reported, and blood thinners get said out loud. Second, she refused to explain away the afternoon change — drowsiness plus confusion after a morning head strike isn\'t tiredness, it\'s the delayed sign of a bleed. She never assessed, never diagnosed, never gave anything. She reported, watched, and reported again — and that was everything.',
          ].join('\n');

          return doc('Brief Case Study', [
            { id: 'tbi-s11-heading', type: 'heading', level: 1, text: 'Brief Case Study' },
            pendingAudio(
              'tbi-s11-audio',
              "The Nap That Wasn't a Nap",
              `${ASSET_BASE}/s11-case-podcast.mp3`,
              caseNarrative,
              `${ASSET_BASE}/s11-case-podcast.mp3`,
            ),
            {
              id: 'tbi-s11-hero-image',
              type: 'image',
              src: `${ASSET_BASE}/s11-hero.jpg`,
              caption: 'The nap that was not a nap — lucid interval and faithful reporting.',
            },
            {
              id: 'tbi-s11-case-study',
              type: 'case_study',
              title: "The Nap That Wasn't a Nap",
              residentProfile:
                'Mr. Whitfield, 82, was a proud, independent man who took apixaban — a blood thinner — for his heart. His CNA, Katya, had cared for him for a year and knew his sharp wit and his habit of refusing "any fuss."',
              scenario: [
                '**The fall:** One morning, Katya heard a bump and found Mr. Whitfield steadying himself against the bathroom doorframe. He admitted he\'d slipped and "grazed" his head on the doorframe — "barely a tap, don\'t you dare bother anyone." He was steady, clear, joking about his own clumsiness. He looked completely fine.',
                '**What Katya did anyway:** Katya reported it immediately — kindly but without negotiation. "I hear you, Mr. Whitfield, but a head tap plus your blood thinner means the nurse takes a look. That\'s the deal." She told the nurse exactly what happened, what he said, and — in the same breath — that he was on apixaban. The nurse assessed him, found nothing alarming, and started periodic checks, asking staff to keep watching him.',
                '**The watch:** Katya watched. Through the morning, he was himself — breakfast, crossword, complaints about the coffee. After lunch, around five hours after the fall, something shifted. He skipped his usual hallway walk, saying he was "worn out." By two o\'clock she found him asleep in his recliner — not unusual by itself — but when she woke him to offer water, he was foggy, asked her the same question twice, and drifted back off mid-sentence. His "nap" wasn\'t restful; it was pulling him under.',
                '**The recognition:** Katya put it together: head strike this morning, blood thinner, and now deepening drowsiness with new confusion. The lucid interval was closing. She didn\'t tell herself he was just tired. She alerted the nurse immediately: "Mr. Whitfield is much drowsier than his normal, confused, hard to keep awake — five hours after this morning\'s head strike, and he\'s on apixaban." The nurse\'s check confirmed deterioration; emergency services were activated.',
                '**The outcome:** At the hospital, a scan found a subdural hematoma — a slow bleed pressing on his brain. Because it was caught while he was drowsy rather than unresponsive, it was treated in time, and Mr. Whitfield recovered. The nurse later told Katya: "He looked fine at nine. If you\'d let that \'nap\' be a nap, we\'d have found him too late. The morning report started the watch — and the afternoon call saved him."',
                '**Discussion:** Katya made two decisions, hours apart, and both were the course in action. First, she reported a "barely a tap" head strike from a resident who begged her not to — because every head strike gets reported, and blood thinners get said out loud. Second, she refused to explain away the afternoon change — drowsiness plus confusion after a morning head strike isn\'t tiredness, it\'s the delayed sign of a bleed. She never assessed, never diagnosed, never gave anything. She reported, watched, and reported again — and that was everything.',
              ].join('\n\n'),
            },
            {
              id: 'tbi-s11-reflection-1',
              type: 'reflection',
              prompt:
                'Mr. Whitfield looked completely fine at nine in the morning and was deteriorating by two. How does the "lucid interval" fool caregivers, and what protects against it?',
              minCharacters: 50,
            },
            {
              id: 'tbi-s11-reflection-2',
              type: 'reflection',
              prompt:
                'Katya reported the fall even though Mr. Whitfield insisted she shouldn\'t "bother anyone." Why must a CNA report every head strike — even over a resident\'s objection — and how can it be done while preserving the relationship?',
              minCharacters: 50,
            },
            {
              id: 'tbi-s11-reflection-intro-text',
              type: 'text',
              body: 'Reflect on the case study in the previous lesson. Your written responses help you apply what you learned about reporting every head strike, watching for delayed signs, and recognizing the lucid interval.',
            },
            {
              id: 'tbi-s11-kc2-check',
              type: 'knowledge_check',
              question:
                'A CNA does not give or adjust any medication, does not perform neurological assessments, and never decides on their own that a head injury was "nothing." When a resident bumps their head but seems completely fine, the CNA SHOULD:',
              options: [
                {
                  id: 'decide-nothing',
                  label: 'Decide it was nothing and not report it',
                },
                {
                  id: 'report-nurse',
                  label: 'Report the head strike to the nurse immediately and watch for delayed signs',
                },
                {
                  id: 'perform-neuro',
                  label: 'Perform a neurological assessment to check pupils and alertness',
                },
                {
                  id: 'give-pain-med',
                  label: 'Give pain medication for the bump',
                },
              ],
              correctOptionId: 'report-nurse',
              explanation:
                'Report every head strike immediately — no matter how fine the resident seems. Watch for delayed signs in the hours after. You never assess, medicate, or decide a head bump was "nothing."',
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
            { id: 'tbi-s12-heading', type: 'heading', level: 1, text: 'Conclusion' },
            {
              id: 'tbi-s12-video',
              type: 'video',
              title: 'Conclusion',
              videoUrl: `${ASSET_BASE}/s12-conclusion.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s12-conclusion.mp4`,
            },
            {
              id: 'tbi-s12-hero-image',
              type: 'image',
              src: `${ASSET_BASE}/s12-hero.jpg`,
              caption: 'Five things that matter most for traumatic brain injury.',
            },
            {
              id: 'tbi-s12-narration',
              type: 'text',
              body: [
                'You\'ve reached the end. Let\'s lock in the five things that matter most for traumatic brain injury.',
                '**One.** A TBI is an outside force injuring the soft brain inside the hard skull — and in long-term care, falls cause most of them, with elderly residents the most vulnerable of all. Fall prevention is brain protection.',
                '**Two.** Fine now does not mean fine. A head strike can look harmless while a slow bleed builds pressure over hours — the lucid interval. Report every head strike and every fall immediately, witnessed or not, "fine" or not, even over the resident\'s objection.',
                '**Three.** Watch the hours, and know the delayed signs. Increasing drowsiness, growing confusion, a worsening headache, vomiting, new weakness — after a head strike, these mean emergency, not tiredness. And blood thinners multiply everything: say them out loud in every head-strike report.',
                '**Four.** For residents living with an old TBI: the behavior is the injury, not the person. Meet irritability, outbursts, and impulsiveness with calm, not correction. Give the injured brain what it does best with — routine, one simple instruction at a time, low noise, real rest, and full adult dignity.',
                '**Five.** Honor your scope. You never diagnose, never perform neuro checks, never give medications, and never decide a head bump was "nothing." You report every strike, watch the hours, stay calm through the storms, and report every change. That role, done faithfully, saves lives.',
              ].join('\n\n'),
            },
            {
              id: 'tbi-s12-summary',
              type: 'summary',
              title: 'Five things that matter most',
              items: [
                'A TBI is an outside force injuring the brain — in long-term care, falls cause most of them.',
                'Fine now does not mean fine — report every head strike immediately, even over the resident\'s objection.',
                'Watch the hours — increasing drowsiness, confusion, headache, vomiting mean emergency after a head strike.',
                'For lasting TBI effects: the behavior is the injury — meet it with calm, routine, and dignity.',
                'Honor your scope — report, watch, and support; never assess, medicate, or decide a head bump was "nothing."',
              ],
            },
            {
              id: 'tbi-s12-whn-text',
              type: 'text',
              body: 'Ten questions are waiting. Everything on them was covered here. You\'re ready. Trust what you\'ve learned, and show what you know.',
            },
            {
              id: 'tbi-s12-completion-text',
              type: 'text',
              body: 'This course provides one hour of continuing education credit through CAL ACE Nursing Academy, an approved CDPH continuing education provider, NAC number 7384. Your certificate is generated automatically when you pass the knowledge check.',
            },
            {
              id: 'tbi-s12-completion-callout',
              type: 'callout',
              variant: 'info',
              title: 'Scope reminder',
              body: 'CNAs report, watch, and support. CNAs do not diagnose brain injuries, perform neurological assessments, give medications, or decide a head bump was "nothing."',
            },
            {
              id: 'tbi-s12-certificate-text',
              type: 'text',
              body: 'Your certificate is generated automatically when you pass the knowledge check. CDPH-Approved CE Provider — NAC #7384.',
            },
          ]),
      },
    ],
  },
];

export async function seedCourse24TraumaticBrainInjury(
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
  console.log(`Seeding Course 24 (Traumatic Brain Injury) as DRAFT — slug "${COURSE_SLUG}"…`);

  try {
    const result = await seedCourse24TraumaticBrainInjury(prisma);
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
