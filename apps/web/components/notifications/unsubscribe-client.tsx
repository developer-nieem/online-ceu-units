'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type Preview =
  | { ok: true; scope: string; label: string }
  | { ok: false };

type Phase = 'loading' | 'ready' | 'submitting' | 'done' | 'error' | 'invalid';

export function UnsubscribeClient() {
  const params = useSearchParams();
  const token = params.get('token') ?? '';

  const [phase, setPhase] = useState<Phase>('loading');
  const [label, setLabel] = useState<string>('these emails');
  const [alreadyOff, setAlreadyOff] = useState(false);

  useEffect(() => {
    let active = true;
    if (!token) {
      setPhase('invalid');
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `/api/notifications/unsubscribe/preview?token=${encodeURIComponent(token)}`,
          { method: 'GET' },
        );
        const data = (await res.json()) as Preview;
        if (!active) return;
        if (data.ok) {
          setLabel(data.label);
          setPhase('ready');
        } else {
          setPhase('invalid');
        }
      } catch {
        if (active) setPhase('invalid');
      }
    })();
    return () => {
      active = false;
    };
  }, [token]);

  async function confirm() {
    setPhase('submitting');
    try {
      const res = await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        alreadyUnsubscribed?: boolean;
        label?: string;
      };
      if (data.ok) {
        if (data.label) setLabel(data.label);
        setAlreadyOff(Boolean(data.alreadyUnsubscribed));
        setPhase('done');
      } else {
        setPhase('error');
      }
    } catch {
      setPhase('error');
    }
  }

  const card =
    'rounded-xl border border-slate-200 bg-white p-8 shadow-sm text-slate-700';

  if (phase === 'loading') {
    return <div className={`${card} text-center`}>Loading…</div>;
  }

  if (phase === 'invalid') {
    return (
      <div className={card}>
        <h1 className="text-lg font-semibold text-slate-900">Link not valid</h1>
        <p className="mt-2 text-sm">
          This unsubscribe link is invalid or has expired. You can manage all of your
          email preferences from your{' '}
          <Link href="/notifications/preferences" className="font-medium text-teal-800 hover:underline">
            notification settings
          </Link>
          .
        </p>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className={card}>
        <h1 className="text-lg font-semibold text-slate-900">
          {alreadyOff ? "You're already unsubscribed" : "You've been unsubscribed"}
        </h1>
        <p className="mt-2 text-sm">
          You will no longer receive {label}. Essential account and security emails
          (such as password resets, receipts, and certificate notices) will still be
          sent.
        </p>
        <p className="mt-4 text-sm">
          Changed your mind? You can turn these back on anytime in your{' '}
          <Link href="/notifications/preferences" className="font-medium text-teal-800 hover:underline">
            notification settings
          </Link>
          .
        </p>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className={card}>
        <h1 className="text-lg font-semibold text-slate-900">Something went wrong</h1>
        <p className="mt-2 text-sm">
          We couldn&apos;t process that just now. Please try again, or manage your
          preferences in your{' '}
          <Link href="/notifications/preferences" className="font-medium text-teal-800 hover:underline">
            notification settings
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={confirm}
          className="mt-5 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
        >
          Try again
        </button>
      </div>
    );
  }

  // ready / submitting
  return (
    <div className={card}>
      <h1 className="text-lg font-semibold text-slate-900">Unsubscribe</h1>
      <p className="mt-2 text-sm">
        Confirm that you want to stop receiving <strong>{label}</strong> from Online CE
        Units - CAL ACE.
      </p>
      <p className="mt-2 text-sm text-slate-500">
        Essential account and security emails will still be delivered.
      </p>
      <button
        type="button"
        onClick={confirm}
        disabled={phase === 'submitting'}
        className="mt-5 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
      >
        {phase === 'submitting' ? 'Unsubscribing…' : 'Confirm unsubscribe'}
      </button>
    </div>
  );
}
