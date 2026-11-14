import Link from 'next/link';

import { NotificationsInbox } from '@/components/notifications/notifications-inbox';

export default function NotificationsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Notifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Course progress, compliance, certificates, and announcements from CAL ACE Nursing Academy.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-800">Your inbox</h2>
        <NotificationsInbox />
      </section>

      <section className="rounded-lg border bg-slate-50 p-4 text-sm text-slate-600">
        <p className="font-medium text-slate-800">Notification preferences</p>
        <p className="mt-1">
          Manage in-app, email, course reminder, and certificate notification settings.
        </p>
        <Link href="/notifications/preferences" className="mt-2 inline-block text-teal-800 underline">
          Open preferences
        </Link>
      </section>
    </div>
  );
}
