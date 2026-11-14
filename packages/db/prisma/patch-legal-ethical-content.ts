/**
 * Seed the 6-module multimedia-heavy, gamified content blueprint for
 * Legal & Ethical Issues in Nursing Practice — the universal course template
 * for all future CAL ACE CNA CEU courses.
 *
 * Template anchors (standard flow: Intro → Native MP4 Video → Interactive):
 * - Native MP4 videos (modules 1, 3, 4, 5, 6)
 * - Gamified blocks: trivia_card (m2), true_false_challenge (m3, m4), arrange (m5), matching (m6)
 *
 * Idempotent: upserts modules/lessons by slug; soft-deletes legacy content outside blueprint.
 * Run: pnpm --filter @calace/db db:patch-legal-ethical-content
 */
import { LESSON_CONTENT_SCHEMA_VERSION, type LessonContentDocument, validateStandardLessonFlow } from '@calace/content-blocks';
import { ContentPublishStatus, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const COURSE_SLUG = 'legal-ethical-nursing-practice';

/** Dev/test native MP4 — replace with production assets when available. */
const PLACEHOLDER_VIDEO_URL =
  'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

type ModuleBlueprint = {
  slug: string;
  title: string;
  lessonSlug: string;
  lessonTitle: string;
  durationMinutes: number;
  buildContent: () => LessonContentDocument;
};

const MODULE_BLUEPRINT: ModuleBlueprint[] = [
  {
    slug: 'intro-overview',
    title: 'Introduction & Overview',
    lessonSlug: 'introduction-overview',
    lessonTitle: 'Introduction & Overview',
    durationMinutes: 8,
    buildContent: () => ({
      schemaVersion: LESSON_CONTENT_SCHEMA_VERSION,
      title: 'Introduction & Overview',
      generation: { source: 'human' },
      blocks: [
        { id: 'm1-heading', type: 'heading', level: 1, text: 'Introduction & Overview' },
        {
          id: 'm1-intro-text',
          type: 'text',
          body:
            'Legal and ethical responsibilities shape every CNA shift in California long-term care. This course prepares you to recognize scope limits, protect resident rights, maintain confidentiality, report abuse, and uphold professional boundaries — competencies commonly required for CNA renewal and in-service compliance.',
        },
        {
          id: 'm1-callout',
          type: 'callout',
          variant: 'info',
          title: 'What you will learn',
          body:
            'Six focused modules cover definitions, consent, HIPAA, mandatory reporting, and safe professional boundaries. Complete each interactive section before attempting the 10-question final exam.',
        },
        {
          id: 'm1-video',
          type: 'video',
          title: 'Introduction & Overview video',
          durationLabel: '~4 min',
          videoUrl: PLACEHOLDER_VIDEO_URL,
          placeholderNote:
            'Module 1 overview video — production asset pending. Placeholder path: /media/legal-ethical/m1-intro-overview.mp4',
          requiredForCompletion: true,
          accessibility: {
            ariaLabel: 'Introduction and overview video',
            captionsPlaceholder: 'Captions will be provided for the final video.',
            transcriptPlaceholder: 'Full transcript will accompany the final video.',
          },
        },
        {
          id: 'm1-trivia',
          type: 'trivia_card',
          title: 'Did You Know? CE Completion',
          body:
            'California CNAs must complete 48 hours of continuing education or in-service training during each renewal period — this course counts toward that requirement when completed with active participation and a passing exam score.',
          placeholderNote:
            'Did-You-Know trivia card — learners reveal the fact and tap Got it to earn participation credit.',
          requiredForCompletion: true,
          accessibility: { ariaLabel: 'Did you know trivia card about CNA CE requirements' },
        },
      ],
    }),
  },
  {
    slug: 'terms-definitions',
    title: 'Terms and Definitions Used',
    lessonSlug: 'terms-and-definitions',
    lessonTitle: 'Terms and Definitions Used',
    durationMinutes: 8,
    buildContent: () => ({
      schemaVersion: LESSON_CONTENT_SCHEMA_VERSION,
      title: 'Terms and Definitions Used',
      generation: { source: 'human' },
      blocks: [
        { id: 'm2-heading', type: 'heading', level: 1, text: 'Terms and Definitions Used' },
        {
          id: 'm2-text',
          type: 'text',
          body:
            'Clear vocabulary prevents costly mistakes. Key terms in this course include **scope of practice** (tasks you are certified and authorized to perform), **informed consent** (a resident understands and agrees to care), **mandatory reporter** (a caregiver legally required to report suspected abuse), **HIPAA** (federal rules protecting health information), and **professional boundaries** (limits that keep care objective and safe).',
        },
        {
          id: 'm2-reveal-1',
          type: 'reveal_card',
          frontTitle: 'Neglect',
          frontBody: 'Tap to reveal the definition used in California facilities.',
          backTitle: 'Neglect',
          backBody:
            'Failure to provide goods or services necessary to avoid physical harm, mental anguish, or mental illness — including withholding hygiene, nutrition, or safety measures.',
        },
        {
          id: 'm2-reveal-2',
          type: 'reveal_card',
          frontTitle: 'Abuse',
          frontBody: 'Tap to reveal the definition used in California facilities.',
          backTitle: 'Abuse',
          backBody:
            'Intentional infliction of physical or mental harm, sexual assault, financial exploitation, or treatment with cruel and unusual punishment.',
        },
        {
          id: 'm2-trivia',
          type: 'trivia_card',
          title: 'Did You Know? The Cost of Silence',
          body:
            'Failure to report suspected elder abuse is a misdemeanor in California, punishable by up to 6 months in jail and a fine of up to $1,000.',
          placeholderNote:
            'Did-You-Know trivia card — learners reveal the fact and tap Got it to earn participation credit.',
          accessibility: { ariaLabel: 'Did you know trivia card about mandatory reporting penalties' },
        },
        {
          id: 'm2-matching',
          type: 'matching',
          instructions: 'Match each legal/ethical term to its correct definition.',
          placeholderNote:
            'Interactive matching game — production build pending. Learners will pair terms such as HIPAA, informed consent, and mandatory reporter with definitions.',
          requiredForCompletion: true,
          accessibility: { ariaLabel: 'Terms and definitions matching activity' },
        },
      ],
    }),
  },
  {
    slug: 'patient-rights-consent',
    title: 'Patient Rights and Consent',
    lessonSlug: 'patient-rights-and-consent',
    lessonTitle: 'Patient Rights and Consent',
    durationMinutes: 10,
    buildContent: () => ({
      schemaVersion: LESSON_CONTENT_SCHEMA_VERSION,
      title: 'Patient Rights and Consent',
      generation: { source: 'human' },
      blocks: [
        { id: 'm3-heading', type: 'heading', level: 1, text: 'Patient Rights and Consent' },
        {
          id: 'm3-text',
          type: 'text',
          body:
            'California residents have the right to participate in care decisions, refuse treatment, privacy, dignity, and freedom from abuse. CNAs support these rights by honoring preferences, protecting modesty, and notifying the nurse when a resident seems unable to understand or agree to care. Obtaining informed consent for medical treatment is outside CNA scope — your role is to recognize concerns and escalate promptly.',
        },
        {
          id: 'm3-video',
          type: 'video',
          title: 'Patient Rights in Practice — Scenario Video',
          durationLabel: '~4 min',
          videoUrl: PLACEHOLDER_VIDEO_URL,
          placeholderNote:
            'Module 3 patient rights scenario video — production asset pending. Placeholder path: /media/legal-ethical/m3-patient-rights-scenario.mp4',
          requiredForCompletion: true,
          accessibility: {
            ariaLabel: 'Patient rights scenario video',
            captionsPlaceholder: 'Captions will be provided for the final video.',
            transcriptPlaceholder: 'Full transcript will accompany the final video.',
          },
        },
        {
          id: 'm3-tf-challenge',
          type: 'true_false_challenge',
          prompt:
            'A resident with dementia who is confused no longer has the right to refuse morning care.',
          correctAnswer: 'false',
          explanation:
            'Even residents with cognitive impairment retain the right to refuse care. The CNA must respect this, pause care, and report the refusal to the nurse to explore alternative approaches.',
          placeholderNote: 'True or False challenge — select the correct answer to continue.',
          requiredForCompletion: true,
          accessibility: { ariaLabel: 'True or false challenge on right to refuse care' },
        },
      ],
    }),
  },
  {
    slug: 'hipaa-confidentiality',
    title: 'HIPAA and Patient Confidentiality',
    lessonSlug: 'hipaa-and-confidentiality',
    lessonTitle: 'HIPAA and Patient Confidentiality',
    durationMinutes: 10,
    buildContent: () => ({
      schemaVersion: LESSON_CONTENT_SCHEMA_VERSION,
      title: 'HIPAA and Patient Confidentiality',
      generation: { source: 'human' },
      blocks: [
        { id: 'm4-heading', type: 'heading', level: 1, text: 'HIPAA and Patient Confidentiality' },
        {
          id: 'm4-text',
          type: 'text',
          body:
            'The Health Insurance Portability and Accountability Act (HIPAA) requires safeguarding protected health information (PHI). CNAs encounter PHI in care plans, charts, conversations, and identifiers on wristbands or room signs. Share information only with authorized care team members for treatment, payment, or operations — never in hallways, elevators, or on personal devices.',
        },
        {
          id: 'm4-video',
          type: 'video',
          title: 'HIPAA in Daily CNA Practice',
          durationLabel: '~4 min',
          videoUrl: PLACEHOLDER_VIDEO_URL,
          placeholderNote:
            'Module 4 HIPAA scenario video — production asset pending. Placeholder path: /media/legal-ethical/m4-hipaa-confidentiality.mp4',
          requiredForCompletion: true,
          accessibility: {
            ariaLabel: 'HIPAA and confidentiality scenario video',
            captionsPlaceholder: 'Captions will be provided for the final video.',
            transcriptPlaceholder: 'Full transcript will accompany the final video.',
          },
        },
        {
          id: 'm4-tf-challenge',
          type: 'true_false_challenge',
          prompt:
            'A visitor in the elevator asks about a resident\'s condition. You may share a general update if you avoid using the resident\'s name.',
          correctAnswer: 'false',
          explanation:
            'Even without a name, confirming a condition in a public area can identify the resident and violates HIPAA. Decline to share PHI and direct the visitor to the nurse or front desk.',
          placeholderNote: 'True or False challenge — select the correct answer to continue.',
          requiredForCompletion: true,
          accessibility: { ariaLabel: 'True or false challenge on HIPAA confidentiality' },
        },
      ],
    }),
  },
  {
    slug: 'reporting-abuse',
    title: 'Recognizing and Reporting Abuse',
    lessonSlug: 'recognizing-and-reporting-abuse',
    lessonTitle: 'Recognizing and Reporting Abuse',
    durationMinutes: 9,
    buildContent: () => ({
      schemaVersion: LESSON_CONTENT_SCHEMA_VERSION,
      title: 'Recognizing and Reporting Abuse',
      generation: { source: 'human' },
      blocks: [
        { id: 'm5-heading', type: 'heading', level: 1, text: 'Recognizing and Reporting Abuse' },
        {
          id: 'm5-text',
          type: 'text',
          body:
            'CNAs are mandatory reporters in California. Warning signs include unexplained bruises, fear of specific caregivers, sudden withdrawal, poor hygiene, dehydration, or financial changes. You do not need proof before reporting — report reasonable suspicion through facility policy immediately. Document objective observations only: what you saw, heard, or measured.',
        },
        {
          id: 'm5-video',
          type: 'video',
          title: 'Reporting Abuse — Summary Video',
          durationLabel: '~3 min',
          videoUrl: PLACEHOLDER_VIDEO_URL,
          placeholderNote:
            'Module 5 reporting abuse summary video — production asset pending. Placeholder path: /media/legal-ethical/m5-reporting-abuse-summary.mp4',
          requiredForCompletion: true,
          accessibility: {
            ariaLabel: 'Reporting abuse summary video',
            captionsPlaceholder: 'Captions will be provided for the final video.',
            transcriptPlaceholder: 'Full transcript will accompany the final video.',
          },
        },
        {
          id: 'm5-arrange',
          type: 'arrange',
          question:
            'Arrange the exact sequence of steps a CNA must take when they suspect elder abuse.',
          items: [
            {
              id: 'abuse-step-document',
              text: 'Document objective observations in the chart',
            },
            {
              id: 'abuse-step-safety',
              text: "Ensure the resident's immediate safety",
            },
            {
              id: 'abuse-step-cooperate',
              text: "Cooperate with the facility's official reporting agency",
            },
            {
              id: 'abuse-step-notify',
              text: 'Notify the charge nurse immediately',
            },
          ],
          correctOrder: [
            'abuse-step-safety',
            'abuse-step-notify',
            'abuse-step-document',
            'abuse-step-cooperate',
          ],
          explanation:
            'Safety comes first, then immediate notification to the charge nurse. Document only objective facts you observed, and cooperate fully with the facility\'s designated reporting process.',
          requiredForCompletion: true,
          accessibility: { ariaLabel: 'Reporting abuse steps word arrangement game' },
        },
      ],
    }),
  },
  {
    slug: 'professional-boundaries',
    title: 'Professional Boundaries & Care Delivery',
    lessonSlug: 'professional-boundaries-care',
    lessonTitle: 'Professional Boundaries & Care Delivery',
    durationMinutes: 9,
    buildContent: () => ({
      schemaVersion: LESSON_CONTENT_SCHEMA_VERSION,
      title: 'Professional Boundaries & Care Delivery',
      generation: { source: 'human' },
      blocks: [
        { id: 'm6-heading', type: 'heading', level: 1, text: 'Professional Boundaries & Care Delivery' },
        {
          id: 'm6-text',
          type: 'text',
          body:
            'Professional boundaries keep care safe and objective. Avoid accepting large gifts, sharing personal contact information, performing tasks outside your certification, or discussing residents on social media. Objective documentation — date, time, and factual observations — supports the care team and protects your license.',
        },
        {
          id: 'm6-video',
          type: 'video',
          title: 'Professional Boundaries — Summary Video',
          durationLabel: '~3 min',
          videoUrl: PLACEHOLDER_VIDEO_URL,
          placeholderNote:
            'Module 6 professional boundaries summary video — production asset pending. Placeholder path: /media/legal-ethical/m6-professional-boundaries.mp4',
          requiredForCompletion: true,
          accessibility: {
            ariaLabel: 'Professional boundaries summary video',
            captionsPlaceholder: 'Captions will be provided for the final video.',
            transcriptPlaceholder: 'Full transcript will accompany the final video.',
          },
        },
        {
          id: 'm6-matching',
          type: 'matching',
          instructions: 'Match each boundary concern to the appropriate CNA response.',
          placeholderNote:
            'Interactive matching game — production build pending. Learners will pair situations (gifts, social media, scope questions) with safe responses.',
          requiredForCompletion: true,
          accessibility: { ariaLabel: 'Professional boundaries matching activity' },
        },
      ],
    }),
  },
];

const BLUEPRINT_MODULE_SLUGS = new Set(MODULE_BLUEPRINT.map((m) => m.slug));
const BLUEPRINT_LESSON_SLUGS = new Set(MODULE_BLUEPRINT.map((m) => m.lessonSlug));

async function retireLegacyContent(courseVersionId: string) {
  const legacyModules = await prisma.module.findMany({
    where: { courseVersionId, deletedAt: null },
    include: { lessons: { where: { deletedAt: null } } },
  });

  const now = new Date();

  for (const mod of legacyModules) {
    const keepModule = BLUEPRINT_MODULE_SLUGS.has(mod.slug);

    for (const lesson of mod.lessons) {
      if (!BLUEPRINT_LESSON_SLUGS.has(lesson.slug)) {
        await prisma.lesson.update({
          where: { id: lesson.id },
          data: { deletedAt: now },
        });
      }
    }

    if (!keepModule) {
      await prisma.module.update({
        where: { id: mod.id },
        data: { deletedAt: now },
      });
    }
  }
}

async function seedModules(courseVersionId: string) {
  let modulesUpserted = 0;
  let lessonsUpserted = 0;

  for (let i = 0; i < MODULE_BLUEPRINT.length; i++) {
    const blueprint = MODULE_BLUEPRINT[i]!;
    const content = blueprint.buildContent();

    const formatCheck = validateStandardLessonFlow(content);
    if (!formatCheck.valid) {
      throw new Error(
        `Blueprint "${blueprint.slug}" failed curriculum validation: ${formatCheck.errors.join(' ')}`,
      );
    }

    const module = await prisma.module.upsert({
      where: {
        courseVersionId_slug: { courseVersionId, slug: blueprint.slug },
      },
      create: {
        courseVersionId,
        slug: blueprint.slug,
        title: blueprint.title,
        sortOrder: i,
        status: ContentPublishStatus.PUBLISHED,
      },
      update: {
        title: blueprint.title,
        sortOrder: i,
        status: ContentPublishStatus.PUBLISHED,
        deletedAt: null,
      },
    });

    await prisma.lesson.upsert({
      where: {
        moduleId_slug: { moduleId: module.id, slug: blueprint.lessonSlug },
      },
      create: {
        moduleId: module.id,
        slug: blueprint.lessonSlug,
        title: blueprint.lessonTitle,
        sortOrder: 0,
        status: ContentPublishStatus.PUBLISHED,
        durationMinutes: blueprint.durationMinutes,
        content: content as unknown as object,
      },
      update: {
        title: blueprint.lessonTitle,
        sortOrder: 0,
        status: ContentPublishStatus.PUBLISHED,
        durationMinutes: blueprint.durationMinutes,
        content: content as unknown as object,
        deletedAt: null,
      },
    });

    modulesUpserted += 1;
    lessonsUpserted += 1;
  }

  return { modulesUpserted, lessonsUpserted };
}

async function main() {
  const course = await prisma.course.findFirst({
    where: { slug: COURSE_SLUG, deletedAt: null },
    select: { id: true, title: true },
  });

  if (!course) {
    console.error(`Course not found: ${COURSE_SLUG}`);
    process.exit(1);
  }

  const version = await prisma.courseVersion.findFirst({
    where: { courseId: course.id, versionNumber: 1, deletedAt: null },
    select: { id: true },
  });

  if (!version) {
    console.error(`Published course version not found for: ${COURSE_SLUG}`);
    process.exit(1);
  }

  await retireLegacyContent(version.id);
  const { modulesUpserted, lessonsUpserted } = await seedModules(version.id);

  console.log(`Success: seeded content blueprint for "${course.title}" (${COURSE_SLUG}).`);
  console.log(`  Modules: ${modulesUpserted}`);
  console.log(`  Lessons: ${lessonsUpserted}`);
  for (const mod of MODULE_BLUEPRINT) {
    console.log(`    - ${mod.title} → ${mod.lessonSlug}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
