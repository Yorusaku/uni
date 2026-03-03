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
    // ✅ HTTP 集成测试需要 UniApp 环境，仅在 Vitest 中运行底层模块测试
    include: [
      'test/http/request-queue.test.ts',
      'test/http/locks/token-refresh-lock.test.ts',
      'utils/sku-graph/__tests__/**/*.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['utils/http/**'],
    },
  },
});
