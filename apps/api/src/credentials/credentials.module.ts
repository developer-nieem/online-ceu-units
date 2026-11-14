import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { CertificateCeuSyncService } from './certificate-ceu-sync.service';
import { CertificateController } from './certificate.controller';
import { CertificateService } from './certificate.service';
import { ComplianceController } from './compliance.controller';
import { ComplianceService } from './compliance.service';
import { CredentialsOrchestratorService } from './credentials-orchestrator.service';
import { TranscriptController } from './transcript.controller';
import { TranscriptService } from './transcript.service';

@Module({
  imports: [AuditModule],
  controllers: [CertificateController, TranscriptController, ComplianceController],
  providers: [
    CertificateCeuSyncService,
    CertificateService,
    TranscriptService,
    ComplianceService,
    CredentialsOrchestratorService,
  ],
  exports: [CredentialsOrchestratorService, CertificateService, ComplianceService],
})
export class CredentialsModule {}
