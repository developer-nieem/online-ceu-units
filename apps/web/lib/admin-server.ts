import { cookies } from 'next/headers';

import type {
  AdminAuditEntry,
  AdminCertificatesResponse,
  AdminCourseDetail,
  AdminCourseOps,
  AdminDashboard,
  AdminExamAttemptDetail,
  AdminExamAttemptSummary,
  AdminEnrolledStudentsResponse,
  AdminLearnerDetail,
  AdminLearnerListItem,
  AdminRevenue,
  AdminComplianceSettingsResponse,
  AdminSupport,
  AuditCategory,
  AdminUnlimited1yMembersResponse,
  AdminUnlimitedMembersResponse,
} from './admin';
import type { AdminAnalytics } from './admin-analytics';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function adminGet<T>(path: string): Promise<T | null> {
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

export async function getAdminDashboard() {
  return adminGet<AdminDashboard>('/admin/dashboard');
}

export async function getAdminEnrolledStudents(params?: { search?: string; page?: number }) {
  const q = new URLSearchParams();
  if (params?.search) q.set('search', params.search);
  if (params?.page && params.page > 1) q.set('page', String(params.page));
  const qs = q.toString();
  return adminGet<AdminEnrolledStudentsResponse>(`/admin/enrolled-students${qs ? `?${qs}` : ''}`);
}

export async function getAdminLearners(params?: { search?: string; limit?: number }) {
  const q = new URLSearchParams();
  if (params?.search) q.set('search', params.search);
  if (params?.limit) q.set('limit', String(params.limit));
  const qs = q.toString();
  return adminGet<AdminLearnerListItem[]>(`/admin/learners${qs ? `?${qs}` : ''}`);
}

export async function getAdminLearner(userId: string) {
  return adminGet<AdminLearnerDetail>(`/admin/learners/${userId}`);
}

export async function getAdminExamAttempts(userId: string) {
  return adminGet<AdminExamAttemptSummary[]>(`/admin/learners/${userId}/exam-attempts`);
}

export async function getAdminExamAttempt(userId: string, attemptId: string) {
  return adminGet<AdminExamAttemptDetail>(
    `/admin/learners/${userId}/exam-attempts/${attemptId}`,
  );
}

export async function getAdminCourses() {
  return adminGet<AdminCourseOps[]>('/admin/courses');
}

export async function getAdminCourse(courseId: string) {
  return adminGet<AdminCourseDetail>(`/admin/courses/${courseId}`);
}

export async function getAdminCertificates(params?: { search?: string }) {
  const q = new URLSearchParams();
  if (params?.search) q.set('search', params.search);
  const qs = q.toString();
  return adminGet<AdminCertificatesResponse>(`/admin/certificates${qs ? `?${qs}` : ''}`);
}

export async function getAdminAudit(params?: { category?: AuditCategory; limit?: number }) {
  const q = new URLSearchParams();
  if (params?.category && params.category !== 'all') q.set('category', params.category);
  if (params?.limit) q.set('limit', String(params.limit));
  const qs = q.toString();
  return adminGet<AdminAuditEntry[]>(`/admin/audit${qs ? `?${qs}` : ''}`);
}

export async function getAdminRevenue() {
  return adminGet<AdminRevenue>('/admin/revenue');
}

export async function getAdminUnlimitedMembers(params?: { search?: string }) {
  const q = new URLSearchParams();
  if (params?.search) q.set('search', params.search);
  const qs = q.toString();
  return adminGet<AdminUnlimitedMembersResponse>(
    `/admin/members/unlimited${qs ? `?${qs}` : ''}`,
  );
}

export async function getAdminUnlimited1yMembers(params?: { search?: string }) {
  const q = new URLSearchParams();
  if (params?.search) q.set('search', params.search);
  const qs = q.toString();
  return adminGet<AdminUnlimited1yMembersResponse>(
    `/admin/members/unlimited-1y${qs ? `?${qs}` : ''}`,
  );
}

export async function getAdminSupport() {
  return adminGet<AdminSupport>('/admin/support');
}

export async function getAdminComplianceSettings() {
  return adminGet<AdminComplianceSettingsResponse>('/admin/compliance/settings');
}

export async function getAdminAnalytics() {
  return adminGet<AdminAnalytics>('/admin/analytics');
}
