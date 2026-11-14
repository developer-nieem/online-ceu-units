/**
 * Seed Course 27 — Blood Sugar Emergencies: Hypoglycemia & Hyperglycemia (DRAFT).
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-27-hypoglycemia-hyperglycemia
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
const COURSE_SLUG = 'hypoglycemia-hyperglycemia';
const COURSE_TITLE = 'Low and High Blood Sugar: Recognition and Action';
const COURSE_SUMMARY =
  'Master the response to blood sugar crises — recognize hypoglycemia and hyperglycemia fast, even when disguised as stroke, intoxication, or dementia; carry out the treat-recheck-retreat loop for lows; escalate severe highs; and stay sharp on sick days. CNAs do not diagnose, give insulin, or decide doses; they recognize fast, respond within policy, and escalate.';

const ASSET_BASE = '/assets/courses/hypoglycemia-hyperglycemia';

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
    'Recognize low and high blood sugar quickly, even when disguised',
    'Carry out the step-by-step response for a low, including the recheck',
    'Recognize severe high-sugar crises',
    'Stay sharp on sick days',
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
  heroImage: '/assets/courses/hypoglycemia-hyperglycemia/hero-banner.png',
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
    title: 'Understanding Blood Sugar Emergencies',
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: 'Introduction',
        sortOrder: 0,
        buildContent: () =>
          doc('Introduction', [
            { id: 'bse-s01-heading', type: 'heading', level: 1, text: 'Welcome' },
            {
              id: 'bse-s01-video',
              type: 'video',
              title: 'Introduction',
              videoUrl: `${ASSET_BASE}/s01-intro.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s01-intro.mp4`,
            },
            {
              id: 'bse-s01-image',
              type: 'image',
              src: `${ASSET_BASE}/s01-hero.jpg`,
              caption: 'Blood-sugar emergencies — recognizing a low fast, and knowing when a high is a crisis.',
            },
            {
              id: 'bse-s01-narration',
              type: 'text',
              body: [
                'Welcome to CAL ACE Nursing Academy.',
                'This course is about the two blood sugar emergencies — hypoglycemia, when blood sugar drops too low, and hyperglycemia, when it climbs too high. If you\'ve taken our diabetes course, you\'ve met these two. This course goes deeper. This is the drill — where you master the response under pressure.',
                'Here\'s why a whole course is devoted to just these two emergencies. Blood sugar crises are among the most common, most time-sensitive emergencies a CNA will ever face. They happen suddenly. They can turn deadly. And the CNA is almost always the first — and sometimes the only — person there when one begins. In those first minutes, what you recognize and what you do can be the difference between a resident who recovers fully and one who suffers a seizure, brain injury, or death.',
                'The diabetes course taught you the basic picture: cold and clammy means low, hot and dry means high. This course sharpens that into real skill. You\'ll drill the exact step sequence for treating a low — including the part most people forget, the recheck. You\'ll learn the dangerous look-alikes — how a low blood sugar can be mistaken for a stroke, for drunkenness, or for dementia, so a real emergency gets missed. You\'ll learn sick-day vigilance, when ordinary illness sends blood sugar swinging. And you\'ll learn the names and signs of the severe high-sugar crises, so you know when high has crossed into deadly.',
                'Think of the diabetes course as understanding the disease. Think of this course as becoming the person you\'d want in the room when a blood sugar emergency strikes.',
                'Your scope is clear, and unchanged. A CNA recognizes blood sugar emergencies fast, responds within facility policy and the care plan, and escalates immediately. A CNA does not diagnose, does not give or adjust insulin or any diabetes medication, and does not decide doses. Your power is speed, recognition, and correct first response.',
                'By the end of this course, you will be able to: recognize low and high blood sugar quickly, even when disguised. Carry out the step-by-step response for a low, including the recheck. Recognize severe high-sugar crises. Stay sharp on sick days. And know your scope.',
                'There is a ten-question knowledge check at the end. Everything on it is covered here. Let\'s begin.',
              ].join('\n\n'),
            },
            {
              id: 'bse-s01-ci-text',
              type: 'text',
              body: [
                'This course teaches the CNA\'s role in recognizing and responding to blood sugar emergencies — hypoglycemia and hyperglycemia — including the treat-recheck-retreat loop, dangerous look-alikes, sick-day vigilance, and severe high-sugar crises.',
                'Let\'s be clear about your role. A CNA recognizes blood sugar emergencies fast, responds within facility policy and the care plan, and escalates immediately. A CNA does not diagnose, does not give or adjust insulin or any diabetes medication, and does not decide doses. Those are nursing and physician tasks. But none of them can happen without your careful observation and faithful reporting first.',
              ].join('\n\n'),
            },
            {
              id: 'bse-s01-ci-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of this course',
              body: 'CNAs RECOGNIZE, RESPOND WITHIN POLICY, and ESCALATE. CNAs do not diagnose, give or adjust insulin or any diabetes medication, or decide doses.',
            },
            {
              id: 'bse-s01-lo-text',
              type: 'text',
              body: 'By the end of this course, you will be able to:',
            },
            {
              id: 'bse-s01-lo-summary',
              type: 'summary',
              title: 'Learning objectives',
              items: [
                'Recognize low and high blood sugar quickly, even when disguised.',
                'Carry out the step-by-step response for a low, including the recheck.',
                'Recognize severe high-sugar crises.',
                'Stay sharp on sick days.',
                'Know your scope — what a CNA does, and what a CNA must never do.',
              ],
            },
            {
              id: 'bse-s01-ii-text',
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
            { id: 'bse-s02-heading', type: 'heading', level: 1, text: 'Key terms' },
            {
              id: 'bse-s02-image',
              type: 'image',
              src: `${ASSET_BASE}/s02-hero.jpg`,
              caption: 'Key terms — hypoglycemia, hyperglycemia, DKA, HHS, and the signs that separate them.',
            },
            {
              id: 'bse-s02-reveal-hypoglycemia',
              type: 'reveal_card',
              frontTitle: 'Hypoglycemia',
              frontBody: 'Hy-po-gly-SEE-mee-ah',
              backTitle: 'Hypoglycemia',
              backBody:
                'Low blood sugar — too little glucose in the blood to fuel the body, especially the brain. It can come on within minutes and become an emergency fast. The word part "hypo" means under or low. This is the crisis you act on quickest.',
            },
            {
              id: 'bse-s02-reveal-hyperglycemia',
              type: 'reveal_card',
              frontTitle: 'Hyperglycemia',
              frontBody: 'Hy-per-gly-SEE-mee-ah',
              backTitle: 'Hyperglycemia',
              backBody:
                'High blood sugar — too much glucose in the blood. It usually builds more slowly, over hours to days, but when it climbs very high it becomes a severe, life-threatening crisis. The word part "hyper" means over or high.',
            },
            {
              id: 'bse-s02-reveal-15-15',
              type: 'reveal_card',
              frontTitle: 'The "15-15 Rule"',
              frontBody: 'Fifteen-fifteen rule',
              backTitle: 'The "15-15 Rule"',
              backBody:
                'A common guideline for treating a conscious low: give about fifteen grams of fast-acting sugar, wait about fifteen minutes, then recheck. If still low, repeat. Many facilities use this approach — always follow your own facility\'s exact policy. The key idea it teaches: treat, then recheck.',
            },
            {
              id: 'bse-s02-reveal-fast-sugar',
              type: 'reveal_card',
              frontTitle: 'Fast-Acting Sugar',
              frontBody: 'Fast-acting sugar',
              backTitle: 'Fast-Acting Sugar',
              backBody:
                'A sugar that raises blood glucose quickly — about four ounces of juice or regular, non-diet soda, glucose tablets or gel, or a tablespoon of honey. Fast-acting is the point: in a low, you need sugar that works in minutes, not a candy bar full of fat that works slowly.',
            },
            {
              id: 'bse-s02-reveal-rebound',
              type: 'reveal_card',
              frontTitle: 'Rebound / Recurrence',
              frontBody: 'Rebound',
              backTitle: 'Rebound / Recurrence',
              backBody:
                'When blood sugar drops low again after seeming to recover — because the cause, like too much insulin still working, is still present. This is exactly why you recheck and keep watching after treating a low. One recovery is not the end of the danger.',
            },
            {
              id: 'bse-s02-reveal-dka',
              type: 'reveal_card',
              frontTitle: 'DKA (Diabetic Ketoacidosis)',
              frontBody: 'D-K-A',
              backTitle: 'DKA (Diabetic Ketoacidosis)',
              backBody:
                'Diabetic ketoacidosis. Kee-toe-as-ih-DOH-sis. A severe high-blood-sugar crisis, more common in type 1, where the body, starved of glucose inside the cells, burns fat and floods the blood with acids. Signs include deep rapid breathing, fruity-smelling breath, vomiting, and drowsiness. It is a life-threatening emergency.',
            },
            {
              id: 'bse-s02-reveal-hhs',
              type: 'reveal_card',
              frontTitle: 'HHS (Hyperosmolar State)',
              frontBody: 'H-H-S',
              backTitle: 'HHS (Hyperosmolar State)',
              backBody:
                'A severe high-blood-sugar crisis more common in older adults with type 2: blood sugar climbs extremely high, the body becomes severely dehydrated, and the resident grows confused and very drowsy. Like DKA, it is a life-threatening emergency requiring immediate help.',
            },
            {
              id: 'bse-s02-reveal-sick-day',
              type: 'reveal_card',
              frontTitle: 'Sick-Day Effect',
              frontBody: 'Sick-day effect',
              backTitle: 'Sick-Day Effect',
              backBody:
                'When a resident with diabetes gets ill — a cold, flu, infection, vomiting — blood sugar often swings, usually climbing, and emergencies become more likely. Illness in a diabetic resident always means extra blood-sugar vigilance and prompt reporting.',
            },
            {
              id: 'bse-s02-kc1-check-15-15',
              type: 'knowledge_check',
              question: 'Match the term: give 15g fast sugar, wait 15 min, then recheck',
              options: [
                { id: '15-15-rule', label: '15-15 rule' },
                { id: 'rebound', label: 'Rebound' },
                { id: 'dka', label: 'DKA' },
              ],
              correctOptionId: '15-15-rule',
              explanation:
                '15-15 rule. A common guideline for treating a conscious low: give about fifteen grams of fast-acting sugar, wait about fifteen minutes, then recheck. If still low, repeat.',
              requiredForCompletion: true,
            },
            {
              id: 'bse-s02-kc1-check-rebound',
              type: 'knowledge_check',
              question:
                'Match the term: blood sugar drops low again after seeming to recover',
              options: [
                { id: '15-15-rule', label: '15-15 rule' },
                { id: 'rebound', label: 'Rebound' },
                { id: 'dka', label: 'DKA' },
              ],
              correctOptionId: 'rebound',
              explanation:
                'Rebound. When blood sugar drops low again after seeming to recover — because the cause, like too much insulin still working, is still present. This is exactly why you recheck and keep watching after treating a low.',
              requiredForCompletion: true,
            },
            {
              id: 'bse-s02-kc1-check-dka',
              type: 'knowledge_check',
              question:
                'Match the term: severe high-sugar crisis with fruity breath and deep breathing',
              options: [
                { id: '15-15-rule', label: '15-15 rule' },
                { id: 'rebound', label: 'Rebound' },
                { id: 'dka', label: 'DKA' },
              ],
              correctOptionId: 'dka',
              explanation:
                'DKA. Diabetic ketoacidosis — a severe high-blood-sugar crisis where the body floods the blood with acids. Signs include deep rapid breathing, fruity-smelling breath, vomiting, and drowsiness.',
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
            { id: 'bse-s03-heading', type: 'heading', level: 1, text: 'Statistics' },
            pendingAudio(
              'bse-s03-audio',
              'Blood Sugar Emergencies: Common, Fast, and Often Missed',
              `${ASSET_BASE}/s03-stats-podcast.mp3`,
              [
                'Blood Sugar Emergencies: Common, Fast, and Often Missed',
                '',
                'Blood sugar emergencies are among the most frequent medical emergencies in long-term care, precisely because diabetes is so common — about one in four older adults has it, and many take insulin or pills that can drop blood sugar too low.',
                '',
                'Hypoglycemia deserves special focus. Severe low blood sugar sends large numbers of older adults to emergency rooms every year, and older adults are especially vulnerable for several reasons. They\'re more likely to be on insulin or sulfonylurea pills that cause lows. They often eat irregularly or have variable appetites. Their bodies give weaker warning signals — a condition where the usual shakiness and sweating are blunted, so a low can progress to confusion or collapse with little warning. And here is the fact that makes a whole course worthwhile: in older adults, low blood sugar is frequently missed or mistaken for something else — for a stroke, for dementia, for intoxication, or for simple confusion. A treatable, fast-killing emergency gets overlooked because it wears a disguise.',
                '',
                'The danger of a missed or delayed low is severe. The brain runs on glucose, and starved of it, it fails within minutes — causing confusion, combativeness, seizures, loss of consciousness, brain injury, and death. Speed of recognition and response is everything. Studies of hypoglycemia outcomes consistently show that fast, correct first response dramatically improves outcomes — and that first responder is almost always a CNA.',
                '',
                'High blood sugar emergencies, while slower to build, are also deadly. The severe crises — diabetic ketoacidosis and the hyperosmolar state — develop over hours to days and account for many hospitalizations and deaths, especially when early warning signs were missed. Illness is a frequent trigger, which is why sick days demand extra attention.',
                '',
                'Here\'s the empowering bottom line: blood sugar emergencies are common, fast, dangerous, and frequently disguised — and the single biggest factor in survival is a CNA who recognizes them quickly, even behind a disguise, and responds correctly in the first minutes. This course exists to make you that CNA.',
              ].join('\n'),
              '/assets/courses/hypoglycemia-hyperglycemia/s03-stats-podcast.mp3',
            ),
            {
              id: 'bse-s03-image',
              type: 'image',
              src: `${ASSET_BASE}/s03-hero.jpg`,
              caption: 'Blood-sugar emergencies are common in long-term care — and preventable with vigilance.',
            },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: 'Fundamentals',
        sortOrder: 3,
        buildContent: () =>
          doc('Fundamentals', [
            { id: 'bse-s04-heading', type: 'heading', level: 1, text: 'Fundamentals' },
            {
              id: 'bse-s04-video',
              type: 'video',
              title: 'Fundamentals',
              videoUrl: `${ASSET_BASE}/s04-fundamentals.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s04-fundamentals.mp4`,
            },
            {
              id: 'bse-s04-image',
              type: 'image',
              src: `${ASSET_BASE}/s04-hero.jpg`,
              caption: 'How a low and a high differ — and why a low is the faster emergency.',
            },
            {
              id: 'bse-s04-narration',
              type: 'text',
              body: [
                '**Why low is faster than high**',
                'Both emergencies are dangerous, but they move at different speeds, and that changes how you respond. Low blood sugar is fast — the brain is starved of fuel within minutes, so the danger arrives quickly and you must act quickly. High blood sugar is slower — it builds over hours to days. So a low is treat-now; a high is recognize-and-escalate. Speed is the first thing to understand.',
                '**The treat-and-recheck idea**',
                'Here\'s the skill most people miss. Treating a low isn\'t a single action — give sugar and walk away. It\'s a loop: give fast-acting sugar, wait a short time, then recheck. Why? Because the sugar takes minutes to work, and the cause — like insulin still active in the body — may still be pulling blood sugar down. Without the recheck, you can think the crisis is over while it\'s quietly returning. Treat, wait, recheck, and re-treat if needed.',
                '**Fast sugar, not just any sugar**',
                'In a low, the kind of sugar matters. You need fast-acting sugar that raises blood glucose in minutes — juice, regular soda, glucose tablets, honey. A chocolate bar or ice cream, full of fat, works too slowly because the fat slows sugar absorption — exactly the wrong choice in an emergency where minutes count. Fast in, fast up.',
                '**Why lows wear disguises**',
                'This is the heart of the course. In older adults, low blood sugar often doesn\'t look like the textbook picture. It can look like a stroke — slurred speech, weakness, confusion. It can look like intoxication — unsteady, slurring, odd behavior. It can look like dementia or a "bad day" — confusion, withdrawal, agitation. Because of this, real lows get missed. The lifesaving habit: for any resident with diabetes who suddenly changes — confused, slurring, weak, agitated, "off" — think low blood sugar first, and get it checked. It\'s fast to rule in or out, and fast to fix.',
                '**The blunted warning in older adults**',
                'Younger people usually feel a low coming — the shakiness and sweat warn them. Many older adults lose those warnings, a problem sometimes called hypoglycemia unawareness. The low can skip straight to confusion or collapse with little warning. This is why you don\'t wait for dramatic shaking — subtle confusion or drowsiness in a diabetic resident is enough to act on.',
                '**When high becomes a crisis**',
                'High blood sugar builds slowly, but it has a deadly far end. As it climbs very high, the body moves toward crisis — the acid crisis called DKA, more common in type 1, with deep rapid breathing and fruity breath; or the severe dehydration crisis called HHS, more common in older type 2 adults, with extreme thirst, profound drowsiness, and confusion. The everyday signs of a high — thirst, frequent urination, fatigue — are your early warning to report before it reaches crisis.',
                '**Illness tips the balance**',
                'Ordinary illness is a major destabilizer. A cold, the flu, an infection, vomiting, or diarrhea can swing blood sugar — usually up — and make both kinds of emergency more likely. A resident with diabetes who gets sick needs extra blood-sugar attention and prompt reporting. Never treat illness in a diabetic resident as routine.',
              ].join('\n\n'),
            },
            {
              id: 'bse-s04-disguise-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Think LOW first',
              body: 'A low can look like a stroke, drunkenness, or dementia. For any diabetic resident who suddenly changes — think low blood sugar first, and get it checked.',
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
            { id: 'bse-s05-heading', type: 'heading', level: 1, text: 'Signs & Symptoms' },
            {
              id: 'bse-s05-image',
              type: 'image',
              src: `${ASSET_BASE}/s05-hero.jpg`,
              caption: 'Recognizing the signs — including the lows that hide as confusion or a bad mood.',
            },
            {
              id: 'bse-s05-narration',
              type: 'text',
              body: [
                'You already know the basic signs of low and high. This section sharpens them — into recognizing the disguises and the severity, so you catch what others miss. Let\'s drill.',
                '**The low that looks like a stroke**',
                'A low blood sugar can mimic a stroke almost perfectly: sudden slurred speech, weakness on one side, confusion, trouble speaking. The crucial difference for the CNA: you don\'t have to tell them apart — both are emergencies that need the nurse immediately. But here\'s the lifesaving instinct: in a resident with diabetes, a sudden "stroke-like" change should make you think of low blood sugar too, because a low is checked in seconds and fixed in minutes. Get the nurse fast and mention the diabetes.',
                '**The low that looks like drunkenness or dementia**',
                'Low blood sugar can also look like intoxication — unsteady walking, slurred words, confusion, even giddiness or aggression — or like a sudden worsening of dementia, or just a "bad, agitated day." These disguises are exactly why lows get missed. The rule: any sudden change in a diabetic resident\'s behavior or alertness — confused, agitated, slurring, withdrawn, "not themselves" — gets treated as possible low blood sugar until proven otherwise. Report it for a check immediately.',
                '**The high crossing into crisis**',
                'For high blood sugar, learn the signs that it\'s crossing from "high" into "crisis." Beyond the everyday thirst, frequent urination, and fatigue, watch for: deep, rapid breathing. Breath with a sweet, fruity smell. Nausea and vomiting. Abdominal pain. A very dry mouth and skin from dehydration. Increasing drowsiness or confusion sliding toward unconsciousness. These mean DKA or HHS may be developing — a life-threatening crisis needing emergency help now.',
                '**Reading severity and acting on it**',
                'The most important skill is matching your action to the severity. A conscious resident who can swallow, showing a low — treat with fast sugar, alert the nurse, and recheck. A resident who can\'t swallow safely, is unconscious, or seizing, from a low OR a high — nothing by mouth, activate emergency help now. Severe high-sugar signs — deep breathing, fruity breath, vomiting, deep drowsiness — emergency help now. Reading the severity tells you whether to treat-and-recheck or to escalate immediately.',
                '**Summary**',
                'Two pictures, deepened. LOW, including its disguises: shaky, sweaty, cold and clammy — but also stroke-like, drunk-like, dementia-like, or simply suddenly "off." HIGH, including crisis: thirsty, frequent urination, hot and dry — escalating to deep rapid breathing, fruity breath, vomiting, deep drowsiness.',
                'The rule underneath it all: in a diabetic resident, a sudden change is a blood sugar emergency until proven otherwise — and you match your response to whether they can safely swallow.',
              ].join('\n\n'),
            },
            {
              id: 'bse-s05-severity-callout',
              type: 'callout',
              variant: 'warning',
              title: 'Match action to severity',
              body: 'Conscious + can swallow → fast sugar, alert nurse, recheck. Unconscious / can\'t swallow → nothing by mouth, emergency help NOW.',
            },
          ]),
      },
      {
        slug: 's06-causes',
        title: 'Causes',
        sortOrder: 1,
        buildContent: () =>
          doc('Causes', [
            { id: 'bse-s06-heading', type: 'heading', level: 1, text: 'Causes' },
            pendingAudio(
              'bse-s06-audio',
              'The Situations That Trigger a Blood Sugar Emergency',
              `${ASSET_BASE}/s06-causes-podcast.mp3`,
              [
                'The Situations That Trigger a Blood Sugar Emergency',
                '',
                'Knowing what causes diabetes is one thing. Knowing the everyday situations that tip a stable resident into a blood sugar emergency is the practical skill — because those situations are things a CNA sees, and often can prevent or flag.',
                '',
                'Lows are usually a mismatch: too much glucose-lowering medication for the food and activity at hand. The classic triggers a CNA should memorize: a resident got insulin or a sulfonylurea pill, then ate too little, skipped a meal, ate much later than usual, or vomited the meal back up. A resident was more active than usual — a long walk, a busy therapy session, extra exertion — burning more glucose. A meal was delayed while the medication was already working. And lows often strike at predictable danger times: before meals, during the night, and after activity. A resident on insulin who refuses breakfast is a low waiting to happen — and you\'re the one who can flag it.',
                '',
                'Highs are usually the opposite mismatch, but with one extra-important cause: illness. The everyday triggers: eating much more than usual, especially sweets and carbohydrates; missing a dose of diabetes medication or insulin; being less active than usual. But the trigger that deserves its own spotlight is illness. When a resident with diabetes gets sick — an infection, a cold, the flu, a urinary tract infection, even a bad cold — the stress of illness pushes blood sugar up, sometimes dramatically, and is a leading path to the severe crises DKA and HHS. This is the sick-day effect, and it\'s why illness in a diabetic resident is never treated as routine.',
                '',
                'There\'s also a subtle one: a resident who is eating poorly because they\'re sick, while still receiving their full insulin, can swing LOW — so illness can push either direction, which is why it demands extra watching, not assumptions.',
                '',
                'Here\'s what this means for the CNA. You see the triggers as they happen — the skipped meal after insulin, the extra-active afternoon, the resident coming down with a cold, the refused breakfast. Flagging these situations early, before symptoms appear, lets the team prevent an emergency. You are positioned to catch the trigger before it becomes a crisis.',
              ].join('\n'),
              '/assets/courses/hypoglycemia-hyperglycemia/s06-causes-podcast.mp3',
            ),
            {
              id: 'bse-s06-image',
              type: 'image',
              src: `${ASSET_BASE}/s06-hero.jpg`,
              caption: 'What triggers a low or a high — missed meals, illness, insulin timing, activity.',
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
              id: 'bse-s07-heading',
              type: 'heading',
              level: 1,
              text: 'CNA Role & Best Practices',
            },
            {
              id: 'bse-s07-image',
              type: 'image',
              src: `${ASSET_BASE}/s07-hero.jpg`,
              caption: 'CNA scope — treat a low per protocol, recheck, report; never give or adjust insulin.',
            },
            {
              id: 'bse-s07-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of practice',
              body: 'CNAs never give insulin or decide doses. But CNAs run the low-sugar response — and the RECHECK is the step that saves the rebound.',
            },
            {
              id: 'bse-s07-narration',
              type: 'text',
              body: [
                'This section is the core drill of the course: the exact response to a blood sugar emergency. Let\'s start, as always, with the rule that never bends. A CNA does not give or adjust insulin or any diabetes medication, and never decides a dose. Within that scope, here is the response you must know cold — and always follow your own facility\'s exact policy and the resident\'s care plan.',
                '**The conscious low — the treat-and-recheck loop.** When a conscious resident who can safely swallow shows signs of a low, the standard response many facilities use, often called the fifteen-fifteen rule: give about fifteen grams of fast-acting sugar — about four ounces of juice or regular soda, glucose tablets, or glucose gel. Alert the nurse. Wait about fifteen minutes. Then recheck — symptoms and, where it\'s done, blood sugar. If the resident is still low, repeat the fast sugar. This recheck is the step people forget, and it\'s the one that catches a low that\'s rebounding. Treat, alert, wait, recheck, re-treat if needed.',
                '**After recovery — the follow-up.** Once a low is corrected, the resident often needs a longer-acting snack or their next meal to keep blood sugar from dropping again — as the nurse and care plan direct. And keep watching, because lows can recur. Recovery is not the end of vigilance.',
                '**The unconscious or unsafe-to-swallow resident — the absolute rule.** If the resident is unconscious, cannot swallow safely, or is seizing — from a low OR a high — give NOTHING by mouth. Activate emergency help immediately, keep them safe, position them on their side if seizing or vomiting, and report that they have diabetes and what medications they take. Glucose can be given safely by other means by trained responders. Never pour anything into the mouth of someone who can\'t swallow.',
                '**The severe high.** For signs of a severe high-sugar crisis — deep rapid breathing, fruity breath, vomiting, deep drowsiness, confusion — this is an emergency: activate help immediately, keep the resident safe and hydrated only if fully alert and able to swallow, and report. You don\'t give insulin; the team manages the crisis.',
                'The scope point for this section: you never give insulin or decide a dose — but you execute the low-sugar response loop, including the recheck, you follow the never-by-mouth rule for the unconscious, and you escalate severe highs fast. Know your facility\'s exact policy before you ever need it.',
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
            { id: 'bse-s08-heading', type: 'heading', level: 1, text: 'Prevention & Risk Reduction' },
            {
              id: 'bse-s08-image',
              type: 'image',
              src: `${ASSET_BASE}/s08-hero.jpg`,
              caption: 'Prevention — meals on time, sick-day vigilance, and knowing each resident\'s pattern.',
            },
            {
              id: 'bse-s08-narration',
              type: 'text',
              body: [
                'The best blood sugar emergency is the one that never happens. CNAs prevent many of them by catching the triggers early. Here are seven ways.',
                '**One. Flag the skipped meal after insulin — every time.** This is the highest-value prevention there is. A resident who received insulin or a diabetes pill and then ate little or nothing is heading for a low. Report it immediately, before symptoms start. Catching this one situation prevents a large share of lows.',
                '**Two. Watch the danger times.** Lows cluster before meals, overnight, and after extra activity. Be especially alert in those windows — check on residents, make sure meals aren\'t delayed, and watch closely after an unusually active day or therapy session.',
                '**Three. Treat illness as a red alert.** When a diabetic resident gets sick — a cold, fever, vomiting, diarrhea, any infection — blood sugar can swing badly. Report illness promptly and watch blood sugar signs closely. Sick days are never routine for a resident with diabetes.',
                '**Four. Keep eating consistent and balanced.** Serve meals on time, encourage residents to eat their planned diet, watch for both under-eating and over-indulging, and flag big changes in appetite. Steady, consistent eating is steady blood sugar.',
                '**Five. Know each resident\'s personal warning pattern.** One resident\'s low looks like sweating and shakiness; another\'s looks like quiet confusion; another\'s like irritability. Learn each resident\'s individual signature so you catch their emergency faster. And remember that some older adults have blunted warnings — so act on subtle changes.',
                '**Six. Keep fast sugar accessible and know the policy.** Know where fast-acting sugar is kept and exactly what your facility\'s hypoglycemia policy says — before an emergency, not during one. Seconds saved by preparation can change an outcome.',
                '**Seven. Report every emergency and every near-miss.** After any low or high — even one quickly corrected — report it fully, including what likely triggered it. Patterns of repeated lows or highs tell the team a plan needs adjusting. Your reports prevent the next emergency.',
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
              id: 'bse-s09-heading',
              type: 'heading',
              level: 1,
              text: 'Scenario & Reporting',
            },
            pendingAudio(
              'bse-s09-intro-audio',
              'Emergency response scenarios intro',
              `${ASSET_BASE}/s09-emergency-intro.mp3`,
              'This is the drill. Two situations test the skills this course is built on: recognizing a low when it\'s wearing a disguise, and running the response — including the recheck — correctly. Read each carefully, choose your action, and you\'ll get feedback right away. Keep the core idea in mind: in a diabetic resident, a sudden change is a blood sugar emergency until proven otherwise, and treating a low isn\'t done until you\'ve rechecked.',
              '/assets/courses/hypoglycemia-hyperglycemia/s09-emergency-intro.mp3',
            ),
            {
              id: 'bse-s09-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-hero.jpg`,
              caption: 'Two blood-sugar judgments — a disguised low, and knowing when to recheck.',
            },
            {
              id: 'bse-s09-scenario-adeyemi-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-scenario-adeyemi.jpg`,
              caption: 'A low that looks like a bad mood: treat it, don\'t explain it away.',
            },
            {
              id: 'bse-s09-scenario-adeyemi',
              type: 'scenario_question',
              prompt:
                'Mr. Adeyemi has diabetes and takes insulin. He suddenly develops slurred speech, weakness on his right side, and confusion — it looks alarmingly like a stroke. A coworker says, "Looks like a stroke, let\'s just wait for the nurse to assess." It\'s mid-morning and you remember he ate very little breakfast. What is the BEST action?',
              options: [
                {
                  id: 'wait-nurse',
                  label: 'Wait quietly for the nurse, assuming it\'s a stroke',
                  feedback:
                    'These stroke-like signs in a diabetic resident who barely ate after insulin could be a disguised low — checked in seconds, fixed in minutes. Just waiting could miss it; giving insulin on a guess could be fatal. The right action: get the nurse immediately and say he\'s diabetic, on insulin, and barely ate, so blood sugar is checked fast.',
                },
                {
                  id: 'nurse-with-facts',
                  label:
                    'Get the nurse immediately AND mention he has diabetes, takes insulin, and barely ate — this could be a low',
                  feedback:
                    'Right. Stroke-like signs — slurred speech, one-sided weakness, confusion — in a resident with diabetes who barely ate after insulin could absolutely be low blood sugar wearing a stroke\'s disguise. You don\'t diagnose which it is, and both need the nurse fast — but the lifesaving move is to get the nurse immediately AND say the key facts out loud: diabetic, on insulin, barely ate. That prompts a quick blood sugar check, because a low is confirmed in seconds and fixed in minutes. Never give insulin on a guess — if it\'s a low, insulin could be fatal. Stay with him and let the team act fast.',
                  isRecommended: true,
                },
                {
                  id: 'give-insulin',
                  label: 'Give him his insulin in case it\'s high',
                  feedback:
                    'These stroke-like signs in a diabetic resident who barely ate after insulin could be a disguised low — checked in seconds, fixed in minutes. Just waiting could miss it; giving insulin on a guess could be fatal. The right action: get the nurse immediately and say he\'s diabetic, on insulin, and barely ate, so blood sugar is checked fast.',
                },
                {
                  id: 'leave-return',
                  label: 'Leave to find help and come back later',
                  feedback:
                    'These stroke-like signs in a diabetic resident who barely ate after insulin could be a disguised low — checked in seconds, fixed in minutes. Just waiting could miss it; giving insulin on a guess could be fatal. The right action: get the nurse immediately and say he\'s diabetic, on insulin, and barely ate, so blood sugar is checked fast.',
                },
              ],
              requiredForCompletion: true,
            },
            {
              id: 'bse-s09-scenario-pearson-image',
              type: 'image',
              src: `${ASSET_BASE}/s09-scenario-pearson.jpg`,
              caption: 'Treated once and still symptomatic: recheck and retreat — don\'t assume it\'s fixed.',
            },
            {
              id: 'bse-s09-scenario-pearson',
              type: 'scenario_question',
              prompt:
                'Mrs. Pearson, conscious and able to swallow, showed clear signs of a low — shaky, sweaty, confused. Following facility policy, you gave her four ounces of juice and alerted the nurse. A few minutes later she says, "Oh, I feel a bit better." A coworker says, "Good, she\'s fine now — let\'s move on to our other residents." What SHOULD the CNA do?',
              options: [
                {
                  id: 'move-on',
                  label: 'Agree she\'s fine and move on to other tasks',
                  feedback:
                    'Moving on after "a bit better" is the classic mistake — the low can rebound as the sugar finishes working and insulin stays active. Insulin would be dangerous, and a fatty chocolate works too slowly. The right action: stay, wait the recheck time, recheck, and re-treat per policy if she\'s still low. The recheck is what catches the rebound.',
                },
                {
                  id: 'recheck',
                  label:
                    'Stay with her, wait the full recheck time, recheck her, and re-treat per policy if she\'s still low',
                  feedback:
                    'Right. "Feeling a bit better" a few minutes after juice is NOT the all-clear — the sugar takes time to fully work, and if insulin is still active, she can drop low again. This is exactly the rebound the recheck catches. Stay with her, wait the recheck time your policy specifies (often about fifteen minutes), and recheck her symptoms and blood sugar where that\'s done. If she\'s still low, re-treat with fast sugar per policy. Then she\'ll likely need a longer-acting snack or her meal, as the nurse and plan direct. Treating a low isn\'t finished until you\'ve rechecked.',
                  isRecommended: true,
                },
                {
                  id: 'give-insulin',
                  label: 'Give her insulin now that she\'s better',
                  feedback:
                    'Moving on after "a bit better" is the classic mistake — the low can rebound as the sugar finishes working and insulin stays active. Insulin would be dangerous, and a fatty chocolate works too slowly. The right action: stay, wait the recheck time, recheck, and re-treat per policy if she\'s still low. The recheck is what catches the rebound.',
                },
                {
                  id: 'chocolate',
                  label: 'Give her a large fatty snack like chocolate to be safe',
                  feedback:
                    'Moving on after "a bit better" is the classic mistake — the low can rebound as the sugar finishes working and insulin stays active. Insulin would be dangerous, and a fatty chocolate works too slowly. The right action: stay, wait the recheck time, recheck, and re-treat per policy if she\'s still low. The recheck is what catches the rebound.',
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
            { id: 'bse-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
              id: 'bse-s10-video',
              type: 'video',
              title: "CNA's Role in Care",
              videoUrl: `${ASSET_BASE}/s10-cna-role.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s10-cna-role.mp4`,
            },
            {
              id: 'bse-s10-image',
              type: 'image',
              src: `${ASSET_BASE}/s10-hero.jpg`,
              caption: 'The CNA as the daily watch — catching the low before it becomes an emergency.',
            },
            {
              id: 'bse-s10-narration',
              type: 'text',
              body: [
                'Your role in a blood sugar emergency is recognition, correct response, and clear escalation — fast, and in order. Let\'s drill it.',
                '**Recognize, even through a disguise** First, recognition — sharpened. Know each resident\'s diabetes status and personal warning signs. And carry the lifesaving instinct: when any diabetic resident suddenly changes — confused, slurring, weak, agitated, drowsy, "off" — think blood sugar first, even when it looks like a stroke, intoxication, or dementia. Don\'t wait for textbook shaking, especially in older adults with blunted warnings. A suspected blood sugar emergency gets the nurse immediately, with the key facts said out loud.',
                '**Run the low-sugar response correctly** For a conscious resident who can swallow, run the response cleanly: fast-acting sugar per facility policy, alert the nurse, then — the step that defines a skilled CNA — wait and recheck, and re-treat if still low. Follow with a longer snack or meal as directed, and keep watching. Treat, alert, recheck, re-treat, follow up. Never stop at "feels a bit better."',
                '**Escalate correctly when it\'s severe** Match action to severity. For a resident who can\'t swallow safely, is unconscious, or seizing — from a low or a high — nothing by mouth, activate emergency help immediately, keep them safe, side-lying if seizing or vomiting. For severe high-sugar signs — deep rapid breathing, fruity breath, vomiting, deep drowsiness — activate help immediately. Never give insulin, never force fluids into someone who can\'t swallow.',
                '**Report with the facts that matter** Report clearly and completely. Say the key facts that speed correct care: the resident has diabetes, what medications they take, what you saw, when it started, what you gave and when, the recheck result, and any likely trigger like a skipped meal or recent insulin. After any emergency or near-miss, report it fully so the team can adjust the plan and prevent the next one.',
                'Now the boundary. You do not diagnose. You never give or adjust insulin or any diabetes medication, and never decide a dose. You never give anything by mouth to a resident who can\'t swallow safely. And you never assume a sudden change in a diabetic resident is "nothing."',
                'Inside your role — recognize fast even through disguises, run the response with the recheck, escalate severe cases correctly, and report the facts that matter — you are exactly the person you\'d want in the room when blood sugar turns dangerous. That\'s what this course was built to make you.',
              ].join('\n\n'),
            },
            {
              id: 'bse-s10-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Stay within scope',
              body: 'You do not diagnose. You never give or adjust insulin or any diabetes medication, and never decide a dose. You never give anything by mouth to a resident who can\'t swallow safely.',
            },
          ]),
      },
      {
        slug: 's11-case-study',
        title: 'Case Study',
        sortOrder: 2,
        buildContent: () => {
          const caseNarrative = [
            'Mr. Adeyemi, 80, had type 2 diabetes managed with insulin. His CNA, Rosa, had taken both the diabetes course and this one — and the disguised-low lesson had stuck with her.',
            '',
            '**The frightening change:** Mid-morning, Rosa came to help Mr. Adeyemi and found him alarming. His speech was slurred, the right side of his body seemed weak, and he was confused, struggling to answer her. Another aide nearby gasped, "Oh no — he\'s having a stroke. Let\'s wait for the nurse." It did look exactly like a stroke.',
            '',
            '**Rosa\'s instinct:** But Rosa\'s mind went somewhere else first. She knew Mr. Adeyemi had diabetes and took insulin. And she remembered something from breakfast: he\'d been tired and had eaten only a few spoonfuls before pushing the tray away. Insulin given, almost no food. Stroke-like signs. A bell rang in her memory — a low can wear a stroke\'s mask. She didn\'t waste a second trying to decide which it was.',
            '',
            '**What Rosa did:** She hit the call button hard and, when she reached the nurse, she didn\'t just say "come quick" — she said the facts that mattered: "Mr. Adeyemi has slurred speech and right-side weakness, looks like a stroke — but he\'s diabetic, on insulin, and barely ate breakfast. Please check his blood sugar fast." That one sentence changed everything. The nurse came immediately and checked his blood sugar first — it was dangerously low.',
            '',
            '**The resolution:** Because Mr. Adeyemi was still able to swallow safely, the nurse treated the low per protocol, and Rosa helped monitor. Within minutes of getting sugar, his slurred speech cleared, his strength returned, and the confusion lifted — the "stroke" dissolved as his blood sugar came up. It had never been a stroke at all. The nurse and Rosa kept watching, rechecked, and gave him a follow-up snack, knowing a low can rebound.',
            '',
            '**The outcome:** A dangerous low — disguised as a stroke — was caught and reversed within minutes. Had it been dismissed as a stroke to "wait and assess," or worse, had anyone guessed "high" and given insulin, the outcome could have been catastrophic. The nurse told Rosa: "You didn\'t try to diagnose it — you just gave me the three facts that mattered: diabetic, on insulin, didn\'t eat. That\'s why we checked the sugar first. You may have saved his brain."',
            '',
            '**Discussion:** Rosa\'s skill wasn\'t medical diagnosis — it was the trained instinct this course exists to build. She saw stroke-like signs in a diabetic resident who\'d missed food after insulin, and she thought low blood sugar instead of accepting the obvious. She escalated immediately with the key facts said out loud. She never gave insulin on a guess, never gave anything to someone who couldn\'t safely swallow, never overstepped. Recognize the disguise, escalate with the facts, stay in scope — and a "stroke" turned out to be a low, fixed in minutes.',
          ].join('\n');

          return doc('Brief Case Study', [
            { id: 'bse-s11-heading', type: 'heading', level: 1, text: 'Brief Case Study' },
            pendingAudio(
              'bse-s11-audio',
              'The Stroke That Was a Low',
              `${ASSET_BASE}/s11-case-podcast.mp3`,
              caseNarrative,
              '/assets/courses/hypoglycemia-hyperglycemia/s11-case-podcast.mp3',
            ),
            {
              id: 'bse-s11-image',
              type: 'image',
              src: `${ASSET_BASE}/s11-hero.png`,
              caption: 'Recognizing the pattern — how a disguised low was caught in time.',
            },
            {
              id: 'bse-s11-case-study',
              type: 'case_study',
              title: 'The Stroke That Was a Low',
              residentProfile:
                'Mr. Adeyemi, 80, had type 2 diabetes managed with insulin. His CNA, Rosa, had taken both the diabetes course and this one — and the disguised-low lesson had stuck with her.',
              scenario: [
                '**The frightening change:** Mid-morning, Rosa came to help Mr. Adeyemi and found him alarming. His speech was slurred, the right side of his body seemed weak, and he was confused, struggling to answer her. Another aide nearby gasped, "Oh no — he\'s having a stroke. Let\'s wait for the nurse." It did look exactly like a stroke.',
                '**Rosa\'s instinct:** But Rosa\'s mind went somewhere else first. She knew Mr. Adeyemi had diabetes and took insulin. And she remembered something from breakfast: he\'d been tired and had eaten only a few spoonfuls before pushing the tray away. Insulin given, almost no food. Stroke-like signs. A bell rang in her memory — a low can wear a stroke\'s mask. She didn\'t waste a second trying to decide which it was.',
                '**What Rosa did:** She hit the call button hard and, when she reached the nurse, she didn\'t just say "come quick" — she said the facts that mattered: "Mr. Adeyemi has slurred speech and right-side weakness, looks like a stroke — but he\'s diabetic, on insulin, and barely ate breakfast. Please check his blood sugar fast." That one sentence changed everything. The nurse came immediately and checked his blood sugar first — it was dangerously low.',
                '**The resolution:** Because Mr. Adeyemi was still able to swallow safely, the nurse treated the low per protocol, and Rosa helped monitor. Within minutes of getting sugar, his slurred speech cleared, his strength returned, and the confusion lifted — the "stroke" dissolved as his blood sugar came up. It had never been a stroke at all. The nurse and Rosa kept watching, rechecked, and gave him a follow-up snack, knowing a low can rebound.',
                '**The outcome:** A dangerous low — disguised as a stroke — was caught and reversed within minutes. Had it been dismissed as a stroke to "wait and assess," or worse, had anyone guessed "high" and given insulin, the outcome could have been catastrophic. The nurse told Rosa: "You didn\'t try to diagnose it — you just gave me the three facts that mattered: diabetic, on insulin, didn\'t eat. That\'s why we checked the sugar first. You may have saved his brain."',
                '**Discussion:** Rosa\'s skill wasn\'t medical diagnosis — it was the trained instinct this course exists to build. She saw stroke-like signs in a diabetic resident who\'d missed food after insulin, and she thought low blood sugar instead of accepting the obvious. She escalated immediately with the key facts said out loud. She never gave insulin on a guess, never gave anything to someone who couldn\'t safely swallow, never overstepped. Recognize the disguise, escalate with the facts, stay in scope — and a "stroke" turned out to be a low, fixed in minutes.',
              ].join('\n\n'),
            },
            {
              id: 'bse-s11-reflection-1',
              type: 'reflection',
              prompt:
                'The signs looked exactly like a stroke. What three facts did Rosa recognize that made her think "low blood sugar," and why was saying them out loud to the nurse so powerful?',
              minCharacters: 50,
            },
            {
              id: 'bse-s11-reflection-2',
              type: 'reflection',
              prompt:
                'A coworker wanted to "wait for the nurse to assess," and a guess of "high" would have led to insulin. Why is thinking "low first" in a suddenly-changed diabetic resident, and never guessing-and-medicating, so important?',
              minCharacters: 50,
            },
            {
              id: 'bse-s11-rp-text',
              type: 'text',
              body: 'Reflect on the case study in the previous lesson. Your written responses help you apply what you learned about recognizing disguised lows, escalating with key facts, and running the treat-recheck response.',
            },
            {
              id: 'bse-s11-kc2-check',
              type: 'knowledge_check',
              question:
                'A CNA does not give or adjust insulin or any diabetes medication, and never decides a dose. When a conscious resident with diabetes who can safely swallow shows signs of low blood sugar, the CNA SHOULD:',
              options: [
                {
                  id: 'give-insulin',
                  label: 'Give insulin in case it\'s actually high',
                },
                {
                  id: 'treat-recheck',
                  label:
                    'Give fast-acting sugar per facility policy, alert the nurse, wait, and recheck',
                },
                {
                  id: 'decide-dose',
                  label: 'Decide how many glucose tablets to give without following policy',
                },
                {
                  id: 'wait-nurse',
                  label: 'Give nothing and wait for the nurse before any action',
                },
              ],
              correctOptionId: 'treat-recheck',
              explanation:
                'Give fast-acting sugar per facility policy, alert the nurse, wait, then recheck and re-treat if still low. You never give insulin, never decide a dose, and never skip the recheck.',
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
            { id: 'bse-s12-heading', type: 'heading', level: 1, text: 'Conclusion' },
            {
              id: 'bse-s12-video',
              type: 'video',
              title: 'Conclusion',
              videoUrl: `${ASSET_BASE}/s12-conclusion.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s12-conclusion.mp4`,
            },
            {
              id: 'bse-s12-image',
              type: 'image',
              src: `${ASSET_BASE}/s12-hero.jpg`,
              caption: 'Five things that matter most in blood-sugar emergencies.',
            },
            {
              id: 'bse-s12-narration',
              type: 'text',
              body: [
                'You\'ve reached the end of the drill. Let\'s lock in the five things that matter most for blood sugar emergencies.',
                '**One.** Low is fast, high is slower — and that sets your response. A low starves the brain within minutes, so you treat now. A high builds over hours, so you recognize and escalate. Speed is the first decision.',
                '**Two.** Lows wear disguises. In older adults, a low can look like a stroke, like intoxication, like dementia, or like a sudden "bad day." So in any diabetic resident who suddenly changes, think low blood sugar first, and get it checked — it\'s confirmed in seconds and fixed in minutes.',
                '**Three.** Run the response with the recheck. For a conscious resident who can swallow: fast-acting sugar per facility policy, alert the nurse, wait, then recheck and re-treat if still low. "Feels a bit better" is not the all-clear — the recheck is what catches the rebound.',
                '**Four.** Know the absolute rule and the severe high. Unconscious, can\'t swallow safely, or seizing — from a low or a high — nothing by mouth, emergency help now. Deep rapid breathing, fruity breath, vomiting, deep drowsiness — that\'s a severe high crisis, emergency help now. And illness always means extra vigilance.',
                '**Five.** Honor your scope, and report the facts that matter. You never diagnose, never give or adjust insulin, never decide a dose. But you recognize fast through the disguises, run the response, escalate correctly, and report the key facts — diabetic, what medications, what you saw, what you gave, the recheck, the trigger. That makes you the person to have in the room.',
              ].join('\n\n'),
            },
            {
              id: 'bse-s12-summary',
              type: 'summary',
              title: 'Five things that matter most',
              items: [
                'Low is fast, high is slower — a low starves the brain within minutes, so treat now.',
                'Lows wear disguises — in any diabetic resident who suddenly changes, think low first.',
                'Run the response with the recheck — "feels a bit better" is not the all-clear.',
                'Unconscious or can\'t swallow → nothing by mouth, emergency help now.',
                'Honor your scope — never give insulin or decide a dose; report the facts that matter.',
              ],
            },
            {
              id: 'bse-s12-whn-text',
              type: 'text',
              body: 'Ten questions are waiting. Everything on them was covered here. You\'re ready. Trust what you\'ve learned, and show what you know.',
            },
            {
              id: 'bse-s12-completion-text',
              type: 'text',
              body: 'This course provides one hour of continuing education credit through CAL ACE Nursing Academy, an approved CDPH continuing education provider, NAC number 7384. Your certificate is generated automatically when you pass the knowledge check.',
            },
            {
              id: 'bse-s12-completion-callout',
              type: 'callout',
              variant: 'info',
              title: 'Scope reminder',
              body: 'CNAs recognize, respond within policy, and escalate. CNAs do not diagnose, give or adjust insulin or any diabetes medication, or decide doses.',
            },
            {
              id: 'bse-s12-certificate-text',
              type: 'text',
              body: 'Your certificate is generated automatically when you pass the knowledge check. CDPH-Approved CE Provider — NAC #7384.',
            },
          ]),
      },
    ],
  },
];

export async function seedCourse27HypoglycemiaHyperglycemia(
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
    `Seeding Course 27 (Hypoglycemia & Hyperglycemia) as DRAFT — slug "${COURSE_SLUG}"…`,
  );

  try {
    const result = await seedCourse27HypoglycemiaHyperglycemia(prisma);
    const blockCounts = blockCountsByLesson();
    const totalBlocks = Object.values(blockCounts).reduce((sum, count) => sum + count, 0);

    console.log('Seed complete.');
    console.log(`  Course:   ${COURSE_TITLE}`);
    console.log(`  Slug:     ${COURSE_SLUG}`);
    console.log(`  Created:  ${result.courseCreated ? 'yes (new)' : 'no (updated existing)'}`);
    console.log(`  Modules:  ${result.modulesUpserted}`);
    console.log(`  Lessons:  ${result.lessonsUpserted}`);
    console.log(`  Strays cleaned: ${result.strayLessonsDeleted} lessons`);
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
