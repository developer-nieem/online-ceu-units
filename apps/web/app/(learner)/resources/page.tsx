import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

import { PageHeader } from '@/components/learner/page-header';
import { RESOURCE_LINKS } from '@/lib/navigation';
import { SUPPORT_EMAIL } from '@/lib/support';

export default function ResourcesPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Resources"
        description="CDPH forms, in-person CEU information, CNA program details, jobs, and community links."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {RESOURCE_LINKS.map((link) => {
          const href = link.href;
          const isExternal = link.external;
          const anchorId = href.includes('#') ? href.split('#')[1] : link.title.toLowerCase().replace(/\s+/g, '-');

          const content = (
            <article
              id={href.startsWith('/') && href.includes('#') ? href.split('#')[1] : undefined}
              className="rounded-xl border bg-white p-5 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-slate-900">{link.title}</h2>
                {isExternal ? (
                  <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                ) : null}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{link.description}</p>
              <p className="mt-3 text-xs font-medium text-teal-800">
                {isExternal ? 'Opens external site' : 'Placeholder page section'}
              </p>
            </article>
          );

          if (isExternal) {
            return (
              <a
                key={link.title}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
              >
                {content}
              </a>
            );
          }

          return (
            <div key={link.title} id={anchorId} className="space-y-4 sm:col-span-2">
              {content}
              {href === '/resources#faq' ? (
                <section
                  className="rounded-xl border border-teal-100 bg-teal-50/50 p-5"
                  aria-labelledby="resources-support-heading"
                >
                  <h3 id="resources-support-heading" className="text-sm font-semibold text-slate-900">
                    Need help?
                  </h3>
                  <p className="mt-2 text-sm text-slate-700">
                    Need help with your course, certificate, or account? Our team is happy to assist
                    with platform questions and continuing education records.
                  </p>
                  <p className="mt-3 text-sm">
                    <span className="text-muted-foreground">Email: </span>
                    <a
                      href={`mailto:${SUPPORT_EMAIL}`}
                      className="font-medium text-teal-800 underline hover:text-teal-900"
                    >
                      {SUPPORT_EMAIL}
                    </a>
                  </p>
                </section>
              ) : null}
            </div>
          );
        })}
      </div>

      <p className="text-sm text-muted-foreground">
        Looking for courses?{' '}
        <Link href="/courses" className="text-teal-800 underline">
          Browse the CEU catalog
        </Link>
        . Renewal progress for online CE completed here is on your{' '}
        <Link href="/account/profile" className="text-teal-800 underline">
          account profile
        </Link>
        . Questions?{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="text-teal-800 underline">
          {SUPPORT_EMAIL}
        </a>
      </p>
    </div>
  );
}
