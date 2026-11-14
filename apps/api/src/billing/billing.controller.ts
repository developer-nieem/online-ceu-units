import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CsrfGuard } from '../auth/guards/csrf.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { BillingService } from './billing.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';

@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get('account')
  account(@CurrentUser() user: AuthUser) {
    return this.billing.getAccount(user);
  }

  @UseGuards(CsrfGuard)
  @Post('initialize-payment')
  initializePayment(@CurrentUser() user: AuthUser, @Body() dto: CreateCheckoutDto) {
    return this.billing.initializePayment(user, dto);
  }

  /** @deprecated Use POST /billing/initialize-payment */
  @UseGuards(CsrfGuard)
  @Post('checkout-session')
  checkoutSession(@CurrentUser() user: AuthUser, @Body() dto: CreateCheckoutDto) {
    return this.billing.initializePayment(user, dto);
  }

  @UseGuards(CsrfGuard)
  @Post('mock-checkout')
  mockCheckout(@CurrentUser() user: AuthUser, @Body() dto: CreateCheckoutDto) {
    return this.billing.processMockCheckout(user, dto);
  }

  @Public()
  @Post('webhook')
  webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature?: string,
  ) {
    const payload = req.rawBody ?? Buffer.from('');
    return this.billing.handleWebhook(payload, signature);
  }
}
