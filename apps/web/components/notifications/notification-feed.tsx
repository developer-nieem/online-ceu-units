'use client';

import { Button } from '@calace/ui/components/ui/button';
import Link from 'next/link';
import { useState } from 'react';

import {
  archiveNotification,
  mapToInboxNotification,
  markNotificationRead,
  notifyUnreadCountRefresh,
  type InboxNotification,
  type LearnerNotificationDto,
} from '@/lib/notifications';

function formatWhen(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString();
}

export function NotificationFeed({
  initial,
  showActions = true,
}: {
  initial: InboxNotification[];
  showActions?: boolean;
}) {
  const [items, setItems] = useState(initial);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const applyDto = (dto: LearnerNotificationDto) => mapToInboxNotification(dto);

  const handleMarkRead = async (id: string) => {
    setPendingId(id);
    setActionError(null);
    const res = await markNotificationRead(id);
    setPendingId(null);

    if (res.error || !res.data) {
      setActionError(res.error ?? 'Could not mark notification as read.');
      return;
    }

    setItems((prev) =>
      prev.map((n) => (n.id === id ? applyDto(res.data!) : n)),
    );
    notifyUnreadCountRefresh();
  };

  const handleArchive = async (id: string) => {
    setPendingId(id);
    setActionError(null);
    const res = await archiveNotification(id);
    setPendingId(null);

    if (res.error) {
      setActionError(res.error);
      return;
    }

    setItems((prev) => prev.filter((n) => n.id !== id));
    notifyUnreadCountRefresh();
  };

  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed bg-white px-4 py-8 text-center text-sm text-muted-foreground">
        No notifications in this view. Important course and compliance updates will appear here.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {actionError ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          {actionError}
        </p>
      ) : null}
      {items.map((n) => {
        const busy = pendingId === n.id;
        return (
          <article
            key={n.id}
            className={`rounded-lg border bg-white px-4 py-3 transition-colors ${
              n.read ? 'border-slate-200' : 'border-teal-200 bg-teal-50/30'
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900">{n.title}</p>
                <p className="mt-1 text-sm text-slate-600">{n.body}</p>
                <p className="mt-2 text-xs text-muted-foreground">{formatWhen(n.createdAt)}</p>
              </div>
              {showActions ? (
                <div className="flex shrink-0 flex-col gap-1">
                  {!n.read ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={busy}
                      onClick={() => void handleMarkRead(n.id)}
                    >
                      {busy ? 'Saving…' : 'Mark as read'}
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground"
                    disabled={busy}
                    onClick={() => void handleArchive(n.id)}
                  >
                    Archive
                  </Button>
                </div>
              ) : null}
            </div>
          </article>
        );
      })}
      {showActions ? (
        <p className="text-center text-xs text-muted-foreground">
          <Link href="/notifications" className="text-teal-800 underline">
            View notification center
          </Link>
        </p>
      ) : null}
    </div>
  );
}
