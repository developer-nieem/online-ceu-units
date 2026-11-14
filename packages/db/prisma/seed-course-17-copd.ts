/**
 * Seed Course 17 — Caring for a Resident with COPD (DRAFT).
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-17-copd
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
const COURSE_SLUG = 'copd';
const COURSE_TITLE = 'Breathing Support for Residents with Chronic Lung Disease';
const COURSE_SUMMARY =
  'Learn to recognize breathing distress and COPD flare-ups, support oxygen and the care plan safely, and respond to a respiratory emergency — within CNA scope. CNAs do not diagnose, give or adjust medications or inhalers, or change oxygen flow rates.';

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
    'Explain what COPD is, in plain language',
    'Recognize the signs of worsening breathing and respiratory distress',
    'Support breathing through positioning, pacing, and a clean environment',
    'Follow oxygen safety rules',
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
  heroImage: '/assets/courses/copd/hero-banner.jpg',
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
    title: 'Understanding COPD',
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: 'Introduction',
        sortOrder: 0,
        buildContent: () =>
          doc('Introduction', [
            { id: 'copd-s01-heading', type: 'heading', level: 1, text: 'Welcome' },
            {
              id: 'copd-s01-video',
              type: 'video',
              title: 'Introduction',
              videoUrl: `${ASSET_BASE}/s01-intro.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s01-intro.mp4`,
            },
            {
              id: 'copd-s01-image',
              type: 'image',
              src: '/assets/courses/copd/s01-hero.jpg',
              caption: 'A CAL ACE CNA supporting a resident living with COPD.',
            },
            {
              id: 'copd-s01-narration',
              type: 'text',
              body: [
                'Welcome to CAL ACE Nursing Academy.',
                'This course is about C-O-P-D — chronic obstructive pulmonary disease.',
                'COPD is a long-term lung disease that makes it hard to breathe. The airways become narrowed and inflamed, and the air sacs deep in the lungs lose their stretch. Air gets trapped. Getting a full, easy breath — something most of us never think about — becomes daily work for a resident with COPD.',
                'Imagine breathing through a thin straw while walking up a hill. That is close to what some residents with COPD feel doing ordinary things — getting dressed, walking to the dining room, even talking. Now imagine living with that every hour of every day. Understanding this changes how you care for them.',
                'COPD is one of the most common conditions in long-term care, and it\'s one where the CNA\'s daily role is enormous. How you position a resident, how you pace their activities, how you keep their environment clear of irritants, how quickly you recognize that their breathing has gotten worse — all of it directly affects how well they breathe and how safe they stay.',
                'This course also covers something you must get exactly right: oxygen. Many residents with COPD use oxygen, and there are important safety rules around it — including one rule that surprises many people, which is that with COPD, more oxygen is not always better. You\'ll learn why, and you\'ll learn the firm scope boundary: a CNA never changes an oxygen flow rate.',
                'There is a ten-question knowledge check at the end. Everything on it is covered here. Let\'s begin.',
              ].join('\n\n'),
            },
            {
              id: 'copd-s01-course-information-text',
              type: 'text',
              body: [
                'This course teaches the CNA\'s role in supporting a resident living with chronic obstructive pulmonary disease (COPD) — recognizing breathing distress, supporting oxygen and the care plan, and responding to a respiratory emergency.',
                'Let\'s be clear about your role. Your scope is clear. A CNA supports breathing through positioning and pacing, observes and reports changes in breathing, supports oxygen safely, and responds to respiratory distress. A CNA does not diagnose COPD, does not give or adjust inhalers or medications, and does not change oxygen settings.',
              ].join('\n\n'),
            },
            {
              id: 'copd-s01-course-information-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of this course',
              body: 'CNAs SUPPORT, OBSERVE, and REPORT. CNAs do not diagnose COPD, give or adjust inhalers or medications, or change oxygen flow rates.',
            },
            {
              id: 'copd-s01-learning-objectives-text',
              type: 'text',
              body: 'By the end of this course, you will be able to:',
            },
            {
              id: 'copd-s01-learning-objectives-summary',
              type: 'summary',
              title: 'Learning objectives',
              items: [
                'Explain what COPD is, in plain language.',
                'Recognize the signs of worsening breathing and respiratory distress.',
                'Support breathing through positioning, pacing, and a clean environment.',
                'Follow oxygen safety rules.',
                'Know your scope — what a CNA does, and what a CNA must never do.',
              ],
            },
            {
              id: 'copd-s01-instructor-intro-text',
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
            { id: 'copd-s02-heading', type: 'heading', level: 1, text: 'Key terms' },
            {
              id: 'copd-s02-image',
              type: 'image',
              src: '/assets/courses/copd/s02-hero.jpg',
              caption:
                'The language of COPD — dyspnea, hypoxia, exacerbation, pursed-lip breathing.',
            },
            {
              id: 'copd-s02-reveal-copd',
              type: 'reveal_card',
              frontTitle: 'COPD',
              frontBody: 'C-O-P-D',
              backTitle: 'COPD',
              backBody:
                'Chronic obstructive pulmonary disease. A long-term lung disease where the airways are narrowed and the lungs are damaged, making it hard to push air out and get a full breath. "Chronic" means long-lasting. "Obstructive" means airflow is blocked.',
            },
            {
              id: 'copd-s02-reveal-emphysema',
              type: 'reveal_card',
              frontTitle: 'Emphysema',
              frontBody: 'Em-fih-ZEE-mah',
              backTitle: 'Emphysema',
              backBody:
                'A form of COPD where the tiny air sacs in the lungs are damaged and lose their stretch. The lungs can\'t push air out well, so stale air gets trapped. Breathing out becomes the hard part.',
            },
            {
              id: 'copd-s02-reveal-bronchitis',
              type: 'reveal_card',
              frontTitle: 'Chronic Bronchitis',
              frontBody: 'Bron-KY-tis',
              backTitle: 'Chronic Bronchitis',
              backBody:
                'A form of COPD where the airways are constantly inflamed and produce too much mucus. This causes a long-lasting cough and makes the airways narrower. Many residents have both emphysema and chronic bronchitis together.',
            },
            {
              id: 'copd-s02-reveal-dyspnea',
              type: 'reveal_card',
              frontTitle: 'Dyspnea',
              frontBody: 'DISP-nee-ah',
              backTitle: 'Dyspnea',
              backBody:
                'Shortness of breath, or difficulty breathing. The main symptom of COPD. A resident may say "I can\'t catch my breath," or you may see them breathing hard and fast during simple activities.',
            },
            {
              id: 'copd-s02-reveal-hypoxia',
              type: 'reveal_card',
              frontTitle: 'Hypoxia',
              frontBody: 'Hi-POX-ee-ah',
              backTitle: 'Hypoxia',
              backBody:
                'When the body isn\'t getting enough oxygen. Signs can include confusion, restlessness, a fast heartbeat, and a bluish color of the lips or fingertips. Hypoxia is dangerous and always reported.',
            },
            {
              id: 'copd-s02-reveal-pursed-lip',
              type: 'reveal_card',
              frontTitle: 'Pursed-Lip Breathing',
              frontBody: 'Pursed-lip breathing',
              backTitle: 'Pursed-Lip Breathing',
              backBody:
                'A simple technique where the resident breathes in through the nose and out slowly through lips pursed like blowing out a candle. It helps push trapped air out and makes breathing more effective. You can gently coach a resident to do it.',
            },
            {
              id: 'copd-s02-reveal-exacerbation',
              type: 'reveal_card',
              frontTitle: 'Exacerbation',
              frontBody: 'Eg-zass-er-BAY-shun',
              backTitle: 'Exacerbation',
              backBody:
                'A flare-up — when COPD symptoms suddenly get worse than usual. More shortness of breath, more coughing, more mucus, often a change in mucus color. An exacerbation is reported promptly and can become an emergency.',
            },
            {
              id: 'copd-s02-reveal-oximeter',
              type: 'reveal_card',
              frontTitle: 'Pulse Oximeter',
              frontBody: 'Ox-IM-eh-ter',
              backTitle: 'Pulse Oximeter',
              backBody:
                'A small clip placed on a fingertip that measures the oxygen level in the blood, shown as a percentage. CNAs are often trained to use one. A reading that is low, or lower than the resident\'s normal, is reported to the nurse.',
            },
            {
              id: 'copd-s02-kc1-check-dyspnea',
              type: 'knowledge_check',
              question: 'Match the term: shortness of breath, the main COPD symptom',
              options: [
                { id: 'dyspnea', label: 'Dyspnea' },
                { id: 'exacerbation', label: 'Exacerbation' },
                { id: 'pursed-lip', label: 'Pursed-lip breathing' },
              ],
              correctOptionId: 'dyspnea',
              explanation:
                'Dyspnea. Shortness of breath, or difficulty breathing. The main symptom of COPD.',
              requiredForCompletion: true,
            },
            {
              id: 'copd-s02-kc1-check-exacerbation',
              type: 'knowledge_check',
              question: 'Match the term: a sudden flare-up of worsening symptoms',
              options: [
                { id: 'dyspnea', label: 'Dyspnea' },
                { id: 'exacerbation', label: 'Exacerbation' },
                { id: 'pursed-lip', label: 'Pursed-lip breathing' },
              ],
              correctOptionId: 'exacerbation',
              explanation:
                'Exacerbation. A flare-up — when COPD symptoms suddenly get worse than usual.',
              requiredForCompletion: true,
            },
            {
              id: 'copd-s02-kc1-check-pursed-lip',
              type: 'knowledge_check',
              question:
                'Match the term: breathe out slowly through pursed lips to clear trapped air',
              options: [
                { id: 'dyspnea', label: 'Dyspnea' },
                { id: 'exacerbation', label: 'Exacerbation' },
                { id: 'pursed-lip', label: 'Pursed-lip breathing' },
              ],
              correctOptionId: 'pursed-lip',
              explanation:
                'Pursed-lip breathing. Breathe in through the nose and out slowly through lips pursed like blowing out a candle. It helps push trapped air out.',
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
            { id: 'copd-s03-heading', type: 'heading', level: 1, text: 'Statistics' },
            pendingAudio(
              'copd-s03-audio',
              'COPD: A Common and Limiting Disease',
              `${ASSET_BASE}/s03-stats-podcast.mp3`,
              [
                'COPD: A Common and Limiting Disease',
                '',
                'Chronic obstructive pulmonary disease affects about 16 million diagnosed adults in the United States, and millions more likely have it without a diagnosis. It is one of the leading causes of death in the country, and it is especially common among older adults — which is why so many long-term care residents live with it.',
                '',
                'COPD is a disease that steals breath gradually. It develops over many years, usually from long-term damage to the lungs. By the time someone is in long-term care with COPD, the disease is often advanced, and even small activities — dressing, walking a short distance, bathing, sometimes just talking — can leave them breathless.',
                '',
                'Here is what matters most for the CNA. COPD flare-ups, called exacerbations, are one of the most common reasons residents with COPD are hospitalized. A flare-up means a sudden worsening of breathing, often triggered by a respiratory infection. And many of these hospitalizations are preventable when a flare-up is caught early. The CNA who notices that a resident is more short of breath than usual, coughing more, or producing more or differently colored mucus — and reports it promptly — gives the medical team the chance to treat the flare-up before it becomes a crisis.',
                '',
                'There is also a daily quality-of-life story. Studies show that the everyday care a resident with COPD receives — being positioned to breathe easier, having activities paced with rest, having a calm and irritant-free environment, being coached to breathe effectively — has a real, measurable effect on how well they breathe and how much they can do. That care is delivered, every shift, by CNAs.',
                '',
                'The bottom line: COPD is common, it is limiting, and the CNA\'s daily positioning, pacing, environment management, and quick recognition of flare-ups make a genuine difference in both safety and quality of life.',
              ].join('\n'),
              `${ASSET_BASE}/s03-stats-podcast.mp3`,
            ),
            {
              id: 'copd-s03-image',
              type: 'image',
              src: '/assets/courses/copd/s03-hero.jpg',
              caption: 'COPD is common in long-term care — careful observation matters.',
            },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: 'Fundamentals',
        sortOrder: 3,
        buildContent: () =>
          doc('Fundamentals', [
            { id: 'copd-s04-heading', type: 'heading', level: 1, text: 'Fundamentals' },
            {
              id: 'copd-s04-video',
              type: 'video',
              title: 'Fundamentals',
              videoUrl: `${ASSET_BASE}/s04-fundamentals.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s04-fundamentals.mp4`,
            },
            {
              id: 'copd-s04-image',
              type: 'image',
              src: '/assets/courses/copd/s04-hero.jpg',
              caption: 'Understanding how COPD makes breathing harder.',
            },
            {
              id: 'copd-s04-narration',
              type: 'text',
              body: [
                '**How healthy lungs work**',
                'With each breath, air travels down the airways into millions of tiny air sacs in the lungs. There, oxygen passes into the blood and carbon dioxide passes out, to be breathed away. Healthy air sacs are stretchy, like little balloons, filling and emptying easily.',
                '**What COPD does to the airways**',
                'In COPD, the airways become narrowed, inflamed, and often clogged with mucus. Air has a harder time moving through. It\'s like trying to breathe through a straw that keeps getting smaller. The body has to work harder for every breath.',
                '**What COPD does to the air sacs**',
                'In emphysema, the tiny air sacs are damaged and lose their stretch. They can\'t push air out well, so stale, used air gets trapped inside. This is why breathing OUT — not just breathing in — becomes the hard part of COPD. The lungs stay partly full of old air.',
                '**Why activity causes breathlessness**',
                'When a resident with COPD moves, their muscles need more oxygen — but the damaged lungs can\'t deliver it fast enough. So even small efforts, like dressing or walking, leave them breathless. This isn\'t weakness or laziness. It\'s the lungs simply unable to keep up. Understanding this changes how patiently we pace their care.',
                '**Why positioning matters so much**',
                'Body position directly affects breathing. Sitting upright, or leaning slightly forward onto a table or pillows, gives the lungs the most room to expand and makes breathing easier. Lying flat presses on the lungs and makes breathing harder. This is why how you position a resident is real, direct breathing care.',
                '**The oxygen surprise**',
                'Here\'s something important and surprising. For many people, more oxygen is always better. But for some residents with severe COPD, too much oxygen can actually slow their breathing dangerously. This is why oxygen in COPD is carefully prescribed at a specific flow rate — and why a CNA must never turn it up, even when a resident seems short of breath. You report; the nurse adjusts.',
                '**COPD is managed, not cured**',
                'COPD cannot be cured, and the lung damage doesn\'t reverse. But it can be managed well — with medications and inhalers, oxygen when prescribed, good daily care, and quick treatment of flare-ups. Many residents live for years with COPD. Your daily care is central to how well they live with it.',
              ].join('\n\n'),
            },
            {
              id: 'copd-s04-oxygen-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'More oxygen is NOT always better in COPD',
              body: 'Oxygen in COPD is carefully prescribed at a specific flow rate — and a CNA must never turn it up, even when a resident seems short of breath. You report; the nurse adjusts.',
            },
          ]),
      },
    ],
  },
  {
    slug: 'module-2',
    title: 'Breathing Support, Recognition, and CNA Role',
    sortOrder: 1,
    lessons: [
      {
        slug: 's05-signs',
        title: 'Signs & Symptoms',
        sortOrder: 0,
        buildContent: () =>
          doc('Signs & Symptoms', [
            { id: 'copd-s05-heading', type: 'heading', level: 1, text: 'Signs & Symptoms' },
            {
              id: 'copd-s05-image',
              type: 'image',
              src: '/assets/courses/copd/s05-hero.jpg',
              caption: 'Recognizing the breathing changes that need attention.',
            },
            {
              id: 'copd-s05-narration',
              type: 'text',
              body: [
                'To care well for a resident with COPD, you need to know two things: their usual breathing, and the signs that it\'s getting worse. Let\'s learn both.',
                '**The usual signs of COPD**',
                'Many residents with COPD have everyday signs you\'ll come to know. Shortness of breath with activity. A long-term cough. Wheezing — a whistling sound when breathing. Bringing up mucus. Tiring easily. Some breathe with pursed lips, or raise their shoulders to help pull in air. Learning each resident\'s normal breathing is the key — because the warning is when it changes.',
                '**The warning signs of a flare-up**',
                'A flare-up, or exacerbation, means the breathing is getting worse than this resident\'s usual. Watch for: more shortness of breath than normal, even at rest. More coughing. More mucus, or mucus that changes color — to yellow, green, or brown. Increased wheezing. More fatigue. A new fever. These signs mean report promptly — early treatment can prevent a hospital stay.',
                '**The danger signs of respiratory distress**',
                'Some signs mean the resident is in serious trouble right now. Severe shortness of breath where they can\'t speak in full sentences. Gasping or struggling hard to breathe. Blue or gray color of the lips, face, or fingertips — that\'s hypoxia. New or rising confusion, restlessness, or agitation — because a brain short on oxygen gets confused. A very fast heartbeat. These are emergency signs.',
                '**Using the pulse oximeter**',
                'Many CNAs are trained to use a pulse oximeter — the fingertip clip that reads blood oxygen as a percentage. Know each resident\'s usual range from the care plan. A reading that\'s low, or lower than their normal, is reported to the nurse. But remember — you treat the resident, not just the number. A resident who looks like they\'re struggling needs help even while you\'re checking the device.',
                '**Summary**',
                'Two pictures. The resident\'s usual COPD: their normal cough, wheeze, and shortness of breath with activity — know it well. A flare-up or emergency: worse breathing than usual, more or discolored mucus, confusion, or blue lips — report a flare-up promptly, and treat severe distress, blue color, or confusion as an emergency.',
                'The rule underneath it all: you know each resident\'s normal, you watch for the change, and you never wait on serious breathing trouble.',
              ].join('\n\n'),
            },
            {
              id: 'copd-s05-normal-callout',
              type: 'callout',
              variant: 'warning',
              title: 'Know each resident\'s normal',
              body: 'The warning is when breathing changes from this resident\'s usual — never wait on serious breathing trouble.',
            },
          ]),
      },
      {
        slug: 's06-causes',
        title: 'Causes',
        sortOrder: 1,
        buildContent: () =>
          doc('Causes', [
            { id: 'copd-s06-heading', type: 'heading', level: 1, text: 'Causes' },
            pendingAudio(
              'copd-s06-audio',
              'What Causes COPD — and What Triggers Flare-Ups?',
              `${ASSET_BASE}/s06-causes-podcast.mp3`,
              [
                'What Causes COPD — and What Triggers Flare-Ups?',
                '',
                'The most common cause of COPD, by far, is long-term smoking. Years of tobacco smoke damage the airways and air sacs in ways that don\'t heal. Many residents with COPD smoked for decades, often long ago. It\'s important for CNAs to approach this without judgment — these residents need care and compassion, not blame, and many quit years before their disease became severe.',
                '',
                'But smoking isn\'t the only cause. Long-term exposure to other lung irritants causes COPD too — things like air pollution, secondhand smoke, dust, fumes, and chemicals, often from a lifetime of certain kinds of work. There\'s also a rare genetic condition that causes COPD in people who never smoked. So while smoking is the leading cause, not every resident with COPD was a smoker.',
                '',
                'For the CNA, what matters even more than the original cause is understanding what triggers flare-ups — because preventing and catching flare-ups is daily, hands-on work.',
                '',
                'Respiratory infections are the biggest trigger. A cold, the flu, or pneumonia can quickly worsen COPD. This is why hand hygiene, keeping sick visitors away, and supporting flu and pneumonia vaccines matter so much for these residents. Air irritants trigger flare-ups too — smoke, strong perfumes and cleaning fumes, dust, and even very cold or very hot air. Strong emotions and over-exertion can bring on breathlessness as well.',
                '',
                'So here\'s the practical message. You can\'t undo the lung damage, but you can powerfully reduce flare-ups: protect residents from infection through good hygiene, keep their air clean and free of irritants, pace their activities, and catch the early signs of a flare-up fast. That\'s prevention you deliver every shift.',
              ].join('\n'),
              `${ASSET_BASE}/s06-causes-podcast.mp3`,
            ),
            {
              id: 'copd-s06-image',
              type: 'image',
              src: '/assets/courses/copd/s06-hero.jpg',
              caption: 'Understanding what worsens COPD.',
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
              id: 'copd-s07-heading',
              type: 'heading',
              level: 1,
              text: 'CNA Role & Best Practices',
            },
            {
              id: 'copd-s07-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of practice',
              body: 'CNAs SUPPORT, OBSERVE, and REPORT. CNAs never give inhalers or change the oxygen flow rate.',
            },
            {
              id: 'copd-s07-image',
              type: 'image',
              src: '/assets/courses/copd/s07-hero.jpg',
              caption: 'The CNA observes breathing and reports — never adjusts oxygen flow.',
            },
            {
              id: 'copd-s07-narration',
              type: 'text',
              body: [
                'Residents with COPD usually have several treatments to help them breathe. Let\'s walk through them — and let\'s begin, as always, with the rule that never bends. A CNA does not give or adjust inhalers or breathing medications, and a CNA never changes an oxygen flow rate. Your job is to support these treatments safely, observe, and report.',
                '**Inhalers and nebulizers.** Most residents with COPD use inhalers — small devices that deliver medication straight into the lungs — or nebulizers, which turn liquid medication into a mist to breathe in. Some open the airways; some reduce inflammation. Your scope: you do not give the inhaler medication itself. Depending on your facility and training, you may help set up equipment or position the resident, but the medication is administered under the nurse\'s responsibility. You report whether treatments seem to help, and any trouble the resident has using them.',
                '**Oxygen — the most important scope point in this course.** Many residents with COPD use oxygen, usually through a nasal cannula, at a flow rate prescribed by the doctor — for example, 2 liters per minute. Here is the rule, and it is absolute: a CNA never changes the oxygen flow rate. Not up, not down. This is critical in COPD, because too much oxygen can actually slow some residents\' breathing to a dangerous degree. If a resident seems short of breath, you do not turn up their oxygen to help — you report to the nurse, who decides. What you DO with oxygen: make sure the tubing isn\'t kinked, the cannula sits correctly in the nose, the resident isn\'t lying on the tubing, and the equipment is working. And you follow oxygen fire safety, which we\'ll cover in prevention.',
                '**Steroids and antibiotics.** During a flare-up, the doctor may order steroid medications to reduce inflammation, or antibiotics if there\'s an infection. You don\'t give these, but you observe and report whether the resident is improving or worsening.',
                'The scope point for this whole section, once more: support the equipment, never the dose. You never give the inhaler, and you never touch the oxygen flow rate. You observe, you support, and you report.',
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
            { id: 'copd-s08-heading', type: 'heading', level: 1, text: 'Prevention & Risk Reduction' },
            {
              id: 'copd-s08-image',
              type: 'image',
              src: '/assets/courses/copd/s08-hero.jpg',
              caption: 'Supporting comfortable breathing and energy conservation.',
            },
            {
              id: 'copd-s08-narration',
              type: 'text',
              body: [
                'CNAs prevent COPD flare-ups and ease daily breathing in real, practical ways. Here are seven.',
                '**One. Protect against infection.** Respiratory infections are the number one trigger of COPD flare-ups. Wash your hands well, keep sick visitors and staff away from these residents, and support their flu and pneumonia vaccines. Good hygiene is breathing protection.',
                '**Two. Position for easier breathing.** Sitting upright or leaning forward onto a pillow or over-bed table gives the lungs room to work. Keep the head of the bed raised. A well-positioned resident simply breathes better — it\'s some of the most direct care you give.',
                '**Three. Pace activities with rest.** Break tasks into steps with rest in between. A shower chair, clothes within reach, an unhurried pace. Let the resident set the speed. You\'re matching effort to what their lungs can handle.',
                '**Four. Keep the air clean.** Remove irritants. No strong perfumes, avoid heavy cleaning fumes near the resident, reduce dust, and keep them away from smoke. Even your own scented products can trigger breathlessness — go light around these residents.',
                '**Five. Follow oxygen fire safety.** Oxygen makes things burn faster and hotter. Keep oxygen far from any flame, heat source, or smoking. Post and respect "oxygen in use" signs. This protects everyone on the unit.',
                '**Six. Coach effective breathing.** Gently remind and coach residents in pursed-lip breathing during breathlessness — in through the nose, out slowly through pursed lips like blowing out a candle. It helps clear trapped air and calms the panic of breathlessness. Your calm voice helps too.',
                '**Seven. Catch flare-ups early.** Know each resident\'s normal breathing, and report the changes the same shift — more breathlessness, more coughing, more or discolored mucus, more fatigue, a new fever. Catching a flare-up early is the single best way to keep a resident out of the hospital.',
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
              id: 'copd-s09-heading',
              type: 'heading',
              level: 1,
              text: 'Scenario & Reporting',
            },
            pendingAudio(
              'copd-s09-intro-audio',
              'Emergency response scenarios intro',
              `${ASSET_BASE}/s09-emergency-intro.mp3`,
              'In COPD, the key judgments are knowing when breathing has worsened enough to report a flare-up, and when it\'s a true respiratory emergency. You\'re about to work through two situations. Read each carefully, choose your action, and you\'ll get feedback right away. And keep one rule front of mind: you never turn up a resident\'s oxygen yourself, no matter how short of breath they are.',
              `${ASSET_BASE}/s09-emergency-intro.mp3`,
            ),
            {
              id: 'copd-s09-image',
              type: 'image',
              src: '/assets/courses/copd/s09-hero.jpg',
              caption: 'Reading breathing distress: when it\'s an emergency, when to report.',
            },
            {
              id: 'copd-s09-scenario-emergency-image',
              type: 'image',
              src: '/assets/courses/copd/s09-scenario-emergency.jpg',
              caption:
                'Gasping, bluish lips, confusion: keep upright, stay, activate emergency help — never turn up the oxygen.',
            },
            {
              id: 'copd-s09-scenario-emergency',
              type: 'scenario_question',
              prompt:
                'You find Mrs. Delacroix, who has severe COPD, gasping and unable to speak more than one word at a time. She\'s leaning forward, struggling, her lips look bluish, and she seems confused and frightened. Her oxygen is running at her prescribed 2 liters. What is the BEST action?',
              options: [
                {
                  id: 'turn-up-oxygen',
                  label: 'Turn her oxygen up to 5 liters to help her breathe',
                  feedback:
                    'This is a respiratory emergency — blue lips and confusion mean dangerously low oxygen. But turning up her oxygen could be harmful in COPD and is never the CNA\'s decision, lying flat makes breathing harder, and leaving wastes critical time. The right action: stay with her, keep her upright, and activate emergency help immediately.',
                },
                {
                  id: 'activate-help',
                  label: 'Stay with her, keep her upright, and activate emergency help immediately',
                  feedback:
                    'Exactly right. Gasping, unable to speak in full sentences, blue lips, and confusion are signs of a severe respiratory emergency. Stay with her, keep her sitting upright and leaning forward to help her breathe, calmly coach pursed-lip breathing if you can, and activate emergency help immediately. And notice what you do NOT do — you never turn up her oxygen, even though she\'s struggling. In COPD, too much oxygen can be dangerous, and adjusting it is the nurse\'s decision. You summon help; you don\'t change the flow.',
                  isRecommended: true,
                },
                {
                  id: 'lie-flat',
                  label: 'Help her lie down flat to rest',
                  feedback:
                    'This is a respiratory emergency — blue lips and confusion mean dangerously low oxygen. But turning up her oxygen could be harmful in COPD and is never the CNA\'s decision, lying flat makes breathing harder, and leaving wastes critical time. The right action: stay with her, keep her upright, and activate emergency help immediately.',
                },
                {
                  id: 'find-nurse',
                  label: 'Leave to find the nurse and come back',
                  feedback:
                    'This is a respiratory emergency — blue lips and confusion mean dangerously low oxygen. But turning up her oxygen could be harmful in COPD and is never the CNA\'s decision, lying flat makes breathing harder, and leaving wastes critical time. The right action: stay with her, keep her upright, and activate emergency help immediately.',
                },
              ],
              requiredForCompletion: true,
            },
            {
              id: 'copd-s09-scenario-flare-up-image',
              type: 'image',
              src: '/assets/courses/copd/s09-scenario-flare-up.jpg',
              caption:
                'More cough and colored mucus but breathing steadily: report the change to the nurse promptly.',
            },
            {
              id: 'copd-s09-scenario-flare-up',
              type: 'scenario_question',
              prompt:
                'Over your shift, you notice Mr. Abdi, who has COPD, is coughing more than usual and seems a little more short of breath getting dressed. When he coughs, the mucus that was clear yesterday is now yellow-green. He\'s talking normally and his lips are a normal color, but this is clearly different from his usual. What SHOULD the CNA do?',
              options: [
                {
                  id: 'wait-tomorrow',
                  label: 'Wait until tomorrow to see if it gets worse',
                  feedback:
                    'These are early flare-up signs — increased cough and breathlessness, and mucus changing color, which often signals infection. Waiting or passing it to the next shift loses the early window when treatment works best. The right action: report the changes to the nurse promptly so the flare-up can be treated before it worsens.',
                },
                {
                  id: 'report-promptly',
                  label: 'Report the changes to the nurse promptly',
                  feedback:
                    'Right. More coughing, more shortness of breath than usual, and mucus changing from clear to yellow-green are classic early signs of a COPD flare-up — often from an infection starting. He\'s not in immediate danger, so this isn\'t a 911 moment, but it can\'t wait. Reporting promptly lets the nurse and doctor treat the flare-up early — often with medication or antibiotics — which can prevent it from becoming the severe emergency you saw in the last scenario.',
                  isRecommended: true,
                },
                {
                  id: 'cough-harder',
                  label: 'Encourage him to cough harder to clear it',
                  feedback:
                    'These are early flare-up signs — increased cough and breathlessness, and mucus changing color, which often signals infection. Waiting or passing it to the next shift loses the early window when treatment works best. The right action: report the changes to the nurse promptly so the flare-up can be treated before it worsens.',
                },
                {
                  id: 'next-shift',
                  label: 'Note it for the next shift to handle',
                  feedback:
                    'These are early flare-up signs — increased cough and breathlessness, and mucus changing color, which often signals infection. Waiting or passing it to the next shift loses the early window when treatment works best. The right action: report the changes to the nurse promptly so the flare-up can be treated before it worsens.',
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
            { id: 'copd-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
              id: 'copd-s10-video',
              type: 'video',
              title: "CNA's Role in Care",
              videoUrl: `${ASSET_BASE}/s10-cna-role.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s10-cna-role.mp4`,
            },
            {
              id: 'copd-s10-image',
              type: 'image',
              src: '/assets/courses/copd/s10-hero.jpg',
              caption: 'Reporting breathing changes accurately to the nurse.',
            },
            {
              id: 'copd-s10-narration',
              type: 'text',
              body: [
                'Your daily role with a resident who has COPD is hands-on breathing care. Let\'s walk through it.',
                '**Position for breathing** Position is direct breathing care. Keep the resident upright, or leaning forward onto a pillow or over-bed table, which gives the lungs the most room. Raise the head of the bed. Never leave a breathless resident lying flat. A simple position change can ease breathing more than almost anything else you do — and it\'s entirely within your scope.',
                '**Support oxygen safely** Support oxygen the right way. Check that the cannula sits correctly in the nose and the tubing isn\'t kinked or pinned under the resident. Make sure the equipment is running and the resident isn\'t tangled. Follow oxygen fire safety. But never, ever change the flow rate — not up, not down. If you think the oxygen isn\'t enough, that\'s a report to the nurse, not an adjustment you make.',
                '**Coach calm breathing** Breathlessness brings panic, and panic makes breathlessness worse — a frightening cycle. You can break it. Stay calm; your calm is contagious. Coach pursed-lip breathing — in through the nose, out slow through pursed lips. Speak gently, reassure them, help them into a good position. Your steady presence is genuine treatment.',
                '**Observe and report** Know each resident\'s normal breathing, and watch for the change. Report flare-up signs promptly — more breathlessness, more cough, more or discolored mucus, more fatigue, fever. Report low oxygen readings. And pace activities to match what their lungs can handle, with rest built in.',
                'Now the boundary. You do not diagnose COPD. You do not give or adjust inhalers, nebulizer medication, or any breathing medication. You never change the oxygen flow rate. And you do not decide a resident\'s breathing is "fine" and skip reporting a change — when breathing changes, the nurse hears about it.',
                'Inside your role — position, support oxygen safely, coach calm breathing, observe and report, pace activities — you directly affect how well this resident breathes, every hour of every shift. There are few more meaningful things a CNA does.',
              ].join('\n\n'),
            },
            {
              id: 'copd-s10-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Stay within scope',
              body: 'You do not diagnose COPD. You do not give or adjust inhalers or change the oxygen flow rate. You do not decide a resident\'s breathing is "fine" and skip reporting a change.',
            },
          ]),
      },
      {
        slug: 's11-case-study',
        title: 'Case Study',
        sortOrder: 2,
        buildContent: () => {
          const caseNarrative = [
            'Mr. Castellano, 76, has had COPD for years. He uses oxygen at 2 liters and inhalers managed by the nursing staff. His CNA, Priya, knew his breathing well — his usual morning cough, his slight wheeze, how he got winded dressing but recovered with a rest.',
            '',
            '**The early sign (Monday):** While helping Mr. Castellano dress, Priya noticed he was more winded than usual and needed two rest breaks instead of one. When he coughed, the mucus looked thicker and slightly yellow — different from his usual clear. He waved it off: "Just a rough morning." Priya didn\'t wave it off. She knew his normal, and this was a change. She reported it to the nurse right away: "More short of breath than usual dressing, two rest breaks, and his mucus is thicker and turning yellow." The nurse assessed him and started watching closely.',
            '',
            '**The progression caught early (Tuesday):** By Tuesday the mucus was yellow-green and he had a low fever. Because Priya\'s Monday report had the team already watching, the nurse reached the doctor early. The doctor diagnosed a COPD flare-up from a developing chest infection and started antibiotics and a steroid that same day — while Mr. Castellano was still talking normally and only mildly more short of breath.',
            '',
            '**What Priya kept doing:** Throughout, Priya positioned him upright to breathe easier, paced his care with extra rest, coached pursed-lip breathing when he got anxious, kept his oxygen tubing clear — and never once adjusted the flow rate, even when he said he felt short of breath. She reported each day how his breathing compared to his normal.',
            '',
            '**The outcome:** Treated early, Mr. Castellano\'s flare-up resolved over several days without a hospital stay. The nurse told Priya plainly: "You caught this on Monday. If we\'d waited until he was really struggling, he\'d have ended up in the ER — or worse."',
            '',
            '**Discussion:** The whole save started with one observation: mucus changing from clear to yellow, and a little more breathlessness than usual. Priya knew Mr. Castellano\'s normal, noticed the change, and reported it promptly instead of accepting "just a rough morning." She supported his breathing all the way through and never crossed her scope by touching the oxygen. Early recognition, faithful daily care, and scope discipline — that\'s the whole CNA role in COPD, done right.',
          ].join('\n');

          return doc('Case Study', [
            { id: 'copd-s11-heading', type: 'heading', level: 1, text: 'Brief Case Study' },
            pendingAudio(
              'copd-s11-audio',
              'The Mucus That Changed Color',
              `${ASSET_BASE}/s11-case-podcast.mp3`,
              caseNarrative,
              `${ASSET_BASE}/s11-case-podcast.mp3`,
            ),
            {
              id: 'copd-s11-image',
              type: 'image',
              src: '/assets/courses/copd/s11-hero.jpg',
              caption: 'A breathing concern handled correctly — position, observe, report.',
            },
            {
              id: 'copd-s11-case-study',
              type: 'case_study',
              title: 'The Mucus That Changed Color',
              residentProfile:
                'Mr. Castellano, 76, has had COPD for years. He uses oxygen at 2 liters and inhalers managed by the nursing staff. His CNA, Priya, knew his breathing well — his usual morning cough, his slight wheeze, how he got winded dressing but recovered with a rest.',
              scenario: [
                '**The early sign (Monday):** While helping Mr. Castellano dress, Priya noticed he was more winded than usual and needed two rest breaks instead of one. When he coughed, the mucus looked thicker and slightly yellow — different from his usual clear. He waved it off: "Just a rough morning." Priya didn\'t wave it off. She knew his normal, and this was a change. She reported it to the nurse right away: "More short of breath than usual dressing, two rest breaks, and his mucus is thicker and turning yellow." The nurse assessed him and started watching closely.',
                '**The progression caught early (Tuesday):** By Tuesday the mucus was yellow-green and he had a low fever. Because Priya\'s Monday report had the team already watching, the nurse reached the doctor early. The doctor diagnosed a COPD flare-up from a developing chest infection and started antibiotics and a steroid that same day — while Mr. Castellano was still talking normally and only mildly more short of breath.',
                '**What Priya kept doing:** Throughout, Priya positioned him upright to breathe easier, paced his care with extra rest, coached pursed-lip breathing when he got anxious, kept his oxygen tubing clear — and never once adjusted the flow rate, even when he said he felt short of breath. She reported each day how his breathing compared to his normal.',
                '**The outcome:** Treated early, Mr. Castellano\'s flare-up resolved over several days without a hospital stay. The nurse told Priya plainly: "You caught this on Monday. If we\'d waited until he was really struggling, he\'d have ended up in the ER — or worse."',
                '**Discussion:** The whole save started with one observation: mucus changing from clear to yellow, and a little more breathlessness than usual. Priya knew Mr. Castellano\'s normal, noticed the change, and reported it promptly instead of accepting "just a rough morning." She supported his breathing all the way through and never crossed her scope by touching the oxygen. Early recognition, faithful daily care, and scope discipline — that\'s the whole CNA role in COPD, done right.',
              ].join('\n\n'),
            },
            {
              id: 'copd-s11-reflection-1',
              type: 'reflection',
              prompt:
                'Priya reported the change on Monday even though Mr. Castellano said he was fine and his lips were a normal color. Why was knowing his "normal" and reporting the change so important?',
              minCharacters: 50,
            },
            {
              id: 'copd-s11-reflection-2',
              type: 'reflection',
              prompt:
                'Several times Mr. Castellano said he felt short of breath, but Priya never turned up his oxygen. Why is changing the oxygen flow rate never the CNA\'s decision — and especially risky in COPD?',
              minCharacters: 50,
            },
            {
              id: 'copd-s11-reflection-intro-text',
              type: 'text',
              body: 'Reflect on the case study in the previous lesson. Your written responses help you apply what you learned about early recognition, faithful daily care, and scope discipline in COPD.',
            },
            {
              id: 'copd-s11-kc2-check',
              type: 'knowledge_check',
              question:
                'Here is the rule, and it is absolute: a CNA never changes the oxygen flow rate. Not up, not down. This is critical in COPD, because too much oxygen can actually slow some residents\' breathing to a dangerous degree. If a resident seems short of breath, you do not turn up their oxygen to help — you report to the nurse, who decides. When a resident seems short of breath, the CNA SHOULD:',
              options: [
                {
                  id: 'turn-up-oxygen',
                  label: 'Turn up the oxygen flow rate to help them breathe',
                },
                {
                  id: 'report-nurse',
                  label: 'Report to the nurse and never change the oxygen flow rate',
                },
                { id: 'lie-flat', label: 'Lay the resident flat to rest' },
                { id: 'turn-off', label: 'Turn the oxygen off to reset it' },
              ],
              correctOptionId: 'report-nurse',
              explanation:
                'If a resident seems short of breath, you do not turn up their oxygen to help — you report to the nurse, who decides.',
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
            { id: 'copd-s12-heading', type: 'heading', level: 1, text: 'Conclusion' },
            {
              id: 'copd-s12-video',
              type: 'video',
              title: 'Conclusion',
              videoUrl: `${ASSET_BASE}/s12-conclusion.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s12-conclusion.mp4`,
            },
            {
              id: 'copd-s12-image',
              type: 'image',
              src: '/assets/courses/copd/s12-hero.jpg',
              caption: 'Observe, position for comfort, report — never adjust oxygen.',
            },
            {
              id: 'copd-s12-narration',
              type: 'text',
              body: [
                'You\'ve reached the end. Let\'s lock in the five things that matter most for COPD.',
                '**One.** COPD is a long-term lung disease that makes breathing hard work — narrowed airways and damaged air sacs trap stale air. For these residents, even small activities can bring breathlessness. That\'s the lungs failing to keep up, never weakness or laziness.',
                '**Two.** Position and pacing are direct breathing care. Keep residents upright or leaning forward, raise the head of the bed, never leave a breathless resident lying flat, and pace activities with rest. How you position a resident genuinely changes how well they breathe.',
                '**Three.** Know each resident\'s normal, and catch flare-ups early. Report changes the same shift — more breathlessness, more coughing, more or discolored mucus, more fatigue, a new fever. Early reporting prevents hospital stays.',
                '**Four.** Know the emergency. Severe breathlessness where the resident can\'t speak in sentences, blue or gray lips, new confusion or restlessness — these are respiratory emergencies. Stay with the resident, keep them upright, and activate help immediately.',
                '**Five.** Honor your scope — and the oxygen rule above all. You never give or adjust inhalers, and you never change the oxygen flow rate, not even when a resident is short of breath. In COPD, too much oxygen can be dangerous. You support the equipment, coach calm breathing, observe, and report. The nurse adjusts.',
              ].join('\n\n'),
            },
            {
              id: 'copd-s12-summary',
              type: 'summary',
              title: 'Five things that matter most',
              items: [
                'COPD makes breathing hard work — even small activities can bring breathlessness.',
                'Position and pacing are direct breathing care — upright or leaning forward, never flat.',
                'Know each resident\'s normal, and catch flare-ups early — report changes the same shift.',
                'Know the emergency — severe breathlessness, blue lips, confusion; activate help immediately.',
                'Honor your scope — never give inhalers or change the oxygen flow rate; the nurse adjusts.',
              ],
            },
            {
              id: 'copd-s12-what-happens-next-text',
              type: 'text',
              body: 'Ten questions are waiting. Everything on them was covered here. You\'re ready. Trust what you\'ve learned, and show what you know.',
            },
            {
              id: 'copd-s12-completion-requirements-text',
              type: 'text',
              body: 'This course provides one hour of continuing education credit through CAL ACE Nursing Academy, an approved CDPH continuing education provider, NAC number 7384. Your certificate is generated automatically when you pass the knowledge check.',
            },
            {
              id: 'copd-s12-completion-requirements-callout',
              type: 'callout',
              variant: 'info',
              title: 'Scope reminder',
              body: 'CNAs support, observe, and report. CNAs do not diagnose COPD, give or adjust inhalers, or change oxygen flow rates.',
            },
            {
              id: 'copd-s12-certificate-access-text',
              type: 'text',
              body: 'Your certificate is generated automatically when you pass the knowledge check. CDPH-Approved CE Provider — NAC #7384.',
            },
          ]),
      },
    ],
  },
];

export async function seedCourse17Copd(
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
  console.log(`Seeding Course 17 (COPD) as DRAFT — slug "${COURSE_SLUG}"…`);

  try {
    const result = await seedCourse17Copd(prisma);
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
