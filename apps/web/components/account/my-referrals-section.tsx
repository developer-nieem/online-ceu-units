import { Badge } from '@calace/ui/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@calace/ui/components/ui/card';
import { Gift } from 'lucide-react';

import { ReferralCopyLinkButton } from '@/components/account/referral-copy-link-button';
import type { ReferralStats } from '@/lib/referral';

function formatRewardCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function referralStatusLabel(status: string): string {
  if (status === 'REWARDED') return 'Rewarded';
  if (status === 'CONVERTED') return 'Converted';
  return 'Pending';
}

function referralStatusBadgeClass(status: string): string {
  if (status === 'REWARDED') {
    return 'border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-50';
  }
  return 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-50';
}

export function MyReferralsSection({ referral }: { referral: ReferralStats | null }) {
  if (!referral?.referralCode) return null;

  const { referralCode, referralLink, stats, referrals } = referral;
  const hasReferrals = referrals.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Gift className="h-4 w-4 text-teal-700" aria-hidden />
          My Referrals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Your referral code</p>
            <p className="inline-block rounded-md bg-muted px-2 py-1 font-mono text-sm font-medium">
              {referralCode}
            </p>
          </div>
          <ReferralCopyLinkButton referralLink={referralLink} />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border bg-muted/30 px-3 py-2 text-center">
            <p className="text-lg font-semibold text-teal-800">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div className="rounded-lg border bg-muted/30 px-3 py-2 text-center">
            <p className="text-lg font-semibold text-teal-800">{stats.rewarded}</p>
            <p className="text-xs text-muted-foreground">Rewarded</p>
          </div>
          <div className="rounded-lg border bg-muted/30 px-3 py-2 text-center">
            <p className="text-lg font-semibold text-teal-800">
              ${formatRewardCents(stats.totalRewardCents)}
            </p>
            <p className="text-xs text-muted-foreground">Reward credit</p>
          </div>
        </div>

        {hasReferrals ? (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="border-b bg-muted/30 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Friend</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Package</th>
                  <th className="px-3 py-2 font-medium">Reward</th>
                  <th className="px-3 py-2 font-medium">Expires</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((row) => {
                  const friendLabel = row.refereeName.trim() || row.refereeEmail;
                  const rewardLabel =
                    row.rewardAmountCents != null
                      ? `$${formatRewardCents(row.rewardAmountCents)}`
                      : '—';
                  const expiresLabel = row.rewardExpiresAt
                    ? formatDate(row.rewardExpiresAt)
                    : '—';

                  return (
                    <tr key={row.referralId} className="border-b last:border-b-0">
                      <td className="px-3 py-2">{friendLabel}</td>
                      <td className="px-3 py-2">
                        <Badge
                          variant="outline"
                          className={referralStatusBadgeClass(row.status)}
                        >
                          {referralStatusLabel(row.status)}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">{row.packagePurchased ?? '—'}</td>
                      <td className="px-3 py-2">{rewardLabel}</td>
                      <td className="px-3 py-2">{expiresLabel}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
            <p className="text-sm text-muted-foreground">
              You haven&apos;t referred anyone yet. Share your referral link to earn a free course
              ($3.75 credit) when your friend makes their first purchase.
            </p>
            <ReferralCopyLinkButton referralLink={referralLink} />
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Each friend can only be referred once. Referral rewards expire 1 year from the date earned
          and do not roll over. Reward is credited to your account after your friend completes their
          first purchase.
        </p>
      </CardContent>
    </Card>
  );
}
