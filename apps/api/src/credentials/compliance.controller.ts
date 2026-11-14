import { Controller, Get } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import { ComplianceService } from './compliance.service';

@Controller('compliance')
export class ComplianceController {
  constructor(private readonly compliance: ComplianceService) {}

  @Get('summary')
  summary(@CurrentUser() user: AuthUser) {
    return this.compliance.getSummary(user);
  }

  @Get('renewal-periods')
  renewalPeriods(@CurrentUser() user: AuthUser) {
    return this.compliance.listRenewalPeriods(user);
  }
}
