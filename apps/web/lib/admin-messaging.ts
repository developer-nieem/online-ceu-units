import { apiFetch } from './api';

export async function createAnnouncement(body: {
  title: string;
  message: string;
  audience: 'ALL_LEARNERS' | 'COURSE_ENROLLMENTS' | 'COHORT_PLACEHOLDER';
  courseId?: string;
}) {
  return apiFetch('/admin/messaging/announcements', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function sendLearnerNotice(body: {
  userId: string;
  title: string;
  message: string;
}) {
  return apiFetch('/admin/messaging/learner-notices', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function processDueReminders() {
  return apiFetch<{ processed: number; sent: number }>('/admin/messaging/reminders/process', {
    method: 'POST',
  });
}
