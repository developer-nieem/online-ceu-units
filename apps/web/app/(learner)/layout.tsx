import type { ReactNode } from 'react';
import { InactivityWatcher } from '@/components/auth/inactivity-watcher';
import { LearnerHeader } from '@/components/learner/learner-header';
import { SidebarNav } from '@/components/learner/sidebar-nav';
import { DashboardLogoutButton } from '@/app/(learner)/dashboard/logout-button';
import { getServerSession } from '@/lib/auth-server';

export default async function LearnerLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession();
  const user = session.data?.user;
  const userName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
    user?.email ||
    'Learner';
  const emailVerified = user?.emailVerified ?? false;

  return (
    <div className="min-h-screen bg-slate-50">
      {user ? <InactivityWatcher /> : null}
      <LearnerHeader userName={userName} emailVerified={emailVerified} />
      <div className="mx-auto flex max-w-7xl">
        <aside className="hidden w-56 shrink-0 border-r bg-white p-4 lg:block">
          <SidebarNav />
          {user ? (
            <div className="mt-4">
              <DashboardLogoutButton />
            </div>
          ) : null}
        </aside>
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
