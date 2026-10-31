import {
  AbstractLogger,
  DataSource,
  type LogLevel,
  type LogMessage,
  type SelectQueryBuilder,
} from 'typeorm';

import { dataSourceOptions } from './data-source.js';

import '@dotenvx/dotenvx/config';

import { Listing } from './entities/listing.entity.js';
import { User } from './entities/user.entity.js';

class QueryCountLogger extends AbstractLogger {
  count = 0;
  echo = false;

  reset() {
    this.count = 0;
  }

  protected writeLog(level: LogLevel, messages: LogMessage | LogMessage[]) {
    for (const m of Array.isArray(messages) ? messages : [messages]) {
      if (m.type === 'query') {
        this.count += 1;
        if (this.echo) {
          console.log(
            `  SQL#${this.count}: ${String(m.message).slice(0, 110)}`,
          );
        }
      }
    }
  }
}

const logger = new QueryCountLogger(['query']);

const dataSource = new DataSource({
  ...dataSourceOptions,
  logger,
  url: process.env.DB_URL!,
});

await dataSource.initialize();

// Naive with N+1
logger.reset();
const customers = await dataSource.getRepository(User).find({
  where: { userRole: 'customer' },
  take: 5,
  select: { userId: true, name: true },
});
console.log(`🚀 -> customers count:`, customers.length);

for await (const customer of customers) {
  const listings = await dataSource.getRepository(Listing).find({
    where: { userId: customer.userId },
    select: { listingId: true },
  });
  console.log(`🚀 -> listings count:`, listings.length);
}
console.log(`Naive query count: ${logger.count}`);

// Fixed without N+1
logger.reset();
const customersWithListings = await dataSource
  .createQueryBuilder()
  .disableEscaping()
  .select([
    'u.user_id',
    'u.name',
    'li.listing_id AS listing_id',
    'li.title AS title',
  ])
  .from((subQuery: SelectQueryBuilder<any>) => {
    return subQuery
      .select(['u.user_id AS user_id', 'u.name AS name'])
      .from(User, 'u')
      .where('u.user_role = :userRole', {
        userRole: 'customer',
      })
      .limit(5);
  }, 'u')
  .leftJoin(Listing, 'li', 'li.user_id = u.user_id')
  .getRawMany();
console.log(`🚀 -> customers with listings:`, customersWithListings.length);
console.log(`Fixed query count: ${logger.count}`);

await dataSource.destroy();
