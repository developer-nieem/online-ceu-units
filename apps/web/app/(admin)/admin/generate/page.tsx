import Link from 'next/link';

import { CourseGeneratorForm } from '@/components/admin/course-generator-form';

export default function AdminGenerateCoursePage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-teal-800 underline">
          ← Operations overview
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Generate Course with AI</h1>
        <p className="mt-1 text-sm text-slate-600">
          Create a DRAFT course from the AI Course Factory. Review and approve in CMS before
          publishing.
        </p>
      </div>
      <CourseGeneratorForm />
    </div>
  );
}
