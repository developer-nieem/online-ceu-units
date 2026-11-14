/**
 * Seed Course 41 — Caring for a Resident with HIV / AIDS (DRAFT).
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-41-hiv-aids
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
const COURSE_SLUG = 'hiv-aids';
const COURSE_TITLE = 'HIV/AIDS Care Support and Infection Precautions';
const COURSE_SUMMARY =
  'Learn the CNA\'s role in caring for a resident with HIV/AIDS — understanding HIV as an immune-system virus, the modern reality of treatment (people live long healthy lives; undetectable = untransmittable), applying standard precautions, supporting medication adherence, watching for opportunistic infections, and providing fierce stigma-free dignity. CNAs do NOT diagnose, give or adjust medications, or interpret labs.';

const ASSET_BASE = `/assets/courses/hiv-aids`;

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
    'Explain what HIV and AIDS are, accurately and without fear.',
    'Apply standard precautions.',
    'Support medication adherence.',
    'Watch for opportunistic infections.',
    'Provide stigma-free care.',
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
  heroImage: '/assets/courses/hiv-aids/hero-banner.png',
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

const HIV_S06_CAUSES_NARRATION = [
  'How HIV Spreads, How It Doesn\'t, and Why Caregivers Are Safe',
  '',
  'Few topics have been clouded by more fear and misinformation than how HIV spreads, so let\'s be precise, because accuracy is what replaces fear.',
  '',
  'HIV is bloodborne. It is transmitted when blood or specific body fluids from a person with HIV — and, importantly, with a detectable viral load — enter another person\'s body. The established routes are: blood-to-blood contact, such as a needlestick or shared needles; sexual contact; and from a parent to child during birth or breastfeeding. In a healthcare setting, the realistic occupational route is exposure to infected blood through a needlestick, a sharps injury, or blood contacting broken skin or the eyes, nose, or mouth. This is exactly what standard precautions and careful sharps handling protect against — and occupational HIV transmission in healthcare is extraordinarily rare when precautions are followed.',
  '',
  'Now what truly matters for everyday caregiving — how HIV does NOT spread. It is not spread by touching, hugging, or holding hands. Not by sharing dishes, utensils, food, or drinks. Not by toilets, bathtubs, or bedding. Not by coughing, sneezing, or breathing the same air. Not by sweat, tears, or saliva in ordinary contact. Not by the everyday physical closeness of caregiving — bathing, dressing, feeding, transferring, comforting. There has never been a documented case of HIV spreading through this kind of casual contact. The intimate, hands-on work of a CNA carries no HIV risk from casual contact, and standard precautions cover the blood-and-fluid situations completely.',
  '',
  'Two more facts complete the picture. First, U equals U: a person on effective treatment with an undetectable viral load cannot transmit HIV sexually — and a suppressed virus dramatically reduces any transmission risk overall. Treatment is prevention. Second, prevention tools exist for those at risk, including medication that prevents HIV — but for the CNA, the relevant prevention is simply faithful standard precautions plus the facility exposure plan, exactly as for hepatitis.',
  '',
  'Here\'s the takeaway, and it carries both halves of this course. Knowing precisely how HIV spreads makes you genuinely safe — standard precautions and sharps care are complete protection, and casual caregiving carries no risk. And knowing precisely how it doesn\'t spread frees you to care without fear and without stigma — to touch, comfort, and treat a resident with HIV with the same warm normalcy as anyone else. Accuracy is the foundation of both safety and compassion.',
].join('\n');

const HIV_S11_CASE_NARRATIVE = [
  'Mr. Delacroix, 68, had lived with HIV for over thirty years — a survivor of the epidemic\'s most terrifying era, who had buried many friends and a partner. His HIV was well-controlled on daily medication, his viral load undetectable; medically, he was a healthy older man with a managed chronic condition. But when he moved into the facility, fear moved in around him. Word of his diagnosis spread among staff, and his CNA, Joelle, watched some of her coworkers change: extra gloves for tasks that needed none, a flinch at casual touch, a subtle distance, conversations that stopped when he wheeled by. Mr. Delacroix noticed all of it. He grew quiet and withdrawn, retreating to his room — the old, familiar experience of being treated as a contagion rather than a person.',
  '',
  '**What Joelle knew:** Joelle had learned the modern facts, and they made her certain. HIV is bloodborne, not spread by casual contact — not by touch, not by sharing space, not by the everyday closeness of caregiving. Mr. Delacroix\'s undetectable viral load meant U equals U. The standard precautions she used with every resident already gave her complete protection; there was nothing to fear in helping him dress, sharing a laugh, or putting a reassuring hand on his shoulder. The extra gloves and the distance weren\'t precaution — they were stigma built on outdated fear, and they were wounding a man who had already survived more than enough of it.',
  '',
  '**What Joelle did:** She cared for Mr. Delacroix exactly as she cared for anyone — warm, normal, hands-on, unhurried. Standard precautions when blood or body fluids were actually involved, like with every resident; and otherwise, completely ordinary human care: helping him without hesitation, sitting and talking, laughing at his dry jokes, a hand on his arm. She protected his confidentiality fiercely, never discussing his status with anyone outside his care team. And when a coworker over-gloved to simply hand him a cup of water and asked her, uneasily, "Aren\'t you worried?", Joelle answered plainly and kindly: "There\'s nothing to catch from handing him water — HIV doesn\'t spread that way. We use standard precautions with everybody for the real stuff. The gloves-for-everything thing isn\'t protecting us; it\'s telling him we think he\'s dangerous, and he isn\'t." She also raised the pattern with the nurse, who arranged a refresher for the unit on how HIV actually spreads.',
  '',
  '**The turn:** Joelle\'s steady, normal care — and the education that followed — began to shift the unit. As staff understood the facts, the flinching faded, the unnecessary gloves disappeared, and Mr. Delacroix slowly came back out of his room. He started joining activities again, trading jokes at meals, becoming part of the community. He told Joelle one day, quietly: "You\'re the first person here who treated me like a person instead of a disease. You have no idea what that\'s worth — or maybe you do."',
  '',
  '**The outcome:** Mr. Delacroix lived comfortably and connected, his health steady on his medication, his dignity restored by being treated as what he was — a person, not a hazard. And no staff member was ever at any risk, because casual care carried none and standard precautions covered the rest. The nurse later told Joelle: "You had the facts right, so you were never afraid and never unsafe — and you gave that man back his place among people. The science and the compassion were the same thing in how you worked."',
  '',
  '**Discussion:** Joelle\'s case shows that, with HIV, accurate knowledge is the root of both safety and dignity. Because she understood exactly how HIV spreads and doesn\'t, she was fully protected without a shred of fear — and free to offer normal, warm, hands-on care. She used real precautions for real risks and refused the theater of stigma that masquerades as caution. She guarded confidentiality, corrected misinformation kindly, and escalated for education. She never diagnosed or medicated — she supported, protected, and respected. And she gave an epidemic survivor the one thing stigma had always denied him: to be treated, fully and warmly, as a human being.',
].join('\n');

const MODULES: ModuleSeed[] = [
  {
    slug: 'module-1',
    title: 'Understanding HIV and AIDS',
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: 'Introduction',
        sortOrder: 0,
        buildContent: () =>
          doc('Introduction', [
            { id: 'hiv-s01-heading', type: 'heading', level: 1, text: 'Introduction' },
            {
              id: 'hiv-s01-video',
              type: 'video',
              title: 'Introduction',
              videoUrl: '/assets/courses/hiv-aids/s01-intro.mp4',
              placeholderNote: 'Pending upload: /assets/courses/hiv-aids/s01-intro.mp4',
            },
            {
              id: 'hiv-s01-image',
              type: 'image',
              src: `${ASSET_BASE}/s01-hero.png`,
              caption:
                'HIV and AIDS — providing compassionate, stigma-free care for residents living with HIV.',
            },
            {
              id: 'hiv-s01-narration',
              type: 'text',
              body: [
                'Welcome to CAL ACE Nursing Academy.',
                'This course is about caring for a resident with HIV or AIDS — and it begins by clearing away decades of fear and outdated information, because the reality of HIV today is very different from what many people still believe.',
                'HIV stands for human immunodeficiency virus. It\'s a virus that attacks the immune system — specifically the cells that coordinate the body\'s defenses against infection. Over time, untreated HIV weakens the immune system until the body can\'t fight off illnesses it would normally handle easily. When the immune system becomes severely damaged, or certain serious infections or cancers develop, the condition is called AIDS — acquired immunodeficiency syndrome — the most advanced stage of HIV infection.',
                'Now here is the most important update, the one that should reshape how you think about this: HIV today is a manageable chronic condition, not a death sentence. With modern medications — called antiretroviral therapy — people with HIV live long, healthy, full lives, with normal or near-normal life expectancy. The medications suppress the virus so powerfully that, in many people, it becomes undetectable in the blood. And there\'s a fact every caregiver should know, proven by solid science: a person with HIV who takes their medication and maintains an undetectable viral load cannot transmit HIV sexually. The phrase for it is "undetectable equals untransmittable" — U equals U. HIV is controllable, and effective treatment is also prevention.',
                'This matters enormously for your work, in two ways. First, your safety: HIV is bloodborne, spread through blood and certain body fluids — not through casual contact, not through the everyday closeness of caregiving. The standard precautions you already use with every resident protect you fully. Second, your compassion: HIV has been burdened with more stigma than almost any condition in modern history, and that stigma has caused immense, needless suffering. A CNA\'s stigma-free, warm, completely normal care is not just kind — it\'s a correction of a historic wrong.',
                'Your scope is clear. A CNA applies standard precautions, supports medication adherence, watches for the infections a weakened immune system invites, provides fiercely dignified stigma-free care, and reports faithfully. A CNA does not diagnose HIV, does not give or adjust medications, and does not interpret lab results.',
                'By the end of this course, you will be able to: explain what HIV and AIDS are, accurately and without fear. Apply standard precautions. Support medication adherence. Watch for opportunistic infections. And provide stigma-free care.',
                'There is a ten-question knowledge check at the end. Everything on it is covered here. Let\'s begin.',
              ].join('\n\n'),
            },
            {
              id: 'hiv-s01-ci-text',
              type: 'text',
              body: [
                'This course teaches the CNA\'s role in caring for a resident with HIV/AIDS — understanding HIV as an immune-system virus, the modern reality of treatment, applying standard precautions, supporting medication adherence, watching for opportunistic infections, and providing fierce stigma-free dignity.',
                'Let\'s be clear about your role. A CNA applies standard precautions, supports medication adherence, watches for the infections a weakened immune system invites, provides fiercely dignified stigma-free care, and reports faithfully. A CNA does not diagnose HIV, does not give or adjust medications, and does not interpret lab results. Those are nursing and medical tasks. But none of them can happen without your careful observation, adherence support, and faithful reporting first.',
              ].join('\n\n'),
            },
            {
              id: 'hiv-s01-ci-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of this course',
              body: 'CNAs APPLY STANDARD PRECAUTIONS, SUPPORT ADHERENCE, WATCH FOR INFECTION, and PROVIDE STIGMA-FREE CARE. CNAs do not diagnose HIV, give or adjust medications, or interpret lab results.',
            },
            {
              id: 'hiv-s01-lo-text',
              type: 'text',
              body: 'By the end of this course, you will be able to:',
            },
            {
              id: 'hiv-s01-lo-summary',
              type: 'summary',
              title: 'Learning objectives',
              items: [
                'Explain what HIV and AIDS are, accurately and without fear.',
                'Apply standard precautions.',
                'Support medication adherence.',
                'Watch for opportunistic infections.',
                'Provide stigma-free care.',
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
            { id: 'hiv-s02-heading', type: 'heading', level: 1, text: 'Terms & Definitions' },
            {
              id: 'hiv-s02-image',
              type: 'image',
              src: `${ASSET_BASE}/s02-hero.png`,
              caption:
                'Key terms — HIV, AIDS, antiretroviral therapy, viral load, undetectable, standard precautions.',
            },
            {
              id: 'hiv-s02-reveal-hiv',
              type: 'reveal_card',
              frontTitle: 'HIV',
              frontBody: 'HIV',
              backTitle: 'HIV',
              backBody:
                'Human immunodeficiency virus. A virus that attacks the immune system — the body\'s defense against infection — by infecting and destroying key immune cells. Untreated, it slowly weakens the body\'s defenses. With treatment, it\'s controlled, and people live long, healthy lives.',
            },
            {
              id: 'hiv-s02-reveal-aids',
              type: 'reveal_card',
              frontTitle: 'AIDS',
              frontBody: 'AIDS',
              backTitle: 'AIDS',
              backBody:
                'Acquired immunodeficiency syndrome. The most advanced stage of HIV infection, reached when the immune system is severely damaged or certain serious infections or cancers develop. Modern treatment prevents most people with HIV from ever progressing to AIDS.',
            },
            {
              id: 'hiv-s02-reveal-immune-system',
              type: 'reveal_card',
              frontTitle: 'Immune System',
              frontBody: 'Immune system',
              backTitle: 'Immune System',
              backBody:
                'The body\'s defense network that fights off germs and illness. HIV attacks it directly. When it\'s weakened, infections the body would normally shrug off can take hold and become dangerous — which is the central danger of untreated HIV.',
            },
            {
              id: 'hiv-s02-reveal-art',
              type: 'reveal_card',
              frontTitle: 'Antiretroviral Therapy (ART)',
              frontBody: 'ART',
              backTitle: 'Antiretroviral Therapy (ART)',
              backBody:
                'The medications that treat HIV by suppressing the virus. Taken consistently, ART keeps the immune system healthy, lets people live full lives, and can make the virus undetectable. Taking it every day, exactly as prescribed, is essential — and supporting that is a CNA\'s role.',
            },
            {
              id: 'hiv-s02-reveal-viral-load',
              type: 'reveal_card',
              frontTitle: 'Viral Load & Undetectable',
              frontBody: 'Viral load',
              backTitle: 'Viral Load & Undetectable',
              backBody:
                'The amount of HIV in the blood. Effective treatment lowers it, often until it\'s "undetectable" — too low for tests to find. An undetectable viral load means a healthy immune system and — proven by science — that the virus can\'t be transmitted sexually. Undetectable equals untransmittable.',
            },
            {
              id: 'hiv-s02-reveal-uu',
              type: 'reveal_card',
              frontTitle: 'U=U (Undetectable = Untransmittable)',
              frontBody: 'U equals U',
              backTitle: 'U=U (Undetectable = Untransmittable)',
              backBody:
                'Undetectable equals untransmittable. The science-backed fact that a person with HIV who maintains an undetectable viral load through treatment cannot pass HIV to a sexual partner. It transformed the understanding of HIV — treatment is also prevention — and it\'s a powerful answer to fear and stigma.',
            },
            {
              id: 'hiv-s02-reveal-opportunistic',
              type: 'reveal_card',
              frontTitle: 'Opportunistic Infection',
              frontBody: 'Opportunistic infection',
              backTitle: 'Opportunistic Infection',
              backBody:
                'An infection that takes advantage of a weakened immune system — illnesses a healthy body fights off easily but that become serious when defenses are down. They\'re the main danger in advanced HIV, and watching for early signs of infection is a key CNA role.',
            },
            {
              id: 'hiv-s02-reveal-stigma',
              type: 'reveal_card',
              frontTitle: 'Stigma',
              frontBody: 'Stigma',
              backTitle: 'Stigma',
              backBody:
                'Unfair shame, judgment, or discrimination attached to a condition. HIV has carried severe stigma, causing isolation and suffering far beyond the illness itself. Stigma-free care — warm, normal, respectful, confidential — is an essential part of caring for a resident with HIV.',
            },
            {
              id: 'hiv-s02-kc1-check-art',
              type: 'knowledge_check',
              question:
                'Match the term: daily medication that controls HIV and protects the immune system',
              options: [
                { id: 'art', label: 'ART (antiretroviral therapy)' },
                { id: 'uu', label: 'U=U' },
                { id: 'opportunistic-infection', label: 'Opportunistic infection' },
              ],
              correctOptionId: 'art',
              explanation:
                'ART (antiretroviral therapy). The medications that treat HIV by suppressing the virus. Taken consistently, ART keeps the immune system healthy, lets people live full lives, and can make the virus undetectable.',
              requiredForCompletion: true,
            },
            {
              id: 'hiv-s02-kc1-check-uu',
              type: 'knowledge_check',
              question:
                'Match the term: undetectable viral load means HIV can\'t be transmitted sexually',
              options: [
                { id: 'art', label: 'ART (antiretroviral therapy)' },
                { id: 'uu', label: 'U=U' },
                { id: 'opportunistic-infection', label: 'Opportunistic infection' },
              ],
              correctOptionId: 'uu',
              explanation:
                'U=U. Undetectable equals untransmittable. The science-backed fact that a person with HIV who maintains an undetectable viral load through treatment cannot pass HIV to a sexual partner.',
              requiredForCompletion: true,
            },
            {
              id: 'hiv-s02-kc1-check-opportunistic',
              type: 'knowledge_check',
              question:
                'Match the term: an infection that takes hold when the immune system is weakened',
              options: [
                { id: 'art', label: 'ART (antiretroviral therapy)' },
                { id: 'uu', label: 'U=U' },
                { id: 'opportunistic-infection', label: 'Opportunistic infection' },
              ],
              correctOptionId: 'opportunistic-infection',
              explanation:
                'Opportunistic infection. An infection that takes advantage of a weakened immune system — illnesses a healthy body fights off easily but that become serious when defenses are down.',
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
            { id: 'hiv-s03-heading', type: 'heading', level: 1, text: 'Statistics' },
            pendingAudio(
              'hiv-s03-audio',
              'HIV Today: A Manageable Condition, an Aging Population, and the End of an Old Fear',
              `${ASSET_BASE}/s03-stats-podcast.mp3`,
              [
                'HIV Today: A Manageable Condition, an Aging Population, and the End of an Old Fear',
                '',
                'The story of HIV has changed almost beyond recognition, and caregivers need the current chapter, not the old one. Today more than a million people live with HIV in the United States, and — this is the part that matters for long-term care — they are aging. Thanks to effective treatment, people with HIV now live into their seventies, eighties, and beyond, which means a growing number of residents in nursing homes and assisted living have HIV as one of their chronic conditions, often well-controlled and barely affecting daily life.',
                '',
                'The reason is modern medicine. Antiretroviral therapy — a daily medication regimen — suppresses HIV so effectively that people with access to treatment have a near-normal life expectancy. HIV has moved from a feared, fatal illness into the same category as diabetes or high blood pressure: a chronic condition managed with daily medication. Most people on effective treatment never develop AIDS at all.',
                '',
                'Two facts from this transformation are essential for a CNA. The first is U equals U — undetectable equals untransmittable. Large, rigorous studies proved that a person with HIV who takes their medication and maintains an undetectable viral load cannot transmit the virus to a sexual partner. Treatment is prevention. This single fact dismantles much of the old fear. The second is that HIV is bloodborne — spread through blood and specific body fluids, never through casual contact, shared dishes, hugs, toilets, or the ordinary closeness of caregiving. The standard precautions a CNA already uses with every resident provide complete protection. There has never been a documented case of HIV transmission from the kind of casual contact that defines everyday care.',
                '',
                'Against all this progress stands the one thing that hasn\'t fully healed: stigma. HIV was met, for years, with fear, blame, and cruelty, and that legacy still wounds people who live with it — through isolation, shame, and discrimination, sometimes even within healthcare. For older adults with HIV, who often survived the most frightening years of the epidemic and lost friends and partners, this history runs deep. Research is clear that stigma worsens health by driving secrecy, isolation, and avoidance of care.',
                '',
                'The CNA\'s role flows directly from these facts: use standard precautions and be fully safe; understand U=U and the science, so fear gives way to knowledge; support the daily medication that keeps residents healthy; and provide warm, normal, confidential, stigma-free care that treats a resident with HIV exactly like anyone else — because medically, that\'s what they are. The bottom line: HIV is now a manageable chronic condition in an aging population, caregivers are fully protected by routine precautions, and the most important thing a CNA can add beyond safe care is the dignity that history denied.',
              ].join('\n'),
              '/assets/courses/hiv-aids/s03-stats-podcast.mp3',
            ),
            {
              id: 'hiv-s03-image',
              type: 'image',
              src: `${ASSET_BASE}/s03-hero.png`,
              caption:
                'HIV today — people are living long, healthy lives with proper treatment and support.',
            },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: 'Fundamentals',
        sortOrder: 3,
        buildContent: () =>
          doc('Fundamentals', [
            { id: 'hiv-s04-heading', type: 'heading', level: 1, text: 'Fundamentals' },
            {
              id: 'hiv-s04-video',
              type: 'video',
              title: 'Fundamentals',
              videoUrl: '/assets/courses/hiv-aids/s04-fundamentals.mp4',
              placeholderNote: 'Pending upload: /assets/courses/hiv-aids/s04-fundamentals.mp4',
            },
            {
              id: 'hiv-s04-image',
              type: 'image',
              src: `${ASSET_BASE}/s04-hero.png`,
              caption:
                'How HIV affects the immune system — and why consistent treatment matters.',
            },
            {
              id: 'hiv-s04-narration',
              type: 'text',
              body: [
                '**The immune system: the body\'s defense**',
                'The immune system is the body\'s defense force — a network of cells that recognizes and destroys germs before they make us sick. At its center are special cells that coordinate the whole defense, like commanders directing an army. As long as those commanders are healthy and numerous, the body fights off infections routinely, without us even noticing.',
                '**What HIV does**',
                'HIV attacks those very commander cells. The virus infects them, uses them to make copies of itself, and destroys them in the process. Slowly, over time, the number of these cells falls. With fewer commanders, the immune army becomes disorganized and weak — until the body can no longer defend itself against infections it once handled with ease. That gradual disabling of the immune system is the whole story of untreated HIV.',
                '**From HIV to AIDS**',
                'HIV infection moves through stages. After infection, many years can pass — especially without treatment — during which the immune system is slowly worn down, often with few symptoms. AIDS is the most advanced stage: it\'s diagnosed when the immune system has become severely damaged, or when certain serious "opportunistic" infections or cancers appear. Importantly, this progression is exactly what modern treatment prevents — most treated people never reach AIDS.',
                '**How treatment changes everything**',
                'Antiretroviral therapy — daily medication — stops HIV from copying itself. With the virus suppressed, the immune commander cells recover and rebuild, the immune system regains its strength, and the person stays healthy. The virus isn\'t cured or gone, but it\'s controlled — held in check by the daily medication. Stop the medication, and the virus rebounds; take it faithfully, and a person lives a full, healthy life. This is why daily adherence is everything.',
                '**Undetectable equals untransmittable**',
                'When treatment works well, it drives the amount of virus in the blood so low that tests can\'t detect it — undetectable. And here\'s the proven, transformative fact: a person with an undetectable viral load cannot transmit HIV sexually. Undetectable equals untransmittable — U equals U. It means effective treatment protects the person\'s health AND prevents transmission. It\'s also a powerful, science-based answer to old fears.',
                '**How HIV spreads — and how it doesn\'t**',
                'HIV is bloodborne. It spreads through blood and specific body fluids entering another person\'s body — in healthcare, through exposure to infected blood via a needlestick or broken skin. It does NOT spread through casual contact: not through touching, hugging, sharing dishes or bathrooms, coughing, or the everyday closeness of caregiving. Knowing exactly how it spreads — and how it doesn\'t — is what lets you be both safe and unafraid.',
                '**Safety through precautions, dignity through knowledge**',
                'Two fundamentals close this picture. Your safety comes from standard precautions — the same hand hygiene, gloves, and safe blood and sharps handling you use with every resident, which fully protect you. And your compassion comes from knowledge — understanding that HIV is controllable, doesn\'t spread casually, and that U equals U, so you can offer a resident with HIV completely normal, warm, dignified care, free of the fear and stigma that history attached to it.',
              ].join('\n\n'),
            },
            {
              id: 'hiv-s04-elder-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'HIV today: manageable, not a death sentence',
              body: 'With daily ART, people with HIV live long, healthy lives. U=U means effective treatment is also prevention. Standard precautions fully protect you; casual caregiving carries no HIV risk.',
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
            { id: 'hiv-s05-heading', type: 'heading', level: 1, text: 'Signs & Symptoms' },
            {
              id: 'hiv-s05-image',
              type: 'image',
              src: `${ASSET_BASE}/s05-hero.png`,
              caption:
                'Recognizing signs and symptoms — and knowing when to report changes to the nurse.',
            },
            {
              id: 'hiv-s05-narration',
              type: 'text',
              body: [
                'For a resident with HIV, what you watch depends on how well-controlled it is. Let\'s learn the picture — from well-managed HIV to the signs that the immune system is struggling.',
                '**Well-controlled HIV: often no signs at all**',
                'Start with the most common reality today: a resident with well-controlled HIV on treatment often has no HIV-related symptoms at all. They live, look, and function like anyone else, with HIV as a quiet background condition managed by a daily pill. Your main job with them isn\'t watching for dramatic signs — it\'s supporting that daily medication, providing normal dignified care, and using standard precautions as you do with everyone. Don\'t expect a "sick" resident; expect a person living well.',
                '**The opportunistic-infection watch**',
                'The signs to watch for appear when the immune system is weakened — in untreated, newly diagnosed, or poorly controlled HIV. Because defenses are down, ordinary infections take hold and linger. Watch for: a persistent cough or trouble breathing. Recurring or unusual fevers, and night sweats. Persistent or unusual diarrhea. White patches in the mouth, or a sore mouth or throat. Skin rashes, sores, or unusual spots. Infections that keep coming back or won\'t clear. Any of these in a resident with HIV — especially several together — is reported promptly, because catching an opportunistic infection early is critical when defenses are low.',
                '**The signs of advanced disease**',
                'In advanced HIV or AIDS, watch for the signs of a deeply struggling body: significant unexplained weight loss. Profound, persistent fatigue and weakness. Prolonged fevers, drenching night sweats, and chronic diarrhea. Swollen lymph nodes. New confusion, memory problems, or personality changes, since HIV and its infections can affect the brain. Serious or unusual infections. These are reported, and a resident showing them needs close attention and support.',
                '**What to report, and the immune-status reminder**',
                'Here\'s the key reporting principle: because a resident with weakened immunity can\'t fight infection well, even "small" signs of illness deserve prompt reporting — a cough, a fever, a sore, a patch in the mouth, new diarrhea, feeling unwell. What might be minor in another resident can become serious fast when the immune system is compromised. So with an immunocompromised resident, lower your threshold to report, watch a little closer, and never assume an infection will just clear on its own.',
                '**Summary**',
                'Four pictures. Well-controlled HIV: often no symptoms — support the daily medication and live normally. Opportunistic-infection watch: persistent cough, fevers, night sweats, diarrhea, mouth patches, recurring infections — report promptly. Advanced disease: weight loss, profound fatigue, prolonged fevers, swollen nodes, new confusion. Reporting principle: with weakened immunity, even small signs of infection get reported early.',
                'The rule underneath it all: a well-controlled resident lives normally and needs medication support; a resident with weakened immunity needs a lower reporting threshold, because infections that seem minor can turn serious fast.',
              ].join('\n\n'),
            },
            {
              id: 'hiv-s05-infection-callout',
              type: 'callout',
              variant: 'warning',
              title: 'Opportunistic infection watch',
              body: 'With weakened immunity, even small signs — cough, fever, mouth patches, night sweats — deserve prompt reporting. Infections that seem minor can turn serious fast.',
            },
          ]),
      },
      {
        slug: 's06-causes',
        title: 'Causes',
        sortOrder: 1,
        buildContent: () =>
          doc('Causes', [
            { id: 'hiv-s06-heading', type: 'heading', level: 1, text: 'Causes' },
            pendingAudio(
              'hiv-s06-audio',
              'How HIV Spreads, How It Doesn\'t, and Why Caregivers Are Safe',
              `${ASSET_BASE}/s06-causes-podcast.mp3`,
              HIV_S06_CAUSES_NARRATION,
              '/assets/courses/hiv-aids/s06-causes-podcast.mp3',
            ),
            {
              id: 'hiv-s06-image',
              type: 'image',
              src: `${ASSET_BASE}/s06-hero.png`,
              caption:
                'How HIV is — and isn\'t — transmitted: standard precautions protect everyone.',
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
              id: 'hiv-s07-heading',
              type: 'heading',
              level: 1,
              text: 'CNA Role & Best Practices',
            },
            {
              id: 'hiv-s07-image',
              type: 'image',
              src: `${ASSET_BASE}/s07-hero.png`,
              caption:
                'Antiretroviral therapy — supporting residents in taking medications consistently.',
            },
            {
              id: 'hiv-s07-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of practice',
              body: 'CNAs SUPPORT ADHERENCE, USE STANDARD PRECAUTIONS, WATCH FOR INFECTION, and GUARD CONFIDENTIALITY. CNAs never diagnose HIV, give or adjust medications, or interpret lab results.',
            },
            {
              id: 'hiv-s07-narration',
              type: 'text',
              body: [
                'HIV treatment is built on one daily habit — taking the medication — and the CNA supports it, alongside standard precautions, infection-watching, and dignity. Let\'s walk through it, starting with the rule that never bends, stated firmly because it matters most here. A CNA does not diagnose HIV, does not give or adjust antiretroviral or any medications, and does not interpret lab results.',
                '**Supporting medication adherence — the heart of HIV care.** Antiretroviral therapy works only when taken consistently — every day, as prescribed. Missed doses let the virus rebound and can lead to drug resistance, which is serious. So while the nurse administers the medication, your support matters enormously: help residents be ready at medication times, support the routine, encourage adherence warmly, and report immediately if a resident is missing doses, refusing, vomiting up medication, or struggling with the regimen. For a resident with HIV, faithful daily medication is the single most important thing keeping them healthy — and you help protect that.',
                '**Standard precautions — your complete protection.** Use the standard precautions you apply with everyone: thorough hand hygiene, gloves and protective equipment for blood and body fluid contact, safe handling of fluids and spills, and careful sharps practice — never recapping needles. These fully protect you; HIV adds no special routine beyond the universal precautions you already use. And know your exposure plan: a blood exposure means wash or flush immediately and report at once, because preventive treatment after an HIV exposure is highly effective and time-sensitive.',
                '**Watching for and protecting against infection.** Because a weakened immune system invites infection, support the resident\'s defenses and watch closely: encourage nutrition and hydration, keep their environment clean, practice excellent hygiene, protect them from others\' illnesses where possible, and report even small signs of infection promptly. For an immunocompromised resident, early reporting of infection is genuine protection.',
                '**Confidentiality — a specific duty.** A resident\'s HIV status is private, protected health information. Share it only with the care team who need it for safe care, never with other residents, visitors, or staff who don\'t need to know, and never let it become gossip. Breaching HIV confidentiality is both a serious ethical and legal violation and a deep harm to the resident. Guard it carefully.',
                '**Comfort, support, and the whole person.** Provide comfort for any symptoms within your role, support emotional wellbeing, and remember that older adults with HIV may carry decades of trauma and loss from the epidemic. Warm, steady, normal care matters.',
                'The scope point for this section: you never diagnose, medicate, or read labs — but you support the all-important daily adherence, protect yourself and the resident through precautions and infection-watching, guard confidentiality, and report. Adherence support and standard precautions are the care you deliver.',
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
            { id: 'hiv-s08-heading', type: 'heading', level: 1, text: 'Prevention & Risk Reduction' },
            {
              id: 'hiv-s08-image',
              type: 'image',
              src: `${ASSET_BASE}/s08-hero.png`,
              caption:
                'Prevention in care — standard precautions, safe handling, and protecting yourself and residents.',
            },
            {
              id: 'hiv-s08-narration',
              type: 'text',
              body: [
                'In HIV care, prevention works in two directions: protecting the resident\'s vulnerable immune system, and protecting yourself — plus protecting dignity. Here are seven ways.',
                '**One. Support daily medication adherence faithfully.** The best prevention of all is keeping the resident\'s HIV controlled — which means the daily medication taken every day. Support the routine, encourage it warmly, and report missed, refused, or vomited doses immediately. Faithful adherence keeps the immune system strong and prevents the resident from ever becoming sick from HIV.',
                '**Two. Protect the resident from infections.** A weakened immune system needs guarding. Practice excellent hand hygiene before their care, keep their environment clean, and protect them from exposure to others\' illnesses — keep sick visitors and staff away, and be especially careful during outbreaks. Support good nutrition and hydration to keep defenses strong. You\'re shielding a body that can\'t fully shield itself.',
                '**Three. Watch closely and report early.** Because infections turn serious fast in immunocompromised residents, lower your threshold: report even small signs — a cough, a fever, mouth patches, new diarrhea, a sore, feeling unwell — promptly. Early reporting lets infections be treated before they become dangerous. Vigilance is prevention here.',
                '**Four. Use standard precautions to protect yourself.** The precautions you already use with everyone fully protect you: hand hygiene, gloves and protective equipment for blood and fluids, safe spill and sharps handling, never recapping needles. HIV requires nothing extra beyond faithful universal precautions. Use them consistently and you are safe.',
                '**Five. Know and use the exposure plan.** Know your facility\'s exposure procedure. If you\'re ever exposed to blood — a needlestick, a cut, a splash — wash or flush immediately and report it right away, because post-exposure preventive medication for HIV is highly effective but must be started quickly. Never delay or hide an exposure; prompt action protects you.',
                '**Six. Guard confidentiality absolutely.** A resident\'s HIV status is private. Share it only with the care team who genuinely need it, never with other residents, visitors, or uninvolved staff, and never as gossip. Protecting confidentiality prevents the stigma, isolation, and harm that disclosure can cause — it\'s prevention of a different but very real kind.',
                '**Seven. Prevent stigma with normal, warm care.** Treat a resident with HIV exactly like any other resident — same warmth, same touch, same dignity, same normal human contact. Don\'t over-glove, flinch, or keep distance during ordinary care, because doing so signals fear that wounds the resident. Knowledgeable, normal, respectful care prevents the stigma that history attached to HIV — and that prevention is yours to give.',
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
              id: 'hiv-s09-heading',
              type: 'heading',
              level: 1,
              text: 'Scenario & Reporting',
            },
            pendingAudio(
              'hiv-s09-intro-audio',
              'Emergency response scenarios intro',
              `${ASSET_BASE}/s09-emergency-intro.mp3`,
              'With HIV care, the judgments that matter most are recognizing infection early in a vulnerable immune system, and protecting both the resident\'s dignity and confidentiality. You\'re about to work through two situations. Read each carefully, choose your action, and you\'ll get feedback right away. Keep the core ideas in mind: with weakened immunity, even small signs of infection are reported early — and a resident\'s HIV status is private and must be protected.',
              '/assets/courses/hiv-aids/s09-emergency-intro.mp3',
            ),
            {
              id: 'hiv-s09-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-hero.png`,
              caption:
                'Responding to potential exposure and complications — act promptly and involve the nurse.',
            },
            {
              id: 'hiv-s09-scenario-mensah-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-scenario-mensah.png`,
              caption:
                'New symptoms in a resident with weakened immunity — report the changes promptly rather than waiting them out.',
            },
            {
              id: 'hiv-s09-scenario-mensah',
              type: 'scenario_question',
              prompt:
                'Mr. Mensah has HIV that hasn\'t been well-controlled recently, so his immune system is weakened. Over the past two days you\'ve noticed: a persistent cough, a low fever, night sweats that soaked his sheets, and now some white patches in his mouth and less appetite. A coworker says, "It\'s probably just a cold going around — wait and see if it clears." What SHOULD the CNA do?',
              options: [
                {
                  id: 'wait-and-see',
                  label: 'Wait and see if it clears, like a normal cold',
                  feedback:
                    'In a weakened immune system, a cough, fever, night sweats, and mouth patches together suggest opportunistic infection — which can become serious fast, unlike a routine cold. "Wait and see" and self-medicating are exactly the wrong moves here. The right action: report the full picture to the nurse promptly so it can be treated early.',
                },
                {
                  id: 'report-promptly',
                  label:
                    'Report these signs to the nurse promptly — in a weakened immune system, infections can become serious fast',
                  feedback:
                    'Right. In a resident with a weakened immune system, you lower your threshold to report, because infections that would be minor in someone else can take hold and turn serious quickly. A persistent cough, fever, drenching night sweats, white mouth patches, and poor appetite — several signs together — point to one or more opportunistic infections taking advantage of his lowered defenses. This is exactly when early reporting matters most: caught early, these are treatable; left to "wait and see," they can become dangerous. Report the full picture to the nurse promptly. Don\'t give medications on your own, and don\'t assume an immunocompromised resident\'s infection will simply clear. With weakened immunity, prompt reporting is genuine protection.',
                  isRecommended: true,
                },
                {
                  id: 'otc-cold-medicine',
                  label: 'Give him over-the-counter cold medicine',
                  feedback:
                    'In a weakened immune system, a cough, fever, night sweats, and mouth patches together suggest opportunistic infection — which can become serious fast, unlike a routine cold. "Wait and see" and self-medicating are exactly the wrong moves here. The right action: report the full picture to the nurse promptly so it can be treated early.',
                },
                {
                  id: 'assume-nothing',
                  label: 'Assume it\'s nothing since he doesn\'t seem very sick yet',
                  feedback:
                    'In a weakened immune system, a cough, fever, night sweats, and mouth patches together suggest opportunistic infection — which can become serious fast, unlike a routine cold. "Wait and see" and self-medicating are exactly the wrong moves here. The right action: report the full picture to the nurse promptly so it can be treated early.',
                },
              ],
              requiredForCompletion: true,
            },
            {
              id: 'hiv-s09-scenario-rivera-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-scenario-rivera.png`,
              caption:
                'Protecting resident confidentiality — never confirm a diagnosis, and calmly reassure without disclosing.',
            },
            {
              id: 'hiv-s09-scenario-rivera',
              type: 'scenario_question',
              prompt:
                'Another resident\'s visitor notices you caring for Ms. Rivera and asks you quietly, "I heard she has HIV — is that true? Should the rest of us be worried about catching something from her?" A new aide nearby looks anxious and is clearly wondering the same thing. What SHOULD the CNA do?',
              options: [
                {
                  id: 'confirm-status',
                  label: 'Confirm Ms. Rivera\'s HIV status so the visitor can "stay safe"',
                  feedback:
                    'Confirming or discussing Ms. Rivera\'s HIV status — or telling people to avoid her — violates her confidentiality and spreads harmful, false stigma, since HIV doesn\'t spread by casual contact. The right action: don\'t confirm or discuss her information at all, and instead reassure generally that HIV isn\'t spread casually and standard precautions keep everyone safe.',
                },
                {
                  id: 'protect-confidentiality',
                  label:
                    'Protect her confidentiality — don\'t confirm or discuss her medical information — and reassure generally that HIV isn\'t spread by casual contact and standard precautions keep everyone safe',
                  feedback:
                    'Right. A resident\'s HIV status is private, protected health information — you never confirm or discuss it with other residents, visitors, or staff who aren\'t part of her care, no matter how the question is framed. So you don\'t confirm anything about Ms. Rivera specifically. What you can do is address the underlying fear with accurate general education: HIV is not spread through casual contact — not by sharing spaces, dishes, or normal social closeness — and standard precautions, which staff use with everyone, keep all residents and staff safe. That protects her confidentiality, corrects the misinformation driving the worry, and calms the anxious new aide without any breach. Telling people to "avoid her" would be both a confidentiality violation and cruel stigma based on a falsehood. Protect her privacy; answer fear with facts.',
                  isRecommended: true,
                },
                {
                  id: 'avoid-resident',
                  label: 'Tell the visitor to avoid Ms. Rivera just in case',
                  feedback:
                    'Confirming or discussing Ms. Rivera\'s HIV status — or telling people to avoid her — violates her confidentiality and spreads harmful, false stigma, since HIV doesn\'t spread by casual contact. The right action: don\'t confirm or discuss her information at all, and instead reassure generally that HIV isn\'t spread casually and standard precautions keep everyone safe.',
                },
                {
                  id: 'discuss-with-aide',
                  label: 'Discuss her diagnosis with the new aide to ease their worry',
                  feedback:
                    'Confirming or discussing Ms. Rivera\'s HIV status — or telling people to avoid her — violates her confidentiality and spreads harmful, false stigma, since HIV doesn\'t spread by casual contact. The right action: don\'t confirm or discuss her information at all, and instead reassure generally that HIV isn\'t spread casually and standard precautions keep everyone safe.',
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
            { id: 'hiv-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
              id: 'hiv-s10-video',
              type: 'video',
              title: "The CNA's Role",
              videoUrl: '/assets/courses/hiv-aids/s10-cna-role.mp4',
              placeholderNote: 'Pending upload: /assets/courses/hiv-aids/s10-cna-role.mp4',
            },
            {
              id: 'hiv-s10-image',
              type: 'image',
              src: `${ASSET_BASE}/s10-hero.png`,
              caption:
                'Your role — dignity, confidentiality, and person-centered support.',
            },
            {
              id: 'hiv-s10-narration',
              type: 'text',
              body: [
                'Your role in HIV care is adherence support, self-protection, vigilant infection-watching, confidentiality, and fierce, normal dignity. Let\'s walk through it.',
                '**Support the daily medication** The most important thing you support is daily adherence. Help residents be ready at medication times, encourage the routine warmly, and report immediately any missed, refused, or vomited doses, or struggles with the regimen — because consistent medication is what keeps a resident with HIV healthy and prevents the virus from rebounding. You\'re protecting the foundation of their health.',
                '**Protect yourself with routine precautions** Keep yourself safe with the standard precautions you use with everyone — hand hygiene, gloves and protective equipment for blood and fluids, safe spill and sharps handling, never recapping needles. HIV needs nothing beyond these universal precautions. And know your exposure plan: if exposed, wash or flush immediately and report at once, because post-exposure treatment is effective and time-sensitive. Safe practice, every resident, every time.',
                '**Guard against infection and watch closely** Protect the resident\'s vulnerable immune system: excellent hygiene, a clean environment, distance from others\' illnesses, good nutrition support — and a lowered threshold to report, since even small signs of infection can turn serious fast. Watch closely and report early; for an immunocompromised resident, your vigilance is real protection.',
                '**Confidentiality and stigma-free dignity** Guard confidentiality absolutely — HIV status is shared only with the care team who need it, never as gossip or with others. And give fiercely normal, warm care: the same touch, the same dignity, the same human connection as any resident, with no flinching, over-gloving, or distance during ordinary care. For older adults who survived the worst years of the epidemic, your normal, respectful care can be deeply healing.',
                'Now the boundary. You do not diagnose HIV. You do not give or adjust medications or interpret labs. You never breach confidentiality, never skip standard precautions, never hide an exposure, and never treat a resident with stigma or fear.',
                'Inside your role — adherence support, self-protection, infection vigilance, confidentiality, and stigma-free dignity — you keep a resident with HIV healthy and safe, protect yourself completely, and offer the normal human care that history too often denied. Safety and compassion, grounded in accurate knowledge, are the whole of this care.',
              ].join('\n\n'),
            },
            {
              id: 'hiv-s10-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Stay within scope',
              body: 'You do not diagnose HIV, give or adjust medications, or interpret labs. Support adherence, use standard precautions, watch for infection, guard confidentiality, and give stigma-free care.',
            },
          ]),
      },
      {
        slug: 's11-case-study',
        title: 'Case Study',
        sortOrder: 2,
        buildContent: () =>
          doc('Case Study', [
            { id: 'hiv-s11-heading', type: 'heading', level: 1, text: 'Case Study' },
            pendingAudio(
              'hiv-s11-audio',
              'The Resident Everyone Was Afraid Of',
              `${ASSET_BASE}/s11-case-podcast.mp3`,
              HIV_S11_CASE_NARRATIVE,
              '/assets/courses/hiv-aids/s11-case-podcast.mp3',
            ),
            {
              id: 'hiv-s11-image',
              type: 'image',
              src: `${ASSET_BASE}/s11-hero.png`,
              caption:
                'Putting it together — applying compassionate, competent HIV care.',
            },
            {
              id: 'hiv-s11-case-study',
              type: 'case_study',
              title: 'The Resident Everyone Was Afraid Of',
              residentProfile:
                'Mr. Delacroix, 68, had lived with HIV for over thirty years — a survivor of the epidemic\'s most terrifying era, who had buried many friends and a partner. His HIV was well-controlled on daily medication, his viral load undetectable; medically, he was a healthy older man with a managed chronic condition. But when he moved into the facility, fear moved in around him. Word of his diagnosis spread among staff, and his CNA, Joelle, watched some of her coworkers change: extra gloves for tasks that needed none, a flinch at casual touch, a subtle distance, conversations that stopped when he wheeled by. Mr. Delacroix noticed all of it. He grew quiet and withdrawn, retreating to his room — the old, familiar experience of being treated as a contagion rather than a person.',
              scenario: [
                '**What Joelle knew:** Joelle had learned the modern facts, and they made her certain. HIV is bloodborne, not spread by casual contact — not by touch, not by sharing space, not by the everyday closeness of caregiving. Mr. Delacroix\'s undetectable viral load meant U equals U. The standard precautions she used with every resident already gave her complete protection; there was nothing to fear in helping him dress, sharing a laugh, or putting a reassuring hand on his shoulder. The extra gloves and the distance weren\'t precaution — they were stigma built on outdated fear, and they were wounding a man who had already survived more than enough of it.',
                '**What Joelle did:** She cared for Mr. Delacroix exactly as she cared for anyone — warm, normal, hands-on, unhurried. Standard precautions when blood or body fluids were actually involved, like with every resident; and otherwise, completely ordinary human care: helping him without hesitation, sitting and talking, laughing at his dry jokes, a hand on his arm. She protected his confidentiality fiercely, never discussing his status with anyone outside his care team. And when a coworker over-gloved to simply hand him a cup of water and asked her, uneasily, "Aren\'t you worried?", Joelle answered plainly and kindly: "There\'s nothing to catch from handing him water — HIV doesn\'t spread that way. We use standard precautions with everybody for the real stuff. The gloves-for-everything thing isn\'t protecting us; it\'s telling him we think he\'s dangerous, and he isn\'t." She also raised the pattern with the nurse, who arranged a refresher for the unit on how HIV actually spreads.',
                '**The turn:** Joelle\'s steady, normal care — and the education that followed — began to shift the unit. As staff understood the facts, the flinching faded, the unnecessary gloves disappeared, and Mr. Delacroix slowly came back out of his room. He started joining activities again, trading jokes at meals, becoming part of the community. He told Joelle one day, quietly: "You\'re the first person here who treated me like a person instead of a disease. You have no idea what that\'s worth — or maybe you do."',
                '**The outcome:** Mr. Delacroix lived comfortably and connected, his health steady on his medication, his dignity restored by being treated as what he was — a person, not a hazard. And no staff member was ever at any risk, because casual care carried none and standard precautions covered the rest. The nurse later told Joelle: "You had the facts right, so you were never afraid and never unsafe — and you gave that man back his place among people. The science and the compassion were the same thing in how you worked."',
                '**Discussion:** Joelle\'s case shows that, with HIV, accurate knowledge is the root of both safety and dignity. Because she understood exactly how HIV spreads and doesn\'t, she was fully protected without a shred of fear — and free to offer normal, warm, hands-on care. She used real precautions for real risks and refused the theater of stigma that masquerades as caution. She guarded confidentiality, corrected misinformation kindly, and escalated for education. She never diagnosed or medicated — she supported, protected, and respected. And she gave an epidemic survivor the one thing stigma had always denied him: to be treated, fully and warmly, as a human being.',
              ].join('\n\n'),
            },
            {
              id: 'hiv-s11-reflection-1',
              type: 'reflection',
              prompt:
                'Coworkers used extra gloves and kept distance for ordinary, no-risk contact with Mr. Delacroix. Why was that stigma rather than precaution, and how did Joelle\'s accurate knowledge of HIV transmission let her be both safe and warm?',
              minCharacters: 50,
            },
            {
              id: 'hiv-s11-reflection-2',
              type: 'reflection',
              prompt:
                'Joelle protected Mr. Delacroix\'s confidentiality and corrected coworkers\' fears with facts. Why are confidentiality and accurate education both essential to dignified HIV care?',
              minCharacters: 50,
            },
            {
              id: 'hiv-s11-rp-text',
              type: 'text',
              body: 'Reflect on the case study in the previous lesson. Your written responses help you apply what you learned about stigma-free care, confidentiality, accurate knowledge of HIV transmission, and normal dignified caregiving.',
            },
            {
              id: 'hiv-s11-kc2-check',
              type: 'knowledge_check',
              question:
                'A CNA does not diagnose HIV, does not give or adjust antiretroviral or any medications, and does not interpret lab results. Mr. Mensah has HIV that hasn\'t been well-controlled recently, so his immune system is weakened. Over the past two days you\'ve noticed: a persistent cough, a low fever, night sweats that soaked his sheets, and now some white patches in his mouth and less appetite. A coworker says, "It\'s probably just a cold going around — wait and see if it clears." What SHOULD the CNA do?',
              options: [
                {
                  id: 'wait-and-see',
                  label: 'Wait and see if it clears, like a normal cold',
                },
                {
                  id: 'report-promptly',
                  label:
                    'Report these signs to the nurse promptly — in a weakened immune system, infections can become serious fast',
                },
                {
                  id: 'otc-cold-medicine',
                  label: 'Give him over-the-counter cold medicine',
                },
                {
                  id: 'assume-nothing',
                  label: 'Assume it\'s nothing since he doesn\'t seem very sick yet',
                },
              ],
              correctOptionId: 'report-promptly',
              explanation:
                'You never diagnose, medicate, or read labs — but your prompt reporting of infection signs in a weakened immune system supports the treatment the care team provides.',
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
            { id: 'hiv-s12-heading', type: 'heading', level: 1, text: 'Conclusion' },
            {
              id: 'hiv-s12-video',
              type: 'video',
              title: 'Conclusion',
              videoUrl: '/assets/courses/hiv-aids/s12-conclusion.mp4',
              placeholderNote: 'Pending upload: /assets/courses/hiv-aids/s12-conclusion.mp4',
            },
            {
              id: 'hiv-s12-image',
              type: 'image',
              src: `${ASSET_BASE}/s12-hero.png`,
              caption:
                'Caring with knowledge and respect — every resident deserves dignity.',
            },
            {
              id: 'hiv-s12-narration',
              type: 'text',
              body: [
                'You\'ve reached the end. Let\'s lock in the five things that matter most for HIV care.',
                '**One.** HIV attacks the immune system — but today it\'s a manageable chronic condition, not a death sentence. With daily antiretroviral medication, people with HIV live long, healthy lives and most never progress to AIDS. And undetectable equals untransmittable: effective treatment is also prevention.',
                '**Two.** Support the daily medication — it\'s everything. Consistent adherence keeps the virus suppressed and the resident healthy; missed doses let it rebound. Support the routine warmly and report any missed, refused, or vomited doses immediately. You\'re protecting the foundation of their health.',
                '**Three.** Standard precautions fully protect you. HIV is bloodborne and does NOT spread by casual contact — not by touch, dishes, toilets, air, or the closeness of caregiving. The precautions you use with everyone are complete protection, and a blood exposure means wash or flush and report immediately, because post-exposure treatment is time-sensitive.',
                '**Four.** Watch closely and guard the immune system. Because weakened immunity lets infections turn serious fast, lower your threshold to report — even small signs of infection get reported early. Protect the resident from illness exposure, support nutrition, and keep them safe.',
                '**Five.** Protect confidentiality, and give fiercely normal dignity. HIV status is private — never gossip or disclose it outside the care team. And treat a resident with HIV exactly like anyone else — same warmth, same touch, no flinching or over-gloving — because accurate knowledge lets you be safe and compassionate at once. Honor your scope: you never diagnose, medicate, or read labs, but you support, protect, guard, and respect.',
              ].join('\n\n'),
            },
            {
              id: 'hiv-s12-summary',
              type: 'summary',
              title: 'Five things that matter most',
              items: [
                'HIV is a manageable chronic condition — daily ART and U=U mean treatment is also prevention.',
                'Support daily medication adherence — report missed, refused, or vomited doses immediately.',
                'Standard precautions fully protect you — HIV does not spread by casual contact.',
                'Watch closely and report early — weakened immunity means even small infection signs matter.',
                'Protect confidentiality and give stigma-free, normal, dignified care.',
              ],
            },
            {
              id: 'hiv-s12-whn-text',
              type: 'text',
              body: 'Ten questions are waiting. Everything on them was covered here. You\'re ready. Trust what you\'ve learned, and show what you know.',
            },
            {
              id: 'hiv-s12-cr-text',
              type: 'text',
              body: 'This course provides one hour of continuing education credit through CAL ACE Nursing Academy, an approved CDPH continuing education provider, NAC number 7384. Your certificate is generated automatically when you pass the knowledge check.',
            },
            {
              id: 'hiv-s12-cr-callout',
              type: 'callout',
              variant: 'info',
              title: 'Scope reminder',
              body: 'CNAs support adherence, use standard precautions, watch for infection, and provide stigma-free care. CNAs do not diagnose HIV, give or adjust medications, or interpret lab results.',
            },
            {
              id: 'hiv-s12-ca-text',
              type: 'text',
              body: 'Your certificate is generated automatically when you pass the knowledge check. CDPH-Approved CE Provider — NAC #7384.',
            },
          ]),
      },
    ],
  },
];

export async function seedCourse41HivAids(
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
  console.log(`Seeding Course 41 (Caring for a Resident with HIV / AIDS) as DRAFT — slug "${COURSE_SLUG}"…`);

  try {
    const result = await seedCourse41HivAids(prisma);
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
