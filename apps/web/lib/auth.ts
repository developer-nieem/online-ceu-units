import { apiFetch, resetCsrf } from './api';

export type AuthUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  roles: string[];
  emailVerified: boolean;
};

export type SessionResponse = {
  user: AuthUser;
};

export async function getSession() {
  return apiFetch<SessionResponse>('/auth/me');
}

export async function signup(payload: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  cnaLicenseNumber: string;
  captchaToken?: string;
}) {
  const result = await apiFetch<SessionResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (result.data) {
    resetCsrf();
  }
  return result;
}

export async function login(payload: {
  email: string;
  password: string;
  captchaToken?: string;
}) {
  const result = await apiFetch<SessionResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (result.data) {
    resetCsrf();
  }
  return result;
}

export async function logout() {
  const result = await apiFetch<{ success: boolean }>('/auth/logout', {
    method: 'POST',
  });
  resetCsrf();
  return result;
}

export async function forgotPassword(payload: { email: string; captchaToken?: string }) {
  return apiFetch<{
    message: string;
    resetUrl?: string;
    emailDelivery?: 'pending_smtp';
  }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function resetPassword(payload: { token: string; password: string }) {
  return apiFetch<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function verifyEmailByToken(token: string) {
  const params = new URLSearchParams({ token });
  return apiFetch<{ verified: boolean; message: string }>(
    `/auth/verify-email?${params.toString()}`,
    { method: 'GET' },
  );
}

/** POST verify — legacy; prefer verifyEmailByToken (GET). */
export async function verifyEmail(token: string) {
  return apiFetch<{ verified: boolean; message: string }>('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export async function sendVerificationEmail() {
  return apiFetch<{ message: string }>('/auth/send-verification-email', {
    method: 'POST',
  });
}

/** @deprecated Use sendVerificationEmail */
export async function resendVerification() {
  return sendVerificationEmail();
}
