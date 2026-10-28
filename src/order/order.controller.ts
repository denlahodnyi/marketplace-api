import {
  Body,
  Controller,
  ForbiddenException,
  Header,
  Headers,
  Param,
  Patch,
  Sse,
  type MessageEvent,
} from '@nestjs/common';
import { filter, map, skipWhile, type Observable } from 'rxjs';

import type { Order } from '../entities/order.entity.js';

import { OrderEventsService } from './order-events.service.js';
import { OrderService } from './order.service.js';

@Controller('orders')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly orderEventsService: OrderEventsService,
  ) {}

  @Patch(':orderId/actions/status-change')
  async modifyOrderStatus(
    @Headers('x-user-id') userId: string,
    @Param('orderId') orderId: string,
    @Body() body: { status: Order['status'] },
  ) {
    // this endpoint only for the demo
    const order = await this.orderService.getOrder(orderId);
    if (order?.buyerId !== userId) throw new ForbiddenException();
    const result = await this.orderService.changeStatus(orderId, body.status);
    this.orderEventsService.pushEvent({ event: 'status_change', ...result });
  }

  @Header('X-SSE', 'true') // Allows skipping transform interceptor
  @Sse(':orderId/events')
  subscribeOnOrderEvents(
    @Param('orderId') orderId: string,
    @Headers('Last-Event-ID') lastId: string,
  ): Observable<MessageEvent> {
    // TODO: add auth check
    return this.orderEventsService.events.pipe(
      filter((data) => data.orderId === orderId),
      map(
        (data) =>
          ({
            id: data.id.toString(),
            type: data.event,
            data: { status: data.status, orderId: data.orderId },
            retry: 2000,
          }) as MessageEvent,
      ),
      skipWhile((d) =>
        lastId && Number(lastId) ? Number(d.id) <= Number(lastId) : false,
      ),
    );
  }
}
