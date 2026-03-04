/*
 *   Copyright (c) 2024 妙码学院 @Heyi
 *   All rights reserved.
 *   妙码学院官方出品，作者 @Heyi，供学员学习使用，可用作练习，可用作美化简历，不可开源。
 */

import { Transport } from '@miaoma/monitor-sdk-core'

export interface UniappErrorPayload {
  type: 'javascript' | 'network' | 'component' | 'api'
  message: string
  stack: string
  path: string
  timestamp: number
  meta?: {
    appId?: string
    appVersion?: string
    platform?: string
    deviceModel?: string
    system?: string
    browserVersion?: string
    networkType?: string
    memoryUsage?: number
  }
}

/**
 * uni-app 错误监控
 * 捕获 JavaScript 错误、网络错误、组件错误、API 错误
 */
export class Errors {
  constructor(private transport: Transport) {}

  init() {
    // 1. JavaScript 运行时错误
    uni.onGlobalErrorHandler((errorMessage, scriptId, line, column, error) => {
      this.transport.send({
        event_type: 'error',
        type: 'javascript',
        message: errorMessage,
        stack: error?.stack || this.formatStack(errorMessage, scriptId, line, column),
        path: this.getCurrentPagePath(),
        timestamp: Date.now(),
        meta: this.getSystemInfo(),
      })
    })

    // 2. Promise 未捕获错误
    uni.onUnhandledRejection((reject) => {
      this.transport.send({
        event_type: 'error',
        type: 'javascript',
        message: reject?.reason?.message || 'Unhandled Promise Rejection',
        stack: reject?.reason?.stack || 'No stack trace',
        path: this.getCurrentPagePath(),
        timestamp: Date.now(),
        meta: this.getSystemInfo(),
      })
    })

    // 3. 网络错误（通过拦截器捕获，在 client.ts 中调用）
    // 4. API 调用错误
    this.patchUniRequest()
    
    // 5. 组件错误（在页面/组件中调用）
  }

  /**
   * 格式化错误堆栈
   */
  private formatStack(message: string, scriptId?: string, line?: number, column?: number): string {
    let stack = `Error: ${message}\n`
    if (scriptId) stack += `Script ID: ${scriptId}\n`
    if (line) stack += `Line: ${line}\n`
    if (column) stack += `Column: ${column}\n`
    return stack
  }

  /**
   * 获取当前页面路径
   */
  private getCurrentPagePath(): string {
    const pages = uni.getCurrentPages()
    if (pages.length > 0) {
      return pages[pages.length - 1].$page.fullPath
    }
    return '/'
  }

  /**
   * 获取系统信息（添加到错误上下文）
   */
  private getSystemInfo(): UniappErrorPayload['meta'] {
    try {
      const systemInfo = uni.getSystemInfoSync()
      const memoryInfo = uni.getMemoryWarningSync?.() || {}

      return {
        appId: systemInfo.appId || '__UNI__0A8B765',
        appVersion: '1.0.0', // 可从 package.json 读取
        platform: systemInfo.platform,
        deviceModel: systemInfo.model,
        system: systemInfo.system,
        browserVersion: systemInfo.version,
        networkType: systemInfo.networkType,
        memoryUsage: (memoryInfo as any).level || 0,
      }
    } catch {
      return {}
    }
  }

  /**
   * 拦截 uni.request，捕获网络错误
   */
  private patchUniRequest() {
    const originalRequest = uni.request

    uni.request = (options) => {
      const startTime = Date.now()

      const originalSuccess = options.success
      const originalFail = options.fail

      options.success = (res) => {
        if (res.statusCode >= 500) {
          // 上报 5xx 错误
          this.transport.send({
            event_type: 'error',
            type: 'network',
            message: `HTTP ${res.statusCode} Server Error`,
            stack: `URL: ${options.url}\nMethod: ${options.method || 'GET'}`,
            path: this.getCurrentPagePath(),
            timestamp: Date.now(),
            meta: {
              url: options.url,
              method: options.method || 'GET',
              statusCode: res.statusCode,
              responseTime: Date.now() - startTime,
              ...this.getSystemInfo(),
            },
          })
        }

        if (originalSuccess) {
          originalSuccess(res)
        }
      }

      options.fail = (err) => {
        // 上报请求失败
        this.transport.send({
          event_type: 'error',
          type: 'api',
          message: err.errMsg || 'Request failed',
          stack: `URL: ${options.url}\nMethod: ${options.method || 'GET'}\n${JSON.stringify(err)}`,
          path: this.getCurrentPagePath(),
          timestamp: Date.now(),
          meta: {
            url: options.url,
            method: options.method || 'GET',
            responseTime: Date.now() - startTime,
            ...this.getSystemInfo(),
          },
        })

        if (originalFail) {
          originalFail(err)
        }
      }

      return originalRequest(options)
    }
  }
}
