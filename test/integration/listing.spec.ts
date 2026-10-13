import type { DataSource, QueryRunner } from 'typeorm';

import { Category } from '../../src/entities/category.entity.js';
import { Listing } from '../../src/entities/listing.entity.js';
import { User } from '../../src/entities/user.entity.js';
import { aCategory, aListing, aUser } from '../testKit/builders.js';
import startPg, { type SamplePg } from '../testKit/startPg.js';

describe('Listing repo', () => {
  let pg: SamplePg;
  let ds: DataSource;
  let qr: QueryRunner;

  beforeAll(async () => {
    pg = await startPg();
    ds = pg.dataSource;
  });

  afterAll(async () => {
    await pg.stop();
  });

  beforeEach(async () => {
    qr = ds.createQueryRunner();
    await qr.startTransaction();
  });

  afterEach(async () => {
    await qr.rollbackTransaction();
    await qr.release();
  });

  it('WHEN someone creates new listing with unknown item_condition, THEN repo throws an error', async () => {
    const listingRepo = qr.manager.getRepository(Listing);
    const userRepo = qr.manager.getRepository(User);
    const catRepo = qr.manager.getRepository(Category);
    const category = await aCategory().insertVia(catRepo);
    const user = await aUser().insertVia(userRepo);
    const listing = aListing()
      .withUser(user)
      .withCategory(category)
      .withCondition('_unknown_' as Listing['itemCondition'])
      .build();
    await expect(listingRepo.save(listing)).rejects.toThrow(
      'violates check constraint',
    );
  });

  it('WHEN someone creates new listing with unknown selling_method, THEN repo throws an error', async () => {
    const listingRepo = qr.manager.getRepository(Listing);
    const userRepo = qr.manager.getRepository(User);
    const catRepo = qr.manager.getRepository(Category);
    const category = await aCategory().insertVia(catRepo);
    const user = await aUser().insertVia(userRepo);
    const listing = aListing()
      .withUser(user)
      .withCategory(category)
      .withSellingMethod('_unknown_' as Listing['sellingMethod'])
      .build();
    await expect(listingRepo.save(listing)).rejects.toThrow(
      'violates check constraint',
    );
  });

  it('WHEN someone creates new listing with unknown status, THEN repo throws an error', async () => {
    const listingRepo = qr.manager.getRepository(Listing);
    const userRepo = qr.manager.getRepository(User);
    const catRepo = qr.manager.getRepository(Category);
    const category = await aCategory().insertVia(catRepo);
    const user = await aUser().insertVia(userRepo);
    const listing = aListing()
      .withUser(user)
      .withCategory(category)
      .withStatus('_unknown_' as Listing['status'])
      .build();
    await expect(listingRepo.save(listing)).rejects.toThrow(
      'violates check constraint',
    );
  });

  it('WHEN someone creates new listing with price < 0, THEN repo throws an error', async () => {
    const listingRepo = qr.manager.getRepository(Listing);
    const userRepo = qr.manager.getRepository(User);
    const catRepo = qr.manager.getRepository(Category);
    const category = await aCategory().insertVia(catRepo);
    const user = await aUser().insertVia(userRepo);
    const listing = aListing()
      .withUser(user)
      .withCategory(category)
      .withPrice(-1)
      .build();
    await expect(listingRepo.save(listing)).rejects.toThrow(
      'violates check constraint',
    );
  });

  it('WHEN someone creates new listing with ISO-incompatible currency, THEN repo throws an error', async () => {
    const listingRepo = qr.manager.getRepository(Listing);
    const userRepo = qr.manager.getRepository(User);
    const catRepo = qr.manager.getRepository(Category);
    const category = await aCategory().insertVia(catRepo);
    const user = await aUser().insertVia(userRepo);
    const listing = aListing()
      .withUser(user)
      .withCategory(category)
      .withCurrency('GOLD')
      .build();
    await expect(listingRepo.save(listing)).rejects.toThrow(
      'violates check constraint',
    );
  });

  it('WHEN someone creates new listing with quantity < 0, THEN repo throws an error', async () => {
    const listingRepo = qr.manager.getRepository(Listing);
    const userRepo = qr.manager.getRepository(User);
    const catRepo = qr.manager.getRepository(Category);
    const category = await aCategory().insertVia(catRepo);
    const user = await aUser().insertVia(userRepo);
    const listing = aListing()
      .withUser(user)
      .withCategory(category)
      .withQty(-1)
      .build();
    await expect(listingRepo.save(listing)).rejects.toThrow(
      'violates check constraint',
    );
  });
});
