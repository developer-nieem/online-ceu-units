import { Controller, Get } from '@nestjs/common';

import { ROLE_SLUG } from '../config/auth.constants';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';

@Controller('users')
export class UsersController {
  @Get('admin/ping')
  @Roles(ROLE_SLUG.ADMIN)
  adminPing(@CurrentUser() user: AuthUser) {
    return { ok: true, role: ROLE_SLUG.ADMIN, userId: user.userId };
  }
}
