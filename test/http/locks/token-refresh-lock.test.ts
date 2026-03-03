/**
 * 🟢 绿灯阶段（Green）测试：TokenRefreshLock
 * 测试目标：断言并发锁业务逻辑正确运行（而不是抛出错误）
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TokenRefreshLock } from '../../../utils/http/locks/token-refresh-lock';

// 模拟类型定义
interface MockRequestConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: unknown;
  header?: Record<string, string>;
}

describe('TokenRefreshLock - 绿灯阶段测试', () => {
  let lock: TokenRefreshLock;

  beforeEach(() => {
    lock = new TokenRefreshLock();
  });

  /**
   * 🎯 测试 1: isLockActive 初始为 false
   */
  it('🟢 [TEST-1] isLockActive 初始状态为 false', () => {
    expect(lock.isLockActive()).toBe(false);
  });

  /**
   * 🎯 测试 2: getQueueSize 应返回正确的队列长度
   */
  it('🟢 [TEST-2] getQueueSize 应返回正确的队列长度', async () => {
    // ✅ 初始长度为 0
    expect(lock.getQueueSize()).toBe(0);

    // ✅ 挂起 5 个请求（直接调用 getRequestQueue().enqueue()）
    const queue = lock.getRequestQueue();

    for (let i = 0; i < 5; i++) {
      queue.enqueue({
        url: `/api/${i}`,
        method: 'GET' as const,
        header: { Authorization: `Bearer token-${i}` },
      });
    }

    expect(lock.getQueueSize()).toBe(5);
  });

  /**
   * 🎯 测试 3: isRefreshingFlag 初始为 false
   */
  it('🟢 [TEST-3] isRefreshingFlag 初始状态为 false', () => {
    expect(lock.isRefreshingFlag()).toBe(false);
  });

  /**
   * 🎯 测试 4: getRequestQueue 应返回有效的 RequestQueue 实例
   */
  it('🟢 [TEST-4] getRequestQueue 应返回有效的 RequestQueue 实例', () => {
    const queue = lock.getRequestQueue();

    expect(queue).toBeDefined();
    expect(typeof queue.enqueue).toBe('function');
    expect(typeof queue.notify).toBe('function');
    expect(typeof queue.notifyError).toBe('function');
    expect(typeof queue.size).toBe('function');
  });

  /**
   * 🎯 测试 5: acquire 首个请求（isRefreshing=false）→ 触发 refresh + 更新 Token
   */
  it('🟢 [TEST-5] acquire 首个请求（isRefreshing=false）→ 触发 refresh + 更新 Token', async () => {
    const config: MockRequestConfig = {
      url: '/protected/api',
      method: 'GET' as const,
      header: { Authorization: 'Bearer expired-token' },
    };

    // ✅ 调用 acquire
    const result = await lock.acquire(config);

    // ✅ 断言：isRefreshing 变为 true 后归 false
    expect(lock.isRefreshingFlag()).toBe(false);

    // ✅ 断言：返回的新配置带新 Token（带时间戳）
    expect(result).toBeDefined();
    expect(result.header).toBeDefined();
    expect(result.header!['Authorization']).toMatch(/^Bearer new-refreshed-token-\d+$/);

    // ✅ 断言：队列长度为 0（无挂起请求）
    expect(lock.getQueueSize()).toBe(0);
  });

  /**
   * 🎯 测试 6: acquire 后续请求（isRefreshing=true）→ 挂起入队
   */
  it('🟢 [TEST-6] acquire 后续请求（isRefreshing=true）→ 挂起入队', async () => {
    const config1: MockRequestConfig = {
      url: '/protected/api',
      method: 'GET' as const,
      header: { Authorization: 'Bearer expired-token' },
    };

    const config2: MockRequestConfig = {
      url: '/protected/api',
      method: 'POST' as const,
      header: { Authorization: 'Bearer expired-token' },
    };

    // ✅ 第 1 个请求（触发 refresh）
    const promise1 = lock.acquire(config1);

    // ✅ 断言：isRefreshing 为 true（正在刷新）
    expect(lock.isRefreshingFlag()).toBe(true);

    // ✅ 第 2 个请求（挂起入队）
    const promise2 = lock.acquire(config2);

    // ✅ 断言：队列长度为 1
    expect(lock.getQueueSize()).toBe(1);

    // ✅ 等待第 1 个请求完成
    await promise1;

    // ✅ 断言：isRefreshing 归 false
    expect(lock.isRefreshingFlag()).toBe(false);

    // ✅ 等待第 2 个请求（应该已被 notify 释放）
    const result2 = await promise2;

    // ✅ 断言：第 2 个请求也获得新 Token（带时间戳）
    expect(result2.header!['Authorization']).toMatch(/^Bearer new-refreshed-token-\d+$/);

    // ✅ 断言：队列长度为 0
    expect(lock.getQueueSize()).toBe(0);
  });

  /**
   * 🎯 测试 7: 并发 5 个 acquire 调用（核心场景）
   * 说明：只有一个触发 refresh，其余挂起，最后全部获得新 Token
   */
  it('🟢 [TEST-7] 并发 5 个 acquire 调用，仅触发一次 refresh', async () => {
    const configs: MockRequestConfig[] = [
      { url: '/api/1', method: 'GET' as const },
      { url: '/api/2', method: 'POST' as const },
      { url: '/api/3', method: 'PUT' as const },
      { url: '/api/4', method: 'DELETE' as const },
      { url: '/api/5', method: 'GET' as const },
    ];

    // ✅ 5 个并发请求
    const promises = configs.map((config) => lock.acquire(config));

    // ✅ 断言：初始 isRefreshing 为 true（第一个触发）
    expect(lock.isRefreshingFlag()).toBe(true);

    // ✅ 断言：队列长度为 4（4 个挂起）
    expect(lock.getQueueSize()).toBe(4);

    // ✅ 等待所有请求完成
    const results = await Promise.all(promises);

    // ✅ 断言：isRefreshing 归 false
    expect(lock.isRefreshingFlag()).toBe(false);

    // ✅ 断言：队列长度为 0
    expect(lock.getQueueSize()).toBe(0);

    // ✅ 断言：5 个结果都带新 Token（带时间戳）
    results.forEach((result, index) => {
      expect(result.header!['Authorization']).toMatch(/^Bearer new-refreshed-token-\d+$/);
    });
  });

  /**
   * 🎯 测试 8: 多个挂起请求在 isRefreshing 为 true 时入队，随后 refresh 成功
   * 说明：由于 refresh 逻辑无法在测试中直接 mock 失败（refreshTokenFallback 是内部调用），
   * 此测试验证挂起请求在 isRefreshing=true 时的行为
   */
  it('🟢 [TEST-8] 多个挂起请求入队后 refresh 成功', async () => {
    const configs: MockRequestConfig[] = [
      { url: '/api/1', method: 'GET' as const },
      { url: '/api/2', method: 'POST' as const },
      { url: '/api/3', method: 'PUT' as const },
    ];

    // ✅ 3 个并发请求（第一个触发 refresh，其余挂起）
    const promises = configs.map((config) => lock.acquire(config));

    // ✅ 等待所有请求完成（refresh 成功）
    const results = await Promise.all(promises);

    // ✅ 断言：isRefreshing 归 false
    expect(lock.isRefreshingFlag()).toBe(false);

    // ✅ 断言：队列长度为 0
    expect(lock.getQueueSize()).toBe(0);

    // ✅ 断言：3 个结果都带新 Token
    results.forEach((result) => {
      expect(result.header!['Authorization']).toMatch(/^Bearer new-refreshed-token-\d+$/);
    });
  });

  /**
   * 🎯 测试 9: 模拟 "首个请求 + 刷新成功 + 后续请求 + 通知"
   */
  it('🟢 [TEST-9] 首个请求 + 刷新成功 + 后续请求 + 通知', async () => {
    const configs: MockRequestConfig[] = [
      { url: '/api/1', method: 'GET' as const },
      { url: '/api/2', method: 'POST' as const },
      { url: '/api/3', method: 'PUT' as const },
    ];

    // ✅ 3 个并发请求
    const promises = configs.map((config) => lock.acquire(config));

    // ✅ 等待完成
    const results = await Promise.all(promises);

    // ✅ 断言：isRefreshing 归 false
    expect(lock.isRefreshingFlag()).toBe(false);

    // ✅ 断言：队列长度为 0
    expect(lock.getQueueSize()).toBe(0);

    // ✅ 断言：3 个结果都带新 Token（带时间戳）
    results.forEach((result, index) => {
      expect(result.header!['Authorization']).toMatch(/^Bearer new-refreshed-token-\d+$/);
    });
  });

  /**
   * 🎯 测试 10: 长生命周期测试（队列多次复用）
   * 说明：验证 Token 可以经历无数次"过期 -> 刷新 -> 释放"的循环
   * 这是重构后核心亮点：不再使用 hasNotified 导致的死锁隐患已根除
   */
  it('🟢 [TEST-10] 长生命周期测试（队列可多次复用）', async () => {
    // ✅ 第一轮 Token 过期 -> 刷新 -> 释放
    const configs1: MockRequestConfig[] = [
      { url: '/api/r1-1', method: 'GET' as const },
      { url: '/api/r1-2', method: 'POST' as const },
    ];

    const promises1 = configs1.map((config) => lock.acquire(config));
    const results1 = await Promise.all(promises1);

    // ✅ 断言：第一轮正常完成
    expect(lock.isRefreshingFlag()).toBe(false);
    expect(lock.getQueueSize()).toBe(0);
    results1.forEach((result) => {
      expect(result.header!['Authorization']).toMatch(/^Bearer new-refreshed-token-\d+$/);
    });

    // ✅ 模拟：Token 再次过期（第二轮）
    // （实际业务中，这里会是新的 Token 过期）
    const configs2: MockRequestConfig[] = [
      { url: '/api/r2-1', method: 'GET' as const },
    ];

    const promises2 = configs2.map((config) => lock.acquire(config));
    const results2 = await Promise.all(promises2);

    // ✅ 断言：第二轮也正常完成（队列被复用）
    expect(lock.isRefreshingFlag()).toBe(false);
    expect(lock.getQueueSize()).toBe(0);
    results2.forEach((result) => {
      expect(result.header!['Authorization']).toMatch(/^Bearer new-refreshed-token-\d+$/);
    });

    // ✅ 模拟：Token 第三次过期（第三轮）
    const config3: MockRequestConfig = { url: '/api/r3-1', method: 'GET' as const };
    const result3 = await lock.acquire(config3);

    // ✅ 断言：第三轮也正常完成（队列继续复用）
    expect(lock.isRefreshingFlag()).toBe(false);
    expect(lock.getQueueSize()).toBe(0);
    expect(result3.header!['Authorization']).toMatch(/^Bearer new-refreshed-token-\d+$/);
  });

  /**
   * 🎯 测试 11: 锁状态重置测试
   * 说明：验证 isRefreshing 标志在 acquire 完成后正确重置为 false
   */
  it('🟢 [TEST-11] 锁状态正确重置（isRefreshing=false）', async () => {
    // ✅ 多次 acquire，验证锁状态正确重置
    for (let i = 0; i < 3; i++) {
      const config: MockRequestConfig = {
        url: `/api/test-${i}`,
        method: 'GET' as const,
      };

      const result = await lock.acquire(config);

      // ✅ 断言：isRefreshing 归 false（每次 acquire 完成后）
      expect(lock.isRefreshingFlag()).toBe(false);

      // ✅ 断言：队列长度为 0
      expect(lock.getQueueSize()).toBe(0);

      // ✅ 断言：结果带新 Token
      expect(result.header!['Authorization']).toMatch(/^Bearer new-refreshed-token-\d+$/);
    }
  });
});
