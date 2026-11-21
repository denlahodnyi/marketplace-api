import { Transport, type RmqOptions } from '@nestjs/microservices';

const EXCHANGES = {
  common: 'marketplace.events',
  ae: 'marketplace.ae', // from policies
  dlx: 'marketplace.dlx', // from policies
} as const;

export const RMQ_TOKENS = {
  ordersNotifications: 'ORDERS_NOTIFICATIONS',
} as const;

export const RMQ_EVENTS = {
  orderCreated: 'order.created',
} as const;

export type OrderCreatedMessage = {
  orderId: string;
  placedAt: string;
};

const PREFETCH = 100;

// Policies are defined in infra/rabbitmq/init.sh
export function getRabbitMqConfig(config: {
  connectionUrl: string;
}): Record<
  'ae' | 'dlq' | 'ordersNotifications',
  { shared: RmqOptions; producer: RmqOptions; consumer: RmqOptions }
> {
  return {
    ae: {
      shared: {
        transport: Transport.RMQ,
        options: {
          urls: [config.connectionUrl],
          queue: 'marketplace.unrouted',
          queueOptions: {
            durable: true,
            arguments: {
              'x-queue-type': 'quorum',
            },
          },
          exchange: EXCHANGES.ae,
          exchangeType: 'fanout',
          noAck: true,
          persistent: true,
        },
      },
      get consumer() {
        return this.shared;
      },
      get producer() {
        return this.shared;
      },
    },
    dlq: {
      shared: {
        transport: Transport.RMQ,
        options: {
          urls: [config.connectionUrl],
          queue: 'marketplace.dlq',
          queueOptions: {
            durable: true,
            arguments: {
              'x-queue-type': 'quorum',
            },
          },
          exchange: EXCHANGES.dlx,
          exchangeType: 'fanout',
          noAck: false,
          persistent: true,
        },
      },
      get consumer() {
        return this.shared;
      },
      get producer() {
        return this.shared;
      },
    },
    ordersNotifications: {
      shared: {
        transport: Transport.RMQ,
        options: {
          urls: [config.connectionUrl],
          queue: 'marketplace.orders.notifications',
          queueOptions: {
            durable: true,
            arguments: {
              'x-queue-type': 'quorum',
            },
          },
          exchange: EXCHANGES.common,
          exchangeType: 'direct',
          wildcards: true, // Enable to create bindings for direct exchange
          noAck: false,
          prefetchCount:
            Number(process.env.ORDER_NOTIFICATIONS_QUEUE_PREFETCH) || PREFETCH,
          isGlobalPrefetchCount: false,
          persistent: true,
        },
      },
      get consumer() {
        return this.shared;
      },
      get producer() {
        return {
          ...this.shared,
          options: {
            ...this.shared.options,
            // noAck must be true for producer, otherwise 406 error
            noAck: true,
          },
        };
      },
    },
  };
}
