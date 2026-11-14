import Link from 'next/link';

import { NotificationPreferencesForm } from '@/components/notifications/notification-preferences-form';

export default function NotificationPreferencesPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-sm">
          <Link href="/notifications" className="text-teal-800 underline">
            ← Notifications
          </Link>
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Notification preferences</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose how CAL ACE Nursing Academy may contact you. Email and reminder delivery respect
          these settings when those features are enabled.
        </p>
      </div>

      <NotificationPreferencesForm />
    </div>
  );
}
