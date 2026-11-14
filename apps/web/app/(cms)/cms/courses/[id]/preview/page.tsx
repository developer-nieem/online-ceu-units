import { notFound, redirect } from 'next/navigation';

import {
  firstPreviewLessonId,
  getCmsCoursePreview,
} from '@/lib/cms/preview-data';

export default async function CmsCoursePreviewIndexPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const preview = await getCmsCoursePreview(id);
  if (!preview) notFound();

  const firstLessonId = firstPreviewLessonId(preview.modules);
  if (!firstLessonId) {
    return (
      <div className="space-y-4">
        <p className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          CMS PREVIEW — DRAFT v{preview.versionNumber} — not visible to learners, interactions are
          not recorded
        </p>
        <p className="text-sm text-muted-foreground">
          This course has no lessons yet. Add lessons in the{' '}
          <a href={`/cms/courses/${id}`} className="text-teal-800 underline">
            course workspace
          </a>
          .
        </p>
      </div>
    );
  }

  redirect(`/cms/courses/${id}/preview/${firstLessonId}`);
}
