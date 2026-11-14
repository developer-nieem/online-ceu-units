'use client';

import {
  allRequiredBlocksComplete,
  applyBlockProgressEvent,
  computeLessonProgressPct,
  isBlockDocument,
  type LessonBlockProgress,
  type LessonContentDocument,
} from '@calace/content-blocks';
import { Progress } from '@calace/ui/components/ui/progress';
import { useCallback, useState } from 'react';

import type { PlayerLesson } from '@/lib/player';
import { ContentBlockView } from '@/components/player/blocks/content-block';

type BlockEventParams = {
  eventType: 'block_viewed' | 'interaction_completed' | 'knowledge_check_answered';
  blockId: string;
  selectedOptionId?: string;
  correct?: boolean;
  reflectionText?: string;
};

export function PreviewLessonBlocksPlayer({ lesson }: { lesson: PlayerLesson }) {
  const content = lesson.content as LessonContentDocument;
  const [blockProgress, setBlockProgress] = useState<LessonBlockProgress>(
    lesson.blockProgress ?? { blocks: {} },
  );
  const [lessonPct, setLessonPct] = useState(lesson.progressPct);
  const [canComplete, setCanComplete] = useState(
    allRequiredBlocksComplete(content, lesson.blockProgress ?? { blocks: {} }),
  );

  const applyEvent = useCallback(
    (params: BlockEventParams) => {
      const event =
        params.eventType === 'block_viewed'
          ? ({ type: 'block_viewed' as const, blockId: params.blockId })
          : params.eventType === 'knowledge_check_answered'
            ? ({
                type: 'knowledge_check_answered' as const,
                blockId: params.blockId,
                selectedOptionId: params.selectedOptionId ?? '',
                correct: params.correct ?? false,
              })
            : ({
                type: 'interaction_completed' as const,
                blockId: params.blockId,
                selectedOptionId: params.selectedOptionId,
                correct: params.correct,
                reflectionText: params.reflectionText,
              });

      setBlockProgress((prev) => {
        const next = applyBlockProgressEvent(prev, event);
        setLessonPct(computeLessonProgressPct(content, next));
        setCanComplete(allRequiredBlocksComplete(content, next));
        return next;
      });
    },
    [content],
  );

  const onViewed = useCallback(
    (blockId: string) => {
      if (blockProgress.blocks[blockId]?.viewed) return;
      applyEvent({ eventType: 'block_viewed', blockId });
    },
    [applyEvent, blockProgress.blocks],
  );

  if (!isBlockDocument(lesson.content)) return null;

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Lesson progress (preview only)</span>
          <span>{Math.round(lessonPct)}%</span>
        </div>
        <Progress value={lessonPct} aria-label="Lesson block progress preview" />
        {!canComplete ? (
          <p className="text-xs text-muted-foreground">
            Complete required interactions to reach 100% in this preview session.
          </p>
        ) : null}
      </div>

      {content.blocks.map((block) => (
        <ContentBlockView
          key={block.id}
          block={block}
          progress={blockProgress}
          onViewed={onViewed}
          onInteraction={(params) =>
            applyEvent({
              eventType: params.eventType,
              blockId: params.blockId,
              selectedOptionId: params.selectedOptionId,
              correct: params.correct,
              reflectionText: params.reflectionText,
            })
          }
        />
      ))}
    </div>
  );
}
