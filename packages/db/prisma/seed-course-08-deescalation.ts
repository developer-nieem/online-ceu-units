/**
 * Seed Course 8 — Agitation, Aggression & De-escalation (DRAFT).
 *
 * V3 rebuild of the former "Workplace Violence Prevention in Healthcare", reframed to
 * the clinical de-escalation skill set the catalog needs, aligned to the 12–50 scaffold.
 * Owns the de-escalation method that Course 7 (Dementia) defers here.
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-08-deescalation
 *
 * Idempotent upserts by slug. Self-cleans stray modules on the target DRAFT version.
 * Does not seed the final quiz (pending owner approval; see the -exam.ts file).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CONFIRMED against the live DB (read-only inspection inspect-deescalation-target.ts):
 *   COURSE_SLUG    = 'workplace-violence-prevention'  (FROZEN — course already live)
 *   VERSION_NUMBER = 2                (MAX existing version is v1 PUBLISHED with real
 *                                      content; this creates v2 as a new DRAFT revision,
 *                                      leaving v1 intact)
 * Per the production package: preserve the existing slug, change DISPLAY TITLE only,
 * and publish as a NEW VERSION (don't overwrite cert/enrollment refs). This is a rebuild
 * (not a conversion), so the slug stays frozen even though the title now reads
 * "de-escalation"; de-escalation is workplace-violence-adjacent.
 * DRAFT-only. Run order: this main seed first, then the -exam seed.
 *
 * SCOPE: CNAs recognize escalation, de-escalate with calm and skill, meet unmet needs,
 * keep residents AND themselves safe, get help when needed, and report. CNAs do NOT
 * diagnose, do NOT decide on or give medications for agitation, do NOT apply restraints
 * outside proper orders, and do NOT use force beyond what's needed to protect safety —
 * and never have to absorb danger alone. The de-escalation goal is calm and safety,
 * never winning or controlling. The CNA's own safety is explicitly protected.
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
const COURSE_SLUG = 'workplace-violence-prevention';

// Display title changes to the de-escalation framing; slug stays frozen above.
const COURSE_TITLE = 'Calming Escalating Behaviors in Resident Care';
const COURSE_SUMMARY =
  'De-escalation is one of the most valuable safety skills a CNA can carry. Recognize the early signs of escalating agitation, understand the unmet needs and triggers behind behavior ("behavior is communication"), use verbal and non-verbal de-escalation to bring calm, meet the need behind the behavior, and keep everyone — including yourself — safe, getting help when a situation becomes dangerous. The goal is calm and safety, never winning. CNAs do not diagnose, medicate, restrain outside orders, or use force beyond safety. Stay calm, stay safe, meet the need.';

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
    'Recognize the early signs of escalating agitation',
    'Understand the triggers and unmet needs behind agitation and aggression — behavior is communication',
    'Use verbal and non-verbal de-escalation to bring calm',
    'Meet the need behind the behavior to resolve distress',
    'Keep everyone (including yourself) safe, get help when needed, report — and stay within CNA scope',
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
  heroImage: '/assets/courses/de-escalation/hero-banner.png',
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
    title: 'Understanding Agitation & De-escalation',
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: 'Introduction',
        sortOrder: 0,
        buildContent: () =>
          doc('Introduction', [
            { id: 'esc-s01-heading', type: 'heading', level: 1, text: 'Introduction' },
            {
              id: 'esc-s01-video',
              type: 'video',
              title: 'Introduction',
              videoUrl: '/assets/courses/de-escalation/s01-intro.mp4',
              placeholderNote: 'Pending upload: /assets/courses/de-escalation/s01-intro.mp4',
            },
            {
              id: 'esc-s01-image',
              type: 'image',
              src: '/assets/courses/de-escalation/s01-hero.jpg',
              caption: 'A CAL ACE CNA bringing calm, steady presence to every interaction.',
            },
            {
              id: 'esc-s01-narration',
              type: 'text',
              body: [
                'Welcome to CAL ACE Nursing Academy.',
                'This course is about agitation, aggression, and de-escalation — the skill of calming a tense moment safely, for your resident\'s sake and your own. As a CNA, you will sometimes face residents who are agitated, upset, resistant, or even aggressive. How you respond in those moments can turn fear into calm, or turn a small spark into a crisis. De-escalation is one of the most valuable safety skills you\'ll ever learn.',
                'Let\'s define our terms simply. Agitation is a state of restlessness, distress, or being worked up — pacing, fidgeting, raised voice, tension. Aggression is behavior that may threaten or cause harm — yelling, threats, grabbing, hitting, throwing. And de-escalation is what you do to bring the intensity down — using your words, your body, and your calm to help an upset person settle and feel safe again. The whole goal of de-escalation is calm and safety — never winning, never controlling, never punishing.',
                'Here\'s the single most important truth in this course, and it changes everything about how you respond: behavior is communication. Agitation and aggression are almost never about being "bad" or "mean." They are usually the outward sign of fear, pain, confusion, frustration, or an unmet need that the person can\'t express any other way. A resident who lashes out is often a frightened, hurting, or overwhelmed person — not a villain. When you see the need behind the behavior, you stop fighting the person and start helping them — and that is the heart of de-escalation.',
                'Why does your role matter so much? Because you are right there, in the daily moments where agitation begins — during care, at meals, in the evening, when something frightens or frustrates a resident. You\'re often the first to see the early signs, and the first who can respond. A skilled, calm CNA can settle a rising situation before it ever becomes dangerous. And when you can\'t — when a situation is or becomes unsafe — knowing how to protect everyone and get help is just as important.',
                'And let\'s be clear about one thing from the start: your safety matters too. De-escalation is not about being a hero or absorbing harm. If a situation becomes dangerous, getting yourself to safety and getting help is not failure — it\'s exactly the right thing to do. This course will teach you to calm what you can, and to protect everyone, including yourself, when you can\'t.',
                'This course teaches you to recognize the early signs of escalation, understand the triggers and unmet needs behind agitation, use real verbal and non-verbal de-escalation techniques, keep everyone safe, know when and how to get help, and report. A guiding phrase you\'ll hear throughout: stay calm, stay safe, meet the need.',
                'The guiding spirit of this course: behavior is communication — respond to the need with calm, and keep everyone safe.',
                'Your scope is clear. A CNA recognizes escalation, de-escalates with calm and skill, meets unmet needs, keeps residents and themselves safe, gets help when needed, and reports. A CNA does not diagnose, does not apply restraints outside proper orders, does not use force beyond what\'s needed to protect safety, and never has to absorb danger alone.',
                'By the end of this course, you will be able to: recognize the signs of escalating agitation. Understand the triggers and needs behind it. Use verbal and non-verbal de-escalation. Keep everyone safe and get help when needed. And report. Let\'s begin.',
              ].join('\n\n'),
            },
            {
              id: 'esc-s01-callout',
              type: 'callout',
              variant: 'warning',
              title: 'Stay calm, stay safe, meet the need',
              body: 'Behavior is communication — agitation and aggression are usually fear, pain, confusion, or an unmet need, not malice. The goal of de-escalation is calm and safety, never winning or controlling. And your safety matters too: if a situation becomes dangerous, getting yourself to safety and getting help is not failure — it\'s the right call. You don\'t diagnose, medicate, restrain outside orders, or use force beyond safety.',
            },
          ]),
      },
      {
        slug: 's02-terms',
        title: 'Terms & Definitions',
        sortOrder: 1,
        buildContent: () =>
          doc('Terms & Definitions', [
            { id: 'esc-s02-heading', type: 'heading', level: 1, text: 'Terms & Definitions' },
            {
              id: 'esc-s02-image',
              type: 'image',
              src: '/assets/courses/de-escalation/s02-hero.jpg',
              caption: 'Behavior is communication — listen for what the resident cannot say.',
            },
            {
              id: 'esc-s02-reveal-agitation',
              type: 'reveal_card',
              frontTitle: 'Agitation',
              frontBody: 'Agitation',
              backTitle: 'Agitation',
              backBody:
                'A state of restlessness, distress, or being worked up. You might see pacing, fidgeting, wringing hands, a raised or tense voice, or a resident who can\'t settle. Agitation is often the early stage of escalation — and the best time to step in, because a calm response now can prevent things from building further.',
            },
            {
              id: 'esc-s02-reveal-aggression',
              type: 'reveal_card',
              frontTitle: 'Aggression',
              frontBody: 'Aggression',
              backTitle: 'Aggression',
              backBody:
                'Behavior that threatens or causes harm — to people or property. It can be verbal, like yelling, cursing, or threats, or physical, like grabbing, hitting, pushing, or throwing. Aggression is usually the peak of escalation, and it almost always grows out of fear, pain, or an unmet need that wasn\'t met earlier.',
            },
            {
              id: 'esc-s02-reveal-escalation',
              type: 'reveal_card',
              frontTitle: 'Escalation',
              frontBody: 'Escalation',
              backTitle: 'Escalation',
              backBody:
                'The build-up of agitation toward aggression — the way distress grows step by step if the underlying need isn\'t met. Escalation usually moves through stages, from early signs to crisis. Recognizing it early, in its first stages, is the key to de-escalation, because calm is far easier to restore early than late.',
            },
            {
              id: 'esc-s02-reveal-deescalation',
              type: 'reveal_card',
              frontTitle: 'De-escalation',
              frontBody: 'De-escalation',
              backTitle: 'De-escalation',
              backBody:
                'Everything you do to bring intensity down and help an upset person feel calm and safe again — your calm voice, your open body language, your patience, and meeting the need behind the behavior. The goal of de-escalation is always calm and safety, never winning an argument or controlling the person.',
            },
            {
              id: 'esc-s02-reveal-trigger',
              type: 'reveal_card',
              frontTitle: 'Trigger',
              frontBody: 'Trigger',
              backTitle: 'Trigger',
              backBody:
                'Something that sets off or worsens agitation — pain, fear, being rushed, noise, being told no, an unfamiliar face, a frightening task, or an unmet need like hunger or toileting. Knowing a resident\'s triggers helps you prevent agitation before it starts, and understand it when it happens. Triggers are clues to the need underneath.',
            },
            {
              id: 'esc-s02-reveal-behavior-comm',
              type: 'reveal_card',
              frontTitle: 'Behavior as Communication',
              frontBody: 'Behavior as communication',
              backTitle: 'Behavior as Communication',
              backBody:
                'The core idea of this course: agitation and aggression are messages, not misbehavior. They usually express an unmet need or distress the person can\'t put into words — pain, fear, confusion, frustration. When you read behavior as communication and ask "what does this person need?", you respond far better than if you simply react to the behavior.',
            },
            {
              id: 'esc-s02-reveal-personal-space',
              type: 'reveal_card',
              frontTitle: 'Personal Space',
              frontBody: 'Personal space',
              backTitle: 'Personal Space',
              backBody:
                'The area around a person that, when crowded, can feel threatening — especially to someone already agitated or frightened. Giving an upset resident space, not cornering them, and approaching slowly and from the front are key de-escalation habits. Respecting personal space helps a person feel safe instead of trapped.',
            },
            {
              id: 'esc-s02-reveal-safety-first',
              type: 'reveal_card',
              frontTitle: 'Safety First',
              frontBody: 'Safety first',
              backTitle: 'Safety First',
              backBody:
                'The rule that everyone\'s safety — the resident\'s, others\', and your own — comes before completing a task or "winning." If a situation is or becomes dangerous, you protect people, get to safety, and get help. Your own safety counts: de-escalation is never about absorbing harm, and getting help is always the right call.',
            },
            {
              id: 'esc-s02-knowledge-check',
              type: 'knowledge_check',
              question: 'When a resident becomes agitated or aggressive, it usually means:',
              options: [
                { id: 'comm', label: 'Their behavior is communicating an unmet need, fear, or pain' },
                { id: 'mean', label: 'They are bad or mean and should be punished' },
                { id: 'nothing', label: 'Nothing important' },
              ],
              correctOptionId: 'comm',
              explanation:
                'Behavior is communication — the core idea of de-escalation. Agitation and aggression are almost never malice; they\'re the outward sign of fear, pain, confusion, frustration, or an unmet need the person can\'t put into words. Asking "what does this person need?" is the heart of de-escalation.',
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
            { id: 'esc-s03-heading', type: 'heading', level: 1, text: 'Statistics' },
            {
              id: 'esc-s03-image',
              type: 'image',
              src: '/assets/courses/de-escalation/s03-hero.jpg',
              caption: 'Agitation is common and predictable — met with skill, not alarm.',
            },
            pendingAudio(
              'esc-s03-audio',
              'Behavior Is a Message: Why De-escalation Is a Core CNA Skill',
              '/assets/courses/de-escalation/s03-stats-podcast.mp3',
              [
                'Behavior Is a Message: Why De-escalation Is a Core CNA Skill',
                '',
                'Agitation and aggression are far more common in care settings than many people expect, and understanding why takes the fear and the blame out of them. A large share of residents in long-term care have dementia or other conditions that affect the brain, mood, and impulse control, and these — combined with pain, fear, confusion, frustration, and unmet needs — make distress and agitation a regular part of caregiving. Caregivers, and CNAs especially, are among the most likely of all workers to encounter agitated or aggressive behavior, simply because they are closest to residents during the most vulnerable, frustrating, and frightening moments of the day. This isn\'t a sign that something is wrong with the resident or the caregiver; it\'s a predictable feature of caring for people who are ill, confused, hurting, or afraid.',
                '',
                'The single most important idea — supported across dementia care, mental health, and de-escalation training — is that behavior is communication. Agitation and aggression are almost never about a resident being "bad" or "mean." They are the outward expression of something the person needs or fears but cannot say: pain they can\'t describe, a need to use the bathroom, hunger, fear of an unfamiliar face or a frightening task, overstimulation, confusion about where they are, or frustration at lost independence. When caregivers learn to look past the behavior to the need beneath it, two things happen: their fear and frustration drop, and their ability to actually calm the situation rises. The resident isn\'t an opponent to be controlled; they\'re a person to be understood and helped.',
                '',
                'This matters enormously because skilled de-escalation works, and the lack of it makes things worse. Research and clinical experience consistently show that calm, person-centered de-escalation — meeting the need, using a soothing voice and open body language, giving space and time — prevents agitation from escalating into aggression, reduces injuries to residents and staff, and reduces the use of restraints and emergency medications, which carry real harms. By contrast, the instinctive but wrong responses — arguing, forcing, cornering, raising your own voice, taking it personally — reliably escalate a situation and increase the risk of harm to everyone. De-escalation is a learnable skill, not a personality trait, and it is one of the highest-value safety skills a CNA can carry.',
                '',
                'And there is an essential, often-neglected truth in this work: the caregiver\'s own safety matters too. De-escalation is never about being a hero or absorbing harm. The same training that teaches caregivers to calm what they can also teaches them to recognize when a situation is unsafe, to protect themselves and others, to get away, and to get help — and to understand that doing so is not failure but exactly the right judgment. The bottom line: agitation and aggression are common and predictable in care, they are communication of unmet needs rather than malice, skilled de-escalation genuinely prevents crises and injuries while wrong responses worsen them, and the CNA\'s safety is always part of the picture.',
              ].join('\n'),
              '/assets/courses/de-escalation/s03-stats-podcast.mp3',
            ),
            {
              id: 'esc-s03-source-note',
              type: 'callout',
              variant: 'clinical',
              title: 'About these figures',
              body: 'This section describes agitation and de-escalation qualitatively (e.g., "a large share of residents," "among the most likely of all workers to encounter aggression") rather than citing specific numbers. Any precise statistic added later must come from a named, verifiable source (e.g., dementia care & de-escalation training research) — not from estimation.',
            },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: 'Fundamentals',
        sortOrder: 3,
        buildContent: () =>
          doc('Fundamentals', [
            { id: 'esc-s04-heading', type: 'heading', level: 1, text: 'Fundamentals' },
            {
              id: 'esc-s04-video',
              type: 'video',
              title: 'Fundamentals',
              videoUrl: '/assets/courses/de-escalation/s04-fundamentals.mp4',
              placeholderNote: 'Pending upload: /assets/courses/de-escalation/s04-fundamentals.mp4',
            },
            {
              id: 'esc-s04-image',
              type: 'image',
              src: '/assets/courses/de-escalation/s04-hero.jpg',
              caption: 'The fundamentals: space, eye level, a calm and gentle voice.',
            },
            {
              id: 'esc-s04-narration',
              type: 'text',
              body: [
                '**Behavior is communication**',
                'Start with the idea that everything else rests on: behavior is communication. When a resident becomes agitated or aggressive, they are not being bad — they are telling you something they can\'t say in words. Maybe they\'re in pain, frightened, confused, hungry, needing the toilet, overwhelmed, or frustrated at being rushed or losing control. The behavior is the message. So instead of asking "why is this resident being difficult?", ask "what is this person trying to tell me? what do they need?" That single shift turns a battle into an act of caregiving — and it\'s the foundation of every de-escalation skill that follows.',
                '**Escalation happens in stages**',
                'Agitation rarely jumps straight to aggression — it usually climbs in stages, and each stage is a chance to step in. First, calm — the resident\'s baseline. Then early signs — restlessness, tension, a change in mood or voice. Then escalation — more obvious agitation, louder, more upset, harder to redirect. Then crisis — aggression, where safety is at risk. And finally, recovery — settling back down, needing calm and reassurance. The key lesson: the earlier you catch it, the easier it is to de-escalate. Calm is simple to restore in the early stages and very hard to restore at crisis — so watch for the early signs and act then.',
                '**Your calm is contagious — so is your tension**',
                'Here\'s a powerful truth: emotions are contagious, and the resident will catch yours. If you become tense, loud, fast, or frustrated, you feed their agitation and it climbs. If you stay genuinely calm — steady voice, slow movements, relaxed face — you offer them calm to catch, and it helps them settle. This means your own self-regulation is your first de-escalation tool. Take a breath, lower your voice, slow down. You cannot calm someone else while you\'re escalating yourself. Your calm is the anchor the whole situation steadies around.',
                '**Verbal de-escalation: how you speak**',
                'Your words and voice are powerful tools. Speak slowly, softly, and calmly — a lowered voice invites a lowered voice. Use short, simple sentences. Use the resident\'s name warmly. Listen, and show you\'re listening. Acknowledge their feelings — "I can see you\'re upset, and that\'s okay" — rather than arguing or correcting. Don\'t argue, command, threaten, or say "calm down," which almost always backfires. Offer reassurance and simple choices to restore a sense of control. The message under your words should always be: you\'re safe, I\'m here, I want to help. How you speak can lower the temperature all by itself.',
                '**Non-verbal de-escalation: your body**',
                'Your body speaks louder than your words, so make it say "safe." Keep a calm, open posture — no crossed arms, no pointing, no looming. Give the resident space; don\'t crowd or corner them, and never block their only exit. Approach slowly, from the front, so you don\'t startle them. Stay at or below their eye level when you can — not towering over them. Keep your face relaxed and kind. Avoid sudden movements. Respect personal space, because crowding makes a frightened person feel trapped and more threatened. Calm hands, calm face, calm distance — your whole body should lower the threat, not raise it.',
                '**Meet the need behind the behavior**',
                'De-escalation isn\'t just calming techniques — it\'s solving the real problem. While you stay calm and speak gently, look for what the person actually needs, and meet it. Are they in pain? Needing the toilet? Hungry, thirsty, too hot or cold? Frightened by a task, a noise, or a stranger? Overwhelmed or rushed? Feeling a loss of control? Often, simply meeting that need — easing the pain, offering the bathroom, removing the trigger, slowing down, giving a choice — dissolves the agitation, because the message has finally been heard and answered. Calm techniques buy time; meeting the need is the cure.',
                '**Safety first — for everyone, including you**',
                'Above every technique sits one rule: safety first, for the resident, for others, and for you. De-escalation is the goal, but it is never about absorbing harm or "winning." If a resident is becoming dangerous, give more space, remove others from the area, and don\'t try to physically handle it alone. Get help — call for the nurse and coworkers per your facility\'s plan. And protect yourself: keep an exit behind you, don\'t get cornered, and if you must, step away to safety. Getting yourself out of danger and getting help is not failure — it\'s the right judgment. Calm what you safely can; protect everyone when you can\'t.',
              ].join('\n\n'),
            },
            {
              id: 'esc-s04-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'The escalation stages',
              body: 'Calm (baseline) → early signs (restlessness, tension, voice change) → escalation (louder, more upset, harder to redirect) → crisis (aggression, safety at risk) → recovery (settling, needing reassurance). The earlier you catch it, the easier de-escalation is — calm is simple to restore early and very hard at crisis. Your own calm is contagious, and so is your tension.',
            },
          ]),
      },
    ],
  },
  {
    slug: 'module-2',
    title: 'Recognizing Escalation & Its Causes',
    sortOrder: 1,
    lessons: [
      {
        slug: 's05-signs',
        title: 'Signs & Symptoms',
        sortOrder: 0,
        buildContent: () =>
          doc('Signs & Symptoms', [
            { id: 'esc-s05-heading', type: 'heading', level: 1, text: 'Signs & Symptoms' },
            {
              id: 'esc-s05-image',
              type: 'image',
              src: '/assets/courses/de-escalation/s05-hero.jpg',
              caption: 'Recognizing early signs of agitation before they escalate.',
            },
            {
              id: 'esc-s05-narration',
              type: 'text',
              body: [
                'Recognizing escalation early — and reading the signs at each stage — is what lets you de-escalate before a situation becomes dangerous. You are often the first to see it coming. Let\'s learn the signs.',
                '**The early warning signs**',
                'Catch agitation in its earliest, most workable stage. Watch for: restlessness — pacing, fidgeting, wringing hands, can\'t settle. A change in facial expression — tension, frowning, a hard or worried look. A change in voice — louder, faster, sharper, or sudden silence. Increased movement or muscle tension. Refusing care or pulling away. Repeating words or demands. Looking frightened, trapped, or overwhelmed. These early signs are gold, because this is when de-escalation is easiest. The moment you notice a resident starting to wind up, that\'s your cue to step in calmly — not to wait until it\'s worse.',
                '**The escalating signs**',
                'If early signs aren\'t met, agitation climbs, and the signs grow clearer. Louder, faster, angrier speech — yelling, cursing, threats. More intense body language — clenched fists, pointing, invading space, standing tall and tense. Refusing to listen or be redirected. Demanding, arguing, or fixating. Visible fear or fury. Throwing or knocking small things. Pacing that\'s faster and more charged. At this stage, your calm matters more than ever — lower your voice, give space, meet the need — because the situation is approaching the point where safety becomes the priority. Stay calm, don\'t match their intensity, and start thinking about getting help.',
                '**The crisis signs, and safety**',
                'Know the signs that a situation has become a safety crisis, because these mean protect everyone now. Physical aggression — hitting, grabbing, pushing, kicking, throwing objects, or trying to. Threats of harm with the means and intent to follow through. A resident who is out of control and cannot be reached with words. Anyone in immediate danger. At this point, de-escalation by talking may no longer be enough, and safety comes first: give space, get other residents and people away, do not try to physically manage it alone, and get help immediately — the nurse, coworkers, your facility\'s emergency response. Protect yourself, keep an exit, and don\'t get cornered. Words first, but safety always.',
                '**What to report**',
                'Report behavioral events so the team can understand and prevent them. Report: the incident itself — what happened, factually. The triggers you noticed — what seemed to set it off or build it up. The early signs, so patterns can be caught earlier next time. What helped, and what didn\'t — your de-escalation gives the team valuable information. Any injuries, to anyone. And changes in a resident\'s behavior over time — new or worsening agitation, which can signal pain, illness, or another problem needing attention. Report factually, without blame or judgment. Your reporting helps the team meet the resident\'s needs, adjust the care plan, and keep everyone safer.',
                'The rule underneath it all: catch escalation at the early signs when de-escalation is easiest, stay calm as it climbs, put safety first and get help at crisis, and report factually so the team can prevent the next one.',
              ].join('\n\n'),
            },
            {
              id: 'esc-s05-callout',
              type: 'callout',
              variant: 'warning',
              title: 'Crisis signs mean protect everyone NOW',
              body: 'Physical aggression (hitting, grabbing, pushing, kicking, throwing); threats with means and intent; a resident out of control who can\'t be reached with words; anyone in immediate danger. At this point talking may not be enough — safety first: give space, get others away, do NOT try to physically manage it alone, keep an exit, don\'t get cornered, and get help immediately per your facility\'s plan.',
            },
          ]),
      },
      {
        slug: 's06-causes',
        title: 'Causes',
        sortOrder: 1,
        buildContent: () =>
          doc('Causes', [
            { id: 'esc-s06-heading', type: 'heading', level: 1, text: 'Causes' },
            {
              id: 'esc-s06-image',
              type: 'image',
              src: '/assets/courses/de-escalation/s06-hero.jpg',
              caption: 'Find the unmet need behind the behavior — pain, fear, a full bladder.',
            },
            pendingAudio(
              'esc-s06-audio',
              'What\'s Really Behind Agitation — and Why the Cause Is the Cure',
              '/assets/courses/de-escalation/s06-causes-podcast.mp3',
              [
                'What\'s Really Behind Agitation — and Why the Cause Is the Cure',
                '',
                'The most useful thing a caregiver can understand about agitation and aggression is that they almost always have a cause and a meaning — they are communication, not malice. Find the cause, and you\'ve usually found the cure.',
                '',
                'The biggest causes are unmet physical needs and discomfort, often in someone who can\'t express them clearly. Pain is an enormous and frequently missed driver — a resident in pain who can\'t say so may become agitated or strike out, and the agitation vanishes when the pain is treated. The need to use the bathroom, hunger, thirst, being too hot or cold, exhaustion, or feeling ill can all drive agitation. So can the discomfort of the care itself — being rushed, handled roughly, frightened by a task, or feeling undignified. These causes are deeply practical, and they\'re often the easiest to fix: meet the physical need, and the behavior settles.',
                '',
                'Then there are emotional and cognitive causes. Fear is a huge one — fear of an unfamiliar face, a frightening task, a confusing situation, or simply not understanding what\'s happening. Confusion from dementia or delirium leaves residents disoriented and easily frightened, and dementia also reduces the brain\'s ability to control impulses and tolerate frustration, which is why agitation is so common in dementia care. Frustration at lost independence and control — being told what to do, having things done to them, not being able to do what they once could — builds resentment and resistance. And feeling unheard, dismissed, or not in control can push a person from upset to aggressive.',
                '',
                'Environmental and situational triggers matter too. Overstimulation — too much noise, activity, chaos, or too many people — overwhelms residents, especially those with dementia. Understimulation — boredom and loneliness — can also drive restlessness. Changes in routine, unfamiliar settings, and the late-afternoon agitation of sundowning all contribute. And crucially, the caregiver\'s own approach can be a trigger or a calmer: rushing, arguing, forcing, looming, raising your voice, or taking it personally reliably escalates, while calm, patience, space, and meeting needs de-escalate. Sometimes the most fixable cause of agitation is how the care is being delivered.',
                '',
                'This is why understanding the cause is the foundation of both de-escalation and prevention. If a resident becomes agitated during care, the skilled caregiver asks not "why are they being aggressive?" but "what\'s driving this — pain? fear? being rushed? a full bladder? too much noise?" — and meets that need. The same insight prevents agitation before it starts: anticipate needs, ease pain, reduce triggers, slow down, and approach calmly. The takeaway: agitation and aggression are caused by unmet needs, pain, fear, confusion, lost control, overstimulation, and sometimes rushed or forceful care — not by malice — so reading the cause behind the behavior is exactly how a CNA both de-escalates the moment and prevents the next one.',
              ].join('\n'),
              '/assets/courses/de-escalation/s06-causes-podcast.mp3',
            ),
          ]),
      },
      {
        slug: 's07-medications',
        title: 'The De-escalation Toolkit',
        sortOrder: 2,
        buildContent: () =>
          doc('The De-escalation Toolkit', [
            { id: 'esc-s07-heading', type: 'heading', level: 1, text: 'The De-escalation Toolkit' },
            {
              id: 'esc-s07-image',
              type: 'image',
              src: '/assets/courses/de-escalation/s07-hero.jpg',
              caption: 'Reducing triggers prevents agitation before it starts.',
            },
            {
              id: 'esc-s07-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of practice',
              body: 'Medications for agitation and any restraint orders belong to the team — the CNA never decides or applies these. A CNA does not diagnose, does not decide on or give medications for agitation, and does not apply restraints outside proper orders — and never uses force beyond what\'s needed to protect safety. Your tools are calm, words, body language, meeting needs, and getting help.',
            },
            {
              id: 'esc-s07-narration',
              type: 'text',
              body: [
                'There\'s no pill a CNA gives for agitation — your "treatment" is the skill of de-escalation and meeting the need, and it\'s powerful. Let\'s walk through the toolkit, and the safety rules that frame it. First, the scope: a CNA does not diagnose, does not decide on or give medications for agitation, and does not apply restraints outside proper orders — and never uses force beyond what\'s needed to protect safety. Your tools are calm, words, body language, meeting needs, and getting help.',
                '**Regulate yourself first.** You cannot calm anyone while you\'re escalating, and your emotions are contagious. So the first move is your own: take a breath, lower your voice, slow your movements, relax your face, and let go of taking it personally. Your steady calm becomes the anchor the resident can steady around. This sounds simple, but it\'s the foundation — a regulated caregiver is the single most powerful de-escalation tool in the room.',
                '**Use your verbal toolkit.** Speak slowly, softly, and warmly — a lowered voice invites a lowered voice. Use the resident\'s name. Listen, and show you\'re listening. Acknowledge their feelings instead of arguing — "I can see you\'re upset, that\'s okay, I\'m here to help." Use short, simple words. Offer reassurance and simple choices to restore a sense of control. And avoid the things that backfire: don\'t argue, command, threaten, rush, or say "calm down." Your calm words tell the resident the one thing they most need to hear: you\'re safe, and I want to help.',
                '**Use your non-verbal toolkit.** Let your body say "safe." Open, relaxed posture — no crossed arms, pointing, or looming. Give space; don\'t crowd or corner. Approach slowly, from the front. Stay at or below eye level. Keep your face calm and kind, your movements slow. Respect personal space, because a crowded, frightened person feels trapped. Your body language can lower the threat all on its own — or, done wrong, raise it. Make every part of your posture and presence gentle.',
                '**Meet the need behind the behavior.** While you stay calm, solve the real problem. Look for what\'s driving the agitation — pain, toileting, hunger, fear, a frightening task, noise, being rushed, lost control — and meet it. Ease the pain, offer the bathroom, remove the trigger, slow down, give a choice, bring comfort. Often the agitation simply dissolves once the need is finally heard and met. Redirect gently to something calming when you can. The techniques buy you calm; meeting the need is what truly resolves it.',
                '**Safety first — and get help.** Frame everything in safety, for the resident, others, and you. If the situation is or becomes dangerous: give more space, move other people away, and do not try to physically manage it alone. Get help immediately — the nurse, coworkers, your facility\'s emergency response — per your plan. Protect yourself: keep an exit behind you, don\'t get cornered, and step to safety if you must. Never apply restraints outside proper orders, and never use force beyond protecting safety. And afterward, support the resident\'s recovery with calm and reassurance, and report. Getting help and getting to safety is not failure — it\'s the right call.',
                'The scope point: you don\'t diagnose, medicate, or restrain — but you regulate yourself, use verbal and non-verbal de-escalation, meet the need behind the behavior, keep everyone safe, get help when needed, and report. That skill is the care you deliver.',
              ].join('\n\n'),
            },
            {
              id: 'esc-s07-callout',
              type: 'callout',
              variant: 'warning',
              title: 'Never say "calm down"',
              body: 'Don\'t argue, command, threaten, rush, or say "calm down" — it almost always backfires. Don\'t corner — give space and keep your own exit. Meet the need behind the behavior. If it\'s dangerous: more space, move others away, GET HELP. Never restrain outside proper orders or use force beyond safety. Getting to safety is not failure.',
            },
          ]),
      },
      {
        slug: 's08-prevention',
        title: 'Prevention',
        sortOrder: 3,
        buildContent: () =>
          doc('Prevention', [
            { id: 'esc-s08-heading', type: 'heading', level: 1, text: 'Prevention' },
            {
              id: 'esc-s08-image',
              type: 'image',
              src: '/assets/courses/de-escalation/s08-hero.jpg',
              caption: 'De-escalation is a skill: calm voice, open posture, give space.',
            },
            {
              id: 'esc-s08-narration',
              type: 'text',
              body: [
                'The best de-escalation is the agitation that never happens. Much of it can be prevented, and prevention is daily work. Here are seven ways.',
                '**One. Know your residents and their triggers.** The strongest prevention is knowing each resident — what calms them, what upsets them, what their personal triggers are, and how they show early distress. When you know that loud noise frightens one resident, or that another hates being rushed, you can avoid the spark before it lights. Person-centered knowledge lets you prevent agitation you\'d otherwise have to de-escalate.',
                '**Two. Meet needs before they become distress.** Since agitation comes from unmet needs, prevent it by meeting needs proactively — offer the toilet on a schedule, ensure residents are fed, hydrated, comfortable, warm enough, and not in pain. Anticipate hunger, toileting, and pain rather than waiting for distress to announce them. A resident whose needs are met before they become urgent has far less to become agitated about.',
                '**Three. Approach calmly and unhurried — every time.** Your approach can prevent or provoke. Move slowly, speak gently, explain before you act, approach from the front, and never rush or loom. So much agitation is sparked by care that feels sudden, forceful, or frightening. A calm, respectful, predictable approach prevents the fear and frustration that fuel so many incidents. You set the tone before anything starts.',
                '**Four. Reduce triggers in the environment.** Prevent agitation by softening the surroundings — reduce noise, chaos, crowding, and overstimulation, especially for residents with dementia. Provide calm, comfort, and familiar things. Watch for and ease boredom and loneliness too. A calm environment prevents the overwhelm that tips many residents into distress, before any de-escalation is ever needed.',
                '**Five. Offer choice and protect dignity.** Much agitation grows from lost control and feeling done-to. Prevent it by offering real choices, going at the resident\'s pace, letting them do what they can, and always protecting their dignity. A resident who feels respected, heard, and in some control of their own care has far less reason to resist or lash out. Dignity and choice are quietly powerful prevention.',
                '**Six. Watch for and act on early signs.** Prevent escalation by catching agitation at its very first signs — the restlessness, the tension, the change in voice — and stepping in calmly right then. The earliest stage is the easiest to settle. Don\'t wait and hope it passes; a gentle response to early agitation prevents the climb to crisis. Early attention is prevention.',
                '**Seven. Anticipate hard times and report patterns.** Plan ahead for predictable rough patches — sundowning, certain tasks, certain times of day — with extra calm and preparation. And report patterns you notice, so the team can adjust the care plan to prevent recurring agitation. And remember: new or worsening agitation can mean pain or illness, so reporting it can prevent both the behavior and the underlying problem. Anticipation and good reporting prevent the incidents that would otherwise repeat.',
              ].join('\n\n'),
            },
          ]),
      },
    ],
  },
  {
    slug: 'module-3',
    title: 'Responding Safely, Your Role, and Application',
    sortOrder: 2,
    lessons: [
      {
        slug: 's09-emergency',
        title: 'De-escalating & Putting Safety First',
        sortOrder: 0,
        buildContent: () =>
          doc('De-escalating & Putting Safety First', [
            {
              id: 'esc-s09-heading',
              type: 'heading',
              level: 1,
              text: 'De-escalating & Putting Safety First',
            },
            pendingAudio(
              'esc-s09-intro-audio',
              'De-escalating early and putting safety first — intro',
              '/assets/courses/de-escalation/s09-emergency-intro.mp3',
              'With agitation, the judgments that matter most are responding to early agitation the right way instead of the instinctive wrong way, and knowing when safety must come first and you get help. You\'re about to work through two situations. Read each carefully, choose your action, and you\'ll get feedback right away. Keep the core ideas in mind: stay calm, give space, and meet the need — never argue or force — and when a situation becomes dangerous, safety comes first, you get help, and getting to safety is never failure.',
              '/assets/courses/de-escalation/s09-emergency-intro.mp3',
            ),
            {
              id: 'esc-s09-image',
              type: 'image',
              src: '/assets/courses/de-escalation/s09-hero.jpg',
              caption: 'Stay calm, give space, and meet the need — never argue or force.',
            },
            {
              id: 'esc-s09-scenario-deescalate-image',
              type: 'image',
              src: '/assets/courses/de-escalation/s09-scenario-deescalate.jpg',
              caption: 'Early agitation, handled right: eye level, calm voice, connection over control.',
            },
            {
              id: 'esc-s09-scenario-deescalate',
              type: 'scenario_question',
              prompt:
                'Mr. Castellano is becoming agitated during his morning care — he\'s tense, his voice is rising, he\'s pulling away from you and saying "Leave me alone, stop it!" He seems frightened and overwhelmed. A coworker says, "Just hold him still and get the care done fast, and tell him firmly to calm down and stop fighting you." What SHOULD the CNA do?',
              options: [
                {
                  id: 'force',
                  label: 'Hold him still and force the care done quickly',
                  feedback:
                    'Holding him still and forcing care would frighten him more, likely escalate him to real aggression, could hurt him, and can even be improper restraint or abuse. His agitation is communication — he\'s frightened and overwhelmed. The right response: stop, step back to give space, lower your voice, acknowledge his feelings, find what\'s frightening or upsetting him, meet that need, and continue gently on his terms. Stay calm, give space, meet the need.',
                },
                {
                  id: 'calm-down',
                  label: 'Firmly tell him to calm down and stop fighting',
                  feedback:
                    'Telling a frightened resident to "calm down" almost always backfires, and "stop fighting" frames him as an opponent rather than a person who\'s scared. His agitation is communication — he\'s frightened and overwhelmed. The right response: stop, step back to give space, lower your voice, acknowledge his feelings, find what\'s upsetting him, meet that need, and continue gently on his terms.',
                },
                {
                  id: 'deescalate',
                  label: 'Stop, step back to give space, lower your voice, acknowledge his feelings, find what\'s frightening or upsetting him, and meet that need before continuing gently',
                  feedback:
                    'Exactly right — this is de-escalation done well. Mr. Castellano is showing early-to-rising agitation, and crucially, his behavior is communication: he\'s frightened and overwhelmed, and "leave me alone, stop it" is him telling you the care feels threatening right now. The coworker\'s advice would make everything worse — holding him still and forcing care would frighten him more, likely escalate him to real aggression, could hurt him, and can even be improper restraint or abuse; and telling him to "calm down" almost always backfires. Ignoring his distress and pushing on does the same. The right response is to de-escalate: stop, step back and give him space so he doesn\'t feel trapped, lower your voice and soften your body, acknowledge his feelings ("I can see this is upsetting you, that\'s okay, I\'m here to help"), and look for what\'s driving it — is he frightened by the task, in pain, cold, rushed, not understanding what\'s happening? Meet that need — slow down, explain gently, offer a choice, remove what\'s frightening him — and then continue the care calmly, in steps, on his terms, or come back in a few minutes. Stay calm, give space, meet the need: that\'s how you turn this around without anyone getting hurt.',
                  isRecommended: true,
                },
                {
                  id: 'ignore',
                  label: 'Keep going exactly as you were and ignore his distress',
                  feedback:
                    'Ignoring his distress and pushing on will escalate him, could hurt him, and ignores the message his behavior is sending — he\'s frightened and overwhelmed. The right response: stop, step back to give space, lower your voice, acknowledge his feelings, find what\'s frightening or upsetting him, meet that need, and continue gently on his terms. Stay calm, give space, meet the need.',
                },
              ],
              requiredForCompletion: true,
            },
            {
              id: 'esc-s09-scenario-safety-image',
              type: 'image',
              src: '/assets/courses/de-escalation/s09-scenario-safety.jpg',
              caption: 'When it turns dangerous: give space, get help, get to safety — never play hero.',
            },
            {
              id: 'esc-s09-scenario-safety',
              type: 'scenario_question',
              prompt:
                'Despite your calm efforts, Mr. Okafor has escalated to real aggression — he\'s shouting, has thrown a food tray, is swinging at you, and is trying to grab and hit you. You\'re now backed near a corner. A coworker shouts, "Just grab his arms and wrestle him down yourself — don\'t let him win!" What SHOULD the CNA do?',
              options: [
                {
                  id: 'wrestle',
                  label: 'Grab his arms and try to wrestle him down alone',
                  feedback:
                    '"Wrestle him down yourself, don\'t let him win" is dangerous and wrong: trying to physically manage an aggressive resident alone risks serious injury to both of you, it\'s not your role, and de-escalation is never about "winning." This is a safety crisis. The right action: prioritize safety — give space, move yourself and others out of harm\'s way, keep a clear exit, never get cornered, and get help immediately per your facility\'s emergency plan.',
                },
                {
                  id: 'safety',
                  label: 'Prioritize safety — give space, move yourself and others out of harm\'s way, keep an exit, and get help immediately per your facility\'s emergency plan',
                  feedback:
                    'Right — and this is exactly the judgment that keeps everyone safe. The situation has crossed from agitation into a safety crisis: Mr. Okafor is physically aggressive and you\'re getting cornered, which is dangerous. At this point, talking-based de-escalation may no longer be enough, and safety comes first — for him, for others, and absolutely for you. "Wrestle him down yourself, don\'t let him win" is dangerous and wrong on every level: trying to physically manage an aggressive resident alone risks serious injury to both of you, it\'s not your role, and de-escalation is never about "winning" — that framing is exactly what makes things worse. Staying cornered within his reach, or arguing back, also keep you in danger. The right action is safety first: give space, get yourself and any others out of harm\'s way, never let yourself be cornered — move so you keep a clear exit behind you — and get help immediately, calling for the nurse, coworkers, and your facility\'s emergency response per your plan. Let the trained team response and proper procedures take over. Protecting yourself and getting help isn\'t failure or giving up — it\'s the right, professional judgment when a situation becomes unsafe. Your safety matters too.',
                  isRecommended: true,
                },
                {
                  id: 'cornered',
                  label: 'Keep trying to talk him down while staying cornered within his reach',
                  feedback:
                    'Staying cornered within his reach keeps you in danger — this has become a safety crisis, with physical aggression. Talking-based de-escalation may no longer be enough once it\'s physical and you\'re cornered. The right action: prioritize safety — give space, get yourself and others out of harm\'s way, never stay cornered, keep a clear exit, and get help immediately per your facility\'s emergency plan.',
                },
                {
                  id: 'argue',
                  label: 'Argue back and tell him he\'s not going to win',
                  feedback:
                    'Arguing back keeps you in danger and feeds the crisis — de-escalation is never about "winning," and that framing is exactly what makes things worse. This is a safety crisis with physical aggression. The right action: prioritize safety — give space, get yourself and others out of harm\'s way, keep a clear exit, never get cornered, and get help immediately per your facility\'s emergency plan.',
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
            { id: 'esc-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
              id: 'esc-s10-video',
              type: 'video',
              title: "The CNA's Role",
              videoUrl: '/assets/courses/de-escalation/s10-cna-role.mp4',
              placeholderNote: 'Pending upload: /assets/courses/de-escalation/s10-cna-role.mp4',
            },
            {
              id: 'esc-s10-image',
              type: 'image',
              src: '/assets/courses/de-escalation/s10-hero.jpg',
              caption: 'Report, document, and lean on the team after any incident.',
            },
            {
              id: 'esc-s10-narration',
              type: 'text',
              body: [
                'Your role with agitation and aggression is to be the calm, skilled presence who catches escalation early, de-escalates with care, meets the need, and keeps everyone safe. Let\'s walk through it.',
                '**Recognize early and stay calm.** Be the one who notices agitation rising — the restlessness, the tension, the changing voice — and steps in at the early stage when calm is easiest to restore. And regulate yourself first: breathe, lower your voice, slow down, and let go of taking it personally, because your calm is contagious and becomes the anchor the situation steadies around. Catching it early and bringing your own steadiness is where every good outcome begins.',
                '**De-escalate with words and body.** Use your full toolkit. Speak slowly, softly, and warmly; use their name; listen and acknowledge their feelings instead of arguing; offer reassurance and simple choices. Keep your body open and calm, give space, approach from the front, stay at eye level, never crowd or corner. Never say "calm down," never command or force. Let everything about your words and body tell the resident: you\'re safe, I\'m here, I want to help.',
                '**Meet the need behind the behavior.** Solve the real problem. While you stay calm, look for what\'s driving the agitation — pain, toileting, hunger, fear, a frightening task, noise, being rushed, lost control — and meet it. Easing the true need is what truly resolves the distress, because the message has finally been heard. Redirect gently to something calming when you can. You\'re not just managing behavior; you\'re answering a person\'s unmet need.',
                '**Keep everyone safe and get help.** Hold safety above all. If a situation becomes dangerous, give space, move others away, never try to physically handle it alone, and get help immediately per your facility\'s plan. Protect yourself — keep an exit, don\'t get cornered, step to safety if you must. Afterward, support the resident\'s recovery with calm and reassurance, and report factually — the triggers, the early signs, what helped — so the team can prevent the next one. Getting help and getting to safety is the right call, never failure.',
                'Now the boundary. You do not diagnose. You do not decide on or give medications for agitation. You do not apply restraints outside proper orders. You do not use force beyond what\'s needed to protect safety. And you never have to absorb danger alone.',
                'Inside your role — recognizing early, regulating yourself, de-escalating with words and body, meeting the need, keeping everyone safe, getting help, and reporting — you turn frightening moments into calm ones and protect everyone, including yourself. Few skills make a unit safer or a resident\'s hard moment gentler than a CNA who can de-escalate with calm and care. Stay calm, stay safe, meet the need.',
              ].join('\n\n'),
            },
            {
              id: 'esc-s10-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Stay within scope',
              body: 'You do not diagnose, do not decide on or give medications for agitation, do not apply restraints outside proper orders, and do not use force beyond what\'s needed to protect safety — and you never have to absorb danger alone. You recognize escalation, de-escalate with words and body, meet the need, keep everyone safe, get help, and report.',
            },
          ]),
      },
      {
        slug: 's11-case-study',
        title: 'Brief Case Study',
        sortOrder: 2,
        buildContent: () => {
          const caseNarrative = [
            'Mr. Castellano, 79, had dementia and could become frightened and agitated during personal care, especially in the mornings. He had been a proud, private man — a retired police officer — and being undressed and washed by others distressed him deeply, though he couldn\'t always say so. His CNA, Imelda, had taken the de-escalation training, and she understood the truth at its center: his agitation wasn\'t him being difficult; it was him being frightened and trying to say so the only way he could.',
            '',
            '**The morning it started:** One morning, as Imelda began his care, Mr. Castellano grew tense, his voice rose, and he pulled away, saying sharply, "Leave me alone — stop it!" His fists clenched; he looked frightened and cornered. A coworker leaned in with the old, dangerous advice: "Just hold him still and get it done fast — tell him firmly to calm down and stop fighting you." Imelda knew that path would terrify him, likely escalate him to real aggression, could hurt him, and would amount to forcing care on a resisting resident — never acceptable. She also knew "calm down" almost always makes things worse.',
            '',
            '**Regulating herself first:** So Imelda started with herself. She took a slow breath, lowered her voice, relaxed her face and shoulders, and let go of any urge to take it personally or to rush. She knew her calm was contagious — that if she stayed steady, she\'d give him calm to catch, but if she tensed up, she\'d feed his fear. Her own steadiness became the anchor.',
            '',
            '**De-escalating — words and body:** She stopped the care and stepped back, giving him space so he didn\'t feel trapped or cornered. She got to his eye level, kept her posture open and unhurried, and spoke softly: "I can see this is upsetting you, Mr. Castellano. That\'s okay. I\'m here to help you, and we\'ll go at your pace." She didn\'t argue, didn\'t command, didn\'t say "calm down." She acknowledged his feelings and let him feel heard. His breathing began to slow; his fists loosened.',
            '',
            '**Meeting the need behind the behavior:** Then Imelda looked for what was really driving it. She realized the care had felt sudden and exposing to a private, proud man who didn\'t fully understand what was happening — and that being rushed and uncovered frightened and humiliated him. So she met the real need: she explained gently and simply what she was going to do before each step, kept him covered and his dignity protected, offered him choices, and let him do what he could himself. With his fear eased and his dignity restored, the agitation drained away — and he allowed his care calmly. The behavior had been a message; once she answered it, the distress dissolved.',
            '',
            '**The morning she kept everyone safe:** Imelda\'s skill mattered even more on a different morning, with a different resident — Mr. Okafor — who escalated past words into real aggression, throwing a tray and swinging at her as she found herself backing toward a corner. Here, Imelda held the other half of her training: safety first. She didn\'t try to wrestle him down alone — she knew that risked serious injury and wasn\'t her role, and that de-escalation is never about "winning." She gave space, moved herself and others out of harm\'s way, kept a clear exit behind her instead of getting cornered, and called for help immediately per the facility\'s emergency plan, letting the trained team response take over. No one was hurt.',
            '',
            '**The outcome:** Mr. Castellano\'s mornings grew far calmer, because Imelda and the team learned his triggers and shaped his care around his fear and his dignity — preventing much of the agitation entirely. And when a situation did cross into danger, it ended safely because Imelda put safety first and got help rather than playing hero. The charge nurse summed it up: "Imelda reads the fear behind the behavior, so she calms what most people would fight. And when it\'s truly dangerous, she protects everyone and gets help instead of getting hurt. That\'s exactly the skill we need."',
          ].join('\n');

          return doc('Brief Case Study', [
            { id: 'esc-s11-heading', type: 'heading', level: 1, text: 'Brief Case Study' },
            pendingAudio(
              'esc-s11-audio',
              'The Morning That Almost Went Wrong',
              '/assets/courses/de-escalation/s11-case-podcast.mp3',
              caseNarrative,
              '/assets/courses/de-escalation/s11-case-podcast.mp3',
            ),
            {
              id: 'esc-s11-image',
              type: 'image',
              src: '/assets/courses/de-escalation/s11-hero.jpg',
              caption: 'Reading the fear behind the behavior calms what others would fight.',
            },
            {
              id: 'esc-s11-case-study',
              type: 'case_study',
              title: 'The Morning That Almost Went Wrong',
              residentProfile:
                'Mr. Castellano, 79, with dementia, could become frightened and agitated during personal care, especially mornings. A proud, private man — a retired police officer — being undressed and washed by others distressed him deeply, though he couldn\'t always say so. His CNA, Imelda, understood the truth at the center of de-escalation: his agitation wasn\'t him being difficult; it was him being frightened and trying to say so the only way he could.',
              scenario: [
                '**The morning it started:** As Imelda began his care, Mr. Castellano grew tense, his voice rose, and he pulled away: "Leave me alone — stop it!" His fists clenched; he looked frightened and cornered. A coworker offered the old, dangerous advice: "Hold him still, get it done fast — tell him firmly to calm down and stop fighting you." Imelda knew that path would terrify him, likely escalate him to real aggression, could hurt him, and would amount to forcing care on a resisting resident — never acceptable. And "calm down" almost always makes things worse.',
                '**Regulating herself first:** Imelda started with herself — a slow breath, a lowered voice, relaxed face and shoulders, letting go of any urge to take it personally or rush. She knew her calm was contagious: stay steady and she\'d give him calm to catch; tense up and she\'d feed his fear. Her steadiness became the anchor.',
                '**De-escalating — words and body:** She stopped the care and stepped back, giving space so he didn\'t feel trapped. At his eye level, posture open and unhurried, she spoke softly: "I can see this is upsetting you, Mr. Castellano. That\'s okay. I\'m here to help you, and we\'ll go at your pace." She didn\'t argue, command, or say "calm down." She acknowledged his feelings and let him feel heard. His breathing slowed; his fists loosened.',
                '**Meeting the need behind the behavior:** Imelda looked for what was really driving it — the care had felt sudden and exposing to a private, proud man who didn\'t fully understand what was happening; being rushed and uncovered frightened and humiliated him. So she met the real need: explained gently before each step, kept him covered and his dignity protected, offered choices, let him do what he could. With his fear eased and dignity restored, the agitation drained away and he allowed his care calmly. The behavior was a message; once she answered it, the distress dissolved.',
                '**The morning she kept everyone safe:** On a different morning, a different resident — Mr. Okafor — escalated past words into real aggression, throwing a tray and swinging at her as she backed toward a corner. Here Imelda held the other half of her training: safety first. She didn\'t try to wrestle him down alone — that risked serious injury, wasn\'t her role, and de-escalation is never about "winning." She gave space, moved herself and others out of harm\'s way, kept a clear exit instead of getting cornered, and called for help immediately per the facility\'s emergency plan, letting the trained team response take over. No one was hurt.',
                '**The outcome:** Mr. Castellano\'s mornings grew far calmer, because the team learned his triggers and shaped his care around his fear and dignity — preventing much of the agitation entirely. And when a situation crossed into danger, it ended safely because Imelda put safety first and got help rather than playing hero. The charge nurse summed it up: "Imelda reads the fear behind the behavior, so she calms what most people would fight. And when it\'s truly dangerous, she protects everyone and gets help instead of getting hurt. That\'s exactly the skill we need."',
              ].join('\n\n'),
            },
            {
              id: 'esc-s11-reflection-1',
              type: 'reflection',
              prompt:
                'Mr. Castellano became agitated and said "leave me alone, stop it" during care. Why was forcing the care and telling him to "calm down" the wrong response, and what need was his behavior actually communicating that Imelda met?',
              minCharacters: 50,
            },
            {
              id: 'esc-s11-reflection-2',
              type: 'reflection',
              prompt:
                'With Mr. Okafor, Imelda chose safety first — giving space, keeping an exit, and getting help instead of trying to physically handle it alone. Why is this the right judgment, and why is getting to safety and getting help never "failure"?',
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
            { id: 'esc-s12-heading', type: 'heading', level: 1, text: 'Conclusion' },
            {
              id: 'esc-s12-video',
              type: 'video',
              title: 'Conclusion',
              videoUrl: '/assets/courses/de-escalation/s12-conclusion.mp4',
              placeholderNote: 'Pending upload: /assets/courses/de-escalation/s12-conclusion.mp4',
            },
            {
              id: 'esc-s12-image',
              type: 'image',
              src: '/assets/courses/de-escalation/s12-hero.jpg',
              caption: 'Calm is a skill — and getting help is never failure.',
            },
            {
              id: 'esc-s12-narration',
              type: 'text',
              body: [
                'You\'ve reached the end. Let\'s lock in the five things that matter most about agitation, aggression, and de-escalation.',
                '**One.** Behavior is communication. Agitation and aggression are almost never malice — they\'re the outward sign of fear, pain, confusion, frustration, or an unmet need the person can\'t put into words. Ask "what does this person need?" instead of "why are they being difficult?" That single shift turns a battle into caregiving and is the heart of de-escalation.',
                '**Two.** Catch it early and bring your own calm. Escalation climbs in stages, and the early signs — restlessness, tension, a changing voice — are your best moment to act, because calm is far easier to restore early than late. And regulate yourself first: your calm is contagious, and so is your tension. Breathe, lower your voice, slow down. You can\'t calm anyone while you\'re escalating.',
                '**Three.** De-escalate with words and body. Speak slowly, softly, warmly; use their name; acknowledge their feelings instead of arguing; offer simple choices. Keep your body open and calm, give space, approach from the front, never crowd or corner. Never say "calm down," never command or force. Everything should tell them: you\'re safe, I\'m here to help.',
                '**Four.** Meet the need behind the behavior. While you stay calm, find what\'s really driving the agitation — pain, toileting, fear, a frightening task, noise, being rushed, lost control — and meet it. Often the agitation dissolves once the need is finally heard and answered. The techniques bring calm; meeting the need is the cure.',
                '**Five.** Safety first — including yours — and know your scope. If a situation becomes dangerous, give space, move others away, get help immediately, and protect yourself — getting to safety is never failure. You never diagnose, medicate, restrain outside orders, or use force beyond safety. You recognize, de-escalate, meet the need, keep everyone safe, get help, and report. Stay calm, stay safe, meet the need.',

                'This course provides one hour of continuing education through CAL ACE Nursing Academy (CDPH Provider NAC #7384). Your certificate is generated automatically when you pass the knowledge check.',
                'Ten questions are waiting. Everything on them was covered here. You\'re ready. Trust what you\'ve learned, and show what you know.',
              ].join('\n\n'),
            },
            {
              id: 'esc-s12-summary',
              type: 'summary',
              title: 'Five things that matter most',
              items: [
                'Behavior is communication — agitation and aggression are almost never malice, but fear, pain, confusion, or an unmet need. Ask "what does this person need?" not "why are they being difficult?"',
                'Catch it early and bring your own calm — escalation climbs in stages, and the early signs are your best moment to act. Regulate yourself first; your calm is contagious, and so is your tension.',
                'De-escalate with words and body — speak slowly and softly, use their name, acknowledge feelings, offer choices; keep your body open, give space, approach from the front, never corner. Never say "calm down."',
                'Meet the need behind the behavior — find what\'s driving the agitation (pain, toileting, fear, noise, being rushed, lost control) and meet it. The techniques bring calm; meeting the need is the cure.',
                'Safety first — including yours — and know your scope. If it\'s dangerous: give space, move others away, get help, protect yourself; getting to safety is never failure. You never diagnose, medicate, restrain outside orders, or use force beyond safety.',
              ],
            },
          ]),
      },
    ],
  },
];

export async function seedCourse08Deescalation(
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
      label: 'V3 rebuild — agitation, aggression & de-escalation',
      status: CourseVersionStatus.DRAFT,
      deliveryMode: DeliveryMode.ONLINE,
      ceHours,
      publishedAt: null,
      contentMeta: contentMeta as Prisma.InputJsonValue,
    },
    update: {
      label: 'V3 rebuild — agitation, aggression & de-escalation',
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
    `Seeding Course 8 (Agitation, Aggression & De-escalation) as DRAFT — slug "${COURSE_SLUG}", version ${VERSION_NUMBER}…`,
  );

  try {
    const result = await seedCourse08Deescalation(prisma);
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
