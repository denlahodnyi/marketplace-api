import { exec } from 'node:child_process';
import { io } from 'socket.io-client';

import { dataSource } from '../../data-source.js';
import { Order } from '../../entities/order.entity.js';
import { User } from '../../entities/user.entity.js';

const URL = 'http://localhost:3000/orders';
const SELLER_ID = '01a15f93-884a-727c-afcf-c3a373a3ab63';
const BUYER_1_ID = '01a15f93-884a-72d0-a4c8-2afa084a9dc6';
const BUYER_2_ID = '01a15f93-884a-72d6-ab8e-e3b8da66e16c';
const ORDER_1_ID = '01a15f93-884a-72df-9a39-0d0d93df5203';
const ORDER_2_ID = '01a15f93-884a-72e0-9668-85c6ec525bb3';

const IS_SAME_ROOM = (process.argv[2] ?? '').includes('--same-room');
console.log('Is the same room', IS_SAME_ROOM);

await dataSource.initialize();
// Prepare test data
await dataSource.transaction(async (tx) => {
  const userRepo = tx.getRepository(User);
  const orderRepo = tx.getRepository(Order);
  if (!(await userRepo.existsBy({ userId: SELLER_ID }))) {
    await userRepo.insert(
      userRepo.create({
        userId: SELLER_ID,
        email: 'realtime_demo_seller@example.com',
        name: 'realtime_demo_seller',
        userRole: 'customer',
      }),
    );
  }
  if (!(await userRepo.existsBy({ userId: BUYER_1_ID }))) {
    await userRepo.insert(
      userRepo.create({
        userId: BUYER_1_ID,
        email: 'realtime_demo_buyer_1@example.com',
        name: 'realtime_demo_buyer_1',
        userRole: 'customer',
      }),
    );
  }
  if (!(await userRepo.existsBy({ userId: BUYER_2_ID }))) {
    await userRepo.insert(
      userRepo.create({
        userId: BUYER_2_ID,
        email: 'realtime_demo_buyer_2@example.com',
        name: 'realtime_demo_buyer_2',
        userRole: 'customer',
      }),
    );
  }
  if (!(await orderRepo.existsBy({ orderId: ORDER_1_ID }))) {
    await orderRepo.insert(
      orderRepo.create({
        orderId: ORDER_1_ID,
        buyerId: BUYER_1_ID,
        sellerId: SELLER_ID,
        total: 200_00,
        subTotal: 200_00,
        currency: 'UAH',
        status: 'pending',
      }),
    );
  } else {
    await orderRepo.update({ orderId: ORDER_1_ID }, { status: 'pending' });
  }
  if (!(await orderRepo.existsBy({ orderId: ORDER_2_ID }))) {
    await orderRepo.insert(
      orderRepo.create({
        orderId: ORDER_2_ID,
        buyerId: BUYER_2_ID,
        sellerId: SELLER_ID,
        total: 300_00,
        subTotal: 300_00,
        currency: 'UAH',
        status: 'pending',
      }),
    );
  } else {
    await orderRepo.update({ orderId: ORDER_2_ID }, { status: 'pending' });
  }
});

class WsClient {
  socket = io(URL, { autoConnect: false });
  statusChangeCount = 0;

  constructor(
    public label: string,
    userId: string,
    roomId: string,
    onJoin: () => void,
  ) {
    this.socket.auth = { userId };
    this.socket.on('connect', () => {
      console.log(`${this.label} connected (socket: ${this.socket.id})`);
      this.socket.emit(
        'join',
        roomId,
        (resp: { join: boolean; room: string }) => {
          if (resp.join) {
            console.log(
              `${label} joined the room ${resp.room} (socket: ${this.socket.id})`,
            );
            onJoin();
          } else {
            console.log(`${label} can't join ${roomId}`);
          }
        },
      );
    });
    this.socket.on('disconnect', () => {
      console.log(`${this.label} disconnected`);
    });
    this.socket.on(
      'status_change',
      (data: { status: string; orderId: string; socketId?: string }) => {
        console.log(
          `${this.label} received changed status "${data.status}" for order ${data.orderId} (socket: ${this.socket.id} | server socket: ${data.socketId ?? ''})`,
        );
        this.statusChangeCount++;
      },
    );
  }

  connect() {
    this.socket.connect();
  }

  disconnect() {
    this.socket.disconnect();
  }
}

const clientA = new WsClient(
  'CLIENT_A',
  BUYER_1_ID,
  `order:${ORDER_1_ID}`,
  () => {
    // req
    exec(
      `curl -s localhost:3000/orders/${ORDER_1_ID}/actions/status-change \
      -X PATCH -d '{"status":"confirmed"}' \
      -H "X-User-Id: ${BUYER_1_ID}" \
      -H "Content-Type: application/json" \
      -w "%{http_code}" \
      -o /dev/null`,
      (error, stdout, stderr) => {
        if (error) {
          console.error(`curl exec error: ${error}`);
          return;
        }
        console.log(`CLIENT_A curl response: ${stdout}`);
        if (stderr) console.error(`curl error: ${stderr}`);
      },
    );
  },
);
const clientB = new WsClient(
  'CLIENT_B',
  IS_SAME_ROOM ? BUYER_1_ID : BUYER_2_ID,
  `order:${IS_SAME_ROOM ? ORDER_1_ID : ORDER_2_ID}`,
  () => {},
);
clientA.connect();
clientB.connect();

setTimeout(async () => {
  console.log(`A_RECEIVED=${clientA.statusChangeCount}`);
  console.log(`B_RECEIVED=${clientB.statusChangeCount}`);
  clientA.disconnect();
  clientB.disconnect();
  await dataSource.destroy();
  if (
    (IS_SAME_ROOM && clientA.statusChangeCount !== clientB.statusChangeCount) ||
    (!IS_SAME_ROOM && clientA.statusChangeCount === clientB.statusChangeCount)
  ) {
    process.exit(1);
  }
}, 3000);
