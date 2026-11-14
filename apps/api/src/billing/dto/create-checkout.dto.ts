import { IsIn, IsOptional, IsString, IsUrl } from 'class-validator';

import { PURCHASE_PLANS } from '../../enrollments/pricing.constants';

export class CreateCheckoutDto {
  @IsIn(PURCHASE_PLANS)
  purchasePlan!: (typeof PURCHASE_PLANS)[number];

  @IsOptional()
  @IsString()
  courseSlug?: string;

  /** @deprecated No longer used — Stripe Elements handles return URLs on the client. */
  @IsOptional()
  @IsUrl({ require_tld: false })
  successUrl?: string;

  /** @deprecated No longer used — checkout stays on the CAL ACE domain. */
  @IsOptional()
  @IsUrl({ require_tld: false })
  cancelUrl?: string;
}
