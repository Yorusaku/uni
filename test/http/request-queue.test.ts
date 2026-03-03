/**
 * 🟢 绿灯阶段（Green）测试：RequestQueue
 * 测试目标：断言业务逻辑正确运行（而不是抛出错误）
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RequestQueue } from '../../utils/http/request-queue/queue-manager';

describe('RequestQueue - 绿灯阶段测试', () => {
  let queue: RequestQueue;

  beforeEach(() => {
    queue = new RequestQueue();
  });

  /**
   * 🎯 测试 1: enqueue 应返回挂起的 Promise（等待 notify 释放）
   */
  it('🟢 [TEST-1] enqueue 应返回挂起的 Promise（等待 notify 释放）', async () => {
    const config = {
      url: '/test/api',
      method: 'GET' as const,
      data: { id: 1 },
    };

    // ✅ 调用 enqueue，获取挂起的 Promise
    const pendingPromise = queue.enqueue(config);

    // ✅ 断言：Promise 存在（尚未 resolve）
    expect(pendingPromise).toBeInstanceOf(Promise);

    // ⏸️ 此刻不应 resolve（因为未调用 notify）
    // we'll test resolve in TEST-2
  });

  /**
   * 🎯 测试 2: notify 应释放所有挂起请求
   */
  it('🟢 [TEST-2] notify 应释放所有挂起请求并传递新配置', async () => {
    const config = {
      url: '/test/api',
      method: 'GET' as const,
      data: { id: 1 },
    };

    const newConfig = {
      url: '/test/api',
      method: 'GET' as const,
      data: { id: 1, newParam: 'value' },
    };

    // ✅ 挂起请求
    const pendingPromise = queue.enqueue(config);

    // ✅ 通知（发布新配置）
    queue.notify(newConfig);

    // ✅ 断言：Promise 被 resolve 且携带新配置
    await expect(pendingPromise).resolves.toEqual(newConfig);

    // ✅ 断言：队列已清空
    expect(queue.size()).toBe(0);
  });

  /**
   * 🎯 测试 3: size 应返回正确的队列长度
   */
  it('🟢 [TEST-3] size 应返回正确的队列长度', async () => {
    // ✅ 初始长度为 0
    expect(queue.size()).toBe(0);

    // ✅ 挂起 5 个请求
    const promises = [];
    for (let i = 0; i < 5; i++) {
      const config = { url: `/api/${i}`, method: 'GET' as const };
      promises.push(queue.enqueue(config));
    }

    // ✅ 断言长度为 5
    expect(queue.size()).toBe(5);

    // ✅ 通知释放
    queue.notify({ url: '/api/final', method: 'GET' as const });

    // ✅ 等待所有 Promise
    await Promise.all(promises);

    // ✅ 断言长度为 0
    expect(queue.size()).toBe(0);
  });

  /**
   * 🎯 测试 4: 多次调用 enqueue，再调用一次 notify，全部释放
   */
  it('🟢 [TEST-4] 多次 enqueue + 单次 notify，全部释放', async () => {
    const newConfig = {
      url: '/api/final',
      method: 'GET' as const,
      header: { Authorization: 'Bearer new-token' },
    };

    // ✅ 挂起 5 个请求
    const promises = [];
    for (let i = 0; i < 5; i++) {
      const config = {
        url: `/api/${i}`,
        method: 'GET' as const,
        header: { Authorization: `Bearer old-token-${i}` },
      };
      promises.push(queue.enqueue(config));
    }

    // ✅ 断言：队列长度为 5
    expect(queue.size()).toBe(5);

    // ✅ 通知释放
    queue.notify(newConfig);

    // ✅ 等待所有 Promise
    const results = await Promise.all(promises);

    // ✅ 断言：5 个结果都等于 newConfig
    results.forEach((result, index) => {
      expect(result).toEqual(newConfig);
    });

    // ✅ 断言：队列已清空
    expect(queue.size()).toBe(0);
  });

  /**
   * 🎯 测试 5: notifyError 应 reject 所有挂起请求
   */
  it('🟢 [TEST-5] notifyError 应 reject 所有挂起请求', async () => {
    const error = new Error('Token 刷新失败');

    // ✅ 挂起 3 个请求
    const promises = [];
    for (let i = 0; i < 3; i++) {
      const config = { url: `/api/${i}`, method: 'GET' as const };
      promises.push(queue.enqueue(config));
    }

    // ✅ 断言：队列长度为 3
    expect(queue.size()).toBe(3);

    // ✅ 通知失败
    queue.notifyError(error);

    // ✅ 等待所有 Promise（应全部 reject）
    await expect(Promise.all(promises)).rejects.toThrow('Token 刷新失败');

    // ✅ 断言：队列已清空
    expect(queue.size()).toBe(0);
  });

  /**
   * 🎯 测试 6: notifyError 后再 enqueue，应正常挂起（队列重置）
   */
  it('🟢 [TEST-6] notifyError 后再 enqueue 应正常工作', async () => {
    const error = new Error('Token 刷新失败');

    // ✅ 第一轮：挂起 2 个请求 → notifyError
    const promises1 = [];
    promises1.push(queue.enqueue({ url: '/api/1', method: 'GET' as const }));
    promises1.push(queue.enqueue({ url: '/api/2', method: 'GET' as const }));

    queue.notifyError(error);
    await expect(Promise.all(promises1)).rejects.toThrow('Token 刷新失败');

    // ✅ 断言：队列已清空
    expect(queue.size()).toBe(0);

    // ✅ 第二轮：再次 enqueue 1 个请求（队列自然清空，无需额外重置）
    const config2 = { url: '/api/3', method: 'GET' as const };
    const promise2 = queue.enqueue(config2);

    // ✅ 断言：队列长度为 1
    expect(queue.size()).toBe(1);

    // ✅ 通知成功
    const newConfig2 = { url: '/api/3', method: 'GET' as const, header: { Authorization: 'Bearer new-token' } };
    queue.notify(newConfig2);

    // ✅ 断言：Promise 被 resolve
    await expect(promise2).resolves.toEqual(newConfig2);

    // ✅ 断言：队列已清空
    expect(queue.size()).toBe(0);
  });
});
