import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Patch,
  Post,
} from '@nestjs/common';

import { CreateCartItemDto, UpdateCartItemDto } from './cart.dto.js';
import { CartService } from './cart.service.js';

// TODO: allow guests
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  viewCart(@Headers('x-user-id') userId: string) {
    // TODO: remove x-user-id, take from auth
    return this.cartService.getUserCart(userId);
  }

  @Post()
  async addToCart(
    @Headers('x-user-id') userId: string,
    @Body() body: CreateCartItemDto,
  ) {
    // TODO: remove x-user-id, take from auth
    const cart = await this.cartService.getUserCart(userId);
    return this.cartService.addItemToCart(
      cart.cartId,
      body.listingId,
      body.quantity,
    );
  }

  @Patch('items')
  async changeItemQuantity(
    @Headers('x-user-id') userId: string,
    @Body() body: UpdateCartItemDto,
  ) {
    // TODO: remove x-user-id, take from auth
    const cart = await this.cartService.getUserCart(userId);
    return this.cartService.addItemToCart(
      cart.cartId,
      body.listingId,
      body.quantity,
    );
  }

  @Delete('items')
  async removeCartItem(
    @Headers('x-user-id') userId: string,
    listingId: string,
  ) {
    // TODO: remove x-user-id, take from auth
    const cart = await this.cartService.getUserCart(userId);
    return this.cartService.removeItem(cart.cartId, listingId);
  }

  @Delete()
  @HttpCode(204)
  async clearCart(@Headers('x-user-id') userId: string) {
    // TODO: remove x-user-id, take from auth
    const cart = await this.cartService.getUserCart(userId);
    return this.cartService.clearCart(cart.cartId);
  }
}
