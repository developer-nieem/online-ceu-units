import { cookies } from 'next/headers';

import type { CourseEnrollmentStatus, EnrollmentSummary, RecentlyViewedItem } from './enrollment';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function apiGet<T>(path: string): Promise<T | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  if (!cookieHeader) return null;

  try {
    const response = await fetch(`${API_URL}/api${path}`, {
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function getMyEnrollments(): Promise<EnrollmentSummary[]> {
  return (await apiGet<EnrollmentSummary[]>('/enrollments/my')) ?? [];
}

export async function getEnrollmentForCourse(
  courseSlug: string,
): Promise<CourseEnrollmentStatus | null> {
  return apiGet<CourseEnrollmentStatus>(`/enrollments/course/${courseSlug}`);
}

export async function getRecentlyViewed(): Promise<RecentlyViewedItem[]> {
  return (await apiGet<RecentlyViewedItem[]>('/enrollments/recently-viewed')) ?? [];
}
