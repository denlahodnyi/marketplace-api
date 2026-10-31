import { snakeCase } from 'es-toolkit';
import {
  DataSource,
  DefaultNamingStrategy,
  type DataSourceOptions,
} from 'typeorm';

import { Auction } from './entities/auction.entity.js';
import { Bid } from './entities/bid.entity.js';
import { CartDetail } from './entities/cart-details.entity.js';
import { Cart } from './entities/cart.entity.js';
import { Category } from './entities/category.entity.js';
import { Chat } from './entities/chat.entity.js';
import { FavouriteListing } from './entities/favourite-listing.entity.js';
import { Listing } from './entities/listing.entity.js';
import { ListingAdminReview } from './entities/listingAdminReview.entity.js';
import { ChatMessage } from './entities/message.entity.js';
import { Offer } from './entities/offer.entity.js';
import { OrderLine } from './entities/order-line.entity.js';
import { OrderRating } from './entities/order-rating.entity.js';
import { Order } from './entities/order.entity.js';
import { Payment } from './entities/payment.entity.js';
import { User } from './entities/user.entity.js';

import '@dotenvx/dotenvx/config';

const typeOrmNamingStrategy = new DefaultNamingStrategy();
typeOrmNamingStrategy.columnName = (propertyName, customName) =>
  customName ?? snakeCase(propertyName);

const dataSourceOptions = {
  type: 'postgres',
  synchronize: false,
  dropSchema: false,
  // logging: ['error', 'query'],
  // logger: 'formatted-console',
  entities: [
    User,
    Category,
    Listing,
    ListingAdminReview,
    Auction,
    Bid,
    Offer,
    Chat,
    ChatMessage,
    Order,
    OrderLine,
    Payment,
    FavouriteListing,
    OrderRating,
    Cart,
    CartDetail,
  ],
  namingStrategy: typeOrmNamingStrategy,
} satisfies DataSourceOptions;

const dataSource = new DataSource({
  ...dataSourceOptions,
  url: process.env.DB_URL,
  migrations: [import.meta.dirname + '/migrations/**/*{.js,.ts}'],
});

export { dataSource, dataSourceOptions };
