import type { BillingAccount } from './billing';
import { TWO_YEAR_PLAN_ID } from './marketing-copy';

export function hasActiveTwoYearUnlimited(account: BillingAccount | null | undefined): boolean {
  return (
    account?.subscription?.planCode === TWO_YEAR_PLAN_ID &&
    account.subscription.status === 'ACTIVE'
  );
}
