import { cookies } from 'next/headers';

import type { PlayerState } from './player';

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

export async function getPlayerState(
  courseSlug: string,
  lessonSlug?: string,
): Promise<PlayerState | null> {
  const path = lessonSlug
    ? `/player/courses/${courseSlug}/lessons/${lessonSlug}`
    : `/player/courses/${courseSlug}`;
  return apiGet<PlayerState>(path);
}
