import { Award, ShieldCheck } from 'lucide-react';

import { FounderPortrait } from './founder-portrait';

const CREDENTIALS = [
  { icon: ShieldCheck, label: 'Built for CA CNA renewal requirements' },
  { icon: Award, label: 'Curriculum lead — CAL ACE CNA program and CEU courses' },
] as const;

export function LandingFounder() {
  return (
    <section
      className="bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 py-16 sm:py-24"
      id="founder"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="relative">
            <div
              aria-hidden
              className="pointer-events-none absolute -left-4 -top-4 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl sm:-left-8 sm:-top-8"
            />
            <FounderPortrait />
          </div>

          <div>
            <h3 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              From the Founder
            </h3>

            <blockquote className="relative mt-6 border-l-4 border-emerald-500/60 pl-5">
              <span
                aria-hidden
                className="pointer-events-none absolute -left-1 -top-3 font-serif text-5xl leading-none text-emerald-500/25"
              >
                &ldquo;
              </span>
              <p className="text-base leading-relaxed text-slate-600 sm:text-lg">
                &ldquo;My mission is simple: to eliminate the stress of compliance for California&rsquo;s
                frontline CNAs. With decades of experience in nursing education and strict adherence to
                CDPH standards, I designed CAL ACE to be the modern, trusted solution for your license
                renewal. Your success is our legacy.&rdquo;
              </p>
            </blockquote>

            <blockquote className="relative mt-4 border-l-4 border-emerald-500/60 pl-5">
              <p className="text-base leading-relaxed text-slate-600 sm:text-lg">
                &ldquo;Healthcare keeps changing, and California&rsquo;s CNAs carry those changes into every room they
                enter. Continuing education should do more than satisfy a requirement — it should keep your knowledge
                current, your motivation strong, and your practice safe. When you grow, the people in your care feel it
                first.&rdquo;
              </p>
            </blockquote>

            <div className="mt-8 border-t border-slate-200 pt-6">
              <p className="text-lg font-semibold text-slate-900">Dr. Cliff Roperez, DBA, LVN, CNA</p>
              <p className="mt-1 text-sm font-medium text-emerald-700">
                Founder &amp; Pedagogical Lead, CAL ACE Nursing Academy
              </p>
            </div>

            <ul className="mt-8 space-y-3">
              {CREDENTIALS.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700">
                    <Icon aria-hidden className="size-4" strokeWidth={2} />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
