import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 30000,
    // ✅ LBS 模块测试使用 node 环境，避免 UniApp 依赖问题
    include: [
      'test/http/request-queue.test.ts',
      'test/http/locks/token-refresh-lock.test.ts',
      'utils/sku-graph/__tests__/**/*.test.ts',
      'test/composables/**/*.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['utils/http/**'],
    },
  },
});
