import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ContentPublishStatus,
  CourseStatus,
  CourseVersionStatus,
  Prisma,
} from '@calace/db';
import { assertAiCoursePublishAllowed } from '@calace/ai-course-generation';
import { createEmptyLessonDocument } from '@calace/content-blocks';

import { DEFAULT_LAUNCH_CEU_HOURS } from '../config/ceu-defaults';

function mergeLaunchCatalogData(
  catalogData: CmsCatalogData,
  ceHours: number,
): CmsCatalogData {
  if (ceHours !== DEFAULT_LAUNCH_CEU_HOURS) return { ...catalogData };
  return { ...catalogData, durationMinutes: 60, displayDuration: '1h' };
}
import { CmsBaseService } from './cms-base.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import type { CmsCatalogData, CmsCourseContentMeta } from './types/cms-metadata.types';

const DEFAULT_CATALOG: CmsCatalogData = {
  price: 3.75,
  durationMinutes: 60,
  difficulty: 'beginner',
  instructor: 'CAL ACE Faculty',
  featured: false,
  hasFreePreview: false,
  subscriptionEligible: true,
};

const DEFAULT_CONTENT_META: CmsCourseContentMeta = {
  overview: '',
  learningObjectives: [],
  faq: [],
  compliance: {
    cdphApprovalStatus: 'placeholder',
    targetAudience: 'California Certified Nursing Assistants (CNAs)',
    onlineDeliveryDesignation: 'online',
    regulatoryNotes: 'CDPH approval metadata — update before production release.',
  },
  imageAccent: 'teal',
  versioning: { immutableAfterPublish: true },
};

@Injectable()
export class CmsCoursesService extends CmsBaseService {
  async getDashboard() {
    const tenantId = await this.getTenantId();
    const [total, published, draft, review, archived] = await Promise.all([
      this.prisma.course.count({ where: { tenantId, deletedAt: null } }),
      this.prisma.course.count({
        where: { tenantId, deletedAt: null, status: CourseStatus.PUBLISHED },
      }),
      this.prisma.course.count({
        where: { tenantId, deletedAt: null, status: CourseStatus.DRAFT },
      }),
      this.prisma.course.count({
        where: { tenantId, deletedAt: null, status: CourseStatus.REVIEW },
      }),
      this.prisma.course.count({
        where: { tenantId, deletedAt: null, status: CourseStatus.ARCHIVED },
      }),
    ]);
    return { total, published, draft, review, archived };
  }

  async listCategories() {
    const tenantId = await this.getTenantId();
    return this.prisma.courseCategory.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, slug: true, name: true },
    });
  }

  async listCourses(params?: { status?: CourseStatus; search?: string }) {
    const tenantId = await this.getTenantId();
    const where: Prisma.CourseWhereInput = {
      tenantId,
      deletedAt: null,
      ...(params?.status ? { status: params.status } : {}),
      ...(params?.search
        ? {
            OR: [
              { title: { contains: params.search, mode: 'insensitive' } },
              { slug: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const courses = await this.prisma.course.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        category: { select: { slug: true, name: true } },
        versions: {
          where: { deletedAt: null },
          orderBy: { versionNumber: 'desc' },
          take: 2,
          select: {
            id: true,
            versionNumber: true,
            status: true,
            publishedAt: true,
            _count: { select: { completions: true, enrollments: true } },
          },
        },
      },
    });
    return courses.map((c) => this.mapCourseListItem(c));
  }

  private mapCourseListItem(course: {
    id: string;
    slug: string;
    title: string;
    summary: string | null;
    status: CourseStatus;
    ceHours: Prisma.Decimal;
    catalogData: Prisma.JsonValue;
    updatedAt: Date;
    category: { slug: string; name: string } | null;
    versions: {
      id: string;
      versionNumber: number;
      status: CourseVersionStatus;
      publishedAt: Date | null;
      _count?: { completions: number; enrollments: number };
    }[];
  }) {
    const catalog = (course.catalogData ?? {}) as CmsCatalogData;
    const latest = course.versions[0];
    const published = course.versions.find((v) => v.status === CourseVersionStatus.PUBLISHED);
    return {
      id: course.id,
      slug: course.slug,
      title: course.title,
      summary: course.summary,
      status: course.status,
      ceHours: Number(course.ceHours),
      category: course.category,
      catalogData: catalog,
      latestVersion: latest
        ? {
            id: latest.id,
            versionNumber: latest.versionNumber,
            status: latest.status,
            completionCount: latest._count?.completions ?? 0,
            enrollmentCount: latest._count?.enrollments ?? 0,
          }
        : null,
      publishedVersionId: published?.id ?? null,
      updatedAt: course.updatedAt.toISOString(),
    };
  }

  async getCourseDetail(courseId: string) {
    const tenantId = await this.getTenantId();
    const course = await this.getCourseForTenant(courseId, tenantId);
    const editableVersion = await this.ensureEditableVersion(course.id);
    const tree = await this.loadVersionTree(editableVersion.id);
    const contentMeta = this.mergeComplianceSeatTime(
      (editableVersion.contentMeta ?? {}) as CmsCourseContentMeta,
      Number(editableVersion.ceHours),
    );
    return {
      ...this.mapCourseListItem(course),
      catalogData: course.catalogData,
      contentMeta,
      versions: course.versions.map((v) => ({
        id: v.id,
        versionNumber: v.versionNumber,
        label: v.label,
        status: v.status,
        ceHours: Number(v.ceHours),
        publishedAt: v.publishedAt?.toISOString() ?? null,
        immutableAfterPublish:
          ((v.contentMeta as CmsCourseContentMeta)?.versioning?.immutableAfterPublish ??
            true) && v.status === CourseVersionStatus.PUBLISHED,
      })),
      editableVersionId: editableVersion.id,
      editableVersionNumber: editableVersion.versionNumber,
      structure: tree,
    };
  }

  async createCourse(dto: CreateCourseDto) {
    const tenantId = await this.getTenantId();
    const slug = dto.slug?.trim() || this.slugify(dto.title);
    const existing = await this.prisma.course.findFirst({
      where: { tenantId, slug },
    });
    if (existing) throw new ConflictException(`Course slug "${slug}" already exists`);

    const profession = await this.prisma.profession.findFirst({
      where: { code: 'CNA' },
    });

    const ceHours = dto.ceHours ?? DEFAULT_LAUNCH_CEU_HOURS;
    const catalogData = mergeLaunchCatalogData(
      { ...DEFAULT_CATALOG },
      ceHours,
    ) as Prisma.InputJsonValue;

    const course = await this.prisma.course.create({
      data: {
        tenantId,
        professionId: profession?.id,
        slug,
        title: dto.title,
        summary: dto.summary ?? '',
        status: dto.status ?? CourseStatus.DRAFT,
        ceHours,
        catalogData,
      },
    });

    const contentMeta = this.mergeComplianceSeatTime(
      { ...DEFAULT_CONTENT_META },
      ceHours,
    );

    const version = await this.prisma.courseVersion.create({
      data: {
        courseId: course.id,
        versionNumber: 1,
        label: 'Draft 1',
        status: CourseVersionStatus.DRAFT,
        ceHours,
        contentMeta: contentMeta as Prisma.InputJsonValue,
      },
    });

    const module = await this.prisma.module.create({
      data: {
        courseVersionId: version.id,
        slug: 'module-1',
        title: 'Module 1',
        sortOrder: 0,
        status: ContentPublishStatus.DRAFT,
      },
    });

    await this.prisma.lesson.create({
      data: {
        moduleId: module.id,
        slug: 'lesson-1',
        title: 'Introduction',
        sortOrder: 0,
        status: ContentPublishStatus.DRAFT,
        durationMinutes: 15,
        content: createEmptyLessonDocument('Introduction') as Prisma.InputJsonValue,
      },
    });

    return this.getCourseDetail(course.id);
  }

  async updateCourse(courseId: string, dto: UpdateCourseDto) {
    const tenantId = await this.getTenantId();
    const course = await this.getCourseForTenant(courseId, tenantId);
    const ceHours = dto.ceHours ?? Number(course.ceHours);

    let catalogData = (course.catalogData ?? {}) as CmsCatalogData;
    if (dto.catalogData) {
      catalogData = { ...catalogData, ...dto.catalogData };
    }
    if (dto.ceHours != null) {
      catalogData = mergeLaunchCatalogData(catalogData, ceHours) as CmsCatalogData;
    }

    await this.prisma.course.update({
      where: { id: courseId },
      data: {
        title: dto.title,
        summary: dto.summary,
        categoryId: dto.categoryId,
        status: dto.status,
        ceHours: dto.ceHours,
        catalogData: dto.catalogData || dto.ceHours != null ? (catalogData as Prisma.InputJsonValue) : undefined,
      },
    });

    if (dto.contentMeta || dto.ceHours != null) {
      const editable = await this.ensureEditableVersion(courseId);
      const merged = this.mergeComplianceSeatTime(
        {
          ...((editable.contentMeta ?? {}) as CmsCourseContentMeta),
          ...(dto.contentMeta as CmsCourseContentMeta | undefined),
        },
        ceHours,
      );
      await this.prisma.courseVersion.update({
        where: { id: editable.id },
        data: {
          ceHours: dto.ceHours ?? undefined,
          contentMeta: merged as Prisma.InputJsonValue,
        },
      });
    }

    if (dto.ceHours != null) {
      await this.prisma.course.update({
        where: { id: courseId },
        data: { ceHours: dto.ceHours },
      });
    }

    return this.getCourseDetail(courseId);
  }

  async archiveCourse(courseId: string) {
    const tenantId = await this.getTenantId();
    await this.getCourseForTenant(courseId, tenantId);
    await this.prisma.course.update({
      where: { id: courseId },
      data: { status: CourseStatus.ARCHIVED, deletedAt: new Date() },
    });
    return { success: true };
  }

  async createDraftRevision(courseId: string, label?: string) {
    const tenantId = await this.getTenantId();
    const course = await this.getCourseForTenant(courseId, tenantId);
    const latest = course.versions[0];
    if (!latest) throw new BadRequestException('Course has no versions');

    if (latest.status === CourseVersionStatus.DRAFT) {
      return { versionId: latest.id, versionNumber: latest.versionNumber, created: false };
    }

    const newVersion = await this.cloneVersion(latest.id, {
      versionNumber: latest.versionNumber + 1,
      label: label ?? `Draft ${latest.versionNumber + 1}`,
    });

    return {
      versionId: newVersion.id,
      versionNumber: newVersion.versionNumber,
      created: true,
    };
  }

  async ensureEditableVersion(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        versions: { where: { deletedAt: null }, orderBy: { versionNumber: 'desc' } },
      },
    });
    if (!course) throw new NotFoundException('Course not found');

    const latest = course.versions[0];
    if (!latest) throw new BadRequestException('Course has no versions');

    if (latest.status === CourseVersionStatus.DRAFT) {
      return latest;
    }

    const { versionId } = await this.createDraftRevision(courseId);
    return this.prisma.courseVersion.findUniqueOrThrow({ where: { id: versionId } });
  }

  async publishVersion(courseId: string, versionId: string) {
    const tenantId = await this.getTenantId();
    await this.getCourseForTenant(courseId, tenantId);
    const version = await this.getVersionForCourse(versionId, courseId);

    if (version.status !== CourseVersionStatus.DRAFT) {
      throw new BadRequestException('Only draft versions can be published');
    }

    const course = await this.prisma.course.findUniqueOrThrow({ where: { id: courseId } });
    if (course.status === CourseStatus.ARCHIVED) {
      throw new BadRequestException('Cannot publish an archived course');
    }

    const versionMeta = (version.contentMeta ?? {}) as CmsCourseContentMeta;
    const aiPublish = assertAiCoursePublishAllowed(versionMeta.aiGeneration ?? null);
    if (!aiPublish.allowed) {
      throw new BadRequestException(aiPublish.reason);
    }

    const now = new Date();
    const contentMeta = {
      ...((version.contentMeta ?? {}) as object),
      versioning: {
        ...(((version.contentMeta as CmsCourseContentMeta)?.versioning ?? {}) as object),
        immutableAfterPublish: true,
        publishedByUserId: undefined,
      },
    };

    await this.prisma.$transaction([
      this.prisma.courseVersion.updateMany({
        where: {
          courseId,
          status: CourseVersionStatus.PUBLISHED,
          id: { not: versionId },
        },
        data: { status: CourseVersionStatus.RETIRED },
      }),
      this.prisma.courseVersion.update({
        where: { id: versionId },
        data: {
          status: CourseVersionStatus.PUBLISHED,
          publishedAt: now,
          contentMeta: contentMeta as Prisma.InputJsonValue,
        },
      }),
      this.prisma.module.updateMany({
        where: { courseVersionId: versionId, deletedAt: null },
        data: { status: ContentPublishStatus.PUBLISHED },
      }),
      this.prisma.lesson.updateMany({
        where: {
          module: { courseVersionId: versionId },
          deletedAt: null,
        },
        data: { status: ContentPublishStatus.PUBLISHED },
      }),
      this.prisma.course.update({
        where: { id: courseId },
        data: {
          status: CourseStatus.PUBLISHED,
          ceHours: version.ceHours,
        },
      }),
    ]);

    return this.getCourseDetail(courseId);
  }

  async submitForReview(courseId: string) {
    const tenantId = await this.getTenantId();
    await this.getCourseForTenant(courseId, tenantId);
    await this.prisma.course.update({
      where: { id: courseId },
      data: { status: CourseStatus.REVIEW },
    });
    return this.getCourseDetail(courseId);
  }

  private async cloneVersion(
    sourceVersionId: string,
    opts: { versionNumber: number; label: string },
  ) {
    const source = await this.prisma.courseVersion.findUniqueOrThrow({
      where: { id: sourceVersionId },
      include: {
        modules: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
          include: {
            lessons: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
          },
        },
        assessments: {
          where: { deletedAt: null, moduleId: null, lessonId: null },
          include: { questions: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } } },
        },
      },
    });

    const revisionMeta: CmsCourseContentMeta = {
      ...((source.contentMeta ?? {}) as CmsCourseContentMeta),
      versioning: {
        revisionNotes: `Cloned from v${source.versionNumber}`,
        immutableAfterPublish: false,
      },
    };

    const target = await this.prisma.courseVersion.create({
      data: {
        courseId: source.courseId,
        versionNumber: opts.versionNumber,
        label: opts.label,
        status: CourseVersionStatus.DRAFT,
        ceHours: source.ceHours,
        contentMeta: revisionMeta as Prisma.InputJsonValue,
      },
    });

    for (const mod of source.modules) {
      const newMod = await this.prisma.module.create({
        data: {
          courseVersionId: target.id,
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

    for (const assessment of source.assessments) {
      const newAssessment = await this.prisma.assessment.create({
        data: {
          courseVersionId: target.id,
          slug: assessment.slug,
          title: assessment.title,
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

    return target;
  }

  async loadVersionTree(versionId: string) {
    const modules = await this.prisma.module.findMany({
      where: { courseVersionId: versionId, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      include: {
        lessons: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            sortOrder: true,
            status: true,
            durationMinutes: true,
          },
        },
      },
    });
    return modules.map((m) => ({
      id: m.id,
      slug: m.slug,
      title: m.title,
      description: m.description,
      sortOrder: m.sortOrder,
      status: m.status,
      lessons: m.lessons,
    }));
  }
}
