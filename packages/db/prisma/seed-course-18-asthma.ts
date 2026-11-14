/**
 * Seed Course 18 — Asthma and Breathing Emergencies: The CNA's Role (DRAFT).
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-18-asthma
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
const COURSE_SLUG = 'asthma';
const COURSE_TITLE = 'Asthma Flare-Ups and Respiratory Distress Response';
const COURSE_SUMMARY =
  'Learn to recognize asthma symptoms and attacks, reduce triggers, support the care plan, and respond to breathing emergencies — within CNA scope. CNAs do not diagnose asthma or give or adjust inhalers/medications.';

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
    'Explain what asthma is, in plain language',
    'Recognize the signs of an asthma attack and a breathing emergency',
    'Identify and reduce common triggers',
    'Respond correctly when an attack begins',
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
  heroImage: '/assets/courses/asthma/hero-banner.png',
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
    title: 'Understanding Asthma',
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: 'Introduction',
        sortOrder: 0,
        buildContent: () =>
          doc('Introduction', [
            { id: 'asthma-s01-heading', type: 'heading', level: 1, text: 'Introduction' },
            {
              id: 'asthma-s01-video',
              type: 'video',
              title: 'Introduction',
              videoUrl: `${ASSET_BASE}/s01-intro.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s01-intro.mp4`,
            },
            {
              id: 'asthma-s01-image',
              type: 'image',
              src: '/assets/courses/asthma/s01-hero.jpg',
              caption: 'A CAL ACE CNA supporting a resident who lives with asthma.',
            },
            {
              id: 'asthma-s01-narration',
              type: 'text',
              body: [
                'Welcome to CAL ACE Nursing Academy.',
                'This course is about asthma — and the breathing emergencies it can cause.',
                'Asthma is a long-term condition where the airways become inflamed and easily irritated. When something triggers them, the airways tighten, swell, and fill with mucus — and suddenly air can\'t move freely. This is an asthma attack. It can come on quickly, and at its worst, it can be life-threatening.',
                'Many people think of asthma as a childhood condition. But asthma affects older adults too, and in long-term care it can be especially dangerous. Older residents may have weaker breathing reserves, other lung or heart conditions, and a harder time describing what they feel. An asthma attack in an older resident is something to take very seriously.',
                'Here\'s what makes the CNA so important in asthma care. Asthma attacks are often triggered by things in the environment — dust, smoke, strong scents, cold air, stress. Many of those triggers are things a CNA can recognize and reduce. And when an attack begins, the CNA is very often the first person there. How fast you recognize it, how calmly you respond, and how quickly you get help can change everything.',
                'There\'s also a piece you must get exactly right: the rescue inhaler. Many residents with asthma have one — a quick-relief inhaler for attacks. You\'ll learn the firm scope boundary around it: a CNA does not decide when to give it or administer the medication. When an attack happens, you call the nurse immediately.',
                'Your scope is clear. A CNA recognizes asthma symptoms and attacks, reduces triggers, supports the care plan, and responds fast to a breathing emergency. A CNA does not diagnose asthma, does not give or adjust inhalers or medications, and does not decide when rescue medication is used.',
                'There is a ten-question knowledge check at the end. Everything on it is covered here. Let\'s begin.',
              ].join('\n\n'),
            },
            {
              id: 'asthma-s01-course-information-text',
              type: 'text',
              body: [
                'This course teaches the CNA\'s role in recognizing asthma symptoms and attacks, supporting the care plan, identifying and reducing triggers, and responding to a breathing emergency.',
                'Let\'s be clear about your role. A CNA recognizes asthma symptoms and attacks, reduces triggers, supports the care plan, and responds fast to a breathing emergency. A CNA does not diagnose asthma, does not give or adjust inhalers or medications, and does not decide when rescue medication is used. Those are nursing and physician tasks. But none of them can happen without your early recognition and fast response first.',
              ].join('\n\n'),
            },
            {
              id: 'asthma-s01-course-information-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of this course',
              body: 'CNAs RECOGNIZE, REDUCE TRIGGERS, and RESPOND FAST. CNAs do not diagnose asthma, give or adjust inhalers/medications, or decide when a rescue inhaler is used.',
            },
            {
              id: 'asthma-s01-learning-objectives-text',
              type: 'text',
              body: 'By the end of this course, you will be able to:',
            },
            {
              id: 'asthma-s01-learning-objectives-summary',
              type: 'summary',
              title: 'Learning objectives',
              items: [
                'Explain what asthma is, in plain language.',
                'Recognize the signs of an asthma attack and a breathing emergency.',
                'Identify and reduce common triggers.',
                'Respond correctly when an attack begins.',
                'Know your scope — what a CNA does, and what a CNA must never do.',
              ],
            },
            {
              id: 'asthma-s01-instructor-intro-text',
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
            { id: 'asthma-s02-heading', type: 'heading', level: 1, text: 'Terms & Definitions' },
            {
              id: 'asthma-s02-image',
              type: 'image',
              src: '/assets/courses/asthma/s02-hero.jpg',
              caption: 'The language of asthma — triggers, wheezing, rescue vs. controller inhalers.',
            },
            {
              id: 'asthma-s02-reveal-asthma',
              type: 'reveal_card',
              frontTitle: 'Asthma',
              frontBody: 'AZ-mah',
              backTitle: 'Asthma',
              backBody:
                'A long-term condition where the airways are inflamed and overly sensitive. When triggered, they tighten and swell, making it hard to breathe. Between attacks, a person may breathe normally — which is what makes asthma different from some other lung diseases.',
            },
            {
              id: 'asthma-s02-reveal-airways',
              type: 'reveal_card',
              frontTitle: 'Airways (Bronchial Tubes)',
              frontBody: 'BRON-kee-al',
              backTitle: 'Airways (Bronchial Tubes)',
              backBody:
                'The branching tubes that carry air into the lungs. In asthma, the muscles around these tubes tighten and the lining swells, narrowing the path air travels.',
            },
            {
              id: 'asthma-s02-reveal-attack',
              type: 'reveal_card',
              frontTitle: 'Asthma Attack',
              frontBody: 'Asthma attack / flare-up',
              backTitle: 'Asthma Attack',
              backBody:
                'A sudden worsening of asthma symptoms when the airways narrow. Breathing becomes hard, often with wheezing, coughing, chest tightness, and shortness of breath. An attack can be mild — or a life-threatening emergency.',
            },
            {
              id: 'asthma-s02-reveal-trigger',
              type: 'reveal_card',
              frontTitle: 'Trigger',
              frontBody: 'Trigger',
              backTitle: 'Trigger',
              backBody:
                'Something that sets off an asthma attack. Common triggers include dust, smoke, strong perfumes, cleaning fumes, pollen, cold air, respiratory infections, and stress. A big part of the CNA\'s role is recognizing and reducing triggers.',
            },
            {
              id: 'asthma-s02-reveal-wheezing',
              type: 'reveal_card',
              frontTitle: 'Wheezing',
              frontBody: 'Wheezing',
              backTitle: 'Wheezing',
              backBody:
                'A high-pitched whistling sound when breathing, especially breathing out. It happens when air squeezes through narrowed airways. Wheezing is a key sign of an asthma attack — but in a severe attack, wheezing may actually stop because almost no air is moving. That silence is a danger sign.',
            },
            {
              id: 'asthma-s02-reveal-rescue',
              type: 'reveal_card',
              frontTitle: 'Rescue Inhaler (Bronchodilator)',
              frontBody: 'Bron-ko-DY-lay-ter',
              backTitle: 'Rescue Inhaler (Bronchodilator)',
              backBody:
                'A quick-relief inhaler that rapidly relaxes and opens the airways during an attack. Many residents with asthma have one. Remember — a CNA does not decide when to give it or administer it. The CNA calls the nurse.',
            },
            {
              id: 'asthma-s02-reveal-controller',
              type: 'reveal_card',
              frontTitle: 'Controller Medication',
              frontBody: 'Controller medication',
              backTitle: 'Controller Medication',
              backBody:
                'A daily medication, often an inhaler, that reduces airway inflammation over time to prevent attacks. Unlike a rescue inhaler, it\'s taken every day, not during an attack. It only works when used consistently.',
            },
            {
              id: 'asthma-s02-reveal-distress',
              type: 'reveal_card',
              frontTitle: 'Respiratory Distress',
              frontBody: 'Respiratory distress',
              backTitle: 'Respiratory Distress',
              backBody:
                'When a person is struggling to breathe and not getting enough air. Signs include gasping, rapid breathing, inability to speak in full sentences, bluish lips, and confusion. Respiratory distress is an emergency.',
            },
            {
              id: 'asthma-s02-kc1-check-trigger',
              type: 'knowledge_check',
              question: 'Match the term: something that sets off an asthma attack',
              options: [
                { id: 'trigger', label: 'Trigger' },
                { id: 'wheezing', label: 'Wheezing' },
                { id: 'rescue-inhaler', label: 'Rescue inhaler' },
              ],
              correctOptionId: 'trigger',
              explanation:
                'Trigger. Something that sets off an asthma attack. Common triggers include dust, smoke, strong perfumes, cleaning fumes, pollen, cold air, respiratory infections, and stress.',
              requiredForCompletion: true,
            },
            {
              id: 'asthma-s02-kc1-check-wheezing',
              type: 'knowledge_check',
              question: 'Match the term: whistling sound from air through narrowed airways',
              options: [
                { id: 'trigger', label: 'Trigger' },
                { id: 'wheezing', label: 'Wheezing' },
                { id: 'rescue-inhaler', label: 'Rescue inhaler' },
              ],
              correctOptionId: 'wheezing',
              explanation:
                'Wheezing. A high-pitched whistling sound when breathing, especially breathing out. It happens when air squeezes through narrowed airways.',
              requiredForCompletion: true,
            },
            {
              id: 'asthma-s02-kc1-check-rescue',
              type: 'knowledge_check',
              question:
                'Match the term: quick-relief inhaler that opens the airways during an attack',
              options: [
                { id: 'trigger', label: 'Trigger' },
                { id: 'wheezing', label: 'Wheezing' },
                { id: 'rescue-inhaler', label: 'Rescue inhaler' },
              ],
              correctOptionId: 'rescue-inhaler',
              explanation:
                'Rescue inhaler. A quick-relief inhaler that rapidly relaxes and opens the airways during an attack. Remember — a CNA does not decide when to give it or administer it.',
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
            { id: 'asthma-s03-heading', type: 'heading', level: 1, text: 'Statistics' },
            pendingAudio(
              'asthma-s03-audio',
              'Asthma in Older Adults: More Serious Than People Think',
              `${ASSET_BASE}/s03-stats-podcast.mp3`,
              [
                'Asthma in Older Adults: More Serious Than People Think',
                '',
                'Asthma affects about 25 million people in the United States — and while many think of it as a childhood condition, more than 2 million of those are adults over 65. Asthma does not disappear with age, and for older adults it can be especially dangerous.',
                '',
                'Here is why asthma is more serious in the long-term care population. Older adults often have less breathing reserve to begin with, and many have other conditions — heart disease, COPD, weakened immune systems — that make an asthma attack harder to recover from. They may also have a harder time recognizing or describing their symptoms, and asthma in older adults is sometimes under-recognized and under-treated. The result is that asthma attacks in older adults are more likely to require hospitalization and are more likely to be fatal than in younger people.',
                '',
                'Most asthma deaths are considered preventable. They happen when an attack isn\'t recognized early, when triggers aren\'t controlled, or when help comes too slowly. This is exactly where CNAs make a difference. Many asthma attacks are set off by triggers in the environment — dust, smoke, strong scents, cold air, respiratory infections. A CNA who keeps a resident\'s environment clean and trigger-free prevents attacks before they start. And when an attack does begin, a CNA who recognizes it fast, stays calm, and gets help immediately can be the reason it doesn\'t become a tragedy.',
                '',
                'There\'s also a daily management story. When residents take their controller medications consistently and avoid their triggers, asthma can be well-controlled and attacks become rare. CNAs support that daily control through the environment they maintain and the observations they report.',
                '',
                'The bottom line: asthma in older adults is common and dangerous, most bad outcomes are preventable, and the CNA\'s trigger control and fast recognition are central to keeping residents safe.',
              ].join('\n'),
              `${ASSET_BASE}/s03-stats-podcast.mp3`,
            ),
            {
              id: 'asthma-s03-image',
              type: 'image',
              src: '/assets/courses/asthma/s03-hero.jpg',
              caption: 'Asthma is common and manageable — careful observation matters.',
            },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: 'Fundamentals',
        sortOrder: 3,
        buildContent: () =>
          doc('Fundamentals', [
            { id: 'asthma-s04-heading', type: 'heading', level: 1, text: 'Fundamentals' },
            {
              id: 'asthma-s04-video',
              type: 'video',
              title: 'Fundamentals',
              videoUrl: `${ASSET_BASE}/s04-fundamentals.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s04-fundamentals.mp4`,
            },
            {
              id: 'asthma-s04-image',
              type: 'image',
              src: '/assets/courses/asthma/s04-hero.jpg',
              caption: 'Understanding how airways tighten during an asthma attack.',
            },
            {
              id: 'asthma-s04-narration',
              type: 'text',
              body: [
                '**Sensitive, twitchy airways**',
                'In asthma, the airways are chronically inflamed and overly sensitive. Think of them as twitchy — quick to react. Most of the time they may work fine, but when something irritates them, they overreact. This is what sets asthma apart: it comes in attacks, with normal breathing in between.',
                '**What happens during an attack**',
                'When a trigger hits, three things happen to the airways, all at once. The muscles around them tighten and squeeze — this is called bronchospasm. The lining swells with inflammation. And extra mucus is produced. Together, these narrow the airway dramatically, and air struggles to get through.',
                '**Why breathing out is hard**',
                'During an attack, breathing out becomes especially difficult. Air gets trapped behind the narrowed airways. This trapped air is what causes the wheezing — that whistling sound as air squeezes out through the tight passages. The resident may work hard just to push air out.',
                '**Attacks can build slowly or fast**',
                'Some asthma attacks build over hours, with worsening cough and tightness. Others come on suddenly and severely within minutes. Both are serious. An attack that\'s getting worse despite rest, or one that\'s severe from the start, is an emergency. You never assume an attack will simply pass on its own.',
                '**The danger of the "silent chest"**',
                'Here\'s something vital. Wheezing means air is still moving, even if narrowly. But in a very severe attack, the airways can close so much that wheezing actually stops — because almost no air is moving at all. A quiet chest in a struggling resident is not improvement. It\'s a danger sign that means the attack is severe. Never mistake silence for relief.',
                '**Triggers are the key**',
                'Because asthma is set off by triggers, controlling the environment is powerful medicine. Remove dust, smoke, strong scents, and other irritants, and many attacks simply never happen. This is why a CNA\'s attention to the resident\'s environment matters so much — you\'re preventing attacks before they start.',
                '**Asthma is controllable**',
                'The good news: asthma is one of the most controllable lung conditions. With daily controller medication, trigger avoidance, and a clear plan for attacks, most residents can live with very few problems. Your daily care — keeping the environment clean and recognizing trouble early — is a big part of that control.',
              ].join('\n\n'),
            },
            {
              id: 'asthma-s04-silent-callout',
              type: 'callout',
              variant: 'warning',
              title: 'Silence is NOT relief',
              body: 'In a very severe attack, wheezing may stop because almost no air is moving. A quiet chest in a struggling resident is a danger sign — never mistake silence for improvement.',
            },
          ]),
      },
    ],
  },
  {
    slug: 'module-2',
    title: 'Recognition, Response, and CNA Role',
    sortOrder: 1,
    lessons: [
      {
        slug: 's05-signs',
        title: 'Signs & Symptoms',
        sortOrder: 0,
        buildContent: () =>
          doc('Signs & Symptoms', [
            { id: 'asthma-s05-heading', type: 'heading', level: 1, text: 'Signs & Symptoms' },
            {
              id: 'asthma-s05-image',
              type: 'image',
              src: '/assets/courses/asthma/s05-hero.jpg',
              caption: 'Recognizing the breathing changes that signal an attack.',
            },
            {
              id: 'asthma-s05-narration',
              type: 'text',
              body: [
                '**Early and mild signs**',
                'An asthma attack often starts with warning signs. Coughing, especially a dry cough. A feeling of chest tightness. Mild shortness of breath. Some wheezing — that whistling sound when breathing out. The resident may seem a little anxious. Caught here, early, an attack is most easily treated — so these early signs get reported promptly.',
                '**A worsening, moderate attack**',
                'As an attack worsens, the signs grow. More obvious wheezing. Faster, harder breathing. Shortness of breath that makes it hard to talk in full sentences. The resident may sit upright, lean forward, and use their shoulder and neck muscles to help pull in air. They often look anxious or frightened. This is an attack that needs help now — call the nurse and stay with the resident.',
                '**The severe emergency**',
                'A severe attack is a true emergency. The resident gasps for air and can speak only a word or two, if at all. Their lips, face, or fingertips may turn blue or gray. They may become confused, drowsy, or agitated as oxygen drops. And remember the silent chest — if the wheezing fades while the resident is clearly still struggling, that is not improvement; it means dangerously little air is moving. Any of these signs means activate emergency help immediately.',
                '**Your calm presence**',
                'One more thing that\'s a true symptom and a true treatment together: panic. Breathlessness is terrifying, and panic tightens the chest further, making the attack worse. Your calm, steady presence — staying with the resident, speaking gently, helping them sit upright — genuinely helps. You can\'t give the medication, but your calm is real care while help is on the way.',
                '**Summary**',
                'Two pictures. A mild-to-moderate attack: coughing, wheezing, chest tightness, harder breathing, trouble talking — report it and get help. A severe emergency: gasping, can\'t speak, blue lips, confusion, or a silent chest in a struggling resident — activate emergency help immediately.',
                'And the rule underneath it all: asthma attacks can worsen fast, so you never "wait and watch" a struggling resident. You get help.',
              ].join('\n\n'),
            },
            {
              id: 'asthma-s05-emergency-callout',
              type: 'callout',
              variant: 'warning',
              title: 'Never wait and watch',
              body: 'Asthma attacks can worsen fast. You never "wait and watch" a struggling resident — you get help.',
            },
          ]),
      },
      {
        slug: 's06-causes',
        title: 'Causes',
        sortOrder: 1,
        buildContent: () =>
          doc('Causes', [
            { id: 'asthma-s06-heading', type: 'heading', level: 1, text: 'Causes' },
            pendingAudio(
              'asthma-s06-audio',
              'What Causes Asthma — and What Triggers Attacks?',
              `${ASSET_BASE}/s06-causes-podcast.mp3`,
              [
                'What Causes Asthma — and What Triggers Attacks?',
                '',
                'Asthma itself comes from a combination of genetics and environment. People with asthma have airways that are naturally more sensitive and prone to inflammation. This tendency often runs in families, and it can be linked to allergies. Some people have asthma their whole lives; others develop it later in adulthood, sometimes after a respiratory infection or long exposure to lung irritants.',
                '',
                'But for the CNA, the most useful thing to understand is not the original cause — it\'s the triggers, because triggers are what a CNA can actually control.',
                '',
                'The most common triggers fall into a few groups. Irritants in the air: dust, smoke of any kind, strong perfumes and scented products, cleaning fumes, and air fresheners. Allergens: pollen, mold, dust mites, and animal dander. Respiratory infections: a cold, the flu, or a sinus infection can set off asthma and make it worse. Weather: cold air, dry air, or sudden weather changes. Physical exertion can trigger some people. And strong emotions or stress can bring on or worsen an attack.',
                '',
                'Here is what makes this so important. A huge number of these triggers are things present in a care facility — and many are things a CNA directly controls. The perfume you wear. The cleaning products used near a resident. How much dust collects in their room. Whether sick visitors come close. Whether the resident gets chilled. By being aware of triggers, a CNA can prevent a large share of attacks before they ever begin.',
                '',
                'Each resident\'s triggers can be different, and known triggers are usually listed in the care plan. So the practical message is this: learn each resident\'s specific triggers, keep their environment clean and irritant-free, protect them from infection and chilling, and you become a powerful force for preventing asthma attacks.',
              ].join('\n'),
              `${ASSET_BASE}/s06-causes-podcast.mp3`,
            ),
            {
              id: 'asthma-s06-image',
              type: 'image',
              src: '/assets/courses/asthma/s06-hero.jpg',
              caption: 'Understanding what triggers asthma attacks.',
            },
          ]),
      },
      {
        slug: 's07-role',
        title: 'CNA Role & Best Practices',
        sortOrder: 2,
        buildContent: () =>
          doc('CNA Role & Best Practices', [
            { id: 'asthma-s07-heading', type: 'heading', level: 1, text: 'CNA Role & Best Practices' },
            {
              id: 'asthma-s07-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of practice',
              body: 'CNAs SUPPORT, OBSERVE, and REPORT. CNAs never give inhalers or decide when rescue medication is used.',
            },
            {
              id: 'asthma-s07-image',
              type: 'image',
              src: '/assets/courses/asthma/s07-hero.jpg',
              caption:
                'The CNA observes and reports, helps the resident stay calm and upright — and calls for help.',
            },
            {
              id: 'asthma-s07-narration',
              type: 'text',
              body: [
                'Asthma treatment centers on two kinds of inhalers, and understanding the difference helps you support residents well. Let\'s walk through them — and let\'s begin, as always, with the rule that never bends. A CNA does not give or administer inhaler medication, and a CNA does not decide when a rescue inhaler is used. When an attack happens, you call the nurse immediately.',
                '**Controller inhalers — the daily preventers.** These contain medications, often steroids, that reduce airway inflammation over time. They\'re taken every day, whether the resident feels symptoms or not, to prevent attacks. They don\'t help during an attack — they work slowly, in the background. Your role: support the daily routine and report to the nurse if doses are missed, because skipped controller medication leads to more attacks.',
                '**Rescue inhalers — the quick relievers.** Also called bronchodilators, these rapidly open the airways during an attack. This is the emergency inhaler. Here is your scope, stated plainly: when a resident is having an attack, you do not decide to give the rescue inhaler, and you do not administer it yourself. You call the nurse immediately — the nurse responds and manages the medication. Even though the resident is clearly struggling, even though the inhaler is right there, even if the resident has used it before — the CNA\'s action is to get the nurse, fast, and to stay with the resident.',
                '**Nebulizers.** Some residents take rescue or controller medication as a mist through a nebulizer machine. As with inhalers, you may help with positioning or equipment depending on your training, but the medication itself is the nurse\'s responsibility.',
                '**Oxygen.** During a severe attack, the nurse may provide oxygen. As always, you support the equipment but never set or change the flow rate.',
                'The scope point for this whole section, once more: you support the daily routine, you keep the environment trigger-free, and when an attack hits, you call the nurse immediately — you never make the call to give the rescue inhaler yourself. Your fast call is what gets the resident the right help.',
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
            { id: 'asthma-s08-heading', type: 'heading', level: 1, text: 'Prevention & Risk Reduction' },
            {
              id: 'asthma-s08-image',
              type: 'image',
              src: '/assets/courses/asthma/s08-hero.jpg',
              caption: 'Reducing triggers and supporting a calm environment.',
            },
            {
              id: 'asthma-s08-narration',
              type: 'text',
              body: [
                'With asthma, prevention is largely about controlling triggers — and that\'s work a CNA does every shift. Here are seven ways.',
                '**One. Learn each resident\'s triggers.** Known triggers are usually in the care plan. One resident reacts to dust, another to cold air, another to scents. Knowing each resident\'s specific triggers lets you protect them precisely.',
                '**Two. Keep your own scents light.** Strong perfume, scented lotion, or heavily scented laundry on your uniform can trigger an attack. Around residents with asthma, go fragrance-free or very light. It\'s a simple change that prevents real attacks.',
                '**Three. Control dust and irritants.** Keep the resident\'s room clean and as dust-free as possible. Avoid using strong cleaning sprays or air fresheners near them. Good ventilation and a clean environment are direct asthma prevention.',
                '**Four. Protect against respiratory infections.** Colds and flu trigger asthma and make it worse. Wash your hands, keep sick visitors and staff away, and support flu and pneumonia vaccines. Infection control is asthma control.',
                '**Five. Guard against cold air and weather changes.** For residents triggered by cold air, keep them warm, cover the nose and mouth with a scarf when going outside in the cold, and watch them on sudden weather changes.',
                '**Six. Support the daily controller routine.** Controller inhalers only prevent attacks when used every day. Support the routine and report missed doses to the nurse. Consistent daily prevention means far fewer attacks.',
                '**Seven. Keep calm and reduce stress.** Stress and strong emotion can trigger attacks. A calm, unhurried, reassuring approach genuinely helps. And if a resident starts to become anxious or short of breath, your steady presence early can keep a small problem from growing.',
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
            { id: 'asthma-s09-heading', type: 'heading', level: 1, text: 'Scenario & Reporting' },
            pendingAudio(
              'asthma-s09-intro-audio',
              'Emergency response scenarios intro',
              `${ASSET_BASE}/s09-emergency-intro.mp3`,
              'With asthma, attacks can worsen fast, so knowing when to call the nurse and when to activate emergency help is critical. You\'re about to work through two situations. Read each carefully, choose your action, and you\'ll get feedback right away. And keep the scope rule front of mind: when an attack happens, you call the nurse — you never decide to give the rescue inhaler yourself.',
              `${ASSET_BASE}/s09-emergency-intro.mp3`,
            ),
            {
              id: 'asthma-s09-image',
              type: 'image',
              src: '/assets/courses/asthma/s09-hero.jpg',
              caption: 'Reading an asthma attack: when it\'s an emergency, when to call the nurse.',
            },
            {
              id: 'asthma-s09-scenario-emergency-image',
              type: 'image',
              src: '/assets/courses/asthma/s09-scenario-emergency.jpg',
              caption:
                'Gasping, one-word speech, blue lips, the wheeze going quiet: keep upright, stay, activate emergency help immediately.',
            },
            {
              id: 'asthma-s09-scenario-emergency',
              type: 'scenario_question',
              prompt:
                'Mrs. Petrov, who has asthma, is in serious trouble. She\'s gasping, can only get out one word at a time, and is leaning forward gripping the chair. Her lips look bluish and she seems confused. You notice her wheezing, which was loud a minute ago, has gotten quieter even though she\'s clearly struggling harder. What is the BEST action?',
              options: [
                {
                  id: 'wait-improvement',
                  label: 'Wait to see if the quieter wheezing means she\'s getting better',
                  feedback:
                    'This is a severe emergency — and the quieting wheeze is the "silent chest," a danger sign, not improvement. Waiting, laying her flat, or deciding on your own to give the inhaler are all wrong. The right action: stay with her, keep her upright, and activate emergency help immediately while the nurse manages the medication.',
                },
                {
                  id: 'activate-now',
                  label: 'Stay with her, keep her upright, and activate emergency help immediately',
                  feedback:
                    'Exactly right. This is a severe, life-threatening attack. Gasping, one-word speech, blue lips, and confusion are emergency signs — and the quieting wheeze in a struggling resident is the dangerous "silent chest," meaning almost no air is moving. That is not improvement. Stay with her, keep her sitting upright, stay calm, and activate emergency help immediately. And note what you do NOT do — you never decide to give the rescue inhaler yourself. You summon help fast; the nurse manages the medication.',
                  isRecommended: true,
                },
                {
                  id: 'give-inhaler',
                  label: 'Give her the rescue inhaler from her drawer',
                  feedback:
                    'This is a severe emergency — and the quieting wheeze is the "silent chest," a danger sign, not improvement. Waiting, laying her flat, or deciding on your own to give the inhaler are all wrong. The right action: stay with her, keep her upright, and activate emergency help immediately while the nurse manages the medication.',
                },
                {
                  id: 'lie-flat',
                  label: 'Help her lie down flat to rest',
                  feedback:
                    'This is a severe emergency — and the quieting wheeze is the "silent chest," a danger sign, not improvement. Waiting, laying her flat, or deciding on your own to give the inhaler are all wrong. The right action: stay with her, keep her upright, and activate emergency help immediately while the nurse manages the medication.',
                },
              ],
              requiredForCompletion: true,
            },
            {
              id: 'asthma-s09-scenario-early-image',
              type: 'image',
              src: '/assets/courses/asthma/s09-scenario-early.jpg',
              caption:
                'Cough, tightness, soft wheeze but talking normally: sit upright, stay calm, call the nurse now.',
            },
            {
              id: 'asthma-s09-scenario-early',
              type: 'scenario_question',
              prompt:
                'Mr. Lindqvist, who has asthma, starts coughing and tells you his chest feels "a bit tight." You hear a soft wheeze when he breathes out. He\'s talking in full sentences and his color is normal, but he says this is how his attacks usually begin. What SHOULD the CNA do?',
              options: [
                {
                  id: 'wait-and-see',
                  label: 'Tell him to wait and see if it passes on its own',
                  feedback:
                    'These are early attack signs, and asthma can worsen fast — so "wait and see" is risky, and a CNA never decides to give the rescue inhaler. The right action: help him sit upright, stay calm with him, and call the nurse now so the attack is treated early.',
                },
                {
                  id: 'call-nurse-now',
                  label: 'Help him sit upright, stay calm with him, and call the nurse now',
                  feedback:
                    'Right. Coughing, chest tightness, and a soft wheeze — especially when the resident recognizes it as the start of an attack — are early asthma signs. He\'s not in immediate danger, since he\'s talking normally with good color, but asthma attacks can worsen quickly, so you don\'t wait and watch. Help him sit upright, stay calm with him to keep panic down, and call the nurse now so the attack can be treated early — before it becomes severe. And you never decide to give the inhaler yourself; the nurse manages that.',
                  isRecommended: true,
                },
                {
                  id: 'give-rescue',
                  label: 'Give him his rescue inhaler since he says it\'s an attack',
                  feedback:
                    'These are early attack signs, and asthma can worsen fast — so "wait and see" is risky, and a CNA never decides to give the rescue inhaler. The right action: help him sit upright, stay calm with him, and call the nurse now so the attack is treated early.',
                },
                {
                  id: 'stay-active',
                  label: 'Have him keep active to take his mind off it',
                  feedback:
                    'These are early attack signs, and asthma can worsen fast — so "wait and see" is risky, and a CNA never decides to give the rescue inhaler. The right action: help him sit upright, stay calm with him, and call the nurse now so the attack is treated early.',
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
            { id: 'asthma-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
              id: 'asthma-s10-video',
              type: 'video',
              title: "CNA's Role in Care",
              videoUrl: `${ASSET_BASE}/s10-cna-role.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s10-cna-role.mp4`,
            },
            {
              id: 'asthma-s10-image',
              type: 'image',
              src: '/assets/courses/asthma/s10-hero.jpg',
              caption: 'Reporting breathing changes accurately to the nurse.',
            },
            {
              id: 'asthma-s10-narration',
              type: 'text',
              body: [
                'Your role in asthma care has two strong halves: preventing attacks through the environment, and responding fast and calmly when one happens. Let\'s walk through it.',
                '**Control the environment** Prevention is your first and biggest role. Know each resident\'s triggers from the care plan. Keep their environment clean and irritant-free — low dust, no strong scents, no smoke, good air. Watch your own perfume and scented products. Protect them from infection and chilling. So much of asthma care is simply keeping the air around the resident safe to breathe.',
                '**Recognize and stay calm** Know each resident\'s normal breathing and recognize an attack early — coughing, chest tightness, wheezing, harder breathing. When an attack begins, your calm is part of the treatment. Help the resident sit upright, which is the best position for breathing. Speak gently. Keep them — and yourself — calm, because panic tightens the chest and makes the attack worse.',
                '**Respond fast and correctly** When an attack happens, call the nurse immediately, and stay with the resident — never leave them alone. Watch for the signs that it\'s becoming an emergency: can\'t speak in sentences, blue lips, confusion, or the silent chest where wheezing fades in a struggling resident. Any of those, activate emergency help right away. And throughout — you never decide to give the rescue inhaler or administer it. That is the nurse\'s role.',
                '**Report clearly** Report with detail: what the resident was doing when it started, what you saw and heard — wheezing, coughing, how hard they were working to breathe — whether they could talk, their color, and how it changed over time. That picture helps the nurse and doctor respond correctly.',
                'Now the boundary. You do not diagnose asthma. You do not give or adjust inhalers or any medication. You do not decide when the rescue inhaler is used. And you never assume an attack will pass on its own and skip getting help.',
                'Inside your role — controlling triggers, recognizing attacks early, staying calm, responding fast, and reporting clearly — you prevent attacks before they start and protect residents when they happen. That\'s powerful, life-protecting care.',
              ].join('\n\n'),
            },
            {
              id: 'asthma-s10-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Stay within scope',
              body: 'You do not diagnose asthma. You do not give or adjust inhalers or any medication. You do not decide when the rescue inhaler is used — when an attack happens, you call the nurse immediately.',
            },
          ]),
      },
      {
        slug: 's11-case-study',
        title: 'Case Study',
        sortOrder: 2,
        buildContent: () => {
          const caseNarrative = [
            'Mrs. Okonkwo, 79, had asthma that was usually well-controlled. Her CNA, Tomas, knew her triggers from the care plan: strong scents and dust set her off. For weeks she\'d been fine.',
            '',
            '**The change:** One afternoon a well-meaning new staff member plugged a strongly scented air freshener into the outlet in the hallway near Mrs. Okonkwo\'s room, hoping to make the unit smell nice. Within an hour, Tomas noticed Mrs. Okonkwo starting to cough, then a soft wheeze, then telling him her chest felt "tight, like one of my attacks coming."',
            '',
            '**The recognition:** Tomas knew this pattern. He helped her sit upright in her chair, stayed calm and beside her, and spoke gently to keep her from panicking. He recognized the early signs of an asthma attack — and he didn\'t wait to see if it would pass. He pressed the call button: "Asthma attack starting, room 9, please come now." He did not reach for her rescue inhaler, even though it was in her drawer and she said it was an attack — he knew that was the nurse\'s call.',
            '',
            '**The trigger spotted:** While staying with Mrs. Okonkwo, Tomas connected the dots — the new scent in the hallway. He mentioned it to the nurse immediately: "There\'s a new strong air freshener in the hall — that\'s one of her known triggers." The nurse arrived, managed Mrs. Okonkwo\'s rescue medication, and the air freshener was removed from the unit at once.',
            '',
            '**The outcome:** Because Tomas recognized the attack early, kept Mrs. Okonkwo calm and upright, and got the nurse fast, the attack was treated quickly and stayed mild. And because he identified the trigger and reported it, the air freshener was removed — preventing not just a worse attack for Mrs. Okonkwo, but attacks in every other resident with asthma on the unit.',
            '',
            '**Discussion:** Tomas did the whole CNA role in asthma. He knew her triggers and recognized the attack early. He stayed calm and positioned her well — real treatment. He responded fast and stayed in his scope, calling the nurse rather than giving the inhaler himself. And he spotted and reported the environmental trigger, protecting the whole unit. Notice that the medication was never his job — but everything around it was, and it made all the difference.',
          ].join('\n');

          return doc('Case Study', [
            { id: 'asthma-s11-heading', type: 'heading', level: 1, text: 'Case Study' },
            pendingAudio(
              'asthma-s11-audio',
              'The Air Freshener Nobody Suspected',
              `${ASSET_BASE}/s11-case-podcast.mp3`,
              caseNarrative,
              `${ASSET_BASE}/s11-case-podcast.mp3`,
            ),
            {
              id: 'asthma-s11-image',
              type: 'image',
              src: '/assets/courses/asthma/s11-hero.jpg',
              caption: 'An asthma concern handled correctly — calm, upright, escalated.',
            },
            {
              id: 'asthma-s11-case-study',
              type: 'case_study',
              title: 'The Air Freshener Nobody Suspected',
              residentProfile:
                'Mrs. Okonkwo, 79, had asthma that was usually well-controlled. Her CNA, Tomas, knew her triggers from the care plan: strong scents and dust set her off. For weeks she\'d been fine.',
              scenario: [
                '**The change:** One afternoon a well-meaning new staff member plugged a strongly scented air freshener into the outlet in the hallway near Mrs. Okonkwo\'s room, hoping to make the unit smell nice. Within an hour, Tomas noticed Mrs. Okonkwo starting to cough, then a soft wheeze, then telling him her chest felt "tight, like one of my attacks coming."',
                '**The recognition:** Tomas knew this pattern. He helped her sit upright in her chair, stayed calm and beside her, and spoke gently to keep her from panicking. He recognized the early signs of an asthma attack — and he didn\'t wait to see if it would pass. He pressed the call button: "Asthma attack starting, room 9, please come now." He did not reach for her rescue inhaler, even though it was in her drawer and she said it was an attack — he knew that was the nurse\'s call.',
                '**The trigger spotted:** While staying with Mrs. Okonkwo, Tomas connected the dots — the new scent in the hallway. He mentioned it to the nurse immediately: "There\'s a new strong air freshener in the hall — that\'s one of her known triggers." The nurse arrived, managed Mrs. Okonkwo\'s rescue medication, and the air freshener was removed from the unit at once.',
                '**The outcome:** Because Tomas recognized the attack early, kept Mrs. Okonkwo calm and upright, and got the nurse fast, the attack was treated quickly and stayed mild. And because he identified the trigger and reported it, the air freshener was removed — preventing not just a worse attack for Mrs. Okonkwo, but attacks in every other resident with asthma on the unit.',
                '**Discussion:** Tomas did the whole CNA role in asthma. He knew her triggers and recognized the attack early. He stayed calm and positioned her well — real treatment. He responded fast and stayed in his scope, calling the nurse rather than giving the inhaler himself. And he spotted and reported the environmental trigger, protecting the whole unit. Notice that the medication was never his job — but everything around it was, and it made all the difference.',
              ].join('\n\n'),
            },
            {
              id: 'asthma-s11-reflection-1',
              type: 'reflection',
              prompt:
                'Tomas recognized Mrs. Okonkwo\'s attack early and stayed calm with her while waiting for the nurse. Why is the CNA\'s calm presence an actual part of asthma treatment, not just comfort?',
              minCharacters: 50,
            },
            {
              id: 'asthma-s11-reflection-2',
              type: 'reflection',
              prompt:
                'Tomas connected the attack to the new air freshener and reported it. How does recognizing and reporting a trigger protect not just one resident but others on the unit?',
              minCharacters: 50,
            },
            {
              id: 'asthma-s11-reflection-intro-text',
              type: 'text',
              body: 'Reflect on the case study in the previous lesson. Your written responses help you apply what you learned about recognizing attacks early, staying calm, and staying within scope.',
            },
            {
              id: 'asthma-s11-kc2-check',
              type: 'knowledge_check',
              question:
                'Here is your scope, stated plainly: when a resident is having an attack, you do not decide to give the rescue inhaler, and you do not administer it yourself. You call the nurse immediately — the nurse responds and manages the medication. Even though the resident is clearly struggling, even though the inhaler is right there, even if the resident has used it before — the CNA SHOULD:',
              options: [
                {
                  id: 'give-inhaler',
                  label: 'Give the rescue inhaler since the resident is struggling',
                },
                {
                  id: 'call-nurse',
                  label: 'Call the nurse immediately and stay with the resident',
                },
                {
                  id: 'wait-pass',
                  label: 'Wait to see if the attack passes on its own',
                },
                {
                  id: 'administer-drawer',
                  label: 'Administer the rescue inhaler from the drawer',
                },
              ],
              correctOptionId: 'call-nurse',
              explanation:
                'You never make the call to give the rescue inhaler yourself. You call the nurse immediately — the nurse responds and manages the medication. Your fast call is what gets the resident the right help.',
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
            { id: 'asthma-s12-heading', type: 'heading', level: 1, text: 'Conclusion' },
            {
              id: 'asthma-s12-video',
              type: 'video',
              title: 'Conclusion',
              videoUrl: `${ASSET_BASE}/s12-conclusion.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s12-conclusion.mp4`,
            },
            {
              id: 'asthma-s12-image',
              type: 'image',
              src: '/assets/courses/asthma/s12-hero.jpg',
              caption: 'Recognize, keep calm and upright, call for help — the CNA\'s role.',
            },
            {
              id: 'asthma-s12-narration',
              type: 'text',
              body: [
                'You\'ve reached the end. Let\'s lock in the five things that matter most for asthma.',
                '**One.** Asthma is a condition of sensitive, twitchy airways that overreact to triggers — tightening, swelling, and filling with mucus during an attack. In older adults, asthma attacks are especially dangerous and must always be taken seriously.',
                '**Two.** Triggers are the key, and they\'re often in your hands. Dust, smoke, strong scents, cold air, infections, stress. Knowing each resident\'s triggers and keeping their environment clean and irritant-free prevents many attacks before they start.',
                '**Three.** Recognize attacks early, and stay calm. Coughing, wheezing, chest tightness, harder breathing. Help the resident sit upright, keep them and yourself calm — because panic worsens an attack — and call the nurse. Your calm is real treatment.',
                '**Four.** Know the emergency, and the silent chest. Gasping, can\'t speak in sentences, blue lips, confusion — or wheezing that fades while the resident is still struggling. That silence is danger, not relief. Activate emergency help immediately.',
                '**Five.** Honor your scope. You support, observe, and report. You never give or adjust inhalers, and you never decide when the rescue inhaler is used — when an attack happens, you call the nurse immediately. Around the medication, you do everything that matters: prevent, recognize, position, calm, and get help fast.',
              ].join('\n\n'),
            },
            {
              id: 'asthma-s12-summary',
              type: 'summary',
              title: 'Five things that matter most',
              items: [
                'Asthma is sensitive, twitchy airways — attacks are especially dangerous in older adults.',
                'Triggers are the key — know each resident\'s triggers and keep their environment clean.',
                'Recognize attacks early and stay calm — help them sit upright and call the nurse.',
                'Know the emergency and the silent chest — activate emergency help immediately.',
                'Honor your scope — never give inhalers or decide when rescue medication is used.',
              ],
            },
            {
              id: 'asthma-s12-what-happens-next-text',
              type: 'text',
              body: 'Ten questions are waiting. Everything on them was covered here. You\'re ready. Trust what you\'ve learned, and show what you know.',
            },
            {
              id: 'asthma-s12-completion-requirements-text',
              type: 'text',
              body: 'This course provides one hour of continuing education credit through CAL ACE Nursing Academy, an approved CDPH continuing education provider, NAC number 7384. Your certificate is generated automatically when you pass the knowledge check.',
            },
            {
              id: 'asthma-s12-completion-requirements-callout',
              type: 'callout',
              variant: 'info',
              title: 'Scope reminder',
              body: 'CNAs recognize, reduce triggers, and respond fast. CNAs do not diagnose asthma or give or adjust inhalers/medications.',
            },
            {
              id: 'asthma-s12-certificate-access-text',
              type: 'text',
              body: 'Your certificate is generated automatically when you pass the knowledge check. CDPH-Approved CE Provider — NAC #7384.',
            },
          ]),
      },
    ],
  },
];


export async function seedCourse18Asthma(
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
  console.log(`Seeding Course 18 (Asthma) as DRAFT — slug "${COURSE_SLUG}"…`);

  try {
    const result = await seedCourse18Asthma(prisma);
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
