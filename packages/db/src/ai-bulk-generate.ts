/**
 * Bulk AI course generation — mirrors CMS `CmsAiGenerationService` persistence
 * without NestJS. Used by `prisma/seed-ai-bulk-courses.ts`.
 */
import {
  buildQualityChecklist,
  computeBlueprintPacing,
  DEFAULT_ECOSYSTEM_HOOKS,
  DEFAULT_QUALITY_FRAMEWORK,
  ONE_HOUR_CNA_CEU_BLUEPRINT,
  STANDARD_COMPLETION_ROADMAP,
  STANDARD_FINAL_EXAM_BLUEPRINT,
  STANDARD_LEARNING_MILESTONES,
} from '@calace/content-blocks';
import {
  getAiCourseProvider,
  type CourseGenerationPlan,
  type GenerateCourseInput,
} from '@calace/ai-course-generation';
import {
  AssessmentKind,
  ContentPublishStatus,
  CourseStatus,
  CourseVersionStatus,
  Prisma,
  type PrismaClient,
  QuestionType,
} from '@prisma/client';

import { DEFAULT_LAUNCH_CEU_HOURS } from './ceu-defaults';
import { mergeLaunchCatalogData } from './launch-catalog';

const DEFAULT_CATALOG = {
  price: 3.75,
  durationMinutes: 60,
  difficulty: 'beginner',
  instructor: 'CAL ACE Faculty',
  featured: false,
  hasFreePreview: false,
  subscriptionEligible: true,
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function buildContentMeta(plan: CourseGenerationPlan, ceHours: number) {
  const pacing = computeBlueprintPacing(ONE_HOUR_CNA_CEU_BLUEPRINT);
  return {
    overview: plan.overview,
    learningObjectives: plan.learningObjectives,
    faq: [],
    compliance: {
      cdphApprovalStatus: 'placeholder' as const,
      targetAudience: plan.generation.input.targetAudience ?? 'California CNAs',
      onlineDeliveryDesignation: 'online' as const,
      requiredSeatTimeMinutes: ONE_HOUR_CNA_CEU_BLUEPRINT.targetActiveParticipationMinutes,
      regulatoryNotes:
        'AI-generated draft — CDPH/compliance metadata must be verified by instructor before publish.',
    },
    imageAccent: 'teal',
    versioning: { immutableAfterPublish: true },
    blueprint: {
      blueprintId: plan.blueprintId,
      blueprintVersion: plan.blueprintVersion,
      appliedAt: plan.generation.generatedAt,
      targetActiveParticipationMinutes: ONE_HOUR_CNA_CEU_BLUEPRINT.targetActiveParticipationMinutes,
      pacing: {
        estimatedActiveMinutes: pacing.estimatedActiveMinutes,
        weightedParticipationMinutes: pacing.weightedParticipationMinutes,
        valid: pacing.valid,
        warnings: pacing.warnings,
      },
    },
    aiGeneration: plan.generation,
    aiSafetyReview: plan.safetyReview,
    mediaPrompts: plan.mediaPrompts,
    learningExperience: {
      tone: 'professional_healthcare' as const,
      milestones: STANDARD_LEARNING_MILESTONES,
      completionRoadmap: STANDARD_COMPLETION_ROADMAP,
    },
    qualityFramework: DEFAULT_QUALITY_FRAMEWORK,
    ecosystemHooks: DEFAULT_ECOSYSTEM_HOOKS,
    examBlueprint: {
      examBlueprintId: STANDARD_FINAL_EXAM_BLUEPRINT.id,
      targetBankSize: plan.exam.targetBankSize,
      maxAttempts: plan.exam.maxAttempts,
      passingScore: plan.exam.passingScore,
      messaging: plan.exam.messaging,
    },
    qualityChecklist: buildQualityChecklist(DEFAULT_QUALITY_FRAMEWORK),
    ceHours,
  };
}

/** Hard-delete version content so unique (courseVersionId, slug) slots are freed for re-seed. */
async function clearCourseVersionStructure(prisma: PrismaClient, versionId: string) {
  await prisma.$transaction([
    prisma.assessment.deleteMany({ where: { courseVersionId: versionId } }),
    prisma.module.deleteMany({ where: { courseVersionId: versionId } }),
  ]);
}

async function persistPlanStructure(
  prisma: PrismaClient,
  versionId: string,
  plan: CourseGenerationPlan,
  options?: { replaceExisting?: boolean },
) {
  if (options?.replaceExisting) {
    await clearCourseVersionStructure(prisma, versionId);
  }

  const moduleOrder = new Map<string, number>();
  const lessonOrder = new Map<string, number>();

  for (const lesson of plan.lessons) {
    if (!moduleOrder.has(lesson.moduleSlug)) {
      moduleOrder.set(lesson.moduleSlug, moduleOrder.size);
      lessonOrder.set(lesson.moduleSlug, 0);
      await prisma.module.create({
        data: {
          courseVersionId: versionId,
          slug: lesson.moduleSlug,
          title: lesson.moduleTitle,
          sortOrder: moduleOrder.get(lesson.moduleSlug)!,
          status: ContentPublishStatus.DRAFT,
          metadata: { aiGenerated: true } as Prisma.InputJsonValue,
        },
      });
    }
  }

  const modules = await prisma.module.findMany({
    where: { courseVersionId: versionId, deletedAt: null },
  });
  const modBySlug = new Map(modules.map((m) => [m.slug, m]));

  for (const lesson of plan.lessons) {
    const mod = modBySlug.get(lesson.moduleSlug);
    if (!mod) continue;
    const order = lessonOrder.get(lesson.moduleSlug) ?? 0;
    lessonOrder.set(lesson.moduleSlug, order + 1);
    await prisma.lesson.create({
      data: {
        moduleId: mod.id,
        slug: lesson.slug,
        title: lesson.title,
        description: lesson.sectionKind,
        sortOrder: order,
        status: ContentPublishStatus.DRAFT,
        durationMinutes: lesson.estimatedActiveMinutes,
        content: lesson.document as Prisma.InputJsonValue,
      },
    });
  }
}

async function persistExam(prisma: PrismaClient, versionId: string, plan: CourseGenerationPlan) {
  const assessment = await prisma.assessment.create({
    data: {
      courseVersionId: versionId,
      slug: plan.exam.slug,
      title: plan.exam.title,
      kind: AssessmentKind.FINAL_EXAM,
      passingScore: plan.exam.passingScore,
      maxAttempts: plan.exam.maxAttempts,
      settings: plan.exam.settings as Prisma.InputJsonValue,
    },
  });

  for (const q of plan.exam.questions) {
    await prisma.question.create({
      data: {
        assessmentId: assessment.id,
        sortOrder: q.sortOrder,
        type: q.type as QuestionType,
        prompt: q.prompt,
        options: q.options as Prisma.InputJsonValue,
        correctAnswer: q.correctAnswer as Prisma.InputJsonValue,
        explanation: q.explanation,
        metadata: (q.metadata ?? { aiGenerated: true }) as Prisma.InputJsonValue,
      },
    });
  }
}

export type BulkAiGenerateOptions = {
  tenantSlug?: string;
  categorySlug?: string;
  professionCode?: string;
  /** Skip courses that already have AI-generated modules */
  skipExistingAiStructure?: boolean;
  /** Replace scaffold-only versions (module-1 / lesson-1 only) */
  replaceScaffoldOnly?: boolean;
  dryRun?: boolean;
};

export type BulkAiGenerateEntry = {
  slug?: string;
  title: string;
  summary?: string;
  courseCode?: string;
  californiaRelevance?: string;
  toneFocus?: string;
};

export type BulkAiGenerateResult = {
  generated: number;
  skipped: number;
  errors: { slug: string; message: string }[];
};

export async function bulkGenerateAiCourses(
  prisma: PrismaClient,
  entries: BulkAiGenerateEntry[],
  options: BulkAiGenerateOptions = {},
): Promise<BulkAiGenerateResult> {
  const tenantSlug = options.tenantSlug ?? 'cal-ace';
  const categorySlug = options.categorySlug ?? 'professional-development';
  const professionCode = options.professionCode ?? 'CNA';
  const provider = getAiCourseProvider();
  const ceHours = DEFAULT_LAUNCH_CEU_HOURS;

  const tenant = await prisma.tenant.findFirst({
    where: { slug: tenantSlug, deletedAt: null },
  });
  if (!tenant) throw new Error(`Tenant "${tenantSlug}" not found.`);

  const category = await prisma.courseCategory.findFirst({
    where: { tenantId: tenant.id, slug: categorySlug, deletedAt: null },
  });

  const profession = await prisma.profession.findFirst({
    where: { code: professionCode },
  });

  let generated = 0;
  let skipped = 0;
  const errors: BulkAiGenerateResult['errors'] = [];

  for (const entry of entries) {
    const slug = entry.slug?.trim() || slugify(entry.title);
    try {
      const existing = await prisma.course.findFirst({
        where: { tenantId: tenant.id, slug, deletedAt: null },
        include: {
          versions: {
            where: { deletedAt: null },
            orderBy: { versionNumber: 'desc' },
            take: 1,
            include: {
              modules: {
                where: { deletedAt: null },
                include: { lessons: { where: { deletedAt: null } } },
              },
            },
          },
        },
      });

      if (existing && options.skipExistingAiStructure) {
        const version = existing.versions[0];
        const hasAiModules = version?.modules.some((m) => m.slug !== 'module-1');
        if (hasAiModules) {
          skipped += 1;
          continue;
        }
      }

      const input: GenerateCourseInput = {
        title: entry.title,
        slug,
        courseCode: entry.courseCode,
        shortDescription: entry.summary,
        targetAudience: 'California Certified Nursing Assistants (CNAs)',
        ceHours,
        stateJurisdiction: 'California',
        profession: professionCode,
        californiaRelevance:
          entry.californiaRelevance ??
          'Skilled nursing facility practice; Title 22; CDPH Online CE delivery.',
        toneFocus: entry.toneFocus ?? 'person-centered, scope-safe CNA care',
      };

      if (options.dryRun) {
        await provider.generateCourse(input);
        generated += 1;
        continue;
      }

      const { plan } = await provider.generateCourse(input);
      const catalog = mergeLaunchCatalogData({ ...DEFAULT_CATALOG }, ceHours) as Record<
        string,
        unknown
      >;
      if (entry.courseCode?.trim()) catalog.courseCode = entry.courseCode.trim();
      if (plan.mediaPrompts.courseThumbnail?.prompt) {
        catalog.thumbnailGenerationPrompt = plan.mediaPrompts.courseThumbnail.prompt;
      }

      const contentMeta = buildContentMeta(plan, ceHours);

      if (existing && options.replaceScaffoldOnly) {
        const version = existing.versions[0];
        if (version) {
          await prisma.courseVersion.update({
            where: { id: version.id },
            data: {
              label: 'Draft 1 (AI Generated)',
              status: CourseVersionStatus.DRAFT,
              contentMeta: contentMeta as Prisma.InputJsonValue,
            },
          });
          await prisma.course.update({
            where: { id: existing.id },
            data: {
              title: entry.title,
              summary: plan.summary,
              status: CourseStatus.DRAFT,
              catalogData: catalog as Prisma.InputJsonValue,
            },
          });
          await persistPlanStructure(prisma, version.id, plan, { replaceExisting: true });
          await persistExam(prisma, version.id, plan);
          generated += 1;
          continue;
        }
      }

      if (existing) {
        skipped += 1;
        continue;
      }

      const course = await prisma.course.create({
        data: {
          tenantId: tenant.id,
          professionId: profession?.id,
          categoryId: category?.id,
          slug,
          title: entry.title,
          summary: plan.summary,
          status: CourseStatus.DRAFT,
          ceHours,
          catalogData: catalog as Prisma.InputJsonValue,
        },
      });

      const version = await prisma.courseVersion.create({
        data: {
          courseId: course.id,
          versionNumber: 1,
          label: 'Draft 1 (AI Generated)',
          status: CourseVersionStatus.DRAFT,
          ceHours,
          contentMeta: contentMeta as Prisma.InputJsonValue,
        },
      });

      await persistPlanStructure(prisma, version.id, plan);
      await persistExam(prisma, version.id, plan);
      generated += 1;
    } catch (err) {
      errors.push({
        slug,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { generated, skipped, errors };
}
