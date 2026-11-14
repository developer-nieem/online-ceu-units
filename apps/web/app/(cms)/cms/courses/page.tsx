import Link from 'next/link';

import { formatOnlineCeuHours } from '@/lib/ceu-display';
import { getCmsCourses } from '@/lib/cms-server';

export default async function CmsCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const params = await searchParams;
  const courses = (await getCmsCourses(params)) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Courses</h1>
          <p className="text-sm text-slate-600">Manage catalog metadata, structure, and publishing.</p>
        </div>
        <Link
          href="/cms/courses/new"
          className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
        >
          New course
        </Link>
      </div>

      <form className="flex flex-wrap gap-2" method="get">
        <input
          name="search"
          defaultValue={params.search ?? ''}
          placeholder="Search title or slug"
          className="rounded-md border px-3 py-2 text-sm"
        />
        <select name="status" defaultValue={params.status ?? ''} className="rounded-md border px-3 py-2 text-sm">
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="REVIEW">Review</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <button type="submit" className="rounded-md border px-4 py-2 text-sm hover:bg-slate-50">
          Filter
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">CE hours</th>
              <th className="px-4 py-3">Version</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{c.title}</p>
                  <p className="text-xs text-slate-500">{c.slug}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{c.status}</span>
                </td>
                <td className="px-4 py-3">{formatOnlineCeuHours(c.ceHours)}</td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {c.latestVersion
                    ? `v${c.latestVersion.versionNumber} · ${c.latestVersion.status}`
                    : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/cms/courses/${c.id}`} className="text-teal-800 underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {courses.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">No courses match your filters.</p>
        ) : null}
      </div>
    </div>
  );
}
