import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    env: {
      // Prisma 7 requires a connection string for client construction; tests do not hit the DB.
      DATABASE_URL: 'postgresql://127.0.0.1:5432/vitest_placeholder',
    },
    globals: true,
    environment: 'node',
    include: ['**/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', '**/__tests__/**', '**/*.test.ts', '**/*.config.*', '**/dist/**', '**/.next/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
