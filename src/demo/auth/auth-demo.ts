import { execSync } from 'node:child_process';
import '@dotenvx/dotenvx/config';

import { dataSource } from '../../data-source.js';
import { User } from '../../entities/user.entity.js';

const db = await dataSource.initialize();
console.log('Seeding...');
const output = execSync('pnpm seed --listings=10 --orders=0 --progress=false');
console.log(output.toString('utf8'));

const customer = await db
  .getRepository(User)
  .findOneBy({ userId: '01a191ce-5236-728b-a164-31384e5163a9' });

if (!customer) throw new Error('User not found');

const login = await fetch(`http://localhost:3000/auth/login`, {
  method: 'POST',
  body: JSON.stringify({ email: customer.email }),
  headers: {
    'Content-Type': 'application/json',
  },
});
const token = login.headers
  .getSetCookie()
  .map((c) => c.split('='))
  .find((c) => c[0] === 'accessToken');
if (!token) throw new Error('Token not found');
const myListingNoCred = await fetch(
  `http://localhost:3000/listings/${'01a19801-2d38-73b5-9312-0d738bd16be4'}`,
  {
    method: 'PATCH',
    body: JSON.stringify({ price: 600_00 }),
    headers: {
      'Content-Type': 'application/json',
    },
  },
);
const myListingWithCred = await fetch(
  `http://localhost:3000/listings/01a19801-2d38-73b5-9312-0d738bd16be4`,
  {
    method: 'PATCH',
    body: JSON.stringify({ price: 600_00 }),
    headers: {
      Cookie: login.headers.getSetCookie().join('; '),
      'Content-Type': 'application/json',
    },
  },
);
const refresh = await fetch(`http://localhost:3000/auth/refresh`, {
  method: 'POST',
  headers: {
    Cookie: login.headers.getSetCookie().join('; '),
    'Content-Type': 'application/json',
  },
});
const logout = await fetch(`http://localhost:3000/auth/logout`, {
  method: 'POST',
  headers: {
    Cookie: refresh.headers.getSetCookie().join('; '),
    'Content-Type': 'application/json',
  },
});
const myListingWithCredAfterLogout = await fetch(
  `http://localhost:3000/listings/01a19801-2d38-73b5-9312-0d738bd16be4`,
  {
    method: 'PATCH',
    body: JSON.stringify({ price: 200_00 }),
    headers: {
      Cookie: refresh.headers.getSetCookie().join('; '),
      'Content-Type': 'application/json',
    },
  },
);
const refreshAfterLogout = await fetch(`http://localhost:3000/auth/refresh`, {
  method: 'POST',
  headers: {
    Cookie: refresh.headers.getSetCookie().join('; '),
    'Content-Type': 'application/json',
  },
});

console.log('login', login.status); // 200
console.log('no-token', myListingNoCred.status); // 401
console.log('with-token', myListingWithCred.status); // 200
console.log('refresh', refresh.status); // 200
console.log('logout', logout.status); // 200 | 204
console.log('after-logout', myListingWithCredAfterLogout.status); // 401
console.log('refresh-after-logout', refreshAfterLogout.status); // 401

process.exit(0);
