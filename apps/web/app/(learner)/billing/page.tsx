import { BillingAccountPanel } from '@/components/billing/billing-account-panel';
import { PricingPlans } from '@/components/catalog/pricing-plans';
import { PageHeader } from '@/components/learner/page-header';
import { getBillingAccount } from '@/lib/billing-server';
import { getCatalogCourses } from '@/lib/catalog-server';

export default async function BillingPage() {
  const [account, courses] = await Promise.all([getBillingAccount(), getCatalogCourses()]);
  const paidCourseCount = courses.filter((c) => !c.isFree).length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Billing & Plans"
        description="Manage your subscription, view order history, and purchase CEU access."
      />
      <BillingAccountPanel account={account} />
      <PricingPlans paidCourseCount={paidCourseCount} />
    </div>
  );
}
