import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CsrfGuard } from '../auth/guards/csrf.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { AccountService } from './account.service';
import { UpdateAccountProfileDto } from './dto/update-account-profile.dto';

@Controller('account')
export class AccountController {
  constructor(private readonly account: AccountService) {}

  @Get('profile')
  getProfile(@CurrentUser() user: AuthUser) {
    return this.account.getProfile(user);
  }

  @UseGuards(CsrfGuard)
  @Patch('profile')
  updateProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateAccountProfileDto) {
    return this.account.updateProfile(user, dto);
  }
}
