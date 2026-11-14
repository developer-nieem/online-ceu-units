import { notFound } from 'next/navigation';

import { CmsPreviewView } from '@/components/cms/preview/cms-preview-view';
import { findPreviewLesson, getCmsCoursePreview } from '@/lib/cms/preview-data';

export default async function CmsCoursePreviewLessonPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const { id, lessonId } = await params;
  const preview = await getCmsCoursePreview(id);
  if (!preview) notFound();

  const lesson = findPreviewLesson(preview.modules, lessonId);
  if (!lesson) notFound();

  return <CmsPreviewView preview={preview} lessonId={lessonId} />;
}
