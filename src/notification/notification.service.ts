import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { NotificationDelivery } from '../entities/notification-deliveries.entity.js';
import { Notification } from '../entities/notification.entity.js';
import { Order } from '../entities/order.entity.js';
import {
  PROCESSED_CONSUMER,
  ProcessedMessages,
} from '../entities/processed.entity.js';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notifyRepo: Repository<Notification>,
    private readonly dataSource: DataSource,
  ) {}

  async createNotificationForCreatedOrder(data: {
    eventId: string;
    orderId: string;
  }) {
    await this.dataSource.transaction(async (tx) => {
      const order = await tx
        .getRepository(Order)
        .findOneBy({ orderId: data.orderId, status: 'pending' });
      if (!order) throw new NotFoundException("Order doesn't exist");

      const processed = await tx
        .createQueryBuilder()
        .insert()
        .into(ProcessedMessages)
        .values({
          messageId: data.eventId,
          consumer: PROCESSED_CONSUMER.notifications,
        })
        .orIgnore() // <-- ON CONFLICT DO NOTHING
        .returning(['messageId'])
        .execute();

      if (processed.identifiers.length === 0) return; // duplicate

      const notifRes = await tx
        .createQueryBuilder()
        .insert()
        .into(Notification)
        .values({
          userId: order.sellerId,
          eventId: data.eventId,
          type: 'order_created',
          title: 'New order was created',
          body: '',
          data: { orderId: data.orderId },
        })
        .orIgnore() // <-- ON CONFLICT DO NOTHING
        .returning(['notificationId'])
        .execute();

      if (notifRes?.generatedMaps?.[0]) {
        await tx
          .createQueryBuilder()
          .insert()
          .into(NotificationDelivery)
          .values([
            {
              notificationId: notifRes.generatedMaps[0].notificationId,
              status: 'delivered',
              channel: 'in_app',
            },
            {
              notificationId: notifRes.generatedMaps[0].notificationId,
              status: 'pending',
              channel: 'email',
            },
          ])
          .execute();
      }
    });

    // TODO: send email
  }
}
