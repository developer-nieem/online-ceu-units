'use client';

import {
  allRequiredBlocksComplete,
  isBlockDocument,
  type LessonBlockProgress,
  type LessonContentDocument,
} from '@calace/content-blocks';
import { Progress } from '@calace/ui/components/ui/progress';
import { useCallback, useEffect, useRef, useState } from 'react';

import { recordBlockProgress, type PlayerLesson } from '@/lib/player';
import { ContentBlockView } from './blocks/content-block';

type BlockEventParams = {
  eventType: 'block_viewed' | 'interaction_completed' | 'knowledge_check_answered';
  blockId: string;
  selectedOptionId?: string;
  correct?: boolean;
  reflectionText?: string;
};

export function LessonBlocksPlayer({
  lesson,
  courseSlug,
  lessonSlug,
  enrollmentId,
  onProgressUpdate,
  onInteraction,
  onVideoPlayingChange,
  onAudioPlayingChange,
}: {
  lesson: PlayerLesson;
  courseSlug: string;
  lessonSlug: string;
  enrollmentId: string;
  onProgressUpdate?: (pct: number, canComplete: boolean) => void;
  onInteraction?: () => void;
  onVideoPlayingChange?: (playing: boolean) => void;
  onAudioPlayingChange?: (playing: boolean) => void;
}) {
  const content = lesson.content as LessonContentDocument;
  const [blockProgress, setBlockProgress] = useState<LessonBlockProgress>(
    lesson.blockProgress ?? { blocks: {} },
  );
  const [lessonPct, setLessonPct] = useState(lesson.progressPct);
  const [canComplete, setCanComplete] = useState(
    allRequiredBlocksComplete(content, lesson.blockProgress ?? { blocks: {} }),
  );
  const eventQueueRef = useRef<Promise<void>>(Promise.resolve());

  const sendEvent = useCallback(
    (params: BlockEventParams): Promise<{ ok: true } | { ok: false; error: string }> => {
      onInteraction?.();

      const run = eventQueueRef.current.then(async () => {
        const result = await recordBlockProgress({
          courseSlug,
          lessonSlug,
          enrollmentId,
          lessonId: lesson.id,
          ...params,
        });

        if (result.data) {
          setBlockProgress(result.data.blockProgress);
          setLessonPct(result.data.progressPct);
          setCanComplete(result.data.canComplete);
          onProgressUpdate?.(result.data.progressPct, result.data.canComplete);
          return { ok: true as const };
        }

        return {
          ok: false as const,
          error: result.error ?? 'Request failed. Please try again.',
        };
      });

      // Keep the queue alive after failure so later events still send.
      eventQueueRef.current = run.then(
        () => undefined,
        () => undefined,
      );

      return run.catch(() => ({
        ok: false as const,
        error: 'Request failed. Please try again.',
      }));
    },
    [courseSlug, lessonSlug, enrollmentId, lesson.id, onInteraction, onProgressUpdate],
  );

  useEffect(() => {
    setBlockProgress(lesson.blockProgress ?? { blocks: {} });
    setLessonPct(lesson.progressPct);
    setCanComplete(
      allRequiredBlocksComplete(content, lesson.blockProgress ?? { blocks: {} }),
    );
  }, [content, lesson.blockProgress, lesson.id, lesson.progressPct]);

  const onViewed = useCallback(
    (blockId: string) => {
      if (blockProgress.blocks[blockId]?.viewed) return;
      sendEvent({ eventType: 'block_viewed', blockId });
    },
    [blockProgress.blocks, sendEvent],
  );

  if (!isBlockDocument(lesson.content)) return null;

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Lesson progress</span>
          <span>{Math.round(lessonPct)}%</span>
        </div>
        <Progress value={lessonPct} aria-label="Lesson block progress" />
        {!canComplete ? (
          <p className="text-xs text-muted-foreground">
            Complete required interactions to enable lesson completion.
          </p>
        ) : null}
      </div>

      {content.blocks.map((block) => (
        <ContentBlockView
          key={block.id}
          block={block}
          progress={blockProgress}
          onViewed={onViewed}
          onInteraction={(params) => sendEvent(params)}
          onVideoPlayingChange={onVideoPlayingChange}
          onAudioPlayingChange={onAudioPlayingChange}
        />
      ))}
    </div>
  );
}
