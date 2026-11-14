'use client';

import { Button } from '@calace/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@calace/ui/components/ui/card';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { logout } from '@/lib/auth';

const WARNING_MS = 4 * 60 * 1000;
const LOGOUT_MS = 5 * 60 * 1000;
const CHECK_INTERVAL_MS = 5_000;
const WARN_COUNTDOWN_SEC = 60;

/**
 * Inactivity must not sign the learner out. Seat time pauses separately
 * (useParticipationSession IDLE_MS). Set true to restore the warning + logout.
 */
const AUTO_LOGOUT_ENABLED = false;

/** Suspend while the learner is on a course final-exam route. */
const EXAM_PATH = /^\/courses\/[^/]+\/exam(\/|$)/;

const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'touchstart'] as const;

export function InactivityWatcher() {
  const router = useRouter();
  const pathname = usePathname();

  const lastActivityRef = useRef(Date.now());
  const lastScrollBumpRef = useRef(0);
  const loggingOutRef = useRef(false);
  const warningOpenRef = useRef(false);

  const [warningOpen, setWarningOpen] = useState(false);
  const [countdownSec, setCountdownSec] = useState(WARN_COUNTDOWN_SEC);

  const bumpActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    warningOpenRef.current = false;
    setWarningOpen(false);
    setCountdownSec(WARN_COUNTDOWN_SEC);
  }, []);

  const performLogout = useCallback(async () => {
    if (loggingOutRef.current) return;
    loggingOutRef.current = true;
    try {
      await logout();
    } finally {
      router.push('/login');
      router.refresh();
    }
  }, [router]);

  const handleStayLoggedIn = useCallback(() => {
    bumpActivity();
  }, [bumpActivity]);

  const suspended = EXAM_PATH.test(pathname);

  const evaluateIdle = useCallback(() => {
    if (!AUTO_LOGOUT_ENABLED) return;
    if (loggingOutRef.current) return;
    if (suspended) return;
    const idleMs = Date.now() - lastActivityRef.current;

    if (idleMs >= LOGOUT_MS) {
      void performLogout();
      return;
    }

    if (idleMs >= WARNING_MS) {
      warningOpenRef.current = true;
      setWarningOpen(true);
      setCountdownSec(Math.max(1, Math.ceil((LOGOUT_MS - idleMs) / 1000)));
    }
  }, [performLogout, suspended]);

  useEffect(() => {
    if (suspended) {
      bumpActivity();
      setWarningOpen(false);
      return;
    }

    const onActivity = () => {
      if (warningOpenRef.current) return;
      bumpActivity();
    };

    const onScroll = () => {
      if (warningOpenRef.current) return;
      const now = Date.now();
      if (now - lastScrollBumpRef.current < 1_000) return;
      lastScrollBumpRef.current = now;
      bumpActivity();
    };

    for (const ev of ACTIVITY_EVENTS) {
      window.addEventListener(ev, onActivity, { passive: true });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('mousemove', onActivity, { passive: true });
    document.addEventListener('timeupdate', onActivity, { capture: true });

    const onVisibility = () => {
      if (document.visibilityState === 'visible') evaluateIdle();
    };

    const onFocus = () => {
      evaluateIdle();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);

    return () => {
      for (const ev of ACTIVITY_EVENTS) {
        window.removeEventListener(ev, onActivity);
      }
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onActivity);
      document.removeEventListener('timeupdate', onActivity, { capture: true });
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
    };
  }, [bumpActivity, evaluateIdle, suspended]);

  useEffect(() => {
    if (suspended) return;

    const idleTimer = window.setInterval(() => {
      evaluateIdle();
    }, CHECK_INTERVAL_MS);

    return () => window.clearInterval(idleTimer);
  }, [evaluateIdle, suspended]);

  useEffect(() => {
    if (!warningOpen || suspended) return;

    const tickTimer = window.setInterval(() => {
      const idleMs = Date.now() - lastActivityRef.current;
      const remaining = Math.ceil((LOGOUT_MS - idleMs) / 1000);

      if (remaining <= 0) {
        if (AUTO_LOGOUT_ENABLED) {
          void performLogout();
        }
        return;
      }

      setCountdownSec(remaining);
    }, 1_000);

    return () => window.clearInterval(tickTimer);
  }, [warningOpen, performLogout, suspended]);

  if (!warningOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="inactivity-warning-title"
      aria-describedby="inactivity-warning-desc"
    >
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle id="inactivity-warning-title">Session expiring soon</CardTitle>
          <CardDescription id="inactivity-warning-desc">
            You have been inactive. For your security, you will be signed out in{' '}
            <span className="font-semibold tabular-nums text-slate-900">{countdownSec}</span>{' '}
            second{countdownSec === 1 ? '' : 's'}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" className="w-full" onClick={handleStayLoggedIn}>
            Stay logged in
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
