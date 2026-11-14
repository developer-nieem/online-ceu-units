'use client';

import { useEffect, useState } from 'react';

import {
  getNotifications,
  mapToInboxNotification,
  type InboxNotification,
} from '@/lib/notifications';

import { NotificationFeed } from './notification-feed';

export function NotificationsInbox() {
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [items, setItems] = useState<InboxNotification[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const res = await getNotifications();
      if (cancelled) return;

      if (res.error || !res.data) {
        setStatus('error');
        setItems([]);
        return;
      }

      setItems(res.data.map(mapToInboxNotification));
      setStatus('ready');
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === 'loading') {
    return (
      <p className="rounded-lg border bg-white px-4 py-8 text-center text-sm text-muted-foreground">
        Loading notifications…
      </p>
    );
  }

  if (status === 'error') {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-6 text-sm text-amber-950">
        <p className="font-medium">Unable to load notifications</p>
        <p className="mt-1">
          Please confirm you are signed in and the API is running at port 3001, then refresh this
          page.
        </p>
      </div>
    );
  }

  return <NotificationFeed initial={items} showActions />;
}
