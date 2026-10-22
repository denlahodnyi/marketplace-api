import { Injectable } from '@nestjs/common';
import { ReplaySubject } from 'rxjs';

const BUFFER_SIZE = 100;

type Event = {
  event: 'status_change';
  orderId: string;
  status: string;
};

@Injectable()
export class OrderEventsService {
  events = new ReplaySubject<Event>(BUFFER_SIZE);
}
