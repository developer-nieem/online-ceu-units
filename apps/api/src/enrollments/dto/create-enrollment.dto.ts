import { IsIn, IsOptional, IsString } from 'class-validator';

import type { EnrollmentActivationSource } from '../enrollment-fulfillment.types';
import { PURCHASE_PLANS } from '../pricing.constants';

export class CreateEnrollmentDto {
  @IsString()
  courseSlug!: string;

  /** Required for paid courses; omitted for free freemium courses. */
  @IsOptional()
  @IsIn(PURCHASE_PLANS)
  purchasePlan?: (typeof PURCHASE_PLANS)[number];

  /** Stripe-fulfilled order — skips mock checkout when set. */
  @IsOptional()
  @IsString()
  existingOrderId?: string;

  /** Billing activation channel for credential fulfillment metadata. */
  @IsOptional()
  @IsIn(['stripe', 'free', 'mock', 'subscription'])
  activationSource?: EnrollmentActivationSource;

  /**
   * Internal — Stripe checkout fulfillment orchestrates credentials after enrollment
   * to avoid duplicate issuance and keep order metadata authoritative.
   */
  @IsOptional()
  skipCredentialFulfillment?: boolean;
}
