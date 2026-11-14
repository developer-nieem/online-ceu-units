/**
 * Seed Course 4 — Elder Abuse & Neglect: Recognition & Reporting (DRAFT).
 *
 * V3 rebuild of the former "Elder & Dependent Adult Abuse Reporting", aligned to
 * the 12–50 scaffold.
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-04-elder-abuse
 *
 * Idempotent upserts by slug. Self-cleans stray modules on the target DRAFT version.
 * Does not seed the final quiz (pending owner approval; see the -exam.ts file).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CONFIRMED against the live DB (read-only inspection):
 *   COURSE_SLUG    = 'elder-abuse-reporting'  (FROZEN — course already live)
 *   VERSION_NUMBER = 2                         (MAX existing version is v1 PUBLISHED
 *                                               with real content; this creates v2 as
 *                                               a new DRAFT revision, leaving v1 intact)
 * Only the DISPLAY TITLE changes — NOT the slug.
 * DRAFT-only. Run order: this main seed first, then the -exam seed.
 *
 * LEGAL-ACCURACY (by design — matches brand accuracy standard):
 *   This course teaches the DUTY and CNA workflow accurately but deliberately does
 *   NOT assert specific CA statute numbers, exact reporting timeframes, or outside-
 *   agency names. Where exact figures would go, it directs the learner to "your
 *   facility's policy and CDPH requirements." Do NOT add fabricated legal specifics.
 *
 * REPORTING CHAIN (locked): CNA reports to the NURSE / CHARGE NURSE immediately;
 *   the facility reports onward. The CNA's duty is to RECOGNIZE and REPORT.
 *
 * SENSITIVE CONTENT: abuse/neglect taught at recognize-and-report level, with
 *   dignity and trauma-awareness, no graphic detail. Scope boundaries (never
 *   investigate / confront / decide / stay silent) must be preserved exactly.
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
const COURSE_SLUG = 'elder-abuse-reporting';

// Display title changes to the recognition/reporting framing; slug stays frozen above.
const COURSE_TITLE = 'Spotting and Reporting Suspected Elder Mistreatment';
const COURSE_SUMMARY =
  'Recognize and report elder abuse and neglect: understand the forms of abuse and their signs, your duty as a mandated reporter, the reasonable-suspicion standard (report what you suspect — you don\'t need proof), and exactly what to do and never do — recognize, protect, preserve, and report to the nurse immediately, never investigate or confront. When in doubt, report.';

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
    'Recognize the types and signs of elder abuse and neglect',
    'Understand your mandated duty to report and the reasonable-suspicion standard',
    'Know what to do — and never do — when you suspect abuse',
    'Report suspected abuse to the nurse or charge nurse correctly and without delay',
    'Protect and support the resident with dignity, and preserve possible evidence',
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
  heroImage: '/assets/courses/elder-abuse-reporting/hero-banner.jpg',
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
    title: 'Understanding Abuse, Neglect & the Duty to Report',
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: 'Introduction',
        sortOrder: 0,
        buildContent: () =>
          doc('Introduction', [
            { id: 'abuse-s01-heading', type: 'heading', level: 1, text: 'Introduction' },
            {
              id: 'abuse-s01-video',
              type: 'video',
              title: 'Introduction',
              videoUrl: '/assets/courses/elder-abuse-reporting/s01-intro.mp4',
              placeholderNote: 'Pending upload: /assets/courses/elder-abuse-reporting/s01-intro.mp4',
            },
            {
              id: 'abuse-s01-image',
              type: 'image',
              src: '/assets/courses/elder-abuse-reporting/s01-hero.jpg',
              caption: 'A CAL ACE CNA providing attentive, trusted care.',
            },
            {
              id: 'abuse-s01-narration',
              type: 'text',
              body: [
                'Welcome to CAL ACE Nursing Academy.',
                'This course is about elder abuse and neglect — recognizing it, and reporting it. It carries a special weight, because as a CNA you are a mandated reporter. That means the law and your duty require you to report suspected abuse or neglect. You are not just allowed to speak up — you are required to. And often, you are the one person close enough to see what\'s happening.',
                'Let\'s define it plainly. Elder abuse is harm done to an older or dependent adult by someone in a position of trust or care. It comes in several forms: physical abuse — hitting, rough handling, improper restraint. Sexual abuse — any sexual contact without consent. Emotional or psychological abuse — threats, yelling, humiliation, isolation. Financial abuse — stealing or misusing a resident\'s money or property. And neglect — the failure to provide needed care, food, hygiene, or safety, which can be just as harmful as active abuse. Abuse can come from staff, family, visitors, or other residents.',
                'Here\'s why your role matters so much. Abuse and neglect of elders are far more common than most people realize, and they are badly underreported — because victims often can\'t or won\'t tell. Many residents are frail, confused, afraid of retaliation, ashamed, or dependent on the very person harming them. Some, as you\'ve learned, can\'t communicate at all. So the harm hides. And the person most likely to notice the bruise, the fear, the missing money, the worsening neglect — is the caregiver at the bedside every day. That\'s you.',
                'This course teaches you to recognize the signs of each kind of abuse and neglect, to understand your duty to report, and to know exactly what to do — and what not to do — when you suspect it. The "what not to do" matters: you do not investigate, you do not confront the suspected abuser, and you do not decide for yourself whether it "really" happened. Your job is to recognize, protect the resident, and report.',
                'The guiding spirit of this course: when in doubt, report. You are not required to be certain or to prove anything — you are required to report what you reasonably suspect, and let the proper people look into it. Reporting a suspicion that turns out to be nothing is far better than staying silent while a resident is harmed.',
                'Your scope is clear. A CNA recognizes signs of abuse and neglect, protects and supports the resident, preserves the scene, and reports suspected abuse to the nurse or charge nurse immediately — every time. A CNA does not investigate, does not confront the suspected abuser, does not decide whether abuse occurred, and never stays silent.',
                'By the end of this course, you will be able to: recognize the types and signs of elder abuse and neglect. Understand your mandated duty to report. Know what to do — and not do — when you suspect abuse. And report correctly and without delay. Let\'s begin.',
              ].join('\n\n'),
            },
            {
              id: 'abuse-s01-callout',
              type: 'callout',
              variant: 'warning',
              title: 'You are a mandated reporter',
              body: 'The law and your duty require you to report suspected abuse and neglect to the nurse or charge nurse immediately. Recognize, protect, report — never investigate, confront the suspected abuser, decide whether it "really" happened, or stay silent. When in doubt, report.',
            },
          ]),
      },
      {
        slug: 's02-terms',
        title: 'Terms & Definitions',
        sortOrder: 1,
        buildContent: () =>
          doc('Terms & Definitions', [
            { id: 'abuse-s02-heading', type: 'heading', level: 1, text: 'Terms & Definitions' },
            {
              id: 'abuse-s02-image',
              type: 'image',
              src: '/assets/courses/elder-abuse-reporting/s02-hero.jpg',
              caption: 'Knowing the types of abuse helps caregivers recognize the signs.',
            },
            {
              id: 'abuse-s02-reveal-abuse',
              type: 'reveal_card',
              frontTitle: 'Elder / Dependent Adult Abuse',
              frontBody: 'Elder or dependent adult abuse',
              backTitle: 'Elder / Dependent Adult Abuse',
              backBody:
                'Harm done to an older adult, or to a dependent adult who relies on others for care, by someone in a position of trust. It includes physical, sexual, emotional, and financial abuse, and neglect. It can come from staff, family, visitors, or other residents — and recognizing and reporting it is part of every caregiver\'s duty.',
            },
            {
              id: 'abuse-s02-reveal-mandated',
              type: 'reveal_card',
              frontTitle: 'Mandated Reporter',
              frontBody: 'Mandated reporter',
              backTitle: 'Mandated Reporter',
              backBody:
                'A person whom the law requires to report suspected abuse or neglect — and as a CNA, you are one. This isn\'t optional. You don\'t have to be certain or prove anything; you are required to report what you reasonably suspect. Failing to report suspected abuse is a serious violation of your duty and the law.',
            },
            {
              id: 'abuse-s02-reveal-physical',
              type: 'reveal_card',
              frontTitle: 'Physical Abuse',
              frontBody: 'Physical abuse',
              backTitle: 'Physical Abuse',
              backBody:
                'Causing bodily harm — hitting, slapping, pushing, rough handling, improper use of restraints, or force-feeding. Signs include unexplained bruises, marks, burns, or injuries — especially ones that don\'t match the explanation given, or appear in patterns like grip marks. Any suspected physical abuse is reported to the nurse right away.',
            },
            {
              id: 'abuse-s02-reveal-sexual',
              type: 'reveal_card',
              frontTitle: 'Sexual Abuse',
              frontBody: 'Sexual abuse',
              backTitle: 'Sexual Abuse',
              backBody:
                'Any sexual contact or act without consent — and residents who are confused or unable to consent cannot give it. This is among the most serious and hidden forms of abuse. Signs may include injury, fear, or distress around certain people or care. Suspected sexual abuse is reported immediately, and the resident is protected and treated with great care and dignity.',
            },
            {
              id: 'abuse-s02-reveal-emotional',
              type: 'reveal_card',
              frontTitle: 'Emotional / Psychological Abuse',
              frontBody: 'Emotional or psychological abuse',
              backTitle: 'Emotional / Psychological Abuse',
              backBody:
                'Harming a resident\'s mental wellbeing — yelling, threatening, insulting, humiliating, intimidating, ignoring, or isolating them. It leaves no bruises but does real damage. Signs include fear, withdrawal, anxiety, or a resident who becomes upset or silent around a certain person. It is abuse, and it is reportable.',
            },
            {
              id: 'abuse-s02-reveal-financial',
              type: 'reveal_card',
              frontTitle: 'Financial Abuse',
              frontBody: 'Financial abuse',
              backTitle: 'Financial Abuse',
              backBody:
                'Stealing or misusing a resident\'s money, property, or belongings — taking cash, valuables, or checks, or pressuring them about money. Signs include missing items or money, unexplained account changes, or someone overly interested in a resident\'s finances. CNAs report suspected financial abuse just like any other kind.',
            },
            {
              id: 'abuse-s02-reveal-neglect',
              type: 'reveal_card',
              frontTitle: 'Neglect',
              frontBody: 'Neglect',
              backTitle: 'Neglect',
              backBody:
                'The failure to provide the care a resident needs — food, water, hygiene, clean clothing, repositioning, medical attention, or a safe environment. Neglect can be as harmful as active abuse. Signs include poor hygiene, weight loss, dehydration, untreated wounds or pressure injuries, soiled conditions, or unmet needs. It is reportable harm.',
            },
            {
              id: 'abuse-s02-reveal-suspicion',
              type: 'reveal_card',
              frontTitle: 'Reasonable Suspicion',
              frontBody: 'Reasonable suspicion',
              backTitle: 'Reasonable Suspicion',
              backBody:
                'The standard for reporting — you report when you reasonably suspect abuse or neglect, not only when you\'ve proven it. You don\'t investigate or gather proof; if something makes you genuinely concerned that a resident is being harmed, that\'s enough to report. When in doubt, report. It is always better to report and be wrong than to stay silent.',
            },
            {
              id: 'abuse-s02-knowledge-check',
              type: 'knowledge_check',
              question: 'What does it mean that a CNA is a "mandated reporter"?',
              options: [
                { id: 'required', label: 'Required by law to report suspected abuse and neglect — not optional' },
                { id: 'optional', label: 'May report abuse if they feel like it' },
                { id: 'proof', label: 'Only reports when they have solid proof' },
              ],
              correctOptionId: 'required',
              explanation:
                'A mandated reporter is required by law to report suspected abuse and neglect — it is not optional, and you don\'t need proof. You report reasonable suspicion to the nurse or charge nurse. Failing to report is a serious violation of duty and law.',
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
            { id: 'abuse-s03-heading', type: 'heading', level: 1, text: 'Statistics' },
            {
              id: 'abuse-s03-image',
              type: 'image',
              src: '/assets/courses/elder-abuse-reporting/s03-hero.jpg',
              caption: 'The caregiver at the bedside is often the first to notice.',
            },
            pendingAudio(
              'abuse-s03-audio',
              'Elder Abuse: Common, Hidden, and Why the CNA\'s Eyes Matter Most',
              '/assets/courses/elder-abuse-reporting/s03-stats-podcast.mp3',
              [
                'Elder Abuse: Common, Hidden, and Why the CNA\'s Eyes Matter Most',
                '',
                'Elder abuse and neglect are far more common than most people realize, and one of the hardest truths about them is how badly they are underreported. Studies of older adults consistently find that only a small fraction of abuse cases are ever reported to authorities — for every case that comes to light, many more stay hidden. The reasons are heartbreaking and specific to this population: victims are often frail, dependent, confused, or unable to communicate; they may be afraid of retaliation from the very person they depend on; they may feel shame, or believe they won\'t be believed; and some, as caregivers know, cannot tell anyone at all because they\'ve lost the ability to speak. The harm, in other words, is built to stay invisible.',
                '',
                'That invisibility is exactly why the caregiver at the bedside is so important. Abuse can come from many directions — staff, family members, visitors, or even other residents — and it takes many forms: physical, sexual, emotional, and financial abuse, and neglect. Each leaves its own traces, and many of those traces are subtle: a bruise in an odd place, a resident who flinches or goes quiet around a certain person, money or belongings that go missing, hygiene and weight that quietly decline. The person most likely to notice these small signals, day after day, is the CNA — the one giving the bath, serving the meals, present for the ordinary moments. No one else in the system has that vantage point.',
                '',
                'This is why CNAs are mandated reporters — required by law to report suspected abuse and neglect. The standard is important and freeing: you report what you reasonably suspect, not what you\'ve proven. You are never asked to investigate, to gather evidence, to confront anyone, or to be certain — those jobs belong to others. You are asked to recognize concerning signs and to report them to the proper person, promptly. Research on abuse detection is clear that frontline caregivers who know the signs and report them are one of the most important protections vulnerable residents have, and that the biggest failure is not wrong reports — it\'s silence, the suspicions that go unspoken.',
                '',
                'The consequences of abuse and neglect are severe — injury, decline, fear, loss of dignity, financial ruin, and even death — and they fall on people least able to protect themselves. But the encouraging core is that recognition and reporting work: when caregivers catch the signs and report them up the chain, harm gets stopped, residents get protected, and patterns get caught before they escalate. The bottom line: elder abuse is common, deliberately hidden, and badly underreported; victims often can\'t or won\'t speak; CNAs are mandated reporters with a unique vantage point; and recognizing the signs and reporting them — when in doubt, report — is one of the most protective things a caregiver does.',
              ].join('\n'),
              '/assets/courses/elder-abuse-reporting/s03-stats-podcast.mp3',
            ),
            {
              id: 'abuse-s03-source-note',
              type: 'callout',
              variant: 'clinical',
              title: 'About these figures',
              body: 'This section describes elder abuse qualitatively (e.g., "only a small fraction of cases are reported," "far more common than most realize") rather than citing specific numbers. Any precise statistic added later must come from a named, verifiable source — not from estimation. Report suspected abuse to your nurse or charge nurse per facility policy and CDPH requirements.',
            },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: 'Fundamentals',
        sortOrder: 3,
        buildContent: () =>
          doc('Fundamentals', [
            { id: 'abuse-s04-heading', type: 'heading', level: 1, text: 'Fundamentals' },
            {
              id: 'abuse-s04-video',
              type: 'video',
              title: 'Fundamentals',
              videoUrl: '/assets/courses/elder-abuse-reporting/s04-fundamentals.mp4',
              placeholderNote: 'Pending upload: /assets/courses/elder-abuse-reporting/s04-fundamentals.mp4',
            },
            {
              id: 'abuse-s04-image',
              type: 'image',
              src: '/assets/courses/elder-abuse-reporting/s04-hero.jpg',
              caption: 'Watchful, respectful care protects vulnerable residents.',
            },
            {
              id: 'abuse-s04-narration',
              type: 'text',
              body: [
                '**The forms abuse takes**',
                'Abuse wears several faces, and knowing them helps you spot them. Physical — hitting, rough handling, improper restraint. Sexual — any contact without consent, including with a resident who can\'t consent. Emotional — yelling, threats, humiliation, isolation, leaving no marks but real harm. Financial — stealing or misusing money and property. And neglect — failing to provide needed care. A resident may suffer more than one kind at once. You don\'t have to label which type is which — you just have to notice harm and report it.',
                '**Neglect: harm by what\'s NOT done**',
                'Neglect deserves special attention, because it\'s easy to overlook — it\'s harm caused by absence, not action. A resident left unfed, unwashed, unrepositioned, in soiled clothing, with untreated wounds, or without needed care, is being harmed just as truly as one who is struck. It can be active — deliberately withholding care — or it can come from a system stretched too thin. Either way, it\'s reportable. And self-neglect, where a resident can no longer care for themselves safely, also needs reporting so they can get help. Neglect harms quietly; name it and report it.',
                '**Who abuses, and who\'s most at risk**',
                'Abuse can come from anyone in a resident\'s world — staff, family, visitors, or other residents — so you watch in every direction, not just at strangers. And some residents are at especially high risk: those who are confused or have dementia, those who can\'t communicate, those who are very dependent, isolated, or without visitors, and those who are difficult to care for. The cruel pattern is that the most vulnerable — the ones least able to tell or defend themselves — are the most likely to be harmed and the least likely to be heard. Watch over them most closely.',
                '**Why victims stay silent**',
                'Understanding why victims don\'t tell helps you see past the silence. They may be afraid of retaliation from someone they depend on. They may feel shame or self-blame. They may fear no one will believe them, or that telling will make things worse. They may be confused, or unable to speak at all. They may even protect the abuser, especially a family member. So you cannot wait for a resident to report — many never will. The silence is part of the harm, and it means the responsibility to notice and report falls to you.',
                '**You are a mandated reporter**',
                'This is the heart of the course: as a CNA, you are a mandated reporter. The law and your duty require you to report suspected abuse and neglect — it is not a choice, and not something you can leave to someone else. The standard is reasonable suspicion: you report what you genuinely suspect, not what you\'ve proven. You don\'t need certainty, evidence, or permission. Failing to report suspected abuse is a serious failure of your legal and professional duty. When something makes you reasonably believe a resident is being harmed, you are required to report it.',
                '**What you do — and never do**',
                'Your job has clear edges. You DO: recognize signs, keep the resident safe, support them with calm and compassion, preserve anything that might matter, and report to the nurse or charge nurse immediately. You do NOT: investigate or gather proof — that\'s not your role. You do NOT confront or accuse the suspected abuser — that can endanger the resident, you, and any later investigation. You do NOT decide for yourself whether abuse "really" happened — you report the suspicion and let the proper people determine that. And you never, ever stay silent. Recognize, protect, report — nothing more, nothing less.',
                '**When in doubt, report**',
                'End on the rule that frees you to act: when in doubt, report. You may worry you\'re not sure, that you might be wrong, that it might cause trouble. Set that worry down. You are not required to be right — you are required to report what you reasonably suspect. A report that turns out to be nothing costs little; silence while a resident is harmed can cost everything. The proper people will look into it; your job is simply to make sure the suspicion is spoken, not buried. If part of you is worried a resident is being harmed — that\'s your signal to report.',
              ].join('\n\n'),
            },
            {
              id: 'abuse-s04-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Recognize, protect, report — never the rest',
              body: 'You DO: recognize signs, protect and support the resident, preserve possible evidence, report to the nurse immediately. You do NOT: investigate, confront or accuse the suspected abuser, decide whether abuse "really" happened, or stay silent. The standard is reasonable suspicion — not proof.',
            },
          ]),
      },
    ],
  },
  {
    slug: 'module-2',
    title: 'Recognizing the Signs & Understanding the Causes',
    sortOrder: 1,
    lessons: [
      {
        slug: 's05-signs',
        title: 'Signs & Symptoms',
        sortOrder: 0,
        buildContent: () =>
          doc('Signs & Symptoms', [
            { id: 'abuse-s05-heading', type: 'heading', level: 1, text: 'Signs & Symptoms' },
            {
              id: 'abuse-s05-image',
              type: 'image',
              src: '/assets/courses/elder-abuse-reporting/s05-hero.jpg',
              caption: 'Subtle changes in mood or behavior can be warning signs.',
            },
            {
              id: 'abuse-s05-narration',
              type: 'text',
              body: [
                'You are the eyes that catch abuse and neglect — often in small, quiet signs. Let\'s learn what to watch for across each form.',
                '**Signs of physical and sexual abuse**',
                'Watch the body and the explanations. Physical signs: unexplained bruises, marks, cuts, burns, or fractures — especially injuries that don\'t match the story given, that appear in patterns like grip or slap marks, or that show up repeatedly. Marks from restraints on wrists or ankles. A resident who flinches at touch or movement. For possible sexual abuse: injury, bruising, or bleeding in private areas, torn or stained clothing, or a resident who is suddenly fearful, distressed, or withdrawn around certain people or during care. These signs are serious — observe carefully, protect the resident, and report to the nurse right away. You don\'t diagnose; you report what you see.',
                '**Signs of emotional and financial abuse**',
                'These leave no bruises, so watch behavior and circumstances. Emotional abuse signs: a resident who is fearful, anxious, withdrawn, or unusually quiet — especially around a particular person. New depression, agitation, or trembling. Being talked to harshly, threatened, demeaned, or ignored. A resident who won\'t speak freely when someone is present. Financial abuse signs: missing money, valuables, or belongings. Unexplained money worries or account changes. A person — staff, family, or visitor — who seems overly controlling or interested in the resident\'s finances, or who pressures them. Report these concerns too; they\'re as real as any bruise.',
                '**Signs of neglect**',
                'Neglect shows in unmet needs. Watch for: poor hygiene — unwashed body, hair, dirty nails, bad odor. Weight loss, signs of dehydration, or a resident who seems underfed. Untreated wounds, worsening pressure injuries, or other ignored medical needs. Soiled clothing or bedding left unchanged. A resident left alone, unsafe, or without needed help, water, or call light. Inappropriate clothing for the weather. These signs mean a resident isn\'t getting the care they need — whether from one person or a stretched system — and that is reportable harm. Notice the unmet need, and report it.',
                '**Behavior changes, and what to report**',
                'Sometimes the clearest sign is a change in the resident. Watch for: sudden fear, withdrawal, or personality change. Becoming anxious, depressed, or agitated, especially around a specific person or situation. Flinching, cowering, or unusual quiet. A resident who hints at something but seems afraid to say it. Take these seriously. And report it all — to the nurse or charge nurse, immediately, every time. Report the signs you see and the changes you notice; report what a resident tells you; report your reasonable suspicion even when you\'re unsure. You report; the proper people look into it. The one thing you never do is stay silent.',
              ].join('\n\n'),
            },
            {
              id: 'abuse-s05-callout',
              type: 'callout',
              variant: 'warning',
              title: 'Report every sign, every change, every suspicion',
              body: 'Across all forms — physical/sexual injuries, emotional fear and withdrawal, missing money, neglect\'s unmet needs, and behavior changes around a certain person — report to the nurse or charge nurse immediately. You don\'t diagnose; you report what you see. The one thing you never do is stay silent.',
            },
          ]),
      },
      {
        slug: 's06-causes',
        title: 'Causes',
        sortOrder: 1,
        buildContent: () =>
          doc('Causes', [
            { id: 'abuse-s06-heading', type: 'heading', level: 1, text: 'Causes' },
            {
              id: 'abuse-s06-image',
              type: 'image',
              src: '/assets/courses/elder-abuse-reporting/s06-hero.jpg',
              caption: 'Understanding contributing factors — without ever excusing harm.',
            },
            pendingAudio(
              'abuse-s06-audio',
              'What Contributes to Elder Abuse — Understanding It Without Excusing It',
              '/assets/courses/elder-abuse-reporting/s06-causes-podcast.mp3',
              [
                'What Contributes to Elder Abuse — Understanding It Without Excusing It',
                '',
                'Understanding what contributes to elder abuse and neglect helps caregivers stay alert to risk — with one firm principle stated up front: explaining contributing factors never excuses abuse. Abuse is always the responsibility of the person who commits it, never the fault of the vulnerable resident who suffers it.',
                '',
                'Some contributors sit with the people who provide care. Caregiver stress and burnout are real factors — an overwhelmed, exhausted, unsupported caregiver is at higher risk of losing patience, handling residents roughly, or neglecting needs, which is one more reason caregiver wellbeing matters. Lack of training plays a role: a caregiver who doesn\'t know safe techniques, or how to handle difficult behaviors, may cause harm without even intending abuse. Understaffing and impossible workloads contribute heavily to neglect — when there aren\'t enough hands, residents go unfed, unturned, and unwashed, not always from cruelty but from a system stretched past what it can deliver. None of these excuse harm, but recognizing them helps explain how neglect in particular can creep into a setting, and why reporting it matters even when no one is being deliberately cruel.',
                '',
                'Some contributors sit with the abuser. Abuse can come from people with their own problems — substance use, mental illness, a history of violence, or financial dependence on the resident, which is a common driver of financial abuse and neglect by family. Some abusers are simply people who exploit power over the vulnerable. Abusers are often in positions of trust — staff, family, visitors — which is exactly what makes the abuse hard to see and hard to believe. And it\'s worth naming that resident-to-resident aggression, especially among residents with dementia, is a real and often overlooked source of harm that also requires recognition and reporting.',
                '',
                'And some factors sit with the situation, raising a resident\'s risk of being targeted. Residents who are isolated and have few visitors are more vulnerable, because fewer outside eyes are watching. Residents with dementia or communication loss are at high risk because they can\'t report or may not be believed. Heavy dependence on a caregiver, and social isolation, both increase risk. These factors don\'t cause abuse — but they tell you which residents to watch over most carefully.',
                '',
                'Here\'s the takeaway for the CNA. You can\'t fix the staffing, cure the burnout, or change who a resident\'s family is — and recognizing these contributors is not about assigning blame to circumstances or excusing anyone. What you can do is two things. First, be part of the prevention: support your stressed coworkers, use good technique, speak up about unsafe staffing through proper channels, and never let your own stress become rough or neglectful care. Second, and most important, recognize and report — knowing that the most vulnerable, isolated, and dependent residents need your watchful eyes the most. The bottom line: abuse and neglect have contributing factors in caregivers, abusers, and situations, but the responsibility is always the abuser\'s — and the CNA\'s job is to watch the most vulnerable closely and report any reasonable suspicion.',
              ].join('\n'),
              '/assets/courses/elder-abuse-reporting/s06-causes-podcast.mp3',
            ),
            {
              id: 'abuse-s06-callout',
              type: 'callout',
              variant: 'warning',
              title: 'Contributors never excuse abuse',
              body: 'Stress, understaffing, and an abuser\'s own problems may contribute to harm, but the responsibility is always the abuser\'s — never the vulnerable resident\'s fault. Understanding causes tells you which residents to watch closest; it never changes the duty to report.',
            },
          ]),
      },
      {
        slug: 's07-medications',
        title: 'The Response: Recognize, Protect, Preserve, Report',
        sortOrder: 2,
        buildContent: () =>
          doc('The Response: Recognize, Protect, Preserve, Report', [
            { id: 'abuse-s07-heading', type: 'heading', level: 1, text: 'The Response: Recognize, Protect, Preserve, Report' },
            {
              id: 'abuse-s07-image',
              type: 'image',
              src: '/assets/courses/elder-abuse-reporting/s07-hero.jpg',
              caption: 'The most isolated and dependent residents need the closest watch.',
            },
            {
              id: 'abuse-s07-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'The workflow, and its limits',
              body: 'There is no medication for abuse — the response is a workflow: recognize, protect, preserve, and report to the nurse immediately. You never investigate, confront or accuse the suspected abuser, decide whether abuse occurred, warn the abuser, or stay silent.',
            },
            {
              id: 'abuse-s07-narration',
              type: 'text',
              body: [
                'There\'s no medication for abuse — the response is a workflow, and getting it right protects the resident and makes sure the harm is stopped. Let\'s walk through exactly what to do, and what never to do. And the rule that frames it all: your job is to recognize, protect, preserve, and report — not to investigate, confront, or decide.',
                '**Recognize and take it seriously.** It starts with noticing — the signs and changes you just learned, across every form of abuse and neglect — and not explaining them away. If a resident tells you about abuse, or hints at it, listen calmly, gently, and without pressure; take them seriously, don\'t interrogate or doubt them, and reassure them they did right to tell you. Believe enough to report. Dismissing a sign or a disclosure is how harm continues.',
                '**Protect and support the resident.** The resident\'s safety and dignity come first. If a resident is in immediate danger, get them to safety and get the nurse now. Keep them away from the suspected abuser where you can. Support them with calm, warmth, and reassurance — they may be frightened, ashamed, or traumatized. Treat any disclosure with great care and never make them feel blamed or disbelieved. Their protection is the point of everything else.',
                '**Preserve the scene.** Help the proper people find the truth: if there are signs of physical or sexual abuse, don\'t clean up, wash the resident, or change clothing or bedding more than safety and dignity require, and tell the nurse before doing so — evidence can matter. Don\'t disturb the area. You\'re not collecting evidence — you\'re simply not destroying it before the nurse and the proper process can act.',
                '**Report to the nurse or charge nurse — immediately.** This is the core duty. Report any suspected abuse or neglect to the nurse or charge nurse right away — every time, without delay. Report what you observed and what the resident said, factually and specifically. The facility then carries the report onward as required, following CDPH requirements and facility policy for timeframes and outside notification — that part is handled above you, by the proper channels. Your duty is to get the suspicion to the nurse, promptly and clearly. Document factually if your facility directs. Reporting up the chain is exactly what a mandated reporter does.',
                '**Never do these.** And hold these lines firmly. Never investigate or try to gather proof — not your role, and it can interfere with the real process. Never confront or accuse the suspected abuser — it can endanger the resident, endanger you, and wreck any investigation. Never decide for yourself that it "wasn\'t really abuse" and drop it — you report the suspicion; others determine the truth. Never warn the suspected abuser or discuss it with them. And never, ever stay silent or look the other way — silence makes you part of the harm.',
                'The scope point: you recognize, protect, preserve, and report to the nurse immediately — and you never investigate, confront, decide, or stay silent. When in doubt, report. That workflow is the care you deliver.',
              ].join('\n\n'),
            },
            {
              id: 'abuse-s07-disclosure-callout',
              type: 'callout',
              variant: 'warning',
              title: 'If a resident discloses',
              body: 'Listen calmly, believe them, don\'t interrogate, and reassure them they did right to tell you. Don\'t wash or clean possible evidence before telling the nurse. NEVER confront the suspected abuser. NEVER agree to keep it secret. NEVER stay silent. Report to the nurse immediately.',
            },
          ]),
      },
      {
        slug: 's08-prevention',
        title: 'Prevention',
        sortOrder: 3,
        buildContent: () =>
          doc('Prevention', [
            { id: 'abuse-s08-heading', type: 'heading', level: 1, text: 'Prevention' },
            {
              id: 'abuse-s08-image',
              type: 'image',
              src: '/assets/courses/elder-abuse-reporting/s08-hero.jpg',
              caption: 'Careful, accurate observation supports protection.',
            },
            {
              id: 'abuse-s08-narration',
              type: 'text',
              body: [
                'You help prevent abuse and neglect every day — by your own care, your vigilance, and your willingness to speak up. Here are seven ways.',
                '**One. Give safe, gentle, respectful care — always.** The first prevention is your own practice: never rough, never rushed into harm, never neglectful, even on the hardest day. Use good technique, keep your patience, and treat every resident with dignity. When you\'re stressed or burned out, get support rather than letting it spill into your care. Your own gentle, reliable care is abuse prevention at its most basic.',
                '**Two. Watch over the most vulnerable closely.** The residents at highest risk — those with dementia, those who can\'t communicate, the isolated, the very dependent, those without visitors — need your eyes the most, because they can least protect or speak for themselves. Give them extra attention and watchfulness. Being closely watched over is itself a protection for those who can\'t call for help.',
                '**Three. Know the signs — across every form.** Keep the signs fresh in your mind: physical, sexual, emotional, and financial abuse, and neglect. The better you recognize them, the sooner harm is caught. Stay alert to the small, quiet signals — the odd bruise, the fearful silence, the missing money, the slipping hygiene. Knowing what to look for is what makes you able to protect.',
                '**Four. Take disclosures and changes seriously.** Never brush off a resident who hints at or tells you about harm, and never explain away a worrying sign or a sudden fearful change. Taking these seriously — instead of assuming it\'s nothing — is what stops harm from continuing in silence. Believe enough to report.',
                '**Five. Report promptly — every time.** Don\'t sit on a concern, hoping it resolves or fearing you\'re wrong. Report reasonable suspicion to the nurse right away, every time. Prompt reporting stops harm sooner and catches patterns early. The faster a suspicion is spoken, the faster a resident is protected. When in doubt, report.',
                '**Six. Support your coworkers — and the culture.** Help create a setting where good care is the norm and harm has nowhere to hide: support stressed coworkers, speak up about unsafe staffing through proper channels, and never look the other way at a colleague\'s rough or neglectful care. A team that watches out for residents — and holds each other to high standards — prevents abuse far better than one that stays silent.',
                '**Seven. Never look away.** The final prevention is simple courage: never ignore, minimize, or stay silent about suspected abuse or neglect. Silence protects abusers; reporting protects residents. Your willingness to notice and to speak up — even when it\'s uncomfortable — is the single most powerful prevention there is. Be the one who doesn\'t look away.',
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
        title: 'When and How to Report',
        sortOrder: 0,
        buildContent: () =>
          doc('When and How to Report', [
            {
              id: 'abuse-s09-heading',
              type: 'heading',
              level: 1,
              text: 'When and How to Report',
            },
            pendingAudio(
              'abuse-s09-intro-audio',
              'Reporting a suspicion, and never handling it yourself — intro',
              '/assets/courses/elder-abuse-reporting/s09-emergency-intro.mp3',
              'In this course, the judgments that matter most are reporting a reasonable suspicion even when you\'re not certain, and never staying silent or trying to handle it yourself. You\'re about to work through two situations. Read each carefully, choose your action, and you\'ll get feedback right away. Keep the core ideas in mind: you report what you reasonably suspect to the nurse — you don\'t need proof, you don\'t investigate, and you never confront the suspected abuser.',
              '/assets/courses/elder-abuse-reporting/s09-emergency-intro.mp3',
            ),
            {
              id: 'abuse-s09-image',
              type: 'image',
              src: '/assets/courses/elder-abuse-reporting/s09-hero.jpg',
              caption: 'Report a reasonable suspicion to the nurse — you do not need proof.',
            },
            {
              id: 'abuse-s09-scenario-suspicion-image',
              type: 'image',
              src: '/assets/courses/elder-abuse-reporting/s09-scenario-suspicion.jpg',
              caption: 'A concerning sign noticed during care warrants a report.',
            },
            {
              id: 'abuse-s09-scenario-suspicion',
              type: 'scenario_question',
              prompt:
                'While bathing Mrs. Adeyemi, you notice several bruises on her upper arms that look like grip marks, and a few on her back. When you gently ask what happened, she looks frightened, glances at the door, and says quietly, "Nothing... I\'m just clumsy." You\'re not certain anything is wrong, and you don\'t want to cause trouble or accuse anyone unfairly. What SHOULD the CNA do?',
              options: [
                {
                  id: 'say-nothing',
                  label: 'Say nothing — you\'re not sure, and you don\'t want to cause trouble',
                  feedback:
                    'You are a mandated reporter, and you report reasonable suspicion — you do NOT need proof or certainty. Grip-pattern bruises, a frightened reaction, and an explanation that doesn\'t fit are real concerns. Saying nothing because you "might be wrong" is exactly the silence the duty exists to prevent. The right action: report your concern to the nurse or charge nurse right away — factually, promptly — and let the proper people look into it.',
                },
                {
                  id: 'report-it',
                  label: 'Report your concern to the nurse or charge nurse right away — you report reasonable suspicion, you don\'t need proof',
                  feedback:
                    'Exactly right. You are a mandated reporter, and the standard is reasonable suspicion — not proof, not certainty. What you\'ve noticed is genuinely concerning: bruises in a grip-mark pattern on the upper arms and back, plus a frightened reaction and an explanation that doesn\'t fit ("just clumsy" while glancing fearfully at the door). You don\'t have to know who did it, prove it happened, or be sure — that worry is exactly what the "when in doubt, report" rule is built to overcome. Report your concern to the nurse or charge nurse right away: tell them factually what you saw and what she said. Don\'t investigate or question other staff and family yourself — that\'s not your role and can interfere with the proper process. Don\'t confront anyone. And don\'t let "I might be wrong" or "I don\'t want trouble" talk you into silence — a report that turns out to be nothing costs almost nothing, but silence while a resident is being harmed can cost everything. You report; the proper people look into it. Reporting your honest suspicion is exactly doing your job.',
                  isRecommended: true,
                },
                {
                  id: 'investigate',
                  label: 'Investigate yourself to find out who did it before reporting',
                  feedback:
                    'Investigating is not your role and can interfere with the proper process. You don\'t need to know who did it or prove anything — you report reasonable suspicion. The right action: report your concern to the nurse or charge nurse right away, factually, and let the proper people look into it.',
                },
                {
                  id: 'ask-around',
                  label: 'Ask the other staff and family who might have done it',
                  feedback:
                    'Questioning staff and family yourself is investigating — not your role, and it can interfere with the proper process and tip off an abuser. You report what you reasonably suspect; others look into who and how. The right action: report your concern to the nurse or charge nurse right away, factually and promptly.',
                },
              ],
              requiredForCompletion: true,
            },
            {
              id: 'abuse-s09-scenario-witness-image',
              type: 'image',
              src: '/assets/courses/elder-abuse-reporting/s09-scenario-witness.jpg',
              caption: 'Witnessing something improper: report through proper channels.',
            },
            {
              id: 'abuse-s09-scenario-witness',
              type: 'scenario_question',
              prompt:
                'You walk in and see another caregiver roughly handling Mr. Davies — yanking him by the arm and speaking to him harshly — and Mr. Davies looks frightened. The caregiver notices you and says, "He was being difficult. Don\'t make a big deal out of this — just keep it between us, okay?" What SHOULD the CNA do?',
              options: [
                {
                  id: 'keep-secret',
                  label: 'Keep it between you — they asked, and you don\'t want conflict',
                  feedback:
                    'Agreeing to "keep it between us" makes you complicit in covering up abuse — never acceptable, no matter who asks. What you saw is physical and emotional abuse of a frightened resident, and it\'s reportable regardless of injury level. The right action: report what you saw to the nurse or charge nurse immediately, and never agree to keep suspected abuse secret.',
                },
                {
                  id: 'confront',
                  label: 'Confront and accuse the caregiver directly on the spot',
                  feedback:
                    'Confronting and accusing the caregiver yourself is not your role — it can escalate the situation, endanger the resident or you, and interfere with how it needs to be handled. The right action: report what you saw to the nurse or charge nurse immediately, factually and specifically, and let the proper people handle it.',
                },
                {
                  id: 'report-witness',
                  label: 'Report what you saw to the nurse or charge nurse immediately — and never agree to keep abuse secret',
                  feedback:
                    'Right. You witnessed rough handling and harsh treatment of a frightened resident — that\'s physical and emotional abuse, and it\'s reportable, full stop. Agreeing to "keep it between us" would make you complicit in covering up abuse, and that\'s never acceptable no matter who asks; you never agree to keep suspected abuse secret. But notice the other trap too: confronting and accusing the caregiver directly on the spot is also not your role — it can escalate the situation, endanger the resident or you, and interfere with how it needs to be handled. And "the resident wasn\'t seriously hurt" doesn\'t matter — abuse is abuse regardless of the injury level. The right action is to report what you saw to the nurse or charge nurse immediately, factually and specifically — what you witnessed, what was said, how Mr. Davies looked — and let the proper people handle it from there. Protect the resident, report up the chain, and never stay silent. That\'s exactly the mandated reporter\'s job.',
                  isRecommended: true,
                },
                {
                  id: 'ignore',
                  label: 'Ignore it since the resident wasn\'t seriously hurt',
                  feedback:
                    'The injury level doesn\'t change that this is abuse — rough handling and harsh treatment of a frightened resident is reportable, full stop. Ignoring it fails the resident. The right action: report what you saw to the nurse or charge nurse immediately, and never stay silent.',
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
            { id: 'abuse-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
              id: 'abuse-s10-video',
              type: 'video',
              title: "The CNA's Role",
              videoUrl: '/assets/courses/elder-abuse-reporting/s10-cna-role.mp4',
              placeholderNote: 'Pending upload: /assets/courses/elder-abuse-reporting/s10-cna-role.mp4',
            },
            {
              id: 'abuse-s10-image',
              type: 'image',
              src: '/assets/courses/elder-abuse-reporting/s10-hero.jpg',
              caption: 'The CNA as mandated reporter and everyday advocate.',
            },
            {
              id: 'abuse-s10-narration',
              type: 'text',
              body: [
                'Your role with abuse and neglect is to be the watchful, protective, truthful presence who recognizes harm and reports it. Let\'s walk through it.',
                '**Recognize and take seriously.** Be the one who notices. Keep the signs of every form of abuse and neglect fresh in your mind, watch the most vulnerable residents closest, and take seriously every worrying sign, behavior change, and disclosure — never explaining them away. If a resident tells you something, listen calmly, believe them enough to report, and don\'t interrogate or doubt them. Recognition is where protection begins, and you\'re in the best position of anyone to recognize it.',
                '**Protect and support the resident.** Put the resident\'s safety and dignity first. Get them to safety and get the nurse if they\'re in danger, keep them from the suspected abuser where you can, and support them with calm, warmth, and reassurance — they may be frightened, ashamed, or hurting. Treat any disclosure with great gentleness, and never let them feel blamed or disbelieved. The whole point of recognizing and reporting is to protect this person.',
                '**Preserve and report to the nurse.** Help the truth come out, and get the suspicion where it belongs. Don\'t wash, clean, or disturb possible evidence of physical or sexual abuse before telling the nurse. Then report — to the nurse or charge nurse, immediately, every time — factually and specifically, what you saw and what was said. The facility carries it onward through the proper channels and CDPH requirements; your duty is to get it to the nurse, promptly and clearly. Reporting up the chain is exactly what a mandated reporter does.',
                '**Hold the lines, and never look away.** Protect the process by holding firm boundaries. Never investigate or gather proof. Never confront, accuse, or warn the suspected abuser. Never decide for yourself that it wasn\'t really abuse and drop it. And never, ever stay silent or look the other way — not for a coworker, not to avoid conflict, not because you\'re unsure. When in doubt, report. Your courage to speak up is the protection vulnerable residents are counting on.',
                'Now the boundary, stated plainly. You do not investigate. You do not confront or accuse the suspected abuser. You do not decide whether abuse occurred. You do not diagnose injuries. And you never stay silent about suspected abuse or neglect.',
                'Inside your role — recognize, protect, preserve, and report to the nurse immediately — you are often the one thing standing between a vulnerable resident and continued harm. The most vulnerable people in your care depend on your watchful eyes and your willingness to speak up. Few duties you carry are more important.',
              ].join('\n\n'),
            },
            {
              id: 'abuse-s10-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Your role, stated plainly',
              body: 'You DO: recognize, protect, preserve, and report to the nurse immediately. You do NOT: investigate, confront or accuse the suspected abuser, decide whether abuse occurred, diagnose injuries, or stay silent. When in doubt, report.',
            },
          ]),
      },
      {
        slug: 's11-case-study',
        title: 'Brief Case Study',
        sortOrder: 2,
        buildContent: () => {
          const caseNarrative = [
            'Mrs. Adeyemi, 88, had moderate dementia and could speak, though not always clearly. She was a gentle, quiet woman who rarely complained. Her CNA, Grace, had cared for her for months and knew her well — which is exactly why Grace noticed when something changed.',
            '',
            '**What Grace noticed:** Over a couple of weeks, Mrs. Adeyemi grew quieter and more withdrawn, and seemed newly fearful — especially in the evenings. Then, during a bath, Grace saw them: bruises on both upper arms in a pattern that looked like grip marks, and a few more on her back. When Grace gently asked what happened, Mrs. Adeyemi looked frightened, glanced at the door, and murmured, "Nothing... I\'m just clumsy." The bruises didn\'t match "clumsy," the pattern looked like someone had grabbed her hard, and the fear in her face said more than her words. Grace wasn\'t certain of anything — but she was concerned, and she knew that concern was enough.',
            '',
            '**What Grace did NOT do:** Grace did not try to figure out who had done it. She did not question other staff or Mrs. Adeyemi\'s family to investigate. She did not confront anyone or accuse the evening caregiver she privately wondered about. And — though a small, tired voice told her she might be wrong, that she didn\'t want to cause trouble, that maybe it really was nothing — she did not stay silent. She knew those were exactly the thoughts that let harm continue, and that her duty as a mandated reporter was to report reasonable suspicion, not to prove anything.',
            '',
            '**What Grace did:** She supported Mrs. Adeyemi gently through the rest of her bath, keeping her calm and reassured, careful not to make her feel doubted or blamed. She was mindful not to scrub away or dismiss what she\'d seen. And then, promptly, she reported her concern to the charge nurse — factually and specifically: the grip-pattern bruises on the arms and back, the new fearfulness and withdrawal, the frightened glance at the door, and the "I\'m just clumsy" that didn\'t fit. She didn\'t dramatize and she didn\'t minimize; she simply reported what she had observed and what Mrs. Adeyemi had said.',
            '',
            '**What happened next:** Because Grace recognized the signs and reported them, the facility took it from there — following its policy and CDPH requirements to look into the concern through the proper channels. The matter was handled by the people whose job it was to handle it, not by Grace. Mrs. Adeyemi was protected and watched over, and the pattern Grace had caught — the bruises, the fear, the timing — gave the proper process exactly what it needed to act. Grace\'s role had been to notice and to speak; that role, done right, was what set everything else in motion.',
            '',
            '**The outcome:** A vulnerable woman who could not clearly speak for herself, who was frightened into saying "nothing," was protected — because one caregiver noticed that the bruises didn\'t add up and refused to stay silent about a suspicion she couldn\'t prove. The charge nurse told Grace afterward: "You did exactly what you were supposed to do. You didn\'t play detective, you didn\'t accuse anyone, and you didn\'t talk yourself out of it. You saw something wrong and you reported it. That\'s how we protect the ones who can\'t protect themselves."',
          ].join('\n');

          return doc('Brief Case Study', [
            { id: 'abuse-s11-heading', type: 'heading', level: 1, text: 'Brief Case Study' },
            pendingAudio(
              'abuse-s11-audio',
              'The Bruises That Didn\'t Add Up',
              '/assets/courses/elder-abuse-reporting/s11-case-podcast.mp3',
              caseNarrative,
              '/assets/courses/elder-abuse-reporting/s11-case-podcast.mp3',
            ),
            {
              id: 'abuse-s11-image',
              type: 'image',
              src: '/assets/courses/elder-abuse-reporting/s11-hero.jpg',
              caption: 'Noticing what does not add up — and speaking up for those who cannot.',
            },
            {
              id: 'abuse-s11-case-study',
              type: 'case_study',
              title: 'The Bruises That Didn\'t Add Up',
              residentProfile:
                'Mrs. Adeyemi, 88, had moderate dementia and could speak, though not always clearly — a gentle, quiet woman who rarely complained. Her CNA, Grace, had cared for her for months and knew her well, which is exactly why Grace noticed when something changed: over a couple of weeks she grew quieter, more withdrawn, and newly fearful, especially in the evenings.',
              scenario: [
                '**What Grace noticed:** During a bath, Grace saw bruises on both upper arms in a grip-mark pattern, and a few more on her back. When she gently asked what happened, Mrs. Adeyemi looked frightened, glanced at the door, and murmured, "Nothing... I\'m just clumsy." The bruises didn\'t match "clumsy," the pattern looked like a hard grab, and the fear said more than the words. Grace wasn\'t certain — but she was concerned, and she knew concern was enough.',
                '**What Grace did NOT do:** She did not try to figure out who did it. She did not question other staff or family to investigate. She did not confront or accuse the evening caregiver she privately wondered about. And though a tired voice told her she might be wrong and didn\'t want to cause trouble, she did not stay silent — she knew those were exactly the thoughts that let harm continue, and that her duty was to report reasonable suspicion, not to prove anything.',
                '**What Grace did:** She supported Mrs. Adeyemi gently through the bath, keeping her calm and reassured, careful not to make her feel doubted or blamed, and mindful not to scrub away or dismiss what she\'d seen. Then, promptly, she reported her concern to the charge nurse — factually and specifically: the grip-pattern bruises, the new fearfulness and withdrawal, the frightened glance at the door, the "I\'m just clumsy" that didn\'t fit. She didn\'t dramatize and she didn\'t minimize.',
                '**What happened next:** Because Grace recognized and reported, the facility took it from there — following its policy and CDPH requirements through the proper channels. The matter was handled by the people whose job it was, not by Grace. Mrs. Adeyemi was protected and watched over, and the pattern Grace caught gave the proper process what it needed to act.',
                '**The outcome:** A vulnerable woman who couldn\'t clearly speak for herself was protected — because one caregiver noticed the bruises didn\'t add up and refused to stay silent about a suspicion she couldn\'t prove. The charge nurse told Grace: "You did exactly what you were supposed to do. You didn\'t play detective, you didn\'t accuse anyone, and you didn\'t talk yourself out of it. You saw something wrong and you reported it. That\'s how we protect the ones who can\'t protect themselves."',
              ].join('\n\n'),
            },
            {
              id: 'abuse-s11-reflection-1',
              type: 'reflection',
              prompt:
                'Grace wasn\'t certain abuse had occurred and worried she might be wrong. Why was she still right to report, and what is the "reasonable suspicion" standard that mandated reporters follow?',
              minCharacters: 50,
            },
            {
              id: 'abuse-s11-reflection-2',
              type: 'reflection',
              prompt:
                'Grace did NOT investigate or confront anyone. Why are those boundaries so important, and what exactly is the CNA\'s role once they suspect abuse?',
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
            { id: 'abuse-s12-heading', type: 'heading', level: 1, text: 'Conclusion' },
            {
              id: 'abuse-s12-video',
              type: 'video',
              title: 'Conclusion',
              videoUrl: '/assets/courses/elder-abuse-reporting/s12-conclusion.mp4',
              placeholderNote: 'Pending upload: /assets/courses/elder-abuse-reporting/s12-conclusion.mp4',
            },
            {
              id: 'abuse-s12-image',
              type: 'image',
              src: '/assets/courses/elder-abuse-reporting/s12-hero.jpg',
              caption: 'When in doubt, report — protecting those who cannot protect themselves.',
            },
            {
              id: 'abuse-s12-narration',
              type: 'text',
              body: [
                'You\'ve reached the end. Let\'s lock in the five things that matter most about recognizing and reporting elder abuse and neglect.',
                '**One.** As a CNA, you are a mandated reporter — required by law and duty to report suspected abuse and neglect. It is never optional, and never something to leave to someone else. You are often the one person close enough to notice the harm, because abuse hides and victims frequently can\'t or won\'t tell.',
                '**Two.** Know the forms and their signs. Physical — unexplained or mismatched injuries, restraint marks. Sexual — injury, fear, distress. Emotional — fear, withdrawal, harsh treatment. Financial — missing money or belongings. Neglect — poor hygiene, weight loss, untreated wounds, unmet needs. And watch for fearful behavior changes, especially around a certain person. Watch the most vulnerable closest.',
                '**Three.** Report reasonable suspicion — you don\'t need proof. The standard is what you genuinely suspect, not what you can prove. You don\'t need certainty, evidence, or permission. When in doubt, report — a report that\'s nothing costs little, but silence while a resident is harmed can cost everything.',
                '**Four.** Know what to do — and never do. DO: recognize, protect and support the resident, preserve possible evidence, and report to the nurse or charge nurse immediately. NEVER: investigate, confront or accuse the suspected abuser, decide for yourself it wasn\'t abuse, agree to keep it secret, or stay silent. The facility carries the report onward through proper channels and CDPH requirements.',
                '**Five.** Never look away. The most vulnerable residents — the confused, the voiceless, the isolated — depend on your watchful eyes and your courage to speak up. Silence protects abusers; reporting protects residents. Recognize, protect, report — and never, ever stay silent.',

                'This course provides one hour of continuing education through CAL ACE Nursing Academy (CDPH Provider NAC #7384). Your certificate is generated automatically when you pass the knowledge check.',
                'Ten questions are waiting. Everything on them was covered here. You\'re ready. Trust what you\'ve learned, and show what you know.',
              ].join('\n\n'),
            },
            {
              id: 'abuse-s12-summary',
              type: 'summary',
              title: 'Five things that matter most',
              items: [
                'As a CNA you are a mandated reporter — required by law and duty to report suspected abuse and neglect. It is never optional, and you are often the one close enough to notice.',
                'Know the forms and their signs — physical, sexual, emotional, financial abuse, and neglect — plus fearful behavior changes, especially around a certain person. Watch the most vulnerable closest.',
                'Report reasonable suspicion — you don\'t need proof. When in doubt, report; a report that\'s nothing costs little, but silence while a resident is harmed can cost everything.',
                'DO: recognize, protect, preserve evidence, report to the nurse immediately. NEVER: investigate, confront the abuser, decide it wasn\'t abuse, agree to keep it secret, or stay silent. The facility reports onward per CDPH requirements.',
                'Never look away — the confused, voiceless, and isolated depend on your watchful eyes and courage. Silence protects abusers; reporting protects residents.',
              ],
            },
          ]),
      },
    ],
  },
];

export async function seedCourse04ElderAbuse(
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
      label: 'V3 rebuild — elder abuse & neglect recognition & reporting',
      status: CourseVersionStatus.DRAFT,
      deliveryMode: DeliveryMode.ONLINE,
      ceHours,
      publishedAt: null,
      contentMeta: contentMeta as Prisma.InputJsonValue,
    },
    update: {
      label: 'V3 rebuild — elder abuse & neglect recognition & reporting',
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
    `Seeding Course 4 (Elder Abuse & Neglect) as DRAFT — slug "${COURSE_SLUG}", version ${VERSION_NUMBER}…`,
  );

  try {
    const result = await seedCourse04ElderAbuse(prisma);
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
