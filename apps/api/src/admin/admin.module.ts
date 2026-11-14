import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { CredentialsModule } from '../credentials/credentials.module';
import { EnrollmentModule } from '../enrollments/enrollment.module';
import { AdminAnalyticsService } from './admin-analytics.service';
import { AdminAuditService } from './admin-audit.service';
import { AdminComplianceSettingsService } from './admin-compliance-settings.service';
import { AdminController } from './admin.controller';
import { AdminCoursesService } from './admin-courses.service';
import { AdminCredentialsService } from './admin-credentials.service';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminLearnersService } from './admin-learners.service';
import { AdminMembersService } from './admin-members.service';
import { AdminSupportService } from './admin-support.service';

@Module({
  imports: [AuditModule, CredentialsModule, EnrollmentModule],
  controllers: [AdminController],
  providers: [
    AdminDashboardService,
    AdminLearnersService,
    AdminMembersService,
    AdminCoursesService,
    AdminCredentialsService,
    AdminAuditService,
    AdminSupportService,
    AdminComplianceSettingsService,
    AdminAnalyticsService,
  ],
})
export class AdminModule {}
