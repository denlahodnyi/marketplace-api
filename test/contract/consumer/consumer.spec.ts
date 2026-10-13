import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import path from 'node:path';

import { aListing } from '../../testKit/builders.js';
import {
  TEST_CATEGORY_ID,
  TEST_CUSTOMER_ID,
  TEST_LISTING_ID,
} from '../../testKit/fixtures.js';

// Create a 'pact' between the two applications in the integration we are testing
const provider = new PactV3({
  dir: path.resolve(process.cwd(), 'pacts'),
  consumer: 'web',
  provider: 'marketplace-api',
});

describe('GET /listings/:id', () => {
  it('returns an HTTP 200 and single listing', () => {
    const listing = aListing()
      .withUser(TEST_CUSTOMER_ID)
      .withCategory(TEST_CATEGORY_ID)
      .withId(TEST_LISTING_ID)
      .build();
    const EXPECTED_BODY = MatchersV3.like({
      data: { ...listing },
    });
    // Arrange: Setup our expected interactions
    //
    // We use Pact to mock out the backend API
    provider
      .given('Has a listing with ID')
      .uponReceiving('A request for a listing with specific ID')
      .withRequest({
        method: 'GET',
        path: `/listings/${listing.listingId}`,
      })
      .willRespondWith({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: EXPECTED_BODY,
      });

    return provider.executeTest(async (mockserver) => {
      // Act: test our API client behaves correctly
      const response = await fetch(
        `${mockserver.url}/listings/${listing.listingId}`,
      ).then((res) => res.json());
      expect(response).toEqual({ data: { ...listing } });
    });
  });
});
