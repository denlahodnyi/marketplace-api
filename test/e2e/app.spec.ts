import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import type { SamplePg } from '../testKit/startPg.js';

import { AppModule } from '../../src/app.module.js';
import startPg from '../testKit/startPg.js';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let pg: SamplePg;

  beforeAll(async () => {
    pg = await startPg();
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
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  afterEach(async () => {
    await app.close();
  });
});
