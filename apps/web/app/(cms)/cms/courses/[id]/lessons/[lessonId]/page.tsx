import Link from 'next/link';
import { notFound } from 'next/navigation';

import { CmsLessonEditor } from '@/components/cms/cms-lesson-editor';
import { getCmsLesson } from '@/lib/cms-server';

export default async function CmsLessonEditorPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const { id, lessonId } = await params;
  const lesson = await getCmsLesson(lessonId);
  if (!lesson) notFound();

  return (
    <div className="space-y-4">
      <Link href={`/cms/courses/${id}`} className="text-sm text-teal-800 underline">
        ← Back to course
      </Link>
      <CmsLessonEditor lesson={lesson} />
    </div>
  );
}
