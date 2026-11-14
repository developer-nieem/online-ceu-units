import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';

import { Public } from '../auth/decorators/public.decorator';
import { UnsubscribeService } from './unsubscribe.service';

/**
 * Public, token-authenticated unsubscribe endpoints. No login or CSRF token is
 * required — a recipient clicking an unsubscribe link has neither — so the
 * security boundary is the HMAC-signed token itself (see unsubscribe-token.util).
 *
 * GET endpoints never mutate state (inbox link-scanners prefetch GETs). The
 * POST endpoints perform the opt-out: `/unsubscribe` is called by our own
 * confirmation page, `/unsubscribe/one-click` is the RFC 8058 target invoked
 * by the mail provider on the user's behalf.
 */
@Controller('notifications/unsubscribe')
export class UnsubscribeController {
  constructor(private readonly unsubscribe: UnsubscribeService) {}

  @Public()
  @Get('preview')
  preview(@Query('token') token?: string) {
    if (!token) return { ok: false as const };
    return this.unsubscribe.preview(token);
  }

  @Public()
  @HttpCode(200)
  @Post()
  async confirm(@Body('token') token?: string) {
    if (!token) return { ok: false as const, reason: 'invalid_token' as const };
    return this.unsubscribe.apply(token);
  }

  @Public()
  @HttpCode(200)
  @Post('one-click')
  async oneClick(@Query('token') token?: string) {
    // RFC 8058: mail provider POSTs here; respond 200 regardless so the
    // provider records the opt-out as handled.
    if (token) {
      await this.unsubscribe.apply(token);
    }
    return { ok: true as const };
  }
}
