import { BadRequestException } from '@nestjs/common';

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
