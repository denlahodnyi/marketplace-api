import '@dotenvx/dotenvx/config';
import { setTimeout } from 'node:timers/promises';
import { Pool, type PoolClient, type DatabaseError } from 'pg';

const pool = new Pool({ connectionString: process.env.DB_URL });

// Prepare test listing + auction
const auction = await pool.query(`
    WITH listing AS (
      INSERT INTO listings (user_id, category_id, title, item_condition, selling_method, description, price, currency, quantity, status)
      VALUES (
        (SELECT user_id FROM users LIMIT 1),
        (SELECT category_id FROM categories LIMIT 1),
        'Test auc listing',
        'new',
        'auction',
        'Lorem ipsum',
        10000,
        'UAH',
        1,
        'active'
      )
      RETURNING *
    )
    INSERT INTO auctions (listing_id, status, start_price, start_at, end_at)
    VALUES (
      (SELECT listing_id FROM listing),
      'active',
      (SELECT price FROM listing),
      now(),
      now() + '1 day'::interval
    )
    RETURNING *;
  `);
// Prepare 2 buyers
const buyers = await pool.query(
  "SELECT * FROM users WHERE user_role = 'customer' LIMIT 2 OFFSET 10",
);

// Make 2 concurrent bids
await Promise.all([
  withRetry(async () =>
    makeBid(
      await pool.connect(),
      buyers.rows[0].user_id,
      auction.rows[0].auc_id,
      150_00,
      75,
    ),
  ),
  withRetry(async () =>
    makeBid(
      await pool.connect(),
      buyers.rows[1].user_id,
      auction.rows[0].auc_id,
      200_00,
      50,
    ),
  ),
]);

const finalResult = await pool.query(
  `
    SELECT l.listing_id, a.auc_id, a.current_bid, a.current_price, b.bid_id, b.max_amount, b.status
    FROM auctions a
    JOIN listings l ON a.listing_id = l.listing_id
    LEFT JOIN bids b ON b.auction_id = a.auc_id
    WHERE a.auc_id = $1;
  `,
  [auction.rows[0].auc_id],
);
console.log('Result: ', finalResult.rows);

// Cleanup
await pool.query(
  `UPDATE listings SET deleted_at = now() WHERE listing_id = $1;`,
  [auction.rows[0].listing_id],
);
await pool.end();

async function makeBid(
  client: PoolClient,
  buyerId: string,
  aucId: string,
  bid: number,
  workDelay: number = 0,
) {
  try {
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ;');
    const auc = await client.query(
      `
      SELECT a.current_bid, a.current_price FROM auctions a
      LEFT JOIN bids b ON b.bid_id = a.current_bid
      WHERE a.auc_id = $1;
      `,
      [aucId],
    );
    await setTimeout(workDelay);
    const auction = auc.rows[0];
    if (auction.current_price < bid) {
      if (auction.current_bid) {
        await client.query(
          `
          UPDATE bids SET status = 'outbidded' WHERE bid_id = $1;
        `,
          [auction.current_bid],
        );
      }
    }
    const newBid = await client.query(
      `
      INSERT INTO bids (auction_id, bidder_id, status, max_amount)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `,
      [
        aucId,
        buyerId,
        auction.current_price < bid ? 'active' : 'outbidded',
        bid,
      ],
    );
    if (newBid.rows[0].status === 'active') {
      await client.query(
        `
          UPDATE auctions
          SET (current_bid, current_price) = ($1, $2)
          WHERE auc_id = $3;
        `,
        [newBid.rows[0].bid_id, newBid.rows[0].max_amount, aucId],
      );
    }
    await client.query('COMMIT;');
  } catch (error) {
    await client.query('ROLLBACK;');
    throw error;
  } finally {
    client.release();
  }
}

async function withRetry<T>(fn: () => T, maxAttempts = 3) {
  for (let i = 1; i <= maxAttempts; i++) {
    try {
      return await fn();
    } catch (error) {
      const { code, message } = error as DatabaseError;
      console.error(`Error ${code}: `, message);
      if (code && ['40001', '40P01'].includes(code)) {
        if (i <= maxAttempts) {
          const backoff = Math.round(2 ** i * 25 + Math.random() * 25);
          console.log(`Retry #: ${i}`);
          console.log('Backoff: ', backoff);
          await setTimeout(backoff);
          continue;
        } else {
          throw error;
        }
      }
      throw error;
    }
  }
}
