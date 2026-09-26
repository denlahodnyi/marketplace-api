import { addHours, setHours, subDays } from 'date-fns';
import { cartesianProduct } from 'es-toolkit';

import { dataSource } from './data-source.js';
import { Auction } from './entities/auction.entity.js';
import { Bid } from './entities/bid.entity.js';
import { Category } from './entities/category.entity.js';
import { Listing } from './entities/listing.entity.js';
import { ListingAdminReview } from './entities/listingAdminReview.entity.js';
import { Offer } from './entities/offer.entity.js';
import { OrderLine } from './entities/order-line.entity.js';
import { OrderRating } from './entities/order-rating.entity.js';
import { Order } from './entities/order.entity.js';
import { Payment } from './entities/payment.entity.js';
import { User } from './entities/user.entity.js';

const LISTINGS_COUNT = 50;
const ORDERS_COUNT = 50;

const PRICES_IN_CENTS = true;
const MINOR_UNITS_PER_MAJOR = 100; // "price in cents" mode | set 1 for "price in dollars"
const MONEY_DIVISOR = PRICES_IN_CENTS ? 1 : MINOR_UNITS_PER_MAJOR; // 100 = cents = convert to USD | 1 = USD = keep in cents
const LOW_PRICE_PERCENT = 1;
const LOW_PRICE_MIN = 1;
const LOW_PRICE_MAX = 20;
const NORMAL_PRICE_MIN = 100;
const NORMAL_PRICE_MAX = 50_000;

const ORDER_AMOUNT_MIN = 100;
const ORDER_AMOUNT_MAX = 10_000;
const LISTINGS_SKEW = 2; // orders distribution: 1 = uniform, 2 = skewed

const CATEGORIES = [
  { name: 'Електроніка' },
  { name: 'Одяг та взуття' },
  { name: 'Дім і сад' },
  { name: 'Спорт та відпочинок' },
  { name: 'Транспорт' },
  { name: 'Книги та хобі' },
  { name: 'Дитячі товари' },
  { name: 'Побутова техніка' },
  { name: 'Інструменти' },
  { name: 'Інше' },
];

const CHILD_CATEGORIES = [
  { name: 'Смартфони та аксесуари' },
  { name: 'Чоловічий та жіночий одяг' },
  { name: 'Меблі та декор' },
  { name: 'Велосипеди та спорядження' },
  { name: 'Автотовари' },
  { name: 'Книги та настільні ігри' },
  { name: 'Іграшки' },
  { name: 'Техніка для кухні' },
  { name: 'Ручний та електричний інструмент' },
  { name: 'Товари різного призначення' },
];

const USERS = {
  names: {
    Олександр: 'oleksandr',
    Андрій: 'andrii',
    Максим: 'maksym',
    Дмитро: 'dmytro',
    Іван: 'ivan',
    Микола: 'mykola',
    Богдан: 'bohdan',
    Тарас: 'taras',
    Артем: 'artem',
    Роман: 'roman',
  },
  surnames: {
    Шевченко: 'shevchenko',
    Коваленко: 'kovalenko',
    Бондаренко: 'bondarenko',
    Мельник: 'melnyk',
    Ткаченко: 'tkachenko',
    Кравченко: 'kravchenko',
    Олійник: 'oliinyk',
    Поліщук: 'polishchuk',
    Лисенко: 'lysenko',
    Савченко: 'savchenko',
  },
  admins: [
    'Адміністратор Олег',
    'Адміністратор Наталія',
    'Адміністратор Сергій',
  ],
};

const LISTING_TITLES = [
  'Смартфон у відмінному стані',
  'Ноутбук для роботи та навчання',
  'Велосипед міський',
  'Кавоварка для дому',
  'Куртка демісезонна',
  'Набір ручного інструменту',
  'Настільна гра для компанії',
  'Офісне крісло',
  'Навушники бездротові',
  'Товар для дому',
];

await dataSource.initialize();
await dataSource.dropDatabase();
if (await dataSource.showMigrations()) {
  await dataSource.runMigrations();
} else if (!dataSource.migrations.length) {
  await dataSource.synchronize();
}

function coercePrice(price: number) {
  return (PRICES_IN_CENTS
    ? Math.floor(price)
    : price.toFixed(2)) as unknown as number;
}

await dataSource.manager.transaction(async (em) => {
  const categoryRepo = em.getRepository(Category);
  const categories: Category[] = await categoryRepo.save(CATEGORIES);
  const childCategories = categories.map((cat, i) => ({
    name: CHILD_CATEGORIES[i].name,
    parentCategory: cat,
  }));
  const readyCategories = await categoryRepo.save(childCategories);

  const users: User[] = cartesianProduct(
    Object.keys(USERS.names),
    Object.keys(USERS.surnames),
  ).map(([name, surname], i) => {
    const user = new User();
    user.userRole = 'customer';
    user.name = `${name} ${surname}`;
    user.email =
      USERS.names[name as keyof (typeof USERS)['names']] +
      (i % 3 === 0
        ? '_'
        : i % 3 === 1
          ? '-'
          : (i % Object.keys(USERS.names).length) + 1) +
      USERS.surnames[surname as keyof (typeof USERS)['surnames']] +
      '@example.com';
    return user;
  });
  USERS.admins.forEach((name, i) => {
    const admin = new User();
    admin.name = name;
    admin.userRole = 'admin';
    admin.email = `admin_${i + 1}@example.com`;
    users.push(admin);
  });
  const readyUsers = await em.getRepository(User).save(users);
  const customers = readyUsers.filter((u) => u.userRole === 'customer');
  const admins = readyUsers.filter((u) => u.userRole === 'admin');
  const prepListings: Listing[] = [];

  for (let i = 0; i < LISTINGS_COUNT; i++) {
    const category = readyCategories[i % readyCategories.length];
    const seller = customers[i % customers.length];
    const price =
      Math.random() * 100 < LOW_PRICE_PERCENT
        ? (LOW_PRICE_MIN + Math.random() * (LOW_PRICE_MAX - LOW_PRICE_MIN)) /
          MONEY_DIVISOR
        : (NORMAL_PRICE_MIN +
            Math.random() * (NORMAL_PRICE_MAX - NORMAL_PRICE_MIN)) /
          MONEY_DIVISOR;
    const sellingMethod: Listing['sellingMethod'] =
      Math.random() < 0.7
        ? 'fixed_price'
        : Math.random() < 0.8
          ? 'best_offer'
          : 'auction';
    const title = LISTING_TITLES[i % LISTING_TITLES.length] + ` #${i + 1}`;
    const listing = new Listing();
    listing.category = category;
    listing.title = title;
    listing.user = seller;
    listing.sellingMethod = sellingMethod;
    listing.currency = 'UAH';
    listing.price = coercePrice(price);
    listing.itemCondition = Math.random() < 0.55 ? 'used' : 'new';
    listing.description =
      'Якісний товар. Детальний опис буде доступний покупцю перед оформленням замовлення.';
    listing.quantity = 1 + Math.floor(Math.random() * 5);
    listing.status = 'active';
    prepListings.push(listing);
  }

  const readyListings = await em.getRepository(Listing).save(prepListings);

  const reviews = readyListings.map((l, i) => {
    const review = new ListingAdminReview();
    review.status = 'accept';
    review.listing = l;
    review.admin = admins[i % admins.length];
    review.reviewedAt = new Date(l.createdAt).toISOString();
    return review;
  });

  await em.getRepository(ListingAdminReview).save(reviews);

  const [auctionListings] = await em
    .getRepository(Listing)
    .findAndCount({ where: { sellingMethod: 'auction' } });
  const preparedAuctions = auctionListings.map((l, i) => {
    const auction = new Auction();
    auction.listing = l;
    auction.status = 'finished';
    auction.startPrice = coercePrice(Math.max(1, +l.price * 0.7));
    auction.reservePrice = coercePrice(+l.price * 0.8);
    auction.startAt = setHours(subDays(Date.now(), 30), i % 20).toISOString();
    auction.endAt = setHours(subDays(Date.now(), 29), i % 20).toISOString();
    return auction;
  });

  const readyAuctions = await em.getRepository(Auction).save(preparedAuctions);

  const outbiddedAucs: Auction[] = [];
  const prepBids = readyAuctions
    .map((auc, i) => {
      if (i % readyAuctions.length === 0) return;
      outbiddedAucs.push(auc);
      const bid1 = new Bid();
      bid1.bidder = customers[i + (7 % customers.length)];
      bid1.auction = auc;
      bid1.status = 'outbidded';
      bid1.maxAmount = coercePrice(
        Math.round(+auc.startPrice * (1.05 + 1 * 0.1)),
      );
      bid1.createdAt = addHours(new Date(auc.startAt), 1).toISOString();

      const bid2 = new Bid();
      bid2.bidder = customers[i + (8 % customers.length)];
      bid2.auction = auc;
      bid2.status = 'active';
      bid2.maxAmount = coercePrice(
        Math.round(+auc.startPrice * (1.05 + 2 * 0.1)),
      );
      bid2.createdAt = addHours(new Date(auc.startAt), 2).toISOString();

      return [bid1, bid2];
    })
    .filter((bids) => bids !== undefined);

  const readyBids = await em.getRepository(Bid).save(prepBids.flat());

  const updAucs = outbiddedAucs.map((auc, i) => {
    const topBid = readyBids[i * 2 + 1];
    auc.currentPrice = topBid.maxAmount;
    auc.topBid = topBid;
    return em.getRepository(Auction).update(auc.aucId, auc);
  });
  await Promise.all(updAucs);

  const bestOfferListings = await em
    .getRepository(Listing)
    .find({ where: { sellingMethod: 'best_offer' } });
  const prepOffers = bestOfferListings.map((l, i) => {
    let buyer = customers[(i + 13) % customers.length];
    if (buyer.userId === l.userId) {
      buyer = customers[(i + 14) % customers.length];
    }
    const offer1 = new Offer();
    offer1.listing = l;
    offer1.offeredBy = buyer.userId;
    offer1.price = coercePrice(+l.price * 0.9);
    offer1.status = 'rejected';

    if (i % 3 === 0) {
      const offer2 = new Offer();
      offer2.listing = l;
      offer2.offeredBy = l.userId;
      offer2.price = coercePrice(+l.price * 0.95);
      offer2.status = 'rejected';

      const offer3 = new Offer();
      offer3.listing = l;
      offer3.offeredBy = buyer.userId;
      offer3.price = coercePrice(+l.price * 0.925);
      offer3.status = 'accepted';
      return [offer1, offer2, offer3];
    } else {
      return [offer1];
    }
  });

  await em.getRepository(Offer).save(prepOffers.flat());

  const prepOrders: Order[] = [];
  const prepOrderListings: Listing[] = [];

  for (let i = 0; i < ORDERS_COUNT; i++) {
    const listing =
      readyListings[
        Math.floor(
          Math.pow(Math.random(), LISTINGS_SKEW) * readyListings.length,
        )
      ];
    prepOrderListings.push(listing);
    let buyer = customers[(i * 17 + 3) % customers.length];
    if (buyer.userId === listing.user.userId) {
      buyer = customers[(i * 17 + 4) % customers.length];
    }
    // const amount = Math.max(
    //   0.01,
    //   Math.min(
    //     +listing.price,
    //     (ORDER_AMOUNT_MIN +
    //       Math.random() * (ORDER_AMOUNT_MAX - ORDER_AMOUNT_MIN)) /
    //       MONEY_DIVISOR,
    //   ),
    // );
    const status: Order['status'] =
      Math.random() < 0.9
        ? 'completed'
        : Math.random() < 0.96
          ? 'cancelled'
          : 'pending';
    const order = new Order();
    order.buyer = buyer;
    order.seller = listing.user;
    order.status = status;
    order.subTotal = listing.price;
    order.total = listing.price;
    order.currency = 'UAH';
    prepOrders.push(order);
  }

  const readyOrders = await em.getRepository(Order).save(prepOrders);

  const prepOrderLines: OrderLine[] = readyOrders.map((o, i) => {
    const ol = new OrderLine();
    ol.order = o;
    ol.listing = prepOrderListings[i];
    ol.unitPrice = prepOrderListings[i].price;
    ol.finalUnitPrice = prepOrderListings[i].price;
    ol.discountAmount = 0;
    ol.currency = 'UAH';
    ol.quantity = 1;
    ol.listingTitle = prepOrderListings[i].title;
    return ol;
  });

  await em.getRepository(OrderLine).save(prepOrderLines);

  const prepPayments: Payment[] = readyOrders.map((o, i) => {
    const payment = new Payment();
    payment.order = o;
    payment.paymentMethod = 'credit_card';
    payment.paymentStatus = o.status === 'completed' ? 'paid' : 'pending';
    payment.cardLast4 = (1000 + (i % 9000)).toString().padStart(4, '0');
    payment.amount = o.total;
    payment.currency = 'UAH';
    payment.payedAt =
      o.status === 'completed'
        ? addHours(
            new Date(prepOrderListings[i].createdAt),
            (i + 1) % 48,
          ).toISOString()
        : null;
    return payment;
  });

  await em.getRepository(Payment).save(prepPayments);

  const completedOrders = await em
    .getRepository(Order)
    .find({ where: { status: 'completed' } });
  const prepRatings = completedOrders
    .map((o, i) => {
      const idx = i % 5;
      if (idx === 0) return;
      const rating = new OrderRating();
      rating.orderId = o.orderId;
      rating.buyerId = o.buyerId;
      rating.rating = 3 + (i % 3);
      rating.review =
        idx === 0
          ? 'Все добре.'
          : idx === 1
            ? 'Товар відповідає опису.'
            : idx === 2
              ? 'Швидка доставка.'
              : idx === 3
                ? 'Задоволений покупкою.'
                : 'Гарний продавець.';
      return rating;
    })
    .filter((r) => r !== undefined);

  await em.getRepository(OrderRating).save(prepRatings);
});

await dataSource.destroy();

console.log('Seeded successfully');
