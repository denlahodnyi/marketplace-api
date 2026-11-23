import type { Channel, Message } from 'amqplib';

import { Controller } from '@nestjs/common';
import { Ctx, MessagePattern, RmqContext } from '@nestjs/microservices';

import { RMQ_EVENTS, type OrderCreatedMessage } from '../rabbitmq-setup.js';
import { NotificationService } from './notification.service.js';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notifyService: NotificationService) {}

  @MessagePattern(RMQ_EVENTS.orderCreated)
  async handleCreatedOrder(_: unknown, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef() as Channel;
    const originalMsg = context.getMessage() as Message;
    const { type, messageId, headers } = originalMsg.properties;
    const content = JSON.parse(originalMsg.content.toString()) as {
      pattern: string;
      data: OrderCreatedMessage;
    };

    if (headers?.['x-death']) {
      // Message from DLQ
      console.log(`[DLQ]:reason=${headers['x-first-death-reason']}`);
      // channel.reject(originalMsg, true);
      return;
    }
    // if (originalMsg.fields.redelivered) {
    //   return;
    // }

    try {
      await this.notifyService.createNotificationForCreatedOrder({
        eventId: messageId,
        orderId: content.data.orderId,
      });
      channel.ack(originalMsg);
    } catch {
      channel.reject(originalMsg, false);
    }
  }
}
