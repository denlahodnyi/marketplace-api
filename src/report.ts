import { DataSource } from 'typeorm';

import { dataSourceOptions } from './data-source.js';

import '@dotenvx/dotenvx/config';

import { Listing } from './entities/listing.entity.js';
import { OrderLine } from './entities/order-line.entity.js';
import { Order } from './entities/order.entity.js';

const dataSource = new DataSource({
  ...dataSourceOptions,
  url: process.env.DB_URL!,
});

await dataSource.initialize();

// Top 5 listings by competed orders
const result = await dataSource
  .createQueryBuilder()
  .select([
    'li.listing_id AS listing_id',
    'li.title AS title',
    'count(li.listing_id) AS orders_amount',
  ])
  .from(Order, 'o')
  .innerJoin(OrderLine, 'ol', 'ol.order_id = o.order_id')
  .innerJoin(Listing, 'li', 'li.listing_id = ol.listing_id')
  .groupBy('li.listing_id')
  .orderBy('orders_amount', 'DESC')
  .limit(5)
  .getRawMany();
console.log(`🚀 -> result:`, result);

await dataSource.destroy();
