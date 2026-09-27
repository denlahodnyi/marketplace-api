import { Pool } from 'pg';
import '@dotenvx/dotenvx/config';

import checkout from './checkout.js';

const pool = new Pool({ connectionString: process.env.DB_URL });

const INIT_STOCK = 10;
const WORKERS = 50;

const listing = await pool.query(
  `
  WITH listing AS (SELECT listing_id FROM listings LIMIT 1)
  UPDATE listings SET quantity = $1
  WHERE listing_id = (SELECT listing_id FROM listing)
  RETURNING *;
  `,
  [INIT_STOCK],
);
console.log('Selected listing_id', listing.rows[0].listing_id);

const users = await pool.query(
  `SELECT user_id FROM users WHERE user_role = $1 LIMIT $2;`,
  ['customer', WORKERS],
);

const promises = users.rows.map(async (u) => {
  try {
    const client = await pool.connect();
    await checkout(client, listing.rows[0].listing_id, u.user_id);
    return { success: true };
  } catch {
    // console.error(e); // code '23514'
    return { success: false };
  }
});
const results = await Promise.all(promises);

const listingFinal = await pool.query(
  'SELECT * FROM listings WHERE listing_id = $1',
  [listing.rows[0].listing_id],
);
console.log(`Total tries: ${results.length}`);
console.log(
  `Total successful tries: ${results.filter((o) => o.success).length}`,
);
console.log(`Final quantity: ${listingFinal.rows[0].quantity}`);
console.log(
  `Rows with negative quantity: ${listingFinal.rows[0].quantity < 0 ? 1 : 0}`,
);
await pool.end();
