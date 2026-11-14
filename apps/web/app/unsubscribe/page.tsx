// Deploy trigger: authorized build to ship unsubscribe link fix (6a3b19a).
// Deploy trigger: authorized-account build to promote /unsubscribe to production.
import { Suspense } from 'react';

import { UnsubscribeClient } from '@/components/notifications/unsubscribe-client';

export const metadata = {
  title: 'Unsubscribe',
  robots: { index: false, follow: false },
};

export default function UnsubscribePage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-12">
      <Suspense
        fallback={
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">
            Loading…
          </div>
        }
      >
        <UnsubscribeClient />
      </Suspense>
    </main>
  );
}
