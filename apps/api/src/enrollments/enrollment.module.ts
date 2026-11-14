import { Module } from '@nestjs/common';

import { AssessmentsModule } from '../assessments/assessments.module';
import { AuthModule } from '../auth/auth.module';
import { CredentialsModule } from '../credentials/credentials.module';
import { ProgressModule } from '../progress/progress.module';
import { EnrollmentController } from './enrollment.controller';
import { EnrollmentFulfillmentService } from './enrollment-fulfillment.service';
import { EnrollmentService } from './enrollment.service';

@Module({
  imports: [AuthModule, ProgressModule, CredentialsModule, AssessmentsModule],
  controllers: [EnrollmentController],
  providers: [EnrollmentService, EnrollmentFulfillmentService],
  exports: [EnrollmentService, EnrollmentFulfillmentService],
})
export class EnrollmentModule {}
