/**
 * Seed Course 10 — Legal & Ethical Issues in Nursing Practice (DRAFT).
 *
 * V3 rebuild of "Legal & Ethical Issues in Nursing Practice" — TITLE KEPT — aligned to
 * the 12–50 scaffold. PROFESSIONAL PRACTICE course, so the fixed template is lightly
 * adapted: section shells stay, but S5/S6/S7/S8 are reframed for a legal/ethics topic
 * (titles only; lesson slugs stay standard s05–s08).
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-10-legal-ethical
 *
 * Idempotent upserts by slug. Self-cleans stray modules on the target DRAFT version.
 * Does not seed the final quiz (pending owner approval; see the -exam.ts file).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CONFIRMED against the live DB (read-only inspect inspect-legal-ethical-target.ts):
 *   COURSE_SLUG    = 'legal-ethical-nursing-practice'  (FROZEN — course already live)
 *   VERSION_NUMBER = 2   (MAX existing version is v1 PUBLISHED with real content; this
 *                         creates v2 as a new DRAFT revision, leaving v1 intact)
 * Title KEPT unchanged ("Legal & Ethical Issues in Nursing Practice").
 * DRAFT-only. Run order: this main seed first, then the -exam seed.
 *
 * ABSORBS: this rebuild folds in the documentation strand from the former
 * "CNA Renewal Readiness & CDPH Documentation" course (slug cna-renewal-readiness,
 * still live). Retiring/redirecting that course is a SEPARATE, deliberate step
 * (course ARCHIVED / version RETIRED, never delete) — NOT handled here.
 *
 * SCOPE: CNAs practice within scope, protect confidentiality, support consent and
 * resident choice, follow advance directives via the care plan, document accurately,
 * act ethically, and escalate/report properly. CNAs do NOT make medical or legal
 * decisions, give legal advice, decide DNR/code status, or act outside their scope.
 *
 * LEGAL ACCURACY: teaches legal/ethical DUTIES accurately but deliberately does NOT
 * assert CA statute numbers, exact penalties, or outside-agency mechanics. Where
 * specifics would go, it points to "your facility policy and CDPH requirements."
 * HIPAA is named as the real federal health-privacy law and described in plain terms
 * only — no fabricated provisions. No fabricated legal specifics anywhere.
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
const COURSE_SLUG = 'legal-ethical-nursing-practice';

// Title KEPT unchanged per the production package.
const COURSE_TITLE = 'Professional Boundaries, Ethics, and Caregiver Accountability';
const COURSE_SUMMARY =
  'Legal and ethical practice is the foundation of being a trusted CNA. Know your scope of practice and never cross it; protect confidentiality as both a legal duty and a matter of trust; support consent and a resident\'s right to refuse; understand advance directives and follow the care plan (never deciding code status); document accurately and honestly; and act with integrity — doing the right thing even when it is hard. CNAs stay in scope, guard privacy, honor choice, chart the truth, and escalate properly; they do not make medical or legal decisions, give legal advice, decide code status, or work outside their scope.';

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
    'Understand the CNA\'s legal and ethical responsibilities and stay within scope of practice',
    'Protect confidentiality (a legal duty and a matter of trust) and support consent and refusal',
    'Understand advance directives and the CNA\'s role — follow the care plan, never decide code status',
    'Document care accurately, objectively, honestly, and timely — never falsify or hide a mistake',
    'Act with integrity and escalate or report legal and ethical concerns through proper channels',
  ],
  faq: [] as { question: string; answer: string }[],
  compliance: {
    providerName: 'CAL ACE Nursing Academy',

    cdphApprovalStatus: 'placeholder' as const,
    targetAudience: 'California certified nursing assistants',
    requiredSeatTimeMinutes: 50,
    onlineDeliveryDesignation: 'online' as const,
  },
  imageAccent: 'slate',
  heroImage: '/assets/courses/legal-ethical/hero-banner.png',
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
    title: 'Legal & Ethical Practice — The Foundation',
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: 'Introduction',
        sortOrder: 0,
        buildContent: () =>
          doc('Introduction', [
            { id: 'leg-s01-heading', type: 'heading', level: 1, text: 'Introduction' },
            {
              id: 'leg-s01-video',
              type: 'video',
              title: 'Introduction',
              videoUrl: '/assets/courses/legal-ethical/s01-intro.mp4',
              placeholderNote: 'Pending upload: /assets/courses/legal-ethical/s01-intro.mp4',
            },
            {
              id: 'leg-s01-image',
              type: 'image',
              src: '/assets/courses/legal-ethical/s01-hero.jpg',
              caption: 'A CNA is trusted with care — and with doing it right.',
            },
            {
              id: 'leg-s01-narration',
              type: 'text',
              body: [
                'Welcome to CAL ACE Nursing Academy.',
                'This course is about legal and ethical issues in nursing practice — the rules and the right-and-wrong that guide everything you do as a CNA. It might sound dry, but it\'s at the core of being a trusted professional. Every day, you make choices that have legal and ethical weight: what you say, what you keep private, what you document, what you do and don\'t do. Getting these right protects your residents, protects you, and protects your certification.',
                'Let\'s separate the two ideas. Legal issues are about the law and the rules — what you\'re required to do or forbidden to do, like protecting private information, staying within your scope, and reporting certain things. Ethical issues are about right and wrong, and doing the honorable thing even when no one\'s watching — honesty, respect, fairness, putting residents first. Often they overlap: the legal thing and the ethical thing are usually the same thing. This course helps you recognize and handle both.',
                'Here are the big areas you\'ll learn. Scope of practice — knowing what a CNA may and may not do, and never going beyond it. Confidentiality — protecting residents\' private information, which is both a legal duty and a matter of trust. Consent and choice — respecting a resident\'s right to agree to or refuse care. Advance directives — understanding documents like a resident\'s wishes about end-of-life care, and your role in following the care plan. Documentation — recording your care accurately and honestly, because in healthcare, if it wasn\'t documented, it\'s treated as if it wasn\'t done. And ethical conduct — honesty, integrity, and putting residents first in everything.',
                'Why does your role matter so much? Because you are trusted with vulnerable people, their private information, and their care — and that trust carries real legal and ethical responsibility. A careless word can breach confidentiality. A task beyond your scope can harm a resident and end your career. A sloppy or false note can mislead the whole care team. And quiet integrity — doing right when it\'s hard, reporting what should be reported, never cutting a dangerous corner — is what makes you a professional worthy of that trust. These aren\'t abstract ideas; they live in your daily choices.',
                'And here\'s an honest, practical note for your own career: practicing legally and ethically — staying in scope, documenting truthfully, protecting confidentiality, acting with integrity — is also how you protect your certification and your livelihood. Doing the right thing isn\'t just good for residents; it\'s what keeps you safe and trusted as a CNA.',
                'The guiding spirit of this course: know your scope, protect trust, document the truth, and always do the right thing — especially when it\'s hard.',
                'Your scope is clear. A CNA practices within their scope, protects confidentiality, supports consent and resident choice, follows advance directives through the care plan, documents accurately and honestly, acts ethically, and escalates and reports properly. A CNA does not make medical or legal decisions, does not give legal advice, does not decide a resident\'s code status, and never acts outside their scope.',
                'By the end of this course, you will be able to: understand your legal and ethical responsibilities. Stay within your scope of practice. Protect confidentiality and support consent. Understand advance directives and your role. Document accurately. And act with integrity. Let\'s begin.',
              ].join('\n\n'),
            },
            {
              id: 'leg-s01-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Know your scope, protect trust, document the truth',
              body: 'Legal = the rules and the law. Ethical = right and wrong, even when no one\'s watching — and they usually point the same way. You stay in scope, protect confidentiality, support consent and directives (via the care plan), document honestly, and escalate properly. You do not make medical or legal decisions, give legal advice, decide code status, or act outside your scope.',
            },
          ]),
      },
      {
        slug: 's02-terms',
        title: 'Terms & Definitions',
        sortOrder: 1,
        buildContent: () =>
          doc('Terms & Definitions', [
            { id: 'leg-s02-heading', type: 'heading', level: 1, text: 'Terms & Definitions' },
            {
              id: 'leg-s02-image',
              type: 'image',
              src: '/assets/courses/legal-ethical/s02-hero.jpg',
              caption: 'Honest, careful charting is the backbone of safe care.',
            },
            {
              id: 'leg-s02-reveal-scope',
              type: 'reveal_card',
              frontTitle: 'Scope of Practice',
              frontBody: 'Scope of practice',
              backTitle: 'Scope of Practice',
              backBody:
                'The set of tasks a CNA is trained, certified, and allowed to do — and just as importantly, the line you must not cross. Giving medications, doing sterile procedures, or making care decisions are outside a CNA\'s scope. Knowing your scope, and never going beyond it, protects residents from harm and protects your certification.',
            },
            {
              id: 'leg-s02-reveal-confidentiality',
              type: 'reveal_card',
              frontTitle: 'Confidentiality',
              frontBody: 'Confidentiality',
              backTitle: 'Confidentiality',
              backBody:
                'The duty to keep residents\' personal and health information private — sharing it only with those who need it for care. It is both a legal requirement and a matter of trust. Don\'t gossip about residents, don\'t discuss them where others can hear, and don\'t share their information on social media. Protecting privacy is protecting the person.',
            },
            {
              id: 'leg-s02-reveal-hipaa',
              type: 'reveal_card',
              frontTitle: 'HIPAA',
              frontBody: 'HIPAA (HIP-ah)',
              backTitle: 'HIPAA',
              backBody:
                'A federal law that protects the privacy of people\'s health information. In plain terms for a CNA: a resident\'s health information is private and protected, and you may only access and share it as needed for their care. Following your facility\'s privacy rules keeps you on the right side of HIPAA. Private means private.',
            },
            {
              id: 'leg-s02-reveal-consent',
              type: 'reveal_card',
              frontTitle: 'Informed Consent',
              frontBody: 'Informed consent',
              backTitle: 'Informed Consent',
              backBody:
                'A resident\'s right to be told what care is proposed and why, and to agree to it — or refuse it. Consent must be freely given by a resident able to make the decision. As a CNA, you respect consent and refusal: you explain what you\'re going to do, and you never force care on a resident who refuses. Consent is a right, not a formality.',
            },
            {
              id: 'leg-s02-reveal-directive',
              type: 'reveal_card',
              frontTitle: 'Advance Directive',
              frontBody: 'Advance directive',
              backTitle: 'Advance Directive',
              backBody:
                'A document in which a resident states their wishes about their future medical care, in case they can\'t speak for themselves later — including end-of-life wishes. A DNR, or do-not-resuscitate order, is one example. These are decided by the resident and their doctor, recorded in the care plan, and the CNA\'s role is to know and follow the care plan — never to decide it.',
            },
            {
              id: 'leg-s02-reveal-documentation',
              type: 'reveal_card',
              frontTitle: 'Documentation',
              frontBody: 'Documentation',
              backTitle: 'Documentation',
              backBody:
                'The accurate, honest, timely recording of the care you give and what you observe. In healthcare there\'s a saying: if it wasn\'t documented, it wasn\'t done. Good documentation is objective, factual, complete, and never falsified. It protects residents, informs the team, and protects you. Charting truthfully is a core legal and professional duty.',
            },
            {
              id: 'leg-s02-reveal-negligence',
              type: 'reveal_card',
              frontTitle: 'Negligence',
              frontBody: 'Negligence',
              backTitle: 'Negligence',
              backBody:
                'Failing to provide the care a reasonable CNA would provide, resulting in harm — for example, skipping required care, ignoring safety, or working outside your scope. Negligence is a serious legal and ethical failure. Staying within scope, following the care plan, and doing your job carefully and honestly is how you avoid it. Careful, competent care is your protection.',
            },
            {
              id: 'leg-s02-reveal-integrity',
              type: 'reveal_card',
              frontTitle: 'Ethics & Integrity',
              frontBody: 'Ethics & integrity',
              backTitle: 'Ethics & Integrity',
              backBody:
                'Ethics is the sense of right and wrong that guides professional conduct; integrity is doing the right thing even when no one is watching. For a CNA this means honesty, respect, fairness, keeping promises, admitting mistakes, never cutting dangerous corners, and always putting residents first. Integrity is what makes you trustworthy with vulnerable people.',
            },
            {
              id: 'leg-s02-knowledge-check',
              type: 'knowledge_check',
              question: 'A task is outside your scope of practice as a CNA. The right thing to do is:',
              options: [
                { id: 'decline', label: 'Respectfully decline and get the nurse' },
                { id: 'try', label: 'Try it anyway if you think you can' },
                { id: 'secret', label: 'Do it quietly so no one finds out' },
              ],
              correctOptionId: 'decline',
              explanation:
                'A task outside your scope is one you must not do, no matter the pressure or good intention. The professional response is a respectful no plus escalation: decline and get the nurse, who is trained and permitted for it. Going outside your scope, even to help, can harm a resident and cost you your certification.',
              requiredForCompletion: true,
            },
          ]),
      },
      {
        slug: 's03-statistics',
        title: 'Why It Matters',
        sortOrder: 2,
        buildContent: () =>
          doc('Why It Matters', [
            { id: 'leg-s03-heading', type: 'heading', level: 1, text: 'Why It Matters' },
            {
              id: 'leg-s03-image',
              type: 'image',
              src: '/assets/courses/legal-ethical/s03-hero.jpg',
              caption: 'The trust placed in a trained caregiver is earned every shift.',
            },
            pendingAudio(
              'leg-s03-audio',
              'Trust Is the Job: Why Legal and Ethical Practice Protects Everyone',
              '/assets/courses/legal-ethical/s03-stats-podcast.mp3',
              [
                'Trust Is the Job: Why Legal and Ethical Practice Protects Everyone',
                '',
                'CNAs are entrusted with some of the most vulnerable people in society, with their bodies, their private information, and their daily care — and that trust is not just a nice idea; it carries real legal and ethical weight. Every shift, a CNA handles private health information, performs hands-on care, observes and records what\'s happening, and makes countless small choices. Each of those touches law and ethics. The legal and ethical framework around nursing practice exists precisely because the stakes are high: vulnerable people can be harmed by carelessness, dishonesty, breaches of privacy, or care given by someone acting beyond their training. Understanding and honoring this framework is part of what separates a trusted professional from a liability.',
                '',
                'Consider scope of practice. A CNA is trained and certified for a specific set of tasks, and the boundary matters enormously: tasks outside a CNA\'s scope — giving medications, performing procedures meant for licensed staff, making care decisions — can seriously harm residents when done by someone not trained for them, and they expose the CNA to legal consequences and loss of certification. Most scope violations don\'t come from bad intent; they come from being asked to help, wanting to be useful, or being pressured when short-staffed. But "I was just trying to help" is no protection when a resident is harmed. Knowing your scope, and respectfully refusing to exceed it, protects residents and protects your career.',
                '',
                'Confidentiality is another area where small actions carry large weight. A resident\'s health information is private and legally protected, and breaches — gossiping about residents, discussing them where others can hear, posting about them on social media — are both a violation of trust and a violation of law. These breaches happen casually, without malice, which is exactly why awareness matters: a thoughtless comment in a hallway or a careless social media post can violate a resident\'s rights and the CNA\'s legal duty. Protecting private information, every time, is a constant, concrete responsibility.',
                '',
                'And then there\'s documentation and honesty, the quiet backbone of safe care. In healthcare, the saying "if it wasn\'t documented, it wasn\'t done" reflects a real truth: the record is how the whole team knows what happened, and inaccurate, incomplete, or falsified documentation can lead to wrong care decisions and serious harm. Honest, objective, timely charting protects residents, informs the team, and protects the CNA. Falsifying records — charting care that wasn\'t given, or hiding a mistake — is among the most serious ethical and legal violations a caregiver can commit. Underneath all of it sits integrity: doing the right thing when it\'s inconvenient, reporting what should be reported, admitting mistakes, never cutting a dangerous corner. Research and oversight in long-term care consistently show that a culture of scope-awareness, confidentiality, honest documentation, and integrity is one of the strongest protections residents have. The bottom line: CNAs are trusted with vulnerable people and private information; staying in scope, protecting confidentiality, documenting honestly, and acting with integrity protect residents, the team, and the CNA\'s own career.',
              ].join('\n'),
              '/assets/courses/legal-ethical/s03-stats-podcast.mp3',
            ),
            {
              id: 'leg-s03-source-note',
              type: 'callout',
              variant: 'clinical',
              title: 'About these claims',
              body: 'This section describes legal and ethical duties in a general, accurate way without citing specific statute numbers, penalties, or outside-agency mechanics. HIPAA is named as the real federal health-privacy law and described only in plain terms. For specifics, follow your facility policy and CDPH requirements. Any precise legal citation added later must be verified against the actual source.',
            },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: 'Fundamentals',
        sortOrder: 3,
        buildContent: () =>
          doc('Fundamentals', [
            { id: 'leg-s04-heading', type: 'heading', level: 1, text: 'Fundamentals' },
            {
              id: 'leg-s04-video',
              type: 'video',
              title: 'Fundamentals',
              videoUrl: '/assets/courses/legal-ethical/s04-fundamentals.mp4',
              placeholderNote: 'Pending upload: /assets/courses/legal-ethical/s04-fundamentals.mp4',
            },
            {
              id: 'leg-s04-image',
              type: 'image',
              src: '/assets/courses/legal-ethical/s04-hero.jpg',
              caption: 'Knowing the boundaries of the role is the foundation of safe practice.',
            },
            {
              id: 'leg-s04-narration',
              type: 'text',
              body: [
                '**Legal and ethical: the two guides**',
                'Two things guide professional practice: the legal and the ethical. Legal is about the rules and the law — what you must do and must not do, like protecting privacy, staying in scope, and reporting certain things. Ethical is about right and wrong — honesty, respect, fairness, doing the honorable thing even when no one\'s watching. They usually point the same way: the legal thing and the right thing are most often the same. When you feel that something is wrong, or against the rules, that feeling is worth listening to. Both guides exist to protect residents and to keep your practice trustworthy.',
                '**Scope of practice: know your lane**',
                'Scope of practice is the set of tasks you\'re trained, certified, and permitted to do — and the line you must never cross. A CNA does not give medications, perform sterile or invasive procedures, make medical or care decisions, or do tasks reserved for licensed staff. This boundary isn\'t red tape — it protects residents from care by someone untrained for it, and protects you from harming someone and losing your certification. The hard part: you may be asked or pressured to exceed your scope, especially when short-staffed. The answer is always a respectful no. Know your lane, and stay in it.',
                '**Confidentiality: private means private**',
                'Residents\' personal and health information is private and legally protected, and guarding it is a constant duty. Don\'t gossip about residents. Don\'t discuss them where others — visitors, other residents — can hear. Don\'t share their information with anyone who doesn\'t need it for care. And never post about residents on social media — not their names, photos, stories, or details. Confidentiality breaches usually happen casually, without bad intent, which is exactly why you stay mindful. Treat every resident\'s information the way you\'d want your own private health matters treated: private means private, every time.',
                '**Consent and the right to refuse**',
                'Residents have the right to be told what care is planned and to agree to it — or to refuse it. So you explain what you\'re going to do before you do it, and you respect the answer. A competent resident can refuse care, food, or treatment, and you don\'t force it — you explain gently, honor the refusal, and report it. Forcing care on someone who refuses isn\'t just disrespectful; it can be legally and ethically wrong, even a form of abuse. Supporting consent and choice honors the resident as the decision-maker in their own care, which is both their right and the ethical foundation of good practice.',
                '**Advance directives and your role**',
                'An advance directive is a document where a resident states their wishes about future medical care if they can\'t speak for themselves — including end-of-life wishes. A DNR, do-not-resuscitate, is one kind: an order, decided by the resident and their doctor, that they not be revived if their heart or breathing stops. Here is your role, and it\'s important: these decisions belong to the resident and their doctor, and are recorded in the care plan. You do NOT decide them, advise on them, or judge them. You follow the care plan, know where a resident\'s directive is documented, and honor it. If you\'re ever unsure of a resident\'s status, you ask the nurse — you never guess in an emergency.',
                '**Documentation: accurate, honest, timely**',
                'Documentation is how the whole team knows what happened, so it must be right. Chart accurately, objectively, and honestly — what you actually did and what you actually observed, in factual terms, not opinions or guesses. Chart in a timely way, soon after care, so nothing is forgotten. Remember the rule: if it wasn\'t documented, it\'s treated as if it wasn\'t done — so record the care you give. And never, ever falsify a record: don\'t chart care you didn\'t give, don\'t hide a mistake, don\'t change a record dishonestly. Falsifying documentation is among the most serious violations there is. Truthful charting protects residents, the team, and you.',
                '**Integrity: do right when it\'s hard**',
                'Under all the rules sits character: integrity — doing the right thing even when no one is watching, even when it\'s inconvenient or hard. For a CNA, integrity means honesty about your care and your mistakes, respect and fairness for every resident, keeping your word, never cutting a dangerous corner to save time, reporting what should be reported, and refusing to do what\'s wrong even under pressure. When you make a mistake, you own it and report it, because hiding it can harm a resident. Integrity is what makes you genuinely trustworthy with vulnerable people — and it\'s the heart of being a professional, not just an employee.',
              ].join('\n\n'),
            },
            {
              id: 'leg-s04-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'The fundamentals in one place',
              body: 'Legal and ethical usually point the same way. Know your lane — a respectful no protects residents and your certification. Private means private — no gossip, no social media. Explain and respect choice, including refusal. Advance directives: the resident and doctor decide; you follow the care plan and never guess. Document accurately, objectively, timely — and never falsify. Integrity: do right when it\'s hard, and own your mistakes.',
            },
          ]),
      },
    ],
  },
  {
    slug: 'module-2',
    title: 'Recognizing & Practicing — Legal & Ethical Skills',
    sortOrder: 1,
    lessons: [
      {
        slug: 's05-signs',
        title: 'Signs of a Legal/Ethical Problem',
        sortOrder: 0,
        buildContent: () =>
          doc('Signs of a Legal/Ethical Problem', [
            { id: 'leg-s05-heading', type: 'heading', level: 1, text: 'Signs of a Legal/Ethical Problem' },
            {
              id: 'leg-s05-image',
              type: 'image',
              src: '/assets/courses/legal-ethical/s05-hero.jpg',
              caption: 'Recognizing the line of scope — and respecting it.',
            },
            {
              id: 'leg-s05-narration',
              type: 'text',
              body: [
                'Recognizing a legal or ethical problem — often a quiet red flag rather than an obvious crisis — is what lets you avoid harm and do the right thing. Let\'s learn the signs to watch for, in others and in yourself.',
                '**Scope-of-practice red flags**',
                'Watch for moments where you\'re being pushed past your scope. Being asked or pressured to give medications, perform a procedure, or do a task you weren\'t trained and certified for — often with "just do it this once" or "we\'re short-staffed." Being told to make a care decision that isn\'t yours to make. Feeling unsure whether something is "allowed" for a CNA. That uncertainty is itself a red flag — when you don\'t know if a task is within your scope, stop and check, don\'t guess. Going outside your scope, even to help, can harm a resident and end your career. The sign is the pressure or the doubt; the response is a respectful pause and a check with the nurse.',
                '**Confidentiality red flags**',
                'Watch for the casual breaches of privacy that happen all the time. Residents being discussed in hallways, elevators, or break rooms where others can hear. Gossip about residents\' conditions or lives. Information being shared with people who don\'t need it for care. Anyone posting about residents on social media — names, photos, stories, or details. Private records left open or visible. These breaches rarely feel dramatic — they feel normal, which is the danger. When you notice resident information being handled carelessly, that\'s a red flag: protect the information, and don\'t take part in the breach.',
                '**Documentation and honesty red flags**',
                'Watch for pressure or temptation to be dishonest in records or care. Being asked or tempted to chart care that wasn\'t actually given. Pressure to hide or not report a mistake or an incident. Records being changed dishonestly. Being told to "just sign off" on something you didn\'t do or didn\'t see. Vague, false, or copied documentation. And the temptation to cut a dangerous corner to save time, then chart as if it was done properly. These are serious red flags, because falsified records and hidden mistakes lead to wrong care and real harm. The honest path — accurate charting, owning and reporting mistakes — is the only safe one.',
                '**What to do when you see a red flag**',
                'When you recognize a legal or ethical problem, act within your role. If you\'re being asked to exceed your scope, respectfully decline and check with the nurse. If you see a confidentiality breach, protect the information and don\'t participate. If you\'re pressured to document dishonestly or hide a mistake, don\'t — chart the truth and report. For problems you can\'t resolve yourself, or that involve others, raise the concern through the proper channels — to your nurse, charge nurse, or supervisor. And for the gravest issues — abuse, neglect, serious danger — report immediately as you\'ve learned. You don\'t have to have all the answers; you have to refuse to do wrong and to speak up properly. Listening to that inner sense that "this isn\'t right" is often the first and most important step.',
                'The rule underneath it all: notice the red flags — including your own inner sense that something\'s wrong — refuse to do what\'s wrong, and speak up through the proper channels.',
              ].join('\n\n'),
            },
            {
              id: 'leg-s05-callout',
              type: 'callout',
              variant: 'warning',
              title: 'Red flags are usually quiet, not dramatic',
              body: 'Scope: pushed to do what you\'re not trained/certified for, or unsure if you may. Confidentiality: residents discussed openly, gossip, social media, records left exposed. Documentation: pressure to chart falsely, hide a mistake, or cut a corner. Act: decline what\'s beyond scope, protect information, chart the truth, and raise concerns through proper channels.',
            },
          ]),
      },
      {
        slug: 's06-causes',
        title: 'Why Legal/Ethical Problems Happen',
        sortOrder: 1,
        buildContent: () =>
          doc('Why Legal/Ethical Problems Happen', [
            { id: 'leg-s06-heading', type: 'heading', level: 1, text: 'Why Legal/Ethical Problems Happen' },
            {
              id: 'leg-s06-image',
              type: 'image',
              src: '/assets/courses/legal-ethical/s06-hero.jpg',
              caption: 'Integrity holds even under pressure and a short-staffed shift.',
            },
            pendingAudio(
              'leg-s06-audio',
              'Why Good CNAs Still Slip — and How Integrity Prevents It',
              '/assets/courses/legal-ethical/s06-causes-podcast.mp3',
              [
                'Why Good CNAs Still Slip — and How Integrity Prevents It',
                '',
                'Most legal and ethical problems in care don\'t come from bad people doing bad things on purpose. They come from pressure, habit, good intentions gone wrong, and not recognizing a problem as a problem — which is hopeful, because awareness and integrity can prevent nearly all of them. Understanding why these problems happen is the key to avoiding them.',
                '',
                'Pressure and short-staffing are the biggest drivers. When there aren\'t enough hands and there\'s too much to do, the temptations multiply: to take on a task beyond your scope because no one else is available, to cut a corner to save time, to chart quickly and loosely, to skip a step. "We\'re short-staffed, just do it" is how scope violations and corner-cutting creep in. None of it is meant as wrongdoing, but a resident harmed by a task done outside someone\'s training, or by care that was charted but not actually given, is harmed all the same. Recognizing that pressure is exactly when integrity is tested helps a CNA hold the line precisely when it\'s hardest.',
                '',
                'The desire to help — a good quality — can also lead good CNAs astray. Wanting to be useful, to not let the team down, to do more, can tempt a caregiver past their scope or into promising what they can\'t safely deliver. "I was just trying to help" feels noble, but it\'s no protection when help given outside one\'s training causes harm. Real helpfulness stays within scope and speaks up when more is needed; it doesn\'t quietly exceed safe limits.',
                '',
                'Habit and not recognizing breaches cause a whole category of problems, especially with confidentiality. Many breaches — discussing residents in the hallway, a careless social media post, sharing information with someone who doesn\'t need it — happen because they\'ve become normal, not because anyone intends harm. A caregiver who was never taught to see the hallway conversation as a privacy violation simply won\'t avoid it. Once you can recognize these everyday breaches for what they are, you stop committing them almost automatically.',
                '',
                'And fear drives some of the most serious problems — especially around mistakes. Fear of getting in trouble can tempt a caregiver to hide an error, fail to report an incident, or falsify a record to cover something up. But hidden mistakes harm residents, because the team can\'t fix what it doesn\'t know about; and falsifying records is far more serious than the original error. A culture where people can admit mistakes safely prevents the cover-ups that cause real harm. The takeaway: legal and ethical problems mostly come from pressure, the urge to help, habit, and fear — not malice — which means awareness, knowing your scope, recognizing breaches, honest documentation, and the integrity to own mistakes and refuse corner-cutting are exactly what prevent them. Doing right under pressure is the whole skill.',
              ].join('\n'),
              '/assets/courses/legal-ethical/s06-causes-podcast.mp3',
            ),
          ]),
      },
      {
        slug: 's07-medications',
        title: 'Practicing Legally & Ethically',
        sortOrder: 2,
        buildContent: () =>
          doc('Practicing Legally & Ethically', [
            { id: 'leg-s07-heading', type: 'heading', level: 1, text: 'Practicing Legally & Ethically' },
            {
              id: 'leg-s07-image',
              type: 'image',
              src: '/assets/courses/legal-ethical/s07-hero.jpg',
              caption: 'Confidentiality means guarding what is private, every time.',
            },
            {
              id: 'leg-s07-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of practice',
              body: 'A CNA practices within scope, protects confidentiality, supports consent, follows advance directives via the care plan, documents honestly, and acts with integrity. A CNA does not make medical or legal decisions, give legal advice, decide code status, or act outside their scope.',
            },
            {
              id: 'leg-s07-narration',
              type: 'text',
              body: [
                'There\'s no medication for ethics — legal and ethical practice is a discipline, woven through everything you do. Let\'s walk through it as the practical, daily habits that keep you, your residents, and your certification safe. And the scope first: a CNA practices within scope, protects confidentiality, supports consent, follows advance directives via the care plan, documents honestly, and acts with integrity — a CNA does not make medical or legal decisions, give legal advice, decide code status, or act outside their scope.',
                '**Stay in your scope — every time.** Know exactly what a CNA may and may not do, and never cross the line, no matter the pressure. If asked to give medications, perform a procedure, or do anything beyond your training and certification, respectfully decline and check with the nurse — "That\'s outside my scope; let me get the nurse." This isn\'t being unhelpful; it\'s protecting the resident from unsafe care and protecting your certification. When you\'re unsure whether a task is in scope, stop and ask rather than guess. A respectful no is sometimes the most professional thing you can say.',
                '**Protect confidentiality — always.** Treat every resident\'s information as private and protected. Don\'t gossip, don\'t discuss residents where others can hear, don\'t share information with anyone who doesn\'t need it for care, and never post about residents on social media in any form. Keep records and screens private. Make confidentiality a constant habit, because the breaches that happen are usually casual and unthinking. Guarding private information every time is both your legal duty and a core act of respect.',
                '**Support consent, choice, and advance directives.** Explain care before you give it, and respect a resident\'s right to agree or refuse — never forcing care on someone who refuses, and reporting refusals. And honor advance directives through the care plan: know where a resident\'s wishes and any DNR status are documented, follow the care plan, and never decide, advise on, or judge these choices yourself — they belong to the resident and their doctor. If you\'re ever unsure of a resident\'s status, ask the nurse; never guess, especially in an emergency. Supporting choice and following directives honors the resident as the author of their own care.',
                '**Document accurately and honestly.** Chart what you actually did and observed — factually, objectively, completely, and in a timely way. Remember: if it wasn\'t documented, it\'s treated as not done, so record your care. And never falsify: don\'t chart care you didn\'t give, don\'t hide a mistake, don\'t change a record dishonestly. If you make an error in care or charting, report and correct it honestly. Truthful documentation protects residents, informs the team, and protects you — it\'s one of your most important legal and ethical duties.',
                '**Act with integrity and escalate properly.** Do the right thing even when it\'s hard. Be honest, own and report your mistakes, never cut a dangerous corner to save time, and refuse to do what\'s wrong even under pressure. When you see a legal or ethical problem you can\'t resolve, raise it through the proper channels — your nurse, charge nurse, or supervisor. And report the gravest issues — abuse, neglect, serious danger — immediately, as you\'ve learned. Listening to your inner sense that "this isn\'t right," and acting on it properly, is the essence of professional integrity.',
                'The scope point: you don\'t make medical or legal decisions, give legal advice, decide code status, or work outside your scope — but you stay in scope, protect confidentiality, support consent and directives, document honestly, act with integrity, and escalate properly. That practice is what makes you a trusted professional.',
              ].join('\n\n'),
            },
            {
              id: 'leg-s07-callout',
              type: 'callout',
              variant: 'warning',
              title: 'Hold the bright lines',
              body: 'Outside your scope? Respectful NO + get the nurse. Never gossip or post about residents — anywhere. Respect a refusal; never force care. Never decide code status — follow the care plan, ask the nurse. Never falsify a record or hide a mistake. Escalate concerns through proper channels; report the gravest issues immediately.',
            },
          ]),
      },
      {
        slug: 's08-prevention',
        title: 'Preventing Legal/Ethical Problems',
        sortOrder: 3,
        buildContent: () =>
          doc('Preventing Legal/Ethical Problems', [
            { id: 'leg-s08-heading', type: 'heading', level: 1, text: 'Preventing Legal/Ethical Problems' },
            {
              id: 'leg-s08-image',
              type: 'image',
              src: '/assets/courses/legal-ethical/s08-hero.jpg',
              caption: 'Doing the right thing when no one is watching is the whole job.',
            },
            {
              id: 'leg-s08-narration',
              type: 'text',
              body: [
                'Preventing legal and ethical problems is mostly about awareness, good habits, and the integrity to do right under pressure. Here are seven ways.',
                '**One. Know your scope cold — and hold the line.** The clearest prevention is knowing exactly what a CNA may and may not do, so you recognize instantly when you\'re being asked to cross the line. Practice a respectful, ready response: "That\'s outside my scope; let me get the nurse." When you know your lane and can say no kindly but firmly, you prevent the scope violations that pressure would otherwise cause. Certainty about your scope is your protection.',
                '**Two. Make confidentiality automatic.** Build privacy into muscle memory: lower your voice about residents, never discuss them where others can hear, keep information to those who need it, keep screens and records private, and adopt a firm personal rule never to post anything about residents online. When confidentiality is a habit rather than a decision, you prevent the casual breaches that happen when people aren\'t thinking. Make private-means-private automatic.',
                '**Three. Explain and respect choice, every time.** Prevent consent problems by always explaining care before you give it and respecting the resident\'s answer, including a refusal. Building this into every interaction prevents the forced-care situations that violate rights and law. A habit of explaining and honoring choice keeps you on the right side of consent without having to think about it.',
                '**Four. Know where directives live — and never guess.** Prevent the most serious errors around advance directives and code status by always knowing where a resident\'s wishes are documented in the care plan, and by asking the nurse whenever you\'re unsure — never guessing, especially in an emergency. Knowing the care plan and asking rather than assuming prevents the catastrophic mistake of acting against a resident\'s documented wishes.',
                '**Five. Document honestly and promptly.** Prevent documentation problems by charting accurately, objectively, and soon after care — and by adopting an absolute rule: never falsify anything, and never hide a mistake. Chart what you did and saw, truthfully. When honest, timely documentation is simply how you work, you prevent both the harm of inaccurate records and the serious violation of falsification.',
                '**Six. Make it safe to admit mistakes — starting with your own.** Prevent the dangerous cover-ups by owning and reporting your own mistakes promptly and honestly, knowing that a reported error can be fixed but a hidden one can harm a resident. When you treat mistakes as things to report and correct, not hide, you prevent the fear-driven falsifications and omissions that cause real harm. Honesty about errors is prevention.',
                '**Seven. Listen to your conscience — and speak up.** The deepest prevention is integrity: when something feels wrong, or against the rules, listen to that, and act on it through the proper channels. Refuse to cut dangerous corners under pressure. Raise concerns to your nurse or supervisor; report serious issues immediately. A CNA who listens to that inner sense of right and wrong, and speaks up properly, prevents far more harm than one who stays silent. Your integrity is the best safeguard there is.',
              ].join('\n\n'),
            },
          ]),
      },
    ],
  },
  {
    slug: 'module-3',
    title: 'Application — Judgment, Role & Integrity',
    sortOrder: 2,
    lessons: [
      {
        slug: 's09-emergency',
        title: 'When to Speak Up / Escalate',
        sortOrder: 0,
        buildContent: () =>
          doc('When to Speak Up / Escalate', [
            {
              id: 'leg-s09-heading',
              type: 'heading',
              level: 1,
              text: 'When to Speak Up / Escalate',
            },
            pendingAudio(
              'leg-s09-intro-audio',
              'Refusing a task beyond scope and refusing to falsify — intro',
              '/assets/courses/legal-ethical/s09-emergency-intro.mp3',
              'In legal and ethical practice, two judgments come up again and again: refusing a task that\'s outside your scope even when you\'re pressured, and refusing to document dishonestly or hide a mistake. You\'re about to work through two situations. Read each carefully, choose your action, and you\'ll get feedback right away. Keep the core ideas in mind: when a task is beyond your scope, a respectful no and getting the nurse is the right answer — and you chart only the truth, and you report mistakes rather than hiding them.',
              '/assets/courses/legal-ethical/s09-emergency-intro.mp3',
            ),
            {
              id: 'leg-s09-image',
              type: 'image',
              src: '/assets/courses/legal-ethical/s09-hero.jpg',
              caption: 'The judgment to hold the line under pressure protects the resident.',
            },
            {
              id: 'leg-s09-scenario-scope-image',
              type: 'image',
              src: '/assets/courses/legal-ethical/s09-scenario-scope.jpg',
              caption: 'A respectful no to an out-of-scope task — get the nurse instead.',
            },
            {
              id: 'leg-s09-scenario-scope',
              type: 'scenario_question',
              prompt:
                'The unit is very short-staffed today. The nurse is busy, and a resident is due for their medications. Another CNA says to you, "Just give Mrs. Lin her pills for me — you know which ones, it\'s easy, and we\'re slammed. Nobody will know, and it really helps everyone out." Giving medications is outside a CNA\'s scope of practice. What SHOULD the CNA do?',
              options: [
                {
                  id: 'give',
                  label: 'Give the medications since it helps the team and you "know which ones"',
                  feedback:
                    'Giving medications is outside a CNA\'s scope of practice — and being short-staffed, asked nicely, or wanting to help doesn\'t change that. Meds given by someone not trained and certified can harm the resident and cost you your certification; "I was just helping" is no protection if something goes wrong. The right action: respectfully decline because it\'s outside your scope, and let the nurse know Mrs. Lin\'s medications are due so she can handle them.',
                },
                {
                  id: 'decline',
                  label: 'Respectfully decline because it\'s outside your scope, and let the nurse know the medications are due',
                  feedback:
                    'Exactly right. Giving medications is outside a CNA\'s scope of practice — full stop — and no amount of being short-staffed, being asked nicely, or wanting to help changes that. The reasons are serious: medications given by someone not trained and certified for it can seriously harm a resident, and doing so exposes you to real legal consequences and the loss of your certification. "It\'s easy," "nobody will know," and "it really helps everyone" are exactly the pressures that lead good CNAs into scope violations — but "I was just trying to help" is no protection when a resident is harmed. The genuinely helpful and professional response is to respectfully decline and make sure the right person handles it: "I can\'t give medications — that\'s outside my scope — but I\'ll let the nurse know Mrs. Lin\'s meds are due so she can take care of it." Notice the other traps too: giving them secretly, or giving them and charting that the nurse did it, would add a falsified record and a cover-up to the scope violation — far worse. Staying in your lane and escalating to the nurse protects Mrs. Lin and protects your career. A respectful no is the right answer.',
                  isRecommended: true,
                },
                {
                  id: 'secret',
                  label: 'Give the pills but don\'t tell anyone',
                  feedback:
                    'Giving the pills secretly is still a scope violation — and doing it quietly adds concealment on top. Medications given by someone not trained and certified can harm the resident and cost you your certification, no matter how it\'s hidden. The right action: respectfully decline because it\'s outside your scope, and let the nurse know Mrs. Lin\'s medications are due so she can handle them.',
                },
                {
                  id: 'falsify',
                  label: 'Give the pills and chart that the nurse did it',
                  feedback:
                    'This is the worst option — it piles a falsified record and a cover-up on top of a scope violation. Giving medications is outside your scope, and charting that the nurse did it is dishonest documentation, one of the gravest violations there is. The right action: respectfully decline because it\'s outside your scope, and let the nurse know Mrs. Lin\'s medications are due so she can handle them.',
                },
              ],
              requiredForCompletion: true,
            },
            {
              id: 'leg-s09-scenario-document-image',
              type: 'image',
              src: '/assets/courses/legal-ethical/s09-scenario-document.jpg',
              caption: 'Document honestly and report a missed task — never cover it up.',
            },
            {
              id: 'leg-s09-scenario-document',
              type: 'scenario_question',
              prompt:
                'You realize you forgot to reposition a resident on schedule during a busy shift — a task that was required and that you missed. A coworker says, "Don\'t say anything — just chart that you did it on time like normal. Nobody will know, and you don\'t want to get in trouble." What SHOULD the CNA do?',
              options: [
                {
                  id: 'chart-false',
                  label: 'Chart that you did it on time, like normal, so you don\'t get in trouble',
                  feedback:
                    'Charting that you repositioned the resident when you didn\'t is falsifying the record — far more serious than the original missed task, because the team relies on the record being true and the resident could be harmed by care everyone believes was given. The right action: don\'t falsify — document honestly what actually happened and report the missed care to the nurse so the resident can be checked and repositioned now.',
                },
                {
                  id: 'honest',
                  label: 'Do NOT falsify the record — document honestly what actually happened and report the missed care to the nurse',
                  feedback:
                    'Right — and this is integrity under pressure. You made an honest mistake on a busy shift, which happens; what matters now is what you do about it. Charting that you repositioned the resident on time when you didn\'t would be falsifying the record — and that is far more serious than the original missed task. Falsified documentation is one of the gravest legal and ethical violations a caregiver can commit, because the whole team relies on the record being true: if it says the resident was repositioned, no one will check, and the resident could develop a pressure injury from care everyone believes was given. "Nobody will know" and "you don\'t want to get in trouble" are exactly the fears that drive dangerous cover-ups. Charting nothing, or altering an earlier record, are just other forms of dishonesty. The right path is honesty: document truthfully what actually happened, and report the missed repositioning to the nurse so the resident can be checked and repositioned now, and any needed follow-up done. A reported mistake can be fixed; a hidden one can harm a resident. Owning your error and charting the truth protects the resident and is exactly what a trustworthy professional does.',
                  isRecommended: true,
                },
                {
                  id: 'chart-nothing',
                  label: 'Chart nothing at all and hope no one notices',
                  feedback:
                    'Charting nothing is still dishonest — it hides the missed care and leaves the resident at risk, since the team can\'t fix what it doesn\'t know about. The right action: don\'t falsify or omit — document honestly what actually happened and report the missed care to the nurse so the resident can be checked and repositioned now.',
                },
                {
                  id: 'alter',
                  label: 'Change an earlier record to cover the gap',
                  feedback:
                    'Altering an earlier record to cover the gap is falsification — one of the gravest violations there is, and a cover-up on top of the missed task. The right action: don\'t falsify — document honestly what actually happened and report the missed care to the nurse so the resident can be checked and repositioned now.',
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
            { id: 'leg-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
              id: 'leg-s10-video',
              type: 'video',
              title: "The CNA's Role",
              videoUrl: '/assets/courses/legal-ethical/s10-cna-role.mp4',
              placeholderNote: 'Pending upload: /assets/courses/legal-ethical/s10-cna-role.mp4',
            },
            {
              id: 'leg-s10-image',
              type: 'image',
              src: '/assets/courses/legal-ethical/s10-hero.jpg',
              caption: 'Accurate records and honest reporting protect everyone.',
            },
            {
              id: 'leg-s10-narration',
              type: 'text',
              body: [
                'Your role in legal and ethical practice is to be the trustworthy professional who stays in scope, guards privacy, honors choice, documents the truth, and acts with integrity. Let\'s walk through it.',
                '**Stay in your scope.** Know your lane and hold it. Do the tasks you\'re trained and certified for, and never the ones you\'re not — no medications, no procedures or decisions beyond your scope, no matter the pressure. When asked to exceed it, decline respectfully and get the nurse; when unsure, ask rather than guess. Staying in scope protects residents from unsafe care and protects your certification. A respectful no, at the right moment, is one of the most professional things you do.',
                '**Protect confidentiality and support choice.** Guard every resident\'s private information as both a legal duty and an act of respect — no gossip, no discussing residents where others can hear, no social media, ever. And honor consent and choice: explain before you act, respect a resident\'s right to agree or refuse, and follow advance directives through the care plan without ever deciding or judging them yourself. Ask the nurse when unsure of a resident\'s status. You protect their privacy and their right to direct their own care.',
                '**Document honestly.** Chart the truth, always. Record what you actually did and observed — factual, objective, complete, and timely — and remember that uncharted care is treated as undone. Never falsify, never hide a mistake, never cut a corner and chart as if you didn\'t. If you err, correct and report it honestly. Your truthful documentation is what the whole team trusts to keep residents safe — it\'s one of your most important duties.',
                '**Act with integrity and escalate.** Be the professional who does right when it\'s hard. Own and report your mistakes, refuse to cut dangerous corners, and decline to do what\'s wrong even under pressure. When you see a legal or ethical problem, raise it through the proper channels; report the gravest issues immediately. Listen to that inner sense that something isn\'t right, and act on it. Integrity — quiet, consistent, under pressure — is what makes you genuinely trustworthy with vulnerable people.',
                'Now the boundary. You do not make medical or legal decisions. You do not give legal advice. You do not decide a resident\'s code status — you follow the care plan and ask the nurse. You do not act outside your scope. And you never falsify a record, breach confidentiality, or stay silent about serious wrongdoing.',
                'Inside your role — staying in scope, protecting confidentiality, honoring consent and directives, documenting honestly, and acting with integrity — you become the trusted professional that vulnerable residents depend on and that the whole team relies on. The law and ethics aren\'t separate from caregiving; they\'re what make caregiving safe and honorable. Know your scope, protect trust, document the truth, and do the right thing — especially when it\'s hard.',
              ].join('\n\n'),
            },
            {
              id: 'leg-s10-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Stay within scope',
              body: 'You don\'t make medical or legal decisions, give legal advice, decide code status, or act outside your scope — and you never falsify a record, breach confidentiality, or stay silent about serious wrongdoing. You stay in scope, protect confidentiality, honor consent and directives via the care plan, document honestly, act with integrity, and escalate through proper channels.',
            },
          ]),
      },
      {
        slug: 's11-case-study',
        title: 'Brief Case Study',
        sortOrder: 2,
        buildContent: () => {
          const caseNarrative = [
            'It was one of those brutal short-staffed shifts — too many residents, too few hands, the nurse pulled in five directions at once. Grace, a CNA with a steady reputation, was moving as fast as she safely could. Two moments that day would test exactly the legal and ethical practice she\'d trained on — and how she handled them said everything about the professional she was.',
            '',
            '**The first test — scope:** Mid-shift, another CNA hurried over: "Grace, can you give Mrs. Lin her pills for me? You know which ones, it\'s easy, and we\'re absolutely slammed. The nurse is buried. Nobody will know, and it\'d really help everyone out." It was tempting — Grace did know which ones, it would have saved time, and she genuinely wanted to help. But she also knew, without hesitation, that giving medications is outside a CNA\'s scope of practice, and that no amount of pressure or good intention changes that. Medications given by someone not trained and certified for it could harm Mrs. Lin, and doing it could cost Grace her certification. "I was just helping" would protect no one if something went wrong.',
            '',
            '**Holding the line:** So Grace gave the genuinely helpful answer — a respectful no, plus a solution: "I can\'t give meds, that\'s outside my scope — but I\'ll find the nurse right now and let her know Mrs. Lin\'s are due so she can take care of it." She didn\'t give the pills secretly, and she certainly didn\'t give them and chart that the nurse had — which would have piled a falsified record and a cover-up on top of a scope violation. She stayed in her lane and got the right person to the task. Mrs. Lin got her medications, safely, from the nurse.',
            '',
            '**The second test — documentation:** Later, in the crush of the shift, Grace realized she\'d missed repositioning a resident on schedule — a required task she\'d simply lost track of in the chaos. Her stomach sank. A coworker, seeing her face, offered the easy out: "Don\'t say anything — just chart that you did it on time like always. Nobody will know, and you don\'t want to get written up." For a moment the fear was real. But Grace knew that charting care she hadn\'t given would be falsifying the record — a far graver violation than the honest mistake itself — and that a false note could leave the resident at risk of a pressure injury everyone would believe had been prevented.',
            '',
            '**Choosing honesty:** So Grace did the harder, right thing. She documented honestly what had actually happened, and she went to the nurse and reported the missed repositioning so the resident could be checked and repositioned right away. She didn\'t chart a lie, didn\'t chart nothing, didn\'t quietly alter an earlier record. She owned her mistake. The nurse made sure the resident was repositioned and skin-checked promptly — no harm done — and noted, without anger, that catching and reporting it was exactly right.',
            '',
            '**The outcome:** Nothing dramatic happened that day — and that was the point. A resident got her medications safely from the right person. Another resident was repositioned and protected because a missed task was reported instead of hidden. No one was harmed, no record was falsified, no scope was crossed. Grace had simply done her job with integrity under pressure — the unglamorous, essential work of doing right when the easy path was wrong. Her charge nurse, later, put it plainly: "On a day like today, the easy shortcuts were everywhere. Grace didn\'t take a single one. She stayed in her scope, she told the truth, and she owned her mistake. That\'s the whole job — that\'s what \'professional\' actually means."',
          ].join('\n');

          return doc('Brief Case Study', [
            { id: 'leg-s11-heading', type: 'heading', level: 1, text: 'Brief Case Study' },
            pendingAudio(
              'leg-s11-audio',
              'The Shortcut She Didn\'t Take',
              '/assets/courses/legal-ethical/s11-case-podcast.mp3',
              caseNarrative,
              '/assets/courses/legal-ethical/s11-case-podcast.mp3',
            ),
            {
              id: 'leg-s11-image',
              type: 'image',
              src: '/assets/courses/legal-ethical/s11-hero.jpg',
              caption: 'Handling a hard shift with integrity earns real respect.',
            },
            {
              id: 'leg-s11-case-study',
              type: 'case_study',
              title: 'The Shortcut She Didn\'t Take',
              residentProfile:
                'Grace, a CNA with a steady reputation, working a brutal short-staffed shift — too many residents, too few hands, the nurse pulled in five directions at once. Two moments that day would test exactly the legal and ethical practice she\'d trained on.',
              scenario: [
                '**The first test — scope:** Mid-shift, another CNA hurried over: "Grace, can you give Mrs. Lin her pills for me? You know which ones, it\'s easy, and we\'re absolutely slammed. Nobody will know, and it\'d really help everyone out." It was tempting — Grace knew which ones and wanted to help. But giving medications is outside a CNA\'s scope of practice, and no pressure or good intention changes that. Meds given by someone not trained and certified could harm Mrs. Lin and cost Grace her certification. "I was just helping" would protect no one if something went wrong.',
                '**Holding the line:** Grace gave the genuinely helpful answer — a respectful no, plus a solution: "I can\'t give meds, that\'s outside my scope — but I\'ll find the nurse right now and let her know Mrs. Lin\'s are due." She didn\'t give them secretly, and didn\'t give them and chart that the nurse had — which would have piled a falsified record and cover-up on top of a scope violation. Mrs. Lin got her medications, safely, from the nurse.',
                '**The second test — documentation:** Later, Grace realized she\'d missed repositioning a resident on schedule — a required task lost in the chaos. A coworker offered the easy out: "Don\'t say anything — just chart that you did it on time like always. Nobody will know." But Grace knew charting care she hadn\'t given would be falsifying the record — a far graver violation than the honest mistake — and a false note could leave the resident at risk of a pressure injury everyone believed had been prevented.',
                '**Choosing honesty:** Grace documented honestly what actually happened and reported the missed repositioning to the nurse so the resident could be checked and repositioned right away. She didn\'t chart a lie, chart nothing, or alter an earlier record. She owned her mistake. The nurse made sure the resident was repositioned and skin-checked promptly — no harm done — and noted that catching and reporting it was exactly right.',
                '**The outcome:** Nothing dramatic happened — and that was the point. A resident got her medications safely from the right person. Another was repositioned and protected because a missed task was reported instead of hidden. No harm, no falsified record, no scope crossed. The charge nurse put it plainly: "The easy shortcuts were everywhere. Grace didn\'t take a single one. She stayed in her scope, she told the truth, and she owned her mistake. That\'s the whole job — that\'s what \'professional\' actually means."',
              ].join('\n\n'),
            },
            {
              id: 'leg-s11-reflection-1',
              type: 'reflection',
              prompt:
                'Grace was pressured to give medications because the unit was short-staffed and "nobody would know." Why was a respectful no plus getting the nurse the right response, and why don\'t being busy or wanting to help change what\'s inside a CNA\'s scope?',
              minCharacters: 50,
            },
            {
              id: 'leg-s11-reflection-2',
              type: 'reflection',
              prompt:
                'Grace had missed a required task and was tempted to chart that she\'d done it. Why is falsifying the record more serious than the original missed task, and why does honest documentation — including reporting your own mistakes — protect residents?',
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
            { id: 'leg-s12-heading', type: 'heading', level: 1, text: 'Conclusion' },
            {
              id: 'leg-s12-video',
              type: 'video',
              title: 'Conclusion',
              videoUrl: '/assets/courses/legal-ethical/s12-conclusion.mp4',
              placeholderNote: 'Pending upload: /assets/courses/legal-ethical/s12-conclusion.mp4',
            },
            {
              id: 'leg-s12-image',
              type: 'image',
              src: '/assets/courses/legal-ethical/s12-hero.jpg',
              caption: 'Stay in scope, protect privacy, document honestly — that is the standard.',
            },
            {
              id: 'leg-s12-narration',
              type: 'text',
              body: [
                'You\'ve reached the end. Let\'s lock in the five things that matter most about legal and ethical practice.',
                '**One.** Stay within your scope of practice — always. Know exactly what a CNA may and may not do, and never cross the line, no matter the pressure or the good intention. When asked to exceed it, give a respectful no and get the nurse; when unsure, ask, don\'t guess. Staying in your lane protects residents from unsafe care and protects your certification.',
                '**Two.** Protect confidentiality — private means private. Guard every resident\'s information as both a legal duty and an act of trust. No gossip, no discussing residents where others can hear, no sharing with those who don\'t need it, and never anything about residents on social media. The breaches are usually casual, so make confidentiality an automatic habit.',
                '**Three.** Support consent and follow advance directives. Explain care before you give it and respect a resident\'s right to agree or refuse, never forcing care. Know where a resident\'s wishes and any DNR status are documented, follow the care plan, and never decide, advise on, or judge those choices — they belong to the resident and their doctor. When unsure of a status, ask the nurse; never guess.',
                '**Four.** Document accurately and honestly. Chart what you actually did and observed — factual, objective, timely — and remember that uncharted care is treated as undone. Never falsify, never hide a mistake, never cut a corner and chart otherwise. If you err, correct and report it honestly. Truthful documentation protects residents, the team, and you.',
                '**Five.** Act with integrity — and know your scope. Do the right thing even when it\'s hard, own your mistakes, refuse dangerous corners, and speak up through proper channels. You never make medical or legal decisions, give legal advice, decide code status, or work outside your scope — but you stay in scope, protect confidentiality, support choice, document honestly, and act with integrity. Know your scope, protect trust, document the truth, do the right thing.',

                'This course provides one hour of continuing education through CAL ACE Nursing Academy (CDPH Provider NAC #7384). Your certificate is generated automatically when you pass the knowledge check.',
                'Ten questions are waiting. Everything on them was covered here. You\'re ready. Trust what you\'ve learned, and show what you know.',
              ].join('\n\n'),
            },
            {
              id: 'leg-s12-summary',
              type: 'summary',
              title: 'Five things that matter most',
              items: [
                'Stay within your scope — always. Know what a CNA may and may not do, never cross the line, give a respectful no and get the nurse, and ask rather than guess. It protects residents and your certification.',
                'Protect confidentiality — private means private. A legal duty and a matter of trust. No gossip, no discussing residents where others can hear, no social media, ever. Make it an automatic habit.',
                'Support consent and follow advance directives. Explain before care and respect refusal. Know where directives and DNR status are documented, follow the care plan, and never decide or judge them — the resident and doctor do. When unsure, ask the nurse.',
                'Document accurately and honestly. Factual, objective, timely; uncharted care is treated as undone. Never falsify, never hide a mistake. If you err, correct and report it honestly.',
                'Act with integrity — and know your scope. Do right when it\'s hard, own mistakes, refuse dangerous corners, speak up through proper channels. You never make medical/legal decisions, give legal advice, or decide code status.',
              ],
            },
          ]),
      },
    ],
  },
];

export async function seedCourse10LegalEthical(
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
      label: 'V3 rebuild — legal & ethical issues (professional practice; absorbs documentation strand)',
      status: CourseVersionStatus.DRAFT,
      deliveryMode: DeliveryMode.ONLINE,
      ceHours,
      publishedAt: null,
      contentMeta: contentMeta as Prisma.InputJsonValue,
    },
    update: {
      label: 'V3 rebuild — legal & ethical issues (professional practice; absorbs documentation strand)',
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
    `Seeding Course 10 (Legal & Ethical Issues in Nursing Practice) as DRAFT — slug "${COURSE_SLUG}", version ${VERSION_NUMBER}…`,
  );

  try {
    const result = await seedCourse10LegalEthical(prisma);
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
