import { BadRequestException, Injectable } from '@nestjs/common';
import {
  getAiCourseProvider,
  type CourseGenerationPlan,
  type GenerateCourseInput,
} from '@calace/ai-course-generation';
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
  AssessmentKind,
  AuditAction,
  ContentPublishStatus,
  CourseStatus,
  CourseVersionStatus,
  Prisma,
  QuestionType,
} from '@calace/db';

import { AuditService } from '../audit/audit.service';
import { DEFAULT_LAUNCH_CEU_HOURS } from '../config/ceu-defaults';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../auth/types/auth-user.type';
import { CmsBaseService } from './cms-base.service';
import type { GenerateCourseDto } from './dto/generate-course.dto';
import type { CmsCatalogData, CmsCourseContentMeta } from './types/cms-metadata.types';

function mergeLaunchCatalogData(catalogData: CmsCatalogData, ceHours: number): CmsCatalogData {
  if (ceHours !== DEFAULT_LAUNCH_CEU_HOURS) return { ...catalogData };
  return { ...catalogData, durationMinutes: 60, displayDuration: '1h' };
}

const DEFAULT_CATALOG: CmsCatalogData = {
  price: 3.75,
  durationMinutes: 60,
  difficulty: 'beginner',
  instructor: 'CAL ACE Faculty',
  featured: false,
  hasFreePreview: false,
  subscriptionEligible: true,
};

function defaultProviderId(): 'mock' | 'anthropic' {
  return process.env.ANTHROPIC_API_KEY ? 'anthropic' : 'mock';
}

export type CourseFactoryResult = {
  courseSlug: string;
  courseId: string;
  courseVersionId: string;
  moduleCount: number;
  lessonCount: number;
};

@Injectable()
export class CourseFactoryService extends CmsBaseService {
  constructor(
    prisma: PrismaService,
    private readonly audit: AuditService,
  ) {
    super(prisma);
  }

  async generateCourse(dto: GenerateCourseDto, user: AuthUser): Promise<CourseFactoryResult> {
    try {
      return await this.generateCourseInternal(dto, user.userId);
    } catch (err) {
      if (err instanceof Error && err.message.includes('PHI')) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }
  }

  private mapDtoToInput(dto: GenerateCourseDto, slug: string): GenerateCourseInput {
    return {
      title: dto.courseTitle.trim(),
      slug,
      shortDescription: dto.topicDescription.trim(),
      targetAudience: dto.targetAudience?.trim(),
      ceHours: dto.ceHours,
      californiaRelevance: dto.regulatoryContext?.trim(),
      stateJurisdiction: 'California',
      profession: 'CNA',
    };
  }

  private async resolveUniqueSlug(tenantId: string, baseSlug: string): Promise<string> {
    let candidate = baseSlug;
    let suffix = 2;
    while (
      await this.prisma.course.findFirst({
        where: { tenantId, slug: candidate, deletedAt: null },
      })
    ) {
      candidate = `${baseSlug}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  private buildContentMetaFromPlan(plan: CourseGenerationPlan, ceHours: number): CmsCourseContentMeta {
    const pacing = computeBlueprintPacing(ONE_HOUR_CNA_CEU_BLUEPRINT);
    return this.mergeComplianceSeatTime(
      {
        overview: plan.overview,
        learningObjectives: plan.learningObjectives,
        faq: [],
        compliance: {
          cdphApprovalStatus: 'placeholder',
          targetAudience: plan.generation.input.targetAudience ?? 'California CNAs',
          onlineDeliveryDesignation: 'online',
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
          targetActiveParticipationMinutes:
            ONE_HOUR_CNA_CEU_BLUEPRINT.targetActiveParticipationMinutes,
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
          tone: 'professional_healthcare',
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
      },
      ceHours,
    );
  }

  private async generateCourseInternal(
    dto: GenerateCourseDto,
    actorUserId: string,
  ): Promise<CourseFactoryResult> {
    const tenantId = await this.getTenantId();
    const baseSlug = this.slugify(dto.courseTitle);
    const slug = await this.resolveUniqueSlug(tenantId, baseSlug);
    const input = this.mapDtoToInput(dto, slug);

    const providerId = dto.providerId ?? defaultProviderId();
    const provider = getAiCourseProvider(providerId);
    const { plan } = await provider.generateCourse(input);
    plan.generation.generatedByUserId = actorUserId;

    const profession = await this.prisma.profession.findFirst({
      where: { code: 'CNA' },
    });
    const ceHours = dto.ceHours ?? ONE_HOUR_CNA_CEU_BLUEPRINT.targetCeHours;
    const catalog = mergeLaunchCatalogData({ ...DEFAULT_CATALOG }, ceHours);
    if (plan.mediaPrompts.courseThumbnail?.prompt) {
      (catalog as Record<string, unknown>).thumbnailGenerationPrompt =
        plan.mediaPrompts.courseThumbnail.prompt;
    }

    const contentMeta = this.buildContentMetaFromPlan(plan, ceHours);
    const moduleSlugs = new Set(plan.lessons.map((l) => l.moduleSlug));

    const { courseId, courseVersionId } = await this.prisma.$transaction(
      async (tx) => {
        const course = await tx.course.create({
          data: {
            tenantId,
            professionId: profession?.id,
            slug,
            title: dto.courseTitle.trim(),
            summary: plan.summary,
            status: CourseStatus.DRAFT,
            ceHours,
            catalogData: catalog as Prisma.InputJsonValue,
          },
        });

        const version = await tx.courseVersion.create({
          data: {
            courseId: course.id,
            versionNumber: 1,
            label: 'Draft 1 (AI Generated)',
            status: CourseVersionStatus.DRAFT,
            ceHours,
            contentMeta: contentMeta as Prisma.InputJsonValue,
          },
        });

        await this.persistPlanStructureTx(tx, version.id, plan);
        await this.persistExamTx(tx, version.id, plan);

        return { courseId: course.id, courseVersionId: version.id };
      },
      { maxWait: 10_000, timeout: 120_000 },
    );

    await this.audit.log({
      tenantId,
      actorId: actorUserId,
      action: AuditAction.CREATE,
      entityType: 'course',
      entityId: courseId,
      metadata: {
        event: 'ai_course_factory',
        providerId,
        promptVersion: plan.generation.promptVersion,
        model: plan.generation.model,
        lessonCount: plan.lessons.length,
        questionCount: plan.exam.questions.length,
      },
    });

    return {
      courseSlug: slug,
      courseId,
      courseVersionId,
      moduleCount: moduleSlugs.size,
      lessonCount: plan.lessons.length,
    };
  }

  private async persistPlanStructureTx(
    tx: Prisma.TransactionClient,
    versionId: string,
    plan: CourseGenerationPlan,
  ) {
    const modBySlug = new Map<string, { id: string }>();
    const lessonOrder = new Map<string, number>();

    for (const lesson of plan.lessons) {
      if (!modBySlug.has(lesson.moduleSlug)) {
        const mod = await tx.module.create({
          data: {
            courseVersionId: versionId,
            slug: lesson.moduleSlug,
            title: lesson.moduleTitle,
            sortOrder: modBySlug.size,
            status: ContentPublishStatus.DRAFT,
            metadata: { aiGenerated: true } as Prisma.InputJsonValue,
          },
        });
        modBySlug.set(lesson.moduleSlug, mod);
        lessonOrder.set(lesson.moduleSlug, 0);
      }

      const mod = modBySlug.get(lesson.moduleSlug)!;
      const order = lessonOrder.get(lesson.moduleSlug) ?? 0;
      lessonOrder.set(lesson.moduleSlug, order + 1);

      await tx.lesson.create({
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

  private async persistExamTx(
    tx: Prisma.TransactionClient,
    versionId: string,
    plan: CourseGenerationPlan,
  ) {
    const assessment = await tx.assessment.create({
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
      await tx.question.create({
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
}
