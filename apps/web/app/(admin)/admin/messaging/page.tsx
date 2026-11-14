'use client';

import { Button } from '@calace/ui/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@calace/ui/components/ui/card';
import { Input } from '@calace/ui/components/ui/input';
import { useState } from 'react';

import { createAnnouncement, processDueReminders } from '@/lib/admin-messaging';

export default function AdminMessagingPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submitAnnouncement = async () => {
    setLoading(true);
    setStatus(null);
    const res = await createAnnouncement({
      title,
      message,
      audience: 'ALL_LEARNERS',
    });
    setLoading(false);
    if (res.error) setStatus(res.error);
    else {
      setStatus('Announcement published to learners.');
      setTitle('');
      setMessage('');
    }
  };

  const runReminders = async () => {
    setLoading(true);
    const res = await processDueReminders();
    setLoading(false);
    if (res.error) setStatus(res.error);
    else if (res.data) setStatus(`Processed ${res.data.processed} reminders, sent ${res.data.sent}.`);
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Messaging</h1>
        <p className="mt-1 text-sm text-slate-600">
          Send provider announcements and run scheduled reminder processing. Admin-only.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Platform announcement</CardTitle>
          <CardDescription>
            Delivers an in-app notification to all learners. Use professional, concise language.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="min-h-[120px] w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Message body"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button type="button" disabled={loading} onClick={() => void submitAnnouncement()}>
            Publish announcement
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reminder engine</CardTitle>
          <CardDescription>
            Process due scheduled reminders (unfinished course, inactivity, attestation). Run
            periodically in operations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="outline" disabled={loading} onClick={() => void runReminders()}>
            Process due reminders
          </Button>
        </CardContent>
      </Card>

      {status ? (
        <p className="rounded-md border bg-white px-3 py-2 text-sm text-slate-700">{status}</p>
      ) : null}
    </div>
  );
}
