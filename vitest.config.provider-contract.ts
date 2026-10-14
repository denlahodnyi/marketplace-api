import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['test/contract/provider/**/*.spec.ts'],
    reporters: ['default'],
    testTimeout: 15_000,
    hookTimeout: 30_000, // headroom for testcontainers
  },
});
