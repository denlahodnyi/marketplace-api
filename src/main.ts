import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import type { Env } from './config/index.js';

import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  const config = app.get(ConfigService<Env, true>);
  const port = config.get('PORT', { infer: true });
  await app.listen(port, async () => {
    console.log(`App is listening at ${await app.getUrl()}`);
  });
}
await bootstrap();
