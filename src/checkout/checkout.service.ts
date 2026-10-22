import { ConflictException, HttpStatus, Injectable } from '@nestjs/common';
import { DataSource, In } from 'typeorm';

import type { ProblemJson } from '../common/filters/problem.filter.js';

import { CheckoutException } from '../common/exceptions.js';
import { CartDetail } from '../entities/cart-details.entity.js';
import { Cart } from '../entities/cart.entity.js';
import { Listing } from '../entities/listing.entity.js';
import { OrderLine } from '../entities/order-line.entity.js';
import { Order } from '../entities/order.entity.js';
import { Payment } from '../entities/payment.entity.js';

interface CheckoutDetails {
  shippingAddress: {
    country: string;
    city: string;
    addressLine: string;
    postalCode: string;
  };
}

@Injectable()
export class CheckoutService {
  constructor(private readonly dataSource: DataSource) {}

  getCheckout() {}

  async confirmCheckout(userId: string) {
    return await this.dataSource.transaction(async (tx) => {
      const cart = await tx.getRepository(Cart).findOne({
        where: { userId },
        relations: { details: { listing: true } },
        select: {
          details: {
            listingId: true,
            cartId: true,
            quantity: true,
            listing: { userId: true, price: true, currency: true, title: true },
          },
        },
      });
      if (!cart?.details.length) {
        throw new ConflictException('Cart is empty');
      }
      const listings = await tx.getRepository(Listing).find({
        where: {
          listingId: In(cart.details.map((d) => d.listingId)),
          status: 'active',
        },
        select: { price: true, listingId: true, quantity: true, userId: true },
        lock: { mode: 'for_no_key_update' },
      });

      // Check listings availability
      const errors: ProblemJson['checkoutErrors'] = [];
      cart.details.forEach((it) => {
        const listing = listings.find((li) => li.listingId === it.listingId);
        if (!listing) {
          errors.push({ code: 'UNAVAILABLE_LISTING', listingId: it.listingId });
          return;
        }
        if (it.quantity > listing.quantity) {
          errors.push({
            code: 'INVALID_AMOUNT',
            listingId: it.listingId,
            message: 'You are trying to order more than we have',
            availableQty: listing.quantity,
          });
        }
      });
      if (errors.length) {
        const e = new CheckoutException(
          'Something goes wrong during checkout',
          HttpStatus.CONFLICT,
        );
        e.checkoutErrors = errors;
        throw e;
      }

      // Change quantity
      await Promise.all(
        cart.details.map((it) =>
          tx
            .getRepository(Listing)
            .update(
              { listingId: it.listingId },
              { quantity: () => `quantity - ${it.quantity}` },
            ),
        ),
      );

      // Place orders per seller
      const cartDetailsPerSeller = Object.groupBy(
        cart.details,
        (it) => it.listing.userId,
      );
      const createdOrders = await tx.getRepository(Order).save(
        Object.keys(cartDetailsPerSeller).map((sellerId) => {
          const total = cartDetailsPerSeller[sellerId]?.reduce(
            (sum, it) => it.listing.price + sum,
            0,
          );
          const lines = cartDetailsPerSeller[sellerId]?.map((it) =>
            tx.getRepository(OrderLine).create({
              listingId: it.listingId,
              quantity: it.quantity,
              currency: it.listing.currency,
              listingTitle: it.listing.title,
              unitPrice: it.listing.price,
              finalUnitPrice: it.listing.price,
            }),
          );
          // TODO: payment method from front???
          const payment = tx.getRepository(Payment).create({
            amount: total,
            paymentMethod: 'credit_card',
            paymentStatus: 'pending',
            currency: lines?.[0].currency, // TODO: currency can differ. Separate orders by seller+currency???
          });
          return {
            // TODO: add shipping details
            // TODO: add customer details
            buyerId: userId,
            sellerId,
            currency: lines?.[0].currency, // TODO: currency can differ. Separate orders by seller+currency???
            status: 'pending',
            subTotal: total,
            total: total,
            lines,
            payment,
          };
        }),
      );

      // Remove cart items
      await tx
        .getRepository(CartDetail)
        .delete(
          cart.details.map(({ cartId, listingId }) => ({ cartId, listingId })),
        );

      return createdOrders;
    });
  }
}
