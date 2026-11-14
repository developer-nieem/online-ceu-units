import { Badge } from '@calace/ui/components/ui/badge';
import { Button } from '@calace/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@calace/ui/components/ui/card';
import Link from 'next/link';

import { PlanPurchaseButton } from '@/components/marketing/plan-purchase-button';
import { MARKETING_SELLING_POINTS } from '@/lib/marketing-copy';
import { PRICING_PLANS, formatPrice, planSavings } from '@/lib/pricing';

export function PricingPlans({
  compact = false,
  paidCourseCount,
}: {
  compact?: boolean;
  paidCourseCount?: number;
}) {
  return (
    <section className={compact ? 'space-y-3' : 'space-y-4'}>
      {!compact ? (
        <div>
          <h2 className="text-lg font-semibold">Simple, transparent pricing</h2>
          <p className="text-sm text-muted-foreground">
            {MARKETING_SELLING_POINTS.unlimitedAccess}
          </p>
        </div>
      ) : (
        <h2 className="text-lg font-semibold">Pricing</h2>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        {PRICING_PLANS.map((plan) => {
          const showSavings =
            (plan.id === 'unlimited-1y' || plan.id === 'unlimited-2y') &&
            typeof paidCourseCount === 'number' &&
            paidCourseCount > 0;
          const savings = showSavings ? planSavings(plan.price, paidCourseCount) : 0;

          return (
            <Card
              key={plan.id}
              className={plan.highlight ? 'border-teal-600 shadow-md ring-1 ring-teal-600/20' : ''}
            >
              <CardHeader>
                {plan.highlight ? <Badge className="w-fit">Most popular</Badge> : null}
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                {showSavings && savings > 0 ? (
                  <p className="mt-1 text-sm font-medium text-emerald-700">
                    Save {formatPrice(savings)} compared to purchasing all courses individually.
                  </p>
                ) : null}
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-teal-800">
                  {formatPrice(plan.price)}
                  <span className="text-sm font-normal text-muted-foreground"> / {plan.period}</span>
                </p>
              </CardContent>
              <CardFooter>
                {plan.id === 'single' ? (
                  <Button asChild className="w-full" variant="outline">
                    <Link href="/courses">Browse courses</Link>
                  </Button>
                ) : (
                  <PlanPurchaseButton
                    planId={plan.id}
                    planName={plan.name}
                    highlighted={plan.highlight}
                  />
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
      {!compact ? (
        <p className="text-center text-sm text-muted-foreground">
          Single courses are also available at {formatPrice(3.75)} each.{' '}
          <Link href="/courses" className="text-teal-800 underline">
            Browse catalog
          </Link>
        </p>
      ) : null}
    </section>
  );
}
