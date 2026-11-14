'use client';

import { isBlockDocument } from '@calace/content-blocks';

import { LessonContentRenderer } from '@/components/player/lesson-content-renderer';
import type { PlayerLesson } from '@/lib/player';

import { PreviewLessonBlocksPlayer } from './preview-lesson-blocks-player';

export function CmsPreviewLessonContent({
  lesson,
  courseSlug,
}: {
  lesson: PlayerLesson;
  courseSlug: string;
}) {
  if (isBlockDocument(lesson.content)) {
    return <PreviewLessonBlocksPlayer lesson={lesson} />;
  }

  return (
    <LessonContentRenderer
      lesson={lesson}
      courseSlug={courseSlug}
      lessonSlug={lesson.slug}
      enrollmentId="cms-preview"
    />
  );
}
