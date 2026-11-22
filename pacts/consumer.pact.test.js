import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import path from 'node:path';
import { PactV3, MatchersV3 } from '@pact-foundation/pact';

const products = [
  {
    productId: crypto.randomUUID(),
    name: 'Lego',
    description: '',
    price: 12300,
    currency: 'USD',
  },
];
async function getProducts(url) {
  // console.log('URL', url);
  // return products;
  return fetch(`${url}/products`).then((res) => res.json());
}

// Create a 'pact' between the two applications in the integration we are testing
const provider = new PactV3({
  dir: path.resolve(process.cwd(), 'pacts'),
  consumer: 'MyConsumer',
  provider: 'MyProvider',
});

const EXPECTED_BODY = MatchersV3.eachLike(products[0]);

describe('GET /products', () => {
  it('returns an HTTP 200 and a list of products', () => {
    // Arrange: Setup our expected interactions
    //
    // We use Pact to mock out the backend API
    provider
      .given('I have a list of products')
      .uponReceiving('a request for all products')
      .withRequest({
        method: 'GET',
        path: '/products',
      })
      .willRespondWith({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: EXPECTED_BODY,
      });

    return provider.executeTest(async (mockserver) => {
      // Act: test our API client behaves correctly
      const response = await getProducts(mockserver.url);
      assert.deepEqual(response, products);
    });
  });
});
