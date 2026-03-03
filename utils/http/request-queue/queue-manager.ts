// 🟢 绿灯阶段（Green）：正式实现发布订阅模式的请求队列
// 安全、类型安全、零 any

/**
 * 请求队列配置类型
 * ✅ 定义了挂起请求的结构
 */
export interface QueuedRequestConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: unknown;
  header?: Record<string, string>;
}

/**
 * 挂起的请求项
 * ✅ 包含 resolve/reject 闭包 + 原始配置
 */
export interface QueuedRequest {
  resolve: (config: QueuedRequestConfig) => void;
  reject: (error: Error) => void;
  config: QueuedRequestConfig;
}

/**
 * 🟢 绿灯阶段：发布订阅模式的请求队列
 * 
 * 核心职责：
 * 1. enqueue: 挂起请求，返回 Promise
 * 2. notify: 成功时发布新配置，重发所有挂起请求
 * 3. notifyError: 失败时统一 reject 所有挂起请求
 * 4. size: 返回队列长度（供调试/监控）
 */
export class RequestQueue {
  // ✅ 安全定义：明确队列类型
  // 🔧 重构：移除 hasNotified，利用 queue.length 自身特性保证队列消费安全性
  // 理由：队列为空时自然会退出 while 循环，无需额外标志位
  // 优势：允许多次 Token 过期刷新循环，避免死锁隐患
  private queue: QueuedRequest[] = [];

  /**
   * 🟢 挂起请求
   * 
   * @param config - 原始请求配置
   * @returns 一个被挂起的 Promise，等待 notify 释放
   */
  enqueue(config: QueuedRequestConfig): Promise<QueuedRequestConfig> {
    // ✅ 防御性：确保 config 存在
    if (!config || !config.url) {
      return Promise.reject(new Error('[RequestQueue.enqueue] 配置无效'));
    }

    // ✅ 返回挂起的 Promise（不会立即 resolve）
    return new Promise<QueuedRequestConfig>((resolve, reject) => {
      this.queue.push({ resolve, reject, config });
    });
  }

  /**
   * 🟢 通知所有挂起请求（成功场景）
   * 
   * 说明：当 Token 刷新成功后，调用此方法发布新配置
   * 然后所有挂起的请求会收到新的 config（带新 Token）并重发
   * 
   * 🔧 重构：不再使用 hasNotified 标志，利用 while 循环自身特性
   * 循环结束后 queue.length 为 0，自然可以接受下一轮 notify
   * 
   * @param newConfig - 带新 Token 的请求配置
   */
  notify(newConfig: QueuedRequestConfig): void {
    // ✅ 防御性：确保新配置存在
    if (!newConfig || !newConfig.url) {
      throw new Error('[RequestQueue.notify] 新配置无效');
    }

    // ✅ 发布订阅模式：遍历队列，释放所有挂起请求
    // 🔧 重构：while (this.queue.length > 0) 自身保证只执行一次
    // 循环结束后队列为空，下一轮 notify 可正常工作（允许多次刷新循环）
    while (this.queue.length > 0) {
      // ✅ 取出队首请求（! 断言非 null）
      const { resolve, reject, config } = this.queue.shift()!

      try {
        // ✅ 分发新配置（带新 Token）
        resolve(newConfig);
      } catch (error) {
        // ✅ 异常兜底：如果 resolve 出错，reject 原始请求
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }

  /**
   * 🟢 通知所有挂起请求（失败场景）
   * 
   * 说明：当 Token 刷新失败后，调用此方法统一 reject 所有挂起请求
   * 防止请求无限期挂起（内存泄漏）
   * 
   * 🔧 重构：不再使用 hasNotified 标志，利用 while 循环自身特性
   * 
   * @param error - 刷新失败的错误对象
   */
  notifyError(error: Error): void {
    // ✅ 防御性：确保错误对象存在
    if (!error) {
      throw new Error('[RequestQueue.notifyError] 错误对象无效');
    }

    // ✅ 发布订阅模式：遍历队列，reject 所有挂起请求
    // 🔧 重构：while (this.queue.length > 0) 自身保证只执行一次
    while (this.queue.length > 0) {
      const { reject } = this.queue.shift()!;

      try {
        // ✅ 统一 reject
        reject(error);
      } catch (innerError) {
        // ✅ 异常兜底：如果 reject 出错，记录日志（生产环境可替换为日志上报）
        console.error('[RequestQueue.notifyError] reject 时出错', innerError);
      }
    }
  }

  /**
   * 🟢 获取队列长度
   * 
   * @returns 当前挂起的请求数量
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * 🟢 清空队列（重置状态）
   * 
   * 说明：在测试或特殊场景下，可能需要重置队列
   * 
   * 🔧 重构：移除 hasNotified 相关逻辑
   */
  clear(): void {
    this.queue = [];
  }
}
