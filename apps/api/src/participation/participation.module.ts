import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { ParticipationController } from './participation.controller';
import { ParticipationEnforcementService } from './participation-enforcement.service';
import { ParticipationLedgerService } from './participation-ledger.service';
import { ParticipationService } from './participation.service';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [ParticipationController],
  providers: [
    ParticipationService,
    ParticipationLedgerService,
    ParticipationEnforcementService,
  ],
  exports: [ParticipationService, ParticipationLedgerService],
})
export class ParticipationModule {}
