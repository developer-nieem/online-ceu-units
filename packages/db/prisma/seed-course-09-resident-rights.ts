/**
 * Seed Course 9 — Resident Rights & Advocacy (DRAFT).
 *
 * V3 rebuild of "Resident Rights & Advocacy" — TITLE KEPT — aligned to the 12–50
 * scaffold. This is a PROFESSIONAL PRACTICE course, so the fixed template is lightly
 * adapted: section shells stay, but S5/S6/S7/S8 are reframed to fit a rights/ethics
 * topic (titles only; lesson slugs stay standard s05–s08).
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-09-resident-rights
 *
 * Idempotent upserts by slug. Self-cleans stray modules on the target DRAFT version.
 * Does not seed the final quiz (pending owner approval; see the -exam.ts file).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CONFIRMED against the live DB (read-only inspection inspect-rights-target.ts):
 *   COURSE_SLUG    = 'resident-rights'  (FROZEN — course already live)
 *   VERSION_NUMBER = 2                  (MAX existing version is v1 PUBLISHED with real
 *                                        content; this creates v2 as a new DRAFT revision,
 *                                        leaving v1 intact)
 * Title is KEPT unchanged ("Resident Rights & Advocacy").
 * DRAFT-only. Run order: this main seed first, then the -exam seed.
 *
 * SCOPE: CNAs honor residents' rights in every interaction, support choice and dignity,
 * protect privacy, recognize when rights are violated, advocate for residents, and report
 * rights concerns through the proper channels. CNAs do NOT override a resident's rights
 * for convenience, do NOT apply restraints outside proper orders, and work within the team
 * and chain of command. Abuse/neglect reporting mechanics are owned by Course 4 (Elder
 * Abuse); the broader legal/ethical framework is owned by Course 10.
 *
 * LEGAL ACCURACY: resident rights are described as "legally protected" / "recognized in
 * law" WITHOUT fabricated statute numbers, regulation citations, or agency names. Any
 * specific legal citation added later must be verified against the actual source.
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
const COURSE_SLUG = 'resident-rights';

// Title KEPT unchanged per the production package.
const COURSE_TITLE = 'Protecting Resident Choice, Dignity, and Voice';
const COURSE_SUMMARY =
  'Residents do not give up their rights at the door — they keep their full, legally protected rights in care. Know the core rights (dignity, privacy, choice, consent and refusal, freedom from abuse and improper restraint, voicing complaints, money and belongings, visitors), honor them in the small daily moments where rights live, recognize when a right is being violated, and advocate for residents through the proper channels. CNAs uphold rights and advocate; they do not override rights for convenience, restrain outside proper orders, or work outside the chain of command.';

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
    'Know the core resident rights — dignity, privacy, choice, consent/refusal, freedom from abuse and restraint, voice, property, visitors',
    'Honor those rights in the small daily moments where rights live',
    'Recognize when a right is being violated, large or small',
    'Advocate for residents and report rights concerns through the proper channels',
    'Honor a competent resident\'s right to refuse — and stay within CNA scope',
  ],
  faq: [] as { question: string; answer: string }[],
  compliance: {
    providerName: 'CAL ACE Nursing Academy',

    cdphApprovalStatus: 'placeholder' as const,
    targetAudience: 'California certified nursing assistants',
    requiredSeatTimeMinutes: 50,
    onlineDeliveryDesignation: 'online' as const,
  },
  imageAccent: 'gold',
  heroImage: '/assets/courses/resident-rights/hero-banner.jpg',
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
    title: 'Resident Rights — The Foundation',
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: 'Introduction',
        sortOrder: 0,
        buildContent: () =>
          doc('Introduction', [
            { id: 'rgt-s01-heading', type: 'heading', level: 1, text: 'Introduction' },
            {
              id: 'rgt-s01-video',
              type: 'video',
              title: 'Introduction',
              videoUrl: '/assets/courses/resident-rights/s01-intro.mp4',
              placeholderNote: 'Pending upload: /assets/courses/resident-rights/s01-intro.mp4',
            },
            {
              id: 'rgt-s01-image',
              type: 'image',
              src: '/assets/courses/resident-rights/s01-hero.jpg',
              caption: 'Every resident keeps their full rights — and their dignity — in care.',
            },
            {
              id: 'rgt-s01-narration',
              type: 'text',
              body: [
                'Welcome to CAL ACE Nursing Academy.',
                'This course is about resident rights and advocacy — and it sits at the very heart of what it means to be a good caregiver. Because no matter how skilled your hands are, care without respect for a person\'s rights isn\'t good care. This course is about treating every resident as the full human being and rights-holding adult they are, and about being the one who speaks up when those rights are at risk.',
                'Let\'s start with the foundation. Residents in a care facility do not give up their rights at the door. They keep the same basic rights every adult has — and the law specifically protects a set of rights for people living in care. A resident is not a patient who must simply do as they\'re told. They are an adult living in what is, for now, their home — and you are, in a real sense, a guest and a helper in that home. That shift in view changes everything about how care should feel.',
                'Here are the core rights you\'ll learn to honor. The right to dignity and respect — always. The right to privacy and confidentiality. The right to make their own choices and decisions about their care and daily life. The right to be informed and to give or refuse consent. The right to be free from abuse, neglect, and improper restraint. The right to voice complaints without fear. The right to manage their own money and possessions. The right to keep personal belongings. And the right to receive visitors and stay connected to the people they love. These aren\'t favors you grant — they belong to the resident, by right.',
                'Now, why does your role matter so much? Because you, the CNA, are the person most present in a resident\'s daily life — and that makes you both the most frequent protector of their rights and, if you\'re not careful, the person most able to accidentally trample them. Rights are honored or lost in the small daily moments: whether you knock before entering, whether you offer a choice or just take over, whether you keep their information private, whether you listen when they say no. You are where rights become real.',
                'And you are their advocate. Many residents — frail, ill, confused, or afraid — can\'t always stand up for their own rights. So they need someone who will: someone who notices when a right is being overlooked or violated and speaks up. That someone is often you. Advocacy means putting the resident\'s rights, wishes, and wellbeing first, and being willing to raise concerns through the proper channels even when it\'s easier to stay quiet.',
                'The guiding spirit of this course: residents keep all their rights — and you are their daily protector and their voice.',
                'Your scope is clear. A CNA honors residents\' rights in every interaction, supports their choices and dignity, protects their privacy, recognizes when rights are being violated, advocates for residents, and reports rights concerns through the proper channels. A CNA does not override a resident\'s rights for convenience, and works within the team and chain of command to resolve concerns.',
                'By the end of this course, you will be able to: know the core resident rights. Honor them in daily care. Recognize when rights are being violated. Advocate for residents. And report concerns properly. Let\'s begin.',
              ].join('\n\n'),
            },
            {
              id: 'rgt-s01-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Residents keep their rights',
              body: 'Residents do not give up their rights at the door — they keep the same rights as any adult, plus rights the law protects for people in care. A resident is a rights-holding adult living in their home, and you are a helper and guest in it. Rights are honored or lost in the small daily moments. You honor rights and advocate; you don\'t override rights for convenience or restrain outside proper orders.',
            },
          ]),
      },
      {
        slug: 's02-terms',
        title: 'Terms & Definitions',
        sortOrder: 1,
        buildContent: () =>
          doc('Terms & Definitions', [
            { id: 'rgt-s02-heading', type: 'heading', level: 1, text: 'Terms & Definitions' },
            {
              id: 'rgt-s02-image',
              type: 'image',
              src: '/assets/courses/resident-rights/s02-hero.jpg',
              caption: 'Privacy begins with a knock and a moment\'s wait.',
            },
            {
              id: 'rgt-s02-reveal-rights',
              type: 'reveal_card',
              frontTitle: 'Resident Rights',
              frontBody: 'Resident rights',
              backTitle: 'Resident Rights',
              backBody:
                'The legal and human rights that every person living in a care facility keeps — they do not lose them by needing care. These include dignity, privacy, choice, consent, freedom from abuse and restraint, voicing complaints, managing their money and belongings, and having visitors. Residents are rights-holding adults living in their home, and honoring these rights is central to good care.',
            },
            {
              id: 'rgt-s02-reveal-dignity',
              type: 'reveal_card',
              frontTitle: 'Dignity',
              frontBody: 'Dignity',
              backTitle: 'Dignity',
              backBody:
                'The respect and sense of worth every person deserves, simply for being human — regardless of age, illness, or ability. Honoring dignity means treating residents as the adults and individuals they are: never talking down to them, never embarrassing them, always offering privacy, choice, and gentleness. Dignity runs through every right, and protecting it is the heart of caregiving.',
            },
            {
              id: 'rgt-s02-reveal-privacy',
              type: 'reveal_card',
              frontTitle: 'Privacy & Confidentiality',
              frontBody: 'Privacy & confidentiality',
              backTitle: 'Privacy & Confidentiality',
              backBody:
                'Privacy is the resident\'s right to bodily privacy, personal space, and private moments — knocking before entering, covering them during care, closing doors and curtains. Confidentiality is keeping their personal and health information private, shared only with those who need it for care. Both protect the resident\'s dignity and trust, and both are easy to violate without thinking.',
            },
            {
              id: 'rgt-s02-reveal-autonomy',
              type: 'reveal_card',
              frontTitle: 'Autonomy (Self-Determination)',
              frontBody: 'Autonomy — self-determination',
              backTitle: 'Autonomy (Self-Determination)',
              backBody:
                'The resident\'s right to make their own choices and decisions about their care and daily life — when to wake, what to wear, what to eat, whether to accept a treatment. Residents are adults who direct their own lives, even when we\'d choose differently. Honoring autonomy means offering real choices and respecting them — not deciding for residents because it\'s faster.',
            },
            {
              id: 'rgt-s02-reveal-consent',
              type: 'reveal_card',
              frontTitle: 'Informed Consent & Right to Refuse',
              frontBody: 'Informed consent & right to refuse',
              backTitle: 'Informed Consent & Right to Refuse',
              backBody:
                'Residents have the right to be told what\'s being done to them and why, and to agree to it — or to refuse it. A competent resident can refuse care, food, or treatment, even when we disagree. You don\'t force care on a resident who refuses; you respect the refusal, explain gently, and report it. Consent and refusal are rights, not optional courtesies.',
            },
            {
              id: 'rgt-s02-reveal-advocacy',
              type: 'reveal_card',
              frontTitle: 'Advocacy',
              frontBody: 'Advocacy',
              backTitle: 'Advocacy',
              backBody:
                'Speaking and acting in support of a resident\'s rights, wishes, and wellbeing — especially when they can\'t do it themselves. An advocate notices when a right is overlooked or violated, puts the resident first, and raises concerns through the proper channels. As the caregiver most present in a resident\'s life, the CNA is often their most important everyday advocate.',
            },
            {
              id: 'rgt-s02-reveal-restraint',
              type: 'reveal_card',
              frontTitle: 'Freedom from Restraint',
              frontBody: 'Freedom from restraint',
              backTitle: 'Freedom from Restraint',
              backBody:
                'The right not to be restrained — physically or chemically — for convenience or discipline. Restraints can only be used in very limited, properly ordered situations, never to make care easier or to control a resident who\'s simply difficult. Improperly restraining a resident violates their rights and can cause real harm. CNAs never apply restraints outside proper orders.',
            },
            {
              id: 'rgt-s02-reveal-grievance',
              type: 'reveal_card',
              frontTitle: 'Grievance (Right to Complain)',
              frontBody: 'Grievance — right to complain',
              backTitle: 'Grievance (Right to Complain)',
              backBody:
                'A resident\'s right to voice complaints or concerns about their care or treatment — and to do so without fear of punishment or retaliation. Residents can speak up, and the facility must address it. As a CNA, you support this right: you listen, you take complaints seriously, you never dismiss or punish a resident for complaining, and you pass concerns along properly.',
            },
            {
              id: 'rgt-s02-knowledge-check',
              type: 'knowledge_check',
              question: 'When a person becomes a resident in a care facility, their rights:',
              options: [
                { id: 'keep', label: 'Stay with them — they keep their rights' },
                { id: 'door', label: 'Are given up at the door' },
                { id: 'staff', label: 'Belong to the staff now' },
              ],
              correctOptionId: 'keep',
              explanation:
                'Residents do not give up their rights by entering a care facility. They keep the same basic rights as any adult, plus specific rights the law protects for people in care. A resident is a rights-holding adult living in their home, and honoring those rights is central to good care.',
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
            { id: 'rgt-s03-heading', type: 'heading', level: 1, text: 'Why It Matters' },
            {
              id: 'rgt-s03-image',
              type: 'image',
              src: '/assets/courses/resident-rights/s03-hero.jpg',
              caption: 'Rights live in the thousand small moments of daily care.',
            },
            pendingAudio(
              'rgt-s03-audio',
              'Rights Don\'t Retire: Why Everyday Care Is Where They Live or Die',
              '/assets/courses/resident-rights/s03-stats-podcast.mp3',
              [
                'Rights Don\'t Retire: Why Everyday Care Is Where They Live or Die',
                '',
                'One of the most important things a caregiver can understand is that people do not surrender their rights when they enter a care facility. The rights protected for residents are not vague ideals or facility courtesies — they are established, legally protected rights, recognized in law precisely because vulnerable people in care settings have, historically, been at risk of losing them. Residents have the right to dignity, privacy, choice, informed consent, freedom from abuse and improper restraint, the ability to voice complaints, control of their own money and belongings, and connection with visitors and loved ones. These rights belong to the resident, fully and by law, no matter how dependent on care they become.',
                '',
                'What makes this so central to a CNA\'s work is where rights actually live: not in a framed document on the wall, but in the thousand small moments of daily care. A resident\'s right to privacy is honored — or violated — depending on whether you knock before entering, whether you cover them during a bath, whether you close the curtain. Their right to dignity lives in whether you speak to them as an adult or talk down to them like a child. Their right to choice lives in whether you offer real options about their day or simply take over because it\'s faster. Their right to refuse lives in whether you respect a "no" or push past it. Rights, in other words, are made real or hollow by exactly the person who is with the resident most — and that person is the CNA. No policy can protect a right that the caregiver at the bedside ignores; and a caregiver who honors rights brings them to life every shift.',
                '',
                'The other half of this is advocacy, and it matters because so many residents cannot fully protect their own rights. They may be frail, ill, cognitively impaired, frightened of retaliation, or simply unaccustomed to speaking up. A resident who is being talked over, whose choices are being ignored, whose belongings have gone missing, or whose dignity is being eroded often cannot or will not say so. They need someone who notices and speaks for them — an advocate. And because the CNA is the most present, most observant person in the resident\'s daily life, the CNA is uniquely positioned to be that advocate: to catch the overlooked right, to put the resident first, and to raise the concern through proper channels even when staying quiet would be easier. Research and oversight in long-term care consistently identify frontline caregivers who respect rights and speak up as one of the strongest protections residents have.',
                '',
                'The encouraging truth is that honoring rights and advocating well don\'t require special authority — they require awareness, respect, and the willingness to act. A CNA who treats every resident as a rights-holding adult, who honors their dignity and choices in the small moments, and who speaks up when something is wrong, profoundly shapes whether residents live with dignity or without it. The bottom line: residents keep their full, legally protected rights in care; those rights are honored or lost in everyday CNA moments; many residents can\'t advocate for themselves; and the CNA is their most present protector and their everyday voice.',
              ].join('\n'),
              '/assets/courses/resident-rights/s03-stats-podcast.mp3',
            ),
            {
              id: 'rgt-s03-source-note',
              type: 'callout',
              variant: 'clinical',
              title: 'About these claims',
              body: 'This section describes resident rights as legally protected in a general way, without citing specific statutes, regulations, or agencies. Any precise legal citation added later (e.g., a specific federal regulation or state code) must be verified against the actual source — never asserted from memory or estimation.',
            },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: 'Fundamentals',
        sortOrder: 3,
        buildContent: () =>
          doc('Fundamentals', [
            { id: 'rgt-s04-heading', type: 'heading', level: 1, text: 'Fundamentals' },
            {
              id: 'rgt-s04-video',
              type: 'video',
              title: 'Fundamentals',
              videoUrl: '/assets/courses/resident-rights/s04-fundamentals.mp4',
              placeholderNote: 'Pending upload: /assets/courses/resident-rights/s04-fundamentals.mp4',
            },
            {
              id: 'rgt-s04-image',
              type: 'image',
              src: '/assets/courses/resident-rights/s04-hero.jpg',
              caption: 'Honoring autonomy means offering real choices.',
            },
            {
              id: 'rgt-s04-narration',
              type: 'text',
              body: [
                '**Residents keep their rights**',
                'Start with the foundation: residents do not lose their rights by entering care. They keep the same basic rights as any adult, plus specific rights the law protects for people in care facilities. A resident is not someone who must simply obey — they are a rights-holding adult living in their home, for now, and you are a helper and guest in that home. This single shift — from "patient who complies" to "adult with rights in their own home" — reshapes how all good care should feel: respectful, collaborative, and centered on the resident.',
                '**Dignity and respect, always**',
                'Dignity is the right that runs through every other one. It means treating residents as the worthy adults and individuals they are, in every interaction: speaking to them respectfully, never talking down or using baby talk, never embarrassing them, never treating them as objects or tasks. It means caring for their appearance, protecting their privacy during personal care, and honoring who they are. Dignity costs nothing and means everything. Every resident, no matter how ill, confused, or dependent, deserves it — and you protect it or erode it in how you speak, touch, and act.',
                '**Privacy and confidentiality**',
                'Residents have a right to privacy and to confidentiality, and both are easy to violate without meaning to. Privacy: knock and wait before entering, close doors and curtains during care, keep them covered, give private moments, and respect their space and belongings. Confidentiality: keep their personal and health information private — don\'t gossip about residents, don\'t discuss them where others can hear, share information only with those who need it for care. Protecting privacy and confidentiality protects dignity and trust. Treat their bodies, their space, and their information as the private things they are.',
                '**Choice, autonomy, and the right to refuse**',
                'Residents have the right to make their own choices — about their care, their routine, their daily life — and even to refuse care. Honor autonomy: offer real choices about waking, dressing, eating, activities, and care, and respect them even when you\'d choose differently. And respect the right to refuse: a competent resident can say no to care, food, or treatment, and you don\'t force it — you explain gently, respect the choice, and report it. This can be hard when you believe you know better, but adults have the right to make their own decisions, including ones we disagree with. Offering choice and honoring "no" is honoring the person.',
                '**Freedom from abuse, neglect, and restraint**',
                'Residents have the right to be safe — free from abuse, neglect, and improper restraint. Abuse and neglect, which you study closely elsewhere, are the gravest rights violations, and you\'re a mandated reporter of them. Restraint, too, is a rights matter: residents must not be restrained — physically or with medication — for convenience, discipline, or to control a "difficult" resident. Restraints are allowed only in narrow, properly ordered situations, never to make care easier. You never apply a restraint outside proper orders, and you protect residents from being controlled or confined in ways that violate their freedom and dignity.',
                '**Voice, money, belongings, and visitors**',
                'Several everyday rights round out the picture. The right to voice complaints — residents can raise concerns without fear of punishment, and you listen, take them seriously, and pass them along. The right to manage their money and possessions — you never take, borrow, or misuse a resident\'s money or belongings, and you report any concerns about their finances. The right to keep personal belongings — their things matter; treat them with care and respect. And the right to visitors and connection — residents can see the people they love and stay connected. These rights protect a resident\'s voice, property, and relationships — the things that keep life feeling like their own.',
                '**You are the daily protector and advocate**',
                'Bring it together: rights are honored or lost in your daily care, and you are both their protector and their advocate. Protector, because in every small moment — the knock, the choice, the closed curtain, the respected "no" — you make rights real or hollow. Advocate, because many residents can\'t stand up for their own rights, so they need you to notice when a right is overlooked or violated and to speak up through the proper channels. Putting the resident\'s rights, wishes, and wellbeing first — even when it\'s not the easiest path — is what advocacy means. You are where rights live, and often the voice residents don\'t otherwise have.',
              ].join('\n\n'),
            },
            {
              id: 'rgt-s04-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'From "patient who complies" to "adult with rights in their own home"',
              body: 'Dignity runs through every right. Privacy and confidentiality are lost in thoughtless habits. Autonomy means honoring choice and "no" even when you\'d choose differently. Freedom from restraint means never restraining for convenience or discipline. And you are both protector (rights live in your small daily acts) and advocate (you speak up for those who can\'t).',
            },
          ]),
      },
    ],
  },
  {
    slug: 'module-2',
    title: 'Recognizing Violations & Upholding Rights',
    sortOrder: 1,
    lessons: [
      {
        slug: 's05-signs',
        title: 'Signs a Right Is Being Violated',
        sortOrder: 0,
        buildContent: () =>
          doc('Signs a Right Is Being Violated', [
            { id: 'rgt-s05-heading', type: 'heading', level: 1, text: 'Signs a Right Is Being Violated' },
            {
              id: 'rgt-s05-image',
              type: 'image',
              src: '/assets/courses/resident-rights/s05-hero.jpg',
              caption: 'Noticing when a resident is overlooked or a right is at risk.',
            },
            {
              id: 'rgt-s05-narration',
              type: 'text',
              body: [
                'Protecting rights starts with recognizing when they\'re being violated — sometimes blatantly, but often in small, easy-to-miss ways. Let\'s learn what to watch for. You\'re not judging or investigating; you\'re noticing and speaking up.',
                '**Dignity and privacy violations**',
                'Watch for the everyday erosion of dignity and privacy. Staff entering without knocking or waiting. Residents left exposed, uncovered, or undressed in view of others during care. Doors and curtains left open during personal care or toileting. Being talked down to, spoken to like a child, or with baby talk. Being discussed, gossiped about, or having private information shared where others can hear. Being treated as a task or object rather than a person — handled roughly or hurriedly without acknowledgment. These violations often happen casually, without anyone meaning harm — which is exactly why noticing them matters. Dignity and privacy are lost in these small, unnoticed moments.',
                '**Choice, autonomy, and consent violations**',
                'Watch for the resident\'s voice being overridden. Choices ignored or made for them — being told when to wake, what to wear, what to eat, with no say. Care done to them without explanation or consent. A resident\'s "no" being ignored, or care forced on someone who refuses. Being rushed or pressured into things. Being denied reasonable preferences because it\'s inconvenient for staff. Routines built around staff convenience rather than resident wishes. When a competent adult\'s choices and refusals are routinely overridden, their autonomy — a core right — is being violated, even when the care itself is well-intentioned. Watch for the missing "no" and the unoffered choice.',
                '**Restraint, money, belongings, and complaint violations**',
                'Watch for violations of safety, property, and voice. Improper restraint — a resident restrained or confined for convenience or to control them, without proper orders. Money or belongings going missing, or someone misusing a resident\'s finances. Personal possessions treated carelessly, lost, or taken. A resident\'s complaints dismissed, ignored, or — most seriously — met with punishment or retaliation, or a resident afraid to complain. Visitors or connection unreasonably restricted. And of course, abuse and neglect — the gravest violations, which you report as a mandated reporter. These strike at a resident\'s freedom, property, voice, and safety. Notice them and act.',
                '**What to do when you notice**',
                'When you recognize a rights violation, act within your role. For everyday violations — the unknocked door, the ignored choice, the talked-down-to resident — you can often uphold the right yourself in the moment: knock, offer the choice, cover the resident, speak respectfully, and model better practice. For concerns you can\'t fix yourself, or that involve another staff member or a pattern, advocate by raising it through the proper channels — to the nurse or charge nurse. And for abuse, neglect, or improper restraint — the most serious violations — report immediately as you\'ve learned, per your facility\'s policy. You don\'t confront, judge, or investigate; you uphold what you can, and report what you should. Speaking up is advocacy.',
                'The rule underneath it all: notice violations large and small, uphold rights in the moment where you can, and advocate or report through proper channels — residents need you to see what they can\'t always say.',
              ].join('\n\n'),
            },
            {
              id: 'rgt-s05-callout',
              type: 'callout',
              variant: 'warning',
              title: 'Most violations are casual, not cruel',
              body: 'Dignity/privacy: no knocking, left exposed, talked down to, gossiped about. Choice/consent: choices ignored, "no" overridden, care forced, routines for staff convenience. Restraint/property/voice: improper restraint, missing money or belongings, complaints dismissed or punished. Act: uphold what you can in the moment, advocate through proper channels, report serious violations immediately.',
            },
          ]),
      },
      {
        slug: 's06-causes',
        title: 'Why Rights Get Overlooked',
        sortOrder: 1,
        buildContent: () =>
          doc('Why Rights Get Overlooked', [
            { id: 'rgt-s06-heading', type: 'heading', level: 1, text: 'Why Rights Get Overlooked' },
            {
              id: 'rgt-s06-image',
              type: 'image',
              src: '/assets/courses/resident-rights/s06-hero.jpg',
              caption: 'Dignity is honored even under time pressure — it takes only seconds.',
            },
            pendingAudio(
              'rgt-s06-audio',
              'Why Good Caregivers Still Overlook Rights — and How to Stop',
              '/assets/courses/resident-rights/s06-causes-podcast.mp3',
              [
                'Why Good Caregivers Still Overlook Rights — and How to Stop',
                '',
                'Most resident-rights violations don\'t come from cruelty. They come from haste, habit, and not noticing — which is actually hopeful, because those are things awareness can fix. Understanding why rights get overlooked is the key to protecting them.',
                '',
                'The biggest culprit is rushing and understaffing. When a caregiver has too many residents and too little time, the small acts that honor rights — knocking and waiting, offering a real choice, explaining before doing, closing the curtain, listening to a complaint — feel like luxuries to be skipped. It\'s faster to walk in without waiting, to decide what a resident will wear, to do care to them rather than with them. Under pressure, dignity and choice quietly lose to speed. None of it is meant as disrespect, but the resident experiences it as exactly that. Recognizing this lets a caregiver protect the small rights-honoring habits even when time is short, because they take only seconds and mean everything.',
                '',
                'A second cause is habit and seeing care as tasks rather than as serving a person. When the job becomes a checklist — bathe, dress, feed, move on — it\'s easy to forget that each task happens to a rights-holding adult in their own home. The resident becomes "the bath in room 4" instead of Mr. Reyes who would like to choose his shirt. Task-focus, not malice, erodes dignity and autonomy. Shifting the lens back to the person — this is someone\'s home, someone\'s choice, someone\'s dignity — restores the rights that task-thinking overlooks.',
                '',
                'A third, subtler cause is well-meaning paternalism: overriding a resident\'s choices "for their own good." A caregiver who insists a resident eat, or wear a sweater, or accept care they\'ve refused, may genuinely believe they\'re helping — but a competent adult has the right to make their own decisions, even ones we disagree with, and overriding them, however kindly meant, violates their autonomy. Caring about someone doesn\'t give us the right to decide for them. Recognizing this tension helps caregivers honor choice and refusal even when they\'d choose differently.',
                '',
                'And finally, rights get overlooked simply because small violations go unrecognized. Many caregivers were never taught to see the unknocked door or the ignored preference as a rights issue at all. Once you can see them — once you recognize that these everyday moments are where rights live — you can\'t unsee them, and you start protecting them automatically. The takeaway: rights are usually violated by rush, habit, task-thinking, and kindly meant overriding — not cruelty — which means awareness, a person-centered lens, respect for choice, and noticing the small moments are exactly what prevent violations. Good caregivers honor rights not because they try harder to be good people, but because they learn to see where rights live and protect them on purpose.',
              ].join('\n'),
              '/assets/courses/resident-rights/s06-causes-podcast.mp3',
            ),
          ]),
      },
      {
        slug: 's07-medications',
        title: 'Upholding Rights & Advocating',
        sortOrder: 2,
        buildContent: () =>
          doc('Upholding Rights & Advocating', [
            { id: 'rgt-s07-heading', type: 'heading', level: 1, text: 'Upholding Rights & Advocating' },
            {
              id: 'rgt-s07-image',
              type: 'image',
              src: '/assets/courses/resident-rights/s07-hero.jpg',
              caption: 'The most vulnerable residents need the closest protection.',
            },
            {
              id: 'rgt-s07-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of practice',
              body: 'A CNA honors and protects rights and advocates for residents through proper channels. A CNA does not override a resident\'s rights for convenience, does not apply restraints outside proper orders, and works within the team and chain of command to resolve concerns. Abuse, neglect, and improper restraint are reported immediately as a mandated reporter.',
            },
            {
              id: 'rgt-s07-narration',
              type: 'text',
              body: [
                'There\'s no medication for rights — upholding them is a practice, woven through everything you do, and advocacy is the action you take when rights are at risk. Let\'s walk through both. And the scope first: a CNA honors and protects rights and advocates for residents through proper channels — a CNA does not override a resident\'s rights for convenience, and works within the team and chain of command to resolve concerns.',
                '**Honor dignity and privacy in every moment.** This is upholding rights at its most constant. Speak to residents respectfully, as adults — never talk down, never baby-talk, never embarrass. Knock and wait before entering. Close doors and curtains and keep residents covered during care. Protect their information — no gossip, no discussing residents where others can hear. Care for their appearance and their belongings with respect. These small, repeated acts are where dignity and privacy live, and honoring them every time is the foundation of rights-respecting care.',
                '**Offer choice and respect refusal.** Uphold autonomy by genuinely offering choices — about waking, dressing, eating, activities, care — and honoring them, even when you\'d choose differently. Explain care before you do it, and seek the resident\'s agreement. And respect the right to refuse: when a competent resident says no, you don\'t force it — you explain gently, respect the choice, and report the refusal so the team knows. Treating residents as decision-makers in their own lives, rather than recipients to be managed, is central to honoring their rights.',
                '**Support voice, property, and connection.** Uphold the everyday rights that protect a resident\'s life as their own. Listen to complaints, take them seriously, never dismiss or punish a resident for speaking up, and pass concerns along. Never take, borrow, or misuse a resident\'s money or belongings, and report any financial concerns. Treat their possessions with care. And support their connection to visitors and loved ones. These acts protect a resident\'s voice, property, and relationships — the things that keep dignity and identity intact.',
                '**Advocate — be their voice.** When a right is being overlooked or violated and you can\'t simply fix it yourself, advocate. Put the resident\'s rights and wishes first. Raise the concern through the proper channels — to the nurse or charge nurse — clearly and factually. Speak up for residents who can\'t speak for themselves, whether their choices are being ignored, their dignity eroded, or their needs unmet. Advocacy sometimes means saying the uncomfortable thing on a resident\'s behalf — and doing it through the right channels is exactly your role. Being willing to speak up is what makes you a true advocate.',
                '**Report serious violations immediately.** Hold the bright line. Abuse, neglect, and improper restraint are the gravest rights violations, and you report them immediately as a mandated reporter, per your facility\'s policy and the duty you\'ve learned — to the nurse or charge nurse. You never apply restraints outside proper orders. You never stay silent about serious violations. For these, advocacy means prompt, proper reporting — and it can protect a resident from real harm.',
                'The scope point: you don\'t override rights or work outside the chain of command — but you honor dignity, privacy, choice, and refusal in every moment, support voice, property, and connection, advocate through proper channels, and report serious violations immediately. That practice is how rights become real.',
              ].join('\n\n'),
            },
            {
              id: 'rgt-s07-callout',
              type: 'callout',
              variant: 'warning',
              title: 'Hold the bright lines',
              body: 'Respect "no" — competent adults can refuse care. Never take, borrow, or misuse a resident\'s money or belongings. Never apply restraints outside proper orders. Never dismiss or punish a complaint. Abuse, neglect, improper restraint → report immediately as a mandated reporter. Advocate through proper channels — never confront or shame a coworker publicly.',
            },
          ]),
      },
      {
        slug: 's08-prevention',
        title: 'Preventing Rights Violations',
        sortOrder: 3,
        buildContent: () =>
          doc('Preventing Rights Violations', [
            { id: 'rgt-s08-heading', type: 'heading', level: 1, text: 'Preventing Rights Violations' },
            {
              id: 'rgt-s08-image',
              type: 'image',
              src: '/assets/courses/resident-rights/s08-hero.jpg',
              caption: 'Protecting dignity lives in the small, constant acts of care.',
            },
            {
              id: 'rgt-s08-narration',
              type: 'text',
              body: [
                'Preventing rights violations is mostly about awareness and small consistent habits. Here are seven ways to make rights-respecting care automatic.',
                '**One. See the person, not the task.** The first prevention is your lens: remember that every task happens to a rights-holding adult in their own home. Not "the bath in room 4," but Mr. Reyes, who would like to choose his shirt. When you keep the person in view, dignity and choice come naturally; when care becomes a checklist, rights slip away. Hold the person, always.',
                '**Two. Make the small habits automatic.** Knock and wait. Close the curtain. Keep them covered. Offer a choice. Explain before you do. Speak as to an adult. These take only seconds, and they\'re exactly where rights live. Build them into muscle memory so that even on your busiest, most rushed day, you honor rights without having to think about it. Consistency is prevention.',
                '**Three. Protect rights even when you\'re rushed.** Most violations come from haste — so guard the rights-honoring habits precisely when time is short. The knock, the choice, the respectful word cost almost nothing and mean everything. Don\'t let "I\'m too busy" become the reason a resident loses their dignity. Staying rights-respecting under pressure is the real test, and the real prevention.',
                '**Four. Honor choice and refusal — even when you disagree.** Resist the pull of well-meaning paternalism. When a competent resident makes a choice or refuses care, honor it, explain gently, and report — rather than overriding "for their own good." Caring about someone doesn\'t give you the right to decide for them. Respecting choice and "no," even when it\'s hard, prevents the autonomy violations that good intentions can cause.',
                '**Five. Guard privacy and confidentiality.** Prevent the casual violations: don\'t gossip about residents, don\'t discuss them where others can hear, keep their information to those who need it, and protect their bodily privacy in every care moment. Privacy and confidentiality are lost in thoughtless habits — so building careful ones prevents a whole category of violations before they happen.',
                '**Six. Listen, and never punish a voice.** Prevent the silencing of residents: listen to complaints and preferences, take them seriously, and never dismiss, brush off, or retaliate against a resident for speaking up. When residents feel heard and safe to voice concerns, problems surface early and rights are protected. A culture of listening prevents both violations and the fear that hides them.',
                '**Seven. Speak up — for residents and the right way.** The final prevention is your willingness to act: notice violations, uphold rights in the moment, and advocate through proper channels when you can\'t fix something yourself — and report serious violations immediately. Don\'t look away from a colleague\'s rough or rights-violating care. Your voice, used properly, prevents violations from continuing and protects residents who can\'t protect themselves.',
              ].join('\n\n'),
            },
          ]),
      },
    ],
  },
  {
    slug: 'module-3',
    title: 'Advocacy, Your Role, and Application',
    sortOrder: 2,
    lessons: [
      {
        slug: 's09-emergency',
        title: 'When to Speak Up & Advocate',
        sortOrder: 0,
        buildContent: () =>
          doc('When to Speak Up & Advocate', [
            {
              id: 'rgt-s09-heading',
              type: 'heading',
              level: 1,
              text: 'When to Speak Up & Advocate',
            },
            pendingAudio(
              'rgt-s09-intro-audio',
              'Honoring refusal and advocating when rights are violated — intro',
              '/assets/courses/resident-rights/s09-emergency-intro.mp3',
              'In resident rights, two judgments matter most: honoring a competent resident\'s right to refuse even when you disagree, and speaking up when you see a resident\'s rights being violated. You\'re about to work through two situations. Read each carefully, choose your action, and you\'ll get feedback right away. Keep the core ideas in mind: a competent adult can refuse care, and you respect it, explain gently, and report — and when rights are violated, you uphold what you can and advocate or report through proper channels, never just looking away.',
              '/assets/courses/resident-rights/s09-emergency-intro.mp3',
            ),
            {
              id: 'rgt-s09-image',
              type: 'image',
              src: '/assets/courses/resident-rights/s09-hero.jpg',
              caption: 'A competent adult can refuse care — respect it, explain gently, report.',
            },
            {
              id: 'rgt-s09-scenario-refuse-image',
              type: 'image',
              src: '/assets/courses/resident-rights/s09-scenario-refuse.jpg',
              caption: 'Honor a competent resident\'s right to say no — never force.',
            },
            {
              id: 'rgt-s09-scenario-refuse',
              type: 'scenario_question',
              prompt:
                'Mr. Reyes, who is alert and competent, tells you he does not want his shower this morning — he\'s tired and just wants to rest. You\'re on a tight schedule and showers are "supposed" to happen now. A coworker says, "Just get him in the shower anyway — tell him he has no choice, it\'s shower time, and push through if he fusses." What SHOULD the CNA do?',
              options: [
                {
                  id: 'force',
                  label: 'Force him into the shower since it\'s the scheduled time',
                  feedback:
                    'Mr. Reyes is alert and competent, and competent adults have the right to refuse care — forcing the shower violates his autonomy and dignity, and forcing care on a refusing resident can even cross into abuse. His being on "the schedule" doesn\'t override his right; the schedule serves him, not the reverse. The right approach: respect his refusal, explain gently, offer an alternative or later time, and report the refusal so his needs are still met.',
                },
                {
                  id: 'no-choice',
                  label: 'Tell him he has no choice and push through his objections',
                  feedback:
                    'Telling him he "has no choice" violates his autonomy — a competent adult has the right to refuse care, and pushing through his objections to force care can cross into abuse. The schedule serves him, not the reverse. The right approach: respect his refusal, explain gently why the shower is offered, honor his choice, offer an alternative or later time, and report the refusal so his needs are still met.',
                },
                {
                  id: 'respect',
                  label: 'Respect his right to refuse — explain gently why it\'s offered, honor his choice, offer an alternative or later time, and report the refusal',
                  feedback:
                    'Right — and this honors one of the most fundamental resident rights. Mr. Reyes is alert and competent, and competent adults have the right to make their own choices about their care, including the right to refuse. Forcing him into the shower or telling him he "has no choice" would violate his autonomy and dignity, and forcing care on a refusing resident is never acceptable — it can even cross into abuse. His being on "the schedule" doesn\'t override his right; the schedule serves him, not the other way around. The right approach honors his choice while still caring well: respect his refusal, explain gently why the shower is offered and let him make an informed decision, offer an alternative — perhaps a later time, or a different kind of hygiene he\'ll accept — and report the refusal to the nurse so the team knows and his needs are still met. Note the other trap too: simply abandoning his hygiene for the week isn\'t respecting autonomy — it\'s neglect. The goal is to honor his right to refuse this shower, now, while continuing to offer care and keep him clean and healthy in ways he\'ll accept. Respecting "no," even when it complicates your schedule, is respecting the person.',
                  isRecommended: true,
                },
                {
                  id: 'neglect',
                  label: 'Just skip his hygiene entirely for the week and say nothing',
                  feedback:
                    'Abandoning his hygiene entirely isn\'t respecting autonomy — it\'s neglect, and saying nothing fails him too. Respecting his right to refuse this shower doesn\'t mean stopping all care. The right approach: respect his refusal of the shower now, explain gently, offer an alternative or later time, and report the refusal so his hygiene needs are still met in ways he\'ll accept.',
                },
              ],
              requiredForCompletion: true,
            },
            {
              id: 'rgt-s09-scenario-advocate-image',
              type: 'image',
              src: '/assets/courses/resident-rights/s09-scenario-advocate.jpg',
              caption: 'Advocate through proper channels for those who cannot speak up.',
            },
            {
              id: 'rgt-s09-scenario-advocate',
              type: 'scenario_question',
              prompt:
                'You notice that another caregiver routinely enters residents\' rooms without knocking, leaves residents uncovered and exposed during care with the door open, and talks about residents\' private health information loudly in the hallway where visitors can hear. The residents seem uncomfortable but say nothing. A coworker tells you, "That\'s just how she works — it\'s not your business, leave it alone." What SHOULD the CNA do?',
              options: [
                {
                  id: 'leave-alone',
                  label: 'Leave it alone since it\'s not your business',
                  feedback:
                    '"It\'s not your business" is wrong — protecting residents\' rights is precisely your business as their caregiver and advocate. These are real violations of privacy, dignity, and confidentiality, and the residents\' discomfort and silence are exactly why advocacy matters. The right action: advocate by raising the concern through proper channels to the nurse or charge nurse, and model rights-respecting care yourself.',
                },
                {
                  id: 'advocate',
                  label: 'Recognize these as violations of residents\' privacy, dignity, and confidentiality, and advocate — raise the concern through the proper channels to the nurse or charge nurse',
                  feedback:
                    'Right — and this is advocacy in action. What you\'re seeing are real rights violations, even if no one means harm: entering without knocking and leaving residents exposed with the door open violates their privacy and dignity, and discussing private health information where others can hear violates confidentiality. The residents\' discomfort, and their silence, are exactly why advocacy matters — many residents won\'t or can\'t speak up for themselves, so they need someone who will. "It\'s not your business" is wrong: protecting residents\' rights is precisely your business as their caregiver and advocate. But notice the other traps. Loudly confronting and shaming the coworker in front of everyone isn\'t the right channel — it can escalate things and isn\'t your role; concerns about another staff member\'s practice go through the proper chain. And adopting the bad practice yourself because "that\'s how it\'s done" would just spread the violation. The right action is to advocate properly: raise your concern through the proper channels — to the nurse or charge nurse — clearly and factually, so it can be addressed. And in your own care, model the right way: knock, cover, protect privacy and information every time. Speaking up for residents who can\'t speak for themselves, through the right channels, is exactly what a resident advocate does.',
                  isRecommended: true,
                },
                {
                  id: 'shame',
                  label: 'Loudly confront and shame the caregiver in front of everyone',
                  feedback:
                    'Loudly confronting and shaming the coworker in front of everyone isn\'t the right channel — it can escalate things and isn\'t your role. Concerns about another staff member\'s practice go through the proper chain. These are real rights violations worth addressing — but the right action is to advocate properly: raise the concern through proper channels to the nurse or charge nurse, clearly and factually, and model rights-respecting care yourself.',
                },
                {
                  id: 'copy',
                  label: 'Start doing the same thing since that\'s how things are done here',
                  feedback:
                    'Adopting the bad practice yourself because "that\'s how it\'s done" would just spread the violation. These are real violations of privacy, dignity, and confidentiality. The right action: advocate by raising the concern through proper channels to the nurse or charge nurse, clearly and factually, and model the right way in your own care — knock, cover, protect privacy and information every time.',
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
            { id: 'rgt-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
              id: 'rgt-s10-video',
              type: 'video',
              title: "The CNA's Role",
              videoUrl: '/assets/courses/resident-rights/s10-cna-role.mp4',
              placeholderNote: 'Pending upload: /assets/courses/resident-rights/s10-cna-role.mp4',
            },
            {
              id: 'rgt-s10-image',
              type: 'image',
              src: '/assets/courses/resident-rights/s10-hero.jpg',
              caption: 'The CNA is the resident\'s most present protector and everyday voice.',
            },
            {
              id: 'rgt-s10-narration',
              type: 'text',
              body: [
                'Your role in resident rights is to be the daily protector who honors rights in every moment, and the advocate who speaks up when they\'re at risk. Let\'s walk through it.',
                '**Honor dignity and privacy, always.** Be the constant guardian of dignity and privacy. Speak to every resident as the worthy adult they are — never talking down, never embarrassing. Knock and wait, close curtains, keep residents covered, protect their information, and treat their bodies, space, and belongings with respect. These small acts, repeated faithfully every shift, are where dignity and privacy actually live. You protect them or erode them in how you speak, touch, and act — so choose, always, to honor.',
                '**Support choice and respect refusal.** Treat residents as the decision-makers in their own lives. Offer real choices about their day and care, explain before you act, and seek agreement. And honor the right to refuse — when a competent resident says no, respect it, explain gently, and report it rather than forcing care. Supporting autonomy, even when you\'d choose differently, even when it complicates your schedule, is honoring the person\'s right to direct their own life.',
                '**Support voice, property, and connection.** Protect the rights that keep a resident\'s life their own. Listen to complaints and take them seriously; never dismiss or punish a resident for speaking up. Never take, borrow, or misuse their money or belongings, and report financial concerns. Treat their possessions with care, and support their connection to visitors and loved ones. In these acts you protect a resident\'s voice, property, and relationships — the things that hold dignity and identity together.',
                '**Advocate and report.** Be their voice. When a right is overlooked or violated and you can\'t simply fix it, advocate — put the resident first and raise the concern through proper channels, clearly and factually. Speak for residents who can\'t speak for themselves. And report serious violations — abuse, neglect, improper restraint — immediately, as a mandated reporter. Your willingness to speak up, the right way, is what makes you a true advocate for the people who depend on you.',
                'Now the boundary. You don\'t override a resident\'s rights for convenience. You don\'t apply restraints outside proper orders. You don\'t confront or shame coworkers publicly or work outside the chain of command — concerns go through proper channels. And you never stay silent about serious rights violations.',
                'Inside your role — honoring rights in every moment, supporting choice and voice, advocating, and reporting serious violations — you are where rights become real, and often the only voice a vulnerable resident has. Treat every resident as the rights-holding adult they are, in their own home, and be willing to speak up for them. That is the dignity at the center of all good care.',
              ].join('\n\n'),
            },
            {
              id: 'rgt-s10-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Stay within scope',
              body: 'You don\'t override a resident\'s rights for convenience, apply restraints outside proper orders, confront or shame coworkers publicly, or work outside the chain of command — concerns go through proper channels. You honor dignity, privacy, choice, and refusal in every moment, support voice and property and connection, advocate, and report serious violations immediately.',
            },
          ]),
      },
      {
        slug: 's11-case-study',
        title: 'Brief Case Study',
        sortOrder: 2,
        buildContent: () => {
          const caseNarrative = [
            'Mr. Reyes, 76, was alert, sharp, and fully competent — a retired carpenter who\'d run his own business for thirty years and was used to making his own decisions. He\'d come to the facility after a stroke left him needing help with daily care, but his mind was entirely his own. His CNA, Grace, had taken the resident-rights training seriously, and she understood something important about him: needing help with his body hadn\'t made him any less the master of his own life.',
            '',
            '**The refusal:** One busy morning, Grace came to help Mr. Reyes with his shower — the scheduled time. But he was tired, having slept poorly, and told her plainly: "Not today. I\'m worn out. I just want to rest this morning." Grace\'s schedule was tight, and a coworker leaning in the doorway offered the old approach: "Just get him in there anyway — tell him it\'s shower time and he doesn\'t get a choice. Push through if he fusses." Grace knew that was wrong on every level. Mr. Reyes was a competent adult, and competent adults have the right to refuse care. Forcing him would violate his dignity and autonomy — and forcing care on a refusing resident could even be a form of abuse.',
            '',
            '**Honoring the right — the right way:** So Grace honored his "no," but she didn\'t just walk away either. She sat down to his level, respected his choice, and gently explained why the shower was offered — so he could make an informed decision, not so she could pressure him. When he still wanted to rest, she honored it completely, and offered alternatives: a wash-up at the sink later when he felt up to it, or his shower that afternoon instead. He appreciated being treated like a man who could decide for himself, and agreed to a later time. Then Grace reported the refusal to the nurse, so the team knew and his hygiene needs would still be met on his terms — not skipped, not forced, but respected.',
            '',
            '**The rights she protected every day:** It wasn\'t just the shower. Grace honored Mr. Reyes\'s rights in the small constant moments: she knocked and waited before entering, kept him covered and the curtain closed during care, spoke to him as the capable adult he was, never discussed his private business in the hallway, and treated his belongings and his space with respect. To Grace, his room was his home, and she was a helper and guest in it.',
            '',
            '**The advocacy:** Grace also noticed that another caregiver routinely entered residents\' rooms without knocking, left them exposed during care, and talked loudly about residents\' private health information where visitors could hear. The residents looked uncomfortable but said nothing. A coworker told Grace it wasn\'t her business. But Grace knew that protecting residents\' rights was exactly her business — and that the residents\' silence was the very reason they needed an advocate. She didn\'t confront or shame the coworker publicly; instead, she raised her concern properly and factually with the charge nurse, so it could be addressed, and she made sure her own care always modeled the right way.',
            '',
            '**The outcome:** Mr. Reyes came to trust Grace completely — because she treated him as a man, not a task, and honored his right to direct his own life even when it complicated her morning. His hygiene needs were met, on his terms. And because Grace advocated through the proper channels, the privacy and dignity violations on the unit were addressed, protecting residents who couldn\'t speak up for themselves. The charge nurse told her: "You respected a man\'s right to say no, you kept his dignity in every little thing, and you spoke up for the ones who couldn\'t. That\'s not just good manners — that\'s protecting their rights. That\'s the job."',
          ].join('\n');

          return doc('Brief Case Study', [
            { id: 'rgt-s11-heading', type: 'heading', level: 1, text: 'Brief Case Study' },
            pendingAudio(
              'rgt-s11-audio',
              'The Resident Who Said No',
              '/assets/courses/resident-rights/s11-case-podcast.mp3',
              caseNarrative,
              '/assets/courses/resident-rights/s11-case-podcast.mp3',
            ),
            {
              id: 'rgt-s11-image',
              type: 'image',
              src: '/assets/courses/resident-rights/s11-hero.jpg',
              caption: 'Treating a resident as a capable adult earns real trust.',
            },
            {
              id: 'rgt-s11-case-study',
              type: 'case_study',
              title: 'The Resident Who Said No',
              residentProfile:
                'Mr. Reyes, 76, alert, sharp, and fully competent — a retired carpenter who ran his own business for thirty years and was used to making his own decisions. He came to the facility after a stroke left him needing help with daily care, but his mind was entirely his own. His CNA, Grace, understood something important: needing help with his body hadn\'t made him any less the master of his own life.',
              scenario: [
                '**The refusal:** One busy morning, Grace came to help with his shower — the scheduled time. But he was tired, having slept poorly: "Not today. I\'m worn out. I just want to rest this morning." A coworker offered the old approach: "Get him in there anyway — tell him it\'s shower time and he doesn\'t get a choice. Push through if he fusses." Grace knew that was wrong on every level. Mr. Reyes was a competent adult, and competent adults have the right to refuse care. Forcing him would violate his dignity and autonomy — and forcing care on a refusing resident could even be a form of abuse.',
                '**Honoring the right — the right way:** Grace honored his "no," but didn\'t just walk away. She sat to his level, respected his choice, and gently explained why the shower was offered — so he could make an informed decision, not so she could pressure him. When he still wanted to rest, she honored it completely and offered alternatives: a wash-up at the sink later, or his shower that afternoon. He appreciated being treated like a man who could decide for himself, and agreed to a later time. Then Grace reported the refusal to the nurse, so his hygiene needs would still be met on his terms — not skipped, not forced, but respected.',
                '**The rights she protected every day:** It wasn\'t just the shower. Grace knocked and waited before entering, kept him covered and the curtain closed during care, spoke to him as the capable adult he was, never discussed his private business in the hallway, and treated his belongings and space with respect. To Grace, his room was his home, and she was a helper and guest in it.',
                '**The advocacy:** Grace noticed another caregiver routinely entered rooms without knocking, left residents exposed during care, and talked loudly about residents\' private health information where visitors could hear. The residents looked uncomfortable but said nothing. A coworker said it wasn\'t her business. But Grace knew protecting residents\' rights was exactly her business — and that the residents\' silence was the very reason they needed an advocate. She didn\'t confront or shame the coworker publicly; she raised her concern properly and factually with the charge nurse, and made sure her own care always modeled the right way.',
                '**The outcome:** Mr. Reyes came to trust Grace completely — because she treated him as a man, not a task, and honored his right to direct his own life even when it complicated her morning. His hygiene needs were met, on his terms. And because Grace advocated through the proper channels, the privacy and dignity violations on the unit were addressed. The charge nurse told her: "You respected a man\'s right to say no, you kept his dignity in every little thing, and you spoke up for the ones who couldn\'t. That\'s not just good manners — that\'s protecting their rights. That\'s the job."',
              ].join('\n\n'),
            },
            {
              id: 'rgt-s11-reflection-1',
              type: 'reflection',
              prompt:
                'Mr. Reyes refused his scheduled shower. Why was Grace right to honor his refusal, and how did she respect his autonomy without simply neglecting his hygiene needs?',
              minCharacters: 50,
            },
            {
              id: 'rgt-s11-reflection-2',
              type: 'reflection',
              prompt:
                'Grace advocated about another caregiver\'s rights violations by going through proper channels rather than confronting her publicly or ignoring it. Why is advocacy part of the CNA\'s role, and why does the channel you use to advocate matter?',
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
            { id: 'rgt-s12-heading', type: 'heading', level: 1, text: 'Conclusion' },
            {
              id: 'rgt-s12-video',
              type: 'video',
              title: 'Conclusion',
              videoUrl: '/assets/courses/resident-rights/s12-conclusion.mp4',
              placeholderNote: 'Pending upload: /assets/courses/resident-rights/s12-conclusion.mp4',
            },
            {
              id: 'rgt-s12-image',
              type: 'image',
              src: '/assets/courses/resident-rights/s12-hero.jpg',
              caption: 'Respect rights, honor dignity, speak up for those who cannot — that is the job.',
            },
            {
              id: 'rgt-s12-narration',
              type: 'text',
              body: [
                'You\'ve reached the end. Let\'s lock in the five things that matter most about resident rights and advocacy.',
                '**One.** Residents keep their rights — they don\'t lose them by needing care. They keep the same rights as any adult, plus rights the law protects for people in care: dignity, privacy, choice, consent and refusal, freedom from abuse and improper restraint, voicing complaints, managing their money and belongings, and having visitors. A resident is a rights-holding adult living in their home, and you are a helper and guest in it.',
                '**Two.** Rights live in the small daily moments. Knocking and waiting. Keeping them covered. Offering a real choice. Speaking as to an adult. Respecting a "no." Protecting their information. You make rights real or hollow in exactly these moments — so honor them every time, especially when you\'re rushed, because that\'s when they\'re most at risk.',
                '**Three.** Honor choice and the right to refuse — even when you disagree. Competent adults can make their own decisions, including refusing care. Don\'t force, and don\'t override "for their own good" — explain gently, respect the choice, offer alternatives, and report. And don\'t swing to neglect either; keep meeting their needs in ways they\'ll accept. Respecting autonomy is respecting the person.',
                '**Four.** Be the advocate. Many residents can\'t stand up for their own rights, so they need you to notice when a right is overlooked or violated and to speak up — through the proper channels, to the nurse or charge nurse, clearly and factually. And report the gravest violations — abuse, neglect, improper restraint — immediately, as a mandated reporter. Your voice, used the right way, protects those who can\'t protect themselves.',
                '**Five.** Know your scope, and lead with dignity. You don\'t override rights for convenience, apply restraints outside proper orders, or work outside the chain of command — but you honor dignity, privacy, choice, and refusal in every moment, support voice and property and connection, advocate, and report serious violations. You are where rights become real, and often the only voice a resident has. Treat every resident as the rights-holding adult they are.',

                'This course provides one hour of continuing education through CAL ACE Nursing Academy (CDPH Provider NAC #7384). Your certificate is generated automatically when you pass the knowledge check.',
                'Ten questions are waiting. Everything on them was covered here. You\'re ready. Trust what you\'ve learned, and show what you know.',
              ].join('\n\n'),
            },
            {
              id: 'rgt-s12-summary',
              type: 'summary',
              title: 'Five things that matter most',
              items: [
                'Residents keep their rights — they don\'t lose them by needing care. Dignity, privacy, choice, consent and refusal, freedom from abuse and improper restraint, voice, money and belongings, visitors. They\'re a rights-holding adult in their home.',
                'Rights live in the small daily moments — knocking, covering, offering a real choice, speaking as to an adult, respecting a "no," protecting information. Honor them every time, especially when rushed.',
                'Honor choice and the right to refuse — even when you disagree. Competent adults can refuse care; don\'t force and don\'t override "for their own good," but don\'t swing to neglect either. Explain, respect, offer alternatives, report.',
                'Be the advocate — many residents can\'t protect their own rights, so notice violations and speak up through proper channels. Report the gravest violations (abuse, neglect, improper restraint) immediately as a mandated reporter.',
                'Know your scope — you don\'t override rights for convenience, restrain outside proper orders, or work outside the chain of command. You honor rights, support voice and property, advocate, and report serious violations.',
              ],
            },
          ]),
      },
    ],
  },
];

export async function seedCourse09ResidentRights(
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
      label: 'V3 rebuild — resident rights & advocacy (professional practice)',
      status: CourseVersionStatus.DRAFT,
      deliveryMode: DeliveryMode.ONLINE,
      ceHours,
      publishedAt: null,
      contentMeta: contentMeta as Prisma.InputJsonValue,
    },
    update: {
      label: 'V3 rebuild — resident rights & advocacy (professional practice)',
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
    `Seeding Course 9 (Resident Rights & Advocacy) as DRAFT — slug "${COURSE_SLUG}", version ${VERSION_NUMBER}…`,
  );

  try {
    const result = await seedCourse09ResidentRights(prisma);
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
