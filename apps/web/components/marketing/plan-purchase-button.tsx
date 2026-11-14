'use client';

import { Button } from '@calace/ui/components/ui/button';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { getSession } from '@/lib/auth';
import { buildCheckoutPath } from '@/lib/checkout-path';
import type { PurchasePlanId } from '@/lib/pricing';

type PlanPurchaseButtonProps = {
  planId: PurchasePlanId;
  planName: string;
  highlighted?: boolean;
};

export function PlanPurchaseButton({ planId, planName, highlighted = false }: PlanPurchaseButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function handleClick() {
    setLoading(true);

    const session = await getSession();
    if (session.error || !session.data?.user) {
      setLoading(false);
      router.push(`/register?plan=${encodeURIComponent(planId)}`);
      return;
    }

    router.push(buildCheckoutPath(planId));
  }

  return (
    <div className="relative w-full space-y-2">
      <Button
        className={
          highlighted
            ? 'h-11 w-full rounded-lg bg-emerald-600 font-semibold text-white hover:bg-emerald-500'
            : 'h-11 w-full rounded-lg font-semibold'
        }
        disabled={loading}
        onClick={() => void handleClick()}
        type="button"
        variant={highlighted ? 'default' : 'outline'}
      >
        {loading ? 'Opening checkout…' : 'Get Access'}
      </Button>

      <span className="sr-only" data-plan-id={planId}>
        Purchase {planName}
      </span>
    </div>
  );
}
