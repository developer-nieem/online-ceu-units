import { notFound } from 'next/navigation';

import { CmsCourseWorkspace } from '@/components/cms/cms-course-workspace';
import { getCmsCategories, getCmsCourse } from '@/lib/cms-server';

export default async function CmsCourseEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [course, categories] = await Promise.all([
    getCmsCourse(id),
    getCmsCategories(),
  ]);

  if (!course) notFound();

  return (
    <CmsCourseWorkspace
      course={course}
      categories={categories ?? []}
    />
  );
}
