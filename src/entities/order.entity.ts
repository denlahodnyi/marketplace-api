import {
  Check,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';

import type { OrderLine } from './order-line.entity.js';
import type { OrderRating } from './order-rating.entity.js';
import type { Payment } from './payment.entity.js';

import { primaryAsUuidEntityFactory } from './shared.js';
import { User } from './user.entity.js';

@Entity('orders')
@Check(
  `"status" IN ('pending', 'confirmed', 'awaiting_payment', 'delivering', 'delivered', 'completed', 'cancelled')`,
)
@Check(`"sub_total" >= 0`)
@Check(`"total" >= 0`)
@Check(`length("currency") = 3`)
export class Order extends primaryAsUuidEntityFactory('orderId') {
  @OneToOne('OrderRating', (orderRating: OrderRating) => orderRating.order)
  rating: OrderRating;

  @OneToMany('Payment', (payment: Payment) => payment.order)
  payment: Payment;

  @OneToMany('OrderLine', (ol: OrderLine) => ol.order)
  lines: OrderLine[];

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'buyer_id' })
  buyer: User;

  @Column('uuid', { nullable: false })
  buyerId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'seller_id' })
  seller: User;

  @Column('uuid', { nullable: false })
  sellerId: string;

  @Column('text', { nullable: false })
  status:
    | 'pending'
    | 'confirmed'
    | 'awaiting_payment'
    | 'delivering'
    | 'delivered'
    | 'completed'
    | 'cancelled';

  @Column('integer', { nullable: false })
  subTotal: number;

  @Column('integer', { nullable: false })
  total: number;

  @Column('text', { nullable: false })
  currency: string;

  // TODO: coupon_id

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: string;

  @DeleteDateColumn({ type: 'timestamp with time zone' })
  deletedAt: string | null;
}
