import {
  Check,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
} from 'typeorm';

import type { Order } from './order.entity.js';

import { primaryAsUuidEntityFactory } from './shared.js';

@Entity('payments')
@Check(`"payment_method" IN ('credit_card')`)
@Check(`length("card_last4") = 4`)
@Check(`"amount" >= 0`)
export class Payment extends primaryAsUuidEntityFactory('orderId') {
  @OneToOne('Order', (order: Order) => order.payment, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column('text', { nullable: false, default: 'credit_card' })
  paymentMethod: 'credit_card';

  @Column('text', { nullable: false })
  paymentStatus: 'pending' | 'paid';

  @Column('text', { nullable: true, name: 'card_last4' })
  cardLast4: string | null;

  @Column('integer', { nullable: false })
  amount: number;

  @Column('text', { nullable: false })
  currency: string;

  @Column('timestamp with time zone', { nullable: true })
  payedAt: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: string;

  @DeleteDateColumn({ type: 'timestamp with time zone' })
  deletedAt: string | null;
}
