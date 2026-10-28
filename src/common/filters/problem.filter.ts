import type { Response, Request } from 'express';

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';

import { CheckoutException, ValidationException } from '../exceptions.js';

type CheckoutProblem =
  | {
      code: 'UNAVAILABLE_LISTING';
      listingId: string;
    }
  | {
      code: 'INVALID_AMOUNT';
      listingId: string;
      message: string;
      availableQty: number | null;
    };

export interface ProblemJson {
  title: string;
  detail: string;
  status: number;
  type: string;
  instance: string;
  errors:
    | null
    | {
        field: string;
        messages: string[];
      }[];
  checkoutErrors?: CheckoutProblem[];
}

interface ErrorRespBody {
  message: string;
  error: string;
  statusCode: number;
}

function isGetResponseBodyObj(resp: object | string): resp is ErrorRespBody {
  return typeof resp === 'object';
}

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
    let title = typeof body === 'string' ? body : 'Internal server error';
    let detail = 'Something went wrong';
    if (body && isGetResponseBodyObj(body)) {
      title = body.message;
      detail = body.error;
    }
    let errors = null;
    let checkoutErrors;

    if (body && exception instanceof ValidationException) {
      const validationErrorBody = body as Pick<
        ValidationException,
        'errors' | 'detail'
      >;
      if (validationErrorBody.detail) detail = validationErrorBody.detail;
      errors = validationErrorBody.errors;
    }

    if (exception instanceof CheckoutException) {
      checkoutErrors = exception.checkoutErrors;
    }

    res
      .status(status)
      .type('application/problem+json')
      .json({
        type: `auto:blank`,
        title,
        status,
        detail,
        instance: req.originalUrl,
        errors,
        checkoutErrors,
      } satisfies ProblemJson);
  }
}
