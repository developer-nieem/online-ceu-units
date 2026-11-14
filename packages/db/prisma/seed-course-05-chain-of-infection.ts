/**
 * Seed Course 5 — The Chain of Infection & Standard Precautions (DRAFT).
 *
 * V3 rebuild of the former "Infection Control for CNAs", reframed to the foundational
 * science (the chain of infection) and the universal practice (standard precautions).
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-05-chain-of-infection
 *
 * Idempotent upserts by slug. Self-cleans stray modules on the target DRAFT version.
 * Does not seed the final quiz (pending owner approval; see the -exam.ts file).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CONFIRMED against the live DB (read-only inspection):
 *   COURSE_SLUG    = 'infection-control'  (FROZEN — course already live)
 *   VERSION_NUMBER = 2                    (MAX existing version is v1 PUBLISHED with
 *                                          real content; this creates v2 as a new
 *                                          DRAFT revision, leaving v1 intact)
 * NOTE: a SEPARATE course 'infection-control-prevention' also exists in the DB — it
 * is NOT this course's target and must not be touched.
 * Only the DISPLAY TITLE changes — NOT the slug.
 * DRAFT-only. Run order: this main seed first, then the -exam seed.
 *
 * SCOPE: CNAs practice hand hygiene, standard precautions, PPE, safe handling, and
 * recognize/report infection. CNAs do NOT diagnose infections, prescribe/treat, or
 * decide isolation/precaution orders — those come from the nurse and care plan.
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
const COURSE_SLUG = 'infection-control';

// Display title changes to the chain/precautions framing; slug stays frozen above.
const COURSE_TITLE = 'Breaking the Infection Cycle: Standard Precautions for CNAs';
const COURSE_SUMMARY =
  'Break the chain of infection: understand the six links a germ needs to spread and how to break them, practice hand hygiene as the #1 defense, apply standard precautions to every resident, use PPE correctly (use, order, removal), handle linens/waste/spills safely, and recognize and report signs of infection — including the subtle signs in elders.';

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
    'Understand the chain of infection and how breaking any one link stops spread',
    'Perform hand hygiene correctly — the single most important infection-control practice',
    'Apply standard precautions to every resident, every time',
    'Use PPE properly, including correct order of removal, and handle linens/waste/spills safely',
    'Recognize and report signs of infection, including the subtle signs in elders',
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
  heroImage: '/assets/courses/chain-of-infection/hero-banner.jpg',
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
    title: 'The Chain of Infection & Hand Hygiene',
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: 'Introduction',
        sortOrder: 0,
        buildContent: () =>
          doc('Introduction', [
            { id: 'inf-s01-heading', type: 'heading', level: 1, text: 'Introduction' },
            {
              id: 'inf-s01-video',
              type: 'video',
              title: 'Introduction',
              videoUrl: '/assets/courses/chain-of-infection/s01-intro.mp4',
              placeholderNote: 'Pending upload: /assets/courses/chain-of-infection/s01-intro.mp4',
            },
            {
              id: 'inf-s01-hero-image',
              type: 'image',
              src: '/assets/courses/chain-of-infection/s01-hero.jpg',
              caption: 'A CAL ACE CNA on a long-term care unit.',
            },
            {
              id: 'inf-s01-handwash-image',
              type: 'image',
              src: '/assets/courses/chain-of-infection/s01-handwash.jpg',
              caption: 'Hand hygiene — the single most important infection-control practice.',
            },
            {
              id: 'inf-s01-narration',
              type: 'text',
              body: [
                'Welcome to CAL ACE Nursing Academy.',
                'This course is about infection control — and it\'s one of the most important you\'ll ever take, because the things you do to stop the spread of infection protect every resident, every coworker, and you. We\'ll build it on one simple, powerful idea: the chain of infection. Once you understand the chain, you understand exactly how to break it — and breaking the chain is the whole job.',
                'Here\'s the idea. For an infection to spread, several things must link together like a chain: a germ, a place it lives, a way out, a way to travel, a way in, and a person who can get sick. That\'s the chain of infection. And here\'s the empowering part — if you break even one link, the infection can\'t spread. Every infection-control action you take, from washing your hands to wearing gloves to handling laundry safely, is really just breaking a link in that chain. You are a chain-breaker.',
                'Why does this matter so much? Because healthcare-associated infections — infections that residents catch while receiving care — are common, serious, and often preventable. Your residents are especially vulnerable: older, often frail, with weaker immune systems and existing illnesses, living close together. An infection that a healthy person would shrug off can put an elderly resident in the hospital, or worse. And infections spread silently, hand to hand, surface to surface, before anyone sees symptoms. The good news: most spread is preventable, and prevention is overwhelmingly in the hands of the people giving daily care — you.',
                'The single most important thing in this entire course, and in all of infection control, is hand hygiene. Clean hands — washed with soap and water or cleaned with sanitizer at the right moments — prevent more infections than anything else in healthcare. It sounds almost too simple, but it is the truth: your hands are the most common way germs travel from one resident to another, and clean hands break that link every time.',
                'This course also teaches standard precautions — the set of basic protections you use with every resident, every time, no matter what. The principle behind them is important: you treat everyone\'s blood and body fluids as if they could carry infection, because you can\'t tell by looking who\'s infected, and many infections are invisible. Standard precautions protect everyone — your residents and you — without singling anyone out.',
                'The guiding spirit of this course: break the chain. Every clean pair of hands, every glove, every safely handled linen breaks a link and stops an infection that would otherwise spread.',
                'Your scope is clear. A CNA practices hand hygiene, applies standard precautions to every resident, uses PPE correctly, handles linens, waste, and spills safely, and recognizes and reports signs of infection. A CNA does not diagnose infections, does not prescribe or treat, and does not decide isolation or precaution orders — those come from the nurse and the care plan.',
                'By the end of this course, you will be able to: understand the chain of infection and how to break it. Perform hand hygiene correctly. Apply standard precautions to every resident. Use PPE properly. And recognize and report infection. Let\'s begin.',
              ].join('\n\n'),
            },
            {
              id: 'inf-s01-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'You are a chain-breaker',
              body: 'For infection to spread, six links must connect: germ, reservoir, way out, way to travel, way in, and a vulnerable person. Break even one link and the infection can\'t spread. Hand hygiene is your #1 defense. Standard precautions apply to every resident, every time.',
            },
          ]),
      },
      {
        slug: 's02-terms',
        title: 'Terms & Definitions',
        sortOrder: 1,
        buildContent: () =>
          doc('Terms & Definitions', [
            { id: 'inf-s02-heading', type: 'heading', level: 1, text: 'Terms & Definitions' },
            {
              id: 'inf-s02-hero-image',
              type: 'image',
              src: '/assets/courses/chain-of-infection/s02-hero.jpg',
              caption: 'Standard precautions and PPE protect every resident, every time.',
            },
            {
              id: 'inf-s02-reveal-chain',
              type: 'reveal_card',
              frontTitle: 'Chain of Infection',
              frontBody: 'Chain of infection',
              backTitle: 'Chain of Infection',
              backBody:
                'The series of links that must connect for an infection to spread: a germ, a place it lives, a way out, a way to travel, a way in, and a person who can get sick. The key idea: break any one link, and the infection cannot spread. Every infection-control action breaks a link in this chain.',
            },
            {
              id: 'inf-s02-reveal-pathogen',
              type: 'reveal_card',
              frontTitle: 'Pathogen',
              frontBody: 'PATH-oh-jen',
              backTitle: 'Pathogen',
              backBody:
                'A germ that can cause disease — a bacterium, virus, fungus, or other microbe. Pathogens are everywhere and usually invisible. Some cause mild illness, some serious. You can\'t tell by looking whether a germ or a person carries one, which is exactly why standard precautions are used with everyone.',
            },
            {
              id: 'inf-s02-reveal-hai',
              type: 'reveal_card',
              frontTitle: 'Healthcare-Associated Infection (HAI)',
              frontBody: 'Healthcare-associated infection (HAI)',
              backTitle: 'Healthcare-Associated Infection (HAI)',
              backBody:
                'An infection a resident catches while receiving care — not the illness they came in with. Common examples include urinary, respiratory, skin, and wound infections. HAIs are common, serious in frail elders, and largely preventable through the infection-control practices in this course.',
            },
            {
              id: 'inf-s02-reveal-hand-hygiene',
              type: 'reveal_card',
              frontTitle: 'Hand Hygiene',
              frontBody: 'Hand hygiene',
              backTitle: 'Hand Hygiene',
              backBody:
                'Cleaning your hands — with soap and water, or with alcohol-based hand sanitizer — at the right moments to remove germs. It is the single most important infection-control practice there is. Clean hands at the right times prevent more infections than anything else in healthcare. Hand hygiene is your number-one defense.',
            },
            {
              id: 'inf-s02-reveal-standard-precautions',
              type: 'reveal_card',
              frontTitle: 'Standard Precautions',
              frontBody: 'Standard precautions',
              backTitle: 'Standard Precautions',
              backBody:
                'The basic protections used with every resident, every time, no matter their diagnosis — because you treat all blood and body fluids as potentially infectious. They include hand hygiene, gloves and other PPE when needed, and safe handling of fluids, linens, and waste. Standard precautions protect everyone without singling anyone out.',
            },
            {
              id: 'inf-s02-reveal-ppe',
              type: 'reveal_card',
              frontTitle: 'PPE (Personal Protective Equipment)',
              frontBody: 'PPE — personal protective equipment',
              backTitle: 'PPE (Personal Protective Equipment)',
              backBody:
                'The gear that protects you and others from germs: gloves, gowns, masks, and eye protection. You use PPE based on the task and the risk of contact with blood or body fluids. Putting it on and especially taking it off in the right way and order is essential, so you don\'t contaminate yourself.',
            },
            {
              id: 'inf-s02-reveal-transmission',
              type: 'reveal_card',
              frontTitle: 'Transmission-Based Precautions',
              frontBody: 'Transmission-based precautions',
              backTitle: 'Transmission-Based Precautions',
              backBody:
                'Extra protections added on top of standard precautions for residents with certain known or suspected infections — based on how that germ spreads. You\'ll learn the specific types in other courses; here, just know these are extra steps the nurse and care plan direct, layered over the standard precautions you always use.',
            },
            {
              id: 'inf-s02-reveal-fomite',
              type: 'reveal_card',
              frontTitle: 'Fomite',
              frontBody: 'FOH-mite',
              backTitle: 'Fomite',
              backBody:
                'An object or surface that can carry germs from one person to another — bed rails, call lights, doorknobs, wheelchairs, equipment, shared items. Germs survive on fomites and spread when hands touch them and then touch a resident. Cleaning surfaces and equipment, and clean hands, break this route of spread.',
            },
            {
              id: 'inf-s02-knowledge-check',
              type: 'knowledge_check',
              question: 'What is the single most important infection-control practice?',
              options: [
                { id: 'hand-hygiene', label: 'Hand hygiene — clean hands at the right times' },
                { id: 'gown', label: 'Wearing a gown' },
                { id: 'windows', label: 'Opening windows' },
              ],
              correctOptionId: 'hand-hygiene',
              explanation:
                'Hand hygiene is the single most important infection-control practice there is. Your hands are the most common way germs travel between residents, so clean hands at the right moments break that link more often than anything else you do.',
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
            { id: 'inf-s03-heading', type: 'heading', level: 1, text: 'Statistics' },
            {
              id: 'inf-s03-hero-image',
              type: 'image',
              src: '/assets/courses/chain-of-infection/s03-hero.jpg',
              caption: 'A CAL ACE CNA providing reassuring, attentive care.',
            },
            {
              id: 'inf-s03-handwash-image',
              type: 'image',
              src: '/assets/courses/chain-of-infection/s03-handwash.jpg',
              caption: 'Clean hands are the number-one defense against infection.',
            },
            pendingAudio(
              'inf-s03-audio',
              'Breaking the Chain: Why a CNA\'s Clean Hands Save Lives',
              '/assets/courses/chain-of-infection/s03-stats-podcast.mp3',
              [
                'Breaking the Chain: Why a CNA\'s Clean Hands Save Lives',
                '',
                'Healthcare-associated infections — infections people catch while receiving care — are one of the most common complications in all of healthcare. Large numbers of patients and residents develop them every year, and in settings full of older, frailer people, the stakes are especially high. Elderly residents are uniquely vulnerable: aging weakens the immune system, chronic illnesses reduce the body\'s defenses, and people living close together in a facility share the same air, surfaces, and caregivers. An infection that a young healthy person would barely notice — a urinary infection, a skin infection, a respiratory bug — can send a frail elder into serious illness, hospitalization, or death. These infections are common, they are dangerous in this population, and crucially, a great many of them are preventable.',
                '',
                'What makes infection spread so dangerous is that it\'s largely invisible. Germs — pathogens — can\'t be seen, and the people carrying them often show no symptoms, especially early on. Infections move silently from hand to hand, from surface to surface, from one resident to the next, long before anyone looks sick. This is the reason for one of the most important ideas in healthcare: you can\'t tell by looking who is infected, so you protect against everyone\'s blood and body fluids as if they could spread infection. That principle — standard precautions for every resident, every time — is what protects people from the infections no one can see coming.',
                '',
                'The single most powerful tool against all of this is almost humbling in its simplicity: clean hands. Decades of evidence point to the same conclusion — hand hygiene is the most effective thing anyone in healthcare can do to prevent the spread of infection. Hands are the number-one way germs travel between residents; clean hands, at the right moments, break that route every time. The challenge isn\'t that hand hygiene is hard or complicated — it\'s that it must be done consistently, every single time it\'s needed, by everyone. And the people whose hands touch residents most, all day long, are CNAs. That places the most powerful infection-prevention tool in your hands, literally.',
                '',
                'Here\'s the empowering frame that organizes the whole topic: the chain of infection. For any infection to spread, a series of links must connect — a germ, a place it lives, a way out, a way to travel, a way in, and a vulnerable person. Break any single link, and the spread stops. Every infection-control practice a CNA performs is the breaking of a link: clean hands break the travel route, gloves and gowns block the exit and entry, cleaning surfaces removes the reservoir, safe linen and waste handling cuts off the escape. Research consistently shows that consistent basic infection control in care settings prevents a large share of these infections. The bottom line: healthcare-associated infections are common, serious in vulnerable elders, and largely preventable; they spread invisibly; hand hygiene is the number-one defense; standard precautions protect everyone; and the CNA who breaks the chain of infection prevents real, serious harm every shift.',
              ].join('\n'),
              '/assets/courses/chain-of-infection/s03-stats-podcast.mp3',
            ),
            {
              id: 'inf-s03-source-note',
              type: 'callout',
              variant: 'clinical',
              title: 'About these figures',
              body: 'This section describes healthcare-associated infections qualitatively (e.g., "one of the most common complications," "a great many are preventable") rather than citing specific numbers. Any precise statistic added later must come from a named, verifiable source (e.g., CDC / HAI prevention research) — not from estimation.',
            },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: 'Fundamentals',
        sortOrder: 3,
        buildContent: () =>
          doc('Fundamentals', [
            { id: 'inf-s04-heading', type: 'heading', level: 1, text: 'Fundamentals' },
            {
              id: 'inf-s04-video',
              type: 'video',
              title: 'Fundamentals',
              videoUrl: '/assets/courses/chain-of-infection/s04-fundamentals.mp4',
              placeholderNote: 'Pending upload: /assets/courses/chain-of-infection/s04-fundamentals.mp4',
            },
            {
              id: 'inf-s04-hero-image',
              type: 'image',
              src: '/assets/courses/chain-of-infection/s04-hero.jpg',
              caption: 'Performing hand hygiene correctly, every time.',
            },
            {
              id: 'inf-s04-soap-image',
              type: 'image',
              src: '/assets/courses/chain-of-infection/s04-soap-sanitizer.jpg',
              caption: 'Soap and water versus alcohol-based sanitizer.',
            },
            {
              id: 'inf-s04-narration',
              type: 'text',
              body: [
                '**The chain of infection, link by link**',
                'Here\'s the chain that everything rests on. First, a germ — the pathogen. Second, a reservoir — where it lives and grows, like a person, a surface, or water. Third, a way out — a portal of exit, such as blood, droplets from a cough, urine, or stool. Fourth, a way to travel — transmission, often by hands or contaminated surfaces. Fifth, a way in — a portal of entry, like the mouth, nose, eyes, or a break in the skin. And sixth, a vulnerable person — a susceptible host who can get sick. Six links. Connect them all, and infection spreads. That\'s the enemy you\'re up against.',
                '**The big idea: break ANY link**',
                'Now the empowering part: you don\'t have to break every link — breaking just one stops the spread. Clean your hands, and you break the travel route. Wear gloves, and you block the exit and the entry. Clean a surface, and you remove the reservoir. Cover a cough, and you close the portal of exit. Handle linen safely, and you cut the escape. Every single infection-control action you take is the deliberate breaking of a link in this chain. Once you see your work this way, infection control stops being a list of rules and becomes one clear mission: break the chain.',
                '**Hand hygiene: your number-one weapon**',
                'If you remember one thing forever, remember this: hand hygiene is the single most important infection-control practice there is. Your hands are the most common way germs travel between residents, so clean hands break that link more often than anything else you do. Two methods: soap and water — rub all surfaces vigorously for the time your facility teaches, then rinse and dry — and alcohol-based hand sanitizer, rubbed over all surfaces until dry. Both work; we\'ll cover when to use which. The power isn\'t in complexity — it\'s in doing it, correctly, every single time it\'s needed.',
                '**When to clean your hands**',
                'Knowing the moments matters as much as the method. Clean your hands: before and after touching any resident. Before putting on gloves and after taking them off — gloves are not a substitute for hand hygiene. After touching anything that might be contaminated — body fluids, soiled linens, waste, surfaces. Before and after any care task. After using the restroom, before eating, when you enter and leave a resident\'s room. When in doubt, clean them. These moments are exactly when germs would otherwise hitch a ride on your hands to the next resident.',
                '**Soap and water versus sanitizer**',
                'Both methods clean hands, but they\'re not always interchangeable, and knowing the difference matters. Alcohol-based sanitizer is fast, effective for most everyday situations, and gentle on hands. But use soap and water when your hands are visibly dirty or soiled with body fluids — and for certain germs that sanitizer doesn\'t kill well, like the one causing C. diff diarrhea, where soap and water are required. You\'ll meet that exception in another course; for now, hold the rule: when hands are visibly dirty or after certain infections, soap and water — otherwise, either works.',
                '**Standard precautions: protect against everyone**',
                'Standard precautions are the foundation you use with every resident, every time — no exceptions, no singling anyone out. The principle: treat all blood and body fluids — and broken skin and mucous membranes — as if they could carry infection, because you cannot tell by looking who is infected, and many infections hide. So you clean your hands, you wear gloves when you might contact blood or body fluids, you add a gown, mask, or eye protection when splashing is possible, and you handle fluids, linens, and waste safely — for everyone. This protects your residents and protects you, fairly and invisibly.',
                '**PPE basics: the right gear, the right way**',
                'PPE — gloves, gowns, masks, eye protection — protects you and others, but only when used right. Choose it based on the task: gloves for contact with body fluids or broken skin; add a gown, mask, or eye protection when splashes or sprays are possible. Putting it on has an order, and taking it off has a stricter one — because the outside of used PPE is contaminated. The golden rule of removal: take PPE off carefully, without touching the dirty outer surfaces to your skin, and clean your hands right after. Gloves are not a substitute for hand hygiene — you clean your hands before and after them, every time.',
              ].join('\n\n'),
            },
            {
              id: 'inf-s04-callout',
              type: 'callout',
              variant: 'warning',
              title: 'Gloves are NOT a substitute for hand hygiene',
              body: 'Clean your hands before AND after gloves, every time. Remove PPE without touching the contaminated outer surfaces, then clean your hands immediately. Use soap and water when hands are visibly soiled or after certain infections (like C. diff); sanitizer otherwise.',
            },
          ]),
      },
    ],
  },
  {
    slug: 'module-2',
    title: 'Recognizing Infection & Breaking the Chain',
    sortOrder: 1,
    lessons: [
      {
        slug: 's05-signs',
        title: 'Signs & Symptoms',
        sortOrder: 0,
        buildContent: () =>
          doc('Signs & Symptoms', [
            { id: 'inf-s05-heading', type: 'heading', level: 1, text: 'Signs & Symptoms' },
            {
              id: 'inf-s05-hero-image',
              type: 'image',
              src: '/assets/courses/chain-of-infection/s05-hero.jpg',
              caption: 'Observing residents closely helps catch infection early.',
            },
            {
              id: 'inf-s05-subtle-image',
              type: 'image',
              src: '/assets/courses/chain-of-infection/s05-subtle.jpg',
              caption: 'In elders, infection may show as new confusion or weakness.',
            },
            {
              id: 'inf-s05-narration',
              type: 'text',
              body: [
                'Catching an infection early — and reporting it — lets it be treated before it becomes serious. You\'re often the first to notice. Let\'s learn the signs.',
                '**The general signs of infection**',
                'Watch for the body\'s general signs of fighting infection. Fever — feeling hot, flushed, or a raised temperature — though remember, frail elders may run low-grade or even no fever. Chills or shivering. Feeling generally unwell, weak, tired, or "off." Sweating. Loss of appetite. A faster heartbeat or breathing. Any of these, especially together or as a change from the resident\'s normal, can mean an infection is brewing. You don\'t diagnose what it is — you notice that something\'s wrong and report it.',
                '**Signs at common infection sites**',
                'Infections often show where they start. Urinary infections — very common in elders — may bring burning, frequency, urgency, cloudy or foul-smelling urine, or new incontinence. Respiratory infections — cough, congestion, shortness of breath, or chest discomfort. Skin and wound infections — redness, warmth, swelling, pain, pus or drainage, or a wound that looks worse. Digestive infections — diarrhea, nausea, vomiting, or belly pain. Eye infections — redness and discharge. Notice signs at any site, and report them — early treatment of a small infection prevents a big one.',
                '**In elders, the signs are often subtle or strange**',
                'This is crucial and often missed: in older adults, infection frequently doesn\'t look like infection. Instead of an obvious fever, an elder with a serious infection may show new or worsening confusion, sudden weakness or falls, decreased appetite or intake, new incontinence, withdrawal, or simply "not being themselves." A sudden change in mental status in an elder should always make you think of infection — among the causes you\'ve learned. So don\'t wait for a classic fever. A resident who is suddenly confused, weaker, or just "off" may have a brewing infection that needs reporting now.',
                '**What to report**',
                'Report infection signs promptly, because in frail elders infections can turn serious fast. Report fever, chills, or feeling unwell. Report site-specific signs — the cloudy foul urine, the worsening wound, the new cough, the diarrhea. Report the subtle elder signs especially — new confusion, sudden weakness, falls, poor intake, "not themselves." Report what you observe factually and specifically to the nurse or charge nurse. You\'re not deciding whether it\'s an infection or what kind — you\'re making sure the signs reach the nurse quickly, so it can be assessed and treated. Early reporting is early treatment.',
              ].join('\n\n'),
            },
            {
              id: 'inf-s05-callout',
              type: 'callout',
              variant: 'warning',
              title: 'In elders, infection may not look like infection',
              body: 'A frail elder with a serious infection may have little or no fever — instead showing new confusion, sudden weakness, falls, poor intake, or "not being themselves." A sudden change in mental status should always make you think of infection. Don\'t wait for a classic fever — report promptly.',
            },
          ]),
      },
      {
        slug: 's06-causes',
        title: 'Causes',
        sortOrder: 1,
        buildContent: () =>
          doc('Causes', [
            { id: 'inf-s06-heading', type: 'heading', level: 1, text: 'Causes' },
            {
              id: 'inf-s06-hero-image',
              type: 'image',
              src: '/assets/courses/chain-of-infection/s06-hero.jpg',
              caption: 'Germs travel by contact — hands and high-touch surfaces.',
            },
            {
              id: 'inf-s06-vulnerable-image',
              type: 'image',
              src: '/assets/courses/chain-of-infection/s06-vulnerable.jpg',
              caption: 'Frail elders are especially vulnerable to infection.',
            },
            pendingAudio(
              'inf-s06-audio',
              'How Infections Spread — and Exactly Which Links the CNA Breaks',
              '/assets/courses/chain-of-infection/s06-causes-podcast.mp3',
              [
                'How Infections Spread — and Exactly Which Links the CNA Breaks',
                '',
                'To stop infections, it helps to understand how they actually move from person to person — because every route of spread is a link a CNA can break.',
                '',
                'The most important route, by far, is contact — and most of that is hands. A caregiver\'s hands touch a resident, or a contaminated surface, and then touch another resident, carrying germs along the way. This is why hand hygiene is the number-one defense: hands are the busiest highway germs travel in a care setting. Surfaces and objects — fomites — matter too: bed rails, call lights, wheelchairs, equipment, doorknobs, and shared items can hold germs that the next pair of hands picks up. Then there are other routes you\'ll study in more depth elsewhere: droplets from coughs and sneezes that travel a short distance, tiny airborne particles that linger, and bloodborne spread through blood and certain body fluids. Each route is real, but for everyday care, contact through hands and surfaces is where most spread happens — and where the CNA has the most power.',
                '',
                'Why are residents so susceptible — the last link in the chain, the vulnerable host? Aging weakens the immune system. Chronic illnesses — diabetes, heart and lung disease, kidney disease — lower the body\'s defenses. Broken skin from wounds, pressure injuries, or IV and catheter sites gives germs a way in. Devices like urinary catheters and feeding tubes create direct routes past the body\'s barriers. Malnutrition and dehydration weaken resistance. And living close together, sharing caregivers and spaces, increases exposure. You can\'t change most of these — but knowing them tells you why your residents need the chain broken so faithfully, and why even small lapses matter more here than almost anywhere.',
                '',
                'Now the empowering part — mapping the CNA\'s actions to the links. Clean hands break the transmission link, the germs\' main travel route. Gloves and gowns block the portals of exit and entry, sealing off the way germs leave one person and enter another. Cleaning surfaces and equipment removes the reservoir on fomites. Safe handling of linens, waste, and spills cuts off the escape route and keeps germs from spreading. Covering coughs and proper respiratory etiquette closes the portal of exit for respiratory germs. Caring for skin, wounds, and device sites protects the portal of entry into the vulnerable host. And catching and reporting infection early helps remove the reservoir before it spreads to others. Every one of these is a deliberate strike against a link in the chain.',
                '',
                'The takeaway: infections spread mostly by contact — hands and surfaces — into residents made vulnerable by age, illness, broken skin, and devices; and the CNA breaks the chain at link after link through hand hygiene, PPE, surface cleaning, safe handling, and early reporting. You can\'t make residents less vulnerable — but you can make sure the germs never reach them.',
              ].join('\n'),
              '/assets/courses/chain-of-infection/s06-causes-podcast.mp3',
            ),
          ]),
      },
      {
        slug: 's07-medications',
        title: 'Infection-Control Practices: Breaking the Chain',
        sortOrder: 2,
        buildContent: () =>
          doc('Infection-Control Practices: Breaking the Chain', [
            { id: 'inf-s07-heading', type: 'heading', level: 1, text: 'Infection-Control Practices: Breaking the Chain' },
            {
              id: 'inf-s07-hero-image',
              type: 'image',
              src: '/assets/courses/chain-of-infection/s07-hero.jpg',
              caption: 'Hand hygiene is the foundation of every infection-control practice.',
            },
            {
              id: 'inf-s07-ppe-image',
              type: 'image',
              src: '/assets/courses/chain-of-infection/s07-ppe-removal.jpg',
              caption: 'Remove PPE carefully without touching the contaminated outer surface.',
            },
            {
              id: 'inf-s07-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of practice',
              body: 'A CNA does not diagnose infections, does not prescribe or give treatment for them, and does not decide isolation or precaution orders — those come from the nurse and care plan. Your job is to break the chain through hand hygiene, standard precautions, PPE, safe handling, and reporting.',
            },
            {
              id: 'inf-s07-narration',
              type: 'text',
              body: [
                'Infections are diagnosed and treated medically by the team — but stopping their spread is overwhelmingly the daily work of the CNA, and it\'s done through a set of practices that break the chain. Let\'s walk through them, starting with the rule that frames it. A CNA does not diagnose infections, does not prescribe or give treatment for them, and does not decide isolation or precaution orders — those come from the nurse and care plan. Your job is to break the chain and report.',
                '**Hand hygiene — first, most, and always.** This is the foundation of everything. Clean your hands — soap and water when visibly soiled or after certain infections, sanitizer otherwise — at every key moment: before and after every resident, before gloves and after removing them, after any contamination, before and after tasks, entering and leaving rooms. Do it correctly and completely, every single time. No other single practice prevents more infection. When in doubt, clean your hands. This one habit, done faithfully, is the most powerful thing you do all shift.',
                '**Standard precautions — for every resident, every time.** Apply the basics to everyone, treating all blood and body fluids as potentially infectious: hand hygiene, gloves when you might contact fluids or broken skin, and a gown, mask, or eye protection when splashes are possible. No exceptions, no singling anyone out — because you can\'t tell who\'s infected. Standard precautions are the universal shield that protects every resident and you, fairly and quietly.',
                '**PPE — used and removed correctly.** Choose PPE for the task and risk. Put it on in the proper order, and — this is where mistakes happen — take it off carefully, in the right order, without touching the contaminated outer surfaces to your skin, then clean your hands immediately. Remember: gloves are not a substitute for hand hygiene; you clean your hands before and after them. Used right, PPE blocks the germs\' exit and entry; used carelessly, it can spread what it was meant to stop.',
                '**Safe handling of linens, waste, and spills.** Break the escape route. Handle soiled linens and clothing carefully — hold them away from your body, don\'t shake them, bag them as your facility directs. Dispose of waste and contaminated items properly. Clean up spills of body fluids promptly and correctly with the right products and PPE. Keep surfaces and shared equipment clean. Each of these removes germs from a reservoir or cuts off their spread — quiet, essential chain-breaking.',
                '**Recognize, report, and follow precautions.** Watch for the signs of infection — including the subtle elder signs like new confusion — and report them promptly so infection is caught and the reservoir removed early. Follow any transmission-based precautions the nurse orders for a resident, layered over your standard precautions. Support residents\' own hygiene and care that protects their skin and resistance. You break the chain and feed the team the information that stops it spreading further.',
                'The scope point: you never diagnose, treat, or set precaution orders — but you perform hand hygiene faithfully, apply standard precautions to everyone, use PPE correctly, handle linens, waste, and spills safely, and recognize and report infection. Breaking the chain is the care you deliver.',
              ].join('\n\n'),
            },
            {
              id: 'inf-s07-callout',
              type: 'callout',
              variant: 'warning',
              title: 'Key chain-breaking rules',
              body: 'Gloves are NOT a substitute for hand hygiene — clean hands before AND after. Remove PPE without touching the dirty outside, then clean hands. Don\'t shake soiled linens. Soap and water when hands are visibly soiled. Clean high-touch surfaces. Never reuse gloves between residents.',
            },
          ]),
      },
      {
        slug: 's08-prevention',
        title: 'Prevention',
        sortOrder: 3,
        buildContent: () =>
          doc('Prevention', [
            { id: 'inf-s08-heading', type: 'heading', level: 1, text: 'Prevention' },
            {
              id: 'inf-s08-hero-image',
              type: 'image',
              src: '/assets/courses/chain-of-infection/s08-hero.jpg',
              caption: 'Cleaning high-touch surfaces removes germs from their reservoir.',
            },
            {
              id: 'inf-s08-linens-image',
              type: 'image',
              src: '/assets/courses/chain-of-infection/s08-linens.jpg',
              caption: 'Handle soiled linens safely — away from the body, never shaken.',
            },
            {
              id: 'inf-s08-narration',
              type: 'text',
              body: [
                'Preventing infection is your daily work, and it comes down to breaking the chain, link by link. Here are seven ways.',
                '**One. Clean your hands — every time, the right way.** This is the most important habit of all. Clean your hands at every key moment — before and after every resident, before and after gloves, after any contamination — and do it correctly each time. Soap and water when visibly soiled or after certain infections; sanitizer otherwise. Faithful hand hygiene prevents more infection than anything else you can do. Never skip it, never rush it.',
                '**Two. Use standard precautions with everyone.** Apply the basic protections to every resident, every time, treating all body fluids as potentially infectious — because you can\'t tell who\'s infected. Gloves when you might contact fluids or broken skin, more PPE when splashing is possible. Treating everyone with the same standard precautions protects all your residents and you, and misses no one.',
                '**Three. Use and remove PPE correctly.** Put on the right gear for the task, and take it off carefully — without touching the dirty outer surfaces, in the right order — then clean your hands right after. Careful PPE technique is what makes the protection real; careless removal spreads the very germs you were guarding against. Master the removal especially.',
                '**Four. Handle linens, waste, and spills safely.** Hold soiled linens away from your body, never shake them, and bag and dispose of waste and contaminated items as directed. Clean spills of body fluids promptly with the right products and PPE. These quiet habits cut off the germs\' escape route and remove them from surfaces — chain-breaking that\'s easy to overlook but vital.',
                '**Five. Keep surfaces and equipment clean.** Clean and disinfect shared equipment and high-touch surfaces — bed rails, call lights, wheelchairs, doorknobs — because these fomites carry germs to the next pair of hands. A clean environment removes the reservoir, and dedicating equipment to one resident where directed stops shared spread. Wipe down what gets touched.',
                '**Six. Protect skin, wounds, and respiratory etiquette.** Care well for residents\' skin, wounds, and device sites — these are the germs\' way in — and support good hygiene. Encourage and practice respiratory etiquette: cover coughs and sneezes, and clean hands after. Protecting the body\'s barriers and closing the portals of exit and entry breaks the chain right at the resident.',
                '**Seven. Catch and report infection early — and stay home when sick.** Watch for infection signs, including the subtle elder ones, and report them promptly so infection is caught and contained before it spreads. And protect your residents from yourself: follow your facility\'s rules about not working when you\'re ill with something contagious, because a sick caregiver can become the source. Early reporting and not spreading your own illness both break the chain at its start.',
              ].join('\n\n'),
            },
          ]),
      },
    ],
  },
  {
    slug: 'module-3',
    title: 'Reporting, Your Role, and Application',
    sortOrder: 2,
    lessons: [
      {
        slug: 's09-emergency',
        title: 'Recognizing & Reporting Infection',
        sortOrder: 0,
        buildContent: () =>
          doc('Recognizing & Reporting Infection', [
            {
              id: 'inf-s09-heading',
              type: 'heading',
              level: 1,
              text: 'Recognizing & Reporting Infection',
            },
            pendingAudio(
              'inf-s09-intro-audio',
              'Recognizing subtle infection and refusing shortcuts — intro',
              '/assets/courses/chain-of-infection/s09-emergency-intro.mp3',
              'With infection control, the judgments that matter most are recognizing a subtle infection in an elder and reporting it, and never taking the shortcuts that spread germs from one resident to the next. You\'re about to work through two situations. Read each carefully, choose your action, and you\'ll get feedback right away. Keep the core ideas in mind: sudden new confusion in an elder may be infection, report it — and clean hands and fresh gloves between residents break the chain, every time.',
              '/assets/courses/chain-of-infection/s09-emergency-intro.mp3',
            ),
            {
              id: 'inf-s09-hero-image',
              type: 'image',
              src: '/assets/courses/chain-of-infection/s09-hero.jpg',
              caption: 'Report concerns to the nurse promptly and clearly.',
            },
            {
              id: 'inf-s09-scenario-image',
              type: 'image',
              src: '/assets/courses/chain-of-infection/s09-scenario.jpg',
              caption: 'A sudden change in an elder may be the first sign of infection.',
            },
            {
              id: 'inf-s09-scenario-subtle',
              type: 'scenario_question',
              prompt:
                'Mr. Tanaka, normally alert and pleasant, is suddenly different today — newly confused, weak, not eating, and a bit "off." He doesn\'t have an obvious fever. You notice his urine in the bag is cloudy and has a strong foul smell. A coworker says, "He\'s just having an off day, maybe getting older — no fever, so it\'s not an infection. Don\'t bother the nurse." What SHOULD the CNA do?',
              options: [
                {
                  id: 'off-day',
                  label: 'Agree it\'s just an off day since there\'s no fever, and not report it',
                  feedback:
                    'In elders, infection often shows as new confusion, weakness, and poor intake rather than an obvious fever — and "no fever means no infection" is a dangerous myth. Mr. Tanaka\'s sudden confusion plus cloudy, foul urine suggests a possible urinary infection that can turn serious fast. The right action: report it to the nurse promptly so he can be assessed and treated early.',
                },
                {
                  id: 'report-it',
                  label: 'Report it to the nurse promptly — new confusion, weakness, poor intake, and cloudy foul urine suggest a possible infection, even without a fever',
                  feedback:
                    'Exactly right. This is one of the most important things to understand about infection in elders: it often doesn\'t look like infection. Instead of a clear fever, a frail older adult with a real infection may show new confusion, sudden weakness, poor appetite, or simply "not being themselves" — and a sudden change in mental status in an elder should always make you think of infection. Mr. Tanaka has exactly that picture, plus cloudy, foul-smelling urine, which points toward a urinary tract infection — very common in elders and able to turn serious fast. "No fever, so it\'s not an infection" is a dangerous myth; many elders run little or no fever even when seriously infected. So don\'t wait it out, and don\'t just quietly push fluids and say nothing. Report it promptly to the nurse — the new confusion, the weakness, the poor intake, the cloudy foul urine — so he can be assessed and, if needed, treated early. You\'re not diagnosing the infection; you\'re making sure the signs reach the nurse fast. Catching it now, before it becomes serious, is exactly the kind of save a watchful CNA makes.',
                  isRecommended: true,
                },
                {
                  id: 'wait',
                  label: 'Wait a few days to see if he improves',
                  feedback:
                    'Waiting fails him — in frail elders infections can turn serious fast, and his sudden confusion plus cloudy, foul urine suggests a possible urinary infection now. "No fever" doesn\'t rule it out. The right action: report it to the nurse promptly so he can be assessed and treated early.',
                },
                {
                  id: 'fluids-silent',
                  label: 'Give him extra fluids and tell no one',
                  feedback:
                    'Quietly giving fluids and saying nothing leaves a possible infection unassessed and untreated. His sudden confusion plus cloudy, foul urine suggests a urinary infection that can turn serious fast. The right action: report it to the nurse promptly so he can be assessed and treated early — you don\'t diagnose, you make sure the signs reach the nurse.',
                },
              ],
              requiredForCompletion: true,
            },
            {
              id: 'inf-s09-scenario-gloves',
              type: 'scenario_question',
              prompt:
                'You\'ve just finished helping one resident with incontinence care, wearing gloves. The hallway is busy and you\'re behind. Your next resident, in the same room, needs help right away. A coworker says, "Just keep the same gloves on and go straight to the next one — you\'re already gloved up, it saves time, and your hands are covered anyway." What SHOULD the CNA do?',
              options: [
                {
                  id: 'same-gloves',
                  label: 'Keep the same gloves on and go straight to the next resident to save time',
                  feedback:
                    'Those gloves are contaminated from incontinence care — wearing them to the next resident carries germs straight from one person to another. Gloves are never a substitute for hand hygiene. The right step every time: remove the gloves, clean your hands, and put on fresh gloves before the next resident — no matter how busy you are.',
                },
                {
                  id: 'fresh-gloves',
                  label: 'Remove the gloves, clean your hands, and put on fresh gloves before the next resident',
                  feedback:
                    'Right — and this is the chain of infection in miniature. Those gloves are now contaminated from incontinence care, covered in germs. Wearing them to the next resident would carry those germs straight from one person to another — your hands "covered" in exactly the thing you must not transfer. Gloves protect you, but reusing them between residents turns them into a vehicle for spread; they are never a substitute for hand hygiene, and wiping them with sanitizer doesn\'t make them clean or safe — gloves are removed and replaced, not disinfected and reused. The right step every single time: remove the used gloves carefully without contaminating your hands, clean your hands, and put on fresh gloves before touching the next resident. Yes, it takes a moment when you\'re rushed — but that moment is the difference between breaking the chain and being the chain, carrying an infection from one resident to the next. Clean hands and fresh gloves between residents, every time, no matter how busy.',
                  isRecommended: true,
                },
                {
                  id: 'wipe-gloves',
                  label: 'Keep the gloves on but wipe them with sanitizer',
                  feedback:
                    'Wiping contaminated gloves with sanitizer doesn\'t make them clean or safe — gloves are removed and replaced, not disinfected and reused. Those gloves are a germ highway from one resident to the next. The right step: remove the gloves, clean your hands, and put on fresh gloves before the next resident.',
                },
                {
                  id: 'skip-gloves',
                  label: 'Skip gloves entirely for the next resident since you\'re rushed',
                  feedback:
                    'Skipping gloves leaves you unprotected and can spread germs too. The issue isn\'t gloves or no gloves — it\'s clean hands and FRESH gloves between residents. The right step: remove the used gloves, clean your hands, and put on fresh gloves before the next resident, no matter how busy.',
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
            { id: 'inf-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
              id: 'inf-s10-video',
              type: 'video',
              title: "CNA's Role in Care",
              videoUrl: '/assets/courses/chain-of-infection/s10-cna-role.mp4',
              placeholderNote: 'Pending upload: /assets/courses/chain-of-infection/s10-cna-role.mp4',
            },
            {
              id: 'inf-s10-hero-image',
              type: 'image',
              src: '/assets/courses/chain-of-infection/s10-hero.jpg',
              caption: 'The CNA is the faithful chain-breaker on every shift.',
            },
            {
              id: 'inf-s10-narration',
              type: 'text',
              body: [
                'Your role in infection control is to be the faithful chain-breaker — through hand hygiene, standard precautions, correct PPE, safe handling, and early reporting. Let\'s walk through it.',
                '**Clean hands, faithfully.** Hand hygiene is your number-one duty and your most powerful tool. Clean your hands at every key moment — before and after every resident, before and after gloves, after any contamination — correctly and completely, every single time, no matter how busy. Soap and water when visibly soiled, sanitizer otherwise. Your faithful hand hygiene breaks the germs\' main travel route more often than anything else you do all shift. This one habit, never skipped, protects everyone you touch.',
                '**Standard precautions and correct PPE.** Apply standard precautions to every resident, every time, treating all body fluids as potentially infectious — gloves when you might contact fluids or broken skin, more PPE when splashing is possible. Use PPE for the task, and remove it carefully without touching the contaminated surfaces, then clean your hands. Follow any extra precautions the nurse orders. Used right, these block the germs\' exit and entry for everyone, fairly and without singling anyone out.',
                '**Safe handling and a clean environment.** Break the escape route and remove the reservoir. Handle soiled linens away from your body without shaking them, dispose of waste and contaminated items properly, clean spills promptly with the right products and PPE, and keep high-touch surfaces and shared equipment clean. These quiet, unglamorous habits cut germs off from their surfaces and their spread — chain-breaking that protects the whole unit.',
                '**Recognize, report, and protect.** Be the early-warning system. Watch for infection signs — including the subtle elder ones like new confusion, weakness, and poor intake — and report them promptly so infection is caught and contained before it spreads. Support residents\' skin, wound, and device care that protects their barriers. And protect them from your own illness by following the rules about not working sick. You catch infection early and keep it from spreading further.',
                'Now the boundary. You do not diagnose infections. You do not prescribe or give treatment for them. You do not decide isolation or precaution orders — the nurse and care plan do. And you never skip hand hygiene, never reuse gloves between residents, never take shortcuts that spread germs, and never ignore a sign of infection.',
                'Inside your role — faithful hand hygiene, universal standard precautions, correct PPE, safe handling, and early reporting — you break the chain of infection link after link, every shift. You are, quite literally, what stands between an invisible germ and a vulnerable resident. Few things you do protect more people.',
              ].join('\n\n'),
            },
            {
              id: 'inf-s10-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Stay within scope',
              body: 'You do not diagnose infections, prescribe or give treatment, or decide isolation/precaution orders — the nurse and care plan do. You practice faithful hand hygiene, apply standard precautions to everyone, use PPE correctly, handle linens/waste/spills safely, and recognize and report infection.',
            },
          ]),
      },
      {
        slug: 's11-case-study',
        title: 'Brief Case Study',
        sortOrder: 2,
        buildContent: () => {
          const caseNarrative = [
            'It was a busy, short-staffed week on the unit, and a stomach bug — the kind that causes vomiting and diarrhea and spreads easily — had begun moving through a nearby wing. Two residents there were already ill. The conditions were perfect for an outbreak to sweep through the whole floor. That it didn\'t is the story of one CNA, Grace, and the chain of infection.',
            '',
            '**What Grace understood:** Grace had recently completed her infection-control training, and she carried its core idea into every task: an infection spreads only if the chain stays connected — germ, reservoir, exit, travel, entry, vulnerable host — and breaking any link stops it. With an easily-spread bug nearby and a hall full of frail, vulnerable residents, she knew the germs\' main highway would be hands and surfaces, and she made herself a faithful chain-breaker, refusing every shortcut even though the unit was slammed and she was rushed.',
            '',
            '**Hand hygiene, no exceptions:** She cleaned her hands at every single moment it was needed — before and after every resident, before and after every pair of gloves, after every possible contamination — soap and water, not just sanitizer, because this kind of stomach bug is one that hand sanitizer doesn\'t reliably kill, so she washed. When a coworker, behind and frazzled, started moving between residents in the same gloves to save time, Grace spoke up kindly and reminded her: remove, wash, fresh gloves, every resident — because those gloves were a germ highway, not a shortcut.',
            '',
            '**Standard precautions and clean surfaces:** She used gloves and gowns for care involving body fluids, removed her PPE carefully without contaminating herself, and washed afterward every time. She handled soiled linens away from her body without shaking them, bagged them as directed, and cleaned up every spill promptly and correctly. And she wiped down the high-touch surfaces — bed rails, call lights, shared equipment, doorknobs — knowing those fomites were exactly how the bug would hitch a ride to the next resident if she let it.',
            '',
            '**Recognize and report — fast:** When one of her residents, Mr. Solomon, developed new diarrhea and seemed off, Grace didn\'t wait or hope it was nothing. She reported it to the charge nurse promptly, so he could be assessed and the right extra precautions put in place quickly — containing him as a possible new source before the bug could spread from him to others. Early recognition removed the reservoir before it became an outbreak hub.',
            '',
            '**The outcome:** The bug burned out in the neighboring wing without ever taking hold on Grace\'s hall. The two ill residents elsewhere recovered; Mr. Solomon, caught and contained early, got better without passing it on; and the dozens of vulnerable residents who could have fallen like dominoes simply... didn\'t. There was no outbreak. The nurse manager, reviewing the week, put it plainly to Grace: "Next door had a real scare. Your hall stayed clean — and it\'s not luck. You washed your hands a hundred times when you were rushed, you wouldn\'t reuse a glove, you wiped down everything, and you reported Mr. Solomon fast. You broke the chain over and over. The outbreak that didn\'t happen here — that\'s you."',
          ].join('\n');

          return doc('Brief Case Study', [
            { id: 'inf-s11-heading', type: 'heading', level: 1, text: 'Brief Case Study' },
            pendingAudio(
              'inf-s11-audio',
              'The Outbreak That Didn\'t Happen',
              '/assets/courses/chain-of-infection/s11-case-podcast.mp3',
              caseNarrative,
              '/assets/courses/chain-of-infection/s11-case-podcast.mp3',
            ),
            {
              id: 'inf-s11-hero-image',
              type: 'image',
              src: '/assets/courses/chain-of-infection/s11-hero.jpg',
              caption: 'Faithful hand hygiene, even on a busy short-staffed week.',
            },
            {
              id: 'inf-s11-surface-image',
              type: 'image',
              src: '/assets/courses/chain-of-infection/s11-clean-surface.jpg',
              caption: 'Wiping down high-touch surfaces stops the bug from spreading.',
            },
            {
              id: 'inf-s11-case-study',
              type: 'case_study',
              title: 'The Outbreak That Didn\'t Happen',
              residentProfile:
                'A busy, short-staffed week on the unit. An easily-spread stomach bug (vomiting and diarrhea) had begun moving through a nearby wing — two residents there already ill, conditions perfect for an outbreak to sweep the whole floor. That it didn\'t is the story of one CNA, Grace, and the chain of infection.',
              scenario: [
                '**What Grace understood:** She carried her infection-control training into every task: an infection spreads only if the chain stays connected — germ, reservoir, exit, travel, entry, vulnerable host — and breaking any link stops it. With an easily-spread bug nearby and a hall full of frail residents, she knew the germs\' main highway would be hands and surfaces, and she made herself a faithful chain-breaker, refusing every shortcut even while slammed.',
                '**Hand hygiene, no exceptions:** She cleaned her hands at every moment it was needed — using soap and water, not just sanitizer, because this kind of stomach bug isn\'t reliably killed by sanitizer. When a frazzled coworker started moving between residents in the same gloves to save time, Grace kindly reminded her: remove, wash, fresh gloves, every resident — because those gloves were a germ highway, not a shortcut.',
                '**Standard precautions and clean surfaces:** She used gloves and gowns for body-fluid care, removed PPE carefully without contaminating herself, and washed afterward every time. She handled soiled linens away from her body without shaking them, bagged them as directed, cleaned every spill promptly, and wiped down high-touch surfaces — bed rails, call lights, shared equipment, doorknobs — knowing those fomites were how the bug would hitch a ride to the next resident.',
                '**Recognize and report — fast:** When her resident Mr. Solomon developed new diarrhea and seemed off, Grace didn\'t wait. She reported it to the charge nurse promptly, so he could be assessed and the right extra precautions put in place — containing him as a possible new source before the bug could spread. Early recognition removed the reservoir before it became an outbreak hub.',
                '**The outcome:** The bug burned out next door without ever taking hold on Grace\'s hall. Mr. Solomon, caught and contained early, recovered without passing it on; the dozens of vulnerable residents who could have fallen like dominoes simply didn\'t. The nurse manager put it plainly: "Your hall stayed clean — and it\'s not luck. You washed your hands a hundred times when rushed, you wouldn\'t reuse a glove, you wiped down everything, and you reported Mr. Solomon fast. You broke the chain over and over. The outbreak that didn\'t happen here — that\'s you."',
              ].join('\n\n'),
            },
            {
              id: 'inf-s11-reflection-1',
              type: 'reflection',
              prompt:
                'A coworker tried to move between residents in the same gloves to save time during a busy week. Why was Grace right to insist on removing gloves, washing hands, and using fresh gloves for each resident — and how does that break the chain of infection?',
              minCharacters: 50,
            },
            {
              id: 'inf-s11-reflection-2',
              type: 'reflection',
              prompt:
                'Grace used soap and water rather than only hand sanitizer during this particular stomach-bug outbreak. Why does the method matter, and what general rule tells a CNA when soap and water are required?',
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
            { id: 'inf-s12-heading', type: 'heading', level: 1, text: 'Conclusion' },
            {
              id: 'inf-s12-video',
              type: 'video',
              title: 'Conclusion',
              videoUrl: '/assets/courses/chain-of-infection/s12-conclusion.mp4',
              placeholderNote: 'Pending upload: /assets/courses/chain-of-infection/s12-conclusion.mp4',
            },
            {
              id: 'inf-s12-hero-image',
              type: 'image',
              src: '/assets/courses/chain-of-infection/s12-hero.jpg',
              caption: 'You stand between an invisible germ and a vulnerable resident.',
            },
            {
              id: 'inf-s12-narration',
              type: 'text',
              body: [
                'You\'ve reached the end. Let\'s lock in the five things that matter most about infection control.',
                '**One.** Understand the chain of infection — germ, reservoir, way out, way to travel, way in, and a vulnerable person. Connect all the links and infection spreads; break any one link and it stops. Every infection-control action you take breaks a link. Your whole mission is simple: break the chain.',
                '**Two.** Hand hygiene is your number-one defense. Clean hands — soap and water when visibly soiled or after certain infections, sanitizer otherwise — at every key moment: before and after every resident, before and after gloves, after any contamination. No single practice prevents more infection. Do it correctly, every time, no matter how busy. Gloves are never a substitute for clean hands.',
                '**Three.** Use standard precautions with every resident, every time. Treat all blood and body fluids as potentially infectious, because you can\'t tell who\'s infected. Gloves when you might contact fluids or broken skin, more PPE when splashing is possible — and remove PPE carefully without touching the dirty surfaces, then clean your hands. The same protections for everyone, missing no one.',
                '**Four.** Handle linens, waste, spills, and surfaces safely. Hold soiled linens away from you, don\'t shake them, dispose of waste properly, clean spills promptly, and disinfect high-touch surfaces and shared equipment. These quiet habits remove germs from their reservoirs and cut off their spread.',
                '**Five.** Recognize and report infection — and honor your scope. Watch for the signs, including the subtle elder ones like new confusion and weakness, and report them promptly. You never diagnose, treat, or set precaution orders — but you break the chain through hand hygiene, standard precautions, PPE, safe handling, and early reporting. Break the chain, every shift — you stand between an invisible germ and a vulnerable resident.',

                'This course provides one hour of continuing education through CAL ACE Nursing Academy (CDPH Provider NAC #7384). Your certificate is generated automatically when you pass the knowledge check.',
                'Ten questions are waiting. Everything on them was covered here. You\'re ready. Trust what you\'ve learned, and show what you know.',
              ].join('\n\n'),
            },
            {
              id: 'inf-s12-summary',
              type: 'summary',
              title: 'Five things that matter most',
              items: [
                'Understand the chain of infection — germ, reservoir, way out, way to travel, way in, vulnerable person. Break any one link and infection can\'t spread. Your mission: break the chain.',
                'Hand hygiene is your #1 defense — soap and water when visibly soiled or after certain infections, sanitizer otherwise, at every key moment. Gloves are never a substitute for clean hands.',
                'Use standard precautions with every resident, every time — treat all body fluids as potentially infectious. Gloves and PPE as needed; remove PPE without touching the dirty surfaces, then clean hands.',
                'Handle linens, waste, spills, and surfaces safely — hold soiled linens away and don\'t shake them, clean spills promptly, disinfect high-touch surfaces and shared equipment.',
                'Recognize and report infection (including the subtle elder signs like new confusion) and honor your scope — you never diagnose, treat, or set precaution orders, but you break the chain every shift.',
              ],
            },
          ]),
      },
    ],
  },
];

export async function seedCourse05ChainOfInfection(
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
      label: 'V3 rebuild — the chain of infection & standard precautions',
      status: CourseVersionStatus.DRAFT,
      deliveryMode: DeliveryMode.ONLINE,
      ceHours,
      publishedAt: null,
      contentMeta: contentMeta as Prisma.InputJsonValue,
    },
    update: {
      label: 'V3 rebuild — the chain of infection & standard precautions',
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
    `Seeding Course 5 (Chain of Infection) as DRAFT — slug "${COURSE_SLUG}", version ${VERSION_NUMBER}…`,
  );

  try {
    const result = await seedCourse05ChainOfInfection(prisma);
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
