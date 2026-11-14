import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ContentPublishStatus, CourseVersionStatus, Prisma } from '@calace/db';
import { createEmptyLessonDocument, isBlockDocument, validateStandardLessonFlow } from '@calace/content-blocks';

import { CmsBaseService } from './cms-base.service';
import {
  CreateLessonDto,
  CreateModuleDto,
  ReorderLessonsDto,
  UpdateLessonContentDto,
  UpdateLessonDto,
  UpdateModuleDto,
} from './dto/structure.dto';

@Injectable()
export class CmsStructureService extends CmsBaseService {
  private async lessonVersionId(lessonId: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, deletedAt: null },
      include: { module: true },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    return lesson.module.courseVersionId;
  }

  async createModule(courseId: string, versionId: string, dto: CreateModuleDto) {
    await this.getVersionForCourse(versionId, courseId);
    await this.assertDraftEditable(versionId);
    const slug = dto.slug?.trim() || this.slugify(dto.title);
    const maxOrder = await this.prisma.module.aggregate({
      where: { courseVersionId: versionId, deletedAt: null },
      _max: { sortOrder: true },
    });
    const mod = await this.prisma.module.create({
      data: {
        courseVersionId: versionId,
        slug,
        title: dto.title,
        description: dto.description,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
        status: ContentPublishStatus.DRAFT,
      },
    });
    return mod;
  }

  async updateModule(moduleId: string, dto: UpdateModuleDto) {
    const mod = await this.prisma.module.findFirst({
      where: { id: moduleId, deletedAt: null },
    });
    if (!mod) throw new NotFoundException('Module not found');
    await this.assertDraftEditable(mod.courseVersionId);
    return this.prisma.module.update({
      where: { id: moduleId },
      data: { title: dto.title, description: dto.description, status: dto.status },
    });
  }

  async deleteModule(moduleId: string) {
    const mod = await this.prisma.module.findFirst({
      where: { id: moduleId, deletedAt: null },
    });
    if (!mod) throw new NotFoundException('Module not found');
    await this.assertDraftEditable(mod.courseVersionId);
    await this.prisma.module.update({
      where: { id: moduleId },
      data: { deletedAt: new Date() },
    });
    return { success: true };
  }

  /** DB unique on (moduleId, slug) includes soft-deleted rows — avoid P2002 → 500. */
  private async uniqueLessonSlug(moduleId: string, preferred: string) {
    const base = preferred.trim() || 'lesson';
    let slug = base.slice(0, 80);
    let suffix = 2;
    while (
      await this.prisma.lesson.findFirst({
        where: { moduleId, slug },
        select: { id: true },
      })
    ) {
      const suffixStr = `-${suffix}`;
      slug = `${base.slice(0, Math.max(1, 80 - suffixStr.length))}${suffixStr}`;
      suffix += 1;
    }
    return slug;
  }

  async createLesson(moduleId: string, dto: CreateLessonDto) {
    const mod = await this.prisma.module.findFirst({
      where: { id: moduleId, deletedAt: null },
    });
    if (!mod) throw new NotFoundException('Module not found');
    await this.assertDraftEditable(mod.courseVersionId);
    const slug = await this.uniqueLessonSlug(
      moduleId,
      dto.slug?.trim() || this.slugify(dto.title) || 'lesson',
    );
    const maxOrder = await this.prisma.lesson.aggregate({
      where: { moduleId, deletedAt: null },
      _max: { sortOrder: true },
    });
    const content = createEmptyLessonDocument(dto.title);
    if (dto.requiredForCompletion && isBlockDocument(content)) {
      const last = content.blocks[content.blocks.length - 1];
      if (last) last.requiredForCompletion = true;
    }
    return this.prisma.lesson.create({
      data: {
        moduleId,
        slug,
        title: dto.title,
        description: dto.description,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
        status: ContentPublishStatus.DRAFT,
        durationMinutes: dto.durationMinutes ?? 15,
        content: content as Prisma.InputJsonValue,
      },
    });
  }

  async updateLesson(lessonId: string, dto: UpdateLessonDto) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, deletedAt: null },
      include: { module: true },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    await this.assertDraftEditable(lesson.module.courseVersionId);
    return this.prisma.lesson.update({
      where: { id: lessonId },
      data: {
        title: dto.title,
        description: dto.description,
        durationMinutes: dto.durationMinutes,
        status: dto.status,
      },
    });
  }

  async deleteLesson(lessonId: string) {
    const versionId = await this.lessonVersionId(lessonId);
    await this.assertDraftEditable(versionId);
    await this.prisma.lesson.update({
      where: { id: lessonId },
      data: { deletedAt: new Date() },
    });
    return { success: true };
  }

  async reorderLessons(dto: ReorderLessonsDto) {
    const mod = await this.prisma.module.findFirst({
      where: { id: dto.moduleId, deletedAt: null },
    });
    if (!mod) throw new NotFoundException('Module not found');
    await this.assertDraftEditable(mod.courseVersionId);
    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.lesson.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );
    return { success: true };
  }

  async getLesson(lessonId: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, deletedAt: null },
      include: {
        module: {
          include: {
            courseVersion: { include: { course: { select: { id: true, slug: true, title: true } } } },
          },
        },
      },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    return {
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      description: lesson.description,
      sortOrder: lesson.sortOrder,
      status: lesson.status,
      durationMinutes: lesson.durationMinutes,
      content: lesson.content,
      course: lesson.module.courseVersion.course,
      courseVersionId: lesson.module.courseVersionId,
      moduleId: lesson.moduleId,
      editable: lesson.module.courseVersion.status === 'DRAFT',
    };
  }

  async updateLessonContent(lessonId: string, dto: UpdateLessonContentDto) {
    const versionId = await this.lessonVersionId(lessonId);
    await this.assertDraftEditable(versionId);
    if (!isBlockDocument(dto.content)) {
      throw new BadRequestException(
        'content must be a v2 block document (schemaVersion: 2, blocks[])',
      );
    }
    const formatCheck = validateStandardLessonFlow(dto.content);
    if (!formatCheck.valid) {
      throw new BadRequestException(formatCheck.errors.join(' '));
    }
    return this.prisma.lesson.update({
      where: { id: lessonId },
      data: { content: dto.content as Prisma.InputJsonValue },
    });
  }
}
