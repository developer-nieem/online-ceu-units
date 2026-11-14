import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CsrfGuard } from '../auth/guards/csrf.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { SupportService } from './support.service';

@Controller('support/tickets')
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Get()
  listMine(@CurrentUser() user: AuthUser) {
    return this.support.listMine(user);
  }

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseGuards(CsrfGuard)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateSupportTicketDto) {
    return this.support.create(user, dto);
  }
}
