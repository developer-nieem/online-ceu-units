import { PortalPage, PortalPanel } from '@/components/learner/portal-page';

export const metadata = {
  title: 'Notifications | CAL ACE Nursing Academy',
};

const PLACEHOLDER_NOTIFICATIONS = [
  {
    title: 'Course completion recorded',
    detail: 'Infection Control & Prevention for Healthcare Settings — certificate available.',
    date: '2026-05-28',
  },
  {
    title: 'Enrollment confirmation',
    detail: 'CNA Renewal Readiness & CDPH Documentation — enrollment active.',
    date: '2026-05-20',
  },
] as const;

export default function NotificationsPage() {
  return (
    <PortalPage
      description="Enrollment confirmations, completion notices, and account alerts."
      title="Notifications"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        Preview — full notification center coming soon
      </p>
      <ul className="space-y-3">
        {PLACEHOLDER_NOTIFICATIONS.map((notification) => (
          <li key={notification.title}>
            <PortalPanel>
              <p className="font-semibold text-slate-900">{notification.title}</p>
              <p className="mt-1 text-sm text-slate-600">{notification.detail}</p>
              <p className="mt-2 text-xs text-slate-500">{notification.date}</p>
            </PortalPanel>
          </li>
        ))}
      </ul>
    </PortalPage>
  );
}
