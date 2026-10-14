import type { INestApplication } from '@nestjs/common';
import type { DataSource } from 'typeorm';

import { Test, type TestingModule } from '@nestjs/testing';
import { Verifier } from '@pact-foundation/pact';
import path from 'node:path';

import { AppModule } from '../../../src/app.module.js';
import configureApp from '../../../src/configure-app.js';
import { aCategory, aListing, aUser } from '../../testKit/builders.js';
import {
  TEST_CATEGORY_ID,
  TEST_CUSTOMER_ID,
  TEST_LISTING_ID,
} from '../../testKit/fixtures.js';
import startPg, { type SamplePg } from '../../testKit/startPg.js';

const APP_PORT = 20200;

let withBrokerOpts: ConstructorParameters<typeof Verifier>[number];

if (process.env.PACT_BROKER_URL) {
  // https://docs.pact.io/consumer/recommended_configuration
  withBrokerOpts = {
    pactBrokerUrl: process.env.PACT_BROKER_URL,
    publishVerificationResult: true, // recommended to only publish from CI by setting the value to `process.env.CI === 'true'`
    providerVersion: process.env.PROVIDER_VERSION ?? '1.0.0', // recommended to be the git sha eg. process.env.MY_CI_COMMIT
    providerVersionBranch: 'main', // recommended to be the git branch eg. process.env.GIT_BRANCH
    consumerVersionSelectors: [{ latest: true }], // ask broker to find the latest pact
    // consumerVersionTags: ['master', 'test', 'prod'],
    // providerVersionTags: ['tag'], // optional, recommended to be the git branch eg. process.env.GIT_BRANCH ? [process.env.GIT_BRANCH] : []
  };
}

describe('Pact verification', () => {
  let app: INestApplication;
  let pg: SamplePg;
  let ds: DataSource;

  beforeAll(async () => {
    pg = await startPg();
    ds = pg.dataSource;
    process.env.TEST_DB_URL = pg.connectionUri;
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await configureApp(app).init();
    await app.listen(APP_PORT);
  });

  afterAll(async () => {
    await app.close();
    await pg.stop();
  });

  it('Should verify consumer expectations', async () => {
    const result = await new Verifier({
      ...(withBrokerOpts
        ? withBrokerOpts
        : {
            pactUrls: [
              path.resolve(process.cwd(), 'pacts', 'web-marketplace-api.json'),
            ],
          }),
      providerBaseUrl: await app.getUrl(),
      provider: 'marketplace-api',
      logLevel: 'warn',
      afterEach: async () => {
        await ds.getRepository('Category').clear({ cascade: true });
        await ds.getRepository('Listing').clear({ cascade: true });
        await ds.getRepository('User').clear({ cascade: true });
      },
      stateHandlers: {
        'Has a listing with ID': async () => {
          const user = await aUser()
            .withId(TEST_CUSTOMER_ID)
            .insertVia(ds.getRepository('User'), {
              transaction: true,
            });
          const category = await aCategory()
            .withId(TEST_CATEGORY_ID)
            .insertVia(ds.getRepository('Category'), { transaction: true });
          await aListing()
            .withUser(user)
            .withCategory(category)
            .withId(TEST_LISTING_ID)
            .insertVia(ds.getRepository('Listing'), { transaction: true });
          return Promise.resolve({
            description: `Listing with ID ${TEST_LISTING_ID} added to the db`,
            id: TEST_LISTING_ID,
          });
        },
      },
    }).verifyProvider();

    console.log(result);
  });
});
