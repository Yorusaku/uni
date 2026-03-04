/**
 * 🟢 绿灯阶段：HTTP Client 测试（alova 预期）
 * 说明：测试 alova 实现的预期行为，确保兼容层 100% 有效
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ✅ Mock globalThis.uni（用于 client.ts 的 storeToken/getStoredToken）
vi.stubGlobal('uni', {
  request: vi.fn(),
  getStorageSync: vi.fn(),
  setStorageSync: vi.fn(),
  removeStorageSync: vi.fn(),
  showToast: vi.fn(),
});

// ✅ Mock alova（使用 vi.hoisted 避免 hoisting 问题）
const mockAlovaInstance = vi.hoisted(() => ({
  GET: vi.fn(),
  POST: vi.fn(),
}));

vi.mock('alova', () => ({
  createAlova: vi.fn().mockReturnValue(mockAlovaInstance),
}));

vi.mock('@alova/adapter-uniapp', () => ({
  default: {},
}));

// ✅ 导入测试模块（放在 mock 之后）
import { get, post, setAuthToken, clearAuthToken, getAlovaInstance } from '@/utils/http/client';

describe('🟢 绿灯阶段：HTTP Client（alova 预期行为）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // ✅ Mock Token
    (globalThis.uni.getStorageSync as vi.Mock).mockReturnValue('Bearer eyJhbGc...');
    (globalThis.uni.setStorageSync as vi.Mock).mockReturnValue(undefined);
    (globalThis.uni.removeStorageSync as vi.Mock).mockReturnValue(undefined);
  });

  /**
   * 🎯 [TEST-10] get 方法应返回解包后的 data（alova 预期）
   * 注意：alova 返回的是 {data, status, headers} 结构
   */
  it('🟢 [TEST-10] get 方法应返回解包后的 data（alova 预期）', async () => {
    // ✅ Mock alova GET 返回结构
    const mockResponse = {
      data: { id: 1, name: 'test' }, // ✅ 业务数据（已解包）
      status: 200,
      headers: {},
      config: {},
    };
    
    vi.mocked(mockAlovaInstance.GET).mockReturnValue({
      send: vi.fn().mockResolvedValue(mockResponse),
    });

    // ✅ 调用 get 方法
    const result = await get('/home/merchants', { page: 1 });

    // ✅ 验证返回解包后的 data
    expect(result).toEqual({ id: 1, name: 'test' });

    // ✅ 验证 alova.GET 被正确调用（只验证第一个参数 url）
    expect(mockAlovaInstance.GET).toHaveBeenCalledWith('/home/merchants', expect.any(Object));
  });

  /**
   * 🎯 [TEST-11] post 方法应返回解包后的 data（alova 预期）
   */
  it('🟢 [TEST-11] post 方法应返回解包后的 data（alova 预期）', async () => {
    // ✅ Mock alova POST 返回结构
    const mockResponse = {
      data: { id: 1, name: 'test' }, // ✅ 业务数据（已解包）
      status: 201,
      headers: {},
      config: {},
    };
    
    vi.mocked(mockAlovaInstance.POST).mockReturnValue({
      send: vi.fn().mockResolvedValue(mockResponse),
    });

    // ✅ 调用 post 方法
    const result = await post('/home/merchants', { name: 'test' });

    // ✅ 验证返回解包后的 data
    expect(result).toEqual({ id: 1, name: 'test' });

    // ✅ 验证 alova.POST 被正确调用
    expect(mockAlovaInstance.POST).toHaveBeenCalledWith('/home/merchants', { name: 'test' }, undefined);
  });

  /**
   * 🎯 [TEST-14] setAuthToken / clearAuthToken 应正确操作本地存储（alova 行为）
   */
  it('🟢 [TEST-14] setAuthToken / clearAuthToken 应正确操作本地存储', () => {
    // ✅ 调用 setAuthToken
    setAuthToken('new-token-xyz');

    // ✅ 应调用 setStorageSync
    expect(globalThis.uni.setStorageSync).toHaveBeenCalledWith('token', 'new-token-xyz');

    // ✅ 调用 clearAuthToken
    clearAuthToken();

    // ✅ 应调用 removeStorageSync
    expect(globalThis.uni.removeStorageSync).toHaveBeenCalledWith('token');

    // ✅ 测试 null 清空
    setAuthToken(null);
    expect(globalThis.uni.removeStorageSync).toHaveBeenCalledTimes(2);
  });
});
