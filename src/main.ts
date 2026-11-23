import type { RmqOptions } from '@nestjs/microservices';

import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import type { Env } from './config/index.js';

import { AppModule } from './app.module.js';
import configureApp from './configure-app.js';
import { getRabbitMqConfig } from './rabbitmq-setup.js';

async function bootstrap() {
  const app = configureApp(await NestFactory.create(AppModule));
  const config = app.get(ConfigService<Env, true>);
  const port = config.get('PORT', { infer: true });
  const brokerUrl = config.get('RABBITMQ_URL', { infer: true });
  const rmqOptions = getRabbitMqConfig({ connectionUrl: brokerUrl });

  app.connectMicroservice<RmqOptions>(rmqOptions.ae.consumer);
  app.connectMicroservice<RmqOptions>(rmqOptions.dlq.consumer);
  app.connectMicroservice<RmqOptions>(rmqOptions.ordersNotifications.consumer);

  await app.startAllMicroservices();
  await app.listen(port, async () => {
    console.log(`App is listening at ${await app.getUrl()}`);
  });
}
await bootstrap();
