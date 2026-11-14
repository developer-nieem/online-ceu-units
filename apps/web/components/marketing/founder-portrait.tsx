'use client';

import Image from 'next/image';
import * as React from 'react';

const FOUNDER_PORTRAIT_SRC = '/assets/founder-dr-cliff.jpg';

export function FounderPortrait() {
  const [useFallback, setUseFallback] = React.useState(false);

  if (useFallback) {
    return (
      <div
        aria-hidden
        className="relative aspect-[4/5] w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-100 via-white to-emerald-50 shadow-xl ring-1 ring-slate-900/5"
      >
        <div className="absolute inset-x-10 top-12 aspect-square rounded-full bg-gradient-to-b from-slate-200 to-slate-300" />
        <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-emerald-500/10 to-transparent" />
        <div className="absolute bottom-8 left-8 right-8 space-y-2">
          <div className="h-2.5 w-1/3 rounded-full bg-slate-200" />
          <div className="h-2 w-2/5 rounded-full bg-emerald-200/80" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl ring-1 ring-slate-900/5">
      <Image
        alt="Dr. Cliff Roperez, DBA, LVN, CNA, founder of CAL ACE Nursing Academy"
        className="object-cover object-top"
        fill
        onError={() => setUseFallback(true)}
        sizes="(max-width: 1024px) 85vw, 420px"
        src={FOUNDER_PORTRAIT_SRC}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-slate-900/20 to-transparent"
      />
    </div>
  );
}
