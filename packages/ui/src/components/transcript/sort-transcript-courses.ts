import type { TranscriptCourseEntry } from './types';

function toCompletionTimestamp(value: Date | string): number {
  const date = value instanceof Date ? value : new Date(value);
  return date.getTime();
}

/** Sort completed courses chronologically by completion date (earliest first). */
export function sortTranscriptCoursesByCompletionDate(
  courses: TranscriptCourseEntry[],
): TranscriptCourseEntry[] {
  return [...courses].sort(
    (a, b) => toCompletionTimestamp(a.completedOn) - toCompletionTimestamp(b.completedOn),
  );
}
