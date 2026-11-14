'use client';

import Image from 'next/image';
import * as React from 'react';

const HERO_IMAGE_SRC = '/assets/image_19.jpg';

export function HeroCnaImage() {
  const [useFallback, setUseFallback] = React.useState(false);

  if (useFallback) {
    return (
      <div
        aria-hidden
        className="relative h-full w-full max-w-lg overflow-hidden lg:max-w-none lg:pr-0"
      >
        <div className="absolute inset-x-8 bottom-0 top-8 rounded-t-[2rem] bg-gradient-to-b from-emerald-500/20 to-slate-800/80 ring-1 ring-white/10" />
        <div className="absolute bottom-0 left-1/2 h-[88%] w-[72%] -translate-x-1/2 rounded-t-[999px] bg-gradient-to-b from-slate-700/50 to-slate-900/90" />
        <div className="absolute bottom-[18%] left-1/2 size-24 -translate-x-1/2 rounded-full bg-slate-600/40 blur-2xl" />
      </div>
    );
  }

  return (
    <div className="relative h-[360px] w-full max-w-xl sm:h-[460px] lg:h-full lg:max-w-none lg:min-h-[520px]">
      <Image
        alt="Smiling California CNA in scrubs with CAL ACE credentials"
        className="object-cover object-[75%_20%]"
        fill
        onError={() => setUseFallback(true)}
        priority
        sizes="(max-width: 1024px) 90vw, 50vw"
        src={HERO_IMAGE_SRC}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-slate-950 to-transparent lg:w-1/4"
      />
    </div>
  );
}
