'use client';

import { BookOpen, FileQuestion, LayoutDashboard, PlusCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/cms', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/cms/courses', label: 'Courses', icon: BookOpen },
  { href: '/cms/courses/new', label: 'New course', icon: PlusCircle },
  { href: '/cms/courses/generate', label: 'AI generate', icon: Sparkles },
];

export function CmsSidebar() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1 text-sm">
      <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Content CMS
      </p>
      {NAV.map((item) => {
        const active =
          item.href === '/cms'
            ? pathname === '/cms'
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 rounded-md px-3 py-2 ${
              active
                ? 'bg-teal-50 font-medium text-teal-900'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {item.label}
          </Link>
        );
      })}
      <p className="mt-6 px-3 text-xs text-slate-500">
        <FileQuestion className="mb-1 inline h-3 w-3" aria-hidden /> Exam questions are edited per
        course under Assessments.
      </p>
    </nav>
  );
}
