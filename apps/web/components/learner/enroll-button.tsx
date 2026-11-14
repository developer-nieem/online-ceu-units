'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

import { apiFetch } from '@/lib/api';

export function EnrollButton({
  courseSlug,
  className = 'inline-flex h-9 items-center rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60',
  label = 'Enroll',
  redirectTo,
}: {
  courseSlug: string;
  className?: string;
  label?: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleEnroll() {
    setLoading(true);
    setError(null);

    try {
      const { error } = await apiFetch<{ message: string }>('/enrollments', {
        method: 'POST',
        body: JSON.stringify({ courseSlug }),
      });

      if (error) {
        throw new Error(error);
      }

      if (redirectTo) {
        router.push(redirectTo);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to enroll');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <button className={className} disabled={loading} onClick={handleEnroll} type="button">
        {loading ? 'Enrolling…' : label}
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
