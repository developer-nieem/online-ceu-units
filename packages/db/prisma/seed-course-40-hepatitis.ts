/**
 * Seed Course 40 — Caring for a Resident with Hepatitis (A, B & C) (DRAFT).
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-40-hepatitis
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
const COURSE_SLUG = 'hepatitis';
const COURSE_TITLE = 'Viral Hepatitis (A, B & C): Transmission Precautions and Care Support';
const COURSE_SUMMARY =
  'Learn the CNA\'s role in caring for a resident with hepatitis — understanding the liver and the A/B/C types, applying standard precautions and bloodborne-pathogen protection, supporting the resident without stigma, recognizing signs and complications, and protecting yourself through vaccination, sharps safety, and exposure response. CNAs do not diagnose hepatitis, give or adjust medications, or interpret lab results.';

const ASSET_BASE = `/assets/courses/hepatitis`;


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
    'Explain what hepatitis is and how A, B, and C differ.',
    'Apply standard precautions.',
    'Support the resident without stigma.',
    'Recognize signs and complications.',
    'Protect yourself.',
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
  heroImage: '/assets/courses/hepatitis/hero-banner.png',
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
    title: 'Understanding Hepatitis and the CNA Role',
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: 'Introduction',
        sortOrder: 0,
        buildContent: () =>
          doc('Welcome', [
            { id: 'hep-s01-heading', type: 'heading', level: 1, text: 'Welcome' },
            {
              id: 'hep-s01-video',
              type: 'video',
              title: 'Introduction',
              videoUrl: '/assets/courses/hepatitis/s01-intro.mp4',
              placeholderNote: 'Pending upload: /assets/courses/hepatitis/s01-intro.mp4',
            },
            {
              id: 'hep-s01-image',
              type: 'image',
              src: `${ASSET_BASE}/s01-hero.png`,
              caption:
                'Hepatitis — caring safely and without stigma for residents with liver inflammation.',
            },
            {
              id: 'hep-s01-narration',
              type: 'text',
              body: [
                'Welcome to CAL ACE Nursing Academy.',
                'This course is about hepatitis — inflammation of the liver — and it opens our series on infectious conditions. So along the way, it teaches something every CNA uses every single day with every single resident: standard precautions, the foundation of protecting yourself and others from infection.',
                'Let\'s start with the liver, because it explains everything. The liver is a large, vital organ that does hundreds of jobs: it filters toxins from the blood, helps digest food, stores energy, makes proteins that clot your blood, and processes medications. You cannot live without a working liver. Hepatitis means the liver is inflamed and not working as it should — and the most common cause is a group of viruses named, simply, hepatitis A, B, and C.',
                'The three types matter because they spread differently — and that difference shapes your care. Hepatitis A spreads through the fecal-oral route: tiny amounts of stool from an infected person reaching another person\'s mouth, usually through contaminated food, water, or unwashed hands. It\'s usually short-term and doesn\'t become chronic. Hepatitis B and C are bloodborne — they spread through blood and certain body fluids — and they can become chronic, long-term infections that slowly damage the liver over years, sometimes leading to cirrhosis, liver failure, or liver cancer.',
                'That bloodborne piece is why this course teaches standard precautions in depth. Standard precautions means treating every resident\'s blood and body fluids as if they could be infectious — because you can\'t always know who carries what, and many people with hepatitis B or C don\'t even know they have it. Hand hygiene, gloves and other protective equipment, safe handling of anything with blood on it, and careful handling of sharps — these protect you, the resident, and everyone else, every day, with everyone.',
                'And there\'s a human piece that matters just as much. Hepatitis can carry stigma — people sometimes make unkind assumptions about how someone got it. A CNA gives care free of judgment. How a resident got hepatitis is not your concern; caring for them safely and with respect is.',
                'Your scope is clear. A CNA applies standard precautions faithfully, supports the resident without stigma, recognizes signs and complications, protects themselves through vaccination and safe practices, and reports faithfully. A CNA does not diagnose hepatitis, does not give or adjust medications, and does not interpret lab results.',
                'By the end of this course, you will be able to: explain what hepatitis is and how A, B, and C differ. Apply standard precautions. Support the resident without stigma. Recognize signs and complications. And protect yourself. Let\'s begin.',
              ].join('\n\n'),
            },
            {
              id: 'hep-s01-ci-text',
              type: 'text',
              body: [
                'This course teaches the CNA\'s role in caring for a resident with hepatitis — understanding the liver and the A/B/C types, applying standard precautions and bloodborne-pathogen protection, supporting the resident without stigma, recognizing signs and complications, and protecting yourself through vaccination, sharps safety, and exposure response.',
                'Let\'s be clear about your role. A CNA applies standard precautions faithfully, supports the resident without stigma, recognizes signs and complications, protects themselves through vaccination and safe practices, and reports faithfully. A CNA does not diagnose hepatitis, does not give or adjust medications, and does not interpret lab results. Those are medical-team tasks. But none of them can happen without your faithful precautions, supportive care, and accurate reporting first.',
              ].join('\n\n'),
            },
            {
              id: 'hep-s01-ci-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of this course',
              body: 'CNAs apply standard precautions, support without stigma, recognize signs, and protect themselves. CNAs do not diagnose hepatitis, give or adjust medications, or interpret lab results.',
            },
            {
              id: 'hep-s01-lo-text',
              type: 'text',
              body: 'By the end of this course, you will be able to:',
            },
            {
              id: 'hep-s01-lo-summary',
              type: 'summary',
              title: 'Learning objectives',
              items: [
                'Explain what hepatitis is and how A, B, and C differ.',
                'Apply standard precautions.',
                'Support the resident without stigma.',
                'Recognize signs and complications.',
                'Protect yourself.',
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
            { id: 'hep-s02-heading', type: 'heading', level: 1, text: 'Key terms' },
            {
              id: 'hep-s02-image',
              type: 'image',
              src: `${ASSET_BASE}/s02-hero.png`,
              caption:
                'Key terms — hepatitis A, B, C, standard precautions, bloodborne pathogen, jaundice, cirrhosis.',
            },
            {
              id: 'hep-s02-reveal-hepatitis',
              type: 'reveal_card',
              frontTitle: 'Hepatitis',
              frontBody: 'Hep-ah-TY-tis',
              backTitle: 'Hepatitis',
              backBody:
                'Inflammation of the liver — the liver is irritated and not working well. The most common cause is a group of viruses: hepatitis A, B, and C. It can be short-term or, for B and C, become a long-term, chronic condition.',
            },
            {
              id: 'hep-s02-reveal-liver',
              type: 'reveal_card',
              frontTitle: 'The Liver',
              frontBody: 'The liver',
              backTitle: 'The Liver',
              backBody:
                'A large, vital organ that filters toxins from the blood, helps digest food, stores energy, makes blood-clotting proteins, and processes medications. When hepatitis inflames it, these jobs falter — which is why hepatitis affects the whole body, not just the liver.',
            },
            {
              id: 'hep-s02-reveal-hep-a',
              type: 'reveal_card',
              frontTitle: 'Hepatitis A',
              frontBody: 'Hepatitis A',
              backTitle: 'Hepatitis A',
              backBody:
                'Spreads by the fecal-oral route — tiny amounts of an infected person\'s stool reaching another\'s mouth, usually through contaminated food, water, or unwashed hands. It\'s usually short-term, doesn\'t become chronic, and is prevented by good hygiene and a vaccine.',
            },
            {
              id: 'hep-s02-reveal-hep-bc',
              type: 'reveal_card',
              frontTitle: 'Hepatitis B & C (Bloodborne)',
              frontBody: 'Hepatitis B and C',
              backTitle: 'Hepatitis B & C (Bloodborne)',
              backBody:
                'Bloodborne viruses — spread through blood and certain body fluids, not casual contact. Both can become chronic, slowly damaging the liver over years. Hepatitis B has a vaccine, strongly recommended for healthcare workers; hepatitis C does not, but is now often curable with medication.',
            },
            {
              id: 'hep-s02-reveal-standard-precautions',
              type: 'reveal_card',
              frontTitle: 'Standard Precautions',
              frontBody: 'Standard precautions',
              backTitle: 'Standard Precautions',
              backBody:
                'The everyday infection-control practices used with every resident, treating all blood and body fluids as potentially infectious. They include hand hygiene, gloves and protective equipment, and safe handling of fluids and sharps. Standard precautions are the foundation of safe care.',
            },
            {
              id: 'hep-s02-reveal-bloodborne-pathogen',
              type: 'reveal_card',
              frontTitle: 'Bloodborne Pathogen',
              frontBody: 'Bloodborne pathogen',
              backTitle: 'Bloodborne Pathogen',
              backBody:
                'A germ carried in blood that can infect someone exposed to that blood — hepatitis B, hepatitis C, and HIV are the main ones. Protecting against bloodborne pathogens means avoiding contact with others\' blood through gloves, safe practices, and careful sharps handling.',
            },
            {
              id: 'hep-s02-reveal-jaundice',
              type: 'reveal_card',
              frontTitle: 'Jaundice',
              frontBody: 'JAWN-dis',
              backTitle: 'Jaundice',
              backBody:
                'A yellowing of the skin and the whites of the eyes, caused when the inflamed liver can\'t process a substance called bilirubin. Jaundice is a classic sign of liver trouble, often with dark urine and pale stools — and it\'s reported.',
            },
            {
              id: 'hep-s02-reveal-cirrhosis',
              type: 'reveal_card',
              frontTitle: 'Cirrhosis',
              frontBody: 'Sir-OH-sis',
              backTitle: 'Cirrhosis',
              backBody:
                'Severe, permanent scarring of the liver from long-term damage — including chronic hepatitis B or C. The scarred liver works poorly, leading to serious complications. Cirrhosis is why chronic hepatitis is taken so seriously over the long term.',
            },
            {
              id: 'hep-s02-kc1-check-hep-a',
              type: 'knowledge_check',
              question:
                'Match the term: spreads fecal-oral; usually short-term, not chronic',
              options: [
                { id: 'hepatitis-a', label: 'Hepatitis A' },
                { id: 'hepatitis-bc', label: 'Hepatitis B & C' },
                { id: 'standard-precautions', label: 'Standard precautions' },
              ],
              correctOptionId: 'hepatitis-a',
              explanation:
                'Hepatitis A. Spreads by the fecal-oral route — tiny amounts of an infected person\'s stool reaching another\'s mouth, usually through contaminated food, water, or unwashed hands. It\'s usually short-term, doesn\'t become chronic, and is prevented by good hygiene and a vaccine.',
              requiredForCompletion: true,
            },
            {
              id: 'hep-s02-kc1-check-hep-bc',
              type: 'knowledge_check',
              question:
                'Match the term: bloodborne; can become chronic liver disease',
              options: [
                { id: 'hepatitis-a', label: 'Hepatitis A' },
                { id: 'hepatitis-bc', label: 'Hepatitis B & C' },
                { id: 'standard-precautions', label: 'Standard precautions' },
              ],
              correctOptionId: 'hepatitis-bc',
              explanation:
                'Hepatitis B and C. Bloodborne viruses — spread through blood and certain body fluids, not casual contact. Both can become chronic, slowly damaging the liver over years.',
              requiredForCompletion: true,
            },
            {
              id: 'hep-s02-kc1-check-standard-precautions',
              type: 'knowledge_check',
              question:
                'Match the term: treat all blood and body fluids as potentially infectious',
              options: [
                { id: 'hepatitis-a', label: 'Hepatitis A' },
                { id: 'hepatitis-bc', label: 'Hepatitis B & C' },
                { id: 'standard-precautions', label: 'Standard precautions' },
              ],
              correctOptionId: 'standard-precautions',
              explanation:
                'Standard precautions. The everyday infection-control practices used with every resident, treating all blood and body fluids as potentially infectious. They include hand hygiene, gloves and protective equipment, and safe handling of fluids and sharps.',
              requiredForCompletion: true,
            }
          ]),
      },
      {
        slug: 's03-statistics',
        title: 'Statistics',
        sortOrder: 2,
        buildContent: () =>
          doc('Statistics', [
            { id: 'hep-s03-heading', type: 'heading', level: 1, text: 'Statistics' },
            pendingAudio(
              'hep-s03-audio',
              'Hepatitis and Why Standard Precautions Protect Everyone',
              `${ASSET_BASE}/s03-stats-podcast.mp3`,
              [
                'Hepatitis and Why Standard Precautions Protect Everyone',
                '',
                'Viral hepatitis is far more common than most people realize. Millions of Americans live with chronic hepatitis B or chronic hepatitis C, and globally the numbers are in the hundreds of millions. Here\'s the fact that matters most for a caregiver: a large share of people with chronic hepatitis B or C don\'t know they have it. The infection can quietly damage the liver for years or decades with few or no symptoms, only surfacing when serious liver disease develops. So at any time, some residents — and some staff — carry a bloodborne virus that no one, including them, is aware of.',
                '',
                'That single fact is the entire reason standard precautions exist. Because you can never be certain who is and isn\'t infected, the only safe approach is to treat every resident\'s blood and body fluids as potentially infectious — with everyone, every time. Standard precautions aren\'t about labeling certain residents as "dangerous"; they\'re a universal practice that protects staff and residents alike, precisely because the risk is often invisible. A caregiver who uses good hand hygiene, gloves, and safe fluid and sharps handling with everyone is protected against the infections they know about and the ones nobody knows about yet.',
                '',
                'The three hepatitis types carry different weights. Hepatitis A causes outbreaks through contaminated food and water and poor hand hygiene, but it\'s usually short-term and resolves; good hygiene and a vaccine prevent it. Hepatitis B and C are the serious long-term players — chronic infection can lead, over years, to cirrhosis, liver failure, and liver cancer, and hepatitis is among the leading causes of these worldwide. The encouraging news: hepatitis B is preventable with a safe, effective vaccine that healthcare workers are strongly urged to receive, and hepatitis C is now curable in most people with modern medications.',
                '',
                'For the CNA, the takeaways are practical and empowering. Faithful standard precautions protect you and everyone around you. The hepatitis B vaccine protects you directly — get it. Caring without stigma matters, because assumptions about how someone got hepatitis are both unkind and irrelevant to good care. And recognizing the signs of liver trouble helps residents get care.',
                '',
                'The bottom line: hepatitis is common and often hidden, which is exactly why standard precautions — used with everyone, always — are the foundation of safe care, and why protecting yourself and caring without judgment go hand in hand.',
              ].join('\n'),
              '/assets/courses/hepatitis/s03-stats-podcast.mp3',
            ),
            {
              id: 'hep-s03-image',
              type: 'image',
              src: `${ASSET_BASE}/s03-hero.png`,
              caption:
                'Hepatitis is common and often invisible — standard precautions protect everyone.',
            },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: 'Fundamentals',
        sortOrder: 3,
        buildContent: () =>
          doc('Fundamentals', [
            { id: 'hep-s04-heading', type: 'heading', level: 1, text: 'Fundamentals' },
            {
              id: 'hep-s04-video',
              type: 'video',
              title: 'Fundamentals',
              videoUrl: '/assets/courses/hepatitis/s04-fundamentals.mp4',
              placeholderNote: 'Pending upload: /assets/courses/hepatitis/s04-fundamentals.mp4',
            },
            {
              id: 'hep-s04-image',
              type: 'image',
              src: `${ASSET_BASE}/s04-hero.png`,
              caption:
                'How hepatitis spreads — A by the fecal-oral route, B and C through blood and body fluids.',
            },
            {
              id: 'hep-s04-narration',
              type: 'text',
              body: [
                '**The liver, the body\'s chemical plant**',
                'The liver is the body\'s chemical plant. It filters toxins and waste from the blood, helps digest food by making bile, stores energy and vitamins, makes proteins that let blood clot, and processes nearly every medication. It works constantly and quietly — and because it does so many jobs, when it\'s damaged, the effects ripple through the whole body.',
                '**What hepatitis does**',
                'Hepatitis means the liver is inflamed — irritated and swollen, its cells damaged. When the liver is inflamed, it can\'t do its jobs well: toxins build up, digestion suffers, clotting is affected, and the substance that causes jaundice accumulates. The inflammation can be mild and brief, or severe and long-lasting. Either way, a struggling liver makes the whole person unwell.',
                '**Hepatitis A: the food-and-hands one**',
                'Hepatitis A spreads by the fecal-oral route — when tiny, invisible amounts of an infected person\'s stool reach another person\'s mouth. This happens through contaminated food or water, or through unwashed hands after using the bathroom. It causes an acute, short-term illness — sometimes quite unpleasant — but it does not become chronic, and people recover. Good hand hygiene, especially after toileting and before food, and a vaccine, prevent it.',
                '**Hepatitis B and C: the bloodborne ones**',
                'Hepatitis B and C spread differently — through blood and certain body fluids entering another person\'s body. In healthcare, that means exposure to infected blood through a needlestick, a cut, or contact with broken skin or mucous membranes. They are not spread by casual contact — not by sharing a room, a meal, a hug, or a handshake. This matters for both your safety and your compassion: protect against blood and fluids, but never treat these residents as "untouchable."',
                '**Why B and C are the serious ones**',
                'Hepatitis B and C can become chronic — lasting for years or life — and silently inflame the liver the whole time. Over years, that ongoing damage can scar the liver permanently, called cirrhosis, and lead to liver failure or liver cancer. Many people feel fine for a long time, which is why chronic hepatitis is often discovered late. This slow, hidden, serious course is why these two get the most attention.',
                '**Standard precautions: the universal shield**',
                'Here\'s the protective heart of this course. Because anyone could carry a bloodborne virus — often without knowing — you protect yourself and others by treating all blood and body fluids as potentially infectious, with every resident. That\'s standard precautions: thorough hand hygiene, gloves and other protective equipment when contacting fluids, safe handling and cleanup of anything bloody, and careful sharps handling. Used faithfully with everyone, standard precautions protect against known and unknown infections alike.',
                '**Protect yourself, and care without stigma**',
                'Two final fundamentals. Protect yourself: get the hepatitis B vaccine that\'s strongly recommended for healthcare workers, handle sharps safely, and know your facility\'s exposure plan. And care without stigma: hepatitis sometimes carries unfair judgment about how it was acquired, but how a resident got it is irrelevant to your job. Safe, respectful, warm care is what every resident deserves — and what protects everyone.',
              ].join('\n\n'),
            },
            {
              id: 'hep-s04-ctc-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Standard precautions with everyone, every time',
              body: 'Treat all blood and body fluids as potentially infectious — with every resident. Hepatitis B and C are bloodborne, not spread by casual contact. Protect against blood and fluids; never treat residents as untouchable.',
            }
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
        sortOrder: 4,
        buildContent: () =>
          doc('Signs & Symptoms', [
            { id: 'hep-s05-heading', type: 'heading', level: 1, text: 'Signs & Symptoms' },
            {
              id: 'hep-s05-image',
              type: 'image',
              src: `${ASSET_BASE}/s05-hero.png`,
              caption:
                'Recognizing signs — jaundice, fatigue, dark urine, and the warning signs of liver failure.',
            },
            {
              id: 'hep-s05-narration',
              type: 'text',
              body: [
                'Hepatitis affects the whole body through the liver. Let\'s learn the signs — the acute illness, the jaundice picture, and the signs of advanced liver disease.',
                '**The general signs of hepatitis**',
                'Acute hepatitis often starts with vague, flu-like signs that are easy to overlook: fatigue and weakness, often profound. Loss of appetite and nausea, sometimes vomiting. A low-grade fever and general unwell feeling. Discomfort or pain in the upper right belly, where the liver sits. Muscle and joint aches. In an older resident, these may be subtle. Report a resident who\'s newly fatigued, off their food, and unwell — it\'s worth a look.',
                '**The classic liver signs: jaundice, dark urine, pale stool**',
                'The classic signs point straight at the liver. Jaundice — a yellowing of the skin and, often most visible first, the whites of the eyes — appears when the inflamed liver can\'t process bilirubin. Along with it: dark, tea-colored urine, and pale, clay-colored stools, because that same substance isn\'t moving where it should. And itching, as it builds up in the skin. This trio — yellowing, dark urine, pale stool — is a strong liver signal and is reported promptly.',
                '**The signs of advanced liver disease**',
                'In chronic hepatitis with serious liver damage — cirrhosis — watch for the signs of a failing liver. A swollen, fluid-filled abdomen. Swelling in the legs. Easy bruising and bleeding, because the liver makes clotting proteins. Worsening jaundice. And confusion, drowsiness, or personality changes — when toxins the liver should filter build up and affect the brain. New or worsening confusion in a resident with liver disease is an important, reportable sign, not just "a bad day."',
                '**The signs that need prompt attention**',
                'Some signs need prompt reporting. New or deepening jaundice. Vomiting blood, or black, tarry stools — signs of bleeding that a damaged liver makes more dangerous. A rapidly swelling belly. Increasing confusion or drowsiness. High fever. Severe belly pain. These suggest the liver disease is worsening or a serious complication is developing, and they\'re reported promptly so the team can act.',
                '**Summary**',
                'Four pictures. Acute hepatitis: fatigue, nausea, poor appetite, low fever, upper-right belly discomfort. The liver trio: jaundice, dark urine, pale stools — report. Advanced disease: swollen belly, leg swelling, easy bleeding, confusion. Prompt-report signs: deepening jaundice, vomiting blood or black stools, fast belly swelling, rising confusion, high fever, severe pain.',
                'The rule underneath it all: report the liver trio of jaundice, dark urine, and pale stools; treat new confusion in a liver resident as significant; and escalate bleeding and rapid worsening promptly.',
              ].join('\n\n'),
            },
            {
              id: 'hep-s05-ss-callout',
              type: 'callout',
              variant: 'warning',
              title: 'Jaundice trio and advanced liver disease',
              body: 'Report jaundice, dark urine, and pale stools promptly. New confusion, black tarry stools, and rapid belly swelling in a liver resident need urgent reporting.',
            }
          ]),
      },
      {
        slug: 's06-causes',
        title: 'Causes',
        sortOrder: 5,
        buildContent: () =>
          doc('Causes', [
            { id: 'hep-s06-heading', type: 'heading', level: 1, text: 'Causes' },
            pendingAudio(
              'hep-s06-audio',
              'How Hepatitis Spreads — and How CNAs Prevent It',
              `${ASSET_BASE}/s06-causes-podcast.mp3`,
              [
                'How Hepatitis Spreads — and How CNAs Prevent It',
                '',
                'The three main hepatitis types spread by different routes, and knowing the routes is what makes prevention make sense.',
                '',
                'Hepatitis A spreads by the fecal-oral route: invisible amounts of an infected person\'s stool reaching another person\'s mouth. In practice, that means contaminated food or water, or — the part most relevant in a care setting — unwashed hands carrying the virus from the bathroom to food, surfaces, or other people. This is why thorough hand hygiene, especially after any toileting or incontinence care and before handling food, is the front-line defense, and why hepatitis A can cause outbreaks where hygiene lapses. A vaccine also prevents it.',
                '',
                'Hepatitis B and C are bloodborne: they spread when infected blood, or certain body fluids, enter another person\'s body. In healthcare, the main risks are a needlestick or sharps injury, a cut or break in the skin contacting infected blood, or splashes of blood to the eyes, nose, or mouth. Hepatitis B is quite infectious through blood; hepatitis C is mainly spread through blood-to-blood contact. Crucially, neither spreads through casual contact — not through sharing a room, eating together, hugging, shaking hands, or normal social closeness. Understanding this protects your compassion as much as your safety: you guard against blood and fluids, not against the person.',
                '',
                'So how does a CNA prevent transmission of all of them? With standard precautions, used universally. Thorough hand hygiene — the single most important measure, before and after every resident and after any fluid contact. Gloves and other protective equipment whenever you might contact blood or body fluids, and changed between residents and tasks. Safe handling and cleanup of blood and fluid spills using facility procedures. And careful sharps handling — never recapping needles, using safety devices, and disposing of sharps immediately in the proper container — because a needlestick is the classic bloodborne exposure. For hepatitis A specifically, scrupulous hand and food hygiene; for hepatitis B, the vaccine.',
                '',
                'And one more form of prevention that\'s purely human: caring without stigma. People acquire hepatitis many ways, and a caregiver\'s job is never to judge how. Stigma drives shame and secrecy; respect and safe universal precautions protect everyone. The CNA who treats every resident\'s fluids as potentially infectious, and every resident as fully worthy of respect, prevents both infection and harm.',
              ].join('\n'),
              '/assets/courses/hepatitis/s06-causes-podcast.mp3',
            ),
            {
              id: 'hep-s06-image',
              type: 'image',
              src: `${ASSET_BASE}/s06-hero.png`,
              caption:
                'Why standard precautions matter — treat every resident\'s blood and body fluids as infectious.',
            },
          ]),
      },
      {
        slug: 's07-role',
        title: 'CNA Role & Best Practices',
        sortOrder: 6,
        buildContent: () =>
          doc('CNA Role & Best Practices', [
            { id: 'hep-s07-heading', type: 'heading', level: 1, text: 'CNA Role & Best Practices' },
            {
              id: 'hep-s07-image',
              type: 'image',
              src: `${ASSET_BASE}/s07-hero.png`,
              caption:
                'CNA scope — standard precautions, observation, and dignity; never give meds or judge the diagnosis.',
            },
            {
              id: 'hep-s07-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of practice',
              body: 'CNAs apply standard precautions, protect themselves, and support the resident. CNAs never diagnose hepatitis, give or adjust medications, or interpret lab results.',
            },
            {
              id: 'hep-s07-narration',
              type: 'text',
              body: [
                'Hepatitis treatment is managed by the medical team — and the CNA\'s job is faithful standard precautions, supportive care, self-protection, and reporting. Let\'s walk through it, starting with the rule that never bends. A CNA does not diagnose hepatitis, does not give or adjust medications, and does not interpret lab results.',
                '**Standard precautions — your daily protection, with everyone.** This is the core. Thorough hand hygiene before and after every resident and after any fluid contact — the single most important thing you do. Gloves and protective equipment whenever you might contact blood or body fluids, changed between residents and tasks. Safe handling and cleanup of fluid spills per facility procedure. And careful sharps handling — never recap needles, use safety devices, dispose of sharps immediately in the proper container. Applied with every resident, every time, standard precautions protect against hepatitis B, C, and every other bloodborne and contact infection — known or unknown.',
                '**Self-protection — the hepatitis B vaccine and the exposure plan.** Protect yourself deliberately. The hepatitis B vaccine is safe, effective, and strongly recommended for healthcare workers — get it; it\'s free in most workplaces and protects you for life. Know your facility\'s exposure plan before you ever need it. And know the exposure response: if you have a needlestick, a cut exposed to blood, or a blood splash to your eyes, nose, or mouth, wash the area immediately — flush eyes or mouth with water — and report it to your supervisor right away, because prompt evaluation and possible preventive treatment matter and are time-sensitive. Never hide an exposure.',
                '**Supportive care for the resident.** Hepatitis treatment depends on the type — rest and supportive care for acute hepatitis A, and antiviral medications managed by the team for chronic B and C, with hepatitis C now often curable. Your supportive role: encourage rest, support nutrition and hydration and report poor intake, support the liver-protective plan — which often means avoiding alcohol and being cautious with medications the liver processes, all managed by the team — and watch for and report the signs of worsening.',
                '**Comfort, skin, and safety.** Manage symptoms within your role — comfort for nausea and fatigue, gentle skin care for the itching of jaundice, and fall precautions if the resident is weak or confused. For a resident with advanced liver disease and confusion, extra safety and supervision matter.',
                '**Stigma-free support.** Deliver all of it without judgment. Warmth, respect, normal human contact — remembering these viruses don\'t spread by casual contact — and never letting a resident feel "dirty" or shamed. Compassion is part of the care.',
                'The scope point for this section: you never diagnose, medicate, or read labs — but you apply standard precautions faithfully, protect yourself through vaccination and the exposure plan, support the resident\'s rest and nutrition, and report worsening. Universal precautions and self-protection are the treatment you deliver.',
              ].join('\n\n'),
            }
          ]),
      },
      {
        slug: 's08-prevention',
        title: 'Prevention & Risk Reduction',
        sortOrder: 7,
        buildContent: () =>
          doc('Prevention & Risk Reduction', [
            { id: 'hep-s08-heading', type: 'heading', level: 1, text: 'Prevention & Risk Reduction' },
            {
              id: 'hep-s08-image',
              type: 'image',
              src: `${ASSET_BASE}/s08-hero.png`,
              caption:
                'Protecting yourself and residents — gloves, hand hygiene, and safe handling of sharps and fluids.',
            },
            {
              id: 'hep-s08-narration',
              type: 'text',
              body: [
                'Preventing hepatitis and other infections is daily CNA work, built on standard precautions. Here are seven ways — and these protect you across every infection you\'ll ever face.',
                '**One. Wash your hands — the single most powerful step.** Thorough hand hygiene before and after every resident, after any contact with blood or body fluids, after toileting and incontinence care, before handling food, and after removing gloves. Hand hygiene is the most important infection prevention there is. Make it automatic and complete, not rushed.',
                '**Two. Use gloves and protective equipment correctly.** Wear gloves whenever you might contact blood or body fluids, broken skin, or mucous membranes, and add gowns, masks, or eye protection when splashes are possible. Change gloves between residents and between tasks, and wash hands after removing them — gloves are not a substitute for handwashing.',
                '**Three. Handle blood, fluids, and spills safely.** Treat all blood and body fluids as potentially infectious. Handle soiled linens and waste per facility procedure, clean spills using the right products and steps, and never let blood or fluids contact your skin, eyes, or mouth. Safe handling protects you from what you can and can\'t see.',
                '**Four. Handle sharps with extreme care.** Needlesticks are the classic bloodborne exposure. Never recap needles, use safety-engineered devices, and dispose of sharps immediately into the proper puncture-proof container — never overfill it, never reach into it. If you find an improperly discarded sharp, handle it per policy. Sharps safety prevents the most direct exposure there is.',
                '**Five. Protect yourself with the hepatitis B vaccine.** Get the hepatitis B vaccine offered to healthcare workers — it\'s safe, effective, and protects you for life. It\'s one of the simplest, strongest things you can do for your own safety in this career. Don\'t put it off.',
                '**Six. Know and use the exposure plan.** Know your facility\'s exposure procedure before you need it. If you\'re ever exposed — a needlestick, a cut, a splash to eyes, nose, or mouth — wash or flush the area immediately and report it to your supervisor right away. Prompt evaluation and preventive treatment are time-sensitive, and reporting is never something to delay or hide.',
                '**Seven. Practice hand and food hygiene against hepatitis A.** For the fecal-oral spread of hepatitis A, scrupulous hand hygiene after every toileting and incontinence care, and before any food handling, is the key — and supporting residents\' hand hygiene too, especially before meals. Clean hands break the fecal-oral chain.',
              ].join('\n\n'),
            }
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
        sortOrder: 8,
        buildContent: () =>
          doc('Scenario & Reporting', [
            { id: 'hep-s09-heading', type: 'heading', level: 1, text: 'Scenario & Reporting' },
            pendingAudio(
              'hep-s09-intro-audio',
              'Emergency response scenarios intro',
              `${ASSET_BASE}/s09-emergency-intro.mp3`,
              'With hepatitis, the judgments that matter most are protecting yourself correctly after a blood exposure, and recognizing when a resident\'s liver disease is becoming dangerous. You\'re about to work through two situations. Read each carefully, choose your action, and you\'ll get feedback right away. Keep the core ideas in mind: a blood exposure means wash now and report immediately — and new confusion or bleeding in a liver resident is serious.',
              '/assets/courses/hepatitis/s09-emergency-intro.mp3',
            ),
            {
              id: 'hep-s09-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-hero.png`,
              caption:
                'Two hepatitis judgments — a needlestick exposure to act on, and a resident\'s failing liver.',
            },
            {
              id: 'hep-s09-scenario-needlestick-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-scenario-needlestick.png`,
              caption:
                'Stuck by a used needle: wash the site right away, report immediately, and start the exposure protocol.',
            },
            {
              id: 'hep-s09-scenario-needlestick',
              type: 'scenario_question',
              prompt:
                'While disposing of supplies, you\'re accidentally stuck by a used needle that wasn\'t placed in the sharps container properly. It breaks your skin and there\'s a tiny bit of blood. You feel embarrassed and worried, and a coworker says, "It\'s just a tiny poke — don\'t make a big deal, just wash it and finish your shift." What SHOULD the CNA do?',
              options: [
                {
                  id: 'wash-say-nothing',
                  label: 'Just wash it and say nothing, to avoid making a fuss',
                  feedback:
                    'A needlestick from a used needle is a real bloodborne exposure, however small. Hiding it or waiting wastes time that matters — some preventive treatments are most effective started quickly. The right action: wash the area immediately and report it to your supervisor right away, following the exposure plan. Never hide an exposure.',
                },
                {
                  id: 'wash-report-now',
                  label:
                    'Wash the area immediately and report the needlestick to the supervisor right away, following the exposure plan',
                  feedback:
                    'Right. A needlestick from a used needle is a potential bloodborne exposure — to hepatitis B, hepatitis C, or HIV — and it must be handled promptly and by the book, no matter how small the poke looks. Wash the area immediately with soap and water, then report it to your supervisor right away and follow your facility\'s exposure plan. This matters because evaluation and any preventive treatment are time-sensitive — for some exposures, treatment works best when started quickly. Never hide an exposure out of embarrassment or fear of "making a fuss"; reporting protects your health, and exposure reports also help fix the unsafe sharps disposal that caused it. Wash now, report now — every time.',
                  isRecommended: true,
                },
                {
                  id: 'wait-end-shift',
                  label: 'Wait until the end of the shift to mention it',
                  feedback:
                    'A needlestick from a used needle is a real bloodborne exposure, however small. Hiding it or waiting wastes time that matters — some preventive treatments are most effective started quickly. The right action: wash the area immediately and report it to your supervisor right away, following the exposure plan. Never hide an exposure.',
                },
                {
                  id: 'bandage-hope',
                  label: 'Apply a bandage and hope for the best',
                  feedback:
                    'A needlestick from a used needle is a real bloodborne exposure, however small. Hiding it or waiting wastes time that matters — some preventive treatments are most effective started quickly. The right action: wash the area immediately and report it to your supervisor right away, following the exposure plan. Never hide an exposure.',
                },
              ],
              requiredForCompletion: true,
            },
            {
              id: 'hep-s09-scenario-petrov-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-scenario-petrov.png`,
              caption:
                'Chronic liver disease now with confusion, swelling, and black tarry stool: urgent complications — report now.',
            },
            {
              id: 'hep-s09-scenario-petrov',
              type: 'scenario_question',
              prompt:
                'Mr. Petrov has chronic hepatitis with known liver damage. Today he\'s different: he\'s increasingly confused and drowsy, not himself, his abdomen looks more swollen than usual, and you notice his stool in the toilet is black and tarry. What SHOULD the CNA do?',
              options: [
                {
                  id: 'sleep-it-off',
                  label: 'Assume he\'s just tired and let him sleep it off',
                  feedback:
                    'New confusion, more belly swelling, and black tarry stool in a liver-disease resident are serious together — they can signal toxins building in the brain, worsening fluid, and dangerous digestive bleeding made worse by poor clotting. Letting him sleep or waiting could be dangerous. The right action: report all of it to the nurse promptly.',
                },
                {
                  id: 'report-promptly',
                  label:
                    'Report the new confusion, increased belly swelling, and black tarry stool to the nurse promptly',
                  feedback:
                    'Right. In a resident with liver disease, several alarming things are happening at once. New confusion and drowsiness can mean toxins the failing liver should filter are building up and affecting his brain — a serious complication. The increased belly swelling suggests fluid building from worsening liver disease. And black, tarry stool is a classic sign of bleeding in the digestive tract — especially dangerous because a damaged liver makes less of the proteins needed to clot blood, so bleeding can be severe. Each of these is significant; together they signal his liver disease may be seriously decompensating. Report all of it to the nurse promptly with the full picture. This is not a "let him sleep it off" situation — it needs prompt medical attention.',
                  isRecommended: true,
                },
                {
                  id: 'big-meal',
                  label: 'Encourage him to eat a big meal for energy',
                  feedback:
                    'New confusion, more belly swelling, and black tarry stool in a liver-disease resident are serious together — they can signal toxins building in the brain, worsening fluid, and dangerous digestive bleeding made worse by poor clotting. Letting him sleep or waiting could be dangerous. The right action: report all of it to the nurse promptly.',
                },
                {
                  id: 'wait-tomorrow',
                  label: 'Wait until tomorrow to see if he improves',
                  feedback:
                    'New confusion, more belly swelling, and black tarry stool in a liver-disease resident are serious together — they can signal toxins building in the brain, worsening fluid, and dangerous digestive bleeding made worse by poor clotting. Letting him sleep or waiting could be dangerous. The right action: report all of it to the nurse promptly.',
                },
              ],
              requiredForCompletion: true,
            }
          ]),
      },
      {
        slug: 's10-cna-role',
        title: "CNA's Role in Care",
        sortOrder: 9,
        buildContent: () =>
          doc("CNA's Role in Care", [
            { id: 'hep-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
              id: 'hep-s10-video',
              type: 'video',
              title: "The CNA's Role",
              videoUrl: '/assets/courses/hepatitis/s10-cna-role.mp4',
              placeholderNote: 'Pending upload: /assets/courses/hepatitis/s10-cna-role.mp4',
            },
            {
              id: 'hep-s10-image',
              type: 'image',
              src: `${ASSET_BASE}/s10-hero.png`,
              caption:
                'The CNA as the daily observer — noticing jaundice or confusion early helps protect the resident.',
            },
            {
              id: 'hep-s10-narration',
              type: 'text',
              body: [
                'Your role in hepatitis care is protection, support, self-protection, and respect. Let\'s walk through it.',
                '**Apply standard precautions faithfully** Your first duty protects everyone: standard precautions with every resident, every time. Thorough hand hygiene before and after care and after any fluid contact. Gloves and protective equipment when blood or body fluids are possible, changed between residents and tasks. Safe handling of fluids, spills, linens, and sharps. This universal practice protects you and your residents from hepatitis and every other infection — including the ones nobody knows about.',
                '**Protect yourself deliberately** Guard your own health. Get the hepatitis B vaccine. Handle sharps with extreme care and never recap a needle. Know your exposure plan, and if you\'re ever exposed, wash or flush immediately and report it right away — never hide an exposure. Your safety isn\'t separate from good care; a protected, healthy caregiver is what residents need.',
                '**Support the resident and watch the liver** Support the resident\'s recovery and comfort: encourage rest, support nutrition and hydration, support the liver-protective plan the team sets, and provide comfort for nausea, fatigue, and the itching of jaundice. And watch the liver — report the jaundice trio, new confusion, increased belly swelling, bleeding signs, and any worsening. Your observations help the team catch complications early.',
                '**Care without stigma, and report** Care for the whole person without judgment. Remember these viruses don\'t spread by casual contact, so offer normal warmth and human connection, and never let a resident feel shamed or "dirty" about their diagnosis. How they got it is irrelevant; their dignity is not. And report clearly — observations, worsening signs, and your own exposures — promptly and specifically.',
                'Now the boundary. You do not diagnose hepatitis. You do not give or adjust medications or interpret labs. And you never skip standard precautions, never recap a needle, never hide an exposure, and never treat a resident with stigma.',
                'Inside your role — universal precautions, deliberate self-protection, supportive watchful care, and stigma-free respect — you protect yourself, your residents, and everyone around you, while caring for the person with warmth. That combination of safety and compassion is the whole of this care.',
              ].join('\n\n'),
            },
            {
              id: 'hep-s10-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Stay within scope',
              body: 'You do not diagnose hepatitis, give or adjust medications, or interpret labs. Apply standard precautions with everyone, protect yourself, support the resident, and report faithfully.',
            }
          ]),
      },
      {
        slug: 's11-case-study',
        title: 'Case Study',
        sortOrder: 10,
        buildContent: () => {
          const caseNarrative = [
            'Nia was a new CNA, conscientious and a little anxious about doing things right. On her unit was Mr. Abara, a quiet, kind man who happened to have chronic hepatitis C — and Nia noticed that a couple of staff treated him differently: a little distant, a little reluctant, as if his diagnosis made him someone to keep at arm\'s length. It bothered her, and she wasn\'t sure what was correct.',
            '',
            '**What Nia had learned:** Nia thought back to her training, and two ideas anchored her. First, the science: hepatitis C is bloodborne — it spreads through blood, not through casual contact, so sharing a room, helping Mr. Abara eat, talking with him, or giving him a reassuring touch carried no risk. The distance some staff kept wasn\'t precaution; it was stigma. Second, the real protection: standard precautions, used with everyone, are what actually keep staff and residents safe — not singling out the residents whose diagnoses you happen to know.',
            '',
            '**How Nia practiced:** So Nia did two things consistently. She used flawless standard precautions with every resident on the unit — thorough hand hygiene, gloves whenever blood or body fluids were possible, careful sharps handling, safe cleanup — not just with Mr. Abara, but with everyone, because she understood that the residents with undiagnosed hepatitis or other bloodborne infections were exactly the ones no warning label would identify. And she treated Mr. Abara with the same warmth and normal human contact as anyone else — sitting with him, helping him without hesitation, never letting him feel like a hazard.',
            '',
            '**The moment it mattered:** One day, another resident on the unit — Mrs. Calloway, who had no known infectious diagnosis at all — had a bleeding nosebleed that got blood on the bed rail and Nia\'s gloves. Because Nia used full standard precautions with everyone as a matter of habit, she was already gloved, she cleaned the spill correctly, she handled everything safely, and she did thorough hand hygiene afterward. Later it emerged that Mrs. Calloway had an undiagnosed bloodborne infection nobody had known about. Nia had been fully protected — not because she\'d been warned, but because she protected herself the same way with everyone.',
            '',
            '**What Nia understood:** That was the lesson crystallized. The resident whose diagnosis she knew — Mr. Abara — was never the source of risk to anyone, because casual care of him carried none, and her standard precautions covered the rest. The actual exposure risk came from a resident no one suspected. Standard precautions used universally had protected her precisely because they don\'t depend on knowing who\'s infected — and her stigma-free care had protected Mr. Abara\'s dignity at the same time.',
            '',
            '**The outcome:** Nia stayed safe through a real blood exposure from an unexpected source. Mr. Abara, for his part, had at least one caregiver who made him feel fully human rather than fully contagious. And Nia had learned, in the most concrete way possible, why the two halves of this course belong together. The nurse, hearing how she\'d handled the spill, told her: "You were protected because you protect yourself the same way with everybody. That\'s the whole point of standard precautions — they cover the risks you can\'t see. And you never made Mr. Abara feel like the danger, because he wasn\'t. You got both halves right."',
            '',
            '**Discussion:** Nia\'s case shows why standard precautions and stigma-free care aren\'t two separate lessons but one. She understood the science — bloodborne means blood, not casual contact — so she neither over-feared Mr. Abara nor under-protected herself. She used full precautions with everyone, which is exactly why an unexpected exposure from an undiagnosed resident found her already protected. And she gave the resident whose status she knew the dignity of normal human care. Protect against all blood and fluids, judge no one, and you protect everyone — including yourself, and including the residents whose diagnoses you\'ll never know.',
          ].join('\n');

          return doc('Case Study', [
            { id: 'hep-s11-heading', type: 'heading', level: 1, text: 'Case Study' },
            pendingAudio(
              'hep-s11-audio',
              'The Precaution That Protected Everyone',
              `${ASSET_BASE}/s11-case-podcast.mp3`,
              caseNarrative,
              '/assets/courses/hepatitis/s11-case-podcast.mp3',
            ),
            {
              id: 'hep-s11-image',
              type: 'image',
              src: `${ASSET_BASE}/s11-hero.png`,
              caption:
                'Recognizing the pattern — how standard precautions and observation kept everyone safe.',
            },
            {
              id: 'hep-s11-case-study',
              type: 'case_study',
              title: 'The Precaution That Protected Everyone',
              residentProfile:
                'Nia was a new CNA, conscientious and a little anxious about doing things right. On her unit was Mr. Abara, a quiet, kind man who happened to have chronic hepatitis C — and Nia noticed that a couple of staff treated him differently: a little distant, a little reluctant, as if his diagnosis made him someone to keep at arm\'s length. It bothered her, and she wasn\'t sure what was correct.',
              scenario: [
                '**What Nia had learned:** Nia thought back to her training, and two ideas anchored her. First, the science: hepatitis C is bloodborne — it spreads through blood, not through casual contact, so sharing a room, helping Mr. Abara eat, talking with him, or giving him a reassuring touch carried no risk. The distance some staff kept wasn\'t precaution; it was stigma. Second, the real protection: standard precautions, used with everyone, are what actually keep staff and residents safe — not singling out the residents whose diagnoses you happen to know.',
                '**How Nia practiced:** So Nia did two things consistently. She used flawless standard precautions with every resident on the unit — thorough hand hygiene, gloves whenever blood or body fluids were possible, careful sharps handling, safe cleanup — not just with Mr. Abara, but with everyone, because she understood that the residents with undiagnosed hepatitis or other bloodborne infections were exactly the ones no warning label would identify. And she treated Mr. Abara with the same warmth and normal human contact as anyone else — sitting with him, helping him without hesitation, never letting him feel like a hazard.',
                '**The moment it mattered:** One day, another resident on the unit — Mrs. Calloway, who had no known infectious diagnosis at all — had a bleeding nosebleed that got blood on the bed rail and Nia\'s gloves. Because Nia used full standard precautions with everyone as a matter of habit, she was already gloved, she cleaned the spill correctly, she handled everything safely, and she did thorough hand hygiene afterward. Later it emerged that Mrs. Calloway had an undiagnosed bloodborne infection nobody had known about. Nia had been fully protected — not because she\'d been warned, but because she protected herself the same way with everyone.',
                '**What Nia understood:** That was the lesson crystallized. The resident whose diagnosis she knew — Mr. Abara — was never the source of risk to anyone, because casual care of him carried none, and her standard precautions covered the rest. The actual exposure risk came from a resident no one suspected. Standard precautions used universally had protected her precisely because they don\'t depend on knowing who\'s infected — and her stigma-free care had protected Mr. Abara\'s dignity at the same time.',
                '**The outcome:** Nia stayed safe through a real blood exposure from an unexpected source. Mr. Abara, for his part, had at least one caregiver who made him feel fully human rather than fully contagious. And Nia had learned, in the most concrete way possible, why the two halves of this course belong together. The nurse, hearing how she\'d handled the spill, told her: "You were protected because you protect yourself the same way with everybody. That\'s the whole point of standard precautions — they cover the risks you can\'t see. And you never made Mr. Abara feel like the danger, because he wasn\'t. You got both halves right."',
                '**Discussion:** Nia\'s case shows why standard precautions and stigma-free care aren\'t two separate lessons but one. She understood the science — bloodborne means blood, not casual contact — so she neither over-feared Mr. Abara nor under-protected herself. She used full precautions with everyone, which is exactly why an unexpected exposure from an undiagnosed resident found her already protected. And she gave the resident whose status she knew the dignity of normal human care. Protect against all blood and fluids, judge no one, and you protect everyone — including yourself, and including the residents whose diagnoses you\'ll never know.',
              ].join('\n\n'),
            },
            {
              id: 'hep-s11-reflection-1',
              type: 'reflection',
              prompt:
                'The real exposure risk came from Mrs. Calloway, who had no known diagnosis — not from Mr. Abara, whose hepatitis C was known. Why does this show that standard precautions must be used with everyone, not just residents with known infections?',
              minCharacters: 50,
            },
            {
              id: 'hep-s11-reflection-2',
              type: 'reflection',
              prompt:
                'Some staff kept their distance from Mr. Abara. Why was that stigma rather than precaution, and how did Nia\'s understanding of how hepatitis C spreads let her care for him without fear and without judgment?',
              minCharacters: 50,
            },
            {
              id: 'hep-s11-rp-text',
              type: 'text',
              body: 'Reflect on the case study in the previous lesson. Your written responses help you apply what you learned about universal standard precautions, caring without stigma, and protecting yourself from unexpected exposures.',
            },
            {
              id: 'hep-s11-kc2-check',
              type: 'knowledge_check',
              question:
                'A CNA does not diagnose hepatitis, does not give or adjust medications, and does not interpret lab results. Mr. Petrov has chronic hepatitis with known liver damage. Today he\'s different: he\'s increasingly confused and drowsy, not himself, his abdomen looks more swollen than usual, and you notice his stool in the toilet is black and tarry. What SHOULD the CNA do?',
              options: [
                {
                  id: 'sleep-it-off',
                  label: 'Assume he\'s just tired and let him sleep it off',
                },
                {
                  id: 'report-promptly',
                  label:
                    'Report the new confusion, increased belly swelling, and black tarry stool to the nurse promptly',
                },
                {
                  id: 'big-meal',
                  label: 'Encourage him to eat a big meal for energy',
                },
                {
                  id: 'wait-tomorrow',
                  label: 'Wait until tomorrow to see if he improves',
                },
              ],
              correctOptionId: 'report-promptly',
              explanation:
                'You never diagnose, medicate, or read labs — but your prompt reporting of new confusion, increased belly swelling, and black tarry stool supports the medical attention a decompensating liver resident needs.',
              requiredForCompletion: true,
              meta: { flaggedFiller: true },
            },
          ]);
        },
      },
      {
        slug: 's12-conclusion',
        title: 'Conclusion',
        sortOrder: 11,
        buildContent: () =>
          doc('Conclusion', [
            { id: 'hep-s12-heading', type: 'heading', level: 1, text: 'Conclusion' },
            {
              id: 'hep-s12-video',
              type: 'video',
              title: 'Conclusion',
              videoUrl: '/assets/courses/hepatitis/s12-conclusion.mp4',
              placeholderNote: 'Pending upload: /assets/courses/hepatitis/s12-conclusion.mp4',
            },
            {
              id: 'hep-s12-image',
              type: 'image',
              src: `${ASSET_BASE}/s12-hero.png`,
              caption: 'Five things that matter most in caring for residents with hepatitis.',
            },
            {
              id: 'hep-s12-narration',
              type: 'text',
              body: [
                'You\'ve reached the end. Let\'s lock in the five things that matter most for hepatitis care — and for protecting yourself across every infection.',
                '**One.** Hepatitis is inflammation of the liver, most often from the A, B, and C viruses. Hepatitis A spreads fecal-oral and is usually short-term; hepatitis B and C are bloodborne and can become chronic, slowly damaging the liver toward cirrhosis, failure, or cancer. The liver does hundreds of jobs, so hepatitis affects the whole body.',
                '**Two.** Standard precautions are the foundation — use them with everyone, every time. Because anyone could carry a bloodborne virus, often without knowing, treat all blood and body fluids as potentially infectious. Thorough hand hygiene, gloves and protective equipment, safe fluid and spill handling, and careful sharps practice protect you and everyone — against known and unknown infections alike.',
                '**Three.** Protect yourself deliberately. Get the hepatitis B vaccine offered to healthcare workers. Never recap needles and handle sharps with care. And know the exposure response cold: if you\'re ever stuck or splashed, wash or flush immediately and report to your supervisor right away — promptly, never hidden.',
                '**Four.** Watch the liver and recognize worsening. Report the jaundice trio — yellowing, dark urine, pale stools. Treat new confusion in a liver resident as significant — it can mean toxins building in the brain. And escalate bleeding signs like black tarry stools and rapid belly swelling promptly.',
                '**Five.** Care without stigma, and honor your scope. These viruses don\'t spread by casual contact, so offer normal warmth and never let a resident feel shamed. You never diagnose, medicate, or read labs — but you apply universal precautions, protect yourself, support the resident, and report. Safety and compassion, together, are the care.',
              ].join('\n\n'),
            },
            {
              id: 'hep-s12-summary',
              type: 'summary',
              title: 'Five things that matter most',
              items: [
                'Hepatitis inflames the liver — A is fecal-oral; B and C are bloodborne and can become chronic.',
                'Standard precautions with everyone, every time — treat all blood and body fluids as potentially infectious.',
                'Protect yourself — get the hepatitis B vaccine, handle sharps safely, and report exposures immediately.',
                'Watch the liver — report the jaundice trio, new confusion, and bleeding signs promptly.',
                'Care without stigma — apply universal precautions, support the resident, and honor your scope.',
              ],
            },
            {
              id: 'hep-s12-whn-text',
              type: 'text',
              body: 'Ten questions are waiting. Everything on them was covered here. You\'re ready. Trust what you\'ve learned, and show what you know.',
            },
            {
              id: 'hep-s12-cr-text',
              type: 'text',
              body: 'This course provides one hour of continuing education credit through CAL ACE Nursing Academy, an approved CDPH continuing education provider, NAC number 7384. Your certificate is generated automatically when you pass the knowledge check.',
            },
            {
              id: 'hep-s12-cr-callout',
              type: 'callout',
              variant: 'info',
              title: 'Scope reminder',
              body: 'CNAs apply standard precautions, support without stigma, and report faithfully. CNAs do not diagnose hepatitis, give or adjust medications, or interpret lab results.',
            },
            {
              id: 'hep-s12-ca-text',
              type: 'text',
              body: 'Your certificate is generated automatically when you pass the knowledge check. CDPH-Approved CE Provider — NAC #7384.',
            }
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

export async function seedCourse40Hepatitis(
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
  console.log(`Seeding Course 40 (Caring for a Resident with Hepatitis (A, B & C)) as DRAFT — slug "${COURSE_SLUG}"…`);

  try {
    const result = await seedCourse40Hepatitis(prisma);
    const blockCounts = blockCountsByLesson();
    const totalBlocks = Object.values(blockCounts).reduce((sum, count) => sum + count, 0);

    console.log('Seed complete.');
    console.log(`  Course:   ${COURSE_TITLE}`);
    console.log(`  Slug:     ${COURSE_SLUG}`);
    console.log(`  Created:  ${result.courseCreated ? 'yes (new)' : 'no (updated existing)'}`);
    console.log(`  Modules:  ${result.modulesUpserted}`);
    console.log(`  Lessons:  ${result.lessonsUpserted}`);
    console.log(`  Strays cleaned: ${result.strayLessonsDeleted} lessons`);
    console.log(`  Sections: ${PACKAGE_SECTION_LESSON_SLUGS.length} package sections mapped`);
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
