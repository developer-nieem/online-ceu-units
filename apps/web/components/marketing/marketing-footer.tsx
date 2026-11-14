import Link from 'next/link';

import { CDPH_ONLINE_PROVIDER_LINE } from '@/lib/marketing-copy';

export function MarketingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6 lg:px-8">
        <div className="text-center sm:text-left">
          <p className="text-sm font-medium text-slate-700">{CDPH_ONLINE_PROVIDER_LINE}</p>
          <p className="mt-1 text-sm text-slate-500">
            © {new Date().getFullYear()} CAL ACE Nursing Academy. All rights reserved.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <Link className="text-sm text-slate-600 hover:text-slate-900" href="/faq">
            FAQ
          </Link>
          <Link className="text-sm text-slate-600 hover:text-slate-900" href="/renewal-guidance">
            Renewal guidance
          </Link>
          <Link className="text-sm text-slate-600 hover:text-slate-900" href="/verify">
            Verify certificate
          </Link>
          <Link className="text-sm text-slate-600 hover:text-slate-900" href="/login">
            Sign in
          </Link>
          <Link className="text-sm font-medium text-emerald-700 hover:text-emerald-800" href="/register?plan=free">
            Start free
          </Link>
        </nav>
      </div>
    </footer>
  );
}
