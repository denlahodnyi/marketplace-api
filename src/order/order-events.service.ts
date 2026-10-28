import { Injectable } from '@nestjs/common';
import { ReplaySubject } from 'rxjs';

const BUFFER_SIZE = 100;

type Event = {
  event: 'status_change';
  id: number;
  orderId: string;
  status: string;
};

@Injectable()
export class OrderEventsService {
  private _counter = 1;
  public events = new ReplaySubject<Event>(BUFFER_SIZE);
  get counter() {
    return this._counter;
  }
  private incCounter() {
    return ++this._counter;
  }
  pushEvent(e: Omit<Event, 'id'>) {
    this.events.next({ ...e, id: this.incCounter() });
  }
}
