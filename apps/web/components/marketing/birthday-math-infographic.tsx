'use client';

import Image from 'next/image';
import * as React from 'react';

const INFOGRAPHIC_SRC = '/assets/image_19.png';

export function BirthdayMathInfographic() {
  const [useFallback, setUseFallback] = React.useState(false);

  if (useFallback) {
    return (
      <div
        aria-hidden
        className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-slate-100 shadow-lg ring-1 ring-slate-900/5"
      >
        <div className="absolute inset-8 rounded-xl border border-dashed border-emerald-300/60 bg-white/60" />
        <div className="absolute bottom-10 left-10 right-10 space-y-3">
          <div className="h-3 w-2/5 rounded-full bg-emerald-200" />
          <div className="h-3 w-3/5 rounded-full bg-slate-200" />
          <div className="h-3 w-1/2 rounded-full bg-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg ring-1 ring-slate-900/5">
      <Image
        alt="CAL ACE birthday math dashboard showing Year 1 versus Year 2 CEU requirements"
        className="object-contain p-4 sm:p-6"
        fill
        onError={() => setUseFallback(true)}
        sizes="(max-width: 1024px) 100vw, 50vw"
        src={INFOGRAPHIC_SRC}
      />
    </div>
  );
}
