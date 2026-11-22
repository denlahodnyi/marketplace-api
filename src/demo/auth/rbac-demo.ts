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
const customer2 = await db
  .getRepository(User)
  .findOneBy({ userId: '01a191ce-5236-72b5-bc74-1c94df1e59ac' });
const admin = await db
  .getRepository(User)
  .findOneBy({ userId: '01a191ce-5235-7e4f-970a-3abbdc19ef15' });

if (!customer || !customer2 || !admin) throw new Error('User not found');

const anon = await fetch(
  `http://localhost:3000/listings/01a19801-2d38-73b5-9312-0d738bd16be4`,
  {
    method: 'PATCH',
    body: JSON.stringify({ price: 200_00 }),
    headers: {
      'Content-Type': 'application/json',
    },
  },
);
const login = await fetch(`http://localhost:3000/auth/login`, {
  method: 'POST',
  body: JSON.stringify({ email: customer.email }),
  headers: {
    'Content-Type': 'application/json',
  },
});
const own = await fetch(
  `http://localhost:3000/listings/01a19801-2d38-73b5-9312-0d738bd16be4`,
  {
    method: 'PATCH',
    body: JSON.stringify({ price: 200_00 }),
    headers: {
      Cookie: login.headers.getSetCookie().join('; '),
      'Content-Type': 'application/json',
    },
  },
);
const login2 = await fetch(`http://localhost:3000/auth/login`, {
  method: 'POST',
  body: JSON.stringify({ email: customer2.email }),
  headers: {
    'Content-Type': 'application/json',
  },
});
const foreign = await fetch(
  `http://localhost:3000/listings/01a19801-2d38-73b5-9312-0d738bd16be4`,
  {
    method: 'PATCH',
    body: JSON.stringify({ price: 200_00 }),
    headers: {
      Cookie: login2.headers.getSetCookie().join('; '),
      'Content-Type': 'application/json',
    },
  },
);
const denied = await fetch(`http://localhost:3000/admin/moderation/listings`, {
  method: 'GET',
  headers: {
    Cookie: login2.headers.getSetCookie().join('; '),
  },
});
const loginAsAdmin = await fetch(`http://localhost:3000/auth/login`, {
  method: 'POST',
  body: JSON.stringify({ email: admin!.email }),
  headers: {
    'Content-Type': 'application/json',
  },
});
const allowed = await fetch(`http://localhost:3000/admin/moderation/listings`, {
  method: 'GET',
  headers: {
    Cookie: loginAsAdmin.headers.getSetCookie().join('; '),
  },
});

const token = login.headers
  .getSetCookie()
  .map((c) => c.split('; ').map((c) => c.split('=')))
  .flat()
  .find((c) => c[0] === 'accessToken')?.[1];
console.log(`🚀 -> token:`, token);
if (!token) throw new Error('Token not found');

const t = token.split('.');
const p = JSON.parse(Buffer.from(t[1], 'base64url').toString());
p.role = 'admin';
t[1] = Buffer.from(JSON.stringify(p)).toString('base64url');
console.log(t.join('.'));

const tampered = await fetch(
  `http://localhost:3000/admin/moderation/listings`,
  {
    method: 'GET',
    headers: {
      Cookie: `accessToken=${t}`,
    },
  },
);

console.log('anon', anon.status); // 401
console.log('own', own.status); // 200
console.log('foreign', foreign.status); // 403
console.log('role-denied', denied.status); // 403
console.log('role-allowed', allowed.status); // 200 | 201
console.log('tampered', tampered.status); // 401

process.exit(0);
