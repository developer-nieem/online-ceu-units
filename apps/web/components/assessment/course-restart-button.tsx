'use client';

import { Button } from '@calace/ui/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { restartCourse } from '@/lib/enrollment';

export function CourseRestartButton({
  courseSlug,
  label = 'Restart course',
}: {
  courseSlug: string;
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRestart() {
    const confirmed = window.confirm(
      'Restart this course? All lesson progress and seat-time will be wiped and you will return to Lesson 1. Your subscription access stays active.',
    );
    if (!confirmed) return;

    setLoading(true);
    setError(null);
    const result = await restartCourse(courseSlug);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.push(`/courses/${courseSlug}/learn`);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="default" disabled={loading} onClick={() => void handleRestart()}>
        {loading ? 'Restarting…' : label}
      </Button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
