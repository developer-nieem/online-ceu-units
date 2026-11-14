/**
 * Seed Course 43 — COVID-19 & Emerging Respiratory Infections (DRAFT).
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-43-covid-respiratory-illness
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
const COURSE_SLUG = 'covid-respiratory-illness';
const COURSE_TITLE = 'Respiratory Outbreaks: COVID-19 and Emerging Infection Precautions';
const COURSE_SUMMARY =
  'Learn the CNA\'s role with COVID-19 and other respiratory infections — understanding how respiratory viruses spread, droplet and airborne precautions and respiratory PPE, recognizing respiratory illness and danger signs in elders, supporting isolated residents without stigma, outbreak awareness, and the emerging-pathogen mindset. CNAs do not diagnose, prescribe or adjust medications, decide isolation status, or interpret tests.';

const ASSET_BASE = `/assets/courses/covid-respiratory-illness`;


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
    'Explain how respiratory viruses spread.',
    'Use respiratory precautions and PPE.',
    'Recognize respiratory danger signs in elders.',
    'Support isolated residents.',
    'Apply the emerging-infection mindset.',
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
  heroImage: '/assets/courses/covid-respiratory-illness/hero-banner.png',
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
    title: 'Understanding COVID & Respiratory Infections',
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: 'Introduction',
        sortOrder: 0,
        buildContent: () =>
          doc('Welcome', [
            { id: 'cri-s01-heading', type: 'heading', level: 1, text: 'Welcome' },
            {
              id: 'cri-s01-video',
              type: 'video',
              title: 'Introduction',
              videoUrl: '/assets/courses/covid-respiratory-illness/s01-intro.mp4',
              placeholderNote:
                'Pending upload: /assets/courses/covid-respiratory-illness/s01-intro.mp4',
            },
            {
              id: 'cri-s01-image',
              type: 'image',
              src: `${ASSET_BASE}/s01-hero.png`,
              caption:
                'COVID-19 and respiratory illness — protecting residents through vigilance and precautions.',
            },
            {
              id: 'cri-s01-narration',
              type: 'text',
              body: [
                'Welcome to CAL ACE Nursing Academy.',
                'This course is about COVID-19 and other respiratory infections — including influenza, RSV, and the new respiratory viruses that will inevitably emerge in the future. And it completes our infection-control series by teaching the last major way infections spread: through the air we breathe.',
                'Respiratory infections deserve serious attention in long-term care for a hard reason we all lived through. Older adults and people with chronic illness — exactly the residents you care for — are the most vulnerable to severe respiratory illness, hospitalization, and death. COVID-19 made this devastatingly clear: long-term care facilities were among the hardest-hit places anywhere, and respiratory viruses can sweep through a facility of vulnerable residents with terrible speed. Influenza and RSV, every year, do real harm to elders too. These infections are not "just a cold" in the population you serve.',
                'Respiratory viruses spread differently from the bloodborne and contact organisms you\'ve already studied. They spread mainly through respiratory droplets and particles — released when an infected person breathes, talks, coughs, or sneezes — that another person breathes in or picks up from surfaces. This is why the protections are different: masks and respirators, distancing, ventilation, covering coughs, and droplet or airborne precautions, layered on top of the hand hygiene and standard precautions you already know.',
                'This course also teaches something larger than any one virus: the emerging-infection mindset. New respiratory pathogens will appear — that\'s certain. The CNA who understands how respiratory viruses spread, how to use respiratory PPE, how to recognize illness early, and how to respond in an outbreak is prepared not just for COVID and flu, but for whatever comes next. The principles outlast the particular virus.',
                'And, as with every infectious condition, there\'s the human side. Residents isolated for a respiratory infection — confined to their rooms, visited by masked staff, cut off from others — suffer real loneliness, fear, and decline. A CNA follows every precaution faithfully AND fights that isolation with connection and warmth.',
                'Your scope is clear. A CNA follows droplet and airborne precautions, uses respiratory PPE correctly, recognizes respiratory illness and danger signs, supports isolated residents without stigma, supports outbreak response, and reports. A CNA does not diagnose, does not prescribe or adjust medications, does not decide isolation status, and does not interpret tests.',
                'By the end of this course, you will be able to: explain how respiratory viruses spread. Use respiratory precautions and PPE. Recognize respiratory danger signs in elders. Support isolated residents. And apply the emerging-infection mindset. Let\'s begin.',
              ].join('\n\n'),
            },
            {
              id: 'cri-s01-ci-text',
              type: 'text',
              body: [
                'This course teaches the CNA\'s role with COVID-19 and other respiratory infections — understanding how respiratory viruses spread, droplet and airborne precautions and respiratory PPE, recognizing respiratory illness and danger signs in elders, supporting isolated residents without stigma, outbreak awareness, and the emerging-pathogen mindset.',
                'Let\'s be clear about your role. A CNA follows droplet and airborne precautions, uses respiratory PPE correctly, recognizes respiratory illness and danger signs, supports isolated residents without stigma, supports outbreak response, and reports faithfully. A CNA does not diagnose, does not prescribe or adjust medications, does not decide isolation status, and does not interpret tests. Those are nursing and medical-team tasks. But none of them can happen without your faithful precautions and early recognition first.',
              ].join('\n\n'),
            },
            {
              id: 'cri-s01-ci-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of this course',
              body: 'CNAs follow respiratory precautions, use PPE correctly, recognize illness, support isolated residents, and report. CNAs do not diagnose, prescribe or adjust medications, decide isolation status, or interpret tests.',
            },
            {
              id: 'cri-s01-lo-text',
              type: 'text',
              body: 'By the end of this course, you will be able to:',
            },
            {
              id: 'cri-s01-lo-summary',
              type: 'summary',
              title: 'Learning objectives',
              items: [
                'Explain how respiratory viruses spread.',
                'Use respiratory precautions and PPE.',
                'Recognize respiratory danger signs in elders.',
                'Support isolated residents.',
                'Apply the emerging-infection mindset.',
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
            { id: 'cri-s02-heading', type: 'heading', level: 1, text: 'Key terms' },
            {
              id: 'cri-s02-image',
              type: 'image',
              src: `${ASSET_BASE}/s02-hero.png`,
              caption:
                'Key terms — COVID-19, respiratory infection, droplet precautions, isolation, oxygen saturation.',
            },
            {
              id: 'cri-s02-reveal-respiratory-infection',
              type: 'reveal_card',
              frontTitle: 'Respiratory Infection',
              frontBody: 'Respiratory infection',
              backTitle: 'Respiratory Infection',
              backBody:
                'An infection of the breathing system — nose, throat, airways, or lungs — caused by viruses or bacteria. Common ones include COVID-19, influenza (the flu), and RSV. In older adults, respiratory infections can become severe, leading to pneumonia, hospitalization, or worse.',
            },
            {
              id: 'cri-s02-reveal-covid',
              type: 'reveal_card',
              frontTitle: 'COVID-19',
              frontBody: 'COVID-19',
              backTitle: 'COVID-19',
              backBody:
                'An illness caused by a coronavirus, ranging from mild cold-like symptoms to severe pneumonia and death — with older adults and the chronically ill at highest risk. It spreads through the air and respiratory droplets and particles. Vaccines and precautions reduce its spread and severity.',
            },
            {
              id: 'cri-s02-reveal-influenza-rsv',
              type: 'reveal_card',
              frontTitle: 'Influenza & RSV',
              frontBody: 'Influenza and RSV',
              backTitle: 'Influenza & RSV',
              backBody:
                'Influenza — the flu — is a respiratory virus that causes yearly outbreaks and can be serious or fatal in elders. RSV is another respiratory virus, often mild in adults but dangerous for frail older people. Both spread like COVID and are guarded against the same ways.',
            },
            {
              id: 'cri-s02-reveal-droplet-precautions',
              type: 'reveal_card',
              frontTitle: 'Droplet Precautions',
              frontBody: 'Droplet precautions',
              backTitle: 'Droplet Precautions',
              backBody:
                'The infection-control steps for germs spread by respiratory droplets — the larger drops released when someone coughs, sneezes, or talks. They include wearing a mask near the resident, distancing, and a private room. Used for flu and many respiratory infections.',
            },
            {
              id: 'cri-s02-reveal-airborne-precautions',
              type: 'reveal_card',
              frontTitle: 'Airborne Precautions',
              frontBody: 'Airborne precautions',
              backTitle: 'Airborne Precautions',
              backBody:
                'Stronger steps for germs that travel in tiny particles that linger and float in the air — requiring a fitted respirator like an N95, and often a special negative-pressure room. Used for certain infections and situations. Your facility\'s signage and policy tell you which precautions apply.',
            },
            {
              id: 'cri-s02-reveal-respirator',
              type: 'reveal_card',
              frontTitle: 'Respirator (N95) vs. Mask',
              frontBody: 'Respirator versus mask',
              backTitle: 'Respirator (N95) vs. Mask',
              backBody:
                'A regular mask blocks droplets and protects others from you. A respirator — like an N95 — seals to your face and filters tiny airborne particles, protecting you more. It must fit and seal correctly to work. Knowing which to use, and using it right, is key respiratory protection.',
            },
            {
              id: 'cri-s02-reveal-outbreak',
              type: 'reveal_card',
              frontTitle: 'Outbreak',
              frontBody: 'Outbreak',
              backTitle: 'Outbreak',
              backBody:
                'When an infection spreads among multiple residents or staff in a facility. Outbreaks of respiratory viruses can move fast through vulnerable populations, so facilities have outbreak plans — enhanced precautions, testing, grouping, and restrictions. The CNA\'s faithful precautions and reporting are central to controlling them.',
            },
            {
              id: 'cri-s02-reveal-emerging-infection',
              type: 'reveal_card',
              frontTitle: 'Emerging Infection',
              frontBody: 'Emerging infection',
              backTitle: 'Emerging Infection',
              backBody:
                'A new or newly-spreading disease — like COVID-19 was. New respiratory pathogens will appear over time. The CNA who masters how respiratory viruses spread and how to protect against them is prepared for whatever emerges next, because the core principles stay the same.',
            },
            {
              id: 'cri-s02-kc1-check-droplet',
              type: 'knowledge_check',
              question:
                'Match the term: mask and distance for germs spread by coughs and sneezes (e.g., flu)',
              options: [
                { id: 'droplet-precautions', label: 'Droplet precautions' },
                { id: 'airborne-precautions', label: 'Airborne precautions' },
                { id: 'respirator-n95', label: 'Respirator (N95)' },
              ],
              correctOptionId: 'droplet-precautions',
              explanation:
                'Droplet precautions. The infection-control steps for germs spread by respiratory droplets — the larger drops released when someone coughs, sneezes, or talks. They include wearing a mask near the resident, distancing, and a private room. Used for flu and many respiratory infections.',
              requiredForCompletion: true,
            },
            {
              id: 'cri-s02-kc1-check-airborne',
              type: 'knowledge_check',
              question:
                'Match the term: fitted respirator (N95) for germs in tiny lingering particles',
              options: [
                { id: 'droplet-precautions', label: 'Droplet precautions' },
                { id: 'airborne-precautions', label: 'Airborne precautions' },
                { id: 'respirator-n95', label: 'Respirator (N95)' },
              ],
              correctOptionId: 'airborne-precautions',
              explanation:
                'Airborne precautions. Stronger steps for germs that travel in tiny particles that linger and float in the air — requiring a fitted respirator like an N95, and often a special negative-pressure room. Used for certain infections and situations.',
              requiredForCompletion: true,
            },
            {
              id: 'cri-s02-kc1-check-respirator',
              type: 'knowledge_check',
              question:
                'Match the term: seals to the face and filters tiny particles — protects the wearer',
              options: [
                { id: 'droplet-precautions', label: 'Droplet precautions' },
                { id: 'airborne-precautions', label: 'Airborne precautions' },
                { id: 'respirator-n95', label: 'Respirator (N95)' },
              ],
              correctOptionId: 'respirator-n95',
              explanation:
                'Respirator (N95). A respirator — like an N95 — seals to your face and filters tiny airborne particles, protecting you more. It must fit and seal correctly to work. Knowing which to use, and using it right, is key respiratory protection.',
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
            { id: 'cri-s03-heading', type: 'heading', level: 1, text: 'Statistics' },
            pendingAudio(
              'cri-s03-audio',
              'Respiratory Infections and the People You Protect',
              `${ASSET_BASE}/s03-stats-podcast.mp3`,
              [
                'Respiratory Infections and the People You Protect',
                '',
                'Respiratory infections hit older adults harder than almost any other group, and long-term care sits at the center of that risk. The reasons are built into the setting: residents are older and frailer, many have chronic heart and lung conditions, immune defenses weaken with age, and people live close together, sharing air, spaces, and staff. A respiratory virus that causes a mild cold in a young adult can cause pneumonia, hospitalization, or death in a frail elder.',
                '',
                'COVID-19 made this impossible to ignore. Long-term care facilities were among the hardest-hit settings of the entire pandemic — a large share of all COVID deaths occurred among residents and staff of nursing homes and assisted living, far out of proportion to their numbers. Outbreaks could move through a facility of vulnerable people with frightening speed. The lesson was written in lives: in this population, respiratory viruses are a top-tier danger, and how staff handle infection control directly affects who lives and who dies.',
                '',
                'COVID is not alone. Influenza causes substantial illness and death among older adults every single year, with long-term care facilities experiencing flu outbreaks each season. RSV, long thought of as a children\'s virus, is increasingly recognized as a serious threat to frail elders, causing pneumonia and hospitalizations. Together, these respiratory viruses make every fall and winter a high-risk season in long-term care, and they make year-round respiratory vigilance part of the job.',
                '',
                'Here is where the CNA\'s impact lands. Respiratory viruses spread mainly through the air and respiratory droplets, and the measures that slow them are largely hands-on and behavioral: masks and respirators used correctly, hand hygiene, distancing and ventilation, droplet and airborne precautions, covering coughs, supporting vaccination, keeping sick and well residents apart during outbreaks, and — critically — recognizing respiratory illness early so it can be contained before it spreads. Research and hard pandemic experience both show that consistent infection control and early detection dramatically reduce how far respiratory viruses travel through a facility. And because CNAs are with residents constantly, they\'re usually the first to notice a new cough, a fever, a resident breathing harder than yesterday — the early warning that lets a facility act.',
                '',
                'One more, forward-looking point: COVID will not be the last emerging respiratory threat. New viruses will arise. The CNA who has mastered how respiratory infections spread and how to protect against them is ready for the next one too, because the principles don\'t change with the virus. The bottom line: respiratory infections are a leading danger to the vulnerable residents you serve, they spread fast in facilities, and the CNA\'s precautions, vaccination support, and early recognition are central to protecting everyone.',
              ].join('\n'),
              '/assets/courses/covid-respiratory-illness/s03-stats-podcast.mp3',
            ),
            {
              id: 'cri-s03-image',
              type: 'image',
              src: `${ASSET_BASE}/s03-hero.png`,
              caption:
                'Respiratory illness in long-term care — why early recognition saves lives.',
            },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: 'Fundamentals',
        sortOrder: 3,
        buildContent: () =>
          doc('Fundamentals', [
            { id: 'cri-s04-heading', type: 'heading', level: 1, text: 'Fundamentals' },
            {
              id: 'cri-s04-video',
              type: 'video',
              title: 'Fundamentals',
              videoUrl: '/assets/courses/covid-respiratory-illness/s04-fundamentals.mp4',
              placeholderNote:
                'Pending upload: /assets/courses/covid-respiratory-illness/s04-fundamentals.mp4',
            },
            {
              id: 'cri-s04-image',
              type: 'image',
              src: `${ASSET_BASE}/s04-hero.png`,
              caption:
                'How respiratory infections spread — and how precautions break the chain.',
            },
            {
              id: 'cri-s04-narration',
              type: 'text',
              body: [
                '**What respiratory infections are**',
                'A respiratory infection is an infection of the breathing system — from the nose and throat down to the airways and lungs. Most are caused by viruses: COVID-19, influenza, RSV, and the common cold viruses, among others. They range from mild upper-airway illness to severe pneumonia deep in the lungs. In the vulnerable residents you care for, even a "minor" respiratory virus can become severe — which is why none is dismissed as "just a cold."',
                '**How respiratory viruses spread**',
                'Respiratory viruses spread through the air and respiratory secretions. When an infected person breathes, talks, coughs, or sneezes, they release respiratory droplets and tiny particles carrying the virus. Others become infected by breathing these in, or by touching contaminated surfaces and then their own nose, mouth, or eyes. Larger droplets fall nearby; smaller particles can linger and travel farther in the air. This air-and-droplet spread is what makes masks, distance, and ventilation the key defenses — different from the bloodborne and contact organisms you\'ve studied.',
                '**Why elders are so vulnerable**',
                'Older adults are hit hardest for several stacking reasons. Aging weakens the immune system, so the body fights the virus less effectively. Many elders have chronic heart and lung conditions that a respiratory infection pushes over the edge. Reduced lung capacity and weaker cough make pneumonia more likely. And living close together in a facility means fast spread. The same virus that\'s mild in a young person can be life-threatening here — which is the core reason respiratory infection control matters so much in your work.',
                '**Droplet versus airborne precautions**',
                'Because respiratory viruses spread through the air, the precautions are respiratory. Droplet precautions — for germs in larger droplets from coughs and sneezes — mean a mask near the resident, distancing, and often a private room; used for flu and many respiratory infections. Airborne precautions — for germs in tiny particles that linger in the air — require a fitted respirator like an N95 and often a special room. Your facility\'s signage and the nurse tell you which precautions apply to which resident. Using the right ones correctly is the core skill.',
                '**Masks and respirators: knowing the difference**',
                'Two tools, two jobs. A regular mask mainly blocks the droplets you breathe out, protecting others from you, and offers some protection to you. A respirator — like an N95 — seals tightly to your face and filters out tiny airborne particles, giving you much stronger protection. A respirator only works if it fits and seals properly, with no gaps. Knowing which to wear for which situation, and wearing it correctly — covering nose and mouth, sealed, not touched or lowered — is essential respiratory protection.',
                '**Outbreaks and how they\'re controlled**',
                'In a facility of vulnerable people, a respiratory virus can spread fast — an outbreak. Facilities respond with outbreak plans: enhanced precautions, masking, testing, keeping sick residents apart from well ones, limiting movement and group activities, and sometimes restricting visitors. The CNA\'s faithful precautions, careful watching, and prompt reporting of new symptoms are central to catching and containing an outbreak early, before it sweeps the building.',
                '**The emerging-infection mindset**',
                'Finally, the durable lesson. COVID-19 was an emerging infection — new, unexpected, and devastating in long-term care. It will not be the last; new respiratory viruses will appear. But the protections don\'t fundamentally change: understand how respiratory viruses spread, use the right precautions and respiratory PPE correctly, practice good hand hygiene, recognize illness early, and respond in outbreaks. Master these, and you\'re prepared not just for today\'s viruses but for whatever emerges next. The principles outlast the pathogen.',
              ].join('\n\n'),
            },
            {
              id: 'cri-s04-elder-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Mask protects others; respirator (N95) seals and protects you',
              body: 'Fit and seal matter. Use the right respiratory PPE for the precautions posted — droplet (mask) versus airborne (fitted N95). The principles outlast any one virus.',
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
            { id: 'cri-s05-heading', type: 'heading', level: 1, text: 'Signs & Symptoms' },
            {
              id: 'cri-s05-image',
              type: 'image',
              src: `${ASSET_BASE}/s05-hero.png`,
              caption:
                'Recognizing signs and symptoms — including the subtle ones in older adults.',
            },
            {
              id: 'cri-s05-narration',
              type: 'text',
              body: [
                'With respiratory infections, you watch for the illness — and in elders, it doesn\'t always look the way you\'d expect. Let\'s learn the signs, including the breathing danger signs that can\'t wait.',
                '**The common respiratory symptoms**',
                'The familiar signs of a respiratory infection: cough — new or worsening. Fever or chills. Congestion or a runny nose. Sore throat. Shortness of breath or trouble breathing. Fatigue and body aches. Headache. For COVID specifically, also a loss of taste or smell. Any new respiratory symptoms in a resident are reported promptly and treated as possibly infectious, so precautions and testing can begin and spread can be stopped early. In your population, a new cough and fever is never shrugged off.',
                '**The atypical presentation in elders**',
                'Here\'s a vital point: older adults often don\'t show respiratory infections in the textbook way. An elder may have little or no fever, or no prominent cough, yet still be seriously ill. Instead, the first signs may be: new or worsening confusion. Sudden weakness or fatigue. A fall. Loss of appetite. Just seeming "off" or declined. Faster breathing or a faster heart rate. So when an older resident suddenly changes — more confused, weaker, not eating, not themselves — a respiratory infection is one of the things to consider, even without an obvious cough or fever. This atypical presentation is exactly how infections get missed in elders; your awareness prevents that.',
                '**The breathing danger signs**',
                'Some signs mean the infection is becoming dangerous and need prompt action. Difficulty breathing or shortness of breath at rest. Fast, labored, or shallow breathing. Using extra muscles to breathe, or struggling to speak full sentences. A bluish color to the lips or face. A low oxygen reading, if measured. Chest pain or pressure. Severe weakness or inability to stay awake. New or severe confusion. These respiratory danger signs are reported urgently — a vulnerable resident can decline fast, and breathing trouble is an emergency.',
                '**When it\'s an emergency**',
                'Call for emergency help immediately for: severe difficulty breathing or gasping. Blue or gray lips, face, or fingertips. Unresponsiveness or extreme difficulty waking. Severe chest pain. A resident who has clearly, suddenly deteriorated. Don\'t wait on these — respiratory emergencies in frail elders are life-threatening and time matters. Get help, stay with the resident, keep them calm and upright if it eases their breathing, and follow your training and the team\'s direction.',
                '**Summary**',
                'Four pictures. Common signs: new cough, fever, congestion, sore throat, shortness of breath, body aches, loss of taste/smell — report and treat as possibly infectious. Atypical in elders: new confusion, weakness, falls, poor appetite, "off" — consider infection even without cough or fever. Danger signs: breathing difficulty at rest, fast/labored breathing, blue lips, low oxygen, severe confusion — report urgently. Emergency: severe breathing trouble, blue/gray color, unresponsive — call for help now.',
                'The rule underneath it all: report new respiratory symptoms promptly and treat them as infectious; remember elders show infection atypically, as confusion or decline; and escalate breathing danger signs urgently.',
              ].join('\n\n'),
            },
            {
              id: 'cri-s05-infection-callout',
              type: 'callout',
              variant: 'warning',
              title: 'Atypical elder presentation and breathing emergencies',
              body: 'Sudden confusion, weakness, and decline can be respiratory infection even without cough or fever — report promptly. Severe breathing difficulty, bluish lips, and unresponsiveness need emergency help now.',
            }
          ]),
      },
      {
        slug: 's06-causes',
        title: 'Causes',
        sortOrder: 5,
        buildContent: () =>
          doc('Causes', [
            { id: 'cri-s06-heading', type: 'heading', level: 1, text: 'Causes' },
            pendingAudio(
              'cri-s06-audio',
              'How Respiratory Viruses Spread — and How CNAs Slow Them',
              `${ASSET_BASE}/s06-causes-podcast.mp3`,
              [
                'How Respiratory Viruses Spread — and How CNAs Slow Them',
                '',
                'Respiratory viruses — COVID-19, influenza, RSV, and others — share a way of spreading, and understanding it makes the protections make sense.',
                '',
                'These viruses live in the respiratory tract, and an infected person releases them into the air whenever they breathe, talk, cough, or sneeze — carried in respiratory droplets and smaller particles. Other people get infected in two main ways: by breathing in those droplets and particles, especially up close or in crowded, poorly ventilated indoor spaces; and by touching surfaces where droplets landed, then touching their own nose, mouth, or eyes. Larger droplets fall to nearby surfaces; smaller particles can linger and drift in the air of a room, which is why ventilation matters so much. And crucially, people can spread some respiratory viruses before they feel sick, or with very mild symptoms — so you can\'t rely on "they look fine" to know who\'s infectious.',
                '',
                'Now layer in why long-term care is such fertile ground. Residents live close together and share air, dining rooms, and activity spaces. They\'re highly vulnerable, so infections both catch easily and turn severe. Staff move between many residents. Visitors come and go. Group activities and shared meals bring people together. The same features that make a facility a community also make it a place where a respiratory virus can spread fast once it\'s inside.',
                '',
                'So how does a CNA slow that spread? With layered, practical measures. Masks and respirators, worn correctly, block the droplets and particles at their source and protect the wearer. Hand hygiene removes virus picked up from surfaces. Distancing and good ventilation reduce how much infectious air people share. Covering coughs and sneezes, and helping residents do the same, cuts what\'s released. Keeping sick residents apart from well ones during outbreaks limits spread. Supporting vaccination — for COVID, flu, and RSV where offered — reduces both catching these viruses and their severity. And keeping yourself home when you\'re sick protects every resident you\'d otherwise expose. Each measure is a layer; together they\'re powerful.',
                '',
                'There\'s one more piece that\'s uniquely the CNA\'s: early recognition. Because you\'re with residents constantly, you\'re often first to notice a new cough, a fever, or — remembering the atypical elder presentation — new confusion or decline. Spotting and reporting that first case early lets the facility test, isolate, and act before one infection becomes an outbreak. The takeaway: respiratory viruses spread through shared air and surfaces, fast in close communities — and the CNA slows them with masks, hand hygiene, distancing, ventilation, vaccination support, staying home when sick, and the early recognition that catches an outbreak at case one.',
              ].join('\n'),
              '/assets/courses/covid-respiratory-illness/s06-causes-podcast.mp3',
            ),
            {
              id: 'cri-s06-image',
              type: 'image',
              src: `${ASSET_BASE}/s06-hero.png`,
              caption:
                'How COVID-19 is transmitted — and how droplet precautions protect everyone.',
            },
          ]),
      },
      {
        slug: 's07-role',
        title: 'CNA Role & Best Practices',
        sortOrder: 6,
        buildContent: () =>
          doc('CNA Role & Best Practices', [
            { id: 'cri-s07-heading', type: 'heading', level: 1, text: 'CNA Role & Best Practices' },
            {
              id: 'cri-s07-image',
              type: 'image',
              src: `${ASSET_BASE}/s07-hero.png`,
              caption:
                'Treatment and supportive care — supporting residents through recovery.',
            },
            {
              id: 'cri-s07-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of practice',
              body: 'CNAs use respiratory PPE correctly, recognize illness early, support outbreak response, and report. CNAs never diagnose respiratory infections, prescribe or adjust medications, decide isolation status, or interpret tests.',
            },
            {
              id: 'cri-s07-narration',
              type: 'text',
              body: [
                'Respiratory infections are treated by the medical team — but preventing their spread, recognizing them early, and supporting residents are overwhelmingly the CNA\'s, and they\'re what protect a whole facility. Let\'s walk through it, starting with the rule that never bends, stated firmly because it matters most here. A CNA does not diagnose respiratory infections, does not prescribe or adjust medications, does not decide isolation status, and does not interpret tests.',
                '**Respiratory precautions and PPE — used correctly.** This is the core protection. For residents on droplet or airborne precautions, wear the right respiratory PPE — a mask for droplet precautions, a fitted respirator like an N95 for airborne — covering your nose and mouth, sealed, not touched or lowered, and combined with eye protection, gown, and gloves as the precautions require. Put PPE on before entering and remove it carefully in the correct order, with hand hygiene throughout. Follow your facility\'s precaution signage exactly, every time. Correct respiratory PPE, especially a properly sealed respirator and safe removal, is what protects you and stops spread.',
                '**Hand hygiene, distancing, and ventilation.** Layer the other defenses. Keep up relentless hand hygiene, since respiratory viruses also spread by surfaces. Support distancing and good ventilation where you can. Help residents cover coughs and practice their own hand hygiene, and clean high-touch surfaces. These layers, together with masks, slow respiratory spread.',
                '**Early recognition and reporting — catching case one.** Because you\'re with residents constantly, you\'re the early-warning system. Report new respiratory symptoms promptly — and remember the atypical elder presentation, so report new confusion, weakness, falls, and decline too. Reporting the first case early lets the team test, isolate, and contain it before it becomes an outbreak. And escalate breathing danger signs urgently — respiratory trouble in a frail elder is an emergency.',
                '**Outbreak support and vaccination.** In an outbreak, follow the enhanced precautions, support keeping sick and well residents apart, support testing and grouping per the plan, and be extra vigilant. Support residents\' vaccinations for COVID, flu, and RSV where offered — encouraging and helping residents receive them, within the team\'s plan — because vaccines reduce both catching these viruses and their severity. And protect residents by staying home yourself when you\'re sick.',
                '**Supportive care for the ill resident.** For a resident with a respiratory infection, provide supportive care within your role: rest, fluids and nutrition, comfort, positioning that eases breathing — often upright — and close monitoring for worsening. The team manages medications and oxygen; you support comfort and watch closely.',
                'The scope point for this section: you never diagnose, prescribe, set precautions, or read tests — but you use respiratory PPE correctly, layer the defenses, recognize illness early, support outbreak response and vaccination, and report. Respiratory infection control and early recognition are the protection you deliver.',
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
            { id: 'cri-s08-heading', type: 'heading', level: 1, text: 'Prevention & Risk Reduction' },
            {
              id: 'cri-s08-image',
              type: 'image',
              src: `${ASSET_BASE}/s08-hero.png`,
              caption:
                'Prevention in practice — masking, hand hygiene, ventilation, and isolation when needed.',
            },
            {
              id: 'cri-s08-narration',
              type: 'text',
              body: [
                'Preventing the spread of respiratory infections protects the most vulnerable residents you serve. Here are seven ways — they work as layers, strongest together.',
                '**One. Use respiratory PPE correctly, every time.** For residents on droplet or airborne precautions, wear the right protection — a mask, or a fitted respirator like an N95 for airborne — covering your nose and mouth, sealed, not lowered or touched. Put it on before entering and remove it carefully, with hand hygiene. Worn correctly and consistently, respiratory PPE is your core protection and a major block on spread.',
                '**Two. Keep hand hygiene relentless.** Respiratory viruses spread by surfaces as well as air, so clean your hands constantly — between residents, after contact, after touching surfaces, before touching your own face. Pair masks with handwashing and you cover both routes the virus travels.',
                '**Three. Support distancing, ventilation, and cough etiquette.** Where you can, support distancing and good airflow — fresh air and ventilation dilute infectious particles. Help residents cover their coughs and sneezes and clean their hands, and clean high-touch surfaces. These everyday measures, layered with masks, reduce how much infectious air and contamination people share.',
                '**Four. Recognize and report early — catch case one.** Be the early-warning system. Report new respiratory symptoms promptly — and remember elders often show infection atypically, as new confusion, weakness, falls, or decline. Catching and reporting the very first case early lets the facility act before one infection becomes an outbreak. Your watchfulness is prevention at its most powerful.',
                '**Five. Support vaccination.** Vaccines for COVID, flu, and RSV reduce both catching these viruses and how severe they become in vulnerable residents. Support and encourage residents receiving the vaccines offered to them, and help them get to vaccination within the team\'s plan. Vaccination is one of the strongest protections this population has.',
                '**Six. Stay home when you\'re sick — and protect residents from exposure.** If you have respiratory symptoms, follow policy and stay away from residents — coming to work sick can start an outbreak among people who can\'t afford one. Likewise, support keeping sick visitors and residents away from the well, especially during respiratory season and outbreaks. Removing sources of exposure is prevention too.',
                '**Seven. Follow outbreak plans faithfully.** When an outbreak is declared, follow every enhanced precaution exactly — masking, testing, keeping sick and well residents apart, limiting group activities — with no shortcuts. Outbreaks are controlled by everyone following the plan together, and your consistent part helps stop the spread through a vulnerable building.',
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
            { id: 'cri-s09-heading', type: 'heading', level: 1, text: 'Scenario & Reporting' },
            pendingAudio(
              'cri-s09-intro-audio',
              'Emergency response scenarios intro',
              `${ASSET_BASE}/s09-emergency-intro.mp3`,
              'With respiratory infections, the judgments that matter most are recognizing illness early — including the atypical way elders show it — and recognizing breathing trouble as the emergency it is. You\'re about to work through two situations. Read each carefully, choose your action, and you\'ll get feedback right away. Keep the core ideas in mind: new confusion or decline in an elder can be infection even without a cough — and difficulty breathing in a frail resident is urgent.',
              '/assets/courses/covid-respiratory-illness/s09-emergency-intro.mp3',
            ),
            {
              id: 'cri-s09-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-hero.png`,
              caption:
                'Recognizing when a resident is deteriorating — and acting quickly.',
            },
            {
              id: 'cri-s09-scenario-petrosyan-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-scenario-petrosyan.png`,
              caption:
                'Subtle changes matter — new confusion or weakness in an older adult can signal infection; report it.',
            },
            {
              id: 'cri-s09-scenario-petrosyan',
              type: 'scenario_question',
              prompt:
                'It\'s respiratory season. Mrs. Petrosyan, normally alert and chatty, is suddenly different this morning: newly confused, very weak, not eating her breakfast, and just "not herself." She has only a slight cough and no obvious high fever. A coworker says, "She\'s probably just having an off day — let\'s not overreact." What SHOULD the CNA do?',
              options: [
                {
                  id: 'agree-off-day',
                  label: 'Agree it\'s just an off day and wait',
                  feedback:
                    'In elders, respiratory infection often shows up as sudden confusion, weakness, and decline rather than an obvious cough and fever — so "just an off day" is exactly how a case gets missed. Waiting for typical symptoms wastes the early window. The right action: report the sudden change promptly so she can be assessed and precautions started.',
                },
                {
                  id: 'report-promptly',
                  label:
                    'Report the sudden change promptly — in elders, new confusion, weakness, and decline can be respiratory infection even without an obvious cough or fever',
                  feedback:
                    'Right. Older adults frequently show respiratory infections atypically — without the textbook cough and high fever. Instead, the first signs are often a sudden change: new confusion, weakness, poor appetite, falls, or just being "off." So Mrs. Petrosyan\'s sudden decline, in respiratory season, even with only a slight cough, is exactly the kind of presentation that\'s a respiratory infection in an elder — and one that\'s easy to miss as "an off day." This is the moment early recognition matters most: reporting it promptly lets the team assess and test her and start precautions, catching a possible case at the very start — before it spreads to other vulnerable residents. Don\'t wait for a "clear" cough and fever that may never come in the typical form. Report the sudden change now; catching case one early is how outbreaks are prevented.',
                  isRecommended: true,
                },
                {
                  id: 'insist-eat',
                  label: 'Insist she eat her breakfast and carry on',
                  feedback:
                    'In elders, respiratory infection often shows up as sudden confusion, weakness, and decline rather than an obvious cough and fever — so "just an off day" is exactly how a case gets missed. Waiting for typical symptoms wastes the early window. The right action: report the sudden change promptly so she can be assessed and precautions started.',
                },
                {
                  id: 'wait-cough-fever',
                  label: 'Wait until she develops a clear cough and fever before saying anything',
                  feedback:
                    'In elders, respiratory infection often shows up as sudden confusion, weakness, and decline rather than an obvious cough and fever — so "just an off day" is exactly how a case gets missed. Waiting for typical symptoms wastes the early window. The right action: report the sudden change promptly so she can be assessed and precautions started.',
                },
              ],
              requiredForCompletion: true,
            },
            {
              id: 'cri-s09-scenario-tran-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-scenario-tran.png`,
              caption:
                'Respiratory distress is an emergency — bluish lips and struggling to breathe mean get help immediately.',
            },
            {
              id: 'cri-s09-scenario-tran',
              type: 'scenario_question',
              prompt:
                'Mr. Tran has had a respiratory infection for two days. Now he\'s breathing fast and hard, struggling and unable to speak a full sentence, his lips look bluish, and he seems frightened and is becoming difficult to rouse. What is the BEST action?',
              options: [
                {
                  id: 'rest-recheck',
                  label: 'Encourage him to rest and recheck in an hour',
                  feedback:
                    'Severe labored breathing, inability to speak a full sentence, bluish lips, and difficulty rousing signal a life-threatening respiratory emergency with dangerously low oxygen. Resting, waiting, or lying him flat could be fatal. The right action: get emergency help immediately, keep him upright and calm, and stay with him.',
                },
                {
                  id: 'emergency-help',
                  label:
                    'Get emergency help immediately — severe breathing difficulty with bluish lips is a life-threatening emergency',
                  feedback:
                    'Right. Fast, labored breathing, the inability to speak a full sentence, bluish lips, and becoming difficult to rouse are signs of severe respiratory distress and dangerously low oxygen — a life-threatening emergency, especially in a frail resident with a respiratory infection. This is not a "rest and recheck" situation. Get emergency help immediately, stay with him, keep him calm, and help him into an upright position, which usually eases breathing — never lie a struggling-to-breathe resident flat. Follow your training and the team\'s direction. Bluish color and severe breathing difficulty mean oxygen is critically low and minutes matter; rapid recognition and getting help fast is exactly right.',
                  isRecommended: true,
                },
                {
                  id: 'water-lie-flat',
                  label: 'Give him a glass of water and have him lie flat',
                  feedback:
                    'Severe labored breathing, inability to speak a full sentence, bluish lips, and difficulty rousing signal a life-threatening respiratory emergency with dangerously low oxygen. Resting, waiting, or lying him flat could be fatal. The right action: get emergency help immediately, keep him upright and calm, and stay with him.',
                },
                {
                  id: 'wait-scheduled',
                  label: 'Wait for the next scheduled check',
                  feedback:
                    'Severe labored breathing, inability to speak a full sentence, bluish lips, and difficulty rousing signal a life-threatening respiratory emergency with dangerously low oxygen. Resting, waiting, or lying him flat could be fatal. The right action: get emergency help immediately, keep him upright and calm, and stay with him.',
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
            { id: 'cri-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
              id: 'cri-s10-video',
              type: 'video',
              title: "The CNA's Role",
              videoUrl: '/assets/courses/covid-respiratory-illness/s10-cna-role.mp4',
              placeholderNote:
                'Pending upload: /assets/courses/covid-respiratory-illness/s10-cna-role.mp4',
            },
            {
              id: 'cri-s10-image',
              type: 'image',
              src: `${ASSET_BASE}/s10-hero.png`,
              caption:
                'Your role — observation, prompt reporting, and compassionate support.',
            },
            {
              id: 'cri-s10-narration',
              type: 'text',
              body: [
                'Your role with respiratory infections is protection, early recognition, outbreak support, and dignity for isolated residents — and it\'s central to protecting a vulnerable community. Let\'s walk through it.',
                '**Protect with correct respiratory precautions** Use respiratory PPE correctly for every resident on droplet or airborne precautions — the right mask or fitted respirator, sealed and worn properly, removed carefully with hand hygiene, following the signage every time. Layer in relentless hand hygiene, distancing, ventilation support, and surface cleaning. Done faithfully, this protects you and blocks the spread of viruses that hit your residents hardest.',
                '**Be the early-warning system** You\'re with residents constantly, so you catch infection first. Report new respiratory symptoms promptly — and remember the atypical elder presentation, so report new confusion, weakness, falls, and decline too, even without an obvious cough or fever. Catching and reporting case one early lets the facility contain it before an outbreak. And escalate breathing danger signs urgently — respiratory trouble in a frail elder is an emergency.',
                '**Support outbreak response and vaccination** In outbreaks, follow every enhanced precaution faithfully, support keeping sick and well residents apart, and be extra vigilant — outbreaks are controlled by everyone following the plan. Support residents\' vaccinations for COVID, flu, and RSV within the team\'s plan. And protect residents by staying home when you\'re sick yourself. Each is a layer of community protection you help provide.',
                '**Protect dignity in isolation** Remember the person in the room. Residents isolated for a respiratory infection — confined, visited by masked staff, cut off from others — feel real loneliness, fear, and decline, sometimes worse than the infection. So follow every precaution AND fight the isolation: spend time, make warm eye contact above your mask, talk, help them stay connected to family and the world, and never let them feel forgotten or like a danger. Your mask protects against the virus, not against being warmly human.',
                'Now the boundary. You do not diagnose respiratory infections. You do not prescribe or adjust medications. You do not decide isolation status or interpret tests. And you never wear respiratory PPE incorrectly, never skip precautions, never come to work sick around residents, and never let an isolated resident feel less than fully human.',
                'Inside your role — correct respiratory protection, early recognition, outbreak support, vaccination support, and dignity in isolation — you protect a whole community of vulnerable residents from the infections most likely to harm them, while keeping each resident connected and human. And by mastering these principles, you\'re ready for whatever virus emerges next.',
              ].join('\n\n'),
            },
            {
              id: 'cri-s10-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Stay within scope',
              body: 'You do not diagnose respiratory infections, prescribe or adjust medications, decide isolation status, or interpret tests. Protect, recognize, support, and report — and keep isolated residents connected and human.',
            }
          ]),
      },
      {
        slug: 's11-case-study',
        title: 'Case Study',
        sortOrder: 10,
        buildContent: () => {
          const caseNarrative = [
            'It was the middle of respiratory season, and Mrs. Petrosyan, 84, was usually one of the brightest presences on the unit — alert, chatty, first to the dining room. One morning, her CNA, Lourdes, found her changed: confused in a way she hadn\'t been the day before, very weak, uninterested in her breakfast, just "not herself." She had only the faintest cough and no obvious high fever. Nothing dramatic — easy to write off.',
            '',
            '**The temptation to dismiss it:** A coworker did exactly that: "She\'s just having an off day, everybody does. Don\'t overreact — there\'s no real fever, barely a cough." On the surface it was reasonable. Mrs. Petrosyan didn\'t look like the textbook picture of a respiratory infection — no hard cough, no spiking fever, no obvious distress. If Lourdes had been thinking only of the typical presentation, she might have agreed and moved on.',
            '',
            '**What Lourdes knew:** But Lourdes remembered a key lesson from her training: older adults often show respiratory infections atypically — not with the classic cough and fever, but with sudden confusion, weakness, poor appetite, falls, or simply a sudden decline. A sharp, sudden change from a resident\'s normal, in respiratory season, was exactly the kind of presentation that could be an infection hiding behind an "off day." And she knew that in a facility full of vulnerable elders, catching the very first case early was the difference between one infection and an outbreak.',
            '',
            '**What Lourdes did:** She did not write it off. She reported the sudden change promptly and specifically to the nurse: "Mrs. Petrosyan is suddenly confused, very weak, and won\'t eat — a big change from yesterday. She\'s only got a slight cough and no real fever, but it\'s respiratory season and this sudden decline worries me. Could this be a respiratory infection presenting atypically?" She raised the right question without diagnosing it, and she made sure precautions could start while it was sorted out.',
            '',
            '**The response:** Because Lourdes flagged it early, the nurse assessed and tested Mrs. Petrosyan promptly — and she was positive for a respiratory virus that was, it turned out, just beginning to circulate on the unit. She was isolated and treated early, and equally important, the facility moved fast: enhanced precautions, testing of others, and keeping sick and well residents apart. Two other early cases were caught quickly. What could have spread silently through a building of vulnerable elders — exactly the way these viruses do their worst damage — was contained near the start.',
            '',
            '**The outcome:** Mrs. Petrosyan recovered with early supportive care, and the unit avoided the large outbreak that a missed first case can spark. The nurse made the stakes explicit to Lourdes: "She didn\'t look like the textbook case, and a lot of people would have called it an off day and lost three or four days — by which time half the unit could\'ve been infected. You knew elders show these infections as sudden confusion and decline, you flagged it the same morning, and we caught the outbreak at the beginning. In a building like this, that\'s lives."',
            '',
            '**Discussion:** Lourdes\'s case captures the heart of respiratory infection control in long-term care. She knew the atypical elder presentation — that sudden confusion, weakness, and decline can be infection even without a prominent cough or fever — so she didn\'t dismiss a quiet but real warning sign. She understood that catching case one early is how outbreaks are prevented in a vulnerable community. She reported promptly and specifically, raising the right concern without overstepping into diagnosis. And the early catch let the whole facility respond before the virus could spread. Constant presence, knowledge of how elders really present, and prompt reporting — that\'s how a CNA protects not just one resident, but a whole building, from the infections that threaten them most.',
          ].join('\n');

          return doc('Case Study', [
            { id: 'cri-s11-heading', type: 'heading', level: 1, text: 'Case Study' },
            pendingAudio(
              'cri-s11-audio',
              'The Off Day That Wasn\'t',
              `${ASSET_BASE}/s11-case-podcast.mp3`,
              caseNarrative,
              '/assets/courses/covid-respiratory-illness/s11-case-podcast.mp3',
            ),
            {
              id: 'cri-s11-image',
              type: 'image',
              src: `${ASSET_BASE}/s11-hero.png`,
              caption:
                'Putting it together — applying alert, competent respiratory care.',
            },
            {
              id: 'cri-s11-case-study',
              type: 'case_study',
              title: 'The Off Day That Wasn\'t',
              residentProfile:
                'It was the middle of respiratory season, and Mrs. Petrosyan, 84, was usually one of the brightest presences on the unit — alert, chatty, first to the dining room. One morning, her CNA, Lourdes, found her changed: confused in a way she hadn\'t been the day before, very weak, uninterested in her breakfast, just "not herself." She had only the faintest cough and no obvious high fever. Nothing dramatic — easy to write off.',
              scenario: [
                '**The temptation to dismiss it:** A coworker did exactly that: "She\'s just having an off day, everybody does. Don\'t overreact — there\'s no real fever, barely a cough." On the surface it was reasonable. Mrs. Petrosyan didn\'t look like the textbook picture of a respiratory infection — no hard cough, no spiking fever, no obvious distress. If Lourdes had been thinking only of the typical presentation, she might have agreed and moved on.',
                '**What Lourdes knew:** But Lourdes remembered a key lesson from her training: older adults often show respiratory infections atypically — not with the classic cough and fever, but with sudden confusion, weakness, poor appetite, falls, or simply a sudden decline. A sharp, sudden change from a resident\'s normal, in respiratory season, was exactly the kind of presentation that could be an infection hiding behind an "off day." And she knew that in a facility full of vulnerable elders, catching the very first case early was the difference between one infection and an outbreak.',
                '**What Lourdes did:** She did not write it off. She reported the sudden change promptly and specifically to the nurse: "Mrs. Petrosyan is suddenly confused, very weak, and won\'t eat — a big change from yesterday. She\'s only got a slight cough and no real fever, but it\'s respiratory season and this sudden decline worries me. Could this be a respiratory infection presenting atypically?" She raised the right question without diagnosing it, and she made sure precautions could start while it was sorted out.',
                '**The response:** Because Lourdes flagged it early, the nurse assessed and tested Mrs. Petrosyan promptly — and she was positive for a respiratory virus that was, it turned out, just beginning to circulate on the unit. She was isolated and treated early, and equally important, the facility moved fast: enhanced precautions, testing of others, and keeping sick and well residents apart. Two other early cases were caught quickly. What could have spread silently through a building of vulnerable elders — exactly the way these viruses do their worst damage — was contained near the start.',
                '**The outcome:** Mrs. Petrosyan recovered with early supportive care, and the unit avoided the large outbreak that a missed first case can spark. The nurse made the stakes explicit to Lourdes: "She didn\'t look like the textbook case, and a lot of people would have called it an off day and lost three or four days — by which time half the unit could\'ve been infected. You knew elders show these infections as sudden confusion and decline, you flagged it the same morning, and we caught the outbreak at the beginning. In a building like this, that\'s lives."',
                '**Discussion:** Lourdes\'s case captures the heart of respiratory infection control in long-term care. She knew the atypical elder presentation — that sudden confusion, weakness, and decline can be infection even without a prominent cough or fever — so she didn\'t dismiss a quiet but real warning sign. She understood that catching case one early is how outbreaks are prevented in a vulnerable community. She reported promptly and specifically, raising the right concern without overstepping into diagnosis. And the early catch let the whole facility respond before the virus could spread. Constant presence, knowledge of how elders really present, and prompt reporting — that\'s how a CNA protects not just one resident, but a whole building, from the infections that threaten them most.',
              ].join('\n\n'),
            },
            {
              id: 'cri-s11-reflection-1',
              type: 'reflection',
              prompt:
                'Mrs. Petrosyan had no obvious cough or fever — just sudden confusion, weakness, and poor appetite. Why did Lourdes treat this as a possible respiratory infection, and how does knowing the atypical elder presentation prevent missed cases?',
              minCharacters: 50,
            },
            {
              id: 'cri-s11-reflection-2',
              type: 'reflection',
              prompt:
                'Catching this one early let the facility prevent a larger outbreak. Why is the CNA\'s prompt reporting of a first case so powerful in a community of vulnerable residents?',
              minCharacters: 50,
            },
            {
              id: 'cri-s11-rp-text',
              type: 'text',
              body: 'Reflect on the case study in the previous lesson. Your written responses help you apply what you learned about atypical elder presentation, catching case one early, and faithful reporting without diagnosing.',
            },
            {
              id: 'cri-s11-kc2-check',
              type: 'knowledge_check',
              question:
                'A CNA does not diagnose respiratory infections, does not prescribe or adjust medications, does not decide isolation status, and does not interpret tests. It\'s respiratory season. Mrs. Petrosyan, normally alert and chatty, is suddenly different this morning: newly confused, very weak, not eating her breakfast, and just "not herself." She has only a slight cough and no obvious high fever. A coworker says, "She\'s probably just having an off day — let\'s not overreact." What SHOULD the CNA do?',
              options: [
                {
                  id: 'agree-off-day',
                  label: 'Agree it\'s just an off day and wait',
                },
                {
                  id: 'report-promptly',
                  label:
                    'Report the sudden change promptly — in elders, new confusion, weakness, and decline can be respiratory infection even without an obvious cough or fever',
                },
                {
                  id: 'insist-eat',
                  label: 'Insist she eat her breakfast and carry on',
                },
                {
                  id: 'wait-cough-fever',
                  label: 'Wait until she develops a clear cough and fever before saying anything',
                },
              ],
              correctOptionId: 'report-promptly',
              explanation:
                'You never diagnose, prescribe, set precautions, or read tests — but your prompt reporting of sudden confusion, weakness, and decline in respiratory season supports the team\'s assessment and early containment before an outbreak spreads.',
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
            { id: 'cri-s12-heading', type: 'heading', level: 1, text: 'Conclusion' },
            {
              id: 'cri-s12-video',
              type: 'video',
              title: 'Conclusion',
              videoUrl: '/assets/courses/covid-respiratory-illness/s12-conclusion.mp4',
              placeholderNote:
                'Pending upload: /assets/courses/covid-respiratory-illness/s12-conclusion.mp4',
            },
            {
              id: 'cri-s12-image',
              type: 'image',
              src: `${ASSET_BASE}/s12-hero.png`,
              caption:
                'Caring with vigilance — protecting every resident through attentive practice.',
            },
            {
              id: 'cri-s12-narration',
              type: 'text',
              body: [
                'You\'ve reached the end — and you\'ve completed the entire infection-control series. Let\'s lock in the five things that matter most for COVID and respiratory infections.',
                '**One.** Respiratory infections — COVID, flu, RSV, and emerging viruses — hit older adults hardest and can sweep fast through a facility. They spread through the air and respiratory droplets, so the protections are respiratory: masks and respirators, distancing, ventilation, and droplet or airborne precautions, layered on the hand hygiene and standard precautions you know.',
                '**Two.** Use respiratory PPE correctly, every time. A mask for droplet precautions; a fitted, sealed respirator like an N95 for airborne. Cover your nose and mouth, don\'t lower or touch it, remove PPE carefully with hand hygiene, and follow the signage exactly. Correct respiratory protection is your core defense and a major block on spread.',
                '**Three.** Recognize illness early — and remember elders are atypical. Report new respiratory symptoms promptly. And because older adults often show infection as new confusion, weakness, falls, or decline rather than cough and fever, report those sudden changes too. Catching case one early is how outbreaks are prevented. Escalate breathing danger signs — labored breathing, bluish lips, severe confusion — urgently.',
                '**Four.** Support outbreak response and vaccination. Follow enhanced precautions faithfully in outbreaks, support keeping sick and well residents apart, support residents\' COVID, flu, and RSV vaccinations, and stay home yourself when you\'re sick. Layered measures, followed by everyone, protect a vulnerable community.',
                '**Five.** Protect dignity in isolation, honor your scope, and carry the principles forward. Isolated residents feel loneliness and fear — follow every precaution AND keep them connected and human. You never diagnose, prescribe, set precautions, or read tests — but you protect, recognize, support, and report. And because you\'ve mastered how respiratory viruses spread, you\'re ready for whatever emerges next — the principles outlast any one virus.',
              ].join('\n\n'),
            },
            {
              id: 'cri-s12-summary',
              type: 'summary',
              title: 'Five things that matter most',
              items: [
                'Respiratory infections hit elders hardest — spread through air and droplets; use masks, respirators, and precautions.',
                'Use respiratory PPE correctly — mask for droplet, fitted N95 for airborne; fit and seal matter.',
                'Recognize illness early — report symptoms and atypical elder changes; escalate breathing danger signs urgently.',
                'Support outbreak response and vaccination; stay home when you\'re sick.',
                'Protect dignity in isolation; honor your scope — protect, recognize, support, and report.',
              ],
            },
            {
              id: 'cri-s12-whn-text',
              type: 'text',
              body: 'Ten questions are waiting. Everything on them was covered here. You\'re ready. Trust what you\'ve learned, and show what you know.',
            },
            {
              id: 'cri-s12-cr-text',
              type: 'text',
              body: 'This course provides one hour of continuing education credit through CAL ACE Nursing Academy, an approved CDPH continuing education provider, NAC number 7384. Your certificate is generated automatically when you pass the knowledge check.',
            },
            {
              id: 'cri-s12-cr-callout',
              type: 'callout',
              variant: 'info',
              title: 'Scope reminder',
              body: 'CNAs use respiratory PPE correctly, recognize illness, support isolated residents, and report. CNAs do not diagnose, prescribe or adjust medications, decide isolation status, or interpret tests.',
            },
            {
              id: 'cri-s12-ca-text',
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

export async function seedCourse43CovidRespiratoryIllness(
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
    `Seeding Course 43 (COVID-19 & Emerging Respiratory Infections) as DRAFT — slug "${COURSE_SLUG}"…`,
  );

  try {
    const result = await seedCourse43CovidRespiratoryIllness(prisma);
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
