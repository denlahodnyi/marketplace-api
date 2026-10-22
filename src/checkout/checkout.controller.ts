import { Controller, Headers, Post } from '@nestjs/common';

import { CheckoutService } from './checkout.service.js';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post()
  completeCheckout(@Headers('x-user-id') userId: string) {
    // TODO: get user from auth
    return this.checkoutService.confirmCheckout(userId);
  }
}
