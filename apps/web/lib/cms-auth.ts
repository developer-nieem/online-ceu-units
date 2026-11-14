/** Roles allowed to access the CMS (matches API `CMS_ROLES`). */
const CMS_STAFF_ROLES = ['admin', 'instructor'] as const;

export function isCmsStaff(roles: string[] | undefined): boolean {
  if (!roles?.length) return false;
  return roles.some((r) => (CMS_STAFF_ROLES as readonly string[]).includes(r));
}