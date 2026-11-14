import {
  Controller,
  Headers,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';

import { Public } from '../auth/decorators/public.decorator';
import { BillingService } from './billing.service';

@Controller('webhooks/stripe')
export class StripeWebhookController {
  constructor(private readonly billing: BillingService) {}

  @Public()
  @Post()
  webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature?: string,
  ) {
    const payload = req.rawBody ?? Buffer.from('');
    return this.billing.handleWebhook(payload, signature);
  }
}
