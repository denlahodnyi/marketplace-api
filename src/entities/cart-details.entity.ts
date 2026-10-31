import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

import type { Cart } from './cart.entity.js';

import { Listing } from './listing.entity.js';

@Entity('cart_details')
@Check(`"quantity" > 0`)
export class CartDetail {
  @PrimaryColumn('uuid', { default: () => 'uuidv7()' })
  cartId: string;

  @PrimaryColumn('uuid', { default: () => 'uuidv7()' })
  listingId: string;

  @ManyToOne('Cart', (cart: Cart) => cart.details, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cart_id' })
  cart: Cart;

  @ManyToOne(() => Listing, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listing_id' })
  listing: Listing;

  @Column('smallint', { nullable: false })
  quantity: number;
}
