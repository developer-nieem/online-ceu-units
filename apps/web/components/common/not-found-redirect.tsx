'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const SECONDS = 5;

export function NotFoundRedirect() {
  const router = useRouter();
  const [remaining, setRemaining] = useState(SECONDS);
  const canceledRef = useRef(false);

  useEffect(() => {
    if (canceledRef.current) return;

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!canceledRef.current) router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [router]);

  return (
    <main
      className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center"
      role="main"
    >
      <p className="text-6xl font-bold tracking-tight text-slate-900 sm:text-7xl">404</p>
      <p className="mt-4 text-lg font-medium text-slate-700">This page could not be found.</p>
      <p className="mt-2 text-sm text-slate-500" aria-live="polite">
        Redirecting to the homepage in {remaining} second{remaining === 1 ? '' : 's'}...
      </p>
      <p className="mt-4 text-3xl font-semibold tabular-nums text-slate-400" aria-hidden="true">
        {remaining}
      </p>
      <Link
        href="/"
        onClick={() => {
          canceledRef.current = true;
        }}
        className="mt-8 inline-flex h-11 items-center justify-center rounded-lg bg-emerald-600 px-6 font-semibold text-white transition-colors hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
      >
        Go to Homepage
      </Link>
    </main>
  );
}
