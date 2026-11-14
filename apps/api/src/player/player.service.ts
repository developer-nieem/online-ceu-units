import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  encouragementForProgress,
  isBlockDocument,
  parseBlockProgress,
  resolveCompletionRoadmap,
  resolveLearningMilestones,
  sumLessonActiveMinutes,
  type VideoBlock,
} from '@calace/content-blocks';
import {
  ContentPublishStatus,
  CourseStatus,
  CourseVersionStatus,
  LessonProgressStatus,
  Prisma,
} from '@calace/db';

import type { AuthUser } from '../auth/types/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_TENANT_SLUG } from '../config/auth.constants';
import { ParticipationService } from '../participation/participation.service';
import { ProgressService } from '../progress/progress.service';
import { deriveLearnerState } from '../enrollments/learner-state';
import { isFreeFromCatalogData } from '../catalog/catalog-pricing.util';
import { EnrollmentService } from '../enrollments/enrollment.service';

export type LessonContentType =
  | 'text'
  | 'image'
  | 'infographic'
  | 'video'
  | 'interactive'
  | 'quiz';

export type LessonContentPayload = {
  type: LessonContentType;
  title?: string;
  body?: string;
  caption?: string;
  placeholderNote?: string;
};

type CmsCatalogLessonContent = LessonContentPayload & {
  videoUrl?: string;
  readingBlocks?: Array<{ title?: string; content?: string }>;
};

@Injectable()
export class PlayerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly progress: ProgressService,
    private readonly participation: ParticipationService,
    private readonly enrollments: EnrollmentService,
  ) {}

  private findEnrollment(userId: string, courseVersionId: string) {
    return this.prisma.enrollment.findFirst({
      where: { userId, courseVersionId, deletedAt: null },
    });
  }

  private isEnrollmentAlreadyPresent(err: unknown): boolean {
    if (err instanceof ConflictException) return true;
    return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
  }

  private async getTenantId() {
    const tenant = await this.prisma.tenant.findFirst({
      where: { slug: DEFAULT_TENANT_SLUG, deletedAt: null },
    });
    if (!tenant) throw new Error('Tenant not configured');
    return tenant.id;
  }

  async getPlayerState(
    user: AuthUser,
    courseSlug: string,
    lessonSlug?: string,
  ): Promise<Record<string, unknown>> {
    const tenantId = await this.getTenantId();
    const course = await this.prisma.course.findFirst({
      where: { tenantId, slug: courseSlug, status: CourseStatus.PUBLISHED, deletedAt: null },
      include: {
        versions: {
          where: { status: CourseVersionStatus.PUBLISHED, deletedAt: null },
          orderBy: { versionNumber: 'desc' },
          take: 1,
          include: {
            modules: {
              where: { deletedAt: null, status: ContentPublishStatus.PUBLISHED },
              orderBy: { sortOrder: 'asc' },
              include: {
                lessons: {
                  where: { deletedAt: null, status: ContentPublishStatus.PUBLISHED },
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!course?.versions[0]) throw new NotFoundException('Course not found');
    const version = course.versions[0];

    let enrollment = await this.findEnrollment(user.userId, version.id);

    // REQUIRES_RESET enrollment is left as-is — subscription grants access, NOT an attempt-limit reset.
    if (!enrollment) {
      const activeSubscription = await this.enrollments.getActiveSubscription(
        user.userId,
        user.tenantId,
      );
      const paidCourse = !isFreeFromCatalogData(course.catalogData);
      if (!activeSubscription || !paidCourse) {
        throw new NotFoundException('Enrollment required');
      }

      try {
        await this.enrollments.enroll(user, {
          courseSlug,
          purchasePlan: 'single',
        });
      } catch (err) {
        if (this.isEnrollmentAlreadyPresent(err)) {
          enrollment = await this.findEnrollment(user.userId, version.id);
          if (!enrollment) throw new NotFoundException('Enrollment required');
        } else {
          throw err;
        }
      }

      if (!enrollment) {
        enrollment = await this.findEnrollment(user.userId, version.id);
        if (!enrollment) throw new NotFoundException('Enrollment required');
      }
    }

    const progressMap = await this.progress.getLessonProgressMap(enrollment.id);
    const progressPct = await this.progress.computeProgressPct(
      enrollment.id,
      version.id,
    );
    const totalLessons = await this.progress.countPublishedLessons(version.id);
    const completedLessons = [...progressMap.values()].filter(
      (p) => p.status === LessonProgressStatus.COMPLETED,
    ).length;

    const flatLessons = version.modules.flatMap((m) =>
      m.lessons.map((l) => ({ ...l, moduleSlug: m.slug, moduleTitle: m.title })),
    );

    const resumeSlug =
      lessonSlug ??
      (await this.progress.getResumeLessonSlug(enrollment.id, version.id)) ??
      flatLessons[0]?.slug;

    const current = flatLessons.find((l) => l.slug === resumeSlug) ?? flatLessons[0];

    if (current) {
      await this.progress.recordLessonView(user, enrollment.id, current.id);
    }

    const participation = await this.participation.getStatusForEnrollment(
      enrollment.id,
      Number(version.ceHours),
      enrollment.metadata,
    );

    const completedSlugs = flatLessons
      .filter((l) => progressMap.get(l.id)?.status === LessonProgressStatus.COMPLETED)
      .map((l) => l.slug);

    const contentMeta = (version.contentMeta ?? {}) as {
      learningExperience?: {
        milestones?: import('@calace/content-blocks').LearningMilestoneDef[];
        completionRoadmap?: import('@calace/content-blocks').CompletionRoadmapStep[];
      };
      examBlueprint?: { messaging?: Record<string, string> };
    };

    const milestones = resolveLearningMilestones(
      progressPct,
      completedSlugs,
      contentMeta.learningExperience?.milestones,
    );

    const lessonMinutes = flatLessons.map((l) => ({
      durationMinutes: l.durationMinutes,
    }));
    const estimatedActiveMinutes = sumLessonActiveMinutes(lessonMinutes);

    const completionRoadmap = resolveCompletionRoadmap(
      course.slug,
      contentMeta.learningExperience?.completionRoadmap,
    );

    return {
      course: {
        slug: course.slug,
        title: course.title,
        ceHours: Number(course.ceHours),
        estimatedActiveMinutes,
      },
      participation,
      learningExperience: {
        tone: 'professional_healthcare' as const,
        encouragement: encouragementForProgress(progressPct),
        milestones,
        completionRoadmap,
        examMessaging: contentMeta.examBlueprint?.messaging ?? null,
      },
      enrollment: {
        id: enrollment.id,
        progressPct,
        totalLessons,
        completedLessons,
        learnerState: deriveLearnerState({ status: enrollment.status, progressPct }),
        resumeLessonSlug: resumeSlug,
      },
      modules: version.modules.map((mod) => ({
        id: mod.id,
        slug: mod.slug,
        title: mod.title,
        lessons: mod.lessons.map((lesson) => {
          const lp = progressMap.get(lesson.id);
          return this.mapLessonForPlayer(lesson, lp);
        }),
      })),
      currentLesson: current
        ? {
            id: current.id,
            slug: current.slug,
            moduleSlug: current.moduleSlug,
            moduleTitle: current.moduleTitle,
            title: current.title,
            durationMinutes: current.durationMinutes,
            content: current.content ?? { type: 'text' },
            status:
              progressMap.get(current.id)?.status ?? LessonProgressStatus.NOT_STARTED,
          }
        : null,
    };
  }

  private mapLessonForPlayer(
    lesson: {
      id: string;
      slug: string;
      title: string;
      durationMinutes: number | null;
      content: unknown;
    },
    lp?: import('../progress/progress.service').LessonProgressEntry,
  ) {
    const rawContent = lesson.content ?? {};
    const metadata = (lp?.metadata ?? {}) as Record<string, unknown>;
    const blockProgress = parseBlockProgress(metadata.blockProgress);

    if (isBlockDocument(rawContent)) {
      return {
        id: lesson.id,
        slug: lesson.slug,
        title: lesson.title,
        durationMinutes: lesson.durationMinutes,
        videoUrl: this.extractVideoUrl(rawContent),
        content: rawContent,
        contentFormat: 'blocks' as const,
        blockProgress,
        status: lp?.status ?? LessonProgressStatus.NOT_STARTED,
        progressPct: Number(lp?.progressPct ?? 0),
        completedAt: lp?.completedAt ?? null,
      };
    }

    const content = this.normalizeLegacyContent(rawContent, lesson.title);
    return {
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      durationMinutes: lesson.durationMinutes,
      videoUrl: (rawContent as CmsCatalogLessonContent).videoUrl ?? null,
      content,
      contentFormat: 'legacy' as const,
      blockProgress: null,
      status: lp?.status ?? LessonProgressStatus.NOT_STARTED,
      progressPct: Number(lp?.progressPct ?? 0),
      completedAt: lp?.completedAt ?? null,
    };
  }

  private normalizeLegacyContent(raw: unknown, lessonTitle: string): LessonContentPayload {
    const content = (raw ?? {}) as CmsCatalogLessonContent;

    if (content.type && (content.body?.trim() || content.caption || content.placeholderNote)) {
      return {
        type: content.type,
        title: content.title ?? lessonTitle,
        body: content.body,
        caption: content.caption,
        placeholderNote: content.placeholderNote,
      };
    }

    const bodyFromBlocks = (content.readingBlocks ?? [])
      .map((block) => [block.title, block.content].filter(Boolean).join('\n\n'))
      .filter(Boolean)
      .join('\n\n');

    const body = (content.body?.trim() || bodyFromBlocks || '').trim();
    const type: LessonContentType = content.videoUrl ? 'video' : (content.type ?? 'text');

    return {
      type,
      title: content.title ?? lessonTitle,
      body: body || undefined,
      caption: content.caption,
      placeholderNote: content.placeholderNote,
    };
  }

  private extractVideoUrl(content: { blocks: { type: string; videoUrl?: string | null }[] }) {
    const video = content.blocks.find(
      (block): block is VideoBlock => block.type === 'video' && Boolean(block.videoUrl),
    );
    return video?.videoUrl ?? null;
  }
}
