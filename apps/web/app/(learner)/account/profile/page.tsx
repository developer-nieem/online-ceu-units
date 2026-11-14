import Link from 'next/link';

import { MyReferralsSection } from '@/components/account/my-referrals-section';
import { CommunityCard } from '@/components/dashboard/community-card';
import { LearnerProfileForm } from '@/components/account/learner-profile-form';
import { getAccountProfileServer } from '@/lib/account-server';
import { getReferralStats } from '@/lib/referral-server';
import { SUPPORT_EMAIL } from '@/lib/support';

export default async function AccountProfilePage() {
  const [referral, profile] = await Promise.all([
    getReferralStats().catch(() => null),
    getAccountProfileServer(),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm">
          <Link href="/dashboard" className="text-teal-800 underline">
            ← Dashboard
          </Link>
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Account profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your identity and California CNA renewal information used for certificates and
          compliance tracking.
        </p>
      </div>

      <LearnerProfileForm initialProfile={profile} />

      <CommunityCard />

      <MyReferralsSection referral={referral} />

      <p className="text-sm text-muted-foreground">
        Questions about your account? Contact{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-teal-800 underline">
          {SUPPORT_EMAIL}
        </a>
        .
      </p>
    </div>
  );
}
