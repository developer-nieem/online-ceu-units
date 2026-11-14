import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import {
  BLUEPRINT_IDS,
  buildDefaultLearningObjectives,
  buildLessonDocumentForBlueprintLesson,
  buildQualityChecklist,
  computeBlueprintPacing,
  STANDARD_COMPLETION_ROADMAP,
  sumLessonActiveMinutes,
  DEFAULT_ECOSYSTEM_HOOKS,
  DEFAULT_QUALITY_FRAMEWORK,
  ONE_HOUR_CNA_CEU_BLUEPRINT,
  STANDARD_FINAL_EXAM_BLUEPRINT,
  STANDARD_LEARNING_MILESTONES,
  validateLessonDurations,
  type CourseBlueprintDef,
} from '@calace/content-blocks';
import {
  AssessmentKind,
  ContentPublishStatus,
  CourseStatus,
  CourseVersionStatus,
  Prisma,
  QuestionType,
} from '@calace/db';

import { DEFAULT_LAUNCH_CEU_HOURS } from '../config/ceu-defaults';
import { PrismaService } from '../prisma/prisma.service';
import { CmsBaseService } from './cms-base.service';
import { CmsCoursesService } from './cms-courses.service';
import type { CreateCourseFromBlueprintDto } from './dto/create-course-from-blueprint.dto';
import type { DuplicateCourseDto } from './dto/create-course-from-blueprint.dto';
import type { CmsCatalogData, CmsCourseContentMeta } from './types/cms-metadata.types';

const BLUEPRINT_REGISTRY: Record<string, CourseBlueprintDef> = {
  [BLUEPRINT_IDS.ONE_HOUR_CNA_CEU_V1]: ONE_HOUR_CNA_CEU_BLUEPRINT,
};

function mergeLaunchCatalogData(
  catalogData: CmsCatalogData,
  ceHours: number,
): CmsCatalogData {
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
export class CmsBlueprintService extends CmsBaseService {
  constructor(
    prisma: PrismaService,
    private readonly courses: CmsCoursesService,
  ) {
    super(prisma);
  }

  listBlueprints() {
    return Object.values(BLUEPRINT_REGISTRY).map((b) => {
      const pacing = computeBlueprintPacing(b);
      return {
        id: b.id,
        version: b.version,
        label: b.label,
        description: b.description,
        targetCeHours: b.targetCeHours,
        targetActiveParticipationMinutes: b.targetActiveParticipationMinutes,
        moduleCount: b.modules.length,
        lessonCount: pacing.lessonCount,
        pacing,
      };
    });
  }

  resolveBlueprint(blueprintId?: string): CourseBlueprintDef {
    const id = blueprintId ?? BLUEPRINT_IDS.ONE_HOUR_CNA_CEU_V1;
    const blueprint = BLUEPRINT_REGISTRY[id];
    if (!blueprint) throw new BadRequestException(`Unknown blueprint: ${id}`);
    return blueprint;
  }

  buildBlueprintContentMeta(
    blueprint: CourseBlueprintDef,
    courseTitle: string,
  ): CmsCourseContentMeta {
    const pacing = computeBlueprintPacing(blueprint);
    return {
      overview: `[Blueprint] ${courseTitle} — replace with learner-facing course overview.`,
      learningObjectives: buildDefaultLearningObjectives(courseTitle),
      faq: [],
      compliance: {
        cdphApprovalStatus: 'placeholder',
        targetAudience: 'California Certified Nursing Assistants (CNAs)',
        onlineDeliveryDesignation: 'online',
        requiredSeatTimeMinutes: blueprint.targetActiveParticipationMinutes,
        regulatoryNotes: 'CDPH approval metadata — update before production release.',
      },
      imageAccent: 'teal',
      versioning: { immutableAfterPublish: true },
      blueprint: {
        blueprintId: blueprint.id,
        blueprintVersion: blueprint.version,
        appliedAt: new Date().toISOString(),
        targetActiveParticipationMinutes: blueprint.targetActiveParticipationMinutes,
        pacing: {
          estimatedActiveMinutes: pacing.estimatedActiveMinutes,
          weightedParticipationMinutes: pacing.weightedParticipationMinutes,
          valid: pacing.valid,
          warnings: pacing.warnings,
        },
      },
      learningExperience: {
        tone: 'professional_healthcare',
        milestones: STANDARD_LEARNING_MILESTONES,
        completionRoadmap: STANDARD_COMPLETION_ROADMAP,
      },
      qualityFramework: DEFAULT_QUALITY_FRAMEWORK,
      ecosystemHooks: DEFAULT_ECOSYSTEM_HOOKS,
      examBlueprint: {
        examBlueprintId: STANDARD_FINAL_EXAM_BLUEPRINT.id,
        targetBankSize: STANDARD_FINAL_EXAM_BLUEPRINT.targetBankSize,
        maxAttempts: STANDARD_FINAL_EXAM_BLUEPRINT.maxAttempts,
        passingScore: STANDARD_FINAL_EXAM_BLUEPRINT.passingScore,
        messaging: STANDARD_FINAL_EXAM_BLUEPRINT.messaging,
      },
      qualityChecklist: buildQualityChecklist(DEFAULT_QUALITY_FRAMEWORK),
    };
  }

  async createCourseFromBlueprint(dto: CreateCourseFromBlueprintDto) {
    const tenantId = await this.getTenantId();
    const blueprint = this.resolveBlueprint(dto.blueprintId);
    const slug = dto.slug?.trim() || this.slugify(dto.title);
    const existing = await this.prisma.course.findFirst({
      where: { tenantId, slug },
    });
    if (existing) throw new ConflictException(`Course slug "${slug}" already exists`);

    const profession = await this.prisma.profession.findFirst({
      where: { code: 'CNA' },
    });
    const ceHours = dto.ceHours ?? blueprint.targetCeHours;
    const catalogData = mergeLaunchCatalogData(
      { ...DEFAULT_CATALOG },
      ceHours,
    ) as Prisma.InputJsonValue;

    const contentMeta = this.mergeComplianceSeatTime(
      this.buildBlueprintContentMeta(blueprint, dto.title),
      ceHours,
    );

    const course = await this.prisma.course.create({
      data: {
        tenantId,
        professionId: profession?.id,
        slug,
        title: dto.title,
        summary:
          dto.summary ??
          `California CNA Online CEU — ${blueprint.label}. Author clinical content in CMS.`,
        status: dto.status ?? CourseStatus.DRAFT,
        ceHours,
        catalogData,
      },
    });

    const version = await this.prisma.courseVersion.create({
      data: {
        courseId: course.id,
        versionNumber: 1,
        label: 'Draft 1 (Blueprint)',
        status: CourseVersionStatus.DRAFT,
        ceHours,
        contentMeta: contentMeta as Prisma.InputJsonValue,
      },
    });

    await this.materializeBlueprintStructure(version.id, blueprint, dto.title);
    await this.seedStandardFinalExam(version.id, dto.title);

    return this.courses.getCourseDetail(course.id);
  }

  async materializeBlueprintStructure(
    versionId: string,
    blueprint: CourseBlueprintDef,
    courseTitle: string,
  ) {
    let moduleOrder = 0;
    for (const mod of blueprint.modules) {
      const createdMod = await this.prisma.module.create({
        data: {
          courseVersionId: versionId,
          slug: mod.slug,
          title: mod.title,
          description: mod.description ?? null,
          sortOrder: moduleOrder++,
          status: ContentPublishStatus.DRAFT,
          metadata: { blueprintModule: true } as Prisma.InputJsonValue,
        },
      });

      let lessonOrder = 0;
      for (const lesson of mod.lessons) {
        const content = buildLessonDocumentForBlueprintLesson(lesson, courseTitle);
        await this.prisma.lesson.create({
          data: {
            moduleId: createdMod.id,
            slug: lesson.slug,
            title: lesson.title,
            description: lesson.sectionKind,
            sortOrder: lessonOrder++,
            status: ContentPublishStatus.DRAFT,
            durationMinutes: lesson.estimatedActiveMinutes,
            content: content as Prisma.InputJsonValue,
          },
        });
      }
    }
  }

  async seedStandardFinalExam(versionId: string, courseTitle: string) {
    const exam = STANDARD_FINAL_EXAM_BLUEPRINT;
    const assessment = await this.prisma.assessment.create({
      data: {
        courseVersionId: versionId,
        slug: exam.slug,
        title: exam.titleTemplate.replace('{courseTitle}', courseTitle),
        kind: AssessmentKind.FINAL_EXAM,
        passingScore: exam.passingScore,
        maxAttempts: exam.maxAttempts,
        settings: exam.settings as Prisma.InputJsonValue,
      },
    });

    for (const q of exam.placeholderQuestions) {
      await this.prisma.question.create({
        data: {
          assessmentId: assessment.id,
          sortOrder: q.sortOrder,
          type: q.type as QuestionType,
          prompt: q.prompt,
          options: q.options as Prisma.InputJsonValue,
          correctAnswer: q.correctAnswer as Prisma.InputJsonValue,
          explanation: q.explanation,
          metadata: (q.metadata ?? {}) as Prisma.InputJsonValue,
        },
      });
    }
  }

  async duplicateCourseStructure(sourceCourseId: string, dto: DuplicateCourseDto) {
    const tenantId = await this.getTenantId();
    const source = await this.getCourseForTenant(sourceCourseId, tenantId);
    const editable = await this.courses.ensureEditableVersion(sourceCourseId);
    const tree = await this.courses.loadVersionTree(editable.id);

    const slug = dto.slug?.trim() || this.slugify(dto.title);
    const existing = await this.prisma.course.findFirst({
      where: { tenantId, slug },
    });
    if (existing) throw new ConflictException(`Course slug "${slug}" already exists`);

    const sourceMeta = (editable.contentMeta ?? {}) as CmsCourseContentMeta;
    const ceHours = Number(editable.ceHours);
    const catalogData = mergeLaunchCatalogData(
      { ...(source.catalogData as CmsCatalogData) },
      ceHours,
    ) as Prisma.InputJsonValue;

    const contentMeta: CmsCourseContentMeta = {
      ...sourceMeta,
      versioning: {
        revisionNotes: `Duplicated structure from ${source.slug}`,
        immutableAfterPublish: false,
      },
      blueprint: sourceMeta.blueprint
        ? {
            ...sourceMeta.blueprint,
            appliedAt: new Date().toISOString(),
          }
        : undefined,
    };

    const course = await this.prisma.course.create({
      data: {
        tenantId,
        professionId: source.professionId,
        slug,
        title: dto.title,
        summary: dto.summary ?? source.summary ?? '',
        status: CourseStatus.DRAFT,
        ceHours,
        catalogData,
        categoryId: source.categoryId,
      },
    });

    const version = await this.prisma.courseVersion.create({
      data: {
        courseId: course.id,
        versionNumber: 1,
        label: 'Draft 1 (Duplicate)',
        status: CourseVersionStatus.DRAFT,
        ceHours,
        contentMeta: this.mergeComplianceSeatTime(
          contentMeta,
          ceHours,
        ) as Prisma.InputJsonValue,
      },
    });

    const modules = await this.prisma.module.findMany({
      where: { courseVersionId: editable.id, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      include: {
        lessons: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
      },
    });

    for (const mod of modules) {
      const newMod = await this.prisma.module.create({
        data: {
          courseVersionId: version.id,
          slug: mod.slug,
          title: mod.title,
          description: mod.description,
          sortOrder: mod.sortOrder,
          status: ContentPublishStatus.DRAFT,
          ceHours: mod.ceHours,
          metadata: mod.metadata as Prisma.InputJsonValue,
        },
      });
      for (const lesson of mod.lessons) {
        await this.prisma.lesson.create({
          data: {
            moduleId: newMod.id,
            slug: lesson.slug,
            title: lesson.title,
            description: lesson.description,
            sortOrder: lesson.sortOrder,
            status: ContentPublishStatus.DRAFT,
            ceHours: lesson.ceHours,
            durationMinutes: lesson.durationMinutes,
            content: lesson.content as Prisma.InputJsonValue,
          },
        });
      }
    }

    const assessments = await this.prisma.assessment.findMany({
      where: { courseVersionId: editable.id, deletedAt: null, moduleId: null, lessonId: null },
      include: { questions: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } } },
    });

    for (const assessment of assessments) {
      const newAssessment = await this.prisma.assessment.create({
        data: {
          courseVersionId: version.id,
          slug: assessment.slug,
          title: assessment.title.replace(source.title, dto.title),
          kind: assessment.kind,
          passingScore: assessment.passingScore,
          maxAttempts: assessment.maxAttempts,
          timeLimitMin: assessment.timeLimitMin,
          settings: assessment.settings as Prisma.InputJsonValue,
        },
      });
      for (const q of assessment.questions) {
        await this.prisma.question.create({
          data: {
            assessmentId: newAssessment.id,
            sortOrder: q.sortOrder,
            type: q.type,
            prompt: q.prompt,
            options: q.options as Prisma.InputJsonValue,
            correctAnswer: q.correctAnswer as Prisma.InputJsonValue,
            points: q.points,
            explanation: q.explanation,
            metadata: q.metadata as Prisma.InputJsonValue,
          },
        });
      }
    }

    return {
      courseId: course.id,
      slug: course.slug,
      lessonCount: tree.reduce((n, m) => n + m.lessons.length, 0),
      detail: await this.courses.getCourseDetail(course.id),
    };
  }

  async getPacingReport(courseId: string) {
    const tenantId = await this.getTenantId();
    await this.getCourseForTenant(courseId, tenantId);
    const editable = await this.courses.ensureEditableVersion(courseId);
    const meta = (editable.contentMeta ?? {}) as CmsCourseContentMeta;
    const blueprintId = meta.blueprint?.blueprintId ?? BLUEPRINT_IDS.ONE_HOUR_CNA_CEU_V1;
    const blueprint = this.resolveBlueprint(blueprintId);

    const lessons = await this.prisma.lesson.findMany({
      where: {
        deletedAt: null,
        module: { courseVersionId: editable.id, deletedAt: null },
      },
      select: { slug: true, durationMinutes: true, title: true },
      orderBy: { sortOrder: 'asc' },
    });

    const blueprintPacing = computeBlueprintPacing(blueprint);
    const durationCheck = validateLessonDurations(blueprint, lessons);
    const estimatedActiveMinutes = sumLessonActiveMinutes(lessons);
    const catalog = (await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { catalogData: true },
    }))?.catalogData as { durationMinutes?: number } | null;

    return {
      blueprintId,
      blueprintVersion: blueprint.version,
      blueprintLabel: blueprint.label,
      targetActiveMinutes: blueprint.targetActiveParticipationMinutes,
      minimumActiveMinutes: blueprint.targetActiveParticipationMinutes,
      estimatedActiveMinutes,
      catalogDurationMinutes: catalog?.durationMinutes ?? blueprint.targetCatalogMinutes,
      blueprintPacing,
      durationCheck,
      qualityChecklist: buildQualityChecklist(
        ((meta.qualityFramework ?? DEFAULT_QUALITY_FRAMEWORK) as typeof DEFAULT_QUALITY_FRAMEWORK),
      ),
      lessons: lessons.map((l) => ({
        slug: l.slug,
        title: l.title,
        durationMinutes: l.durationMinutes,
      })),
    };
  }

}
