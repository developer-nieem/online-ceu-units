import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@calace/ui/components/ui/card';
import Link from 'next/link';

import { NotificationFeed } from '@/components/notifications/notification-feed';
import type { InboxNotification } from '@/lib/notifications';

export function NotificationsWidget({
  notifications,
  unreadCount,
}: {
  notifications: InboxNotification[];
  unreadCount: number;
}) {
  const preview = notifications.slice(0, 3);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle className="text-base">Notifications</CardTitle>
          <CardDescription>
            {unreadCount > 0
              ? `${unreadCount} unread — course, compliance, and certificate updates`
              : 'You are up to date'}
          </CardDescription>
        </div>
        <Link href="/notifications" className="text-xs font-medium text-teal-800 underline">
          View all
        </Link>
      </CardHeader>
      <CardContent>
        <NotificationFeed initial={preview} showActions={false} />
      </CardContent>
    </Card>
  );
}
