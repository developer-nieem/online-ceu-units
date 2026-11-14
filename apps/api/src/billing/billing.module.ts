import { Module, forwardRef } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { EnrollmentModule } from '../enrollments/enrollment.module';
import { ProviderComplianceModule } from '../provider-compliance/provider-compliance.module';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { StripeService } from './stripe.service';
import { StripeWebhookController } from './stripe-webhook.controller';

@Module({
  imports: [AuthModule, forwardRef(() => EnrollmentModule), ProviderComplianceModule],
  controllers: [BillingController, StripeWebhookController],
  providers: [BillingService, StripeService],
  exports: [BillingService, StripeService],
})
export class BillingModule {}
