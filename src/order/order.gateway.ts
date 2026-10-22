import { BadRequestException } from '@nestjs/common';
import {
  Ack,
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  type WsResponse,
} from '@nestjs/websockets';
import { Observable } from 'rxjs';
import { type Namespace, type Socket } from 'socket.io';

import { OrderEventsService } from './order-events.service.js';
import { OrderService } from './order.service.js';

@WebSocketGateway({ namespace: 'orders' })
export class OrderGateway {
  constructor(
    private readonly eventsSource: OrderEventsService,
    private readonly orderService: OrderService,
  ) {}

  @WebSocketServer()
  server: Namespace;

  afterInit(server: Namespace) {
    const subscription = this.eventsSource.events.subscribe((data) => {
      server.to(`order:${data.orderId}`).emit(data.event, {
        orderId: data.orderId,
        status: data.status,
      });
    });
    server.once('disconnect', () => {
      subscription.unsubscribe();
    });
  }

  @SubscribeMessage('join')
  async join(
    @MessageBody() room: string,
    @ConnectedSocket() socket: Socket,
    @Ack() ack: (response: { join: boolean; room: string }) => void,
  ): Promise<Observable<
    WsResponse<{ orderId: string; status: string; socketId?: string }>
  > | void> {
    const [, orderId] = room.split(':');
    if (!orderId) throw new BadRequestException();
    const order = await this.orderService.getOrder(orderId);

    // Check that client owns order
    if (order && socket.handshake.auth.userId === order.buyerId) {
      socket.join(room);
      ack({ join: true, room });
    } else {
      ack({ join: false, room });
    }
  }
}
