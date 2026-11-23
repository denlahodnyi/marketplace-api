import { Check, Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';

import { Notification } from './notification.entity.js';
import { primaryAsUuidEntityFactory } from './shared.js';

@Entity('notification_deliveries')
@Unique(['notificationId', 'channel'])
@Check(`"status" IN ('pending', 'delivered', 'failed')`)
@Check(`"channel" IN ('in_app', 'email')`)
export class NotificationDelivery extends primaryAsUuidEntityFactory('id') {
  @ManyToOne(() => Notification, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'notification_id' })
  notification: Notification;

  @Column('uuid', { nullable: true })
  notificationId: string;

  @Column('text', { nullable: false })
  status: 'pending' | 'delivered' | 'failed';

  @Column('text', { nullable: false })
  channel: 'in_app' | 'email';
}
