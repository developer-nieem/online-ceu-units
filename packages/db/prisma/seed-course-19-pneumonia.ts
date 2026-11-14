/**
 * Seed Course 19 — Pneumonia: Recognition and Care Support for CNAs (DRAFT).
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-19-pneumonia
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
const COURSE_SLUG = 'pneumonia';
const COURSE_TITLE = 'Pneumonia Warning Signs and Supportive Care';
const COURSE_SUMMARY =
  'Learn to recognize pneumonia early — including subtle signs in older adults — prevent aspiration pneumonia through safe feeding and mouth care, support the care plan, and respond to respiratory distress. CNAs do not diagnose pneumonia, give or adjust antibiotics, or change oxygen flow rates.';

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
    'Explain what pneumonia is, in plain language',
    'Recognize its signs — including the subtle signs in older adults',
    'Prevent pneumonia, especially aspiration pneumonia',
    'Respond correctly to breathing trouble',
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
  heroImage: '/assets/courses/pneumonia/hero-banner.jpg',
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
    title: 'Understanding Pneumonia',
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: 'Introduction',
        sortOrder: 0,
        buildContent: () =>
          doc('Introduction', [
            { id: 'pneum-s01-heading', type: 'heading', level: 1, text: 'Welcome' },
            {
              id: 'pneum-s01-video',
              type: 'video',
              title: 'Introduction',
              videoUrl: `${ASSET_BASE}/s01-intro.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s01-intro.mp4`,
            },
            {
              id: 'pneum-s01-image',
              type: 'image',
              src: '/assets/courses/pneumonia/s01-hero.jpg',
              caption: 'A CAL ACE CNA supporting an older resident recovering from pneumonia.',
            },
            {
              id: 'pneum-s01-narration',
              type: 'text',
              body: [
                'Welcome to CAL ACE Nursing Academy.',
                'This course is about pneumonia — a lung infection that is one of the most serious and most common dangers in long-term care.',
                'Pneumonia is an infection that inflames the air sacs in the lungs. They fill with fluid or pus, and breathing becomes hard and painful. For a young, healthy person, pneumonia is usually treatable. But for an older adult in long-term care, pneumonia is a leading cause of hospitalization and death. It is not a condition to take lightly — ever.',
                'Here\'s what makes this course so important for CNAs, and it comes down to two things: early recognition, and prevention.',
                'Early recognition matters because pneumonia in older adults often hides. A younger person gets the classic high fever and deep cough. But an elderly resident may show pneumonia very differently — sometimes the first sign is just new confusion, weakness, a loss of appetite, or a fall. The CNA who knows these subtle signs, and reports them, can catch pneumonia early enough to save a life.',
                'Prevention matters because one of the most dangerous and common types in long-term care — aspiration pneumonia — is largely preventable through good CNA care. Aspiration pneumonia happens when food, liquid, or saliva goes into the lungs instead of the stomach. Safe feeding, good positioning, and mouth care — all CNA work — prevent it.',
                'Your scope is clear. A CNA recognizes the signs of pneumonia, prevents it through safe feeding and good care, supports the care plan, and responds to breathing trouble. A CNA does not diagnose pneumonia, does not give or adjust antibiotics or any medication, and does not change oxygen settings.',
                'By the end of this course, you will be able to: explain what pneumonia is, in plain language. Recognize its signs — including the subtle signs in older adults. Prevent pneumonia, especially aspiration pneumonia. Respond correctly to breathing trouble. And know your scope.',
                'There is a ten-question knowledge check at the end. Everything on it is covered here. Let\'s begin.',
              ].join('\n\n'),
            },
            {
              id: 'pneum-s01-course-information-text',
              type: 'text',
              body: [
                'This course teaches the CNA\'s role in recognizing pneumonia early — including the subtle signs in older adults — preventing it (especially aspiration pneumonia), supporting the care plan, and responding to respiratory distress.',
                'Let\'s be clear about your role. A CNA recognizes the signs of pneumonia, prevents it through safe feeding and good care, supports the care plan, and responds to breathing trouble. A CNA does not diagnose pneumonia, does not give or adjust antibiotics or any medication, and does not change oxygen settings. Those are nursing and physician tasks. But none of them can happen without your careful observation and faithful reporting first.',
              ].join('\n\n'),
            },
            {
              id: 'pneum-s01-course-information-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of this course',
              body: 'CNAs RECOGNIZE, PREVENT, SUPPORT, and REPORT. CNAs do not diagnose pneumonia, give or adjust antibiotics or any medication, or change oxygen flow rates.',
            },
            {
              id: 'pneum-s01-learning-objectives-text',
              type: 'text',
              body: 'By the end of this course, you will be able to:',
            },
            {
              id: 'pneum-s01-learning-objectives-summary',
              type: 'summary',
              title: 'Learning objectives',
              items: [
                'Explain what pneumonia is, in plain language.',
                'Recognize its signs — including the subtle signs in older adults.',
                'Prevent pneumonia, especially aspiration pneumonia.',
                'Respond correctly to breathing trouble.',
                'Know your scope — what a CNA does, and what a CNA must never do.',
              ],
            },
            {
              id: 'pneum-s01-instructor-intro-text',
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
            { id: 'pneum-s02-heading', type: 'heading', level: 1, text: 'Key terms' },
            {
              id: 'pneum-s02-image',
              type: 'image',
              src: '/assets/courses/pneumonia/s02-hero.jpg',
              caption: 'The language of pneumonia — alveoli, aspiration, hypoxia, sepsis.',
            },
            {
              id: 'pneum-s02-reveal-pneumonia',
              type: 'reveal_card',
              frontTitle: 'Pneumonia',
              frontBody: 'Noo-MOH-nyah',
              backTitle: 'Pneumonia',
              backBody:
                'An infection that inflames the air sacs in one or both lungs. The air sacs fill with fluid or pus, making it hard to breathe and to get oxygen into the blood. It can be caused by bacteria, viruses, or other germs.',
            },
            {
              id: 'pneum-s02-reveal-alveoli',
              type: 'reveal_card',
              frontTitle: 'Air Sacs (Alveoli)',
              frontBody: 'Al-VEE-oh-lie',
              backTitle: 'Air Sacs (Alveoli)',
              backBody:
                'The tiny balloon-like sacs deep in the lungs where oxygen passes into the blood. In pneumonia, these sacs fill with fluid instead of air, so less oxygen reaches the body.',
            },
            {
              id: 'pneum-s02-reveal-aspiration',
              type: 'reveal_card',
              frontTitle: 'Aspiration',
              frontBody: 'As-pir-AY-shun',
              backTitle: 'Aspiration',
              backBody:
                'When food, liquid, saliva, or stomach contents go down the wrong way — into the lungs instead of the stomach. Aspiration can introduce germs into the lungs and cause aspiration pneumonia.',
            },
            {
              id: 'pneum-s02-reveal-aspiration-pneumonia',
              type: 'reveal_card',
              frontTitle: 'Aspiration Pneumonia',
              frontBody: 'Aspiration pneumonia',
              backTitle: 'Aspiration Pneumonia',
              backBody:
                'A lung infection caused by aspirating food, liquid, or saliva into the lungs. It is one of the most common and dangerous types in long-term care — and one of the most preventable through good CNA care.',
            },
            {
              id: 'pneum-s02-reveal-dysphagia',
              type: 'reveal_card',
              frontTitle: 'Dysphagia',
              frontBody: 'Diss-FAY-jah',
              backTitle: 'Dysphagia',
              backBody:
                'Difficulty swallowing. Residents with dysphagia — common after a stroke or with dementia — are at high risk of aspiration, and therefore of aspiration pneumonia. Safe feeding practices protect them.',
            },
            {
              id: 'pneum-s02-reveal-productive-cough',
              type: 'reveal_card',
              frontTitle: 'Productive Cough',
              frontBody: 'Productive cough',
              backTitle: 'Productive Cough',
              backBody:
                'A cough that brings up mucus or phlegm. In pneumonia, the mucus may be yellow, green, brown, or rust-colored. The CNA observes and reports the cough and what it produces — though, importantly, some older adults with pneumonia have little or no cough at all.',
            },
            {
              id: 'pneum-s02-reveal-hypoxia',
              type: 'reveal_card',
              frontTitle: 'Hypoxia',
              frontBody: 'Hi-POX-ee-ah',
              backTitle: 'Hypoxia',
              backBody:
                'When the body isn\'t getting enough oxygen. In pneumonia, fluid-filled air sacs can\'t deliver enough oxygen, leading to signs like confusion, restlessness, fast breathing, and bluish lips. Hypoxia is always reported.',
            },
            {
              id: 'pneum-s02-reveal-sepsis',
              type: 'reveal_card',
              frontTitle: 'Sepsis',
              frontBody: 'SEP-sis',
              backTitle: 'Sepsis',
              backBody:
                'A dangerous, body-wide reaction to a serious infection like pneumonia. It can cause confusion, very low blood pressure, rapid breathing and heart rate, and can be life-threatening. Pneumonia that leads to sepsis is a true emergency — which is why early recognition matters so much.',
            },
            {
              id: 'pneum-s02-kc1-check-aspiration',
              type: 'knowledge_check',
              question: 'Match the term: food or liquid going into the lungs the wrong way',
              options: [
                { id: 'aspiration', label: 'Aspiration' },
                { id: 'aspiration-pneumonia', label: 'Aspiration pneumonia' },
                { id: 'sepsis', label: 'Sepsis' },
              ],
              correctOptionId: 'aspiration',
              explanation:
                'Aspiration. When food, liquid, saliva, or stomach contents go down the wrong way — into the lungs instead of the stomach.',
              requiredForCompletion: true,
            },
            {
              id: 'pneum-s02-kc1-check-aspiration-pneumonia',
              type: 'knowledge_check',
              question:
                'Match the term: lung infection from aspirated food, liquid, or saliva',
              options: [
                { id: 'aspiration', label: 'Aspiration' },
                { id: 'aspiration-pneumonia', label: 'Aspiration pneumonia' },
                { id: 'sepsis', label: 'Sepsis' },
              ],
              correctOptionId: 'aspiration-pneumonia',
              explanation:
                'Aspiration pneumonia. A lung infection caused by aspirating food, liquid, or saliva into the lungs.',
              requiredForCompletion: true,
            },
            {
              id: 'pneum-s02-kc1-check-sepsis',
              type: 'knowledge_check',
              question: 'Match the term: dangerous body-wide reaction to a serious infection',
              options: [
                { id: 'aspiration', label: 'Aspiration' },
                { id: 'aspiration-pneumonia', label: 'Aspiration pneumonia' },
                { id: 'sepsis', label: 'Sepsis' },
              ],
              correctOptionId: 'sepsis',
              explanation:
                'Sepsis. A dangerous, body-wide reaction to a serious infection like pneumonia. It can cause confusion, very low blood pressure, rapid breathing and heart rate, and can be life-threatening.',
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
            { id: 'pneum-s03-heading', type: 'heading', level: 1, text: 'Statistics' },
            pendingAudio(
              'pneum-s03-audio',
              'Pneumonia: A Leading Killer of Older Adults',
              `${ASSET_BASE}/s03-stats-podcast.mp3`,
              [
                'Pneumonia: A Leading Killer of Older Adults',
                '',
                'Pneumonia is one of the leading causes of hospitalization and death among older adults in the United States. Each year, it puts hundreds of thousands of older Americans in the hospital, and for those over 65 it is far more likely to be severe or fatal than for younger people. In long-term care facilities, pneumonia is one of the most common serious infections residents face.',
                '',
                'Why is pneumonia so dangerous for older adults? Their immune systems are often weaker, so infections take hold more easily and spread faster. Many have other conditions — heart disease, COPD, diabetes, dementia — that reduce their reserves. And critically, their bodies often don\'t mount the obvious warning signs younger people show. An older adult with pneumonia may not have a high fever or a dramatic cough. Instead, the first sign might be new confusion, sudden weakness, a fall, or simply not eating. This is why pneumonia in the elderly is so often caught late — and why a CNA who knows the subtle signs is so valuable.',
                '',
                'A large share of pneumonia in long-term care is aspiration pneumonia — caused by food, liquid, or saliva entering the lungs. Residents with swallowing problems, dementia, or who are fed in poor positions are at high risk. And here is the encouraging part: aspiration pneumonia is largely preventable. Studies show that good mouth care, safe feeding practices, and proper positioning dramatically reduce it. All of these are CNA responsibilities.',
                '',
                'Pneumonia is also often preventable through vaccination — flu and pneumonia vaccines significantly lower the risk — and through good infection control and hand hygiene.',
                '',
                'The bottom line for CNAs: pneumonia is common, deadly, and often hides its early signs in older adults. But much of it is preventable, and early recognition saves lives. Both prevention and recognition rest heavily on the daily work of CNAs.',
              ].join('\n'),
              `${ASSET_BASE}/s03-stats-podcast.mp3`,
            ),
            {
              id: 'pneum-s03-image',
              type: 'image',
              src: '/assets/courses/pneumonia/s03-hero.jpg',
              caption: 'Pneumonia is common and serious in older adults — careful observation matters.',
            },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: 'Fundamentals',
        sortOrder: 3,
        buildContent: () =>
          doc('Fundamentals', [
            { id: 'pneum-s04-heading', type: 'heading', level: 1, text: 'Fundamentals' },
            {
              id: 'pneum-s04-video',
              type: 'video',
              title: 'Fundamentals',
              videoUrl: `${ASSET_BASE}/s04-fundamentals.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s04-fundamentals.mp4`,
            },
            {
              id: 'pneum-s04-narration',
              type: 'text',
              body: [
                '**How healthy lungs handle air**',
                'Deep in the lungs are millions of tiny air sacs where oxygen passes into the blood. In healthy lungs, these sacs are clear and filled with air, doing their job with every breath. Pneumonia changes that.',
                '**What pneumonia does**',
                'In pneumonia, an infection inflames the air sacs and fills them with fluid or pus. Imagine sponges that should be full of air becoming waterlogged. Less oxygen can pass into the blood, and breathing becomes hard and sometimes painful. The body also runs a fever and feels sick as it fights the infection.',
                '**Different germs cause it**',
                'Pneumonia can be caused by bacteria, viruses, or other germs. Bacterial pneumonia is often treated with antibiotics. Viral pneumonia, like from the flu, is treated differently. A resident can also develop pneumonia as a complication of another illness, like the flu or COVID. The cause is the doctor\'s diagnosis — the CNA\'s job is to recognize the signs early.',
                '**Why older adults are so vulnerable**',
                'Older adults are more vulnerable for several reasons. Weaker immune systems let infections take hold. Other conditions reduce their reserves. Weaker cough and breathing muscles make it harder to clear the lungs. And swallowing problems raise the risk of aspiration. All of this means pneumonia hits older residents harder and recovers slower.',
                '**Aspiration: the preventable danger**',
                'One of the most important types in long-term care is aspiration pneumonia. It happens when food, liquid, or saliva goes into the lungs instead of the stomach — carrying germs in with it. Residents with swallowing problems, dementia, or weakness are at high risk. The crucial point: this type is largely preventable through how we feed, position, and provide mouth care.',
                '**Why the signs can be subtle**',
                'Here\'s the key fact that can save a life. In older adults, pneumonia often doesn\'t look like a chest infection. Instead of a high fever and a big cough, the first sign may be new confusion, sudden weakness or tiredness, a loss of appetite, or a fall. A resident who is "just not themselves" today may be developing pneumonia. Never dismiss these subtle changes.',
                '**Caught early, pneumonia is treatable**',
                'The encouraging truth: caught early, pneumonia is often very treatable. The difference between a good outcome and a tragedy is frequently how soon it\'s recognized and treated. That\'s why the CNA who notices the subtle change and reports it is so important — early recognition is, quite literally, lifesaving.',
              ].join('\n\n'),
            },
            {
              id: 'pneum-s04-subtle-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'In older adults, the first sign may be confusion — not cough',
              body: 'Never dismiss a resident who is "just not themselves today." New confusion, weakness, or loss of appetite can be the first sign of pneumonia.',
            },
            {
              id: 'pneum-s04-image',
              type: 'image',
              src: '/assets/courses/pneumonia/s04-hero.jpg',
              caption: 'Understanding how infection fills the lungs and makes breathing hard.',
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
            { id: 'pneum-s05-heading', type: 'heading', level: 1, text: 'Signs & Symptoms' },
            {
              id: 'pneum-s05-narration',
              type: 'text',
              body: [
                '**The classic signs**',
                'In some residents, pneumonia looks like a chest infection. A cough, often bringing up yellow, green, brown, or rust-colored mucus. Fever and chills. Shortness of breath. Chest pain, especially when breathing or coughing. Fast breathing. Fatigue. When you see these, report them — but know that not every resident with pneumonia will show them.',
                '**The subtle signs in older adults**',
                'This is the most important part. In older adults, pneumonia often hides. The first sign may not be cough or fever at all. It may be new confusion or increased confusion in someone with dementia. Sudden weakness or extreme tiredness. A loss of appetite — refusing meals. A general "not themselves" feeling. Even a fall. Some older adults with pneumonia run no fever, or a low one. A resident who is suddenly more confused, weaker, or not eating may be developing pneumonia — and that change must be reported.',
                '**Signs it\'s becoming serious**',
                'Watch for signs that pneumonia is becoming dangerous. Fast, labored breathing. Shortness of breath at rest. Bluish lips or fingertips — hypoxia. Worsening confusion or unusual drowsiness. A very high or, in the elderly, sometimes a very low temperature. Signs of sepsis — the body-wide reaction — like confusion with very low blood pressure and a racing heart. These point toward an emergency.',
                '**Watch the breathing and the oxygen**',
                'Pay close attention to breathing rate and effort, and to oxygen readings if you use a pulse oximeter. Breathing that\'s fast, shallow, or labored is a warning. An oxygen reading lower than the resident\'s normal is reported. And as always, treat the resident, not just the number — a resident who looks like they\'re struggling needs help regardless of any device.',
                '**Summary**',
                'Three pictures. Classic pneumonia: cough with colored mucus, fever, chest pain, shortness of breath — report it. Hidden pneumonia in older adults: new confusion, weakness, no appetite, a fall, maybe no fever — report the change. Emergency: labored breathing, blue lips, worsening confusion, signs of sepsis — activate help.',
                'The rule underneath: in older adults, a sudden change in mental state or behavior can be the first sign of pneumonia. Never dismiss "they\'re just not themselves today."',
              ].join('\n\n'),
            },
            {
              id: 'pneum-s05-hidden-callout',
              type: 'callout',
              variant: 'warning',
              title: 'Pneumonia hides in older adults',
              body: 'The first sign may be new confusion, weakness, or loss of appetite — not cough or fever. Never dismiss a sudden change in how a resident acts.',
            },
            {
              id: 'pneum-s05-image',
              type: 'image',
              src: '/assets/courses/pneumonia/s05-hero.jpg',
              caption: 'Recognizing the breathing and behavior changes that signal pneumonia.',
            },
          ]),
      },
      {
        slug: 's06-causes',
        title: 'Causes',
        sortOrder: 1,
        buildContent: () =>
          doc('Causes', [
            { id: 'pneum-s06-heading', type: 'heading', level: 1, text: 'Causes' },
            pendingAudio(
              'pneum-s06-audio',
              'What Causes Pneumonia — and Who Is Most at Risk?',
              `${ASSET_BASE}/s06-causes-podcast.mp3`,
              [
                'What Causes Pneumonia — and Who Is Most at Risk?',
                '',
                'Pneumonia is caused by germs that infect the lungs — most often bacteria or viruses. The germs reach the lungs in different ways, and understanding these helps a CNA prevent pneumonia.',
                '',
                'Sometimes germs are simply breathed in, from the air or from another sick person. This is why infection control and hand hygiene matter, and why a resident with a cold or the flu can develop pneumonia as a complication.',
                '',
                'But in long-term care, one of the biggest causes is aspiration — when food, liquid, saliva, or stomach contents go into the lungs instead of the stomach, bringing germs with them. Aspiration pneumonia is especially common in residents who have trouble swallowing, which happens after strokes, with dementia, and with general weakness. It\'s also more likely when residents are fed too quickly, fed in a poor position like lying back, or have poor mouth care that lets germs build up in the mouth.',
                '',
                'Several factors raise a resident\'s risk. Age itself weakens the immune system. Chronic conditions like COPD, heart failure, and diabetes reduce reserves. Swallowing difficulties raise aspiration risk. Poor mobility — being bedbound — lets fluid settle in the lungs. A weakened cough makes it harder to clear the lungs. And poor oral hygiene fills the mouth with bacteria that can be aspirated.',
                '',
                'Here\'s why this matters so much to the CNA: nearly every one of these risk factors connects to daily CNA care. Safe feeding and positioning prevent aspiration. Good mouth care reduces the germs available to aspirate. Helping residents move and reposition keeps the lungs clearer. Hand hygiene and infection control reduce the spread of germs. Supporting vaccines lowers risk.',
                '',
                'So the practical message is powerful: the CNA isn\'t just caring for residents with pneumonia — the CNA is one of the strongest forces preventing it in the first place.',
              ].join('\n'),
              `${ASSET_BASE}/s06-causes-podcast.mp3`,
            ),
            {
              id: 'pneum-s06-image',
              type: 'image',
              src: '/assets/courses/pneumonia/s06-hero.jpg',
              caption: 'Understanding what leads to pneumonia, including aspiration risk.',
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
              id: 'pneum-s07-heading',
              type: 'heading',
              level: 1,
              text: 'CNA Role & Best Practices',
            },
            {
              id: 'pneum-s07-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of practice',
              body: 'CNAs SUPPORT, OBSERVE, and REPORT. CNAs never give antibiotics or change the oxygen flow rate.',
            },
            {
              id: 'pneum-s07-image',
              type: 'image',
              src: '/assets/courses/pneumonia/s07-hero.jpg',
              caption:
                'The CNA observes, positions upright, encourages fluids, and reports early — never adjusts antibiotics or oxygen.',
            },
            {
              id: 'pneum-s07-narration',
              type: 'text',
              body: [
                'Treating pneumonia is the doctor\'s and nurse\'s job — but how the CNA supports that treatment makes a real difference in recovery. Let\'s walk through it, and let\'s start, as always, with the rule that never bends. A CNA does not give or adjust antibiotics or any medication, and a CNA never changes an oxygen flow rate. Your role is to support, observe, and report.',
                '**Antibiotics.** Bacterial pneumonia is treated with antibiotics, prescribed by the doctor and given under the nurse\'s responsibility. Your role: you don\'t give them, but you support the treatment by observing whether the resident is improving or worsening and reporting it, and by making sure they\'re eating and drinking as the plan allows. Report any new rash, diarrhea, or reaction. And it\'s worth knowing — antibiotics must be finished as prescribed even when the resident feels better, so the infection doesn\'t come back stronger.',
                '**Oxygen.** A resident with pneumonia may be placed on oxygen because the fluid-filled air sacs can\'t deliver enough. As always: you support the equipment — check the cannula, the tubing, the fit — but you never set or change the flow rate. If a resident seems short of breath, that\'s a report to the nurse, not an adjustment you make.',
                '**Fever and comfort measures.** The doctor may order medication to bring down fever and ease discomfort. You don\'t give it, but you support comfort: cool the room appropriately, offer fluids as the plan allows, keep the resident clean and dry as fever causes sweating, and position them to breathe easier.',
                '**Fluids, rest, and nutrition.** Recovery needs hydration, rest, and nourishment. You support all three — encouraging fluids and meals as the care plan allows, helping the resident rest, and positioning them upright to breathe and to eat safely.',
                '**Chest care and movement.** The care plan may include repositioning, encouraging deep breathing, or getting the resident up as able — all of which help clear the lungs. You carry out these supportive measures as directed.',
                'The scope point for this whole section: you don\'t treat the infection, but you support every part of recovery — hydration, nutrition, rest, positioning, oxygen equipment, comfort — and you observe and report whether the resident is getting better or worse. That support genuinely speeds recovery.',
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
            { id: 'pneum-s08-heading', type: 'heading', level: 1, text: 'Prevention & Risk Reduction' },
            {
              id: 'pneum-s08-image',
              type: 'image',
              src: '/assets/courses/pneumonia/s08-hero.jpg',
              caption: 'Prevention: good oral care, repositioning, encouraging fluids and movement.',
            },
            {
              id: 'pneum-s08-narration',
              type: 'text',
              body: [
                'Pneumonia prevention is some of the most powerful work a CNA does — because so much of it rests in your hands. Here are seven ways.',
                '**One. Feed safely to prevent aspiration.** This is huge. For residents with swallowing problems, follow the care plan exactly — the right food texture, thickened liquids if ordered, the resident sitting fully upright, small bites, a slow pace, and checking each bite is swallowed before the next. Keep them upright for at least thirty minutes after eating. This single set of habits prevents a great deal of aspiration pneumonia.',
                '**Two. Provide excellent mouth care.** A clean mouth has fewer germs to aspirate. Good oral hygiene — brushing teeth, cleaning the mouth and gums, denture care — is one of the most proven ways to prevent pneumonia, especially in residents who are weak or have swallowing trouble. Never skip mouth care.',
                '**Three. Position to protect the lungs.** Keep residents upright during and after meals. For bedbound residents, reposition regularly so fluid doesn\'t settle in the lungs, and keep the head of the bed raised as the plan allows. Movement and good positioning keep lungs clearer.',
                '**Four. Encourage movement and deep breathing.** Help residents get up and move as able — even sitting up or short walks help the lungs clear. Encourage deep breaths. Immobility lets fluid pool in the lungs and invites pneumonia.',
                '**Five. Practice strong infection control.** Wash your hands well and often. Keep sick visitors and staff away from vulnerable residents. Clean shared equipment. Pneumonia germs spread person to person — good hygiene blocks them.',
                '**Six. Support vaccines.** Flu and pneumonia vaccines significantly lower the risk of pneumonia and its complications. Support residents in receiving them as the care plan directs, and encourage your own vaccination to protect those you care for.',
                '**Seven. Catch the early signs.** Know each resident\'s normal, and report changes the same shift — new confusion, weakness, loss of appetite, a fall, cough, or fever. Catching pneumonia early is the difference between a course of antibiotics and a hospital stay, or worse.',
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
              id: 'pneum-s09-heading',
              type: 'heading',
              level: 1,
              text: 'Scenario & Reporting',
            },
            pendingAudio(
              'pneum-s09-intro-audio',
              'Emergency response scenarios intro',
              `${ASSET_BASE}/s09-emergency-intro.mp3`,
              'With pneumonia, the two key skills are catching the subtle early signs and recognizing when breathing trouble has become an emergency. You\'re about to work through two situations. Read each carefully, choose your action, and you\'ll get feedback right away. Keep in mind the theme of this whole course: in older adults, a sudden change in how a resident acts can be the first sign of pneumonia.',
              `${ASSET_BASE}/s09-emergency-intro.mp3`,
            ),
            {
              id: 'pneum-s09-image',
              type: 'image',
              src: '/assets/courses/pneumonia/s09-hero.jpg',
              caption:
                'Reading a pneumonia situation: when it\'s an emergency, when to report a subtle change.',
            },
            {
              id: 'pneum-s09-scenario-emergency-image',
              type: 'image',
              src: '/assets/courses/pneumonia/s09-scenario-emergency.jpg',
              caption:
                'Fast labored breathing, bluish lips, worsening confusion despite antibiotics: keep upright, stay, activate emergency help immediately.',
            },
            {
              id: 'pneum-s09-scenario-emergency',
              type: 'scenario_question',
              prompt:
                'Mr. Yamada was diagnosed with pneumonia two days ago and is on antibiotics. This afternoon you find him breathing fast and labored, unable to speak more than a few words. His lips look bluish, he\'s much more confused than this morning, and he feels very warm. What is the BEST action?',
              options: [
                {
                  id: 'wait-check',
                  label: 'Wait until the next scheduled check to see if he improves',
                  feedback:
                    'This is a respiratory emergency — blue lips and worsening confusion in a resident with pneumonia signal he\'s deteriorating, possibly toward sepsis. Waiting, laying him flat, or giving extra medication are all wrong and dangerous. The right action: stay with him, keep him upright, and activate emergency help immediately.',
                },
                {
                  id: 'activate-now',
                  label: 'Stay with him, keep him upright, and activate emergency help immediately',
                  feedback:
                    'Exactly right. Fast labored breathing, blue lips, and worsening confusion mean his pneumonia is becoming dangerous — possibly progressing toward sepsis or respiratory failure. This is an emergency. Stay with him, keep him sitting upright to help him breathe, and activate emergency help immediately. And note what you do NOT do — you never give an extra antibiotic dose or any medication. You summon help fast and support his breathing.',
                  isRecommended: true,
                },
                {
                  id: 'extra-antibiotic',
                  label: 'Give him an extra dose of his antibiotic',
                  feedback:
                    'This is a respiratory emergency — blue lips and worsening confusion in a resident with pneumonia signal he\'s deteriorating, possibly toward sepsis. Waiting, laying him flat, or giving extra medication are all wrong and dangerous. The right action: stay with him, keep him upright, and activate emergency help immediately.',
                },
                {
                  id: 'lie-flat',
                  label: 'Help him lie flat to rest',
                  feedback:
                    'This is a respiratory emergency — blue lips and worsening confusion in a resident with pneumonia signal he\'s deteriorating, possibly toward sepsis. Waiting, laying him flat, or giving extra medication are all wrong and dangerous. The right action: stay with him, keep him upright, and activate emergency help immediately.',
                },
              ],
              requiredForCompletion: true,
            },
            {
              id: 'pneum-s09-scenario-subtle-image',
              type: 'image',
              src: '/assets/courses/pneumonia/s09-scenario-subtle.jpg',
              caption:
                'Suddenly confused, tired, refusing food but no cough or fever: report the change in mental state and appetite to the nurse promptly.',
            },
            {
              id: 'pneum-s09-scenario-subtle',
              type: 'scenario_question',
              prompt:
                'Mrs. Kaur is normally alert and chatty, and always finishes her lunch. Today she seems confused, doesn\'t recognize you at first, is unusually tired, and pushes her food away. She has no obvious cough and doesn\'t feel especially hot. She just seems "not herself." What SHOULD the CNA do?',
              options: [
                {
                  id: 'off-day',
                  label: 'Assume she\'s just having an off day and continue the routine',
                  feedback:
                    'In older adults, pneumonia often shows up as new confusion, weakness, and loss of appetite rather than cough and fever. Dismissing it as an off day, forcing food, or waiting until tomorrow could let a treatable infection become dangerous. The right action: report the sudden change in her mental state and appetite to the nurse promptly.',
                },
                {
                  id: 'report-promptly',
                  label: 'Report the sudden change in her mental state and appetite to the nurse promptly',
                  feedback:
                    'Right. In older adults, new confusion, sudden tiredness, and loss of appetite — even without cough or fever — can be the first signs of pneumonia or another serious infection. A resident who is suddenly "not herself" needs to be reported promptly, not dismissed as an off day. Reporting early gives the nurse and doctor the chance to find and treat pneumonia before it becomes the emergency you saw in the last scenario. Trust the change — you know her normal.',
                  isRecommended: true,
                },
                {
                  id: 'force-meal',
                  label: 'Insist she finish her meal to keep her strength up',
                  feedback:
                    'In older adults, pneumonia often shows up as new confusion, weakness, and loss of appetite rather than cough and fever. Dismissing it as an off day, forcing food, or waiting until tomorrow could let a treatable infection become dangerous. The right action: report the sudden change in her mental state and appetite to the nurse promptly.',
                },
                {
                  id: 'wait-tomorrow',
                  label: 'Wait until tomorrow to see if she returns to normal',
                  feedback:
                    'In older adults, pneumonia often shows up as new confusion, weakness, and loss of appetite rather than cough and fever. Dismissing it as an off day, forcing food, or waiting until tomorrow could let a treatable infection become dangerous. The right action: report the sudden change in her mental state and appetite to the nurse promptly.',
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
            { id: 'pneum-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
              id: 'pneum-s10-video',
              type: 'video',
              title: "CNA's Role in Care",
              videoUrl: `${ASSET_BASE}/s10-cna-role.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s10-cna-role.mp4`,
            },
            {
              id: 'pneum-s10-narration',
              type: 'text',
              body: [
                'Your role in pneumonia care is twofold and powerful: prevent it through daily care, and recognize it early. Let\'s walk through it.',
                '**Feed safely** Preventing aspiration pneumonia starts at the table. For residents with swallowing problems, follow the care plan exactly — the right food texture, thickened liquids if ordered, the resident fully upright, small bites, slow pace, watching each swallow. Keep them upright for at least thirty minutes after the meal. If a resident coughs, chokes, or sounds wet and gurgly when eating or speaking, stop and report it. Safe feeding is direct pneumonia prevention.',
                '**Provide mouth care** Mouth care is pneumonia prevention — one of the most proven measures there is. A clean mouth has fewer germs to be aspirated into the lungs. Brush teeth, clean the mouth and gums, care for dentures, every day, thoroughly. Never treat mouth care as optional, especially for weak residents or those with swallowing trouble.',
                '**Position and move** Protect the lungs through position and movement. Keep residents upright during and after meals. Reposition bedbound residents regularly so fluid doesn\'t settle in the lungs. Keep the head of the bed raised as the plan allows. Encourage movement and deep breathing as able. Each of these keeps the lungs clearer and lowers pneumonia risk.',
                '**Recognize and report** And recognize early. Know each resident\'s normal, and report changes the same shift — and remember, in older adults the first sign is often new confusion, weakness, or loss of appetite, not cough or fever. When a resident is suddenly "not themselves," that\'s a report, not something to wait on. For residents being treated for pneumonia, watch for worsening — more confusion, more breathlessness, more drowsiness — and report it.',
                'Now the boundary. You do not diagnose pneumonia. You do not give or adjust antibiotics or any medication. You never change the oxygen flow rate. And you never dismiss a sudden change in an older resident as "just an off day."',
                'Inside your role — safe feeding, thorough mouth care, good positioning and movement, infection control, and early recognition — you are one of the strongest forces both preventing pneumonia and catching it in time. Few things a CNA does save more lives.',
              ].join('\n\n'),
            },
            {
              id: 'pneum-s10-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Stay within scope',
              body: 'You do not diagnose pneumonia. You do not give or adjust antibiotics or any medication. You never change the oxygen flow rate. And you never dismiss a sudden change in an older resident as "just an off day."',
            },
            {
              id: 'pneum-s10-image',
              type: 'image',
              src: '/assets/courses/pneumonia/s10-hero.jpg',
              caption: 'Reporting breathing and mental-status changes accurately to the nurse.',
            },
          ]),
      },
      {
        slug: 's11-case-study',
        title: 'Case Study',
        sortOrder: 2,
        buildContent: () => {
          const caseNarrative = [
            'Mrs. Underwood, 84, had dementia but a steady, predictable routine. Every morning she greeted her CNA, Grace, by name and ate a good breakfast. Grace had cared for her for over a year and knew her rhythms by heart.',
            '',
            '**The subtle change (morning):** One morning, Mrs. Underwood didn\'t greet Grace. She seemed more confused than usual, didn\'t seem to recognize her at first, and was unusually drowsy. She turned her face away from breakfast — she who never refused a meal. She had no cough. When Grace touched her forehead, she felt maybe slightly warm, but not hot. To a rushed eye, it might have looked like "just a bad dementia day."',
            '',
            '**What Grace did NOT do:** Grace did not shrug it off as an off day. She did not force the meal. She did not decide to "wait and see" until the afternoon.',
            '',
            '**What Grace DID:** Grace trusted what she knew. This was a sudden change from Mrs. Underwood\'s normal — new confusion, drowsiness, no appetite. Grace reported it to the nurse right away, describing it precisely: "Mrs. Underwood is much more confused and drowsy than her normal this morning, didn\'t recognize me, refused breakfast which she never does, and feels a little warm. This is a sudden change."',
            '',
            '**The diagnosis:** The nurse assessed Mrs. Underwood, found her breathing slightly faster and her oxygen a little low, and called the doctor. A chest evaluation confirmed early pneumonia — caught before she ever developed an obvious cough or high fever. She was started on antibiotics that same day.',
            '',
            '**The outcome:** Because the pneumonia was caught so early, Mrs. Underwood was treated in the facility and recovered fully over the following week — no hospital stay, no crisis. The nurse told Grace: "Most people would\'ve called that a bad dementia day. You caught a pneumonia before it had a cough. That\'s what saved her a hospital trip."',
            '',
            '**Discussion:** Mrs. Underwood never showed the "classic" pneumonia signs. No cough, no high fever. Her pneumonia hid behind new confusion, drowsiness, and refusing food — exactly how it often presents in older adults. Grace\'s value wasn\'t medical knowledge of antibiotics; it was knowing Mrs. Underwood\'s normal, refusing to dismiss the change, and reporting it promptly. That\'s the whole heart of pneumonia recognition in the elderly.',
          ].join('\n');

          return doc('Brief Case Study', [
            { id: 'pneum-s11-heading', type: 'heading', level: 1, text: 'Brief Case Study' },
            pendingAudio(
              'pneum-s11-audio',
              "She's Just Not Herself Today",
              `${ASSET_BASE}/s11-case-podcast.mp3`,
              caseNarrative,
              `${ASSET_BASE}/s11-case-podcast.mp3`,
            ),
            {
              id: 'pneum-s11-image',
              type: 'image',
              src: '/assets/courses/pneumonia/s11-hero.jpg',
              caption: 'A pneumonia concern handled correctly — observed, supported, escalated.',
            },
            {
              id: 'pneum-s11-case-study',
              type: 'case_study',
              title: "She's Just Not Herself Today",
              residentProfile:
                'Mrs. Underwood, 84, had dementia but a steady, predictable routine. Every morning she greeted her CNA, Grace, by name and ate a good breakfast. Grace had cared for her for over a year and knew her rhythms by heart.',
              scenario: [
                '**The subtle change (morning):** One morning, Mrs. Underwood didn\'t greet Grace. She seemed more confused than usual, didn\'t seem to recognize her at first, and was unusually drowsy. She turned her face away from breakfast — she who never refused a meal. She had no cough. When Grace touched her forehead, she felt maybe slightly warm, but not hot. To a rushed eye, it might have looked like "just a bad dementia day."',
                '**What Grace did NOT do:** Grace did not shrug it off as an off day. She did not force the meal. She did not decide to "wait and see" until the afternoon.',
                '**What Grace DID:** Grace trusted what she knew. This was a sudden change from Mrs. Underwood\'s normal — new confusion, drowsiness, no appetite. Grace reported it to the nurse right away, describing it precisely: "Mrs. Underwood is much more confused and drowsy than her normal this morning, didn\'t recognize me, refused breakfast which she never does, and feels a little warm. This is a sudden change."',
                '**The diagnosis:** The nurse assessed Mrs. Underwood, found her breathing slightly faster and her oxygen a little low, and called the doctor. A chest evaluation confirmed early pneumonia — caught before she ever developed an obvious cough or high fever. She was started on antibiotics that same day.',
                '**The outcome:** Because the pneumonia was caught so early, Mrs. Underwood was treated in the facility and recovered fully over the following week — no hospital stay, no crisis. The nurse told Grace: "Most people would\'ve called that a bad dementia day. You caught a pneumonia before it had a cough. That\'s what saved her a hospital trip."',
                '**Discussion:** Mrs. Underwood never showed the "classic" pneumonia signs. No cough, no high fever. Her pneumonia hid behind new confusion, drowsiness, and refusing food — exactly how it often presents in older adults. Grace\'s value wasn\'t medical knowledge of antibiotics; it was knowing Mrs. Underwood\'s normal, refusing to dismiss the change, and reporting it promptly. That\'s the whole heart of pneumonia recognition in the elderly.',
              ].join('\n\n'),
            },
            {
              id: 'pneum-s11-reflection-1',
              type: 'reflection',
              prompt:
                'Mrs. Underwood had no cough and no high fever. What signs told Grace something was seriously wrong, and why are these so easy to miss in older adults with dementia?',
              minCharacters: 50,
            },
            {
              id: 'pneum-s11-reflection-2',
              type: 'reflection',
              prompt:
                'Grace knew Mrs. Underwood\'s "normal" from over a year of care. Why is a CNA\'s knowledge of each resident\'s baseline so powerful for catching illness early?',
              minCharacters: 50,
            },
            {
              id: 'pneum-s11-reflection-intro-text',
              type: 'text',
              body: 'Reflect on the case study in the previous lesson. Your written responses help you apply what you learned about recognizing subtle pneumonia signs and reporting sudden changes promptly.',
            },
            {
              id: 'pneum-s11-kc2-check',
              type: 'knowledge_check',
              question:
                'A CNA does not give or adjust antibiotics or any medication, and a CNA never changes an oxygen flow rate. When a resident with pneumonia seems short of breath, the CNA SHOULD:',
              options: [
                {
                  id: 'change-oxygen',
                  label: 'Increase the oxygen flow rate to help them breathe',
                },
                {
                  id: 'report-nurse',
                  label: 'Report the shortness of breath to the nurse and let the nurse decide',
                },
                {
                  id: 'give-antibiotic',
                  label: 'Give an extra antibiotic dose to treat the infection',
                },
                {
                  id: 'wait-recheck',
                  label: 'Wait and recheck later without telling anyone',
                },
              ],
              correctOptionId: 'report-nurse',
              explanation:
                'If a resident seems short of breath, that\'s a report to the nurse, not an adjustment you make. You support the equipment — check the cannula, the tubing, the fit — but you never set or change the flow rate.',
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
            { id: 'pneum-s12-heading', type: 'heading', level: 1, text: 'Conclusion' },
            {
              id: 'pneum-s12-video',
              type: 'video',
              title: 'Conclusion',
              videoUrl: `${ASSET_BASE}/s12-conclusion.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s12-conclusion.mp4`,
            },
            {
              id: 'pneum-s12-image',
              type: 'image',
              src: '/assets/courses/pneumonia/s12-hero.jpg',
              caption: 'Recognize early, support recovery, report promptly — the CNA\'s role.',
            },
            {
              id: 'pneum-s12-narration',
              type: 'text',
              body: [
                'You\'ve reached the end. Let\'s lock in the five things that matter most for pneumonia.',
                '**One.** Pneumonia is a lung infection that fills the air sacs with fluid, and in older adults it\'s a leading cause of hospitalization and death. It is never taken lightly.',
                '**Two.** In older adults, pneumonia hides. Instead of a cough and high fever, the first sign is often new confusion, weakness, loss of appetite, or a fall. When a resident is suddenly "not themselves," report it — that change can be the first sign of pneumonia.',
                '**Three.** Prevent aspiration pneumonia — it\'s largely in your hands. Safe feeding with proper positioning, the right food texture, small bites, a slow pace, and staying upright after meals. Plus thorough mouth care every day, because a clean mouth has fewer germs to aspirate.',
                '**Four.** Know the emergency. Fast labored breathing, blue lips, worsening confusion or drowsiness, signs of sepsis. Stay with the resident, keep them upright, and activate help immediately.',
                '**Five.** Honor your scope. You support, observe, and report. You never give antibiotics or any medication, and you never change the oxygen flow rate. But around the medication, you do everything that prevents pneumonia and catches it early — and that work saves lives.',
              ].join('\n\n'),
            },
            {
              id: 'pneum-s12-summary',
              type: 'summary',
              title: 'Five things that matter most',
              items: [
                'Pneumonia is a lung infection — in older adults it is a leading cause of hospitalization and death.',
                'In older adults, pneumonia hides — new confusion, weakness, or loss of appetite may be the first sign.',
                'Prevent aspiration pneumonia — safe feeding, positioning, and thorough mouth care.',
                'Know the emergency — labored breathing, blue lips, worsening confusion, signs of sepsis.',
                'Honor your scope — support, observe, and report; never give antibiotics or change oxygen flow rates.',
              ],
            },
            {
              id: 'pneum-s12-what-happens-next-text',
              type: 'text',
              body: 'Ten questions are waiting. Everything on them was covered here. You\'re ready. Trust what you\'ve learned, and show what you know.',
            },
            {
              id: 'pneum-s12-completion-requirements-text',
              type: 'text',
              body: 'This course provides one hour of continuing education credit through CAL ACE Nursing Academy, an approved CDPH continuing education provider, NAC number 7384. Your certificate is generated automatically when you pass the knowledge check.',
            },
            {
              id: 'pneum-s12-completion-requirements-callout',
              type: 'callout',
              variant: 'info',
              title: 'Scope reminder',
              body: 'CNAs recognize, prevent, support, and report. CNAs do not diagnose pneumonia, give or adjust antibiotics, or change oxygen flow rates.',
            },
            {
              id: 'pneum-s12-certificate-access-text',
              type: 'text',
              body: 'Your certificate is generated automatically when you pass the knowledge check. CDPH-Approved CE Provider — NAC #7384.',
            },
          ]),
      },
    ],
  },
];

export async function seedCourse19Pneumonia(
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
  console.log(`Seeding Course 19 (Pneumonia) as DRAFT — slug "${COURSE_SLUG}"…`);

  try {
    const result = await seedCourse19Pneumonia(prisma);
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
