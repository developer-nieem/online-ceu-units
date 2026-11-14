import { Badge } from '@calace/ui/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@calace/ui/components/ui/card';
import { CreditCard, History, Receipt } from 'lucide-react';

import { formatPrice } from '@/lib/pricing';
import type { BillingAccount } from '@/lib/billing';
import { PRICING_PLANS } from '@/lib/pricing';

export function BillingAccountPanel({ account }: { account: BillingAccount | null }) {
  if (!account) {
    return (
      <p className="text-sm text-muted-foreground">Unable to load billing information.</p>
    );
  }

  const planLabel = account.subscription
    ? PRICING_PLANS.find((p) => p.id === account.subscription?.planCode)?.name ??
      account.subscription.planCode
    : null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="h-4 w-4" aria-hidden />
            Subscription status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Stripe</span>
            <Badge
              variant={account.stripeEnabled ? 'success' : 'outline'}
              className={
                account.stripeEnabled
                  ? 'border-transparent bg-[#0D7377]/10 text-[#0D7377]'
                  : undefined
              }
            >
              {account.stripeEnabled ? 'Active' : 'Unavailable until CDPH approval'}
            </Badge>
          </div>
          {account.subscription ? (
            <>
              <p>
                <span className="text-muted-foreground">Plan:</span>{' '}
                <span className="font-medium">{planLabel}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Status:</span>{' '}
                <span className="font-bold text-[#0D7377]">{account.subscription.status}</span>
              </p>
              {account.subscription.currentPeriodEnd ? (
                <p>
                  <span className="text-muted-foreground">Renews / ends:</span>{' '}
                  {new Date(account.subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-muted-foreground">No active unlimited subscription.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4" aria-hidden />
            Payment method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{account.paymentMethod.note}</p>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" aria-hidden />
            Billing history
          </CardTitle>
        </CardHeader>
        <CardContent>
          {account.orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <ul className="divide-y">
              {account.orders.map((order) => (
                <li
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.placedAt
                        ? new Date(order.placedAt).toLocaleString()
                        : 'Pending'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-teal-800">
                      {formatPrice(order.total)}
                    </p>
                    <Badge variant="secondary">{order.status}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
