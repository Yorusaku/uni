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
    // ✅ 网络层测试（alova 迁移）使用 node 环境，避免 UniApp 依赖问题
    include: [
      'test/http/*.test.ts',
      'utils/sku-graph/__tests__/**/*.test.ts',
      'test/composables/**/*.test.ts',
    ],
    setupFiles: [
      path.resolve(__dirname, 'test/setup-mocks.ts'),
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['utils/http/**'],
    },
  },
});
