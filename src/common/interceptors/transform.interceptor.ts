import type { Response } from 'express';

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  Response<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    if (context.getType() === 'http') {
      const response: Response = context.switchToHttp().getResponse();
      const isSSE = response.getHeaders()['x-sse'] === 'true';
      return next.handle().pipe(map((data) => (isSSE ? data : { data })));
    }
    // WebSockets require { event, data } – skip wrapper
    return next.handle();
  }
}
