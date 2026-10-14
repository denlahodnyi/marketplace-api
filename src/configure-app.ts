import type { ValidationError } from 'class-validator';

import { ValidationPipe, type INestApplication } from '@nestjs/common';

import { ValidationException } from './common/exceptions.js';
import { ProblemFilter } from './common/filters/problem.filter.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';

export default function configureApp(app: INestApplication) {
  app.enableShutdownHooks();
  app.useGlobalFilters(new ProblemFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, exceptionFactory }));
  return app;
}

function exceptionFactory(errors: ValidationError[]) {
  return new ValidationException({
    detail: "Request didn't pass validation",
    errors: errors.map((e) => ({
      field: e.property,
      messages: Object.values(e.constraints ?? {}),
    })),
  });
}
