import { Controller, Get, Param, Query } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import { CertificateService } from './certificate.service';
import { CredentialsOrchestratorService } from './credentials-orchestrator.service';

@Controller('certificates')
export class CertificateController {
  constructor(
    private readonly certificates: CertificateService,
    private readonly orchestrator: CredentialsOrchestratorService,
  ) {}

  @Get('my')
  async listMine(@CurrentUser() user: AuthUser) {
    await this.orchestrator.syncPendingCompletions(user);
    return this.certificates.listForUser(user);
  }

  @Public()
  @Get('verify')
  verifyBySerialAndLastName(
    @Query('serialNumber') serialNumber?: string,
    @Query('lastName') lastName?: string,
  ) {
    return this.certificates.verifyBySerialAndLastName(serialNumber ?? '', lastName ?? '');
  }

  @Public()
  @Get('verify/certificate/:certificateNo')
  verifyByCertificateNumber(@Param('certificateNo') certificateNo: string) {
    return this.certificates.verifyByCertificateNumber(certificateNo);
  }

  @Public()
  @Get('verify/:token')
  verify(@Param('token') token: string) {
    return this.certificates.verifyByToken(token);
  }

  @Get(':id')
  async getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.orchestrator.syncPendingCompletions(user);
    return this.certificates.getForUser(user, id);
  }
}
