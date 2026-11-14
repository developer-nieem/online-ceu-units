/**
 * Seed Course 13 — The CNA's Role During a Cardiac Emergency (DRAFT).
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-13-cardiac-emergencies
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
const COURSE_SLUG = 'cardiac-emergency';
const COURSE_TITLE = 'Cardiac Warning Signs and Emergency Response Support';
const COURSE_SUMMARY =
  'Learn to recognize cardiac emergencies, activate help correctly and fast, and understand your role during a code — within CNA scope. Does not certify CPR/AED.';

// CONFIRMED against live DB: v3 is PUBLISHED (holds cert CALACE-2026-TKM8AW
// — DO NOT TOUCH). v4 is the editable DRAFT the CMS reads via
// ensureEditableVersion. v1/v2 are RETIRED. Seed must target v4.
const VERSION_NUMBER = 4;

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
    'Recognize the warning signs and sudden signs of a cardiac emergency',
    'Activate your facility\'s emergency response the right way',
    'Describe your role during a code while the team works',
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
  heroImage: '/assets/courses/cardiac-emergency/hero-banner.jpg',
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
    title: 'Understanding Cardiac Emergencies',
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: 'Introduction',
        sortOrder: 0,
        buildContent: () =>
          doc('Introduction', [
            { id: 'cardiac-s01-heading', type: 'heading', level: 1, text: 'Welcome' },
            {
              id: 'cardiac-s01-video',
              type: 'video',
              title: 'Introduction',
              videoUrl: `${ASSET_BASE}/s01-intro.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s01-intro.mp4`,
            },
            {
              id: 'cardiac-s01-image',
              type: 'image',
              src: '/assets/courses/cardiac-emergency/s01-hero.jpg',
              caption: 'A CAL ACE CNA ready to respond calmly in a cardiac emergency.',
            },
            {
              id: 'cardiac-s01-narration',
              type: 'text',
              body: [
                'Welcome to CAL ACE Nursing Academy.',
                'This course is about cardiac emergencies — and your role when one happens.',
                'A cardiac emergency is one of the few moments in healthcare measured in seconds, not minutes. When a resident\'s heart stops, brain damage can begin in four to six minutes. Survival depends on what happens in the first moments — and very often, the first person there is a CNA.',
                'Here is why your role matters so much. A doctor is not in the room at 3 a.m. A nurse may be down the hall with another resident. But you are there. You found them. What you do in the next sixty seconds — recognize, call for help, start the response, stay with the resident — shapes everything the medical team can do after.',
                'There is a ten-question knowledge check at the end. Everything on it is covered here. Let\'s begin.',
              ].join('\n\n'),
            },
            {
              id: 'cardiac-s01-course-information-text',
              type: 'text',
              body: [
                'Let\'s be clear from the start about what this course is, and what it is not.',
                'This course teaches you to recognize a cardiac emergency, to activate help correctly and fast, and to understand your role during a code — the team response that follows. You will learn how to be the calm, fast, organized first responder who gives the resident their best chance.',
                'This course does not certify you in CPR or in using an A-E-D. Those are hands-on skills. They can only be taught and tested in person, through an approved course like the American Heart Association or the Red Cross. If your certification has lapsed, renewing it is one of the most valuable things you can do. This course makes you better at everything around those skills — but it does not replace them.',
              ].join('\n\n'),
            },
            {
              id: 'cardiac-s01-course-information-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of this course',
              body: 'Recognition + activation + the CNA\'s role in a code. This course does not teach or certify CPR/AED — hands-on certification must come from an in-person, skills-tested course.',
            },
            {
              id: 'cardiac-s01-learning-objectives-text',
              type: 'text',
              body: 'By the end of this course, you will be able to:',
            },
            {
              id: 'cardiac-s01-learning-objectives-summary',
              type: 'summary',
              title: 'Learning objectives',
              items: [
                'Recognize the warning signs and the sudden signs of a cardiac emergency.',
                'Activate your facility\'s emergency response the right way.',
                'Describe your role during a code while the team works.',
                'Know your scope — what a CNA does, and what a CNA must never do.',
              ],
            },
            {
              id: 'cardiac-s01-instructor-intro-text',
              type: 'text',
              body: 'This course is presented by CAL ACE Nursing Academy — an approved CDPH continuing education provider, NAC number 7384.',
            },
          ]),
      },
      {
        slug: 's02-terms',
        title: 'Terms & Definitions',
        sortOrder: 1,
        buildContent: () =>
          doc('Terms & Definitions', [
            { id: 'cardiac-s02-heading', type: 'heading', level: 1, text: 'Key terms' },
            {
              id: 'cardiac-s02-image',
              type: 'image',
              src: '/assets/courses/cardiac-emergency/s02-hero.jpg',
              caption: 'Knowing the terms is the first step to acting fast.',
            },
            {
              id: 'cardiac-s02-reveal-arrest',
              type: 'reveal_card',
              frontTitle: 'Cardiac Arrest',
              frontBody: 'Cardiac arrest',
              backTitle: 'Cardiac Arrest',
              backBody:
                'This means the heart suddenly stops beating effectively. Blood stops moving. The resident collapses, stops breathing normally, and does not respond. This is the most serious cardiac emergency. Every second counts.',
            },
            {
              id: 'cardiac-s02-reveal-heart-attack',
              type: 'reveal_card',
              frontTitle: 'Heart Attack (Myocardial Infarction)',
              frontBody: 'My-oh-CAR-dee-al in-FARK-shun',
              backTitle: 'Heart Attack (Myocardial Infarction)',
              backBody:
                'A blood vessel feeding the heart muscle becomes blocked. The muscle starts to die from lack of oxygen. A heart attack can lead to cardiac arrest — but they are not the same thing.',
            },
            {
              id: 'cardiac-s02-reveal-difference',
              type: 'reveal_card',
              frontTitle: 'Cardiac Arrest vs. Heart Attack',
              frontBody: 'Plumbing vs. electrical',
              backTitle: 'Cardiac Arrest vs. Heart Attack',
              backBody:
                'A heart attack is a plumbing problem — a blocked pipe. Cardiac arrest is an electrical problem — the pump suddenly stops. A person having a heart attack is usually awake and in pain. A person in cardiac arrest is collapsed and unresponsive.',
            },
            {
              id: 'cardiac-s02-reveal-code-blue',
              type: 'reveal_card',
              frontTitle: 'Code Blue',
              frontBody: 'Code Blue',
              backTitle: 'Code Blue',
              backBody:
                'In most facilities, this is the emergency announcement that means a person needs immediate lifesaving response — usually for cardiac or breathing arrest. When you hear "Code Blue," trained responders rush to that location. Know your facility\'s exact term — some use different words.',
            },
            {
              id: 'cardiac-s02-reveal-aed',
              type: 'reveal_card',
              frontTitle: 'AED',
              frontBody: 'A-E-D',
              backTitle: 'AED',
              backBody:
                'Automated External Defibrillator. A portable device that checks the heart\'s rhythm and, if needed, delivers a shock to restart a normal beat. It speaks step-by-step instructions out loud. Using one requires hands-on training — but knowing where yours is kept can save minutes.',
            },
            {
              id: 'cardiac-s02-reveal-cpr',
              type: 'reveal_card',
              frontTitle: 'CPR',
              frontBody: 'C-P-R',
              backTitle: 'CPR',
              backBody:
                'Cardiopulmonary resuscitation. Chest compressions and rescue breaths that keep blood and oxygen moving when the heart has stopped. CPR buys time until advanced help arrives. It must be learned and tested in a hands-on certified course.',
            },
            {
              id: 'cardiac-s02-reveal-chain',
              type: 'reveal_card',
              frontTitle: 'Chain of Survival',
              frontBody: 'Chain of Survival',
              backTitle: 'Chain of Survival',
              backBody:
                'The series of actions that give a cardiac arrest victim the best chance: early recognition and call for help, early CPR, early defibrillation, and advanced care. Each link depends on the one before. The CNA is almost always the first link.',
            },
            {
              id: 'cardiac-s02-reveal-responsiveness',
              type: 'reveal_card',
              frontTitle: 'Responsiveness',
              frontBody: 'Responsiveness',
              backTitle: 'Responsiveness',
              backBody:
                'Whether a person reacts to your voice or touch. To check, you tap firmly and shout, "Are you okay?" A person who does not move, speak, or react is unresponsive — and unresponsiveness plus no normal breathing means activate emergency help immediately.',
            },
            {
              id: 'cardiac-s02-kc1-check',
              type: 'knowledge_check',
              question: 'Match the term: heart suddenly stops, person collapses',
              options: [
                { id: 'cardiac-arrest', label: 'Cardiac arrest' },
                { id: 'heart-attack', label: 'Heart attack' },
                { id: 'aed', label: 'AED' },
              ],
              correctOptionId: 'cardiac-arrest',
              explanation:
                'Cardiac arrest. This means the heart suddenly stops beating effectively. Blood stops moving. The resident collapses, stops breathing normally, and does not respond.',
              requiredForCompletion: true,
            },
            {
              id: 'cardiac-s02-kc1-check-2',
              type: 'knowledge_check',
              question: 'Match the term: blocked vessel, person usually awake and in pain',
              options: [
                { id: 'cardiac-arrest', label: 'Cardiac arrest' },
                { id: 'heart-attack', label: 'Heart attack' },
                { id: 'aed', label: 'AED' },
              ],
              correctOptionId: 'heart-attack',
              explanation:
                'Heart attack. A blood vessel feeding the heart muscle becomes blocked. The person is often awake, in pain, sweating, frightened.',
              requiredForCompletion: true,
            },
            {
              id: 'cardiac-s02-kc1-check-3',
              type: 'knowledge_check',
              question: 'Match the term: device that checks rhythm and can deliver a shock',
              options: [
                { id: 'cardiac-arrest', label: 'Cardiac arrest' },
                { id: 'heart-attack', label: 'Heart attack' },
                { id: 'aed', label: 'AED' },
              ],
              correctOptionId: 'aed',
              explanation:
                'AED. Automated External Defibrillator. A portable device that checks the heart\'s rhythm and, if needed, delivers a shock to restart a normal beat.',
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
            { id: 'cardiac-s03-heading', type: 'heading', level: 1, text: 'Statistics' },
            pendingAudio(
              'cardiac-s03-audio',
              'Cardiac Emergencies: Why Seconds Decide Everything',
              `${ASSET_BASE}/s03-stats-podcast.mp3`,
              [
                'Cardiac Emergencies: Why Seconds Decide Everything',
                '',
                'More than 350,000 cardiac arrests happen outside of hospitals each year in the United States. A large share occur in older adults, and long-term care facilities see them regularly because their residents often have heart disease, high blood pressure, and other risk factors.',
                '',
                'Here is the statistic that shapes everything a CNA does: for every minute that passes without CPR and defibrillation, the chance of survival drops by roughly 7 to 10 percent. After about ten minutes with no response, survival becomes very unlikely. This is why a cardiac arrest is one of the only events in healthcare where the response is measured in seconds.',
                '',
                'When CPR is started immediately by a bystander — before professional responders arrive — it can double or even triple the person\'s chance of survival. In a care facility, that immediate bystander is almost always a CNA or a nurse who happens to be closest.',
                '',
                'Yet studies show that immediate response does not always happen. Sometimes people freeze. Sometimes they waste precious time deciding whether it\'s "really" an emergency, or looking for someone else to take charge. The difference between a facility with good outcomes and one with poor outcomes is often not equipment — it\'s whether the first person on the scene recognized the emergency instantly and activated help without hesitating.',
                '',
                'For long-term care, there is one more factor: many residents have do-not-resuscitate orders, or DNRs. A CNA must know that these orders exist and that the nurse directs what happens — but a CNA never decides on their own whether to respond. The CNA\'s job is always the same: recognize, call for help immediately, and let the nurse and the care plan direct the response.',
                '',
                'The bottom line: equipment and training matter, but the single biggest factor in survival is how fast the first person acts. In most care facilities, that first person is a CNA.',
              ].join('\n'),
              `${ASSET_BASE}/s03-stats-podcast.mp3`,
            ),
            {
              id: 'cardiac-s03-image',
              type: 'image',
              src: '/assets/courses/cardiac-emergency/s03-hero.jpg',
              caption: 'Cardiac events happen where CNAs work — readiness matters.',
            },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: 'Fundamentals',
        sortOrder: 3,
        buildContent: () =>
          doc('Fundamentals', [
            { id: 'cardiac-s04-heading', type: 'heading', level: 1, text: 'Fundamentals' },
            {
              id: 'cardiac-s04-video',
              type: 'video',
              title: 'Fundamentals',
              videoUrl: `${ASSET_BASE}/s04-fundamentals.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s04-fundamentals.mp4`,
            },
            {
              id: 'cardiac-s04-image',
              type: 'image',
              src: '/assets/courses/cardiac-emergency/s04-hero.jpg',
              caption: 'Being ready means knowing the facility response plan.',
            },
            {
              id: 'cardiac-s04-narration',
              type: 'text',
              body: [
                '**The heart as an electrical pump**',
                'The heart is both a pump and an electrical system. Tiny electrical signals tell the heart muscle when to squeeze, in a steady rhythm, about sixty to a hundred times a minute. When the plumbing or the electricity fails, an emergency begins.',
                '**Heart attack: the plumbing problem**',
                'In a heart attack, one of the vessels feeding the heart muscle gets blocked — usually by a clot. The muscle beyond the blockage starts to die without oxygen. The person is often awake, in pain, sweating, frightened. This is an emergency, but the heart is still beating. Fast help can save the muscle.',
                '**Cardiac arrest: the electrical problem**',
                'In cardiac arrest, the heart\'s electrical system fails and the pump stops — suddenly, often without warning. The person collapses, becomes unresponsive, and stops breathing normally. No blood reaches the brain. This is the most time-critical emergency in all of healthcare.',
                '**Why minutes matter**',
                'The brain cannot store oxygen. When the heart stops, the brain begins to suffer within four to six minutes. After about ten minutes without circulation, recovery becomes very unlikely. This is why we don\'t wait, we don\'t second-guess, and we don\'t go looking for permission. We act.',
                '**What CPR actually does**',
                'CPR does not usually restart the heart. What it does is keep a small but vital amount of blood and oxygen moving to the brain and organs — buying time until a defibrillator and advanced help arrive. Think of CPR as keeping the lights on until the electricians get there.',
                '**What an AED actually does**',
                'An AED reads the heart\'s electrical rhythm. If it finds a rhythm that a shock can correct, it delivers that shock to give the heart a chance to restart a normal beat. It will not shock a heart that doesn\'t need it — the device decides, safely. It talks the rescuer through every step.',
                '**Your place in the chain**',
                'You are almost always the first link in the Chain of Survival: the person who recognizes the emergency and calls for help. Everything the nurses, paramedics, and doctors do afterward depends on that first link being fast and strong. The rest of this course makes you that strong first link.',
              ].join('\n\n'),
            },
            {
              id: 'cardiac-s04-minutes-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Minutes matter',
              body: 'When the heart stops, the brain begins to suffer within four to six minutes. After about ten minutes without circulation, recovery becomes very unlikely. Do not wait, second-guess, or go looking for permission — act.',
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
            { id: 'cardiac-s05-heading', type: 'heading', level: 1, text: 'Signs & Symptoms' },
            {
              id: 'cardiac-s05-image',
              type: 'image',
              src: '/assets/courses/cardiac-emergency/s05-hero.jpg',
              caption: 'Recognizing cardiac warning signs early can save a life.',
            },
            {
              id: 'cardiac-s05-narration',
              type: 'text',
              body: [
                '**Chest pain**',
                'Learn the warning signs of a heart attack, because catching one early can prevent a cardiac arrest. Classic chest pain feels like pressure, squeezing, or a heavy weight on the center of the chest. It may last more than a few minutes, or come and go. The resident may be sweating, pale, and frightened.',
                '**The quieter signs**',
                'But heart attacks don\'t always look like the movies. Pain may spread to the arm, the back, the neck, the jaw, or the stomach. Some residents — especially women, older adults, and people with diabetes — may have no chest pain at all. Instead: sudden shortness of breath, unusual fatigue, nausea, lightheadedness, or a cold sweat. Any of these, reported fast, gets the nurse there fast.',
                '**Sudden collapse**',
                'Cardiac arrest looks different — and it is unmistakable once you know it. The resident suddenly collapses. They do not respond to your voice. They are not breathing, or they are only gasping — slow, irregular gasps that are not real breathing. Do not mistake gasping for breathing. Gasping in a collapsed, unresponsive person means the heart has stopped.',
                '**The responsiveness check**',
                'When you find a resident who may have collapsed, check responsiveness fast. Tap the shoulder firmly. Shout, "Are you okay? Can you hear me?" If there is no response — no movement, no words, no normal breathing — this is a cardiac emergency. You do not investigate further. You do not wait to be sure. You activate help immediately.',
                '**Summary**',
                'Two pictures to remember. Heart attack: usually awake, chest pressure or pain spreading to arm or jaw, sweating, short of breath — report immediately. Cardiac arrest: collapsed, unresponsive, not breathing normally or only gasping — activate emergency response now.',
                'And the rule that covers both: when in doubt, treat it as an emergency and call for help. No one will ever fault a CNA for calling for help too quickly. They may lose a resident for calling too slowly.',
              ].join('\n\n'),
            },
            {
              id: 'cardiac-s05-gasping-callout',
              type: 'callout',
              variant: 'warning',
              title: 'Do not mistake gasping for breathing',
              body: 'Gasping in a collapsed, unresponsive person means the heart has stopped. Activate emergency help immediately.',
            },
          ]),
      },
      {
        slug: 's06-causes',
        title: 'Causes',
        sortOrder: 1,
        buildContent: () =>
          doc('Causes', [
            { id: 'cardiac-s06-heading', type: 'heading', level: 1, text: 'Causes' },
            pendingAudio(
              'cardiac-s06-audio',
              'What Causes Cardiac Emergencies?',
              `${ASSET_BASE}/s06-causes-podcast.mp3`,
              [
                'What Causes Cardiac Emergencies?',
                '',
                'Most cardiac emergencies in older adults come from coronary artery disease — the slow narrowing of the vessels that feed the heart muscle. When one of these narrowed vessels becomes fully blocked by a blood clot, a heart attack happens. If enough heart muscle is damaged, or if the electrical system is disrupted, the heart can stop entirely — cardiac arrest.',
                '',
                'Several conditions raise the risk, and many long-term care residents have several of them at once. High blood pressure strains the heart for years. Diabetes damages blood vessels and can hide the usual warning signs of a heart attack. Previous heart attacks leave scarred muscle that is more likely to develop dangerous rhythms. Congestive heart failure weakens the pump. Abnormal heart rhythms, like atrial fibrillation, can sometimes lead to arrest.',
                '',
                'Other triggers include severe electrolyte imbalances — for example, potassium levels that are too high or too low — which can disturb the heart\'s electrical signals. Certain medications, severe infections, and major physical stress can also contribute.',
                '',
                'Lifestyle factors that built up over a lifetime matter too: smoking, long-term poor diet, physical inactivity, and obesity all raise cardiac risk.',
                '',
                'For the CNA, here is what this means in practice. The residents who need your closest attention are those whose charts list heart disease, a prior heart attack, heart failure, diabetes, or abnormal heart rhythms — especially when several appear together. You are not expected to predict who will have an emergency. You are expected to know which residents carry higher risk, to watch them a little more closely, and to respond instantly when any resident shows the signs you learned in the last section.',
              ].join('\n'),
              `${ASSET_BASE}/s06-causes-podcast.mp3`,
            ),
            {
              id: 'cardiac-s06-image',
              type: 'image',
              src: '/assets/courses/cardiac-emergency/s06-hero.jpg',
              caption: 'Understanding what raises cardiac risk.',
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
              id: 'cardiac-s07-heading',
              type: 'heading',
              level: 1,
              text: 'CNA Role & Best Practices',
            },
            {
              id: 'cardiac-s07-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Scope of practice',
              body: 'CNAs RECOGNIZE, ACTIVATE, and SUPPORT. CNAs never give medications or adjust oxygen. CPR & AED require hands-on certification — this online course does not certify you.',
            },
            {
              id: 'cardiac-s07-image',
              type: 'image',
              src: '/assets/courses/cardiac-emergency/s07-hero.jpg',
              caption: 'The CNA observes, calls for help, and supports — within scope.',
            },
            {
              id: 'cardiac-s07-narration',
              type: 'text',
              body: [
                'In a cardiac emergency, the treatments belong to the nurse, the paramedics, and the doctor. Your job is to recognize, activate, and support — never to treat. Let\'s walk through what you\'ll see, and exactly where your line is.',
                '**Nitroglycerin.** Some residents with heart conditions are prescribed nitroglycerin — a small tablet placed under the tongue, or a spray, for chest pain. Here is your scope: a CNA does not give nitroglycerin. If a resident has chest pain, you call the nurse immediately. The nurse decides about medication. Even if the resident asks for "their pill," even if it\'s sitting right there — you call the nurse.',
                '**Aspirin.** In a heart attack, a doctor or nurse may direct that aspirin be given to help thin the blood. This is a medical decision made by licensed staff. A CNA never decides to give aspirin.',
                '**Oxygen.** A resident in distress may be placed on oxygen by the nurse. You may see this happen. You do not start oxygen, and you do not change the flow rate — not by a single number. That is nursing scope.',
                '**CPR and the AED.** Here is the most important scope statement in this course. CPR and AED use are hands-on skills. If — and only if — you hold a current, hands-on CPR and AED certification, you may perform them within your training and your facility\'s policy during an emergency. This online course does not certify you to do either one. It cannot. Those skills require in-person training and a skills test. If your certification has expired, renew it. It is one of the most valuable things a CNA can carry.',
                '**What you always do.** No matter your certification, your core role never changes: recognize the emergency, call for help and activate the response immediately, clear the area and bring the AED and emergency equipment to the scene if directed, and follow the nurse\'s direction. Those actions save lives, and every CNA can do them.',
                'One sentence to carry: in a cardiac emergency, the CNA\'s power is speed and support — not treatment.',
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
            { id: 'cardiac-s08-heading', type: 'heading', level: 1, text: 'Prevention & Risk Reduction' },
            {
              id: 'cardiac-s08-image',
              type: 'image',
              src: '/assets/courses/cardiac-emergency/s08-hero.jpg',
              caption: 'Calm, correct response within scope is the standard.',
            },
            {
              id: 'cardiac-s08-narration',
              type: 'text',
              body: [
                'You cannot prevent every cardiac emergency. But CNAs prevent more of them than they realize, and prepare for the rest. Here are seven ways.',
                '**One. Report early warning signs.** A resident mentioning new chest discomfort, unusual fatigue, or shortness of breath during the day may be showing the early signs of a heart problem. Reported to the nurse, it can be treated before it becomes a 3 a.m. arrest.',
                '**Two. Know your high-risk residents.** Glance at the chart. The resident with heart disease, diabetes, and a prior heart attack deserves a closer eye. Knowing who is at risk means you\'ll recognize trouble faster.',
                '**Three. Support the care plan.** Low-sodium diets, fluid limits, medication schedules, activity levels — these exist to protect the heart. When you follow them faithfully and report when a resident doesn\'t, you\'re preventing crises.',
                '**Four. Watch during exertion.** Cardiac events often happen during or after activity — walking to meals, bathing, even straining on the toilet. Pace activities, allow rest, and stay attentive when a high-risk resident exerts themselves.',
                '**Five. Know your equipment locations.** Right now, do you know where the nearest AED is? Where the emergency call button is on your unit? Knowing these before an emergency saves the minutes that decide survival. Find out today.',
                '**Six. Keep certification current.** If CPR and AED certification is part of your role, keep it from lapsing. The skill is only there in the emergency if you renewed it before the emergency.',
                '**Seven. Practice the response in your mind.** The best responders have already rehearsed. Picture it: you find a resident collapsed. What\'s your first move? Where do you call? Mentally walking through it now means you won\'t freeze when it\'s real.',
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
              id: 'cardiac-s09-heading',
              type: 'heading',
              level: 1,
              text: 'Scenario & Reporting',
            },
            pendingAudio(
              'cardiac-s09-intro-audio',
              'Emergency response scenarios intro',
              `${ASSET_BASE}/s09-emergency-intro.mp3`,
              'This section is the heart of the course. In a cardiac emergency, the difference between the right response and the wrong one is measured in seconds. You\'re about to work through two situations. Read each carefully. Choose your action. You\'ll get feedback right away. There is no penalty for treating something as an emergency — only for hesitating when it is one.',
              `${ASSET_BASE}/s09-emergency-intro.mp3`,
            ),
            {
              id: 'cardiac-s09-image',
              type: 'image',
              src: '/assets/courses/cardiac-emergency/s09-hero.jpg',
              caption: 'Recognize, call for help, support — with calm urgency.',
            },
            {
              id: 'cardiac-s09-scenario-arrest-image',
              type: 'image',
              src: '/assets/courses/cardiac-emergency/s09-scenario-arrest.jpg',
              caption: 'Sudden collapse: call a code, get the AED, stay with them.',
            },
            {
              id: 'cardiac-s09-scenario-arrest',
              type: 'scenario_question',
              prompt:
                'You walk into Mr. Okafor\'s room and find him slumped over in his wheelchair. You call his name — no response. You tap his shoulder firmly and shout — still nothing. He is not breathing normally; you see only occasional slow gasps. What is the BEST first action?',
              options: [
                {
                  id: 'find-nurse',
                  label: 'Go find the nurse and bring her back to check him',
                  feedback:
                    'This resident is in cardiac arrest — unresponsive, only gasping. Leaving to find someone, offering water, or waiting all cost the seconds that decide survival. The right action is to activate emergency help immediately where you are, stay with him, and get the AED to the scene. Speed is everything.',
                },
                {
                  id: 'activate-now',
                  label: 'Call for help and activate the emergency response immediately, then stay with him',
                  feedback:
                    'Exactly right. Unresponsive, not breathing normally, only gasping — this is cardiac arrest. Activate the emergency response the instant you recognize it: call out for help, use the emergency call system, and follow your facility\'s code procedure. Do not leave to "go find" someone if you can summon help where you are — every second without circulation lowers his chance. Stay with him, get the AED brought over, and follow the nurse\'s direction. If you are CPR/AED certified and policy directs it, begin within your training.',
                  isRecommended: true,
                },
                {
                  id: 'sip-water',
                  label: 'Give him a sip of water to wake him up',
                  feedback:
                    'This resident is in cardiac arrest — unresponsive, only gasping. Leaving to find someone, offering water, or waiting all cost the seconds that decide survival. The right action is to activate emergency help immediately where you are, stay with him, and get the AED to the scene. Speed is everything.',
                },
                {
                  id: 'wait',
                  label: 'Wait two minutes to see if he wakes up on his own',
                  feedback:
                    'This resident is in cardiac arrest — unresponsive, only gasping. Leaving to find someone, offering water, or waiting all cost the seconds that decide survival. The right action is to activate emergency help immediately where you are, stay with him, and get the AED to the scene. Speed is everything.',
                },
              ],
              requiredForCompletion: true,
            },
            {
              id: 'cardiac-s09-scenario-warning-image',
              type: 'image',
              src: '/assets/courses/cardiac-emergency/s09-scenario-warning.jpg',
              caption: 'Warning signs before arrest — recognize early, escalate fast.',
            },
            {
              id: 'cardiac-s09-scenario-warning',
              type: 'scenario_question',
              prompt:
                'While helping Mrs. Lindqvist to the dining room, she stops and says her chest feels "tight and heavy" and she\'s a little short of breath. She is awake, talking, and pale, with a light sweat on her forehead. She asks you to help her sit down. What SHOULD the CNA do?',
              options: [
                {
                  id: 'after-lunch',
                  label: 'Help her sit and rest, and tell the nurse to handle it after lunch',
                  feedback:
                    'These are heart attack warning signs — they cannot wait until after lunch, and you never give medication, even the resident\'s own nitroglycerin. Walking it off could make it far worse. The right response: help her rest, stay with her, and call the nurse immediately so licensed staff can act fast.',
                },
                {
                  id: 'call-nurse-now',
                  label: 'Help her sit comfortably, stay with her, and call the nurse immediately',
                  feedback:
                    'Right. She is awake and talking, so this is not yet cardiac arrest — but chest tightness, shortness of breath, pallor, and sweating are classic heart attack warning signs. Help her into a comfortable resting position, stay with her so she is never alone, and call the nurse immediately. Fast reporting here may prevent the chest pain from becoming an arrest. And note what you do NOT do — you never give her nitroglycerin or any medication. That is the nurse\'s decision.',
                  isRecommended: true,
                },
                {
                  id: 'nitroglycerin',
                  label: 'Give her one of her nitroglycerin tablets from her drawer',
                  feedback:
                    'These are heart attack warning signs — they cannot wait until after lunch, and you never give medication, even the resident\'s own nitroglycerin. Walking it off could make it far worse. The right response: help her rest, stay with her, and call the nurse immediately so licensed staff can act fast.',
                },
                {
                  id: 'keep-walking',
                  label: 'Encourage her to keep walking to "work through it"',
                  feedback:
                    'These are heart attack warning signs — they cannot wait until after lunch, and you never give medication, even the resident\'s own nitroglycerin. Walking it off could make it far worse. The right response: help her rest, stay with her, and call the nurse immediately so licensed staff can act fast.',
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
            { id: 'cardiac-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
            {
              id: 'cardiac-s10-video',
              type: 'video',
              title: "CNA's Role in Care",
              videoUrl: `${ASSET_BASE}/s10-cna-role.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s10-cna-role.mp4`,
            },
            {
              id: 'cardiac-s10-image',
              type: 'image',
              src: '/assets/courses/cardiac-emergency/s10-hero.jpg',
              caption: 'Accurate reporting to arriving nurses and medics.',
            },
            {
              id: 'cardiac-s10-narration',
              type: 'text',
              body: [
                'When a cardiac emergency happens, a CNA has a clear and powerful role. Let\'s walk through it, moment by moment.',
                '**Activate** The instant you recognize the emergency, activate help. Call out loudly. Press the emergency call button. Use whatever system your facility has to summon the code team — fast. This is the single most important thing you will do, and it is entirely within your scope.',
                '**Make space** Help create a working space. A cardiac response needs room. Move furniture, chairs, the bedside table. If the resident is in a bad position for care and you can safely help reposition them flat on a firm surface as directed, do so. Clear the path so responders and equipment can reach the resident.',
                '**Bring equipment** Get the equipment to the scene. Know where your AED and emergency cart are kept, and bring them fast when an emergency is called. Minutes spent searching are minutes lost. A CNA who hands the AED to the team the moment they arrive has done something that genuinely saves lives.',
                '**Manage the environment** Manage everything around the emergency so the clinical team can focus. Calmly guide other residents away. Reassure a frightened roommate. Direct arriving responders to the room. Note the time things happened if you can. Stay calm — your calm helps everyone.',
                'And one more role that matters: support the family and the team afterward. A cardiac emergency is hard on everyone who witnesses it, including you. It is okay to feel shaken. Talk to your supervisor, use your facility\'s support resources, and know that doing your part well — even when the outcome is not what anyone hoped — is something to be proud of.',
                'Now the boundary. You do not lead the medical response — the nurse and code team do. You do not give medications. You do not adjust oxygen. You do not perform CPR or use the AED unless you hold current hands-on certification and policy directs it. And you never decide on your own about a resident\'s DNR status — that is directed by the nurse and the care plan.',
                'Inside your role — recognize, activate, clear space, bring equipment, manage the environment, support — you are essential. The code team cannot do their job well without a strong CNA doing yours.',
              ].join('\n\n'),
            },
            {
              id: 'cardiac-s10-scope-callout',
              type: 'callout',
              variant: 'clinical',
              title: 'Stay within scope',
              body: 'You do not give medications. You do not adjust oxygen. You do not perform CPR or use the AED unless you hold current hands-on certification and policy directs it. You never decide on your own about a resident\'s DNR status.',
            },
          ]),
      },
      {
        slug: 's11-case-study',
        title: 'Case Study',
        sortOrder: 2,
        buildContent: () => {
          const caseNarrative = [
            'CNA Maria was helping residents to breakfast when she passed Mr. Abboud\'s room and glanced in, as she always did. He was sitting in his bedside chair, head dropped to one side. Something looked wrong.',
            '',
            '**The recognition (0 seconds):** Maria stepped in and called his name. No answer. She tapped his shoulder firmly and shouted, "Mr. Abboud, are you okay?" Nothing. She looked at his chest — no normal breathing, just one slow gasp. She knew instantly: this was cardiac arrest, and she did not stop to be sure.',
            '',
            '**The activation (15 seconds):** Maria pressed the emergency call button on the wall and shouted down the hall, "Code Blue, room 14, I need help now!" She did not leave the room to find the nurse — she summoned help to her.',
            '',
            '**The response (30–90 seconds):** As the nurse ran in, Maria had already moved the bedside table out of the way and was clearing space. The nurse directed her: "Get the AED." Maria knew exactly where it was — she had checked that morning, as she did every shift — and had it at the bedside in under a minute. Because Maria held current CPR certification and the nurse directed it, she began compressions while the nurse readied the AED, following her training and facility policy.',
            '',
            '**The team (2+ minutes):** The code team arrived. Maria stepped into her supporting role — guiding Mr. Abboud\'s frightened roommate to the lounge, directing the paramedics to the room, and noting the times she remembered. The team took over the clinical response.',
            '',
            '**The outcome:** Mr. Abboud was transported with a pulse restored. Later, the nurse told Maria plainly: "He\'s alive because you didn\'t hesitate." Maria also admitted she felt shaken the rest of the day — and her supervisor made sure she had someone to talk to.',
            '',
            '**Discussion:** Notice what made the difference. Maria recognized the emergency in seconds and did not waste time second-guessing. She activated help where she stood instead of leaving. She knew her equipment location because she checked it every shift. She acted within her certification and her facility\'s direction. And afterward, she accepted support. Every one of these is something any CNA can do.',
          ].join('\n');

          return doc('Case Study', [
            { id: 'cardiac-s11-heading', type: 'heading', level: 1, text: 'Brief Case Study' },
            pendingAudio(
              'cardiac-s11-audio',
              'The Morning Maria Didn\'t Hesitate',
              `${ASSET_BASE}/s11-case-podcast.mp3`,
              caseNarrative,
              `${ASSET_BASE}/s11-case-podcast.mp3`,
            ),
            {
              id: 'cardiac-s11-image',
              type: 'image',
              src: '/assets/courses/cardiac-emergency/s11-hero.jpg',
              caption: 'A cardiac emergency handled well — calm, fast, correct.',
            },
            {
              id: 'cardiac-s11-case-study',
              type: 'case_study',
              title: 'The Morning Maria Didn\'t Hesitate',
              residentProfile:
                'CNA Maria was helping residents to breakfast when she passed Mr. Abboud\'s room and glanced in, as she always did. He was sitting in his bedside chair, head dropped to one side. Something looked wrong.',
              scenario: [
                '**The recognition (0 seconds):** Maria stepped in and called his name. No answer. She tapped his shoulder firmly and shouted, "Mr. Abboud, are you okay?" Nothing. She looked at his chest — no normal breathing, just one slow gasp. She knew instantly: this was cardiac arrest, and she did not stop to be sure.',
                '**The activation (15 seconds):** Maria pressed the emergency call button on the wall and shouted down the hall, "Code Blue, room 14, I need help now!" She did not leave the room to find the nurse — she summoned help to her.',
                '**The response (30–90 seconds):** As the nurse ran in, Maria had already moved the bedside table out of the way and was clearing space. The nurse directed her: "Get the AED." Maria knew exactly where it was — she had checked that morning, as she did every shift — and had it at the bedside in under a minute. Because Maria held current CPR certification and the nurse directed it, she began compressions while the nurse readied the AED, following her training and facility policy.',
                '**The team (2+ minutes):** The code team arrived. Maria stepped into her supporting role — guiding Mr. Abboud\'s frightened roommate to the lounge, directing the paramedics to the room, and noting the times she remembered. The team took over the clinical response.',
                '**The outcome:** Mr. Abboud was transported with a pulse restored. Later, the nurse told Maria plainly: "He\'s alive because you didn\'t hesitate." Maria also admitted she felt shaken the rest of the day — and her supervisor made sure she had someone to talk to.',
                '**Discussion:** Notice what made the difference. Maria recognized the emergency in seconds and did not waste time second-guessing. She activated help where she stood instead of leaving. She knew her equipment location because she checked it every shift. She acted within her certification and her facility\'s direction. And afterward, she accepted support. Every one of these is something any CNA can do.',
              ].join('\n\n'),
            },
            {
              id: 'cardiac-s11-reflection-1',
              type: 'reflection',
              prompt:
                'Maria pressed the call button and shouted for help instead of running to find the nurse. Why was staying and summoning help the better choice in a cardiac arrest?',
              minCharacters: 50,
            },
            {
              id: 'cardiac-s11-reflection-2',
              type: 'reflection',
              prompt:
                'Maria began compressions only because she held current certification and the nurse directed it. For a CNA whose CPR certification has lapsed, what is their essential role in this exact situation — and is it any less important?',
              minCharacters: 50,
            },
            {
              id: 'cardiac-s11-reflection-intro-text',
              type: 'text',
              body: 'Reflect on the case study in the previous lesson. Your written responses help you apply what you learned about recognition, activation, and scope.',
            },
            {
              id: 'cardiac-s11-kc2-check',
              type: 'knowledge_check',
              question:
                'Slow, occasional gasping in a collapsed, unresponsive resident means:',
              options: [
                { id: 'breathing-fine', label: 'The resident is breathing normally and is fine' },
                { id: 'cardiac-emergency', label: 'The heart has stopped — this is a cardiac emergency' },
                { id: 'sleeping', label: 'The resident is just sleeping deeply' },
                { id: 'wait', label: 'The CNA should wait and watch quietly' },
              ],
              correctOptionId: 'cardiac-emergency',
              explanation:
                'Do not mistake gasping for breathing. Gasping in a collapsed, unresponsive person means the heart has stopped — activate emergency help immediately.',
              requiredForCompletion: true,
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
            { id: 'cardiac-s12-heading', type: 'heading', level: 1, text: 'Conclusion' },
            {
              id: 'cardiac-s12-video',
              type: 'video',
              title: 'Conclusion',
              videoUrl: `${ASSET_BASE}/s12-conclusion.mp4`,
              placeholderNote: `Pending upload: ${ASSET_BASE}/s12-conclusion.mp4`,
            },
            {
              id: 'cardiac-s12-image',
              type: 'image',
              src: '/assets/courses/cardiac-emergency/s12-hero.jpg',
              caption: 'Calm, ready, within scope — that is the CNA\'s role.',
            },
            {
              id: 'cardiac-s12-narration',
              type: 'text',
              body: [
                'You\'ve reached the end. Let\'s lock in the five things that matter most.',
                '**One.** Know the two emergencies. A heart attack is a blocked vessel — the resident is usually awake, with chest pressure or pain that may spread to the arm or jaw, sweating, short of breath. Cardiac arrest is the heart stopping — the resident is collapsed, unresponsive, and not breathing normally or only gasping.',
                '**Two.** Recognize fast, and never hesitate. Tap and shout to check responsiveness. No response and no normal breathing means cardiac arrest. When in doubt, treat it as an emergency. No one is ever faulted for calling for help too quickly.',
                '**Three.** Activate help where you stand. Press the emergency button, call out, summon the code team to you — don\'t leave the resident to go find someone. Then clear space, bring the AED, and manage the environment so the team can work.',
                '**Four.** Honor your scope. You recognize, activate, and support. You do not give medications — not even the resident\'s own nitroglycerin. You do not adjust oxygen. And CPR and AED use require current hands-on certification — this online course does not certify you. If your certification has lapsed, renew it.',
                '**Five.** Take care of yourself, too. Cardiac emergencies are hard to witness. Doing your part well matters, whatever the outcome — and it\'s okay to seek support afterward.',
              ].join('\n\n'),
            },
            {
              id: 'cardiac-s12-summary',
              type: 'summary',
              title: 'Five things that matter most',
              items: [
                'Know the two emergencies — heart attack (blocked vessel, usually awake) vs. cardiac arrest (collapsed, unresponsive, not breathing normally).',
                'Recognize fast and never hesitate — when in doubt, treat it as an emergency.',
                'Activate help where you stand — press the button, call out, summon the code team to you.',
                'Honor your scope — recognize, activate, and support; CPR/AED require hands-on certification.',
                'Take care of yourself, too — seek support after witnessing a cardiac emergency.',
              ],
            },
            {
              id: 'cardiac-s12-what-happens-next-text',
              type: 'text',
              body: 'Ten questions are waiting. Everything on them was covered here. You\'re ready. Trust what you\'ve learned, and show what you know.',
            },
            {
              id: 'cardiac-s12-completion-requirements-text',
              type: 'text',
              body: 'This course provides one hour of continuing education credit through CAL ACE Nursing Academy, an approved CDPH continuing education provider, NAC number 7384. Your certificate is generated automatically when you pass the knowledge check.',
            },
            {
              id: 'cardiac-s12-completion-requirements-callout',
              type: 'callout',
              variant: 'info',
              title: 'CPR/AED certification reminder',
              body: 'CPR/AED certification: renew in person through AHA or Red Cross. This online course does not certify you.',
            },
            {
              id: 'cardiac-s12-certificate-access-text',
              type: 'text',
              body: 'Your certificate is generated automatically when you pass the knowledge check. CDPH-Approved CE Provider — NAC #7384.',
            },
          ]),
      },
    ],
  },
];

export async function seedCourse13CardiacEmergencies(
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
      courseId_versionNumber: { courseId: course.id, versionNumber: VERSION_NUMBER },
    },
    create: {
      courseId: course.id,
      versionNumber: VERSION_NUMBER,
      label: 'Cardiac emergency — image rebuild',
      status: CourseVersionStatus.DRAFT,
      deliveryMode: DeliveryMode.ONLINE,
      ceHours,
      publishedAt: null,
      contentMeta: contentMeta as Prisma.InputJsonValue,
    },
    update: {
      label: 'Cardiac emergency — image rebuild',
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
  console.log(`Seeding Course 13 (Cardiac Emergencies) as DRAFT — slug "${COURSE_SLUG}"…`);

  try {
    const result = await seedCourse13CardiacEmergencies(prisma);
    const blockCounts = blockCountsByLesson();

    console.log('Seed complete.');
    console.log(`  Course:   ${COURSE_TITLE}`);
    console.log(`  Slug:     ${COURSE_SLUG}`);
    console.log(`  Version:  v${VERSION_NUMBER}`);
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
