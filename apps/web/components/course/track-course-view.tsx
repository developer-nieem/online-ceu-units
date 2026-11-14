'use client';

import { useEffect } from 'react';

import { trackCourseView } from '@/lib/enrollment';

export function TrackCourseView({ courseSlug }: { courseSlug: string }) {
  useEffect(() => {
    void trackCourseView(courseSlug);
  }, [courseSlug]);

  return null;
}
