'use client';

import { Badge } from '@calace/ui/components/ui/badge';
import { Button } from '@calace/ui/components/ui/button';
import { Bell } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { getUnreadCount, UNREAD_COUNT_REFRESH_EVENT } from '@/lib/notifications';

export function NotificationBell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const res = await getUnreadCount();
      if (!cancelled && res.data) setCount(res.data.count);
    };
    void load();
    const interval = setInterval(load, 60_000);
    const onRefresh = () => void load();
    window.addEventListener(UNREAD_COUNT_REFRESH_EVENT, onRefresh);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener(UNREAD_COUNT_REFRESH_EVENT, onRefresh);
    };
  }, []);

  return (
    <Button variant="outline" size="icon" className="relative" asChild>
      <Link href="/notifications" aria-label={`Notifications${count ? `, ${count} unread` : ''}`}>
        <Bell className="h-4 w-4 text-teal-800" aria-hidden />
        {count > 0 ? (
          <Badge
            className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px]"
            variant="default"
          >
            {count > 9 ? '9+' : count}
          </Badge>
        ) : null}
      </Link>
    </Button>
  );
}
