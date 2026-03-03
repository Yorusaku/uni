/**
 * 🟣 重构阶段：拦截器（集成 TokenRefreshLock）
 * 说明：请求/响应拦截器，处理 Token 刷新逻辑，卫语句优化
 */

import type { Interceptor, RequestConfig, ResponseConfig } from 'luch-request';
import { TokenRefreshLock } from './locks/token-refresh-lock';
import { getHttpClient } from './client';
import { ResponseData } from './types';

// ✅ 全局单例 HTTP 客户端
const httpClient = getHttpClient();

// ✅ 全局单例 Token 刷新锁
const lock = new TokenRefreshLock({
  // ✅ Token 提取器：从 Authorization 头获取
  tokenExtractor: (config) => {
    const auth = config.header?.['Authorization'];
    if (!auth) return null;

    const match = auth.match(/^Bearer\s+(.+)$/i);
    return match?.[1] ?? null;
  },
  // ✅ Token 刷新器：调用后端 API
  tokenRefresher: async (oldToken) => {
    // 🔬 实际业务：调用 /api/auth/refresh-token API
    // 简化实现：直接返回新 Token
    return `new-refreshed-token-${Date.now()}`;
  },
});

/**
 * 🟢 请求拦截器：挂载 Token（卫语句优化）
 *
 * @param config - 请求配置
 * @returns 修改后的请求配置
 */
export const requestInterceptor: Interceptor<RequestConfig> = (config) => {
  // ✅ 卫语句：提前返回
  const token = uni.getStorageSync<string>('token');
  if (!token) return config;

  // ✅ 挂载 Token 到请求头（防空指针）
  config.header = {
    ...(config.header ?? {}),
    Authorization: `Bearer ${token}`,
  };

  return config;
};

/**
 * 🟢 检查是否为 Token 过期错误（纯函数）
 *
 * @param code - 业务状态码
 * @returns 是否为 Token 过期
 */
function isTokenExpired(code: number): boolean {
  return code === 401;
}

/**
 * 🟢 检查是否为业务成功（纯函数）
 *
 * @param code - 业务状态码
 * @returns 是否为成功
 */
function isSuccess(code: number): boolean {
  return code === 200;
}

/**
 * 🟢 处理 Token 刷新失败（纯函数）
 * 
 * @param error - 错误对象
 */
function handleTokenRefreshFailure(error: unknown): void {
  console.error('[ResponseInterceptor] Token 刷新失败', error);

  // 清空本地 Token
  uni.removeStorageSync('token');
  setAuthToken(null);

  // 跳转登录页（H5 环境）
  if (typeof window !== 'undefined') {
    window.location.href = '/pages/login/index';
  }
}

/**
 * 🟢 设置全局 Token（纯函数）
 *
 * @param token - Bearer Token
 */
function setAuthToken(token: string | null): void {
  if (token) {
    uni.setStorageSync('token', token);
  } else {
    uni.removeStorageSync('token');
  }
}

/**
 * 🟢 响应拦截器：处理 Token 刷新（卫语句 + 低嵌套）
 *
 * @param response - 响应对象
 * @returns 数据或重新发起请求
 */
export const responseInterceptor: Interceptor<ResponseConfig> = async (response) => {
  const { code, message, data } = response.data as ResponseData<unknown>;

  // ✅ 卫语句 1：业务成功 → 直接返回数据
  if (isSuccess(code)) {
    return data;
  }

  // ✅ 卫语句 2：Token 过期 → 刷新后重发
  if (isTokenExpired(code)) {
    try {
      const newConfig = await lock.acquire(response.config);
      return httpClient(newConfig);
    } catch (error) {
      handleTokenRefreshFailure(error);
      throw error;
    } finally {
      lock.reset();
    }
  }

  // ✅ 卫语句 3：其他错误 → 抛出异常
  throw new Error(message || '请求失败');
};

export default {
  requestInterceptor,
  responseInterceptor,
};
