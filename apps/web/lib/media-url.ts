/**
 * Prefix course-media paths with the media host (Cloudflare R2) in production.
 * Course media lives at root-relative /assets/courses/... paths (in seeds + DB).
 * When NEXT_PUBLIC_MEDIA_URL is set, those paths are served from the media host;
 * when unset (local dev, and until R2 is live), they serve from /public as before.
 *
 * ONLY /assets/courses/ paths are prefixed. Everything else (certificate logo,
 * /assets/compliance/, marketing images, favicons, absolute https URLs) is returned
 * unchanged, so those keep serving locally / from their existing location.
 */
export function mediaUrl(path: string | null | undefined): string {
  if (!path) return '';
  // Leave absolute URLs and non-course paths untouched.
  if (!path.startsWith('/assets/courses/')) return path;
  const base = process.env.NEXT_PUBLIC_MEDIA_URL?.replace(/\/$/, '') ?? '';
  return base ? `${base}${path}` : path;
}
