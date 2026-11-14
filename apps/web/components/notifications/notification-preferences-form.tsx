'use client';

import { Button } from '@calace/ui/components/ui/button';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from '@/lib/notifications';

const FIELDS: {
  key: keyof NotificationPreferences;
  label: string;
  description: string;
}[] = [
  {
    key: 'inAppEnabled',
    label: 'In-app notifications',
    description: 'Show alerts in your notification inbox while you use the platform.',
  },
  {
    key: 'emailEnabled',
    label: 'Email notifications',
    description: 'Receive important updates by email when delivery is enabled (placeholder).',
  },
  {
    key: 'courseRemindersEnabled',
    label: 'Course reminders',
    description: 'Reminders to continue unfinished CEU courses.',
  },
  {
    key: 'certificateNotificationsEnabled',
    label: 'Certificate notifications',
    description: 'Updates when certificates and transcripts are ready.',
  },
  {
    key: 'marketingEmailsEnabled',
    label: 'Marketing and discount emails',
    description: 'Optional promotional messages. You can turn this off at any time.',
  },
];

export function NotificationPreferencesForm() {
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [supportEmail, setSupportEmail] = useState('support@onlineceunits.com');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const res = await getNotificationPreferences();
      if (cancelled) return;
      if (res.error || !res.data) {
        setStatus('error');
        return;
      }
      setPrefs(res.data.preferences);
      setSupportEmail(res.data.supportEmail);
      setStatus('ready');
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggle = (key: keyof NotificationPreferences) => {
    if (!prefs) return;
    setPrefs({ ...prefs, [key]: !prefs[key] });
    setMessage(null);
  };

  const handleSave = async () => {
    if (!prefs) return;
    setSaving(true);
    setMessage(null);
    const res = await updateNotificationPreferences(prefs);
    setSaving(false);
    if (res.error || !res.data) {
      setMessage({ type: 'error', text: res.error ?? 'Could not save preferences.' });
      return;
    }
    setPrefs(res.data.preferences);
    setMessage({ type: 'success', text: 'Your notification preferences were saved.' });
  };

  if (status === 'loading') {
    return (
      <p className="rounded-lg border bg-white px-4 py-8 text-center text-sm text-muted-foreground">
        Loading preferences…
      </p>
    );
  }

  if (status === 'error' || !prefs) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-6 text-sm text-amber-950">
        <p className="font-medium">Unable to load preferences</p>
        <p className="mt-1">Please sign in and ensure the API is running, then try again.</p>
        <Link href="/notifications" className="mt-3 inline-block text-teal-800 underline">
          Back to inbox
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-xl border bg-white p-5">
        {FIELDS.map((field) => (
          <div
            key={field.key}
            className="space-y-3 border-b border-slate-100 pb-4 last:border-0 last:pb-0"
          >
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-800 focus:ring-teal-600"
                checked={prefs[field.key]}
                onChange={() => handleToggle(field.key)}
              />
              <span>
                <span className="text-sm font-medium text-slate-900">{field.label}</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">{field.description}</span>
              </span>
            </label>
            {field.key === 'emailEnabled' ? (
              <div
                className="rounded-md border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm leading-relaxed text-amber-950"
                role="note"
              >
                <p className="font-semibold">Trouble receiving notifications?</p>
                <p className="mt-1">
                  Check your spam or junk folder, make sure your email address is up to date, and add{' '}
                  <span className="font-medium">support@onlineceunits.com</span> to your contacts or
                  safe-sender list so you don&rsquo;t miss important updates.
                </p>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Questions about your account or notifications? Contact{' '}
        <a href={`mailto:${supportEmail}`} className="text-teal-800 underline">
          {supportEmail}
        </a>
        .
      </p>

      {message ? (
        <p
          className={`rounded-md px-3 py-2 text-sm ${
            message.type === 'success'
              ? 'border border-teal-100 bg-teal-50 text-teal-900'
              : 'border border-amber-200 bg-amber-50 text-amber-950'
          }`}
        >
          {message.text}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" disabled={saving} onClick={() => void handleSave()}>
          {saving ? 'Saving…' : 'Save preferences'}
        </Button>
        <Link href="/notifications" className="text-sm text-teal-800 underline">
          Back to notification inbox
        </Link>
      </div>
    </div>
  );
}
