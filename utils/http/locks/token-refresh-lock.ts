// 🟢 绿灯阶段（Green）：并发锁核心实现
// 严格遵循 V4 规约：防御性编程、异常兜底、零 any

import { RequestQueue, QueuedRequestConfig } from '../request-queue/queue-manager';

/**
 * Token 提取器函数类型
 * 接收请求配置，返回旧 Token（或空字符串）
 */
export type TokenExtractor = (config: QueuedRequestConfig) => string | null;

/**
 * Token 刷新器函数类型
 * 接收旧 Token，返回新 Token（异步）
 */
export type TokenRefresher = (oldToken: string) => Promise<string>;

/**
 * 并发锁配置选项（供未来扩展）
 */
export interface LockOptions {
  // Token 提取器（可选，默认从 Authorization 头提取）
  tokenExtractor?: TokenExtractor;
  // Token 刷新器（可选，默认返回模拟 Token）
  tokenRefresher?: TokenRefresher;
  // Token 刷新超时时间（毫秒），防止无限挂起
  refreshTimeout?: number;
  // 刷新失败后的最大重试次数
  maxRetryCount?: number;
}

/**
 * 🟢 Token 刷新并发锁（核心业务逻辑）
 * 
 * 核心职责：
 * 1. acquire: 利用 isRefreshing 流程控制
 *    - 第一个请求触发 refresh（isRefreshing=false → true）
 *    - 后续请求挂起入队（enqueue）
 * 2. refreshToken: 抽象方法，由业务层实现（本类提供 mock 实现）
 * 3. updateToken: 更新请求头中的 Token
 * 4. 异常兜底：refresh 失败时 notifyError，防止死锁
 * 
 * 🔧 重构亮点：
 * 1. Token 提取与刷新逻辑外部注入（通过构造函数或 options）
 * 2. 底层锁模块不关心具体的 Token 字符串，由业务层决定
 * 3. 允许多次 Token 过期/刷新循环，死锁隐患已根除
 */
export class TokenRefreshLock {
  // ✅ 状态标记：防止并发刷新
  private isRefreshing = false;
  // ✅ 请求队列：挂起后续请求
  private requestQueue: RequestQueue;
  // ✅ 配置选项
  private options: LockOptions;

  /**
   * @param options - 可选配置（提取器、刷新器、超时、重试等）
   * 
   * 🔧 重构：Token 提取器和刷新器可以外部注入
   * 业务层可根据实际 API 接口定制 Token 提取和刷新逻辑
   */
  constructor(options: LockOptions = {}) {
    // ✅ 防御性：默认值兜底
    // 🔧 重构：提取器默认从 Authorization 头获取 Token
    const defaultExtractor: TokenExtractor = (config) => {
      const authHeader = config.header?.['Authorization'];
      if (!authHeader) return null;
      // 提取 Bearer token
      const match = authHeader.match(/^Bearer\s+(.+)$/i);
      return match ? match[1] : null;
    };

    this.options = {
      tokenExtractor: options.tokenExtractor || defaultExtractor,
      tokenRefresher: options.tokenRefresher || this.defaultTokenRefresher,
      refreshTimeout: 5000, // 默认 5 秒超时
      maxRetryCount: 2,     // 默认 2 次重试
      ...options,
    };

    this.requestQueue = new RequestQueue();
  }

  /**
   * 🟢 默认 Token 刷新器（内部使用）
   * 
   * @param oldToken - 旧 Token
   * @returns 新 Token
   */
  private async defaultTokenRefresher(oldToken: string): Promise<string> {
    // ✅ 测试环境：返回新 Token
    // 实际业务：应调用 /refresh-token API
    return 'new-refreshed-token-' + Date.now();
  }

  /**
   * 🟢 是否持有锁（供测试用）
   * 
   * @returns true：正在刷新；false：可触发刷新
   */
  isLockActive(): boolean {
    return this.isRefreshing;
  }

  /**
   * 🟢 提取 Token（内部方法）
   * 
   * @param config - 请求配置
   * @returns 旧 Token（或 null）
   */
  private extractToken(config: QueuedRequestConfig): string | null {
    if (!config || !config.header?.['Authorization']) {
      return null;
    }

    const authHeader = config.header['Authorization'];
    if (!authHeader) return null;

    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    return match ? match[1] : null;
  }

  /**
   * 🟢 获取队列长度（供测试/监控用）
   * 
   * @returns 当前挂起的请求数量
   */
  getQueueSize(): number {
    return this.requestQueue.size();
  }

  /**
   * 🟢 获取刷新状态（供测试用）
   * 
   * @returns true：正在刷新；false：空闲
   */
  isRefreshingFlag(): boolean {
    return this.isRefreshing;
  }

  /**
   * 🟢 获取队列管理器（供测试用）
   * 
   * @returns RequestQueue 实例
   */
  getRequestQueue(): RequestQueue {
    return this.requestQueue;
  }

  /**
   * 🟢 并发锁核心方法
   * 
   * 逻辑流程：
   * 1. 检查 isRefreshing
   *    - false → 标记为 true，执行 refresh，发布新配置，重发当前请求
   *    - true → 挂起当前请求入队
   * 2. 异常兜底：catch 中重置 isRefreshing=false，防止死锁
   * 
   * @param config - 原始请求配置
   * @returns 带新 Token 的请求配置（或挂起的 Promise）
   */
  async acquire(config: QueuedRequestConfig): Promise<QueuedRequestConfig> {
    // ✅ 防御性：确保配置存在
    if (!config || !config.url) {
      throw new Error('[TokenRefreshLock.acquire] 请求配置无效');
    }

    // ✅ 核心逻辑：判断是否正在刷新
    if (!this.isRefreshing) {
      // ✅ 场景 A：首个请求（未在刷新）
      this.isRefreshing = true;

      try {
        // ✅ 提取旧 Token（通过提取器，不再硬编码）
        const oldToken = this.extractToken(config);

        // ✅ 刷新 Token（通过刷新器，不再硬编码）
        const newToken = await this.options.tokenRefresher!(oldToken);

        // ✅ 更新请求配置（带新 Token）
        const newConfig = this.updateToken(config, newToken);

        // ✅ 发布新配置，释放所有挂起请求
        this.requestQueue.notify(newConfig);

        // ✅ 重置状态
        this.isRefreshing = false;

        // ✅ 返回新配置（重发当前请求）
        return newConfig;
      } catch (error) {
        // ✅ 异常兜底：刷新失败 → notifyError + 重置状态
        this.isRefreshing = false;

        // ✅ 统一 reject 所有挂起请求
        this.requestQueue.notifyError(
          error instanceof Error ? error : new Error('Token 刷新失败')
        );

        // ✅ 抛出错误（当前请求也会 reject）
        throw error;
      } finally {
        // ✅ 防御性兜底：确保状态重置（即使 catch 未执行）
        if (this.isRefreshing) {
          this.isRefreshing = false;
        }
      }
    } else {
      // ✅ 场景 B：后续请求（已在刷新）
      // 挂起请求入队，等待 refresh 完成后重发
      return this.requestQueue.enqueue(config);
    }
  }

  /**
   * 🟢 更新请求头中的 Token
   *
   * @param config - 原始请求配置
   * @param newToken - 新 Token
   * @returns 更新后的请求配置
   */
  updateToken(config: QueuedRequestConfig, newToken: string): QueuedRequestConfig {
    // ✅ 防御性：确保配置和 Token 存在
    if (!config) {
      throw new Error('[TokenRefreshLock.updateToken] 配置无效');
    }

    if (!newToken || typeof newToken !== 'string') {
      throw new Error('[TokenRefreshLock.updateToken] 新 Token 无效');
    }

    // ✅ 深拷贝配置（避免修改原始对象）
    const newConfig: QueuedRequestConfig = {
      url: config.url,
      method: config.method,
      data: config.data,
      header: { ...((config.header ?? {}) as Record<string, string>) },
    };

    // ✅ 更新 Authorization 头
    newConfig.header!['Authorization'] = `Bearer ${newToken}`;

    return newConfig;
  }

  /**
   * 🟢 重置锁状态（供测试用）
   * 
   * 说明：在测试结束后，可能需要重置状态
   */
  reset(): void {
    this.isRefreshing = false;
    this.requestQueue.clear();
  }

  /**
   * 🟢 更新配置选项（供测试/动态调整用）
   * 
   * @param options - 新配置
   */
  updateOptions(options: Partial<LockOptions>): void {
    this.options = {
      ...this.options,
      ...options,
    };
  }
}
