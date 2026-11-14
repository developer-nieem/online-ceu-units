import { cookies } from 'next/headers';

import { apiUrl } from './api-config';
import type { FinalExamOverview } from './assessments';

export async function getFinalExamOverview(
  courseSlug: string,
): Promise<FinalExamOverview | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');
  if (!cookieHeader) return null;

  try {
    const response = await fetch(apiUrl(`/assessments/courses/${courseSlug}/final-exam`), {
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!response.ok) return null;
    return (await response.json()) as FinalExamOverview;
  } catch {
    return null;
  }
}
