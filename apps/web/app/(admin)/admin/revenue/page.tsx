import { getAdminRevenue } from '@/lib/admin-server';

export default async function AdminRevenuePage() {
  const data = await getAdminRevenue();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Revenue (placeholder)</h1>
        <p className="mt-1 text-sm text-slate-600">
          Aggregates from orders and subscriptions in Prisma. Stripe connection and refund
          processing are not implemented yet.
        </p>
      </div>

      {!data ? (
        <p className="text-sm text-slate-500">Unable to load revenue data.</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Total revenue', value: `$${data.totalRevenue.toFixed(2)}` },
              { label: 'Paid orders', value: data.paidOrderCount },
              { label: 'Active subscriptions', value: data.subscriptionCount },
              { label: 'Refunds', value: data.refunds },
              { label: 'Failed payments', value: data.failedPayments },
              {
                label: 'Stripe',
                value: data.stripeStatus.replace(/_/g, ' '),
              },
            ].map((card) => (
              <div key={card.label} className="rounded-xl border bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-500">{card.label}</p>
                <p className="mt-2 text-2xl font-semibold">{card.value}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-500">{data.stripeNote}</p>

          <section className="rounded-xl border bg-white p-5">
            <h2 className="text-lg font-medium">Recent orders</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {data.recentOrders.map((o) => (
                <li key={o.id} className="flex flex-wrap justify-between gap-2 border-b py-2">
                  <span>
                    {o.orderNumber} · {o.learnerEmail}
                  </span>
                  <span>
                    {o.status} · ${o.total.toFixed(2)} ·{' '}
                    {new Date(o.placedAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
