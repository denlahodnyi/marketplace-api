import { BadRequestException, HttpException } from '@nestjs/common';

import type { ProblemJson } from './filters/problem.filter.js';

/**
 * Custom validation exception with errors
 */
export class ValidationException extends BadRequestException {
  errors: { field: string; messages: string[] }[];
  detail?: string;
  constructor(...params: ConstructorParameters<typeof BadRequestException>) {
    super(...params);
  }
}

export class CheckoutException extends HttpException {
  checkoutErrors: NonNullable<ProblemJson['checkoutErrors']>[number][];
  constructor(...params: ConstructorParameters<typeof HttpException>) {
    super(...params);
  }
}
