import { getAdminUnlimited1yMembers } from '@/lib/admin-server';

type Props = { searchParams: Promise<{ search?: string }> };

const LOOKUP_REASON_LABEL: Record<string, string> = {
  no_matching_member: 'No member matches this search.',
  not_paid: 'This account has no successful payment for the plan.',
  mock: 'This account is a mock or test checkout, not a real Stripe payment.',
  inactive: 'This membership is not active.',
  expired: 'This membership is past its expiration.',
  refunded_or_cancelled: 'This payment was refunded or the membership was cancelled.',
};

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default async function AdminUnlimited1yMembersPage({ searchParams }: Props) {
  const { search } = await searchParams;
  const data = await getAdminUnlimited1yMembers({ search });
  const members = data?.members ?? [];
  const lookupMiss = data?.lookup?.result === 'not_eligible';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">1-Year Unlimited Members</h1>
        <p className="mt-1 text-sm text-slate-600">
          Active 1-year unlimited memberships. Search by email or name.
        </p>
      </div>

      <form method="get" className="flex flex-wrap gap-2">
        <input
          type="search"
          name="search"
          defaultValue={search ?? ''}
          placeholder="Email or name"
          className="min-w-[200px] flex-1 rounded-md border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          Search
        </button>
      </form>

      {!data ? (
        <p className="text-sm text-slate-500">Unable to load members.</p>
      ) : (
        <>
          {lookupMiss ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-950">
              <p className="font-semibold">Not eligible</p>
              <p className="mt-1">
                {LOOKUP_REASON_LABEL[data.lookup?.reason ?? ''] ??
                  'This person is not on the eligible list.'}
              </p>
            </div>
          ) : null}

          <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Membership status</th>
                  <th className="px-4 py-3">Purchase date</th>
                  <th className="px-4 py-3">Expiration</th>
                  <th className="px-4 py-3">Eligibility</th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      {search ? 'No eligible match for this search.' : 'No eligible members.'}
                    </td>
                  </tr>
                ) : (
                  members.map((member) => (
                    <tr key={member.userId} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {member.fullName || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{member.email}</td>
                      <td className="px-4 py-3">{member.membershipStatus}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(member.purchaseDate)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(member.expiresAt)}</td>
                      <td className="px-4 py-3">
                        {member.eligibility === 'eligible' ? (
                          <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                            Eligible
                          </span>
                        ) : (
                          <div>
                            <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                              Verify
                            </span>
                            {member.verifyReason ? (
                              <p className="mt-1 max-w-xs text-xs text-amber-800">
                                {member.verifyReason}
                              </p>
                            ) : null}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
