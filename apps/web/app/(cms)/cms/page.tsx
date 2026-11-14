import Link from 'next/link';

import { getCmsDashboard } from '@/lib/cms-server';

export default async function CmsDashboardPage() {
  const stats = (await getCmsDashboard()) ?? {
    total: 0,
    published: 0,
    draft: 0,
    review: 0,
    archived: 0,
  };

  const cards = [
    { label: 'Total courses', value: stats.total, href: '/cms/courses' },
    { label: 'Published', value: stats.published, href: '/cms/courses?status=PUBLISHED' },
    { label: 'Draft', value: stats.draft, href: '/cms/courses?status=DRAFT' },
    { label: 'In review', value: stats.review, href: '/cms/courses?status=REVIEW' },
    { label: 'Archived', value: stats.archived, href: '/cms/courses?status=ARCHIVED' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Content dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Author California CNA online CEU courses, manage versions, and publish to the learner
          catalog.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold text-teal-800">{card.value}</p>
          </Link>
        ))}
      </div>

      <section className="rounded-xl border bg-white p-6">
        <h2 className="text-lg font-medium">Publishing workflow</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-600">
          <li>Create or open a course in Draft — edits apply to the current draft version only.</li>
          <li>Build modules, lessons, and content blocks; configure final exam question bank.</li>
          <li>Submit for Review when content is ready for internal QA.</li>
          <li>Publish — learners see the new version; prior published versions are retired for new enrollments.</li>
        </ol>
        <p className="mt-4 text-xs text-slate-500">
          Completions remain tied to the course version the learner enrolled in (immutable audit
          trail).
        </p>
      </section>
    </div>
  );
}
