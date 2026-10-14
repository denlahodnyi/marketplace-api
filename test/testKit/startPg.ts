import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { DataSource } from 'typeorm';

import { dataSourceOptions } from '../../src/data-source.js';

const IMAGE = 'postgres:18.6-alpine';

export interface SamplePg {
  container: StartedPostgreSqlContainer;
  dataSource: DataSource;
  connectionUri: string;
  stop: () => Promise<void>;
}

export default async function startPg(): Promise<SamplePg> {
  const container = await new PostgreSqlContainer(IMAGE).start();
  const connectionUri = container.getConnectionUri();
  const dataSource = new DataSource({
    ...dataSourceOptions,
    // logging: ['error', 'query'],
    // logger: 'formatted-console',
    migrations: ['../../src/migrations/**/*{.js,.ts}'],
    url: connectionUri,
  });
  await dataSource.initialize();
  await dataSource.synchronize();

  return {
    container,
    dataSource,
    connectionUri,
    stop: async () => {
      await dataSource.destroy();
      await container.stop();
    },
  };
}
