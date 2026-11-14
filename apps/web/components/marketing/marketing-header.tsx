import {
  DEFAULT_CERTIFICATE_LOGO_SRC,
  DEFAULT_INSTITUTION_LEGAL_NAME,
} from '@calace/ui/components/certificate';
import { Button } from '@calace/ui/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

import { SIGNUP_PATH } from '@/lib/auth/learner';

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-1 px-0.5 min-[375px]:gap-4 min-[375px]:px-4 sm:px-6 lg:px-8">
        <Link className="flex min-w-0 shrink-0 items-center gap-3 sm:shrink" href="/">
          <Image
            alt="CAL ACE Nursing Academy"
            className="h-9 w-auto shrink-0 object-contain brightness-0 invert"
            height={36}
            priority
            src={DEFAULT_CERTIFICATE_LOGO_SRC}
            unoptimized
            width={120}
          />
          <span className="hidden truncate text-xs font-medium uppercase tracking-wider text-slate-400 sm:block">
            {DEFAULT_INSTITUTION_LEGAL_NAME}
          </span>
        </Link>

        <nav aria-label="Main" className="flex shrink-0 items-center gap-1 whitespace-nowrap min-[375px]:gap-2 sm:shrink sm:gap-3">
          <Link
            className="hidden text-sm font-medium text-slate-300 transition-colors hover:text-white sm:inline"
            href="#pricing"
          >
            Pricing
          </Link>
          <Link
            className="hidden text-sm font-medium text-slate-300 transition-colors hover:text-white md:inline"
            href="/renewal-guidance"
          >
            Renewal guidance
          </Link>
          <Button
            asChild
            className="hidden border-white/20 bg-transparent text-white hover:bg-white/10 sm:inline-flex"
            size="sm"
            variant="outline"
          >
            <Link href="/login">Sign in</Link>
          </Button>
          <Link
            className="text-sm font-medium text-slate-300 transition-colors hover:text-white sm:hidden"
            href="/login"
          >
            Sign In
          </Link>
          <Button
            asChild
            className="bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-400"
            size="sm"
          >
            <Link href={SIGNUP_PATH}>Sign up</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
