import type { RmqOptions } from '@nestjs/microservices';

import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { RedisStore } from 'connect-redis';
import session from 'express-session';

import type { UserInRequest } from './common/app.js';
import type { Env } from './config/index.js';

import { AppModule } from './app.module.js';
import configureApp from './configure-app.js';
import { getRabbitMqConfig } from './rabbitmq-setup.js';
import { REDIS_JOBS_CLIENT } from './redis/redis.module.js';

declare module 'express' {
  export interface Request {
    user: UserInRequest;
  }
}

const SESSION_TTL = 60 * 15; // 15m

async function bootstrap() {
  const app = configureApp(await NestFactory.create(AppModule));
  const config = app.get(ConfigService<Env, true>);
  const port = config.get('PORT', { infer: true });
  const brokerUrl = config.get('RABBITMQ_URL', { infer: true });
  const rmqOptions = getRabbitMqConfig({ connectionUrl: brokerUrl });

  const redisStore = new RedisStore({
    client: app.get(REDIS_JOBS_CLIENT),
    prefix: 'sess:',
    ttl: SESSION_TTL, // in sec
  });
  app.use(
    session({
      secret: 'my-secret', // TODO:
      resave: false,
      saveUninitialized: false,
      store: redisStore,
      cookie: {
        maxAge: SESSION_TTL * 1000, // in ms
      },
    }),
  );

  app.connectMicroservice<RmqOptions>(rmqOptions.ae.consumer);
  app.connectMicroservice<RmqOptions>(rmqOptions.dlq.consumer);
  app.connectMicroservice<RmqOptions>(rmqOptions.ordersNotifications.consumer);

  await app.startAllMicroservices();
  await app.listen(port, async () => {
    console.log(`App is listening at ${await app.getUrl()}`);
  });
}
await bootstrap();
