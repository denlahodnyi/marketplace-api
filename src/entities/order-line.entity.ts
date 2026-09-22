import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

import type { Order } from './order.entity.js';

import { Listing } from './listing.entity.js';

@Entity('order_lines')
@Check(`"unit_price" >= 0`)
@Check(`"discount_amount" >= 0`)
@Check(`"final_unit_price" >= 0`)
@Check(`length("currency") = 3`)
@Check(`"quantity" > 0`)
export class OrderLine {
  @PrimaryColumn('uuid', { default: () => 'uuidv7()' })
  orderId: string;

  @PrimaryColumn('uuid', { default: () => 'uuidv7()' })
  listingId: string;

  @ManyToOne('Order', (order: Order) => order.lines, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => Listing, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'listing_id' })
  listing: Listing;

  @Column('numeric', { nullable: false })
  unitPrice: string;

  @Column('numeric', { nullable: false, default: 0 })
  discountAmount: string;

  @Column('numeric', { nullable: false })
  finalUnitPrice: string;

  @Column('text', { nullable: false })
  currency: string;

  @Column('smallint', { nullable: false })
  quantity: number;

  @Column('text', { nullable: false })
  listingTitle: string;
}
