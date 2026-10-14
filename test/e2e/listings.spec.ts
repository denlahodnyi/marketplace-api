import type { DataSource } from 'typeorm';

import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {} from '@nestjs/typeorm';
import request from 'supertest';

import type { SamplePg } from '../testKit/startPg.js';

import { AppModule } from '../../src/app.module.js';
import configureApp from '../../src/configure-app.js';
import { Category } from '../../src/entities/category.entity.js';
import { Listing } from '../../src/entities/listing.entity.js';
import { User } from '../../src/entities/user.entity.js';
import { aCategory, aListing, aUser } from '../testKit/builders.js';
import startPg from '../testKit/startPg.js';

describe('Listings', () => {
  let app: INestApplication;
  let pg: SamplePg;
  let ds: DataSource;

  beforeAll(async () => {
    pg = await startPg();
    ds = pg.dataSource;
    process.env.TEST_DB_URL = pg.connectionUri;
  });

  afterAll(async () => {
    await pg.stop();
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await configureApp(app).init();
  });

  afterEach(async () => {
    await ds.getRepository(Category).clear({ cascade: true });
    await ds.getRepository(Listing).clear({ cascade: true });
    await ds.getRepository(User).clear({ cascade: true });
    await app.close();
  });

  describe('/listings (POST)', () => {
    it('returns 201 | /listings/:id (GET) returns 200 and created listing', async () => {
      const userRepo = ds.getRepository(User);
      const categoryRepo = ds.getRepository(Category);
      const user = await aUser().insertVia(userRepo, { transaction: true });
      const category = await aCategory().insertVia(categoryRepo, {
        transaction: true,
      });
      const listing = aListing().withUser(user).withCategory(category).build();
      const created = await request(app.getHttpServer())
        .post('/listings')
        .send(listing)
        .expect(201);
      expect(created.body.data.listingId).toEqual(expect.any(String));
      expect(created.body.data.status).toBe('on_review');
      const fetched = await request(app.getHttpServer())
        .get(`/listings/${created.body.data.listingId}`)
        .expect(200);
      expect(fetched.body.data).toEqual(created.body.data);
    });

    it('returns 400 when quantity < 1', async () => {
      const userRepo = ds.getRepository(User);
      const categoryRepo = ds.getRepository(Category);
      const user = await aUser().insertVia(userRepo, { transaction: true });
      const category = await aCategory().insertVia(categoryRepo, {
        transaction: true,
      });
      const listing = aListing()
        .withUser(user)
        .withCategory(category)
        .withQty(0)
        .build();
      const created = await request(app.getHttpServer())
        .post('/listings')
        .send(listing)
        .expect(400);
      expect(created.body).toEqual({
        title: 'Validation Exception',
        detail: expect.any(String),
        type: expect.any(String),
        instance: '/listings',
        status: 400,
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'quantity',
            messages: expect.arrayContaining([expect.any(String)]),
          }),
        ]),
      });
    });
  });
});
