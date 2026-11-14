/** Role required for the internal operations dashboard. */
export const ADMIN_ROLE = 'admin' as const;

export function isAdmin(roles: string[] | undefined): boolean {
  return Boolean(roles?.includes(ADMIN_ROLE));
}
