import Link from 'next/link';

import { MilpitasCampusDiscountCard } from '@/components/billing/milpitas-campus-discount-card';
import { CommunityCard } from '@/components/dashboard/community-card';
import { LearningProgressCard } from '@/components/dashboard/learning-progress-card';
import { MilestoneBadgesWidget } from '@/components/dashboard/milestone-badges-widget';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { ReferralCard } from '@/components/dashboard/referral-card';
import { RecentlyCompletedWidget } from '@/components/dashboard/recently-completed-widget';
import { CnaLicensePromptBanner } from '@/components/account/cna-license-prompt-banner';
import { WelcomeHeader } from '@/components/dashboard/welcome-header';
import { getAccountProfileServer } from '@/lib/account-server';
import { getServerSession } from '@/lib/auth-server';
import { getProgressSummary } from '@/lib/progress-server';
import { getBillingAccount } from '@/lib/billing-server';
import { getReferralStats } from '@/lib/referral-server';
import { hasActiveTwoYearUnlimited } from '@/lib/subscription-utils';

export default async function DashboardPage() {
  const [summary, billing, session, profile, referral] = await Promise.all([
    getProgressSummary(),
    getBillingAccount(),
    getServerSession(),
    getAccountProfileServer().catch(() => null),
    getReferralStats().catch(() => null),
  ]);
  const memberSince = profile?.readOnly?.memberSince ?? null;
  const user = session.data?.user;
  const firstName = user?.firstName?.trim() || 'Learner';
  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
    user?.email ||
    'Learner';
  const emailVerified = user?.emailVerified ?? false;
  const showCnaLicensePrompt = Boolean(
    profile && !profile.editable.cnaLicenseNumber?.trim(),
  );
  const showMilpitasDiscount = hasActiveTwoYearUnlimited(billing);

  const completedCoursesCount = summary?.completedCoursesCount ?? 0;
  const milestoneBadgesEarned =
    summary?.milestoneBadgesEarned ?? Math.floor(completedCoursesCount / 3);

  return (
    <div className="space-y-8">
      <WelcomeHeader
        firstName={firstName}
        name={fullName}
        emailVerified={emailVerified}
        memberSince={memberSince}
      />

      {showCnaLicensePrompt ? <CnaLicensePromptBanner /> : null}

      {showMilpitasDiscount ? <MilpitasCampusDiscountCard /> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <MilestoneBadgesWidget
          completedCoursesCount={completedCoursesCount}
          milestoneBadgesEarned={milestoneBadgesEarned}
        />
        <CommunityCard />
      </div>

      {summary ? (
        <>
          <LearningProgressCard summary={summary} />
          <RecentlyCompletedWidget summary={summary} />
        </>
      ) : (
        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Sign in to track your courses, badges, and CEU progress.
          </p>
          <Link
            href="/courses"
            className="mt-3 inline-block text-sm font-medium text-teal-800 underline"
          >
            Browse courses
          </Link>
        </section>
      )}

      <QuickActions />

      <ReferralCard referral={referral} />
    </div>
  );
}
