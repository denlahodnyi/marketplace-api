import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
} from 'typeorm';

import type { Order } from './order.entity.js';

import { primaryAsUuidEntityFactory } from './shared.js';
import { User } from './user.entity.js';

@Entity('order_rating')
@Check(`"rating" > 0 AND "rating" <= 5`)
export class OrderRating extends primaryAsUuidEntityFactory('ratingId') {
  @OneToOne('Order', (order: Order) => order.rating, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column('uuid', { nullable: false })
  orderId: string;

  @OneToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'buyer_id' })
  buyer: User;

  @Column('uuid', { nullable: false })
  buyerId: string;

  @Column('smallint', { nullable: false })
  rating: number;

  @Column('text', { nullable: true })
  review: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: string;
}
