import type { Response, Request } from 'express';

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';

import { ValidationException } from '../exceptions.js';

@Catch()
export class ProblemFilter<T> implements ExceptionFilter {
  catch(exception: T, host: ArgumentsHost) {
    console.error(exception);
    const res = host.switchToHttp().getResponse<Response>();
    const req = host.switchToHttp().getRequest<Request>();
    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;
    const body =
      exception instanceof HttpException ? exception.getResponse() : null;
    const message =
      exception instanceof HttpException && exception.message !== body
        ? exception.message
        : 'Internal server error';
    let detail = typeof body === 'string' ? body : 'Something went wrong';
    let errors = null;

    if (body && exception instanceof ValidationException) {
      const validationErrorBody = body as Pick<
        ValidationException,
        'errors' | 'detail'
      >;
      if (validationErrorBody.detail) detail = validationErrorBody.detail;
      errors = validationErrorBody.errors;
    }

    res.status(status).type('application/problem+json').json({
      type: `auto:blank`,
      title: message,
      status,
      detail,
      instance: req.originalUrl,
      errors,
    });
  }
}
