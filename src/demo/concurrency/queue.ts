import { setTimeout } from 'node:timers/promises';
import '@dotenvx/dotenvx/config';
import { Pool, type PoolClient } from 'pg';

const WORKERS = 4;
const TASKS = 50;
const TASK_DELAY = 50;

const pool = new Pool({ connectionString: process.env.DB_URL });

await pool.query(`
    CREATE TABLE IF NOT EXISTS orders_notifications (
      order_id text NOT NULL,
      notified bool NOT NULL DEFAULT FALSE
    );
  `);
await pool.query('TRUNCATE orders_notifications;');
await pool.query(
  `
    INSERT INTO orders_notifications (SELECT order_id FROM orders LIMIT $1)
  `,
  [TASKS],
);

const processedIds = new Map<string, number>();
const t1 = performance.now();
const result = await Promise.all(
  Array.from({ length: WORKERS }, (_: any, i: number) => `worker-${i + 1}`).map(
    async () => {
      let workerTasksCount = 0;
      for (;;) {
        const client = await pool.connect();
        const task = await processTask(client);
        if (task.success) {
          if (task.orderId) {
            const count = processedIds.get(task.orderId) ?? 0;
            processedIds.set(task.orderId, count + 1);
            workerTasksCount += 1;
          } else {
            const left = await pool.query(
              'SELECT * FROM orders_notifications WHERE notified = FALSE',
            );
            if (!left.rowCount) return workerTasksCount;
          }
        }
      }
    },
  ),
);
const t2 = performance.now();

await pool.query('DROP TABLE orders_notifications;');
await pool.end();

console.log(
  `Total time: ${Math.floor(t2 - t1)} ms (${TASK_DELAY} ms per task)`,
);
console.log(`Total workers: ${WORKERS}`);
console.log(`Tasks per workers: ${JSON.stringify(result)}`);
console.log(`Processed tasks: ${processedIds.size}`);
console.log(
  `Duplicates: ${
    processedIds
      .values()
      .filter((v) => v > 1)
      .toArray().length
  }`,
);

async function processTask(client: PoolClient) {
  try {
    await client.query('BEGIN;');
    const order = await client.query(
      'SELECT * FROM orders_notifications WHERE notified = FALSE LIMIT 1 FOR UPDATE SKIP LOCKED;',
    );
    if (!order.rowCount) return { success: true, orderId: null };
    await setTimeout(TASK_DELAY);
    await client.query(
      'UPDATE orders_notifications SET notified = TRUE WHERE order_id = $1;',
      [order.rows[0].order_id],
    );
    await client.query('COMMIT;');
    return { success: true, orderId: order.rows[0].order_id };
  } catch {
    await client.query('ROLLBACK;');
    return { success: false, orderId: null };
  } finally {
    client.release();
  }
}
