'use client';

import { useState } from 'react';

import { Button } from '@calace/ui/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@calace/ui/components/ui/card';
import { Gift } from 'lucide-react';

import type { ReferralStats } from '@/lib/referral';

function formatRewardCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function ReferralCard({ referral }: { referral: ReferralStats | null }) {
  const [copied, setCopied] = useState(false);

  if (!referral?.referralCode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Gift className="h-4 w-4 text-teal-700" aria-hidden />
            Refer a Friend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Your referral link is loading...</p>
        </CardContent>
      </Card>
    );
  }

  const { referralCode, referralLink, stats } = referral;
  const hasReferrals = stats.pending + stats.converted + stats.rewarded > 0;

  async function copyReferralLink() {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable outside secure contexts
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Gift className="h-4 w-4 text-teal-700" aria-hidden />
          Refer a Friend
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Your referral code</p>
          <p className="inline-block rounded-md bg-muted px-2 py-1 font-mono text-sm font-medium">
            {referralCode}
          </p>
        </div>

        {!hasReferrals ? (
          <>
            <p className="text-xs text-muted-foreground break-all">{referralLink}</p>
            <p className="text-sm text-muted-foreground">
              You haven&apos;t referred anyone yet. Share your link and earn a free course ($3.75
              credit) when your friend makes their first purchase.
            </p>
          </>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border bg-muted/30 px-3 py-2 text-center">
                <p className="text-lg font-semibold text-teal-800">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
              <div className="rounded-lg border bg-muted/30 px-3 py-2 text-center">
                <p className="text-lg font-semibold text-teal-800">{stats.converted}</p>
                <p className="text-xs text-muted-foreground">Converted</p>
              </div>
              <div className="rounded-lg border bg-muted/30 px-3 py-2 text-center">
                <p className="text-lg font-semibold text-teal-800">{stats.rewarded}</p>
                <p className="text-xs text-muted-foreground">Rewarded</p>
              </div>
            </div>
            {stats.totalRewardCents > 0 ? (
              <p className="text-sm font-medium text-teal-800">
                You&apos;ve earned ${formatRewardCents(stats.totalRewardCents)} in referral credits
              </p>
            ) : null}
          </>
        )}

        <Button type="button" variant="outline" size="sm" onClick={copyReferralLink}>
          {copied ? 'Copied!' : 'Copy referral link'}
        </Button>
      </CardContent>
    </Card>
  );
}
