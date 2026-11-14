import { cookies } from 'next/headers';

import type {
  CmsCategory,
  CmsCourseDetail,
  CmsCourseListItem,
  CmsDashboard,
  CmsLessonDetail,
} from './cms';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function cmsGet<T>(path: string): Promise<T | null> {
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

export async function getCmsDashboard() {
  return cmsGet<CmsDashboard>('/cms/dashboard');
}

export async function getCmsCourses(params?: { status?: string; search?: string }) {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  if (params?.search) q.set('search', params.search);
  const qs = q.toString();
  return cmsGet<CmsCourseListItem[]>(`/cms/courses${qs ? `?${qs}` : ''}`);
}

export async function getCmsCourse(courseId: string) {
  return cmsGet<CmsCourseDetail>(`/cms/courses/${courseId}`);
}

export async function getCmsLesson(lessonId: string) {
  return cmsGet<CmsLessonDetail>(`/cms/lessons/${lessonId}`);
}

export async function getCmsCategories() {
  return cmsGet<CmsCategory[]>('/cms/categories');
}
