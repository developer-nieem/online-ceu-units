import { Badge } from '@calace/ui/components/ui/badge';
import { Button } from '@calace/ui/components/ui/button';
import { CalendarRange, Calculator, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

import { BirthdayMathInfographic } from './birthday-math-infographic';

const HIGHLIGHTS = [
  {
    icon: Calculator,
    label: 'Year 1 vs Year 2 logic engine',
  },
  {
    icon: CalendarRange,
    label: 'License birthday date analysis',
  },
  {
    icon: ShieldCheck,
    label: 'CE hours status dashboard',
  },
] as const;

export function LandingBirthdayMath() {
  return (
    <section className="bg-slate-50 py-16 sm:py-24" id="birthday-math">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="order-2 lg:order-1">
            <BirthdayMathInfographic />
          </div>

          <div className="order-1 lg:order-2">
            <Badge
              className="mb-4 w-fit border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50"
              variant="outline"
            >
              Automated renewal intelligence
            </Badge>

            <h3 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Eliminate License Renewal Math Stress Forever.
            </h3>

            <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
              No more manual calculation confusion. CAL ACE automatically analyzes your CA CNA certification
              birthday and certification dates. Our logic engine tracks exactly how many Year 1 versus
              Year 2 units you need, displaying a simplified CE hours status dashboard instantly.
              Never miss a mandatory state deadline again.
            </p>

            <ul className="mt-8 space-y-4">
              {HIGHLIGHTS.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700">
                    <Icon aria-hidden className="size-4" strokeWidth={2} />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Button
                asChild
                className="h-11 w-full rounded-md bg-emerald-500 px-8 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-400 hover:shadow-xl hover:shadow-emerald-500/30 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:w-auto"
              >
                <Link href="/ceu-calculator">Calculate Your Required CE Hours</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
