/**
 * 🟣 重构阶段：类型定义
 * 说明：提取类型定义，零 any，类型洁癖
 */

/**
 * 🟢 响应数据泛型（零 any）
 * 
 * @template T - 实际数据类型
 */
export interface ResponseData<T = unknown> {
  /**
   * 业务状态码
   */
  code: number;

  /**
   * 业务消息
   */
  message: string;

  /**
   * 实际数据
   */
  data?: T;
}

/**
 * 🟢 成功响应（泛型推导）
 * 
 * @template T - 数据类型
 */
export interface SuccessResponse<T = unknown> extends ResponseData<T> {
  code: 200;
  data: T;
}

/**
 * 🟢 错误响应（泛型推导）
 */
export interface ErrorResponse extends ResponseData<null> {
  code: number;
  data: null;
}

/**
 * 🟢 请求配置泛型（零 any）
 */
export interface RequestConfig {
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  header?: Record<string, string>;
  data?: unknown;
  timeout?: number;
  withCredentials?: boolean;
  responseType?: 'text' | 'arraybuffer';
}

/**
 * 🟢 创建设置请求头的辅助函数（纯函数）
 * 
 * @param name - 请求头名称
 * @param value - 请求头值
 * @returns 设置后的值
 */
export function createSetHeaderValue(name: string, value: string): string {
  return `${name}: ${value}`;
}
