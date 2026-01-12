import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}', 'tests/integration/**/*.test.{ts,tsx}'],

    // Environment variables for tests
    env: {
      NODE_ENV: 'test',
    },

    // Test isolation - each test file runs in isolation
    isolate: true,

    // Timeouts
    testTimeout: 30000, // 30 seconds for integration tests
    hookTimeout: 30000,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        ...configDefaults.coverage.exclude!,
        'node_modules/',
        'tests/',
        '**/*.config.{ts,js}',
        '**/types/',
        'generated/',
      ],
    },

    // Reporter configuration
    reporter: ['default'],

    // Sequence configuration - run tests in a predictable order
    sequence: {
      shuffle: false,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
