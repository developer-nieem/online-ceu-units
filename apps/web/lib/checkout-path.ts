import type { PurchasePlanId } from '@/lib/pricing';

export function buildCheckoutPath(
  plan: PurchasePlanId,
  courseSlug?: string,
  courseTitle?: string,
): string {
  const params = new URLSearchParams({ plan });
  if (courseSlug) {
    params.set('courseSlug', courseSlug);
  }
  if (courseTitle) {
    params.set('courseTitle', courseTitle);
  }
  return `/checkout?${params.toString()}`;
}

export function buildCheckoutReturnUrl(plan: PurchasePlanId, courseSlug?: string): string {
  const appUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000');

  if (courseSlug && plan === 'single') {
    return `${appUrl}/courses/${encodeURIComponent(courseSlug)}/learn?checkout=success`;
  }

  const params = new URLSearchParams({ plan });
  return `${appUrl}/purchase/success?${params.toString()}`;
}
