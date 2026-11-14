'use client';

import { Button } from '@calace/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@calace/ui/components/ui/card';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { buildCheckoutPath } from '@/lib/checkout-path';
import { enrollInCourse } from '@/lib/enrollment';
import { PRICING_PLANS, formatPrice, type PurchasePlanId } from '@/lib/pricing';
import type { CourseDetail } from '@/lib/course-detail';

type CheckoutDialogProps = {
  course: CourseDetail;
  open: boolean;
  onClose: () => void;
  hasActiveSubscription: boolean;
};

export function CheckoutDialog({
  course,
  open,
  onClose,
  hasActiveSubscription,
}: CheckoutDialogProps) {
  const router = useRouter();
  const [plan, setPlan] = useState<PurchasePlanId>('single');
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  if (!open) return null;

  const eligiblePlans = PRICING_PLANS.filter((p) => {
    if (p.id !== 'single') return course.subscriptionEligible;
    return true;
  });

  const selectedPlan =
    hasActiveSubscription && plan === 'single' ? 'single' : plan;

  async function handleCheckout() {
    if (hasActiveSubscription) {
      setEnrolling(true);
      setEnrollError(null);
      const result = await enrollInCourse(course.slug, 'single');
      setEnrolling(false);
      if (result.error) {
        setEnrollError(result.error);
        return;
      }
      onClose();
      router.push(`/courses/${course.slug}/learn`);
      router.refresh();
      return;
    }

    onClose();
    router.push(buildCheckoutPath(selectedPlan, course.slug, course.title));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-title"
    >
      <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto">
        <CardHeader>
          <CardTitle id="checkout-title">Choose a plan</CardTitle>
          <CardDescription>
            Select how you want to pay, then complete checkout securely on CAL ACE.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm font-medium text-slate-900">{course.title}</p>

          {hasActiveSubscription ? (
            <p className="rounded-md bg-teal-50 px-3 py-2 text-sm text-teal-900">
              You have an active unlimited plan. This course will be added at no extra
              charge.
            </p>
          ) : (
            <div className="space-y-2">
              {eligiblePlans.map((p) => (
                <label
                  key={p.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${
                    plan === p.id ? 'border-teal-600 bg-teal-50/50' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="plan"
                    value={p.id}
                    checked={plan === p.id}
                    onChange={() => setPlan(p.id)}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-sm text-muted-foreground">{p.description}</p>
                    <p className="text-sm font-semibold text-teal-800">
                      {formatPrice(p.price)} / {p.period}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}

          {enrollError ? (
            <p className="text-sm text-red-600" role="alert">
              {enrollError}
            </p>
          ) : null}

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1"
              disabled={enrolling}
              onClick={() => void handleCheckout()}
            >
              {hasActiveSubscription
                ? enrolling
                  ? 'Enrolling…'
                  : 'Start course'
                : 'Continue to checkout'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
