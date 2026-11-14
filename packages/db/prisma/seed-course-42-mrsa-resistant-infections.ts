/**
 * Seed Course 42 — MRSA & Drug-Resistant Infections (DRAFT).
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-42-mrsa-resistant-infections
 *
 * Idempotent upserts by slug. Self-cleans stray lessons on the target DRAFT version.
 * Does not seed the final quiz (pending owner approval).
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
const COURSE_SLUG = 'mrsa-resistant-infections';
const COURSE_TITLE = 'MRSA and Resistant Germs: Precautions for CNAs';
const COURSE_SUMMARY =
  'Learn the CNA\'s role with MRSA and other drug-resistant organisms — understanding antibiotic resistance, colonization versus infection, contact precautions and PPE, hand hygiene and equipment cleaning, supporting residents in isolation without stigma, recognizing infection signs, and antibiotic stewardship. CNAs do not diagnose, prescribe, give or adjust antibiotics, or decide isolation status.';

const ASSET_BASE = `/assets/courses/mrsa-resistant-infections`;

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
    'Explain antibiotic resistance and MRSA.',
    'Apply contact precautions and PPE correctly.',
    'Distinguish colonization from infection.',
    'Support isolated residents without stigma.',
    'Know your role in preventing spread.',
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
  heroImage: '/assets/courses/mrsa-resistant-infections/hero-banner.png',
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

const MRSA_S11_CASE_NARRATIVE = [
  'Mrs. Okafor, 77, was placed on contact precautions after MRSA was found in a wound on her leg — a private room, a sign on the door, staff in gowns and gloves. The wound itself was being treated and healing. But Mrs. Okafor, a warm and social woman, began to wilt behind that door. Staff came in gowned and masked, did what they needed quickly, and left; some seemed to rush, a few seemed wary, as if she herself were something to fear. She started apologizing for needing anything — "I\'m sorry to be such a contamination" — and grew quiet and low. Her CNA, this shift, was Adaeze.',
  '',
  '**What Adaeze understood:** Adaeze held two things clearly. First, the infection control was non-negotiable and she would follow it flawlessly — MRSA spreads by contact, and her gown, gloves, hand hygiene, and careful PPE removal were exactly what protected the other vulnerable residents on the unit. There would be no shortcuts. Second, none of that required treating Mrs. Okafor as a hazard. The precautions guarded against an organism on a wound, not against the woman; she was the same person she\'d always been, and her loneliness behind that door was its own kind of harm. Adaeze refused to let the necessary precautions curdle into stigma.',
  '',
  '**How Adaeze worked:** She gowned and gloved every time, fully and correctly, and removed her PPE carefully before leaving, with thorough hand hygiene — every single time, no exceptions, even when the unit was slammed. But inside the room, she was unhurried and completely warm: she sat with Mrs. Okafor, made eye contact, talked and listened, helped her without a trace of haste or wariness. When Mrs. Okafor apologized for being "a contamination," Adaeze answered gently: "You\'re not a contamination — you\'re a person with a wound we\'re taking care of. The gown\'s just so I don\'t carry anything to the others; it\'s got nothing to do with you being you. I\'m not in any hurry." She kept Mrs. Okafor connected — bringing news, arranging a window visit from family, making sure she wasn\'t forgotten at the end of the hall.',
  '',
  '**The moment it mattered:** One busy afternoon, Mrs. Okafor needed help quickly and a coworker suggested Adaeze "just pop in without gowning, you\'re slammed and it\'s two seconds." Adaeze didn\'t. She took the few seconds to gown and glove properly, helped Mrs. Okafor fully and warmly, and removed her PPE correctly on the way out. She knew that the one skipped precaution — "just this once" — was exactly how MRSA would travel from this room to the frail resident next door. Discipline and kindness, she understood, weren\'t in conflict; she gave both at once.',
  '',
  '**The outcome:** Mrs. Okafor\'s wound healed, her precautions were eventually lifted, and through the whole isolation she stayed herself — connected, dignified, not ashamed — because at least one caregiver followed every rule flawlessly while treating her as fully human. And no other resident on the unit acquired MRSA from her room, because the precautions were never skipped. The nurse told Adaeze: "You proved the two things people think you have to choose between — perfect precautions and real warmth — are actually the same job. You protected the whole unit and you kept her whole. That\'s it. That\'s the work."',
  '',
  '**Discussion:** Adaeze\'s case dissolves a false choice. She followed contact precautions with absolute discipline — flawless PPE, no "just this once" shortcuts — which is what protected every other vulnerable resident from a resistant organism. And she gave Mrs. Okafor unhurried warmth, connection, and dignity, refusing to let isolation become stigma or to treat a person as a hazard. She understood colonization-and-infection well enough to know the precautions guarded against the organism, not the woman. She stayed in scope — following precautions the team set, reporting, supporting care, never diagnosing or changing anything. Perfect infection control and full human dignity, delivered together: that is caring for a resident with a resistant organism.',
].join('\n');

const MODULES: ModuleSeed[] = [
  {
    slug: 'module-1',
    title: 'Understanding MRSA and Resistant Germs',
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: 'Introduction',
        sortOrder: 0,
        buildContent: () =>
          doc('Introduction', [
            { id: 'mrsa-s01-heading', type: 'heading', level: 1, text: 'Introduction' },
            {
              id: 'mrsa-s01-video',
              type: 'video',
              title: 'Introduction',
              videoUrl: '/assets/courses/mrsa-resistant-infections/s01-intro.mp4',
              placeholderNote:
                'Pending upload: /assets/courses/mrsa-resistant-infections/s01-intro.mp4',
            },
            {
              id: 'mrsa-s01-image',
              type: 'image',
              src: `${ASSET_BASE}/s01-hero.png`,
              caption:
                'MRSA and resistant infections — protecting residents and staff through consistent precautions.',
            },
            {
              id: 'mrsa-s01-narration',
              type: 'text',
              body: [
                'Welcome to CAL ACE Nursing Academy.',
                'This course is about MRSA and other drug-resistant infections — one of the most important infection-control challenges in healthcare today, and one where the CNA\'s everyday habits make an enormous difference.',
                'Let\'s start with the core idea. Antibiotics are medications that kill bacteria — they\'ve saved countless lives. But bacteria can change and adapt, and over time some have become resistant: the antibiotics that used to kill them no longer work. These drug-resistant organisms are harder to treat, sometimes requiring stronger or last-resort antibiotics, and sometimes the available drugs barely work at all. The most well-known is MRSA — methicillin-resistant Staphylococcus aureus — a common bacterium that\'s become resistant to many standard antibiotics. But there are others you may hear about: VRE, C. diff, and resistant gram-negative bacteria among them.',
                'Here\'s why this lands squarely on the CNA. Drug-resistant organisms spread from person to person — often on hands, clothing, equipment, and surfaces — and long-term care facilities, where many vulnerable people live close together, are exactly where they spread. The single most powerful thing that stops that spread is not a medication; it\'s infection control. Hand hygiene. Proper protective equipment. Cleaning shared equipment between residents. Following contact precautions. These are CNA actions, done dozens of times a shift — and they are the front line against resistant infections.',
                'You\'ll learn a distinction that matters a great deal: colonization versus infection. Many residents carry MRSA on their skin or in their nose without being sick from it at all — that\'s colonization. Others have an active infection the organism is causing. Either way, the precautions protect everyone, but the resident who is merely colonized is not "sick" and must never be treated as dangerous or untouchable.',
                'And that points to the human side. Residents on isolation precautions — in a private room, with staff in gowns and gloves — can feel lonely, shunned, and ashamed. A CNA follows every precaution faithfully AND makes sure that resident still feels like a valued person, not a hazard. Safety and warmth, together.',
                'Your scope is clear. A CNA follows contact precautions faithfully, practices flawless hand hygiene and equipment cleaning, supports residents in isolation without stigma, recognizes infection signs, supports proper antibiotic use, and reports. A CNA does not diagnose, does not prescribe, give, or adjust antibiotics, and does not decide a resident\'s isolation status.',
                'By the end of this course, you will be able to: explain antibiotic resistance and MRSA. Apply contact precautions and PPE correctly. Distinguish colonization from infection. Support isolated residents without stigma. And know your role in preventing spread.',
                'There is a ten-question knowledge check at the end. Everything on it is covered here. Let\'s begin.',
              ].join('\n\n'),
            },
            {
              id: 'mrsa-s01-ci-text',
              type: 'text',
              body: [
                'This course teaches the CNA\'s role with MRSA and other drug-resistant organisms — understanding antibiotic resistance, colonization versus infection, contact precautions and PPE, hand hygiene and equipment cleaning, supporting residents in isolation without stigma, recognizing infection signs, and antibiotic stewardship.',
                'Let\'s be clear about your role. A CNA follows contact precautions faithfully, practices flawless hand hygiene and equipment cleaning, supports residents in isolation without stigma, recognizes infection signs, supports proper antibiotic use, and reports. A CNA does not diagnose, does not prescribe, give, or adjust antibiotics, and does not decide a resident\'s isolation status. Those are nursing and medical-team tasks. But none of the protection they provide can happen without your faithful infection control first.',
              ].join('\n\n'),
            },
            {
              id: 'mrsa-s01-ci-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of this course',
              body: 'CNAs follow contact precautions, practice hand hygiene, clean equipment, support stewardship, and report. CNAs do not diagnose infections, prescribe or adjust antibiotics, or decide isolation status.',
            },
            {
              id: 'mrsa-s01-lo-text',
              type: 'text',
              body: 'By the end of this course, you will be able to:',
            },
            {
              id: 'mrsa-s01-lo-summary',
              type: 'summary',
              title: 'Learning objectives',
              items: [
                'Explain antibiotic resistance and MRSA.',
                'Apply contact precautions and PPE correctly.',
                'Distinguish colonization from infection.',
                'Support isolated residents without stigma.',
                'Know your role in preventing spread.',
              ],
            },
          ]),
      },
      {
        slug: 's02-terms',
        title: 'Terms & Definitions',
        sortOrder: 1,
        buildContent: () =>
          doc('Terms & Definitions', [
            { id: 'mrsa-s02-heading', type: 'heading', level: 1, text: 'Terms & Definitions' },
            {
              id: 'mrsa-s02-image',
              type: 'image',
              src: `${ASSET_BASE}/s02-hero.png`,
              caption:
                'Key terms — MRSA, antibiotic resistance, contact precautions, colonization, C. diff, standard precautions.',
            },
            {
              id: 'mrsa-s02-reveal-resistance',
              type: 'reveal_card',
              frontTitle: 'Antibiotic Resistance',
              frontBody: 'Antibiotic resistance',
              backTitle: 'Antibiotic Resistance',
              backBody:
                'When bacteria change so that the antibiotics meant to kill them no longer work. Resistant infections are harder to treat, needing stronger or last-resort drugs. Resistance grows when antibiotics are overused or misused — and slowing it is something everyone in healthcare shares.',
            },
            {
              id: 'mrsa-s02-reveal-mrsa',
              type: 'reveal_card',
              frontTitle: 'MRSA',
              frontBody: 'MER-sah',
              backTitle: 'MRSA',
              backBody:
                'Methicillin-resistant Staphylococcus aureus. A common bacterium — "staph" — that has become resistant to many standard antibiotics. It can live harmlessly on skin or in the nose, or cause infections from skin sores to serious bloodstream and lung infections. It\'s the most familiar drug-resistant organism.',
            },
            {
              id: 'mrsa-s02-reveal-colonization',
              type: 'reveal_card',
              frontTitle: 'Colonization',
              frontBody: 'Colonization',
              backTitle: 'Colonization',
              backBody:
                'When an organism like MRSA lives on or in a person without making them sick — no symptoms, no infection. A colonized resident isn\'t ill and isn\'t "dangerous," but can still carry the organism to others, which is why precautions still apply. Colonized is not the same as infected.',
            },
            {
              id: 'mrsa-s02-reveal-infection',
              type: 'reveal_card',
              frontTitle: 'Infection',
              frontBody: 'Infection',
              backTitle: 'Infection',
              backBody:
                'When the organism actively invades and causes illness — with symptoms like redness, pus, fever, or sickness in the affected area. Unlike colonization, an infection makes the resident sick and needs treatment. Recognizing the signs of active infection and reporting them is a CNA role.',
            },
            {
              id: 'mrsa-s02-reveal-contact-precautions',
              type: 'reveal_card',
              frontTitle: 'Contact Precautions',
              frontBody: 'Contact precautions',
              backTitle: 'Contact Precautions',
              backBody:
                'The extra infection-control steps used for organisms that spread by touch — like MRSA. They include a gown and gloves for resident contact, dedicated or carefully cleaned equipment, and often a private room. Contact precautions are added on top of standard precautions, not instead of them.',
            },
            {
              id: 'mrsa-s02-reveal-ppe',
              type: 'reveal_card',
              frontTitle: 'PPE (Personal Protective Equipment)',
              frontBody: 'PPE',
              backTitle: 'PPE (Personal Protective Equipment)',
              backBody:
                'Personal protective equipment — gowns, gloves, masks, and eye protection. PPE is put on and taken off in a specific order to avoid contaminating yourself, and removed before leaving the room. Correct PPE use, especially safe removal, is central to preventing spread.',
            },
            {
              id: 'mrsa-s02-reveal-cdiff',
              type: 'reveal_card',
              frontTitle: 'C. diff (Clostridioides difficile)',
              frontBody: 'C. diff',
              backTitle: 'C. diff (Clostridioides difficile)',
              backBody:
                'A bacterium that causes severe diarrhea, often after antibiotics disturb the gut\'s normal balance. It spreads by spores that ordinary hand sanitizer doesn\'t kill — so with C. diff, you must wash with soap and water, and clean with bleach-based products. A key exception to remember.',
            },
            {
              id: 'mrsa-s02-reveal-stewardship',
              type: 'reveal_card',
              frontTitle: 'Antibiotic Stewardship',
              frontBody: 'Antibiotic stewardship',
              backTitle: 'Antibiotic Stewardship',
              backBody:
                'Using antibiotics wisely to preserve their power — taking them only when truly needed, exactly as prescribed, and finishing the full course. The CNA\'s part: support residents finishing their course, never share or save antibiotics, and report concerns. Stewardship slows resistance.',
            },
            {
              id: 'mrsa-s02-kc1-check-colonization',
              type: 'knowledge_check',
              question:
                'Match the term: organism present but NOT causing illness; still needs precautions',
              options: [
                { id: 'colonization', label: 'Colonization' },
                { id: 'contact-precautions', label: 'Contact precautions' },
                { id: 'cdiff', label: 'C. diff' },
              ],
              correctOptionId: 'colonization',
              explanation:
                'Colonization. When an organism like MRSA lives on or in a person without making them sick — no symptoms, no infection. A colonized resident isn\'t ill and isn\'t "dangerous," but can still carry the organism to others, which is why precautions still apply. Colonized is not the same as infected.',
              requiredForCompletion: true,
            },
            {
              id: 'mrsa-s02-kc1-check-contact-precautions',
              type: 'knowledge_check',
              question:
                'Match the term: gown + gloves and clean/dedicated equipment for touch-spread organisms',
              options: [
                { id: 'colonization', label: 'Colonization' },
                { id: 'contact-precautions', label: 'Contact precautions' },
                { id: 'cdiff', label: 'C. diff' },
              ],
              correctOptionId: 'contact-precautions',
              explanation:
                'Contact precautions. The extra infection-control steps used for organisms that spread by touch — like MRSA. They include a gown and gloves for resident contact, dedicated or carefully cleaned equipment, and often a private room. Contact precautions are added on top of standard precautions, not instead of them.',
              requiredForCompletion: true,
            },
            {
              id: 'mrsa-s02-kc1-check-cdiff',
              type: 'knowledge_check',
              question:
                'Match the term: needs soap-and-water handwashing (sanitizer won\'t kill the spores)',
              options: [
                { id: 'colonization', label: 'Colonization' },
                { id: 'contact-precautions', label: 'Contact precautions' },
                { id: 'cdiff', label: 'C. diff' },
              ],
              correctOptionId: 'cdiff',
              explanation:
                'C. diff. A bacterium that causes severe diarrhea, often after antibiotics disturb the gut\'s normal balance. It spreads by spores that ordinary hand sanitizer doesn\'t kill — so with C. diff, you must wash with soap and water, and clean with bleach-based products.',
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
            { id: 'mrsa-s03-heading', type: 'heading', level: 1, text: 'Statistics' },
            pendingAudio(
              'mrsa-s03-audio',
              'Drug-Resistant Infections: A Growing Threat, and the CNA\'s Front-Line Role',
              `${ASSET_BASE}/s03-stats-podcast.mp3`,
              [
                'Drug-Resistant Infections: A Growing Threat, and the CNA\'s Front-Line Role',
                '',
                'Antibiotic resistance is one of the most serious public-health challenges of our time. Each year in the United States, millions of antibiotic-resistant infections occur and tens of thousands of people die from them; worldwide, drug-resistant infections are among the leading infectious threats, and the numbers are climbing. The fear behind these figures is real: as more organisms resist more antibiotics, once-routine infections become harder — occasionally nearly impossible — to treat.',
                '',
                'MRSA is the household name among them. It\'s common: a meaningful share of people carry Staphylococcus aureus on their skin or in their nose, and a portion of that is the resistant MRSA form. In healthcare and long-term care settings, MRSA colonization is especially common — many residents carry it without any illness at all. When MRSA does cause infection, it ranges from treatable skin infections to dangerous bloodstream, surgical-site, and lung infections.',
                '',
                'Long-term care facilities are, by their nature, high-risk environments for spreading resistant organisms, and it\'s worth understanding why. Many residents live close together and share spaces, equipment, and staff. Residents are often older, frailer, and more vulnerable to infection. Many have wounds, catheters, feeding tubes, or other devices that give organisms a way in. Antibiotic use is common, which drives resistance. And staff move between residents all day. Every one of those realities points to the same defense.',
                '',
                'That defense is not primarily a drug — it\'s infection control, delivered by the people providing hands-on care. Research is unambiguous: consistent hand hygiene, correct use of gloves and gowns, cleaning shared equipment between residents, and following contact precautions dramatically reduce the spread of MRSA and other resistant organisms. Hand hygiene alone is the most effective single measure ever identified for preventing the spread of infection in healthcare. And because CNAs have the most frequent, closest contact with residents, the CNA\'s habits are, quite literally, the front line. When resistant organisms fail to spread through a facility, it\'s overwhelmingly because the hands-on caregivers practiced good infection control, dozens of times a shift, with everyone.',
                '',
                'The bottom line: drug-resistant infections are a serious, growing threat, MRSA is common and long-term care is high-risk for spread — and the CNA\'s faithful hand hygiene, correct precautions, and equipment cleaning are the single most powerful protection residents have.',
              ].join('\n'),
              '/assets/courses/mrsa-resistant-infections/s03-stats-podcast.mp3',
            ),
            {
              id: 'mrsa-s03-image',
              type: 'image',
              src: `${ASSET_BASE}/s03-hero.png`,
              caption:
                'Resistant infections in long-term care — why prevention and precautions matter.',
            },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: 'Fundamentals',
        sortOrder: 3,
        buildContent: () =>
          doc('Fundamentals', [
            { id: 'mrsa-s04-heading', type: 'heading', level: 1, text: 'Fundamentals' },
            {
              id: 'mrsa-s04-video',
              type: 'video',
              title: 'Fundamentals',
              videoUrl: '/assets/courses/mrsa-resistant-infections/s04-fundamentals.mp4',
              placeholderNote:
                'Pending upload: /assets/courses/mrsa-resistant-infections/s04-fundamentals.mp4',
            },
            {
              id: 'mrsa-s04-image',
              type: 'image',
              src: `${ASSET_BASE}/s04-hero.png`,
              caption:
                'How resistant bacteria spread — and how the chain of transmission is broken.',
            },
            {
              id: 'mrsa-s04-narration',
              type: 'text',
              body: [
                '**What antibiotics do, and what resistance is**',
                'Antibiotics are medicines that kill bacteria or stop them from growing — one of medicine\'s greatest tools. But bacteria are living things that adapt. When exposed to antibiotics again and again, some survive and multiply, passing on their resistance. Over time, a whole population of bacteria can become resistant — and the antibiotics that once killed them stop working. That\'s antibiotic resistance, and it\'s why some infections are now so hard to treat.',
                '**Meet MRSA**',
                'MRSA is the most familiar resistant organism. The "SA" — Staphylococcus aureus, or "staph" — is a common bacterium that many healthy people carry on their skin or in their nose. The "MR" means methicillin-resistant: this strain resists methicillin and many related antibiotics. So MRSA is ordinary staph that\'s become hard to treat. It can cause infections ranging from boils and wound infections to serious bloodstream and lung disease — but it can also simply live on a person harmlessly.',
                '**Colonization versus infection: a crucial difference**',
                'This distinction shapes how you think about residents. Colonization means the organism is present — on the skin, in the nose, in the gut — but causing no illness; the resident feels completely well. Infection means the organism is actively causing disease, with symptoms. A colonized resident is not sick and is in no way "dangerous" as a person — but because they carry the organism, the same precautions apply to prevent spread to others. Colonized is not infected, and neither makes a resident less worthy of warm, normal care.',
                '**How resistant organisms spread**',
                'Resistant organisms like MRSA spread mainly by contact — most often on hands, but also on clothing, gowns, gloves used carelessly, shared equipment like blood-pressure cuffs and lifts, and surfaces. A caregiver who touches a colonized or infected resident, then touches another resident or a surface without cleaning their hands, can carry the organism along. This is exactly why hand hygiene and equipment cleaning are so powerful: they break the chain of contact spread at its most common link.',
                '**Standard plus contact precautions**',
                'You already use standard precautions with everyone. For organisms that spread by contact, like MRSA, contact precautions are added on top: a gown and gloves for resident contact, dedicated or carefully cleaned equipment, often a private room, and meticulous hand hygiene. The order you put PPE on and take it off matters — careless removal can contaminate you and spread the organism. Following contact precautions exactly, every time, for every resident who\'s on them, is the core skill of this course.',
                '**The C. diff exception**',
                'One resistant-associated organism needs special mention because it breaks a usual rule. C. diff causes severe diarrhea and spreads by tough spores that alcohol hand sanitizer does NOT kill. So for a resident with C. diff, you must wash your hands with soap and water — the physical scrubbing removes the spores — and surfaces are cleaned with bleach-based products. Remembering this exception — soap and water, not just sanitizer, for C. diff — genuinely stops outbreaks.',
                '**The CNA\'s outsized role**',
                'Here\'s the empowering truth. The spread of resistant organisms is stopped far more by infection control than by any drug — and infection control is mostly CNA work: hand hygiene, PPE, equipment cleaning, contact precautions, all done faithfully, dozens of times a shift, with everyone. Add the CNA\'s role in supporting proper antibiotic use, and watching for infection. No one is better positioned to protect a whole facility of vulnerable residents than the hands-on caregiver who does these basics flawlessly.',
              ].join('\n\n'),
            },
            {
              id: 'mrsa-s04-colonization-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Colonized is not infected',
              body: 'COLONIZED = carries it, not sick. INFECTED = sick. Precautions apply either way; stigma never does.',
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
            { id: 'mrsa-s05-heading', type: 'heading', level: 1, text: 'Signs & Symptoms' },
            {
              id: 'mrsa-s05-image',
              type: 'image',
              src: `${ASSET_BASE}/s05-hero.png`,
              caption:
                'Recognizing signs of infection — and knowing when to report to the nurse.',
            },
            {
              id: 'mrsa-s05-narration',
              type: 'text',
              body: [
                'With resistant organisms, you watch for the signs of active infection — while remembering that a colonized resident may have no signs at all. Let\'s learn the picture.',
                '**Skin and wound infection signs**',
                'MRSA most often shows up in the skin and wounds, so watch these closely. Signs of a skin or wound infection: increasing redness, warmth, and swelling. Pain or tenderness. Pus or thick, cloudy, foul drainage — a wound or sore that\'s worsening rather than healing. A boil, abscess, or sore that\'s red, swollen, and draining, sometimes looking like a "spider bite." Any of these — especially a wound going the wrong way — is reported promptly. You don\'t diagnose MRSA; you report the signs of infection so the team can test and treat.',
                '**The signs of a spreading or serious infection**',
                'When an infection moves beyond the skin or becomes serious, watch for body-wide signs: fever and chills. Feeling generally unwell, weak, or "off." Increasing pain. Fast breathing or heart rate. And in frail elders especially, new confusion or a sudden decline, which can be the main sign that infection is spreading to the blood. Spreading redness, fever, and especially new confusion in a resident with a known infection are reported promptly — a resistant infection reaching the bloodstream is dangerous.',
                '**The C. diff picture**',
                'C. diff has its own unmistakable picture, and it\'s important. Frequent, watery, often foul-smelling diarrhea — sometimes many times a day. Abdominal cramping and pain. Fever. And signs of the dehydration that heavy diarrhea causes. New diarrhea, especially in a resident who\'s recently been on antibiotics, raises concern for C. diff and is reported promptly — and remember, for this resident you wash with soap and water, not just sanitizer. Severe or bloody diarrhea, or a very unwell resident, is escalated urgently.',
                '**The colonized resident: often no signs**',
                'And the important counterpoint: a resident who is colonized — carrying MRSA or another organism without infection — typically has no symptoms at all. They feel and seem completely well, even while precautions are in place to prevent spread. Don\'t expect a colonized resident to look sick, and never treat their being on precautions as evidence they\'re ill or dangerous. The precautions protect others from the organism; the resident themselves is simply living their life. Watch them, like anyone, for any new signs of actual infection.',
                '**Summary**',
                'Four pictures. Skin/wound infection: spreading redness, warmth, swelling, pus, a worsening sore — report. Serious/systemic: fever, chills, feeling unwell, new confusion — report promptly, escalate confusion and decline. C. diff: frequent watery foul diarrhea, cramping, fever, recent antibiotics — report, and use soap and water. Colonized: often no signs at all — precautions still apply, stigma never does.',
                'The rule underneath it all: report the signs of active infection promptly — especially a worsening wound, fever, or new confusion; recognize the C. diff picture and use soap and water; and remember a colonized resident is well, not sick.',
              ].join('\n\n'),
            },
            {
              id: 'mrsa-s05-infection-callout',
              type: 'callout',
              variant: 'warning',
              title: 'Infection signs and C. diff',
              body: 'Spreading redness, fever, and new confusion need urgent reporting. For C. diff, use soap and water — sanitizer won\'t kill the spores.',
            },
          ]),
      },
      {
        slug: 's06-causes',
        title: 'Causes',
        sortOrder: 1,
        buildContent: () =>
          doc('Causes', [
            { id: 'mrsa-s06-heading', type: 'heading', level: 1, text: 'Causes' },
            pendingAudio(
              'mrsa-s06-audio',
              'What Drives Resistance, How It Spreads, and What a CNA Controls',
              `${ASSET_BASE}/s06-causes-podcast.mp3`,
              [
                'What Drives Resistance, How It Spreads, and What a CNA Controls',
                '',
                'To prevent resistant infections, it helps to understand two separate things: what makes bacteria resistant in the first place, and how those resistant organisms then spread from person to person. CNAs influence both.',
                '',
                'First, what drives resistance. Resistance develops mainly through the overuse and misuse of antibiotics. Every time antibiotics are used, susceptible bacteria die but any resistant ones survive and multiply — so the more antibiotics are used, especially when they aren\'t truly needed or aren\'t taken correctly, the more resistance grows. Common drivers include taking antibiotics for viral illnesses they can\'t help, not finishing a prescribed course so the hardiest bacteria survive, using leftover or shared antibiotics, and broad antibiotic use in healthcare. This is why antibiotic stewardship — using these drugs only when needed and exactly as prescribed — matters, and why the CNA\'s part in it counts: supporting residents to take their full course, never encouraging shared or saved antibiotics, and reporting concerns.',
                '',
                'Second, how resistant organisms spread, which is where the CNA\'s impact is greatest. MRSA and similar organisms spread mostly by contact — and in a facility, the most common vehicle is hands. A caregiver touches a colonized or infected resident, or a contaminated surface or piece of equipment, and then — without cleaning their hands — touches another resident, carrying the organism along. Shared equipment is a major route too: blood-pressure cuffs, thermometers, lifts, wheelchairs, and glucose meters moving between residents without cleaning. Clothing and gowns, surfaces and bed rails, and devices like catheters and wounds that give organisms a foothold all play a part. C. diff adds the spore problem — spores that survive on surfaces and resist alcohol sanitizer.',
                '',
                'So what does a CNA actually control? An enormous amount. Hand hygiene between every resident and after every contact — the single most powerful interruption of contact spread. Correct glove and gown use, changed between residents, never worn from room to room. Cleaning shared equipment between residents, every time. Following contact precautions exactly for residents who are on them. Using soap and water and bleach products for C. diff. And keeping wounds, catheters, and devices clean and protected so organisms can\'t take hold. Each of these breaks the chain of spread at a link the CNA touches directly.',
                '',
                'The takeaway: resistance is driven by how antibiotics are used, and spread is driven by contact — and the CNA influences both, powerfully, through proper antibiotic support and, above all, through the hand hygiene and cleaning habits that stop organisms from traveling. Faithful basics, done with everyone, are what protect a whole facility.',
              ].join('\n'),
              '/assets/courses/mrsa-resistant-infections/s06-causes-podcast.mp3',
            ),
            {
              id: 'mrsa-s06-image',
              type: 'image',
              src: `${ASSET_BASE}/s06-hero.png`,
              caption:
                'How MRSA is transmitted — and how contact precautions stop it.',
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
              id: 'mrsa-s07-heading',
              type: 'heading',
              level: 1,
              text: 'CNA Role & Best Practices',
            },
            {
              id: 'mrsa-s07-image',
              type: 'image',
              src: `${ASSET_BASE}/s07-hero.png`,
              caption:
                'Treatment and management — supporting residents through their care plan.',
            },
            {
              id: 'mrsa-s07-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of practice',
              body: 'CNAs follow hand hygiene, contact precautions, and equipment cleaning. CNAs never diagnose infections, prescribe or adjust antibiotics, or decide isolation status.',
            },
            {
              id: 'mrsa-s07-narration',
              type: 'text',
              body: [
                'Treating resistant infections is the medical team\'s job — but PREVENTING their spread is overwhelmingly the CNA\'s, and it\'s the most important "treatment" of all. Let\'s walk through it, starting with the rule that never bends, stated firmly because it matters most here. A CNA does not diagnose infections, does not prescribe, give, or adjust antibiotics, and does not decide a resident\'s isolation or precaution status — those belong to the nurse and medical team.',
                '**Hand hygiene — the most powerful measure you have.** Everything starts here. Clean your hands before and after every resident, after any contact with their body, fluids, or surroundings, before and after gloves, and on entering and leaving every room. For most organisms, alcohol sanitizer or soap and water; but for C. diff, soap and water specifically, because the spores resist sanitizer. Done faithfully between every resident, hand hygiene is the single most effective thing anyone does to stop resistant organisms — make it relentless.',
                '**Contact precautions and PPE — correctly, every time.** For residents on contact precautions, wear a gown and gloves for contact, put them on before entering and — crucially — remove them carefully before leaving the room, in the correct order, so you don\'t contaminate yourself or carry the organism out. Never wear the same gloves or gown from one resident to another. Use dedicated equipment where provided. Follow your facility\'s precaution signage exactly. Correct PPE use, especially safe removal, is the skill that contains these organisms.',
                '**Equipment and environment cleaning.** Clean shared equipment — blood-pressure cuffs, thermometers, glucose meters, lifts, wheelchairs — between every resident, using the right product, because contaminated equipment is a major spread route. Support environmental cleaning, especially high-touch surfaces and bed rails, and use bleach-based products for C. diff areas per facility policy. Clean equipment and surfaces break the contact chain.',
                '**Supporting proper antibiotic use — stewardship.** When residents are prescribed antibiotics, support taking the full course exactly as ordered and report if doses are missed or refused; never encourage sharing or saving antibiotics; and report signs that suggest infection so antibiotics are used when truly needed — and not pushed for when they aren\'t. Your support of correct antibiotic use helps slow the resistance that creates these organisms in the first place.',
                '**Protecting the resident and watching for infection.** Keep wounds, catheters, and devices clean and protected so organisms can\'t take hold, support nutrition and hydration, watch for and report the signs of active infection, and provide good skin care. You don\'t treat the infection — but you protect the openings organisms use and you catch trouble early.',
                'The scope point for this section: you never diagnose, prescribe, or set precautions — but you deliver the hand hygiene, contact precautions, PPE, and equipment cleaning that stop these organisms cold, support proper antibiotic use, and report. Infection control is the treatment, and it\'s yours.',
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
            { id: 'mrsa-s08-heading', type: 'heading', level: 1, text: 'Prevention & Risk Reduction' },
            {
              id: 'mrsa-s08-image',
              type: 'image',
              src: `${ASSET_BASE}/s08-hero.png`,
              caption:
                'Prevention in practice — hand hygiene, gowning, gloving, and environmental cleaning.',
            },
            {
              id: 'mrsa-s08-narration',
              type: 'text',
              body: [
                'Preventing the spread of resistant organisms is the heart of this course — and it\'s daily CNA work. Here are seven ways.',
                '**One. Clean your hands relentlessly.** Hand hygiene between every resident, after every contact, before and after gloves, and entering and leaving every room. It is the single most powerful thing you do to stop resistant organisms. Make it complete and automatic — and remember, for C. diff, wash with soap and water, because sanitizer won\'t kill the spores.',
                '**Two. Use gloves and gowns correctly — and remove them carefully.** For residents on contact precautions, gown and glove for contact, and take them off carefully, in the right order, before leaving the room, so you don\'t contaminate yourself or carry the organism out. Never wear the same gloves or gown from one resident to the next. Safe removal is as important as putting them on.',
                '**Three. Clean shared equipment between every resident.** Blood-pressure cuffs, thermometers, glucose meters, lifts, wheelchairs — disinfect them between residents, every time, with the right product. Contaminated equipment is a major spread route, and you close it with a wipe and a habit. Dedicated equipment for a resident on precautions is better still.',
                '**Four. Follow contact precautions exactly.** When a resident is on precautions, follow the signage every single time, no shortcuts — even when you\'re busy, even for "just a second." Resistant organisms exploit the one time precautions are skipped. Consistency, with everyone who\'s on them, is what contains them.',
                '**Five. Protect the body\'s openings.** Keep wounds, catheters, feeding tubes, and other devices clean and protected, because these give organisms a way in. Good skin and device care, plus the nutrition and hydration that keep residents strong, deny resistant organisms the foothold they need. Prevention includes protecting vulnerabilities.',
                '**Six. Support proper antibiotic use.** Help residents take their full antibiotic course exactly as prescribed, report missed or refused doses, and never encourage sharing or saving antibiotics. Report signs of possible infection so antibiotics are used when genuinely needed. Wise antibiotic use slows the resistance that creates these organisms — and you have a real part in it.',
                '**Seven. Watch, report, and contain early.** Report signs of active infection promptly — a worsening wound, fever, new diarrhea, new confusion. Early detection lets the team test, treat, and set precautions before an organism spreads through the unit. Your watchful eyes and quick reporting contain problems while they\'re small.',
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
              id: 'mrsa-s09-heading',
              type: 'heading',
              level: 1,
              text: 'Scenario & Reporting',
            },
            pendingAudio(
              'mrsa-s09-intro-audio',
              'Emergency response scenarios intro',
              `${ASSET_BASE}/s09-emergency-intro.mp3`,
              'With resistant infections, the judgments that matter most are never breaking contact precautions even when it\'s inconvenient, and recognizing the C. diff picture and handling it correctly. You\'re about to work through two situations. Read each carefully, choose your action, and you\'ll get feedback right away. Keep the core ideas in mind: precautions are followed every time, with no shortcuts — and new diarrhea after antibiotics means soap and water, not just sanitizer.',
              '/assets/courses/mrsa-resistant-infections/s09-emergency-intro.mp3',
            ),
            {
              id: 'mrsa-s09-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-hero.png`,
              caption:
                'Applying precautions correctly — even when you\'re busy, the steps still matter.',
            },
            {
              id: 'mrsa-s09-scenario-okafor-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-scenario-okafor.png`,
              caption:
                'Contact precautions aren\'t optional — gown and glove every time, even for a quick task.',
            },
            {
              id: 'mrsa-s09-scenario-okafor',
              type: 'scenario_question',
              prompt:
                'Mrs. Okafor is on contact precautions for MRSA — the sign on her door says gown and gloves. You\'re very busy, and she\'s asking for help getting a dropped item and a sip of water — "just a quick second." A coworker says, "It\'s only a second and you\'re slammed — just pop in without gowning up, you\'re barely touching anything." What SHOULD the CNA do?',
              options: [
                {
                  id: 'pop-in-no-gown',
                  label: 'Pop in quickly without gowning up since it\'s only a second',
                  feedback:
                    'Contact precautions have no "just a second" exception — skipped moments are exactly how MRSA spreads to the next vulnerable resident. Don\'t make her wait or shift her to others, either. The right action: gown and glove, help her fully, then remove PPE properly before leaving, with hand hygiene after.',
                },
                {
                  id: 'gown-glove-help',
                  label:
                    'Put on the gown and gloves as the precautions require, help her, then remove them properly before leaving',
                  feedback:
                    'Right. Contact precautions are followed every single time, with no exceptions for "just a second" or being busy — because resistant organisms spread exactly in those skipped moments. Helping her and touching her or her surroundings without a gown and gloves can put the organism on your hands and clothing, which you then carry to the next vulnerable resident. So you take the few seconds to gown and glove, help her fully and kindly — she shouldn\'t wait or feel like a burden — and then remove your PPE carefully in the right order before leaving the room, with hand hygiene after. The precautions protect everyone, and skipping them "just once" is how outbreaks start. Following them faithfully even when slammed is exactly the discipline this work requires.',
                  isRecommended: true,
                },
                {
                  id: 'ask-another-resident',
                  label: 'Ask another resident to help her instead',
                  feedback:
                    'Contact precautions have no "just a second" exception — skipped moments are exactly how MRSA spreads to the next vulnerable resident. Don\'t make her wait or shift her to others, either. The right action: gown and glove, help her fully, then remove PPE properly before leaving, with hand hygiene after.',
                },
                {
                  id: 'ignore-until-free',
                  label: 'Ignore her request until you have more time',
                  feedback:
                    'Contact precautions have no "just a second" exception — skipped moments are exactly how MRSA spreads to the next vulnerable resident. Don\'t make her wait or shift her to others, either. The right action: gown and glove, help her fully, then remove PPE properly before leaving, with hand hygiene after.',
                },
              ],
              requiredForCompletion: true,
            },
            {
              id: 'mrsa-s09-scenario-lindqvist-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-scenario-lindqvist.png`,
              caption:
                'Suspected C. diff — use soap and water, not alcohol sanitizer, which doesn\'t kill the spores.',
            },
            {
              id: 'mrsa-s09-scenario-lindqvist',
              type: 'scenario_question',
              prompt:
                'Mr. Lindqvist finished a course of antibiotics last week. Today he\'s developed frequent, watery, foul-smelling diarrhea — several times already this morning — with some abdominal cramping. You\'re about to clean him up. A coworker hands you the alcohol hand sanitizer "to be quick." What SHOULD the CNA do?',
              options: [
                {
                  id: 'sanitizer-move-on',
                  label: 'Use the alcohol sanitizer and move on quickly',
                  feedback:
                    'New watery foul diarrhea after antibiotics suggests C. diff — which spreads by spores that alcohol sanitizer can\'t kill, so soap-and-water handwashing is required. Sanitizer-and-go, dismissing it, or self-giving anti-diarrhea medication are all wrong here. The right action: report it promptly, wash with soap and water, and follow precautions.',
                },
                {
                  id: 'report-soap-water',
                  label:
                    'Report the new diarrhea promptly as possible C. diff, use soap-and-water handwashing (not just sanitizer), and follow precautions',
                  feedback:
                    'Right. New, frequent, watery, foul diarrhea in a resident who recently finished antibiotics is a classic picture of C. diff — antibiotics disturb the gut and let it take over. Two things matter here. First, report it promptly so he can be tested, treated, and placed on the right precautions. Second — and this is the key technical point — C. diff spreads by tough spores that alcohol hand sanitizer does NOT kill, so you must wash your hands with soap and water; the physical scrubbing is what removes the spores. Surfaces get bleach-based cleaning per policy. Don\'t just sanitize and move on, don\'t dismiss it as "something he ate," and never give anti-diarrhea medication on your own — that can be harmful with C. diff. Report, wash with soap and water, and follow precautions.',
                  isRecommended: true,
                },
                {
                  id: 'assume-food',
                  label: 'Assume it\'s just something he ate and not report it',
                  feedback:
                    'New watery foul diarrhea after antibiotics suggests C. diff — which spreads by spores that alcohol sanitizer can\'t kill, so soap-and-water handwashing is required. Sanitizer-and-go, dismissing it, or self-giving anti-diarrhea medication are all wrong here. The right action: report it promptly, wash with soap and water, and follow precautions.',
                },
                {
                  id: 'give-antidiarrheal',
                  label: 'Give him an anti-diarrhea medication',
                  feedback:
                    'New watery foul diarrhea after antibiotics suggests C. diff — which spreads by spores that alcohol sanitizer can\'t kill, so soap-and-water handwashing is required. Sanitizer-and-go, dismissing it, or self-giving anti-diarrhea medication are all wrong here. The right action: report it promptly, wash with soap and water, and follow precautions.',
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
            { id: 'mrsa-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
              id: 'mrsa-s10-video',
              type: 'video',
              title: "The CNA's Role",
              videoUrl: '/assets/courses/mrsa-resistant-infections/s10-cna-role.mp4',
              placeholderNote:
                'Pending upload: /assets/courses/mrsa-resistant-infections/s10-cna-role.mp4',
            },
            {
              id: 'mrsa-s10-image',
              type: 'image',
              src: `${ASSET_BASE}/s10-hero.png`,
              caption:
                'Your role — consistent precautions, clear communication, and resident dignity.',
            },
            {
              id: 'mrsa-s10-narration',
              type: 'text',
              body: [
                'Your role with resistant organisms is infection control, containment, stewardship support, watching, and dignity for isolated residents. Let\'s walk through it.',
                '**Be the chain-breaker** You are the main thing standing between a resistant organism and the next vulnerable resident. Practice relentless hand hygiene between every resident and contact — soap and water for C. diff. Follow contact precautions exactly for everyone on them, gowning and gloving and removing PPE carefully before leaving the room, never carrying gloves or gowns between residents. Done faithfully, dozens of times a shift, this breaks the chain of spread — and that is the most important work in this course.',
                '**Clean equipment and protect openings** Close the other spread routes. Clean shared equipment between every resident, every time. Keep wounds, catheters, and devices clean and protected so organisms can\'t take hold. Support the environmental cleaning that keeps surfaces safe, with bleach products for C. diff areas. Each cleaned cuff and protected wound is a door you\'ve shut on these organisms.',
                '**Support stewardship and watch closely** Help slow resistance and catch infection early. Support residents taking their full antibiotic course as prescribed, report missed or refused doses, and never encourage shared or saved antibiotics. And watch closely — report signs of active infection promptly: a worsening wound, fever, new diarrhea, new confusion. Your stewardship support and quick reporting protect both the resident and everyone around them.',
                '**Protect dignity in isolation** Remember the person inside the precautions. Residents in isolation — alone in a room, greeted by gowns and masks — easily feel shunned, lonely, and ashamed, and a colonized resident isn\'t even sick. So follow every precaution AND give warmth: spend real time with them, make eye contact and conversation, explain the precautions kindly, and never let them feel like a hazard or a burden. Your gown protects against the organism, not against being human with them.',
                'Now the boundary. You do not diagnose infections. You do not prescribe, give, or adjust antibiotics. You do not decide isolation or precaution status. And you never skip precautions "just once," never carry PPE between residents, and never treat an isolated or colonized resident as less than a full person.',
                'Inside your role — relentless infection control, contained spread, stewardship support, watchful reporting, and dignity in isolation — you protect a whole facility of vulnerable residents from organisms that medicine struggles to treat, while keeping each resident fully human. No work matters more to facility-wide safety than yours.',
              ].join('\n\n'),
            },
            {
              id: 'mrsa-s10-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Stay within scope',
              body: 'You do not diagnose infections, prescribe antibiotics, or set precautions. Follow contact precautions flawlessly, support stewardship, watch and report — and keep each resident fully human.',
            },
          ]),
      },
      {
        slug: 's11-case-study',
        title: 'Case Study',
        sortOrder: 2,
        buildContent: () =>
          doc('Case Study', [
            { id: 'mrsa-s11-heading', type: 'heading', level: 1, text: 'Case Study' },
            pendingAudio(
              'mrsa-s11-audio',
              'The Resident Behind the Door',
              `${ASSET_BASE}/s11-case-podcast.mp3`,
              MRSA_S11_CASE_NARRATIVE,
              '/assets/courses/mrsa-resistant-infections/s11-case-podcast.mp3',
            ),
            {
              id: 'mrsa-s11-image',
              type: 'image',
              src: `${ASSET_BASE}/s11-hero.png`,
              caption:
                'Putting it together — applying safe, competent infection-control practice.',
            },
            {
              id: 'mrsa-s11-case-study',
              type: 'case_study',
              title: 'The Resident Behind the Door',
              residentProfile:
                'Mrs. Okafor, 77, was placed on contact precautions after MRSA was found in a wound on her leg — a private room, a sign on the door, staff in gowns and gloves. The wound itself was being treated and healing. But Mrs. Okafor, a warm and social woman, began to wilt behind that door.',
              scenario: [
                '**What Adaeze understood:** Adaeze held two things clearly. First, the infection control was non-negotiable and she would follow it flawlessly — MRSA spreads by contact, and her gown, gloves, hand hygiene, and careful PPE removal were exactly what protected the other vulnerable residents on the unit. There would be no shortcuts. Second, none of that required treating Mrs. Okafor as a hazard. The precautions guarded against an organism on a wound, not against the woman; she was the same person she\'d always been, and her loneliness behind that door was its own kind of harm. Adaeze refused to let the necessary precautions curdle into stigma.',
                '**How Adaeze worked:** She gowned and gloved every time, fully and correctly, and removed her PPE carefully before leaving, with thorough hand hygiene — every single time, no exceptions, even when the unit was slammed. But inside the room, she was unhurried and completely warm: she sat with Mrs. Okafor, made eye contact, talked and listened, helped her without a trace of haste or wariness. When Mrs. Okafor apologized for being "a contamination," Adaeze answered gently: "You\'re not a contamination — you\'re a person with a wound we\'re taking care of. The gown\'s just so I don\'t carry anything to the others; it\'s got nothing to do with you being you. I\'m not in any hurry." She kept Mrs. Okafor connected — bringing news, arranging a window visit from family, making sure she wasn\'t forgotten at the end of the hall.',
                '**The moment it mattered:** One busy afternoon, Mrs. Okafor needed help quickly and a coworker suggested Adaeze "just pop in without gowning, you\'re slammed and it\'s two seconds." Adaeze didn\'t. She took the few seconds to gown and glove properly, helped Mrs. Okafor fully and warmly, and removed her PPE correctly on the way out. She knew that the one skipped precaution — "just this once" — was exactly how MRSA would travel from this room to the frail resident next door. Discipline and kindness, she understood, weren\'t in conflict; she gave both at once.',
                '**The outcome:** Mrs. Okafor\'s wound healed, her precautions were eventually lifted, and through the whole isolation she stayed herself — connected, dignified, not ashamed — because at least one caregiver followed every rule flawlessly while treating her as fully human. And no other resident on the unit acquired MRSA from her room, because the precautions were never skipped. The nurse told Adaeze: "You proved the two things people think you have to choose between — perfect precautions and real warmth — are actually the same job. You protected the whole unit and you kept her whole. That\'s it. That\'s the work."',
                '**Discussion:** Adaeze\'s case dissolves a false choice. She followed contact precautions with absolute discipline — flawless PPE, no "just this once" shortcuts — which is what protected every other vulnerable resident from a resistant organism. And she gave Mrs. Okafor unhurried warmth, connection, and dignity, refusing to let isolation become stigma or to treat a person as a hazard. She understood colonization-and-infection well enough to know the precautions guarded against the organism, not the woman. She stayed in scope — following precautions the team set, reporting, supporting care, never diagnosing or changing anything. Perfect infection control and full human dignity, delivered together: that is caring for a resident with a resistant organism.',
              ].join('\n\n'),
            },
            {
              id: 'mrsa-s11-reflection-1',
              type: 'reflection',
              prompt:
                'A coworker urged Adaeze to skip gowning "just this once" because she was busy. Why did Adaeze refuse, and what could "just once" have cost the resident next door?',
              minCharacters: 50,
            },
            {
              id: 'mrsa-s11-reflection-2',
              type: 'reflection',
              prompt:
                'Mrs. Okafor called herself "a contamination." How did Adaeze follow every precaution flawlessly while still making her feel fully human — and why aren\'t discipline and warmth in conflict here?',
              minCharacters: 50,
            },
            {
              id: 'mrsa-s11-rp-text',
              type: 'text',
              body: 'Reflect on the case study in the previous lesson. Your written responses help you apply what you learned about contact precautions, dignity in isolation, and faithful infection control.',
            },
            {
              id: 'mrsa-s11-kc2-check',
              type: 'knowledge_check',
              question:
                'A CNA does not diagnose infections, does not prescribe, give, or adjust antibiotics, and does not decide a resident\'s isolation or precaution status — those belong to the nurse and medical team. Mrs. Okafor is on contact precautions for MRSA — the sign on her door says gown and gloves. You\'re very busy, and she\'s asking for help getting a dropped item and a sip of water — "just a quick second." A coworker says, "It\'s only a second and you\'re slammed — just pop in without gowning up, you\'re barely touching anything." What SHOULD the CNA do?',
              options: [
                {
                  id: 'pop-in-no-gown',
                  label: 'Pop in quickly without gowning up since it\'s only a second',
                },
                {
                  id: 'gown-glove-help',
                  label:
                    'Put on the gown and gloves as the precautions require, help her, then remove them properly before leaving',
                },
                {
                  id: 'ask-another-resident',
                  label: 'Ask another resident to help her instead',
                },
                {
                  id: 'ignore-until-free',
                  label: 'Ignore her request until you have more time',
                },
              ],
              correctOptionId: 'gown-glove-help',
              explanation:
                'You never diagnose, prescribe, or set precautions — but your faithful contact precautions, even when busy, stop resistant organisms from spreading to the next vulnerable resident.',
              requiredForCompletion: true,
              meta: { flaggedFiller: true },
            },
          ]),
      },
      {
        slug: 's12-conclusion',
        title: 'Conclusion',
        sortOrder: 3,
        buildContent: () =>
          doc('Conclusion', [
            { id: 'mrsa-s12-heading', type: 'heading', level: 1, text: 'Conclusion' },
            {
              id: 'mrsa-s12-video',
              type: 'video',
              title: 'Conclusion',
              videoUrl: '/assets/courses/mrsa-resistant-infections/s12-conclusion.mp4',
              placeholderNote:
                'Pending upload: /assets/courses/mrsa-resistant-infections/s12-conclusion.mp4',
            },
            {
              id: 'mrsa-s12-image',
              type: 'image',
              src: `${ASSET_BASE}/s12-hero.png`,
              caption:
                'Caring safely — protecting every resident and yourself through diligence.',
            },
            {
              id: 'mrsa-s12-narration',
              type: 'text',
              body: [
                'You\'ve reached the end. Let\'s lock in the five things that matter most for MRSA and drug-resistant infections.',
                '**One.** Antibiotic resistance means bacteria survive the drugs meant to kill them, making infections hard to treat. MRSA is the most common resistant organism. The spread of these organisms is stopped far more by infection control than by any medication — and that control is mostly CNA work.',
                '**Two.** Hand hygiene is your single most powerful tool. Clean your hands between every resident, after every contact, and entering and leaving every room. Use sanitizer or soap and water for most organisms — but for C. diff, soap and water specifically, because the spores resist sanitizer.',
                '**Three.** Follow contact precautions exactly, every time. For residents on precautions, gown and glove for contact and remove your PPE carefully before leaving the room, in the right order, never carrying gloves or gowns between residents. Clean shared equipment between every resident. No shortcuts, even "just for a second" — that one skipped moment is how organisms spread.',
                '**Four.** Know colonization versus infection, and support stewardship. A colonized resident carries the organism but isn\'t sick — precautions still apply, but they are not "dangerous" people. Watch for and report signs of active infection. And support proper antibiotic use — full course as prescribed, never shared or saved — to help slow resistance.',
                '**Five.** Protect dignity in isolation, and honor your scope. Residents in isolation easily feel shunned and ashamed — follow every precaution AND give them warmth, time, and normal human connection. You never diagnose, prescribe antibiotics, or set precautions — but you deliver the infection control that protects everyone, support stewardship, watch, report, and keep each resident fully human.',
              ].join('\n\n'),
            },
            {
              id: 'mrsa-s12-summary',
              type: 'summary',
              title: 'Five things that matter most',
              items: [
                'Antibiotic resistance makes infections hard to treat — infection control is mostly CNA work.',
                'Hand hygiene is your most powerful tool — soap and water for C. diff.',
                'Follow contact precautions exactly — gown, glove, remove carefully, clean equipment, no shortcuts.',
                'Know colonization vs infection; support stewardship and report active infection signs.',
                'Protect dignity in isolation — follow every precaution AND keep each resident fully human.',
              ],
            },
            {
              id: 'mrsa-s12-whn-text',
              type: 'text',
              body: 'Ten questions are waiting. Everything on them was covered here. You\'re ready. Trust what you\'ve learned, and show what you know.',
            },
            {
              id: 'mrsa-s12-cr-text',
              type: 'text',
              body: 'This course provides one hour of continuing education credit through CAL ACE Nursing Academy, an approved CDPH continuing education provider, NAC number 7384. Your certificate is generated automatically when you pass the knowledge check.',
            },
            {
              id: 'mrsa-s12-cr-callout',
              type: 'callout',
              variant: 'info',
              title: 'Scope reminder',
              body: 'CNAs follow contact precautions, practice hand hygiene, and clean equipment. CNAs do not diagnose infections, prescribe antibiotics, or decide isolation status.',
            },
            {
              id: 'mrsa-s12-ca-text',
              type: 'text',
              body: 'Your certificate is generated automatically when you pass the knowledge check. CDPH-Approved CE Provider — NAC #7384.',
            },
          ]),
      },
    ],
  },
];

export async function seedCourse42MrsaResistantInfections(
  prisma: PrismaClient,
  options?: { tenantSlug?: string },
): Promise<{ courseCreated: boolean; modulesUpserted: number; lessonsUpserted: number; strayLessonsDeleted: number }> {
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
    `Seeding Course 42 (MRSA & Drug-Resistant Infections) as DRAFT — slug "${COURSE_SLUG}"…`,
  );

  try {
    const result = await seedCourse42MrsaResistantInfections(prisma);
    const blockCounts = blockCountsByLesson();
    const totalBlocks = Object.values(blockCounts).reduce((sum, count) => sum + count, 0);

    console.log('Seed complete.');
    console.log(`  Course:   ${COURSE_TITLE}`);
    console.log(`  Slug:     ${COURSE_SLUG}`);
    console.log(`  Created:  ${result.courseCreated ? 'yes (new)' : 'no (updated existing)'}`);
    console.log(`  Modules:  ${result.modulesUpserted}`);
    console.log(`  Lessons:  ${result.lessonsUpserted}`);
    console.log(`  Blocks:   ${totalBlocks} total`);
    console.log(`  Strays cleaned: ${result.strayLessonsDeleted} lessons`);
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
