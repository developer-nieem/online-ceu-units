import { CeuDeadlineCalculator } from '@/components/account/ceu-deadline-calculator';
import { PortalPage } from '@/components/learner/portal-page';

export const metadata = {
  title: 'CE Hours Calculator | CAL ACE Nursing Academy',
};

export default function CeuCalculatorPage() {
  return (
    <PortalPage
      backHref="/"
      backAriaLabel="Back to Home"
      description="Estimate the continuing education hours you need for your California CNA renewal."
      title="CE Hours Calculator"
    >
      <CeuDeadlineCalculator />
    </PortalPage>
  );
}
