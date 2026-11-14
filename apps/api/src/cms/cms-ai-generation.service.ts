import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AI_GOVERNANCE_NOTICE,
  buildCourseGenerationPreview,
  getAiCourseProvider,
  listAiCourseProviders,
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
  STANDARD_LEARNING_MILESTONES,
  STANDARD_FINAL_EXAM_BLUEPRINT,
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
import { CmsAiVideoService } from './ai/video.service';
import { CmsBaseService } from './cms-base.service';
import { CmsCoursesService } from './cms-courses.service';
import type { GenerateCourseAiDto } from './dto/generate-course-ai.dto';
import type { UpdateAiApprovalDto } from './dto/generate-course-ai.dto';
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

@Injectable()
export class CmsAiGenerationService extends CmsBaseService {
  constructor(
    prisma: PrismaService,
    private readonly courses: CmsCoursesService,
    private readonly audit: AuditService,
    private readonly aiVideo: CmsAiVideoService,
  ) {
    super(prisma);
  }

  listProviders() {
    return listAiCourseProviders();
  }

  private mapDtoToInput(dto: GenerateCourseAiDto, slug: string): GenerateCourseInput {
    return {
      title: dto.title,
      courseCode: dto.courseCode?.trim(),
      slug,
      targetAudience: dto.targetAudience,
      ceHours: dto.ceHours,
      categorySlug: dto.categorySlug,
      categoryLabel: dto.categoryLabel,
      stateJurisdiction: dto.stateJurisdiction,
      profession: dto.profession,
      shortDescription: dto.shortDescription,
      californiaRelevance: dto.californiaRelevance,
      toneFocus: dto.toneFocus,
    };
  }

  async previewGeneration(dto: GenerateCourseAiDto) {
    try {
      const slug = dto.slug?.trim() || this.slugify(dto.title);
      const input = this.mapDtoToInput(dto, slug);
      const provider = getAiCourseProvider(dto.providerId ?? undefined);
      const { plan, providerId, durationMs } = await provider.generateCourse(input);
      return {
        preview: buildCourseGenerationPreview(plan, providerId, AI_GOVERNANCE_NOTICE),
        durationMs,
        governanceNotice: AI_GOVERNANCE_NOTICE,
      };
    } catch (err) {
      this.rethrowGovernanceError(err);
    }
  }

  async generateCourse(dto: GenerateCourseAiDto, actorUserId: string) {
    try {
      return await this.generateCourseInternal(dto, actorUserId);
    } catch (err) {
      this.rethrowGovernanceError(err);
    }
  }

  private rethrowGovernanceError(err: unknown): never {
    if (err instanceof Error && err.message.includes('PHI')) {
      throw new BadRequestException(err.message);
    }
    throw err;
  }

  private async generateCourseInternal(dto: GenerateCourseAiDto, actorUserId: string) {
    const tenantId = await this.getTenantId();
    const slug = dto.slug?.trim() || this.slugify(dto.title);
    const existing = await this.prisma.course.findFirst({
      where: { tenantId, slug },
    });
    if (existing) throw new ConflictException(`Course slug "${slug}" already exists`);

    const input = this.mapDtoToInput(dto, slug);

    const provider = getAiCourseProvider(dto.providerId ?? undefined);
    const { plan, providerId, durationMs } = await provider.generateCourse(input);
    plan.generation.generatedByUserId = actorUserId;

    const professionCode = dto.profession?.trim() || 'CNA';
    const profession = await this.prisma.profession.findFirst({
      where: { code: professionCode },
    });
    const ceHours = dto.ceHours ?? ONE_HOUR_CNA_CEU_BLUEPRINT.targetCeHours;
    const catalog = mergeLaunchCatalogData({ ...DEFAULT_CATALOG }, ceHours);
    if (dto.courseCode?.trim()) {
      (catalog as Record<string, unknown>).courseCode = dto.courseCode.trim();
    }
    if (plan.mediaPrompts.courseThumbnail?.prompt) {
      (catalog as Record<string, unknown>).thumbnailGenerationPrompt =
        plan.mediaPrompts.courseThumbnail.prompt;
    }
    const catalogData = catalog as Prisma.InputJsonValue;

    const contentMeta = this.buildContentMetaFromPlan(plan, ceHours);

    const course = await this.prisma.course.create({
      data: {
        tenantId,
        professionId: profession?.id,
        categoryId: dto.categoryId,
        slug,
        title: dto.title,
        summary: plan.summary,
        status: CourseStatus.DRAFT,
        ceHours,
        catalogData,
      },
    });

    const version = await this.prisma.courseVersion.create({
      data: {
        courseId: course.id,
        versionNumber: 1,
        label: 'Draft 1 (AI Generated)',
        status: CourseVersionStatus.DRAFT,
        ceHours,
        contentMeta: contentMeta as Prisma.InputJsonValue,
      },
    });

    await this.persistPlanStructure(version.id, plan);
    await this.persistExam(version.id, plan);

    const videoPipeline = await this.aiVideo
      .attachVideosForCourseVersion(version.id)
      .catch(() => ({ updatedLessonCount: 0, assets: [] }));

    await this.audit.log({
      tenantId,
      actorId: actorUserId,
      action: AuditAction.CREATE,
      entityType: 'course',
      entityId: course.id,
      metadata: {
        event: 'ai_course_generated',
        providerId,
        promptVersion: plan.generation.promptVersion,
        model: plan.generation.model,
        lessonCount: plan.lessons.length,
        questionCount: plan.exam.questions.length,
        aiVideoAssets: videoPipeline.assets.length,
      },
    });

    const detail = await this.courses.getCourseDetail(course.id);
    const preview = buildCourseGenerationPreview(plan, providerId, AI_GOVERNANCE_NOTICE);

    return {
      courseId: course.id,
      slug: course.slug,
      providerId,
      durationMs,
      lessonCount: plan.lessons.length,
      questionCount: plan.exam.questions.length,
      approvalStatus: plan.generation.approvalStatus,
      complianceReviewStatus: plan.generation.complianceReviewStatus,
      preview,
      detail,
      message:
        'AI draft created in DRAFT status. Instructor review and approval required before publish.',
      generatedByUserId: actorUserId,
      videoPipeline,
    };
  }

  async generateVideosForCourse(courseId: string) {
    const tenantId = await this.getTenantId();
    await this.getCourseForTenant(courseId, tenantId);
    return this.aiVideo.attachVideosForCourse(courseId);
  }

  async updateAiApproval(courseId: string, dto: UpdateAiApprovalDto, userId: string) {
    const tenantId = await this.getTenantId();
    await this.getCourseForTenant(courseId, tenantId);
    const editable = await this.courses.ensureEditableVersion(courseId);
    const meta = (editable.contentMeta ?? {}) as CmsCourseContentMeta;

    if (!meta.aiGeneration) {
      throw new BadRequestException('This course was not created via AI generation');
    }

    const reviewer = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true, lastName: true },
    });
    const reviewerDisplayName = reviewer
      ? [reviewer.firstName, reviewer.lastName].filter(Boolean).join(' ') || reviewer.email
      : userId;

    const updated: CmsCourseContentMeta = {
      ...meta,
      aiGeneration: {
        ...meta.aiGeneration,
        approvalStatus: dto.approvalStatus,
        complianceReviewStatus:
          dto.complianceReviewStatus ??
          meta.aiGeneration.complianceReviewStatus ??
          'pending',
        reviewNotes: dto.reviewNotes,
        reviewedAt: new Date().toISOString(),
        reviewedByUserId: userId,
        reviewerDisplayName,
      },
    };

    await this.prisma.courseVersion.update({
      where: { id: editable.id },
      data: { contentMeta: updated as Prisma.InputJsonValue },
    });

    await this.audit.log({
      tenantId,
      actorId: userId,
      action: AuditAction.UPDATE,
      entityType: 'course',
      entityId: courseId,
      metadata: {
        event: 'ai_course_approval',
        approvalStatus: dto.approvalStatus,
        complianceReviewStatus: updated.aiGeneration?.complianceReviewStatus,
      },
    });

    if (dto.approvalStatus === 'instructor_approved') {
      await this.prisma.course.update({
        where: { id: courseId },
        data: { status: CourseStatus.REVIEW },
      });
    }

    return this.courses.getCourseDetail(courseId);
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

  private async persistPlanStructure(versionId: string, plan: CourseGenerationPlan) {
    const moduleOrder = new Map<string, number>();
    const lessonOrder = new Map<string, number>();

    for (const lesson of plan.lessons) {
      if (!moduleOrder.has(lesson.moduleSlug)) {
        moduleOrder.set(lesson.moduleSlug, moduleOrder.size);
        lessonOrder.set(lesson.moduleSlug, 0);
        await this.prisma.module.create({
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

    const modules = await this.prisma.module.findMany({
      where: { courseVersionId: versionId, deletedAt: null },
    });
    const modBySlug = new Map(modules.map((m) => [m.slug, m]));

    for (const lesson of plan.lessons) {
      const mod = modBySlug.get(lesson.moduleSlug);
      if (!mod) continue;
      const order = lessonOrder.get(lesson.moduleSlug) ?? 0;
      lessonOrder.set(lesson.moduleSlug, order + 1);
      await this.prisma.lesson.create({
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

  private async persistExam(versionId: string, plan: CourseGenerationPlan) {
    const assessment = await this.prisma.assessment.create({
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
      await this.prisma.question.create({
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
