import { Button } from '@calace/ui/components/ui/button';
import Link from 'next/link';

export function LandingCtaBanner() {
  return (
    <section className="bg-slate-950 py-16 sm:py-20">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Your renewal deadline will not wait. You should not have to either.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-400">
          Join California CNAs who trust CAL ACE for compliant coursework, automated tracking, and
          unlimited access when they need it most.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            asChild
            className="h-12 rounded-lg bg-emerald-500 px-8 text-base font-semibold text-white hover:bg-emerald-400"
            size="lg"
          >
            <Link href="/free">Start Free (3 Courses)</Link>
          </Button>
          <Button
            asChild
            className="h-12 rounded-lg border-white/20 bg-transparent px-8 text-base font-semibold text-white hover:bg-white/10 hover:text-white"
            size="lg"
            variant="outline"
          >
            <Link href="#pricing">Compare unlimited plans</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
