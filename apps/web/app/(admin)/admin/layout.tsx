import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { getServerSession } from '@/lib/auth-server';
import { isAdmin } from '@/lib/admin-auth';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession();

  if (session.error || !session.data) {
    redirect('/login?next=/admin');
  }

  if (!isAdmin(session.data.user.roles)) {
    redirect('/dashboard');
  }

  const name =
    [session.data.user.firstName, session.data.user.lastName].filter(Boolean).join(' ') ||
    session.data.user.email;

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b bg-slate-900 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              CAL ACE · Operations
            </p>
            <p className="text-sm text-slate-400">Internal admin dashboard</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="text-slate-300">{name}</span>
            <Link href="/cms" className="text-teal-300 underline hover:text-teal-200">
              Content CMS
            </Link>
            <Link href="/dashboard" className="text-slate-300 underline hover:text-white">
              Learner portal
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        <aside className="hidden w-56 shrink-0 border-r bg-white p-4 lg:block">
          <AdminSidebar />
        </aside>
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
