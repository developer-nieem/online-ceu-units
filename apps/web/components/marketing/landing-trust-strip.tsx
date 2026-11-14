import { Clock3, FileCheck2, GraduationCap, ShieldCheck, Sparkles } from 'lucide-react';



import { MARKETING_SELLING_POINTS } from '@/lib/marketing-copy';



const FEATURES = [

  {

    icon: Sparkles,

    title: 'Unlimited access',

    description: MARKETING_SELLING_POINTS.unlimitedAccess,

  },

  {

    icon: ShieldCheck,

    title: 'Built for CDPH renewal',

    description: MARKETING_SELLING_POINTS.compliance,

  },

  {

    icon: GraduationCap,

    title: 'CEU tracking & math',

    description: MARKETING_SELLING_POINTS.tools,

  },

  {

    icon: Clock3,

    title: '50-minute modules',

    description: 'Focused sessions that fit real shifts — finish CEUs without burning out.',

  },

  {

    icon: FileCheck2,

    title: 'Instant certificates',

    description: 'Download proof of completion the moment you pass — audit-ready records.',

  },

] as const;



export function LandingTrustStrip() {

  return (

    <section className="border-y border-slate-200 bg-white py-16 sm:py-20">

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <div className="mx-auto max-w-2xl text-center">

          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">

            Why choose CAL ACE

          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">

            Enterprise-grade compliance, without the enterprise hassle

          </h2>

          <p className="mt-4 text-base leading-relaxed text-slate-600">

            {MARKETING_SELLING_POINTS.inPerson}

          </p>

        </div>



        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

          {FEATURES.map(({ icon: Icon, title, description }) => (

            <li

              key={title}

              className="rounded-2xl border border-slate-200 bg-slate-50/80 p-6 shadow-sm transition-shadow hover:shadow-md"

            >

              <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700">

                <Icon aria-hidden className="size-5" strokeWidth={2} />

              </div>

              <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>

              <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>

            </li>

          ))}

        </ul>

      </div>

    </section>

  );

}


