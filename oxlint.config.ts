import { defineConfig } from 'oxlint';

export default defineConfig({
  rules: {
    'typescript/no-explicit-any': 'off',
    'typescript/no-floating-promises': 'warn',
  },
  env: {
    node: true,
  },
});
