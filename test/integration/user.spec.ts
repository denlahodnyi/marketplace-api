import type { DataSource, QueryRunner } from 'typeorm';

import { User } from '../../src/entities/user.entity.js';
import { aUser } from '../testKit/builders.js';
import startPg, { type SamplePg } from '../testKit/startPg.js';

describe('User repo', () => {
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

  it('WHEN someone creates new user with unknown item_condition, THEN repo throws an error', async () => {
    const repo = qr.manager.getRepository(User);
    const userA = await aUser().insertVia(repo);
    const userB = aUser().withEmail(userA.email).build();
    await expect(repo.save(userB)).rejects.toThrow(
      'duplicate key value violates unique constraint',
    );
  });

  it('WHEN someone creates new user with unknown role, THEN repo throws an error', async () => {
    const repo = qr.manager.getRepository(User);
    const user = aUser()
      .withRole('_unknown_' as unknown as User['userRole'])
      .build();
    await expect(repo.save(user)).rejects.toThrow('violates check constraint');
  });
});
