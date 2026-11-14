import { Global, Module } from '@nestjs/common';

import { ProviderComplianceSettingsService } from './provider-compliance-settings.service';

@Global()
@Module({
  providers: [ProviderComplianceSettingsService],
  exports: [ProviderComplianceSettingsService],
})
export class ProviderComplianceModule {}
