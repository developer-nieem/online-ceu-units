/**
 * Single-tenant provider brand line for public pre-auth pages (login, signup).
 * Lives here (app layer), NOT in packages/ui shared components, so shared UI
 * stays tenant-agnostic.
 *
 * SEAM: when multi-tenant lands (Build Order: "next state, flip settings"), this
 * becomes a public-settings fetch keyed on the tenant (domain/subdomain/slug),
 * since pre-auth pages have no session to identify the tenant.
 */
export const TENANT_PROVIDER_BRAND_LINE = 'CAL ACE Nursing Academy';
