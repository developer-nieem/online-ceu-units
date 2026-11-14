import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  allRequiredBlocksComplete,
  applyBlockProgressEvent,
  computeLessonProgressPct,
  isBlockDocument,
  parseBlockProgress,
  type BlockProgressEvent,
  type LessonBlockProgress,
} from '@calace/content-blocks';
import {
  CompletionStatus,
  ContentPublishStatus,
  EnrollmentStatus,
  LessonProgressStatus,
  Prisma,
} from '@calace/db';

import type { AuthUser } from '../auth/types/auth-user.type';
import { ParticipationService } from '../participation/participation.service';
import { PrismaService } from '../prisma/prisma.service';
import { deriveLearnerState } from '../enrollments/learner-state';

export type EnrollmentMeta = {
  progressPct?: number;
  lastLessonId?: string;
  lastLessonSlug?: string;
  lastModuleSlug?: string;
  lastViewedAt?: string;
  purchasePlan?: string;
  orderId?: string;
  viaSubscription?: boolean;
  freeEnrollment?: boolean;
};

export type LessonProgressEntry = {
  lessonId: string;
  lessonSlug: string;
  moduleSlug: string;
  status: LessonProgressStatus;
  progressPct: number;
  startedAt: string | null;
  completedAt: string | null;
  metadata: unknown;
};

/** Placeholder lessons that route to the assessment — not marked complete via the lesson player. */
export const EXAM_GATE_LESSON_SLUGS = ['final-exam', 'final-review'] as const;

export function isExamGateLessonSlug(slug: string): boolean {
  return (EXAM_GATE_LESSON_SLUGS as readonly string[]).includes(slug);
}

@Injectable()
export class ProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly participation: ParticipationService,
  ) {}

  async countPublishedLessons(courseVersionId: string) {
    return this.prisma.lesson.count({
      where: {
        deletedAt: null,
        status: ContentPublishStatus.PUBLISHED,
        slug: { notIn: [...EXAM_GATE_LESSON_SLUGS] },
        module: { courseVersionId, deletedAt: null, status: ContentPublishStatus.PUBLISHED },
      },
    });
  }

  async getLessonProgressMap(enrollmentId: string): Promise<Map<string, LessonProgressEntry>> {
    const rows = await this.prisma.lessonProgress.findMany({
      where: { enrollmentId },
      include: {
        lesson: { include: { module: true } },
      },
    });

    const map = new Map<string, LessonProgressEntry>();
    for (const row of rows) {
      map.set(row.lessonId, {
        lessonId: row.lessonId,
        lessonSlug: row.lesson.slug,
        moduleSlug: row.lesson.module.slug,
        status: row.status,
        progressPct: Number(row.progressPct),
        startedAt: row.startedAt?.toISOString() ?? null,
        completedAt: row.completedAt?.toISOString() ?? null,
        metadata: row.metadata,
      });
    }
    return map;
  }

  async computeProgressPct(enrollmentId: string, courseVersionId: string) {
    const total = await this.countPublishedLessons(courseVersionId);
    if (total === 0) return 0;

    const completed = await this.prisma.lessonProgress.count({
      where: {
        enrollmentId,
        status: LessonProgressStatus.COMPLETED,
        lesson: {
          slug: { notIn: [...EXAM_GATE_LESSON_SLUGS] },
        },
      },
    });

    return Math.round((completed / total) * 100);
  }

  async syncEnrollmentProgress(enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        courseVersion: { include: { course: true } },
        completions: { include: { certificate: true } },
      },
    });

    if (!enrollment) throw new NotFoundException('Enrollment not found');

    const progressPct = await this.computeProgressPct(
      enrollmentId,
      enrollment.courseVersionId,
    );
    const meta = (enrollment.metadata ?? {}) as EnrollmentMeta;
    const now = new Date();

    const data: Prisma.EnrollmentUpdateInput = {
      metadata: { ...meta, progressPct },
      startedAt: enrollment.startedAt ?? (progressPct > 0 ? now : undefined),
    };

    if (progressPct >= 100) {
      data.metadata = {
        ...meta,
        progressPct,
        allLessonsViewedComplete: true,
        note: 'Course completion requires passing the final exam (see Assessments API).',
      };
    }

    return this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data,
      include: { courseVersion: { include: { course: true } } },
    });
  }

  async recordLessonView(
    user: AuthUser,
    enrollmentId: string,
    lessonId: string,
  ): Promise<LessonProgressEntry> {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { id: enrollmentId, userId: user.userId, deletedAt: null },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, deletedAt: null },
      include: { module: true },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');

    const now = new Date();
    const existing = await this.prisma.lessonProgress.findUnique({
      where: { enrollmentId_lessonId: { enrollmentId, lessonId } },
    });

    const row = await this.prisma.lessonProgress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId, lessonId } },
      create: {
        enrollmentId,
        lessonId,
        userId: user.userId,
        status:
          existing?.status === LessonProgressStatus.COMPLETED
            ? LessonProgressStatus.COMPLETED
            : LessonProgressStatus.IN_PROGRESS,
        progressPct: existing?.status === LessonProgressStatus.COMPLETED ? 100 : 50,
        startedAt: now,
        lastPosition: { viewedAt: now.toISOString() },
      },
      update: {
        status:
          existing?.status === LessonProgressStatus.COMPLETED
            ? LessonProgressStatus.COMPLETED
            : LessonProgressStatus.IN_PROGRESS,
        lastPosition: { viewedAt: now.toISOString() },
        startedAt: existing?.startedAt ?? now,
      },
      include: { lesson: { include: { module: true } } },
    });

    const meta = (enrollment.metadata ?? {}) as EnrollmentMeta;
    await this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        metadata: {
          ...meta,
          lastLessonId: lessonId,
          lastLessonSlug: lesson.slug,
          lastModuleSlug: lesson.module.slug,
          lastViewedAt: now.toISOString(),
        },
      },
    });

    await this.participation.recordInteractionEvidence(
      enrollmentId,
      'lesson_view',
      lessonId,
    );
    await this.syncEnrollmentProgress(enrollmentId);

    return {
      lessonId: row.lessonId,
      lessonSlug: row.lesson.slug,
      moduleSlug: row.lesson.module.slug,
      status: row.status,
      progressPct: Number(row.progressPct),
      startedAt: row.startedAt?.toISOString() ?? null,
      completedAt: row.completedAt?.toISOString() ?? null,
      metadata: row.metadata,
    };
  }

  async recordBlockProgress(
    user: AuthUser,
    enrollmentId: string,
    lessonId: string,
    event: BlockProgressEvent,
  ): Promise<{
    blockProgress: LessonBlockProgress;
    progressPct: number;
    lessonStatus: LessonProgressStatus;
    canComplete: boolean;
  }> {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { id: enrollmentId, userId: user.userId, deletedAt: null },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, deletedAt: null },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');

    const row = await this.prisma.lessonProgress.findUnique({
      where: { enrollmentId_lessonId: { enrollmentId, lessonId } },
    });

    const metadata = (row?.metadata ?? {}) as Record<string, unknown>;
    let blockProgress = parseBlockProgress(metadata.blockProgress);
    blockProgress = applyBlockProgressEvent(blockProgress, event);

    const content = lesson.content;
    let progressPct = Number(row?.progressPct ?? 0);
    let canComplete = false;

    if (isBlockDocument(content)) {
      progressPct = computeLessonProgressPct(content, blockProgress);
      canComplete = allRequiredBlocksComplete(content, blockProgress);
    } else {
      progressPct = Math.max(progressPct, blockProgress.blocks[event.blockId]?.viewed ? 50 : 10);
      canComplete = progressPct >= 50;
    }

    const now = new Date();
    const status =
      row?.status === LessonProgressStatus.COMPLETED
        ? LessonProgressStatus.COMPLETED
        : progressPct >= 100 && canComplete
          ? LessonProgressStatus.IN_PROGRESS
          : LessonProgressStatus.IN_PROGRESS;

    await this.prisma.lessonProgress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId, lessonId } },
      create: {
        enrollmentId,
        lessonId,
        userId: user.userId,
        status: LessonProgressStatus.IN_PROGRESS,
        progressPct,
        startedAt: now,
        metadata: { blockProgress },
        lastPosition: { lastBlockId: event.blockId, updatedAt: now.toISOString() },
      },
      update: {
        progressPct,
        status,
        metadata: { ...metadata, blockProgress },
        lastPosition: { lastBlockId: event.blockId, updatedAt: now.toISOString() },
        startedAt: row?.startedAt ?? now,
      },
    });

    await this.participation.recordInteractionEvidence(
      enrollmentId,
      'block_progress',
      lessonId,
      { blockId: event.blockId, eventType: event.type },
    );

    return {
      blockProgress,
      progressPct,
      lessonStatus: status,
      canComplete,
    };
  }

  async completeLesson(user: AuthUser, enrollmentId: string, lessonId: string) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { id: enrollmentId, userId: user.userId, deletedAt: null },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, deletedAt: null },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');

    if (isBlockDocument(lesson.content)) {
      const existing = await this.prisma.lessonProgress.findUnique({
        where: { enrollmentId_lessonId: { enrollmentId, lessonId } },
      });
      const blockProgress = parseBlockProgress(
        (existing?.metadata as Record<string, unknown> | undefined)?.blockProgress,
      );
      if (!allRequiredBlocksComplete(lesson.content, blockProgress)) {
        throw new BadRequestException(
          'Complete required lesson interactions before marking this lesson complete.',
        );
      }
    }

    const now = new Date();
    const row = await this.prisma.lessonProgress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId, lessonId } },
      create: {
        enrollmentId,
        lessonId,
        userId: user.userId,
        status: LessonProgressStatus.COMPLETED,
        progressPct: 100,
        startedAt: now,
        completedAt: now,
      },
      update: {
        status: LessonProgressStatus.COMPLETED,
        progressPct: 100,
        completedAt: now,
        startedAt: now,
      },
      include: { lesson: { include: { module: true } } },
    });

    await this.participation.recordInteractionEvidence(
      enrollmentId,
      'lesson_view',
      lessonId,
      { completed: true },
    );
    await this.syncEnrollmentProgress(enrollmentId);

    return {
      lessonId: row.lessonId,
      lessonSlug: row.lesson.slug,
      moduleSlug: row.lesson.module.slug,
      status: row.status,
      progressPct: 100,
      startedAt: row.startedAt?.toISOString() ?? null,
      completedAt: row.completedAt?.toISOString() ?? null,
    };
  }

  async getResumeLessonSlug(enrollmentId: string, courseVersionId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
    });
    if (!enrollment) return null;

    const meta = (enrollment.metadata ?? {}) as EnrollmentMeta;
    if (meta.lastLessonSlug) return meta.lastLessonSlug;

    const lessons = await this.prisma.lesson.findMany({
      where: {
        deletedAt: null,
        status: ContentPublishStatus.PUBLISHED,
        module: { courseVersionId, deletedAt: null },
      },
      orderBy: [{ module: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
      include: { module: true },
    });

    const progress = await this.prisma.lessonProgress.findMany({
      where: { enrollmentId },
    });
    const completedIds = new Set(
      progress
        .filter((p) => p.status === LessonProgressStatus.COMPLETED)
        .map((p) => p.lessonId),
    );

    const next = lessons.find((l) => !completedIds.has(l.id));
    return next?.slug ?? lessons[0]?.slug ?? null;
  }

  async getProgressSummary(user: AuthUser) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId: user.userId, tenantId: user.tenantId, deletedAt: null },
      include: {
        courseVersion: { include: { course: true } },
        completions: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    let totalCeuEarned = 0;
    const active: Array<{
      courseSlug: string;
      courseTitle: string;
      progressPct: number;
      learnerState: ReturnType<typeof deriveLearnerState>;
      resumeLessonSlug: string | null;
      completedLessons: number;
      totalLessons: number;
    }> = [];

    const recentlyCompleted: Array<{
      enrollmentId: string;
      courseSlug: string;
      courseTitle: string;
      completedAt: string;
      ceHours: number;
    }> = [];

    for (const e of enrollments) {
      const totalLessons = await this.countPublishedLessons(e.courseVersionId);
      const completedLessons = await this.prisma.lessonProgress.count({
        where: { enrollmentId: e.id, status: LessonProgressStatus.COMPLETED },
      });
      const progressPct = await this.computeProgressPct(e.id, e.courseVersionId);
      const learnerState = deriveLearnerState({
        status: e.status,
        progressPct,
      });

      if (e.status === EnrollmentStatus.COMPLETED || progressPct >= 100) {
        recentlyCompleted.push({
          enrollmentId: e.id,
          courseSlug: e.courseVersion.course.slug,
          courseTitle: e.courseVersion.course.title,
          completedAt: (e.completedAt ?? e.updatedAt).toISOString(),
          ceHours: Number(e.courseVersion.ceHours),
        });
        totalCeuEarned += Number(e.courseVersion.ceHours);
      } else if (e.status === EnrollmentStatus.ACTIVE) {
        active.push({
          courseSlug: e.courseVersion.course.slug,
          courseTitle: e.courseVersion.course.title,
          progressPct,
          learnerState,
          resumeLessonSlug: await this.getResumeLessonSlug(e.id, e.courseVersionId),
          completedLessons,
          totalLessons,
        });
      }
    }

    // Deduplicate by courseSlug — a learner may have multiple active enrollments
    // for the same course (e.g. from testing). Keep the entry with highest progress.
    const deduplicatedActive = Array.from(
      active.reduce((map, entry) => {
        const existing = map.get(entry.courseSlug);
        if (!existing || entry.progressPct > existing.progressPct) {
          map.set(entry.courseSlug, entry);
        }
        return map;
      }, new Map<string, (typeof active)[number]>())
    ).map(([, v]) => v);

    return {
      activeCourses: deduplicatedActive,
      recentlyCompleted: recentlyCompleted.slice(0, 5),
      completedCoursesCount: recentlyCompleted.length,
      milestoneBadgesEarned: Math.floor(recentlyCompleted.length / 3),
      ceuHoursEarned: totalCeuEarned,
      ceuHoursEarnedNote: 'Placeholder — pending compliance verification',
    };
  }
}
