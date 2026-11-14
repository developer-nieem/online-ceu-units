/**
 * Seed Course 20 — Tuberculosis: Warning Signs and Precautions Every CNA Must Know (DRAFT).
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-20-tuberculosis
 *
 * Idempotent upserts by slug. Does not seed the final quiz (pending owner approval).
 * Lesson slugs follow the 12-lesson published structure (s01-introduction … s12-conclusion).
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
const COURSE_SLUG = 'tuberculosis';
const COURSE_TITLE = 'TB Awareness: Signs, Precautions, and Reporting';
const COURSE_SUMMARY =
  'Learn to recognize TB warning signs, follow airborne isolation precautions and respiratory protection, support the care plan and medication adherence, and protect yourself and others. CNAs do not diagnose TB, give or adjust TB medications, or interpret TB test results.';

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
    'Explain what TB is and how it spreads',
    'Recognize the warning signs that suggest TB',
    'Follow airborne isolation precautions and use respiratory protection correctly',
    'Support TB treatment and medication adherence',
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
  heroImage: '/assets/courses/tuberculosis/hero-banner.png',
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
    title: 'Understanding Tuberculosis',
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: 'Introduction',
        sortOrder: 0,
        buildContent: () =>
          doc('Introduction', [
            { id: 'tb-s01-heading', type: 'heading', level: 1, text: 'Introduction' },
            {
              id: 'tb-s01-video',
              type: 'video',
              title: 'Introduction',
              videoUrl: `${ASSET_BASE}/s01-intro.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s01-intro.mp4`,
            },
            {
              id: 'tb-s01-image',
              type: 'image',
              src: '/assets/courses/tuberculosis/s01-hero.jpg',
              caption:
                'A CAL ACE CNA in proper protection caring for a resident with tuberculosis.',
            },
            {
              id: 'tb-s01-narration',
              type: 'text',
              body: [
                'Welcome to CAL ACE Nursing Academy.',
                'This course is about tuberculosis — T-B — and the warning signs and precautions every CNA must know.',
                'Tuberculosis is a serious infectious disease, usually of the lungs, caused by bacteria. What makes TB different from the other respiratory conditions you\'ve studied is one critical word: airborne. TB spreads through the air. When a person with active TB coughs, sneezes, speaks, or even sings, they release tiny droplets carrying the bacteria, and others nearby can breathe them in. This is why TB is not just a danger to the resident who has it — it\'s a danger to other residents, to visitors, and to you.',
                'Many people think TB belongs to the past. It does not. TB still exists today, in California and across the country, and long-term care settings carry real risk. Residents are older, often with weaker immune systems, living closely together. A single unrecognized case can expose many people. That\'s exactly why a CNA\'s knowledge here matters so much.',
                'This course has a strong focus you\'ll feel throughout: protecting yourself and others. You\'ll learn the warning signs that should make you think of TB, the airborne isolation precautions that stop it from spreading, and the respiratory protection — like the N95 mask — that keeps you safe. This is a course about recognition and protection.',
                'Your scope is clear. A CNA recognizes possible TB warning signs, follows isolation and respiratory precautions exactly, supports the care plan and medication adherence, and protects everyone. A CNA does not diagnose TB, does not give or adjust TB medications, and does not interpret TB test results.',
                'By the end of this course, you will be able to: explain what TB is and how it spreads. Recognize the warning signs that suggest TB. Follow airborne isolation precautions and use respiratory protection correctly. Support TB treatment and medication adherence. And know your scope.',
                'There is a ten-question knowledge check at the end. Everything on it is covered here. Let\'s begin.',
              ].join('\n\n'),
            },
            {
              id: 'tb-s01-course-information-text',
              type: 'text',
              body: [
                'This course teaches the CNA\'s role in recognizing TB warning signs, following airborne isolation precautions and respiratory protection, supporting the care plan and medication adherence, and protecting yourself and others.',
                'Let\'s be clear about your role. A CNA recognizes possible TB warning signs, follows isolation and respiratory precautions exactly, supports the care plan and medication adherence, and protects everyone. A CNA does not diagnose TB, does not give or adjust TB medications, and does not interpret TB test results. Those are nursing and physician tasks. But none of them can happen without your careful observation and faithful reporting first.',
              ].join('\n\n'),
            },
            {
              id: 'tb-s01-course-information-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of this course',
              body: 'CNAs RECOGNIZE, PROTECT, SUPPORT, and REPORT. CNAs do not diagnose TB, give or adjust TB medications, or interpret TB test results.',
            },
            {
              id: 'tb-s01-learning-objectives-text',
              type: 'text',
              body: 'By the end of this course, you will be able to:',
            },
            {
              id: 'tb-s01-learning-objectives-summary',
              type: 'summary',
              title: 'Learning objectives',
              items: [
                'Explain what TB is and how it spreads.',
                'Recognize the warning signs that suggest TB.',
                'Follow airborne isolation precautions and use respiratory protection correctly.',
                'Support TB treatment and medication adherence.',
                'Know your scope — what a CNA does, and what a CNA must never do.',
              ],
            },
            {
              id: 'tb-s01-instructor-intro-text',
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
            { id: 'tb-s02-heading', type: 'heading', level: 1, text: 'Terms & Definitions' },
            {
              id: 'tb-s02-image',
              type: 'image',
              src: '/assets/courses/tuberculosis/s02-hero.jpg',
              caption: 'The language of TB — airborne, latent vs. active, isolation, N95.',
            },
            {
              id: 'tb-s02-reveal-tb',
              type: 'reveal_card',
              frontTitle: 'Tuberculosis (TB)',
              frontBody: 'Too-ber-kew-LOH-sis',
              backTitle: 'Tuberculosis (TB)',
              backBody:
                'A serious infectious disease caused by bacteria, usually affecting the lungs. It spreads through the air from person to person. TB can be very serious, especially in older adults and people with weak immune systems.',
            },
            {
              id: 'tb-s02-reveal-airborne',
              type: 'reveal_card',
              frontTitle: 'Airborne Transmission',
              frontBody: 'Airborne transmission',
              backTitle: 'Airborne Transmission',
              backBody:
                'When germs spread through tiny droplets that float in the air after a person coughs, sneezes, speaks, or sings. Others nearby breathe them in. TB spreads this way — which is why special air precautions are needed, beyond ordinary masks and hand washing.',
            },
            {
              id: 'tb-s02-reveal-latent',
              type: 'reveal_card',
              frontTitle: 'Latent TB Infection',
              frontBody: 'LAY-tent',
              backTitle: 'Latent TB Infection',
              backBody:
                'When a person carries the TB bacteria but is not sick and cannot spread it. The bacteria are "sleeping." A person with latent TB feels fine and isn\'t contagious — but it can become active later, especially if their immune system weakens.',
            },
            {
              id: 'tb-s02-reveal-active',
              type: 'reveal_card',
              frontTitle: 'Active TB Disease',
              frontBody: 'Active TB disease',
              backTitle: 'Active TB Disease',
              backBody:
                'When the TB bacteria are growing and making the person sick — with cough, fever, weight loss, and more. A person with active TB of the lungs can spread it to others through the air. This is the contagious form that requires isolation precautions.',
            },
            {
              id: 'tb-s02-reveal-isolation',
              type: 'reveal_card',
              frontTitle: 'Airborne Isolation Precautions',
              frontBody: 'Airborne isolation precautions',
              backTitle: 'Airborne Isolation Precautions',
              backBody:
                'Special steps used for a resident with active TB: a private room with special airflow when available, keeping the door closed, limiting who enters, and wearing respiratory protection. These precautions stop the bacteria from spreading through the air.',
            },
            {
              id: 'tb-s02-reveal-n95',
              type: 'reveal_card',
              frontTitle: 'N95 Respirator',
              frontBody: 'N95 respirator',
              backTitle: 'N95 Respirator',
              backBody:
                'A special mask that fits tightly to the face and filters out tiny airborne particles, including TB bacteria. An ordinary surgical mask is not enough for TB — staff need a properly fitted N95. It must be fit-tested to seal correctly.',
            },
            {
              id: 'tb-s02-reveal-test',
              type: 'reveal_card',
              frontTitle: 'TB Skin Test / Blood Test',
              frontBody: 'TB skin test / blood test',
              backTitle: 'TB Skin Test / Blood Test',
              backBody:
                'Tests that check whether a person has been infected with TB bacteria. Healthcare workers, including CNAs, are usually tested regularly. Remember — a CNA does not interpret these test results; that\'s done by the nurse or doctor.',
            },
            {
              id: 'tb-s02-reveal-sputum',
              type: 'reveal_card',
              frontTitle: 'Sputum',
              frontBody: 'SPYOO-tum',
              backTitle: 'Sputum',
              backBody:
                'The thick mucus coughed up from deep in the lungs. In TB, sputum is tested in a lab to find the bacteria and to check whether a person is still contagious. CNAs may help collect a sputum sample following safety precautions, but the testing is done by the lab.',
            },
            {
              id: 'tb-s02-kc1-check-airborne',
              type: 'knowledge_check',
              question: 'Match the term: germs spread through tiny droplets floating in the air',
              options: [
                { id: 'airborne-transmission', label: 'Airborne transmission' },
                { id: 'active-tb-disease', label: 'Active TB disease' },
                { id: 'n95-respirator', label: 'N95 respirator' },
              ],
              correctOptionId: 'airborne-transmission',
              explanation:
                'Airborne transmission. When germs spread through tiny droplets that float in the air after a person coughs, sneezes, speaks, or sings. Others nearby breathe them in.',
              requiredForCompletion: true,
            },
            {
              id: 'tb-s02-kc1-check-active',
              type: 'knowledge_check',
              question:
                'Match the term: TB is growing, making the person sick and contagious',
              options: [
                { id: 'airborne-transmission', label: 'Airborne transmission' },
                { id: 'active-tb-disease', label: 'Active TB disease' },
                { id: 'n95-respirator', label: 'N95 respirator' },
              ],
              correctOptionId: 'active-tb-disease',
              explanation:
                'Active TB disease. When the TB bacteria are growing and making the person sick — with cough, fever, weight loss, and more. A person with active TB of the lungs can spread it to others through the air.',
              requiredForCompletion: true,
            },
            {
              id: 'tb-s02-kc1-check-n95',
              type: 'knowledge_check',
              question:
                'Match the term: a fitted mask that filters out tiny airborne TB particles',
              options: [
                { id: 'airborne-transmission', label: 'Airborne transmission' },
                { id: 'active-tb-disease', label: 'Active TB disease' },
                { id: 'n95-respirator', label: 'N95 respirator' },
              ],
              correctOptionId: 'n95-respirator',
              explanation:
                'N95 respirator. A special mask that fits tightly to the face and filters out tiny airborne particles, including TB bacteria. An ordinary surgical mask is not enough for TB.',
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
            { id: 'tb-s03-heading', type: 'heading', level: 1, text: 'Statistics' },
            pendingAudio(
              'tb-s03-audio',
              'Tuberculosis: Not a Disease of the Past',
              `${ASSET_BASE}/s03-stats-podcast.mp3`,
              [
                'Tuberculosis: Not a Disease of the Past',
                '',
                'Many people assume tuberculosis disappeared long ago. It did not. TB remains one of the world\'s deadliest infectious diseases, and it still occurs in the United States — including in California, which reports among the highest numbers of TB cases of any state. Thousands of new TB cases are diagnosed in the US each year, and the disease has not gone away.',
                '',
                'For long-term care, TB carries special importance for a few reasons. First, older adults are at higher risk: many were exposed to TB decades ago, when it was far more common, and carry latent — sleeping — infection that can reactivate as their immune systems weaken with age or illness. Second, long-term care is congregate living — many people sharing indoor air in close quarters — which is exactly the setting where an airborne disease can spread. Third, residents often have weakened immune systems that let TB take hold and progress.',
                '',
                'Here\'s what makes the CNA so important. Because TB can hide as a slow, vague illness — a lingering cough, weight loss, night sweats, fatigue — it\'s sometimes mistaken for "just getting older" or another condition, and goes unrecognized. An unrecognized active case in a facility can expose many residents, visitors, and staff before anyone realizes TB is present. A CNA who knows the warning signs and reports them helps TB get identified and isolated quickly.',
                '',
                'And once TB is known, the CNA is central to stopping its spread. Airborne isolation precautions, proper use of the N95 respirator, and supporting the resident\'s long medication course are how facilities protect everyone. The good news: TB is treatable and curable with the right medications taken faithfully over many months — and CNAs help make that happen.',
                '',
                'The bottom line: TB still exists, long-term care is a high-risk setting, and a CNA\'s recognition and precautions protect not just one resident but the entire community of a facility.',
              ].join('\n'),
              `${ASSET_BASE}/s03-stats-podcast.mp3`,
            ),
            {
              id: 'tb-s03-image',
              type: 'image',
              src: '/assets/courses/tuberculosis/s03-hero.jpg',
              caption: 'TB is a serious airborne infection — vigilance protects everyone.',
            },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: 'Fundamentals',
        sortOrder: 3,
        buildContent: () =>
          doc('Fundamentals', [
            { id: 'tb-s04-heading', type: 'heading', level: 1, text: 'Fundamentals' },
            {
              id: 'tb-s04-video',
              type: 'video',
              title: 'Fundamentals',
              videoUrl: `${ASSET_BASE}/s04-fundamentals.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s04-fundamentals.mp4`,
            },
            {
              id: 'tb-s04-narration',
              type: 'text',
              body: [
                '**What TB is**',
                'Tuberculosis is an infection caused by bacteria, usually attacking the lungs, though it can affect other parts of the body too. It\'s a slow disease — it often develops gradually over weeks and months, not suddenly. This slow, quiet nature is part of what makes it easy to miss.',
                '**How TB spreads: through the air**',
                'Here is the most important fact about TB. It spreads through the air. When a person with active TB in their lungs coughs, sneezes, speaks, or sings, they release tiny droplets carrying the bacteria. These droplets can float in the air for a time, and anyone nearby can breathe them in. TB does not spread by touching surfaces, shaking hands, or sharing dishes — it spreads through shared air.',
                '**Latent versus active TB**',
                'There are two forms, and the difference is crucial. In latent TB, the bacteria are in the body but sleeping. The person feels fine, isn\'t sick, and cannot spread TB to anyone. In active TB, the bacteria are growing and making the person ill — and if it\'s in the lungs, they can spread it through the air. Only active TB is contagious.',
                '**When latent becomes active**',
                'Latent TB can wake up and become active, especially when the immune system weakens — with age, with other illnesses like diabetes or HIV, with certain medications, or with the stresses of frailty. This is exactly why long-term care residents, who are older and often have other conditions, are at real risk of a sleeping infection becoming active.',
                '**Why ordinary precautions aren\'t enough**',
                'For most infections, hand washing and a regular mask are the key precautions. TB is different. Because it\'s airborne and the bacteria are so small, it requires special airborne precautions — special room airflow, keeping doors closed, and a tightly fitted N95 respirator, not an ordinary surgical mask. Knowing this difference protects your life.',
                '**TB is treatable and curable**',
                'Here\'s the hopeful part. TB is treatable and curable. The catch is that treatment is long — usually several months of multiple medications, taken faithfully every day. If the medications are stopped early, the TB can come back, sometimes in a harder-to-treat form. This is why supporting medication adherence is so important, and it\'s an area where CNAs help enormously.',
                '**The CNA\'s two jobs**',
                'So your role has two faces. First, recognition: knowing the warning signs and reporting them so a hidden case gets caught. Second, protection: following airborne precautions exactly to keep TB from spreading, and supporting the long treatment. The rest of this course prepares you for both.',
              ].join('\n\n'),
            },
            {
              id: 'tb-s04-airborne-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'TB spreads through the air — not by touch',
              body: 'TB does not spread by touching surfaces, shaking hands, or sharing dishes. It spreads through shared air — which is why airborne precautions and an N95 respirator are required.',
            },
            {
              id: 'tb-s04-image',
              type: 'image',
              src: '/assets/courses/tuberculosis/s04-hero.jpg',
              caption: 'Understanding how TB spreads through the air.',
            },
          ]),
      },
    ],
  },
  {
    slug: 'module-2',
    title: 'Recognition, Protection, and CNA Role',
    sortOrder: 1,
    lessons: [
      {
        slug: 's05-signs',
        title: 'Signs & Symptoms',
        sortOrder: 0,
        buildContent: () =>
          doc('Signs & Symptoms', [
            { id: 'tb-s05-heading', type: 'heading', level: 1, text: 'Signs & Symptoms' },
            {
              id: 'tb-s05-narration',
              type: 'text',
              body: [
                'TB hides as a slow, vague illness — which is exactly why knowing its warning signs is so important. Let\'s learn them.',
                '**The persistent cough**',
                'The classic warning sign of TB in the lungs is a cough that lasts three weeks or longer. It may be dry at first, then bring up sputum, and sometimes — in more advanced cases — blood in the sputum. A persistent cough that won\'t go away, especially with other signs, should make you think: could this be TB? And it should be reported.',
                '**Night sweats and fever**',
                'Two signature signs of TB are night sweats and low-grade fever. The resident may wake with their sheets and bedclothes soaked in sweat, night after night. They may run a mild fever, often in the afternoon or evening, with chills. When you\'re changing damp linens repeatedly, or noticing a recurring low fever, that pattern is worth reporting.',
                '**Weight loss and fatigue**',
                'TB slowly drains the body. Watch for unexplained weight loss — clothes getting looser, the resident getting thinner without a clear reason. Loss of appetite. Deep fatigue and weakness that doesn\'t improve with rest. A general decline, a "wasting" look. These slow changes are easy to attribute to aging — but together with a cough, they point toward TB.',
                '**Put the picture together**',
                'No single sign proves TB — but the picture together is the clue. A cough lasting weeks, plus night sweats, plus weight loss, plus fatigue and low fever, is a classic TB pattern. Your job isn\'t to diagnose it — it\'s to notice the pattern and report it, so the resident can be tested. Document what you observe clearly: how long the cough has lasted, the night sweats, the weight changes, the fevers.',
                '**Summary**',
                'The warning signs of TB: a cough lasting three weeks or more, sometimes with blood; night sweats; low-grade fever and chills; unexplained weight loss; loss of appetite; and deep fatigue. Any of these — and especially several together — should make you think of TB and report it.',
                'The rule underneath it all: TB is slow and easy to dismiss as aging. When you see this pattern, don\'t dismiss it — report it, so testing can begin. Early recognition protects the resident and everyone around them.',
              ].join('\n\n'),
            },
            {
              id: 'tb-s05-pattern-callout',
              type: 'callout',
              variant: 'warning',
              title: 'TB hides as a slow, vague illness',
              body: 'A cough lasting weeks, plus night sweats, weight loss, and fatigue together suggest TB. Don\'t dismiss the pattern as aging — report it promptly.',
            },
            {
              id: 'tb-s05-image',
              type: 'image',
              src: '/assets/courses/tuberculosis/s05-hero.jpg',
              caption:
                'Recognizing the warning pattern: lasting cough, night sweats, weight loss.',
            },
          ]),
      },
      {
        slug: 's06-causes',
        title: 'Causes',
        sortOrder: 1,
        buildContent: () =>
          doc('Causes', [
            { id: 'tb-s06-heading', type: 'heading', level: 1, text: 'Causes' },
            pendingAudio(
              'tb-s06-audio',
              'What Causes TB — and Who Is at Risk?',
              `${ASSET_BASE}/s06-causes-podcast.mp3`,
              [
                'What Causes TB — and Who Is at Risk?',
                '',
                'Tuberculosis is caused by a specific bacteria that usually attacks the lungs. It spreads from person to person through the air — and only from someone who has active TB in their lungs or throat. When that person coughs, sneezes, speaks, or sings, they release tiny droplets carrying the bacteria, and people who share that indoor air over time can breathe them in.',
                '',
                'It\'s important to understand how TB does NOT spread, because this prevents both unnecessary fear and unnecessary stigma. TB does not spread by shaking hands, touching surfaces, sharing food or dishes, or brief passing contact. It generally takes breathing the same indoor air with an infectious person over a period of time. This is why congregate living — like a long-term care facility — raises the risk, and why airborne precautions focus on the air, not on surfaces.',
                '',
                'Not everyone who breathes in TB bacteria gets sick. Many people develop latent TB — the sleeping form — where the bacteria are controlled by the immune system. They feel fine and can\'t spread it. But that sleeping infection can wake up and become active disease, especially when the immune system weakens.',
                '',
                'This is where long-term care residents are particularly vulnerable. Many older adults carry latent TB from exposure decades ago, when the disease was far more common. As they age, or develop conditions like diabetes, kidney disease, cancer, or HIV, or take medications that suppress the immune system, that old sleeping infection can reactivate into active, contagious disease. Frailty, poor nutrition, and the stresses of illness all raise the risk.',
                '',
                'For the CNA, the practical message is twofold. First, understand that TB spreads through shared air, so the precautions protect by controlling air and using proper respiratory protection. Second, know that the residents most at risk are older adults with weakened immune systems — which describes much of the long-term care population — so vigilance for warning signs matters. Compassion matters too: TB is a disease, not a moral failing, and residents with TB deserve the same dignity and care as anyone else.',
              ].join('\n'),
              `${ASSET_BASE}/s06-causes-podcast.mp3`,
            ),
            {
              id: 'tb-s06-image',
              type: 'image',
              src: '/assets/courses/tuberculosis/s06-hero.jpg',
              caption: 'Understanding who is at risk and how TB takes hold.',
            },
          ]),
      },
      {
        slug: 's07-role',
        title: 'CNA Role & Best Practices',
        sortOrder: 2,
        buildContent: () =>
          doc('CNA Role & Best Practices', [
            { id: 'tb-s07-heading', type: 'heading', level: 1, text: 'CNA Role & Best Practices' },
            {
              id: 'tb-s07-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of practice',
              body: 'CNAs SUPPORT, PROTECT, OBSERVE, and REPORT. CNAs never give TB medications or interpret TB test results.',
            },
            {
              id: 'tb-s07-image',
              type: 'image',
              src: '/assets/courses/tuberculosis/s07-hero.jpg',
              caption:
                'The CNA follows airborne precautions, uses the N95 correctly, and reports suspected cases — never enters isolation without proper PPE.',
            },
            {
              id: 'tb-s07-narration',
              type: 'text',
              body: [
                'TB treatment is long, specific, and managed entirely by the medical team — but the CNA plays a real role in supporting it and in protecting everyone during it. Let\'s walk through it, starting as always with the rule that never bends. A CNA does not give or adjust TB medications, and a CNA does not interpret TB test results. Your role is to support, observe, protect, and report.',
                '**The long medication course.** Active TB is treated with several medications taken together, usually for six months or longer. This is far longer than treatment for most infections, and there\'s a reason it must be completed fully: stopping early lets the TB survive and come back — sometimes as a drug-resistant form that\'s much harder to cure. So faithful, complete treatment is everything. While you don\'t give the medications, you support adherence — encouraging the resident, helping them be ready for the nurse, and reporting any refusals or missed doses immediately, because a missed dose in TB is a real problem.',
                '**Directly Observed Therapy.** Because completing TB treatment is so critical, it\'s often given as Directly Observed Therapy — meaning a nurse or trained staff member watches the resident actually take each dose. You may support this process as directed by helping ensure the resident is present and ready. The point is to guarantee the full course is taken.',
                '**Side effects to report.** TB medications can have side effects worth watching for and reporting: nausea, loss of appetite, yellowing of the skin or eyes which can signal a liver problem, tingling or numbness in the hands or feet, vision or color changes, and rashes. You don\'t manage these — you observe and report them so the nurse and doctor can respond.',
                '**Airborne precautions during treatment.** While a resident with active TB is still contagious — usually the early part of treatment — airborne isolation precautions stay in place, and you wear your N95 respirator every time you enter. As treatment works, the resident becomes non-contagious, and the doctor and nurse determine when precautions can be lifted. You follow the precautions exactly until the team says otherwise — never your own judgment.',
                'The scope point for this whole section: you don\'t give the medications or read the tests, but you support faithful treatment, protect everyone with proper precautions, and report missed doses and side effects. That support helps cure the resident and keeps the whole facility safe.',
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
            { id: 'tb-s08-heading', type: 'heading', level: 1, text: 'Prevention & Risk Reduction' },
            {
              id: 'tb-s08-image',
              type: 'image',
              src: '/assets/courses/tuberculosis/s08-hero.jpg',
              caption: 'Prevention: airborne isolation, correct PPE, keeping the door closed.',
            },
            {
              id: 'tb-s08-narration',
              type: 'text',
              body: [
                'Preventing the spread of TB — and protecting yourself — is the heart of this course. Here are seven ways.',
                '**One. Follow airborne isolation precautions exactly.** For a resident with active TB, this means a private room with special airflow when available, keeping the door closed, and limiting who enters. These precautions control the air the bacteria travel in. Follow them precisely, every time — never prop the door open "just for a minute."',
                '**Two. Wear your N95 respirator correctly.** A regular surgical mask does not protect you from TB. You need a properly fitted N95 respirator, worn every time you enter the room of a contagious resident. It must be fit-tested so it seals to your face. Put it on before entering, wear it the whole time, and remove it properly after leaving.',
                '**Three. Keep up your own TB testing.** Healthcare workers, including CNAs, are tested for TB regularly. Keep up with your scheduled tests. This protects you, your residents, and your family by catching any infection early. Never skip your testing.',
                '**Four. Teach and support cough etiquette.** Encourage residents to cover their mouth and nose when coughing — with a tissue, then dispose of it safely. For a resident with suspected or active TB, a mask on the resident during transport helps contain the droplets. Good cough habits reduce spread.',
                '**Five. Report warning signs early.** The fastest way to stop TB spreading is to catch a hidden case quickly. Report that weeks-long cough, the night sweats, the weight loss. The sooner a case is identified and isolated, the fewer people are exposed.',
                '**Six. Support medication adherence.** Helping a resident complete their full TB treatment doesn\'t just cure them — it makes them non-contagious and prevents drug-resistant TB. Encourage adherence and report missed doses. This protects the whole community.',
                '**Seven. Maintain good general health and hygiene.** Hand hygiene, good nutrition for residents, proper ventilation, and overall infection control all support a healthier environment. A strong immune system is a resident\'s own best defense against TB becoming active.',
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
            { id: 'tb-s09-heading', type: 'heading', level: 1, text: 'Scenario & Reporting' },
            pendingAudio(
              'tb-s09-intro-audio',
              'Emergency response scenarios intro',
              `${ASSET_BASE}/s09-emergency-intro.mp3`,
              'With TB, the key judgments are recognizing the warning signs of a possible hidden case, and following precautions exactly to protect everyone. You\'re about to work through two situations. Read each carefully, choose your action, and you\'ll get feedback right away. Remember the theme of this course: recognition and protection — protecting the resident, protecting others, and protecting yourself.',
              `${ASSET_BASE}/s09-emergency-intro.mp3`,
            ),
            {
              id: 'tb-s09-image',
              type: 'image',
              src: '/assets/courses/tuberculosis/s09-hero.jpg',
              caption:
                'Reading a TB situation: spotting the hidden warning signs, and protecting yourself correctly.',
            },
            {
              id: 'tb-s09-scenario-hidden-image',
              type: 'image',
              src: '/assets/courses/tuberculosis/s09-scenario-hidden.jpg',
              caption:
                'A month-long cough dismissed as a winter cough, with night sweats, weight loss, and blood in the sputum: report the full TB pattern to the nurse promptly.',
            },
            {
              id: 'tb-s09-scenario-hidden',
              type: 'scenario_question',
              prompt:
                'Mr. Alvarez has had a cough for about a month that everyone assumed was "just a winter cough." Over the past few weeks you\'ve changed his sweat-soaked sheets many mornings, his clothes are looking loose, and today you notice a streak of blood in the tissue after he coughs. He has no isolation precautions in place. What SHOULD the CNA do?',
              options: [
                {
                  id: 'assume-cold',
                  label: 'Assume it\'s a lingering cold and keep the routine',
                  feedback:
                    'This pattern — weeks-long cough, night sweats, weight loss, and blood in the sputum — is a classic warning picture for TB. Dismissing it as a cold, giving cough medicine, or waiting could let an active, contagious case spread to others. The right action: report the full pattern to the nurse promptly so testing can begin.',
                },
                {
                  id: 'report-promptly',
                  label:
                    'Report the pattern — long cough, night sweats, weight loss, and blood — to the nurse promptly',
                  feedback:
                    'Right. A cough lasting weeks, night sweats, weight loss, and now blood in the sputum is a classic pattern that should make you think of TB. This needs to be reported to the nurse promptly so the resident can be evaluated and tested. Catching a possible hidden case early protects Mr. Alvarez and everyone around him — because if it is active TB, the sooner precautions begin, the fewer people are exposed. You don\'t diagnose it; you recognize the pattern and report it fast.',
                  isRecommended: true,
                },
                {
                  id: 'give-cough-medicine',
                  label: 'Give him cough medicine to help',
                  feedback:
                    'This pattern — weeks-long cough, night sweats, weight loss, and blood in the sputum — is a classic warning picture for TB. Dismissing it as a cold, giving cough medicine, or waiting could let an active, contagious case spread to others. The right action: report the full pattern to the nurse promptly so testing can begin.',
                },
                {
                  id: 'wait-clear',
                  label: 'Wait to see if the cough clears on its own',
                  feedback:
                    'This pattern — weeks-long cough, night sweats, weight loss, and blood in the sputum — is a classic warning picture for TB. Dismissing it as a cold, giving cough medicine, or waiting could let an active, contagious case spread to others. The right action: report the full pattern to the nurse promptly so testing can begin.',
                },
              ],
              requiredForCompletion: true,
            },
            {
              id: 'tb-s09-scenario-n95-image',
              type: 'image',
              src: '/assets/courses/tuberculosis/s09-scenario-n95.jpg',
              caption:
                'Entering an airborne-isolation room: put on a fitted N95 before going in and keep the door closed — a surgical mask is not enough for TB.',
            },
            {
              id: 'tb-s09-scenario-n95',
              type: 'scenario_question',
              prompt:
                'Mrs. Bianchi has active TB and is on airborne isolation precautions in a private room. You need to go in to help her. You\'re in a hurry, your N95 is in the supply area, and there\'s a surgical mask right by the door. The door is supposed to stay closed. What SHOULD the CNA do?',
              options: [
                {
                  id: 'surgical-propped',
                  label: 'Use the surgical mask and prop the door open to be quick',
                  feedback:
                    'TB is airborne — a surgical mask isn\'t enough, propping the door defeats the special airflow, and "just a minute" is exactly how exposures happen. The right action: get your fitted N95, put it on before entering, and keep the door closed. The rules don\'t bend for being in a hurry.',
                },
                {
                  id: 'n95-closed-door',
                  label: 'Get your fitted N95, put it on before entering, and keep the door closed',
                  feedback:
                    'Exactly right. TB is airborne, and a surgical mask does not protect you from it — you need your properly fitted N95, put on before you enter. The door must stay closed to keep the special airflow working and contain the bacteria. Being in a hurry never changes these rules — a single careless entry can expose you and, through you, others. Take the extra minute to get your N95 and follow the precautions exactly. Protecting yourself protects everyone.',
                  isRecommended: true,
                },
                {
                  id: 'skip-mask',
                  label: 'Skip the mask since you\'ll only be a minute',
                  feedback:
                    'TB is airborne — a surgical mask isn\'t enough, propping the door defeats the special airflow, and "just a minute" is exactly how exposures happen. The right action: get your fitted N95, put it on before entering, and keep the door closed. The rules don\'t bend for being in a hurry.',
                },
                {
                  id: 'hold-breath',
                  label: 'Enter without protection and hold your breath',
                  feedback:
                    'TB is airborne — a surgical mask isn\'t enough, propping the door defeats the special airflow, and "just a minute" is exactly how exposures happen. The right action: get your fitted N95, put it on before entering, and keep the door closed. The rules don\'t bend for being in a hurry.',
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
            { id: 'tb-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
              id: 'tb-s10-video',
              type: 'video',
              title: "CNA's Role in Care",
              videoUrl: `${ASSET_BASE}/s10-cna-role.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s10-cna-role.mp4`,
            },
            {
              id: 'tb-s10-narration',
              type: 'text',
              body: [
                'Your role in TB care brings together recognition, protection, compassion, and support. Let\'s walk through it.',
                '**Protect with precautions** When a resident has active TB, protection is your first duty — to yourself, other residents, visitors, and staff. Wear your fitted N95 respirator every single time you enter, put on before you go in. Keep the door closed. Follow every airborne precaution exactly, never cutting a corner because you\'re in a hurry. Remove your respirator properly after leaving. These precautions are what stand between one case and an outbreak.',
                '**Care with compassion** Isolation is hard on residents. Being alone in a closed room, seeing caregivers in masks, knowing others are kept away — it can feel frightening and lonely. A resident with TB deserves the same warmth and dignity as anyone. Spend time with them within the precautions, make eye contact, speak kindly, explain what you\'re doing. TB is a disease, never a reason for a resident to feel shunned or ashamed.',
                '**Support the long treatment** Support faithful completion of the long medication course. Encourage the resident through months of treatment, help them be ready for Directly Observed Therapy, and report any missed doses or side effects immediately. Your encouragement helps a resident finish a hard, lengthy treatment — which cures them and protects everyone.',
                '**Recognize and report** And recognize hidden cases. Know the warning signs — the weeks-long cough, night sweats, weight loss, fatigue, low fever, blood in sputum — and report the pattern promptly when you see it. Document clearly. Early recognition gets a hidden case isolated fast, protecting the whole community.',
                'Now the boundary. You do not diagnose TB. You do not give or adjust TB medications. You do not interpret TB skin or blood tests. And you never decide on your own to lift or relax isolation precautions — that\'s determined by the doctor and nurse; you follow the precautions exactly until told otherwise.',
                'Inside your role — protect with precautions, care with compassion, support the treatment, recognize and report — you keep an entire facility safe while caring for a vulnerable resident with dignity. It\'s some of the most important infection-control work a CNA does.',
              ].join('\n\n'),
            },
            {
              id: 'tb-s10-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Stay within scope',
              body: 'You do not diagnose TB. You do not give or adjust TB medications. You do not interpret TB skin or blood tests. And you never decide on your own to lift or relax isolation precautions.',
            },
            {
              id: 'tb-s10-image',
              type: 'image',
              src: '/assets/courses/tuberculosis/s10-hero.jpg',
              caption:
                'Supporting a resident on TB treatment with dignity and consistent precautions.',
            },
          ]),
      },
      {
        slug: 's11-case-study',
        title: 'Case Study',
        sortOrder: 2,
        buildContent: () => {
          const caseNarrative = [
            'Mr. Petrosyan, 80, had immigrated decades ago and had lived at the facility for three years. His CNA, Lourdes, knew him well. That winter, he developed a cough everyone assumed was seasonal.',
            '',
            '**The overlooked pattern:** Weeks passed and the cough didn\'t clear. Lourdes found herself changing his sweat-soaked bedding many mornings — night sweats, though no one had connected it. His appetite had faded and his clothes hung loose; he\'d quietly lost weight. He was more tired than usual. Each sign on its own seemed minor and easy to blame on winter or age. But Lourdes started to feel uneasy about the whole picture.',
            '',
            '**The recognition:** One morning, Mr. Petrosyan coughed into a tissue and Lourdes saw a streak of blood. That was the moment the pattern came together in her mind — a cough lasting over a month, night sweats, weight loss, fatigue, and now blood. She remembered her TB training. She didn\'t diagnose anything, and she didn\'t panic. She reported the full pattern to the nurse clearly: "Cough over a month now, with blood today, plus weeks of night sweats and weight loss and fatigue. I\'m concerned this could be TB."',
            '',
            '**The response:** The nurse took it seriously immediately. Mr. Petrosyan was placed on airborne precautions as a precaution, evaluated, and tested. The sputum tests confirmed active pulmonary TB. Because it was caught when Lourdes connected the pattern, he was isolated quickly, and the facility began testing and protecting the residents and staff who\'d been near him.',
            '',
            '**The care that followed:** Mr. Petrosyan began his months-long course of TB medications. Lourdes wore her fitted N95 every time she entered, kept the door closed, and followed every precaution exactly. But she also made sure he wasn\'t left lonely in isolation — she spent unhurried time with him, made eye contact through her mask, and encouraged him through a frightening, isolating diagnosis. She reported faithfully when he took his medications and watched for side effects.',
            '',
            '**The outcome:** Mr. Petrosyan completed his full treatment and was cured. No other resident developed active TB, because the case was caught and contained. The nurse told Lourdes: "Everyone called that a winter cough. You saw the pattern. You protected this whole building — and you didn\'t let him feel alone doing it."',
            '',
            '**Discussion:** Lourdes\'s value came in two parts. First, recognition: she connected a month-long cough, night sweats, weight loss, and blood into a TB pattern and reported it, instead of accepting "winter cough." Second, protection with compassion: she followed airborne precautions perfectly to protect everyone, while still treating Mr. Petrosyan with warmth and dignity through a lonely illness. She never diagnosed, never gave a medication, never read a test — and she made all the difference.',
          ].join('\n');

          return doc('Case Study', [
            { id: 'tb-s11-heading', type: 'heading', level: 1, text: 'Case Study' },
            pendingAudio(
              'tb-s11-audio',
              'The "Winter Cough" That Wasn\'t',
              `${ASSET_BASE}/s11-case-podcast.mp3`,
              caseNarrative,
              `${ASSET_BASE}/s11-case-podcast.mp3`,
            ),
            {
              id: 'tb-s11-image',
              type: 'image',
              src: '/assets/courses/tuberculosis/s11-hero.jpg',
              caption: 'A suspected TB case recognized and reported correctly.',
            },
            {
              id: 'tb-s11-case-study',
              type: 'case_study',
              title: 'The "Winter Cough" That Wasn\'t',
              residentProfile:
                'Mr. Petrosyan, 80, had immigrated decades ago and had lived at the facility for three years. His CNA, Lourdes, knew him well. That winter, he developed a cough everyone assumed was seasonal.',
              scenario: [
                '**The overlooked pattern:** Weeks passed and the cough didn\'t clear. Lourdes found herself changing his sweat-soaked bedding many mornings — night sweats, though no one had connected it. His appetite had faded and his clothes hung loose; he\'d quietly lost weight. He was more tired than usual. Each sign on its own seemed minor and easy to blame on winter or age. But Lourdes started to feel uneasy about the whole picture.',
                '**The recognition:** One morning, Mr. Petrosyan coughed into a tissue and Lourdes saw a streak of blood. That was the moment the pattern came together in her mind — a cough lasting over a month, night sweats, weight loss, fatigue, and now blood. She remembered her TB training. She didn\'t diagnose anything, and she didn\'t panic. She reported the full pattern to the nurse clearly: "Cough over a month now, with blood today, plus weeks of night sweats and weight loss and fatigue. I\'m concerned this could be TB."',
                '**The response:** The nurse took it seriously immediately. Mr. Petrosyan was placed on airborne precautions as a precaution, evaluated, and tested. The sputum tests confirmed active pulmonary TB. Because it was caught when Lourdes connected the pattern, he was isolated quickly, and the facility began testing and protecting the residents and staff who\'d been near him.',
                '**The care that followed:** Mr. Petrosyan began his months-long course of TB medications. Lourdes wore her fitted N95 every time she entered, kept the door closed, and followed every precaution exactly. But she also made sure he wasn\'t left lonely in isolation — she spent unhurried time with him, made eye contact through her mask, and encouraged him through a frightening, isolating diagnosis. She reported faithfully when he took his medications and watched for side effects.',
                '**The outcome:** Mr. Petrosyan completed his full treatment and was cured. No other resident developed active TB, because the case was caught and contained. The nurse told Lourdes: "Everyone called that a winter cough. You saw the pattern. You protected this whole building — and you didn\'t let him feel alone doing it."',
                '**Discussion:** Lourdes\'s value came in two parts. First, recognition: she connected a month-long cough, night sweats, weight loss, and blood into a TB pattern and reported it, instead of accepting "winter cough." Second, protection with compassion: she followed airborne precautions perfectly to protect everyone, while still treating Mr. Petrosyan with warmth and dignity through a lonely illness. She never diagnosed, never gave a medication, never read a test — and she made all the difference.',
              ].join('\n\n'),
            },
            {
              id: 'tb-s11-reflection-1',
              type: 'reflection',
              prompt:
                'Each of Mr. Petrosyan\'s symptoms seemed minor and easy to blame on winter or age. Why is connecting the whole pattern — and reporting it — so important in recognizing TB?',
              minCharacters: 50,
            },
            {
              id: 'tb-s11-reflection-2',
              type: 'reflection',
              prompt:
                'Lourdes followed strict airborne precautions but also made sure Mr. Petrosyan didn\'t feel shunned. Why do both protection AND compassion matter in caring for a resident with TB?',
              minCharacters: 50,
            },
            {
              id: 'tb-s11-reflection-intro-text',
              type: 'text',
              body: 'Reflect on the case study in the previous lesson. Your written responses help you apply what you learned about recognizing TB warning signs, following airborne precautions, and caring with compassion.',
            },
            {
              id: 'tb-s11-kc2-check',
              type: 'knowledge_check',
              question:
                'A CNA does not give or adjust TB medications, and a CNA does not interpret TB test results. When a resident refuses or misses a dose of their TB medication, the CNA SHOULD:',
              options: [
                {
                  id: 'give-dose',
                  label: 'Give the missed dose of TB medication',
                },
                {
                  id: 'report-nurse',
                  label: 'Report the refusal or missed dose to the nurse immediately',
                },
                {
                  id: 'interpret-test',
                  label: 'Interpret the resident\'s TB test results to decide if the dose matters',
                },
                {
                  id: 'wait-recheck',
                  label: 'Wait and see if the resident takes it at the next scheduled time',
                },
              ],
              correctOptionId: 'report-nurse',
              explanation:
                'While you don\'t give the medications, you support adherence — encouraging the resident, helping them be ready for the nurse, and reporting any refusals or missed doses immediately, because a missed dose in TB is a real problem.',
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
            { id: 'tb-s12-heading', type: 'heading', level: 1, text: 'Conclusion' },
            {
              id: 'tb-s12-video',
              type: 'video',
              title: 'Conclusion',
              videoUrl: `${ASSET_BASE}/s12-conclusion.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s12-conclusion.mp4`,
            },
            {
              id: 'tb-s12-image',
              type: 'image',
              src: '/assets/courses/tuberculosis/s12-hero.jpg',
              caption: 'Recognize, isolate, protect, report — the CNA\'s role in TB care.',
            },
            {
              id: 'tb-s12-narration',
              type: 'text',
              body: [
                'You\'ve reached the end — and you\'ve completed the respiratory series. Let\'s lock in the five things that matter most for TB.',
                '**One.** TB is a serious infectious disease that spreads through the air — not by touch. It still exists today, and long-term care, with older residents in shared indoor air, is a real-risk setting. TB is treatable and curable with faithful, months-long treatment.',
                '**Two.** Know the warning signs and the pattern. A cough lasting three weeks or more, sometimes with blood; night sweats; low-grade fever; unexplained weight loss; loss of appetite; deep fatigue. Several together suggest TB. Don\'t dismiss them as aging — report the pattern promptly.',
                '**Three.** Follow airborne precautions exactly. A private room with special airflow, the door kept closed, limited entry — and your properly fitted N95 respirator worn every time you enter. A surgical mask is not enough for TB. The rules never bend for being in a hurry.',
                '**Four.** Support the long treatment, and report missed doses. TB medication runs for months and must be completed fully — stopping early can make TB drug-resistant. Encourage adherence, support Directly Observed Therapy, and report missed doses and side effects immediately.',
                '**Five.** Honor your scope — and pair protection with compassion. You never diagnose TB, give TB medications, interpret tests, or lift precautions on your own. And while you protect everyone with strict precautions, you still care for the resident with warmth and dignity, so they never feel shunned in isolation.',
              ].join('\n\n'),
            },
            {
              id: 'tb-s12-summary',
              type: 'summary',
              title: 'Five things that matter most',
              items: [
                'TB spreads through the air — it still exists today, and long-term care is a real-risk setting.',
                'Know the warning signs and the pattern — report promptly; don\'t dismiss them as aging.',
                'Follow airborne precautions exactly — N95 respirator every time; a surgical mask is not enough.',
                'Support the long treatment — report missed doses and side effects immediately.',
                'Honor your scope — pair protection with compassion; never diagnose, give meds, or interpret tests.',
              ],
            },
            {
              id: 'tb-s12-what-happens-next-text',
              type: 'text',
              body: 'Ten questions are waiting. Everything on them was covered here. You\'re ready. Trust what you\'ve learned, and show what you know.',
            },
            {
              id: 'tb-s12-completion-requirements-text',
              type: 'text',
              body: 'This course provides one hour of continuing education credit through CAL ACE Nursing Academy, an approved CDPH continuing education provider, NAC number 7384. Your certificate is generated automatically when you pass the knowledge check.',
            },
            {
              id: 'tb-s12-completion-requirements-callout',
              type: 'callout',
              variant: 'info',
              title: 'Scope reminder',
              body: 'CNAs recognize, protect, support, and report. CNAs do not diagnose TB, give or adjust TB medications, or interpret TB test results.',
            },
            {
              id: 'tb-s12-certificate-access-text',
              type: 'text',
              body: 'Your certificate is generated automatically when you pass the knowledge check. CDPH-Approved CE Provider — NAC #7384.',
            },
          ]),
      },
    ],
  },
];


export async function seedCourse20Tuberculosis(
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
  console.log(`Seeding Course 20 (Tuberculosis) as DRAFT — slug "${COURSE_SLUG}"…`);

  try {
    const result = await seedCourse20Tuberculosis(prisma);
    const blockCounts = blockCountsByLesson();
    const totalBlocks = Object.values(blockCounts).reduce((sum, count) => sum + count, 0);

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
