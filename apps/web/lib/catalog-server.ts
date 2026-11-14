import { cookies } from 'next/headers';

import type { CatalogCategory, CatalogCourse } from './catalog';
import { PLACEHOLDER_CATALOG } from './catalog';
import { normalizeCourseCompliance } from './compliance-normalize';
import type { CourseDetail } from './course-detail';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function apiGet<T>(path: string): Promise<T | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  try {
    const response = await fetch(`${API_URL}/api${path}`, {
      headers: cookieHeader ? { Cookie: cookieHeader } : {},
      cache: 'no-store',
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function getCatalogCourses(): Promise<CatalogCourse[]> {
  return (await apiGet<CatalogCourse[]>('/catalog/courses')) ?? PLACEHOLDER_CATALOG;
}

export async function getCatalogCategories(): Promise<CatalogCategory[]> {
  return (
    (await apiGet<CatalogCategory[]>('/catalog/categories')) ?? [
      { slug: 'cna-renewal', name: 'CNA Renewal', description: null, courseCount: 1 },
      { slug: 'infection-control', name: 'Infection Control', description: null, courseCount: 2 },
      { slug: 'elder-abuse', name: 'Elder Abuse Prevention', description: null, courseCount: 1 },
      {
        slug: 'professional-development',
        name: 'Professional Development',
        description: null,
        courseCount: 2,
      },
    ]
  );
}

export async function getCourseBySlug(slug: string): Promise<CourseDetail | null> {
  const course = await apiGet<CourseDetail>(`/catalog/courses/${slug}`);
  if (!course) return null;
  return {
    ...course,
    compliance: normalizeCourseCompliance(course.compliance),
  };
}
