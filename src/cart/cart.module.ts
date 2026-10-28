import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CartDetail } from '../entities/cart-details.entity.js';
import { Cart } from '../entities/cart.entity.js';
import { CartController } from './cart.controller.js';
import { CartService } from './cart.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Cart, CartDetail])],
  controllers: [CartController],
  providers: [CartService],
})
export class CartModule {}
