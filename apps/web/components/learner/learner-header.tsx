'use client';

import { Button } from '@calace/ui/components/ui/button';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { DashboardLogoutButton } from '@/app/(learner)/dashboard/logout-button';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { SidebarNav } from './sidebar-nav';

type LearnerHeaderProps = {
  userName: string;
  emailVerified: boolean;
};

export function LearnerHeader({ userName, emailVerified }: LearnerHeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
              CAL ACE
            </p>
            <p className="text-sm font-medium">{userName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <DashboardLogoutButton />
        </div>
      </header>

      {open ? (
        <div
          className="fixed inset-0 z-50 bg-black/40 lg:hidden"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <aside
            className="absolute left-0 top-0 flex h-full w-72 flex-col bg-background p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="font-semibold text-teal-800">CAL ACE LMS</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col">
              <SidebarNav onNavigate={() => setOpen(false)} />
              {!emailVerified ? (
                <Link
                  href="/verify-email"
                  className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800"
                  onClick={() => setOpen(false)}
                >
                  Verify your email
                </Link>
              ) : null}
              <div className="mt-auto border-t pt-4">
                <DashboardLogoutButton />
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
