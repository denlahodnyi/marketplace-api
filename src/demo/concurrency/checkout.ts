import type { PoolClient } from 'pg';

export default async function checkout(
  client: PoolClient,
  listingId: string,
  buyerId: string,
) {
  const orderedQty = 1;
  try {
    await client.query('BEGIN;');
    const listingResult = await client.query(
      'SELECT * FROM listings WHERE listing_id = $1 AND quantity >= $2 FOR UPDATE;',
      [listingId, orderedQty],
    );
    if (!listingResult.rowCount) throw new Error('Out of stock');
    const listing = listingResult.rows[0];
    const orderResult = await client.query(
      `
        INSERT INTO orders (buyer_id, seller_id, status, sub_total, total, currency)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `,
      [
        buyerId,
        listing.user_id,
        'confirmed',
        listing.price,
        listing.price,
        listing.currency,
      ],
    );
    const order = orderResult.rows[0];
    await client.query(
      `
        INSERT INTO order_lines (order_id, listing_id, unit_price, final_unit_price, currency, quantity, listing_title)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        order.order_id,
        listingId,
        listing.price,
        listing.price,
        listing.currency,
        orderedQty,
        listing.title,
      ],
    );
    await client.query(`INSERT INTO orders_notifications VALUES ($1, FALSE)`, [
      order.order_id,
    ]);
    await client.query(
      `
      INSERT INTO payments (order_id, payment_method, payment_status, amount, currency)
      VALUES ($1, $2, $3, $4, $5)
    `,
      [
        order.order_id,
        'credit_card',
        'pending',
        listing.price,
        listing.currency,
      ],
    );
    await client.query(
      `UPDATE listings SET quantity = quantity - $1 WHERE listing_id = $2`,
      [orderedQty, listingId],
    );
    await client.query('COMMIT;');
  } catch (error) {
    await client.query('ROLLBACK;');
    throw error;
  } finally {
    client.release();
  }
}
