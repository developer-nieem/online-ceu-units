import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuditModule } from './audit/audit.module';
import { AssessmentsModule } from './assessments/assessments.module';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { BillingModule } from './billing/billing.module';
import { CredentialsModule } from './credentials/credentials.module';
import { EnrollmentModule } from './enrollments/enrollment.module';
import { HealthModule } from './health/health.module';
import { ParticipationModule } from './participation/participation.module';
import { PlayerModule } from './player/player.module';
import { ProgressModule } from './progress/progress.module';
import { EmailModule } from './email/email.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { CmsModule } from './cms/cms.module';
import { AccountModule } from './account/account.module';
import { AdminModule } from './admin/admin.module';
import { ProviderComplianceModule } from './provider-compliance/provider-compliance.module';
import { ReferralsModule } from './referrals/referrals.module';
import { SupportModule } from './support/support.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // On Railway/production, only use platform Variables (never baked .env / examples).
      ignoreEnvFile:
        process.env.NODE_ENV === 'production' ||
        Boolean(process.env.RAILWAY_ENVIRONMENT),
      envFilePath: ['.env.local', '.env', '../../.env.local', '../../.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
      },
    ]),
    PrismaModule,
    ProviderComplianceModule,
    AuditModule,
    EmailModule,
    NotificationsModule,
    AuthModule,
    CatalogModule,
    EnrollmentModule,
    ProgressModule,
    ParticipationModule,
    CredentialsModule,
    AssessmentsModule,
    PlayerModule,
    BillingModule,
    HealthModule,
    AccountModule,
    SupportModule,
    UsersModule,
    CmsModule,
    AdminModule,
    ReferralsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
