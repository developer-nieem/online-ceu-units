import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@calace/db';
import {
  isBlockDocument,
  type ContentBlock,
  type LessonContentDocument,
  type VideoBlock,
} from '@calace/content-blocks';

import { PrismaService } from '../../prisma/prisma.service';
import { CmsBaseService } from '../cms-base.service';
import type { CmsCourseContentMeta } from '../types/cms-metadata.types';

/** Demo MP4 used until a production video provider (Synthesia, HeyGen, etc.) is configured. */
const PLACEHOLDER_VIDEO_URLS = [
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
] as const;

export type GeneratedVideoAsset = {
  blockId: string;
  lessonId: string;
  lessonSlug: string;
  title: string;
  videoUrl: string;
  provider: 'placeholder' | 'synthesia' | 'heygen';
  scriptTitle?: string;
};

@Injectable()
export class CmsAiVideoService extends CmsBaseService {
  private readonly logger = new Logger(CmsAiVideoService.name);

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  /**
   * Attach AI-generated (or placeholder) video URLs to lesson video blocks
   * based on media prompts stored during course seeding.
   */
  async attachVideosForCourseVersion(
    courseVersionId: string,
    options?: { provider?: 'placeholder' | 'synthesia' | 'heygen' },
  ): Promise<{ updatedLessonCount: number; assets: GeneratedVideoAsset[] }> {
    const version = await this.prisma.courseVersion.findUnique({
      where: { id: courseVersionId },
      include: {
        modules: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
          include: {
            lessons: {
              where: { deletedAt: null },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
        course: { select: { slug: true, title: true } },
      },
    });
    if (!version) throw new NotFoundException('Course version not found');

    const meta = (version.contentMeta ?? {}) as CmsCourseContentMeta;
    const scripts = meta.mediaPrompts?.miniVideoScripts ?? [];
    const provider = options?.provider ?? this.resolveProvider(meta);

    const assets: GeneratedVideoAsset[] = [];
    let updatedLessonCount = 0;
    let scriptIndex = 0;

    for (const module of version.modules) {
      for (const lesson of module.lessons) {
        const rawContent: unknown = lesson.content;
        if (!isBlockDocument(rawContent)) continue;
        const content: LessonContentDocument = rawContent;

        let lessonUpdated = false;
        const blocks = content.blocks.map((block) => {
          if (block.type !== 'video') return block;

          const script = scripts[scriptIndex] ?? scripts[0];
          scriptIndex += 1;
          const videoUrl = this.resolveVideoUrl(provider, scriptIndex - 1, lesson.slug);
          const updated: VideoBlock = {
            ...block,
            videoUrl,
            placeholderNote:
              provider === 'placeholder'
                ? 'AI video placeholder — replace with approved recording before production publish.'
                : `AI-generated video (${provider}) — instructor approval required.`,
            meta: {
              ...(block.meta ?? {}),
              aiVideoGenerated: true,
              aiVideoProvider: provider,
              aiVideoScriptTitle: script?.title,
            },
          };

          assets.push({
            blockId: block.id,
            lessonId: lesson.id,
            lessonSlug: lesson.slug,
            title: block.title ?? script?.title ?? lesson.title,
            videoUrl,
            provider,
            scriptTitle: script?.title,
          });
          lessonUpdated = true;
          return updated;
        });

        if (lessonUpdated) {
          await this.prisma.lesson.update({
            where: { id: lesson.id },
            data: {
              content: {
                ...content,
                blocks,
              } as Prisma.InputJsonValue,
            },
          });
          updatedLessonCount += 1;
        }
      }
    }

    const existingMeta = meta;
    await this.prisma.courseVersion.update({
      where: { id: courseVersionId },
      data: {
        contentMeta: {
          ...existingMeta,
          aiVideoPipeline: {
            lastRunAt: new Date().toISOString(),
            provider,
            assetCount: assets.length,
            assets: assets.map((a) => ({
              blockId: a.blockId,
              lessonSlug: a.lessonSlug,
              videoUrl: a.videoUrl,
            })),
          },
        } as Prisma.InputJsonValue,
      },
    });

    this.logger.log(
      `Attached ${assets.length} video asset(s) across ${updatedLessonCount} lesson(s) for version ${courseVersionId}`,
    );

    return { updatedLessonCount, assets };
  }

  async attachVideosForCourse(courseId: string) {
    const tenantId = await this.getTenantId();
    const course = await this.getCourseForTenant(courseId, tenantId);
    const version = await this.prisma.courseVersion.findFirst({
      where: { courseId: course.id, deletedAt: null },
      orderBy: { versionNumber: 'desc' },
    });
    if (!version) throw new NotFoundException('No course version found');
    return this.attachVideosForCourseVersion(version.id);
  }

  private resolveProvider(meta: CmsCourseContentMeta): 'placeholder' | 'synthesia' | 'heygen' {
    const hook = meta.aiGeneration?.integrationHooks as
      | { videoGeneration?: { enabled?: boolean; provider?: string } }
      | undefined;
    const configured = hook?.videoGeneration?.provider;
    if (configured === 'synthesia' || configured === 'heygen') return configured;
    return 'placeholder';
  }

  private resolveVideoUrl(
    provider: 'placeholder' | 'synthesia' | 'heygen',
    index: number,
    lessonSlug: string,
  ): string {
    if (provider !== 'placeholder') {
      const envKey =
        provider === 'synthesia'
          ? process.env.SYNTHESIA_DEMO_VIDEO_URL
          : process.env.HEYGEN_DEMO_VIDEO_URL;
      if (envKey?.trim()) return envKey.trim();
    }
    const poolIndex = (index + lessonSlug.length) % PLACEHOLDER_VIDEO_URLS.length;
    return PLACEHOLDER_VIDEO_URLS[poolIndex] || '';
  }

  private firstVideoUrl(blocks: ContentBlock[]): string | null {
    const video = blocks.find((b): b is VideoBlock => b.type === 'video' && Boolean(b.videoUrl));
    return video?.videoUrl ?? null;
  }
}
