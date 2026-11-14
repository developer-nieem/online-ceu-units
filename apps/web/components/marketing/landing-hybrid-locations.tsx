import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@calace/ui/components/ui/card';
import { Building2, MapPin, Sparkles, Stethoscope } from 'lucide-react';

const LOCATIONS = [
  {
    icon: Building2,
    title: 'Milpitas Campus (Main HQ)',
    description:
      'In-person CEU classes at our main campus. Cohorts forming now.',
    accent: 'from-emerald-500/15 to-emerald-600/5',
  },
  {
    icon: MapPin,
    title: 'Sacramento (Pop-up)',
    description: 'Lock in your essential CEUs with local compliance cohorts.',
    accent: 'from-sky-500/15 to-sky-600/5',
  },
  {
    icon: Sparkles,
    title: 'San Diego (Pop-up)',
    description: 'Get certified fast with immersive training weekends.',
    accent: 'from-violet-500/15 to-violet-600/5',
  },
  {
    icon: Stethoscope,
    title: 'Santa Cruz',
    description: 'One-day in-person CEU sessions.',
    accent: 'from-amber-500/15 to-amber-600/5',
  },
] as const;

export function LandingHybridLocations() {
  return (
    <section className="border-y border-slate-200 bg-white py-16 sm:py-24" id="locations">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
            Hybrid learning network
          </p>
          <h3 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Learn Skills You Can Use
          </h3>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            Pair unlimited online CEUs with in-person training at our Milpitas headquarters and
            strategic pop-up locations across California.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {LOCATIONS.map(({ icon: Icon, title, description, accent }) => (
            <Card
              key={title}
              className="group overflow-hidden border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div
                aria-hidden
                className={`h-1 bg-gradient-to-r ${accent} transition-opacity group-hover:opacity-100`}
              />
              <CardHeader className="pb-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-colors group-hover:bg-emerald-500/10 group-hover:text-emerald-700">
                  <Icon aria-hidden className="size-5" strokeWidth={2} />
                </div>
                <CardTitle className="mt-4 text-lg text-slate-900">{title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-sm leading-relaxed text-slate-600">
                  {description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
