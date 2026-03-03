/**
 * 🟣 重构阶段：HTTP Client 封装
 * 说明：使用 luch-request 封装 HTTP 客户端，类型洁癖，零 any
 */

import type { HttpClientInstance, RequestConfig, SuccessResponse } from './types';
import request from 'luch-request';

/**
 * 🟢 HTTP 客户端类型定义（零 any）
 */
export interface HttpClientInstance {
  /**
   * 发起 GET 请求
   */
  get<T = unknown>(url: string, config?: RequestConfig): Promise<T>;

  /**
   * 发起 POST 请求
   */
  post<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T>;

  /**
   * 设置请求头
   */
  setHeader(name: string, value: string): void;

  /**
   * 获取请求头
   */
  getHeader(name: string): string;

  /**
   * 删除请求头
   */
  removeHeader(name: string): void;

  /**
   * 设置全局配置
   */
  setConfig(config: RequestConfig): void;

  /**
   * 获取全局配置
   */
  getConfig(): RequestConfig;
}

/**
 * 🟢 请求配置类型（零 any）
 */
export interface RequestConfig {
  /**
   * 请求 URL
   */
  url?: string;

  /**
   * 请求方法
   */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

  /**
   * 请求头
   */
  header?: Record<string, string>;

  /**
   * 请求参数
   */
  data?: unknown;

  /**
   * 超时时间（毫秒）
   */
  timeout?: number;

  /**
   * 跨域携带 Cookie
   */
  withCredentials?: boolean;

  /**
   * 响应数据类型
   */
  responseType?: 'text' | 'arraybuffer';
}

/**
 * 🟢 创建 HTTP 客户端配置（纯函数）
 * 
 * @returns 配置对象
 */
function createHttpClientConfig(): RequestConfig {
  return {
    baseURL: import.meta.env.VITE_API_BASE_URL ?? 'https://api.liuliuzhua.com',
    timeout: 10000,
    withCredentials: true,
  };
}

/**
 * 🟢 HTTP 客户端实例（单例）
 */
const httpClient = request.create(createHttpClientConfig());

/**
 * 🟢 设置请求头（纯函数）
 * 
 * @param name - 请求头名称
 * @param value - 请求头值
 */
function setHeader(name: string, value: string): void {
  httpClient.setHeader(name, value);
}

/**
 * 🟢 清空请求头（纯函数）
 * 
 * @param name - 请求头名称
 */
function clearHeader(name: string): void {
  setHeader(name, '');
}

/**
 * 🟢 设置全局 Token（卫语句优化）
 * 
 * @param token - Bearer Token
 */
export function setAuthToken(token: string | null): void {
  // ✅ 卫语句：提前返回
  if (!token) {
    clearHeader('Authorization');
    return;
  }

  setHeader('Authorization', `Bearer ${token}`);
}

/**
 * 🟢 清空全局 Token（纯函数）
 */
export function clearAuthToken(): void {
  clearHeader('Authorization');
}

/**
 * 🟢 获取 HTTP 客户端实例（工厂函数）
 */
export function getHttpClient(): HttpClientInstance {
  return httpClient;
}

export default httpClient;
