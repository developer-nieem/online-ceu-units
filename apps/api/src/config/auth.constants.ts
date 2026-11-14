export const AUTH_COOKIE = {
  ACCESS: 'calace_access',
  REFRESH: 'calace_refresh',
  CSRF: 'calace_csrf',
} as const;

export const AUTH_HEADER = {
  CSRF: 'x-csrf-token',
  CLIENT: 'x-calace-client',
} as const;

export const ROLE_SLUG = {
  ADMIN: 'admin',
  LEARNER: 'learner',
  INSTRUCTOR: 'instructor',
  SUPPORT: 'support',
} as const;

export type RoleSlug = (typeof ROLE_SLUG)[keyof typeof ROLE_SLUG];

export function asRoleSlugs(slugs: string[]): RoleSlug[] {
  const allowed = new Set<string>(Object.values(ROLE_SLUG));
  return slugs.filter((slug): slug is RoleSlug => allowed.has(slug));
}

export const DEFAULT_TENANT_SLUG = 'cal-ace';
