import { cookies } from 'next/headers';

export type AcademicTranscriptEnrollment = {
  id: string;
  courseTitle: string;
  /** ISO DateTime from Nest (enrollment.completedAt ?? enrolledAt). */
  completedAt: string;
  ceHours: number;
  certificateId: string | null;
};

export type AcademicTranscriptResult =
  | { ok: true; entries: AcademicTranscriptEnrollment[] }
  | { ok: false; error: 'unavailable' };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/**
 * Fetches completed enrollments for the academic transcript page via Nest.
 * Distinguishes API failure from a genuine empty transcript.
 */
export async function getAcademicTranscriptEnrollments(): Promise<AcademicTranscriptResult> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');
  if (!cookieHeader) {
    return { ok: false, error: 'unavailable' };
  }

  try {
    const response = await fetch(`${API_URL}/api/transcript/enrollments`, {
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!response.ok) {
      return { ok: false, error: 'unavailable' };
    }
    const entries = (await response.json()) as AcademicTranscriptEnrollment[];
    if (!Array.isArray(entries)) {
      return { ok: false, error: 'unavailable' };
    }
    return { ok: true, entries };
  } catch {
    return { ok: false, error: 'unavailable' };
  }
}

export function sumTranscriptCeuHours(
  entries: Array<{ ceHours: number }>,
): number {
  return entries.reduce((total, entry) => total + entry.ceHours, 0);
}
