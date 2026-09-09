import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

import { envSchema } from '../src/config/env.schema.ts';

const env = readFileSync(new URL('../.env.example', import.meta.url), 'utf8');
const parsed = parseEnv(env);
const exampleKeys = new Set(Object.keys(parsed));
const schemaKeys = new Set(Object.keys(envSchema.keyof().def.entries));
const exampleDiff = exampleKeys.difference(schemaKeys);
const schemaDiff = schemaKeys.difference(exampleKeys);

if (exampleDiff.size) {
  console.error(
    `✗ The schema is missing variables defined in .env.example: ${[...exampleDiff].join(', ')}`,
  );
}
if (schemaDiff.size) {
  console.error(
    `✗ .env.example is missing variables defined in schema: ${[...schemaDiff].join(', ')}`,
  );
}

if (exampleDiff.size || schemaDiff.size) process.exit(1);

console.log('✓ .env.example is consistent with the schema');
