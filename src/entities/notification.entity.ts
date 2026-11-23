import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  Unique,
} from 'typeorm';

import { primaryAsUuidEntityFactory } from './shared.js';
import { User } from './user.entity.js';

/**
 * @description In-App notification
 */
@Entity('notifications')
@Check(
  `"type" IN ('order_created', 'order_confirmed', 'order_paid', 'order_shipped', 'order_completed', 'order_cancelled', 'listing_approved', 'listing_rejected')`,
)
@Unique(['userId', 'type', 'eventId'])
export class Notification extends primaryAsUuidEntityFactory('notificationId') {
  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column('uuid', { nullable: false })
  userId: string;

  @Column('uuid', { nullable: true })
  eventId: string;

  @Column('text', { nullable: false })
  type:
    | 'order_created'
    | 'order_confirmed'
    | 'order_paid'
    | 'order_shipped'
    | 'order_completed'
    | 'order_cancelled'
    | 'listing_approved'
    | 'listing_rejected';

  @Column('text', { nullable: false })
  title: string;

  @Column('text', { nullable: true })
  body: string | null;

  @Column('jsonb', { nullable: true })
  data: object | null;

  @Column('timestamp with time zone', { nullable: true })
  readAt: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: string;
}
