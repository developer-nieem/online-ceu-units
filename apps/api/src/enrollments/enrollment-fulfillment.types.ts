import type { PurchasePlan } from './pricing.constants';

export type EnrollmentActivationSource = 'stripe' | 'free' | 'mock' | 'subscription';

export type EnrollmentFulfillmentStatus =
  | 'enrolled'
  | 'compliance_complete'
  | 'certificate_pending'
  | 'requires_repurchase'
  | 'requires_reset';

export type EnrollmentFulfillmentInput = {
  userId: string;
  tenantId: string;
  courseSlug: string;
  planType: PurchasePlan;
  enrollmentId: string;
  orderId?: string;
  activationSource: EnrollmentActivationSource;
};

export type EnrollmentFulfillmentResult = {
  status: EnrollmentFulfillmentStatus;
  enrollmentId: string;
  completionId?: string;
  certificateId?: string;
  certificateNo?: string;
  complianceComplete: boolean;
  certificatePending: boolean;
  fulfillmentError?: string;
  note: string;
};

export type OrderFulfillmentMeta = {
  enrollmentId?: string;
  fulfillmentStatus?: EnrollmentFulfillmentStatus;
  completionId?: string;
  certificateId?: string;
  certificateNo?: string;
  complianceComplete?: boolean;
  certificatePending?: boolean;
  fulfillmentError?: string;
  fulfillmentRetryAt?: string;
  fulfilledAt?: string;
  planType?: PurchasePlan;
  courseSlug?: string;
  activationSource?: EnrollmentActivationSource;
};
