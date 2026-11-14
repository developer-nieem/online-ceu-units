import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { CmsSidebar } from '@/components/cms/cms-sidebar';
import { getServerSession } from '@/lib/auth-server';
import { isCmsStaff } from '@/lib/cms-auth';

export default async function CmsLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession();

  if (session.error || !session.data) {
    redirect('/login?next=/cms');
  }

  if (!isCmsStaff(session.data.user.roles)) {
    redirect('/dashboard');
  }

  const name =
    [session.data.user.firstName, session.data.user.lastName].filter(Boolean).join(' ') ||
    session.data.user.email;

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
              CAL ACE · Internal CMS
            </p>
            <p className="text-sm text-slate-600">Course authoring & content management</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-slate-600 sm:inline">{name}</span>
            <Link href="/admin" className="text-teal-800 underline">
              Back to Overview
            </Link>
            <Link href="/dashboard" className="text-teal-800 underline">
              Learner portal
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-0">
        <aside className="hidden w-56 shrink-0 border-r bg-white p-4 lg:block">
          <CmsSidebar />
        </aside>
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
