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
const refresh = await fetch(`http://localhost:3000/auth/refresh`, {
  method: 'POST',
  headers: {
    Cookie: login.headers.getSetCookie().join('; '),
    'Content-Type': 'application/json',
  },
});
const reuse = await fetch(`http://localhost:3000/auth/refresh`, {
  method: 'POST',
  headers: {
    Cookie: login.headers.getSetCookie().join('; '),
    'Content-Type': 'application/json',
  },
});
const reuseAfter = await fetch(`http://localhost:3000/auth/refresh`, {
  method: 'POST',
  headers: {
    Cookie: refresh.headers.getSetCookie().join('; '),
    'Content-Type': 'application/json',
  },
});

console.log('login', login.status); // 200
console.log('r1-refresh', refresh.status); // 200
console.log('r1-reuse', reuse.status); // 401
console.log('r2-after-reuse', reuseAfter.status); // 401

process.exit(0);
