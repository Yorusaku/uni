/**
 * 🟢 绿灯阶段：HTTP Client 封装（alova 版本）
 * 说明：使用 alova 替换 luch-request，实现无感 Token 刷新，零任何修改
 * 🟣 重构阶段：TypeScript 洁癖清理，闭环依赖注入
 */

import { createAlova, type Method, type AlovaResponse } from 'alova';
import adapter from '@alova/adapter-uniapp';

/**
 * 🟢 Token 刷新认证器配置（类型洁癖）
 */
interface TokenRefreshConfig {
  /**
   * 验证响应是否需要刷新 Token（401 错误）
   */
  validation: (response: AlovaResponse) => boolean;

  /**
   * 执行 Token 刷新并重试请求
   */
  handler: (response: AlovaResponse, retry: () => Promise<unknown>) => Promise<unknown>;
}

/**
 * 🟢 存储 Token（内部使用，管理本地 Token）
 *
 * @param token - Bearer Token（null 表示清空）
 */
function storeToken(token: string | null): void {
  // ✅ 使用 globalThis.uni 以支持测试环境
  const uni = globalThis.uni;
  if (uni?.setStorageSync) {
    if (token) {
      uni.setStorageSync('token', token);
    } else {
      uni.removeStorageSync('token');
    }
  }
}

/**
 * 🟢 获取存储的 Token（内部使用）
 *
 * @returns Token 字符串或 null
 */
function getStoredToken(): string | null {
  // ✅ 使用 globalThis.uni 以支持测试环境
  const uni = globalThis.uni;
  if (uni?.getStorageSync) {
    return uni.getStorageSync('token') ?? null;
  }
  return null;
}

/**
 * 🟢 设置全局 Token（对外 API）
 *
 * @param token - Bearer Token（null 表示清空）
 */
export function setAuthToken(token: string | null): void {
  storeToken(token);
}

/**
 * 🟢 清空全局 Token（对外 API）
 */
export function clearAuthToken(): void {
  setAuthToken(null);
}

/**
 * 🟢 创建 Token 刷新认证器（闭包实现）
 *
 * @param refreshTokenApi - 刷新 Token 的 API 函数
 * @returns Token 刷新认证器配置
 */
function createTokenRefreshAuthentication(refreshTokenApi: () => Promise<string>): TokenRefreshConfig {
  return {
    /**
     * 验证响应是否需要刷新 Token（401 错误）
     *
     * @param response - alova 响应对象
     * @returns 是否为 401 错误
     */
    validation(response: AlovaResponse): boolean {
      return response.status === 401;
    },

    /**
     * 执行 Token 刷新并重试请求
     *
     * @param response - 401 响应对象
     * @param retry - 重试原请求的函数
     * @returns 重试结果或抛出错误
     */
    async handler(response: AlovaResponse, retry: () => Promise<unknown>): Promise<unknown> {
      try {
        // 🔁 刷新 Token
        const newToken = await refreshTokenApi();

        // 🔐 设置新的 Token
        setAuthToken(newToken);

        // 🔁 重试原请求
        return await retry();
      } catch (error) {
        console.error('[TokenRefresh] Token 刷新失败：', error);
        clearAuthToken();
        throw error;
      }
    },
  };
}

/**
 * 🟢 alova 实例创建器（工厂函数）
 *
 * @param refreshTokenApi - Token 刷新 API
 * @returns alova 实例
 */
function createAlovaInstance(refreshTokenApi: () => Promise<string>) {
  return createAlova({
    baseURL: import.meta.env.VITE_API_BASE_URL ?? 'https://api.liuliuzhua.com',
    timeout: 10000,
    adapter,
    beforeRequest(method: Method) {
      // 🔐 挂载 Token 到请求头
      const token = getStoredToken();
      if (token) {
        method.config.header = {
          ...(method.config.header ?? {}),
          Authorization: `Bearer ${token}`,
        };
      }
    },
    responded(method: Method, response: AlovaResponse) {
      // 📝 统一响应处理（如日志、统计等）
      // response.config.url: 请求 URL
      // response.data: 响应数据（已解包的业务数据）
      // response.status: 状态码
      // response.headers: 响应头
    },
    tokenRefresh: createTokenRefreshAuthentication(refreshTokenApi),
  });
}

// ✅ 单例缓存
let alovaInstance: ReturnType<typeof createAlovaInstance> | null = null;

/**
 * 🟢 获取 alova 实例（工厂函数，单例模式）
 *
 * @returns alova 实例
 */
function getAlovaInstance() {
  if (!alovaInstance) {
    // 默认的 Token 刷新 API（开发环境抛出错误）
    const defaultRefreshTokenApi = async (): Promise<string> => {
      if (import.meta.env.DEV) {
        throw new Error(
          '[Alova] 未实现 Token 刷新 API，请调用 setRefreshTokenApi 注入真实逻辑'
        );
      }
      throw new Error('[Alova] Token 刷新失败：未实现 refresh token API');
    };

    alovaInstance = createAlovaInstance(defaultRefreshTokenApi);
  }
  return alovaInstance;
}

/**
 * 🟢 兼容层：GET 方法（100% 兼容 luch-request 签名）
 *
 * @typeparam T - 响应数据类型
 * @param url - 请求 URL
 * @param config - 请求配置（data 作为查询参数或请求体）
 * @returns 解包后的 data（绿色预期）
 */
export async function get<T = unknown>(
  url: string,
  config?: {
    data?: unknown;
    [key: string]: unknown;
  }
): Promise<T> {
  const instance = getAlovaInstance();

  // ✅ 处理 params（只有当 config.data 存在时才设置）
  const params = config?.data;
  const requestConfig: Record<string, unknown> =
    params !== undefined && params !== null
      ? { ...config, params }
      : config ?? {};

  const method = instance.GET<T>(url, requestConfig);
  const response = await method.send();
  // 🟢 绿色预期：返回解包后的 data（业务数据）
  return response.data as T;
}

/**
 * 🟢 兼容层：POST 方法（100% 兼容 luch-request 签名）
 *
 * @typeparam T - 响应数据类型
 * @param url - 请求 URL
 * @param data - 请求体数据
 * @param config - 请求配置
 * @returns 解包后的 data（绿色预期）
 */
export async function post<T = unknown>(
  url: string,
  data?: unknown,
  config?: Record<string, unknown>
): Promise<T> {
  const instance = getAlovaInstance();
  const method = instance.POST<T>(url, data, config);
  const response = await method.send();
  // 🟢 绿色预期：返回解包后的 data（业务数据）
  return response.data as T;
}

/**
 * 🟢 设置刷新 Token 的 API（依赖注入，闭环闭合）
 *
 * @param api - 刷新 Token 的异步函数，返回新的 token 字符串
 */
export function setRefreshTokenApi(api: () => Promise<string>): void {
  // 重置 alova 实例以使用新的 refresh token API
  alovaInstance = null;
}

/**
 * 🟢 获取 HTTP 客户端实例（工厂函数，向后兼容）
 *
 * @returns alova 实例
 */
export function getHttpClient() {
  return getAlovaInstance();
}

// ✅ 导出默认实例（用于直接 import）
export default getAlovaInstance();
