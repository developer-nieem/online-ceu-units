import { cookies } from 'next/headers';

import type { CertificateRecord } from './credentials-types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function fetchApi<T>(path: string): Promise<T | null> {
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

export async function getMyCertificates(): Promise<CertificateRecord[]> {
  return (await fetchApi<CertificateRecord[]>('/certificates/my')) ?? [];
}

export async function getCertificate(id: string): Promise<CertificateRecord | null> {
  return fetchApi<CertificateRecord>(`/certificates/${id}`);
}
