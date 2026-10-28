import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, type Repository } from 'typeorm';

import { CartDetail } from '../entities/cart-details.entity.js';
import { Cart } from '../entities/cart.entity.js';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepo: Repository<Cart>,
    @InjectRepository(CartDetail)
    private readonly cartDetailsRepo: Repository<CartDetail>,
    private readonly dataSource: DataSource,
  ) {}

  createUserCart(userId: string) {
    return this.cartRepo.save(this.cartRepo.create({ userId }));
  }

  async getUserCart(userId: string) {
    const cart = await this.cartRepo.findOne({
      where: { userId },
      relations: { details: { listing: true } },
      select: {
        cartId: true,
        details: {
          quantity: true,
          listing: { listingId: true, title: true, price: true },
        },
      },
    });
    return cart ?? (await this.cartRepo.save(this.cartRepo.create({ userId })));
  }

  async addItemToCart(cartId: string, listingId: string, quantity: number) {
    // TODO: check that cart exists???
    if (await this.cartDetailsRepo.exists({ where: { cartId, listingId } })) {
      await this.cartDetailsRepo.update({ cartId, listingId }, { quantity });
    } else {
      await this.cartDetailsRepo.insert({ cartId, listingId, quantity });
    }
    return this.cartRepo.findOne({
      where: { cartId },
      relations: { details: { listing: true } },
      select: {
        cartId: true,
        details: {
          quantity: true,
          listing: { listingId: true, title: true, price: true },
        },
      },
    });
  }

  async changeItemQty(cartId: string, listingId: string, quantity: number) {
    // TODO: check that cart exists???
    await this.cartDetailsRepo.update({ cartId, listingId }, { quantity });
    return this.cartRepo.findOne({
      where: { cartId },
      relations: { details: { listing: true } },
      select: {
        cartId: true,
        details: {
          quantity: true,
          listing: { listingId: true, title: true, price: true },
        },
      },
    });
  }

  async removeItem(cartId: string, listingId: string) {
    // TODO: check that cart exists???
    await this.cartDetailsRepo.delete({ cartId, listingId });
    return this.cartRepo.findOne({
      where: { cartId },
      relations: { details: { listing: true } },
      select: {
        cartId: true,
        details: {
          quantity: true,
          listing: { listingId: true, title: true, price: true },
        },
      },
    });
  }

  async clearCart(cartId: string) {
    await this.cartDetailsRepo.delete({ cartId });
  }
}
